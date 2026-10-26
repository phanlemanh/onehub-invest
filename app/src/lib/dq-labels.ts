/**
 * Diễn giải kết quả kiểm chất lượng (`dq_check_results`) bằng tiếng Việt cho /ops/quality (ON12 `ops-nhan-theo-context`,
 * design doc §2.3). Đọc theo khuôn CỦA BÊN GHI — pipeline/sql/450_dq_checks.sql, pipeline/dq-truthful-coverage.mjs,
 * pipeline/dq-enum-vocab.mjs, pipeline/scripts/bench-extraction.mjs — và khuôn cũ còn trong 7 ngày. Không sửa pipeline:
 * đổi ở bên ghi không đổi được dòng đã ghi. Khuôn lạ → giữ chuỗi gốc (hiện trong `<code>`) kèm `known: false`.
 */
import { marketNameOf } from "./market-names"
import { confidenceLabel, offerKindLabel, propertyTypeLabel } from "./ops-labels"

export type DqText = { text: string; code?: string; known: boolean }

const TEN_KIEM: Record<string, string> = {
  "occupancy-domain": "Công suất trong khoảng 0–1",
  "not-null": "Không có dòng rỗng",
  "area-slug-valid": "Mã khu vực hợp lệ",
  area_con_ngoai_cha: "Khu vực con nằm trong khu vực cha",
  "listing-volume": "Khối lượng listing",
  "adr-drift": "ADR không trôi",
  freshness: "Độ tươi",
  "truthful-coverage": "Độ phủ tham chiếu",
  "extraction-quality": "Chất lượng trích xuất",
  "enum-vocab:property_type-coverage": "Độ phủ loại hình",
}
const COT_ENUM: Record<string, string> = {
  kind: "loại tin",
  confidence: "độ tin trích xuất",
  price_tier: "bậc giá",
  property_type: "loại hình",
}

/** Tên kiểm của bên ghi → tên tiếng Việt. */
export function dqCheckName(check: string): DqText {
  if (Object.hasOwn(TEN_KIEM, check)) return { text: TEN_KIEM[check], known: true }
  const m = check.match(/^enum-vocab:(\w+)$/)
  if (m && Object.hasOwn(COT_ENUM, m[1])) return { text: `Từ vựng ${COT_ENUM[m[1]]}`, known: true }
  return { text: "Kiểm khác (chưa diễn giải)", code: check, known: false }
}

const DOI_TUONG: Record<string, string> = {
  market_metrics: "Chỉ số thị trường",
  listing_stats: "Số liệu listing",
  areas: "Khu vực",
  sale_offers: "Tin rao",
  regex: "Bộ đọc theo luật",
  llm: "Bộ đọc AI",
  all: "Mọi thị trường",
}

/** Đối tượng kiểm: tên bảng, `sale_offers:S0x`, `S0x/<mã thị trường>`, mã khu vực `vn-…`, mã thị trường trần. */
export function dqEntityLabel(entity: string, areaNames: ReadonlyMap<string, string>): DqText {
  if (Object.hasOwn(DOI_TUONG, entity)) return { text: DOI_TUONG[entity], known: true }
  const tin = entity.match(/^sale_offers:(S0\d)$/)
  if (tin) return { text: `Tin rao · ${tin[1]}`, known: true }
  const nguon = entity.match(/^(S0\d)\/(.+)$/)
  const tt = marketNameOf(nguon ? nguon[2] : entity, areaNames)
  if (tt.known) return { text: nguon ? `${nguon[1]} · ${tt.name}` : tt.name, known: true }
  return { text: "Đối tượng khác (chưa diễn giải)", code: entity, known: false }
}

/** Số thập phân kiểu Việt («0.966» → «0,966»). */
const so = (s: string) => s.replace(".", ",")
/** Số nguyên có dấu chấm nghìn. */
const nguyen = (s: string) => (/^\d+$/.test(s) ? Number(s).toLocaleString("vi-VN") : s)
const chuaCo = (s: string) => (s === "null" || s === "n/a" ? "chưa có" : s)
/** Kỳ «2026-09» → «09/2026». */
const ky = (s: string) => (/^\d{4}-\d{2}$/.test(s) ? `${s.slice(5)}/${s.slice(0, 4)}` : chuaCo(s))

const GIA_TRI_ENUM = (v: string): string => {
  for (const f of [propertyTypeLabel, offerKindLabel, confidenceLabel]) {
    const n = f(v)
    if (n.known) return n.label
  }
  return v // P0/P1/P2 — mã bậc giá giữ nguyên
}

