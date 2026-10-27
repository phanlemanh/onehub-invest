## Trong hợp đồng

Không có finding nào map được vào AC.

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **selftest baseline-guard thu hẹp phép kiểm «cây làm việc không đổi» (bỏ _acceptance/) của E7 đã ký, nhưng hợp đồng lại nói E7 giữ nguyên**
  Người dùng thấy gì: Bước kiểm tra chất lượng giao diện nay bỏ qua các thay đổi trong thư mục hồ sơ nghiệm thu khi xét «không có gì bị sửa». Người dùng cuối không bị ảnh hưởng gì; chỉ là một chỗ nới nhỏ của kiểm tra nội bộ chưa được nêu trong hợp đồng.
  Căn cứ: Hậu quả gần như bằng không với người dùng vì kiểm tra này không ghi gì vào thư mục hồ sơ; chỉ cần ghi chú cho người ký biết, sửa sau rất rẻ.
  file: `app/eslint-plugin-onehub-ui/selftest.mjs`
  severity: low
  Đề xuất: known-limits

- **Hình dạng 5, tuyên quét LỚP nhưng chỉ có điểm-case: MAU_VI_PHAM nói phủ «mỗi luật có thể nằm trong baseline» nhưng chỉ có 4/8 luật, và mỗi lượt chạy chỉ thử một mẫu**
  Người dùng thấy gì: Bộ kiểm tra chặn việc thêm lỗi giao diện mới chỉ thử một loại lỗi mỗi lần chạy và mới có mẫu cho một nửa số luật. Nếu có sai sót thì kiểm tra báo đỏ nhầm chứ không bỏ lọt lỗi, nên người dùng không thấy ảnh hưởng.
  Căn cứ: Nếu hỏng thì chỉ báo đỏ giả cho người làm, không làm lọt lỗi ra người dùng và không mất dữ liệu; bổ sung thêm mẫu sau này rẻ.
  file: `app/eslint-plugin-onehub-ui/selftest.mjs`
  severity: low
  Đề xuất: known-limits

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).
