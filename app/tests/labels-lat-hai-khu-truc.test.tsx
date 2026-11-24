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
