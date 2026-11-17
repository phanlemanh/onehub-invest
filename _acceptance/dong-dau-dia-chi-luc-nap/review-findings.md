# Review findings: dong-dau-dia-chi-luc-nap (round 3)

## Trong hợp đồng

- **Lọc banHieuLuc bỏ cả dòng TG2 cũ cùng dự án: sửa thẻ mà giữ nguyên dự án làm tin đăng chéo nhóm mất dự án vĩnh viễn**
  AC: AC-5
  file: `pipeline/transform-zalo.mjs:1040`
  severity: medium
  source: bugs
  detail: Ở 0326b5c06, truy vấn songRows trong sinh() chỉ giữ dòng TG2 có cặp (thẻ|bản) nằm trong banHieuLuc. Vì vậy dòng TG2 của bản thẻ trước bị loại khỏi duAnHienTai, kể cả khi bản mới vẫn cho đúng dự án ấy. Trong app (app/src/lib/the-dia-chi-nhom.ts:177-188), thao tác «sua» (đổi phường, phân khu hay mục đích nhưng giữ dự án) và cả «nhan» đều tăng version.

  Kịch bản lỗi: tin có bài a (nhóm g1, thẻ dự án X) và bài b (nhóm g2, thẻ dự án Y). Duyệt g1 trước thì a được đóng dấu X. Duyệt g2 sau thì nhánh theGiuHienTai giữ X, đúng ý AC-8 «duyệt từng đợt». Sau đó người vận hành sửa ô phường của thẻ g1, version thành 2, dự án vẫn X. Ở lượt nạp kế, dòng X của a mang bản 1 nên bị lọc, nên hienTai rỗng (hoặc chỉ còn dòng DV6 khác X). Khi đó theVals = {X,Y} và nhánh bo(() => true) bỏ dự án của cả tin. Cuối lượt, rutTheCu rút dòng bản 1. Từ lượt sau trở đi hienTai vẫn rỗng, nên tin mất dự án mãi. Chỉ cứu được khi traLaiDV6 có dòng DV6 cũ để trả, và DV6 muốn đúng X.

  Hàng rào AC-8 của b098fe1de bị một lần sửa ô không liên quan phá mất. Bảng 48 ô và ca «TG2-r3 bất biến (4)» chỉ thử đổi bản kèm đổi dự án, không thử đổi bản mà giữ dự án.

  Cách sửa: chỉ loại dòng TG2 cũ khi giá trị của nó khác ô dự án hiện tại của thẻ cùng card_code. Cũng có thể khớp theo card_code, bỏ qua version, khi giá trị bằng t.duAn.
  rationale: AC-5 đòi ca bản n+1 chỉ đổi ô phường thì dòng dự án được rút rồi chèn lại đúng một lần; finding chỉ ra dự án bị mất hẳn và tin rơi khỏi ô Định vị (cũng chạm AC-8).

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **traLaiDV6 đọc thẳng stg_zalo_posts qua docDuLieu của DV6, không qua loadStgPosts. Luật AC-6 bị phá mà thước quét tĩnh E8 vẫn báo xanh**
  Người dùng thấy gì: Một đường đọc dữ liệu mới có thể, về lý thuyết, đọc cả bài thử mà thước kiểm tự động không báo. Hiện chưa có bài thử nào bị gắn dự án nhầm.
  Căn cứ: Chưa gây hại thật vì bài thử đang được lọc ở bước khác; chỉ là lưới an toàn kiểm tra mỏng hơn, và có thể gia cố sau mà không mất dữ liệu.
  file: `pipeline/lib/dia-chi-the-nhom.mjs`
  severity: medium
  Đề xuất: known-limits

- **Lệnh lùi bước 2 thiếu DATABASE_URL: du-an-tren-tin-s03 thoát 2 sau khi lui.sql đã commit, tin S03 nằm ở trạng thái không dự án**
  Người dùng thấy gì: Nếu người vận hành làm đúng từng chữ khi lùi mà chưa đặt biến kết nối, bước đầu xoá hết dự án trên tin còn bước sau báo lỗi, tin tạm không có dự án.
  Căn cứ: Không mất dữ liệu gốc và chạy lại bước sau với biến kết nối đúng là khôi phục được ngay; sửa chỉ là thêm một dòng chữ nên rẻ, nhưng không chặn việc ra mắt.
  file: `_acceptance/dong-dau-dia-chi-luc-nap/ap-may-thu/lui.sql`
  severity: low
  Đề xuất: known-limits

- **Hình dạng 2 (fixture viết tay, không lấy từ writer): bảng 48 ô AC-8 tự chèn dòng DV6 trước khi trả, ô D4·P3 mang trạng thái DV6 thật không sinh ra được**
  Người dùng thấy gì: Một số ô trong bảng kiểm tra dựng trạng thái mà hệ thống thật không bao giờ tạo ra, nên kết quả vài ô kiểm tra kém đáng tin hơn. Người dùng cuối không bị ảnh hưởng trực tiếp.
  Căn cứ: Chỉ làm bài kiểm tra kém sát thực tế, không làm mất hay sai dữ liệu; có thể dựng lại bằng dữ liệu do chính hệ thống sinh ở đợt sau.
  file: `pipeline/tests/dong-dau-dia-chi.itest.mjs`
  severity: low
  Đề xuất: known-limits

