// media-canonical.test.tsx — hồ sơ _acceptance/media-canonical-reso (NH1): ảnh tin đọc từ bảng `media` (053).
// NH-AC-3 tương đương với luật ghép đã ký (buildOfferImages, review-media-backend AC-5) + hai bản regex; NH-AC-5 Hàng
// duyệt; NH-AC-6 Dòng chảy + hồ sơ tin (jsdom). Không cần DB: truy vấn giả đếm lời gọi. Mỗi phép đo có chiều đỏ.
import { after, describe, test } from "node:test"
import assert from "node:assert/strict"
import { JSDOM } from "jsdom"
import type { ReactNode } from "react"

// pool của app đọc DATABASE_URL lúc import — trỏ cổng đóng: không ca nào được chạm DB thật.
process.env.DATABASE_URL = "postgres://127.0.0.1:1/khong-co"

import { MEDIA_FILE as MEDIA_FILE_PIPE, SNAPSHOT_ID as SNAPSHOT_ID_PIPE, mediaRowsFromPosts } from "../../pipeline/media-rows.mjs"
import type { User } from "../src/lib/auth"
import {
  MAX_IMAGES_PER_OFFER,
  buildMediaImages,
  buildOfferImages,
  loadReviewMedia,
  type MediaRow,
  type PostMediaRow,
} from "../src/lib/ops/review-media"
import { snapshotMediaPath } from "../src/lib/ops/zalo-media"

const SNAP = "hcmc__zalo-agent__2026-10-23T000000"
const SNAP2 = "hanoi__zalo-agent__2026-10-22T070651"
const ZDN = (n: number) => `https://f1-zpg-r.zdn.vn/${n}/anh-${n}.jpg`
const FB = (n: number) => `https://scontent.xx.fbcdn.net/v/t39/${n}.jpg?oe=6720`
const IMG = (n: number) => `https://img.example.test/s06/${n}.jpg`
const user = (role: User["role"]): User => ({ id: "1", email: `${role}@x.vn`, plan: "pro", role })
const ADMIN = user("admin")
const post = (media_files: unknown, media: unknown = null, snapshot_id = SNAP): PostMediaRow & { post_id: string } => ({
  post_id: "p",
  offer_id: "o1",
  snapshot_id,
  media,
  media_files,
})
/** Dòng bảng media mà bên đọc nhận, rút từ ĐÚNG bên ghi (pipeline/media-rows.mjs) — không viết tay khuôn bên đọc. */
const qua = (posts: PostMediaRow[], offerId = "o1"): MediaRow[] =>
  mediaRowsFromPosts(offerId, "S03", posts).map((r: { resource_record_key: string; media_url: string | null; local_file: string | null }) => ({
    offer_id: r.resource_record_key,
    media_url: r.media_url,
    local_file: r.local_file,
  }))

// ---------- NH-AC-3 ----------
// Ma trận viết trước: mọi ca AC-5 của tests/review-media.test.tsx + trùng URL giữa hai bài, entry thiếu snapshotId,
// snapshot có '..', file ngoài media/, 13 ảnh. [tên, bài, image_url của evidence]
const MA_TRAN: [string, PostMediaRow[], unknown][] = [
  [
    "AC-5 local trước, entry lỗi rơi về URL gốc",
    [
      post(
        [
          { url: ZDN(1), file: "media/1.jpg", sha256: "a", bytes: 10, snapshotId: SNAP },
          { url: ZDN(2), file: null, error: "timeout", snapshotId: SNAP },
        ],
        [{ url: ZDN(1) }, { url: ZDN(2) }],
      ),
      post([{ url: ZDN(3), file: "media/3.jpg", snapshotId: SNAP2 }], [{ url: FB(4) }]),
    ],
    IMG(9),
  ],
  [
    "AC-5 snapshotId thiếu, tham số hỏng, entry lỗi",
    [
      post([
        { url: ZDN(1), file: "media/1.jpg" },
        { url: ZDN(2), file: "../manifest.json", snapshotId: SNAP },
        { url: ZDN(3), file: "media/3.jpg", snapshotId: "../evil" },
        { url: ZDN(4), file: "media/4.jpg", error: "sha256 mismatch", snapshotId: SNAP },
      ]),
    ],
    undefined,
  ],
  [
    "AC-5 URL không phải http(s) và rác",
    [
      post("khong-phai-mang", [
        { url: "javascript:alert(1)" },
        { url: "data:image/png;base64,AAAA" },
        { url: "/api/zalo-media?path=/etc/passwd" },
        { url: 42 },
        null,
        "chuoi",
        { path: "/tmp/openclaw/x.jpg", url: null },
      ]),
      post(null, "null"),
    ],
    "file:///etc/passwd",
  ],
  ["AC-5 11 ảnh", [post(null, Array.from({ length: 11 }, (_, i) => ({ url: FB(i) })))], undefined],
  ["13 ảnh cắt còn 12", [post(null, Array.from({ length: 13 }, (_, i) => ({ url: FB(i) })))], undefined],
  [
    "trùng URL giữa hai bài: URL gốc của bài 1 có bản tải ở bài 2",
    [post(null, [{ url: ZDN(7) }, { url: ZDN(8) }]), post([{ url: ZDN(7), file: "media/7.jpg", snapshotId: SNAP2 }], [{ url: ZDN(8) }])],
    ZDN(8),
  ],
  ["entry thiếu snapshotId, bài có snapshot hỏng", [post([{ url: ZDN(5), file: "media/5.jpg" }], null, "../x")], undefined],
  ["snapshot có '..'", [post([{ url: ZDN(6), file: "media/6.jpg", snapshotId: "a..b" }])], undefined],
  ["file ngoài media/", [post([{ url: ZDN(6), file: "x/6.jpg", snapshotId: SNAP }, { url: ZDN(6), file: "media/6.jpg", snapshotId: SNAP }])], undefined],
  ["tin không bài", [], undefined],
]

