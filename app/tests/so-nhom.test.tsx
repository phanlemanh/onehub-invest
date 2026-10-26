// so-nhom.test.tsx — hồ sơ _acceptance/so-nhom-mot-noi (PL12), ca «SN-*» phía app trên MỘT lược đồ tạm ở khuôn sau gộp
// (khuôn trước 047 + 047 + 048, pool của app gắn search_path lúc import). Gọi hàm và route thật; public không được chạm
// (chụp trước/sau).
import { after, before, test } from "node:test"
import assert from "node:assert/strict"
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import pg from "pg"

import { localDbUrl } from "../../pipeline/scripts/capture-ops-facts.mjs"
import { schemaUrl } from "../../pipeline/scripts/ops-facts-fixture.mjs"
import { DAU_SN, dungSauGop } from "../../pipeline/scripts/so-nhom-fixture.mjs"
import { chupPublic, xoaLuocDo } from "../../pipeline/scripts/vong-doi-fixture.mjs"

// HOME giả cho CẢ tiến trình, đặt TRƯỚC mọi import động: zalo-admin.ts tính đường tệp cấu hình gateway theo HOME lúc
// import — ca SN-AC-5b gọi hàm ghi thật của app trên tệp tạm, không bao giờ trên ~/.openclaw (luật 8, zalo-safety).
const HOME_GIA = mkdtempSync(join(tmpdir(), "sn-home-"))
process.env.HOME = HOME_GIA
const S = `sn_app_${process.pid}`
const TOKEN = "sn-thu-token"
process.env.DATABASE_URL = schemaUrl(S) // pool của app đọc lúc import — đặt TRƯỚC mọi import động
process.env.OPS_API_TOKEN = TOKEN

const ADMIN = { id: "42", email: "admin@local.test", plan: "free" as const, role: "admin" as const }
const admin = new pg.Client({ connectionString: localDbUrl() })
const sc = new pg.Client({ connectionString: schemaUrl(S) })
let publicTruoc: unknown

const K = (code: string) => `${DAU_SN}-${code}`
before(async () => {
  await admin.connect()
  publicTruoc = await chupPublic(admin)
  await dungSauGop(admin, S, { thamChieu: true })
  for (const t of ["ops_audit", "stg_zalo_posts"]) await admin.query(`CREATE TABLE "${S}".${t} (LIKE public.${t} INCLUDING ALL)`)
  await sc.connect()
  // Một đơn vị mỗi nguồn; S03 ở mode bùng để set-mode có việc để từ chối.
  for (const [code, params] of [["S02", {}], ["S03", { mode: "bung", burst_until: "2026-10-30" }], ["S05", {}], ["S06", {}]] as const) {
    await sc.query(`INSERT INTO source_groups (source_code, group_key, name, params) VALUES ($1, $2, $3, $4::jsonb)`,
      [code, K(code), `${DAU_SN} đơn vị ${code}`, JSON.stringify(params)])
  }
})
after(async () => {
  await sc.end().catch(() => {})
  const { pool } = await import("../src/lib/db")
  await new Promise((r) => setTimeout(r, 200)) // auditOpsWrite ghi nền
  await pool.end().catch(() => {})
  await xoaLuocDo(admin, S).catch(() => {})
  rmSync(HOME_GIA, { recursive: true, force: true })
  const publicSau = await chupPublic(admin)
  await admin.end().catch(() => {})
  assert.deepEqual(publicSau, publicTruoc, "public đã bị chạm")
})

async function goi(body: Record<string, unknown>) {
  const { POST } = await import("../src/app/api/v1/ops/source-groups/route")
  const res = await POST(
    new Request("http://localhost/api/v1/ops/source-groups", {
      method: "POST",
      headers: { authorization: `Bearer ${TOKEN}`, "content-type": "application/json" },
      body: JSON.stringify(body),
    }),
  )
  await new Promise((r) => setTimeout(r, 100))
  return { status: res.status, body: (await res.json()) as Record<string, unknown> }
}
const anhSo = async () => (await sc.query(`SELECT * FROM collection_units ORDER BY id`)).rows
const nAudit = async () => (await sc.query(`SELECT count(*)::int AS n FROM ops_audit`)).rows[0].n as number

