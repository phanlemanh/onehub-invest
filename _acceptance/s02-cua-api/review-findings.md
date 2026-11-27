## Trong hợp đồng

Không có finding nào map được vào AC.

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **Bảng Collectors trong collector/CLAUDE.md vẫn ghi airdna-research 0.3 req/s, mã đã hạ xuống 0.2**
  Người dùng thấy gì: Tài liệu hướng dẫn thu S02 còn ghi nhịp cũ nhanh hơn thực tế. Bộ thu vẫn chạy đúng nhịp chậm hơn, chỉ người đọc tài liệu có thể hiểu sai.
  Căn cứ: Chỉ lệch chữ trong tài liệu, không ảnh hưởng dữ liệu hay lượt thu, và sửa lại bất cứ lúc nào chỉ là một dòng.
  file: `collector/CLAUDE.md`
  severity: low
  Đề xuất: known-limits

- **collector/CLAUDE.md mục 5 nói 403 luôn thành «BỊ CHẶN [S02]», trái với hợp đồng và mã ở cửa xác thực**
  Người dùng thấy gì: Tài liệu vận hành nói mọi lỗi 403 đều là bị chặn, nhưng ở bước đăng nhập nó lại hiện là lỗi đăng nhập. Người vận hành có thể hiểu nhầm nên đăng nhập lại hay dừng S02.
  Căn cứ: Hậu quả nhẹ vì chỉ gây hiểu nhầm khi đọc log, không mất dữ liệu, và sửa tài liệu sau vẫn rẻ.
  file: `collector/CLAUDE.md`
  severity: low
  Đề xuất: known-limits

- **Hình dạng 1/3: AC-7 đo literal trong mã nguồn, không đo dòng AUTH FAIL thật sự được in; một trong hai chỗ in không được kiểm định dạng**
  Người dùng thấy gì: Nếu ai đó đổi dạng dòng báo lỗi đăng nhập ở một đường, bộ kiểm vẫn xanh. Thước đo độ tươi có thể đọc sai dòng này mà không ai biết ngay.
  Căn cứ: Rủi ro chỉ xảy ra khi có người sửa đúng dòng đó, và sẽ lộ ở lượt đêm đầu tiên nên không mất dữ liệu.
  file: `_acceptance/s02-cua-api/probes/khong-trinh-duyet.sh`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 3: AC-13 hứa «không còn lời fetch nào SAU lời bị chặn» nhưng chỉ đếm số lời dữ liệu**
  Người dùng thấy gì: Phép kiểm chưa chứng minh chặt rằng sau khi bị nguồn chặn, bộ thu không gửi thêm lời xin token nào. Nếu có lời thừa, nguồn có thể bị gọi nhiều hơn mức cần.
  Căn cứ: Mã hiện dừng đúng khi bị chặn theo các ca đã đo, nên rủi ro thấp và chỉ là phép kiểm chưa kín.
  file: `_acceptance/s02-cua-api/probes/dung-ca-luot.mjs`
  severity: low
  Đề xuất: known-limits

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).
