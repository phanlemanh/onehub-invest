# Kế hoạch thi công — gop-nut-trung-ma-can-s16 (DA53)

Hợp đồng: `_acceptance/gop-nut-trung-ma-can-s16/contract.md` (duyệt 21/11). Thiết kế: `docs/superpowers/specs/2026-11-21-gop-nut-trung-ma-can-s16-design.md`.
Các task nối tiếp nhau (cùng tệp), làm tuần tự.

| # | Việc | Tệp | AC |
|---|---|---|---|
| 1 | Hàm thuần `xetMaCan` (ranh giới tiền tố, đúng một ứng viên đủ tiền tố, ≥3 mã trùng) và nhánh mã căn trong `keHoachNoi` sau S09; trả `can_nguoi`; `cap` mang `can_cu` và số trùng / tiền tố / tổng; băm phủ cả ba danh sách | `pipeline/lib/s16-phan-khu.mjs` | AC-1, AC-2 |
| 2 | Thẻ nối in cột căn cứ, mục «Cần người chọn», lý do «dưới ngưỡng mã căn», không in mã thô | `pipeline/lib/s16-phan-khu.mjs` | AC-2 |
| 3 | `docMaCan(client)` đọc mã căn và tên toà theo khoá khu (snapshot mới nhất) chỉ trong bộ nhớ; `dungKeHoachNoi` truyền vào; `apNoi`/`daoNoi`/`kiemNoi` không đổi luật ghi | `pipeline/phan-khu-s16.mjs` | AC-1, AC-3..5 |
| 4 | Test DB thử GNT-1..7 (fixture cấy chín loại nút, chiều đỏ bằng biến thể hàm thuần) | `pipeline/scripts/phan-khu-s16-ma-can.itest.mjs` | AC-1..7 |
| 5 | Phép đo thật AC-8 trên bản chép DB máy thu (`db/db-thu.sh`), ghim sha PL20 e27d1e690 | `pipeline/scripts/phan-khu-s16-ma-can-that.mjs` | AC-8 |
| 6 | Chạy lại test DA46 (`phan-khu-s16-noi.itest.mjs`) và DA51 để chắc không vỡ | — | AC-5 |
