---
schema_version: 2
feature_slug: hook-spool-nghiem-ngat
verdict: PASS
failed_evals: []
reason:
verified_by: feature-loop:cham-lenh
enforcement_mode: strict
bypass_used: false
verified_commit: 1b3b28f3b14384ddea5a16710fb23733da364d1b
human_signoff:
---

# Evidence Report: hook-spool-nghiem-ngat

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | script | PASS |
| E2 | AC-2 | script | PASS |
| E3 | AC-3 | script | PASS |
| E4 | AC-3 | script | PASS |
| E5 | AC-4 | script | PASS |
| E6 | AC-5 | script | PASS |
| E7 | AC-6 | script | PASS |
| E8 | AC-7 | script | PASS |
| E9 | AC-8 | script | PASS |
| E10 | AC-9 | script | PASS |
| E11 | AC-10 | script | PASS |

## Evidence

- eval: E1
  run_id: hook-spool-nghiem-ngat-E1-r1-20261025T070443Z
  exit_code: 0
  baseline: red
  verifier: config:executors.script.hsn_auth_held
  verified_at: 2026-10-25T07:04:43Z
  output: |
    ok   401: should-NOT-fire — không tệp nào sang rejected/ (được 0)
    ok   401: 3 tin cũ vẫn ở spool sau hai lượt bị 401 (spool=5)
    ok   401: should-NOT-fire — không có dòng 'spool-rejected 401'
    ok   403: should-NOT-fire — không tệp nào sang rejected/ (được 0)
    ok   403: should-NOT-fire — không có dòng 'spool-rejected 403'
    ok   404: should-NOT-fire — không tệp nào sang rejected/ (được 0)
    ok   404: 3 tin cũ vẫn ở spool sau hai lượt bị 404 (spool=5)
    ok   404: should-NOT-fire — không có dòng 'spool-rejected 404'
    AUTH-HELD PASS

- eval: E2
  run_id: hook-spool-nghiem-ngat-E2-r1-20261025T070444Z
  exit_code: 0
  baseline: red
  verifier: config:executors.script.hsn_auth_held
  verified_at: 2026-10-25T07:04:44Z
  output: |
    ok   401: sửa khoá xong (collector trả 202) → 3 tin cũ tự được gửi lại
    ok   401: spool rỗng sau lượt collector lành, còn 0
    ok   403: sửa khoá xong (collector trả 202) → 3 tin cũ tự được gửi lại
    ok   403: spool rỗng sau lượt collector lành, còn 0
    ok   404: sửa khoá xong (collector trả 202) → 3 tin cũ tự được gửi lại
    ok   404: spool rỗng sau lượt collector lành, còn 0
    AUTH-HELD PASS
  note: hai dòng riêng của E2 xanh cả trên baseline (xem Analyst); phép thử bổ sung của người chấm đếm yêu cầu SAU khi sửa khoá — 6 tin tới collector gồm k-1, k-2, k-3 cũ, spool rỗng, rejected rỗng.

- eval: E3
  run_id: hook-spool-nghiem-ngat-E3-r1-20261025T070445Z
  exit_code: 0
  baseline: red
  verifier: config:executors.script.hsn_auth_held
  verified_at: 2026-10-25T07:04:45Z
  output: |
    ok   401: đúng MỘT dòng 'spool-held 401' mỗi lượt xả — 2 lượt = 2 dòng (được 2)
    ok   403: đúng MỘT dòng 'spool-held 403' mỗi lượt xả — 2 lượt = 2 dòng (được 2)
    ok   404: đúng MỘT dòng 'spool-held 404' mỗi lượt xả — 2 lượt = 2 dòng (được 2)
    AUTH-HELD PASS

- eval: E4
  run_id: hook-spool-nghiem-ngat-E4-r1-20261025T070509Z
  exit_code: 0
  baseline: red
  verifier: config:executors.script.hsn_held_then_hang
  verified_at: 2026-10-25T07:05:09Z
  output: |
    ok   lượt kết thúc trong 16 giây (< 25)
    ok   dòng 'spool-held 401' vẫn ra dù lượt dừng giữa chừng vì collector treo (được 1)
    ok   should-NOT-fire: không tệp nào sang rejected/
    HELD-THEN-HANG PASS

