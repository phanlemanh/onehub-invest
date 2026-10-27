// df0-chang-theo-ngay.test.tsx — hồ sơ _acceptance/df0-chang-theo-ngay-diem-0: biểu đồ «Chặng theo ngày» trên
// /ops/data-flow vẽ đủ mọi ngày của cửa sổ, ngày nguồn im là điểm 0. Tên ca mở đầu bằng mã AC (CN-AC-n). Thuần + jsdom,
// không DB. Ma trận mẫu ngày viết trước; chiều đỏ là thuật toán cũ (ngày có số, sắp, cắt đuôi) trên CÙNG mẫu.
import { describe, test } from "node:test"
import assert from "node:assert/strict"
import { JSDOM } from "jsdom"

import type { FlowDay, FlowSource, FlowWindow } from "../src/lib/data-flow-queries"

// ---------- jsdom (cùng khuôn ops-dong-chay.test.tsx) ----------
const dom = new JSDOM("<!doctype html><div id=root></div>", { url: "http://localhost:3461/ops/data-flow" })
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
  ResizeObserver: class {
    observe() {}
    unobserve() {}
    disconnect() {}
  },
  matchMedia: () => ({ matches: false, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {} }),
})
Object.defineProperty(globalThis, "navigator", { value: dom.window.navigator, configurable: true })

const lib = () => import("../src/components/ops/data-flow/stage-trend-data")

// 12:00 giờ VN ngày 26/10 → cửa sổ 7 ngày VN 20…26.
const NOW = Date.parse("2026-10-26T05:00:00Z")
const W7 = ["2026-10-20", "2026-10-21", "2026-10-22", "2026-10-23", "2026-10-24", "2026-10-25", "2026-10-26"]
const day = (d: string, source: FlowSource, received: number, readable = 0, offers = 0, linked = 0): FlowDay => ({ day: d, source, received, readable, offers, linked })
type Row = [number, number, number, number]
const ZERO: Row = [0, 0, 0, 0]

/** Thuật toán cũ của StageTrendChart (trước Ngoài-8): trục là các ngày CÓ số, sắp, cắt đuôi theo số ngày cửa sổ. */
function oldKeys(days: FlowDay[], windowDays: number): string[] {
  return [...new Set(days.map((d) => d.day))].sort().slice(-windowDays)
}

// Ma trận viết trước: mẫu → dữ liệu → bảng mong đợi đủ 7 ngày [received, readable, offers, linked].
const MAU: { ten: string; days: FlowDay[]; want: Record<string, Row> }[] = [
  {
    ten: "lỗ giữa",
    days: [day("2026-10-20", "S03", 5, 4, 2, 1), day("2026-10-23", "S03", 3, 2, 1, 0), day("2026-10-26", "S03", 7, 6, 3, 2)],
    want: { "2026-10-20": [5, 4, 2, 1], "2026-10-23": [3, 2, 1, 0], "2026-10-26": [7, 6, 3, 2] },
  },
  {
    ten: "im ba ngày cuối",
    days: [day("2026-10-18", "S03", 9), day("2026-10-20", "S03", 5, 4, 2, 1), day("2026-10-21", "S03", 2, 1, 1, 0), day("2026-10-22", "S06", 4, 3, 3, 1), day("2026-10-23", "S03", 1)],
    want: { "2026-10-20": [5, 4, 2, 1], "2026-10-21": [2, 1, 1, 0], "2026-10-22": [4, 3, 3, 1], "2026-10-23": [1, 0, 0, 0] },
  },
  {
    ten: "hai nguồn cùng ngày",
    days: [day("2026-10-24", "S03", 5, 4, 2, 1), day("2026-10-24", "S06", 10, 8, 8, 3), day("2026-10-25", "S05", 2, 2, 2, 0)],
    want: { "2026-10-24": [15, 12, 10, 4], "2026-10-25": [2, 2, 2, 0] },
  },
  {
    ten: "chỉ một ngày có số",
    days: [day("2026-10-22", "S05", 6, 3, 1, 0)],
    want: { "2026-10-22": [6, 3, 1, 0] },
  },
]

