---
schema_version: 2
feature_slug: canh-bao-s03-ngung-thu
verdict: PASS
failed_evals: []
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: 0f301eb60f97d40a4cbd7b2f7f1e0a816d1c35db
human_signoff: Mạnh 2026-11-10
---

# Evidence Report: canh-bao-s03-ngung-thu

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | script | PASS |
| E2 | AC-1 | script | PASS |
| E3 | AC-2 | script | PASS |
| E4 | AC-2 | script | PASS |
| E5 | AC-3 | script | PASS |
| E6 | AC-4 | script | PASS |
| E7 | AC-5 | script | PASS |
| E8 | AC-5 | script | PASS |
| E9 | AC-6 | script | PASS |
| E10 | AC-7 | script | PASS |
| E11 | AC-8 | script | PASS |
| E12 | AC-8 | script | PASS |
| E13 | AC-8 | script | PASS |
| E14 | AC-8 | script | PASS |
| E15 | AC-8 | script | PASS |

Tám lệnh riêng biệt, chạy mỗi lệnh một lần (dedupe), Bash timeout 600000 ms; không lệnh nào bị công cụ ngắt. Mọi eval chạy trên bản chép với HOME giả và stub (launchctl/pkill/pgrep/osascript/curl/sleep/date), không chạm gateway thật.

## Evidence

- eval: E1
  run_id: canh-bao-s03-ngung-thu-E1-20261110T084953Z
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.s03_song_bien
  verified_at: 2026-11-10T08:49:53Z
  output: |
    ok   (a) 10 giờ, tuổi 1799s → KHÔNG báo (được 0)
    ok   (a) 10 giờ, tuổi 1800s → báo (được 1)
    BIEN PASS

- eval: E2
  run_id: canh-bao-s03-ngung-thu-E2-20261110T084956Z
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.s03_song_tron
  verified_at: 2026-11-10T08:49:56Z
  output: |
    ok   T2 sự cố: exit 0, KHÔNG kill gateway (exit 0)
    ok   T2: đúng 1 cảnh báo mỗi điều kiện (a,b,c = 1,1,1)
    ok   T2: 3 thông báo màn hình L6 qua stub (được 3)
    ok   T2: state đánh dấu a,b,c ("a\nb\nc\n")
    TRON PASS

- eval: E3
  run_id: canh-bao-s03-ngung-thu-E3-20261110T084953Z
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.s03_song_bien
  verified_at: 2026-11-10T08:49:53Z
  output: |
    ok   (a) giờ 6, snapshot cũ 3600s → KHÔNG báo (được 0)
    ok   (a) giờ 7, snapshot cũ 3600s → báo (được 1)
    ok   (a) giờ 21, snapshot cũ 3600s → báo (được 1)
    ok   (a) giờ 22, snapshot cũ 3600s → KHÔNG báo (được 0)
    BIEN PASS
    (grader đọc harness: mỗi ca dùng state-<k>/alerts-<k> riêng)

- eval: E4
  run_id: canh-bao-s03-ngung-thu-E4-20261110T084956Z
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.s03_song_tron
  verified_at: 2026-11-10T08:49:56Z
  output: |
    ok   T6 should-NOT-fire ban đêm: (a) không báo, không đánh dấu (a = 2)
    TRON PASS
    (grader đọc harness: T6 gọi sb.run(23) — stub date giờ 23; a = 2 là số đếm cũ từ T5, không tăng)

- eval: E5
  run_id: canh-bao-s03-ngung-thu-E5-20261110T084953Z
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.s03_song_bien
  verified_at: 2026-11-10T08:49:53Z
  output: |
    ok   (b) attempt cách 119s, chưa starting → KHÔNG báo (được 0)
    ok   (b) attempt cách 120s, chưa starting → báo (được 1)
    ok   (b) should-NOT-fire: starting sau attempt 10s → không báo (được 0)
    ok   (b) starting có nhưng TRƯỚC attempt cuối → báo (được 1)
    ok   (b) gateway.log vắng → không báo, không lỗi dưới set -u ("")
    BIEN PASS

