---
schema_version: 2
feature_slug: dong-dau-dia-chi-luc-nap
verdict: REJECT
failed_evals: []
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: b80a64141a44c1d0502268aee899d6db275ebc65
human_signoff:
---

# Evidence Report: dong-dau-dia-chi-luc-nap

Round 2. Nội dung thay trọn round cũ; lịch sử round nằm ở mục Iterations.

Lý do REJECT: lệnh suite `app_ui` (không gắn eval nào) thoát khác 0 ở round này; chi tiết ở mục «Lệnh suite (hồi quy)». Mọi eval máy gắn AC (E1, E1b, E2, E3, E3b, E4, E5, E6, E7, E8, E9, E10, E11, E13) đều đạt; E12 là judgment còn chờ người.

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
  run_id: minted-dong-dau-dia-chi-luc-nap-E1-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.tg2_phu_the
  verified_at: 2026-11-17T16:48:36Z
  output: |
    trong đó thẻ có ô dự án mà tin KHÔNG nhận dự án từ luật này (hoà giải mức tin, AC-8): 1

- eval: E1b
  run_id: minted-dong-dau-dia-chi-luc-nap-E1b-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.tg2_nguong_moc
  verified_at: 2026-11-17T16:48:36Z
  output: |
    ngưỡng 90% áp cho cửa sổ all; /ops/data-flow mặc định hiện 7d

- eval: E2
  run_id: minted-dong-dau-dia-chi-luc-nap-E2-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.tg2_itest
  verified_at: 2026-11-17T16:48:36Z
  output: |
    ℹ duration_ms 415635.927125

- eval: E3
  run_id: minted-dong-dau-dia-chi-luc-nap-E3-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.tg2_pipeline
  verified_at: 2026-11-17T16:48:36Z
  output: |
    ℹ duration_ms 137.304625

- eval: E3b
  run_id: minted-dong-dau-dia-chi-luc-nap-E3b-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.tg2_chu_bai_that
  verified_at: 2026-11-17T16:48:36Z
  output: |
    nhận đúng dự án của chữ bài: 103/103

- eval: E4
  run_id: minted-dong-dau-dia-chi-luc-nap-E4-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.tg2_itest
  verified_at: 2026-11-17T16:48:36Z
  output: |
    ℹ duration_ms 415635.927125

- eval: E5
  run_id: minted-dong-dau-dia-chi-luc-nap-E5-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.tg2_itest
  verified_at: 2026-11-17T16:48:36Z
  output: |
    ℹ duration_ms 415635.927125

- eval: E6
  run_id: minted-dong-dau-dia-chi-luc-nap-E6-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.tg2_itest
  verified_at: 2026-11-17T16:48:36Z
  output: |
    ℹ duration_ms 415635.927125

- eval: E7
  run_id: minted-dong-dau-dia-chi-luc-nap-E7-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.tg2_itest
  verified_at: 2026-11-17T16:48:36Z
  output: |
    ℹ duration_ms 415635.927125

- eval: E8
  run_id: minted-dong-dau-dia-chi-luc-nap-E8-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.tg2_quet_doc
  verified_at: 2026-11-17T16:48:36Z
  output: |
    quét 4 tệp: 0 câu đọc thẳng stg_zalo_posts ngoài loadStgPosts

- eval: E9
  run_id: minted-dong-dau-dia-chi-luc-nap-E9-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.tg2_itest
  verified_at: 2026-11-17T16:48:36Z
  output: |
    ℹ duration_ms 415635.927125

- eval: E10
  run_id: minted-dong-dau-dia-chi-luc-nap-E10-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.tg2_khong_tut
  verified_at: 2026-11-17T16:48:36Z
  output: |
    tin xung_dot: gốc 0 · nền 0 · sau 0

- eval: E11
  run_id: minted-dong-dau-dia-chi-luc-nap-E11-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.tg2_itest
  verified_at: 2026-11-17T16:48:36Z
  output: |
    ℹ duration_ms 415635.927125

