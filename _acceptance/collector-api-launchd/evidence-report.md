---
schema_version: 2
feature_slug: collector-api-launchd
verdict: PASS
failed_evals: []
reason:
verified_by: feature-loop:cham-lenh
enforcement_mode: strict
bypass_used: false
verified_commit: 13aadd863eed27f582a5c579ad74b929b80dd06e
human_signoff:
---

# Evidence Report: collector-api-launchd

Vòng verify 1, cây `13aadd8` (nhánh `claude/acceptance-collector-api-launchd` = origin/main `106cbd3` + ZCode
`zcode/collector-api-launchd` @ `6e6c5cf` + hồ sơ; merge-base `106cbd3`). Phiên chấm không viết mã này. Mọi lượt chạy đều trên
bản chép tạm với HOME giả và launchctl giả. Không chạy script với HOME thật, không gọi launchctl thật, không đụng tiến trình :9210.

Cả 5 eval đều đạt `expected`, kể cả các vế should-NOT-fire. `--dry` không ghi gì và không gọi launchctl. Lượt cài ghi plist quyền
600, plutil sạch, không còn `__ROOT__`, chỉ in cặp lệnh triển khai. Bốn cửa chặn đều chặn trước khi ghi. Test của ZCode 3/3 và
nhánh chỉ đổi tệp được phép. «Ngoài hợp đồng» có 3 mục, đều mức low; người quyết.

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | script | PASS |
| E2 | AC-2 | script | PASS |
| E3 | AC-3 | script | PASS |
| E4 | AC-4 | test | PASS |
| E5 | AC-4 | script | PASS |

## Evidence

E1, E2 và E3 dùng chung một lượt `cal_cai_dat`, mỗi eval có dòng run-log riêng. Probe dựng một cây tạm cho mỗi ca. Trong cây đó,
`launchctl` đầu PATH chỉ ghi lời gọi vào tệp `calls`, node của launcher là một stub, và HOME trỏ vào thư mục giả.

- eval: E1
  run_id: collector-api-launchd-E1-r1-20261026T010036Z
  exit_code: 0
  baseline: red
  verifier: config:executors.script.cal_cai_dat
  verified_at: 2026-10-26T01:00:36Z
  output: |
    ok   (1) --dry thoát 0
    ok   (1) should-NOT-fire: --dry không ghi plist
    ok   (1) plist in ra đã thế __ROOT__ bằng gốc kho
    ok   (1) should-NOT-fire: 0 lời gọi launchctl
    CAI-DAT PASS
  note: should-NOT-fire đạt, gồm không có plist trong LaunchAgents giả và tệp `calls` rỗng. Trên baseline, script chưa tồn tại nên vế «--dry thoát 0» và vế «plist đã thế» đều đỏ. Hai vế should-NOT-fire xanh suông vì không có gì chạy.

- eval: E2
  run_id: collector-api-launchd-E2-r1-20261026T010036Z
  exit_code: 0
  baseline: red
  verifier: config:executors.script.cal_cai_dat
  verified_at: 2026-10-26T01:00:36Z
  output: |
    ok   (2) cài thoát 0, plist có
    ok   (2) plist quyền 600
    ok   (2) plutil -lint sạch
    ok   (2) không còn __ROOT__
    ok   (2) should-NOT-fire: script KHÔNG tự bootout/bootstrap
    ok   (2) in lệnh bootstrap cho bước triển khai
    CAI-DAT PASS
  note: should-NOT-fire đạt, không có lời gọi launchctl nào. Phiên chấm thử thêm trên bản chép đã có plist cũ quyền 644: ghi đè xong quyền là 600. Trên baseline có bốn vế đỏ: cài, quyền, lint, in lệnh bootstrap.

