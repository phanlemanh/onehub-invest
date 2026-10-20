#!/bin/bash
# zalo-drift.sh — Phase 2: đối chiếu allowlist (config) với membership thật
# (directory) của từng tài khoản zalouser. Phát hiện:
#   a) nhóm ĐANG BẬT nhưng account không còn là thành viên (bị kick/rời)
#   b) cùng một nhóm bật ở ≥2 tài khoản (vi phạm bất biến 1 nhóm – 1 tài khoản)
# Alert ghi vào log hook (" alert drift ...") → hiện trên /ops/collections.
# Gọi từ zalo-heartbeat.sh (giới hạn 1 lần/giờ bằng mốc thời gian dòng cuối).
set -uo pipefail
LOG="$HOME/.openclaw/logs/oneinvest-zalo-pipe.log"
OPENCLAW="$HOME/.openclaw/bin/openclaw"
TS="$(date -u +%Y-%m-%dT%H:%M:%S.000Z)"
CFG="$HOME/.openclaw/openclaw.json"
[ -f "$CFG" ] || exit 0

# Directory membership per account (id nhóm) — lỗi CLI thì bỏ qua lần này
DIRS_JSON="$(python3 - "$CFG" <<'PY'
import json, subprocess, sys, os
cfg = json.load(open(sys.argv[1]))
z = cfg.get("channels", {}).get("zalouser", {}) or {}
accounts = {"default"}
for k in (z.get("accounts") or {}):
    accounts.add(k)
out = {}
cli = os.path.expanduser("~/.openclaw/bin/openclaw")
for acc in accounts:
    enabled = set()
    groups = (z.get("accounts", {}).get(acc, {}) or {}).get("groups") if acc != "default" else None
    if groups is None:
        groups = z.get("groups", {})  # default: layout cũ cấp channel
    for gid, v in (groups or {}).items():
        if isinstance(v, dict) and v.get("enabled", True) and v.get("allow", True):
            enabled.add(gid)
    try:
        args = [cli, "directory", "groups", "list", "--channel", "zalouser"]
        if acc != "default":
            args += ["--account", acc]
        r = subprocess.run(args, capture_output=True, text=True, timeout=45)
        import re
        member = set(re.findall(r"│\s*(group:\S+)\s*│", r.stdout))
    except Exception:
        member = None
    out[acc] = {"enabled": sorted(enabled), "member": sorted(member) if member is not None else None}
print(json.dumps(out))
PY
)" || exit 0

python3 - "$TS" "$DIRS_JSON" >> "$LOG" <<'PY'
import json, sys
ts, data = sys.argv[1], json.loads(sys.argv[2])
alerts = []
# (b) bất biến 1-1: cùng nhóm bật ở nhiều account
owner = {}
for acc, d in data.items():
    for g in d["enabled"]:
        if g in owner and owner[g] != acc:
            alerts.append(f"vi phạm 1-1: {g} bật ở cả {owner[g]} và {acc}")
        owner[g] = acc
# (a) bật mà không còn membership (chỉ khi directory đọc được)
for acc, d in data.items():
    if d["member"] is None:
        continue
    for g in d["enabled"]:
        if g not in d["member"]:
            alerts.append(f"stale: {g} bật ở {acc} nhưng không còn là thành viên")
for a in alerts:
    print(f"{ts} alert drift {a}")
PY
exit 0
