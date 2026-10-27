# Review findings: df0-dem-de-xuat-lam-giau (round 1)

## Trong hợp đồng

(không có)

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **Thẻ ký và hình Hỏi-1 ghi «ba tuyến», nhưng CHECK route có bốn tuyến**
  Người dùng thấy gì: Thẻ Mạnh đọc khi duyệt ghi số đếm phủ «ba tuyến», trong khi thực tế có bốn tuyến. Con số «đề xuất làm giàu» trên đầu trang vì thế gồm cả đề xuất đang chờ ở tuyến bị thay thế mà thẻ không nói rõ.
  Căn cứ: Chỉ là chữ mô tả trên thẻ duyệt sai một con số, số hiển thị cho người vận hành vẫn đúng theo quyết định đã duyệt và không mất dữ liệu; ghi chú lại là đủ.
  file: `_acceptance/df0-dem-de-xuat-lam-giau/card-plain.json`
  severity: low
  Đề xuất: known-limits

- **Thẻ đã ký và hình Hỏi-1 ghi «ba tuyến», nhưng CHECK route có 4 tuyến**
  Người dùng thấy gì: Thẻ đã ký nói số đếm phủ ba tuyến, nhưng dữ liệu thật có bốn tuyến. Người vận hành thấy một con số gồm cả đề xuất ở tuyến bị thay thế, điều thẻ không nhắc.
  Căn cứ: Sai lệch chỉ ở lời mô tả trên thẻ, con số trên trang vẫn đúng theo quyết định đếm mọi đề xuất đang chờ, không mất dữ liệu và người dùng không bị ảnh hưởng; ghi lại làm han chế đã biết là đủ.
  file: `_acceptance/df0-dem-de-xuat-lam-giau/card-plain.json`
  severity: low
  Đề xuất: known-limits

⚠ Cụm ngoài vùng phủ: 2/2 lỗi rơi vào file không bộ đo nào phủ (_acceptance/df0-dem-de-xuat-lam-giau/card-plain.json) — dừng và quyết: mở rộng hợp đồng hay rút phạm vi.
