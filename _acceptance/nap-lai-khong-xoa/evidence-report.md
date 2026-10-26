---
schema_version: 2
feature_slug: nap-lai-khong-xoa
verdict: REJECT
failed_evals: ["E12","E13"]
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: 6b18cbc3c5610dd0b4a8b79c396f71685f855d5c
human_signoff:
---

# Evidence Report: nap-lai-khong-xoa

Round 1. Hai eval E12 (`cd app && npm test`) và E13 (`cd agent && npm test`) đỏ; 12 eval còn lại và hai lệnh suite xanh.

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | test | PASS |
| E2 | AC-2 | test | PASS |
| E3 | AC-3 | test | PASS |
| E4 | AC-4 | test | PASS |
| E5 | AC-5 | test | PASS |
| E6 | AC-6 | test | PASS |
| E7 | AC-7 | script | PASS |
| E8 | AC-8 | test | PASS |
| E9 | AC-9 | test | PASS |
| E9b | AC-9 | test | PASS |
| E10 | AC-10 | script | PASS |
| E11 | AC-2 | test | PASS |
| E12 | AC-2 | test | FAIL |
| E13 | AC-2 | test | FAIL |

## Evidence

- eval: E1
  run_id: minted-nap-lai-khong-xoa-E1-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.nap_lai_db
  verified_at: 2026-10-26T09:01:20Z
  output: |
    cd pipeline && node --test scripts/nap-lai-db.itest.mjs
    ℹ duration_ms 143906.302417

- eval: E2
  run_id: minted-nap-lai-khong-xoa-E2-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.nap_lai_db
  verified_at: 2026-10-26T09:01:20Z
  output: |
    cd pipeline && node --test scripts/nap-lai-db.itest.mjs
    ℹ duration_ms 143906.302417

- eval: E3
  run_id: minted-nap-lai-khong-xoa-E3-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.nap_lai_db
  verified_at: 2026-10-26T09:01:20Z
  output: |
    cd pipeline && node --test scripts/nap-lai-db.itest.mjs
    ℹ duration_ms 143906.302417

- eval: E5
  run_id: minted-nap-lai-khong-xoa-E5-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.nap_lai_db
  verified_at: 2026-10-26T09:01:20Z
  output: |
    cd pipeline && node --test scripts/nap-lai-db.itest.mjs
    ℹ duration_ms 143906.302417

- eval: E6
  run_id: minted-nap-lai-khong-xoa-E6-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.nap_lai_db
  verified_at: 2026-10-26T09:01:20Z
  output: |
    cd pipeline && node --test scripts/nap-lai-db.itest.mjs
    ℹ duration_ms 143906.302417

- eval: E9
  run_id: minted-nap-lai-khong-xoa-E9-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.nap_lai_db
  verified_at: 2026-10-26T09:01:20Z
  output: |
    cd pipeline && node --test scripts/nap-lai-db.itest.mjs
    ℹ duration_ms 143906.302417

- eval: E4
  run_id: minted-nap-lai-khong-xoa-E4-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.nap_lai
  verified_at: 2026-10-26T09:01:20Z
  output: |
    cd pipeline && node --test scripts/nap-lai.test.mjs
    ℹ duration_ms 55.466708

- eval: E8
  run_id: minted-nap-lai-khong-xoa-E8-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.nap_lai
  verified_at: 2026-10-26T09:01:20Z
  output: |
    cd pipeline && node --test scripts/nap-lai.test.mjs
    ℹ duration_ms 55.466708

- eval: E7
  run_id: minted-nap-lai-khong-xoa-E7-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.nap_lai_ba_luot
  verified_at: 2026-10-26T09:01:20Z
  output: |
    node pipeline/scripts/nap-lai-ba-luot.mjs
    nap-lai-ba-luot: 3 lượt · mất 0 quyết định · mất 0 liên kết

- eval: E9b
  run_id: minted-nap-lai-khong-xoa-E9b-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.pipeline
  verified_at: 2026-10-26T09:01:20Z
  output: |
    cd pipeline && npm test
    ℹ duration_ms 172707.581875

- eval: E10
  run_id: minted-nap-lai-khong-xoa-E10-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.cloud_catchup_static
  verified_at: 2026-10-26T09:01:20Z
  output: |
    node scripts/check-cloud-catchup.mjs nap-lai-khong-xoa
    check-cloud-catchup nap-lai-khong-xoa: 2 tệp · 0 vi phạm

- eval: E11
  run_id: minted-nap-lai-khong-xoa-E11-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.app
  verified_at: 2026-10-26T09:01:20Z
  output: |
    cd app && npx tsc --noEmit && npm run lint
    (không có dòng lỗi)

- eval: E12
  run_id: minted-nap-lai-khong-xoa-E12-r1
  exit_code: 1
  baseline: n-a
  verifier: config:executors.test.app_ui
  verified_at: 2026-10-26T09:01:20Z
  output: |
    cd app && npm test
    ℹ tests 467 · pass 466 · fail 1
    ✖ tests/finder-ranh-gioi.test.tsx — AU9-AC-8 Finder Hà Nội: trước khi áp có khu vực vượt bbox, sau khi áp mọi khu vực trong bbox vn-hanoi (2132 ms)
      error: relation "listing_records" does not exist (code 42P01)
      tại runReassign (pipeline/reassign-areas.mjs:179) ← tests/finder-ranh-gioi.test.tsx:67

