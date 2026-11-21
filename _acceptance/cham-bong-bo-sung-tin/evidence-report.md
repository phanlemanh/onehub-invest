---
schema_version: 2
feature_slug: cham-bong-bo-sung-tin
verdict: PASS
failed_evals: []
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: eec8233a3e53bacd500a48af5062a5555e6fa027
human_signoff:
---

# Evidence Report: cham-bong-bo-sung-tin

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
| E9 | AC-9 | script | PASS |
| E10 | AC-10 | script | PASS |

không chạy theo hồ sơ: E11

## Evidence

- eval: E1
  run_id: minted-cham-bong-bo-sung-tin-E1-r2
  exit_code: 0
  baseline: n-a
  verifier: _acceptance/cham-bong-bo-sung-tin/probes/cham.sh
  verified_at: 2026-11-21T10:35:51Z
  output: |
    đỏ đúng AC-1 «gọi một lần mỗi đề xuất»: thẻ c06: 6 lời gọi, mong 2

- eval: E2
  run_id: minted-cham-bong-bo-sung-tin-E2-r2
  exit_code: 0
  baseline: n-a
  verifier: _acceptance/cham-bong-bo-sung-tin/probes/cham.sh
  verified_at: 2026-11-21T10:35:51Z
  output: |
    đỏ đúng AC-2 «dùng chữ cắt 300 ký tự»: khối bài không nguyên văn

- eval: E3
  run_id: minted-cham-bong-bo-sung-tin-E3-r2
  exit_code: 0
  baseline: n-a
  verifier: _acceptance/cham-bong-bo-sung-tin/probes/cham.sh
  verified_at: 2026-11-21T10:35:51Z
  output: |
    đỏ đúng AC-3 «bỏ kiểm trích»: ca trích không có trong bài → rỗng

- eval: E4
  run_id: minted-cham-bong-bo-sung-tin-E4-r2
  exit_code: 0
  baseline: n-a
  verifier: _acceptance/cham-bong-bo-sung-tin/probes/cham.sh
  verified_at: 2026-11-21T10:35:51Z
  output: |
    đỏ đúng AC-4 «bỏ lech_tren_the khỏi ca biên»: lech=true o_da_co=false: ca biên false

- eval: E5
  run_id: minted-cham-bong-bo-sung-tin-E5-r2
  exit_code: 0
  baseline: n-a
  verifier: _acceptance/cham-bong-bo-sung-tin/probes/cham.sh
  verified_at: 2026-11-21T10:35:51Z
  output: |
    đỏ đúng AC-5 «chế độ áp gọi apply_enrichment»: lượt áp trọn: bảng đổi enrichment_proposals, field_assertions, sale_offer_records, md5:sale_offers, md5:enrichment_proposals, md5:field_assertions

- eval: E6
  run_id: minted-cham-bong-bo-sung-tin-E6-r2
  exit_code: 0
  baseline: n-a
  verifier: _acceptance/cham-bong-bo-sung-tin/probes/cham.sh
  verified_at: 2026-11-21T10:35:51Z
  output: |
    đỏ đúng AC-6 «bỏ ghi sổ khi lỗi»: sổ tệp 18 dòng, mong 20

- eval: E7
  run_id: minted-cham-bong-bo-sung-tin-E7-r2
  exit_code: 0
  baseline: n-a
  verifier: _acceptance/cham-bong-bo-sung-tin/probes/cham.sh
  verified_at: 2026-11-21T10:35:51Z
  output: |
    đỏ đúng AC-7 «lưu kết quả lỗi vào khoá»: (b) lần hai gọi 0, mong đúng 2

- eval: E8
  run_id: minted-cham-bong-bo-sung-tin-E8-r2
  exit_code: 0
  baseline: n-a
  verifier: _acceptance/cham-bong-bo-sung-tin/probes/cham.sh
  verified_at: 2026-11-21T10:35:51Z
  output: |
    đỏ đúng AC-8 «kiểm trần sau khi gọi»: có lời gọi thứ 8, mong dừng sau lời gọi thứ 7

- eval: E9
  run_id: minted-cham-bong-bo-sung-tin-E9-r2
  exit_code: 0
  baseline: n-a
  verifier: _acceptance/cham-bong-bo-sung-tin/probes/cham.sh
  verified_at: 2026-11-21T10:35:51Z
  output: |
    đỏ đúng AC-9 «gộp lỗi vào bo_trong»: × bo_trong × e2_llm: 1, mong 0

- eval: E10
  run_id: minted-cham-bong-bo-sung-tin-E10-r2
  exit_code: 0
  baseline: n-a
  verifier: _acceptance/cham-bong-bo-sung-tin/probes/cham.sh
  verified_at: 2026-11-21T10:35:51Z
  output: |
    đỏ đúng AC-10 «lấy cả thẻ có đề xuất»: tổng lệch: 9, mong 7

### Lệnh suite (hồi quy)

- cmd: node scripts/suite-neu-doi.mjs agent -- 'cd agent && npm test'
  run_id: minted-cham-bong-bo-sung-tin-SUITE-node_scripts_suite_neu_doi_mjs_agent_cd_-r2
  exit_code: 0
  verified_at: 2026-11-21T10:35:51Z

- cmd: node scripts/suite-neu-doi.mjs app -- 'cd app && npx tsc --noEmit && npm run lint'
  run_id: minted-cham-bong-bo-sung-tin-SUITE-lint-r2
  exit_code: 0
  verified_at: 2026-11-21T10:35:51Z

- cmd: node scripts/suite-neu-doi.mjs app_ui -- 'cd app && npm test'
  run_id: minted-cham-bong-bo-sung-tin-SUITE-node_scripts_suite_neu_doi_mjs_app_ui_cd-r2
  exit_code: 0
  verified_at: 2026-11-21T10:35:51Z

- cmd: node scripts/suite-neu-doi.mjs pipeline_a -- 'cd pipeline && npm run test:a'
  run_id: minted-cham-bong-bo-sung-tin-SUITE-test_a-r2
  exit_code: 0
  verified_at: 2026-11-21T10:35:51Z

- cmd: node scripts/suite-neu-doi.mjs pipeline_b -- 'cd pipeline && npm run test:b'
  run_id: minted-cham-bong-bo-sung-tin-SUITE-test_b-r2
  exit_code: 0
  verified_at: 2026-11-21T10:35:51Z

- cmd: node scripts/suite-neu-doi.mjs ui_lint_rules -- 'cd app && npm run test:lint-rules'
  run_id: minted-cham-bong-bo-sung-tin-SUITE-test_lint_rules-r2
  exit_code: 0
  verified_at: 2026-11-21T10:35:51Z

- cmd: node scripts/suite-neu-doi.mjs portal_static -- 'node scripts/check-portal-compliance.mjs'
  run_id: minted-cham-bong-bo-sung-tin-SUITE-node_scripts_suite_neu_doi_mjs_portal_st-r2
  exit_code: 0
  verified_at: 2026-11-21T10:35:51Z

## Known limits

## Ngoài hợp đồng

## Analyst

carried tu round 1 — baseline khong do lai round nay

none — khong eval nao khong-phan-biet duoc liet ke; lenh suite xanh ca hai phia la regression-guard binh thuong.

## Variance

none — every multi-run eval is uniform

## Iterations

Round 1: lich su round 1 nam trong run-log.jsonl va review-findings.md cua vong truoc; cac findings da biet duoc mang sang review-findings.md.
Round 2: E1-E10 deu pass tren verified_commit; E11 khong chay theo ho so; khong co judgment item, khong co eval ngau nhien.
