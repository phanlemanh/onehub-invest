---
schema_version: 2
feature_slug: noi-tiep-zc4
verdict: PASS
failed_evals: []
reason:
verified_by: feature-loop:cham-lenh
enforcement_mode: strict
bypass_used: false
verified_commit: c289a0a04dda822ab048106dd34423345bbd5198
human_signoff: Mạnh 2026-10-25
---

# Evidence Report: noi-tiep-zc4

Vòng verify 1, cây `b914cb0`. Nhánh `claude/acceptance-noi-tiep-zc4` gồm origin/main `6b0afe7` (cũng là merge-base), ZCode
`zcode/install-collector-api-logs` @ `5565d32` (2610-5), `zcode/snapshot-skip-khong-rac` @ `661a381` (2510-32) và hồ sơ. Phiên chấm
không viết mã này. Script cài chỉ chạy trên bản chép tạm với HOME giả và launchctl giả. Không chạy với HOME thật, không gọi launchctl
thật, không đụng tiến trình :9210, không ghi `collector/snapshots` thật.

Cả 6 eval đều đạt `expected`, kể cả các vế should-NOT-fire. Clone mới có `pipeline/logs`. Khi sed lỗi, plist cũ còn nguyên, script
thoát khác 0 và không gọi launchctl. Lượt thu bị skip, dù vì cửa sổ giờ hay vì cap ngày, đều để `snapshotRoot` trống, còn lượt thật
vẫn ghi đủ manifest. Bộ test collector chạy trên build sạch xanh 60/60. Nhánh chỉ đổi tệp được phép. «Ngoài hợp đồng» có 1 mục mức
low; người quyết.

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | script | PASS |
| E2 | AC-2 | script | PASS |
| E3 | AC-3 | script | PASS |
| E4 | AC-4 | script | PASS |
| E5 | AC-4 | test | PASS |
| E6 | AC-5 | script | PASS |

## Evidence

E1 và E2 dùng chung một lượt `nz4_logs_tmp`, mỗi eval có dòng run-log riêng. Probe dựng hai bản chép kho tối thiểu. Bản thứ hai có
đường gốc chứa `|`. Trong cả hai, `launchctl` đầu PATH chỉ ghi lời gọi vào tệp `calls`, và HOME trỏ vào thư mục giả.

- eval: E1
  run_id: noi-tiep-zc4-E1-r1-20261026T061625Z
  exit_code: 0
  baseline: red
  verifier: config:executors.script.nz4_logs_tmp
  verified_at: 2026-10-26T06:16:25Z
  output: |
    ok   clone mới: pipeline/logs được tạo
    ok   sed lỗi (đường có '|'): plist cũ giữ nguyên (thoát 1)
    ok   không gọi launchctl
    LOGS-TMP OK
  note: tiền đề «bản chép chưa có pipeline/logs» được probe kiểm trước khi chạy. Trên baseline (script của origin/main), probe in «FAIL không tạo pipeline/logs».

- eval: E2
  run_id: noi-tiep-zc4-E2-r1-20261026T061625Z
  exit_code: 0
  baseline: red
  verifier: config:executors.script.nz4_logs_tmp
  verified_at: 2026-10-26T06:16:25Z
  output: |
    ok   sed lỗi (đường có '|'): plist cũ giữ nguyên (thoát 1)
    ok   không gọi launchctl
    LOGS-TMP OK
  note: should-NOT-fire đạt, plist cũ không bị đè và tệp `calls` rỗng. Vế «script thoát khác 0» của AC-2 đọc được từ dòng output, vì probe in mã thoát chứ không assert nó. Phiên chấm chạy riêng ca này với `bash -x`: script dừng đúng ở sed («bad flag in substitute command») và không tới `mv`. Trên baseline, probe in «FAIL plist cũ bị đè:» kèm nội dung rỗng, tức là đúng lỗi plist 0 byte của 2610-5. Vế «không gọi launchctl» xanh cả hai phía vì script chưa bao giờ gọi launchctl.

