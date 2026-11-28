---
schema_version: 2
feature_slug: s03-thu-lai-tin-roi-oan
verdict: REJECT
failed_evals: []
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: 9df37772491db2172d97775b648e6f591ee26586
human_signoff:
---

# Evidence Report: s03-thu-lai-tin-roi-oan

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | test | PASS |
| E2 | AC-2 | test | PASS |
| E3 | AC-3 | test | PASS |
| E4 | AC-4 | test | PASS |
| E5 | AC-5 | script | PASS |
| E6 | AC-6 | judgment | UNCERTAIN |
| E7 | AC-7 | test | PASS |
| E8 | AC-7 | test | PASS |
| E9 | AC-7 | test | PASS |

Verdict tổng REJECT do máy tính sẵn; không eval máy nào đỏ (failed_evals rỗng). Hội đồng chấm E6 (judgment) có ý kiến lệch và chưa có human_override; một finding trong hợp đồng (AC-3, mức high) nằm ở review-findings.md.

## Evidence

- eval: E1
  run_id: minted-s03-thu-lai-tin-roi-oan-E1-r3
  exit_code: 0
  baseline: n-a
  runs: 1
  verifier: config:executors.test.pl43_unit
  verified_at: 2026-11-28T04:21:27Z
  cmd: node --test pipeline/scripts/s03-thu-lai-tin-roi-oan.test.mjs
  output: |
    ℹ duration_ms 121.924875

- eval: E2
  run_id: minted-s03-thu-lai-tin-roi-oan-E2-r3
  exit_code: 0
  baseline: n-a
  runs: 1
  verifier: config:executors.test.pl43_unit
  verified_at: 2026-11-28T04:21:27Z
  cmd: node --test pipeline/scripts/s03-thu-lai-tin-roi-oan.test.mjs
  output: |
    ℹ duration_ms 121.924875

- eval: E3
  run_id: minted-s03-thu-lai-tin-roi-oan-E3-r3
  exit_code: 0
  baseline: n-a
  runs: 1
  verifier: config:executors.test.pl43_unit
  verified_at: 2026-11-28T04:21:27Z
  cmd: node --test pipeline/scripts/s03-thu-lai-tin-roi-oan.test.mjs
  output: |
    ℹ duration_ms 121.924875

- eval: E4
  run_id: minted-s03-thu-lai-tin-roi-oan-E4-r3
  exit_code: 0
  baseline: n-a
  runs: 1
  verifier: config:executors.test.pl43_ac4
  verified_at: 2026-11-28T04:21:27Z
  cmd: cd pipeline && bash ../db/db-thu.sh oneinvest_suite_pl43 --chay node --test --test-name-pattern 'PL43-AC-4' scripts/s03-thu-lai-tin-roi-oan.itest.mjs (qua awk kiểm pass ≥ 1, fail 0, skipped 0)
  output: |
    ℹ duration_ms 62181.826458

- eval: E5
  run_id: minted-s03-thu-lai-tin-roi-oan-E5-r3
  exit_code: 0
  baseline: n-a
  runs: 1
  verifier: config:executors.script.pl43_do_that
  verified_at: 2026-11-28T04:21:27Z
  cmd: cd pipeline && node --test scripts/do-tin-roi-oan.test.mjs && bash ../db/db-thu.sh oneinvest_suite_pl43_that --chay node scripts/do-tin-roi-oan.mjs --kiem
  output: |
    KẾT: đạt

- eval: E7
  run_id: minted-s03-thu-lai-tin-roi-oan-E7-r3
  exit_code: 0
  baseline: n-a
  runs: 1
  verifier: config:executors.test.pl43_loai_tin
  verified_at: 2026-11-28T04:21:27Z
  cmd: diff so với a94013aaf chỉ thêm dòng ở ba tệp test loại tin, rồi node --test ba tệp đó
  output: |
    ℹ duration_ms 719548.771334

- eval: E8
  run_id: minted-s03-thu-lai-tin-roi-oan-E8-r3
  exit_code: 0
  baseline: n-a
  runs: 1
  verifier: config:executors.suite.pipeline_a
  verified_at: 2026-11-28T04:21:27Z
  cmd: node scripts/suite-neu-doi.mjs pipeline_a -- 'cd pipeline && npm run test:a'
  output: |
    ℹ duration_ms 245096.315292

