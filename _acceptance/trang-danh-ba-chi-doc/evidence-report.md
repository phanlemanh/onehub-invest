---
schema_version: 2
feature_slug: trang-danh-ba-chi-doc
verdict: PASS
failed_evals: []
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: a70ca18b8b913c54d8ba8028c0391fa276880411
human_signoff: Mạnh 2026-11-17
---

# Evidence Report: trang-danh-ba-chi-doc

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
| E9 | AC-9 | test | PASS (carry-forward từ round 1) |
| E10 | AC-9 | test | PASS (carry-forward từ round 1) |
| E11 | AC-9 | test | PASS |
| E12 | AC-10 | ui-check | PASS (carry-forward từ round 1) |
| E13 | AC-10 | script | PASS (carry-forward từ round 1) |
| E14 | AC-10 | test | PASS (carry-forward từ round 1) |

## Evidence

Lệnh chung của E1, E2, E3, E4, E5, E6, E7, E8, E11 (một lệnh phủ chín eval): `cd app && bash ../db/db-thu.sh oneinvest_suite_tdb --chay node --import tsx --test --test-concurrency=1 tests/registry-chi-doc.test.tsx` — runs: 1, passes: 1, không phương sai.

- eval: E1
  run_id: minted-trang-danh-ba-chi-doc-E1-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.tdb_app
  verified_at: 2026-11-17T02:35:58Z
  output: |
    ℹ duration_ms 1917.213541

- eval: E2
  run_id: minted-trang-danh-ba-chi-doc-E2-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.tdb_app
  verified_at: 2026-11-17T02:35:58Z
  output: |
    ℹ duration_ms 1917.213541

- eval: E3
  run_id: minted-trang-danh-ba-chi-doc-E3-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.tdb_app
  verified_at: 2026-11-17T02:35:58Z
  output: |
    ℹ duration_ms 1917.213541

- eval: E4
  run_id: minted-trang-danh-ba-chi-doc-E4-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.tdb_app
  verified_at: 2026-11-17T02:35:58Z
  output: |
    ℹ duration_ms 1917.213541

- eval: E5
  run_id: minted-trang-danh-ba-chi-doc-E5-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.tdb_app
  verified_at: 2026-11-17T02:35:58Z
  output: |
    ℹ duration_ms 1917.213541

- eval: E6
  run_id: minted-trang-danh-ba-chi-doc-E6-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.tdb_app
  verified_at: 2026-11-17T02:35:58Z
  output: |
    ℹ duration_ms 1917.213541

- eval: E7
  run_id: minted-trang-danh-ba-chi-doc-E7-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.tdb_app
  verified_at: 2026-11-17T02:35:58Z
  output: |
    ℹ duration_ms 1917.213541

- eval: E8
  run_id: minted-trang-danh-ba-chi-doc-E8-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.tdb_app
  verified_at: 2026-11-17T02:35:58Z
  output: |
    ℹ duration_ms 1917.213541

- eval: E11
  run_id: minted-trang-danh-ba-chi-doc-E11-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.tdb_app
  verified_at: 2026-11-17T02:35:58Z
  output: |
    ℹ duration_ms 1917.213541

- eval: E9
  run_id: minted-trang-danh-ba-chi-doc-E9-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.ui_route_slugs
  verified_at: 2026-11-17T01:31:50Z
  carried_from_round: 1
  # carry-forward tu round 1 — delta khong cham paths cua eval

- eval: E10
  run_id: minted-trang-danh-ba-chi-doc-E10-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.ui_routes_map
  verified_at: 2026-11-17T01:31:50Z
  carried_from_round: 1
  # carry-forward tu round 1 — delta khong cham paths cua eval

- eval: E12
  run_id: minted-trang-danh-ba-chi-doc-E12-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.design.ui_check   # tác tử chấm lái trình duyệt trên bản dev của worktree (:3461); bản tổng hợp ghi khoá executors.ui-check không có trong config — sửa nhãn theo tiền lệ của kho
  verified_at: 2026-11-17T01:31:50Z
  carried_from_round: 1
  # carry-forward tu round 1 — delta khong cham paths cua eval
  screenshot: evidence/E12-step1.png
  observed: |
    step1 (1280 sáng): bốn ô số Dự án 344 / Toà 198 / Căn 1.748 / Mã nguồn chưa nối 524 rõ ràng; bảng Dự án có cột Nguồn chỉ là badge S06, S08; Tin đang rao dạng S03 4.131, S06 581. step2: hàng Vinhomes Ocean Park 1 mở, hiện phân khu The Paris, The Zurich, The Beverly, The Pavilion, The Zenpark, Ngọc Trai với badge S09. step3: bộ lọc «Chỗ thiếu là Có toà chưa có căn», nhãn 2/344 dự án, bảng còn Grand Park và Ocean Park 1, phân trang 1–2 / 2. step4 (tối): trang Vinhomes Grand Park đọc được, bốn ô Phân khu 18 / Toà 77 / Căn 1.430 / Tin đang rao 4.712 (S03 4.131 · S06 581), tab Mọi toà 77 / Chưa có căn 26, bảng toà có Bậc, Nguồn S0x, Trục, Căn. step5 (tối): toà B mở ra hai căn 772/B.02.10 «Tầng 2 · Trục 772/B/10» và 772/B.27.11 «Tầng 27 · Trục 772/B/11», nguồn S08. step6 (tối): tab Chưa có căn đang chọn, hàng GH3, GH5, S1.01... huy hiệu «Một lời khai» và «Chưa có căn» đọc rõ. step7 (390 sáng): bố cục một cột, bốn thẻ xếp dọc, không tràn ngang, scrollWidth 390 = clientWidth 390. Sidebar có email tài khoản thử ops-test@local.test (tài khoản thử cục bộ).
  network_observed: n-a (driver)

