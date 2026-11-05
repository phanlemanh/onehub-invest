---
schema_version: 1
feature: Bài S03 ghi diện tích không đơn vị sau nhãn «Diện tích» hay bằng chữ kiểu Unicode được đọc ra area_m2 như bài ghi m² thường
slug: doc-so-m2-bi-sot
owner: phanlemanh@gmail.com
risk_tier: T2
surfaces: [cli]
status: signed-off
design_doc: docs/superpowers/specs/2026-11-05-doc-so-m2-bi-sot-design.md
approved_by: Mạnh
approved_at: 2026-11-05
---

# Acceptance Contract: doc-so-m2-bi-sot

## Context

Bộ đọc tin S03 bỏ sót diện tích khi bài ghi «Diện tích: 45.7» không kèm đơn vị, hoặc viết số và m2 bằng chữ đậm kiểu Unicode. Đo lại 05/11 có 15 tin như vậy (14 bán, 1 thuê), danh sách ở `probes/mau-do.json`. Việc đứng riêng trong chuỗi gắn căn vì rẻ, và mỗi tin có số không phải đi đường diện tích suy ra.

Source input: hàng GC1 của `docs/plan/lo-trinh.json`; ROADMAP §3 mục 30.

## Criteria

- AC-1: Given bài ghi nhãn «Diện tích» rồi số không đơn vị, có hoặc không dấu hai chấm, số có phần lẻ dạng chấm hay phẩy, theo sau là hết dòng hoặc biểu tượng, When bộ đọc chạy, Then `areaM2` đúng số trong bài.
- AC-2: Given bài viết số và m2 bằng chữ kiểu Unicode (đậm, `㎡`), When bộ đọc chạy, Then `areaM2` đúng số, còn giá, số phòng, SĐT và loại tin giữ đúng giá trị như trước khi sửa.
- AC-3: Given bài có «hdt 21 triệu», «DT 21 triệu», «DT 65», «Diện tích: 3pn2wc», «Diện tích: 5x20», «Diện tích: 20 x 30», «Diện tích: 5×20», «Diện tích: 60-70», «Diện tích: 60 - 70», «Diện tích: 60/70», «Diện tích: 65 triệu», «Diện tích: 65 pn», «Diện tích: 14.9», «Diện tích: 501», «Diện tích: 1200», hay chữ m2 chỉ nằm trong đường link, When bộ đọc chạy, Then `areaM2` rỗng; đối chứng «Diện tích: 21», «Diện tích: 65», «Diện tích: 15», «Diện tích: 500», «Diện tích: 64, 2pn» đọc ra đúng số.
- AC-4: Given toàn bộ bài S03 tới mốc đo trên DB máy thu, When so bộ đọc trước và sau khi sửa bằng kết nối chỉ đọc, Then tập bài đổi đúng bằng danh sách đóng 141 bài với đúng số, 15 tin trong `mau-do.json` có đúng số, 4 tin phải giữ rỗng vẫn rỗng, không giá trị diện tích đã có nào đổi, và giá, số phòng, SĐT, loại tin không đổi ở bài nào.
- AC-5: Given bản sao DB máy thu dựng lại mỗi lần đo, When chạy transform bản cũ rồi bản mới bằng đúng lệnh chạy đêm, Then sau bản cũ 15 tin còn rỗng, sau bản mới 15 tin có đúng số, không tin nào đang có số bị đổi, tập tin đổi từ rỗng sang có số đúng bằng danh sách đóng, `offer_id` đã có không mất, không nhóm gom nào đổi thành viên, và mọi kết nối của transform đều vào DB thử.

## Coverage

Quét theo ba trục, thước là dữ liệu thật 80.317 bài S03 đo 05/11 (`docs/superpowers/specs/2026-11-05-doc-so-m2-bi-sot-design.md`), không phải suy đoán:

- Cách viết số: «Diện tích» + số không đơn vị (AC-1) · chữ kiểu Unicode (AC-2) · m² thường, giữ như cũ (AC-4).
- Thứ theo sau số: hết dòng, biểu tượng, chấm phẩy (AC-1) · chữ, dải, kích thước, đơn vị tiền (AC-3) · ngoài khoảng 15–500 (AC-3).
- Tầng đo: hàm thuần (AC-1, AC-2, AC-3) · toàn bộ bài thật, chỉ đọc (AC-4) · qua transform trên DB thử (AC-5).

Later: giá và số phòng viết kiểu Unicode (đo được 303 bài có giá chỉ đọc ra sau chuẩn hoá). Never: nhận nhãn «DT» trần, vì «dt» còn là doanh thu và nằm trong «hdt».

## Đường đo

- Ngưỡng «tin đo có đúng số»: AC-4, AC-5, từ `probes/mau-do.json`.
- Ngưỡng «băm area_m2 của các tin khác không đổi»: AC-5, trên mọi tin: không tin nào có số bị đổi, tin đổi từ rỗng sang có số đúng bằng danh sách đóng.
- Ngưỡng «hdt 21 triệu không thành diện tích»: AC-3, từ ca trong `pipeline/parse.test.mjs`.

## Out of scope

- Giá, số phòng viết bằng chữ kiểu Unicode: đổi giá là đổi thước giá và gom tin, tách việc riêng dù đo được 303 bài.
- Nhãn «DT», «dtsd», và «65 mét vuông» (đo 4 bài, cùng một bài đăng lại).
- Chạy transform trên DB thật, sửa dữ liệu `sale_offers` tay: tin có số sau transform đêm kế tiếp, khi đã gộp.
- Diện tích suy ra từ tin cùng toà, trục: GC2, GC3.

## Notes

- Danh sách 14 tin của đo 04/11 không được lưu; danh sách chuẩn là 15 tin đo lại 05/11.
- Đo nháp trên DB thử: 15 tin có thêm `area_m2` và `price_perm2`, 0 tin có số bị đổi, 0 nhóm gom đổi, 0 `confidence` đổi. Lên dữ liệu thật ở transform đêm sau khi gộp.
- Known limits — chọn ở Cổng Bằng chứng 2026-11-05:
  - Ngoài-1: Con số «80.317 bài» gồm 78.954 bài S03, 100 bài S05 và 1.263 bài thử; 141 bài đổi đều là bài S03.
  - Ngoài-2: Bài mới ghi diện tích kiểu «20*30» hay «65%» có thể bị đọc nhầm số đầu làm diện tích; hiện chưa bài nào mắc.
  - Ngoài-3: Phép đo «4 tin giữ rỗng» của E4 có thể báo đạt khi tin đã biến mất; hiện cả 4 tin còn.
  - Ngoài-4: Ca «SĐT đậm không thành diện tích» vẫn xanh khi bỏ lớp gạt SĐT, nên không bắt được lỗi ở lớp đó về sau.
  - Ngoài-5: Bộ kiểm không chứng minh được «Diện tích: 120.000» không thành 120 m² nếu chặn số dài bị bỏ nhầm.
  - Ngoài-6: Dải viết bằng gạch dài hay dấu ngã không có ca kiểm riêng, nên sửa nhầm luật ở đó không bị bắt.
  - Ngoài-7: Trùng Ngoài-3, phép đo giữ rỗng của E4 đếm cả tin không tồn tại.
  - Ngoài-8: Phép kiểm «không nhóm tin nào đổi thành viên» chưa có ca cố tình làm sai để xem nó có kêu không.
