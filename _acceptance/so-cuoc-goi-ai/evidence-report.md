---
schema_version: 2
feature_slug: so-cuoc-goi-ai
verdict: PASS
failed_evals: []
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: 2f2484747009a88caca8d5b79af2df771ad2a999
human_signoff:
---

# Evidence Report: so-cuoc-goi-ai

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | script | PASS |
| E2 | AC-2 | test | PASS |
| E3 | AC-3 | test | PASS |
| E4 | AC-4 | test | PASS |
| E5 | AC-5 | test | PASS |
| E6 | AC-6 | ui-check | PASS |
| E7 | AC-6 | script | PASS |
| E8 | AC-7 | script | PASS |
| E9 | AC-8 | test | PASS |
| E10 | AC-8 | script | PASS |
| E11 | AC-9 | script | PASS |
| E12 | AC-10 | script | PASS |
| E13 | AC-2 | test | PASS |

## Evidence

- eval: E1
  run_id: minted-so-cuoc-goi-ai-E1-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.sca_migration
  verified_at: 2026-10-29T13:20:25Z
  output: |
    MIGRATION OK

- eval: E2
  run_id: minted-so-cuoc-goi-ai-E2-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.sca_agent
  verified_at: 2026-10-29T13:20:25Z
  output: |
    cd agent && node --import tsx --test tests/ai-call-log.test.ts
    ℹ duration_ms 1077.782833

- eval: E3
  run_id: minted-so-cuoc-goi-ai-E3-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.sca_agent
  verified_at: 2026-10-29T13:20:25Z
  output: |
    cd agent && node --import tsx --test tests/ai-call-log.test.ts
    ℹ duration_ms 1077.782833

- eval: E4
  run_id: minted-so-cuoc-goi-ai-E4-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.sca_agent
  verified_at: 2026-10-29T13:20:25Z
  output: |
    cd agent && node --import tsx --test tests/ai-call-log.test.ts
    ℹ duration_ms 1077.782833

- eval: E5
  run_id: minted-so-cuoc-goi-ai-E5-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.sca_tong_hop
  verified_at: 2026-10-29T13:20:25Z
  output: |
    node --test pipeline/lib/ai-calls.test.mjs
    ℹ duration_ms 55.960208

- eval: E6
  run_id: minted-so-cuoc-goi-ai-E6-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.design.ui_check
  verified_at: 2026-10-29T13:20:25Z
  screenshot: evidence/E6-step1.png
  observed: |
    E6-step1.png (1280 sáng, đã mồi): sidebar Vận hành với mục «Cuộc gọi AI» đang chọn; tiêu đề «Cuộc gọi AI» kèm ba ô tóm tắt «5 cuộc», «7.970 token», «72 đ»; khung «Theo ngày, việc và mô hình» ghi «3 nhóm · 1 lượt lỗi · ngày theo giờ Việt Nam · 1 nhóm chưa có giá mô hình»; bảng 3 dòng (sca-mau-enrich qwen3.8-27b-local 1/0/2.000; sca-mau-judge sca-mau-dat 3/1/4.000; sca-mau-enrich sca-mau-moi 1/0/700), phân trang 1–3 / 3. Bảng cuộn ngang trong khung riêng, trang không cuộn ngang.
    E6-step1b-cuon-ngang.png (khung phụ): sau khi cuộn bảng sang phải thấy Lỗi/Token vào/Token ra/Chi phí/Trễ p50/Trễ p95: 72 đ, «chưa có giá» (dòng sca-mau-moi), 9.000 ms, 800 ms, 1.160 ms, khớp tổng hợp.
    E6-step2.png (390x844 tối): nền tối, cùng tiêu đề và ba ô «5 cuộc / 7.970 token / 72 đ», khung bảng 3 dòng, «1–3 / 3», không cuộn ngang cấp trang. Khớp expected; lần chụp đầu trước khi mồi (trạng thái trống) đã được thay bằng khung sau mồi.
  network_observed: n-a (driver)

- eval: E7
  run_id: minted-so-cuoc-goi-ai-E7-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.sca_trang
  verified_at: 2026-10-29T13:20:25Z
  output: |
    TRANG OK

- eval: E8
  run_id: minted-so-cuoc-goi-ai-E8-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.sca_facts
  verified_at: 2026-10-29T13:20:25Z
  output: |
    FACTS OK

- eval: E9
  run_id: minted-so-cuoc-goi-ai-E9-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.app_ui
  verified_at: 2026-10-29T13:20:25Z
  output: |
    cd app && npm test
    ℹ duration_ms 45565.810291

- eval: E10
  run_id: design-gate-06c4da7eee, design-gate-c3d2524965
  exit_code: 0
  baseline: n-a
  verifier: config:executors.design.sca_gate
  verified_at: 2026-10-29T13:20:25Z
  output: |
    design-gate --jsdom chạy trên app/src/app/ops/ai-calls/page.tsx và app/src/components/ops/ai-calls/ai-calls-view.tsx: sạch cả hai tệp

- eval: E11
  run_id: minted-so-cuoc-goi-ai-E11-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.sca_duong
  verified_at: 2026-10-29T13:20:25Z
  output: |
    DUONG OK

- eval: E12
  run_id: minted-so-cuoc-goi-ai-E12-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.sca_pham_vi
  verified_at: 2026-10-29T13:20:25Z
  output: |
    PHAM-VI OK

- eval: E13
  run_id: minted-so-cuoc-goi-ai-E13-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.sca_agent
  verified_at: 2026-10-29T13:20:25Z
  output: |
    cd agent && node --import tsx --test tests/ai-call-log.test.ts
    ℹ duration_ms 1077.782833

