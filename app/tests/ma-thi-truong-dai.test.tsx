// ma-thi-truong-dai.test.tsx — hồ sơ _acceptance/khu-vuc-vung-moi-s06 (KV-AC-n). marketNameOf tra được thị trường mà areas
// còn giữ mã dài (`vn-thanh-pho-*`, `vn-tinh-*`) khi nhóm thu dùng khoá ngắn (S06 `da-nang`, cityCode `vn-da-nang`).
// Bản TẠM tới khi hàng ma-thi-truong-ngan đổi mã areas. Chiều đỏ: bản chép hàm bỏ tra mã dài → ca đỏ với thông điệp ghim.
import { test } from "node:test"
import assert from "node:assert/strict"
import { readFileSync, rmSync, writeFileSync } from "node:fs"
import { join } from "node:path"

const TEN = new Map([
  ["vn-hanoi", "Hà Nội"],
  ["vn-hcmc", "Hồ Chí Minh"],
  ["vn-thanh-pho-da-nang", "Thành phố Đà Nẵng"],
  ["vn-thanh-pho-hai-phong", "Thành phố Hải Phòng"],
  ["vn-tinh-khanh-hoa", "Tỉnh Khánh Hòa"],
  ["vn-khanh-hoa", "Khánh Hòa (mã ngắn)"],
])
// Ma trận viết trước: khoá nhóm thu, cityCode, mã dài, mã lạ.
const MA_TRAN: [string, string | null][] = [
  ["da-nang", "Thành phố Đà Nẵng"],
  ["vn-da-nang", "Thành phố Đà Nẵng"],
  ["hai-phong", "Thành phố Hải Phòng"],
  ["vn-hai-phong", "Thành phố Hải Phòng"],
  ["khanh-hoa", "Khánh Hòa (mã ngắn)"], // mã ngắn có sẵn thắng mã dài cùng gốc
  ["vn-khanh-hoa", "Khánh Hòa (mã ngắn)"],
  ["vn-thanh-pho-da-nang", "Thành phố Đà Nẵng"], // mã dài đầy đủ làm đầu vào
  ["vn-tinh-khanh-hoa", "Tỉnh Khánh Hòa"],
  ["hanoi", "Hà Nội"],
  ["hcmc", "Hồ Chí Minh"],
  ["binh-duong", null], // đã nhập vào TP.HCM, areas không có mã — có chủ đích, chờ ma-thi-truong-ngan
  ["danang", null], // không khớp mờ
]

type Fn = (code: string, m: ReadonlyMap<string, string>) => { name: string; known: boolean }
function kiem(f: Fn) {
  for (const [ma, ten] of MA_TRAN) {
    const r = f(ma, TEN)
    if (ten === null) assert.deepEqual(r, { name: `${ma} (chưa có tên Việt)`, known: false }, `mã lạ ${ma}`)
    else if (r.name !== ten || !r.known) throw new Error(`KV-AC-1: mã ${ma} không ra tên thị trường (được «${r.name}»)`)
  }
}

test("KV-AC-1 marketNameOf: khoá ngắn và cityCode ra tên thị trường mã dài; mã ngắn có sẵn thắng; mã lạ vẫn báo", async () => {
  const { marketNameOf } = await import("../src/lib/market-names")
  kiem(marketNameOf)
})

const GOC = () => readFileSync(join(__dirname, "../src/lib/market-names.ts"), "utf8")
async function banSai(ten: string, sai: string, mau: RegExp) {
  assert.notEqual(sai, GOC(), `chiều đỏ ${ten}: market-names.ts đã đổi — sửa phép đo`)
  const f = join(__dirname, `.ma-dai-${ten}-${process.pid}.ts`)
  writeFileSync(f, sai)
  try {
    const { marketNameOf } = await import(f)
    assert.throws(() => kiem(marketNameOf), mau)
  } finally {
    rmSync(f, { force: true })
  }
}

test("KV-AC-1 chiều đỏ: bản hàm bỏ tra mã dài thì khoá da-nang không ra tên", async () => {
  const sai = GOC()
    .replace("    areaNames.get(`vn-thanh-pho-${ngan}`) ??\n", "")
    .replace("    areaNames.get(`vn-tinh-${ngan}`)", "    undefined")
  await banSai("bo-dai", sai, /KV-AC-1: mã da-nang không ra tên thị trường/)
})

test("KV-AC-1 chiều đỏ: bản hàm tra mã dài trước mã ngắn thì khanh-hoa ra tên mã dài", async () => {
  const sai = GOC().replace(
    "    areaNames.get(`vn-${ngan}`) ??\n    areaNames.get(`vn-thanh-pho-${ngan}`) ??\n    areaNames.get(`vn-tinh-${ngan}`)",
    "    areaNames.get(`vn-thanh-pho-${ngan}`) ??\n    areaNames.get(`vn-tinh-${ngan}`) ??\n    areaNames.get(`vn-${ngan}`)",
  )
  await banSai("thu-tu", sai, /KV-AC-1: mã khanh-hoa không ra tên thị trường/)
})
