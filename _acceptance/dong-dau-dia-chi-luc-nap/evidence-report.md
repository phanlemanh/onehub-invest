---
schema_version: 2
feature_slug: dong-dau-dia-chi-luc-nap
verdict: PENDING-JUDGMENT
failed_evals: []
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: f35182138a7794f6a0546dbd024f0a602e2909cd
human_signoff:
---

# Evidence Report: dong-dau-dia-chi-luc-nap

Round 3. Nội dung thay trọn round cũ; lịch sử round nằm ở mục Iterations.

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | script | PASS |
| E1b | AC-1 | script | PASS |
| E2 | AC-2 | test | PASS |
| E3 | AC-3 | test | PASS |
| E3b | AC-3 | script | PASS |
| E4 | AC-3 | test | PASS |
| E5 | AC-4 | test | PASS |
| E6 | AC-5 | test | PASS |
| E7 | AC-6 | test | PASS |
| E8 | AC-6 | script | PASS |
| E9 | AC-7 | test | PASS |
| E10 | AC-8 | script | PASS |
| E11 | AC-9 | test | PASS |
| E12 | AC-10 | judgment | UNCERTAIN |
| E13 | AC-11 | script | PASS |

## Evidence

- eval: E1
  run_id: minted-dong-dau-dia-chi-luc-nap-E1-r3
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.tg2_phu_the
  verified_at: 2026-11-17T19:33:12Z
  output: |
    trong đó thẻ có ô dự án mà tin KHÔNG nhận dự án từ luật này (hoà giải mức tin, AC-8): 1

- eval: E1b
  run_id: minted-dong-dau-dia-chi-luc-nap-E1b-r3
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.tg2_nguong_moc
  verified_at: 2026-11-17T19:33:12Z
  output: |
    ngưỡng 90% áp cho cửa sổ all; /ops/data-flow mặc định hiện 7d

- eval: E2
  run_id: minted-dong-dau-dia-chi-luc-nap-E2-r3
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.tg2_itest
  verified_at: 2026-11-17T19:33:12Z
  output: |
    ℹ duration_ms 597517.002458

- eval: E4
  run_id: minted-dong-dau-dia-chi-luc-nap-E4-r3
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.tg2_itest
  verified_at: 2026-11-17T19:33:12Z
  output: |
    ℹ duration_ms 597517.002458 (cùng lệnh itest với E2)

- eval: E5
  run_id: minted-dong-dau-dia-chi-luc-nap-E5-r3
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.tg2_itest
  verified_at: 2026-11-17T19:33:12Z
  output: |
    ℹ duration_ms 597517.002458 (cùng lệnh itest với E2)

- eval: E6
  run_id: minted-dong-dau-dia-chi-luc-nap-E6-r3
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.tg2_itest
  verified_at: 2026-11-17T19:33:12Z
  output: |
    ℹ duration_ms 597517.002458 (cùng lệnh itest với E2)

- eval: E7
  run_id: minted-dong-dau-dia-chi-luc-nap-E7-r3
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.tg2_itest
  verified_at: 2026-11-17T19:33:12Z
  output: |
    ℹ duration_ms 597517.002458 (cùng lệnh itest với E2)

- eval: E9
  run_id: minted-dong-dau-dia-chi-luc-nap-E9-r3
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.tg2_itest
  verified_at: 2026-11-17T19:33:12Z
  output: |
    ℹ duration_ms 597517.002458 (cùng lệnh itest với E2)

- eval: E11
  run_id: minted-dong-dau-dia-chi-luc-nap-E11-r3
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.tg2_itest
  verified_at: 2026-11-17T19:33:12Z
  output: |
    ℹ duration_ms 597517.002458 (cùng lệnh itest với E2)

- eval: E3
  run_id: minted-dong-dau-dia-chi-luc-nap-E3-r3
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.tg2_pipeline
  verified_at: 2026-11-17T19:33:12Z
  output: |
    ℹ duration_ms 152.023917

- eval: E8
  run_id: minted-dong-dau-dia-chi-luc-nap-E8-r3
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.tg2_quet_doc
  verified_at: 2026-11-17T19:33:12Z
  output: |
    quét 4 tệp: 0 câu đọc thẳng stg_zalo_posts ngoài loadStgPosts

- eval: E3b
  run_id: minted-dong-dau-dia-chi-luc-nap-E3b-r3
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.tg2_chu_bai_that
  verified_at: 2026-11-17T19:33:12Z
  output: |
    nhận đúng dự án của chữ bài: 113/113

- eval: E10
  run_id: minted-dong-dau-dia-chi-luc-nap-E10-r3
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.tg2_khong_tut
  verified_at: 2026-11-17T19:33:12Z
  output: |
    bài mang >1 dự án sống: gốc 0 · nền 0 · sau 0 (sau phải 0)

