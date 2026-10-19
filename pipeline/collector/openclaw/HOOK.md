---
name: oneinvest-zalo-pipe
description: "Tin nhóm Zalo (zalouser) → Kev gate → POST One Invest collector :9210 — model không nằm trên đường dữ liệu"
metadata:
  { openclaw: { emoji: "🏠", events: ["message:received"], requires: { bins: [] } } }
---

# One Invest Zalo Pipe (C3)

Nhận `message:received` từ channel zalouser: chấm decision model Kev
"là tin rao BĐS?" (ngưỡng 0.9) → đúng thì POST nguyên văn về
`http://127.0.0.1:9210/agent-report` (raw zone theo DATA-CONTRACT).
Không trả lời, không đổi hành vi agent — hook chỉ quan sát + side effect.

Log: `~/.openclaw/logs/oneinvest-zalo-pipe.log`
