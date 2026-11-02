---
schema_version: 2
feature_slug: s03-llm-doc-toan-bo
verdict: REJECT
failed_evals: ["E11"]
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: 59568136a166229a034cd0d5d7ba8f526343e9fe
human_signoff:
---

# Evidence Report: s03-llm-doc-toan-bo

Round 1. Verdict REJECT vì E11 đỏ (bộ test pipeline). Một lệnh suite không gắn eval cũng đỏ: `cd app && npm test`.

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | test | PASS |
| E2 | AC-2 | test | PASS |
| E3 | AC-3 | test | PASS |
| E4 | AC-4 | test | PASS |
| E5 | AC-5 | test | PASS |
| E6 | AC-6 | test | PASS |
| E7 | AC-7 | test | PASS |
| E8 | AC-8 | test | PASS |
| E9 | AC-9 | test | PASS |
| E10 | AC-9 | test | PASS |
| E11 | AC-9 | test | FAIL |
| E12 | AC-7 | ui-check | PASS |
| E13 | AC-10 | test | PASS |

## Evidence

- eval: E1
  run_id: minted-s03-llm-doc-toan-bo-E1-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.ls1_db
  verified_at: 2026-11-02T22:15:06Z
  output: |
    cmd: cd agent && node --import tsx --test --test-concurrency=1 tests/doc-toan-bo-db.itest.ts
    duration_ms 14013.700583

- eval: E2
  run_id: minted-s03-llm-doc-toan-bo-E2-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.ls1_thuan
  verified_at: 2026-11-02T22:15:06Z
  output: |
    cmd: cd agent && node --import tsx --test tests/doc-toan-bo.test.ts
    duration_ms 204.995875

- eval: E3
  run_id: minted-s03-llm-doc-toan-bo-E3-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.ls1_db
  verified_at: 2026-11-02T22:15:06Z
  output: |
    cmd: cd agent && node --import tsx --test --test-concurrency=1 tests/doc-toan-bo-db.itest.ts
    duration_ms 14013.700583

- eval: E4
  run_id: minted-s03-llm-doc-toan-bo-E4-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.ls1_db
  verified_at: 2026-11-02T22:15:06Z
  output: |
    cmd: cd agent && node --import tsx --test --test-concurrency=1 tests/doc-toan-bo-db.itest.ts
    duration_ms 14013.700583

- eval: E5
  run_id: minted-s03-llm-doc-toan-bo-E5-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.ls1_db
  verified_at: 2026-11-02T22:15:06Z
  output: |
    cmd: cd agent && node --import tsx --test --test-concurrency=1 tests/doc-toan-bo-db.itest.ts
    duration_ms 14013.700583

- eval: E6
  run_id: minted-s03-llm-doc-toan-bo-E6-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.ls1_db
  verified_at: 2026-11-02T22:15:06Z
  output: |
    cmd: cd agent && node --import tsx --test --test-concurrency=1 tests/doc-toan-bo-db.itest.ts
    duration_ms 14013.700583

- eval: E7
  run_id: minted-s03-llm-doc-toan-bo-E7-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.ls1_db
  verified_at: 2026-11-02T22:15:06Z
  output: |
    cmd: cd agent && node --import tsx --test --test-concurrency=1 tests/doc-toan-bo-db.itest.ts
    duration_ms 14013.700583

- eval: E8
  run_id: minted-s03-llm-doc-toan-bo-E8-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.ls1_db
  verified_at: 2026-11-02T22:15:06Z
  output: |
    cmd: cd agent && node --import tsx --test --test-concurrency=1 tests/doc-toan-bo-db.itest.ts
    duration_ms 14013.700583

- eval: E9
  run_id: minted-s03-llm-doc-toan-bo-E9-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.ls1_db
  verified_at: 2026-11-02T22:15:06Z
  output: |
    cmd: cd agent && node --import tsx --test --test-concurrency=1 tests/doc-toan-bo-db.itest.ts
    duration_ms 14013.700583

- eval: E10
  run_id: minted-s03-llm-doc-toan-bo-E10-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.agent
  verified_at: 2026-11-02T22:15:06Z
  output: |
    cmd: cd agent && npm test
    duration_ms 15584.465333

- eval: E11
  run_id: minted-s03-llm-doc-toan-bo-E11-r1
  exit_code: 1
  baseline: n-a
  verifier: config:executors.test.pipeline
  verified_at: 2026-11-02T22:15:06Z
  output: |
    cmd: cd pipeline && npm test
    Postgres báo deadlock giữa hai tiến trình (deadlock.c, DeadLockReport).
    Ca VL-AC-5 (scripts/vocab-lint.test.mjs:167) đỏ: cây thật còn chỗ viết tay ngoài sổ:
    app/src/components/ops/review-card.tsx:270 · listing_intent · offer,inquiry,not_listing

