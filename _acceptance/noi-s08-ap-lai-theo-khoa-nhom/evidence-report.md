---
schema_version: 2
feature_slug: noi-s08-ap-lai-theo-khoa-nhom
verdict: PASS
failed_evals: []
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: db2cedd144a9a2552affab7b3d0867223f087aa4
human_signoff:
---

# Evidence Report: noi-s08-ap-lai-theo-khoa-nhom

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | script | PASS |
| E2 | AC-2 | script | PASS |
| E3 | AC-3 | script | PASS |
| E4 | AC-4 | script | PASS |

## Evidence

- eval: E1
  run_id: minted-noi-s08-ap-lai-theo-khoa-nhom-E1-r1
  exit_code: 0
  baseline: green
  verifier: config:executors.script.ns8_lop
  verified_at: 2026-11-28T11:16:47Z
  output: |
    cmd: node --test pipeline/scripts/noi-du-an-s08-lop.test.mjs
    ℹ duration_ms 129.622125
    __EXIT=0

- eval: E2
  run_id: minted-noi-s08-ap-lai-theo-khoa-nhom-E2-r1
  exit_code: 0
  baseline: red
  verifier: config:executors.script.ns65_ap
  verified_at: 2026-11-28T11:16:47Z
  output: |
    cmd: node --test --test-concurrency=1 --test-name-pattern='^NS8-6 ' pipeline/scripts/noi-du-an-s08-luat.itest.mjs
    ℹ duration_ms 6186.735542
    __EXIT=0

- eval: E3
  run_id: minted-noi-s08-ap-lai-theo-khoa-nhom-E3-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.ns65_that
  verified_at: 2026-11-28T11:16:47Z
  output: |
    cmd: bash db/db-thu.sh oneinvest_suite_da65_doc --chay node _acceptance/noi-s08-ap-lai-theo-khoa-nhom/probes/bat-bien-that.mjs
    PASS ba bất biến: không đúc lại nhóm đã có nút, dự án nhóm một nút trỏ nút ấy, nút mới hứa = khoá nhóm chưa có nút
    __EXIT=0

- eval: E4
  run_id: minted-noi-s08-ap-lai-theo-khoa-nhom-E4-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.ns65_ban_chep
  verified_at: 2026-11-28T11:16:47Z
  output: |
    cmd: bash db/db-thu.sh oneinvest_suite_da65 --chay node _acceptance/noi-s08-ap-lai-theo-khoa-nhom/probes/ap-lan-hai-ban-chep.mjs
    PASS áp sau cùng khoá nhóm không đúc nút thứ hai; số nút S08 chỉ tăng theo khoá nhóm thật sự mới; áp lần hai không đổi
    __EXIT=0

### Lệnh suite (hồi quy)

- cmd: node scripts/suite-neu-doi.mjs agent -- 'cd agent && npm test'
  run_id: minted-noi-s08-ap-lai-theo-khoa-nhom-SUITE-node_scripts_suite_neu_doi_mjs_agent_cd_-r1
  exit_code: 0
  verified_at: 2026-11-28T11:16:47Z

- cmd: node scripts/suite-neu-doi.mjs app -- 'cd app && npx tsc --noEmit && npm run lint'
  run_id: minted-noi-s08-ap-lai-theo-khoa-nhom-SUITE-lint-r1
  exit_code: 0
  verified_at: 2026-11-28T11:16:47Z

- cmd: node scripts/suite-neu-doi.mjs app_ui -- 'cd app && npm test'
  run_id: minted-noi-s08-ap-lai-theo-khoa-nhom-SUITE-node_scripts_suite_neu_doi_mjs_app_ui_cd-r1
  exit_code: 0
  verified_at: 2026-11-28T11:16:47Z

- cmd: node scripts/suite-neu-doi.mjs pipeline_a -- 'cd pipeline && npm run test:a'
  run_id: minted-noi-s08-ap-lai-theo-khoa-nhom-SUITE-test_a-r1
  exit_code: 0
  verified_at: 2026-11-28T11:16:47Z

- cmd: node scripts/suite-neu-doi.mjs pipeline_b -- 'cd pipeline && npm run test:b'
  run_id: minted-noi-s08-ap-lai-theo-khoa-nhom-SUITE-test_b-r1
  exit_code: 0
  verified_at: 2026-11-28T11:16:47Z

- cmd: node scripts/suite-neu-doi.mjs ui_lint_rules -- 'cd app && npm run test:lint-rules'
  run_id: minted-noi-s08-ap-lai-theo-khoa-nhom-SUITE-test_lint_rules-r1
  exit_code: 0
  verified_at: 2026-11-28T11:16:47Z

- cmd: node scripts/suite-neu-doi.mjs portal_static -- 'node scripts/check-portal-compliance.mjs'
  run_id: minted-noi-s08-ap-lai-theo-khoa-nhom-SUITE-node_scripts_suite_neu_doi_mjs_portal_st-r1
  exit_code: 0
  verified_at: 2026-11-28T11:16:47Z

Ghi chú phiên chấm M5 (sau lượt, không đổi verdict của kit): vòng 1 trên db2cedd144a9a2552affab7b3d0867223f087aa4 bằng kit 2.37.0; soát db2cedd14-20261128T180432 (pipeline, agent xanh; app chỉ đỏ QV-AC-5). Mọi eval E1–E4 PASS, mọi suite trong vòng thoát 0. E3 bọc db-thu trong args để đọc bản chép. E4 chạy lại lấy số: nút S08 146 → 146 → 146, dự án giả về nút cũ, áp lần hai khongDoi; chiều từ chối DB không phải của lượt thoát 2 (kiểm trên DB postgres, không chạy trên oneinvest). pipeline_that bỏ khỏi vòng, chạy NGOÀI vòng (CHUNG điểm 16): 37/37, bỏ qua có tên ON22-AC-10 (HT33) — evidence/m5-ngoai-vong-r1.txt. Không finding trong hợp đồng; ba finding ngoài hợp đồng đề xuất Known limits. Kit báo runLogWriteFailed — run-log do phiên chấm ghi.

## Known limits

## Ngoài hợp đồng

## Analyst

Eval không phân biệt (xanh cả trên mã HEAD lẫn mã gốc):
- E1: lệnh `node --test pipeline/scripts/noi-du-an-s08-lop.test.mjs` pass cả hai phía, cần viết lại để assert hành vi mới hoặc xác nhận là regression-guard có chủ ý.

Baseline khong do:
- bash db/db-thu.sh oneinvest_suite_da65_doc --chay node _acceptance/noi-s08-ap-lai-theo-khoa-nhom/probes/bat-bien-that.mjs: bo qua baseline: tep _acceptance/noi-s08-ap-lai-theo-khoa-nhom/probes/bat-bien-that.mjs co o cay dang kiem nhung chua co o merge-base 64f487cc7f64c9806e9128dde94eee742f5519f1 — eval moi, chay tren code cu khong phan biet gi
- bash db/db-thu.sh oneinvest_suite_da65 --chay node _acceptance/noi-s08-ap-lai-theo-khoa-nhom/probes/ap-lan-hai-ban-chep.mjs: bo qua baseline: tep _acceptance/noi-s08-ap-lai-theo-khoa-nhom/probes/ap-lan-hai-ban-chep.mjs co o cay dang kiem nhung chua co o merge-base 64f487cc7f64c9806e9128dde94eee742f5519f1 — eval moi, chay tren code cu khong phan biet gi

## Variance

none — every multi-run eval is uniform

## Iterations

Round 1: E1, E2, E3, E4 đều đạt; không eval nào hỏng.
