#!/usr/bin/env bash
# chay-eval.sh — dành cho PHIÊN CHẤM: chạy MỘT lệnh eval rồi ghi sổ chạy NGAY lúc chạy bằng máy (một dòng JSON cho
# mỗi evalId dùng lệnh đó). Lệnh chạy từ gốc repo; đầu ra của lệnh đi thẳng ra màn hình; kết thúc in dòng __EXIT=<mã>.
#   bash _acceptance/<slug>/probes/chay-eval.sh "<E1 E2 …>" <vòng> "<lệnh đã resolve nguyên văn>"
# Dòng ghi ở _acceptance/<slug>/run-log.jsonl: ts (ISO UTC lúc lệnh xong) · sha (HEAD lúc chạy) · round · evalId ·
# run_id (minted-<slug>-<evalId>-r<vòng>) · exit_code (mã thoát thật của lệnh) · cmd (nguyên văn chuỗi đã truyền).
# Nếu lệnh bị CÔNG CỤ giết (timeout/killed) thì wrapper chết theo và KHÔNG ghi dòng nào — phiên chấm tự khai
# killedByTool/cannot_run theo luật chạy lệnh. Lệnh nặng (trọn bộ test) vẫn phải kiểm điều kiện máy TRƯỚC khi gọi.
set -uo pipefail
VEP="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SLUG="$(basename "$(dirname "$VEP")")"
ROOT="$(cd "$VEP/../../.." && pwd)"
IDS="${1:?thiếu danh sách evalId}"; VONG="${2:?thiếu số vòng}"; CMD="${3:?thiếu lệnh}"
SHA="$(git -C "$ROOT" rev-parse HEAD)" || { echo "ĐỎ: không đọc được HEAD" >&2; exit 2; }
( cd "$ROOT" && bash -c "$CMD" )
RC=$?
node -e '
const [root, slug, sha, vong, cmd, rc, ids] = process.argv.slice(1);
const ts = new Date().toISOString();
const out = require("node:fs").createWriteStream(`${root}/_acceptance/${slug}/run-log.jsonl`, { flags: "a" });
for (const id of ids.split(/\s+/).filter(Boolean)) out.write(JSON.stringify({ ts, sha, round: Number(vong), evalId: id, run_id: `minted-${slug}-${id}-r${vong}`, exit_code: Number(rc), cmd }) + "\n");
out.end();' "$ROOT" "$SLUG" "$SHA" "$VONG" "$CMD" "$RC" "$IDS"
echo "__EXIT=$RC" >&2
exit "$RC"
