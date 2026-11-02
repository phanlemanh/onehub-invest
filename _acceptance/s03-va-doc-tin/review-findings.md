# Review findings: s03-va-doc-tin (round 1)

## Trong hợp đồng

- **block_raw bị viết hoa, trái AC-8 và docstring «giữ nguyên chữ môi giới»**
  file: `pipeline/transform-zalo.mjs:288`
  severity: medium
  AC: AC-8
  source: conventions
  detail: AC-8 yêu cầu phát biểu block_raw, unit_number «giữ nguyên chữ môi giới», và docstring phatBieuToaTruc trong pipeline/lib/assert.mjs cũng ghi vậy. docToaTruc lại trả toà qua .toUpperCase() ở cả ba nhánh có viết hoa (dòng 288, 292, 295), còn unit giữ nguyên. Chạy thật: docToaTruc("Bán pr6.12.20 2PN 3 tỷ") ra {block:"PR6", unit:"pr6.12.20"}, và "toà gh2" ra block "GH2". Như vậy cặp phát biểu của cùng một bài không nhất quán, và cột *_raw nhận giá trị đã chuẩn hoá. Ca AC-8 trong va-doc-tin.itest.mjs chỉ dùng chữ hoa nên không bắt được. Khi so trùng đã có toUpperCase riêng (repostKey, thước), nên chuẩn hoá nên nằm ở chỗ so sánh; hoặc phải sửa AC-8 và docstring theo hành vi thật.

- **Hình dạng 3 — Assert «≥ trên bộ đếm toàn kho» trong khi lời hứa là quan hệ giữa từng bài và lý do bị gạt**
  file: `pipeline/scripts/va-doc-tin.itest.mjs:71`
  severity: high
  AC: AC-5
  source: measurement
  detail: AC-5 hứa các bài sau không thành tin «và đếm đúng lý do»; E5 ghi «bộ đếm gọi tên thue-tu-1-ty, ban-tren-100-ty». Dòng 71 chỉ assert `r.loaiGiaPhiLy["thue-tu-1-ty"] >= 3 && r.loaiGiaPhiLy["ban-tren-100-ty"] >= 1`, trên bộ đếm của cả lượt transform. DB thử là bản chép toàn bộ `oneinvest` (`db/db-thu.sh`, và chú thích đầu itest cũng nói transform đọc toàn bộ bài thật). Đếm chỉ đọc trên DB chung bằng bộ đọc của cây: 51442 bài thật đã cho sẵn thue-tu-1-ty = 37, ban-tren-100-ty = 1, nghĩa là hai ngưỡng đạt ngay cả khi không có bài dựng nào của ca. Assert này không nối được bài dựng với lý do của nó. Không có số đếm trước lượt để so chênh lệch.

- **Hình dạng 4 — Âm tính một mình: `tinCua(...) === null` không ghim lý do bị gạt**
  file: `pipeline/scripts/va-doc-tin.itest.mjs:69`
  severity: medium
  AC: AC-5
  source: measurement
  detail: Vòng lặp dòng 68-70 chỉ assert bốn bài («/tháng», «/th», «/năm», «bán 120 tỷ») không có tin. Null còn có thể đến từ nguyên nhân khác: `suyLoai` không ra loại, bài bị coi là bài thử, hay confidence low. Bộ đếm dòng 71 là chỗ duy nhất có thể chứng lý do, nhưng nó bị dữ liệu thật lấp đầy (37 và 1). Không có đối chứng dương theo bài chứng rằng từng bài đi tới `lyDoGiaPhiLy` với đúng lý do, ví dụ gọi `lyDoGiaPhiLy` trên kết quả đọc của chính chữ đó. Ca thuần `SV1-AC-5` chỉ chốt một object viết tay `{ kind: "rent_lt", priceVnd: 1e9 }` và không có dòng nào cho `ban-tren-100-ty`.

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **Thước so-gia-ty-chan-dong không còn đỏ được vì giá: nhánh kiểm giá thành hằng đúng**
  Người dùng thấy gì: Phép kiểm cũ về giá tỷ chẵn giờ chỉ còn bắt được lỗi số điện thoại. Nếu giá của loại bài này bị đọc sai thì phép kiểm vẫn báo đạt.
  Căn cứ: Không làm sai dữ liệu người dùng đang xem, chỉ làm một phép kiểm nội bộ yếu đi; ghi lại là đủ, sửa sau cũng không đắt.
  file: `pipeline/scripts/so-gia-ty-chan-dong.mjs`
  severity: medium
  Đề xuất: known-limits

