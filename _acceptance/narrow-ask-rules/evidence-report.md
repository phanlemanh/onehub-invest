---
schema_version: 2
feature_slug: narrow-ask-rules
verdict: PASS
failed_evals: []
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: a7a5b5f29fe5f6027f6bfd3d7c283b1ba89060b8
human_signoff: Mạnh 2026-10-23
---

# Evidence Report: narrow-ask-rules

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | script | PASS |
| E2 | AC-2 | script | PASS |
| E3 | AC-3 | script | PASS |
| E4 | AC-4 | script | PASS |
| E5 | AC-5 | script | PASS |
| E6 | AC-6 | script | PASS |
| E7 | AC-7 | script | PASS |
| E8 | AC-8 | script | PASS |

## Evidence

- eval: E1
  run_id: narrow-ask-rules-E1-20261023T114327
  exit_code: 0
  baseline: red
  verifier: config:executors.script.ask_rules_static
  verified_at: 2026-10-23T04:43:27Z
  output: |
    ok   ask chỉ còn sync-public + supabase db push (bỏ git push * / vercel * / npx vercel *)
    ok   đủ 9 luật deny, kể cả git push --force / -f
    ok   hook chỉ còn guard-edits + typecheck-changed (không hook push/vercel)
    ok   ui-lint chạy trên mọi PR (không lọc paths) — làm check bắt buộc được
    ok   AGENTS.md: làn merge dùng gh pr merge, không push thẳng main
    ok   không còn tệp hook guard-push-deploy
    ASK-RULES STATIC PASS

- eval: E2
  run_id: narrow-ask-rules-E2-20261023T114328
  exit_code: 0
  baseline: green
  verifier: config:executors.script.ask_rules_static
  verified_at: 2026-10-23T04:43:28Z
  output: |
    ok   ask chỉ còn sync-public + supabase db push (bỏ git push * / vercel * / npx vercel *)
    ok   đủ 9 luật deny, kể cả git push --force / -f
    ok   hook chỉ còn guard-edits + typecheck-changed (không hook push/vercel)
    ok   ui-lint chạy trên mọi PR (không lọc paths) — làm check bắt buộc được
    ok   AGENTS.md: làn merge dùng gh pr merge, không push thẳng main
    ok   không còn tệp hook guard-push-deploy
    ASK-RULES STATIC PASS

- eval: E3
  run_id: narrow-ask-rules-E3-20261023T114329
  exit_code: 0
  baseline: green
  verifier: config:executors.script.ask_rules_static
  verified_at: 2026-10-23T04:43:29Z
  output: |
    ok   ask chỉ còn sync-public + supabase db push (bỏ git push * / vercel * / npx vercel *)
    ok   đủ 9 luật deny, kể cả git push --force / -f
    ok   hook chỉ còn guard-edits + typecheck-changed (không hook push/vercel)
    ok   ui-lint chạy trên mọi PR (không lọc paths) — làm check bắt buộc được
    ok   AGENTS.md: làn merge dùng gh pr merge, không push thẳng main
    ok   không còn tệp hook guard-push-deploy
    ASK-RULES STATIC PASS

- eval: E4
  run_id: narrow-ask-rules-E4-20261023T114330
  exit_code: 0
  baseline: red
  verifier: config:executors.script.ask_rules_static
  verified_at: 2026-10-23T04:43:31Z
  output: |
    ok   ask chỉ còn sync-public + supabase db push (bỏ git push * / vercel * / npx vercel *)
    ok   đủ 9 luật deny, kể cả git push --force / -f
    ok   hook chỉ còn guard-edits + typecheck-changed (không hook push/vercel)
    ok   ui-lint chạy trên mọi PR (không lọc paths) — làm check bắt buộc được
    ok   AGENTS.md: làn merge dùng gh pr merge, không push thẳng main
    ok   không còn tệp hook guard-push-deploy
    ASK-RULES STATIC PASS

- eval: E5
  run_id: narrow-ask-rules-E5-20261023T114332
  exit_code: 0
  baseline: red
  verifier: config:executors.script.ask_rules_static
  verified_at: 2026-10-23T04:43:32Z
  output: |
    ok   ask chỉ còn sync-public + supabase db push (bỏ git push * / vercel * / npx vercel *)
    ok   đủ 9 luật deny, kể cả git push --force / -f
    ok   hook chỉ còn guard-edits + typecheck-changed (không hook push/vercel)
    ok   ui-lint chạy trên mọi PR (không lọc paths) — làm check bắt buộc được
    ok   AGENTS.md: làn merge dùng gh pr merge, không push thẳng main
    ok   không còn tệp hook guard-push-deploy
    ASK-RULES STATIC PASS

