## Trong hợp đồng

- **Hình 3 (assert có mặt thay vì quan hệ): cổng mẫu «cùng prompt_version» không có ca nào phân biệt prompt**
  file: `agent/tests/doc-toan-bo-db.itest.ts:472`
  severity: medium
  AC: AC-10
  source: measurement
  detail: AC-10 hứa một quan hệ: lượt thật từ chối nếu chưa có dòng mẫu đạt cho CÙNG prompt_version với lượt chạy. Test chỉ đo có hay không có dòng: dòng 471-472 xoá mọi dòng mẫu rồi mong thoát 6; dòng 492-493 có mẫu đạt rồi mong thoát 0. Dòng mồi mauDat (289) và doMau đều ghi đúng PROMPT_VERSION hiện tại. Không ca nào có dòng dat=true của prompt khác. Bỏ điều kiện `detail->>'prompt_version' = $1` trong coMauDat (doc-toan-bo.ts:454) thì mọi test vẫn xanh, và mẫu đạt của prompt cũ sẽ mở khoá lượt trả phí cho prompt mới.

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **Dấu máy mỗi tin `doc-toan-bo:da-xu` không được thêm vào DAU_MAY, đẩy thao tác của người khỏi nhật ký Ops**
  Người dùng thấy gì: Sau lượt đọc thật đầu tiên, trang nhật ký thao tác của Ops sẽ ngập dấu máy, các thao tác duyệt của người bị đẩy khỏi 100 dòng mới nhất.
  Căn cứ: Hậu quả vừa phải: không mất dữ liệu, dòng vẫn còn trong cơ sở dữ liệu, nhưng người vận hành khó tra lại việc mình đã duyệt, và sửa rẻ.
  file: `agent/src/enrich/doc-toan-bo.ts`
  severity: high
  Đề xuất: new-contract

- **CLI nuốt cờ sai hoặc thiếu giá trị rồi rơi vào lượt thật có ghi và tốn tiền**
  Người dùng thấy gì: Gõ nhầm một cờ có thể biến lượt chạy thử thành lượt thật: tốn tiền và ghi loại hình vào dữ liệu căn mà người dùng không định làm.
  Căn cứ: Có thể tốn tiền và ghi dữ liệu ngoài ý muốn, dù có trần 3 USD và cổng mẫu chặn một phần; sửa rẻ nên nên làm trước lượt trả phí.
  file: `agent/scripts/doc-toan-bo-s03.ts`
  severity: medium
  Đề xuất: new-contract

- **Dòng audit phán quyết đối chiếu dùng actor `hitl:<id>`, lệch khuôn `user:<id>` của ops_audit**
  Người dùng thấy gì: Một quyết định duyệt sinh hai dòng nhật ký mang tên người khác dạng, nên lọc nhật ký theo người có thể tách đôi hai dòng này.
  Căn cứ: Chỉ ảnh hưởng cách tra cứu nhật ký, không mất hay sai dữ liệu, và có thể chuẩn hoá sau.
  file: `app/src/app/api/v1/ops/review/[id]/decide/route.ts`
  severity: low
  Đề xuất: known-limits

- **Thêm listingIntentLabel chen giữa JSDoc và offerKindLabel**
  Người dùng thấy gì: Một chú thích trong mã nằm sai chỗ; người dùng cuối không thấy gì.
  Căn cứ: Không có hậu quả với người dùng, chỉ làm người đọc mã hơi rối, và tự dọn được khi chạm tệp lần sau.
  file: `app/src/lib/ops-labels.ts`
  severity: low
  Đề xuất: wont-fix

- **Bài có từ hai tin: một nhãn loại hình của model được tự áp vào mọi tin của bài**
  Người dùng thấy gì: Khi một bài đăng nói về nhiều căn khác loại, máy có thể gán cùng một loại hình cho tất cả và ghi vào dữ liệu mà không ai duyệt, làm một số căn bị gán sai loại.
  Căn cứ: Dữ liệu sai được ghi thẳng không qua thẻ duyệt, tuy gỡ được bằng lệnh hoàn tác; nên xử trước khi chạy hàng loạt trên dữ liệu thật.
  file: `agent/src/enrich/doc-toan-bo.ts`
  severity: high
  Đề xuất: new-contract