- **Sửa thước E6 của hai hồ sơ đã ký nhưng không cập nhật evals, hợp đồng vẫn mô tả phép đo cũ**
  Người dùng thấy gì: Hồ sơ nghiệm thu cũ vẫn ghi phép đo rộng hơn thực tế đang chạy. Người đọc hồ sơ có thể tưởng nó kiểm nhiều hơn mức thật.
  Căn cứ: Chỉ là giấy tờ lệch với thực tế, người dùng cuối không bị ảnh hưởng và có thể chỉnh lại bất cứ lúc nào với chi phí thấp.
  file: `pipeline/scripts/so-gia-ty-sau-khoang-trang.mjs`
  severity: medium
  Đề xuất: known-limits

- **Comment ghi «Mạnh duyệt 02/11» cho việc sửa thước đã ký, nhưng hồ sơ không có dấu vết duyệt**
  Người dùng thấy gì: Chú thích trong mã nói Mạnh đã duyệt việc nới phép kiểm, nhưng hồ sơ không có bằng chứng người duyệt đúng việc đó. Dấu vết duyệt vì thế có thể gây hiểu nhầm.
  Căn cứ: Không ảnh hưởng dữ liệu hay người dùng cuối; chỉ cần người ký xác nhận hoặc sửa lại câu chữ, sửa rất rẻ.
  file: `pipeline/scripts/so-gia-ty-chan-dong.mjs`
  severity: medium
  Đề xuất: known-limits

- **docDanhSachPhuong chen giữa JSDoc và runTransformZalo; đường đo dùng bản đọc phường riêng**
  Người dùng thấy gì: Một đoạn mã được đặt sai chỗ nên tài liệu trong mã gắn nhầm hàm, và phép đo dùng bản đọc phường riêng. Người dùng cuối không thấy khác gì.
  Căn cứ: Chỉ là chuyện gọn gàng của mã, không đổi kết quả cho người dùng; sửa thì tốn công mà lợi ích nhỏ.
  file: `pipeline/transform-zalo.mjs`
  severity: low
  Đề xuất: wont-fix

- **chinhLoaiThueTy dò «/tháng» trên toàn bài nên bài bán có tiền thuê theo tháng vẫn bị gạt là thuê từ 1 tỷ**
  Người dùng thấy gì: Tin bán căn đang cho thuê, ghi kèm tiền thuê hàng tháng, có thể bị coi là tin cho thuê giá cao rồi bỏ mất. Khoảng 35 bài thật bị ảnh hưởng, trong đó 11 bài trước đây còn hiện.
  Căn cứ: Mất tin thật nhưng số lượng nhỏ trên tổng hơn 51 nghìn bài và sẽ lấy lại được khi sửa rồi chạy lại; nên làm thành việc riêng có ca thử đúng.
  file: `pipeline/transform-zalo.mjs`
  severity: medium
  Đề xuất: new-contract

- **Từ ngữ cảnh «vay» bắt cả «không vay», «ko vay» nên giá thật bị bỏ và tin biến mất**
  Người dùng thấy gì: Bài ghi «không vay» kèm giá bán thật bị bỏ giá, nên không thành tin. Khoảng 89 bài thật mất giá, phần lớn từ một nội dung đăng đi đăng lại.
  Căn cứ: Mất tin thật nhưng chỉ vài nội dung khác nhau, không làm sai số liệu đang hiển thị và lấy lại được sau khi sửa; xứng đáng một việc riêng.
  file: `pipeline/transform-zalo.mjs`
  severity: medium
  Đề xuất: new-contract

- **TOA_DUOI_SO coi mọi «<toà>.<2 số>» là tên toà, nên block_raw sai ở khu không đặt tên kiểu đó**
  Người dùng thấy gì: Một số mã căn như PR2.07 bị lưu cả cụm làm tên toà, nên cùng một toà có hai tên và mất mã căn. Khoảng 199 bài thật bị ảnh hưởng.
  Căn cứ: Sai ở lớp thông tin phụ của khoảng 199 bài, không làm mất tin, và chỉnh lại được khi chạy lại sau này.
  file: `pipeline/transform-zalo.mjs`
  severity: medium
  Đề xuất: known-limits

