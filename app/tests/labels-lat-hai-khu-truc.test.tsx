// labels-lat-hai-khu-truc.test.tsx — hồ sơ _acceptance/lat-hai-khu-truc-khai-o (HT21), ca «HT21-AC-n».
// Lát nhãn trục hai-khu-truc của PL36 khai đúng hai ô Toà + Trục (khuôn lat-khai-o-can-gan) và là ngoại lệ có tên của luật gắn mù:
// nháp của trợ lý hiện, lọc về hai ô. Biểu mẫu dựng thật trên jsdom; bản đột biến chép ra thư mục tạm của hệ điều hành (không ghi
// cạnh mã thật), import tương đối viết lại thành đường tuyệt đối. Không cần DB.
import { after, test } from "node:test"
import assert from "node:assert/strict"
import { existsSync, mkdtempSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { dirname, join, resolve } from "node:path"
import { fileURLToPath, pathToFileURL } from "node:url"
import { renderToStaticMarkup } from "react-dom/server"
import { JSDOM } from "jsdom"

import { hienNhap, moTaLatKhaiO, nhanO, oCuaLat } from "../src/lib/labels-normalize"
import { nhapChoLat } from "../src/lib/labels-queries"

const APP = resolve(dirname(fileURLToPath(import.meta.url)), "..")
const TAM = mkdtempSync(join(tmpdir(), "ht21-dot-"))
after(() => rmSync(TAM, { recursive: true, force: true }))
const LAT = "hai-khu-truc"
const MU = "hai-khu-ghep-b"
const CHU = "Cho thuê căn 2PN toà PR6, trục PR6xx23, full nội thất"
const tin = (lat: string, nhap: { cachDoc: string; o: Record<string, string | null> } | null = null) =>
  ({ itemId: 1, lat, doubleLabel: false, soNguoi: 0, text: CHU, anh: [], soLinkKhac: 0, ghep: null, groupName: "Nhóm", postedAt: null, nhap })
// Khuôn nháp của phiên gắn nhãn (GN, 24/11): building tên toà chữ hoa, stack hai chữ số; thêm hai ô ngoài lát để thấy phép lọc.
const DRAFT = { hien: "gn", o_nguoi: [], cach_doc: { gn: { trang_thai: "co", o: { building: "PR6", stack: "23", floor: "12", project: "Vinhomes Ocean Park 1" } } } }

let soBan = 0
/**
 * Bản chép một tệp nguồn ra thư mục tạm, đổi đúng một chỗ; import tương đối trỏ về tệp thật, trừ các tệp đã chép trong `thay`
 * (đường gốc không đuôi → bản chép), để chuỗi import đi qua đúng bản đột biến.
 */
function banChep(tep: string, tu: string | null, thanh: string, thay: Record<string, string> = {}): string {
  const goc = readFileSync(join(APP, tep), "utf8")
  if (tu !== null) assert.ok(goc.includes(tu), `đột biến không áp được: ${tu}`)
  const thu = dirname(join(APP, tep))
  const giai = (ten: string) => {
    if (!ten.startsWith(".") && !ten.startsWith("@/")) return ten
    const g = ten.startsWith("@/") ? join(APP, "src", ten.slice(2)) : join(thu, ten)
    if (thay[g]) return pathToFileURL(thay[g]).href
    const f = [".ts", ".tsx", "/index.ts", "/index.tsx", ""].map((d) => g + d).find((x) => existsSync(x) && !statSync(x).isDirectory())
    return pathToFileURL(f ?? g).href
  }
  const ban = (tu === null ? goc : goc.replace(tu, thanh)).replace(/from "([^"]+)"/g, (_m, ten: string) => `from "${giai(ten)}"`)
  const f = join(TAM, `${++soBan}-${tep.split("/").pop()}`)
  writeFileSync(f, ban)
  return f
}
const NORM = "src/lib/labels-normalize.ts"
const khoaNorm = join(APP, "src/lib/labels-normalize")

async function bieuMau(lat: string, nhap: Parameters<typeof tin>[1] = null) {
  const { LabelFormNhom } = await import("../src/components/ops/labels/label-form-nhom")
  return new JSDOM(renderToStaticMarkup(<LabelFormNhom lat={lat} tin={tin(lat, nhap)} hrefXem="/xem" hrefTinKe="/ke" />)).window.document
}

