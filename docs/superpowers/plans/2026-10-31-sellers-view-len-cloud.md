# Kế hoạch thi công — sellers-view-len-cloud

Hồ sơ: `_acceptance/sellers-view-len-cloud/` (T3, Cổng 1 duyệt 31/10) · design:
`docs/superpowers/specs/2026-10-31-sellers-view-len-cloud-design.md`.

Ba task, làm tuần tự trong một worktree (task 3 đọc export của task 1). Không chạm Supabase; DB thử chỉ qua
`_acceptance/sdt-luu-goc-e164/probes/db-thu-chac.sh` (tên `oneinvest_p4_svc`, xoá khi xong).

| Người dùng thấy gì khác | Đụng đâu | Phục vụ tiêu chí |
|---|---|---|
| Lượt đồng bộ đêm dừng có tên, trước khi gửi dòng nào, khi bảng đích trên cloud không phải bảng thường | `pipeline/sync-cloud.mjs` (pha catalog) | AC-1 (chốt kiểu bảng) |
| Mọi khoá người bán trên cloud được thay trong cùng một lượt | `pipeline/sync-cloud.mjs` (hàm kiểm) + test | AC-8 (khoá trong FILL) |
| Người áp cloud có tệp hướng dẫn riêng của 060, đo trước phân biệt đúng/sai | `docs/ops/cloud-schema-catchup-2026-10-31-060.sql` | AC-4 (tệp catch-up) |
| Có bằng chứng trên bản chép đóng vai cloud cho cả đường chặn lẫn lượt tráo thật | `_acceptance/sellers-view-len-cloud/probes/` | AC-2, AC-3, AC-7, AC-6 |

## Task 1 — chốt kiểu bảng + kiểm khoá người bán (`pipeline/sync-cloud.mjs`, `pipeline/sync-cloud.test.mjs`)

TDD: viết test đỏ trước, rồi code.

1. Export `KIEU_DICH_CHO_QUA = ["r", "p"]`, `kieuBangSql(names)` (câu `SELECT c.relname AS t, c.relkind::text AS kind FROM
   pg_class c JOIN pg_namespace n … WHERE n.nspname='public' AND c.relname = ANY(…)`) và hàm thuần
   `dichKhongPhaiBang(rows)` → danh sách tên có `kind` ngoài tập cho qua (theo thứ tự rows).
2. Export `CATCHUP_060 = "docs/ops/cloud-schema-catchup-2026-10-31-060.sql"` và `loiDichKhongPhaiBang(bad, rows)` → chuỗi
   «bảng đích cloud không phải bảng thường: sellers (view) — cloud giữ bảng, xem <CATCHUP_060>».
3. Trong `syncOnce` pha 1 (catalog), ngay sau kiểm `sync_stage`, TRƯỚC câu đọc cột: chạy `kieuBangSql(cloudNames)`; có tên
   bị chặn → `throw new Error(loiDichKhongPhaiBang(...))` (pha catalog bọc sẵn thành PhaseError). Bảng vắng khỏi kết quả
   không xử ở đây — câu «cloud thiếu bảng» có sẵn vẫn bắt.
4. Export `khoaNguoiBanNgoaiFill(allow = CLOUD_ALLOW, fill = FILL)` → mọi `bảng.cột` có cột khớp `/phone_hash$/` mà bảng
   không thuộc FILL.
5. Test (thêm vào `sync-cloud.test.mjs`):
   - E1 ma trận: r qua, p qua, v chặn, m chặn, f chặn (số assert = số ô); thông điệp chứa tên bảng + tên tệp catch-up.
   - E1 đường thật: `syncOnce` với `exec` giả trả relkind `v` cho `sellers` → lỗi pha catalog, 0 lời gọi chứa
     `INSERT INTO sync_stage.rows`; `exec` giả thiếu một bảng FILL → «cloud thiếu bảng».
   - E1 đối chứng đỏ: bản chép tập cho qua thêm `v` → ô view không chặn → bắt «DICH LA VIEW».
   - E8: ≥ 3 cột khoá (`sale_offers.seller_phone_hash`, `sellers.phone_hash`, `properties.seller_phone_hash`), 0 cột ngoài
     FILL; đối chứng: CLOUD_ALLOW chép thêm bảng ngoài FILL có `seller_phone_hash` → «KHOA MO COI».

## Task 2 — tệp catch-up cloud 060 (`docs/ops/cloud-schema-catchup-2026-10-31-060.sql`)

Khuôn như tệp 050: đầu tệp ghi «CHƯA ÁP», người chạy, vì sao không chạy 060 trên Supabase.
- ĐO TRƯỚC (chỉ đọc) một câu `SELECT` trả một dòng `kiem` gọi tên chỗ lệch: `sellers` là bảng (`relkind` r/p), đủ cột
  `CLOUD_ALLOW.sellers`, không có `registry_aliases`; kỳ vọng ghi trong chú thích: `OK`.
- `-- ÁP` rỗng có chủ ý: chú thích nói khoá đổi qua lượt sync (Hỏi-1 đã duyệt và đã xảy ra 31/10, sổ hồ sơ), không DDL.

## Task 3 — probe (`_acceptance/sellers-view-len-cloud/probes/`)

- `cloud-gia.sh [doc]`: dựng DB thử bằng `db-thu-chac.sh oneinvest_p4_svc`, chạy `cloud-gia.mjs`, luôn xoá DB thử.
- `cloud-gia.mjs`: E2 (view chặn · dựng lại bảng từ DDL 022 → [] trên MỌI bảng FILL · chèn tráo vào view lỗi), E7 (đọc view
  bằng `localReadSql`, nạp `sync_stage` theo 038, `buildSwapSql` thật cho `sellers` trong giao dịch → đủ dòng, khoá duy
  nhất; đối chứng trùng khoá → «TRAO TRUNG KHOA»), E3 (đối số `doc`: cột đọc = `CLOUD_ALLOW.sellers`, số dòng = view;
  đối chứng bỏ `name` khỏi PII_EXCLUDE → «NAME LEN CLOUD»). Mọi thứ ghi trong `BEGIN … ROLLBACK`.
- `catchup.sh`: E4 — tách hai khối, quét khối ÁP không DDL/không câu nào của 060; chạy ĐO TRƯỚC trên ba trạng thái dựng
  trong giao dịch (tốt · `sellers` là view · có `registry_aliases`) → `OK` / gọi tên `sellers` / gọi tên `registry_aliases`;
  đối chứng chèn `CREATE OR REPLACE VIEW sellers` vào khối ÁP bản chép → «AP CO DDL SELLERS».
- `pham-vi.sh`: E6 — tệp đổi so merge-base trong vùng; probe không chứa supabase/SUPABASE_/mgmtExec/DB `oneinvest`
  trần; đối chứng → «NGOAI PHAM VI», «CHAM CLOUD».

## Kiểm cuối

`node --test pipeline/sync-cloud.test.mjs pipeline/scripts/sync-cloud-pii.test.mjs pipeline/scripts/soat-tang-a.test.mjs`,
ba probe, `/verify` module pipeline. Khoá config `svc_*` chờ P4-122 trước S4.
