---
schema_version: 2
feature_slug: gs-ac-6-the-khong-tin-a
verdict: PASS
failed_evals: []
reason:
verified_by: feature-loop:cham-lenh
enforcement_mode: strict
bypass_used: false
verified_commit: ffca3285def619d4eb450b3b2ce8246e30d9bc55
human_signoff:
---

# Evidence report: gs-ac-6-the-khong-tin-a (round 1)

Phiên chấm context sạch chạy ba eval trên commit ffca3285d, DB máy thu :5433, không đặt biến CI. E1: cả 8 ca của
`tests/the-so-gia-tri-song.test.tsx` xanh, ca «GS-AC-6 probe DB máy thu» chạy thật (✔, skipped 0). Lượt đối chứng chạy bản
`origin/main` của cùng tệp: ca này đỏ (exit 1). Câu cũ tính thêm 60 id thẻ (216026, 216027, …) vào tập «Tin A rời kho» mà
trang không vẽ Alert cho chúng. E2: ca dựng bằng CTE xanh; ca chỉ xanh khi ba khẳng định cùng đúng: Tin A rời = [2], Tin B
rời = [3], câu cũ = [1, 2]. E3: nhánh chỉ đổi `app/tests/the-so-gia-tri-song.test.tsx` và hồ sơ của vòng này, không tệp
`app/src` nào đổi. Diff không nới khẳng định nào: chỉ thay hai câu SQL bằng `roiKhoBen(ben)`, thêm điều kiện
`jsonb_typeof(evidence-><bên>->'offer_id') = 'string'` (khớp `sidesOf` trong `app/src/lib/ops/review-context.ts`) và thêm một
ca mới. Các `assert.deepEqual` và hai chỗ bỏ qua có sẵn (CI, tập rỗng) giữ nguyên.

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | test | PASS |
| E2 | AC-2 | test | PASS |
| E3 | AC-3 | script | PASS |

## Evidence

- eval: E1
  run_id: gs-ac-6-the-khong-tin-a-E1-r1-20261117T163335Z
  exit_code: 0
  baseline: red
  verifier: cd app && node --import tsx --test tests/the-so-gia-tri-song.test.tsx
  verified_at: 2026-11-17T16:33:35Z
  output: |
    ✔ GS-AC-1/2 bảng so đọc giá trị sống (322.474292ms)
    ✔ GS-AC-3 Chưa rõ là Thiếu (15.344417ms)
    ✔ GS-AC-4/5/8 tin rời kho (206.665958ms)
    ✔ GS-AC-6 tập rời kho chỉ gồm thẻ có bên: thẻ entity_match không có offer_a không vào tập (chiều đỏ trên câu cũ) (17.995292ms)
    ✔ GS-AC-6 probe DB máy thu: tập thẻ có Alert bên A bằng tập Tin A rời kho (1413.956ms)
    ℹ tests 8
    ℹ pass 8
    ℹ fail 0
    ℹ skipped 0
    (ghi chú chấm: ca probe có nhánh bỏ qua khi tập rỗng, có từ trước vòng này. Lượt này đã đọc đúng dòng ✔, không phải
     # SKIP, nên probe chạy thật như expected đòi.)
    --- đối chứng (2026-11-17T16:33:54Z): bản origin/main chép thành app/tests/zz-doi-chung-tam.test.tsx (đã xoá sau lượt chạy) ---
    cd app && node --import tsx --test --test-name-pattern 'GS-AC-6' tests/zz-doi-chung-tam.test.tsx → exit 1
    ✖ GS-AC-6 probe DB máy thu: tập thẻ có Alert bên A bằng tập Tin A rời kho (1610.863792ms)
      AssertionError [ERR_ASSERTION]: GS-AC-6 tập thẻ có Alert bên A lệch tập Tin A rời kho
      + actual - expected
      -   216026,
      -   216027,
      -   216028,
      ... (60 dòng id thừa ở phía expected)
    ℹ pass 0
    ℹ fail 1

- eval: E2
  run_id: gs-ac-6-the-khong-tin-a-E2-r1-20261117T163342Z
  exit_code: 0
  baseline: red
  verifier: cd app && node --import tsx --test --test-name-pattern 'GS-AC-6 tập rời kho' tests/the-so-gia-tri-song.test.tsx
  verified_at: 2026-11-17T16:33:42Z
  output: |
    ✔ GS-AC-6 tập rời kho chỉ gồm thẻ có bên: thẻ entity_match không có offer_a không vào tập (chiều đỏ trên câu cũ) (160.768875ms)
    ℹ tests 1
    ℹ pass 1
    ℹ fail 0
    ℹ skipped 0
    (ghi chú chấm: runner không in giá trị. Ca chỉ xanh khi cả ba khẳng định cùng đúng: deepEqual(roiKhoBen("offer_a")) = [2];
     deepEqual(roiKhoBen("offer_b")) = [3]; deepEqual(câu cũ) = [1, 2], kèm notEqual(câu cũ, câu mới). Chiều đỏ của câu cũ
     nằm ngay trong ca.)

- eval: E3
  run_id: gs-ac-6-the-khong-tin-a-E3-r1-20261117T163343Z
  exit_code: 0
  baseline: n-a
  verifier: git diff --name-only origin/main...HEAD | grep -v '^_acceptance/gs-ac-6-the-khong-tin-a/' | grep -vx -e app/tests/the-so-gia-tri-song.test.tsx -e PRODUCT-MAP.md -e LO-TRINH.html | tee /dev/stderr | wc -l | grep -qx ' *0'
  verified_at: 2026-11-17T16:33:43Z
  output: |
    (stderr rỗng)
    git diff --name-only origin/main...HEAD:
    _acceptance/gs-ac-6-the-khong-tin-a/contract.md
    _acceptance/gs-ac-6-the-khong-tin-a/evals.yaml
    app/tests/the-so-gia-tri-song.test.tsx

## Known limits

## Ngoài hợp đồng

Không có mục nào.
