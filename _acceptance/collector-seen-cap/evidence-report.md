---
schema_version: 2
feature_slug: collector-seen-cap
verdict: PASS
failed_evals: []
reason:
verified_by: feature-loop:cham-lenh
enforcement_mode: strict
bypass_used: false
verified_commit: 13becc43a6b7770059e63ff787b5ab7c23a60690
human_signoff:
---

# Evidence Report: collector-seen-cap

Vòng 2, hạng T2. Cây chấm là `13becc4`: ZCode `7b5ccfb` (vòng 2, đã rebase lên main) cộng `origin/main` mới nhất. Người chấm chạy riêng mỗi eval một lần, từ gốc worktree, theo đúng lệnh đã giải từ `_acceptance/config.yaml`. Lệnh nào cũng xoá `dist` rồi build lại. Mọi ca harness chạy trong tiến trình con dùng thư mục tạm và cổng ngẫu nhiên. Không chạm :9210, `collector/state` hay `collector/snapshots` thật.

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | script | PASS |
| E2 | AC-2 | script | PASS |
| E3 | AC-3 | script | PASS |
| E4 | AC-4 | script | PASS |
| E5 | AC-5 | script | PASS |
| E6 | AC-6 | script | PASS |
| E7 | AC-7 | script | PASS |

## Evidence

- eval: E1
  run_id: collector-seen-cap-E1-r2-20261025T122329Z
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.seen_flush_6000
  verified_at: 2026-10-25T12:23:29Z
  output: |
    ok   nhận đủ 6000 tin mới, được 6000/0
    ok   flush 6000 id kết thúc trong 143 ms (< 5000)
    ok   tệp state giữ đúng 5000 id, được 5000
    ok   should-NOT-fire: state không có id trùng
    ok   5000 tin mới nhất gửi lại → đều trùng, được dup 5000
    ok   1000 tin cũ nhất đã bị đẩy khỏi bộ nhớ khử trùng → nhận lại (FIFO), được 1000
    FLUSH-6000 PASS

- eval: E2
  run_id: collector-seen-cap-E2-r2-20261025T122333Z
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.seen_hai_luot
  verified_at: 2026-10-25T12:23:34Z
  output: |
    ok   sau lượt 1 (4000): state 4000 id, không bị xoá bớt
    ok   sau lượt 2 (+2000): state đúng 5000 id, được 5000
    ok   id 1001–6000 vẫn trùng, được 5000
    ok   should-NOT-fire: id 4000 (ngay trong cửa sổ 5000) vẫn bị khử trùng
    HAI-LUOT PASS

- eval: E3
  run_id: collector-seen-cap-E3-r2-20261025T122337Z
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.seen_khoi_dong_lai
  verified_at: 2026-10-25T12:23:38Z
  output: |
    ok   sau khởi động lại: 5000 id mới nhất vẫn trùng, được 5000
    ok   tin mới sau restart được nhận, state vẫn đúng 5000 id
    KHOI-DONG-LAI PASS

