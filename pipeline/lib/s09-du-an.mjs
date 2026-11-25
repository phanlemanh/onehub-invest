// s09-du-an.mjs — DA31 toa-s09-hai-khu-vao-danh-ba: dòng stg_s09_item (097) từ item S09 khuôn API, gộp toà, cụm toà.
// Bộ nạp (làn thu, DAZ1) và phép đo dùng CHUNG hàm dongItemS09 + câu chèn dưới. Không đọc item.meta hay manifest notes
// (bản 13/11 có meta/notes bị sửa): khoá dự án là payload.chiTiet.data.id. Không chứa tên nguồn hay tên miền thật.
import { chuanHoaTenToa } from "./danh-ba-vat-the.mjs";

export const NGUON_S09 = "S09";

/** Câu chèn năm cột — nạp lại cùng snapshot ghi 0 dòng. */
export const CAU_CHEN_S09_ITEM =
  `INSERT INTO stg_s09_item (snapshot_id, source_id, kind, payload, fetched_at)
   VALUES ($1, $2, $3, $4, $5) ON CONFLICT (snapshot_id, source_id) DO NOTHING`;

/** Dự án S09 đã nối khu (thiết kế §4.3): id dự án phía nguồn → slug nút project. */
export const NOI_KHU_S09 = Object.freeze({
  "cf917354-48bf-11eb-b378-0242ac130002": "vinhomes-ocean-park-1",
  "e9932857-bf1d-e587-1674-464b129516ed": "vinhomes-grand-park",
});

const KIND = new Set(["danh-muc", "du-an"]);
const chuoi = (v) => (v === undefined || v === null || String(v).trim() === "" ? null : String(v).trim());

/**
 * Item → dòng năm cột; item hỏng bị bỏ và đếm theo lý do: thiếu sourceId, kind lạ, du-an không có chiTiet.data.id.
 * @returns {{ dong: {snapshot_id:string, source_id:string, kind:string, payload:object, fetched_at:string|null}[],
 *             bo: Record<'thieu-source-id'|'kind-la'|'chi-tiet-loi', number> }}
 */
export function dongItemS09(items, snapshotId) {
  const bo = { "thieu-source-id": 0, "kind-la": 0, "chi-tiet-loi": 0 };
  const dong = [];
  for (const it of items ?? []) {
    const sid = chuoi(it?.sourceId);
    if (!sid) { bo["thieu-source-id"]++; continue; }
    if (!KIND.has(it.kind)) { bo["kind-la"]++; continue; }
    if (it.kind === "du-an" && !chuoi(it.payload?.chiTiet?.data?.id)) { bo["chi-tiet-loi"]++; continue; }
    dong.push({ snapshot_id: snapshotId, source_id: sid, kind: it.kind, payload: it.payload ?? {}, fetched_at: it.fetchedAt ?? null });
  }
  return { dong, bo };
}

/**
 * Khoá tên toà S09: chuanHoaTenToa sau khi đổi khoảng trắng giữa hai chữ số thành dấu chấm («s1 01» → «S1.01»), để không
 * xoá dấu chấm (bỏ dấu chấm thì «S10.1» và «S1.01» trùng nhau).
 */
export const khoaTenS09 = (s) => chuanHoaTenToa(typeof s === "string" ? s.replace(/(\d)\s+(?=\d)/g, "$1.") : s);

/** Tên toà của một bản ghi: block_code, thiếu thì block_name. */
export const tenToaS09 = (b) => chuoi(b?.block_code) ?? chuoi(b?.block_name);

/**
 * Gộp bản ghi toà của một dự án theo tên chuẩn hoá. Cùng tên: giữ mọi block_id; phân khu, ngày bàn giao lấy từ bản có đủ.
 * Cùng tên mà hai phân khu khác nhau → ca mơ hồ, không gộp.
 * @param {{ insight_by_block?: object[] }} project — payload.chiTiet.data
 * @returns {{ toa: {ten:string, ten_chuan:string, block_ids:string[], sector_id:string|null, handover_date_from:string|null}[],
 *             mo_ho: {ten_chuan:string, sector_ids:string[], block_ids:string[]}[] }}
 */
export function toaS09(project) {
  const nhom = new Map();
  for (const b of Array.isArray(project?.insight_by_block) ? project.insight_by_block : []) {
    const ten = tenToaS09(b);
    const id = chuoi(b?.id);
    if (!ten || !id) continue;
    const k = khoaTenS09(ten);
    const g = nhom.get(k) ?? [];
    g.push({ ten, id, sector: chuoi(b.sector_uuid), ngay: chuoi(b.handover_date_from) });
    nhom.set(k, g);
  }
  const toa = [], mo_ho = [];
  for (const [k, g] of nhom) {
    const sectors = [...new Set(g.map((x) => x.sector).filter(Boolean))];
    const block_ids = g.map((x) => x.id);
    if (sectors.length > 1) { mo_ho.push({ ten_chuan: k, sector_ids: sectors, block_ids }); continue; }
    const du = g.find((x) => x.sector) ?? g[0];
    toa.push({
      ten: du.ten, ten_chuan: k, block_ids,
      sector_id: sectors[0] ?? null,
      handover_date_from: du.ngay ?? g.find((x) => x.ngay)?.ngay ?? null,
    });
  }
  return { toa, mo_ho };
}

const MAU_CUM = /^([A-Z]+[0-9]+)\.[0-9]+$/;

/** Tiền tố cụm của tên chuẩn hoá («S10.01» → «S10»), không khuôn → null. */
export const tienToCum = (tenChuan) => tenChuan?.match(MAU_CUM)?.[1] ?? null;

/**
 * Cụm toà (Hỏi-1): cùng tiền tố `<chữ><số>.<số>` từ hai toà trở lên, mọi toà cùng một phân khu (khác null).
 * @param {{ ten_chuan:string, sector_id:string|null }[]} toa
 * @returns {{ tien_to:string, sector_id:string, ten_chuan:string[] }[]}
 */
export function cumS09(toa) {
  const g = new Map();
  for (const t of toa) {
    const p = tienToCum(t.ten_chuan);
    if (!p) continue;
    const x = g.get(p) ?? [];
    x.push(t);
    g.set(p, x);
  }
  const ra = [];
  for (const [tien_to, ds] of g) {
    const sec = new Set(ds.map((t) => t.sector_id));
    if (ds.length < 2 || sec.size !== 1 || sec.has(null)) continue;
    ra.push({ tien_to, sector_id: ds[0].sector_id, ten_chuan: ds.map((t) => t.ten_chuan).sort() });
  }
  return ra.sort((a, b) => a.tien_to.localeCompare(b.tien_to));
}
