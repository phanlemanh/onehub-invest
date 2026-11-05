# Review findings: anh-tren-the-gan-nhan (round 3)

## Trong hợp đồng

- **kin.mjs vẫn bỏ qua mọi tệp ảnh dù AC-7 và dòng đầu tệp nhận quét cả ảnh chứng; mục trong hợp đồng của lượt 2 chưa được xử lý**
  file: `_acceptance/anh-tren-the-gan-nhan/probes/kin.mjs:34`
  severity: medium
  AC: AC-7
  source: conventions
  detail: AC-7 ghi «Given mã, hồ sơ, ảnh chứng, When quét», dòng 1 của kin.mjs ghi «không vào kho hay ảnh chứng». Dòng 34 vẫn lọc `!/\.(png|jpe?g|webp)$/i`, còn dòng 26 dùng `git diff`, nên tệp nhị phân không có dòng chữ nào để quét. Vì vậy 9 PNG trong evidence/ không được máy đo, dù lượt chạy in 'ok ho so khong co ten mien nguon'. Commit 861108a4 có sửa kin.mjs nhưng chỉ xử lý mục fixture. Quyết định d-20261105T055419Z-13 không nhắc mục ảnh, dù run-log lượt 2 ghi mục này `inContract:true`. Trong evals.yaml, E4 bước 2 chỉ soi chữ trên trang và không soi ảnh chụp; E10, E11 không có bước nào thay thế. Đã mở 5 trong 9 ảnh (E10-step1, E10-step2, E11-step2, E4-step3, E4-step4) và không thấy tên miền, nên đây là lỗ đo, không phải rò rỉ đã xảy ra. Cần một trong hai: thêm bước soi ảnh có ghi nhận cho E10, E11, hoặc sửa lời khai ở dòng 1 và AC-7 cho đúng phạm vi đo.

- **E7 in «ok ho so khong co ten mien nguon» nhưng lặng lẽ bỏ qua mọi ảnh chứng (mục trong hợp đồng của round 2, round này vẫn chưa sửa)**
  file: `_acceptance/anh-tren-the-gan-nhan/probes/kin.mjs:34`
  severity: medium
  AC: AC-7
  source: bugs
  detail: AC-7 ghi «Given mã, hồ sơ, ảnh chứng, When quét». Dòng 1 của kin.mjs cũng ghi «không vào kho hay ảnh chứng». Dòng 34 vẫn lọc bỏ `.png/.jpg/.webp`, còn dòng 26 quét `git diff` nên tệp nhị phân không có dòng nào để quét. Dòng ok vì thế không phủ 9 PNG trong evidence/, mà không in gì báo phần bị bỏ. Commit 861108a4 chỉ sửa phép đo fixture (quyết định d-...-13), không đụng lỗ này. evals.yaml cũng chưa thêm bước đọc ảnh thay thế cho E10, E11: chỉ bước 2 của E4 soi chữ trên trang. Chưa thấy lộ thật: đọc E10-step1, E10-step2, E4-step3, E11-step2 và không thấy tên miền. Cái thiếu là phép đo: hoặc thêm bước đọc ảnh vào E10, E11, hoặc sửa lời AC-7 và dòng 1 cho đúng phạm vi đo được. Vẫn còn dòng ok nói rộng hơn phép đo.

- **Hình dạng 5: AC-7 tuyên quét cả ảnh chứng nhưng vẫn loại mọi tệp ảnh, kin.mjs đã sửa mà lỗ này còn nguyên**
  file: `_acceptance/anh-tren-the-gan-nhan/probes/kin.mjs:34`
  severity: medium
  AC: AC-7
  source: measurement
  detail: AC-7 ghi «Given mã, hồ sơ, ảnh chứng», dòng 1 của kin.mjs ghi «không vào kho hay ảnh chứng», và expected E7 (evals.yaml dòng 102) ghi «Quét cả tệp evidence/». Dòng 34 vẫn lọc `!/\.(png|jpe?g|webp)$/i.test(p)`, còn dòng 26 quét `git diff` nên tệp nhị phân chỉ hiện «Binary files differ». Vì vậy 9 PNG trong evidence/ nằm ngoài 'ok ho so khong co ten mien nguon'. Round 2 đã nêu lỗ này với inContract true, nhưng commit 861108a4 chỉ sửa phần fixture (decisions d-20261105T055419Z-13). Các bước E10, E11 trong evals.yaml vẫn không có ý kiểm tên miền trên ảnh; chỉ E4 bước 2 kiểm nội dung trang. Các ảnh đã mở không thấy tên miền nguồn, nhưng đó là nhìn tay, máy chưa đo.

