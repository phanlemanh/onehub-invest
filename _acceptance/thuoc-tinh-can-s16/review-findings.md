# Review findings: thuoc-tinh-can-s16 (round 3)

## Trong hợp đồng

Không có finding nào map được vào AC.

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **Bộ nạp nhận schemaVersion 14 và kind mngt-can-chi-tiet nhưng DATA-CONTRACT trên nhánh chưa khai**
  Người dùng thấy gì: Dữ liệu thuộc tính căn có thể vào hệ thống trước khi tài liệu giao diện thu thập ghi nhận hình dạng của nó, nên người đọc tài liệu sẽ thiếu thông tin về loại dữ liệu này.
  Căn cứ: Chỉ là chuyện thứ tự gộp giữa hai làn, không làm sai số liệu nào trên màn và sửa sau chỉ là gộp thêm một mục tài liệu.
  file: `pipeline/import-s16-chi-tiet.mjs`
  severity: high
  Đề xuất: known-limits

- **Bộ nạp báo thành công và COMMIT khi tệp items sai hình dạng hoặc không có dòng hợp lệ**
  Người dùng thấy gì: Nếu tệp thu về sai khuôn, lượt nạp vẫn báo thành công với 0 dòng, nên người vận hành có thể tưởng dữ liệu đã đủ trong khi trang dự án không có thuộc tính nào.
  Căn cứ: Không làm mất hay lộ dữ liệu; lỗi thể hiện ngay ở số phủ bằng 0 trên màn và chạy nạp lại được sau khi sửa tệp.
  file: `pipeline/import-s16-chi-tiet.mjs`
  severity: medium
  Đề xuất: known-limits

- **Lỗi đọc v_s16_can bị nuốt nên chạy thử bỏ luật loại mã mơ hồ toà**
  Người dùng thấy gì: Khi việc đọc danh sách mã mơ hồ gặp lỗi, lệnh chạy thử vẫn in số mà không báo gì, nên số đối chiếu trước khi áp có thể lệch mà người xem không biết.
  Căn cứ: Chỉ xảy ra khi cơ sở dữ liệu lỗi bất thường, chạy thử không ghi gì, và bước đối chiếu với số đã ký ở khâu áp thật sẽ lộ lệch.
  file: `pipeline/scripts/thuoc-tinh-can-s16.mjs`
  severity: medium
  Đề xuất: known-limits

- **Chỉ dẫn đầu tệp lùi 113 mâu thuẫn với điều kiện chặn của chính tệp**
  Người dùng thấy gì: Người xử lý sự cố đọc dòng hướng dẫn đầu tệp lùi sẽ làm sai thứ tự và lệnh lùi sẽ từ chối chạy.
  Căn cứ: Lệnh từ chối an toàn nên không mất dữ liệu, và hướng dẫn đúng đã có trong tài liệu áp máy thu, sửa một dòng chú thích là xong.
  file: `_acceptance/thuoc-tinh-can-s16/lui/113-lui.sql`
  severity: low
  Đề xuất: known-limits

- **Nhãn UI «thuộc tính căn» là khái niệm mới nhưng chưa có thuật ngữ trong CONTEXT.md**
  Người dùng thấy gì: Một số nhãn mới trên trang dự án chưa có định nghĩa trong bảng từ vựng chung, nên các phiên làm sau có thể gọi cùng khái niệm bằng chữ khác nhau.
  Căn cứ: Chỉ ảnh hưởng độ nhất quán chữ, người dùng không bị sai số liệu và thêm mục từ vựng sau rất rẻ.
  file: `app/src/components/ops/registry/du-an-toa-grid.tsx`
  severity: low
  Đề xuất: known-limits

- **Nuốt lỗi đọc v_s16_can: chạy thử coi mã mơ hồ toà là mã thường và in số sai, thoát 0**
  Người dùng thấy gì: Khi việc đọc danh sách mã mơ hồ lỗi, lệnh chạy thử in số sai mà vẫn báo thành công, nên người vận hành khó nhận ra số chạy thử không đáng tin.
  Căn cứ: Chỉ xảy ra khi cơ sở dữ liệu lỗi, chạy thử không ghi gì và so với số khoá ở khâu áp thật sẽ phát hiện, nên có thể làm lại.
  file: `pipeline/scripts/thuoc-tinh-can-s16.mjs`
  severity: medium
  Đề xuất: known-limits

- **Căn chuyển sang mơ hồ toà ở lần thu sau vẫn giữ phát biểu fact cũ**
  Người dùng thấy gì: Nếu một căn về sau bị xếp vào nhóm mã mơ hồ, trang Danh bạ vẫn hiện diện tích, hướng, loại hình cũ của nó trong khi giá đã biến mất, nên người kiểm có thể thấy số không còn đúng.
  Căn cứ: Chỉ xảy ra từ lượt thu thứ hai trở đi và với số ít căn đổi nhóm, nên chưa ảnh hưởng đợt áp đầu; sửa sau không mất dữ liệu nhưng cần một hàng riêng để thiết kế việc rút phát biểu.
  file: `pipeline/scripts/thuoc-tinh-can-s16.mjs`
  severity: medium
  Đề xuất: new-contract

- **Rào chặn máy chủ ngoài và rào --db-that kiểm khác với nơi pg thực sự kết nối**
  Người dùng thấy gì: Trong một cấu hình biến môi trường lệch, lệnh ghi có thể nối tới máy khác với máy mà rào kiểm tra tưởng, nên dữ liệu S16 có nguy cơ ghi ra ngoài máy thu.
  Căn cứ: Cần cấu hình lệch hiếm gặp do người vận hành tự đặt, nhưng hậu quả là dữ liệu nhạy cảm rời máy không rút lại được, nên nên ghi rõ và theo dõi.
  file: `pipeline/scripts/thuoc-tinh-can-s16.mjs`
  severity: medium
  Đề xuất: known-limits

