---
schema_version: 2
feature_slug: nap-s09-quy-can-va-can-cao-tang
verdict: BLOCKED
failed_evals: []
reason: "E11b: lệnh `node scripts/suite-neu-doi.mjs pipeline_b -- 'cd pipeline && npm run test:b'` chạy xong nhưng kết thúc lỗi do thiếu môi trường, không phải kết quả đạt/trượt của suite. Worktree cham-da56 không có module `pg` trong app/node_modules: scripts/ci-db-init.mjs (qua pipeline/scripts/db-thu-dbv.mjs và du-an-tren-tin-s03.test.mjs) gọi require('pg') từ app/package.json và báo MODULE_NOT_FOUND. Không chạy lại, không sửa code, không đổi branch."
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: 9b0cbd0ca979ef4945f1c0006966a9586959e0f9
human_signoff:
---

# Evidence Report: nap-s09-quy-can-va-can-cao-tang

Round 1. Báo cáo này thay trọn báo cáo round cũ; lịch sử nằm ở mục Iterations.

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
| E10 | AC-10 | judgment | PASS (đề xuất của hội đồng, chờ người) |
| E10b | AC-10 | script | PASS |
| E11a | AC-6 | test | PASS |
| E11b | AC-6 | test | BLOCKED (không chạy được vì thiếu môi trường) |
| E11c | AC-6 | test | PASS |

## Evidence

- eval: E1
  run_id: minted-nap-s09-quy-can-va-can-cao-tang-E1-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.s09_v16_db
  verified_at: 2026-11-27T03:37:06Z
  output: |
    lệnh: node --test --test-concurrency=1 pipeline/lib/s09-danh-ba-v16.test.mjs pipeline/scripts/s09-v16.itest.mjs
    ℹ duration_ms 4573.401792

- eval: E2
  run_id: minted-nap-s09-quy-can-va-can-cao-tang-E2-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.s09_v16_db
  verified_at: 2026-11-27T03:37:06Z
  output: |
    cùng lệnh với E1
    ℹ duration_ms 4573.401792

- eval: E3
  run_id: minted-nap-s09-quy-can-va-can-cao-tang-E3-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.s09_v16_db
  verified_at: 2026-11-27T03:37:06Z
  output: |
    cùng lệnh với E1
    ℹ duration_ms 4573.401792

- eval: E4
  run_id: minted-nap-s09-quy-can-va-can-cao-tang-E4-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.s09_v16_db
  verified_at: 2026-11-27T03:37:06Z
  output: |
    cùng lệnh với E1
    ℹ duration_ms 4573.401792

- eval: E9
  run_id: minted-nap-s09-quy-can-va-can-cao-tang-E9-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.s09_v16_db
  verified_at: 2026-11-27T03:37:06Z
  output: |
    cùng lệnh với E1
    ℹ duration_ms 4573.401792

- eval: E5
  run_id: minted-nap-s09-quy-can-va-can-cao-tang-E5-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.s09_v16_that
  verified_at: 2026-11-27T03:37:06Z
  output: |
    lệnh: node pipeline/scripts/s09-v16-that.mjs --tran-phut 40
    s09-v16-that: khớp mọi ô

- eval: E6
  run_id: minted-nap-s09-quy-can-va-can-cao-tang-E6-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.s09_v16_that
  verified_at: 2026-11-27T03:37:06Z
  output: |
    cùng lệnh với E5
    s09-v16-that: khớp mọi ô

- eval: E7
  run_id: minted-nap-s09-quy-can-va-can-cao-tang-E7-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.s09_v16_app
  verified_at: 2026-11-27T03:37:06Z
  output: |
    lệnh: cd app && bash ../db/db-thu.sh oneinvest_suite_qc --chay node --import tsx --test --test-concurrency=1 tests/registry-quy-can.test.tsx
    ℹ duration_ms 1235.341125

- eval: E8
  run_id: minted-nap-s09-quy-can-va-can-cao-tang-E8-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.s09_v16_app
  verified_at: 2026-11-27T03:37:06Z
  output: |
    cùng lệnh với E7
    ℹ duration_ms 1235.341125

- eval: E9b
  run_id: minted-nap-s09-quy-can-va-can-cao-tang-E9b-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.s09_v16_app
  verified_at: 2026-11-27T03:37:06Z
  output: |
    cùng lệnh với E7
    ℹ duration_ms 1235.341125

