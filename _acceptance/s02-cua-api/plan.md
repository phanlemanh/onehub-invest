# Kế hoạch thi công — s02-cua-api (ZC22, T3)

Hợp đồng: `_acceptance/s02-cua-api/contract.md` (Mạnh duyệt 27/11, giữ cỡ 13 tiêu chí). Mã của làn thu đã viết xong ở
`origin/zcode/s02-cua-api` @2f0748d06 và gộp nguyên vào nhánh `fix/s02-cua-api` (17 tệp khớp byte). Vòng này KHÔNG viết thêm
mã sản phẩm: ZT không sửa logic thu của làn ZCode (lỗi logic → MỞ LẠI qua LL). Việc còn lại là phép đo, chấm và hồ sơ.

| # | Việc | Tệp | Lệnh kiểm từng việc | Phục vụ | independent |
|---|---|---|---|---|---|
| 1 | Đọc phiên trên đĩa, đổi token hai lời, bộ thu không mở trình duyệt, lệnh login (ZCode, đã xong) | hai tệp bộ thu S02 · `collector/src/cli.ts` · `collector/src/test/s02-*.test.ts` · `collector/CLAUDE.md` · `collector/AGENTS.md` | `git diff --stat HEAD 2f0748d06 -- <17 tệp>` rỗng | E1–E13 | — (đã xong) |
| 2 | Ba phép đo đột biến, tĩnh, vùng (ZCode, đã xong) | `_acceptance/s02-cua-api/probes/chay-test-dot-bien.mjs` · `khong-trinh-duyet.sh` · `vung.sh` | ba lệnh của E1–E11: XANH, 23 đột biến bị bắt | E1–E11 | — (đã xong) |
| 3 | Phép soát giá trị phiên không rời bộ nhớ và bộ test không chạm profile thật (ZT, đã xong) | `_acceptance/s02-cua-api/probes/khong-lo-phien.sh` | `bash …/khong-lo-phien.sh`: XANH, sáu bản cấy bị bắt (cặp hai chiều trên cùng tệp) | E14, E15 | — (đã xong) |
| 4 | Phép đo dừng cả lượt, đếm nhịp, đuôi nhật ký ghi dở (ZT, đã xong) | `_acceptance/s02-cua-api/probes/dung-ca-luot.mjs` | `node …/dung-ca-luot.mjs`: XANH, hai bản đột biến bị bắt | E16–E18 | — (đã xong) |
| 5 | Gộp main mới nhất + vẽ lại bản đồ ngay trước khi chấm | `PRODUCT-MAP.md` · `LO-TRINH.html` | `node scripts/product-map.mjs --root .`; `bash …/vung.sh` XANH | E11 | false |
| 6 | Hợp đồng sang `implemented`; GS xếp chấm S4 trên M5 (collector thuần, không cần thứ chỉ máy thu có) | `contract.md` | kết quả soat-m5 + verdict S4 | E1–E18 | false |
| 7 | Làn trước chữ ký trên Mac mini dưới khoá s4 | — | `repin-lane.mjs --allow-dirty --write` xanh | E1–E18 | false |
| 8 | Sau gộp: GIAO triển khai build collector cho ZCode qua LL; đo ba lượt 19:05 | — | ZCode báo số qua LL | Đường đo | false |

Thứ tự: 5 → 6 → (Cổng Bằng chứng) → 7 → PR → gộp sau KEV1 nếu khoá trùng → 8. ZC23 (`s02-map-listings-trang-ke`) xếp chồng
trên nhánh này và gộp sau.

Giới hạn giữ suốt vòng: không đọc profile hay phiên thật, không chạy bộ thu với phiên thật, không build hay chạy trên checkout
chính, không giá trị phiên trong log, fixture, hồ sơ.
