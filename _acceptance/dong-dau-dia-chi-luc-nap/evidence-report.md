---
schema_version: 2
feature_slug: dong-dau-dia-chi-luc-nap
verdict: BLOCKED
failed_evals: []
reason: Lệnh suite pipeline_a (`node scripts/suite-neu-doi.mjs pipeline_a -- 'cd pipeline && npm run test:a'`) vẫn đang chạy nền, chưa có dòng __EXIT. Các lệnh chờ (sleep/until) bị công cụ chặn nên không theo dõi được đến khi xong. Không có kết quả PASS/FAIL. Cần chờ thêm hoặc khai long_running cho eval trong evals.yaml để tiếp tục.
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: 096e6423d4820718033ca72b3c6367e4753259d3
human_signoff:
---

# Evidence Report: dong-dau-dia-chi-luc-nap

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

Round 1 bị chặn: bộ chạy suite pipeline_a chưa ra kết quả (xem `reason`). Hai lệnh suite khác không gắn eval nào (app lint/tsc và app_ui test) cho kết quả đỏ, ghi ở mục Lệnh suite. Các eval máy E1–E11, E13 đều xanh trên cây đã kiểm.

## Evidence

- eval: E1
  run_id: minted-dong-dau-dia-chi-luc-nap-E1-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.tg2_phu_the
  verified_at: 2026-11-17T15:09:37Z
  output: |
    trong đó thẻ có ô dự án mà tin KHÔNG nhận dự án từ luật này (hoà giải mức tin, AC-8): 1

- eval: E1b
  run_id: minted-dong-dau-dia-chi-luc-nap-E1b-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.tg2_nguong_moc
  verified_at: 2026-11-17T15:09:37Z
  output: |
    ngưỡng 90% áp cho cửa sổ all; /ops/data-flow mặc định hiện 7d

- eval: E2
  run_id: minted-dong-dau-dia-chi-luc-nap-E2-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.tg2_pipeline
  verified_at: 2026-11-17T15:09:37Z
  output: |
    ℹ duration_ms 176.787875

- eval: E3
  run_id: minted-dong-dau-dia-chi-luc-nap-E3-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.tg2_pipeline
  verified_at: 2026-11-17T15:09:37Z
  output: |
    ℹ duration_ms 176.787875

- eval: E4
  run_id: minted-dong-dau-dia-chi-luc-nap-E4-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.tg2_itest
  verified_at: 2026-11-17T15:09:37Z
  output: |
    ℹ duration_ms 462290.992917

- eval: E5
  run_id: minted-dong-dau-dia-chi-luc-nap-E5-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.tg2_itest
  verified_at: 2026-11-17T15:09:37Z
  output: |
    ℹ duration_ms 462290.992917

- eval: E6
  run_id: minted-dong-dau-dia-chi-luc-nap-E6-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.tg2_itest
  verified_at: 2026-11-17T15:09:37Z
  output: |
    ℹ duration_ms 462290.992917

- eval: E7
  run_id: minted-dong-dau-dia-chi-luc-nap-E7-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.tg2_itest
  verified_at: 2026-11-17T15:09:37Z
  output: |
    ℹ duration_ms 462290.992917

- eval: E8
  run_id: minted-dong-dau-dia-chi-luc-nap-E8-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.tg2_quet_doc
  verified_at: 2026-11-17T15:09:37Z
  output: |
    quét 4 tệp: 0 câu đọc thẳng stg_zalo_posts ngoài loadStgPosts

- eval: E9
  run_id: minted-dong-dau-dia-chi-luc-nap-E9-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.tg2_itest
  verified_at: 2026-11-17T15:09:37Z
  output: |
    ℹ duration_ms 462290.992917

- eval: E3b
  run_id: minted-dong-dau-dia-chi-luc-nap-E3b-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.tg2_chu_bai_that
  verified_at: 2026-11-17T15:09:37Z
  output: |
    nhận đúng dự án của chữ bài: 103/103

