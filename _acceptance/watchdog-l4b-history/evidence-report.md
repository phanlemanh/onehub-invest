---
schema_version: 2
feature_slug: watchdog-l4b-history
verdict: PASS
failed_evals: []
reason:
verified_by: feature-loop:cham-lenh
enforcement_mode: strict
bypass_used: false
verified_commit: ee232434e925ded560528b1a3e72b4b6124dc130
human_signoff: Mạnh 2026-10-25
---

# Evidence Report: watchdog-l4b-history

Vòng verify 1. Mọi eval chạy từ gốc worktree `quirky-archimedes-75aa8c`, nhánh `claude/acceptance-watchdog-l4b-history`, HEAD
`ee23243…`. Nhánh gồm ZCode `zcode/watchdog-l4b-history` @71d1232 (lời giao 2410-15), origin/main mới nhất, harness và hồ sơ.
So với origin/main (`169b8c6`), bộ canh chỉ đổi một khối +21 dòng: chế độ `history` của `scan_new_lines`.

An toàn (luật 8), tự xác nhận bằng cách đọc code trước khi chạy:
- Harness `scripts/watchdog-l4b-history/acceptance.mjs` chạy BẢN CHÉP bộ canh trong `mkdtemp`, với HOME giả.
- PATH đặt thư mục stub lên đầu. Harness kiểm `command -v` cả sáu lệnh `launchctl/pkill/pgrep/osascript/curl/sleep` phải về
  stub, sai thì bỏ chạy.
- Bản chép chỉ đổi đúng 2 dòng: đường log /tmp và cổng DB.
- `alert()` chỉ gọi `launchctl`, `pkill` và `osascript`, cả ba đều là stub. Mọi `~/.openclaw` giải theo HOME giả.
- Không chạy `scripts/zalo-watchdog.sh` thật, không gọi `launchctl` thật. Không đọc `~/.openclaw`, `~/Library/Logs/openclaw`
  hay `/tmp/openclaw` thật.
- PID gateway OpenClaw (chỉ đọc bằng `pgrep -f "openclaw.*gateway"`) giữ nguyên 27635: trước khi chạy, sau E1–E9, sau
  baseline và sau thăm dò.

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | script | PASS |
| E2 | AC-2 | script | PASS |
| E3 | AC-3 | script | PASS |
| E4 | AC-4 | script | PASS |
| E5 | AC-5 | script | PASS |
| E6 | AC-6 | script | PASS |
| E7 | AC-6 | script | PASS |
| E8 | AC-6 | script | PASS |
| E9 | AC-7 | script | PASS |

## Evidence

Ghi chú làm sạch: E7 có dòng in mã thoát của bản chép bộ canh. Lượt alert ở đó được kỳ vọng thoát khác không, nên chỗ đó thay
bằng `[thoát khác 0 — đúng kỳ vọng]`. Mã thoát thật của từng lệnh eval nằm trong `run-log.jsonl` (round 1).

- eval: E1
  run_id: watchdog-l4b-history-E1-r1-20261025T231623Z
  exit_code: 0
  baseline: red
  verifier: config:executors.script.wdh_p1
  verified_at: 2026-10-25T23:16:25Z
  output: |
    an toàn: launchctl/pkill/pgrep/osascript/curl/sleep → stub trong thư mục tạm
    ok   P1 marker số cũ: khởi tạo — không kill
    P1 marker số cũ: exit 0 · stub: không
    ok   P1 marker số cũ: should-NOT-fire — KHÔNG kill gateway vì 2 turn cũ của lịch sử
    ok   P1 marker số cũ: có dòng WARN
    ok   P1 marker số cũ: marker ghi lại đúng dạng đường_dẫn:inode:số_dòng
    ok   P1 marker số cũ: sau đó 1 turn MỚI vào gateway.log → lượt kế bị bắt, KILL
    P1 PASS

- eval: E2
  run_id: watchdog-l4b-history-E2-r1-20261025T231625Z
  exit_code: 0
  baseline: red
  verifier: config:executors.script.wdh_p2
  verified_at: 2026-10-25T23:16:26Z
  output: |
    ok   P2 đường dẫn khác: khởi tạo — không kill
    P2 đường dẫn khác: exit 0 · stub: không
    ok   P2 đường dẫn khác: should-NOT-fire — KHÔNG kill gateway vì 2 turn cũ của lịch sử
    ok   P2 đường dẫn khác: có dòng WARN
    ok   P2 đường dẫn khác: marker ghi lại đúng dạng đường_dẫn:inode:số_dòng
    ok   P2 đường dẫn khác: sau đó 1 turn MỚI vào gateway.log → lượt kế bị bắt, KILL
    P2 PASS

- eval: E3
  run_id: watchdog-l4b-history-E3-r1-20261025T231627Z
  exit_code: 0
  baseline: red
  verifier: config:executors.script.wdh_p3
  verified_at: 2026-10-25T23:16:28Z
  output: |
    ok   P3 inode mới: khởi tạo — không kill
    P3 inode mới: exit 0 · stub: không
    ok   P3 inode mới: should-NOT-fire — KHÔNG kill gateway vì 2 turn cũ của lịch sử
    ok   P3 inode mới: có dòng WARN
    ok   P3 inode mới: marker ghi lại đúng dạng đường_dẫn:inode:số_dòng
    ok   P3 inode mới: sau đó 1 turn MỚI vào gateway.log → lượt kế bị bắt, KILL
    P3 PASS

