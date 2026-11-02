---
schema_version: 2
feature_slug: s08-noi-tiep
verdict: PASS
failed_evals: []
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: 0a7381412ab08377aa38c77ea357690dbb7b2546
human_signoff: Mạnh 2026-11-02
---

# Evidence Report: s08-noi-tiep

Vòng verify 3, cây `a2e6ce3a` (nhánh `feat/zcode-gop-0211`, merge-base `cfa59117`; origin/main lúc chấm đã tiến tới `d531d2d8`). Phiên chấm không viết mã này, không sửa code hay probe. Mọi eval chạy lại từ đầu.

6/6 eval đạt. Phép miễn URL DTD plist giờ hẹp đúng một URL, mọi dạng nới theo đuôi của vòng 2 đều bị bắt.

Cần người đọc một điểm trước khi ký: bản sửa bộ dò làm rộng ra một chỗ khác (`review-findings.md` F9). URL ngoài dính liền sau một URL thuộc ngoại lệ có sẵn, ví dụ localhost hoặc testbase, nay lọt, trong khi bộ dò vòng 2 bắt được. Điều này không nằm trong `expected` của E5 nên không làm eval trượt, và quét diff hiện tại cho 0 dòng rơi vào dạng này. Nhưng đây là một lần nới bộ dò tầng A, và quyết định `d-20261102T-dtd` không nói tới nó.

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | script | PASS |
| E2 | AC-2 | script | PASS |
| E3 | AC-3 | script | PASS |
| E4 | AC-4 | script | PASS |
| E5 | AC-5 | script | PASS |
| E6 | AC-1 | script | PASS |

## Evidence

Mỗi eval chạy lệnh riêng một lần từ gốc worktree, có run_id riêng, tuần tự, xong trước trần công cụ (đặt 600 giây).

- eval: E1
  run_id: s08-noi-tiep-E1-r3-20261102T050945Z
  exit_code: 0
  baseline: red
  verifier: config:executors.script.s08n_collector
  verified_at: 2026-11-02T05:09:45Z
  output: |
    ✔ 2610-22(1): catalog code≠1 → NÉM (token hết hạn lộ rõ), không nuốt im lặng
    ℹ tests 64
    ℹ pass 64
    ℹ fail 0

- eval: E2
  run_id: s08-noi-tiep-E2-r3-20261102T051136Z
  exit_code: 0
  baseline: red
  verifier: config:executors.script.s08n_collector
  verified_at: 2026-11-02T05:11:36Z
  output: |
    ✔ 2410-19: strip PII ĐỆ QUY — contact_data lồng mọi độ sâu bị bỏ; catalog item có mặt
    ℹ tests 64
    ℹ pass 64
    ℹ fail 0
  note: Khẳng định sourceId catalog khác detail nằm trong ca 2410-19 (`s08-danh-muc.test.ts:119`).

- eval: E3
  run_id: s08-noi-tiep-E3-r3-20261102T051327Z
  exit_code: 0
  baseline: red
  verifier: config:executors.script.s08n_row
  verified_at: 2026-11-02T05:13:27Z
  output: |
    ✔ s08Num siết (2610-22): ' ', '0x10', '1.500.000', '1 500' → null; ' 100,5 ' → 100.5; '1,500' → 1.5
    ℹ tests 5
    ℹ pass 5
    ℹ fail 0

- eval: E4
  run_id: s08-noi-tiep-E4-r3-20261102T051327Z
  exit_code: 0
  baseline: red
  verifier: config:executors.script.s08n_nap
  verified_at: 2026-11-02T05:13:27Z
  output: |
    ok   lượt 1 nạp đúng 2 căn
    ok   log đếm +1 detail, +1 catalog bỏ
    ok   should-NOT-fire: catalog và detail không gây cảnh báo state lạ
    ok   nạp lại không nhân dòng
    ok   lượt 2 log 0 căn mới
    ok   đối chứng: item state lạ thật vẫn bị cảnh báo
    NAP OK

- eval: E5
  run_id: s08-noi-tiep-E5-r3-20261102T051327Z
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.s08n_cac
  verified_at: 2026-11-02T05:13:27Z
  output: |
    NGUON-DUY-NHAT PASS
    bộ mẫu: 18858 chuỗi · dòng thêm so với main: 2096
    chuỗi nguồn thật khớp trong dòng thêm: 0
    ok   URL DTD plist được miễn
    ok   should-NOT-fire: URL khác URL DTD vẫn bị bắt (5 ca)
    dòng thêm có URL ngoài máy: 0
    KHONG-LO-NGUON PASS
    THIEU-ENV PASS

- eval: E6
  run_id: s08-noi-tiep-E6-r3-20261102T051329Z
  exit_code: 0
  baseline: red
  verifier: config:executors.script.s08n_rong
  verified_at: 2026-11-02T05:13:29Z
  output: |
    ok   code=1 + data rỗng: kết thúc bình thường, 0 dự án
    ok   code=1 + thiếu data: kết thúc bình thường, 0 dự án
    ok   should-NOT-fire: code=0 không được coi là hết danh mục
    ok   should-NOT-fire: thiếu code không được coi là hết danh mục
    RONG OK

