---
schema_version: 2
feature_slug: install-cron-chi
verdict: PASS
failed_evals: []
reason:
verified_by: claudedp — điều phối liên làn (không viết mã này; mã của ZCode)
enforcement_mode: strict
bypass_used: false
verified_commit: 48b7535e23aa63bd0ee0a22dd62084c8abd7891e
human_signoff:
---

# Evidence Report: install-cron-chi

Vòng verify 1, cây `48b7535e`: `zcode/install-cron-chi` @ 16c1eaf9 (dựng trên origin/main) cộng hồ sơ này. Phiên chấm không viết
script hay test của ZCode; chỉ viết hai probe trong `probes/`. Mọi lần chạy dùng HOME giả, `launchctl` và `security` giả đứng đầu PATH —
không đụng `~/Library/LaunchAgents` hay Keychain thật, không cài job nào trên máy.

Cả 5 eval đạt `expected`, kể cả các vế should-NOT-fire: vắng cờ vẫn cài đủ ba job; `--chi backup` chỉ ghi plist backup và chỉ gọi
launchctl cho nó, BACKUP_DIR nằm trong plist; mật khẩu đi vào Keychain qua stdin và không lọt vào plist, đối số, output hay launchctl;
tên job lạ thoát 2 không ghi plist; nhánh chỉ đổi tệp được phép. «Ngoài hợp đồng» có 1 mục mức low.

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | test | PASS |
| E2 | AC-2 | test | PASS |
| E3 | AC-3 | script | PASS |
| E4 | AC-4 | test | PASS |
| E5 | AC-5 | script | PASS |

## Evidence

- eval: E1
  run_id: install-cron-chi-E1-r1-20261107T085758Z
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.icc_test
  verified_at: 2026-11-07T08:57:58Z
  output: |
    ✔ vắng cờ: đủ 3 job như hành vi cũ (344.730208ms)
    ℹ tests 4
    ℹ pass 4
    ℹ fail 0

- eval: E2
  run_id: install-cron-chi-E2-r1-20261107T085759Z
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.icc_test
  verified_at: 2026-11-07T08:57:59Z
  output: |
    ✔ --chi backup: CHỈ backup được cài — không plist collector/smoke, launchctl không đụng chúng (310.452ms)
    ✔ --chi backup: BACKUP_DIR vào plist backup qua PlistBuddy (plist đọc được) (298.968125ms)
    ℹ tests 4
    ℹ pass 4
    ℹ fail 0

- eval: E3
  run_id: install-cron-chi-E3-r1-20261107T085800Z
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.icc_keychain
  verified_at: 2026-11-07T08:58:00Z
  output: |
    đạt: plist backup được cài
    đạt: security add-generic-password gọi đúng dịch vụ oneinvest-backup
    đạt: mật khẩu đi qua stdin của security
    đạt: mật khẩu KHÔNG nằm trong đối số security
    đạt: mật khẩu KHÔNG nằm trong plist
    đạt: mật khẩu KHÔNG in ra output script
    đạt: mật khẩu KHÔNG vào lời gọi launchctl
    đạt: BACKUP_DIR vào plist backup
    đạt: không plist collector/smoke
    KEYCHAIN OK

- eval: E4
  run_id: install-cron-chi-E4-r1-20261107T085800Z
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.icc_test
  verified_at: 2026-11-07T08:58:00Z
  output: |
    ✔ tên job lạ → thoát 2, KHÔNG ghi plist nào (3.298167ms)
    ℹ tests 4
    ℹ pass 4
    ℹ fail 0

- eval: E5
  run_id: install-cron-chi-E5-r1-20261107T085801Z
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.icc_scope
  verified_at: 2026-11-07T08:58:01Z
  output: |
    SCOPE OK

## Iterations

- Vòng 1: PASS 5/5.
