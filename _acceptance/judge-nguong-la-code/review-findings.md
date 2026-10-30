## Trong hợp đồng

- **Định dạng phanTram mới đưa đúng số ngưỡng «15,0%/10,0%/30,0%» vào prompt khi độ lệch bằng đúng ngưỡng, và soiNguong không bắt được dạng này**
  AC: AC-2
  file:line: `agent/src/agents/judge-entity.ts:51`
  severity: medium
  source: conventions
  detail: Theo AC-2/L14, prompt không được chứa số ngưỡng (15/10/30 kèm %). phanTram mới cắt xuống một chữ số thập phân, nên khi độ lệch bằng đúng ngưỡng (thường gặp với số tròn) thì lý do luật in đúng số ngưỡng. Đã chạy thử với apNguong thật: diện tích 45 với 50 ra «diện tích lệch 10,0%»; giá/m² 85tr với 100tr ra «giá/m² lệch 15,0%»; 70tr với 100tr ra «giá/m² lệch 30,0%». Cả ba vào buildJudgeInput, tức là vào prompt model nhận. Bộ soi dùng chung soiNguong (agent/tests/judge-chung.ts) chỉ có mẫu `(?<![\d.,])(?:15|10|30)\s*%`, nên ra [] với cả ba chuỗi: «15» đứng trước «,0%» chứ không đứng trước «%», còn «0%» bị lookbehind dấu phẩy chặn. Vì vậy cổng AC-2 không thấy dạng định dạng mới. Đối chứng đỏ trong judge-nguong.test.ts:116 chỉ thử dạng Math.round cũ («15%»), và bốn ca SAT đều tránh giá trị đúng bằng ngưỡng. Thêm một điểm: số bù +1e-6 trong Math.floor(x*1000+1e-6) làm lệch trong khoảng [0,15−1e-9; 0,15) hiện thành «15,0%» dù luật xếp gia_m2_gan / yes, tức là đúng kiểu lời lý do trái kết luận mà bản sửa S4 r1 định chặn. Cần sửa cả hai phía: bộ soi phải bắt cả dạng có phần thập phân (15,0% / 15.0%), test thêm ca lệch đúng bằng ngưỡng, và định dạng không được in số ngưỡng (hoặc hợp đồng phải ghi rõ đây là ngoại lệ được chấp nhận).

- **Lệch đúng bằng ngưỡng in «10,0%»/«15,0%»/«30,0%» vào prompt mà hàm soi AC-2 không bắt**
  AC: AC-2
  file:line: `agent/src/agents/judge-entity.ts:51`
  severity: medium
  source: bugs
  detail: Định dạng mới thêm phần thập phân, nên khi độ lệch đúng bằng ngưỡng (rất hay gặp với số tròn trong tin rao, ví dụ diện tích 45 với 50 m², giá/m² 85tr với 100tr, 70tr với 100tr), lý do luật in «diện tích lệch 10,0%», «giá/m² lệch 15,0%», «giá/m² lệch 30,0%». Cả ba chính là số ngưỡng và đi thẳng vào buildJudgeInput, tức nội dung model nhận. Thế nhưng regex trong soiNguong (agent/tests/judge-chung.ts:31, `(?<![\d.,])(?:15|10|30)\s*%`) chỉ khớp khi «%» đứng ngay sau số, nên «10,0%» lọt qua. Đã chạy thử: soiNguong(buildJudgeInput(...)) trả về [] cho cả ba ca. Định dạng cũ in «10%» thì hàm soi vẫn bắt được, còn định dạng mới làm AC-2 (không chỗ nào chứa số ngưỡng 15/10/30 kèm %) im lặng thất bại ở ca đúng ngưỡng: rò rỉ vẫn còn mà test vẫn xanh. Ma trận test sát ngưỡng không có ca lệch đúng bằng ngưỡng.

- **Hình dạng 4 — đối chứng đỏ dùng khuôn cũ, nên bộ soi không bắt được số ngưỡng ở khuôn mới «15,0%»**
  AC: AC-2
  file:line: `agent/tests/judge-nguong.test.ts:116`
  severity: high
  source: measurement
  detail: Ở dòng 113, test dương gọi `kiemKhongNguong(buildJudgeInput(s.p, kq))`. Đối chứng đỏ duy nhất (dòng 116) lại là chuỗi viết tay theo khuôn CŨ: `giá/m² lệch ${Math.round(0.149 * 100)}%` → «15%». Lần sửa này đổi khuôn của phanTram (judge-entity.ts dòng 51) sang một chữ số thập phân, dấu phẩy, cắt xuống. Vì thế đúng số ngưỡng giờ in ra thành «15,0%», «10,0%», «30,0%». Mẫu của soiNguong (judge-chung.ts dòng 31) là `/(?<![\d.,])(?:15|10|30)\s*%/` và không khớp «15,0%»: sau «15» là «,0» chứ không phải «%», còn «0%» thì bị lookbehind `[\d.,]` loại. Tôi đã chạy thử: phanTram(0.15) cho «15,0%», phanTram(0.3) cho «30,0%», phanTram(0.1) cho «10,0%», và soiNguong trả [] cho cả ba. buildJudgeInput của cặp 85 vs 100 TR/m² (ô 10) có «giá/m² lệch 15,0%», của cặp 70 vs 100 (ô 12) có «giá/m² lệch 30,0%», của diện tích 45 vs 50 có «diện tích lệch 10,0%», và soiNguong vẫn trả []. Hợp đồng AC-2 lại nói không chỗ nào được chứa số ngưỡng «15/10/30 kèm %». Như vậy cái kiểm âm (không có chỗ trúng) đã mù trước đúng khuôn đầu ra mà lần sửa này tạo ra. Lẽ ra phải có một đối chứng đỏ lấy chính đầu ra phanTram ở đúng ngưỡng, ví dụ `kiemKhongNguong(phanTram(0.15))` phải ném.

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **phanTram cắt xuống làm cùng chữ «30,0%» đi với hai kết luận khác nhau ở ngưỡng giaM2NoMin**
  Người dùng thấy gì: Với những cặp tin lệch giá gần đúng 30%, lời giải thích trên thẻ ghi «lệch 30,0%» cho cả cặp được xếp «không phải cùng căn» lẫn cặp «chưa chắc». Người duyệt nhìn con số không phân biệt được hai trường hợp, nhưng kết luận máy trên thẻ vẫn đúng.
  Căn cứ: Hậu quả nhẹ: chỉ làm lời giải thích kém rõ ở một dải rất hẹp, kết luận đề xuất không sai, không mất dữ liệu và người duyệt vẫn tự quyết được.
  file: `agent/src/agents/judge-entity.ts`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 5 + 3 — nói quét cả lớp «sát ngưỡng / chữ không trái kết luận» nhưng chỉ có 4 điểm né các giá trị x,0**
  Người dùng thấy gì: Bộ kiểm tra chỉ thử vài điểm gần ngưỡng nên có thể bỏ sót những cặp tin lệch đúng bằng ngưỡng, nơi lời giải thích trên thẻ có thể ghi số không khớp kết luận. Người dùng không thấy lỗi mới, chỉ là chưa có lưới bắt sớm.
  Căn cứ: Hậu quả nhẹ, chỉ là thiếu lưới kiểm tra ở dải hẹp, không làm sai dữ liệu hay kết luận; bổ sung ca kiểm tra sau này rẻ và không gấp.
  file: `agent/tests/judge-nguong.test.ts`
  severity: high
  Đề xuất: known-limits

