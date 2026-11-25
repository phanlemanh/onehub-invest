# Áp lên máy thu — tran-tong-luot-dem-va-tran-doc-gop (HT13)

Không migration, không ghi dữ liệu, không đổi plist trong kho, không nạp lại plist, không khởi động lại dịch vụ nào.

1. **Lệnh áp.** Điều phối làn merge gộp PR bằng `gh pr merge`, rồi `git -C ~/dev/onehub-invest pull --ff-only origin main`.
   - Job launchd `com.oneinvest.zalo-import` (00:00, log `pipeline/logs/zalo-import.log`) chạy
     `scripts/zalo-import-daily.sh` qua symlink `~/dev/one-invest`; launchd đọc lại tệp ở mỗi lần khởi, nên lượt 00:00
     ĐẦU TIÊN sau pull chạy mã mới. Lượt nhanh 15′ cũng chạy tệp này nhưng hành vi của nó không đổi (AC-6).
   - Đêm 24→25/11 plist ĐÃ CÀI trên máy (không phải bản trong kho) đặt `ZALO_IMPORT_TRAN_TONG=32400` theo lời Mạnh một
     đêm; biến thắng mặc định 21600 (AC-3): trần lượt 32400, đọc gộp ≤27000 s, dừng sạch ở 26700 s. GS gỡ biến 09:35 VN
     25/11 — từ lượt 25→26/11 chạy mặc định 21600 / 16200 / 15900.
   - Pull trong lúc một lượt đang chạy: bash của lượt ấy vẫn đọc bản cũ tới hết lượt. Không phải chờ.
   - Nhánh B (HT12) chưa vào: bước đọc gộp dừng sạch thoát 75 thì enrich vẫn chạy nhưng lượt thoát 75 kèm JOB FAIL
     (đỏ giả, AC-7) — không phải lỗi áp.
2. **Số chạy thử.** Bản sao script, thư mục tạm, DB cổng đóng — lệnh và số ở `evidence-report.md` (E1–E8b): mặc định
   21600/16200/15900; biến 32400 → 32400/27000/26700; biến 6000 → 6000/600/300; tường minh 30000 → kẹp 16200 + JOB WARN.
3. **Sao lưu trước.** Không có dữ liệu để sao lưu. Ngay trước khi pull, ghi sha checkout chính và độ dài log 00:00:
   ```bash
   cd ~/dev/onehub-invest && { git rev-parse HEAD; wc -c < pipeline/logs/zalo-import.log; } > /tmp/ht13-sao-luu.txt
   ```
4. **Cách lùi.** `git revert -m 1 <sha commit gộp>` trên một nhánh, mở PR lùi, gộp, rồi
   `git -C ~/dev/onehub-invest pull --ff-only origin main` — lượt 00:00 kế chạy bản cũ (trần 14400). Không nạp lại plist.
   Lùi khi nhánh B đã vào thì lùi B trước (B đứng trên A).
5. **Lệnh kiểm sau.** Hai sáng liền, chỉ đọc phần log sinh sau pull:
   ```bash
   cd ~/dev/onehub-invest && B=$(sed -n 2p /tmp/ht13-sao-luu.txt) && tail -c +$((B+1)) pipeline/logs/zalo-import.log > /tmp/ht13-moi.log
   bash _acceptance/tran-tong-luot-dem-va-tran-doc-gop/ap-may-thu/kiem-sau.sh /tmp/ht13-moi.log               # sáng 25/11 (đêm biến 32400)
   bash _acceptance/tran-tong-luot-dem-va-tran-doc-gop/ap-may-thu/kiem-sau.sh /tmp/ht13-moi.log --tran 21600  # sáng 26/11 (mặc định)
   ```
   Bộ kiểm lấy lượt 00:00 mới nhất chạy mã mới (từ dòng khai trần có «đọc gộp» tới dòng khai kế), đòi trong đúng lượt ấy:
   không TIMEOUT, có `bước enrich-run`, các bước trước đọc gộp ≤ trần nạp + 600 s, các bước sau đọc gộp tới hết enrich
   ≤ 3000 s; `--tran 21600` đòi thêm lượt ấy chạy trần mặc định — đêm biến 32400 không được tính thay. Kỳ vọng hai sáng:
   `ĐẠT — [zalo-import-daily] trần: … · trước đọc gộp …s/2400s · sau đọc gộp …s/3000s · JOB STEP … bước enrich-run mã …`,
   mã 0 — ghi hai dòng ĐẠT (kèm hai tổng giây) cạnh số chạy thử ở bước 2. Sai trông như: `KHÔNG ĐẠT — lượt bị trần tổng
   cắt`, `KHÔNG ĐẠT — enrich-run chưa chạy trong lượt`, `KHÔNG ĐẠT — các bước sau đọc gộp tới enrich mất …s > chừa 3000s`
   (dừng, báo GS, không tự sửa); `KHÔNG ĐẠT — chưa có lượt 00:00 nào chạy mã mới` hoặc `… không chạy trần 21600s` thì đợi
   lượt kế rồi đo lại.
