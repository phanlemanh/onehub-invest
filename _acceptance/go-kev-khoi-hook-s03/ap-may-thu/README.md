# Áp lên máy thu — go-kev-khoi-hook-s03 (KEV1)

Không migration, không ghi dữ liệu, không nạp plist mới. Hai phần, hai cách có hiệu lực:
- `scripts/zalo-watchdog.sh` chạy thẳng từ checkout chính (launchd `com.oneinvest.zalo-watchdog`) — có hiệu lực ngay sau pull.
- Hook `oneinvest-zalo-pipe` chạy từ bản CÀI trong `~/.openclaw/hooks/`, không từ kho — phải chép rồi khởi động lại gateway.

Người làm: phiên ZCode vận hành (ZV) theo lời GIAO triển khai của LL sau khi PR gộp và GS chuyển lời. Phiên dãy ZT không làm bước nào dưới đây.

1. **Lệnh áp.** Giờ áp: NGOÀI 05:30–06:30 và 14:00–14:45 giờ VN (job thu được ưu tiên). **Khởi động lại gateway cần lời riêng của Mạnh** — chữ ký Cổng Bằng chứng của hồ sơ này phủ đúng bước 1.4 dưới đây; không có chữ ký thì dừng sau bước 1.1.
   1. `git -C ~/dev/onehub-invest pull --ff-only origin main`; kiểm `grep -c kevScore ~/dev/onehub-invest/collector/openclaw/handler.js` = `0` và `ls ~/dev/onehub-invest/pipeline/cron/com.oneinvest.kev-gate.plist` báo không có tệp. Từ đây watchdog đã là bản K1 — trong 5′ sau pull, `tail -1 ~/dev/onehub-invest/pipeline/logs/zalo-watchdog.log` phải là dòng «ok — … 0 turn mới, kev:off (K1), db:ok» (watchdog chạy trọn sau khi gỡ khối canh — vòng code chỉ chốt tĩnh phần này); không thấy dòng ấy sau 10′ → không làm bước 1.2 trở đi, lùi watchdog (mục 4), báo GS.
   2. Sao lưu (mục 3).
   3. `cp ~/dev/onehub-invest/collector/openclaw/HOOK.md ~/dev/onehub-invest/collector/openclaw/handler.js ~/.openclaw/hooks/oneinvest-zalo-pipe/`
   4. `launchctl kickstart -k gui/$(id -u)/ai.openclaw.gateway` — gateway đòi QR thì dừng, báo Mạnh; không đăng nhập lại.
   - Không gỡ hay nạp plist nào: plist `com.oneinvest.kev-gate` không còn trong kho và không nạp trên Mac mini (Kev đã gỡ khi chuyển máy 23–24/11).
