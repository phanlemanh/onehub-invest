## Trong hợp đồng

Không có finding.

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **E3/AC-3 không tự dựng điều kiện «worktree không có .env» nên bằng chứng có thể rỗng nghĩa (r1)**
  Người dùng thấy gì: Khi chạy kiểm ở máy có sẵn tệp cấu hình, kết quả xanh của bộ test không chứng minh riêng cho tình huống thiếu tệp đó. Bước đọc gộp ban đêm vẫn chạy đúng, chỉ có lời khẳng định trong hồ sơ nghiệm thu hơi rộng hơn phép đo.
  Căn cứ: Không ảnh hưởng người dùng và không mất dữ liệu; tình huống thiếu tệp đã có phép đo riêng ở tiêu chí khác, nên ghi lại hạn chế này là đủ và sửa sau rất rẻ.
  file: `_acceptance/doc-gop-env-rong/evals.yaml`
  severity: low
  Đề xuất: known-limits

## Chưa adversarial-verify (refuter chết)

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).
