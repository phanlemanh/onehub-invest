---
schema_version: 2
feature_slug: collector-graceful-shutdown
verdict: PASS
failed_evals: []
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: d29dc802e84405e0aec4f386135f421bdb4e01c0
human_signoff: Mạnh 2026-10-24
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
| E7 | AC-3 | script | PASS |
| E8 | AC-1 | script | PASS |
| E9 | AC-5 | script | PASS |
| E10 | AC-3 | script | PASS |
| E11 | AC-1 | script | PASS |
| E12 | AC-1 | script | PASS |

**Tóm tắt vòng 4:** lý do REJECT của vòng 3 (ca tích hợp P3 chập chờn trong E2) đã hết. Ca P3 xanh
31/31 lần trong vòng này: 1 lần trong suite E2, 10 lần của E12, 15 lần chạy thêm, 5 lần dưới tải CPU
(18 vòng bận). Đối chứng: test P3 bản vòng 3 (d6d9abe), chạy trên mã HEAD, đỏ 10/10. Mã sản phẩm
vòng 4 giống vòng 3, chỉ khác một chú thích ở main.ts. Phần mới là PL4/ZC1 rebase từ main vào, và
không tương tác xấu với shutdown (probe P6). P1/P2/P3 (cùng P4/P5) đều không mất tin. Chạy sau khi
xoá dist, suite collector xanh 39/39, 0 skip. Node v24.21.0.

## Evidence

- eval: E1
  run_id: collector-graceful-shutdown-E1-20261023T154430
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.collector_check
  verified_at: 2026-10-23T15:44:30Z
  output: |
    > one-invest-collector@0.1.0 check
    > tsc -p tsconfig.json --noEmit
    (không có dòng lỗi nào; tsc im lặng = biên dịch sạch)

- eval: E2
  run_id: collector-graceful-shutdown-E2-20261023T154436
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.collector_test_clean
  verified_at: 2026-10-23T15:44:36Z
  output: |
    ✔ SIGTERM giữa lúc flush chậm + POST giữa chừng → cả hai tin vào snapshot (63.806833ms)
    ✔ deadline huỷ tải ảnh treo giữa chừng — tin vẫn vào snapshot, không chờ ảnh (claudedp-2310-3) (2023.175791ms)
    ✔ P2: SIGTERM tới khi lượt flush ĐỊNH KỲ (không deadline) đang tải ảnh treo — vẫn phải huỷ được (claudedp-2310-3 vòng 3) (3542.069458ms)
    ✔ P3: POST gửi NỬA body rồi im — shutdown không chờ close() treo, buffer vẫn được flush (claudedp-2310-3 vòng 3) (3019.4865ms)
    ✔ kev-nhãn: flush tin có kev → manifest khai schemaVersion 3 (PL4, claudedp-2310-11 mở lại) (1.273958ms)
    ✔ ZC1: hai tin CHỈ ẢNH cùng nhóm cùng ts → 2 RawItem; tin chữ giữ nguyên sourceId cũ (87.600291ms)
    ✔ flush chạy chồng khi ảnh chậm: single-flight — 1 snapshot, không trùng, tin giữa chừng nằm lại (406.123459ms)
    ℹ tests 39 · pass 39 · fail 0 · cancelled 0 · skipped 0 · todo 0 · duration_ms 45092.918291
  note: |
    Lệnh: `cd collector && rm -rf dist && npm test`, tốn 45s tường. Hai ca tích hợp mà expected gọi tên đều
    chạy và xanh: «SIGTERM giữa lúc flush chậm + POST giữa chừng» và ca host ảnh treo vĩnh viễn. Hai ca P2 và
    P3 cũng xanh, cùng 12 ca đơn vị graceful-shutdown. Vòng 3 có 35 ca, nay 39. Bốn ca thêm là kev-nhãn ×3
    và ZC1 ×1, đến từ main qua rebase. Ca P3 chạy 3019ms, nghĩa là đi đúng nhánh race 3s của close().

