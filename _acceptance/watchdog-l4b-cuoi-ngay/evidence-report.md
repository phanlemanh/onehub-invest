---
schema_version: 2
feature_slug: watchdog-l4b-cuoi-ngay
verdict: PASS
failed_evals: []
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: 97bb18cc36e32e6d8e856cce0374ddbfbfa05916
human_signoff:
---

# Evidence Report: watchdog-l4b-cuoi-ngay

Vòng verify 1. Mọi eval chạy tại worktree `acceptance-collector-graceful-shutdown-942e1d`, nhánh
`claude/acceptance-watchdog-l4b-cuoi-ngay`, HEAD = `97bb18c…` (đã kiểm trước khi chạy). `scripts/zalo-watchdog.sh`
ở HEAD trùng bản e109402 (diff e109402..HEAD chỉ thêm harness).

An toàn (luật 8), tự xác nhận bằng cách đọc code trước khi chạy:
- harness `scripts/watchdog-l4b-cuoi-ngay/acceptance.mjs` và `scripts/audit-p1-resilience/acceptance.mjs`, mode `rotate`/`gateway`:
  - chạy BẢN CHÉP trong `mkdtemp`, HOME giả;
  - PATH = thư mục stub đứng đầu, rồi `/usr/bin:/bin:/usr/sbin:/sbin`;
  - kiểm `command -v` cả 6 lệnh `launchctl/pkill/pgrep/osascript/curl/sleep` phải về stub, sai thì bỏ chạy;
  - kiểm bản chép đổi đúng 2 dòng (đường log /tmp, cổng :5433);
  - ROOT của bản chép là thư mục tạm, nên `pipeline/logs` là giả.
- mode `scan`/`l4b-scan` chỉ trích hàm `scan_new_lines` (stat/wc/cat/tail) chạy trên tệp giả.
- không chạy watchdog trực tiếp, không `launchctl`/`pkill`/`kill`, không đọc `~/.openclaw`, `/tmp/openclaw`, `~/Library/Logs/openclaw`, `pipeline/logs` thật hay `~/dev/onehub-invest`.
- PID gateway OpenClaw (chỉ đọc `pgrep -fl "openclaw.*gateway"`): 67240 trước khi chạy, 67240 sau E2, 67240 sau E8, 67240 sau baseline và phép thử.

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

## Evidence

Ghi chú làm sạch: dòng harness có in mã thoát của bản chép watchdog (lượt alert kỳ vọng thoát khác không).
Những chỗ đó được thay bằng `[thoát khác 0 — đúng kỳ vọng]`. Mã thoát thật của từng lệnh eval nằm trong `run-log.jsonl`.

- eval: E1
  run_id: watchdog-l4b-cuoi-ngay-E1-20261023T160935
  exit_code: 0
  baseline: red
  verifier: config:executors.script.zc3b_scan
  verified_at: 2026-10-23T16:09:35Z
  output: |
    ok   (a) turn ở dòng cuối file hôm qua được bắt ở lượt đầu ngày mới
    ok   (a) in đúng 1 dòng đuôi cũ + 2 dòng ngày mới (được 3)
    ok   (a) marker chuyển sang file ngày mới
    ok   (c) chạy lại không có gì mới → rỗng
    ok   (d) should-NOT-fire: không quét đuôi file lạ cùng tên, chỉ quét 2 dòng file mới
    ok   (e) truncate cùng inode 6 → 2 dòng: quét toàn bộ từ dòng 1
    SCAN PASS

- eval: E2
  run_id: watchdog-l4b-cuoi-ngay-E2-20261023T160941
  exit_code: 0
  baseline: red
  verifier: config:executors.script.zc3b_rotate
  verified_at: 2026-10-23T16:09:43Z
  output: |
    an toàn: launchctl/pkill/pgrep/osascript/curl/sleep → stub trong thư mục tạm
    ok   lượt quét cuối ngày: không có gì → exit 0, không kill
    lượt đầu ngày mới: [thoát khác 0 — đúng kỳ vọng] · stub gọi: launchctl bootout gui/503/ai.openclaw.gateway | pkill -9 -f openclaw
    ok   lượt đầu ngày mới: [thoát khác 0 — đúng kỳ vọng]
    ok   alert KILL ghi đúng lý do (turn từ kênh xã hội)
    ok   alert gọi launchctl bootout + pkill (STUB — không chạm OpenClaw thật)
    ROTATE PASS

