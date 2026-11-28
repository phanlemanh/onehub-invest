# Review findings: ghi-tam-do-sau-co-han (round 2)

## Trong hợp đồng

(không có)

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **Lỗi xét hạn ghi tạm bị nuốt: lượt đêm vẫn thoát 0 khi lô quá hạn chưa được rút**
  Người dùng thấy gì: Nếu bước kiểm tra hạn đo bù của lượt chạy đêm gặp lỗi, lượt đó vẫn báo thành công. Lô quá hạn có thể chưa bị rút và giá trị tự ghi tạm vẫn nằm trên tin, trong khi hệ thống vận hành không nhận được tín hiệu lỗi nào.
  Căn cứ: Lỗi chỉ xảy ra khi bước kiểm tra hạn gặp sự cố, và dòng lỗi vẫn hiện trong tổng kết của lượt chạy nên người xem vẫn thấy. Giá trị ghi tạm đều có lô và rút được bằng lệnh tay. Sửa sau không đắt và không làm mất dữ liệu.
  file: `agent/src/enrich/run.ts`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 4 (âm tính một mình, không ghim thông điệp): bẫy thứ tự 066 trong ban-chep.sh tính MỌI lỗi là «bị từ chối»**
  Người dùng thấy gì: Bài kiểm tra phụ trên bản chép DB có thể báo đạt khi hàm hoàn tác bị lỗi vì lý do khác, không phải vì từ chối đúng người. Người dùng cuối không thấy gì khác; chỉ là bằng chứng nghiệm thu yếu hơn mức cần.
  Căn cứ: Không ảnh hưởng dữ liệu hay màn hình của người dùng. Bộ test chính đã kiểm đúng nhánh này nên rủi ro bị bỏ sót thấp. Siết lại sau rất rẻ.
  file: `_acceptance/ghi-tam-do-sau-co-han/probes/ban-chep.sh`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 4 (âm tính một mình, không ghim thông điệp): đột biến AC-4 trong ban-chep.sh coi mọi lệch là «đỏ đúng»**
  Người dùng thấy gì: Phép thử phụ có thể coi một lệch bất kỳ là đã bắt đúng lô. Việc áp dữ liệu lên người dùng không đổi; chỉ là bằng chứng ít sắc hơn.
  Căn cứ: Chỉ làm bằng chứng nghiệm thu kém sắc, không làm sai hay mất dữ liệu nào. Công cụ đột biến chính đã kiểm đúng lô, nên rủi ro thật nhỏ.
  file: `_acceptance/ghi-tam-do-sau-co-han/probes/ban-chep.sh`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 5 (tuyên quét lớp nhưng ma trận lấy từ chính bên viết): ca phieuDocLap lặp trên DAU_DAP_AN_LUAT của mã**
  Người dùng thấy gì: Phép kiểm tra rằng model không thấy đáp án của luật dựa vào chính danh sách dấu hiệu do mã tự khai. Nếu ai bỏ bớt một dấu, bài kiểm tra vẫn xanh và đáp án có thể lọt vào lời nhắc mà không ai hay.
  Căn cứ: Hợp đồng đã ghi nhận đây là chỗ yếu đã biết và chuyển cho một hợp đồng riêng. Hậu quả là tin ghi tạm có thể kém độc lập hơn vẻ ngoài, nhưng giá trị có lô, có hạn đo bù và rút được.
  file: `agent/tests/ghi-tam.test.ts`
  severity: medium
  Đề xuất: new-contract

- **Hình dạng 4 (âm tính một mình, không đối chứng dương): ca AC-6 «lượt đọc toàn bộ» dùng every() trên mảng có thể rỗng**
  Người dùng thấy gì: Một bài kiểm tra về việc lượt đọc toàn bộ không ghi vào trường quá hạn có thể xanh dù lượt đó không tạo đề xuất nào. Người dùng không bị ảnh hưởng trực tiếp; chỉ là bằng chứng kiểm thử ít chắc hơn.
  Căn cứ: Không có dữ liệu nào sai hay mất, vì chỗ hở này đã được đột biến khác che và có ca đối chứng ở nơi khác. Thêm đối chứng sau rất rẻ.
  file: `agent/tests/ghi-tam.test.ts`
  severity: low
  Đề xuất: known-limits

⚠ Cụm ngoài vùng phủ: 2/5 lỗi rơi vào file không bộ đo nào phủ (_acceptance/ghi-tam-do-sau-co-han/probes/ban-chep.sh) — dừng và quyết: mở rộng hợp đồng hay rút phạm vi.
