## Trong hợp đồng

- **Hình 1, đo mảnh do test tự lắp thay vì đầu ra: AC-2 không đo chữ mà lệnh thật gửi cho model**
  AC: AC-2
  file: agent/tests/doc-toan-bo.test.ts:72
  severity: high
  source: measurement
  detail: E2 hứa «kiểm trên chữ đến model giả». Nhưng dòng 72-74 do chính test gọi gatChu(BAI_DAI, [tên viết tay]) rồi đưa kết quả vào hoiDoc. Đường thật không đi qua phép đo này: chuGat trong chayLuot (doc-toan-bo.ts:247,259), gat trong doMau (doc-toan-bo.ts:406) và docTenCam đọc source_registry. Bên itest, mọi fixture là chữ sạch và cam: [] (dòng 50, 282); kiemDaDoc so g === chu với chữ gốc. Đột biến: sửa doc-toan-bo.ts:259 thành text: t.text! thì không ca nào đỏ. Tên nhóm (tự thêm ở dòng 247) và tên nguồn đọc từ source_registry (tầng A) cũng không được đo trên đường này; grep docTenCam, source_registry trong hai tệp test ra 0 dòng. Ca «chiều đỏ» ở dòng 83 chỉ chứng minh phép so chuỗi nhạy, không chứng minh lệnh có gạt.

- **Hình 5, ma trận thiếu phần tử: bẫy «cần mua X» E4 khai không có trong ma trận DB mà E4 chạy**
  AC: AC-3
  file: agent/tests/doc-toan-bo-db.itest.ts:106
  severity: medium
  source: measurement
  detail: E4 khai cmd ls1_db và ma trận gồm các bẫy gần X, cạnh X, cần mua X, hai loại. MA_TRAN_AC4 (dòng 106-113) có sáu hàng và không có «cần mua X». Ca này chỉ có ở KHONG_DAT của doc-toan-bo.test.ts:21, thuộc ls1_thuan và chỉ gọi kiemTrichLoai, tức là không qua quyetTin, đề xuất skipped, loaiHinh. Hàng «khong-co-trich» cũng vắng ở ma trận DB. Số hàng do lệnh của E4 chạy nhỏ hơn số phần tử E4 tuyên bố.

- **Hình 3, chuỗi có mặt thay vì quan hệ: test thẻ không ghim giá trị nào của AI, giá trị nào của bộ đọc**
  AC: AC-7
  file: app/tests/review-card.test.tsx:220
  severity: medium
  source: measurement
  detail: AC-7 hứa hiện «hai giá trị» của bất đồng, renderer in «Bộ đọc: X · AI: Y». Vòng includes trên toàn r.text() (dòng 220-222) chỉ kiểm «Yêu cầu», «Tin rao», «5.000.000.000», «3.000.000.000» có mặt đâu đó trong thẻ. Đột biến: tráo x.bo_doc và x.ai trong DoiChieuBlock (review-card.tsx), hoặc gắn câu trích vào nhầm loại, thì test vẫn xanh trong khi người duyệt đọc ngược hai bên. Quan hệ giá trị với bên và với data-review-doi-chieu-loai không được assert. Phía test tự động không có chỗ nào khác ghim quan hệ này; chỉ còn E12 nhìn ảnh bằng tay.

- **Hình 3, kiểm loại thay vì quan hệ giá trị: đầu ghi giá, diện tích không có assert nào về ai, bo_doc, trich**
  AC: AC-6
  file: agent/tests/doc-toan-bo.test.ts:179
  severity: medium
  source: measurement
  detail: Hàm loai() (dòng 179) rút gọn doi_chieu về d.loai trước khi so. Mọi ca giá, diện tích đều dùng dạng này (dòng 181-192), bên DB cũng vậy (itest dòng 204, 228, 263, 269, 500). Chỉ hàng y_dinh được deepEqual đủ trường (test.ts:165, itest:175). Đột biến: đổi doi_chieu.push ở doc-toan-bo.ts:167,170 thành tráo ai với bo_doc, hoặc trich sai, thì toàn bộ test vẫn xanh. Bàn đo dung-the-e12.mts:42-44 cũng chỉ đếm jsonb_array_length. Lời hứa AC-6, AC-7 là cặp hai giá trị kèm trích, không phải nhãn loại.