- eval: E4
  run_id: watchdog-l4b-history-E4-r1-20261025T231628Z
  exit_code: 0
  baseline: red
  verifier: config:executors.script.wdh_p4
  verified_at: 2026-10-25T23:16:30Z
  output: |
    ok   P4 số dòng lớn hơn: khởi tạo — không kill
    P4 số dòng lớn hơn: exit 0 · stub: không
    ok   P4 số dòng lớn hơn: should-NOT-fire — KHÔNG kill gateway vì 2 turn cũ của lịch sử
    ok   P4 số dòng lớn hơn: có dòng WARN
    ok   P4 số dòng lớn hơn: marker ghi lại đúng dạng đường_dẫn:inode:số_dòng
    ok   P4 số dòng lớn hơn: sau đó 1 turn MỚI vào gateway.log → lượt kế bị bắt, KILL
    P4 PASS

- eval: E5
  run_id: watchdog-l4b-history-E5-r1-20261025T231630Z
  exit_code: 0
  baseline: green
  verifier: config:executors.script.wdh_xoay_that
  verified_at: 2026-10-25T23:16:32Z
  output: |
    an toàn: launchctl/pkill/pgrep/osascript/curl/sleep → stub trong thư mục tạm
    ghi nhận: turn ở đầu gateway.log vừa xoay KHÔNG bị bắt (cửa sổ bỏ sót đã khai)
    ok   turn MỚI ghi sau lượt quét đầu sau xoay → bị bắt
    XOAY-THAT PASS

- eval: E6
  run_id: watchdog-l4b-history-E6-r1-20261025T231636Z
  exit_code: 0
  baseline: green
  verifier: config:executors.script.zc3b_scan
  verified_at: 2026-10-25T23:16:36Z
  output: |
    ok   (a) turn ở dòng cuối file hôm qua được bắt ở lượt đầu ngày mới
    ok   (b) turn ở dòng 1 của file hôm nay được bắt, quét đủ 5 dòng
    ok   (d) should-NOT-fire: không quét đuôi file lạ cùng tên, chỉ quét 2 dòng file mới
    ok   (e) truncate cùng inode 6 → 2 dòng: quét toàn bộ từ dòng 1
    ok   marker số cũ «4211» + cwd có tệp tên 4211: quét toàn bộ file hôm nay, không đọc nhầm tệp kia, không lỗi
    ok   gateway.log xoay cùng đường dẫn: quét toàn bộ file mới, không lỗi
    SCAN PASS

- eval: E7
  run_id: watchdog-l4b-history-E7-r1-20261025T231636Z
  exit_code: 0
  baseline: green
  verifier: config:executors.script.zc3b_rotate
  verified_at: 2026-10-25T23:16:38Z
  output: |
    an toàn: launchctl/pkill/pgrep/osascript/curl/sleep → stub trong thư mục tạm
    ok   lượt quét cuối ngày: không có gì → exit 0, không kill
    lượt đầu ngày mới: [thoát khác 0 — đúng kỳ vọng] · stub gọi: launchctl bootout gui/503/ai.openclaw.gateway | pkill -9 -f openclaw
    ok   lượt đầu ngày mới: [thoát khác 0 — đúng kỳ vọng]
    ok   alert KILL ghi đúng lý do (turn từ kênh xã hội)
    ok   alert gọi launchctl bootout + pkill (STUB — không chạm OpenClaw thật)
    ROTATE PASS

- eval: E8
  run_id: watchdog-l4b-history-E8-r1-20261025T231638Z
  exit_code: 0
  baseline: green
  verifier: config:executors.script.zc3b_marker_hong
  verified_at: 2026-10-25T23:16:40Z
  output: |
    ok   (a) should-NOT-fire: gw-marker hỏng KHÔNG làm watchdog kill gateway vì turn của quá khứ
    ok   (a) có dòng WARN về marker hỏng trong alert log
    ok   (c) turn MỚI ghi vào gateway.log sau khi khởi tạo lại → bị bắt, alert KILL
    ok   (b) marker /tmp hỏng + turn ở dòng 1 → vẫn bị bắt, alert KILL
    ok   (b2) inode đúng + số dòng hỏng: không chết dưới set -u, turn dòng 1 file mới bị bắt
    ok   (b2) marker chuyển sang file mới đúng dạng
    MARKER-HONG PASS

- eval: E9
  run_id: watchdog-l4b-history-E9-r1-20261025T231640Z
  exit_code: 0
  baseline: green
  verifier: config:executors.script.zc3_syntax
  verified_at: 2026-10-25T23:16:40Z
  output: |
    SYNTAX OK

### Thăm dò ngoài eval (sandbox, không ghi run-log vì không phải eval)

