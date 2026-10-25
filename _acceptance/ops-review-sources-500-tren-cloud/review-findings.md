# Review findings: ops-review-sources-500-tren-cloud (round 1)

## Trong hợp đồng

(không có)

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **Chặn sớm theo source_registry làm mất luôn chế độ cloud chỉ-đọc của ZaloAccounts. Phần này vốn làm riêng cho cloud và không đọc bảng tầng A**
  Người dùng thấy gì: Trên bản cloud, trang Nguồn dữ liệu chỉ còn một thông báo «chỉ quản trị ở máy local», không còn khung danh sách tài khoản Zalo chỉ-đọc. Trước đây trang này trên cloud bị lỗi 500 nên khung đó cũng chưa từng hiện ra được.
  Căn cứ: Nhẹ: không ai mất thứ đang dùng được vì trang trước đó lỗi hoàn toàn trên cloud, và máy local vẫn xem đủ; muốn hiện lại khung Zalo trên cloud thì làm sau, không gấp.
  file: `app/src/components/ops/sources/sources-content.tsx`
  severity: medium
  Đề xuất: known-limits

- **Nhánh dừng sớm của /ops/sources trên cloud bỏ luôn khung tài khoản Zalo vốn làm riêng cho cloud; isCloud và CloudAccounts thành code chết**
  Người dùng thấy gì: Trang Nguồn dữ liệu trên cloud không còn hiện khung tài khoản Zalo và thông báo cũng không nhắc tới việc này, nên người xem không biết khung đó đã vắng. Máy local không bị ảnh hưởng.
  Căn cứ: Nhẹ: chỉ thiếu một khung phụ trên trang vốn đang lỗi, không mất dữ liệu, và có thể bổ sung sau với chi phí nhỏ.
  file: `app/src/components/ops/sources/sources-content.tsx`
  severity: medium
  Đề xuất: known-limits

- **catch {} rỗng quanh truy vấn source_groups giờ chỉ còn chạy ở local và nuốt mọi lỗi thật**
  Người dùng thấy gì: Ở máy local, nếu việc đọc danh sách nhóm thu gặp lỗi thật, trang sẽ hiện «0 nhóm thu» như thể chưa cấu hình gì, thay vì báo lỗi. Người vận hành có thể tưởng nhóm thu đã mất.
  Căn cứ: Nhẹ đến vừa: không mất dữ liệu gốc và chỉ xảy ra khi có sự cố hạ tầng ở máy local, tải lại hoặc kiểm tra DB là thấy lại; hành vi này đã có từ trước, không phải do bản vá.
  file: `app/src/components/ops/sources/sources-content.tsx`
  severity: low
  Đề xuất: known-limits

- **Hình dạng 5: AC-3 nói quét cả lớp «toàn bộ test app/scripts sẵn có vẫn xanh», nhưng E3 chỉ chạy một phần**
  Người dùng thấy gì: Bằng chứng nghiệm thu chỉ chạy bộ kiểm giao diện, không chạy năm bộ kiểm của các script vận hành. Người dùng không thấy khác biệt nào ở sản phẩm.
  Căn cứ: Rất nhẹ: các script đó không dính tới hai trang vừa sửa nên khả năng hỏng gần như không có, và chạy lại bộ kiểm bất cứ lúc nào cũng rẻ.
  file: `_acceptance/ops-review-sources-500-tren-cloud/evals.yaml`
  severity: low
  Đề xuất: wont-fix

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).
