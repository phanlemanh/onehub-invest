---
schema_version: 2
feature_slug: freshness-theo-nguon-that
verdict: PASS
failed_evals: []
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: 09726f83e9228c7c1e89138f188c15cc639cb23c
human_signoff:
---

# Evidence Report: freshness-theo-nguon-that

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
| E9 | AC-9 | judgment | PASS |

## Evidence

- eval: E1
  run_id: minted-freshness-theo-nguon-that-E1-r1
  exit_code: 0
  baseline: green
  verifier: config:executors.test.scripts
  verified_at: 2026-10-23T11:25:45Z
  output: |
    Lệnh: node --test scripts/*.test.mjs (một lần chạy, runs 1, passes 1, không phương sai)
    Ca AC-1 (gộp max hai source_id → fresh; chiều đỏ snapshot 9 ngày → stale) nằm trong bộ này, không skip.
    Đuôi lệnh: __EXIT=0

- eval: E2
  run_id: minted-freshness-theo-nguon-that-E2-r1
  exit_code: 0
  baseline: green
  verifier: config:executors.test.scripts
  verified_at: 2026-10-23T11:25:45Z
  output: |
    Lệnh: node --test scripts/*.test.mjs (một lần chạy, runs 1, passes 1, không phương sai)
    Ca AC-2 (S02 đọc airdna_markets → một hàng S02/vn fresh; chiều đỏ 36 ngày → stale) nằm trong bộ này, không skip.
    Đuôi lệnh: __EXIT=0

- eval: E3
  run_id: minted-freshness-theo-nguon-that-E3-r1
  exit_code: 0
  baseline: green
  verifier: config:executors.test.scripts
  verified_at: 2026-10-23T11:25:45Z
  output: |
    Lệnh: node --test scripts/*.test.mjs (một lần chạy, runs 1, passes 1, không phương sai)
    Ca AC-3 (S03/S05 tách theo agent_id; chiều đỏ S05 13 giờ → stale, S03 vẫn fresh) nằm trong bộ này, không skip.
    Đuôi lệnh: __EXIT=0

- eval: E4
  run_id: minted-freshness-theo-nguon-that-E4-r1
  exit_code: 0
  baseline: green
  verifier: config:executors.test.scripts
  verified_at: 2026-10-23T11:25:45Z
  output: |
    Lệnh: node --test scripts/*.test.mjs (một lần chạy, runs 1, passes 1, không phương sai)
    Ca AC-4 (S06 theo thành phố của snapshot: hanoi fresh, hcmc stale) nằm trong bộ này, không skip.
    Đuôi lệnh: __EXIT=0

- eval: E5
  run_id: minted-freshness-theo-nguon-that-E5-r1
  exit_code: 0
  baseline: green
  verifier: config:executors.test.scripts
  verified_at: 2026-10-23T11:25:45Z
  output: |
    Lệnh: node --test scripts/*.test.mjs (một lần chạy, runs 1, passes 1, không phương sai)
    Ca AC-5 (S04 completed không đo, mã thiếu SLO → no-slo; bảng SLO năm giá trị giờ) nằm trong bộ này, không skip.
    Đuôi lệnh: __EXIT=0

- eval: E6
  run_id: minted-freshness-theo-nguon-that-E6-r1
  exit_code: 0
  baseline: green
  verifier: config:executors.test.scripts
  verified_at: 2026-10-23T11:25:45Z
  output: |
    Lệnh: node --test scripts/*.test.mjs (một lần chạy, runs 1, passes 1, không phương sai)
    Ca AC-6 (không ghép chéo thành phố, mã không dữ liệu → đúng một none; chiều đỏ bỏ S01/hcmc) nằm trong bộ này, không skip.
    Đuôi lệnh: __EXIT=0

- eval: E7
  run_id: minted-freshness-theo-nguon-that-E7-r1
  exit_code: 0
  baseline: green
  verifier: config:executors.test.scripts
  verified_at: 2026-10-23T11:25:45Z
  output: |
    Lệnh: node --test scripts/*.test.mjs (một lần chạy, runs 1, passes 1, không phương sai)
    Các ca CLI thật trên schema tạm của AC-7 (thoát mọi hàng fresh, S05 13 giờ / SLO 12, none/no-slo, webhook một body, chuỗi canh vắng khỏi đầu ra) nằm trong bộ này, không skip.
    Đuôi lệnh: __EXIT=0

- eval: E8
  run_id: minted-freshness-theo-nguon-that-E8-r1
  exit_code: 0
  baseline: green
  verifier: config:executors.test.scripts
  verified_at: 2026-10-23T11:25:45Z
  output: |
    Lệnh: node --test scripts/*.test.mjs (một lần chạy, runs 1, passes 1, không phương sai)
    Ca chẩn đoán «AC-8 DB hiện tại» nằm trong bộ này; kết quả máy của eval là đạt.
    Đuôi lệnh: __EXIT=0

### Lệnh suite (hồi quy)

- cmd: cd agent && npm test
  run_id: minted-freshness-theo-nguon-that-SUITE-npm_test__bb6271-r1
  exit_code: 0
  verified_at: 2026-10-23T11:25:45Z

- cmd: cd app && npx tsc --noEmit && npm run lint
  run_id: minted-freshness-theo-nguon-that-SUITE-lint-r1
  exit_code: 0
  verified_at: 2026-10-23T11:25:45Z

- cmd: cd app && npm test
  run_id: minted-freshness-theo-nguon-that-SUITE-npm_test__bd9a35-r1
  exit_code: 0
  verified_at: 2026-10-23T11:25:45Z

- cmd: cd pipeline && npm test
  run_id: minted-freshness-theo-nguon-that-SUITE-npm_test__13563d-r1
  exit_code: 0
  verified_at: 2026-10-23T11:25:45Z

- cmd: cd app && npm run test:lint-rules
  run_id: minted-freshness-theo-nguon-that-SUITE-test_lint_rules-r1
  exit_code: 0
  verified_at: 2026-10-23T11:25:45Z

- cmd: node scripts/check-portal-compliance.mjs
  run_id: minted-freshness-theo-nguon-that-SUITE-node_scripts_check_portal_compliance_mjs-r1
  exit_code: 0
  verified_at: 2026-10-23T11:25:45Z

### Judgment

- eval: E9
  judged_by: hội đồng judge (fresh context) — ba lens: domain-correctness, operational-feasibility, spec-alignment
  verdict: PASS
  rationale: Ba lens đều thấy SKILL.md và chú thích đầu check-freshness.mjs khớp nhau và khớp contract về bảng đo của từng mã và SLO từng mã; S04 không đo; có mô tả --json. Mục «Độ tươi» trong CONTEXT.md chỉ là định nghĩa chung, không mâu thuẫn.
  panel_votes:
    - domain-correctness: PASS — SKILL.md và chú thích đầu check-freshness.mjs cùng nêu bảng của từng mã (S01 airbnb_snapshots, S02 airdna_markets, S03 và S05 stg_zalo_posts tách theo agent_id, S06 stg_chotot_ads) và SLO từng mã (8 ngày, 35 ngày, 3 ngày, 12 giờ, 36 giờ). Cả hai nói S04 không đo vì địa giới đã thu xong, và nêu cờ --json cùng các trường hàng, khớp AC-5 và AC-7. Mục «Độ tươi» trong CONTEXT.md chỉ là định nghĩa ngắn, đúng và không mâu thuẫn. Không file nào còn nói mọi nguồn đọc từ bảng snapshot.
    - operational-feasibility: PASS — SKILL.md và chú thích đầu check-freshness.mjs cùng nêu bảng đo của từng mã và SLO khớp contract (S01 8 ngày, S02 35 ngày, S03 3 ngày, S05 12 giờ, S06 36 giờ). Cả hai cũng nói S04 không đo vì đã xong và mô tả --json. Mục «Độ tươi» trong CONTEXT.md chỉ định nghĩa chung, không câu nào nói mọi nguồn đọc từ bảng snapshot, và không lệch phạm vi contract.
    - spec-alignment: PASS — SKILL.md bước 1 và chú thích đầu check-freshness.mjs khớp nhau và khớp contract. Cả hai nêu bảng đo của từng mã và SLO, nói S04 không đo vì địa giới đã thu xong, và mô tả --json với các trường {code, city, last, ageHours, sloHours, status}. Mục «Độ tươi» trong CONTEXT.md chỉ định nghĩa chung nên không mâu thuẫn. Không câu nào trong ba nơi còn nói mọi nguồn đọc từ bảng snapshot.
  human_override:  # chi nguoi ghi

## Known limits

## Ngoài hợp đồng

## Analyst

Eval không-phân-biệt (xanh trên cả HEAD lẫn baseline): lệnh `node --test scripts/*.test.mjs` — E1, E2, E3, E4, E5, E6, E7, E8. Cần viết lại để assert hành vi mới hoặc xác nhận là regression-guard có chủ ý.

## Variance

none — every multi-run eval is uniform

## Iterations

Round 1: E1–E9 đều đạt — không eval nào hỏng. Các lỗi ngoài hợp đồng nằm ở review-findings.md để người quyết ở Gate 2.