const TRUONG_F1: Record<string, string> = {
  kind: "loại tin",
  priceVnd: "giá",
  pricePerm2Vnd: "giá/m²",
  areaM2: "diện tích",
  bedrooms: "phòng ngủ",
  phuong: "phường",
}

/** Chi tiết kiểm → câu tiếng Việt. `check` chỉ dùng để phân biệt khuôn trùng hình. */
export function dqDetail(check: string, detail: string | null): DqText {
  if (detail === null || detail === "") return { text: "—", known: true }
  const d = detail.trim()
  let m: RegExpMatchArray | null
  if ((m = d.match(/^vi phạm: (\d+)$/))) return { text: `${nguyen(m[1])} vi phạm`, known: true }
  if ((m = d.match(/^dòng toàn NULL: (\d+)$/))) return { text: `${nguyen(m[1])} dòng rỗng toàn bộ`, known: true }
  if ((m = d.match(/^slug rỗng\/lệch: (\d+)$/))) return { text: `${nguyen(m[1])} mã khu vực rỗng hoặc lệch`, known: true }
  if ((m = d.match(/^(\d+) khu vực con có tâm ngoài polygon cha \/ (\d+) con$/)))
    return { text: `${nguyen(m[1])}/${nguyen(m[2])} khu vực con nằm ngoài khu vực cha`, known: true }
  if ((m = d.match(/^7 ngày gần: (\d+) vs 7 ngày trước: (\d+)$/)))
    return { text: `7 ngày gần: ${nguyen(m[1])} · 7 ngày trước: ${nguyen(m[2])}`, known: true }
  if ((m = d.match(/^snapshot mới (\d+) vs trước (\d+) \(([+-]?\d+)\)$/)))
    return { text: `Snapshot mới ${nguyen(m[1])} · trước ${nguyen(m[2])} (${m[3]})`, known: true }
  if ((m = d.match(/^median ADR (\d+) vs (\d+)$/)))
    return { text: `ADR trung vị ${nguyen(m[1])} · kỳ trước ${nguyen(m[2])}`, known: true }
  if ((m = d.match(/^snapshot cuối (\d{4}-\d{2}-\d{2}) \((\d+) ngày, SLO (\d+)\)$/)))
    return { text: `Snapshot cuối ${m[1]} (${m[2]} ngày, SLO ${m[3]} ngày)`, known: true }
  if (d === "chưa có snapshot") return { text: "Chưa có snapshot", known: true }
  if (d === "chưa có crosswalk S02 nào") return { text: "Chưa nối thị trường S02 nào", known: true }
  if ((m = d.match(/^our=(\w+) (?:s02|S02|airdna)_active=(\w+)\(([^)]*)\) universe=(\w+) history=(\w+)m coverage=([\d.]+%|n\/a) captured_age=(\w+|n\/a)d$/)))
    return {
      text:
        `Tự thu ${nguyen(m[1])} · S02 đang hoạt động ${nguyen(chuaCo(m[2]))} (${ky(m[3])}) · đã mua ${nguyen(chuaCo(m[4]))} · ` +
        `lịch sử ${chuaCo(m[5])} tháng · độ phủ ${so(chuaCo(m[6]))} · số tham chiếu ${m[7] === "n/a" ? "chưa có" : `${m[7]} ngày tuổi`}`,
      known: true,
    }
  if ((m = d.match(/^(\d+) giá trị ngoài vocabulary \(([^)]*)\)$/)))
    return { text: `${nguyen(m[1])} giá trị ngoài danh sách cho phép (${m[2].split("|").map(GIA_TRI_ENUM).join(", ")})`, known: true }
  if ((m = d.match(/^(\d+) giá trị ngoài vocabulary, ví dụ: (.+)$/)))
    return { text: `${nguyen(m[1])} giá trị ngoài danh sách cho phép, ví dụ:`, code: m[2], known: true }
  if ((m = d.match(/^(\d+)\/(\d+) offers có loại hình$/)))
    return { text: `${nguyen(m[1])}/${nguyen(m[2])} tin rao có loại hình`, known: true }
  if (d === "samples=0") return { text: "Chưa có mẫu", known: true }
  if ((m = d.match(/^samples=(\d+) avgF1=([\d.]+)((?: \w+=[\d.]+)*)$/))) {
    const truong = m[3].trim() ? m[3].trim().split(" ").map((kv) => kv.split("=")) : []
    if (truong.every(([k]) => Object.hasOwn(TRUONG_F1, k)))
      return {
        text: [`${nguyen(m[1])} mẫu`, `F1 trung bình ${so(m[2])}`, ...truong.map(([k, v]) => `${TRUONG_F1[k]} ${so(v)}`)].join(" · "),
        known: true,
      }
  }
  return { text: "(chưa diễn giải)", code: d, known: false }
}
