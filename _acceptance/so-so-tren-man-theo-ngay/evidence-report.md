---
schema_version: 2
feature_slug: so-so-tren-man-theo-ngay
verdict: REJECT
failed_evals: [E10]
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: 1aa69d283c2f198afeeb41787cf1bfba56a61723
human_signoff:
---

# Evidence Report: so-so-tren-man-theo-ngay

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | script | PASS |
| E2 | AC-2 | script | PASS |
| E3 | AC-3 | script | PASS |
| E4 | AC-4 | script | PASS |
| E5 | AC-5 | script | PASS |
| E6 | AC-6 | script | PASS |
| E7 | AC-7 | test | PASS |
| E8 | AC-8 | test | PASS |
| E9 | AC-9 | script | PASS |
| E10 | AC-10 | ui-check | REJECT |

E10 không đạt: số trên bốn ô khớp dòng mới nhất của DB thử, nhưng không khớp ô «Định vị (cấp dự án)» của màn chặng như AC-10 đòi (xem khối E10). Ngoài ra lệnh suite `app_ui` (cd app && npm test) có một ca đỏ không gắn eval nào: GV-AC-3 trong `tests/gio-ops-gio-vn.test.tsx` thấy hai mẫu cắt chuỗi mốc / toISOString cắt trong `src/components/ops/data-flow/milestone-trend-data.ts`, ngoài danh sách miễn.

## Evidence

- eval: E1
  run_id: minted-so-so-tren-man-theo-ngay-E1-r1
  exit_code: 0
  baseline: n-a
  verifier: _acceptance/so-so-tren-man-theo-ngay/probes/db.sh
  verified_at: 2026-11-18T14:15:04Z
  output: |
    bash _acceptance/so-so-tren-man-theo-ngay/probes/db.sh SM1-AC-1
    duration_ms 1690.348666

- eval: E2
  run_id: minted-so-so-tren-man-theo-ngay-E2-r1
  exit_code: 0
  baseline: n-a
  verifier: _acceptance/so-so-tren-man-theo-ngay/probes/db.sh
  verified_at: 2026-11-18T14:15:04Z
  output: |
    bash _acceptance/so-so-tren-man-theo-ngay/probes/db.sh SM1-AC-2
    duration_ms 4738.530542

- eval: E3
  run_id: minted-so-so-tren-man-theo-ngay-E3-r1
  exit_code: 0
  baseline: n-a
  verifier: _acceptance/so-so-tren-man-theo-ngay/probes/db.sh
  verified_at: 2026-11-18T14:15:04Z
  output: |
    bash _acceptance/so-so-tren-man-theo-ngay/probes/db.sh SM1-AC-3
    duration_ms 1709.32975

- eval: E4
  run_id: minted-so-so-tren-man-theo-ngay-E4-r1
  exit_code: 0
  baseline: n-a
  verifier: _acceptance/so-so-tren-man-theo-ngay/probes/db.sh
  verified_at: 2026-11-18T14:15:04Z
  output: |
    bash _acceptance/so-so-tren-man-theo-ngay/probes/db.sh SM1-AC-4
    duration_ms 741.16775

- eval: E5
  run_id: minted-so-so-tren-man-theo-ngay-E5-r1
  exit_code: 0
  baseline: n-a
  verifier: _acceptance/so-so-tren-man-theo-ngay/probes/db.sh
  verified_at: 2026-11-18T14:15:04Z
  output: |
    bash _acceptance/so-so-tren-man-theo-ngay/probes/db.sh SM1-AC-5
    duration_ms 792.972542

- eval: E6
  run_id: minted-so-so-tren-man-theo-ngay-E6-r1
  exit_code: 0
  baseline: n-a
  verifier: _acceptance/so-so-tren-man-theo-ngay/probes/app.sh
  verified_at: 2026-11-18T14:15:04Z
  output: |
    bash _acceptance/so-so-tren-man-theo-ngay/probes/app.sh SM1-AC-6
    duration_ms 4398.688666

- eval: E7
  run_id: minted-so-so-tren-man-theo-ngay-E7-r1
  exit_code: 0
  baseline: n-a
  verifier: _acceptance/so-so-tren-man-theo-ngay/probes/app.sh
  verified_at: 2026-11-18T14:15:04Z
  output: |
    bash _acceptance/so-so-tren-man-theo-ngay/probes/app.sh SM1-AC-7
    duration_ms 3131.061875

- eval: E8
  run_id: minted-so-so-tren-man-theo-ngay-E8-r1
  exit_code: 0
  baseline: n-a
  verifier: _acceptance/so-so-tren-man-theo-ngay/probes/app.sh
  verified_at: 2026-11-18T14:15:04Z
  output: |
    bash _acceptance/so-so-tren-man-theo-ngay/probes/app.sh SM1-AC-8
    duration_ms 4813.554666

