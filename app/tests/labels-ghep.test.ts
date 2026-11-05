// labels-ghep.test.ts — hồ sơ _acceptance/ghep-anh-tren-the-gan-nhan, ca «GHEP-AC-n». Hàm thuần, `serveZaloMedia` thật với tệp giả trên đĩa,
// thành phần ảnh trong jsdom. Không DB, không mạng. Tên miền thử chỉ dùng example.test.
import { after, before, test } from "node:test"
import assert from "node:assert/strict"
import { createHash } from "node:crypto"
import { mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, statSync, symlinkSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"

import { JSDOM } from "jsdom"
import { createElement } from "react"

import { chuKhongLink, danhSachAnhCum, docGhep, duongAnh, ghepHien, refsCuaDong, type Ghep } from "../src/lib/labels-anh"
import { serveZaloMedia, type BaiAnhRow } from "../src/lib/ops/zalo-media"
import type { User } from "../src/lib/auth"

const U = (n: string) => `https://cdn.example.test/${n}.jpg`
const SNAP = "hanoi__s03__ghepthu"
const tep = (ten: string): BaiAnhRow => ({ media: null, media_files: [{ url: U(ten), file: `media/${ten}.jpg`, snapshotId: SNAP }], snapshot_id: SNAP })
const chiUrl = (ten: string): BaiAnhRow => ({ media: [{ url: U(ten) }], media_files: null, snapshot_id: SNAP })

// Bên đọc nhận đúng khuôn bên ghi: lấy từ ghepChoMau thật, không chép tay.
import { ghepChoMau as ghepChoMauThat } from "../../pipeline/lib/ghep-mau.mjs"
const ghepChoMau = ghepChoMauThat as unknown as (i: { item_id: string; ref_id: string }[], p: unknown[]) => Map<string, Ghep | null>
const t = (s: number) => new Date(Date.UTC(2026, 10, 5, 3, 0, s)).toISOString()
const bai = (post_id: string, text: string, s: number, sender_id = "n1") => ({ post_id, text, posted_at: t(s), sender_id, conversation_id: "g1" })
const POSTS = [
  bai("T1", "Cho thuê 2PN", 0), bai("A1", U("a1"), 5), bai("A2", U("a2"), 6),
  bai("T2", "Bán 1PN", 1000, "n2"), bai("A3", U("a3"), 1001, "n2"), bai("T3", "Bán 3PN", 1010, "n2"),
  bai("A4", U("a4"), 2000, "n3"),
  bai("T4", "Bán studio", 3000, "n4"), bai("A5", U("a5"), 3010, "n4"),
  bai("T5", "Cho thuê studio", 4000, "n5"),
]
const G = ghepChoMau([["1", "A1"], ["2", "A3"], ["3", "A4"], ["4", "T4"], ["5", "T5"], ["6", "A2"]].map(([item_id, ref_id]) => ({ item_id, ref_id })), POSTS)
const doc = (k: string) => docGhep(G.get(k))

for (const [ten, k, refs, hien] of [
  ["chi anh mot tin chu", "1", ["T1", "A1", "A2"], { suyRa: true, soChuGan: 1, khongChu: false }],
  ["nhieu tin chu", "2", ["T2", "A3"], { suyRa: true, soChuGan: 2, khongChu: false }],
  ["khong tin chu", "3", ["A4"], { suyRa: false, soChuGan: 0, khongChu: true }],
  ["co chu co cum", "4", ["T4", "A5"], { suyRa: true, soChuGan: 1, khongChu: false }],
  ["dong trung cum", "6", ["T1", "A1", "A2"], { suyRa: true, soChuGan: 1, khongChu: false }],
] as [string, string, string[], object][]) {
  test(`GHEP-AC-3 ${ten}: thu tu bai va co ghep`, () => {
    const g = doc(k)
    assert.deepEqual(refsCuaDong("x", g), refs)
    assert.deepEqual(ghepHien(g), hien)
  })
}

test("GHEP-AC-3 co chu khong cum la null: duong doc nhu truoc", () => {
  assert.equal(G.get("5"), null)
  assert.equal(doc("5"), null)
  assert.equal(ghepHien(null), null)
  assert.deepEqual(refsCuaDong("T5", null), ["T5"])
})

test("GHEP-AC-3 thu tu anh: tin chu truoc, cum theo thoi gian, trung anh tinh mot lan", () => {
  const ds = danhSachAnhCum([tep("t"), tep("a"), chiUrl("b"), tep("a")])
  assert.deepEqual(ds.map((d) => (d.kind === "tep" ? d.file : d.url)), ["media/t.jpg", "media/a.jpg", U("b")])
})

test("GHEP-AC-3 du lieu xuong trinh duyet khong co ma bai, doi chung phep quet do", () => {
  const xuong = JSON.stringify({ ghep: ghepHien(doc("1")), anh: [duongAnh(7, 0)] })
  const coMa = (s: string) => /T1|A1|A2|example\.test|https?:/.test(s)
  assert.ok(!coMa(xuong), xuong)
  assert.ok(coMa(JSON.stringify(doc("1"))), "đối chứng: bản ghi thô có mã bài thì phép quét đỏ")
})

test("GHEP-AC-3 chu hien cua cum bo link anh cua ca cum, khong dem la lien ket khac", () => {
  const nguon = danhSachAnhCum([chiUrl("a"), chiUrl("b")])
  assert.deepEqual(chuKhongLink(`Bán căn\n${U("b")}`, nguon), { chu: "Bán căn", soLinkKhac: 0 })
})

// Route ảnh
const JPG = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 1, 2, 3])
const noiDung = (ten: string) => Buffer.concat([JPG, Buffer.from(ten)])
const BI_MAT = Buffer.from("BI-MAT-KHONG-RA")
const user = (role: string) => ({ id: "1", email: "o@example.test", plan: "pro", role }) as unknown as User
const OPS = user("ops")
let tmp = ""
let cayMoc = ""
let cu: string | undefined
const bamCay = (goc: string): string => {
  const h = createHash("sha256")
  const di = (d: string) => { for (const f of readdirSync(d).sort()) { const p = join(d, f); if (statSync(p).isDirectory()) di(p); else h.update(p).update(readFileSync(p)) } }
  di(goc)
  return h.digest("hex")
}
before(() => {
  tmp = mkdtempSync(join(tmpdir(), "labels-ghep-"))
  const dir = join(tmp, "snapshots", "hanoi", SNAP, "media")
  mkdirSync(dir, { recursive: true })
  for (const ten of ["a", "b", "c"]) writeFileSync(join(dir, `${ten}.jpg`), noiDung(ten))
  mkdirSync(join(tmp, "ngoai"), { recursive: true })
  writeFileSync(join(tmp, "ngoai", "bi-mat.jpg"), BI_MAT)
  symlinkSync(join(tmp, "ngoai", "bi-mat.jpg"), join(dir, "symlink.jpg"))
  mkdirSync(join(tmp, "snapshots", "hanoi", SNAP, "other"), { recursive: true })
  writeFileSync(join(tmp, "snapshots", "hanoi", SNAP, "other", "a.jpg"), BI_MAT)
  cu = process.env.SNAPSHOTS_DIR
  process.env.SNAPSHOTS_DIR = join(tmp, "snapshots")
  cayMoc = bamCay(join(tmp, "snapshots"))
})
after(() => {
  if (cu === undefined) delete process.env.SNAPSHOTS_DIR
  else process.env.SNAPSHOTS_DIR = cu
  rmSync(tmp, { recursive: true, force: true })
})
const goi = (qs: string, rows: BaiAnhRow[] | null, layAnh?: (u: string) => Promise<Response>) =>
  serveZaloMedia(new Request(`http://localhost/api/zalo-media?${qs}`), OPS, {
    traBai: async () => rows,
    layAnh: (layAnh ?? (async () => new Response("khong duoc goi", { status: 599 }))) as never,
  })

