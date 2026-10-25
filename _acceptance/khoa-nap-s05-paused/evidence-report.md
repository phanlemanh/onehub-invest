---
schema_version: 2
feature_slug: khoa-nap-s05-paused
verdict: PASS
failed_evals: []
reason:
verified_by: feature-loop:cham-lenh
enforcement_mode: strict
bypass_used: false
verified_commit: c4511d1ac45be63c226bffbef7220ad8f5516d95
human_signoff:
---

# Evidence Report: khoa-nap-s05-paused

Vòng verify 1, cây `c4511d1` (nhánh `claude/acceptance-khoa-nap-s05-paused`; merge-base = origin/main `5104013`). Cây này
gộp ZCode `d60b8e6` (2510-4 + 2510-9) và `a92ed3f` (2510-14 G1). DB local :5433 đang chạy (container `one-invest-db`). Phiên
chấm không viết mã này và không gọi Apify, launchctl, không ghi DB oneinvest. Probe S05 dựng DB tạm `acc_s05_<pid>` rồi
tự xoá, và sau lượt chạy không còn DB `acc_s05%` nào.

Cả 13 eval đều đạt `expected`, kể cả các vế should-NOT-fire. Baseline (bốn tệp của origin/main, chạy với harness, probe và test
bản nhánh) đỏ ở 10 eval. E2 và E9 xanh trên baseline vì là guard có chủ ý (xem Analyst); E10 không đo baseline. Phiên chấm có
6 phát hiện ngoài hợp đồng: 1 mức medium (cửa sổ 4 ngày không đệm) và 5 mức low. Chi tiết ở `review-findings.md`.

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | script | PASS |
| E2 | AC-2 | script | PASS |
| E3 | AC-3 | script | PASS |
| E4 | AC-4 | script | PASS |
| E5 | AC-5 | script | PASS |
| E6 | AC-4 | test | PASS |
| E7 | AC-6 | script | PASS |
| E8 | AC-7 | script | PASS |
| E9 | AC-7 | test | PASS |
| E10 | AC-8 | script | PASS |
| E11 | AC-9 | script | PASS |
| E12 | AC-10 | script | PASS |
| E13 | AC-10 | test | PASS |

## Evidence

E1–E3 dùng chung một lượt `au3_lock`, E4/E5 dùng chung một lượt `kns_s05_gate`, và E11/E12 dùng chung một lượt
`kns_lich_s05`. Mỗi eval có dòng run-log riêng. Mọi lệnh chạy từ gốc kho, tool timeout 600 s; lệnh dài nhất là E9, 27 giây.

- eval: E1
  run_id: khoa-nap-s05-paused-E1-r1-20261025T105807Z
  exit_code: 0
  baseline: red
  verifier: config:executors.script.au3_lock
  verified_at: 2026-10-25T10:58:07Z
  output: |
    apify-facebook-daily.sh khoá PID chết 97909: exit 0 · import 3
    ok   apify-facebook-daily.sh: log 'gỡ khoá cũ của PID <n>'
    ok   apify-facebook-daily.sh: khoá PID chết → gỡ lấy lại, nạp bình thường
    zalo-import-daily.sh khoá PID chết 98466: exit 0 · import 3
    ok   zalo-import-daily.sh: log 'gỡ khoá cũ của PID <n>'
    ok   zalo-import-daily.sh: khoá PID chết → gỡ lấy lại, nạp bình thường
    LOCK PASS
  note: harness còn kiểm rằng log có đúng số PID và rằng khoá tự dọn sau lượt. Trên baseline, cả ba vế của ca PID chết đều đỏ ở hai tệp bọc (không có dòng gỡ, không nạp), và harness kết thúc bằng «LOCK» đỏ, 8 mục.

- eval: E2
  run_id: khoa-nap-s05-paused-E2-r1-20261025T105807Z
  exit_code: 0
  baseline: green
  verifier: config:executors.script.au3_lock
  verified_at: 2026-10-25T10:58:07Z
  output: |
    ok   apify-facebook-daily.sh: PID sống → chờ hết lượt, thoát ≠0, KHÔNG nạp
    ok   apify-facebook-daily.sh: không đụng khoá của PID sống
    ok   zalo-import-daily.sh: PID sống → chờ hết lượt, thoát ≠0, KHÔNG nạp
    ok   zalo-import-daily.sh: không đụng khoá của PID sống
    LOCK PASS
  note: should-NOT-fire đạt. Ở hai tệp bọc, với khoá PID sống, harness ghi «import 0», và tệp `pid` trong khoá vẫn là PID của harness. Các ca cũ của LOCK có «sleep 59», tức 60 lượt chờ. Lệnh `au3_lock` đỏ trên baseline, nhưng riêng hai vế của E2 thì xanh, vì bản main vốn chờ mọi khoá. Đây là guard có chủ ý (Analyst).

