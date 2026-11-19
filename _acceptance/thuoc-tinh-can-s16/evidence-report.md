---
schema_version: 2
feature_slug: thuoc-tinh-can-s16
verdict: PASS
failed_evals: []
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: 676320242bccc448e76d4c630f98221dcd198165
human_signoff: Mạnh 2026-11-19
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
| E10 | AC-9 | ui-check | PASS |
| E11 | AC-10 | test | PASS |
| E12 | AC-10 | ui-check | PASS |
| E13 | AC-11 | script | PASS |
| E14 | AC-11 | judgment | PASS (đề xuất của hội đồng, chờ người chốt) |

## Evidence

- eval: E1
  run_id: minted-thuoc-tinh-can-s16-E1-r3
  exit_code: 0
  baseline: n-a
  verifier: _acceptance/thuoc-tinh-can-s16/probes/kiem.sh
  verified_at: 2026-11-18T12:47:29Z
  output: |
    bash _acceptance/thuoc-tinh-can-s16/probes/kiem.sh db (1 lượt, 1 đạt, không phương sai)
    ℹ duration_ms 2815.511125

- eval: E2
  run_id: minted-thuoc-tinh-can-s16-E2-r3
  exit_code: 0
  baseline: n-a
  verifier: _acceptance/thuoc-tinh-can-s16/probes/kiem.sh
  verified_at: 2026-11-18T12:47:29Z
  output: |
    bash _acceptance/thuoc-tinh-can-s16/probes/kiem.sh db (cùng lượt chạy với E1)
    ℹ duration_ms 2815.511125

- eval: E4
  run_id: minted-thuoc-tinh-can-s16-E4-r3
  exit_code: 0
  baseline: n-a
  verifier: _acceptance/thuoc-tinh-can-s16/probes/kiem.sh
  verified_at: 2026-11-18T12:47:29Z
  output: |
    bash _acceptance/thuoc-tinh-can-s16/probes/kiem.sh db (cùng lượt chạy với E1)
    ℹ duration_ms 2815.511125

- eval: E5
  run_id: minted-thuoc-tinh-can-s16-E5-r3
  exit_code: 0
  baseline: n-a
  verifier: _acceptance/thuoc-tinh-can-s16/probes/kiem.sh
  verified_at: 2026-11-18T12:47:29Z
  output: |
    bash _acceptance/thuoc-tinh-can-s16/probes/kiem.sh db (cùng lượt chạy với E1)
    ℹ duration_ms 2815.511125

- eval: E6
  run_id: minted-thuoc-tinh-can-s16-E6-r3
  exit_code: 0
  baseline: n-a
  verifier: _acceptance/thuoc-tinh-can-s16/probes/kiem.sh
  verified_at: 2026-11-18T12:47:29Z
  output: |
    bash _acceptance/thuoc-tinh-can-s16/probes/kiem.sh db (cùng lượt chạy với E1)
    ℹ duration_ms 2815.511125

- eval: E7
  run_id: minted-thuoc-tinh-can-s16-E7-r3
  exit_code: 0
  baseline: n-a
  verifier: _acceptance/thuoc-tinh-can-s16/probes/kiem.sh
  verified_at: 2026-11-18T12:47:29Z
  output: |
    bash _acceptance/thuoc-tinh-can-s16/probes/kiem.sh db (cùng lượt chạy với E1)
    ℹ duration_ms 2815.511125

- eval: E3
  run_id: minted-thuoc-tinh-can-s16-E3-r3
  exit_code: 0
  baseline: n-a
  verifier: _acceptance/thuoc-tinh-can-s16/probes/kiem.sh
  verified_at: 2026-11-18T12:47:29Z
  output: |
    bash _acceptance/thuoc-tinh-can-s16/probes/kiem.sh ham (1 lượt, 1 đạt)
    ℹ duration_ms 92.592041

- eval: E8
  run_id: minted-thuoc-tinh-can-s16-E8-r3
  exit_code: 0
  baseline: n-a
  verifier: _acceptance/thuoc-tinh-can-s16/probes/kiem.sh
  verified_at: 2026-11-18T12:47:29Z
  output: |
    bash _acceptance/thuoc-tinh-can-s16/probes/kiem.sh ham (cùng lượt chạy với E3)
    ℹ duration_ms 92.592041

