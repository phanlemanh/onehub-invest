---
schema_version: 2
feature_slug: watchdog-l4b-cuoi-ngay
verdict: PASS
failed_evals: []
reason:
verified_by: fresh-context verification subagent (vai feature-loop:cham-lenh)
enforcement_mode: strict
bypass_used: false
verified_commit: bc506189c1c0f617ca21b89c90413c714f09647b
human_signoff: Mạnh 2026-10-24
---

# Evidence Report: watchdog-l4b-cuoi-ngay

Vòng verify 2. Mọi eval chạy tại worktree `quirky-archimedes-75aa8c`, nhánh `claude/acceptance-watchdog-l4b-cuoi-ngay`.
HEAD = `bc50618…`, kiểm bằng `git rev-parse HEAD` trước khi chạy. `scripts/zalo-watchdog.sh` ở HEAD là bản của ZCode @ 0446251,
gồm chế độ `history`/`daily` của `scan_new_lines`. So với origin/main, nhánh đổi đúng 2 tệp trong `scripts/`: watchdog và
harness `scripts/watchdog-l4b-cuoi-ngay/acceptance.mjs`.

An toàn (luật 8), tự xác nhận bằng cách đọc code trước khi chạy:
- Mode `rotate`/`marker-hong` (`makeSandbox`) và `gateway` của ZC3 (`assertStubsWin`):
  - chạy BẢN CHÉP watchdog trong `mkdtemp`, HOME giả;
  - PATH = thư mục stub đứng đầu, rồi `/usr/bin:/bin:/usr/sbin:/sbin`;
  - kiểm `command -v` cả 6 lệnh `launchctl/pkill/pgrep/osascript/curl/sleep` phải về stub, sai thì bỏ chạy;
  - kiểm bản chép chỉ đổi đúng 2 dòng: đường log /tmp và cổng :5433.
- Mode `scan`/`l4b-scan`: chỉ trích hàm `scan_new_lines` (stat/wc/cat/tail) chạy trên tệp giả.
- Không chạy watchdog trực tiếp, không gọi `launchctl`/`pkill`. Không đọc `~/.openclaw`, `/tmp/openclaw`,
  `~/Library/Logs/openclaw` hay `pipeline/logs` thật.
- PID gateway OpenClaw (chỉ đọc bằng `pgrep -f "openclaw.*gateway"`) giữ nguyên 67240 trước khi chạy, sau E2, E8, E10, E11, E12,
  và sau baseline.

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | script | PASS |
| E2 | AC-1 | script | PASS |
| E3 | AC-2 | script | PASS |
| E4 | AC-3 | script | PASS |
| E5 | AC-4 | script | PASS |
| E6 | AC-5 | script | PASS |
| E7 | AC-5 | script | PASS |
| E8 | AC-5 | script | PASS |
| E9 | AC-5 | script | PASS |
| E10 | AC-6 | script | PASS |
| E11 | AC-7 | script | PASS |
| E12 | AC-7 | script | PASS |

## Evidence

Ghi chú làm sạch: vài dòng harness in mã thoát của bản chép watchdog, vì lượt alert được kỳ vọng thoát khác không. Những chỗ đó
được thay bằng `[thoát khác 0 — đúng kỳ vọng]`. Mã thoát thật của từng lệnh eval nằm trong `run-log.jsonl` (round 2).

- eval: E1
  run_id: watchdog-l4b-cuoi-ngay-E1-r2-20261024T094350Z
  exit_code: 0
  baseline: red
  verifier: config:executors.script.zc3b_scan
  verified_at: 2026-10-24T09:43:50Z
  output: |
    ok   (a) turn ở dòng cuối file hôm qua được bắt ở lượt đầu ngày mới
    ok   (a) in đúng 1 dòng đuôi cũ + 2 dòng ngày mới (được 3)
    ok   (a) marker chuyển sang file ngày mới
    ok   (c) chạy lại không có gì mới → rỗng
    ok   (b) turn ở dòng 1 của file hôm nay được bắt, quét đủ 5 dòng
    ok   (d) should-NOT-fire: không quét đuôi file lạ cùng tên, chỉ quét 2 dòng file mới
    ok   (e) truncate cùng inode 6 → 2 dòng: quét toàn bộ từ dòng 1
    SCAN PASS

