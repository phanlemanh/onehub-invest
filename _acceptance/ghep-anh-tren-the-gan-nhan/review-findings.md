## Trong hợp đồng

- **Hình dạng 4 (âm tính một mình): «tinKe khong co gia tri may» không nhìn thấy mồi ở bài ảnh của cụm**
  file: `_acceptance/ghep-anh-tren-the-gan-nhan/probes/nap.mjs:174` — severity: high — AC: AC-6 — source: measurement
  AC: AC-6
  E7 và AC-6 hứa mù với «mồi ở mọi bài của cụm». Dòng 145 chèn silver_labels cho a1, a2, a3 với listing_intent='not_listing', kind='sale'. Tập quét MOI ở dòng 58 chỉ có TOAMAYGHEP, MOI-ASSERT-GHEP, MOI-PROP-GHEP, rent_lt; rent_lt chỉ gắn với t1 (dòng 144). Đã chạy thử: coMoi(JSON.stringify({listing_intent:'not_listing',kind:'sale'})) trả 0. Nếu tinKe hoặc trang lộ AI đọc của bài ảnh, các assert coMoi(...)===0 ở dòng 174 và 177 vẫn xanh. Offer cũng chỉ nối với t1 (dòng 142), nên phép đo âm tính chỉ phủ mồi của tin chữ. Đối chứng dòng 149 chỉ đếm dòng có trong bảng (moi.s===4), không chứng minh phép quét bắt được giá trị đó. Đối chứng dòng 179 chỉ chèn TOAMAYGHEP là mồi của t1.

- **Hình dạng 4 (âm tính một mình): hai phép so với mốc chạy trên bài không có giá trị máy và không có ảnh, nên trường vừa đổi chỉ so rỗng với rỗng**
  file: `_acceptance/ghep-anh-tren-the-gan-nhan/probes/nap.mjs:237` — severity: medium — AC: AC-6 — source: measurement
  AC: AC-6
  AC-6, E4, E7 hứa bài không ghép giống hệt hàm trước vòng. Cả «ghep rong giong ban truoc» (dòng 171) và «doiChieu khong ghep giong moc» (dòng 237) đều dùng dòng t4. Dòng 93 tạo t4 với media = null; offer chỉ gắn t1 (dòng 142); silver_labels chỉ gắn t1, a1, a2, a3 (dòng 144-145). Vòng này đổi đúng hai chỗ ở nhánh không ghép: refMay trong truy vấn sale_offers, silver_labels và danhSachAnh sang danhSachAnhCum. Với t4, boDoc, aiDoc, soTin, anh đều là null, 0 hoặc rỗng ở cả hai phía. Đọc từ mã: đột biến refMay = g?.chu_ref ?? null hoặc [b] thành [] vẫn cho JSON bằng nhau. Đối chứng dòng 238 chỉ ghi đè boDoc trên kết quả đã lấy, không phải fixture có giá trị máy và ảnh để phép so phân biệt được.

- **Hình dạng 3 (assert chuỗi có mặt trong khi lời hứa là quan hệ): cột chữ của ma trận sáu loại bài luôn đúng ở hai loại không tin chữ**
  file: `_acceptance/ghep-anh-tren-the-gan-nhan/probes/nap.mjs:201` — severity: medium — AC: AC-3 — source: measurement
  AC: AC-3
  E4 «ok ma tran sau loai bai» và AC-3 hứa chữ của thẻ đúng theo từng loại. Dòng 201 assert t.text.startsWith(chu), mà MT dòng 186 (GM3) và 189 (GM6) đặt chu = "". startsWith("") luôn true; đã chạy thử với URL ảnh. Hai bài a5 và a7 có text chính là URL ảnh example.test, nên nếu thẻ trả URL ấy làm chữ thì ca vẫn đếm là đúng. Điều kiện còn lại của dòng 201 là coMaBai, chỉ bắt 'ghep-nap-', không bắt URL; coLink không được gọi trong vòng này. Phép đo cần là t.text === "" hoặc bằng chữ kỳ vọng.

- **Hình dạng 5 (tuyên quét lớp nhưng phủ không đủ): E1 tuyên app/src không có hằng 120, nhưng phép quét app không tìm 120 và không phủ app/src**
  file: `pipeline/scripts/label-ghep.test.mjs:113` — severity: medium — AC: AC-1 — source: measurement
  AC: AC-1
  E1 ghi «label-ghep.mjs và app/src không có hằng 120 của luật ghép, 'ok khong co luat thu hai', đối chứng chèn hằng thì phép quét đỏ». CUA_MAU có 120 nhưng dòng 118 chỉ áp cho hai tệp pipeline. Tệp app đi qua CUA_APP ở dòng 113, regex này không có 120 hay interval. Đã chạy thử: 'const CUA = 120' và "p.posted_at BETWEEN a - interval '120 seconds' AND b" đều lọt, nên luật ghép thứ hai dạng SQL trong labels-queries.ts vẫn xanh. Tập tệp ở dòng 119 chỉ gồm components/ops/labels và sáu tệp lib, không phải app/src. Đối chứng dòng 115-116 chỉ khớp regex với chuỗi literal, không chèn hằng vào tệp rồi chạy qua bước quét như E1 mô tả.