- eval: E10
  run_id: minted-dong-dau-dia-chi-luc-nap-E10-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.tg2_khong_tut
  verified_at: 2026-11-17T15:09:37Z
  output: |
    tin xung_dot: trước 0 · sau 0

- eval: E11
  run_id: minted-dong-dau-dia-chi-luc-nap-E11-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.tg2_itest
  verified_at: 2026-11-17T15:09:37Z
  output: |
    ℹ duration_ms 462290.992917

- eval: E13
  run_id: minted-dong-dau-dia-chi-luc-nap-E13-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.tg2_phu_kind
  verified_at: 2026-11-17T15:09:37Z
  output: |
    nguồn kind (bài, lượt sau): chữ bài 71433 · thẻ 1377 · bối cảnh nhóm 173

### Judgment

Panel đề xuất cho E12 (AC-10): ba góc nhìn domain-correctness, operational-feasibility, spec-alignment. Ô human_override để trống cho người quyết ở Cổng 2.

- domain-correctness: UNCERTAIN — Theo cách đọc dùng chính thức, cận trên Wilson là 5,45% (1/100), không vượt ngưỡng 10%. Cỡ mẫu n=100 được khai trước, và có đúng một câu kết luận khớp kết quả, nhưng thước đạt chỉ nhờ định nghĩa «lạc» do Mạnh chốt sau khi đã thấy nháp. Cách đọc ngược lại cho 5/100, cận trên 11,18%, tức chưa đạt. Hợp đồng đòi «mẫu nhãn người», trong khi 96/100 nhãn là nháp của trợ lý, chưa được duyệt từng dòng.
- operational-feasibility: UNCERTAIN — Cận trên Wilson là 5,45% (≤ 10%), n = 100 được khai trước khi gắn nhãn, và có một câu kết luận khớp với số đo. Nhưng 96/100 nhãn là nháp của trợ lý chưa được người duyệt từng dòng, trong khi AC-10 đòi mẫu nhãn người. Kết quả đạt còn phụ thuộc vào quyết định «Trong hệ VGP» của Mạnh: theo cách đọc đối chứng, cận trên là 11,18% (chưa đạt).
- spec-alignment: UNCERTAIN — Bốn điểm hỏi đều đạt trên giấy: (1) 1/100 bài lạc cho Wilson 95% là 0,18%–5,45%, cận trên ≤ 10%; (2) n = 100 bằng mức đề xuất và được khai trước, kèm hạt giống, giờ rút và danh sách đúng 100 mã bài; (3) có đúng một câu kết luận «đủ làm mặc định», khớp với kết quả (1); (4) mỗi số đều ghi lệnh hoặc tệp nguồn. Nhưng AC-10 đòi «mẫu nhãn người», trong khi tệp tự nhận 96/100 nhãn là nháp của trợ lý, chưa được duyệt từng dòng. Chỉ 4 ca bị đảo nhờ câu «Trong hệ VGP» của Mạnh, và chính quyết định đó biến kết quả từ chưa đạt (5/100, cận trên 11,18%) thành đạt.

- eval: E12
  judged_by: judge panel (domain-correctness, operational-feasibility, spec-alignment)
  verdict: UNCERTAIN
  rationale: Cận trên Wilson 5,45% đạt ngưỡng 10% theo cách đọc chính thức, nhưng 96/100 nhãn là nháp của trợ lý chưa được người duyệt từng dòng, và kết quả phụ thuộc vào định nghĩa «hệ VGP» do Mạnh chốt sau khi thấy nháp (cách đọc ngược cho cận trên 11,18%).
  required_evidence:
    - Xác nhận của Mạnh, ghi ngày và nguyên văn trong mau-bai-lac-du-an.md, rằng đã duyệt từng dòng 96 nhãn còn lại, hoặc bảng nhãn đã được người duyệt ở research-local/mau-bai-lac-du-an.md với số bài lạc tính lại bằng lệnh --tinh.
    - Bằng chứng định nghĩa «MCP và LBV thuộc hệ VGP» được chốt trước lúc gắn nhãn, ví dụ dòng ở Cổng Phạm vi hoặc docs ghi trước 2026-11-16T23:06Z. Hoặc một mẫu mới rút với hạt giống khai trước, gắn nhãn theo định nghĩa đã ghi sẵn.
    - Xác nhận bằng văn bản của Mạnh rằng ông đã duyệt từng dòng 96 nhãn còn lại, kèm một dòng tóm tắt đưa vào evidence/mau-bai-lac-du-an.md.
    - Ghi nhận chính thức ở Cổng Phạm vi hoặc contract.md mục AC-10 rằng MCP/LBV thuộc «hệ VGP» thì không tính là bài lạc; hiện quyết định này chỉ nằm trong tệp bằng chứng.
    - Xác nhận từ contract.md mục Đường đo hoặc biên bản Cổng Phạm vi rằng mẫu AC-10 được rút trên mọi bài của nhóm chuyên một dự án, không phải trên tập bài bị đóng dấu.
  human_override:  # chi nguoi ghi

