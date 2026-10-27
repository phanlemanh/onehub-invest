// go-tai-khoan-kiem-cfg.test.tsx — gỡ tài khoản Zalo kiểm bản cấu hình SAU khi gỡ TRƯỚC lệnh `openclaw channels logout`
// (ON24 Ngoài-1: cấu hình đang phạm bất biến bộ canh → writeCfg ném sau khi phiên đã đăng xuất — gỡ nửa chừng).
// Hồ sơ nghiệm thu: _acceptance/go-tai-khoan-kiem-cfg-truoc-logout (AC-1…AC-6). Tên ca mở đầu bằng mã AC (GC-AC-n).
//
// An toàn Zalo (.claude/rules/zalo-safety.md): CHỈ openclaw giả. Khung của go-tai-khoan-kiem-id.test.tsx: HOME và PATH
// trỏ thư mục tạm, openclaw giả ghi argv mỗi lần được gọi thành một dòng vào spy.log, cấu hình chép trong thư mục tạm.
// Tệp KHÔNG import tĩnh zalo-admin hay route — hằng OPENCLAW/CONFIG tính từ homedir() lúc nạp module.
import { after, before, test } from "node:test"
import assert from "node:assert/strict"
import { chmodSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, realpathSync, rmSync, writeFileSync } from "node:fs"
import { homedir, tmpdir } from "node:os"
import { dirname, join, resolve } from "node:path"
import { fileURLToPath } from "node:url"
import { luocDoPhienAdmin } from "./helpers/phien-thu"

type Paths = { openclaw: string; config: string }
type Admin = {
  zaloAdminPaths: () => Paths
  zaloConfigViolations: (cfg: unknown) => string[]
  deleteZaloAccount: (accountId: string) => Promise<void>
}
type Route = { DELETE: (req: Request) => Promise<Response> }
type Cfg = Record<string, any> // eslint-disable-line @typescript-eslint/no-explicit-any

const SELF = fileURLToPath(import.meta.url)
const APP = resolve(dirname(SELF), "..")
const ADMIN_SRC = join(APP, "src/lib/zalo-admin.ts")
const HOME_THAT = process.env.HOME ?? homedir()
const ENV_KEYS = ["HOME", "PATH", "OPS_API_TOKEN", "DATABASE_URL"] as const
const envCu: Partial<Record<(typeof ENV_KEYS)[number], string>> = {}
const LOI = "Cấu hình Zalo không an toàn, không ghi (luật 8)"

/** Cấu hình sạch: ba tài khoản, mỗi nhóm bật đều requireMention true. */
const sach = (): Cfg => ({
  channels: {
    zalouser: {
      enabled: true,
      accounts: {
        default: { enabled: true, groupPolicy: "allowlist", groups: { g1: { enabled: true, requireMention: true } } },
        acc2: { enabled: true, groupPolicy: "allowlist", groups: { g2: { enabled: true, requireMention: true } } },
        acc3: { enabled: true, groups: {} },
      },
    },
  },
})
const acc = (c: Cfg) => c.channels.zalouser.accounts

/** Ma trận viết trước: mỗi lớp của zaloConfigViolations một dòng, vi phạm nằm NGOÀI tài khoản bị gỡ (acc2). */
const MA_TRAN: [string, (c: Cfg) => void][] = [
  ["L2", (c) => void (c.bindings = [{ agentId: "x", match: { channel: "zalouser" } }])],
  ["L3", (c) => void (c.channels.zalo = { enabled: true })],
  ["groupPolicy", (c) => void (acc(c).default.groupPolicy = "open")],
  ["L3b", (c) => void (acc(c).default.groups.g1.requireMention = false)],
  ["hỏng", (c) => void (acc(c).acc3 = "x")],
]

let phien: { url: string; cookie: string; don: () => Promise<void> } | undefined

let tmp = ""
let spyLog = ""
let cfgPath = ""
let admin: Admin
let route: Route

const thuc = (p: string) => {
  try {
    return realpathSync(p)
  } catch {
    return resolve(p)
  }
}

/** Rào an toàn: HOME và hai đường mà module dùng phải nằm dưới thư mục tạm. Sai → ném, không ca nào chạy. */
function assertRao(goc: string, paths: Paths, home: string = homedir()): void {
  const g = thuc(goc) + "/"
  for (const [ten, p] of [["HOME", home], ["openclaw", paths.openclaw], ["config", paths.config]] as const) {
    if (!(thuc(p) + "/").startsWith(g)) throw new Error(`rào: HOME thật — ${ten} ${p} nằm ngoài thư mục tạm ${goc}`)
  }
}

