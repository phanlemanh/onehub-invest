// go-tai-khoan-kiem-id.test.tsx — DELETE /api/v1/ops/zalo/accounts kiểm id TRƯỚC khi gọi openclaw (sự cố P1-7 23/10:
// ma trận phép đo gọi DELETE với id rỗng → route chạy `openclaw channels logout --account ""`).
// Hồ sơ nghiệm thu: _acceptance/go-tai-khoan-kiem-id (AC-1…AC-6). Tên ca mở đầu bằng mã AC (GT-AC-n).
//
// An toàn Zalo (.claude/rules/zalo-safety.md): CHỈ openclaw giả. HOME và PATH trỏ thư mục tạm; openclaw giả ghi argv mỗi
// lần được gọi thành một dòng vào spy.log. Tệp KHÔNG import tĩnh zalo-admin hay route — import tĩnh bị kéo lên trước
// lệnh đặt env (hằng OPENCLAW/CONFIG tính lúc nạp module). Rào trong before() chặn mọi ca nếu đường đi lạc ra HOME thật.
import { after, before, test } from "node:test"
import assert from "node:assert/strict"
import { chmodSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, realpathSync, rmSync, writeFileSync } from "node:fs"
import { homedir, tmpdir } from "node:os"
import { dirname, join, resolve } from "node:path"
import { fileURLToPath } from "node:url"

type Paths = { openclaw: string; config: string }
type Admin = {
  zaloAdminPaths: () => Paths
  deleteZaloAccount: (accountId: string) => Promise<void>
}
type Route = { DELETE: (req: Request) => Promise<Response> }

const APP = resolve(dirname(fileURLToPath(import.meta.url)), "..")
const ADMIN_SRC = join(APP, "src/lib/zalo-admin.ts")
const HOME_THAT = process.env.HOME ?? homedir()
const ENV_KEYS = ["HOME", "PATH", "OPS_API_TOKEN", "DATABASE_URL"] as const
const envCu: Partial<Record<(typeof ENV_KEYS)[number], string>> = {}

// Danh sách tài khoản giả: có khoá dạng cờ (`--channel`) và khoá thật ngoài khuôn slug (`Acc_5`).
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
let spyLog = ""
let cfgPath = ""
let admin: Admin
let route: Route

/** Đường thật (theo symlink) nếu có, không thì đường tuyệt đối — /var ↔ /private/var trên macOS. */
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