- WARN của bản sửa: P1–P4 mỗi ca có đúng một dòng `WARN: L4b (history) 'gateway.log' đổi file/truncate/xoay — khởi tạo lại ở
  dòng 7, không quét quá khứ (cửa sổ bỏ sót ≤1 chu kỳ 5′)`. Bù cho kiểm «có dòng WARN» của harness, vốn đạt cả nhờ WARN
  Postgres của sandbox.
- WARN không spam: sau P3, qua 4 chu kỳ append, tổng số dòng WARN L4b lần lượt 1, 1, 1, 1.
- Marker rỗng, nhiều dòng, CRLF, khoảng trắng, `08`, số quá lớn: không tắt nhầm, marker về đúng dạng, turn mới sau đó bị bắt.
- Xoay thật, tệp mới 11 dòng (dài hơn marker) có turn trước lượt quét đầu: không bị bắt. Turn ghi sau lượt đó: bị bắt.
- Đường dẫn chứa «:» (hàm trích, tệp giả): mù với turn mới, WARN mỗi chu kỳ. Xem «Ngoài hợp đồng».

## Known limits

- Cửa sổ bỏ sót sau xoay thật đúng như Out of scope đã khai. Turn ghi vào gateway.log mới trước lượt quét đầu sau xoay không
  bị bắt, bất kể tệp mới dài bao nhiêu. Độ dài cửa sổ ≤ 300 s (`StartInterval` 300 của plist bộ canh). Trên main, turn đó bị
  bắt (baseline E5). Lớp bù là quét log /tmp theo ngày ở chế độ `daily`. Hợp đồng gọi lớp này là «L4a», còn mã gọi là «L4b
  trên log /tmp»: lệch tên, không lệch hành vi.
- Copytruncate cùng inode rồi ghi nhiều dòng hơn marker cũ trước lượt quét kế thì bỏ sót các dòng đầu. Lỗ này có sẵn trên
  main, cùng loại với cửa sổ xoay.
- Marker số quá lớn bị khởi tạo lại im lặng, không có WARN, kèm lỗi so sánh ra stderr. An toàn: không tắt nhầm, turn sau đó
  bị bắt.

## Ngoài hợp đồng

- Kiểm «có dòng WARN» của harness (E1–E4) tự đạt nhờ cảnh báo Postgres của sandbox (cổng DB giả luôn đóng), nên không chứng
  minh được WARN của bản sửa. Đã đo bù: WARN L4b có thật ở cả 4 ca. Mức: low. Đề xuất: known-limits.
- Đường dẫn log gateway chứa «:» làm chế độ history mù hẳn với gateway.log và ghi WARN mỗi chu kỳ. Main ở cùng tình huống thì
  tắt gateway mỗi chu kỳ. HOME thật không chứa «:», nên hiện không xảy ra. Mức: low. Đề xuất: known-limits.

Chi tiết theo khuôn OOC trong `review-findings.md`.

## Analyst

Không có eval ui-check, nên không áp «Network truth».

Cách đo baseline:
- Chép `git show origin/main:scripts/zalo-watchdog.sh` (origin/main `169b8c6`) cùng harness của nhánh vào
  `<scratchpad>/base/scripts/`, đúng cấu trúc. Thêm `zalo-import-daily.sh` và hai tệp `pipeline/*chotot.mjs` của main cho E9.
- Harness `watchdog-l4b-cuoi-ngay` trùng main. Không tạo worktree.

Kết quả baseline:
- P1–P4 đỏ, mỗi ca 2 mục: should-NOT-fire (stub ghi `launchctl bootout` + `pkill`, tức là tắt nhầm vì 2 turn cũ) và «có dòng
  WARN».
- xoay-that, scan, rotate, marker-hong và cú pháp: xanh.

Eval phân biệt code mới với code cũ: E1, E2, E3, E4 (red trên main, mục tắt nhầm là mục quyết định).

Eval không phân biệt (xanh trên cả hai cây):
- E5: trên main, turn ghi sau lượt quét đầu sau xoay cũng bị bắt. AC-5 là tiêu chí «không làm mù» nên đây là rào hồi quy có
  chủ đích. Dòng «ghi nhận» thì đổi chiều («BỊ BẮT» trên main, «KHÔNG bị bắt» trên nhánh), đúng cửa sổ đã khai.
- E6, E7, E8: rào hồi quy ZC3+ có chủ đích.
- E9: rào cú pháp.

Ghi chú về mục «có dòng WARN»: trên main mục này đỏ chỉ vì lượt bị KILL thoát trước bước kiểm Postgres. Vì vậy nó không phân
biệt được bản sửa (xem «Ngoài hợp đồng»). Thăm dò riêng xác nhận WARN L4b có thật.

## Variance

Không có: mọi eval tất định, mỗi eval chạy 1 lần.

## Iterations

Round 1: E1–E9 đều đạt. Baseline P1–P4 đỏ, xoay-that xanh, khớp ghi chú harness. Phản biện ghi hai mục ngoài hợp đồng mức low:
WARN trong harness tự đạt nhờ cảnh báo Postgres, và đường dẫn có «:» làm chế độ history mù. Không sửa code. Hồ sơ chờ Mạnh
ký Gate 2 (T3).
