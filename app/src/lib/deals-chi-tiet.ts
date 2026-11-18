import { LABELS_VI } from "./vocab.generated";
import { fmtInt, fmtPct } from "./format";
import type { ReviewImage } from "./ops/review-media";

/**
 * Ba ngưỡng của Căn giá tốt và hạn tin, một nguồn cho câu SQL và chữ trên trang. Tệp này không kéo pg nên thành phần
 * client dùng được; `lib/deals.ts` mang câu SQL và loader.
 */
export const NGUONG_VAO_PCT = 5;
/** Giảm hơn ngưỡng này so với thước → tin cần xác minh: vẫn hiện, đứng cuối (Mạnh chốt Hỏi-2, ON11 24/10). */
export const NGHI_NGO_PCT = 35;
export const NGUONG_LOAI_PCT = 50;
export const NGAY_TOI_DA = 45;

/** Căn của Căn giá tốt: số chứng minh, các cột «ở đâu» của sale_offers, liên hệ, ảnh đã qua khoá, chữ bài đầy đủ. */
export type DealChiTiet = {
  offerId: string;
  source: string; // 'S03' | 'S05'
  priceVnd: number | null;
  areaM2: number | null;
  pricePerm2: number | null;
  bedrooms: number | null;
  phuong: string | null;
  areaPath: string | null;
  medianPerm2: number | null; // thước P2 cùng phường
  rulerN: number | null; // số tin S06 dựng thước
  discountPct: number | null; // % dưới thước P2 — bait_gap_pct pipeline tính sẵn
  suspect: boolean; // giảm > NGHI_NGO_PCT: tin cần xác minh, đứng cuối danh sách
  confidence: string;
  firstSeen: string;
  lastSeen: string;
  nReposts: number;
  sellerName: string | null;
  sellerPhone: string | null;
  groupName: string | null;
  brokerNAds: number | null;
  brokerMedianGap: number | null;
  propertyType: string | null;
  block: string | null;
  floor: string | null;
  unit: string | null;
  streetNumber: string | null;
  street: string | null;
  district: string | null;
  images: ReviewImage[];
  postTextFull: string | null;
  /** Lý do căn không còn trong danh sách; null khi còn trong danh sách. */
  roiDanhSach: string | null;
  /** Hạng giá tính sẵn (CG9, bảng offer_price_rank); null khi bảng chưa có hay chưa chấm — khi đó số theo thước CG8. */
  rank?: HangGia | null;
  /** Dải m² thường gặp của dự án × PN (CG10, project_area_band) cho căn hộ thiếu diện tích; null khi không có. Suy ra, không phải m² của tin. */
  daiM2?: { p10: number; p90: number } | null;
  /** Số tin của cùng một căn trong danh sách (CG10: mỗi căn một dòng); 1 khi căn chỉ có một tin. */
  soTin?: number;
  /** Mặt bằng S03 so S06 của nhóm cấp dự án (CG15, project_source_baseline — chỉ máy thu); chỉ tin S03 cấp dự án, null khi không có. */
  matBang?: MatBang | null;
};

/** Một dòng project_source_baseline (CG15): đếm theo căn (phiếu), trung vị theo thước của nhóm. */
export type MatBang = {
  nS03: number;
  medianS03: number | null;
  nS06: number;
  medianS06: number | null;
  /** (trung vị S03 / trung vị S06 − 1) × 100; null khi một bên dưới 5 căn. */
  lechPct: number | null;
  trangThai: "du" | "thieu-s03" | "thieu-s06" | "thieu-hai";
};

/** Trung vị theo thước: giá/m² (triệu, dưới một triệu thì nghìn) hay giá tháng. */
const chuTrungVi = (v: number | null, metric: string | null): string => {
  if (v === null) return "—";
  if (metric === "gia-thang-pn") return `${fmtInt(v / 1e6)} tr/tháng`;
  return v < 1e6 ? `${fmtInt(v / 1e3)} nghìn/m²` : `${fmtInt(v / 1e6)} tr/m²`;
};
/** Độ lệch có dấu, phẩy thập phân: «−4,1%» khi S03 rẻ hơn mặt bằng S06, «+3,0%» khi đắt hơn. */
const chuLech = (pct: number): string => `${pct < 0 ? "−" : "+"}${fmtPct(Math.abs(pct) / 100)}`;

