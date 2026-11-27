---
schema_version: 2
feature_slug: nap-s09-quy-can-va-can-cao-tang
verdict: PENDING-JUDGMENT
failed_evals: []
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: 01e03e07e8f843e3589e9e735ebebb3f98c8434b
human_signoff:
---

# Evidence Report: nap-s09-quy-can-va-can-cao-tang

Vòng 1. Mọi eval máy đều xanh; còn mục judgment E10 chờ người quyết ở Cổng 2 nên verdict là PENDING-JUDGMENT.

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | script | PASS |
| E2 | AC-2 | script | PASS |
| E3 | AC-3 | script | PASS |
| E4 | AC-4 | script | PASS |
| E5 | AC-5 | script | PASS |
| E6 | AC-6 | script | PASS |
| E7 | AC-7 | script | PASS |
| E8 | AC-8 | script | PASS |
| E8u | AC-8 | ui-check | PASS |
| E9 | AC-9 | script | PASS |
| E9b | AC-9 | script | PASS |
| E10 | AC-10 | judgment | PENDING (chờ người) |
| E10b | AC-10 | script | PASS |
| E11a | AC-6 | test | PASS |
| E11b | AC-6 | test | PASS |
| E11c | AC-6 | test | PASS |

## Evidence

- eval: E1
  run_id: minted-nap-s09-quy-can-va-can-cao-tang-E1-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.s09_v16_db
  verified_at: 2026-11-27T07:02:51Z
  output: |
    cmd: node --test --test-concurrency=1 pipeline/lib/s09-danh-ba-v16.test.mjs pipeline/scripts/s09-v16.itest.mjs
    ℹ duration_ms 4367.687084

- eval: E2
  run_id: minted-nap-s09-quy-can-va-can-cao-tang-E2-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.s09_v16_db
  verified_at: 2026-11-27T07:02:51Z
  output: |
    cùng lệnh với E1 (một lần chạy phủ E1, E2, E3, E4, E9)
    ℹ duration_ms 4367.687084

- eval: E3
  run_id: minted-nap-s09-quy-can-va-can-cao-tang-E3-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.s09_v16_db
  verified_at: 2026-11-27T07:02:51Z
  output: |
    cùng lệnh với E1
    ℹ duration_ms 4367.687084

- eval: E4
  run_id: minted-nap-s09-quy-can-va-can-cao-tang-E4-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.s09_v16_db
  verified_at: 2026-11-27T07:02:51Z
  output: |
    cùng lệnh với E1
    ℹ duration_ms 4367.687084

- eval: E9
  run_id: minted-nap-s09-quy-can-va-can-cao-tang-E9-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.s09_v16_db
  verified_at: 2026-11-27T07:02:51Z
  output: |
    cùng lệnh với E1
    ℹ duration_ms 4367.687084

- eval: E5
  run_id: minted-nap-s09-quy-can-va-can-cao-tang-E5-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.s09_v16_that
  verified_at: 2026-11-27T07:02:51Z
  output: |
    cmd: node pipeline/scripts/s09-v16-that.mjs --tran-phut 40
    s09-v16-that: khớp mọi ô

- eval: E6
  run_id: minted-nap-s09-quy-can-va-can-cao-tang-E6-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.s09_v16_that
  verified_at: 2026-11-27T07:02:51Z
  output: |
    cùng lệnh với E5
    s09-v16-that: khớp mọi ô

- eval: E7
  run_id: minted-nap-s09-quy-can-va-can-cao-tang-E7-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.s09_v16_app
  verified_at: 2026-11-27T07:02:51Z
  output: |
    cmd: cd app && bash ../db/db-thu.sh oneinvest_suite_qc --chay node --import tsx --test --test-concurrency=1 tests/registry-quy-can.test.tsx
    ℹ duration_ms 1501.09325

- eval: E8
  run_id: minted-nap-s09-quy-can-va-can-cao-tang-E8-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.s09_v16_app
  verified_at: 2026-11-27T07:02:51Z
  output: |
    cùng lệnh với E7
    ℹ duration_ms 1501.09325

- eval: E9b
  run_id: minted-nap-s09-quy-can-va-can-cao-tang-E9b-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.s09_v16_app
  verified_at: 2026-11-27T07:02:51Z
  output: |
    cùng lệnh với E7
    ℹ duration_ms 1501.09325

