---
slug: soat-noi-s08-danh-ba
at: 2026-11-22T04:05:00Z
verdict: findings
p0: 2
p1: 3
p2: 0
---
## Findings
| Sev | Artifact | Thiếu gì | Kịch bản fail | Thước đo | Xử lý |
|---|---|---|---|---|---|
| P0 | design | Nút ứng viên lên cloud và Invest mà không dòng sổ nào quyết; d-3 ghi kho_dao false | Mạnh ký băm chỉ phủ DB máy thu, đêm đầu khoảng 157 nút chưa xem từng nút lên Supabase và hiện cho người dùng Invest | Dòng sổ cho việc lên cloud, Invest; đếm nút S08 trên cloud sau đêm đầu, cách lùi trên cloud | fixed: dòng sổ mới trích AGENTS.md luật 5 (thông tin dự án S08 công khai, lên cloud); nút ứng viên không nối tin, không trang Invest nào liệt nút, E7 đo 0 tin gắn, 0 hạng giá; design §7 bước 4–5 thêm cách lùi và lệnh đếm trên cloud |
| P0 | design | Căn cứ d-4 (nối theo tên chứa ≥ 8 ký tự) trích lời duyệt riêng cho S06 của DA32, không quyết cho S08 | Người duyệt tưởng luật nối theo tên chứa đã có lời chốt, dự án S08 nối nhầm vào nút ở Ocean Park, Grand Park | Thay căn cứ bằng câu quyết cho S08 hoặc thành câu hỏi | fixed: dòng sổ mới thay d-4 — tên chứa ra thẻ từng cặp (mô hình §1.2 K4), chỉ tên chuẩn trùng cùng tỉnh đi thẻ luật, Mạnh duyệt loại căn cứ khi cho lời áp |
| P1 | evals | E7 chỉ ghim tổng, đích ≥ 170 chừa khoảng xanh giả; §2 tự mâu thuẫn 15 so với 8 ca nối | Ca khớp tên bị đẩy sang ngả đúc sinh nút trùng mà E7 vẫn xanh | Ghim từng ngả bằng số chốt, ô bằng số chạy thử | fixed: §2 có bảng số chốt theo luật sửa (nối 9, đúc 163, từ chối 5, thẻ cặp 0); E7 so từng ngả với số đếm lại của probes/bang-phu.mjs trên cùng bản chép; d-8 thay bằng ba ô tách |
| P1 | design | §4 ghi bí danh cho dự án nối vào nút có sẵn mà AC-3 hứa nút có sẵn không đổi một byte | Hoặc E3, E7 đỏ, hoặc lời hứa không đổi nút PL20 sai | Chốt bí danh nằm ở đâu, vân tay gồm gì | fixed: bí danh nguồn S08 nằm ở registry_aliases (bảng chỉ thêm), dòng asset_nodes có sẵn không đổi; E3 thêm ca bí danh có sẵn giữ nguyên, chiều đỏ ghi vào cột aliases của nút; hồ sơ áp liệt nút nhận bí danh |
| P1 | design | Băm chỉ phủ [mã, kết cục], không phủ nút đích hay nhóm đúc | Nút đổi giữa lúc dựng thẻ và lúc áp, lượt áp nối vào nút Mạnh chưa thấy | Băm phủ id nút đích, khoá nhóm; ca đổi nút đích | fixed: kết cục chuẩn mang id nút đích, khoá nhóm đúc, id ứng viên; E2 thêm ca đổi nút đích thì băm đổi và áp băm cũ ném bam-lech |
| P2 | evals | E6 tự dựng dòng project_links khuôn bên đọc | Bên đọc xanh trên khuôn tay, lệch với bên viết thật | Dựng dòng bằng apTheLuat | fixed: E6 dựng dòng nối bằng chính apTheLuat của pipeline |

Bổ sung của giám sát 22/11 (bốn điểm) cũng đã vào hồ sơ: thứ tự nguồn với DA42 (AC-1, AC-7, dòng sổ), loại căn cứ trên thẻ (AC-2),
tách hai số trên màn (AC-6, E8), thứ tự áp PL20 → DA53 → DA55 kèm phép đo băm DA53 và bộ gắn PL20 (AC-7, design §7).