describe("NH-AC-3 tương đương với buildOfferImages", () => {
  test("NH-AC-3 tương đương với buildOfferImages trên ma trận viết trước", () => {
    let chay = 0
    for (const [ten, bai, ev] of MA_TRAN) {
      assert.deepEqual(buildMediaImages(qua(bai), ev), buildOfferImages(bai, ev), `ca lệch: ${ten}`)
      chay++
    }
    assert.equal(chay, MA_TRAN.length, "số ca chạy phải bằng số ca khai")
    assert.equal(MAX_IMAGES_PER_OFFER, 12)
    // Chiều đỏ: bên ghi xếp URL gốc trước ảnh đã tải → ca đầu lệch, thông điệp gọi tên ca.
    const [ten, bai, ev] = MA_TRAN[0]
    const nguoc = [...qua(bai)].sort((a, b) => Number(a.local_file != null) - Number(b.local_file != null))
    const bo = nguoc.map((r) => ({ ...r, local_file: r.local_file && r.media_url ? null : r.local_file }))
    assert.notDeepEqual(buildMediaImages(bo, ev), buildOfferImages(bai, ev), `đột biến «URL gốc trước ảnh đã tải» phải lệch ở ca: ${ten}`)
  })

  test("NH-AC-3 hai bản regex của snapshot và tên tệp cho cùng kết quả", () => {
    const SNAPS = [SNAP, SNAP2, "a:b.c-d_e", "a..b", "../evil", "a/b", "", "-x", "Ă", "x y"]
    const FILES = ["media/1.jpg", "media/a.b_c-d.png", "media/../x", "x/1.jpg", "media/", "media/-x.jpg", "media/a/b.jpg", ""]
    let chay = 0
    for (const s of SNAPS) {
      for (const f of FILES) {
        const app = snapshotMediaPath(s, f) !== null
        const pipe = SNAPSHOT_ID_PIPE.test(s) && !s.includes("..") && MEDIA_FILE_PIPE.test(f) && !f.includes("..")
        assert.equal(pipe, app, `regex lệch ở snapshot «${s}» · file «${f}»`)
        chay++
      }
    }
    assert.equal(chay, SNAPS.length * FILES.length)
  })
})

