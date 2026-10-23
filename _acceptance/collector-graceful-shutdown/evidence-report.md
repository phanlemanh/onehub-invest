---
schema_version: 2
feature_slug: collector-graceful-shutdown
verdict: REJECT
failed_evals: [E4]
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: 863c15b5087de4101c7a7a73e01c9667967bf5b0
human_signoff:
---

# Evidence Report: collector-graceful-shutdown

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-4 | script | PASS |
| E2 | AC-2 | test | PASS |
| E3 | AC-3 | script | PASS |
| E4 | AC-3 | script | FAIL (trượt ở cấp tiêu chí: lệnh đạt expected của E4, nhưng phép thử P1 của verifier phản ví dụ mệnh đề AC-3 mà E4 đứng ra chứng) |
| E5 | AC-1 | script | PASS |
| E6 | AC-4 | script | PASS |

**Lý do REJECT (tóm tắt):** với cấu hình mặc định thật (deadline 45s, timeout ảnh 10s,
concurrency 4), một tin đã ack 202 kèm 24 ảnh trên host ảnh treo bị MẤT khi SIGTERM: lượt
flush đầu bắt đầu lúc còn 45s nên không bỏ ảnh, chạy quá deadline; ở giây thứ 40 (còn 5s)
vẫn gọi host ảnh; deadline bắn, tiến trình thoát mã 0 với 0 snapshot, buffer còn 1 tin. Điều
này trái mệnh đề AC-3 «còn dưới 10s tới deadline thì flush bỏ tải ảnh (không gọi host ảnh)
nhưng tin vẫn ghi vào snapshot», và trái mục đích của AC-1 (tin đã ack không mất âm thầm).
Chi tiết ở khối P1 và mục «Ngoài hợp đồng».

## Evidence

- eval: E1
  run_id: collector-graceful-shutdown-E1-20261023T014347
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.collector_check
  verified_at: 2026-10-23T01:43:47Z
  output: |
    > one-invest-collector@0.1.0 check
    > tsc -p tsconfig.json --noEmit
    (không có dòng lỗi nào; tsc im lặng = biên dịch sạch)

- eval: E2
  run_id: collector-graceful-shutdown-E2-20261023T014353
  exit_code: 0
  baseline: red
  verifier: config:executors.test.collector
  verified_at: 2026-10-23T01:43:53Z
  output: |
    ✔ SIGTERM giữa lúc flush chậm + POST giữa chừng → cả hai tin vào snapshot (189.0185ms)
    ✔ SIGTERM: flush xong RỒI mới exit(0) — đúng thứ tự (41.40075ms)
    ✔ SIGINT cũng được bắt, không chỉ SIGTERM (10.525458ms)
    ✔ signal lần 2 khi đang chờ flush → exit ngay, flush chỉ 1 lần (11.781833ms)
    ✔ flush ném lỗi → vẫn exit(0), không treo tiến trình (10.129875ms)
    ✔ flush treo quá deadline → exit vẫn diễn ra (không đợi launchd SIGKILL) (47.105375ms)
    ✔ uninstall gỡ cả hai signal (0.175542ms)
    ✔ shutdown: đóng HTTP (close) TRƯỚC khi flush — không nhận POST mới nữa (31.34225ms)
    ✔ shutdown: sát deadline (còn <10s) → flush nhận skipMedia=true (bỏ ảnh giữ tin) (21.322208ms)
    ✔ shutdown: còn dư thời gian → flush nhận skipMedia=false (không bỏ ảnh sớm) (20.486084ms)
    ℹ tests 29 · pass 29 · fail 0 · cancelled 0 · skipped 0 · todo 0 · duration_ms 45091.653833
  note: |
    10 ca của hai tệp graceful-shutdown (1 tích hợp + 9 đơn vị) đều xanh. Expected viết «có ca
    tích hợp … và 10 ca graceful-shutdown»; đếm thực tế là 10 ca tính cả ca tích hợp (tệp đơn vị
    có 9). Mọi ca expected liệt kê trong ngoặc đều có mặt và xanh, nên đọc là đạt.

