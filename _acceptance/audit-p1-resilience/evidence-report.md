---
schema_version: 2
feature_slug: audit-p1-resilience
verdict: PASS
failed_evals: []
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: 1a9af05c38d5340788a8a5fc518af673bd4dd554
human_signoff:
---

# Evidence Report: audit-p1-resilience

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | script | PASS |
| E2 | AC-2 | script | PASS |
| E3 | AC-3 | script | PASS |
| E4 | AC-4 | script | PASS |
| E5 | AC-5 | script | PASS |
| E6 | AC-6 | script | PASS |
| E7 | AC-1 | script | PASS |
| E8 | AC-6 | test | PASS |

Ghi chú định dạng: các đoạn `output:` dưới đây chép từ đầu ra thật (`run-log.jsonl` giữ mã thoát máy ghi). Chỗ harness in mã thoát khác không của watchdog/script con (ca có chủ đích: kill dưới stub, nạp lỗi) đã được thay bằng chữ `[thoát ≠ 0]` để giữ nhất quán L1. Mỗi lệnh eval tự nó kết thúc thành công.

## Evidence

- eval: E1
  run_id: audit-p1-resilience-E1-20261023T160559
  exit_code: 0
  baseline: red
  verifier: config:executors.script.zc3_l4b_scan
  verified_at: 2026-10-23T09:06:00Z
  output: |
    ok   A ngày mới 5 dòng > ngày cũ 2 dòng: agent-turn ở dòng 1 ĐƯỢC quét
    ok   A quét toàn bộ 5 dòng ngày mới (được 5)
    ok   A' cùng đường dẫn, tệp mới dài hơn: dòng 1 ĐƯỢC quét
    ok   B truncate 6 → 2 dòng: quét toàn bộ 2 dòng
    ok   C tệp không đổi: đầu ra rỗng
    ok   D nối 2 dòng: chỉ in 2 dòng mới, turn cũ không lặp (in 2 dòng)
    ok   E marker "4211": stderr rỗng · quét toàn bộ 3 dòng · marker được viết lại sang định dạng mới
    ok   F marker rỗng: không in lịch sử (kể cả turn cũ)
    ok   G tệp chưa có: im lặng, không tạo marker
    L4B-SCAN PASS

- eval: E2
  run_id: audit-p1-resilience-E2-20261023T160708
  exit_code: 0
  baseline: red
  verifier: config:executors.script.zc3_gateway
  verified_at: 2026-10-23T09:07:10Z
  output: |
    an toàn: launchctl/pkill/pgrep/osascript/curl/sleep → stub trong thư mục tạm
    lượt 1 (gw-marker rỗng): exit 0 · gw-marker …:326777180:36
    ok   lượt 1: không alert/kill dù lịch sử có agent-turn (chỉ khởi tạo)
    ok   lượt 1: 30 'drop no mention' cũ không gây WARN L4a
    ok   lượt 1: gw-marker = đường_dẫn:inode:36
    ok   lượt 1: turn-marker '4211' được viết lại, không lỗi · stderr rỗng
    ok   lượt 2 (không dòng mới): exit 0, không kill
    lượt 3 (turn mới trong gateway.log): [thoát ≠ 0] · stub gọi: launchctl bootout gui/503/ai.openclaw.gateway | pkill -9 -f openclaw
    ok   lượt 3: alert KILL ghi đúng lý do gateway.log · gọi launchctl bootout + pkill (STUB)
    GATEWAY PASS

- eval: E3
  run_id: audit-p1-resilience-E3-20261023T160710
  exit_code: 0
  baseline: red
  verifier: config:executors.script.zc3_l4a_drop
  verified_at: 2026-10-23T09:07:12Z
  output: |
    an toàn: launchctl/pkill/pgrep/osascript/curl/sleep → stub trong thư mục tạm
    +25 drop: exit 0 · WARN: 'drop no mention' +25 trong 5′ (ngưỡng 20) — spam hay gate nhầm nhóm?
    ok   +25 drop ≥ ngưỡng 20: một dòng WARN L4a kèm số đếm
    ok   +25 drop: không kill OpenClaw
    ok   +25 drop: có thông báo L4a (stub osascript)
    ok   should-NOT-fire: +19 drop (dưới ngưỡng) → không thêm WARN
    ok   biên: +20 drop (đúng ngưỡng) → WARN
    L4A-DROP PASS

