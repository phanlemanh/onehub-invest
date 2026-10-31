# Review findings: dac-trung-nha-s06-len-canonical (round 1)

## Trong hợp đồng

(không có finding nào map được vào AC)

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **Trigger 061 cho qua giá trị stories dạng '3.0', nhưng resolve_offer_fields ép kiểu ::int trên chữ thô nên hỏng cả lô**
  Người dùng thấy gì: Nếu một nguồn ngoài bộ đọc S06 (người duyệt tay, nhập tay) ghi số tầng dạng '3.0', lượt tính giá trị thắng cho cả lô tin có thể dừng giữa chừng. Hiện bộ đọc S06 không tạo ra dạng này nên người dùng chưa gặp.
  Căn cứ: Chỉ xảy ra khi có nguồn ghi tay số tầng lạ dạng; hiện chưa có nguồn nào làm vậy, và lượt chạy lại sau khi sửa dữ liệu là phục hồi được, không mất dữ liệu.
  file: `db/migrations/061_dac_trung_nha.sql`
  severity: medium
  Đề xuất: known-limits

- **FrontageLength trong RESO DD là String (mô tả chiều dài mặt tiền), ở đây lại là numeric mét: lệch kiểu so với luật RESO-first**
  Người dùng thấy gì: Chiều dài mặt tiền được lưu bằng số mét thay vì chữ mô tả như chuẩn ngành, nên khi trao đổi dữ liệu với bên dùng chuẩn có thể phải quy đổi. Người dùng cuối không thấy ảnh hưởng.
  Căn cứ: Nhẹ: chỉ là lệch chuẩn về cách biểu diễn, không làm sai hay mất dữ liệu; ghi chú lại là đủ và sửa sau vẫn rẻ.
  file: `pipeline/mappings.yaml`
  severity: low
  Đề xuất: known-limits

- **Trigger 061 nhận stories dạng '3.0', nhưng resolve_offer_fields ép '::int' thì vỡ, làm hỏng cả lượt phân xử**
  Người dùng thấy gì: Nếu một nguồn ngoài bộ đọc S06 ghi số tầng dạng '3.0', lượt tính giá trị thắng cho cả lô tin có thể dừng. Hiện chưa nguồn nào tạo dạng này nên người dùng chưa gặp.
  Căn cứ: Chưa có nguồn nào gây ra, không mất dữ liệu và chạy lại được sau khi sửa dữ liệu đầu vào; nên ghi lại là giới hạn đã biết.
  file: `db/migrations/061_dac_trung_nha.sql`
  severity: medium
  Đề xuất: known-limits

- **Đặc trưng nhà biến mất khỏi tin S06 thì phát biểu cũ không bị rút, nên cột canonical giữ giá trị cũ mà không báo gì**
  Người dùng thấy gì: Khi tin rao gỡ mất số nhà hay toạ độ, hệ thống vẫn giữ giá trị cũ trên căn đó, có thể hiển thị thông tin đã lỗi thời cho bộ đánh giá.
  Căn cứ: Giá trị cũ từng đúng ở thời điểm thu và chỉ lỗi thời với phần ít tin bị sửa; sửa sau không làm mất dữ liệu nhưng cần một việc riêng về vòng đời.
  file: `pipeline/transform-chotot.mjs`
  severity: low
  Đề xuất: known-limits

- **Hình dạng 5: tuyên quét lớp «mỗi trường × hợp lệ/vắng/rác» nhưng ma trận DT-AC-3 thiếu ô rác của chiều dài và trần WC**
  Người dùng thấy gì: Bộ kiểm thử chưa bắt được lỗi nếu ai đó nới lỏng việc loại chiều dài rác hoặc số phòng tắm quá lớn. Người dùng chỉ ảnh hưởng nếu sau này có thay đổi sai mà không bị phát hiện.
  Căn cứ: Đây là độ chặt của bộ kiểm thử, không phải lỗi dữ liệu hiện tại, và đã được hợp đồng chủ động bỏ ra khỏi phạm vi.
  file: `pipeline/scripts/dac-trung-s06.test.mjs`
  severity: high
  Đề xuất: wont-fix

- **Hình dạng 1: DT-AC-1 kiểm chuỗi trong định nghĩa CHECK thay vì kiểm field_assertions có nhận phát biểu thật không**
  Người dùng thấy gì: Bài kiểm thử đọc khai báo của ràng buộc chứ chưa thử ghi thật, nên có thể bỏ sót một rào khác chặn mã mới. Người dùng cuối không thấy ảnh hưởng trực tiếp.
  Căn cứ: Chỉ làm bài kiểm yếu hơn mức lý tưởng, không gây sai dữ liệu, và các ca khác trong hợp đồng đã ghi thử thật ở các trường số.
  file: `pipeline/scripts/dac-trung-s06.itest.mjs`
  severity: medium
  Đề xuất: wont-fix

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).
