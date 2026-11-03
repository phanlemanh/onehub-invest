## Trong hợp đồng

Không có.

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **Hình dạng 4 (âm tính một mình): `giao_dich_nay_ghi = false` không có đối chứng dương, và thông điệp deadlock không thể hiện ra trong đúng lỗi nó canh**
  Người dùng thấy gì: Một phép kiểm tự động canh việc bước thử số ghép không vô tình ghi đè luật phân xử trên máy thu có thể không báo đúng chỗ, hoặc vẫn xanh khi luật mới được áp. Người dùng không thấy hậu quả trực tiếp trên sản phẩm; chỉ là một lỗi tương lai có thể lọt qua phép kiểm này mà không ai biết.
  Căn cứ: Hậu quả nhẹ và gián tiếp: không làm mất hay lộ dữ liệu của người dùng, chỉ làm một lưới an toàn nội bộ kém nhạy hơn; ghi lại để biết, và gia cố sau khi bước triển khai thật xong thì rẻ hơn.
  file: `pipeline/scripts/so-ghep-s06.test.mjs`
  severity: low
  Đề xuất: known-limits

- **Hình dạng 5 (tuyên quét lớp nhưng chỉ lấy mẫu): «mọi số hiện được, đếm trên toàn bộ tin có số» nhưng câu đọc có LIMIT 500, không ORDER BY (r2)**
  Người dùng thấy gì: Phép kiểm khuôn số điện thoại trên trang tin rao chỉ soi một phần nhỏ tin có số chứ không phải tất cả. Nếu có số sai khuôn nằm ngoài phần được soi thì phép kiểm vẫn báo xanh.
  Căn cứ: Chỉ là phép kiểm phụ chạy trên dữ liệu máy thu, người dùng không thấy gì sai ở sản phẩm; nếu có số lỗi thì lần rà sau vẫn bắt được và sửa sau không tốn kém.
  file: `app/tests/tin-rao-doi-chieu.test.tsx`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 4 (âm tính một mình): saiKhuon = 0 vẫn xanh khi getOfferPhone trả null cho mọi tin, coThat chỉ được in (r2)**
  Người dùng thấy gì: Phép kiểm khuôn số trên trang tin rao vẫn xanh nếu hệ thống không đọc ra được số nào, nên có thể che mất lỗi làm mất số của mọi tin. Người dùng có thể thấy toàn bộ tin hiện «Chưa có số» mà phép kiểm không báo.
  Căn cứ: Hậu quả chỉ xảy ra khi đường đọc số hỏng hoàn toàn, lỗi đó lộ ngay trên trang và người dùng tải lại hay báo là phát hiện; thêm một phép đối chứng sau này rất rẻ.
  file: `app/tests/tin-rao-doi-chieu.test.tsx`
  severity: low
  Đề xuất: known-limits

- **Hình dạng 5 (tuyên quét lớp nhưng chỉ có điểm-case): «mọi giá trị in đi qua chặn số» chỉ phá thử veDong, bỏ sót hai đường in khác của doTrenDb (r2 · tệp đã đổi)**
  Người dùng thấy gì: Lệnh đo số ghép hiện không in số điện thoại nào ra màn hình, nhưng bộ kiểm chưa bảo vệ được hai dòng in phụ. Sau này ai sửa mà làm lộ số ở hai dòng đó thì bộ kiểm vẫn báo xanh.
  Căn cứ: Hiện chưa có số nào bị lộ và lệnh đo chỉ chạy nội bộ trên máy, nên nhẹ với người dùng; bổ sung ca kiểm sau này rẻ nên ghi lại là hạn chế đã biết.
  file: `pipeline/scripts/so-ghep-s06.test.mjs`
  severity: low
  Đề xuất: known-limits

- **gan-sdt-s06 --thu nạp 070 trên DB dùng chung, giữ AccessExclusiveLock trên public.sale_offers suốt phép đo (r1)**
  Người dùng thấy gì: Nếu chạy lệnh đo thử trên cơ sở dữ liệu thật của máy thu, các trang vận hành và việc đồng bộ có thể đứng chờ trong lúc đo. Dữ liệu không mất, nhưng người vận hành sẽ thấy trang treo cho tới khi phép đo xong.
  Căn cứ: Chỉ xảy ra khi chạy tay lệnh đo đúng chỗ, không mất dữ liệu và hết khi phép đo kết thúc; chỉ cần ghi lại để người chạy dùng bản sao dữ liệu thử.
  file: `pipeline/gan-sdt-s06.mjs`
  severity: medium
  Đề xuất: known-limits