test("HT21-AC-1 lát hai-khu-truc khai đúng hai ô Toà, Trục, nhãn Trục nói rõ cách đọc", () => {
  assert.deepEqual(oCuaLat(LAT), ["building", "stack"], "lát hai-khu-truc phải khai đúng hai ô building, stack")
  assert.equal(nhanO(LAT, "stack"), "Trục (hai số cuối của số căn)")
  assert.equal(nhanO(LAT, "building"), "Toà")
  assert.deepEqual(oCuaLat(MU), ["building", "subzone"], "đối chứng: lát hai-khu-ghep-b không đổi")
})

test("HT21-AC-2 biểu mẫu dựng thật: chỉ hai ô, mỗi ô có «Không suy ra được», không căn cứ, không Lý do; lát không khai đủ ô", async () => {
  const d = await bieuMau(LAT)
  assert.deepEqual([...d.querySelectorAll("[data-o]")].map((x) => x.getAttribute("data-o")), ["building", "stack"])
  assert.equal(d.querySelector('label[for="nhan-stack"]')?.textContent, "Trục (hai số cuối của số căn)")
  for (const nhan of ["Toà", "Trục (hai số cuối của số căn)"]) assert.ok(d.querySelector(`[aria-label="${nhan}: không suy ra được"]`), `ô ${nhan} thiếu «Không suy ra được»`)
  assert.match(d.body.textContent!, /0\/2/)
  // Đối chứng dương trên cùng cách đếm: lát không khai có ô căn cứ, ô Lý do và đủ 24 ô — nên «0 ô căn cứ», «không ô Lý do» đo thật.
  const cu = await bieuMau("s03-theo-nhom")
  assert.equal(cu.querySelectorAll("[data-o]:not([data-o=reason])").length, 24, "đối chứng: lát không khai phải đủ 24 ô")
  assert.ok(cu.querySelectorAll('[aria-label$=": căn cứ"]').length > 0, "đối chứng: lát không khai phải có ô căn cứ")
  assert.ok(cu.querySelector("#nhan-reason"), "đối chứng: lát không khai phải có ô Lý do")
  assert.equal(d.querySelectorAll('[aria-label$=": căn cứ"]').length, 0, "còn ô căn cứ")
  assert.equal(d.querySelector("#nhan-reason"), null, "còn ô Lý do")
})

test("HT21-AC-3 chiều đỏ: bỏ dòng khai thì lát hai-khu-truc không còn khai ô, phép so đỏ gọi tên lát", async () => {
  const f = banChep(NORM, '  "hai-khu-truc": ["building", "stack"],\n', "")
  const m = (await import(pathToFileURL(f).href)) as { oCuaLat: typeof oCuaLat }
  assert.equal(m.oCuaLat(LAT), null)
  assert.throws(() => assert.deepEqual(m.oCuaLat(LAT), ["building", "stack"], "lát hai-khu-truc phải khai đúng hai ô building, stack"),
    /lát hai-khu-truc phải khai đúng hai ô/)
})

// HT21-AC-4 — nháp của trợ lý: máy chủ lọc về hai ô; màn nhận ĐÚNG đầu ra máy chủ; lát gắn mù không lộ nháp ở cả hai tầng.
const kiemGanMu = (fn: typeof nhapChoLat) => assert.equal(fn(MU, DRAFT), null, "hai-khu-ghep-b là lát gắn mù — nháp không được rời máy chủ")

