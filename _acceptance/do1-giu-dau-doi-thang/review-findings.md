## Trong hợp đồng

- **Hình dạng 3 (assert «có mặt» trong khi lời hứa là quan hệ «còn đúng N dòng, không thêm dòng»): nhánh «giu» của DD-AC-5 chỉ kiểm dòng mang tiền tố của fixture**
  file: `pipeline/scripts/do-hang-ngay-doi-thang.itest.mjs:278`
  severity: medium
  AC: AC-5
  source: measurement
  detail: AC-5 nhánh «giữ» và expected của E5 hứa: ngày D «còn đúng ba dòng chèn sẵn, không thêm dòng». Dòng 278 lại assert `(await dongTin(D)).map((x) => x[0])` bằng ba khoá `tin:${T}-co-san-…`. `dongTin` (dòng 84–86) lọc `unit_key LIKE 'tin:${T}%'`, nên thước chỉ thấy các dòng do fixture tạo. Nó không nhìn thấy dòng mới của mọi đơn vị khác trong ngày D: đơn vị thật của bản chép mà `data_level_units()` trả về, và cả đơn vị `can:999999001` do chính `nen({bang:'cu'})` chèn. Nếu nhánh giữ lỡ đi vào đường so bậc và ghi thêm dòng cho các đơn vị đó, ba khoá co-san vẫn còn nguyên và assert vẫn xanh. Như vậy vế «không thêm dòng» của lời hứa không được đo. Nhánh «xoa» ngay bên trên dùng `demNgay(D)`, đếm toàn ngày. Nhánh «giu» cần cùng phạm vi đó, tức `demNgay(D) === 3` hoặc so trọn tập dòng của D, để đo được quan hệ «đúng ba dòng có sẵn và không có dòng nào khác».

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **Ngày áp thang lấy từ min(detail.ngay) của dòng DO1 nên chạy lại `--ngay` cho một ngày cũ làm lệch ngày áp vĩnh viễn**
  Người dùng thấy gì: Nếu có người chạy tay lệnh đo cho một ngày trước ngày đổi thang, trang chất lượng sẽ hiện sai ngày «áp từ» và lệnh sửa ngày có thể nhắm nhầm ngày hoặc từ chối chạy.
  Căn cứ: Chỉ xảy ra khi có người cố ý chạy tay ngày cũ, hậu quả là hiển thị sai ngày chứ không mất dữ liệu gốc, và hợp đồng vừa chốt cách tính ngày áp này.
  file: `pipeline/do-hang-ngay.mjs`
  severity: medium
  Đề xuất: known-limits

- **Ngày áp lấy từ dòng DO1 mà lượt DO1 hôm sau có thể xoá, nên ngày áp có thể trượt sang hôm sau và Hỏi-1 lặng lẽ xoá dòng chuyển thật**
  Người dùng thấy gì: Hiếm khi, nếu lượt đo cuối của ngày đổi thang chạy vắt qua nửa đêm, ngày áp thang có thể trượt sang hôm sau và dòng chuyển bậc thật của hôm sau bị xoá mà không báo.
  Căn cứ: Chỉ rơi vào cửa sổ vài phút quanh nửa đêm đúng ngày đổi thang, nhưng nếu xảy ra thì mất dòng chuyển bậc mà không ai biết, nên cần ghi rõ để theo dõi.
  file: `pipeline/do-hang-ngay.mjs`
  severity: medium
  Đề xuất: known-limits

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).

