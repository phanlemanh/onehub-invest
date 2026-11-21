---
slug: s02-luot-loi-sach-va-kiem-han-token
at: 2026-11-20T01:30:00Z
verdict: findings
p0: 0
p1: 3
p2: 2
---
## Findings
| Sev | Artifact | Thiếu gì | Kịch bản fail | Thước đo | Xử lý |
|---|---|---|---|---|---|
| P1 | contract | AC-2 hứa hành vi «khi lượt gặp nhánh 401 thì ghi dòng» nhưng E2 chỉ soát thứ tự chữ trong mã, không có chiều đỏ, thiếu vế «đúng một tệp» | dòng AUTH FAIL trong khối không chạy tới, hoặc chép sang tệp thứ hai, E2 vẫn xanh; cổng ký lời hứa hành vi trên phép đo chuỗi | viết lại AC-2 thành thứ tự tĩnh; chiều đỏ bỏ dòng AUTH FAIL; đếm đúng một tệp | fixed: AC-2 viết lại thành đo tĩnh, chạy hành vi ghi ngoài phạm vi; noi-day.sh thêm chiều đỏ (bỏ AUTH FAIL) ghim thông điệp và đếm đúng một tệp |
| P1 | evals | E5 chỉ đo kiemAppToken trước một return token; lời hứa là mọi lối ra; vế không còn log cũ không có trong expected | đường trả sớm (cache, env) trước lời gọi kiểm hạn vẫn xanh; dòng token OK cũ sót không bị bắt | mọi return sau lời gọi; assertion âm log cũ; chiều đỏ cấy lại | fixed: noi-day.sh đòi mọi return (ngoài callback trình duyệt) sau lời gọi; ba chiều đỏ: bỏ lời gọi, cấy đường trả sớm, cấy lại log cũ — mỗi bản ghim thông điệp; AC-5 viết lại |
| P1 | evals | E3 không ghim vế collect thoát 1 trên CLI | CLI bắt lỗi rồi thoát 0, script đêm chạy tiếp transform bản cũ, E3 vẫn xanh | ghim collect thoát 1 trên CLI, đối chứng thoát 0 | fixed: nguoi-doc.mjs kiểm CLI collect bắt lời từ chối bằng process.exit(1), lượt hỏng thoát 1, lượt thành công thoát 0; expected E3 ghim cả ba |
| P2 | contract | AC-6 không kể tên năm tệp, không nói diff tính trên merge-base | main tiến lên kéo tệp PR khác vào gây đỏ giả, hoặc thước tự rút danh sách thành vòng tròn | liệt nguyên văn năm tệp, ghim merge-base | fixed: AC-6 liệt năm tệp (tệp bộ thu S02 tả bằng vai trò để không ghi tên nguồn), ghim git diff trên merge-base; vung.sh dùng danh sách viết sẵn và chiều đỏ cấy tệp ngoài vùng |
| P2 | evals | E1 không đếm .partial và không kiểm tệp cũ bị xoá | lượt hỏng để lại hai .partial hoặc dọn bản thu cũ, ca 1711-1(b) vẫn xanh | đếm .partial = 1, tập tệp trước là tập con tập tệp sau | fixed: E8 (nguoi-doc.mjs) đếm đúng một .partial và kiểm mọi tệp bản thu cũ còn nguyên; chiều đỏ xoá không cấy — mã thu không có lệnh xoá nào, cấy rm chỉ đo chính bản cấy |