- eval: E3
  run_id: collector-graceful-shutdown-E3-20261023T014454
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.shutdown_deadline
  verified_at: 2026-10-23T01:44:54Z
  output: |
    graceful.ts: DEFAULT_DEADLINE_MS=45000 · MEDIA_CUTOFF_MS=10000 · plist ExitTimeOut=60s
    ok   deadline mặc định = 45000ms
    ok   ngưỡng bỏ ảnh = 10000ms
    ok   plist ExitTimeOut = 60
    ok   45s < 60s, dư 15000ms trước SIGKILL
    ok   main.ts không ghi đè deadlineMs (dùng mặc định 45s)
    ok   main.ts cắt connection keep-alive (closeAllConnections) trong close()
    ok   should-NOT-fire: deadline 60s = ExitTimeOut 60 → luật đỏ
    ok   should-NOT-fire: deadline 75s > ExitTimeOut 60 → luật đỏ
    ok   should-NOT-fire: ngưỡng ảnh = deadline → luật đỏ
    DEADLINE PASS

- eval: E4
  run_id: collector-graceful-shutdown-E4-20261023T014459
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.shutdown_skip_media
  verified_at: 2026-10-23T01:44:59Z
  output: |
    skipMedia=true, host ảnh treo: flush 1ms · gọi host ảnh 0 lần · tệp ảnh 0
    ok   tin ack 202 và flush trả snapshotId
    ok   tin có trong snapshot dù bỏ ảnh
    ok   should-NOT-fire: không gọi host ảnh lần nào
    ok   should-NOT-fire: không có tệp ảnh trong snapshot
    ok   flush không chờ host ảnh treo (< 2000ms; timeout ảnh 5000ms)
    đối chứng skipMedia=false: gọi host ảnh 1 lần · tệp ảnh 1
    ok   đối chứng: tin có trong snapshot
    ok   đối chứng: flush thường CÓ tải ảnh — skipMedia mới là thứ chặn
    SKIP-MEDIA PASS
  note: |
    Lệnh đạt đúng expected của E4. E4 bị đánh trượt ở CẤP TIÊU CHÍ: E4 chỉ gọi thẳng
    server.flush({skipMedia:true}) — nó chứng cờ skipMedia chạy đúng, nhưng không chứng được
    mệnh đề AC-3 «còn dưới 10s tới deadline thì … không gọi host ảnh … tin vẫn ghi vào
    snapshot» khi shutdown thật chạy. Phép thử P1 dưới đây cho phản ví dụ trên cùng cây.

- probe: P1 (verifier tự dựng, không thuộc evals.yaml; không có dòng run-log)
  criterion: AC-3 (và mục đích AC-1)
  verifier: _acceptance/collector-graceful-shutdown/evidence/P1-deadline-probe.mjs
  evidence: _acceptance/collector-graceful-shutdown/evidence/P1-deadline-probe.txt
  verified_at: 2026-10-23T01:49:00Z
  setup: |
    collector/dist của nhánh (863c15b); createAgentServer thật + installGracefulShutdown thật,
    deadline mặc định 45s, media mặc định (timeout 10s, concurrency 4), host ảnh 127.0.0.1 nhận
    kết nối nhưng không bao giờ trả lời; 1 tin kèm N URL ảnh được ingest (ack 202) rồi SIGTERM
    (giả lập qua deps.on). Snapshot ghi vào thư mục tạm của hệ và bị xoá.
  output: |
    N=24: ack=202 · thoát sau 45001ms · snapshot hoàn tất 0 · buffered 1 · gọi host ảnh 20
      log: 0ms shutdown: SIGTERM — đóng HTTP, flush buffer rồi thoát (tối đa 45000ms)
      log: 45001ms shutdown: flush quá deadline — thoát
    Đối chứng N=8: ack=202 · thoát sau 20010ms · snapshot hoàn tất 1 · buffered 0 · gọi host ảnh 8
      log: 20010ms shutdown: flushed hanoi__zalo-agent__2026-10-23T014932050
  observed: |
    Với N=24, host ảnh vẫn bị gọi ở đợt thứ năm (giây 40, còn 5s tới deadline) và tin đã ack
    không vào snapshot nào trước khi tiến trình thoát mã 0. Với N=8 (lượt flush 20s) thì tin vào
    snapshot. Ngưỡng mất tin ở cấu hình mặc định: lượt flush đầu dài hơn khoảng 45s, tức khoảng
    hơn 16 URL ảnh treo trong buffer (ceil(N/4) × 10s), hoặc ít hơn nếu lượt flush định kỳ 60s
    đang chạy dở lúc SIGTERM tới (single-flight: shutdown phải chờ chung lượt đó).

