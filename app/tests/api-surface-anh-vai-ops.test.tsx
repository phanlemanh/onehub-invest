// api-surface-anh-vai-ops.test.tsx — hồ sơ _acceptance/api-surface-anh-vai-ops: sổ bề mặt API khai /api/zalo-media rộng
// bằng hoặc hơn quyền thật sau PL3 (ảnh snapshot cho vai Vận hành). Tên ca mở đầu bằng mã AC (ASO-AC-n). Ma trận người
// gọi × chế độ chạy trên lõi serveZaloMedia thật với ảnh trong thư mục tạm; cổng của sổ đọc từ chế độ khai trong
// API_SURFACE. Mỗi phép đo có chiều đỏ trên cùng dữ liệu, thông điệp ghim.
import { after, before, test } from "node:test"
import assert from "node:assert/strict"
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import path, { join } from "node:path"
import { fileURLToPath } from "node:url"

import type { User } from "../src/lib/auth"
import { API_SURFACE, type ApiMode, type ApiSurfaceEntry } from "../src/lib/api-surface"
import { canAccessOps, isAdmin } from "../src/lib/ops-access"
import { serveZaloMedia } from "../src/lib/ops/zalo-media"

const APP = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
const SNAP = "hcmc__zalo-agent__2026-10-23T000000"
const JPG = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 1, 2, 3, 4, 5])
const nguoi = (role: User["role"]): User => ({ id: "1", email: `${role}@x.vn`, plan: "pro", role })

let tmp = ""
let env: { HOME?: string; SNAPSHOTS_DIR?: string } = {}
before(() => {
  tmp = mkdtempSync(join(tmpdir(), "aso-"))
  mkdirSync(join(tmp, "snapshots", "hcmc", SNAP, "media"), { recursive: true })
  writeFileSync(join(tmp, "snapshots", "hcmc", SNAP, "media", "a.jpg"), JPG)
  mkdirSync(join(tmp, "home", ".openclaw", "media", "inbound"), { recursive: true })
  writeFileSync(join(tmp, "home", ".openclaw", "media", "inbound", "x.jpg"), JPG)
  env = { HOME: process.env.HOME, SNAPSHOTS_DIR: process.env.SNAPSHOTS_DIR }
  process.env.HOME = join(tmp, "home")
  process.env.SNAPSHOTS_DIR = join(tmp, "snapshots")
})
after(() => {
  for (const [k, v] of Object.entries(env)) {
    if (v === undefined) delete process.env[k]
    else process.env[k] = v
  }
  rmSync(tmp, { recursive: true, force: true })
})

const dongZaloMedia = (so: ApiSurfaceEntry[] = API_SURFACE) => so.find((e) => e.route === "zalo-media")!

// ---------- ASO-AC-1 ----------
/** Ba quan hệ viết trước, mỗi quan hệ phải nằm trong CÙNG một mệnh đề (tách bằng «;») của một đoạn chữ. */
const QUAN_HE: [string, string, string][] = [
  ["snapshot", "vai Vận hành", "snapshot↔vai Vận hành"],
  ["?path=", "admin", "?path=↔admin"],
  ["Người xem", "404", "Người xem↔404"],
]
const cungMenhDe = (chu: string, a: string, b: string) => chu.split(";").some((m) => m.includes(a) && m.includes(b))
function kiemAc1(e: ApiSurfaceEntry) {
  assert.equal(e.mode, "ops-session", "ASO-AC-1: zalo-media phải khai ops-session")
  assert.deepEqual(e.methods, ["GET"], "ASO-AC-1: zalo-media chỉ GET")
  for (const [a, b, ten] of QUAN_HE) assert.ok(cungMenhDe(e.note, a, b), `ASO-AC-1: note phải gắn ${ten}`)
}
test("ASO-AC-1 sổ khai zalo-media ops-session, note gắn đúng chế độ với vai", () => {
  const e = dongZaloMedia()
  kiemAc1(e)
  assert.throws(() => kiemAc1({ ...e, mode: "admin" }), /ASO-AC-1: zalo-media phải khai ops-session/)
  const dao = e.note.replace("cho vai Vận hành trở lên", "@@").replace("chỉ admin", "cho vai Vận hành trở lên").replace("@@", "chỉ admin")
  assert.notEqual(dao, e.note, "đột biến đảo cặp không đổi gì — đối chứng vô nghĩa")
  assert.throws(() => kiemAc1({ ...e, note: dao }), /ASO-AC-1: note phải gắn snapshot↔vai Vận hành/)
})

