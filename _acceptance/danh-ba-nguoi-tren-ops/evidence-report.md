---
schema_version: 2
feature_slug: danh-ba-nguoi-tren-ops
verdict: REJECT
failed_evals: []
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: 3f6fe5e1a56b004812fbd80c0af9bd39232fa147
human_signoff:
---

# Evidence Report: danh-ba-nguoi-tren-ops

Round 1. Verdict REJECT: mọi eval khai trong hợp đồng (E1–E15) đều xanh, nhưng hai lệnh suite hồi quy không gắn eval nào đỏ (`cd app && npm test`, `cd pipeline && npm test`) — xem mục «Lệnh suite (hồi quy)» và Iterations.

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
  run_id: minted-danh-ba-nguoi-tren-ops-E1-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.danh_ba_ops
  verified_at: 2026-10-30T15:21:48Z
  output: |
    cd app && node --import tsx --test tests/danh-ba-nguoi-tren-ops.test.tsx — 1/1 lần chạy đạt

- eval: E2
  run_id: minted-danh-ba-nguoi-tren-ops-E2-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.danh_ba_ops
  verified_at: 2026-10-30T15:21:48Z
  output: |
    cùng lệnh với E1 — 1/1 lần chạy đạt

- eval: E3
  run_id: minted-danh-ba-nguoi-tren-ops-E3-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.danh_ba_ops
  verified_at: 2026-10-30T15:21:48Z
  output: |
    cùng lệnh với E1 — 1/1 lần chạy đạt

- eval: E4
  run_id: minted-danh-ba-nguoi-tren-ops-E4-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.danh_ba_ops
  verified_at: 2026-10-30T15:21:48Z
  output: |
    cùng lệnh với E1 — 1/1 lần chạy đạt

- eval: E5
  run_id: minted-danh-ba-nguoi-tren-ops-E5-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.danh_ba_ops
  verified_at: 2026-10-30T15:21:48Z
  output: |
    cùng lệnh với E1 — 1/1 lần chạy đạt

- eval: E6
  run_id: minted-danh-ba-nguoi-tren-ops-E6-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.danh_ba_ops
  verified_at: 2026-10-30T15:21:48Z
  output: |
    cùng lệnh với E1 — 1/1 lần chạy đạt

- eval: E7
  run_id: minted-danh-ba-nguoi-tren-ops-E7-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.danh_ba_ops
  verified_at: 2026-10-30T15:21:48Z
  output: |
    cùng lệnh với E1 — 1/1 lần chạy đạt

- eval: E8
  run_id: minted-danh-ba-nguoi-tren-ops-E8-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.danh_ba_ops
  verified_at: 2026-10-30T15:21:48Z
  output: |
    cùng lệnh với E1 — 1/1 lần chạy đạt

- eval: E11
  run_id: minted-danh-ba-nguoi-tren-ops-E11-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.danh_ba_ops
  verified_at: 2026-10-30T15:21:48Z
  output: |
    cùng lệnh với E1 — 1/1 lần chạy đạt

- eval: E9
  run_id: minted-danh-ba-nguoi-tren-ops-E9-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.ui_route_slugs
  verified_at: 2026-10-30T15:21:48Z
  output: |
    cd app && node --test eslint-plugin-onehub-ui/tests/route-slugs.test.mjs — 1/1 lần chạy đạt

- eval: E10
  run_id: minted-danh-ba-nguoi-tren-ops-E10-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.ui_routes_map
  verified_at: 2026-10-30T15:21:48Z
  output: |
    cd app && node --test eslint-plugin-onehub-ui/tests/routes-map.test.mjs — 1/1 lần chạy đạt

- eval: E13
  run_id: design-gate-290380490d
  exit_code: 0
  baseline: n-a
  verifier: config:executors.design.dbn_gate
  verified_at: 2026-10-30T15:21:48Z
  output: |
    design-gate (a11y/slop) chạy trên từng tệp giao diện của vòng — xanh

- eval: E14
  run_id: minted-danh-ba-nguoi-tren-ops-E14-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.design.floor
  verified_at: 2026-10-30T15:21:48Z
  output: |
    design-floor-s4 --root . — xanh

