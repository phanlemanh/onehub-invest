import type { Collector, RawItem, CoverageReport } from "../core/types.js";

/**
 * MOCK collector — sinh tin rao BĐS giả lập theo format nhóm Zalo môi giới.
 * Mục đích (ROADMAP G1): build + test tính năng yield + parser transform-zalo
 * TRƯỚC khi join nhóm thật. Manifest ghi rõ source=zalo-mock → mọi tầng biết
 * đây là dữ liệu giả lập. Khi nhóm thật về: collector zalo-groups thay thế,
 * transform/UI không đổi.
 *
 * Thiết kế có chủ đích cho test:
 *  - ~20% repost trùng (test dedup)
 *  - ~25% tin thiếu giá hoặc diện tích (test confidence filtering)
 *  - giá gradient theo phường (Hoàn Kiếm đắt → ngoại thành rẻ)
 */
// Phường thật từ DB (sau G0-b point-in-polygon = 126 phường OSM 2025) —
// gradient theo vị trí: 1.0 = trung tâm, thấp dần ra ngoại thành
const PHUONG_GRADIENT: Record<string, number> = {
  "Hoàn Kiếm": 1.0, "Hàng Trống": 0.95, "Đống Đa": 0.85, "Ba Đình": 0.9,
  "Cầu Giấy": 0.78, "Nghĩa Đô": 0.75, "Tây Hồ": 0.88, "Quảng An": 0.85,
  "Xuân La": 0.8, "Bưởi": 0.82, "Yên Phụ": 0.84, "Thanh Xuân": 0.7,
  "Hạ Đình": 0.68, "Khương Trung": 0.66, "Hoàng Mai": 0.6, "Định Công": 0.58,
  "Mai Động": 0.6, "Long Biên": 0.55, "Ngọc Lâm": 0.52, "Gia Lâm": 0.45,
  "Thượng Thanh": 0.42, "Ngọc Thụy": 0.48, "Mỹ Đình": 0.65, "Dịch Vọng": 0.72,
  "Hà Đông": 0.55, "Văn Quán": 0.52, "Mỗ Lao": 0.55, "Vạn Phúc": 0.58,
  "Phú Diễn": 0.5, "Tây Mỗ": 0.48, "Đại Mỗ": 0.45, "Từ Liêm": 0.5,
  "Cổ Nhuế": 0.48, "Thượng Cát": 0.42, "Phúc Diễn": 0.5,
};

const BASE_SALE_PERM2 = 85_000_000; // VND/m² — Hoàn Kiếm ~85tr, gradient nhân vào
const BASE_RENT_LT = 12_000_000; // VND/tháng cho 1BR

const rnd = (min: number, max: number) => min + Math.random() * (max - min);
const pick = <T,>(arr: T[]) => arr[Math.floor(Math.random() * arr.length)];

// payload do chính collector này sinh ra — cast khi đọc lại từ RawItem
interface MockPost {
  text: string;
  group: string;
  author: string;
  images: string[];
}

/** Ground truth cho benchmark extraction — phản ánh những gì CÓ trong text
 *  (template thiếu tr/m² → pricePerm2Vnd null), không phải giá trị nguồn. */
interface GroundTruth {
  kind: "sale" | "rent_lt";
  priceVnd: number | null;
  pricePerm2Vnd: number | null;
  areaM2: number | null;
  bedrooms: number | null;
  phuong: string | null;
}

function salePost(idx: number): { text: string; gt: GroundTruth } {
  const phuong = pick(Object.keys(PHUONG_GRADIENT));
  const grade = PHUONG_GRADIENT[phuong];
  const area = Math.round(rnd(35, 120)); // m²
  const beds = Math.floor(rnd(1, 4));
  const perm2 = Math.round((BASE_SALE_PERM2 * grade * rnd(0.85, 1.2)) / 1e6); // tr/m²
  const total = Math.round((perm2 * area * 1e6) / 1e9 * 10) / 10; // tỷ
  const phone = `09${Math.floor(rnd(10000000, 99999999))}`;
  const templates = [
    `🔥 Bán CHCC ${beds}PN ${area}m² ${phuong}, ${perm2}tr/m², ${total}tỷ. Full nội thất, view hồ. LH ${phone}`,
    `Chính chủ bán căn góc ${beds}PN ${area}m2 mặt phố ${phuong}. Giá ${total} tỷ (${perm2}tr/m2). Miễn trung gian. ${phone}`,
    `Bán gấp ${phuong} — ${area}m², ${beds} phòng ngủ, ${perm2}tr/m2, tổng ${total}t. Tư vấn ${phone}`,
    `Cần tiền bán gấp CH ${phuong}, DT ${area}m2, ${beds}PN. Giá chỉ ${total} tỷ. A/C ${phone}`,
  ];
  const text = pick(templates);
  return {
    text,
    gt: {
      kind: "sale",
      priceVnd: Math.round(total * 1e9),
      pricePerm2Vnd: /\/m[²2]/.test(text) ? perm2 * 1e6 : null,
      areaM2: area,
      bedrooms: beds,
      phuong,
    },
  };
}

