# Review findings: s03-va-doc-tin (round 4)

## Trong hợp đồng

- **E5 và E8 đòi ca đỏ thuần và dạng mã mà lệnh của chính eval không chạy**
  file: `_acceptance/s03-va-doc-tin/evals.yaml:63`
  severity: medium
  AC: AC-8
  source: conventions
  detail: E5 (dòng 41) và E8 (dòng 63) dùng `config:executors.script.va_doc_tin_db`. Lệnh này chỉ chạy `scripts/va-doc-tin.itest.mjs`, nhưng `expected` đòi hai thứ mà đầu ra của nó không có. (1) Ca đỏ thuần 'SV1-AC-5' và 'SV1-AC-8' nằm ở `pipeline/scripts/va-doc-tin.test.mjs` (dòng 183, 284), tệp này chạy dưới executor `va_doc_tin` và cũng không có trong `paths` của E5, E8. (2) E8 ghi ca 'SV1-AC-8 DB' có «S5.03-22.06», nhưng itest chỉ có S1.03.12.05, S605.10.17 và hai mã bốn phần; dạng S5.03-22.06 chỉ có ở ma trận thuần (test dòng 279). AC-8 nói rõ «When chạy transform trên DB thử». Vì vậy bằng chứng E5, E8 không chứng được phần ca đỏ, và E8 không chứng được S5.03-22.06 đi qua DB. Tương tự, AC-5 liệt kê «1,2 tỷ mỗi năm», «1,2 tỷ 1 năm» trong nhánh DB, nhưng mảng GAT của itest không có hai dòng này (chỉ có ở test thuần, dòng 167-168). Hướng sửa: thêm ca vào itest và thêm lệnh test thuần vào eval, hoặc sửa lại `expected` và AC cho đúng lệnh thật.

- **Hình dạng 3 — Assert chuỗi có mặt trong khi lời hứa là quan hệ: E11 grep toàn bộ output, không buộc «hcm_sai_thi_truong=0 ĐẠT» vào lượt cây, và nuốt exit của thước**
  file: `_acceptance/s03-va-doc-tin/evals.yaml:84`
  severity: medium
  AC: AC-9
  source: measurement
  detail: Cmd E11 kết thúc bằng `node scripts/do-cam-mau-s03.mjs 2>&1 | grep -q "hcm_sai_thi_truong=0 ĐẠT"`. Expected hứa quan hệ: «lượt cây in hcm_sai_thi_truong=0 ĐẠT». Nhưng do-cam-mau-s03.mjs in cùng một khuôn `  ${k}=${v} ĐẠT|TRƯỢT` ở cả lượt cây lẫn lượt đối chứng bản nền (vòng `for (const [k, ok] of Object.entries(DAT))` sau `luot("nen", …)`). Vì vậy dòng đó xuất hiện ở lượt nào grep cũng khớp: cây hcm>0 TRƯỢT mà nền hcm=0 thì E11 vẫn xanh. Mã thoát của ống là của grep, nên mã thoát khác 0 của node bị bỏ. Tín hiệu đó cũng là tín hiệu duy nhất của đối chứng `MOC_GOC.hcm_sai_thi_truong: v > 0`. Vòng này vừa thêm bộ lọc `laHuong` vào `chiHcm` (do-cam-mau-s03.mjs dòng 72-74), đúng chỗ cần chứng minh thước vẫn đỏ được. Nếu bộ lọc làm thước mù và cả hai lượt ra 0, dòng «KHÔNG tái lập mốc gốc» chỉ được in ra rồi bị bỏ qua, E11 vẫn xanh. Bỏ tín hiệu thoát là có lý do (`gom_qua_10_nhieu_nguoi=1` đã đỏ từ bản nền), nhưng cmd không có phép kiểm thay thế cho lượt nào in dòng đó, cũng không kiểm dòng đối chứng.

