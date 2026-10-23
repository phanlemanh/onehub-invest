---
schema_version: 1
feature: Thu hẹp hỏi quyền — chỉ hỏi push lên main và Vercel ghi (hook guard-push-deploy thay luật ask rộng)
slug: narrow-ask-rules
owner: phanlemanh@gmail.com
risk_tier: T3      # .claude/settings.json + .claude/hooks/** nằm trong t3_paths
surfaces: [config, cli]
status: draft
approved_by:
approved_at:
---

# Acceptance Contract: narrow-ask-rules

## Context

Mạnh than nhiều phiên đòi quyền, trái North Star của Acceptance Gate Kit: người chỉ xuất hiện ở
cổng (duyệt phạm vi, ký bằng chứng), không ở từng lệnh. Số đo transcript 17 phiên con (đều chạy
bypass): khoảng 67 lần hỏi do luật ask `Bash(git push *)` và 59 lần do `Bash(vercel *)` /
`Bash(npx vercel *)` — phần lớn là push nhánh riêng và lệnh vercel chỉ đọc. Luật ask hỏi cả trong
bypass. Thay đổi: bỏ ba luật ask rộng, thêm hook PreToolUse `guard-push-deploy` chỉ trả
`permissionDecision: "ask"` ở chỗ ghi khó đảo (push lên main, Vercel ghi), không chắc thì hỏi.

Source input: prompt (phiên điều phối làn merge giao, Mạnh đồng ý phạm vi 2026-10-23; ghi chú
memory `permission-prompts-followup` đã chốt phạm vi từ trước).

## Criteria

- AC-1: Given `.claude/settings.json`, When đọc `permissions`, Then không còn ask `Bash(git push *)`, `Bash(vercel *)`, `Bash(npx vercel *)`; vẫn còn ask `supabase db push`, `npx supabase db push`, `bash tools/sync-public.sh *`; đủ 9 luật deny cũ, kể cả `git push --force *` / `git push -f *`; hook `guard-push-deploy.sh` đăng ký PreToolUse matcher `Bash`.
- AC-2: Given một lệnh `git push` có đích `main`/`master` (dạng `origin main`, `HEAD:main`, `refs/heads/main`, `+main`, `:main`, `--delete main`, `--all`, `--branches`, `--mirror`, glob refspec, hoặc push không refspec khi nhánh hiện tại là main / upstream là main / detached), When hook nhận lệnh, Then hook in JSON `permissionDecision: "ask"`.
- AC-3: Given một lệnh `git push` có cờ force ở bất kỳ vị trí nào (`--force`, `-f` trong cụm cờ, `--force-with-lease`, refspec `+`), When hook nhận lệnh, Then hook hỏi — kể cả đích là nhánh riêng (deny `--force *` trong settings chỉ bắt khi cờ đứng ngay sau `push`).
- AC-4: Given `vercel` / `npx vercel` / `pnpm dlx vercel` / đường dẫn tới bin vercel với thao tác ghi (lệnh trần = deploy, `deploy`, `--prod` ở bất kỳ đâu, `promote`, `rollback`, `redeploy`, `alias`, `rm`/`remove`, `env add|rm|pull`, `domains add|rm`, `project rm`, `link`, `git connect|disconnect`, `pull`, `api` có thân hay `-X` khác GET, lệnh con lạ), When hook nhận lệnh, Then hook hỏi.
- AC-5: Given push nhánh riêng (`claude/*`, `feat/*`, `fix/*`, `docs/*`, `chore/*`, `zcode/*`, `HEAD` khi đứng ở nhánh riêng, push không refspec từ nhánh riêng có upstream không phải main, tag) hoặc vercel chỉ đọc (`ls`, `list`, `inspect`, `logs`, `whoami`, `help`, `--version`, `env ls`, `project ls`, `domains ls`, `alias ls`, `api` GET), hoặc lệnh không liên quan có nhắc chữ push/vercel, When hook nhận lệnh, Then hook im lặng (exit 0, không output) — luật quyền thường quyết.
- AC-6: Given lệnh ghép (`&&`, `||`, `;`, `|`), lồng (`$(…)`, backtick, `bash -c`, `sh -c`, `eval`, heredoc vào shell, `… | bash`), tiền tố (`VAR=…`, `env`, `timeout`), `cd`/`git -C` đổi thư mục, biến gán tĩnh trước đó, When hook xét, Then mỗi vế được xét riêng và một vế cần hỏi là đủ để hỏi; heredoc/chuỗi chỉ là dữ liệu (cat, ego-browser) thì không làm hook hỏi.
- AC-7: Given hook không chắc — đối số động không giải được, nháy/ngoặc không đóng, input không phải JSON, node vắng mặt, node chạy lỗi — When hook xét, Then hook hỏi (fail-closed), không bao giờ im lặng cho qua.
- AC-8: Given selftest, When cấy từng lỗi một vào hook (11 bản đột biến: bỏ bảo vệ main, bỏ push không refspec, bỏ force, vercel luôn qua, lệnh con lạ qua, chỉ xét vế đầu, bỏ đệ quy shell, lỗi phân tích thành qua, vercel api ghi qua, không thay biến tĩnh, hỏi mọi thứ), Then selftest đỏ với mọi bản (thước đo phân biệt cả hai chiều).
- AC-9: Given các lệnh `git push`/`vercel` thật trong transcript Claude Code của kho onehub-invest trên máy này, When phát lại qua hook, Then số lần hỏi giảm ≥ 50% so với luật ask cũ trên mẫu ≥ 20 lần hỏi cũ, và mọi vế nhắm rõ main / vercel ghi vẫn được hỏi (0 lọt).
- AC-10: Given phiên chạy `bypassPermissions`, When hook trả `permissionDecision: "ask"`, Then Claude Code vẫn hiện hộp hỏi người (không tự duyệt). (judgment)