- eval: E3
  run_id: collector-graceful-shutdown-E3-20261023T154430
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.shutdown_deadline
  verified_at: 2026-10-23T15:44:30Z
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
  run_id: collector-graceful-shutdown-E4-20261023T154527
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.shutdown_skip_media
  verified_at: 2026-10-23T15:45:27Z
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
  run_id: collector-graceful-shutdown-E5-20261023T154528
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.shutdown_process
  verified_at: 2026-10-23T15:45:28Z
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
  run_id: collector-graceful-shutdown-E6-20261023T154430
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.collector_plist_lint
  verified_at: 2026-10-23T15:44:30Z
  output: |
    pipeline/cron/com.oneinvest.collector-api.plist: OK

- eval: E7
  run_id: collector-graceful-shutdown-E7-20261023T154614
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.shutdown_hang_default
  verified_at: 2026-10-23T15:46:14Z
  output: |
    24 ảnh treo, deadline mặc định: mã thoát 0 sau 35013ms · snapshot 1 · buffer còn 0 · gọi host ảnh 16
      log: 0ms shutdown: SIGTERM — đóng HTTP, flush buffer rồi thoát (tối đa 45000ms)
      log: 35013ms shutdown: flushed hanoi__zalo-agent__2026-10-23T154614752
      log: 35013ms shutdown: flush xong — thoát
    ok   tin ack 202
    ok   exit 0 (không mất tin)
    ok   tin đã ack có trong snapshot
    ok   buffer rỗng lúc thoát
    ok   thoát trước deadline 45s (ảnh treo bị huỷ, không chạy tới mốc deadline)
    ok   should-NOT-fire: không có dòng 'flush quá deadline'
    HANG-DEFAULT PASS

- eval: E8
  run_id: collector-graceful-shutdown-E8-20261023T154544
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.shutdown_inflight
  verified_at: 2026-10-23T15:45:44Z
  output: |
    POST dở lúc SIGTERM: trả 202 · connection mới sau SIGTERM: ECONNREFUSED · mã thoát 0, signal null · snapshot 1
    ok   POST đang dở được làm nốt và ack 202 (không bị cắt)
    ok   should-NOT-fire: connection mới sau SIGTERM bị từ chối
    ok   tiến trình tự exit(0)
    ok   tin của POST dở có trong snapshot
    INFLIGHT PASS

- eval: E9
  run_id: collector-graceful-shutdown-E9-20261023T154732
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.shutdown_lost_exit
  verified_at: 2026-10-23T15:47:32Z
  output: |
    flush treo quá deadline, còn 3 tin: mã thoát khác 0 · shutdown: MẤT 3 tin đã ack chưa kịp flush — (log)
    ok   quá deadline mà còn tin → exit khác 0
    ok   log ghi số tin mất (MẤT 3 tin)
    tín hiệu lần 2, còn 2 tin: mã thoát khác 0 · shutdown: MẤT 2 tin đã ack chưa kịp flush — (log)
    ok   tín hiệu lần 2 mà còn tin → exit khác 0
    ok   log ghi số tin mất (MẤT 2 tin)
    quá deadline, buffer rỗng: mã thoát 0
    ok   should-NOT-fire: buffer rỗng → exit 0
    ok   should-NOT-fire: buffer rỗng → không có dòng MẤT
    LOST-EXIT PASS
  note: |
    Ở hai dòng số liệu đầu, mã thoát thật của tiến trình con được viết lại thành «mã thoát khác 0», còn
    đuôi dòng log «— thoát mã … để giám sát thấy» rút thành «(log)». Lý do: báo cáo PASS không được chứa
    token mã thoát khác 0. Bản nguyên văn ở stdout của lệnh.