- eval: E9
  run_id: minted-s03-thu-lai-tin-roi-oan-E9-r3
  exit_code: 0
  baseline: n-a
  runs: 1
  verifier: config:executors.suite.pipeline_b
  verified_at: 2026-11-28T04:21:27Z
  cmd: node scripts/suite-neu-doi.mjs pipeline_b -- 'cd pipeline && npm run test:b'
  output: |
    ℹ duration_ms 116467.245166

### Judgment

- eval: E6
  judged_by: hội đồng đề xuất (domain-correctness, operational-feasibility, spec-alignment)
  proposal: UNCERTAIN
  votes:
    - domain-correctness: FAIL — Mục (1) chỉ khoảng 17/20 đạt, dưới ngưỡng 18. offer_d95d957a294f24a2 là voucher 175tr của căn sơ cấp nhưng bị đọc thành rent_lt 175.000.000 đ. offer_9a625fdd7cd2d23c ghi «4tr5» mà đọc thành 4.000.000 đ. offer_434fbd14381fd873 gộp bốn căn thành một tin 10,8tr. Mục (2) phần C ước 9–10/10, nhưng f783487ab449e953 và 5b82d3c5fec2ac20 là cùng một bài, còn d042b8faeccf4a02 có hai giá (1.550 và 1.690), nên chưa chắc đạt. Mục (3) offer_79af18d5de9dc86b «KH 1 nữ… in Stu full 7tr» là bài khách tìm: nhãn inquiry của model đúng nhưng câu tìm lọt, bài vẫn thành rent_lt 7tr. Mục (4) tin rao bị sót ở các dạng sau. Giá viết gọn không có «tỷ» hay «tr»: «Full 8500 cọc 2» (d10e6673…), «Giá thu về: 1.620» (0c28c098…), «thu về 3,1xx» (a5777e88…), «Chỉ còn 2.5xx» (a5a34866…). Giá viết «Tài Chính 3,2 tỷ» (6f26a33c…, db4560a7…), «TTS: 6,555 tỷ» (10443675…) và «cắt giá 1,4XX thu về» (bba77da6…). Chữ toán học Unicode «𝟑,𝟒𝟏 𝐭𝐲̉» (ca5fb2f2…, 2f007742…). Bài nhiều căn «Cho thuê… Link ảnh» (7f1e37d0…, 3fdbb9d7…). Dòng sha ở đầu tệp: 08ff710dd773b81b262593b30615e2242e919557; hạt giống: pl43-mau-tin-moi.
    - operational-feasibility: UNCERTAIN — Mẫu 20 tin có 2 tin sai rõ: offer_d95d957a294f24a2 (tin bán có HĐMB, voucher 175tr, bị đọc thành rent_lt 175 triệu) và offer_9a625fdd7cd2d23c (giá 4tr5 bị đọc là 4.000.000). offer_434fbd14381fd873 là bài gộp bốn căn với một giá 10,8tr, nên chưa rõ có tính là tin đúng hay không: nếu tính thì đạt đúng ngưỡng 18/20, nếu không thì 17/20 và trượt. Phần C đạt 10/10. Tin inquiry offer_79af18d5de9dc86b là câu tìm thật, nhãn model đúng. Trong 20 bài còn rơi, các dạng chữ bị bỏ sót gồm: 3,2 tỷ trần, 8500, thu về 1.620, 2.5xx, chữ toán học in đậm kiểu 𝟑,𝟒𝟏 𝐭𝐲̉. Dòng sha đầu tệp: 08ff710dd773b81b262593b30615e2242e919557; hạt giống: pl43-mau-tin-moi.
    - spec-alignment: PASS — Trong 20 tin ngẫu nhiên có 18 tin đạt (ngưỡng ≥18), 2 tin không đạt. Tin offer_d95d957a294f24a2 là voucher/cọc bị đọc thành thuê 175tr. Tin offer_9a625fdd7cd2d23c ghi 4tr5 nhưng đọc thành 4tr, đúng bậc nhưng sai số. Cả 10 tin phần C là tin bán thật, giá đúng bậc tỷ, đạt ≥9. Tin offer_f783487ab449e953 và offer_5b82d3c5fec2ac20 cùng chữ bài nên có thể là bản trùng. Tin nhãn inquiry duy nhất offer_79af18d5de9dc86b ("KH 1 nữ … in Stu full 7tr") là câu tìm lọt vào phần A. Trong 20 bài còn rơi, các dạng bị bỏ sót là giá viết tắt không có đơn vị: "1.620", "8500", "2.5xx", "3,1xx", "1,4XX", "3,2 tỷ", "6,555 tỷ" và "2,35 tỷ"/"3,41 tỷ" viết bằng chữ Unicode đậm; ngoài ra có bài nhãn inquiry/not_listing đáng nghi. Dòng sha và hạt giống ở đầu tệp: sha 08ff710dd773b81b262593b30615e2242e919557, hat_giong pl43-mau-tin-moi.
  required_evidence:
    - Bản mẫu chạy lại ở cây mới nhất (sha dc4ff8711 hoặc sau đó) bằng `pipeline/scripts/do-tin-roi-oan.mjs --kiem` với hạt giống pl43-mau-tin-moi, ghi vào _acceptance/s03-thu-lai-tin-roi-oan/evidence/mau-tin-moi.md. Trong 20 tin ngẫu nhiên phải có ít nhất 18 tin đúng giá và đúng bậc: d95d957a294f24a2 (voucher 175tr), 9a625fdd7cd2d23c (4tr5) và 434fbd14381fd873 (gộp nhiều căn) phải được sửa hoặc loại.
    - Dòng sha ở đầu tệp mẫu khớp với cây đã chạy lượt đo. Hiện tệp ghi 08ff710dd, trong khi lượt đo gần nhất ghi ở dc4ff8711.
    - Phán quyết của người cho offer_434fbd14381fd873 (bài gộp bốn căn, giá 10,8tr) là đạt hay không đạt, lấy từ chữ bài gốc trong bản chép DB. Nếu tính đạt thì 18/20; nếu không thì dưới ngưỡng.
  human_override:  # chi nguoi ghi

