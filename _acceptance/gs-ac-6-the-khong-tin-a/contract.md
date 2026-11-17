---
schema_version: 1
feature: probe GS-AC-6 của the-so-gia-tri-song chỉ xét thẻ ghép căn có bên (evidence.<bên>.offer_id là chuỗi), không nhận nhầm thẻ danh bạ DA33 là «tin rời kho»
slug: gs-ac-6-the-khong-tin-a
owner: phanlemanh@gmail.com
risk_tier: T2
surfaces: [cli]
status: implemented
veto_state: mo
veto_opened_at: 2026-11-17T15:40:00Z
approved_by:
approved_at:
---

# Acceptance Contract: gs-ac-6-the-khong-tin-a

## Context

Ca `GS-AC-6 probe DB máy thu` (`app/tests/the-so-gia-tri-song.test.tsx`) đỏ trên main 55bcea7a2 từ khi DA33 (#476) áp lên DB
máy thu: DA33 thêm thẻ `entity_match` kiểu danh bạ (item_id `s16:…`, `evidence.loai`, không `offer_a`/`offer_b`); hai câu SQL của
probe nhận nhầm chúng là «Tin A/B rời kho», trong khi trang đúng là không vẽ Alert. Ca này làm đỏ suite app_ui của mọi lượt
chấm trên máy thu. Vòng chỉ sửa test, không đổi mã app.

## Acceptance Criteria

- AC-1: Given DB máy thu :5433 sau DA33, When chạy `tests/the-so-gia-tri-song.test.tsx`, Then mọi ca xanh, ca GS-AC-6 probe
  chạy thật (không bỏ qua) và tập thẻ có Alert bên A bằng tập Tin A rời kho theo định nghĩa bên của `sidesOf`
  (`app/src/lib/ops/review-context.ts`: bên tồn tại khi `evidence.<bên>.offer_id` là chuỗi).
- AC-2: Given dữ liệu dựng bằng CTE (thẻ danh bạ không có bên, thẻ Tin A rời, thẻ Tin B rời, thẻ khác loại), When chạy câu
  tập rời kho mới, Then chỉ thẻ có bên rời vào tập; và câu cũ (không đòi bên có offer_id) nhận nhầm thẻ danh bạ — chiều đỏ.
- AC-3: Given nhánh so với main, When liệt kê tệp đổi, Then ngoài hồ sơ này và tệp máy sinh chỉ có
  `app/tests/the-so-gia-tri-song.test.tsx`; không tệp `app/src` nào đổi.

## Coverage

- Bỏ coverage-scan — vòng sửa câu SQL của một probe test; trục: dữ liệu thật (AC-1), ba loại thẻ × câu mới/cũ (AC-2), không lén
  đổi mã (AC-3).

## Out of scope

- Thẻ danh bạ DA33 trên màn duyệt (cách hiện, nút quyết) — mã app, không đổi.

## Notes
