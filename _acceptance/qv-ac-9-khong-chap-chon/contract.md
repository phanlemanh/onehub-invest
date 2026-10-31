---
schema_version: 1
feature: Bộ kiểm sổ bề mặt API (check-api-surface) không đỏ vì tệp đột biến tạm của test khác bị xoá giữa lúc quét — CI app thôi đỏ chập chờn ở QV-AC-9
slug: qv-ac-9-khong-chap-chon
owner: phanlemanh@gmail.com
risk_tier: T2
surfaces: [api]
status: implemented
veto_state: mo
veto_opened_at: 2026-10-31T13:25:00Z
approved_by:
approved_at:
design_doc: docs/superpowers/specs/2026-10-31-qv-ac-9-khong-chap-chon-design.md
---

# Acceptance Contract: qv-ac-9-khong-chap-chon

## Context

`QV-AC-9` chạy `node scripts/check-api-surface.mjs mutation`. Lệnh quét cả cây `app/src`; các test đột biến chạy song
song (ON3, ON4, ON22, ON23, NT2, DC, SC, AU12) chép tệp thật thành bản sao ẩn `.xxx-mut-*.tsx` rồi xoá. Bản sao bị xoá
giữa lúc đọc tên và lúc đọc tệp thì lệnh ném `ENOENT`, và CI app đỏ không vì thay đổi nào (31/10: #235, #243, #245).
Đo 31/10 trên cây này: khi một tiến trình sinh-xoá tệp `.qv-mut-*.tsx` liên tục trong `app/src/lib`, bản hiện tại
của `check-api-surface.mjs static` đỏ 8/10 lượt với `ENOENT`.

## Criteria

- AC-1: Given một cây có tệp thường `lib/that.ts`, route `api/v1/a/route.ts` và tệp ẩn `lib/.x-mut-1-that.tsx`, When
  `loadFiles` đọc cây đó, Then kết quả có đúng hai tệp không ẩn và không có tệp ẩn.
- AC-2: Given một mục biến mất giữa lúc quét ở một trong ba cửa sổ — (a) tên còn trong danh sách nhưng tệp và thư mục
  con không còn trên đĩa khi stat, (b) stat ra tệp thường nhưng tệp biến mất trước khi đọc, (c) stat ra thư mục nhưng
  thư mục biến mất trước khi liệt kê — When `loadFiles` đọc cây, Then không ném lỗi và kết quả không có mục đó; Given
  stat một tệp gặp lỗi khác `ENOENT` (vd `EACCES`), When `loadFiles` đọc cây, Then lỗi đó vẫn ném ra.
- AC-3: Given một tiến trình liên tục sinh rồi xoá tệp `.qv-mut-*.tsx` trong `app/src/lib` của một bản chép cây kho ở
  thư mục tạm, When chạy `check-api-surface.mjs` chế độ `static` và `mutation` nhiều lượt trên bản chép ấy, Then bản
  mới thoát 0 mọi lượt; bản đột biến bỏ cả nhánh tệp ẩn lẫn nhánh chịu `ENOENT` (hành vi của bản cũ) dưới cùng tải thì
  gặp `ENOENT` trong trần lượt; và `app/src` thật không có tệp `.qv-mut-*` nào trước, trong và sau ca.
- AC-4: Given cây kho thật, When chạy `check-api-surface.mjs static` và `mutation`, Then cả hai ĐẠT: mọi route khớp sổ,
  và M1–M20 vẫn trượt đúng thông điệp — không kiểm nào bị nới.
- AC-5: Given toàn bộ thay đổi, When chạy bộ test app, typecheck và lint, Then xanh.

## Coverage

Bỏ quét không gian — lỗi một trục (mục trong cây quét: tệp thường · tệp ẩn · tệp biến mất · thư mục biến mất · lỗi đọc
khác `ENOENT`), quét đủ ở AC-1 và AC-2; xem dòng descope trong sổ.

## Out of scope

- Đổi các test đột biến khác để chúng không ghi bản sao vào `app/src` (chúng là phép đo đã ký của hồ sơ khác).
- Sửa các bộ quét cây khác trong kho chưa bỏ qua tệp ẩn — chỉ sửa khi chúng đỏ thật.

## Notes

- Bỏ qua chỉ áp cho TỆP ẩn; thư mục ẩn vẫn được quét, để phạm vi kiểm không hẹp đi.
- Giới hạn khai lúc thiết kế: một module ẩn import qua `./.x` sẽ rơi khỏi bao đóng import của bộ kiểm; trong kho hiện
  không có tệp mã ẩn nào.
