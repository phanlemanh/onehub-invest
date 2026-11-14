// s16-danh-muc.mjs — DA33 nap-s16-vao-danh-ba: dòng stg S16 (103) từ item snapshot S16, luật khoá căn, bảng nối dự án.
// Bộ nạp (làn thu, `pipeline/import-s16*`) và bước dựng dùng CHUNG các hàm + câu chèn dưới (thiết kế §3, §4).
// Mã đăng nhập (mã căn, khu_id, toa_id) chỉ ở local: các bảng 103 không lên cloud (thiết kế §6).
// Không chứa tên nguồn thật: dự án nhận diện bằng mã dự án của nguồn, bảng nối dùng phần đuôi sau tiền tố thương hiệu.
import { createHash } from "node:crypto";
import { chuanHoaTenToa } from "./danh-ba-vat-the.mjs";

export const NGUON_S16 = "S16";

/** 11 kind của ba bản thu 13–14/11 (thiết kế §2). */
export const KIND_S16 = new Set([
  "du-an", "phan-khu", "du-an-dang-ban", "mngt-khu", "mngt-toa", "mngt-can", "tin-niem-yet",
  "mngt-toa-khong-alias", "mngt-can-moi", "mngt-can-pha3", "mngt-toa-progress",
]);

/** Bảng nối (Hỏi-1, Mạnh duyệt 14/11): đuôi mã dự án S16 → slug nút dự án có sẵn. */
export const NOI_DU_AN_S16 = Object.freeze({
  "ocean-park": "vinhomes-ocean-park-1",
  "ocean-park-2": "vinhomes-ocean-park-2",
  "ocean-park-3": "vinhomes-ocean-park-3",
  "smart-city": "vinhomes-smart-city",
  "grand-park": "vinhomes-grand-park",
});

/** Đuôi mã dự án: bỏ đoạn chữ đầu (tiền tố thương hiệu) và gạch nối sau nó. */
export const duoiDuAn = (alias) => String(alias ?? "").replace(/^[a-z0-9]+-/i, "");

/** Khoá mã căn trong S16: trim + viết hoa. */
export const khoaMa = (ma) => String(ma ?? "").trim().toUpperCase();

/** Chỉ mục local của thẻ: không mang giá trị đăng nhập lên evidence (thiết kế §5.2). */
export const s16Ref = (...parts) =>
  createHash("sha256").update(["S16", ...parts].join("|")).digest("hex").slice(0, 16);

