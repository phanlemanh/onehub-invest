---
schema_version: 2
feature_slug: lat-khai-o-can-gan
verdict: PENDING-JUDGMENT
failed_evals: []
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: b2ec09f4457bad50596f630b7f21a3641843ef1d
human_signoff:
---

# Evidence Report: lat-khai-o-can-gan

Round 2. Mọi eval máy và ui-check đều xanh; E11 (judgment) còn UNCERTAIN chờ người nên verdict là PENDING-JUDGMENT.

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
| E9 | AC-8 | script | PASS |
| E10 | AC-9 | ui-check | PASS |
| E11 | AC-10 | judgment | UNCERTAIN |
| E12 | AC-9 | script | PASS |
| E13 | AC-8 | script | PASS |
| E14 | AC-9 | script | PASS |
| E15 | AC-8 | script | PASS |

## Evidence

- eval: E1
  run_id: minted-lat-khai-o-can-gan-E1-r2
  exit_code: 0
  baseline: n-a
  verifier: _acceptance/lat-khai-o-can-gan/probes/doc.sh
  verified_at: 2026-11-19T22:58:15Z
  output: |
    cmd: bash _acceptance/lat-khai-o-can-gan/probes/doc.sh AC-1
    ℹ duration_ms 2266.632084

- eval: E2
  run_id: minted-lat-khai-o-can-gan-E2-r2
  exit_code: 0
  baseline: n-a
  verifier: _acceptance/lat-khai-o-can-gan/probes/doc.sh
  verified_at: 2026-11-19T22:58:15Z
  output: |
    cmd: bash _acceptance/lat-khai-o-can-gan/probes/doc.sh AC-2
    ℹ duration_ms 2075.3085

- eval: E3
  run_id: minted-lat-khai-o-can-gan-E3-r2
  exit_code: 0
  baseline: n-a
  verifier: _acceptance/lat-khai-o-can-gan/probes/doc.sh
  verified_at: 2026-11-19T22:58:15Z
  output: |
    cmd: bash _acceptance/lat-khai-o-can-gan/probes/doc.sh AC-3
    ℹ duration_ms 1407.522833

- eval: E4
  run_id: minted-lat-khai-o-can-gan-E4-r2
  exit_code: 0
  baseline: n-a
  verifier: _acceptance/lat-khai-o-can-gan/probes/doc.sh
  verified_at: 2026-11-19T22:58:15Z
  output: |
    cmd: bash _acceptance/lat-khai-o-can-gan/probes/doc.sh AC-4
    ℹ duration_ms 3303.9905

- eval: E5
  run_id: minted-lat-khai-o-can-gan-E5-r2
  exit_code: 0
  baseline: n-a
  verifier: _acceptance/lat-khai-o-can-gan/probes/doc.sh
  verified_at: 2026-11-19T22:58:15Z
  output: |
    cmd: bash _acceptance/lat-khai-o-can-gan/probes/doc.sh AC-5
    ℹ duration_ms 3393.996375

- eval: E6
  run_id: minted-lat-khai-o-can-gan-E6-r2
  exit_code: 0
  baseline: n-a
  verifier: _acceptance/lat-khai-o-can-gan/probes/doc.sh
  verified_at: 2026-11-19T22:58:15Z
  output: |
    cmd: bash _acceptance/lat-khai-o-can-gan/probes/doc.sh AC-6
    ℹ duration_ms 1582.136375

- eval: E7
  run_id: minted-lat-khai-o-can-gan-E7-r2
  exit_code: 0
  baseline: n-a
  verifier: _acceptance/lat-khai-o-can-gan/probes/doc.sh
  verified_at: 2026-11-19T22:58:15Z
  output: |
    cmd: bash _acceptance/lat-khai-o-can-gan/probes/doc.sh AC-7
    ℹ duration_ms 1445.130125