- **Hình dạng 4: phép đếm mồi bằng 0 của E4 và đối chứng DB không để lại bản ghi nào trong bằng chứng**
  file: `_acceptance/anh-tren-the-gan-nhan/evals.yaml:42`
  severity: medium
  AC: AC-6
  source: measurement
  detail: Dòng 42 đòi curl phản hồi HTTP thật, đếm bốn mồi TOAMAYSEED, MOIASSERTSEED, MOIPROPSEED, rent_lt bằng 0, kèm đối chứng đọc DB thử thấy các mồi đó. Tại HEAD, grep `TOAMAYSEED|MOIPROPSEED` trong hồ sơ chỉ khớp evals.yaml và probes/seed.mjs. Observed của E4 trong evidence-report.md không nhắc curl hay mồi (grep `curl|mồi` ra 0 dòng), và evidence/E4-network.txt cũng không có, dù round 2 chấm E4 PASS sau khi bước này đã thêm ở 30e0a24e. `evidence_required` ở dòng 44 chỉ đòi `[run_id, screenshot, observed]`, không ghim số đếm hay đối chứng, nên lời hứa «phản hồi trang không có giá trị mồi» ở đường HTTP thật qua cổng mà không có giá trị quan sát nào. nap.mjs chỉ đo trên phần tử LabelsContent render trong tiến trình, không thay được đường này. Cùng lỗ ở E10: dòng 62 đòi «ghi số dòng eval_labels», observed của E10 không có số đó. Lưu ý: lúc đọc, E4-step1 và E4-step3 đang được chụp lại trong cây làm việc (chưa commit), nên nhận định này tính theo HEAD 861108a4.

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **Bước E10 đòi hai khổ màn hình nhưng chỉ đặt tên một tệp ảnh, khác mẫu mỗi khổ một tệp của E4**
  Người dùng thấy gì: Bằng chứng cho câu «Ảnh không tải được» trên màn hẹp như điện thoại không có ảnh riêng để người ký đối chiếu. Người dùng không bị ảnh hưởng trực tiếp, chỉ khó kiểm chứng việc câu chữ đọc trọn trên màn hẹp.
  Căn cứ: Chỉ ảnh hưởng cách lưu bằng chứng, không đổi gì ở màn người dùng, và chụp lại ở lượt chấm kế là xong, chi phí rất thấp.
  file: `_acceptance/anh-tren-the-gan-nhan/evals.yaml`
  severity: low
  Đề xuất: known-limits

- **E10 đòi đọc trọn câu ở cả khổ 1280 và 375 nhưng chỉ có một tệp ảnh; ảnh ở HEAD vẫn chụp lỗi cũ, cắt chữ, khổ 1870**
  Người dùng thấy gì: Ảnh chứng đang lưu còn chụp bản cũ bị cắt chữ «Ảnh không t…», và không có ảnh riêng cho màn hẹp. Người dùng thật không bị ảnh hưởng vì bản sửa đã có, chỉ hồ sơ nghiệm thu chưa phản ánh.
  Căn cứ: Là bằng chứng cũ sẽ tự được thay khi chấm lại; không mất dữ liệu, không ảnh hưởng người dùng, sửa gần như không tốn gì.
  file: `_acceptance/anh-tren-the-gan-nhan/evals.yaml`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 3: lời hứa «đọc trọn câu, không bị ô ảnh cắt» vẫn được đo bằng «chuỗi có mặt» ở expected của E10 và ở E5**
  Người dùng thấy gì: Nếu sau này ai đó đưa câu «Ảnh không tải được» về lại trong ô ảnh, chữ có thể lại bị cắt mà phép kiểm tự động vẫn xanh. Người dùng khi đó sẽ chỉ thấy một nửa câu báo lỗi.
  Căn cứ: Hậu quả nhẹ và dễ thấy bằng mắt, người dùng vẫn bấm được Thử lại; chỉ là nguy cơ tái phát sau này, không phải lỗi hiện tại.
  file: `_acceptance/anh-tren-the-gan-nhan/evals.yaml`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 5: E10 tuyên đủ hai khổ 1280 và 375 nhưng chỉ có một tệp ảnh chứng, không có ma trận khổ**
  Người dùng thấy gì: Chưa có ảnh chứng riêng cho màn hẹp, nên người ký không tự đối chiếu được câu báo lỗi ảnh có đọc trọn trên điện thoại hay không.
  Căn cứ: Chỉ thiếu bằng chứng chứ không thấy lỗi thật với người dùng, và bổ sung ở lượt chấm kế rất rẻ.
  file: `_acceptance/anh-tren-the-gan-nhan/evals.yaml`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 4: ngoại lệ fixture rộng hơn tên đã khai, đối chứng không ghim biên của ngoại lệ**
  Người dùng thấy gì: Phép kiểm tên nguồn thật bỏ qua một nhóm tên giả quá rộng, nên về lý thuyết một tên nguồn thật bắt đầu bằng chữ đó có thể lọt vào dữ liệu mẫu mà không bị bắt. Hiện chưa có trường hợp nào như vậy.
  Căn cứ: Chưa có tên nguồn nào lọt thật và khả năng xảy ra thấp; nếu có thì chỉ nằm ở dữ liệu mẫu, không đến người dùng.
  file: `_acceptance/anh-tren-the-gan-nhan/probes/kin.mjs`
  severity: low
  Đề xuất: known-limits