- eval: E4
  run_id: audit-p1-resilience-E4-20261023T160712
  exit_code: 0
  baseline: red
  verifier: config:executors.script.zc3_l5b_db
  verified_at: 2026-10-23T09:07:13Z
  output: |
    cổng 49167 không nghe: exit 0 · nhịp: ok — bindings=0, mention-all, no bot, handler read-only, 0 turn mới, kev:ok, db:DOWN(16:07)
    ok   DB không nghe: alerts có WARN L5b
    ok   DB không nghe: dòng nhịp ghi db:DOWN(HH:MM)
    ok   DB không nghe: KHÔNG kill OpenClaw
    ok   DB không nghe: có thông báo L5b (stub osascript)
    cổng 49169 đang nghe: exit 0 · nhịp: ok — …, kev:ok, db:ok
    ok   should-NOT-fire: DB nghe → không thêm WARN L5b
    L5B-DB PASS

- eval: E5
  run_id: audit-p1-resilience-E5-20261023T160719
  exit_code: 0
  baseline: red
  verifier: config:executors.script.zc3_import_daily
  verified_at: 2026-10-23T09:07:21Z
  output: |
    1 mọi snapshot ok: exit 0 · state 2026-10-22T080000000 · nạp 060, 070, 080 · sleep 0 lần · transform có
    ok   should-NOT-fire: snapshot cũ hơn state không nạp lại; 3 snapshot mới nạp
    2 snapshot giữa lỗi thường: [thoát ≠ 0] · state 2026-10-22T060000000 · nạp 060, 070 · sleep 0 lần · transform không
    ok   2: state giữ · chuỗi DỪNG · không retry · transform/refresh KHÔNG chạy · log báo snapshot fail
    3 ECONNREFUSED 2 lần rồi lên: exit 0 · state 2026-10-22T080000000 · 070 thử #1 #2 #3 · sleep 2 lần · transform có
    ok   3: snapshot đó thử 3 lần (2 retry) · chờ 20s trước mỗi lần thử lại
    4 ECONNREFUSED mãi: [thoát ≠ 0] · state 2026-10-22T060000000 · 070 thử #1…#5 · sleep 5 lần · transform không
    ok   4: đúng 5 lần thử · chờ 20s giữa các lần (5 lần sleep) · dừng chuỗi, không transform
    IMPORT-DAILY PASS

- eval: E6
  run_id: audit-p1-resilience-E6-20261023T160721
  exit_code: 0
  baseline: red
  verifier: config:executors.script.zc3_err_detail
  verified_at: 2026-10-23T09:07:21Z
  output: |
    ok   pipeline/collect-chotot.mjs: main().catch in errDetail(e) rồi thoát lỗi
    ok   pipeline/collect-chotot.mjs: AggregateError message rỗng → «ECONNREFUSED — Error: connect ECONNREFUSED ::1:5433; Error: connect ECONNREFUSED 127.0.0.1:5433»
    ok   pipeline/collect-chotot.mjs: lỗi thường giữ nguyên message · lỗi không code/message vẫn in được
    ok   pipeline/import-chotot.mjs: main().catch in errDetail(e) rồi thoát lỗi
    ok   pipeline/import-chotot.mjs: AggregateError message rỗng → in code + cả hai lỗi con
    ok   pipeline/import-chotot.mjs: lỗi thường giữ nguyên message · lỗi không code/message vẫn in được
    import-chotot, DB cổng 49182 không nghe: [thoát ≠ 0] · ❌ ECONNREFUSED — Error: connect ECONNREFUSED ::1:49182; Error: connect ECONNREFUSED 127.0.0.1:49182
    ok   import-chotot: thoát lỗi đúng mã kỳ vọng · dòng ❌ có ECONNREFUSED và địa chỉ:cổng (không còn ❌ trống)
    ERR-DETAIL PASS

- eval: E7
  run_id: audit-p1-resilience-E7-20261023T160721
  exit_code: 0
  baseline: green
  verifier: config:executors.script.zc3_syntax
  verified_at: 2026-10-23T09:07:21Z
  output: |
    SYNTAX OK

- eval: E8
  run_id: audit-p1-resilience-E8-20261023T160726
  exit_code: 0
  baseline: green
  verifier: config:executors.test.pipeline
  verified_at: 2026-10-23T09:07:27Z
  output: |
    ✔ FILL không chứa stg_zalo_posts (media, media_files = ảnh PII tầng A) (0.062875ms)
    ✔ không bảng nào trong FILL có cột ảnh media/media_files (schema DB local) (28.627583ms)
    ✔ mediaFilesOf: v1 / không ảnh / mảng rỗng → null (SQL NULL, COALESCE giữ bản cũ) (0.065625ms)
    ℹ tests 52
    ℹ pass 52
    ℹ fail 0
    ℹ cancelled 0
    ℹ skipped 0

### Phép thử phản biện (ngoài eval, an toàn)

