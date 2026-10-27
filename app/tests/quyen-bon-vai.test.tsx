// quyen-bon-vai.test.tsx — hồ sơ _acceptance/quyen-bon-vai-mot-cho (TV1), ca «QV-AC-n». Một lược đồ tạm ở khuôn sau 047 +
// 048 có người ở mỗi vai và phiên thật; route gọi bằng Request thật (Cookie phiên hoặc Bearer). Đối chứng chạy bản route
// trước sửa đã ghim (app/tests/fixtures/ops-routes-truoc-tv1/, route ở 39c660ca). public không được chạm.
//
// An toàn Zalo (.claude/rules/zalo-safety.md): route zalo/** chỉ chạy với openclaw GIẢ — HOME và PATH trỏ thư mục tạm,
// đặt ở đầu tệp TRƯỚC mọi import động (hằng OPENCLAW/CONFIG của zalo-admin tính lúc nạp); rào trong before() chặn mọi ca
// nếu đường đi lạc ra HOME thật. openclaw giả ghi argv mỗi lần gọi vào spy.log; lệnh login ghi ảnh QR rồi ngủ (bị giết ở after).
import { after, before, test } from "node:test"
import assert from "node:assert/strict"
import { execFileSync, spawnSync } from "node:child_process"
import { createHash } from "node:crypto"
import { chmodSync, existsSync, mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, writeFileSync } from "node:fs"
import { homedir, tmpdir } from "node:os"
import { dirname, join, resolve } from "node:path"
import { fileURLToPath } from "node:url"
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

const APP = resolve(dirname(fileURLToPath(import.meta.url)), "..")
const ROUTES = join(APP, "src/app/api/v1/ops")
const FIXTURE = join(APP, "tests/fixtures/ops-routes-truoc-tv1")
const TMP = mkdtempSync(join(tmpdir(), "qv-"))
const HOME = join(TMP, "home")
const SPY = join(TMP, "spy.log")
const QR = join(TMP, "qr")
const CFG = join(HOME, ".openclaw", "openclaw.json")
const OC_FAIL = join(TMP, "oc-fail") // có tệp này → openclaw giả thoát 1
{
  const oc = `#!/bin/sh\nfor a in "$@"; do printf '%s\\t' "$a"; done >> "${SPY}"\nprintf '\\n' >> "${SPY}"\n` +
    `[ -f "${OC_FAIL}" ] && exit 1\n` +
    `case "$*" in *"channels login"*) acc="$(eval echo \\$$#)"; printf 'qr' > "${QR}/openclaw-zalouser-qr-$acc.png"; exec sleep 60;; esac\nexit 0\n`
  for (const d of [join(HOME, ".openclaw", "bin"), join(TMP, "bin"), QR]) mkdirSync(d, { recursive: true })
  for (const d of [join(HOME, ".openclaw", "bin"), join(TMP, "bin")]) {
    writeFileSync(join(d, "openclaw"), oc)
    chmodSync(join(d, "openclaw"), 0o755)
  }
  process.env.HOME = HOME
  process.env.PATH = `${join(TMP, "bin")}:${process.env.PATH ?? ""}`
  process.env.OPENCLAW_QR_DIR = QR
}
const ON = { enabled: true, requireMention: true }
/** Cấu hình openclaw giả, sạch theo zaloConfigViolations (khuôn «sach» của nhom-moi-requiremention). */
const datCfg = () =>
  writeFileSync(
    CFG,
    JSON.stringify({
      channels: {
        zalouser: {
          enabled: true,
          groupPolicy: "allowlist",
          accounts: {
            default: { enabled: true, profile: "default", groupAllowFrom: ["*"], groups: { "group:a": { ...ON } } },
            acc2: { enabled: true, profile: "acc2", groupPolicy: "allowlist", groupAllowFrom: ["*"], groups: { "group:b": { ...ON } } },
          },
        },
      },
    }, null, 2),
  )
datCfg()
const spy = (): string[] => (existsSync(SPY) ? readFileSync(SPY, "utf8").split("\n").filter(Boolean) : [])
/** Số lệnh GHI của openclaw (đăng nhập, đăng xuất) — các ô đọc kích tra cứu thư mục nhóm chạy nền, ghi xen vào nhật ký. */
const lenhGhi = () => spy().filter((l) => /^channels\t(login|logout)\t/.test(l)).length
const thuc = (p: string) => {
  try {
    return realpathSync(p)
  } catch {
    return resolve(p)
  }
}

const admin = new pg.Client({ connectionString: localDbUrl() })
const sc = new pg.Client({ connectionString: schemaUrl(S) })
let publicTruoc: unknown