/**
 * Hàng «Mặt bằng S06 cùng dự án» của trang một căn (thiết kế §2.3): đủ hai bên ghi trung vị và số căn của CẢ hai nguồn cùng độ
 * lệch; thiếu bên dùng đúng câu của danh sách.
 */
export function chuMatBangChiTiet(m: MatBang, metric: string | null): string {
  if (m.trangThai !== "du") return chuMatBang(m, metric);
  return `S03 ${chuTrungVi(m.medianS03, metric)} · ${m.nS03} căn · S06 ${chuTrungVi(m.medianS06, metric)} · ${m.nS06} căn · S03 ${
    m.lechPct === null ? "—" : chuLech(m.lechPct)}`;
}

/** Chữ mặt bằng S06 cạnh hạng của tin S03 (CG15, thiết kế §2.3): bốn câu theo trạng thái, đơn vị «căn» (Hỏi-3). */
export function chuMatBang(m: MatBang, metric: string | null): string {
  const s06 = `S06 ${chuTrungVi(m.medianS06, metric)} · ${m.nS06} căn`;
  switch (m.trangThai) {
    case "du":
      return `${s06} · S03 ${m.lechPct === null ? "—" : chuLech(m.lechPct)}`;
    case "thieu-s06":
      return `S06 chưa đủ để so (${m.nS06} căn)`;
    case "thieu-s03":
      return `S03 chưa đủ để so (${m.nS03} căn) · ${s06}`;
    default:
      return `Chưa đủ căn hai nguồn để so (S03 ${m.nS03} · S06 ${m.nS06})`;
  }
}

/** Một dòng offer_price_rank cho trang (CG9). Số NULL khi tin không chấm (`reason` nói vì sao). */
export type HangGia = {
  n: number | null;
  median: number | null;
  p20: number | null;
  pct: number | null; // hạng phần trăm trong nhóm, 0 = rẻ nhất
  below: number | null; // % dưới trung vị
  label: string | null; // re-trong-phuong | gia-tot
  needsVerification: boolean;
  bedroomsGroup: number | null;
  reason: string | null;
  metric: string | null; // gia-m2 | gia-thang-pn
  /** Cấp của nhóm so sánh (CG10): phuong | du_an; null ở dữ liệu CG9 cũ không mang cột. */
  level?: string | null;
  /** Nút của nhóm: area_id (phường) hay asset_nodes.id (dự án). */
  node?: string | null;
  /** Tên dự án khi level = du_an (asset_nodes.name). */
  nodeName?: string | null;
};

/** Nhãn hạng trên trang (CONTEXT.md «Rẻ trong phường»; «Giá tốt» từ cấp dự án — CG10). */
export const NHAN_HANG: Record<string, string> = { "re-trong-phuong": "Rẻ trong phường", "gia-tot": "Giá tốt" };
export const CHU_CAN_XAC_MINH = "Cần xác minh";

/** Chữ của từng mã lý do trong offer_price_rank.ly_do (420_price_rank.sql); mã lạ → `CHU_LY_DO_LA`. */
export const CHU_LY_DO: Record<string, string> = {
  "chua-ro-loai": "Chưa rõ loại hình — không so được với căn cùng loại",
  "thieu-phuong": "Chưa rõ phường — không có nhóm để so",
  "thieu-gia": "Thiếu giá hoặc diện tích — không tính được giá/m²",
  "thieu-dt-va-pn": "Tin thuê thiếu cả diện tích lẫn số phòng ngủ — không so được",
  "ngoai-khoang": "Giá nằm ngoài khoảng hợp lệ để so",
  "phi-ly": "Diện tích hoặc số phòng phi lý — đã loại khỏi so sánh",
  "nhom-duoi-5": "Nhóm so sánh dưới 5 căn — chưa chấm hạng",
  "nhom-5-9": "Nhóm so sánh chỉ có 5–9 căn — có số, chưa gắn nhãn",
  "pn-duoi-10": "Chưa đủ 10 căn cùng số phòng ngủ — so với cả nhóm cùng loại trong phường",
};
export const CHU_LY_DO_LA = "Chưa chấm được hạng giá";

