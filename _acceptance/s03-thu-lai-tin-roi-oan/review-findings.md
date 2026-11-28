# Review findings: s03-thu-lai-tin-roi-oan (round 4)

## Trong hợp đồng

- **Thước gán «phần luật» bỏ qua thẻ nhóm, nên mẫu «10 tin phần C» có thể lẫn tin thực ra vào qua thẻ nhóm**
  AC: AC-5
  file: `pipeline/scripts/do-tin-roi-oan.mjs:50`
  severity: low
  source: conventions
  detail: `phanLuatCua` gọi `suyLoai({...pr}, text, mucDich, null, { pl43: luat })`, tức truyền cứng `mucDichThe = null`. Transform thật truyền `theNhom.get(conversation_id)?.mucDich` (transform-zalo.mjs dòng 1006). Ví dụ một tin mới ở nhóm có thẻ bán, giá từ 1 tỷ: ở transform thật nó vào qua nhánh `the-nhom` ngay khi bật phần A. Ở thước, nhánh thẻ bị tắt nên vòng lặp đi tới C và gán «C». Tin như vậy lọt vào `mau.phanC`, chính là đầu vào ngưỡng AC-6 «≥ 9/10 tin phần C». Phần luật ghi trong tệp mẫu không chắc là phần đã thật sự đưa tin vào.
  rationale: AC-5 yêu cầu thước in tin mới theo phần luật và chọn 10 tin phần C; gán sai phần làm mẫu này sai.

- **phanLuatCua gán phần luật khác cách transform thật chọn bài (không có thẻ nhóm, không gộp khoá nhóm), nên mẫu phần C của AC-6 và bảng đếm theo phần bị lệch**
  AC: AC-5
  file: `pipeline/scripts/do-tin-roi-oan.mjs:50`
  severity: medium
  source: bugs
  detail: runTransformZalo gọi suyLoai với mucDich tính trên bài đã qua veKhoaNhom(p, khoaNhomThat) và mucDichThe = theNhom.get(...).mucDich (thẻ địa chỉ nhóm đã duyệt, TG2). Thước làm khác ở hai chỗ. (1) Dòng 187 tính mucDich bằng mucDichNhom trên conversation_id thô của loadStgPosts, không gộp khoá nhóm. (2) phanLuatCua (dòng 50) gọi suyLoai(..., mucDich, null, { pl43: luat }), luôn bỏ thẻ nhóm. Ví dụ: bài ở nhóm có thẻ «bán» đã duyệt, mucDich là «ca-hai», chỉ nhờ luật A mới có dấu hiệu BĐS. Transform thật nhận bài này qua nhánh `the-nhom` ở luật A. Trong phanLuatCua, bước A rơi xuống «bo» vì mucDichThe = null, bước B cũng vậy, đến bước C (tuMotTy) bài được gán «C» nếu giá từ 1 tỷ, hoặc null («khác»). Bài nhóm đôi khoá cũng lệch tương tự: mucDich thô có thể là «ca-hai» trong khi khoá gộp đã là sale. Hệ quả: dòng «theo phần luật» in sai, và danh sách `phanC` (10 tin đưa người chấm AC-6 theo tiêu chí «phần C ≥ 9/10 tin bán thật») có thể lẫn tin thật ra vào nhờ luật A qua thẻ nhóm. Cách sửa: tính mucDich trên posts.map(p => veKhoaNhom(p, khoaNhomThat)), và truyền mucDichThe từ docTheDaDuyet vào phanLuatCua.
  rationale: Bảng đếm theo phần luật và mẫu 10 tin phần C là đầu ra AC-5, và là đầu vào ngưỡng chấm AC-6; gán phần lệch với transform thật.

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **Mặc định luật tách đôi: hàm đọc giữ luật cũ, hàm quyết loại dùng luật mới, nên đường đọc ảnh S03 (KC3) lệch với transform S03**
  Người dùng thấy gì: Những bài mà đường chính đã nhận thành tin rao vẫn có thể bị đường đọc ảnh coi là thiếu dấu hiệu rồi đem đi đọc ảnh, tốn công mà vô ích. Câu tìm nhà cũng có thể lọt qua đường này.
  Căn cứ: Hậu quả nhẹ: chỉ gây lệch và tốn xử lý ở một đường phụ, không mất hay lộ dữ liệu, chạy lại là sửa được; sửa sau không đắt nhưng cần đo riêng.
  file: `pipeline/transform-zalo.mjs`
  severity: medium
  Đề xuất: new-contract

