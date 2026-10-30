// judge-entity.ts — phán quyết "cùng một căn nhà?" cho cặp tin (G-3 "Một Căn Nhà"; A2, PL25 judge-nguong-la-code)
// Kết luận do LUẬT trong code quyết (`apNguong`, ngưỡng khai một chỗ ở `NGUONG`); LLM chỉ viết lời giải thích cho
// người duyệt và không đổi được kết luận (L14: luật xác định không nằm trong prompt).
// Input: PairData pre-fetch (queryPair từ tools/native) — đưa thẳng vào prompt thay vì tool calling (Qwen 27B qua
// chat-compat không pass args tin cậy — phát hiện A2 eval 22/10).
// KHÔNG merge vật lý — chỉ ghi đề xuất vào hàng duyệt (scripts/judge-run.ts).
import type { AgentConfig } from "../runtime/loop.js";
import type { PairData } from "../tools/native.js";

/** Ngưỡng ghép căn — giữ nguyên ba số của prompt cũ; chỉnh ngưỡng là việc của tập nhãn (PL8/PL9). */
export const NGUONG = Object.freeze({ giaM2YesMax: 0.15, dienTichYesMax: 0.1, giaM2NoMin: 0.3 });
export const PHIEN_BAN_NGUONG = "pl25-1";

export type KetLuan = "yes" | "no" | "unsure";
/** `cau` là lời định tính đưa vào prompt (không mang số đo — AC-2); `so` là số đo chỉ in trên thẻ cho người duyệt. */
export type LyDo = { ma: string; cau: string; so?: string };
export type KetQuaLuat = {
  same_house: KetLuan;
  ly_do: LyDo[];
  lech: { gia_m2: number | null; dien_tich: number | null };
};

/** Làm tròn độ lệch về 1e-9: bỏ sai số dấu phẩy động để lệch đúng bằng ngưỡng so ra như nhau ở mọi cặp số
 *  (19,8 vs 22 m² tính thô ra 0,09999999999999996 — S4 r3, AC-1). */
export const lamTron = (x: number) => Math.round(x * 1e9) / 1e9;

/** Độ lệch tương đối |x−y|/max(x,y) — cùng phép đo bộ lọc Stage B (pipeline/resolve-properties.mjs), đã làm tròn. */
export function lech(x: number | null, y: number | null): number | null {
  if (x === null || y === null || !Number.isFinite(x) || !Number.isFinite(y) || x <= 0 || y <= 0) return null;
  return lamTron(Math.abs(x - y) / Math.max(x, y));
}

/** Nhãn so hàng Phường — trùng nhãn Khớp / Lệch / Thiếu của thẻ duyệt `/ops/review`. */
export type SoPhuong = "khop" | "lech" | "thieu";

// ── Chép từ app/src/lib/ops/review-can-cu.ts (gói agent/ không nạp được tệp app: bí danh `@/` của Next). Luật ghép
// căn so phường bằng ĐÚNG khoá của thẻ duyệt, để «cùng / khác / thiếu phường» của luật trùng nhãn người duyệt thấy.
// tests/judge-nguong.test.ts (KP-AC-2) rút nguyên văn các hàm này từ tệp app và chạy cùng ma trận — lệch một ô là đỏ.
/** Khoá tên phường: bỏ MỘT tiền tố hành chính trên chuỗi còn dấu, rồi slug. Bỏ tiền tố trước khi bỏ dấu vì «Phường»
 *  và «Phương» cùng thành `phuong` — «Phương Liệt», «Phượng Dực» là tên phường thật. */
