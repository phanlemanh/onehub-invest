---
schema_version: 2
feature_slug: collector-graceful-shutdown
verdict: REJECT
failed_evals: [E7]
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: dfaa45b673ae79e78d20f58ecb20f0b3c55297da
human_signoff:
---

# Evidence Report: collector-graceful-shutdown

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-4 | script | PASS |
| E2 | AC-2 | test | PASS |
| E3 | AC-3 | script | PASS |
| E4 | AC-3 | script | PASS |
| E5 | AC-1 | script | PASS |
| E6 | AC-4 | script | PASS |
| E7 | AC-3 | script | FAIL (trượt ở cấp tiêu chí: lệnh đạt expected của E7, nhưng phép thử P2 của verifier phản ví dụ mệnh đề AC-3 mà E7 đứng ra chứng) |
| E8 | AC-1 | script | PASS |
| E9 | AC-5 | script | PASS |

**Lý do REJECT (tóm tắt):** vòng 2 đã sửa đúng ca của vòng 1: lượt flush DO SHUTDOWN KHỞI giờ nhận
`deadlineAt` và huỷ ảnh ở mốc còn 10s (E7 và P1 đều xanh). Nhưng AC-3 nói «một lượt flush ĐANG tải ảnh
treo (vd 24 ảnh, số mặc định thật) bị huỷ tải ảnh ở mốc còn 10s và tin vẫn vào snapshot trước deadline».
Lượt flush định kỳ 60s của `main.ts` (`agent.flush()` không tham số) không có `deadlineAt`. Nếu SIGTERM
tới lúc lượt đó đang tải ảnh treo, shutdown gọi `flush({deadlineAt})` thì single-flight trả lại đúng
promise đang chạy, và `flushOpts` mới bị bỏ qua (`server.ts` dòng 227). Không có gì huỷ ảnh, lượt
chạy quá deadline, và tin đã ack 202 mất. P2: 24 ảnh treo, SIGTERM 2s sau khi lượt định kỳ bắt đầu,
deadline mặc định. Kết quả: 0 snapshot, buffered 1, host ảnh vẫn bị gọi ở đợt thứ năm (còn khoảng 7s
tới deadline), thoát mã khác 0 kèm «MẤT 1 tin». AC-5 giữ được (không mất âm thầm), nhưng mệnh đề huỷ
ảnh và giữ tin của AC-3 không đúng cho ca này. Với host ảnh treo, ca này không hiếm: lượt định kỳ kéo
dài ceil(N/4) × 10s (24 ảnh thành 60s, trần 100 URL thành 250s). SIGTERM rơi vào bất kỳ lúc nào lượt
đó còn hơn khoảng 45s nữa mới xong thì mất tin. Chi tiết và cách tái hiện ở khối P2 và mục «Ngoài hợp đồng».

## Evidence

- eval: E1
  run_id: collector-graceful-shutdown-E1-20261023T053926
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.collector_check
  verified_at: 2026-10-23T05:39:26Z
  output: |
    > one-invest-collector@0.1.0 check
    > tsc -p tsconfig.json --noEmit
    (không có dòng lỗi nào; tsc im lặng = biên dịch sạch)

- eval: E2
  run_id: collector-graceful-shutdown-E2-20261023T053932
  exit_code: 0
  baseline: red
  verifier: config:executors.test.collector
  verified_at: 2026-10-23T05:39:32Z
  output: |
    ✔ SIGTERM giữa lúc flush chậm + POST giữa chừng → cả hai tin vào snapshot (189.72175ms)
    ✔ deadline huỷ tải ảnh treo giữa chừng — tin vẫn vào snapshot, không chờ ảnh (claudedp-2310-3) (2021.925166ms)
    ✔ SIGTERM: flush xong RỒI mới exit(0) — đúng thứ tự (41.354834ms)
    ✔ signal lần 2 khi đang chờ flush → exit ngay, flush chỉ 1 lần (10.89475ms)
    ✔ flush treo quá deadline → exit vẫn diễn ra (không đợi launchd SIGKILL) (46.141667ms)
    ✔ shutdown: sát deadline (còn <10s) → flush nhận skipMedia=true (bỏ ảnh giữ tin) (19.797625ms)
    ✔ shutdown: flush nhận deadlineAt = thời điểm bắt đầu + deadline (claudedp-2310-3) (21.524833ms)
    ✔ quá deadline mà buffer còn tin → exit(1) + log số tin mất, không im lặng exit(0) (51.413542ms)
    ✔ flush xong hết buffer → exit(0) (pendingCount=0) (21.388417ms)
    ℹ tests 33 · pass 33 · fail 0 · cancelled 0 · skipped 0 · todo 0 · duration_ms 45090.366417
  note: |
    14 ca graceful-shutdown (2 tích hợp + 12 đơn vị) đều chạy và xanh, gồm hai ca tích hợp expected
    gọi tên: «SIGTERM giữa lúc flush chậm + POST giữa chừng» và ca host ảnh treo vĩnh viễn («deadline huỷ
    tải ảnh treo giữa chừng»). 0 fail, 0 skip.

