---
schema_version: 2
feature_slug: data-api-tin-hien-thi
verdict: BLOCKED
failed_evals: []
reason: "Lenh `node scripts/suite-neu-doi.mjs pipeline_that -- 'cd pipeline && npm run test:that'` chay qua 30 phut chua xong (quan sat den 30:01, chua co dong __EXIT=). Lenh da duoc tool chuyen sang nen (task b1zarne4p), khong bi giet. Chua doc evals.yaml de xac nhan long_running khai bao; tran mac dinh 30 phut da vuot. Lenh van dang chay tu 01:43 trong worktree cham-pb7. Khong co ma thoat that, khong ket luan PASS hay FAIL. Khac phuc: chay lai voi tool timeout dai hon; khong phai loi code."
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: 2e903ac6473fcd7cc4947b370985e624edb3a965
human_signoff:
---

# Evidence Report: data-api-tin-hien-thi

Round 1. Cả 12 eval của hợp đồng (E1–E12) đã chạy và đạt. Một lệnh suite hồi quy (pipeline_that) chưa kết thúc trong trần 30 phút, nên verdict tổng là BLOCKED chứ không phải PASS.

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | script | PASS |
| E2 | AC-2 | script | PASS |
| E3 | AC-3 | test | PASS |
| E4 | AC-4 | test | PASS |
| E5 | AC-5 | test | PASS |
| E6 | AC-6 | script | PASS |
| E7 | AC-7 | script | PASS |
| E8 | AC-8 | test | PASS |
| E9 | AC-8 | test | PASS |
| E10 | AC-8 | script | PASS |
| E11 | AC-9 | script | PASS |
| E12 | AC-9 | test | PASS |

## Evidence

- eval: E1
  run_id: minted-data-api-tin-hien-thi-E1-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.dapi_an_nguon
  verified_at: 2026-11-27T18:01:43Z
  output: |
    nguon-chung: sổ, tay, do-s03 đều đạt; năm ô chiều đỏ ra đúng

- eval: E2
  run_id: minted-data-api-tin-hien-thi-E2-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.dapi_an_nguon
  verified_at: 2026-11-27T18:01:43Z
  output: |
    nguon-chung: sổ, tay, do-s03 đều đạt; năm ô chiều đỏ ra đúng

- eval: E10
  run_id: minted-data-api-tin-hien-thi-E10-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.dapi_an_nguon
  verified_at: 2026-11-27T18:01:43Z
  output: |
    nguon-chung: sổ, tay, do-s03 đều đạt; năm ô chiều đỏ ra đúng

- eval: E3
  run_id: minted-data-api-tin-hien-thi-E3-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.dapi_an
  verified_at: 2026-11-27T18:01:43Z
  output: |
    ℹ duration_ms 18848.653667

- eval: E4
  run_id: minted-data-api-tin-hien-thi-E4-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.dapi_an
  verified_at: 2026-11-27T18:01:43Z
  output: |
    ℹ duration_ms 18848.653667

- eval: E5
  run_id: minted-data-api-tin-hien-thi-E5-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.dapi_an
  verified_at: 2026-11-27T18:01:43Z
  output: |
    ℹ duration_ms 18848.653667

- eval: E6
  run_id: minted-data-api-tin-hien-thi-E6-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.dapi_an_pha
  verified_at: 2026-11-27T18:01:43Z
  output: |
    pha: đủ 3 ô

- eval: E7
  run_id: minted-data-api-tin-hien-thi-E7-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.dapi_an_db
  verified_at: 2026-11-27T18:01:43Z
  output: |
    do-db: cấy một tin S08 → trước 1, sau 0, bo-loc 1

- eval: E8
  run_id: minted-data-api-tin-hien-thi-E8-r1
  exit_code: 0
  baseline: red
  verifier: config:executors.test.vocab
  verified_at: 2026-11-27T18:01:43Z
  output: |
    ℹ duration_ms 2071.942333

- eval: E9
  run_id: minted-data-api-tin-hien-thi-E9-r1
  exit_code: 0
  baseline: red
  verifier: config:executors.test.app_ui
  verified_at: 2026-11-27T18:01:43Z
  output: |
    ℹ duration_ms 540657.394

