// tam-dung-dau-cuoi.test.tsx — hồ sơ _acceptance/tam-dung-nguon-tu-cloud (TV4b), ca «TD-AC-7»: chuỗi thật route tạo
// (tu_duyet) → GET …/pull bằng token máy → apLenh của pipeline/lib/lenh.mjs → POST ingest change_request_results → GET
// danh sách → trangThaiLenh; rồi isRunnable của S05 đọc bằng docTrangThai trên lược đồ máy thu. Chạy dưới db/db-thu.sh
// (executor tdn_dau_cuoi). Lược đồ CLOUD tạm (091 + token máy) cho pool của app; lược đồ MÁY THU tạm (047 + 091 +
// source_registry S05) cho bộ áp. public không được chạm.
import { after, before, test } from "node:test"
import assert from "node:assert/strict"
import { spawnSync } from "node:child_process"
import { dirname, join } from "node:path"
import { fileURLToPath, pathToFileURL } from "node:url"
import pg from "pg"

import { localDbUrl } from "../../pipeline/scripts/capture-ops-facts.mjs"
import { schemaUrl } from "../../pipeline/scripts/ops-facts-fixture.mjs"
import { chay091, dungCloud, dungMayThu } from "../../pipeline/scripts/so-lenh-fixture.mjs"
import { chay047, chupPublic, xoaLuocDo } from "../../pipeline/scripts/vong-doi-fixture.mjs"
import { trangThaiLenh, type LenhHien } from "../src/lib/lenh-hien"
import { banSao, doc, type Goi, yeuCau } from "./helpers/lenh-goi"
import { dungBangPhien, taoNguoi } from "./helpers/phien-thu"

const APP = join(dirname(fileURLToPath(import.meta.url)), "..")
const GOC = join(APP, "..")
const ROUTE = join(APP, "src/app/api/v1/ops/change-requests/route.ts")
const S = `tdndc_app_${process.pid}`
const M = `tdndc_may_${process.pid}`
process.env.DATABASE_URL = schemaUrl(S) // pool của app đọc lúc import — đặt TRƯỚC mọi import động
process.env.OPS_API_TOKEN = "tdndc-thu-bearer-chung-0123456789"

const admin = new pg.Client({ connectionString: localDbUrl() })
const sc = new pg.Client({ connectionString: schemaUrl(S) })
const mc = new pg.Client({ connectionString: schemaUrl(M) })
let publicTruoc: unknown
const nguoi: Record<string, { id: string; cookie: string }> = {}
let token = ""
// Nạp động: vong-doi.mjs có await cấp cao (khối CLI), import tĩnh từ .tsx bị biên dịch sang cjs và gãy.
type LenhKeo = Parameters<typeof import("../../pipeline/lib/lenh.mjs").apLenh>[1]
const apLenh = async (c: pg.Client, cmd: unknown) => (await import("../../pipeline/lib/lenh.mjs")).apLenh(c, cmd as LenhKeo)
const docTrangThai = async (c: pg.Client, code: string) =>
  (await import("../../pipeline/lib/vong-doi.mjs")).docTrangThai(c, code) as Promise<{ run: boolean; ly_do: string }>

before(async () => {
  await admin.connect()
  publicTruoc = await chupPublic(admin)
  await dungCloud(admin, S)
  await dungBangPhien(admin, S)
  await sc.connect()
  await chay091(sc)
  for (const vai of ["ops", "admin"]) nguoi[vai] = await taoNguoi(sc, vai)
  await dungMayThu(admin, M)
  await mc.connect()
  await chay047(mc)
  await chay091(mc)
  await mc.query(`INSERT INTO source_registry (code, real_name, label_vi, status) VALUES ('S05', 'nguonthutdn', 'thu', 'active')`)
  const r = spawnSync(process.execPath, [join(GOC, "scripts", "cap-token-may.mjs"), "--name", "may-thu-tdn", "--scope", "ops:pull"], {
    env: { ...process.env, DATABASE_URL: schemaUrl(S) },
    encoding: "utf8",
  })
  assert.equal(r.status, 0, r.stderr)
  token = r.stdout.trim()
})
after(async () => {
  await sc.end().catch(() => {})
  await mc.end().catch(() => {})
  const { pool } = await import("../src/lib/db")
  await new Promise((r) => setTimeout(r, 200))
  await pool.end().catch(() => {})
  await xoaLuocDo(admin, S).catch(() => {})
  await xoaLuocDo(admin, M).catch(() => {})
  const publicSau = await chupPublic(admin)
  await admin.end().catch(() => {})
  assert.deepEqual(publicSau, publicTruoc, "public đã bị chạm")
})

