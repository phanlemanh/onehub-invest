// quyen-bon-vai.test.tsx — hồ sơ _acceptance/quyen-bon-vai-mot-cho (TV1), ca «QV-AC-n». Một lược đồ tạm ở khuôn sau 047 +
// 048 có người ở mỗi vai và phiên thật; route gọi bằng Request thật (Cookie phiên hoặc Bearer). Đối chứng chạy bản route
// trước sửa đã ghim (app/tests/fixtures/ops-routes-truoc-tv1/, route ở 39c660ca). public không được chạm.
import { after, before, test } from "node:test"
import assert from "node:assert/strict"
import pg from "pg"

import { localDbUrl } from "../../pipeline/scripts/capture-ops-facts.mjs"
import { schemaUrl } from "../../pipeline/scripts/ops-facts-fixture.mjs"
import { dungSauGop } from "../../pipeline/scripts/so-nhom-fixture.mjs"
import { chupPublic, xoaLuocDo } from "../../pipeline/scripts/vong-doi-fixture.mjs"
import { dungBangPhien, taoNguoi } from "./helpers/phien-thu"

const S = `qv_${process.pid}`
const TOKEN = "qv-thu-token"
process.env.DATABASE_URL = schemaUrl(S) // pool của app đọc lúc import — đặt TRƯỚC mọi import động
process.env.OPS_API_TOKEN = TOKEN
process.env.OPS_EMAILS = " Cua-Phu@Local.Test ,khac@local.test"

const admin = new pg.Client({ connectionString: localDbUrl() })
const sc = new pg.Client({ connectionString: schemaUrl(S) })
let publicTruoc: unknown

before(async () => {
  await admin.connect()
  publicTruoc = await chupPublic(admin)
  await dungSauGop(admin, S)
  await dungBangPhien(admin, S)
  for (const t of ["ops_audit", "stg_zalo_posts"]) await admin.query(`CREATE TABLE "${S}".${t} (LIKE public.${t} INCLUDING ALL)`)
  await sc.connect()
})
after(async () => {
  await sc.end().catch(() => {})
  const { pool } = await import("../src/lib/db")
  await pool.end().catch(() => {})
  await xoaLuocDo(admin, S).catch(() => {})
  const publicSau = await chupPublic(admin)
  await admin.end().catch(() => {})
  assert.deepEqual(publicSau, publicTruoc, "public đã bị chạm")
})

const req = (headers: Record<string, string> = {}) => new Request("http://localhost/api/v1/ops/x", { headers })

// ---- QV-AC-8: cổng trang suy từ cùng bậc vai — bảng 7 dòng viết trước (E8) ----
test("QV-AC-8 canAccessOps / isAdmin theo bậc vai; OPS_EMAILS tính như ops; vai lạ và phiên hết hạn không vào", async () => {
  const { canAccessOps, isAdmin } = await import("../src/lib/ops-access")
  const { nguoiTuRequest } = await import("../src/lib/auth")
  const BANG: [string, string, { email?: string }, boolean, boolean][] = [
    ["user", "user", {}, false, false],
    ["viewer", "viewer", {}, true, false],
    ["ops", "ops", {}, true, false],
    ["admin", "admin", {}, true, true],
    ["owner", "owner", {}, true, true],
    ["OPS_EMAILS (role user, hoa + khoảng trắng)", "user", { email: "cua-phu@local.test" }, true, false],
    ["role lạ superuser", "superuser", {}, false, false],
  ]
  assert.equal(BANG.length, 7)
  for (const [ten, vai, opts, vao, quanTri] of BANG) {
    const n = await taoNguoi(sc, vai, opts)
    const u = await nguoiTuRequest(req({ cookie: n.cookie }))
    assert.ok(u, `${ten}: phiên không đọc ra người`)
    assert.equal(canAccessOps(u), vao, `${ten}: canAccessOps`)
    assert.equal(isAdmin(u), quanTri, `${ten}: isAdmin`)
    if (vai === "superuser") assert.equal(u.role, "user", "vai lạ phải rơi về user")
  }
  const het = await taoNguoi(sc, "admin", { hetHan: true })
  assert.equal(await nguoiTuRequest(req({ cookie: het.cookie })), null, "phiên hết hạn vẫn đọc ra người")
  assert.equal(await nguoiTuRequest(req({ cookie: "oi_session=khong-co" })), null)
  assert.equal(await nguoiTuRequest(req()), null)
})