- eval: E15
  run_id: minted-danh-ba-nguoi-tren-ops-E15-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.danh_ba_doi_chieu
  verified_at: 2026-10-30T15:21:48Z
  output: |
    cd app && node --import tsx --test tests/danh-ba-nguoi-doi-chieu.test.tsx — 1/1 lần chạy đạt

- eval: E12
  run_id: E12
  exit_code: 0
  baseline: n-a
  verifier: playwright-cli (ui-check E12)
  verified_at: 2026-10-30T15:21:48Z
  screenshot: evidence/E12-step1.png
  observed: |
    step1 (sáng 1280): đầu trang có ba badge số «9.803 người đang dùng», «28.841 vai Người đăng», «S03 357 · S05 35 · S06 9.411»; bảng cột Người/Nguồn/Số tin/Tài khoản·SĐT băm/Bí danh; hàng đầu «Người bán quận Phú Nhuận» pty_01M65VVSV3QCACATNQBJ5GS5YV, S06, 1.813, badge tím «Có thể là môi giới · suy luận» nằm dưới số tin, tách khỏi số; đọc rõ. step2: bộ lọc hiện S03, mọi hàng Nguồn S03 (Mộc Trà 60, Linh Nhà Vin 58…). step3 (tối 1280): nền tối, trang «Một người» pty_01M65VVSV3QCACATNQBJ5GS5YV, badge S06 và «1.813 tin đã đăng», badge «Có thể là môi giới · suy luận», bảng Bí danh (31143821, Cộng Đồng Nhà Đất, Người cho thuê quận Hà Đông…), nguồn S06, chữ đọc rõ trên nền tối; phần tin đã đăng nằm dưới màn hình (xác nhận qua innerText). step4 (390 sáng): bố cục dọc, badge số xuống dòng, bộ lọc xếp dọc, bảng cuộn ngang trong khung riêng (cột Số tin bị cắt trong khung bảng), không có thanh cuộn ngang trang; scrollWidth 390 = clientWidth 390. step5 (viewer): hàng đầu mã pty_01M65VVSV3QCACATNQBJ5GS5YV hiện; ô tên «Ẩn với vai Người xem», cột Tài khoản «Ẩn với vai Người xem», badge suy luận vẫn hiện, số 1.813/56 vẫn hiện; chân trang trái «viewer-test@local.test · Người xem». step6: trang một người của cùng mã, bảng Bí danh mọi dòng cột Giá trị «Ẩn với vai Người xem», cột Loại/Nguồn S06/Thấy từ vẫn hiện, không giá trị bí danh nào của admin xuất hiện. Khớp Expected.
  network_observed: n-a (driver)

### Lệnh suite (hồi quy)

- cmd: cd agent && npm test
  run_id: minted-danh-ba-nguoi-tren-ops-SUITE-npm_test__bb6271-r1
  exit_code: 0
  verified_at: 2026-10-30T15:21:48Z

- cmd: cd app && npx tsc --noEmit && npm run lint
  run_id: minted-danh-ba-nguoi-tren-ops-SUITE-lint-r1
  exit_code: 0
  verified_at: 2026-10-30T15:21:48Z

- cmd: cd app && npm test
  run_id: minted-danh-ba-nguoi-tren-ops-SUITE-npm_test__bd9a35-r1
  exit_code: 1
  verified_at: 2026-10-30T15:21:48Z
  ghi chú: ca VT-AC-8 trong tests/viewer-the-duyet.test.tsx đỏ — bảng kiểm kê route Ops chưa khai hai route mới src/app/ops/people/page.tsx và src/app/ops/people/[partyKey]/page.tsx (và các tệp mới ở src/components/ops/people/). Lệnh này không gắn eval nào.

- cmd: cd pipeline && npm test
  run_id: minted-danh-ba-nguoi-tren-ops-SUITE-npm_test__13563d-r1
  exit_code: 1
  verified_at: 2026-10-30T15:21:48Z
  ghi chú: 292/293 đạt; ca VL-AC-5 trong scripts/vocab-lint.test.mjs đỏ — chỗ viết tay app/src/lib/ops/people.ts:81 (alias_kind · ten,tai_khoan_nguon) nằm ngoài sổ ngoại lệ của vocab-lint. Lệnh này không gắn eval nào.

- cmd: cd app && npm run test:lint-rules
  run_id: minted-danh-ba-nguoi-tren-ops-SUITE-test_lint_rules-r1
  exit_code: 0
  verified_at: 2026-10-30T15:21:48Z

