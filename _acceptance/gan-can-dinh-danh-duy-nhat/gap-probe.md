---
slug: gan-can-dinh-danh-duy-nhat
at: 2026-11-08T16:02:27Z
verdict: findings
p0: 3
p1: 2
p2: 0
---
## Findings
| Sev | Artifact | Thiếu gì | Kịch bản fail | Thước đo | Xử lý |
|---|---|---|---|---|---|
| P0 | contract | Định nghĩa thước Gom cụm (cụm từ hai tin sống, hay kể cả tin đã nghỉ) do máy quyết bằng căn cứ một-lối yếu — chỉ loại được phương án «mọi tin có property_offers»; cùng mẫu [ops-duyet-nhip-va-chu#F1] | Mạnh hiểu Gom cụm gồm cả đợt rao trước thì số S06 trên Ops thấp hơn nghĩa đã chốt mà E3 ghim định nghĩa đó thành xanh | Đổi thành câu hỏi kèm số đo hai cách | human-gate1: Hỏi-2 trên thẻ (supersedes d-2); đo DB chung 08/11 hai cách cùng 14.806 tin S06; E3 lấy luật cụm theo câu trả lời |
| P0 | design | Bỏ design-pass bằng căn cứ trích quyết định của hàng khác, không quyết được hàng này; vòng thêm hai nút màu mới trên Sankey; cùng mẫu [ops-duyet-hop-hang-muc#F1] | Hai màu nút mới khó phân biệt ở chế độ tối, tới S4 mới thấy | Hỏi bỏ hay giữ design-pass, hoặc design-pass rút gọn cho Sankey | human-gate1: Hỏi-3 (supersedes d-9); E10 thêm vế «hai nút màu phân biệt được ở sáng và tối» |
| P0 | contract | Bỏ coverage-scan với «lối chết» là nhận định; quét tay sót ô khối cloud đời trước × Sankey, biểu đồ ngày | Trong ≤15′ sau gộp, buildFlow nhận khối cũ → «Chưa định vị» = 100% hoặc NaN dưới nhãn mới, E9 vẫn xanh | E9 thêm ca buildFlow, dailySeries trên khối cũ, chiều đỏ «GGC-AC-9 Sankey khối cũ» | fixed: E9 thêm ca phụ và chiều đỏ; human-gate1: Hỏi-4 (supersedes d-10) giữ quét tay hay chạy skill |
| P1 | evals | AC-8 đòi mức nhận diện ngăn tin giống nhau ở máy thu và cloud, nhưng cloud không có cột unit_number nên tin trục không toà lệch | E8 so trọn bảng trên lược đồ máy chủ đỏ ở tin «LD2xx13» không toà | Khai ô lệch có chủ đích với bảng kỳ vọng riêng | fixed: E8 có bảng kỳ vọng máy chủ riêng, ô trục không toà và số nhà là lệch có chủ đích (Định vị, Gắn căn đều 0 nên lệch chỉ ở cờ chờ khớp) |
| P1 | contract | AC-10 đòi «bốn nút» trong khi nút 0 bị bỏ và Gắn căn = 0 | Người chấm chỉ thấy ít nút hơn → AC-10 FAIL, hoặc thợ ép hiện nút 0, vỡ AC-6 | Sửa AC-10 thành «các nút có số» | fixed: AC-10 viết lại «các nút mức nhận diện»; E10 nói rõ Gắn căn, Định vị vắng khi 0 |
