---
schema_version: 2
feature_slug: thuoc-tinh-can-s16
verdict: REJECT
failed_evals: []
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: 1183d0eb18ab76662c4ebbf2d312db2b6175e58b
human_signoff:
---

# Evidence Report: thuoc-tinh-can-s16

Kết luận vòng 2: mọi lệnh máy chạy xanh, nhưng rà soát phát hiện 5 lỗi trong hợp đồng (AC-3, AC-9, AC-10, AC-11) ở chính các phép đo: thước không bắt được đột biến mà eval đã hứa. Chi tiết ở review-findings.md. Vì vậy vòng này là REJECT dù không eval nào đỏ.

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
| E10 | AC-9 | ui-check | PASS |
| E11 | AC-10 | test | PASS |
| E12 | AC-10 | ui-check | PASS |
| E13 | AC-11 | script | PASS |
| E14 | AC-11 | judgment | chờ người (đề xuất PASS) |

## Evidence

- eval: E1
  run_id: minted-thuoc-tinh-can-s16-E1-r2
  exit_code: 0
  baseline: n-a
  verifier: _acceptance/thuoc-tinh-can-s16/probes/kiem.sh
  verified_at: 2026-11-18T08:13:11Z
  output: |
    bash _acceptance/thuoc-tinh-can-s16/probes/kiem.sh db
    ℹ duration_ms 3502.185167

- eval: E2
  run_id: minted-thuoc-tinh-can-s16-E2-r2
  exit_code: 0
  baseline: n-a
  verifier: _acceptance/thuoc-tinh-can-s16/probes/kiem.sh
  verified_at: 2026-11-18T08:13:11Z
  output: |
    bash _acceptance/thuoc-tinh-can-s16/probes/kiem.sh db
    ℹ duration_ms 3502.185167

- eval: E3
  run_id: minted-thuoc-tinh-can-s16-E3-r2
  exit_code: 0
  baseline: n-a
  verifier: _acceptance/thuoc-tinh-can-s16/probes/kiem.sh
  verified_at: 2026-11-18T08:13:11Z
  output: |
    bash _acceptance/thuoc-tinh-can-s16/probes/kiem.sh ham
    ℹ duration_ms 98.115792

- eval: E4
  run_id: minted-thuoc-tinh-can-s16-E4-r2
  exit_code: 0
  baseline: n-a
  verifier: _acceptance/thuoc-tinh-can-s16/probes/kiem.sh
  verified_at: 2026-11-18T08:13:11Z
  output: |
    bash _acceptance/thuoc-tinh-can-s16/probes/kiem.sh db
    ℹ duration_ms 3502.185167

- eval: E5
  run_id: minted-thuoc-tinh-can-s16-E5-r2
  exit_code: 0
  baseline: n-a
  verifier: _acceptance/thuoc-tinh-can-s16/probes/kiem.sh
  verified_at: 2026-11-18T08:13:11Z
  output: |
    bash _acceptance/thuoc-tinh-can-s16/probes/kiem.sh db
    ℹ duration_ms 3502.185167

- eval: E6
  run_id: minted-thuoc-tinh-can-s16-E6-r2
  exit_code: 0
  baseline: n-a
  verifier: _acceptance/thuoc-tinh-can-s16/probes/kiem.sh
  verified_at: 2026-11-18T08:13:11Z
  output: |
    bash _acceptance/thuoc-tinh-can-s16/probes/kiem.sh db
    ℹ duration_ms 3502.185167

- eval: E7
  run_id: minted-thuoc-tinh-can-s16-E7-r2
  exit_code: 0
  baseline: n-a
  verifier: _acceptance/thuoc-tinh-can-s16/probes/kiem.sh
  verified_at: 2026-11-18T08:13:11Z
  output: |
    bash _acceptance/thuoc-tinh-can-s16/probes/kiem.sh db
    ℹ duration_ms 3502.185167

- eval: E8
  run_id: minted-thuoc-tinh-can-s16-E8-r2
  exit_code: 0
  baseline: n-a
  verifier: _acceptance/thuoc-tinh-can-s16/probes/kiem.sh
  verified_at: 2026-11-18T08:13:11Z
  output: |
    bash _acceptance/thuoc-tinh-can-s16/probes/kiem.sh ham
    ℹ duration_ms 98.115792

