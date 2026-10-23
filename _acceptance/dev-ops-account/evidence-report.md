---
schema_version: 2
feature_slug: dev-ops-account
verdict: PASS
failed_evals: []
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: 784143a6858192df296fda85ddaf1355eec283e2
human_signoff:
---

# Evidence Report: dev-ops-account

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | test | PASS |
| E2 | AC-2 | test | PASS |
| E3 | AC-3 | test | PASS |
| E4 | AC-4 | test | PASS |
| E5 | AC-5 | test | PASS |
| E6 | AC-6 | script | PASS |
| E7 | AC-6 | test | PASS |
| E8 | AC-7 | test | PASS |
| E9 | AC-8 | script | PASS |

## Evidence

- eval: E1
  run_id: dev-ops-account-E1-20261022T224133Z
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.scripts
  verified_at: 2026-10-22T22:41:33Z
  output: |
    ▶ assertLocalDatabaseUrl
      ✔ nhận localhost / 127.0.0.1 / ::1 (0.453792ms)
      ✔ từ chối host không local, kể cả ghi đè qua ?host= (0.328667ms)
      ✔ chạy CLI với DATABASE_URL cloud → exit 2, không kết nối (38.369833ms)
    ✔ assertLocalDatabaseUrl (39.658ms)
    ℹ tests 9
    ℹ pass 9
    ℹ skipped 0

- eval: E2
  run_id: dev-ops-account-E2-20261022T224133Z
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.scripts
  verified_at: 2026-10-22T22:41:33Z
  output: |
    ▶ rào DB và đồng bộ cloud
      ✔ DB không có schema auth của onehub → từ chối, chỉ đọc information_schema (0.35475ms)
      ✔ users/sessions không nằm trong FILL của pipeline/sync-cloud.mjs (0.353792ms)
    ✔ rào DB và đồng bộ cloud (0.848875ms)
    ℹ tests 9
    ℹ pass 9
    ℹ skipped 0

- eval: E3
  run_id: dev-ops-account-E3-20261022T224133Z
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.scripts
  verified_at: 2026-10-22T22:41:33Z
  output: |
    ▶ hashPassword
      ✔ định dạng <salt-hex>$<key-hex>, verify được bằng scrypt thuần (như app/src/lib/auth.ts) (91.827542ms)
    ✔ hashPassword (91.967666ms)
    ▶ ensureAccount (DB local, ROLLBACK)
      ✔ tạo → giữ nguyên (idempotent) → xoay (209.179459ms)
    ✔ ensureAccount (DB local, ROLLBACK) (238.568125ms)
    ℹ tests 9
    ℹ pass 9
    ℹ skipped 0

- eval: E4
  run_id: dev-ops-account-E4-20261022T224133Z
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.scripts
  verified_at: 2026-10-22T22:41:33Z
  output: |
    ▶ ensureAccount (DB local, ROLLBACK)
      ✔ tạo → giữ nguyên (idempotent) → xoay (209.179459ms)
    ✔ ensureAccount (DB local, ROLLBACK) (238.568125ms)
    ℹ tests 9
    ℹ suites 5
    ℹ pass 9
    ℹ cancelled 0
    ℹ skipped 0

- eval: E5
  run_id: dev-ops-account-E5-20261022T224133Z
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.scripts
  verified_at: 2026-10-22T22:41:33Z
  output: |
    ▶ ensureAccount (DB local, ROLLBACK)
      ✔ tạo → giữ nguyên (idempotent) → xoay (209.179459ms)
    ✔ ensureAccount (DB local, ROLLBACK) (238.568125ms)
    ℹ tests 9
    ℹ suites 5
    ℹ pass 9
    ℹ cancelled 0
    ℹ skipped 0

- eval: E6
  run_id: dev-ops-account-E6-20261022T224139Z
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.ops_login
  verified_at: 2026-10-22T22:41:39Z
  output: |
    tài khoản ops thử: ops-test@local.test — unchanged
    thông tin đăng nhập: .claude/ops-test-account.json (gitignored, không in mật khẩu)
    lưu ý: app/.env.local có đặt OPS_EMAILS thì thêm ops-test@local.test vào danh sách đó, không thì /ops trả 404.
    POST /login: 303, có cookie oi_session HttpOnly
    /ops/sources: có cookie 200, không cookie bị chặn
    OK: tài khoản ops thử đăng nhập được http://localhost:3456
    (không có dòng báo lỗi nào trong stdout/stderr: các kiểm git check-ignore, quyền 600 và mật khẩu-lộ-stdout đều qua)

