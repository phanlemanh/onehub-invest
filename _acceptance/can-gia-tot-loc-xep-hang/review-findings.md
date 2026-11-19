# Review findings: can-gia-tot-loc-xep-hang (round 5)

## Trong hợp đồng

(không có)

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **Crumb của trang một căn vẫn hỏi danh sách cũ, nên căn ngoài trang 1 bị đẩy ngược lại chính trang đó**
  Người dùng thấy gì: Ở trang chi tiết một căn, bấm đường dẫn «Căn giá tốt» ở đầu trang đôi khi đưa người dùng về lại chính trang căn đó thay vì về danh sách. Người dùng vẫn vào danh sách được bằng menu.
  Căn cứ: Hậu quả nhẹ, không mất hay lộ dữ liệu, người dùng tự đi đường khác được ngay, và hợp đồng không hứa hành vi này.
  file: `app/src/app/ops/deals/[offerId]/page.tsx`
  severity: medium
  Đề xuất: known-limits

- **Chưa có bảng hạng thì `?project=<id hợp lệ>` (và `kind=rent`, `location`, `type`) hiện cả danh sách không lọc dưới tiêu đề của dự án**
  Người dùng thấy gì: Khi chưa có dữ liệu xếp hạng giá (ví dụ máy chủ đám mây trước khi cập nhật), chọn một dự án hay chọn Cho thuê vẫn hiện danh sách bán chung của mọi phường dưới tên dự án. Người vận hành có thể đọc nhầm đó là căn của dự án.
  Căn cứ: Chỉ xảy ra trong giai đoạn chưa có dữ liệu hạng, gây nhầm lẫn khi đọc nhưng không mất dữ liệu, và hết khi dữ liệu hạng được nạp.
  file: `app/src/app/ops/deals/page.tsx`
  severity: medium
  Đề xuất: known-limits

- **Crumb «Căn giá tốt» ở trang một căn quay vòng về chính trang đó: dealTrongDanhSach vẫn đo theo danh sách 30 dòng cũ**
  Người dùng thấy gì: Đường dẫn quay về danh sách ở trang một căn có thể đưa người dùng vòng lại chính trang đó với nhiều căn không nằm ở trang đầu. Phải đi về danh sách bằng cách khác.
  Căn cứ: Gây phiền nhưng không sai dữ liệu, người dùng tự tránh được, và là điều hướng phụ ngoài các tiêu chí đã ký.
  file: `app/src/lib/deals.ts`
  severity: medium
  Đề xuất: known-limits

- **Chưa có bảng hạng thì lọc dự án, Cho thuê, vị trí, loại hình, tab bị bỏ mà không báo; tiêu đề vẫn ghi tên dự án**
  Người dùng thấy gì: Khi chưa có dữ liệu xếp hạng, các bộ lọc dự án, vị trí, loại hình và Cho thuê bị bỏ qua mà màn không báo, nên người dùng thấy danh sách không đúng điều đã chọn.
  Căn cứ: Chỉ trong giai đoạn chưa có dữ liệu hạng, không mất dữ liệu và tự hết khi dữ liệu được nạp, nhưng nên ghi rõ để người dùng không tin nhầm.
  file: `app/src/app/ops/deals/page.tsx`
  severity: medium
  Đề xuất: known-limits

- **thu-pha.mjs --chi kèm --write ghi thu-pha.md với tổng của cả 76 đột biến dù chỉ chạy một tiêu chí**
  Người dùng thấy gì: Công cụ thử phá của đội có thể ghi bảng kết quả với tổng số sai khi chỉ chạy một phần. Người dùng cuối không thấy gì.
  Căn cứ: Chỉ ảnh hưởng tài liệu nghiệm thu nội bộ, chạy đủ bộ thì đúng, sửa thì không cải thiện sản phẩm.
  file: `_acceptance/can-gia-tot-loc-xep-hang/probes/thu-pha.mjs`
  severity: low
  Đề xuất: wont-fix

- **Hình dạng 1 (đo CHỈ DẪN thay vì ĐẦU RA): E13 chạy design-gate chế độ dom trên mã nguồn .tsx, không trên HTML đã dựng**
  Người dùng thấy gì: Phép kiểm giao diện tự động đọc mã nguồn chứ không đọc màn đã dựng, nên có thể báo sạch khi màu hay độ tương phản thực tế còn lỗi. Màn có thể cần mắt người soi thêm.
  Căn cứ: Đây là khoảng hở của phép đo chứ chưa chứng tỏ màn sai, và người ký vẫn soi màn thật ở các khổ sáng, tối nên rủi ro thấp.
  file: `_acceptance/can-gia-tot-loc-xep-hang/probes/design-gate.sh`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 4 (assertion âm tính một mình, đối chứng không với tới được): «có dữ liệu thì không có chữ trống» chỉ dò chuỗi của trạng thái tab, mà fixture đang ở tab Tất cả**
  Người dùng thấy gì: Một phép kiểm tự động chưa thực sự bắt được lỗi hiện chữ «trống» khi lẽ ra có dữ liệu. Màn hiện tại chưa thấy sai.
  Căn cứ: Chỉ làm bài kiểm yếu đi, chưa có lỗi hiển thị thật, và người dùng nếu gặp thì tải lại là hết.
  file: `app/tests/deals-loc-xep-hang.test.tsx`
  severity: low
  Đề xuất: known-limits

- **Hình dạng 5 (tuyên quét LỚP nhưng ma trận thiếu phần tử): AC-8 mở căn ngoài trang không có assert nào về ảnh cho vai Người xem**
  Người dùng thấy gì: Phép kiểm tự động chưa soi riêng ảnh khi vai Người xem mở một căn ngoài trang, nên nếu ảnh lọt ra thì chưa chắc bị bắt. Chưa có bằng chứng ảnh bị lộ.
  Căn cứ: Nếu lộ thật thì ảnh tin rao là dữ liệu nhạy cảm theo vai, nhưng chưa có dấu hiệu lộ và bổ sung phép kiểm là việc nhỏ, không đòi tính năng mới.
  file: `app/tests/deals-loc-xep-hang.test.tsx`
  severity: medium
  Đề xuất: known-limits

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).