### Lệnh suite (hồi quy)

- cmd: cd agent && npm test
  run_id: minted-so-cuoc-goi-ai-SUITE-npm_test__bb6271-r1
  exit_code: 0
  verified_at: 2026-10-29T13:20:25Z

- cmd: cd app && npx tsc --noEmit && npm run lint
  run_id: minted-so-cuoc-goi-ai-SUITE-lint-r1
  exit_code: 0
  verified_at: 2026-10-29T13:20:25Z

- cmd: cd pipeline && npm test
  run_id: minted-so-cuoc-goi-ai-SUITE-npm_test__13563d-r1
  exit_code: 0
  verified_at: 2026-10-29T13:20:25Z

- cmd: cd app && npm run test:lint-rules
  run_id: minted-so-cuoc-goi-ai-SUITE-test_lint_rules-r1
  exit_code: 0
  verified_at: 2026-10-29T13:20:25Z

- cmd: node scripts/check-portal-compliance.mjs
  run_id: minted-so-cuoc-goi-ai-SUITE-node_scripts_check_portal_compliance_mjs-r1
  exit_code: 0
  verified_at: 2026-10-29T13:20:25Z

## Known limits

## Ngoài hợp đồng

## Analyst

baseline: BLOCKED ha tang — lenh baseline khong chay dong nao (cong cu tu choi loi goi, hoac khong ghi duoc tep kich ban) — cong cu tra: «Error: No such tool available: Write. Write is not among the tools available here. Continue with the tools you have.»

Baseline khong do:

- node _acceptance/so-cuoc-goi-ai/probes/migration.mjs: BLOCKED ha tang baseline: lenh baseline khong chay dong nao (cong cu tu choi loi goi, hoac khong ghi duoc tep kich ban) — cong cu tra: «Error: No such tool available: Write. Write is not among the tools available here. Continue with the tools you have.»
- cd agent && node --import tsx --test tests/ai-call-log.test.ts: BLOCKED ha tang baseline: lenh baseline khong chay dong nao (cong cu tu choi loi goi, hoac khong ghi duoc tep kich ban) — cong cu tra: «Error: No such tool available: Write. Write is not among the tools available here. Continue with the tools you have.»
- node --test pipeline/lib/ai-calls.test.mjs: BLOCKED ha tang baseline: lenh baseline khong chay dong nao (cong cu tu choi loi goi, hoac khong ghi duoc tep kich ban) — cong cu tra: «Error: No such tool available: Write. Write is not among the tools available here. Continue with the tools you have.»
- node _acceptance/so-cuoc-goi-ai/probes/trang.mjs: BLOCKED ha tang baseline: lenh baseline khong chay dong nao (cong cu tu choi loi goi, hoac khong ghi duoc tep kich ban) — cong cu tra: «Error: No such tool available: Write. Write is not among the tools available here. Continue with the tools you have.»
- node _acceptance/so-cuoc-goi-ai/probes/facts.mjs: BLOCKED ha tang baseline: lenh baseline khong chay dong nao (cong cu tu choi loi goi, hoac khong ghi duoc tep kich ban) — cong cu tra: «Error: No such tool available: Write. Write is not among the tools available here. Continue with the tools you have.»
- cd app && npm test: BLOCKED ha tang baseline: lenh baseline khong chay dong nao (cong cu tu choi loi goi, hoac khong ghi duoc tep kich ban) — cong cu tra: «Error: No such tool available: Write. Write is not among the tools available here. Continue with the tools you have.»
- for f in app/src/app/ops/ai-calls/page.tsx app/src/components/ops/ai-calls/ai-calls-view.tsx; do node "${CLAUDE_PLUGIN_ROOT:-$(node $HOME/.claude/plugins/marketplaces/acceptance-gate-kit/feature-loop/scripts/resolve-plugin.mjs --plugin acceptance-gate --require scripts/design-gate.mjs)}/scripts/design-gate.mjs" --jsdom app "$f" || exit $?; done: BLOCKED ha tang baseline: lenh baseline khong chay dong nao (cong cu tu choi loi goi, hoac khong ghi duoc tep kich ban) — cong cu tra: «Error: No such tool available: Write. Write is not among the tools available here. Continue with the tools you have.»
- bash _acceptance/so-cuoc-goi-ai/probes/duong.sh: BLOCKED ha tang baseline: lenh baseline khong chay dong nao (cong cu tu choi loi goi, hoac khong ghi duoc tep kich ban) — cong cu tra: «Error: No such tool available: Write. Write is not among the tools available here. Continue with the tools you have.»
- bash _acceptance/so-cuoc-goi-ai/probes/pham-vi.sh: BLOCKED ha tang baseline: lenh baseline khong chay dong nao (cong cu tu choi loi goi, hoac khong ghi duoc tep kich ban) — cong cu tra: «Error: No such tool available: Write. Write is not among the tools available here. Continue with the tools you have.»

Non-discriminating evals: none duoc xac dinh — danh sach nay KHONG do duoc o round nay vi baseline BLOCKED ha tang (moi field baseline la n-a), nen khong the khang dinh eval nao la co phan biet.

## Variance

none — every multi-run eval is uniform (moi eval chay mot lan, deterministic)

## Iterations

Round 1: 13 eval xanh (E1-E13), 5 lenh suite xanh; baseline khong do duoc (BLOCKED ha tang). Khong co judgment item; verdict PASS.
