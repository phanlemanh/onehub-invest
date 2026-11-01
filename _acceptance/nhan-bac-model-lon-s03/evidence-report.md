---
schema_version: 2
feature_slug: nhan-bac-model-lon-s03
verdict: REJECT
failed_evals: []
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: 1ea804672eeed37ac97095a67beb6edeb8de0781
human_signoff:
---

# Evidence Report: nhan-bac-model-lon-s03

Vòng 1. Chín eval máy (E1–E9) đều xanh, nhưng hai lệnh suite hồi quy không gắn eval nào (`cd app && npm test`, `cd pipeline && npm test`) đỏ, nên verdict là REJECT. E10 là mục judgment, hội đồng đề xuất PASS, `human_override` để trống cho người quyết ở Cổng 2.

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
| E10 | AC-10 | judgment | PASS (đề xuất của hội đồng, chờ người) |

## Evidence

- eval: E1
  run_id: minted-nhan-bac-model-lon-s03-E1-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.nhan_bac_db
  verified_at: 2026-11-01T01:09:21Z
  output: |
    cd agent && node --import tsx --test tests/nhan-bac-s03-db.itest.ts
    ℹ duration_ms 186531.583625

- eval: E2
  run_id: minted-nhan-bac-model-lon-s03-E2-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.nhan_bac_db
  verified_at: 2026-11-01T01:09:21Z
  output: |
    cd agent && node --import tsx --test tests/nhan-bac-s03-db.itest.ts
    ℹ duration_ms 186531.583625

- eval: E3
  run_id: minted-nhan-bac-model-lon-s03-E3-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.nhan_bac_db
  verified_at: 2026-11-01T01:09:21Z
  output: |
    cd agent && node --import tsx --test tests/nhan-bac-s03-db.itest.ts
    ℹ duration_ms 186531.583625

- eval: E4
  run_id: minted-nhan-bac-model-lon-s03-E4-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.nhan_bac
  verified_at: 2026-11-01T01:09:21Z
  output: |
    cd agent && node --import tsx --test tests/nhan-bac-s03.test.ts
    ℹ duration_ms 614.572333

- eval: E5
  run_id: minted-nhan-bac-model-lon-s03-E5-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.nhan_bac
  verified_at: 2026-11-01T01:09:21Z
  output: |
    cd agent && node --import tsx --test tests/nhan-bac-s03.test.ts
    ℹ duration_ms 614.572333

- eval: E6
  run_id: minted-nhan-bac-model-lon-s03-E6-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.nhan_bac
  verified_at: 2026-11-01T01:09:21Z
  output: |
    cd agent && node --import tsx --test tests/nhan-bac-s03.test.ts
    ℹ duration_ms 614.572333

- eval: E7
  run_id: minted-nhan-bac-model-lon-s03-E7-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.nhan_bac
  verified_at: 2026-11-01T01:09:21Z
  output: |
    cd agent && node --import tsx --test tests/nhan-bac-s03.test.ts
    ℹ duration_ms 614.572333

- eval: E8
  run_id: minted-nhan-bac-model-lon-s03-E8-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.nhan_bac
  verified_at: 2026-11-01T01:09:21Z
  output: |
    cd agent && node --import tsx --test tests/nhan-bac-s03.test.ts
    ℹ duration_ms 614.572333

- eval: E9
  run_id: minted-nhan-bac-model-lon-s03-E9-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.nhan_bac
  verified_at: 2026-11-01T01:09:21Z
  output: |
    cd agent && node --import tsx --test tests/nhan-bac-s03.test.ts
    ℹ duration_ms 614.572333

### Judgment

Hội đồng đề xuất PASS cho E10 (AC-10). Ba phiếu dưới đây chỉ là tham khảo, `human_override` để trống cho người quyết ở Cổng 2.