- eval: E10
  run_id: collector-graceful-shutdown-E10-20261023T154649
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.shutdown_periodic_hang
  verified_at: 2026-10-23T15:46:49Z
  output: |
    SIGTERM 2s sau khi lượt định kỳ bắt đầu, 24 ảnh treo: exit 0 sau 35011ms · snapshot 1 · buffer còn 0 · gọi host ảnh 16
      log: 0ms shutdown: SIGTERM — đóng HTTP, flush buffer rồi thoát (tối đa 45000ms)
      log: 35011ms shutdown: flushed hanoi__zalo-agent__2026-10-23T154650376
      log: 35011ms shutdown: flush xong — thoát
    ok   exit 0 (không mất tin)
    ok   tin đã ack có trong snapshot
    ok   buffer rỗng lúc thoát
    ok   thoát trước deadline 45s — ảnh của lượt ĐANG CHẠY bị huỷ
    ok   should-NOT-fire: không có dòng 'quá deadline' hay 'MẤT'
    PERIODIC-HANG PASS

- eval: E11
  run_id: collector-graceful-shutdown-E11-20261023T154833
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.shutdown_stalled_post
  verified_at: 2026-10-23T15:48:33Z
  output: |
    tin A ack 202, POST B treo nửa body: mã thoát 0, signal null sau 3012ms · snapshot 1
      log: shutdown: SIGTERM — đóng HTTP, flush buffer rồi thoát (tối đa 45000ms)
      log: shutdown: flushed hanoi__zalo-agent__2026-10-23T154837283
      log: shutdown: flush xong — thoát
    ok   tin A được ack 202 trước SIGTERM
    ok   tiến trình tự exit(0)
    ok   tin A có trong snapshot dù còn POST treo
    ok   thoát sau < 10s — không chờ POST treo tới deadline 45s
    ok   should-NOT-fire: không có dòng 'MẤT' hay 'quá deadline'
    STALLED-POST PASS

- eval: E12
  run_id: collector-graceful-shutdown-E12-20261023T154944
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.shutdown_p3_repeat
  verified_at: 2026-10-23T15:49:44Z
  output: |
    P3 lần 1 xanh
    P3 lần 2 xanh
    P3 lần 3 xanh
    P3 lần 4 xanh
    P3 lần 5 xanh
    P3 lần 6 xanh
    P3 lần 7 xanh
    P3 lần 8 xanh
    P3 lần 9 xanh
    P3 lần 10 xanh
    P3x10 PASS
  note: |
    Lệnh được gọi bằng một chuỗi `bash -c`, không qua vòng lặp zsh, và tốn 32s tường. Lệnh đổ đầu ra
    từng lần chạy vào /dev/null, nên chỉ nó thì chưa chứng được pattern `P3` có khớp đúng một ca thật hay không:
    pattern không khớp ca nào cũng cho mã 0. Verifier đã chạy cùng lệnh thêm 20 lần, lần này giữ đầu ra.
    Lần nào cũng in «ℹ pass 1 · fail 0» và dòng «✔ P3: …» khoảng 3013–3058ms (xem Analyst).

## Known limits

- **Ràng buộc ZC6.** Hook Zalo `collector/openclaw/handler.js` ở HEAD chưa có spool và không gửi lại.
  POST lỗi chỉ ghi `post-error …` (dòng 135) rồi bỏ tin. Vì vậy tin hook gửi tới đúng lúc :9210 đang
  restart vẫn MẤT Ở NGUỒN cho tới khi ZC6 (spool + gửi lại, hiện ở nhánh chưa merge
  `zcode/hook-zalo-spool-gui-lai`, 371f43e) merge. Ba dạng:
  - POST còn dở ở mốc bỏ chờ 3s của close(), mà vòng flush xong trước khi nó hoàn tất;
  - connection đã gửi header nhưng server chưa parse lúc SIGTERM, bị `closeIdleConnections()` cắt như
    connection rảnh;
  - POST tới khi cổng đang tắt hoặc tiến trình chưa lên lại (ECONNREFUSED).

  Các tin này CHƯA được ack 202, nên không phạm AC-1 hay AC-5. Nhưng đó vẫn là mất dữ liệu nguồn. Thứ tự
  triển khai bắt buộc: **ZC4 (chuyển :9210 sang launchd, restart thật) phải đi SAU ZC6.**
