# Review findings: the-hai-nguoi-xep-sau (round 1)

## Trong hợp đồng

- **Hình dạng 1 (đo giả định thay vì đầu ra): chỉ số «số tin đơn người mới với tới tăng» trong lat-that.mjs không lấy gì từ tinKe**
  file: `_acceptance/the-hai-nguoi-xep-sau/probes/lat-that.mjs:379`
  severity: medium
  source: measurement
  AC: AC-4
  detail: E6 của the-hai-nguoi-xep-sau hứa rằng «số tin đơn người mới với tới tăng». Nhưng `donMoi += rows.filter((x) => !x.double_label).length` (dòng 379) chỉ đếm hết tin đơn trong tập `conDuoc` do chính probe viết, xếp theo ORDER BY cũ chép tay ở dòng 371. `donCu` (dòng 380-381) là phần đầu của cùng dãy đó, cắt trước tin hai người đầu tiên. Không biến nào dùng `ke`, tức đầu ra của tinKe thật. Vì vậy `donMoi > donCu` (dòng 390) đúng khi và chỉ khi trong thứ tự cũ chép tay có một tin hai người chưa ai gắn đứng trước tin đơn. Đó cũng chính là điều kiện `ketCu > 0` của người MOI. Nếu tinKe mới xếp sai, chỉ số này vẫn tăng như cũ. Phần đầu ra thật duy nhất được kiểm là `ketMoi`, và nó chỉ xét tin đầu tiên tinKe trả cho mỗi cặp người–nhóm. Thêm nữa, đối chứng «thứ tự cũ» (dòng 371) là bản chép lại ORDER BY cũ, không chạy mã cũ thật.
  rationale: AC-4 đòi đối chứng «số thẻ đơn người mới với tới trước khi chạm thẻ hai người tăng» đo trên lát thật, mà phép đo này không lấy gì từ đầu ra thật của tinKe nên không chứng minh được vế đó.

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **Giờ đăng của thẻ ghép lệch giữa lượt gắn (tinKe) và màn lượt hai (luot-hai)**
  Người dùng thấy gì: Với một số tin gộp, giờ đăng hiện ở màn gắn nhãn lượt một khác giờ hiện ở màn lượt hai. Người gắn dùng giờ để tìm lại bài trong nhóm nên có thể nhầm bài.
  Căn cứ: Chỉ lệch một dòng chữ phụ ở một số tin gộp, không mất hay sai dữ liệu đã lưu, người gắn đối chiếu lại được; sửa riêng ở màn lượt hai rẻ nhưng thuộc việc khác.
  file: `app/src/lib/labels-luot-hai.ts`
  severity: low
  Đề xuất: known-limits

- **tinKe nhận client tiêm `q` nhưng che tên nguồn lại đi qua pool toàn cục**
  Người dùng thấy gì: Khi chạy kiểm thử hoặc đo thử trên cơ sở dữ liệu khác với bản chính, tên người đăng có thể bị che sai hoặc để trống mà không ai hay. Trên bản chạy thật hai nơi đọc cùng một cơ sở dữ liệu nên người dùng không thấy khác biệt.
  Căn cứ: Chỉ ảnh hưởng môi trường thử, bản chạy thật không lộ tên nguồn vì bộ che vẫn đóng chặt; không mất dữ liệu và sửa sau cũng không đắt.
  file: `app/src/lib/labels-queries.ts`
  severity: low
  Đề xuất: known-limits

- **Hình dạng 4 (âm tính một mình): các chiều đỏ chỉ dùng notDeepEqual/notEqual, không ghim giá trị sai mong đợi**
  Người dùng thấy gì: Một số phép kiểm thử chỉ xác nhận kết quả sai là «khác kết quả đúng» chứ không chỉ rõ sai thế nào. Nếu sau này có lỗi, bộ kiểm thử vẫn đỏ nhưng có thể đỏ vì lý do không đúng ý.
  Căn cứ: Không ảnh hưởng người dùng cuối hay dữ liệu, chỉ làm bộ kiểm thử kém sắc; bổ sung giá trị mong đợi sau vẫn rẻ.
  file: `app/tests/labels-nhom.test.tsx`
  severity: low
  Đề xuất: known-limits

## Chưa adversarial-verify (refuter chết)

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).