/** Chữ cho một mã lý do; `phi-ly:<lý do ON11>` dùng chữ của `phi-ly`. */
export function chuLyDo(ma: string): string {
  return CHU_LY_DO[ma.split(":")[0]] ?? CHU_LY_DO_LA;
}

/** Một hàng của bảng và sheet: `DealChiTiet` đã áp vai cộng các chữ tính phía máy chủ (`dealHang` của lib/deals). */
export type DealHang = DealChiTiet & {
  ten: string;
  thieu: string[];
  cau: string | null;
  tel: string | null;
  sdt: string | null;
  xemAnh: boolean;
};

/** Số phần trăm in ra: một chữ số thập phân như `bait_gap_pct`, bỏ «.0». Làm tròn về số nguyên thì 4,9 đọc thành 5 và tự mâu thuẫn với ngưỡng. */
export const soPct = (pct: number): string => String(Number(Math.abs(pct).toFixed(1)));

/** Cùng điều kiện với WHERE của `dealsSql`; `quaHan` do SQL tính vì mốc 45 ngày theo giờ DB. */
export function lyDoRoi(
  d: Pick<DealChiTiet, "discountPct" | "medianPerm2"> & { propertyType?: string | null; rank?: HangGia | null },
  quaHan: boolean,
): string | null {
  // CG9: có hạng tính sẵn thì lý do đọc từ bảng — tin không chấm mang mã lý do, tin có số mà không nhãn nói vì sao.
  if (d.rank) {
    const r = d.rank;
    if (r.below === null) return chuLyDo(r.reason ?? "");
    if (quaHan) return `Tin quá ${NGAY_TOI_DA} ngày chưa thấy lại`;
    if (r.reason === "nhom-5-9") return chuLyDo(r.reason);
    if (r.below < 0) return `Đắt hơn trung vị nhóm ${soPct(r.below)}%, không phải căn giá tốt`;
    if (r.below < NGUONG_VAO_PCT) return `Thấp hơn trung vị ${soPct(r.below)}%, dưới ngưỡng ${NGUONG_VAO_PCT}%`;
    if (r.below > NGUONG_LOAI_PCT) return `Thấp hơn trung vị ${soPct(r.below)}%, trên ngưỡng ${NGUONG_LOAI_PCT}%`;
    if (!r.label) return "Không nằm trong 20% rẻ nhất của nhóm";
    return null;
  }
  // CG8: thước là phường × loại hình (v_ruler_p2), không lùi về thước cả phường (Hỏi-2) — nên tin chưa rõ loại hay phường
  // thiếu thước cùng loại không có số giảm, và lý do nói đúng vì sao. `propertyType` vắng (undefined) là nơi gọi không mang loại.
  if (d.propertyType !== undefined && d.medianPerm2 === null) {
    const nhan = loaiHinh(d.propertyType);
    return nhan ? `Phường chưa đủ tin ${nhan.toLowerCase()} để dựng thước` : "Chưa rõ loại hình — không so được với thước cùng loại";
  }
  if (d.discountPct === null || d.medianPerm2 === null) return "Không tính được mức giảm";
  if (quaHan) return `Tin quá ${NGAY_TOI_DA} ngày chưa thấy lại`;
  if (d.discountPct < 0) return `Đắt hơn thước phường ${soPct(d.discountPct)}%, không phải căn giá tốt`;
  if (d.discountPct < NGUONG_VAO_PCT) return `Giảm ${soPct(d.discountPct)}%, dưới ngưỡng ${NGUONG_VAO_PCT}%`;
  if (d.discountPct > NGUONG_LOAI_PCT) return `Giảm ${soPct(d.discountPct)}%, trên ngưỡng ${NGUONG_LOAI_PCT}%`;
  return null;
}

/**
 * Cụm thước trong câu cho người (CG8): «thước căn hộ cùng phường». Tin có số giảm luôn có loại đã biết; không có loại thì giữ
 * «thước phường» (chỉ còn ở dữ liệu thử cũ không mang loại).
 */
export function thuocCua(t: string | null | undefined): string {
  const nhan = loaiHinh(t ?? null);
  return nhan ? `thước ${nhan.toLowerCase()} cùng phường` : "thước phường";
}

