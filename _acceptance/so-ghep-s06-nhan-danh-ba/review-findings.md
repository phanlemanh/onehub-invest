# Review findings: so-ghep-s06-nhan-danh-ba (round 4)

## Trong hợp đồng

Không có.

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **khoaNguon không nghỉ 100 ms khi bị khoá DDL ngoài 33033 chặn, quay vòng hết toiDa rồi ném 55P03**
  Người dùng thấy gì: Khi máy thu đang bận một thao tác sửa cấu trúc bảng, các phép kiểm tự động có thể bỏ cuộc quá sớm và báo đỏ giả dù tính năng không hỏng. Người dùng cuối không thấy gì; chỉ làm chậm việc kiểm và gộp bản mới.
  Căn cứ: Hậu quả nhẹ: không mất hay lộ dữ liệu, không chạm người dùng cuối, chỉ gây báo đỏ giả khi kiểm và chạy lại là qua; sửa rẻ nhưng thuộc việc sửa công cụ kiểm riêng, không thuộc hồ sơ nhãn số ghép này.
  file: `pipeline/lib/luoc-do-rieng.mjs`
  severity: medium
  Đề xuất: new-contract

- **Hồ sơ nghiệm thu thêm dòng mới mang tên nguồn thật, trái luật tạm 'chỉ chặn tên thật thêm mới'**
  Người dùng thấy gì: Vài dòng trong hồ sơ nghiệm thu và tài liệu thiết kế nhắc tên thật của nguồn dữ liệu trên kho đã công khai. Người dùng cuối không thấy, nhưng đó là thông tin nội bộ nên không muốn lộ thêm.
  Căn cứ: Nhẹ: các tên này vốn đã công khai sẵn trong kho, Mạnh đã chốt dọn hàng loạt sau 05/11, và thêm vài dòng nữa không làm lộ gì mới; có thể sửa văn xuôi sau với chi phí rất thấp.
  file: `_acceptance/so-ghep-s06-nhan-danh-ba/evidence-page.html`
  severity: low
  Đề xuất: known-limits

- **khoaNguon không nghỉ khi 33033 rảnh mà bảng vẫn bị khoá DDL khác giữ: quay hết 1000 lượt thử rồi ném 55P03**
  Người dùng thấy gì: Khi một thao tác sửa bảng khác kéo dài, nhiều phép kiểm tự động của các tính năng số điện thoại và danh bạ có thể thất bại giả. Người dùng cuối không bị ảnh hưởng, chỉ làm sai lệch kết quả kiểm trước khi ra mắt.
  Căn cứ: Nhẹ với người dùng: không mất hay lộ dữ liệu, thất bại giả tự hết khi chạy lại; nhưng nên sửa sớm trong một việc riêng vì ảnh hưởng nhiều bộ kiểm và sát mốc ra mắt.
  file: `pipeline/lib/luoc-do-rieng.mjs`
  severity: medium
  Đề xuất: new-contract

- **Hình dạng 5 (tuyên quét lớp nhưng chỉ có điểm-case): cả hai ca mới đều dùng matChuoi giữ 33033, nhánh «khoá DDL ngoài 33033» của khoaNguon không được đo, và nhánh đó không nghỉ như chú thích hứa**
  Người dùng thấy gì: Bộ kiểm tự động chưa thử tình huống bảng bị giữ bởi một thao tác sửa cấu trúc khác, nên lỗi ở tình huống đó vẫn xanh. Người dùng cuối không bị ảnh hưởng.
  Căn cứ: Nhẹ: chỉ là khoảng trống trong kiểm tra công cụ nội bộ, không ảnh hưởng dữ liệu hay người dùng; thêm ca kiểm đi cùng việc sửa lỗi khoá nên không cần mở việc riêng.
  file: `pipeline/scripts/luoc-do-rieng.test.mjs`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 5 (tuyên quét lớp nhưng chỉ có điểm-case): ca «chuỗi ca DDL giữ khoá liền nhau» chỉ có đúng một mắt, không dựng lại chuỗi đã gây đói khoá**
  Người dùng thấy gì: Phép kiểm chưa tái hiện được tình huống nhiều thao tác nối đuôi giữ bảng, nên có thể bỏ sót lỗi đói khoá. Người dùng cuối không thấy gì.
  Căn cứ: Nhẹ: là nhận định từ đọc mã, chưa chạy thử, không chạm dữ liệu hay người dùng; bổ sung ca kiểm sau không tốn kém.
  file: `pipeline/scripts/luoc-do-rieng.test.mjs`
  severity: low
  Đề xuất: known-limits

- **Hình dạng 4 (âm tính một mình): ca «xếp hàng bị lock_timeout cắt» bỏ giá trị trả về, không có gì chứng minh việc cắt hay thử lại đã xảy ra**
  Người dùng thấy gì: Một phép kiểm tự động có thể báo xanh mà không chứng minh tình huống bị cắt rồi thử lại đã xảy ra. Người dùng cuối không bị ảnh hưởng.
  Căn cứ: Nhẹ: chỉ làm phép kiểm nội bộ kém chặt, không mất hay lộ dữ liệu; siết chặt khi động tới công cụ khoá.
  file: `pipeline/scripts/luoc-do-rieng.test.mjs`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 4 (âm tính một mình): `giu33033(c, pid) == 0` không có đối chứng dương cho chính phép đo**
  Người dùng thấy gì: Một phép kiểm tự động về việc nhả khoá chưa được chứng minh là đo đúng, nên có thể xanh dù lỗi có thật. Người dùng cuối không thấy gì.
  Căn cứ: Rất nhẹ: chỉ là độ chặt của một phép kiểm nội bộ, không ảnh hưởng dữ liệu hay người dùng, tự sửa được khi chạm lại.
  file: `pipeline/scripts/luoc-do-rieng.test.mjs`
  severity: low
  Đề xuất: known-limits

- **Hình dạng 4 (âm tính một mình): `giao_dich_nay_ghi = false` không có đối chứng dương, và thông điệp deadlock không thể hiện ra trong đúng lỗi nó canh (r3)**
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

- **Hình dạng 5 (tuyên quét lớp nhưng chỉ có điểm-case): «mọi giá trị in đi qua chặn số» chỉ phá thử veDong, bỏ sót hai đường in khác của doTrenDb (r2)**
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

- **Hình dạng 1 (đo chỉ dẫn thay vì đầu ra): chiều đỏ SG-AC-1 phá bản chép luật trong test, không phá mã thật (r1)**
  Người dùng thấy gì: Một ca kiểm âm của luật ghép người có thể vẫn xanh dù luật thật bị sửa sai. Việc phát hiện lỗi về sau yếu hơn bảng nghiệm thu mô tả.
  Căn cứ: Hành vi thật vẫn được ca kiểm dương bảo vệ và không ảnh hưởng người dùng; chỉ là lưới an toàn mỏng hơn, sửa sau rẻ.
  file: `pipeline/scripts/so-ghep-s06.test.mjs`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 2 (fixture viết tay đúng khuôn bên đọc): ô S03, S05 chèn thẳng cột trong khi E1 hứa ghi bằng đường nạp của nguồn (r1)**
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

⚠ Cụm ngoài vùng phủ: 7/7 lỗi rơi vào file không bộ đo nào phủ (pipeline/lib/luoc-do-rieng.mjs, _acceptance/so-ghep-s06-nhan-danh-ba/evidence-page.html, pipeline/scripts/luoc-do-rieng.test.mjs) — dừng và quyết: mở rộng hợp đồng hay rút phạm vi.