- eval: E6
  run_id: canh-bao-s03-ngung-thu-E6-20261110T084953Z
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.s03_song_bien
  verified_at: 2026-11-10T08:49:53Z
  output: |
    ok   (c) should-NOT-fire: «linked» không báo
    ok   (c) «Not Linked» viết hoa vẫn báo
    BIEN PASS

- eval: E7
  run_id: canh-bao-s03-ngung-thu-E7-20261110T084956Z
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.s03_song_tron
  verified_at: 2026-11-10T08:49:56Z
  output: |
    ok   T3 tick lại vẫn đỏ: không báo thêm (a,b,c = 1,1,1, thông báo 3)
    ok   T4 hồi: không báo thêm (a,b,c = 1,1,1)
    ok   T4 hồi: state rỗng ("")
    ok   T5 tái phát: báo lại đúng 1 lần mỗi điều kiện, không kill (a,b,c = 2,2,2)
    TRON PASS

- eval: E8
  run_id: canh-bao-s03-ngung-thu-E8-20261110T085005Z
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.s03_song_lib
  verified_at: 2026-11-10T08:50:05Z
  output: |
    ✔ L6-c ĐỎ: status có 'not linked' → WARN c 1 lần; hết → xoá state
    ✔ L6 watchdog móc: zalo-watchdog.sh source lib + gọi đủ 3 kiểm (kiểm tĩnh qua WATCHDOG_FILE, vắng thì skip)
    ✔ L6 notification: cảnh báo gọi osascript stub (không phải /usr/bin/true trong thật) — đếm lời gọi qua stub
    ℹ tests 7
    ℹ pass 7
    ℹ fail 0
    ℹ skipped 0

- eval: E9
  run_id: canh-bao-s03-ngung-thu-E9-20261110T084956Z
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.s03_song_tron
  verified_at: 2026-11-10T08:49:56Z
  output: |
    ok   T1 khoẻ: exit 0, không kill (exit 0)
    ok   T1 should-NOT-fire: 0 cảnh báo sống (a,b,c = 0,0,0)
    ok   T1 stderr không có lỗi của lớp L6 ("")
    ok   T2 sự cố: exit 0, KHÔNG kill gateway (exit 0)
    ok   T5 tái phát: báo lại đúng 1 lần mỗi điều kiện, không kill (a,b,c = 2,2,2)
    TRON PASS

- eval: E10
  run_id: canh-bao-s03-ngung-thu-E10-20261110T084956Z
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.s03_song_tron
  verified_at: 2026-11-10T08:49:56Z
  output: |
    ok   T2 sự cố: exit 0, KHÔNG kill gateway (exit 0)
    ok   T2: đúng 1 cảnh báo mỗi điều kiện (a,b,c = 1,1,1)
    ok   T2: state đánh dấu a,b,c ("a\nb\nc\n")
    TRON PASS

- eval: E11
  run_id: canh-bao-s03-ngung-thu-E11-20261110T085012Z
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.zc3_gateway
  verified_at: 2026-11-10T08:50:12Z
  output: |
    ok   lượt 1: exit 0
    ok   lượt 1: stderr rỗng
    ok   lượt 1: watchdog.log có dòng nhịp ok
    ok   lượt 2 (không dòng mới): exit 0, không kill
    ok   lượt 3: alert KILL ghi đúng lý do gateway.log
    ok   lượt 3: alert gọi launchctl bootout + pkill (STUB — không chạm gateway thật)
    GATEWAY PASS