describe("CN-AC-1 đủ ngày", () => {
  test("CN-AC-1 đủ ngày — 7 ngày VN liên tiếp tới hôm nay, ngày im = 0, cộng mọi nguồn", async () => {
    const { dailySeries } = await lib()
    for (const m of MAU) {
      const s = dailySeries(m.days, NOW, 7)
      assert.deepEqual(s.map((p) => p.key), W7, `mẫu ${m.ten}: khoá ngày lệch`)
      for (const p of s) assert.deepEqual([p.received, p.readable, p.offers, p.linked], m.want[p.key] ?? ZERO, `mẫu ${m.ten}: ngày ${p.key}`)
    }
    console.log(`# CN-AC-1 ${MAU.length} mẫu × 7 ngày khớp bảng viết trước`)
    // Chiều đỏ cùng ca: thuật toán cũ trên mẫu «lỗ giữa» thiếu ngày.
    const cu = oldKeys(MAU[0].days, 7)
    console.log(`# CN-AC-1 chiều đỏ thuật toán cũ «lỗ giữa»: ${cu.length} ngày (${cu.join(", ")})`)
    assert.notEqual(cu.length, 7, "mẫu lỗ giữa: thiếu ngày — thuật toán cũ phải lệch")
  })
})

describe("CN-AC-2 không lấy ngày ngoài cửa sổ", () => {
  test("CN-AC-2 không lấy ngày ngoài cửa sổ — số chỉ ở 10–12 ngày trước ra 7 điểm 0", async () => {
    const { dailySeries } = await lib()
    const cuDays = [day("2026-10-14", "S03", 4, 3, 2, 1), day("2026-10-15", "S03", 6, 5, 2, 1), day("2026-10-16", "S06", 3, 3, 3, 0)]
    const s = dailySeries(cuDays, NOW, 7)
    assert.deepEqual(s.map((p) => p.key), W7)
    assert.ok(s.every((p) => p.received + p.readable + p.offers + p.linked === 0), "mẫu số cũ: phải 7 điểm 0")
    const cu = oldKeys(cuDays, 7)
    console.log(`# CN-AC-2 thuật toán cũ ra ${cu.join(", ")}`)
    assert.ok(cu.some((k) => !W7.includes(k)), "mẫu số cũ: ngày ngoài cửa sổ lọt vào — thuật toán cũ phải lộ lỗi này")
  })
})

describe("CN-AC-3 ranh giới giờ VN", () => {
  test("CN-AC-3 ranh giới giờ VN — ngày cuối đổi lúc 00:00 giờ VN", async () => {
    const { dailySeries } = await lib()
    const truoc = dailySeries([], Date.parse("2026-10-26T16:59:59Z"), 7).at(-1)!.key
    const sau = dailySeries([], Date.parse("2026-10-26T17:00:00Z"), 7).at(-1)!.key
    console.log(`# CN-AC-3 16:59:59Z → ${truoc} · 17:00:00Z → ${sau}`)
    assert.equal(truoc, "2026-10-26")
    assert.equal(sau, "2026-10-27")
    // Chiều đỏ: khoá ngày theo UTC cho cùng mốc ra ngày khác.
    assert.notEqual(new Date(Date.parse("2026-10-26T17:00:00Z")).toISOString().slice(0, 10), sau, "khoá UTC phải khác khoá VN ở mốc 17:00:00Z")
  })
})

