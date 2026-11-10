---
slug: lay-mau-khu-trung-theo-tin
at: 2026-11-06T22:45:00Z
verdict: findings
p0: 2
p1: 3
p2: 0
claims_input: ok
---

## Findings

| Sev | Artifact | Thiếu gì | Kịch bản fail | Thước đo | Xử lý |
|---|---|---|---|---|---|
| P0 | contract | Dấu bài thử ở test-posts.mjs làm transform gạt bài, tin nghỉ trên canonical; sổ ghi máy quyết và coi nhóm tên toàn chữ số là nhóm thử | Nhóm thật tên toàn chữ số bị gạt, tin nghỉ trên cổng Invest mà không AC nào chặn | Hỏi chỉ người kèm số tin sẽ nghỉ; AC in số tin canonical sẽ nghỉ | fixed: Hỏi-2 (kho_dao) thay dòng sổ cũ; đo 2 tin thử sống, 5 nhóm toàn chữ số là mã nhóm chưa tên (1 tin sống), mặc định không làm dấu; AC-4 và E7 in số tin sẽ nghỉ |
| P0 | contract | Lối «tin trước, chữ sau» ghi là chết vì 38 thẻ, nhưng khi giữ dấu ẩn tay thì lối này cũng đạt; đánh đổi thật nằm ở lát mới | Cổng duyệt union vì tin lối kia chết, không biết cái giá ở lát mới | Đo lại có giữ dấu tay; dòng sổ mới | fixed: đo lại cả hai luật đều 48, 0 cặp chữ ngắn khác người; theo câu giao chọn «tin trước», dòng sổ mới trích câu giao; E1 thêm ca chữ ngắn hai người và đỏ 'HAI TIN KHAC BI GOP' |
| P1 | evals | E5 khai transform-zalo.mjs ngoài danh sách AC-8 | E10 đỏ do cấu trúc hồ sơ | Bỏ khỏi paths hoặc thêm vào danh sách | fixed: transform đọc qua loadStgPosts, hàng có cột text sẵn nên không sửa transform; E5 paths chỉ test-posts.mjs |
| P1 | evals | Không eval nào cho label-sample thật chạy với bài thử và sự kiện; ops_audit tên dấu không đo | Sampler không truyền text, bài trycloudflare lại vào lát mà eval vẫn xanh | Fixture E2 có bài thử và sự kiện; đọc ops_audit | fixed: E2 nạp hai bài thử, một sự kiện, in 'ok bai thu bi gat = 2', 'ok bo_su_kien = 1', đọc ops_audit by_marker; đỏ 'BAI THU VAO MAU' |
| P1 | contract | AC-5 thiếu bậc «thẻ đang được trỏ tới»; E6 không có ca phân xử | Thẻ Mạnh chọn giữ bị ẩn mà E6 xanh | AC-5 ba bậc; ca A–B–C; đỏ 'THE GIU AN TAY BI AN' | fixed: AC-5 ba bậc, E6 thêm ca A(5)→B(9) với C(3) |
