# Review findings: ghep-anh-tren-the-gan-nhan (round 5)

## Trong hợp đồng

Không có.

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **eval-classify vẫn lấy chữ theo ref_id, trong khi nhãn vàng nay gắn theo chữ tin ghép**
  Người dùng thấy gì: Khi bắt đầu chấm máy đọc bằng nhãn người, máy bị chấm trên đường dẫn ảnh chứ không phải chữ của tin mà người đã gắn nhãn. Điểm chất lượng sẽ thấp hơn thực tế mà không có cảnh báo.
  Căn cứ: Điểm sai lặng lẽ có thể làm người ra quyết định hiểu nhầm chất lượng máy đọc, nhưng hiện chưa có nhãn nên chưa có số sai nào được ghi, và sửa trước lần chấm đầu thì rẻ.
  file: `pipeline/lib/eval-classify.mjs`
  severity: high
  Đề xuất: new-contract

- **label-sample bỏ kết quả ghepLat: thiếu cột 076 vẫn báo thành công, lấy thêm vào lát đã ghép thì dòng mới giữ ghep NULL**
  Người dùng thấy gì: Nếu cơ sở dữ liệu chưa được nâng cấp, lệnh lấy mẫu vẫn báo xong nhưng lát không có ghép ảnh. Khi lấy thêm vào lát đã ghép, bài ảnh mới hiện như thẻ một ảnh không chữ và cùng một cụm có thể bị gắn hai lần.
  Căn cứ: Chỉ xảy ra khi người vận hành làm sai thứ tự hoặc lấy thêm vào lát cũ, người gắn nhãn có thể chạy lại lệnh ghép để sửa, nên ghi thành hạn chế đã biết là đủ.
  file: `pipeline/label-sample.mjs`
  severity: medium
  Đề xuất: known-limits

- **CLI label-ghep ghi từng dòng ngoài giao dịch; đứt giữa chừng để lại lát dở, lần chạy sau báo giữ nguyên và exit 0**
  Người dùng thấy gì: Nếu lệnh ghép bị đứt giữa chừng, một phần lát có ghép ảnh và phần còn lại không, nhưng lần chạy sau lại báo giữ nguyên như đã xong. Người gắn sẽ thấy lẫn thẻ ghép và thẻ không ghép.
  Căn cứ: Hiếm gặp và có lối lùi bằng chạy lại với cờ làm lại, nhưng người vận hành dễ không nhận ra lát đang dở nên cần ghi rõ để họ biết.
  file: `pipeline/label-ghep.mjs`
  severity: medium
  Đề xuất: known-limits

- **CLI label-ghep không kiểm đầu vào như label-sample: cờ gõ sai bị bỏ qua, có thể ghi thật khi người chạy tưởng đang chạy thử**
  Người dùng thấy gì: Gõ sai cờ chạy thử cùng cờ ghi thật có thể khiến lệnh ghi thật vào dữ liệu trong khi người chạy tưởng chỉ đang xem thử. Tên lát sai cũng báo thành công với 0 dòng.
  Căn cứ: Hậu quả giới hạn ở người vận hành gõ nhầm và đã có yêu cầu khai rõ đích thật, lệnh lại có lối lùi đặt ghép về rỗng nên không mất dữ liệu gốc.
  file: `pipeline/label-ghep.mjs`
  severity: medium
  Đề xuất: known-limits

- **Route ghi nhãn không chặn dòng trung_voi: POST item_id của dòng trùng cụm vẫn được ghi**
  Người dùng thấy gì: Một tab cũ đang mở hoặc yêu cầu dựng tay vẫn lưu được nhãn vào dòng đã bị ẩn vì trùng cụm. Khi đó cùng một tin có hai bộ nhãn và tiến độ không đếm bộ thứ hai.
  Căn cứ: Chỉ xảy ra khi tab cũ còn mở sau khi chạy lại lệnh ghép hoặc có người cố tình gọi thẳng, nhãn thừa không làm hỏng nhãn đã có và có thể bỏ khi chấm.
  file: `app/src/lib/labels-queries.ts`
  severity: medium
  Đề xuất: known-limits

- **Cột và khoá JSON mới đặt tiếng Việt, trái quy ước tên cột tiếng Anh**
  Người dùng thấy gì: Một số tên trường dữ liệu mới viết bằng tiếng Việt, trái quy ước tên tiếng Anh của dự án. Đổi tên sau khi đã ghi dữ liệu thật sẽ tốn công hơn nhiều.
  Căn cứ: Không ảnh hưởng người dùng cuối nhưng chi phí đổi tên tăng mạnh sau khi ghi 191 dòng thật, nên cần quyết định trước khi áp lên dữ liệu thật.
  file: `db/migrations/076_labels_ghep.sql`
  severity: medium
  Đề xuất: new-contract

- **eval-classify chấm máy trên chữ của ref_id, còn nhãn người nay gắn theo chữ tin ghép**
  Người dùng thấy gì: Khi chấm lần đầu, máy đọc bị chấm trên đường dẫn ảnh trong khi người gắn nhãn dựa trên chữ của tin ghép. Điểm chất lượng thấp giả được ghi lại mà không có cảnh báo.
  Căn cứ: Sai số lặng lẽ có thể dẫn tới đánh giá sai máy đọc, nhưng chưa có nhãn nên chưa ra số sai và sửa trước lần chấm đầu thì rẻ.
  file: `pipeline/lib/eval-classify.mjs`
  severity: high
  Đề xuất: new-contract