- cmd: node scripts/check-portal-compliance.mjs
  run_id: minted-danh-ba-nguoi-tren-ops-SUITE-node_scripts_check_portal_compliance_mjs-r1
  exit_code: 0
  verified_at: 2026-10-30T15:21:48Z

## Known limits

## Ngoài hợp đồng

## Analyst

baseline: BLOCKED ha tang — lenh baseline khong chay dong nao (cong cu tu choi loi goi, hoac khong ghi duoc tep kich ban) — cong cu tra: «Error: No such tool available: Write. Write is not among the tools available here. Continue with the tools you have.»

Eval không-phân-biệt: không đo được ở round này (baseline bị chặn hạ tầng, mọi field baseline là n-a).

Baseline khong do:
- cd app && node --import tsx --test tests/danh-ba-nguoi-tren-ops.test.tsx: BLOCKED ha tang baseline: lenh baseline khong chay dong nao (cong cu tu choi loi goi, hoac khong ghi duoc tep kich ban) — cong cu tra: «Error: No such tool available: Write. Write is not among the tools available here. Continue with the tools you have.»
- cd app && node --test eslint-plugin-onehub-ui/tests/route-slugs.test.mjs: BLOCKED ha tang baseline: lenh baseline khong chay dong nao (cong cu tu choi loi goi, hoac khong ghi duoc tep kich ban) — cong cu tra: «Error: No such tool available: Write. Write is not among the tools available here. Continue with the tools you have.»
- cd app && node --test eslint-plugin-onehub-ui/tests/routes-map.test.mjs: BLOCKED ha tang baseline: lenh baseline khong chay dong nao (cong cu tu choi loi goi, hoac khong ghi duoc tep kich ban) — cong cu tra: «Error: No such tool available: Write. Write is not among the tools available here. Continue with the tools you have.»
- for f in app/src/app/ops/people/page.tsx app/src/app/ops/people/[[]partyKey]/page.tsx app/src/components/ops/people/*.tsx; do node "${CLAUDE_PLUGIN_ROOT:-$(node $HOME/.claude/plugins/marketplaces/acceptance-gate-kit/feature-loop/scripts/resolve-plugin.mjs --plugin acceptance-gate --require scripts/design-gate.mjs)}/scripts/design-gate.mjs" --jsdom app "$f" || exit $?; done: BLOCKED ha tang baseline: lenh baseline khong chay dong nao (cong cu tu choi loi goi, hoac khong ghi duoc tep kich ban) — cong cu tra: «Error: No such tool available: Write. Write is not among the tools available here. Continue with the tools you have.»
- node "${CLAUDE_PLUGIN_ROOT:-$(node $HOME/.claude/plugins/marketplaces/acceptance-gate-kit/feature-loop/scripts/resolve-plugin.mjs --plugin acceptance-gate --require scripts/design-floor-s4.mjs)}/scripts/design-floor-s4.mjs" --root .: BLOCKED ha tang baseline: lenh baseline khong chay dong nao (cong cu tu choi loi goi, hoac khong ghi duoc tep kich ban) — cong cu tra: «Error: No such tool available: Write. Write is not among the tools available here. Continue with the tools you have.»
- cd app && node --import tsx --test tests/danh-ba-nguoi-doi-chieu.test.tsx: BLOCKED ha tang baseline: lenh baseline khong chay dong nao (cong cu tu choi loi goi, hoac khong ghi duoc tep kich ban) — cong cu tra: «Error: No such tool available: Write. Write is not among the tools available here. Continue with the tools you have.»

## Judge

Không có eval judgment trong hợp đồng này; không có panel nào được đề xuất.

## Variance

none — every multi-run eval is uniform (mọi eval chạy 1 lần, deterministic, không có phương sai).

## Iterations

Round 1: các eval E1–E15 đều xanh; hai lệnh suite không gắn eval (`cd app && npm test` do bảng kiểm kê route Ops trong viewer-the-duyet chưa khai hai route /ops/people; `cd pipeline && npm test` do vocab-lint thấy chỗ viết tay alias_kind ở app/src/lib/ops/people.ts:81 ngoài sổ ngoại lệ) đỏ. Returned to implementation.
