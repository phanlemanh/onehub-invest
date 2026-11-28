---
schema_version: 2
feature_slug: s03-thu-lai-tin-roi-oan
verdict: REJECT
failed_evals: ["E9"]
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: 24b54a9b2d2120afad9200ef6ca9943ca0ddad9b
human_signoff:
---

# Evidence Report: s03-thu-lai-tin-roi-oan

Round 4. Nội dung thay trọn round cũ; lịch sử round ở mục Iterations.

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | test | PASS |
| E2 | AC-2 | test | PASS |
| E3 | AC-3 | test | PASS |
| E4 | AC-4 | test | PASS |
| E5 | AC-5 | script | PASS |
| E6 | AC-6 | judgment | đề xuất của hội đồng judge: FAIL, chờ người quyết |
| E7 | AC-7 | test | PASS |
| E8 | AC-7 | test | PASS |
| E9 | AC-7 | test | FAIL |

## Evidence

- eval: E1
  run_id: minted-s03-thu-lai-tin-roi-oan-E1-r4
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.pl43_unit
  verified_at: 2026-11-28T06:56:00Z
  output: |
    lệnh: node --test pipeline/scripts/s03-thu-lai-tin-roi-oan.test.mjs
    ℹ duration_ms 144.513583

- eval: E2
  run_id: minted-s03-thu-lai-tin-roi-oan-E2-r4
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.pl43_unit
  verified_at: 2026-11-28T06:56:00Z
  output: |
    cùng lệnh với E1 (một lượt chạy phủ E1, E2, E3)
    ℹ duration_ms 144.513583

- eval: E3
  run_id: minted-s03-thu-lai-tin-roi-oan-E3-r4
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.pl43_unit
  verified_at: 2026-11-28T06:56:00Z
  output: |
    cùng lệnh với E1 (một lượt chạy phủ E1, E2, E3)
    ℹ duration_ms 144.513583

- eval: E4
  run_id: minted-s03-thu-lai-tin-roi-oan-E4-r4
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.pl43_ac4
  verified_at: 2026-11-28T06:56:00Z
  output: |
    lệnh: db-thu.sh oneinvest_suite_pl43 --chay node --test --test-name-pattern 'PL43-AC-4' scripts/s03-thu-lai-tin-roi-oan.itest.mjs
    ℹ duration_ms 59784.898958

- eval: E5
  run_id: minted-s03-thu-lai-tin-roi-oan-E5-r4
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.pl43_do_that
  verified_at: 2026-11-28T06:56:00Z
  output: |
    lệnh: node --test scripts/do-tin-roi-oan.test.mjs rồi do-tin-roi-oan.mjs --kiem trên DB suite
    KẾT: đạt

- eval: E7
  run_id: minted-s03-thu-lai-tin-roi-oan-E7-r4
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.pl43_loai_tin
  verified_at: 2026-11-28T06:56:00Z
  output: |
    git diff so với a94013aaf chỉ thêm dòng ở ba tệp test; ba tệp test chạy xanh
    ℹ duration_ms 954979.456833

- eval: E8
  run_id: minted-s03-thu-lai-tin-roi-oan-E8-r4
  exit_code: 0
  baseline: n-a
  verifier: config:executors.suite.pipeline_a
  verified_at: 2026-11-28T06:56:00Z
  output: |
    lệnh: node scripts/suite-neu-doi.mjs pipeline_a -- 'cd pipeline && npm run test:a'
    ℹ duration_ms 247906.628834

- eval: E9
  run_id: minted-s03-thu-lai-tin-roi-oan-E9-r4
  exit_code: 1
  baseline: n-a
  verifier: config:executors.suite.pipeline_b
  verified_at: 2026-11-28T06:56:00Z
  output: |
    lệnh: node scripts/suite-neu-doi.mjs pipeline_b -- 'cd pipeline && npm run test:b'
    ℹ tests 872 · pass 869 · fail 1 · skipped 2
    Ca đỏ duy nhất: scripts/thu-duoi-chon-nap-e2e.test.mjs:120 «snapshot đuôi đã nạp bị lượt quét đủ đè hết snapshot_id → vòng rảnh kế KHÔNG nạp lại»
    AssertionError tại dòng 178: «snapshot C mới thật phải được nạp»; đầu ra thực tế là «nhường lượt — script nạp ngày đang chạy» thay cho «nạp snapshot đuôi …»
    Lệnh fail này gắn eval E9 (không có lệnh fail nào ngoài eval).

### Lệnh suite (hồi quy)

- cmd: node scripts/suite-neu-doi.mjs agent -- 'cd agent && npm test'
  run_id: minted-s03-thu-lai-tin-roi-oan-SUITE-node_scripts_suite_neu_doi_mjs_agent_cd_-r4
  exit_code: 0
  verified_at: 2026-11-28T06:56:00Z

- cmd: node scripts/suite-neu-doi.mjs app -- 'cd app && npx tsc --noEmit && npm run lint'
  run_id: minted-s03-thu-lai-tin-roi-oan-SUITE-lint-r4
  exit_code: 0
  verified_at: 2026-11-28T06:56:00Z

- cmd: node scripts/suite-neu-doi.mjs app_ui -- 'cd app && npm test'
  run_id: minted-s03-thu-lai-tin-roi-oan-SUITE-node_scripts_suite_neu_doi_mjs_app_ui_cd-r4
  exit_code: 0
  verified_at: 2026-11-28T06:56:00Z

- cmd: node scripts/suite-neu-doi.mjs ui_lint_rules -- 'cd app && npm run test:lint-rules'
  run_id: minted-s03-thu-lai-tin-roi-oan-SUITE-test_lint_rules-r4
  exit_code: 0
  verified_at: 2026-11-28T06:56:00Z

