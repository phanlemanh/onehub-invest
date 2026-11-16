# Review findings: the-dia-chi-nhom-s03 (round 5)

## Trong hợp đồng

- **Lệnh dựng nháp đọc stg_zalo_posts không gạt bài thử — dựng thẻ cho nhóm thử**
  AC: AC-7
  file: `pipeline/scripts/the-dia-chi-nhom.mjs:25`
  severity: high
  source: conventions
  detail: `docDuLieu` đọc `SELECT DISTINCT ON (post_id) post_id, conversation_id FROM stg_zalo_posts WHERE conversation_id IS NOT NULL` mà không đi qua `testMarker`/`loadStgPosts` của `pipeline/lib/test-posts.mjs` — tệp này tự khai là «định nghĩa DUY NHẤT của «post thử» cho các transform đọc stg_zalo_posts … transform tự gạt post thử ở đầu đọc để canonical sạch dù stg còn hay không». Mọi bộ đọc cùng loại trong kho đều lọc (transform-zalo, label-sample.mjs, mau-soat-cuon-chieu.mjs dùng `tho.filter((r) => !testMarker(r))`). Đo chỉ-đọc trên DB máy thu lúc soát: 28 nhóm có bài, trong đó 2 nhóm gồm TOÀN bài thử (3 bài) — lệnh `--ghi --may-thu` sẽ dựng 2 thẻ cho nhóm không có thật, và `evidence.so_bai`/`so_bai_doc` của các nhóm khác cộng cả bài thử (ngưỡng baiDocToiThieu = 5 và các tỉ lệ đều tính trên con số này). Con số 28 cũng lệch mốc «27/27 nhóm có thẻ» của card-plain.json. `ap-may-thu/kiem-sau.sql` đếm `count(DISTINCT regexp_replace(conversation_id,…)) FROM stg_zalo_posts` bằng chính định nghĩa không lọc nên bước kiểm sau không bắt được. Nhãn (`silver_labels`) gom theo post cũng kế thừa cùng tập bài.
  rationale: AC-7 đòi số nhóm có thẻ bằng số nhóm thật có bài (27); đếm cả bài thử ra 28 và dựng thẻ cho nhóm không thật.

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **Đọc sale_offer_records thay vì view sale_offers — tin đã nghỉ vẫn tính vào ô phường**
  Người dùng thấy gì: Khi máy đoán phường cho một nhóm, nó đếm cả những tin đã ngừng rao, nên nhóm ít tin có thể bị đoán sai phường.
  Căn cứ: Chỉ ảnh hưởng bản nháp, người duyệt thấy và sửa được trước khi thẻ có hiệu lực, không mất hay lộ dữ liệu.
  file: `pipeline/scripts/the-dia-chi-nhom.mjs`
  severity: medium
  Đề xuất: known-limits

- **Biên API không kiểm phân khu phải thuộc dự án đã chọn**
  Người dùng thấy gì: Ai gọi thẳng vào máy chủ có thể lưu một thẻ có phân khu không thuộc dự án đã chọn; màn hình thông thường thì không cho làm vậy.
  Căn cứ: Chỉ người vận hành đã đăng nhập mới làm được, màn hình đã chặn, và thẻ sai vẫn sửa lại được trước khi đóng dấu lên tin.
  file: `app/src/lib/the-dia-chi-nhom.ts`
  severity: medium
  Đề xuất: known-limits

- **Chú thích route nói sai hành vi khi chưa áp migration 108**
  Người dùng thấy gì: Một dòng ghi chú trong mã mô tả sai điều xảy ra khi chưa áp bảng thẻ; người dùng không thấy gì khác.
  Căn cứ: Không ảnh hưởng người dùng, sửa một dòng chú thích bất cứ lúc nào, không đáng mở việc.
  file: `app/src/app/api/v1/ops/group-cards/route.ts`
  severity: low
  Đề xuất: wont-fix

- **Chưa áp 108 trên máy thu lại hiện đúng chữ dành cho cloud**
  Người dùng thấy gì: Nếu máy thu chưa áp bảng thẻ, người vận hành đọc câu bảo mở Ops trên máy thu, trong khi họ đang ở đó rồi; không biết cần áp bảng.
  Căn cứ: Chỉ gây bối rối ngắn trước khi áp, không mất dữ liệu, và hồ sơ áp đã ghi rõ bước cần làm.
  file: `app/src/components/ops/group-cards/group-cards-content.tsx`
  severity: low
  Đề xuất: known-limits

- **Dòng căn cứ vẫn gán giá trị của người vận hành cho máy khi ô ĐÃ được máy điền rồi bị sửa (AC-10 còn hở nửa ca)**
  Người dùng thấy gì: Sau khi người vận hành sửa một ô, mở lại thẻ vẫn thấy dòng căn cứ ghi là do máy đọc từ bài, dù giá trị là do người chọn.
  Căn cứ: Gây hiểu nhầm nguồn của ô đã sửa nhưng giá trị đúng vẫn được lưu, không mất dữ liệu; sửa tương đối rẻ nên nên ghi lại để làm sau.
  file: `app/src/components/ops/group-cards/group-cards-text.ts`
  severity: medium
  Đề xuất: known-limits