// ---------- NH-AC-5 ----------
type Call = { text: string; values: unknown[] }
function fakeQuery(rows: MediaRow[]) {
  const calls: Call[] = []
  const query = async (text: string, values: unknown[]) => {
    calls.push({ text, values })
    return { rows: rows.filter((r) => (values[0] as string[]).includes(r.offer_id)) }
  }
  return { calls, query }
}
const S06_ROWS: MediaRow[] = [1, 2, 3].map((n) => ({ offer_id: "s06", media_url: IMG(n), local_file: null }))
const S03_BAI = [
  post([{ url: ZDN(1), file: "media/1.jpg", snapshotId: SNAP }, { url: ZDN(2), error: "http-500", snapshotId: SNAP }], [
    { url: ZDN(1) },
    ...Array.from({ length: 14 }, (_, i) => ({ url: ZDN(100 + i) })),
  ]),
]
const ROWS = [...S06_ROWS, ...qua(S03_BAI, "s03")]
const ITEMS = [
  { id: 7, item_type: "entity_match", evidence: { offer_a: { offer_id: "s06", source: "S06" }, offer_b: { offer_id: "s03", image_url: IMG(99) } } },
  { id: 9, item_type: "agent_output", evidence: { offer_id: "s03", fields: [] } },
  { id: 11, item_type: "source_decision", evidence: { offer_id: "s03" } },
]

describe("NH-AC-5 Hàng duyệt đọc bảng media", () => {
  test("NH-AC-5 một truy vấn bảng media, khoá theo id thẻ, S06 có ảnh, S03 local trước, cắt 12", async () => {
    const { calls, query } = fakeQuery(ROWS)
    const out = await loadReviewMedia(ITEMS, ADMIN, query)
    assert.equal(calls.length, 1, "cả hàng duyệt một truy vấn")
    assert.match(calls[0].text, /FROM media\b/)
    assert.doesNotMatch(calls[0].text, /stg_zalo_posts/)
    assert.deepEqual(calls[0].values, [["s06", "s03"]])
    assert.deepEqual(Object.keys(out).map(Number), [7, 9])
    assert.deepEqual(out[7].offer_a, [1, 2, 3].map((n) => ({ src: IMG(n), origin: "remote", expiring: false })))
    const b = out[7].offer_b!
    assert.equal(b.length, 12, "tối đa 12 ảnh")
    assert.equal(b[0].origin, "local")
    assert.ok(b.slice(1).every((i) => i.origin === "remote" && i.expiring), "sau ảnh đã tải là URL gốc có hạn")
    assert.ok(!b.some((i) => i.src === ZDN(1)), "URL gốc đã có bản tải không lặp")
    assert.deepEqual(out[9].offer, buildOfferImages(S03_BAI), "tin bổ sung: đúng mảng của luật ghép đã ký")
    const { query: q2 } = fakeQuery([{ offer_id: "s03", media_url: ZDN(1), local_file: null }])
    const o2 = await loadReviewMedia([ITEMS[0]], ADMIN, q2)
    assert.equal(o2[7].offer_b!.at(-1)?.src, IMG(99), "image_url của evidence đứng cuối khi chưa có")
  })

  test("NH-AC-5 không phải admin → {} và 0 truy vấn; 42P01 → {}; lỗi khác ném", async () => {
    for (const u of [null, user("user"), user("ops")]) {
      const { calls, query } = fakeQuery(ROWS)
      assert.deepEqual(await loadReviewMedia(ITEMS, u, query), {}, "người không phải admin không được nhận ảnh")
      assert.equal(calls.length, 0, u?.role ?? "khách")
    }
    // Chiều đỏ: đột biến bỏ kiểm isAdmin (gọi như admin) → có ảnh — ca trên sẽ đỏ đúng thông điệp ghim.
    const { query } = fakeQuery(ROWS)
    assert.notDeepEqual(await loadReviewMedia(ITEMS, { ...user("ops"), role: "admin" }, query), {})
    const fail = (code: string) => async () => {
      throw Object.assign(new Error(`lỗi ${code}`), { code })
    }
    assert.deepEqual(await loadReviewMedia(ITEMS, ADMIN, fail("42P01")), {})
    await assert.rejects(loadReviewMedia(ITEMS, ADMIN, fail("57P01")), /57P01/)
  })
})

