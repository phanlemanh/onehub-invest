# Review findings: s06-thu-duoi-do (round 1)

## Trong hợp đồng

(không có)

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **Tệp mới hardcode tên miền thật của nguồn S06 (tầng A) trong kho công khai**
  Người dùng thấy gì: Bộ thu mới ghi sẵn địa chỉ thật của nguồn S06 trong mã nằm ở kho công khai, nên ai đọc kho cũng thấy tên nguồn vốn phải giữ kín.
  Căn cứ: Tên nguồn đã lên kho công khai thì không thu hồi được, và quy tắc giữ kín tên nguồn đòi chặn tên mới. Sửa rẻ nhưng cần một việc riêng để đọc địa chỉ từ cấu hình trên máy thu.
  file: `pipeline/collect-s06-duoi.mjs`
  severity: medium
  Đề xuất: new-contract

- **Lượt hỏng DB giữa chừng làm mất số lời gọi nguồn trong nhật ký và báo cáo**
  Người dùng thấy gì: Khi DB đứt giữa một lượt thu, báo cáo đếm thiếu số lần đã gọi nguồn, nên số lời gọi mỗi phút trông thấp hơn thực tế. Tin thu được không bị mất.
  Căn cứ: Chỉ lệch con số báo cáo trong lượt gặp sự cố hiếm, không mất tin, và số đúng vẫn còn ở tệp trạng thái. Ghi lại để làn thu sửa ở lần sau.
  file: `pipeline/collect-s06-duoi.mjs`
  severity: medium
  Đề xuất: known-limits

- **docMoc và phienCuoi nuốt mọi lỗi đọc, kể cả tệp hỏng, rồi lặng lẽ làm lại từ đầu**
  Người dùng thấy gì: Nếu tệp ghi nhớ tin đã thấy bị hỏng, bộ thu lặng lẽ quên hết và có thể đưa lại các tin cũ như tin mới, không có cảnh báo.
  Căn cứ: Chỉ xảy ra khi tệp bị hỏng giữa chừng, hậu quả là tin trùng chứ không mất tin, và bộ thu hiện chỉ chạy tay nên người chạy tự thử lại được.
  file: `pipeline/collect-s06-duoi.mjs`
  severity: low
  Đề xuất: known-limits

- **Hình dạng 6: đường dẫn hardcode, E6/E9 đo phép đo nằm trong worktree của tác giả, không phải cây đang kiểm**
  Người dùng thấy gì: Phần kiểm số đo 24 giờ chỉ chạy được khi có thư mục dữ liệu của người làm ra nó. Máy khác hoặc sau khi dọn thư mục đó thì lượt kiểm dừng và báo thiếu dữ liệu.
  Căn cứ: Hợp đồng đã ghi rõ giới hạn này và lượt kiểm báo đỏ rõ ràng chứ không báo xanh giả. Người chấm tự khắc phục bằng cách chỉ đúng thư mục dữ liệu.
  file: `_acceptance/config.yaml`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 3: dòng 'tổng N tin = tổng mục mới M' của E6 chỉ được in ra, quan hệ bằng nhau không được assert**
  Người dùng thấy gì: Một dòng tổng trong báo cáo kiểm chỉ được in ra chứ không tự so sánh. Nếu hai số lệch nhau, lượt kiểm vẫn có thể báo đạt.
  Căn cứ: Dữ liệu đã ghim bằng băm và từng snapshot đã được so riêng, nên lệch ở tổng gần như không thể xảy ra. Công sửa lớn hơn rủi ro còn lại.
  file: `_acceptance/s06-thu-duoi-do/probes/phu-ca.mjs`
  severity: low
  Đề xuất: wont-fix

## Chưa adversarial-verify (refuter chết)

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).
