# Review findings: s03-noi-luat-trich-dan (round 2)

## Trong hợp đồng

(không có finding nào map được vào AC)

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **Cổng mẫu tin mọi dòng dat=true mà không kiểm ngưỡng, nên --nguong-dung thấp mở được ghi thật cho nhánh số phòng**
  Người dùng thấy gì: Nếu người vận hành cố ý hạ ngưỡng độ tin cậy khi đo mẫu, hệ thống vẫn cho phép ghi thật dù độ đúng của nhánh số phòng chưa đạt 0,85. Chạy bình thường với ngưỡng mặc định thì không gặp.
  Căn cứ: Chỉ xảy ra khi có người chủ động hạ ngưỡng, mọi thay đổi đều hoàn tác được theo lượt, và lượt ghi thật còn qua chữ ký riêng của người quyết.
  file: `agent/src/enrich/doc-toan-bo.ts`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 5 (tuyên quét LỚP nhưng chỉ có điểm-case): lớp bọc liệt «hai dạng tạm» trong khi cây còn dạng thứ ba, ma trận không có hàng cho nó**
  Người dùng thấy gì: Bộ kiểm thử đôi khi có thể báo đỏ ngẫu nhiên khi một tệp tạm của test khác biến mất giữa lúc quét. Người dùng cuối không bị ảnh hưởng, chỉ làm phiền người phát triển.
  Căn cứ: Chỉ gây đỏ giả lẻ tẻ trong kiểm thử nội bộ, không mất dữ liệu, chạy lại là qua, và công sửa lớn hơn hậu quả.
  file: `pipeline/scripts/phat-bieu.test.mjs`
  severity: medium
  Đề xuất: wont-fix

- **Hình dạng 1 (đo chỉ dẫn thay vì đầu ra): lời hứa «dấu xử lại một lần mỗi lượt» chỉ đo trên chữ mã nguồn và hằng số, không đo dòng nhật ký thật**
  Người dùng thấy gì: Nếu sau này ai đó sửa để ghi một dòng nhật ký cho mỗi tin, các test vẫn xanh nhưng danh sách thao tác của người trên trang kiểm toán có thể bị đẩy ra khỏi giới hạn 100 dòng.
  Căn cứ: Hiện chưa gây hại vì mã đang ghi đúng một dòng mỗi lượt; rủi ro chỉ xuất hiện khi có thay đổi sau này và dễ phát hiện, sửa test sau cũng rẻ.
  file: `app/tests/audit-loc.test.tsx`
  severity: medium
  Đề xuất: known-limits

- **xuLaiTrich xoá ly_do rồi apply_enrichment có thể đưa đề xuất về skipped: mất căn cứ, không báo gì (r1)**
  Người dùng thấy gì: Nếu có người sửa loại hình của một tin đúng lúc lượt xử lại đang chạy, đề xuất của tin đó có thể bị đánh dấu bỏ qua mà mất lý do, và lệnh vẫn báo thành công. Lượt sau sẽ không xét lại tin này.
  Căn cứ: Hiếm gặp vì phải trùng thời điểm, không làm sai dữ liệu tin, chỉ làm một đề xuất không được thử lại, nên chấp nhận và ghi lại là đủ.
  file: `agent/src/enrich/doc-toan-bo.ts`
  severity: medium
  Đề xuất: known-limits

- **testMarker xét dấu thử trên bài mới nhất của tin, không phải bài đang lọc (r1)**
  Người dùng thấy gì: Với tin có cả bài thử lẫn bài thật, hệ thống có thể dùng nhầm bài thử làm căn cứ hoặc bỏ nhầm bài thật. Phần lớn bài thử đã bị loại từ bước trước nên ít xảy ra.
  Căn cứ: Tác động thực tế nhỏ vì bài thử đã bị gạt ở đầu vào, và một đề xuất sai có thể hoàn tác được.
  file: `agent/src/enrich/doc-toan-bo.ts`
  severity: low
  Đề xuất: known-limits

- **Lệnh của E8 không chạy đủ bộ test LS1 mà AC-8 cam kết (r1 · tệp đã đổi)**
  Người dùng thấy gì: Bằng chứng nghiệm thu có thể xanh dù hai nhóm kiểm tra về hình dạng thẻ duyệt chưa được chạy trong lệnh đó. Người dùng chưa thấy ảnh hưởng gì ngay.
  Căn cứ: Hai nhóm kiểm tra này vẫn được bộ test chung quét tới, nên rủi ro bỏ sót thấp và sửa sau rất rẻ.
  file: `_acceptance/config.yaml`
  severity: low
  Đề xuất: known-limits

- **Chốt «nhà» chỉ xét câu trích: «Bán nhà 3PN» trích «3PN» vẫn tự ghi căn hộ (r1)**
  Người dùng thấy gì: Tin bán nhà riêng mà model chỉ trích phần số phòng như 3PN có thể bị tự ghi nhầm là căn hộ. Người xem tin sẽ thấy sai loại nhà cho một số ít tin.
  Căn cứ: Sai loại hình ảnh hưởng chất lượng nhưng hoàn tác được theo lượt, và mẫu đo cho thấy rất ít ca như vậy; cần đo thêm trên dữ liệu nhiều loại nhà hơn.
  file: `agent/src/enrich/luat-trich-dan.ts`
  severity: medium
  Đề xuất: known-limits

