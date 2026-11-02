# Review findings: s03-va-doc-tin (round 2)

## Trong hợp đồng

- **Luật số ngữ cảnh AC-4 không áp cho giá viết bằng đồng: số «cắt», «vay», «đã vào» vẫn thành giá**
  AC: AC-4
  file: `pipeline/transform-zalo.mjs:341`
  severity: low
  source: bugs
  detail: khopGia và laSoNguCanh chỉ bọc GIA_TY_LE, GIA_TY, GIA_TR_LE, GIA_TRIEU_SO. Dòng 341 vẫn gọi so.match(GIA_DONG) không qua kiểm ngữ cảnh. Chạy thật: «Bán căn cắt 450.000.000» ra 450.000.000, «Bán căn vay 1.400.000.000» ra 1.400.000.000, «Bán căn đã vào 800.000.000» ra 800.000.000, trong khi AC-4 yêu cầu «chữ chỉ có số ngữ cảnh ra null», và bản viết «800tr» đã ra null. Ma trận BANG_NGU_CANH chỉ thử dạng tr/tỷ nên không bắt được. Dữ liệu thật: 1 bài khớp, và đó là bài Yêu cầu nên không thành tin ở đường chạy thật.

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **Câu SQL kiểm «tin mang hai trục» so chữ thô, trong khi khoá gom và bộ phân xử không phân biệt hoa thường**
  Người dùng thấy gì: Phép kiểm tự động có thể báo nhầm «có tin mang hai trục» khi một tin có hai bài đăng lại khác nhau về chữ hoa/thường. Người dùng không thấy dữ liệu sai, chỉ có thể gặp một lần kiểm đỏ giả.
  Căn cứ: Chỉ ảnh hưởng một phép kiểm nội bộ, không làm sai hay mất dữ liệu nào, và hôm nay đo trên bài thật chưa lần nào đỏ; nếu đỏ giả thì người làm tự nhận ra và sửa rẻ.
  file: `pipeline/scripts/va-doc-tin.itest.mjs`
  severity: low
  Đề xuất: known-limits

- **Phát biểu parser block_raw/unit_number không được rút khi bộ đọc thôi đọc ra giá trị, nên giá trị cũ thắng LLM mãi**
  Người dùng thấy gì: Nếu sau này luật đọc được sửa khiến một mã căn hay toà không còn đọc ra nữa, tin rao vẫn giữ mã hoặc toà cũ sai mà không có cảnh báo nào. Người xem tin có thể thấy số căn hoặc tên toà không còn đúng với bài.
  Căn cứ: Chưa có dữ liệu sai nào hôm nay và chỉ lộ khi sửa luật đọc hoặc bài đổi chữ, nhưng khi xảy ra thì sai âm thầm, người dùng không tự gỡ được, và ghi chú hạn chế hiện nói «chạy lại là chỉnh được», điều này không đúng.
  file: `pipeline/lib/assert.mjs`
  severity: medium
  Đề xuất: new-contract

- **Bài cho thuê giá ghi theo năm dạng «mỗi năm», «1 năm», «/1 năm» bị đổi thành tin bán**
  Người dùng thấy gì: Một bài cho thuê ghi giá theo năm bằng chữ như «1,2 tỷ mỗi năm» có thể bị coi là tin bán giá 1,2 tỷ và hiện trên danh sách bán. Hiện chưa có bài thật nào viết như vậy.
  Căn cứ: Đo trên hơn 51 nghìn bài thật không có bài nào rơi vào dạng này nên chưa ai bị ảnh hưởng, và nếu xuất hiện thì chỉ là vài tin lẻ, người vận hành loại tay được.
  file: `pipeline/transform-zalo.mjs`
  severity: low
  Đề xuất: known-limits

- **Giá không đơn vị kèm «net» và giá che số trong tin thuê được đọc theo thang bán, rồi tin bị đổi thành tin bán**
  Người dùng thấy gì: Một số bài cho thuê có giá viết kiểu «12000 net» hoặc «8.5x» có thể bị hiểu thành bán nhà giá hàng tỷ. Người xem sẽ thấy một tin bán với giá cao sai hẳn so với thực tế.
  Căn cứ: Trong dữ liệu thật chưa có bài thuê nào viết đúng dạng này, các bài bị đổi loại xem được đều là bài bán thật, nên hậu quả hiện chỉ là nguy cơ, và tin sai nếu có thì người vận hành gỡ tay được.
  file: `pipeline/transform-zalo.mjs`
  severity: low
  Đề xuất: known-limits

