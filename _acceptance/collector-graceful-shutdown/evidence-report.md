---
schema_version: 2
feature_slug: collector-graceful-shutdown
verdict: REJECT
failed_evals: [E2]
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: 29050d4aa765f3d7379fc80eb64e426a466d1474
human_signoff:
---

# Evidence Report: collector-graceful-shutdown

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-4 | script | PASS |
| E2 | AC-2 | test | FAIL (1/35 ca đỏ: ca tích hợp mới «P3: POST gửi NỬA body rồi im», ECONNRESET; đỏ chập chờn do race trong test, xem Variance) |
| E3 | AC-3 | script | PASS |
| E4 | AC-3 | script | PASS |
| E5 | AC-1 | script | PASS |
| E6 | AC-4 | script | PASS |
| E7 | AC-3 | script | PASS |
| E8 | AC-1 | script | PASS |
| E9 | AC-5 | script | PASS |
| E10 | AC-3 | script | PASS |
| E11 | AC-1 | script | PASS |

**Lý do REJECT (tóm tắt):** về sản phẩm, vòng 3 đã sửa đúng cả hai lỗi của vòng 2. P2: lượt flush định kỳ
đang tải ảnh treo giờ bị huỷ ở mốc còn 10s (E10, probe P2). P3: POST treo nửa body không còn giữ shutdown
(E11 trên main.js thật thoát sau khoảng 3s, tin A vào snapshot). Probe P1/P2/P3 đều không mất tin. Hai
probe mới (auto-flush P4, POST tới muộn P5) cũng không thấy lỗ.

Lý do trượt là **E2 không đạt expected «0 fail»**. Ca tích hợp mới mà ZCode thêm ở 306f386 («P3: POST gửi
NỬA body rồi im — shutdown không chờ close() treo…», `collector/src/test/graceful-shutdown-integration.test.ts`)
đỏ ở lượt chạy chính thức với `Error: read ECONNRESET` sau khoảng 1ms. Chạy riêng ca này trên worktree thì
đỏ 3/3 lần. Trên bản chép dist trong scratchpad thì đỏ 8/10.

Nguyên nhân là race trong chính test. Test gọi `sock.write(...)` rồi gọi handler SIGTERM ngay trong cùng
tick, khi server chưa kịp đọc và parse header. Lúc đó connection còn bị coi là RẢNH, nên `closeIdleConnections()`
cắt nó. Socket thô của test không có listener `error`, nên ECONNRESET thành lỗi không bắt và ca chết. Kiểm
trên bản chép: chỉ cần chèn `await sleep(200)` sau `sock.write` và trước SIGTERM là xanh 5/5.

Harness E11 đã có sẵn `sleep(100)` và `sock.on("error")`, nên E11 không vấp race này. Lỗi nằm ở test
(làn ZCode), không ở mã sản phẩm. Nhưng cổng đòi suite xanh, và một ca đỏ chập chờn trong `npm test` sẽ làm
đỏ CI và che lỗi thật về sau.

Sửa gợi ý (làn ZCode, qua `tin MỞ LẠI`), ở ca P3 của test:
- thêm `sock.on("error", () => {})`;
- chờ server thực sự nhận request (hook `server.once("request")`, hoặc sleep ngắn) rồi mới gọi SIGTERM.

## Evidence

- eval: E1
  run_id: collector-graceful-shutdown-E1-20261023T092016
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.collector_check
  verified_at: 2026-10-23T09:20:16Z
  output: |
    > one-invest-collector@0.1.0 check
    > tsc -p tsconfig.json --noEmit
    (không có dòng lỗi nào; tsc im lặng = biên dịch sạch)

