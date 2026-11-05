// labels-anh.test.ts — hồ sơ _acceptance/anh-tren-the-gan-nhan, ca «ANH-AC-n». Hàm thuần, chế độ `?nhan=&anh=` của route ảnh với
// tệp giả trên đĩa, và render thành phần ảnh trong jsdom. Không DB, không mạng. Tên miền thử chỉ dùng example.test.
import { after, before, test } from "node:test"
import assert from "node:assert/strict"
import { createHash } from "node:crypto"
import { mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, statSync, symlinkSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"

import { JSDOM } from "jsdom"
import { createElement } from "react"

import type { User } from "../src/lib/auth"
import { chuKhongLink, danhSachAnh, duongAnh, type NguonAnh } from "../src/lib/labels-anh"
import { serveZaloMedia, type BaiAnhRow } from "../src/lib/ops/zalo-media"

const U = "https://cdn.example.test/a/b.jpg"
const U2 = "https://cdn.example.test/a/c.jpg"

for (const [ten, vao, ra, dem, anh] of [
  ["chi link", U, "", 0, [{ kind: "url", url: U }]],
  ["chu lan link", `Bán căn 2PN\n${U}\nGiá 3 tỷ`, "Bán căn 2PN\nGiá 3 tỷ", 0, [{ kind: "url", url: U }]],
  ["link giua cau", `Xem ${U} nhé`, "Xem nhé", 0, [{ kind: "url", url: U }]],
  ["link co dau cau cuoi", `Xem ${U}.`, "Xem", 0, [{ kind: "url", url: U }]],
  ["link la dem", `Nhóm https://khac.example.test/x`, "Nhóm", 1, []],
  ["link trung anh va link la", `${U}\nhttps://khac.example.test/x`, "", 1, [{ kind: "url", url: U }]],
  ["www", "Xem www.khac.example.test/a ngay", "Xem ngay", 1, []],
  ["ten mien tran", "Xem khac.com.vn/a ngay", "Xem ngay", 1, []],
  // Cả lớp đuôi của LINK, từng đuôi một.
  ...["vn", "com", "net", "org", "me", "link", "ly", "io", "info", "biz"].map((duoi): [string, string, string, number, NguonAnh[]] => [`duoi .${duoi}`, `Xem khac.${duoi}/a ngay`, "Xem ngay", 1, []]),
  ["ten mien con", "Xem cdn.khac.me/a ngay", "Xem ngay", 1, []],
] as [string, string, string, number, NguonAnh[]][]) {
  test(`ANH-AC-1 ${ten}`, () => {
    const kq = chuKhongLink(vao, anh)
    assert.equal(kq.chu, ra)
    assert.equal(kq.soLinkKhac, dem)
    assert.ok(!/https?:|www\.|example\.test|\.(?:vn|com|net|org|me|link|ly|io|info|biz)\b/.test(kq.chu))
  })
}

for (const giu of ["Bán căn S2.17, 64,5m2, giá 3.5 tỷ.\n\n  LH 0912345678  ", "Thư tới a@b.com nhé", "Toà S10.05 tầng 12"]) {
  test(`ANH-AC-1 doi chung chu khong link giu nguyen tung byte: ${JSON.stringify(giu)}`, () => {
    assert.deepEqual(chuKhongLink(giu, []), { chu: giu, soLinkKhac: 0 })
  })
}

test("ANH-AC-1 chu rong va null", () => {
  assert.deepEqual(chuKhongLink(null), { chu: "", soLinkKhac: 0 })
})

test("ANH-AC-2 tep truoc url, co tep thi khong dung url cua cung anh", () => {
  const ds = danhSachAnh([{ url: U }, { url: U2 }], [{ url: U, file: "media/a.jpg", snapshotId: "s1" }], "s0")
  assert.deepEqual(ds, [{ kind: "tep", snapshot: "s1", file: "media/a.jpg", url: U }, { kind: "url", url: U2 }])
})

test("ANH-AC-2 dong loi tai van dung url, khong tinh la tep", () => {
  assert.deepEqual(danhSachAnh(null, [{ url: U, error: "http-500", snapshotId: "s1" }], "s0"), [{ kind: "url", url: U }])
})

test("ANH-AC-2 snapshot cua bai khi dong tep khong ghi, khong trung", () => {
  const ds = danhSachAnh([{ url: U }], [{ url: U, file: "media/a.jpg" }, { url: U, file: "media/a.jpg" }], "s0")
  assert.deepEqual(ds, [{ kind: "tep", snapshot: "s0", file: "media/a.jpg", url: U }])
})

for (const [ten, m, f] of [["null", null, null], ["chuoi", "x", "y"], ["phan tu rong", [null, 1, {}], [null, "z", {}]], ["url la", [{ url: "javascript:alert(1)" }], [{ url: "data:x" }]]] as [string, unknown, unknown][]) {
  test(`ANH-AC-2 khuon la khong vo: ${ten}`, () => {
    assert.deepEqual(danhSachAnh(m, f, "s0"), [])
  })
}

test("ANH-AC-2 duong anh chi co ma va thu tu", () => {
  assert.match(duongAnh(12, 0), /^\/api\/zalo-media\?nhan=\d+&anh=\d+$/)
})

test("ANH-AC-2 doi chung: ket qua co url goc thi phep quet http do", () => {
  const quet = (ds: string[]) => ds.some((d) => /https?:|example\.test/.test(d))
  assert.equal(quet([duongAnh(1, 0)]), false)
  assert.equal(quet([U]), true)
})

const SNAP = "hanoi__s03__anhthu"
const JPG = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 1, 2, 3, 4])
const BI_MAT = Buffer.from("BI-MAT-KHONG-RA")
const user = (role: User["role"]): User => ({ id: "1", email: `${role}@x.vn`, plan: "pro", role })
const OPS = user("ops")
let tmp = ""
let cayMoc: string
let cu: string | undefined