/** Câu chứng minh của hạng giá (CG9): so với bao nhiêu căn, cùng nhóm nào, thấp hơn trung vị bao nhiêu, nhãn gì. */
export function cauHang(d: Pick<DealChiTiet, "propertyType"> & { rank?: HangGia | null }): string | null {
  const r = d.rank;
  if (!r || r.n === null || r.below === null) return null;
  const loai = loaiHinh(d.propertyType ?? null);
  const noi = r.level === "du_an" ? `cùng dự án ${r.nodeName?.trim() || "này"}` : "cùng phường";
  const nhom = `So với ${fmtInt(r.n)} căn ${noi}, cùng loại${loai ? ` (${loai.toLowerCase()})` : ""}${r.bedroomsGroup !== null ? `, cùng ${r.bedroomsGroup}PN` : ""}`;
  const theo = r.metric === "gia-thang-pn" ? ", theo giá thuê tháng" : "";
  if (r.below < 0) return `${nhom}${theo}: đắt hơn trung vị ${soPct(r.below)}%.`;
  const phan = [`${nhom}${theo}: thấp hơn trung vị ${soPct(r.below)}%`];
  if (r.label) phan.push(`nằm trong 20% rẻ nhất — ${NHAN_HANG[r.label] ?? r.label}`);
  if (r.needsVerification) phan.push(`rẻ quá ${NGHI_NGO_PCT}% nên mang nhãn «${CHU_CAN_XAC_MINH}»: gọi xác minh trước khi tin`);
  return `${phan.join(", ")}.`;
}

/** Dải m² suy ra (CG10): «≈ a–b m² · suy ra», a, b = p10, p90 làm tròn. */
export const chuDaiM2 = (d: { p10: number; p90: number }): string => `≈ ${Math.round(d.p10)}–${Math.round(d.p90)} m² · suy ra`;

/** Nhãn dòng thước trên trang: thước dự án khi nhóm so sánh là dự án (CG10), không thì thước phường. */
export const nhanThuoc = (d: Pick<DealChiTiet, "rank">): string => (d.rank?.level === "du_an" ? "Thước dự án" : "Thước phường");

/** Câu chứng minh: rẻ hơn thước bao nhiêu và đứng đâu so với ngưỡng. */
export function cauChungMinh(d: DealChiTiet): string | null {
  if (d.rank) return cauHang(d);
  if (!d.pricePerm2 || !d.medianPerm2 || d.discountPct === null) return null;
  // Trang một căn mở cả căn đã rời danh sách (Hỏi-1), nên câu phải đúng ngoài khoảng ngưỡng; số giảm âm là căn đắt hơn thước.
  const chenh = fmtInt(Math.abs(d.medianPerm2 - d.pricePerm2) / 1e6);
  const pct = soPct(d.discountPct);
  const thuoc = thuocCua(d.propertyType);
  if (d.discountPct < 0) return `Đắt hơn ${thuoc} ${chenh} tr/m², tức ${pct}%, nên không phải căn giá tốt.`;
  const re = `Rẻ hơn ${thuoc} ${chenh} tr/m², tức ${pct}%`;
  if (d.discountPct < NGUONG_VAO_PCT) return `${re}, chưa tới ngưỡng vào danh sách ${NGUONG_VAO_PCT}%.`;
  if (d.discountPct > NGUONG_LOAI_PCT) return `${re}, vượt ngưỡng loại ${NGUONG_LOAI_PCT}% nên đã rời danh sách.`;
  return d.discountPct > NGHI_NGO_PCT
    ? `${re}, vượt ngưỡng ${NGHI_NGO_PCT}% nên cần gọi xác minh trước khi tin.`
    : `${re}, trên ngưỡng vào danh sách ${NGUONG_VAO_PCT}% và chưa tới ngưỡng cần xác minh ${NGHI_NGO_PCT}%.`;
}

/** Mức giảm in trên tiêu đề, không ghép dấu trừ vào số âm: căn đắt hơn thước ghi dấu cộng. */
export const chuGiam = (pct: number): string => (pct < 0 ? `+${soPct(pct)}%` : `−${soPct(pct)}%`);

export type TabDeal = "du" | "xac-minh" | "thieu";
/** Mỗi căn đúng một tab: giảm trên ngưỡng là cần xác minh, còn lại thiếu mục là còn thiếu, còn lại đủ để gọi. */
export const tabCua = (d: Pick<DealHang, "suspect" | "thieu">): TabDeal => (d.suspect ? "xac-minh" : d.thieu.length > 0 ? "thieu" : "du");

