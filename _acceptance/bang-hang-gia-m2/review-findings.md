# Review findings: bang-hang-gia-m2 (round 2)

## Trong hợp đồng

Không có phát hiện.

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **Hình dạng 2 — Fixture VIẾT TAY đúng khuôn bên đọc: số giảm CG8 cho lối lùi đóng dấu tay, không chạy writer refreshBaitGap**
  Người dùng thấy gì: Khi bảng xếp hạng giá mới chưa có dòng, trang danh sách tin giá tốt vẫn hiện tin theo số giảm cũ. Phép thử của lối này dùng số điền tay, nên nếu bước tính số giảm cũ đổi cách tính thì phép thử không báo, và có thể có tin hiện sai trong lúc chờ.
  Căn cứ: Lối lùi này chỉ dùng tạm cho tới khi bảng mới có dữ liệu, nên hậu quả nhẹ, không mất hay lộ dữ liệu, và chạy lại bước tính là hết; chỉ là phép thử kém chặt, ghi lại để biết là đủ.
  file: `pipeline/scripts/hang-gia-fixture.itest.mjs`
  severity: medium
  Đề xuất: known-limits

- **Bảng mới offer_price_rank đặt tên cột và giá trị enum bằng tiếng Việt, trái quy ước đặt tên đã chốt (r1)**
  Người dùng thấy gì: Tên các trường trong bảng hạng giá đang viết bằng tiếng Việt, trái quy ước chung của dự án. Người dùng cuối không thấy gì, nhưng đổi tên sau khi đã áp lên máy thật và cloud sẽ tốn công hơn.
  Căn cứ: Không ảnh hưởng người dùng cuối và không mất dữ liệu, nhưng càng để lâu sau khi áp lên cloud thì đổi tên càng đắt.
  file: `db/migrations/104_offer_price_rank.sql`
  severity: medium
  Đề xuất: new-contract

- **launch.json dùng chung bị định dạng lại toàn tệp và thêm cấu hình trỏ vào DB thử riêng của nhánh (r1)**
  Người dùng thấy gì: Tệp cấu hình chạy thử dùng chung bị định dạng lại toàn bộ, có thể gây xung đột với các nhánh khác khi gộp. Người dùng sản phẩm không bị ảnh hưởng.
  Căn cứ: Chỉ là chuyện bất tiện cho người làm, người dùng không thấy, và gặp xung đột thì gỡ được ngay lúc gộp.
  file: `.claude/launch.json`
  severity: low
  Đề xuất: known-limits

- **kind=rent_lt silently returns sale deals when offer_price_rank is missing or empty (app route) (r1 · tệp đã đổi)**
  Người dùng thấy gì: Khi bảng hạng giá chưa có, yêu cầu xem tin thuê lại nhận về danh sách tin bán mà không có dấu hiệu nào báo sai. Người xem có thể tưởng đó là tin thuê.
  Căn cứ: Chỉ xảy ra trong giai đoạn bảng chưa được áp lên cloud và hết hẳn khi bảng có dữ liệu; người dùng thử lại sau là hết.
  file: `app/src/app/api/v1/deals/route.ts`
  severity: medium
  Đề xuất: known-limits

- **data-api /v1/deals has the same silent fallback: kind=rent_lt returns sale offers when the rank table is missing (r1)**
  Người dùng thấy gì: API công khai khi chưa có bảng hạng giá sẽ trả danh sách tin bán dù khách hỏi tin thuê. Khách gọi API có thể nhận dữ liệu sai loại mà không biết.
  Căn cứ: Sai loại tin nhưng chỉ trong khoảng trước khi áp bảng lên cloud; không mất hay lộ dữ liệu và tự hết khi bảng có đủ.
  file: `data-api/src/routes/deals.ts`
  severity: medium
  Đề xuất: known-limits

- **Single-offer page: an offer not yet in offer_price_rank shows a wrong reason (CG8 'not enough listings to build a ruler') (r1)**
  Người dùng thấy gì: Tin mới đăng chưa kịp chấm hạng sẽ hiện lý do sai là phường chưa đủ tin để dựng thước, thay vì báo chưa chấm được. Người xem hiểu nhầm nguyên nhân.
  Căn cứ: Chỉ là chữ giải thích sai trong khoảng ngắn đến lần chấm đêm kế tiếp, không ảnh hưởng số liệu và tự hết.
  file: `app/src/lib/deals.ts`
  severity: low
  Đề xuất: known-limits

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).
