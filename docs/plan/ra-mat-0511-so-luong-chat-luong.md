# Ra mắt 05/11: giám sát số lượng, chất lượng và kế hoạch ba ngày

> 02/11/2026. Kết quả phiên Framing → Phân tích → Hoàn thiện → Đề xuất với anh Mạnh. Framing và bộ chỉ số anh đã chốt;
> kế hoạch ở §3 chờ anh chốt. Số đo lúc 22:30 ngày 02/11, trước lượt nạp SV1 lúc 00:00. Chỗ ghi «ước» là chưa đo.

## 1. Khuyến nghị

Số lượng không còn là khoảng cách lớn nhất. Ba ngày còn lại dành cho **đưa tin đã có lên cổng**, **cho liên hệ được**, và
**để AI chạy thật trên S03**. Đi theo thứ tự: TR1 → Đà Nẵng → S03 lên cổng → LLM đọc S03 → SĐT S06. Không theo đuổi thêm
S08, S01 hay nhóm S03 trong đợt này. Ngưỡng chỉ để cảnh báo, không chặn ra mắt; riêng tầng A vẫn chặn.

## 2. Tám chỉ số

Năm chỉ số đầu phục vụ nhà đầu tư và môi giới; ba chỉ số sau phục vụ nền tảng vận hành.

| Chỉ số | Đo bằng gì | 02/11 | Đích 05/11 | Báo đỏ khi |
|---|---|---|---|---|
| 1. Số lượng | Tin lên cổng theo điều kiện TR1 | S06 41.075; S03 4 | S06 ≥ 46.000 khi Đà Nẵng xong; S03 ≥ 900 (ước) | Giảm hơn 2% giữa hai lần đo |
| | S06 bán: phủ 3 vùng | ≤ 79% (18.343/≥ 23.205) | ≥ 90% | Không có lần thu mới sau giờ lượt |
| 2. Đúng | S06 giá, diện tích khớp nguồn; cờ phi lý | 100%; 99,6%; 427 cờ | Khớp ≥ 99%; cờ không tăng | Khớp < 99% |
| | Mẫu 30 tin mỗi kênh, máy chấm | Sai nặng S06 0/30, S03 5–8/30 | S03 ≤ 10% | Sau SV1: S03 > 20%, S06 > 3% |
| 3. Không trùng | Tin nghi trùng dư | S06 bán 2,8%, thuê 3,7%; S03 bán 149, thuê 107 | Không tăng | Tăng hơn 1 điểm % |
| 4. Dấu hiệu | Tin bán ở phường có thước giá | S06 86%; S03 2% | S06 ≥ 85% | S06 < 80% |
| 5. Liên hệ | Tin có SĐT | S06 0; số đã thu 591; S03 1.576/2.772 | ≥ 20.000 tin S06 (ước) | 07:30 ngày 04/11 số đã thu chưa tăng; 17:00 ngày 04/11 có số mới mà 0 tin có số |
| 6. Không tệ đi | Giữ trường qua thô → tin → căn | Đường 95 → 19 → 19; PN 81 → 82 → 17; dự án 22 → 0; ảnh 100 → 0 | Mỗi trường rơi có đường sửa hoặc ghi rõ cố ý bỏ | Giảm thêm hơn 1 điểm % |
| 7. Nhanh | Đăng → thu → thành tin | S03 31 giây → tới 24 giờ; S06 p50 9,4 giờ, p95 51,5 giờ | S06 p50 ≤ 12 giờ | Một lượt không chạy |
| 8. AI | Tin S03 có đề xuất AI; có AI đã áp; cuộc gọi thành công | ≤ 236/2.772 (≤ 8,5%); 114 (4,1%); 103/104 | ≥ 90%; ≥ 50% | Thành công < 95%; chi cloud > 5 USD/ngày |

Chỉ báo, không đặt đích: S06 thuê · số vùng S06 · S01 838/1.000 căn · S08 150/200 dự án · câu hỏi 3 có công cụ hay chưa.
Câu hỏi 4 chưa tính trong đợt này.

Nhịp đo: 07:30 báo đủ tám dòng; 17:00 chỉ báo khi đỏ; 07:30 ngày 05/11 là bản chốt. Việc đo chạy bằng lịch của app, mỗi lần
một phiên mới, chỉ đọc. App đóng thì chạy lúc mở lại.

## 3. Kế hoạch

