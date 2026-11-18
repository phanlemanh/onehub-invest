---
schema_version: 2
feature_slug: dong-dau-dia-chi-luc-nap
verdict: PASS
failed_evals: []
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: 9936bb9b500d03734409ed13ed0315798473dc28
human_signoff: Mạnh 2026-11-18
---

# Evidence Report: dong-dau-dia-chi-luc-nap

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | script | PASS |
| E1b | AC-1 | script | PASS |
| E2 | AC-2 | test | PASS |
| E3 | AC-3 | test | PASS |
| E4 | AC-3 | test | PASS |
| E5 | AC-4 | test | PASS |
| E6 | AC-5 | test | PASS |
| E7 | AC-6 | test | PASS |
| E8 | AC-6 | script | PASS |
| E9 | AC-7 | test | PASS |
| E3b | AC-3 | script | PASS |
| E10 | AC-8 | script | PASS |
| E11 | AC-9 | test | PASS |
| E12 | AC-10 | judgment | PASS |
| E13 | AC-11 | script | PASS |

Round 4. E3 được mang từ round 3 (carry-forward), các eval còn lại chạy lại ở round này.

## Judge

- eval: E12
  judged_by: judge panel (domain-correctness, operational-feasibility, spec-alignment), đề xuất PASS
  verdict: PASS
  rationale: Cận trên Wilson 95% là 3,70% (0/100), ≤ ngưỡng 10% khai ở «Đường đo». Cả ba judge đồng ý.
  votes:
    - domain-correctness: PASS — (1) Cận trên Wilson 95% là 3,70% (0/100), và 5,45% theo chữ khai trước (1/100). Cả hai đều ≤ ngưỡng 10% khai ở mục «Đường đo» và ở tệp mẫu. (2) Cỡ mẫu thật 100 bằng mức tối thiểu 100. Cỡ mẫu và hạt giống được khai trước khi rút và gắn nhãn (commit `f840af82`, rút lúc 16:33:45Z), kèm 100 mã bài. (3) Có đúng một câu kết luận, «bối cảnh nhóm ĐỦ làm mặc định», và nó khớp với kết quả so ngưỡng. (4) Mỗi số đều có nguồn ngay trong tệp: tệp nhãn `nhan-ac10-v2.json` kèm sha256, lệnh tính, hạt giống, bảng ba cách đếm và phần «Giới hạn đã biết». Sửa định nghĩa sau khi rút (dòng #32) được khai rõ và kết luận không đổi theo cả hai cách đếm.
    - operational-feasibility: PASS — (1) Cận trên Wilson 95% là 3,70% (0/100), nhỏ hơn ngưỡng 10% khai ở «Đường đo». Ở cách đếm theo chữ khai trước (1/100) cận trên là 5,45%, cũng ≤ 10%. (2) Cỡ mẫu thật n=100 bằng mức tối thiểu của hợp đồng, và được khai trước khi rút và gắn nhãn (commit f840af82, rút lúc 16:33:45Z). (3) Có đúng một câu kết luận «bối cảnh nhóm ĐỦ làm mặc định», khớp với kết quả ở (1). (4) Mỗi số đều ghi nguồn ngay trong tệp: tệp nhãn `nhan-ac10-v2.json` kèm sha256, lệnh tính, người duyệt và giờ duyệt, nên không cần mở DB.
    - spec-alignment: PASS — (1) Cận trên Wilson 95% là 3,70% (0/100), nhỏ hơn ngưỡng 10% của mục «Đường đo». Hai cách đếm còn lại cũng đạt: 5,45% khi tính theo chữ khai trước, 5,45% trên mẫu v1. (2) n thật là 100, bằng cỡ mẫu tối thiểu, và được khai trước khi rút và gắn nhãn (commit f840af82, rút lúc 16:33:45Z). (3) Có đúng một câu «Kết luận: bối cảnh nhóm ĐỦ làm mặc định», khớp với 3,70% ≤ 10%. (4) Mỗi số có nguồn ngay trong tệp: tệp nhãn `nhan-ac10-v2.json` kèm sha256, lệnh tính, và 100 mã bài. Việc mở rộng hệ sang OP1 sau khi rút mẫu được khai rõ và không đổi kết luận.
  human_override:  # chi nguoi ghi

## Evidence

- eval: E1
  run_id: minted-dong-dau-dia-chi-luc-nap-E1-r4
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.tg2_phu_the
  verified_at: 2026-11-17T23:38:18Z
  output: |
    trong đó thẻ có ô dự án mà tin KHÔNG nhận dự án từ luật này (hoà giải mức tin, AC-8): 1

- eval: E1b
  run_id: minted-dong-dau-dia-chi-luc-nap-E1b-r4
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.tg2_nguong_moc
  verified_at: 2026-11-17T23:38:18Z
  output: |
    ngưỡng 90% áp cho cửa sổ all; /ops/data-flow mặc định hiện 7d

- eval: E2
  run_id: minted-dong-dau-dia-chi-luc-nap-E2-r4
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.tg2_itest
  verified_at: 2026-11-17T23:38:18Z
  output: |
    lệnh chung của E2, E4, E5, E6, E7, E9, E11: dia-chi-the-nhom.itest.mjs + dong-dau-dia-chi.itest.mjs
    duration_ms 834264.333542

- eval: E3
  run_id: minted-dong-dau-dia-chi-luc-nap-E3-r3
  exit_code: 0
  carried_from_round: 3
  baseline: n-a
  verifier: config:executors.test.tg2_pipeline
  verified_at: 2026-11-17T19:33:12Z
  output: |
    carry-forward tu round 3 — delta khong cham paths cua eval

- eval: E4
  run_id: minted-dong-dau-dia-chi-luc-nap-E4-r4
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.tg2_itest
  verified_at: 2026-11-17T23:38:18Z
  output: |
    chung lệnh với E2 (cùng một lượt chạy)

- eval: E5
  run_id: minted-dong-dau-dia-chi-luc-nap-E5-r4
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.tg2_itest
  verified_at: 2026-11-17T23:38:18Z
  output: |
    chung lệnh với E2 (cùng một lượt chạy)

- eval: E6
  run_id: minted-dong-dau-dia-chi-luc-nap-E6-r4
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.tg2_itest
  verified_at: 2026-11-17T23:38:18Z
  output: |
    chung lệnh với E2 (cùng một lượt chạy)

- eval: E7
  run_id: minted-dong-dau-dia-chi-luc-nap-E7-r4
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.tg2_itest
  verified_at: 2026-11-17T23:38:18Z
  output: |
    chung lệnh với E2 (cùng một lượt chạy)

- eval: E8
  run_id: minted-dong-dau-dia-chi-luc-nap-E8-r4
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.tg2_quet_doc
  verified_at: 2026-11-17T23:38:18Z
  output: |
    quét 4 tệp: 0 câu đọc thẳng stg_zalo_posts ngoài loadStgPosts

- eval: E9
  run_id: minted-dong-dau-dia-chi-luc-nap-E9-r4
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.tg2_itest
  verified_at: 2026-11-17T23:38:18Z
  output: |
    chung lệnh với E2 (cùng một lượt chạy)

- eval: E3b
  run_id: minted-dong-dau-dia-chi-luc-nap-E3b-r4
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.tg2_chu_bai_that
  verified_at: 2026-11-17T23:38:18Z
  output: |
    nhận đúng dự án của chữ bài: 117/117

- eval: E10
  run_id: minted-dong-dau-dia-chi-luc-nap-E10-r4
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.tg2_khong_tut
  verified_at: 2026-11-17T23:38:18Z
  output: |
    bài mang >1 dự án sống: gốc 0 · nền 0 · sau 0 (sau phải 0)

- eval: E11
  run_id: minted-dong-dau-dia-chi-luc-nap-E11-r4
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.tg2_itest
  verified_at: 2026-11-17T23:38:18Z
  output: |
    chung lệnh với E2 (cùng một lượt chạy)

- eval: E13
  run_id: minted-dong-dau-dia-chi-luc-nap-E13-r4
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.tg2_phu_kind
  verified_at: 2026-11-17T23:38:18Z
  output: |
    nguồn kind (bài, lượt sau): chữ bài 71849 · thẻ 1384 · bối cảnh nhóm 174

### Lệnh suite (hồi quy)

- cmd: node scripts/suite-neu-doi.mjs agent -- 'cd agent && npm test'
  run_id: minted-dong-dau-dia-chi-luc-nap-SUITE-node_scripts_suite_neu_doi_mjs_agent_cd_-r4
  exit_code: 0
  verified_at: 2026-11-17T23:38:18Z

- cmd: node scripts/suite-neu-doi.mjs app -- 'cd app && npx tsc --noEmit && npm run lint'
  run_id: minted-dong-dau-dia-chi-luc-nap-SUITE-lint-r4
  exit_code: 0
  verified_at: 2026-11-17T23:38:18Z

- cmd: node scripts/suite-neu-doi.mjs app_ui -- 'cd app && npm test'
  run_id: minted-dong-dau-dia-chi-luc-nap-SUITE-node_scripts_suite_neu_doi_mjs_app_ui_cd-r4
  exit_code: 0
  verified_at: 2026-11-17T23:38:18Z

- cmd: node scripts/suite-neu-doi.mjs pipeline_a -- 'cd pipeline && npm run test:a'
  run_id: minted-dong-dau-dia-chi-luc-nap-SUITE-test_a-r4
  exit_code: 0
  verified_at: 2026-11-17T23:38:18Z

- cmd: node scripts/suite-neu-doi.mjs pipeline_b -- 'cd pipeline && npm run test:b'
  run_id: minted-dong-dau-dia-chi-luc-nap-SUITE-test_b-r4
  exit_code: 0
  verified_at: 2026-11-17T23:38:18Z

- cmd: node scripts/suite-neu-doi.mjs ui_lint_rules -- 'cd app && npm run test:lint-rules'
  run_id: minted-dong-dau-dia-chi-luc-nap-SUITE-test_lint_rules-r4
  exit_code: 0
  verified_at: 2026-11-17T23:38:18Z

- cmd: node scripts/suite-neu-doi.mjs portal_static -- 'node scripts/check-portal-compliance.mjs'
  run_id: minted-dong-dau-dia-chi-luc-nap-SUITE-node_scripts_suite_neu_doi_mjs_portal_st-r4
  exit_code: 0
  verified_at: 2026-11-17T23:38:18Z

## Known limits

## Ngoài hợp đồng

## Analyst

carried tu round 2 — baseline khong do lai round nay

Không có eval nào được liệt kê là không-phân-biệt. Baseline round này không đo lại, mọi eval ghi n-a.

## Variance

none — every multi-run eval is uniform

## Iterations

Round 1: xem lịch sử round cũ trong run-log.
Round 2: baseline được đo lần cuối ở round này.
Round 3: E3 chạy và đạt; được mang sang round 4.
Round 4: mọi eval đạt, E12 đề xuất PASS với cận trên Wilson 3,70% (0/100); chờ người ký ở Cổng 2.