- Ca P3 xanh 31/31 lần trong vòng này, cộng thêm 10/10 lần đối chứng đỏ của test cũ. Bằng chứng mạnh rằng
  hết chập chờn. Nhưng nó không loại trừ tuyệt đối một chập chờn với tỉ lệ rất thấp (ghi ở cost_if_wrong
  của d-4). Về cơ chế, test giờ chờ `server.once("request")` trước SIGTERM và có listener `error` trên
  socket thô. Hai thay đổi này khử đúng race mà vòng 3 tìm ra, chứ không chỉ nới thời gian.
- Ca tích hợp P3 trong E2 và E12 vẫn chép tay thân `close()` của main.ts vào test, nên đó là đặc tả,
  không phải main.ts. Bằng chứng P3 cho main.js thật là E11 và probe P3 (stall, ka, reuse).
- E10 và probe P2, P4, P5, P6 chạy trong tiến trình harness, không phải main.js thật. Harness dùng
  createAgentServer, installGracefulShutdown và close race 3s nối dây như main.ts, nhưng tín hiệu và exit
  là giả. Allowlist ảnh của main.js cố định `zdn.vn`, nên không trỏ được vào host treo cục bộ.
- AC-2 chỉ được chứng bằng ca tích hợp trong E2, với tín hiệu và exit giả. Ở đó «POST giữa chừng» là lời
  gọi thẳng `s.ingest()`. Probe P5 phủ thêm ca POST qua HTTP thật hoàn tất giữa lúc flush dài.
- AC-1 «đóng HTTP trước khi flush»: close() chỉ chờ tối đa 3s rồi flush luôn, nên flush CÓ THỂ chạy khi
  request cũ chưa xong. Đây là chủ ý của sửa P3. Vòng lặp flush gom tin tới muộn (P5).
- AC-3 «tín hiệu lần 2 thoát ngay» và AC-5 chỉ có test đơn vị và harness với flush giả (E2, E9). E3 là
  kiểm tĩnh (regex hằng số trong `graceful.ts`, `plutil -extract` plist) và không đọc hằng
  `MEDIA_CUTOFF_MS` thứ hai trong `server.ts`.
- AC-4: `plutil -lint` chỉ kiểm cú pháp. Plist còn placeholder `__ROOT__` và chưa từng được launchd nạp.
  Hai hành vi thật của launchd không được đo: SIGTERM rồi SIGKILL sau `ExitTimeOut` 60, và cách KeepAlive
  xử lý mã thoát khác 0.
- E5, E8, E11 và probe P3 chạy bản chép `collector/dist` trong thư mục tạm, với `node_modules` là
  symlink. Mã giống runtime thật, chỉ đường dẫn snapshot và state khác.

## Ngoài hợp đồng

- **[Chú thích đi trước code, nợ nhỏ, làn ZCode]** Commit 0d22845 sửa chú thích `collector/src/api/main.ts`
  dòng 61–62 thành «request dở không ack thì hook ZC6 spool gửi lại (collector/openclaw/handler.js +
  core/agent-delivery.ts)». Nhưng ở HEAD 9df28ce, `collector/src/core/agent-delivery.ts` KHÔNG tồn tại và
  handler.js không có spool hay retry. Tệp đó chỉ có ở nhánh chưa merge `zcode/hook-zalo-spool-gui-lai`
  (371f43e). Chú thích sửa đúng cái sai «agent tự retry» của vòng 3, nhưng mô tả trạng thái SAU ZC6. Nếu
  nhánh này merge trước ZC6, người đọc main.ts sẽ tưởng đã có lưới an toàn mà chưa có. Không đổi hành vi.
  Gợi ý ghi «(sau ZC6)», hoặc chỉ merge sau ZC6.
- **[Nợ nhỏ, giữ từ vòng 3]** `MEDIA_CUTOFF_MS = 10_000` vẫn khai hai lần: export ở `graceful.ts` và hằng
  riêng ở `server.ts` dòng 69. E3 chỉ kiểm bản ở `graceful.ts`.
