## Trong hợp đồng

- **Hình dạng 4 (assertion âm tính đứng một mình): ở EC-AC-2, các assert «0 thẻ / 0 phát biểu / 0 dấu» của tin hai đều xanh dù có lui giao dịch hay không**
  AC: AC-2
  file: agent/tests/enrich-giao-dich.test.ts:134
  severity: medium
  source: measurement
  detail: clientHong(c, t2, 2) (dòng 61-73, gọi ở dòng 130) ném lỗi ngay ở câu ghi thứ hai của tin hai. Theo thứ tự trong ghi() của run.ts, câu này đứng trước apply_enrichment, syncReview và INSERT ops_audit, hoặc chính là một trong ba câu đó. Vì vậy các câu tạo thẻ, field_assertions và dấu enrich:thu của tin hai không bao giờ chạy, kể cả khi bỏ giaoDich. Kết quả là `theCho(c,t2)=0` (dòng 134), `phatBieu(c,t2)=0` (dòng 135) và `daThu(c,t2)=0` (dòng 136) cho cùng một kết quả dù tin hai có được lui lại hay không. Bản đột biến «ghi thẳng» (dòng 150-154) chỉ làm đỏ được thông điệp «tin hỏng để lại đề xuất»; ba thông điệp kia không có chiều đỏ nào. Tin lành t1/t3 cũng không có đối chứng dương cho thẻ chờ và phát biểu: chỉ kiểm deXuat>0 và daThu=1. Trong khi đó E2 trong evals.yaml hứa «tin hai 0 đề xuất / 0 thẻ / 0 field_assertions». Hai vế thẻ và field_assertions thực tế không được đo bằng một phép có thể đỏ.
  rationale: AC-2 đòi tin hai không còn thẻ, phát biểu hay dòng enrich:thu sau khi ghi hỏng, mà các phép đo này không thể đỏ nên AC-2 chưa được chứng minh ở các vế đó.

- **Hình dạng 4 (assertion âm tính đứng một mình): lượt ba của EC-AC-9 trên CLI chỉ khẳng định «tin f không có dấu», còn đối chứng dương đi kèm thì rỗng**
  AC: AC-9
  file: agent/tests/enrich-cli.itest.ts:276
  severity: medium
  source: measurement
  detail: Dòng 276 `assert.ok(r3.out.includes("LLM hỏng"), …)` là đối chứng rỗng, vì dongTongKet (agent/src/enrich/tong-ket.ts dòng 45) luôn in dòng `LLM hỏng ${h}/${d.llmGoi} …`, kể cả khi 0/0. Điều kiện này đúng cả khi tin f không được bốc, không gọi LLM, hoặc máy chủ giả không trả 500. Assert duy nhất còn lại là phép âm `daThu(f)=0` (dòng 277-278). Nó xanh trong mọi trường hợp f không được xử lý, chẳng hạn bị lọc khỏi selectOffers, LIMIT bốc tin khác, hoặc ma không khớp MA. Không có assert nào ghim việc f đã được gọi LLM và hỏng, ví dụ `LLM hỏng 1/1`, `tin: 1`, mã thoát 3, hay f có đề xuất e1_rule như ca đơn vị đã làm ở enrich-giao-dich.test.ts dòng 278. Lời hứa của E13 («lượt ba với LLM giả trả 500 cho một tin → tin đó không có enrich:thu») vì thế không được đo.
  rationale: AC-9 đòi tin mà lời gọi LLM ném lỗi thì không ghi enrich:thu và được bốc lại, nhưng phép đo trên CLI không chứng minh tin đó đã được gọi LLM và hỏng.

