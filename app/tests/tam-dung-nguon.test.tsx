// tam-dung-nguon.test.tsx — hồ sơ _acceptance/tam-dung-nguon-tu-cloud (TV4b), ca route «TD-AC-1» (tự duyệt theo vai),
// «TD-AC-2» (S03 chờ người thứ hai), «TD-AC-3c» (lý do trắng → 400, không ghi), «TD-RF» (lý do bật lại qua ly_do, gửi
// lại cùng khoá, tu_duyet không phải boolean). Chạy dưới db/db-thu.sh (executor tdn_route) trên lược đồ CLOUD tạm chạy
// 091; public không được chạm. Đối chứng đỏ chạy bản chép tạm của route với đúng một chỗ thay.
import { after, before, beforeEach, test } from "node:test"
import assert from "node:assert/strict"
import { dirname, join } from "node:path"
import { fileURLToPath, pathToFileURL } from "node:url"
import pg from "pg"

import { localDbUrl } from "../../pipeline/scripts/capture-ops-facts.mjs"
import { schemaUrl } from "../../pipeline/scripts/ops-facts-fixture.mjs"
import { chay091, dungCloud } from "../../pipeline/scripts/so-lenh-fixture.mjs"
import { chupPublic, xoaLuocDo } from "../../pipeline/scripts/vong-doi-fixture.mjs"
import { banSao, doc, type Goi, yeuCau } from "./helpers/lenh-goi"
import { dungBangPhien, taoNguoi } from "./helpers/phien-thu"

const APP = join(dirname(fileURLToPath(import.meta.url)), "..")
const ROUTE = join(APP, "src/app/api/v1/ops/change-requests/route.ts")
const S = `tdn_${process.pid}`
process.env.DATABASE_URL = schemaUrl(S) // pool của app đọc lúc import — đặt TRƯỚC mọi import động
process.env.OPS_API_TOKEN = "tdn-thu-bearer-chung-0123456789"

const admin = new pg.Client({ connectionString: localDbUrl() })
const sc = new pg.Client({ connectionString: schemaUrl(S) })
let publicTruoc: unknown
const nguoi: Record<string, { id: string; cookie: string }> = {}

