// vong-doi-nguon.test.tsx — hồ sơ _acceptance/vong-doi-nguon (TV2a), ca «VD-AC-6b» rồi «VD-AC-6» trên CÙNG một lược đồ tạm
// (pool của app gắn search_path lúc import): trước 047 route chạy y như hôm nay; chạy 047 rồi route ghi trạng thái vòng đời.
// Gọi POST thật của route source-groups bằng Bearer. public không được chạm (chụp trước/sau).
import { after, before, test } from "node:test"
import assert from "node:assert/strict"
import pg from "pg"

import { localDbUrl } from "../../pipeline/scripts/capture-ops-facts.mjs"
import { schemaUrl } from "../../pipeline/scripts/ops-facts-fixture.mjs"
import { DAU, chay047, chupPublic, dungKhuonTruoc, xoaLuocDo } from "../../pipeline/scripts/vong-doi-fixture.mjs"

const S = `vd_route_${process.pid}`
const TOKEN = "vd-thu-token"
process.env.DATABASE_URL = schemaUrl(S) // pool của app đọc lúc import — đặt TRƯỚC mọi import động
process.env.OPS_API_TOKEN = TOKEN

const admin = new pg.Client({ connectionString: localDbUrl() })
const sc = new pg.Client({ connectionString: schemaUrl(S) })
let publicTruoc: unknown