- eval: E2
  run_id: collector-graceful-shutdown-E2-20261023T092024
  exit_code: 1
  baseline: red
  verifier: config:executors.test.collector
  verified_at: 2026-10-23T09:20:24Z
  output: |
    ✔ SIGTERM giữa lúc flush chậm + POST giữa chừng → cả hai tin vào snapshot (67.076042ms)
    ✔ deadline huỷ tải ảnh treo giữa chừng — tin vẫn vào snapshot, không chờ ảnh (claudedp-2310-3) (2035.686ms)
    ✔ P2: SIGTERM tới khi lượt flush ĐỊNH KỲ (không deadline) đang tải ảnh treo — vẫn phải huỷ được (claudedp-2310-3 vòng 3) (3538.958875ms)
    ✖ P3: POST gửi NỬA body rồi im — shutdown không chờ close() treo, buffer vẫn được flush (claudedp-2310-3 vòng 3) (1.305041ms)
    ...
    ℹ tests 35 · pass 34 · fail 1 · cancelled 0 · skipped 0 · todo 0 · duration_ms 45097.902083
    ✖ failing tests:
    test at dist/test/graceful-shutdown-integration.test.js:211:1
      Error: read ECONNRESET
          at TCP.onStreamRead (node:internal/stream_base_commons:216:20) { errno: -54, code: 'ECONNRESET', syscall: 'read' }
  note: |
    Hai ca tích hợp mà expected gọi tên đều xanh: «SIGTERM giữa lúc flush chậm + POST giữa chừng» và ca host
    ảnh treo vĩnh viễn («deadline huỷ tải ảnh treo giữa chừng»). Ca mới P2 cũng xanh. Ca mới P3 đỏ, nên
    expected «0 fail» không đạt và E2 FAIL. Tái hiện:
    `cd collector && node --test --test-name-pattern=P3 dist/test/graceful-shutdown-integration.test.js`
    (đỏ 3/3 trên worktree). Nguyên nhân và số liệu có/không chèn chờ: xem đầu báo cáo, mục Variance và
    `evidence/probes-round3.txt`. Node v24.21.0.

- eval: E3
  run_id: collector-graceful-shutdown-E3-20261023T092017
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.shutdown_deadline
  verified_at: 2026-10-23T09:20:17Z
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
  run_id: collector-graceful-shutdown-E4-20261023T092327
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.shutdown_skip_media
  verified_at: 2026-10-23T09:23:27Z
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
  run_id: collector-graceful-shutdown-E5-20261023T092327
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.shutdown_process
  verified_at: 2026-10-23T09:23:27Z
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

- eval: E6
  run_id: collector-graceful-shutdown-E6-20261023T092017
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.collector_plist_lint
  verified_at: 2026-10-23T09:20:17Z
  output: |
    pipeline/cron/com.oneinvest.collector-api.plist: OK

- eval: E7
  run_id: collector-graceful-shutdown-E7-20261023T092405
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.shutdown_hang_default
  verified_at: 2026-10-23T09:24:05Z
  output: |
    24 ảnh treo, deadline mặc định: mã thoát 0 sau 35005ms · snapshot 1 · buffer còn 0 · gọi host ảnh 16
      log: 0ms shutdown: SIGTERM — đóng HTTP, flush buffer rồi thoát (tối đa 45000ms)
      log: 35005ms shutdown: flushed hanoi__zalo-agent__2026-10-23T092406310
      log: 35005ms shutdown: flush xong — thoát
    ok   tin ack 202
    ok   exit 0 (không mất tin)
    ok   tin đã ack có trong snapshot
    ok   buffer rỗng lúc thoát
    ok   thoát trước deadline 45s (ảnh treo bị huỷ, không chạy tới mốc deadline)
    ok   should-NOT-fire: không có dòng 'flush quá deadline'
    HANG-DEFAULT PASS

- eval: E8
  run_id: collector-graceful-shutdown-E8-20261023T092343
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.shutdown_inflight
  verified_at: 2026-10-23T09:23:43Z
  output: |
    POST dở lúc SIGTERM: trả 202 · connection mới sau SIGTERM: ECONNREFUSED · mã thoát 0, signal null · snapshot 1
    ok   POST đang dở được làm nốt và ack 202 (không bị cắt)
    ok   should-NOT-fire: connection mới sau SIGTERM bị từ chối
    ok   tiến trình tự exit(0)
    ok   tin của POST dở có trong snapshot
    INFLIGHT PASS