- eval: E9
  run_id: minted-so-so-tren-man-theo-ngay-E9-r1
  exit_code: 0
  baseline: n-a
  verifier: _acceptance/so-so-tren-man-theo-ngay/probes/do-may-thu.sh
  verified_at: 2026-11-18T14:15:04Z
  output: |
    bash _acceptance/so-so-tren-man-theo-ngay/probes/do-may-thu.sh
    (không in thêm dòng tóm tắt; xem .acceptance-runs/so-so-tren-man-theo-ngay/do-may-thu.md)

- eval: E10
  run_id: minted-so-so-tren-man-theo-ngay-E10-r1
  exit_code: 1
  baseline: n-a
  verifier: config:executors.ui-check
  verified_at: 2026-11-18T14:15:04Z
  screenshot: evidence/E10-step1.png
  observed: |
    E10-step1.png (1440 sáng, vùng [data-milestone-trend], 1152x311): tiêu đề «Số mốc S03 theo ngày», bốn ô cạnh nhau, đọc rõ: Có dự án 6.949 (97,3% tin đang rao, khoảng 12/11–18/11); Khớp toà 0 (0,0%, badge «Đứng yên 2 ngày»); Có hạng cấp dự án 5.476 (76,7%); Có hạng cấp toà 0. Không có thanh bên. E10-step2.png (1440 tối): cùng bốn ô, cùng số, chữ, badge vàng và đường biểu đồ đều đọc được. E10-step3.png (375 sáng, 343x1089): bốn ô xếp dọc đủ, số 6.949, 0, 5.476, 0 đọc rõ, không bị cắt hay tràn.
    Đối chiếu: bốn số khớp dòng s03-moc-ngay mới nhất của DB thử (ngày 2026-11-18, offers_total 7141, project_linked 6949, building_linked 0, project_ranked 5476, building_ranked 0) và khớp «Tin rao 7.141» của S03 ở bảng Theo nguồn. KHÔNG khớp ô «Định vị (cấp dự án)» của màn chặng: ô đó là 3.300 ở cửa sổ 7 ngày và 19.321 ở Toàn kho, đếm trên mọi nguồn theo ngày đăng của «Tin rao mới», không phải số tin S03 đang rao có dự án (6.949). Hai định nghĩa khác nhau nên không thể trùng.
  network_observed: n-a (driver)
  output: |
    PASS tài khoản thử đã xoay bằng scripts/dev-ops-account.mjs (DB oneinvest_u2_sm1).
    PASS http://localhost:3461/login trả 200; /ops/data-flow có [data-milestone-trend] với 4 ô.
    LƯU Ý bước 2: trình duyệt đã có sẵn phiên admin của chủ máy trên localhost nên dùng luôn phiên đó trên :3461, không đăng nhập bằng ops-test@local.test.
    PASS bốn số trên ô (6.949 / 0 / 5.476 / 0) khớp dòng s03-moc-ngay mới nhất của DB.
    Không đạt: khớp ô «Định vị» của màn chặng. Ô đó là 3.300 (7 ngày) / 19.321 (Toàn kho), toàn nguồn; không có ô Định vị riêng của S03 bằng 6.949.
    PASS sáng/tối/375px đọc được (đã mở từng ảnh).
    PASS không tràn ngang, đo trên tổ tiên có overflow-x auto: 1440 scrollWidth 1200 = clientWidth 1200; 375px các nút 7 ngày, 30 ngày, Toàn kho đều scrollWidth = clientWidth (375).

### Lệnh suite (hồi quy)

- cmd: node scripts/suite-neu-doi.mjs agent -- 'cd agent && npm test'
  run_id: minted-so-so-tren-man-theo-ngay-SUITE-node_scripts_suite_neu_doi_mjs_agent_cd_-r1
  exit_code: 0
  verified_at: 2026-11-18T14:15:04Z

- cmd: node scripts/suite-neu-doi.mjs app -- 'cd app && npx tsc --noEmit && npm run lint'
  run_id: minted-so-so-tren-man-theo-ngay-SUITE-lint-r1
  exit_code: 0
  verified_at: 2026-11-18T14:15:04Z

- cmd: node scripts/suite-neu-doi.mjs app_ui -- 'cd app && npm test'
  run_id: minted-so-so-tren-man-theo-ngay-SUITE-node_scripts_suite_neu_doi_mjs_app_ui_cd-r1
  exit_code: 1
  verified_at: 2026-11-18T14:15:04Z
  ghi chú: 1216 ca, 1206 đạt, 1 đỏ, 9 bỏ qua. Ca đỏ là GV-AC-3 «không còn mốc cắt chuỗi hay ngày theo múi máy ngoài danh sách miễn» (tests/gio-ops-gio-vn.test.tsx), thấy hai mẫu «cắt chuỗi mốc» và «toISOString cắt» trong app/src/components/ops/data-flow/milestone-trend-data.ts. Lệnh này không gắn eval nào.

- cmd: node scripts/suite-neu-doi.mjs pipeline_a -- 'cd pipeline && npm run test:a'
  run_id: minted-so-so-tren-man-theo-ngay-SUITE-test_a-r1
  exit_code: 0
  verified_at: 2026-11-18T14:15:04Z

