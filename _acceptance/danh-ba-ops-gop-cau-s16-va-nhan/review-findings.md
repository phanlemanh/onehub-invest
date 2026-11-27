## Trong hợp đồng

- **Hình dạng 3 (chỉ kiểm chuỗi có mặt, trong khi lời hứa là quan hệ): AC-10 kiểm ô Bậc ẩn bằng cách tìm bất kỳ <td> nào có lớp ẩn, không gắn với cột Bậc**
  file: `app/tests/danh-ba-ops-dot1.test.tsx:487`
  severity: medium
  AC: AC-10
  source: measurement
  detail: `const tdBac = [...html.matchAll(/<td\b[^>]*class="([^"]*)"/g)].some((m) => /\bhidden md:table-cell\b/.test(m[1]))` trả true khi CÓ MỘT ô bất kỳ trong hàng mang `hidden md:table-cell`. Trong registry-grid.tsx dòng 72, cột `nguon` (Nguồn) cũng có `cellClassName: "hidden md:table-cell"`. Vì vậy nếu bỏ `cellClassName` của cột `bac`, assert «AC-10 ô Bậc của hàng không ẩn» vẫn xanh. Lời hứa là ô của CỘT Bậc bị ẩn, tức một quan hệ giữa cột và lớp CSS, nhưng phép đo chỉ thấy chuỗi lớp đó có mặt đâu đó trong HTML. Chiều đỏ (dòng 489-493) bỏ cả hai meta cùng lúc và chỉ đo lại <th>, nên không lộ được lỗ này. Phía ô của Toà, Căn, Tin cũng không có assert nào nói rằng chúng không bị ẩn.
  rationale: AC-10 hứa cột Bậc ẩn ở khổ hẹp và hiện từ 768 px; phép kiểm không ghim được ô của cột Bậc nên AC-10 không được chứng minh đúng như lời hứa.

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

## Chưa adversarial-verify (refuter chết)

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).
