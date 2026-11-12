# Review findings: truong-du-an-tren-tin (round 1)

## Trong hợp đồng

(không có)

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **canonical.fields.area_id: dd null nhưng thiếu rationale, và ghi sai «chưa dựng cột trên tin» trong khi sale_offers.area_id đã có từ 008**
  Người dùng thấy gì: Sổ từ vựng mô tả sai về trường phường trên tin, nên người đọc sau có thể hiểu nhầm nguồn nào là đúng khi hai bên lệch nhau. Người dùng cuối không thấy gì khác trên cổng.
  Căn cứ: Chỉ là lời giải thích trong sổ nội bộ, không làm mất hay sai dữ liệu của người dùng, và sửa lại sau rất rẻ.
  file: `pipeline/mappings.yaml`
  severity: medium
  Đề xuất: known-limits

- **TDT-AC-4 calls `docker exec one-invest-db` and will fail in the CI pipeline job**
  Người dùng thấy gì: Một ca kiểm tự động có thể báo đỏ trên máy chủ kiểm tra của GitHub dù tính năng chạy đúng, làm chậm việc gộp thay đổi. Người dùng cuối không bị ảnh hưởng.
  Căn cứ: Không ảnh hưởng dữ liệu hay cổng người dùng, chỉ làm vòng kiểm tự động đỏ giả, và có thể sửa hoặc cho bỏ qua ca này sau mà không mất gì.
  file: `pipeline/scripts/truong-du-an-tren-tin.test.mjs`
  severity: medium
  Đề xuất: known-limits

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).
