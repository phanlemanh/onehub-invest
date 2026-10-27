// nhom-moi-requiremention.test.tsx — tick bật nhóm trên /ops/sources luôn ghi requireMention true, và bộ ghi cấu hình
// OpenClaw (writeCfg) từ chối mọi bản cấu hình phạm bất biến của bộ canh TRƯỚC khi ghi (luật 8; gateway nạp nóng < 1 giây,
// bộ canh chỉ bắt sau ≤ 5 phút — chuỗi sự cố 22/10). Hồ sơ nghiệm thu: _acceptance/nhom-moi-requiremention (AC-1…AC-8;
// AC-9 là test ON14 + login-kiem-id + typecheck/lint). Tên ca mở đầu bằng mã AC (NM-AC-n).
//
// An toàn Zalo (.claude/rules/zalo-safety.md): CHỈ cấu hình chép trong thư mục tạm và openclaw giả. HOME, PATH trỏ thư mục
// tạm, DATABASE_URL trỏ cổng đóng; openclaw giả ghi argv mỗi lần được gọi vào spy.log. Tệp KHÔNG import tĩnh zalo-admin
// hay route (hằng CONFIG tính lúc nạp module); mọi bản sao đột biến nạp qua napBanSao(), mọi lượt chạy đoạn trích bộ canh
// qua chayTrich() — cả hai chạy rào trước. Không bao giờ chạy cả zalo-watchdog.sh (hàm alert của nó tắt gateway thật).
import { after, before, test } from "node:test"
import assert from "node:assert/strict"
import { createHash } from "node:crypto"
import { execFileSync, spawnSync } from "node:child_process"
import { chmodSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, realpathSync, rmSync, writeFileSync } from "node:fs"
import { homedir, tmpdir } from "node:os"
import { basename, dirname, join, resolve } from "node:path"
import { fileURLToPath } from "node:url"
import { luocDoPhienAdmin } from "./helpers/phien-thu"

type Paths = { openclaw: string; config: string }
type Acc = { accountId: string; enabledGroups: string[] }
type Admin = {
  zaloAdminPaths: () => Paths
  zaloConfigViolations: (cfg: unknown) => string[]
  listZaloAccounts: () => Promise<Acc[]>
  setZaloGroupEnabled: (accountId: string, groupId: string, enabled: boolean) => Promise<{ conflictWith: string | null }>
  createZaloAccount: (accountId: string) => Promise<unknown>
  deleteZaloAccount: (accountId: string) => Promise<void>
}
type Route = { POST: (req: Request) => Promise<Response> }
type Obj = Record<string, unknown>

const APP = resolve(dirname(fileURLToPath(import.meta.url)), "..")
const ADMIN_REL = "app/src/lib/zalo-admin.ts"
const ADMIN_SRC = join(APP, "src/lib/zalo-admin.ts")
const WATCHDOG = join(APP, "..", "scripts/zalo-watchdog.sh")
const HOME_THAT = process.env.HOME ?? homedir()
const PATH_GOC = process.env.PATH ?? ""
const ENV_KEYS = ["HOME", "PATH", "OPS_API_TOKEN", "DATABASE_URL"] as const
const envCu: Partial<Record<(typeof ENV_KEYS)[number], string>> = {}
// Băm đoạn trích bộ canh (L2 + khối python L3/L3b). Bộ canh đổi → ca NM-AC-5 đỏ: soát lại zaloConfigViolations rồi ghim lại.
const BAM_TRICH = "091b4b2ea999b94b41c0a54f44f17769abe5a0d4e4bb825b449e26878c6dcc68"

const ON = { enabled: true, requireMention: true }

/** Bố cục chuẩn: default có accounts.default kèm groups riêng, acc2 có groups riêng — sạch. */
const sach = (): Obj => ({
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
})
/** default có accounts.default KHÔNG groups riêng — đang kế thừa groups cấp channel. */
const keThua = (): Obj => {
  const c = sach()
  datDuong(c, ["channels", "zalouser", "groups"], { "group:a": { ...ON } })
  datDuong(c, ["channels", "zalouser", "accounts", "default", "groups"], XOA)
  return c
}
/** Layout cũ: groups cấp channel, không accounts. */
const cu = (): Obj => ({ channels: { zalouser: { enabled: true, groups: { "group:a": { ...ON } } } } })

const XOA = Symbol("xoá")
/** Đặt (hoặc xoá bằng XOA) một giá trị theo đường khoá trong object — dựng ma trận cấu hình. */
function datDuong(o: Obj, duong: string[], v: unknown): Obj {
  let cur: Obj = o
  for (const k of duong.slice(0, -1)) {
    if (typeof cur[k] !== "object" || cur[k] === null) cur[k] = {}
    cur = cur[k] as Obj
  }
  const cuoi = duong[duong.length - 1]
  if (v === XOA) delete cur[cuoi]
  else cur[cuoi] = v
  return o
}
const voi = (goc: () => Obj, duong: string[], v: unknown) => () => datDuong(goc(), duong, v)