## Coverage

- Trục đích push: tên nhánh (main/master/riêng/tag) × cách viết refspec (trần, `src:dst`, `refs/heads/`, `+`, `:`, glob, `HEAD`/`@`) × không refspec (theo nhánh hiện tại, upstream, detached, push.default) — AC-2, AC-5.
- Trục cờ: force (AC-3) · `--all/--branches/--mirror` (AC-2) · `--delete` (AC-2) · `-u`, `--tags` (AC-5).
- Trục Vercel: lệnh con ghi × đọc × lạ × cờ `--prod` × lớp chạy gói (`npx`, `pnpm dlx`, bin trực tiếp) — AC-4, AC-5.
- Trục hình dạng lệnh: ghép, lồng, tiền tố, đổi thư mục, biến — AC-6; chiều không chắc — AC-7.
- Trục thước đo: should-fire + should-NOT-fire trong selftest, đột biến (AC-8), dữ liệu thật (AC-9).
- Trục môi trường chạy: chế độ quyền của phiên (AC-10).
- Bỏ quét morphological đầy đủ: các trục trên lấy từ cú pháp `git push` / `vercel` và danh sách của lời giao.

## Out of scope

- KHÔNG tự bật branch protection cho `main` trên GitHub — đổi cài đặt tài khoản, Mạnh tự bấm; chỉ ghi đề xuất vào mô tả PR.
- KHÔNG nới hay đổi luật deny nào; KHÔNG đổi ask `supabase db push` / `sync-public`.
- KHÔNG xét `gh pr merge` hay merge qua giao diện GitHub (đường hợp lệ vào main của làn merge; branch protection lo).
- KHÔNG đọc nội dung script được gọi (`bash scripts/x.sh` tự push bên trong) và KHÔNG giải alias git (`git p` = push) — giới hạn đã biết, ghi ở Known limits.
- KHÔNG đụng `settings.local.json` của checkout chính (đã dọn ở bước (a) trước đó).

## Notes

- Code viết trước contract trong cùng phiên (lời giao đã nêu đủ phạm vi); contract mô tả đúng vật có sẵn. Hook của kit giữ hồ sơ ở `draft` tới khi Mạnh duyệt Cổng Phạm vi; sau đó mới chấm bằng tác tử context sạch và trình Cổng Bằng chứng.
- Thước đo: `.claude/hooks/tests/guard-push-deploy.selftest.sh` (should-fire/should-NOT-fire + fail-closed + settings), `…mutation.sh`, `…replay.mjs`.
- AC-10 có bằng chứng đọc mã CLI ở `_acceptance/narrow-ask-rules/bypass-ask-note.md`, kèm phép thử sống 30 giây cho người ký.
