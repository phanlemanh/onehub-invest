## Trong hợp đồng

- **Ở đúng ngưỡng, kết luận phụ thuộc sai số dấu phẩy động: 19,8 vs 22 m² (lệch đúng 10%) ra «yes», còn 45 vs 50 m² ra «unsure»**
  AC: AC-1
  file: `agent/src/agents/judge-entity.ts:69`
  severity: medium
  source: bugs
  detail: apNguong so sánh trần `lg < NGUONG.giaM2YesMax` / `ld < NGUONG.dienTichYesMax` / `lg > NGUONG.giaM2NoMin` trên số thực, không có dung sai. Trong khi đó phanTram lại cộng `1e-6` để bù sai số. Vì vậy cùng một độ lệch thật ở đúng ngưỡng có thể bị xếp khác nhau. Đã tái hiện bằng hàm thật qua tsx với fixture cap()/voi() của judge-chung. Cặp area 19.8 vs 22: lech = 0.09999999999999996 < 0.1, cho ra `yes` và thẻ ghi «diện tích sát nhau (10,0%)». Cặp area 45 vs 50, cũng lệch đúng 10%, cho ra `unsure` và thẻ ghi «diện tích lệch đáng kể (10,0%)». Test S4 r2 khẳng định lệch đúng ngưỡng thì không được yes (ca 45/50 → unsure), nhưng hợp đồng đó chỉ đúng với các số biểu diễn chẵn. Quét b=20..200 với ba ngưỡng ra 183 ca mà lg < ngưỡng theo dấu phẩy động nhưng thẻ in đúng số ngưỡng («sát nhau (10,0%)», «(15,0%)»…). Thẻ in số ngưỡng cạnh lời «sát nhau» mâu thuẫn với kết luận, đúng lỗi AC-2 mà vòng r1–r2 đang sửa, chỉ là chuyển từ prompt sang thẻ. Kết luận ghép căn (yes/unsure) vì thế không tất định theo giá trị thập phân thật. Cách sửa gợi ý: so sánh trên cùng một đại lượng đã lượng tử hoá (ví dụ `Math.round(lech*1e6)` so với ngưỡng nhân 1e6), hoặc cho so sánh và phanTram dùng chung một dung sai.

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **phanTram cắt xuống làm cùng chữ «30,0%» đi với hai kết luận khác nhau ở ngưỡng giaM2NoMin (r2 · tệp đã đổi)**
  Người dùng thấy gì: Với những cặp tin lệch giá gần đúng 30%, lời giải thích trên thẻ ghi «lệch 30,0%» cho cả cặp được xếp «không phải cùng căn» lẫn cặp «chưa chắc». Người duyệt nhìn con số không phân biệt được hai trường hợp, nhưng kết luận máy trên thẻ vẫn đúng.
  Căn cứ: Hậu quả nhẹ: chỉ làm lời giải thích kém rõ ở một dải rất hẹp, kết luận đề xuất không sai, không mất dữ liệu và người duyệt vẫn tự quyết được.
  file: `agent/src/agents/judge-entity.ts`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 5 + 3 — nói quét cả lớp «sát ngưỡng / chữ không trái kết luận» nhưng chỉ có 4 điểm né các giá trị x,0 (r2 · tệp đã đổi)**
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
