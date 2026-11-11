---
schema_version: 1
feature: Trạng thái mã nguồn draft có nhãn «Chưa thu» trên cổng Ops, kèm ca kiểm thuần đòi mọi giá trị CHECK của source_registry.status có nhãn
slug: nhan-trang-thai-nguon-draft
owner: phanlemanh@gmail.com
risk_tier: T2
surfaces: [ui]
status: signed-off
design_doc: docs/superpowers/specs/2026-11-11-nhan-trang-thai-nguon-draft-design.md
approved_by: Mạnh
approved_at: 2026-11-11
---

# Acceptance Contract: nhan-trang-thai-nguon-draft

## Context

Migration 047 cho `source_registry.status` năm giá trị nhưng bảng nhãn `app/src/lib/source-status-labels.ts` thiếu
`draft`. Từ 09/11 DB local có năm mã ở `draft`, nên `/ops/sources` hiện «Giá trị khác» và ca ON12-AC-7 của suite app
đỏ cho mọi dãy chấm trên máy này. Hàng do GS mở (đợt dot0-cam-mau), ưu tiên cao nhất vì gỡ đỏ cho mọi dãy.

## Criteria

- AC-1: Given bảng nhãn trạng thái mã nguồn, When gọi `sourceStatusLabel` với ma trận viết trước năm giá trị (`draft`, `active`, `paused`, `completed`, `retired`) và năm giá trị lạ (`deprecated`, `''`, `Draft`, `null`, `undefined`), Then `draft` trả «Chưa thu» `known: true`, bốn giá trị cũ giữ nguyên nhãn, bảng không có giá trị ngoài ma trận, và mọi giá trị lạ trả «Giá trị khác» `known: false`.
- AC-2: Given chuỗi migration trong `db/migrations/` theo thứ tự chạy, When ca kiểm thuần (không chạm DB) đọc lần đặt CHECK `source_registry_status_chk` cuối cùng, Then tập giá trị đúng bằng năm giá trị của migration 047 và mọi giá trị có nhãn; khi chuỗi nối thêm một lần đặt CHECK có giá trị chưa có nhãn (`archived`), ca đỏ với thông điệp gọi tên đúng giá trị ấy; chuỗi không có CHECK thì đỏ với thông điệp «không thấy CHECK». Bộ đọc chỉ nhận CHECK của `source_registry`: một lần đặt `source_groups_status_chk` thêm giá trị không làm ca đỏ, và không che được giá trị thiếu nhãn của `source_registry` đặt trước nó.
- AC-3: Given CONTEXT.md, When ca kiểm đọc khối thuật ngữ «Trạng thái mã nguồn», Then năm cặp `code` «nhãn» trong khối bằng đúng bảng nhãn; khối lệch một nhãn hay vắng khối thì ca đỏ.
- AC-4: Given DB của riêng lượt chấm (`db/db-thu.sh --chay`, chép từ DB local có mã ở `draft`), When chạy suite `cd app && npm test`, Then suite thoát 0 — ca có sẵn `ON12-AC-7 mọi giá trị đang có trên DB local có nhãn` xanh mà không sửa ca ấy.
- AC-5: Given bảng danh mục nguồn của `/ops/sources` (`RegistryTable`), When render với một dòng `status: 'draft'` và một dòng `active`, Then ô trạng thái hiện «Chưa thu» và «Đang dùng», không có «Giá trị khác» hay chữ thô `draft`.
- AC-6: Given bảng nhãn đã có `draft` (năm khoá, hai trùng chữ trục `registry_status`), When chạy ca `VL-AC-5` của `vocab --lint` trên cây thật, Then không còn chỗ viết tay ngoài sổ, không ngoại lệ thừa (`allowStale` rỗng) và tập ngoại lệ ghim không còn dòng `app/src/lib/source-status-labels.ts|registry_status`; `vocab --check` khớp sổ.

## Coverage

Bỏ quét không gian AC — xem dòng sổ `descope` «bỏ coverage-scan»: bài toán một chiều (một bảng nhãn, một tập giá trị CHECK); đổi lại không có bằng chứng độ phủ.

## Out of scope

- `source_groups.status` (cùng năm giá trị) — không có bảng nhãn hiển thị; không thuộc hàng này.
- Chuyển bảng nhãn trạng thái nguồn vào sổ vocab máy sinh (`pipeline/mappings.yaml`) — hàng này chỉ gỡ dòng ngoại lệ đã thừa (AC-6).
- Sửa ca ON12-AC-7 hay bất kỳ dòng CONTEXT.md nào ngoài khối «Trạng thái mã nguồn».
- Hai chỗ đỏ có sẵn trên main mà đường nền thấy, không do hàng này: tsc thiếu kiểu `LayoutProps`/`PageProps` ở worktree mới chưa sinh `.next/types` (gỡ bằng `next typegen`, môi trường), và ca đo giờ `E4B-AC-3` (801 ms > 700 ms khi máy tải nặng).

## Notes

- Known limits — chọn ở Cổng Bằng chứng 2026-11-11:
  - Ngoài-1: Bảng nhãn trạng thái nguồn vẫn viết tay ngoài sổ từ vựng chung; thêm trạng thái mới phải nhớ sửa bảng, ca kiểm thuần sẽ đỏ nhắc.
  - Ngoài-2: Thẻ Cổng Phạm vi của hàng này hiển thị nhầm AC-6 vào mục «sẽ không làm» (lỗi bộ dựng thẻ của kit).
  - Ngoài-3: Thuật ngữ «Trạng thái mã nguồn» chưa có dòng _Avoid_ cho «Nháp», nên dùng chữ ấy sẽ không bị cảnh báo.
  - Ngoài-4: Một phép đối chứng phụ trong test dùng bảng nhãn tự dựng thay vì bản trước thật, nên bằng chứng của nó yếu hơn mô tả.