- **Hình dạng 5 — Tuyên quét lớp nhưng chỉ có điểm-case: E8 đòi «mỗi Given của AC-8» trên DB, ca DB thiếu S5.03-22.06, NTL22688, toà đuôi số kèm mã khác và cặp khác trục ở nhánh thiếu phường/DT**
  file: `pipeline/scripts/va-doc-tin.itest.mjs:105`
  severity: medium
  AC: AC-8
  source: measurement
  detail: evals.yaml dòng 63 hứa ca 'SV1-AC-8 DB' so «mỗi Given của AC-8» và nêu đích danh «S1.03.12.05», «S5.03-22.06», «S605.10.17» giữ nguyên mã, ra toà S1.03, S5.03, S605. Trong itest chỉ dựng bonPhan (S1.03.12.05, dòng 105) và bonPhanCuc (S605.10.17, dòng 106). Grep «S5.03» trong itest không có kết quả, nên dạng mã có gạch ngang chưa từng đi qua đường transform → phát biểu → phân xử → tin. Các Given khác của AC-8 cũng thiếu trên DB: «NTL22688» (chỉ có S115451, dòng 108); toà có đuôi số kèm mã toà khác (BANG_MA có «toà S1.03 và LD1», itest không có); «hai bài khác trục cùng nội dung, cả nhánh đủ phường + DT» chỉ có cặp truc1/truc2 đủ phường + DT (dòng 112-113), nhánh thiếu phường/DT không có cặp nào cùng nội dung trên DB. Các dòng thiếu chỉ được đo ở mức thuần: docToaTruc trong BANG_MA, repostKey với pr viết tay. Không có ma trận viết trước ghim số Given bằng số ca DB, nên chữ «mỗi Given» của E8 rộng hơn phần thật sự chạy.

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **Sổ RESO chưa ghi S03 là nguồn mới của unit_number**
  Người dùng thấy gì: Ghi chú trong sổ field vẫn nói mã căn chỉ đến từ một nguồn, trong khi nguồn thứ hai cũng đang cấp. Người đọc sổ có thể hiểu sai nguồn gốc dữ liệu, nhưng số liệu hiển thị không bị ảnh hưởng.
  Căn cứ: Chỉ là ghi chú lệch, không mất hay sai dữ liệu của người dùng, và sửa lại sau rất rẻ.
  file: `pipeline/mappings.yaml`
  severity: low
  Đề xuất: known-limits

- **Giá che dính chữ tỷ («36xxtỷ», «3,0xtỷ») không đọc được, bài mất giá im lặng**
  Người dùng thấy gì: Những bài rao ghi giá che viết liền chữ tỷ (ví dụ 36xxtỷ) không đọc ra được giá, nên không thành tin trên cổng. Người dùng sẽ không thấy các căn này và không có thông báo nào.
  Căn cứ: Mất tin thật mà không ai biết, nhưng số bài ít (khoảng tám mẫu chữ) và đây là dạng viết mới chưa được hợp đồng nhắc tới.
  file: `pipeline/transform-zalo.mjs`
  severity: medium
  Đề xuất: new-contract

- **Bài chỉ ghi giá theo nhãn TTS/TTC/HTLS mất toàn bộ giá, rơi khỏi tin**
  Người dùng thấy gì: Các bài sơ cấp chỉ ghi giá theo nhãn như «Giá TTS» sẽ không đọc ra giá và biến mất khỏi danh sách tin. Người dùng không thấy những căn này dù trước đây có hiện.
  Căn cứ: Có mất tin thật (khoảng 14 bài) nhưng hợp đồng chủ ý chọn thà thiếu giá hơn ghi sai, và cần Mạnh quyết nên ghi thành hạn chế đã biết.
  file: `pipeline/transform-zalo.mjs`
  severity: medium
  Đề xuất: known-limits

- **docDanhSachPhuong chèn trước runTransformZalo làm lệch đột biến CM-AC-8 của hồ sơ đã ký; executor cam_mau_s03_that sẽ đỏ (r3 · tệp đã đổi)**
  Người dùng thấy gì: Một phép kiểm của đợt trước sẽ báo đỏ giả khi ai đó chạy lại, dù dữ liệu người dùng thấy không sai.
  Căn cứ: Chỉ ảnh hưởng người làm kỹ thuật chạy lại phép kiểm cũ, không làm mất hay sai dữ liệu, và có thể xử lý sau với chi phí thấp.
  file: `pipeline/transform-zalo.mjs`
  severity: medium
  Đề xuất: known-limits

