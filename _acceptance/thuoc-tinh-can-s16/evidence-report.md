---
schema_version: 2
feature_slug: thuoc-tinh-can-s16
verdict: REJECT
failed_evals: ["E10"]
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: 2c0f3c88dbaaba235b96b3aa3c7633e4859ec1ac
human_signoff:
---

# Evidence Report: thuoc-tinh-can-s16

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | script | PASS |
| E2 | AC-2 | script | PASS |
| E3 | AC-3 | test | PASS |
| E4 | AC-4 | script | PASS |
| E5 | AC-5 | script | PASS |
| E6 | AC-6 | script | PASS |
| E7 | AC-7 | script | PASS |
| E8 | AC-8 | test | PASS |
| E9 | AC-9 | test | PASS |
| E10 | AC-9 | ui-check | FAIL |
| E11 | AC-10 | test | PASS |
| E12 | AC-10 | ui-check | PASS |
| E13 | AC-11 | script | PASS |
| E14 | AC-11 | judgment | PASS (đề xuất của hội đồng, chờ người) |

## Evidence

- eval: E1
  run_id: minted-thuoc-tinh-can-s16-E1-r1
  exit_code: 0
  baseline: n-a
  verifier: _acceptance/thuoc-tinh-can-s16/probes/kiem.sh
  verified_at: 2026-11-18T05:41:24Z
  output: |
    lệnh: bash _acceptance/thuoc-tinh-can-s16/probes/kiem.sh db (chung E1, E2, E4, E5, E6, E7)
    ℹ duration_ms 3378.004875

- eval: E2
  run_id: minted-thuoc-tinh-can-s16-E2-r1
  exit_code: 0
  baseline: n-a
  verifier: _acceptance/thuoc-tinh-can-s16/probes/kiem.sh
  verified_at: 2026-11-18T05:41:24Z
  output: |
    lệnh: bash _acceptance/thuoc-tinh-can-s16/probes/kiem.sh db (chung E1, E2, E4, E5, E6, E7)
    ℹ duration_ms 3378.004875

- eval: E3
  run_id: minted-thuoc-tinh-can-s16-E3-r1
  exit_code: 0
  baseline: n-a
  verifier: _acceptance/thuoc-tinh-can-s16/probes/kiem.sh
  verified_at: 2026-11-18T05:41:24Z
  output: |
    lệnh: bash _acceptance/thuoc-tinh-can-s16/probes/kiem.sh ham (chung E3, E8)
    ℹ duration_ms 93.755167

- eval: E4
  run_id: minted-thuoc-tinh-can-s16-E4-r1
  exit_code: 0
  baseline: n-a
  verifier: _acceptance/thuoc-tinh-can-s16/probes/kiem.sh
  verified_at: 2026-11-18T05:41:24Z
  output: |
    lệnh: bash _acceptance/thuoc-tinh-can-s16/probes/kiem.sh db (chung E1, E2, E4, E5, E6, E7)
    ℹ duration_ms 3378.004875

- eval: E5
  run_id: minted-thuoc-tinh-can-s16-E5-r1
  exit_code: 0
  baseline: n-a
  verifier: _acceptance/thuoc-tinh-can-s16/probes/kiem.sh
  verified_at: 2026-11-18T05:41:24Z
  output: |
    lệnh: bash _acceptance/thuoc-tinh-can-s16/probes/kiem.sh db (chung E1, E2, E4, E5, E6, E7)
    ℹ duration_ms 3378.004875

- eval: E6
  run_id: minted-thuoc-tinh-can-s16-E6-r1
  exit_code: 0
  baseline: n-a
  verifier: _acceptance/thuoc-tinh-can-s16/probes/kiem.sh
  verified_at: 2026-11-18T05:41:24Z
  output: |
    lệnh: bash _acceptance/thuoc-tinh-can-s16/probes/kiem.sh db (chung E1, E2, E4, E5, E6, E7)
    ℹ duration_ms 3378.004875