- eval: E9
  run_id: minted-thuoc-tinh-can-s16-E9-r3
  exit_code: 0
  baseline: n-a
  verifier: _acceptance/thuoc-tinh-can-s16/probes/kiem.sh
  verified_at: 2026-11-18T12:47:29Z
  output: |
    bash _acceptance/thuoc-tinh-can-s16/probes/kiem.sh app (1 lượt, 1 đạt)
    ℹ duration_ms 5686.481791

- eval: E11
  run_id: minted-thuoc-tinh-can-s16-E11-r3
  exit_code: 0
  baseline: n-a
  verifier: _acceptance/thuoc-tinh-can-s16/probes/kiem.sh
  verified_at: 2026-11-18T12:47:29Z
  output: |
    bash _acceptance/thuoc-tinh-can-s16/probes/kiem.sh app (cùng lượt chạy với E9)
    ℹ duration_ms 5686.481791

- eval: E13
  run_id: minted-thuoc-tinh-can-s16-E13-r3
  exit_code: 0
  baseline: n-a
  verifier: _acceptance/thuoc-tinh-can-s16/probes/kiem.sh
  verified_at: 2026-11-18T12:47:29Z
  output: |
    bash _acceptance/thuoc-tinh-can-s16/probes/kiem.sh that
    tổng căn danh bạ có thuộc tính (view): 84820 · ô đã so: 40/40 · ô lệch: 0

- eval: E10
  run_id: minted-thuoc-tinh-can-s16-E10-r3
  exit_code: 0
  baseline: n-a
  verifier: config:dev_server.start   # tác tử chấm lái trình duyệt trên bản dev của worktree (:3463); sửa nhãn lúc ký vì kho không có khoá executors.ui-check
  verified_at: 2026-11-18T12:47:29Z
  screenshot: evidence/E10-step1.png
  observed: |
    step1 (1280 sáng): trang Khu Mẫu Alpha, ô phủ «22 / 24», «14», «0». Toà AT1 mở; cột Diện tích hiện «50 m²» và «Tim tường 56 m²», PN · WC «1 · —», Hướng «Đông...», sidebar hiện ops@example.invalid che một phần sau nút Insight của Next dev. step1b: cuộn bảng sang phải: Hướng, Loại hình «Căn hộ», giá «1,54 tỷ / 27,3 tr/m² thông thuỷ», «—» ở căn không giá, Badge S16 tím + «Thu 2026-11-18»; hàng cuối AT1-12 hiện nhãn «Chưa có thuộc tính». step2 (tối): cùng bảng, nền đen, Badge «Xác minh» xanh, S16 đọc được, «Chưa có thuộc tính» ở AT1-12. step3 (390): bảng chiếm bề rộng, cột Toà · căn và Bậc, phần còn lại cuộn trong khung, trang không cuộn ngang (đo 390=390). step4 (BL1 Beta): ô phủ 8 / 8 và 4; căn «240 m² sàn / Đất 80 m²», PN·WC 3·3, hướng Nam, loại Nhà riêng/Mặt bằng, «8 tỷ / 33,3 tr/m² thông thuỷ», S16. step4b (AT2 Alpha): các căn có WC «—» (vd 1 · —), hướng «—», giá «—» ở đúng ô, hàng cuối «Chưa có thuộc tính». step5: khung tải toàn trang, bảy ô Skeleton (4 + 3 ô phủ) và khối bảng Skeleton, sidebar vẫn có, email che. step6: Alert đỏ «Không tải được thuộc tính căn» kèm nút «Thử lại», bốn ô số, lưới AT1 và AT2 vẫn hiện, không ô phủ thuộc tính. Không frame nào có tên nguồn thật.
  network_observed: clean

- eval: E12
  run_id: minted-thuoc-tinh-can-s16-E12-r3
  exit_code: 0
  baseline: n-a
  verifier: config:dev_server.start   # tác tử chấm lái trình duyệt trên bản dev của worktree (:3463); sửa nhãn lúc ký vì kho không có khoá executors.ui-check
  verified_at: 2026-11-18T12:47:29Z
  screenshot: evidence/E12-step1.png
  observed: |
    Frame1 (Alpha): tiêu đề Khu Mẫu Alpha; hàng KPI Phân khu 0, Toà 2, Căn 24, Tin đang rao 0; hàng ô phủ: «Căn có thuộc tính 22 / 24» (S16 thu 2026-11-18), «Căn có giá chủ đầu tư 14», «Chưa vào danh bạ 0»; bên dưới bảng Toà và căn có AT1 (S16, 12 căn). Frame2 (Beta): «8 / 8», giá chủ đầu tư «4», Chưa vào danh bạ 0; toà BL1 8 căn. Frame3 (Gamma): «10 / 10», giá chủ đầu tư «5», «Chưa vào danh bạ 6»; toà GT1 10 căn. Frame4 (Delta): chỉ bốn ô KPI (Căn 4), không có ô phủ, dòng chữ «Chưa có nguồn thuộc tính căn cho dự án này.»; toà DT1 nguồn S09. Cả bốn khớp Expected; không thấy tên nguồn thật (chỉ mã S16/S09); email thanh bên bị che.
  network_observed: n-a (driver)