- eval: E13
  run_id: minted-nap-lai-khong-xoa-E13-r1
  exit_code: 1
  baseline: n-a
  verifier: config:executors.test.agent
  verified_at: 2026-10-26T09:01:20Z
  output: |
    cd agent && npm test
    ℹ tests 63 · pass 62 · fail 1
    ✖ tests/enrich-db.test.ts — AC-3 block LLM khớp asset_nodes được áp tên chuẩn (2510 ms)
      error: deadlock detected (code 40P01)
      where: SQL statement "ALTER TABLE public.listings RENAME TO listing_records" (PL/pgSQL inline_code_block line 7)
      tại withTx (agent/tests/helpers/db.ts:34) ← tests/enrich-db.test.ts:196

### Lệnh suite (hồi quy)

- cmd: cd app && npm run test:lint-rules
  run_id: minted-nap-lai-khong-xoa-SUITE-test_lint_rules-r1
  exit_code: 0
  verified_at: 2026-10-26T09:01:20Z

- cmd: node scripts/check-portal-compliance.mjs
  run_id: minted-nap-lai-khong-xoa-SUITE-node_scripts_check_portal_compliance_mjs-r1
  exit_code: 0
  verified_at: 2026-10-26T09:01:20Z

## Known limits

## Ngoài hợp đồng

## Analyst

baseline: BLOCKED ha tang — lenh baseline khong chay dong nao (cong cu tu choi loi goi, hoac khong ghi duoc tep kich ban) — cong cu tra: «<\tool_use_error>Error: No such tool available: Write. Write is not among the tools available here. Continue with the tools you have.<\/tool_use_error>»

Mọi field baseline ghi n-a; danh sách eval không-phân-biệt bên dưới KHÔNG đo được ở round này.

Eval green trên cả HEAD lẫn baseline: none — moi eval feature deu red tren baseline (co phan biet). Lưu ý: câu này chỉ là mặc định khi danh sách rỗng; vì baseline BLOCKED nên không có số đo nào chứng minh điều đó.

Hai lệnh đỏ đều gắn eval (E12 và E13), không có lệnh đỏ nào ngoài eval:
- `cd app && npm test` gắn E12.
- `cd agent && npm test` gắn E13.

### Baseline khong do

- cd pipeline && node --test scripts/nap-lai-db.itest.mjs: BLOCKED ha tang baseline: lenh baseline khong chay dong nao (cong cu tu choi loi goi, hoac khong ghi duoc tep kich ban) — cong cu tra: «<\tool_use_error>Error: No such tool available: Write. Write is not among the tools available here. Continue with the tools you have.<\/tool_use_error>»
- cd pipeline && node --test scripts/nap-lai.test.mjs: BLOCKED ha tang baseline: lenh baseline khong chay dong nao (cong cu tu choi loi goi, hoac khong ghi duoc tep kich ban) — cong cu tra: «<\tool_use_error>Error: No such tool available: Write. Write is not among the tools available here. Continue with the tools you have.<\/tool_use_error>»
- node pipeline/scripts/nap-lai-ba-luot.mjs: BLOCKED ha tang baseline: lenh baseline khong chay dong nao (cong cu tu choi loi goi, hoac khong ghi duoc tep kich ban) — cong cu tra: «<\tool_use_error>Error: No such tool available: Write. Write is not among the tools available here. Continue with the tools you have.<\/tool_use_error>»
- cd pipeline && npm test: BLOCKED ha tang baseline: lenh baseline khong chay dong nao (cong cu tu choi loi goi, hoac khong ghi duoc tep kich ban) — cong cu tra: «<\tool_use_error>Error: No such tool available: Write. Write is not among the tools available here. Continue with the tools you have.<\/tool_use_error>»
- node scripts/check-cloud-catchup.mjs nap-lai-khong-xoa: BLOCKED ha tang baseline: lenh baseline khong chay dong nao (cong cu tu choi loi goi, hoac khong ghi duoc tep kich ban) — cong cu tra: «<\tool_use_error>Error: No such tool available: Write. Write is not among the tools available here. Continue with the tools you have.<\/tool_use_error>»
- cd app && npx tsc --noEmit && npm run lint: BLOCKED ha tang baseline: lenh baseline khong chay dong nao (cong cu tu choi loi goi, hoac khong ghi duoc tep kich ban) — cong cu tra: «<\tool_use_error>Error: No such tool available: Write. Write is not among the tools available here. Continue with the tools you have.<\/tool_use_error>»
- cd app && npm test: BLOCKED ha tang baseline: lenh baseline khong chay dong nao (cong cu tu choi loi goi, hoac khong ghi duoc tep kich ban) — cong cu tra: «<\tool_use_error>Error: No such tool available: Write. Write is not among the tools available here. Continue with the tools you have.<\/tool_use_error>»
- cd agent && npm test: BLOCKED ha tang baseline: lenh baseline khong chay dong nao (cong cu tu choi loi goi, hoac khong ghi duoc tep kich ban) — cong cu tra: «<\tool_use_error>Error: No such tool available: Write. Write is not among the tools available here. Continue with the tools you have.<\/tool_use_error>»

## Variance

none — every multi-run eval is uniform (mọi eval chạy một lần, không có phương sai)

## Iterations

Round 1: E12, E13 failed — E12: ca AU9-AC-8 của finder-ranh-gioi báo bảng `listing_records` chưa có khi `reassign-areas.mjs` chạy; E13: ca AC-3 của enrich-db dính deadlock với câu `ALTER TABLE public.listings RENAME TO listing_records` (bước đổi tên của migration 044) trong giao dịch. Cả hai đều nằm ở trạng thái DB local dùng chung với 044; chưa tách gốc rễ ở bước này. Returned to implementation.

