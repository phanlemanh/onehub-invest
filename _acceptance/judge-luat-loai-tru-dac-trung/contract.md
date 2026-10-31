---
schema_version: 1
feature: Bộ đánh giá ghép căn loại trừ tất định một cặp khi một đặc trưng nhà khác rõ, ghi đặc trưng nào khác vào evidence
slug: judge-luat-loai-tru-dac-trung
owner: phanlemanh@gmail.com
risk_tier: T2
surfaces: [cli]
status: machine-cleared
veto_state: mo
veto_opened_at: 2026-10-31T02:03:43Z
approved_by:
approved_at:
design_doc: docs/superpowers/specs/2026-10-31-judge-luat-loai-tru-dac-trung-design.md
---

# Acceptance Contract: judge-luat-loai-tru-dac-trung

## Context

Hàng HD2 (đợt 1 hàng duyệt), audit `docs/research/audit-hang-duyet-3010.md` §7.1 #6 và §7.3; Cổng Đáng ở `opportunity.md`.
Luật ghép căn `pl25-1` chỉ loại theo giá/m², phường, loại hình; Mạnh loại theo đặc trưng nhà — một đặc trưng khác là đủ —
và coi lệch diện tích nhỏ là khác căn.
Cổng Bằng chứng lần 1 (31/10) Mạnh trả lại, gom tám mục ngoài hợp đồng sửa luôn trong vòng (AC-9 – AC-11, AC-6 và AC-8 viết
lại, E5 sửa chữ); Ngoài-3 Mạnh chọn «đổi thẻ theo luật»: bảng so của thẻ duyệt so đường / toà / tầng bằng chính khoá của
luật, nên bốn ca test của ba hồ sơ đã ký (the-duyet-du-can-cu, the-duyet-phuong-lech-gia, the-so-doc-gia-tri-song) sửa theo.

## Criteria

