// registry-nguon-chua-noi.test.tsx — hồ sơ _acceptance/bang-noi-ma-du-an (DA3), ca «BN-AC-8» (E8): ô «Mã nguồn chưa nối» ở
// /ops/registry đếm thêm S07, S16, lấy số S09 đã nối từ project_links, tách S10 (không có vị trí) khỏi ô. Chạy trên DB của riêng
// lượt (db/db-thu.sh oneinvest_suite_* --chay) — bản chép DB máy thu — trong một giao dịch ROLLBACK; dòng nối dựng bằng chính apThe
// của pipeline (không chèn tay khuôn bên đọc). Chiều đỏ: bản chép registry-view.tsx cộng mọi nguồn thì ô dư đúng số chưa nối của S10.
import { after, before, test } from "node:test"
import assert from "node:assert/strict"
import { existsSync, mkdirSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs"
import { dirname, join, resolve } from "node:path"
import { fileURLToPath, pathToFileURL } from "node:url"
import pg from "pg"
import { renderToStaticMarkup } from "react-dom/server"

import { apThe, dungThe } from "../../pipeline/noi-du-an-nguon.mjs"
import { oSo, RegistryView } from "../src/components/ops/registry/registry-view"
import { docDanhBa, type DanhBa } from "../src/lib/ops/registry/doc"

const APP = resolve(dirname(fileURLToPath(import.meta.url)), "..")
// Bản đột biến đặt trong app/tests (khuôn RS8 của DA55) để còn tìm được node_modules của app; xoá khi xong.
const TAM = join(APP, "tests", `.da3-o-man-${process.pid}`)
mkdirSync(TAM, { recursive: true })
const URL_DB = process.env.DATABASE_URL ?? ""
const c = new pg.Client({ connectionString: URL_DB })

let truoc: DanhBa
let sau: DanhBa

before(async () => {
  assert.match(new URL(URL_DB).pathname, /^\/oneinvest_suite_[a-z0-9_]+$/, "BN-AC-8 chỉ chạy trên DB của riêng lượt oneinvest_suite_*")
  await c.connect()
  await c.query("BEGIN")
  truoc = await docDanhBa(c)
  for (const nguon of ["S07", "S09", "S10", "S16"]) {
    const the = await dungThe(c, nguon)
    await apThe(c, { nguon, bam: the.bam, nguoi: "thu-bn-ac-8", giaoDich: "ngoai" })
  }
  sau = await docDanhBa(c)
})
after(async () => {
  await c.query("ROLLBACK").catch(() => {})
  await c.end().catch(() => {})
  rmSync(TAM, { recursive: true, force: true })
})

const dem = async (sql: string) => Number((await c.query(sql)).rows[0].n)
const dong = (d: DanhBa, s: string) => d.tong.danhMuc.find((x) => x.source === s)

test("BN-AC-8 S07, S16 co dong, da nap bang tap ban ghi, da noi bang project_links", async () => {
  const s07 = dong(sau, "S07")!, s16 = dong(sau, "S16")!
  assert.equal(s07.daNap, await dem(`SELECT count(*) AS n FROM (SELECT pj_id FROM stg_s07_project_card UNION SELECT pj_id FROM stg_s07_project) x`))
  assert.equal(s07.daNoi, await dem(`SELECT count(*) AS n FROM project_links WHERE source = 'S07' AND status = 'noi'`))
  assert.equal(s16.daNoi, await dem(`SELECT count(*) AS n FROM project_links WHERE source = 'S16' AND status = 'noi'`))
  assert.ok(s07.tinhVaoO && s16.tinhVaoO)
})

test("BN-AC-8 S09 da noi doc tu project_links, khong con hang 0", async () => {
  assert.equal(dong(truoc, "S09")!.daNoi, 0, "trước áp: S09 chưa có dòng nối")
  const n = await dem(`SELECT count(*) AS n FROM project_links WHERE source = 'S09' AND status = 'noi'`)
  assert.ok(n > 0)
  assert.equal(dong(sau, "S09")!.daNoi, n)
})

test("BN-AC-8 S10 hien rieng, khong cong vao o; S06, S08 nhu truoc", () => {
  const s10 = dong(sau, "S10")!
  assert.equal(s10.tinhVaoO, false)
  assert.equal(s10.lyDoRieng, "không có vị trí")
  for (const s of ["S06", "S08"]) assert.deepEqual(dong(sau, s), dong(truoc, s), `${s} không đổi`)
  const lyDo = new Set(sau.chuaNoi.filter((m) => m.source === "S10").map((m) => m.lyDo))
  assert.deepEqual([...lyDo], ["khong-vi-tri"], "danh sách chưa nối mang lý do của project_links")
  assert.equal(sau.chuaNoi.filter((m) => m.source === "S07").length, dong(sau, "S07")!.chuaNoi, "mỗi dự án đếm một lần")
})

/** Kiểm con số ô dựng ra: bằng tổng chưa nối của nguồn cộng vào ô; dòng S10 hiện riêng kèm lý do. */
function kiemO(fn: typeof oSo) {
  const o = fn(sau.tong).find((x) => x.title === "Mã nguồn chưa nối")!
  const mong = sau.tong.danhMuc.filter((d) => d.source !== "S10").reduce((a, d) => a + d.chuaNoi, 0)
  assert.equal(o.value, mong.toLocaleString("vi-VN"), "ô không được cộng S10")
  assert.match(String(o.footer), /S10 \d[\d.]*\/\d[\d.]* không có vị trí/)
}

test("BN-AC-8 o dung ra tren man bang tong nam nguon, khong cong S10", () => {
  kiemO(oSo)
  const html = renderToStaticMarkup(<RegistryView mode="local" tong={sau.tong} rows={[]} chuaNoi={sau.chuaNoi} />)
  assert.match(html, /không có vị trí/)
})

/** Bản chép tệp ra thư mục tạm, đổi đúng một chỗ, import tương đối và «@/» viết lại thành đường tuyệt đối. */
function banChep(tep: string, tu: string, thanh: string): string {
  const goc = readFileSync(join(APP, tep), "utf8")
  assert.ok(goc.includes(tu), `đột biến không áp được: ${tu}`)
  const thu = dirname(join(APP, tep))
  const ban = goc.replace(tu, thanh).replace(/from "([^"]+)"/g, (_m, ten: string) => {
    if (!ten.startsWith(".") && !ten.startsWith("@/")) return `from "${ten}"`
    const g = ten.startsWith("@/") ? join(APP, "src", ten.slice(2)) : join(thu, ten)
    const f = [".ts", ".tsx", "/index.ts", "/index.tsx", ""].map((d) => g + d).find((x) => existsSync(x) && !statSync(x).isDirectory())
    return `from "${pathToFileURL(f ?? g).href}"`
  })
  const f = join(TAM, `dot-${tep.split("/").pop()}`)
  writeFileSync(f, ban)
  return f
}

test("BN-AC-8 chieu do: cong moi nguon vao o thi ca S10 do", async () => {
  const f = banChep("src/components/ops/registry/registry-view.tsx", "const vaoO = tong.danhMuc.filter((d) => d.tinhVaoO)", "const vaoO = tong.danhMuc")
  const m = (await import(pathToFileURL(f).href)) as { oSo: typeof oSo }
  assert.throws(() => kiemO(m.oSo), /ô không được cộng S10/)
})
