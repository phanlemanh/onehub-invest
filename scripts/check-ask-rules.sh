#!/bin/bash
# check-ask-rules.sh — thước đo hồ sơ narrow-ask-rules.
#   static    : settings.json chỉ còn ask supabase db push / sync-public, đủ 9 deny, không hook
#               push/vercel; ui-lint chạy trên MỌI PR (để làm check bắt buộc được); AGENTS.md ghi
#               làn merge dùng `gh pr merge`.
#   mutation  : should-NOT-fire — bản sao bị làm hỏng từng chỗ (thêm lại ask rộng, mất ask giữ lại,
#               mất deny, ui-lint lọc paths lại, mất luật merge) → kiểm phải đỏ từng bản.
#   protection: branch protection của main trên GitHub (chỉ đọc, `gh api`): bắt buộc PR, check
#               `gate` + `ui-lint`, không cho admin vượt, cấm force-push và xoá nhánh.
#   protection-selftest: bộ đánh giá protection trên JSON giả — đủ thì xanh, thiếu từng mục thì đỏ.
set -uo pipefail
cd "$(dirname "$0")/.."
REPO="phanlemanh/onehub-invest"
FAIL=0
ok()  { echo "ok   $1"; }
bad() { echo "FAIL $1"; FAIL=1; }

# Kiểm cấu hình dưới thư mục gốc $1 (cây thật hoặc bản sao đột biến).
check_tree() {
  node - "$1" <<'EOF'
const fs = require("fs"), path = require("path");
const root = process.argv[2];
let fail = 0;
const ok = (m) => console.log("ok   " + m), bad = (m) => { console.log("FAIL " + m); fail = 1; };
const s = JSON.parse(fs.readFileSync(path.join(root, ".claude/settings.json"), "utf8"));
const same = (a, b) => a.length === b.length && a.every((x) => b.includes(x));
const ask = s.permissions?.ask ?? [];
const KEEP_ASK = ["Bash(bash tools/sync-public.sh *)", "Bash(supabase db push *)", "Bash(npx supabase db push *)"];
same(ask, KEEP_ASK) ? ok("ask chỉ còn sync-public + supabase db push (bỏ git push * / vercel * / npx vercel *)")
  : bad("ask = " + JSON.stringify(ask));
const DENY = ["Read(**/.env)", "Read(**/.env.local)", "Read(**/.env.production*)", "Read(**/*.har)",
  "Read(**/.airdna-profile/**)", "Edit(**/.airdna-profile/**)", "Edit(**/snapshots/**)",
  "Bash(git push --force *)", "Bash(git push -f *)"];
same(s.permissions?.deny ?? [], DENY) ? ok("đủ 9 luật deny, kể cả git push --force / -f") : bad("deny bị đổi: " + JSON.stringify(s.permissions?.deny));
const cmds = Object.values(s.hooks ?? {}).flat().flatMap((h) => h.hooks.map((x) => x.command));
const hookOk = cmds.length === 2 && cmds.some((c) => c.includes("guard-edits.sh")) && cmds.some((c) => c.includes("typecheck-changed.sh"));
hookOk ? ok("hook chỉ còn guard-edits + typecheck-changed (không hook push/vercel)") : bad("hooks = " + JSON.stringify(cmds));
const wf = fs.readFileSync(path.join(root, ".github/workflows/ui-lint.yml"), "utf8");
const pr = /^  pull_request:\n((?:    .*\n|\s*\n)*)/m.exec(wf);
pr && !/paths:/.test(pr[1]) ? ok("ui-lint chạy trên mọi PR (không lọc paths) — làm check bắt buộc được")
  : bad("ui-lint pull_request còn lọc paths → check bắt buộc treo ở PR không chạm app/");
const agents = fs.readFileSync(path.join(root, "AGENTS.md"), "utf8");
/gh pr merge/.test(agents) && /không .{0,40}git push.{0,40}main|không push thẳng/i.test(agents)
  ? ok("AGENTS.md: làn merge dùng gh pr merge, không push thẳng main") : bad("AGENTS.md thiếu luật merge qua gh pr merge");
process.exit(fail);
EOF
}

# Đánh giá JSON protection (stdin) — dùng cho cả gh api thật và fixture.
eval_protection() {
  node -e '
let s = ""; process.stdin.on("data", (d) => s += d).on("end", () => {
  let p; try { p = JSON.parse(s); } catch { console.log("FAIL không đọc được JSON protection"); process.exit(1); }
  if (p.status === "404" || /not protected/i.test(p.message ?? "")) { console.log("FAIL main CHƯA bật branch protection"); process.exit(1); }
  let fail = 0;
  const ok = (m) => console.log("ok   " + m), bad = (m) => { console.log("FAIL " + m); fail = 1; };
  p.required_pull_request_reviews ? ok("bắt buộc qua PR") : bad("chưa bắt buộc qua PR");
  const ctx = p.required_status_checks?.contexts ?? [];
  ["gate", "ui-lint"].every((c) => ctx.includes(c)) ? ok("check bắt buộc gồm gate + ui-lint") : bad("check bắt buộc = " + JSON.stringify(ctx));
  p.enforce_admins?.enabled === true ? ok("admin không được vượt (token của Mạnh mà các phiên dùng cũng bị chặn)") : bad("admin vượt được — phiên dùng token Mạnh vẫn push thẳng main");
  p.allow_force_pushes?.enabled === false ? ok("cấm force-push") : bad("cho force-push");
  p.allow_deletions?.enabled === false ? ok("cấm xoá nhánh main") : bad("cho xoá main");
  process.exit(fail);
});'
}

