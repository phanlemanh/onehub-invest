# Review findings: aer-ac2-so-cap-co-dinh (round 1)

## Trong hợp đồng

Không có finding nào map được vào AC.

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **Ô E2 đã ký của auth-error-thu-lai-retry vẫn mô tả phép so merge-base mà test không còn làm, và không có superseded_by**
  Người dùng thấy gì: Hồ sơ nghiệm thu đã ký trước đó vẫn mô tả cách kiểm cũ, nên người đọc sau này có thể tin rằng cách kiểm cũ còn được dùng. Người dùng cuối của app không bị ảnh hưởng, chỉ sổ sách nghiệm thu bị lệch.
  Căn cứ: Không có tác động đến người dùng cuối và không mất dữ liệu; chỉ làm hồ sơ kiểm tra nội bộ lệch, và việc đánh dấu lại rẻ nhưng cần một hồ sơ riêng vì hợp đồng này đã loại trừ việc đụng vào hồ sơ đó.
  file: `_acceptance/auth-error-thu-lai-retry/evals.yaml`
  severity: medium
  Đề xuất: new-contract

- **Khối try/catch quanh soCapCoDinh bắt cả lỗi logic rồi biến chúng thành 'skip', nên ca AC-2 có thể xanh lặng**
  Người dùng thấy gì: Nếu công cụ đọc cấu hình bị lỗi, bước kiểm tra có thể báo là bỏ qua và vẫn xanh, kèm lý do sai. Khi đó một thay đổi làm đổi nghĩa lệnh có thể lọt qua mà không ai biết.
  Căn cứ: Chỉ xảy ra khi công cụ đọc cấu hình tự hỏng, hiếm gặp, và không làm mất hay lộ dữ liệu của người dùng; hậu quả là một lần kiểm tra xanh giả, sửa sau vẫn rẻ.
  file: `scripts/auth-error-thu-lai-retry.test.mjs`
  severity: medium
  Đề xuất: known-limits

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).
