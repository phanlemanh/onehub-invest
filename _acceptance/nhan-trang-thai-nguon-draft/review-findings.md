# Review findings: nhan-trang-thai-nguon-draft (round 1)

## Trong hợp đồng

Không có finding nào map được vào AC.

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **Bảng nhãn viết tay ra khỏi cả sổ enums lẫn danh sách ngoại lệ — lint không thấy nó chỉ vì ngưỡng 50%**
  Người dùng thấy gì: Danh sách trạng thái của nguồn dữ liệu vẫn được giữ bằng tay ở một chỗ riêng, hệ thống kiểm tra chung không quản nó. Người dùng cổng Ops không thấy khác biệt, nhưng sau này thêm trạng thái mới phải nhớ cập nhật thủ công.
  Căn cứ: Không ảnh hưởng người dùng hiện tại và đã có ca kiểm riêng bắt thiếu nhãn; chỉ cần ghi rõ là nợ đã biết, đưa vào sổ chung để sau.
  file: `pipeline/mappings.yaml`
  severity: medium
  Đề xuất: known-limits

- **Thẻ Cổng 1 xếp AC-6 vào khối «Sẽ KHÔNG làm» và bỏ nó khỏi «Hệ thống SẼ làm»**
  Người dùng thấy gì: Thẻ duyệt phạm vi hiển thị nhầm một việc sẽ làm vào mục sẽ không làm, có thể khiến người ký hiểu sai phạm vi. Sản phẩm chạy không bị ảnh hưởng.
  Căn cứ: Nhẹ vì chỉ là cách hiển thị thẻ, nội dung hợp đồng đúng; lỗi thuộc bộ dựng thẻ nên ghi lại để gửi cho kit thay vì sửa tại đây.
  file: `_acceptance/nhan-trang-thai-nguon-draft/card.html`
  severity: medium
  Đề xuất: known-limits

- **Thuật ngữ mới thiếu dòng _Avoid_ dù «Nháp» đã được cân nhắc rồi loại**
  Người dùng thấy gì: Nếu sau này ai đó dùng chữ «Nháp» thay cho «Chưa thu», hệ thống sẽ không cảnh báo, nên cùng một trạng thái có thể bị gọi hai tên khác nhau trên màn hình.
  Căn cứ: Hậu quả nhẹ, chỉ gây lệch từ ngữ, không mất dữ liệu; thêm một dòng ghi chú sau này rất rẻ.
  file: `CONTEXT.md`
  severity: low
  Đề xuất: known-limits

- **Hình dạng 2 — fixture viết tay: «bảng nhãn trước hàng» là lambda tự dựng, không lấy từ bản trước thật, nên phép đối chứng chỉ tự khẳng định lại chính nó**
  Người dùng thấy gì: Một phép thử phụ chỉ tự xác nhận lại chính nó, nên độ tin cậy của bằng chứng yếu hơn mô tả. Người dùng không thấy ảnh hưởng gì.
  Căn cứ: Nhẹ vì chiều đỏ thật đã được đo bằng tay và các ca chính vẫn bảo vệ; chỉ cần ghi giới hạn của bằng chứng.
  file: `app/tests/source-status-labels.test.tsx`
  severity: low
  Đề xuất: known-limits

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).

