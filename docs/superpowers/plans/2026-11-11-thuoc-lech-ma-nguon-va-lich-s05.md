# Thước lệch mã nguồn và lịch S05 — kế hoạch thi công

**Spec:** `docs/superpowers/specs/2026-11-11-thuoc-lech-ma-nguon-va-lich-s05-design.md` · hợp đồng
`_acceptance/thuoc-lech-ma-nguon-va-lich-s05/contract.md` (Mạnh duyệt 11/11).

Bốn task tuần tự, làm trong cùng nhánh (đều nhỏ, không chia song song).

### Task 1 — kiểm mã nguồn của báo cáo ngày (E1, E2) · independent: true
- Sửa `scripts/bao-cao-ngay.test.mjs`: hàm thuần `chiMaNguon(ds)` trả danh sách phần tử không khớp `^S\d{2}\/`.
- Ca thuần «TL-AC-1 hàm kiểm mã nguồn hai chiều».
- Ca DB dùng `chiMaNguon` với thông điệp «độ tươi chỉ mang mã nguồn Sxx».
  - In «TL-AC-2 độ tươi mã từ S10: n».
  - Đòi n > 0 khi `source_registry` active có mã từ S10.
  - Chiều đỏ tiêm `chotot/x`.
- Verify: `node --test scripts/bao-cao-ngay.test.mjs`.

### Task 2 — thước lịch S05 mới (E3, E4) · independent: true
- `_acceptance/thuoc-lech-ma-nguon-va-lich-s05/probes/lich-s05.mjs`: chép kiểm của probe cũ, thay kiểm `^4 day` bằng hai
  kiểm quan hệ.
- Hàm `soNgay(s)` quy đổi days, hours, weeks.
- `--tu-kiem` chạy hai đột biến và hai đối chứng dương.
- Verify: chạy probe, rồi chạy `--tu-kiem`.

### Task 3 — con trỏ E11, E12 (E5) · independent: false (sau task 2, vì AC-3 phải có)
- `_acceptance/khoa-nap-s05-paused/evals.yaml`: E11, E12 thêm `status: not-run` và
  `superseded_by: thuoc-lech-ma-nguon-va-lich-s05#AC-3`.
- `probes/thay-e11-e12.mjs`:
  - đọc bằng `lib/eval-yaml.cjs`;
  - bốn bản chép hỏng;
  - gọi `chungThayBoi` của kit, đòi `ho-so-thay-chua-ky` hoặc `ok`;
  - bản chép hợp đồng bỏ thẻ thì đòi `thay-khong-nhan`.

### Task 4 — quét mã báo cáo (E6) · independent: true
- `probes/ma-bao-cao.mjs`: ma trận năm hình thái, quét ba tệp, tự kiểm năm bản chép.
