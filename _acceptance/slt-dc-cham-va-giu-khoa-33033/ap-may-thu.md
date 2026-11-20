# Áp lên máy thu — slt-dc-cham-va-giu-khoa-33033

Không migration, không DDL, không lượt ghi dữ liệu riêng. Mã chạy từ checkout chính (`~/dev/onehub-invest`, launchd) sau khi điều
phối làn merge gộp PR và chạy `git -C ~/dev/onehub-invest pull --ff-only origin main`.

1. **Lệnh áp**: không có — kéo main là đủ.
2. **Số chạy thử**: DB chép của lượt 20/11 — câu mới 0,74 s (ép nested loop) / 1,14 s (ép hash) ở 200k; chuỗi ba lượt transform
   SLT-DC rút cùng tập id với câu cũ (E2).
3. **Sao lưu trước**: không cần bản dump — câu chỉ đổi cách tìm dòng rút, cùng tập dòng (AC-1, AC-2); phát biểu rút nhầm (nếu có)
   tự được chèn lại sống ở lượt kế sau khi lùi, vì S03 và S06 ghi lại trọn phát biểu mỗi lượt. Mốc đối chiếu lấy ngay trước khi
   kéo main (bước 5).
4. **Cách lùi**: revert PR rồi kéo main; lượt nạp kế tiếp của S03 (15′) và S06 (đêm) ghi lại phát biểu.
5. **Lệnh kiểm sau** (AC-7, E7): ngay TRƯỚC khi kéo main ghi ba mốc
   `N=$(wc -l < ~/dev/onehub-invest/pipeline/logs/s03-nap-15phut.log)`, `NC=$(wc -l < ~/dev/onehub-invest/pipeline/logs/chotot.log)`,
   `T=$(date -u +%Y-%m-%dT%H:%M:%SZ)`; sau bốn lượt nạp 15′ và lượt S06 kế tiếp chạy
   `node _acceptance/slt-dc-cham-va-giu-khoa-33033/probes/san-xuat.mjs --tu-dong $N --chotot-tu-dong $NC --gop-luc $T` (chỉ đọc log
   và DB máy thu). Chạy thử 20/11 với mốc giả 2 giờ trước: «transform-zalo: bốn bước 122, 70, 68, 100 s · trung vị 85 s ·
   transform-chotot: mã 0 · 201 s · SAN XUAT OK».
   Dấu lật để canh trong lúc chờ: bước transform-zalo > 300 s, hoặc câu `WITH k AS` sống > 3′ trong `pg_stat_activity` của DB
   `oneinvest`.
