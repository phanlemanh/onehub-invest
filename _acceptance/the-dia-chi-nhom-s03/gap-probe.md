---
slug: the-dia-chi-nhom-s03
at: 2026-11-16T00:00:00Z
verdict: findings
p0: 0
p1: 4
p2: 1
---
## Findings
| Sev | Artifact | Thiếu gì | Kịch bản fail | Thước đo | Xử lý |
|---|---|---|---|---|---|
| P1 | evals | E2 lệch số ca (13 với 15) và đối chứng đỏ nhắm ca đã bị luật ≥ 3 bài chặn; không ca nào chạm ngưỡng 10% hay trần 3 nút | Bản bỏ luật 10% vẫn xanh; ngưỡng Hỏi-3 không có phép đo canh | Sửa số ca cho khớp; thêm ca 4/50 bài và ca bốn tên; đối chứng đỏ nhắm hai ca này | fixed: AC-2 và E2 ma trận 16 ô, thêm ca tên 4/50 (8%) và bốn tên giữ ba, hai đối chứng đỏ nguong-10 và tran-3 |
| P1 | evals | Ô phường, phân khu, bán/thuê chỉ đo trên fixture viết tay; dữ liệu thật chỉ đếm số thẻ và so ô dự án | Khuôn nhãn thật khác fixture thì 27 thẻ trống ô mà mọi eval vẫn xanh | E7 in số nhóm có giá trị từng ô trên nhãn thật kèm sàn khai trước | fixed: AC-7 và E7 in số nhóm có giá trị từng ô trong nhóm từ 5 bài đọc, sàn ô bán/thuê và ô dự án ít nhất một nửa |
| P1 | design | Dòng sổ bỏ design-pass ghi «một lối» trong khi lối dựng bản bấm được trên DB thử còn sống | Cổng Phạm vi duyệt hộp mới chỉ bằng chữ mà không biết đó là một lựa chọn | Đưa thành câu của người | fixed: dòng sổ Hỏi-4 thay dòng bỏ design-pass (supersedes), lên thẻ Cổng Phạm vi |
| P1 | evals | E10 đòi «ô trống nói vì sao» mà inputs chỉ có ảnh nhóm lớn, có thể không có ô trống | Hội đồng không có căn cứ, phán FAIL hay PASS chay | Thêm ảnh hộp có ô trống vào E5 và inputs của E10 | fixed: E5 thêm bước E5-step-o-trong.png, E10 inputs thêm ảnh ấy |
| P2 | evals | Trạng thái viewer chỉ xem và lỗi 409 giữ chữ của đặc tả UX không có bước nhìn | Hộp hiện nút ghi cho viewer hay xoá chữ khi 409 mà không eval nào đỏ | Thêm bước viewer và 409 vào E5 | fixed: AC-5 và E5 thêm bước E5-step-409.png và E5-step-viewer.png |