- eval: E7
  run_id: minted-thuoc-tinh-can-s16-E7-r1
  exit_code: 0
  baseline: n-a
  verifier: _acceptance/thuoc-tinh-can-s16/probes/kiem.sh
  verified_at: 2026-11-18T05:41:24Z
  output: |
    lệnh: bash _acceptance/thuoc-tinh-can-s16/probes/kiem.sh db (chung E1, E2, E4, E5, E6, E7)
    ℹ duration_ms 3378.004875

- eval: E8
  run_id: minted-thuoc-tinh-can-s16-E8-r1
  exit_code: 0
  baseline: n-a
  verifier: _acceptance/thuoc-tinh-can-s16/probes/kiem.sh
  verified_at: 2026-11-18T05:41:24Z
  output: |
    lệnh: bash _acceptance/thuoc-tinh-can-s16/probes/kiem.sh ham (chung E3, E8)
    ℹ duration_ms 93.755167

- eval: E9
  run_id: minted-thuoc-tinh-can-s16-E9-r1
  exit_code: 0
  baseline: n-a
  verifier: _acceptance/thuoc-tinh-can-s16/probes/kiem.sh
  verified_at: 2026-11-18T05:41:24Z
  output: |
    lệnh: bash _acceptance/thuoc-tinh-can-s16/probes/kiem.sh app (chung E9, E11)
    ℹ duration_ms 5624.373583

- eval: E10
  run_id: minted-thuoc-tinh-can-s16-E10-r1
  exit_code: 1
  baseline: n-a
  verifier: scripts/ui-capture-login.mjs
  verified_at: 2026-11-18T05:41:24Z
  screenshot: evidence/E10-step1.png
  observed: |
    step1 (1280 sáng, grand-park, toà 7LOCN): thẻ 18 phân khu / 89 toà / 38.135 căn / 4.802 tin; ô phủ "37.589 / 38.135", "1.850", "2"; 7 căn hiện «Chưa có thuộc tính», Badge S16 ở cột Nguồn. step1b/1c: hàng căn có thông thuỷ + tim tường m², PN·WC "1 · —", hướng tiếng Việt, giá "4,23 tỷ / 86,9 tr/m² thông thuỷ", giá thiếu hiện "—". step2/2b (tối) đọc được; step3 (390) không cuộn ngang trang; step6 lưới 89 toà vẫn hiện kèm Alert «Thử lại».
    step5 (mạng chậm lúc đang tải): toàn trang là Skeleton xám chung (4 ô thống kê và một khối bảng), KHÔNG có Skeleton riêng cho ba ô phủ hay cột thuộc tính, lệch Expected «Skeleton ở ô phủ và cột thuộc tính». Không frame nào có tên nguồn thật hay email thật.
  network_observed: no-app-traffic
  output: |
    Assertion PASS: A1 hàng căn đủ trường, A2 ô thiếu hiện «—», A3 «Chưa có thuộc tính», A4 chế độ tối, A5 khổ 390 không cuộn ngang trang, A6 ocean-park-2, A7 trạng thái lỗi có Alert và nút «Thử lại», A8 không lộ tên nguồn, A9 mạng và console sạch.
    Assertion không đạt: A10 step5 chỉ có RegistrySkeleton chung của toàn trang; thiếu Skeleton riêng cho ba ô phủ và cột thuộc tính (design.md ST-du-an-thuoc-tinh-loading ghi trạng thái chờ).
    Khung đã lưu: E10-step1.png, E10-step1b.png, E10-step1c.png, E10-step2.png, E10-step2b.png, E10-step3.png, E10-step4.png, E10-step4b.png, E10-step5.png, E10-step6.png, E10-network.txt.

- eval: E11
  run_id: minted-thuoc-tinh-can-s16-E11-r1
  exit_code: 0
  baseline: n-a
  verifier: _acceptance/thuoc-tinh-can-s16/probes/kiem.sh
  verified_at: 2026-11-18T05:41:24Z
  output: |
    lệnh: bash _acceptance/thuoc-tinh-can-s16/probes/kiem.sh app (chung E9, E11)
    ℹ duration_ms 5624.373583

