## Trong hợp đồng

(không có)

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **Hình dạng 4 (assertion âm tính một mình): E5 dùng `?? []` nên ba bẫy cùng tên và phép đối chứng theo tên vẫn qua khi hàm suy mã báo lỗi**
  Người dùng thấy gì: Hiện các nút Estella, Global City, Central Park, Phú Mỹ Hưng đều trỏ đúng xã. Nhưng phép kiểm tự động chưa đủ chặt, nên sau này nếu phần suy xã hỏng thì có thể không bị báo đỏ và nút trỏ nhầm xã sẽ lọt qua.
  Căn cứ: Dữ liệu hôm nay đúng và người dùng chưa gặp lỗi nào; rủi ro chỉ là phát hiện chậm nếu sau này hỏng, và vá phép kiểm sau này rẻ, không mất dữ liệu.
  file: `pipeline/lib/danh-ba-vat-the.test.mjs`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 4 (assertion âm tính một mình): ô nhiều phường của E6 có đối chứng không đi cùng đường với assert chính**
  Người dùng thấy gì: Khi một dự án chuyển từ một phường sang nhiều phường, phép kiểm tự động chưa chứng minh chắc rằng bước dọn phường cũ của toà là thứ làm nên kết quả đúng. Nếu bước này lỡ bị bỏ, toà có thể còn giữ phường cũ mà không ai biết.
  Căn cứ: Hậu quả chỉ xảy ra nếu sau này có người làm hỏng bước dọn, ảnh hưởng một nhóm nhỏ toà, và việc chạy lại danh bạ sửa được; siết phép kiểm sau này rẻ.
  file: `pipeline/scripts/danh-ba-vat-the-xa.itest.mjs`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 2 (fixture dựng tay đúng khuôn bên đọc, không lấy từ bộ ghi): bangThat của E5 tự dựng lại cách bộ nạp PX1 đặt id, mà bỏ nhánh khopXa**
  Người dùng thấy gì: Phép kiểm đơn vị dùng bảng xã tự dựng, hơi khác bảng thật khi nạp danh bạ xã. Với vài xã đặc biệt, kết quả thử có thể lệch so với thực tế, nhưng người dùng không thấy ảnh hưởng.
  Căn cứ: Đã có phép kiểm đầu-cuối trên DB thật nạp danh bạ xã bù phần này, nên hậu quả nhẹ và không mất dữ liệu; sửa tốn công hơn lợi ích.
  file: `pipeline/lib/danh-ba-vat-the.test.mjs`
  severity: low
  Đề xuất: wont-fix

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).

