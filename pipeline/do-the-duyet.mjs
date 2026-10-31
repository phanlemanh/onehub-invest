#!/usr/bin/env node
// do-the-duyet.mjs — HD11 `do-the-duyet-du-du-lieu`: đo độ đủ dữ liệu của thẻ ghép căn đang chờ duyệt (audit
// docs/research/audit-hang-duyet-3010.md §0 H1, H3–H5, H7; §5.1).
//   node pipeline/do-the-duyet.mjs           in bảng số
//   node pipeline/do-the-duyet.mjs --write   ghi dq_check_results, một dòng mỗi (kiểm, đối tượng) mỗi ngày giờ máy thu
// Đọc trong giao dịch chỉ đọc. Ghi: một giao dịch xoá dòng hôm nay của bốn kiểm rồi chèn. Chỉ số đếm lên
// dq_check_results (bảng lên cloud) — không offer_id, không chữ tin, không URL. Dòng `fail` không đổi mã thoát.
import { realpathSync } from "node:fs";
import { fileURLToPath } from "node:url";

export const MUI_GIO = "Asia/Ho_Chi_Minh";
export const LOAI_THE = "entity_match";
export const BEN = Object.freeze(["offer_a", "offer_b"]);
export const KIEM = Object.freeze({
  roiKho: "the-duyet:roi-kho",
  anhOps: "the-duyet:anh-ops",
  anhAdmin: "the-duyet:anh-admin",
  doDay: "the-duyet:do-day",
});

/** 10 trường của bảng so trên thẻ + người đăng (Hỏi-2); khoá detail → hàm «có giá trị». */
const coChu = (v) => typeof v === "string" ? v.trim() !== "" : v !== null && v !== undefined;
export const TRUONG = Object.freeze({
  gia: (t) => coChu(t.price_vnd),
  dt: (t) => coChu(t.area_m2),
  gia_m2: (t) => coChu(t.price_perm2),
  phuong: (t) => coChu(t.area_id),
  loai: (t) => coChu(t.property_type) && t.property_type !== "unknown",
  pn: (t) => coChu(t.bedrooms),
  wc: (t) => coChu(t.bathrooms),
  duong: (t) => coChu(t.street_raw),
  toa: (t) => coChu(t.block_raw),
  tang: (t) => coChu(t.floor_raw),
  nguoi_dang: (t) => coChu(t.seller_phone_hash) || coChu(t.seller_name),
});

// Luật ảnh chép đúng bộ đọc của app (app/src/lib/ops/review-media.ts + zalo-media.ts): vai Vận hành thấy ảnh đã tải
// (`local_file` = `<snapshot>/media/<tệp>` hợp khuôn); quản trị viên thấy thêm URL gốc http(s) và image_url của thẻ.
const SNAPSHOT_ID = /^[A-Za-z0-9][A-Za-z0-9_.:-]*$/;
const MEDIA_FILE = /^media\/[A-Za-z0-9][A-Za-z0-9_.-]*$/;
export function anhDaTai(localFile) {
  if (typeof localFile !== "string" || !localFile) return false;
  const cut = localFile.indexOf("/");
  if (cut <= 0) return false;
  const snap = localFile.slice(0, cut);
  const file = localFile.slice(cut + 1);
  return SNAPSHOT_ID.test(snap) && !snap.includes("..") && MEDIA_FILE.test(file) && !file.includes("..");
}
export function urlXemDuoc(url) {
  if (typeof url !== "string") return false;
  try {
    const u = new URL(url);
    return u.protocol === "https:" || u.protocol === "http:";
  } catch {
    return false;
  }
}

/** Hai bên của một thẻ entity_match: `{ offerId, imageUrl }`; bên thiếu offer_id bị bỏ (như sidesOf của app). */
export function benCuaThe(evidence) {
  const ev = evidence && typeof evidence === "object" ? evidence : {};
  return BEN.flatMap((k) => {
    const o = ev[k] && typeof ev[k] === "object" ? ev[k] : {};
    return typeof o.offer_id === "string" ? [{ offerId: o.offer_id, imageUrl: o.image_url }] : [];
  });
}

/**
 * Bốn kiểm — hàm thuần. Đầu vào:
 * - `the`: dòng review_queue `{ item_type, status, evidence }` (lọc thẻ entity_match đang chờ ở đây);
 * - `tin`: Map offer_id → dòng sale_offers (source + các cột của TRUONG);
 * - `media`: Map offer_id → dòng media `{ media_url, local_file }`.
 */