function rentLtPost(idx: number): { text: string; gt: GroundTruth } {
  const phuong = pick(Object.keys(PHUONG_GRADIENT));
  const grade = PHUONG_GRADIENT[phuong];
  const beds = Math.floor(rnd(1, 3));
  const rent = Math.round(BASE_RENT_LT * grade * beds * rnd(0.8, 1.3) / 1e6); // tr/tháng
  const area = Math.round(rnd(30, 90));
  const phone = `09${Math.floor(rnd(10000000, 99999999))}`;
  const templates = [
    `Cho thuê căn hộ ${beds}PN ${area}m² ${phuong}, ${rent}tr/tháng. Full nội thất, điều hoà. LH ${phone}`,
    `Thuê dài hạn: ${phuong}, ${area}m2, ${beds}PN. Giá ${rent} triệu/th. Đặt cọc 1. ${phone}`,
    `Cần cho thuê gấp ${phuong} — ${area}m² ${beds}PN, ${rent}tr. Vào ở ngay. ${phone}`,
  ];
  const text = pick(templates);
  return {
    text,
    gt: {
      kind: "rent_lt",
      priceVnd: rent * 1e6,
      pricePerm2Vnd: null,
      areaM2: area,
      bedrooms: beds,
      phuong,
    },
  };
}

export const zaloMock: Collector = {
  id: "zalo-mock",
  description: "MOCK tin rao Zalo — sinh giả lập để build yield feature (G1)",
  requestsPerSecond: 100, // không rate-limit — local generation
  async collect(ctx): Promise<{ items: RawItem[]; coverage: CoverageReport }> {
    const { city, log } = ctx;
    const N_SALE = 200;
    const N_RENT = 150;
    const groups = ["BĐS Hà Nội", "Chung cư Hà Nội", "Môi giới Miền Bắc"];
    const items: RawItem[] = [];

    const mkPost = (p: { text: string; gt: GroundTruth }, kind: string, idx: number): RawItem => ({
      source: "zalo-mock",
      sourceId: `mock-${kind}-${idx}-${Math.random().toString(36).slice(2, 8)}`,
      kind,
      fetchedAt: new Date().toISOString(),
      payload: {
        text: p.text,
        group: pick(groups),
        author: `author-${Math.floor(rnd(1, 30))}`,
        images: [],
      },
      meta: { city: city.id, mock: true, gt: p.gt },
    });

    // Tin bán
    for (let i = 0; i < N_SALE; i++) items.push(mkPost(salePost(i), "sale-post", i));
    // Tin thuê LT
    for (let i = 0; i < N_RENT; i++) items.push(mkPost(rentLtPost(i), "rent-lt-post", i));

    // ~20% repost (dedup test) — copy text + khác author
    const reposts = Math.floor((N_SALE + N_RENT) * 0.2);
    for (let i = 0; i < reposts; i++) {
      const src = items[Math.floor(Math.random() * items.length)];
      items.push({
        ...src,
        sourceId: `mock-repost-${i}-${Math.random().toString(36).slice(2, 8)}`,
        fetchedAt: new Date(Date.now() + rnd(0, 3 * 864e5)).toISOString(),
        payload: { ...(src.payload as MockPost), group: pick(groups), author: `author-${Math.floor(rnd(1, 30))}` },
        // deep-copy gt: strip text bản này không null gt của bản gốc (review I4)
        meta: { city: src.meta?.city ?? "hanoi", mock: true, gt: { ...(src.meta?.gt as GroundTruth) } },
      });
    }

    // ~25% tin thiếu trường (confidence test) — bỏ giá hoặc diện tích.
    // gt phản ánh text SAU khi strip: chỉ null field khi replace thật sự đổi
    // text (vd "…tr." của template thuê không khớp regex → giá còn → gt giữ).
    const broken = Math.floor((N_SALE + N_RENT) * 0.25);
    for (let i = 0; i < broken; i++) {
      const idx = Math.floor(Math.random() * items.length);
      const it = items[idx].payload as MockPost;
      const gt = items[idx].meta?.gt as GroundTruth | undefined;
      if (Math.random() > 0.5) {
        it.text = it.text.replace(/[\d.,]+\s*(tỷ|tr\/m[²2]|triệu\/th|tr\/tháng)/g, "giá tốt");
        if (gt) {
          // null theo CÒN LẠI trong text: template tr/m2 (ASCII) từng sót
          // perm2 khi chỉ strip được "tỷ" → gt sai lệch text (review I4)
          if (!/tr\/m[²2]/i.test(it.text)) gt.pricePerm2Vnd = null;
          if (!/\d[\d.,]*\s*(tỷ|triệu|tr)(?!\/m)/i.test(it.text)) gt.priceVnd = null;
        }
      } else {
        it.text = it.text.replace(/\d+\s*m[²2]/g, "DT đẹp");
        if (gt && !/m[²2]/i.test(it.text)) gt.areaM2 = null;
      }
    }

    log(`sinh ${items.length} tin giả lập (${N_SALE} bán + ${N_RENT} thuê LT + ${reposts} repost + ${broken} hỏng)`);
    return {
      items,
      coverage: {
        discovered: items.length,
        captured: items.length,
        failed: 0,
        methods: { mockGenerator: items.length },
        notes: [`MOCK DATA — không phải tin thật; ${reposts} repost test dedup; ${broken} tin thiếu trường test confidence`],
      },
    };
  },
};