- eval: E3
  run_id: khoa-nap-s05-paused-E3-r1-20261025T105807Z
  exit_code: 0
  baseline: red
  verifier: config:executors.script.au3_lock
  verified_at: 2026-10-25T10:58:07Z
  output: |
    apify-facebook-daily.sh khoá >2h: exit 0 · import 3
    ok   apify-facebook-daily.sh: khoá >2h → gỡ lấy lại, nạp bình thường
    zalo-import-daily.sh khoá >2h: exit 0 · import 3
    ok   zalo-import-daily.sh: khoá >2h → gỡ lấy lại, nạp bình thường
    LOCK PASS
  note: khoá có `luc` = bây giờ − 7201 giây và PID là harness đang sống. Trên baseline, cả hai tệp bọc đều ghi «import 0» và vế này đỏ.

- eval: E4
  run_id: khoa-nap-s05-paused-E4-r1-20261025T105814Z
  exit_code: 0
  baseline: red
  verifier: config:executors.script.kns_s05_gate
  verified_at: 2026-10-25T10:58:14Z
  output: |
    ok   (a) S05 paused: collector thoát 0 (được 0)
    ok   (a) log 'S05 paused — bỏ qua thu'
    ok   (a) should-NOT-fire: 0 lời gọi mạng (được 0: )
    ok   (a) không in real_name ra log
    ok   (d) thiếu dòng S05: bỏ qua thu, exit 0, 0 lời gọi mạng (code 0)
    ok   DB tạm đã xoá
    S05-GATE PASS
  note: collector THẬT chạy trên DB tạm, với HOME giả và fetch bị thay bằng bản đếm lời gọi. Trên baseline, (a) đỏ ở cả mã thoát lẫn dòng log, và (d) cũng đỏ: collector main không có cổng, đi thẳng tới creds rồi hỏng. Probe in «S05-GATE» đỏ, 4 mục.

- eval: E5
  run_id: khoa-nap-s05-paused-E5-r1-20261025T105814Z
  exit_code: 0
  baseline: red
  verifier: config:executors.script.kns_s05_gate
  verified_at: 2026-10-25T10:58:14Z
  output: |
    ok   (b) S05 active: should-NOT-fire — không có dòng 'S05 paused'
    ok   (b) active + HOME giả không token: collector đi tiếp tới creds và thoát khác 0
    ok   (b) không gọi Apify thật
    ok   (c) DB không tới: log cảnh báo 'coi như active' (fail-open)
    ok   (c) DB không tới: không coi là paused
    S05-GATE PASS
  note: phiên chấm chạy thêm collector với DB ở cổng đóng, qua đường symlink. Log có «⚠ source_registry DB fail (connect ECONNREFUSED …) — coi như active», tiếp theo là lỗi đọc `~/.oneinvest/cloud.env` của HOME giả, với 0 lời gọi fetch. Trên baseline, vế (b) xanh vì main vốn không có cổng, còn vế (c) đỏ vì không có dòng cảnh báo.

- eval: E6
  run_id: khoa-nap-s05-paused-E6-r1-20261025T105823Z
  exit_code: 0
  baseline: red
  verifier: config:executors.test.kns_s05_unit
  verified_at: 2026-10-25T10:58:23Z
  output: |
    ✔ s05Skip: chỉ 'active' là thu; mọi giá trị khác (paused/null/lạ) đều bỏ
    ✔ should-NOT-fire: 'active' bị đổi nhầm thành 'paused' sẽ chặn nhầm thu
    ℹ tests 2
    ℹ pass 2
    ℹ fail 0
  note: trên baseline, tệp test bản nhánh không nạp được collector main («does not provide an export named 's05Skip'»), nên bộ báo «ℹ pass 0».

