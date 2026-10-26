# Review findings: so-nhom-mot-noi (round 1)

## Trong hợp đồng

Không có finding nào map được vào AC.

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **Chữ UI dùng «Dự án», trong khi CONTEXT.md ghi nhãn chuẩn là «Khu đô thị» và liệt «dự án» vào _Avoid_**
  Người dùng thấy gì: Trên sổ đơn vị thu, cột và hộp thoại gọi khái niệm là «dự án», còn phần còn lại của hệ thống gọi là «Khu đô thị». Người vận hành có thể thấy hai tên cho cùng một thứ.
  Căn cứ: Chỉ lệch chữ, không mất hay sai dữ liệu, người dùng vẫn hiểu và thao tác đúng; đổi nhãn sau rẻ và an toàn.
  file: `app/src/components/ops/sources/so-don-vi.tsx`
  severity: medium
  Đề xuất: known-limits

- **sync-don-vi đưa vào sổ mọi dòng airdna_markets, không lọc country_code = 'vn' như các chỗ khác cùng đọc bảng này**
  Người dùng thấy gì: Nếu sau này có thị trường ngoài Việt Nam trong dữ liệu, sổ sẽ liệt kê chúng là đang hoạt động dù hệ thống không thu. Hiện chưa xảy ra.
  Căn cứ: Hôm nay chưa có dòng nào ngoài Việt Nam nên người dùng không thấy gì sai; chỉ cần ghi chú và sửa khi mở rộng thị trường.
  file: `pipeline/sync-don-vi.mjs`
  severity: low
  Đề xuất: known-limits

- **SoDonVi giữ state cũ sau router.refresh: «Thử lại» xong vẫn hiện sổ rỗng, nhóm vừa thêm hoặc vừa xoá ở lưới nhóm thu không cập nhật trong sổ**
  Người dùng thấy gì: Sau khi bấm «Thử lại» hoặc sau khi thêm hay xoá nhóm ở lưới nhóm thu, sổ có thể vẫn hiện dữ liệu cũ (kể cả rỗng) cho tới khi tải lại cả trang. Khai một nhóm đã xoá sẽ báo không có đơn vị này.
  Căn cứ: Người dùng tự khắc phục được bằng cách tải lại trang và không mất dữ liệu, nhưng gây khó hiểu ngay ở đường thử lại nên nên sửa sớm ở vòng sau.
  file: `app/src/components/ops/sources/so-don-vi.tsx`
  severity: medium
  Đề xuất: known-limits

- **khaiDonVi biến mọi lỗi đọc phiên (DB lỗi) thành 403 «chỉ quản trị viên»**
  Người dùng thấy gì: Khi cơ sở dữ liệu trục trặc tạm thời, quản trị viên đang đăng nhập hợp lệ có thể bị báo «chỉ quản trị viên khai được» thay vì thấy lỗi máy chủ. Lỗi này cũng không được ghi lại.
  Căn cứ: Chỉ xảy ra lúc hệ thống lỗi, không làm hỏng dữ liệu và thử lại được; chỉ gây hiểu nhầm nguyên nhân.
  file: `app/src/lib/so-don-vi.ts`
  severity: low
  Đề xuất: known-limits

- **Hình dạng 4 (âm tính một mình, không ghim thông điệp): SN-AC-5 ca tệp cấu hình vắng/hỏng chỉ kiểm mã thoát khác 0**
  Người dùng thấy gì: Bài kiểm cho trường hợp tệp cấu hình thiếu hoặc hỏng chỉ xác nhận lệnh đồng bộ báo lỗi, không xác nhận nó dừng đúng chỗ và đúng lý do. Người dùng không thấy khác biệt trực tiếp.
  Căn cứ: Hành vi theo hợp đồng vẫn đúng; rủi ro là sau này một lỗi khác có thể lọt qua mà bài kiểm vẫn xanh, sửa sau rẻ.
  file: `pipeline/scripts/so-nhom.itest.mjs`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 1 (đo văn bản mã thay vì đầu ra): SN-AC-8 grep nguồn sources-content.tsx cho đường hàm-đọc-ném → vùng lỗi; SN-AC-9 grep route.ts**
  Người dùng thấy gì: Bài kiểm trang sổ đơn vị thu kiểm một phần bằng cách đọc chữ trong mã nguồn thay vì chạy trang thật, nên có thể báo xanh dù hành vi lệch hoặc báo đỏ dù hành vi đúng. Người dùng không bị ảnh hưởng ngay.
  Căn cứ: Không làm sai dữ liệu hay giao diện hiện tại; chỉ làm giảm độ tin cậy của bài kiểm về sau.
  file: `app/tests/so-nhom.test.tsx`
  severity: low
  Đề xuất: known-limits

- **Hình dạng 4 (âm tính một mình, không có đối chứng dương): SN-AC-10 bản tin push-ops-facts «không chứa khoá đơn vị»**
  Người dùng thấy gì: Bài kiểm khẳng định sổ đơn vị không lên đám mây nhưng không có ca đối chứng nên chưa chứng minh được là nó sẽ bắt được khi có rò. Hiện không có dấu hiệu rò.
  Căn cứ: Chưa có dữ liệu nào bị lộ; chỉ là lưới an toàn kiểm thử yếu, bổ sung ca đối chứng sau là việc nhỏ.
  file: `pipeline/scripts/so-nhom.itest.mjs`
  severity: low
  Đề xuất: known-limits

- **Hình dạng 5 (tuyên lớp nhưng chỉ có một phần ma trận): SN-AC-1 hứa «năm CHECK của 047 còn đủ tên» nhưng chỉ kiểm ba**
  Người dùng thấy gì: Bài kiểm việc đổi tên bảng chỉ xác nhận ba trong năm ràng buộc dữ liệu còn nguyên. Người dùng không thấy ảnh hưởng.
  Căn cứ: Hai ràng buộc còn lại không có dấu hiệu bị mất; chi phí bổ sung nhỏ nhưng hậu quả cho người dùng gần như không có.
  file: `pipeline/scripts/so-nhom.itest.mjs`
  severity: low
  Đề xuất: wont-fix

- **Hình dạng 3 (assert chuỗi có mặt thay cho quan hệ từng cột): SN-AC-8 dùng một ký tự «—» thay cho hai cột Thị trường và Dự án**
  Người dùng thấy gì: Bài kiểm sổ đơn vị không phân biệt được cột Thị trường và cột Dự án khi cả hai đang trống, nên nếu một cột biến mất bài kiểm có thể vẫn xanh. Giao diện hiện tại hiển thị đúng.
  Căn cứ: Không ảnh hưởng người dùng hôm nay; lỗi bố cục như vậy sẽ lộ ngay khi nhìn màn hình và sửa rẻ.
  file: `app/tests/so-nhom.test.tsx`
  severity: low
  Đề xuất: wont-fix

- **Hình dạng 2 (fixture viết tay đúng khuôn bên đọc): cấu hình gateway của SN-AC-5/6/10 là khuôn viết tay, không rút từ zalo-admin.ts**
  Người dùng thấy gì: Bài kiểm đồng bộ nhóm Zalo dùng tệp cấu hình mẫu viết tay, chưa dùng tệp do chính chức năng ghi cấu hình sinh ra. Nếu hai bên lệch khuôn, lỗi có thể chỉ lộ khi chạy thật.
  Căn cứ: Hiện hai bên khớp và đồng bộ chỉ đọc nên không làm hỏng cấu hình thật; rủi ro chỉ là phát hiện muộn nếu khuôn đổi.
  file: `pipeline/scripts/so-nhom.itest.mjs`
  severity: low
  Đề xuất: known-limits

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).
