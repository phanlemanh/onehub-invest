# Sửa ba lỗi hiển thị của Căn giá tốt (Ngoài-5, Ngoài-9, Ngoài-10 của CG1)

Mạnh chọn «mở hợp đồng mới» cho ba mục này ở Cổng Bằng chứng của `can-gia-tot-biet-can` ngày 03/11. Không đổi bố cục, không đổi dữ liệu; chỉ đổi chữ hiện ra và đích của một liên kết.

## Ba lỗi

**Ngoài-5, tên người đăng.** `toDealRow` lấy `seller_name ?? sender_name`. Chữ giữ chỗ `unknown` không phải NULL nên thắng `??`: ô tên hiện «unknown» và tên trong bài gốc bị che. Đo trên DB máy thu 04/11: 6 tin P1 có `seller_name = unknown`, 32 bài có `sender_name = unknown`.

Cách sửa: dùng lại `tenTin` của `lib/ops/review-context.ts`, hàm thẻ duyệt đã viết cho đúng chữ giữ chỗ này: chuỗi rỗng, chuỗi toàn khoảng trắng và chữ `unknown` (không phân biệt hoa thường, bỏ khoảng trắng hai đầu) thành NULL. Áp cho cả hai cột rồi mới chọn. Khi cả hai đều không có tên, các bề mặt đã có sẵn chữ thiếu tên. Bộ che tên nguồn trong `hoanTat` chạy sau bước chọn nên phủ cả tên lấy từ bài gốc.

Không lọc `Na`. Đo 04/11: đúng chữ `Na` ở 47 tin S03 với 2 SĐT, 1.186 bài trong một nhóm, 47/47 tin có `sender_name` trùng. Đó là tên một người đăng thật. `unknown` chỉ có ở S05, 6 tin P1, 2 tin có `sender_name` khác.

**Ngoài-9, lý do rời danh sách.** `lyDoRoi` so `discountPct < 5` rồi in trị tuyệt đối: căn đắt hơn thước 20% thành «Giảm 20%, dưới ngưỡng 5%». Trên DB máy thu có 17 tin P1 số giảm âm.

Cách sửa: nhánh riêng cho số âm, cùng cách nói với `cauChungMinh`: «Đắt hơn thước phường 20%, không phải căn giá tốt». Số 0 và số dương dưới ngưỡng giữ câu cũ.

**Ngoài-10, crumb.** Trang một căn đặt crumb về `/ops/deals?can=<id>` cho mọi căn chưa rời danh sách. Căn đủ ngưỡng nhưng ngoài 30 căn đã tải thì trang danh sách chuyển ngược về trang một căn, nên bấm crumb đứng yên tại chỗ.

Cách sửa: giữ nguyên chuyển hướng của `?can=` (quyết định `d-20261102T235239Z-25` của CG1). Trang một căn hỏi `dealTrongDanhSach(offerId)`: căn có trong đúng câu `dealsSql` với cùng giới hạn thì crumb mở sheet, không thì crumb về `/ops/deals`. Câu hỏi bọc chính `dealsSql` bản cloud, bản này chạy được ở cả hai nơi. Hai bản chỉ khác cột bài gốc, cột số căn và số nhà; WHERE, ORDER BY và LIMIT là một đoạn mã nên chọn cùng một tập căn, và `offer_id` làm khoá phụ nên đồng hạng ở ranh 30/31 không lệch. Giới hạn 30 thành hằng `SO_CAN_DANH_SACH`.

Phương án đã loại:
- Gọi `getDeals()` trên trang một căn: tải cả media và bộ che cho 30 căn chỉ để lấy một đúng sai.
- Thêm tham số vào URL để chặn chuyển hướng: thêm một trạng thái URL mà chỉ crumb dùng.
- Thêm căn ngoài 30 vào cuối bảng: phá thứ tự `dealsSql` mà AC-1 của CG1 giữ.

## Việc không làm

- Sửa chữ `unknown` tận gốc ở đường ống hay bộ thu: giá trị thô giữ nguyên, phần diễn giải ở lớp đọc.
- Thẻ duyệt đã lọc bằng `tenTin`. Trường `contact.senderName` của `data-api/src/routes/deals.ts` đọc thẳng `sender_name`, đo 04/11 có 32/69.843 bài `unknown`; không thuộc trang Invest, là việc kế.
- Sửa đổi 04/11: Mạnh chọn làm luôn trang Invest công khai trước 05/11 (AC-6). `offers-public.ts` dùng `tenTin`, và `unknown` không tính là một tên khi đếm tài khoản nhiều tên.
- Phân trang: CG2.
