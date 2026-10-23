#!/bin/bash
# Selftest hook PreToolUse `.claude/hooks/guard-push-deploy.sh` (hồ sơ narrow-ask-rules).
# Dựng repo git tạm (không remote, không mạng) với các nhánh main, feat/x (upstream main),
# claude/y (upstream claude/y), rồi đưa JSON hook giả vào hook thật:
#   - nhóm ASK: lệnh phải ra permissionDecision "ask";
#   - nhóm PASS: lệnh phải im lặng (exit 0, không output);
#   - nhóm FAIL-CLOSED: node hỏng / input hỏng → vẫn "ask" hoặc không cho qua lặng lẽ;
#   - settings.json: hai luật ask rộng đã bỏ, ask/deny còn lại giữ, hook đã đăng ký.
# Không push, không gọi vercel thật. Luôn gỡ repo tạm (trap). Không sửa cây làm việc thật.
set -uo pipefail

REPO="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"
HOOK="${GUARD_HOOK:-$REPO/.claude/hooks/guard-push-deploy.sh}"   # GUARD_HOOK: bản đột biến (mutation.sh)
TMP="$(mktemp -d "${TMPDIR:-/tmp}/onehub-guard-selftest.XXXXXX")"
before="$(git -C "$REPO" status --porcelain)"
fails=0
n_ask=0; n_pass=0

cleanup() { rm -rf "$TMP"; }
trap cleanup EXIT

ok()   { echo "  OK    $*"; }
fail() { echo "  FAIL  $*"; fails=$((fails + 1)); }

echo "[narrow-ask-rules] hook selftest (guard-push-deploy.sh)"
command -v jq >/dev/null || { echo "  FAIL  thiếu jq"; exit 1; }
command -v node >/dev/null || { echo "  FAIL  thiếu node"; exit 1; }

# Repo tạm: main, feat/x theo dõi main, claude/y theo dõi chính nó, và một worktree detached.
R="$TMP/repo"
git init -q -b main "$R" && git -C "$R" -c user.email=t@t -c user.name=t commit -q --allow-empty -m init || { echo "  FAIL  không dựng được repo tạm"; exit 1; }
git -C "$R" config push.default simple
git -C "$R" branch -q feat/x && git -C "$R" config branch.feat/x.remote origin && git -C "$R" config branch.feat/x.merge refs/heads/main
git -C "$R" branch -q claude/y && git -C "$R" config branch.claude/y.remote origin && git -C "$R" config branch.claude/y.merge refs/heads/claude/y
git -C "$R" branch -q fix/z
mkdir -p "$TMP/main" "$TMP/featx" "$TMP/claudey" "$TMP/fixz" "$TMP/detached"
git -C "$R" worktree add -q "$TMP/featx" feat/x
git -C "$R" worktree add -q "$TMP/claudey" claude/y
git -C "$R" worktree add -q "$TMP/fixz" fix/z
git -C "$R" worktree add -q --detach "$TMP/detached" main
ok "repo tạm: $R (main · feat/x→main · claude/y→claude/y · fix/z · detached)"

# run_hook <cwd> <lệnh> → in output của hook; rc của hook qua biến hrc.
run_hook() {
  local payload
  payload=$(jq -n --arg c "$2" --arg d "$1" '{tool_name:"Bash",tool_input:{command:$c},cwd:$d,hook_event_name:"PreToolUse"}')
  hout=$(CLAUDE_PROJECT_DIR="$REPO" bash "$HOOK" <<<"$payload" 2>&1); hrc=$?
}
expect_ask() { # <cwd> <lệnh>
  run_hook "$1" "$2"
  if [ "$hrc" -eq 0 ] && [ "$(jq -r '.hookSpecificOutput.permissionDecision // empty' <<<"$hout" 2>/dev/null)" = "ask" ]; then
    n_ask=$((n_ask + 1)); ok "ASK   [$(basename "$1")] $2"
  else fail "cần ASK  [$(basename "$1")] $2 → rc=$hrc out=$hout"; fi
}
expect_pass() {
  run_hook "$1" "$2"
  if [ "$hrc" -eq 0 ] && [ -z "$hout" ]; then
    n_pass=$((n_pass + 1)); ok "PASS  [$(basename "$1")] $2"
  else fail "cần PASS [$(basename "$1")] $2 → rc=$hrc out=$hout"; fi
}

