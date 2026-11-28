---
schema_version: 2
feature_slug: nap-s09-quy-can-va-can-cao-tang
verdict: PASS
failed_evals: []
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: 9f3b6cd91fa0dc51221917834c8cd294fc0bf23a
human_signoff: Mạnh 2026-11-27
---

# Evidence Report: nap-s09-quy-can-va-can-cao-tang

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
| E10 | AC-10 | judgment | PENDING-JUDGMENT (máy đề xuất PASS, chờ người) |
| E10b | AC-10 | script | PASS |
| E11a | AC-6 | test | PASS |
| E11b | AC-6 | test | PASS |
| E11c | AC-6 | test | PASS |

## Evidence

- eval: E1
  run_id: minted-nap-s09-quy-can-va-can-cao-tang-E1-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.s09_v16_db
  verified_at: 2026-11-27T08:20:53Z
  output: |
    ℹ duration_ms 4287.395167

- eval: E2
  run_id: minted-nap-s09-quy-can-va-can-cao-tang-E2-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.s09_v16_db
  verified_at: 2026-11-27T08:20:53Z
  output: |
    ℹ duration_ms 4287.395167

- eval: E3
  run_id: minted-nap-s09-quy-can-va-can-cao-tang-E3-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.s09_v16_db
  verified_at: 2026-11-27T08:20:53Z
  output: |
    ℹ duration_ms 4287.395167

- eval: E4
  run_id: minted-nap-s09-quy-can-va-can-cao-tang-E4-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.s09_v16_db
  verified_at: 2026-11-27T08:20:53Z
  output: |
    ℹ duration_ms 4287.395167

- eval: E9
  run_id: minted-nap-s09-quy-can-va-can-cao-tang-E9-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.s09_v16_db
  verified_at: 2026-11-27T08:20:53Z
  output: |
    ℹ duration_ms 4287.395167

- eval: E5
  run_id: minted-nap-s09-quy-can-va-can-cao-tang-E5-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.s09_v16_that
  verified_at: 2026-11-27T08:20:53Z
  output: |
    s09-v16-that: khớp mọi ô

- eval: E6
  run_id: minted-nap-s09-quy-can-va-can-cao-tang-E6-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.s09_v16_that
  verified_at: 2026-11-27T08:20:53Z
  output: |
    s09-v16-that: khớp mọi ô

- eval: E7
  run_id: minted-nap-s09-quy-can-va-can-cao-tang-E7-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.s09_v16_app
  verified_at: 2026-11-27T08:20:53Z
  output: |
    ℹ duration_ms 1735.235375

- eval: E8
  run_id: minted-nap-s09-quy-can-va-can-cao-tang-E8-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.s09_v16_app
  verified_at: 2026-11-27T08:20:53Z
  output: |
    ℹ duration_ms 1735.235375

- eval: E9b
  run_id: minted-nap-s09-quy-can-va-can-cao-tang-E9b-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.s09_v16_app
  verified_at: 2026-11-27T08:20:53Z
  output: |
    ℹ duration_ms 1735.235375

- eval: E10b
  run_id: minted-nap-s09-quy-can-va-can-cao-tang-E10b-r2
  exit_code: 0
  baseline: red
  verifier: config:executors.script.s09_v16_dc
  verified_at: 2026-11-27T08:20:53Z
  output: |
    git diff 767c70c13 -- collector/docs/DATA-CONTRACT.md rỗng

- eval: E11a
  run_id: minted-nap-s09-quy-can-va-can-cao-tang-E11a-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.suite.pipeline_a
  verified_at: 2026-11-27T08:20:53Z
  output: |
    ℹ duration_ms 361128.385209

- eval: E11b
  run_id: minted-nap-s09-quy-can-va-can-cao-tang-E11b-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.suite.pipeline_b
  verified_at: 2026-11-27T08:20:53Z
  output: |
    ℹ duration_ms 176003.713666

- eval: E11c
  run_id: minted-nap-s09-quy-can-va-can-cao-tang-E11c-r2
  exit_code: 0
  baseline: red
  verifier: config:executors.suite.pipeline_that
  verified_at: 2026-11-27T08:20:53Z
  output: |
    ℹ duration_ms 2731764.917958

