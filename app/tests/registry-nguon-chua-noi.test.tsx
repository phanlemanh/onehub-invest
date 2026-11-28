// registry-nguon-chua-noi.test.tsx — hồ sơ _acceptance/bang-noi-ma-du-an (DA3), ca «BN-AC-8» (E8): ô «Mã nguồn chưa nối» ở
// /ops/registry đếm thêm S07, S16; S09 theo tập DA42 (v_s09_db_du_an) và project_links S09 do DA42 ghi — DA3 không ghi S09; mã chỉ
// có ở tập cũ (v_s09_du_an_moi) và S10 (không có vị trí) hiện dòng riêng, không cộng vào ô (Hỏi-3, Mạnh duyệt 28/11). Chạy trên DB của riêng
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
import { docDanhBa, DONG_RIENG, type DanhBa, type TongDanhBa } from "../src/lib/ops/registry/doc"

const APP = resolve(dirname(fileURLToPath(import.meta.url)), "..")
// Bản đột biến đặt trong app/tests (khuôn RS8 của DA55) để còn tìm được node_modules của app; xoá khi xong.
const TAM = join(APP, "tests", `.da3-o-man-${process.pid}`)
// Thư mục tạm chỉ dựng khi ghi bản đột biến (ca bị bỏ qua trên CI không để lại thư mục).
const URL_DB = process.env.DATABASE_URL ?? ""
const c = new pg.Client({ connectionString: URL_DB })

let truoc: DanhBa
let sau: DanhBa

