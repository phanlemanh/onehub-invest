// api-surface-tep-an.test.tsx — hồ sơ _acceptance/qv-ac-9-khong-chap-chon: bộ quét của scripts/check-api-surface.mjs
// không ném ENOENT khi tệp đột biến tạm của test khác (`.xxx-mut-*.tsx`) biến mất giữa lúc quét. Tên ca mở đầu bằng mã
// AC (TA-AC-n). Mọi cây thử nằm dưới os.tmpdir() — test không ghi gì vào app/src thật. Mỗi phép đo có chiều đỏ trên
// cùng cây: bản đột biến sinh từ mã hiện tại bằng thay đúng một dòng, thông điệp ghim.
import { after, test } from "node:test"
import assert from "node:assert/strict"
import { spawn, spawnSync } from "node:child_process"
import { copyFileSync, cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import path, { join } from "node:path"
import { fileURLToPath, pathToFileURL } from "node:url"

type Io = { readdirSync: typeof readdirSync; statSync: typeof statSync; readFileSync: typeof readFileSync }
type LoadFiles = (base: string, io?: Io) => Record<string, string>

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..")
const SCRIPT = join(ROOT, "scripts/check-api-surface.mjs")
const GOC = readFileSync(SCRIPT, "utf8")

// Bốn dòng của bộ quét mà các bản đột biến bỏ — mỗi dòng là một nhánh hồ sơ hứa.
const L_AN = `    else if (name.startsWith(".")) continue;\n`
const L_STAT = `try { st = io.statSync(p); } catch (e) { if (matGiuaChung(e)) continue; throw e; }`
const L_DOC = `try { src = io.readFileSync(p, "utf8"); } catch (e) { if (matGiuaChung(e)) continue; throw e; }`
const L_DIR = `try { names = io.readdirSync(dir); } catch (e) { if (matGiuaChung(e)) return out; throw e; }`
const BO = {
  an: [L_AN, ""],
  stat: [L_STAT, "st = io.statSync(p);"],
  doc: [L_DOC, `src = io.readFileSync(p, "utf8");`],
  dir: [L_DIR, "names = io.readdirSync(dir);"],
} as const

const tam: string[] = []
const thuMucTam = (ten: string) => {
  const d = mkdtempSync(join(tmpdir(), `ta-${ten}-`))
  tam.push(d)
  return d
}
after(() => {
  for (const d of tam) rmSync(d, { recursive: true, force: true })
})

/** Bản chép bộ kiểm (kèm check-deals-api.mjs) vào <goc>/scripts, bỏ đúng các nhánh nêu tên; trả đường tệp. */
function chepBan(goc: string, bo: (keyof typeof BO)[], ten = "check-api-surface.mjs") {
  let src = GOC
  for (const k of bo) {
    const [tu, sang] = BO[k]
    assert.ok(src.includes(tu), `bản đột biến «bỏ ${k}» không áp được lên mã hiện tại`)
    src = src.replace(tu, sang)
  }
  mkdirSync(join(goc, "scripts"), { recursive: true })
  copyFileSync(join(ROOT, "scripts/check-deals-api.mjs"), join(goc, "scripts/check-deals-api.mjs"))
  const f = join(goc, "scripts", ten)
  writeFileSync(f, src)
  return f
}
const napDotBien = async (bo: (keyof typeof BO)[]): Promise<LoadFiles> =>
  (await import(pathToFileURL(chepBan(thuMucTam("dot-bien"), bo)).href)).loadFiles
const napThat = async (): Promise<LoadFiles> => (await import(pathToFileURL(SCRIPT).href)).loadFiles

/** Cây thử: một tệp thường, một route, một tệp ẩn, một thư mục con. */
function dungCay() {
  const base = thuMucTam("cay")
  const viet = (rel: string, src: string) => {
    mkdirSync(path.dirname(join(base, rel)), { recursive: true })
    writeFileSync(join(base, rel), src)
  }
  viet("app/src/lib/that.ts", "export const that = 1\n")
  viet("app/src/lib/.x-mut-1-that.tsx", "export const that = 2\n")
  viet("app/src/app/api/v1/a/route.ts", "export async function GET() {\n  return Response.json({})\n}\n")
  viet("app/src/lib/con/x.ts", "export const x = 1\n")
  return base
}
const loi = (code: string, p: string) => Object.assign(new Error(`${code}: ${p}`), { code })
const io = (o: Partial<Io>): Io => ({ readdirSync, statSync, readFileSync, ...o })
const khoa = (r: Record<string, string>) => Object.keys(r).sort()

// ---- Các phép đo — nhận loadFiles để chạy cả trên bản thật lẫn bản đột biến ----
function kiem1(loadFiles: LoadFiles, base: string) {
  const k = khoa(loadFiles(base))
  if (k.some((f) => path.basename(f).startsWith("."))) assert.fail(`TA-AC-1: tệp ẩn lọt vào kết quả (${k.join(", ")})`)
  assert.deepEqual(k, ["app/src/app/api/v1/a/route.ts", "app/src/lib/con/x.ts", "app/src/lib/that.ts"])
}
function kiem2a(loadFiles: LoadFiles, base: string) {
  const lib = join(base, "app/src/lib")
  const ma = io({ readdirSync: ((d: string) => (d === lib ? [...readdirSync(d), "ma.tsx", "ma-dir"] : readdirSync(d))) as typeof readdirSync })
  let r: Record<string, string>
  try {
    r = loadFiles(base, ma)
  } catch (e) {
    assert.fail(`TA-AC-2a: mục biến mất trước stat làm loadFiles ném ${(e as { code?: string }).code}`)
  }
  assert.ok(!khoa(r).some((f) => f.includes("/ma")), "TA-AC-2a: mục ma nằm trong kết quả")
  assert.ok(khoa(r).includes("app/src/lib/that.ts"), "TA-AC-2a: tệp thật cạnh mục ma bị mất")
}
function kiem2b(loadFiles: LoadFiles, base: string) {
  const that = join(base, "app/src/lib/that.ts")
  const mat = io({
    readFileSync: ((p: string, enc: BufferEncoding) => {
      if (p === that) throw loi("ENOENT", p)
      return readFileSync(p, enc)
    }) as typeof readFileSync,
  })
  let r: Record<string, string>
  try {
    r = loadFiles(base, mat)
  } catch (e) {
    assert.fail(`TA-AC-2b: tệp biến mất trước khi đọc làm loadFiles ném ${(e as { code?: string }).code}`)
  }
  assert.deepEqual(khoa(r), ["app/src/app/api/v1/a/route.ts", "app/src/lib/con/x.ts"])
}
function kiem2c(loadFiles: LoadFiles, base: string) {
  const con = join(base, "app/src/lib/con")
  const mat = io({
    readdirSync: ((d: string) => {
      if (d === con) throw loi("ENOENT", d)
      return readdirSync(d)
    }) as typeof readdirSync,
  })
  let r: Record<string, string>
  try {
    r = loadFiles(base, mat)
  } catch (e) {
    assert.fail(`TA-AC-2c: thư mục biến mất trước khi liệt kê làm loadFiles ném ${(e as { code?: string }).code}`)
  }
  assert.deepEqual(khoa(r), ["app/src/app/api/v1/a/route.ts", "app/src/lib/that.ts"])
}
function kiem2d(loadFiles: LoadFiles, base: string) {
  const that = join(base, "app/src/lib/that.ts")
  const cam = io({
    statSync: ((p: string) => {
      if (p === that) throw loi("EACCES", p)
      return statSync(p)
    }) as typeof statSync,
  })
  assert.throws(() => loadFiles(base, cam), (e: { code?: string }) => e.code === "EACCES", "TA-AC-2d: lỗi EACCES bị nuốt")
}

test("TA-AC-1 loadFiles bỏ tệp ẩn, giữ tệp thường, route và thư mục con; bản bỏ nhánh tệp ẩn đỏ", async () => {
  const base = dungCay()
  kiem1(await napThat(), base)
  const dotBien = await napDotBien(["an"])
  assert.throws(() => kiem1(dotBien, base), /TA-AC-1: tệp ẩn lọt vào kết quả/)
})

test("TA-AC-2 mục biến mất ở ba cửa sổ không làm loadFiles ném; lỗi khác ENOENT vẫn ném; mỗi bản bỏ một nhánh đỏ đúng ca", async () => {
  const base = dungCay()
  const that = await napThat()
  kiem2a(that, base)
  kiem2b(that, base)
  kiem2c(that, base)
  kiem2d(that, base)
  const napDotBienDongBo = { stat: await napDotBien(["stat"]), doc: await napDotBien(["doc"]), dir: await napDotBien(["dir"]) }
  assert.throws(() => kiem2a(napDotBienDongBo.stat, base), /TA-AC-2a: mục biến mất trước stat làm loadFiles ném ENOENT/)
  assert.throws(() => kiem2b(napDotBienDongBo.doc, base), /TA-AC-2b: tệp biến mất trước khi đọc làm loadFiles ném ENOENT/)
  assert.throws(() => kiem2c(napDotBienDongBo.dir, base), /TA-AC-2c: thư mục biến mất trước khi liệt kê làm loadFiles ném ENOENT/)
})

// Tiến trình con sinh-xoá tệp ẩn liên tục tới khi tệp dừng xuất hiện; in số tệp đã sinh-xoá.
const CHURN = `
import { existsSync, rmSync, writeFileSync } from "node:fs"
const [dir, dung] = process.argv.slice(1)
let n = 0
while (!existsSync(dung)) {
  const p = dir + "/.qv-mut-" + process.pid + "-" + (n % 50) + ".tsx"
  writeFileSync(p, "export const x = 1\\n")
  rmSync(p, { force: true })
  n++
}
process.stdout.write(String(n))
`
/** Đếm tệp .qv-mut-* trong app/src thật — chịu ENOENT vì test khác cũng sinh-xoá tệp ẩn ở đó. */
function demQvMutThat(dir = join(ROOT, "app/src")): number {
  let n = 0
  let names: string[] = []
  try {
    names = readdirSync(dir)
  } catch {
    return 0
  }
  for (const name of names) {
    if (name.startsWith(".qv-mut-")) n++
    try {
      if (statSync(join(dir, name)).isDirectory()) n += demQvMutThat(join(dir, name))
    } catch {
      // mục vừa biến mất
    }
  }
  return n
}

test("TA-AC-3 dưới tải sinh-xoá tệp ẩn: bản mới thoát 0 mọi lượt; bản không bỏ tệp ẩn và không chịu ENOENT gặp ENOENT trong trần", async () => {
  assert.equal(demQvMutThat(), 0, "TA-AC-3: tệp sinh-xoá lọt vào cây thật (trước ca)")
  const goc = thuMucTam("chep")
  cpSync(join(ROOT, "app/src"), join(goc, "app/src"), { recursive: true, filter: (s) => !path.basename(s).startsWith(".") })
  const moi = chepBan(goc, [])
  const cu = chepBan(goc, ["an", "stat", "doc", "dir"], "check-api-surface-cu.mjs")
  const dung = join(goc, "dung")
  const con = spawn(process.execPath, ["--input-type=module", "-e", CHURN, join(goc, "app/src/lib"), dung], { stdio: ["ignore", "pipe", "inherit"] })
  let dem = ""
  con.stdout.on("data", (d) => (dem += d))
  const xong = new Promise<number>((ok) => con.on("exit", (c) => ok(c ?? 1)))
  try {
    for (const che of ["static", "mutation"]) {
      for (let i = 0; i < 5; i++) {
        const r = spawnSync(process.execPath, [moi, che], { encoding: "utf8" })
        if (r.status !== 0) assert.fail(`TA-AC-3: bản mới đỏ dưới tải sinh-xoá (${che} lượt ${i + 1}): ${r.stderr.split("\n")[0]}${r.stdout.split("\n").filter((l) => l.startsWith("FAIL")).join("; ")}`)
      }
    }
    const han = Date.now() + 90_000
    let gap = false
    for (let i = 0; i < 60 && Date.now() < han && !gap; i++) {
      const r = spawnSync(process.execPath, [cu, "static"], { encoding: "utf8" })
      gap = r.status !== 0 && /ENOENT/.test(r.stderr)
    }
    if (!gap) assert.fail("TA-AC-3: bản không chịu ENOENT không tái hiện lỗi trong trần")
  } finally {
    writeFileSync(dung, "")
    await xong
  }
  assert.ok(Number(dem) >= 1000, `TA-AC-3: tải sinh-xoá không chạy (chỉ ${dem || 0} tệp)`)
  assert.equal(readdirSync(join(goc, "app/src/lib")).filter((f) => f.startsWith(".qv-mut-")).length, 0, "TA-AC-3: tiến trình sinh-xoá để sót tệp")
  assert.equal(demQvMutThat(), 0, "TA-AC-3: tệp sinh-xoá lọt vào cây thật (sau ca)")
  assert.ok(existsSync(SCRIPT))
})
