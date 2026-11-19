---
slug: dong-dau-dia-chi-luc-nap
at: 2026-11-16T15:40:00Z
verdict: findings
p0: 2
p1: 3
p2: 0
---

## Findings

| Sev | Artifact | Thiếu gì | Kịch bản fail | Thước đo | Xử lý |
|---|---|---|---|---|---|
| P0 | contract AC-4 + design §2.2, §2.3 | Không tiêu chí nào giữ độ phủ cột `kind`. Thiết kế bỏ nhánh `boi-canh-nhom` của `suyLoai` và thay bằng thẻ, trong khi `kind` đang phủ 100% nhờ chính nhánh ấy. | Buổi duyệt ký 3 thẻ trên 26 nhóm; lượt nạp chạy, nhóm chưa có thẻ mất fallback nên `kind` rỗng cho hàng nghìn tin, tin rơi khỏi `listings/sale` và `listings/rent`. E5 vẫn xanh vì chỉ nhìn nhóm có thẻ đủ ô. | Eval script trên bản chép đo số tin `kind` rỗng trước và sau, ngưỡng 0 tin mất `kind`, in riêng ba nguồn của `kind`. | **fixed**: thiết kế sửa — ô `purpose` của thẻ **chen trước** nhánh cũ, không thay nó (design §2.2); thêm **AC-11** và **E13** đúng thước phản biện đề xuất. |
| P0 | contract AC-10 + evals E12 | Thước «tỉ lệ bài lạc dự án» không có ngưỡng số và không có cỡ mẫu tối thiểu; E12 chỉ hỏi hình thức (có cận Wilson không, có cỡ mẫu không). Đây là phép đo duy nhất kiểm tiền đề trung tâm của hàng. | Hồ sơ nộp n=20, tỉ lệ lạc 15%, cận rộng, kèm câu «chưa đủ»; hội đồng đọc đúng ba câu hỏi hình thức rồi chấm PASS. Người ký duyệt một hàng đang đóng dấu sai dự án lên khoảng 700 tin. | Khai ngưỡng số trong Đường đo: cận TRÊN Wilson 95% ≤ ngưỡng chốt, cỡ mẫu tối thiểu khai trước khi gắn nhãn; E12 so số với ngưỡng ấy. | **fixed**: AC-10 viết lại quanh **cận trên Wilson ≤ ngưỡng** (đề xuất 10%) và **cỡ mẫu khai trước** (đề xuất n=100); Đường đo ghi cả hai; E12 đổi `inputs` sang `contract.md` để hội đồng đọc được ngưỡng, và hỏi bốn câu so số. Thành **Hỏi-3** cho Cổng Phạm vi. |
| P1 | evals E3, E4 + design §1.3a | Luật «chữ bài thắng» chỉ chấm bằng ma trận chín ô viết tay; không eval nào chạm 164 bài căn cứ `chu_bai` và 13 tin «nêu dự án khác» có thật. | Fixture dựng `silver_labels` đúng khuôn bên đọc **đoán**, dữ liệu thật dùng khuôn khác, nên hàm không bao giờ thấy căn cứ `chu_bai`. Chín ô xanh, E4 xanh, 13 tin thật vẫn nhận dự án của thẻ; chiều đỏ không bắn vì nó cũng là fixture. | Eval script trên bản chép liệt trọn hai tập thật, assert 100%, in `post_id` từng ca lệch. | **fixed**: thêm **E3b** đúng như đề xuất, chạy trên bản chép, không fixture, in cả cỡ hai tập để thấy khi dữ liệu đổi. |
| P1 | contract AC-5 | Then viết «chèn cho MỌI tin của nhóm», trái design §2.2 (thẻ chỉ thắng khi chữ im). Given không ghim bản n+1 đổi giá trị ô nào. | Bản cài làm đúng thiết kế thì E6 đỏ vì đếm theo chữ «mọi tin»; sửa cho E6 xanh thì AC-3 vỡ. Và nếu n+1 chỉ đổi ô phường thì dòng dự án giữ nguyên giá trị nên bỏ bước rút vẫn không nhân đôi, chiều đỏ im. | Tách Then thành hai tập đếm riêng; ghim Given rằng n+1 đổi giá trị ô dự án; thêm ca n+1 chỉ đổi ô phường. | **fixed**: AC-5 viết lại đúng ba điểm ấy; chiều đỏ chuyển sang ca «chỉ đổi ô phường» (hai dòng `area_id` sống cùng lúc). |
| P1 | evals E1, E10 | Hai eval đo hai AC độc lập dùng chung khoá lệnh `tg2_nguong` cùng bộ `paths`; verify gộp lệnh trùng nên hai AC chỉ còn một mã thoát. AC-1 lại phụ thuộc buổi duyệt, điều kiện ngoài tay hàng. | Buổi duyệt ký hai thẻ, tỉ lệ dừng ở 86%; lệnh chung thoát 1 nên AC-8 bị báo trượt dù 0 tin rơi khỏi ô Định vị. | Tách khoá lệnh, mỗi lệnh một mã thoát; thêm vào AC-1 một thước hàng tự bảo đảm được. | **fixed**: ba khoá lệnh riêng (`tg2_phu_the`, `tg2_nguong_moc`, `tg2_khong_tut`); AC-1 tách thành **(a)** 100% tin của nhóm có thẻ được đóng dấu — hàng tự bảo đảm — và **(b)** ngưỡng mốc phụ thuộc buổi duyệt, mỗi thước một eval. |

Năm phát hiện, không mục nào `human-gate1`, không mục nào `deferred`. Hợp đồng sau khi sửa có **11 tiêu chí**
(trên mục tiêu 8–10, trong mức cho phép 12) — lý do giữ ghi ở dòng sổ `giữ cỡ`.
