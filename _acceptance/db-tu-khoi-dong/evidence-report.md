---
schema_version: 2
feature_slug: db-tu-khoi-dong
verdict: PASS
failed_evals: []
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: d8cc1ca478d8da3eab65e1b02e4bb14088e8efa8
human_signoff:
---

# Evidence Report: db-tu-khoi-dong

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | script | PASS |
| E2 | AC-2 | script | PASS |
| E3 | AC-3 | script | PASS |
| E4 | AC-4 | script | PASS |
| E5 | AC-5 | script | PASS |
| E6 | AC-6 | script | PASS |
| E7 | AC-7 | judgment | PASS |
| E8 | AC-1 | script | PASS |
| E9 | AC-5 | script | PASS |

## Evidence

- eval: E1
  run_id: minted-db-tu-khoi-dong-E1-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.db_autostart_static
  verified_at: 2026-10-23T09:39:00Z
  output: |
    check-db-autostart static: ĐẠT

- eval: E2
  run_id: minted-db-tu-khoi-dong-E2-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.db_autostart_mutation
  verified_at: 2026-10-23T09:39:00Z
  output: |
    check-db-autostart mutation: ĐẠT

- eval: E3
  run_id: minted-db-tu-khoi-dong-E3-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.db_autostart_restart
  verified_at: 2026-10-23T09:39:00Z
  output: |
    check-db-autostart restart: ĐẠT

- eval: E4
  run_id: minted-db-tu-khoi-dong-E4-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.db_autostart_restart
  verified_at: 2026-10-23T09:39:00Z
  output: |
    check-db-autostart restart: ĐẠT

- eval: E5
  run_id: minted-db-tu-khoi-dong-E5-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.db_autostart_live
  verified_at: 2026-10-23T09:39:00Z
  output: |
    check-db-autostart live: ĐẠT

- eval: E6
  run_id: minted-db-tu-khoi-dong-E6-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.db_autostart_cleanup
  verified_at: 2026-10-23T09:39:00Z
  output: |
    check-db-autostart cleanup: ĐẠT

- eval: E8
  run_id: minted-db-tu-khoi-dong-E8-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.db_autostart_diff
  verified_at: 2026-10-23T09:39:00Z
  output: |
    check-db-autostart diff: ĐẠT

- eval: E9
  run_id: minted-db-tu-khoi-dong-E9-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.db_autostart_live_selftest
  verified_at: 2026-10-23T09:39:00Z
  output: |
    check-db-autostart live-selftest: ĐẠT

### Judgment (E7) — đề xuất của hội đồng, chờ người chốt ở Cổng 2

- eval: E7
  judged_by: judge-subagent (fresh context), hội đồng ba lăng kính
  verdict: PASS
  rationale: Mục «DB local tự khởi động» trong docs/ops/runtime-map.md (dòng 106-134) có đủ năm điều; lệnh và policy trong tài liệu khớp compose và script.
  verified_at: 2026-10-23T09:39:00Z
  panel_votes:
    - domain-correctness: PASS — Chuỗi đăng nhập macOS → LaunchAgent homebrew.mxcl.colima → VM colima → dockerd → `restart: unless-stopped` khớp `db/docker-compose.yml` dòng 7. Lệnh `bash scripts/check-db-autostart.sh live` có thật, script có nhánh `live` đọc policy, `RunAtLoad` và launchctl. Phần triển khai sau merge (không cần tạo lại container ngay, gián đoạn vài giây ở lần `docker compose up -d` kế tiếp) và hai giới hạn (cần đăng nhập, `docker stop` có chủ đích thì không tự bật) đều có. Không câu nào bảo tạo lại container ngay hay bảo agent tự khởi động lại colima/Docker.
    - operational-feasibility: PASS — Đủ năm điều. Chuỗi đăng nhập → LaunchAgent → dockerd → `restart: unless-stopped` trùng giá trị dòng 7 của compose. Lệnh `live` có thật (case `live`, dòng 230) và đọc đúng ba thứ tài liệu nêu. Giới hạn có cả đăng nhập macOS lẫn `docker stop` có chủ đích. Tài liệu ghi rõ agent không tự khởi động lại colima hay Docker của máy.
    - spec-alignment: PASS — Đủ năm điều: chuỗi tự khởi động và policy trùng compose; lệnh `live` có thật và các chế độ phụ khớp case của script; có «KHÔNG cần tạo lại container ngay» cùng gián đoạn vài giây; có giới hạn cần đăng nhập macOS và `docker stop` có chủ đích; không câu nào bảo tạo lại ngay.
  human_override:  # chi nguoi ghi