- **Đường lấy thêm của layMau gọi ghepLat sai ngữ cảnh: dòng mới không có ghép, hoặc dòng đã có nhãn bị ghi ghép**
  Người dùng thấy gì: Lấy thêm mẫu vào lát cũ có thể làm bài ảnh mới không có ghép, hoặc làm dòng đã gắn nhãn đổi chữ hiển thị và rời khỏi tiến độ. Lệnh vẫn báo thành công.
  Căn cứ: Chỉ xảy ra ở thao tác lấy thêm vào lát cũ, là việc hiếm, nhưng có thể làm lệch nhãn đã gắn nên cần ghi để người vận hành tránh.
  file: `pipeline/label-sample.mjs`
  severity: medium
  Đề xuất: known-limits

- **label-sample nuốt thieu_cot của ghepLat: thiếu migration 076 vẫn báo lấy mẫu thành công**
  Người dùng thấy gì: Nếu chưa áp bản nâng cấp cơ sở dữ liệu, lệnh lấy mẫu vẫn báo xong nhưng lát không có ghép ảnh. Lát sẽ hiện thẻ không ghép cho tới khi có người chạy lệnh ghép.
  Căn cứ: Người gắn không mất dữ liệu và chạy lệnh ghép sau đó là khắc phục được, chỉ là dễ bị bỏ sót.
  file: `pipeline/label-sample.mjs`
  severity: medium
  Đề xuất: known-limits

- **label-ghep ghi từng dòng ngoài giao dịch: đứt giữa chừng thì lần sau báo «giữ nguyên» và exit 0**
  Người dùng thấy gì: Nếu lệnh ghép bị đứt giữa chừng, lần chạy sau báo giữ nguyên dù lát còn dở. Người gắn sẽ thấy lẫn thẻ ghép và không ghép.
  Căn cứ: Hiếm gặp và khắc phục được bằng chạy lại với cờ làm lại, không mất dữ liệu gốc, chỉ cần người vận hành biết.
  file: `pipeline/label-ghep.mjs`
  severity: medium
  Đề xuất: known-limits

- **CLI label-ghep bỏ qua cờ gõ sai và lát không tồn tại vẫn exit 0**
  Người dùng thấy gì: Gõ sai cờ chạy thử có thể dẫn tới ghi thật, và tên lát sai vẫn báo thành công với 0 dòng. Chỉ có con số 0 trong dòng ghi làm dấu hiệu.
  Căn cứ: Hậu quả giới hạn ở người vận hành gõ nhầm và có lối lùi bằng đặt ghép về rỗng, nên chấp nhận và ghi lại.
  file: `pipeline/label-ghep.mjs`
  severity: low
  Đề xuất: known-limits

- **danhSachAnhCum không khử trùng ảnh giữa hai bài như chú thích đã hứa**
  Người dùng thấy gì: Khi cùng một ảnh được lưu ở hai dạng khác nhau, dải ảnh có thể lặp một tấm và nhãn số ảnh đếm dư. Thứ tự ảnh khi xem vẫn khớp.
  Căn cứ: Chỉ là hiển thị dư một tấm, không mất hay lộ dữ liệu, chưa đo được tần suất, và người gắn vẫn gắn đúng được.
  file: `app/src/lib/labels-anh.ts`
  severity: low
  Đề xuất: known-limits

- **Hộp xem lớn không xử lý ảnh lỗi: chuyển tới ảnh hỏng chỉ thấy biểu tượng vỡ, không có câu báo và Thử lại**
  Người dùng thấy gì: Khi xem lớn rồi chuyển tới một ảnh hỏng, người gắn chỉ thấy biểu tượng ảnh vỡ, không có câu báo lỗi và không có nút Thử lại.
  Căn cứ: Nhẹ vì dải ảnh đã báo lỗi và có Thử lại, người gắn đóng hộp xem rồi thử lại từ dải ảnh được.
  file: `app/src/components/ops/labels/anh-bai.tsx`
  severity: low
  Đề xuất: known-limits

- **Hình dạng 3 (lời hứa là quan hệ giữa các giá trị, nhưng phép so không thể lệch): chữ và soLinkKhac của `ghep` NULL là hằng số ở cả hai vế**
  Người dùng thấy gì: Một phép kiểm quan trọng không phát hiện được nếu dòng báo «bài có N liên kết khác» bị làm sai. Người dùng hiện chưa gặp lỗi, nhưng sau này sửa nhầm có thể không bị bắt.
  Căn cứ: Không ảnh hưởng người dùng hôm nay, chỉ làm giảm khả năng bắt lỗi sau này, và bổ sung phép kiểm có thể làm lúc khác.
  file: `app/tests/labels-ghep.test.ts`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 5 (tuyên quét lớp nhưng chỉ là danh sách điểm viết tay): «phải quét đủ đường đọc cụm của app» chỉ kiểm bằng ngưỡng >10 và bỏ sót các route đọc thật**
  Người dùng thấy gì: Phép quét chống luật ghép thứ hai bỏ sót vài tệp nên một luật thời gian riêng đặt ở đó có thể lọt qua mà không bị phát hiện. Hiện chưa có tệp nào vi phạm.
  Căn cứ: Hiện không có sai và giới hạn của phép quét đã được Mạnh chấp nhận một phần, nên chỉ cần ghi lại phạm vi tệp chưa phủ.
  file: `pipeline/scripts/label-ghep.test.mjs`
  severity: low
  Đề xuất: known-limits

⚠ Cụm ngoài vùng phủ: 2/15 lỗi rơi vào file không bộ đo nào phủ (pipeline/lib/eval-classify.mjs) — dừng và quyết: mở rộng hợp đồng hay rút phạm vi.
