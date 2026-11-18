---
slug: du-an-tren-tin-s03-tu-nhom-va-ten
at: 2026-11-13T01:00:00Z
verdict: findings
p0: 1
p1: 3
p2: 1
---
## Findings
| Sev | Artifact | Thiếu gì | Kịch bản fail | Thước đo | Xử lý |
|---|---|---|---|---|---|
| P0 | design | Dòng sổ d-20261112T224535Z-6 để máy tự quyết luật «tên phải có nguyên chữ trong bài», trong khi lựa chọn này cắt thẳng vào ngưỡng phủ mà chỉ người quyết. | Bài viết tắt hay không dấu thì không tìm thấy chữ, tin chỉ có nguồn (ii) rơi khỏi hợp, phủ dưới ngưỡng mà Cổng 1 không biết. | Chuyển thành Hỏi kèm số đo chế độ đếm trên DB máy thu, đặt cạnh ngưỡng. | human-gate1: đo 13/11 thấy nhãn tên dự án phần lớn là model suy (ngữ cảnh nhóm 5.539, kiến thức nghề 716, ảnh 265, chữ bài 127); thay d-6 bằng Hỏi-4 (d-20261112T224940Z-12) với bảng phủ A 82,6% · B 83,6% · C 86,0%; bỏ luật tìm chữ, dùng căn cứ và trich_ok của nhãn |
| P1 | contract | AC-7 lấy còn lại = tổng − hợp − mâu thuẫn trong khi số của ô cơ hội tính hợp gồm cả mâu thuẫn; không AC nào định nghĩa hợp. | Code đếm hợp gồm tin mâu thuẫn thì còn lại trừ hai lần, test viết cùng định nghĩa nên vẫn xanh. | Chốt hợp = tin có phát biểu sống sau khi loại mâu thuẫn; đẳng thức với field_assertions. | fixed: AC-7 và E7 định nghĩa «tin có dự án» bằng số tin có dòng sống của hai rule_id sau --ghi, thêm hai đẳng thức có tên; design ghi định nghĩa |
| P1 | evals | Chiều đỏ E4 (rút phần thừa) và E6 (giao dịch) đột biến bản sao lib, nhưng hai bước ấy nằm ở tệp scripts. | Đột biến lib không gỡ được bước rút hay ROLLBACK, hai chiều đỏ không dựng được. | Đột biến tệp scripts, ghi rõ chỗ. | fixed: design §Phép đo chép cả pipeline/lib và tệp scripts vào thư mục tạm, đột biến đúng tệp chứa luật; E4, E6 ghi bản chép tạm của tệp scripts |
| P1 | evals | Fixture tự dựng theo khuôn bên đọc; không lấy khuôn từ bên ghi thật, không eval chạy trên dữ liệu thật. | Khoá nhóm hay JSON nhãn thật có dạng khác, nguồn ra 0 tin mà E1–E7 vẫn xanh. | Fixture theo khuôn thật; eval chế độ đếm trên dữ liệu thật. | fixed: design ghi khuôn đo trên DB máy thu 13/11 (hai dạng khoá nhóm, nhãn {v, cc, trich, trich_ok}); thêm ca DAT-AC-7b chạy thử trên DB lượt (bản sao dữ liệu thật) đòi tin_i > 0 và đủ hai dạng khoá. deferred: so lệch 2% với số máy thu — số máy thu đo lại trước lời ghi thật (Đường đo) |
| P2 | contract | Coverage khai hai dòng sổ lệch, bài không thuộc tin, bài thuộc hai tin, nhưng ma trận eval không có; E2 không ghim lớp và phương pháp. | Code lấy dòng sổ đầu, ghi cho bài ngoài tin, hay ghi sai lớp mà E1, E2 vẫn xanh. | Thêm ô vào E1, E2, E3. | fixed: E1 thêm nhóm L (hai dòng sổ lệch, nhom_lech = 1) và bài N ngoài tin; E3 thêm tin T4 chung bài với T1; E2 ghim evidence_tier, method, rule_id theo hằng của Hỏi-3/Hỏi-4 |
