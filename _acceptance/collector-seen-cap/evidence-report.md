---
schema_version: 2
feature_slug: collector-seen-cap
verdict: PASS
failed_evals: []
reason:
verified_by: feature-loop:cham-lenh
enforcement_mode: strict
bypass_used: false
verified_commit: 253908e53d593bf9cd35d8788f98974e4fc32c54
human_signoff:
---

# Evidence Report: collector-seen-cap

Vòng 1, hạng T2. Người chấm chạy riêng từng eval một lần trên cây `253908e`, từ thư mục worktree. Mỗi lệnh có `rm -rf dist` và build lại.

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | script | PASS |
| E2 | AC-2 | script | PASS |
| E3 | AC-3 | script | PASS |
| E4 | AC-4 | script | PASS |
| E5 | AC-5 | script | PASS |

## Evidence

- eval: E1
  run_id: collector-seen-cap-E1-20261025T053736Z
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.seen_flush_6000
  verified_at: 2026-10-25T05:37:37Z
  output: |
    ok   nhận đủ 6000 tin mới, được 6000/0
    ok   flush 6000 id kết thúc trong 147 ms (< 5000)
    ok   tệp state giữ đúng 5000 id, được 5000
    ok   should-NOT-fire: state không có id trùng
    ok   5000 tin mới nhất gửi lại → đều trùng, được dup 5000
    ok   1000 tin cũ nhất đã bị đẩy khỏi bộ nhớ khử trùng → nhận lại (FIFO), được 1000
    FLUSH-6000 PASS

- eval: E2
  run_id: collector-seen-cap-E2-20261025T053743Z
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.seen_hai_luot
  verified_at: 2026-10-25T05:37:44Z
  output: |
    ok   sau lượt 1 (4000): state 4000 id, không bị xoá bớt
    ok   sau lượt 2 (+2000): state đúng 5000 id, được 5000
    ok   id 1001–6000 vẫn trùng, được 5000
    ok   should-NOT-fire: id 4000 (ngay trong cửa sổ 5000) vẫn bị khử trùng
    HAI-LUOT PASS

- eval: E3
  run_id: collector-seen-cap-E3-20261025T053751Z
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.seen_khoi_dong_lai
  verified_at: 2026-10-25T05:37:51Z
  output: |
    ok   sau khởi động lại: 5000 id mới nhất vẫn trùng, được 5000
    ok   tin mới sau restart được nhận, state vẫn đúng 5000 id
    KHOI-DONG-LAI PASS

