// judge-entity.ts — phán quyết "cùng một căn nhà?" cho cặp tin (G-3 "Một Căn Nhà"; A2, PL25 judge-nguong-la-code)
// Kết luận do LUẬT trong code quyết (`apNguong`, ngưỡng khai một chỗ ở `NGUONG`); LLM chỉ viết lời giải thích cho
// người duyệt và không đổi được kết luận (L14: luật xác định không nằm trong prompt).
// Input: PairData pre-fetch (queryPair từ tools/native) — đưa thẳng vào prompt thay vì tool calling (Qwen 27B qua
// chat-compat không pass args tin cậy — phát hiện A2 eval 22/10).
// KHÔNG merge vật lý — chỉ ghi đề xuất vào hàng duyệt (scripts/judge-run.ts).
import type { AgentConfig } from "../runtime/loop.js";
import type { PairData } from "../tools/native.js";

/**
 * Ngưỡng ghép căn. Giá/m² giữ hai số của PL25. Diện tích (HD2, Mạnh chốt 31/10): so theo sai số làm tròn và cách đo, không
 * theo phần trăm — lệch không quá `dienTichLamTronM2` m² coi là bằng nhau (40,5 m² có thể ghi 40 hay 41); cặp có căn hộ
 * (tim tường hay thông thủy) chỉ khác khi lệch vượt cả số m² ấy lẫn `dienTichCanHoMax`.
 */
export const NGUONG = Object.freeze({ giaM2YesMax: 0.15, giaM2NoMin: 0.3, dienTichLamTronM2: 1, dienTichCanHoMax: 0.1 });
export const PHIEN_BAN_NGUONG = "pl25-2";

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
 *  và «Phương» cùng thành `phuong` — «Phương Liệt», «Phượng Dực» là tên phường thật. Phường số mang cấp và bỏ số 0
 *  đầu: «Phường 01», «P12», `phuong-12` → `p-12`, «Xã 12» → `x-12`, «12» trần → `12` (hồ sơ phuong-so). */
