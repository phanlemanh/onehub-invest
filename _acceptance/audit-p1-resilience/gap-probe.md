---
slug: audit-p1-resilience
at: 2026-11-27T07:45:00Z
verdict: findings
p0: 0
p1: 3
p2: 2
---
## Findings

Vòng 2 (27/11). Phản biện context sạch trên design, contract, evals, sổ, và bài học xuyên hồ sơ (advisory).

| Sev | Artifact | Thiếu gì | Kịch bản fail | Thước đo | Xử lý |
|---|---|---|---|---|---|
| P1 | contract | Vế từ 30′ trở lên của AC-7 nghiệm thu việc state nhảy qua snapshot thiếu manifest, đúng lớp hậu quả sự cố 22/10; căn cứ d-6 trích chú thích của chính mã đang bị đo, nên không quyết được | Mạnh ký vì tưởng chỉ ghi lại hành vi, rồi snapshot ghi chậm quá 30′ lúc DB sập bị bỏ mà ZC3 vẫn xanh | Một câu Hỏi có khuyến nghị và hai lối có giá ở Cổng Phạm vi | fixed: dòng sổ d-20261127T072613Z-9 supersedes d-6, nguồn chỉ-người, thành Hỏi-2 trên thẻ; contract AC-7 ghi rõ vế ấy là Hỏi-2 |
| P1 | design | AC-9 thiếu ma trận dạng gọi đếm từ script thật; đối chứng chỉ thử đúng dạng thước đã nhận | Bước dạng cd tương đối không được giả lập mà cũng không gây thoát 3, nên lỗi im lặng hoặc đỏ mù | Ma trận lớp × số lần đếm trên main; tổng $ROOT bằng tổng các lớp; đối chứng cd tương đối thoát 3; số lời gọi bằng số bước đếm từ script | fixed: design §2b (16 lần $ROOT, năm lớp, lớp còn lại 0), AC-9 thêm tổng lớp và một lời gọi mỗi bước, E11 thêm đối chứng cd tương đối |
| P1 | evals | E10 chứng AC-8 chỉ bằng calls.log; thư viện chép thật có thể dùng DATABASE_URL hay /tmp chung; không spawn chứng bằng calls.log rỗng; nhánh HOME ngoài tmp không có ca; thông điệp ghim có chữ hoặc | job-step.sh thật ghi DB chung hay tệp ngoài sandbox mà E10 vẫn xanh; lỗi so tiền tố lọt | Môi trường không kế thừa DATABASE_URL, PG* và khoá model; TMPDIR trong sandbox; psql là stub; tệp đánh dấu spawned; đối chứng HOME = /var/empty; git status của kho thật không đổi; hai chuỗi ghim riêng | fixed: design §2c, AC-8 và E10 viết lại theo đúng các thước này |
| P2 | contract | AC-5 đã ký bị thêm điều kiện mỗi bước sau nạp có lời gọi mà sổ nói giữ nguyên | Người duyệt không xét lại AC-5 dù nó đã đổi | Giữ AC-5 nguyên văn, chuyển điều kiện sang AC-9 | fixed: gạch vòng 2 gỡ khỏi AC-5, điều kiện ở AC-9; dòng sổ d-20261127T072632Z-11 supersedes d-5 |
| P2 | evals | Expected E5 liệt kê hằng tên bước, chính là danh sách viết tay AC-9 cấm, và lệch design | Main thêm hay bớt bước thì người chấm thấy lệch tên, chấm đỏ oan | Expected chỉ ghi quan hệ tập bước in ra bằng tập rút từ script | fixed: E5 bỏ hằng tên; quan hệ đặt ở E11 |
