# Khử trùng ảnh trong một tin — Implementation Plan

**Goal:** Khử ảnh trùng từng byte trong một tin ở bên ghi bảng `media`, trước khi bên đọc áp trần 12.
**Spec:** `docs/superpowers/specs/2026-11-05-khu-trung-anh-tin-design.md`; hợp đồng `_acceptance/khu-trung-anh-tin/contract.md`.
**Chạy tuần tự:** các task phụ thuộc nhau qua luật khoá nội dung (`independent: false`).

## Review Focus
- Dòng giữ lại phải là lần đầu theo `post_ids`, không phải băm hay tên tệp nhỏ nhất.
- URL của tệp đã khử không quay lại ở lượt 2.
- Băm viết hoa, thiếu, sai khuôn.
- `sha256` không xuống trình duyệt, không vào bảng.
- `do-gop-anh` không được nới quá tay.

## Task 1: Luật khoá ở bên ghi (E1, E2, E10)
Files: `pipeline/media-rows.mjs`, `pipeline/scripts/khu-trung-anh.test.mjs`. `independent: false`.
`noiDungKhoa(entry, local)`: `sha256` hợp lệ (64 hex, viết thường) hoặc đường tệp. `mediaRowsFromPosts` khử theo khoá này, URL của entry bị bỏ vẫn vào `seenUrl`; dòng mang thêm `sha256` trong bộ nhớ.
Verify: `node --test pipeline/scripts/khu-trung-anh.test.mjs`.

## Task 2: Bên ghi DB và thước PL28 (E3, E4, E5, E7)
Files: `pipeline/transform-media.mjs`, `pipeline/scripts/do-gop-anh.mjs`, `pipeline/scripts/khu-trung-anh.itest.mjs`. `independent: false`.
`noiSau` bỏ thêm trùng băm. `dungDong` xuất ra cho phép đo. `do-gop-anh` tính bài chỉ-ảnh trùng băm là đã gộp, in hiệu tập cặp, có đối chứng.
Verify: `executors.script.kta_db`, `executors.script.gop_anh_that`.

## Task 3: Phép đo dữ liệu thật (E6)
Files: `pipeline/scripts/do-khu-trung-anh.mjs`. `independent: false`.
Giao dịch READ ONLY, hàm so thuần có bốn đối chứng, mẫu số tối thiểu 1.700 tin.
Verify: `executors.script.kta_do`.

## Task 4: Bên đọc (E8, E9)
Files: `app/src/lib/ops/review-media.ts`, `app/src/lib/labels-anh.ts`, `app/tests/khu-trung-anh.test.tsx`, `app/tests/khu-trung-anh-db.test.tsx`. `independent: false`.
`buildOfferImages` khử theo băm; `NguonAnh` tệp mang `sha256`, `danhSachAnh` khử cùng luật. Không đụng `labels-queries`, `components/ops/labels/**`.
Verify: `executors.test.kta_app`, `executors.script.kta_app_db`, `cd app && npx tsc --noEmit`.

## Task 5: Tài liệu
Files: `pipeline/transform-media.mjs` (đầu tệp), `docs/ROADMAP.md`, `docs/plan/lo-trinh.json` nếu có hàng. Verify: `/verify` module pipeline, app.