### Judgment

- eval: E14
  judged_by: hội đồng ba góc nhìn (fresh context)
  verdict: PASS
  rationale: Đề xuất của hội đồng, chưa phải quyết định cuối; hợp đồng T3 đòi người chốt trực tiếp. Chi tiết từng góc nhìn ở mục Judge panels bên dưới.
  human_override: Mạnh 2026-11-19 — Đạt

### Lệnh suite (hồi quy)

- cmd: node scripts/suite-neu-doi.mjs agent -- 'cd agent && npm test'
  run_id: minted-thuoc-tinh-can-s16-SUITE-node_scripts_suite_neu_doi_mjs_agent_cd_-r3
  exit_code: 0
  verified_at: 2026-11-18T12:47:29Z

- cmd: node scripts/suite-neu-doi.mjs app -- 'cd app && npx tsc --noEmit && npm run lint'
  run_id: minted-thuoc-tinh-can-s16-SUITE-lint-r3
  exit_code: 0
  verified_at: 2026-11-18T12:47:29Z

- cmd: node scripts/suite-neu-doi.mjs app_ui -- 'cd app && npm test'
  run_id: minted-thuoc-tinh-can-s16-SUITE-node_scripts_suite_neu_doi_mjs_app_ui_cd-r3
  exit_code: 0
  verified_at: 2026-11-18T12:47:29Z

- cmd: node scripts/suite-neu-doi.mjs pipeline_a -- 'cd pipeline && npm run test:a'
  run_id: minted-thuoc-tinh-can-s16-SUITE-test_a-r3
  exit_code: 0
  verified_at: 2026-11-18T12:47:29Z

- cmd: node scripts/suite-neu-doi.mjs pipeline_b -- 'cd pipeline && npm run test:b'
  run_id: minted-thuoc-tinh-can-s16-SUITE-test_b-r3
  exit_code: 0
  verified_at: 2026-11-18T12:47:29Z

- cmd: node scripts/suite-neu-doi.mjs ui_lint_rules -- 'cd app && npm run test:lint-rules'
  run_id: minted-thuoc-tinh-can-s16-SUITE-test_lint_rules-r3
  exit_code: 0
  verified_at: 2026-11-18T12:47:29Z

- cmd: node scripts/suite-neu-doi.mjs portal_static -- 'node scripts/check-portal-compliance.mjs'
  run_id: minted-thuoc-tinh-can-s16-SUITE-node_scripts_suite_neu_doi_mjs_portal_st-r3
  exit_code: 0
  verified_at: 2026-11-18T12:47:29Z

### Judge panels (đề xuất — human_override để trống)

E14: đề xuất PASS. Hợp đồng T3: người chốt trực tiếp ở Cổng 2.

