---
schema_version: 2
feature_slug: ui-clean-b3-charts
verdict: PASS
failed_evals: []
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: 4efc745f852b1dc12bd5e69d1ea46da662b0d6aa
human_signoff:
---

# Evidence Report: ui-clean-b3-charts

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | script | PASS |
| E2 | AC-2 | script | PASS |
| E3 | AC-3 | script | PASS |
| E4 | AC-4 | script | PASS |
| E5 | AC-5 | script | PASS |
| E6 | AC-6 | test | PASS |
| E7 | AC-6 | script | PASS |
| E8 | AC-7 | script | PASS |
| E9 | AC-8 | script | PASS |
| E10 | AC-9 | ui-check | PASS |
| E11 | AC-1 | script | PASS |
| E12 | AC-10 | script | PASS |
| E13 | AC-9 | ui-check | PASS |
| E14 | AC-8 | script | PASS |

## Evidence

- eval: E1
  run_id: minted-ui-clean-b3-charts-E1-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.ui_b3_palette
  verified_at: 2026-10-23T00:02:53Z
  output: |
    palette: ĐẠT

- eval: E2
  run_id: minted-ui-clean-b3-charts-E2-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.ui_b3_contrast
  verified_at: 2026-10-23T00:02:53Z
  output: |
    contrast: ĐẠT

- eval: E3
  run_id: minted-ui-clean-b3-charts-E3-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.ui_b3_data_color
  verified_at: 2026-10-23T00:02:53Z
  output: |
    data-color: ĐẠT

- eval: E4
  run_id: minted-ui-clean-b3-charts-E4-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.ui_b3_duplicates
  verified_at: 2026-10-23T00:02:53Z
  output: |
    duplicates: ĐẠT

- eval: E5
  run_id: minted-ui-clean-b3-charts-E5-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.ui_b3_file_size
  verified_at: 2026-10-23T00:02:53Z
  output: |
    file-size: ĐẠT

- eval: E6
  run_id: minted-ui-clean-b3-charts-E6-r1
  exit_code: 0
  baseline: red
  verifier: config:executors.test.app
  verified_at: 2026-10-23T00:02:53Z

- eval: E7
  run_id: minted-ui-clean-b3-charts-E7-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.ui_b3_suppressions
  verified_at: 2026-10-23T00:02:53Z
  output: |
    suppressions: ĐẠT

- eval: E8
  run_id: minted-ui-clean-b3-charts-E8-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.ui_b3_api
  verified_at: 2026-10-23T00:02:53Z
  output: |
    api: ĐẠT

- eval: E9
  run_id: minted-ui-clean-b3-charts-E9-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.ui_b3_structure
  verified_at: 2026-10-23T00:02:53Z
  output: |
    structure: ĐẠT

- eval: E10
  run_id: E10-ui-clean-b3-charts
  exit_code: 0
  baseline: n-a
  verifier: config:executors.design.ui_check
  verified_at: 2026-10-23T00:02:53Z
  screenshot: evidence/E10-step1-tooltip.png
  observed: |
    Đã Read từng file. 20 ảnh s4 so với 20 ảnh before: (1) market-performance và ward-performance (sáng/tối, 1280 và 390): đường + vùng tô + chấm chú giải + gạch dưới tab Doanh thu đổi từ teal sang indigo; chữ, số, bố cục, khoảng cách, vạch Tết, 30/4, Hè y hệt before; đọc rõ trên nền thẻ cả sáng lẫn tối. (2) market-mix và ward-mix (4 chế độ mỗi trang): donut + chấm chú giải đổi từ tím sang chàm 2-3 sắc (đậm/vừa/nhạt); 3 lát (market) hoặc 2 lát (ward) phân biệt được với nhau và với nền thẻ sáng+tối; số (21 tỷ/4,5 tỷ, 257/23 listing, 66%/34%...) và bố cục không đổi; lát 0% "Phòng ở chung" gần như không thấy nhưng chấm chú giải thấy rõ. (3) yield-pnl 8 ảnh: giống hệt before (cột Doanh thu chàm, Chi phí xám, đường Biên lợi nhuận xanh lục), pnl không đổi màu, đúng expected. Browser pane: E10-step1-tooltip.png = tooltip "Tháng 2/2027 Tết, Doanh thu 131.267.686" có chấm chàm; E10-step2-occupancy.png = sau khi bấm Công suất đường đổi sang amber, trục 0-100%, nhãn 21,7%; E10-step3-yield-quarter.png = /yield ở chế độ Quý, 4 cặp cột T10-T12/T1-T3/T4-T6/T7-T9, tooltip quý có chấm màu cho 3 chỉ số, KPI dưới giữ nguyên. Không mâu thuẫn Expected.
  network_observed: clean

- eval: E11
  run_id: minted-ui-clean-b3-charts-E11-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.ui_b3_selftest
  verified_at: 2026-10-23T00:02:53Z
  output: |
    37/37 ca đạt

- eval: E12
  run_id: minted-ui-clean-b3-charts-E12-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.ui_b3_docs
  verified_at: 2026-10-23T00:02:53Z
  output: |
    docs: ĐẠT

