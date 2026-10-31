// anh-goc-chan-svg.test.tsx — hồ sơ _acceptance/proxy-anh-chan-svg: proxy ảnh tin chỉ phục vụ jpeg/png/webp/gif, SVG và kiểu
// ảnh lạ trả 415, mọi phản hồi ảnh mang nosniff + CSP sandbox. Tên ca mở đầu bằng mã AC (PAS-AC-n). Không gọi mạng thật: bộ
// tra DNS và bộ tải về đều giả; tên máy giả dùng đuôi `.test`. Mỗi phép đo có chiều đỏ trên bản chép tạm của tệp nguồn.
import { describe, test } from "node:test"
import assert from "node:assert/strict"
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs"
import path from "node:path"
import { fileURLToPath, pathToFileURL } from "node:url"

import { layAnhGoc, type PhanHoiNguon, type TaiVe, type TraDns } from "../src/lib/ops/lay-anh-goc"

type LayMod = typeof import("../src/lib/ops/lay-anh-goc")

const APP = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
const HOST = "anh.nguon-gia.test"
const DUONG = "/tin/s06-gia/anh-mat-tien.svg"
const TRUY = "?ma-tin=123456"
const URL_GOC = `https://${HOST}${DUONG}${TRUY}`
const BYTE = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 1, 2, 3])
const THAN_415 = "định dạng ảnh không được phép"

const dns: TraDns = async () => [{ address: "93.184.216.34", family: 4 }]

/** Phản hồi nguồn giả; `doc.n` đếm số lần thân bị đọc. */
function nguon(type: string | null, extra: Partial<PhanHoiNguon> = {}) {
  const doc = { n: 0 }
  async function* than() {
    doc.n++
    yield BYTE
  }
  const headers = new Headers()
  if (type !== null) headers.set("content-type", type)
  const tai: TaiVe = async () => ({ status: 200, headers, body: than(), ...extra })
  return { tai, doc }
}

/** Bản chép tạm của lay-anh-goc.ts đổi đúng một chỗ. */
async function banDot(a: string, b: string): Promise<{ mod: LayMod; xoa: () => void }> {
  const goc = readFileSync(path.join(APP, "src/lib/ops/lay-anh-goc.ts"), "utf8")
  assert.ok(goc.includes(a), `chỗ đột biến không còn trong lay-anh-goc.ts: ${a}`)
  const dir = mkdtempSync(path.join(APP, "tests", ".pas-dot-"))
  const f = path.join(dir, "lay-anh-goc.ts")
  writeFileSync(f, goc.replace(a, b))
  return { mod: (await import(pathToFileURL(f).href)) as LayMod, xoa: () => rmSync(dir, { recursive: true, force: true }) }
}

// ---------- AC-1 ----------
const CHO_PHEP: [string, string][] = [
  ["image/jpeg", "image/jpeg"],
  ["image/png", "image/png"],
  ["image/webp", "image/webp"],
  ["image/gif", "image/gif"],
  ["image/jpg", "image/jpeg"],
  ["IMAGE/PNG", "image/png"],
  ["image/jpeg; charset=binary", "image/jpeg"],
]

async function kiemAc1(lay: typeof layAnhGoc) {
  const lech: string[] = []
  for (const [vao, ra] of CHO_PHEP) {
    const { tai } = nguon(vao)
    const res = await lay(URL_GOC, { traDns: dns, taiVe: tai })
    assert.equal(res.status, 200, `${vao}: mã`)
    if (res.headers.get("content-type") !== ra) lech.push(`${vao} → ${res.headers.get("content-type")}`)
    assert.deepEqual(new Uint8Array(await res.arrayBuffer()), BYTE, `${vao}: byte`)
  }
  if (lech.length) assert.fail(`PAS-AC-1 chép kiểu nguồn: ${lech.join(" · ")}`)
}

describe("PAS-AC-1 bốn kiểu raster và biến thể → 200, kiểu chuẩn", () => {
  test("PAS-AC-1 ma trận 7 ô viết tay", async () => {
    assert.equal(CHO_PHEP.length, 7)
    await kiemAc1(layAnhGoc)
  })
  test("chiều đỏ PAS-AC-1 chép kiểu nguồn: bản đột biến trả nguyên content-type nguồn → ô IMAGE/PNG đỏ", async () => {
    const { mod, xoa } = await banDot(
      `headers: { "content-type": type, "cache-control": "private, max-age=300", ...HEADER_ANH_AN_TOAN },`,
      `headers: { "content-type": res.headers.get("content-type") ?? type, "cache-control": "private, max-age=300", ...HEADER_ANH_AN_TOAN },`,
    )
    try {
      await assert.rejects(kiemAc1(mod.layAnhGoc), /PAS-AC-1 chép kiểu nguồn: .*IMAGE\/PNG → IMAGE\/PNG/)
    } finally {
      xoa()
    }
  })
})

// ---------- AC-2 ----------
const CAM = [
  "image/svg+xml",
  "image/svg+xml; charset=utf-8",
  "IMAGE/SVG+XML",
  "image/x-icon",
  "image/bmp",
  "image/tiff",
  "image/avif",
]