- **Kiểm danh-ba-sdt:n3 đỏ giả khi có số chỉ nằm trên tin S06 ghép hoặc mất dấu; thay đổi chỉ sửa sellersThieu (r1)**
  Người dùng thấy gì: Khi xuất hiện một số điện thoại chỉ có trên tin ghép, phép kiểm hằng ngày của danh bạ sẽ báo đỏ dù không có gì hỏng. Người vận hành có thể bị báo lỗi giả trên trang Ops.
  Căn cứ: Hôm nay chưa xảy ra vì mọi số đều có tin trực tiếp, và chỉ gây cảnh báo giả chứ không mất hay lộ dữ liệu; nên sửa trong một việc riêng trước khi số ghép tăng.
  file: `pipeline/do-danh-ba-sdt.mjs`
  severity: medium
  Đề xuất: new-contract

- **Sau khi áp 070, nạp lại 061 và 059 lỗi «cannot drop columns from view», làm đỏ các itest và thước đo đang dùng (r1)**
  Người dùng thấy gì: Sau khi áp bản cập nhật mới lên máy thu, một số lệnh kiểm và đo cũ sẽ báo lỗi dù dữ liệu thật vẫn đúng. Người vận hành có thể tưởng hệ thống hỏng trong khi chỉ công cụ kiểm hỏng.
  Căn cứ: Dữ liệu người dùng không bị ảnh hưởng, chỉ các lệnh kiểm nội bộ đỏ; sửa không gấp nhưng cần làm trước khi các bản sao máy thu có bản cập nhật mới.
  file: `pipeline/lib/nap-061.mjs`
  severity: medium
  Đề xuất: new-contract

- **Hình dạng 1 (đo chỉ dẫn thay vì đầu ra): chiều đỏ SG-AC-1 phá bản chép luật trong test, không phá mã thật (r1 · tệp đã đổi)**
  Người dùng thấy gì: Một ca kiểm âm của luật ghép người có thể vẫn xanh dù luật thật bị sửa sai. Việc phát hiện lỗi về sau yếu hơn bảng nghiệm thu mô tả.
  Căn cứ: Hành vi thật vẫn được ca kiểm dương bảo vệ và không ảnh hưởng người dùng; chỉ là lưới an toàn mỏng hơn, sửa sau rẻ.
  file: `pipeline/scripts/so-ghep-s06.test.mjs`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 2 (fixture viết tay đúng khuôn bên đọc): ô S03, S05 chèn thẳng cột trong khi E1 hứa ghi bằng đường nạp của nguồn (r1 · tệp đã đổi)**
  Người dùng thấy gì: Phép kiểm cho nguồn S03 và S05 dùng dữ liệu viết tay nên có thể không thấy lỗi nếu đường nạp thật ghi dạng số khác. Lỗi như vậy chỉ lộ khi chạy trên dữ liệu thật.
  Căn cứ: Độ lệch đã được ghi nhận công khai, hai nguồn này không đổi hành vi trong vòng này và nếu có lỗi cũng lộ ngay khi đo trên dữ liệu thật mà không làm mất dữ liệu.
  file: `pipeline/scripts/so-ghep-s06.test.mjs`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 2 (fixture viết tay đúng khuôn bên đọc): E8 tự viết thân trả về của route, không lấy từ route thật (r1)**
  Người dùng thấy gì: Nếu sau này tên trường của API và của thẻ tin lệch nhau, bài kiểm giao diện vẫn xanh còn người dùng có thể mất nhãn «Chưa xác minh» trên trang công khai.
  Căn cứ: Hiện hai phía đang khớp và có bài kiểm riêng cho từng phía; rủi ro chỉ xuất hiện khi ai đó đổi tên trường, và người dùng chỉ thấy thiếu nhãn chứ không lộ số.
  file: `app/tests/so-ghep-nhan-giao-dien.test.tsx`
  severity: medium
  Đề xuất: known-limits

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).