- eval: E2
  run_id: watchdog-l4b-cuoi-ngay-E2-r2-20261024T094354Z
  exit_code: 0
  baseline: red
  verifier: config:executors.script.zc3b_rotate
  verified_at: 2026-10-24T09:43:56Z
  output: |
    an toàn: launchctl/pkill/pgrep/osascript/curl/sleep → stub trong thư mục tạm
    ok   lượt quét cuối ngày: không có gì → exit 0, không kill
    lượt đầu ngày mới: [thoát khác 0 — đúng kỳ vọng] · stub gọi: launchctl bootout gui/503/ai.openclaw.gateway | pkill -9 -f openclaw
    ok   lượt đầu ngày mới: [thoát khác 0 — đúng kỳ vọng]
    ok   alert KILL ghi đúng lý do (turn từ kênh xã hội)
    ok   alert gọi launchctl bootout + pkill (STUB — không chạm OpenClaw thật)
    ROTATE PASS

- eval: E3
  run_id: watchdog-l4b-cuoi-ngay-E3-r2-20261024T094407Z
  exit_code: 0
  baseline: green
  verifier: config:executors.script.zc3b_scan
  verified_at: 2026-10-24T09:44:08Z
  output: |
    ok   (a) turn ở dòng cuối file hôm qua được bắt ở lượt đầu ngày mới
    ok   (b) turn ở dòng 1 của file hôm nay được bắt, quét đủ 5 dòng
    ok   (d) file cũ đã xoá → không lỗi, chỉ quét 3 dòng file mới
    SCAN PASS

- eval: E4
  run_id: watchdog-l4b-cuoi-ngay-E4-r2-20261024T094408Z
  exit_code: 0
  baseline: green
  verifier: config:executors.script.zc3b_scan
  verified_at: 2026-10-24T09:44:08Z
  output: |
    ok   (a) marker chuyển sang file ngày mới
    ok   (c) chạy lại không có gì mới → rỗng
    ok   (c) nối 1 dòng → chỉ in 1 dòng, turn của file cũ không bị báo lại
    SCAN PASS

- eval: E5
  run_id: watchdog-l4b-cuoi-ngay-E5-r2-20261024T094408Z
  exit_code: 0
  baseline: green
  verifier: config:executors.script.zc3b_scan
  verified_at: 2026-10-24T09:44:09Z
  output: |
    ok   (d) file cũ đã xoá → không lỗi, chỉ quét 3 dòng file mới
    ok   (d) đường dẫn cũ được tái dùng với inode khác (328392001 → 328392003)
    ok   (d) should-NOT-fire: không quét đuôi file lạ cùng tên, chỉ quét 2 dòng file mới
    SCAN PASS

- eval: E6
  run_id: watchdog-l4b-cuoi-ngay-E6-r2-20261024T094409Z
  exit_code: 0
  baseline: green
  verifier: config:executors.script.zc3b_scan
  verified_at: 2026-10-24T09:44:09Z
  output: |
    ok   (e) truncate cùng inode 6 → 2 dòng: quét toàn bộ từ dòng 1
    ok   marker số cũ «4211» + cwd có tệp tên 4211: quét toàn bộ file hôm nay, không đọc nhầm tệp kia, không lỗi
    ok   gateway.log xoay cùng đường dẫn: quét toàn bộ file mới, không lỗi
    SCAN PASS

- eval: E7
  run_id: watchdog-l4b-cuoi-ngay-E7-r2-20261024T094419Z
  exit_code: 0
  baseline: green
  verifier: config:executors.script.zc3_l4b_scan
  verified_at: 2026-10-24T09:44:19Z
  output: |
    ok   A ngày mới 5 dòng > ngày cũ 2 dòng: agent-turn ở dòng 1 ĐƯỢC quét
    ok   A' cùng đường dẫn, tệp mới dài hơn: dòng 1 ĐƯỢC quét
    ok   B truncate 6 → 2 dòng: quét toàn bộ 2 dòng
    ok   C tệp không đổi: đầu ra rỗng
    ok   D nối 2 dòng: chỉ in 2 dòng mới, turn cũ không lặp (in 2 dòng)
    ok   E marker số cũ: quét toàn bộ 3 dòng
    ok   F marker rỗng: không in lịch sử (kể cả turn cũ)
    ok   G tệp chưa có: im lặng, không tạo marker
    L4B-SCAN PASS