before(async () => {
  // Rào: zalo-admin phải thấy openclaw và cấu hình giả dưới thư mục tạm — lạc ra HOME thật thì không ca nào chạy.
  const { zaloAdminPaths } = await import("../src/lib/zalo-admin")
  for (const [ten, p] of [["HOME", homedir()], ["openclaw", zaloAdminPaths().openclaw], ["config", zaloAdminPaths().config]]) {
    if (!(thuc(p) + "/").startsWith(thuc(TMP) + "/")) throw new Error(`rào: HOME thật — ${ten} ${p} nằm ngoài ${TMP}`)
  }
  await admin.connect()
  publicTruoc = await chupPublic(admin)
  await dungSauGop(admin, S)
  await dungBangPhien(admin, S)
  for (const t of ["ops_audit", "stg_zalo_posts", "review_queue"]) await admin.query(`CREATE TABLE "${S}".${t} (LIKE public.${t} INCLUDING ALL)`)
  await admin.query(`CREATE TABLE "${S}".ops_heartbeat (id text PRIMARY KEY, payload jsonb NOT NULL, pushed_at timestamptz)`)
  await sc.connect()
})
after(async () => {
  try {
    execFileSync("pkill", ["-f", TMP]) // tiến trình login giả còn ngủ
  } catch {
    /* không còn tiến trình nào */
  }
  await sc.end().catch(() => {})
  const { pool } = await import("../src/lib/db")
  await pool.end().catch(() => {})
  await xoaLuocDo(admin, S).catch(() => {})
  const publicSau = await chupPublic(admin)
  await admin.end().catch(() => {})
  rmSync(TMP, { recursive: true, force: true })
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

// ======================================================================================================================
// Thước đối chiếu VIẾT TRƯỚC — chép từ bảng «Một bảng quyền» của design doc, KHÔNG đọc QUYEN_OPS của mã (tránh tự chứng).
// ======================================================================================================================
type Vai5 = "user" | "viewer" | "ops" | "admin" | "owner"
type Goi = "khong" | Vai5 | "bearer"
const BAC: Record<Vai5, number> = { user: 0, viewer: 1, ops: 2, admin: 3, owner: 4 }
const VAI_TOI_THIEU: Record<string, Vai5> = {
  "ops.read": "viewer", "audit.read": "admin", "ingest.push": "ops", "review.decide": "ops", "unit.toggle": "admin",
  "unit.create": "admin", "unit.delete": "admin", "unit.set_mode": "admin", "unit.update_meta": "admin", "zalo.admin": "admin",
}
const BEARER_DUOC = new Set(["ops.read", "ingest.push"])
const NGUOI_GOI: Goi[] = ["khong", "user", "viewer", "ops", "admin", "owner", "bearer"]
/** 21 ô route · phương thức (· action) → hành động. */
const BANG_ROUTE: [string, string, string | null, string][] = [
  ["audit", "GET", null, "audit.read"],
  ["collections", "GET", null, "ops.read"],
  ["coverage", "GET", null, "ops.read"],
  ["extraction-quality", "GET", null, "ops.read"],
  ["truthful-coverage", "GET", null, "ops.read"],
  ["ingest", "POST", null, "ingest.push"],
  ["review/[id]/decide", "POST", null, "review.decide"],
  ["source-groups", "GET", null, "ops.read"],
  ["source-groups", "POST", "toggle", "unit.toggle"],
  ["source-groups", "POST", "add", "unit.create"],
  ["source-groups", "POST", "delete", "unit.delete"],
  ["source-groups", "POST", "set-mode", "unit.set_mode"],
  ["source-groups", "POST", "set-meta", "unit.update_meta"],
  ["zalo/accounts", "GET", null, "zalo.admin"],
  ["zalo/accounts", "POST", null, "zalo.admin"],
  ["zalo/accounts", "DELETE", null, "zalo.admin"],
  ["zalo/groups", "GET", null, "zalo.admin"],
  ["zalo/groups", "POST", null, "zalo.admin"],
  ["zalo/login", "POST", null, "zalo.admin"],
  ["zalo/login", "GET", null, "zalo.admin"],
  ["zalo/login", "DELETE", null, "zalo.admin"],
]
/** Mã mong đợi của một ô: 401 / 403 / "qua" (qua cổng — mã nghiệp vụ tuỳ route). */
const mongDoi = (hd: string, g: Goi): 401 | 403 | "qua" =>
  g === "khong" ? 401 : g === "bearer" ? (BEARER_DUOC.has(hd) ? "qua" : 403) : BAC[g] >= BAC[VAI_TOI_THIEU[hd]] ? "qua" : 403
const MA_TRAN = BANG_ROUTE.flatMap(([route, method, action, hd]) => NGUOI_GOI.map((g) => ({ route, method, action, hd, g, ky: mongDoi(hd, g) })))

// ---- gọi route thật ----
type Handler = (req: Request, ctx?: unknown) => Promise<Response>
const napRoute = async (rel: string) => (await import(`../src/app/api/v1/ops/${rel}/route`)) as Record<string, Handler>
const cookieCua: Partial<Record<Vai5, string>> = {}
let nguoiAdmin = { id: "", cookie: "" }
let soKhoa = 0
const khoa = () => `https://www.facebook.com/groups/qv-${process.pid}-${++soKhoa}`

async function nhomMoi(status = "active"): Promise<{ id: number; group_key: string; unit_code: string }> {
  const k = khoa()
  return (
    await sc.query(
      `INSERT INTO collection_units (source_code, group_key, name, status, reason) VALUES ('S05', $1, $1, $2, $3) RETURNING id::int, group_key, unit_code`,
      [k, status, status === "paused" ? "lý do thử" : null],
    )
  ).rows[0]
}
let soThe = 900000
async function theMoi(): Promise<number> {
  const id = ++soThe
  await sc.query(`INSERT INTO review_queue (id, item_type, item_id, title) VALUES ($1, 'data_quality', $2, 'thẻ thử')`, [id, `dq:qv-${id}`])
  return id
}

/** Thân + query hợp lệ cho từng ô (để ô «qua» chạy nghiệp vụ thật, ô bị chặn thì không gì được đổi). */
async function lenh(route: string, method: string, action: string | null): Promise<{ body?: unknown; query?: string; id?: number }> {
  if (route === "ingest") return { body: { pushedAt: new Date().toISOString() } }
  if (route === "review/[id]/decide") return { id: await theMoi(), body: { status: "deferred" } }
  if (route === "source-groups" && method === "POST") {
    const n = await nhomMoi()
    if (action === "toggle") return { body: { action, sourceCode: "S05", groupKey: n.group_key, enabled: false } }
    if (action === "add") return { body: { action, sourceCode: "S05", groupKey: khoa(), name: "nhóm thêm" } }
    if (action === "delete") return { body: { action, sourceCode: "S05", groupKey: n.group_key } }
    if (action === "set-mode") return { body: { action, id: n.id, mode: "cho" } }
    return { body: { action, unitCode: n.unit_code, marketCodes: [], projectNodeIds: [] } }
  }
  if (route === "zalo/accounts" && method === "POST") return { body: { id: `qv${++soKhoa}` } }
  if (route === "zalo/accounts" && method === "DELETE") return { body: { id: "acc2" } }
  if (route === "zalo/groups" && method === "POST") return { body: { accountId: "acc2", groupId: "group:b", enabled: false } }
  if (route === "zalo/groups") return { query: "account=default" }
  if (route === "zalo/login" && method === "POST") return { body: { accountId: "acc2" } }
  if (route === "zalo/login") return { query: "account=acc2" }
  return {}
}

async function goi(
  route: string,
  method: string,
  headers: Record<string, string>,
  l: { body?: unknown; query?: string; id?: number },
  mod?: Record<string, Handler>,
): Promise<{ status: number; json: Record<string, unknown> }> {
  const m = mod ?? (await napRoute(route))
  const url = `http://localhost/api/v1/ops/${route.replace("[id]", String(l.id ?? 0))}${l.query ? `?${l.query}` : ""}`
  const req = new Request(url, {
    method,
    headers: { ...headers, ...(l.body !== undefined ? { "content-type": "application/json" } : {}) },
    ...(l.body !== undefined ? { body: JSON.stringify(l.body) } : {}),
  })
  // Handler ném (vd lược đồ tạm thiếu bảng số liệu) = máy chủ Next trả 500 — đã qua cổng quyền.
  const res = await m[method](req, { params: Promise.resolve({ id: String(l.id ?? 0) }) }).catch(
    (e: unknown) => new Response(JSON.stringify({ error: e instanceof Error ? e.message : String(e) }), { status: 500 }),
  )
  return { status: res.status, json: (await res.json().catch(() => ({}))) as Record<string, unknown> }
}
const dauCua = (g: Goi): Record<string, string> =>
  g === "khong" ? {} : g === "bearer" ? { authorization: `Bearer ${TOKEN}` } : { cookie: cookieCua[g]! }

/** Ảnh chụp mọi thứ một thao tác bị chặn không được đổi. */
async function chup() {
  const q = async (sql: string) => JSON.stringify((await sc.query(sql)).rows)
  return {
    nhom: await q("SELECT * FROM collection_units ORDER BY id"),
    the: await q("SELECT * FROM review_queue ORDER BY id"),
    hb: await q("SELECT * FROM ops_heartbeat ORDER BY id"),
    audit: (await sc.query("SELECT count(*)::int AS n FROM ops_audit")).rows[0].n as number,
    cfg: readFileSync(CFG, "utf8"),
    oc: lenhGhi(),
  }
}
const nAudit = async () => (await sc.query("SELECT count(*)::int AS n FROM ops_audit")).rows[0].n as number
const dongCuoi = async () =>
  (await sc.query("SELECT actor, action, detail FROM ops_audit ORDER BY id DESC LIMIT 1")).rows[0] as {
    actor: string; action: string; detail: Record<string, unknown>
  }

// ---- bản route trước sửa (fixture ghim 39c660ca) — chép cạnh route thật, phiên luôn vắng (request không cookie) ----
const banCu: string[] = []
async function napRouteCu(rel: string): Promise<Record<string, Handler>> {
  const goc = readFileSync(join(FIXTURE, rel, "route.ts.txt"), "utf8")
  // Ngoài máy chủ Next không có cookies(): bản cũ đọc phiên bằng getSessionUser — thay bằng «không phiên», đúng như một
  // request chỉ mang bearer.
  const sao = goc.replace(/import \{ getSessionUser \} from "@\/lib\/auth";\n/, "const getSessionUser = async () => null;\n")
  const p = join(ROUTES, rel, `.route-cu-${process.pid}.ts`)
  writeFileSync(p, sao)
  banCu.push(p)
  return (await import(p)) as Record<string, Handler>
}
const donBanCu = () => {
  for (const p of banCu.splice(0)) rmSync(p, { force: true })
}

test("QV-AC-0 dựng người ở năm vai", async () => {
  for (const v of ["user", "viewer", "ops", "admin", "owner"] as Vai5[]) cookieCua[v] = (await taoNguoi(sc, v)).cookie
  nguoiAdmin = await taoNguoi(sc, "admin")
  assert.equal(MA_TRAN.length, 147)
})

// ---- QV-AC-1: mỗi ô route gọi kiemQuyen đúng hành động; không route nào tự kiểm (E1) ----
function soatRoute(doc: (rel: string) => string): { thieu: string[]; tuKiem: string[] } {
  const thieu: string[] = []
  for (const [route, method, action, hd] of BANG_ROUTE) {
    const t = doc(route)
    const dau = t.indexOf(`export async function ${method}(`)
    const sau = dau < 0 ? -1 : t.indexOf("\nexport ", dau + 1)
    const than = dau < 0 ? "" : t.slice(dau, sau < 0 ? undefined : sau)
    const goi = `kiemQuyen(req, "${hd}")`
    const ok = action
      ? new RegExp(`["']${action}["'][\\s\\S]{0,160}${goi.replace(/[().]/g, "\\$&")}`).test(than)
      : than.includes(goi)
    if (!ok) thieu.push(`${route} ${method}${action ? ` ${action}` : ""}`)
  }
  const tuKiem = [...new Set(BANG_ROUTE.map(([r]) => r))].filter((r) =>
    ["OPS_API_TOKEN", "canAccessOps(", "isAdmin(", "getSessionUser("].some((c) => doc(r).includes(c)),
  )
  return { thieu, tuKiem }
}
test("QV-AC-1 21 ô route gọi kiemQuyen đúng hành động; 11 tệp route không tự kiểm quyền; đối chứng: fixture trước sửa bị bắt", () => {
  assert.equal(BANG_ROUTE.length, 21)
  const moi = soatRoute((r) => readFileSync(join(ROUTES, r, "route.ts"), "utf8"))
  assert.deepEqual(moi, { thieu: [], tuKiem: [] })
  const cu = soatRoute((r) => readFileSync(join(FIXTURE, r, "route.ts.txt"), "utf8"))
  assert.ok(cu.thieu.length >= 1, "phép soát không bắt được ô thiếu kiemQuyen ở bản trước sửa")
  assert.ok(cu.tuKiem.length >= 1, "phép soát không bắt được tệp còn tự kiểm ở bản trước sửa")
  for (const r of [...new Set(BANG_ROUTE.map(([x]) => x))]) {
    const bam = (s: string) => createHash("sha256").update(s).digest("hex")
    assert.equal(
      bam(readFileSync(join(FIXTURE, r, "route.ts.txt"), "utf8")),
      bam(execFileSync("git", ["show", `39c660ca:app/src/app/api/v1/ops/${r}/route.ts`], { cwd: APP, encoding: "utf8" })),
      `fixture ${r} lệch route ở 39c660ca`,
    )
  }
})

// ---- QV-AC-2: ma trận 21 × 7 = 147 ô trên route thật (E2) ----
test("QV-AC-2 147 ô route × người gọi: 401 / 403 / qua đúng bảng; ô bị chặn không đổi bảng, audit, cấu hình, openclaw", async () => {
  assert.equal(MA_TRAN.length, 147)
  const sai: string[] = []
  for (const o of MA_TRAN) {
    const l = await lenh(o.route, o.method, o.action)
    const truoc = o.ky === "qua" ? null : await chup()
    const r = await goi(o.route, o.method, dauCua(o.g), l)
    const ten = `${o.route} ${o.method}${o.action ? ` ${o.action}` : ""} × ${o.g}`
    if (o.ky === "qua") {
      if (r.status === 401 || r.status === 403) sai.push(`${ten}: mong qua, được ${r.status}`)
    } else {
      if (r.status !== o.ky) sai.push(`${ten}: mong ${o.ky}, được ${r.status}`)
      const sau = await chup()
      const lech = (Object.keys(sau) as (keyof typeof sau)[]).filter((k) => JSON.stringify(sau[k]) !== JSON.stringify(truoc![k]))
      if (lech.length) sai.push(`${ten}: bị chặn mà vẫn đổi ${lech.join(", ")}`)
    }
  }
  assert.deepEqual(sai, [])
})

test("QV-AC-2b đối chứng dương: route zalo/accounts bỏ nhánh trả Response của kiemQuyen → ô DELETE × viewer bị bắt", async () => {
  const goc = readFileSync(join(ROUTES, "zalo/accounts/route.ts"), "utf8")
  const hong = goc.replace(
    /export async function DELETE\(req: Request\) \{\n  const q = await kiemQuyen\(req, "zalo\.admin"\);\n  if \(!q\.ok\) return q\.res;/,
    'export async function DELETE(req: Request) {\n  const q = await kiemQuyen(req, "zalo.admin");\n  void q;',
  )
  assert.notEqual(hong, goc, "đột biến không đổi gì — khuôn DELETE của zalo/accounts đã khác")
  const p = join(ROUTES, "zalo/accounts", `.route-cu-hong-${process.pid}.ts`)
  writeFileSync(p, hong)
  try {
    const m = (await import(p)) as Record<string, Handler>
    datCfg()
    const r = await goi("zalo/accounts", "DELETE", dauCua("viewer"), { body: { id: "acc2" } }, m)
    assert.notEqual(r.status, 403, "zalo/accounts DELETE × viewer: bản hỏng vẫn 403 — phép đo không phân biệt")
  } finally {
    rmSync(p, { force: true })
    datCfg()
  }
})

// ---- QV-AC-3: thao tác thành công → đúng một dòng, người thật, tên hành động, trước/sau (E3) ----
test("QV-AC-3 mỗi thao tác ghi thành công ghi đúng 1 dòng audit user:<id> mang tên hành động; ô không đổi / 409 / 400 ghi 0 dòng", async () => {
  datCfg()
  const nOps = await taoNguoi(sc, "ops")
  const ca: { ten: string; route: string; method: string; dau: Record<string, string>; l: () => Promise<{ body?: unknown; query?: string; id?: number }>; hd: string; actor: string; truocSau?: boolean }[] = [
    { ten: "ingest bằng bearer", route: "ingest", method: "POST", dau: { authorization: `Bearer ${TOKEN}` }, l: () => lenh("ingest", "POST", null), hd: "ingest.push", actor: "machine:cloud-sync" },
    { ten: "ingest bằng phiên ops", route: "ingest", method: "POST", dau: { cookie: nOps.cookie }, l: () => lenh("ingest", "POST", null), hd: "ingest.push", actor: `user:${nOps.id}` },
    { ten: "duyệt thẻ", route: "review/[id]/decide", method: "POST", dau: { cookie: nOps.cookie }, l: () => lenh("review/[id]/decide", "POST", null), hd: "review.decide", actor: `user:${nOps.id}`, truocSau: true },
    ...(["toggle", "add", "delete", "set-mode", "set-meta"] as const).map((a) => ({
      ten: a, route: "source-groups", method: "POST", dau: { cookie: nguoiAdmin.cookie }, l: () => lenh("source-groups", "POST", a),
      hd: BANG_ROUTE.find((x) => x[2] === a)![3], actor: `user:${nguoiAdmin.id}`, truocSau: true,
    })),
    { ten: "zalo tạo tài khoản", route: "zalo/accounts", method: "POST", dau: { cookie: nguoiAdmin.cookie }, l: () => lenh("zalo/accounts", "POST", null), hd: "zalo.admin", actor: `user:${nguoiAdmin.id}` },
    { ten: "zalo bật/tắt nhóm", route: "zalo/groups", method: "POST", dau: { cookie: nguoiAdmin.cookie }, l: () => lenh("zalo/groups", "POST", null), hd: "zalo.admin", actor: `user:${nguoiAdmin.id}` },
    { ten: "zalo gỡ tài khoản", route: "zalo/accounts", method: "DELETE", dau: { cookie: nguoiAdmin.cookie }, l: () => lenh("zalo/accounts", "DELETE", null), hd: "zalo.admin", actor: `user:${nguoiAdmin.id}` },
  ]
  for (const c of ca) {
    const n0 = await nAudit()
    const r = await goi(c.route, c.method, c.dau, await c.l())
    assert.ok(r.status >= 200 && r.status < 300, `${c.ten}: ${r.status} ${JSON.stringify(r.json)}`)
    assert.equal((await nAudit()) - n0, 1, `${c.ten}: số dòng audit mới`)
    const d = await dongCuoi()
    assert.equal(d.actor, c.actor, `${c.ten}: actor`)
    assert.equal(d.action, c.hd, `${c.ten}: action`)
    if (c.truocSau) assert.ok("from" in d.detail && "to" in d.detail, `${c.ten}: detail thiếu from/to — ${JSON.stringify(d.detail)}`)
  }
  // Ô không ghi gì: toggle không đổi (tắt nhóm đã tạm dừng), 409 nhóm đã gỡ, 400 thiếu trường.
  const paused = await nhomMoi("paused")
  const retired = await nhomMoi("retired")
  for (const [ten, body, ma] of [
    ["toggle không đổi", { action: "toggle", sourceCode: "S05", groupKey: paused.group_key, enabled: false }, 200],
    ["409 nhóm đã gỡ", { action: "toggle", sourceCode: "S05", groupKey: retired.group_key, enabled: true }, 409],
    ["400 thiếu trường", { action: "add", sourceCode: "S05" }, 400],
    ["nhóm không tồn tại", { action: "toggle", sourceCode: "S05", groupKey: "khong-co", enabled: true }, 200],
  ] as const) {
    const n0 = await nAudit()
    const r = await goi("source-groups", "POST", { cookie: nguoiAdmin.cookie }, { body })
    assert.equal(r.status, ma, `${ten}: mã`)
    assert.equal((await nAudit()) - n0, 0, `${ten}: không được ghi audit`)
  }
  const hang = (await sc.query(`SELECT DISTINCT actor FROM ops_audit`)).rows.map((x) => x.actor as string)
  for (const cu of ["ops-user", "api:zalo-admin", "ops-api"]) assert.ok(!hang.includes(cu), `còn actor hằng ${cu}`)
})

// ---- QV-AC-4: audit hỏng → cả thao tác huỷ; thao tác hỏng → 0 dòng (E4) ----
test("QV-AC-4 INSERT audit hỏng → 500 và bảng giữ nguyên; bước ghi hỏng → 0 dòng; đối chứng: route trước sửa vẫn đổi bảng", async () => {
  const lam: [string, string, string | null][] = [
    ["review/[id]/decide", "POST", null], ["source-groups", "POST", "toggle"], ["source-groups", "POST", "add"], ["source-groups", "POST", "delete"],
  ]
  const nOps = await taoNguoi(sc, "admin")
  await sc.query(`CREATE FUNCTION qv_hong() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'qv-audit-hong'; END $$`)
  await sc.query(`CREATE TRIGGER qv_audit_hong BEFORE INSERT ON ops_audit FOR EACH ROW EXECUTE FUNCTION qv_hong()`)
  try {
    for (const [route, method, action] of lam) {
      const l = await lenh(route, method, action)
      const truoc = await chup()
      const r = await goi(route, method, { cookie: nOps.cookie }, l)
      assert.equal(r.status, 500, `${route} ${action ?? ""}: audit hỏng phải 500 (được ${r.status})`)
      assert.deepEqual(await chup(), truoc, `${route} ${action ?? ""}: audit hỏng mà bảng đã đổi`)
    }
    // Đối chứng: bản trước sửa ghi audit nền ngoài transaction → công tắc vẫn 200 và bảng đã đổi.
    const cu = await napRouteCu("source-groups")
    const n = await nhomMoi()
    const r = await goi("source-groups", "POST", { authorization: `Bearer ${TOKEN}` }, { body: { action: "toggle", sourceCode: "S05", groupKey: n.group_key, enabled: false } }, cu)
    await new Promise((x) => setTimeout(x, 150))
    assert.equal(r.status, 200, "đối chứng: bản trước sửa không trả 200 khi audit hỏng")
    const st = (await sc.query(`SELECT status FROM collection_units WHERE id = $1`, [n.id])).rows[0].status
    assert.equal(st, "paused", "đối chứng: bản trước sửa không đổi bảng — phép đo không phân biệt")
  } finally {
    donBanCu()
    await sc.query(`DROP TRIGGER qv_audit_hong ON ops_audit`)
  }
  // Bước ghi nghiệp vụ hỏng → 0 dòng audit.
  await sc.query(`CREATE TRIGGER qv_the_hong BEFORE UPDATE ON review_queue FOR EACH ROW EXECUTE FUNCTION qv_hong()`)
  await sc.query(`CREATE TRIGGER qv_nhom_hong BEFORE INSERT OR UPDATE OR DELETE ON collection_units FOR EACH ROW EXECUTE FUNCTION qv_hong()`)
  try {
    const ls = []
    for (const [route, method, action] of lam) ls.push([route, method, action, await (async () => {
      await sc.query(`ALTER TABLE collection_units DISABLE TRIGGER qv_nhom_hong`)
      const l = await lenh(route, method, action)
      await sc.query(`ALTER TABLE collection_units ENABLE TRIGGER qv_nhom_hong`)
      return l
    })()] as const)
    for (const [route, method, action, l] of ls) {
      const n0 = await nAudit()
      const r = await goi(route, method, { cookie: nOps.cookie }, l)
      assert.ok(r.status >= 500, `${route} ${action ?? ""}: bước ghi hỏng phải 5xx (được ${r.status})`)
      assert.equal((await nAudit()) - n0, 0, `${route} ${action ?? ""}: bước ghi hỏng mà vẫn có dòng audit`)
    }
  } finally {
    await sc.query(`DROP TRIGGER qv_the_hong ON review_queue`)
    await sc.query(`DROP TRIGGER qv_nhom_hong ON collection_units`)
    await sc.query(`DROP FUNCTION qv_hong()`)
  }
})

// ---- QV-AC-5: việc ngoài DB của zalo.admin (E5) ----
test("QV-AC-5 zalo: việc xong → 1 dòng (kể cả login bật/huỷ); việc lỗi → mã lỗi và 0 dòng", async () => {
  datCfg()
  const A = { cookie: nguoiAdmin.cookie }
  const xong: [string, string, { body?: unknown; query?: string }, string][] = [
    ["zalo/groups", "POST", { body: { accountId: "acc2", groupId: "group:b", enabled: false } }, "group.toggle"],
    ["zalo/accounts", "POST", { body: { id: "qvmoi" } }, "account.create"],
    ["zalo/accounts", "DELETE", { body: { id: "qvmoi" } }, "account.delete"],
    ["zalo/login", "POST", { body: { accountId: "acc2" } }, "login.start"],
    ["zalo/login", "DELETE", { query: "account=acc2" }, "login.cancel"],
  ]
  for (const [route, method, l, thaoTac] of xong) {
    const n0 = await nAudit()
    const r = await goi(route, method, A, l)
    assert.ok(r.status < 300, `${route} ${method}: ${r.status} ${JSON.stringify(r.json)}`)
    assert.equal((await nAudit()) - n0, 1, `${route} ${method}: số dòng audit`)
    const d = await dongCuoi()
    assert.deepEqual([d.actor, d.action, d.detail.thao_tac], [`user:${nguoiAdmin.id}`, "zalo.admin", thaoTac])
  }
  // Huỷ đăng nhập khi không có tiến trình: không có gì để dừng, 0 dòng.
  {
    const n0 = await nAudit()
    const r = await goi("zalo/login", "DELETE", A, { query: "account=acc2" })
    assert.equal(r.status, 200)
    assert.equal((await nAudit()) - n0, 0, "huỷ đăng nhập không tiến trình mà vẫn ghi audit")
  }
  // Việc lỗi: cấu hình không ghi được; tài khoản không hợp lệ cho login.
  chmodSync(CFG, 0o444)
  try {
    for (const [route, method, l] of [
      ["zalo/groups", "POST", { body: { accountId: "acc2", groupId: "group:b", enabled: true } }],
      ["zalo/accounts", "POST", { body: { id: "qvloi" } }],
    ] as const) {
      const n0 = await nAudit()
      const r = await goi(route, method, A, l)
      assert.ok(r.status >= 400, `${route} ${method}: việc lỗi phải ≥ 400 (được ${r.status})`)
      assert.equal((await nAudit()) - n0, 0, `${route} ${method}: việc lỗi mà có dòng audit`)
    }
  } finally {
    chmodSync(CFG, 0o644)
  }
  const n0 = await nAudit()
  const r = await goi("zalo/login", "POST", A, { body: { accountId: "khong-co" } })
  assert.equal(r.status, 400, "login tài khoản lạ phải 400")
  assert.equal((await nAudit()) - n0, 0, "login lỗi mà có dòng audit")
  // Đối chứng: bản trước sửa bật đăng nhập không ghi dòng nào.
  try {
    const cu = await napRouteCu("zalo/login")
    const m0 = await nAudit()
    const rc = await goi("zalo/login", "POST", { authorization: `Bearer ${TOKEN}` }, { body: { accountId: "default" } }, cu)
    assert.ok(rc.status < 300, `đối chứng login: ${rc.status}`)
    assert.equal((await nAudit()) - m0, 0, "đối chứng: bản trước sửa lại có dòng audit — phép đo không phân biệt")
  } finally {
    donBanCu()
  }
})

test("QV-AC-5b audit hỏng → zalo 5xx, tệp cấu hình và nhật ký openclaw giả không đổi", async () => {
  datCfg()
  await sc.query(`CREATE FUNCTION qv_hong5() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'qv-audit-hong'; END $$`)
  await sc.query(`CREATE TRIGGER qv_audit_hong5 BEFORE INSERT ON ops_audit FOR EACH ROW EXECUTE FUNCTION qv_hong5()`)
  try {
    for (const [route, method, l] of [
      ["zalo/groups", "POST", { body: { accountId: "acc2", groupId: "group:b", enabled: false } }],
      ["zalo/accounts", "POST", { body: { id: "qvhong" } }],
      ["zalo/login", "POST", { body: { accountId: "default" } }],
    ] as const) {
      const cfg0 = readFileSync(CFG, "utf8")
      const oc0 = lenhGhi()
      const r = await goi(route, method, { cookie: nguoiAdmin.cookie }, l)
      assert.ok(r.status >= 500, `${route} ${method}: audit hỏng phải 5xx (được ${r.status})`)
      assert.equal(readFileSync(CFG, "utf8"), cfg0, `${route} ${method}: cấu hình đổi khi audit hỏng`)
      assert.equal(lenhGhi(), oc0, `${route} ${method}: openclaw bị gọi khi audit hỏng`)
    }
  } finally {
    await sc.query(`DROP TRIGGER qv_audit_hong5 ON ops_audit`)
    await sc.query(`DROP FUNCTION qv_hong5()`)
  }
})

// ---- QV-AC-6: GET source-groups kiểm bearer trên request thật (E6) ----
test("QV-AC-6 GET source-groups: bearer → 200 có danh sách; không gì → 401; đối chứng: bản trước sửa trả 401 cho bearer", async () => {
  const r = await goi("source-groups", "GET", { authorization: `Bearer ${TOKEN}` }, {})
  assert.equal(r.status, 200)
  assert.ok(Array.isArray(r.json.groups), "body không có mảng groups")
  assert.equal((await goi("source-groups", "GET", {}, {})).status, 401)
  try {
    const cu = await napRouteCu("source-groups")
    assert.equal((await goi("source-groups", "GET", { authorization: `Bearer ${TOKEN}` }, {}, cu)).status, 401)
  } finally {
    donBanCu()
  }
})

// ---- QV-AC-9: sổ bề mặt khớp bảng quyền theo phương thức; bộ kiểm sổ của NT4 xanh (E9) ----
test("QV-AC-9 chế độ sổ của 21 ô route · phương thức khớp thước; check-api-surface mutation thoát 0", async () => {
  const { API_SURFACE } = (await import("../src/lib/api-surface")) as {
    API_SURFACE: { route: string; mode: string; methodModes?: Record<string, string> }[]
  }
  const cheDoMongDoi = (hd: string) =>
    BEARER_DUOC.has(hd) ? "ops" : BAC[VAI_TOI_THIEU[hd]] >= BAC.admin ? "admin" : "ops-session"
  const sai: string[] = []
  for (const [route, method, action, hd] of BANG_ROUTE) {
    const e = API_SURFACE.find((x) => x.route === `v1/ops/${route}`)
    const mode = e ? (e.methodModes?.[method] ?? e.mode) : "(vắng)"
    if (mode !== cheDoMongDoi(hd)) sai.push(`${route} ${method}${action ? ` ${action}` : ""}: sổ ${mode}, bảng ${cheDoMongDoi(hd)}`)
  }
  assert.deepEqual(sai, [])
  execFileSync("node", ["scripts/check-api-surface.mjs", "mutation"], { cwd: join(APP, ".."), stdio: "pipe" })
})

// ---- QV-AC-10: máy đêm nạp số vẫn chạy; chỉ nạp số và đọc số còn dùng bearer chung; ca thử cũ xanh (E10) ----
test("QV-AC-10 push-ops-facts thật → ingest bằng bearer 200, đúng một dòng audit machine:cloud-sync; ca thử cũ của trang nguồn xanh", async () => {
  const { captureOpsFacts } = await import("../../pipeline/scripts/capture-ops-facts.mjs")
  const { dropOpsSchema, makeOpsSchema } = await import("../../pipeline/scripts/ops-facts-fixture.mjs")
  const SL = `qv_local_${process.pid}`
  await makeOpsSchema(admin, SL)
  let payload: unknown
  try {
    const r = (await captureOpsFacts({ env: { DATABASE_URL: schemaUrl(SL) } })) as { code: number; stderr: string; payload: unknown }
    assert.equal(r.code, 0, r.stderr)
    payload = r.payload
  } finally {
    await dropOpsSchema(admin, SL)
  }
  const n0 = await nAudit()
  const r = await goi("ingest", "POST", { authorization: `Bearer ${TOKEN}` }, { body: payload })
  assert.equal(r.status, 200, JSON.stringify(r.json))
  assert.equal((await sc.query("SELECT count(*)::int AS n FROM ops_heartbeat WHERE id = 'primary'")).rows[0].n, 1)
  assert.equal((await nAudit()) - n0, 1)
  assert.deepEqual([(await dongCuoi()).actor, (await dongCuoi()).action], ["machine:cloud-sync", "ingest.push"])
  // Ca thử cũ (route ghi gọi bằng phiên thật) — tiến trình con riêng, không thừa hưởng ngữ cảnh node:test của tệp này.
  const env: NodeJS.ProcessEnv = { ...process.env }
  delete env.NODE_TEST_CONTEXT
  delete env.DATABASE_URL
  delete env.OPS_API_TOKEN
  for (const t of ["cong-tac-nhom-go", "vong-doi-nguon", "so-nhom", "che-do-thu", "coverage-cloud-got-tang-a"]) {
    const kq = spawnSync("node", ["--import", "tsx", "--test", `tests/${t}.test.tsx`], { cwd: APP, env, encoding: "utf8" })
    assert.equal(kq.status, 0, `${t}: ${kq.stdout.slice(-1500)}`)
  }
})

/** Tệp chạy thật (ngoài route, ca thử, hồ sơ, tài liệu) vừa đọc token chung vừa gọi /api/v1/ops/: (tệp, route) mỗi cặp. */
function quetBearer(goc: string, them: Record<string, string> = {}): string[] {
  const tep = execFileSync("git", ["ls-files"], { cwd: goc, encoding: "utf8" })
    .split("\n")
    .filter((f) => f && !/^(app\/src\/app\/api\/|app\/tests\/|_acceptance\/|docs\/)/.test(f) && !/\.(md|html|json)$/.test(f))
  const doc: Record<string, string> = { ...them }
  for (const f of tep) {
    try {
      doc[f] = readFileSync(join(goc, f), "utf8")
    } catch {
      /* tệp đã xoá khỏi cây làm việc */
    }
  }
  const cap: string[] = []
  for (const [f, t] of Object.entries(doc)) {
    if (!t.includes("OPS_API_TOKEN") || f === "app/src/lib/ops-access.ts") continue
    for (const m of t.matchAll(/\/api\/v1\/ops\/([a-z-]+)/g)) cap.push(`${f} → ${m[1]}`)
  }
  return [...new Set(cap)].sort()
}
test("QV-AC-10b mọi chỗ gọi /api/v1/ops bằng token chung chỉ nhắm route nạp số / đọc số; đối chứng: tệp gọi source-groups bằng token bị bắt", () => {
  const DUOC = new Set(["ingest", "collections", "coverage", "extraction-quality", "truthful-coverage"])
  const goc = join(APP, "..")
  // smoke-api-matrix là bộ khói của sổ bề mặt: đi qua MỌI route bằng bearer để đo chính cổng này.
  const sai = quetBearer(goc).filter((x) => !DUOC.has(x.split(" → ")[1]) && !x.startsWith("scripts/smoke-api-matrix.mjs"))
  assert.deepEqual(sai, [])
  const gia = quetBearer(goc, { "scripts/gia-goi-nhom.mjs": 'fetch(`${U}/api/v1/ops/source-groups`, { method: "POST", headers: { authorization: `Bearer ${process.env.OPS_API_TOKEN}` } })' })
  assert.ok(gia.includes("scripts/gia-goi-nhom.mjs → source-groups"), "phép quét không bắt được tệp gọi source-groups bằng token chung")
})