const G_DEF = ["channels", "zalouser", "accounts", "default", "groups"]
const G_ACC2 = ["channels", "zalouser", "accounts", "acc2", "groups"]
const ZU = ["channels", "zalouser"]

let phien: { url: string; cookie: string; don: () => Promise<void> } | undefined

let tmp = ""
let home = ""
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

/** Rào an toàn: HOME, CLI và config mà module dùng phải nằm dưới thư mục tạm. Sai → ném, không ca nào chạy. */
function assertRao(goc: string, paths: Paths, h: string = homedir()): void {
  const g = thuc(goc) + "/"
  const ds: [string, string][] = [["HOME", h], ["openclaw", paths.openclaw], ["config", paths.config]]
  for (const [ten, p] of ds) {
    if (typeof p !== "string" || !(thuc(p) + "/").startsWith(g)) {
      throw new Error(`rào: đường lạc — ${ten} ${String(p)} nằm ngoài thư mục tạm ${goc}`)
    }
  }
  if (!/search_path=[a-z]+_\d+$/.test(decodeURIComponent(process.env.DATABASE_URL ?? ""))) throw new Error("rào: đường lạc — DATABASE_URL không trỏ lược đồ tạm")
}

/** Rào cho đoạn trích bộ canh: không lệnh tắt gateway, không biến shell; tệp đưa cho python nằm dưới thư mục tạm. */
function assertRaoTrich(code: string, tep: string, h: string): void {
  const cam = /alert|pkill|launchctl|osascript|\$/.exec(code)
  if (cam) throw new Error(`rào: đường lạc — đoạn trích bộ canh chứa «${cam[0]}»`)
  const g = thuc(tmp) + "/"
  for (const [ten, p] of [["tệp python", tep], ["HOME python", h]] as const) {
    // tệp có thể chưa tồn tại: realpath thư mục cha (/var ↔ /private/var trên macOS)
    if (!(join(thuc(dirname(p)), basename(p)) + "/").startsWith(g)) throw new Error(`rào: đường lạc — ${ten} ${p} nằm ngoài thư mục tạm`)
  }
}

const ghiCfg = (cfg: unknown) => writeFileSync(cfgPath, JSON.stringify(cfg, null, 2))
const docCfg = (): Obj => JSON.parse(readFileSync(cfgPath, "utf8")) as Obj
const byteCfg = () => readFileSync(cfgPath)
const baks = () => readdirSync(dirname(cfgPath)).filter((f) => f.startsWith("openclaw.json.bak-"))
const xoaBak = () => {
  for (const f of baks()) rmSync(join(dirname(cfgPath), f))
}
const resetSpy = () => rmSync(spyLog, { force: true })
const spy = (): string[] => {
  try {
    return readFileSync(spyLog, "utf8").split("\n").filter((l) => l.length > 0)
  } catch {
    return []
  }
}
const lay = (o: Obj, duong: string[]): unknown => duong.reduce<unknown>((c, k) => (c as Obj | undefined)?.[k], o)
const hieuDung = async (a: Admin = admin) =>
  Object.fromEntries((await a.listZaloAccounts()).map((x) => [x.accountId, [...x.enabledGroups].sort()]))

/** Ghi bản sao zalo-admin.ts đã thay `tu` → `thanh` (khẳng định có đổi), trả đường tệp. */
function ghiBanSao(ten: string, doi: [string, string][]): string {
  let sao = readFileSync(ADMIN_SRC, "utf8")
  for (const [tu, thanh] of doi) {
    const moi = sao.replace(tu, thanh)
    assert.notEqual(moi, sao, `bản sao ${ten}: chuỗi «${tu}» không có trong zalo-admin.ts`)
    sao = moi
  }
  const dir = join(tmp, `mut-${ten}`)
  mkdirSync(dir, { recursive: true })
  const f = join(dir, "zalo-admin.ts")
  writeFileSync(f, sao)
  return f
}

/** Nạp bản sao đột biến — rào chạy trên CHÍNH bản sao trước khi trả nó. */
async function napBanSao(ten: string, doi: [string, string][]): Promise<Admin> {
  const mut = (await import(ghiBanSao(ten, doi))) as Admin
  assertRao(tmp, mut.zaloAdminPaths())
  return mut
}