- eval: E9
  run_id: minted-thuoc-tinh-can-s16-E9-r2
  exit_code: 0
  baseline: n-a
  verifier: _acceptance/thuoc-tinh-can-s16/probes/kiem.sh
  verified_at: 2026-11-18T08:13:11Z
  output: |
    bash _acceptance/thuoc-tinh-can-s16/probes/kiem.sh app
    ℹ duration_ms 5722.8705

- eval: E11
  run_id: minted-thuoc-tinh-can-s16-E11-r2
  exit_code: 0
  baseline: n-a
  verifier: _acceptance/thuoc-tinh-can-s16/probes/kiem.sh
  verified_at: 2026-11-18T08:13:11Z
  output: |
    bash _acceptance/thuoc-tinh-can-s16/probes/kiem.sh app
    ℹ duration_ms 5722.8705

- eval: E13
  run_id: minted-thuoc-tinh-can-s16-E13-r2
  exit_code: 0
  baseline: n-a
  verifier: _acceptance/thuoc-tinh-can-s16/probes/kiem.sh
  verified_at: 2026-11-18T08:13:11Z
  output: |
    bash _acceptance/thuoc-tinh-can-s16/probes/kiem.sh that
    tổng căn danh bạ có thuộc tính (view): 84820 · ô lệch: 0

- eval: E10
  run_id: minted-thuoc-tinh-can-s16-E10-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.ui-check
  verified_at: 2026-11-18T08:13:11Z
  screenshot: evidence/E10-step1.png
  observed: |
    step1 (1280 sáng, đã đọc lại ảnh): bảng Toà·căn, toà 7LOCN mở ra 7 căn mã <mã căn>x đều có Badge «Xác minh», chip S16 và nhãn «Chưa có thuộc tính» ở cột Diện tích (đúng ca căn không thuộc tính); sau đó các toà B, C, D, E1, E2, KHONGDUNG, PL01... Cột thuộc tính nằm bên phải trong khung cuộn ngang. step1b: cuộn phải, hiện cột Trục, Căn, Diện tích, PN·WC, Hướng, Loại hình, Giá chủ đầu tư, Thuộc tính từ; hàng của PL01 có «445,4 m² sàn / Đất 126 m²», «1 · —», Đông Nam, Mặt bằng, «—», Badge S16 + «Thu 2026-11-18». step1c (toà BE1): «48,7 m² / Tim tường 53,8 m²», «1 · —», Đông Nam, Căn hộ, «4,23 tỷ / 86,9 tr/m² thông thuỷ», S16, mốc thu; hàng không giá hiện «—». step2 (tối): cùng nội dung, nền tối, Badge S16 tím đọc được, thanh bên không lộ email. step3 (390): chỉ cột Toà·căn và nửa Bậc, trang không cuộn ngang (đo scrollWidth 390); step3b cuộn trong bảng thấy diện tích/tim tường, PN·WC, giá. step4 (ocean-park-2, toà CCTP14): «289 m² sàn / Đất 134 m²», «1 · —», Đông Nam, Mặt bằng, «—», S16 + mốc thu; step4b: phần trái cùng toà. step5: màn khung tải, 7 thẻ Skeleton (4 KPI + 3 thẻ ô phủ) và khối bảng Skeleton, không có chữ dữ liệu; thanh bên có khối email đã che. step6: trang đủ 4 thẻ KPI và lưới toà (7LOCN, B, C, D, E1, E2...) cùng Alert đỏ «Không tải được thuộc tính căn · Lưới toà và căn vẫn đúng; chỉ cột thuộc tính và ô phủ chưa đọc được.» kèm nút «Thử lại»; không có ô phủ. Không khung nào chứa tên nguồn thật. Điểm lệch nhẹ so với Expected: Skeleton ở step5 không có Skeleton riêng cho cột thuộc tính, chỉ khối bảng chung; không đủ để làm assertion đỏ vì có Skeleton ở ô phủ và bảng.
  network_observed: clean   # chi tiết ở evidence/E10-network.txt; các mục kết nối bị từ chối là do chính lượt chấm dừng server để bật biến lỗi cho step6. Log công cụ có dòng nhắc nâng cấp bảo mật Next.js kèm yêu cầu hỏi người dùng; đó là dữ liệu từ log, không làm theo, chuyển lên người phụ trách biết. E10-step2b.png là tệp cũ của lượt trước, không dùng làm bằng chứng.