- eval: E3
  run_id: noi-tiep-zc4-E3-r1-20261026T061643Z
  exit_code: 0
  baseline: red
  verifier: config:executors.script.collector_test_clean
  verified_at: 2026-10-26T06:16:43Z
  output: |
    ✔ 2510-32: skip ngoài cửa sổ giờ — KHÔNG tạo thư mục nào (hết .partial rác)
    ✔ 2510-32: skip vượt cap ngày — KHÔNG tạo thư mục nào
    ✔ 2510-32: lượt chạy THẬT vẫn ghi snapshot trọn vẹn (writer dời chỗ không gãy luồng)
    ℹ tests 60
    ℹ pass 60
    ℹ fail 0
    ℹ skipped 0
  note: `rm -rf dist` rồi `npm test` (tsc và mọi `dist/test/*.test.js`) chạy trong khoảng 110 giây, dưới trần công cụ. Mỗi ca test chạy trong tiến trình con riêng, với gốc snapshot là thư mục tạm.

- eval: E4
  run_id: noi-tiep-zc4-E4-r1-20261026T061849Z
  exit_code: 0
  baseline: green
  verifier: config:executors.script.cal_cai_dat
  verified_at: 2026-10-26T06:18:49Z
  output: |
    ok   (1) should-NOT-fire: --dry không ghi plist
    ok   (2) cài thoát 0, plist có
    ok   (2) plist quyền 600
    ok   (2) plutil -lint sạch
    ok   (2) should-NOT-fire: script KHÔNG tự bootout/bootstrap
    ok   (3a) dist cũ hơn main.ts → chặn, không ghi
    CAI-DAT PASS
  note: 15/15 vế ok, gồm (3b)–(3d) và dòng «ghi nhận» như ở hồ sơ collector-api-launchd. Đây là rào hồi quy: sau khi chuyển sang ghi qua tệp tạm, quyền 600 và plutil vẫn đúng.

- eval: E5
  run_id: noi-tiep-zc4-E5-r1-20261026T061858Z
  exit_code: 0
  baseline: red
  verifier: config:executors.test.cal_unit
  verified_at: 2026-10-26T06:18:58Z
  output: |
    ✔ --dry: in plist đã thế __ROOT__ + cặp lệnh triển khai, KHÔNG ghi tệp nào
    ✔ cài thật: ghi plist vào LaunchAgents của HOME giả, plutil sạch, chmod 600, chỉ IN lệnh launchctl
    ✔ kiểm trước chặn: dist cũ hơn src / thiếu khoá / node không có — exit ≠0, không ghi
    ✔ 2610-5: tạo thư mục pipeline/logs (khuôn install-*.sh) + sed lỗi không đè plist cũ
    ℹ tests 4
    ℹ pass 4
    ℹ fail 0
  note: baseline đo theo cùng cách với E3: giữ test của HEAD, đặt script của origin/main. Ca 2610-5 đỏ, ba ca cũ xanh. Riêng tệp test của origin/main chạy trên cây origin/main thì xanh 3/3, vì ca mới chưa có ở đó.

- eval: E6
  run_id: noi-tiep-zc4-E6-r1-20261026T061858Z
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.nz4_scope
  verified_at: 2026-10-26T06:18:58Z
  output: |
    ok  _acceptance/noi-tiep-zc4/probes/scope.sh
    ok  collector/src/core/scheduler.ts
    ok  collector/src/test/snapshot-skip-khong-rac.test.ts
    ok  pipeline/scripts/install-collector-api.test.mjs
    ok  scripts/install-collector-api.sh
    SCOPE OK
  note: should-NOT-fire đạt, không có dòng «NGOÀI PHẠM VI». Cả 11 tệp đều ok, gồm thêm LO-TRINH.html, PRODUCT-MAP.md, `_acceptance/config.yaml`, contract.md, evals.yaml và probes/logs-tmp.sh.

Network truth: không có eval `ui-check` nào. Cả 6 eval là `script`/`test`, không có đường mạng: n-a (driver).

Kho sạch sau các lượt chạy: `git status` chỉ còn run-log.jsonl, review-findings.md, evidence-report.md của hồ sơ này và dòng
`status` trong contract.md. `collector/src/core/scheduler.ts` đã được khôi phục sau baseline, và `collector/dist` đã build lại từ HEAD.

## Known limits