test("SN-AC-2-route trang nhóm thu cũ chỉ quản S05/S06: docNhomThu lọc, mã khác → 400 không ghi gì", async () => {
  const { docNhomThu, datCheDo, LOI_NGOAI_NHOM } = await import("../src/lib/che-do-thu")
  assert.deepEqual((await docNhomThu()).map((r) => r.source_code), ["S05", "S06"])

  const truoc = await anhSo()
  const audit = await nAudit()
  for (const code of ["S03", "S02"]) {
    for (const body of [
      { action: "toggle", sourceCode: code, groupKey: K(code), enabled: false },
      { action: "add", sourceCode: code, groupKey: `${K(code)}-moi`, name: "mới" },
      { action: "delete", sourceCode: code, groupKey: K(code) },
    ]) {
      const r = await goi(body)
      assert.deepEqual(r, { status: 400, body: { error: LOI_NGOAI_NHOM } }, `${body.action} ${code}`)
    }
  }
  const idS03 = (await sc.query(`SELECT id FROM collection_units WHERE source_code = 'S03'`)).rows[0].id
  const r = await datCheDo({ id: Number(idS03), mode: "duy_tri" }, async () => ADMIN)
  assert.deepEqual(r, { status: 400, body: { error: LOI_NGOAI_NHOM } })
  assert.deepEqual(await anhSo(), truoc)
  assert.equal(await nAudit(), audit)

  // Đối chứng: cùng thân với S05 thì route ghi được.
  const ok = await goi({ action: "toggle", sourceCode: "S05", groupKey: K("S05"), enabled: false })
  assert.equal(ok.status, 200)
})

test("SN-AC-5b bản .mjs đọc nhóm gateway (readS03Groups) khớp effectiveEnabledGroups của app trên mọi fixture", async () => {
  const { effectiveEnabledGroups, setZaloGroupEnabled } = await import("../src/lib/zalo-admin")
  const { readS03Groups } = await import("../../scripts/lib/ops-local.mjs")
  const on = { enabled: true, requireMention: true }
  const off = { enabled: false }
  const FIXTURE: Record<string, unknown> = {
    "groups cấp kênh": { groups: { "vd-a": on, "vd-b": off } },
    "groups cấp tài khoản": { accounts: { default: { groups: { "vd-a": on } }, x: { groups: { "vd-c": on, "vd-d": { allow: false, requireMention: true } } } } },
    "ghi đè theo tài khoản": { groups: { "vd-a": on, "vd-b": on }, accounts: { default: { groups: { "vd-a": on } }, y: { profile: "y" } } },
    "nhóm enabled false": { accounts: { default: { groups: { "group:vd-e": off, "vd-f": on } } } },
    "tài khoản không groups": { accounts: { z: { profile: "z" } } },
  }
  // Fixture thứ sáu sinh bằng hàm ghi THẬT của app trên tệp cấu hình tạm (HOME giả), không viết tay.
  mkdirSync(join(HOME_GIA, ".openclaw"), { recursive: true })
  const f = join(HOME_GIA, ".openclaw", "openclaw.json")
  writeFileSync(f, JSON.stringify({ channels: { zalouser: FIXTURE["groups cấp tài khoản"] } }, null, 2))
  await setZaloGroupEnabled("x", "vd-g", true)
  await setZaloGroupEnabled("default", "vd-a", false)
  FIXTURE["sinh bằng setZaloGroupEnabled"] = JSON.parse(readFileSync(f, "utf8")).channels.zalouser

  const bo = (k: string) => k.replace(/^group:/, "")
  for (const [ten, z] of Object.entries(FIXTURE)) {
    const app = [...new Set(effectiveEnabledGroups(z as never).union.map(bo))].sort()
    const mjs = (readS03Groups(z) as { key: string; enabled: boolean }[]).filter((g) => g.enabled).map((g) => g.key)
    assert.deepEqual(mjs, app, ten)
  }
  assert.deepEqual(
    (readS03Groups(FIXTURE["sinh bằng setZaloGroupEnabled"]) as { key: string; enabled: boolean }[]).map((g) => [g.key, g.enabled]),
    [["vd-a", false], ["vd-c", true], ["vd-d", false], ["vd-g", true]],
  )
})