// ---------- NH-AC-6 ----------
describe("NH-AC-6 nạp ảnh dòng chảy", () => {
  test("NH-AC-6 nạp ảnh dòng chảy: mọi nguồn có khoá, kể cả S06", async () => {
    const { loadFlowMedia } = await import("../src/lib/data-flow-queries")
    const rows: MediaRow[] = [...S06_ROWS, ...qua(S03_BAI, "s03"), { offer_id: "s05", media_url: FB(1), local_file: null }]
    const { calls, query } = fakeQuery(rows)
    const recs = [
      { offerId: "s03", source: "S03" },
      { offerId: "s05", source: "S05" },
      { offerId: "s06", source: "S06" },
      { offerId: "rong", source: "S06" },
    ]
    const got = await loadFlowMedia(recs, ADMIN, query)
    assert.equal(calls.length, 1)
    assert.deepEqual(Object.keys(got).sort(), ["rong", "s03", "s05", "s06"])
    for (const id of ["s03", "s05", "s06"]) assert.deepEqual(got[id], buildMediaImages(rows.filter((r) => r.offer_id === id)), `tin ${id}`)
    assert.ok(got.s06.length >= 1, "tin S06 có ảnh")
    assert.deepEqual(got.rong, [], "tin không ảnh → []")
    for (const u of [null, user("ops")]) {
      const d = fakeQuery(rows)
      assert.deepEqual(await loadFlowMedia(recs, u, d.query), {})
      assert.equal(d.calls.length, 0, "người không phải admin: 0 truy vấn ảnh")
    }
    const vang = async () => {
      throw Object.assign(new Error("relation does not exist"), { code: "42P01" })
    }
    assert.deepEqual(await loadFlowMedia(recs, ADMIN, vang), {})
  })
})

// ---------- jsdom (cùng khuôn tests/ops-dong-chay.test.tsx) ----------
const dom = new JSDOM("<!doctype html><div id=root></div>", { url: "http://localhost:3462/ops/data-flow" })
Object.assign(globalThis, {
  window: dom.window,
  self: dom.window,
  document: dom.window.document,
  HTMLElement: dom.window.HTMLElement,
  Element: dom.window.Element,
  Node: dom.window.Node,
  IS_REACT_ACT_ENVIRONMENT: true,
  requestAnimationFrame: (cb: FrameRequestCallback) => setTimeout(() => cb(Date.now()), 0),
  cancelAnimationFrame: (id: number) => clearTimeout(id),
  getComputedStyle: dom.window.getComputedStyle.bind(dom.window),
  MutationObserver: dom.window.MutationObserver,
  IntersectionObserver: class {
    observe() {}
    unobserve() {}
    disconnect() {}
  },
  ResizeObserver: class {
    observe() {}
    unobserve() {}
    disconnect() {}
  },
  matchMedia: () => ({ matches: false, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {} }),
})
dom.window.matchMedia = (globalThis as unknown as { matchMedia: typeof dom.window.matchMedia }).matchMedia
dom.window.HTMLElement.prototype.scrollIntoView = () => {}
;(dom.window.Element.prototype as unknown as { getAnimations: () => unknown[] }).getAnimations = () => []
Object.defineProperty(globalThis, "navigator", { value: dom.window.navigator, configurable: true })

let currentRoot: { render: (n: ReactNode) => void; unmount: () => void } | null = null
async function render(node: ReactNode) {
  const React = await import("react")
  Object.assign(globalThis, { React })
  const { createRoot } = await import("react-dom/client")
  if (currentRoot) {
    const r = currentRoot
    currentRoot = null
    await React.act(async () => r.unmount())
  }
  document.body.innerHTML = "<div id=root></div>"
  const root = createRoot(document.getElementById("root")!)
  currentRoot = root
  await React.act(async () => root.render(node))
  return document.getElementById("root")!
}
async function act(fn: () => void | Promise<void>) {
  const React = await import("react")
  await React.act(async () => {
    await fn()
    await new Promise((r) => setTimeout(r, 20))
  })
}
const click = async (el: Element | null | undefined, what: string) => {
  assert.ok(el, `không tìm thấy ${what} để bấm`)
  await act(() => (el as HTMLElement).click())
}
const dialogs = () => document.querySelectorAll("[role=dialog]")
async function closeSheets() {
  for (const d of dialogs()) {
    await act(() => {
      d.dispatchEvent(new dom.window.KeyboardEvent("keydown", { key: "Escape", bubbles: true }))
    })
  }
  await act(() => new Promise((r) => setTimeout(r, 30)))
}
after(async () => {
  await closeSheets().catch(() => {})
  const { pool } = await import("../src/lib/db")
  await pool.end().catch(() => {})
})

