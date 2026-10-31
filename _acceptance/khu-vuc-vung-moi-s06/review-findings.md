# Review findings: khu-vuc-vung-moi-s06

## Trong hợp đồng

(không có finding nào map được vào AC)

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **Hình dạng 5 — ma trận tuyên phủ lớp «hai dạng mã dài» nhưng nhánh tra `vn-tinh-${ngan}` từ khoá ngắn không có phần tử nào chạm**
  Người dùng thấy gì: Một nhánh tra tên tỉnh từ khoá ngắn chưa được bài test kiểm riêng. Nếu sau này ai đó lỡ xoá nhánh này, test vẫn xanh và trang quản trị có thể hiện «(chưa có tên Việt)» cho một số tỉnh.
  Căn cứ: Hiện mọi tỉnh đang có đều ra đúng tên và bản tạm này sẽ bị thay khi đổi mã khu vực, nên rủi ro nhẹ; thêm một ca test sau này rẻ.
  file: `app/tests/ma-thi-truong-dai.test.tsx`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 4 — E2 xanh khi không ca ON12-AC-7 nào chạy: không đối chứng dương số ca, không ghim ca DB**
  Người dùng thấy gì: Bước kiểm tiền đề cho trang tổng quan có thể báo xanh dù không ca kiểm nào thực sự chạy, nếu ai đó đổi tên ca. Người dùng trang quản trị không bị ảnh hưởng trực tiếp, chỉ là độ tin cậy của bằng chứng nghiệm thu thấp hơn mức mong muốn.
  Căn cứ: Không ảnh hưởng dữ liệu hay người dùng cuối, chỉ làm bằng chứng nghiệm thu kém chặt; chạy lại là thấy ngay và sửa sau rẻ.
  file: `_acceptance/khu-vuc-vung-moi-s06/rang/on12-tien-de.mjs`
  severity: medium
  Đề xuất: known-limits

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).
