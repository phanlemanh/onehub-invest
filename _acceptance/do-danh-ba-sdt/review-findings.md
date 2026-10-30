## Trong hợp đồng

Không có finding nào map được vào AC.

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **Bộ dò rộng N5 nuốt mất SĐT đứng sau từ tận cùng bằng «o» (vd «Zalo 09…») nên N5 đếm thiếu mà không báo gì**
  Người dùng thấy gì: Số bài bị bỏ sót số điện thoại có thể bị đếm thiếu khi số đứng ngay sau chữ «Zalo». Màn chất lượng có thể báo đạt trong khi vẫn còn bài lọt.
  Căn cứ: Chỉ làm số đo nội bộ thấp hơn thực tế ở một kiểu tin, không mất hay lộ dữ liệu người dùng, và số này vốn đang báo chưa đạt nên chưa gây hiểu lầm lớn.
  file: `pipeline/do-danh-ba-sdt.mjs`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 2 — fixture viết tay đúng khuôn bên đọc: 'cặp đã merged' và 'vai đã rút' chỉ là Set dựng tay, đường SQL sinh ra chúng không được đo**
  Người dùng thấy gì: Nếu sau này ai đó sửa nhầm cách tính người đã gộp hoặc vai đã rút, bộ kiểm có thể vẫn xanh và số trên màn chất lượng lệch mà không ai hay.
  Căn cứ: Không ảnh hưởng người dùng hiện tại vì số đo đang đúng; rủi ro chỉ xuất hiện khi có sửa đổi sau này và có thể bổ sung phép thử sau với chi phí thấp.
  file: `pipeline/do-danh-ba-sdt.test.mjs`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 5 — tuyên ma trận 'số assert = số phần tử' nhưng các ca bị gộp thành ô tổng**
  Người dùng thấy gì: Một số ca riêng lẻ được kiểm gộp chung nên một lỗi nhỏ ở một ca có thể bị che bởi ca khác. Người dùng cuối không thấy ảnh hưởng trực tiếp.
  Căn cứ: Chỉ là độ mịn của bộ kiểm nội bộ, đã có phép đo độc lập bù lại; tách nhỏ ra tốn công mà ít thêm bảo vệ.
  file: `pipeline/do-danh-ba-sdt.test.mjs`
  severity: medium
  Đề xuất: wont-fix

- **Hình dạng 1 — đo mã nguồn thay vì đầu ra: 'bộ bóc là extractPhones (so tham chiếu hàm)' kiểm bằng grep dòng import**
  Người dùng thấy gì: Bộ kiểm chỉ xác nhận dòng khai báo còn đó chứ không chứng minh số đo dùng đúng bộ bóc số điện thoại. Hiện số liệu vẫn đúng nên người dùng chưa bị ảnh hưởng.
  Căn cứ: Số đo hiện đã trùng phép đo độc lập nên kết quả đúng; lỗ hổng chỉ là phép thử lỏng và sửa sau rẻ nhưng không cấp bách.
  file: `pipeline/do-danh-ba-sdt.test.mjs`
  severity: low
  Đề xuất: wont-fix

- **Hình dạng 4 — quét lọt SĐT/khoá băm chỉ có chiều âm, không đối chứng dương, và fixture không sinh được chuỗi để bắt**
  Người dùng thấy gì: Phép kiểm không lộ số điện thoại có thể không bắt được nếu sau này có số lọt vào kết quả ghi. Hiện chưa có bằng chứng số nào bị lọt.
  Căn cứ: Hậu quả tiềm năng là lộ định danh nên đáng ghi nhận, nhưng hiện chưa lọt và người ký có thể chấp nhận ghi hạn chế rồi bổ sung phép đối chứng sau.
  file: `_acceptance/do-danh-ba-sdt/probes/db.mjs`
  severity: low
  Đề xuất: known-limits

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).