- **Giá che hai chữ số một dấu x kèm «tỷ» bị đọc thành trăm triệu: «25x tỷ» ra 250 triệu**
  Người dùng thấy gì: Một bài bán ghi giá che kiểu «25x tỷ» có thể hiện giá chỉ khoảng 250 triệu, thấp hơn rất nhiều so với giá thật. Người xem sẽ thấy căn đó rẻ bất thường.
  Căn cứ: Chưa có bài thật nào viết dạng này, và nếu có thì tin giá thấp bất thường dễ bị người vận hành phát hiện và loại; chưa có dữ liệu sai nào ra ngoài.
  file: `pipeline/transform-zalo.mjs`
  severity: low
  Đề xuất: known-limits

- **Hình dạng 3 — Lời hứa «đúng 1 tỷ thành tin bán đúng giá» là quan hệ bài→giá, nhưng chỉ assert kind**
  Người dùng thấy gì: Phép kiểm tự động chưa khẳng định giá của bài cho thuê đúng 1 tỷ sau khi đổi thành tin bán; nếu giá ở biên này bị đọc sai thì phép kiểm vẫn xanh. Hiện không có bằng chứng giá thật bị sai.
  Căn cứ: Không có dữ liệu sai nào được chỉ ra, chỉ là lưới kiểm chưa phủ hết một giá trị biên hiếm gặp; thêm một dòng kiểm sau này rất rẻ và không ảnh hưởng người dùng.
  file: `pipeline/scripts/va-doc-tin.itest.mjs`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 3 — Thước dt_phay hứa quan hệ «DT = số có phẩy» nhưng ngưỡng `< 15` loại mọi lỗi đọc hai chữ số lẻ**
  Người dùng thấy gì: Phép đo chất lượng diện tích có thể không bắt được lỗi nếu sau này diện tích dạng «63,45m2» bị đọc sai thành 45. Hiện diện tích những bài như vậy vẫn đọc đúng.
  Căn cứ: Không có diện tích nào đang sai, chỉ là thước đo chưa cắn hết mọi dạng lỗi trong tương lai; bốn bài thật dạng này đều đọc đúng nên người dùng chưa chịu hậu quả.
  file: `pipeline/scripts/do-va-doc-tin.mjs`
  severity: medium
  Đề xuất: known-limits

- **Thước so-gia-ty-chan-dong không còn đỏ được vì giá: nhánh kiểm giá thành hằng đúng (r1)**
  Người dùng thấy gì: Phép kiểm cũ về giá tỷ chẵn giờ chỉ còn bắt được lỗi số điện thoại. Nếu giá của loại bài này bị đọc sai thì phép kiểm vẫn báo đạt.
  Căn cứ: Không làm sai dữ liệu người dùng đang xem, chỉ làm một phép kiểm nội bộ yếu đi; ghi lại là đủ, sửa sau cũng không đắt.
  file: `pipeline/scripts/so-gia-ty-chan-dong.mjs`
  severity: medium
  Đề xuất: known-limits

- **Sửa thước E6 của hai hồ sơ đã ký nhưng không cập nhật evals, hợp đồng vẫn mô tả phép đo cũ (r1)**
  Người dùng thấy gì: Hồ sơ nghiệm thu cũ vẫn ghi phép đo rộng hơn thực tế đang chạy. Người đọc hồ sơ có thể tưởng nó kiểm nhiều hơn mức thật.
  Căn cứ: Chỉ là giấy tờ lệch với thực tế, người dùng cuối không bị ảnh hưởng và có thể chỉnh lại bất cứ lúc nào với chi phí thấp.
  file: `pipeline/scripts/so-gia-ty-sau-khoang-trang.mjs`
  severity: medium
  Đề xuất: known-limits

