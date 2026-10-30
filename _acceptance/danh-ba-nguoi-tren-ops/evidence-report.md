---
schema_version: 2
feature_slug: danh-ba-nguoi-tren-ops
verdict: PASS
failed_evals: []
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: 1c5aaf0c2f88155dc4b30c1800df07f6f650d9cf
human_signoff: Mạnh 2026-10-30
---

# Evidence Report: danh-ba-nguoi-tren-ops

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | test | PASS |
| E2 | AC-2 | test | PASS |
| E3 | AC-3 | test | PASS |
| E4 | AC-4 | test | PASS |
| E5 | AC-5 | test | PASS |
| E6 | AC-6 | test | PASS |
| E7 | AC-7 | test | PASS |
| E8 | AC-8 | test | PASS |
| E9 | AC-9 | test | PASS |
| E10 | AC-9 | test | PASS |
| E11 | AC-9 | test | PASS |
| E12 | AC-10 | ui-check | PASS |
| E13 | AC-10 | script | PASS |
| E14 | AC-10 | script | PASS |
| E15 | AC-10 | test | PASS |

## Evidence

- eval: E1
  run_id: minted-danh-ba-nguoi-tren-ops-E1-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.danh_ba_ops
  verified_at: 2026-10-30T15:32:34Z
  output: |
    cd app && node --import tsx --test tests/danh-ba-nguoi-tren-ops.test.tsx
    ℹ duration_ms 1632.261708

- eval: E2
  run_id: minted-danh-ba-nguoi-tren-ops-E2-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.danh_ba_ops
  verified_at: 2026-10-30T15:32:34Z
  output: |
    cd app && node --import tsx --test tests/danh-ba-nguoi-tren-ops.test.tsx
    ℹ duration_ms 1632.261708

- eval: E3
  run_id: minted-danh-ba-nguoi-tren-ops-E3-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.danh_ba_ops
  verified_at: 2026-10-30T15:32:34Z
  output: |
    cd app && node --import tsx --test tests/danh-ba-nguoi-tren-ops.test.tsx
    ℹ duration_ms 1632.261708

- eval: E4
  run_id: minted-danh-ba-nguoi-tren-ops-E4-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.danh_ba_ops
  verified_at: 2026-10-30T15:32:34Z
  output: |
    cd app && node --import tsx --test tests/danh-ba-nguoi-tren-ops.test.tsx
    ℹ duration_ms 1632.261708

- eval: E5
  run_id: minted-danh-ba-nguoi-tren-ops-E5-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.danh_ba_ops
  verified_at: 2026-10-30T15:32:34Z
  output: |
    cd app && node --import tsx --test tests/danh-ba-nguoi-tren-ops.test.tsx
    ℹ duration_ms 1632.261708

- eval: E6
  run_id: minted-danh-ba-nguoi-tren-ops-E6-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.danh_ba_ops
  verified_at: 2026-10-30T15:32:34Z
  output: |
    cd app && node --import tsx --test tests/danh-ba-nguoi-tren-ops.test.tsx
    ℹ duration_ms 1632.261708

- eval: E7
  run_id: minted-danh-ba-nguoi-tren-ops-E7-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.danh_ba_ops
  verified_at: 2026-10-30T15:32:34Z
  output: |
    cd app && node --import tsx --test tests/danh-ba-nguoi-tren-ops.test.tsx
    ℹ duration_ms 1632.261708

- eval: E8
  run_id: minted-danh-ba-nguoi-tren-ops-E8-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.danh_ba_ops
  verified_at: 2026-10-30T15:32:34Z
  output: |
    cd app && node --import tsx --test tests/danh-ba-nguoi-tren-ops.test.tsx
    ℹ duration_ms 1632.261708

- eval: E9
  run_id: minted-danh-ba-nguoi-tren-ops-E9-r1
  exit_code: 0
  verifier: config:executors.test.ui_route_slugs
  verified_at: 2026-10-30T15:21:48Z
  carried_from_round: 1
  # carry-forward tu round 1 — delta khong cham paths cua eval

- eval: E10
  run_id: minted-danh-ba-nguoi-tren-ops-E10-r1
  exit_code: 0
  verifier: config:executors.test.ui_routes_map
  verified_at: 2026-10-30T15:21:48Z
  carried_from_round: 1
  # carry-forward tu round 1 — delta khong cham paths cua eval

