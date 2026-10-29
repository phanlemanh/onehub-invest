---
schema_version: 2
feature_slug: db-volume-live-ban-lui
verdict: REJECT
failed_evals: [E7]
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: 881c0ba4126b65a0bdcd43707a26ede12cc7a355
human_signoff:
---

# Evidence Report: db-volume-live-ban-lui

Round 1. Một eval máy (E7) đỏ nên kết quả tổng là REJECT. Sáu eval máy còn lại và sáu lệnh suite đều xanh. E8 (judgment) đã được hội đồng đề xuất, chờ người.

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | script | PASS |
| E2 | AC-2 | script | PASS |
| E3 | AC-3 | script | PASS |
| E4 | AC-4 | script | PASS |
| E5 | AC-5 | script | PASS |
| E6 | AC-5 | script | PASS |
| E7 | AC-5 | script | FAIL |
| E8 | AC-5 | judgment | đề xuất PASS, chờ người (human_override trống) |

## Evidence

- eval: E1
  run_id: minted-db-volume-live-ban-lui-E1-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.db_volume_live
  verified_at: 2026-10-29T10:44:14Z
  output: |
    db-volume-check live: ĐẠT

- eval: E2
  run_id: minted-db-volume-live-ban-lui-E2-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.db_volume_live
  verified_at: 2026-10-29T10:44:14Z
  output: |
    db-volume-check live: ĐẠT

- eval: E3
  run_id: minted-db-volume-live-ban-lui-E3-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.db_volume_live
  verified_at: 2026-10-29T10:44:14Z
  output: |
    db-volume-check live: ĐẠT

- eval: E4
  run_id: minted-db-volume-live-ban-lui-E4-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.db_volume_live
  verified_at: 2026-10-29T10:44:14Z
  output: |
    db-volume-check live: ĐẠT

- eval: E5
  run_id: minted-db-volume-live-ban-lui-E5-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.db_volume_static
  verified_at: 2026-10-29T10:44:14Z
  output: |
    db-volume-check static: ĐẠT

- eval: E6
  run_id: minted-db-volume-live-ban-lui-E6-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.db_volume_mutation
  verified_at: 2026-10-29T10:44:14Z
  output: |
    db-volume-check mutation: ĐẠT

