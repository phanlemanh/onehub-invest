---
schema_version: 2
feature_slug: the-duyet-hien-nguoi-dang
verdict: PASS
failed_evals: []
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: 7725e86ccbd34b5a830fd468eae58f480af80190
human_signoff: Mạnh 2026-11-02
---

# Evidence Report: the-duyet-hien-nguoi-dang

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | test | PASS |
| E2 | AC-2 | test | PASS |
| E3 | AC-3 | test | PASS |
| E4 | AC-4 | test | PASS |
| E5 | AC-5 | test | PASS |
| E6 | AC-6 | test | PASS |
| E7 | AC-7 | test | PASS |
| E8 | AC-7 | test | PASS |
| E9 | AC-7 | test | PASS |
| E10 | AC-7 | test | PASS |
| E11 | AC-8 | test | PASS |
| E12 | AC-8 | ui-check | PASS |
| E13 | AC-1 | script | PASS |

## Evidence

- eval: E1
  run_id: minted-the-duyet-hien-nguoi-dang-E1-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.the_duyet_hien
  verified_at: 2026-11-02T03:59:45Z
  output: |
    cd app && node --import tsx --test tests/the-duyet-hien-nguoi-dang.test.tsx
    ℹ duration_ms 2412.94025

- eval: E2
  run_id: minted-the-duyet-hien-nguoi-dang-E2-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.the_duyet_hien
  verified_at: 2026-11-02T03:59:45Z
  output: |
    cd app && node --import tsx --test tests/the-duyet-hien-nguoi-dang.test.tsx
    ℹ duration_ms 2412.94025

- eval: E3
  run_id: minted-the-duyet-hien-nguoi-dang-E3-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.the_duyet_hien
  verified_at: 2026-11-02T03:59:45Z
  output: |
    cd app && node --import tsx --test tests/the-duyet-hien-nguoi-dang.test.tsx
    ℹ duration_ms 2412.94025

- eval: E4
  run_id: minted-the-duyet-hien-nguoi-dang-E4-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.the_duyet_hien
  verified_at: 2026-11-02T03:59:45Z
  output: |
    cd app && node --import tsx --test tests/the-duyet-hien-nguoi-dang.test.tsx
    ℹ duration_ms 2412.94025

- eval: E5
  run_id: minted-the-duyet-hien-nguoi-dang-E5-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.the_duyet_hien
  verified_at: 2026-11-02T03:59:45Z
  output: |
    cd app && node --import tsx --test tests/the-duyet-hien-nguoi-dang.test.tsx
    ℹ duration_ms 2412.94025

- eval: E6
  run_id: minted-the-duyet-hien-nguoi-dang-E6-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.the_duyet_hien
  verified_at: 2026-11-02T03:59:45Z
  output: |
    cd app && node --import tsx --test tests/the-duyet-hien-nguoi-dang.test.tsx
    ℹ duration_ms 2412.94025

- eval: E7
  run_id: minted-the-duyet-hien-nguoi-dang-E7-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.the_duyet_hien
  verified_at: 2026-11-02T03:59:45Z
  output: |
    cd app && node --import tsx --test tests/the-duyet-hien-nguoi-dang.test.tsx
    ℹ duration_ms 2412.94025

- eval: E8
  run_id: minted-the-duyet-hien-nguoi-dang-E8-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.the_so_song
  verified_at: 2026-11-02T03:59:45Z
  output: |
    cd app && node --import tsx --test tests/the-so-gia-tri-song.test.tsx
    ℹ duration_ms 2377.5415

- eval: E9
  run_id: minted-the-duyet-hien-nguoi-dang-E9-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.the_duyet
  verified_at: 2026-11-02T03:59:45Z
  output: |
    cd app && node --import tsx --test tests/the-duyet-du-can-cu.test.tsx
    ℹ duration_ms 4519.657292

