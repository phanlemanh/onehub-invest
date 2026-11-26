# Review findings: soat-noi-s08-danh-ba (round 1)

## Trong hợp đồng

- **Hình dạng 4 (assertion âm tính một mình): «nút ứng viên S08 có 0 tin, 0 hạng giá» không bao giờ đỏ được**
  file: `pipeline/scripts/noi-du-an-s08-that.mjs:105`
  severity: medium
  AC: AC-7
  source: measurement
  detail: Ô `o("nut_ung_vien_khong_tin_khong_hang", g, { tin: 0, hang: 0 })` đếm offer_project / offer_price_rank trỏ vào nút có meta.nguon='S08' ngay sau apTheLuat. Giữa lúc áp và lúc đếm không có bước nào dựng lại offer_project hay offer_price_rank (apTheLuat, noi-du-an-s08-lop.mjs không chạm hai bảng này, grep không thấy). Các nút này vừa được đúc trong cùng lượt, nên số 0 đúng theo cách dựng, không phụ thuộc gì vào việc nút ứng viên có bị loại khỏi gắn tin và xếp hạng giá hay không. Ô này cũng không có đối chứng dương: không chạy bộ gắn tin hay bộ xếp hạng sau khi áp để chứng minh phép đếm có thể khác 0. Vì vậy AC-7 «nút ứng viên S08 có 0 tin gắn và 0 hạng giá cấp dự án» được tính là đạt bằng một thước chết.
  rationale: AC-7 đòi đo nút ứng viên S08 có 0 tin gắn và 0 hạng giá; phép đo này không thể đỏ nên điều kiện của AC-7 chưa được chứng minh thật.

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **RS8 làm đỏ suite app ở máy: before() đòi DB tên oneinvest_suite_rs8 trong khi npm test của app cấp oneinvest_suite_app_<pid>**
  Người dùng thấy gì: Khi chạy bộ kiểm của ứng dụng trên máy thu hoặc M5, có thêm một ca báo đỏ dù tính năng không hỏng. Trên hệ thống kiểm tự động thì ca này được bỏ qua nên không ai thấy.
  Căn cứ: Không ảnh hưởng dữ liệu hay người dùng cuối, chỉ gây báo đỏ giả cho người vận hành; sửa sau rẻ và tách được thành việc nhỏ riêng.
  file: `app/tests/registry-s08-luat.test.tsx`
  severity: high
  Đề xuất: new-contract

- **A later apply run creates a second candidate node for a group that the S08 rule already cast**
  Người dùng thấy gì: Nếu sau này thêm một dự án S08 cùng tên gốc với dự án đã có nút, danh bạ có thể tạo thêm một nút thứ hai cùng tên thay vì gộp vào nút cũ. Hai dự án cùng nhóm khi đó nằm ở hai nút riêng.
  Căn cứ: Chỉ sinh nút ứng viên dư, không mất hay lộ dữ liệu và đảo được theo mã lượt; hôm nay chưa có ca thật nên chấp nhận và ghi lại là đủ.
  file: `pipeline/lib/noi-du-an-s08-lop.mjs`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 3 (đo chuỗi có mặt trong khi lời hứa là quan hệ): tổng theo ngả in trên thẻ không được so với bộ xếp**
  Người dùng thấy gì: Bảng tổng ở đầu thẻ duyệt có thể in sai số mà bài kiểm vẫn xanh. Người duyệt có thể thấy con số tổng không khớp với danh sách bên dưới.
  Căn cứ: Danh sách từng dòng vẫn đúng và số ngả đã được đối chiếu trên dữ liệu thật ở bước đo cuối, nên rủi ro chỉ là hiển thị tổng sai, người duyệt tự phát hiện được.
  file: `pipeline/scripts/noi-du-an-s08-luat.itest.mjs`
  severity: medium
  Đề xuất: known-limits

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).
