---
slug: chu-nguon-tren-cong
at: 2026-11-04T03:00:00Z
verdict: findings
p0: 2
p1: 3
p2: 0
---
## Findings
| Sev | Artifact | Thiếu gì | Kịch bản fail | Thước đo | Xử lý |
|---|---|---|---|---|---|
| P0 | contract | Hai lựa chọn chỉ người có nhưng sổ không có dòng: nút sang miền S01 trên trang listing, ảnh listing trỏ CDN của S01 | Mạnh ký mà hai dòng chỉ nằm ở Out of scope, 05/11 trang công khai vẫn hiện tên | Mỗi chỗ một Hỏi-n có lối, giá, số đo; dòng sổ ghi lời Mạnh | fixed: nút đã có quyết định của Mạnh 04/11 (dòng sổ 9), chữ nút đổi, phép quét miễn đúng khuôn. human-gate1: ảnh CDN thành Hỏi-2 |
| P0 | contract | Dòng về bốn trang ngoài danh sách và dòng tiêu đề listing ship tên tầng A mà ghi kho_dao false | Mạnh ký không biết đang chấp nhận ngoại lệ luật 6 | Viết lại bằng supersedes, Hỏi-n kèm số đo | fixed: bốn trang đã vào phạm vi theo trả lời của giám sát (dòng sổ 8). human-gate1: tiêu đề listing thành Hỏi-1 |
| P1 | evals | «Sạch» hẹp hơn lời hứa: chỉ đo DB máy thu, sổ chỉ từ migration thiếu S08, miễn tiêu đề không trần, không hàng ma trận cho tiêu đề cộng chữ thân | Cloud có tên khác mà E2 xanh; tên S08 lọt mà báo 0 | Đo production sau triển khai, in mã có trong sổ, trần tiêu đề, thêm hàng ma trận | fixed: mục Đường đo sau triển khai; lệnh quét cộng source_registry local và in danh sách mã; trần 5 tiêu đề; thêm ca tiêu đề cộng chữ thân. Chiều đỏ của E2 nằm ở ca máy chủ giả trong exit code và số đo main ở design doc |
| P1 | contract | Âm tính không đối chứng dương: nhãn mới, OpenStreetMap không AC nào đòi; AC-4 đọc tệp không nêu tên | Xoá cả mục Nguồn dữ liệu mà thước vẫn xanh; «giả lập» ở tệp thứ tư lọt | Danh sách cấm và danh sách dương trên HTML có chiều đỏ; AC-4 nêu tên tệp | fixed: lệnh quét thêm CÂU-SAI, THIẾU-CHỮ theo trang, ca E4b ghim thông điệp; AC-4 nêu sáu tệp. deferred: render bảng Lợi suất để kiểm nhãn trong bảng, thay bằng bước nhìn ở E6 |
| P1 | evals | E6, E7 hẹp hơn AC: thiếu ma trận ba trang, không mở popover số, không đo chạm; E7 không có đối chứng đỏ cho số S02 | Popover tràn ở điện thoại, nút số không bao giờ hiện trên dữ liệu thật mà E5 vẫn xanh | Ma trận ba trang nhân ba chế độ, chọn thẻ từ dữ liệu thật, ca đột biến S02 | fixed: E6 viết lại, KHONG-DO khi không có tin; E7b thêm ca fixture gọi hàm số S02 |
