// cham.ts — PL30: chấm bộ đọc gộp trên nhãn vàng. Hàm thuần. Chỉ tính ô giao model (ô người duyệt không chấm).
// Đúng = khớp nhãn vàng sau chuẩn hoá, kể cả cả hai cùng «không suy ra». Lời gọi lỗi hay JSON hỏng: ô của nó null, tính
// như máy để trống (đúng khi vàng cũng trống). Cách so lấy từ lượt đo 07/11 (agent/scripts/doc-gop-3-model-s03.ts).
import { createHash } from "node:crypto";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { FIELDS, type Field } from "./o.js";
import type { OGop } from "./doc.js";

const boDau = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/đ/g, "d").replace(/Đ/g, "D");
const SO = new Set<Field>(["area_m2", "price_min_vnd", "price_max_vnd", "bedrooms", "bathrooms"]);

export function veE164(v: string): string | null {
  const d = v.replace(/[^\d+]/g, "");
  const so = d.startsWith("+84") ? d.slice(3) : d.startsWith("84") && d.length === 11 ? d.slice(2) : d.startsWith("0") ? d.slice(1) : d;
  return /^[35789]\d{8}$/.test(so) ? `+84${so}` : null;
}

/** Chuẩn hoá một giá trị về dạng so: trống/«unknown» → null; số → chuỗi số; chữ → thường, NFC, gọn khoảng trắng. */
export function chuan(f: Field, v: unknown): string | null {
  if (v === null || v === undefined) return null;
  let s = String(v).normalize("NFC").trim().toLowerCase();
  if (!s || s === "null" || s === "unknown" || s === "không suy ra được") return null;
  if (f === "seller_phone") return veE164(s) ?? s;
  if (SO.has(f)) {
    const n = Number(s.replace(/,/g, "."));
    return Number.isFinite(n) ? String(n) : s;
  }
  if (f === "stack" || f === "floor") return /^\d+$/.test(s) ? String(Number(s)) : s.replace(/^0+(?=\d)/, "");
  if (f === "project" || f === "subzone") s = boDau(s).replace(/^the\s+/, "");
  if (f === "building") s = s.replace(/\s+/g, "");
  return s.replace(/\s+/g, " ");
}

export type KetQuaThe = { gop: Record<Field, OGop>; usd: number; ms: number; json_hong: number };
export type DongO = { dung: number; n: number; co_nhan: number; phu: number; thua: number };
export type BangCham = { o: Partial<Record<Field, DongO>>; dung: number; mau_so: number; so_the: number; json_hong: number; usd_the: number; giay_trung_vi: number };

/** Bảng ô × số đo. `vang`: item → ô → giá trị vàng (null = «không suy ra»); chỉ ô có dòng vàng mới tính. */
export function bangCham(items: number[], vang: Map<number, Map<Field, string | null>>, kq: Map<number, KetQuaThe>, giao: Field[]): BangCham {
  const o: Partial<Record<Field, DongO>> = {};
  let dung = 0, mau = 0, hong = 0, usd = 0;
  const ms: number[] = [];
  for (const id of items) {
    const k = kq.get(id);
    if (k) { usd += k.usd; hong += k.json_hong; ms.push(k.ms); }
    for (const f of FIELDS) {
      if (!giao.includes(f) || !vang.get(id)?.has(f)) continue;
      const g = chuan(f, vang.get(id)!.get(f));
      const x = k?.gop[f];
      const m = x && !("nguoi" in x) ? chuan(f, x.v) : null;
      const d = (o[f] ??= { dung: 0, n: 0, co_nhan: 0, phu: 0, thua: 0 });
      d.n++; mau++;
      if (g === m) { d.dung++; dung++; }
      if (g !== null) { d.co_nhan++; if (m !== null) d.phu++; } else if (m !== null) d.thua++;
    }
  }
  ms.sort((a, b) => a - b);
  return { o, dung, mau_so: mau, so_the: items.length, json_hong: hong, usd_the: items.length ? usd / items.length : 0, giay_trung_vi: ms.length ? ms[Math.floor(ms.length / 2)] / 1000 : 0 };
}

/** Băm mã bộ đọc + bộ chấm + lệnh: tóm tắt số thật chỉ còn giá trị khi băm này khớp mã hiện tại. */
export function maSha(): string {
  const dir = import.meta.dirname;
  const tep = readdirSync(dir).filter((f) => f.endsWith(".ts")).sort().map((f) => join(dir, f));
  tep.push(join(dir, "../../../scripts/doc-gop-s03.ts"));
  const h = createHash("sha256");
  for (const t of tep) h.update(readFileSync(t));
  return h.digest("hex");
}
