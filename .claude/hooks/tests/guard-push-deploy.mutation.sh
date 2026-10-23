#!/bin/bash
# Thước đo của thước đo (hồ sơ narrow-ask-rules): selftest phải ĐỎ khi hook bị làm hỏng.
# Chép hook ra thư mục tạm, cấy từng lỗi một vào guard-push-deploy.mjs, chạy selftest với
# GUARD_HOOK trỏ bản hỏng → mỗi bản đột biến phải bị selftest bắt (exit ≠ 0).
# Không sửa hook thật. Luôn gỡ thư mục tạm (trap).
set -uo pipefail

REPO="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"
SELFTEST="$REPO/.claude/hooks/tests/guard-push-deploy.selftest.sh"
TMP="$(mktemp -d "${TMPDIR:-/tmp}/onehub-guard-mutation.XXXXXX")"
trap 'rm -rf "$TMP"' EXIT
fails=0; caught=0

# tên ¤ chuỗi gốc (phải có đúng trong .mjs) ¤ chuỗi thay
MUTANTS=(
  'main không còn được bảo vệ¤const PROTECTED = new Set(["main", "master"]);¤const PROTECTED = new Set([]);'
  'bỏ kiểm push không refspec¤if (refspecs.length === 0) return checkImplicitPush(ctx);¤if (refspecs.length === 0) return null;'
  'bỏ kiểm force¤if (name.startsWith("--force")) return `git push ${name} (force)`;¤if (false) return "";'
  'vercel luôn cho qua¤function checkVercel(args) {¤function checkVercel(args) { return null;'
  'vercel lệnh con lạ cho qua¤return `vercel ${sub} — thao tác ghi hoặc không rõ`;¤return null;'
  'chỉ xét vế đầu của lệnh ghép¤for (const seg of segments) {¤for (const seg of segments.slice(0, 1)) {'
  'bỏ đệ quy bash -c / heredoc¤const r = analyzeSegments(splitCommands(body), { dir: state.dir, raw: body, vars: new Map(state.vars) }, depth + 1);¤const r = null;'
  'lỗi phân tích thành cho qua¤if (e instanceof Unsure) return `không phân tích được lệnh (${e.message})`;¤if (e instanceof Unsure) return null;'
  'vercel api ghi cho qua¤if (["-F", "--field", "-f", "--raw-field", "--input"].includes(name)) return `vercel api ${name} (có thân request = ghi)`;¤if (false) return "";'
  'biến tĩnh không được thay¤return name && vars.has(name) ? { text: vars.get(name) + m[3], dynamic: false } : w;¤return { text: "/", dynamic: false };'
  'hỏi mọi thứ (PASS phải đỏ)¤if (!/push|vercel/.test(command)) return null; // đường nhanh¤return "luôn hỏi";'
)

echo "[narrow-ask-rules] mutation (selftest phải bắt từng bản hỏng)"
for m in "${MUTANTS[@]}"; do
  name="${m%%¤*}"; rest="${m#*¤}"; from="${rest%%¤*}"; to="${rest#*¤}"
  d="$TMP/m$((caught + fails))"; mkdir -p "$d"
  cp "$REPO/.claude/hooks/guard-push-deploy.sh" "$REPO/.claude/hooks/guard-push-deploy.mjs" "$d/"
  FROM="$from" TO="$to" node -e '
    const fs = require("fs"); const p = process.argv[1]; const s = fs.readFileSync(p, "utf8");
    if (!s.includes(process.env.FROM)) { console.error("không thấy chuỗi gốc"); process.exit(3); }
    fs.writeFileSync(p, s.replace(process.env.FROM, process.env.TO));' "$d/guard-push-deploy.mjs"
  if [ $? -ne 0 ]; then echo "  FAIL  [$name] không cấy được (chuỗi gốc đã đổi?)"; fails=$((fails + 1)); continue; fi
  out="$(GUARD_HOOK="$d/guard-push-deploy.sh" bash "$SELFTEST" 2>&1)"; rc=$?
  if [ "$rc" -ne 0 ]; then
    caught=$((caught + 1)); echo "  OK    [$name] bị bắt: $(grep -c '^  FAIL' <<<"$out") kiểm đỏ"
  else
    fails=$((fails + 1)); echo "  FAIL  [$name] selftest vẫn xanh — thước đo không phân biệt"
  fi
done

echo "bắt $caught/${#MUTANTS[@]} bản đột biến"
if [ "$fails" -eq 0 ]; then echo "PASS"; exit 0; fi
echo "FAIL ($fails bản đột biến lọt)"; exit 1
