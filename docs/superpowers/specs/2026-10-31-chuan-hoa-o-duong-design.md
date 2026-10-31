# Chuẩn hoá ô đường cho luật ghép căn và bảng so thẻ duyệt — design

Hàng `chuan-hoa-o-duong` (dãy U2, sau HD2). Nguồn: Ngoài-1 của Cổng Bằng chứng HD2 vòng 2. Mạnh chọn «Tách việc riêng»
ngày 31/10.

## Vấn đề

Từ HD2, `apNguong` kết luận «khác căn» khi `soDuong` của hai tin ra «Lệch». `khoaDuong` chỉ bỏ tiền tố
«Đường/Phố/Đ.», nên mọi phần chỉ vị trí đứng trước tên đường vẫn nằm trong khoá: «Ngõ 254 Minh Khai» khác
«Minh Khai». Hai tin của cùng một căn vì vậy bị tách nhầm, và bảng so trên thẻ cũng hiện «Lệch».

Đo trên DB máy thu ngày 31/10 (chỉ SELECT): 8.219/30.943 tin có `street_raw`, trong đó 496 giá trị bắt đầu bằng
ngõ, ngách, hẻm, kiệt hoặc chữ số. Có năm dạng gây lỗi:

| Dạng | Ví dụ thật |
|---|---|
| Tiền tố vị trí + số | «Ngõ 215 Tô Hiệu», «Hẻm 80/66 Dương Quảng Hàm», «Ngõ 210A Võ Chí Công», «Số 10 Ngõ 9 La Dương», «Ngõ 199 Phố Lò Đúc» |
| Số nhà trần | «175 Lạc Long Quân», «2295 Huỳnh Tấn Phát» |
| Đuôi địa chỉ sau dấu phẩy | «235 Nguyễn Trãi, Khương Đình, Hà Nội, Vietnam» |
| Chỉ có số hay chỉ có tiền tố | «4», «Số 8», «Ngõ» |
| Chữ Ð (Eth, U+00D0) thay Đ | «Hẻm 135 Trần Hưng Ðạo» |

## Cách làm

Chỉ sửa thân `khoaDuong` (và `boDau`) trong `app/src/lib/ops/review-can-cu.ts`, rồi chép nguyên văn sang
`agent/src/agents/judge-entity.ts`. Thẻ và luật vì thế đổi cùng lúc, đúng hướng «đổi thẻ theo luật» Mạnh đã chọn ở
HD2. LT-AC-9 canh hai bản. Không thêm hàm mới, vì LT-AC-9 rút đúng bảy hàm theo tên.

Thứ tự chuẩn hoá, trên chuỗi đã NFC và viết thường. Dấu được giữ tới bước cuối, vì nhánh tiền tố «Đường/Phố» của HD2
cần dấu để phân «Đường» với «Dương». `boDau` chỉ chạy khi xuất khoá.

1. Đổi `ð` thành `đ` (lỗi gõ Eth).
2. Bỏ một hay nhiều cụm vị trí ở đầu chuỗi. Cụm vị trí là từ `số|ngõ|ngách|hẻm|kiệt` hoặc dạng không dấu
   `so|ngo|ngach|hem|kiet` (liệt kê từng dạng, không bỏ dấu cả chuỗi), theo sau là một số (cho phép chữ, `/`, `-`
   liền sau: «210A», «80/66»), rồi khoảng trắng hoặc dấu phẩy. Cụm ở đầu chắc là vị trí, nên chỉ có một cách đọc.
   Bước này chạy TRƯỚC khi cắt dấu phẩy, để «Ngõ 5, Kim Mã» còn «kim mã».
3. Cắt bỏ mọi thứ từ dấu phẩy đầu tiên của phần còn lại (đuôi phường, quận, thành phố).
4. Còn trống, hoặc chỉ còn từ vị trí trần («ngõ») → khoá rỗng → Thiếu.
5. Số nhà trần ở đầu (một số, khoảng trắng, rồi tên) → giữ CẢ HAI cách đọc, trừ khi phần sau là «tháng <số>». Trong
   trường hợp đó số là một phần tên đường («3 Tháng 2», «30 Tháng 4») nên giữ một cách đọc nguyên.
6. Mỗi cách đọc đi tiếp qua nhánh tiền tố «Đường/Phố» như HD2: tiền tố có dấu chắc là tiền tố; tiền tố không dấu giữ
   hai cách đọc. Xuất khoá bằng `boDau`; khoá chỉ còn chữ số bị loại.

Hai ô Khớp khi có chung ít nhất một cách đọc (`soDuong` không đổi).

## Không làm

- Nhận diện tên dự án hay mã nội khu trong ô đường («Vinhomes Ocean Park», «N1»). Muốn làm phải có danh mục dự án
  chuẩn, mà S08 chỉ dùng nội bộ.
- Đổi `PHIEN_BAN_NGUONG`: vòng này không đổi ngưỡng nào.
- Chạy lại judge-run trên hàng duyệt thật: đó là việc vận hành sau khi gộp.

## Đặc tả UX

Không có màn hình mới. Ô «So» của hàng Đường trên thẻ ghép căn đổi nhãn ở các cặp ghi ngõ hay số nhà, từ «Lệch»
sang «Khớp». Đây là cùng bảng so mà các hồ sơ the-duyet-* đã đo, nên không có trạng thái mới.