// ---- kiemQuyen mức hàm: 10 hành động × 7 người gọi (ma trận route thật ở QV-AC-2) ----
test("QV-AC-8b kiemQuyen trả 401/403/qua đúng bảng; bearer chỉ qua ở ops.read và ingest.push; bearer + phiên admin dùng phiên", async () => {
  const { kiemQuyen, QUYEN_OPS, BAC_VAI } = await import("../src/lib/ops-access")
  const hds = Object.keys(QUYEN_OPS) as (keyof typeof QUYEN_OPS)[]
  assert.deepEqual(hds.length, 10)
  const nguoi: Record<string, string> = {}
  for (const v of ["user", "viewer", "ops", "admin", "owner"]) nguoi[v] = (await taoNguoi(sc, v)).cookie
  for (const hd of hds) {
    const luat = QUYEN_OPS[hd]
    const khong = await kiemQuyen(req(), hd)
    assert.ok(!khong.ok && khong.res.status === 401, `${hd} × không ai`)
    for (const v of ["user", "viewer", "ops", "admin", "owner"] as const) {
      const r = await kiemQuyen(req({ cookie: nguoi[v] }), hd)
      const qua = BAC_VAI[v] >= BAC_VAI[luat.vai]
      if (qua) assert.ok(r.ok && r.actor.startsWith("user:usr_"), `${hd} × ${v}: phải qua`)
      else assert.ok(!r.ok && r.res.status === 403, `${hd} × ${v}: phải 403`)
    }
    const b = await kiemQuyen(req({ authorization: `Bearer ${TOKEN}` }), hd)
    if (luat.bearer) assert.ok(b.ok && b.actor === "machine:cloud-sync", `${hd} × bearer: phải qua`)
    else assert.ok(!b.ok && b.res.status === 403, `${hd} × bearer: hành động cấm bearer phải 403`)
    const bp = await kiemQuyen(req({ authorization: `Bearer ${TOKEN}`, cookie: nguoi.admin }), hd)
    assert.ok(bp.ok, `${hd} × bearer + phiên admin: phải qua bằng phiên`)
  }
})

// ---- QV-AC-7: migration 049 — CHECK năm vai, idempotent, dữ liệu public không vi phạm (E7) ----
test("QV-AC-7 049 nhận năm vai, từ chối superuser bằng users_role_chk, áp lại không lỗi; public 0 dòng vi phạm", async () => {
  const { readFileSync, readdirSync } = await import("node:fs")
  const { join } = await import("node:path")
  const MIG = join(import.meta.dirname, "../../db/migrations")
  const tep = readdirSync(MIG).filter((f) => f.startsWith("049_") && f.includes("vai"))
  assert.equal(tep.length, 1, `cần đúng một tệp 049_*vai*: ${tep.join(", ")}`)
  const sql = readFileSync(join(MIG, tep[0]), "utf8")
  const S7 = `qv7_${process.pid}`
  await admin.query(`CREATE SCHEMA "${S7}"`)
  await admin.query(`CREATE TABLE "${S7}".users (LIKE public.users INCLUDING DEFAULTS INCLUDING INDEXES)`)
  const c7 = new pg.Client({ connectionString: schemaUrl(S7) })
  await c7.connect()
  try {
    await c7.query(sql)
    await c7.query(sql) // lần hai: idempotent
    await c7.query(`INSERT INTO users (id, email, password_hash) VALUES ('u7', 'u7@local.test', 'x$y')`)
    for (const v of ["user", "viewer", "ops", "admin", "owner"]) await c7.query(`UPDATE users SET role = $1 WHERE id = 'u7'`, [v])
    await assert.rejects(c7.query(`UPDATE users SET role = 'superuser' WHERE id = 'u7'`), /users_role_chk/)
    const nCheck = (await c7.query(`SELECT count(*)::int AS n FROM pg_constraint WHERE conname = 'users_role_chk' AND conrelid = 'users'::regclass`)).rows[0].n
    assert.equal(nCheck, 1, "áp hai lần phải còn đúng một ràng buộc")
  } finally {
    await c7.end().catch(() => {})
    await admin.query(`DROP SCHEMA "${S7}" CASCADE`)
  }
  const vp = (await admin.query(`SELECT count(*)::int AS n FROM public.users WHERE role NOT IN ('user','viewer','ops','admin','owner')`)).rows[0].n
  assert.equal(vp, 0, "public.users có dòng vai ngoài năm vai — 049 sẽ không áp được")
})
