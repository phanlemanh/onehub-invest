# DA31 toa-s09-hai-khu-vao-danh-ba — kế hoạch thi công

> Cách chạy: Native (vòng chính, T2). Kế hoạch theo thiết kế `docs/superpowers/specs/2026-11-13-toa-s09-hai-khu-vao-danh-ba-design.md`
> và hợp đồng `_acceptance/toa-s09-hai-khu-vao-danh-ba/contract.md` (Hỏi-1 trong hàng, Hỏi-2 đủ 115, Hỏi-3 đúc thẳng `mot_loi_khai`, AC-4 lối A).

**Mục tiêu:** phân khu, cụm và toà S09 của OP1, GP vào danh bạ DB1; toà khớp S08 thành bí danh, không sinh toà trùng.

**Kiến trúc:** staging `stg_s09_item` (097) giữ item nguyên văn; view đọc toà/phân khu; lõi thuần `pipeline/lib/s09-du-an.mjs`;
bước S09 trong giao dịch dựng của `pipeline/danh-ba-vat-the.mjs`, sau bước S08.

## Ràng buộc chung

- Không gọi S09; không đọc `item.meta`/`notes`; không tên nguồn/tên miền thật trong mã, test, hồ sơ.
- 082 chỉ thêm: toà S08 giữ `region_node_id`; nút vùng hiệu lực qua view `v_toa_nut_vung`.
- Không đổi `collector/`, `snapshots/`, `sync-cloud`, `app/`, bộ nạp `import-s09*`.
- Khoá dự án = `payload.chiTiet.data.id`; tên toà = `block_code` (thiếu thì `block_name`), so bằng `chuanHoaTenToa`.

## Điểm soi

1. Toà một tên hai `block_id`, một bản không phân khu (OS2) → một toà, hai bí danh `ma_nguon`, nút vùng theo bản có phân khu.
2. Phân khu trùng tên nút có sẵn khác loại (`The Beverly` id 23 là `building`) → dùng lại, gắn `meta.s09_sector_ids`.
3. Cụm (`S10.0x`) là cháu của khu → đếm khu theo toà (`SQL_KHU_CUA_TOA`) phải leo hai bậc.
4. Chạy lại: tra `ma_nguon` S09 trước, nút theo `meta`, thẻ duyệt không nhân (mọi trạng thái).
5. DB chưa áp 097 / khu không có dòng S09 → bỏ qua có lý do, bước S08 y cũ.

## Nhiệm vụ

### T1 — 097 + lõi nạp (E1, E9 phần 097)
- `db/migrations/097_stg_s09_item.sql`: bảng `stg_s09_item` (khoá `(snapshot_id, source_id)`, FK `airbnb_snapshots`, cột sinh
  `project_id`, `detail_ok`), view `v_s09_du_an_moi`, `v_s09_toa`, `v_s09_phan_khu`, `v_toa_nut_vung`. Idempotent.
- `pipeline/lib/s09-du-an.mjs`: `dongItemS09(items, snapshotId) → { dong, bo: { 'thieu-source-id', 'kind-la', 'chi-tiet-loi' } }`,
  `CAU_CHEN_S09_ITEM`, `NOI_KHU_S09` (id dự án S09 → slug khu).
- Kiểm: áp 097 hai lần trên DB thử.

### T2 — gộp toà, cụm (E2)
- `toaS09(project) → { toa: [{ ten, ten_chuan, block_ids, sector_id, handover_date_from }], mo_ho: [...] }`;
  `cumS09(toa) → [{ tien_to, sector_id, ten_chuan[] }]` (tiền tố `<chữ><số>.<số>`, từ hai toà, cùng một phân khu).
- Test `pipeline/lib/s09-du-an.test.mjs`: ma trận bốn ô AC-2 + ma trận cụm. Kiểm: `node --test pipeline/lib/s09-du-an.test.mjs`.

### T3 — bước S09 trong dựng (E3, E4, E5, E8, E10)
- `pipeline/lib/danh-ba-s09.mjs` `buocS09(c, { khu, isoKhu, noi, log })` gọi trong `dung()` sau bước S08, cùng giao dịch;
  `dung()` nhận `noiS09` (mặc định `NOI_KHU_S09`), tổng kết thêm khoá `s09`.
- `SQL_KHU_CUA_TOA` leo tới ông (cụm → phân khu → khu).
- Itest `pipeline/scripts/danh-ba-s09.itest.mjs` (DB thử `oneinvest_dbv_s09_<pid>` qua `db-thu-dbv.mjs`), ca DA31-AC-1,3,4,5,8,10.

### T4 — dữ liệu thật, ranh giới (E6, E7, E9)
- `pipeline/scripts/danh-ba-s09-that.mjs`: chép DB máy thu sang DB thử (pg_dump | psql trong container), nạp bản thu API,
  đếm đối chứng trên hai bản tay bằng mã riêng, dựng, in bảng trước/sau, thước đếm bài S03 độc lập; xoá DB thử.
- `pipeline/scripts/s09-ranh-gioi.mjs --base origin/main`: vùng, tên nguồn (danh sách từ `source_registry` máy thu), 097 hai lần.
