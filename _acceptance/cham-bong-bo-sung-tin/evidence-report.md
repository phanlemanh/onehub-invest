---
schema_version: 2
feature_slug: cham-bong-bo-sung-tin
verdict: REJECT
failed_evals: ["E1","E2","E3","E4","E6","E7","E8","E9","E10"]
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: 511a43b1a0364bf96d52d66e3f2f695880c9c54f
human_signoff:
---

# Evidence Report: cham-bong-bo-sung-tin

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | script | FAIL |
| E2 | AC-2 | script | FAIL |
| E3 | AC-3 | script | FAIL |
| E4 | AC-4 | script | FAIL |
| E5 | AC-5 | script | PASS |
| E6 | AC-6 | script | FAIL |
| E7 | AC-7 | script | FAIL |
| E8 | AC-8 | script | FAIL |
| E9 | AC-9 | script | FAIL |
| E10 | AC-10 | script | FAIL |

không chạy theo hồ sơ: E11

## Evidence

- eval: E1
  run_id: minted-cham-bong-bo-sung-tin-E1-r1
  exit_code: 1
  baseline: n-a
  verifier: _acceptance/cham-bong-bo-sung-tin/probes/cham.sh
  verified_at: 2026-11-21T09:22:12Z
  output: |
    HỎNG đột biến «một model đọc hai lần»: thước vẫn xanh
    HỎNG đột biến «gọi một lần mỗi đề xuất»: đỏ nhưng không có thông điệp ghim /thẻ c06: 6 lời gọi, mong 2/
    ERR_MODULE_NOT_FOUND: không tìm thấy agent/src/enrich/cham-bong.dot-bien/prompt.js (nạp từ bản sao đột biến)
    tests/cham-bong-bo-sung-tin.test.ts: 1 test, 0 đạt, 1 hỏng

- eval: E2
  run_id: minted-cham-bong-bo-sung-tin-E2-r1
  exit_code: 1
  baseline: n-a
  verifier: _acceptance/cham-bong-bo-sung-tin/probes/cham.sh
  verified_at: 2026-11-21T09:22:12Z
  output: |
    xanh AC-2 trên mã thật: 4 ca
    HỎNG đột biến «chèn giá trị đề xuất vào lời nhắc»: đỏ nhưng không có thông điệp ghim /lộ (giá trị đề xuất )?«[^»]+»/
    ERR_MODULE_NOT_FOUND: không tìm thấy agent/src/enrich/cham-bong.dot-bien/ket-cuc.js
    HỎNG đột biến «dùng chữ cắt 300 ký tự»: thước vẫn xanh

- eval: E3
  run_id: minted-cham-bong-bo-sung-tin-E3-r1
  exit_code: 1
  baseline: n-a
  verifier: _acceptance/cham-bong-bo-sung-tin/probes/cham.sh
  verified_at: 2026-11-21T09:22:12Z
  output: |
    xanh AC-3 trên mã thật: 1 ca
    HỎNG đột biến «bỏ kiểm trích»: thước vẫn xanh

- eval: E4
  run_id: minted-cham-bong-bo-sung-tin-E4-r1
  exit_code: 1
  baseline: n-a
  verifier: _acceptance/cham-bong-bo-sung-tin/probes/cham.sh
  verified_at: 2026-11-21T09:22:12Z
  output: |
    xanh AC-4 trên mã thật: 4 ca
    đỏ đúng AC-4 «so chuỗi thô»: ô «02/2» phải khop
    HỎNG đột biến «xếp A/B thành bac_dong_thuan»: thước vẫn xanh
    HỎNG đột biến «bỏ lech_tren_the khỏi ca biên»: đỏ nhưng không có thông điệp ghim /lech=true .*ca biên false/
    ERR_MODULE_NOT_FOUND: không tìm thấy agent/src/enrich/cham-bong.dot-bien/ket-cuc.js

- eval: E5
  run_id: minted-cham-bong-bo-sung-tin-E5-r1
  exit_code: 0
  baseline: n-a
  verifier: _acceptance/cham-bong-bo-sung-tin/probes/cham.sh
  verified_at: 2026-11-21T09:22:12Z
  output: |
    đỏ đúng AC-5 «chế độ áp gọi apply_enrichment»: lượt áp trọn: bảng đổi enrichment_proposals, field_assertions, sale_offer_records, md5:sale_offers, md5:enrichment_proposals, md5:field_assertions

- eval: E6
  run_id: minted-cham-bong-bo-sung-tin-E6-r1
  exit_code: 1
  baseline: n-a
  verifier: _acceptance/cham-bong-bo-sung-tin/probes/cham.sh
  verified_at: 2026-11-21T09:22:12Z
  output: |
    xanh AC-6 trên mã thật: 1 ca
    HỎNG đột biến «bỏ ghi sổ khi lỗi»: đỏ nhưng không có thông điệp ghim /sổ tệp 18 dòng, mong 20/
    ERR_MODULE_NOT_FOUND: không tìm thấy agent/src/enrich/cham-bong.dot-bien/prompt.js