- eval: E10
  judged_by: hội đồng ba lăng kính (fresh context)
  proposal: PASS
  votes:
  - domain-correctness: PASS — Cả ba backend cùng ghi băm `9f1ee427822a3f7c` và đủ các cột: ý định đúng, bán/thuê trên offer, Yêu cầu bắt, JSON hỏng, trích giả, p50, chi phí 61 bài và ước hết bài cũ. Ba ô đạt/không khớp bảng số: tỉ lệ 100/97, 93/94, 97/91 so với ngưỡng 95%; chi phí ước ~6,07 và ~1,61 USD, cùng ≤ 10 USD. Phép nhân 61 sang 38.000 khớp (0,0097 cho ~6,04 và 0,0026 cho ~1,62, chỉ lệch do làm tròn). Tệp không chép chữ bài nào, không có câu rao hay số điện thoại.
  - operational-feasibility: PASS — Cả ba backend ghi cùng băm `9f1ee427822a3f7c` và đủ các cột. Các ô đạt/không khớp bảng: Qwen 100% và 97% đạt; Haiku 93% và 94% không đạt, chi phí ~6,07 USD đạt; Decisions 97% đạt, 91% không đạt, ~1,61 USD đạt. Số học khớp: 57/61=93%, 59/61=97%, 33/34=97%, 32/34=94%, 31/34=91%, 0,0097 và 0,0026 USD nhân 38000/61 ra ~6 và ~1,6 USD (lệch nhỏ do làm tròn), 3,01 s nhân 38000 ra ~31,8 giờ. Tệp không có chữ bài nguyên văn, câu rao dài hay số điện thoại, và tự ghi là không chép chữ bài.
  - spec-alignment: PASS — Bảng có đủ ba backend, cùng băm `9f1ee427822a3f7c`, và đủ các cột: ý định, bán/thuê trên offer, Yêu cầu bắt, JSON hỏng, trích giả, p50, chi phí 61 bài và ước hết bài cũ. Ba ô đạt/không khớp bảng số. Qwen: 100% và 97% đạt, local nên không áp ngưỡng chi phí. Haiku: 93% và 94% không đạt, ~6,07 USD đạt. Decisions: 97% đạt, 91% không đạt, ~1,61 USD đạt. Chi phí hết bài cũ khớp công thức chi phí 61 bài × 38.000 / 61 (kiểm lại ra khoảng 6,04 và 1,62, lệch do làm tròn chi phí 61 bài). Tệp không có chữ bài nguyên văn hay số điện thoại, và tự nói không chép chữ bài nào.
  human_override:  # chi nguoi ghi

### Lệnh suite (hồi quy)

- cmd: cd agent && npm test
  run_id: minted-nhan-bac-model-lon-s03-SUITE-npm_test__bb6271-r1
  exit_code: 0
  verified_at: 2026-11-01T01:09:21Z

- cmd: cd app && npx tsc --noEmit && npm run lint
  run_id: minted-nhan-bac-model-lon-s03-SUITE-lint-r1
  exit_code: 0
  verified_at: 2026-11-01T01:09:21Z

- cmd: cd app && npm test
  run_id: minted-nhan-bac-model-lon-s03-SUITE-npm_test__bd9a35-r1
  exit_code: 1
  verified_at: 2026-11-01T01:09:21Z
  note: đỏ ở `tests/the-duyet-du-can-cu.test.tsx` (hook `after`, khẳng định «public đã bị chạm»). Đếm hàng bảng public lệch bản ghim: properties 30962 so với 30958, property_offers 34092 so với 34088 (cùng lệch +4). Lệnh này không gắn eval nào.

- cmd: cd pipeline && npm test
  run_id: minted-nhan-bac-model-lon-s03-SUITE-npm_test__13563d-r1
  exit_code: 1
  verified_at: 2026-11-01T01:09:21Z
  note: 357/358 đạt. Đỏ ở `scripts/vocab-lint.test.mjs` ca VL-AC-5 («cây thật còn chỗ viết tay ngoài sổ»): bốn chỗ viết tay trong `agent/src/agents/nhan-bac-s03.ts` (dòng 35 hai chỗ, dòng 95, dòng 104) cho `kind` và `listing_intent`. Lệnh này không gắn eval nào.

- cmd: cd app && npm run test:lint-rules
  run_id: minted-nhan-bac-model-lon-s03-SUITE-test_lint_rules-r1
  exit_code: 0
  verified_at: 2026-11-01T01:09:21Z

- cmd: node scripts/check-portal-compliance.mjs
  run_id: minted-nhan-bac-model-lon-s03-SUITE-node_scripts_check_portal_compliance_mjs-r1
  exit_code: 0
  verified_at: 2026-11-01T01:09:21Z

## Known limits

## Ngoài hợp đồng

## Analyst

none — mọi eval feature đều không đo được trên baseline (baseline n-a), nên không có eval nào bị phát hiện là không-phân-biệt.

Baseline không đo
- cd agent && node --import tsx --test tests/nhan-bac-s03-db.itest.ts: bo qua baseline: tep agent/tests/nhan-bac-s03-db.itest.ts co o cay dang kiem nhung chua co o merge-base e8471111ab56a54d146caac220f8dc2bfca449f6 — eval moi, chay tren code cu khong phan biet gi
- cd agent && node --import tsx --test tests/nhan-bac-s03.test.ts: bo qua baseline: tep agent/tests/nhan-bac-s03.test.ts co o cay dang kiem nhung chua co o merge-base e8471111ab56a54d146caac220f8dc2bfca449f6 — eval moi, chay tren code cu khong phan biet gi

Lệnh fail không gắn eval: `cd app && npm test` và `cd pipeline && npm test` (chi tiết ở khối Lệnh suite).

## Variance

none — mọi eval đều chạy một lần, tất định, không có pass_rate lẫn lộn.

## Iterations

Round 1: hai lệnh suite hồi quy không gắn eval (`cd app && npm test`, `cd pipeline && npm test`) đỏ — app: bộ đếm hàng bảng public lệch bản ghim (+4 properties, +4 property_offers); pipeline: cổng vocab-lint thấy 4 chỗ viết tay enum listing_intent/kind trong `agent/src/agents/nhan-bac-s03.ts`. Trả lại cho bước triển khai.
