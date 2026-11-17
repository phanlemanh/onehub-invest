---
schema_version: 2
feature_slug: suite-scripts-vao-luot-cham
verdict: BLOCKED
failed_evals: []
reason: "Lệnh `node --test scripts/*.test.mjs` (eval E7) chạy nền sau khi vượt 600 giây của công cụ (ID tác vụ bl5w4d0rt, tệp đầu ra /private/tmp/claude-503/-Users-manhphan-dev-onehub-invest/12195456-35b8-4f14-b46e-d86f8852586a/tasks/bl5w4d0rt.output). Sau khoảng 33 phút theo dõi tệp đầu ra vẫn rỗng và chưa có dòng mã thoát, nên không có kết quả thật. Tiến trình node --test vẫn còn chạy. Vượt ngưỡng 30 phút mặc định (chưa xác định được long_running của eval này trong evals.yaml). Không suy ra PASS hay FAIL từ đầu ra. Không chạy lại, không sửa code. Chưa dừng tác vụ nền vì công cụ TaskStop chưa được nạp; tiến trình có thể cần dừng thủ công. Cách gỡ: chạy lại với timeout công cụ dài hơn, hoặc khai long_running cho E7."
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: e424c0591ba4ddd9faff433942a303e27356826b
human_signoff:
---

# Evidence Report: suite-scripts-vao-luot-cham

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | test | PASS |
| E2 | AC-2 | test | PASS |
| E3 | AC-3 | script | PASS |
| E4 | AC-4 | script | PASS |
| E5 | AC-5 | script | PASS |
| E6 | AC-6 | test | PASS |
| E7 | AC-7 | test | BLOCKED |

## Evidence

- eval: E1
  run_id: minted-suite-scripts-vao-luot-cham-E1-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.sstl_buoc_ci
  verified_at: 2026-11-17T13:41:02Z
  output: |
    co-ca: xanh — 2 ca «SSL-AC-1» chạy và đạt

- eval: E2
  run_id: minted-suite-scripts-vao-luot-cham-E2-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.sstl_tom_tat
  verified_at: 2026-11-17T13:41:02Z
  output: |
    co-ca: xanh — 3 ca «SSL-AC-2» chạy và đạt

- eval: E3
  run_id: b419nfeuq
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.sstl_tai_hien_471
  verified_at: 2026-11-17T13:41:02Z
  output: |
    tai-hien: xanh — #471 (5b02c3de0) đỏ đúng «(5) bước thu lỗi» ở scripts/s05-khoa-nap.test.mjs

- eval: E4
  run_id: minted-suite-scripts-vao-luot-cham-E4-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.sstl_tai_hien_472
  verified_at: 2026-11-17T13:41:02Z
  output: |
    tai-hien: xanh — #472 (f3fecd5f6) đỏ đúng «DT-AC-7» ở scripts/db-thu.test.mjs

- eval: E5
  run_id: minted-suite-scripts-vao-luot-cham-E5-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.sstl_main_xanh
  verified_at: 2026-11-17T13:41:02Z
  output: |
    {"kind":"scripts-ci","ts":"2026-11-17T13:45:05.370Z","sha":"e424c0591ba4ddd9faff433942a303e27356826b","tests":525,"pass":518,"fail":0,"giay":188.3}

- eval: E6
  run_id: minted-suite-scripts-vao-luot-cham-E6-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.sstl_cau_hinh
  verified_at: 2026-11-17T13:41:02Z
  output: |
    cau-hinh: xanh — chỉ suite_keys đổi; tám lệnh cũ (bảy suite bọc + pipeline) nguyên byte (gốc 5508f6209d5abe3ee654ca0738745155d7bfc3e6)

