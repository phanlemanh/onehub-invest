## Trong hợp đồng

Không có.

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **kiemMapFiles chỉ báo phần «thừa»: khi eslint thiếu một tệp, thông điệp in «thừa []»**
  Người dùng thấy gì: Khi có người bỏ bớt một tệp bản đồ khỏi danh sách, phép kiểm vẫn báo lỗi đúng nhưng dòng giải thích lại ghi như thể không có gì thừa. Người sửa phải tự so hai danh sách để tìm ra tệp nào bị mất.
  Căn cứ: Chỉ ảnh hưởng người làm tool nội bộ, không mất dữ liệu hay chặn sai; phép kiểm vẫn đỏ đúng nên lỗi không bị lọt, chỉ tốn thêm vài phút tìm nguyên nhân.
  file: `app/tests/listings-browse.test.tsx`
  severity: low
  Đề xuất: known-limits

- **kiemMapFiles chỉ báo phần 'thừa' nên khi thiếu tệp hoặc sai thứ tự, thông báo lỗi ra 'thừa []' gây hiểu lầm**
  Người dùng thấy gì: Khi danh sách tệp bản đồ bị thiếu hoặc đảo thứ tự, phép kiểm báo lỗi nhưng dòng giải thích ghi «thừa» rỗng nên gây hiểu lầm. Người sửa phải tự đối chiếu để biết lệch ở đâu.
  Căn cứ: Hậu quả nhẹ và chỉ ở khâu kiểm tra nội bộ: lỗi vẫn bị bắt đúng, không mất dữ liệu, người dùng cuối không thấy gì, chỉ làm người sửa mất thêm chút thời gian đọc.
  file: `app/tests/listings-browse.test.tsx`
  severity: low
  Đề xuất: known-limits

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).