- eval: E3
  run_id: watchdog-l4b-cuoi-ngay-E3-20261023T160948
  exit_code: 0
  baseline: green
  verifier: config:executors.script.zc3b_scan
  verified_at: 2026-10-23T16:09:48Z
  output: |
    ok   (a) turn ở dòng cuối file hôm qua được bắt ở lượt đầu ngày mới
    ok   (b) turn ở dòng 1 của file hôm nay được bắt, quét đủ 5 dòng
    ok   (d) file cũ đã xoá → không lỗi, chỉ quét 3 dòng file mới
    SCAN PASS

- eval: E4
  run_id: watchdog-l4b-cuoi-ngay-E4-20261023T160953
  exit_code: 0
  baseline: green
  verifier: config:executors.script.zc3b_scan
  verified_at: 2026-10-23T16:09:53Z
  output: |
    ok   (a) marker chuyển sang file ngày mới
    ok   (c) chạy lại không có gì mới → rỗng
    ok   (c) nối 1 dòng → chỉ in 1 dòng, turn của file cũ không bị báo lại
    SCAN PASS

- eval: E5
  run_id: watchdog-l4b-cuoi-ngay-E5-20261023T160958
  exit_code: 0
  baseline: green
  verifier: config:executors.script.zc3b_scan
  verified_at: 2026-10-23T16:09:58Z
  output: |
    ok   (d) file cũ đã xoá → không lỗi, chỉ quét 3 dòng file mới
    ok   (d) đường dẫn cũ được tái dùng với inode khác (327720837 → 327720839)
    ok   (d) should-NOT-fire: không quét đuôi file lạ cùng tên, chỉ quét 2 dòng file mới
    SCAN PASS

- eval: E6
  run_id: watchdog-l4b-cuoi-ngay-E6-20261023T161003
  exit_code: 0
  baseline: green
  verifier: config:executors.script.zc3b_scan
  verified_at: 2026-10-23T16:10:03Z
  output: |
    ok   (e) truncate cùng inode 6 → 2 dòng: quét toàn bộ từ dòng 1
    ok   marker số cũ «4211» + cwd có tệp tên 4211: quét toàn bộ file hôm nay, không đọc nhầm tệp kia, không lỗi
    ok   gateway.log xoay cùng đường dẫn: quét toàn bộ file mới, không lỗi
    SCAN PASS

- eval: E7
  run_id: watchdog-l4b-cuoi-ngay-E7-20261023T161009
  exit_code: 0
  baseline: green
  verifier: config:executors.script.zc3_l4b_scan
  verified_at: 2026-10-23T16:10:09Z
  output: |
    ok   A ngày mới 5 dòng > ngày cũ 2 dòng: agent-turn ở dòng 1 ĐƯỢC quét
    ok   A' cùng đường dẫn, tệp mới dài hơn: dòng 1 ĐƯỢC quét
    ok   B truncate 6 → 2 dòng: quét toàn bộ 2 dòng
    ok   D nối 2 dòng: chỉ in 2 dòng mới, turn cũ không lặp (in 2 dòng)
    ok   E marker số cũ: quét toàn bộ 3 dòng
    ok   F marker rỗng: không in lịch sử (kể cả turn cũ)
    ok   G tệp chưa có: im lặng, không tạo marker
    L4B-SCAN PASS

- eval: E8
  run_id: watchdog-l4b-cuoi-ngay-E8-20261023T161012
  exit_code: 0
  baseline: green
  verifier: config:executors.script.zc3_gateway
  verified_at: 2026-10-23T16:10:14Z
  output: |
    an toàn: launchctl/pkill/pgrep/osascript/curl/sleep → stub trong thư mục tạm
    ok   lượt 1: không alert/kill dù lịch sử có agent-turn (chỉ khởi tạo)
    ok   lượt 1: turn-marker '4211' được viết lại, không lỗi
    ok   lượt 2 (không dòng mới): exit 0, không kill
    ok   lượt 3: alert KILL ghi đúng lý do gateway.log
    ok   lượt 3: alert gọi launchctl bootout + pkill (STUB — không chạm OpenClaw thật)
    GATEWAY PASS