const datLai = () => {
  writeFileSync(cfgPath, JSON.stringify(FIXTURE, null, 2))
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
const accounts = (): Record<string, unknown> =>
  (JSON.parse(cfgBytes()) as typeof FIXTURE).channels.zalouser.accounts
const logoutLine = (id: string) => ["channels", "logout", "--channel", "zalouser", "--account", id].join("\t") + "\t"

async function del(body: unknown): Promise<{ status: number; json: { ok?: boolean; error?: string } }> {
  const res = await route.DELETE(
    new Request("http://localhost/api/v1/ops/zalo/accounts", {
      method: "DELETE",
      headers: { authorization: "Bearer T", "content-type": "application/json" },
      body: typeof body === "string" ? body : JSON.stringify(body),
    }),
  )
  return { status: res.status, json: (await res.json()) as { ok?: boolean; error?: string } }
}

/** Bản sao zalo-admin.ts bị đột biến (thay chuỗi `tu` bằng `thanh`), nạp từ thư mục tạm. */
async function banSao(ten: string, tu: string, thanh: string): Promise<Admin> {
  const goc = readFileSync(ADMIN_SRC, "utf8")
  const sao = goc.replace(tu, thanh)
  assert.notEqual(sao, goc, `bản sao ${ten}: đột biến không đổi gì — chuỗi «${tu}» không có trong zalo-admin.ts`)
  const dir = join(tmp, `mut-${ten}`)
  mkdirSync(dir, { recursive: true })
  writeFileSync(join(dir, "zalo-admin.ts"), sao)
  return (await import(join(dir, "zalo-admin.ts"))) as Admin
}

before(async () => {
  tmp = mkdtempSync(join(tmpdir(), "go-tk-"))
  spyLog = join(tmp, "spy.log")
  const home = join(tmp, "home")
  const script = `#!/bin/sh\nfor a in "$@"; do printf '%s\\t' "$a"; done >> "${spyLog}"\nprintf '\\n' >> "${spyLog}"\n`
  for (const dir of [join(home, ".openclaw", "bin"), join(tmp, "bin")]) {
    mkdirSync(dir, { recursive: true })
    writeFileSync(join(dir, "openclaw"), script)
    chmodSync(join(dir, "openclaw"), 0o755)
  }
  cfgPath = join(home, ".openclaw", "openclaw.json")
  datLai()

  for (const k of ENV_KEYS) envCu[k] = process.env[k]
  process.env.HOME = home
  process.env.PATH = `${join(tmp, "bin")}:${process.env.PATH ?? ""}`
  process.env.OPS_API_TOKEN = "T"
  // Cổng đóng: auditOpsWrite (lửa-rồi-quên, tự bắt lỗi) không ghi ops_audit vào DB local dùng chung.
  process.env.DATABASE_URL = "postgres://127.0.0.1:9/khong-co"

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
  if (tmp) rmSync(tmp, { recursive: true, force: true })
})

test("GT-AC-6 rào: homedir, realpath zaloAdminPaths().openclaw và .config nằm dưới thư mục tạm", () => {
  const p = admin.zaloAdminPaths()
  assertRao(tmp, p)
  assert.equal(thuc(p.openclaw), thuc(join(tmp, "home", ".openclaw", "bin", "openclaw")))
  assert.equal(thuc(p.config), thuc(cfgPath))
})

test("GT-AC-6 rào với HOME thật trả vi phạm nêu HOME thật", () => {
  const that = { openclaw: join(HOME_THAT, ".openclaw/bin/openclaw"), config: join(HOME_THAT, ".openclaw/openclaw.json") }
  assert.throws(() => assertRao(tmp, that, HOME_THAT), /HOME thật/)
  // Chỉ một đường lạc (config) cũng đủ chặn.
  assert.throws(() => assertRao(tmp, { ...admin.zaloAdminPaths(), config: that.config }), /HOME thật — config/)
})

test("GT-AC-1 id rỗng/thiếu/không phải chuỗi → 400, openclaw giả 0 lệnh, config giữ nguyên", async () => {
  datLai()
  const truoc = cfgBytes()
  const than: [unknown, string | null][] = [
    [{}, "id rỗng"],
    [{ id: "" }, "id rỗng"],
    [{ id: "   " }, null], // không cắt khoảng trắng → lớp «id có khoảng trắng»; vẫn 400, 0 lệnh
    [{ id: 5 }, "id rỗng"],
    [{ id: null }, "id rỗng"],
    ["not-json", "id rỗng"],
    ["null", "id rỗng"],
  ]
  for (const [b, loi] of than) {
    const r = await del(b)
    assert.equal(r.status, 400, `thân ${JSON.stringify(b)}`)
    if (loi) assert.equal(r.json.error, loi, `thân ${JSON.stringify(b)}`)
    assert.equal(spy().length, 0, `thân ${JSON.stringify(b)}: openclaw giả nhận lệnh`)
    assert.equal(cfgBytes(), truoc, `thân ${JSON.stringify(b)}: config bị đổi`)
  }
  // Đối chứng dương cùng fixture: id thật → openclaw giả nhận đúng một dòng (spy ghi được).
  const r = await del({ id: "acc2" })
  assert.equal(r.status, 200)
  assert.equal(spy().length, 1, "đối chứng dương: openclaw giả không ghi được lệnh của id thật")
  datLai()
})

test("GT-AC-1 bản sao bỏ bước kiểm id → openclaw giả nhận logout với id rỗng", async () => {
  datLai()
  const mut = await banSao("bo-kiem", "requireDeletableAccount(cfg, accountId);", "")
  await mut.deleteZaloAccount("")
  assert.ok(
    spy().some((l) => l === logoutLine("")),
    `logout với id rỗng: bản sao bỏ bước kiểm phải lọt lệnh logout --account "" — spy: ${JSON.stringify(spy())}`,
  )
  datLai()
})

test("GT-AC-2 id có khoảng trắng → 400, openclaw giả 0 lệnh, acc2 còn trong config", async () => {
  datLai()
  const truoc = cfgBytes()
  for (const id of [" acc2 ", "acc2 ", "acc 2", "acc2\n"]) {
    const r = await del({ id })
    assert.equal(r.status, 400, JSON.stringify(id))
    assert.equal(r.json.error, "id có khoảng trắng", JSON.stringify(id))
    assert.equal(spy().length, 0, `${JSON.stringify(id)}: openclaw giả nhận lệnh`)
    assert.equal(cfgBytes(), truoc, `${JSON.stringify(id)}: config bị đổi`)
    assert.ok("acc2" in accounts(), `${JSON.stringify(id)}: acc2 bị gỡ`)
  }
})

test("GT-AC-3 id lạ/default/dạng cờ → 400 đúng thông điệp lớp, openclaw giả 0 lệnh, config giữ nguyên", async () => {
  datLai()
  const truoc = cfgBytes()
  const bang: [string, string][] = [
    ["khong-co", "không có trong danh sách tài khoản"],
    ["../acc2", "không có trong danh sách tài khoản"],
    ["ACC2", "không có trong danh sách tài khoản"],
    ["default", "không xoá được tài khoản default"],
    ["--channel", "id dạng cờ"],
  ]
  for (const [id, loi] of bang) {
    const r = await del({ id })
    assert.equal(r.status, 400, id)
    assert.equal(r.json.error, loi, id)
    assert.equal(spy().length, 0, `${id}: openclaw giả nhận lệnh`)
    assert.equal(cfgBytes(), truoc, `${id}: config bị đổi`)
  }
  // Config không có danh sách tài khoản → «không có trong danh sách», không TypeError.
  writeFileSync(cfgPath, "{}")
  const r = await del({ id: "acc2" })
  assert.equal(r.status, 400)
  assert.equal(r.json.error, "không có trong danh sách tài khoản")
  assert.equal(spy().length, 0)
  datLai()
})

test("GT-AC-3 bản sao chỉ kiểm thành viên → openclaw giả nhận logout --account --channel, ca đỏ nêu dạng cờ", async () => {
  datLai()
  const mut = await banSao("chi-thanh-vien", 'if (accountId.startsWith("-")) throw new Error("id dạng cờ");', "")
  await mut.deleteZaloAccount("--channel")
  assert.ok(
    spy().some((l) => l === logoutLine("--channel")),
    `dạng cờ: bản sao chỉ kiểm thành viên phải lọt logout --account --channel — spy: ${JSON.stringify(spy())}`,
  )
  datLai()
})

test("GT-AC-4 id thật acc2 và Acc_5 → 200, mỗi lần đúng một lệnh logout --account <id>, config mất id đó còn default và acc3, có bản .bak", async () => {
  datLai()
  for (const id of ["acc2", "Acc_5"]) {
    rmSync(spyLog, { force: true })
    const r = await del({ id })
    assert.equal(r.status, 200, id)
    assert.deepEqual(r.json, { ok: true }, id)
    assert.deepEqual(spy(), [logoutLine(id)], `${id}: argv logout`)
    const acc = accounts()
    assert.ok(!(id in acc), `${id} còn trong config`)
    assert.ok("default" in acc && "acc3" in acc, `${id}: default/acc3 bị đụng`)
  }
  const bak = readdirSync(dirname(cfgPath)).filter((f) => f.startsWith("openclaw.json.bak-"))
  assert.ok(bak.length >= 1, "không có bản sao lưu openclaw.json.bak-*")
  // Gọi lại cùng id đã gỡ → 400, không lệnh mới.
  rmSync(spyLog, { force: true })
  const lai = await del({ id: "acc2" })
  assert.equal(lai.status, 400)
  assert.equal(lai.json.error, "không có trong danh sách tài khoản")
  assert.equal(spy().length, 0)
  datLai()
})