- **Chạy thẳng --chay trên bản chép đã dùng thì mốc GỐC không còn là «máy thu nguyên trạng», khong-tut và phu-kind lại hết khả năng đỏ** (r2)
- **HE_DU_AN/laLac («trong hệ VGP») chỉ có test gọi, đường đo AC-10 không dùng, và ghim cứng ID node danh bạ** (r2)
- **Khoá mkdir của chayNeuCu bị bỏ lại khi tiến trình thoát bằng process.exit hoặc Ctrl-C, mọi lượt --do-neu-cu sau treo vô hạn và không in gì** (r2)
- **Hình dạng 2: fixture tệp nhãn người duyệt viết tay đúng khuôn docTepDuyet, không round-trip từ trang duyệt** (r2)
- **Hình dạng 3: test «tệp của mẫu khác thì không nhận» chỉ ghim chuỗi hat_giong, trong khi lời hứa là quan hệ giữa tệp nhãn và 100 mã bài đã khai** (r2)
- **Hình dạng 4: E9 AC-7 ghim «đúng một dòng cảnh báo» ở ca thiếu lược đồ mà không đối chứng 0 dòng ở ca đủ lược đồ** (r2)
- **Rút dòng DV6 bằng rule_id viết cứng thay vì dùng hằng RULE của module DV6, và rút chéo luật mà module DV6 khai là chỉ nó được rút** (r2)
- **Khoá `.khoa` của --do-neu-cu bị bỏ lại khi process.exit(2) chạy trong vùng khoá, các lượt đo sau treo vô hạn** (r2)
- **Bộ quét E8 chỉ xét từng dòng: câu SQL xuống dòng giữa FROM/JOIN và stg_zalo_posts lọt qua** (r2)
- **Hình dạng 2 (fixture viết tay theo đúng khuôn bên đọc): bảng nhãn AC-10 viết tay, không đi một vòng từ bộ sinh inBangTrong** (r2)

- **Chạy thẳng --chay trên bản chép đã dùng thì mốc GỐC không còn là «máy thu nguyên trạng», khong-tut và phu-kind lại hết khả năng đỏ (r2 · tệp đã đổi)**
  Người dùng thấy gì: Nếu người chạy đo lại trên bản chép đã dùng, số đo có thể trông đạt dù tin bị mất nhãn bán hay thuê. Đo trên bản chép mới dựng thì số đúng.
  Căn cứ: Chỉ ảnh hưởng người chạy phép đo khi chạy lại sai cách, không làm hỏng dữ liệu thật, và dựng lại bản chép là tự làm được.
  file: `pipeline/scripts/dong-dau-dia-chi-that.mjs`
  severity: medium
  Đề xuất: known-limits

- **HE_DU_AN/laLac («trong hệ VGP») chỉ có test gọi, đường đo AC-10 không dùng, và ghim cứng ID node danh bạ (r2 · tệp đã đổi)**
  Người dùng thấy gì: Một phần mã định nghĩa «trong hệ» chỉ được test chứ không dùng khi đo, và có thể lệch nếu danh bạ dự án được đúc lại. Số đo tỉ lệ bài lạc không bị ảnh hưởng.
  Căn cứ: Chưa gây sai số liệu nào hiện tại; chỉ thành vấn đề khi danh bạ đổi, và khi đó sửa vẫn rẻ.
  file: `pipeline/scripts/mau-bai-lac-du-an.mjs`
  severity: low
  Đề xuất: known-limits

