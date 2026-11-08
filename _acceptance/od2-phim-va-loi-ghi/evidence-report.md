---
schema_version: 2
feature_slug: od2-phim-va-loi-ghi
verdict: REJECT
failed_evals: ["E1","E2","E3","E4","E5"]
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: 7a8b3c304975b5f2cb189768d5004c2bc71d21f8
human_signoff:
---

# Evidence Report: od2-phim-va-loi-ghi

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | test | REJECT |
| E2 | AC-2 | test | REJECT |
| E3 | AC-3 | test | REJECT |
| E4 | AC-4 | test | REJECT |
| E5 | AC-5 | test | REJECT |
| E6 | AC-1 | ui-check | PASS |

Lệnh `cd app && npm test` (gắn E1 đến E5) kết thúc lỗi; các eval E1 đến E5 cùng chạy chung lệnh này nên cùng bị tính hỏng. Nguyên nhân thấy trong đuôi log: `Error: invariant expected app router to be mounted` tại `app/src/components/ops/review/review-queue.tsx:143` (ReviewQueue gọi useRouter khi render không có AppRouterContext), làm đỏ các ca `TD-AC-9`, `VT-AC-3` và các ca khác trong `tests/the-duyet-du-can-cu.test.tsx`, `tests/viewer-the-duyet.test.tsx`. Không có lệnh fail nào khác ngoài lệnh này.

## Evidence

- eval: E1
  run_id: minted-od2-phim-va-loi-ghi-E1-r1
  exit_code: 1
  baseline: n-a
  verifier: config:executors.test.app_ui
  verified_at: 2026-11-08T16:17:45Z
  output: |
    Lệnh chung `cd app && npm test` hỏng. Đuôi log: "Error: invariant expected app router to be mounted"
    at ReviewQueue (app/src/components/ops/review/review-queue.tsx:143:18);
    các ca đỏ gồm TD-AC-9 và VT-AC-3.

- eval: E2
  run_id: minted-od2-phim-va-loi-ghi-E2-r1
  exit_code: 1
  baseline: n-a
  verifier: config:executors.test.app_ui
  verified_at: 2026-11-08T16:17:45Z
  output: |
    Lệnh chung `cd app && npm test` hỏng, cùng nguyên nhân với E1 (invariant expected app router to be mounted tại review-queue.tsx:143:18).

- eval: E3
  run_id: minted-od2-phim-va-loi-ghi-E3-r1
  exit_code: 1
  baseline: n-a
  verifier: config:executors.test.app_ui
  verified_at: 2026-11-08T16:17:45Z
  output: |
    Lệnh chung `cd app && npm test` hỏng, cùng nguyên nhân với E1 (invariant expected app router to be mounted tại review-queue.tsx:143:18).

- eval: E4
  run_id: minted-od2-phim-va-loi-ghi-E4-r1
  exit_code: 1
  baseline: n-a
  verifier: config:executors.test.app_ui
  verified_at: 2026-11-08T16:17:45Z
  output: |
    Lệnh chung `cd app && npm test` hỏng, cùng nguyên nhân với E1 (invariant expected app router to be mounted tại review-queue.tsx:143:18).

- eval: E5
  run_id: minted-od2-phim-va-loi-ghi-E5-r1
  exit_code: 1
  baseline: n-a
  verifier: config:executors.test.app_ui
  verified_at: 2026-11-08T16:17:45Z
  output: |
    Lệnh chung `cd app && npm test` hỏng, cùng nguyên nhân với E1 (invariant expected app router to be mounted tại review-queue.tsx:143:18).

- eval: E6
  run_id: minted-od2-phim-va-loi-ghi-E6-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.ui-check
  verified_at: 2026-11-08T16:17:45Z
  screenshot: evidence/E6-step1.png
  observed: |
    E6-step1.png: dau sheet 'Gop Nguoi' dang sang, '1/19 · Gop Nguoi', tieu de 'Gop Nguoi? S03 · 1 tai khoan · 2 SDT', '#166537 · 2026-11-02 06:01', nhan 'Nguoi' va 'Cho duyet', nut K/J/?/dong; khong co noi dung than the hay thanh ben. E6-step2.png: chi phan tu toast loi, bieu tuong loi, chu 'Khong ghi duoc #166537: Item da quyet (deferred)' va nut den 'Mo the' (toast nay hien tren trang /ops/collections, xac nhan bang DOM h1 'Thu thap'). E6-step3.png: dau sheet the sau khi bam 'Mo the': tieu de 'Gop Nguoi? S03 · 1 tai khoan · 2 SDT', '#166537 · 2026-11-02 06:01', nhan 'Nguoi' va 'Hoan' (da hoan), URL /ops/review?card=166537. Tat ca khop Expected.
  network_observed: n-a (driver)

### Lệnh suite (hồi quy)

- cmd: cd agent && npm test
  run_id: minted-od2-phim-va-loi-ghi-SUITE-npm_test__bb6271-r1
  exit_code: 0
  verified_at: 2026-11-08T16:17:45Z

- cmd: cd app && npx tsc --noEmit && npm run lint
  run_id: minted-od2-phim-va-loi-ghi-SUITE-lint-r1
  exit_code: 0
  verified_at: 2026-11-08T16:17:45Z

- cmd: cd pipeline && npm test
  run_id: minted-od2-phim-va-loi-ghi-SUITE-npm_test__13563d-r1
  exit_code: 0
  verified_at: 2026-11-08T16:17:45Z

- cmd: cd app && npm run test:lint-rules
  run_id: minted-od2-phim-va-loi-ghi-SUITE-test_lint_rules-r1
  exit_code: 0
  verified_at: 2026-11-08T16:17:45Z

- cmd: node scripts/check-portal-compliance.mjs
  run_id: minted-od2-phim-va-loi-ghi-SUITE-node_scripts_check_portal_compliance_mjs-r1
  exit_code: 0
  verified_at: 2026-11-08T16:17:45Z

## Known limits

## Ngoài hợp đồng

## Analyst

none — mọi eval feature đều red trên baseline (có phân biệt) không áp dụng được: baseline không đo (xem dưới), nên không có eval nào được xác nhận là không-phân-biệt.

Baseline khong do:
- cd app && npm test: baseline vuot tran 180 giay/lenh — da dung ca cay tien trinh; BLOCKED ha tang, khong phai ket qua cua code cu

## Variance

none — mọi eval nhiều lần chạy đều đồng đều (không eval nào có runs lớn hơn 1).

## Iterations

Round 1: E1, E2, E3, E4, E5 failed — lệnh chung `cd app && npm test` hỏng vì ReviewQueue gọi useRouter() vô điều kiện (review-queue.tsx:143), render không có AppRouterContext ném lỗi invariant. Returned to implementation.