- eval: E8
  run_id: watchdog-l4b-cuoi-ngay-E8-r2-20261024T094419Z
  exit_code: 0
  baseline: green
  verifier: config:executors.script.zc3_gateway
  verified_at: 2026-10-24T09:44:21Z
  output: |
    an toàn: launchctl/pkill/pgrep/osascript/curl/sleep → stub trong thư mục tạm
    ok   lượt 1: không alert/kill dù lịch sử có agent-turn (chỉ khởi tạo)
    ok   lượt 1: turn-marker '4211' được viết lại, không lỗi
    ok   lượt 2 (không dòng mới): exit 0, không kill
    lượt 3 (turn mới trong gateway.log): [thoát khác 0 — đúng kỳ vọng] · stub gọi: launchctl bootout gui/503/ai.openclaw.gateway | pkill -9 -f openclaw
    ok   lượt 3: alert KILL ghi đúng lý do gateway.log
    ok   lượt 3: alert gọi launchctl bootout + pkill (STUB — không chạm OpenClaw thật)
    GATEWAY PASS

- eval: E9
  run_id: watchdog-l4b-cuoi-ngay-E9-r2-20261024T094421Z
  exit_code: 0
  baseline: green
  verifier: config:executors.script.zc3_syntax
  verified_at: 2026-10-24T09:44:21Z
  output: |
    SYNTAX OK

- eval: E10
  run_id: watchdog-l4b-cuoi-ngay-E10-r2-20261024T094427Z
  exit_code: 0
  baseline: red
  verifier: config:executors.script.zc3b_marker_hong
  verified_at: 2026-10-24T09:44:29Z
  output: |
    an toàn: launchctl/pkill/pgrep/osascript/curl/sleep → stub trong thư mục tạm
    ok   (b) marker /tmp hỏng + turn ở dòng 1 → vẫn bị bắt, alert KILL
    ok   (b) có dòng WARN về marker hỏng
    ok   (b) marker /tmp ghi lại đúng dạng đường_dẫn:inode:số_dòng
    ok   (b2) inode đúng + số dòng hỏng: không chết dưới set -u, turn dòng 1 file mới bị bắt
    ok   (b2) có dòng WARN về marker hỏng
    ok   (b2) marker chuyển sang file mới đúng dạng
    MARKER-HONG PASS

- eval: E11
  run_id: watchdog-l4b-cuoi-ngay-E11-r2-20261024T094433Z
  exit_code: 0
  baseline: red
  verifier: config:executors.script.zc3b_marker_hong
  verified_at: 2026-10-24T09:44:35Z
  output: |
    an toàn: launchctl/pkill/pgrep/osascript/curl/sleep → stub trong thư mục tạm
    ok   khởi tạo: gateway.log có turn cũ → không kill (đúng hành vi trước khi sửa)
    (a) exit 0 · stub: không
    ok   (a) should-NOT-fire: gw-marker hỏng KHÔNG làm watchdog kill gateway vì turn của quá khứ
    ok   (a) có dòng WARN về marker hỏng trong alert log
    ok   (a) gw-marker ghi lại đúng dạng đường_dẫn:inode:số_dòng (được "ry/Logs/openclaw/gateway.log:328392555:7")
    MARKER-HONG PASS

- eval: E12
  run_id: watchdog-l4b-cuoi-ngay-E12-r2-20261024T094440Z
  exit_code: 0
  baseline: green
  verifier: config:executors.script.zc3b_marker_hong
  verified_at: 2026-10-24T09:44:41Z
  output: |
    an toàn: launchctl/pkill/pgrep/osascript/curl/sleep → stub trong thư mục tạm
    (a) exit 0 · stub: không
    ok   (a) gw-marker ghi lại đúng dạng đường_dẫn:inode:số_dòng (được "ry/Logs/openclaw/gateway.log:328392678:7")
    ok   (c) turn MỚI ghi vào gateway.log sau khi khởi tạo lại → bị bắt, alert KILL
    MARKER-HONG PASS

## Known limits

- Mọi bằng chứng là sandbox: hàm trích nguyên văn, hoặc bản chép watchdog đổi 2 dòng với stub. Chưa có lần chạy thật nào
  sau triển khai; việc đó do ZCode làm qua kênh tin, theo Out of scope.
- Chế độ được truyền đúng cho từng chỗ gọi (đọc code):
  - gateway.log (dòng 138) truyền `history`;
  - log /tmp (dòng 154) không truyền đối số thứ ba nên về mặc định `daily`;
  - `mode` chỉ được đọc trong nhánh marker hỏng (dòng 103), mọi nhánh khác chạy giống nhau cho cả hai chế độ.

  Harness `scan` và `l4b-scan` gọi hàm với 2 đối số, nên chỉ đo chế độ `daily`. Chế độ `history` chỉ được đo qua bản chép
  watchdog ở `marker-hong` (a)/(c).
