---
schema_version: 2
feature_slug: install-cron-chi
verdict: PASS
failed_evals: []
reason:
verified_by: claudedp — điều phối liên làn (không viết mã này; mã của ZCode)
enforcement_mode: strict
bypass_used: false
verified_commit: 8d1078c399ef948df2f495841036e71689551580
human_signoff:
---

# Evidence Report: install-cron-chi

Vòng verify 3, cây `8d1078c3`: `zcode/install-cron-chi` @ eb60ad59 (16c1eaf9 + sửa `--chi` trơn), gộp main, cộng hồ sơ này và một sửa tích hợp CI ở test (ba ca cần PlistBuddy/launchctl bỏ qua có tên ngoài macOS). Phiên chấm không viết
script hay test của ZCode; chỉ viết hai probe trong `probes/`. Mọi lần chạy dùng HOME giả, `launchctl` và `security` giả đứng đầu PATH —
không đụng `~/Library/LaunchAgents` hay Keychain thật, không cài job nào trên máy.

Cả 5 eval đạt `expected`, kể cả các vế should-NOT-fire: vắng cờ vẫn cài đủ ba job; `--chi backup` chỉ ghi plist backup và chỉ gọi
launchctl cho nó, BACKUP_DIR nằm trong plist; mật khẩu đi vào Keychain qua stdin và không lọt vào plist, đối số, output hay launchctl;
tên job lạ và `--chi` trơn đều thoát 2 không ghi plist; nhánh chỉ đổi tệp được phép.

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | test | PASS |
| E2 | AC-2 | test | PASS |
| E3 | AC-3 | script | PASS |
| E4 | AC-4 | test | PASS |
| E5 | AC-5 | script | PASS |

## Evidence

- eval: E1
  run_id: install-cron-chi-E1-r3-20261107T093331Z
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.icc_test
  verified_at: 2026-11-07T09:33:31Z
  output: |
    ✔ vắng cờ: đủ 3 job như hành vi cũ (353.690375ms)
    ℹ tests 5
    ℹ pass 5
    ℹ fail 0

- eval: E2
  run_id: install-cron-chi-E2-r3-20261107T093332Z
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.icc_test
  verified_at: 2026-11-07T09:33:32Z
  output: |
    ✔ --chi backup: CHỈ backup được cài — không plist collector/smoke, launchctl không đụng chúng (305.09575ms)
    ✔ --chi backup: BACKUP_DIR vào plist backup qua PlistBuddy (plist đọc được) (293.486833ms)
    ℹ tests 5
    ℹ pass 5
    ℹ fail 0

- eval: E3
  run_id: install-cron-chi-E3-r3-20261107T093333Z
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.icc_keychain
  verified_at: 2026-11-07T09:33:33Z
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
  run_id: install-cron-chi-E4-r3-20261107T093334Z
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.icc_test
  verified_at: 2026-11-07T09:33:34Z
  output: |
    ✔ tên job lạ → thoát 2, KHÔNG ghi plist nào (6.364458ms)
    ✔ --chi trơn → thoát 2, không plist nào (5.177334ms)
    ℹ tests 5
    ℹ pass 5
    ℹ fail 0

- eval: E5
  run_id: install-cron-chi-E5-r3-20261107T093335Z
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.icc_scope
  verified_at: 2026-11-07T09:33:35Z
  output: |
    SCOPE OK

## Known limits

## Ngoài hợp đồng

## Iterations

- Vòng 1 (cây 48b7535e): PASS 5/5; review thấy một lỗi ngoài hợp đồng — `--chi` không kèm tên job rơi về cài cả ba job.
- Vòng 2 (cây 48fdc3f3): ZCode sửa ở eb60ad59, hợp đồng nâng AC-4 phủ ca đó; PASS 5/5, không còn mục ngoài hợp đồng.
- Vòng 3 (cây 8d1078c3): CI Linux hỏng 3 ca vì không có PlistBuddy; liên làn sửa tích hợp — ba ca đó bỏ qua có tên ngoài macOS, script giữ nguyên. Chạy lại trên macOS: PASS 5/5 (test 5/5, không ca nào bỏ qua).
