## Ngữ cảnh
- Sản phẩm: cổng Invest — chân sản phẩm: `docs/product/CONTEXT-PRODUCT.md`, ROADMAP §3 mục 25 · chân ngành: Kleinanzeigen, Carsales (rao vặt có hiện số)

## Trục
- Lớp: sync | cloud DDL | API danh sách | API số | sổ bề mặt | giao diện | tài liệu [thước CE: `docs/research/kiem-tin-dau-ra-toan-thi-truong-0211.md` §10.3]
- Loại tin: đủ trường có số | đủ trường chưa số | thiếu trường | cũ | S02/S08 | tài khoản nhiều tên [thước CE: đo DB máy thu 02/11]
- Người gọi: khách | ops/bearer | cào hàng loạt [thước CE: `app/src/lib/api-surface.ts`]
- Trạng thái màn: có tin | lọc ra 0 | đang thu | tải | lỗi | số bốn trạng thái [thước CE: bảng đặc tả UX; `[NGÀNH: Kleinanzeigen, Carsales]` có bước trước khi lộ số]

## Core
1. Tên, SĐT sale_offers lên cloud, tên nguồn trong giá trị bị che — không có thì không có gì để hiện.
2. Danh sách công khai không mang số + API số từng tin — trục người gọi khách.
3. Điều kiện hiện một chỗ: B1, 30 ngày, S02/S08 — trục loại tin.
4. Một trang Listing theo Loại tin, thẻ chung, lọc, phân trang, bốn trạng thái số — trục trạng thái màn.
5. Sổ bề mặt, tài liệu luật đi cùng — đổi chế độ một route công khai.

## Later
- Trạng thái lấy số trên ô (nguồn ẩn số · chưa thử · lỗi): chờ DATA-CONTRACT chốt.
- Gộp tin đăng lại, «sống» thật, trường từ thô, tìm theo chữ, trang chi tiết tin rao.
- Ảnh tin rao: hàng `anh-tin-cong-khai`. Gộp hai bảng: hàng `gop-bang-listing`.
- `[NGÀNH: Carsales]` xác minh SMS trước khi hiện số: chỉ làm nếu đo thấy bị cào.
- `[GIẢ ĐỊNH]` Lưu tìm kiếm, báo tin mới.
- Đếm lượt bấm xem số: cần đường ghi cho khách, `user-events` hiện bỏ qua khách.

## Never
- Liên kết về tin gốc — lộ tên nguồn, tầng A.
- S02, S08 trên cổng — luật 5.
- Bộ đếm tần suất trong tiến trình — serverless không dùng chung bộ đếm.

## Cross-cutting áp mọi ô Core
- Không tên nguồn thật ở bất kỳ đầu ra nào; chữ UI lấy từ `CONTEXT.md`; thiếu số nói rõ là thiếu.
