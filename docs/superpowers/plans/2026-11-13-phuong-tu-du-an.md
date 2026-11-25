# DA9 phuong-tu-du-an Implementation Plan

**Goal:** phường suy ra từ dự án một phường thành phát biểu `area_id` trên bài, và vào cột tin khi tin đang tới tỉnh hay trống.

**Spec:** `docs/superpowers/specs/2026-11-13-phuong-tu-du-an-design.md` · hợp đồng `_acceptance/phuong-tu-du-an/` (Cổng Phạm vi
13/11, Hỏi-1: migration 099).

## Global Constraints

- Migration 099 (GS cấp); áp máy thu/cloud chỉ sau gộp và lời riêng của Mạnh.
- 099 theo khuôn 068: đọc định nghĩa đang chạy, chèn cạnh mốc, thiếu mốc → `MOC-099`, áp lại được.
- Luật `phuong-tu-du-an`, `inferred` · `registry_inherit`; lý do rút `xet-lai-du-an`; nhãn `field_provenance.area_id.nguon = 'du-an'`, `goc`.
- Mã trường/lớp/phương pháp qua `vocab.generated.mjs`; DB thử nhân bản DB mẫu `oneinvest_dbv_ptd_*`; ca DB bỏ khi thiếu DATABASE_URL.
- Không sửa `transform-zalo` (writeOffers đã phân xử sau ghi).

## Review Focus

- Tin gỡ dự án mà transform không chạy lại: cột phải về giá trị gốc.
- Hai bài của một tin kế thừa hai phường khác nhau.
- Phát biểu `project_node_id` đã rút không được tính.
- 099 áp sau một migration khác đã thay thân hàm (mốc vẫn còn / mất).
- `reassign-areas` đặt NULL rồi phân xử lại.

### Task 1: bộ ghi phát biểu kế thừa (independent: true)

Files: `pipeline/lib/phuong-tu-du-an.mjs` (`tinhPhuong({duAn, nut}) → {dong, dem}`, `docDuLieu(client)`),
`pipeline/scripts/phuong-tu-du-an.mjs` (`chay(client, {ghi, json})`: chạy thử mặc định; `--ghi` một giao dịch: rút phần thừa của
luật, chèn, `resolveOffers` cho tin bị chạm; thoát 2 khi thiếu 096/099). Phục vụ E1, E2, E4, E8.

### Task 2: migration 099 (independent: true)

File: `db/migrations/099_phuong_tu_du_an.sql`. (a) Chèn cạnh hai mốc `offer_status` của `resolve_offer_fields` để giữ khoá
`area_id` mang `nguon = 'du-an'` qua lượt dựng lại; (b) `CREATE OR REPLACE FUNCTION resolve_offer_area_du_an(text[]) RETURNS integer`
theo luật §2 của thiết kế (giá trị gốc G, đúng một phường kế thừa sống, gỡ nhãn khi hết); (c) chèn lời gọi hàm (b) ngay sau
`SELECT … INTO n_offers, n_changed`. Phục vụ E3, E5, E6, E7.

### Task 3: test `pipeline/scripts/phuong-tu-du-an.test.mjs` (independent: false — sau Task 1, 2)

Ca PTD-AC-1…8 trên DB thử dựng từ migration của nhánh (gồm 099), phát biểu kế thừa sinh bằng bộ ghi thật; chiều đỏ bằng bản
chép tạm lib/lệnh và bản 099 đột biến (`thay` của `taoDbThu`); AC-5 chạy chuỗi bước ghi S03 → phân xử → `reassign-areas` → phân xử.
Verify: ca riêng xanh, mỗi đột biến làm đúng ca đỏ với thông điệp ghim; `vocab-lint` xanh. Bộ đầy đủ để dành lượt chấm.