- eval: E7
  run_id: minted-cham-bong-bo-sung-tin-E7-r1
  exit_code: 1
  baseline: n-a
  verifier: _acceptance/cham-bong-bo-sung-tin/probes/cham.sh
  verified_at: 2026-11-21T09:22:12Z
  output: |
    xanh AC-7 trên mã thật: 1 ca
    HỎNG đột biến «bỏ khoá băm»: thước vẫn xanh
    HỎNG đột biến «lưu kết quả lỗi vào khoá»: đỏ nhưng không có thông điệp ghim /\(b\) lần hai gọi 0, mong đúng 2/
    AC-7 chạy lại chỉ gọi cặp chưa thành công: (c) lần hai gọi 17, mong 13

- eval: E8
  run_id: minted-cham-bong-bo-sung-tin-E8-r1
  exit_code: 1
  baseline: n-a
  verifier: _acceptance/cham-bong-bo-sung-tin/probes/cham.sh
  verified_at: 2026-11-21T09:22:12Z
  output: |
    xanh AC-8 trên mã thật: 1 ca
    HỎNG đột biến «kiểm trần sau khi gọi»: thước vẫn xanh

- eval: E9
  run_id: minted-cham-bong-bo-sung-tin-E9-r1
  exit_code: 1
  baseline: n-a
  verifier: _acceptance/cham-bong-bo-sung-tin/probes/cham.sh
  verified_at: 2026-11-21T09:22:12Z
  output: |
    xanh AC-9 trên mã thật: 1 ca
    HỎNG đột biến «đếm theo thẻ thay vì đề xuất»: thước vẫn xanh
    HỎNG đột biến «gộp lỗi vào bo_trong»: đỏ nhưng không có thông điệp ghim
    AC-9 báo cáo từ tệp sau lượt có 2 lời gọi lỗi: ô bedrooms × khop × e2_llm: 0, mong 1

- eval: E10
  run_id: minted-cham-bong-bo-sung-tin-E10-r1
  exit_code: 1
  baseline: n-a
  verifier: _acceptance/cham-bong-bo-sung-tin/probes/cham.sh
  verified_at: 2026-11-21T09:22:12Z
  output: |
    xanh AC-10 trên mã thật: 1 ca
    HỎNG đột biến «lấy cả thẻ có đề xuất»: đỏ nhưng không có thông điệp ghim /tổng lệch: 9, mong 7/
    ERR_MODULE_NOT_FOUND: tài nguyên sinh hoạt động bất đồng bộ sau khi test kết thúc

### Lệnh suite (hồi quy)

- cmd: node scripts/suite-neu-doi.mjs agent -- 'cd agent && npm test'
  run_id: minted-cham-bong-bo-sung-tin-SUITE-node_scripts_suite_neu_doi_mjs_agent_cd_-r1
  exit_code: 0
  verified_at: 2026-11-21T09:22:12Z

- cmd: node scripts/suite-neu-doi.mjs app -- 'cd app && npx tsc --noEmit && npm run lint'
  run_id: minted-cham-bong-bo-sung-tin-SUITE-lint-r1
  exit_code: 2
  verified_at: 2026-11-21T09:22:12Z

- cmd: node scripts/suite-neu-doi.mjs app_ui -- 'cd app && npm test'
  run_id: minted-cham-bong-bo-sung-tin-SUITE-node_scripts_suite_neu_doi_mjs_app_ui_cd-r1
  exit_code: 1
  verified_at: 2026-11-21T09:22:12Z

- cmd: node scripts/suite-neu-doi.mjs pipeline_a -- 'cd pipeline && npm run test:a'
  run_id: minted-cham-bong-bo-sung-tin-SUITE-test_a-r1
  exit_code: 0
  verified_at: 2026-11-21T09:22:12Z

- cmd: node scripts/suite-neu-doi.mjs pipeline_b -- 'cd pipeline && npm run test:b'
  run_id: minted-cham-bong-bo-sung-tin-SUITE-test_b-r1
  exit_code: 1
  verified_at: 2026-11-21T09:22:12Z

- cmd: node scripts/suite-neu-doi.mjs ui_lint_rules -- 'cd app && npm run test:lint-rules'
  run_id: minted-cham-bong-bo-sung-tin-SUITE-test_lint_rules-r1
  exit_code: 0
  verified_at: 2026-11-21T09:22:12Z

- cmd: node scripts/suite-neu-doi.mjs portal_static -- 'node scripts/check-portal-compliance.mjs'
  run_id: minted-cham-bong-bo-sung-tin-SUITE-node_scripts_suite_neu_doi_mjs_portal_st-r1
  exit_code: 0
  verified_at: 2026-11-21T09:22:12Z

