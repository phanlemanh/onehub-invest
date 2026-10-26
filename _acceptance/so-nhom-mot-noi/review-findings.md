# Review findings: so-nhom-mot-noi (round 3)

## Trong hợp đồng

(không có finding nào map được vào AC)

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **SoDonVi chép prop rows vào useState một lần: bấm «Thử lại» sau lỗi thì cả sổ hiện trống**
  Người dùng thấy gì: Sau khi đọc sổ bị lỗi rồi bấm «Thử lại», trang có thể báo sổ trống dù dữ liệu vẫn còn. Người vận hành phải tải lại cả trang mới thấy đủ đơn vị.
  Căn cứ: Dữ liệu không mất và không bị ghi sai, người dùng tự khắc phục được bằng cách tải lại trang, và lỗi chỉ xảy ra sau một lần đọc sổ thất bại.
  file: `app/src/components/ops/sources/so-don-vi.tsx`
  severity: medium
  Đề xuất: known-limits

- **Lọc S05/S06 viết cứng bằng literal SQL ở ba nơi, không dùng hằng NHOM_TRANG_CU vừa tạo**
  Người dùng thấy gì: Người dùng không thấy gì khác hôm nay. Nếu sau này danh sách nguồn của trang nhóm thu cũ đổi, phải sửa nhiều chỗ và có thể sót một chỗ.
  Căn cứ: Không ảnh hưởng người dùng hiện tại và không mất dữ liệu; chỉ là rủi ro bảo trì về sau, dọn lại lúc nào cũng được.
  file: `app/src/lib/che-do-thu.ts`
  severity: low
  Đề xuất: wont-fix

- **JSDoc của docNhomThu bị tách khỏi hàm và dính vào hằng NHOM_TRANG_CU**
  Người dùng thấy gì: Không có hậu quả cho người dùng cuối; chỉ làm chú thích hướng dẫn của một hàm hiện sai chỗ cho lập trình viên.
  Căn cứ: Hoàn toàn không đổi hành vi sản phẩm, không mất dữ liệu, sửa lúc nào cũng rẻ nhưng không đáng mở việc riêng.
  file: `app/src/lib/che-do-thu.ts`
  severity: low
  Đề xuất: wont-fix

- **readS03Groups viết lại lần thứ ba luật kế thừa nhóm của OpenClaw thay vì dựng trên readS03Allowlist**
  Người dùng thấy gì: Hôm nay danh sách nhóm S03 hiện đúng. Nhưng nếu sau này luật nhóm thừa kế ở cổng S03 đổi, một bản sao có thể bị bỏ sót và sổ hiện trạng thái nhóm lệch với thực tế.
  Căn cứ: Chưa gây sai lệch nào, chỉ là rủi ro lệch về sau và chỉ ảnh hưởng nội bộ vận hành; ghi lại để người sửa luật sau nhớ sửa cả ba chỗ.
  file: `scripts/lib/ops-local.mjs`
  severity: low
  Đề xuất: known-limits

- **Trạng thái trống của sổ S05/S06 không có hành động (ReUI luật 5)**
  Người dùng thấy gì: Khi tab S05 hay S06 chưa có nhóm nào, người dùng chỉ thấy một dòng chữ chỉ dẫn, không có nút bấm để thêm nhóm ngay.
  Căn cứ: Chỉ là bất tiện nhỏ, dòng chữ đã nói rõ nơi thêm nhóm nên người dùng không bị kẹt và không mất dữ liệu.
  file: `app/src/components/ops/sources/so-don-vi.tsx`
  severity: low
  Đề xuất: known-limits

- **SoDonVi chỉ lấy rows một lần lúc khởi tạo: bấm «Thử lại» xong vẫn thấy sổ rỗng, và sổ không theo kịp thay đổi ở lưới nhóm thu**
  Người dùng thấy gì: Sổ đơn vị có thể hiện trạng thái cũ sau khi thêm hoặc xoá nhóm ở lưới phía trên, hoặc sau khi bấm Thử lại, cho tới khi tải lại trang. Mở hộp khai cho nhóm đã xoá sẽ báo lỗi không tìm thấy.
  Căn cứ: Chỉ là hiển thị chậm, không ghi sai hay mất dữ liệu, và tải lại trang là hết; admin là người dùng nội bộ nên chịu được.
  file: `app/src/components/ops/sources/so-don-vi.tsx`
  severity: medium
  Đề xuất: known-limits

