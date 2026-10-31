## Trong hợp đồng

- **Hình dạng 5 (tuyên quét LỚP nhưng chỉ có điểm-case): ma trận CV-AC-1 thiếu phần tử «5 nét» mà contract liệt kê**
  file: `pipeline/scripts/transform-zalo-loai-tin.test.mjs:276`
  severity: medium
  AC: AC-1
  source: measurement
  detail: contract.md nêu lớp ở AC-1 là «<số> + chữ có dấu bắt đầu bằng n» («1 năm», «3 nữ», «5 nét»). Trục A cũng ghi phần tử «chữ có dấu (năm, nữ, nét)». Nhưng mảng NAM_NU (dòng 276–281) và expected của E1 trong evals.yaml chỉ có 4 ô, đều thuộc hai từ «năm» và «nữ». Phần tử «nét» (n + nguyên âm é) không có ô nào. Số assert vì thế không khớp số phần tử đã liệt kê trước: test và eval tuyên bố bao cả lớp chữ có dấu sau «<số>n», trong khi chỉ đo hai điểm-case.
  rationale: AC-1 và Trục A của Coverage đều nêu đích danh «5 nét» là phần tử của lớp chữ có dấu, nhưng ma trận test chỉ phủ «năm» và «nữ», nên AC-1 chưa được chứng minh cho phần tử này.

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

## Chưa adversarial-verify (refuter chết)

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).
