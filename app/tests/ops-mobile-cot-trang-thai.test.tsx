// ops-mobile-cot-trang-thai.test.tsx — người trực mở bảng Ops ở 390px thấy cột trạng thái ngay sau cột tên (ON13, OPS-18).
// Hồ sơ nghiệm thu: _acceptance/ops-mobile-cot-trang-thai (AC-1, AC-2; AC-3/AC-4 ở scripts/smoke-ops-mobile.mjs).
// Thước đọc SSR thật: thứ tự <th data-col-id> và bề rộng <colgroup> (bảng table-fixed lấy bề rộng từ đây). Tên ca mở
// đầu bằng mã AC (ON13-AC-n).
import { test } from "node:test"
import assert from "node:assert/strict"

const ISO = "2026-10-24T05:00:00Z"

/** Ngân sách khung cuộn đo thật ở 390×844 (design doc §1): StatusGrid 21–369, InsightGrid 37–353. */
const NGAN_SACH = { StatusGrid: 348, InsightGrid: 316 } as const

type Bang = { ten: string; luoi: keyof typeof NGAN_SACH; tenCot: string; trangThai: string; html: () => Promise<string> }

async function render(el: unknown): Promise<string> {
  const { renderToStaticMarkup } = await import("react-dom/server")
  return renderToStaticMarkup(el as React.ReactElement)
}

const BANG: Bang[] = [
  {
    ten: "Sức khoẻ nguồn",
    luoi: "StatusGrid",
    tenCot: "code",
    trangThai: "state",
    html: async () => {
      const { FeedsGrid } = await import("../src/components/ops/collections/feeds-grid")
      return render(
        <FeedsGrid feeds={[{ code: "S01", labelVi: "Tự thu", status: "active", note: null, lastRunAt: ISO, lastRunSource: null, items24h: 1, stgRows: 1, offers: 1, freshnessHrs: 2, sloHours: 192, freshness: "fresh" }]} />,
      )
    },
  },
  {
    ten: "Khoá an toàn & hạ tầng thu",
    luoi: "StatusGrid",
    tenCot: "layer",
    trangThai: "state",
    html: async () => {
      const { LockdownGrid } = await import("../src/components/ops/collections/lockdown-grid")
      return render(<LockdownGrid layers={[{ layer: "L1", desc: "Chỉ đọc — không có API gửi tin", ok: true }]} lastWatchdogAt={null} />)
    },
  },
  {
    ten: "Nhóm S03",
    luoi: "InsightGrid",
    tenCot: "name",
    trangThai: "status",
    html: async () => {
      const { ZaloGroupsTable } = await import("../src/components/ops/collections-tables")
      return render(
        <ZaloGroupsTable rows={[{ name: "Nhóm mẫu", isMockOnly: false, realPosts7d: 1, mockPosts7d: 0, lastSeenAt: ISO, seen: 1, passed: 1, skipped: 0, accepted: 1, ownerAccount: null } as never]} allowlist={[]} />,
      )
    },
  },
  {
    ten: "Máy móc",
    luoi: "StatusGrid",
    tenCot: "label",
    trangThai: "alive",
    html: async () => {
      const { JobsGrid } = await import("../src/components/ops/collections/jobs-grid")
      return render(<JobsGrid jobs={[{ id: "kev", label: "Cổng Kev :8009", schedule: "Chạy liên tục", alive: "yes", lastLogAt: null, lastLine: null }]} />)
    },
  },
  {
    ten: "Kiểm chất lượng",
    luoi: "InsightGrid",
    tenCot: "check",
    trangThai: "status",
    html: async () => {
      const { DqChecksTable } = await import("../src/components/ops/quality/dq-checks-table")
      return render(<DqChecksTable rows={[{ check_name: "freshness", entity: "S01/hanoi", status: "pass", detail: "chưa có snapshot", checked_at: "2026-10-24 05:00:00+00" }]} />)
    },
  },
  {
    ten: "Độ phủ trung thực",
    luoi: "InsightGrid",
    tenCot: "name",
    trangThai: "ratio",
    html: async () => {
      const { TruthfulCoverageTable } = await import("../src/components/ops/quality-tables")
      return render(
        <TruthfulCoverageTable rows={[{ areaId: "vn-hanoi", name: "Thành phố Hà Nội", ourListings: 1, airdnaActive: 10, airdnaPeriod: "2026-09", airdnaUniverse: 20, historyMonths: 36, capturedAt: ISO, ratio: 0.1, nMarkets: 1 }]} />,
      )
    },
  },
]