- eval: E7
  run_id: dev-ops-account-E7-20261022T224133Z
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.scripts
  verified_at: 2026-10-22T22:41:33Z
  output: |
    ▶ tệp thông tin đăng nhập
      ✔ .claude/ops-test-account.json bị git check-ignore (11.556ms)
      ✔ đường dẫn ngoài repo không coi là ignored (script sẽ từ chối ghi) (10.388042ms)
    ✔ tệp thông tin đăng nhập (22.124666ms)
    ℹ tests 9
    ℹ pass 9
    ℹ skipped 0

- eval: E8
  run_id: dev-ops-account-E8-20261022T224133Z
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.scripts
  verified_at: 2026-10-22T22:41:33Z
  output: |
    ▶ rào DB và đồng bộ cloud
      ✔ DB không có schema auth của onehub → từ chối, chỉ đọc information_schema (0.35475ms)
      ✔ users/sessions không nằm trong FILL của pipeline/sync-cloud.mjs (0.353792ms)
    ✔ rào DB và đồng bộ cloud (0.848875ms)
    ℹ tests 9
    ℹ pass 9
    ℹ skipped 0

- eval: E9
  run_id: dev-ops-account-E9-20261022T224139Z
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.ops_login
  verified_at: 2026-10-22T22:41:39Z
  output: |
    tài khoản ops thử: ops-test@local.test — unchanged
    thông tin đăng nhập: .claude/ops-test-account.json (gitignored, không in mật khẩu)
    lưu ý: app/.env.local có đặt OPS_EMAILS thì thêm ops-test@local.test vào danh sách đó, không thì /ops trả 404.
    POST /login: 303, có cookie oi_session HttpOnly
    /ops/sources: có cookie 200, không cookie bị chặn
    OK: tài khoản ops thử đăng nhập được http://localhost:3456

## Known limits

## Ngoài hợp đồng

## Analyst

Non-discriminating evals: không xác định được — không eval nào đo được baseline (xem dưới).

Baseline khong do:
- E1, E2, E3, E4, E5, E7, E8: n-a — tệp lệnh trỏ tới chưa có trên diffBase (`scripts/dev-ops-account.test.mjs` vắng trên `origin/main`, kiểm bằng `git cat-file -e`); chạy eval mới trên code cũ không chứng minh gì.
- E6, E9: n-a — tệp lệnh trỏ tới chưa có trên diffBase (`scripts/dev-ops-login-check.sh` vắng trên `origin/main`, kiểm bằng `git cat-file -e`).

Ghi chú của bên chấm (đọc code, không phải eval riêng):
- AC-1 «không mở kết nối DB nào»: ca CLI chỉ khẳng định thoát mã 2 + thông điệp; việc không kết nối được xác nhận bằng thứ tự trong `scripts/dev-ops-account.mjs` (rào `assertLocalDatabaseUrl` ở dòng 160 chạy trước `new pg.Client` / `connect()` ở dòng 166–167).
- AC-5 nhánh «tệp lệch thì tự xoay»: ca test chỉ kiểm `action = rotated`; việc xoá sessions ở nhánh này suy từ code (cùng một nhánh `DELETE FROM sessions` ở dòng 99 với `--rotate`).
- Ca DB của AC-3–5 chạy trên email `ops-test+unit@local.test` trong BEGIN…ROLLBACK; tài khoản thật `ops-test@local.test` được E6/E9 thấy ở trạng thái `unchanged` và đăng nhập được.

## Variance

none — không eval stochastic, mọi eval chạy một lần (deterministic).

## Iterations

Round 1: cả 9 eval (E1–E9) qua — `node --test scripts/*.test.mjs` 9/9 ca xanh, skipped 0; `bash scripts/dev-ops-login-check.sh` đăng nhập đầu-cuối trên :3456 thành công.

### Re-pin lần 1 — 2026-10-23, do hợp nhất origin/main (148c073) + sửa lời nhắc OPS_EMAILS theo cổng Ops đóng mặc định
run_id: repin-20261023T014805Z-19442
sha: 784143a6858192df296fda85ddaf1355eec283e2 · suites: 6 lệnh exit 0 · evals: 9/9 eval máy đạt kỳ vọng
