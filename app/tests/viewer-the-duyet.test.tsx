// viewer-the-duyet.test.tsx — hồ sơ _acceptance/viewer-khong-thay-the-duyet: vai viewer vào được Ops nhưng không nhận nội
// dung thẻ duyệt hay bài gốc (AGENTS.md luật 6: nội dung tin cho vai ops trở lên). Tên ca mở đầu bằng mã AC (VT-AC-n).
// Ca DB dựng lược đồ tạm `vt_<pid>` (bảng LIKE public.*, dữ liệu viết trước), xoá cuối lượt. Mỗi phép đo có chiều đỏ: một
// bản chép tạm của tệp nguồn (tests/.vt-cu-*) đổi đúng một chỗ, thông điệp ghim.
import { after, before, describe, test } from "node:test"
import assert from "node:assert/strict"
import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import pg from "pg"

import { localDbUrl } from "../../pipeline/scripts/capture-ops-facts.mjs"
import { schemaUrl } from "../../pipeline/scripts/ops-facts-fixture.mjs"

const S = `vt_${process.pid}`
process.env.DATABASE_URL = schemaUrl(S) // pool của app đọc lúc import — đặt TRƯỚC mọi import động
process.env.OPS_EMAILS = "vt-ops@local.test"

const APP = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
type User = import("../src/lib/auth").User
const NGUOI = {
  user: { id: "1", email: "vt-user@local.test", plan: "free", role: "user" },
  viewer: { id: "2", email: "vt-viewer@local.test", plan: "free", role: "viewer" },
  ops: { id: "3", email: "vt-o@local.test", plan: "free", role: "ops" },
  admin: { id: "4", email: "vt-admin@local.test", plan: "free", role: "admin" },
  owner: { id: "5", email: "vt-owner@local.test", plan: "free", role: "owner" },
  opsEmail: { id: "6", email: "vt-ops@local.test", plan: "free", role: "user" },
} satisfies Record<string, User>
type Kieu = keyof typeof NGUOI

// ---------- bản chép tạm (đối chứng dương) ----------
const CHEP: string[] = []
/** Chép một tệp nguồn của app thành tests/.vt-cu-<pid>-<n>.<ext>, đổi đúng một chỗ, đổi mọi import tương đối sang tuyệt đối. */
async function banChepTam<T>(rel: string, doi: (s: string) => string): Promise<T> {
  const goc = readFileSync(path.join(APP, rel), "utf8")
  const sau = doi(goc)
  assert.notEqual(sau, goc, `đột biến của ${rel} không đổi gì — đối chứng vô nghĩa`)
  const dir = path.dirname(path.join(APP, rel))
  const tuyet = sau.replace(/(from\s+|import\()"(\.{1,2}\/[^"]+)"/g, (_m, a, p) => `${a}"${path.join(dir, p)}"`)
  const f = path.join(APP, "tests", `.vt-cu-${process.pid}-${CHEP.length}${path.extname(rel)}`)
  writeFileSync(f, tuyet)
  CHEP.push(f)
  return (await import(f)) as T
}

// ---------- lược đồ tạm ----------
const TABLES = ["review_queue", "stg_zalo_posts", "sale_offers", "property_offers", "stg_chotot_ads", "stg_abnb_listings", "listings", "areas", "enrichment_proposals", "source_registry"]
const admin = new pg.Client({ connectionString: localDbUrl() })
let setupErr: string | null = null
const vn = (s: string) => new Date(`${s}+07:00`).toISOString()

// Thẻ thứ n mang chuỗi nhận diện riêng trong cả bốn cột nội dung.
// [id, item_type, status]
const THE: [number, string, string][] = [
  [1, "entity_match", "pending"],
  [2, "entity_match", "pending"],
  [3, "data_quality", "pending"],
  [4, "entity_match", "approved"],
]
async function napThe(schema: string) {
  for (const [id, type, status] of THE)
    await admin.query(
      `INSERT INTO "${schema}".review_queue (id, item_type, item_id, title, evidence, ai_suggestion, ai_reasoning, status, created_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8, now() - ($1 || ' minutes')::interval)`,
      [id, type, `vt:${id}`, `vt-mat-${id}-title`, JSON.stringify({ note: `vt-mat-${id}-evidence` }), `vt-mat-${id}-ai_suggestion`, `vt-mat-${id}-ai_reasoning`, status],
    )
}