- **docDanhSachPhuong chép lại hai dòng đọc phường của runTransformZalo và tách chú thích của runTransformZalo khỏi hàm (r3 · tệp đã đổi)**
  Người dùng thấy gì: Không ảnh hưởng người dùng; chỉ khiến mã khó đọc và có nguy cơ hai đường đọc phường lệch nhau về sau.
  Căn cứ: Không có hậu quả nhìn thấy với người dùng, chỉ là nợ dọn mã nhỏ, nên ghi vết là đủ.
  file: `pipeline/transform-zalo.mjs`
  severity: low
  Đề xuất: wont-fix

- **Mã căn bốn phần bị cắt cụt: «S1.03.12.05» ra toà S1, trục S1.03.12 (r3 · tệp đã đổi)**
  Người dùng thấy gì: Một số ít tin ghi mã căn dài bốn phần có thể bị gán sai toà và sai căn, hai căn khác nhau có thể bị gộp thành một tin.
  Căn cứ: Chạm khoảng chín bài trong hơn năm vạn bài, sai ở mức gán toà và căn nên có thể sửa sau khi bộ đọc được mở rộng, chưa làm mất dữ liệu gốc.
  file: `pipeline/transform-zalo.mjs`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 2 — Fixture viết tay đúng khuôn bên đọc: ca khoá gom ghi `ma: []` nên che lỗi tách khoá của parsePost thật (r3 · tệp đã đổi)**
  Người dùng thấy gì: Hai bài cùng một căn nhưng một bài viết chữ thường có thể thành hai tin riêng thay vì một.
  Căn cứ: Chỉ làm dư một tin trùng chứ không mất hay sai dữ liệu, hiếm gặp và có thể gộp lại khi chạy lại.
  file: `pipeline/scripts/va-doc-tin.test.mjs`
  severity: high
  Đề xuất: known-limits

- **Hình dạng 4 — Âm tính một mình: hai thước mới `khong_vay_mat_gia`, `thue_ty_lui` không có đối chứng dương (r3 · tệp đã đổi)**
  Người dùng thấy gì: Con số 0 báo cáo về giá bị mất có thể chưa chứng minh chắc chắn, nên khó tin hoàn toàn rằng không còn bài nào mất giá.
  Căn cứ: Không làm sai dữ liệu người dùng, chỉ giảm độ tin của phép đo, và bổ sung đối chứng sau là việc rẻ.
  file: `pipeline/scripts/do-va-doc-tin.mjs`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 5 — Tuyên cả lớp đơn vị năm của AC-5 nhưng lý do gạt chỉ có điểm-case: «mỗi năm», «1 năm», «/1 năm» chỉ assert kind (r3 · tệp đã đổi)**
  Người dùng thấy gì: Tin thuê ghi giá theo năm có thể lọt thành tin bán nếu sau này bộ đọc đổi mà không phép kiểm nào báo.
  Căn cứ: Hôm nay kết quả đúng nên chưa có hại, rủi ro chỉ ở lần sửa sau và có thể bổ sung phép kiểm rẻ.
  file: `pipeline/scripts/va-doc-tin.test.mjs`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 4 — Âm tính một mình: thước `hai_truc` đếm trên nhóm mà khoá đã chứa trục, gần như không thể đỏ (r3 · tệp đã đổi)**
  Người dùng thấy gì: Phép đo «không tin nào mang hai căn» có thể không bắt được trường hợp tin gộp nhầm hai căn.
  Căn cứ: Không gây sai dữ liệu trực tiếp, chỉ làm lời đảm bảo yếu đi, và đã có phép đếm trên cơ sở dữ liệu thử bổ sung.
  file: `pipeline/scripts/do-va-doc-tin.mjs`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 4 — Âm tính một mình: nhánh giá của so-gia-ty-chan-dong thành hằng đúng mà vẫn in câu khẳng định (r3)**
  Người dùng thấy gì: Một công cụ so sánh phụ có thể in kết luận «giá đúng» mà không thật sự kiểm giá; người dùng cuối không thấy.
  Căn cứ: Công cụ phụ nội bộ, không ảnh hưởng dữ liệu hay tính năng, sửa không đáng chi phí.
  file: `pipeline/scripts/so-gia-ty-chan-dong.mjs`
  severity: medium
  Đề xuất: wont-fix

