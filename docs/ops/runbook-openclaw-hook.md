# Runbook — cài hook `oneinvest-zalo-pipe` vào OpenClaw

Chuẩn hoá từ lần triển khai PL4 Kev-nhãn (lời giao `claudedp-2310-10`, 24/10/2026). Đọc
`docs/ops/runtime-map.md` trước. An toàn Zalo (luật 8 của `AGENTS.md`) thắng mọi bước dưới đây.

## Khi nào được cài

- Chỉ khi bản hook đã **merge vào `main`** VÀ có **lời GIAO triển khai riêng** của điều phối liên làn
  (merge ≠ đang chạy). Không tự cài vì «thấy main đã có bản mới».
- **Restart gateway** `ai.openclaw.gateway` chỉ khi lời giao triển khai ghi rõ «được restart» (Mạnh duyệt).
  Gateway KHÔNG tự nạp lại hook khi tệp đổi — không có restart thì bản mới chưa chạy. Lời giao không ghi
  thì làm tới bước chép tệp, rồi `HỎI claudedp --chan`.
- Chỉ đụng `~/.openclaw/hooks/oneinvest-zalo-pipe/`. Không sửa `openclaw.json`, `requireMention`,
  `bindings`, extension `zalouser`; không đụng collector :9210 (có lời giao riêng).

## Trước khi cài (ghi từng số vào XONG)

1. Checkout chính `~/dev/onehub-invest` đứng ở `main` ≥ sha của lời giao.
2. `diff` bản repo `collector/openclaw/handler.js` với bản đang cài: chỉ khác đúng phần của lời giao.
3. Watchdog chạy tay: `ok`.
4. `~/Library/Logs/openclaw/gateway.log` 60 phút gần nhất: 0 dòng `auto-reply/agent-turn-timing`.
5. Không có turn hay phiên agent dở — khi restart, restart-recovery sẽ chạy tiếp turn dở (runtime-map).
   Có thì DỪNG, `KẸT`, không restart.

## Cài

1. Sao lưu: `handler.js` → `handler.js.bak-<YYYYMMDD>` (cùng thư mục; giữ cả `HOOK.md` nếu đổi).
2. Chép `handler.js` (+ `HOOK.md`) từ checkout chính vào thư mục hook; `node --check handler.js`.
3. Nếu lời giao cho restart: `launchctl bootout` + `bootstrap` gateway **đúng một lần**, ghi giờ.

## Kiểm hai phía (ngay sau + ít nhất 2 lượt watchdog 5′)

- Watchdog: `ok … 0 turn mới`, không dòng mới trong alert log; `gateway.log`: 0 agent-turn sau restart.
- Log hook `~/.openclaw/logs/oneinvest-zalo-pipe.log`: dòng gửi đúng khuôn `post 202 {…"accepted":N…}`
  (Ops và `audit-all.sh` đọc đúng chuỗi ` post 202`), không còn dòng lỗi mới.
- 1 giờ sau: số `post 202`/giờ so với trước khi cài (PL4: ~23/giờ → ~150/giờ).

## Sự cố và hoàn tác

- Bất kỳ agent-turn nào sau restart: watchdog tự KILL gateway. `KẸT` ngay trên kênh, KHÔNG bật lại gateway.
- Hoàn tác: chép `handler.js.bak-<YYYYMMDD>` đè lại, restart một lần (nếu lời giao đã cho restart), kiểm
  như trên.
- Ghi chú: watchdog L1 grep bản hook TRONG REPO (`collector/openclaw/handler.js`), không grep bản đã cài —
  bước 2 «trước khi cài» là chỗ đối chiếu hai bản.

## L4d tắt gateway (lượt agent mới trên kho phiên)

L4d (`scripts/zalo-watchdog.sh`, mô tả đủ ở `runtime-map.md` mục L4d) đếm `transcript_events` của mọi agent; mốc ở
`pipeline/logs/zalo-watchdog-agentdb.d/<agent>` (khuôn `count|max_created_at`), cờ lần đầu `.first-done`. Gộp PR là có hiệu
lực vì launchd chạy script từ checkout chính; lần chạy đầu chỉ ghi mốc. Dòng cảnh báo nêu tên agent và đường mốc cần xử.

**Ai quyết:** Mạnh. Liên làn/giám sát điều tra và trình; không phiên nào tự bật lại gateway sau một lần L4d tắt (luật 8).

1. `KẸT` ngay trên kênh (không nêu tên nhóm, tên tài khoản). KHÔNG bật lại gateway. Mốc giữ nguyên — bật lại lúc này thì lượt
   canh kế tắt tiếp, đó là đúng thiết kế.