- Phép thử thêm của người chấm, chỉ trên hàm `scan_new_lines` trích ra (hàm không gọi launchctl/pkill/alert), tệp giả trong
  scratchpad, đã xoá sau khi chạy:
  - **P5 — gateway.log (history) với marker hỏng:** dòng ghi giữa lượt quét hợp lệ cuối và lượt phát hiện hỏng không bao giờ
    được quét. Một turn MỚI rơi vào cửa sổ ≤5′ đó: 0 dòng in ra, marker nhảy tới dòng hiện tại. Đây là đánh đổi mà AC-7 chọn
    («khởi tạo lại ở số dòng hiện tại»); tín hiệu duy nhất là dòng WARN.
  - **P6 — log /tmp (daily) với marker hỏng:** nhánh hỏng quét lại file hôm nay từ dòng 1 nhưng bỏ qua quét nốt đuôi file hôm qua.
    Turn ở đuôi file hôm qua (ghi sau lượt quét cuối ngày): 0 dòng in ra, mất. Cũng vì quét lại từ dòng 1, một turn đã gây KILL
    trước đó trong cùng ngày sẽ KILL lại sau khi người khởi động lại OpenClaw. Đây là hướng fail-closed.
  - **P7 — marker có CR cuối dòng (CRLF):** bị coi là hỏng. Ở `history` thì khởi tạo lại, không quét quá khứ: an toàn.
- Câu hỏi «marker hỏng ở log history có lúc nào vẫn quét quá khứ không». Với marker hỏng ĐÚNG NGHĨA AC-7 (trường inode hoặc số
  dòng không phải số): không, vì nhánh `history` không in gì. Nếu trường số vẫn là số nhưng sai, marker đi qua kiểm định dạng
  và rơi vào nhánh đổi file hoặc truncate, khi đó vẫn quét quá khứ; xem «Ngoài hợp đồng».
- Các giới hạn vòng 1 vẫn còn nguyên (code ngoài nhánh marker hỏng không đổi):
  - file cũ bị xoá trước lượt đầu ngày mới thì mất turn ở đuôi;
  - ngày mới mà /tmp chưa có file thì đuôi hôm qua được quét trễ, tới khi có file ngày mới;
  - chưa kiểm cách OpenClaw đặt tên file /tmp theo ngày;
  - gateway.log xoay kiểu đổi tên (Out of scope);
  - file cũ bị truncate trước khi xoay ngày;
  - `stat -f '%i'` chỉ chạy trên BSD/macOS;
  - `oldInode` không khai `local`.
- E3–E6 dùng chung lệnh `scan` với E1; E10–E12 dùng chung lệnh `marker-hong`. Mỗi eval là một lần chạy riêng, có run_id riêng,
  nhưng cùng một bộ kiểm.

## Ngoài hợp đồng

- **Nhánh «đổi file» và nhánh truncate của gateway.log quét TOÀN BỘ file bất kể chế độ `history`** (dòng 116–129). Khi marker
  có trường số hợp lệ nhưng đường dẫn hoặc inode không khớp, hoặc số dòng lớn hơn thật, mà file hiện tại vẫn mang lịch sử, hàm
  in lại cả turn của sự cố 20/10. Watchdog khi đó KILL gateway vì quá khứ, đúng loại lỗi AC-7 muốn tránh. AC-7 chỉ phủ trường
  không phải số.
  - Phép thử: hàm trích ra, chế độ `history`, gateway.log giả có 2 turn cũ. Cả 4 ca dưới đây đều in ra 2 dòng turn cũ.

    | Ca | Marker / tình huống | Đường vào |
    |---|---|---|
    | P1 | marker số cũ `5` (định dạng gw-marker từ b291d95, trước 9882dc2) | `prevPath`=`5` ≠ đường dẫn thật |
    | P2 | marker đúng dạng nhưng đường dẫn khác (đổi HOME/đường log, chép sang máy khác) | nhánh đổi file |
    | P3 | cùng đường dẫn, inode mới, nội dung giữ nguyên (ghi tạm rồi đổi tên, khôi phục bản sao, `sed -i`) | nhánh đổi file |
    | P4 | cùng inode, số dòng trong marker lớn hơn thật | nhánh truncate |

  - Nguồn gốc: không do nhánh này gây ra. origin/main đã có nhánh đổi file quét toàn bộ từ 9882dc2. Nhánh này chỉ thêm chế độ
    `history` cho marker hỏng trường số.
  - Khả năng xảy ra:
    - P1 xảy ra tối đa một lần, nếu gw-marker thật còn dạng số cũ. Người chấm KHÔNG kiểm marker thật (không đọc `pipeline/logs`
      thật, luật 8). Nếu watchdog định dạng mới đã chạy trên main thì marker đã được ghi lại. Khi đó, nếu gateway.log thật có turn
      cũ, có thể đã có một lần KILL vì quá khứ trong alert log thật. Nên để ZCode hoặc Mạnh tra.
    - P3 phụ thuộc cách OpenClaw hoặc công cụ ngoài ghi lại gateway.log. Chưa đo.
  - Gợi ý cho ZCode: ở chế độ `history`, đổi file hoặc truncate mà file mới có nội dung cũ thì xử lý như marker hỏng. Tức là khởi
    tạo lại ở `curLines` và WARN, hoặc chỉ quét khi file mới ngắn hơn marker. Hướng: Mạnh quyết ở Gate 2; `tin MỞ LẠI` nếu muốn
    đóng lỗ này.