- eval: E8
  run_id: minted-lat-khai-o-can-gan-E8-r2
  exit_code: 0
  baseline: red
  verifier: config:executors.test.gcn_app
  verified_at: 2026-11-19T22:58:15Z
  output: |
    cmd: cd app && node --import tsx --test tests/labels-nhom.test.tsx
    ℹ duration_ms 44833.262875

- eval: E9
  run_id: minted-lat-khai-o-can-gan-E9-r2
  exit_code: 0
  baseline: red
  verifier: config:executors.test.mgn_app
  verified_at: 2026-11-19T22:58:15Z
  output: |
    cmd: cd app && node --import tsx --test tests/labels.test.tsx
    ℹ duration_ms 2797.555625

- eval: E10
  run_id: minted-lat-khai-o-can-gan-E10-r2
  exit_code: 0
  baseline: n-a
  verifier: scripts/ui-capture.sh
  verified_at: 2026-11-19T22:58:15Z
  screenshot: evidence/E10-step1.png
  observed: |
    step1 (sáng 1280): tiêu đề «Gắn nhãn», bài #12153, đúng hai ô Toà và Phân khu hoặc cụm, chip đếm 0/2, tiến độ 0/3, nút «Lưu và sang bài kế»; email thanh bên bị che. step2: hai thông báo đỏ «Chưa điền» dưới từng ô. step3-4: bài kế #12154, không có màn xem máy đọc, chế độ tối đọc rõ. step5: 390px một cột, không tràn ngang. step6: huy hiệu 2/2 xanh, nút xám «Đang lưu…». step7: khung cảnh báo đỏ «Không chắc đã lưu» + nút «Thử lại», chữ còn nguyên. step8: «Đã gắn hết nhóm này», tiến độ 3/3. Khớp expected, không frame nào mâu thuẫn.
  network_observed: n-a (tool-error: ego-browser khong giu log mang qua cac lenh, chi doc duoc luot reload cuoi)
  output: |
    A7 PASS buoc7: ngat mang, bam Luu -> khung canh bao do kem nut 'Thu lai'; gia tri input van 'Origami 1' va 'Origami'. Noi lai, bam Thu lai -> luu thanh cong, sang trang thai het bai (3/3).
    A8 PASS buoc8: 'Da gan het nhom nay', 'Toi da gan 3/3', thanh tien do day.
    Frame: E10-step1.png ... E10-step8.png, E10-network.txt. DB thu da bi ghi 3 bai (duoc phep).
  provenance: dev server http://localhost:3461 (GS dựng) chạy từ /Users/manhphan/dev/onehub-invest/.claude/worktrees/ops-deals-data-grid/app, HEAD tách rời tại b2ec09f4457bad50596f630b7f21a3641843ef1d; DATABASE_URL = DB thử oneinvest_lkocg_e10 (dựng bằng _acceptance/lat-khai-o-can-gan/probes/dung-db-e10.sh, 3 bài lát giả hai-khu-ghep-b), không phải DB máy thu; workflow run wf_d7c72b87-d69.

- eval: E12
  run_id: minted-lat-khai-o-can-gan-E12-r2
  exit_code: 0
  baseline: green
  verifier: config:executors.design.floor
  verified_at: 2026-11-19T22:58:15Z
  output: |
    cmd: node design-floor-s4.mjs --root .
    sàn thiết kế M1 không báo hex thô mới

- eval: E13
  run_id: minted-lat-khai-o-can-gan-E13-r2
  exit_code: 0
  baseline: red
  verifier: config:executors.suite.app
  verified_at: 2026-11-19T22:58:15Z
  output: |
    cmd: node scripts/suite-neu-doi.mjs app -- 'cd app && npx tsc --noEmit && npm run lint'
    typecheck và lint sạch

- eval: E14
  run_id: minted-lat-khai-o-can-gan-E14-r2
  exit_code: 0
  baseline: n-a
  verifier: _acceptance/lat-khai-o-can-gan/probes/doc.sh
  verified_at: 2026-11-19T22:58:15Z
  output: |
    cmd: bash _acceptance/lat-khai-o-can-gan/probes/doc.sh AC-9
    ℹ duration_ms 1638.396917