### Lệnh suite (hồi quy)

- cmd: cd agent && npm test
  run_id: minted-db-tu-khoi-dong-SUITE-npm_test__bb6271-r1
  exit_code: 0
  verified_at: 2026-10-23T09:39:00Z

- cmd: cd app && npx tsc --noEmit && npm run lint
  run_id: minted-db-tu-khoi-dong-SUITE-lint-r1
  exit_code: 0
  verified_at: 2026-10-23T09:39:00Z

- cmd: cd app && npm test
  run_id: minted-db-tu-khoi-dong-SUITE-npm_test__bd9a35-r1
  exit_code: 0
  verified_at: 2026-10-23T09:39:00Z

- cmd: cd pipeline && npm test
  run_id: minted-db-tu-khoi-dong-SUITE-npm_test__13563d-r1
  exit_code: 0
  verified_at: 2026-10-23T09:39:00Z

- cmd: cd app && npm run test:lint-rules
  run_id: minted-db-tu-khoi-dong-SUITE-test_lint_rules-r1
  exit_code: 0
  verified_at: 2026-10-23T09:39:00Z

- cmd: node scripts/check-portal-compliance.mjs
  run_id: minted-db-tu-khoi-dong-SUITE-node_scripts_check_portal_compliance_mjs-r1
  exit_code: 0
  verified_at: 2026-10-23T09:39:00Z

## Known limits

## Ngoài hợp đồng

## Analyst

none — không eval feature nào được đo là xanh ở cả HEAD lẫn baseline; baseline của các eval feature đều là n-a (chưa đo, lý do ở mục dưới), nên chưa có chứng cứ red/green từ baseline.

Baseline khong do

- bash scripts/check-db-autostart.sh static: bo qua baseline: tep scripts/check-db-autostart.sh co o cay dang kiem nhung chua co o merge-base f3cff1f034d9d9365c0e049a4108240e2bcc5db0 — eval moi, chay tren code cu khong phan biet gi
- bash scripts/check-db-autostart.sh mutation: bo qua baseline: tep scripts/check-db-autostart.sh co o cay dang kiem nhung chua co o merge-base f3cff1f034d9d9365c0e049a4108240e2bcc5db0 — eval moi, chay tren code cu khong phan biet gi
- bash scripts/check-db-autostart.sh restart: bo qua baseline: tep scripts/check-db-autostart.sh co o cay dang kiem nhung chua co o merge-base f3cff1f034d9d9365c0e049a4108240e2bcc5db0 — eval moi, chay tren code cu khong phan biet gi
- bash scripts/check-db-autostart.sh live: bo qua baseline: tep scripts/check-db-autostart.sh co o cay dang kiem nhung chua co o merge-base f3cff1f034d9d9365c0e049a4108240e2bcc5db0 — eval moi, chay tren code cu khong phan biet gi
- bash scripts/check-db-autostart.sh cleanup: bo qua baseline: tep scripts/check-db-autostart.sh co o cay dang kiem nhung chua co o merge-base f3cff1f034d9d9365c0e049a4108240e2bcc5db0 — eval moi, chay tren code cu khong phan biet gi
- bash scripts/check-db-autostart.sh diff: bo qua baseline: tep scripts/check-db-autostart.sh co o cay dang kiem nhung chua co o merge-base f3cff1f034d9d9365c0e049a4108240e2bcc5db0 — eval moi, chay tren code cu khong phan biet gi
- bash scripts/check-db-autostart.sh live-selftest: bo qua baseline: tep scripts/check-db-autostart.sh co o cay dang kiem nhung chua co o merge-base f3cff1f034d9d9365c0e049a4108240e2bcc5db0 — eval moi, chay tren code cu khong phan biet gi

## Variance

none — every multi-run eval is uniform (mọi eval chạy một lần, tất định)

## Iterations

Round 1: E1-E6, E8, E9 đạt; E7 hội đồng đề xuất PASS; có 1 finding trong hợp đồng (AC-6) và 2 finding ngoài hợp đồng, xem review-findings.md.