before(async () => {
  await admin.connect()
  publicTruoc = await chupPublic(admin)
  await dungKhuonTruoc(admin, S)
  for (const t of ["ops_audit", "stg_zalo_posts"]) await admin.query(`CREATE TABLE "${S}".${t} (LIKE public.${t} INCLUDING ALL)`)
  await sc.connect()
  await sc.query(`INSERT INTO source_registry (code, real_name, label_vi) VALUES ('S05', '${DAU}-a', 'x'), ('S06', '${DAU}-b', 'x')`)
})
after(async () => {
  await sc.end().catch(() => {})
  const { pool } = await import("../src/lib/db")
  await new Promise((r) => setTimeout(r, 200))
  await pool.end().catch(() => {})
  await xoaLuocDo(admin, S).catch(() => {})
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
  await new Promise((r) => setTimeout(r, 100)) // auditOpsWrite ghi nền
  return { status: res.status, body: (await res.json()) as Record<string, unknown> }
}
const nhom = async (key: string) =>
  (await sc.query("SELECT * FROM source_groups WHERE group_key = $1", [key])).rows[0] as Record<string, unknown> | undefined
const audits = async () =>
  (await sc.query("SELECT action, detail FROM ops_audit WHERE action = 'source-group:toggle' ORDER BY id")).rows as {
    action: string
    detail: Record<string, unknown>
  }[]

test("VD-AC-6b trước 047: toggle và add chạy như hôm nay (ghi enabled)", async () => {
  await sc.query(`INSERT INTO source_groups (source_code, group_key, name, enabled) VALUES ('S05', '${DAU}-cu', 'cu', true)`)
  assert.equal((await goi({ action: "toggle", sourceCode: "S05", groupKey: `${DAU}-cu`, enabled: false })).status, 200)
  assert.equal((await nhom(`${DAU}-cu`))?.enabled, false)
  assert.equal((await goi({ action: "toggle", sourceCode: "S05", groupKey: `${DAU}-cu`, enabled: true })).status, 200)
  assert.equal((await nhom(`${DAU}-cu`))?.enabled, true)
  assert.equal((await goi({ action: "add", sourceCode: "S06", groupKey: `${DAU}-cu-moi`, name: "cu moi" })).status, 200)
  assert.equal((await nhom(`${DAU}-cu-moi`))?.enabled, true)
  await sc.query("TRUNCATE ops_audit")
})

test("VD-AC-6 sau 047: công tắc ghi trạng thái vòng đời, chặn bật nhóm đã gỡ, nhật ký có trước–sau", async () => {
  await chay047(sc)
  await sc.query(`INSERT INTO source_groups (source_code, group_key, name, status, reason) VALUES
    ('S05', '${DAU}-g1', 'g1', 'active', NULL), ('S05', '${DAU}-g9', 'g9', 'retired', NULL),
    ('S05', '${DAU}-g5', 'g5', 'active', NULL), ('S06', '${DAU}-nhap', 'nhap', 'draft', NULL),
    ('S06', '${DAU}-mode', 'mode', 'active', NULL)`)
  const g1 = { action: "toggle", sourceCode: "S05", groupKey: `${DAU}-g1` }

  // tắt không lý do → lý do mặc định (Hỏi-1)
  assert.equal((await goi({ ...g1, enabled: false })).status, 200)
  let d = await nhom(`${DAU}-g1`)
  assert.deepEqual([d?.status, d?.reason, d?.enabled], ["paused", "tắt bằng công tắc /ops/sources", false])
  // bật → active, xoá lý do
  assert.equal((await goi({ ...g1, enabled: true })).status, 200)
  d = await nhom(`${DAU}-g1`)
  assert.deepEqual([d?.status, d?.reason, d?.resume_when, d?.enabled], ["active", null, null, true])
  // tắt có lý do + điều kiện bật lại
  assert.equal((await goi({ ...g1, enabled: false, reason: "het credit", resumeWhen: "7/11" })).status, 200)
  d = await nhom(`${DAU}-g1`)
  assert.deepEqual([d?.status, d?.reason, d?.resume_when], ["paused", "het credit", "7/11"])
  // lý do toàn khoảng trắng → coi như vắng (Review Focus 2)
  await goi({ ...g1, enabled: true })
  await goi({ ...g1, enabled: false, reason: "   " })
  assert.equal((await nhom(`${DAU}-g1`))?.reason, "tắt bằng công tắc /ops/sources")
  await goi({ ...g1, enabled: true })

  // bật nhóm đã gỡ → 409, dòng không đổi, không audit
  const truoc = await nhom(`${DAU}-g9`)
  const n9 = (await audits()).length
  const r9 = await goi({ action: "toggle", sourceCode: "S05", groupKey: `${DAU}-g9`, enabled: true })
  assert.equal(r9.status, 409)
  assert.deepEqual(await nhom(`${DAU}-g9`), truoc)
  assert.equal((await audits()).length, n9)

  // bật nhóm nháp → active; bật nhóm đang active → 200, không audit mới (Review Focus 3)
  assert.equal((await goi({ action: "toggle", sourceCode: "S06", groupKey: `${DAU}-nhap`, enabled: true })).status, 200)
  assert.equal((await nhom(`${DAU}-nhap`))?.status, "active")
  const nA = (await audits()).length
  assert.equal((await goi({ ...g1, enabled: true })).status, 200)
  assert.equal((await audits()).length, nA)

  // add → active
  assert.equal((await goi({ action: "add", sourceCode: "S06", groupKey: `${DAU}-moi`, name: "moi" })).status, 200)
  d = await nhom(`${DAU}-moi`)
  assert.deepEqual([d?.status, d?.enabled], ["active", true])

  // nhật ký toggle của g1: trước–sau đúng thứ tự
  const g1Log = (await audits()).filter((a) => a.detail.groupKey === `${DAU}-g1`).map((a) => [a.detail.from, a.detail.to])
  assert.deepEqual(g1Log, [
    ["active", "paused"],
    ["paused", "active"],
    ["active", "paused"],
    ["paused", "active"],
    ["active", "paused"],
    ["paused", "active"],
  ])

  // delete và set-mode vẫn chạy trên lược đồ đã migration
  assert.equal((await goi({ action: "delete", sourceCode: "S05", groupKey: `${DAU}-g5`, purge: false })).status, 200)
  assert.equal(await nhom(`${DAU}-g5`), undefined)
})
