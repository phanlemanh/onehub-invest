---
schema_version: 2
feature_slug: kev-nhan-cung-hoa
verdict: PASS
failed_evals: []
reason:
verified_by: feature-loop:cham-lenh
enforcement_mode: strict
bypass_used: false
verified_commit: 7e99360438f1c9e86754f4f36085c5d3042067b4
human_signoff:
---

# Evidence Report: kev-nhan-cung-hoa

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | script | PASS |
| E2 | AC-2 | script | PASS |
| E3 | AC-3 | script | PASS |
| E4 | AC-4 | script | PASS |
| E5 | AC-5 | script | PASS |
| E6 | AC-6 | script | PASS |
| E7 | AC-7 | script | PASS |
| E8 | AC-8 | script | PASS |
| E9 | AC-9 | test | PASS |
| E10 | AC-10 | script | PASS |

## Evidence

- eval: E1
  run_id: kev-nhan-cung-hoa-E1-r2-20261025T005801Z
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.zc1b_media_junk
  verified_at: 2026-10-25T00:58:01Z
  output: |
    > tsc -p tsconfig.json
    ok   ingest không ném lỗi với 5 kiểu media rác
    ok   lô có media rác trả 202, được 202
    ok   cả 6 tin trong lô được nhận (gồm tin lành), được {"accepted":6,"duplicates":0}
    ok   flush ghi đủ 6 item, được 6
    ok   tin lành cùng lô có trong snapshot
    MEDIA-JUNK PASS

- eval: E2
  run_id: kev-nhan-cung-hoa-E2-r2-20261025T005813Z
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.zc1b_media_junk
  verified_at: 2026-10-25T00:58:14Z
  output: |
    > tsc -p tsconfig.json
    ok   ingest không ném lỗi với 5 kiểu media rác
    ok   lô có media rác trả 202, được 202
    ok   cả 6 tin trong lô được nhận (gồm tin lành), được {"accepted":6,"duplicates":0}
    ok   flush ghi đủ 6 item, được 6
    ok   tin lành cùng lô có trong snapshot
    MEDIA-JUNK PASS

- eval: E3
  run_id: kev-nhan-cung-hoa-E3-r2-20261025T005819Z
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.zc1b_payload_intact
  verified_at: 2026-10-25T00:58:19Z
  output: |
    ok   3 tin được nhận, được 202 {"accepted":3,"duplicates":0}
    ok   text của b1 giữ nguyên "  xyz  ", được "  xyz  "
    ok   media của b1 giữ nguyên như nhận
    ok   text của b2 giữ nguyên "", được ""
    ok   media của b2 giữ nguyên như nhận
    ok   text của b3 giữ nguyên "   ", được "   "
    ok   media của b3 giữ nguyên như nhận
    PAYLOAD-INTACT PASS

- eval: E4
  run_id: kev-nhan-cung-hoa-E4-r2-20261025T005824Z
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.zc1b_dedup_norm
  verified_at: 2026-10-25T00:58:24Z
  output: |
    ok   tin chỉ ảnh đầu tiên được nhận
    ok   đảo thứ tự URL → trùng tin đầu (duplicates 1), được {"accepted":0,"duplicates":1}
    ok   khoảng trắng hai đầu URL → trùng tin đầu (duplicates 1), được {"accepted":0,"duplicates":1}
    ok   dấu ? và # thừa cuối URL → trùng tin đầu (duplicates 1), được {"accepted":0,"duplicates":1}
    ok   thêm phần tử rác → trùng tin đầu (duplicates 1), được {"accepted":0,"duplicates":1}
    ok   should-NOT-fire: khác một URL → tin riêng (accepted 1), được {"accepted":1,"duplicates":0}
    ok   should-NOT-fire: thiếu một ảnh → tin riêng (accepted 1), được {"accepted":1,"duplicates":0}
    ok   should-NOT-fire: query thật khác nhau → tin riêng (accepted 1), được {"accepted":1,"duplicates":0}
    DEDUP-NORM PASS

