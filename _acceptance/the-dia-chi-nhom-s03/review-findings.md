# Review findings: the-dia-chi-nhom-s03 (round 6)

## Trong hợp đồng

Không có.

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **kiem-sau.sql chép tay bản SQL thứ năm của định nghĩa bài thử, ngoài thước GN5/DND-AC-1**
  Người dùng thấy gì: Khi cách nhận ra bài thử đổi, câu kiểm sau khi áp có thể đếm khác lệnh dựng thẻ và báo lệch số thẻ dù không có lỗi thật. Hôm nay hai bên khớp nhau.
  Căn cứ: Chỉ làm sai con số kiểm, không mất hay lộ dữ liệu, và người áp thấy ngay chỗ lệch nên tự xử lý được; hồ sơ đã tự ghi là giới hạn đã biết.
  file: `_acceptance/the-dia-chi-nhom-s03/ap-may-thu/kiem-sau.sql`
  severity: medium
  Đề xuất: known-limits

- **Hai đường đếm nhóm lệch nhau ở bộ lọc kênh apify-facebook**
  Người dùng thấy gì: Nếu một nguồn khác sau này có mã nhóm, phép đo số thẻ sẽ báo đỏ dù thẻ dựng đúng. Hiện chưa xảy ra.
  Căn cứ: Hậu quả là báo động giả khi đo, không ảnh hưởng thẻ người vận hành thấy, và sửa được khi nguồn đó thật sự có mã nhóm.
  file: `pipeline/scripts/the-dia-chi-nhom-that.mjs`
  severity: low
  Đề xuất: known-limits

- **ghiNhap không có đường gỡ thẻ của nhóm không còn đủ điều kiện — bất biến «số thẻ = số nhóm có bài» vỡ vĩnh viễn, E7 đỏ trên bản chép hiện tại**
  Người dùng thấy gì: Nhóm từng có thẻ rồi hết đủ điều kiện (toàn bài thử) vẫn giữ thẻ cũ, nên bộ đếm thẻ trên màn và phép đo cuối có thể lớn hơn số nhóm thật, và phép đo có thể báo đỏ trên bản chép đã dùng trước đó.
  Căn cứ: Chỉ làm số đếm dư vài thẻ của nhóm bài thử, không lộ hay mất dữ liệu thật; dựng lại bản chép hoặc gỡ tay vài thẻ là xử lý được, nên ghi vào hồ sơ áp.
  file: `pipeline/scripts/the-dia-chi-nhom.mjs`
  severity: high
  Đề xuất: known-limits

- **Ảnh chứng E5 và phần mô tả E5 trong evidence-report chụp bản 28 thẻ — không còn khớp số lệnh dựng nháp in ra (26) như AC-5 đòi**
  Người dùng thấy gì: Ảnh minh chứng cho người ký còn hiện 28 thẻ trong khi lệnh mới in 26, nên người ký có thể xem số cũ. Màn hình thật không bị ảnh hưởng.
  Căn cứ: Chỉ là bằng chứng cũ gây hiểu nhầm lúc ký, không đụng dữ liệu; chụp lại rẻ và nên làm trước khi ký, nhưng không phải lỗi người dùng cuối.
  file: `_acceptance/the-dia-chi-nhom-s03/evidence/E5-step1.png`
  severity: medium
  Đề xuất: known-limits

- **Assert một giá trị đơn lẻ trong khi lời hứa là QUAN HỆ (số thẻ = số nhóm có bài sau khi gạt bài thử) — bộ lọc bài thử mới thêm vào kiem-sau.sql không được đo**
  Người dùng thấy gì: Nếu bộ lọc bài thử trong câu kiểm sau bị hỏng, bộ test vẫn xanh và người áp có thể thấy số đếm sai mà không được báo trước.
  Căn cứ: Rủi ro chỉ ở khâu kiểm sau khi áp, lệch số sẽ lộ ngay khi chạy thật; không ảnh hưởng người dùng cuối.
  file: `pipeline/tests/the-dia-chi-nhom-lui.itest.mjs`
  severity: medium
  Đề xuất: known-limits

