# s02-phien-qua-khung-ung-dung — kế hoạch (S2, T2)

Mạnh giao trực tiếp ngày 25/11: tìm cách thu S02 ổn định. Mã viết theo TDD trước, rồi hợp đồng và evals dựng lại từ
các tình huống đo được — ghi ở sổ quyết định. Sau đó một agent khác (không phải người viết) review mã; các lỗi nó
tìm ra được sửa trong phạm vi mười tiêu chí, cũng theo TDD.

| Việc | Tệp | Phục vụ | independent |
|---|---|---|---|
| 1. Bộ thu chờ token còn hạn, một cửa sổ cho cả lượt, làm mới trước khi gọi | tệp bộ thu S02 | AC-1 → AC-8 | — (đã làm) |
| 2. Lỗi xác thực dừng cả lượt (`LoiXacThuc`); sau 401 không gửi lại token bị từ chối | tệp bộ thu S02 | AC-6 | — (đã làm) |
| 3. Tách phép xếp đường và trình lấy token khỏi trình duyệt; tín hiệu «khung có nạp được không» | tệp bộ thu S02 | AC-4, AC-5, AC-6 | — (đã làm) |
| 4. Lệnh `login` (mỗi lệnh một nhánh đóng), `AIRDNA_PROFILE_DIR`, `AIRDNA_CHROME_BIN`; kiểu `Collector` nhận `login?` | tệp bộ thu S02 · `collector/src/core/types.ts` · `collector/src/cli.ts` | AC-9, AC-10 | — (đã làm) |
| 5. Test đơn vị: hàm thuần, `call()` với fetch nối vào được, trình lấy token với bước nạp giả, lệnh `login` đen-trắng qua CLI thật với Chrome giả | `collector/src/test/s02-phien-qua-khung-ung-dung.test.ts` | E13 | true |
| 6. Năm phép đo, mỗi phép có chiều đỏ trên bản đột biến | `probes/han-va-lam-moi.mjs` · `probes/loi-xac-thuc.mjs` · `probes/noi-day.sh` · `probes/lenh-login.sh` · `probes/vung.sh` | E1 → E12, E15 → E17 | true |
| 7. Chỉ dẫn cho agent: profile đổi chỗ được, lệnh `login`, route dữ liệu là phương án cuối | `collector/CLAUDE.md` · `collector/AGENTS.md` | AC-9, AC-10 | true |
| 8. Bước lấy token mở trình duyệt KHÔNG CỬA SỔ (sau lời giao claudedp-2511-50), giữ profile riêng của bộ thu | tệp bộ thu S02 · `probes/noi-day.sh` | AC-3, E10 | — (đã làm) |

Verify mỗi việc: chạy chính phép đo đó cả hai chiều (đã chạy lúc viết: xanh và đỏ đúng chỗ). Không còn mã nào phải viết.