export function tinhSo({ the, tin, media }) {
  const cho = the.filter((t) => t.item_type === LOAI_THE && t.status === "pending");
  const dem = { roiKho: { so: 0, ben: 0 }, anhOps: { so: 0, ben: 0 }, anhAdmin: { so: 0, ben: 0 } };
  const benSong = new Map(); // nguồn → Set offer_id còn sống (Hỏi-2: bên rời kho không vào mẫu số độ đầy)
  for (const t of cho) {
    const loi = { roiKho: 0, anhOps: 0, anhAdmin: 0 };
    for (const b of benCuaThe(t.evidence)) {
      const dong = media.get(b.offerId) ?? [];
      const ops = dong.some((m) => anhDaTai(m.local_file));
      const admin = ops || dong.some((m) => urlXemDuoc(m.media_url)) || urlXemDuoc(b.imageUrl);
      const song = tin.get(b.offerId);
      if (!song) loi.roiKho++;
      else {
        if (!benSong.has(song.source)) benSong.set(song.source, new Set());
        benSong.get(song.source).add(b.offerId);
      }
      if (!ops) loi.anhOps++;
      if (!admin) loi.anhAdmin++;
    }
    for (const k of Object.keys(loi)) {
      dem[k].ben += loi[k];
      if (loi[k] > 0) dem[k].so++;
    }
  }
  const doDay = {};
  for (const nguon of [...benSong.keys()].sort()) {
    const ids = benSong.get(nguon);
    const o = { tong: ids.size };
    for (const [k, co] of Object.entries(TRUONG)) o[k] = [...ids].filter((id) => co(tin.get(id))).length;
    doDay[nguon] = o;
  }
  return { tong: cho.length, ...dem, doDay };
}

/** Ba kiểm đầu đạt khi bằng 0; độ đầy chỉ báo, luôn đạt (Hỏi-1). */
export function veDong(kq) {
  const dong = [];
  for (const k of ["roiKho", "anhOps", "anhAdmin"]) {
    const { so, ben } = kq[k];
    dong.push({
      check_name: KIEM[k], entity: LOAI_THE, status: so === 0 ? "pass" : "fail",
      detail: `tong=${kq.tong} so=${so} ben=${ben}`,
    });
  }
  for (const [nguon, o] of Object.entries(kq.doDay)) {
    dong.push({
      check_name: KIEM.doDay, entity: nguon, status: "pass",
      detail: Object.entries(o).map(([k, v]) => `${k}=${v}`).join(" "),
    });
  }
  return dong;
}

/** Đọc mọi thứ tinhSo cần, trong một giao dịch chỉ đọc. */
export async function docDuLieu(client) {
  await client.query("BEGIN TRANSACTION READ ONLY");
  try {
    const { rows: the } = await client.query(
      `SELECT item_type, status, evidence FROM review_queue WHERE item_type = $1 AND status = 'pending'`, [LOAI_THE]);
    const ids = [...new Set(the.flatMap((t) => benCuaThe(t.evidence).map((b) => b.offerId)))];
    const { rows: tinRows } = await client.query(
      `SELECT offer_id, source, price_vnd, area_m2, price_perm2, area_id, property_type, bedrooms, bathrooms,
              street_raw, block_raw, floor_raw, seller_phone_hash, seller_name
       FROM sale_offers WHERE offer_id = ANY ($1::text[])`, [ids]);
    const { rows: mediaRows } = await client.query(
      `SELECT resource_record_key AS offer_id, media_url, local_file FROM media WHERE resource_record_key = ANY ($1::text[])`,
      [ids]);
    await client.query("COMMIT");
    const media = new Map();
    for (const m of mediaRows) media.set(m.offer_id, [...(media.get(m.offer_id) ?? []), m]);
    return { the, tin: new Map(tinRows.map((t) => [t.offer_id, t])), media };
  } catch (e) {
    await client.query("ROLLBACK").catch(() => {});
    throw e;
  }
}

/** Ghi theo ngày giờ máy thu: xoá dòng hôm nay của bốn kiểm (cả nguồn không còn bên nào) rồi chèn — một giao dịch. */
export async function ghi(client, dong) {
  await client.query("BEGIN");
  try {
    await client.query(
      `DELETE FROM dq_check_results WHERE check_name = ANY ($1::text[])
         AND (checked_at AT TIME ZONE '${MUI_GIO}')::date = (now() AT TIME ZONE '${MUI_GIO}')::date`,
      [Object.values(KIEM)]);
    for (const d of dong) {
      await client.query(
        `INSERT INTO dq_check_results (check_name, entity, status, detail) VALUES ($1, $2, $3, $4)`,
        [d.check_name, d.entity, d.status, d.detail]);
    }
    await client.query("COMMIT");
    return dong.length;
  } catch (e) {
    await client.query("ROLLBACK").catch(() => {});
    throw e;
  }
}

async function main() {
  const args = process.argv.slice(2);
  for (const a of args) if (a !== "--write") throw new Error(`do-the-duyet: cờ lạ «${a}» — chỉ nhận --write`);
  const { default: pg } = await import("pg");
  const client = new pg.Client({
    connectionString: process.env.DATABASE_URL ?? "postgres://oneinvest:oneinvest@localhost:5433/oneinvest",
  });
  await client.connect();
  try {
    const dong = veDong(tinhSo(await docDuLieu(client)));
    for (const d of dong) console.log(`${d.check_name} ${d.entity} ${d.status} ${d.detail}`);
    if (args.includes("--write")) console.log(`do-the-duyet: đã ghi ${await ghi(client, dong)} dòng dq_check_results`);
  } finally {
    await client.end();
  }
}

const isMain = process.argv[1] && realpathSync(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  main().catch((e) => {
    console.error(e.message ?? e);
    process.exit(1);
  });
}