- cmd: node scripts/suite-neu-doi.mjs pipeline_b -- 'cd pipeline && npm run test:b'
  run_id: minted-so-so-tren-man-theo-ngay-SUITE-test_b-r1
  exit_code: 0
  verified_at: 2026-11-18T14:15:04Z

- cmd: node scripts/suite-neu-doi.mjs ui_lint_rules -- 'cd app && npm run test:lint-rules'
  run_id: minted-so-so-tren-man-theo-ngay-SUITE-test_lint_rules-r1
  exit_code: 0
  verified_at: 2026-11-18T14:15:04Z

- cmd: node scripts/suite-neu-doi.mjs portal_static -- 'node scripts/check-portal-compliance.mjs'
  run_id: minted-so-so-tren-man-theo-ngay-SUITE-node_scripts_suite_neu_doi_mjs_portal_st-r1
  exit_code: 0
  verified_at: 2026-11-18T14:15:04Z

## Known limits

## Ngoài hợp đồng

## Analyst

none — mọi eval feature đều red trên baseline (có phân biệt) hoặc không đo được trên baseline; không có eval nào xanh cả hai phía.

Baseline không đo:
- bash _acceptance/so-so-tren-man-theo-ngay/probes/db.sh SM1-AC-1: bo qua baseline: tep _acceptance/so-so-tren-man-theo-ngay/probes/db.sh co o cay dang kiem nhung chua co o merge-base 308f4d3af4d458880b98968e86c771c69cfa1288 — eval moi, chay tren code cu khong phan biet gi
- bash _acceptance/so-so-tren-man-theo-ngay/probes/db.sh SM1-AC-2: bo qua baseline: tep _acceptance/so-so-tren-man-theo-ngay/probes/db.sh co o cay dang kiem nhung chua co o merge-base 308f4d3af4d458880b98968e86c771c69cfa1288 — eval moi, chay tren code cu khong phan biet gi
- bash _acceptance/so-so-tren-man-theo-ngay/probes/db.sh SM1-AC-3: bo qua baseline: tep _acceptance/so-so-tren-man-theo-ngay/probes/db.sh co o cay dang kiem nhung chua co o merge-base 308f4d3af4d458880b98968e86c771c69cfa1288 — eval moi, chay tren code cu khong phan biet gi
- bash _acceptance/so-so-tren-man-theo-ngay/probes/db.sh SM1-AC-4: bo qua baseline: tep _acceptance/so-so-tren-man-theo-ngay/probes/db.sh co o cay dang kiem nhung chua co o merge-base 308f4d3af4d458880b98968e86c771c69cfa1288 — eval moi, chay tren code cu khong phan biet gi
- bash _acceptance/so-so-tren-man-theo-ngay/probes/db.sh SM1-AC-5: bo qua baseline: tep _acceptance/so-so-tren-man-theo-ngay/probes/db.sh co o cay dang kiem nhung chua co o merge-base 308f4d3af4d458880b98968e86c771c69cfa1288 — eval moi, chay tren code cu khong phan biet gi
- bash _acceptance/so-so-tren-man-theo-ngay/probes/app.sh SM1-AC-6: bo qua baseline: tep _acceptance/so-so-tren-man-theo-ngay/probes/app.sh co o cay dang kiem nhung chua co o merge-base 308f4d3af4d458880b98968e86c771c69cfa1288 — eval moi, chay tren code cu khong phan biet gi
- bash _acceptance/so-so-tren-man-theo-ngay/probes/app.sh SM1-AC-7: bo qua baseline: tep _acceptance/so-so-tren-man-theo-ngay/probes/app.sh co o cay dang kiem nhung chua co o merge-base 308f4d3af4d458880b98968e86c771c69cfa1288 — eval moi, chay tren code cu khong phan biet gi
- bash _acceptance/so-so-tren-man-theo-ngay/probes/app.sh SM1-AC-8: bo qua baseline: tep _acceptance/so-so-tren-man-theo-ngay/probes/app.sh co o cay dang kiem nhung chua co o merge-base 308f4d3af4d458880b98968e86c771c69cfa1288 — eval moi, chay tren code cu khong phan biet gi
- bash _acceptance/so-so-tren-man-theo-ngay/probes/do-may-thu.sh: bo qua baseline: tep _acceptance/so-so-tren-man-theo-ngay/probes/do-may-thu.sh co o cay dang kiem nhung chua co o merge-base 308f4d3af4d458880b98968e86c771c69cfa1288 — eval moi, chay tren code cu khong phan biet gi

## Variance

none — mọi eval nhiều lần chạy đều đồng nhất (mọi eval chạy một lần, xác định).

## Iterations

Round 1: E10 không đạt — số trên bốn ô khớp DB thử nhưng không khớp ô «Định vị (cấp dự án)» của màn chặng (định nghĩa đếm khác nhau: toàn nguồn theo ngày đăng so với tin S03 đang rao có dự án); thêm ca GV-AC-3 của suite app_ui đỏ vì milestone-trend-data.ts còn mẫu cắt chuỗi/toISOString. Trả về triển khai.
