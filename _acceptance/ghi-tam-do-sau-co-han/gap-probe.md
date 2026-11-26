---
slug: ghi-tam-do-sau-co-han
at: 2026-11-26T13:50:00Z
verdict: findings
p0: 2
p1: 2
p2: 1
---
## Findings
| Sev | Artifact | Thiếu gì | Kịch bản fail | Thước đo | Xử lý |
|---|---|---|---|---|---|
| P0 | design | Dòng sổ gỡ chốt NB11 trích chú thích code, không phải lời quyết; bật lại tự ghi đêm và tự rút lô đều chạm giá trị trên tin đang chào mà ghi kho_dao false | Mạnh duyệt mà tưởng việc bật lại tự ghi lên 2.251 tin đã có lời mình; giá trị chưa đo ra trang tin không ai ký | Dòng mới supersedes, kho_dao true, thành câu cho người | human-gate1: thành Hỏi-3 (bật lại đêm) và Hỏi-4 (tự rút), kho_dao true, khuyên theo câu mục 63 |
| P0 | design | Dòng «một lô mỗi lượt × trường» ghi một-lối, nhưng lối «lô theo lượt, rút lọc theo trường» không chết | Cổng duyệt một cách hiểu khác chữ «mỗi đợt ghi có mã lô» của mục 63 mà không thấy lối giữ đúng chữ | Dòng chi-nguoi supersedes, hai lối có giá | human-gate1: thành Hỏi-5 |
| P1 | contract | Tự tụt chỉ chạy ở đầu một lượt làm giàu | Qua ngày 14 không lượt nào chạy thì ba lô điền lùi đứng dang-ghi mãi, E6 vẫn xanh | Ca E6 không chạy lượt nào, chỉ chạy đường kích độc lập | fixed: AC-6 và E6 thêm lệnh rut-lo-ghi-tam.mjs --het-han độc lập lượt; nối lịch hằng ngày ghi Out of scope (làn ZCode), dòng sổ revisit |
| P1 | design | Đường «model trùng tên toà danh bạ» chưa có định nghĩa độc lập, E2 không đo | Lời nhắc mang danh sách toà, model chọn lại từ danh sách, vẫn được áp với doc_lap true | Ca E2 cấy danh sách toà → review, doc_lap false | fixed: AC-2 và E2 thêm ca tin C (danh sách toà trong lời nhắc → không độc lập ở trường toà); design §3.1 ghi lời nhắc chỉ giữ dự án, ứng viên, khu vực |
| P2 | evals | Không ghim doc_lap của lô đọc toàn bộ 1.993 | Điền lùi đặt sai doc_lap mà E4 vẫn xanh | E4 in và so cả ba giá trị doc_lap, đột biến đảo | fixed: AC-4 ghi doc_lap true cho lô đọc toàn bộ (căn cứ mục 63, dòng sổ mới); E4 so và có đột biến |
