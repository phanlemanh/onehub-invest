---
schema_version: 1
feature: Dòng kiểm chất lượng ảnh tin media:local-file có nhãn tiếng Việt trên /ops/quality
slug: nhan-dq-media-local-file
owner: phanlemanh@gmail.com
risk_tier: T2      # app/src/lib/dq-labels.ts + CONTEXT.md + test — không chạm t3_paths
surfaces: [ops]
status: verified
design_doc: _acceptance/nhan-dq-media-local-file/design.md
approved_by:
approved_at:
veto_state: mo
veto_opened_at: 2026-10-30T05:00:00Z
---

# Acceptance Contract: nhan-dq-media-local-file

## Context

Sửa gấp do giám sát giao ngày 30/10. Sau PR #192 (NH1 `media-canonical-reso`), `pipeline/transform-media.mjs` ghi dòng
kiểm `media:local-file` mỗi nguồn, mà `app/src/lib/dq-labels.ts` chưa diễn giải. Kết quả: ca ON12-AC-5 đỏ trên mọi máy có
bảng `media`, và bảng «Kiểm chất lượng» ở `/ops/quality` hiện «chưa diễn giải» cho ba dòng ấy.

## Criteria

- AC-1: Given tên kiểm `media:local-file`, When gọi `dqCheckName`, Then trả `{ text: "Ảnh tin đã tải", known: true }`.
- AC-2: Given đối tượng mã nguồn trần `S03`, `S05`, `S06`, When gọi `dqEntityLabel`, Then trả «Nguồn S03», «Nguồn S05»,
  «Nguồn S06» với `known: true`; mã sai khuôn `S0X` vẫn `known: false`.
- AC-3: Given chi tiết `rows=182852 local=0 offers_with_media=27702`, When gọi `dqDetail`, Then trả «182.852 ảnh · 0 đã tải ·
  27.702 tin có ảnh» với `known: true`; chi tiết thiếu `offers_with_media` vẫn `known: false`.
- AC-4: Given DB máy thu có dòng `media:local-file` của S03, S05, S06 trong 7 ngày, When chạy ca ON12-AC-5 của
  `tests/ops-nhan-theo-context.test.tsx`, Then ca xanh: mọi dòng kiểm 7 ngày đều có tên kiểm, đối tượng và chi tiết đã
  diễn giải, bảng dựng đủ mọi dòng.
- AC-5: Given cây sau vòng, When đọc `CONTEXT.md` và chạy bộ test app (`cd app && npm test`), typecheck và lint, Then
  `CONTEXT.md` có khối thuật ngữ «Ảnh tin» nêu kiểm `media:local-file`, và bộ test, typecheck, lint đều thoát 0.

## Coverage

- Ba phần của một dòng kiểm (tên kiểm · đối tượng · chi tiết) mỗi phần một AC (AC-1, AC-2, AC-3), có chiều khuôn lạ ở
  AC-2, AC-3. [thước CE: ba hàm `dqCheckName`, `dqEntityLabel`, `dqDetail` của `dq-labels.ts`]
- Dòng thật trên DB máy thu (AC-4), từ vựng và không lùi (AC-5).

Không chạy morphological-scan: không gian là ba hàm thuần đã liệt kê (sổ quyết định).

## Out of scope

- Đổi khuôn `detail` ở bên ghi `pipeline/transform-media.mjs`.
- Ngưỡng cảnh báo tỉ lệ ảnh đã tải (C2b media-yield).

## Notes

- Code sửa viết trước hồ sơ (sửa gấp, commit c09ede86); vòng này dựng hồ sơ và lượt chấm độc lập cho đúng thay đổi đó.