- **Hình dạng 5: phép quét «cả tên miền trần» của fixture chỉ phủ danh sách đuôi đóng**
  Người dùng thấy gì: Phép kiểm chỉ nhận ra tên miền theo một danh sách đuôi cố định, nên một tên miền đuôi lạ trong dữ liệu mẫu có thể không bị bắt. Hiện không có trường hợp thật nào.
  Căn cứ: Chỉ ảnh hưởng dữ liệu mẫu nội bộ, chưa có vụ lọt thực tế và không đến người dùng cuối.
  file: `_acceptance/anh-tren-the-gan-nhan/probes/kin.mjs`
  severity: low
  Đề xuất: known-limits

- **Đầu migration 075 thiếu tài liệu nguồn theo luật migration (r2)**
  Người dùng thấy gì: Người dùng không thấy gì khác: màn gắn nhãn chạy bình thường. Chỉ người đọc tệp cấu trúc dữ liệu sau này sẽ mất công tìm tài liệu thiết kế đi kèm.
  Căn cứ: Hậu quả rất nhẹ, không mất hay lộ dữ liệu, và người bảo trì tự tìm được tài liệu; sửa sau cũng rẻ nhưng không đáng mở việc riêng.
  file: `db/migrations/075_labels_can_cu_anh.sql`
  severity: low
  Đề xuất: wont-fix

- **Link dạng S03/<SĐT> bị xoá khỏi chữ hiện, số điện thoại mất khỏi thẻ mà không có dấu hiệu nào (r2)**
  Người dùng thấy gì: Khi bài rao dán số điện thoại dưới dạng đường link S03, thẻ không còn hiện số đó. Người gắn nhãn có thể chọn «không suy ra được» cho ô SĐT người bán dù bài có nêu số.
  Căn cứ: Gặp ít (2 trên 367 bài đo được) nhưng nhãn sai khó phát hiện sau khi lưu; chữ gốc vẫn còn nguyên nên không mất dữ liệu, và việc giữ số trong link cần được quyết như một hành vi mới.
  file: `app/src/lib/labels-anh.ts`
  severity: medium
  Đề xuất: known-limits

- **Ảnh trong hộp xem lớn hỏng thì không báo lỗi và không có Thử lại (r2 · tệp đã đổi)**
  Người dùng thấy gì: Nếu ảnh không tải được lúc bấm xem lớn, người gắn chỉ thấy ảnh vỡ mà không có câu báo hay nút Thử lại, dù ô ảnh nhỏ bên ngoài đang hiện bình thường.
  Căn cứ: Chỉ làm người gắn mất một lần bấm; đóng hộp rồi mở lại hoặc tải lại trang là xong, không mất hay lộ dữ liệu, và nhãn vẫn lưu được.
  file: `app/src/components/ops/labels/anh-bai.tsx`
  severity: low
  Đề xuất: known-limits