- eval: E3
  run_id: collector-graceful-shutdown-E3-20261023T054023
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.shutdown_deadline
  verified_at: 2026-10-23T05:40:23Z
  output: |
    graceful.ts: DEFAULT_DEADLINE_MS=45000 · MEDIA_CUTOFF_MS=10000 · plist ExitTimeOut=60s
    ok   deadline mặc định = 45000ms
    ok   ngưỡng bỏ ảnh = 10000ms
    ok   plist ExitTimeOut = 60
    ok   45s < 60s, dư 15000ms trước SIGKILL
    ok   main.ts không ghi đè deadlineMs (dùng mặc định 45s)
    ok   main.ts cắt connection keep-alive rảnh (closeIdleConnections) trong close()
    ok   main.ts không gọi closeAllConnections (không giết POST đang dở)
    ok   main.ts nối pendingCount (exit khác 0 khi còn tin)
    ok   should-NOT-fire: deadline 60s = ExitTimeOut 60 → luật đỏ
    ok   should-NOT-fire: deadline 75s > ExitTimeOut 60 → luật đỏ
    ok   should-NOT-fire: ngưỡng ảnh = deadline → luật đỏ
    DEADLINE PASS

- eval: E4
  run_id: collector-graceful-shutdown-E4-20261023T054023
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.shutdown_skip_media
  verified_at: 2026-10-23T05:40:23Z
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

- eval: E5
  run_id: collector-graceful-shutdown-E5-20261023T054040
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.shutdown_process
  verified_at: 2026-10-23T05:40:40Z
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
    Lệnh tốn 16s tường, nhưng shutdown thật chỉ vài ms. Đo riêng trên main.js thật: SIGTERM tới thoát
    là 4ms khi có tin, 2ms khi buffer rỗng. Phần còn lại là timer `sleep(15_000)` của harness giữ event
    loop sau khi race đã xong; đó là chuyện của harness, không phải sản phẩm.

- eval: E6
  run_id: collector-graceful-shutdown-E6-20261023T054056
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.collector_plist_lint
  verified_at: 2026-10-23T05:40:56Z
  output: |
    pipeline/cron/com.oneinvest.collector-api.plist: OK

- eval: E7
  run_id: collector-graceful-shutdown-E7-20261023T054118
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.shutdown_hang_default
  verified_at: 2026-10-23T05:41:18Z
  output: |
    24 ảnh treo, deadline mặc định: mã thoát 0 sau 35013ms · snapshot 1 · buffer còn 0 · gọi host ảnh 16
      log: 0ms shutdown: SIGTERM — đóng HTTP, flush buffer rồi thoát (tối đa 45000ms)
      log: 35013ms shutdown: flushed hanoi__zalo-agent__2026-10-23T054118798
      log: 35013ms shutdown: flush xong — thoát
    ok   tin ack 202
    ok   exit 0 (không mất tin)
    ok   tin đã ack có trong snapshot
    ok   buffer rỗng lúc thoát
    ok   thoát trước deadline 45s (ảnh treo bị huỷ, không chạy tới mốc deadline)
    ok   should-NOT-fire: không có dòng 'flush quá deadline'
    HANG-DEFAULT PASS
  note: |
    Lệnh đạt đúng expected của E7. E7 bị đánh trượt ở CẤP TIÊU CHÍ: E7 chỉ có MỘT lượt flush, do chính
    shutdown khởi, nên nó nhận `deadlineAt`. E7 không phủ ca lượt flush ĐANG chạy lúc SIGTERM tới (lượt
    định kỳ 60s hoặc lượt auto-flush khi buffer ≥ 50). Mệnh đề AC-3 «một lượt flush ĐANG tải ảnh treo …
    bị huỷ tải ảnh ở mốc còn 10s và tin vẫn vào snapshot» sai cho ca đó: xem phép thử P2 dưới đây, chạy
    trên cùng cây.