export function loaiHinh(t: string | null): string | null {
  if (!t || t === "unknown") return null;
  return (LABELS_VI.property_type as Record<string, string>)[t] ?? null;
}

/** Tên căn: loại hình · m² · phòng ngủ · phường; thiếu mục nào bỏ mục đó. */
export function tenCan(d: DealChiTiet): string {
  return [
    loaiHinh(d.propertyType) ?? "Chưa rõ loại hình",
    d.areaM2 ? `${Math.round(d.areaM2)} m²` : null,
    d.bedrooms ? `${d.bedrooms}PN` : null,
    d.phuong,
  ].filter(Boolean).join(" · ");
}

/**
 * Căn còn thiếu gì. Chỉ nói ảnh, chữ bài khi vai được xem và đang ở máy thu, SĐT khi vai được xem: dữ liệu vắng vì
 * vai hay vì cloud không có nghĩa căn thiếu.
 */
export function thieuGi(d: DealChiTiet, vai: { xemNoiDung: boolean; mayThu: boolean }): string[] {
  const out: string[] = [];
  if (!loaiHinh(d.propertyType)) out.push("Chưa rõ loại hình");
  if (!d.areaM2) out.push("Chưa có diện tích");
  if (vai.xemNoiDung && !d.block && !d.street) out.push("Chỉ biết phường, chưa có toà hay đường");
  if (!d.medianPerm2) out.push("Chưa có thước phường");
  if (vai.xemNoiDung && vai.mayThu) {
    if (d.images.length === 0) out.push("Chưa có ảnh");
    if (!d.postTextFull) out.push("Chưa có chữ bài");
  }
  if (vai.xemNoiDung && !d.sellerPhone) out.push("Chưa có SĐT");
  return out;
}

/** Biên diện tích của «căn cùng tiêu chí»: ±25% quanh căn đang xem. */
export const BIEN_DIEN_TICH = 0.25;

/**
 * Căn cùng tiêu chí với căn đang xem, cùng thứ tự danh sách: căn cần xác minh đứng cuối, còn lại giảm nhiều trước. Mặc định cùng phường, cùng loại hình, diện tích ±25%;
 * `chiPhuong` nới về cùng phường. Không biết loại hình hay diện tích thì bỏ tiêu chí đó, và nói rõ trong `moTa`.
 */
export function canCungTieuChi<T extends DealChiTiet>(d: T, rows: T[], chiPhuong = false): { moTa: string[]; bo: string[]; can: T[] } {
  if (!d.phuong) return { moTa: ["Chưa gắn phường"], bo: [], can: [] };
  const loai = !chiPhuong ? loaiHinh(d.propertyType) : null;
  const dt = !chiPhuong && d.areaM2 ? ([d.areaM2 * (1 - BIEN_DIEN_TICH), d.areaM2 * (1 + BIEN_DIEN_TICH)] as const) : null;
  const can = rows
    .filter((r) => r.offerId !== d.offerId && r.phuong === d.phuong)
    .filter((r) => !loai || loaiHinh(r.propertyType) === loai)
    .filter((r) => !dt || (r.areaM2 !== null && r.areaM2 >= dt[0] && r.areaM2 <= dt[1]))
    .sort((a, b) => Number(a.suspect) - Number(b.suspect) || (b.discountPct ?? 0) - (a.discountPct ?? 0));
  const moTa = [d.phuong, loai, dt ? `${Math.round(dt[0])}–${Math.round(dt[1])} m²` : null].filter((x): x is string => Boolean(x));
  const bo = chiPhuong ? [] : [!loai ? "Chưa rõ loại hình nên không so loại hình" : null, !dt ? "Chưa có diện tích nên không so diện tích" : null].filter((x): x is string => Boolean(x));
  return { moTa, bo, can };
}

/** Nhãn số lần đăng trên thẻ — «mới» cũ thật ra nghĩa là «chưa đăng lại» (OPS-12). */
export function repostLabel(n: number | null | undefined): string {
  return `đăng ${n && n > 1 ? n : 1} lần`;
}
