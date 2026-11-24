# Áp lên máy thu — doc-gop-dong-ho-rieng-trong-luot-dem (HT12)

Không migration, không ghi dữ liệu, không đổi plist trong kho, không nạp lại plist, không khởi động lại dịch vụ nào.
Nhánh B đứng trên HT13 (#533, đã gộp main be765e6a5).

1. **Lệnh áp.** Điều phối làn merge gộp PR bằng `gh pr merge`, rồi `git -C ~/dev/onehub-invest pull --ff-only origin main`.
   - Job launchd `com.oneinvest.zalo-import` (00:00, log `pipeline/logs/zalo-import.log`) chạy
     `scripts/zalo-import-daily.sh` qua symlink `~/dev/one-invest`; lượt 00:00 ĐẦU TIÊN sau pull chạy mã mới. Lượt nhanh
     15′ không chạy bước đọc gộp nên không đổi.
   - Đêm 24→25/11 plist đã cài đặt `ZALO_IMPORT_TRAN_TONG=32400` và `ENRICH_LIMIT=0` (lời Mạnh): đồng hồ bước đọc gộp
     27000 s, mốc dừng sạch 26700 s. Chưa có HT6 thì bước đọc gộp không tự dừng ở mốc ấy: đồng hồ bước cắt ở 27000 s
     (dòng `TIMEOUT: bước đọc gộp vượt trần 27000s`, `JOB FAIL … doc-gop-hang-ngay mã 143`), chuỗi chạy tiếp tới enrich,
     lượt thoát 143. Có HT6: bước thoát 75 trước mốc, `JOB WARN … hết giờ dừng sạch (mã 75)`, lượt thoát 0.
   - Pull trong lúc một lượt đang chạy: bash của lượt ấy đọc bản cũ tới hết lượt. Không phải chờ.
2. **Số chạy thử.** Bản sao script, thư mục tạm, DB cổng đóng — lệnh và số ở `evidence-report.md`: mặc định đồng hồ bước
   16200 s; biến 32400 → 27000 s; biến 100 → 60 s. Bước treo với trần 2 s → TIMEOUT của bước, enrich chạy, lượt mã 143;
   bước thoát 75 → không JOB FAIL, lượt mã 0, lượt sau đọc tiếp phần dở; bước phớt TERM → không mồ côi.
3. **Sao lưu trước.** Không có dữ liệu để sao lưu. Ngay trước khi pull, ghi sha checkout chính và độ dài log 00:00:
   ```bash
   cd ~/dev/onehub-invest && { git rev-parse HEAD; wc -c < pipeline/logs/zalo-import.log; } > /tmp/ht12-sao-luu.txt
   ```
4. **Cách lùi.** `git revert -m 1 <sha commit gộp>` trên một nhánh, mở PR lùi, gộp, rồi
   `git -C ~/dev/onehub-invest pull --ff-only origin main` — lượt 00:00 kế chạy bản HT13 (không đồng hồ bước; 75 là lỗi).
   Lùi B không cần lùi A (HT13). Không nạp lại plist.
5. **Lệnh kiểm sau.** Sáng sau lượt 00:00 đầu tiên chạy mã mới, và lại sau đêm đầu chạy trần mặc định; `--tran` phải đúng trần plist của đêm ấy (sai trần → `KHÔNG ĐẠT — lượt mới nhất không chạy trần …`, chạy lại với đúng số). Chỉ đọc phần log sinh sau pull:
   ```bash
   cd ~/dev/onehub-invest && B=$(sed -n 2p /tmp/ht12-sao-luu.txt) && tail -c +$((B+1)) pipeline/logs/zalo-import.log > /tmp/ht12-moi.log
   bash _acceptance/doc-gop-dong-ho-rieng-trong-luot-dem/ap-may-thu/kiem-sau.sh /tmp/ht12-moi.log --tran 32400  # sáng 25/11 (plist đặt 32400)
   bash _acceptance/doc-gop-dong-ho-rieng-trong-luot-dem/ap-may-thu/kiem-sau.sh /tmp/ht12-moi.log --tran 21600  # sáng sau đêm GS gỡ biến (mặc định)
   ```
   Bộ kiểm chạy nguyên bộ kiểm HT13 (lượt 00:00 mới nhất: không TIMEOUT lượt, có `bước enrich-run`, hai khoản chừa) rồi
   đòi trong đúng lượt ấy: không có `JOB FAIL [zalo-import-daily] bước doc-gop-hang-ngay mã 75`; bước mã 75 thì có dòng
   `JOB WARN … hết giờ dừng sạch`. Kỳ vọng: `ĐẠT — … · đọc gộp dừng sạch (75), đi tiếp` (có HT6), `ĐẠT — … · đọc gộp bị
   đồng hồ bước cắt (mã 143), đi tiếp` (chưa có HT6) hoặc `ĐẠT — … · đọc gộp xong trọn`, mã 0 — ghi dòng ĐẠT cạnh số
   chạy thử ở bước 2. Sai trông như: `KHÔNG ĐẠT — bước đọc gộp dừng sạch (mã 75) vẫn bị tính lỗi` (lượt chưa chạy mã
   B — kiểm pull), `KHÔNG ĐẠT — lượt bị trần tổng cắt`, `KHÔNG ĐẠT — enrich-run chưa chạy trong lượt` (dừng, báo GS, không
   tự sửa); `KHÔNG ĐẠT — chưa có lượt 00:00 nào chạy mã mới` thì đợi lượt kế rồi đo lại.