- eval: E13
  run_id: ui-clean-b3-charts-E13-001
  exit_code: 0
  baseline: n-a
  verifier: config:executors.design.ui_check
  verified_at: 2026-10-23T00:02:53Z
  screenshot: evidence/E13-step1.png
  observed: |
    Đã mở bằng Read từng file frame vừa lưu. E13-hoan-kiem-light-performance.png: khung "Hiệu suất theo tháng" nền sáng, 4 ô số liệu (Doanh thu 4,5 tỷ ₫, Công suất 19,1%, ADR 2.794.544 ₫, RevPAR 534.608 ₫), đường doanh thu T10/26-T9/27 màu chàm, nhãn trục, vạch Tết, 30/4, Hè và nhãn giá trị 390.241.320 ₫ đọc rõ, không chữ bị cắt hay tràn. E13-hoan-kiem-dark-performance.png: cùng khung ở nền tối, đường chàm sáng hơn, chữ sáng trên nền gần đen, đọc rõ.
    E13-hoan-kiem-light-mix.png và dark-mix.png: khung "Cơ cấu doanh thu", donut hai màu chàm đậm/nhạt (tối chuyển tông sáng), giữa ghi 23 listing, chú giải Nguyên căn 3,4 tỷ 75% (10 listing) và Phòng riêng 1,1 tỷ 25% (13 listing) đọc rõ; chấm "N" của chỉ báo dev Next.js đè góc khung, không phải lỗi giao diện. E13-yield-light-pnl.png và dark-pnl.png: khung "Doanh thu và chi phí 12 tháng tới", cột Doanh thu chàm, Chi phí xám, đường Biên lợi nhuận xanh lục, đường ngang thuê dài hạn 91,2%, 4 ô số dưới; chữ đọc rõ, không tràn; nhãn trục phải 30%-90% dồn sát nhau (nhận xét phụ, không phải P0). E13-step1.png và E13-step4.png: trang tải đủ, ba khung đúng chỗ, tiêu đề đúng, dữ liệu hiển thị. Các frame khớp kết quả quét 0 P0 trong khung, không frame nào mâu thuẫn Expected.
  network_observed: unscoped-partial

- eval: E14
  run_id: minted-ui-clean-b3-charts-E14-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.ui_b3_pixels
  verified_at: 2026-10-23T00:02:53Z
  output: |
    pixels: ĐẠT

### Lệnh suite (hồi quy)

- cmd: cd app && npm run test:lint-rules
  run_id: minted-ui-clean-b3-charts-SUITE-test_lint_rules-r1
  exit_code: 0
  verified_at: 2026-10-23T00:02:53Z

## Known limits

## Ngoài hợp đồng

## Analyst

none — mọi eval feature đều red trên baseline (có phân biệt)

### Baseline khong do

- node scripts/ui-standards/b3-check.mjs palette: bo qua baseline: tep scripts/ui-standards/b3-check.mjs co o cay dang kiem nhung chua co o merge-base f51b01c554590e75f13f07dfff65f6853351b7d9 — eval moi, chay tren code cu khong phan biet gi
- node scripts/ui-standards/b3-check.mjs contrast: bo qua baseline: tep scripts/ui-standards/b3-check.mjs co o cay dang kiem nhung chua co o merge-base f51b01c554590e75f13f07dfff65f6853351b7d9 — eval moi, chay tren code cu khong phan biet gi
- node scripts/ui-standards/b3-check.mjs data-color: bo qua baseline: tep scripts/ui-standards/b3-check.mjs co o cay dang kiem nhung chua co o merge-base f51b01c554590e75f13f07dfff65f6853351b7d9 — eval moi, chay tren code cu khong phan biet gi
- node scripts/ui-standards/b3-check.mjs duplicates: bo qua baseline: tep scripts/ui-standards/b3-check.mjs co o cay dang kiem nhung chua co o merge-base f51b01c554590e75f13f07dfff65f6853351b7d9 — eval moi, chay tren code cu khong phan biet gi
- node scripts/ui-standards/b3-check.mjs file-size: bo qua baseline: tep scripts/ui-standards/b3-check.mjs co o cay dang kiem nhung chua co o merge-base f51b01c554590e75f13f07dfff65f6853351b7d9 — eval moi, chay tren code cu khong phan biet gi
- node scripts/ui-standards/b3-check.mjs suppressions: bo qua baseline: tep scripts/ui-standards/b3-check.mjs co o cay dang kiem nhung chua co o merge-base f51b01c554590e75f13f07dfff65f6853351b7d9 — eval moi, chay tren code cu khong phan biet gi
- node scripts/ui-standards/b3-check.mjs api: bo qua baseline: tep scripts/ui-standards/b3-check.mjs co o cay dang kiem nhung chua co o merge-base f51b01c554590e75f13f07dfff65f6853351b7d9 — eval moi, chay tren code cu khong phan biet gi
- node scripts/ui-standards/b3-check.mjs structure: bo qua baseline: tep scripts/ui-standards/b3-check.mjs co o cay dang kiem nhung chua co o merge-base f51b01c554590e75f13f07dfff65f6853351b7d9 — eval moi, chay tren code cu khong phan biet gi
- node scripts/ui-standards/b3-check.mjs selftest: bo qua baseline: tep scripts/ui-standards/b3-check.mjs co o cay dang kiem nhung chua co o merge-base f51b01c554590e75f13f07dfff65f6853351b7d9 — eval moi, chay tren code cu khong phan biet gi
- node scripts/ui-standards/b3-check.mjs docs: bo qua baseline: tep scripts/ui-standards/b3-check.mjs co o cay dang kiem nhung chua co o merge-base f51b01c554590e75f13f07dfff65f6853351b7d9 — eval moi, chay tren code cu khong phan biet gi
- node scripts/ui-standards/b3-check.mjs pixels: bo qua baseline: tep scripts/ui-standards/b3-check.mjs co o cay dang kiem nhung chua co o merge-base f51b01c554590e75f13f07dfff65f6853351b7d9 — eval moi, chay tren code cu khong phan biet gi

## Variance

none — mọi eval nhiều lần chạy đều đồng nhất (không eval nào có runs lớn hơn 1)

## Iterations

Round 1: cả 14 eval đạt, không eval nào fail, không có mục judgment chờ người; verdict PASS.
