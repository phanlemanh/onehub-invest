---
schema_version: 2
feature_slug: yield-dong-tien-von-vay
verdict: PASS
failed_evals: []
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: b52fa1fc4beb34073e43250e228b48c30ea1403e
human_signoff:
---

# Evidence Report: yield-dong-tien-von-vay

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | script | PASS |
| E2 | AC-1 | test | PASS |
| E3 | AC-2 | test | PASS |
| E4 | AC-3 | script | PASS |
| E5 | AC-4 | test | PASS |
| E6 | AC-5 | test | PASS |
| E7 | AC-6 | test | PASS |
| E8 | AC-6 | script | PASS |
| E9 | AC-7 | test | PASS |
| E19 | AC-7 | script | PASS |
| E10 | AC-8 | test | PASS |
| E11 | AC-9 | test | PASS |
| E12 | AC-9 | test | PASS |
| E13 | AC-10 | script | PASS |
| E14 | AC-11 | test | PASS |
| E15 | AC-11 | judgment | PASS |
| E16 | AC-4 | ui-check | PASS |
| E17 | AC-8 | ui-check | PASS |
| E18 | AC-8 | script | PASS |

## Evidence

- eval: E1
  run_id: minted-yield-dong-tien-von-vay-E1-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.yield_dong_tien_smoke
  verified_at: 2026-10-25T01:45:59Z
  output: |
    smoke-yield-dong-tien: ĐẠT

- eval: E2
  run_id: minted-yield-dong-tien-von-vay-E2-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.ui_route_slugs
  verified_at: 2026-10-25T01:45:59Z
  output: |
    ℹ duration_ms 66.977417

- eval: E3
  run_id: minted-yield-dong-tien-von-vay-E3-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.app_ui
  verified_at: 2026-10-25T01:45:59Z
  output: |
    ℹ duration_ms 23327.135833

- eval: E4
  run_id: minted-yield-dong-tien-von-vay-E4-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.yield_dong_tien_smoke
  verified_at: 2026-10-25T01:45:59Z
  output: |
    smoke-yield-dong-tien: ĐẠT

- eval: E5
  run_id: minted-yield-dong-tien-von-vay-E5-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.app_ui
  verified_at: 2026-10-25T01:45:59Z
  output: |
    ℹ duration_ms 23327.135833

- eval: E6
  run_id: minted-yield-dong-tien-von-vay-E6-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.app_ui
  verified_at: 2026-10-25T01:45:59Z
  output: |
    ℹ duration_ms 23327.135833

- eval: E7
  run_id: minted-yield-dong-tien-von-vay-E7-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.app_ui
  verified_at: 2026-10-25T01:45:59Z
  output: |
    ℹ duration_ms 23327.135833

- eval: E8
  run_id: minted-yield-dong-tien-von-vay-E8-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.yield_dong_tien_smoke
  verified_at: 2026-10-25T01:45:59Z
  output: |
    smoke-yield-dong-tien: ĐẠT

- eval: E9
  run_id: minted-yield-dong-tien-von-vay-E9-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.app_ui
  verified_at: 2026-10-25T01:45:59Z
  output: |
    ℹ duration_ms 23327.135833

- eval: E19
  run_id: minted-yield-dong-tien-von-vay-E19-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.yield_dong_tien_smoke
  verified_at: 2026-10-25T01:45:59Z
  output: |
    smoke-yield-dong-tien: ĐẠT

- eval: E10
  run_id: minted-yield-dong-tien-von-vay-E10-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.app_ui
  verified_at: 2026-10-25T01:45:59Z
  output: |
    ℹ duration_ms 23327.135833

- eval: E11
  run_id: minted-yield-dong-tien-von-vay-E11-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.app
  verified_at: 2026-10-25T01:45:59Z
  output: |
    tsc --noEmit và npm run lint hoàn tất, không có lỗi

- eval: E12
  run_id: minted-yield-dong-tien-von-vay-E12-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.app_ui
  verified_at: 2026-10-25T01:45:59Z
  output: |
    ℹ duration_ms 23327.135833

- eval: E13
  run_id: minted-yield-dong-tien-von-vay-E13-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.portal_static
  verified_at: 2026-10-25T01:45:59Z
  output: |
    portal-compliance: ĐẠT

- eval: E14
  run_id: minted-yield-dong-tien-von-vay-E14-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.ui_routes_map
  verified_at: 2026-10-25T01:45:59Z
  output: |
    ℹ duration_ms 64.649084