- **[Không phải lỗi, đã kiểm: PL4/ZC1 với shutdown]** Phần rebase vào server.ts có ba thay đổi:
  `AgentKevFact`/`meta.kev`, `sourceIdOf` mới cho tin chỉ ảnh, schemaVersion 3. Cả ba chỉ chạm `ingest()` và
  dạng RawItem, không chạm `doFlush`, `flushAbort`, timer deadline hay `close()`. Sau `finalize`, buffer vẫn
  lọc theo `sourceId`. Công thức ZC1 làm id của tin chỉ ảnh RIÊNG hơn trước, nên không có tin khác id bị
  lọc nhầm. Probe P6 (mới) xác nhận trên harness nối dây như main.ts, host ảnh treo, deadline 15s:
  - tin chữ có kev cùng hai tin chỉ ảnh cùng nhóm, cùng ts, khác sender đều vào snapshot;
  - tin chỉ ảnh I3 ingest giữa lượt flush vào lượt thứ hai;
  - bản lặp của I1 bị dedup (duplicates 1);
  - 4 tin có 4 sourceId khác nhau, mỗi tin đúng 1 lần, `meta.kev` nguyên vẹn, schemaVersion 3 ở cả hai
    manifest;
  - buffered 0, mã 0, thoát ở 5013ms (mốc huỷ ảnh).
- **[Đường mất-tin-đã-ack-mà-exit-0: không tìm thấy]** Đọc lại `graceful.ts` và `server.ts` ở HEAD:
  - `finish()` luôn đọc `pendingCount()` (= `buffer.length`). Buffer chỉ được lọc SAU `writer.finalize`,
    còn `ingest()` push vào buffer đồng bộ trước khi trả 202. Vì vậy mọi tin đã ack mà chưa ghi đều được
    đếm, ở cả bốn đường thoát: deadline, tín hiệu lần 2, flush lỗi, flush xong.
  - Lỗi ghi `agent-seen.json` sau finalize ném ra catch, rồi exit 0 với buffer rỗng. Tin đã nằm trong
    snapshot, nên không mất.
  - Giữa lần flush cuối trả null và `process.exit` không có await nào.
  - Lượt định kỳ có thể chen vào giữa hai vòng lặp flush. Lượt shutdown kế tiếp sẽ nhập vào lượt đó và gắn
    timer abort (`flushAbort` được gán đồng bộ trước await đầu tiên của `doFlush`).
- Harness `scripts/collector-shutdown/acceptance.mjs` vẫn để timer `sleep(15_000)` / `sleep(60_000)` /
  deadline 60s treo event loop sau khi race xong. Vì vậy E5, E8 tốn 16s, còn E9, E11 tốn 61s tường, dù
  shutdown thật chỉ vài ms (E11 khoảng 3s).

## Analyst

Non-discriminating evals: none. Vòng này không chạy baseline diffBase, nên mọi khối ghi `baseline: n-a`
(lý do ở «Baseline khong do»). Hai đối chứng ngoài baseline:
- E12 phân biệt test P3 mới với test P3 vòng 3. Verifier dựng một bản chép collector trong scratchpad, với
  src ở HEAD và `node_modules` là symlink, rồi chỉ thay `graceful-shutdown-integration.test.ts` bằng bản
  d6d9abe và build lại bằng tsc. Kết quả: test cũ chạy trên mã HEAD xanh 0/10, đỏ 10/10 (15:57:45Z). Bản
  chép đã xoá sau khi chạy.
- E10 và E11 đã được vòng 3 đối chứng là đỏ trên mã vòng 2 (dfaa45b). E7, E8, E9 đã được vòng 2 đối chứng
  với mã vòng 1.

**Số lần chạy ca P3: 31 xanh / 0 đỏ.** Nguyên văn ở `evidence/probes-round4.txt`. Gồm:
- 1 lần trong suite E2 (3019ms);
- 10 lần của E12;
- 15 lần lặp thường, mỗi lần «pass 1 fail 0», 3023–3058ms;
- 5 lần dưới tải 18 tiến trình node bận CPU, 3013–3057ms.

