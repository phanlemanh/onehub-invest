---
slug: coverage-cloud-got-tang-a
at: 2026-10-25T07:15:00Z
verdict: findings
p0: 1
p1: 2
p2: 2
---

# Gap probe: coverage-cloud-got-tang-a

Phản biện context sạch (6 tệp: design, contract, evals, decisions, claims, opportunity).

## Findings

| Sev | Artifact | Thiếu gì | Kịch bản fail | Thước đo | Xử lý |
|---|---|---|---|---|---|
| P0 | design | d-2 (muc-tieu) và d-4 (mot-loi) ghi sai căn cứ cho việc đổi kiểu rows thành null: câu ADR-0014 chỉ quyết chữ trang, không quyết kiểu phản hồi API; lối rows [] kèm state none vẫn sống; máy đọc ngoài kho chỉ người biết | Mạnh ký vì tin «không gãy máy đọc»; script ngoài kho cầm token gọi rows.length gặp null lúc chưa có bản tin | Dòng chi-nguoi Hỏi-2 thay d-2 phần kiểu rows và d-4 | human-gate1: Hỏi-2 (dòng mới supersedes d-2, d-4); AC-4 ghi «rows theo Hỏi-2» |
| P1 | contract | Design hứa khối vắng và sai khuôn đều ra state none nhưng AC-4/E4 không có hai ca ấy; ca khối tươi mà rows rỗng chưa định | Bản tin từ push-ops-facts cũ khác khuôn: toCoverageRows ném → 500, hoặc [] như đã đo; ngưỡng 200 trượt mà E1–E4 xanh | E4 thêm ca khối vắng (gỡ khối từ bản tin thật), sai khuôn (rows không mảng / hàng thiếu code) → 200 none; chốt tươi mà rỗng | fixed: AC-4 bốn ca + ca tươi mà rỗng (state fresh, rows []), E4 thêm ba ca và chiều đỏ «không kiểm khuôn», Coverage trục 1 thêm ba giá trị |
| P1 | evals | Danh sách tên của bộ dò ở AC-2 chưa ghim cùng tập với registry bên ghi đọc; chưa in số tên; chỉ quét giá trị không quét khoá | Bản tin dựng từ registry tên giả, bộ dò lấy tên thật → 0 trúng mà vẫn xanh; một trường mang tên lộ qua khoá | Ghim danh sách = real_name local + registry bên ghi đọc, in số tên ≥ 1; quét khoá + giá trị; cấy lần lượt từng tên | fixed: AC-2 và E2 ghim danh sách, in số tên, quét khoá và giá trị, đối chứng dương cấy từng tên. rejected phần «chiều đỏ route thêm trường nhãn lấy từ khối»: khối freshness không mang tên thật (bên ghi đã soát tầng A), nên không có nhãn thật nào để route chép — chiều đỏ ấy không dựng được trên dữ liệu thật; whitelist trường (chiều đỏ «chép nguyên bản tin») là chặn đúng chỗ |
| P2 | evals | paths của E7 thiếu ops-facts.ts, ops-queries.ts dù inputs có | Sửa cách tính cũ/tươi sau khi E7 PASS mà bằng chứng không mất hiệu lực | paths ⊇ mọi tệp mã trong inputs | fixed: E7 paths thêm ops-facts.ts, ops-queries.ts (toCoverageRows/CoverageRow nằm ở ops-queries.ts, đã trong inputs) |
| P2 | evals | Chưa ghim không giả lập freshnessLocalOnly; hiện trạng 500 (ô cơ hội) và 200 [] (design) lệch | Test giả lập chế độ máy chủ, trên Vercel route đi nhánh cũ → 500 mà E1 xanh | E1/E6 ghim không giả lập, in chế độ; design ghi đúng hiện trạng | fixed: E1, E6 ghim «chế độ suy từ lược đồ, không giả lập»; design ghi audit thấy 500, từ bản dừng sớm 24/10 route trả 200 [] |
