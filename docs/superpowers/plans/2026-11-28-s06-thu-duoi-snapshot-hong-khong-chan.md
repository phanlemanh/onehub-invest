# Kế hoạch thi công ZC26 — s06-thu-duoi-snapshot-hong-khong-chan

Hồ sơ: `_acceptance/s06-thu-duoi-snapshot-hong-khong-chan/` (T2). Design: `docs/superpowers/specs/2026-11-28-s06-thu-duoi-snapshot-hong-khong-chan-design.md`.
Chỉ chạy sau khi Mạnh duyệt Cổng Phạm vi. Mọi lệnh kit chạy đường acceptance-gate 2.37.0 tường minh (nợ HT41).

| # | Việc | Tệp | Kiểm từng bước | Phục vụ | independent |
|---|---|---|---|---|---|
| 1 | Sửa đoạn chọn-nạp (bước 7) của wrapper: đọc `bo-qua-hong.json` (vắng/hỏng → `{}`), lọc id đã nạp và đã đánh dấu, hàm `hongVi(dir)` (kiểm `source` trước, rồi `readSnapshot` của `import-chotot.mjs`), đánh dấu bản hỏng (ghi tmp + rename), một dòng log stderr đúng khuôn, cờ `BO-QUA-MOI` trên stdout; mốc `/* ZC26-KIEM */` ngay sau khai báo `hongVi`. Giữ chuỗi `airbnb_snapshots` trong đoạn để shim test của ZC18 còn khớp. | `scripts/thu-duoi-s06.sh` | `bash -n scripts/thu-duoi-s06.sh`; probe `bo-qua-hong.mjs` trên db-thu → `BO-QUA-HONG OK` (gồm ca đột biến bị bắt) | E1–E7 | false |
| 2 | Bash tách kết quả đoạn chọn: dòng cờ → `RC=1`; dòng đường dẫn (nếu có) → nạp như cũ; không có đường dẫn → không gọi bộ nạp. | `scripts/thu-duoi-s06.sh` | như #1, ca «vùng toàn hỏng» xanh | E1, E2, E5 | false (cùng tệp #1) |
| 3 | Chạy lại ba phép đo của ZC18 trên mã mới; nếu shim test cần đổi (chỉ khi đoạn chọn đổi chữ ký gọi) thì sửa tối thiểu `scripts/thu-duoi-s06.test.mjs`. | `scripts/thu-duoi-s06.test.mjs` (nếu cần) | `node --test scripts/thu-duoi-s06.test.mjs scripts/install-cron-chi.test.mjs` · `node _acceptance/s06-thu-duoi-lich-va-chon-snapshot/probes/dot-bien.mjs` · `bash db/db-thu.sh oneinvest_suite_s06tl --chay-trong node _acceptance/s06-thu-duoi-lich-va-chon-snapshot/probes/chon-nap.mjs` → cả ba xanh | E9a–c | false |
| 4 | Phạm vi + bản đồ: `node _acceptance/s06-thu-duoi-snapshot-hong-khong-chan/probes/pham-vi.mjs` → `PHAM-VI OK`; vẽ lại bản đồ. | — | `PHAM-VI OK`; `product-map --check` khớp | E8 | false |

Thứ tự tuần tự trong vòng chính (mọi việc cùng một tệp hoặc nối tiếp nhau — không fan-out). Đo phép mới theo khuôn hai
chiều: probe đã đỏ 33 ca trên main c644f2a50 (S1); sau #1–#2 phải xanh, và ca đột biến (wrapper bỏ kiểm trên bản chép) phải đỏ
trong chính lượt chấm.

S4: xin khoá s4 trên Mac mini. Hàng chỉ đổi `scripts/` và `_acceptance/`; nếu `suite-neu-doi` vẫn kích `pipeline_that` thì
chạy ngoài vòng theo quy trình HT37 (CHUNG.md điểm 16).
