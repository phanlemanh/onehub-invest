---
schema_version: 2
feature_slug: hook-zalo-spool
verdict: PASS
failed_evals: []
reason:
verified_by: "feature-loop:cham-lenh (fresh-context verification subagent)"
enforcement_mode: strict
bypass_used: false
verified_commit: 067d81a57bf3e34898d715cad489997c08cb9e41
human_signoff: Mạnh 2026-10-25
---

# Evidence Report: hook-zalo-spool

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
| E9 | AC-9 | script | PASS |
| E10 | AC-10 | test | PASS |

## Evidence

- eval: E1
  run_id: hook-zalo-spool-E1-r3-20261024T233844Z
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.zc6_spool_replay
  verified_at: 2026-10-24T23:38:44Z
  output: |
    ok   lượt collector chết: hook thoát bình thường
    ok   spool có đúng 2 tệp (tin trùng không nhân tệp), được 2
    ok   log có dòng 'spool +1' cho tin vào spool
    ok   should-NOT-fire: lúc collector chết không có dòng ' post 202'
    ok   collector sống lại nhận đủ A, B (từ spool) và D (tin mới)
    ok   A chỉ tới collector MỘT lần dù hook nhận hai lần
    ok   spool rỗng sau khi xả, còn 0
    SPOOL-REPLAY PASS

- eval: E2
  run_id: hook-zalo-spool-E2-r3-20261024T233849Z
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.zc6_spool_replay
  verified_at: 2026-10-24T23:38:49Z
  output: |
    ok   spool có đúng 2 tệp (tin trùng không nhân tệp), được 2
    ok   collector sống lại nhận đủ A, B (từ spool) và D (tin mới)
    ok   A chỉ tới collector MỘT lần dù hook nhận hai lần
    ok   spool rỗng sau khi xả, còn 0
    ok   tin gửi kèm meta kev.p là số khi Kev sống
    SPOOL-REPLAY PASS

- eval: E3
  run_id: hook-zalo-spool-E3-r3-20261024T233854Z
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.zc6_spool_replay
  verified_at: 2026-10-24T23:38:54Z
  output: |
    ok   dòng log tin mới đúng khuôn cũ ' post 202 {"accepted":1…} group=…' (được: post 202 {"accepted":1,"duplicates":0} group=acc-group p=0.90 account=acc by=acc)
    ok   tin gửi kèm meta kev.p là số khi Kev sống
    SPOOL-REPLAY PASS

- eval: E4
  run_id: hook-zalo-spool-E4-r3-20261024T233859Z
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.zc6_reject_4xx
  verified_at: 2026-10-24T23:39:00Z
  output: |
    ok   3 tin vào spool lúc chết, được 3
    ok   tin lành sau tin 400 vẫn được gửi (400 không chặn hàng)
    ok   tin 400 chuyển sang rejected/ (rejected=1, spool=0)
    ok   log có 'spool-rejected 400'
    ok   should-NOT-fire: tin 400 không bị gửi lại ở lượt sau
    ok   should-NOT-fire: 503 là lỗi tạm — tin ở lại spool, không sang rejected/
    REJECT-4XX PASS

- eval: E5
  run_id: hook-zalo-spool-E5-r3-20261024T233904Z
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.zc6_hang_stop
  verified_at: 2026-10-24T23:39:21Z
  output: |
    ok   3 tin vào spool lúc chết
    ok   collector treo: chỉ 2 lượt gửi (1 tệp spool đầu + tin mới) rồi dừng, được 2
    ok   lượt hook kết thúc trong 16 giây (< 25)
    ok   4 tệp còn trong spool (3 cũ + tin mới), được 4
    HANG-STOP PASS

- eval: E6
  run_id: hook-zalo-spool-E6-r3-20261024T233926Z
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.zc6_cap_50
  verified_at: 2026-10-24T23:39:26Z
  output: |
    ok   55 tin vào spool, được 55
    ok   một lượt xả đúng 50 tệp + 1 tin mới = 51 lượt gửi, được 51
    ok   còn 5 tệp chờ lượt sau, được 5
    ok   lượt kế xả nốt 5 tệp
    CAP-50 PASS

- eval: E7
  run_id: hook-zalo-spool-E7-r3-20261024T233931Z
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.zc6_kev_hang
  verified_at: 2026-10-24T23:39:36Z
  output: |
    ok   tin vẫn tới collector với kev.p = null (được null)
    ok   hook chờ Kev có trần (~5 giây), chạy 5 giây
    ok   log ghi 'kev null'
    KEV-HANG PASS