export function khoaPhuong(v: string): string {
  const s = v.normalize("NFC").trim().toLowerCase();
  const so = s.match(/^(?:(phường|phuong|p)|(xã|xa)|(thị trấn|thi[\s-]*tran))?[\s.-]*0*(\d+)$/u);
  if (so) return `${so[1] ? "p-" : so[2] ? "x-" : so[3] ? "tt-" : ""}${so[4]}`;
  return s
    .replace(/^(?:(?:phường|xã|thị trấn)(?:\s+|$)|p\.\s*)/u, "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Khoá rỗng (chỉ có tiền tố) → thiếu; còn lại cùng khoá → cùng phường, khác → khác phường. */
export function soPhuong(a: string | number | null, b: string | number | null): SoPhuong {
  if (a === null || b === null) return "thieu";
  const ka = khoaPhuong(String(a));
  const kb = khoaPhuong(String(b));
  if (ka === "" || kb === "") return "thieu";
  return ka === kb ? "khop" : "lech";
}

// ── Khoá đường / toà / tầng: chép NGUYÊN VĂN từ app/src/lib/ops/review-can-cu.ts, cùng lý do với khoá phường ở trên —
// «khớp / lệch / thiếu» của luật trùng nhãn bảng so người duyệt thấy. tests/judge-luat.test.ts (LT-AC-9) rút các hàm này
// từ tệp app và so từng ô với bản ở đây.
type So = SoPhuong;
/** Bỏ dấu, hoa và ký tự lạ: «Đinh Bộ Lĩnh» → `dinh bo linh`. */
export function boDau(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/đ/g, "d")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

/**
 * Các khoá có thể của tên đường. Tiền tố có dấu («Đường», «Phố», «Đ.», «D.») chắc là tiền tố: bỏ. Tiền tố không dấu
 * («duong», «pho») có thể là tên thật — «Duong Lam» là «Đường Lâm» hay «Dương Lâm» — nên giữ CẢ HAI cách đọc (HD2).
 * Trước đó bỏ phần chỉ vị trí (hồ sơ chuan-hoa-o-duong): cụm «Ngõ 254», «Hẻm 80/66», «Số 10 Ngõ 9» ở đầu chuỗi, rồi đuôi
 * địa chỉ sau dấu phẩy; số nhà trần («175 Lạc Long Quân») giữ hai cách đọc, trừ «3 Tháng 2» — số là một phần tên đường.
 * Ô chỉ có số hay chỉ có từ vị trí («Số 8», «Ngõ») không mang tên đường → không khoá nào. Dấu giữ tới lúc xuất khoá;
 * trước hai phép thử «từ vị trí trần» và «tháng <số>», dạng không dấu hay gõ sai dấu («Ngo», «Ngỏ», «30 thang 4») được đưa về
 * dạng có dấu, nên ra đúng như «Ngõ», «30 Tháng 4».
 */
export function khoaDuong(v: string): string[] {
  let t = v
    .normalize("NFC")
    .trim()
    .toLowerCase()
    .replace(/ð/g, "đ")
    .replace(/^(?:(?:số|so|ngõ|ngo|ngách|ngach|hẻm|hem|kiệt|kiet)\.?\s*\d[\p{L}\d/-]*(?:\s*,\s*|\s+|$))+/u, "")
    .replace(/,.*$/u, "")
    .trim()
    .replace(/(^|\s)thang(?=\s+\d)/gu, "$1tháng");
  if (/^(?:so|ngo|ngach|hem|kiet)$/.test(boDau(t))) t = "ngõ";
  if (/^(?:số|ngõ|ngách|hẻm|kiệt)?$/u.test(t)) return [];
  const soNha = t.match(/^\d[\p{L}\d/-]*\s+(.+)$/u);
  const cachDoc = soNha && !/^tháng\s+\d/u.test(soNha[1]) ? [soNha[1], t] : [t];
  const khoa = cachDoc.flatMap((s) => {
    const coDau = s.match(/^(?:(?:đường|phố)[\s-]+|[đd]\.\s*)(.*)$/u);
    if (coDau) return [boDau(coDau[1])];
    const khongDau = s.match(/^(?:duong|pho)[\s-]+(.*)$/u);
    return [khongDau ? boDau(khongDau[1]) : "", boDau(s)];
  });
  return [...new Set(khoa)].filter((k) => k && !/^\d+$/.test(k));
}

/** So hàng Đường: chung ít nhất một cách đọc → Khớp (chép từ app/src/lib/ops/review-can-cu.ts). */
export function soDuong(a: string | number | null, b: string | number | null): So {
  if (a === null || b === null) return "thieu";
  const ka = khoaDuong(String(a));
  const kb = khoaDuong(String(b));
  if (ka.length === 0 || kb.length === 0) return "thieu";
  return ka.some((k) => kb.includes(k)) ? "khop" : "lech";
}

/**
 * Khoá toà: bỏ MỘT tiền tố «Toà/Block/Tháp/Lô», rồi bỏ dấu, hoa, khoảng trắng — «Block A» = «Toà A» = «a». Chỉ MÃ
 * toà mới so được (một từ, có chữ số hoặc không quá ba ký tự: «A», «CT2», «S5.01»); tên gọi («Sao Biển», «Park 6»,
 * «Chung Cư 38 Hoàng mai») không so được với mã của cùng toà nên coi như thiếu (HD2).
 */
export function khoaToa(v: string): string | null {
  const s = v.normalize("NFC").trim().toLowerCase().replace(/^(?:toà|tòa|toa|block|tháp|thap|tower|lô|lo|building)\s+/u, "");
  if (/\s/.test(s)) return null;
  const k = boDau(s).replace(/ /g, "");
  return k && k.length <= 8 && (/\d/.test(k) || k.length <= 3) ? k : null;
}

/** So hàng Toà theo mã toà; tên gọi không phải mã → Thiếu (chép từ app/src/lib/ops/review-can-cu.ts). */
export function soToa(a: string | number | null, b: string | number | null): So {
  if (a === null || b === null) return "thieu";
  const ka = khoaToa(String(a));
  const kb = khoaToa(String(b));
  if (ka === null || kb === null) return "thieu";
  return ka === kb ? "khop" : "lech";
}

/** Khoá tầng: số đầu tiên — «Tầng 12» = «12»; chuỗi không có số («tầng cao») coi như thiếu. */
export function khoaTang(v: string): number | null {
  const m = v.match(/\d+/);
  return m ? Number(m[0]) : null;
}

/** So hàng Tầng theo số tầng (chép từ app/src/lib/ops/review-can-cu.ts). */
export function soTang(a: string | number | null, b: string | number | null): So {
  if (a === null || b === null) return "thieu";
  const ka = khoaTang(String(a));
  const kb = khoaTang(String(b));
  if (ka === null || kb === null) return "thieu";
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

/** Diện tích in trên thẻ, dấu phẩy thập phân: 40.5 → «40,5». */
const m2 = (v: number | null) => String(v).replace(".", ",");

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
  // Diện tích theo làm tròn + cách đo (HD2): |a − b| làm tròn 1e-9 (40,5 ↔ 41,5 đúng bằng 1 m²).
  const da = pair.a.areaM2 !== null && pair.b.areaM2 !== null && pair.a.areaM2 > 0 && pair.b.areaM2 > 0
    ? lamTron(Math.abs(pair.a.areaM2 - pair.b.areaM2)) : null;
  const canHo = la === "apartment" || lb === "apartment";
  const khacDienTich = da !== null && da > NGUONG.dienTichLamTronM2 && (!canHo || (ld !== null && ld > NGUONG.dienTichCanHoMax));
  const soDienTich = da === null ? undefined : `${m2(pair.a.areaM2)} ↔ ${m2(pair.b.areaM2)} m² · ${phanTram(ld ?? 0)}`;
  if (da === null) ly_do.push({ ma: "thieu_dien_tich", cau: "thiếu diện tích ở một tin" });
  else if (khacDienTich) ly_do.push({ ma: "khac_dien_tich", cau: "diện tích khác", so: soDienTich });
  else ly_do.push({ ma: "dien_tich_gan", cau: "diện tích khớp trong sai số", so: soDienTich });
  if (sp === "thieu") ly_do.push({ ma: "thieu_phuong", cau: "thiếu phường ở một tin" });
  else ly_do.push(khacPhuong ? { ma: "khac_phuong", cau: "khác phường" } : { ma: "cung_phuong", cau: "cùng phường" });
  if (la === null || lb === null) ly_do.push({ ma: "thieu_loai", cau: "thiếu loại hình ở một tin" });
  else ly_do.push(khacLoai ? { ma: "khac_loai", cau: "khác loại hình" } : { ma: "cung_loai", cau: "cùng loại hình" });

  // Luật loại trừ (HD2): đặc trưng có ở CẢ HAI tin mà khác thì «khác căn»; thiếu một bên bỏ qua, không suy.
  const dacTrung: [string, string, number | null, number | null][] = [
    ["pn", "phòng ngủ", pair.a.bedrooms, pair.b.bedrooms],
    ["wc", "WC", pair.a.bathrooms, pair.b.bathrooms],
  ];
  const dacTrungChu: [string, string, So, string | null, string | null][] = [
    ["duong", "đường", soDuong(pair.a.street, pair.b.street), pair.a.street, pair.b.street],
    ["toa", "toà", soToa(pair.a.block, pair.b.block), pair.a.block, pair.b.block],
    ["tang", "tầng", soTang(pair.a.floor, pair.b.floor), pair.a.floor, pair.b.floor],
  ];
  let khacDacTrung = khacDienTich;
  const khac = (ma: string, ten: string, ga: unknown, gb: unknown) => {
    khacDacTrung = true;
    ly_do.push({ ma: `khac_${ma}`, cau: `${ten} khác`, so: `${String(ga).trim()} ↔ ${String(gb).trim()}` });
  };
  for (const [ma, ten, ga, gb] of dacTrung) if (ga !== null && gb !== null && ga !== gb) khac(ma, ten, ga, gb);
  for (const [ma, ten, so, ga, gb] of dacTrungChu) if (so === "lech") khac(ma, ten, ga, gb);

  let same_house: KetLuan = "unsure";
  if (giaXa || khacPhuong || khacLoai || khacDacTrung) same_house = "no";
  else if (
    lg !== null && lg < NGUONG.giaM2YesMax &&
    da !== null &&
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