// Bài gốc S05 (agent apify-facebook) gộp vào tin; S06 không có bài.
const IN = "2026-10-24T09:00:00"
async function napDongChay(schema: string) {
  for (const [id, n] of [["vb1", 1], ["vb2", 2]] as const)
    await admin.query(
      `INSERT INTO "${schema}".stg_zalo_posts (post_id, snapshot_id, agent_id, group_name, text, posted_at, captured_at)
       VALUES ($1,'hanoi__apify-facebook__x','apify-facebook','nhóm vt',$2,$3,$3)`,
      [id, `vt-bai-${n}`, vn(IN)],
    )
  for (const [id, source, posts] of [["vo1", "S05", ["vb1"]], ["vo2", "S05", ["vb2"]], ["vc1", "S06", []]] as const)
    await admin.query(
      `INSERT INTO "${schema}".sale_offers (offer_id, source, kind, property_type, price_vnd, area_m2, first_seen, last_seen, post_ids, confidence, n_reposts)
       VALUES ($1,$2,'rent_lt','apartment',9000000,40,$3,$3,$4,'medium',1)`,
      [id, source, vn(IN), posts],
    )
}

async function dungLuocDo(schema: string, tables: string[]) {
  await admin.query(`DROP SCHEMA IF EXISTS "${schema}" CASCADE`)
  await admin.query(`CREATE SCHEMA "${schema}"`)
  for (const t of tables) await admin.query(`CREATE TABLE "${schema}".${t} (LIKE public.${t} INCLUDING DEFAULTS)`)
}

before(async () => {
  try {
    await admin.connect()
    await dungLuocDo(S, TABLES)
    await napThe(S)
    await napDongChay(S)
  } catch (e) {
    setupErr = (e as Error).message
  }
})
after(async () => {
  for (const f of CHEP) rmSync(f, { force: true })
  await admin.query(`DROP SCHEMA IF EXISTS "${S}" CASCADE`).catch(() => {})
  await admin.end().catch(() => {})
  const { pool } = await import("../src/lib/db")
  await pool.end().catch(() => {})
})
const ready = () => assert.equal(setupErr, null, `dựng lược đồ tạm không được — eval đòi chạy thật: ${setupErr}`)

// ---------- AC-1: luật xem nội dung ----------
describe("VT-AC-1 luật xem nội dung", () => {
  const BANG: [Kieu, boolean][] = [
    ["user", false],
    ["viewer", false],
    ["ops", true],
    ["admin", true],
    ["owner", true],
    ["opsEmail", true],
  ]
  type Luat = { xemNoiDungTin: (u: User | null | undefined) => boolean }
  const doBang = (l: Luat) => {
    for (const [k, mong] of BANG) assert.equal(l.xemNoiDungTin(NGUOI[k]), mong, `dòng '${k}'`)
  }
  test("VT-AC-1 bảng sáu kiểu người", async () => {
    const luat = (await import("../src/lib/ops-access")) as Luat
    doBang(luat)
    assert.equal(luat.xemNoiDungTin(null), false, "khách")
    assert.equal(luat.xemNoiDungTin({ ...NGUOI.viewer, email: "vt-ops@local.test" }), true, "viewer có email OPS_EMAILS tính như ops")
    const sai = await banChepTam<Luat>("src/lib/ops-access.ts", (s) => s.replace(/(xemNoiDungTin[\s\S]*?)BAC_VAI\.ops/, "$1BAC_VAI.viewer"))
    assert.throws(() => doBang(sai), /dòng 'viewer'/, "đối chứng ngưỡng hạ về viewer phải đỏ ở dòng viewer")
  })
})

void ready
void mkdirSync
