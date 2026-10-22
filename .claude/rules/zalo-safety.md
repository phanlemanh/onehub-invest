---
paths:
  - "collector/openclaw/**"
  - "**/*zalo*"
  - "scripts/zalo-*.sh"
---

# An toàn Zalo (hiến pháp #5 — đã có 2 sự cố)

- Agent/LLM **không bao giờ** được gửi tin, trả lời, react hay tham gia nhóm Zalo. Không thêm
  tool, binding hay cấu hình nào mở đường gửi.
- Trước khi đụng OpenClaw (gateway, zalouser, hook `oneinvest-zalo-pipe`, `requireMention`,
  bindings): đọc `docs/ops/runtime-map.md`. Gateway canonical là launchd `ai.openclaw.gateway`;
  không chạy production từ `~/dev/openclaw`.
- Grep log đầy đủ ở `~/Library/Logs/openclaw/gateway.log`, không phải `/tmp/openclaw/`.
- Mọi thay đổi ống Zalo phải giữ watchdog 5′ xanh và kiểm cả hai phía: agent vẫn 0 turn
  VÀ tin vẫn chảy tới hook (đừng để "an toàn" che "0 tin").
- Nhóm thu: bất biến 1 nhóm – 1 tài khoản; quản trị allowlist ở `/ops/sources` (admin).
