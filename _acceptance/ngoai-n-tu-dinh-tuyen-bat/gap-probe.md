---
slug: ngoai-n-tu-dinh-tuyen-bat
at: 2026-11-15T00:40:00Z
verdict: findings
p0: 0
p1: 2
p2: 3
---

## Findings

| Sev | Artifact | Thiếu gì | Kịch bản fail | Thước đo | Xử lý |
|---|---|---|---|---|---|
| P1 | contract | Phần Context chép lời duyệt chỉ cho loại «ghi giới hạn đã biết». Nhưng thiết kế và AC-3 lại để máy xếp cả loại wont-fix («chấp nhận, không sửa»). Hợp đồng cũng không tách 28 mục theo từng loại. | Mạnh duyệt Cổng Phạm vi với hiểu biết rằng chỉ loại giới hạn đã biết đi qua. Sau khi gộp, mục wont-fix cũng không còn hỏi Mạnh. | Sửa Context cho khớp thiết kế. Thêm vào AC-3 và E3 số mục tách theo loại. Nếu lời gốc chỉ nói «giới hạn đã biết» thì đưa phần wont-fix thành câu hỏi gửi Mạnh. | fixed: Context nêu rõ cả hai loại. AC-3/E3 đòi 23 ghi Known limits và 5 chấp nhận không sửa (bộ đo có ca riêng). Câu Hỏi-1 trong sổ (dòng 5, thay dòng 2) hỏi Mạnh cho cả hai loại. |
| P1 | contract | Phần «giá» ghi «Mạnh thấy mục trên thẻ và đảo bằng ký Cổng 2». Nhưng ở làn V thì không có lời mời ký, PR được gộp theo cửa sổ. | Một mục như nap-s09 Ngoài-1 được gộp mà Mạnh không hề thấy. Lệnh đảo chỉ còn tác dụng sau khi đã gộp. | Thêm AC cho khối hiện trước khi gộp, hoặc sửa câu giá cho đúng. | fixed: sửa câu giá ở Context, thiết kế và Hỏi-1. Làn V không mời ký, có thể Mạnh không thấy mục trước khi gộp; đảo sau gộp là mở việc mới. Bề mặt hiện cho Mạnh trước khi gộp là việc của kit, ngoài phạm vi kho (cấm sửa kit). |
| P2 | evals | E3 chỉ đếm tổng, không kiểm 11 mục còn lại có đúng là new-contract không. Khuôn dòng máy chỉ được in thành chữ «khuôn đúng». | Máy xếp nhầm một mục new-contract và bỏ sót một mục known-limits, tổng vẫn khớp nên vẫn ĐẠT. | Đòi từng mục còn lại là new-contract. Ghim nguyên văn lệnh đảo. | fixed: bộ đo đọc đề xuất bằng lib/out-of-contract.cjs và đòi cả 10 mục còn lại là new-contract. Lượt đếm này lộ ra số đúng là 38/10, không phải 39/11 (stg-du-an-s08 có 6 mục ngoài hợp đồng). Đã ghim nguyên văn lệnh đảo dòng đầu của nap-s09. Khuôn dòng máy kiểm đủ may, không có decided_by, tieu_de và dao nguyên văn theo từng mục. |
| P2 | contract | Out of scope ghi «sau khi gộp». Nhưng hồ sơ T2 đang verified chờ ký lúc gộp vẫn bị máy xếp. | Một hồ sơ đang chờ Cổng 2 nhận main, máy xếp mục Mạnh định chọn mở hợp đồng mới. | Liệt kê hồ sơ T2 verified chưa ký tại đỉnh PR, sửa câu Out of scope. | fixed: ở mốc d2b4beaf không có hồ sơ T2 nào verified chờ ký. Out of scope đã sửa: hồ sơ verified trên nhánh khác sẽ được máy xếp khi vòng của nó chạy lại bước verified. |
| P2 | evals | E2–E7 chạy kit theo bản đang cài, không ghim 2.37.0. | Máy chấm dùng kit 2.38, số đổi theo bản kit chứ không theo khoá. | In bản kit, đòi đúng 2.37.0, lệch thì báo «sai bản kit». | fixed: bộ đo có ca NNTD-BAN; kit khác 2.37.0 thì dừng với thông điệp «sai bản kit». |