// Các chuỗi đột biến — mỗi chuỗi phải có nguyên văn trong zalo-admin.ts (ghiBanSao khẳng định).
const BO_KIEM: [string, string] = ["  assertZaloCfgSafe(cfg);\n", ""]
const MOI_FALSE: [string, string] = [
  "groups[groupId] = { enabled, requireMention: true };",
  "groups[groupId] = { enabled, requireMention: false };",
]
const BAT_LAI_CHI_ENABLED: [string, string] = ["      if (enabled) g.requireMention = true;\n", ""]
const BAT_LAI_FALSE: [string, string] = ["if (enabled) g.requireMention = true;", "if (enabled) g.requireMention = false;"]

// ---------- Đoạn trích bộ canh (AC-5) ----------

/** Trích lúc chạy: biểu thức L2 (đếm bindings) và khối python L3/L3b giữa `<< 'EOF'` và `EOF`. */
function trichBoCanh(): { l2: string; l3: string } {
  const src = readFileSync(WATCHDOG, "utf8")
  const m = /N_BIND=\$\(python3 -c "([^"]+)"/.exec(src)
  assert.ok(m, "không thấy biểu thức L2 (N_BIND=$(python3 -c \"…\")) trong zalo-watchdog.sh")
  const l2goc = m[1]
  const l2 = l2goc.replace("open('$CFG')", "open(__import__('sys').argv[1])")
  assert.notEqual(l2, l2goc, "biểu thức L2 không còn đọc open('$CFG')")
  const dong = src.split("\n")
  const dau = dong.findIndex((l) => l.includes(`python3 - "$CFG" << 'EOF'`))
  assert.ok(dau >= 0, "không thấy khối python L3/L3b (python3 - \"$CFG\" << 'EOF') trong zalo-watchdog.sh")
  const cuoi = dong.findIndex((l, i) => i > dau && l === "EOF")
  assert.ok(cuoi > dau, "khối python L3/L3b không có dòng EOF đóng")
  return { l2, l3: dong.slice(dau + 1, cuoi).join("\n") }
}

