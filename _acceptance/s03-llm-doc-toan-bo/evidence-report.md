---
schema_version: 2
feature_slug: s03-llm-doc-toan-bo
verdict: PASS
failed_evals: []
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: 55a3eb3a922168382ebcfc09d05b33b5e9f40567
human_signoff: Mạnh 2026-11-03
---

# Evidence Report: s03-llm-doc-toan-bo

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
| E11 | AC-9 | test | PASS |
| E12 | AC-7 | ui-check | PASS |
| E13 | AC-10 | test | PASS |

## Evidence

- eval: E1
  run_id: minted-s03-llm-doc-toan-bo-E1-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.ls1_db
  verified_at: 2026-11-02T23:04:33Z

- eval: E2
  run_id: minted-s03-llm-doc-toan-bo-E2-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.ls1_thuan
  verified_at: 2026-11-02T23:04:33Z

- eval: E3
  run_id: minted-s03-llm-doc-toan-bo-E3-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.ls1_db
  verified_at: 2026-11-02T23:04:33Z

- eval: E4
  run_id: minted-s03-llm-doc-toan-bo-E4-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.ls1_db
  verified_at: 2026-11-02T23:04:33Z

- eval: E5
  run_id: minted-s03-llm-doc-toan-bo-E5-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.ls1_db
  verified_at: 2026-11-02T23:04:33Z

- eval: E6
  run_id: minted-s03-llm-doc-toan-bo-E6-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.ls1_db
  verified_at: 2026-11-02T23:04:33Z

- eval: E7
  run_id: minted-s03-llm-doc-toan-bo-E7-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.ls1_db
  verified_at: 2026-11-02T23:04:33Z

- eval: E8
  run_id: minted-s03-llm-doc-toan-bo-E8-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.ls1_db
  verified_at: 2026-11-02T23:04:33Z

- eval: E9
  run_id: minted-s03-llm-doc-toan-bo-E9-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.ls1_db
  verified_at: 2026-11-02T23:04:33Z

- eval: E10
  run_id: minted-s03-llm-doc-toan-bo-E10-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.agent
  verified_at: 2026-11-02T23:04:33Z

- eval: E11
  run_id: minted-s03-llm-doc-toan-bo-E11-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.pipeline
  verified_at: 2026-11-02T23:04:33Z

- eval: E12
  run_id: minted-s03-llm-doc-toan-bo-E12-r2
  exit_code: 0
  baseline: n-a
  verifier: scripts/ui-capture-login.mjs
  verified_at: 2026-11-02T23:04:33Z
  screenshot: evidence/E12-step1.png
  observed: |
    E12-step1.png (đọc trực tiếp): trang Hàng duyệt dưới vai Vận hành, bộ lọc "Mọi loại / Chờ duyệt", "1 thẻ", đúng một dòng "Bổ sung dữ liệu: t_ls1_e12 (4 trường)", loại Bổ sung tin, trạng thái Chờ duyệt.
    E12-step2.png: ngăn chi tiết thẻ mở. Mục "Loại hình" nhãn "Luật và AI khác nhau — chọn một bên": Đất (Theo luật) và Căn hộ (Theo AI, trích dẫn), nút Chọn luật / Chọn AI / Bỏ cả hai. Mục "Đối chiếu" nhãn "AI và bộ đọc khác nhau": Ý định tin (Bộ đọc: Tin rao, AI: Yêu cầu, trích «cần mua căn hộ») và Giá rao (Bộ đọc: 3.00 tỷ, AI: 5.00 tỷ, trích «giá 5 tỷ»), có toàn văn tin. Khớp Expected.
  network_observed: n-a (driver)

### Lệnh suite (hồi quy)

- cmd: cd app && npx tsc --noEmit && npm run lint
  run_id: minted-s03-llm-doc-toan-bo-SUITE-lint-r2
  exit_code: 0
  verified_at: 2026-11-02T23:04:33Z

- cmd: cd app && npm test
  run_id: minted-s03-llm-doc-toan-bo-SUITE-npm_test-r2
  exit_code: 0
  verified_at: 2026-11-02T23:04:33Z

- cmd: cd app && npm run test:lint-rules
  run_id: minted-s03-llm-doc-toan-bo-SUITE-test_lint_rules-r2
  exit_code: 0
  verified_at: 2026-11-02T23:04:33Z

- cmd: node scripts/check-portal-compliance.mjs
  run_id: minted-s03-llm-doc-toan-bo-SUITE-node_scripts_check_portal_compliance_mjs-r2
  exit_code: 0
  verified_at: 2026-11-02T23:04:33Z

## Known limits

## Ngoài hợp đồng

## Analyst

none — moi eval feature deu red tren baseline (co phan biet)

Ghi chú: baseline của mọi eval ở round này đều là n-a (xem mục dưới), nên chưa có eval nào được chứng minh red trên code cũ.

Baseline khong do
- cd agent && node --import tsx --test --test-concurrency=1 tests/doc-toan-bo-db.itest.ts && cd ../app && node --import tsx --test --test-name-pattern=LS1-AC-7 tests/the-duyet-du-can-cu.test.tsx: bo qua baseline: tep agent/tests/doc-toan-bo-db.itest.ts co o cay dang kiem nhung chua co o merge-base 610a924a817ce9515d54898025b8927c71803ef3 — eval moi, chay tren code cu khong phan biet gi
- cd agent && node --import tsx --test tests/doc-toan-bo.test.ts: bo qua baseline: tep agent/tests/doc-toan-bo.test.ts co o cay dang kiem nhung chua co o merge-base 610a924a817ce9515d54898025b8927c71803ef3 — eval moi, chay tren code cu khong phan biet gi
- cd agent && npm test: baseline vuot tran 180 giay/lenh — da dung ca cay tien trinh; BLOCKED ha tang, khong phai ket qua cua code cu
- cd pipeline && npm test: baseline vuot tran 180 giay/lenh — da dung ca cay tien trinh; BLOCKED ha tang, khong phai ket qua cua code cu

## Variance

none — every multi-run eval is uniform

## Iterations

Round 1: lịch sử round trước nằm ở các lần ghi trước của hồ sơ này; nội dung round 2 thay thế toàn bộ.
Round 2: tất cả eval E1-E13 và bốn lệnh suite đạt; không có judgment item; không có eval ngẫu nhiên.

### Re-pin lần 1 — 2026-11-03, do gộp main sau chữ ký
run_id: repin-20261103T014102Z-58691
sha: 17ee143a391321367004b05466fe48f707a1cb16 · suites: 6 lệnh exit 0 · evals: 12/12 eval máy đạt kỳ vọng · ngoài làn máy: E12

### Re-pin lần 2 — 2026-11-03, do sửa ca LS1-AC-7 cho job app, gộp main sau chữ ký
run_id: repin-20261103T034415Z-15668
sha: 55a3eb3a922168382ebcfc09d05b33b5e9f40567 · suites: 6 lệnh exit 0 · evals: 12/12 eval máy đạt kỳ vọng · ngoài làn máy: E12