- eval: E8u
  run_id: minted-nap-s09-quy-can-va-can-cao-tang-E8u-r1
  exit_code: 0
  baseline: n-a
  verifier: scripts/ui-capture.sh
  verified_at: 2026-11-27T03:37:06Z
  screenshot: evidence/E8u-tong.png
  observed: |
    E8u-tong.png (/ops/registry): lưới KPI có ô «Căn CĐT đang bán S09» = 1.294, dòng phụ «1.268 có giá · 40 dự án: 24 nối nút · 6 còn thẻ · 10 chưa có trong danh mục». Khớp view trên cùng DB (1294 căn, 40 dự án) và đích E5. E8u-quy-can.png (/ops/registry/592, Masteri Waterfront, chụp khung 1280x2600): khối «Căn CĐT đang bán», mô tả «…giá niêm yết công khai. Mã căn là mã tại nguồn. 290 căn.»; bảng cột Mã căn, Loại hình, PN·WC, Diện tích, Giá bán (vd 5,25 tỷ), Giá/m² (83 tr/m²), Trạng thái nguồn (AVAILABLE); phân trang 1–25/290. Trên cả hai trang chỉ thấy mã «S09», không ảnh, không URL, không toạ độ, không tên nguồn thật. Lệch chữ: UI ghi «Căn CĐT đang bán», không phải «Quỹ căn S09» / «Quỹ căn đang bán» như lời bước (chỉ còn trong comment mã). Expected nói về nội dung nên không tính là trượt, nhưng cần người xem biết.
  network_observed: n-a (driver)
  output: |
    DB thử oneinvest_suite_s09v16_7771 (bản chép máy thu), s09-v16-that.mjs → "khớp mọi ô"; view quỹ căn 1294 căn · 40 dự án · 1268 có giá; DB xoá sau khi xong.
    Ô tổng 1.294 bằng SELECT count(*) trên view; /ops/registry/592 ra 290 căn bằng count distinct của nút 592; HTML hai trang có chữ S09, 0 thẻ img src, 0 chuỗi http(s)://, không có từ toạ độ; ui-capture báo «tầng A: đã che 0».
    Ghi chú đường chụp: app/node_modules ở worktree là symlink nên Turbopack lỗi, đã thay bằng bản chép thật; chụp lại với UI_CAPTURE_SIZE=1280x2600 vì khung mặc định không thấy khối quỹ căn. E8u-network.txt là kết quả curl, không phải network trình duyệt. Server dev đã tắt, cổng 3456 trống.

- eval: E10
  judged_by: hội đồng judge (ba lens, fresh context)
  verdict: PASS (đề xuất)
  rationale: ba lens cùng thấy ap-may-thu.md đủ năm thứ và DATA-CONTRACT.md có mục «Mở rộng v16»; xem Judge panel bên dưới.
  human_override:  # chi nguoi ghi

- eval: E10b
  run_id: minted-nap-s09-quy-can-va-can-cao-tang-E10b-r1
  exit_code: 0
  baseline: red
  verifier: config:executors.script.s09_v16_dc
  verified_at: 2026-11-27T03:37:06Z
  output: |
    lệnh: git diff --exit-code 767c70c13 -- collector/docs/DATA-CONTRACT.md
    (không có dòng lệch)

- eval: E11a
  run_id: minted-nap-s09-quy-can-va-can-cao-tang-E11a-r1
  exit_code: 0
  baseline: red
  verifier: config:executors.suite.pipeline_a
  verified_at: 2026-11-27T03:37:06Z
  output: |
    lệnh: node scripts/suite-neu-doi.mjs pipeline_a -- 'cd pipeline && npm run test:a'
    ℹ duration_ms 209428.987667

- eval: E11b
  run_id: minted-nap-s09-quy-can-va-can-cao-tang-E11b-r1
  exit_code: n-a (BLOCKED, lệnh kết thúc lỗi do thiếu môi trường)
  baseline: red
  verifier: config:executors.suite.pipeline_b
  verified_at: 2026-11-27T03:37:06Z
  output: |
    lệnh: node scripts/suite-neu-doi.mjs pipeline_b -- 'cd pipeline && npm run test:b'
    code: 'MODULE_NOT_FOUND', requireStack: .../.claude/worktrees/cham-da56/app/package.json
    at taoDbThu (pipeline/scripts/db-thu-dbv.mjs:43:5)
    at async TestContext.<anonymous> (pipeline/scripts/du-an-tren-tin-s03.test.mjs:60:3)
    Thiếu module `pg` trong app/node_modules của worktree; không phải kết quả đạt/trượt của suite.

