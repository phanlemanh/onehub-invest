# Review findings: slo-mot-nguon (round 1)

## Trong hợp đồng

Không có finding nào map được vào AC.

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **Lưới nguồn của Thu thập không có tab cho hai trạng thái mới «Chưa có dữ liệu» / «Chưa khai SLO»**
  Người dùng thấy gì: Trên trang Thu thập, nguồn «Chưa có dữ liệu» hoặc «Chưa khai SLO» vẫn hiện đúng nhãn nhưng không có tab riêng để lọc. Người vận hành phải mở tab «Tất cả» rồi tự tìm.
  Căn cứ: Nhẹ: không mất dữ liệu và nhãn vẫn hiện đúng, chỉ bất tiện khi lọc; tab «Tất cả» vẫn thấy đủ nên ghi lại rồi sửa khi tiện.
  file: `app/src/components/ops/collections/feeds-grid.tsx`
  severity: low
  Đề xuất: known-limits

- **Lane app_ui (cd app && npm test) giờ cần DB local :5433, mà test bỏ qua DATABASE_URL**
  Người dùng thấy gì: Người chạy bộ kiểm của app trên máy không có cơ sở dữ liệu local sẽ thấy một ca đỏ dù code không hỏng. Ngoài ra địa chỉ DB bị ghi cứng nên đổi cấu hình kết nối sẽ không có tác dụng với ca này.
  Căn cứ: Nhẹ với người dùng cuối vì chỉ ảnh hưởng người vận hành chạy kiểm, không ảnh hưởng sản phẩm; báo đỏ giả dễ nhận ra và sửa sau rẻ.
  file: `app/tests/slo-mot-nguon.test.tsx`
  severity: low
  Đề xuất: known-limits

- **fmtAge làm tròn xuống theo ngày nên nguồn đã quá hạn vẫn hiện tuổi bằng đúng SLO («8 ngày / SLO 8 ngày»)**
  Người dùng thấy gì: Một nguồn đã bị gắn «Trễ SLO» có thể hiện «8 ngày / SLO 8 ngày», tức tuổi trông bằng hạn. Người vận hành không biết nguồn đã trễ bao lâu và có thể nghi nhãn báo sai.
  Căn cứ: Mức vừa: không mất dữ liệu và nhãn trễ vẫn đúng, nhưng gây hiểu nhầm đúng ở chỗ người vận hành cần quyết định thu lại; đây là thay đổi cách hiển thị riêng nên đáng làm vòng sau.
  file: `app/src/lib/freshness.ts`
  severity: medium
  Đề xuất: new-contract

- **Hình dạng 3 (assert «chuỗi có mặt» thay cho quan hệ/vị trí): SL-AC-6 ở /ops đỗ nhờ dòng SLO của ô KPI, không cần lưới /ops**
  Người dùng thấy gì: Bộ kiểm chưa chứng minh được cột tuổi/SLO của lưới trang tổng quan dùng cùng cách ghi giờ/ngày. Nếu sau này ai đó đổi lại cột đó, bộ kiểm vẫn có thể báo xanh.
  Căn cứ: Nhẹ hiện tại vì sản phẩm đang hiển thị đúng; rủi ro chỉ là lần sửa sau không bị bắt, và việc siết phép kiểm có thể làm sau rẻ.
  file: `app/tests/slo-mot-nguon.test.tsx`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 2 (fixture viết tay đúng khuôn bên đọc): SL-AC-4 chép lại hai bộ chuyển ngay trong test thay vì gọi bộ chuyển thật**
  Người dùng thấy gì: Bộ kiểm chưa chắc bắt được trường hợp hai trang lệch số «x/y nguồn đạt SLO» nếu cách tính ở trang thật bị đổi sau này. Hiện tại hai trang vẫn hiện cùng số.
  Căn cứ: Rủi ro nằm ở tương lai chứ không phải lỗi hiện có; người dùng không thấy gì sai bây giờ và có thể siết phép kiểm sau.
  file: `app/tests/slo-mot-nguon.test.tsx`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 5 (tuyên ma trận nhưng thiếu phần tử): ca «S04 completed» của SL-AC-4 trùng hệt ca «mọi nguồn tươi»**
  Người dùng thấy gì: Một ca kiểm tên là «nguồn đã hoàn tất không được tính» thực chất không kiểm thêm điều gì. Người dùng không thấy khác biệt nào ở sản phẩm.
  Căn cứ: Rất nhẹ: chỉ là ca kiểm thừa, hành vi liên quan đã được ca khác che phủ ở mức đủ dùng, sửa tốn công mà ít lợi.
  file: `app/tests/slo-mot-nguon.test.tsx`
  severity: low
  Đề xuất: wont-fix

- **Hình dạng 4 (assert âm tính một mình): `lastRunAt`/`items24h` chỉ bị ghim ở giá trị rỗng [null, 0]**
  Người dùng thấy gì: Bộ kiểm chưa chứng minh được thời điểm chạy gần nhất và số tin 24 giờ của mỗi nguồn vẫn hiện đúng khi nguồn có dữ liệu. Nếu hai số này luôn hiện rỗng, bộ kiểm vẫn báo xanh.
  Căn cứ: Mức nhẹ đến vừa: hai số này là thông tin phụ nên nếu sai thì lộ nhanh khi nhìn trang; ghi lại và bổ sung ca đối chứng ở vòng sau.
  file: `app/tests/slo-mot-nguon.test.tsx`
  severity: low
  Đề xuất: known-limits

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).
