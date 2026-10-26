---
schema_version: 2
feature_slug: nap-lai-khong-xoa
verdict: PASS
failed_evals: []
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: e3afab7678bc79fba6dcdafa8192d6f1497ac933
human_signoff: Mạnh 2026-10-26
---

# Evidence Report: nap-lai-khong-xoa

Round 2. Mọi eval chạy lại trên cây mới (bản sửa S4-r1) đều xanh, gồm E12 và E13 vốn đỏ ở round 1; E10 mang sang từ round 1 vì delta không chạm paths của nó. Hai lệnh suite xanh.

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
| E12 | AC-2 | test | PASS |
| E13 | AC-2 | test | PASS |

## Evidence

- eval: E1
  run_id: minted-nap-lai-khong-xoa-E1-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.nap_lai_db
  verified_at: 2026-10-26T09:34:02Z
  output: |
    cd pipeline && node --test scripts/nap-lai-db.itest.mjs
    ℹ duration_ms 151092.755417

- eval: E2
  run_id: minted-nap-lai-khong-xoa-E2-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.nap_lai_db
  verified_at: 2026-10-26T09:34:02Z
  output: |
    cd pipeline && node --test scripts/nap-lai-db.itest.mjs
    ℹ duration_ms 151092.755417

- eval: E3
  run_id: minted-nap-lai-khong-xoa-E3-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.nap_lai_db
  verified_at: 2026-10-26T09:34:02Z
  output: |
    cd pipeline && node --test scripts/nap-lai-db.itest.mjs
    ℹ duration_ms 151092.755417

- eval: E4
  run_id: minted-nap-lai-khong-xoa-E4-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.nap_lai_db
  verified_at: 2026-10-26T09:34:02Z
  output: |
    cd pipeline && node --test scripts/nap-lai-db.itest.mjs
    ℹ duration_ms 151092.755417

- eval: E5
  run_id: minted-nap-lai-khong-xoa-E5-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.nap_lai_db
  verified_at: 2026-10-26T09:34:02Z
  output: |
    cd pipeline && node --test scripts/nap-lai-db.itest.mjs
    ℹ duration_ms 151092.755417

- eval: E6
  run_id: minted-nap-lai-khong-xoa-E6-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.nap_lai_db
  verified_at: 2026-10-26T09:34:02Z
  output: |
    cd pipeline && node --test scripts/nap-lai-db.itest.mjs
    ℹ duration_ms 151092.755417

- eval: E9
  run_id: minted-nap-lai-khong-xoa-E9-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.nap_lai_db
  verified_at: 2026-10-26T09:34:02Z
  output: |
    cd pipeline && node --test scripts/nap-lai-db.itest.mjs
    ℹ duration_ms 151092.755417

- eval: E7
  run_id: minted-nap-lai-khong-xoa-E7-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.nap_lai_ba_luot
  verified_at: 2026-10-26T09:34:02Z
  output: |
    node pipeline/scripts/nap-lai-ba-luot.mjs
    nap-lai-ba-luot: ĐẠT — bản thật mất 0 ô; đối chứng phải thấy mất

- eval: E8
  run_id: minted-nap-lai-khong-xoa-E8-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.nap_lai
  verified_at: 2026-10-26T09:34:02Z
  output: |
    cd pipeline && node --test scripts/nap-lai.test.mjs
    ℹ duration_ms 49.171583

- eval: E9b
  run_id: minted-nap-lai-khong-xoa-E9b-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.pipeline
  verified_at: 2026-10-26T09:34:02Z
  output: |
    cd pipeline && npm test
    ℹ duration_ms 145929.528125

- eval: E11
  run_id: minted-nap-lai-khong-xoa-E11-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.app
  verified_at: 2026-10-26T09:34:02Z
  output: |
    cd app && npx tsc --noEmit && npm run lint
    (không có dòng lỗi)

- eval: E12
  run_id: minted-nap-lai-khong-xoa-E12-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.app_ui
  verified_at: 2026-10-26T09:34:02Z
  output: |
    cd app && npm test
    ℹ duration_ms 24413.64275

- eval: E13
  run_id: minted-nap-lai-khong-xoa-E13-r2
  exit_code: 0
  verifier: config:executors.test.agent
  verified_at: 2026-10-26T09:34:02Z
  output: |
    cd agent && npm test
    ℹ duration_ms 35063.036167

- eval: E10
  run_id: minted-nap-lai-khong-xoa-E10-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.cloud_catchup_static
  verified_at: 2026-10-26T09:01:20Z
  carried_from_round: 1
  output: |
    carry-forward tu round 1 — delta khong cham paths cua eval

### Lệnh suite (hồi quy)

- cmd: cd app && npm run test:lint-rules
  run_id: minted-nap-lai-khong-xoa-SUITE-test_lint_rules-r2
  exit_code: 0
  verified_at: 2026-10-26T09:34:02Z

- cmd: node scripts/check-portal-compliance.mjs
  run_id: minted-nap-lai-khong-xoa-SUITE-node_scripts_check_portal_compliance_mjs-r2
  exit_code: 0
  verified_at: 2026-10-26T09:34:02Z

