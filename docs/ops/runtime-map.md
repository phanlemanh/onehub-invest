# Runtime Map — môi trường vận hành một-hub (chốt 2026-10-22)

> Truy nguyên sự cố: file này là bản đồ THẬT của mọi tiến trình/binary/log
> liên quan thu thập. Sửa khi đổi môi trường.

## Bảng chân lý 5 thành phần

| Thành phần | Vai trò CHỐT | Vẫn cần? | Ghi chú vận hành |
|---|---|---|---|
| **OpenClaw headless gateway** (launchd `ai.openclaw.gateway`, runtime `~/.openclaw/runtime/2026.10.5…`) | **CANONICAL** — chạy zalouser provider (poll Zalo ~10′/lần), hooks, đã chứng minh tự polling | ✅ DUY NHẤT | KeepAlive; log ×2: `/tmp/openclaw/openclaw-YYYY-MM-DD.log` (console) + `~/Library/Logs/openclaw/gateway.log` (đầy đủ — **grep cái này!**) |
| OpenClaw Desktop (/Applications) | Không cần cho vận hành — headless làm được tất | ❌ (user được phép remove) | Không cài thêm Login Items |
| ~/dev/openclaw (source 4.4G, main branch) | **Tham chiếu source để vá plugin** (checkout tag 2026.10.5 trước khi build) | ✅ GIỮ (dev) | KHÔNG chạy production từ đây |
| Zalo PC app / Zalo Web (Chrome) | **KHÔNG liên quan thu thập** — provider zca-js poll server Zalo trực tiếp bằng session QR-link | ❌ | Tiện cá nhân của user, muốn dùng thì dùng |
| Kev :8009, collector :9210, MTPLX :8000 | Hạ tầng phụ thuộc hook | ✅ | launchd KeepAlive đã có |

## Chuỗi tin Zalo (đúng như đã verify)

```
zca-js poll Zalo server (session QR-link, mỗi ~10′)
→ zalouser monitor (core gateway bundle)
→ [MENTION GATE]  ← ĐIỂM CHẾT: requireMention=true drop tin THƯỜNG
   │                  TRƯỚC khi hook thấy (log "drop no mention")
→ processMessage → internal hook "oneinvest-zalo-pipe" → Kev → :9210
→ (song song) agent auto-reply turn —-layer nguy hiểm
```

## Bài học 2 sự cố + 1 mù (2026-10-20→22)

1. Sự cố 1: bindings kích agent reply → xoá bindings.
2. Sự cố 2: bindings=[] chưa đủ — auto-reply channel vẫn turn → requireMention=true.
3. MÙ hôm nay: requireMention=true **đồng thời giết thu thập** (drop trước
   hook) — watchdog báo "an toàn" vì 0 turn, nhưng thực chất 0 TIN. Watchdog
   phải cảnh báo "collection starved": linked + groups bật mà 0 tin/24h.

## Fix đã chọn (chưa làm): port pluginHooks từ WhatsApp sang zalouser

WhatsApp có `pluginHooks.messageReceived` (channel + account level) — phát
hook **trước mention-gate**, agent vẫn mention-only. Zalouser 2026.10.5
CHƯA có. Cách làm đúng:
1. `cd ~/dev/openclaw && git checkout v2026.10.5` (khớp runtime đã cài)
2. Port pattern từ `extensions/whatsapp/src/auto-reply/monitor/process-message.ts`
   (emit hooks trước gate) sang `extensions/zalouser/src/monitor.ts` +
   thêm option vào config-schema
3. Build extension → cài vào `~/.openclaw/extensions/zalouser`
4. Config: `pluginHooks.messageReceived=true` + GIỮ requireMention=true
5. Verify: tin thường chảy tới hook (dbg-media bắt media shape!), agent
   vẫn 0 turn; watchdog thêm check collection-starved
6. (Tuỳ chọn) PR upstream — pattern chung cho mọi channel.

## Vận hành lâu dài

- Sau fix: không cần mở app nào; reboot → launchd tự dậy toàn chuỗi.
- Watchdog v3: thêm (a) grep "drop no mention" tăng bất thường = cấu hình
  lệch, (b) collection-starved alert, (c) check patch còn nguyên
  (marker string trong dist).
- User dọn (tuỳ chọn): remove OpenClaw Desktop app; giữ ~/dev/openclaw
  tới khi PR upstream xong.