M="$R"; F="$TMP/featx"; C="$TMP/claudey"; Z="$TMP/fixz"; D="$TMP/detached"

echo "-- git push đích main/master → ASK"
expect_ask  "$C" "git push origin main"
expect_ask  "$C" "git push origin master"
expect_ask  "$C" "git push origin HEAD:main"
expect_ask  "$C" "git push origin HEAD:refs/heads/main"
expect_ask  "$C" "git push origin refs/heads/main"
expect_ask  "$C" "git push origin claude/y:main"
expect_ask  "$C" "git push origin +main"
expect_ask  "$C" "git push origin :main"
expect_ask  "$C" "git push origin --delete main"
expect_ask  "$C" "git push --all origin"
expect_ask  "$C" "git push --mirror origin"
expect_ask  "$C" "git push --branches"
expect_ask  "$C" "git push -u origin claude/y main"
expect_ask  "$C" "git push origin 'refs/heads/*:refs/heads/*'"
expect_ask  "$M" "git push"
expect_ask  "$M" "git push origin"
expect_ask  "$M" "git push -u origin HEAD"
expect_ask  "$M" "git push origin @"
expect_ask  "$F" "git push"
expect_ask  "$F" "git push origin"
expect_ask  "$D" "git push"
expect_ask  "$D" "git push origin HEAD"
expect_ask  "$C" "git -C $M push"
expect_ask  "$C" "git -C $M push origin HEAD"
expect_ask  "$C" "cd $M && git push"
expect_ask  "$C" "git -c push.default=current push origin main"
expect_ask  "$C" "git --no-pager push origin main"

echo "-- force (deny trong settings chỉ bắt khi cờ đứng đầu) → ASK"
expect_ask  "$C" "git push origin claude/y --force"
expect_ask  "$C" "git push -uf origin claude/y"
expect_ask  "$C" "git push --force-with-lease origin claude/y"
expect_ask  "$C" "git push origin +claude/y"

echo "-- lệnh ghép / lồng: xét từng vế → ASK"
expect_ask  "$C" "npm test && git push origin main"
expect_ask  "$C" "git status; git push origin main"
expect_ask  "$C" "git push origin claude/y || git push origin main"
expect_ask  "$C" "echo x | git push origin main"
expect_ask  "$C" "(cd $M && git push)"
expect_ask  "$C" "echo \$(git push origin main)"
expect_ask  "$C" "bash -c 'git push origin main'"
expect_ask  "$C" "sh -c \"cd $M && git push\""
expect_ask  "$C" "eval git push origin main"
expect_ask  "$C" "FOO=1 git push origin main"
expect_ask  "$C" "env GIT_TRACE=1 git push origin main"
expect_ask  "$C" "timeout 60 git push origin main"
expect_ask  "$C" $'bash <<\'EOF\'\ngit push origin main\nEOF'
expect_ask  "$C" "echo 'git push origin main' | bash"
expect_ask  "$C" "git push origin \$BRANCH"
expect_ask  "$C" "git push origin \"\$(git branch --show-current)\""
expect_ask  "$C" "cd \$ROOT && git push"
expect_ask  "$C" "git push origin 'main"
expect_ask  "$C" "W=$M; cd \$W && git push"
expect_ask  "$C" "D=\$(mktemp -d); cd \$D && git push"
expect_ask  "$C" $'gh pr create --body "$(cat <<\'EOF\'\nmở ngoặc ( không đóng\nEOF\n)" && git push origin main'

