// labels-lat-hai-khu-truc.test.tsx — hồ sơ _acceptance/lat-hai-khu-truc-khai-o (HT21), ca «HT21-AC-n».
// Lát nhãn trục hai-khu-truc của PL36 khai đúng hai ô Toà + Trục (khuôn lat-khai-o-can-gan): biểu mẫu dựng thật chỉ hiện hai ô,
// không ô căn cứ, không Lý do; bỏ dòng khai thì lát quay về biểu mẫu đủ ô và ca đỏ. Không cần DB.
import { test } from "node:test"
import assert from "node:assert/strict"
import { readFileSync, rmSync, writeFileSync } from "node:fs"
import { dirname, join, resolve } from "node:path"
import { fileURLToPath, pathToFileURL } from "node:url"
import { renderToStaticMarkup } from "react-dom/server"
import { JSDOM } from "jsdom"

import { nhanO, oCuaLat } from "../src/lib/labels-normalize"

const APP = resolve(dirname(fileURLToPath(import.meta.url)), "..")
const LAT = "hai-khu-truc"
const CHU = "Cho thuê căn 2PN toà PR6, trục PR6xx23, full nội thất"
const tin = (lat: string) => ({ itemId: 1, lat, doubleLabel: false, soNguoi: 0, text: CHU, anh: [], soLinkKhac: 0, ghep: null, groupName: "Nhóm", postedAt: null, nhap: null })

async function bieuMau(lat: string) {
  const { LabelFormNhom } = await import("../src/components/ops/labels/label-form-nhom")
  const html = renderToStaticMarkup(<LabelFormNhom lat={lat} tin={tin(lat)} hrefXem="/xem" hrefTinKe="/ke" />)
  return new JSDOM(html).window.document
}

test("HT21-AC-1 lát hai-khu-truc khai đúng hai ô Toà, Trục, nhãn Trục nói rõ cách đọc", () => {
  assert.deepEqual(oCuaLat(LAT), ["building", "stack"], "lát hai-khu-truc phải khai đúng hai ô building, stack")
  assert.equal(nhanO(LAT, "stack"), "Trục (hai số cuối của số căn)")
  assert.equal(nhanO(LAT, "building"), "Toà")
  assert.deepEqual(oCuaLat("hai-khu-ghep-b"), ["building", "subzone"], "đối chứng: lát hai-khu-ghep-b không đổi")
})

test("HT21-AC-2 biểu mẫu dựng thật: chỉ hai ô, có «Không suy ra được», không căn cứ, không Lý do; lát không khai vẫn đủ ô", async () => {
  const d = await bieuMau(LAT)
  assert.deepEqual([...d.querySelectorAll("[data-o]")].map((x) => x.getAttribute("data-o")), ["building", "stack"])
  assert.equal(d.querySelector('label[for="nhan-stack"]')?.textContent, "Trục (hai số cuối của số căn)")
  assert.ok(d.querySelector('[aria-label="Trục (hai số cuối của số căn): không suy ra được"]'), "ô Trục thiếu «Không suy ra được»")
  assert.equal(d.querySelectorAll('[aria-label$=": căn cứ"]').length, 0, "còn ô căn cứ")
  assert.equal(d.querySelector("#nhan-reason"), null, "còn ô Lý do")
  assert.match(d.body.textContent!, /0\/2/)
  const cu = await bieuMau("s03-theo-nhom")
  assert.ok(cu.querySelectorAll("[data-o]:not([data-o=reason])").length > 2, "đối chứng: lát không khai phải đủ ô")
})

test("HT21-AC-3 chiều đỏ: bỏ dòng khai thì lát hai-khu-truc không còn khai ô", async () => {
  const tep = join(APP, "src/lib/labels-normalize.ts")
  const goc = readFileSync(tep, "utf8")
  const dong = '  "hai-khu-truc": ["building", "stack"],\n'
  assert.ok(goc.includes(dong), "không thấy dòng khai để đột biến")
  const f = join(APP, "src/lib", `.ht21-dot-${process.pid}.ts`)
  writeFileSync(f, goc.replace(dong, ""))
  try {
    const m = (await import(pathToFileURL(f).href)) as { oCuaLat: (l: string) => readonly string[] | null }
    assert.equal(m.oCuaLat(LAT), null, "bản bỏ dòng khai vẫn trả hai ô — phép đo không phân biệt được")
    assert.throws(() => assert.deepEqual(m.oCuaLat(LAT), ["building", "stack"], "lát hai-khu-truc phải khai đúng hai ô building, stack"),
      /lát hai-khu-truc phải khai đúng hai ô/)
  } finally {
    rmSync(f, { force: true })
  }
})

