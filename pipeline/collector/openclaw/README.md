# OpenClaw integration (C3)

Hook `oneinvest-zalo-pipe` chạy TRONG gateway OpenClaw (~/.openclaw/hooks/) —
bản version-controlled nằm ở đây. Cài lại sau khi đổi máy:

```bash
mkdir -p ~/.openclaw/hooks/oneinvest-zalo-pipe
cp collector/openclaw/HOOK.md collector/openclaw/handler.js ~/.openclaw/hooks/oneinvest-zalo-pipe/
openclaw hooks enable oneinvest-zalo-pipe
```

Đường dẫn: `message:received` (zalouser) → Kev gate :8009 (noul ≥0.9) →
POST :9210/agent-report (key ở ~/.openclaw/credentials/oneinvest-agent.key).
Log: ~/.openclaw/logs/oneinvest-zalo-pipe.log.
Kèm: watcher agent (thinking low) bind zalouser — chỉ NO_REPLY mỗi turn.
