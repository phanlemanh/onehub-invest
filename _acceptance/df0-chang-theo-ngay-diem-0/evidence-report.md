---
schema_version: 2
feature_slug: df0-chang-theo-ngay-diem-0
verdict: PASS
failed_evals: []
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: 31c2fc1fecec7432850c37db6e66a36957cc505e
human_signoff: Mạnh 2026-10-27
---

# Evidence Report: df0-chang-theo-ngay-diem-0

Round 3. Tám eval của hợp đồng đều xanh: sáu eval test (E1, E2, E3, E4, E5, E8) chạy trong cùng một lệnh và qua, E7 (ui-check) chạy lại và khớp Expected, E6 là đề xuất của hội đồng judge giữ nguyên từ round 2. Cả sáu lệnh suite hồi quy xanh, kể cả `cd app && npm test` (ca GV-AC-3 đỏ ở round 2 nay đã xanh sau khi chuỗi ngày dùng vnDayKey).

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | test | PASS |
| E2 | AC-2 | test | PASS |
| E3 | AC-3 | test | PASS |
| E4 | AC-4 | test | PASS |
| E5 | AC-5 | test | PASS |
| E6 | AC-6 | judgment | PASS |
| E7 | AC-7 | ui-check | PASS |
| E8 | AC-8 | test | PASS |

## Evidence

- eval: E1
  run_id: minted-df0-chang-theo-ngay-diem-0-E1-r3
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.chang_ngay
  verified_at: 2026-10-27T00:06:19Z
  output: |
    cd app && node --import tsx --test tests/df0-chang-theo-ngay.test.tsx
    ℹ duration_ms 968.993292

- eval: E2
  run_id: minted-df0-chang-theo-ngay-diem-0-E2-r3
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.chang_ngay
  verified_at: 2026-10-27T00:06:19Z
  output: |
    cd app && node --import tsx --test tests/df0-chang-theo-ngay.test.tsx
    ℹ duration_ms 968.993292

- eval: E3
  run_id: minted-df0-chang-theo-ngay-diem-0-E3-r3
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.chang_ngay
  verified_at: 2026-10-27T00:06:19Z
  output: |
    cd app && node --import tsx --test tests/df0-chang-theo-ngay.test.tsx
    ℹ duration_ms 968.993292

- eval: E4
  run_id: minted-df0-chang-theo-ngay-diem-0-E4-r3
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.chang_ngay
  verified_at: 2026-10-27T00:06:19Z
  output: |
    cd app && node --import tsx --test tests/df0-chang-theo-ngay.test.tsx
    ℹ duration_ms 968.993292

- eval: E5
  run_id: minted-df0-chang-theo-ngay-diem-0-E5-r3
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.chang_ngay
  verified_at: 2026-10-27T00:06:19Z
  output: |
    cd app && node --import tsx --test tests/df0-chang-theo-ngay.test.tsx
    ℹ duration_ms 968.993292

- eval: E6
  judged_by: judge-subagent (fresh context), đề xuất panel 3 góc nhìn
  verdict: PASS
  rationale: Panel giữ nguyên từ round 2 — inputs không đổi, không chấm lại; rationale xem round 2.
  votes:
    - domain-correctness: PASS (r2)
    - operational-feasibility: PASS (r2)
    - spec-alignment: PASS (r2)
  required_evidence:
    - (judge không nêu bằng-chứng-thiếu)
  human_override:  # chi nguoi ghi

- eval: E7
  run_id: minted-df0-chang-theo-ngay-diem-0-E7-r3
  exit_code: 0
  baseline: n-a
  verifier: config:executors.design.ui_check
  verified_at: 2026-10-27T00:06:19Z
  screenshot: evidence/E7-step1.png
  observed: |
    E7-step1.png (đã mở bằng Read): trang Dòng chảy dữ liệu, nút «30 ngày» đang chọn. Khung «Chặng theo ngày» hiện bốn ô tổng Bài nhận 34.590, Đọc được 24.292 70,2%, Tin rao mới 21.248 87,5%, Gắn căn 20.893 98,3%. Biểu đồ diện tích có trục nhãn 28/9, 1/10, 3/10, 5/10, 7/10, 9/10, 12/10, 15/10, 18/10, 21/10, 24/10, 27/10. Nhãn đầu 28/9 và nhãn cuối 27/10 khớp Expected (29 ngày trước hôm nay và hôm nay giờ VN). Đường diện tích sát trục ở các ngày đầu vì giá trị nhỏ nhưng khác 0, tăng mạnh từ 21/10.
    E7-step2.png: tooltip đứng ở điểm đầu trục, ngày 28/9, Bài nhận 29, Đọc được 28, Tin rao mới 28, Gắn căn 28. Chấm đánh dấu nằm ở mép trái trục. Không có số 0 ở cả bốn chặng, khớp kết luận «không có ngày im trong cửa sổ».
    E7-step2b.png: tooltip tại điểm sớm 2/10, bốn chặng đều 18. Không phải ngày im. Quét tooltip cả 30 điểm bằng DOM không thấy ngày nào bốn chặng cùng 0.
    E7-step3.png: cửa sổ 7 ngày (mặc định). Khung «Chặng theo ngày» có tổng Bài nhận 30.014, Đọc được 20.850 69,5%, Tin rao mới 17.813 85,4%, Gắn căn 17.496 98,2%. Trục đúng 7 nhãn liên tiếp 21/10, 22/10, 23/10, 24/10, 25/10, 26/10, 27/10, ngày cuối là hôm nay giờ VN (27/10). Đường diện tích kéo dài trọn trục và rơi về sát trục ở 27/10 (ngày hôm nay còn dở, 357/71/71/71). Khớp Expected.
  network_observed: no-app-traffic