- probe: P2 (verifier tự dựng, không thuộc evals.yaml; không có dòng run-log)
  criterion: AC-3 (và mục đích AC-1)
  verifier: _acceptance/collector-graceful-shutdown/evidence/P2-inflight-periodic-probe.mjs
  evidence: _acceptance/collector-graceful-shutdown/evidence/probes-round2.txt
  verified_at: 2026-10-23T05:44:31Z
  setup: |
    collector/dist build từ dfaa45b. Nối dây y như main.ts: createAgentServer thật + installGracefulShutdown
    thật, deadline mặc định 45s, media mặc định (timeout 10s, concurrency 4). Allowlist trỏ host ảnh
    127.0.0.1 nhận kết nối nhưng không bao giờ trả lời. Ingest 1 tin kèm 24 URL ảnh (ack 202), gọi
    `s.flush()` không tham số y như setInterval 60s của main.ts, chờ D ms, rồi SIGTERM (giả lập qua
    deps.on). Snapshot ghi vào thư mục tạm của hệ và bị xoá.
    Lệnh: node _acceptance/collector-graceful-shutdown/evidence/P2-inflight-periodic-probe.mjs $PWD 24 <D>
  output: |
    N=24 D=2000ms: ack=202 · SIGTERM sau 2005ms kể từ lúc lượt định kỳ bắt đầu · thoát sau 45002ms kể từ SIGTERM · mã khác 0 · snapshot hoàn tất 0 · buffered 1 · gọi host ảnh 20
      log: 1ms shutdown: SIGTERM — đóng HTTP, flush buffer rồi thoát (tối đa 45000ms)
      log: 45002ms shutdown: flush quá deadline — thoát
      log: 45002ms shutdown: MẤT 1 tin đã ack chưa kịp flush — thoát mã 1 để giám sát thấy
    Đối chứng D=20000ms: ack=202 · thoát sau 40015ms kể từ SIGTERM · mã 0 · snapshot hoàn tất 1 · buffered 0 · gọi host ảnh 24
  observed: |
    Khi SIGTERM rơi 2s sau khi lượt định kỳ bắt đầu, ảnh không bị huỷ ở mốc còn 10s: host ảnh bị gọi 20
    lần, tức đợt thứ năm mở ở giây 40 của lượt, khoảng 38s sau SIGTERM, còn khoảng 7s tới deadline. Lượt
    định kỳ cần 60s nên chưa xong khi deadline bắn, và tin đã ack không vào snapshot nào. Ở đối chứng
    (SIGTERM ở giây 20) lượt định kỳ xong ở giây 60, trước deadline, nên tin vào snapshot.
  repro: |
    cd collector && npm run build && cd .. && node _acceptance/collector-graceful-shutdown/evidence/P2-inflight-periodic-probe.mjs $PWD 24 2000
    (khoảng 47s). Nguyên nhân trong mã: `server.ts` flush() single-flight, dòng 227
    `if (flushing) return flushing;` bỏ qua `flushOpts` của lời gọi sau. Lượt định kỳ ở `main.ts` dòng 37
    gọi `agent.flush()` không có `deadlineAt`, nên AbortController của nó không bao giờ được hẹn giờ
    (`server.ts` dòng 168–171). Chú thích ở `server.ts` dòng 221–222 tự nhận «Lượt đang chạy không đổi
    theo flushOpts», nhưng giả định «shutdown sẽ gọi lại lượt mới sau lượt này» chỉ đúng khi lượt đang
    chạy xong trước deadline.

- eval: E8
  run_id: collector-graceful-shutdown-E8-20261023T054159
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.shutdown_inflight
  verified_at: 2026-10-23T05:41:59Z
  output: |
    POST dở lúc SIGTERM: trả 202 · connection mới sau SIGTERM: ECONNREFUSED · mã thoát 0, signal null · snapshot 1
    ok   POST đang dở được làm nốt và ack 202 (không bị cắt)
    ok   should-NOT-fire: connection mới sau SIGTERM bị từ chối
    ok   tiến trình tự exit(0)
    ok   tin của POST dở có trong snapshot
    INFLIGHT PASS
  note: |
    Điểm phụ vòng 1 («closeAllConnections cắt POST đang dở») đã được xử lý: `main.ts` gọi
    `closeIdleConnections()`, E3 xác nhận không còn `closeAllConnections()`. Chạy harness E8 trên mã
    vòng 1 (863c15b) thì POST dở không có phản hồi và tin không vào snapshot (xem Analyst). E8 dùng
    `Connection: close`; ca POST keep-alive dở chỉ được phủ ở P3 (ka).

