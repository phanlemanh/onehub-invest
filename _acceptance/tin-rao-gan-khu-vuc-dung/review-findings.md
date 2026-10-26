# Review findings: tin-rao-gan-khu-vuc-dung (round 1)

## Trong hợp đồng

- **Hình dạng 5 — AC-7 tuyên quét lớp «tệp dùng bộ chung» nhưng chỉ kiểm 4/6 tệp (nhãn «vong»); hai tệp nhãn «chung» không bị kiểm gì**
  file:line: `pipeline/scripts/tin-rao-gan-khu-vuc.test.mjs:225`
  severity: medium
  AC: AC-7
  source: measurement
  detail: AC-7 trong contract và bảng §5 của design doc xếp sáu tệp vào nhãn «dùng bộ chung»: reassign-areas, transform-airbnb và bốn transform của vòng này. Luật đi kèm là tệp dùng bộ chung không còn câu chọn submarket hay `UPDATE … area_id` riêng, chỉ gọi docPhuongHopLe/ganPhuongTheoToaDo/phuongHopLe. Test thì tách ra nhãn thứ tư «chung» (dòng 190-191), còn trong `kiemMaTran` cả hai kiểm «còn câu chọn riêng» và «không gọi bộ chung» chỉ chạy khi `nhan === "vong"` (dòng 225). Ca 'TRG-AC-7 tệp dùng bộ chung không còn câu chọn riêng' cũng có `if (nhan !== "vong") continue` (dòng 243). Hệ quả: với reassign-areas.mjs và transform-airbnb.mjs, ma trận chỉ kiểm sự có mặt của tệp. Ví dụ bỏ `${phuongHopLe()}` khỏi transform-airbnb.mjs:119 thì tệp vẫn khớp `region_type = 'submarket'` ở dòng 118, vẫn có trong ma trận, và test vẫn xanh. reassign-areas.mjs hiện còn câu riêng `region_type = 'submarket'` (dòng 213) và `UPDATE sale_offers SET area_id = NULL` (dòng 261), nghĩa là sẽ đỏ nếu áp đúng luật của contract cho nó. Lớp được tuyên phủ đủ, nhưng phép kiểm chỉ phủ một tập con.

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **Hàm PIP chung ganPhuongTheoToaDo dùng ST_Contains và không chốt một phường, khác quy ước ST_Covers + DISTINCT ON của pipeline**
  Người dùng thấy gì: Một căn nằm đúng trên đường ranh giữa hai phường có thể không được gán phường nào, hoặc bị gán ngẫu nhiên khi hai phường chồng nhau. Hiếm gặp, và bước gán lại phường chạy sau đó thường sửa được.
  Căn cứ: Hậu quả nhẹ và hiếm, không mất dữ liệu, lượt gán phường chạy sau tự sửa; sửa sau không đắt nhưng không cấp bách.
  file: `pipeline/lib/osm.mjs`
  severity: low
  Đề xuất: known-limits

- **Test AC-4 xoá toàn bộ stg_chotot_ads (bảng của làn ZCode) trên DB local dùng chung, giữ khoá tới 300s**
  Người dùng thấy gì: Khi chạy bài kiểm tra này trên máy thu, lượt nạp tin Chợ Tốt chạy đúng lúc đó có thể phải chờ đến vài phút. Không mất dữ liệu nào.
  Căn cứ: Chỉ làm chậm tạm thời và chỉ khi trùng giờ chạy test, mọi thay đổi được hoàn lại; người chạy test tự tránh được bằng cách chạy lúc khác.
  file: `pipeline/scripts/tin-rao-gan-khu-vuc.test.mjs`
  severity: low
  Đề xuất: known-limits

- **Script đo AC-8 sập TypeError thay vì báo FAIL khi DB không có dữ liệu mồi**
  Người dùng thấy gì: Trên máy chưa có tin rao nào gắn phường, bài đo cuối sẽ báo lỗi khó hiểu thay vì báo đỏ rõ ràng. Kết quả vẫn là không đạt, chỉ thông điệp kém rõ.
  Căn cứ: Chỉ ảnh hưởng người chạy kiểm tra trên DB trống, vẫn đỏ chứ không xanh oan, và không đụng dữ liệu người dùng.
  file: `scripts/kiem-tin-rao-gan-khu-vuc.mjs`
  severity: low
  Đề xuất: known-limits

- **Phép đo lệch AC-8 không thấy được tin S03/S05 mất phường hay đổi phường, nên báo xanh oan**
  Người dùng thấy gì: Phép kiểm cuối có thể báo là không tin nào mất nhãn phường trong khi một số tin Zalo và Facebook thực ra đã mất hoặc đổi phường. Người duyệt có thể tin nhầm là an toàn.
  Căn cứ: Rủi ro thật là báo xanh oan cho hai nguồn, nhưng cần đổi cách nối tin ở cấp hợp đồng chứ không vá nhanh được, và dữ liệu tin cũ không bị hỏng ngay.
  file: `scripts/kiem-tin-rao-gan-khu-vuc.mjs`
  severity: medium
  Đề xuất: new-contract

- **Đối chứng dương của AC-8 dựa vào chính lỗi mà vòng này sửa, nên E8 sẽ đỏ mãi sau lượt nạp đầu tiên sau merge**
  Người dùng thấy gì: Sau khi hệ thống chạy lượt nạp đầu tiên, bài đo cuối sẽ báo đỏ mãi dù chức năng vẫn đúng. Người vận hành có thể nhầm là có lỗi.
  Căn cứ: Không ảnh hưởng dữ liệu hay người dùng cuối, chỉ báo động giả cho người vận hành, và có thể ghi chú là bài đo dùng một lần.
  file: `scripts/kiem-tin-rao-gan-khu-vuc.mjs`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 2 + 3 — thước lệch AC-8 nối theo offer_id, nhưng offer_id của S03/S05 đổi khi phường đổi; đối chứng dương lại tự dựng sẵn với offer_id giữ nguyên**
  Người dùng thấy gì: Phép kiểm cuối chỉ đo thật được với tin Chợ Tốt; với Zalo và Facebook nó dễ báo không có tin nào mất phường dù thực tế có. Do đó cam kết không làm mất nhãn phường chưa được chứng minh cho hai nguồn này.
  Căn cứ: Bảo đảm không làm tụt số tin có phường chưa được kiểm chứng cho hai nguồn, nhưng phải thiết kế lại cách đo ở một hợp đồng riêng; tin cũ vẫn còn, có thể xem lại sau.
  file: `scripts/kiem-tin-rao-gan-khu-vuc.mjs`
  severity: high
  Đề xuất: new-contract

- **Hình dạng 4 — AC-8 khẳng định «0 tin vào khu vực lạc mồi» chỉ bằng phép âm tính, không có đối chứng dương cho nhánh khu vực lạc**
  Người dùng thấy gì: Trên dữ liệu thật, bài đo cuối không chứng minh được rằng bản chưa sửa sẽ đẩy tin vào khu vực lạc. Việc đó đã được kiểm bằng dữ liệu mồi ở các bài kiểm riêng.
  Căn cứ: Nhánh khu vực lạc đã được kiểm bằng dữ liệu mồi ở bài khác nên rủi ro thấp; chỉ thiếu bằng chứng trên dữ liệu thật, không mất dữ liệu.
  file: `scripts/kiem-tin-rao-gan-khu-vuc.mjs`
  severity: medium
  Đề xuất: known-limits

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).