const bamCay = (goc: string): string => {
  const h = createHash("sha256")
  const di = (d: string) => {
    for (const t of readdirSync(d).sort()) {
      const p = join(d, t)
      h.update(p)
      if (statSync(p).isDirectory()) di(p)
      else h.update(readFileSync(p))
    }
  }
  di(goc)
  return h.digest("hex")
}

before(() => {
  tmp = mkdtempSync(join(tmpdir(), "labels-anh-"))
  const dir = join(tmp, "snapshots", "hanoi", SNAP, "media")
  mkdirSync(dir, { recursive: true })
  writeFileSync(join(dir, "a.jpg"), JPG)
  mkdirSync(join(tmp, "ngoai"), { recursive: true })
  writeFileSync(join(tmp, "ngoai", "bi-mat.jpg"), BI_MAT)
  symlinkSync(join(tmp, "ngoai", "bi-mat.jpg"), join(dir, "symlink.jpg"))
  // Mồi nằm đúng nơi mỗi đường dẫn xấu trỏ tới: bỏ lớp chặn thì ca đỏ vì nhận được mồi.
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

const bai = (mf: unknown, m: unknown = null): BaiAnhRow => ({ media: m, media_files: mf, snapshot_id: SNAP })
const goi = (qs: string, row: BaiAnhRow | null, u: User | null = OPS, layAnh?: (url: string) => Promise<Response>) =>
  serveZaloMedia(new Request(`http://localhost/api/zalo-media?${qs}`), u, {
    traBai: async () => row,
    layAnh: (layAnh ?? (async () => new Response("khong duoc goi", { status: 599 }))) as never,
  })
const TEP = [{ url: U, file: "media/a.jpg", snapshotId: SNAP }]

test("ANH-AC-3 co tep thi tra tep, khong goi lay ho", async () => {
  let goiLay = 0
  const r = await goi("nhan=1&anh=0", bai(TEP), OPS, async () => { goiLay++; return new Response("x") })
  assert.equal(r.status, 200)
  assert.deepEqual(Buffer.from(await r.arrayBuffer()), JPG)
  assert.equal(goiLay, 0)
  assert.equal(r.headers.get("x-content-type-options"), "nosniff")
})

test("ANH-AC-3 khong co tep thi may chu lay ho dung url, phan hoi khong lo url", async () => {
  const goiToi: string[] = []
  const r = await goi("nhan=1&anh=0", bai([{ url: U, error: "http-500" }]), OPS, async (u) => {
    goiToi.push(u)
    return new Response(JPG, { status: 200, headers: { "content-type": "image/jpeg" } })
  })
  assert.equal(r.status, 200)
  assert.deepEqual(goiToi, [U])
  assert.ok(!JSON.stringify([...r.headers]).includes("example.test"))
})

for (const [ten, qs, row] of [
  ["tham so chu", "nhan=abc&anh=0", bai(TEP)],
  ["thu tu chu", "nhan=1&anh=x", bai(TEP)],
  ["thu tu am", "nhan=1&anh=-1", bai(TEP)],
  ["thieu thu tu", "nhan=1", bai(TEP)],
  ["thu tu ngoai khoang", "nhan=1&anh=5", bai(TEP)],
  ["bai khong co", "nhan=1&anh=0", null],
] as [string, string, BaiAnhRow | null][]) {
  test(`ANH-AC-3 chan: ${ten}`, async () => {
    const r = await goi(qs, row)
    assert.equal(r.status, 404)
  })
}

for (const [ten, tepCua] of [
  ["file co ..", () => "media/../../../../ngoai/bi-mat.jpg"],
  ["file tuyet doi", () => join(tmp, "ngoai", "bi-mat.jpg")],
  ["ngoai thu muc media", () => "other/a.jpg"],
  ["symlink ra ngoai", () => "media/symlink.jpg"],
] as [string, () => string][]) {
  test(`ANH-AC-3 chan duong dan trong DB: ${ten}`, async () => {
    const r = await goi("nhan=1&anh=0", bai([{ file: tepCua(), snapshotId: SNAP }]))
    assert.equal(r.status, 403)
    assert.ok(!Buffer.from(await r.arrayBuffer()).includes(BI_MAT))
  })
}

test("ANH-AC-3 doi chung: moi cua cac ca chan co that tren dia", () => {
  assert.deepEqual(readFileSync(join(tmp, "ngoai", "bi-mat.jpg")), BI_MAT)
  assert.deepEqual(readFileSync(join(tmp, "snapshots", "hanoi", SNAP, "other", "a.jpg")), BI_MAT)
  assert.deepEqual(readFileSync(join(tmp, "snapshots", "hanoi", SNAP, "media", "../../../../ngoai/bi-mat.jpg")), BI_MAT)
})

for (const [ten, u] of [["vai nguoi xem", user("viewer")], ["chua dang nhap", null]] as [string, User | null][]) {
  test(`ANH-AC-3 chan: ${ten}`, async () => {
    assert.equal((await goi("nhan=1&anh=0", bai(TEP), u)).status, 404)
  })
}

test("ANH-AC-3 bang vang tren cloud tra 404", async () => {
  const r = await serveZaloMedia(new Request("http://localhost/api/zalo-media?nhan=1&anh=0"), OPS, {
    traBai: async () => { throw Object.assign(new Error("x"), { code: "42P01" }) },
  })
  assert.equal(r.status, 404)
})

// Ca này đứng sau mọi ca ANH-AC-3 và so với mốc của `before`, nên phủ cả các ca trên. node:test chạy tuần tự trong một tệp.
test("ANH-AC-3 cay khong doi qua moi ca, doi chung ghi them thi phep bam do", () => {
  const goc = join(tmp, "snapshots")
  assert.equal(bamCay(goc), cayMoc)
  const them = join(goc, "hanoi", SNAP, "media", "them.jpg")
  writeFileSync(them, JPG)
  assert.notEqual(bamCay(goc), cayMoc)
  rmSync(them)
})

test("ANH-AC-3 lay ho khong ghi dia: lay-anh-goc khong dung fs", () => {
  const nguon = readFileSync(join(import.meta.dirname, "../src/lib/ops/lay-anh-goc.ts"), "utf8")
  assert.doesNotMatch(nguon, /from "(?:node:)?fs(?:\/promises)?"|require\(/)
})

// Render thành phần ảnh: nạp trong jsdom vì Base UI đọc `document` lúc nạp.
async function mo() {
  const dom = new JSDOM("<!doctype html><div id=root></div>", { url: "http://localhost/ops/labels", pretendToBeVisual: true })
  const w = dom.window as unknown as Record<string, unknown>
  const dat: Record<string, unknown> = {
    window: w, document: w.document, HTMLElement: w.HTMLElement, Element: w.Element, Node: w.Node, HTMLImageElement: w.HTMLImageElement,
    getComputedStyle: w.getComputedStyle, MutationObserver: w.MutationObserver, Event: w.Event, MouseEvent: w.MouseEvent, KeyboardEvent: w.KeyboardEvent,
    requestAnimationFrame: (cb: FrameRequestCallback) => setTimeout(() => cb(Date.now()), 0), cancelAnimationFrame: clearTimeout,
    ResizeObserver: class { observe() {} unobserve() {} disconnect() {} }, IS_REACT_ACT_ENVIRONMENT: true,
  }
  Object.assign(globalThis, dat)
  Object.defineProperty(globalThis, "navigator", { value: w.navigator, configurable: true })
  const { act } = await import("react")
  const { createRoot } = await import("react-dom/client")
  const { AnhBai } = await import("../src/components/ops/labels/anh-bai")
  const root = createRoot(dom.window.document.getElementById("root")!)
  const q = (s: string) => dom.window.document.querySelector(s) as unknown as HTMLElement | null
  const render = (p: { anh: string[]; soLinkKhac: number; coChu: boolean }) => act(async () => { root.render(createElement(AnhBai, p)) })
  const ban = (el: Element, ten: "load" | "error") => act(async () => { el.dispatchEvent(new dom.window.Event(ten)) })
  const bam = (el: Element) => act(async () => { el.dispatchEvent(new dom.window.MouseEvent("click", { bubbles: true })) })
  return { dom, q, render, ban, bam, dong: () => act(async () => root.unmount()) }
}

const DUONG = "/api/zalo-media?nhan=1&anh=0"

test("ANH-AC-5 truoc khi tai co o cho, tai xong het o cho, doi chung", async () => {
  const d = await mo()
  await d.render({ anh: [DUONG], soLinkKhac: 0, coChu: false })
  assert.ok(d.q("[data-labels-anh-tai]"), "phai co o cho")
  await d.ban(d.q("img")!, "load")
  assert.equal(d.q("[data-labels-anh-tai]"), null)
  await d.dong()
})

test("ANH-AC-5 anh hong truoc khi React gan su kien van hien cau loi", async () => {
  const d = await mo()
  const proto = d.dom.window.HTMLImageElement.prototype
  Object.defineProperty(proto, "complete", { configurable: true, get: () => true })
  await d.render({ anh: [DUONG], soLinkKhac: 0, coChu: false })
  assert.equal(d.q("[data-labels-anh-tai]"), null)
  assert.match(d.q("[data-labels-anh-loi]")!.textContent!, /Ảnh không tải được/)
  await d.dong()
})

test("ANH-AC-5 doi chung: anh xong truoc khi React gan su kien thi hien anh, khong bao loi", async () => {
  const d = await mo()
  const proto = d.dom.window.HTMLImageElement.prototype
  Object.defineProperty(proto, "complete", { configurable: true, get: () => true })
  Object.defineProperty(proto, "naturalWidth", { configurable: true, get: () => 480 })
  await d.render({ anh: [DUONG], soLinkKhac: 0, coChu: false })
  assert.equal(d.q("[data-labels-anh-loi]"), null)
  assert.equal(d.q("[data-labels-anh-tai]"), null)
  assert.ok(d.q("img"))
  await d.dong()
})

test("ANH-AC-5 anh hong hien cau loi, Thu lai tai lai voi duong moi", async () => {
  const d = await mo()
  await d.render({ anh: [DUONG], soLinkKhac: 0, coChu: false })
  await d.ban(d.q("img")!, "error")
  assert.match(d.q("[data-labels-anh-loi]")!.textContent!, /Ảnh không tải được/)
  const nut = [...d.dom.window.document.querySelectorAll("button")].find((b) => b.textContent === "Thử lại")!
  await d.bam(nut)
  assert.equal(d.q("[data-labels-anh-loi]"), null)
  assert.ok(d.q("img")!.getAttribute("src")!.startsWith(`${DUONG}&lan=1`))
  await d.dong()
})

test("ANH-AC-5 bai chi co link khac hien so, khong hien cau trong", async () => {
  const d = await mo()
  await d.render({ anh: [], soLinkKhac: 2, coChu: false })
  assert.match(d.q("[data-labels-link-khac]")!.textContent!, /Bài có 2 liên kết khác/)
  assert.equal(d.q("[data-labels-anh-trong]"), null)
  await d.dong()
})

test("ANH-AC-5 bai khong gi hien cau trong; co chu thi khong hien", async () => {
  const d = await mo()
  await d.render({ anh: [], soLinkKhac: 0, coChu: false })
  assert.match(d.q("[data-labels-anh-trong]")!.textContent!, /Bài không có chữ và không có ảnh/)
  await d.render({ anh: [], soLinkKhac: 0, coChu: true })
  assert.equal(d.q("[data-labels-anh-trong]"), null)
  await d.dong()
})

test("ANH-AC-1: thẻ xem trước link dạng JSON chỉ để lại tiêu đề, không còn URL", () => {
  const u = "https://cdn.example.test/9/a.jpg"
  const dong = JSON.stringify({ title: "Bán căn 2PN", thumbnail: u, hash: "abc" }).replaceAll("/", "\\/")
  const vao = `Xem nhé\n${dong}\nwww.example.test`
  assert.deepEqual(chuKhongLink(vao, [{ kind: "url", url: u }]), { chu: "Xem nhé\nBán căn 2PN", soLinkKhac: 1 })
  assert.equal(chuKhongLink(dong, []).chu, "Bán căn 2PN")
  assert.equal(chuKhongLink(dong, []).soLinkKhac, 1)
  assert.equal(chuKhongLink(JSON.stringify({ thumbnail: u }).replaceAll("/", "\\/"), []).chu, "")
  // JSON không có URL là chữ của bài; JSON hỏng rơi về luật link thường.
  assert.deepEqual(chuKhongLink('{"a":"b"}', []), { chu: '{"a":"b"}', soLinkKhac: 0 })
  assert.doesNotMatch(chuKhongLink('{"a":"https://x.example.test/a" hong', []).chu, /example\.test/)
})

test("ANH-AC-1: link trong chữ là chính ảnh đã lưu thì không tính là liên kết khác", () => {
  const anh = danhSachAnh(null, [{ url: U, file: "media/a.jpg", snapshotId: "s1" }], "s0")
  assert.deepEqual(chuKhongLink(U, anh), { chu: "", soLinkKhac: 0 })
  assert.deepEqual(chuKhongLink(`Bán căn\n${U}`, anh), { chu: "Bán căn", soLinkKhac: 0 })
  assert.deepEqual(chuKhongLink(`${U}\n${U2}`, anh), { chu: "", soLinkKhac: 1 })
})