- eval: E6
  run_id: narrow-ask-rules-E6-20261023T114333
  exit_code: 0
  baseline: red
  verifier: config:executors.script.ask_rules_mutation
  verified_at: 2026-10-23T04:43:33Z
  output: |
    ok   [thêm lại ask git push *] bị bắt
    ok   [thêm lại ask vercel *] bị bắt
    ok   [mất ask supabase db push] bị bắt
    ok   [mất ask sync-public] bị bắt
    ok   [mất deny git push -f] bị bắt
    ok   [ui-lint lọc paths lại] bị bắt
    ok   [AGENTS.md mất luật gh pr merge] bị bắt
    bắt 7/7 bản đột biến
    ASK-RULES MUTATION PASS

- eval: E7
  run_id: narrow-ask-rules-E7-20261023T114334
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.ask_rules_protection
  verified_at: 2026-10-23T04:43:34Z
  output: |
    ok   bắt buộc qua PR
    ok   check bắt buộc gồm gate + ui-lint
    ok   admin không được vượt (token của Mạnh mà các phiên dùng cũng bị chặn)
    ok   cấm force-push
    ok   cấm xoá nhánh main
    ASK-RULES PROTECTION PASS

- eval: E8
  run_id: narrow-ask-rules-E8-20261023T114336
  exit_code: 0
  baseline: green
  verifier: config:executors.script.ask_rules_protection_selftest
  verified_at: 2026-10-23T04:43:36Z
  output: |
    ok   fixture đủ → xanh
    bắt 6/6 fixture thiếu
    ASK-RULES PROTECTION-SELFTEST PASS

## Known limits

- E1–E5 cùng một lệnh (`static`), nên cùng một output; mỗi eval chỉ dựa vào dòng `ok` của tiêu chí mình. Năm lần chạy độc lập, mỗi lần một run_id trong `run-log.jsonl`, cho kết quả như nhau.
- E7 đọc trạng thái GitHub sống (`gh api repos/phanlemanh/onehub-invest/branches/main/protection`, chỉ đọc) tại thời điểm chấm, không gắn với cây mã. Người chấm đối chiếu thêm bằng tay JSON thô: `required_approving_review_count` 0, `required_status_checks.contexts` = `gate`, `ui-lint` (cả hai cũng nằm trong `checks` với app_id GitHub Actions), `enforce_admins.enabled` true, `allow_force_pushes.enabled` false, `allow_deletions.enabled` false. Ai đó đổi cài đặt sau giờ chấm thì bằng chứng này không còn đúng. Tên context `gate` khớp job id `gate` trong `.github/workflows/acceptance-gate.yml`, `ui-lint` khớp job id trong `ui-lint.yml`.
- AC-4 được đo tĩnh (khối `pull_request:` trong `ui-lint.yml` không còn `paths:`), không mở PR thật không chạm `app/` để xem check `ui-lint` có chạy hay không.
- Dòng «không còn tệp hook guard-push-deploy» trong lệnh `static` chỉ in khi mọi kiểm trước đó xanh (gắn vào biến FAIL chung), nên nó không phải phép đo độc lập; ở lần chạy này mọi kiểm đều xanh nên dòng có mặt hợp lệ. Người chấm kiểm thêm: `.claude/hooks/` chỉ có `guard-edits.sh`, `typecheck-changed.sh` và `tests/typecheck-changed.selftest.sh`; `git grep guard-push-deploy` chỉ ra hồ sơ acceptance và chính script kiểm.

## Ngoài hợp đồng

