# Review findings: che-tim-bi-danh-viewer (round 1)

## Trong hợp đồng

(không có)

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **E2 trong evals.yaml mô tả chiều đỏ đột biến people-view.tsx nhưng test thực tế đột biến people-content.tsx**
  Người dùng thấy gì: Tài liệu đánh giá nói một nơi bị thử phá, còn bài kiểm tra thực tế phá ở nơi khác. Người dùng cuối không bị ảnh hưởng, nhưng người ký cổng có thể đọc nhầm thứ đã được đo.
  Căn cứ: Chỉ là chú thích sai trong tài liệu, không làm lộ hay mất dữ liệu của người dùng, và sửa lại sau rất rẻ nên ghi lại là đủ.
  file: `_acceptance/che-tim-bi-danh-viewer/evals.yaml`
  severity: low
  Đề xuất: known-limits

- **Trạng thái lọc rỗng vẫn bảo vai Người xem «Đổi nguồn hoặc chữ tìm» dù vai này không còn ô tìm**
  Người dùng thấy gì: Khi vai Người xem chọn một nguồn không có ai, trang gợi ý họ đổi chữ tìm trong khi họ không có ô tìm nào. Chỉ gây hơi khó hiểu, họ vẫn đổi nguồn được.
  Căn cứ: Hậu quả nhẹ, chỉ là một câu gợi ý hơi thừa, không mất hay lộ dữ liệu, người xem vẫn tự đổi nguồn để thoát trạng thái rỗng.
  file: `app/src/components/ops/people/people-view.tsx`
  severity: low
  Đề xuất: known-limits

- **Hình dạng 5 — tuyên quét lớp vai theo thước BAC_VAI nhưng ma trận viết tay thiếu phần tử owner; assert số ô là hằng đúng**
  Người dùng thấy gì: Bài kiểm tra chưa thử vai chủ sở hữu và sẽ không tự báo nếu sau này có thêm vai mới. Hiện người dùng chưa gặp lỗi nào, nhưng một lỗi riêng ở vai đó có thể lọt qua mà không ai biết.
  Căn cứ: Rủi ro chỉ là lỗi tương lai có thể lọt qua kiểm tra, hiện chưa có sai lệch nào với người dùng; bổ sung ca thử sau này dễ và rẻ.
  file: `app/tests/danh-ba-nguoi-tren-ops.test.tsx`
  severity: low
  Đề xuất: known-limits

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).