- eval: E8u
  run_id: minted-nap-s09-quy-can-va-can-cao-tang-E8u-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.ui-check
  verified_at: 2026-11-27T07:02:51Z
  screenshot: evidence/E8u-step1.png
  observed: |
    step1 (/ops/registry): thẻ Dự án 514, Toà 854, Căn 111.671, Mã nguồn chưa nối 529; thẻ riêng «Căn CĐT đang bán S09» = 1.294, phụ đề «1.268 có giá · 40 dự án: 24 nối nút · 6 còn thẻ · 10 chưa có trong danh mục» khớp SELECT cùng DB; chỉ có mã S06/S08/S09, không URL.
    step2-3 (/ops/registry/592, Masteri Waterfront): khối «Căn CĐT đang bán … nguồn S09 … 290 căn», bảng 7 cột Mã căn · Loại hình · PN·WC · Diện tích · Giá bán · Giá/m² · Trạng thái nguồn, hàng mẫu H1.02.05A | Chung cư | 2·2 | 63,3 m² | 5,25 tỷ | 83 tr/m² | AVAILABLE, phân trang 1–25/290; không ảnh, không URL, không toạ độ, không tên thật của nguồn.
    Lưu ý cho người duyệt: nhãn trên màn là «Căn CĐT đang bán S09», không đúng chữ «Quỹ căn S09» trong steps của eval; nội dung và số khớp.
  network_observed: no-app-traffic

- eval: E10b
  run_id: minted-nap-s09-quy-can-va-can-cao-tang-E10b-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.s09_v16_dc
  verified_at: 2026-11-27T07:02:51Z
  output: |
    cmd: git diff --exit-code 767c70c13 -- collector/docs/DATA-CONTRACT.md
    diff rỗng

- eval: E11a
  run_id: minted-nap-s09-quy-can-va-can-cao-tang-E11a-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.suite.pipeline_a
  verified_at: 2026-11-27T07:02:51Z
  output: |
    cmd: node scripts/suite-neu-doi.mjs pipeline_a -- 'cd pipeline && npm run test:a'
    ℹ duration_ms 206609.604166

- eval: E11b
  run_id: minted-nap-s09-quy-can-va-can-cao-tang-E11b-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.suite.pipeline_b
  verified_at: 2026-11-27T07:02:51Z
  output: |
    cmd: node scripts/suite-neu-doi.mjs pipeline_b -- 'cd pipeline && npm run test:b'
    ℹ duration_ms 114233.500084

- eval: E11c
  run_id: r1-l7-1-20261127070251
  exit_code: 0
  baseline: n-a
  verifier: config:executors.suite.pipeline_that
  verified_at: 2026-11-27T07:02:51Z
  output: |
    cmd: node scripts/suite-neu-doi.mjs pipeline_that -- 'cd pipeline && npm run test:that'
    ℹ duration_ms 2626845.580875

### Judgment

- eval: E10
  judged_by: judge-subagent (fresh context), panel đề xuất PASS
  verdict: PASS
  rationale: Ba góc nhìn đều thấy ap-may-thu.md đủ năm thứ và đúng thứ tự áp sau DA42; DATA-CONTRACT.md có mục «Mở rộng v16». Chi tiết ở phần panel bên dưới.
  human_override:  # chi nguoi ghi

Panel judge (đề xuất):

- domain-correctness: PASS — ap-may-thu.md có đủ năm thứ và nói rõ thứ tự áp SAU DA42. Lệnh áp 130 chạy hai lần rồi vòng nạp các bản thu v16 sau khi ZK chép vào collector/snapshots. Số diễn tập khớp AC-5: 1.294 căn, 40 dự án, 1.268 có giá, chia 24/6/10, 0 dòng có http. Sao lưu pg_dump trước, ba nấc lùi và lệnh kiểm s09-v16-that.mjs --dem đều có. DATA-CONTRACT.md có mục «Mở rộng v16» khai hai kind quy-can và can-cao-tang, cùng dòng lịch sử «schemaVersion 16 (2026-11-24)».
- operational-feasibility: PASS — ap-may-thu.md có đủ năm thứ. Lệnh áp 130 chạy hai lần rồi nạp từng bản thu v16 sau khi ZK chép vào collector/snapshots, nằm ở mục 2. Số diễn tập khớp AC-5: 1.294 căn, 40 dự án, 1.268 có giá, chia 24/6/10, 0 dòng có http. Sao lưu trước (mục 1), cách lùi (mục 4), lệnh kiểm sau (mục 5) và thứ tự áp sau DA42 (đầu tệp) đều có. DATA-CONTRACT.md có mục «Mở rộng v16» với hai kind quy-can và can-cao-tang, và có dòng lịch sử schemaVersion 16.
- spec-alignment: PASS — ap-may-thu.md có đủ năm thứ: lệnh áp 130 chạy hai lần rồi nạp từng bản thu v16 sau khi ZK chép vào collector/snapshots; số diễn tập khớp AC-5 (1.294 căn · 40 dự án · 1.268 có giá; 24/6/10; 0 dòng chứa http); sao lưu trước (mục 1); cách lùi (mục 4); lệnh kiểm sau (mục 5). Hồ sơ nói rõ áp sau DA42. DATA-CONTRACT.md có mục «Mở rộng v16» với hai kind quy-can, can-cao-tang và dòng lịch sử schemaVersion 16. Hồ sơ nạp theo danh sách V16 lọc từ manifest, không ghi cứng «bốn bản thu». Số căn cao tầng lấy từ bộ đo chạy ngay trước lượt áp, không ghi sẵn.