- `docs/ROADMAP.md` dòng V6 (Track 5) vẫn ghi «⏳ chờ Mạnh bật protection + ký (T3)», trong khi E7 cho thấy protection của `main` đã bật đủ. Phần «bật protection» của dòng này đã cũ; nên cập nhật khi ký Cổng 2.
- Nhánh đứng sau `origin/main` (ce4ad81) hơn hai chục commit (PR #20, #22). Ba tệp cấu hình của hồ sơ (`.claude/settings.json`, `ui-lint.yml`, `AGENTS.md`) không bị main đổi, nhưng `PRODUCT-MAP.md`, `_acceptance/config.yaml`, `docs/ROADMAP.md` có thể xung đột khi gộp. Protection đặt `strict: false` nên GitHub không bắt nhánh cập nhật trước khi merge. Nếu làn merge gộp main vào nhánh thì các tệp ngoài `_acceptance/` sẽ đổi sau `verified_commit`, và pre-merge sẽ đòi ghim lại.
- Rủi ro của thay đổi (đã chấp nhận ở contract, ghi lại cho người ký): sau khi bỏ ask, các lệnh Vercel ghi (`vercel --prod`, `vercel env add/rm`…) và push lên nhánh không phải main không còn hỏi. Rào còn lại cho `main` hoàn toàn nằm ở GitHub. Nếu protection bị tắt hoặc nới (ví dụ bỏ `enforce_admins`), máy sẽ không còn lớp hỏi nào cho push lên `main`; chỉ chạy lại `protection` mới phát hiện được.
- `ui-lint` giờ chạy trên mọi PR (cài `npm` của `app/` + eslint), nên thời gian và phút CI tăng ở PR không chạm `app/`. Đây là cái giá có chủ đích để check bắt buộc không treo.
- Biểu thức kiểm AGENTS.md trong `check_tree` khá lỏng: chỉ cần có «gh pr merge» ở đâu đó và một câu «không … git push … main» hoặc «không push thẳng». Trên main nó đỏ đúng chỗ, nhưng nó không gắn với đoạn «Điều phối làn merge» cụ thể.

## Analyst

Non-discriminating evals (xanh trên cả nhánh lẫn baseline, xét theo dòng `ok` của từng tiêu chí):
- E2 (AC-2, đủ 9 deny) và E3 (AC-3, hook chỉ còn hai): trên `origin/main` hai dòng này đã xanh, vì deny không đổi và hook `guard-push-deploy` chưa từng vào main (chỉ có ở bản đầu của chính PR này). Đây là tiêu chí «giữ nguyên» có chủ đích, tức là hàng rào chống hồi quy, không chứng tính năng. Toàn bộ lệnh `static` vẫn đỏ trên main vì ba dòng của AC-1/4/5.
- E8 (selftest bộ đánh giá protection): không phụ thuộc cây mã (fixture JSON nằm trong script), nên xanh ở mọi cây có script. Eval này giữ cho thước đo khỏi xanh giả, không chứng tính năng.
- E6 đỏ trên baseline, nhưng lý do không phải thước đo không phân biệt: AGENTS.md của main chưa có chữ «gh pr merge», nên đột biến thứ 7 không cấy được (6/7). Sáu đột biến còn lại đều bị bắt trên main.
- Sức phân biệt của tính năng nằm ở E1, E4, E5: trên main, `static` đỏ ở ba dòng ask (còn `git push *`, `vercel *`, `npx vercel *`), ui-lint còn lọc `paths`, và AGENTS.md thiếu luật merge. Trên nhánh, cả ba đều xanh.

Baseline khong do:
- E7: trạng thái branch protection là cài đặt sống trên GitHub, không phụ thuộc cây mã, nên chạy trên diffBase không chứng thêm gì.
- Cách đo E1–E6, E8: `git worktree add --detach` tại `origin/main` (ce4ad81) vào thư mục nháp, chép `scripts/check-ask-rules.sh` của nhánh vào (main chưa có tệp này), chạy `static`, `mutation`, `protection-selftest`, rồi `git worktree remove` ngay. `git worktree list` sạch sau khi đo.

## Variance

none — every multi-run eval is uniform (không eval nào khai runs > 1)

## Iterations

Round 1: E1–E8 đều đạt expected trên fa63379; không sửa code.

### Re-pin lần 1 — 2026-10-23, do gộp origin/main sau chữ ký (xung đột PRODUCT-MAP.md); node_modules mượn symlink từ checkout chính (lock giống hệt) + next typegen
run_id: repin-20261023T050942Z-51569
sha: a7a5b5f29fe5f6027f6bfd3d7c283b1ba89060b8 · suites: 6 lệnh exit 0 · evals: 8/8 eval máy đạt kỳ vọng
