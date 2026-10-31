## Trong hợp đồng

- Hình dạng 5 (tuyên quét LỚP nhưng chỉ có điểm-case): ma trận DT-AC-3 thiếu ô so với lời hứa «mỗi trường × hợp lệ/vắng/rác»
  file: `pipeline/scripts/dac-trung-s06.test.mjs:17`
  severity: medium
  AC: AC-3
  source: measurement
  detail: evals.yaml E3 hứa ma trận viết trước «mỗi trường × hợp lệ/vắng/rác». Nhưng MA_TRAN (26 dòng, `assert.equal(n, 26)` chỉ tự đếm số dòng của chính nó chứ không đếm số ô trường×lớp) thiếu ít nhất bốn ô: (a) unit_number · vắng (không có dòng payload {} cho mã căn); (b) bathrooms · vắng (không có toilets null/không có) và bathrooms · rác trên trần (lib ghi «WC > 50» là rác, TRAN.wc=50, nhưng không dòng nào thử toilets > 50); (c) lot_size_dimensions · rác ở vế length (chỉ có width rác; không dòng nào width hợp lệ + length 0/âm/>200 để xem chỉ ra frontage_length mà không có lot_size_dimensions); (d) latitude/longitude · vắng cả hai (chỉ có «thiếu kinh độ»). Ví dụ: xoá kiểm `daiOk` hay xoá `wc <= TRAN.wc` trong lib/dac-trung-s06.mjs thì cả 26 dòng vẫn xanh. Ca đỏ duy nhất là khung toạ độ, nên không bù được các ô này.
  rationale: AC-3 đòi ma trận viết trước, mỗi trường một dòng hợp lệ, một dòng vắng, một dòng rác, và dòng width không length; ma trận thiếu ô là AC-3 chưa đủ.

- Hình dạng 4 (assert âm tính một mình): kiểm «0 ô mới khác rỗng thiếu phát biểu sống» trong DT-AC-7 không có đối chứng dương
  file: `pipeline/scripts/do-dac-trung-s06.mjs:134`
  severity: medium
  AC: AC-7
  source: measurement
  detail: `bao(thieu.length === 0, "DT-AC-7 mọi ô mới khác rỗng có phát biểu sống cùng giá trị …")` chỉ đạt khi truy vấn NOT EXISTS trả rỗng. Thước không lần nào cho thấy truy vấn này bắt được một ô thiếu phát biểu, ví dụ bằng cách rút một phát biểu hoặc đổi giá trị một ô trên bản chép rồi đòi gọi tên `offer_id.field`. Lượt gốc GOC chỉ đối chứng cho vế tỉ lệ 95%: ở lượt đó các ô đều rỗng, nên vế này cũng sẽ xanh suông. E7 trong evals.yaml chỉ khai ca đỏ cho vế tỉ lệ. Nếu so khớp `value_key`/`subject_key` lọc nhầm hết dòng thì vế này vẫn xanh. Trái lại, DT-AC-8 cùng tệp có đối chứng dương (đổi property_type).
  rationale: AC-7 đòi mọi ô mới khác rỗng có phát biểu sống cùng giá trị; phép kiểm này xanh suông thì AC-7 không được chứng minh.

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **Hình dạng 5: E4 hứa «giá trị rác không có phát biểu» trong ca DB DT-AC-4, nhưng ca chỉ chạy một tin toàn giá trị hợp lệ**
  Người dùng thấy gì: Chưa có bài thử đưa một tin mang giá trị rác qua toàn bộ quy trình nạp để xác nhận nó không sinh dữ liệu sai. Việc loại rác đã được thử ở bước đọc nên rủi ro thực tế thấp.
  Căn cứ: Rác đã bị chặn từ bước đọc và có kiểm riêng, nên nếu hụt thì cũng chỉ là thiếu một lớp kiểm thêm. Dữ liệu không bị mất, và bổ sung bài thử sau này rẻ.
  file: `pipeline/scripts/dac-trung-s06.itest.mjs`
  severity: low
  Đề xuất: known-limits

- **Hình dạng 3/1 (đo chuỗi có mặt thay vì hành vi): DT-AC-1 đo «field_assertions nhận phát biểu cho 7 mã mới và offer_status» bằng cách tìm chuỗi trong định nghĩa ràng buộc**
  Người dùng thấy gì: Bài thử chỉ xác nhận danh sách mã được phép có chứa tên các trường mới, chưa thử ghi thật cho từng mã. Việc ghi thật đã được kiểm ở bước khác nên nguy cơ lọt lỗi là nhỏ.
  Căn cứ: Ghi thật cho các trường số đã có bài thử riêng, nên chỗ hụt chỉ nằm ở trạng thái chào, ít ảnh hưởng người dùng. Lỗi nếu có sẽ lộ ngay khi nạp và sửa không đắt.
  file: `pipeline/scripts/dac-trung-s06.itest.mjs`
  severity: low
  Đề xuất: known-limits