before(async () => {
  await admin.connect()
  publicTruoc = await chupPublic(admin)
  await dungCloud(admin, S)
  await dungBangPhien(admin, S)
  await sc.connect()
  await chay091(sc)
  for (const vai of ["viewer", "ops", "admin"]) nguoi[vai] = await taoNguoi(sc, vai)
  nguoi.admin2 = await taoNguoi(sc, "admin")
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
beforeEach(async () => {
  await sc.query(`DELETE FROM change_requests`)
})

async function tao(o: Goi, tep = "../src/app/api/v1/ops/change-requests/route") {
  const { POST } = await import(tep)
  return doc(await POST(yeuCau("/api/v1/ops/change-requests", "POST", o)))
}
async function quyet(id: string, o: Goi) {
  const { POST } = await import("../src/app/api/v1/ops/change-requests/[id]/decide/route")
  return doc(await POST(yeuCau(`/api/v1/ops/change-requests/${id}/decide`, "POST", o), { params: Promise.resolve({ id }) }))
}
const dem = async (bang: string, where = "TRUE") => (await sc.query(`SELECT count(*)::int AS n FROM ${bang} WHERE ${where}`)).rows[0].n as number
const dong = async (id: unknown) =>
  (await sc.query(`SELECT status, approved_by, requested_by, decided_at, note, payload FROM change_requests WHERE id = $1`, [id])).rows[0]
const hanhDong = async (id: unknown) =>
  (await sc.query(`SELECT action FROM ops_audit WHERE detail->>'change_request_id' = $1 ORDER BY at, id`, [String(id)])).rows.map((r) => r.action)
const PAUSE = (extra: Record<string, unknown> = {}) => ({ type: "source.pause", target: "S05", payload: { reason: "hết credit" }, ...extra })
const RESUME = (extra: Record<string, unknown> = {}) => ({ type: "source.resume", target: "S05", payload: {}, ...extra })

test("TD-AC-1 tự duyệt theo vai: ops pause tu_duyet → approved, 2 dòng audit cùng giao dịch", async () => {
  const actorOps = `user:${nguoi.ops.id}`
  const a = await tao({ cookie: nguoi.ops.cookie, body: PAUSE({ tu_duyet: true }) })
  assert.equal(a.status, 201)
  const d = await dong(a.body.id)
  assert.deepEqual(
    { status: d.status, approved_by: d.approved_by, requested_by: d.requested_by, co_decided_at: d.decided_at !== null },
    { status: "approved", approved_by: actorOps, requested_by: actorOps, co_decided_at: true },
  )
  assert.deepEqual(await hanhDong(a.body.id), ["change_request.create", "change_request.decide"])

  const b = await tao({ cookie: nguoi.ops.cookie, body: PAUSE() })
  assert.equal((await dong(b.body.id)).status, "submitted", "không tu_duyet giữ hành vi TV4")
  assert.deepEqual(await hanhDong(b.body.id), ["change_request.create"])

  assert.equal((await tao({ cookie: nguoi.viewer.cookie, body: PAUSE({ tu_duyet: true }) })).status, 403, "viewer")
  const n = await dem("change_requests")
  assert.equal((await tao({ cookie: nguoi.ops.cookie, body: RESUME({ tu_duyet: true }) })).status, 403, "ops bật lại")
  assert.equal(await dem("change_requests"), n, "ops bật lại đã ghi")
  const c = await tao({ cookie: nguoi.admin.cookie, body: RESUME({ tu_duyet: true }) })
  assert.equal(c.status, 201)
  assert.equal((await dong(c.body.id)).status, "approved", "admin bật lại tự duyệt")

  // Cùng giao dịch: dòng audit decide hỏng → không còn lệnh treo, không dòng audit nào.
  const truoc = [await dem("change_requests"), await dem("ops_audit")]
  await banSao(
    ROUTE,
    'await ghiAuditTrong(c, q.actor, "change_request.decide"',
    'await (async () => { throw new Error("hong-audit") })(); await ghiAuditTrong(c, q.actor, "change_request.decide"',
    async (dot) => {
      const r = await tao({ cookie: nguoi.ops.cookie, body: PAUSE({ tu_duyet: true }) }, pathToFileURL(dot).href).catch(() => ({ status: 500 }))
      assert.ok(r.status >= 500, `audit hỏng phải ra 5xx, được ${r.status}`)
    },
  )
  assert.deepEqual([await dem("change_requests"), await dem("ops_audit")], truoc, "còn lệnh hay audit sau giao dịch hỏng")

  // Đối chứng đỏ tu-duyet: bản bỏ nhánh tu_duyet thì lệnh ops pause ra submitted.
  const st = await banSao(ROUTE, "body.tu_duyet === true", "false", async (dot) => {
    const r = await tao({ cookie: nguoi.ops.cookie, body: PAUSE({ tu_duyet: true }) }, pathToFileURL(dot).href)
    return (await dong(r.body.id)).status
  })
  assert.equal(st, "submitted", "tu-duyet: bản sao bỏ nhánh phải ra submitted")
})

test("TD-AC-2 S03: tu_duyet bị bỏ qua, người gửi không tự duyệt, admin khác duyệt được", async () => {
  const a = await tao({ cookie: nguoi.admin.cookie, body: PAUSE({ target: "S03", tu_duyet: true }) })
  assert.equal(a.status, 201)
  assert.equal(a.body.status, "submitted")
  assert.deepEqual(await hanhDong(a.body.id), ["change_request.create"])
  const tu = await quyet(a.body.id as string, { cookie: nguoi.admin.cookie, body: { decision: "approve" } })
  assert.deepEqual([tu.status, tu.body.error], [409, "can-nguoi-thu-hai"])
  assert.equal((await dong(a.body.id)).status, "submitted")
  const khac = await quyet(a.body.id as string, { cookie: nguoi.admin2.cookie, body: { decision: "approve" } })
  assert.equal(khac.status, 200)
  assert.equal((await dong(a.body.id)).status, "approved")
  // Đối chứng đỏ S03: bản bỏ điều kiện đích thì lệnh S03 tự duyệt.
  const st = await banSao(ROUTE, ' && body.target !== "S03"', "", async (dot) => {
    const r = await tao({ cookie: nguoi.admin.cookie, body: PAUSE({ target: "S03", tu_duyet: true }) }, pathToFileURL(dot).href)
    return (await dong(r.body.id)).status
  })
  assert.equal(st, "approved", "S03: bản sao bỏ điều kiện đích phải tự duyệt")
})

test("TD-AC-3c lý do trắng → 400 thieu-reason, không ghi", async () => {
  const truoc = [await dem("change_requests"), await dem("ops_audit")]
  const r = await tao({ cookie: nguoi.ops.cookie, body: PAUSE({ payload: { reason: "   " }, tu_duyet: true }) })
  assert.deepEqual([r.status, r.body.ly_do], [400, "thieu-reason"])
  assert.deepEqual([await dem("change_requests"), await dem("ops_audit")], truoc)
  assert.equal((await tao({ cookie: nguoi.ops.cookie, body: PAUSE({ tu_duyet: true }) })).status, 201, "đối chứng dương")
})

test("TD-RF lý do bật lại qua ly_do; gửi lại cùng khoá; tu_duyet phải là boolean", async () => {
  const a = await tao({ cookie: nguoi.admin.cookie, body: RESUME({ ly_do: " đã nạp credit ", tu_duyet: true }) })
  assert.equal(a.status, 201)
  const d = await dong(a.body.id)
  assert.deepEqual([d.status, d.note, d.payload], ["approved", "đã nạp credit", {}])
  const thua = await tao({ cookie: nguoi.admin.cookie, body: RESUME({ payload: { reason: "x" }, tu_duyet: true }) })
  assert.deepEqual([thua.status, thua.body.ly_do], [400, "khoa-thua:reason"])
  const dai = await tao({ cookie: nguoi.ops.cookie, body: PAUSE({ ly_do: "a".repeat(501), tu_duyet: true }) })
  assert.deepEqual([dai.status, dai.body.error, dai.body.ly_do], [400, "lenh-sai-khuon", "ly-do-qua-dai"])

  const k = "tdn-khoa-lap"
  assert.equal((await tao({ cookie: nguoi.ops.cookie, body: PAUSE({ idempotency_key: k, tu_duyet: true }) })).status, 201)
  const audit = await dem("ops_audit")
  assert.equal((await tao({ cookie: nguoi.ops.cookie, body: PAUSE({ idempotency_key: k, tu_duyet: true }) })).status, 409)
  assert.equal(await dem("ops_audit"), audit, "gửi lại cùng khoá đã ghi audit")

  for (const v of ["true", 1]) {
    const r = await tao({ cookie: nguoi.ops.cookie, body: PAUSE({ tu_duyet: v }) })
    assert.equal((await dong(r.body.id)).status, "submitted", `tu_duyet ${JSON.stringify(v)}`)
  }
})