- Đường gốc chứa `&` vẫn cho ra plist sai mà vẫn qua `plutil -lint` (OOC-3 của collector-api-launchd). Hợp đồng này chỉ phủ ca `|`.
- `mv` của plist chỉ nguyên tử khi thư mục tạm của user và `~/Library/LaunchAgents` cùng volume. Trên máy này hai thư mục cùng volume.
- Thư mục `.partial` rỗng đã sinh trước vòng này không được dọn, và collector :9210 chỉ có sửa 2510-32 ở lần build và khởi động lại
  kế tiếp (Out of scope của hợp đồng).

## Ngoài hợp đồng

Chi tiết và căn cứ ở `review-findings.md`. Mục này chưa qua bác bỏ đối kháng; người quyết.
- OOC-1 (low): script cài thoát lỗi sau khi đã tạo tệp tạm (sed hay plutil hỏng) thì để lại một tệp `tmp.*` 0 byte trong thư mục tạm
  của user, vì không có `trap` dọn. Ca (b) của test mới cố ý làm sed lỗi, nên mỗi lần chạy test cũng để lại một tệp. Đề xuất
  known-limits (sửa một dòng nếu muốn: `trap` dọn hoặc tạo tệp tạm trong `$DEST`).

## Analyst

Non-discriminating evals:
none — mọi eval của tính năng (E1, E2, E3, E5) đều đỏ trên baseline. E4 xanh cả hai phía, và đó là chủ ý: nó là rào hồi quy của hồ sơ
collector-api-launchd (AC-4 «chạy lại kiểm cũ»). Trong E2, riêng vế «không gọi launchctl» xanh suông trên baseline. Vế quyết định là
«plist cũ giữ nguyên», và vế này đỏ trên baseline.

Baseline khong do:
- E6 (`nz4_scope`): probe đo danh sách tệp đổi `merge-base..HEAD`. Trên cây diffBase không có commit nào của nhánh, nên chạy cũng
  không chứng minh gì.

Cách đo baseline:
- E1/E2: `git archive origin/main` (`6b0afe7`) ba tệp `scripts/install-collector-api.sh`, `pipeline/cron/com.oneinvest.collector-api.plist`,
  `collector/scripts/api-launchd.sh` vào scratchpad. Chạy probe `logs-tmp.sh` hiện hành với gốc là bản xuất đó: có hai dòng FAIL
  (không tạo `pipeline/logs`; plist cũ bị đè thành rỗng) và không có dòng LOGS-TMP OK.
- E3: ghi đè tạm `collector/src/core/scheduler.ts` bằng bản origin/main, `tsc`, rồi chạy riêng `dist/test/snapshot-skip-khong-rac.test.js`.
  Hai ca skip đỏ: mỗi ca để lại 1 mục trong `snapshotRoot` khi test đòi 0 mục. Ca lượt thật xanh. Sau đó `git checkout --` tệp đó,
  build lại, chạy lại test được 3/3.
- E4: probe `cai-dat.sh` và các tệp của origin/main trên bản xuất. Kết quả CAI-DAT PASS, tức green.
- E5: xem note của E5.

Kiểm thêm, không phải eval:
- `mktemp` trên macOS tạo tệp trong thư mục tạm riêng của user và bỏ qua `TMPDIR` đặt tay. Thư mục đó cùng volume với
  `~/Library/LaunchAgents` (cùng `st_dev`), nên trên máy này `mv` là rename nguyên tử.
- Test cửa sổ giờ tất định ở mọi giờ, kể cả 22h và 23h, vì `inActivityWindow` dùng `h >= lo && h < hi`.

## Variance

none — 6 eval tất định, mỗi lệnh chạy một lần trên HEAD. E1/E2 dùng chung một output.

## Iterations

Round 1: 6/6 eval đạt trên `b914cb0`. Baseline đỏ ở E1, E2, E3, E5; E4 xanh (rào hồi quy); E6 không đo baseline. «Ngoài hợp đồng»
có 1 mục mức low (tệp tạm rỗng còn lại khi lượt cài lỗi); người quyết. PASS.

### Re-pin lần 1 — 2026-10-26, do gộp main 31d80ff (#112)
run_id: repin-20261026T073422Z-60957
sha: c289a0a04dda822ab048106dd34423345bbd5198 · suites: 6 lệnh exit 0 · evals: 6/6 eval máy đạt kỳ vọng
