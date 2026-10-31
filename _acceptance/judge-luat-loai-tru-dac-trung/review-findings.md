# Review findings: judge-luat-loai-tru-dac-trung (round 1)

## Trong hợp đồng

(không có finding nào map được vào AC)

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **block_raw được gắn nhãn «mã căn» (khac_ma_can), trong khi CONTEXT.md định nghĩa block_raw là «Toà»**
  Người dùng thấy gì: Người duyệt thấy lý do «mã căn khác» trong khi bảng so sánh của thẻ ghi cùng giá trị đó là «Toà». Chỉ lệch chữ gọi, không làm sai kết luận.
  Căn cứ: Chỉ là nhãn gọi tên lệch nhau, không làm mất dữ liệu hay đổi kết luận, sửa sau rẻ.
  file: `agent/src/agents/judge-entity.ts`
  severity: medium
  Đề xuất: known-limits

- **khoaDuong bỏ tiền tố không dấu «duong/pho» mà không cần ranh giới từ, nên cùng một đường viết có dấu và không dấu bị loại thành «khác căn»**
  Người dùng thấy gì: Hai tin cùng một con đường, một tin viết có dấu và một tin không dấu, có thể bị coi là hai căn khác nhau và bị loại oan khỏi việc ghép.
  Căn cứ: Loại oan là lỗi lặng, người dùng khó thấy và không tự gỡ được, nhưng chỉ xảy ra với tên đường viết không dấu và sửa không đắt.
  file: `agent/src/agents/judge-entity.ts`
  severity: medium
  Đề xuất: new-contract

- **Khoá so đường/tầng/toà của luật lệch khỏi khoá của thẻ duyệt, trái pattern «luật so bằng đúng khoá của thẻ» đang có trong file**
  Người dùng thấy gì: Có trường hợp bảng so của thẻ hiện «Lệch» nhưng hệ thống vẫn coi là cùng căn, nên người duyệt có thể thấy hai tín hiệu không khớp nhau.
  Căn cứ: Chỉ gây bối rối khi đọc thẻ, kết luận vẫn theo hướng thận trọng và không mất dữ liệu.
  file: `agent/src/agents/judge-entity.ts`
  severity: low
  Đề xuất: known-limits

- **Kỳ vọng E5 trong evals.yaml mô tả fixture khác với test đã viết**
  Người dùng thấy gì: Người dùng cuối không gặp gì. Chỉ là mô tả kiểm thử ghi số liệu cũ so với bản test thật.
  Căn cứ: Không ảnh hưởng người dùng, chỉ là chữ trong hồ sơ nghiệm thu, sửa lại lúc nào cũng được.
  file: `_acceptance/judge-luat-loai-tru-dac-trung/evals.yaml`
  severity: low
  Đề xuất: known-limits

- **Luật «mã căn» so block_raw nguyên văn, mà block_raw lẫn tên chuẩn của toà với mã thô, nên cùng một toà có thể ra «khác căn»**
  Người dùng thấy gì: Hai tin cùng một toà nhưng một bên ghi tên chuẩn, bên kia ghi tên gọi tắt, có thể bị loại oan là khác căn mà không còn đường «chưa chắc».
  Căn cứ: Loại oan lặng lẽ làm mất cơ hội ghép đúng và người dùng khó tự phát hiện, nhưng chỉ ảnh hưởng một phần tin có mã toà.
  file: `agent/src/agents/judge-entity.ts`
  severity: medium
  Đề xuất: new-contract

- **Probe LT-AC-6 so khớp tuyệt đối danh sách id thẻ trên DB máy thu đang sống, nên đỏ ngay khi người duyệt quyết thêm thẻ**
  Người dùng thấy gì: Khi người duyệt quyết thêm thẻ ghép căn mới, bước kiểm của máy thu sẽ báo đỏ dù luật không hề sai.
  Căn cứ: Chỉ gây báo đỏ giả cho người vận hành, không ảnh hưởng dữ liệu hay người dùng cuối, và dễ nhận ra.
  file: `agent/tests/judge-luat.test.ts`
  severity: medium
  Đề xuất: known-limits

- **Khoá đường bỏ tiền tố không dấu «duong»/«pho» làm lệch tên đường viết không dấu**
  Người dùng thấy gì: Cùng một con đường viết có dấu và không dấu có thể bị coi là hai đường khác nhau, khiến cặp tin bị loại oan.
  Căn cứ: Loại oan lặng lẽ, người dùng không tự gỡ được, nhưng phạm vi hẹp và sửa không đắt.
  file: `agent/src/agents/judge-entity.ts`
  severity: low
  Đề xuất: new-contract

- **Hình dạng 5 — tuyên quét LỚP «năm đặc trưng + diện tích» nhưng bộ tính độc lập của probe LT-AC-6 chỉ phủ 2/5 đặc trưng**
  Người dùng thấy gì: Phép đối chiếu luật với quyết định của người trên dữ liệu thật chưa kiểm hết các thẻ khác đường, khác mã căn hay khác tầng, nên có thể bỏ sót lỗi về sau.
  Căn cứ: Không ảnh hưởng người dùng hôm nay, chỉ là kiểm thử chưa phủ rộng, bổ sung sau rẻ.
  file: `agent/tests/judge-luat.test.ts`
  severity: medium
  Đề xuất: known-limits

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).
