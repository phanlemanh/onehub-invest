// ops-nhan-ma-nguon-cloud.test.tsx — ON7 `ops-nhan-ma-nguon` ở chế độ cloud: lược đồ tạm KHÔNG có source_registry (như
// cloud), facts trong ops_heartbeat là ĐÚNG payload mà push-ops-facts.mjs thật vừa đẩy (vòng kín bên ghi → bên đọc).
// Dựng trang /ops/collections thật, quét phần đọc được của HTML. Tên nhóm S03 (tầng C) và tài khoản thu (NT2) bỏ khỏi
// payload trước khi nạp — hai đường miễn của hợp đồng AC-4. Tên ca mở đầu bằng mã AC.
import { after, before, describe, test } from "node:test"
import assert from "node:assert/strict"
import pg from "pg"

import { captureOpsFacts, localDbUrl } from "../../pipeline/scripts/capture-ops-facts.mjs"
import { findSourceNames, sourceRegistrySeeds } from "../../scripts/lib/tier-a-source-names.mjs"
import { readable } from "./ops-html"

const SCHEMA = `ops_on7_cloud_${process.pid}`
const BASE_URL = process.env.DATABASE_URL ?? localDbUrl()
{
  const u = new URL(BASE_URL)
  u.searchParams.set("options", `-c search_path=${SCHEMA}`)
  process.env.DATABASE_URL = u.toString()
  process.env.VERCEL = "1" // nhánh cloud: đọc facts từ ops_heartbeat
}
// Bảng trang Thu thập đọc trên cloud (cloud-sync đã đồng bộ) — tạo rỗng; source_registry cố ý VẮNG.
const CLOUD_TABLES = ["airbnb_snapshots", "stg_zalo_posts", "airdna_markets", "airdna_listings", "sale_offers", "listings"]

type Seed = { code: string; realName: string }
const ENTRIES = (sourceRegistrySeeds() as Seed[]).map(({ code, realName }) => ({ code, realName }))
const leaks = (h: string) => readable(h).flatMap((t, i) => findSourceNames(t, ENTRIES).map((x: { code: string }) => `${x.code} @mảnh ${i}`))

const admin = new pg.Client({ connectionString: BASE_URL })
let payload: Record<string, unknown> | null = null
let setupErr: string | null = null
async function setFacts(p: Record<string, unknown>) {
  await admin.query(`INSERT INTO "${SCHEMA}".ops_heartbeat (id, payload, pushed_at) VALUES ('primary', $1, now())
    ON CONFLICT (id) DO UPDATE SET payload = EXCLUDED.payload, pushed_at = EXCLUDED.pushed_at`, [p])
  const { resetFactsCache } = await import("../src/lib/collections-queries")
  resetFactsCache()
}
before(async () => {
  try {
    await admin.connect()
    await admin.query(`CREATE SCHEMA "${SCHEMA}"`)
    await admin.query(`CREATE TABLE "${SCHEMA}".ops_heartbeat (id text PRIMARY KEY, payload jsonb NOT NULL, pushed_at timestamptz)`)
    for (const t of CLOUD_TABLES) await admin.query(`CREATE TABLE "${SCHEMA}".${t} (LIKE public.${t} INCLUDING ALL)`).catch(() => {})
    const name = (code: string) => ENTRIES.find((e) => e.code === code)!.realName
    const r = await captureOpsFacts({ logs: { "airdna-daily.log": `2026-10-24T19:06:00 ${name("S02")} rotation xong\n` }, env: { DATABASE_URL: BASE_URL } })
    if (r.code !== 0 || !r.payload) throw new Error(`push-ops-facts thoát ${r.code}: ${r.stderr.slice(0, 300)}`)
    const p: Record<string, unknown> = { ...r.payload, zaloGroups: [], zaloAccounts: [] }
    payload = p
    await setFacts(p)
  } catch (e) {
    setupErr = (e as Error).message
  }
})
after(async () => {
  await admin.query(`DROP SCHEMA IF EXISTS "${SCHEMA}" CASCADE`).catch(() => {})
  await admin.end().catch(() => {})
  const { pool } = await import("../src/lib/db")
  await pool.end()
})
const ready = () => assert.equal(setupErr, null, `dựng lược đồ cloud / chạy push-ops-facts không được — eval đòi chạy thật: ${setupErr}`)

async function html(el: unknown): Promise<string> {
  const React = await import("react")
  Object.assign(globalThis, { React })
  const { renderToStaticMarkup } = await import("react-dom/server")
  return renderToStaticMarkup(el as React.ReactElement)
}

describe("ON7 chế độ cloud", () => {
  test("ON7-AC-2 /ops/collections cloud với payload do push-ops-facts thật đẩy → 0 tên nguồn thật, có «S03 · Cộng đồng»", async () => {
    ready()
    const { rows } = await admin.query(`SELECT count(*)::int n FROM information_schema.tables WHERE table_schema = $1 AND table_name = 'source_registry'`, [SCHEMA])
    assert.equal(rows[0].n, 0, "tiền đề: lược đồ không có source_registry, như cloud")
    const { default: CollectionsPage } = await import("../src/app/ops/collections/page")
    const h = await html(await CollectionsPage())
    assert.ok(h.includes("Thu thập"), "tiền đề: trang dựng được")
    assert.ok(h.includes("S03 · Cộng đồng"), "vai trò phải lấy được từ facts.sourceRuns")
    assert.ok(h.includes("S02 · Hiệu chuẩn — toàn quốc"), "nhãn job lấy từ payload thật")
    assert.ok(h.includes("19:06:00 S02 rotation xong"), "dòng log cuối của job S02 đã che, lấy từ payload thật")
    assert.deepEqual(leaks(h), [], "HTML /ops/collections ở cloud còn tên nguồn thật")
  })
  test("ON7-AC-6 vai trò: (b) cloud không source_registry, facts.sourceRuns lấy từ payload push-ops-facts thật → «S02 · Hiệu chuẩn»", async () => {
    ready()
    assert.ok(Array.isArray(payload!.sourceRuns) && (payload!.sourceRuns as unknown[]).length > 0, "tiền đề: payload thật có sourceRuns")
    const { getSourceRoles } = await import("../src/lib/source-roles")
    const { sourceLabel } = await import("../src/lib/source-labels")
    assert.equal(sourceLabel("S02", await getSourceRoles()), "S02 · Hiệu chuẩn")
  })
  test("ON7-AC-6 vai trò: (c) không nguồn nào → «S02», không lỗi", async () => {
    ready()
    const rest = Object.fromEntries(Object.entries(payload!).filter(([k]) => k !== "sourceRuns"))
    await setFacts(rest)
    try {
      const { getSourceRoles } = await import("../src/lib/source-roles")
      const { sourceLabel } = await import("../src/lib/source-labels")
      const roles = await getSourceRoles()
      assert.deepEqual(roles, {})
      assert.equal(sourceLabel("S02", roles), "S02")
    } finally {
      await setFacts(payload!)
    }
  })
})
