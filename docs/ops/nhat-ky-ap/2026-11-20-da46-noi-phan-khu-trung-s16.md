# Nhật ký áp lên DB máy thu — DA46 noi-phan-khu-trung-s16, 20/11/2026

Hồ sơ đã ký: `_acceptance/noi-phan-khu-trung-s16/` (PR #498, T3). Lệnh áp, số chạy thử, cách lùi, lệnh kiểm sau ở
`_acceptance/noi-phan-khu-trung-s16/ap-may-thu.md`; thẻ nối đã ký ở `the-noi.md`. Hai tệp đó giữ nguyên bản đã ký.

Người chạy: phiên giám sát đợt dot0-cam-mau, từ checkout chính ở `main` 96d834cad. Chữ ký Cổng Bằng chứng của Mạnh kèm
lời áp, gắn với băm thẻ nối `25e150a598dd6d7784d84c7aa8d13ffb26cce750e95e94de69d7dc6161199004`.

## Trình tự

| Bước | Giờ (UTC, 20/11) | Kết quả |
|---|---|---|
| Kiểm trước (chỉ đọc) | 14:58 | `main` sạch, bằng `origin/main`; không lượt dựng danh bạ đang chạy; toà theo nút trước áp: 42 = 1 · 382 = 7 · 388 = 5 · 391 = 4 · 392 = 15 · 394 = 11 · 395 = 3 · 397 = 5 (bảy nút sắp nghỉ cộng lại 50); 0 thẻ địa chỉ nhóm trỏ bảy nút sắp nghỉ |
| Sao lưu | 14:58:34 | `~/onehub-backups/db/truoc-da46-20261120T145834Z.dump`, 602.660.506 byte; `pg_restore -l` 1.772 mục, 342 bảng có dữ liệu |
| In thẻ nối, so băm | 15:05:38 | `--the-noi` in đúng băm đã ký; 7 cặp, 6 ca không nối |
| Chờ lượt nạp S03 22:00 (giờ VN) xong | ~15:06 | lượt xong sau 70 giây |
| Nối | 15:06:59 | `--noi`: «đã nối lượt 3: 7 cặp»; **rule_id = 3** |
| Kiểm sau | ~15:08 | `--kiem-noi 3`: «kiểm nối: đạt», mã thoát 0 |

Số thật cạnh số chạy thử (phần 2 của hồ sơ):

| Chỉ số | Thật | Chạy thử |
|---|---|---|
| Cặp nối | 7 | 7 |
| Toà đổi nút | 50 | 50 |
| Toà còn ở bảy nút nghỉ (382, 388, 391, 392, 394, 395, 397) | 0 | 0 |
| Toà theo nút giữ: 23 · 27 · 33 · 40 · 41 · 42 · 43 | 7 · 5 · 3 · 4 · 11 · 16 · 5 | 7 · 5 · 3 · 4 · 11 · 16 · 5 |
| `asset_nodes` | 429 (project 344 · subzone 82 · building 3) | 429 |

Sau áp vẫn 0 thẻ địa chỉ nhóm trỏ bảy nút nghỉ.

## Kiểm sau một đêm

Lịch 07:42 (giờ VN) 21/11: chạy lại `--kiem-noi 3` sau lượt dựng danh bạ đêm, xem bước khớp không đúc lại bảy phân khu
đã nghỉ. Kết quả ghi bổ sung vào tệp này.

## Cách lùi

Chỉ khi Mạnh bảo: `node pipeline/phan-khu-s16.mjs --dao-noi 3 --nguoi Mạnh`, hoặc khôi phục từ tệp sao lưu trên.
