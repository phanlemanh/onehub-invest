# Plan: m2-ac10-so-cap-co-dinh

Spec: `docs/superpowers/specs/2026-10-29-m2-ac10-so-cap-co-dinh-design.md` · hồ sơ `_acceptance/m2-ac10-so-cap-co-dinh/`.

## Task 1 — helper đọc blob ghim và kiểm cặp (independent: false)

- Files: `scripts/design-floor/test-helpers.mjs`
- Thêm `CONFIG_PAIR` (sha đầy đủ của `3b3a33e5`), `requireCommit(sha)` (ném «thiếu commit ghim <sha> — … git fetch
  --unshallow»), `blobAt(sha, rel)` (gọi `requireCommit` rồi `git show`), `soCapConfig(before, after)` (git diff
  --no-index trên hai tệp tạm → `{ added, removed }`), `kiemCapM2(before, after)` (ném khi removed khác rỗng hay added
  khác đúng hai dòng `design_floor_gen`, `design_floor_fresh`, nêu dòng lệch).
- Verify: `node --test scripts/design-floor/fresh.test.mjs`
- Phục vụ: E1, E3, E4

## Task 2 — ca M2-AC-10 dùng cặp cố định + ca hàm + ca thiếu commit + không hạ thước (independent: false)

- Files: `scripts/design-floor/fresh.test.mjs`
- Thay ca diff merge-base bằng ca «M2-AC-10 diff config.yaml cặp cố định 3b3a33e5^→3b3a33e5 chỉ thêm hai dòng executors»
  gọi `kiemCapM2(blobAt(...^), blobAt(...))`. Thêm ca «M2-AC-10 hàm kiểm cặp» (cặp thật + hai đột biến), «M2-AC-10 thiếu
  commit ghim» (blobAt sha 0 + đối chứng dương), «M2-AC-10 ca diff không đọc cây hay merge-base» (rút thân ca từ tệp,
  không chứa chuỗi cấm, có gọi kiemCapM2), «M2-AC-10 không hạ thước» (tập tên ca ở 98757b5f trừ một tên ⊆ tập hiện tại;
  thân hai ca M2-AC-10 còn lại giống từng byte; cặp đỏ bỏ một tên).
- Verify: `node --test scripts/design-floor/*.test.mjs` — phá-thử: chạy bản cũ của ca trên main → đỏ.
- Phục vụ: E1, E3, E4, E5

## Task 3 — ca sau gộp trên bản clone (independent: false)

- Files: `scripts/design-floor/fresh-sau-gop.test.mjs`
- `git clone --shared -q ROOT tmp`; chép `scripts/design-floor/*.mjs` của cây đang kiểm vào; thêm khoá vào config.yaml;
  commit; ba trạng thái ref: (a) origin/main = HEAD, (b) origin/main = HEAD^, (c) xoá ref. Bản sửa thoát 0 ở cả ba; ở (a),
  (b) ghi `fresh.test.mjs` ở 98757b5f vào cây, chạy → đúng một dòng `not ok` chứa tên ca merge-base.
- Verify: `node --test scripts/design-floor/fresh-sau-gop.test.mjs`
- Phục vụ: E2