- **Hình dạng 5 (tuyên ma trận nhưng chỉ có điểm-case): E3 tuyên ma trận sáu loại bài, nhưng thiếu loại thiếu người gửi và không assert chữ hay đường ảnh**
  file: `app/tests/labels-ghep.test.ts:37` — severity: medium — AC: AC-3 — source: measurement
  AC: AC-3
  E3 ghi «ca 'GHEP-AC-3' ma trận sáu loại bài: chữ, đường ảnh đúng thứ tự, cờ ghép, số tin chữ gần; ghep null thì kết quả bằng hàm không ghép từng trường». Bảng dòng 37-43 cùng ca null dòng 51 không có loại «thiếu người gửi» mà AC-1 liệt kê: POSTS dòng 27-33 không có bài nào thiếu sender. Vị trí đó thuộc «dong trung cum», vốn không phải loại bài. Mỗi ca chỉ assert refsCuaDong và ghepHien, không có chữ hay đường ảnh của từng loại. Không có assert số phần tử bằng số loại, khác với MA_TRAN bên pipeline. Ca ghep null dòng 51-56 chỉ kiểm refsCuaDong và ghepHien, không so từng trường với hàm không ghép. Ma trận qua tinKe nằm ở nap.mjs thuộc E4, nên lệnh ghep_thuan của E3 không chạy nó.

- **Hình dạng 4 (âm tính một mình): «ghep hai lan khong doi» xanh cả khi --lam-lai bị bỏ qua, và không có ca chứng minh --lam-lai ghi lại**
  file: `_acceptance/ghep-anh-tren-the-gan-nhan/probes/nap.mjs:128` — severity: low — AC: AC-2 — source: measurement
  AC: AC-2
  Dòng 127-128 gọi ghepLat({lat, lamLai:true}) rồi chỉ assert lan2.ghi === 0. Trong label-ghep.mjs, nhánh daCo && !lamLai trả {...kq, giu:true} với ghi = 0. Nếu cờ lamLai bị bỏ qua, phép so idempotent qua giongNhau không chạy mà lan2 vẫn có ghi = 0. Assert không kiểm lan2.giu !== true. Cũng không có đối chứng: sửa một giá trị ghep cho lệch rồi chạy --lam-lai phải được ghi > 0. Vì vậy cả nhánh tính lại và giongNhau có thể hỏng mà phép đo vẫn xanh. Điều duy nhất dương là lan1.ghi > 0, thuộc nhánh ghi từ null.

- **Hình dạng 4 (âm tính một mình): «doc tay khong co chu» không có đối chứng và không kiểm giá trị của item, tang**
  file: `_acceptance/ghep-anh-tren-the-gan-nhan/probes/kin.mjs:47` — severity: low — AC: AC-10 — source: measurement
  AC: AC-10
  AC-10 hứa bảng đọc tay không có chữ hay mã bài thật. Biến lanh ở dòng 47 chỉ kiểm tên khoá, giá trị ket, và ly_do dài tối đa 90 ký tự, không có chuỗi 6 chữ số trở lên hay https?:. Giá trị của item và tang không được kiểm, nên mã bài thật đặt vào item vẫn qua. Một đoạn chữ bài thật ngắn trong ly_do cũng qua, vì quet ở dòng 48 chỉ tìm tên nguồn. Khác với các phép quét khác trong tệp, dòng 47-48 không có đối chứng đưa bảng có mã bài hoặc chữ bài vào để thấy đỏ, nên giá trị ok của phép đo chưa được chứng minh.

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **eval-classify vẫn đọc chữ theo ref_id, lệch với chữ tin ghép mà người gắn đã đọc**
  Người dùng thấy gì: Khi bắt đầu chấm độ đúng của bộ đọc tự động, các bài chỉ có ảnh sẽ bị chấm trên đường dẫn ảnh thay vì chữ của tin ghép, nên điểm hiện thấp hơn thực tế và được ghi lại mà không có cảnh báo.
  Căn cứ: Chưa có nhãn nào được gắn nên chưa ra số sai, nhưng lần chấm đầu sẽ cho điểm tụt giả đúng vào chỉ số cần chứng minh; sửa trước lần chấm đầu thì rẻ.
  file: `pipeline/lib/eval-classify.mjs`
  severity: high
  Đề xuất: new-contract