- eval: E9
  run_id: collector-graceful-shutdown-E9-20261023T054215
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.shutdown_lost_exit
  verified_at: 2026-10-23T05:42:15Z
  output: |
    flush treo quá deadline, còn 3 tin: mã thoát khác 0 · shutdown: MẤT 3 tin đã ack chưa kịp flush — thoát mã 1 để giám sát thấy
    ok   quá deadline mà còn tin → exit khác 0
    ok   log ghi số tin mất (MẤT 3 tin)
    tín hiệu lần 2, còn 2 tin: mã thoát khác 0 · shutdown: MẤT 2 tin đã ack chưa kịp flush — thoát mã 1 để giám sát thấy
    ok   tín hiệu lần 2 mà còn tin → exit khác 0
    ok   log ghi số tin mất (MẤT 2 tin)
    quá deadline, buffer rỗng: mã thoát 0
    ok   should-NOT-fire: buffer rỗng → exit 0
    ok   should-NOT-fire: buffer rỗng → không có dòng MẤT
    LOST-EXIT PASS
  note: |
    Điểm phụ vòng 1 («thoát mã 0 cả ở đường mất tin») đã được xử lý: `graceful.ts` finish() đọc
    `pendingCount()`, nếu còn tin thì log «MẤT N tin» và thoát mã 1; `main.ts` nối
    `pendingCount: () => agent.stats().buffered`. E9 dùng flush giả và pendingCount giả. Trên tiến trình
    main.js thật, đường thoát mã khác 0 kèm «MẤT 1 tin» được thấy ở P3 (stall). Lệnh tốn 61s tường vì
    timer deadline 60s của ca tín hiệu lần 2 trong harness vẫn treo event loop; đó là chuyện của harness.

## Known limits

- E7 và P2 chạy trong tiến trình harness (createAgentServer + installGracefulShutdown thật, deps tín hiệu và exit giả), không chạy trên main.js thật. Lý do: main.js không cho ghi đè allowlist ảnh (cố định `zdn.vn`, không có env), nên không trỏ được vào host treo cục bộ. Việc `main.ts` chuyển `flushOpts` (gồm `deadlineAt`) sang `agent.flush` được đọc từ mã (dòng 56), chưa đo đầu-cuối trên tiến trình thật.
- AC-2 vẫn chỉ được chứng bằng ca tích hợp trong E2 với deps tín hiệu và exit giả: «POST giữa chừng» là lời gọi thẳng `s.ingest()`, không qua HTTP, ca đặt `deadlineMs: 10_000` và ảnh chậm 150ms chứ không treo. Tiến trình thật không phủ ca flush chậm + tin đến giữa chừng.
- AC-1 «đóng HTTP trước khi flush»: dòng log «shutdown: SIGTERM — đóng HTTP…» được in TRƯỚC khi `close()` được gọi, nên thứ tự log ở E5 không chứng được close đã xong trước flush. Trên tiến trình thật, thứ tự này chỉ thấy gián tiếp ở P3 (stall): không có lượt flush nào chạy khi còn một POST dở. E8 dùng `Connection: close`; POST keep-alive dở chỉ phủ ở P3 (ka).
- AC-1 «lặp flush tới khi buffer rỗng»: E5, E7, E8 mỗi ca chỉ có 1 lượt flush; vòng lặp nhiều lượt chỉ được chứng ở ca tích hợp đầu của E2.
- AC-3 «tín hiệu lần 2 thoát ngay» và AC-5 chỉ có test đơn vị và harness với flush giả (E2, E9). E3 là kiểm tĩnh (regex hằng số trong `graceful.ts`, `plutil -extract` plist), không chạy mã.
- AC-4: `plutil -lint` chỉ kiểm cú pháp. Plist còn placeholder `__ROOT__`, chưa từng được launchd nạp; hành vi thật của launchd (SIGTERM rồi SIGKILL sau `ExitTimeOut` 60) và cách launchd xử lý mã thoát khác 0 (KeepAlive true sẽ khởi động lại) không được đo. E1 chỉ là `tsc --noEmit`; `npm run build` chạy xanh ở bước đầu của E4, E5, E7, E8, E9.
- E5, E8 và các probe P3 chạy bản chép `collector/dist` trong thư mục tạm với `node_modules` symlink: giống runtime thật về mã, khác đường dẫn snapshot và state.