- **Cờ CLI sai hoặc lạ bị bỏ qua, gõ nhầm --thu thành lượt thật tốn tiền và ghi canonical**
  Người dùng thấy gì: Gõ nhầm cờ chạy thử có thể khiến lệnh chạy thật, trả tiền cho model và ghi vào dữ liệu căn.
  Căn cứ: Có thể tốn tiền và ghi dữ liệu ngoài ý muốn dù có trần chi; sửa rẻ nên làm cùng finding cờ sai còn lại.
  file: `agent/scripts/doc-toan-bo-s03.ts`
  severity: medium
  Đề xuất: new-contract

- **Lỗi gọi model hàng loạt vẫn báo đã đọc hết, còn lại 0 và thoát 0**
  Người dùng thấy gì: Nếu khoá hỏng hoặc dịch vụ model sập, lệnh vẫn báo đã đọc xong và không còn bài nào, dù thực tế chẳng tin nào được đọc, nên người chạy dễ tưởng đã hoàn tất.
  Căn cứ: Gây hiểu nhầm về tiến độ và đo mẫu sai, có thể làm mất một lượt trả phí, nhưng không làm hỏng dữ liệu; chạy lại được.
  file: `agent/src/enrich/doc-toan-bo.ts`
  severity: medium
  Đề xuất: new-contract

- **Thẻ chỉ có đối chiếu bấm «Để sau» thì không bao giờ quyết được**
  Người dùng thấy gì: Khi người duyệt bấm Để sau trên thẻ chỉ có bất đồng, thẻ đó biến mất và bất đồng không bao giờ được quyết lại.
  Căn cứ: Mất âm thầm một phần các bất đồng cần người xem, tuy không sai dữ liệu hiện có; ảnh hưởng chỉ ở sót việc duyệt.
  file: `agent/src/enrich/run.ts`
  severity: medium
  Đề xuất: new-contract

- **Đối chiếu đã có phán quyết mọc lại từ thẻ hoãn cũ**
  Người dùng thấy gì: Người duyệt đôi khi gặp lại đúng bất đồng mà mình đã quyết, và có thể quyết khác lần trước.
  Căn cứ: Chỉ xảy ra ở chuỗi hoãn rồi đề xuất mới, gây phiền chứ không mất dữ liệu; người dùng tự bỏ qua được.
  file: `agent/src/enrich/run.ts`
  severity: medium
  Đề xuất: known-limits

- **Trả lời hỏng của model làm đề xuất E1 thành skipped vĩnh viễn**
  Người dùng thấy gì: Nếu model trả lời hỏng một lần, tin đó bị đánh dấu bỏ qua lâu dài với lý do sai và không được thử đọc lại.
  Căn cứ: Chỉ làm sót một số ít tin, không ghi sai dữ liệu, và có thể xử lý thủ công hoặc bằng lượt sau.
  file: `agent/src/enrich/doc-toan-bo.ts`
  severity: medium
  Đề xuất: known-limits

- **theMoi đếm cả tin không sinh thẻ, làm trần thẻ cạn sớm và số báo sai**
  Người dùng thấy gì: Số thẻ mới báo có thể cao hơn thực tế, và lượt có thể dừng tạo thẻ sớm hơn mức trần đã đặt.
  Căn cứ: Chỉ lệch số báo và dừng sớm, chạy lại để tiếp tục được, không mất dữ liệu.
  file: `agent/src/enrich/doc-toan-bo.ts`
  severity: low
  Đề xuất: known-limits

- **Hình 3 (không đo quan hệ giữa hai bên): «lượt thật dùng lại nhãn» chỉ đo doMau gọi lại doMau**
  Người dùng thấy gì: Có thể lượt thật trả tiền đọc lại những bài đã được đọc ở lượt đo mẫu mà không ai phát hiện.
  Căn cứ: Hậu quả chỉ là tốn thêm tiền trong trần đã đặt, không sai dữ liệu.
  file: `agent/tests/doc-toan-bo-db.itest.ts`
  severity: medium
  Đề xuất: known-limits

- **Hình 5 (tuyên cả lớp, phủ một phần): --dem chỉ đối chiếu 4 số, số «cuộc gọi thành công» không có assert**
  Người dùng thấy gì: Số cuộc gọi thành công mà lệnh đếm in ra chưa được kiểm, nên có thể sai mà không ai biết.
  Căn cứ: Chỉ là số theo dõi chứ không quyết định ghi dữ liệu; nên kiểm lại khi đọc kết quả lượt thật.
  file: `agent/tests/doc-toan-bo-db.itest.ts`
  severity: medium
  Đề xuất: known-limits