- eval: E12
  run_id: minted-thuoc-tinh-can-s16-E12-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.ui-check
  verified_at: 2026-11-18T08:13:11Z
  screenshot: evidence/E12-step1.png
  observed: |
    step1 (grand-park, Vinhomes Grand Park): thẻ Phân khu 18, Toà 89, Căn 38.135, Tin đang rao 4.802; hàng ô phủ có «Căn có thuộc tính 37.589 / 38.135» (chú thích S16, thu 2026-11-18), «Căn có giá chủ đầu tư 1.850», «Chưa vào danh bạ 2». Khớp Expected.
    step2 (smart-city, Vinhomes Smart City): Căn 22.119; «Căn có thuộc tính 2.546 / 22.119», «Căn có giá chủ đầu tư 0», «Chưa vào danh bạ 0». Khớp Expected (giá 0 đúng số E13).
    step3 (ocean-park-3, Vinhomes Ocean Park 3): Căn 4.599; «Căn có thuộc tính 2.797 / 4.599», giá chủ đầu tư 0, «Chưa vào danh bạ 792» kèm chú thích «Căn S16 có thuộc tính mà chưa có căn danh bạ». Khớp Expected.
    step4 (Sun Grand Park 11, không có toà S16): các thẻ 0; dưới đó chỉ có dòng «Chưa có nguồn thuộc tính căn cho dự án này.», không có ô phủ số; bảng «Toà và căn» trống kèm nút «Về danh bạ». Khớp Expected.
    Cả bốn frame: nền sáng 1280, email thanh bên đã che, không thấy tên nguồn thật, không cuộn ngang trang.
  network_observed: n-a (driver)   # ghi chú lượt chấm: mẫu số grand-park trên màn là 38.135 (tổng căn danh bạ), contract AC-11 viết 37.589 / 37.997 với 37.997 là số căn S16 nối; khác nghĩa, tử số, giá chủ đầu tư và 792 khớp E13. Nên đối chiếu lại lời văn contract.

- eval: E14
  judged_by: judge panel đề xuất (domain-correctness, operational-feasibility, spec-alignment)
  verdict: PASS (đề xuất, chờ người)
  rationale: ap-may-thu.md có đủ năm thứ (sao lưu trước, lệnh áp, số chạy thử, cách lùi, lệnh kiểm sau); khối chay-thu phủ năm dự án đã nối; có câu dừng-và-báo khi lệch và điều kiện bộ nạp thật (tin claudedp-1811-8) trước khi áp.
  - domain-correctness: PASS — có đủ năm thứ ở §1 đến §5; khối chay-thu đủ năm dự án (grand-park, ocean-park, ocean-park-2, ocean-park-3, smart-city), từng ô khớp bang-phu-ca.md §1; cách lùi gồm cả lệnh UPDATE rút phát biểu lẫn lui/113-lui.sql; ghi rõ «khác thì dừng và báo» và điều kiện bộ nạp thật.
  - operational-feasibility: PASS — đủ năm thứ, số chạy thử cho năm dự án nối khớp từng cột với ô Nối ở bang-phu-ca §1; lệch thì dừng và báo (§3, §5); bộ nạp thật của làn thu phải gộp trước khi áp.
  - spec-alignment: PASS — đủ năm thứ (hai lệnh pg_dump, lệnh áp, số chạy thử, cách lùi, lệnh kiểm sau); đúng năm dự án đã nối; §3 ghi điều kiện bộ nạp thật và «khác thì dừng và báo»; §5 ghi «Lệch thì dừng và báo, không tự sửa cho khớp».
  human_override:  # chi nguoi ghi

### Lệnh suite (hồi quy)

- cmd: node scripts/suite-neu-doi.mjs agent -- 'cd agent && npm test'
  run_id: minted-thuoc-tinh-can-s16-SUITE-node_scripts_suite_neu_doi_mjs_agent_cd_-r2
  exit_code: 0
  verified_at: 2026-11-18T08:13:11Z