## Ngoài hợp đồng

- **[Lỗi thật, chạm AC-3; là lý do REJECT]** Lượt flush đang chạy lúc SIGTERM tới (lượt định kỳ 60s của `main.ts`, hoặc lượt auto-flush trong `handle()` khi buffer ≥ 50) không có `deadlineAt`. Single-flight khiến shutdown chỉ chờ chung lượt đó, nên ảnh treo không bị huỷ và tin mất (P2; có thoát mã khác 0 và «MẤT N tin», nên không mất âm thầm). Ca auto-flush còn nặng hơn (đọc từ mã, chưa đo): `handle()` chờ flush xong mới trả 202, nên `close()` cũng chờ theo, và lượt flush của shutdown không bắt đầu trước deadline. Hướng sửa gợi ý (làn ZCode, qua `tin MỞ LẠI`): giữ AbortController của lượt đang chạy ở phạm vi server; khi `flush()` được gọi kèm `deadlineAt` mà đang có lượt chạy thì hẹn giờ abort cho chính lượt đó (hoặc có `agent.abortMediaAt(deadlineAt)` để shutdown gọi trước vòng lặp). Thêm một ca eval: lượt flush không tham số đang tải 24 ảnh treo, SIGTERM ngay sau đó, deadline mặc định (P2 có thể thành eval).
- **[Rủi ro, gần AC-1]** Một POST dở mà không bao giờ xong (đã gửi header và một phần body rồi im) giữ `close()` tới deadline. Vì vòng flush chỉ chạy sau `close()`, MỌI tin đã ack 202 TRƯỚC ĐÓ cũng mất, không chỉ tin của POST dở. P3 (stall) trên main.js thật: tin A ack 202, một POST treo nửa body, SIGTERM → thoát sau 45009ms, mã khác 0, «MẤT 1 tin», 0 snapshot. `requestTimeout` mặc định của Node (300s) dài hơn deadline nên không cứu được. Quyết định d-20261023T053649Z-2 có nêu «keep-alive đang có request bị giữ tới khi request xong (tối đa deadline)», nhưng không nêu hệ quả là cả buffer bị giữ lại. Hướng gợi ý: chờ `close()` có trần (vd tới `deadlineAt - MEDIA_CUTOFF_MS`) rồi vẫn flush; hoặc flush song song với chờ close rồi lặp thêm một lượt sau khi close xong.
- **[Rủi ro nhỏ]** Sau SIGTERM, server vẫn trả `connection: keep-alive` và vẫn nhận request mới trên socket keep-alive ĐÃ CÓ (không phải connection mới). P3 (reuse): POST thứ hai trên cùng socket, 1,3s sau SIGTERM, được 202 và vào snapshot. Mỗi request như vậy kéo `close()` thêm khoảng keepAliveTimeout (P3 ka: socket đóng 5998ms sau phản hồi, thoát sau 6320ms). Không mất tin trong phép thử, nhưng (suy từ mã, chưa đo) một client gửi đều hơn 5s một lần qua cùng socket sẽ giữ `close()` tới deadline, rồi rơi vào đúng ca stall ở trên.
- Harness `scripts/collector-shutdown/acceptance.mjs` để timer `sleep(15_000)` (process, inflight) và deadline 60s (lost-exit) treo event loop sau khi race đã xong: E5, E8 tốn 16s, E9 tốn 61s tường, dù shutdown thật chỉ vài ms. Không ảnh hưởng kết quả, chỉ làm chậm cổng.

## Analyst

Non-discriminating evals: none — E2, eval duy nhất đo được trên diffBase, red; ba eval mới E7, E8, E9
cũng red khi chạy trên mã vòng 1 (đối chứng ngoài baseline, xem dưới). E1 (`tsc --noEmit`) về bản chất
là guard hồi quy, không đo nên không xếp. Riêng E7 tuy phân biệt được mã vòng 1 với mã vòng 2, nhưng
không đủ ở cấp tiêu chí: nó không phát hiện được phản ví dụ P2.

Baseline E2 đo được: worktree tạm detached tại diffBase cba11e4 (merge-base của HEAD với origin/main),
đặt trong scratchpad ngoài repo, symlink `collector/node_modules`. `npm test` cho 19/19 xanh nhưng 0 ca
graceful-shutdown, nên KHÔNG đạt expected của E2 → red (eval phân biệt). Worktree tạm đã gỡ bằng
`git worktree remove --force` rồi `git worktree prune`.