let soTep = 0
/** Bộ canh phán trên một cấu hình: true = vi phạm (python thoát khác 0 hay in sai cũng là vi phạm, như bộ canh). */
function chayTrich(cfg: unknown): boolean {
  const { l2, l3 } = trichBoCanh()
  const tep = join(tmp, "bo-canh", `cfg-${soTep++}.json`)
  mkdirSync(dirname(tep), { recursive: true })
  writeFileSync(tep, JSON.stringify(cfg))
  const env = { NODE_ENV: "test" as const, PATH: PATH_GOC, HOME: home }
  assertRaoTrich(l2, tep, env.HOME)
  assertRaoTrich(l3, tep, env.HOME)
  let l2ViPham: boolean
  try {
    l2ViPham = execFileSync("python3", ["-c", l2, tep], { env, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim() !== "0"
  } catch {
    l2ViPham = true
  }
  const r = spawnSync("python3", ["-", tep], { env, input: l3, encoding: "utf8" })
  return l2ViPham || r.status !== 0
}

// ---------- Ma trận hàm kiểm (AC-4) ----------

type Ca = { ten: string; cfg: () => Obj; lop: string; nhom?: string }
const V = "group:v"
const PHAM: Ca[] = [
  { ten: "bindings 1 entry", cfg: voi(sach, ["bindings"], [{ agentId: "x" }]), lop: "L2" },
  { ten: "bindings {}", cfg: voi(sach, ["bindings"], {}), lop: "L2" },
  { ten: 'bindings ""', cfg: voi(sach, ["bindings"], ""), lop: "L2" },
  { ten: "bindings null", cfg: voi(sach, ["bindings"], null), lop: "L2" },
  { ten: "channels.zalo có mặt", cfg: voi(sach, ["channels", "zalo"], { enabled: true }), lop: "L3" },
  { ten: "enabled true + false", cfg: voi(sach, [...G_DEF, V], { enabled: true, requireMention: false }), lop: "L3b", nhom: V },
  { ten: "enabled vắng + false", cfg: voi(sach, [...G_DEF, V], { requireMention: false }), lop: "L3b", nhom: V },
  { ten: "enabled null + false", cfg: voi(sach, [...G_DEF, V], { enabled: null, requireMention: false }), lop: "L3b", nhom: V },
  { ten: "enabled 0 + false", cfg: voi(sach, [...G_DEF, V], { enabled: 0, requireMention: false }), lop: "L3b", nhom: V },
  { ten: 'enabled "false" + false', cfg: voi(sach, [...G_DEF, V], { enabled: "false", requireMention: false }), lop: "L3b", nhom: V },
  { ten: "allow false + false", cfg: voi(sach, [...G_DEF, V], { allow: false, requireMention: false }), lop: "L3b", nhom: V },
  { ten: "thiếu khoá requireMention", cfg: voi(sach, [...G_DEF, V], { enabled: true }), lop: "L3b", nhom: V },
  { ten: 'requireMention "true"', cfg: voi(sach, [...G_DEF, V], { enabled: true, requireMention: "true" }), lop: "L3b", nhom: V },
  { ten: "channel, không accounts", cfg: voi(cu, [...ZU, "groups", V], { enabled: true, requireMention: false }), lop: "L3b", nhom: V },
  { ten: "channel, mọi tài khoản có groups", cfg: voi(sach, [...ZU, "groups"], { [V]: { enabled: true, requireMention: false } }), lop: "L3b", nhom: V },
  { ten: "accounts.acc2.groups", cfg: voi(sach, [...G_ACC2, V], { enabled: true, requireMention: false }), lop: "L3b", nhom: V },
  { ten: "groupPolicy channel open", cfg: voi(sach, [...ZU, "groupPolicy"], "open"), lop: "groupPolicy" },
  { ten: "groupPolicy acc2 open", cfg: voi(sach, [...ZU, "accounts", "acc2", "groupPolicy"], "open"), lop: "groupPolicy" },
  { ten: "channels là mảng", cfg: () => ({ channels: [] }), lop: "hỏng" },
  { ten: "zalouser là chuỗi", cfg: () => ({ channels: { zalouser: "x" } }), lop: "hỏng" },
  { ten: "accounts.acc2 null", cfg: voi(sach, [...ZU, "accounts", "acc2"], null), lop: "hỏng" },
  { ten: "groups là mảng", cfg: voi(sach, G_DEF, []), lop: "hỏng" },
  { ten: "mục nhóm là chuỗi", cfg: voi(sach, [...G_DEF, V], "on"), lop: "hỏng" },
]
const SAT_RANH: Ca[] = [
  { ten: "nhóm tắt có requireMention false", cfg: voi(sach, [...G_DEF, V], { enabled: false, requireMention: false }), lop: "" },
  { ten: "bindings vắng", cfg: sach, lop: "" },
  { ten: "bindings []", cfg: voi(sach, ["bindings"], []), lop: "" },
  {
    ten: "groupPolicy vắng ở channel và tài khoản",
    cfg: () => datDuong(datDuong(sach(), [...ZU, "groupPolicy"], XOA), [...ZU, "accounts", "acc2", "groupPolicy"], XOA),
    lop: "",
  },
]

// ---------- Thước tĩnh đường ghi (AC-7) ----------

/** Vi phạm đường ghi cấu hình trong một bản zalo-admin.ts: một cửa writeCfg một tham số, câu đầu là bước kiểm. */
function kiemDuongGhi(src: string): string[] {
  const v: string[] = []
  const m = /async function writeCfg\(([^)]*)\)[^{]*\{\n([\s\S]*?)\n\}/.exec(src)
  if (!m) return [`${ADMIN_REL}: không thấy writeCfg`]
  const thamSo = m[1].split(",").filter((s) => s.trim() !== "")
  if (thamSo.length !== 1) v.push(`${ADMIN_REL}: writeCfg có tham số ngoài cfg (lối bỏ kiểm)`)
  const than = m[2]
  if (!than.trim().startsWith("assertZaloCfgSafe(cfg);")) v.push(`${ADMIN_REL}: bước kiểm không đứng đầu writeCfg`)
  const GHI = /\b(?:writeFile|copyFile|rename|appendFile)(?:Sync)?\s*\(/g
  const khongImport = src
    .split("\n")
    .filter((l) => !l.startsWith("import "))
    .join("\n")
  const tong = (khongImport.match(GHI) ?? []).length
  const trong = (than.match(GHI) ?? []).length
  if (tong !== trong) v.push(`${ADMIN_REL}: lời gọi ghi tệp nằm ngoài writeCfg`)
  return v
}

async function post(body: unknown): Promise<{ status: number; json: { error?: string } }> {
  const res = await route.POST(
    new Request("http://localhost/api/v1/ops/zalo/groups", {
      method: "POST",
      headers: { cookie: phien!.cookie, "content-type": "application/json" },
      body: JSON.stringify(body),
    }),
  )
  return { status: res.status, json: (await res.json()) as { error?: string } }
}

before(async () => {
  tmp = mkdtempSync(join(tmpdir(), "nhom-moi-"))
  home = join(tmp, "home")
  spyLog = join(tmp, "spy.log")
  const script = [
    "#!/bin/sh",
    `for a in "$@"; do printf '%s\\t' "$a"; done >> "${spyLog}"`,
    `printf '\\n' >> "${spyLog}"`,
    "",
  ].join("\n")
  for (const dir of [join(home, ".openclaw", "bin"), join(tmp, "bin")]) {
    mkdirSync(dir, { recursive: true })
    writeFileSync(join(dir, "openclaw"), script)
    chmodSync(join(dir, "openclaw"), 0o755)
  }
  cfgPath = join(home, ".openclaw", "openclaw.json")
  ghiCfg(sach())

  for (const k of ENV_KEYS) envCu[k] = process.env[k]
  process.env.HOME = home
  process.env.PATH = `${join(tmp, "bin")}:${PATH_GOC}`
  process.env.OPS_API_TOKEN = "T"
  // Route đọc phiên và ghi audit trong DB (TV1): một lược đồ tạm chỉ có users/sessions/ops_audit — không chạm public.
  phien = await luocDoPhienAdmin("nm")
  process.env.DATABASE_URL = phien.url

  admin = (await import("../src/lib/zalo-admin")) as Admin
  assertRao(tmp, admin.zaloAdminPaths())
  route = (await import("../src/app/api/v1/ops/zalo/groups/route")) as Route
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

// ---------- AC-8 ----------

test("NM-AC-8 rào: homedir, openclaw, config, tệp python dưới thư mục tạm; DATABASE_URL lược đồ tạm", () => {
  const p = admin.zaloAdminPaths()
  assertRao(tmp, p)
  assert.equal(thuc(p.config), thuc(cfgPath))
  const tu = readFileSync(fileURLToPath(import.meta.url), "utf8")
  assert.doesNotMatch(tu, /^import [^\n]*from "\.\.\/src\/(lib\/zalo-admin|app\/api)/m, "tệp test không được import tĩnh zalo-admin hay route")
  const { l2, l3 } = trichBoCanh()
  assertRaoTrich(l2, join(tmp, "x.json"), home)
  assertRaoTrich(l3, join(tmp, "x.json"), home)
})

test("NM-AC-8 rào với HOME thật / đoạn trích có pkill trả vi phạm nêu đường lạc", () => {
  const that = { openclaw: join(HOME_THAT, ".openclaw/bin/openclaw"), config: join(HOME_THAT, ".openclaw/openclaw.json") }
  assert.throws(() => assertRao(tmp, that, HOME_THAT), /đường lạc — HOME/)
  assert.throws(() => assertRaoTrich("import os; os.system('pkill -9 -f openclaw')", join(tmp, "x.json"), home), /đường lạc — đoạn trích bộ canh chứa «pkill»/)
  assert.throws(() => assertRaoTrich("print(1)", join(HOME_THAT, ".openclaw/openclaw.json"), home), /đường lạc — tệp python/)
})

test("NM-AC-8 bật/tắt nhóm không gọi openclaw → nhật ký giả rỗng", async () => {
  ghiCfg(sach())
  resetSpy()
  await admin.setZaloGroupEnabled("default", "group:moi", true)
  await admin.setZaloGroupEnabled("default", "group:moi", false)
  await admin.setZaloGroupEnabled("acc2", "group:b", false)
  assert.deepEqual(spy(), [])
})

// ---------- AC-1 ----------

const BO_CUC: { ten: string; cfg: () => Obj; acc: string; cho: string[] }[] = [
  { ten: "default có groups riêng", cfg: sach, acc: "default", cho: G_DEF },
  { ten: "default kế thừa channel", cfg: keThua, acc: "default", cho: G_DEF },
  { ten: "layout cũ", cfg: cu, acc: "default", cho: [...ZU, "groups"] },
  { ten: "acc2 có groups riêng", cfg: sach, acc: "acc2", cho: G_ACC2 },
]

test("NM-AC-1 nhóm mới ở 4 bố cục → {enabled:true, requireMention:true} đúng chỗ", async () => {
  for (const b of BO_CUC) {
    ghiCfg(b.cfg())
    resetSpy()
    const truoc = await hieuDung()
    const channelTruoc = lay(docCfg(), [...ZU, "groups"])
    const kq = await admin.setZaloGroupEnabled(b.acc, "group:moi", true)
    assert.deepEqual(kq, { conflictWith: null }, b.ten)
    const sau = docCfg()
    assert.deepEqual(lay(sau, [...b.cho, "group:moi"]), { enabled: true, requireMention: true }, b.ten)
    const mongDoi = { ...truoc, [b.acc]: [...truoc[b.acc], "group:moi"].sort() }
    assert.deepEqual(await hieuDung(), mongDoi, `${b.ten}: enabledGroups hiệu dụng chỉ khác ở group:moi của ${b.acc}`)
    // bố cục kế thừa: groups cấp channel không đổi (accounts.default nhận bản chép sâu, không chung tham chiếu)
    if (b.cfg === keThua) assert.deepEqual(lay(sau, [...ZU, "groups"]), channelTruoc, `${b.ten}: groups cấp channel giữ nguyên`)
    assert.deepEqual(admin.zaloConfigViolations(sau), [], b.ten)
    assert.deepEqual(spy(), [], b.ten)
  }
})

test("NM-AC-1 bản sao dựng nhóm mới requireMention false, gỡ kiểm → tệp nhận false", async () => {
  const mut = await napBanSao("ac1-moi-false", [MOI_FALSE, BO_KIEM])
  ghiCfg(sach())
  await mut.setZaloGroupEnabled("default", "group:moi", true)
  const e = lay(docCfg(), [...G_DEF, "group:moi"]) as Obj
  assert.equal(e.requireMention, false, "nhóm mới requireMention false — thước AC-1 phải bắt được bản này")
})

// ---------- AC-2 ----------

const coSan = (): Obj => {
  const c = sach()
  datDuong(c, [...G_DEF, "group:f"], { enabled: false, requireMention: false })
  datDuong(c, [...G_DEF, "group:t"], { enabled: false })
  datDuong(c, [...G_DEF, "group:k"], { enabled: false, requireMention: false, allow: true, ghiChu: "giữ" })
  datDuong(c, [...G_ACC2, "group:f2"], { enabled: false, requireMention: false })
  datDuong(c, [...G_ACC2, "group:t2"], { enabled: false })
  datDuong(c, [...G_ACC2, "group:k2"], { enabled: false, requireMention: false, allow: true, ghiChu: "giữ" })
  return c
}

test("NM-AC-2 bật lại nhóm false/thiếu khoá/có khoá khác ở default và acc2 → enabled:true + requireMention:true, khoá khác giữ nguyên", async () => {
  ghiCfg(coSan())
  for (const [acc, cho, hau] of [["default", G_DEF, ""], ["acc2", G_ACC2, "2"]] as const) {
    for (const g of ["f", "t", "k"]) {
      const id = `group:${g}${hau}`
      const truoc = lay(docCfg(), [...cho, id]) as Obj
      await admin.setZaloGroupEnabled(acc, id, true)
      const sau = lay(docCfg(), [...cho, id]) as Obj
      assert.deepEqual(sau, { ...truoc, enabled: true, requireMention: true }, `${acc} ${id}`)
    }
  }
  assert.deepEqual(admin.zaloConfigViolations(docCfg()), [])
})

test("NM-AC-2 bản sao bật lại chỉ đặt enabled → giữ false", async () => {
  const mut = await napBanSao("ac2-chi-enabled", [BAT_LAI_CHI_ENABLED, BO_KIEM])
  ghiCfg(coSan())
  await mut.setZaloGroupEnabled("default", "group:f", true)
  assert.deepEqual(lay(docCfg(), [...G_DEF, "group:f"]), { enabled: true, requireMention: false }, "bật lại giữ false")
})

// ---------- AC-3 ----------

test("NM-AC-3 tắt nhóm có sẵn, nhóm chưa có, và đúng nhóm đang phạm → ghi thành công, KHÔNG bị chặn", async () => {
  ghiCfg(sach())
  xoaBak()
  await admin.setZaloGroupEnabled("default", "group:a", false)
  assert.deepEqual(lay(docCfg(), [...G_DEF, "group:a"]), { enabled: false, requireMention: true })
  assert.equal(baks().length, 1, "mỗi lần ghi đúng một tệp .bak- mới")

  xoaBak()
  await admin.setZaloGroupEnabled("default", "group:chua", false)
  assert.deepEqual(lay(docCfg(), [...G_DEF, "group:chua"]), { enabled: false, requireMention: true })
  assert.equal(baks().length, 1)

  const X = "group:x"
  const pham = datDuong(sach(), [...G_DEF, X], { enabled: true, requireMention: false })
  assert.equal(admin.zaloConfigViolations(pham).length, 1, "cấu hình phạm đúng một chỗ")
  ghiCfg(pham)
  xoaBak()
  await admin.setZaloGroupEnabled("default", X, false)
  assert.deepEqual(admin.zaloConfigViolations(docCfg()), [], "cấu hình sau khi tắt X sạch")
  assert.equal(lay(docCfg(), [...G_DEF, X, "enabled"]), false)
  assert.equal(baks().length, 1)
})

// ---------- AC-4 ----------

test("NM-AC-4 cấu hình sạch → []", () => {
  for (const c of [sach(), keThua(), cu()]) assert.deepEqual(admin.zaloConfigViolations(c), [])
})

test("NM-AC-4 ma trận vi phạm → có vi phạm đúng nhãn lớp", () => {
  assert.equal(PHAM.length, 23)
  for (const ca of PHAM) {
    let v: string[] = []
    assert.doesNotThrow(() => (v = admin.zaloConfigViolations(ca.cfg())), `${ca.ten}: hàm kiểm không được ném`)
    assert.ok(v.some((x) => x.startsWith(`${ca.lop}:`)), `${ca.ten}: cần vi phạm lớp ${ca.lop}, có ${JSON.stringify(v)}`)
    if (ca.nhom) assert.ok(v.some((x) => x.startsWith("L3b:") && x.includes(ca.nhom!)), `${ca.ten}: L3b phải nêu ${ca.nhom}`)
  }
  for (const x of [undefined, null, 5, "x", []]) {
    assert.doesNotThrow(() => admin.zaloConfigViolations(x))
    assert.ok(admin.zaloConfigViolations(x).length > 0, `cấu hình gốc ${JSON.stringify(x)} phải là vi phạm`)
  }
})

test("NM-AC-4 sát ranh KHÔNG phạm → []", () => {
  for (const ca of SAT_RANH) assert.deepEqual(admin.zaloConfigViolations(ca.cfg()), [], ca.ten)
})

// ---------- AC-5 ----------

test("NM-AC-5 băm đoạn trích bằng băm ghim", () => {
  const { l2, l3 } = trichBoCanh()
  const bam = createHash("sha256").update(`${l2}\n---\n${l3}`).digest("hex")
  assert.equal(bam, BAM_TRICH, "bộ canh đổi L2/L3/L3b — soát lại zaloConfigViolations theo bộ canh rồi ghim lại BAM_TRICH")
})

test("NM-AC-5 bộ canh phán vi phạm ⇒ hàm kiểm phán vi phạm trên mọi tệp của ma trận AC-4", () => {
  for (const ca of [...PHAM, ...SAT_RANH, { ten: "sạch", cfg: sach, lop: "" }]) {
    const cfg = ca.cfg()
    if (chayTrich(cfg)) {
      assert.ok(admin.zaloConfigViolations(cfg).length > 0, `${ca.ten}: bộ canh phán vi phạm mà hàm kiểm phán sạch`)
    }
  }
  // Đối chứng dương: bộ canh thật sự bắt các ca L3b và L2 cơ bản (đoạn trích chạy, không phải im lặng)
  assert.equal(chayTrich(PHAM[0].cfg()), true, "bộ canh phải bắt bindings 1 entry")
  assert.equal(chayTrich(PHAM[5].cfg()), true, "bộ canh phải bắt nhóm bật requireMention false")
  assert.equal(chayTrich(PHAM[6].cfg()), true, "bộ canh phải bắt nhóm thiếu enabled requireMention false")
})

test("NM-AC-5 sát ranh: cả hai KHÔNG phán vi phạm", () => {
  for (const ca of [...SAT_RANH, { ten: "sạch", cfg: sach, lop: "" }]) {
    const cfg = ca.cfg()
    assert.equal(chayTrich(cfg), false, `${ca.ten}: bộ canh`)
    assert.deepEqual(admin.zaloConfigViolations(cfg), [], `${ca.ten}: hàm kiểm`)
  }
})

// ---------- AC-6 ----------

const PHAM_CHO_KHAC: { ten: string; cfg: () => Obj; loi: RegExp }[] = [
  { ten: "nhóm khác false", cfg: voi(sach, [...G_ACC2, "group:x"], { enabled: true, requireMention: false }), loi: /L3b: nhóm group:x/ },
  { ten: "bindings 1 entry", cfg: voi(sach, ["bindings"], [{ agentId: "x" }]), loi: /L2:/ },
  { ten: "channels.zalo", cfg: voi(sach, ["channels", "zalo"], {}), loi: /L3:/ },
  { ten: "groupPolicy open", cfg: voi(sach, [...ZU, "groupPolicy"], "open"), loi: /groupPolicy:/ },
]

test("NM-AC-6 cấu hình phạm ở chỗ khác → bật và tắt nhóm khác đều bị từ chối: hàm ném + route 400 nêu lớp, tệp nguyên byte, không .bak mới", async () => {
  for (const ca of PHAM_CHO_KHAC) {
    ghiCfg(ca.cfg())
    xoaBak()
    const goc = byteCfg()
    await assert.rejects(admin.setZaloGroupEnabled("default", "group:moi", true), ca.loi, `${ca.ten}: bật`)
    await assert.rejects(admin.setZaloGroupEnabled("default", "group:a", false), ca.loi, `${ca.ten}: tắt nhóm khác`)
    const r = await post({ accountId: "default", groupId: "group:moi", enabled: true })
    assert.equal(r.status, 400, ca.ten)
    assert.match(r.json.error ?? "", ca.loi, ca.ten)
    assert.ok(byteCfg().equals(goc), `${ca.ten}: tệp giữ nguyên từng byte`)
    assert.deepEqual(baks(), [], `${ca.ten}: không có .bak mới`)
  }
})

test("NM-AC-6 bản sao gỡ lời gọi kiểm → tệp bị ghi", async () => {
  const mut = await napBanSao("ac6-bo-kiem", [BO_KIEM])
  ghiCfg(PHAM_CHO_KHAC[1].cfg())
  const goc = byteCfg()
  await mut.setZaloGroupEnabled("default", "group:moi", true)
  assert.ok(!byteCfg().equals(goc), "ghi khi cấu hình phạm — thước AC-6 phải bắt được bản này")
})

test("NM-AC-6 bản sao giữ kiểm, dựng nhóm false → L3b nêu group:moi ở 4 bố cục, tệp nguyên byte", async () => {
  const mut = await napBanSao("ac6-giu-kiem-false", [MOI_FALSE, BAT_LAI_FALSE])
  for (const b of BO_CUC) {
    ghiCfg(b.cfg())
    xoaBak()
    const goc = byteCfg()
    await assert.rejects(mut.setZaloGroupEnabled(b.acc, "group:moi", true), /L3b: nhóm group:moi/, b.ten)
    assert.ok(byteCfg().equals(goc), `${b.ten}: tệp nguyên byte`)
    assert.deepEqual(baks(), [], b.ten)
  }
  ghiCfg(coSan())
  const goc = byteCfg()
  await assert.rejects(mut.setZaloGroupEnabled("default", "group:f", true), /L3b: nhóm group:f/, "bật lại")
  assert.ok(byteCfg().equals(goc))
})

// ---------- AC-7 ----------

test("NM-AC-7 thước tĩnh: một hàm ghi cấu hình writeCfg một tham số, câu đầu là bước kiểm, mọi lời gọi ghi nằm trong nó", () => {
  assert.deepEqual(kiemDuongGhi(readFileSync(ADMIN_SRC, "utf8")), [])
})

test("NM-AC-7 createZaloAccount/deleteZaloAccount trên cấu hình phạm → từ chối, tệp nguyên byte", async () => {
  ghiCfg(voi(cu, [...ZU, "groups", V], { enabled: true, requireMention: false })())
  let goc = byteCfg()
  await assert.rejects(admin.createZaloAccount("acc9"), /L3b: nhóm group:v/)
  assert.ok(byteCfg().equals(goc), "createZaloAccount: tệp nguyên byte")

  ghiCfg(PHAM_CHO_KHAC[1].cfg())
  goc = byteCfg()
  await assert.rejects(admin.deleteZaloAccount("acc2"), /L2:/)
  assert.ok(byteCfg().equals(goc), "deleteZaloAccount: tệp nguyên byte")
})

const GHI_GOC = "  assertZaloCfgSafe(cfg);\n  await copyFile(CONFIG, `${CONFIG}.bak-${Date.now()}`);\n  await writeFile(CONFIG, JSON.stringify(cfg, null, 2));"

test("NM-AC-7 bản sao kiểm sau writeFile", () => {
  const src = readFileSync(ADMIN_SRC, "utf8")
  assert.ok(src.includes(GHI_GOC))
  const sao = src.replace(GHI_GOC, "  await copyFile(CONFIG, `${CONFIG}.bak-${Date.now()}`);\n  await writeFile(CONFIG, JSON.stringify(cfg, null, 2));\n  assertZaloCfgSafe(cfg);")
  assert.deepEqual(kiemDuongGhi(sao), [`${ADMIN_REL}: bước kiểm không đứng đầu writeCfg`])
})

test("NM-AC-7 bản sao thêm writeFile(CONFIG) ngoài writeCfg", () => {
  const sao =
    readFileSync(ADMIN_SRC, "utf8") +
    "\nexport async function ghiThang(cfg: unknown): Promise<void> {\n  await writeFile(CONFIG, JSON.stringify(cfg));\n}\n"
  assert.deepEqual(kiemDuongGhi(sao), [`${ADMIN_REL}: lời gọi ghi tệp nằm ngoài writeCfg`])
})

test("NM-AC-7 bản sao thêm tham số bỏ kiểm", () => {
  const src = readFileSync(ADMIN_SRC, "utf8")
  const tu = "async function writeCfg(cfg: Root): Promise<void> {\n  assertZaloCfgSafe(cfg);"
  assert.ok(src.includes(tu))
  const sao = src.replace(tu, "async function writeCfg(cfg: Root, skip = false): Promise<void> {\n  if (!skip) assertZaloCfgSafe(cfg);")
  const v = kiemDuongGhi(sao)
  assert.ok(v.includes(`${ADMIN_REL}: writeCfg có tham số ngoài cfg (lối bỏ kiểm)`), JSON.stringify(v))
  assert.ok(v.includes(`${ADMIN_REL}: bước kiểm không đứng đầu writeCfg`), JSON.stringify(v))
})