- **apply_enrichment không áp được thì đề xuất vẫn commit ở trạng thái đã mất lý do, lệnh vẫn thoát 0 (r1)**
  Người dùng thấy gì: Hiếm khi một đề xuất không áp được nhưng vẫn bị ghi đã xử lý, và lệnh vẫn báo thành công. Chỉ chênh lệch giữa số qua luật và số đã áp mới lộ ra.
  Căn cứ: Ca này không thường gặp, không làm hỏng dữ liệu tin, và người vận hành thấy được qua chênh lệch số đếm.
  file: `agent/src/enrich/doc-toan-bo.ts`
  severity: medium
  Đề xuất: known-limits

- **Lệnh xử lại thu chi tiết lỗi ghi rồi bỏ, chỉ in số đếm (r1)**
  Người dùng thấy gì: Khi lượt xử lại gặp lỗi, người vận hành chỉ biết có bao nhiêu lỗi mà không biết tin nào, nên khó chẩn đoán. Dữ liệu không mất và chạy lại được.
  Căn cứ: Chỉ ảnh hưởng việc chẩn đoán, không mất hay lộ dữ liệu, chạy lại được và sửa sau rất rẻ.
  file: `agent/scripts/doc-toan-bo-s03.ts`
  severity: low
  Đề xuất: known-limits

- **Hình dạng 4 (âm tính một mình): assert «xử lại không gọi model» không thể đỏ (r1)**
  Người dùng thấy gì: Kiểm tra tự động cho cam kết không gọi model khi xử lại yếu hơn vẻ ngoài, nên nếu sau này có người thêm lời gọi model có thể không bị phát hiện ngay.
  Căn cứ: Chức năng hiện đúng và còn một lưới đếm lời gọi khác, nên rủi ro nằm ở tương lai và sửa test rẻ.
  file: `agent/tests/xu-lai-trich-db.itest.ts`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 3 (chuỗi có mặt thay vì quan hệ): số «AI đã áp dự kiến» chỉ kiểm bằng regex (r1)**
  Người dùng thấy gì: Con số tỉ lệ AI đã áp dự kiến dùng để quyết định ghi thật chưa được test tự động kiểm đúng giá trị, chỉ kiểm có in ra.
  Căn cứ: Con số chỉ để tham khảo trước khi người duyệt, đã được đối chiếu tay (1.936/3.708), và củng cố test là việc rẻ.
  file: `agent/tests/xu-lai-trich-db.itest.ts`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 2 (fixture viết tay): ca «người chốt» dùng tầng `human` không writer nào ghi và không reader nào đọc (r1)**
  Người dùng thấy gì: Kiểm tra tự động cho ca tin do người chốt dùng dữ liệu mẫu không giống cách hệ thống ghi thật, nên chưa chứng minh chắc rằng tin do người chốt được giữ nguyên.
  Căn cứ: Hành vi giữ ô đã có giá trị vẫn đúng qua đường khác; rủi ro chỉ ở độ tin cậy của test, sửa sau rẻ.
  file: `agent/tests/xu-lai-trich-db.itest.ts`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 4 (âm tính một mình): AC-7 chỉ assert tầng khác `inferred`, không ghim căn cứ sau áp (r1)**
  Người dùng thấy gì: Test tự động chưa khẳng định chắc tin loại suy sau khi áp là căn hộ có căn cứ đúng mức, nên một lỗi nhỏ về mức tin cậy có thể không bị bắt.
  Căn cứ: Chỉ là độ chặt của test, dữ liệu thật không bị ảnh hưởng, và bổ sung assert rất rẻ.
  file: `agent/tests/xu-lai-trich-db.itest.ts`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 4 (âm tính một mình): ca model nói loại khác chỉ kiểm `.ok === false`, chốt thân bài không có đối chứng cùng câu (r1)**
  Người dùng thấy gì: Kiểm tra tự động chưa so sánh trực tiếp cùng một câu trích khi model nói căn hộ và khi nói loại khác, nên khó chắc lý do từ chối đúng nguồn.
  Căn cứ: Kết quả từ chối vẫn được kiểm, thiếu chỉ là đối chứng, và thêm ca test sau rất rẻ.
  file: `agent/tests/luat-trich-so-phong.test.ts`
  severity: low
  Đề xuất: known-limits

- **Hình dạng 2 (fixture viết tay): dòng đề xuất `street_raw` và nhãn mồi được INSERT tay (r1)**
  Người dùng thấy gì: Một số dữ liệu mẫu trong kiểm tra tự động được viết tay thay vì sinh bằng đường chạy thật, nên độ sát thực tế của test giảm nhẹ.
  Căn cứ: Đã được ghi trong sổ quyết định, không ảnh hưởng người dùng, và đổi dần khi có dịp.
  file: `agent/tests/xu-lai-trich-db.itest.ts`
  severity: low
  Đề xuất: known-limits

- **Hình dạng 6 (đường dẫn hardcode ROOT): E9 cố định tệp nhãn vào checkout chính (r1 · tệp đã đổi)**
  Người dùng thấy gì: Kết quả đo độ đúng phụ thuộc một tệp nhãn nằm ngoài kho mã trên máy của tác giả, nên người khác chạy lại có thể không ra cùng kết quả.
  Căn cứ: Chỉ ảnh hưởng khả năng tái hiện bằng chứng, không đụng dữ liệu người dùng, và tệp nhãn vẫn đúng trên máy thu.
  file: `_acceptance/config.yaml`
  severity: low
  Đề xuất: known-limits

⚠ Cụm ngoài vùng phủ: 2/3 lỗi rơi vào file không bộ đo nào phủ (pipeline/scripts/phat-bieu.test.mjs, app/tests/audit-loc.test.tsx) — dừng và quyết: mở rộng hợp đồng hay rút phạm vi.
