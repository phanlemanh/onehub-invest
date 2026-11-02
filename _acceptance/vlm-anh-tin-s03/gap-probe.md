---
slug: vlm-anh-tin-s03
at: 2026-11-02T01:00:40Z
verdict: findings
p0: 1
p1: 4
p2: 0
---

## Findings

Phản biện lại sau khi Mạnh sửa phạm vi 02/11; lượt trước (2 P0, 3 P1, đã định đoạt) nằm trong lịch sử git của tệp này. Tệp claims-scan đã truyền.

| Sev | Artifact | Thiếu gì | Kịch bản fail | Thước đo | Xử lý |
|---|---|---|---|---|---|
| P0 | contract | Máy tự quyết bỏ Decisions bằng căn cứ không làm chết lối đó; ô cơ hội vẫn ghi mẫu bài và Haiku hoặc Decisions; chưa định nghĩa model phải đạt cả hai thước; câu trích PL13 chỉ liên quan | Qwen đạt theo hợp đồng nhưng CHẾT theo ô cơ hội, không được sửa ngưỡng sau khi thấy số; Qwen đạt giá, Haiku đạt loại hình thì hai bên đọc khác nhau | Dòng chỉ-người riêng cho Decisions; ngưỡng thay ghi trước khi có số; E7 có ca A đạt giá B đạt loại hình | fixed + human-gate1: Hỏi-3, Hỏi-6; câu thay trong opportunity.md chỉ hiệu lực khi duyệt; AC-7, E7; đổi căn cứ hai dòng sổ |
| P1 | evals | Số bài tăng đo sự có mặt; ảnh dùng chung đẩy số; dòng rỗng không thuộc nhóm nào; ảnh lộ nguồn chưa định đơn vị; lô thật không có chốt máy; fixture tự dựng; E5 không có sàn | Bài thiếu giá chỉ có loại hình vẫn tính tăng; một ảnh quảng cáo gắn 30 bài; lô thật chọn 0 bài mà mọi eval vẫn xanh; một ảnh QR dùng 10 bài in 10 ảnh | Số lấp đúng lý do; tách nhóm ảnh dùng từ 10 bài; bốn nhóm cộng bằng tập đọc; ảnh theo sha256; eval máy đọc DB thật | fixed: AC-1 thêm cross-layer, AC-8, AC-9, E2, E5, E8, thêm E11 |
| P1 | design | Phiếu theo ảnh chưa kín: ảnh vừa riêng vừa ghép; bài đại diện không có luật; rút đều không phân tầng; loại hình còn bẫy cùng rỗng; 9/10 đạt mâu thuẫn sàn 30; ảnh nhiều giá chưa định nghĩa | Ảnh ghép sai không lộ vì bài đại diện là bài riêng; ảnh không có loại hình trả rỗng tính là khớp; giá theo m² tính đúng mà nhãn sai | Phiếu ghi số lượt riêng và ghép, luật bài đại diện, ba tầng; lựa chọn không thể hiện loại hình và không có một giá; sửa E7 thành 27/30 | fixed: AC-7, AC-8, E7, E8, thiết kế; trọng số theo bài chỉ báo số |
| P1 | evals | Lời hứa về đường gửi ảnh lên cloud không có đo: ô trống vẫn có thể gửi; thiếu --model chưa kiểm; trần chỉ thử trên lô; --gold có thể không có ai_calls | Mạnh gắn 40/60, 20 ảnh chưa xem có QR tự in tên nguồn vẫn đi, không thu lại được | Gateway giả đếm số yêu cầu bằng số ảnh đã gắn; thiếu --model thoát 2; trần ở --gold; ai_calls mỗi lần gọi; URL cloud mặc định trỏ cổng chết khi test | fixed: AC-6, AC-7, E6, E7 |
| P1 | design | Luật gộp ảnh về bài và dùng lại chưa kín: một có giá một rỗng; một tốt một lỗi; loại hình lạ làm lỗi cả dòng; quote cấp bài; đổi prompt không đổi bản; tập ảnh đổi; phạm vi đếm dùng chung; trần trước hay sau gộp | Ảnh dùng 30 bài trả giá tốt kèm loại hình lạ thì 30 dòng lỗi và gọi lại mãi; sửa prompt quên tăng bản thì Mạnh ký số không khớp nhãn | Ma trận viết trước trong E10; băm prompt; đếm tập ảnh đã đổi | fixed: AC-2, AC-4, AC-6, AC-8, AC-10, E2, E4, E6, E8, E10, thiết kế; đọc thêm ảnh mới của bài đã có dòng tốt: deferred, chỉ đếm |

Ghi chú: sau lượt phản biện, Mạnh thêm DeepSeek V4.1 Flash 1017. Phần này không phản biện lại (quy trình một lượt); nó đi cùng khuôn với Haiku, thêm ghim nhà cung cấp ở AC-3, E3.