- eval: E9
  run_id: watchdog-l4b-cuoi-ngay-E9-20261023T161020
  exit_code: 0
  baseline: green
  verifier: config:executors.script.zc3_syntax
  verified_at: 2026-10-23T16:10:20Z
  output: |
    SYNTAX OK

## Known limits

- Mọi bằng chứng là sandbox: hàm trích nguyên văn, hoặc bản chép đổi 2 dòng với stub. Chưa có lần chạy thật nào sau triển khai; việc đó do ZCode làm qua kênh tin, theo Out of scope.
- Đuôi file cũ có turn mà file cũ đã bị xoá trước lượt quét đầu ngày mới: turn đó mất. Hợp đồng chọn thế (AC-4, bỏ qua im lặng), phép thử P3 xác nhận. Chấp nhận được khi /tmp chỉ bị dọn file vài ngày tuổi, không dọn trong 5 phút quanh nửa đêm. Lịch dọn /tmp thật của máy chưa đo.
- Ngày mới mà /tmp chưa có file (OpenClaw im lặng): watchdog chỉ gọi `scan_new_lines` khi `[ -f "$OC_LOG_GLOB" ]` (dòng 132). Phép thử P4 cho thấy đuôi ngày cũ được quét ở lượt ĐẦU TIÊN có file ngày mới, dù cách vài ngày, miễn file cũ còn và cùng inode. Turn 23:58 vì thế có thể được phát hiện trễ tới khi file ngày sau xuất hiện. Code cũ thì không bao giờ phát hiện.
- Chưa kiểm cách OpenClaw đặt tên file /tmp theo ngày: ngày theo thời điểm ghi, hay cố định lúc khởi động. Không đọc được `/tmp/openclaw` thật (luật 8). Nếu OpenClaw ghi tiếp vào file hôm qua sau nửa đêm, phần ghi sau nửa đêm chỉ được quét khi một file ngày mới xuất hiện.
- gateway.log xoay kiểu đổi tên (`gateway.log` → `gateway.log.1`): turn ở đuôi file đã đổi tên không được quét. Phép thử P5 xác nhận. Đây là giới hạn đã khai ở Out of scope.
- File cũ bị truncate (cùng inode, ít dòng hơn marker) rồi mới xoay ngày: đuôi cũ được quét từ `prevLines+1` của file ngắn hơn, nên không in gì. Phép thử P6: turn trong file cũ sau truncate bị mất. Ca hiếm.
- `stat -f '%i'` là cú pháp BSD/macOS. Đúng với máy chạy launchd này, không chạy trên Linux.
- E3–E6 dùng chung lệnh `scan` với E1. Mỗi eval là một lần chạy riêng, có run_id riêng, nhưng cùng một bộ kiểm.

## Ngoài hợp đồng

