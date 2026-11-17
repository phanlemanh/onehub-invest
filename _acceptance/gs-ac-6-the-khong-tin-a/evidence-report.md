---
schema_version: 2
feature_slug: gs-ac-6-the-khong-tin-a
verdict: PASS
failed_evals: []
reason:
verified_by: feature-loop:cham-lenh
enforcement_mode: strict
bypass_used: false
verified_commit: 3bd9e62d9e61f26bb157d223c5ab66d698d82199
human_signoff:
---

# Evidence report: gs-ac-6-the-khong-tin-a (round 2)

Phiên chấm context sạch chạy ba eval trên commit 3bd9e62d9, DB máy thu :5433, không đặt biến CI. Mỗi eval chạy qua
`_acceptance/gs-ac-6-the-khong-tin-a/probes/kiem.sh`. Nhánh e1 và e2 của script chạy đúng lệnh cũ của vòng 1; nhánh e3 giữ
nguyên lệnh lọc, chỉ đổi cách quyết định (in tệp ngoài phạm vi thì exit 1). Từ vòng 1 tới nay không có thay đổi nào trong
`app/`. E1: cả 8 ca của `tests/the-so-gia-tri-song.test.tsx` xanh, ca «GS-AC-6 probe DB máy thu» chạy thật (✔, skipped 0).
Lượt đối chứng chạy bản `origin/main` của cùng tệp: ca này đỏ (exit 1). Câu cũ tính thêm 60 id thẻ (216026, 216027, …) vào
tập «Tin A rời kho» mà trang không vẽ Alert cho chúng. E2: ca dựng bằng CTE xanh. E3: ngoài hồ sơ và tệp máy sinh, nhánh chỉ
đổi `app/tests/the-so-gia-tri-song.test.tsx`; không tệp `app/src` nào đổi. Diff của tệp test so với main không nới khẳng
định nào: chỉ thay hai câu SQL bằng `roiKhoBen(ben)`, thêm điều kiện `jsonb_typeof(evidence-><bên>->'offer_id') = 'string'`
(khớp `sidesOf` trong `app/src/lib/ops/review-context.ts`) và thêm một ca mới.

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | test | PASS |
| E2 | AC-2 | test | PASS |
| E3 | AC-3 | script | PASS |

## Evidence

- eval: E1
  run_id: gs-ac-6-the-khong-tin-a-E1-r2-20261117T164000Z
  exit_code: 0
  baseline: red
  verifier: bash _acceptance/gs-ac-6-the-khong-tin-a/probes/kiem.sh e1
  verified_at: 2026-11-17T16:40:00Z
  output: |
    ✔ GS-AC-1/2 bảng so đọc giá trị sống (346.41125ms)
    ✔ GS-AC-3 Chưa rõ là Thiếu (13.73925ms)
    ✔ GS-AC-4/5/8 tin rời kho (197.160292ms)
    ✔ GS-AC-6 tập rời kho chỉ gồm thẻ có bên: thẻ entity_match không có offer_a không vào tập (chiều đỏ trên câu cũ) (11.07125ms)
    ✔ GS-AC-6 probe DB máy thu: tập thẻ có Alert bên A bằng tập Tin A rời kho (1342.105916ms)
    ℹ tests 8
    ℹ pass 8
    ℹ fail 0
    ℹ skipped 0
    (ghi chú chấm: ca probe có nhánh bỏ qua khi tập rỗng, có từ trước vòng này. Lượt này đã đọc đúng dòng ✔, không phải
     # SKIP, nên probe chạy thật như expected đòi.)
    --- đối chứng (2026-11-17T16:40:07Z): bản origin/main chép thành app/tests/zz-doi-chung-tam.test.tsx (đã xoá sau lượt chạy) ---
    cd app && node --import tsx --test --test-name-pattern 'GS-AC-6' tests/zz-doi-chung-tam.test.tsx → exit 1
    ✖ GS-AC-6 probe DB máy thu: tập thẻ có Alert bên A bằng tập Tin A rời kho (1438.915167ms)
      AssertionError [ERR_ASSERTION]: GS-AC-6 tập thẻ có Alert bên A lệch tập Tin A rời kho
      + actual - expected
      -   216026,
      -   216027,
      -   216028,
      ... (60 dòng id thừa ở phía expected)
    ℹ pass 0
    ℹ fail 1

- eval: E2
  run_id: gs-ac-6-the-khong-tin-a-E2-r2-20261117T164002Z
  exit_code: 0
  baseline: red
  verifier: bash _acceptance/gs-ac-6-the-khong-tin-a/probes/kiem.sh e2
  verified_at: 2026-11-17T16:40:02Z
  output: |
    ✔ GS-AC-6 tập rời kho chỉ gồm thẻ có bên: thẻ entity_match không có offer_a không vào tập (chiều đỏ trên câu cũ) (144.551625ms)
    ℹ tests 1
    ℹ pass 1
    ℹ fail 0
    ℹ skipped 0
    (ghi chú chấm: runner không in giá trị. Ca chỉ xanh khi cả ba khẳng định cùng đúng: deepEqual(roiKhoBen("offer_a")) = [2];
     deepEqual(roiKhoBen("offer_b")) = [3]; deepEqual(câu cũ) = [1, 2], kèm notEqual(câu cũ, câu mới). Chiều đỏ của câu cũ
     nằm ngay trong ca.)

- eval: E3
  run_id: gs-ac-6-the-khong-tin-a-E3-r2-20261117T164003Z
  exit_code: 0
  baseline: n-a
  verifier: bash _acceptance/gs-ac-6-the-khong-tin-a/probes/kiem.sh e3
  verified_at: 2026-11-17T16:40:03Z
  output: |
    LO-TRINH.html
    PRODUCT-MAP.md
    _acceptance/gs-ac-6-the-khong-tin-a/contract.md
    _acceptance/gs-ac-6-the-khong-tin-a/evals.yaml
    _acceptance/gs-ac-6-the-khong-tin-a/probes/kiem.sh
    app/tests/the-so-gia-tri-song.test.tsx
    PHAM-VI OK

## Known limits

## Ngoài hợp đồng