- eval: E8
  run_id: minted-df0-chang-theo-ngay-diem-0-E8-r3
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.chang_ngay
  verified_at: 2026-10-27T00:06:19Z
  output: |
    cd app && node --import tsx --test tests/df0-chang-theo-ngay.test.tsx
    ℹ duration_ms 968.993292

### Lệnh suite (hồi quy)

- cmd: cd agent && npm test
  run_id: minted-df0-chang-theo-ngay-diem-0-SUITE-npm_test__bb6271-r3
  exit_code: 0
  verified_at: 2026-10-27T00:06:19Z

- cmd: cd app && npx tsc --noEmit && npm run lint
  run_id: minted-df0-chang-theo-ngay-diem-0-SUITE-lint-r3
  exit_code: 0
  verified_at: 2026-10-27T00:06:19Z

- cmd: cd app && npm test
  run_id: minted-df0-chang-theo-ngay-diem-0-SUITE-npm_test__bd9a35-r3
  exit_code: 0
  verified_at: 2026-10-27T00:06:19Z

- cmd: cd pipeline && npm test
  run_id: minted-df0-chang-theo-ngay-diem-0-SUITE-npm_test__13563d-r3
  exit_code: 0
  verified_at: 2026-10-27T00:06:19Z

- cmd: cd app && npm run test:lint-rules
  run_id: minted-df0-chang-theo-ngay-diem-0-SUITE-test_lint_rules-r3
  exit_code: 0
  verified_at: 2026-10-27T00:06:19Z

- cmd: node scripts/check-portal-compliance.mjs
  run_id: minted-df0-chang-theo-ngay-diem-0-SUITE-node_scripts_check_portal_compliance_mjs-r3
  exit_code: 0
  verified_at: 2026-10-27T00:06:19Z

## Known limits

## Ngoài hợp đồng

## Analyst

carried tu round 2 — baseline khong do lai round nay (evals.yaml không đổi từ lần đo baseline cuối); field baseline của từng eval ghi n-a.

Eval không-phân-biệt (xanh cả trên HEAD lẫn baseline): không có. Lệnh suite xanh cả hai phía là regression-guard bình thường, không liệt kê.

## Variance

none — mọi eval chạy một lần (deterministic), không có phương sai.

## Iterations

Round 1: không eval nào của hợp đồng đỏ; lệnh suite `cd app && npm test` đỏ ở ca ON12-AC-1 (tests/ops-nhan-theo-context.test.tsx) vì danh sách tệp quét có thêm stage-trend-data.ts, không gắn eval nào. Returned to implementation.

Round 2: không eval nào của hợp đồng đỏ (bảy eval máy mang sang từ round 1, E6 đề xuất PASS); lệnh suite `cd app && npm test` vẫn đỏ, lần này ở ca GV-AC-3 (tests/gio-ops-gio-vn.test.tsx) vì stage-trend-data.ts khớp hai mẫu cắt chuỗi mốc / toISOString cắt ngoài danh sách miễn, không gắn eval nào. Returned to implementation.

Round 3: sửa chuỗi ngày dùng vnDayKey (commit d586828e). Sáu eval test và E7 xanh, E6 giữ nguyên từ round 2, cả sáu lệnh suite hồi quy xanh. Verdict PASS, chờ người ký ở Cổng 2.

### Re-pin lần 1 — 2026-10-27, do gộp origin/main (a4a47d15) sau chữ ký
run_id: repin-20261027T004832Z-53431
sha: 0711491e293c2a8496224eafb56d0cd601f622fa · suites: 6 lệnh exit 0 · evals: 6/6 eval máy đạt kỳ vọng · ngoài làn máy: E6 (E6 không khai paths), E7 · AC không có chốt máy: AC-6, AC-7

### Re-pin lần 2 — 2026-10-27, do gộp origin/main (1649ab91, PL15)
run_id: repin-20261027T005850Z-53587
sha: 31c2fc1fecec7432850c37db6e66a36957cc505e · suites: 6 lệnh exit 0 · evals: 6/6 eval máy đạt kỳ vọng · ngoài làn máy: E6 (E6 không khai paths), E7 · AC không có chốt máy: AC-6, AC-7