- AC-1: Given ma trận viết trước gồm năm đặc trưng (phòng ngủ, WC, đường, toà, tầng), mỗi đặc trưng ba trạng thái (khác ở cả hai bên · giống ở cả hai bên · thiếu một bên), các trường còn lại giống nhau và trong ngưỡng «cùng căn», When chạy luật cả hai chiều A↔B, Then «khác ở cả hai bên» ra «khác căn», «giống» ra «cùng căn», «thiếu một bên» không ra «khác căn».
- AC-2: Given ma trận diện tích viết trước — nhà riêng: 52 ↔ 54 (lệch 2 m²), 52 ↔ 53 (1 m²), 40,5 ↔ 41,5 (1 m²), 45 ↔ 45, 50 ↔ trống; căn hộ: 70 ↔ 76 (6 m², 7,9%), 70 ↔ 80 (10 m², 12,5%) — các trường khác trong ngưỡng «cùng căn», When chạy luật cả hai chiều, Then nhà riêng lệch quá 1 m² ra «khác căn», lệch không quá 1 m² và bằng nhau không có lý do loại diện tích, trống một bên không có lý do loại diện tích; căn hộ lệch quá 1 m² nhưng không quá 10% không có lý do loại diện tích, căn hộ lệch quá cả 1 m² lẫn 10% ra «khác căn».
- AC-3: Given một cặp ra «khác căn» vì một đặc trưng, When đọc kết quả, Then `ly_do` có đúng một lý do mang mã của đặc trưng ấy và số đo hai bên ở `so`; `cau` của mọi lý do không chứa chữ số.
- AC-4: Given đường viết khác dạng của cùng một đường («Đường Đinh Bộ Lĩnh», «Đinh Bộ Lĩnh», «đinh bộ lĩnh», «Đ. Đinh Bộ Lĩnh») và hai đường khác nhau, When so đường, Then các dạng cùng đường không ra lý do loại, hai đường khác nhau ra «khác căn».
- AC-5: Given ma trận PL25 của `judge-nguong.test.ts` sửa theo luật mới (Hỏi-1), When chạy, Then mọi ô ra đúng kết luận mới và mọi ô PL25/KP/PS về giá/m², phường, loại hình giữ nguyên kết luận.
- AC-6: Given evidence của mọi thẻ ghép căn đã quyết trên DB máy thu, When chạy luật trên dữ liệu chụp trong evidence, Then mọi thẻ người quyết «Khác căn» mà bộ tính độc lập của test thấy ít nhất một trong sáu đặc trưng khác ở cả hai bên (phòng ngủ, WC, đường, toà, tầng, diện tích lệch quá sai số) đều ra «khác căn», và mọi thẻ người quyết «Cùng căn» không ra «khác căn» — đo theo tính chất trên mọi thẻ đã quyết, không theo danh sách id viết sẵn, nên người quyết thêm thẻ thì phép đo vẫn đứng; có ít nhất một thẻ từ chối mang đặc trưng khác; bộ nạp cặp thật (`queryPair`) trả các trường đặc trưng có giá trị ở ít nhất một cặp trên DB máy thu.
- AC-8: Given các dạng viết khác của cùng tầng («12», «Tầng 12», «tầng 12 ») và cùng toà («A1», «a1», «Toà A1», «Block A1»), cùng một chuỗi tầng không có số («tầng cao»), When so hai bên, Then cùng tầng và cùng toà không ra lý do loại, chuỗi tầng không có số được coi là thiếu một bên, còn hai tầng khác số và hai toà khác mã ra «khác căn».
- AC-7: Given luật mới, When đọc hằng số, Then `PHIEN_BAN_NGUONG` là `pl25-2` và `NGUONG` gồm đúng bốn ngưỡng: giá/m² «cùng căn» dưới 0,15, giá/m² «khác căn» trên 0,3, sai số làm tròn diện tích 1 m², sai số cách đo căn hộ 0,1.
- AC-9: Given ma trận viết trước 13 cặp đường/toà/tầng (cùng đường viết có dấu, không dấu, dạng slug; khác đường; thiếu một bên; toà có tiền tố; toà gọi bằng tên; khác toà; tầng có chữ; tầng không số; khác tầng), When so mỗi cặp cả hai chiều bằng hàm so của bảng so thẻ duyệt (rút nguyên văn từ `app/src/lib/ops/review-can-cu.ts`) và bằng hàm so của luật, Then hai bên ra cùng nhãn Khớp / Lệch / Thiếu ở mọi ô và đúng nhãn viết trước — bảng so trên thẻ hiện đúng thứ luật dùng để loại.
- AC-10: Given cùng một đường viết có dấu và không dấu («Duong Lam» ↔ «Phố Dương Lâm», «Duong Lang» ↔ «Đường Láng», «Pho Hue» ↔ «Phố Huế», «Duong Lam» ↔ «Dương Lâm») và hai đường khác nhau («Dương Lâm» ↔ «Đường Láng»), When chạy luật cả hai chiều, Then các cặp cùng đường không có lý do «đường khác» và ra «cùng căn», hai đường khác ra «khác căn».
- AC-11: Given hai toà khác mã («A» ↔ «B») và các cặp chỉ khác cách gọi («Block A» ↔ «Toà A», tên «Sao Biển» ↔ mã «S5.01», «Chung Cư 38 Hoàng mai» ↔ «A», «Park 6» ↔ «S1001»), When chạy luật cả hai chiều, Then hai toà khác mã ra «khác căn» với đúng một lý do mã `khac_toa` và câu «toà khác» (theo từ vựng `block_raw` «Toà», không lý do nào gọi «mã căn»), còn các cặp chỉ khác cách gọi không có lý do `khac_toa`.

## Coverage

Quét tay ba trục (dòng sổ «bỏ coverage-scan»), mỗi ô một AC:

| Trục | Giá trị | AC |
|---|---|---|
| Đặc trưng | phòng ngủ · WC · đường · toà · tầng · diện tích | AC-1, AC-2, AC-4, AC-11 |
| Trạng thái hai bên | khác · giống · thiếu một bên · viết khác dạng · có dấu / không dấu · tên gọi toà · trong sai số làm tròn / cách đo | AC-1, AC-2, AC-4, AC-8, AC-10, AC-11 |
| Đầu ra | kết luận · lý do có mã · nhãn bảng so thẻ duyệt · ma trận cũ · dữ liệu thật · phiên bản | AC-3, AC-5, AC-6, AC-7, AC-9 |

## Đường đo

| Ngưỡng (opportunity.md) | Đo bằng |
|---|---|
| Cặp đã từ chối có đặc trưng khác ra «khác căn» ở mọi cặp đủ đặc trưng hai bên | AC-6 trên DB máy thu |
| Cặp đã nhận không bị loại | AC-6 (thẻ #23) |
| Đặc trưng thiếu một bên không bao giờ thành lý do loại | AC-1 (ô «thiếu một bên»), AC-6 |

## Out of scope

- Số nhà, kích thước mặt tiền × sâu, số tầng nhà, toạ độ — chưa có trên `sale_offers`; chờ hàng HD5 `dac-trung-nha-s06-len-canonical`.
- Sửa `agent/scripts/judge-run.ts` — HD3 của P3 đang sửa; lý do mới đi vào evidence qua `ly_do` sẵn có.
- Chạy lại judge-run trên hàng duyệt thật để đổi kết luận thẻ chờ — việc vận hành sau khi gộp.