- **Marker hỏng trường số dòng làm hàm chết, và mù L4b /tmp kéo dài.** Đây là hồi quy so với e109402~1. Không AC nào phủ: AC-5 chỉ nói marker cũ dạng số `4211`.
  - Điều kiện: marker có dạng `đường_dẫn_cũ:inode_đúng:<không phải số>`, ví dụ `abc` hoặc `12x`, và file cũ còn với cùng inode.
  - Cơ chế: nhánh đổi file chạy `$((prevLines + 1))`. Dưới `set -u`, `abc` báo «unbound variable»; `12x` báo «value too great for base». Bash non-interactive thoát khỏi `$(...)`.
  - Hệ quả: không in gì, kể cả turn trong file ngày mới. Marker không được viết lại, nên mọi lượt sau lặp đúng lỗi đó cho tới khi file cũ biến mất hoặc đổi inode. Theo code (dòng 133–134), `TMP_NEW` rỗng thì không alert; lỗi chỉ nằm ở stderr.
  - e109402~1 với cùng marker: quét toàn bộ file mới, có turn, và tự chữa marker (phép thử P2/P2b chạy trên bản cũ).
  - Khả năng xảy ra: thấp. Marker chỉ do chính script ghi, với các trường số, và launchd không chạy chồng hai lượt. Cần sửa tay hoặc hỏng tệp mới gặp.
  - Gợi ý cho ZCode: kiểm `prevLines` là số trước khi tính, ví dụ `case $prevLines in ''|*[!0-9]*) …`. Hướng: `tin MỞ LẠI` nếu Mạnh muốn đóng.
  - Tái hiện an toàn: chỉ trích hàm, chạy trên tệp giả trong thư mục tạm.
    ```
    S=$(mktemp -d); cd "$S"
    awk '/^scan_new_lines\(\) \{/{p=1} p{print} p&&/^}$/{exit}' <worktree>/scripts/zalo-watchdog.sh > fn.sh
    printf 'a\nb\nc\n' > old.log
    printf 'x\n2026-10-23T00:01 [auto-reply/agent-turn-timing] turn=1\n' > new.log
    echo "$S/old.log:$(stat -f %i old.log):abc" > mk
    bash -c 'set -uo pipefail; source fn.sh; scan_new_lines "$1" mk' fn.sh "$S/new.log"; cat mk
    ```
    - HEAD: stderr «abc: unbound variable», stdout rỗng, `mk` giữ nguyên.
    - e109402~1: in 2 dòng (có turn), `mk` thành `…/new.log:<ino>:2`.
- `oldInode` không khai `local`, nên biến lọt ra phạm vi toàn cục. Phép thử P1: hai lượt xoay trong cùng shell, giá trị còn sau lượt 1. Nhưng không có hệ quả: biến luôn được gán ngay trước khi đọc, trong cùng nhánh. Lượt 2 với file cũ đã xoá bỏ qua nhánh, in đúng. Trong watchdog thật, mỗi lần gọi lại nằm trong `$(...)`, tức là subshell. Chỉ là vệ sinh code.
- Kiểm `[ -f "$prevPath" ]` là phòng thủ thừa. Đột biến bỏ nó thì `scan` vẫn xanh, vì `stat` lỗi trả `x`, khác inode. Không có hệ quả hành vi.

## Analyst

Không có eval ui-check, nên không áp «Network truth» (`network_observed` không dùng).

Baseline: chép harness mới sang thư mục tạm NGOÀI repo, dựng bằng `git archive e109402~1`, không tạo worktree. Watchdog ở đó trùng `git show e109402~1:scripts/zalo-watchdog.sh`. Chạy xong đã gỡ.
- E1 đỏ trên baseline: mục (a) không bắt turn, chỉ in 2 dòng.
- E2 đỏ trên baseline: lượt đầu ngày mới thoát sạch, không KILL, không gọi stub.

Hai eval này phân biệt code mới với code cũ.

Eval không phân biệt (xanh trên cả hai cây, xét đúng mục con mà eval trích):
- E3, E4, E5, E6: lệnh `scan` chung đỏ trên baseline chỉ vì mục (a). Các mục con (b), (c), (d), (e)/4211/gateway mà E3–E6 trích đều xanh trên e109402~1. Đúng bản chất AC-2..AC-5, vốn là tiêu chí «giữ hành vi», nên chúng là rào hồi quy, không phải bằng chứng tính năng.
- Bù cho E5: đột biến bỏ kiểm inode (`if [ "$oldInode" = "$prevInode" ]` → `if true`) làm đỏ mục (d) should-NOT-fire và mục marker 4211. Như vậy E5 bắt được một bản cài sai hợp lý.
- E7, E8, E9: rào hồi quy ZC3 có chủ đích (harness ZC3 không đổi từ e109402~1). Xanh trên cả hai cây là đúng kỳ vọng.

## Variance

Không có: mọi eval tất định, mỗi eval chạy 1 lần.

## Iterations

Round 1: E1–E9 đều đạt.
- Phản biện tìm ra một hồi quy NGOÀI hợp đồng (marker hỏng trường số dòng làm `scan_new_lines` chết, mù L4b /tmp kéo dài).
- Ghi ở «Ngoài hợp đồng» để Mạnh quyết ở Gate 2; không sửa code.
