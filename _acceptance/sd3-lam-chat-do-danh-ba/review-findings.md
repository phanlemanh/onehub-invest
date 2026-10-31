# Review findings: sd3-lam-chat-do-danh-ba (round 1)

## Trong hợp đồng

Không có finding nào map được vào AC.

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **Assert 'MO COI KHONG DEM' ở E5 luôn đúng theo cách dựng tập, không bao giờ đỏ được**
  Người dùng thấy gì: Một dòng kiểm phụ trong bước chuyển danh bạ luôn báo qua, nên không bắt thêm được trường hợp người bị mất âm thầm. Các phép so chính theo hợp đồng vẫn chạy.
  Căn cứ: Hậu quả nhẹ: chỉ là một lớp kiểm phụ thừa không có tác dụng, các phép so chính vẫn còn và probe chỉ chạy trên DB thử, không ảnh hưởng dữ liệu thật.
  file: `_acceptance/sd3-lam-chat-do-danh-ba/probes/chuyen.mjs`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 3: assert «MO COI KHONG DEM» là đẳng thức luôn đúng, không đo được quan hệ người trước = khớp + mồ côi**
  Người dùng thấy gì: Một phép kiểm phụ về số người mồ côi không bao giờ báo đỏ, nên không cho thêm sự bảo đảm nào ngoài các phép so chính.
  Căn cứ: Hậu quả nhẹ, không làm mất hay lộ dữ liệu, chỉ chạy trên bản chép thử; ghi lại là hạn chế đã biết là đủ vì các phép so chính vẫn đứng.
  file: `_acceptance/sd3-lam-chat-do-danh-ba/probes/chuyen.mjs`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 4: đối chứng dương «trước 060 n6 không đạt» rỗng được khi không có nguồn nào**
  Người dùng thấy gì: Nếu bản chép thử thiếu dữ liệu nguồn, bước kiểm đối chứng có thể bị bỏ qua mà vẫn báo ổn, nên phép đo ít được thử hơn tưởng.
  Căn cứ: Hậu quả nhẹ và chỉ xảy ra khi DB thử bị chép thiếu; người chạy dễ phát hiện bằng cách chạy lại, sửa sau cũng rẻ nhưng không ảnh hưởng người dùng.
  file: `_acceptance/sd3-lam-chat-do-danh-ba/probes/chuyen.mjs`
  severity: low
  Đề xuất: known-limits

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).
