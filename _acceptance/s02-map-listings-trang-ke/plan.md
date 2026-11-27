# Kế hoạch thi công — s02-map-listings-trang-ke (ZC23, T3)

Mã đã có: ZCode viết ở `origin/zcode/zt-s02-trang-ke` @2b9e94afb (LL soát cổng ĐẠT), ZT gộp nguyên vào nhánh, hai tệp mã khớp
byte. Kế hoạch này chỉ còn việc tích hợp, chấm và bàn giao. ZT không sửa logic thu.

1. **Giữ mã khớp nguồn.** Mỗi lần gộp (main, nhánh ZC22) soát lại hai tệp `collector/src/collectors/airdna-research.ts`,
   `collector/src/test/s02-bo-thu-cua-api.test.ts` khớp byte với 2b9e94afb hoặc với sha mới LL chuyển. Lệch → dừng, báo LL.
2. **Chuyển hợp đồng sang `implemented`** sau Cổng 1.5; vẽ lại bản đồ.
3. **Chạy nhanh phép đo trên Mac mini (fixture, nhẹ):** `vung.sh`, `khong-ten-mien-moi.sh`, `phia-sau-va-tran-trang.mjs`,
   `chay-test-dot-bien.mjs trang-ke`. Đỏ → dừng, báo.
4. **Soát M5 năm job** trên đầu nhánh (đang chạy cho 8cd95b55c); chỉ đỏ QV-AC-5 thì đạt.
5. **Chấm S4 trên M5** (GS xếp lượt): 7 eval E1–E7, chỉ fixture, không phiên thật, không lời mạng.
6. **Cổng Bằng chứng:** dựng thẻ, trình Mạnh qua GS; ký xong chạy làn trước chữ ký, mở PR.
7. **Gộp sau ZC22** (#570). Khi ZC22 vào main: gộp main vào nhánh một lần, pre-merge-check; stale thì làn trọn theo lượt khoá GS xếp.
8. **Triển khai:** GIAO ZV qua LL — build lại `collector/` ở checkout chính theo các bước của ZC22
   (`_acceptance/s02-cua-api/ap-trien-khai/README.md`; cùng sao lưu và cách lùi). Đường đo: lượt 19:05 đầu sau build — thị trường 47
   ba lời `map_listings`, 0 lời 404; `airdna_listings` thị trường 47 từ 15 000 lên khoảng 30 600 sau transform (ZT đo chỉ đọc).