- **Phần giá của so-gia-ty-chan-dong không còn trượt được nhưng vẫn in «mọi bài đổi giá là giá tỷ chẵn»**
  Người dùng thấy gì: Phép kiểm cũ về giá tỷ chẵn luôn báo đạt phần giá và vẫn in câu khẳng định như thể đã đo. Kết quả này có thể làm người đọc yên tâm sai.
  Căn cứ: Chỉ làm một báo cáo nội bộ kém tin cậy, không đụng dữ liệu người dùng; ghi nhận rồi sửa sau là đủ.
  file: `pipeline/scripts/so-gia-ty-chan-dong.mjs`
  severity: medium
  Đề xuất: known-limits

- **docGiaChe bỏ qua chữ «triệu» sau số che có dấu, đọc thành tỷ rồi đổi tin thuê thành tin bán**
  Người dùng thấy gì: Bài cho thuê ghi giá che kiểu «7.5x triệu» có thể bị đọc thành tin bán 7,5 tỷ. Hiện chưa thấy bài thật nào dính.
  Căn cứ: Chưa có bài thật nào bị, khả năng xảy ra thấp và nếu có thì chỉ vài tin, có thể sửa khi gặp.
  file: `pipeline/transform-zalo.mjs`
  severity: low
  Đề xuất: known-limits

- **Luật hướng AC-3 bị vượt qua bằng biến thể slug không dấu «tay nam»**
  Người dùng thấy gì: Bài viết không dấu kiểu «hướng tay nam» vẫn có thể bị gán nhầm vào phường Tây Nam. Hiện không có bài thật nào dính.
  Căn cứ: Chưa có bài thật nào dính, nếu có chỉ gán nhầm vài tin vào một phường và sửa được khi chạy lại.
  file: `pipeline/transform-zalo.mjs`
  severity: low
  Đề xuất: known-limits

- **Hình dạng 2 — Fixture viết tay đúng khuôn bên đọc: ca khoá gom ghi `ma: []`, không rút từ parsePost**
  Người dùng thấy gì: Hai bài đăng cùng một căn nhưng khác chữ hoa chữ thường có thể bị tính thành hai tin riêng. Ca kiểm hiện tại không phát hiện điều này.
  Căn cứ: Tối đa gây trùng một số tin đăng lại, người dùng thấy được và không mất dữ liệu; sửa sau không đắt.
  file: `pipeline/scripts/va-doc-tin.test.mjs`
  severity: high
  Đề xuất: known-limits

- **Hình dạng 4 — Âm tính một mình: thước `hai_truc` không có đối chứng dương, bản nền luôn đạt**
  Người dùng thấy gì: Phép đo «không tin nào mang hai trục» chưa từng được chứng minh là có thể báo đỏ. Con số 0 vì thế chưa chắc phản ánh chất lượng thật.
  Căn cứ: Chỉ làm một phép đo nội bộ kém chắc chắn, không đổi gì với người dùng và có thể bổ sung đối chứng sau.
  file: `pipeline/scripts/do-va-doc-tin.mjs`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 4 — Âm tính một mình: nửa giá của thước so-gia-ty-chan-dong không thể đỏ sau khi sửa**
  Người dùng thấy gì: Phần kiểm giá của phép đo giá tỷ chẵn không thể báo lỗi nữa, kể cả khi giá bị đổi sai. Chỉ còn phần kiểm số điện thoại hoạt động.
  Căn cứ: Là điểm yếu của một phép kiểm nội bộ, không làm sai dữ liệu hiển thị; ghi nhận rồi sửa sau là hợp lý.
  file: `pipeline/scripts/so-gia-ty-chan-dong.mjs`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 4 — Âm tính một mình: ca đỏ CM-AC-1 mới chỉ `notEqual` trên dòng SĐT, các dòng URL không còn cắn**
  Người dùng thấy gì: Ca thử về việc bỏ đường dẫn khỏi giá chỉ còn bắt được lỗi ở số điện thoại. Nếu phần gạt đường dẫn hỏng thì ca thử không báo.
  Căn cứ: Chỉ làm một ca thử cũ yếu đi, người dùng không bị ảnh hưởng ngay và sửa sau không đắt.
  file: `pipeline/scripts/cam-mau-s03.test.mjs`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 5 — Tuyên «số assert bằng số dòng» nhưng ma trận không ghim số phần tử**
  Người dùng thấy gì: Nếu ai đó lỡ xoá một dòng trong bảng ca thử thì các kiểm tra vẫn xanh. Một dòng kiểm quan trọng có thể mất mà không ai hay.
  Căn cứ: Chỉ làm bảng kiểm dễ bị bớt dòng âm thầm, không đổi dữ liệu người dùng; thêm số đếm sau là việc rẻ.
  file: `_acceptance/s03-va-doc-tin/evals.yaml`
  severity: medium
  Đề xuất: known-limits

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).