type Rec = import("../src/lib/data-flow-queries").FlowRecord
const rec = (p: Partial<Rec>): Rec => ({
  offerId: "r", source: "S06", kind: "sale", propertyType: "house", priceVnd: 3_200_000_000, areaM2: 81, bedrooms: 3,
  ward: "Tân Định", market: "Thành phố Hồ Chí Minh", confidence: "medium", nPosts: 0, linked: true,
  firstSeen: "2026-10-25 09:00:00+00", lastSeen: "2026-10-25 09:00:00+00", postText: null, postGroup: null, ...p,
})
const RECS: Rec[] = [rec({ offerId: "x", source: "S03", postText: "3pn 81m2 3,2 tỷ", nPosts: 1 }), rec({ offerId: "s06a" }), rec({ offerId: "s06b" })]
const img = (n: number) => ({ src: IMG(n), origin: "remote" as const, expiring: false })

describe("NH-AC-6 hồ sơ tin S06", () => {
  const mo = async (root: HTMLElement, id: string) => {
    const tr = [...root.querySelectorAll("tbody tr")][RECS.findIndex((r) => r.offerId === id)]
    await click(tr?.querySelector("td:nth-child(2)"), `hàng ${id}`)
    return dialogs()[0]
  }
  const nhomAnh = (d: Element) => d.querySelector("[role=group][aria-label^='Ảnh']")

  test("NH-AC-6 hồ sơ tin S06 có ảnh: dải ảnh của đúng tin, bảng không tải ảnh", async () => {
    const { RecordsGrid } = await import("../src/components/ops/data-flow/records-grid")
    const media = { x: [img(9)], s06a: [img(1), img(2)], s06b: [] }
    const root = await render(<RecordsGrid records={RECS} roles={{}} xemBaiGoc media={media} />)
    assert.equal(root.querySelectorAll("img").length, 0, "bảng «Tin mới nhất» không tải ảnh")
    let d = await mo(root, "s06a")
    const g = nhomAnh(d)
    assert.ok(g, "hồ sơ tin S06 có dải ảnh")
    assert.deepEqual([...g!.querySelectorAll("img")].map((i) => i.getAttribute("src")), [IMG(1), IMG(2)], "ảnh phải thuộc đúng tin đang mở")
    assert.doesNotMatch(d.textContent ?? "", /Chưa gắn được ảnh/)
    await closeSheets()
    d = await mo(root, "s06b")
    assert.match(d.textContent ?? "", /không có ảnh/)
    assert.equal(d.querySelectorAll("img").length, 0)
    await closeSheets()
    // Chiều đỏ: hồ sơ đọc media của tin đầu bảng (x) thay vì tin đang mở → src lệch.
    const sai = { s06a: media.x }
    const root2 = await render(<RecordsGrid records={RECS} roles={{}} xemBaiGoc media={sai} />)
    d = await mo(root2, "s06a")
    assert.notDeepEqual([...nhomAnh(d)!.querySelectorAll("img")].map((i) => i.getAttribute("src")), [IMG(1), IMG(2)], "ảnh phải thuộc đúng tin đang mở")
    await closeSheets()
  })

  test("NH-AC-6 hồ sơ tin S06 không admin: câu quyền, 0 ảnh", async () => {
    const { RecordsGrid } = await import("../src/components/ops/data-flow/records-grid")
    const root = await render(<RecordsGrid records={RECS} roles={{}} xemBaiGoc />)
    const d = await mo(root, "s06a")
    assert.match(d.textContent ?? "", /Ảnh tin chỉ hiện cho quản trị viên\./)
    assert.equal(d.querySelectorAll("img").length, 0)
    assert.doesNotMatch(d.textContent ?? "", /không có ảnh/)
    await closeSheets()
    // Đối chứng dương: cùng tin, admin có media → dải ảnh 2 <img>.
    const root2 = await render(<RecordsGrid records={RECS} roles={{}} xemBaiGoc media={{ s06a: [img(1), img(2)] }} />)
    const d2 = await mo(root2, "s06a")
    assert.equal(nhomAnh(d2)?.querySelectorAll("img").length, 2)
    await closeSheets()
  })

  test("NH-AC-6 hồ sơ tin S06 cloud: câu máy thu, 0 ảnh", async () => {
    const { RecordsGrid } = await import("../src/components/ops/data-flow/records-grid")
    const root = await render(<RecordsGrid records={RECS} roles={{}} xemBaiGoc cloud media={{ s06a: [img(1)] }} />)
    const d = await mo(root, "s06a")
    assert.match(d.textContent ?? "", /Ảnh tin chỉ xem ở máy thu\./)
    assert.equal(d.querySelectorAll("img").length, 0)
    assert.doesNotMatch(d.textContent ?? "", /không có ảnh/)
    await closeSheets()
  })
})
