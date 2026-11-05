# Review findings: anh-tren-the-gan-nhan (round 2)

## Trong hợp đồng

- **Hình dạng 4: «ok fixture chi example.test» chỉ thấy dạng có scheme, trong khi chính tệp đo có tên miền trần khác, và không có đối chứng**
  AC: AC-7
  file: `_acceptance/anh-tren-the-gan-nhan/probes/kin.mjs:37`
  severity: medium
  source: measurement
  detail: Dòng 37 lấy tên máy bằng `/https?:\/\/([a-z0-9.-]+)/gi`, rồi dòng 38 assert `urlFixture.length === 0` và in 'fixture chi example.test'. labels-anh.test.ts có fixture tên miền trần ngoài example.test: `khac.com.vn/a` (dòng 28), `khac.${duoi}/a` với 10 đuôi, tức khac.com, khac.net, khac.io... (dòng 30), và `cdn.khac.me/a` (dòng 31). Các chuỗi này không có scheme nên phép đo không thấy, và dòng 'ok' đang nói sai về chính tệp nó quét. AC-7 hứa «fixture dùng ảnh giả và example.test». Đối chứng ở dòng 40-42 chỉ thử hàm `quet`, không thử `urlFixture`, nên phép âm tính này không có đối chứng dương.

- **Hình dạng 5: tuyên quét cả hồ sơ và ảnh chứng nhưng loại mọi tệp ảnh khỏi phép quét**
  AC: AC-7
  file: `_acceptance/anh-tren-the-gan-nhan/probes/kin.mjs:34`
  severity: medium
  source: measurement
  detail: AC-7 ghi «Given mã, hồ sơ, ảnh chứng, When quét», và dòng 1 của kin.mjs ghi «không vào kho hay ảnh chứng». Dòng 34 lại lọc `!/\.(png|jpe?g|webp)$/i.test(p)`, nên 9 tệp PNG trong evidence/ (E4 có 4, E10 có 3, E11 có 2) không được quét. Dòng 26 quét `git diff`, nên tệp nhị phân chỉ hiện «Binary files differ». 'ok ho so khong co ten mien nguon' vì thế chỉ phủ phần chữ của lớp nó tuyên bố. Ngoài ra, chỉ bước 2 của E4 trong evals.yaml ghi soi chữ trên trang của E4-step1. E10 và E11 không có bước nào thay cho phần ảnh chứng bị bỏ. Kết quả có thể đúng vì seed dùng dữ liệu giả, nhưng máy chưa đo điều đó.

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **Đầu migration 075 thiếu tài liệu nguồn theo luật migration**
  Người dùng thấy gì: Người dùng không thấy gì khác: màn gắn nhãn chạy bình thường. Chỉ người đọc tệp cấu trúc dữ liệu sau này sẽ mất công tìm tài liệu thiết kế đi kèm.
  Căn cứ: Hậu quả rất nhẹ, không mất hay lộ dữ liệu, và người bảo trì tự tìm được tài liệu; sửa sau cũng rẻ nhưng không đáng mở việc riêng.
  file: `db/migrations/075_labels_can_cu_anh.sql`
  severity: low
  Đề xuất: wont-fix

- **Link dạng zalo.me/<SĐT> bị xoá khỏi chữ hiện, số điện thoại mất khỏi thẻ mà không có dấu hiệu nào**
  Người dùng thấy gì: Khi bài rao dán số điện thoại dưới dạng đường link Zalo, thẻ không còn hiện số đó. Người gắn nhãn có thể chọn «không suy ra được» cho ô SĐT người bán dù bài có nêu số.
  Căn cứ: Gặp ít (2 trên 367 bài đo được) nhưng nhãn sai khó phát hiện sau khi lưu; chữ gốc vẫn còn nguyên nên không mất dữ liệu, và việc giữ số trong link cần được quyết như một hành vi mới.
  file: `app/src/lib/labels-anh.ts`
  severity: medium
  Đề xuất: known-limits

- **Ảnh trong hộp xem lớn hỏng thì không báo lỗi và không có Thử lại**
  Người dùng thấy gì: Nếu ảnh không tải được lúc bấm xem lớn, người gắn chỉ thấy ảnh vỡ mà không có câu báo hay nút Thử lại, dù ô ảnh nhỏ bên ngoài đang hiện bình thường.
  Căn cứ: Chỉ làm người gắn mất một lần bấm; đóng hộp rồi mở lại hoặc tải lại trang là xong, không mất hay lộ dữ liệu, và nhãn vẫn lưu được.
  file: `app/src/components/ops/labels/anh-bai.tsx`
  severity: low
  Đề xuất: known-limits