human_override của E10 để trống cho người quyết ở Cổng 2.

### Lệnh suite (hồi quy)

- cmd: node scripts/suite-neu-doi.mjs agent -- 'cd agent && npm test'
  run_id: minted-nap-s09-quy-can-va-can-cao-tang-SUITE-node_scripts_suite_neu_doi_mjs_agent_cd_-r1
  exit_code: 0
  verified_at: 2026-11-27T07:02:51Z

- cmd: node scripts/suite-neu-doi.mjs app -- 'cd app && npx tsc --noEmit && npm run lint'
  run_id: minted-nap-s09-quy-can-va-can-cao-tang-SUITE-lint-r1
  exit_code: 0
  verified_at: 2026-11-27T07:02:51Z

- cmd: node scripts/suite-neu-doi.mjs app_ui -- 'cd app && npm test'
  run_id: minted-nap-s09-quy-can-va-can-cao-tang-SUITE-node_scripts_suite_neu_doi_mjs_app_ui_cd-r1
  exit_code: 0
  verified_at: 2026-11-27T07:02:51Z

- cmd: node scripts/suite-neu-doi.mjs ui_lint_rules -- 'cd app && npm run test:lint-rules'
  run_id: minted-nap-s09-quy-can-va-can-cao-tang-SUITE-test_lint_rules-r1
  exit_code: 0
  verified_at: 2026-11-27T07:02:51Z

- cmd: node scripts/suite-neu-doi.mjs portal_static -- 'node scripts/check-portal-compliance.mjs'
  run_id: minted-nap-s09-quy-can-va-can-cao-tang-SUITE-node_scripts_suite_neu_doi_mjs_portal_st-r1
  exit_code: 0
  verified_at: 2026-11-27T07:02:51Z

máy: M5 (M5 Max 18 nhân, colima 16/96) · DB: bản đầy đủ máy thu chép sang 26/11 05:45Z · ca đỏ có tên: không

Ghi chú phiên chấm M5 (sau lượt, không đổi verdict của kit): vòng 1 CHẠY LẠI trên 01e03e07e8f843e3589e9e735ebebb3f98c8434b (lượt trước ở 9b0cbd0ca BLOCKED vì pg vắng — GS ghi không tính). Trước khi chấm đã kiểm node_modules bốn module (lock trùng main; require.resolve('pg') ok ở app, pipeline, agent, data-api) theo CHAM-TREN-M5.md. Mọi eval máy PASS (E1–E11c, E8u), mọi lệnh suite thoát 0, không lệnh nào BLOCKED. pipeline_that (E11c, long_running 90): tests 37, pass 37, fail 0, skipped 0; «bỏ qua 1 ca chỉ máy thu» → ĐẠT theo luật GS 26/11. Chấm trên M5: ON22-AC-10 không chạy (HT33). Migration 130 chỉ áp trên DB lượt. Kit trả PENDING-JUDGMENT vì hàng T3 (judgment E10 đề xuất PASS chờ người). Review: một finding medium trong hợp đồng AC-2 (danh sách khoá lá tính lúc chạy từ fixture, không có bảng viết trước từ bản thu thật) — người ký Cổng 2 cần thấy; ba finding ngoài hợp đồng đề xuất Known limits. Ảnh E8u dùng tài khoản thử ops-test, không lộ email. Kit báo runLogWriteFailed — run-log do phiên chấm ghi.

## Known limits

## Ngoài hợp đồng

## Analyst

carried tu round 1 — baseline khong do lai round nay

Eval không-phân-biệt (xanh cả hai phía): không có.

## Variance

none — mọi eval đều chạy một lần và đều xanh, không có phương sai.

## Iterations

Round 1: mọi eval máy xanh; chờ người chốt judgment E10 ở Cổng 2.