- eval: E5
  run_id: collector-graceful-shutdown-E5-20261023T014511
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.shutdown_process
  verified_at: 2026-10-23T01:45:11Z
  output: |
    ok   SIGTERM: connection keep-alive còn mở sau 202 (header connection: keep-alive)
    SIGTERM, 1 tin trong buffer: mã thoát 0, signal null · snapshot 1
    ok   SIGTERM: POST ingest qua keep-alive được ack 202
    ok   SIGTERM: tiến trình tự exit(0), không bị giết bằng tín hiệu
    ok   SIGTERM: connection keep-alive bị server đóng
    ok   SIGTERM: tin đã ack có trong snapshot
    ok   SIGTERM: log có đủ ba dòng shutdown → flushed → flush xong
    ok   SIGTERM: dòng báo đóng HTTP đứng trước dòng flushed
    SIGINT, buffer rỗng: mã thoát 0, signal null · snapshot 0
    ok   SIGINT: tiến trình tự exit(0)
    ok   should-NOT-fire: buffer rỗng → không ghi snapshot rỗng
    ok   should-NOT-fire: buffer rỗng → không có dòng flushed
    PROCESS PASS
  note: |
    Trước và sau E5: tiến trình đang nghe :9210 vẫn là cùng PID (không bị đụng);
    ~/dev/onehub-invest/collector/snapshots/hanoi giữ nguyên 410 mục; worktree không phát sinh
    collector/snapshots; không còn thư mục tạm acc-* sót lại.

- eval: E6
  run_id: collector-graceful-shutdown-E6-20261023T014533
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.collector_plist_lint
  verified_at: 2026-10-23T01:45:33Z
  output: |
    pipeline/cron/com.oneinvest.collector-api.plist: OK

## Known limits

- AC-2 chỉ được chứng bằng một ca test tích hợp (E2) với agent server thật nhưng deps tín hiệu/exit giả: «POST giữa chừng» là lời gọi thẳng `s.ingest()`, không qua HTTP, và ca này không nối `close`. Ca đặt `deadlineMs: 10_000`, nên mọi lượt flush do shutdown gọi đều có remaining < 10s → đi nhánh skipMedia, không đi đường mặc định 45s. Tiến trình thật (E5) không phủ ca flush chậm + tin đến giữa chừng.
- AC-1 «đóng HTTP trước khi flush»: E5 kiểm thứ tự dòng log, nhưng dòng «shutdown: SIGTERM — đóng HTTP…» được in TRƯỚC khi `close()` được gọi, nên thứ tự log không chứng được close đã xong trước flush. Thứ tự close → flush chỉ được chứng bằng test đơn vị với `close` giả (E2). Trên tiến trình thật, E5 chứng được keep-alive bị cắt và tiến trình tự thoát mã 0.
- AC-1 «lặp flush tới khi buffer rỗng»: E5 chỉ có 1 tin, tức 1 lượt flush; vòng lặp nhiều lượt chỉ được chứng ở ca tích hợp của E2.
- AC-3 «flush treo quá deadline vẫn tự exit» và «tín hiệu lần 2 thoát ngay»: chỉ có test đơn vị với flush giả và deadline rút ngắn; chưa đo trên tiến trình thật với 45s. E3 là kiểm tĩnh (regex đọc hằng số trong `graceful.ts`, `plutil -extract` plist), không chạy mã. Quyết định «remaining < 10s → skipMedia» trong vòng lặp chỉ được chứng bằng test đơn vị với flush giả; E4 gọi thẳng `flush({skipMedia})`, bỏ qua vòng lặp shutdown.
- AC-4: `plutil -lint` chỉ kiểm cú pháp. Plist còn placeholder `__ROOT__` (cần thay khi cài), chưa từng được launchd nạp; hành vi thật của launchd (SIGTERM rồi SIGKILL sau `ExitTimeOut` 60) không được đo. `collector/scripts/api-launchd.sh` (đã có trên main, không thuộc diff) dùng `exec` nên tín hiệu tới thẳng node: điều này đọc từ mã, chưa chạy thử. E1 chỉ là `tsc --noEmit`; bản build thật (`npm run build`) chạy xanh như bước đầu của E4/E5.
- E5 chạy bản chép `collector/dist` trong thư mục tạm, `node_modules` symlink, Node v24.21.0 (cùng bản với `/Users/manhphan/.local/bin/node` mà api-launchd.sh dùng): giống runtime thật về mã, khác đường dẫn snapshot/state.

