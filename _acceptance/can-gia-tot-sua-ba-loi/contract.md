---
schema_version: 1
feature: Người vận hành thấy đúng tên người đăng, đúng lý do rời danh sách của căn đắt hơn thước, và đường về danh sách không quay lại chính trang một căn
slug: can-gia-tot-sua-ba-loi
owner: phanlemanh@gmail.com
risk_tier: T2
surfaces: [ui]
status: implemented
veto_state: mo
veto_opened_at: 2026-11-03T22:01:42Z
approved_by:
approved_at:
design_doc: docs/superpowers/specs/2026-11-04-can-gia-tot-sua-ba-loi-design.md
---

# Acceptance Contract: can-gia-tot-sua-ba-loi

## Context

Ba mục Ngoài-5, Ngoài-9, Ngoài-10 mà Mạnh chọn «mở hợp đồng mới» ở Cổng Bằng chứng của `can-gia-tot-biet-can` ngày 03/11 (sổ quyết định của hồ sơ đó, dòng 47, 51, 52). Mạnh chọn làm luôn trước 05/11 việc lọc cùng chữ giữ chỗ ở trang Invest công khai (AC-6). Giám sát giao thêm ca `CGT-DC` quá trần 600 giây sau khi kho có 1.483 tin P1 bán, chặn mọi làn `app` (AC-7). Không đổi bố cục, không đổi dữ liệu.

## Criteria

- AC-1 (cross-layer): Given lược đồ tạm có các căn với `seller_name` là `unknown`, ` UNKNOWN `, chuỗi rỗng, chuỗi toàn khoảng trắng, NULL, tên thật, `Na`, `Anh Unknown`, và `sender_name` là tên thật, `unknown`, hoặc không có bài gốc, When vai Vận hành mở bảng, sheet và trang một căn qua page thật, Then chữ giữ chỗ không hiện như tên ở bề mặt nào; `seller_name` không phải chữ giữ chỗ thì giữ nguyên, kể cả `Na` và `Anh Unknown`; `seller_name` là chữ giữ chỗ thì dùng `sender_name` thật; cả hai đều không có thì hiện chữ thiếu tên sẵn có; tên lấy từ bài gốc vẫn qua bộ che tên nguồn và không tới tay vai Người xem; trên lược đồ cloud `unknown` không hiện.
- AC-2 (cross-layer): Given căn số giảm −20, −0,5, 0 và 4 trong lược đồ tạm, When vai Vận hành mở trang một căn qua page thật, và mở căn −20 trên lược đồ cloud, Then căn số âm ghi đúng nguyên câu «Đắt hơn thước phường <số>%, không phải căn giá tốt», số không mang dấu trừ, không có «Giảm» và «dưới ngưỡng» trong lý do; căn 0 và 4 giữ câu «Giảm <số>%, dưới ngưỡng 5%»; nhãn «Đã rời danh sách» còn ở cả bốn căn.
- AC-3 (cross-layer): Given 32 căn đủ ngưỡng, trong đó hai căn đồng mức giảm ở ranh hạng 30 và 31, một căn cần xác minh đứng ngoài giới hạn, và một căn đã rời danh sách trong lược đồ tạm, When mở trang một căn của từng căn rồi đi theo crumb «Căn giá tốt» qua page thật, Then crumb có `?can=<id>` khi và chỉ khi căn nằm trong kết quả `getDeals()` cùng nơi chạy; căn ngoài đó và căn đã rời có crumb `/ops/deals`; không căn nào có crumb chuyển ngược về chính trang đang đứng; `?can=` của căn ngoài danh sách vẫn chuyển sang trang một căn; đúng như vậy trên lược đồ cloud và ở vai Người xem; giới hạn của trang danh sách và của câu kiểm là một hằng số.
- AC-4: Given toàn bộ ca của `can-gia-tot-biet-can`, When chạy lại sau khi sửa, Then mọi ca CG1 và kiểm tuân thủ cổng `deals-gate` vẫn xanh, và tệp test của CG1 chỉ có dòng thêm, không có dòng cũ bị xoá hay sửa.

