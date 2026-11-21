# Áp lên máy thu — s03-tran-thoi-gian-luot-nap

Không migration, không ghi dữ liệu, không đổi plist, không nạp lại plist, không khởi động lại dịch vụ nào.

1. **Lệnh áp.** Điều phối làn merge gộp PR bằng `gh pr merge`, rồi `git -C ~/dev/onehub-invest pull --ff-only origin main`.
   - Hai job launchd chạy `/bin/bash ~/dev/one-invest/scripts/zalo-import-daily.sh` (symlink về checkout chính):
     `com.oneinvest.s03-nap-15phut` (cờ `--luot-nhanh`, 7:00–22:45 mỗi 15′, log `pipeline/logs/s03-nap-15phut.log`) và
     `com.oneinvest.zalo-import` (00:00, log `pipeline/logs/zalo-import.log`). launchd đọc lại tệp script ở MỖI lần
     khởi, nên **lượt đầu chạy mã mới** là lượt 15′ kế tiếp sau khi pull (nếu pull trong 7:00–22:45; ngoài khung đó là
     lượt 00:00), và lượt 00:00 đầu tiên là lượt 00:00 ngay sau pull.
   - **Không cần nạp lại plist**: hai plist không đổi (AC-7 so `pipeline/cron/` với origin/main), đường dẫn và cờ giữ
     nguyên. Không có lời riêng nào của Mạnh cho việc nạp plist.
   - Pull trong lúc một lượt đang chạy: git thay tệp bằng tệp mới (inode mới), bash của lượt đang chạy vẫn đọc bản cũ
     tới hết lượt; lượt sau mới dùng bản mới. Không phải chờ lượt xong mới pull.
   - Máy thu phải có node thật ở `~/.local/node-v24.21.0/bin/node` (máy hiện tại có). Thiếu thì lượt vẫn chạy đủ bước
     nhưng **không có trần** và log in dòng «TRẦN THỜI GIAN TẮT» — bước 5b bắt được. Áp sau khi chuyển sang máy mới
     (23/11) thì kiểm tệp này trên máy mới trước.
2. **Số chạy thử.** `chay-thu.md` — các lượt trên bản sao script (thư mục tạm, fixture, DB cổng đóng), kèm mã thoát và
   dòng log từng ca.
3. **Sao lưu trước.** Không có dữ liệu để sao lưu. Ngay trước khi pull, ghi sha checkout chính và độ dài hai log (để
   bước 5 chỉ đọc phần log sinh SAU khi pull):
   ```bash
   cd ~/dev/onehub-invest && { git rev-parse HEAD; wc -c < pipeline/logs/s03-nap-15phut.log; wc -c < pipeline/logs/zalo-import.log; } > /tmp/s03-tran-sao-luu.txt
   ```
   (dòng 1 = sha trước gộp, dòng 2 = byte log 15′, dòng 3 = byte log 00:00).
4. **Cách lùi.** `bash lui.sh <sha commit gộp>` in lệnh `git revert -m 1 <sha>` để mở PR lùi; gộp PR lùi rồi
   `git -C ~/dev/onehub-invest pull --ff-only origin main` — lượt 15′ kế (hoặc 00:00) chạy bản cũ, như bước 1. Không
   nạp lại plist. Muốn tắt trần ngay mà không lùi mã: không có công tắc qua plist; đường duy nhất là lùi.