- eval: E12
  run_id: minted-thuoc-tinh-can-s16-E12-r1
  exit_code: 0
  baseline: n-a
  verifier: scripts/ui-capture-login.mjs
  verified_at: 2026-11-18T05:41:24Z
  screenshot: evidence/E12-step1.png
  observed: |
    step1 grand-park: KPI Phân khu 18, Toà 89, Căn 38.135, Tin đang rao 4.802; ô phủ «Căn có thuộc tính 37.589 / 38.135», «Căn có giá chủ đầu tư 1.850», «Chưa vào danh bạ 2». step2 smart-city: «2.546 / 22.119», giá 0, chưa vào danh bạ 0. step3 ocean-park-3: «2.797 / 4.599», «Chưa vào danh bạ 792» kèm chú thích. step4 vinhomes-riverside: dòng «Chưa có nguồn thuộc tính căn cho dự án này.» Email thanh bên đã che, không lộ tên nguồn thật.
  network_observed: n-a (driver)
  output: |
    Dự án không toà S16 (riverside) hiện «Chưa có nguồn thuộc tính căn cho dự án này.»: đạt.
    E13 chạy với TTC_DB_URL trỏ oneinvest_p1_ttc: «ô lệch: 0», tổng căn danh bạ có thuộc tính 84820.

- eval: E13
  run_id: minted-thuoc-tinh-can-s16-E13-r1
  exit_code: 0
  baseline: n-a
  verifier: _acceptance/thuoc-tinh-can-s16/probes/kiem.sh
  verified_at: 2026-11-18T05:41:24Z
  output: |
    lệnh: bash _acceptance/thuoc-tinh-can-s16/probes/kiem.sh that
    tổng căn danh bạ có thuộc tính (view): 84820 · ô lệch: 0

### Judgment

- eval: E14
  judged_by: hội đồng judge (domain-correctness, operational-feasibility, spec-alignment) — đề xuất PASS
  verdict: PASS
  rationale: ap-may-thu.md có đủ năm thứ (sao lưu §1, lệnh áp §2, khối chạy thử phủ năm dự án §3, cách lùi §4, lệnh kiểm sau §5); từng ô khớp bang-phu-ca §1; có câu dừng-và-báo khi lệch và điều kiện bộ nạp thật (tin claudedp-1811-8) trước khi áp.
  votes:
    - domain-correctness: PASS — đủ năm thứ, khối chạy thử đủ năm dự án khớp bang-phu-ca §1, điều kiện bộ nạp thật nằm ở §3, lệch thì dừng và báo ở §3 và §5; chỉ đối chiếu hai tệp được giao, không kiểm tệp 113-lui.sql có tồn tại.
    - operational-feasibility: PASS — đủ cả năm thứ, khối chay-thu đủ năm dự án đã nối, cách lùi gồm lệnh rút phát biểu bằng UPDATE và tệp lui/113-lui.sql, ghi rõ dừng và báo khi lệch.
    - spec-alignment: PASS — sao lưu, lệnh áp, khối chạy thử năm dự án khớp cột «Nối» và các cột trường của bang-phu-ca §1, cách lùi, lệnh kiểm sau, điều kiện bộ nạp thật.
  human_override:  # chi nguoi ghi

### Lệnh suite (hồi quy)

- cmd: node scripts/suite-neu-doi.mjs agent -- 'cd agent && npm test'
  run_id: minted-thuoc-tinh-can-s16-SUITE-node_scripts_suite_neu_doi_mjs_agent_cd_-r1
  exit_code: 0
  verified_at: 2026-11-18T05:41:24Z

- cmd: node scripts/suite-neu-doi.mjs app -- 'cd app && npx tsc --noEmit && npm run lint'
  run_id: minted-thuoc-tinh-can-s16-SUITE-lint-r1
  exit_code: 0
  verified_at: 2026-11-18T05:41:24Z