- **Hình dạng 3 — Thước `dt_phay` hứa quan hệ «DT = số có phẩy» nhưng ngưỡng `< 15` loại lỗi đọc phần lẻ hai chữ số (r3 · tệp đã đổi)**
  Người dùng thấy gì: Phép đo diện tích có thể bỏ sót lỗi với số có hai chữ số lẻ như 63,45m2 nếu bộ đọc hỏng sau này.
  Căn cứ: Hiện diện tích đọc đúng, chưa có sai sót cho người dùng, chỉ là phép đo chưa phủ hết.
  file: `pipeline/scripts/do-va-doc-tin.mjs`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 5 — E1 tuyên «số assert bằng số dòng» nhưng ma trận không ghim số phần tử (r3 · tệp đã đổi)**
  Người dùng thấy gì: Ai đó có thể xoá bớt ca kiểm mà bộ test vẫn xanh, làm lời đảm bảo yếu đi âm thầm.
  Căn cứ: Không gây sai dữ liệu cho người dùng, chỉ là rủi ro về sau và bổ sung đếm số dòng rất rẻ.
  file: `_acceptance/s03-va-doc-tin/evals.yaml`
  severity: medium
  Đề xuất: known-limits

- **Câu SQL kiểm «tin mang hai trục» so chữ thô, trong khi khoá gom và bộ phân xử không phân biệt hoa thường (r2 · tệp đã đổi)**
  Người dùng thấy gì: Phép kiểm tự động có thể báo nhầm «có tin mang hai trục» khi một tin có hai bài đăng lại khác nhau về chữ hoa/thường. Người dùng không thấy dữ liệu sai, chỉ có thể gặp một lần kiểm đỏ giả.
  Căn cứ: Chỉ ảnh hưởng một phép kiểm nội bộ, không làm sai hay mất dữ liệu nào, và hôm nay đo trên bài thật chưa lần nào đỏ; nếu đỏ giả thì người làm tự nhận ra và sửa rẻ.
  file: `pipeline/scripts/va-doc-tin.itest.mjs`
  severity: low
  Đề xuất: known-limits

- **Phát biểu parser block_raw/unit_number không được rút khi bộ đọc thôi đọc ra giá trị, nên giá trị cũ thắng LLM mãi (r2)**
  Người dùng thấy gì: Nếu sau này luật đọc được sửa khiến một mã căn hay toà không còn đọc ra nữa, tin rao vẫn giữ mã hoặc toà cũ sai mà không có cảnh báo nào. Người xem tin có thể thấy số căn hoặc tên toà không còn đúng với bài.
  Căn cứ: Chưa có dữ liệu sai nào hôm nay và chỉ lộ khi sửa luật đọc hoặc bài đổi chữ, nhưng khi xảy ra thì sai âm thầm, người dùng không tự gỡ được, và ghi chú hạn chế hiện nói «chạy lại là chỉnh được», điều này không đúng.
  file: `pipeline/lib/assert.mjs`
  severity: medium
  Đề xuất: new-contract