- **Hình 2, fixture viết tay đúng khuôn bên đọc: đường thẻ thật đến route thật không có round-trip, E7 thay route bằng SQL chép lại**
  AC: AC-7
  file: app/tests/the-duyet-du-can-cu.test.tsx:747
  severity: high
  source: measurement
  detail: E7 hứa «Fixture E1 trái model + ý định + giá ... duyệt qua hàm của route decide». Test duy nhất gọi route thật («LS1-AC-7 route thật») dùng evidence viết tay { doi_chieu } và không có enrichment_proposals, nên không qua nhánh hasConflict, planEnrichApproval. Đầu ghi thật syncReview, chayLuot không tham gia. Ngược lại, itest dòng 491-494 có thẻ thật nhưng tự chép thứ tự route bằng tay (comment «Đúng thứ tự của route decide»): gọi trực tiếp apply_enrichment, decide_enrichment_review, ghiPhanQuyetDoiChieu với Number(ai.id) tự chọn. Sửa thứ tự hoặc planEnrichApproval trong route thì itest vẫn xanh. Thêm hai điểm: E7 có cmd ls1_db, tức chỉ chạy doc-toan-bo-db.itest.ts, nên test route nằm ngoài lệnh của E7; và test này dùng t.skip(setupErr) trong khi các ca bên cạnh dùng ready() ném đỏ, nên hỏng dựng lược đồ thành skip. DOI_CHIEU trong review-card.test.tsx:214-217 cũng viết tay, không rút từ đầu ghi.

- **Hình 1, đo hằng số thay vì đầu ra: «model là Haiku» chỉ so nhãn TEN_MODEL**
  AC: AC-8
  file: agent/tests/doc-toan-bo-db.itest.ts:335
  severity: medium
  source: measurement
  detail: E8 hứa «không cờ thì ... model Haiku». assert.match(TEN_MODEL.haiku, /haiku/) đọc khoá haiku của một bảng hằng, tức là tên khoá so với chính nó; dòng 333 chỉ kiểm docCo không có khoá model. Model thật được chọn ở getModel("haiku") (doc-toan-bo.ts:86), còn nhãn TEN_MODEL.haiku được gán độc lập vào nhan.model (dòng 91). Đột biến: đổi dòng 86 thành getModel khác thì mọi test vẫn xanh, vì mọi ca đều thay model qua languageModel hoặc hoi, và silver_labels vẫn ghi nhãn Haiku.

- **Hình 4, âm tính rỗng: «0 dòng canonical» của E13 đếm sai bảng trên fixture không có tin, nhánh dưới ngưỡng không kiểm**
  AC: AC-10
  file: agent/tests/doc-toan-bo-db.itest.ts:431
  severity: medium
  source: measurement
  detail: E13 hứa «dưới ngưỡng thoát khác 0, 0 dòng canonical». Biến offers() ở dòng 431 thực ra đếm enrichment_proposals, không đếm sale_offers, và chỉ chạy ở nhánh ĐẠT (dòng 438). baiMau (dòng 415-424) chỉ chèn stg_zalo_posts, không có dòng sale_offers nào cho các bài mẫu, nên không có tin nào để phép đo thấy đổi. Nhánh dưới ngưỡng (dòng 459-464) chỉ kiểm mã thoát 5, chuỗi «DƯỚI NGƯỠNG», coMauDat false; không băm canonical. Dòng loaiHinh(id) === unknown ở 456 thuộc nhánh thoát 6 của tin khác. Vì vậy không có fixture nào đỏ được khi doMau ghi canonical trên bài có tin.

- **Hình 5, điểm-case trên trục khai liệt tay: not_listing và diện tích kèm trích giả không có ca**
  AC: AC-5
  file: agent/tests/doc-toan-bo.test.ts:168
  severity: medium
  source: measurement
  detail: AC-5 liệt hai giá trị «inquiry hoặc not_listing kèm trích dẫn có thật» thì có thẻ mang câu trích. Hợp đồng khai Coverage theo trục B × C liệt tay. Mọi ca đối chiếu ý định dùng inquiry. not_listing chỉ xuất hiện một lần ở dòng 169 và chỉ đọc .de_xuat, không đọc doi_chieu; itest không có not_listing nào. Đột biến: bỏ vế not_listing ở doc-toan-bo.ts:160 vẫn xanh. Tương tự, trích giả, chung bài, bộ đọc không có số (dòng 187-192) chỉ có cho giá. Nhánh diện tích có trichCoThat riêng (doc-toan-bo.ts:169) nhưng không có ca trích giả, nên xoá vế đó không đỏ. Không có bảng trường × loại trích viết trước để số assert khớp số phần tử.