- eval: E4
  run_id: collector-seen-cap-E4-20261025T053758Z
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.seen_tran_lo
  verified_at: 2026-10-25T05:37:59Z
  output: |
    ok   1001 tin → 413 kèm số và trần (413 {"error":"lô quá lớn: 1001 tin vượt trần 1000 tin mỗi lô — chia nhỏ rồi gửi lại")
    ok   lô bị từ chối không vào bộ đệm
    ok   should-NOT-fire: đúng 1000 tin → 202, được 202
    ok   1000 tin được nhận (có thể đã tự flush), được 1000
    TRAN-LO PASS

- eval: E5
  run_id: collector-seen-cap-E5-20261025T053805Z
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.collector_test_clean
  verified_at: 2026-10-25T05:38:51Z
  output: |
    > tsc -p tsconfig.json && node --test 'dist/test/*.test.js'
    ✔ flush 6000 id mới: kết thúc <1s, state giữ đúng 5000 id MỚI NHẤT (167.152125ms)
    ✔ 4000 + 2000 qua hai lượt flush: dedup vẫn đúng với id gần nhất (105.69075ms)
    ✔ HTTP trần lô: >1000 tin/lô → 413 rõ ràng; đúng 1000 → 202 (14.318958ms)
    ℹ tests 51
    ℹ pass 51
    ℹ fail 0
    ℹ cancelled 0
    ℹ skipped 0

## Known limits

- Bộ nhớ khử trùng và bộ đệm chỉ bị chặn theo từng lô, không có trần tổng giữa hai lượt flush. `maxBatchItems` (1000) giới hạn số tin của MỘT POST, không giới hạn số POST. Lượt flush đang tải ảnh có thể kéo dài từ vài chục giây tới vài phút (`server.ts` dòng 307–311). Trong lúc đó các POST mới vẫn được `ingest` thêm vào `buffer`, `seen` và `seenOrder`; `flush()` chỉ trả lại promise đang chạy. Việc cắt về 5000 chỉ làm sau một lượt flush GHI THÀNH CÔNG (dòng 297). Vì vậy lượng bộ nhớ tăng theo tốc độ tin đổ vào nhân với thời gian flush, không theo một hằng số. Câu comment ở dòng 193–195 («Bộ nhớ tự giới hạn…») nói quá so với thực tế. Nếu flush lỗi liên tục (đĩa đầy, snapshot root không ghi được) thì `seenOrder` tăng không giới hạn cho tới lượt flush thành công kế tiếp. Với lưu lượng hiện tại (OpenClaw gửi 1 tin mỗi POST, Facebook tối đa khoảng 100 tin mỗi nhóm mỗi lượt 4 giờ) thì chưa chạm ngưỡng nguy hiểm.
- Trần 413 chỉ đếm số tin, không đếm byte. `readBody` đọc trọn thân request vào bộ nhớ, sau đó `JSON.parse`, rồi mới so `msgCount` (dòng 349–358). Lô 1001 tin rất nặng vẫn được nạp đủ vào RAM trước khi bị từ chối. Phép kiểm 413 cũng chạy TRƯỚC phép kiểm khoá, nên bên gọi không có khoá gửi lô lớn sẽ nhận 413 thay vì 401. Tác động thấp vì API chỉ nghe ở 127.0.0.1.
- Hiện chưa bên gửi thật nào gặp 413. `collector/openclaw/handler.js` gửi đúng 1 tin mỗi POST (dòng 63). `pipeline/apify-facebook-collector.mjs` gom bài theo `groupTitle`, mỗi nhóm một POST, `resultsLimit: 100`, nên mỗi lô khoảng 100 tin trở xuống. Tuy vậy, collector Facebook xử lý MỌI phản hồi không 2xx (kể cả 413) bằng cách in `❌` ra stderr rồi bỏ cả nhóm: không thử lại, không chia nhỏ, tiến trình vẫn kết thúc bình thường (dòng 191–197). Có một trường hợp có thể vượt trần: bài thiếu `groupTitle` đều rơi vào chung xô `"Facebook"` (dòng 143 và 166). Nếu `resultsLimit` tính theo từng nhóm và nhiều nhóm cùng thiếu `groupTitle`, xô này có thể vượt 1000 tin. Khi đó cả xô bị 413 và mất trong lượt đó, chỉ để lại dấu vết trong log. Người chấm chưa kiểm ngữ nghĩa `resultsLimit` của actor. Mục này khớp phần Out of scope của hợp đồng, ghi lại để có căn cứ.
- Khi `writeFile(stateFile)` lỗi SAU KHI snapshot đã finalize và `buffer` đã lọc (dòng 288–301), bộ nhớ đã cắt nhưng tệp state trên đĩa vẫn là bản cũ. Sau khi khởi động lại, các id ingest kể từ lần ghi state thành công gần nhất không còn trong bộ nhớ khử trùng, nên tin gửi lại sẽ được nhận lại và lặp trong snapshot mới. Lỗi này hiếm.

## Ngoài hợp đồng

**Tệp state do bản cũ để lại có id trùng, làm `seen` và `seenOrder` lệch nhau vĩnh viễn với các id đó**
- Người dùng thấy gì: sau khi triển khai bản mới lên :9210, một số tin đã nhận được collector nhận LẠI khi bên gửi gửi lại (Facebook chạy mỗi 4 giờ với `onlyPostsNewerThan: "12 hours"` nên gửi lại bài trùng). Tin lặp vào snapshot mới. Nếu bước nạp phía sau không khử theo `sourceId` thì tin trùng có thể chảy xuống `stg_*`. Ngoài ra cửa sổ khử trùng thật nhỏ hơn 5000 id duy nhất.
- Căn cứ: bản `origin/main` ghi state bằng `persist = [...seen, ...newIds].slice(-5000)`, trong khi `newIds` đã nằm trong `seen` từ lúc ingest. Mỗi id mới của lượt flush cuối vì thế xuất hiện hai lần trong tệp. Người chấm đọc (chỉ đọc) tệp state thật `~/dev/onehub-invest/collector/state/agent-seen.json`: dài 5000, 4998 id duy nhất, id trùng đầu tiên ở vị trí 4998. Bản mới nạp state bằng `seen.add(id); seenOrder.push(id)` cho MỌI phần tử, không bỏ trùng (`server.ts` dòng 107–110). Lúc cắt, `seen.delete(seenOrder.shift())` (dòng 298) xoá id X khỏi `seen` khi bản sao CŨ của X bị đẩy ra, dù bản sao MỚI của X vẫn còn trong `seenOrder`. Từ đó X không còn được khử trùng. Nếu X được gửi lại, nó được nhận và đẩy thêm một bản sao nữa, nên vòng lệch tự lặp lại. State mới ghi thẳng `seenOrder` nên mang theo bản trùng. Khẳng định «state giữ đúng 5000 id không trùng» của AC-1 chỉ đúng khi bắt đầu từ state sạch; E1–E3 không có ca nạp state có trùng. Người chấm suy ra từ đọc code và đếm tệp, không chạy thêm lệnh ngoài eval.
- file: collector/src/api/server.ts (dòng 104–112 nạp state, 297–301 cắt và ghi)
- severity: medium
- Đề xuất: new-contract. Cách sửa gợi ý: khử trùng lúc nạp state (giữ lần xuất hiện cuối), hoặc khi cắt chỉ `seen.delete` lúc id không còn bản sao nào khác. Thêm ca: nạp state `[...a, x, ..., x]` → sau cắt, x vẫn bị khử trùng.

**POST thân `null` giờ trả 500 thay vì 400 (lỗi mới do đoạn kiểm trần)**
- Người dùng thấy gì: bên gửi có lỗi gửi body JSON `null` trước đây nhận 400 «body phải là JSON object». Giờ họ nhận 500 `{"error":"internal"}` và log ghi `api error: TypeError …`, dễ bị hiểu là sự cố máy chủ. Với OpenClaw, 5xx được xếp vào lỗi tạm thời và giữ lại để gửi lại mãi (handler.js dòng 79), thay vì chuyển vào `rejected/`.
- Căn cứ: `handle` chạy `JSON.parse` rồi đọc `(body as Partial<AgentReportBody>).messages` TRƯỚC khi gọi `ingest` (dòng 355–357). Với `body === null`, câu đó ném `TypeError: Cannot read properties of null`. Lỗi nổi lên `main.ts` dòng 26–30 và thành 500. Phép kiểm `typeof body !== "object" || body === null` nằm trong `ingest` nên không kịp chạy. Bộ test chỉ thử ca null qua `ingest()` trực tiếp, không qua `handle()`. Người chấm suy ra từ ngữ nghĩa JavaScript, chưa chạy lệnh để thấy tận mắt.
- file: collector/src/api/server.ts (dòng 355–357)
- severity: low
- Đề xuất: new-contract. Một dòng sửa: `const msgs = body && typeof body === "object" ? (body as …).messages : undefined;`.

**Tin còn trong bộ đệm có thể bị đẩy khỏi bộ nhớ khử trùng khi một lượt flush chậm mà hơn 5000 tin đổ vào cùng lúc**
- Người dùng thấy gì: cùng một tin xuất hiện hai lần trong cùng một snapshot hoặc hai snapshot liền nhau.
- Căn cứ: lượt flush chỉ lấy bản chép `items = buffer.slice()`; tin ingest trong lúc tải ảnh nằm lại `buffer` (dòng 236–238). Sau khi ghi xong, vòng cắt (dòng 297–299) xoá các id CŨ NHẤT của `seenOrder` mà không kiểm id đó còn trong `buffer` hay không. Chỉ khi `buffer` còn lại có hơn 5000 tin (ví dụ 6 POST × 1000 tin đến trong một lượt tải ảnh vài phút) thì những tin cũ nhất của nó mới mất khỏi `seen` khi chưa được flush. Gửi lại lúc đó sẽ thành trùng trong bộ đệm. Điều kiện khó xảy ra với lưu lượng hiện tại.
- file: collector/src/api/server.ts (dòng 236–238, 289, 297–299)
- severity: low
- Đề xuất: known-limits

## Analyst

Non-discriminating evals: không xác định được. Người chấm vòng này không chạy baseline, nên mọi eval ghi baseline n-a.

Baseline khong do: lượt chấm độc lập này chỉ được phép chạy các lệnh `config:` của evals trên cây đang nghiệm thu, không dựng cây diffBase. Hợp đồng (mục Notes) ghi người dựng hồ sơ đã kiểm harness biết đỏ trên `server.ts` của `origin/main`: `flush-6000` bị giết sau 60 giây, `tran-lo` đỏ 2 mục. Người chấm KHÔNG tự đo lại điều này.

## Variance

none — không eval nào khai `runs` > 1; mỗi eval xác định chạy một lần.

## Iterations

Round 1: E1–E5 đều PASS ở 253908e. Có 3 mục Ngoài hợp đồng (1 medium, 2 low) và 4 mục Known limits chờ Mạnh quyết ở Cổng 2.