- eval: E5
  run_id: kev-nhan-cung-hoa-E5-r2-20261025T005829Z
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.zc1b_dedup_norm
  verified_at: 2026-10-25T00:58:30Z
  output: |
    ok   tin chỉ ảnh đầu tiên được nhận
    ok   đảo thứ tự URL → trùng tin đầu (duplicates 1), được {"accepted":0,"duplicates":1}
    ok   khoảng trắng hai đầu URL → trùng tin đầu (duplicates 1), được {"accepted":0,"duplicates":1}
    ok   dấu ? và # thừa cuối URL → trùng tin đầu (duplicates 1), được {"accepted":0,"duplicates":1}
    ok   thêm phần tử rác → trùng tin đầu (duplicates 1), được {"accepted":0,"duplicates":1}
    ok   should-NOT-fire: khác một URL → tin riêng (accepted 1), được {"accepted":1,"duplicates":0}
    ok   should-NOT-fire: thiếu một ảnh → tin riêng (accepted 1), được {"accepted":1,"duplicates":0}
    ok   should-NOT-fire: query thật khác nhau → tin riêng (accepted 1), được {"accepted":1,"duplicates":0}
    DEDUP-NORM PASS

- eval: E6
  run_id: kev-nhan-cung-hoa-E6-r2-20261025T005834Z
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.zc1b_legacy_id
  verified_at: 2026-10-25T00:58:35Z
  output: |
    ok   5 tin được nhận, được 202 {"accepted":5,"duplicates":0}
    ok   ' abc ' mang id cũ sha256(group|ts|' abc ')
    ok   'abc' mang id cũ sha256(group|ts|'abc')
    ok   should-NOT-fire: ' abc ' và 'abc' KHÔNG bị gộp thành một tin
    ok   tin chữ kèm ảnh giữ id cũ (xuống dòng cuối không bị cắt)
    ok   text toàn khoảng trắng + ảnh → băm như tin chỉ ảnh (không theo công thức tin chữ)
    ok   hai tin toàn khoảng trắng cùng ảnh khác sender → 2 id khác nhau
    ok   tin toàn khoảng trắng gửi lại (khoảng trắng khác) cùng sender + ảnh → trùng
    LEGACY-ID PASS

- eval: E7
  run_id: kev-nhan-cung-hoa-E7-r2-20261025T005840Z
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.zc1b_legacy_id
  verified_at: 2026-10-25T00:58:40Z
  output: |
    ok   5 tin được nhận, được 202 {"accepted":5,"duplicates":0}
    ok   ' abc ' mang id cũ sha256(group|ts|' abc ')
    ok   'abc' mang id cũ sha256(group|ts|'abc')
    ok   should-NOT-fire: ' abc ' và 'abc' KHÔNG bị gộp thành một tin
    ok   tin chữ kèm ảnh giữ id cũ (xuống dòng cuối không bị cắt)
    ok   text toàn khoảng trắng + ảnh → băm như tin chỉ ảnh (không theo công thức tin chữ)
    ok   hai tin toàn khoảng trắng cùng ảnh khác sender → 2 id khác nhau
    ok   tin toàn khoảng trắng gửi lại (khoảng trắng khác) cùng sender + ảnh → trùng
    LEGACY-ID PASS

- eval: E8
  run_id: kev-nhan-cung-hoa-E8-r2-20261025T005845Z
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.zc1b_bad_text
  verified_at: 2026-10-25T00:58:45Z
  output: |
    > tsc -p tsconfig.json
    ok   text null → 400 có thông điệp, không ném, được 400
    ok   text số → 400 có thông điệp, không ném, được 400
    ok   text object → 400 có thông điệp, không ném, được 400
    ok   text thiếu → 400 có thông điệp, không ném, được 400
    ok   sau các lô bị từ chối, lô hợp lệ kế tiếp vẫn được nhận
    ok   chỉ tin hợp lệ vào snapshot (1 item), được 1
    BAD-TEXT PASS