describe("CN-AC-4 độ dài cửa sổ", () => {
  test("CN-AC-4 độ dài cửa sổ — 7 và 30 điểm, liên tiếp không trùng", async () => {
    const { dailySeries } = await lib()
    for (const n of [7, 30]) {
      const keys = dailySeries(MAU[0].days, NOW, n).map((p) => p.key)
      assert.equal(keys.length, n)
      assert.equal(new Set(keys).size, n, `cửa sổ ${n}: khoá trùng`)
      assert.equal(keys.at(-1), "2026-10-26")
      for (let i = 1; i < keys.length; i++)
        assert.equal(Date.parse(`${keys[i]}T00:00:00Z`) - Date.parse(`${keys[i - 1]}T00:00:00Z`), 86400000, `cửa sổ ${n}: ${keys[i - 1]} → ${keys[i]} không liên tiếp`)
      console.log(`# CN-AC-4 cửa sổ ${n}: ${keys[0]} … ${keys.at(-1)}`)
    }
  })
})

async function drawChart(days: FlowDay[]) {
  const React = await import("react")
  Object.assign(globalThis, { React })
  const { createRoot } = await import("react-dom/client")
  const { StageTrendChart } = await import("../src/components/ops/data-flow/stage-trend-chart")
  document.body.innerHTML = "<div id=root></div>"
  const root = createRoot(document.getElementById("root")!)
  await React.act(async () => root.render(<StageTrendChart sources={[]} days={days} nowMs={NOW} windowDays={7} />))
  const text = document.body.textContent ?? ""
  await React.act(async () => root.unmount())
  return text
}
const TRONG = "Chưa có số theo ngày trong khoảng này."

describe("CN-AC-5 trạng thái trống", () => {
  test("CN-AC-5 trạng thái trống — mọi điểm 0 hiện câu trống, có số thì không", async () => {
    const rong = await drawChart([])
    const ngoai = await drawChart([day("2026-10-14", "S03", 4)])
    const co = await drawChart([day("2026-10-25", "S03", 4)])
    console.log(`# CN-AC-5 rỗng ${rong.includes(TRONG)} · chỉ ngoài cửa sổ ${ngoai.includes(TRONG)} · có ngày trong cửa sổ ${co.includes(TRONG)}`)
    assert.ok(rong.includes(TRONG), "days rỗng phải hiện câu trống")
    assert.ok(ngoai.includes(TRONG), "số chỉ ngoài cửa sổ phải hiện câu trống")
    assert.ok(!co.includes(TRONG), "đối chứng dương: có một ngày trong cửa sổ có số thì không hiện câu trống")
  })
})

describe("CN-AC-8 mọi cửa sổ", () => {
  test("CN-AC-8 mọi cửa sổ — chartDaysOf qua mọi giá trị parseFlowWindow nhận", async () => {
    const { chartDaysOf, dailySeries } = await lib()
    const { FLOW_WINDOWS, parseFlowWindow } = await import("../src/lib/data-flow-queries")
    const WANT: Record<FlowWindow, number> = { "7d": 7, "30d": 30, all: 30 }
    const ws = [...FLOW_WINDOWS.map((w) => parseFlowWindow(w)), parseFlowWindow("la-lung")]
    assert.deepEqual([...new Set(ws)].sort(), Object.keys(WANT).sort(), "cửa sổ trang lệch bảng viết trước")
    for (const w of ws) {
      const n = chartDaysOf(w)
      assert.equal(n, WANT[w], `cửa sổ ${w}`)
      assert.equal(dailySeries(MAU[0].days, NOW, n).length, WANT[w], `cửa sổ ${w}: số điểm`)
    }
    console.log(`# CN-AC-8 ${ws.map((w) => `${w}→${chartDaysOf(w)}`).join(" · ")}`)
    // Chiều đỏ cùng ca: chartDaysOf đột biến trả null cho «Tất cả» → 0 điểm.
    const dotBien = (w: FlowWindow) => (w === "all" ? (null as unknown as number) : chartDaysOf(w))
    assert.equal(dailySeries(MAU[0].days, NOW, dotBien("all")).length, 0, "cửa sổ Tất cả: 0 điểm khi đột biến trả null")
    assert.notEqual(dailySeries(MAU[0].days, NOW, dotBien("all")).length, WANT.all, "cửa sổ Tất cả: 0 điểm — đột biến phải lộ")
  })
})