- eval: E11
  run_id: minted-danh-ba-nguoi-tren-ops-E11-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.danh_ba_ops
  verified_at: 2026-10-30T15:32:34Z
  output: |
    cd app && node --import tsx --test tests/danh-ba-nguoi-tren-ops.test.tsx
    ℹ duration_ms 1632.261708

- eval: E12
  run_id: E12-ui-verify-2026-10-30
  exit_code: 0
  baseline: n-a
  verifier: config:executors.ui-check
  verified_at: 2026-10-30T15:32:34Z
  screenshot: evidence/E12-step1.png
  observed: |
    Step1: nền sáng, sidebar Ops, tiêu đề «Danh bạ người» + 3 chip (9.803 người đang dùng · 28.841 vai Người đăng · S03 357 · S05 35 · S06 9.411); bảng 5 cột (Người, Nguồn, Số tin, Tài khoản·SĐT băm, Bí danh); hàng đầu «Người bán quận Phú Nhuận» pty_01M65VVSV3QCACATNQBJ5GS5YV, S06, 1.813, badge tím «Có thể là môi giới · suy luận» dưới số tin (tách khỏi số), tài khoản 31143821, bí danh 56; nguồn chỉ S03/S06. Step2: bộ lọc hiện S03, 10 hàng đều S03, badge còn đủ. Step3: nền tối, trang «Một người» breadcrumb pty_..., chip S06 và «1.813 tin đã đăng», badge suy luận ở góc phải, bảng Bí danh đọc rõ (Loại/Giá trị/Nguồn/Thấy từ); step3b: bảng tin đã đăng (Khoá tin S06:…, Phương pháp, Lớp bằng chứng, Ghi lúc) trên nền tối đọc được. Step4: 390 px, chip xuống dòng, bộ lọc xếp dọc, bảng cuộn ngang trong khung, không tràn trang (scrollWidth=clientWidth=390). Step5: user viewer-test, cột tên và cột Tài khoản·SĐT băm đều «Ẩn với vai Người xem» (chữ xám nhỏ), mã pty_ và S06, số tin, badge, số bí danh 56 vẫn hiện. Step6: trang một người của viewer, mã pty_ ở breadcrumb, cột Giá trị toàn «Ẩn với vai Người xem», không giá trị bí danh nào của admin lọt (0/56).
  network_observed: n-a (driver)

- eval: E13
  run_id: design-gate-ede762ed7f
  exit_code: 0
  baseline: n-a
  verifier: config:executors.design.dbn_gate
  verified_at: 2026-10-30T15:32:34Z
  output: |
    design-gate (a11y/slop) chạy trên từng tệp giao diện của vòng, kết thúc xanh

- eval: E14
  run_id: minted-danh-ba-nguoi-tren-ops-E14-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.design.floor
  verified_at: 2026-10-30T15:32:34Z
  output: |
    design-floor-s4 --root . không báo hex thô mới

- eval: E15
  run_id: minted-danh-ba-nguoi-tren-ops-E15-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.danh_ba_doi_chieu
  verified_at: 2026-10-30T15:32:34Z
  output: |
    cd app && node --import tsx --test tests/danh-ba-nguoi-doi-chieu.test.tsx
    ℹ duration_ms 2887.375917

### Lệnh suite (hồi quy)

- cmd: cd agent && npm test
  run_id: minted-danh-ba-nguoi-tren-ops-SUITE-npm_test__bb6271-r2
  exit_code: 0
  verified_at: 2026-10-30T15:32:34Z

- cmd: cd app && npx tsc --noEmit && npm run lint
  run_id: minted-danh-ba-nguoi-tren-ops-SUITE-lint-r2
  exit_code: 0
  verified_at: 2026-10-30T15:32:34Z

- cmd: cd app && npm test
  run_id: minted-danh-ba-nguoi-tren-ops-SUITE-npm_test__bd9a35-r2
  exit_code: 0
  verified_at: 2026-10-30T15:32:34Z

- cmd: cd pipeline && npm test
  run_id: minted-danh-ba-nguoi-tren-ops-SUITE-npm_test__13563d-r2
  exit_code: 0
  verified_at: 2026-10-30T15:32:34Z

- cmd: cd app && npm run test:lint-rules
  run_id: minted-danh-ba-nguoi-tren-ops-SUITE-test_lint_rules-r2
  exit_code: 0
  verified_at: 2026-10-30T15:32:34Z

