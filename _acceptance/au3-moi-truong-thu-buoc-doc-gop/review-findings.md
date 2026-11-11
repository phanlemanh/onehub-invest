# Review findings: au3-moi-truong-thu-buoc-doc-gop (round 1)

## Trong hợp đồng

Không có finding nào.

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **E1 mô tả sai chiều đỏ: chỉ một dòng MOI TRUONG DU BUOC có «(được 127)», không phải hai**
  Người dùng thấy gì: Phép đo vẫn báo đúng hai ca đỏ khi thiếu bước đọc gộp. Chỉ có câu mô tả trong hồ sơ nghiệm thu ghi sai chi tiết một dòng báo lỗi, người đối chiếu theo đúng chữ có thể thấy lệch nhẹ.
  Căn cứ: Hậu quả nhẹ: không mất hay lộ dữ liệu, kết quả đo vẫn đúng, chỉ là câu mô tả lệch chữ, và sửa lại sau rất rẻ khi hồ sơ được mở lại.
  file: `_acceptance/au3-moi-truong-thu-buoc-doc-gop/evals.yaml`
  severity: low
  Đề xuất: known-limits

## Chưa adversarial-verify (refuter chết)

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).