- **Hình 5, điểm-case cho lời hứa cấp lượt: «lùi cả lượt» chỉ revert một id tự chọn**
  AC: AC-9
  file: agent/tests/doc-toan-bo-db.itest.ts:392
  severity: medium
  source: measurement
  detail: AC-9, E9 hứa revert_enrichment «lùi cả lượt». Test lấy [d] = deXuat(c, ap) theo offer_id, revert [d.id] của đúng một đề xuất, rồi kiểm một tin. Lượt có đúng một tin được áp nên không phân biệt được lùi một dòng với lùi cả lượt. Đường vận hành mà đầu script mô tả (--dem in run_id, lấy id applied của run, revert) không được đo: demLuot.runIds chỉ lấy run_id LIKE 'doc-toan-bo-%' trong khi helper chay dùng runId ls1-N, và không assert nào đọc runIds.

- **Hình 3, chuỗi có mặt thay vì quan hệ: đầu ra của --dem chỉ được kiểm bằng một chữ «CỜ ĐỎ»**
  AC: AC-9
  file: agent/tests/doc-toan-bo-db.itest.ts:410
  severity: medium
  source: measurement
  detail: AC-9 nói «When chạy --dem, Then bằng truy vấn đếm độc lập ...», và tên test dòng 372 là «--dem khớp đếm độc lập». Thực tế test đó gọi demLuot, không gọi chayLenh. Lần duy nhất chạy --dem (dòng 408-410) chỉ assert có dòng chứa «CỜ ĐỎ», không so ngày nào bị cờ và không có chiều không cờ ở mức lệnh. Các dòng in tử, mẫu, phần trăm ở doc-toan-bo-s03.ts:90-92 không được đọc. Đột biến: tráo d.coDeXuat với d.coDeXuatKeSkipped trong log, hoặc in cờ cho mọi ngày, thì test vẫn xanh. Con số người vận hành đọc để chấm đích ≥ 90%, ≥ 50% là dòng in này.

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **Thẻ đối chiếu viết tay nhãn ý định, không dùng sổ từ vựng**
  Người dùng thấy gì: Trên màn duyệt, nhãn ý định trong thẻ đối chiếu có thể lệch chữ chuẩn của hệ thống, và giá trị lạ hiện ra mã thô.
  Căn cứ: Chỉ là lệch chữ trên màn nội bộ, không mất dữ liệu, người duyệt vẫn hiểu được và sửa sau rẻ.
  file: `app/src/components/ops/review-card.tsx`
  severity: low
  Đề xuất: known-limits

- **Giá trong khối đối chiếu tự định dạng, bỏ qua fmtGia của cùng hàng duyệt**
  Người dùng thấy gì: Cùng một giá hiện hai kiểu chữ khác nhau trên màn duyệt (ví dụ 5.000.000.000 đ so với 5 tỷ), người duyệt phải đổi trong đầu khi so sánh.
  Căn cứ: Chỉ ảnh hưởng cách đọc, dữ liệu vẫn đúng, người duyệt không bị duyệt nhầm và sửa sau rẻ.
  file: `app/src/components/ops/review-card.tsx`
  severity: low
  Đề xuất: known-limits

- **Thẻ chỉ có đối chiếu bấm «Để sau» là mất hẳn, không bao giờ quyết được**
  Người dùng thấy gì: Nếu người duyệt bấm «Để sau» trên thẻ chỉ có bất đồng cần đối chiếu, thẻ biến mất và không quay lại nữa, nên bất đồng về ý định, giá hay diện tích không bao giờ được quyết.
  Căn cứ: Mất cơ hội duyệt âm thầm trong khi nút ngụ ý sẽ quay lại, người dùng không tự gỡ được; cần quyết định cách xử lý thẻ hoãn nên nên mở việc riêng.
  file: `app/src/components/ops/review-card.tsx`
  severity: high
  Đề xuất: new-contract

- **Đối chiếu đã có phán quyết mọc lại từ thẻ hoãn cũ**
  Người dùng thấy gì: Trong chuỗi hoãn rồi duyệt rồi có đề xuất mới, người duyệt có thể gặp lại đúng bất đồng đã quyết và phải duyệt lần nữa.
  Căn cứ: Chỉ gây duyệt lặp ở một tổ hợp hiếm, không hỏng dữ liệu gốc, chỉ thêm một dòng phán quyết thừa.
  file: `agent/src/enrich/run.ts`
  severity: medium
  Đề xuất: known-limits