- eval: E5
  run_id: hook-spool-nghiem-ngat-E5-r1-20261025T070514Z
  exit_code: 0
  baseline: green
  verifier: config:executors.script.hsn_reject_perm
  verified_at: 2026-10-25T07:05:14Z
  output: |
    ok   400: tin 400 sang rejected/, hàng không kẹt (rejected=1, spool=0)
    ok   400: tin lành sau tin 400 vẫn được gửi
    ok   400: log có 'spool-rejected 400'
    ok   400: should-NOT-fire — không có dòng 'spool-held 400'
    ok   413: tin 413 sang rejected/, hàng không kẹt (rejected=1, spool=0)
    ok   413: should-NOT-fire — không có dòng 'spool-held 413'
    ok   422: tin 422 sang rejected/, hàng không kẹt (rejected=1, spool=0)
    ok   422: should-NOT-fire — không có dòng 'spool-held 422'
    REJECT-PERM PASS

- eval: E6
  run_id: hook-spool-nghiem-ngat-E6-r1-20261025T070516Z
  exit_code: 0
  baseline: red
  verifier: config:executors.script.hsn_tam_thoi
  verified_at: 2026-10-25T07:05:16Z
  output: |
    ok   409: giữ lại spool, không rejected (spool=2, rejected=0)
    ok   409: một dòng 'spool-held 409' (được 1)
    ok   410: giữ lại spool, không rejected (spool=2, rejected=0)
    ok   410: một dòng 'spool-held 410' (được 1)
    ok   408: should-NOT-fire — tin ở lại spool, không sang rejected/ (spool=3, rejected=0)
    ok   408: collector lành lại → xả hết, còn 0
    ok   429: should-NOT-fire — tin ở lại spool, không sang rejected/ (spool=3, rejected=0)
    ok   503: collector lành lại → xả hết, còn 0
    TAM-THOI PASS

- eval: E7
  run_id: hook-spool-nghiem-ngat-E7-r1-20261025T070637Z
  exit_code: 0
  baseline: red
  verifier: config:executors.script.hsn_budget
  verified_at: 2026-10-25T07:06:37Z
  output: |
    ok   20 tin vào spool, được 20
    ok   lượt hook đầu kết thúc trong 15 giây (< 20; trước vòng này ~63 giây)
    ok   lượt đầu chỉ gửi vài tệp trong trần 10 giây rồi dừng (được 5 lượt gửi)
    ok   should-NOT-fire: hết trần thì DỪNG — còn 16 tệp chờ lượt sau
    ok   sau vài lượt mọi tin đều tới collector (không mất tin)
    ok   không tin nào tới collector hai lần
    ok   spool rỗng cuối cùng, còn 0
    BUDGET PASS

- eval: E8
  run_id: hook-spool-nghiem-ngat-E8-r1-20261025T070642Z
  exit_code: 0
  baseline: red
  verifier: config:executors.script.hsn_budget_env
  verified_at: 2026-10-25T07:06:42Z
  output: |
    ok   trần 2 giây × 1,5 giây mỗi yêu cầu: xả 1–3 tệp spool (được 2)
    ok   lượt kết thúc trong 5 giây (< 10)
    ok   còn ≥ 7 tệp chờ lượt sau, được 8
    BUDGET-ENV PASS

- eval: E9
  run_id: hook-spool-nghiem-ngat-E9-r1-20261025T070711Z
  exit_code: 0
  baseline: green
  verifier: config:executors.script.hsn_zc6_regress
  verified_at: 2026-10-25T07:07:11Z
  output: |
    SPOOL-REPLAY PASS
    REJECT-4XX PASS
    HANG-STOP PASS
    CAP-50 PASS
    KEV-HANG PASS
    SELF-CONTAINED PASS

