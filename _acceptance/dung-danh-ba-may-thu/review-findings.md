## Trong hợp đồng

- **Hình dạng 3 (assert chuỗi có mặt thay cho quan hệ): «tập khoá mới = đúng các khoá của mã q3 mới» bị thu thành phép thử có-mặt**
  file: `pipeline/scripts/danh-ba-vat-the.itest.mjs:663`
  severity: medium
  AC: AC-5
  source: measurement
  detail: E5 hứa một quan hệ bằng nhau giữa hai tập: tập khoá mới đọc từ ba bảng phải bằng ĐÚNG tập khoá của mã q3 mới. soatAC5 chỉ kiểm `canMoi.length !== 1 || !moi.some((r) => r.k === canMoi[0].unit_key)` và `moi.some((r) => r.cap === "b")`. Nghĩa là nó chỉ xác nhận căn q3/QX103.01 nằm trong `moi` và không có toà mới. Một trục hay căn thừa do bước đêm đúc thêm trong q-khu-hai vẫn xanh. Test không dựng tập kỳ vọng viết trước rồi so `moi` với nó bằng deepEqual. Vế «mỗi khoá toà mới có region_node_id = q-phan-khu» cũng không được đo trực tiếp.
  rationale: AC-5 đòi lần một đúc ĐÚNG các khoá của mã mới và không khoá nào ở khu một, mà phép đo chỉ kiểm có mặt, nên khoá thừa ở khu hai vẫn lọt.

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **Hình nghiệm thu thêm tên nguồn thật (chotot, apify-facebook), riêng bản PNG thì không grep được để dọn sau**
  Người dùng thấy gì: Hình minh hoạ đi kèm bản nghiệm thu có in tên thật của hai nguồn dữ liệu. Kho đã công khai nên tên này ai cũng đọc được, và ảnh PNG thì sau này khó tìm ra để dọn.
  Căn cứ: Không ảnh hưởng người dùng cuối hay dữ liệu; chỉ thêm một chỗ lộ tên nguồn trên kho công khai mà đợt dọn tên sau 05/11 sẽ phải xử lý, và sửa lúc nào cũng rẻ.
  file: `_acceptance/dung-danh-ba-may-thu/figures/buoc-dem.html`
  severity: medium
  Đề xuất: known-limits

- **evals.yaml mô tả chiều đỏ qua biến DBV_LENH, nhưng phép đo thật truyền thẳng đường dẫn bản chép**
  Người dùng thấy gì: Bản mô tả phép kiểm nói một cách làm, còn bài kiểm thật làm cách khác nhưng cho kết quả giống hệt. Người đọc bằng chứng có thể hiểu nhầm cách kiểm.
  Căn cứ: Người dùng không thấy gì khác; chỉ gây hiểu nhầm nhẹ cho người đọc hồ sơ nghiệm thu và sửa chỉ là chỉnh chữ.
  file: `_acceptance/dung-danh-ba-may-thu/evals.yaml`
  severity: low
  Đề xuất: known-limits

- **Hình dạng 1 (đo chỉ dẫn thay vì đầu ra): thông điệp đỏ «DBM-AC-4 đêm rơi khu mặc định» được chọn theo nhãn test tự gắn**
  Người dùng thấy gì: Khi bài kiểm báo đỏ, câu giải thích nguyên nhân có thể không đúng, phân biệt không được hai kiểu lỗi. Việc bước đêm có chạy đúng hay không vẫn được đo.
  Căn cứ: Chỉ ảnh hưởng độ chính xác của lời báo lỗi khi test đỏ, không làm mất hay sai dữ liệu; người dùng không gặp và có thể sửa sau với chi phí thấp.
  file: `pipeline/scripts/danh-ba-vat-the.itest.mjs`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 4 (assertion âm tính một mình): soát tĩnh refresh-bait-gap không có đối chứng dương, regex chỉ bắt dạng chữ**
  Người dùng thấy gì: Bài kiểm chỉ chặn một cách viết cụ thể việc đổi mô-đun bước đêm qua biến môi trường, nên một cách viết vòng vèo hơn có thể không bị bắt. Hiện chưa có dấu hiệu mã đang làm vậy.
  Căn cứ: Rủi ro chỉ xảy ra nếu sau này ai đó viết vòng qua rào, không ảnh hưởng người dùng hôm nay; sửa sau không mất dữ liệu và chi phí thấp.
  file: `pipeline/scripts/danh-ba-vat-the.itest.mjs`
  severity: low
  Đề xuất: known-limits

- **Hình dạng 5 (tuyên quét lớp nhưng ma trận không đủ): bảng kỳ vọng đếm theo khu của DBM-AC-8 thiếu ô**
  Người dùng thấy gì: Phép kiểm số lượng theo khu bỏ sót việc đếm trục ở một khu, nên lỗi đếm trục ở khu có phân khu có thể không bị phát hiện. Số toà và căn vẫn được kiểm.
  Căn cứ: Chỉ là một ô đo còn thiếu, ảnh hưởng nhẹ và chỉ khi có lỗi đếm đúng chỗ đó; người dùng không thấy, thêm ô đo sau rất rẻ.
  file: `pipeline/scripts/danh-ba-vat-the.itest.mjs`
  severity: low
  Đề xuất: known-limits

## Chưa adversarial-verify (refuter chết)

⚠ Cụm ngoài vùng phủ: 2/6 lỗi rơi vào file không bộ đo nào phủ (_acceptance/dung-danh-ba-may-thu/figures/buoc-dem.html, _acceptance/dung-danh-ba-may-thu/evals.yaml) — dừng và quyết: mở rộng hợp đồng hay rút phạm vi.
