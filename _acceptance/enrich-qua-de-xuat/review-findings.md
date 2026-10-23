## Trong hợp đồng

(không có finding nào trong hợp đồng ở round 4)

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **Ca test AC-6 backlog mới phụ thuộc trạng thái DB local dùng chung, sẽ chập chờn khi có thẻ enrich thật bị «Để sau»**
  Người dùng thấy gì: Hành vi «Để sau» cho người duyệt vẫn đúng. Nhưng bài kiểm tự động của tính năng này có thể báo đỏ nhầm ở máy của Mạnh sau khi Mạnh bấm «Để sau» trên một thẻ thật, khiến người ta tưởng tính năng hỏng.
  Căn cứ: Không ảnh hưởng người dùng cuối hay dữ liệu thật, chỉ có thể gây báo động giả cho người chạy kiểm thử; chạy lại hoặc dọn thẻ hoãn là hết, và sửa bài kiểm để sau cũng rẻ.
  file: `agent/tests/enrich-db.test.ts`
  severity: medium
  Đề xuất: known-limits

- **Ca 'AC-6 để sau' (limit=1, không chỉ định offer) phụ thuộc thẻ hoãn thật có sẵn trong DB local: sẽ đỏ ngẫu nhiên khi DB có thẻ «Để sau» khác**
  Người dùng thấy gì: Bài kiểm cho nút «Để sau» có thể đỏ ngẫu nhiên nếu máy đang có thẻ «Để sau» khác, dù tính năng chạy đúng. Người dùng không thấy lỗi gì trên màn hình duyệt.
  Căn cứ: Chỉ làm bằng chứng nghiệm thu kém ổn định trên máy dev, không mất hay lộ dữ liệu, và người chạy thử lại hoặc dọn thẻ là qua; ghi lại là đủ.
  file: `agent/tests/enrich-db.test.ts`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 6 (đo môi trường của tác giả thay vì cây đang kiểm): ca 'AC-6 để sau' với limit=1 phụ thuộc vào các thẻ hoãn có sẵn trong DB local dùng chung**
  Người dùng thấy gì: Kết quả bài kiểm «Để sau» phụ thuộc vào việc máy đang chạy có thẻ hoãn thật hay không, nên một lần đỏ có thể không phản ánh lỗi thật của tính năng.
  Căn cứ: Hậu quả nhẹ và chỉ nằm ở khâu kiểm thử trên máy dev: không ảnh hưởng người dùng, không mất dữ liệu, thử lại hoặc dọn thẻ hoãn là khắc phục được.
  file: `agent/tests/enrich-db.test.ts`
  severity: low
  Đề xuất: known-limits

- **enrich-run gói CẢ lượt chạy (gồm các lần gọi LLM) vào một transaction — giữ khoá hàng hàng giờ, chặn route decide và pipeline; lỗi cuối lượt bỏ hết công (r3)**
  Người dùng thấy gì: Khi chạy làm giàu một lượt lớn kéo dài hàng giờ, người duyệt bấm Áp dụng hoặc Bỏ trên một thẻ mà lượt đó vừa đụng tới có thể bị treo, và một lỗi ở cuối lượt làm mất toàn bộ kết quả cùng công gọi LLM đã bỏ ra.
  Căn cứ: Chỉ xảy ra khi chạy lượt lớn, mà vòng này chưa chạy trên toàn backlog; không mất dữ liệu gốc, chạy lại được, và sửa sau không đắt.
  file: `agent/scripts/enrich-run.ts`
  severity: medium
  Đề xuất: known-limits

- **Test UI của app đọc fixture nằm trong agent/ — bản app/ đẩy ra repo public sẽ không chạy được npm test (r3)**
  Người dùng thấy gì: Trên bản công khai của giao diện, bộ test sẽ báo đỏ vì thiếu tệp mẫu, và bản công khai lộ ra việc nó phụ thuộc vào kho riêng. Người dùng cuối không bị ảnh hưởng.
  Căn cứ: Chỉ ảnh hưởng người bảo trì bản công khai, không động tới dữ liệu hay chức năng; sửa sau rẻ và an toàn.
  file: `app/tests/review-card.test.tsx`
  severity: low
  Đề xuất: known-limits

- **FK ON DELETE CASCADE xoá sạch đề xuất S03/S05 mỗi lần transform chạy: giá trị đã bác bị đẩy lại, thẻ chờ còn lại thì rỗng (r3)**
  Người dùng thấy gì: Mỗi lần dữ liệu Zalo/Facebook được nạp lại, toàn bộ đề xuất cũ bị xoá: giá trị người duyệt đã bác có thể bị đưa lên thẻ lần nữa, dấu vết các giá trị đã áp mất, và thẻ đang chờ trở nên rỗng nhưng vẫn báo «Đã duyệt» dù không có gì được áp.
  Căn cứ: Nặng vì mất dấu kiểm toán và quyết định của người duyệt bị lặp lại hoặc báo sai là đã áp; người dùng không tự khôi phục được lịch sử đã mất, nên cần một việc riêng xử lý.
  file: `db/migrations/033_enrichment_proposals.sql`
  severity: high
  Đề xuất: new-contract