## Known limits

- **Bộ dò vẫn có lỗ, E5 xanh không có nghĩa là không URL nào lọt được.** Một URL ngoài dính liền sau URL thuộc ngoại lệ nay lọt (F9, mới, do bản sửa này). Các dạng F8 vẫn lọt: ngoại lệ dính đuôi, URL IP, userinfo không có dấu chấm, host có gạch dưới, IPv6. Phiên chấm quét 2096 dòng thêm: 7 URL, trong đó 2 là URL DTD plist, 3 là testbase, 1 là 127.0.0.1, 1 có host một ký tự ở tệp test S06. Không URL nào thuộc các dạng lỗ F8 hay F9.
- `khong-lo-nguon` chỉ đọc diff đã commit, nên hai tệp báo cáo này chưa nằm trong lượt E5 trên. Phiên chấm đã chạy riêng chế độ này trên bản clone tạm ở scratchpad có commit thử kèm hai tệp và run-log: 2298 dòng thêm, 0 chuỗi nguồn thật khớp, 0 URL ngoài máy, chế độ PASS. Lượt đó không phải eval nên không có trong run-log.
- Đối chứng âm của E5 chỉ gồm các dạng URL có scheme liền host ở đầu token. Nó bắt được các đột biến miễn cả tên miền, cả thư mục, `startsWith` và bản `replaceAll` cũ, nhưng không có ca nào cho F9.
- E1 và E6 gọi trực tiếp `fetchProjectCatalog`. Vòng 2 phiên chấm đã thử thêm ở mức `collect`, đúng; code collector không đổi từ đó nên vòng này không chạy lại phép thử tay này.
- Baseline của E1 và E2 chỉ đo `dist/test/s08-danh-muc.test.js` trên cây tạm, không chạy trọn bộ test collector.
- E4 tạo lược đồ tạm trong DB :5433 dùng chung, không ghi bảng thật. Kiểm sau lượt: 0 lược đồ `acc_%`, 0 dòng `GIA-%` trong `public.stg_s08_inventory`, số dòng bảng không đổi.

## Ngoài hợp đồng

- F8 (có từ trước) chưa sửa, theo chỉ đạo của điều phối vẫn giữ làm finding. Xem `review-findings.md`.
- Chú thích `import-s08-row.test.mjs:52` vẫn nói `'1,500' → 1.5` là «quyết chữ trong DATA-CONTRACT», trong khi tài liệu đó không có câu nào về dấu phẩy. Xem F4.
- `s08Num` loại cả `-5`, `1e3`, `.5`, `5.`, ngoài phạm vi AC-3. Xem F5.
- `acceptance.mjs` là tệp ngoài `_acceptance/` và đã đổi sau `verified_commit` của bốn hồ sơ khác trên nhánh này. Xem F10.

## Analyst

Non-discriminating evals: none trong các eval đo được; E1, E2, E3, E4, E6 đều đỏ trên baseline, đo lại vòng này, đúng ở ca của tính năng.

Baseline khong do:
- E5: bộ dò so dòng thêm với merge-base, còn trên chính cây merge-base thì không có dòng thêm, nên chạy không chứng minh gì. Răng của E5 được đo bằng đột biến phép miễn, ghi ở `review-findings.md`.

Cách đo baseline: `git archive` merge-base vào scratchpad, chép đè test và probe của HEAD (không đổi so với vòng 2).

## Variance

none — không có eval nhiều lượt; E1 và E2 cùng một lệnh cho kết quả giống nhau.

## Iterations

Round 1: E5 failed — bộ dò bắt URL DTD plist; thêm phép miễn, thay probe E4 và E5, thêm E6.
Round 2: E5 failed — bộ dò tự bắt dòng đối chứng mới thêm; phép miễn lọt URL có tiền tố URL DTD plist. Trả về sửa bộ dò.
Round 3: 6/6 đạt trên cây `a2e6ce3a`. Phép miễn so nguyên URL; còn finding F9 và F8 ở bộ dò, không thuộc `expected`.

### Re-pin lần 1 — 2026-11-02, do gộp main, siết bộ dò khong-lo-nguon, sửa fixture AU12 sau vòng chấm
run_id: repin-20261102T053124Z-55269
sha: 25127eacf0f06642239e9062bf246d6b5a10be25 · suites: 6 lệnh exit 0 · evals: 6/6 eval máy đạt kỳ vọng

### Re-pin lần 2 — 2026-11-02, do hoá cũ do hợp main d8db8e00 vào nhánh gộp, PR 278
run_id: repin-20261102T162656Z-91202
sha: 0a7381412ab08377aa38c77ea357690dbb7b2546 · suites: 6 lệnh exit 0 · evals: 6/6 eval máy đạt kỳ vọng