- **Rào «không sửa kỳ vọng cũ» của pl43_loai_tin cho qua lặng lẽ khi git diff lỗi**
  Người dùng thấy gì: Nếu môi trường kiểm thiếu lịch sử git, bước kiểm xem có ai sửa kỳ vọng cũ sẽ báo đạt dù chưa kiểm được gì.
  Căn cứ: Rủi ro thấp vì CI lấy đủ lịch sử, không ảnh hưởng người dùng cuối; chỉ là lưới an toàn nội bộ, sửa sau rẻ.
  file: `_acceptance/config.yaml`
  severity: low
  Đề xuất: known-limits

- **Hằng YEU_CAU_TRUOC_PL43 không được dùng, mà comment nói là có dùng**
  Người dùng thấy gì: Không ảnh hưởng người dùng; chỉ có thể làm người đọc mã sau này hiểu lầm.
  Căn cứ: Không có tác động lên dữ liệu hay màn hình nào, dọn lúc nào cũng được nên không đáng mở việc riêng.
  file: `pipeline/transform-zalo.mjs`
  severity: low
  Đề xuất: wont-fix

- **suyLoai mặc định dùng luật PL43, còn parsePost, coDauHieuBds và laYeuCau mặc định dùng luật cũ: gọi không truyền luật ra luật lai**
  Người dùng thấy gì: Hai công cụ đo phụ có thể in số liệu theo một luật lai, ví dụ bài giá «1t920» bị tính là không có giá, nên số đo ở đó không khớp với kho thật.
  Căn cứ: Chỉ làm sai số đo nội bộ, không đổi dữ liệu người dùng thấy và chạy lại là có số đúng; sửa rẻ nhưng cần quyết hướng thống nhất.
  file: `pipeline/transform-zalo.mjs`
  severity: medium
  Đề xuất: known-limits

- **Rào «không đổi kỳ vọng» của pl43_loai_tin cho qua im lặng khi git diff lỗi, và bỏ sót dòng trống bị xoá**
  Người dùng thấy gì: Bước kiểm không ai sửa kỳ vọng cũ có thể báo xanh dù chưa kiểm được, và bỏ sót việc xoá dòng trống.
  Căn cứ: Tác động thấp, không chạm dữ liệu người dùng, và sửa sau rẻ; rủi ro thực tế nhỏ vì lịch sử git luôn đủ trên CI.
  file: `_acceptance/config.yaml`
  severity: low
  Đề xuất: known-limits

- **Hình dạng 2 — hàm che trong test tệp mẫu là bản viết tay, không phải hàm che mà lượt --kiem dùng; phép che tên nguồn không được đo**
  Người dùng thấy gì: Không có phép đo tự động nào xác nhận tên nguồn thật được thay bằng mã trong tệp mẫu đưa lên kho công khai, nên nếu hàm che hỏng thì không ai biết trước.
  Căn cứ: Nếu lỗi thật thì lộ tên nguồn và không rút lại được trên kho công khai, nhưng hiện chỉ là thiếu kiểm chứ chưa có lỗi, và người ký đọc tệp mẫu trước khi đẩy.
  file: `pipeline/scripts/do-tin-roi-oan.test.mjs`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 1 — ca «PL43-AC-6» đo câu hướng dẫn in sẵn ở đầu tệp, không đo đầu ra AC-6**
  Người dùng thấy gì: Một bài kiểm tự động mang tên tiêu chí chất lượng nhưng chỉ kiểm câu hướng dẫn, nên dễ bị tưởng là đã có bằng chứng.
  Căn cứ: Không ảnh hưởng người dùng, chỉ gây nhầm khi đọc hồ sơ; người ký chấm tay nên không mất gì.
  file: `pipeline/scripts/do-tin-roi-oan.test.mjs`
  severity: low
  Đề xuất: wont-fix

- **Hình dạng 3 — ca đối chứng «sàn giá bán 300 triệu» ghim một câu đi đường không chạm sàn**
  Người dùng thấy gì: Quy tắc bài giá dưới 300 triệu không thành tin bán chưa được kiểm trên đúng các ca sát ngưỡng, nên nếu luật mới làm lệch chỗ này thì bài tự động không báo.
  Căn cứ: Nếu lệch thì chỉ vài tin bán giá thấp bị nhận sai, người dùng ít thấy và chạy lại luật là sửa được; thêm ca kiểm sau rẻ.
  file: `pipeline/scripts/s03-thu-lai-tin-roi-oan.test.mjs`
  severity: low
  Đề xuất: known-limits

## Chưa adversarial-verify (refuter chết)

⚠ Cụm ngoài vùng phủ: 2/10 lỗi rơi vào file không bộ đo nào phủ (_acceptance/config.yaml) — dừng và quyết: mở rộng hợp đồng hay rút phạm vi.