- eval: E10
  run_id: hook-spool-nghiem-ngat-E10-r1-20261025T070712Z
  exit_code: 0
  baseline: green
  verifier: config:executors.script.hsn_l1_syntax
  verified_at: 2026-10-25T07:07:12Z
  output: |
    ok   handler không khớp biểu thức L1 của watchdog (0 dòng khớp)
    ok   watchdog L1 vẫn trỏ đúng tệp handler duy nhất
    L1-GREP PASS
    SYNTAX OK

- eval: E11
  run_id: hook-spool-nghiem-ngat-E11-r1-20261025T070919Z
  exit_code: 0
  baseline: green
  verifier: config:executors.script.collector_test_clean
  verified_at: 2026-10-25T07:09:19Z
  output: |
    > tsc -p tsconfig.json && node --test 'dist/test/*.test.js'
    ✔ ZC6 vòng 3: khuôn log cũ ' post 202 '; drain dừng ở file hỏng đầu; 4xx vĩnh viễn (400/413/422) → rejected không gửi lại (15051.836458ms)
    ✔ ZC6 tự chứa: từ thư mục NGOÀI repo — collector chết 2 tin → spool 2; sống → drain đủ, không trùng; kev treo → p=null (20033.816666ms)
    ✔ 2410-23: 401 giữ lại spool (log 'spool-held <status>' MỘT dòng mỗi lượt), collector sống lại thì gửi được; collector chậm 3s/file → trần 10s CẢ LƯỢT, phần còn lại xả lượt sau (75101.091959ms)
    ℹ tests 49
    ℹ pass 49
    ℹ fail 0
    ℹ cancelled 0
  note: dist xoá trước khi build; dist/test có đúng 9 tệp ứng với 9 tệp collector/src/test/*.ts của cây (gồm kev-nhan-cung-hoa đã vào main) — không tệp mồ côi. hook-spool.test có 3 ca, cả 3 xanh.

## Known limits

- Trần 10 giây chỉ bao vòng xả spool, không bao cả lượt hook: tệp cuối bắt đầu ngay dưới trần vẫn chờ hết timeout 8 giây
  của nó (hợp đồng khai ở Out of scope), rồi tin mới của lượt còn một lần gửi 8 giây và Kev tối đa 5 giây. Phép thử của
  người chấm: collector chậm-mà-sống 7,5 giây mỗi yêu cầu → một lượt hook 22,6 giây, 3 yêu cầu (2 tệp spool + tin mới);
  trần lý thuyết khoảng 10 + 8 + 8 + 5 ≈ 31 giây. Trước vòng này cùng tình huống là tới vài phút.
- Tệp bị giữ vì 4xx «khác» (409/410…) ở lại spool vô hạn và bị gửi lại mỗi lượt, chiếm chỗ trong trần 50; collector
  hiện chỉ trả 202/400/401/404 (`collector/src/api/server.ts`) nên chưa có đường thật nào sinh ra tệp như vậy.

## Ngoài hợp đồng

- **408/429 không ghi dòng `spool-held`, trái chú thích của chính hàm xả**
  Người dùng thấy gì: Khi collector quá tải và trả 408 hoặc 429, log hook chỉ có các dòng `spool +1`, không dòng nào nêu mã lỗi, nên người trực Ops không biết vì sao tin đứng trong hàng đợi; tin không mất và tự xả khi collector lành.
  Căn cứ: Chú thích handler.js:78–79 nói 408/429 là tạm thời và log 'spool-held <status>', nhưng điều kiện dòng 111 loại 408/429 nên chúng rơi xuống nhánh dừng-xả dòng 123–125 (`break`, không log); phép thử cho 0 dòng `spool-held` và log không chứa mã; AC-5 chỉ đòi tin ở lại và xả được nên hợp đồng vẫn đạt.
  file: `collector/openclaw/handler.js`
  severity: low
  Đề xuất: known-limits

- **Biến `ONEINVEST_HOOK_DRAIN_BUDGET_MS` đặt rỗng, 0 hoặc âm làm spool không bao giờ được xả**
  Người dùng thấy gì: Nếu ai đó đặt biến này rỗng hoặc bằng 0 trong môi trường gateway, mọi tin đã vào hàng đợi nằm im mãi dù collector lành (tin mới vẫn đi thẳng); đặt bằng chữ thì trần biến mất.
  Căn cứ: Dòng 86 dùng `Number(...)` không kiểm giá trị; phép thử 3 lượt collector lành: rỗng, 0 và −1 đều còn 3/3 tệp, `abc` ra NaN nên không có trần; biến hiện không được đặt ở đâu ngoài test và harness nên xác suất thấp.
  file: `collector/openclaw/handler.js`
  severity: low
  Đề xuất: known-limits

## Analyst

Non-discriminating evals:
- E5 (reject-perm) xanh trên baseline — chốt hồi quy có chủ ý: hợp đồng Notes khai hành vi 400/413/422 không đổi.
- E9, E10, E11 xanh trên baseline — chốt hồi quy (ZC6, L1, test collector), dự kiến xanh cả hai cây.
- E1, E2, E3, E4, E6, E7, E8 đỏ trên baseline (phân biệt được). Riêng E2: lệnh chung auth-held đỏ trên baseline nhờ các
  dòng của E1/E3, còn hai dòng riêng của E2 («3 tin cũ tự được gửi lại», «spool rỗng») XANH cả trên baseline — vì
  `state.posts` còn chứa các lần gửi bị 401 trước khi sửa khoá, và trên baseline tệp đã sang rejected/ nên spool cũng
  rỗng. Kết luận AC-2 vẫn đứng nhờ chuỗi E1 (tệp còn spool, 0 rejected) + E2 (spool rỗng sau lượt 202) và phép thử bổ
  sung đếm yêu cầu sau khi sửa khoá; đề nghị lần sửa harness sau đếm `posts` từ mốc setMode("ok").

Baseline (làn A/B, chạy tay bởi người chấm):
- Cây baseline: bản chép trong thư mục tạm gồm scripts/hook-spool-nghiem-ngat/acceptance.mjs của nhánh +
  `git show origin/main:` của collector/openclaw/handler.js, scripts/hook-zalo-spool/acceptance.mjs,
  scripts/zalo-watchdog.sh. origin/main lúc chấm là e6d5d02 (đã tiến sau merge-base 10c26e0), nhưng ba tệp đó giống
  hệt giữa 10c26e0 và e6d5d02 nên baseline tương đương diffBase.
- Kết quả baseline: auth-held đỏ (12 mục: 4 tệp sang rejected/, 0 dòng spool-held, có dòng spool-rejected cho cả
  401/403/404); held-then-hang đỏ (0 dòng spool-held 401, có tệp sang rejected/); tam-thoi đỏ ở 409/410 (sang
  rejected/, không spool-held), xanh ở 408/429/503; budget đỏ (lượt đầu 63 giây, 21 lần gửi, 0 tệp còn lại);
  budget-env đỏ (xả 10 tệp, 17 giây); reject-perm xanh; hồi quy ZC6 sáu chế độ xanh; L1 + node --check xanh.
- E11 baseline: `git archive 10c26e0 collector` ra thư mục tạm, mượn node_modules, `rm -rf dist && npm test` → 48/48
  xanh (nhánh 49/49: thêm đúng một ca 2410-23).

Bất thường khác:
- run-log: E1/E2/E3 chung một lần chạy auth-held, mỗi eval một dòng run-log riêng (mã cách nhau một giây).
- Nhánh vẫn đứng trên merge-base 10c26e0; origin/main đã có thêm #96, #99, #100 (không chạm collector/), cần gộp
  main + ghim lại trước merge theo nếp của làn merge.

## Variance

none — không eval nào khai runs > 1; E1–E3 dùng chung một lần chạy auth-held.

## Iterations

Round 1: E1–E11 đạt; baseline đỏ ở E1–E4, E6–E8, xanh ở E5, E9–E11 (chốt hồi quy); hai mục ngoài hợp đồng mức thấp
(408/429 không log spool-held trái chú thích; biến trần rỗng/0/âm làm spool đứng) để người quyết ở Cổng 2.