- **Trigger 061 cho qua giá trị stories dạng '3.0', nhưng resolve_offer_fields ép kiểu ::int trên chữ thô nên hỏng cả lô (r1)**
  Người dùng thấy gì: Nếu một nguồn ngoài bộ đọc S06 (người duyệt tay, nhập tay) ghi số tầng dạng '3.0', lượt tính giá trị thắng cho cả lô tin có thể dừng giữa chừng. Hiện bộ đọc S06 không tạo ra dạng này nên người dùng chưa gặp.
  Căn cứ: Chỉ xảy ra khi có nguồn ghi tay số tầng lạ dạng; hiện chưa có nguồn nào làm vậy, và lượt chạy lại sau khi sửa dữ liệu là phục hồi được, không mất dữ liệu.
  file: `db/migrations/061_dac_trung_nha.sql`
  severity: medium
  Đề xuất: known-limits

- **FrontageLength trong RESO DD là String (mô tả chiều dài mặt tiền), ở đây lại là numeric mét: lệch kiểu so với luật RESO-first (r1)**
  Người dùng thấy gì: Chiều dài mặt tiền được lưu bằng số mét thay vì chữ mô tả như chuẩn ngành, nên khi trao đổi dữ liệu với bên dùng chuẩn có thể phải quy đổi. Người dùng cuối không thấy ảnh hưởng.
  Căn cứ: Nhẹ: chỉ là lệch chuẩn về cách biểu diễn, không làm sai hay mất dữ liệu; ghi chú lại là đủ và sửa sau vẫn rẻ.
  file: `pipeline/mappings.yaml`
  severity: low
  Đề xuất: known-limits

- **Trigger 061 nhận stories dạng '3.0', nhưng resolve_offer_fields ép '::int' thì vỡ, làm hỏng cả lượt phân xử (r1)**
  Người dùng thấy gì: Nếu một nguồn ngoài bộ đọc S06 ghi số tầng dạng '3.0', lượt tính giá trị thắng cho cả lô tin có thể dừng. Hiện chưa nguồn nào tạo dạng này nên người dùng chưa gặp.
  Căn cứ: Chưa có nguồn nào gây ra, không mất dữ liệu và chạy lại được sau khi sửa dữ liệu đầu vào; nên ghi lại là giới hạn đã biết.
  file: `db/migrations/061_dac_trung_nha.sql`
  severity: medium
  Đề xuất: known-limits

- **Đặc trưng nhà biến mất khỏi tin S06 thì phát biểu cũ không bị rút, nên cột canonical giữ giá trị cũ mà không báo gì (r1)**
  Người dùng thấy gì: Khi tin rao gỡ mất số nhà hay toạ độ, hệ thống vẫn giữ giá trị cũ trên căn đó, có thể hiển thị thông tin đã lỗi thời cho bộ đánh giá.
  Căn cứ: Giá trị cũ từng đúng ở thời điểm thu và chỉ lỗi thời với phần ít tin bị sửa; sửa sau không làm mất dữ liệu nhưng cần một việc riêng về vòng đời.
  file: `pipeline/transform-chotot.mjs`
  severity: low
  Đề xuất: known-limits

- **Hình dạng 5: tuyên quét lớp «mỗi trường × hợp lệ/vắng/rác» nhưng ma trận DT-AC-3 thiếu ô rác của chiều dài và trần WC (r1)**
  Người dùng thấy gì: Bộ kiểm thử chưa bắt được lỗi nếu ai đó nới lỏng việc loại chiều dài rác hoặc số phòng tắm quá lớn. Người dùng chỉ ảnh hưởng nếu sau này có thay đổi sai mà không bị phát hiện.
  Căn cứ: Đây là độ chặt của bộ kiểm thử, không phải lỗi dữ liệu hiện tại, và đã được hợp đồng chủ động bỏ ra khỏi phạm vi.
  file: `pipeline/scripts/dac-trung-s06.test.mjs`
  severity: high
  Đề xuất: wont-fix

- **Hình dạng 1: DT-AC-1 kiểm chuỗi trong định nghĩa CHECK thay vì kiểm field_assertions có nhận phát biểu thật không (r1)**
  Người dùng thấy gì: Bài kiểm thử đọc khai báo của ràng buộc chứ chưa thử ghi thật, nên có thể bỏ sót một rào khác chặn mã mới. Người dùng cuối không thấy ảnh hưởng trực tiếp.
  Căn cứ: Chỉ làm bài kiểm yếu hơn mức lý tưởng, không gây sai dữ liệu, và các ca khác trong hợp đồng đã ghi thử thật ở các trường số.
  file: `pipeline/scripts/dac-trung-s06.itest.mjs`
  severity: medium
  Đề xuất: wont-fix

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).