- eval: E15
  run_id: minted-lat-khai-o-can-gan-E15-r2
  exit_code: 0
  baseline: n-a
  verifier: _acceptance/lat-khai-o-can-gan/probes/kiem-test-da-ky.sh
  verified_at: 2026-11-19T22:58:15Z
  output: |
    test da ky khong doi so voi 972515aac047311b847426f13f4164dc0dd8a6ec

### Judgment

Đề xuất panel cho E11 (người quyết ở Cổng 2): ba lens domain-correctness, operational-feasibility, spec-alignment. E11 không có đầu vào dựng được: tệp do-thoi-gian.md không có ở đường dẫn worktree này (chỉ thấy untracked ở worktree nhánh feat/lat-khai-o-can-gan), nên cả ba lens không có căn cứ để chấm.

- eval: E11
  judged_by: judge-subagent (fresh context)
  verdict: UNCERTAIN
  rationale: Tệp đầu vào duy nhất (evidence/do-thoi-gian.md) không tồn tại ở đường dẫn được giao, nên không xác nhận được hạt giống, 5 bài (mã bài, số ký tự, số ảnh, số giây) và trung bình không quá 45 giây.
  votes:
    - domain-correctness: UNCERTAIN — không có tệp đo thời gian, không xét được hạt giống và 5 bài.
    - operational-feasibility: UNCERTAIN — không có tệp đo thời gian, không xét được trung bình số giây.
    - spec-alignment: UNCERTAIN — Read báo tệp không tồn tại; tệp chỉ thấy ở worktree nhánh feat/lat-khai-o-can-gan, chưa có ở worktree này.
  required_evidence:
    - Tệp /Users/manhphan/dev/onehub-invest/.claude/worktrees/can-cung-tieu-chi-toan-tap/_acceptance/lat-khai-o-can-gan/evidence/do-thoi-gian.md phải có ở đúng đường dẫn đó (sinh bởi lệnh đo E10/E11 hoặc chép từ worktree nhánh feat/lat-khai-o-can-gan).
    - Nội dung phải ghi hạt giống, đủ 5 dòng bài (mã bài, số ký tự, số ảnh, số giây) và trung bình số giây không quá 45.
  human_override:  # chi nguoi ghi

### Lệnh suite (hồi quy)

- cmd: node scripts/suite-neu-doi.mjs agent -- 'cd agent && npm test'
  run_id: minted-lat-khai-o-can-gan-SUITE-node_scripts_suite_neu_doi_mjs_agent_cd_-r2
  exit_code: 0
  verified_at: 2026-11-19T22:58:15Z

- cmd: node scripts/suite-neu-doi.mjs app_ui -- 'cd app && npm test'
  run_id: minted-lat-khai-o-can-gan-SUITE-node_scripts_suite_neu_doi_mjs_app_ui_cd-r2
  exit_code: 0
  verified_at: 2026-11-19T22:58:15Z

- cmd: node scripts/suite-neu-doi.mjs pipeline_a -- 'cd pipeline && npm run test:a'
  run_id: minted-lat-khai-o-can-gan-SUITE-test_a-r2
  exit_code: 0
  verified_at: 2026-11-19T22:58:15Z

- cmd: node scripts/suite-neu-doi.mjs pipeline_b -- 'cd pipeline && npm run test:b'
  run_id: minted-lat-khai-o-can-gan-SUITE-test_b-r2
  exit_code: 0
  verified_at: 2026-11-19T22:58:15Z

- cmd: node scripts/suite-neu-doi.mjs ui_lint_rules -- 'cd app && npm run test:lint-rules'
  run_id: minted-lat-khai-o-can-gan-SUITE-test_lint_rules-r2
  exit_code: 0
  verified_at: 2026-11-19T22:58:15Z

- cmd: node scripts/suite-neu-doi.mjs portal_static -- 'node scripts/check-portal-compliance.mjs'
  run_id: minted-lat-khai-o-can-gan-SUITE-node_scripts_suite_neu_doi_mjs_portal_st-r2
  exit_code: 0
  verified_at: 2026-11-19T22:58:15Z