- **Fixture viết tay đúng khuôn bên đọc — `evidence.muc_dich.ban/thue` không round-trip từ bên ghi (pipeline) sang bên đọc (app)**
  Người dùng thấy gì: Nếu sau này tên trường căn cứ bán/thuê đổi ở bên dựng thẻ, màn duyệt có thể hiện «0 bán, 0 thuê» mà không test nào báo.
  Căn cứ: Chỉ làm sai chữ căn cứ trên màn duyệt nếu có người đổi mã, người duyệt thấy ngay và số liệu thẻ không mất.
  file: `app/tests/the-dia-chi-nhom-app.itest.tsx`
  severity: medium
  Đề xuất: known-limits

- **Tuyên ma trận toàn phần (16 ô × 5 ô dữ liệu) nhưng chỉ assert điểm-case: mỗi ô chỉ so đúng các khoá tác giả liệt kê**
  Người dùng thấy gì: Một số trường hợp dựng nháp có thể ra sai mục đích hoặc phân khu mà test không bắt, nên người duyệt phải tự để ý khi xem thẻ.
  Căn cứ: Thẻ nào cũng qua người duyệt nhận, sửa hay bác trước khi dùng nên sai sót được chặn ở khâu duyệt; chưa có bằng chứng hàm đang sai.
  file: `pipeline/tests/the-dia-chi-nhom.test.mjs`
  severity: medium
  Đề xuất: known-limits

- **Phép đo chất lượng E8 chốt một con số tuyệt đối (khớp ≥ 9) trong khi lời hứa là QUAN HỆ khớp/tổng (9/13) — mẫu số không được ghim**
  Người dùng thấy gì: Nếu số nhóm một dự án đổi, phép đo chất lượng vẫn báo đạt với tỉ lệ thấp hơn 9/13 mà không ai hay.
  Căn cứ: Chỉ làm lỏng một phép đo trước buổi duyệt, không ảnh hưởng dữ liệu hay người dùng; con số in ra vẫn cho người ký thấy tỉ lệ thật.
  file: `pipeline/scripts/the-dia-chi-nhom-that.mjs`
  severity: medium
  Đề xuất: known-limits

- **Assert «chuỗi có mặt» thay cho tính chất được hứa: ca mang tên «sao lưu ra ngoài cây kho» chỉ grep sao-luu.sh, không chạy và không đo chốt chặn đó**
  Người dùng thấy gì: Nếu ai đó làm hỏng chốt chặn của lệnh sao lưu, bộ test vẫn xanh nên có thể sao lưu nhầm vào trong kho hoặc ra tệp rỗng mà không được báo.
  Căn cứ: Rủi ro thấp: lệnh sao lưu do người chạy tay trước khi áp và người đó kiểm tệp ngay; chi phí dựng test chạy thật lớn hơn hậu quả.
  file: `pipeline/tests/the-dia-chi-nhom-lui.itest.mjs`
  severity: low
  Đề xuất: wont-fix

- **Đọc sale_offer_records thay vì view sale_offers — tin đã nghỉ vẫn tính vào ô phường (r5 · tệp đã đổi)**
  Người dùng thấy gì: Khi máy đoán phường cho một nhóm, nó đếm cả những tin đã ngừng rao, nên nhóm ít tin có thể bị đoán sai phường.
  Căn cứ: Chỉ ảnh hưởng bản nháp, người duyệt thấy và sửa được trước khi thẻ có hiệu lực, không mất hay lộ dữ liệu.
  file: `pipeline/scripts/the-dia-chi-nhom.mjs`
  severity: medium
  Đề xuất: known-limits