- eval: E13
  run_id: minted-dong-dau-dia-chi-luc-nap-E13-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.tg2_phu_kind
  verified_at: 2026-11-17T16:48:36Z
  output: |
    nguồn kind (bài, lượt sau): chữ bài 71433 · thẻ 1377 · bối cảnh nhóm 173

### Judgment

Panel đề xuất cho E12: ba lens domain-correctness, operational-feasibility, spec-alignment. Cả ba cùng nêu một thiếu sót: mục «Kết quả» của tệp mẫu v2 còn ghi «CHỜ MẠNH DUYỆT». Người quyết ở Cổng 2; human_override để trống.

- eval: E12
  judged_by: judge panel (fresh context) — đề xuất, không thay người
  verdict: UNCERTAIN
  votes:
    - domain-correctness: UNCERTAIN — Tệp mẫu v2 khai trước đủ ngưỡng (cận trên Wilson 95% ≤ 10%) và cỡ mẫu n = 100, có hạt giống, khung rút và lệnh rút. Nhưng phần «Kết quả» ghi «CHỜ MẠNH DUYỆT», nên chưa có nhãn người nào, chưa có cận trên Wilson nào để so với 10%, và chưa có câu kết luận bối cảnh nhóm đủ hay chưa đủ. Nháp 0/100 của trợ lý được tệp ghi rõ là KHÔNG phải nhãn người, nên không dùng làm số AC-10. Tệp còn một dòng cờ chưa quyết (bài 02e084bc…, Mã căn M2).
    - operational-feasibility: UNCERTAIN — Tệp mẫu v2 khai trước đủ ngưỡng (cận trên Wilson 95% ≤ 10%) và n = 100, đúng seed và lệnh rút, nhưng mục «Kết quả» ghi «CHỜ MẠNH DUYỆT». Chưa có nhãn người nào, nên không có tỉ lệ, không có cận Wilson trên hay dưới và không có câu kết luận bối cảnh nhóm đủ hay chưa đủ. Nháp 0/100 của trợ lý được tệp tự ghi là chưa phải nhãn người, và có một dòng M2 còn bỏ ngỏ, nên không thể chấm câu (1) và (3).
    - spec-alignment: UNCERTAIN — Tệp khai trước ngưỡng (cận trên Wilson ≤ 10%) và n = 100, commit f840af82 trước khi rút, nên (2) về cỡ mẫu khai trước là đạt. Nhưng mục «Kết quả» ghi «CHỜ MẠNH DUYỆT»: chưa có cận trên Wilson nào, chưa có câu kết luận bối cảnh nhóm đủ hay chưa đủ, và 0/100 chỉ là nháp của trợ lý, chưa phải nhãn người. Vì vậy (1), (3) không có số để so và (4) chưa có số nào để truy nguồn.
  rationale: Cả ba lens đồng ý rằng khai trước đạt nhưng chưa có nhãn người, nên không chấm được tỉ lệ, cận Wilson và câu kết luận.
  required_evidence:
    - Tệp nhãn người đã duyệt, tải từ research-local/duyet-nhan-ac10-v2.html, với cả 100 dòng do Mạnh bấm. Kết quả của `node pipeline/scripts/mau-bai-lac-du-an.mjs --tinh-duyet <tệp nhãn> --seed tg2-ac10-v2-20261117` phải in tỉ lệ, cả hai cận Wilson, số dòng đã duyệt và mã thoát, rồi được dán vào mục «Kết quả» của evidence/mau-bai-lac-du-an-v2.md.
    - Cận trên Wilson 95% đọc được trong tệp mau-bai-lac-du-an-v2.md, ≤ 10% (nhiều nhất 4 bài lạc trên 100).
    - Trong cùng tệp, đúng một câu kết luận «bối cảnh nhóm đủ» hoặc «chưa đủ» làm mặc định, khớp với kết quả so cận trên với ngưỡng.
    - Nhãn người của dòng cờ 02e084bc… (Mã căn M2, nhóm Ocean Park 1): Mạnh quyết M2 có phải toà Masteri thuộc dự án khác hay không, ghi trong tệp nhãn đã duyệt.
    - Mục «Kết quả» trong /Users/manhphan/dev/onehub-invest/.claude/worktrees/tg2-dong-dau/_acceptance/dong-dau-dia-chi-luc-nap/evidence/mau-bai-lac-du-an-v2.md cập nhật sau khi Mạnh duyệt cả 100 dòng, kèm tên người duyệt và giờ duyệt lấy từ tệp nhãn.
  human_override:  # chi nguoi ghi