/** Thứ tự cột và bề rộng (px) đọc từ SSR: <th data-col-id> trong <thead>, <col style="width:Npx"> trong <colgroup>. */
function docCot(html: string): { id: string; px: number }[] {
  const thead = html.slice(html.indexOf("<thead"), html.indexOf("</thead>"))
  const ids = [...thead.matchAll(/<th[^>]*data-col-id="([^"]+)"/g)].map((m) => m[1])
  const cg = html.slice(html.indexOf("<colgroup"), html.indexOf("</colgroup>"))
  const px = [...cg.matchAll(/<col[^>]*style="width:(\d+(?:\.\d+)?)px"/g)].map((m) => Number(m[1]))
  return ids.map((id, i) => ({ id, px: px[i] ?? NaN }))
}

/** Lỗi thứ tự: cột trạng thái phải ở vị trí NGAY SAU cột tên (tên là cột đầu). */
function loiThuTu(b: Pick<Bang, "ten" | "tenCot" | "trangThai">, cot: { id: string }[]): string[] {
  const iTen = cot.findIndex((c) => c.id === b.tenCot)
  const iTt = cot.findIndex((c) => c.id === b.trangThai)
  if (iTen !== 0) return [`${b.ten}: cột tên «${b.tenCot}» không đứng đầu (vị trí ${iTen})`]
  if (iTt !== iTen + 1) return [`${b.ten}: cột trạng thái «${b.trangThai}» ở vị trí ${iTt}, phải là ${iTen + 1}`]
  return []
}

/** Lỗi bề rộng: cột tên + cột trạng thái phải ≤ ngân sách khung của loại lưới. */
function loiBeRong(b: Pick<Bang, "ten" | "tenCot" | "trangThai" | "luoi">, cot: { id: string; px: number }[]): { tong: number; loi: string[] } {
  const w = (id: string) => cot.find((c) => c.id === id)?.px ?? NaN
  const tong = w(b.tenCot) + w(b.trangThai)
  const ns = NGAN_SACH[b.luoi]
  return { tong, loi: Number.isFinite(tong) && tong <= ns ? [] : [`${b.ten}: tên + trạng thái = ${tong}px > ngân sách ${ns}px`] }
}

// ---------- AC-1: thứ tự ----------

for (const b of BANG) {
  test(`ON13-AC-1 cột trạng thái ngay sau cột tên — ${b.ten}`, async () => {
    const cot = docCot(await b.html())
    assert.ok(cot.length >= 3, `${b.ten}: không đọc được cột từ SSR`)
    assert.deepEqual(loiThuTu(b, cot), [])
  })
}

test("ON13-AC-1 bản sao đặt trạng thái cuối bảng → báo tên bảng", async () => {
  const b = BANG[1]
  const cot = docCot(await b.html())
  const sao = [cot[0], ...cot.slice(2), cot[1]]
  assert.deepEqual(loiThuTu(b, sao), [`${b.ten}: cột trạng thái «${b.trangThai}» ở vị trí ${sao.length - 1}, phải là 1`])
})

test("ON13-AC-1 bản sao chen một cột giữa tên và trạng thái → báo tên bảng", async () => {
  const b = BANG[3]
  const cot = docCot(await b.html())
  const sao = [cot[0], { id: "chen", px: 10 }, ...cot.slice(1)]
  assert.deepEqual(loiThuTu(b, sao), [`${b.ten}: cột trạng thái «${b.trangThai}» ở vị trí 2, phải là 1`])
})

// ---------- AC-2: bề rộng ----------

for (const b of BANG) {
  test(`ON13-AC-2 tên + trạng thái ≤ ngân sách khung — ${b.ten}`, async () => {
    const { tong, loi } = loiBeRong(b, docCot(await b.html()))
    console.log(`# ON13-AC-2 ${b.ten}: ${tong}px / ngân sách ${NGAN_SACH[b.luoi]}px (${b.luoi})`)
    assert.deepEqual(loi, [])
  })
}

test("ON13-AC-2 tổng đúng bằng ngân sách → không báo; vượt 1px → báo", () => {
  const b = { ten: "Biên", tenCot: "a", trangThai: "b", luoi: "InsightGrid" as const }
  assert.deepEqual(loiBeRong(b, [{ id: "a", px: 200 }, { id: "b", px: 116 }]).loi, [], "bằng ngân sách 316 thì không báo")
  assert.deepEqual(loiBeRong(b, [{ id: "a", px: 200 }, { id: "b", px: 117 }]).loi, ["Biên: tên + trạng thái = 317px > ngân sách 316px"])
})

test("ON13-AC-2 bản sao cột tên 400px → báo tên bảng và tổng", async () => {
  const b = BANG[2]
  const html = (await b.html()).replace(/<col style="width:\d+px"\/>/, '<col style="width:400px"/>')
  const { loi } = loiBeRong(b, docCot(html))
  assert.deepEqual(loi, ["Nhóm S03: tên + trạng thái = 550px > ngân sách 316px"])
})