- eval: E13
  run_id: minted-s03-llm-doc-toan-bo-E13-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.ls1_db
  verified_at: 2026-11-02T22:15:06Z
  output: |
    cmd: cd agent && node --import tsx --test --test-concurrency=1 tests/doc-toan-bo-db.itest.ts
    duration_ms 14013.700583

- eval: E12
  run_id: minted-s03-llm-doc-toan-bo-E12-r1
  exit_code: 0
  baseline: n-a
  verifier: scripts/ui-capture.sh
  verified_at: 2026-11-02T22:15:06Z
  screenshot: evidence/E12-step1.png
  observed: |
    E12-step1.png: Trang Hang duyet, tai khoan ops-role-test@local.test vai Van hanh. Danh sach "1 the", dung 1 dong "Bo sung du lieu: t_ls1_e12 (4 truong)" #177875, loai Bo sung tin, trang thai Cho duyet. E12-step2.png: ngan keo the mo, muc Loai hinh "Luat va AI khac nhau - chon mot ben" (Dat theo luat, Can ho theo AI claude-haiku-5.5, trich dan), muc Doi chieu "AI va bo doc khac nhau" co hai khoi: Y dinh tin (Bo doc Tin rao, AI Yeu cau, trich "can mua can ho") va Gia rao (Bo doc 3.000.000.000 d, AI 5.000.000.000 d, trich "gia 5 ty"). Co toan van tin, o Ly do, nut Ap dung/Bo/De sau. Khop expected. Ghi chu: capture.ui khoa cung tai khoan admin va khong mo the nen dung playwright-cli truc tiep.
  network_observed: clean

### Lệnh suite (hồi quy)

- cmd: cd app && npx tsc --noEmit && npm run lint
  run_id: minted-s03-llm-doc-toan-bo-SUITE-lint-r1
  exit_code: 0
  verified_at: 2026-11-02T22:15:06Z

- cmd: cd app && npm test
  run_id: minted-s03-llm-doc-toan-bo-SUITE-npm_test-r1
  exit_code: 1
  verified_at: 2026-11-02T22:15:06Z

- cmd: cd app && npm run test:lint-rules
  run_id: minted-s03-llm-doc-toan-bo-SUITE-test_lint_rules-r1
  exit_code: 0
  verified_at: 2026-11-02T22:15:06Z

- cmd: node scripts/check-portal-compliance.mjs
  run_id: minted-s03-llm-doc-toan-bo-SUITE-node_scripts_check_portal_compliance_mjs-r1
  exit_code: 0
  verified_at: 2026-11-02T22:15:06Z

## Known limits

## Ngoài hợp đồng

## Analyst

Lệnh fail không gắn eval: `cd app && npm test` thoát 1 (795 test, 794 qua, 1 đỏ). Ca đỏ: GV-AC-3 trong app/tests/gio-ops-gio-vn.test.tsx, báo mẫu «toLocale không múi» ở app/src/components/ops/review-card.tsx. Đây là lỗi hồi quy do chính feature thêm khối đối chiếu vào review-card.tsx, cùng gốc với ca VL-AC-5 làm E11 đỏ (tệp review-card.tsx dòng 270).

E11 còn có dấu hiệu deadlock Postgres giữa hai tiến trình khi chạy bộ pipeline; cần chạy lại để tách lỗi hạ tầng khỏi lỗi VL-AC-5.

Eval không-phân-biệt (xanh cả HEAD lẫn baseline): none — không eval nào có số đo baseline (toàn n-a, xem mục dưới), nên chưa kết luận được eval nào phân biệt.

Baseline khong do
- cd agent && node --import tsx --test --test-concurrency=1 tests/doc-toan-bo-db.itest.ts: bo qua baseline: tep agent/tests/doc-toan-bo-db.itest.ts co o cay dang kiem nhung chua co o merge-base 610a924a817ce9515d54898025b8927c71803ef3 — eval moi, chay tren code cu khong phan biet gi
- cd agent && node --import tsx --test tests/doc-toan-bo.test.ts: bo qua baseline: tep agent/tests/doc-toan-bo.test.ts co o cay dang kiem nhung chua co o merge-base 610a924a817ce9515d54898025b8927c71803ef3 — eval moi, chay tren code cu khong phan biet gi
- cd agent && npm test: baseline vuot tran 180 giay/lenh — da dung ca cay tien trinh; BLOCKED ha tang, khong phai ket qua cua code cu
- cd pipeline && npm test: baseline vuot tran 180 giay/lenh — da dung ca cay tien trinh; BLOCKED ha tang, khong phai ket qua cua code cu

Judge panel: không có panel nào được đề xuất cho vòng này; không có judgment item.

## Variance

none — mọi eval chạy một lần (runs: 1), không có eval ngẫu nhiên.

## Iterations

Round 1: E11 failed — ca VL-AC-5 báo review-card.tsx:270 viết tay nhãn ý định ngoài sổ từ vựng; lệnh suite app npm test cũng đỏ ở GV-AC-3 vì cùng tệp. Returned to implementation.