- **Hình dạng 4: âm tính một mình, «phan hoi khong lo url» chỉ quét header của Response do chính fake dựng và không đọc thân (r2)**
  Người dùng thấy gì: Bằng chứng kiểm tra rằng địa chỉ ảnh gốc không lộ ra trình duyệt còn lỏng; nếu sau này có thay đổi làm lộ địa chỉ trong nội dung phản hồi, bài kiểm tra này có thể vẫn báo xanh.
  Căn cứ: Hiện chưa có lộ thật, chỉ là lưới an toàn mỏng; không ảnh hưởng người dùng hôm nay và có thể siết lại sau mà không cần đổi sản phẩm.
  file: `app/tests/labels-anh.test.ts`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 1 kèm 4: «lay ho khong ghi dia» grep mã nguồn thay vì đo đầu ra, và không có đối chứng dương (r2)**
  Người dùng thấy gì: Chưa có dấu hiệu ảnh lấy hộ bị ghi vào kho ảnh gốc, nhưng bài kiểm tra chứng minh điều đó mới ở mức đọc mã, chưa đo trực tiếp.
  Căn cứ: Nếu sau này có ghi nhầm vào kho ảnh gốc thì hậu quả nặng, nhưng hiện chưa thấy xảy ra; siết phép đo là việc rẻ, làm khi có dịp.
  file: `app/tests/labels-anh.test.ts`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 4: «lay ho du 84» không thể đỏ riêng và không có chặn dưới, đường lấy hộ hỏng toàn bộ vẫn xanh (r2)**
  Người dùng thấy gì: Nếu đường lấy ảnh hộ hỏng hoàn toàn, phép đo trên dữ liệu thật vẫn có thể báo đạt dù không lấy được ảnh nào; người duyệt phải tự đọc số in ra mới thấy.
  Căn cứ: Số liệu vẫn được in nên người duyệt phát hiện được bằng mắt; không mất hay lộ dữ liệu, chỉ là thiếu một chốt chặn tự động.
  file: `_acceptance/anh-tren-the-gan-nhan/probes/that.mjs`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 4: expected của E4 vẫn trỏ «giá trị mồi của E6», mà trên DB seed các mồi đó luôn bằng 0 (r2 · tệp đã đổi)**
  Người dùng thấy gì: Người chấm đọc tiêu chí kiểm tra có thể đối chiếu với bộ giá trị mồi cũ nên luôn đếm ra 0, dễ hiểu nhầm là đã sạch dù chưa thật sự soi đúng bộ mồi.
  Căn cứ: Chỉ làm bước chấm có thể gây hiểu nhầm, không ảnh hưởng người dùng cuối; sửa một câu chữ là xong, không gấp.
  file: `_acceptance/anh-tren-the-gan-nhan/evals.yaml`
  severity: low
  Đề xuất: known-limits

- **Hình dạng 1: đối chứng của E2 đo closure tự viết trên chuỗi literal, không đo kết quả xuống trình duyệt (r2)**
  Người dùng thấy gì: Một bài kiểm tra ghi là bảo vệ việc không lộ địa chỉ ảnh gốc thực ra chưa chạm vào dữ liệu thật; nếu sau này bị lộ, bài này vẫn xanh nhưng một bài đo khác sẽ bắt.
  Căn cứ: Đã có lớp đo thứ hai bắt được, nên rủi ro thấp; chỉ cần ghi rõ giới hạn.
  file: `app/tests/labels-anh.test.ts`
  severity: low
  Đề xuất: known-limits

- **Hình dạng 5: thước «0 bài còn tên miền» dùng cùng danh sách đuôi đóng với LINK, nên lớp «dạng tên miền» chỉ đo được phần mã đã biết (r2)**
  Người dùng thấy gì: Nếu bài mới chứa tên miền với đuôi lạ như .shop hay .xyz, thẻ có thể vẫn hiện tên miền đó trong chữ và phép đo không phát hiện.
  Căn cứ: Hiện không bài nào gặp và chỉ là tên miền hiện ra chữ chứ không mất dữ liệu; người gắn thấy ngay trên thẻ nên xử lý dễ.
  file: `_acceptance/anh-tren-the-gan-nhan/probes/that.mjs`
  severity: low
  Đề xuất: known-limits

⚠ Cụm ngoài vùng phủ: 5/10 lỗi rơi vào file không bộ đo nào phủ (_acceptance/anh-tren-the-gan-nhan/evals.yaml) — dừng và quyết: mở rộng hợp đồng hay rút phạm vi.
