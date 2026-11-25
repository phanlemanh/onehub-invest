# s02-phien-qua-khung-ung-dung — kế hoạch (S2, T2)

Mạnh giao trực tiếp ngày 25/11: tìm cách thu S02 ổn định. Mã viết theo TDD trước (sáu vòng, 22 test mới), rồi hợp
đồng và evals dựng lại từ các tình huống đo được — ghi ở sổ quyết định.

| Việc | Tệp | Phục vụ | independent |
|---|---|---|---|
| 1. Bộ thu chờ token còn hạn, một cửa sổ cho cả lượt, làm mới trước khi gọi | tệp bộ thu S02 | AC-1 → AC-8 | — (đã làm) |
| 2. Lỗi xác thực dừng cả lượt (`LoiXacThuc`) | tệp bộ thu S02 | AC-6 | — (đã làm) |
| 3. Lệnh `login` và `AIRDNA_PROFILE_DIR`; kiểu `Collector` nhận `login?`; CLI điều hướng | tệp bộ thu S02 · `collector/src/core/types.ts` · `collector/src/cli.ts` | AC-9, AC-10 | — (đã làm) |
| 4. Test đơn vị cho hàm thuần và `call()` (fetch nối vào được) | `collector/src/test/s02-phien-qua-khung-ung-dung.test.ts` | E13 | true |
| 5. Bốn phép đo, mỗi phép có chiều đỏ trên bản đột biến | `probes/han-va-lam-moi.mjs` · `probes/loi-xac-thuc.mjs` · `probes/noi-day.sh` · `probes/vung.sh` | E1 → E12 | true |
| 6. Chỉ dẫn cho agent: profile đổi chỗ được, lệnh `login` | `collector/CLAUDE.md` | AC-9 | true |

Verify mỗi việc: chạy chính phép đo đó cả hai chiều (đã chạy lúc viết: xanh và đỏ đúng chỗ). Không còn mã nào phải viết.