- eval: E4
  run_id: collector-seen-cap-E4-r2-20261025T122341Z
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.seen_tran_lo
  verified_at: 2026-10-25T12:23:42Z
  output: |
    ok   1001 tin → 413 kèm số và trần (413 {"error":"lô quá lớn: 1001 tin vượt trần 1000 tin mỗi lô — chia nhỏ rồi gửi lại")
    ok   lô bị từ chối không vào bộ đệm
    ok   should-NOT-fire: đúng 1000 tin → 202, được 202
    ok   1000 tin được nhận (có thể đã tự flush), được 1000
    TRAN-LO PASS

- eval: E5
  run_id: collector-seen-cap-E5-r2-20261025T122347Z
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.collector_test_clean
  verified_at: 2026-10-25T12:25:38Z
  output: |
    > tsc -p tsconfig.json && node --test 'dist/test/*.test.js'
    ✔ flush 6000 id mới: kết thúc <1s, state giữ đúng 5000 id MỚI NHẤT (163.498041ms)
    ✔ 4000 + 2000 qua hai lượt flush: dedup vẫn đúng với id gần nhất (103.257708ms)
    ✔ HTTP trần lô: >1000 tin/lô → 413 rõ ràng; đúng 1000 → 202 (14.695792ms)
    ✔ 2510-2 MỞ LẠI: nạp state CÓ ID TRÙNG (bản cũ [...seen, ...newIds]) — id vẫn khử trùng sau lần cắt cap, state ra không trùng (5.445542ms)
    ✔ 2510-2 MỞ LẠI: HTTP thân null / chuỗi → 400 (hết 500 khiến hook spool gửi lại vĩnh viễn) (3.852083ms)
    ℹ tests 57
    ℹ pass 57
    ℹ fail 0
    ℹ cancelled 0
    ℹ skipped 0

- eval: E6
  run_id: collector-seen-cap-E6-r2-20261025T122545Z
  exit_code: 0
  baseline: red
  verifier: config:executors.script.seen_state_trung
  verified_at: 2026-10-25T12:25:45Z
  output: |
    ok   state sau các lượt cắt không còn id trùng (5000 phần tử, 5000 id)
    ok   10 id từng bị trùng trong state cũ vẫn bị khử trùng khi gửi lại, được dup 10
    STATE-TRUNG PASS

- eval: E7
  run_id: collector-seen-cap-E7-r2-20261025T122549Z
  exit_code: 0
  baseline: red
  verifier: config:executors.script.seen_body_null
  verified_at: 2026-10-25T12:25:49Z
  output: |
    ok   thân null → 400, được 400
    ok   thân số → 400, được 400
    ok   thân chuỗi → 400, được 400
    ok   thân mảng → 400, được 400
    ok   should-NOT-fire: thân hợp lệ vẫn 202
    BODY-NULL PASS

## Known limits

- Các giới hạn vòng 1 vẫn đúng vì vòng 2 không đổi các đoạn mã liên quan. Số dòng bên dưới theo `server.ts` hiện tại.
  - Bộ nhớ khử trùng và bộ đệm không có trần tổng giữa hai lượt flush. Việc cắt về 5000 chỉ chạy sau một lượt flush GHI THÀNH CÔNG (dòng 304–306). Nếu flush lỗi liên tục thì `seenOrder` tăng không giới hạn, và comment dòng 199–202 nói quá so với thực tế.
  - Trần 413 chỉ đếm số tin, không đếm byte: thân request được đọc trọn và `JSON.parse` xong mới so trần (dòng 356–375).
  - `writeFile(stateFile)` lỗi sau khi snapshot đã finalize thì bộ nhớ đã cắt nhưng tệp state trên đĩa vẫn là bản cũ (dòng 288–308).
  - Collector Facebook bỏ cả xô khi gặp 413, không thử lại, không chia nhỏ (trùng phần Out of scope).
- Vòng 1 ghi «kiểm 413 chạy trước kiểm khoá». Vòng 2 có thêm một phép kiểm cùng loại: phép kiểm «thân phải là object» (dòng 363) cũng chạy trước kiểm khoá. Hệ quả: thân `null` gửi không kèm khoá nhận 400. Trên `origin/main` ca này nhận 401, trên bản vòng 1 nhận 500. Tác động thấp vì API chỉ nghe ở 127.0.0.1.
- Tin còn nằm trong bộ đệm có thể bị đẩy khỏi bộ nhớ khử trùng khi hơn 5000 tin dồn lại trong một lượt flush chậm. Đây là mục Ngoài hợp đồng của vòng 1, đề xuất ghi Known limits; mã không đổi.
- Harness E6 dựng 10 id trùng ở CUỐI state, nên vế should-NOT-fire của nó không chạm tới cơ chế mất khử trùng thật (bản sao cũ bị cắt trong khi bản sao mới còn trong hàng). Cơ chế này do ca đơn vị mới của ZCode trong E5 kiểm. Xem thêm mục Analyst.

## Ngoài hợp đồng

**Sau một sự cố ghi kéo dài, lượt ghi thành công đầu tiên có thể làm collector đứng hình nhiều giây** (mới ở vòng 2)
- Người dùng thấy gì: nếu collector không ghi được snapshot trong một thời gian dài (đĩa đầy, thư mục không ghi được) mà tin vẫn đổ vào, thì tới lượt ghi thành công đầu tiên collector không trả lời ai trong một khoảng. Dồn 50 nghìn id thì đứng khoảng 1 giây, dồn 200 nghìn id thì khoảng 16 giây. Không mất tin.
- Căn cứ: vòng cắt mới `while (seenOrder.length > SEEN_CAP) seen.delete(seenOrder.shift())` gọi `shift` từng phần tử, nên tổng chi phí tăng theo bình phương số id phải cắt. Người chấm đo riêng phép cắt trên Node của máy này, trong thư mục tạm: 6000 id mất khoảng 1 ms, 50.000 id khoảng 790 ms, 200.000 id khoảng 16.300 ms, chặn event loop suốt thời gian đó. Đây là hệ quả của giới hạn «`seenOrder` tăng không giới hạn khi flush lỗi» đã ghi ở vòng 1. Lưu lượng hiện tại thấp hơn ngưỡng này hàng trăm lần. Phép lọc bộ đệm `ids.includes` ở dòng 296 cũng tăng theo bình phương, nhưng có sẵn từ `origin/main`, không thuộc diff ZCode.
- file: collector/src/api/server.ts (dòng 304–306)
- severity: low
- Đề xuất: known-limits. Nếu muốn sửa thì chỉ một dòng: `seenOrder.splice(0, seenOrder.length - SEEN_CAP)` rồi xoá các id bị cắt khỏi `seen`.

Ba mục Ngoài hợp đồng của vòng 1 đã có quyết định nên giữ nguyên trong `review-findings.md`, gắn nhãn `(r1)`, không tính lại. Hai mục được trả lại sửa nay là AC-6 và AC-7, cả hai đều đã xanh. Mục thứ ba được đề xuất ghi Known limits.

## Analyst

Non-discriminating evals: không có eval nào xanh trên cả hai cây trong phần baseline đã đo. Riêng E6 và E7 có một số vế phụ xanh cả trên bản vòng 1:
- E6: vế should-NOT-fire «10 id từng trùng vẫn bị khử trùng» xanh trên `1670ed4`. Lý do là 3 lượt cắt chỉ đẩy ra 60 id đầu hàng, còn bản sao trùng nằm ở cuối hàng. E6 phân biệt được hai bản nhờ vế «state không còn id trùng»: bản vòng 1 cho 5000 phần tử nhưng chỉ 4990 id. Người chấm có thăm dò thêm ngoài eval: state `[X, 4998 id giả, X]`, thêm 2 tin rồi flush, gửi lại X. Bản `1670ed4` nhận lại X (mất khử trùng), bản vòng 2 khử trùng X. Ca đơn vị mới của ZCode trong E5 kiểm đúng cơ chế này.
- E7: các vế thân số, chuỗi và mảng đã ra 400 ngay trên `1670ed4`. Chỉ vế thân `null` phân biệt được hai bản: bản vòng 1 trả 500, bản vòng 2 trả 400.

Baseline khong do: E1–E5 giữ `n-a` như vòng 1 vì code của các AC này không đổi ở vòng 2 (vòng 2 chỉ thêm bỏ trùng lúc nạp và chặn thân không phải object). Hợp đồng (mục Notes) ghi người dựng hồ sơ đã kiểm harness biết đỏ trên `origin/main`: `flush-6000` bị giết sau 60 giây, `tran-lo` đỏ 2 mục. Người chấm không đo lại diffBase `origin/main`. Để tham khảo, cũng trong thư mục tạm, người chấm chạy cả bốn ca E1–E4 trên bản vòng 1 `1670ed4` và đều xanh: vòng 2 không làm hỏng hành vi đã đạt ở vòng 1.

Baseline E6/E7 đo trên bản collector vòng 1 `1670ed4`, theo lời giao, không đo trên `origin/main`. Cách dựng: `git archive 1670ed4 collector/src collector/tsconfig.json collector/package.json` vào thư mục tạm của phiên, mượn `node_modules` của worktree, build bằng `tsc`, rồi chạy harness của HEAD trên bản đó. Kết quả cả hai đều red: `state-trung` cho 5000 phần tử nhưng 4990 id, `body-null` trả 500 cho thân `null`. Lưu ý: trên `origin/main` ca thân `null` đi thẳng vào `ingest` và nhận 400, nên E7 sẽ xanh ở đó. Hồi quy 500 do chính vòng 1 sinh ra và vòng 2 đã gỡ.

## Variance

none — không eval nào khai `runs` > 1; mỗi eval xác định chạy một lần.

## Iterations

Round 1: E1–E5 đều PASS ở 253908e (ZCode 1670ed4). Mạnh chọn MỞ LẠI claudedp-2510-2 để sửa hai lỗi ngoài hợp đồng: (1) tệp state do bản cũ để lại có id trùng làm `seen` và `seenOrder` lệch nhau nên mất khử trùng; (2) POST thân `null` trả 500 thay vì 400. Hai lỗi này thành AC-6 và AC-7.
Round 2: E1–E7 đều PASS ở 13becc4 (ZCode 7b5ccfb, đã rebase main). E6 và E7 đỏ trên bản vòng 1 và xanh trên bản vòng 2. Có 1 mục Ngoài hợp đồng mới, mức low, đề xuất ghi Known limits.