test("GHEP-AC-5 i chay khap cum tra dung tung tep, url thi lay ho dung url, ngoai khoang 404", async () => {
  const rows = [tep("a"), tep("b"), chiUrl("x"), tep("c")]
  const goiToi: string[] = []
  const lay = async (u: string) => { goiToi.push(u); return new Response(noiDung("x"), { status: 200, headers: { "content-type": "image/jpeg" } }) }
  for (const [i, ten] of ["a", "b", "x", "c"].entries()) {
    const r = await goi(`nhan=1&anh=${i}`, rows, lay)
    assert.equal(r.status, 200)
    assert.deepEqual(Buffer.from(await r.arrayBuffer()), noiDung(ten))
  }
  assert.deepEqual(goiToi, [U("x")])
  assert.equal((await goi("nhan=1&anh=4", rows, lay)).status, 404)
})

const XAU: [string, () => string][] = [
  ["file co ..", () => "media/../../../../ngoai/bi-mat.jpg"],
  ["file tuyet doi", () => join(tmp, "ngoai", "bi-mat.jpg")],
  ["ngoai thu muc media", () => "other/a.jpg"],
  ["symlink ra ngoai", () => "media/symlink.jpg"],
]
for (const [ten, tepCua] of XAU) {
  test(`GHEP-AC-5 duong dan xau o bai thu hai cua cum: ${ten}`, async () => {
    const rows = [tep("a"), { media: null, media_files: [{ file: tepCua(), snapshotId: SNAP }], snapshot_id: SNAP }]
    const r = await goi("nhan=1&anh=1", rows)
    assert.equal(r.status, 403)
    assert.ok(!Buffer.from(await r.arrayBuffer()).includes(BI_MAT))
    assert.equal((await goi("nhan=1&anh=0", rows)).status, 200, "bài đầu của cụm vẫn phục vụ được")
  })
}

test("GHEP-AC-5 cay khong doi qua moi ca, doi chung ghi them thi phep bam do", () => {
  const goc = join(tmp, "snapshots")
  assert.equal(bamCay(goc), cayMoc)
  const them = join(goc, "hanoi", SNAP, "media", "them.jpg")
  writeFileSync(them, JPG)
  assert.notEqual(bamCay(goc), cayMoc)
  rmSync(them)
})

