## Trong hợp đồng

Không có finding nào map được vào AC.

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **E1/AC-1 nói đúng hai khoá, nhưng ca TA-AC-1 lại ghim ba khoá**
  Người dùng thấy gì: Hồ sơ nghiệm thu mô tả cây thử ít hơn thực tế một tệp, nên người đọc đối chiếu chữ có thể thấy lệch. Bộ kiểm sổ API vẫn chạy đúng, người dùng cuối không bị ảnh hưởng.
  Căn cứ: Chỉ là chênh lệch câu chữ trong hồ sơ, không làm mất dữ liệu hay đổi hành vi, và sửa lại sau rất rẻ.
  file: `_acceptance/qv-ac-9-khong-chap-chon/evals.yaml`
  severity: medium
  Đề xuất: known-limits

- **E1 expected ghi 'đúng hai khoá' nhưng test TA-AC-1 ghim ba khoá**
  Người dùng thấy gì: Hồ sơ nghiệm thu ghi số tệp không khớp với phép đo thật, dễ làm người rà soát tưởng có lỗi. Không ảnh hưởng người dùng cuối.
  Căn cứ: Chỉ sai lệch chữ trong tài liệu, không gây mất hay lộ dữ liệu, và sửa sau rất rẻ.
  file: `_acceptance/qv-ac-9-khong-chap-chon/evals.yaml`
  severity: low
  Đề xuất: known-limits

- **demQvMutThat nuốt mọi lỗi, không riêng ENOENT, nên phép kiểm 'cây thật sạch' có thể đạt mà không đo gì**
  Người dùng thấy gì: Trong trường hợp hiếm thư mục không đọc được, phép kiểm cây thật sạch có thể báo xanh dù chưa đo gì. Người dùng cuối không bị ảnh hưởng, chỉ giảm độ tin cậy của bài kiểm.
  Căn cứ: Hậu quả nhẹ, chỉ nằm trong bài kiểm nội bộ và chạy lại là thấy; không mất dữ liệu.
  file: `app/tests/api-surface-tep-an.test.tsx`
  severity: low
  Đề xuất: known-limits

- **Hình dạng 4 (assertion chỉ có chiều âm): phép kiểm «tệp sinh-xoá lọt vào cây thật» không có đối chứng dương, và nuốt mọi lỗi khiến số 0 thành kết quả mặc định**
  Người dùng thấy gì: Bài kiểm có thể báo cây thật sạch mà thật ra không đọc được cây. Người dùng cuối không thấy gì, chỉ làm bài kiểm kém nhạy hơn.
  Căn cứ: Rủi ro thấp và chỉ nằm ở bài kiểm nội bộ, không mất hay lộ dữ liệu; thêm đối chứng sau này cũng rẻ.
  file: `app/tests/api-surface-tep-an.test.tsx`
  severity: low
  Đề xuất: known-limits

⚠ Cụm ngoài vùng phủ: 2/4 lỗi rơi vào file không bộ đo nào phủ (_acceptance/qv-ac-9-khong-chap-chon/evals.yaml) — dừng và quyết: mở rộng hợp đồng hay rút phạm vi.