- eval: E9
  run_id: collector-graceful-shutdown-E9-20261023T092441
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.shutdown_lost_exit
  verified_at: 2026-10-23T09:24:41Z
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

- eval: E10
  run_id: collector-graceful-shutdown-E10-20261023T092549
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.shutdown_periodic_hang
  verified_at: 2026-10-23T09:25:49Z
  output: |
    SIGTERM 2s sau khi lượt định kỳ bắt đầu, 24 ảnh treo: mã thoát 0 sau 35010ms · snapshot 1 · buffer còn 0 · gọi host ảnh 16
      log: 1ms shutdown: SIGTERM — đóng HTTP, flush buffer rồi thoát (tối đa 45000ms)
      log: 35010ms shutdown: flushed hanoi__zalo-agent__2026-10-23T092550178
      log: 35010ms shutdown: flush xong — thoát
    ok   exit 0 (không mất tin)
    ok   tin đã ack có trong snapshot
    ok   buffer rỗng lúc thoát
    ok   thoát trước deadline 45s — ảnh của lượt ĐANG CHẠY bị huỷ
    ok   should-NOT-fire: không có dòng 'quá deadline' hay 'MẤT'
    PERIODIC-HANG PASS
  note: |
    Host ảnh bị gọi 16 lần (bốn đợt × 4) rồi dừng: ảnh của lượt định kỳ bị huỷ ở giây 35 sau SIGTERM (còn 10s).
    Cùng harness trên mã vòng 2 dfaa45b ra PERIODIC-HANG FAIL (5 mục; xem Analyst).

- eval: E11
  run_id: collector-graceful-shutdown-E11-20261023T092627
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.shutdown_stalled_post
  verified_at: 2026-10-23T09:26:27Z
  output: |
    tin A ack 202, POST B treo nửa body: mã thoát 0, signal null sau 3004ms · snapshot 1
      log: shutdown: SIGTERM — đóng HTTP, flush buffer rồi thoát (tối đa 45000ms)
      log: shutdown: flushed hanoi__zalo-agent__2026-10-23T092630928
      log: shutdown: flush xong — thoát
    ok   tin A được ack 202 trước SIGTERM
    ok   tiến trình tự exit(0)
    ok   tin A có trong snapshot dù còn POST treo
    ok   thoát sau < 10s — không chờ POST treo tới deadline 45s
    ok   should-NOT-fire: không có dòng 'MẤT' hay 'quá deadline'
    STALLED-POST PASS
  note: |
    Chạy trên main.js THẬT (bản chép dist, cổng ngẫu nhiên, key giả). Thoát ở mốc race 3s của close().
    Lệnh tốn 60s tường vì timer `sleep(60_000)` của harness còn giữ event loop sau khi race xong; đó là
    chuyện của harness. Cùng harness trên dfaa45b ra STALLED-POST FAIL (4 mục).

## Known limits