- eval: E13
  run_id: minted-dong-dau-dia-chi-luc-nap-E13-r3
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.tg2_phu_kind
  verified_at: 2026-11-17T19:33:12Z
  output: |
    nguồn kind (bài, lượt sau): chữ bài 71733 · thẻ 1384 · bối cảnh nhóm 174

### Judgment

- eval: E12
  judged_by: judge-subagent (fresh context)
  verdict: UNCERTAIN
  rationale: Đề xuất của hội đồng là FAIL (hai phiếu FAIL, một phiếu UNCERTAIN). Mẫu v2 khai trước n=100, hạt giống, ngưỡng cận trên Wilson ≤ 10%, nhưng mục «Kết quả» còn «CHỜ MẠNH DUYỆT»: chưa có nhãn người, chưa có cận Wilson, chưa có câu kết luận. Người quyết ở Cổng 2.
  panel: domain-correctness, operational-feasibility, spec-alignment
  votes:
    - domain-correctness: FAIL — Mẫu v2 khai trước n=100, hạt giống và ngưỡng cận trên Wilson ≤ 10% đúng hợp đồng. Mục «Kết quả» lại ghi «CHỜ MẠNH DUYỆT»: chưa có nhãn người, chưa in tỉ lệ hay cận Wilson nào, và chưa có câu kết luận bối cảnh nhóm đủ hay chưa đủ. Nháp 0/100 của trợ lý không phải nhãn người. Hợp đồng coi thiếu cận trên là chưa đạt.
    - operational-feasibility: UNCERTAIN — Tệp mẫu v2 ghi mục «Kết quả» là «CHỜ MẠNH DUYỆT», nên chưa có nhãn người nào và không có cận trên Wilson nào để so với ngưỡng 10% (câu 1 không trả lời được). Cỡ mẫu n=100 đã khai trước khi rút, ở commit f840af82, và khớp mức đề xuất của hợp đồng (câu 2 đạt). Nhưng tệp chưa có câu kết luận «đủ hay chưa đủ làm mặc định» (câu 3). Nguồn của số có ghi (hạt giống, lệnh, 100 mã), nhưng chưa có số kết quả nào để truy nguồn (câu 4). Nháp 0/100 của trợ lý không phải nhãn người, và chính tệp cũng khai vậy.
    - spec-alignment: FAIL — Ngưỡng là cận trên Wilson 95% ≤ 10% (contract.md dòng 138 và mẫu dòng 16). Cỡ mẫu n = 100 được khai trước, cùng seed và lệnh rút, ở commit f840af82. Mục «Kết quả» lại ghi «CHỜ MẠNH DUYỆT»: chưa có nhãn người nào. Tệp không có cận trên Wilson đo được, không có câu kết luận «đủ» hay «chưa đủ», và nháp trợ lý 0/100 được ghi rõ là chưa phải nhãn người. Cũng chưa có số nào để kiểm nguồn đọc được ngay trong tệp. Vì cận trên không được chứng minh ≤ ngưỡng nên AC-10 CHƯA ĐẠT.
  required_evidence:
    - (domain-correctness) Tệp nhãn Mạnh đã duyệt đủ 100 dòng (research-local/, ngoài kho) cùng kết quả lệnh `node pipeline/scripts/mau-bai-lac-du-an.mjs --tinh-duyet <tệp nhãn> --seed tg2-ac10-v2-20261117 --mau _acceptance/dong-dau-dia-chi-luc-nap/evidence/mau-bai-lac-du-an-v2.md`, thoát 0 và in tỉ lệ, cận dưới, cận trên Wilson, cỡ mẫu thật. Kết quả này phải được ghi vào mục «Kết quả» của mau-bai-lac-du-an-v2.md.
    - (domain-correctness) Trong mau-bai-lac-du-an-v2.md, một câu kết luận duy nhất «bối cảnh nhóm đủ / chưa đủ làm mặc định», khớp với việc cận trên có ≤ 10% hay không.
    - (domain-correctness) Trong mau-bai-lac-du-an-v2.md, cho dòng `02e084bc…` («Mã căn: M2», nhóm Ocean Park 1), nhãn người cuối cùng (lạc hay không lạc) và người duyệt kèm giờ, vì dòng này có thể làm số bài lạc đổi.
    - (operational-feasibility) Tệp nhãn đã được Mạnh duyệt đủ 100 dòng, và đầu ra lệnh `node pipeline/scripts/mau-bai-lac-du-an.mjs --tinh-duyet <tệp nhãn> --seed tg2-ac10-v2-20261117 --mau _acceptance/dong-dau-dia-chi-luc-nap/evidence/mau-bai-lac-du-an-v2.md` (thoát 0) dán vào mục «Kết quả» của mau-bai-lac-du-an-v2.md. Đầu ra phải in số bài lạc, tỉ lệ và cả hai cận Wilson, trong đó cận trên ≤ 10%.
    - (operational-feasibility) Một câu kết luận duy nhất trong mục «Kết quả» của mau-bai-lac-du-an-v2.md nói bối cảnh nhóm đủ hay chưa đủ làm mặc định, và khớp với kết quả so cận trên với ngưỡng 10%.
    - (operational-feasibility) Dòng trong mục «Kết quả» của mau-bai-lac-du-an-v2.md ghi tên người duyệt, giờ duyệt và số dòng đã bấm là 100/100, để người ký truy được mỗi số về nhãn người mà không mở DB.
    - (spec-alignment) Tệp nhãn người đã duyệt đủ 100 dòng cho mẫu v2. Bản tóm tắt phải được chép vào mau-bai-lac-du-an-v2.md, mục «Kết quả». Lấy bằng cách Mạnh duyệt tại research-local/duyet-nhan-ac10-v2.html, rồi chạy lệnh --tinh-duyet đã khai ở dòng 160 của tệp mẫu.
    - (spec-alignment) Trong mau-bai-lac-du-an-v2.md, mục «Kết quả» ghi số bài lạc theo nhãn người (k trên 100) và cận trên Wilson 95% tính từ k, kèm kết luận có hay không ≤ 10%. Kết quả đó phải được commit sau khi Mạnh duyệt.
    - (spec-alignment) Đúng một câu kết luận trong tệp ấy: bối cảnh nhóm đủ hay chưa đủ làm mặc định. Câu này phải khớp với kết quả so cận trên với ngưỡng.
  human_override:  # chi nguoi ghi