async function kiemAc2(lay: typeof layAnhGoc) {
  for (const vao of CAM) {
    const { tai, doc } = nguon(vao)
    const res = await lay(URL_GOC, { traDns: dns, taiVe: tai })
    if (res.status !== 415) assert.fail(`PAS-AC-2 SVG lọt: ${vao} → ${res.status}`)
    const than = await res.text()
    for (const lo of [HOST, DUONG, TRUY, "anh-mat-tien"]) {
      if (than.includes(lo)) assert.fail(`PAS-AC-2 thân lộ đường: ${vao} chứa «${lo}»`)
    }
    assert.equal(than, THAN_415, `${vao}: thân phải là câu chung`)
    assert.equal(doc.n, 0, `${vao}: thân nguồn không được đọc`)
  }
}

describe("PAS-AC-2 SVG và kiểu ảnh lạ → 415, thân chung, không đọc thân nguồn", () => {
  test("PAS-AC-2 ma trận 7 ô viết tay", async () => {
    assert.equal(CAM.length, 7)
    await kiemAc2(layAnhGoc)
  })
  test("chiều đỏ PAS-AC-2 SVG lọt: bản đột biến bỏ danh sách cho phép → ô image/svg+xml đỏ", async () => {
    const { mod, xoa } = await banDot("if (!ANH_CHO_PHEP.has(type)) return loi(415);", "")
    try {
      await assert.rejects(kiemAc2(mod.layAnhGoc), /PAS-AC-2 SVG lọt: image\/svg\+xml → 200/)
    } finally {
      xoa()
    }
  })
  test("chiều đỏ PAS-AC-2 thân lộ đường: bản đột biến nối pathname vào thân 415 → ô image/svg+xml đỏ", async () => {
    const { mod, xoa } = await banDot(
      "if (!ANH_CHO_PHEP.has(type)) return loi(415);",
      `if (!ANH_CHO_PHEP.has(type)) return new Response("định dạng ảnh không được phép " + cur.pathname, { status: 415 });`,
    )
    try {
      await assert.rejects(kiemAc2(mod.layAnhGoc), /PAS-AC-2 thân lộ đường: image\/svg\+xml chứa/)
    } finally {
      xoa()
    }
  })
})

// ---------- AC-3 ----------
describe("PAS-AC-3 nguồn không phải ảnh vẫn 502", () => {
  for (const vao of ["text/html", null]) {
    test(`PAS-AC-3 ${vao ?? "vắng content-type"} → 502`, async () => {
      const { tai } = nguon(vao)
      assert.equal((await layAnhGoc(URL_GOC, { traDns: dns, taiVe: tai })).status, 502)
    })
  }
})

// ---------- AC-4 ----------
async function* treo(): AsyncGenerator<Uint8Array> {
  await new Promise((r) => setTimeout(r, 300))
  yield BYTE
}

const KET_CUC: { ten: string; ma: number; chay: (lay: typeof layAnhGoc) => Promise<Response> }[] = [
  { ten: "200 ảnh png", ma: 200, chay: (lay) => lay(URL_GOC, { traDns: dns, taiVe: nguon("image/png").tai }) },
  { ten: "403 http", ma: 403, chay: (lay) => lay(`http://${HOST}/a.png`, { traDns: dns, taiVe: nguon("image/png").tai }) },
  { ten: "415 svg", ma: 415, chay: (lay) => lay(URL_GOC, { traDns: dns, taiVe: nguon("image/svg+xml").tai }) },
  { ten: "502 text/html", ma: 502, chay: (lay) => lay(URL_GOC, { traDns: dns, taiVe: nguon("text/html").tai }) },
  {
    ten: "504 quá giờ",
    ma: 504,
    chay: (lay) =>
      lay(URL_GOC, {
        traDns: dns,
        thoiHanMs: 30,
        taiVe: async () => ({ status: 200, headers: new Headers({ "content-type": "image/png" }), body: treo() }),
      }),
  },
]

async function kiemAc4(lay: typeof layAnhGoc) {
  for (const k of KET_CUC) {
    const res = await k.chay(lay)
    assert.equal(res.status, k.ma, k.ten)
    if (res.headers.get("x-content-type-options") !== "nosniff") assert.fail(`PAS-AC-4 thiếu nosniff: ${k.ten}`)
    assert.match(res.headers.get("content-security-policy") ?? "", /\bsandbox\b/, `${k.ten}: CSP sandbox`)
  }
}

describe("PAS-AC-4 mọi phản hồi của bộ lấy ảnh mang nosniff + CSP sandbox", () => {
  test("PAS-AC-4 năm kết cục viết tay", async () => {
    assert.equal(KET_CUC.length, 5)
    await kiemAc4(layAnhGoc)
  })
  test("chiều đỏ PAS-AC-4 thiếu nosniff: bản đột biến bỏ header khỏi phản hồi lỗi → ô 403 đỏ", async () => {
    const { mod, xoa } = await banDot(
      `headers: { "content-type": "text/plain; charset=utf-8", "cache-control": "no-store", ...HEADER_ANH_AN_TOAN },`,
      `headers: { "content-type": "text/plain; charset=utf-8", "cache-control": "no-store" },`,
    )
    try {
      await assert.rejects(kiemAc4(mod.layAnhGoc), /PAS-AC-4 thiếu nosniff: 403 http/)
    } finally {
      xoa()
    }
  })
})