- eval: E9
  run_id: kev-nhan-cung-hoa-E9-r2-20261025T005851Z
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.collector_test_clean
  verified_at: 2026-10-25T00:59:37Z
  output: |
    ✔ MỞ LẠI 2310-6: tin chữ ' abc ' (khoảng trắng 2 đầu) GIỮ id legacy; payload NGUYÊN VẸN; text không chuỗi không 500 (4.949917ms)
    ✔ MỞ LẠI 2310-6 vòng 2: url không phải chuỗi ({url:5},{url:{}}) không 500; url rỗng + path khác nhau = 2 tin (0.18025ms)
    ✔ readBody: ký tự Việt split giữa 2 chunk vẫn nguyên vẹn (1.238625ms)
    ℹ tests 48
    ℹ suites 0
    ℹ pass 48
    ℹ fail 0
    ℹ cancelled 0
    ℹ skipped 0
    ℹ duration_ms 45098.73525

- eval: E10
  run_id: kev-nhan-cung-hoa-E10-r2-20261025T005943Z
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.zc1b_url_path
  verified_at: 2026-10-25T00:59:43Z
  output: |
    > tsc -p tsconfig.json
    ok   url là số, path là chuỗi → 202 accepted 1, không ném
    ok   url là object, path là chuỗi → 202 accepted 1, không ném
    ok   url null, path là chuỗi → 202 accepted 1, không ném
    ok   url rỗng + path A được nhận
    ok   should-NOT-fire: url rỗng + path B (cùng nhóm, ts, sender) là tin riêng, được {"accepted":1,"duplicates":0}
    ok   url rỗng + path A gửi lại → trùng
    URL-PATH PASS

## Known limits