const datCfg = (c: Cfg) => {
  writeFileSync(cfgPath, JSON.stringify(c, null, 2))
  rmSync(spyLog, { force: true })
}
const spy = (): string[] => {
  try {
    return readFileSync(spyLog, "utf8").split("\n").filter((l) => l.length > 0)
  } catch {
    return []
  }
}
const cfgBytes = () => readFileSync(cfgPath, "utf8")
const cfgNay = (): Cfg => JSON.parse(cfgBytes()) as Cfg
const soBak = () => readdirSync(dirname(cfgPath)).filter((f) => f.startsWith("openclaw.json.bak-")).length
const logoutLine = (id: string) => ["channels", "logout", "--channel", "zalouser", "--account", id].join("\t") + "\t"

async function del(id: string): Promise<{ status: number; json: { ok?: boolean; error?: string } }> {
  const res = await route.DELETE(
    new Request("http://localhost/api/v1/ops/zalo/accounts", {
      method: "DELETE",
      headers: { cookie: phien!.cookie, "content-type": "application/json" },
      body: JSON.stringify({ id }),
    }),
  )
  return { status: res.status, json: (await res.json()) as { ok?: boolean; error?: string } }
}

before(async () => {
  tmp = mkdtempSync(join(tmpdir(), "go-tk-cfg-"))
  spyLog = join(tmp, "spy.log")
  const home = join(tmp, "home")
  const script = `#!/bin/sh\nfor a in "$@"; do printf '%s\\t' "$a"; done >> "${spyLog}"\nprintf '\\n' >> "${spyLog}"\n`
  for (const dir of [join(home, ".openclaw", "bin"), join(tmp, "bin")]) {
    mkdirSync(dir, { recursive: true })
    writeFileSync(join(dir, "openclaw"), script)
    chmodSync(join(dir, "openclaw"), 0o755)
  }
  cfgPath = join(home, ".openclaw", "openclaw.json")
  datCfg(sach())

  for (const k of ENV_KEYS) envCu[k] = process.env[k]
  process.env.HOME = home
  process.env.PATH = `${join(tmp, "bin")}:${process.env.PATH ?? ""}`
  process.env.OPS_API_TOKEN = "T"
  // Route đọc phiên và ghi audit trong DB (TV1): một lược đồ tạm chỉ có users/sessions/ops_audit — không chạm public.
  phien = await luocDoPhienAdmin("gc")
  process.env.DATABASE_URL = phien.url

  admin = (await import("../src/lib/zalo-admin")) as Admin
  assertRao(tmp, admin.zaloAdminPaths())
  route = (await import("../src/app/api/v1/ops/zalo/accounts/route")) as Route
})

after(async () => {
  for (const k of ENV_KEYS) {
    if (envCu[k] === undefined) delete process.env[k]
    else process.env[k] = envCu[k]
  }
  const { pool } = await import("../src/lib/db")
  await pool.end().catch(() => {})
  await phien?.don()
  if (tmp) rmSync(tmp, { recursive: true, force: true })
})