- cmd: node scripts/suite-neu-doi.mjs app -- 'cd app && npx tsc --noEmit && npm run lint'
  run_id: minted-thuoc-tinh-can-s16-SUITE-lint-r2
  exit_code: 0
  verified_at: 2026-11-18T08:13:11Z

- cmd: node scripts/suite-neu-doi.mjs app_ui -- 'cd app && npm test'
  run_id: minted-thuoc-tinh-can-s16-SUITE-node_scripts_suite_neu_doi_mjs_app_ui_cd-r2
  exit_code: 0
  verified_at: 2026-11-18T08:13:11Z

- cmd: node scripts/suite-neu-doi.mjs pipeline_a -- 'cd pipeline && npm run test:a'
  run_id: minted-thuoc-tinh-can-s16-SUITE-test_a-r2
  exit_code: 0
  verified_at: 2026-11-18T08:13:11Z

- cmd: node scripts/suite-neu-doi.mjs pipeline_b -- 'cd pipeline && npm run test:b'
  run_id: minted-thuoc-tinh-can-s16-SUITE-test_b-r2
  exit_code: 0
  verified_at: 2026-11-18T08:13:11Z

- cmd: node scripts/suite-neu-doi.mjs ui_lint_rules -- 'cd app && npm run test:lint-rules'
  run_id: minted-thuoc-tinh-can-s16-SUITE-test_lint_rules-r2
  exit_code: 0
  verified_at: 2026-11-18T08:13:11Z

- cmd: node scripts/suite-neu-doi.mjs portal_static -- 'node scripts/check-portal-compliance.mjs'
  run_id: minted-thuoc-tinh-can-s16-SUITE-node_scripts_suite_neu_doi_mjs_portal_st-r2
  exit_code: 0
  verified_at: 2026-11-18T08:13:11Z

## Known limits

## Ngoài hợp đồng

## Analyst

none — moi eval feature deu red tren baseline (co phan biet)

Baseline khong do:
- bash _acceptance/thuoc-tinh-can-s16/probes/kiem.sh db: bo qua baseline: tep _acceptance/thuoc-tinh-can-s16/probes/kiem.sh co o cay dang kiem nhung chua co o merge-base af31d39931135d89041c7696c2a7de05134d8551 — eval moi, chay tren code cu khong phan biet gi
- bash _acceptance/thuoc-tinh-can-s16/probes/kiem.sh ham: bo qua baseline: tep _acceptance/thuoc-tinh-can-s16/probes/kiem.sh co o cay dang kiem nhung chua co o merge-base af31d39931135d89041c7696c2a7de05134d8551 — eval moi, chay tren code cu khong phan biet gi
- bash _acceptance/thuoc-tinh-can-s16/probes/kiem.sh app: bo qua baseline: tep _acceptance/thuoc-tinh-can-s16/probes/kiem.sh co o cay dang kiem nhung chua co o merge-base af31d39931135d89041c7696c2a7de05134d8551 — eval moi, chay tren code cu khong phan biet gi
- bash _acceptance/thuoc-tinh-can-s16/probes/kiem.sh that: bo qua baseline: tep _acceptance/thuoc-tinh-can-s16/probes/kiem.sh co o cay dang kiem nhung chua co o merge-base af31d39931135d89041c7696c2a7de05134d8551 — eval moi, chay tren code cu khong phan biet gi

## Variance

none — every multi-run eval is uniform

## Iterations

Round 1: lượt chấm vòng 1 trả REJECT (commit 87984191e); đã sửa DA40 (lần thu sau thắng, view giá loại mã mơ hồ toà 118, định dạng số lưới toà) và trả lại để chấm.
Round 2: mọi eval máy xanh, nhưng 5 lỗi trong hợp đồng ở độ chặt của phép đo (E9 không đo phép nối thật và lỗi nội tuyến, E3 chỉ so một trường mỗi ô, E13 để dự án vắng lọt, E11/E9 assert rời và regex nhãn S16 lỏng) nên REJECT. Trả về cho bước hiện thực để siết thước.