- E10 chạy trong tiến trình harness, không chạy trên main.js thật. Harness dùng createAgentServer và installGracefulShutdown thật, còn tín hiệu và exit là giả, và không có `close()`. Lý do: allowlist ảnh của main.js cố định `zdn.vn`, không có env để ghi đè, nên không trỏ được vào host treo cục bộ. Vì vậy chuyện «ca P2 khi có race close 3s đứng trước» chỉ được thấy ở probe P4/P5: harness nối dây y như main.ts, gồm cả close race 3s, nhưng vẫn không phải main.js.
- Ca tích hợp P3 trong E2 (đang đỏ) chép tay thân `close()` của main.ts vào test. ZCode tự ghi đó chỉ là đặc tả, nên nó không chứng main.ts. Bằng chứng P3 cho main.js thật là E11 và probe P3 (stall, ka, reuse).
- AC-2 vẫn chỉ được chứng bằng ca tích hợp trong E2, với tín hiệu và exit giả. Trong ca đó, «POST giữa chừng» là lời gọi thẳng `s.ingest()`, không qua HTTP. Probe P5 (verifier, harness) phủ thêm ca POST qua HTTP thật hoàn tất giữa lúc flush dài: B được 202 và vào snapshot lượt thứ hai.
- AC-1 «đóng HTTP trước khi flush»: dòng log «đóng HTTP…» được in TRƯỚC khi gọi `close()`. Từ vòng 3, `close()` chỉ chờ tối đa 3s rồi flush luôn, nên flush CÓ THỂ chạy khi request cũ chưa xong. Đây là chủ ý của sửa P3. Vòng lặp flush gom các tin tới muộn (P5).
- AC-3 «tín hiệu lần 2 thoát ngay» và AC-5 chỉ có test đơn vị và harness với flush giả (E2, E9). E3 là kiểm tĩnh: regex trên hằng số trong `graceful.ts` và `plutil -extract` plist. E3 không đọc hằng `MEDIA_CUTOFF_MS` thứ hai, khai riêng trong `server.ts` (hằng mà sửa P2 thực sự dùng).
- AC-4: `plutil -lint` chỉ kiểm cú pháp. Plist còn placeholder `__ROOT__` và chưa từng được launchd nạp. Hai hành vi thật của launchd không được đo: SIGTERM rồi SIGKILL sau `ExitTimeOut` 60, và cách KeepAlive xử lý mã thoát khác 0.
- E5, E8, E11 và probe P3 chạy bản chép `collector/dist` trong thư mục tạm, `node_modules` là symlink. Mã giống runtime thật, nhưng đường dẫn snapshot và state khác.
- run-log vòng 3 có ba dòng hỏng do verifier gọi sai: evalId «E4 skip-media», «E5 process», «E8 inflight», mã thoát 2, lệnh thiếu tên mode. Nguyên nhân là zsh không tách từ biến trong vòng lặp của verifier. Harness chỉ in dòng «dùng: …» rồi thoát, không chạy eval nào. Ba eval được chạy lại đúng ngay sau đó (run_id 092327/092343). Ba dòng hỏng được giữ nguyên vì luật chỉ-nối-thêm của log.

## Ngoài hợp đồng

- **[Lỗi test, là lý do REJECT]** Ca «P3: POST gửi NỬA body rồi im» trong `graceful-shutdown-integration.test.ts` có race: SIGTERM tới khi server chưa parse header. Chi tiết, cách tái hiện và hướng sửa ở đầu báo cáo. Làn ZCode.
- **[Rủi ro, gần AC-1; ghi chú trong mã sai]** Chú thích ở `main.ts` dòng 58–61 viết «request dở không được ack, agent tự retry». Quyết định d-20261023T091705Z-3 cũng ghi «client … phải tự gửi lại». Nhưng hook thật `collector/openclaw/handler.js` (dòng 109–134, chỉ đọc, không chạy) không retry: POST lỗi chỉ ghi `post-error …` vào log rồi bỏ tin. Như vậy có hai loại tin mất phía client. Cả hai đều CHƯA được ack 202, nên không phạm AC-1/AC-5, nhưng vẫn là mất dữ liệu nguồn:
  - POST còn dở ở mốc bỏ chờ 3s mà vòng flush xong trước khi nó hoàn tất;
  - connection đã gửi header nhưng server chưa parse lúc SIGTERM. `closeIdleConnections()` coi connection đó là rảnh và cắt (đúng cơ chế làm đỏ E2).

  Thực tế rủi ro thấp: hook gửi trọn body nhỏ một lần, chỉ mất vài ms, nên ca nửa body treo gần như chỉ có ở client hỏng. Nhưng cửa sổ restart vẫn làm rơi tin: trong lúc API tắt, mọi POST của hook bị ECONNREFUSED và mất. Khi chuyển sang launchd, mỗi lần restart sẽ mở cửa sổ này. Hướng gợi ý: hook retry có backoff, hoặc spool ra đĩa. Việc này thuộc làn ZCode; hợp đồng đã ghi «Hành vi thu của OpenClaw — không đổi».