- **Hình 5 (điểm-case thay vì ma trận toàn phần): bảng luật trích dẫn có 11 từ ngữ cảnh và 19 từ khoá loại khác, test chỉ chạm 3 và 1**
  Người dùng thấy gì: Phần lớn từ trong bảng luật nhận diện loại hình chưa được thử, nên sửa bảng có thể làm máy tự ghi sai loại hình mà test vẫn xanh.
  Căn cứ: Rủi ro sửa bảng sau này làm sai dữ liệu có thể gỡ được bằng lệnh hoàn tác; bổ sung ca thử rẻ nhưng không chặn việc ra mắt.
  file: `agent/tests/doc-toan-bo.test.ts`
  severity: medium
  Đề xuất: known-limits

- **Hình 5 (điểm-case trên lớp đã liệt kê): khối đối chiếu có 3 loại, test hiển thị chỉ phủ y_dinh và gia**
  Người dùng thấy gì: Khối đối chiếu cho bất đồng về diện tích chưa được kiểm tra hiển thị, nên có thể hiện sai nhãn hoặc định dạng mà không ai biết.
  Căn cứ: Chỉ ảnh hưởng cách hiển thị cho người duyệt, không ghi dữ liệu; sai thì nhìn thấy ngay và sửa rẻ.
  file: `app/tests/review-card.test.tsx`
  severity: medium
  Đề xuất: known-limits

- **Hình 2 (fixture viết tay đúng khuôn bên đọc): thẻ chỉ có đối chiếu chưa đi từ đầu ghi thật tới route hay giao diện**
  Người dùng thấy gì: Loại thẻ phổ biến chỉ có bất đồng chưa được thử từ lúc tạo thẻ tới lúc hiện trên màn hình duyệt, nên có thể lệch khuôn mà chưa ai thấy.
  Căn cứ: Nếu lệch thì người duyệt thấy ngay trên thẻ và không mất dữ liệu; bổ sung phép thử sau cũng được.
  file: `app/tests/review-card.test.tsx`
  severity: low
  Đề xuất: known-limits

- **Hình 4 (âm tính không đối chứng từng ca): E4 hứa mỗi ca có đối chứng dương cùng tin, test chỉ có một đối chứng trên tin khác**
  Người dùng thấy gì: Các ca kiểm máy không tự điền khi trích dẫn sai chưa đều có phép đối chứng, nên một ca có thể xanh vì lý do sai.
  Căn cứ: Chỉ làm giảm độ tin của phép thử, không ảnh hưởng người dùng trực tiếp; đã ghi là hạn chế.
  file: `agent/tests/doc-toan-bo-db.itest.ts`
  severity: medium
  Đề xuất: known-limits

- **Hình 4 (âm tính không đối chứng): «--thu không ghi kể cả ai_calls» không có chiều dương cho ai_calls**
  Người dùng thấy gì: Phép thử chạy thử không ghi gì chưa chứng minh được bảng đếm cuộc gọi model thực sự bị chặn ghi.
  Căn cứ: Rủi ro nhỏ: ghi thừa vào bảng đếm không làm sai dữ liệu căn, và bổ sung sau được.
  file: `agent/tests/doc-toan-bo-db.itest.ts`
  severity: low
  Đề xuất: known-limits

- **Hình 3 (kiểm giá trị thay vì quan hệ thứ tự): «thoát 2 trước lời gọi đầu» không có bộ đếm lời gọi**
  Người dùng thấy gì: Chưa chứng minh được lệnh dừng vì thiếu khoá trước khi gọi model lần nào, nên có thể đã trả tiền một lần.
  Căn cứ: Nếu thiếu khoá thì lời gọi cũng sẽ thất bại nên thiệt hại hầu như không có; bổ sung phép đếm rẻ nhưng không gấp.
  file: `agent/tests/doc-toan-bo-db.itest.ts`
  severity: low
  Đề xuất: known-limits

⚠ Cụm ngoài vùng phủ: 3/20 lỗi rơi vào file không bộ đo nào phủ (app/src/lib/ops-labels.ts, app/tests/review-card.test.tsx) — dừng và quyết: mở rộng hợp đồng hay rút phạm vi.