## Ngoài hợp đồng

- **[Lỗi thật, chạm AC-3; là lý do REJECT]** `graceful.ts` chỉ quyết định skipMedia ở ĐẦU mỗi lượt flush, còn `server.ts` single-flight thì lượt đang chạy không đổi theo flushOpts. Lượt đầu bắt đầu khi còn ~45s nên luôn tải ảnh; mỗi đợt tải ảnh có thể tốn tới `timeoutMs` 10s × ceil(URL/4), trần `maxPerFlush` 100 URL tức tới khoảng 250s. Khi host ảnh treo (mạng chập chờn, không phải từ chối nhanh), lượt đầu chạy quá deadline, `finish` gọi `exit(0)` và mọi tin đã ack trong buffer mất, đúng loại mất mát tính năng này sinh ra để chặn (P1: 24 URL → 0 snapshot). Hướng sửa gợi ý (làn ZCode, qua `tin MỞ LẠI`): truyền deadline hoặc AbortSignal vào flush để tới mốc còn 10s thì huỷ tải ảnh đang chạy rồi ghi items; hoặc lượt shutdown đầu ước lượng thời gian tải ảnh so với remaining; thêm eval tiến trình hoặc tích hợp với deadline mặc định và host ảnh treo, nhiều URL, để chặn hồi quy.
- Thoát mã 0 cả ở đường mất tin (flush lỗi, quá deadline): launchd và giám sát không phân biệt được tắt êm với tắt có mất tin; dấu vết duy nhất là một dòng log. Đây là hành vi hợp đồng cho phép («vẫn tự exit»), chỉ báo để cân nhắc: dùng mã khác 0 hoặc log cảnh báo có số tin còn trong buffer.
- `closeAllConnections()` cắt cả request đang xử lý dở, ví dụ POST đã vào buffer nhưng đang chờ auto-flush (buffer ≥ 50) trước khi trả 202: client nhận lỗi kết nối dù tin sẽ được flush, và có thể gửi lại. Chưa kiểm khử trùng theo sourceId có hấp thụ lần gửi lại hay không. Chỉ báo.

## Analyst

Non-discriminating evals: không đo được tín hiệu green-on-both cho eval tính năng nào. E2 đo được: red. E1 (`tsc --noEmit`) về bản chất là guard hồi quy, gần như chắc chắn green trên main, nhưng không đo nên không xếp. Riêng E4 tuy xanh trên nhánh nhưng không đủ phân biệt ở cấp tiêu chí: nó không phát hiện được phản ví dụ P1.

Baseline E2 đo được: worktree tạm detached tại diffBase e659db6 (merge-base của HEAD với origin/main đã merge) trong scratchpad, ngoài repo; symlink `collector/node_modules`; `npm test` → 19/19 xanh nhưng 0 ca graceful-shutdown, nên KHÔNG đạt expected của E2 → red (eval phân biệt). Worktree tạm đã gỡ bằng `git worktree remove --force`.

Baseline khong do:
- E1: `collector/src/api/graceful.ts` chưa tồn tại trên diffBase. Typecheck cây cũ chỉ chứng cây cũ biên dịch được, không nói gì về tính năng.
- E3: `scripts/collector-shutdown/acceptance.mjs`, `collector/src/api/graceful.ts` và `pipeline/cron/com.oneinvest.collector-api.plist` chưa tồn tại trên diffBase. Eval mới, chạy trên cây cũ không chứng minh gì.
- E4, E5: `scripts/collector-shutdown/acceptance.mjs` chưa tồn tại trên diffBase (E5 còn cần `graceful.ts`).
- E6: `pipeline/cron/com.oneinvest.collector-api.plist` chưa tồn tại trên diffBase.

## Variance

none — every multi-run eval is uniform (không eval nào khai runs > 1). P1 chạy hai lần (thăm dò rồi ghi bằng chứng) cho cùng kết quả: N=24 mất tin cả hai lần, N=8 vào snapshot cả hai lần.

## Iterations

Round 1: E4 failed (cấp tiêu chí): E1–E6 đều đạt expected của từng eval, nhưng phép thử P1 cho thấy lượt flush đầu khi shutdown không bỏ ảnh sát deadline, nên với host ảnh treo và hơn khoảng 16 URL ảnh thì tin đã ack mất và tiến trình vẫn thoát mã 0. Returned to implementation.
