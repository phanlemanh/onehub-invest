---
slug: wanted-thanh-inquiry
at: 2026-10-27T01:15:00Z
verdict: findings
p0: 1
p1: 2
p2: 2
---
## Findings
| Sev | Artifact | Thiếu gì | Kịch bản fail | Thước đo | Xử lý |
|---|---|---|---|---|---|
| P0 | contract | Dòng sổ d-5 (DB riêng) ghi máy quyết, kho_dao false, nhưng tạo rồi DROP DATABASE trên máy chủ :5433 dùng chung; lối container riêng chưa bị loại; E3 chỉ đo đường xanh | Test ném giữa chừng thì DB tạm nằm lại; tên ghép sai thì DROP trúng DB khác; AC-3 «xoá sau lượt» không ai đo | Dòng sổ mới chi-nguoi kho_dao true nêu lối container; E3 thêm đối chứng lỗi (finally) và đối chứng tên ngoài khuôn | fixed: dòng sổ mới supersedes d-20261027T004015Z-5 thành Hỏi kho_dao true (lối khác: container PostGIS tạm); AC-3 + E3 thêm xoá trong finally, rào khuôn tên, hai đối chứng --ep-loi và tên ngoài khuôn |
| P1 | contract | Dòng d-2 máy quyết «một giá trị cho cả mua lẫn thuê» với câu trích không quyết điều đó; câu hỏi d-3 không đưa lối tách [df0-dem-de-xuat-lam-giau#F1] | Mạnh ký nhãn mà cấu trúc trục đã bị máy chốt; tách sau PL5 phải đổi dữ liệu | Thay d-2 bằng câu chi-nguoi có lối tách inquiry_buy/inquiry_rent | fixed: dòng sổ mới supersedes d-2 thành Hỏi (khuyên một giá trị, lối khác tách hai giá trị); d-3 gộp vào đó |
| P1 | evals | Ma trận dạng tên cũ của AC-4/E4 thiếu dạng liệt kê offer gạch-đứng wanted | Prompt agent còn chuỗi liệt kê có wanted mà E4 xanh; LLM trả wanted, CHECK của PL5 chặn | Ma trận 6 dạng viết trước, mỗi dạng một ca cấy ra đúng 1 dòng đỏ, ca liệt kê cấy vào bản sao prompt agent | fixed: AC-4 có bảng 6 dạng; E4 cấy đủ 6 ca, ca liệt kê vào bản sao agent/src/agents/enrich-text.ts |
| P2 | contract | AC-2 hứa ba tệp sinh mang nhãn «Yêu cầu» trong khi tệp pipeline/agent chỉ có code | Người chấm đọc AC-2, mở tệp pipeline không thấy nhãn, AC-2 trượt dù eval xanh | Sửa AC-2 khớp đầu ra; E2b in từng tệp và thứ phải chứa | fixed: AC-2 tách app (code + nhãn) với pipeline/agent (code); E2b in riêng từng tệp |
| P2 | evals | Bản chụp «trước vòng» của E7 không ghim nguồn gốc [cong-tac-test-ghim-ban-cu#F1] | Bản chụp dựng ngược từ markup mới thì đổi ngoài ý có mặt ở cả hai phía, E7 vẫn «đúng ba cặp» | Ghi sha main + sha256; bước kiểm render lại ở sha đó so byte | fixed: bản chụp mang sha a4a47d15 + sha256 (test kiểm băm); E7b render lại hai component ở sha đó bằng git show, so byte, đối chứng đổi một ký tự → lệch |
