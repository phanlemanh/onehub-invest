// login-kiem-id.test.tsx — POST /api/v1/ops/zalo/login kiểm id TRƯỚC khi spawn `openclaw channels login` (cùng loại lỗ
// YC1 với ON14 go-tai-khoan-kiem-id). Hồ sơ nghiệm thu: _acceptance/login-kiem-id (AC-1…AC-9; AC-10 là test ON14).
// Tên ca mở đầu bằng mã AC (LK-AC-n).
//
// An toàn Zalo (.claude/rules/zalo-safety.md): CHỈ openclaw giả. HOME, PATH và OPENCLAW_QR_DIR trỏ thư mục tạm; openclaw
// giả ghi argv mỗi lần được gọi thành một dòng vào spy.log, ghi một ảnh QR giả cho id cuối argv rồi thoát (riêng `acc3`
// thì ngủ — giả một phiên đang chờ quét). Tệp KHÔNG import tĩnh zalo-admin hay route; mọi bản sao đột biến nạp qua
// napBanSao(), hàm này chạy rào trên chính bản sao trước khi trả nó.
import { after, before, test } from "node:test"
import assert from "node:assert/strict"
import { execFileSync } from "node:child_process"
import { chmodSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, realpathSync, rmSync, writeFileSync } from "node:fs"
import { homedir, tmpdir } from "node:os"
import { dirname, join, resolve } from "node:path"
import { fileURLToPath, pathToFileURL } from "node:url"

type Paths = { openclaw: string; config: string; qrDir: string }
type Admin = {
  zaloAdminPaths: () => Paths
  startZaloLogin: (accountId: string) => Promise<{ qrBase64: string | null; startedAt: string }>
  cancelZaloLogin: (accountId: string) => Promise<void>
}
type Route = { POST: (req: Request) => Promise<Response> }

const APP = resolve(dirname(fileURLToPath(import.meta.url)), "..")
const ADMIN_SRC = join(APP, "src/lib/zalo-admin.ts")
const HOME_THAT = process.env.HOME ?? homedir()
const PATH_GOC = process.env.PATH ?? ""
const ENV_KEYS = ["HOME", "PATH", "OPENCLAW_QR_DIR", "OPS_API_TOKEN", "DATABASE_URL"] as const
const envCu: Partial<Record<(typeof ENV_KEYS)[number], string>> = {}

const FIXTURE = {
  channels: {
    zalouser: {
      enabled: true,
      accounts: Object.fromEntries(
        ["default", "acc2", "acc3", "--channel", "Acc_5"].map((id) => [id, { enabled: true, profile: id }]),
      ),
    },
  },
}

let tmp = ""
let home = ""
let qrDir = ""
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

/** Rào an toàn: HOME, CLI, config và thư mục QR mà module dùng phải nằm dưới thư mục tạm. Sai → ném, không ca nào chạy. */
function assertRao(goc: string, paths: Paths, h: string = homedir()): void {
  const g = thuc(goc) + "/"
  const ds: [string, string][] = [["HOME", h], ["openclaw", paths.openclaw], ["config", paths.config], ["qrDir", paths.qrDir]]
  for (const [ten, p] of ds) {
    if (typeof p !== "string" || !(thuc(p) + "/").startsWith(g)) {
      throw new Error(`rào: đường lạc — ${ten} ${String(p)} nằm ngoài thư mục tạm ${goc}`)
    }
  }
}

const datLai = (cfg: unknown = FIXTURE) => {
  writeFileSync(cfgPath, JSON.stringify(cfg, null, 2))
  rmSync(spyLog, { force: true })
}
const resetSpy = () => rmSync(spyLog, { force: true })
const spy = (): string[] => {
  try {
    return readFileSync(spyLog, "utf8").split("\n").filter((l) => l.length > 0)
  } catch {
    return []
  }
}
const qrGia = (id: string) => Buffer.from(`${id}-QR`).toString("base64")
const loginLine = (id: string) => ["channels", "login", "--channel", "zalouser", "--account", id].join("\t") + "\t"