Đối chứng với mã vòng 1 (không phải baseline diffBase): worktree tạm detached tại 863c15b trong
scratchpad, chép `scripts/collector-shutdown/acceptance.mjs` của HEAD vào, build collector rồi chạy ba
mode mới. Kết quả bằng chữ: hang-default ra HANG-DEFAULT FAIL (4 mục; tin không vào snapshot, chạm
«flush quá deadline»); inflight ra INFLIGHT FAIL (2 mục; POST dở không có phản hồi, tin không vào
snapshot); lost-exit ra LOST-EXIT FAIL (4 mục; không có dòng MẤT, tín hiệu lần 2 vẫn thoát mã 0).
Ba eval mới phân biệt được mã cũ với mã mới. Worktree tạm đã gỡ.

P1 (probe vòng 1, chạy nguyên văn với số mặc định, không sửa tệp probe; 2026-10-23T05:43:25Z):
`cd collector && npm run build && cd .. && node _acceptance/collector-graceful-shutdown/evidence/P1-deadline-probe.mjs $PWD 24`

    ack=202 images=24 · exit sau 35011ms · code 0 · snapshot hoàn tất 1 · buffered 0 · gọi host ảnh 16
      log: 0ms shutdown: SIGTERM — đóng HTTP, flush buffer rồi thoát (tối đa 45000ms)
      log: 35010ms shutdown: flushed hanoi__zalo-agent__2026-10-23T054326255
      log: 35010ms shutdown: flush xong — thoát

Đạt yêu cầu: snapshot hoàn tất 1 (≥ 1), buffered 0, không mất tin; ảnh bị huỷ ở giây 35 (còn 10s).
Vòng 1 cùng probe cho 0 snapshot, buffered 1.

Probe P3 (`evidence/P3-stalled-post-probe.mjs`, main.js thật, cổng ngẫu nhiên, key giả): ka, stall,
reuse. Số liệu nguyên văn ở `evidence/probes-round2.txt` và tóm ở «Ngoài hợp đồng».

Không đụng runtime thật: trước và sau mọi lần chạy, tiến trình nghe :9210 vẫn là cùng PID. Trong
`~/dev/onehub-invest/collector/snapshots/hanoi` có thêm 6 snapshot trong lúc verify. Cả 6 đều có tên
rơi đúng giây :53 mỗi phút (interval 60s của API đang chạy), và không có item nào chứa chuỗi đánh dấu
của eval hay probe. Worktree không phát sinh `collector/snapshots`; không còn thư mục tạm `acc-*` sót lại.

Baseline khong do:
- E1: `collector/src/api/graceful.ts` chưa tồn tại trên diffBase; typecheck cây cũ chỉ chứng cây cũ biên dịch được, không nói gì về tính năng.
- E3: `scripts/collector-shutdown/acceptance.mjs`, `collector/src/api/graceful.ts` và `pipeline/cron/com.oneinvest.collector-api.plist` chưa tồn tại trên diffBase.
- E4, E5, E7, E8, E9: `scripts/collector-shutdown/acceptance.mjs` chưa tồn tại trên diffBase (E5, E7, E8, E9 còn cần `graceful.ts`). E7, E8, E9 đã được đối chứng với mã vòng 1 như trên.
- E6: `pipeline/cron/com.oneinvest.collector-api.plist` chưa tồn tại trên diffBase.

## Variance

none — every multi-run eval is uniform (không eval nào khai runs > 1). P2 chạy hai mốc D (2000 mất tin,
20000 giữ tin), khớp đúng phép tính ceil(24/4) × 10s = 60s so với 45s deadline; không có biến thiên ngẫu nhiên.

## Iterations

Round 1: E4 failed (cấp tiêu chí). Probe P1 cho thấy lượt flush đầu khi shutdown không huỷ ảnh sát deadline: 24 ảnh treo, tin đã ack mất, tiến trình vẫn thoát mã 0. Returned to implementation.
Round 2: E1–E9 đều đạt expected của từng eval, và P1 giờ giữ được tin. Hai điểm phụ vòng 1 đã xử lý (E8: POST dở không bị cắt; E9: mất tin thì thoát mã khác 0 kèm «MẤT N tin»). E7 failed (cấp tiêu chí): probe P2 cho thấy lượt flush ĐANG chạy lúc SIGTERM (định kỳ 60s) không có deadlineAt, ảnh treo không bị huỷ, tin mất. Returned to implementation.