- cmd: node scripts/suite-neu-doi.mjs app_ui -- 'cd app && npm test'
  run_id: minted-thuoc-tinh-can-s16-SUITE-node_scripts_suite_neu_doi_mjs_app_ui_cd-r1
  exit_code: 1
  verified_at: 2026-11-18T05:41:24Z
  output: |
    tests 1189, pass 1179, fail 1, skipped 9.
    Ca đỏ duy nhất: tests/gio-ops-gio-vn.test.tsx, «GV-AC-3 không còn mốc cắt chuỗi hay ngày theo múi máy ngoài danh sách miễn»: phát hiện mẫu «toLocale không múi» tại src/components/ops/registry/du-an-toa-grid.tsx (tệp do feature này sửa).

- cmd: node scripts/suite-neu-doi.mjs pipeline_a -- 'cd pipeline && npm run test:a'
  run_id: minted-thuoc-tinh-can-s16-SUITE-test_a-r1
  exit_code: 0
  verified_at: 2026-11-18T05:41:24Z

- cmd: node scripts/suite-neu-doi.mjs pipeline_b -- 'cd pipeline && npm run test:b'
  run_id: minted-thuoc-tinh-can-s16-SUITE-test_b-r1
  exit_code: 0
  verified_at: 2026-11-18T05:41:24Z

- cmd: node scripts/suite-neu-doi.mjs ui_lint_rules -- 'cd app && npm run test:lint-rules'
  run_id: minted-thuoc-tinh-can-s16-SUITE-test_lint_rules-r1
  exit_code: 0
  verified_at: 2026-11-18T05:41:24Z

- cmd: node scripts/suite-neu-doi.mjs portal_static -- 'node scripts/check-portal-compliance.mjs'
  run_id: minted-thuoc-tinh-can-s16-SUITE-node_scripts_suite_neu_doi_mjs_portal_st-r1
  exit_code: 0
  verified_at: 2026-11-18T05:41:24Z

## Known limits

## Ngoài hợp đồng

## Analyst

none — moi eval feature deu red tren baseline (co phan biet)

Baseline khong do
- bash _acceptance/thuoc-tinh-can-s16/probes/kiem.sh db: bo qua baseline: tep _acceptance/thuoc-tinh-can-s16/probes/kiem.sh co o cay dang kiem nhung chua co o merge-base af31d39931135d89041c7696c2a7de05134d8551 — eval moi, chay tren code cu khong phan biet gi
- bash _acceptance/thuoc-tinh-can-s16/probes/kiem.sh ham: bo qua baseline: tep _acceptance/thuoc-tinh-can-s16/probes/kiem.sh co o cay dang kiem nhung chua co o merge-base af31d39931135d89041c7696c2a7de05134d8551 — eval moi, chay tren code cu khong phan biet gi
- bash _acceptance/thuoc-tinh-can-s16/probes/kiem.sh app: bo qua baseline: tep _acceptance/thuoc-tinh-can-s16/probes/kiem.sh co o cay dang kiem nhung chua co o merge-base af31d39931135d89041c7696c2a7de05134d8551 — eval moi, chay tren code cu khong phan biet gi
- bash _acceptance/thuoc-tinh-can-s16/probes/kiem.sh that: bo qua baseline: tep _acceptance/thuoc-tinh-can-s16/probes/kiem.sh co o cay dang kiem nhung chua co o merge-base af31d39931135d89041c7696c2a7de05134d8551 — eval moi, chay tren code cu khong phan biet gi

## Variance

none — every multi-run eval is uniform

## Iterations

Round 1: E10 không đạt — step5 (mạng chậm) chỉ có Skeleton chung của toàn trang, thiếu Skeleton riêng cho ba ô phủ và cột thuộc tính. Thêm: bộ suite app_ui đỏ một ca GV-AC-3 do mẫu «toLocale không múi» trong du-an-toa-grid.tsx (lệnh suite không gắn eval). Returned to implementation.
