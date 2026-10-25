# Review findings: importer-bo-qua-du-lieu-thu (round 3)

## Trong hợp đồng

(không có finding nào map được vào AC — 12/12 eval đạt)

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa.

- **Danh sách nguồn được phép của importer chung sẽ chặn lặng lẽ dữ liệu S08 khi nhánh S08 vào main**
  Người dùng thấy gì: Sau khi gộp nhánh S08, bảng danh mục căn S08 trống mà không job nào báo lỗi, vì S08 nạp qua cùng importer và nguồn của nó chưa có trong danh sách.
  Căn cứ: Hôm nay main chưa có S08 nên chưa ai bị ảnh hưởng; sửa đúng chỗ là trên nhánh S08 khi rebase (đã báo ZCode, BÁO claudedp-2510-12), và nghiệm thu S08 sẽ có ca kiểm riêng.
  file: `pipeline/import-airbnb.mjs`
  severity: medium
  Đề xuất: new-contract

- **Importer đòi tên snapshot đúng ba phần, chặt hơn job nạp hằng đêm**
  Người dùng thấy gì: Chỉ khi có thư mục tên bốn phần trở lên, job nạp coi là hợp lệ nhưng importer bỏ qua, nên snapshot đó không vào kho.
  Căn cứ: Mọi thư mục trên máy (2.183) đều đúng ba phần và collector chỉ đặt tên ba phần; ghi lại là đủ.
  file: `pipeline/import-airbnb.mjs`
  severity: low
  Đề xuất: known-limits

- **Job Chợ Tốt vẫn chọn snapshot mới nhất theo tên mà không lọc khuôn tên**
  Người dùng thấy gì: Nếu có người để thư mục thử trong kho snapshot Chợ Tốt, đêm đó job chọn nhầm thư mục thử, bị bỏ qua, và snapshot thật mới nhất không được nạp.
  Căn cứ: Trùng với hạn chế đã ghi ở AU3; chỉ xảy ra khi có thư mục rác do người tạo, hiện không có.
  file: `scripts/chotot-daily.sh`
  severity: low
  Đề xuất: known-limits