- **Lý do lỗi của lớp đọc thuộc tính bị bỏ, không log ở đâu**
  Người dùng thấy gì: Khi trang dự án không tải được thuộc tính, người vận hành chỉ thấy thông báo chung và không ai biết nguyên nhân thật trong nhật ký máy chủ.
  Căn cứ: Tải lại là thử lại được, không mất dữ liệu; chỉ làm chẩn đoán lỗi chậm hơn và thêm log sau rất rẻ.
  file: `app/src/components/ops/registry/du-an-content.tsx`
  severity: low
  Đề xuất: known-limits

- **Giá theo m² của nhà thấp tầng bị gắn nhãn «thông thuỷ» dù mẫu số là sàn sử dụng**
  Người dùng thấy gì: Với nhà thấp tầng, đơn giá trên mỗi m² hiện nhãn «thông thuỷ» nhưng thực ra tính trên diện tích sàn, nên người xem hiểu sai cơ sở tính.
  Căn cứ: Con số đúng, chỉ nhãn sai ở nhóm nhà thấp tầng trên màn nội bộ của người vận hành, sửa sau rẻ và không mất dữ liệu.
  file: `app/src/components/ops/registry/du-an-toa-grid.tsx`
  severity: low
  Đề xuất: known-limits

- **Hình dạng 4 — Assertion âm tính một mình: «registry_inherit không thắng» vẫn xanh khi bỏ bộ lọc của view**
  Người dùng thấy gì: Bài kiểm tra có thể không phát hiện nếu về sau ai đó làm view hiện nhầm giá trị kế thừa thay cho giá trị thu thật.
  Căn cứ: Hành vi hiện tại đúng và không ảnh hưởng người dùng ngay, rủi ro chỉ khi sửa view sau này, khi đó có thể bổ sung ca kiểm.
  file: `pipeline/tests/thuoc-tinh-can-s16.itest.mjs`
  severity: high
  Đề xuất: known-limits

- **Hình dạng 1 — Đo giá trị trung gian thay vì đầu ra: E5 hứa bảng in của lệnh nhưng không ca nào gọi inBang**
  Người dùng thấy gì: Bảng chạy thử in ra có thể khác khuôn đã hứa (thừa hoặc thiếu cột) mà bài kiểm tra vẫn báo đạt.
  Căn cứ: Số liệu trong bảng vẫn đúng, chỉ trình bày có thể lệch; người xem tự nhận ra và sửa sau không mất gì.
  file: `_acceptance/thuoc-tinh-can-s16/evals.yaml`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 2 — Fixture viết tay đúng khuôn bên đọc: không có round-trip từ bộ nạp thật sang lệnh phát biểu**
  Người dùng thấy gì: Bài kiểm tra tự động dùng dữ liệu viết tay nên có thể không bắt được chỗ bộ nạp thật ghi khác khuôn, mà chỉ lộ khi chạy trên dữ liệu thật.
  Căn cứ: Giới hạn đã khai từ đầu và có bước đối chiếu với số khoá trên dữ liệu thật trước khi áp, nên lệch sẽ bị phát hiện chứ không âm thầm.
  file: `pipeline/tests/thuoc-tinh-can-s16.itest.mjs`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 4 — Đối chứng giả: đột biến «bỏ khối bắt lỗi» chỉ kiểm chính đột biến, không kiểm ca lỗi nội tuyến**
  Người dùng thấy gì: Một bài kiểm tra tự động chưa chứng minh được rằng thông báo lỗi trên trang sẽ biến mất khi ai đó bỏ khối xử lý lỗi.
  Căn cứ: Người dùng không thấy hậu quả nào hiện tại, chỉ là bảo vệ chống lỗi tương lai yếu hơn mức ghi, chi phí viết lại bài đo vượt xa lợi ích.
  file: `app/tests/thuoc-tinh-can.test.tsx`
  severity: medium
  Đề xuất: wont-fix

- **Hình dạng 5 — Tuyên quét lớp nhưng chỉ có điểm-case: soát tên nguồn thật chỉ dò một token tự cấy**
  Người dùng thấy gì: Việc soát tên nguồn thật trên trang dự án mới thử với một chữ mẫu, chưa thử với toàn bộ tên thật đã đăng ký, nên khả năng lọt tên nguồn chưa được loại trừ hoàn toàn.
  Căn cứ: Chưa có bằng chứng tên nào lọt ra; nếu lọt thì chỉ hiện trên màn nội bộ máy thu, tự gỡ được, nhưng đây là luật bảo mật nên nên bổ sung bài đo sớm.
  file: `app/tests/thuoc-tinh-can.test.tsx`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 4 — Assertion âm tính không ghim thông điệp: E2 hứa nêu tên ràng buộc, ca chỉ so mã 23514**
  Người dùng thấy gì: Bài kiểm tra chỉ chắc dòng sai bị từ chối, chưa chắc bị từ chối bởi đúng quy tắc dự định.
  Căn cứ: Dòng sai vẫn bị chặn nên dữ liệu không bị hỏng; chênh lệch chỉ ở độ chính xác của bài đo, không đáng công sửa.
  file: `pipeline/tests/thuoc-tinh-can-s16.itest.mjs`
  severity: low
  Đề xuất: wont-fix

⚠ Cụm ngoài vùng phủ: 4/16 lỗi rơi vào file không bộ đo nào phủ (pipeline/import-s16-chi-tiet.mjs, _acceptance/thuoc-tinh-can-s16/lui/113-lui.sql, _acceptance/thuoc-tinh-can-s16/evals.yaml) — dừng và quyết: mở rộng hợp đồng hay rút phạm vi.