- **Hình dạng 4: âm tính một mình, «phan hoi khong lo url» chỉ quét header của Response do chính fake dựng và không đọc thân**
  Người dùng thấy gì: Bằng chứng kiểm tra rằng địa chỉ ảnh gốc không lộ ra trình duyệt còn lỏng; nếu sau này có thay đổi làm lộ địa chỉ trong nội dung phản hồi, bài kiểm tra này có thể vẫn báo xanh.
  Căn cứ: Hiện chưa có lộ thật, chỉ là lưới an toàn mỏng; không ảnh hưởng người dùng hôm nay và có thể siết lại sau mà không cần đổi sản phẩm.
  file: `app/tests/labels-anh.test.ts`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 1 kèm 4: «lay ho khong ghi dia» grep mã nguồn thay vì đo đầu ra, và không có đối chứng dương**
  Người dùng thấy gì: Chưa có dấu hiệu ảnh lấy hộ bị ghi vào kho ảnh gốc, nhưng bài kiểm tra chứng minh điều đó mới ở mức đọc mã, chưa đo trực tiếp.
  Căn cứ: Nếu sau này có ghi nhầm vào kho ảnh gốc thì hậu quả nặng, nhưng hiện chưa thấy xảy ra; siết phép đo là việc rẻ, làm khi có dịp.
  file: `app/tests/labels-anh.test.ts`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 4: «lay ho du 84» không thể đỏ riêng và không có chặn dưới, đường lấy hộ hỏng toàn bộ vẫn xanh**
  Người dùng thấy gì: Nếu đường lấy ảnh hộ hỏng hoàn toàn, phép đo trên dữ liệu thật vẫn có thể báo đạt dù không lấy được ảnh nào; người duyệt phải tự đọc số in ra mới thấy.
  Căn cứ: Số liệu vẫn được in nên người duyệt phát hiện được bằng mắt; không mất hay lộ dữ liệu, chỉ là thiếu một chốt chặn tự động.
  file: `_acceptance/anh-tren-the-gan-nhan/probes/that.mjs`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 4: expected của E4 vẫn trỏ «giá trị mồi của E6», mà trên DB seed các mồi đó luôn bằng 0**
  Người dùng thấy gì: Người chấm đọc tiêu chí kiểm tra có thể đối chiếu với bộ giá trị mồi cũ nên luôn đếm ra 0, dễ hiểu nhầm là đã sạch dù chưa thật sự soi đúng bộ mồi.
  Căn cứ: Chỉ làm bước chấm có thể gây hiểu nhầm, không ảnh hưởng người dùng cuối; sửa một câu chữ là xong, không gấp.
  file: `_acceptance/anh-tren-the-gan-nhan/evals.yaml`
  severity: low
  Đề xuất: known-limits

- **Hình dạng 1: đối chứng của E2 đo closure tự viết trên chuỗi literal, không đo kết quả xuống trình duyệt**
  Người dùng thấy gì: Một bài kiểm tra ghi là bảo vệ việc không lộ địa chỉ ảnh gốc thực ra chưa chạm vào dữ liệu thật; nếu sau này bị lộ, bài này vẫn xanh nhưng một bài đo khác sẽ bắt.
  Căn cứ: Đã có lớp đo thứ hai bắt được, nên rủi ro thấp; chỉ cần ghi rõ giới hạn.
  file: `app/tests/labels-anh.test.ts`
  severity: low
  Đề xuất: known-limits

- **Hình dạng 5: thước «0 bài còn tên miền» dùng cùng danh sách đuôi đóng với LINK, nên lớp «dạng tên miền» chỉ đo được phần mã đã biết**
  Người dùng thấy gì: Nếu bài mới chứa tên miền với đuôi lạ như .shop hay .xyz, thẻ có thể vẫn hiện tên miền đó trong chữ và phép đo không phát hiện.
  Căn cứ: Hiện không bài nào gặp và chỉ là tên miền hiện ra chữ chứ không mất dữ liệu; người gắn thấy ngay trên thẻ nên xử lý dễ.
  file: `_acceptance/anh-tren-the-gan-nhan/probes/that.mjs`
  severity: low
  Đề xuất: known-limits

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).