- AC-5: Given bản đang chạy trên DB máy thu, chỉ đọc, When vai Vận hành mở trang một căn có `seller_name` là `unknown`, trang một căn có số giảm âm, và trang một căn còn trong danh sách, ở khổ 390 px và khổ màn hình, Then ô tên không hiện «unknown»; nhãn lý do đọc đủ câu mới, không vỡ khung hay sinh thanh cuộn ngang; bấm crumb của căn trong danh sách mở sheet đúng căn, bấm crumb của căn đã rời về bảng.
- AC-6 (cross-layer): Given lược đồ tạm có các tin hiện được với `seller_name` là `unknown`, ` UNKNOWN `, chuỗi rỗng, chuỗi toàn khoảng trắng, NULL, tên thật, `Na`, `Anh Unknown`, một tài khoản có hai tên thật và một `unknown`, và một tài khoản có ba tên thật, When khách gọi hàm danh sách, route `/api/v1/listings` và vẽ vùng máy chủ thật của trang tin rao, Then chữ giữ chỗ không hiện như tên ở cả ba đường, thẻ hiện «Chưa có tên»; tên khác giữ nguyên, kể cả `Na` và `Anh Unknown`; `unknown` không tính là một tên khi đếm tài khoản nhiều tên, nên tài khoản hai tên thật vẫn giữ tên còn tài khoản ba tên thật vẫn về nhãn.
- AC-7: Given DB máy thu chỉ đọc có 1.483 tin P1 bán, When chạy ca `CGT-DC` một mình, Then ca đối chiếu đủ mọi tin qua `getDeal`, không lấy mẫu, tối đa 5 lời gọi cùng lúc, xong trong tối đa 300 giây để trần 600 giây còn dư ít nhất 2 lần; đối chứng đỏ khi lấy mẫu, chạy tuần tự, hoặc vượt giới hạn.

## Coverage

Bỏ quét không gian: entry `descope` «bỏ coverage-scan» trong `decisions.jsonl`. Phạm vi là đúng ba mục đã có tên từ Cổng Bằng chứng; các trục liệt tay dưới đây chỉ phủ trong từng mục.

- Trục A — Giá trị tên: chữ giữ chỗ | rỗng | NULL | tên thật | tên ngắn giống chữ giữ chỗ | tên chứa chữ giữ chỗ → AC-1.
- Trục B — Số giảm dưới ngưỡng: âm | âm lẻ | 0 | dương → AC-2.
- Trục C — Vị trí căn: hạng đầu | hạng 30 | hạng 31 | cần xác minh ngoài giới hạn | đã rời → AC-3.
- Trục D — Nơi chạy, vai: máy thu | cloud | Vận hành | Người xem → AC-1, AC-2, AC-3.
- Trục E — Khổ nhìn: 390 px | màn hình → AC-5.
- Trục G — Cách đếm CGT-DC: đủ | lấy mẫu | tuần tự | quá giới hạn → AC-7.
- Trục F — Đường đọc Invest: hàm | route | vùng máy chủ; đếm nhiều tên có và không có chữ giữ chỗ → AC-6.

## Out of scope

- Sửa chữ `unknown` tận gốc ở đường ống hay bộ thu; giá trị thô giữ nguyên.
- Lọc `Na`: đo 04/11 là tên một người đăng thật ở S03 (2 SĐT, một nhóm, 47/47 tin trùng `sender_name`).
- Trường `contact.senderName` của `data-api/src/routes/deals.ts`: đọc thẳng `sender_name`, đo 04/11 có 32/69.843 bài `unknown`; không thuộc trang Invest, là việc kế. Thẻ duyệt đã lọc sẵn.
- Phân trang để căn ngoài 30 mở được sheet: CG2.
- Dấu phẩy thập phân của số phần trăm: CG1 đã xếp không sửa.

## Notes

- Giới hạn đo: hạng 31 không có trên DB máy thu (3 căn đủ ngưỡng ngày 04/11), nên đường crumb về bảng của căn ngoài 30 chỉ đo qua page thật trên lược đồ tạm, không có frame.
- Giới hạn đo AC-6: DB máy thu có 0 tin `unknown` lọt điều kiện hiện công khai, nên AC-6 chỉ đo trên lược đồ tạm với vùng máy chủ thật, không có frame.