test("GC-AC-5 rào: homedir, zaloAdminPaths().openclaw/.config dưới thư mục tạm; DATABASE_URL lược đồ tạm; không import tĩnh", () => {
  const p = admin.zaloAdminPaths()
  assertRao(tmp, p)
  assert.equal(thuc(p.config), thuc(cfgPath))
  assert.match(decodeURIComponent(process.env.DATABASE_URL ?? ""), /search_path=[a-z]+_\d+$/, "DATABASE_URL không trỏ lược đồ tạm")
  const src = readFileSync(SELF, "utf8")
  assert.doesNotMatch(src, /^import[^\n]*["']\.\.\/src\/(lib\/zalo-admin|app\/api)/m, "import tĩnh zalo-admin/route")
  // Đối chứng: rào với HOME thật ném, thông điệp nêu HOME thật.
  const that = { openclaw: join(HOME_THAT, ".openclaw/bin/openclaw"), config: join(HOME_THAT, ".openclaw/openclaw.json") }
  assert.throws(() => assertRao(tmp, that, HOME_THAT), /HOME thật/)
})

test("GC-AC-1 ma trận 5 lớp vi phạm ở phần còn lại → 400 đúng lớp, openclaw giả 0 lệnh, cấu hình giữ nguyên byte, acc2 còn", async () => {
  let dem = 0
  for (const [lop, phạm] of MA_TRAN) {
    const c = sach()
    phạm(c)
    datCfg(c)
    // Tiền đề: dòng ma trận phạm đúng lớp của nó (nếu không, ca 400 có thể đến từ lý do khác).
    assert.ok(admin.zaloConfigViolations(c).some((v) => v.startsWith(`${lop}:`)), `${lop}: fixture không phạm lớp`)
    const truoc = cfgBytes()
    const r = await del("acc2")
    assert.equal(r.status, 400, `${lop}: ${JSON.stringify(r.json)}`)
    // Nhãn rút từ bộ kiểm thật trên bản SẼ ghi (đã bỏ acc2), không viết tay.
    const sauGo = structuredClone(c)
    delete acc(sauGo).acc2
    const vp = admin.zaloConfigViolations(sauGo)
    assert.ok(vp.some((v) => v.startsWith(`${lop}:`)), `${lop}: bản sau khi gỡ không phạm lớp`)
    assert.equal(r.json.error, `${LOI}: ${vp.join("; ")}`, `${lop}: thông điệp`)
    assert.deepEqual(spy(), [], `${lop}: openclaw giả nhận lệnh`)
    assert.equal(cfgBytes(), truoc, `${lop}: cấu hình bị đổi`)
    assert.ok("acc2" in acc(cfgNay()), `${lop}: acc2 bị gỡ`)
    dem++
  }
  assert.equal(dem, 5, "số dòng ma trận")
  // Ma trận toàn phần: tập nhãn 5 dòng = tập lớp bộ kiểm trả cho một fixture gộp đủ năm vi phạm.
  const gop = sach()
  for (const [, phạm] of MA_TRAN) phạm(gop)
  const nhan = new Set(admin.zaloConfigViolations(gop).map((v) => v.slice(0, v.indexOf(":"))))
  assert.deepEqual([...nhan].sort(), MA_TRAN.map(([lop]) => lop).sort(), "tập lớp lệch ma trận")
})

test("GC-AC-2 cấu hình sạch → 200, đúng một lệnh logout acc2, acc2 bị gỡ, phần còn lại sạch, có bản sao lưu", async () => {
  datCfg(sach())
  const bak = soBak()
  const r = await del("acc2")
  assert.equal(r.status, 200, JSON.stringify(r.json))
  assert.deepEqual(spy(), [logoutLine("acc2")])
  const sau = cfgNay()
  assert.ok(!("acc2" in acc(sau)), "acc2 còn")
  assert.ok("default" in acc(sau) && "acc3" in acc(sau), "default/acc3 bị đụng")
  assert.deepEqual(admin.zaloConfigViolations(sau), [])
  assert.ok(soBak() > bak, "không có bản sao lưu mới")
})

test("GC-AC-3 vi phạm chỉ ở chính acc2 → 200, logout đúng một lần, cấu hình sau sạch", async () => {
  const c = sach()
  acc(c).acc2.groups.g2.requireMention = false
  datCfg(c)
  // Đối chứng: cấu hình TRƯỚC khi gỡ thật sự phạm.
  assert.ok(admin.zaloConfigViolations(c).some((v) => v.startsWith("L3b:")), "fixture không phạm L3b")
  const r = await del("acc2")
  assert.equal(r.status, 200, JSON.stringify(r.json))
  assert.deepEqual(spy(), [logoutLine("acc2")])
  const sau = cfgNay()
  assert.ok(!("acc2" in acc(sau)))
  assert.deepEqual(admin.zaloConfigViolations(sau), [])
})

test("GC-AC-4 bản sao không bước kiểm trước logout → openclaw giả nhận logout acc2 trên cấu hình phạm L3b", async () => {
  const goc = readFileSync(ADMIN_SRC, "utf8")
  const sao = goc.replace("  assertZaloCfgSafe(withoutAccount(cfg, accountId));\n", "")
  assert.ok(sao !== goc, "đột biến không đổi gì — dòng kiểm không có trong zalo-admin.ts")
  const dir = join(tmp, "mut-bo-kiem-cfg")
  mkdirSync(dir, { recursive: true })
  writeFileSync(join(dir, "zalo-admin.ts"), sao)
  const mut = (await import(join(dir, "zalo-admin.ts"))) as Admin
  // Rào TRƯỚC khi gọi: ca duy nhất thật sự phát lệnh logout không được chạm openclaw thật.
  assertRao(tmp, mut.zaloAdminPaths())

  const c = sach()
  MA_TRAN.find(([lop]) => lop === "L3b")![1](c)
  datCfg(c)
  await mut.deleteZaloAccount("acc2").catch(() => {}) // writeCfg vẫn ném sau logout — đúng hành vi gỡ nửa chừng
  assert.ok(
    spy().includes(logoutLine("acc2")),
    `bản sao không bước kiểm vẫn đăng xuất — spy: ${JSON.stringify(spy())}`,
  )
  datCfg(sach())
})