- eval: E8u
  run_id: minted-nap-s09-quy-can-va-can-cao-tang-E8u-r2
  exit_code: 0
  baseline: n-a
  verifier: scripts/ui-capture.sh
  verified_at: 2026-11-27T08:20:53Z
  screenshot: evidence/E8u-tong.png
  observed: |
    E8u-tong.png (cũng là E8u-step1.png và E8u-step2.png, cùng nội dung): trang Danh bạ /ops/registry đã đăng nhập bằng tài khoản ops thử. Có ô tổng "Căn CĐT đang bán S09" = 1.294, dòng phụ "1.268 có giá · 40 dự án: 24 nối nút · 6 còn thẻ · 10 chưa có trong danh mục". Đúng bằng kết quả SELECT độc lập trên DB thử (1294|1268|40|24|6|10). Nhãn thật là "Căn CĐT đang bán S09", không phải chữ «Quỹ căn S09» như expected, nhưng nội dung và ý nghĩa khớp; chỉ ghi mã S09.
    E8u-quy-can.png (cũng là E8u-step3.png), chụp /ops/registry/592 (Masteri Waterfront), khung 1280x2600: có khối "Căn CĐT đang bán" ghi "290 căn", bảng có các cột Mã căn, Loại hình, PN·WC, Diện tích, Giá bán (ví dụ 5,25 tỷ), Giá/m² (83 tr/m²) và Trạng thái nguồn (AVAILABLE). Phân trang 1–25/290. 290 khớp SELECT trên view (290 căn, 290 có giá). Ảnh không có URL ảnh, toạ độ hay tên nguồn thật. Ở các dòng toà, cột Nguồn chỉ ghi mã "S09".
  network_observed: n-a (driver)

### Lệnh suite (hồi quy)

- cmd: node scripts/suite-neu-doi.mjs agent -- 'cd agent && npm test'
  run_id: minted-nap-s09-quy-can-va-can-cao-tang-SUITE-node_scripts_suite_neu_doi_mjs_agent_cd_-r2
  exit_code: 0
  verified_at: 2026-11-27T08:20:53Z

- cmd: node scripts/suite-neu-doi.mjs app -- 'cd app && npx tsc --noEmit && npm run lint'
  run_id: minted-nap-s09-quy-can-va-can-cao-tang-SUITE-lint-r2
  exit_code: 0
  verified_at: 2026-11-27T08:20:53Z

- cmd: node scripts/suite-neu-doi.mjs app_ui -- 'cd app && npm test'
  run_id: minted-nap-s09-quy-can-va-can-cao-tang-SUITE-node_scripts_suite_neu_doi_mjs_app_ui_cd-r2
  exit_code: 0
  verified_at: 2026-11-27T08:20:53Z

- cmd: node scripts/suite-neu-doi.mjs ui_lint_rules -- 'cd app && npm run test:lint-rules'
  run_id: minted-nap-s09-quy-can-va-can-cao-tang-SUITE-test_lint_rules-r2
  exit_code: 0
  verified_at: 2026-11-27T08:20:53Z

- cmd: node scripts/suite-neu-doi.mjs portal_static -- 'node scripts/check-portal-compliance.mjs'
  run_id: minted-nap-s09-quy-can-va-can-cao-tang-SUITE-node_scripts_suite_neu_doi_mjs_portal_st-r2
  exit_code: 0
  verified_at: 2026-11-27T08:20:53Z

### Judgment

- eval: E10
  judged_by: judge panel (fresh context), đề xuất PASS
  rationale: Ba góc nhìn cùng đề xuất PASS. ap-may-thu.md có đủ năm thứ (sao lưu mục 1, lệnh áp 130 mục 2, cách lùi mục 4, lệnh kiểm sau mục 5, số diễn tập khớp AC-5), nêu rõ áp sau DA42; DATA-CONTRACT.md có mục «Mở rộng v16» và dòng lịch sử schemaVersion 16.
  votes:
    - domain-correctness: PASS — năm thứ đủ; số diễn tập 1.294 căn, 40 dự án, 1.268 có giá, chia 24·6·10, 0 dòng du rỗng, 0 dòng có http; áp sau DA42, cần 115 và 125 đã áp.
    - operational-feasibility: PASS — lệnh áp 130 hai lần và vòng nạp từng bản v16 ở mục 2; sao lưu mục 1, cách lùi mục 4, kiểm sau mục 5; DATA-CONTRACT dòng 318 và 353.
    - spec-alignment: PASS — đủ năm thứ, số diễn tập khớp AC-5, áp sau DA42, DATA-CONTRACT có mục «Mở rộng v16» khai hai kind quy-can và can-cao-tang.
  lưu ý: review-findings có một finding trong hợp đồng AC-10 về cách lùi 4c, người cần cân nhắc khi quyết.
  human_override: Mạnh 2026-11-27 — Đạt