- cmd: node scripts/check-portal-compliance.mjs
  run_id: minted-danh-ba-nguoi-tren-ops-SUITE-node_scripts_check_portal_compliance_mjs-r2
  exit_code: 0
  verified_at: 2026-10-30T15:32:34Z

## Known limits

## Ngoài hợp đồng

## Analyst

baseline: BLOCKED ha tang — lenh baseline khong chay dong nao (cong cu tu choi loi goi, hoac khong ghi duoc tep kich ban) — cong cu tra: «Buoc 1 (Write): <\tool_use_error>Error: No such tool available: Write. Write is not among the tools available here. Continue with the tools you have.<\/tool_use_error> Buoc 2 (Bash): Exit code 127 bash: /Users/manhphan/dev/onehub-invest/.cl»

none — moi eval feature deu red tren baseline (co phan biet). Luu y: baseline khong do duoc o round nay (xem muc dưới), nen khong co eval nao duoc xac nhan red.

Baseline khong do:
- cd app && node --import tsx --test tests/danh-ba-nguoi-tren-ops.test.tsx: BLOCKED ha tang baseline: lenh baseline khong chay dong nao (cong cu tu choi loi goi, hoac khong ghi duoc tep kich ban) — cong cu tra: «Buoc 1 (Write): <\tool_use_error>Error: No such tool available: Write. Write is not among the tools available here. Continue with the tools you have.<\/tool_use_error> Buoc 2 (Bash): Exit code 127 bash: /Users/manhphan/dev/onehub-invest/.cl»
- for f in app/src/app/ops/people/page.tsx app/src/app/ops/people/[[]partyKey]/page.tsx app/src/components/ops/people/*.tsx; do node "${CLAUDE_PLUGIN_ROOT:-$(node $HOME/.claude/plugins/marketplaces/acceptance-gate-kit/feature-loop/scripts/resolve-plugin.mjs --plugin acceptance-gate --require scripts/design-gate.mjs)}/scripts/design-gate.mjs" --jsdom app "$f" || exit $?; done: BLOCKED ha tang baseline: lenh baseline khong chay dong nao (cong cu tu choi loi goi, hoac khong ghi duoc tep kich ban) — cong cu tra: «Buoc 1 (Write): <\tool_use_error>Error: No such tool available: Write. Write is not among the tools available here. Continue with the tools you have.<\/tool_use_error> Buoc 2 (Bash): Exit code 127 bash: /Users/manhphan/dev/onehub-invest/.cl»
- node "${CLAUDE_PLUGIN_ROOT:-$(node $HOME/.claude/plugins/marketplaces/acceptance-gate-kit/feature-loop/scripts/resolve-plugin.mjs --plugin acceptance-gate --require scripts/design-floor-s4.mjs)}/scripts/design-floor-s4.mjs" --root .: BLOCKED ha tang baseline: lenh baseline khong chay dong nao (cong cu tu choi loi goi, hoac khong ghi duoc tep kich ban) — cong cu tra: «Buoc 1 (Write): <\tool_use_error>Error: No such tool available: Write. Write is not among the tools available here. Continue with the tools you have.<\/tool_use_error> Buoc 2 (Bash): Exit code 127 bash: /Users/manhphan/dev/onehub-invest/.cl»
- cd app && node --import tsx --test tests/danh-ba-nguoi-doi-chieu.test.tsx: BLOCKED ha tang baseline: lenh baseline khong chay dong nao (cong cu tu choi loi goi, hoac khong ghi duoc tep kich ban) — cong cu tra: «Buoc 1 (Write): <\tool_use_error>Error: No such tool available: Write. Write is not among the tools available here. Continue with the tools you have.<\/tool_use_error> Buoc 2 (Bash): Exit code 127 bash: /Users/manhphan/dev/onehub-invest/.cl»

## Variance

none — moi eval nhieu-lan chay deu dong nhat (moi eval runs 1, deterministic).

## Iterations

Round 1: suite kiểm kê đỏ — tệp và route mới chưa khai vào ba bộ kiểm kê; sổ sửa ở commit 655319de, E9 và E10 xanh ở vòng này.
Round 2: toàn bộ eval xanh; E9 và E10 carry-forward từ round 1, các eval còn lại chạy lại ở commit 1c5aaf0c.