- domain-correctness: PASS — ap-may-thu.md có đủ năm thứ: sao lưu trước (§1), lệnh áp 113/118/nạp/chạy thử/`--ghi` (§2), khối chạy thử đủ năm dự án khớp từng ô với bang-phu-ca §1 (§3), cách lùi gồm UPDATE rút phát biểu và `lui/113-lui.sql` (§4), lệnh kiểm sau (§5). Tệp ghi «lệch thì dừng và báo» ở §3 và §5. Điều kiện bộ nạp thật có mặt: mở đầu nói áp sau khi PR gộp, bộ nạp `import-s16-chi-tiet.mjs` đã tích hợp vào nhánh và làn thu phải nạp xong trước chạy thử. Điều kiện này chỉ được nêu ngầm qua «áp sau khi PR gộp», không có câu riêng «bộ nạp phải gộp trước khi áp».
- operational-feasibility: PASS — ap-may-thu.md có đủ năm mục: sao lưu trước (§1), lệnh áp (§2), số chạy thử (§3), cách lùi gồm lệnh rút phát biểu và tệp lùi 113-lui.sql (§4), lệnh kiểm sau (§5). Khối `chay-thu` có đủ năm dự án (grand-park, ocean-park, ocean-park-2, ocean-park-3, smart-city), và từng ô khớp các cột Nối, Thông thuỷ, Tim tường, PN, WC, Hướng, Loại hình, Giá CĐT ở bang-phu-ca.md §1. Tệp ghi lệch thì dừng và báo ở §3 và §5, và đặt điều kiện trước là bộ nạp của làn thu đã nạp snapshot, áp sau khi PR gộp; điều kiện bộ nạp phải gộp trước khi áp được nêu ngầm hơn là thành một câu riêng, nhưng đủ rõ.
- spec-alignment: PASS — ap-may-thu.md có đủ năm thứ: sao lưu trước (§1), lệnh áp (§2), số chạy thử (§3), cách lùi gồm lệnh rút phát biểu và tệp lui/113-lui.sql (§4), lệnh kiểm sau (§5). Khối chay-thu có đúng năm dự án đã nối và khớp từng ô với cột «Nối» và các trường ở bang-phu-ca.md §1. Tệp ghi rõ lệch thì dừng và báo (§3, §5), và điều kiện bộ nạp thật của làn thu: phải nạp snapshot trước khi chạy thử, áp sau khi PR gộp mà bộ nạp đã nằm trong nhánh. Tệp lùi 113-lui.sql ngoài danh sách input nên không mở, chỉ dựa vào đường dẫn và mô tả trong tệp.

## Known limits

## Ngoài hợp đồng

## Analyst

none — mọi eval feature đều red trên baseline (có phân biệt)

Baseline không đo:
- bash _acceptance/thuoc-tinh-can-s16/probes/kiem.sh db: bo qua baseline: tep _acceptance/thuoc-tinh-can-s16/probes/kiem.sh co o cay dang kiem nhung chua co o merge-base 24ba6910f03f5ae33e63800ac95715b80da01a31 — eval moi, chay tren code cu khong phan biet gi
- bash _acceptance/thuoc-tinh-can-s16/probes/kiem.sh ham: bo qua baseline: tep _acceptance/thuoc-tinh-can-s16/probes/kiem.sh co o cay dang kiem nhung chua co o merge-base 24ba6910f03f5ae33e63800ac95715b80da01a31 — eval moi, chay tren code cu khong phan biet gi
- bash _acceptance/thuoc-tinh-can-s16/probes/kiem.sh app: bo qua baseline: tep _acceptance/thuoc-tinh-can-s16/probes/kiem.sh co o cay dang kiem nhung chua co o merge-base 24ba6910f03f5ae33e63800ac95715b80da01a31 — eval moi, chay tren code cu khong phan biet gi
- bash _acceptance/thuoc-tinh-can-s16/probes/kiem.sh that: bo qua baseline: tep _acceptance/thuoc-tinh-can-s16/probes/kiem.sh co o cay dang kiem nhung chua co o merge-base 24ba6910f03f5ae33e63800ac95715b80da01a31 — eval moi, chay tren code cu khong phan biet gi

## Variance

none — every multi-run eval is uniform

## Iterations

Round 3: E1-E13 đạt trên bản 3cdaec6e2; E14 là mục judgment chờ người chốt ở Cổng 2 (T3), nên verdict là PENDING-JUDGMENT. Lịch sử round 1-2 xem các bản ghi trước.

### Re-pin lần 1 — 2026-11-18, do sửa thước E13 và ca chốt bộ nạp sau vòng 3; nhận main có PR 490
run_id: repin-20261118T174145Z-75113
sha: 9c9849c9510c8b13e240f8f093f9e86d74d64822 · suites: 7 lệnh exit 0 · evals: 11/11 eval máy đạt kỳ vọng · ngoài làn máy: E10, E12, E14 (E14 không khai paths)

### Re-pin lần 2 — 2026-11-19, do nhận main ece3ebceb sau chữ ký
run_id: repin-20261118T230519Z-12264
sha: 676320242bccc448e76d4c630f98221dcd198165 · suites: 7 lệnh exit 0 · evals: 11/11 eval máy đạt kỳ vọng · ngoài làn máy: E10, E12, E14 (E14 không khai paths)
