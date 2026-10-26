# Review findings: listings-filters-store-locator (round 1)

## Trong hợp đồng

Không có finding nào map được vào AC.

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **Spec ghi sai đường dẫn bản đồ: `listings/listings-map.tsx` thay vì `listing/listings-map.tsx`**
  Người dùng thấy gì: Một dòng trong tài liệu thiết kế nội bộ ghi sai tên thư mục của bản đồ. Người dùng cuối không thấy gì và không ảnh hưởng tới trang.
  Căn cứ: Chỉ là lỗi gõ trong tài liệu nội bộ, các tài liệu khác đã ghi đúng, sửa hay không cũng không đổi gì với người dùng.
  file: `docs/superpowers/specs/2026-10-26-listings-filters-store-locator-design.md`
  severity: low
  Đề xuất: wont-fix

- **Ngăn lọc gộp nhiều điều kiện «Phường là…» (AND) thành phép hợp, nên mở ngăn rồi bấm «Xem N listing» nới bộ lọc mà không báo**
  Người dùng thấy gì: Nếu người dùng dựng hai chip cùng loại (ví dụ hai điều kiện Phường) ở màn rộng rồi mở ngăn lọc ở màn hẹp và bấm «Xem», kết quả có thể rộng hơn so với bộ lọc ban đầu mà không có thông báo.
  Căn cứ: Tình huống hiếm (cần tự dựng hai chip cùng trường), không mất dữ liệu, người dùng tự dựng lại được bộ lọc, nhưng kết quả sai lặng lẽ nên đáng ghi lại.
  file: `app/src/components/listing/listing-filter-query.ts`
  severity: low
  Đề xuất: known-limits

- **useMemo `rows` gọi .sort() thẳng lên mảng `matched` đã memo, mà mảng này cũng được truyền cho bản đồ**
  Người dùng thấy gì: Khi người dùng đổi kiểu sắp xếp lưới, nhãn giá nào được ưu tiên hiện khi đè nhau trên bản đồ có thể đổi theo, thay vì luôn ưu tiên listing doanh thu cao.
  Căn cứ: Chỉ ảnh hưởng nhãn nào hiện khi chúng chồng nhau, không mất listing nào, phóng to bản đồ là thấy đủ, và lỗi đã có từ bản trước.
  file: `app/src/components/listing/listings-explorer.tsx`
  severity: low
  Đề xuất: known-limits

- **Hình dạng 3 (assert «chuỗi có mặt» thay vì quan hệ): kiểm chip giá đọc «1 tr ₫» chỉ quét /1 tr ₫/ trên toàn trang**
  Người dùng thấy gì: Bài kiểm tự động có thể báo đạt dù chip giá hiển thị sai hoặc không có chip, vì nó chỉ tìm chữ đó ở đâu đó trên trang. Người dùng không bị ảnh hưởng trực tiếp, nhưng lỗi hiển thị chip có thể lọt qua mà không ai biết.
  Căn cứ: Rủi ro nằm ở khâu kiểm chứ không ở trang; sửa rẻ và không đụng người dùng, nhưng nên ghi để không tin quá vào dòng xanh này.
  file: `scripts/smoke-listings-browse.mjs`
  severity: high
  Đề xuất: known-limits

- **Hình dạng 4 (âm tính một mình): đổi sáng/tối giữ tâm không có đối chứng rằng giao diện đã thật sự đổi**
  Người dùng thấy gì: Bài kiểm tự động chưa chứng minh bản đồ thật sự đổi nền khi chuyển sáng/tối; nếu bản đồ không đổi nền thì bài kiểm vẫn báo đạt.
  Căn cứ: Người chấm nhìn ảnh chụp sáng/tối ở bước judgment sẽ thấy ngay nếu hỏng, nên hậu quả nhẹ; chỉ cần ghi là bài kiểm còn lỏng.
  file: `scripts/smoke-listings-browse.mjs`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 4 (âm tính một mình): 'thêm chip → bản đồ canh khung' chỉ assert không có badge; 'khung giữ nguyên' thiếu đối chứng dương**
  Người dùng thấy gì: Bài kiểm tự động chỉ chứng minh thêm chip không bật lọc vùng, chưa chứng minh bản đồ thật sự canh lại khung theo kết quả mới. Nếu bản đồ ngừng canh khung, người dùng có thể thấy bản đồ không theo kết quả mà bài kiểm vẫn đạt.
  Căn cứ: Hậu quả nhẹ và người dùng tự kéo bản đồ được; chỉ là bằng chứng chưa đầy đủ ở một nửa của ma trận.
  file: `scripts/smoke-listings-browse.mjs`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 4 (âm tính một mình): kiểm ring thẻ dùng `ring !== false`, nên qua luôn khi không tìm thấy thẻ**
  Người dùng thấy gì: Bài kiểm tự động có thể báo đạt dù khi rê nhãn trên bản đồ, thẻ tương ứng không được đánh dấu viền chọn. Người dùng khi đó sẽ không thấy thẻ nào sáng lên.
  Căn cứ: Chỉ là hiệu ứng tô sáng phụ, không mất dữ liệu; rủi ro là một lỗi nhỏ lọt qua bài kiểm tự động.
  file: `scripts/smoke-listings-browse.mjs`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 5 (tuyên bố cả lớp nhưng chỉ có điểm-case): 'mở lại: nháp giữ 3 lựa chọn' chỉ kiểm 2**
  Người dùng thấy gì: Bài kiểm tự động nói ngăn lọc giữ đủ ba lựa chọn khi mở lại nhưng mới kiểm hai; nếu khoảng giá bị mất thì bài kiểm vẫn đạt và người dùng phải kéo lại thanh giá.
  Căn cứ: Nếu có hỏng thì người dùng chỉ phải chọn lại một lựa chọn, không mất dữ liệu; sửa bài kiểm rẻ nhưng không cấp bách.
  file: `scripts/smoke-listings-browse.mjs`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 6 (đo cây khác cây đang kiểm): smoke mặc định đo server :3460 mà không xác minh server chạy từ worktree này**
  Người dùng thấy gì: Bài kiểm tự động có thể đo nhầm bản chạy của một nhánh khác nếu cổng đó đang bị nhánh khác dùng. Người dùng cuối không bị ảnh hưởng.
  Căn cứ: Chỉ xảy ra khi người chấm chạy nhầm bản, người chấm tự phát hiện và chạy lại được; thêm cơ chế xác minh tốn công hơn rủi ro.
  file: `scripts/smoke-listings-browse.mjs`
  severity: low
  Đề xuất: wont-fix

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).