- **Dòng skipped do model gây ra chặn vĩnh viễn đề xuất cùng giá trị của E1 và của các lượt sau**
  Người dùng thấy gì: Một trả lời hỏng của AI có thể làm tin đó không bao giờ nhận được loại hình từ luật xác định về sau, nên tin vẫn ở trạng thái chưa rõ loại.
  Căn cứ: Tin chỉ thiếu loại hình chứ không sai, không mất dữ liệu, nhưng gỡ cần xử lý dữ liệu nên nên ghi là hạn chế đã biết.
  file: `agent/src/enrich/doc-toan-bo.ts`
  severity: medium
  Đề xuất: known-limits

- **Lượt thật báo «đã đọc», «còn lại 0», chi tiền và thoát 0 dù lời gọi model thất bại**
  Người dùng thấy gì: Khi lời gọi AI lỗi hàng loạt, lệnh vẫn báo đã đọc xong, còn lại 0 và thoát bình thường, nên người vận hành tưởng đã đọc hết trong khi nhiều tin chưa được đọc.
  Căn cứ: Gây hiểu nhầm tiến độ và số tiền báo, nhưng chạy lại là đọc tiếp được; sửa vừa phải nên đáng làm trước lượt thật.
  file: `agent/src/enrich/doc-toan-bo.ts`
  severity: medium
  Đề xuất: new-contract

- **--mau nuốt lỗi gọi model và báo sai lý do khi dừng vì trần**
  Người dùng thấy gì: Lượt đo mẫu có thể lặng lẽ bỏ qua bài lỗi, làm số đo thấp mà không giải thích, hoặc báo dưới ngưỡng thay vì dừng vì trần.
  Căn cứ: Chỉ làm sai lời giải thích của lượt thử, không ghi dữ liệu; người vận hành chạy lại được.
  file: `agent/src/enrich/doc-toan-bo.ts`
  severity: medium
  Đề xuất: known-limits

- **CLI vứt chi tiết lỗi: chỉ in tên lớp lỗi và số lượng lỗi ghi**
  Người dùng thấy gì: Khi tệp nhãn sai hoặc có tin ghi hỏng, lệnh chỉ báo lỗi chung nên người vận hành khó biết chỗ nào hỏng.
  Căn cứ: Chỉ khó chẩn đoán cho người vận hành, không ảnh hưởng người dùng cuối hay dữ liệu, tự đọc nguyên nhân được.
  file: `agent/scripts/doc-toan-bo-s03.ts`
  severity: low
  Đề xuất: wont-fix

- **Hình 4, âm tính không có đối chứng từng ca: E4 hứa đối chứng dương cùng tin, test chỉ có một đối chứng trên tin khác**
  Người dùng thấy gì: Các ca bị loại có thể bị loại vì tin không bao giờ áp được chứ không phải vì luật trích dẫn, nên bài kiểm chưa phân biệt hai nguyên nhân.
  Căn cứ: Chỉ làm yếu độ tin cậy của bài kiểm, không ảnh hưởng người dùng, bổ sung ca sau rẻ.
  file: `agent/tests/doc-toan-bo-db.itest.ts`
  severity: medium
  Đề xuất: known-limits

- **Hình 4, âm tính không đối chứng: «--thu không ghi ai_calls» thiếu chiều dương cho ai_calls**
  Người dùng thấy gì: Bài kiểm chế độ thử chưa chứng minh được đường ghi lịch sử gọi AI hoạt động khi chạy thật, nên có thể không thấy khi nó hỏng.
  Căn cứ: Chỉ làm yếu bài kiểm, không ảnh hưởng người dùng; bổ sung sau rẻ.
  file: `agent/tests/doc-toan-bo-db.itest.ts`
  severity: low
  Đề xuất: known-limits

- **Hình 3, chuỗi có mặt thay vì quan hệ thứ tự: «thoát 2 trước lời gọi đầu» không có bộ đếm lời gọi**
  Người dùng thấy gì: Chưa có bài kiểm chứng minh lệnh dừng vì thiếu khoá trước khi gọi AI lần nào, nên về lý thuyết có thể tốn tiền trước khi báo lỗi.
  Căn cứ: Rủi ro thấp vì thiếu khoá thì lời gọi cũng không thành công, bổ sung bài kiểm sau rẻ.
  file: `agent/tests/doc-toan-bo-db.itest.ts`
  severity: low
  Đề xuất: known-limits

⚠ Cụm ngoài vùng phủ: 2/21 lỗi rơi vào file không bộ đo nào phủ (app/tests/review-card.test.tsx, app/tests/the-duyet-du-can-cu.test.tsx) — dừng và quyết: mở rộng hợp đồng hay rút phạm vi.