- **UPDATE thẻ đang chờ không chặn lại status='pending' — chạy cùng lúc người duyệt có thể ghi đè thẻ người vừa quyết (r1)**
  Người dùng thấy gì: Nếu người duyệt bấm quyết đúng lúc máy đang chấm lại cùng thẻ đó, phần gợi ý và lời giải thích của máy trên thẻ có thể bị đổi sau khi người đã quyết. Quyết định của người vẫn giữ nguyên.
  Căn cứ: Chỉ xảy ra khi hai việc trùng nhau trong vài giây, quyết định của người không mất, và chạy lại là thấy đúng; sửa nhỏ nhưng hậu quả nhẹ nên ghi lại là đủ.
  file: `agent/scripts/judge-run.ts`
  severity: medium
  Đề xuất: known-limits

- **Bộ đếm 'thẻ mới' tăng cả khi INSERT … ON CONFLICT DO NOTHING không chèn được dòng nào (r1)**
  Người dùng thấy gì: Dòng tổng kết sau khi chạy có thể báo nhiều thẻ mới hơn số thẻ thật sự được tạo, trong trường hợp hiếm có thẻ trùng xuất hiện cùng lúc. Dữ liệu trong bảng vẫn đúng.
  Căn cứ: Chỉ làm con số in ra lệch trong tình huống hiếm, không mất hay sai dữ liệu, người vận hành đếm lại được trong bảng nên không đáng mở việc riêng.
  file: `agent/scripts/judge-run.ts`
  severity: low
  Đề xuất: wont-fix

- **chuanHoaPhuong cắt nhầm và chưa bỏ đủ tiền tố, nên cùng một phường bị coi là «khác phường» và luật kết luận cứng «no» (r1 · tệp đã đổi)**
  Người dùng thấy gì: Một số cặp tin thật ra cùng phường nhưng ghi tên khác kiểu (có «Xã», «P.» dính liền, hoặc tên bắt đầu bằng «Phương») sẽ bị máy gợi ý «khác căn». Người duyệt có thể thấy gợi ý sai và bỏ sót những cặp đáng ghép.
  Căn cứ: Gợi ý sai nghiêng về phía «khác căn» nên có thể làm lọt cặp đáng ghép, nhưng người duyệt vẫn thấy và quyết được; cần một đợt chuẩn hoá tên phường riêng, làm sau không đắt.
  file: `agent/src/agents/judge-entity.ts`
  severity: medium
  Đề xuất: new-contract

- **judge-run báo XONG mà không đếm lỗi model, còn cặp đọc lỗi thì không ghi là cặp nào (r1)**
  Người dùng thấy gì: Khi model hỏng hàng loạt, lần chạy vẫn báo xong bình thường nên người vận hành khó nhận ra; chạy lại còn có thể thay lời giải thích cũ bằng bản chỉ có lý do luật.
  Căn cứ: Thẻ vẫn có kết luận đúng từ luật và lỗi vẫn ghi trên từng thẻ, nên không sai dữ liệu; chỉ khó thấy sự cố, người vận hành tự kiểm được và sửa sau không đắt.
  file: `agent/scripts/judge-run.ts`
  severity: low
  Đề xuất: known-limits

- **Hình dạng 4 — assertion âm tính một mình: AC-5(a) chỉ kiểm cham.loi 'không chứa PROMPT-MAU', không có đối chứng dương, không ghim giá trị (r1)**
  Người dùng thấy gì: Bài kiểm tự động cho việc lỗi model không lộ nội dung prompt có thể vẫn xanh dù mã đã rò, nên người duyệt chưa có bằng chứng chắc là nội dung nhạy cảm không bị chép vào thẻ.
  Căn cứ: Không có bằng chứng dữ liệu đang bị lộ, chỉ là bài kiểm chưa đủ chặt; thêm đối chứng sau này rẻ và không ảnh hưởng người dùng hiện tại.
  file: `agent/tests/judge-run.test.ts`
  severity: medium
  Đề xuất: known-limits

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).
