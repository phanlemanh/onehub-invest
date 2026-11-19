# Review findings: can-gia-tot-loc-xep-hang (round 6)

## Trong hợp đồng

Không có.

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **Tham số URL `location` mang mã khu vực, trái với CONTEXT.md vốn chốt tham số `area` cho mã khu vực; `type` không theo luật camelCase theo tên code**
  Người dùng thấy gì: Đường dẫn của màn Căn giá tốt dùng tên tham số khác với từ vựng chung của dự án. Màn vẫn chạy đúng, nhưng link người vận hành đã lưu có thể phải đổi khi tên được thống nhất sau này.
  Căn cứ: Chỉ là lệch tên gọi, không mất hay sai dữ liệu; chỉnh sớm rẻ hơn chỉnh khi đã có nhiều link lưu, và có thể gom vào một lượt dọn từ vựng.
  file: `app/src/lib/deals-chi-tiet.ts`
  severity: medium
  Đề xuất: known-limits

- **Định nghĩa «Căn giá tốt» trong CONTEXT.md vẫn chỉ gồm tin rao bán, trong khi danh sách nay có cả tin thuê**
  Người dùng thấy gì: Tài liệu từ vựng vẫn mô tả Căn giá tốt chỉ có tin bán, trong khi màn đã hiện cả tin thuê. Người đọc tài liệu có thể hiểu sai phạm vi của màn.
  Căn cứ: Chỉ ảnh hưởng người đọc tài liệu, không đụng đến số liệu trên màn; sửa lại bằng một dòng chữ bất cứ lúc nào.
  file: `app/src/app/ops/deals/page.tsx`
  severity: low
  Đề xuất: known-limits

- **Crumb «Căn giá tốt» ở trang một căn chuyển ngược về chính trang đó: dealTrongDanhSach vẫn dò theo danh sách cũ (top 30, xếp theo mức giảm)**
  Người dùng thấy gì: Ở trang chi tiết một căn, nút quay lại «Căn giá tốt» với nhiều căn sẽ đưa người dùng ngược về chính trang căn đó thay vì danh sách. Người vận hành phải tự bấm đường khác để về danh sách.
  Căn cứ: Gây phiền khi duyệt nhiều căn liên tiếp nhưng không mất dữ liệu và người dùng đi được bằng menu; sửa nằm ở màn trang một căn nên hợp làm thành việc riêng.
  file: `app/src/lib/deals.ts`
  severity: high
  Đề xuất: new-contract

- **Không có bảng hạng thì /ops/deals lặng lẽ bỏ mọi điều kiện trên URL (project, kind=rent, location, type, tab, page), tiêu đề vẫn ghi tên dự án**
  Người dùng thấy gì: Khi chưa có bảng hạng giá, màn hiện toàn bộ tin bán mà không theo bộ lọc, dù tiêu đề vẫn ghi tên dự án đã chọn. Người vận hành có thể tưởng đang xem dự án đó trong khi đang xem tất cả.
  Căn cứ: Chỉ xảy ra trước khi bảng hạng được nạp, là trạng thái tạm thời và đã được ghi vào phần ngoài phạm vi; không mất dữ liệu, hết khi bảng hạng có đủ.
  file: `app/src/app/ops/deals/page.tsx`
  severity: medium
  Đề xuất: known-limits

- **thu-pha.mjs --write --chi ghi đè thu-pha.md bằng bảng một phần và in sai tổng số đột biến**
  Người dùng thấy gì: Công cụ thử phá của hồ sơ nghiệm thu có thể ghi một bản báo cáo chỉ một phần nhưng ghi như đã chạy đủ. Người dùng cuối không bị ảnh hưởng, chỉ người đọc hồ sơ có thể hiểu sai.
  Căn cứ: Chỉ xảy ra khi chạy công cụ bằng một tuỳ chọn hiếm, chạy lại đầy đủ là ra báo cáo đúng; không đáng mở việc.
  file: `_acceptance/can-gia-tot-loc-xep-hang/probes/thu-pha.mjs`
  severity: low
  Đề xuất: wont-fix

- **Hình dạng 4 (assertion âm tính một mình): đột biến AC-1 trên bản sao SQL chỉ assert notDeepEqual, không có đối chứng dương, không kiểm phép thay đã áp**
  Người dùng thấy gì: Một bài kiểm tra thứ tự danh sách có thể báo xanh dù phép thử không thật sự làm gì. Người dùng không thấy gì khác, nhưng lỗi thứ tự sau này có thể khó bị bắt hơn.
  Căn cứ: Là điểm yếu của lưới an toàn chứ không phải lỗi đang hiện trên màn; phép thử đột biến ở công cụ khác vẫn gánh chiều đỏ, nên ghi lại là đủ.
  file: `app/tests/deals-loc-xep-hang.test.tsx`
  severity: low
  Đề xuất: known-limits

- **Hình dạng 4 (assertion âm tính một mình): đối chứng «điều kiện phải có dòng» của AC-8 luôn đúng, nên các assert «không lộ» có thể xanh trên danh sách rỗng**
  Người dùng thấy gì: Bài kiểm tra việc không lộ tên, số điện thoại cho vai Người xem có thể xanh ngay cả khi danh sách rỗng, nên chưa chắc chứng minh đủ mọi điều kiện lọc. Màn thật chưa thấy lộ gì.
  Căn cứ: Đây là độ tin cậy của phép đo chứ không phải lỗi lộ dữ liệu đang xảy ra; nên ghi rõ để lần siết sau bổ sung đối chứng.
  file: `app/tests/deals-loc-xep-hang.test.tsx`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 5 (tuyên quét lớp, chỉ có điểm): «cây × kind × type» lặp trên mục do sản phẩm sinh, không có ma trận viết trước về tập mã**
  Người dùng thấy gì: Bài kiểm tra số căn trên cây vị trí so số của màn với chính màn, nên một mục bị sót trên cây có thể không bị bắt. Hiện chưa thấy mục nào sai số.
  Căn cứ: Là lỗ hổng phép đo, không phải sai số liệu đang thấy; hồ sơ đã ghi các phép so khi chọn mục thuộc giới hạn đã biết và hẹn lại ở hàng sau.
  file: `app/tests/deals-loc-xep-hang.test.tsx`
  severity: medium
  Đề xuất: known-limits

## Chưa adversarial-verify (refuter chết)

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).