### Lệnh suite (hồi quy)

- cmd: node scripts/suite-neu-doi.mjs agent -- 'cd agent && npm test'
  run_id: minted-dong-dau-dia-chi-luc-nap-SUITE-node_scripts_suite_neu_doi_mjs_agent_cd_-r1
  exit_code: 0
  verified_at: 2026-11-17T15:09:37Z

- cmd: node scripts/suite-neu-doi.mjs app -- 'cd app && npx tsc --noEmit && npm run lint'
  run_id: minted-dong-dau-dia-chi-luc-nap-SUITE-lint-r1
  exit_code: 2
  verified_at: 2026-11-17T15:09:37Z
  note: lệnh đỏ, không gắn eval nào. Lỗi tsc: không tìm thấy tên `LayoutProps` / `PageProps` ở các tệp layout.tsx và ops/data-flow/page.tsx (kiểu toàn cục do Next sinh, có thể thiếu bước sinh kiểu trong worktree).

- cmd: node scripts/suite-neu-doi.mjs app_ui -- 'cd app && npm test'
  run_id: minted-dong-dau-dia-chi-luc-nap-SUITE-node_scripts_suite_neu_doi_mjs_app_ui_cd-r1
  exit_code: 1
  verified_at: 2026-11-17T15:09:37Z
  note: lệnh đỏ, không gắn eval nào. Ca đỏ ở app/tests/the-so-gia-tri-song.test.tsx dòng 387: deepStrictEqual giữa mảng thực tế (13 đến 24) và mảng mong đợi (13 đến 24 cộng 216026 đến 216085).

- cmd: node scripts/suite-neu-doi.mjs pipeline_a -- 'cd pipeline && npm run test:a'
  run_id: minted-dong-dau-dia-chi-luc-nap-SUITE-test_a-r1
  exit_code: n-a (chưa xong; không có dòng __EXIT)
  verified_at: 2026-11-17T15:09:37Z
  note: BLOCKED, lệnh bị chuyển nền (ID bsxeuxen1) và chưa kết thúc khi báo cáo được soạn.

- cmd: node scripts/suite-neu-doi.mjs pipeline_b -- 'cd pipeline && npm run test:b'
  run_id: minted-dong-dau-dia-chi-luc-nap-SUITE-test_b-r1
  exit_code: 0
  verified_at: 2026-11-17T15:09:37Z

- cmd: node scripts/suite-neu-doi.mjs ui_lint_rules -- 'cd app && npm run test:lint-rules'
  run_id: minted-dong-dau-dia-chi-luc-nap-SUITE-test_lint_rules-r1
  exit_code: 0
  verified_at: 2026-11-17T15:09:37Z
  note: bỏ qua do không đổi vùng app/db.

- cmd: node scripts/suite-neu-doi.mjs portal_static -- 'node scripts/check-portal-compliance.mjs'
  run_id: minted-dong-dau-dia-chi-luc-nap-SUITE-node_scripts_suite_neu_doi_mjs_portal_st-r1
  exit_code: 0
  verified_at: 2026-11-17T15:09:37Z
  note: bỏ qua do không đổi vùng app/db.

