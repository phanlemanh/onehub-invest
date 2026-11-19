// mask-source-names.mjs — che tên nguồn thật (tầng A, ADR-0007) trong chữ chạy (dòng log cuối của job) bằng mã S0x.
// ON7 `ops-nhan-ma-nguon`. Danh sách tên là [{ code, realName }] đọc từ source_registry local; danh sách rỗng
// (DB không tới được) → trả null — đóng chặt, không trả chuỗi gốc. Bản chép cho app: app/src/lib/mask-source-names.ts
// (app không được import pipeline) — bảng ca pipeline/scripts/mask-source-names.cases.json giữ hai bản khớp nhau.

/** Gập từng đơn vị mã về chữ thường không dấu, GIỮ độ dài để vị trí khớp trên bản gập trùng vị trí bản gốc. */
export function fold(s) {
  let out = "";
  for (const ch of s) {
    let b = ch === "đ" || ch === "Đ" ? "d" : ch.normalize("NFD").charAt(0).toLowerCase();
    if (b.length !== ch.length) b = ch.length === 1 ? b.charAt(0) : ch; // giữ độ dài (ký tự ngoài BMP để nguyên)
    out += b;
  }
  return out;
}

/** Các biến thể đã gập của một tên: tên đủ, từ đầu (khi tên nhiều từ và từ đầu ≥ 4 ký tự), và bản viết liền.
 *  `wholeOnly` (cờ source_registry.match_whole, migration 112): chỉ tên đủ và bản viết liền — không lấy từ đầu. Vắng = false. */
export function nameVariants(realName, { wholeOnly = false } = {}) {
  const full = fold(realName.trim());
  const words = full.split(/[\s.\-_/]+/).filter(Boolean);
  const out = new Set([full, words.join("")]);
  if (!wholeOnly && words.length > 1 && words[0].length >= 4) out.add(words[0]);
  return [...out].filter((v) => v.length >= 3);
}

/** Dòng khớp nguyên cụm, tên nhiều từ: các từ nối bằng dãy dấu phân tách bất kỳ («ten-hai», «ten_hai», «ten  hai», đường dẫn URL). */
function cumTach(realName, wholeOnly) {
  if (!wholeOnly) return null;
  const words = fold(realName.trim()).split(/[\s.\-_/]+/).filter(Boolean);
  if (words.length < 2) return null;
  return new RegExp(words.map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, (m) => `\\${m}`)).join("[\\s.\\-_/]+"), "gu");
}

const isWordChar = (c) => c !== undefined && /[\p{L}\p{N}]/u.test(c);

/** Mọi chỗ khớp tên trong text: [{ code, start, end }] trên bản gập, ưu tiên khớp dài hơn. Biến thể ≥ 4 ký tự khớp ở
 *  mọi chỗ (tên dính hậu tố như mã kênh, khoá nguồn); biến thể ngắn hơn phải đứng riêng một từ (không trúng giữa từ). */
export function findSourceNames(text, entries) {
  const f = fold(text);
  const cands = entries.flatMap(({ code, realName, wholeOnly }) => nameVariants(realName, { wholeOnly }).map((v) => ({ code, v })));
  cands.sort((a, b) => b.v.length - a.v.length);
  const hits = [];
  const taken = new Uint8Array(f.length);
  for (const { code, realName, wholeOnly } of entries) {
    const re = cumTach(realName, wholeOnly);
    if (!re) continue;
    for (const m of f.matchAll(re)) {
      const end = m.index + m[0].length;
      if (taken.subarray(m.index, end).some(Boolean)) continue;
      hits.push({ code, start: m.index, end });
      taken.fill(1, m.index, end);
    }
  }
  for (const { code, v } of cands) {
    let i = f.indexOf(v);
    while (i !== -1) {
      const end = i + v.length;
      const bounded = v.length >= 4 || (!isWordChar(f[i - 1]) && !isWordChar(f[end]));
      if (bounded && !taken.subarray(i, end).some(Boolean)) {
        hits.push({ code, start: i, end });
        taken.fill(1, i, end);
      }
      i = f.indexOf(v, i + 1);
    }
  }
  return hits.sort((a, b) => a.start - b.start);
}

/** Thay mỗi tên thật trong text bằng mã S0x. Danh sách tên rỗng → null (đóng chặt). text null → null. */
export function maskSourceNames(text, entries) {
  if (text == null || !entries || entries.length === 0) return null;
  let out = "";
  let at = 0;
  for (const h of findSourceNames(text, entries)) {
    out += text.slice(at, h.start) + h.code;
    at = h.end;
  }
  return out + text.slice(at);
}
