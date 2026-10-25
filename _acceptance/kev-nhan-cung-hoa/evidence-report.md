---
schema_version: 2
feature_slug: kev-nhan-cung-hoa
verdict: PASS
failed_evals: []
reason:
verified_by: feature-loop:cham-lenh (fresh-context verification subagent)
enforcement_mode: strict
bypass_used: false
verified_commit: 664d587a98dd5f5c5719d8f4ee2d8ac7ecb3f172
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

## Evidence

- eval: E1
  run_id: kev-nhan-cung-hoa-E1-20261024T093433Z
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.zc1b_media_junk
  verified_at: 2026-10-24T09:34:33Z
  output: |
    > tsc -p tsconfig.json
    ok   ingest không ném lỗi với 5 kiểu media rác
    ok   lô có media rác trả 202, được 202
    ok   cả 6 tin trong lô được nhận (gồm tin lành), được {"accepted":6,"duplicates":0}
    ok   flush ghi đủ 6 item, được 6
    ok   tin lành cùng lô có trong snapshot
    MEDIA-JUNK PASS

- eval: E2
  run_id: kev-nhan-cung-hoa-E2-20261024T093440Z
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.zc1b_media_junk
  verified_at: 2026-10-24T09:34:40Z
  output: |
    > tsc -p tsconfig.json
    ok   ingest không ném lỗi với 5 kiểu media rác
    ok   lô có media rác trả 202, được 202
    ok   cả 6 tin trong lô được nhận (gồm tin lành), được {"accepted":6,"duplicates":0}
    ok   flush ghi đủ 6 item, được 6
    ok   tin lành cùng lô có trong snapshot
    MEDIA-JUNK PASS
    (5 kiểu rác trong cùng lô: media chuỗi, null, object, mảng [null, ảnh], mảng [{type}, 7, "s"])

- eval: E3
  run_id: kev-nhan-cung-hoa-E3-20261024T093446Z
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.zc1b_payload_intact
  verified_at: 2026-10-24T09:34:46Z
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
  run_id: kev-nhan-cung-hoa-E4-20261024T093452Z
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.zc1b_dedup_norm
  verified_at: 2026-10-24T09:34:52Z
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
  run_id: kev-nhan-cung-hoa-E5-20261024T093457Z
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.zc1b_dedup_norm
  verified_at: 2026-10-24T09:34:57Z
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
  run_id: kev-nhan-cung-hoa-E6-20261024T093503Z
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.zc1b_legacy_id
  verified_at: 2026-10-24T09:35:03Z
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
  run_id: kev-nhan-cung-hoa-E7-20261024T093508Z
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.zc1b_legacy_id
  verified_at: 2026-10-24T09:35:08Z
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
  run_id: kev-nhan-cung-hoa-E8-20261024T093513Z
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.zc1b_bad_text
  verified_at: 2026-10-24T09:35:13Z
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
  run_id: kev-nhan-cung-hoa-E9-20261024T093521Z
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.collector
  verified_at: 2026-10-24T09:36:07Z
  output: |
    ✔ MỞ LẠI 2310-6: tin chữ ' abc ' (khoảng trắng 2 đầu) GIỮ id legacy; payload NGUYÊN VẸN; text không chuỗi không 500 (6.194ms)
    ✔ readBody: ký tự Việt split giữa 2 chunk vẫn nguyên vẹn (0.938375ms)
    ℹ tests 45
    ℹ suites 0
    ℹ pass 45
    ℹ fail 0
    ℹ cancelled 0
    ℹ skipped 0
    ℹ todo 0
    ℹ duration_ms 45093.39325

## Known limits