- **Khoá mkdir của chayNeuCu bị bỏ lại khi tiến trình thoát bằng process.exit hoặc Ctrl-C, mọi lượt --do-neu-cu sau treo vô hạn và không in gì (r2 · tệp đã đổi)**
  Người dùng thấy gì: Nếu một lượt đo bị ngắt giữa chừng, các lượt đo sau sẽ đứng im không báo gì cho tới khi người chạy xoá khoá thủ công.
  Căn cứ: Không mất hay lộ dữ liệu, chỉ làm chậm người chạy đo, và xoá khoá là gỡ được ngay.
  file: `pipeline/scripts/dong-dau-dia-chi-that.mjs`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 2: fixture tệp nhãn người duyệt viết tay đúng khuôn docTepDuyet, không round-trip từ trang duyệt (r2 · tệp đã đổi)**
  Người dùng thấy gì: Test đọc tệp nhãn dùng tệp tự viết nên không bắt được trường hợp trang duyệt lưu khác khuôn; khi đó lệnh đo thật có thể lỗi hoặc đếm sai.
  Căn cứ: Lỗi sẽ lộ ra ngay khi chạy trên tệp thật và người chạy thử lại được, nên hậu quả nhẹ.
  file: `pipeline/scripts/mau-bai-lac-du-an.test.mjs`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 3: test «tệp của mẫu khác thì không nhận» chỉ ghim chuỗi hat_giong, trong khi lời hứa là quan hệ giữa tệp nhãn và 100 mã bài đã khai (r2 · tệp đã đổi)**
  Người dùng thấy gì: Test chỉ kiểm tệp nhãn có đúng hạt giống chứ không kiểm tệp có đủ và đúng 100 bài của mẫu, nên không bắt được tệp thiếu bài.
  Căn cứ: Hậu quả thật được xử lý ở lỗi mã gốc; phần test thiếu chỉ là lưới an toàn, bổ sung sau rẻ.
  file: `pipeline/scripts/mau-bai-lac-du-an.test.mjs`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 4: E9 AC-7 ghim «đúng một dòng cảnh báo» ở ca thiếu lược đồ mà không đối chứng 0 dòng ở ca đủ lược đồ (r2 · tệp đã đổi)**
  Người dùng thấy gì: Test chưa chứng minh rằng khi DB đủ bảng thẻ thì không in cảnh báo thừa; nếu có in thừa thì chỉ là một dòng nhắc không đúng chỗ.
  Căn cứ: Nhiều nhất là một dòng cảnh báo thừa, không ảnh hưởng dữ liệu, và bổ sung ca test sau rất rẻ.
  file: `pipeline/tests/dong-dau-dia-chi.itest.mjs`
  severity: low
  Đề xuất: known-limits

- **Rút dòng DV6 bằng rule_id viết cứng thay vì dùng hằng RULE của module DV6, và rút chéo luật mà module DV6 khai là chỉ nó được rút (r1 · tệp đã đổi)**
  Người dùng thấy gì: Hôm nay tin vẫn hiện đúng. Nếu sau này ai đổi tên một luật cũ, việc thay bằng thẻ nhóm có thể lặng lẽ không chạy và một số tin bị báo xung đột dự án.
  Căn cứ: Chưa gây sai gì cho người dùng, chỉ là mối nguy khi sửa về sau; ghi lại rồi sửa lúc đụng tới luật đó thì rẻ.
  file: `pipeline/transform-zalo.mjs`
  severity: low
  Đề xuất: known-limits

- **Khoá `.khoa` của --do-neu-cu bị bỏ lại khi process.exit(2) chạy trong vùng khoá, các lượt đo sau treo vô hạn (r1 · tệp đã đổi)**
  Người dùng thấy gì: Một lần chạy đo bị ngắt giữa chừng có thể làm các lần đo sau đứng im không báo gì, người chạy phải tự xoá tệp khoá. Dữ liệu tin và người dùng cuối không bị ảnh hưởng.
  Căn cứ: Chỉ làm chậm việc nghiệm thu nội bộ, không mất dữ liệu, và người vận hành tự gỡ được bằng cách xoá tệp khoá.
  file: `pipeline/scripts/dong-dau-dia-chi-that.mjs`
  severity: medium
  Đề xuất: known-limits

- **Bộ quét E8 chỉ xét từng dòng: câu SQL xuống dòng giữa FROM/JOIN và stg_zalo_posts lọt qua (r1)**
  Người dùng thấy gì: Rào kiểm tra bài thử có thể báo xanh dù một câu truy vấn viết nhiều dòng đọc thẳng dữ liệu thô. Hiện chưa có bằng chứng bài thử nào bị đóng dấu nhầm.
  Căn cứ: Chỉ làm rào kiểm yếu đi chứ chưa gây sai dữ liệu; mã hiện tại có thể rà tay một lần và sửa bộ quét sau với chi phí thấp.
  file: `pipeline/scripts/quet-doc-stg.mjs`
  severity: low
  Đề xuất: known-limits

- **Hình dạng 2 (fixture viết tay theo đúng khuôn bên đọc): bảng nhãn AC-10 viết tay, không đi một vòng từ bộ sinh inBangTrong (r1 · tệp đã đổi)**
  Người dùng thấy gì: Nếu khuôn bảng gắn nhãn đổi, công cụ đọc nhãn có thể hỏng mà bài kiểm tra vẫn xanh, làm số đo bài lạc dự án sai đi.
  Căn cứ: Rủi ro nhỏ, chỉ xảy ra khi ai đó đổi khuôn bảng, và lệch sẽ lộ ngay khi chạy mẫu thật; sửa sau rẻ.
  file: `pipeline/scripts/mau-bai-lac-du-an.test.mjs`
  severity: low
  Đề xuất: known-limits

⚠ Cụm ngoài vùng phủ: 2/4 lỗi rơi vào file không bộ đo nào phủ (_acceptance/dong-dau-dia-chi-luc-nap/ap-may-thu/lui.sql, pipeline/tests/dong-dau-dia-chi.itest.mjs) — dừng và quyết: mở rộng hợp đồng hay rút phạm vi.