case "${1:-}" in
  static)
    check_tree . || FAIL=1
    for f in .claude/hooks/guard-push-deploy.sh .claude/hooks/guard-push-deploy.mjs; do
      [ -e "$f" ] && bad "còn tệp $f"
    done
    [ "$FAIL" -eq 0 ] && ok "không còn tệp hook guard-push-deploy"
    ;;
  mutation)
    TMP=$(mktemp -d); trap 'rm -rf "$TMP"' EXIT
    caught=0; total=0
    mutate() { # <tên> <tệp> <node: biến đổi chuỗi s>
      total=$((total + 1)); local d="$TMP/m$total"
      mkdir -p "$d/.claude" "$d/.github/workflows"
      cp .claude/settings.json "$d/.claude/"; cp .github/workflows/ui-lint.yml "$d/.github/workflows/"; cp AGENTS.md "$d/"
      node -e 'const fs=require("fs");const p=process.argv[1];let s=fs.readFileSync(p,"utf8");const t=eval(process.argv[2]);if(t===s){console.error("đột biến không đổi gì");process.exit(3)}fs.writeFileSync(p,t)' "$d/$2" "$3" \
        || { bad "[$1] không cấy được"; return; }
      if check_tree "$d" >/dev/null; then bad "[$1] kiểm vẫn xanh — thước đo không phân biệt"
      else caught=$((caught + 1)); ok "[$1] bị bắt"; fi
    }
    mutate "thêm lại ask git push *" .claude/settings.json 's.replace("\"ask\": [", "\"ask\": [\n      \"Bash(git push *)\",")'
    mutate "thêm lại ask vercel *" .claude/settings.json 's.replace("\"ask\": [", "\"ask\": [\n      \"Bash(vercel *)\",")'
    mutate "mất ask supabase db push" .claude/settings.json 's.replace("\"Bash(supabase db push *)\",", "")'
    mutate "mất ask sync-public" .claude/settings.json 's.replace("\"Bash(bash tools/sync-public.sh *)\",", "")'
    mutate "mất deny git push -f" .claude/settings.json 's.replace(",\n      \"Bash(git push -f *)\"", "")'
    mutate "ui-lint lọc paths lại" .github/workflows/ui-lint.yml 's.replace("  pull_request:\n", "  pull_request:\n    paths:\n      - \"app/**\"\n")'
    mutate "AGENTS.md mất luật gh pr merge" AGENTS.md 's.replace(/gh pr merge/g, "merge")'
    echo "bắt $caught/$total bản đột biến"
    [ "$caught" -eq "$total" ] || FAIL=1
    ;;
  protection)
    gh api "repos/$REPO/branches/main/protection" 2>/dev/null | eval_protection || FAIL=1
    ;;
  protection-selftest)
    GOOD='{"required_pull_request_reviews":{"required_approving_review_count":0},"required_status_checks":{"contexts":["gate","ui-lint"]},"enforce_admins":{"enabled":true},"allow_force_pushes":{"enabled":false},"allow_deletions":{"enabled":false}}'
    echo "$GOOD" | eval_protection >/dev/null && ok "fixture đủ → xanh" || bad "fixture đủ mà đỏ"
    n=0; c=0
    for jq_mut in 'del(.required_pull_request_reviews)' '.required_status_checks.contexts=["gate"]' '.enforce_admins.enabled=false' \
                  '.allow_force_pushes.enabled=true' '.allow_deletions.enabled=true' '{"message":"Branch not protected","status":"404"}'; do
      n=$((n + 1))
      if jq -c "$jq_mut" <<<"$GOOD" | eval_protection >/dev/null; then bad "fixture thiếu [$jq_mut] vẫn xanh"; else c=$((c + 1)); fi
    done
    echo "bắt $c/$n fixture thiếu"; [ "$c" -eq "$n" ] || FAIL=1
    ;;
  *) echo "dùng: $0 static|mutation|protection|protection-selftest"; exit 2 ;;
esac

if [ "$FAIL" -eq 0 ]; then echo "ASK-RULES $(tr a-z A-Z <<<"$1") PASS"; exit 0; fi
echo "ASK-RULES $(tr a-z A-Z <<<"$1") FAIL"; exit 1
