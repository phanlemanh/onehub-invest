// s08-du-an.mjs — DA30: dựng dòng stg_s08_project (094) từ item cấp dự án của snapshot S08.
// Bộ nạp (làn ZCode) và itest dùng CHUNG hàm này + câu chèn dưới, để chọn payload và khoá ghép không lệch giữa phép đo và bộ nạp.

/** Câu chèn năm cột của lời GIAO — nạp lại cùng snapshot ghi 0 dòng. */
export const CAU_CHEN_S08_PROJECT =
  `INSERT INTO stg_s08_project (snapshot_id, project_id, catalog_payload, detail_payload, fetched_at)
   VALUES ($1, $2, $3, $4, $5) ON CONFLICT (snapshot_id, project_id) DO NOTHING`;

const khoa = (it) => {
  const v = it?.meta?.projectId ?? it?.payload?.project_id;
  return v === undefined || v === null || String(v).trim() === "" ? null : String(v).trim();
};

/**
 * Gom item `project_catalog` và `inventory_unit` state `detail` theo mã dự án; mỗi dự án có catalog → một dòng.
 * Item detail không có catalog cùng mã thì bỏ (catalog_payload NOT NULL).
 * @returns {{snapshot_id:string, project_id:string, catalog_payload:object, detail_payload:object|null, fetched_at:string|null}[]}
 */
export function dongDuAnS08(items, snapshotId) {
  const cat = new Map(), det = new Map();
  for (const it of items ?? []) {
    const k = khoa(it);
    if (k === null) continue;
    if (it.kind === "project_catalog") { if (!cat.has(k)) cat.set(k, it); }
    else if (it.kind === "inventory_unit" && it.meta?.state === "detail") { if (!det.has(k)) det.set(k, it); }
  }
  return [...cat].map(([k, c]) => ({
    snapshot_id: snapshotId,
    project_id: k,
    catalog_payload: c.payload,
    detail_payload: det.get(k)?.payload ?? null,
    fetched_at: c.fetchedAt ?? null,
  }));
}

const MAU_DIEM = /!2d(-?[0-9]{1,3}\.[0-9]+)!3d(-?[0-9]{1,2}\.[0-9]+)/;

/** Thước độc lập cho point_lng/point_lat: cặp !2d…!3d… đầu tiên của khung bản đồ, cùng mẫu với 094. */
export function bocDiem(iframe) {
  if (typeof iframe !== "string") return null;
  const m = iframe.match(MAU_DIEM);
  return m ? { lng: Number(m[1]), lat: Number(m[2]) } : null;
}