| # | Việc | Ai làm | Đo xong bằng gì | Mốc |
|---|---|---|---|---|
| 1 | TR1: ký PR #274, bật giới hạn tần suất, gộp, catch-up | Anh ký và bật; giám sát đợt gộp | Cổng cloud hiện ≥ 41.000 tin | Sáng 03/11 |
| 2 | Đà Nẵng: áp 064, nạp phường từ 93 ranh giới đã có, chuyển lại tin, chạy 300 + 400 | Anh duyệt áp; liên làn chạy | Đà Nẵng ≥ 80% có phường (AC-8); lên cổng thêm tới 6.601 tin | Chiều 03/11 |
| 3 | S03 lên cổng: khai sổ nhóm 30 nhóm, thẻ 16 nhóm lớn; tin không nói phường nhận khu vực cấp thị trường; kèm nhãn «chưa xác minh» | Dãy N1 đổi từ SV2 sang; anh duyệt nháp sổ và thẻ | S03 lên cổng ≥ 900; sai nặng ≤ 10% | 04/11 |
| 4 | LLM đọc toàn bộ chữ S03 ở lớp đề xuất; tự áp loại hình và ý định khi trích dẫn có thật và qua luật; giá, diện tích chỉ đối chiếu; bất đồng lên `/ops/review` | Giám sát xếp dãy; anh duyệt đường ghi và ~6 USD | ≥ 90% tin có đề xuất; ≥ 50% tin có AI đã áp | 04/11 |
| 5 | SĐT S06: thử lại từ 17:35 ngày 03/11, thu tài khoản nhiều tin trước; đoạn từ `stg` lên tin | Liên làn giao ZCode; phiên liên làn đã mở đang làm đoạn lên tin | ≥ 20.000 tin S06 có SĐT | Sáng 05/11 |
| 6 | Đường và dự án S06 lên tin và căn | Làn Claude, giám sát xếp dãy | Đường ≥ 90% ở tin | 04/11, cắt được |
| 7 | Đẩy `feat/zcode-gop-0211`; bật Hải Phòng, Bình Dương; kiểm phần TP.HCM chạm trần | Giám sát đẩy; liên làn giao | Số vùng S06; phủ TP.HCM | 04/11, cắt được |

Từ 22:00 ngày 04/11 chỉ gộp bản vá lỗi cho đường ống.

**Vì sao việc 5 xếp sau dù rất cần:** nguồn đang phạt 429 tới 17:32 ngày 03/11, và anh đã chốt gặp 429 thì dừng, không nới.
Thu theo tài khoản nhiều tin trước giúp được nhiều nhất nếu bị chặn sớm: 2.000 tài khoản đầu phủ 24.933/41.075 tin trên cổng
(61%), 5.000 tài khoản đầu phủ 33.142 (81%). Với 2 luồng nghỉ 8–15 giây, 2.000 tài khoản mất khoảng 3,5 giờ (ước). Căn cứ
ghép số theo tài khoản mới là mẫu 72 cặp.

**Về chỉ số AI:** đích 50% đặt ra để chứng minh, chưa đo được khả thi. Kể cả đạt, tới 05/11 chỉ nói được AI gánh loại hình và
ý định của S03; giá, diện tích vẫn do parser, S06 vẫn lấy trường từ nguồn. Không nên nói «phần lớn dựa vào AI» cho toàn hệ thống.

**Về S03:** 2.772 tin chỉ có 97 tin có khu vực, và audit cho thấy 77% phường đang có là đọc nhầm hướng nhà. Lượt SV1 có thể làm số
này giảm thêm. Tin nhận khu vực cấp thị trường không có dấu hiệu theo phường. Giữ điều kiện diện tích, vì tin không có diện tích
thì không so được giá; số ≥ 900 tính trên 891 tin có giá và diện tích hôm nay, sẽ đo lại sau SV1.

## 4. Cắt gì nếu không kịp

Cắt theo thứ tự:

1. Đích S08, S01, thêm nhóm S03. Đã biết không kịp hoặc không có vòng đang chạy.
2. SV2 (tầng, hướng), gộp tin trùng, dấu hiệu lên thẻ tin (thước còn gộp loại hình, hiện lên dễ sai), ảnh ngoài bước mẫu.
3. Hải Phòng, Bình Dương.
4. Đường, dự án (việc 6).
5. Tự áp của LLM: lùi về chỉ đối chiếu, báo đúng số.
6. S03 lên cổng: ra mắt S06 trước, ghi rõ S03 chưa lên.

Không cắt: TR1, Đà Nẵng, giám sát.

## 5. Quyết định của anh trước 05/11

Hàng chờ đang có 31 mục. Trước 05/11 chỉ cần năm mục này; phần còn lại giám sát rà hiệu lực, để sau ra mắt nếu không chặn.

1. Ký PR #274 và bật giới hạn tần suất.
2. Duyệt áp migration 064 (sau khi đếm mã dài trên cloud ra 0).
3. Duyệt đường ghi của LLM ở việc 4 và khoảng 6 USD.
4. Duyệt nháp sổ nhóm và thẻ 16 nhóm.
5. Tối 04/11 chấm 20 tin trong mẫu, khoảng 10 phút, để biết máy chấm lệch người bao nhiêu.

## 6. Giới hạn

- Mẫu «Đúng» do máy chấm; `eval_labels` đang rỗng.
- Mẫu số phủ S06 là số chụp từ báo cáo sáng 02/11 và TP.HCM đang chạm trần, nên tỉ lệ phủ chỉ là mức trên.
- Số S03 đo trước lượt SV1; mô phỏng của audit chưa chạy thật.
- Chưa kiểm tin có khu vực cấp thị trường có ảnh hưởng tới rollup 300, 400 hay không.
- Chưa kiểm lệnh LLM hiện có chạy được trọn 2.772 tin trong một lượt.