// Thành phần ảnh: nạp trong jsdom vì Base UI đọc `document` lúc nạp.
async function mo() {
  const dom = new JSDOM("<!doctype html><div id=root></div>", { url: "http://localhost/ops/labels", pretendToBeVisual: true })
  const w = dom.window as unknown as Record<string, unknown>
  Object.assign(globalThis, {
    window: w, document: w.document, HTMLElement: w.HTMLElement, Element: w.Element, Node: w.Node, HTMLImageElement: w.HTMLImageElement,
    getComputedStyle: w.getComputedStyle, MutationObserver: w.MutationObserver, Event: w.Event, MouseEvent: w.MouseEvent, KeyboardEvent: w.KeyboardEvent,
    requestAnimationFrame: (cb: FrameRequestCallback) => setTimeout(() => cb(Date.now()), 0), cancelAnimationFrame: clearTimeout,
    ResizeObserver: class { observe() {} unobserve() {} disconnect() {} }, IS_REACT_ACT_ENVIRONMENT: true,
  })
  Object.defineProperty(globalThis, "navigator", { value: w.navigator, configurable: true })
  const { act } = await import("react")
  const { createRoot } = await import("react-dom/client")
  const { AnhBai } = await import("../src/components/ops/labels/anh-bai")
  const root = createRoot(dom.window.document.getElementById("root")!)
  const q = (s: string) => dom.window.document.querySelector(s) as unknown as HTMLElement | null
  const render = (p: Parameters<typeof AnhBai>[0]) => act(async () => { root.render(createElement(AnhBai, p)) })
  const bam = (el: Element) => act(async () => { el.dispatchEvent(new dom.window.MouseEvent("click", { bubbles: true })) })
  const phim = (key: string) => act(async () => { dom.window.dispatchEvent(new dom.window.KeyboardEvent("keydown", { key })) })
  return { q, render, bam, phim, dom, dong: () => act(async () => root.unmount()) }
}
const DUONG = ["/api/zalo-media?nhan=1&anh=0", "/api/zalo-media?nhan=1&anh=1"]

test("GHEP-AC-4 nhan ghep, co nhieu tin chu, cau khong tin chu, bai khong ghep khong co nhan", async () => {
  const d = await mo()
  await d.render({ anh: DUONG, soLinkKhac: 0, coChu: true, ghep: { suyRa: true, soChuGan: 3, khongChu: false } })
  assert.match(d.q("[data-labels-ghep]")!.textContent!, /Ghép suy ra · 2 ảnh/)
  assert.match(d.q("[data-labels-ghep-nhieu]")!.textContent!, /Có 3 tin chữ trong 2 phút/)
  await d.render({ anh: DUONG, soLinkKhac: 0, coChu: true, ghep: { suyRa: true, soChuGan: 1, khongChu: false } })
  assert.equal(d.q("[data-labels-ghep-nhieu]"), null)
  await d.render({ anh: DUONG.slice(0, 1), soLinkKhac: 0, coChu: false, ghep: { suyRa: false, soChuGan: 0, khongChu: true } })
  assert.equal(d.q("[data-labels-ghep]"), null)
  assert.match(d.q("[data-labels-ghep-khong-chu]")!.textContent!, /Không có tin chữ trong 2 phút/)
  await d.render({ anh: DUONG.slice(0, 1), soLinkKhac: 0, coChu: true, ghep: null })
  assert.equal(d.q("[data-labels-ghep]"), null)
  assert.equal(d.q("[data-labels-ghep-khong-chu]"), null)
  await d.dong()
})

test("GHEP-AC-4 phim mui ten chuyen anh ke ca khi tieu diem da roi khoi hop, dung o dau mut", async () => {
  const d = await mo()
  await d.render({ anh: [...DUONG, "/api/zalo-media?nhan=1&anh=2"], soLinkKhac: 0, coChu: true, ghep: { suyRa: true, soChuGan: 1, khongChu: false } })
  await d.bam(d.q('[aria-label="Xem lớn ảnh 1"]')!)
  const tieuDe = () => d.dom.window.document.querySelector("[data-labels-anh-lon] [data-slot=dialog-title]")?.textContent ?? d.q("[data-labels-anh-lon]")?.textContent ?? ""
  assert.match(tieuDe(), /Ảnh 1\/3/)
  ;(d.dom.window.document.activeElement as unknown as HTMLElement | null)?.blur?.()
  await d.phim("ArrowLeft")
  assert.match(tieuDe(), /Ảnh 1\/3/, "đầu mút không lùi nữa")
  await d.phim("ArrowRight")
  await d.phim("ArrowRight")
  await d.phim("ArrowRight")
  assert.match(tieuDe(), /Ảnh 3\/3/, "đầu mút không tiến nữa")
  await d.phim("ArrowLeft")
  assert.match(tieuDe(), /Ảnh 2\/3/, "sau đầu mút phím vẫn chạy")
  await d.dong()
})

