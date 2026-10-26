// import-s08-row.mjs — mapping pure item S08 (inventory_unit) → dòng
// stg_s08_inventory. Tách khỏi import-airbnb.mjs để test không cần DB
// (2410-12). Item state=detail là metadata dự án → null (bỏ).
// 2610-10 vòng 2 (BÁO 2610-17): nguồn DUY NHẤT của cả bộ đổi số —
// import-airbnb gọi s08RowOf, không tự dựng tham số nữa.
export function s08Num(v) {
  if (v === null || v === undefined || v === "") return null;
  const n = Number(String(v).replace(",", "."));
  return Number.isFinite(n) ? n : null;
}
export function s08Int(v) {
  const n = s08Num(v);
  return n === null ? null : Math.round(n);
}
export function s08RowOf(it, snapshotId) {
  const st = it.meta?.state;
  if (st !== "notSold" && st !== "sold") return null; // detail + lạ → bỏ
  const p = it.payload ?? {};
  return {
    source_id: it.sourceId,
    snapshot_id: snapshotId,
    project_id: String(it.meta?.projectId ?? ""),
    project_type: it.meta?.projectType ?? null,
    state: st,
    product_code: it.meta?.productCode ?? "",
    row_code: p.row_code ?? null,
    subdivision_name: p.subdivision_name ?? null,
    apartment_type_name: p.apartment_type_name ?? null,
    land_area: s08Num(p.land_area),
    construction_area: s08Num(p.construction_area),
    base_direction_name: p.base_direction_name ?? null,
    number_of_room: s08Int(p.number_of_room),
    number_of_wc: s08Int(p.number_of_wc),
    apartment_price: s08Num(p.apartment_price),
    early_payment_price: s08Num(p.early_payment_price),
    state_line: p.state_line ?? null,
    delivery_standard_name: p.delivery_standard_name ?? null,
    fund_groups_sell_code: p.fund_groups_sell_code ?? null,
    payload: JSON.parse(JSON.stringify(p)),
    fetched_at: it.fetchedAt,
  };
}