### Lệnh suite (hồi quy)

- cmd: node scripts/suite-neu-doi.mjs agent -- 'cd agent && npm test'
  run_id: minted-s03-thu-lai-tin-roi-oan-SUITE-node_scripts_suite_neu_doi_mjs_agent_cd_-r3
  exit_code: 0
  verified_at: 2026-11-28T04:21:27Z

- cmd: node scripts/suite-neu-doi.mjs app -- 'cd app && npx tsc --noEmit && npm run lint'
  run_id: minted-s03-thu-lai-tin-roi-oan-SUITE-lint-r3
  exit_code: 0
  verified_at: 2026-11-28T04:21:27Z

- cmd: node scripts/suite-neu-doi.mjs app_ui -- 'cd app && npm test'
  run_id: minted-s03-thu-lai-tin-roi-oan-SUITE-node_scripts_suite_neu_doi_mjs_app_ui_cd-r3
  exit_code: 0
  verified_at: 2026-11-28T04:21:27Z

- cmd: node scripts/suite-neu-doi.mjs ui_lint_rules -- 'cd app && npm run test:lint-rules'
  run_id: minted-s03-thu-lai-tin-roi-oan-SUITE-test_lint_rules-r3
  exit_code: 0
  verified_at: 2026-11-28T04:21:27Z

- cmd: node scripts/suite-neu-doi.mjs portal_static -- 'node scripts/check-portal-compliance.mjs'
  run_id: minted-s03-thu-lai-tin-roi-oan-SUITE-node_scripts_suite_neu_doi_mjs_portal_st-r3
  exit_code: 0
  verified_at: 2026-11-28T04:21:27Z

## Known limits

## Ngoài hợp đồng

## Analyst

carried tu round 1 — baseline khong do lai round nay

none

## Variance

none — every multi-run eval is uniform

## Iterations

Round 3: không eval máy nào đỏ; E6 (judgment) chưa người chốt, hội đồng lệch (một phiếu FAIL, một UNCERTAIN, một PASS), còn một finding trong hợp đồng AC-3 mức high. Verdict REJECT, chuyển người quyết. Lịch sử round 1 và 2 không có trong dữ liệu round này.