- **Comment ghi «Mạnh duyệt 02/11» cho việc sửa thước đã ký, nhưng hồ sơ không có dấu vết duyệt (r1)**
  Người dùng thấy gì: Chú thích trong mã nói Mạnh đã duyệt việc nới phép kiểm, nhưng hồ sơ không có bằng chứng người duyệt đúng việc đó. Dấu vết duyệt vì thế có thể gây hiểu nhầm.
  Căn cứ: Không ảnh hưởng dữ liệu hay người dùng cuối; chỉ cần người ký xác nhận hoặc sửa lại câu chữ, sửa rất rẻ.
  file: `pipeline/scripts/so-gia-ty-chan-dong.mjs`
  severity: medium
  Đề xuất: known-limits

- **docDanhSachPhuong chen giữa JSDoc và runTransformZalo; đường đo dùng bản đọc phường riêng (r1 · tệp đã đổi)**
  Người dùng thấy gì: Một đoạn mã được đặt sai chỗ nên tài liệu trong mã gắn nhầm hàm, và phép đo dùng bản đọc phường riêng. Người dùng cuối không thấy khác gì.
  Căn cứ: Chỉ là chuyện gọn gàng của mã, không đổi kết quả cho người dùng; sửa thì tốn công mà lợi ích nhỏ.
  file: `pipeline/transform-zalo.mjs`
  severity: low
  Đề xuất: wont-fix

- **chinhLoaiThueTy dò «/tháng» trên toàn bài nên bài bán có tiền thuê theo tháng vẫn bị gạt là thuê từ 1 tỷ (r1 · tệp đã đổi)**
  Người dùng thấy gì: Tin bán căn đang cho thuê, ghi kèm tiền thuê hàng tháng, có thể bị coi là tin cho thuê giá cao rồi bỏ mất. Khoảng 35 bài thật bị ảnh hưởng, trong đó 11 bài trước đây còn hiện.
  Căn cứ: Mất tin thật nhưng số lượng nhỏ trên tổng hơn 51 nghìn bài và sẽ lấy lại được khi sửa rồi chạy lại; nên làm thành việc riêng có ca thử đúng.
  file: `pipeline/transform-zalo.mjs`
  severity: medium
  Đề xuất: new-contract

- **Từ ngữ cảnh «vay» bắt cả «không vay», «ko vay» nên giá thật bị bỏ và tin biến mất (r1 · tệp đã đổi)**
  Người dùng thấy gì: Bài ghi «không vay» kèm giá bán thật bị bỏ giá, nên không thành tin. Khoảng 89 bài thật mất giá, phần lớn từ một nội dung đăng đi đăng lại.
  Căn cứ: Mất tin thật nhưng chỉ vài nội dung khác nhau, không làm sai số liệu đang hiển thị và lấy lại được sau khi sửa; xứng đáng một việc riêng.
  file: `pipeline/transform-zalo.mjs`
  severity: medium
  Đề xuất: new-contract

- **TOA_DUOI_SO coi mọi «<toà>.<2 số>» là tên toà, nên block_raw sai ở khu không đặt tên kiểu đó (r1 · tệp đã đổi)**
  Người dùng thấy gì: Một số mã căn như PR2.07 bị lưu cả cụm làm tên toà, nên cùng một toà có hai tên và mất mã căn. Khoảng 199 bài thật bị ảnh hưởng.
  Căn cứ: Sai ở lớp thông tin phụ của khoảng 199 bài, không làm mất tin, và chỉnh lại được khi chạy lại sau này.
  file: `pipeline/transform-zalo.mjs`
  severity: medium
  Đề xuất: known-limits

- **Phần giá của so-gia-ty-chan-dong không còn trượt được nhưng vẫn in «mọi bài đổi giá là giá tỷ chẵn» (r1)**
  Người dùng thấy gì: Phép kiểm cũ về giá tỷ chẵn luôn báo đạt phần giá và vẫn in câu khẳng định như thể đã đo. Kết quả này có thể làm người đọc yên tâm sai.
  Căn cứ: Chỉ làm một báo cáo nội bộ kém tin cậy, không đụng dữ liệu người dùng; ghi nhận rồi sửa sau là đủ.
  file: `pipeline/scripts/so-gia-ty-chan-dong.mjs`
  severity: medium
  Đề xuất: known-limits