// ---------- ASO-AC-2 ----------
// Cổng của từng chế độ sổ, đúng định nghĩa ở đầu api-surface.ts (bearer = máy có OPS_API_TOKEN, không phiên).
const congSo = (mode: ApiMode, u: User | null, bearer: boolean): boolean =>
  mode === "public" ? true
  : mode === "ops" ? bearer || canAccessOps(u)
  : mode === "ops-session" ? !bearer && canAccessOps(u)
  : mode === "admin" ? !bearer && isAdmin(u)
  : u !== null

type NguoiGoi = { ten: string; u: User | null; bearer: boolean }
// Ma trận viết trước: 6 người gọi × 2 chế độ = 12 ô; ô mã cho qua ghim sẵn.
const NGUOI_GOI: NguoiGoi[] = [
  { ten: "khách", u: null, bearer: false },
  { ten: "user", u: nguoi("user"), bearer: false },
  { ten: "viewer", u: nguoi("viewer"), bearer: false },
  { ten: "ops", u: nguoi("ops"), bearer: false },
  { ten: "admin", u: nguoi("admin"), bearer: false },
  { ten: "bearer", u: null, bearer: true },
]
const CHE_DO = {
  snapshot: `snapshot=${encodeURIComponent(SNAP)}&file=${encodeURIComponent("media/a.jpg")}`,
  path: () => `path=${encodeURIComponent(join(tmp, "home", ".openclaw", "media", "inbound", "x.jpg"))}`,
}
const MA_CHO: Record<string, [boolean, boolean]> = {
  khách: [false, false], user: [false, false], viewer: [false, false], ops: [true, false], admin: [true, true], bearer: [false, false],
}
async function kiemAc2(mode: ApiMode) {
  let o = 0
  for (const g of NGUOI_GOI) {
    for (const [i, [ten, qs]] of ([["snapshot", CHE_DO.snapshot], ["path", CHE_DO.path()]] as const).entries()) {
      const headers = g.bearer ? { authorization: "Bearer thu" } : undefined
      const r = await serveZaloMedia(new Request(`http://localhost:3456/api/zalo-media?${qs}`, { headers }), g.u)
      const maCho = r.status === 200
      assert.equal(maCho, MA_CHO[g.ten][i], `ASO-AC-2: mã đổi quyền ở ô ${g.ten} × ${ten} (status ${r.status})`)
      if (maCho) assert.ok(congSo(mode, g.u, g.bearer), `ASO-AC-2: mã cho ${g.ten} × ${ten} mà sổ (${mode}) không cho`)
      o++
    }
  }
  assert.equal(o, 12)
  // Mã chặt hơn sổ đúng chỗ note khai: viewer qua cổng sổ nhưng mã trả 404 ở cả hai chế độ.
  assert.ok(congSo(mode, nguoi("viewer"), false) || mode === "admin", "ASO-AC-2: viewer phải qua cổng sổ ops-session")
}
test("ASO-AC-2 ma trận 6 người gọi × 2 chế độ: mọi ô mã cho qua đều qua cổng của sổ", async () => {
  await kiemAc2(dongZaloMedia().mode)
  // Chiều đỏ trên cùng ma trận: sổ cũ (admin) hẹp hơn mã ở ô ops × snapshot.
  await assert.rejects(kiemAc2("admin"), /ASO-AC-2: mã cho ops × snapshot mà sổ \(admin\) không cho/)
})