máy: M5 (M5 Max 18 nhân, colima 16/96) · DB: bản đầy đủ máy thu chép sang 26/11 05:45Z · ca đỏ có tên: không

Ghi chú phiên chấm M5 (sau lượt, không đổi verdict của kit): vòng 2 trên 70079a04ea68da2dd8771b547ebb2385d50b373b (--no-carry, 16 eval); soát 70079a04e-20261127T152019 chỉ đỏ QV-AC-5. node_modules bốn module có pg trước khi chấm. Mọi eval máy PASS, mọi lệnh suite thoát 0, không lệnh nào BLOCKED. pipeline_that (E11c, long_running 90): 37/37, «bỏ qua 1 ca chỉ máy thu» → ĐẠT; chấm trên M5: ON22-AC-10 không chạy (HT33). Finding medium AC-2 của vòng 1 đã đóng. Kit trả PENDING-JUDGMENT (T3, E10 đề xuất PASS chờ người). Review: một finding medium trong hợp đồng AC-10 — cách lùi 4c trong ap-may-thu.md (pg_restore --clean -t …) không chạy được vì DROP TABLE bị chặn bởi phụ thuộc (FK tới airbnb_snapshots, view của 130) rồi COPY trùng khoá; người ký Cổng Bằng chứng cần thấy vì lời áp DB máy thu đòi đủ năm thứ gồm cách lùi. Ngoài hợp đồng: một finding high (phép băm E6 ba lượt không thể đỏ trước đột biến ORDER BY ngược) đề xuất Known limits. Ảnh E8u chụp lại, tài khoản thử ops-test, không lộ email. Migration 130 chỉ áp DB lượt. Kit báo runLogWriteFailed — run-log do phiên chấm ghi.

## Known limits

## Ngoài hợp đồng

## Analyst

none — moi eval feature deu red tren baseline (co phan biet)

Lưu ý: nhiều eval mới không đo được baseline nên ghi n-a, không phải kết luận phân biệt.

Baseline khong do
- node --test --test-concurrency=1 pipeline/lib/s09-danh-ba-v16.test.mjs pipeline/scripts/s09-v16.itest.mjs: bo qua baseline: tep pipeline/lib/s09-danh-ba-v16.test.mjs co o cay dang kiem nhung chua co o merge-base 1a2cb6a43b98f0a167262f4cdbbe40578fd86e8f — eval moi, chay tren code cu khong phan biet gi
- node pipeline/scripts/s09-v16-that.mjs --tran-phut 40: bo qua baseline: tep pipeline/scripts/s09-v16-that.mjs co o cay dang kiem nhung chua co o merge-base 1a2cb6a43b98f0a167262f4cdbbe40578fd86e8f — eval moi, chay tren code cu khong phan biet gi
- cd app && bash ../db/db-thu.sh oneinvest_suite_qc --chay node --import tsx --test --test-concurrency=1 tests/registry-quy-can.test.tsx: bo qua baseline: tep app/tests/registry-quy-can.test.tsx co o cay dang kiem nhung chua co o merge-base 1a2cb6a43b98f0a167262f4cdbbe40578fd86e8f — eval moi, chay tren code cu khong phan biet gi
- node scripts/suite-neu-doi.mjs pipeline_a -- 'cd pipeline && npm run test:a': baseline vuot tran 180 giay/lenh — da dung ca cay tien trinh; BLOCKED ha tang, khong phai ket qua cua code cu
- node scripts/suite-neu-doi.mjs pipeline_b -- 'cd pipeline && npm run test:b': baseline vuot tran 180 giay/lenh — da dung ca cay tien trinh; BLOCKED ha tang, khong phai ket qua cua code cu

## Variance

none — every multi-run eval is uniform

## Iterations

Round 1: xem lịch sử vòng trước (S4 r1 chạy lại do fixture thiếu lá thật).
Round 2: mọi eval máy xanh; E10 chờ người (judgment), nên verdict PENDING-JUDGMENT.

### Re-pin lần 1 — 2026-11-28, do gộp main tới e594ffeaf sau chữ ký; E10b đổi sang so khối v16 (GS phán 28/11)
run_id: repin-20261128T091509Z-26690
sha: 9f3b6cd91fa0dc51221917834c8cd294fc0bf23a · suites: 8 lệnh exit 0 · evals: 14/14 eval máy đạt kỳ vọng · ngoài làn máy: E8u, E10 · diff chạm vật đo ngoài làn máy: E8u, E10 — chưa chứng lại, đi vòng S4 delta