### Lệnh suite (hồi quy)

- cmd: node scripts/suite-neu-doi.mjs agent -- 'cd agent && npm test'
  run_id: minted-dong-dau-dia-chi-luc-nap-SUITE-node_scripts_suite_neu_doi_mjs_agent_cd_-r2
  exit_code: 0
  verified_at: 2026-11-17T16:48:36Z

- cmd: node scripts/suite-neu-doi.mjs app -- 'cd app && npx tsc --noEmit && npm run lint'
  run_id: minted-dong-dau-dia-chi-luc-nap-SUITE-lint-r2
  exit_code: 0
  verified_at: 2026-11-17T16:48:36Z

- cmd: node scripts/suite-neu-doi.mjs app_ui -- 'cd app && npm test'
  run_id: minted-dong-dau-dia-chi-luc-nap-SUITE-node_scripts_suite_neu_doi_mjs_app_ui_cd-r2
  exit_code: 1
  verified_at: 2026-11-17T16:48:36Z
  note: lệnh KHÔNG gắn eval nào, nhưng là lý do REJECT. Ca đỏ ở app/tests/the-so-gia-tri-song.test.tsx:387, so sánh deepStrictEqual giữa danh sách thực nhận (13 đến 24, 12 phần tử) và danh sách kỳ vọng (13 đến 24 rồi 216026 đến 216085, 72 phần tử).

- cmd: node scripts/suite-neu-doi.mjs pipeline_a -- 'cd pipeline && npm run test:a'
  run_id: minted-dong-dau-dia-chi-luc-nap-SUITE-test_a-r2
  exit_code: 0
  verified_at: 2026-11-17T16:48:36Z

- cmd: node scripts/suite-neu-doi.mjs pipeline_b -- 'cd pipeline && npm run test:b'
  run_id: minted-dong-dau-dia-chi-luc-nap-SUITE-test_b-r2
  exit_code: 0
  verified_at: 2026-11-17T16:48:36Z