- cmd: node scripts/suite-neu-doi.mjs portal_static -- 'node scripts/check-portal-compliance.mjs'
  run_id: minted-s03-thu-lai-tin-roi-oan-SUITE-node_scripts_suite_neu_doi_mjs_portal_st-r4
  exit_code: 0
  verified_at: 2026-11-28T06:56:00Z

### Judgment (E6, AC-6)

- eval: E6
  judged_by: hội đồng judge (fresh context), đề xuất — người quyết ở Cổng 2
  proposal: FAIL
  panel:
    - domain-correctness: FAIL — Trong 20 tin ngẫu nhiên chỉ khoảng 17 đạt, thấp hơn ngưỡng 18. Ba tin không đạt: offer_6cc78e866f74ff45 (200 triệu «bao phí», chuyển nhượng/cắt lỗ, bị gán rent_lt), offer_d95d957a294f24a2 (voucher 175tr, «thu về 200tr chưa ký HĐMB», bị gán rent_lt), offer_79af18d5de9dc86b (khách tìm thuê «KH 1 nữ… in Stu full 7tr», nhãn inquiry vẫn lọt thành rent_lt 7tr). Mục (2): 10/10 tin phần C là tin bán thật đúng bậc tỷ, đạt. Mục (3): tin nhãn inquiry duy nhất là offer_79af18d5de9dc86b, câu tìm lọt thành tin thuê, không đạt. Mục (4): 20 bài còn rơi cho thấy tin rao bị bỏ sót ở các dạng giá ẩn «1.6xx», «31xxtỷ», «2.6x tỷ», «3.3», «6.5 in liền», «7tr», «giá 3,2 tỷ», giỏ hàng nhiều căn «TTS 9,382 tỷ». Dòng sha đầu tệp là 098c05bde12b586c47eb6eaf32b9863e084dd470, hạt giống pl43-mau-tin-moi.
    - operational-feasibility: FAIL — Chỉ 17 tin đạt, dưới ngưỡng 18. offer_6cc78e866f74ff45 (bán quyền «cắt hơn 700 tr», đọc nhầm thành thuê 200 triệu), offer_d95d957a294f24a2 (voucher 175tr, đọc nhầm thành thuê 175 triệu), offer_79af18d5de9dc86b (khách cần thuê, nhãn inquiry đúng nhưng vẫn lọt vào tập tin rao). Phần C có 10 mục nhưng chỉ 8 tin riêng biệt: offer_0419022963e18429 và offer_be02bbbf9d3d1e0e trùng với tập 20 tin; f783487ab449e953 và 5b82d3c5fec2ac20 cùng một bài.
    - spec-alignment: FAIL — Mục (1) chỉ đạt 17/20, thấp hơn ngưỡng 18. offer_6cc78e866f74ff45 và offer_d95d957a294f24a2 bị đọc thành rent_lt 200 triệu và 175 triệu nhưng chữ bài là chênh giá hoặc voucher của căn bán. offer_79af18d5de9dc86b là tin khách tìm thuê mà vẫn nằm trong 20 tin rao. Phần C có vẻ đạt 10/10 dù f783487ab449e953 và 5b82d3c5fec2ac20 trùng chữ bài. Mục (3) tệp chưa ghi «câu tìm lọt» hay «nhãn model sai». Mục (4) có nhiều tin rao thật bị bỏ sót.
  required_evidence:
    - Mẫu 20 tin ngẫu nhiên mới, hoặc bản sửa lỗi gán loại, trong đó ít nhất 18 tin là tin rao thật đúng bậc giá. Nguồn: chạy lại `pipeline/scripts/do-tin-roi-oan.mjs --kiem` rồi ghi vào evidence/mau-tin-moi.md. Cần bằng chứng offer_6cc78e866f74ff45 và offer_d95d957a294f24a2 (chuyển nhượng/voucher, không phải thuê dài hạn) không còn bị gán rent_lt.
    - Bằng chứng offer_79af18d5de9dc86b (khách tìm thuê, nhãn inquiry) không còn thành offer; mục «nhãn inquiry» ghi «câu tìm lọt» hoặc «nhãn model sai» cho từng tin, mục này rỗng hoặc đã xử lý.
    - Dòng sha trong tệp mẫu (098c05bde...) khớp cây đã chạy lượt đo; kiểm bằng `git rev-parse` trên nhánh fix/s03-thu-lai-tin-roi-oan, vì HEAD hiện là 24b54a9b2.
    - Phần C có đủ 10 tin riêng biệt, không trùng nhau và không trùng với 20 tin ở mục trên.
  human_override:  # chi nguoi ghi

## Known limits

## Ngoài hợp đồng

## Analyst

carried tu round 1 — baseline khong do lai round nay (evals.yaml không đổi từ lần baseline cuối, round 1). Field baseline của từng eval ghi n-a.

Eval không-phân-biệt (xanh cả trên code cũ lẫn code mới): không có. Các lệnh suite xanh cả hai phía là regression-guard bình thường, không liệt kê.

## Variance

none — không eval nào chạy nhiều lần; mọi eval deterministic và cho kết quả đồng nhất.

## Iterations

Round 1 đến round 3: xem run-log.jsonl cùng thư mục; round này thay thế nội dung các round trước.
Round 4: E9 không đạt — một ca đỏ trong nửa b bộ pipeline (thu-duoi-chon-nap-e2e.test.mjs:120), đầu ra thực tế là «nhường lượt — script nạp ngày đang chạy» thay cho dòng nạp snapshot đuôi (chưa xác định là do môi trường hay do thay đổi, cần chạy lại riêng). E6 hội đồng judge đề xuất không đạt: mẫu 20 tin ngẫu nhiên chỉ đạt khoảng 17/20. Trả về implementation.
