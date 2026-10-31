# Bộ bóc SĐT đủ và tin chọn số rõ (SD2) — kế hoạch thi công

**Spec:** `docs/superpowers/specs/2026-10-30-boc-sdt-du-va-chon-ro-design.md` · hợp đồng `_acceptance/boc-sdt-du-va-chon-ro/`.

## Global Constraints

- Dạng số ra giữ `0xxxxxxxxx`; `PHONE_RE` và `gatSo` không đổi một byte.
- Trần 3 số mỗi bài giữ (Hỏi-1, Mạnh 31/10).
- Không in số thật ra log, test hay tài liệu: fixture dùng số bịa.

## Task 1 — Bộ bóc (`independent: false`)

- Files: `pipeline/transform-zalo.mjs` (thêm `SDT_RE`, sửa `extractPhones`), `pipeline/scripts/boc-sdt.test.mjs` (mới),
  `pipeline/parse.test.mjs` (ca «SĐT 11 số» đổi thành chờ rỗng).
- `extractPhones(text)`: gạt URL; đổi `(+84)`/`(84)` → `+84 `, `(0dd)` → `0dd `; khớp `(?<!\d)(?:\+84|84|0)` + đúng 9 chữ
  số, mỗi chữ số đứng sau tối đa hai ký tự tách `[.\- \t•·]`, `(?!\d)`. Đuôi «ký tự tách + đúng một chữ số lẻ» → bỏ khớp
  (số 11 chữ số viết tách). Chuẩn hoá `84…` → `0…`, đầu số `0[35789]`, không trùng, trần 3.
- Verify: `cd pipeline && node --test scripts/boc-sdt.test.mjs parse.test.mjs`, cùng lượt phá thử ba bản sao đột biến
  (PHONE_RE cũ, nhận 11, khớp vượt 10 chữ số).
- Phục vụ E1, E2, E3, E9.

## Task 2 — Tin chọn số (`independent: false`)

- Files: `pipeline/transform-zalo.mjs` (`chonSdtTin`, gom tin dùng nó, log `tin nhiều SĐT`), `pipeline/transform-fb.mjs`
  (gom S05 dùng `chonSdtTin`, log), `pipeline/scripts/boc-sdt.test.mjs` (SD-AC-4).
- `chonSdtTin(bai: {post_id, posted_at, phones}[]) → string|null`: đếm số bài chứa mỗi số; max; hoà → bài theo thứ tự neo
  (posted_at tăng, post_id tăng), số hoà đầu tiên theo thứ tự trong bài.
- Verify: test SD-AC-4 + bản sao «số đầu của bài đầu» đỏ.
- Phục vụ E4, E5.

## Task 3 — Thước dữ liệu thật (`independent: false`)

- Files: `pipeline/scripts/do-boc-sdt.mjs` (mới).
- Chép `transform-zalo.mjs`/`transform-fb.mjs` từ merge-base thành tệp cạnh (đuôi `.truoc-<pid>.mjs`), sửa import của bản
  fb trỏ bản zalo cũ; chạy bản trước → chụp; chạy bản mới (log bắt bằng thay `console.log`) → chụp; so tập tin (AC-8); đo
  AC-5, AC-6, AC-7; chạy thước AC-7 trên chụp bản trước phải đỏ; xoá tệp chép trong `finally`.
- Verify: `executors.script.boc_sdt_that` xanh, nhật ký in đủ dòng SD-AC-5…8.
- Phục vụ E5, E6, E7, E8.