2. **Điều tra** (chỉ đếm, không in nội dung phiên): agent nào, mấy dòng mới (`count` mới − `count` mốc), khoảng giờ
   (`MAX(created_at)` mới so mốc); đếm (`grep -c`, không in dòng) `auto-reply/agent-turn-timing` trong
   `~/Library/Logs/openclaw/gateway.log` quanh giờ đó — 0 dòng là đúng ca lượt nhanh L4b không thấy;
   kênh nào kích hoạt (nhóm hay tin riêng) — đối chiếu sự cố 20/10 và 30/10 ở `runtime-map.md`. Có gửi gì ra ngoài không là câu
   hỏi đầu tiên.
3. **Kiểm phiên dở trước khi bật lại:** gateway đang tắt nên không lượt mới; đọc lại số đếm hai lần cách 1′ phải bằng nhau,
   và không còn phiên nào ở trạng thái đang chạy (restart-recovery của OpenClaw sẽ chạy nốt lượt dở khi bật lại — lượt 17:59
   22/10 là ví dụ). Còn lượt dở → xử nguyên nhân (cấu hình kênh, ghép đôi, chính sách tin riêng) TRƯỚC, không bật lại để «xem
   nó có chạy tiếp không».
4. **Xử mốc** (sau khi Mạnh đồng ý bật lại): đọc số hiện tại bằng đúng câu của script (chỉ-đọc) rồi ghi đè mốc nguyên tử:
   ```bash
   DB=~/.openclaw/agents/<agent>/agent/openclaw-agent.sqlite
   M=~/dev/onehub-invest/pipeline/logs/zalo-watchdog-agentdb.d/<agent>
   MODE=immutable=1; { [ -e "$DB-wal" ] || [ -e "$DB-journal" ]; } && MODE=mode=ro
   V=$(sqlite3 "file:$DB?$MODE" "SELECT COUNT(*) || '|' || COALESCE(MAX(created_at), 0) FROM transcript_events;")
   [[ "$V" =~ ^[0-9]+\|[0-9]+$ ]] && printf '%s\n' "$V" > "$M.tmp" && mv -f "$M.tmp" "$M"
   ```
   Mốc gõ sai khuôn thì L4d báo «mốc hỏng» và tắt tiếp — sửa lại cho đúng, đừng xoá tệp mốc của một agent (xoá thì kho đó bị
   coi như mới xuất hiện: có dòng là tắt).
5. Bật lại gateway một lần (`launchctl bootstrap gui/$(id -u) ~/Library/LaunchAgents/ai.openclaw.gateway.plist`), canh hai
   lượt canh 5′: dòng cuối `zalo-watchdog-run.log` «ok», không dòng `L4d` mới, tin vẫn chảy tới hook (`post 202`).

**Lùi L4d:** PR hoàn tác commit trên `main` (không sửa tay checkout chính), rồi `rm -rf
~/dev/onehub-invest/pipeline/logs/zalo-watchdog-agentdb.d` — để nguyên thư mục mốc thì lần bật L4d sau so với mốc cũ và tắt
nhầm.

**Giới hạn:** L4d tắt SAU khi lượt đã chạy (≤5′ một lượt canh), không chặn trước; không thấy lượt không ghi
`transcript_events` hay kho phiên đặt ngoài `~/.openclaw/agents/*/agent/`. Danh sách đủ và các điều chưa đo: `runtime-map.md`
mục L4d.

## Bộ tra hồ sơ người bán S03 (`link-nguoi-ban-s03`)

Cài cùng lần với `ma-album-s03` — không có lần khởi động lại riêng. Mô tả đầy đủ, trần, tệp chặn: `runtime-map.md` mục «Bộ tra hồ sơ
người bán S03». Bộ tra chỉ dùng bộ nghe tin đang nối; **cấm đăng nhập thứ hai**, kể cả để thử.

**Tiền kiểm thêm** (ngoài tiền kiểm của `ma-album-s03`; hỏng một điều thì không được khởi động lại):
- không có `yeu-cau.json` trong `S03_LOOKUP_DIR`;
- không có `luot-lon.txt`;
- lời gọi API mới trong diff extension chỉ có `getUserInfo`.

**Sau khởi động lại:** 30 phút ổn theo lệnh phán lùi rồi mới lập tệp yêu cầu lượt thử (`node pipeline/lap-yeu-cau-ho-so.mjs --out
"$S03_LOOKUP_DIR/yeu-cau.json"`); canh 30 phút sau lời gọi: dòng đóng bộ nghe tin, PID gateway, số `post 202`. Bộ nghe tin đóng trong 30
phút sau lời gọi → phán lùi trả `dung-goi-Manh` (luật riêng, không xếp vào dạng 26/10): dừng gọi, báo Mạnh.

**Tắt:** xoá `yeu-cau.json` hoặc đặt `chan.txt` — không cần khởi động lại gateway. Lượt lớn chỉ Mạnh bật (`luot-lon.txt`).
