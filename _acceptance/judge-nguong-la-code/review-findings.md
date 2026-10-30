# Review findings: judge-nguong-la-code (round 1)

## Trong hợp đồng

- **Lý do luật làm tròn độ lệch thành đúng số ngưỡng, nên prompt model nhận vẫn có «15%/10%/30%» và câu chữ trái với kết luận**
  AC: AC-2
  file:line: `agent/src/agents/judge-entity.ts:50`
  severity: low
  source: bugs
  detail: phanTram dùng Math.round(x*100). Với lg = 0.149, cặp được kết luận yes nhưng lý do ghi «giá/m² lệch 15%». Với lg = 0.296, kết luận unsure; với lg = 0.304, kết luận no; cả hai đều ghi «lệch 30%». Tương tự, ld = 0.096 ghi «diện tích lệch 10%» kèm kết luận yes. Chuỗi này đi vào buildJudgeInput, tức là prompt model nhận, và vào ai_reasoning cho người duyệt. AC-2 yêu cầu prompt model thật sự nhận không chứa '15%/10%/30%' ở mọi nhánh, nhưng trên dữ liệu thật thì vi phạm (evals đã cố ý loại các ô sát ngưỡng). Người duyệt cũng thấy cùng câu «lệch 30%» mà hai kết luận khác nhau.

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **UPDATE thẻ đang chờ không chặn lại status='pending' — chạy cùng lúc người duyệt có thể ghi đè thẻ người vừa quyết**
  Người dùng thấy gì: Nếu người duyệt bấm quyết đúng lúc máy đang chấm lại cùng thẻ đó, phần gợi ý và lời giải thích của máy trên thẻ có thể bị đổi sau khi người đã quyết. Quyết định của người vẫn giữ nguyên.
  Căn cứ: Chỉ xảy ra khi hai việc trùng nhau trong vài giây, quyết định của người không mất, và chạy lại là thấy đúng; sửa nhỏ nhưng hậu quả nhẹ nên ghi lại là đủ.
  file: `agent/scripts/judge-run.ts`
  severity: medium
  Đề xuất: known-limits

- **Bộ đếm 'thẻ mới' tăng cả khi INSERT … ON CONFLICT DO NOTHING không chèn được dòng nào**
  Người dùng thấy gì: Dòng tổng kết sau khi chạy có thể báo nhiều thẻ mới hơn số thẻ thật sự được tạo, trong trường hợp hiếm có thẻ trùng xuất hiện cùng lúc. Dữ liệu trong bảng vẫn đúng.
  Căn cứ: Chỉ làm con số in ra lệch trong tình huống hiếm, không mất hay sai dữ liệu, người vận hành đếm lại được trong bảng nên không đáng mở việc riêng.
  file: `agent/scripts/judge-run.ts`
  severity: low
  Đề xuất: wont-fix

- **chuanHoaPhuong cắt nhầm và chưa bỏ đủ tiền tố, nên cùng một phường bị coi là «khác phường» và luật kết luận cứng «no»**
  Người dùng thấy gì: Một số cặp tin thật ra cùng phường nhưng ghi tên khác kiểu (có «Xã», «P.» dính liền, hoặc tên bắt đầu bằng «Phương») sẽ bị máy gợi ý «khác căn». Người duyệt có thể thấy gợi ý sai và bỏ sót những cặp đáng ghép.
  Căn cứ: Gợi ý sai nghiêng về phía «khác căn» nên có thể làm lọt cặp đáng ghép, nhưng người duyệt vẫn thấy và quyết được; cần một đợt chuẩn hoá tên phường riêng, làm sau không đắt.
  file: `agent/src/agents/judge-entity.ts`
  severity: medium
  Đề xuất: new-contract

- **judge-run báo XONG mà không đếm lỗi model, còn cặp đọc lỗi thì không ghi là cặp nào**
  Người dùng thấy gì: Khi model hỏng hàng loạt, lần chạy vẫn báo xong bình thường nên người vận hành khó nhận ra; chạy lại còn có thể thay lời giải thích cũ bằng bản chỉ có lý do luật.
  Căn cứ: Thẻ vẫn có kết luận đúng từ luật và lỗi vẫn ghi trên từng thẻ, nên không sai dữ liệu; chỉ khó thấy sự cố, người vận hành tự kiểm được và sửa sau không đắt.
  file: `agent/scripts/judge-run.ts`
  severity: low
  Đề xuất: known-limits

- **Hình dạng 4 — assertion âm tính một mình: AC-5(a) chỉ kiểm cham.loi 'không chứa PROMPT-MAU', không có đối chứng dương, không ghim giá trị**
  Người dùng thấy gì: Bài kiểm tự động cho việc lỗi model không lộ nội dung prompt có thể vẫn xanh dù mã đã rò, nên người duyệt chưa có bằng chứng chắc là nội dung nhạy cảm không bị chép vào thẻ.
  Căn cứ: Không có bằng chứng dữ liệu đang bị lộ, chỉ là bài kiểm chưa đủ chặt; thêm đối chứng sau này rẻ và không ảnh hưởng người dùng hiện tại.
  file: `agent/tests/judge-run.test.ts`
  severity: medium
  Đề xuất: known-limits

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).
