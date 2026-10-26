#!/usr/bin/env bash
# AC-7 — gói tri-thuc cài scope local cho checkout chính; .claude/settings.json (t3_paths) không đổi so với nền.
set -uo pipefail; . "$(dirname "$0")/_chung.sh"
cd "$ROOT" || exit 2
main="$(dirname "$(git rev-parse --path-format=absolute --git-common-dir)")"
base="$(git merge-base HEAD origin/main)"
git diff --quiet "$base" HEAD -- .claude/settings.json && ok ".claude/settings.json: không đổi so với nền ${base:0:8}" || bad ".claude/settings.json đổi"
node -e '
const d=require(process.env.HOME+"/.claude/plugins/installed_plugins.json").plugins["tri-thuc@acceptance-gate-kit"]||[];
const e=d.find(x=>x.scope==="local"&&x.projectPath===process.argv[1]);
if(!e){console.log("thiếu bản ghi local");process.exit(1)} console.log("bản ghi: scope local, "+e.version)' "$main" && ok "installed_plugins.json: tri-thuc scope local cho $main" || bad "không có bản ghi tri-thuc scope local"
node -e 'const s=require(process.argv[1]);process.exit(s.enabledPlugins&&s.enabledPlugins["tri-thuc@acceptance-gate-kit"]===true?0:1)' "$main/.claude/settings.local.json" && ok "settings.local.json (gitignored) bật tri-thuc" || bad "settings.local.json chưa bật tri-thuc"
git -C "$main" check-ignore -q .claude/settings.local.json && ok "settings.local.json bị git bỏ qua" || bad "settings.local.json không bị bỏ qua"
[ $fail -eq 0 ] && echo "KHONG-CHAM OK" || { echo "KHONG-CHAM FAIL"; exit 1; }
