## Trong hợp đồng

- **moi-route không kiểm 'dự án không có → rỗng' và '/lookup đúng 1 căn' như AC-1 và E1 tuyên bố**
  AC: AC-1
  file: `_acceptance/data-api-schema-mau-du-bang-property/probes/moi-route.mjs:160`
  severity: low
  source: bugs
  detail: AC-1 và E1 ghi rằng `?project=999999999` phải trả 200 rỗng, còn `/lookup` phải trả 200 với đúng 1 căn. Bảng MAU chỉ đặt `["/v1/properties?project=999999999", 200]` (không có ngưỡng số phần tử) và lookup chỉ có `toiThieu = 1`. Hàm `xet` chỉ kiểm `n >= toiThieu`, không có nhánh kiểm `n === 0` hay `n === 1`. Nếu route trả toà cho một dự án không tồn tại, hoặc /lookup trả nhiều căn, probe vẫn in «sai mã: 0» và «moi-route: đạt». Nghĩa là bằng chứng E1 khẳng định nhiều hơn những gì thước thật sự đo. Cách sửa: thêm trần số phần tử (ví dụ toiDa) cho hai lời gọi này và kiểm nó trong `xet`.
  lý do vào hợp đồng: AC-1 nêu rõ «dự án không có 200 rỗng» và «/lookup đúng 1 căn», mà probe làm bằng chứng không ghim hai điều này.

- **Hình 3 (assert có mặt/ngưỡng thay vì quan hệ): /lookup hứa «đúng 1 căn» nhưng probe chỉ đo ≥ 1**
  AC: AC-1
  file: `_acceptance/data-api-schema-mau-du-bang-property/probes/moi-route.mjs:38`
  severity: medium
  source: measurement
  detail: AC-1 và E1 expected ghi `/lookup` phải trả 200 với ĐÚNG 1 căn. Nhưng mẫu gọi là `[..lookup.., 200, 1]`, và trong xet() phần tử thứ ba là `toiThieu`, được so bằng `!(r.n >= r.toiThieu)` (dòng ~49). Nếu seed hay route trả 2 căn trở lên thì probe vẫn xanh. Lời hứa là một đẳng thức (n === 1), còn phép đo chỉ là một ngưỡng dưới.
  lý do vào hợp đồng: AC-1 hứa /lookup trả đúng 1 căn, probe chỉ kiểm ≥ 1 nên AC chưa được chứng minh.

- **Hình 4 (âm tính một mình): ca «dự án không có → 200 rỗng» chỉ kiểm mã trạng thái, không kiểm rỗng**
  AC: AC-1
  file: `_acceptance/data-api-schema-mau-du-bang-property/probes/moi-route.mjs:37`
  severity: medium
  source: measurement
  detail: Mẫu gọi `["/v1/properties?project=999999999", 200]` không có ô số phần tử. Trong xet() chỉ có nhánh `toiThieu` (≥ n), không có nhánh nào đòi n === 0. AC-1 và E1 hứa «dự án không có 200 rỗng», nhưng nếu route bỏ qua bộ lọc project và trả luôn toà của dự án mẫu thì probe vẫn xanh. Ca âm tính này không ghim được kết quả rỗng nên không phân biệt được «lọc đúng» với «không lọc».
  lý do vào hợp đồng: AC-1 hứa dự án không có trả 200 rỗng, probe chỉ kiểm mã 200 nên không ghim được phần «rỗng».

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **Khúc PB8 của seed.sql chạy lại thì nhân đôi dòng: registry_aliases và field_assertions không được TRUNCATE, cũng không có ON CONFLICT**
  Người dùng thấy gì: Nếu người dùng nạp dữ liệu mẫu lần thứ hai, một số bí danh và phát biểu của căn mẫu bị lặp, nên tên toà có thể hiện hai lần trong danh sách bất động sản.
  Căn cứ: Chỉ ảnh hưởng dữ liệu mẫu trên máy người thử, không mất dữ liệu thật, và người dùng tự xoá DB mẫu rồi nạp lại là hết.
  file: `data-api/seed.sql`
  severity: medium
  Đề xuất: known-limits

- **Hồ sơ PB8 đang mở nhưng không gắn vào việc nào trong docs/plan/lo-trinh.json, nên LO-TRINH.html sinh thêm một mục «Cần sửa trong kế hoạch»**
  Người dùng thấy gì: Bảng lộ trình hiện thêm một cảnh báo là có hồ sơ đang mở mà chưa thuộc việc nào, dù tính năng cho người dùng không bị ảnh hưởng.
  Căn cứ: Chỉ là cảnh báo sổ sách nội bộ, không chạm người dùng cuối, và thêm mã việc sau vẫn rẻ.
  file: `LO-TRINH.html`
  severity: low
  Đề xuất: known-limits

- **seed.sql chạy lại thì nhân đôi dòng registry_aliases và field_assertions của khúc PB8**
  Người dùng thấy gì: Nạp dữ liệu mẫu nhiều lần làm dữ liệu mẫu phình dần với các dòng lặp, nhưng kết quả các đường tra cứu hiện vẫn đúng.
  Căn cứ: Hậu quả nhẹ, chỉ ở dữ liệu mẫu, và người dùng xoá DB mẫu nạp lại là sạch.
  file: `data-api/seed.sql`
  severity: low
  Đề xuất: known-limits

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).
