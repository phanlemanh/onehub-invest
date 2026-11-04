---
schema_version: 1
slug: s03-len-cong
feature: Nhà đầu tư mở trang tin rao và thấy tin S03 đủ giá, diện tích, kể cả tin không nói phường (mang khu vực cấp thị trường), kèm nhãn «chưa xác minh»
owner: phanlemanh@gmail.com
stage: held
verdict: iterate
decided_by: Mạnh
decided_at: 2026-11-04T03:16:18Z
---

## Ngưỡng đã khai tại Cổng Đáng (CHÉP NGUYÊN VĂN — cấm sửa sau khi thấy số)

Mạnh chốt ngày 04/11/2026, nguyên văn đề xuất, sau khi đã thấy số sai nặng 4/30. Không đổi chữ nào.

- Câu hỏi phép đo trả lời: đã đạt «S03 lên cổng ≥ 900 tin; sai nặng ≤ 10%; tin khu vực cấp thị trường không có dấu hiệu theo phường và không làm lệch rollup 300, 400» chưa?
- Kết quả nào là SỐNG: S03 lên cổng ≥ 900 tin; sai nặng ≤ 10%; tin khu vực cấp thị trường không có dấu hiệu theo phường và không làm lệch rollup 300, 400
- Kết quả nào là CHẾT: đường gãy, số lên cổng không vượt 50 khi hết timebox. Dưới 900 mà trên 50 chỉ là cảnh báo, báo đúng số (kế hoạch §1: ngưỡng chỉ để cảnh báo, không chặn ra mắt; §4 mục 6: ra mắt S06 trước)
- Timebox: 2026-11-04 (mốc Ba việc của kế hoạch ra mắt 05/11 xong; từ 22:00 ngày 04/11 chỉ gộp bản vá đường ống)

Lái-thử: `stranger-drive.md`, ván 01:40Z ngày 04/11/2026, biến thể UI, `chan: 0` sau định đoạt. Người lạ ghi 2 vấp CHẶN ở mục tiêu 4 (mở tin xem chi tiết, biết tin từ nguồn nào) và làm được mục tiêu 1, 2, 3, 5. Mạnh ngày 04/11/2026 chọn «Không chặn, tách việc», nên hai vấp thành KHÓ-CHỊU và việc tách ra ngoài hồ sơ này. Giới hạn của ván ghi trong nhật ký: hồ sơ trình duyệt và ngữ cảnh không trắng.

## Người dự

| Tên | Vai | Đại diện cho ai |
|---|---|---|
| Mạnh | Chủ sản phẩm, người trong đội | Nhà đầu tư. Chưa có người dùng đại diện thật trước 05/11, nên điểm nói về kỳ vọng nhiều hơn về sản phẩm. |

## Chấm kín (thu TRƯỚC mọi thảo luận chung)

Câu gợi từ lái-thử, không phải verdict:

- Khi chưa mở được tin nào, bạn có đủ thông tin trên thẻ để quyết định gọi cho người đăng không?
- Thấy nhãn «Chưa xác minh» trên một tin, bạn sẽ xử sự với tin đó thế nào?
- So với cách bạn đang tìm nhà hiện nay, trang này giúp bạn được việc gì, và việc gì bạn vẫn phải làm ở nơi khác?

| Người | Điểm/nhận xét kín | Sẽ gửi cho khách nào, khi nào |
|---|---|---|
| Mạnh | Điểm: 3, vì không có được địa chỉ đủ chi tiết, không dùng được, nếu là đầu tư thì cần nhìn nhanh tại sao tôi phải quan tâm đến căn này, và nó có cùng phương pháp đầu tư của tôi không? Ví dụ đầu tư dòng tiền, tăng giá thì % tăng giá, % doanh thu thuê,...có thể lấy từ phường, toà,...hay căn này giá so với thấp so với mặt bằng chung top 10% giá tốt nhất không? chỉ dẫn nào. | Còn lại chưa gửi vì quá đơn giản |

Mạnh nói thêm sau khi đã thấy bảng số, nên không tính là chấm kín: «Thiếu ảnh nữa thì mù về hình dung»

Cũng sau khi thấy số: «Phải tối thiểu biết được vị trí, như đường thì nhà liền thổ, thấp tầng, phân khu, toà,...»

## Thảo luận sau khi đã chấm

Không có thảo luận chung: phiên có một người dự.

## Số đo thật đặt cạnh ngưỡng

| Thước | Ngưỡng đã khai | Số đo được | SỐNG/CHẾT |
|---|---|---|---|
| S03 lên cổng | ≥ 900 tin | 1179 tin (bán 774, thuê 405), DB chung, 03:11Z ngày 04/11. Trên cloud chưa đếm: trang thật có thẻ S03, quyền đọc production chưa được cho | SỐNG trên DB chung |
| Sai nặng | ≤ 10% | 4/30 = 13,3%, khoảng Wilson 5,3%–29,7%, tính cả bài nhiều căn. Chỉ tính giá trị sai: 1/30 = 3,3%. Nhãn do tác tử gắn, không phải nhãn vàng; mẫu không có tin LLM | Chưa đạt, khoảng còn chứa 10% |
| Tin cấp thị trường không có dấu hiệu theo phường | Không có | 0 dòng `bait_gap_pct`, thước giá, `market_asset_stats` cấp thị trường; 0 cặp ứng viên chứa các tin này | SỐNG |
| Không lệch rollup 300, 400 | Không lệch | `300_metrics.sql` và tệp `400_*.sql` không đọc `sale_offers` | SỐNG |
| Lọc theo phường trên trang | Không đo riêng trên cổng thật | E10 trên DB thử, chưa đo trên cổng thật | CHƯA ĐO |
| Ngưỡng CHẾT | Đường gãy, không vượt 50 khi hết timebox | 1179, đường đã chạy | Không rơi vào CHẾT |

Số ngoài ngưỡng, đặt cạnh nhận xét của người dự: trong 1179 tin lên cổng, 1154 tin (97,9%) chỉ có khu vực cấp thị trường, 25 tin có phường. 19 tin có `bait_gap_pct`.

Độ phủ vị trí trên DB chung, 04/11: S03 có tên đường 0/1179; có mã toà trong `block_raw` 721/1179, thẻ không hiện cột này và mã không kèm tên dự án; 451/1179 (38,3%) không có gì chi tiết hơn thành phố. Đối chứng S06: có phường 60.769/60.769, có đường 59.813/60.769 (98,4%).

## Quyết định Cổng Giá trị

- **verdict = iterate.** Mạnh trả lời «Lặp thêm». Căn cứ: sai nặng 13,3% trên đích 10% (khoảng 5,3%–29,7% còn chứa 10%); người dự chấm 3 điểm vì thiếu địa chỉ đủ chi tiết, thiếu chỉ dẫn đầu tư, chưa gửi cho khách.
- Bước kế: mở vòng kế bằng `/feature-loop:feature-loop <mô tả>`, hồ sơ mới. Tin S03 vẫn giữ trên cổng cho ra mắt 05/11.