2. **Số chạy thử.** Hộp cát (HOME giả, collector giả, cổng chấm giả còn sống), không chạm `~/.openclaw`: `node scripts/kev-nhan/acceptance.mjs handler-label` → 4/4 tin có chữ POST tới `/agent-report`, mọi `kev = {p: null, model: "kev-off", threshold: 0.9}`, cổng chấm bị gọi **0 lần** kể cả khi nó sống; cổng đóng hẳn → 1 POST, 0 lời gọi, dòng log `post 202 … kev=off`. `node --test collector/openclaw/handler.test.mjs` 8/8 (gồm ca «cô-lập» và hai ca «bên-đọc-log»: tên nhóm tách đúng ở `pipeline/lib/ops-flow.mjs` và `gateByGroup`). Lệnh kiểm sau (mục 5) chấm đúng 8 bộ log mẫu (`kiem.sh`), cộng round-trip: log hook sinh bằng `handler.js` của cây, nhịp watchdog sinh bằng chính đoạn L5 của `scripts/zalo-watchdog.sh` chạy trong hộp cát. Số «trước» trên máy thu (đo 24/11, ngày VN): 5.103 dòng `post 202`, 4.954 dòng «kev null»; watchdog ghi «kev:DOWN» mỗi 5′.
3. **Sao lưu trước.** Bản hook đang chạy và mốc độ dài ba tệp log, ngay trước bước 1.3:
   ```bash
   G=$(date +%Y%m%d%H%M); H=~/.openclaw/hooks/oneinvest-zalo-pipe
   cp "$H/handler.js" "$H/handler.js.bak-$G" && cp "$H/HOOK.md" "$H/HOOK.md.bak-$G"
   L=~/dev/onehub-invest/pipeline/logs
   { echo "$G"; wc -c < ~/.openclaw/logs/oneinvest-zalo-pipe.log; wc -c < "$L/zalo-watchdog.log"; wc -c < "$L/zalo-watchdog-alerts.log"; } > /tmp/kev1-moc.txt
   ```
   Lưu ý: log hook thật đang có 99 dòng `post 202 … kev=off` GIẢ (nhóm `t1`, `conv-*`, `c`; từ 21/11) do bản cũ của
   `collector/openclaw/handler.test.mjs` chạy với HOME thật — để nguyên, không xoá (không ai sửa `~/.openclaw` ngoài bước áp);
   bộ kiểm sau áp chỉ đọc phần log sinh SAU mốc byte nên không đếm chúng. Watchdog cắt `zalo-watchdog.log` còn 500 dòng mỗi nhịp — mốc byte của tệp này có thể trôi; mục 5 vì vậy chỉ đọc 3 dòng cuối của nó.
4. **Cách lùi** (≈1′, không đụng dữ liệu). Hook: `cp "$H/handler.js.bak-$G" "$H/handler.js" && cp "$H/HOOK.md.bak-$G" "$H/HOOK.md"` rồi `launchctl kickstart -k gui/$(id -u)/ai.openclaw.gateway` (cùng lời riêng của Mạnh). Hook cũ chạy được khi không có Kev (fail-open, chỉ thêm «kev null»). Watchdog: `git revert -m 1 <sha commit gộp>` trên một nhánh, PR lùi, gộp, `git -C ~/dev/onehub-invest pull --ff-only origin main`. Không cần dựng lại Kev.
5. **Lệnh kiểm sau.** Trong 30′ sau bước 1.4, chỉ đọc phần log sinh sau mốc:
   ```bash
   M=/tmp/kev1-moc.txt; L=~/dev/onehub-invest/pipeline/logs
   tail -c +$(( $(sed -n 2p $M) + 1 )) ~/.openclaw/logs/oneinvest-zalo-pipe.log > /tmp/kev1-hook.log
   tail -3 "$L/zalo-watchdog.log" > /tmp/kev1-wd.log
   tail -c +$(( $(sed -n 4p $M) + 1 )) "$L/zalo-watchdog-alerts.log" > /tmp/kev1-alerts.log
   bash ~/dev/onehub-invest/_acceptance/go-kev-khoi-hook-s03/ap-may-thu/kiem-sau.sh /tmp/kev1-hook.log /tmp/kev1-wd.log /tmp/kev1-alerts.log
   ```
   Kỳ vọng: `ĐẠT — <n> dòng post 202 kev=off · 0 kev null · watchdog ok, 0 turn mới, kev:off (K1) · 0 cảnh báo Kev`, mã 0 — ghi
   dòng ấy cạnh số chạy thử ở mục 2. Phía collector: có snapshot S03 mới sau giờ khởi động lại, manifest không lỗi. Một ngày sau:
   số dòng «kev null» của ngày VN = 0, số dòng `post 202` cùng bậc với 5.103/ngày. `KHÔNG ĐẠT — chưa có dòng «post 202 … kev=off»
   mới` thì đợi nhịp poll (~10′) rồi đo lại; mọi `KHÔNG ĐẠT` khác, hoặc quá 30′ không có tin → lùi (mục 4), báo GS, không tự sửa.
