---
slug: data-api-hop-dong-reso-dd-2-1
at: 2026-11-25T05:00:00Z
verdict: findings
p0: 3
p1: 2
p2: 0
---
## Findings
| Sev | Artifact | Thiếu gì | Kịch bản fail | Thước đo | Xử lý |
|---|---|---|---|---|---|
| P0 | design | Dòng sổ d-3 ghi nguồn mục tiêu nhưng câu trích chỉ chốt phường → City; không quyết mlsAreaMajor/Minor, giá/m²; tỉnh → StateOrProvince không có trong bảng | Cổng duyệt địa lý tưởng ADR đã chốt; bên đọc chuẩn tìm stateOrProvince không thấy | Trích đúng câu hoặc chuyển thành câu hỏi; thêm stateOrProvince nếu chọn | fixed: dòng mới thay d-3 trích đúng câu MLSAreaMajor/MLSAreaMinor (§4) và dòng riêng trích câu giá/m², diện tích (§8); stateOrProvince ghi descope có tên (areas chưa có mã ISO 3166-2) và vào Out of scope |
| P0 | design | Dòng sổ d-2 ghi mục tiêu nhưng câu trích không quyết camelCase và StandardName; lối PascalCase của RESO Web API còn sống | Mạnh duyệt cách viết tên khoá API công khai vì tưởng ADR đã chốt | Trích câu quyết, hoặc nâng thành câu hỏi | fixed: dòng mới thay d-2 thành câu hỏi người (Hỏi-3), khuyến nghị camelCase như Quỹ hàng — gs đã duyệt ở m5-2411-4 — lối khác PascalCase kèm giá |
| P0 | contract | Khuôn listingKey và ba test app đang chờ gs mà sổ không có dòng; E2 đo chuỗi có mặt thay quan hệ không giải ngược | base64 hay băm không khoá của S01 + id qua E2 mà vẫn giải ngược hoặc vét được | Dòng sổ câu hỏi; HMAC có khoá; ô đột biến base64 | fixed: hai dòng câu hỏi (Hỏi-4, Hỏi-5); AC-2 đổi thành HMAC-SHA256 có khoá bí mật từ biến môi trường, test tính lại và so; quét thân sau giải base64, hex; ô đột biến base64 trong cùng ca; thiếu khoá ở production thì không khởi động; hỏi bổ sung gs về khoá bí mật |
| P1 | evals | originatingSystemName chỉ đo trên dòng cấy tay; source thật có thể mang chữ khác mã | API công khai trả tên nguồn thật ở mọi phần tử nếu source không phải mã | Ép mẫu mã, sai thì null; ca cấy chữ lạ | fixed: AC-1 và E1 — giá trị không khớp S + hai chữ số trả null, ca cấy source chữ lạ phải ra null với thông điệp ghim. Đếm DISTINCT source trên dữ liệu thật: deferred: lượt chấm trên Mac mini (M5 không có dữ liệu thật) — ghi vào lời giao S4 |
| P1 | evals | AC-10(c) openapi và version không eval nào đo | openapi giữ khoá cũ hay version 0.1 mà mọi eval xanh | Ca so tập khoá schema với hợp đồng, kèm đối chứng | fixed: thêm E13 (test) so tập khoá schema listing trong /openapi.json với listing.ts, version 0.2.0, đối chứng cấy khoá |