- eval: E8
  run_id: hook-zalo-spool-E8-r3-20261024T233942Z
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.zc6_self_contained
  verified_at: 2026-10-24T23:39:42Z
  output: |
    ok   handler chỉ import module node: (node:fs/promises, node:crypto, node:os, node:path)
    ok   handler không trỏ tới bản build/nguồn của collector
    ok   bản chép handler nằm ngoài kho
    ok   chạy từ ngoài kho: collector chết → tin vào spool (logic spool có mặt)
    SELF-CONTAINED PASS

- eval: E9
  run_id: hook-zalo-spool-E9-r3-20261024T233947Z
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.zc6_l1_grep
  verified_at: 2026-10-24T23:39:47Z
  output: |
    ok   handler không khớp biểu thức L1 của watchdog (0 dòng khớp)
    ok   watchdog L1 vẫn trỏ đúng tệp handler duy nhất
    L1-GREP PASS

- eval: E10
  run_id: hook-zalo-spool-E10-r3-20261024T233952Z
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.collector_test_clean
  verified_at: 2026-10-24T23:40:38Z
  output: |
    > tsc -p tsconfig.json && node --test 'dist/test/*.test.js'
    ✔ ZC6 vòng 3: khuôn log cũ ' post 202 '; drain dừng ở file hỏng đầu; 4xx → rejected không gửi lại (15045.85275ms)
    ✔ ZC6 tự chứa: từ thư mục NGOÀI repo — collector chết 2 tin → spool 2; sống → drain đủ, không trùng; kev treo → p=null (20034.630416ms)
    ✔ readBody: ký tự Việt split giữa 2 chunk vẫn nguyên vẹn (1.001375ms)
    ℹ tests 41
    ℹ pass 41
    ℹ fail 0
    ℹ cancelled 0
  note: vòng 3 — evals.yaml E10 khai đúng config:executors.script.collector_test_clean (sửa ở 83a1e96). Sau khi xoá dist, collector/dist/test còn đúng 8 tệp .js ứng với 8 tệp collector/src/test/*.ts trong cây (api, conduct, graceful-shutdown-integration, graceful-shutdown, hook-spool, kev-nhan, media-fetch, readbody); tệp mồ côi kev-nhan-cung-hoa.test.js của vòng 1 không còn.

## Known limits

- Hai giới hạn khai ở Out of scope được xác nhận ĐÚNG khi đọc collector/openclaw/handler.js:
  - Tin gửi lại từ spool không ghi dòng ` post 202`: nhánh r.ok trong drainSpool (dòng 99–102) chỉ rm tệp và tăng
    biến `sent`, không log gì (biến `sent` còn không được dùng) → phễu Ops đếm thiếu đúng số tin đi qua spool, và cũng
    không có dòng nào cho biết một lượt đã xả bao nhiêu tệp.
  - Tệp JSON hỏng nằm lại mãi: JSON.parse lỗi → `continue` (dòng 93–97) bên trong vòng `files.slice(0, 50)` → tệp
    không bị xoá/chuyển, vẫn chiếm một chỗ trong trần 50. Hệ quả thêm: nếu ≥50 tệp hỏng đứng đầu thứ tự tên, các tệp
    lành phía sau không bao giờ được xả (tin mới vẫn gửi thẳng được).
- Thứ tự xả theo tên băm (sort chuỗi hex), không theo thời gian — tin cũ không chắc đi trước; không mất dữ liệu vì ts
  nằm trong payload.
- Spool đặt tên theo băm (group, ts, text, senderId, url ảnh): hai tin khác nhau trùng đủ năm trường (cùng người, cùng
  nhóm, cùng chữ, cùng mốc ms) gộp làm một tệp — tương đương dedup của server, chấp nhận được.
- Các eval chưa phủ: 408/429 (AC-4 nhắc, harness chỉ thử 503); tổ hợp Kev treo CÙNG collector treo (trần lý thuyết
  ~5 + 8 + 8 = 21 giây, vẫn dưới 25 nhưng không đo); lượt hook chạy song song.

## Ngoài hợp đồng

**Lỗi cấu hình khoá (401) hay sai đường (404) đẩy MỌI tin trong thời gian lỗi sang rejected/ vĩnh viễn**
- Người dùng thấy gì: khi tệp khoá `oneinvest-agent.key` bị xoay lệch hoặc collector khởi động với danh sách khoá rỗng
  (api.test: «keys rỗng → 401 mọi request, fail closed»), mỗi tin mới nhận 401 → vào spool → lượt kế nhận 401 → chuyển
  sang `spool/rejected/` kèm log `spool-rejected 401`. Sửa khoá xong, các tin này KHÔNG tự gửi lại; Ops thấy hố dữ liệu
  cho tới khi có người chép tay rejected/ về spool. Tin không mất trên đĩa nhưng ra khỏi đường xả.
- Căn cứ: điều kiện `r.status >= 400 && r.status < 500 && r.status !== 408 && r.status !== 429` coi 401/403/404 là
  vĩnh viễn ngang với 400; cả tin mới lẫn tin spool đều đi qua nhánh này.
- file: collector/openclaw/handler.js:104–109 (và :223–227)
- severity: medium (tin không mất trên đĩa; trước ZC6 tin 401 mất hẳn nên đây không phải lùi bước, nhưng đường phục
  hồi là tay và không ai được báo ngoài dòng log)
- Đề xuất: new-contract (coi 401/403/404 là tạm, hoặc thêm lệnh/bước «replay rejected» có kiểm)

**Collector chậm-mà-sống làm lượt hook vượt xa 25 giây**
- Người dùng thấy gì: AC-5 chỉ chặn trường hợp collector treo hẳn (dừng ở tệp đầu sau 8 giây). Nếu collector trả 2xx
  nhưng chậm, mỗi yêu cầu gần 8 giây, vòng xả không dừng: một lượt có thể kéo tới ~5 (Kev) + 50 × 8 + 8 ≈ 413 giây,
  trong tiến trình gateway Zalo.
- Căn cứ: drainSpool chỉ `return` khi một tệp HỎNG; không có ngân sách thời gian tổng cho cả lượt, chỉ timeout 8 giây
  mỗi fetch.
- file: collector/openclaw/handler.js:58–71, 83–114
- severity: medium (cần collector chậm bất thường; tác động là gateway chờ hook, đúng loại rủi ro ZC6 muốn tránh)
- Đề xuất: new-contract (trần thời gian tổng cho vòng xả, ví dụ dừng khi đã tiêu > N giây)

**Tệp spool và rejected/ mang PII tầng A với quyền đọc mặc định theo umask**
- Người dùng thấy gì: không có gì trên giao diện; trên máy, tệp spool chứa text, senderName, senderId, conversationId
  của tin Zalo được tạo bằng mkdir/writeFile không chỉ định mode → thường 0755/0644 (đọc được bởi user khác trên máy nếu
  thư mục cha cho đi qua).
- Căn cứ: `mkdir(SPOOL_DIR, { recursive: true })`, `writeFile(..., { flag: "wx" })`, `mkdir(SPOOL_REJECTED, …)` không có
  `mode`. Thư mục home macOS thường chặn user khác nên rủi ro thực tế thấp; tệp log `oneinvest-zalo-pipe.log` (có sẵn
  từ trước) cũng cùng tình trạng.
- file: collector/openclaw/handler.js:47–52, 106
- severity: low
- Đề xuất: known-limits (hoặc thêm `mode: 0o700`/`0o600` trong một vòng nhỏ)

**Tệp spool chứa JSON `null` làm ngừng giao MỌI tin**
- Người dùng thấy gì: nếu một tệp spool parse ra `null`, `rec.group` ném TypeError ra khỏi drainSpool (không nằm trong
  try riêng) → nhánh catch ngoài spool tin mới thay vì gửi → mọi lượt sau lặp lại → collector không nhận tin nào tới khi
  có người xoá tệp. Không mất tin, nhưng ống đứng im lặng (log chỉ ghi `post-error → spool`).
- Căn cứ: `rec = JSON.parse(...)` nằm trong try, nhưng `postOne(key, rec.group, rec.message)` ở ngoài; spoolPut chỉ ghi
  object nên chỉ hỏng đĩa/sửa tay mới tạo được tệp như vậy. Đây là ngoại lệ của mô tả «tệp hỏng bị bỏ qua, không chặn
  hàng» ở Out of scope.
- file: collector/openclaw/handler.js:92–98, 219–239
- severity: low (xác suất rất thấp)
- Đề xuất: known-limits

**Sự kiện dị dạng vẫn làm hook ném lỗi ra gateway và mất tin (có từ trước ZC6)**
- Người dùng thấy gì: `ev.content` không phải chuỗi (`.trim` không tồn tại), `ev.media` không phải mảng (`.filter`
  không tồn tại) hoặc `ev.timestamp` là số không hợp lệ như NaN (`toISOString` ném RangeError) đều ném lỗi TRƯỚC khối
  try → hook ném ra gateway, trái câu đầu tệp «Không ném lỗi», và tin đó không vào spool.
- Căn cứ: dòng 175, 181, 199–202 nằm ngoài try/catch; ba dòng này giống hệt bản origin/main nên không do ZC6 gây ra,
  nhưng ZC6 hứa «không mất tin» và đây là đường mất tin còn lại.
- file: collector/openclaw/handler.js:175, 181–184, 199–202
- severity: low (runtime OpenClaw hiện gửi đúng kiểu; chỉ lộ khi đổi phiên bản runtime — chính lý do có đoạn «đọc
  phòng thủ cả ba»)
- Đề xuất: known-limits

## Analyst

Baseline khong do: người chấm không chạy làn baseline (diffBase) ở vòng này; theo Notes của hợp đồng, tác giả hồ sơ đã
kiểm harness biết đỏ trước verify (bd51084 đỏ ở spool-replay, reject-4xx, hang-stop, cap-50; handler origin/main đỏ ở cả
6 chế độ chạy handler). l1-grep (E9) và E10 là chốt hồi quy, dự kiến xanh trên cả hai cây.

Bất thường khác:
- Chú thích AC trong scripts/hook-zalo-spool/acceptance.mjs lệch số so với contract (harness ghi «AC-3» cho 4xx,
  «AC-4» cho hang, «AC-5» cho cap-50); evals.yaml ánh xạ đúng — chỉ là chú thích.
- Đính chính số đếm của vòng 1: vòng 1 ghi «44 test của 8 tệp nguồn đều xanh», nhưng 8 tệp nguồn có 41 test (vòng 2 đo);
  47 − 41 = 6 test thuộc tệp mồ côi kev-nhan-cung-hoa.test.js (3 xanh, 3 đỏ). Kết luận BLOCKED vòng 1 không đổi.
- Giữa vòng 1 và vòng 3 chỉ đổi tệp trong `_acceptance/hook-zalo-spool/` (git diff b8e2a25..83a1e96 không chạm tệp
  sản phẩm, harness hay config.yaml); collector/openclaw/handler.js giống hệt vòng 1, các dòng trích ở «Ngoài hợp đồng»
  vẫn đúng.
- review-findings.md (vòng 2) liệt kê ba mục ngoài hợp đồng (401/403/404 → rejected/, collector chậm-mà-sống,
  quyền tệp spool), cả ba đã có ở «Ngoài hợp đồng» dưới đây từ vòng 1.

## Variance

none — không eval nào khai runs > 1; E1–E3 chạy chung một lệnh ba lần riêng, cả ba cho kết quả giống nhau (và giống vòng 1, vòng 2).

## Iterations

Round 1: E1–E9 đạt; E10 BLOCKED — dist/test của collector còn bản biên dịch mồ côi của nhánh zcode/kev-nhan-cung-hoa,
3 test đỏ từ tệp đó; chữa bằng chạy lại E10 với dist sạch, không trả về làn code.
Round 2: E1–E9 đạt; E10 BLOCKED — cmd trỏ config:executors.test.collector_test_clean (khoá không tồn tại, khoá thật ở
executors.script); chuỗi lệnh của khoá thật chạy xanh 41/41; chữa bằng sửa cmd của E10 trong evals.yaml, không trả về làn code.
Round 3: E1–E10 đạt — E10 trỏ đúng executors.script.collector_test_clean, 41/41 test collector xanh; code sản phẩm
không đổi so với vòng 1–2.

### Re-pin lần 1 — 2026-10-25, do gộp origin/main 33adaa4 trước merge (sau next typegen)
run_id: repin-20261025T003551Z-82841
sha: 3b34af16e0b410121ecc12d0012a0505fd146baf · suites: 6 lệnh exit 0 · evals: 10/10 eval máy đạt kỳ vọng

### Re-pin lần 2 — 2026-10-25, do gộp origin/main 8731f81 (sau #74)
run_id: repin-20261025T004657Z-58384
sha: 067d81a57bf3e34898d715cad489997c08cb9e41 · suites: 6 lệnh exit 0 · evals: 10/10 eval máy đạt kỳ vọng