- Text toàn khoảng trắng KHÔNG kèm ảnh đổi `sourceId` so với công thức cũ — ĐÚNG như ## Notes nêu. Đọc `collector/src/api/server.ts`: `textTrimmedEmpty` đúng thì text đem băm là `""`, `mediaForHash = normMedia(undefined) = []`, và vì `!text && extra` nên băm thêm `|senderId|` (danh sách URL rỗng). Công thức trên `origin/main` băm `group|ts|"   "` (text có ký tự nên đi nhánh legacy). Đo trên bản build ở commit đã kiểm (thư mục tạm, không mở cổng): tin `"   "` không ảnh ra id `4d1155ea…`, còn công thức cũ ra `44d0b885…` — hai id khác nhau. Hệ quả: tin loại này đã có trong raw cũ, nếu được gửi lại sau khi triển khai, sẽ không bị khử trùng (nhân đôi một lần). Ca hiếm, không phải tiêu chí của hợp đồng.
- Làn baseline (chạy eval trên `origin/main` @ 91ac403) KHÔNG được đo ở lượt chấm này, nên mọi khối mang `baseline: n-a`. Ghi chú «biết đỏ» trong contract (đỏ ở media-junk, payload-intact, dedup-norm, legacy-id trên `origin/main`) là lời của người dựng hồ sơ, người chấm chưa tự xác nhận.
- Mọi eval E1–E8 gọi `ingest()` trực tiếp, không qua `handle()` HTTP; con đường HTTP (parse JSON, 500 ở `main.ts`) chỉ được phủ gián tiếp bởi suite E9.

## Ngoài hợp đồng

- Lỗi: phần tử media có `url` KHÔNG phải chuỗi nhưng `path` là chuỗi (vd `{ url: 5, path: "/a.jpg" }` hoặc `{ url: {}, path: "/a.jpg" }`) trong một tin chỉ ảnh làm `ingest()` NÉM `TypeError: s.trim is not a function`. Nguyên nhân: `normMedia` giữ phần tử khi `url` HOẶC `path` là chuỗi, nhưng `sourceIdOf` lấy `m.url ?? m.path` — `5` không phải nullish nên `normRef(5)` được gọi. Qua HTTP, `main.ts` bắt lỗi và trả 500 cho CẢ LÔ — đúng loại sự cố mà lời giao muốn chặn (media rác làm 500 cả lô). Đã tái hiện bằng bản build trong thư mục tạm. Sửa gợi ý: chọn `typeof m.url === "string" ? m.url : m.path` trong `sourceIdOf` (hoặc để `normMedia` trả về chuỗi tham chiếu đã chọn).
- Rủi ro khử trùng nhầm: phần tử có `url: ""` (chuỗi rỗng) và `path` khác nhau thì `m.url ?? m.path` trả `""`, bị lọc bỏ, `path` không vào băm — hai tin chỉ ảnh cùng nhóm/ts/sender nhưng khác `path` bị gộp (tin sau mất, `duplicates 1`). Đã tái hiện. Ca hiếm.
- Tên test trong `collector/src/test/kev-nhan-cung-hoa.test.ts` («query rác / slash cuối / whitespace») nhắc «slash cuối» nhưng test không kiểm slash, và `normRef` cũng không bỏ dấu `/` cuối (đo: `a.jpg` và `a.jpg/` ra hai id). Hợp đồng không đòi chuẩn hoá slash nên không phải lỗi AC, chỉ là tên test nói quá.

## Analyst

Baseline khong do: lượt chấm vòng 1 không chạy làn baseline trên diffBase (`origin/main` @ 91ac403) — chỉ chạy 9 eval trên cây đã kiểm; mọi khối mang `baseline: n-a`. Không có số liệu để xếp eval nào vào nhóm non-discriminating.

## Variance

none — mọi eval chạy một lần, tất định; E1/E2, E4/E5, E6/E7 dùng chung lệnh và cho kết quả giống hệt giữa hai lượt chạy.

## Iterations

Round 1: E1–E9 đạt (9/9). Ngoài hợp đồng ghi một lỗi ném `TypeError` khi `url` không phải chuỗi mà `path` là chuỗi — để người ký quyết định xử lý trước hay sau merge.