- eval: E3
  run_id: collector-api-launchd-E3-r1-20261026T010036Z
  exit_code: 0
  baseline: red
  verifier: config:executors.script.cal_cai_dat
  verified_at: 2026-10-26T01:00:36Z
  output: |
    ok   (3a) dist cũ hơn main.ts → chặn, không ghi
    ok   (3b) thiếu tệp khoá → chặn
    ok   (3c) node tuyệt đối không có → chặn
    ok   (3d) thiếu dist → chặn
    ghi nhận: src/core mới hơn dist → KHÔNG bị chặn (chỉ so main.ts)
    CAI-DAT PASS
  note: probe chỉ kiểm «không ghi plist» ở ca 3a, ba ca còn lại chỉ kiểm thoát khác 0. Phiên chấm chạy riêng cả bốn ca trên bản chép. Mỗi ca thoát khác 0, in dòng `lỗi:` đúng nguyên nhân, không ghi plist và không có lời gọi launchctl. Như vậy AC-3 «không ghi plist» được phủ đủ bốn ca. Dòng «ghi nhận» khớp mục Out of scope. Xem Analyst về baseline.

- eval: E4
  run_id: collector-api-launchd-E4-r1-20261026T010051Z
  exit_code: 0
  baseline: red
  verifier: config:executors.test.cal_unit
  verified_at: 2026-10-26T01:00:51Z
  output: |
    ✔ --dry: in plist đã thế __ROOT__ + cặp lệnh triển khai, KHÔNG ghi tệp nào
    ✔ cài thật: ghi plist vào LaunchAgents của HOME giả, plutil sạch, chmod 600, chỉ IN lệnh launchctl
    ✔ kiểm trước chặn: dist cũ hơn src / thiếu khoá / node không có — exit ≠0, không ghi
    ℹ tests 3
    ℹ pass 3
    ℹ fail 0
    ℹ skipped 0
  note: trên baseline tệp test chưa tồn tại, node báo «Could not find 'pipeline/scripts/install-collector-api.test.mjs'».

- eval: E5
  run_id: collector-api-launchd-E5-r1-20261026T010055Z
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.cal_scope
  verified_at: 2026-10-26T01:00:55Z
  output: |
    ok  _acceptance/collector-api-launchd/probes/scope.sh
    ok  _acceptance/config.yaml
    ok  pipeline/scripts/install-collector-api.test.mjs
    ok  scripts/install-collector-api.sh
    SYNTAX OK
    SCOPE OK
  note: should-NOT-fire đạt, không có dòng «NGOÀI PHẠM VI». Chín tệp đều ok, gồm thêm LO-TRINH.html, PRODUCT-MAP.md, contract.md, evals.yaml và probes/cai-dat.sh. `bash -n` sạch. Plist khuôn và `api-launchd.sh` không đổi trong diff.

Network truth: không có eval `ui-check` nào. Cả 5 eval là `script`/`test`, không có đường mạng: n-a (driver).

Kho sạch sau các lượt chạy: `git status` chỉ có run-log.jsonl, review-findings.md, evidence-report.md của hồ sơ này và dòng
`status` trong contract.md.

## Known limits

- Kiểm tuổi build chỉ so `main.ts`, đúng Out of scope của hợp đồng. Probe xác nhận tệp nguồn khác mới hơn dist không bị chặn.
- Plist đã nằm trong `~/Library/LaunchAgents` thì launchd tự nạp ở lần đăng nhập hay khởi động máy sau (RunAtLoad + KeepAlive).
  Script không gọi launchctl, nhưng khởi động lại máy giữa lúc cài và lúc triển khai sẽ cho job lên mà không qua quy trình bằng
  chứng. Plist cũ ngày 19/10 vốn đã ở đó với cùng hệ quả.
- Plist mới bỏ `EnvironmentVariables HOME` và thêm `ExitTimeOut 60` so với plist đang cài. Phần bỏ HOME có sẵn ở khuôn trên main.
  launchd đặt HOME cho agent miền gui.
- Khoá có mặt nhưng rỗng thì không bị chặn. Khi đó `main.ts` fail closed và thoát, KeepAlive lặp lại.

## Ngoài hợp đồng