- eval: E12
  run_id: canh-bao-s03-ngung-thu-E12-20261110T085014Z
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.zc3_l4b_scan
  verified_at: 2026-11-10T08:50:14Z
  output: |
    ok   D nối 2 dòng: chỉ in 2 dòng mới, turn cũ không lặp (in 2 dòng)
    ok   E marker "4211": exit 0, stderr rỗng
    ok   F marker rỗng: không in lịch sử (kể cả turn cũ)
    ok   G tệp chưa có: im lặng, không tạo marker
    L4B-SCAN PASS

- eval: E13
  run_id: canh-bao-s03-ngung-thu-E13-20261110T085019Z
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.zc3b_rotate
  verified_at: 2026-11-10T08:50:19Z
  output: |
    ok   lượt quét cuối ngày: không có gì → exit 0, không kill
    ok   alert KILL ghi đúng lý do (turn từ kênh xã hội)
    ok   alert gọi launchctl bootout + pkill (STUB — không chạm gateway thật)
    ROTATE PASS

- eval: E14
  run_id: canh-bao-s03-ngung-thu-E14-20261110T085022Z
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.zc3b_marker_hong
  verified_at: 2026-11-10T08:50:22Z
  output: |
    ok   (a) should-NOT-fire: gw-marker hỏng KHÔNG làm watchdog kill gateway vì turn của quá khứ
    ok   (c) turn MỚI ghi vào gateway.log sau khi khởi tạo lại → bị bắt, alert KILL
    ok   (b) marker /tmp hỏng + turn ở dòng 1 → vẫn bị bắt, alert KILL
    ok   (b2) inode đúng + số dòng hỏng: không chết dưới set -u, turn dòng 1 file mới bị bắt
    ok   (b2) marker chuyển sang file mới đúng dạng
    MARKER-HONG PASS

- eval: E15
  run_id: canh-bao-s03-ngung-thu-E15-20261110T085008Z
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.s03_song_syntax
  verified_at: 2026-11-10T08:50:08Z
  output: |
    SYNTAX OK

## Known limits

- (b) chỉ so dòng attempt cuối với dòng starting cuối của toàn gateway.log; log xoay kiểu đổi tên thì mất mốc cũ, chỉ báo lại khi có attempt mới.
- (c) khớp «not linked» ở bất kỳ dòng nào của status, kể cả kênh khác.
- Thông báo màn hình chỉ thấy khi người ở máy.
- L6 quét toàn bộ `collector/snapshots` mỗi lượt (hợp đồng ghi đo 0,49 giây trên khoảng 17 nghìn thư mục; grader không đo lại).
- Khung giờ tính theo `TZ=Asia/Ho_Chi_Minh` của máy thu.

## Ngoài hợp đồng

## Analyst

Non-discriminating evals: không đo trong vòng này (baseline lane không chạy).

Baseline khong do: phiên VERIFY độc lập chỉ chạy nhánh hiện tại, không chạy lại trên diffBase. Lib `scripts/lib/s03-song.sh` và harness `scripts/canh-bao-s03-ngung-thu/acceptance.mjs` là tệp mới của tính năng; E11–E15 là bảo vệ hồi quy cho các lớp L1–L5b. Hợp đồng ghi liên làn đã chạy đột biến (bỏ chặn lặp, ngưỡng 1800→3600, khung `-lt 22`→`-le 22`, L6 gọi `alert`) và mỗi đột biến làm đỏ đúng mục tương ứng; grader không chạy lại các đột biến đó.

Ghi chú grader: biên giờ 23 của AC-2 được phủ ở E4 (watchdog trọn vẹn, T6 chạy giờ 23), biên giờ 6/22 ở E3. Ca biên tuổi 1799/1800 trong harness `bien` không kiểm stderr rỗng như các ca giờ và ca (b); stderr sạch của lớp L6 được phủ riêng ở E9 (T1).

## Variance

none — mọi eval chạy một lần, tất định.

## Iterations

Round 1: cả 15 eval qua (8 lệnh riêng biệt, mỗi lệnh chạy một lần). Grader: fresh subagent context, không viết code này.