### Lệnh suite (hồi quy)

- cmd: node scripts/suite-neu-doi.mjs agent -- 'cd agent && npm test'
  run_id: minted-dong-dau-dia-chi-luc-nap-SUITE-node_scripts_suite_neu_doi_mjs_agent_cd_-r3
  exit_code: 0
  verified_at: 2026-11-17T19:33:12Z

- cmd: node scripts/suite-neu-doi.mjs app -- 'cd app && npx tsc --noEmit && npm run lint'
  run_id: minted-dong-dau-dia-chi-luc-nap-SUITE-lint-r3
  exit_code: 0
  verified_at: 2026-11-17T19:33:12Z

- cmd: node scripts/suite-neu-doi.mjs app_ui -- 'cd app && npm test'
  run_id: minted-dong-dau-dia-chi-luc-nap-SUITE-node_scripts_suite_neu_doi_mjs_app_ui_cd-r3
  exit_code: 0
  verified_at: 2026-11-17T19:33:12Z

- cmd: node scripts/suite-neu-doi.mjs pipeline_a -- 'cd pipeline && npm run test:a'
  run_id: minted-dong-dau-dia-chi-luc-nap-SUITE-test_a-r3
  exit_code: 0
  verified_at: 2026-11-17T19:33:12Z

- cmd: node scripts/suite-neu-doi.mjs pipeline_b -- 'cd pipeline && npm run test:b'
  run_id: minted-dong-dau-dia-chi-luc-nap-SUITE-test_b-r3
  exit_code: 0
  verified_at: 2026-11-17T19:33:12Z

- cmd: node scripts/suite-neu-doi.mjs ui_lint_rules -- 'cd app && npm run test:lint-rules'
  run_id: minted-dong-dau-dia-chi-luc-nap-SUITE-test_lint_rules-r3
  exit_code: 0
  verified_at: 2026-11-17T19:33:12Z

- cmd: node scripts/suite-neu-doi.mjs portal_static -- 'node scripts/check-portal-compliance.mjs'
  run_id: minted-dong-dau-dia-chi-luc-nap-SUITE-node_scripts_suite_neu_doi_mjs_portal_st-r3
  exit_code: 0
  verified_at: 2026-11-17T19:33:12Z

## Known limits

## Ngoài hợp đồng

## Analyst

carried tu round 2 — baseline khong do lai round nay.

Baseline không đo lại vì evals.yaml không đổi từ lần baseline cuối (round 2); mọi khối eval ghi baseline n-a.

none — không có eval nào được xác định là không-phân-biệt. Hai lệnh suite ui_lint_rules và portal_static bị bỏ qua vì không đổi vùng của chúng; các lệnh suite còn lại là regression-guard bình thường.

## Variance

none — mọi eval chạy một lần, đều xác định, không có phương sai.

## Iterations

Round 1, 2: lịch sử nằm trong run-log.jsonl; baseline lần cuối đo ở round 2.
Round 3: mọi eval máy xanh; E12 (AC-10) còn chờ nhãn người của Mạnh và câu kết luận, hội đồng đề xuất FAIL, để human_override trống cho người quyết ở Cổng 2. Verdict PENDING-JUDGMENT.
