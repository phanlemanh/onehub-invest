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
