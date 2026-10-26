## Trong hợp đồng

Không có mục nào.

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **Khu Sổ đơn vị thu: nút Thử lại không bao giờ hiện lại dữ liệu vì state không theo props mới**
  Người dùng thấy gì: Khi đọc sổ đơn vị thu bị lỗi rồi bấm Thử lại, trang vẫn báo mọi nguồn chưa có đơn vị nào dù sổ có dữ liệu. Nhóm vừa thêm ở lưới phía trên cũng chưa hiện trong sổ cho đến khi tải lại trang.
  Căn cứ: Không mất hay lộ dữ liệu và người dùng tự khắc phục được bằng cách tải lại trang, nên nhẹ, nhưng nút Thử lại gây hiểu nhầm là sổ trống.
  file: `app/src/components/ops/sources/so-don-vi.tsx`
  severity: medium
  Đề xuất: known-limits

- **JSDoc của docNhomThu bị tách khỏi hàm và dính vào hằng NHOM_TRANG_CU**
  Người dùng thấy gì: Không ảnh hưởng người dùng; chỉ là chú thích mô tả trong mã đặt nhầm chỗ, làm người bảo trì đọc dễ nhầm.
  Căn cứ: Không có hậu quả nào với người dùng, không mất hay lộ dữ liệu, và sửa sau rất rẻ nên chỉ cần ghi vết.
  file: `app/src/lib/che-do-thu.ts`
  severity: low
  Đề xuất: wont-fix

- **SoDonVi copies the rows prop into useState once, so a refresh never updates the register (after Retry the whole register shows as empty)**
  Người dùng thấy gì: Sau khi bấm Thử lại, hoặc sau khi thêm hay xoá một nhóm ở lưới phía trên, sổ đơn vị thu không cập nhật cho đến khi tải lại trang. Người vận hành có thể tưởng sổ trống hoặc nhóm chưa được ghi.
  Căn cứ: Dữ liệu vẫn nguyên vẹn trong hệ thống và tải lại trang là thấy đúng, nên hậu quả nhẹ và người dùng tự gỡ được.
  file: `app/src/components/ops/sources/so-don-vi.tsx`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 1 — đo VĂN BẢN mã (regex trên nguồn) thay vì ĐẦU RA: nối dây lỗi/null của trang và trao getSessionUser của route**
  Người dùng thấy gì: Không có lỗi nhìn thấy với người dùng. Bộ kiểm tra chỉ soát chữ trong mã ở hai chỗ nên có thể bỏ sót nếu sau này trang hiển thị lỗi hoặc quyền admin bị nối sai.
  Căn cứ: Hôm nay người dùng không thấy hậu quả nào; rủi ro nằm ở lần sửa sau có thể lọt lỗi mà không bị báo, và bổ sung kiểm tra có thể làm sau.
  file: `app/tests/so-nhom.test.tsx`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 4 — assertion âm tính đứng một mình: bản tin push-ops-facts «không chứa khoá đơn vị» mà không có đối chứng dương**
  Người dùng thấy gì: Không có lỗi nhìn thấy với người dùng. Phép kiểm sổ đơn vị không lên cloud chưa chứng minh được là nó sẽ báo đỏ nếu một ngày sổ này vô tình bị đẩy lên.
  Căn cứ: Hiện không có dữ liệu nào lộ hay mất vì mã hiện tại không đọc sổ này; chỉ là lưới an toàn kém chắc và bổ sung kiểm chứng sau không tốn nhiều.
  file: `pipeline/scripts/so-nhom.itest.mjs`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 5 — eval tuyên cả lớp «năm CHECK của 047» nhưng test chỉ liệt kê 3 điểm**
  Người dùng thấy gì: Không có lỗi nhìn thấy với người dùng. Bộ kiểm tra mới soát ba trong năm ràng buộc của sổ nguồn, nên nếu hai ràng buộc còn lại bị mất khi đổi tên bảng thì chưa chắc bị phát hiện.
  Căn cứ: Chưa có dấu hiệu ràng buộc nào bị mất và dữ liệu không bị ảnh hưởng ngay; chỉ là kiểm tra chưa đủ phạm vi, bổ sung rẻ.
  file: `pipeline/scripts/so-nhom.itest.mjs`
  severity: low
  Đề xuất: known-limits

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).