- eval: E7
  run_id: khoa-nap-s05-paused-E7-r1-20261025T105825Z
  exit_code: 0
  baseline: red
  verifier: config:executors.script.au3_apify
  verified_at: 2026-10-25T10:58:25Z
  output: |
    ok   (e) một dòng log rõ về mã thu
    ok   (e) snapshot sẵn có vẫn được nạp đủ
    ok   (e) transform + refresh vẫn chạy
    ok   (e) mã thoát cuối = mã bước thu (1)
    ok   (e) state tới snapshot cuối
    APIFY PASS
  note: các ca (a)–(d) cũ của APIFY vẫn xanh. Trên baseline, ở ca (e), tệp bọc main nạp đủ 3 snapshot và chạy transform nhưng thoát 0: mã thu bị nuốt, và cũng không có dòng log mã thu. Hai vế này đỏ, và harness kết thúc bằng «APIFY» đỏ, 2 mục.

- eval: E8
  run_id: khoa-nap-s05-paused-E8-r1-20261025T105838Z
  exit_code: 0
  baseline: red
  verifier: config:executors.script.kns_au3_regress
  verified_at: 2026-10-25T10:58:38Z
  output: |
    TS-FORMAT PASS
    APIFY PASS
    CHOTOT PASS
    LOCK PASS
  note: trên baseline, TS-FORMAT xanh, rồi vòng lặp dừng ở APIFY (ca e đỏ).

- eval: E9
  run_id: khoa-nap-s05-paused-E9-r1-20261025T105911Z
  exit_code: 0
  baseline: green
  verifier: config:executors.test.scripts
  verified_at: 2026-10-25T10:59:11Z
  output: |
    ✔ AC-2 apify-facebook-daily: mọi bước lành → 0, nhật ký lời gọi khớp dãy viết trước
    ✔ AC-3 apify-facebook-daily · DB tắt hẳn
    ✔ zalo-import-daily.sh: state 6 số cũ không cản snapshot mili-giây mới
    ℹ tests 178
    ℹ pass 178
    ℹ fail 0
    ℹ skipped 0
  note: lệnh canh hồi quy cho AC-7. Bộ chạy 27 giây. Trên worktree tạm tách rời tại origin/main, bộ cũng xanh 178/178 (Analyst).

- eval: E10
  run_id: khoa-nap-s05-paused-E10-r1-20261025T105839Z
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.kns_scope
  verified_at: 2026-10-25T10:58:39Z
  output: |
    ok  pipeline/apify-facebook-collector.mjs
    ok  pipeline/cron/com.oneinvest.apify-facebook.plist
    ok  scripts/apify-facebook-daily.sh
    ok  scripts/au3-nap-bao-loi/acceptance.mjs
    ok  scripts/zalo-import-daily.sh
    SYNTAX OK
    SCOPE OK
  note: should-NOT-fire đạt, không có dòng «NGOÀI PHẠM VI». Probe liệt kê 15 tệp, tất cả nằm trong danh sách cho phép, và không có tệp transform hay app nào. `git diff --stat origin/main...HEAD` cũng cho đúng 15 tệp đó.

- eval: E11
  run_id: khoa-nap-s05-paused-E11-r1-20261025T105839Z
  exit_code: 0
  baseline: red
  verifier: config:executors.script.kns_lich_s05
  verified_at: 2026-10-25T10:58:39Z
  output: |
    ok   plist hợp lệ (plutil -lint: …/com.oneinvest.apify-facebook.plist: OK)
    ok   lịch đúng Thứ Ba + Thứ Sáu 06:00 (được 2@6:00,5@6:00)
    ok   should-NOT-fire: không còn mục lịch hằng ngày (mọi mục có Weekday)
    ok   plist khai S05_RESULTS_LIMIT=100 (được 100)
    ok   cửa sổ bài plist ≥ 4 ngày, phủ khoảng Sáu→Ba (được '4 days')
    LICH-S05 PASS
  note: trên baseline, lịch đọc được là «undefined@0:00,undefined@12:00,undefined@18:00,undefined@6:00» (4 mốc hằng ngày), và plist không khai trần hay cửa sổ. Cả bốn vế đều đỏ.