- **[Nợ nhỏ]** `MEDIA_CUTOFF_MS = 10_000` được khai hai lần: export ở `graceful.ts` và hằng riêng ở `server.ts` dòng 66. E3 chỉ kiểm bản ở `graceful.ts`. Nếu một bên bị đổi mà bên kia không, ngưỡng skipMedia và ngưỡng huỷ ảnh sẽ lệch nhau mà không eval nào đỏ.
- **[Không phải lỗi, đã kiểm]** Timer abort do caller muộn gắn vào trong nhánh single-flight (`server.ts` dòng 243–249) không được clear khi lượt xong. Timer đã `unref`, nên không giữ tiến trình. Nó bắt AbortController CỤ THỂ của lượt đó (biến cục bộ `ac`), nên khi bắn muộn chỉ abort một controller đã hết dùng, không huỷ nhầm lượt sau. Mỗi lần shutdown có tối đa một timer như vậy. Không rò đáng kể.
- **[Không phải lỗi, đã đo]** Auto-flush (buffer ≥ flushAfterItems, `handle()` gọi `await flush()` không tham số) không còn kẹt. Probe P4: POST kích auto-flush với 24 ảnh treo, SIGTERM 2s sau. Kết quả: close bỏ chờ ở 3s, shutdown nhập vào lượt đang chạy và gắn abort, ảnh bị huỷ ở giây 35, tin vào snapshot, POST kích nhận 202, thoát mã 0.
- **[Đường mất-tin-mà-exit-0: không tìm thấy]** `finish()` luôn đọc `pendingCount()` (= `buffer.length`). Buffer chỉ được lọc SAU `writer.finalize`, nên tin đã ack mà chưa ghi thì luôn còn đếm. Mọi đường thoát đều đi qua kiểm này: deadline, tín hiệu lần 2, flush lỗi, flush xong. Giữa lần flush cuối trả null và `process.exit` không có await nào nhường event loop, nên không có POST nào chen vào được. P5 xác nhận: tin tới muộn được vòng lặp gom ở lượt thứ hai.
- Harness `scripts/collector-shutdown/acceptance.mjs` để timer `sleep(15_000)` (process, inflight), deadline 60s (lost-exit) và `sleep(60_000)` (stalled-post) treo event loop sau khi race đã xong. Vì vậy E5, E8 tốn 16s, còn E9, E11 tốn 60–61s tường, dù shutdown thật chỉ vài ms (E11 khoảng 3s).
- Trong thư mục tạm của hệ có 4 thư mục `acc-zc3-*` tạo lúc 09:07Z, trước phiên verify này (bắt đầu 09:20Z). Verifier không tạo, cũng không xoá chúng.

## Analyst

Non-discriminating evals: none. E2 là eval duy nhất đo được trên diffBase; vòng 2 đã đo nó red trên
diffBase cba11e4 (19/19 xanh nhưng 0 ca graceful-shutdown), vòng này không đo lại. E10 và E11, hai eval
mới của vòng 3, cũng red trên mã vòng 2 (đối chứng ngoài baseline, xem dưới). E1 (`tsc --noEmit`) về bản
chất là guard hồi quy nên không xếp.