Tệp ở `_acceptance/audit-p1-resilience/evidence/`. Mỗi script kèm một tệp `.txt` chứa đầu ra thật.
- `probe-scan-edges.sh`: chỉ chạy hàm `scan_new_lines` trích nguyên văn, trên tệp giả. Không chạy watchdog.
- `probe-baseline-l4b.sh`: chạy khối L4b của 47680c0 trích nguyên văn, với `alert()` thay bằng echo.
- `probe-import-multicity.sh`: chạy bản chép `zalo-import-daily.sh` với HOME giả. Script kiểm stub thắng PATH bằng `command -v` trước khi chạy.
- `probe-import-airbnb-econn.sh`: chạy `import-airbnb.mjs` thật với DB trỏ sang cổng không ai nghe. Snapshot giả rỗng, lỗi xảy ra ở `connect()`, không ghi gì.

## Known limits

- Watchdog trong E2, E3 và E4 chạy bản chép đã đổi đúng hai dòng: `OC_LOG_GLOB` trỏ sang tệp giả, `/dev/tcp/127.0.0.1/5433` trỏ sang cổng giả. Tôi đã đọc harness và xác nhận ba điều:
  - harness bỏ chạy nếu diff khác 2 dòng hoặc số dòng lệch;
  - `assertStubsWin` kiểm `command -v` cho launchctl, pkill, pgrep, osascript, curl và sleep trước mỗi sandbox, và đầu ra in «an toàn: … → stub»;
  - PATH của sandbox là `/usr/bin:/bin`, nên bash là `/bin/bash`, đúng shebang của watchdog.

  `alert()` không dùng builtin `kill`, nên stub phủ hết đường kill. E1 thì chạy hàm `scan_new_lines` trích nguyên văn chứ không chạy cả script.
- `pgrep` là stub và luôn trả «OpenClaw đang chạy». Chưa lượt nào chạy trên OpenClaw thật hay log thật. Mẫu dòng log (`auto-reply/agent-turn-timing`, `drop no mention`) lấy theo chuỗi mà watchdog grep, chưa đối chiếu với `~/Library/Logs/openclaw/gateway.log` thật (luật 8: không đọc).
- L5b chỉ đo cổng TCP giả: một cổng vừa đóng và một server node. Postgres thật :5433 chưa được đo. Watchdog cũng chỉ mở TCP, nên Postgres treo mà cổng còn mở vẫn ra `db:ok` (đúng như thiết kế trong contract).
- E5 dùng `import-airbnb.mjs`, `transform-zalo.mjs` và `refresh-bait-gap.mjs` bản giả. `sleep` là stub, nên chưa lần nào chờ 20s thật. Nhánh retry dựa vào chữ `ECONNREFUSED` trong đầu ra. Phép thử `probe-import-airbnb-econn` cho thấy `import-airbnb.mjs` thật (in `console.error(e)`, không qua errDetail) với DB ở cổng chết in 6 dòng chứa ECONNREFUSED, nên nhánh retry kích được với tiến trình thật. Chuỗi 5×20s với DB lên lại thật thì chưa đo.
- AC-1 ca «cùng đường dẫn, tệp thay mới» chỉ phân biệt được qua inode khác. Nếu hệ tệp cấp lại đúng inode cũ cho tệp mới cùng đường dẫn, ca này thành «nối dòng» và sót phần đầu. Trên APFS hiếm gặp, chưa đo.
- Ngày triển khai: lượt watchdog thật đầu tiên gặp marker `4211` sẽ quét TOÀN BỘ log /tmp của hôm đó (đúng AC-1 ca E). Nếu log hôm đó đã có dòng agent-turn mà code cũ bỏ sót, lượt này kill OpenClaw ngay. Về hành vi thì đó là cảnh báo đúng, nhưng người triển khai nên biết trước. Tôi không đọc log /tmp thật để kiểm.
- E6 chỉ chạy tiến trình thật với `import-chotot.mjs`. Với `collect-chotot.mjs`, eval chỉ trích hàm errDetail và kiểm chuỗi `main().catch`, chưa chạy tiến trình.

## Ngoài hợp đồng

