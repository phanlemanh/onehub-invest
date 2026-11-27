# go-kev-khoi-hook-s03 (KEV1) — hook S03 không cổng chấm Kev

Ngày 24/11/2026 · dãy ZT · hạng T3 (`collector/openclaw/**`, `scripts/zalo-watchdog.sh` ∈ `t3_paths`) · hồ sơ
`_acceptance/go-kev-khoi-hook-s03/`.

## Bối cảnh

ROADMAP §3 mục 52 (Mạnh «Bỏ kev», 15/11): Kev chỉ gắn nhãn từ 23/10, không bước nào trong `pipeline/` đọc nhãn; lượt đọc bằng
model phủ mọi bài S03 từ 10/11. Máy thu chuyển sang Mac mini 23–24/11 không mang Kev. Hook vẫn gọi `:8009` (từ chối ngay,
0,0002 s — không chậm) và ghi «kev null» mỗi bài: 4.954 dòng/ngày; watchdog cảnh báo «kev:DOWN» mỗi 5′.

GS phán ZT-4: mở ô từ hàng KV1, phạm vi hẹp — phần làn thu. Lớp Kev trên Ops, audit-all, push-ops-facts là KEV2 (U1).

## Thay đổi (mã do ZCode viết, `zcode/k1-hook-khong-kev` @4016cf222, gộp nguyên)

| Tệp | Đổi |
|---|---|
| `collector/openclaw/handler.js` | bỏ `kevScore()` và hằng `KEV`; `kev = {p: null, model: "kev-off", threshold, at}`; log `post … kev=off` |
| `collector/openclaw/handler.test.mjs` | mới: 5 ca (1 lần POST, không gọi cổng chấm, khuôn tin, hai ca tự phá P1/P2, đọc khoá) |
| `scripts/zalo-watchdog.sh` | gỡ khối canh `:8009` (curl, WARN, osascript); `KEV_NOTE="kev:off (K1)"` |
| `pipeline/cron/com.oneinvest.kev-gate.plist` | xoá |
| `scripts/kev-nhan/acceptance.mjs`, `scripts/hook-zalo-spool/acceptance.mjs` | kiểm nghiệm thu cũ sang khuôn kev-off, đếm lời gọi cổng chấm |
| `scripts/job-exit.test.mjs` | chú thích bỏ kev-gate |
| `collector/openclaw/HOOK.md`, `README.md`, `docs/ops/runtime-map.md` | bỏ Kev khỏi đường tin |

Vòng này thêm (hồ sơ): `probes/khong-con-kev.sh` — chốt tĩnh watchdog/plist/hook/tài liệu, kèm `--tu-thu` phá tám mốc trên
bản chép (đóng lỗ LL nêu: gỡ khối canh không có test canh); `ap-may-thu/` — năm mục áp + `kiem-sau.sh` chỉ đọc log, bảy bộ log
mẫu.

## Lựa chọn

1. **Giữ trường `kev` với `p = null`, `model = "kev-off"`** thay vì bỏ trường: bỏ trường là đổi DATA-CONTRACT, phải tăng
   `schemaVersion` (luật 4) và sửa bộ nạp; giữ khuôn thì bộ nạp và manifest v3 không đổi. `p = null` vốn đã là giá trị hợp lệ
   (Kev chết thì cũng vậy — 4.954 tin/ngày đã nạp như thế).
2. **Giữ khuôn dòng log `post <status> <body60>`**: năm nơi đọc chuỗi này (ghi trong `handler.js`); chỉ thay `p=…` bằng `kev=off`.
3. **Watchdog đo tĩnh, không chạy thật**: watchdog thật có lớp tắt gateway (L4d) và đọc `~/.openclaw` — luật an toàn Zalo cấm
   phép đo chạm tài khoản thật. Chốt tĩnh + tự phá trên bản chép.
4. **Bộ kiểm sau áp đọc log đã cắt theo mốc byte**, không đọc toàn log (log hook 36 MB, chứa cả dòng «kev null» cũ).

## Áp lên máy thu (sau gộp — không phải việc của dãy)

Watchdog có hiệu lực ngay khi checkout chính pull (launchd chạy từ đó). Hook phải chép vào `~/.openclaw/hooks/oneinvest-zalo-pipe/`
rồi `launchctl kickstart -k gui/$(id -u)/ai.openclaw.gateway` — **lời riêng của Mạnh**, phủ bằng chữ ký Cổng Bằng chứng; giờ áp
ngoài 05:30–06:30 và 14:00–14:45 VN. Người làm: phiên ZCode vận hành theo lời GIAO của LL. Năm mục đủ ở
`_acceptance/go-kev-khoi-hook-s03/ap-may-thu/README.md`.

## Ngoài phạm vi

KEV2 (Ops, audit-all, push-ops-facts, ops-local) · L1 soát bản hook đã cài (lỗ cũ) · nhắc `:8009` trong `agent/README.md`,
`pipeline/scripts/bench-gate.mjs` · bỏ hẳn trường `kev`.