Đối chứng với mã vòng 2 (không phải baseline diffBase): worktree tạm detached tại dfaa45b trong scratchpad,
ngoài repo. Đã chép `scripts/collector-shutdown/acceptance.mjs` của HEAD vào, chạy `npm ci` (4 gói) và build
collector ở đó (2026-10-23T09:32:35Z). Kết quả:
- periodic-hang ra PERIODIC-HANG FAIL (5 mục): thoát mã khác 0 sau 45001ms, snapshot 0, buffer còn 1, gọi
  host ảnh 20, có «flush quá deadline» và «MẤT 1 tin».
- stalled-post ra STALLED-POST FAIL (4 mục): thoát mã khác 0 sau 45006ms, snapshot 0, «MẤT 1 tin».

Cả hai eval mới phân biệt được mã vòng 2 với mã vòng 3. Worktree tạm đã gỡ bằng `git worktree remove --force`
rồi `git worktree prune`.

Probe chạy lại theo yêu cầu (collector build từ 29050d4; số liệu nguyên văn ở `evidence/probes-round3.txt`):

P1 — `node _acceptance/collector-graceful-shutdown/evidence/P1-deadline-probe.mjs $PWD 24` (09:27:49Z)

    ack=202 images=24 · exit sau 35004ms · code 0 · snapshot hoàn tất 1 · buffered 0 · gọi host ảnh 16
      log: 0ms shutdown: SIGTERM — đóng HTTP, flush buffer rồi thoát (tối đa 45000ms)
      log: 35003ms shutdown: flushed hanoi__zalo-agent__2026-10-23T092749746
      log: 35003ms shutdown: flush xong — thoát

Đạt: snapshot 1, buffered 0, không mất tin.

P2 — `node _acceptance/collector-graceful-shutdown/evidence/P2-inflight-periodic-probe.mjs $PWD 24 2000` (09:28:29Z)

    N=24 D=2000ms: ack=202 · SIGTERM sau 2004ms kể từ lúc lượt định kỳ bắt đầu · thoát sau 35007ms kể từ SIGTERM · mã 0 · snapshot hoàn tất 1 · buffered 0 · gọi host ảnh 16
      log: 0ms shutdown: SIGTERM — đóng HTTP, flush buffer rồi thoát (tối đa 45000ms)
      log: 35007ms shutdown: flushed hanoi__zalo-agent__2026-10-23T092829054
      log: 35007ms shutdown: flush xong — thoát
    Đối chứng D=20000: N=24 D=20000ms: ack=202 · SIGTERM sau 20005ms kể từ lúc lượt định kỳ bắt đầu · thoát sau 35004ms kể từ SIGTERM · mã 0 · snapshot hoàn tất 1 · buffered 0 · gọi host ảnh 24

Đạt: snapshot 1, buffered 0, không mất tin. Vòng 2, cùng lệnh: snapshot 0, buffered 1, «MẤT 1 tin».
Ở đối chứng D=20000, lượt định kỳ lẽ ra tự xong ở giây 60 (40s sau SIGTERM), nhưng giờ bị huỷ ảnh ở mốc
35s sau SIGTERM. Abort đến đúng lượt đang chạy.

P3 — `node _acceptance/collector-graceful-shutdown/evidence/P3-stalled-post-probe.mjs $PWD <stall|ka|reuse>` (main.js thật, 09:30:08Z–09:30:15Z)

    stall: tin A trả 202 trước SIGTERM · POST treo (nửa body) · thoát sau 3010ms kể từ SIGTERM · mã 0 signal null · snapshot 1
    ka: POST keep-alive dở lúc SIGTERM trả 202 (header connection: keep-alive) sau 313ms · socket server đóng chưa · thoát sau 3013ms kể từ SIGTERM · mã 0 signal null · snapshot 1
    reuse: POST 1 (dở lúc SIGTERM) trả 202 · POST 2 trên cùng socket, 1,3s sau SIGTERM, trả 202 · thoát sau 3011ms kể từ SIGTERM · mã 0 signal null · snapshot 1