test("HT21-AC-4 máy chủ: hai-khu-truc nhận nháp đúng hai ô; hai-khu-ghep-b không lộ nháp; lát không khai giữ nguyên", () => {
  assert.deepEqual(nhapChoLat(LAT, DRAFT), { cachDoc: "gn", o: { building: "PR6", stack: "23" } }, "hai-khu-truc phải nhận nháp lọc về building, stack")
  kiemGanMu(nhapChoLat)
  assert.deepEqual(Object.keys(nhapChoLat("s03-theo-nhom", DRAFT)?.o ?? {}).sort(), ["building", "floor", "project", "stack"], "lát không khai giữ nguyên nháp")
  assert.equal(nhapChoLat(LAT, { hien: "gn", cach_doc: { gn: { trang_thai: "co", o: { floor: "12" } } } }), null, "nháp không còn ô của lát thì không có nháp")
  assert.deepEqual([hienNhap(LAT), hienNhap(MU), hienNhap("s03-theo-nhom")], [true, false, true], "hienNhap: hai-khu-truc có, hai-khu-ghep-b không, lát không khai có")
})

test("HT21-AC-4 màn nhận đúng đầu ra máy chủ: hai-khu-truc điền sẵn và hiện «Nháp máy»; hai-khu-ghep-b không có gì", async () => {
  const d = await bieuMau(LAT, nhapChoLat(LAT, DRAFT))
  assert.ok(d.querySelector('[data-labels-nhap="gn"]'), "hai-khu-truc thiếu nhãn «Nháp máy»")
  assert.equal(d.querySelector("#nhan-stack")?.getAttribute("value"), "23", "ô Trục không điền sẵn nháp")
  assert.equal(d.querySelector("#nhan-building")?.getAttribute("value"), "PR6", "ô Toà không điền sẵn nháp")
  const b = await bieuMau(MU, nhapChoLat(MU, DRAFT))
  assert.equal(b.querySelector("[data-labels-nhap]"), null, "hai-khu-ghep-b lộ nháp trên màn")
  assert.ok(!b.querySelector("#nhan-building")?.getAttribute("value"), "hai-khu-ghep-b điền sẵn nháp")
})

test("HT21-AC-4 chiều đỏ: đưa hai-khu-ghep-b vào danh sách có nháp thì phép so gắn mù của máy chủ đỏ, gọi tên lát", async () => {
  const norm = banChep(NORM, 'new Set(["hai-khu-truc"])', 'new Set(["hai-khu-truc", "hai-khu-ghep-b"])')
  const q = banChep("src/lib/labels-queries.ts", null, "", { [khoaNorm]: norm })
  const m = (await import(pathToFileURL(q).href)) as { nhapChoLat: typeof nhapChoLat }
  assert.throws(() => kiemGanMu(m.nhapChoLat), /hai-khu-ghep-b là lát gắn mù/, "bản đột biến phải làm đỏ đúng phép so gắn mù của ca xanh")
})

test("HT21-AC-5 mô tả đầu trang theo lát: hai-khu-truc ghi Toà, Trục và nói ô điền sẵn là nháp máy; lát gắn mù giữ câu cũ", () => {
  assert.equal(moTaLatKhaiO(LAT), "Đọc từng bài và ghi Toà, Trục (hai số cuối của số căn). Các ô đã điền sẵn nháp máy — sửa chỗ sai rồi lưu.")
  assert.equal(moTaLatKhaiO(MU), "Đọc từng bài và ghi toà, phân khu hoặc cụm. Máy không cho thấy nó đã đọc ra gì.", "lát gắn mù giữ câu cũ")
  assert.equal(moTaLatKhaiO("s03-theo-nhom"), null, "lát không khai dùng câu của nó")
  const view = readFileSync(join(APP, "src/components/ops/labels/labels-view.tsx"), "utf8")
  assert.match(view, /description=\{oLat \? \(moTaLatKhaiO\(lat\) \?\? DESCRIPTION\)/, "màn phải chọn câu đầu trang của lát khai ô qua moTaLatKhaiO")
})

test("HT21-AC-5 chiều đỏ: mô tả cố định cho mọi lát khai ô thì ca hai-khu-truc đỏ", async () => {
  const f = banChep(NORM, "  if (!LAT_KHAI_O_CO_NHAP.has(lat)) return", "  if (true) return")
  const m = (await import(pathToFileURL(f).href)) as { moTaLatKhaiO: typeof moTaLatKhaiO }
  assert.throws(() => assert.match(m.moTaLatKhaiO(LAT) ?? "", /nháp máy/, "câu đầu trang của hai-khu-truc phải nói ô điền sẵn là nháp máy"), /nháp máy/)
})