- eval: E11c
  run_id: r1-l7-1-20261127033706
  exit_code: 0
  baseline: red
  verifier: config:executors.suite.pipeline_that
  verified_at: 2026-11-27T03:37:06Z
  output: |
    lệnh: node scripts/suite-neu-doi.mjs pipeline_that -- 'cd pipeline && npm run test:that'
    ℹ duration_ms 2289421.668708

### Lệnh suite (hồi quy)

- cmd: node scripts/suite-neu-doi.mjs agent -- 'cd agent && npm test'
  run_id: minted-nap-s09-quy-can-va-can-cao-tang-SUITE-node_scripts_suite_neu_doi_mjs_agent_cd_-r1
  exit_code: 0
  verified_at: 2026-11-27T03:37:06Z

- cmd: node scripts/suite-neu-doi.mjs app -- 'cd app && npx tsc --noEmit && npm run lint'
  run_id: minted-nap-s09-quy-can-va-can-cao-tang-SUITE-lint-r1
  exit_code: 0
  verified_at: 2026-11-27T03:37:06Z

- cmd: node scripts/suite-neu-doi.mjs app_ui -- 'cd app && npm test'
  run_id: minted-nap-s09-quy-can-va-can-cao-tang-SUITE-node_scripts_suite_neu_doi_mjs_app_ui_cd-r1
  exit_code: 0
  verified_at: 2026-11-27T03:37:06Z

- cmd: node scripts/suite-neu-doi.mjs ui_lint_rules -- 'cd app && npm run test:lint-rules'
  run_id: minted-nap-s09-quy-can-va-can-cao-tang-SUITE-test_lint_rules-r1
  exit_code: 0
  verified_at: 2026-11-27T03:37:06Z

- cmd: node scripts/suite-neu-doi.mjs portal_static -- 'node scripts/check-portal-compliance.mjs'
  run_id: minted-nap-s09-quy-can-va-can-cao-tang-SUITE-node_scripts_suite_neu_doi_mjs_portal_st-r1
  exit_code: 0
  verified_at: 2026-11-27T03:37:06Z

### Judge panel (đề xuất, chờ người)

E10 — đề xuất: PASS. human_override: để trống cho người quyết ở Cổng 2.

- domain-correctness: PASS — ap-may-thu.md có đủ năm thứ: lệnh áp 130 hai lần và vòng nạp các bản thu v16 sau khi ZK chép vào collector/snapshots, số diễn tập (1.294 căn, 40 dự án, 1.268 có giá, chia 24/6/10, 0 dòng có http) khớp AC-5, sao lưu pg_dump trước, ba nấc lùi và lệnh kiểm s09-v16-that.mjs --dem. Hồ sơ nêu rõ áp SAU DA42 (115, 125 và lượt dựng đầu đã chạy). DATA-CONTRACT.md có mục «Mở rộng v16» với hai kind quy-can và can-cao-tang, và dòng lịch sử schemaVersion 16.
- operational-feasibility: PASS — ap-may-thu.md có đủ năm thứ: lệnh áp 130 (chạy hai lần) kèm vòng nạp từng bản thu v16 sau khi ZK chép vào collector/snapshots; số diễn tập 1.294 căn, 40 dự án, 1.268 có giá, chia 24/6/10, 0 `http`, khớp AC-5; sao lưu pg_dump (mục 1); cách lùi 4a–4c; lệnh kiểm `s09-v16-that.mjs --dem`. Tệp ghi rõ áp SAU DA42. DATA-CONTRACT.md có mục «Mở rộng v16» (dòng 318) với hai kind `quy-can`, `can-cao-tang`, và dòng lịch sử schemaVersion 16 (dòng 353).
- spec-alignment: PASS — ap-may-thu.md có đủ cả sáu mục. Mục 2 có lệnh áp 130 hai lần và vòng nạp các bản thu v16. Số diễn tập khớp AC-5 (1.294 căn, 40 dự án, 1.268 có giá, 24/6/10, 0 dòng có http). Mục 1 là sao lưu trước, mục 4 là cách lùi, mục 5 là lệnh kiểm sau, và phần đầu nêu rõ áp SAU DA42. DATA-CONTRACT.md có mục «Mở rộng v16» (dòng 318) với hai kind `quy-can` và `can-cao-tang` (dòng 328–329), cùng dòng lịch sử «schemaVersion 16» (dòng 353).