- **docGiaChe bỏ qua chữ «triệu» sau số che có dấu, đọc thành tỷ rồi đổi tin thuê thành tin bán (r1 · tệp đã đổi)**
  Người dùng thấy gì: Bài cho thuê ghi giá che kiểu «7.5x triệu» có thể bị đọc thành tin bán 7,5 tỷ. Hiện chưa thấy bài thật nào dính.
  Căn cứ: Chưa có bài thật nào bị, khả năng xảy ra thấp và nếu có thì chỉ vài tin, có thể sửa khi gặp.
  file: `pipeline/transform-zalo.mjs`
  severity: low
  Đề xuất: known-limits

- **Luật hướng AC-3 bị vượt qua bằng biến thể slug không dấu «tay nam» (r1 · tệp đã đổi)**
  Người dùng thấy gì: Bài viết không dấu kiểu «hướng tay nam» vẫn có thể bị gán nhầm vào phường Tây Nam. Hiện không có bài thật nào dính.
  Căn cứ: Chưa có bài thật nào dính, nếu có chỉ gán nhầm vài tin vào một phường và sửa được khi chạy lại.
  file: `pipeline/transform-zalo.mjs`
  severity: low
  Đề xuất: known-limits

- **Hình dạng 2 — Fixture viết tay đúng khuôn bên đọc: ca khoá gom ghi `ma: []`, không rút từ parsePost (r1 · tệp đã đổi)**
  Người dùng thấy gì: Hai bài đăng cùng một căn nhưng khác chữ hoa chữ thường có thể bị tính thành hai tin riêng. Ca kiểm hiện tại không phát hiện điều này.
  Căn cứ: Tối đa gây trùng một số tin đăng lại, người dùng thấy được và không mất dữ liệu; sửa sau không đắt.
  file: `pipeline/scripts/va-doc-tin.test.mjs`
  severity: high
  Đề xuất: known-limits

- **Hình dạng 4 — Âm tính một mình: thước `hai_truc` không có đối chứng dương, bản nền luôn đạt (r1 · tệp đã đổi)**
  Người dùng thấy gì: Phép đo «không tin nào mang hai trục» chưa từng được chứng minh là có thể báo đỏ. Con số 0 vì thế chưa chắc phản ánh chất lượng thật.
  Căn cứ: Chỉ làm một phép đo nội bộ kém chắc chắn, không đổi gì với người dùng và có thể bổ sung đối chứng sau.
  file: `pipeline/scripts/do-va-doc-tin.mjs`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 4 — Âm tính một mình: nửa giá của thước so-gia-ty-chan-dong không thể đỏ sau khi sửa (r1)**
  Người dùng thấy gì: Phần kiểm giá của phép đo giá tỷ chẵn không thể báo lỗi nữa, kể cả khi giá bị đổi sai. Chỉ còn phần kiểm số điện thoại hoạt động.
  Căn cứ: Là điểm yếu của một phép kiểm nội bộ, không làm sai dữ liệu hiển thị; ghi nhận rồi sửa sau là hợp lý.
  file: `pipeline/scripts/so-gia-ty-chan-dong.mjs`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 4 — Âm tính một mình: ca đỏ CM-AC-1 mới chỉ `notEqual` trên dòng SĐT, các dòng URL không còn cắn (r1)**
  Người dùng thấy gì: Ca thử về việc bỏ đường dẫn khỏi giá chỉ còn bắt được lỗi ở số điện thoại. Nếu phần gạt đường dẫn hỏng thì ca thử không báo.
  Căn cứ: Chỉ làm một ca thử cũ yếu đi, người dùng không bị ảnh hưởng ngay và sửa sau không đắt.
  file: `pipeline/scripts/cam-mau-s03.test.mjs`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 5 — Tuyên «số assert bằng số dòng» nhưng ma trận không ghim số phần tử (r1)**
  Người dùng thấy gì: Nếu ai đó lỡ xoá một dòng trong bảng ca thử thì các kiểm tra vẫn xanh. Một dòng kiểm quan trọng có thể mất mà không ai hay.
  Căn cứ: Chỉ làm bảng kiểm dễ bị bớt dòng âm thầm, không đổi dữ liệu người dùng; thêm số đếm sau là việc rẻ.
  file: `_acceptance/s03-va-doc-tin/evals.yaml`
  severity: medium
  Đề xuất: known-limits

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).