## Known limits

## Ngoài hợp đồng

## Analyst

none — mọi eval feature đều red trên baseline (có phân biệt)

Ghi chú lệnh suite đỏ không gắn eval: app (tsc báo thiếu kiểu LayoutProps/PageProps ở app/src/app), app_ui (không nạp được gói pg từ data-api trong worktree), pipeline_b (vocab-lint VL-AC-5: sáu chỗ viết tay trong agent/src/enrich/cham-bong/ chưa có trong sổ ngoại lệ).

Baseline khong do
- bash _acceptance/cham-bong-bo-sung-tin/probes/cham.sh AC-1: bo qua baseline: tep _acceptance/cham-bong-bo-sung-tin/probes/cham.sh co o cay dang kiem nhung chua co o merge-base 88712c4e53ba6d6259dc2c8ed5cd292b656ed65e — eval moi, chay tren code cu khong phan biet gi
- bash _acceptance/cham-bong-bo-sung-tin/probes/cham.sh AC-2: bo qua baseline: tep _acceptance/cham-bong-bo-sung-tin/probes/cham.sh co o cay dang kiem nhung chua co o merge-base 88712c4e53ba6d6259dc2c8ed5cd292b656ed65e — eval moi, chay tren code cu khong phan biet gi
- bash _acceptance/cham-bong-bo-sung-tin/probes/cham.sh AC-3: bo qua baseline: tep _acceptance/cham-bong-bo-sung-tin/probes/cham.sh co o cay dang kiem nhung chua co o merge-base 88712c4e53ba6d6259dc2c8ed5cd292b656ed65e — eval moi, chay tren code cu khong phan biet gi
- bash _acceptance/cham-bong-bo-sung-tin/probes/cham.sh AC-4: bo qua baseline: tep _acceptance/cham-bong-bo-sung-tin/probes/cham.sh co o cay dang kiem nhung chua co o merge-base 88712c4e53ba6d6259dc2c8ed5cd292b656ed65e — eval moi, chay tren code cu khong phan biet gi
- bash _acceptance/cham-bong-bo-sung-tin/probes/cham.sh AC-5: bo qua baseline: tep _acceptance/cham-bong-bo-sung-tin/probes/cham.sh co o cay dang kiem nhung chua co o merge-base 88712c4e53ba6d6259dc2c8ed5cd292b656ed65e — eval moi, chay tren code cu khong phan biet gi
- bash _acceptance/cham-bong-bo-sung-tin/probes/cham.sh AC-6: bo qua baseline: tep _acceptance/cham-bong-bo-sung-tin/probes/cham.sh co o cay dang kiem nhung chua co o merge-base 88712c4e53ba6d6259dc2c8ed5cd292b656ed65e — eval moi, chay tren code cu khong phan biet gi
- bash _acceptance/cham-bong-bo-sung-tin/probes/cham.sh AC-7: bo qua baseline: tep _acceptance/cham-bong-bo-sung-tin/probes/cham.sh co o cay dang kiem nhung chua co o merge-base 88712c4e53ba6d6259dc2c8ed5cd292b656ed65e — eval moi, chay tren code cu khong phan biet gi
- bash _acceptance/cham-bong-bo-sung-tin/probes/cham.sh AC-8: bo qua baseline: tep _acceptance/cham-bong-bo-sung-tin/probes/cham.sh co o cay dang kiem nhung chua co o merge-base 88712c4e53ba6d6259dc2c8ed5cd292b656ed65e — eval moi, chay tren code cu khong phan biet gi
- bash _acceptance/cham-bong-bo-sung-tin/probes/cham.sh AC-9: bo qua baseline: tep _acceptance/cham-bong-bo-sung-tin/probes/cham.sh co o cay dang kiem nhung chua co o merge-base 88712c4e53ba6d6259dc2c8ed5cd292b656ed65e — eval moi, chay tren code cu khong phan biet gi
- bash _acceptance/cham-bong-bo-sung-tin/probes/cham.sh AC-10: bo qua baseline: tep _acceptance/cham-bong-bo-sung-tin/probes/cham.sh co o cay dang kiem nhung chua co o merge-base 88712c4e53ba6d6259dc2c8ed5cd292b656ed65e — eval moi, chay tren code cu khong phan biet gi

## Variance

none — mọi eval nhiều lần chạy đều đồng nhất

## Iterations

Round 1: E1, E2, E3, E4, E6, E7, E8, E9, E10 failed — thước nạp bản sao đột biến thiếu tệp (cham-bong.dot-bien/prompt.js, ket-cuc.js), nhiều đột biến "thước vẫn xanh" hoặc đỏ không có thông điệp ghim, E7 và E9 hỏng assert trên mã thật. Returned to implementation.
