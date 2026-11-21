// che-ten-cho-doc-app.test.tsx — AC-4 che-ten-nguon-khong-lay-tu-dau: hai chỗ đọc phía app chạy mã thật trên DB thử.
// offers-public: giá trị người bán mang định danh nguồn về NULL; collections-queries: dòng log cuối của job được che.
// Nguồn giả S90, tên giả cùng hình dạng. Chỉ chạy trên DB thử, trong BEGIN…ROLLBACK, pool của app trỏ vào client giao dịch.
process.env.TZ = "Asia/Ho_Chi_Minh"
delete process.env.VERCEL // nhánh local của readSchedulerStatus

import assert from "node:assert/strict"
import { spawnSync } from "node:child_process"
import { mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { after, test } from "node:test"
import pg from "pg"

import { readSchedulerStatus } from "../src/lib/collections-queries"
import { pool } from "../src/lib/db"
import { parseOfferFilters } from "../src/lib/offers-filters"
import { getPublicOffers } from "../src/lib/offers-public"

const DB_URL = process.env.DATABASE_URL ?? ""
const skip = /\/oneinvest_[a-z0-9_]+$/.test(DB_URL) ? false : "cần DATABASE_URL trỏ DB thử"
const MIG = (f: string) => readFileSync(join(import.meta.dirname, "../../db/migrations", f), "utf8")
const TAG = `cten_${process.pid}`
const TEN = "Lumora Thịnh", MIEN = "market.lumorathinh.vn", DU_AN = "Lumora Park"
const THI_TRUONG = "vn-hanoi"

after(() => pool.end())

async function voiGiaoDich<T>(co: boolean, fn: (c: pg.Client) => Promise<T>): Promise<T> {
  const c = new pg.Client({ connectionString: DB_URL })
  await c.connect()
  const goc = pool.query
  try {
    await c.query("BEGIN")
    await c.query(MIG("112_source_registry_match_whole.sql"))
    await c.query("UPDATE source_registry SET match_whole = false")
    await c.query(`INSERT INTO source_registry (code, label_vi, real_name, source_ids, match_whole, status)
                   VALUES ('S90', 'nguồn giả của test', $1, $2, $3, 'retired')
                   ON CONFLICT (code) DO UPDATE SET real_name = $1, source_ids = $2, match_whole = $3`, [TEN, [MIEN], co])
    ;(pool as unknown as { query: unknown }).query = c.query.bind(c)
    return await fn(c)
  } finally {
    ;(pool as unknown as { query: unknown }).query = goc
    await c.query("ROLLBACK").catch(() => {})
    await c.end()
  }
}

async function gieoTin(c: pg.Client, duoi: string, nguoiBan: string) {
  const id = `${TAG}_${duoi}`, post = `${TAG}_p_${duoi}`
  await c.query(
    `INSERT INTO sale_offer_records (offer_id, originating_system_key, source, kind, price_vnd, area_m2, price_perm2, confidence, first_seen, last_seen, n_reposts, post_ids, area_id, seller_name)
     VALUES ($1, $2, 'S03', 'sale', 3e9, 60, 5e7, 'medium', now(), now(), 1, $3, $4, $5)`, [id, post, [post], THI_TRUONG, nguoiBan])
  await c.query(`INSERT INTO ops_audit (actor, action, detail) VALUES ('test:app', 'phat-bieu:cat-chuyen', '{}'::jsonb)`)
  await c.query(`INSERT INTO field_assertions (subject_key, field, value, evidence_tier, method, method_version, rule_id, observed_at)
                 VALUES ($1, 'property_type', 'apartment', 'fact', 'source_field', 'test-cten', NULL, now())`, [`S03:${post}`])
  await c.query("SELECT resolve_offer_fields($1)", [[id]])
  return id
}

const nguoiBanCua = async (c: pg.Client, ten: string) => {
  const id = await gieoTin(c, ten.replace(/\W+/g, "").slice(0, 12).toLowerCase(), ten)
  await c.query(`CREATE OR REPLACE TEMP VIEW sale_offers AS SELECT * FROM public.sale_offers WHERE offer_id = '${id}'`)
  const { rows } = await getPublicOffers(THI_TRUONG, parseOfferFilters(new URLSearchParams("kind=sale&limit=5")))
  assert.equal(rows.length, 1, `tin thử phải hiện trên đường đọc công khai — ${rows.length}`)
  return rows[0].sellerName
}

test("AC-4 offers-public khai cờ: người bán mang tên miền hay cụm tên về NULL, tên mang thương hiệu giữ nguyên", { skip, timeout: 120_000 }, () => voiGiaoDich(true, async (c) => {
  assert.equal(await nguoiBanCua(c, MIEN), null, "AC-4 offers-public để lọt tên miền nguồn")
  assert.equal(await nguoiBanCua(c, `${TEN} Group`), null, "AC-4 offers-public để lọt cụm tên nguồn")
  assert.equal(await nguoiBanCua(c, "lumora-thinh"), null, "AC-4 offers-public để lọt cụm tên viết dấu nối")
  assert.equal(await nguoiBanCua(c, DU_AN), DU_AN, "AC-4 offers-public che nhầm tên mang thương hiệu")
}))

test("AC-4 offers-public đối chứng cờ false: tên mang thương hiệu bị che như cũ", { skip, timeout: 120_000 }, () => voiGiaoDich(false, async (c) => {
  assert.equal(await nguoiBanCua(c, DU_AN), null, "đối chứng: không khai cờ thì thương hiệu bị che")
}))

/** Cây git tạm có log job; readSchedulerStatus đọc log ở checkout chính của cây đang đứng. */
async function dongLogCuoi(dong: string): Promise<string | null> {
  const goc = process.cwd()
  const dir = realpathSync(mkdtempSync(join(tmpdir(), "cten-log-")))
  try {
    assert.equal(spawnSync("git", ["init", "-q", dir]).status, 0)
    mkdirSync(join(dir, "pipeline/logs"), { recursive: true })
    writeFileSync(join(dir, "pipeline/logs/airdna-daily.log"), `bắt đầu\n${dong}\n`)
    process.chdir(dir)
    const job = (await readSchedulerStatus()).find((j) => j.lastLine?.includes("job-cten"))
    return job?.lastLine ?? null
  } finally {
    process.chdir(goc)
    rmSync(dir, { recursive: true, force: true })
  }
}

test("AC-4 collections-queries khai cờ: dòng log che cụm tên và tên miền, giữ tên mang thương hiệu", { skip, timeout: 120_000 }, () => voiGiaoDich(true, async () => {
  assert.equal(await dongLogCuoi(`job-cten lỗi ${TEN}`), "job-cten lỗi S90", "AC-4 collections-queries để lọt cụm tên")
  assert.equal(await dongLogCuoi(`job-cten tải ${MIEN}`), "job-cten tải S90", "AC-4 collections-queries để lọt tên miền")
  assert.equal(await dongLogCuoi(`job-cten ${DU_AN} xong`), `job-cten ${DU_AN} xong`, "AC-4 collections-queries che nhầm tên mang thương hiệu")
}))

test("AC-4 collections-queries đối chứng cờ false: thương hiệu bị che như cũ", { skip, timeout: 120_000 }, () => voiGiaoDich(false, async () => {
  assert.equal(await dongLogCuoi(`job-cten ${DU_AN} xong`), "job-cten S90 Park xong", "đối chứng: không khai cờ thì thương hiệu bị che")
}))