- eval: E11
  run_id: minted-data-api-tin-hien-thi-E11-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.dapi_an_pham_vi
  verified_at: 2026-11-27T18:01:43Z
  output: |
    pham-vi: nền 51e9d84d8; 28 tệp đổi, đều trong ranh giới; mappings.yaml chỉ thêm nguon_khong_hien_thi; offers-filters.ts chỉ đổi dòng hằng nguồn ẩn; soát 6 tên nguồn thật trên toàn cây data-api (36 tệp),

- eval: E12
  run_id: minted-data-api-tin-hien-thi-E12-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.data_api
  verified_at: 2026-11-27T18:01:43Z
  output: |
    (typecheck data-api không lỗi)

### Lệnh suite (hồi quy)

- cmd: node scripts/suite-neu-doi.mjs agent -- 'cd agent && npm test'
  run_id: minted-data-api-tin-hien-thi-SUITE-node_scripts_suite_neu_doi_mjs_agent_cd_-r1
  exit_code: 0
  verified_at: 2026-11-27T18:01:43Z

- cmd: node scripts/suite-neu-doi.mjs app -- 'cd app && npx tsc --noEmit && npm run lint'
  run_id: minted-data-api-tin-hien-thi-SUITE-lint-r1
  exit_code: 0
  verified_at: 2026-11-27T18:01:43Z

- cmd: node scripts/suite-neu-doi.mjs app_ui -- 'cd app && npm test'
  run_id: minted-data-api-tin-hien-thi-SUITE-node_scripts_suite_neu_doi_mjs_app_ui_cd-r1
  exit_code: 0
  verified_at: 2026-11-27T18:01:43Z

- cmd: node scripts/suite-neu-doi.mjs pipeline_a -- 'cd pipeline && npm run test:a'
  run_id: minted-data-api-tin-hien-thi-SUITE-test_a-r1
  exit_code: 0
  verified_at: 2026-11-27T18:01:43Z

- cmd: node scripts/suite-neu-doi.mjs pipeline_b -- 'cd pipeline && npm run test:b'
  run_id: minted-data-api-tin-hien-thi-SUITE-test_b-r1
  exit_code: 0
  verified_at: 2026-11-27T18:01:43Z

- cmd: node scripts/suite-neu-doi.mjs pipeline_that -- 'cd pipeline && npm run test:that'
  run_id: minted-data-api-tin-hien-thi-SUITE-test_that-r1
  ket_qua: CHUA HOAN TAT (BLOCKED) — chạy quá 30 phút, quan sát tới 30:01, chưa có dòng __EXIT=. Tiến trình vẫn chạy nền (task b1zarne4p), không bị giết; không có mã thoát thật, không kết luận đạt hay hỏng.
  verified_at: 2026-11-27T18:01:43Z

- cmd: node scripts/suite-neu-doi.mjs ui_lint_rules -- 'cd app && npm run test:lint-rules'
  run_id: minted-data-api-tin-hien-thi-SUITE-test_lint_rules-r1
  exit_code: 0
  verified_at: 2026-11-27T18:01:43Z

- cmd: node scripts/suite-neu-doi.mjs portal_static -- 'node scripts/check-portal-compliance.mjs'
  run_id: minted-data-api-tin-hien-thi-SUITE-node_scripts_suite_neu_doi_mjs_portal_st-r1
  exit_code: 0
  verified_at: 2026-11-27T18:01:43Z

máy: M5 (M5 Max 18 nhân, colima 16/96) · DB: bản đầy đủ máy thu chép sang 26/11 05:45Z · ca đỏ có tên: không

