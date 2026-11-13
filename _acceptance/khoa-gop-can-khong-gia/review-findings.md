# Review findings: khoa-gop-can-khong-gia (round 2)

## Trong hợp đồng

Không có finding nào map được vào AC.

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **itest lấy chiều đỏ từ origin/main đang chạy, không ghim sha gốc vòng như pattern có sẵn, nên tệp tự đỏ vĩnh viễn sau khi gộp**
  Người dùng thấy gì: Bài kiểm của tính năng này sẽ báo đỏ sau khi gộp dù mã không sai. Người dùng cuối không bị ảnh hưởng, nhưng đội dễ nhầm là có lỗi thật khi chạy lại.
  Căn cứ: Chỉ ảnh hưởng người chạy kiểm tra nội bộ, không mất hay lộ dữ liệu, chạy lại không gây hại và sửa sau rất rẻ.
  file: `pipeline/tests/resolve-properties-khoa-gop.itest.mjs`
  severity: medium
  Đề xuất: known-limits

- **n_evidence của căn vẫn lấy cl.n (cả tin đã gắn căn khác), lệch với số link thật sau luật DA6**
  Người dùng thấy gì: Số tin làm bằng chứng hiển thị cho một số căn có thể cao hơn số tin thực sự gắn với căn đó. Chỉ là con số hiển thị lệch nhẹ, không làm mất hay gắn nhầm tin.
  Căn cứ: Lệch nhỏ ở một con số phụ, không mất dữ liệu, tự đúng lại khi sửa cách tính ở lượt sau.
  file: `pipeline/resolve-properties.mjs`
  severity: low
  Đề xuất: known-limits

- **101 ghi nhật ký «tin kế đã gắn căn khác» cả khi y gắn cùng căn với x**
  Người dùng thấy gì: Trong trường hợp hiếm tin cũ và tin kế cùng một căn, nhật ký khôi phục ghi thừa một dòng và số liệu tổng kết báo nhiều link mất hơn thực tế. Căn không mất tin nào.
  Căn cứ: Chỉ làm nhật ký và bộ đếm phóng đại, không mất dữ liệu, dòng thừa vô hại khi khôi phục và ca này hiếm.
  file: `db/migrations/101_doi_soat_chuyen_link.sql`
  severity: low
  Đề xuất: known-limits

- **itest KGC tự đỏ vĩnh viễn ngay khi nhánh này gộp vào main (chiều đỏ đọc resolver từ origin/main)**
  Người dùng thấy gì: Bài kiểm sẽ đỏ sau khi gộp dù mã không hồi quy, gây báo động giả cho đội vận hành. Người dùng cuối không thấy gì.
  Căn cứ: Báo động giả nội bộ, không động tới dữ liệu người dùng, sửa rẻ bằng cách cố định bản gốc.
  file: `pipeline/tests/resolve-properties-khoa-gop.itest.mjs`
  severity: medium
  Đề xuất: known-limits

- **Căn mới hoặc căn khớp lấy số tổng hợp từ cả các tin đã gắn căn khác (n_evidence, first/last_seen, toạ độ)**
  Người dùng thấy gì: Một số căn có thể hiện số tin, ngày đăng đầu hoặc vị trí trung bình bị ảnh hưởng bởi tin thuộc căn khác. Sai lệch nhỏ, chủ yếu ở căn từng bị đổi giá.
  Căn cứ: Lệch nhỏ ở thông tin phụ, không mất hay gắn nhầm tin, tính lại ở lượt sau khi cần.
  file: `pipeline/resolve-properties.mjs`
  severity: low
  Đề xuất: known-limits

- **Hình dạng 6 — chiều đỏ đo ref origin/main (thứ ngoài cây đang kiểm) thay vì một bản gốc ghim cố định**
  Người dùng thấy gì: Kết quả bài kiểm phụ thuộc vào bản nhánh chính trên từng máy nên có thể đỏ hoặc xanh sai. Không ảnh hưởng người dùng cuối.
  Căn cứ: Chỉ làm kết quả kiểm nội bộ thiếu ổn định, không hại dữ liệu, sửa rẻ.
  file: `pipeline/tests/resolve-properties-khoa-gop.itest.mjs`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 4 — chiều đỏ 2 của AC-9 chỉ kiểm có lỗi, không ghim lỗi nào**
  Người dùng thấy gì: Một phép thử phụ có thể báo đỏ vì lý do khác với lý do dự định, làm bài kiểm kém chặt. Người dùng cuối không bị ảnh hưởng.
  Căn cứ: Chỉ làm một phép thử phụ kém chặt trong khi phép thử chính đã ghim đúng lỗi, chi phí sửa không đáng.
  file: `pipeline/tests/resolve-properties-khoa-gop.itest.mjs`
  severity: low
  Đề xuất: wont-fix

- **Hình dạng 4 — chiều đỏ của AC-1 chỉ đếm saiDo.length > 0, không nêu offer_id như eval E1 hứa**
  Người dùng thấy gì: Phép thử đối chứng chỉ xác nhận có ít nhất một tin sai, không chỉ ra từng tin. Người dùng cuối không bị ảnh hưởng.
  Căn cứ: Chỉ làm thông điệp lỗi của bài kiểm kém chi tiết, không ảnh hưởng dữ liệu, sửa không mang lại nhiều giá trị.
  file: `pipeline/tests/resolve-properties-khoa-gop.itest.mjs`
  severity: low
  Đề xuất: wont-fix

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).