- **Lỗi đọc sổ đơn vị bị nuốt, không ghi log phía server**
  Người dùng thấy gì: Khi sổ đọc lỗi, người vận hành thấy thông báo chung chung và log máy chủ không có dấu vết nên khó tìm nguyên nhân.
  Căn cứ: Người dùng cuối không bị ảnh hưởng, chỉ khó chẩn đoán lúc sự cố hiếm; dữ liệu không mất và có thể bổ sung log sau rất rẻ.
  file: `app/src/components/ops/sources/sources-content.tsx`
  severity: low
  Đề xuất: wont-fix

- **Hình dạng 1 (đo chỉ dẫn thay vì đầu ra): đường lỗi của trang /ops/sources được kiểm bằng regex trên mã nguồn sources-content.tsx**
  Người dùng thấy gì: Bài kiểm tra đường lỗi của trang sổ khá giòn: có thể đỏ oan khi đổi cách viết mã, hoặc bỏ lọt nếu trang hỏng ở chỗ khác. Người dùng không thấy ngay ảnh hưởng nào.
  Căn cứ: Chỉ làm giảm độ tin cậy của bằng chứng kiểm thử, không ảnh hưởng người dùng hay dữ liệu, và hành vi thật đã có các phép đo bổ trợ.
  file: `app/tests/so-nhom.test.tsx`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 2 (fixture viết tay đúng khuôn bên đọc): tệp cấu hình gateway của SN-AC-5/6/10 là literal viết tay, không rút từ zalo-admin.ts**
  Người dùng thấy gì: Nếu cấu trúc tệp cấu hình cổng thật lệch với mẫu giả định trong bài kiểm tra, bài kiểm tra vẫn xanh nhưng đồng bộ nhóm S03 ngoài đời có thể đọc sai.
  Căn cứ: Sự cố chỉ xảy ra nếu hai khuôn lệch nhau, hiện chưa thấy lệch; đồng bộ chỉ đọc nên không làm hỏng cấu hình cổng hay mất dữ liệu.
  file: `pipeline/scripts/so-nhom.itest.mjs`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 5 (tuyên quét lớp nhưng chỉ có điểm-case): E1 hứa «năm CHECK của 047 còn đủ tên», test chỉ liệt ba**
  Người dùng thấy gì: Hai ràng buộc kiểm tra trạng thái của sổ nguồn chưa được bài kiểm tra xác nhận còn nguyên sau khi đổi tên bảng, dù chưa thấy dấu hiệu chúng mất.
  Căn cứ: Rủi ro thấp và chỉ ở lớp kiểm thử; thêm hai tên vào danh sách kiểm là rẻ nhưng không ảnh hưởng người dùng.
  file: `pipeline/scripts/so-nhom.itest.mjs`
  severity: low
  Đề xuất: known-limits

- **Hình dạng 3 (assert chuỗi có mặt thay vì quan hệ): cột Thị trường và Khu đô thị của mỗi dòng được kiểm bằng một lần includes("—")**
  Người dùng thấy gì: Nếu một cột như Thị trường hay Khu đô thị biến mất khỏi sổ, bài kiểm tra có thể vẫn xanh. Hiện giao diện vẫn hiện đủ cột.
  Căn cứ: Giao diện hiện đúng và dễ thấy bằng mắt; chỉ là bài kiểm tra lỏng, hậu quả nhẹ và không mất dữ liệu.
  file: `app/tests/so-nhom.test.tsx`
  severity: low
  Đề xuất: wont-fix

- **Hình dạng 4 (assertion âm tính đứng một mình, không ghim thông điệp): ca tệp cấu hình vắng/hỏng chỉ assert mã thoát khác 0**
  Người dùng thấy gì: Khi tệp cấu hình thiếu hay hỏng, bài kiểm tra chỉ biết script dừng lại chứ không biết dừng vì đúng lý do. Sổ vẫn không đổi trong cả hai trường hợp.
  Căn cứ: Hành vi an toàn cần thiết (dừng, sổ không đổi) vẫn được kiểm; phần thiếu chỉ làm bằng chứng kém tinh, không ảnh hưởng người dùng.
  file: `pipeline/scripts/so-nhom.itest.mjs`
  severity: low
  Đề xuất: wont-fix

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).
