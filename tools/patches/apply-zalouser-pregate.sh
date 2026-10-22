#!/bin/bash
# apply-zalouser-pregate.sh — tái lập patch pregate sau khi zalouser plugin
# update ghi đè chunk monitor. Nguyên nhân + thiết kế: docs/ops/runtime-map.md.
# Patch: 3 điểm drop (empty-content, mention-no-detect, mention-drop) gọi
# thẳng handler oneinvest-zalo-pipe (fail-soft) — thu S03 sống khi
# requireMention=true. Verify: bash scripts/zalo-watchdog.sh exit 0.
set -euo pipefail
CHUNK=$(ls ~/.openclaw/extensions/zalouser/dist/.setup/monitor-*.mjs | head -1)
grep -q "oneinvest-pregate-patch" "$CHUNK" && { echo "đã patch rồi"; exit 0; }
cp "$CHUNK" "$CHUNK.bak-$(date +%s)"
python3 << PYEOF
M = "$CHUNK"
s = open(M).read()
EMIT = """
const __oiEmit = (message, account, chatId, extra) => {
  try {
    import("file:///Users/manhphan/.openclaw/hooks/oneinvest-zalo-pipe/handler.js")
      .then((m) => m.default({
        channelId: "zalouser",
        content: (message.content ?? "").trim(),
        timestamp: message.timestampMs,
        accountId: account?.accountId ?? "default",
        conversationId: chatId,
        messageId: message.msgId ?? message.cliMsgId,
        metadata: {
          channelName: (extra && extra.channelName) || chatId,
          threadId: chatId,
          senderId: message.senderId,
          senderName: message.senderName,
          account: account?.accountId ?? "default",
          __pregate: (extra && extra.reason) || "pregate",
          __raw: JSON.stringify(message).slice(0, 600),
        },
      }))
      .catch(() => {});
  } catch {}
};
"""
last_imp = 0
for key in ['import "]', "import '"]:
    p = s.rfind(key)
    if p > last_imp: last_imp = p
end_of_line = s.index('\\n', last_imp) + 1
s = s[:end_of_line] + '// [oneinvest-pregate-patch v1]\\n' + EMIT + '\\n' + s[end_of_line:]
s = s.replace('\\tif (!rawBody) return;',
  '\\tif (!rawBody) {\\n\\t\\t__oiEmit(message, account, message.threadId, { reason: "empty-content" });\\n\\t\\treturn;\\n\\t}', 1)
for marker, reason in [('zalouser mention required but detection unavailable', 'mention-no-detect'),
                        ('reason: "no mention"', 'mention-drop')]:
    i = s.find(marker); assert i > 0, marker
    j = s.index('return;', i)
    ins = f'__oiEmit(message, account, chatId, {{ reason: "{reason}", channelName: groupName || configuredGroupName }});\\n\\t\\t'
    s = s[:j] + ins + s[j:]
open(M, 'w').write(s)
print("PATCH OK")
PYEOF
launchctl bootout gui/$(id -u)/ai.openclaw.gateway 2>/dev/null || true; sleep 3
~/.openclaw/bin/openclaw daemon install >/dev/null 2>&1
echo "restart xong — verify watchdog"