echo "-- vercel ghi → ASK"
expect_ask  "$C" "vercel"
expect_ask  "$C" "vercel deploy"
expect_ask  "$C" "vercel deploy --prebuilt"
expect_ask  "$C" "vercel --prod"
expect_ask  "$C" "vercel ls --prod"
expect_ask  "$C" "vercel --cwd app --prod"
expect_ask  "$C" "vercel ./app"
expect_ask  "$C" "vercel promote dpl_123"
expect_ask  "$C" "vercel rollback"
expect_ask  "$C" "vercel redeploy dpl_123"
expect_ask  "$C" "vercel alias set a.vercel.app b.example.com"
expect_ask  "$C" "vercel alias a.vercel.app b.example.com"
expect_ask  "$C" "vercel rm dpl_123"
expect_ask  "$C" "vercel remove onehub-invest"
expect_ask  "$C" "vercel env add FOO production"
expect_ask  "$C" "vercel env rm FOO production"
expect_ask  "$C" "vercel env pull .env.local"
expect_ask  "$C" "vercel env"
expect_ask  "$C" "vercel domains add example.com"
expect_ask  "$C" "vercel domains rm example.com"
expect_ask  "$C" "vercel project rm onehub-invest"
expect_ask  "$C" "vercel link --yes"
expect_ask  "$C" "vercel git connect"
expect_ask  "$C" "vercel git disconnect"
expect_ask  "$C" "vercel pull"
expect_ask  "$C" "vercel --scope team-x deploy"
expect_ask  "$C" "vercel --token=abc deploy"
expect_ask  "$C" "npx vercel"
expect_ask  "$C" "npx vercel --prod"
expect_ask  "$C" "npx -y vercel@latest deploy"
expect_ask  "$C" "npx vercel env add FOO"
expect_ask  "$C" "pnpm dlx vercel promote x"
expect_ask  "$C" "cd app && vercel --prod --yes"
expect_ask  "$C" "./node_modules/.bin/vercel deploy"
expect_ask  "$C" "vercel ls | head; vercel deploy"
expect_ask  "$C" "vercel api /v9/projects/x -X PATCH --input p.json"
expect_ask  "$C" "vercel api /v9/projects/x --method=DELETE"
expect_ask  "$C" "vercel api /v9/projects/x -F name=y"
expect_ask  "$C" "vercel api /v9/projects/x -X \$M"

echo "-- push nhánh riêng → PASS"
expect_pass "$C" "git push origin claude/y"
expect_pass "$C" "git push -u origin claude/y"
expect_pass "$C" "git push -u origin HEAD"
expect_pass "$C" "git push"
expect_pass "$C" "git push origin"
expect_pass "$Z" "git push -u origin fix/z"
expect_pass "$Z" "git push origin HEAD"
expect_pass "$C" "git push origin feat/a"
expect_pass "$C" "git push origin docs/a"
expect_pass "$C" "git push origin chore/a"
expect_pass "$C" "git push origin zcode/a"
expect_pass "$C" "git push origin HEAD:refs/heads/claude/y"
expect_pass "$C" "git push origin feat/main-page"
expect_pass "$C" "git push --tags origin"
expect_pass "$C" "git push origin v1.2.0"
expect_pass "$C" "git -C $Z push -u origin fix/z"
expect_pass "$C" "git add -A && git commit -m 'x' && git push -u origin claude/y"
expect_pass "$C" "git push -u origin claude/y 2>&1 | tail -5"
expect_pass "$C" "cd $Z && git push"
expect_pass "$C" "W=$C; cd \"\$W\" && git push"
expect_pass "$C" $'gh pr create --body "$(cat <<\'EOF\'\nmở ngoặc ( không đóng\nEOF\n)" && git push -u origin claude/y'

echo "-- vercel đọc → PASS"
expect_pass "$C" "vercel ls"
expect_pass "$C" "vercel list onehub-invest"
expect_pass "$C" "vercel inspect https://x.vercel.app --logs"
expect_pass "$C" "vercel logs https://x.vercel.app"
expect_pass "$C" "vercel env ls"
expect_pass "$C" "vercel env ls production"
expect_pass "$C" "vercel whoami"
expect_pass "$C" "vercel project ls"
expect_pass "$C" "vercel projects list"
expect_pass "$C" "vercel domains ls"
expect_pass "$C" "vercel alias ls"
expect_pass "$C" "vercel --version"
expect_pass "$C" "vercel help deploy"
expect_pass "$C" "vercel --scope team-x ls"
expect_pass "$C" "npx vercel ls"
expect_pass "$C" "npx -y vercel@latest env ls"
expect_pass "$C" "cd app && npx vercel inspect x --scope team"
expect_pass "$C" "vercel api /v9/projects/x --scope s 2>/dev/null | node -e 'x'"
expect_pass "$C" "vercel api /v6/deployments -X GET --paginate"
expect_pass "$C" "vercel api list"
expect_pass "$C" "vercel env ls --project \$p"