Đạt: không mất tin trong cả ba mode. Vòng 2 stall: thoát sau 45009ms, mã khác 0, «MẤT 1 tin», snapshot 0.
Ka và reuse giờ thoát ở mốc 3s thay vì 6–7s, vì socket keep-alive còn mở không còn giữ shutdown.

Probe mới của verifier (harness, nối dây như main.ts kèm close race 3s): P4 auto-flush và P5 POST hoàn tất
sau mốc bỏ chờ. Số liệu ở «Ngoài hợp đồng» và `evidence/probes-round3.txt`; tệp probe nằm ở
`evidence/P4-autoflush-probe.mjs` và `evidence/P5-late-post-probe.mjs`. Không probe nào tìm thấy tin đã ack bị mất.

Không đụng runtime thật: trước, trong và sau mọi lần chạy, tiến trình nghe :9210 vẫn là PID 63069. Trong
`~/dev/onehub-invest/collector/snapshots/hanoi` có thêm 12 snapshot `zalo-agent` từ 09:20Z. Cả 12 đều có tên
rơi đúng giây :53 mỗi phút (interval 60s của API đang chạy), và không item nào chứa chuỗi đánh dấu của eval
hay probe (đã grep gzcat). Worktree không phát sinh `collector/snapshots`. Thay đổi trong repo chỉ có
`run-log.jsonl`, báo cáo này, `evidence/probes-round3.txt` và hai tệp probe P4/P5, cộng `collector/dist` do build.

Baseline khong do:
- E1: `collector/src/api/graceful.ts` chưa tồn tại trên diffBase; typecheck cây cũ không nói gì về tính năng.
- E3: `scripts/collector-shutdown/acceptance.mjs`, `collector/src/api/graceful.ts` và plist chưa tồn tại trên diffBase.
- E4, E5, E7, E8, E9, E10, E11: `scripts/collector-shutdown/acceptance.mjs` chưa tồn tại trên diffBase. E10 và E11 đã được đối chứng với mã vòng 2 (dfaa45b) như trên; E7, E8, E9 đã đối chứng với mã vòng 1 ở vòng 2.
- E6: `pipeline/cron/com.oneinvest.collector-api.plist` chưa tồn tại trên diffBase.

## Variance

E2 — flaky. Eval tất định (không khai runs) nhưng cho kết quả khác nhau giữa các lần chạy. Ca tích hợp «P3:
POST gửi NỬA body rồi im» cho:
- worktree: đỏ 4/4, gồm lượt `npm test` chính thức và 3 lần chạy riêng ca;
- bản chép dist trong scratchpad, test nguyên văn: xanh 2/10, đỏ 8/10;
- bản chép có chèn `await sleep(200)` giữa `sock.write` và SIGTERM: xanh 5/5.

Gốc là race thời gian giữa lúc client ghi request và lúc server parse header, không phải hành vi sản phẩm
ngẫu nhiên. Sửa ở test (xem đầu báo cáo).

## Iterations

Round 1: E4 failed (cấp tiêu chí). Probe P1 cho thấy lượt flush đầu khi shutdown không huỷ ảnh sát deadline; tin đã ack mất mà vẫn thoát mã 0. Returned to implementation.
Round 2: E7 failed (cấp tiêu chí). Lượt flush định kỳ đang chạy lúc SIGTERM không nhận deadlineAt, ảnh treo không bị huỷ, tin mất (P2). Thêm rủi ro: POST treo nửa body giữ close() tới deadline và làm mất cả buffer (P3). Returned to implementation.
Round 3: sản phẩm sửa đúng P2 (flushAbort) và P3 (race close 3s). E1, E3–E11 đạt; P1/P2/P3 cùng hai probe mới P4/P5 đều không mất tin. E2 failed vì ca tích hợp mới «P3» trong test có race (SIGTERM trước khi server parse header, socket thô thiếu listener error), đỏ chập chờn khoảng 80–100%. Returned to implementation (sửa test, làn ZCode). Đã hết 3 vòng, cần escalate tới user.