## Known limits

## Ngoài hợp đồng

## Analyst

Eval không phân biệt (xanh cả trên code mới lẫn baseline): E12 (sàn thiết kế M1) — regression-guard có chủ ý, không assert hành vi mới.

Baseline không đo:
- bash _acceptance/lat-khai-o-can-gan/probes/doc.sh AC-1: bo qua baseline: tep _acceptance/lat-khai-o-can-gan/probes/doc.sh co o cay dang kiem nhung chua co o merge-base 972515aac047311b847426f13f4164dc0dd8a6ec — eval moi, chay tren code cu khong phan biet gi
- bash _acceptance/lat-khai-o-can-gan/probes/doc.sh AC-2: bo qua baseline: tep _acceptance/lat-khai-o-can-gan/probes/doc.sh co o cay dang kiem nhung chua co o merge-base 972515aac047311b847426f13f4164dc0dd8a6ec — eval moi, chay tren code cu khong phan biet gi
- bash _acceptance/lat-khai-o-can-gan/probes/doc.sh AC-3: bo qua baseline: tep _acceptance/lat-khai-o-can-gan/probes/doc.sh co o cay dang kiem nhung chua co o merge-base 972515aac047311b847426f13f4164dc0dd8a6ec — eval moi, chay tren code cu khong phan biet gi
- bash _acceptance/lat-khai-o-can-gan/probes/doc.sh AC-4: bo qua baseline: tep _acceptance/lat-khai-o-can-gan/probes/doc.sh co o cay dang kiem nhung chua co o merge-base 972515aac047311b847426f13f4164dc0dd8a6ec — eval moi, chay tren code cu khong phan biet gi
- bash _acceptance/lat-khai-o-can-gan/probes/doc.sh AC-5: bo qua baseline: tep _acceptance/lat-khai-o-can-gan/probes/doc.sh co o cay dang kiem nhung chua co o merge-base 972515aac047311b847426f13f4164dc0dd8a6ec — eval moi, chay tren code cu khong phan biet gi
- bash _acceptance/lat-khai-o-can-gan/probes/doc.sh AC-6: bo qua baseline: tep _acceptance/lat-khai-o-can-gan/probes/doc.sh co o cay dang kiem nhung chua co o merge-base 972515aac047311b847426f13f4164dc0dd8a6ec — eval moi, chay tren code cu khong phan biet gi
- bash _acceptance/lat-khai-o-can-gan/probes/doc.sh AC-7: bo qua baseline: tep _acceptance/lat-khai-o-can-gan/probes/doc.sh co o cay dang kiem nhung chua co o merge-base 972515aac047311b847426f13f4164dc0dd8a6ec — eval moi, chay tren code cu khong phan biet gi
- bash _acceptance/lat-khai-o-can-gan/probes/doc.sh AC-9: bo qua baseline: tep _acceptance/lat-khai-o-can-gan/probes/doc.sh co o cay dang kiem nhung chua co o merge-base 972515aac047311b847426f13f4164dc0dd8a6ec — eval moi, chay tren code cu khong phan biet gi
- bash _acceptance/lat-khai-o-can-gan/probes/kiem-test-da-ky.sh: bo qua baseline: tep _acceptance/lat-khai-o-can-gan/probes/kiem-test-da-ky.sh co o cay dang kiem nhung chua co o merge-base 972515aac047311b847426f13f4164dc0dd8a6ec — eval moi, chay tren code cu khong phan biet gi

## Variance

none — every multi-run eval is uniform

## Iterations

Round 1: các bản ghi của round đầu nằm trong run-log.jsonl (hậu tố -r1); round này thay thế toàn bộ.
Round 2: E1-E10, E12-E15 và các lệnh suite xanh; E11 (judgment, AC-10) còn UNCERTAIN vì thiếu tệp do-thoi-gian.md, chờ người quyết ở Cổng 2.