- eval: E7
  run_id: minted-db-volume-live-ban-lui-E7-r1
  exit_code: 1
  baseline: n-a
  verifier: config:executors.script.db_volume_tap_duot
  verified_at: 2026-10-29T10:44:14Z
  output: |
    PASS đã có bản lùi đỏ — FAIL đã có onehub-tapduot-db-cu
    PASS volume đích có tệp đỏ — FAIL volume đích không rỗng
    PASS tiền điều kiện: mọi ca đỏ thoát 2, không đổi gì
    PASS lỗi giữa chừng sau khi tắt cụm: thoát 1, in lệnh lùi, bản lùi còn nguyên, không bật DB mới
    PASS lùi sau lỗi giữa chừng xanh
    PASS sau lùi: onehub-tapduot-db là container cũ (cùng Id), mau_a=1002
    PASS chuyển (--lam) thoát 0
    PASS chuyển: PASS bản lùi onehub-tapduot-db-cu-20261029 exited restart=no
    PASS chuyển: PASS tar --diff 0 tệp lệch
    PASS chuyển: PASS pg_controldata shut down
    PASS chuyển: PASS data_directory /var/lib/postgresql/17/main dưới mount volume onehub_tapduot_moi
    PASS chuyển: PASS số dòng bảng chính trước=sau
    PASS chuyển: PASS ALTER SYSTEM giữ nguyên (max_connections=200)
    PASS chuyển: PASS số dòng bảng chính sau chuyển=sau tạo lại
    PASS chuyển: bảng loại trừ public.mau_ghi 1→2 (không chặn)
    PASS bản lùi là đúng container cũ (Id giữ), onehub-tapduot-db là container mới
    PASS cụm mới: mau_a=1002 mau_geo=10 zcode_tapduot.z=3
    PASS tar lạnh datadir-17.tar + sha256 khớp
    PASS so byte bản chép lành xanh
    PASS bản chép sửa một tệp đỏ — FAIL tar --diff lệch 17/main/PG_VERSION
    PASS bản chép của cụm đang chạy đỏ — FAIL cụm không tắt sạch
    PASS so số dòng sau chuyển với sau tạo lại xanh
    PASS so số dòng một bảng lệch đỏ — FAIL lệch bảng public.mau_a
    PASS tạo lại (--force-recreate): mau_a=1002 mau_geo=10
    PASS down (không -v) rồi up: mau_a=1002, DB phụ, max_connections=200, postgis còn
    PASS compose cùng cấu hình từ đường khác: up -d không tạo lại container
    FAIL không dựng được cụm đối chứng
    PASS chuyển lần hai trên cụm đã chuyển đỏ — FAIL đã chuyển
    PASS lùi (--lui) xanh
    PASS lùi: container cũ chạy lại trên cổng 55433, mau_a=1002
    PASS lùi: container mới cất sang onehub-tapduot-db-moi-*, đang dừng
    PASS lùi: volume onehub_tapduot_moi còn nguyên dữ liệu
    PASS rủi ro đo được: compose cũ (project cũ) chạy down là xoá container cũ — lý do có tar lạnh
    PASS tar lạnh đổi một byte đỏ — FAIL sha256 datadir-17.tar
    PASS tar lạnh hỏng: không dựng gì
    PASS lùi từ tar lạnh xanh
    PASS lùi từ tar lạnh: cụm cũ chạy lại trên cổng 55433, mau_a=1002 như trước chuyển
    PASS one-invest-db không bị chạm (Id + StartedAt 2026-10-29T09:20:44.603338385Z không đổi)
    PASS không còn onehub-tapduot-*
    db-volume-check tap-duot: KHÔNG ĐẠT

- eval: E8
  judged_by: hội đồng judge (đề xuất, panel 3 lens, fresh context)
  verdict: PASS
  rationale: Đề xuất PASS của hội đồng. Dòng run-log cuối (kind «repin», run_id repin-20261029T103227Z-30313) có sha d4d94502… khác 4f5486d6…, sáu suites_exit và evals_exit của E1–E12, E14, E15 đều bằng 0. evidence-report.md bản trước có mục «Re-pin lần 1» do sau db-volume-live-ban-lui cite đúng run_id đó, và verified_commit khớp sha dòng run-log. Run-log không có trường lý do; lý do chỉ kiểm được qua tiêu đề mục trong báo cáo.
  votes:
    - domain-correctness: PASS — dòng run-log cuối cùng sha, suites_exit sáu số 0, evals_exit E1–E12/E14/E15 đều 0; báo cáo cite đúng run_id; verified_commit và «sha:» cùng bằng d4d9450292f0e864927b242b9c86ef172828072a. Lý do nhắc db-volume-live-ban-lui chỉ kiểm được qua tiêu đề mục.
    - operational-feasibility: PASS — dòng 41 kind «repin» run_id repin-20261029T103227Z-30313, sha d4d9450292f0e864927b242b9c86ef172828072a; tất cả suites_exit và evals_exit bằng 0; mục «Re-pin lần 1» cite đúng run_id và sha; đọc hai tệp cùng nhau vì run-log không có trường lý do.
    - spec-alignment: PASS — dòng 41 kind «repin» run_id repin-20261029T103227Z-30313, sha d4d94502… khác 4f5486d6…, suites_exit sáu số 0, evals_exit đều 0; báo cáo nêu lý do db-volume-live-ban-lui và verified_commit trùng sha dòng run-log.
  required_evidence:
    - (judge không nêu bằng-chứng-thiếu)
  human_override:  # chi nguoi ghi

### Lệnh suite (hồi quy)