5. **Lệnh kiểm sau.** Lệch kỳ vọng ở bất kỳ ô nào thì dừng, báo GS, không tự sửa cho khớp.

   **5a. Thời lượng lượt 00:00** — sáng hôm sau gộp:
   ```bash
   bash _acceptance/s03-tran-thoi-gian-luot-nap/ap-may-thu/do-luot-dem.sh ~/dev/onehub-invest/pipeline/logs/zalo-import.log
   ```
   Kỳ vọng: `… — ĐẠT` (≤ 14400 giây) hoặc `… — ĐẠT (cắt trần)`, mã 0. Mốc trước: 5 giờ 38 phút (17/11), 6 giờ 32 phút
   (21/11). Sai trông như: `lượt 00:00 gần nhất: 6 bước, 23530 giây (6h32m) — KHÔNG ĐẠT …`, mã 1.
   Giới hạn đã biết của bộ đo (Ngoài-1, 2): nếu lượt đêm bị trần tổng cắt khi còn ở pha nạp, hoặc thoát sớm (⏸ snapshot
   chưa xong, ❌ nạp fail, khoá bận), bộ đo chấm nhầm sang lượt trước. Vì vậy luôn đọc kèm đuôi log:
   `tail -n 40 ~/dev/onehub-invest/pipeline/logs/zalo-import.log | grep -E 'TIMEOUT|⏸|❌|JOB STEP .*truoc-lan-claude'`
   — dòng cuối phải là của lượt đêm nay; có `TIMEOUT: phần nạp …` hoặc `TIMEOUT: lượt …` sau dòng truoc-lan-claude
   cuối mà bộ đo vẫn in số không cắt thì tin dòng log, báo GS.

   **5b. Trần có bật ở mã mới — đọc đúng dòng log của trần** (sau lượt 15′ đầu tiên chạy mã mới, và lại sau lượt 00:00
   đầu tiên). Chỉ đọc phần log sinh sau pull, theo số byte ghi ở bước 3:
   ```bash
   cd ~/dev/onehub-invest/pipeline/logs; B15=$(sed -n 2p /tmp/s03-tran-sao-luu.txt); B00=$(sed -n 3p /tmp/s03-tran-sao-luu.txt)
   for f in "s03-nap-15phut.log:$B15" "zalo-import.log:$B00"; do t=${f%%:*}; b=${f##*:}; tail -c +$((b+1)) "$t" > /tmp/s03-tran-moi.log
     echo "$t luot=$(grep -c 'bước truoc-lan-claude' /tmp/s03-tran-moi.log) tat=$(grep -c 'TRẦN THỜI GIAN TẮT' /tmp/s03-tran-moi.log) warn=$(grep -c 'WARN: lượt đã chạy' /tmp/s03-tran-moi.log) cat=$(grep -cE 'TIMEOUT: (lượt vượt trần|phần nạp vượt trần)' /tmp/s03-tran-moi.log)"; done
   ```
   Kỳ vọng: mỗi log `luot` ≥ 1 (đối chứng dương: lượt mã mới đã chạy và đã ghi log) và `tat=0` (đồng hồ trần đã khởi —
   node thật có mặt). `warn`/`cat` thường là 0; khác 0 nghĩa là trần đã làm việc, đọc dòng ấy: `TIMEOUT: lượt vượt trần
   2400s` ở log 15′ hay `… 14400s` ở log 00:00 là đúng trần mặc định (AC-7). Sai trông như:
   `s03-nap-15phut.log luot=1 tat=1 warn=0 cat=0` (trần TẮT — kiểm `~/.local/node-v24.21.0/bin/node`), hoặc `luot=0`
   (chưa có lượt nào chạy mã mới — đợi lượt kế rồi đo lại, đừng kết luận).

   **5c. Không sót tiến trình đồng hồ.** Đồng hồ là một tiến trình `node -e` mà mã có chuỗi `process.env.NHAN_CANH`
   (dòng 167, 171 của `scripts/zalo-import-daily.sh`). Đối chứng dương trong lúc một lượt 15′ ĐANG chạy (thư mục khoá
   `pipeline/logs/apify-daily.state.lock` có mặt, thường ở phút :01–:05):
   ```bash
   ls -d ~/dev/onehub-invest/pipeline/logs/apify-daily.state.lock && pgrep -fl 'process.env.NHAN_CANH' | cut -c1-90
   ```
   Kỳ vọng: đúng một dòng `<pid> /Users/…/node-v24.21.0/bin/node -e …`. Sau khi lượt thoát (thư mục khoá đã mất):
   ```bash
   ls -d ~/dev/onehub-invest/pipeline/logs/apify-daily.state.lock 2>/dev/null || pgrep -fc 'process.env.NHAN_CANH'
   ```
   Kỳ vọng: `0`. Sai trông như: `1` (hoặc hơn) kèm `pgrep -fl` in đồng hồ mồ côi — báo GS kèm `ps -o pid,ppid,etime,command -p <pid>`.
   Không thấy dòng nào ở đối chứng dương thì phép đo 0 sau đó không chứng gì: đo lại ở lượt kế.
