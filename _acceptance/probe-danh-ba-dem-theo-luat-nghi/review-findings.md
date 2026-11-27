## Trong hợp đồng

Không có finding nào map được vào AC.

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **Phép kiểm «ca phá đỏ ở dải số» luôn qua: chuỗi grep trùng với tên test**
  Người dùng thấy gì: Script kiểm tra nội bộ có một dòng kiểm thừa, nếu lỗi xảy ra ở chỗ khác thì thông báo sẽ nêu sai lý do. Kết quả cuối vẫn đỏ đúng lúc, người dùng cuối không bị ảnh hưởng.
  Căn cứ: Chỉ là công cụ kiểm nội bộ, kết quả cuối vẫn đúng, không mất hay lộ dữ liệu, sửa sau cũng rẻ nên chấp nhận và ghi vết.
  file: `_acceptance/probe-danh-ba-dem-theo-luat-nghi/probes/doi-chieu.sh`
  severity: low
  Đề xuất: wont-fix

- **Chốt «ca phá đỏ ở dải số» luôn qua vì chuỗi grep trùng với tên ca test**
  Người dùng thấy gì: Một dòng kiểm trong script thử nghiệm luôn qua nên không chứng được điều nó định chứng. Không ảnh hưởng gì tới màn Danh bạ mà người dùng thấy.
  Căn cứ: Không đụng tới sản phẩm người dùng, kết quả script vẫn đỏ đúng khi có lỗi, chi phí sửa nhỏ nhưng hậu quả cũng rất nhẹ.
  file: `_acceptance/probe-danh-ba-dem-theo-luat-nghi/probes/doi-chieu.sh`
  severity: low
  Đề xuất: wont-fix

⚠ Cụm ngoài vùng phủ: 2/2 lỗi rơi vào file không bộ đo nào phủ (_acceptance/probe-danh-ba-dem-theo-luat-nghi/probes/doi-chieu.sh) — dừng và quyết: mở rộng hợp đồng hay rút phạm vi.
