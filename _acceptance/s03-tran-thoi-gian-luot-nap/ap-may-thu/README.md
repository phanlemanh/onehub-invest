# Áp lên máy thu — s03-tran-thoi-gian-luot-nap

Không migration, không ghi dữ liệu, không đổi plist, không khởi động lại dịch vụ nào.

1. **Lệnh áp.** Điều phối làn merge gộp PR bằng `gh pr merge`, rồi `git -C ~/dev/onehub-invest pull --ff-only origin main`.
   Hai job launchd (`com.oneinvest.zalo-import` 00:00, `com.oneinvest.s03-nap-15phut` 7–22h) chạy
   `~/dev/one-invest/scripts/zalo-import-daily.sh` (symlink về checkout chính), nên **gộp là có hiệu lực ở lượt kế**:
   lượt nhanh kế tiếp trong ngày, và lượt 00:00 đêm đó.
2. **Số chạy thử.** `chay-thu.md` — các lượt trên bản sao script (thư mục tạm, fixture, DB cổng đóng), kèm mã thoát và
   dòng log từng ca. Điền ở S4.
3. **Sao lưu trước.** Không có dữ liệu để sao lưu. Ghi sha checkout chính ngay trước khi pull vào `sao-luu.txt`:
   `git -C ~/dev/onehub-invest rev-parse HEAD > _acceptance/s03-tran-thoi-gian-luot-nap/ap-may-thu/sao-luu.txt`
   (chạy ở worktree, trước bước 1).
4. **Cách lùi.** `bash lui.sh <sha commit gộp>` in lệnh `git revert -m 1 <sha>` để mở PR lùi; sau khi PR lùi gộp và
   checkout chính pull, lượt kế chạy bản cũ. Muốn tắt trần ngay mà không lùi mã: không có — trần không có công tắc
   tắt qua plist (plist không đổi); đường duy nhất là lùi.
5. **Lệnh kiểm sau.** Sáng hôm sau gộp, trên máy thu:
   `bash _acceptance/s03-tran-thoi-gian-luot-nap/ap-may-thu/do-luot-dem.sh ~/dev/onehub-invest/pipeline/logs/zalo-import.log`
   — ĐẠT khi lượt 00:00 gần nhất ≤ 4 giờ hoặc có dòng TIMEOUT (bị cắt trần). Mốc trước: 5 giờ 38 phút (17/11). Kèm
   `ps -axo pid,ppid,etime,command | grep -c 'process.env.DO_KILL'` sau khi lượt thoát: phải là 0 (không còn đồng hồ).
   Lệch thì dừng, báo GS, không tự sửa cho khớp.