// HT21-AC-4 — nháp của trợ lý (khuôn sẵn có mà nhapTuDraft đọc): lát hai-khu-truc hiện, lọc về hai ô; lát khai ô khác vẫn gắn mù.
const DRAFT = { hien: "gn", cach_doc: { gn: { trang_thai: "co", o: { building: "PR6", stack: "23", floor: "12", project: "Vinhomes Ocean Park 1" } } } }

test("HT21-AC-4 máy chủ: hai-khu-truc nhận nháp đúng hai ô; hai-khu-ghep-b không lộ nháp; lát không khai giữ nguyên", async () => {
  const { nhapChoLat } = await import("../src/lib/labels-queries")
  const { hienNhap } = await import("../src/lib/labels-normalize")
  assert.deepEqual(nhapChoLat(LAT, DRAFT), { cachDoc: "gn", o: { building: "PR6", stack: "23" } }, "hai-khu-truc phải nhận nháp lọc về building, stack")
  assert.equal(nhapChoLat("hai-khu-ghep-b", DRAFT), null, "hai-khu-ghep-b là lát gắn mù — nháp không được rời máy chủ")
  assert.deepEqual(Object.keys(nhapChoLat("s03-theo-nhom", DRAFT)?.o ?? {}).sort(), ["building", "floor", "project", "stack"], "lát không khai giữ nguyên nháp")
  assert.equal(nhapChoLat(LAT, { hien: "gn", cach_doc: { gn: { trang_thai: "co", o: { floor: "12" } } } }), null, "nháp không còn ô của lát thì không có nháp")
  assert.deepEqual([hienNhap(LAT), hienNhap("hai-khu-ghep-b"), hienNhap("s03-theo-nhom")], [true, false, true])
})

test("HT21-AC-4 biểu mẫu: hai-khu-truc điền sẵn nháp và hiện nhãn «Nháp máy»; hai-khu-ghep-b không", async () => {
  const { LabelFormNhom } = await import("../src/components/ops/labels/label-form-nhom")
  const nhap = { cachDoc: "gn", o: { building: "PR6", stack: "23" } }
  const ve = (lat: string) => new JSDOM(renderToStaticMarkup(<LabelFormNhom lat={lat} tin={{ ...tin(lat), nhap }} hrefXem="/xem" hrefTinKe="/ke" />)).window.document
  const d = ve(LAT)
  assert.ok(d.querySelector('[data-labels-nhap="gn"]'), "hai-khu-truc thiếu nhãn «Nháp máy»")
  assert.equal((d.querySelector("#nhan-stack") as HTMLInputElement | null)?.getAttribute("value"), "23", "ô Trục không điền sẵn nháp")
  assert.equal((d.querySelector("#nhan-building") as HTMLInputElement | null)?.getAttribute("value"), "PR6", "ô Toà không điền sẵn nháp")
  const b = ve("hai-khu-ghep-b")
  assert.equal(b.querySelector("[data-labels-nhap]"), null, "hai-khu-ghep-b lộ nháp trên màn")
  assert.ok(!(b.querySelector("#nhan-building") as HTMLInputElement | null)?.getAttribute("value"), "hai-khu-ghep-b điền sẵn nháp")
})

test("HT21-AC-4 chiều đỏ: đưa hai-khu-ghep-b vào danh sách có nháp thì phép đo gắn mù bắt được", async () => {
  const tep = join(APP, "src/lib/labels-normalize.ts")
  const goc = readFileSync(tep, "utf8")
  const tu = 'new Set(["hai-khu-truc"])'
  assert.ok(goc.includes(tu), "không thấy danh sách ngoại lệ để đột biến")
  const f = join(APP, "src/lib", `.ht21-dot-nhap-${process.pid}.ts`)
  writeFileSync(f, goc.replace(tu, 'new Set(["hai-khu-truc", "hai-khu-ghep-b"])'))
  try {
    const m = (await import(pathToFileURL(f).href)) as { hienNhap: (l: string) => boolean }
    assert.throws(() => assert.equal(m.hienNhap("hai-khu-ghep-b"), false, "hai-khu-ghep-b là lát gắn mù — nháp không được rời máy chủ"),
      /hai-khu-ghep-b là lát gắn mù/)
  } finally {
    rmSync(f, { force: true })
  }
})