before(async () => {
  assert.match(new URL(URL_DB).pathname, /^\/oneinvest_suite_[a-z0-9_]+$/, "BN-AC-8 chỉ chạy trên DB của riêng lượt oneinvest_suite_*")
  await c.connect()
  await c.query("BEGIN")
  truoc = await docDanhBa(c)
  for (const nguon of ["S07", "S10", "S16"]) {
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
const TAP_CU = DONG_RIENG["S09:tap-cu"].lyDo
const dong = (d: DanhBa, s: string) => d.tong.danhMuc.find((x) => x.source === s && x.lyDoRieng !== TAP_CU)
const dongTapCu = (d: DanhBa) => d.tong.danhMuc.find((x) => x.lyDoRieng === TAP_CU)

test("BN-AC-8 S07, S16 co dong, da nap bang tap ban ghi, da noi bang project_links", async () => {
  const s07 = dong(sau, "S07")!, s16 = dong(sau, "S16")!
  assert.equal(s07.daNap, await dem(`SELECT count(*) AS n FROM (SELECT pj_id FROM stg_s07_project_card UNION SELECT pj_id FROM stg_s07_project) x`))
  assert.equal(s07.daNoi, await dem(`SELECT count(*) AS n FROM project_links WHERE source = 'S07' AND status = 'noi'`))
  assert.equal(s16.daNoi, await dem(`SELECT count(*) AS n FROM project_links WHERE source = 'S16' AND status = 'noi'`))
  assert.ok(s07.tinhVaoO && s16.tinhVaoO)
})

test("BN-AC-8 S09 theo tap DA42: da nap, da noi doc tu project_links S09; DA3 khong doi dong S09", async () => {
  const s09 = dong(sau, "S09")!
  assert.equal(s09.daNap, await dem(`SELECT count(DISTINCT du_an_id) AS n FROM v_s09_db_du_an`), "đã nạp = tập DA42")
  const n = await dem(`SELECT count(*) AS n FROM project_links pl JOIN (SELECT DISTINCT du_an_id FROM v_s09_db_du_an) d
    ON pl.source = 'S09' AND pl.source_project_id = d.du_an_id WHERE pl.status = 'noi'`)
  assert.ok(n > 0, "DA42 đã nối dự án S09 trên bản chép")
  assert.equal(s09.daNoi, n, "đã nối đọc từ project_links S09, không còn hằng 0")
  assert.ok(s09.tinhVaoO)
  assert.deepEqual(dong(sau, "S09"), dong(truoc, "S09"), "áp S07, S10, S16 không đổi dòng S09")
})

test("BN-AC-8 S09 tap cu: ma chi co o v_s09_du_an_moi hien dong rieng, khong cong vao o, ma co o hai tap dem mot lan", async () => {
  const cu = dongTapCu(sau)!
  assert.ok(cu, "có dòng S09 tập cũ")
  const chiCu = await dem(`SELECT count(*) AS n FROM (SELECT DISTINCT project_id::text FROM v_s09_du_an_moi EXCEPT SELECT du_an_id FROM v_s09_db_du_an) x`)
  assert.equal(cu.daNap, chiCu, "dòng tập cũ bằng số mã chỉ có ở tập cũ")
  assert.equal(cu.source, "S09")
  assert.equal(cu.tinhVaoO, false)
  const tapMoi = await dem(`SELECT count(DISTINCT du_an_id) AS n FROM v_s09_db_du_an`)
  const hop = await dem(`SELECT count(*) AS n FROM (SELECT project_id::text FROM v_s09_du_an_moi UNION SELECT du_an_id FROM v_s09_db_du_an) x`)
  assert.equal(dong(sau, "S09")!.daNap + cu.daNap, hop, "mã chung hai tập đếm một lần, theo tập DA42")
  assert.equal(tapMoi + chiCu, hop)
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

/** Kiểm con số ô dựng ra: bằng tổng chưa nối của S06, S07, S08, S09 (tập DA42), S16; dòng S10 và dòng S09 tập cũ hiện riêng.
 *  Số mong tính độc lập theo nguồn và nhãn, không đọc cờ tinhVaoO; lệch thì thông điệp gọi tên phần bị cộng thừa. */
function kiemO(fn: typeof oSo, tong: TongDanhBa = sau.tong) {
  const o = fn(tong).find((x) => x.title === "Mã nguồn chưa nối")!
  const laTapCu = (d: TongDanhBa["danhMuc"][number]) => d.lyDoRieng === TAP_CU
  const mong = tong.danhMuc.filter((d) => d.source !== "S10" && !laTapCu(d)).reduce((a, d) => a + d.chuaNoi, 0)
  const s10 = tong.danhMuc.find((d) => d.source === "S10")?.chuaNoi ?? 0
  const cu = tong.danhMuc.find(laTapCu)?.chuaNoi ?? 0
  const lech = Number(String(o.value).replace(/\./g, "")) - mong
  const thua = [lech === s10 || lech === s10 + cu ? "S10" : "", lech === cu || lech === s10 + cu ? "tap-cu" : ""].filter(Boolean).join(" + ")
  assert.equal(lech, 0, `ô không được cộng ${thua || "phần lạ"} (lệch ${lech})`)
  assert.match(String(o.footer), /S10 \d[\d.]*\/\d[\d.]* không có vị trí/)
  assert.match(String(o.footer), /S09 \d[\d.]*\/\d[\d.]* chưa có ở danh bạ S09 mới/)
}

test("BN-AC-8 o dung ra tren man bang tong nam nguon, khong cong S10, khong cong S09 tap cu", () => {
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
  mkdirSync(TAM, { recursive: true })
  const f = join(TAM, `dot-${tep.split("/").pop()}`)
  writeFileSync(f, ban)
  return f
}

test("BN-AC-8 chieu do: cong moi nguon vao o thi ca S10 do", async () => {
  const f = banChep("src/components/ops/registry/registry-view.tsx", "const vaoO = tong.danhMuc.filter((d) => d.tinhVaoO)", "const vaoO = tong.danhMuc")
  const m = (await import(pathToFileURL(f).href)) as { oSo: typeof oSo }
  assert.throws(() => kiemO(m.oSo), /ô không được cộng S10/)
})

test("BN-AC-8 chieu do: tinh dong S09 tap cu vao o thi ca tap-cu do", async () => {
  const f = banChep("src/lib/ops/registry/doc.ts", "&& !(r.source in DONG_RIENG),", ",")
  const m = (await import(pathToFileURL(f).href)) as { docDanhBa: typeof docDanhBa }
  const dot = await m.docDanhBa(c)
  assert.throws(() => kiemO(oSo, dot.tong), /ô không được cộng tap-cu/)
})