export function khoaPhuong(v: string): string {
  return v
    .normalize("NFC")
    .trim()
    .toLowerCase()
    .replace(/^(?:(?:phường|xã|thị trấn)(?:\s+|$)|p\.\s*)/u, "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Khoá rỗng (chỉ có tiền tố) → thiếu. Khoá chỉ số so như mọi khoá: «Phường 12» với «P.12» cùng khoá «12» nên cùng
 *  phường (hồ sơ khoa-phuong-chung-phuong-so). */
export function soPhuong(a: string | number | null, b: string | number | null): SoPhuong {
  if (a === null || b === null) return "thieu";
  const ka = khoaPhuong(String(a));
  const kb = khoaPhuong(String(b));
  if (ka === "" || kb === "") return "thieu";
  return ka === kb ? "khop" : "lech";
}

const loaiHinh = (s: string | null): string | null => {
  const t = (s ?? "").trim().toLowerCase();
  return t && t !== "unknown" ? t : null;
};
const giaM2 = (t: PairData["a"] | PairData["b"]): number | null =>
  t.pricePerm2 ?? (t.priceVnd !== null && t.areaM2 ? t.priceVnd / t.areaM2 : null);
/** Độ lệch thành phần trăm một chữ số thập phân, cắt xuống: 0,149 hiện «14,9%», không thành «15%». Chỉ dùng cho `so`
 *  trên thẻ — lệch đúng bằng ngưỡng vẫn in ra đúng số ngưỡng, nên số không bao giờ vào prompt (S4 r1–r2, AC-2). */
export const phanTram = (x: number) => `${(Math.floor(x * 1000 + 1e-6) / 10).toFixed(1).replace(".", ",")}%`;

/** Luật ghép căn — tất định, đối xứng A↔B. `lechFn`, `soPhuongFn` chỉ để test đối chứng. */
export function apNguong(pair: PairData, lechFn: typeof lech = lech, soPhuongFn: typeof soPhuong = soPhuong): KetQuaLuat {
  const lg = lechFn(giaM2(pair.a), giaM2(pair.b));
  const ld = lechFn(pair.a.areaM2, pair.b.areaM2);
  const sp = soPhuongFn(pair.a.phuong, pair.b.phuong);
  const la = loaiHinh(pair.a.propertyType);
  const lb = loaiHinh(pair.b.propertyType);
  const ly_do: LyDo[] = [];

  const giaXa = lg !== null && lg > NGUONG.giaM2NoMin;
  const khacPhuong = sp === "lech";
  const khacLoai = la !== null && lb !== null && la !== lb;
  if (lg === null) ly_do.push({ ma: "thieu_gia_m2", cau: "thiếu giá/m² ở một tin" });
  else if (giaXa) ly_do.push({ ma: "gia_m2_xa", cau: "giá/m² lệch xa", so: phanTram(lg) });
  else if (lg < NGUONG.giaM2YesMax) ly_do.push({ ma: "gia_m2_gan", cau: "giá/m² sát nhau", so: phanTram(lg) });
  else ly_do.push({ ma: "gia_m2_giua", cau: "giá/m² lệch vừa", so: phanTram(lg) });
  if (ld === null) ly_do.push({ ma: "thieu_dien_tich", cau: "thiếu diện tích ở một tin" });
  else if (ld < NGUONG.dienTichYesMax) ly_do.push({ ma: "dien_tich_gan", cau: "diện tích sát nhau", so: phanTram(ld) });
  else ly_do.push({ ma: "dien_tich_xa", cau: "diện tích lệch đáng kể", so: phanTram(ld) });
  if (sp === "thieu") ly_do.push({ ma: "thieu_phuong", cau: "thiếu phường ở một tin" });
  else ly_do.push(khacPhuong ? { ma: "khac_phuong", cau: "khác phường" } : { ma: "cung_phuong", cau: "cùng phường" });
  if (la === null || lb === null) ly_do.push({ ma: "thieu_loai", cau: "thiếu loại hình ở một tin" });
  else ly_do.push(khacLoai ? { ma: "khac_loai", cau: "khác loại hình" } : { ma: "cung_loai", cau: "cùng loại hình" });

  let same_house: KetLuan = "unsure";
  if (giaXa || khacPhuong || khacLoai) same_house = "no";
  else if (
    lg !== null && lg < NGUONG.giaM2YesMax &&
    ld !== null && ld < NGUONG.dienTichYesMax &&
    sp === "khop" &&
    la !== null && la === lb
  ) same_house = "yes";
  return { same_house, ly_do, lech: { gia_m2: lg, dien_tich: ld } };
}

const NHAN: Record<KetLuan, string> = { yes: "cùng một căn", no: "khác căn", unsure: "chưa chắc" };

/** Lý do luật thành một câu cho người duyệt, kèm số đo (thẻ, không vào prompt). */
export function lyDoChu(kq: KetQuaLuat): string {
  return `Luật: ${NHAN[kq.same_house]} — ${kq.ly_do.map((l) => (l.so ? `${l.cau} (${l.so})` : l.cau)).join("; ")}`;
}

export const judgeEntityAgent: AgentConfig = {
  name: "judge-entity",
  model: "qwen27b",
  systemPrompt: `Bạn hỗ trợ người duyệt bất động sản Việt Nam.
Máy đã kết luận theo luật cố định rằng hai tin đăng có phải CÙNG MỘT CĂN NHÀ hay không, kèm các lý do đo được.
Nhiệm vụ của bạn: viết từ một đến ba câu tiếng Việt giải thích kết luận ấy cho người duyệt, dựa trên dữ liệu và lý do được đưa.
Không được đổi kết luận, không tự đặt ra quy tắc hay mốc so sánh nào.

QUAN TRỌNG: Chỉ trả JSON thuần: {"giai_thich":"..."}`,
  tools: {},
  budget: 1, // 1 call — không cần loop
};

const tien = (v: number | null) => (v ? (v / 1e9).toFixed(2) + " tỷ" : "N/A");
const trieu = (v: number | null) => (v ? (v / 1e6).toFixed(1) + " tr" : "N/A");

export function buildJudgeInput(pair: PairData, kq: KetQuaLuat): string {
  return `So sánh 2 tin đăng:

TIN A (${pair.a.source} — ${pair.a.kind}):
- Giá: ${tien(pair.a.priceVnd)}
- Diện tích: ${pair.a.areaM2 ?? "N/A"} m²
- Giá/m²: ${trieu(pair.a.pricePerm2)}
- Phường: ${pair.a.phuong ?? "N/A"}
- Loại: ${pair.a.propertyType ?? "unknown"}
- Nội dung: ${(pair.a.text ?? "").slice(0, 200)}

TIN B (${pair.b.source} — ${pair.b.kind}):
- Giá: ${tien(pair.b.priceVnd)}
- Diện tích: ${pair.b.areaM2 ?? "N/A"} m²
- Giá/m²: ${trieu(pair.b.pricePerm2)}
- Phường: ${pair.b.phuong ?? "N/A"}
- Loại: ${pair.b.propertyType ?? "unknown"}
- Tiêu đề: ${(pair.b.subject ?? "").slice(0, 200)}

KẾT LUẬN CỦA MÁY: ${kq.same_house} (${NHAN[kq.same_house]})
LÝ DO:
${kq.ly_do.map((l) => `- ${l.cau}`).join("\n")}`;
}

/** Chỉ rút lời giải thích; mọi khoá khác của model (kể cả same_house) bị bỏ. */
export function parseGiaiThich(output: string): string | null {
  const m = output.match(/\{[\s\S]*\}/);
  if (!m) return null;
  try {
    const g = (JSON.parse(m[0]) as { giai_thich?: unknown }).giai_thich;
    return typeof g === "string" && g.trim() ? g.trim().slice(0, 500) : null;
  } catch {
    return null;
  }
}