/** Bỏ host của URL tuyệt đối, giữ đường + truy vấn. */
export function boHost(url) {
  if (typeof url !== "string") return url ?? null;
  const m = /^[a-z][a-z0-9+.-]*:\/\/[^/?#]*(.*)$/i.exec(url);
  return m ? (m[1] || "/") : url;
}

/**
 * Toà của một mã căn khi mã nằm dưới nhiều tên toà (thiết kế §5.2): một tên → chọn; nhiều tên → đúng một tên chuẩn hoá
 * là tiền tố của mã chuẩn hoá thì chọn, còn lại mơ hồ (danh sách tên, đã sắp).
 * @returns {{toa: string} | {mo_ho: string[]}}
 */
export function chonToa(maCan, tenToas) {
  const ds = [...new Set((tenToas ?? []).filter((t) => typeof t === "string" && t.trim()))].sort();
  if (ds.length === 1) return { toa: ds[0] };
  const ma = chuanHoaTenToa(khoaMa(maCan));
  const khop = ds.filter((t) => { const k = chuanHoaTenToa(t); return k && ma.startsWith(k); });
  return khop.length === 1 ? { toa: khop[0] } : { mo_ho: ds };
}

const chuoi = (v) => (v === undefined || v === null || String(v).trim() === "" ? null : String(v).trim());
const so = (v) => (v === undefined || v === null || v === "" || !Number.isFinite(Number(v)) ? null : Math.trunc(Number(v)));

function docCsv(text, bo) {
  const dong = String(text ?? "").replace(/^﻿/, "").split(/\r?\n/).filter((l) => l.trim());
  if (!dong.length) return [];
  const dau = dong[0].split(",").map((s) => s.trim());
  const ra = [];
  for (const l of dong.slice(1)) {
    const c = l.split(",");
    if (c.length !== dau.length) { bo["csv-loi"]++; continue; }
    ra.push(Object.fromEntries(dau.map((k, i) => [k, c[i].trim()])));
  }
  return ra;
}

function docJsonl(text, bo) {
  const ra = [];
  for (const l of String(text ?? "").split(/\r?\n/)) {
    if (!l.trim()) continue;
    try { ra.push(JSON.parse(l)); } catch { bo["jsonl-loi"]++; }
  }
  return ra;
}

function boHostPayload(p) {
  if (!p || typeof p !== "object") return p ?? {};
  const q = { ...p };
  if (typeof q.url === "string") q.url = boHost(q.url);
  if (Array.isArray(q.items)) q.items = q.items.map((x) => (x && typeof x.url === "string" ? { ...x, url: boHost(x.url) } : x));
  return q;
}

/**
 * Item snapshot S16 → dòng bốn bảng 103. Item hỏng bị bỏ và đếm theo lý do; dòng trùng y hệt khoá chính chỉ ghi một lần.
 * @returns {{ item: object[], khu: object[], toa: object[], can: object[],
 *             bo: Record<'thieu-source-id'|'kind-la'|'csv-loi'|'jsonl-loi', number> }}
 */
export function dongS16(items, snapshotId) {
  const bo = { "thieu-source-id": 0, "kind-la": 0, "csv-loi": 0, "jsonl-loi": 0 };
  const item = [];
  const khu = new Map(), toa = new Map(), can = new Map();
  const ganKhu = (r) => { const k = `${r.du_an}|${r.khu_id}`; if (!khu.has(k)) khu.set(k, r); };
  const ganToa = (r) => { const k = `${r.du_an}|${r.toa_id}`; if (!toa.has(k)) toa.set(k, r); };
  const ganCan = (r) => {
    const k = `${r.du_an}|${r.khu_nhan}|${r.toa_ten}|${r.ma_can}`;
    if (!can.has(k)) can.set(k, r);
  };
  const ds = (items ?? []).filter((it) => {
    if (!chuoi(it?.sourceId)) { bo["thieu-source-id"]++; return false; }
    if (!KIND_S16.has(it.kind)) { bo["kind-la"]++; return false; }
    return true;
  });
  for (const it of ds) {
    item.push({ snapshot_id: snapshotId, source_id: chuoi(it.sourceId), kind: it.kind, payload: boHostPayload(it.payload), fetched_at: it.fetchedAt ?? null });
  }
  const theo = (k) => ds.filter((it) => it.kind === k);
  // Khu: csv pha 1, rồi khu của toà không mã khu (pha 2).
  const khuTheoAlias = new Map();
  for (const it of theo("mngt-khu")) for (const r of docCsv(it.payload?.csv, bo)) {
    const du_an = chuoi(r.du_an_alias), khu_id = chuoi(r.khu_id);
    if (!du_an || !khu_id) { bo["csv-loi"]++; continue; }
    ganKhu({ snapshot_id: snapshotId, du_an, du_an_ten: chuoi(r.du_an), khu_id, khu_ten: chuoi(r.khu_ten), khu_alias: chuoi(r.khu_alias), so_can: so(r.so_can) });
    if (chuoi(r.khu_alias)) khuTheoAlias.set(`${du_an}|${chuoi(r.khu_alias)}`, khu_id);
  }
  for (const it of theo("mngt-toa-khong-alias")) for (const [k, v] of Object.entries(it.payload?.toaKhongAlias ?? {})) {
    const [du_an, khu_id] = k.split("|").map(chuoi);
    if (!du_an || !khu_id) continue;
    ganKhu({ snapshot_id: snapshotId, du_an, du_an_ten: null, khu_id, khu_ten: chuoi(v?.khu?.name), khu_alias: null, so_can: so(v?.khu?.docCount) });
    for (const t of v?.toa ?? []) {
      if (!chuoi(t?.value)) continue;
      ganToa({ snapshot_id: snapshotId, du_an, khu_id, khu_nhan: khu_id, toa_id: chuoi(t.value), toa_ten: chuoi(t.name), so_can: so(t.docCount) });
    }
  }
  // Toà: csv pha 1.
  const toaTheoTen = new Map();
  for (const it of theo("mngt-toa")) for (const r of docCsv(it.payload?.csv, bo)) {
    const du_an = chuoi(r.du_an_alias), toa_id = chuoi(r.toa_id), khu_alias = chuoi(r.khu_alias);
    if (!du_an || !toa_id) { bo["csv-loi"]++; continue; }
    ganToa({ snapshot_id: snapshotId, du_an, khu_id: khuTheoAlias.get(`${du_an}|${khu_alias}`) ?? null, khu_nhan: khu_alias ?? "", toa_id, toa_ten: chuoi(r.toa_ten), so_can: so(r.so_can) });
    toaTheoTen.set(`${du_an}|${khu_alias}|${chuoi(r.toa_ten)}`, toa_id);
  }
  // Căn pha 1 (csv), pha 2, pha 3 (jsonl theo toà; khoá toà `<dự án>|<khu_id>|<toa_id>`).
  for (const it of theo("mngt-can")) for (const r of docCsv(it.payload?.csv, bo)) {
    const du_an = chuoi(r.du_an_alias), ma_can = chuoi(r.ma_can), khu_alias = chuoi(r.khu_alias), toa_ten = chuoi(r.toa_ten);
    if (!du_an || !ma_can) { bo["csv-loi"]++; continue; }
    ganCan({ snapshot_id: snapshotId, du_an, khu_nhan: khu_alias ?? "", toa_id: toaTheoTen.get(`${du_an}|${khu_alias}|${toa_ten}`) ?? null, toa_ten, tang: null, ma_can, pha: 1 });
  }
  const theoToa = (o, pha) => {
    const [du_an, khu_id, toa_id] = String(o?.toa ?? o?.key ?? "").split("|").map(chuoi);
    if (!du_an || !toa_id) { bo["jsonl-loi"]++; return; }
    ganToa({ snapshot_id: snapshotId, du_an, khu_id, khu_nhan: khu_id ?? "", toa_id, toa_ten: chuoi(o.toaTen), so_can: so(o.tongKhai ?? o.khai) });
    for (const c of Array.isArray(o.can) ? o.can : []) {
      const ma_can = chuoi(c?.ma_can);
      if (!ma_can) continue;
      ganCan({ snapshot_id: snapshotId, du_an, khu_nhan: khu_id ?? "", toa_id, toa_ten: chuoi(c.toa) ?? chuoi(o.toaTen), tang: chuoi(c.tang), ma_can, pha });
    }
  };
  for (const it of theo("mngt-can-moi")) for (const k of ["theoTang", "khongTang"]) for (const o of docJsonl(it.payload?.[k], bo)) theoToa(o, 2);
  for (const it of theo("mngt-can-pha3")) for (const o of docJsonl(it.payload?.jsonl, bo)) theoToa(o, 3);
  return { item, khu: [...khu.values()], toa: [...toa.values()], can: [...can.values()], bo };
}

/** Câu chèn — thứ tự tham số theo thứ tự cột của 103; nạp lại cùng snapshot ghi 0 dòng. */
export const CAU_CHEN_S16_ITEM =
  `INSERT INTO stg_s16_item (snapshot_id, source_id, kind, payload, fetched_at)
   VALUES ($1, $2, $3, $4, $5) ON CONFLICT DO NOTHING`;
export const CAU_CHEN_S16_KHU =
  `INSERT INTO stg_s16_khu (snapshot_id, du_an, du_an_ten, khu_id, khu_ten, khu_alias, so_can)
   VALUES ($1, $2, $3, $4, $5, $6, $7) ON CONFLICT DO NOTHING`;
export const CAU_CHEN_S16_TOA =
  `INSERT INTO stg_s16_toa (snapshot_id, du_an, khu_id, khu_nhan, toa_id, toa_ten, so_can)
   VALUES ($1, $2, $3, $4, $5, $6, $7) ON CONFLICT DO NOTHING`;
export const CAU_CHEN_S16_CAN =
  `INSERT INTO stg_s16_can (snapshot_id, du_an, khu_nhan, toa_id, toa_ten, tang, ma_can, pha)
   VALUES ($1, $2, $3, $4, $5, $6, $7, $8) ON CONFLICT DO NOTHING`;

/** Tham số theo câu chèn — để bộ nạp và itest không tự xếp cột. */
export const thamSo = {
  item: (r) => [r.snapshot_id, r.source_id, r.kind, r.payload, r.fetched_at],
  khu: (r) => [r.snapshot_id, r.du_an, r.du_an_ten, r.khu_id, r.khu_ten, r.khu_alias, r.so_can],
  toa: (r) => [r.snapshot_id, r.du_an, r.khu_id, r.khu_nhan, r.toa_id, r.toa_ten, r.so_can],
  can: (r) => [r.snapshot_id, r.du_an, r.khu_nhan, r.toa_id, r.toa_ten, r.tang, r.ma_can, r.pha],
};

/**
 * Ghi kết quả dongS16 vào DB bằng bốn câu chèn (một giao dịch do bên gọi mở). Trả số dòng ghi mới mỗi bảng.
 * @param {import("pg").Client} c
 */
export const LO_CAN = 5000;

export async function napS16(c, kq) {
  const ra = { item: 0, khu: 0, toa: 0, can: 0 };
  const cau = { item: CAU_CHEN_S16_ITEM, khu: CAU_CHEN_S16_KHU, toa: CAU_CHEN_S16_TOA, can: CAU_CHEN_S16_CAN };
  for (const b of ["item", "khu", "toa"]) {
    for (const r of kq[b]) ra[b] += (await c.query(cau[b], thamSo[b](r))).rowCount;
  }
  // Căn: theo lô (bản thu thật ~308 nghìn dòng); cùng ON CONFLICT như CAU_CHEN_S16_CAN.
  for (let i = 0; i < kq.can.length; i += LO_CAN) {
    const lo = kq.can.slice(i, i + LO_CAN);
    const cot = (k) => lo.map((r) => r[k]);
    ra.can += (await c.query(
      `INSERT INTO stg_s16_can (snapshot_id, du_an, khu_nhan, toa_id, toa_ten, tang, ma_can, pha)
       SELECT * FROM unnest($1::text[], $2::text[], $3::text[], $4::text[], $5::text[], $6::text[], $7::text[], $8::smallint[])
       ON CONFLICT DO NOTHING`,
      ["snapshot_id", "du_an", "khu_nhan", "toa_id", "toa_ten", "tang", "ma_can", "pha"].map(cot))).rowCount;
  }
  return ra;
}