Ghi chú phiên chấm M5 (sau lượt, KHÔNG đổi verdict của kit): vòng 1 trên 2e903ac6473fcd7cc4947b370985e624edb3a965 (nhánh xếp chồng trên PB2, nên soát đủ năm job). Soát: app chỉ QV-AC-5; pipeline, agent, data-api xanh; scripts lần đầu đỏ «audit-all nói thật (AU5)» và «AA-AC-5 /ops 500 → ❌», soát lại riêng scripts xanh. kit: BLOCKED — suite pipeline_that chạm trần 30′ mặc định (nhánh đổi pipeline/mappings.yaml nên suite chạy); mọi eval E1–E12 thoát 0, mọi suite khác thoát 0. Chạy lại riêng pipeline_that một lần (HT37, evidence/m5-pipeline-that-r1.txt): tests 37, pass 37, fail 0, skipped 0, «bỏ qua 1 ca chỉ máy thu» → ĐẠT; chấm trên M5: ON22-AC-10 không chạy (HT33). Review: một finding medium trong hợp đồng AC-5 (PB7-AC-5 không so thân 404 của tin ẩn với thân của khoá không có). Ngoài hợp đồng: nhánh thuê ngắn hạn không đi qua SOURCE_HIDDEN, S01 viết tay (known-limits); bedroomsTotal không kiểm ở biên → 500 lộ thông điệp Postgres (hợp đồng mới); tham số rỗng đọc thành 0 (hợp đồng mới); danh sách bảng lược đồ mẫu so tệp với chính nó (hợp đồng mới); khoá mappings tiếng Việt (wont-fix); mili giây bị cắt, khoá bí mật danh sách/chi tiết lệch, bộ chuyển viết tay (known-limits). Kit báo runLogWriteFailed — run-log do phiên chấm ghi.

## Known limits

## Ngoài hợp đồng

## Analyst

none — mọi eval feature đều red trên baseline (có phân biệt) ở những eval đo được baseline (E8, E9); các eval còn lại không đo được baseline vì là eval mới.

Baseline khong do
- node _acceptance/data-api-tin-hien-thi/probes/nguon-chung.mjs: bo qua baseline: tep _acceptance/data-api-tin-hien-thi/probes/nguon-chung.mjs co o cay dang kiem nhung chua co o merge-base 30c13f6e03a1d8a3603a9c281bce85c98354406b — eval moi, chay tren code cu khong phan biet gi
- bash db/db-thu.sh oneinvest_suite_dapi --chay sh -c 'cd data-api && node --import tsx --test --test-reporter=spec --test-concurrency=1 test/tin-hien-thi.test.ts test/listing-reso.test.ts test/dong-ba-route.test.ts': bo qua baseline: tep data-api/test/tin-hien-thi.test.ts co o cay dang kiem nhung chua co o merge-base 30c13f6e03a1d8a3603a9c281bce85c98354406b — eval moi, chay tren code cu khong phan biet gi
- node _acceptance/data-api-tin-hien-thi/probes/pha.mjs: bo qua baseline: tep _acceptance/data-api-tin-hien-thi/probes/pha.mjs co o cay dang kiem nhung chua co o merge-base 30c13f6e03a1d8a3603a9c281bce85c98354406b — eval moi, chay tren code cu khong phan biet gi
- node _acceptance/data-api-tin-hien-thi/probes/do-db.mjs: bo qua baseline: tep _acceptance/data-api-tin-hien-thi/probes/do-db.mjs co o cay dang kiem nhung chua co o merge-base 30c13f6e03a1d8a3603a9c281bce85c98354406b — eval moi, chay tren code cu khong phan biet gi
- node _acceptance/data-api-tin-hien-thi/probes/pham-vi.mjs: bo qua baseline: tep _acceptance/data-api-tin-hien-thi/probes/pham-vi.mjs co o cay dang kiem nhung chua co o merge-base 30c13f6e03a1d8a3603a9c281bce85c98354406b — eval moi, chay tren code cu khong phan biet gi
- cd data-api && npm run typecheck: lenh/script khong ton tai o cho dung (command not found) — HA TANG CHAM, khong phai san pham do

Judge panels: không có panel nào được đề xuất; hợp đồng không có judgment item nên không có human_override cần điền.

## Variance

none — mọi eval chạy một lần, xác định (deterministic), không có eval nhiều lượt.

## Iterations

Round 1: E1–E12 đều đạt; lệnh suite pipeline_that chưa kết thúc trong 30 phút nên verdict BLOCKED (cần chạy lại với tool timeout dài hơn, không phải sửa code).
