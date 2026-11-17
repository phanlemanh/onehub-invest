# Review findings: dong-dau-dia-chi-luc-nap (round 2)

## Trong hợp đồng

- **--tinh-duyet không đối chiếu tệp nhãn với 100 mã bài đã khoá trong hồ sơ, nên tệp thiếu dòng vẫn ra ĐẠT và exit 0**
  file: `pipeline/scripts/mau-bai-lac-du-an.mjs:230`
  severity: medium
  AC: AC-10
  source: conventions
  detail: docTepDuyet là cửa nhận một tệp JSON từ ngoài vào (trang duyệt lưu ra), nhưng chỉ kiểm tên người duyệt, giờ và (nếu có) hat_giong. Hàm không kiểm bốn điều: (1) post_id trong tep.nhan có đúng là danh sách mã bài khoá mẫu ở evidence/mau-bai-lac-du-an-v2.md hay không; (2) có post_id trùng hay không; (3) số dòng có bằng cỡ mẫu khai trước (n = 100) hay không; (4) trường `nhap` có thuộc {lac, khong} hay không. Với «chon: dung» thì nhãn lấy luôn d.nhap, nên nhap là undefined hay sai chính tả sẽ bị đếm lặng lẽ thành «không lạc». Hệ quả: chỉ cần tệp bỏ hẳn những dòng chưa duyệt, thay vì để chon = null, là chuaDuyet = 0, rồi main() in ĐẠT và thoát 0 trên cỡ mẫu thật nhỏ hơn cỡ đã khai. Cũng có thể trùng dòng để thổi n lên. Thêm nữa, `--seed` là tuỳ chọn (`lay("--seed") ?? null`): bỏ cờ này thì phép kiểm hạt giống bị bỏ qua mà không báo gì, nên tệp nhãn của mẫu khác vẫn được nhận. Chính tệp này ghi rằng «thứ khoá mẫu là DANH SÁCH MÃ BÀI ghi trong hồ sơ, không phải một mình hạt giống», nhưng bộ đọc nhãn lại không dùng danh sách ấy. Hiện test không có ca nào cho tệp thiếu dòng, trùng dòng hay sai danh sách mã.
  Lý do vào hợp đồng: AC-10 đòi cỡ mẫu thật không nhỏ hơn mức chốt và in cỡ mẫu thật; tệp thiếu dòng vẫn ĐẠT làm thước này qua im lặng.

- **traLaiDV6 ghi lại MỌI giá trị DV6 từng bị rút (kể cả giá trị cũ DV6 đã bỏ), làm bài có hai dự án sống hoặc dự án sai**
  file: `pipeline/lib/dia-chi-the-nhom.mjs:236`
  severity: medium
  AC: AC-8
  source: bugs
  detail: Câu chọn dùng `DISTINCT ON (subject_key, field, value_key, method, rule_id)` trên các dòng có retract_reason='thay-bang-the-nhom'. Vì khoá có value_key nên mỗi GIÁ TRỊ từng bị rút trên bài đều được ghi lại, không phải chỉ dòng mới nhất của (bài, luật). Đường đi cụ thể: (1) DV6 ghi bài P = A; (2) lượt nạp TG2 rút dòng A (thay-bang-the-nhom); (3) DV6 chạy lại sau khi nhãn hoặc sổ nhóm đổi sang B. ghiPhatBieu của du-an-tren-tin-s03 chỉ đối soát dòng SỐNG, nên dòng A đã rút không bị đổi lý do; bước tangCao không chặn vì dòng thẻ ở lớp inferred, nên DV6 chèn B sống; (4) lượt TG2 kế rút B, cũng với lý do thay-bang-the-nhom; (5) thẻ bị bác hoặc sửa thành 2–3 dự án, traLaiDV6 ghi lại CẢ A lẫn B. Chỉ mục sống của 045 khoá theo value_key nên cả hai cùng chèn được, và P mang hai dòng project_node_id sống khác giá trị. offer_project của tin thành xung_dot, đúng lỗi AC-8 mà hàm này sinh ra để chặn. Cùng gốc đó, một giá trị mà DV6 hiện KHÔNG còn muốn ghi (vì nhãn đổi, sổ nhóm đổi, hay tin mâu thuẫn) vẫn được dựng lại: dòng đã rút nằm ngoài tầm đối soát của DV6. Cách sửa: chỉ lấy bản rút mới nhất theo (subject_key, field, rule_id) và bỏ value_key khỏi DISTINCT ON. Tốt hơn nữa là đối chiếu với tập DV6 đang muốn ghi, hoặc để DV6 tự chạy lại thay vì sống lại dòng cũ.
  Lý do vào hợp đồng: bài có hai dự án sống thành xung_dot, đúng trường hợp AC-8 đòi 0 bài rơi khỏi mot_du_an.