## Known limits

## Ngoài hợp đồng

## Analyst

none — moi eval feature deu red tren baseline (co phan biet)

Ghi chú: không eval nào đo được baseline (tất cả n-a, vì là eval mới), nên chưa có eval nào chứng minh được là đỏ trên code cũ.

Baseline khong do:
- node pipeline/scripts/dong-dau-dia-chi-that.mjs --do-neu-cu --thuoc phu-the: bo qua baseline: tep pipeline/scripts/dong-dau-dia-chi-that.mjs co o cay dang kiem nhung chua co o merge-base 55bcea7a25e1232c7ddc9ef8fb26409e87f69f14 — eval moi, chay tren code cu khong phan biet gi
- node pipeline/scripts/dong-dau-dia-chi-that.mjs --do-neu-cu --thuoc nguong-moc: bo qua baseline: tep pipeline/scripts/dong-dau-dia-chi-that.mjs co o cay dang kiem nhung chua co o merge-base 55bcea7a25e1232c7ddc9ef8fb26409e87f69f14 — eval moi, chay tren code cu khong phan biet gi
- node --test pipeline/scripts/dong-dau-dia-chi.test.mjs pipeline/scripts/transform-zalo-loai-tin.test.mjs: bo qua baseline: tep pipeline/scripts/dong-dau-dia-chi.test.mjs co o cay dang kiem nhung chua co o merge-base 55bcea7a25e1232c7ddc9ef8fb26409e87f69f14 — eval moi, chay tren code cu khong phan biet gi
- bash db/db-thu.sh oneinvest_suite_tg2 --chay node --test --test-concurrency=1 pipeline/tests/dia-chi-the-nhom.itest.mjs pipeline/tests/dong-dau-dia-chi.itest.mjs: bo qua baseline: tep pipeline/tests/dia-chi-the-nhom.itest.mjs co o cay dang kiem nhung chua co o merge-base 55bcea7a25e1232c7ddc9ef8fb26409e87f69f14 — eval moi, chay tren code cu khong phan biet gi
- node pipeline/scripts/quet-doc-stg.mjs: bo qua baseline: tep pipeline/scripts/quet-doc-stg.mjs co o cay dang kiem nhung chua co o merge-base 55bcea7a25e1232c7ddc9ef8fb26409e87f69f14 — eval moi, chay tren code cu khong phan biet gi
- node pipeline/scripts/dong-dau-dia-chi-that.mjs --do-neu-cu --thuoc chu-bai-that: bo qua baseline: tep pipeline/scripts/dong-dau-dia-chi-that.mjs co o cay dang kiem nhung chua co o merge-base 55bcea7a25e1232c7ddc9ef8fb26409e87f69f14 — eval moi, chay tren code cu khong phan biet gi
- node pipeline/scripts/dong-dau-dia-chi-that.mjs --do-neu-cu --thuoc khong-tut: bo qua baseline: tep pipeline/scripts/dong-dau-dia-chi-that.mjs co o cay dang kiem nhung chua co o merge-base 55bcea7a25e1232c7ddc9ef8fb26409e87f69f14 — eval moi, chay tren code cu khong phan biet gi
- node pipeline/scripts/dong-dau-dia-chi-that.mjs --do-neu-cu --thuoc phu-kind: bo qua baseline: tep pipeline/scripts/dong-dau-dia-chi-that.mjs co o cay dang kiem nhung chua co o merge-base 55bcea7a25e1232c7ddc9ef8fb26409e87f69f14 — eval moi, chay tren code cu khong phan biet gi

## Variance

none — every multi-run eval is uniform

## Iterations

Round 1: BLOCKED — suite pipeline_a chưa kết thúc (lệnh chạy nền, công cụ chặn lệnh chờ); chưa có E-nào đỏ. Hai lệnh suite không gắn eval (app lint/tsc, app_ui test) đỏ cần xử lý; E12 chờ người quyết ở Cổng 2. Cần chạy lại với thời gian chờ dài hơn hoặc khai long_running.