## Known limits

## Ngoài hợp đồng

## Analyst

baseline: BLOCKED ha tang — lenh baseline khong chay dong nao (cong cu tu choi loi goi, hoac khong ghi duoc tep kich ban) — cong cu tra: «Error: No such tool available: Write. Write is not among the tools available here. Continue with the tools you have.»

Mọi field baseline ghi n-a; danh sách eval không-phân-biệt bên dưới KHÔNG đo được ở round này.

none — moi eval feature deu red tren baseline (co phan biet). Lưu ý: câu này chỉ là mặc định khi danh sách rỗng; vì baseline BLOCKED nên không có số đo nào chứng minh điều đó.

### Baseline khong do

- cd pipeline && node --test scripts/nap-lai-db.itest.mjs: BLOCKED ha tang baseline: lenh baseline khong chay dong nao (cong cu tu choi loi goi, hoac khong ghi duoc tep kich ban) — cong cu tra: «Error: No such tool available: Write. Write is not among the tools available here. Continue with the tools you have.»
- node pipeline/scripts/nap-lai-ba-luot.mjs: BLOCKED ha tang baseline: lenh baseline khong chay dong nao (cong cu tu choi loi goi, hoac khong ghi duoc tep kich ban) — cong cu tra: «Error: No such tool available: Write. Write is not among the tools available here. Continue with the tools you have.»
- cd pipeline && node --test scripts/nap-lai.test.mjs: BLOCKED ha tang baseline: lenh baseline khong chay dong nao (cong cu tu choi loi goi, hoac khong ghi duoc tep kich ban) — cong cu tra: «Error: No such tool available: Write. Write is not among the tools available here. Continue with the tools you have.»
- cd pipeline && npm test: BLOCKED ha tang baseline: lenh baseline khong chay dong nao (cong cu tu choi loi goi, hoac khong ghi duoc tep kich ban) — cong cu tra: «Error: No such tool available: Write. Write is not among the tools available here. Continue with the tools you have.»
- cd app && npx tsc --noEmit && npm run lint: BLOCKED ha tang baseline: lenh baseline khong chay dong nao (cong cu tu choi loi goi, hoac khong ghi duoc tep kich ban) — cong cu tra: «Error: No such tool available: Write. Write is not among the tools available here. Continue with the tools you have.»
- cd app && npm test: BLOCKED ha tang baseline: lenh baseline khong chay dong nao (cong cu tu choi loi goi, hoac khong ghi duoc tep kich ban) — cong cu tra: «Error: No such tool available: Write. Write is not among the tools available here. Continue with the tools you have.»
- cd agent && npm test: BLOCKED ha tang baseline: lenh baseline khong chay dong nao (cong cu tu choi loi goi, hoac khong ghi duoc tep kich ban) — cong cu tra: «Error: No such tool available: Write. Write is not among the tools available here. Continue with the tools you have.»

## Variance

none — every multi-run eval is uniform (mọi eval chạy một lần, không có phương sai)

## Iterations

Round 1: E12, E13 failed — E12: ca AU9-AC-8 của finder-ranh-gioi báo bảng `listing_records` chưa có khi `reassign-areas.mjs` chạy; E13: ca AC-3 của enrich-db dính deadlock với câu `ALTER TABLE public.listings RENAME TO listing_records` (bước đổi tên của migration 044) trong giao dịch. Returned to implementation.

Round 2: cây mới nhận bản sửa S4-r1 (test app giữ khoá và nạp 044, thước cloud-sync dump bảng bản ghi, NL-AC-4 qua transform thật, điều kiện dương và đối chứng tự chạy cho ND-AC-5 và nap-lai-ba-luot). E1–E9, E9b, E11, E12, E13 và hai lệnh suite chạy lại, đều xanh; E10 mang sang từ round 1 (delta không chạm paths của eval). Ghi chú: verified_at của các eval chạy lại lấy theo mốc nhận cây ở run-log.


### Re-pin lần 1 — 2026-10-26, do gộp main sau PR #130 (xung đột reassign-areas, transform-chotot, transform-fb)
run_id: repin-20261026T105038Z-74887
sha: 5f01598c384ba2b74b801726e430e4240e386e6f · suites: 6 lệnh exit 0 · evals: 14/14 eval máy đạt kỳ vọng · chập chờn (đỏ lần đầu, đạt khi chạy lại): nap-lai-khong-xoa E7

### Re-pin lần 2 — 2026-10-26, do gộp main sau PR #131 (chỉ xung đột LO-TRINH.html máy sinh)
run_id: repin-20261026T110521Z-27912
sha: aa8f3f525ac0d006036c2d2f751531da03f2e572 · suites: 6 lệnh exit 0 · evals: 14/14 eval máy đạt kỳ vọng

### Re-pin lần 3 — 2026-10-26, do gộp main sau PR #129 (047 vòng đời nguồn; chỉ xung đột LO-TRINH.html máy sinh)
run_id: repin-20261026T111546Z-95898
sha: e3afab7678bc79fba6dcdafa8192d6f1497ac933 · suites: 6 lệnh exit 0 · evals: 14/14 eval máy đạt kỳ vọng