- eval: E10
  run_id: minted-the-duyet-hien-nguoi-dang-E10-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.viewer_the_duyet
  verified_at: 2026-11-02T03:59:45Z
  output: |
    cd app && node --import tsx --test tests/viewer-the-duyet.test.tsx
    ℹ duration_ms 3754.089709

- eval: E11
  run_id: minted-the-duyet-hien-nguoi-dang-E11-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.the_duyet_hien
  verified_at: 2026-11-02T03:59:45Z
  output: |
    cd app && node --import tsx --test tests/the-duyet-hien-nguoi-dang.test.tsx
    ℹ duration_ms 2412.94025

- eval: E12
  run_id: minted-the-duyet-hien-nguoi-dang-E12-r2
  exit_code: 0
  baseline: n-a
  verifier: scripts/ui-capture-login.mjs
  verified_at: 2026-11-02T03:59:45Z
  screenshot: evidence/E12-step1.png
  observed: |
    E12-step1.png (1280px, thẻ #105726 «Cùng căn? cau-giay 80m² ↔ 75m²»): tiêu đề bảng Trường/Tin A/Tin B/So; hàng đầu tiên «Người đăng». Tin A: «—», +84966574566, «1 tin đang rao», «Quan sát có trích dẫn · Bộ đọc tin». Tin B: «Người bán huyện Bình Chánh», «Chưa có SĐT», Badge vàng «Đăng 2.872 tin», «Sự thật · Trường có cấu trúc của nguồn». Ô So: «Không so được» (nhãn trung tính). Các hàng dưới (Giá, Diện tích) có «Lệch», Phường «Khớp». E12-step2.png (375px): cùng hàng «Người đăng» ở đúng vị trí, nội dung giống, nội dung bảng đọc được. Cột So bị cắt thành «Không s…» vì bảng cuộn ngang trong khung riêng. Trang không có thanh cuộn ngang (đo docSW=375). Khớp Expected.
  network_observed: clean
  output: |
    PASS ô So là «Không so được», không phải «Lệch».
    PASS 375px: không tràn ngang trang; bảng tự cuộn ngang trong khung riêng.
    0 request lỗi, 0 lỗi console (chi tiết trong evidence/E12-network.txt).

- eval: E13
  run_id: design-gate-62eb90785c, design-gate-6ef42efd87
  exit_code: 0
  baseline: n-a
  verifier: config:executors.design.hd6_gate
  verified_at: 2026-11-02T03:59:45Z
  output: |
    design-gate (jsdom) trên review-card.tsx và review/review-compare.tsx
    không có vi phạm nào.

### Lệnh suite (hồi quy)

- cmd: cd agent && npm test
  run_id: minted-the-duyet-hien-nguoi-dang-SUITE-npm_test__bb6271-r2
  exit_code: 0
  verified_at: 2026-11-02T03:59:45Z

- cmd: cd app && npx tsc --noEmit && npm run lint
  run_id: minted-the-duyet-hien-nguoi-dang-SUITE-lint-r2
  exit_code: 0
  verified_at: 2026-11-02T03:59:45Z

- cmd: cd app && npm test
  run_id: minted-the-duyet-hien-nguoi-dang-SUITE-npm_test__bd9a35-r2
  exit_code: 0
  verified_at: 2026-11-02T03:59:45Z

- cmd: cd pipeline && npm test
  run_id: minted-the-duyet-hien-nguoi-dang-SUITE-npm_test__13563d-r2
  exit_code: 0
  verified_at: 2026-11-02T03:59:45Z

- cmd: cd app && npm run test:lint-rules
  run_id: minted-the-duyet-hien-nguoi-dang-SUITE-test_lint_rules-r2
  exit_code: 0
  verified_at: 2026-11-02T03:59:45Z

- cmd: node scripts/check-portal-compliance.mjs
  run_id: minted-the-duyet-hien-nguoi-dang-SUITE-node_scripts_check_portal_compliance_mjs-r2
  exit_code: 0
  verified_at: 2026-11-02T03:59:45Z

## Known limits

## Ngoài hợp đồng

## Analyst

baseline: BLOCKED ha tang — lenh baseline khong chay dong nao (cong cu tu choi loi goi, hoac khong ghi duoc tep kich ban) — cong cu tra: «This session is isolated in the worktree /Users/manhphan/dev/onehub-invest/.claude/worktrees/the-duyet-nguoi-nhieu-nhieu, but this command is too complex to verify that it stays inside the worktree. Refusing to run it — a worktree-isolated »

Không đo được eval không-phân-biệt ở round này (mọi baseline là n-a).

### Baseline khong do

- cd app && node --import tsx --test tests/the-duyet-hien-nguoi-dang.test.tsx: BLOCKED ha tang baseline: lenh baseline khong chay dong nao (cong cu tu choi loi goi, hoac khong ghi duoc tep kich ban) — cong cu tra: «This session is isolated in the worktree /Users/manhphan/dev/onehub-invest/.claude/worktrees/the-duyet-nguoi-nhieu-nhieu, but this command is too complex to verify that it stays inside the worktree. Refusing to run it — a worktree-isolated »
- cd app && node --import tsx --test tests/the-so-gia-tri-song.test.tsx: BLOCKED ha tang baseline: lenh baseline khong chay dong nao (cong cu tu choi loi goi, hoac khong ghi duoc tep kich ban) — cong cu tra: «This session is isolated in the worktree /Users/manhphan/dev/onehub-invest/.claude/worktrees/the-duyet-nguoi-nhieu-nhieu, but this command is too complex to verify that it stays inside the worktree. Refusing to run it — a worktree-isolated »
- cd app && node --import tsx --test tests/the-duyet-du-can-cu.test.tsx: BLOCKED ha tang baseline: lenh baseline khong chay dong nao (cong cu tu choi loi goi, hoac khong ghi duoc tep kich ban) — cong cu tra: «This session is isolated in the worktree /Users/manhphan/dev/onehub-invest/.claude/worktrees/the-duyet-nguoi-nhieu-nhieu, but this command is too complex to verify that it stays inside the worktree. Refusing to run it — a worktree-isolated »
- cd app && node --import tsx --test tests/viewer-the-duyet.test.tsx: BLOCKED ha tang baseline: lenh baseline khong chay dong nao (cong cu tu choi loi goi, hoac khong ghi duoc tep kich ban) — cong cu tra: «This session is isolated in the worktree /Users/manhphan/dev/onehub-invest/.claude/worktrees/the-duyet-nguoi-nhieu-nhieu, but this command is too complex to verify that it stays inside the worktree. Refusing to run it — a worktree-isolated »
- for f in app/src/components/ops/review-card.tsx app/src/components/ops/review/review-compare.tsx; do node "${CLAUDE_PLUGIN_ROOT:-$(node $HOME/.claude/plugins/marketplaces/acceptance-gate-kit/feature-loop/scripts/resolve-plugin.mjs --plugin acceptance-gate --require scripts/design-gate.mjs)}/scripts/design-gate.mjs" --jsdom app "$f" || exit $?; done: BLOCKED ha tang baseline: lenh baseline khong chay dong nao (cong cu tu choi loi goi, hoac khong ghi duoc tep kich ban) — cong cu tra: «This session is isolated in the worktree /Users/manhphan/dev/onehub-invest/.claude/worktrees/the-duyet-nguoi-nhieu-nhieu, but this command is too complex to verify that it stays inside the worktree. Refusing to run it — a worktree-isolated »

## Variance

none — every multi-run eval is uniform

## Iterations

Round 1: lịch sử round đầu nằm trong run-log.jsonl và hồ sơ round cũ (không có trong đầu vào round này); round 1 đã dẫn tới việc làm chặt phép đo và sửa kỳ vọng E12 (commit 7725e86c).
Round 2: E1-E13 đều xanh, các lệnh suite xanh; baseline không đo được (hạ tầng chặn).