- **Cột và khoá JSON mới đặt tiếng Việt, trái quy ước tên bảng/cột tiếng Anh**
  Người dùng thấy gì: Một số tên trong cơ sở dữ liệu mới đặt bằng tiếng Việt, lệch quy ước tiếng Anh của dự án; người dùng cuối không thấy gì khác.
  Căn cứ: Không ảnh hưởng người dùng hay dữ liệu hiện tại, chỉ là lệch quy ước; đổi tên lúc này còn rẻ nhưng sau khi ghi dữ liệu thật thì tốn thêm một đợt chuyển.
  file: `db/migrations/076_labels_ghep.sql`
  severity: medium
  Đề xuất: known-limits

- **label-sample bỏ qua kết quả ghepLat: dòng lấy thêm giữ ghep NULL, thiếu cột 076 cũng im lặng**
  Người dùng thấy gì: Nếu lấy thêm tin vào một lát đã có, các tin mới không được ghép ảnh nên cùng một tin có thể bị gắn nhãn hai lần; lệnh vẫn báo thành công.
  Căn cứ: Chỉ xảy ra khi chủ động lấy thêm vào lát cũ, một thao tác hiếm của người vận hành; hậu quả là nhãn trùng, phát hiện và dọn được, không mất dữ liệu.
  file: `pipeline/label-sample.mjs`
  severity: medium
  Đề xuất: known-limits

- **POST nhãn không chặn dòng trung_voi, ghi được vào dòng đã bỏ khỏi hàng và tiến độ**
  Người dùng thấy gì: Nếu một biểu mẫu mở từ trước hoặc một yêu cầu tự dựng gửi nhãn cho tin đã bị bỏ vì trùng, nhãn vẫn được lưu và có thể bị tính hai lần khi chấm.
  Căn cứ: Không có đường thao tác bình thường nào dẫn tới; chỉ gặp khi biểu mẫu cũ còn mở lúc chạy lại ghép, và nhãn thừa dọn được.
  file: `app/src/lib/labels-queries.ts`
  severity: low
  Đề xuất: known-limits

- **eval-classify vẫn chấm theo chữ của ref_id, nên dòng bài ảnh bị chấm trên URL trong khi nhãn gắn theo tin chữ ghép**
  Người dùng thấy gì: Điểm độ đúng của bộ đọc sẽ bị kéo thấp giả vì các bài chỉ có ảnh bị chấm trên đường dẫn ảnh, và con số sai này được lưu lại không kèm cảnh báo.
  Căn cứ: Gây số liệu sai ở đúng chỉ số dùng để chứng minh mô hình, dù chưa có điểm nào được ghi; nên sửa trước lần chấm đầu tiên.
  file: `pipeline/lib/eval-classify.mjs`
  severity: high
  Đề xuất: new-contract

- **label-sample bỏ kết quả ghepLat: dòng lấy thêm giữ ghep NULL, thiếu cột 076 cũng báo thành công**
  Người dùng thấy gì: Khi lấy thêm tin hoặc khi cơ sở dữ liệu chưa cập nhật, lệnh vẫn báo xong trong khi tin mới chưa được ghép ảnh, nên người gắn nhãn có thể thấy tin ảnh lẻ không có chữ.
  Căn cứ: Chỉ gặp ở thao tác vận hành hiếm, hậu quả là vài tin hiện thiếu chữ hoặc gắn trùng, tự phát hiện được và chạy lại ghép là khắc phục.
  file: `pipeline/label-sample.mjs`
  severity: medium
  Đề xuất: known-limits

- **CLI label-ghep ghi ngoài giao dịch; lỗi giữa chừng để lại lát dở mà lần chạy lại vẫn giữ nguyên**
  Người dùng thấy gì: Nếu lệnh ghép ảnh bị lỗi giữa chừng, một phần tin được ghép và phần còn lại thì không, và lần chạy lại báo là đã xong nên người vận hành dễ tưởng đã hoàn tất.
  Căn cứ: Phải có lỗi đúng lúc ghi mới gặp, và cờ chạy lại sửa được hoàn toàn; không làm mất dữ liệu gốc.
  file: `pipeline/label-ghep.mjs`
  severity: medium
  Đề xuất: known-limits

- **Link trong bài ảnh của cụm không được đếm vào soLinkKhac và mất khỏi thẻ không báo gì**
  Người dùng thấy gì: Hiếm khi một bài ảnh trong cụm chứa đường link mà thẻ không báo có link khác, nên người gắn nhãn có thể bỏ sót nội dung đó.
  Căn cứ: Đo thực tế chỉ khoảng 2 trên 549 bài ảnh ở lát chính và 0 ở lát kia, tác động rất nhỏ và không làm sai nhãn.
  file: `app/src/lib/labels-queries.ts`
  severity: low
  Đề xuất: known-limits

⚠ Cụm ngoài vùng phủ: 2/15 lỗi rơi vào file không bộ đo nào phủ (pipeline/lib/eval-classify.mjs) — dừng và quyết: mở rộng hợp đồng hay rút phạm vi.