- cmd: cd agent && npm test
  run_id: minted-db-volume-live-ban-lui-SUITE-npm_test__bb6271-r1
  exit_code: 0
  verified_at: 2026-10-29T10:44:14Z

- cmd: cd app && npx tsc --noEmit && npm run lint
  run_id: minted-db-volume-live-ban-lui-SUITE-lint-r1
  exit_code: 0
  verified_at: 2026-10-29T10:44:14Z

- cmd: cd app && npm test
  run_id: minted-db-volume-live-ban-lui-SUITE-npm_test__bd9a35-r1
  exit_code: 0
  verified_at: 2026-10-29T10:44:14Z

- cmd: cd pipeline && npm test
  run_id: minted-db-volume-live-ban-lui-SUITE-npm_test__13563d-r1
  exit_code: 0
  verified_at: 2026-10-29T10:44:14Z

- cmd: cd app && npm run test:lint-rules
  run_id: minted-db-volume-live-ban-lui-SUITE-test_lint_rules-r1
  exit_code: 0
  verified_at: 2026-10-29T10:44:14Z

- cmd: node scripts/check-portal-compliance.mjs
  run_id: minted-db-volume-live-ban-lui-SUITE-node_scripts_check_portal_compliance_mjs-r1
  exit_code: 0
  verified_at: 2026-10-29T10:44:14Z

Lệnh đỏ không gắn eval: không có. Lệnh đỏ duy nhất là `bash scripts/db-volume-check.sh tap-duot`, gắn với E7.

## Known limits

## Ngoài hợp đồng

## Analyst

baseline: BLOCKED ha tang — lenh baseline khong chay dong nao (cong cu tu choi loi goi, hoac khong ghi duoc tep kich ban) — cong cu tra: «<\tool_use_error>Error: No such tool available: Write. Write is not among the tools available here. Continue with the tools you have.<\/tool_use_error>»

Mọi field baseline là n-a. Danh sách eval không-phân-biệt (xanh cả HEAD lẫn baseline) không đo được ở round này vì baseline không chạy.

Baseline khong do:
- bash scripts/db-volume-check.sh live: BLOCKED ha tang baseline: lenh baseline khong chay dong nao (cong cu tu choi loi goi, hoac khong ghi duoc tep kich ban) — cong cu tra: «<\tool_use_error>Error: No such tool available: Write. Write is not among the tools available here. Continue with the tools you have.<\/tool_use_error>»
- bash scripts/db-volume-check.sh static: BLOCKED ha tang baseline: lenh baseline khong chay dong nao (cong cu tu choi loi goi, hoac khong ghi duoc tep kich ban) — cong cu tra: «<\tool_use_error>Error: No such tool available: Write. Write is not among the tools available here. Continue with the tools you have.<\/tool_use_error>»
- bash scripts/db-volume-check.sh mutation: BLOCKED ha tang baseline: lenh baseline khong chay dong nao (cong cu tu choi loi goi, hoac khong ghi duoc tep kich ban) — cong cu tra: «<\tool_use_error>Error: No such tool available: Write. Write is not among the tools available here. Continue with the tools you have.<\/tool_use_error>»
- bash scripts/db-volume-check.sh tap-duot: BLOCKED ha tang baseline: lenh baseline khong chay dong nao (cong cu tu choi loi goi, hoac khong ghi duoc tep kich ban) — cong cu tra: «<\tool_use_error>Error: No such tool available: Write. Write is not among the tools available here. Continue with the tools you have.<\/tool_use_error>»

## Variance

none — mọi eval máy chạy một lần (runs: 1), không eval nào có phương sai hay flaky.

## Iterations

Round 1: E7 failed — bộ tự kiểm tap-duot báo «không dựng được cụm đối chứng» và kết thúc KHÔNG ĐẠT, dù các dòng ghim một-chiều khác (one-invest-db không bị chạm, không còn onehub-tapduot-*) đều PASS. Returned to implementation.