- **Hình dạng 4 (assertion âm tính đứng một mình): ở EC-AC-2 trên CLI, các assert 0 đề xuất / 0 thẻ / 0 dấu của tin hai được trigger bảo đảm, không do giao dịch mỗi tin**
  AC: AC-2
  file: agent/tests/enrich-cli.itest.ts:211
  severity: low
  source: measurement
  detail: Trigger ecli_hong (dòng 201-203) RAISE ngay ở câu INSERT enrichment_proposals đầu tiên của tin hai, nên chưa câu ghi nào của tin hai thành công và syncReview/INSERT ops_audit không bao giờ chạy. Do đó `deXuatTin(t2)=0` (dòng 211), thẻ chờ = 0 (dòng 212-213) và enrich:thu = 0 (dòng 214-215) xanh như nhau dù giaoDich có ROLLBACK hay không. Bản đột biến bỏ ROLLBACK (dòng 222-228) chỉ làm đỏ «tin sau tin hỏng không ghi được», tức vế tin ba. Vế «tin hai 0 đề xuất / 0 thẻ pending mới / 0 dòng enrich:thu» mà E12 trong evals.yaml hứa là phép âm không phân biệt được bản đúng với bản hỏng.
  rationale: AC-2 mức CLI thật đòi tin hai không còn đề xuất, thẻ hay dòng enrich:thu sau lỗi giữa chừng, nhưng các phép đo âm xanh dù ROLLBACK có hay không.

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **--offers không kiểm giá trị: thiếu giá trị thì chạy rỗng và thoát 0, gặp cờ khác thì nhận nhầm cờ làm mã tin**
  Người dùng thấy gì: Người chạy tay gõ thiếu danh sách tin sẽ thấy lượt enrich chạy 0 tin mà vẫn báo thành công, nên có thể tưởng các tin đã được xử lý. Lượt chạy tự động hằng đêm không bị ảnh hưởng.
  Căn cứ: Hậu quả nhẹ, chỉ gặp khi chạy tay gõ sai, không mất hay lộ dữ liệu, chạy lại đúng lệnh là xong và sửa sau cũng không đắt.
  file: `agent/scripts/enrich-run.ts`
  severity: low
  Đề xuất: known-limits

- **Mặc định giaoDichSavepoint cần sẵn một giao dịch ngoài; gọi runEnrich không kèm BEGIN thì mọi tin hỏng mà vẫn trả về bình thường**
  Người dùng thấy gì: Nếu sau này có người viết thêm chỗ gọi enrich mà quên mở giao dịch, mọi tin sẽ ghi hỏng nhưng kết quả trông gần như bình thường. Hiện không chỗ gọi nào đang mắc lỗi này.
  Căn cứ: Chưa có ảnh hưởng nào cho người dùng hôm nay, chỉ là rủi ro cho người viết code sau, không mất dữ liệu vì ghi hỏng thì không ghi gì, và mã thoát vẫn báo lỗi.
  file: `agent/src/enrich/run.ts`
  severity: low
  Đề xuất: known-limits

- **Dấu enrich:thu ghi mỗi tin một dòng vào ops_audit, lấn khung xem /ops/audit (LIMIT 100, không lọc)**
  Người dùng thấy gì: Sau vài đêm chạy, trang nhật ký thao tác của Ops sẽ đầy các dòng đánh dấu enrich và đẩy những thao tác duyệt, hoàn tác của người ra khỏi 100 dòng đầu. Người vận hành khó xem lại việc mình đã làm.
  Căn cứ: Không mất dữ liệu, các dòng vẫn còn trong cơ sở dữ liệu và chỉ ảnh hưởng chỗ xem của người vận hành, nhưng sẽ lộ ra ngay sau vài đêm và sửa nằm ở màn Ops nên cần một việc riêng.
  file: `agent/src/enrich/run.ts`
  severity: low
  Đề xuất: new-contract

- **--offers với danh sách rỗng hoặc thiếu đối số chạy lặng lẽ 0 tin và thoát 0**
  Người dùng thấy gì: Gõ lệnh enrich chỉ định tin mà để trống danh sách thì lượt chạy không làm gì nhưng vẫn báo xong êm, nên người chạy dễ tưởng đã enrich các tin đó. Lượt chạy tự động hằng đêm không bị ảnh hưởng.
  Căn cứ: Hậu quả nhẹ, chỉ xảy ra khi chạy tay gõ sai, không mất hay lộ dữ liệu, chạy lại đúng lệnh là khắc phục được.
  file: `agent/scripts/enrich-run.ts`
  severity: low
  Đề xuất: known-limits

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).
