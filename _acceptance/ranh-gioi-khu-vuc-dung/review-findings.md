# Review findings: ranh-gioi-khu-vuc-dung (round 5)

## Trong hợp đồng

Không có finding nào map được vào AC.

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **Khu vực lạc được đánh dấu meta.lac nhưng transform-zalo/fb/chotot vẫn gán tin rao vào chúng (lượt theo lịch)**
  Người dùng thấy gì: Mỗi tuần, một số tin rao bán có ghi tên tỉnh khác vẫn có thể bị gán vào khu vực đã được đánh dấu là lạc, nên số liệu của những khu vực sai đó tiếp tục được cập nhật thay vì để yên.
  Căn cứ: Lỗi làm dữ liệu sai lặp lại mỗi tuần nhưng chỉ ảnh hưởng một ít tin ở khu vực đã bị đánh dấu lạc, không hiện trên bản đồ Hà Nội; sửa cần đụng nhiều bước nạp tin nên đáng làm thành một việc riêng.
  file: `pipeline/reassign-areas.mjs`
  severity: medium
  Đề xuất: new-contract

- **Tên check DQ mới và khoá meta mới đặt bằng tiếng Việt, check DQ dùng snake_case lệch quy ước kebab-case hiện có**
  Người dùng thấy gì: Một mục kiểm tra chất lượng dữ liệu trên trang Ops có tên tiếng Việt viết kiểu khác các mục còn lại; người dùng vẫn thấy nhãn đúng, chỉ là cách đặt tên không đồng nhất.
  Căn cứ: Chỉ là lệch cách đặt tên, không làm mất hay sai dữ liệu và người dùng không nhận ra; nhưng đổi tên sau khi đã có dòng kiểm tra được ghi thì đắt, nên ghi nhận như hạn chế đã biết.
  file: `pipeline/sql/450_dq_checks.sql`
  severity: low
  Đề xuất: known-limits

- **Khu vực lạc được giữ ở lượt có cờ --xoa-khu-vuc-lac không bị đánh dấu meta.lac, nên transform-airbnb vẫn gán được tin vào đó**
  Người dùng thấy gì: Một khu vực sai nhưng được giữ lại vì người dùng đã lưu nó có thể tạm nhận thêm tin Airbnb cho đến lượt chạy theo lịch kế tiếp.
  Căn cứ: Hiếm gặp và tự hết ở lượt chạy hằng tuần kế tiếp, không làm mất dữ liệu; chỉ ảnh hưởng vài khu vực bị giữ lại.
  file: `pipeline/reassign-areas.mjs`
  severity: low
  Đề xuất: known-limits

- **Hình dạng 2 — fixture VIẾT TAY đúng khuôn bên đọc: chi tiết DQ area_con_ngoai_cha không round-trip từ 450 sang dqDetail**
  Người dùng thấy gì: Nếu sau này cách ghi chi tiết kiểm tra bị đổi, trang Ops có thể hiện «(chưa diễn giải)» thay vì câu dễ hiểu mà bộ kiểm thử vẫn không báo lỗi.
  Căn cứ: Hậu quả chỉ là dòng chú thích kém dễ đọc trên trang Ops, không sai số liệu, và chỉ xảy ra nếu có người đổi cách ghi sau này.
  file: `app/tests/ops-nhan-theo-context.test.tsx`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 1 — đo văn bản mã thay vì đầu ra: lời hứa AC-10 «transform-airbnb không gán vào khu vực lạc» chỉ được đo bằng grep nguồn và một câu SQL chép lại trong test**
  Người dùng thấy gì: Bộ kiểm thử chưa chạy thử đường gán tin Airbnb thật trên khu vực lạc, nên nếu sau này câu gán bị sửa lệch thì có thể không ai biết ngay.
  Căn cứ: Không ảnh hưởng người dùng hiện tại, chỉ làm lưới an toàn cho thay đổi tương lai yếu hơn; có thể bổ sung sau khi cần.
  file: `pipeline/scripts/reassign-areas.test.mjs`
  severity: low
  Đề xuất: known-limits

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).