- Lỗi ngoài hợp đồng của vòng 1 (nay là AC-10) ĐÃ SỬA ở 62eaf38: `mediaRefOf` dùng `normRef(m.url)` (trả `""` cho mọi giá trị không phải chuỗi, nên không còn gọi `.trim()` trên số/object) rồi rơi về `normRef(m.path)` khi url rỗng. E10 xanh, test vòng 2 của ZCode trong suite E9 cũng xanh. Ghi chú «tên test nói slash cuối» của vòng 1 cũng hết: tệp `collector/src/test/kev-nhan-cung-hoa.test.ts` không còn chữ «slash».
- E10 chỉ đo cặp «url rỗng + path khác nhau» là hai tin riêng; cặp «url không phải chuỗi (số/object/null) + path khác nhau» không có ca đo riêng (ba ca url-không-chuỗi dùng ba `ts` khác nhau). Đọc code: `normRef` trả `""` cho mọi giá trị không phải chuỗi nên các ca này cũng rơi về `path` — đúng như AC-10 nói, nhưng là kết luận đọc code, không phải số đo.
- Text toàn khoảng trắng KHÔNG kèm ảnh đổi `sourceId` so với công thức cũ (đã nêu ở ## Notes của hợp đồng, vòng 1 đã đo: tin `"   "` không ảnh ra `4d1155ea…`, công thức cũ ra `44d0b885…`). Đường code này không đổi ở 62eaf38. Hệ quả: tin loại này đã có trong raw cũ, nếu được gửi lại sau triển khai, sẽ không bị khử trùng (nhân đôi một lần). Ca hiếm.
- Làn baseline (chạy eval trên `origin/main`) KHÔNG đo ở lượt chấm này, nên mọi khối mang `baseline: n-a`. Ghi chú «biết đỏ» trong hợp đồng (harness `url-path` đỏ 3 mục trên 8043a63; đỏ ở media-junk, payload-intact, dedup-norm, legacy-id trên `origin/main`) là lời người dựng hồ sơ, người chấm chưa tự xác nhận.
- E1–E8 và E10 gọi `ingest()` trực tiếp, không qua `handle()` HTTP; đường HTTP (parse JSON, 500 ở `collector/src/api/main.ts`) chỉ được phủ gián tiếp bởi suite E9.

## Ngoài hợp đồng

- **`group` hoặc `senderId` là object JSON làm `ingest()` ném lỗi (500 cả lô) hoặc gộp nhầm tin của hai nhóm khác nhau**
  - Người dùng thấy gì: một lô có `group` (hoặc `senderId` của tin chỉ ảnh) là object có khoá `toString` không gọi được, vd `{"toString": 1}`, làm `ingest()` ném `TypeError: Cannot convert object to primitive value`; qua HTTP, `main.ts` bắt lỗi và trả 500 cho CẢ LÔ — cùng loại sự cố lời giao muốn chặn. Còn `group` là object thường (`{"a":1}` và `{"b":2}`) thì cả hai thành chuỗi `[object Object]` khi băm, nên hai tin cùng `ts` + cùng text ở hai «nhóm» khác nhau ra cùng `sourceId` và tin sau bị bỏ là trùng (`duplicates 1`).
  - Căn cứ: kiểm hợp lệ chỉ có `!b.agent_id || !b.group` (dòng 156, có từ 989ac48, 19/10), không kiểm `typeof === "string"`; `sourceIdOf` nội suy `${group}` (dòng 138) và `${extra.senderId ?? ""}` (dòng 145). Đã kiểm ngữ nghĩa JS bằng `node -e` (chỉ nội suy chuỗi, không chạy ingest): `JSON.parse('{"toString":1}')` nội suy ném TypeError; `{"a":1}` ra `[object Object]`. Không tái hiện qua `ingest()` vì lượt chấm chỉ chạy lệnh `config:` của evals. Chỉ người cầm khoá API mới gửi được; hook thật gửi `group` là chuỗi.
  - file: `collector/src/api/server.ts` (dòng 138, 145, 156)
  - severity: thấp
  - Đề xuất: known-limits
- **Một lô hơn 5000 tin làm `flush()` lặp vô hạn, treo cả tiến trình collector API**
  - Người dùng thấy gì: khi có `stateDir` (đúng cấu hình `main.ts`), một lượt flush có hơn 5000 item làm vòng `while (seen.size + newIds.length > 5000 && newIds.length > 0)` không bao giờ dừng: `seen.delete(seen.values().next().value)` xoá tới khi `seen` rỗng, sau đó `seen.size` bằng 0 mà `newIds.length` vẫn lớn hơn 5000, không có gì bị xoá nữa. Vòng lặp đồng bộ chặn event loop: API ngừng trả lời, handler SIGTERM không chạy, launchd không tự khởi động lại vì tiến trình vẫn sống. Lô nhỏ hơn không treo, nhưng vòng này vẫn đếm hai lần các id mới (chúng đã nằm trong `seen` từ lúc ingest), nên bộ nhớ khử trùng bị xoá bớt nhiều hơn mức cần.
  - Căn cứ: đọc code dòng 276–287 (có từ f7bc1756, 19/10, KHÔNG thuộc diff của 62eaf38); `ingest` giới hạn `seen` ở 5000 (dòng 183) nhưng không giới hạn số tin mỗi lô, và `readBody` không giới hạn cỡ body. Suy từ code, chưa chạy.
  - file: `collector/src/api/server.ts` (dòng 183, 276–287)
  - severity: thấp (cần một POST hơn 5000 tin; hook gửi từng tin một)
  - Đề xuất: new-contract

## Analyst

Baseline khong do: lượt chấm vòng 2 không chạy làn baseline trên diffBase (`origin/main`). Chỉ chạy 10 eval trên cây đã kiểm (7e99360), nên mọi khối mang `baseline: n-a`. Không có số liệu để xếp eval nào vào nhóm non-discriminating.

## Variance

none — mọi eval chạy một lần, tất định; E1/E2, E4/E5, E6/E7 dùng chung lệnh và cho kết quả giống hệt nhau giữa hai lượt chạy.

## Iterations

Round 1: E1–E9 đạt (9/9). Ngoài hợp đồng ghi một lỗi ném `TypeError` khi `url` không phải chuỗi mà `path` là chuỗi — để người ký quyết định xử lý trước hay sau merge.
Round 2: E1–E10 đạt (10/10) trên 7e99360 (main + 62eaf38). Lỗi ngoài hợp đồng vòng 1 (nay là AC-10) đã sửa; suite collector 48/48 xanh sau khi xoá dist. Ngoài hợp đồng mới: hai đường khó gặp (`group`/`senderId` là object; lô hơn 5000 tin) — đều có từ trước diff này.