- **Lệch nhỏ so với Notes của hợp đồng.** Notes viết rằng lỗi «KILL vì quá khứ khi gw-marker hỏng» do 163c2c3 gây ra. Baseline
  `marker-hong` trên origin/main (chưa có 163c2c3) cũng đỏ ở mục (a): gw-marker `…:abc:def` có inode `abc` ≠ inode thật, nên rơi
  vào nhánh đổi file và quét toàn bộ. Như vậy lỗi đã có trên main, 163c2c3 không đưa nó vào. Kết luận của hợp đồng không đổi,
  AC-7 vẫn đúng việc cần làm.

## Analyst

Không có eval ui-check, nên không áp «Network truth» (`network_observed` không dùng).

Baseline vòng 2 đo trên origin/main (`7f4b70d`). Watchdog ở đó trùng `e109402~1`, `git diff` rỗng.
- Cách dựng: `git archive origin/main` vào thư mục tạm NGOÀI repo, chép harness mới vào, không tạo worktree. Chạy xong đã gỡ.
- Kết quả:
  - `scan` đỏ ở mục (a) (in 2 dòng, không bắt turn);
  - `rotate` đỏ: lượt đầu ngày mới không KILL, không gọi stub;
  - `l4b-scan`, `gateway`, cú pháp: xanh;
  - `marker-hong` đỏ 4 mục: (a) should-NOT-fire (kill vì quá khứ), WARN (a), WARN (b), WARN (b2).

Eval phân biệt code mới với code cũ:
- E1 và E2.
- E10: trên main nhánh /tmp đã KILL đúng ở (b)/(b2). E10 đỏ trên main nhờ các mục WARN; theo Notes hợp đồng, nó còn đỏ ở (b2)
  «chết dưới set -u» trên e109402.
- E11: đỏ trên main.

Eval không phân biệt (xanh trên cả hai cây, xét đúng mục con eval trích):
- E3, E4, E5, E6: lệnh `scan` chung chỉ đỏ ở mục (a); các mục con (b), (c), (d), (e)/4211/gateway đều xanh trên main. Đúng bản
  chất AC-2..AC-5, vốn là tiêu chí «giữ hành vi», nên đây là rào hồi quy. Vòng 1 đã bù cho E5 bằng phép đột biến bỏ kiểm inode.
- E7, E8, E9: rào hồi quy ZC3 có chủ đích.
- E12 (mục (c)): rào hồi quy có chủ đích, đảm bảo bản sửa AC-7 không làm mù gateway.log với turn MỚI.

## Variance

Không có: mọi eval tất định, mỗi eval chạy 1 lần.

## Iterations

Round 1: E1–E9 đều đạt.
- Phản biện tìm ra một hồi quy NGOÀI hợp đồng (marker hỏng trường số dòng làm `scan_new_lines` chết, mù L4b /tmp kéo dài).
- Ghi ở «Ngoài hợp đồng» để Mạnh quyết ở Gate 2; không sửa code.

Round 2: ZCode sửa ở 163c2c3 và 0446251 (marker hỏng: /tmp quét lại, gateway.log khởi tạo lại theo chế độ `history`), thêm
AC-6/AC-7 và E10–E12. E1–E12 đều đạt.
- Phản biện ghi một lỗ có sẵn trên main ở «Ngoài hợp đồng»: nhánh đổi file/truncate của gateway.log vẫn quét quá khứ khi marker
  số hợp lệ nhưng sai đường dẫn, inode hoặc số dòng.
