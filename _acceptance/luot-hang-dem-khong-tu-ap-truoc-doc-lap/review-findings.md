# Review findings: luot-hang-dem-khong-tu-ap-truoc-doc-lap

## Trong hợp đồng

(không có)

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **Hình dạng 2 — Fixture viết tay đúng khuôn bên đọc: E6 tuyên đo «trên bản chép DB, 20 tin có E1» nhưng E1 là hàm giả trả 'apartment' cho mọi tin**
  Người dùng thấy gì: Phép thử trước khi ship dùng căn cứ luật dựng sẵn thay vì lấy từ dữ liệu thật của máy thu. Vì vậy chưa chứng minh được rằng trên dữ liệu thật, lượt đêm không còn tự áp đề xuất có căn cứ. Hành vi chặn vẫn được đo trên đầu vào dựng.
  Căn cứ: Việc chặn tự áp không phụ thuộc nguồn của căn cứ nên rủi ro thấp, không làm mất hay lộ dữ liệu. Lượt đo đầu tiên sau khi gộp trên dữ liệu thật sẽ bắt được sai lệch nếu có, và phần sửa sau rẻ.
  file: `agent/tests/enrich-luot-dem-khong-tu-ap.test.ts`
  severity: medium
  Đề xuất: known-limits

## Chưa adversarial-verify (refuter chết)

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).
