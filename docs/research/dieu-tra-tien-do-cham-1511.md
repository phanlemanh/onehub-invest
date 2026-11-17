# Điều tra tiến độ chậm: vì sao tới 15/11 vẫn 0 tin được định vị

Bản chưng cất của phiên điều tra sáng 15/11/2026 (chỉ đọc; đo trên DB máy thu và kho lúc 23:24–23:50Z 14/11). Bản thô đầy đủ ở
`research-local/` trên máy thu. Căn cứ của ROADMAP §3 mục 50 và mục «Ai quyết gì» trong `AGENTS.md`.

## Kết luận

1. **Màn báo 0 tin định vị vì một chỗ trống trong mã, không phải vì thiếu dữ liệu.** Ô «Định vị» và «Gắn căn» của màn «Chất lượng
   từng chặng» được nối vào hai bảng tạm luôn rỗng trong `pipeline/sql/600_data_flow.sql` từ 09/11 (#377), và không hàng nào trong
   lộ trình nối lại. Trong khi đó từ 14/11 đã có **4.934/6.102 tin S03 mang dự án** (phát biểu `project_node_id` theo bài, nối qua
   `sale_offers.post_ids`), trong đó 1.395 tin căn hộ có giá và m².
2. **«Chia quá nhỏ, phân mảnh»: đúng một phần.** Từng hàng đi nhanh (trung vị 11,9 giờ từ mở hồ sơ tới gộp). Cái chậm là hướng và
   điểm dừng: trong 140 PR gộp từ 05/11 chỉ khoảng 23 (16%) nằm trên chuỗi danh bạ → định vị → giá, và không hàng nào kết thúc
   bằng một con số tăng trên màn. 52% số dòng thêm là hồ sơ nghiệm thu và tệp máy sinh; 117/140 PR chạm hai tệp máy sinh nên PR
   kế phải nhận lại main. Chủ kho nhận 182 câu hỏi trong 10 ngày.
3. **«Giải chi tiết, thiếu tổng quát hoá và thiếu kiểm phủ ca»: đúng.** 43/140 PR là sửa cái vừa làm. 170 lượt chấm trên 89 hồ sơ,
   42% bị trả; khoảng 62% lần sửa sau khi bị trả là sửa test hay thước, không phải sửa sản phẩm. Người chấm gắn cờ «tuyên quét cả
   lớp nhưng chỉ có ca điểm, ma trận không viết trước» ở 109 hồ sơ. 547 mục ngoài hợp đồng, 80% thành giới hạn đã biết.
4. **Gốc chung:** hàng dừng ở «gộp»; không ai sở hữu đoạn từ gộp tới con số trên màn. Lời áp lên dữ liệu thật đến rải rác sau gộp
   (13 lời trong khoảng 5 ngày; có hàng mất 16 giờ từ gộp tới ghi thật, rồi vẫn không lên màn).
5. **Sự cố im lặng làm nặng thêm:** ví trả trước của cổng model hết tiền từ 19:14Z 12/11 (mã 402, log chỉ ghi tên lớp lỗi chung),
   ba đêm đọc bài S03 hỏng 100% mà không có cảnh báo.

## Từng ô trên màn chờ gì (15/11)

| Ô | Chờ gì |
|---|---|
| Định vị = 0, cả hai nguồn | Mã: ô nối vào bảng rỗng. Dữ liệu S03 đã có (4.934 tin). |
| Định vị S06 | Thẻ luật S06 chưa áp (0 luật nối, 0 dòng nối); áp xong vẫn 0 nếu ô chưa được nối. |
| Gắn căn = 0 | Cùng chỗ trống trong mã, cộng danh bạ căn mới có ở hai khu. |
| S03 «chờ khớp» cấp toà | Bước gắn tin vào toà (PL20) chưa mở. |
| S03 gom cụm = 0 | Bộ dựng cụm chỉ làm cho S06 (cần toạ độ); gom tin S03 chưa có hàng đang chạy. |
| S03 đủ trường lõi 32% | Thiếu m² là chính (61% tin trong 7 ngày, phần lớn là tin thuê). Gỡ bằng so giá tháng theo số phòng ngủ. |
| S06 gom cụm 24% | Không phải nút thắt: đó là tỉ lệ tin đăng lại thật. |

## Đường găng tới nhịp 1 (MN1: xếp hạng giá cấp dự án, hiện trên Ops)

1. Gộp các PR đã ký trên chuỗi (sửa xã bộ nút ứng viên; bảng hạng giá/m² CG9).
2. Áp migration bảng hạng lên máy thu; bước xếp hạng chạy trong chuỗi đêm.
3. Áp thẻ luật S06 (khoảng 268 mã dự án, khoảng 11 nghìn tin căn hộ theo số đo 14/11).
4. Một nguồn «dự án của tin» cho mọi nguồn và nối ô Định vị — trước 15/11 không hàng nào phủ.
5. CG10: xếp hạng nhóm dự án × loại (× số phòng ngủ), nhãn «giá tốt».
6. Ops: lọc theo dự án trên `/ops/deals`.

## Năm chuỗi sửa lặp và bảng phủ ca lẽ ra bắt được

| Chuỗi | Ca bị sót |
|---|---|
| Danh bạ xã → nút ứng viên (bốn PR sửa nối nhau) | loại nút «ứng viên» × lệnh sửa xã; DB đã nạp thật |
| Nạp S08 → hàng sửa | loại snapshot (chỉ căn) × migration thiếu |
| Đọc gộp S03 bằng model → env rỗng → ví hết tiền | lời gọi ngoài × cách hỏng (thiếu khoá, 401, 402, 429, 5xx, JSON hỏng, timeout) |
| Nhóm S03 đăng ký hai lần | một nhóm hai mã đăng ký |
| Ghi dự án lên bài nhưng màn vẫn 0 | đầu ra mới × ai đọc nó phía sau |

Mẫu chung: hợp đồng viết theo lời hứa của hàng, ca thử dựng từ ca điểm viết tay; lớp dữ liệu thật chỉ lộ ra ở lượt chấm hay sau
gộp, rồi thành một hàng sửa mới.

## Thay đổi hành vi đã chốt (ROADMAP §3 mục 50)

- Hàng trên đường găng xong khi con số trên màn đổi trên dữ liệu thật.
- Phiên giám sát giữ một thước đầu-cuối cho nhịp đang làm và soi mỗi lượt; số đứng yên hai lượt liền là đỏ.
- Bảng phủ ca trước khi viết mã cho transform, bước khớp, lời gọi ngoài.
- Chữ ký Cổng Bằng chứng kèm lời áp lên DB máy thu những gì hồ sơ đã ghi.
- Gom việc liền nhau thành một lát; tạm dừng hàng ngoài đường găng tới khi nhịp xong.

## Chưa đo được

- Tách riêng thời gian chờ khoá chấm, chờ chữ ký và nhận lại main (sự kiện của đợt không ghi cặp xin → cấp).
- Lịch sử số trên màn theo ngày, nên không đếm chính xác hàng nào làm số tăng.
- Bao nhiêu bài thuê S03 có m² trong chữ mà bộ đọc bỏ sót.
- Phân loại PR và lý do trả hồ sơ dùng từ khoá; sai lệch vài đơn vị là có.
