---
schema_version: 1
feature: Biểu mẫu theo nhóm chọn đơn vị giá theo Loại tin, hỏi lại khi giá lạ, và thẻ hiện mã để chép
slug: don-vi-gia-theo-loai-tin
owner: phanlemanh@gmail.com
risk_tier: T2
surfaces: [ui]
status: signed-off
veto_state: mo
veto_opened_at: 2026-11-06T06:25:27Z
approved_by:
approved_at:
---

# Acceptance Contract: don-vi-gia-theo-loai-tin

## Context

Mạnh lưu nhầm một nhãn: thẻ #9932 là tin cho thuê, giá lưu 11.000 tỷ, vì ô đơn vị giá của biểu mẫu theo nhóm luôn khởi đầu «tỷ». Nhãn đã lưu không sửa được trên màn (việc sửa do phiên trợ lý lo). Mạnh và phiên trợ lý cũng không gọi được đúng một thẻ vì mã thẻ chỉ nằm ẩn ở thuộc tính `data-labels-tin` và chỉ lên URL sau khi lưu; đã nhầm một thẻ chưa lưu. Vòng này: đơn vị theo Loại tin, hỏi lại một lần khi giá lạ, hiện mã thẻ để chép. Luật kiểm của `labels-normalize.ts` không đổi.

Source input: giám sát đợt dot0-cam-mau giao theo lời Mạnh, 06/11.

## Criteria

- AC-1: Given biểu mẫu theo nhóm, When người chọn Loại tin «Cho thuê», Then đơn vị giá chuyển «triệu»; chọn «Bán» thì «tỷ»; bỏ chọn Loại tin thì đơn vị giữ nguyên; người đã tự bấm đơn vị (kể cả bấm lại nút đang sáng) thì Loại tin không ghi đè lựa chọn đó.
- AC-2: Given Loại tin và giá đã điền, When người bấm Lưu mà giá thấp nhất hay cao nhất của tin thuê từ 1 tỷ một tháng trở lên, hoặc của tin bán dưới 100 triệu (kể cả 0), Then hộp «Giá này có đúng không?» nêu giá và đơn vị, chưa gửi gì; «Sửa lại» đóng hộp, không gửi; «Vẫn lưu» gửi đúng giá và đơn vị người chọn; lưu lại đúng bộ giá trị đã xác nhận thì không hỏi nữa, đổi giá thì hỏi lại; giá thường, ô giá «Không suy ra được» hay chưa chọn Loại tin thì không hỏi. Không chặn lưu; luật kiểm phía máy thu không đổi.
- AC-3: Given thẻ đang gắn ở lát chín trường, lát theo nhóm và màn lượt hai, When mở thẻ, Then dòng mô tả đầu thẻ mở đầu bằng «#<item_id>» trước «S03 · <nhóm>», chữ cỡ `text-xs`; bấm vào thì chép đúng mã số vào bảng tạm và nút báo đã chép; bảng tạm bị chặn thì báo lỗi.
- AC-4: Given mã và hồ sơ, When quét diff so với điểm rẽ nhánh, Then chỉ các tệp được phép đổi: `app/src/components/ops/labels/label-form-nhom.tsx`, `labels-view.tsx`, `luot-hai.tsx`, `ma-the.tsx`, `gia-la.ts` (cùng thư mục), `app/tests/labels-nhom.test.tsx`, `app/tests/ops-nhan/visible-strings.ts`, `_acceptance/config.yaml`, `_acceptance/don-vi-gia-theo-loai-tin/**`, `docs/**`, `PRODUCT-MAP.md`, `LO-TRINH.html`; `app/src/lib/labels-normalize.ts` không đổi; các phép đo cũ của màn gắn nhãn và thước nhãn Ops vẫn xanh.

## Coverage

Bỏ quét không gian bằng dòng sổ `bỏ coverage-scan`: các trục ngắn liệt kê đủ từ hai Loại tin và hai đơn vị.

- Loại tin: Cho thuê · Bán · bỏ chọn (AC-1, AC-2).
- Đơn vị: theo Loại tin · bấm tay (AC-1).
- Giá: thuê ≥ 1 tỷ/tháng · thuê thường · bán < 100 triệu (kể cả 0) · bán thường; biên 1 tỷ và 100 triệu; giá thấp nhất · giá cao nhất; ô «Không suy ra được»; lần đầu · đã xác nhận · đổi giá sau xác nhận (AC-2).
- Bảng tạm: chép được · từ chối · không có (AC-3).
- Màn: chín trường · theo nhóm · lượt hai (AC-3).

## Out of scope

- Biểu mẫu chín trường `label-form.tsx`: đơn vị giá giữ nguyên (lát đang gắn là lát theo nhóm).
- Sửa nhãn đã lưu (thẻ #9932) và gắn bù.
- Đổi luật kiểm giá ở `labels-normalize.ts` hay chặn lưu giá lạ.

## Notes

- Nhánh cắt từ đầu nhánh #330 (fix/the-hai-nguoi-xep-sau), nối sau #328 và #330.
- Known limits — chọn ở Cổng Bằng chứng 2026-11-06:
  - Ngoài-4: phép kiểm thẻ khi bảng nguồn rỗng hay vắng chỉ kiểm không có tên, chưa kiểm dòng «Người đăng: ID» vẫn còn.
  - Ngoài-5: phép kiểm giờ trên thẻ ghép không phân biệt được giờ của tin chữ với giờ của bài ảnh.
  - Ngoài-6: chữ «mã thẻ» trên màn chưa có định nghĩa trong từ vựng chung và trùng chữ với một nghĩa khác trong code.
  - Ngoài-7: với thẻ ghép, lượt một và lượt hai có thể hiện hai giờ đăng khác nhau, có lúc thẻ không hiện giờ.
  - Ngoài-8: cùng lỗi với Ngoài-7: thẻ ghép hiện giờ đăng khác nhau giữa hai lượt và có thể mất dòng giờ mà không báo.