máy: M5 (M5 Max 18 nhân, colima 16/96) · DB: bản đầy đủ máy thu chép sang 26/11 05:45Z · ca đỏ có tên: không

Ghi chú phiên chấm M5 (sau lượt, không đổi verdict của kit): vòng 1 trên 9b0cbd0ca. Kit trả BLOCKED vì E11b (suite pipeline_b) không chạy được: require('pg') từ app/package.json báo MODULE_NOT_FOUND — app/node_modules của worktree chấm bị một lệnh cài trong lượt thay từ symlink sang thư mục thật, đang cài dở khi pipeline_b chạy song song (lỗi hạ tầng của bàn chấm, không phải của nhánh). Theo luật GS đã chạy lại riêng pipeline_b một lần trên cùng sha: tests 719, pass 717, fail 0, skipped 2, thoát 0 (evidence/m5-pipeline-b-rieng-r1.txt). Mọi eval khác PASS (E1–E9b, E10b, E11a, E11c, E8u), E10 judgment đề xuất PASS. pipeline_that (E11c, long_running 90): tests 37, pass 37, fail 0, skipped 0; «bỏ qua 1 ca chỉ máy thu» — tập bỏ qua bằng đúng may_thu → ĐẠT theo luật GS 26/11. Chấm trên M5: ON22-AC-10 không chạy (HT33). Migration 130 chỉ áp trên DB lượt; không áp vào DB oneinvest. Sau khi gỡ chặn, kết luận của phiên chấm là REJECT: review xác nhận một finding HIGH trong hợp đồng (AC-8 — test chỉ dò chuỗi giá trong toàn HTML; «5 tỷ» bị «4,25 tỷ» thoả, không buộc giá nằm đúng dòng căn) và một finding medium AC-2 (bảng kiểm kê chỉ phủ khoá cấp một của quỹ căn, chưa có assert riêng cho bốn khoá căn cao tầng). Ảnh E8u dùng tài khoản thử ops-test, không lộ email. Kit báo runLogWriteFailed — run-log của vòng do phiên chấm ghi từ kết quả.

## Known limits

## Ngoài hợp đồng

## Analyst

none — mọi eval feature đều red trên baseline hoặc là eval mới không đo được baseline (xem dưới).

Baseline khong do:
- node --test --test-concurrency=1 pipeline/lib/s09-danh-ba-v16.test.mjs pipeline/scripts/s09-v16.itest.mjs: bo qua baseline: tep pipeline/lib/s09-danh-ba-v16.test.mjs co o cay dang kiem nhung chua co o merge-base 1a2cb6a43b98f0a167262f4cdbbe40578fd86e8f — eval moi, chay tren code cu khong phan biet gi
- node pipeline/scripts/s09-v16-that.mjs --tran-phut 40: bo qua baseline: tep pipeline/scripts/s09-v16-that.mjs co o cay dang kiem nhung chua co o merge-base 1a2cb6a43b98f0a167262f4cdbbe40578fd86e8f — eval moi, chay tren code cu khong phan biet gi
- cd app && bash ../db/db-thu.sh oneinvest_suite_qc --chay node --import tsx --test --test-concurrency=1 tests/registry-quy-can.test.tsx: bo qua baseline: tep app/tests/registry-quy-can.test.tsx co o cay dang kiem nhung chua co o merge-base 1a2cb6a43b98f0a167262f4cdbbe40578fd86e8f — eval moi, chay tren code cu khong phan biet gi

## Variance

none — mọi eval chạy một lần, xác định, không có pass_rate hỗn hợp.

## Iterations

Round 1: E11b không chạy được — worktree thiếu module `pg` trong app/node_modules (MODULE_NOT_FOUND), nên verdict BLOCKED. Các eval khác đều đạt; cần chạy lại E11b trong worktree có đủ node_modules, không cần sửa code.