- eval: E12
  run_id: khoa-nap-s05-paused-E12-r1-20261025T105839Z
  exit_code: 0
  baseline: red
  verifier: config:executors.script.kns_lich_s05
  verified_at: 2026-10-25T10:58:39Z
  output: |
    ok   mặc định không env: trần 100, cửa sổ '4 days'
    ok   should-NOT-fire: không còn cửa sổ 12 giờ của lịch cũ
    ok   env rác cho trần → 100 (được 100); cửa sổ đọc env (7 days)
    ok   trần âm → 100 (được 100)
    ok   trần hợp lệ được giữ; mỗi nhóm một startUrl
    LICH-S05 PASS
  note: trên baseline, collector main không có `buildRunInput` («TypeError: mod.buildRunInput is not a function»), và input viết cứng `onlyPostsNewerThan: "12 hours"`. Vì collector main gọi `main()` ngay khi bị import, phiên chấm chạy baseline với HOME giả và fetch bị chặn qua `NODE_OPTIONS=--import`, và đếm được 0 lời gọi mạng.

- eval: E13
  run_id: khoa-nap-s05-paused-E13-r1-20261025T105825Z
  exit_code: 0
  baseline: red
  verifier: config:executors.test.kns_lich_unit
  verified_at: 2026-10-25T10:58:25Z
  output: |
    ✔ cửa sổ mặc định phủ khoảng cách lượt dài nhất của lịch Ba/Sáu (≥ 4 ngày)
    ✔ S05_NEWER_THAN env đè được (G2/V1 chỉnh) — kiểm cả plist pin '4 days'
    ✔ S05_RESULTS_LIMIT rác/không hợp lệ → về mặc định 100 (không NaN)
    ℹ tests 3
    ℹ pass 3
    ℹ fail 0
  note: trên baseline, tệp test không nạp được collector main («does not provide an export named 'S05_NEWER_THAN_MAC_DINH'»). Tên ca thứ hai nói «kiểm cả plist», nhưng ca này không đọc plist; phần plist do E11 kiểm.

Network truth: không có eval `ui-check`. Cả 13 eval là `script`/`test`: n-a (driver).

Kho sau các lượt chạy: `git status` chỉ có `run-log.jsonl` mới của hồ sơ này, cộng thay đổi `app/next-env.d.ts` có sẵn từ trước
phiên. `pipeline/logs/` của worktree không còn khoá nào. Worktree tạm dùng cho baseline đã được gỡ bằng `git worktree remove`.

## Known limits

- Hai tác vụ cùng gặp một khoá cũ có thể cùng gỡ (Out of scope, xác nhận đúng như khai). Khoá rỗng kiểu cũ vẫn phải gỡ tay;
  kill -9 giữa `mkdir` và lúc ghi `pid`/`luc` cũng để lại khoá rỗng.
- Fail-open khi DB không tới hoặc truy vấn `source_registry` lỗi: lúc S05 đang paused, một lượt vẫn gọi Apify và nhận 402
  (lựa chọn của AC-5). `s05Status` không đặt timeout kết nối.
- SLO độ tươi S05 = 96 giờ (trên main) bằng đúng khoảng Sáu→Ba. Lịch mới chỉ có hiệu lực sau khi cài lại plist (G2, 7/11).

## Ngoài hợp đồng

Chi tiết và căn cứ ở `review-findings.md`. Cả sáu mục chưa qua bác bỏ đối kháng; người quyết.
- OOC-1 (medium): `S05_NEWER_THAN=4 days` bằng đúng khoảng Sáu→Ba (96 giờ) và không có đệm, dù chú thích nói «+ đệm». Lượt
  Thứ Ba chạy trễ (máy ngủ, launchd chạy bù) thì bài đăng ở đầu khoảng bị bỏ vĩnh viễn, không có cảnh báo. Đề xuất new-contract:
  5 ngày trở lên, cùng G2.
- OOC-2 (low): tệp `luc` không phải số thì lỗi số học làm bash bỏ cả vòng `until`; tác vụ chạy tiếp không giữ khoá, ghi đè PID
  của chủ đang sống, nạp, rồi trap xoá khoá. Đã tái hiện ở cả hai tệp bọc. Thực tế gần như chỉ xảy ra khi có người sửa tay.
- OOC-3 (low): `rm -rf` thất bại (khoá do user khác tạo) thì `go_khoa_cu` vẫn trả 0, nên vòng chờ quay bận vô hạn, không sleep,
  không trần. Đã tái hiện: 1112 dòng log trong 4 giây.
- OOC-4 (low, lý thuyết): trap `rm -rf` không kiểm chủ khoá. Chủ cũ bị lấy khoá sau 2 giờ, khi kết thúc, xoá khoá của tác vụ mới.
- OOC-5 (low): lỗi bước thu chỉ có dòng «⚠️ bước thu thoát mã N», không theo dòng ghim `JOB FAIL [apify-facebook-daily] bước …`
  của `job-step.sh`. Khi cả thu lẫn transform hỏng, mã cuối là mã thu.