async function tao(o: Goi, tep = "../src/app/api/v1/ops/change-requests/route") {
  const { POST } = await import(tep)
  return doc(await POST(yeuCau("/api/v1/ops/change-requests", "POST", o)))
}
async function keo() {
  const { GET } = await import("../src/app/api/v1/ops/change-requests/pull/route")
  return doc(await GET(yeuCau("/api/v1/ops/change-requests/pull", "GET", { auth: `Bearer ${token}` })))
}
async function baoKetQua(results: unknown[]) {
  const { POST } = await import("../src/app/api/v1/ops/ingest/route")
  const body = { pushedAt: new Date().toISOString(), kind: "change_request_results", results }
  return doc(await POST(yeuCau("/api/v1/ops/ingest", "POST", { auth: `Bearer ${token}`, body })))
}
async function danhSach(cookie: string) {
  const { GET } = await import("../src/app/api/v1/ops/change-requests/route")
  return doc(await GET(yeuCau("/api/v1/ops/change-requests", "GET", { cookie })))
}

/** Một vòng: tạo lệnh → kéo → áp ở máy thu → báo → đọc lại danh sách. Trả lệnh đã đọc lại và isRunnable của S05. */
async function vong(cookie: string, body: Record<string, unknown>) {
  const t = await tao({ cookie, body })
  assert.equal(t.status, 201, JSON.stringify(t.body))
  const k = await keo()
  assert.equal(k.status, 200)
  const cmds = k.body.commands as { id: string }[]
  assert.deepEqual(cmds.map((c) => c.id), [t.body.id], "pull phải trả đúng lệnh vừa tạo")
  const kq = await apLenh(mc, cmds[0])
  assert.equal((await baoKetQua([kq])).status, 200)
  const ds = await danhSach(cookie)
  const l = (ds.body.commands as LenhHien[]).find((c) => c.id === t.body.id) as LenhHien
  return { l, chay: await docTrangThai(mc, "S05") }
}

test("TD-AC-7 đầu-cuối: tạm dừng S05 từ cloud → lượt thu kế tiếp không chạy; bật lại → chạy", async () => {
  const p = await vong(nguoi.ops.cookie, { type: "source.pause", target: "S05", payload: { reason: "hết credit" }, tu_duyet: true })
  assert.equal(p.l.status, "applied")
  assert.deepEqual([p.l.before?.status, p.l.after?.status], ["active", "paused"])
  assert.match(trangThaiLenh(p.l, null, Date.now()).nhan, /^Đã áp lúc \d{2}:\d{2}$/)
  assert.equal(p.chay.run, false, "S05 tạm dừng mà isRunnable vẫn chạy")

  const r = await vong(nguoi.admin.cookie, { type: "source.resume", target: "S05", payload: {}, ly_do: "đã nạp credit", tu_duyet: true })
  assert.equal(r.l.status, "applied")
  assert.equal(r.l.after?.status, "active")
  assert.equal(r.chay.run, true, "S05 bật lại mà isRunnable không chạy")

  // Đối chứng đỏ cho-duyet: route bỏ nhánh tu_duyet → lệnh nằm submitted, pull trả 0 lệnh, nguồn vẫn chạy.
  const sau = await banSao(ROUTE, "body.tu_duyet === true", "false", async (dot) => {
    const t = await tao(
      { cookie: nguoi.ops.cookie, body: { type: "source.pause", target: "S05", payload: { reason: "hết credit" }, tu_duyet: true } },
      pathToFileURL(dot).href,
    )
    assert.equal(t.status, 201)
    return { soLenh: ((await keo()).body.commands as unknown[]).length, chay: (await docTrangThai(mc, "S05")).run }
  })
  assert.deepEqual(sau, { soLenh: 0, chay: true }, "cho-duyet: bản sao bỏ nhánh tu_duyet không được tới máy thu")
})