- **Biên API không kiểm phân khu phải thuộc dự án đã chọn (r5)**
  Người dùng thấy gì: Ai gọi thẳng vào máy chủ có thể lưu một thẻ có phân khu không thuộc dự án đã chọn; màn hình thông thường thì không cho làm vậy.
  Căn cứ: Chỉ người vận hành đã đăng nhập mới làm được, màn hình đã chặn, và thẻ sai vẫn sửa lại được trước khi đóng dấu lên tin.
  file: `app/src/lib/the-dia-chi-nhom.ts`
  severity: medium
  Đề xuất: known-limits

- **Chú thích route nói sai hành vi khi chưa áp migration 108 (r5)**
  Người dùng thấy gì: Một dòng ghi chú trong mã mô tả sai điều xảy ra khi chưa áp bảng thẻ; người dùng không thấy gì khác.
  Căn cứ: Không ảnh hưởng người dùng, sửa một dòng chú thích bất cứ lúc nào, không đáng mở việc.
  file: `app/src/app/api/v1/ops/group-cards/route.ts`
  severity: low
  Đề xuất: wont-fix

- **Chưa áp 108 trên máy thu lại hiện đúng chữ dành cho cloud (r5)**
  Người dùng thấy gì: Nếu máy thu chưa áp bảng thẻ, người vận hành đọc câu bảo mở Ops trên máy thu, trong khi họ đang ở đó rồi; không biết cần áp bảng.
  Căn cứ: Chỉ gây bối rối ngắn trước khi áp, không mất dữ liệu, và hồ sơ áp đã ghi rõ bước cần làm.
  file: `app/src/components/ops/group-cards/group-cards-content.tsx`
  severity: low
  Đề xuất: known-limits

- **Dòng căn cứ vẫn gán giá trị của người vận hành cho máy khi ô ĐÃ được máy điền rồi bị sửa (AC-10 còn hở nửa ca) (r5)**
  Người dùng thấy gì: Sau khi người vận hành sửa một ô, mở lại thẻ vẫn thấy dòng căn cứ ghi là do máy đọc từ bài, dù giá trị là do người chọn.
  Căn cứ: Gây hiểu nhầm nguồn của ô đã sửa nhưng giá trị đúng vẫn được lưu, không mất dữ liệu; sửa tương đối rẻ nên nên ghi lại để làm sau.
  file: `app/src/components/ops/group-cards/group-cards-text.ts`
  severity: medium
  Đề xuất: known-limits

- **Ô «Dự án» không bị khoá với vai Người xem — bấm được, xoá chip được, nhưng thao tác bị nuốt im lặng (r5)**
  Người dùng thấy gì: Người chỉ xem thấy ô Dự án trông như còn sửa được, bấm vào không có tác dụng và không báo gì.
  Căn cứ: Không ghi được gì và máy chủ vẫn từ chối; chỉ gây khó hiểu nhẹ.
  file: `app/src/components/ops/group-cards/group-cards-dialog.tsx`
  severity: low
  Đề xuất: known-limits

- **ghiNhap: UPDATE ... AND status='nhap' RETURNING * có thể trả 0 dòng → `moi.card_code` ném TypeError và hỏng cả lượt dựng nháp (r5 · tệp đã đổi)**
  Người dùng thấy gì: Nếu ai đó duyệt một thẻ đúng lúc lệnh dựng nháp đang chạy, lệnh dừng với thông báo khó hiểu.
  Căn cứ: Hiếm gặp, không hỏng dữ liệu vì lượt bị hoàn lại, chạy lại lệnh là xong.
  file: `pipeline/scripts/the-dia-chi-nhom.mjs`
  severity: low
  Đề xuất: known-limits

- **Ô phường đếm cả tin đã nghỉ vì đọc thẳng `sale_offer_records` thay vì view `sale_offers` (r5 · tệp đã đổi)**
  Người dùng thấy gì: Máy đoán phường có tính cả tin đã ngừng rao hoặc đã bị thay, có thể lệch ở nhóm ít tin.
  Căn cứ: Chỉ ảnh hưởng bản nháp mà người duyệt sẽ xem lại, không mất hay lộ dữ liệu.
  file: `pipeline/scripts/the-dia-chi-nhom.mjs`
  severity: low
  Đề xuất: known-limits