- **--tinh-duyet không kiểm tệp nhãn đủ mẫu đã khai và không kiểm ô nháp, nên tệp thiếu dòng hay nháp hỏng vẫn thoát 0 «ĐẠT»**
  file: `pipeline/scripts/mau-bai-lac-du-an.mjs:152`
  severity: medium
  AC: AC-10
  source: bugs
  detail: docTepDuyet chỉ đếm những dòng có trong `tep.nhan`. Lệnh không đối chiếu số dòng với cỡ mẫu đã khai (n = 100), cũng không đối chiếu post_id với danh sách mã bài khoá mẫu. Chính tiêu đề tệp nói danh sách mã mới là thứ khoá mẫu, và lệnh cũng không chặn post_id trùng. Tệp lưu thiếu dòng, ví dụ trang duyệt chỉ ghi các dòng đã hiện, cho chuaDuyet = 0 nên `process.exit(w.tren <= 0.1 && t.chuaDuyet === 0 ? 0 : 1)` trả 0 trên cỡ mẫu nhỏ hơn mẫu đã khai. Với chon = 'dung', nhãn lấy thẳng `d.nhap` mà không kiểm giá trị thuộc {'lac','khong'}: nháp thiếu hay sai chính tả bị đếm im là «không lạc», làm số ca lạc thấp đi đúng về phía qua ngưỡng. Kiểm hạt giống cũng bị bỏ im khi gọi lệnh không kèm --seed (hatGiong = null). Cả ba đều là lối qua im lặng của thước AC-10.
  Lý do vào hợp đồng: cùng gốc với finding đầu của AC-10, thước AC-10 qua được với cỡ mẫu nhỏ hơn đã khai và nhãn hỏng.

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **Chạy thẳng --chay trên bản chép đã dùng thì mốc GỐC không còn là «máy thu nguyên trạng», khong-tut và phu-kind lại hết khả năng đỏ**
  Người dùng thấy gì: Nếu người chạy đo lại trên bản chép đã dùng, số đo có thể trông đạt dù tin bị mất nhãn bán hay thuê. Đo trên bản chép mới dựng thì số đúng.
  Căn cứ: Chỉ ảnh hưởng người chạy phép đo khi chạy lại sai cách, không làm hỏng dữ liệu thật, và dựng lại bản chép là tự làm được.
  file: `pipeline/scripts/dong-dau-dia-chi-that.mjs`
  severity: medium
  Đề xuất: known-limits

- **HE_DU_AN/laLac («trong hệ VGP») chỉ có test gọi, đường đo AC-10 không dùng, và ghim cứng ID node danh bạ**
  Người dùng thấy gì: Một phần mã định nghĩa «trong hệ» chỉ được test chứ không dùng khi đo, và có thể lệch nếu danh bạ dự án được đúc lại. Số đo tỉ lệ bài lạc không bị ảnh hưởng.
  Căn cứ: Chưa gây sai số liệu nào hiện tại; chỉ thành vấn đề khi danh bạ đổi, và khi đó sửa vẫn rẻ.
  file: `pipeline/scripts/mau-bai-lac-du-an.mjs`
  severity: low
  Đề xuất: known-limits

- **Khoá mkdir của chayNeuCu bị bỏ lại khi tiến trình thoát bằng process.exit hoặc Ctrl-C, mọi lượt --do-neu-cu sau treo vô hạn và không in gì**
  Người dùng thấy gì: Nếu một lượt đo bị ngắt giữa chừng, các lượt đo sau sẽ đứng im không báo gì cho tới khi người chạy xoá khoá thủ công.
  Căn cứ: Không mất hay lộ dữ liệu, chỉ làm chậm người chạy đo, và xoá khoá là gỡ được ngay.
  file: `pipeline/scripts/dong-dau-dia-chi-that.mjs`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 2: fixture tệp nhãn người duyệt viết tay đúng khuôn docTepDuyet, không round-trip từ trang duyệt**
  Người dùng thấy gì: Test đọc tệp nhãn dùng tệp tự viết nên không bắt được trường hợp trang duyệt lưu khác khuôn; khi đó lệnh đo thật có thể lỗi hoặc đếm sai.
  Căn cứ: Lỗi sẽ lộ ra ngay khi chạy trên tệp thật và người chạy thử lại được, nên hậu quả nhẹ.
  file: `pipeline/scripts/mau-bai-lac-du-an.test.mjs`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 3: test «tệp của mẫu khác thì không nhận» chỉ ghim chuỗi hat_giong, trong khi lời hứa là quan hệ giữa tệp nhãn và 100 mã bài đã khai**
  Người dùng thấy gì: Test chỉ kiểm tệp nhãn có đúng hạt giống chứ không kiểm tệp có đủ và đúng 100 bài của mẫu, nên không bắt được tệp thiếu bài.
  Căn cứ: Hậu quả thật được xử lý ở lỗi mã gốc; phần test thiếu chỉ là lưới an toàn, bổ sung sau rẻ.
  file: `pipeline/scripts/mau-bai-lac-du-an.test.mjs`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 4: E9 AC-7 ghim «đúng một dòng cảnh báo» ở ca thiếu lược đồ mà không đối chứng 0 dòng ở ca đủ lược đồ**
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

⚠ Cụm ngoài vùng phủ: 6/9 lỗi rơi vào file không bộ đo nào phủ (pipeline/scripts/mau-bai-lac-du-an.mjs, pipeline/scripts/mau-bai-lac-du-an.test.mjs, pipeline/tests/dong-dau-dia-chi.itest.mjs) — dừng và quyết: mở rộng hợp đồng hay rút phạm vi.