- OOC-6 (low, tài liệu): đầu `scripts/apify-facebook-daily.sh` còn ghi «Chạy 4 lần/ngày … 400 posts/ngày».

## Analyst

Non-discriminating evals:
- E2 (vế should-NOT-fire «PID sống < 2 giờ → chờ, không nạp, không đụng khoá»): xanh trên baseline vì bản main chờ mọi khoá.
  Đây là guard có chủ ý: AC-2 đòi giữ nguyên hành vi cũ cho khoá đang sống. Lệnh chung `au3_lock` vẫn đỏ trên baseline ở
  E1/E3.
- E9 (`node --test scripts/*.test.mjs`): xanh 178/178 trên origin/main. Đây là lệnh canh hồi quy cho AC-7, không phải eval
  hành vi mới.
- Phần riêng của E5: vế (b) «active → đi tới creds» xanh trên baseline, vì main không có cổng. Vế (c) fail-open thì đỏ, nên E5
  vẫn phân biệt được.

Baseline khong do:
- E10 (`kns_scope`): probe đo danh sách tệp đổi `merge-base..HEAD`. Trên cây diffBase không có commit nào của nhánh, nên chạy
  cũng không chứng minh gì.

Cách đo baseline: dựng hai bản. (1) Bản chép trong scratchpad: rsync `pipeline/` (bỏ node_modules và logs), `scripts/` và
`_acceptance/khoa-nap-s05-paused/probes` của HEAD; symlink `pipeline/node_modules` và `app` về kho; rồi ghi đè bốn tệp
`pipeline/apify-facebook-collector.mjs`, `scripts/apify-facebook-daily.sh`, `scripts/zalo-import-daily.sh`,
`pipeline/cron/com.oneinvest.apify-facebook.plist` bằng `git show "${ref}:<tệp>"` với `ref=origin/main`. (2) Worktree tạm
`git worktree add --detach` tại origin/main `5104013`, chép vào harness AU3 bản nhánh, hai test `pipeline/scripts/s05-*` và ba
probe. Harness AU3 dùng bản nhánh, vì bản main thiếu 6 ca lock mới và ca (e) của apify. Hai test mới và ba probe cũng là bản
nhánh, chạy trên mã main. Mọi lượt baseline chạy với HOME giả và `NODE_OPTIONS=--import` chặn fetch, vì collector main gọi
`main()` khi bị import; đếm được 0 lời gọi mạng. Kết quả giống nhau ở cả hai bản: LOCK đỏ 8 mục, APIFY đỏ 2 mục (ca e),
S05-GATE đỏ 4 mục, LICH-S05 đỏ 4 vế plist rồi ngã ở `buildRunInput`, hai test đơn vị không nạp được module. Bộ `scripts/` trên
bản chép (1) đỏ 26 ca vì môi trường: bản chép không có lịch sử git, các ca báo «thiếu lịch sử git». Vì vậy E9 đo trên worktree
(2), xanh 178/178. Merge-base trùng origin/main ở cả bốn tệp đích và `scripts/lib/`.

Kiểm thêm, không phải eval:
- Guard `main()` (`realpathSync(argv[1]) === fileURLToPath(import.meta.url)`) vẫn chạy collector khi gọi qua đường symlink,
  giống launchd qua `~/dev/one-invest`. Collector không im lặng thoát 0.
- PID của user khác (EPERM với `kill -0`) bị coi là chết và khoá được gỡ. Cách xử lý này đúng, vì chủ khoá thật luôn cùng user;
  EPERM nghĩa là PID đã bị tái dùng.
- `s05Status` không in `real_name` (probe E4 kiểm), và chỉ SELECT `status` theo mã `S05`.

## Variance

none — 13 eval tất định, mỗi lệnh chạy một lần trên HEAD. Các eval dùng chung lệnh dùng chung một output (E1/E2/E3; E4/E5;
E11/E12). Harness lock và apify chạy lại trong E8 cho cùng kết quả.

## Iterations

Round 1: 13/13 eval đạt trên `c4511d1`. Baseline đỏ ở E1, E3–E8 và E11–E13. E2 và E9 là guard xanh trên baseline. E10 không đo
baseline. Có 6 phát hiện ngoài hợp đồng (1 medium, 5 low), đã chuyển cho người quyết. PASS.
