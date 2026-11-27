# s02-map-listings-trang-ke — kế hoạch (S2, T2)

Hàng này phát hiện trong lượt chạy thật 26/11/2026 của bộ thu S02 đi cửa API, tách ra nhánh riêng để thử nghiệm giữ
sạch một thay đổi. Mạnh «Đồng ý» (26/11 22:37) với chuỗi hồ sơ T2 → PR → gộp qua cổng Claude → build lại collector.
Mã viết theo TDD (ca đỏ trước); đặt trên đỉnh nhánh `zcode/s02-cua-api`.

| Việc | Tệp | Phục vụ | independent |
|---|---|---|---|
| 1. `call()` không gửi hậu tố `@<số>` của tên trang lên nguồn; `sourceId`, `apiPath`, `payload.url` giữ đúng vai | tệp bộ thu S02 (xuất `docExpAppToken`) | AC-1, AC-2 | — (đã làm) |
| 2. Hai ca kiểm: tên trang có hậu tố · tên trang không có hậu tố | `collector/src/test/s02-bo-thu-cua-api.test.ts` | E1, E2, E4 | true |
| 3. Hai phép đo, mỗi phép có chiều đỏ trên bản đột biến hoặc tệp cấy | `probes/chay-test-dot-bien.mjs` · `probes/vung.sh` | E1 → E3 | true |

Verify mỗi việc: chạy chính phép đo đó cả hai chiều (đã chạy lúc viết: xanh, và cả bốn bản đột biến bị bắt). Không
còn mã nào phải viết.