- **Bài cho thuê giá ghi theo năm dạng «mỗi năm», «1 năm», «/1 năm» bị đổi thành tin bán (r2 · tệp đã đổi)**
  Người dùng thấy gì: Một bài cho thuê ghi giá theo năm bằng chữ như «1,2 tỷ mỗi năm» có thể bị coi là tin bán giá 1,2 tỷ và hiện trên danh sách bán. Hiện chưa có bài thật nào viết như vậy.
  Căn cứ: Đo trên hơn 51 nghìn bài thật không có bài nào rơi vào dạng này nên chưa ai bị ảnh hưởng, và nếu xuất hiện thì chỉ là vài tin lẻ, người vận hành loại tay được.
  file: `pipeline/transform-zalo.mjs`
  severity: low
  Đề xuất: known-limits

- **Giá không đơn vị kèm «net» và giá che số trong tin thuê được đọc theo thang bán, rồi tin bị đổi thành tin bán (r2 · tệp đã đổi)**
  Người dùng thấy gì: Một số bài cho thuê có giá viết kiểu «12000 net» hoặc «8.5x» có thể bị hiểu thành bán nhà giá hàng tỷ. Người xem sẽ thấy một tin bán với giá cao sai hẳn so với thực tế.
  Căn cứ: Trong dữ liệu thật chưa có bài thuê nào viết đúng dạng này, các bài bị đổi loại xem được đều là bài bán thật, nên hậu quả hiện chỉ là nguy cơ, và tin sai nếu có thì người vận hành gỡ tay được.
  file: `pipeline/transform-zalo.mjs`
  severity: low
  Đề xuất: known-limits

- **Giá che hai chữ số một dấu x kèm «tỷ» bị đọc thành trăm triệu: «25x tỷ» ra 250 triệu (r2 · tệp đã đổi)**
  Người dùng thấy gì: Một bài bán ghi giá che kiểu «25x tỷ» có thể hiện giá chỉ khoảng 250 triệu, thấp hơn rất nhiều so với giá thật. Người xem sẽ thấy căn đó rẻ bất thường.
  Căn cứ: Chưa có bài thật nào viết dạng này, và nếu có thì tin giá thấp bất thường dễ bị người vận hành phát hiện và loại; chưa có dữ liệu sai nào ra ngoài.
  file: `pipeline/transform-zalo.mjs`
  severity: low
  Đề xuất: known-limits

- **Hình dạng 3 — Lời hứa «đúng 1 tỷ thành tin bán đúng giá» là quan hệ bài→giá, nhưng chỉ assert kind (r2 · tệp đã đổi)**
  Người dùng thấy gì: Phép kiểm tự động chưa khẳng định giá của bài cho thuê đúng 1 tỷ sau khi đổi thành tin bán; nếu giá ở biên này bị đọc sai thì phép kiểm vẫn xanh. Hiện không có bằng chứng giá thật bị sai.
  Căn cứ: Không có dữ liệu sai nào được chỉ ra, chỉ là lưới kiểm chưa phủ hết một giá trị biên hiếm gặp; thêm một dòng kiểm sau này rất rẻ và không ảnh hưởng người dùng.
  file: `pipeline/scripts/va-doc-tin.itest.mjs`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 3 — Thước dt_phay hứa quan hệ «DT = số có phẩy» nhưng ngưỡng `< 15` loại mọi lỗi đọc hai chữ số lẻ (r2 · tệp đã đổi)**
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

- **Hình dạng 5 — Tuyên «số assert bằng số dòng» nhưng ma trận không ghim số phần tử (r1 · tệp đã đổi)**
  Người dùng thấy gì: Nếu ai đó lỡ xoá một dòng trong bảng ca thử thì các kiểm tra vẫn xanh. Một dòng kiểm quan trọng có thể mất mà không ai hay.
  Căn cứ: Chỉ làm bảng kiểm dễ bị bớt dòng âm thầm, không đổi dữ liệu người dùng; thêm số đếm sau là việc rẻ.
  file: `_acceptance/s03-va-doc-tin/evals.yaml`
  severity: medium
  Đề xuất: known-limits

⚠ Cụm ngoài vùng phủ: 2/6 lỗi rơi vào file không bộ đo nào phủ (_acceptance/s03-va-doc-tin/evals.yaml) — dừng và quyết: mở rộng hợp đồng hay rút phạm vi.