async function post(body: unknown): Promise<{ status: number; json: { qrBase64?: string | null; error?: string } }> {
  const res = await route.POST(
    new Request("http://localhost/api/v1/ops/zalo/login", {
      method: "POST",
      headers: { authorization: "Bearer T", "content-type": "application/json" },
      body: typeof body === "string" ? body : JSON.stringify(body),
    }),
  )
  return { status: res.status, json: (await res.json()) as { qrBase64?: string | null; error?: string } }
}

/** Ghi bản sao zalo-admin.ts đã thay `tu` → `thanh` (khẳng định có đổi), trả đường tệp. */
function ghiBanSao(ten: string, doi: [string, string][]): string {
  const goc = readFileSync(ADMIN_SRC, "utf8")
  let sao = goc
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

/**
 * qrDir của module đọc trong tiến trình con KHÔNG có OPENCLAW_QR_DIR (như chạy thật); không gọi startZaloLogin.
 * TMPDIR đặt riêng (máy macOS thật có TMPDIR khác /tmp) — để mặc định dựa os.tmpdir() lộ ra, không trùng /tmp/openclaw.
 */
function qrDirMacDinh(file: string): string {
  const code = `const m = await import(${JSON.stringify(pathToFileURL(file).href)}); process.stdout.write(m.zaloAdminPaths().qrDir)`
  return execFileSync(process.execPath, ["--import", "tsx", "--input-type=module", "-e", code], {
    cwd: APP,
    env: { HOME: home, PATH: PATH_GOC, TMPDIR: join(tmp, "tmpdir") },
    encoding: "utf8",
  }).trim()
}

before(async () => {
  tmp = mkdtempSync(join(tmpdir(), "login-kiem-"))
  home = join(tmp, "home")
  qrDir = join(tmp, "qr")
  spyLog = join(tmp, "spy.log")
  mkdirSync(qrDir, { recursive: true })
  const script = [
    "#!/bin/sh",
    `for a in "$@"; do printf '%s\\t' "$a"; done >> "${spyLog}"`,
    `printf '\\n' >> "${spyLog}"`,
    'for last in "$@"; do :; done',
    `printf '%s-QR' "$last" > "${qrDir}/openclaw-zalouser-qr-$last.png"`,
    'if [ "$last" = "acc3" ]; then exec sleep 30; fi',
    "",
  ].join("\n")
  for (const dir of [join(home, ".openclaw", "bin"), join(tmp, "bin")]) {
    mkdirSync(dir, { recursive: true })
    writeFileSync(join(dir, "openclaw"), script)
    chmodSync(join(dir, "openclaw"), 0o755)
  }
  cfgPath = join(home, ".openclaw", "openclaw.json")
  datLai()

  for (const k of ENV_KEYS) envCu[k] = process.env[k]
  process.env.HOME = home
  process.env.PATH = `${join(tmp, "bin")}:${PATH_GOC}`
  process.env.OPENCLAW_QR_DIR = qrDir
  process.env.OPS_API_TOKEN = "T"
  process.env.DATABASE_URL = "postgres://127.0.0.1:9/khong-co"

  admin = (await import("../src/lib/zalo-admin")) as Admin
  assertRao(tmp, admin.zaloAdminPaths())
  route = (await import("../src/app/api/v1/ops/zalo/login/route")) as Route
})

after(async () => {
  if (admin) await admin.cancelZaloLogin("acc3")
  for (const k of ENV_KEYS) {
    if (envCu[k] === undefined) delete process.env[k]
    else process.env[k] = envCu[k]
  }
  const { pool } = await import("../src/lib/db")
  await pool.end().catch(() => {})
  if (tmp) rmSync(tmp, { recursive: true, force: true })
})

test("LK-AC-8 rào: homedir, openclaw, config, qrDir nằm dưới thư mục tạm", () => {
  const p = admin.zaloAdminPaths()
  assertRao(tmp, p)
  assert.equal(thuc(p.openclaw), thuc(join(home, ".openclaw", "bin", "openclaw")))
  assert.equal(thuc(p.config), thuc(cfgPath))
  assert.equal(thuc(p.qrDir), thuc(qrDir))
})

test("LK-AC-8 rào với HOME thật hoặc qrDir /tmp/openclaw trả vi phạm nêu đường lạc", () => {
  const that = {
    openclaw: join(HOME_THAT, ".openclaw/bin/openclaw"),
    config: join(HOME_THAT, ".openclaw/openclaw.json"),
    qrDir: "/tmp/openclaw",
  }
  assert.throws(() => assertRao(tmp, that, HOME_THAT), /đường lạc — HOME/)
  assert.throws(() => assertRao(tmp, { ...admin.zaloAdminPaths(), qrDir: "/tmp/openclaw" }), /đường lạc — qrDir/)
})

test("LK-AC-1 accountId rỗng/thiếu/không phải chuỗi → 400, openclaw giả 0 lệnh", async () => {
  datLai()
  const than: [unknown, string | null][] = [
    [{}, "id rỗng"],
    [{ accountId: "" }, "id rỗng"],
    [{ accountId: "   " }, null], // không cắt khoảng trắng → lớp «id có khoảng trắng»; vẫn 400, 0 lệnh
    [{ accountId: 5 }, "id rỗng"],
    [{ accountId: null }, "id rỗng"],
    ["not-json", "id rỗng"],
    ["null", "id rỗng"],
  ]
  for (const [b, loi] of than) {
    const r = await post(b)
    assert.equal(r.status, 400, `thân ${JSON.stringify(b)}`)
    if (loi) assert.equal(r.json.error, loi, `thân ${JSON.stringify(b)}`)
    assert.equal(spy().length, 0, `thân ${JSON.stringify(b)}: openclaw giả nhận lệnh`)
  }
  // Đối chứng dương cùng fixture: id thật → openclaw giả ghi được đúng một dòng.
  const r = await post({ accountId: "acc2" })
  assert.equal(r.status, 200)
  assert.equal(spy().length, 1, "đối chứng dương: openclaw giả không ghi được lệnh của id thật")
  datLai()
})

test("LK-AC-1 bản sao bỏ bước kiểm → openclaw giả nhận login với id rỗng", async () => {
  datLai()
  const mut = await napBanSao("bo-kiem", [["requireLoginAccount(cfg, accountId);", ""]])
  await mut.startZaloLogin("")
  assert.ok(
    spy().includes(loginLine("")),
    `login với id rỗng: bản sao bỏ bước kiểm phải lọt lệnh login --account "" — spy: ${JSON.stringify(spy())}`,
  )
  datLai()
})

test("LK-AC-2 accountId có khoảng trắng → 400, openclaw giả 0 lệnh", async () => {
  datLai()
  for (const id of [" acc2 ", "acc2 ", "acc 2", "acc2\n"]) {
    const r = await post({ accountId: id })
    assert.equal(r.status, 400, JSON.stringify(id))
    assert.equal(r.json.error, "id có khoảng trắng", JSON.stringify(id))
    assert.equal(spy().length, 0, `${JSON.stringify(id)}: openclaw giả nhận lệnh`)
  }
})

test("LK-AC-3 id lạ/khoá kế thừa/dạng cờ → 400 đúng thông điệp lớp, openclaw giả 0 lệnh", async () => {
  datLai()
  const KHONG_CO = "không có trong danh sách tài khoản"
  const bang: [string, string][] = [
    ["khong-co", KHONG_CO],
    ["../acc2", KHONG_CO],
    ["ACC2", KHONG_CO],
    ["constructor", KHONG_CO],
    ["__proto__", KHONG_CO],
    ["toString", KHONG_CO],
    ["hasOwnProperty", KHONG_CO],
    ["--channel", "id dạng cờ"],
  ]
  for (const [id, loi] of bang) {
    const r = await post({ accountId: id })
    assert.equal(r.status, 400, id)
    assert.equal(r.json.error, loi, id)
    assert.equal(spy().length, 0, `${id}: openclaw giả nhận lệnh`)
  }
})

test("LK-AC-3 bản sao chỉ kiểm thành viên → login --account --channel lọt, nêu dạng cờ", async () => {
  datLai()
  const mut = await napBanSao("chi-thanh-vien", [['if (accountId.startsWith("-")) throw new Error("id dạng cờ");', ""]])
  await mut.startZaloLogin("--channel")
  assert.ok(spy().includes(loginLine("--channel")), `dạng cờ: phải lọt login --account --channel — spy: ${JSON.stringify(spy())}`)
  datLai()
})

test("LK-AC-3 bản sao kiểm thành viên bằng in → login --account constructor lọt, nêu khoá kế thừa", async () => {
  datLai()
  const mut = await napBanSao("in", [["Object.hasOwn(accounts, accountId)", "accountId in accounts"]])
  await mut.startZaloLogin("constructor")
  assert.ok(
    spy().includes(loginLine("constructor")),
    `khoá kế thừa: bản sao kiểm bằng in phải lọt login --account constructor — spy: ${JSON.stringify(spy())}`,
  )
  datLai()
})

test("LK-AC-4 id thật acc2 và Acc_5 → 200, qrBase64 của ảnh QR giả, đúng một lệnh login --account <id>", async () => {
  datLai()
  for (const id of ["acc2", "Acc_5"]) {
    resetSpy()
    const r = await post({ accountId: id })
    assert.equal(r.status, 200, id)
    assert.equal(r.json.qrBase64, qrGia(id), `${id}: QR trả về không phải QR của chính id`)
    assert.deepEqual(spy(), [loginLine(id)], `${id}: argv login`)
  }
})

test("LK-AC-5 default (có và vắng accounts.default) → 200, QR của default, đúng một lệnh login --account default", async () => {
  const khongDefault = structuredClone(FIXTURE) as { channels: { zalouser: { accounts: Record<string, unknown> } } }
  delete khongDefault.channels.zalouser.accounts.default
  for (const [nhan, cfg] of [["có accounts.default", FIXTURE], ["vắng accounts.default", khongDefault]] as const) {
    datLai(cfg)
    const r = await post({ accountId: "default" })
    assert.equal(r.status, 200, nhan)
    assert.equal(r.json.qrBase64, qrGia("default"), nhan)
    assert.deepEqual(spy(), [loginLine("default")], nhan)
  }
  datLai()
})

test("LK-AC-6 đang có phiên acc3 dở → --channel và khong-co vẫn 400, không trả QR acc3, nhật ký vẫn 1 dòng", async () => {
  datLai()
  try {
    const dang = await post({ accountId: "acc3" })
    assert.equal(dang.status, 200)
    assert.equal(dang.json.qrBase64, qrGia("acc3"))
    for (const [id, loi] of [["--channel", "id dạng cờ"], ["khong-co", "không có trong danh sách tài khoản"]] as const) {
      const r = await post({ accountId: id })
      assert.equal(r.status, 400, id)
      assert.equal(r.json.error, loi, id)
      assert.equal(r.json.qrBase64, undefined, `${id}: trả nhầm QR của phiên acc3`)
    }
    assert.deepEqual(spy(), [loginLine("acc3")])
  } finally {
    await admin.cancelZaloLogin("acc3")
  }
})

test("LK-AC-9 không đặt OPENCLAW_QR_DIR → zaloAdminPaths().qrDir là /tmp/openclaw", () => {
  assert.equal(qrDirMacDinh(ADMIN_SRC), "/tmp/openclaw")
})

test("LK-AC-9 bản sao mặc định os.tmpdir() ra khác, nêu QR mặc định", () => {
  const f = ghiBanSao("qr-mac-dinh", [
    ['import { homedir } from "node:os";', 'import { homedir, tmpdir } from "node:os";'],
    ['|| "/tmp/openclaw"', '|| path.join(tmpdir(), "openclaw")'],
  ])
  assert.notEqual(qrDirMacDinh(f), "/tmp/openclaw", "QR mặc định: bản sao dùng os.tmpdir() vẫn ra /tmp/openclaw")
})

// AC-7 (thước tĩnh) ở cuối tệp — Task 2.
void readdirSync
