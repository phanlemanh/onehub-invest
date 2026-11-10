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

## Mã album (`_acceptance/ma-album-s03/`, 06/11)

Lần cài này đổi CẢ extension kênh S03 lẫn handler — ngoại lệ có tên của dòng «không sửa extension» ở trên, chỉ trong
lời giao triển khai của hồ sơ này. Thứ tự đầy đủ, điều kiện lùi và người canh: `docs/ops/runtime-map.md` mục
«Mã album S03». Tin tới theo kết nối dài, không theo nhịp đều, nên bước khởi động lại phải nằm trong khung 2–4 giờ.

Trước khi cài, thêm vào năm bước ở trên:

1. Đã nâng runtime OpenClaw kể từ lần chạy trước? Chạy lại phép thử bộ chiếu
   `node --test collector/openclaw/tests/ma-album/mapper-runtime.test.mjs`. Đỏ thì DỪNG: mục `media` mang khoá album
   không còn tới handler.
2. `bash collector/openclaw/tests/ma-album/kiem-patch.sh` xanh; build extension bằng
   `bash collector/openclaw/tests/ma-album/chay-extension.sh` (dist mới phải có `albumMeta`).
3. Sao lưu `dist/`, `openclaw.plugin.json` của extension và `handler.js` (cùng hậu tố `bak-<YYYYMMDD>`).
4. Tiền kiểm `node --test collector/openclaw/tests/ma-album/tien-kiem.test.mjs`; ghi hai dòng `E7_MOC_*` làm mốc.

Cài: thay cả thư mục `dist/` của extension (giữ `node_modules` ngoài), chép handler, `node --check handler.js`,
`openclaw config validate`, rồi khởi động lại gateway đúng một lần nếu lời giao cho phép, ghi giờ làm `batLuc`.

Sau khi bật: chạy `node collector/openclaw/tests/ma-album/phai-lui.mjs <mốc.json>` mỗi lượt canh trong 30 phút đầu.
`dung-goi-Manh` → không bật lại, `KẸT`, gọi Mạnh. `lui-bat-lai` → khôi phục ba bản sao lưu, khởi động lại một lần, kiểm
lại như mục «Kiểm hai phía». Không lùi 077, snapshot, bộ nạp hay API collector. Kiểm thêm: trong 1 giờ có ít nhất
1 item snapshot mang `meta.albumMeta`.
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
