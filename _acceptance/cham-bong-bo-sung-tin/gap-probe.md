---
slug: cham-bong-bo-sung-tin
at: 2026-11-21T02:00:00Z
verdict: findings
p0: 1
p1: 4
p2: 0
---
## Findings
| Sev | Artifact | Thiếu gì | Kịch bản fail | Thước đo | Xử lý |
|---|---|---|---|---|---|
| P0 | design | Dòng sổ chọn đọc mù ghi nguồn mục tiêu nhưng câu trích chỉ liên quan, không chọn giữa đọc mù và cho model chấm đề xuất (lối khác vẫn sống, đúng chữ khung); dòng xếp bác đồng thuận và hai giá trị trên thẻ vào ca biên cùng dạng [thuoc-tinh-can-s16-rut-khi-mo-ho#F1] | Mạnh duyệt vì tưởng đọc mù có sẵn trong khung đã ký; muốn đúng chữ khung thì viết lại lời nhắc, luật so, AC-2, AC-4 sau khi đã chi tiền | Dòng mục tiêu phải trích câu quyết lựa chọn; không có thì thành câu hỏi người | fixed: Hỏi-4 (chi-nguoi) thay dòng đọc mù; dòng ca biên còn lại chỉ giữ lệch và bỏ trống theo chữ câu giao |
| P1 | design | Không chốt đơn vị lời gọi: design gọi theo thẻ, evals đếm 26 lời gọi cho 13 đề xuất; hai đề xuất cùng ô trùng khoá | Code đúng thiết kế đỏ E6, E8; ước tiền trình ở cổng sai đơn vị | Ghi rõ đơn vị lời gọi ở design và AC, fixture có thẻ hai đề xuất cùng ô | fixed: đơn vị thẻ × model (design §1, AC-1, AC-7, AC-8); E1 có thẻ hai đề xuất cùng ô, 10 thẻ → 20 lời gọi, 13 đề xuất → 26 kết quả; E6, E7, E8 đếm lại |
| P1 | evals | E5 chỉ băm vài cột ba bảng, không băm field_assertions, không chạy chế độ áp | Chế độ áp dùng kết nối ghi để ghi phát biểu, E5 vẫn xanh, lượt phân xử sau đổi tin | Băm trọn mọi bảng trừ ai_calls, cả hai chế độ, đối chứng dương INSERT field_assertions | fixed: AC-5 và E5 băm trọn từng dòng mọi bảng trừ ai_calls ở năm lượt hai chế độ, đối chứng dương UPDATE sale_offers và INSERT field_assertions |
| P1 | evals | Không đo chạy lại sau lời gọi lỗi hay dừng vì trần; báo cáo gộp lỗi vào bỏ trống; không lệnh in 786/786 | Gateway lỗi hàng trăm lời gọi, lần chạy lại bỏ qua chúng, báo cáo tưởng đủ | E7 thêm ca chạy lại sau lỗi và sau trần; báo cáo tách cột lỗi, in số thẻ đủ hai kết quả | fixed: AC-4 lỗi không sinh kết cục, AC-7 chỉ gọi lại cặp chưa thành công, AC-9 cột «chưa đủ hai kết quả» và dòng thẻ đủ / thẻ chờ; E7 ca (b) (c), E9 sau lượt có lỗi |
| P1 | evals | E2 cấm giá trị đề xuất trong lời nhắc, nhưng lời nhắc chứa bài gốc nên ca khop luôn có giá trị đó | Code đúng đỏ E2, hoặc fixture bị nắn | Assert trên phần ngoài khối bài; thêm thẻ canh có giá trị đề xuất không có trong bài | fixed: AC-2 khối bài có ranh giới, E2 assert phần ngoài khối, ba thẻ canh DEXUAT_CANH, đối chứng dương thẻ khop |

Dòng ngoài giới hạn 5 (P2, phản biện ghi thêm): ma trận E4 thiếu ca hai lần đọc khác đề xuất và khác nhau — fixed: E4 mở thành 4 giá trị mỗi lần đọc (64 assert), đột biến xếp A/B thành bac_dong_thuan đỏ.
