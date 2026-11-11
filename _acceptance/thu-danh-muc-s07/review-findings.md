# Review findings: thu-danh-muc-s07 (round 1)

## Trong hợp đồng

- **Thẻ danh sách: giá/m² bị ghi vào land_area_raw khi thẻ không có ô diện tích hoặc ô giá đứng trước**
  AC: AC-2
  file: `pipeline/lib/s07-danh-muc.mjs:137`
  severity: high
  source: bugs
  detail: Trong bocTheDanhSach, mọi span `re__prj-card-config-value` không có aria-label đều được coi là diện tích: `else if (!nhan && dienTich == null) dienTich = chu(m[2])`. Trên raw thật, ô giá («36 triệu/m²») cũng không có aria-label. Thẻ nào không có ô diện tích, hoặc có ô giá đứng trước ô diện tích, sẽ ghi giá vào stg_s07_project_card.land_area_raw mà không báo gì. Chạy dongCuaSnapshot trên toàn bộ snapshot S07 trên máy: 1207/5650 thẻ (21%) có land_area_raw là giá/m², ví dụ '36 triệu/m²', '6 triệu/m²', '38 triệu/m²'. Cột diện tích bị nhiễm dữ liệu giá trên diện rộng. Giá cũng là dữ liệu chỉ dùng nội bộ (ROADMAP §3 mục 27) nhưng ở đây nằm trong một cột không có chú thích 'chỉ nội bộ'. Test và thước AC-9 không bắt được vì chỉ đếm dòng. Cách sửa: nhận diện ô diện tích theo đơn vị (ha|m²), còn ô giá (triệu|tỷ.../m²) thì bỏ qua hoặc ghi vào cột riêng.
  rationale: AC-2 đòi cột diện tích nguyên văn của thẻ chứa diện tích và thẻ thiếu cấu hình phải NULL, không đoán; 21% thẻ thật lại chứa giá/m² ở cột diện tích.

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **Rào tầng A kiemKhongMien cho qua khi không suy được tên miền**
  Người dùng thấy gì: Nếu một lượt thu lạ không cho biết tên miền nguồn thì tên miền đứng trần có thể lọt vào kho dữ liệu ở máy thu mà không bị chặn. Dữ liệu này chỉ nằm ở máy thu, chưa lên cổng nào.
  Căn cứ: Hậu quả nhẹ vì dữ liệu chỉ ở máy thu và các snapshot hiện có đều đã qua kiểm, nhưng cần ghi lại để lượt thu mới biết mà soát.
  file: `pipeline/import-s07-danh-muc.mjs`
  severity: low
  Đề xuất: known-limits

- **soNguyenVn trả số sai cho chuỗi có phần thập phân, trái với chú thích «có phần lẻ → null»**
  Người dùng thấy gì: Nếu một dự án sau này ghi số căn hoặc số toà có phần lẻ, hệ thống sẽ lưu số bị cắt thay vì để trống. Hiện chưa dự án nào bị ảnh hưởng.
  Căn cứ: Chưa có dòng sai nào trong dữ liệu thật, và nếu xảy ra thì nạp lại sau khi sửa là khắc phục được, nên nhẹ.
  file: `pipeline/lib/s07-danh-muc.mjs`
  severity: low
  Đề xuất: known-limits

- **Hình dạng 4 (assertion âm tính, thông điệp không ghim lý do): hai ca «bỏ qua» của S07-AC-8 chỉ khớp chữ chung /bỏ qua/**
  Người dùng thấy gì: Bài kiểm tự động có thể vẫn báo xanh dù thư mục bị bỏ vì lý do khác dự kiến. Người dùng không thấy ảnh hưởng nào trực tiếp.
  Căn cứ: Không ảnh hưởng dữ liệu hay người dùng, chỉ làm bài kiểm kém chặt; chi phí sửa không đáng so với hậu quả.
  file: `pipeline/scripts/s07-danh-muc-db.test.mjs`
  severity: low
  Đề xuất: wont-fix

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).