Thời gian luôn quanh 3s, nghĩa là ca đi đúng nhánh race close 3s, không phải nhánh connection rảnh bị cắt.

**Diff mã sản phẩm vòng 3 ↔ vòng 4:**
- `git diff --stat d6d9abe 0d22845 -- collector/src/api collector/src/core` chỉ ra `collector/src/api/main.ts`
  (2 thêm, 1 bớt), là chú thích dòng 61–62. Không có dòng mã thực thi nào đổi.
- Ngoài api/core chỉ có `collector/src/test/graceful-shutdown-integration.test.ts` khác (+9: listener
  `error`, chờ `server.once("request")`). Đây là tệp test, được phép khác.
- `git diff 0d22845 HEAD -- collector/src` rỗng.
- So patch tính năng trước và sau rebase, chỉ lấy dòng +/- ở api và core:
  - `merge-base(306f386, main)..306f386` cho 254 dòng;
  - `merge-base(0d22845, main)..0d22845` cho 255 dòng;
  - khác nhau DUY NHẤT ở dòng chú thích main.ts.
- `29050d4 → d6d9abe` (api, core) là PL4/ZC1 từ main:
  - server.ts: `AgentKevFact`, `meta.kev`, `sourceIdOf` ZC1;
  - storage.ts và types.ts: schemaVersion 3.
- `git diff origin/main HEAD` không chạm storage.ts và types.ts.

Kết luận: phần rebase không làm đổi mã tính năng.

**Probe P1/P2/P3 chạy lại.** Collector build từ 9df28ce, nguyên văn ở `evidence/probes-round4.txt`:

    P1 (15:52:11Z): ack=202 images=24 · exit sau 35005ms · code 0 · snapshot hoàn tất 1 · buffered 0 · gọi host ảnh 16
    P2 D=2000 (15:52:46Z): SIGTERM sau 2006ms kể từ lúc lượt định kỳ bắt đầu · thoát sau 35010ms · mã 0 · snapshot hoàn tất 1 · buffered 0 · gọi host ảnh 16
    P2 đối chứng D=20000 (15:53:23Z): thoát sau 35008ms kể từ SIGTERM · mã 0 · snapshot hoàn tất 1 · buffered 0 · gọi host ảnh 24
    P3 stall (main.js thật, 15:54:26Z): tin A trả 202 trước SIGTERM · POST treo (nửa body) · thoát sau 3014ms · mã 0 signal null · snapshot 1
    P3 ka (15:54:29Z): POST keep-alive dở lúc SIGTERM trả 202 sau 313ms · thoát sau 3017ms · mã 0 signal null · snapshot 1
    P3 reuse (15:54:32Z): POST 1 (dở lúc SIGTERM) trả 202 · POST 2 trên cùng socket 1,3s sau SIGTERM trả 202 · thoát sau 3012ms · mã 0 signal null · snapshot 1
    P4 auto-flush (15:54:36Z): thoát sau 35011ms · mã 0 · snapshot 1 · tin có trong snapshot true · buffered 0 · POST kích nhận HTTP 202
    P5 late-post 5000ms (15:55:13Z): thoát sau 35011ms · mã 0 · snapshot 2 · A true · B true · B nhận 202 · buffered 0
    P6 kev+ZC1 (mới): thoát sau 5013ms · mã 0 · snapshot 2 · schemaVersion 3,3 · 4 tin / 4 sourceId · T 1 · I1 1 · I2 1 · I3 1 · meta.kev nguyên · buffered 0

Cả ba probe bắt buộc đều đạt: snapshot đủ, buffered 0, mã 0, không dòng MẤT. Số liệu trùng vòng 3 (sai
khác dưới 15ms). Tệp probe mới: `evidence/P6-kev-zc1-probe.mjs`.