Chi tiết và căn cứ ở `review-findings.md`. Cả ba chưa qua bác bỏ đối kháng; người quyết.
- OOC-1 (low): script không từ chối chạy ngoài checkout chính. Chạy từ worktree thì plist trỏ vào worktree, và khi worktree bị
  dọn thì :9210 tắt. Đề xuất known-limits: ghi vào lời GIAO triển khai «gọi `~/dev/one-invest/scripts/install-collector-api.sh`,
  soát đường trong plist in ra».
- OOC-2 (low): script không `mkdir -p "$ROOT/pipeline/logs"` như năm script `install-*.sh` cùng khuôn. Checkout chính đã có thư mục
  này. Trên clone mới, launchd không mở được log. Đề xuất new-contract (một dòng, làn ZCode).
- OOC-3 (low): `sed` hỏng với đường gốc có `&` (plist còn `__ROOT__` mà vẫn báo OK) hay `|` (để lại plist 0 byte quyền 644 trong
  LaunchAgents). Đường thật không có ký tự như vậy. Đề xuất known-limits.

## Analyst

Non-discriminating evals:
none — E1–E4 đỏ trên baseline. Riêng E3, các vế (3a)–(3d) xanh suông trên baseline: script chưa tồn tại nên lệnh nào cũng thoát
khác 0, mà probe chỉ đòi «thoát khác 0» (3a đòi thêm «không ghi»). Cả lệnh `cal_cai_dat` vẫn đỏ trên baseline nhờ các vế (1) và (2).
Bản thân vế (3) không phân biệt được «chặn đúng lý do» với «script không có». Phép thử riêng của phiên chấm (dòng `lỗi:` đúng nguyên
nhân cho từng ca) bù chỗ này.

Baseline khong do:
- E5 (`cal_scope`): probe đo danh sách tệp đổi `merge-base..HEAD` của nhánh. Trên cây diffBase không có commit nào của nhánh nên
  phép đo rỗng, chạy cũng không chứng minh gì.

Cách đo baseline: `git archive origin/main` (`106cbd3`, cũng là merge-base) các thư mục `scripts`, `pipeline/cron`,
`pipeline/scripts`, `collector/scripts` vào scratchpad. Trên cây đó, `scripts/install-collector-api.sh` và
`pipeline/scripts/install-collector-api.test.mjs` không có; plist khuôn thì có. Chạy probe `cai-dat.sh` hiện hành với gốc là bản
xuất đó: các vế (1) «--dry thoát 0», (1) «plist đã thế», (2) «cài», (2) «quyền 600», (2) «plutil», (2) «in lệnh bootstrap» đều
đỏ, nên không có dòng CAI-DAT PASS. `node --test` trên bản xuất báo không tìm thấy tệp test.

Kiểm thêm, không phải eval:
- Gọi qua symlink: plist giữ đường logic (`/Users/manhphan/dev/one-invest/...` khi gọi qua `~/dev/one-invest`). Đường này khớp mọi
  plist `com.oneinvest.*` đang cài. Bộ canh (`zalo-watchdog.sh`) đọc `$ROOT/collector/snapshots`, cùng thư mục vật lý dù đi đường
  nào, nên không có tác động.
- `chmod 600` không cản launchd: `com.oneinvest.chotot.plist` quyền 600 vẫn chạy, log ghi lúc 26/10 05:43.
- `pipeline/logs` có ở checkout chính (gitignored), không có trong worktree này (OOC-2).
- Tiến trình :9210 (PID 63069, từ 21/10 14:41) không do launchd khởi động (`XPC_SERVICE_NAME=0`), đúng là tiến trình tay. Phiên chấm
  chỉ đọc qua `lsof`/`ps`, không gửi tín hiệu.

## Variance

none — 5 eval tất định, mỗi lệnh chạy một lần trên HEAD. Ba eval dùng chung lệnh (E1/E2/E3) dùng chung một output.

## Iterations

Round 1: 5/5 eval đạt trên `13aadd8`. Baseline đỏ ở E1–E4, E5 không đo baseline. «Ngoài hợp đồng» có 3 mục, đều mức low (thiếu
rào chạy ngoài checkout chính, thiếu `mkdir pipeline/logs`, `sed` với `&`/`|`); người quyết. PASS.