- **Đuôi log /tmp ngày cũ không bao giờ được quét** (có từ trước, code cũ cũng vậy). Dòng ghi vào `openclaw-<hôm qua>.log` sau lượt quét cuối (khoảng 23:55 đến 00:00) bị bỏ, vì lượt 00:00 chỉ nhìn tệp ngày mới. Tái hiện an toàn: `bash _acceptance/audit-p1-resilience/evidence/probe-scan-edges.sh`, ca P1 ra «SÓT». Lớp gateway.log mới gỡ được ca này nếu gateway.log chứa cùng dòng agent-turn (theo `.claude/rules/zalo-safety.md`, đó là log đầy đủ), nhưng điều này chưa được đo. Nếu gateway.log cũng xoay theo ngày bằng cách đổi tên thì cùng lỗ đó áp vào nó.
- **Truncate rồi lớn lại vượt số dòng cũ trong cùng một cửa sổ 5′, giữ inode, thì sót phần đầu.** Tái hiện: ca P2 của cùng probe, 3 dòng → ghi đè 5 dòng có turn ở dòng 1, kết quả «SÓT». Contract chỉ đòi ca truncate «ít dòng hơn» tại lúc quét, nên ca này nằm ngoài AC-1. Rủi ro thấp nếu OpenClaw chỉ ghi nối.
- **Marker có trường số dòng hỏng mà đường dẫn và inode khớp** (vd `đường_dẫn:inode:`): `[ -lt ]` báo «integer expression expected» lên stderr, lượt đó không in gì, marker bị viết lại «lành», nên turn của lượt đó mất vĩnh viễn (ca P3). Chỉ xảy ra khi có người sửa tay marker. Ca `wc` lỗi vì tệp biến mất giữa chừng sẽ ghi inode `0`, nên tự lành ở lượt sau.
- **`zalo-import-daily.sh` với snapshot zalo-agent ở nhiều thư mục city.** Vòng lặp sắp theo đường dẫn (city trước, TS sau) nhưng state là max TS. Ví dụ: city A (sắp trước) nạp được T09, rồi city B gặp lỗi ở T06. Khi đó state thành T09, nên T06 (lỗi) và T07 (chưa từng thử vì chuỗi đã dừng) không bao giờ được nạp lại. Code cũ không dừng chuỗi nên ít ra còn thử T07. Tái hiện an toàn: `bash _acceptance/audit-p1-resilience/evidence/probe-import-multicity.sh`, ra «KHÔNG BAO GIỜ được nạp». Hiện chỉ là rủi ro tiềm ẩn: `collector/src/api/main.ts` dùng một `CITY` (mặc định `hanoi`) cho một tiến trình API. Nó thành lỗi thật khi có city thứ hai. Cách gỡ gợi ý (không sửa): sắp theo TS, hoặc ghi state = min(TS lỗi) − ε.
- `import_one` vẫn `sleep 20` sau lần thử thứ 5 rồi mới trả lỗi, nên phí 20s ở ca DB chết hẳn (E5 ca 4 đếm được 5 lần sleep cho 5 lần thử). Vô hại về đúng sai.
- L4a so số «drop no mention» MỚI với ngưỡng «trong 5′», nhưng thực ra đếm mọi dòng kể từ lượt trước. Nếu watchdog không chạy một lúc (máy ngủ, OpenClaw tắt nên thoát sớm ở `pgrep`), hoặc gateway.log xoay (quét toàn tệp mới), số đếm dồn lại và có thể ra WARN giả. Đây chỉ là WARN, không kill.

## Analyst

Non-discriminating evals: E7 và E8 xanh cả trên 47680c0. E7 là kiểm cú pháp, E8 là suite hồi quy pipeline (52/52 trên cả hai cây). Cả hai là lưới chống hồi quy có chủ đích, không chứng tính năng. Sức phân biệt của AC-1 nằm ở E1, của AC-6 nằm ở E6.

Baseline đo trên worktree tạm của 47680c0 (detached) đặt ngoài repo trong thư mục scratchpad. Tôi chép harness sang cây đó, symlink `pipeline/node_modules`, chạy từng mode, rồi gỡ bằng `git worktree remove --force`.
- E1: đỏ về cấu trúc, harness ném lỗi «không tìm thấy scan_new_lines()». Đỏ về hành vi được chứng thêm bằng `evidence/probe-baseline-l4b.sh`: khối L4b cũ trích nguyên văn, ngày cũ 2 dòng rồi ngày mới 5 dòng có turn ở dòng 1 thì «KHÔNG alert (sót turn)». Đây đúng là lỗi mà AC-1 sửa.
- E2, E3, E4: đỏ về cấu trúc, harness bỏ chạy vì watchdog cũ không có token `:5433`. Nó dừng trước khi dựng sandbox, nên không chạy gì trên code cũ. Watchdog cũ không quét gateway.log và không có L4a/L5b, nên hành vi kỳ vọng vắng hẳn.
- E5: đỏ về hành vi, 11 mục trượt trên script cũ: không thoát lỗi, state nhảy qua snapshot lỗi, không retry, transform vẫn chạy.
- E6: đỏ về cấu trúc, harness báo «không thấy errDetail».

## Variance

none — every multi-run eval is uniform (không eval nào khai runs > 1)

## Iterations

Round 1: E1–E8 đều đạt expected trên 1a9af05. Không eval nào trượt. `run-log.jsonl` còn ba dòng `evalId` dạng «E2 gateway», «E3 l4a-drop», «E4 l5b-db» lúc 09:07:00Z. Đó là lần gọi sai của chính verifier: zsh không tách từ nên harness nhận mode rỗng và chỉ in hướng dẫn dùng, không chạy sandbox nào. Ba dòng được giữ nguyên để trung thực. Lượt chạy đúng của E2, E3 và E4 là các run_id ghi ở trên.