- **Ô «Dự án» không bị khoá với vai Người xem — bấm được, xoá chip được, nhưng thao tác bị nuốt im lặng**
  Người dùng thấy gì: Người chỉ xem thấy ô Dự án trông như còn sửa được, bấm vào không có tác dụng và không báo gì.
  Căn cứ: Không ghi được gì và máy chủ vẫn từ chối; chỉ gây khó hiểu nhẹ.
  file: `app/src/components/ops/group-cards/group-cards-dialog.tsx`
  severity: low
  Đề xuất: known-limits

- **ghiNhap: UPDATE ... AND status='nhap' RETURNING * có thể trả 0 dòng → `moi.card_code` ném TypeError và hỏng cả lượt dựng nháp**
  Người dùng thấy gì: Nếu ai đó duyệt một thẻ đúng lúc lệnh dựng nháp đang chạy, lệnh dừng với thông báo khó hiểu.
  Căn cứ: Hiếm gặp, không hỏng dữ liệu vì lượt bị hoàn lại, chạy lại lệnh là xong.
  file: `pipeline/scripts/the-dia-chi-nhom.mjs`
  severity: low
  Đề xuất: known-limits

- **Ô phường đếm cả tin đã nghỉ vì đọc thẳng `sale_offer_records` thay vì view `sale_offers`**
  Người dùng thấy gì: Máy đoán phường có tính cả tin đã ngừng rao hoặc đã bị thay, có thể lệch ở nhóm ít tin.
  Căn cứ: Chỉ ảnh hưởng bản nháp mà người duyệt sẽ xem lại, không mất hay lộ dữ liệu.
  file: `pipeline/scripts/the-dia-chi-nhom.mjs`
  severity: low
  Đề xuất: known-limits

- **Tuyên quét LỚP nhưng chỉ có điểm-case: AC-10 hứa «mỗi ô» nhưng chỉ đo 1 trong 4 ô căn cứ**
  Người dùng thấy gì: Phép kiểm tự động chỉ chắc chắn bắt lỗi ở dòng căn cứ của ô bán/thuê, ba ô còn lại có thể sai mà không bị báo.
  Căn cứ: Không ảnh hưởng người dùng ngay, người ký vẫn xem hộp duyệt bằng mắt; bổ sung ca kiểm sau rẻ.
  file: `app/tests/the-dia-chi-nhom-app.itest.tsx`
  severity: high
  Đề xuất: known-limits

- **Fixture VIẾT TAY đúng khuôn bên đọc: evidence.muc_dich.ban/thue không round-trip writer → reader**
  Người dùng thấy gì: Nếu sau này đổi tên số bài bán/thuê ở bên dựng nháp, dòng căn cứ có thể hiện 0 bán 0 thuê mà phép kiểm vẫn xanh.
  Căn cứ: Chưa gây lỗi nào hiện nay, chỉ là nguy cơ khi sửa sau; thêm ca kiểm nối hai phía là việc rẻ.
  file: `app/tests/the-dia-chi-nhom-app.itest.tsx`
  severity: medium
  Đề xuất: known-limits

- **Đo CHỈ DẪN thay vì ĐẦU RA: sao-luu.sh chấm bằng grep văn bản nguồn, không chạy**
  Người dùng thấy gì: Phép kiểm chỉ đọc chữ trong tệp sao lưu chứ không chạy thử, nên tệp sao lưu hỏng có thể lọt qua.
  Căn cứ: Nếu sao lưu lỗi, lần chạy thật trước khi áp sẽ lộ ra và chưa có dữ liệu nào bị mất.
  file: `pipeline/tests/the-dia-chi-nhom-lui.itest.mjs`
  severity: medium
  Đề xuất: known-limits

- **Lời hứa là QUAN HỆ (khớp trên tổng) nhưng assert là ngưỡng tuyệt đối rời khỏi mẫu số**
  Người dùng thấy gì: Ngưỡng đạt 9 nhóm khớp là con số cố định, khi số nhóm trong sổ đổi thì mức chất lượng thực sự đòi hỏi cũng đổi theo.
  Căn cứ: Chỉ là phép đo trước buổi duyệt, không ảnh hưởng người dùng, ghi chú giới hạn là đủ.
  file: `pipeline/scripts/the-dia-chi-nhom-that.mjs`
  severity: medium
  Đề xuất: known-limits

- **Assertion âm-tính-một-mình: grep «không có trong sync-cloud» không có đối chứng dương, không ghim thông điệp**
  Người dùng thấy gì: Phép kiểm xác nhận thẻ không bị đẩy lên cloud có thể thành luôn-xanh nếu cách khai danh sách sau này đổi.
  Căn cứ: Hiện không gây hại cho người dùng, và rào cloud còn có luật khác bảo vệ.
  file: `pipeline/tests/the-dia-chi-nhom.itest.mjs`
  severity: low
  Đề xuất: wont-fix

⚠ Cụm ngoài vùng phủ: 3/14 lỗi rơi vào file không bộ đo nào phủ (app/src/components/ops/group-cards/group-cards-content.tsx, app/src/components/ops/group-cards/group-cards-text.ts, app/src/components/ops/group-cards/group-cards-dialog.tsx) — dừng và quyết: mở rộng hợp đồng hay rút phạm vi.