- eval: E7
  run_id: minted-suite-scripts-vao-luot-cham-E7-r2
  baseline: n-a
  verifier: config:executors.test.scripts
  verified_at: 2026-11-17T13:41:02Z
  output: |
    BLOCKED: lệnh chạy nền vượt 600 giây của công cụ, chờ thêm khoảng 33 phút, tệp đầu ra rỗng, chưa có dòng mã thoát. Không có kết quả PASS hay FAIL thật.

### Lệnh suite (hồi quy)

- cmd: node scripts/suite-neu-doi.mjs agent -- 'cd agent && npm test'
  run_id: minted-suite-scripts-vao-luot-cham-SUITE-node_scripts_suite_neu_doi_mjs_agent_cd_-r2
  exit_code: 0
  verified_at: 2026-11-17T13:41:02Z

- cmd: node scripts/suite-neu-doi.mjs app -- 'cd app && npx tsc --noEmit && npm run lint'
  run_id: minted-suite-scripts-vao-luot-cham-SUITE-lint-r2
  exit_code: 0
  verified_at: 2026-11-17T13:41:02Z

- cmd: node scripts/suite-neu-doi.mjs app_ui -- 'cd app && npm test'
  run_id: minted-suite-scripts-vao-luot-cham-SUITE-node_scripts_suite_neu_doi_mjs_app_ui_cd-r2
  exit_code: 0
  verified_at: 2026-11-17T13:41:02Z

- cmd: node scripts/suite-neu-doi.mjs pipeline_a -- 'cd pipeline && npm run test:a'
  run_id: minted-suite-scripts-vao-luot-cham-SUITE-test_a-r2
  exit_code: 0
  verified_at: 2026-11-17T13:41:02Z

- cmd: node scripts/suite-neu-doi.mjs pipeline_b -- 'cd pipeline && npm run test:b'
  run_id: minted-suite-scripts-vao-luot-cham-SUITE-test_b-r2
  exit_code: 0
  verified_at: 2026-11-17T13:41:02Z

- cmd: node scripts/suite-neu-doi.mjs ui_lint_rules -- 'cd app && npm run test:lint-rules'
  run_id: minted-suite-scripts-vao-luot-cham-SUITE-test_lint_rules-r2
  exit_code: 0
  verified_at: 2026-11-17T13:41:02Z

- cmd: node scripts/suite-neu-doi.mjs portal_static -- 'node scripts/check-portal-compliance.mjs'
  run_id: minted-suite-scripts-vao-luot-cham-SUITE-node_scripts_suite_neu_doi_mjs_portal_st-r2
  exit_code: 0
  verified_at: 2026-11-17T13:41:02Z

## Known limits

## Ngoài hợp đồng

## Analyst

carried tu round 1 — baseline khong do lai round nay (evals.yaml khong doi tu lan baseline cuoi). Baseline khong do: moi eval ghi n-a.

Eval không-phân-biệt (xanh cả trên HEAD lẫn baseline, theo danh sách máy đưa): E1 (SSL-AC-1), E2 (SSL-AC-2), E6 (S4V-AC-6 kèm probe cau-hinh-khong-doi.sh). Cần viết lại để assert hành vi mới hoặc xác nhận là regression-guard có chủ ý. Riêng E6 là regression-guard có chủ ý (đòi cấu hình gốc nguyên byte). Lệnh suite xanh cả hai phía là regression-guard bình thường, không liệt kê.

Cảnh báo bổ sung: probe co-ca.sh (dùng cho E1, E2) không bắt được ca bị bỏ qua, nên xanh của E1 và E2 có thể che ca chính bị skip (xem review-findings.md).

## Variance

none — mọi eval chạy một lần, xác định (runs 1), không có pass_rate pha trộn.

## Iterations

Round 1: đã ghi ở round trước, xem lịch sử run-log.
Round 2: E1 đến E6 xanh trên e424c0591; E7 BLOCKED vì lệnh node --test scripts/*.test.mjs vượt hạn chờ công cụ, chưa có kết quả thật. Cần chạy lại E7 với timeout dài hơn.