- cmd: node scripts/suite-neu-doi.mjs ui_lint_rules -- 'cd app && npm run test:lint-rules'
  run_id: minted-dong-dau-dia-chi-luc-nap-SUITE-test_lint_rules-r2
  exit_code: 0
  verified_at: 2026-11-17T16:48:36Z
  note: bỏ qua theo vùng, không đổi app/**, db/**, CONTEXT.md, .claude/skills/onehub-ui/** (17 tệp đổi ngoài vùng).

- cmd: node scripts/suite-neu-doi.mjs portal_static -- 'node scripts/check-portal-compliance.mjs'
  run_id: minted-dong-dau-dia-chi-luc-nap-SUITE-node_scripts_suite_neu_doi_mjs_portal_st-r2
  exit_code: 0
  verified_at: 2026-11-17T16:48:36Z
  note: bỏ qua theo vùng, không đổi app/**, db/**, các tệp kiểm cổng (17 tệp đổi ngoài vùng).

## Known limits

## Ngoài hợp đồng

## Analyst

none — mọi eval feature đều red trên baseline (có phân biệt)

Lưu ý: không eval nào có baseline đo được; cả tám lệnh eval đều là n-a vì eval mới (xem mục dưới), nên câu «red» ở trên chưa được baseline chứng minh.

Baseline không đo:
- node pipeline/scripts/dong-dau-dia-chi-that.mjs --do-neu-cu --thuoc phu-the: bo qua baseline: tep pipeline/scripts/dong-dau-dia-chi-that.mjs co o cay dang kiem nhung chua co o merge-base 55bcea7a25e1232c7ddc9ef8fb26409e87f69f14 — eval moi, chay tren code cu khong phan biet gi
- node pipeline/scripts/dong-dau-dia-chi-that.mjs --do-neu-cu --thuoc nguong-moc: bo qua baseline: tep pipeline/scripts/dong-dau-dia-chi-that.mjs co o cay dang kiem nhung chua co o merge-base 55bcea7a25e1232c7ddc9ef8fb26409e87f69f14 — eval moi, chay tren code cu khong phan biet gi
- bash db/db-thu.sh oneinvest_suite_tg2 --chay node --test --test-concurrency=1 pipeline/tests/dia-chi-the-nhom.itest.mjs pipeline/tests/dong-dau-dia-chi.itest.mjs: bo qua baseline: tep pipeline/tests/dia-chi-the-nhom.itest.mjs co o cay dang kiem nhung chua co o merge-base 55bcea7a25e1232c7ddc9ef8fb26409e87f69f14 — eval moi, chay tren code cu khong phan biet gi
- node --test pipeline/scripts/dong-dau-dia-chi.test.mjs pipeline/scripts/transform-zalo-loai-tin.test.mjs: bo qua baseline: tep pipeline/scripts/dong-dau-dia-chi.test.mjs co o cay dang kiem nhung chua co o merge-base 55bcea7a25e1232c7ddc9ef8fb26409e87f69f14 — eval moi, chay tren code cu khong phan biet gi
- node pipeline/scripts/quet-doc-stg.mjs: bo qua baseline: tep pipeline/scripts/quet-doc-stg.mjs co o cay dang kiem nhung chua co o merge-base 55bcea7a25e1232c7ddc9ef8fb26409e87f69f14 — eval moi, chay tren code cu khong phan biet gi
- node pipeline/scripts/dong-dau-dia-chi-that.mjs --do-neu-cu --thuoc chu-bai-that: bo qua baseline: tep pipeline/scripts/dong-dau-dia-chi-that.mjs co o cay dang kiem nhung chua co o merge-base 55bcea7a25e1232c7ddc9ef8fb26409e87f69f14 — eval moi, chay tren code cu khong phan biet gi
- node pipeline/scripts/dong-dau-dia-chi-that.mjs --do-neu-cu --thuoc khong-tut: bo qua baseline: tep pipeline/scripts/dong-dau-dia-chi-that.mjs co o cay dang kiem nhung chua co o merge-base 55bcea7a25e1232c7ddc9ef8fb26409e87f69f14 — eval moi, chay tren code cu khong phan biet gi
- node pipeline/scripts/dong-dau-dia-chi-that.mjs --do-neu-cu --thuoc phu-kind: bo qua baseline: tep pipeline/scripts/dong-dau-dia-chi-that.mjs co o cay dang kiem nhung chua co o merge-base 55bcea7a25e1232c7ddc9ef8fb26409e87f69f14 — eval moi, chay tren code cu khong phan biet gi

## Variance

none — every multi-run eval is uniform

## Iterations

Round 1: lịch sử round trước không có trong đầu vào của lần soạn này; xem bản evidence-report cũ trong lịch sử git.
Round 2: REJECT — lệnh suite app_ui (không gắn eval) đỏ ở app/tests/the-so-gia-tri-song.test.tsx:387 (danh sách thực nhận thiếu 60 phần tử 216026 đến 216085 so với kỳ vọng); E12 còn chờ nhãn người. Trả lại triển khai.