- **Tuyên quét LỚP nhưng chỉ có điểm-case: AC-10 hứa «mỗi ô» nhưng chỉ đo 1 trong 4 ô căn cứ (r5)**
  Người dùng thấy gì: Phép kiểm tự động chỉ chắc chắn bắt lỗi ở dòng căn cứ của ô bán/thuê, ba ô còn lại có thể sai mà không bị báo.
  Căn cứ: Không ảnh hưởng người dùng ngay, người ký vẫn xem hộp duyệt bằng mắt; bổ sung ca kiểm sau rẻ.
  file: `app/tests/the-dia-chi-nhom-app.itest.tsx`
  severity: high
  Đề xuất: known-limits

- **Fixture VIẾT TAY đúng khuôn bên đọc: evidence.muc_dich.ban/thue không round-trip writer → reader (r5)**
  Người dùng thấy gì: Nếu sau này đổi tên số bài bán/thuê ở bên dựng nháp, dòng căn cứ có thể hiện 0 bán 0 thuê mà phép kiểm vẫn xanh.
  Căn cứ: Chưa gây lỗi nào hiện nay, chỉ là nguy cơ khi sửa sau; thêm ca kiểm nối hai phía là việc rẻ.
  file: `app/tests/the-dia-chi-nhom-app.itest.tsx`
  severity: medium
  Đề xuất: known-limits

- **Đo CHỈ DẪN thay vì ĐẦU RA: sao-luu.sh chấm bằng grep văn bản nguồn, không chạy (r5)**
  Người dùng thấy gì: Phép kiểm chỉ đọc chữ trong tệp sao lưu chứ không chạy thử, nên tệp sao lưu hỏng có thể lọt qua.
  Căn cứ: Nếu sao lưu lỗi, lần chạy thật trước khi áp sẽ lộ ra và chưa có dữ liệu nào bị mất.
  file: `pipeline/tests/the-dia-chi-nhom-lui.itest.mjs`
  severity: medium
  Đề xuất: known-limits

- **Lời hứa là QUAN HỆ (khớp trên tổng) nhưng assert là ngưỡng tuyệt đối rời khỏi mẫu số (r5 · tệp đã đổi)**
  Người dùng thấy gì: Ngưỡng đạt 9 nhóm khớp là con số cố định, khi số nhóm trong sổ đổi thì mức chất lượng thực sự đòi hỏi cũng đổi theo.
  Căn cứ: Chỉ là phép đo trước buổi duyệt, không ảnh hưởng người dùng, ghi chú giới hạn là đủ.
  file: `pipeline/scripts/the-dia-chi-nhom-that.mjs`
  severity: medium
  Đề xuất: known-limits

- **Assertion âm-tính-một-mình: grep «không có trong sync-cloud» không có đối chứng dương, không ghim thông điệp (r5 · tệp đã đổi)**
  Người dùng thấy gì: Phép kiểm xác nhận thẻ không bị đẩy lên cloud có thể thành luôn-xanh nếu cách khai danh sách sau này đổi.
  Căn cứ: Hiện không gây hại cho người dùng, và rào cloud còn có luật khác bảo vệ.
  file: `pipeline/tests/the-dia-chi-nhom.itest.mjs`
  severity: low
  Đề xuất: wont-fix

⚠ Cụm ngoài vùng phủ: 2/9 lỗi rơi vào file không bộ đo nào phủ (_acceptance/the-dia-chi-nhom-s03/ap-may-thu/kiem-sau.sql, _acceptance/the-dia-chi-nhom-s03/evidence/E5-step1.png) — dừng và quyết: mở rộng hợp đồng hay rút phạm vi.