- eval: E13
  run_id: minted-trang-danh-ba-chi-doc-E13-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.design.floor
  verified_at: 2026-11-17T01:31:50Z
  carried_from_round: 1
  # carry-forward tu round 1 — delta khong cham paths cua eval

- eval: E14
  run_id: minted-trang-danh-ba-chi-doc-E14-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.tdb_doi_chieu
  verified_at: 2026-11-17T01:31:50Z
  carried_from_round: 1
  # carry-forward tu round 1 — delta khong cham paths cua eval

### Lệnh suite (hồi quy)

- cmd: cd agent && npm test
  run_id: minted-trang-danh-ba-chi-doc-SUITE-npm_test__bb6271-r2
  exit_code: 0
  verified_at: 2026-11-17T02:35:58Z

- cmd: cd app && npx tsc --noEmit && npm run lint
  run_id: minted-trang-danh-ba-chi-doc-SUITE-lint-r2
  exit_code: 0
  verified_at: 2026-11-17T02:35:58Z

- cmd: cd app && npm test
  run_id: minted-trang-danh-ba-chi-doc-SUITE-npm_test__bd9a35-r2
  exit_code: 0
  verified_at: 2026-11-17T02:35:58Z

- cmd: cd pipeline && npm run test:a
  run_id: minted-trang-danh-ba-chi-doc-SUITE-test_a-r2
  exit_code: 0
  verified_at: 2026-11-17T02:35:58Z

- cmd: cd pipeline && npm run test:b
  run_id: minted-trang-danh-ba-chi-doc-SUITE-test_b-r2
  exit_code: 0
  verified_at: 2026-11-17T02:35:58Z

- cmd: cd app && npm run test:lint-rules
  run_id: minted-trang-danh-ba-chi-doc-SUITE-test_lint_rules-r2
  exit_code: 0
  verified_at: 2026-11-17T02:35:58Z

- cmd: node scripts/check-portal-compliance.mjs
  run_id: minted-trang-danh-ba-chi-doc-SUITE-node_scripts_check_portal_compliance_mjs-r2
  exit_code: 0
  verified_at: 2026-11-17T02:35:58Z

## Known limits

## Ngoài hợp đồng

## Analyst

carried tu round 1 — baseline khong do lai round nay. Mọi eval ghi baseline n-a vì round này không đo lại.

Eval không-phân-biệt (xanh cả trên HEAD lẫn baseline ở round 1, chứng minh harness chứ không chứng minh tính năng; xác nhận là regression-guard có chủ ý hoặc viết lại để assert hành vi mới):
- E9 — `cd app && node --test eslint-plugin-onehub-ui/tests/route-slugs.test.mjs`
- E10 — `cd app && node --test eslint-plugin-onehub-ui/tests/routes-map.test.mjs`
- E13 — `node "${CLAUDE_PLUGIN_ROOT:-$(node $HOME/.claude/plugins/marketplaces/acceptance-gate-kit/feature-loop/scripts/resolve-plugin.mjs --plugin acceptance-gate --require scripts/design-floor-s4.mjs)}/scripts/design-floor-s4.mjs" --root .`

## Variance

none — mọi eval chạy một lần, kết quả đồng nhất.

## Iterations

Round 1: E1–E14 chạy lần đầu trên bản S4 vòng 1; E9, E10, E12, E13, E14 đạt và được mang sang round 2.
Round 2: E1–E8 và E11 chạy lại sau sửa S4-r1 (siết đo ô số, tab, RegionError), đạt; E9, E10, E12, E13, E14 carry-forward vì delta không chạm paths của chúng; bảy lệnh suite đạt.

### Re-pin lần 1 — 2026-11-17, do dời ca đối chiếu sang app/probes sau chữ ký (lưới DT-AC-7)
run_id: repin-20261117T042618Z-27130
sha: af430f2784c650e1c817dfb531bb46ebbd74e27f · suites: 7 lệnh exit 0 · evals: 13/13 eval máy đạt kỳ vọng · ngoài làn máy: E12

### Re-pin lần 2 — 2026-11-17, do TDB-AC-6 bỏ vế không-migration-mới (GS 17/11), ghim trên nhánh DA33
run_id: repin-20261117T081456Z-71670
sha: 384ac895b6ab58c16ca28f5b5b8ad078f0275d22 · suites: 7 lệnh exit 0 · evals: 13/13 eval máy đạt kỳ vọng · ngoài làn máy: E12

### Re-pin lần 3 — 2026-11-17, do gộp main (TG1 #477) làm cũ bằng chứng; ghim lại trên nhánh DA33
run_id: repin-20261117T115940Z-48211
sha: a70ca18b8b913c54d8ba8028c0391fa276880411 · suites: 7 lệnh exit 0 · evals: 13/13 eval máy đạt kỳ vọng · ngoài làn máy: E12