- **Cả lượt enrich (có thể tới khoảng 2 giờ gọi LLM) nằm trong một transaction: giữ khoá dòng sale_offers/review_queue, lỗi giữa chừng mất hết (r3)**
  Người dùng thấy gì: Khi chạy làm giàu một lượt dài, thao tác duyệt thẻ và bước nạp dữ liệu có thể bị chặn chờ, và một lỗi giữa chừng làm mất sạch kết quả của cả lượt.
  Căn cứ: Chỉ lộ khi chạy lượt rất dài, chưa nằm trong vòng này; chạy lại được, không mất dữ liệu gốc, sửa sau không đắt.
  file: `agent/scripts/enrich-run.ts`
  severity: medium
  Đề xuất: known-limits

- **LLM trả output không parse được bị nuốt im lặng: không log, không đếm, E1 được áp thẳng như thể không cần LLM (r3)**
  Người dùng thấy gì: Nếu mô hình trả rác hàng loạt, lượt chạy trông như bình thường và không ai biết bước đối chiếu giữa luật và LLM đã bị bỏ qua trên các offer đó.
  Căn cứ: Giá trị vẫn đi theo luật xác định nên không sai dữ liệu nặng, chỉ thiếu cảnh báo vận hành; bổ sung bộ đếm sau là rẻ.
  file: `agent/scripts/enrich-run.ts`
  severity: medium
  Đề xuất: known-limits

- **Tổng kết lượt chạy báo số «áp thẳng/có căn cứ» theo kế hoạch định tuyến, không theo số thực sự được ghi (r3 · tệp đã đổi)**
  Người dùng thấy gì: Dòng tổng kết cuối lượt có thể báo đã áp nhiều giá trị hơn số thực sự được ghi vào dữ liệu, làm người vận hành hiểu sai kết quả lượt chạy.
  Căn cứ: Chỉ lệch con số hiển thị, dữ liệu thật không bị sai; người vận hành đối chiếu lại được, sửa sau rẻ.
  file: `agent/src/enrich/run.ts`
  severity: low
  Đề xuất: known-limits

- **Hình dạng 3: thẻ xung đột AC-11 chỉ kiểm từng chuỗi có mặt, không kiểm cặp nhãn ↔ giá trị ↔ căn cứ (r3)**
  Người dùng thấy gì: Bài kiểm thẻ đối chiếu có thể vẫn xanh nếu sau này nhãn «Theo luật» và «Theo LLM» bị gắn nhầm giá trị hoặc căn cứ, khiến người duyệt chọn nhầm bên.
  Căn cứ: Hiện giao diện chưa sai, chỉ là lưới an toàn của test còn lỏng; siết lại sau không ảnh hưởng người dùng và không mất dữ liệu.
  file: `app/tests/review-card.test.tsx`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 4: kiểm âm tính bằng every trên tập có thể rỗng, không đối chứng dương rằng field không xung đột có mặt (r3 · tệp đã đổi)**
  Người dùng thấy gì: Nếu thẻ xung đột làm rơi các field không xung đột thì bài kiểm vẫn không báo đỏ, nên người duyệt có thể thiếu thông tin mà không ai hay.
  Căn cứ: Hiện chưa có bằng chứng thẻ đang thiếu field, chỉ là test chưa bắt được; bổ sung kiểm tra sau rẻ và không rủi ro dữ liệu.
  file: `agent/tests/enrich-db.test.ts`
  severity: low
  Đề xuất: known-limits

- **Hình dạng 5: tuyên quét cả lớp «0 câu UPDATE sale_offers|properties», nhưng bộ dò theo dòng và chiều đỏ chỉ có điểm-case một dòng (r3)**
  Người dùng thấy gì: Bộ rào chắn chống ghi thẳng giá trị LLM vào dữ liệu có thể bỏ sót vài cách viết, nên sau này ai đó vô tình ghi thẳng mà không bị chặn.
  Căn cứ: Hiện không có bằng chứng đang còn đường ghi thẳng, chỉ là rào chắn chưa kín; bổ sung sau rẻ và không ảnh hưởng người dùng hiện tại.
  file: `agent/tests/enrich-guard.test.ts`
  severity: low
  Đề xuất: known-limits

- **Hình dạng 3: thẻ AC-9 kiểm «độ tin cậy» bằng chuỗi '85%' có mặt, trong khi mọi field của fixture đều 0.85 (r3)**
  Người dùng thấy gì: Bài kiểm có thể vẫn xanh dù thẻ hiện sai độ tin cậy ở từng dòng, nên người duyệt có thể thấy con số không đúng với giá trị đi kèm.
  Căn cứ: Giao diện hiện chưa được chứng minh sai, chỉ là test chưa phân biệt được; sửa bằng dữ liệu mẫu đa dạng hơn sau là rẻ và không mất dữ liệu.
  file: `app/tests/review-card.test.tsx`
  severity: low
  Đề xuất: known-limits

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).