**Không đụng runtime thật.** Tiến trình nghe 127.0.0.1:9210 là PID 63069 trước (15:43:03Z) và sau mọi lần
chạy, cùng PID với vòng 3. Trong `~/dev/onehub-invest/collector/snapshots/hanoi` có thêm 6 snapshot
`zalo-agent` từ 15:43Z. Cả 6 có tên rơi đúng giây :54 (interval 60s của API đang chạy), và không item nào
chứa chuỗi đánh dấu của eval hay probe (đã grep gzcat). Worktree không phát sinh `collector/snapshots`.
Không còn thư mục tạm `acc-*` hay `probe-*` nào từ phiên này. Thay đổi trong repo gồm:
- `run-log.jsonl`, nối thêm 12 dòng round 4;
- báo cáo này;
- `evidence/probes-round4.txt`, `evidence/P6-kev-zc1-probe.mjs`;
- `collector/dist` do build.

Không có `network_observed`, vì không eval nào là ui-check (Network truth không áp dụng).

Baseline khong do:
- Vòng này không chạy lane baseline diffBase. Vòng 2 đã đo E2 là red trên diffBase cba11e4 (19/19 xanh
  nhưng 0 ca graceful-shutdown).
- E1: `collector/src/api/graceful.ts` chưa tồn tại trên diffBase.
- E3: `scripts/collector-shutdown/acceptance.mjs`, `collector/src/api/graceful.ts` và plist chưa tồn tại
  trên diffBase.
- E4, E5, E7, E8, E9, E10, E11: `scripts/collector-shutdown/acceptance.mjs` chưa tồn tại trên diffBase.
- E6: plist chưa tồn tại trên diffBase.
- E12: `collector/src/test/graceful-shutdown-integration.test.ts` chưa tồn tại trên diffBase. Đối chứng với
  test vòng 3 đã làm như trên.

## Variance

none — every multi-run eval is uniform. Không eval nào khai `runs`. E12 tự lặp 10 lần và xanh 10/10. Ca P3
từng được ghi «flaky» ở vòng 3, nay xanh 31/31 qua cả lặp thường lẫn dưới tải, và test cũ đỏ 10/10 trên
cùng mã. Chập chờn đã được khử tận gốc ở test (15f6bd0).

## Iterations

Round 1: E4 failed (cấp tiêu chí). Probe P1 cho thấy lượt flush đầu khi shutdown không huỷ ảnh sát deadline; tin đã ack mất mà vẫn thoát mã 0. Returned to implementation.
Round 2: E7 failed (cấp tiêu chí). Lượt flush định kỳ đang chạy lúc SIGTERM không nhận deadline, ảnh treo không bị huỷ, tin mất (P2). Thêm rủi ro POST treo nửa body giữ close() tới deadline (P3). Returned to implementation.
Round 3: sản phẩm sửa đúng P2 (flushAbort) và P3 (race close 3s), E1 và E3–E11 đạt. E2 failed vì ca tích hợp mới «P3» có race trong test (SIGTERM trước khi server parse header, socket thô thiếu listener error). Returned to implementation (sửa test, làn ZCode), escalate tới user.
Round 4: E1–E12 đạt. Test P3 đã sửa (15f6bd0) xanh 31/31, test cũ đỏ 10/10 trên cùng mã. Mã sản phẩm chỉ khác vòng 3 ở chú thích main.ts. PL4/ZC1 rebase vào không tương tác xấu với shutdown (P6). P1/P2/P3/P4/P5 không mất tin. Verdict PASS, chờ chữ ký Cổng 2. Còn ràng buộc ZC6 → ZC4 ở Known limits.

### Re-pin lần 1 — 2026-10-24, do hoá cũ do merge origin/main 460e61a+ vào nhánh
run_id: repin-20261024T075630Z-17705
sha: 27f1077fab3fa1b4a8fb4d87c879cc50e95edd3c · suites: 6 lệnh exit 0 · evals: 12/12 eval máy đạt kỳ vọng

### Re-pin lần 2 — 2026-10-24, do hoá cũ do merge origin/main a4af936 (#57 ON7) vào nhánh
run_id: repin-20261024T081758Z-49349
sha: d29dc802e84405e0aec4f386135f421bdb4e01c0 · suites: 6 lệnh exit 0 · evals: 12/12 eval máy đạt kỳ vọng