echo "-- không liên quan (kể cả nhắc chữ push/vercel) → PASS"
expect_pass "$C" "npm test"
expect_pass "$C" "git status && git log --oneline -5"
expect_pass "$C" "grep -rn 'git push origin main' docs/"
expect_pass "$C" "echo 'vercel --prod'"
expect_pass "$C" "cat vercel.json"
expect_pass "$C" "rg vercel app/"
expect_pass "$C" "gh pr create --title 'push docs'"
expect_pass "$C" $'cat <<\'EOF\' > note.md\ngit push origin main\nvercel --prod\nEOF'
expect_pass "$C" $'ego-browser nodejs <<\'EOF\'\nconst a = []; a.push(1);\nEOF'
expect_pass "$C" "git stash push -m tag"

echo "-- fail-closed"
# input không phải JSON nhưng có chữ push → ask
hout=$(CLAUDE_PROJECT_DIR="$REPO" bash "$HOOK" <<<'not json git push' 2>&1); hrc=$?
[ "$hrc" -eq 0 ] && grep -q '"ask"' <<<"$hout" && ok "input hỏng → ask" || fail "input hỏng → rc=$hrc out=$hout"
# node vắng mặt (PATH tối thiểu không có node) → ask
payload=$(jq -n '{tool_name:"Bash",tool_input:{command:"git push origin main"},cwd:"/"}')
hout=$(PATH=/usr/bin:/bin bash -c "command -v node >/dev/null && echo has-node || bash '$HOOK'" <<<"$payload" 2>&1)
if [ "$hout" = "has-node" ]; then ok "node có trong /usr/bin — bỏ qua kiểm thiếu node"
elif grep -q '"ask"' <<<"$hout"; then ok "thiếu node → ask"; else fail "thiếu node → $hout"; fi
# node script lỗi (giả bằng NODE_OPTIONS hỏng) → ask
hout=$(NODE_OPTIONS=--khong-ton-tai bash "$HOOK" <<<"$payload" 2>&1)
grep -q '"ask"' <<<"$hout" && ok "node lỗi khi chạy → ask" || fail "node lỗi → $hout"
# tool khác Bash → im lặng
hout=$(bash "$HOOK" <<<'{"tool_name":"Read","tool_input":{"file_path":"/x/push"}}' 2>&1)
[ -z "$hout" ] && ok "tool khác Bash → im lặng" || fail "tool khác Bash → $hout"

echo "-- settings.json"
S="$REPO/.claude/settings.json"
jq -e '.permissions.ask | index("Bash(git push *)") == null and index("Bash(vercel *)") == null and index("Bash(npx vercel *)") == null' "$S" >/dev/null \
  && ok "đã bỏ ask rộng git push * / vercel * / npx vercel *" || fail "còn luật ask rộng"
jq -e '.permissions.ask | (index("Bash(supabase db push *)") != null) and (index("Bash(npx supabase db push *)") != null) and (index("Bash(bash tools/sync-public.sh *)") != null)' "$S" >/dev/null \
  && ok "giữ ask supabase db push / npx supabase db push / sync-public" || fail "mất ask supabase/sync-public"
jq -e '.permissions.deny | (index("Bash(git push --force *)") != null) and (index("Bash(git push -f *)") != null) and length == 9' "$S" >/dev/null \
  && ok "giữ đủ 9 luật deny, kể cả --force/-f" || fail "deny bị đổi"
jq -e '[.hooks.PreToolUse[] | select(.matcher == "Bash") | .hooks[].command] | any(test("guard-push-deploy.sh"))' "$S" >/dev/null \
  && ok "hook guard-push-deploy.sh đăng ký PreToolUse matcher Bash" || fail "hook chưa đăng ký"
[ -x "$HOOK" ] && ok "hook có quyền chạy" || fail "hook thiếu +x"

cleanup; trap - EXIT
[ ! -e "$TMP" ] && ok "repo tạm đã gỡ" || fail "repo tạm còn"
[ "$(git -C "$REPO" status --porcelain)" = "$before" ] && ok "cây làm việc thật không đổi" || fail "cây làm việc thật bị đổi"

echo "tổng: $n_ask ASK · $n_pass PASS đúng kỳ vọng"
if [ "$fails" -eq 0 ]; then echo "PASS"; exit 0; fi
echo "FAIL ($fails kiểm hỏng)"; exit 1