// ---------- ASO-AC-3 ----------
const ROUTE = "src/app/api/zalo-media/route.ts"
function kiemAc3(src: string) {
  const ma = src.replace(/\/\*[\s\S]*?\*\/|\/\/[^\n]*/g, "")
  assert.equal((ma.match(/getSessionUser\(\)/g) ?? []).length, 1, "ASO-AC-3: route phải đọc phiên đúng một lần")
  const cong = ma.indexOf("if (!canAccessOps(user)) return")
  const chuyen = ma.indexOf("serveZaloMedia(req, user)")
  assert.ok(cong >= 0 && chuyen > cong, "ASO-AC-3: route phải chặn canAccessOps trước khi chuyển phiên cho lõi")
  assert.ok(!/readFile|realpath|stat\(/.test(ma), "ASO-AC-3: route không được đọc tệp")
  const doc = src.slice(src.indexOf("/**"), src.indexOf("*/"))
  assert.ok(!doc.includes("GET /api/zalo-media — ảnh tin (tầng A) cho trang /ops, chỉ admin."), "ASO-AC-3: docstring còn dòng cũ «chỉ admin»")
  // Mỗi dòng docstring là một mệnh đề: chế độ và vai phải cùng dòng.
  const dong = doc.split("\n")
  assert.ok(dong.some((d) => d.includes("?snapshot=") && d.includes("vai Vận hành")), "ASO-AC-3: docstring phải gắn ?snapshot= với vai Vận hành")
  assert.ok(dong.some((d) => d.includes("?path=") && d.includes("admin")), "ASO-AC-3: docstring phải gắn ?path= với admin")
}
test("ASO-AC-3 route đọc phiên một lần, chặn canAccessOps trước lõi, docstring đúng quyền", () => {
  const src = readFileSync(path.join(APP, ROUTE), "utf8")
  kiemAc3(src)
  const bo = src.replace(/\s*if \(!canAccessOps\(user\)\) return [^\n]*\n/, "\n")
  assert.notEqual(bo, src, "đột biến không đổi gì — đối chứng vô nghĩa")
  assert.throws(() => kiemAc3(bo), /ASO-AC-3: route phải chặn canAccessOps trước khi chuyển phiên cho lõi/)
})

// ---------- ASO-AC-3b (handler GET của route) ----------
// Bản chép route chỉ thay dòng import getSessionUser bằng hàm trả người gọi của ô; mọi dòng khác giữ nguyên.
const CHEP: string[] = []
after(() => {
  for (const f of CHEP) rmSync(f, { force: true })
})
type RouteMod = { GET: (req: Request) => Promise<Response> }
const g = globalThis as unknown as { __ASO_NGUOI: User | null }
async function chepRoute(doi: (s: string) => string = (s) => s): Promise<RouteMod> {
  const goc = readFileSync(path.join(APP, ROUTE), "utf8")
  const sau = doi(goc).replace(
    'import { getSessionUser } from "@/lib/auth";',
    "const getSessionUser = async () => (globalThis as unknown as { __ASO_NGUOI: unknown }).__ASO_NGUOI as never;",
  )
  assert.notEqual(sau, goc, "bản chép route không thay được dòng import getSessionUser")
  const f = path.join(APP, "tests", `.aso-cu-${process.pid}-${CHEP.length}.ts`)
  writeFileSync(f, sau)
  CHEP.push(f)
  return (await import(f)) as RouteMod
}
// Ma trận viết trước: 5 vai × ?snapshot=; status ghim trước.
const VAI_ROUTE: [string, User | null, 200 | 404][] = [
  ["khách", null, 404],
  ["user", nguoi("user"), 404],
  ["viewer", nguoi("viewer"), 404],
  ["ops", nguoi("ops"), 200],
  ["admin", nguoi("admin"), 200],
]
async function kiemAc3b(route: RouteMod) {
  const url = `http://localhost:3456/api/zalo-media?${CHE_DO.snapshot}`
  const loi404 = await (await serveZaloMedia(new Request(url), null)).text()
  for (const [ten, u, ma] of VAI_ROUTE) {
    g.__ASO_NGUOI = u
    const r = await route.GET(new Request(url))
    if (ma === 404) {
      assert.equal(r.status, 404, "ASO-AC-3b: route phải chặn bằng 404 như lõi")
      assert.equal(await r.text(), loi404, `ASO-AC-3b: thân 404 của route ở vai ${ten} khác lõi`)
    } else {
      assert.equal(r.status, 200, `ASO-AC-3b: vai ${ten} phải nhận ảnh (status ${r.status})`)
      assert.equal(r.headers.get("content-type"), "image/jpeg", `ASO-AC-3b: vai ${ten} nhận sai loại nội dung`)
    }
  }
  assert.equal(VAI_ROUTE.length, 5)
}
test("ASO-AC-3b handler GET: khách/user/viewer 404 trùng lõi, ops/admin nhận ảnh", async () => {
  await kiemAc3b(await chepRoute())
  const sai = await chepRoute((s) => s.replace('if (!canAccessOps(user)) return new Response("not found", { status: 404 });', 'if (!canAccessOps(user)) return new Response("forbidden", { status: 403 });'))
  await assert.rejects(kiemAc3b(sai), /ASO-AC-3b: route phải chặn bằng 404 như lõi/)
})
