# Review findings: do-lech-s03-s06-canh-hang (round 1)

## Trong hợp đồng

- **Hình dạng 1 — đo CHỈ DẪN thay vì ĐẦU RA: hàng mặt bằng trang một căn được kiểm bằng grep mã nguồn deal-body.tsx**
  file: app/tests/do-lech-s03-s06-doc.test.tsx:133
  severity: high
  source: measurement
  AC: AC-6
  detail: Dòng 133–135 đọc deal-body.tsx bằng readFileSync rồi assert.match regex /nhan="Mặt bằng S06 cùng dự án" value=\{chuMatBang\(d\.matBang, d\.rank\?\.metric \?\? null\)\}/. Đây là kiểm chữ trong mã nguồn, không render DealBody. E6 hứa «hàng mặt bằng trang một căn đúng bốn khuôn ghim theo trạng thái». Cách đo này không phát hiện được các lỗi ở đầu ra thật: điều kiện `d.matBang &&` bị đảo hay bỏ, Dong bị beMat che, hàng bị đặt ngoài <dl> hay nằm trong nhánh không render. Ngược lại, chỉ cần đổi cách viết mà giữ nguyên đầu ra (xuống dòng, đổi tên biến) là test đỏ. Không có lần renderToStaticMarkup(<DealBody …/>) nào kiểm câu ghim trên HTML ra.

- **Hình dạng 5 — tuyên quét LỚP nhưng chỉ có điểm-case: ma trận bảy DealRow chỉ chạy trên hàm chuMatBang, phần render chỉ có một ô**
  file: app/tests/do-lech-s03-s06-doc.test.tsx:128
  severity: medium
  source: measurement
  AC: AC-6
  detail: E6 hứa «bảy DealRow viết trước → chữ ô «Giảm so thước» và hàng mặt bằng trang một căn đúng bốn khuôn». Ma trận MB (dòng 96–105) chỉ được kiemChu chạy trên chuMatBang thuần (dòng 125). Phần render ô danh sách (DiscountBar, dòng 128–130) chỉ dựng đúng một ca, MB["thiếu S03"], với rank.metric cứng là "gia-m2". Vì vậy đường đọc metric qua d.rank?.metric để ra «tr/tháng» ở ô thuê giá tháng, và các trạng thái du, thieu-s06, thieu-hai, không ca nào được render. Trang một căn thì không render ca nào (xem finding grep ở trên). Số assert trên đầu ra render là 1, không phải 7 như ma trận tuyên.

- **Hình dạng 5 — ma trận AC-2 viết trước thiếu ô: không có tin S02 cùng nhóm**
  file: pipeline/scripts/do-lech-s03-s06.test.mjs:106
  severity: medium
  source: measurement
  AC: AC-2
  detail: E2 ghim ma trận bảy ô, trong đó có ô «S05 và S02 cùng nhóm», và đòi «một assert mỗi ô». Ca CG15-AC-2 chỉ chèn tin S05 (dòng 108, nguon: "S05"), không có fixture nào là S02, nên ô S02 không được đo. Ô «S03 cấp phường» (dòng 114) cũng không có assert riêng. Nó chỉ được suy gián tiếp qua tổng rows.length === 5 ở dòng 126, nên không phải một assert ứng với một ô. Số assert không khớp số phần tử ma trận đã tuyên.

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **423 lấy h.gia_tri (giá của tin đại diện phiếu) nên khi một căn có tin S03 ghép tin S06, giá của nguồn này bị tính vào trung vị của nguồn kia**
  Người dùng thấy gì: Khi một căn vừa có tin S03 vừa có tin S06, giá của nguồn này có thể lọt vào mặt bằng của nguồn kia. Số trung vị và độ lệch người vận hành thấy có thể lệch nhẹ ở những căn như vậy.
  Căn cứ: Số hiển thị sai nhưng chỉ ở nhóm căn ghép hai nguồn, người vận hành không tự phát hiện được; sửa ở bước tính sẵn khá rẻ nhưng cần ca thử riêng nên nên mở việc riêng.
  file: `pipeline/sql/423_project_source_baseline.sql`
  severity: high
  Đề xuất: new-contract

- **Nhóm giá tháng của 423 bỏ sót tin thuê có m² mà hạng ở cấp phường, nên n và trung vị lệch so với nhóm dth của 422 (trái với chú thích)**
  Người dùng thấy gì: Với tin thuê có diện tích nhưng được xếp hạng ở cấp phường, số căn và giá trung vị theo phòng ngủ ở mặt bằng có thể ít hơn thực tế. Một số nhóm có thể bị ghi thiếu để so dù dữ liệu đủ.
  Căn cứ: Chỉ ảnh hưởng một số nhóm thuê biên giới, hậu quả là hiện «chưa đủ để so» chứ không hiện số sai, và lần chấm sau tự cập nhật.
  file: `pipeline/sql/423_project_source_baseline.sql`
  severity: medium
  Đề xuất: known-limits

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).
