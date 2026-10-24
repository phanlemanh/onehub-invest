# Review findings: deals-loai-tin-phi-ly (round 1)

## Trong hợp đồng

Không có finding nào map được vào AC.

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **Bước loại tin phi lý không cùng giao dịch với bước tính lại bait_gap_pct: tin phi lý có thể quay lại Căn giá tốt**
  Người dùng thấy gì: Nếu bước tính đêm bị lỗi hoặc dừng giữa chừng, vài căn có diện tích hay số phòng phi lý có thể hiện lại trên trang Căn giá tốt cho đến đêm chạy kế tiếp. Khi mọi thứ chạy bình thường thì không thấy.
  Căn cứ: Chỉ xảy ra khi đợt chạy đêm hỏng giữa chừng, tự hết ở lượt đêm sau, người vận hành chỉ thấy thêm vài thẻ thừa chứ không mất hay lộ dữ liệu.
  file: `pipeline/refresh-bait-gap.mjs`
  severity: medium
  Đề xuất: known-limits

- **Nghĩa của bait_gap_pct đổi (NULL cả khi tin phi lý) nhưng định nghĩa trong CONTEXT.md và mappings.yaml không cập nhật**
  Người dùng thấy gì: Phần giải thích trong từ điển về «chênh giá câu» chưa nói rằng tin phi lý bị bỏ số này, nên người đọc tài liệu có thể hiểu lệch so với những gì trang hiển thị. Người dùng cuối không thấy gì khác.
  Căn cứ: Chỉ là tài liệu chưa theo kịp, không ảnh hưởng số liệu hay màn hình, và bổ sung một đoạn chữ sau này rất rẻ.
  file: `CONTEXT.md`
  severity: low
  Đề xuất: known-limits

- **Thẻ DealCard mới đổi cỡ Badge và tự dựng nút gọi thay vì dùng component có sẵn**
  Người dùng thấy gì: Trên thẻ căn, nhãn phần trăm giảm và nút gọi điện có cỡ và kiểu hơi khác bộ thành phần chuẩn của giao diện. Chức năng vẫn dùng bình thường, chỉ là hình thức chưa đồng nhất hoàn toàn.
  Căn cứ: Chỉ lệch về thẩm mỹ, không ảnh hưởng thao tác hay dữ liệu, và có thể dọn trong đợt chuẩn hoá giao diện chung.
  file: `app/src/components/ops/deal-card.tsx`
  severity: low
  Đề xuất: known-limits

- **getDeals nuốt mọi lỗi của câu đầy đủ, không chỉ 42P01, và lặng lẽ chuyển sang bản cloud**
  Người dùng thấy gì: Nếu truy vấn đầy đủ trên máy local gặp lỗi bất ngờ như mất kết nối hay quá thời gian, trang lặng lẽ hiện danh sách thiếu số điện thoại, tên người bán và ảnh mà không báo gì. Người vận hành có thể tưởng dữ liệu bị thiếu thật.
  Căn cứ: Chỉ xảy ra khi truy vấn gặp lỗi hiếm, tải lại trang thường khắc phục được, danh sách vẫn đúng tin và đúng thứ tự, chỉ thiếu các cột chi tiết.
  file: `app/src/lib/deals.ts`
  severity: low
  Đề xuất: known-limits

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).