- eval: E15
  judged_by: judge panel đề xuất (domain-correctness, operational-feasibility, spec-alignment)
  verdict: PASS
  rationale: Cả bốn tệp (routes.md, catalog.md, CONTEXT.md, app/CLAUDE.md) nhất quán rằng /dau-tu đã gộp vào /yield thành mục «Dòng tiền vốn vay» (#financing), 301 về /yield?area=<market>#financing; không tệp nào liệt /dau-tu là route sống.
  votes:
    - domain-correctness: PASS — routes.md dòng 51 và 75, catalog.md dòng 65, CONTEXT.md dòng 359-361 và app/CLAUDE.md dòng 71 cùng ghi bản gộp, 301 và tham số eq/rate/term. Dòng 173 của CONTEXT.md nhắc «Mô phỏng đầu tư» chỉ như thuật ngữ, và chính tệp đó định nghĩa thuật ngữ này là đã gộp.
    - operational-feasibility: PASS — Bốn tệp khớp nhau về mục #financing, tham số eq/rate/term, 301 và data-grid-advanced-7 ở yield/financing/. Không tệp nào mô tả bộ mô phỏng cũ như đang chạy.
    - spec-alignment: PASS — routes.md, app/CLAUDE.md, catalog.md và CONTEXT.md nhất quán; /dau-tu chỉ còn ở dạng slug cũ hoặc redirect.
  human_override:  # chi nguoi ghi

- eval: E16
  run_id: minted-yield-dong-tien-von-vay-E16-r2
  exit_code: 0
  baseline: n-a
  verifier: ui-check:E16
  verified_at: 2026-10-25T01:45:59Z
  screenshot: evidence/E16-step1.png
  observed: |
    step1 (light, 1280): URL after redirect is /yield?area=vn-hanoi#financing. The "Dòng tiền vốn vay" card sits in the viewport with the subtitle "Khoản vay 4,4 tỷ · Trả nợ 39,2 tr đ/tháng · Tiền mặt bỏ ra 2 tỷ · Dòng tiền / tiền mặt năm 1: -21,6%". It has columns Hàng tháng and Năm 1 to 5. Rows carry colour strips: green "Doanh thu ngắn hạn", orange "Chi phí vận hành" with sub-rows, blue "Thu nhập ròng", purple "Trả nợ vay" with Lãi and Gốc, red-orange "Dòng tiền sau nợ", grey "So với cho thuê dài hạn". Negative numbers are red (−36,3 tr đ, −435,9 tr đ, −362,8 tr đ). The total row "Lợi nhuận / tiền mặt bỏ ra" shows percentages (-17,5%, -17,2%, -16,8%, -16,3%, -15,8%). All of it is legible. step2 (dark, 1280): same URL and same layout. The row strips use dark tints with brighter text (green, amber, cyan, violet, orange). Negatives are light red and the percent row is red. All text is readable. step3 (full page): the form has a "Vốn vay" group (badge "Mặc định sửa được") with Vốn tự có 30 % giá mua, Lãi suất vay 9 %/năm, Kỳ hạn 20 năm. Below it are the KPI cards, the reliability block, the loan cash-flow grid and the chart. step4 (eq=1, light): the subtitle reads "Khoản vay 0 · Trả nợ 0/tháng · Tiền mặt bỏ ra 6,4 tỷ · Dòng tiền / tiền mặt năm 1: 0,5%". The Trả nợ vay row, Lãi and Gốc are all 0. Dòng tiền sau nợ is 2,9 tr đ monthly and 34,9 tr đ yearly. The total row reads 0,5%. All match the Expected.
  network_observed: no-app-traffic

- eval: E17
  run_id: minted-yield-dong-tien-von-vay-E17-r2
  exit_code: 0
  baseline: n-a
  verifier: ui-check:E17
  verified_at: 2026-10-25T01:45:59Z
  screenshot: evidence/E17-step1.png
  observed: |
    E17-step1.png (375px, light, read from file): the card "Dòng tiền vốn vay" fills the width. Pinned columns are the narrow chevron column and the name column (Doanh thu ngắn hạn, Chi phí vận hành, Phí quản lý, Phí nền tảng, Thuế, Chi phí cố định, Thu nhập ròng, Trả nợ vay, Lãi, Gốc, Dòng tiền sau nợ, So với cho thuê dài hạn, Lợi nhuận / tiền mặt bỏ ra). The visible number column is "Hằng tháng" (9,9 tr đ / 7 tr đ / 2 tr đ ...), and the next column is cut at the right edge with a thin horizontal scroll bar under the grid. Negative numbers are red (−36,3 tr đ, −30,2 tr đ). Each row has its colour band (green, orange, blue, purple, red). No page-level horizontal overflow (scrollWidth = clientWidth = 375). Matches Expected.
    E17-step2.png (375px, grid scrolled to "Năm 1"): the header changes to "Năm 1" and values to 118,4 tr đ / 83,5 tr đ / 23,7 tr đ / 34,9 tr đ / 470,8 tr đ / −435,9 tr đ / −362,8 tr đ / −17,5%. The chevron column and the name column stay in place on the left, and the scroll thumb has moved. The page itself did not shift. Matches Expected (pinned open button + item name, number columns scroll in the frame).
    E17-step3.png (1280px, after clicking row "Doanh thu ngắn hạn"): all columns Hằng tháng and Năm 1 to Năm 5 are visible. Row "Doanh thu ngắn hạn" shows a down chevron and the child row "Giá/đêm × công suất × 365" (9,9 tr đ; 118,4 tr đ for each year) appears right under it. Chi phí vận hành and Trả nợ vay stay open, "So với cho thuê dài hạn" stays closed. Matches Expected (the row click opens the right item). Collapse after the second click was confirmed by the DOM data, not by an image.
  network_observed: no-app-traffic

- eval: E18
  run_id: design-gate-5e7e25e4d6
  exit_code: 0
  verifier: config:executors.script.financing_design_gate
  verified_at: 2026-10-25T01:34:27Z
  carried_from_round: 1
  note: carry-forward tu round 1 — delta khong cham paths cua eval

### Lệnh suite (hồi quy)

- cmd: cd agent && npm test
  run_id: minted-yield-dong-tien-von-vay-SUITE-npm_test__bb6271-r2
  exit_code: 0
  verified_at: 2026-10-25T01:45:59Z

- cmd: cd pipeline && npm test
  run_id: minted-yield-dong-tien-von-vay-SUITE-npm_test__13563d-r2
  exit_code: 0
  verified_at: 2026-10-25T01:45:59Z

- cmd: cd app && npm run test:lint-rules
  run_id: minted-yield-dong-tien-von-vay-SUITE-test_lint_rules-r2
  exit_code: 0
  verified_at: 2026-10-25T01:45:59Z

## Known limits

## Ngoài hợp đồng

## Analyst

baseline: BLOCKED ha tang — dau ra thieu dong __BL_XONG — lenh baseline khong chay het (bi dung, cho hop xin quyen, dau ra bi cat, hoac lenh eval vo cu phap shell)

Eval không-phân-biệt: không đo được ở round này (baseline BLOCKED hạ tầng, mọi field baseline là n-a); danh sách rỗng chỉ vì không có số đo, không phải vì mọi eval đã được chứng minh có phân biệt.

Baseline khong do:
- BASE_URL=${BASE_URL:-http://localhost:3460} node scripts/smoke-yield-dong-tien.mjs: BLOCKED ha tang baseline: dau ra thieu dong __BL_XONG — lenh baseline khong chay het (bi dung, cho hop xin quyen, dau ra bi cat, hoac lenh eval vo cu phap shell)
- cd app && node --test eslint-plugin-onehub-ui/tests/route-slugs.test.mjs: BLOCKED ha tang baseline: dau ra thieu dong __BL_XONG — lenh baseline khong chay het (bi dung, cho hop xin quyen, dau ra bi cat, hoac lenh eval vo cu phap shell)
- cd app && npm test: BLOCKED ha tang baseline: dau ra thieu dong __BL_XONG — lenh baseline khong chay het (bi dung, cho hop xin quyen, dau ra bi cat, hoac lenh eval vo cu phap shell)
- cd app && npx tsc --noEmit && npm run lint: BLOCKED ha tang baseline: dau ra thieu dong __BL_XONG — lenh baseline khong chay het (bi dung, cho hop xin quyen, dau ra bi cat, hoac lenh eval vo cu phap shell)
- node scripts/check-portal-compliance.mjs: BLOCKED ha tang baseline: dau ra thieu dong __BL_XONG — lenh baseline khong chay het (bi dung, cho hop xin quyen, dau ra bi cat, hoac lenh eval vo cu phap shell)
- cd app && node --test eslint-plugin-onehub-ui/tests/routes-map.test.mjs: BLOCKED ha tang baseline: dau ra thieu dong __BL_XONG — lenh baseline khong chay het (bi dung, cho hop xin quyen, dau ra bi cat, hoac lenh eval vo cu phap shell)

## Variance

none — every multi-run eval is uniform

## Iterations

Round 1: E16 failed — ảnh ui-check cho thấy số âm không đọc được ở nền tối và thị trường chưa có giá bán/thuê hiện số của Hà Nội. Returned to implementation (sửa S4-r1).
Round 2: mọi eval PASS trên commit b52fa1fc4beb34073e43250e228b48c30ea1403e; E18 mang từ round 1 (delta không chạm paths của eval).
