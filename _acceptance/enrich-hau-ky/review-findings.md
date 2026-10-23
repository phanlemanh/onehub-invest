# Review findings: enrich-hau-ky (round 1)

## Trong hợp đồng

Không có finding nào map được vào AC.

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **Hình và thẻ nghiệm thu vẫn ghi migration đối soát là 037, trong khi số được cấp là 039 (037 thuộc phiên RLS)**
  Người dùng thấy gì: Hình và thẻ mà người ký đọc còn ghi số bản cập nhật cũ, có thể khiến người đọc hiểu nhầm thứ tự áp các bản cập nhật dữ liệu. Chức năng thực tế không bị ảnh hưởng.
  Căn cứ: Chỉ là chữ ghi sai trong tài liệu minh hoạ, không làm mất hay sai dữ liệu của người dùng, và sửa lại sau rất rẻ.
  file: `_acceptance/enrich-hau-ky/figures/doi-soat.html`
  severity: low
  Đề xuất: known-limits

- **Chặn «chỉ người được hoàn tác» chỉ là tiền tố chuỗi do người gọi tự khai, không xác thực ai đang gọi**
  Người dùng thấy gì: Công cụ hoàn tác chỉ kiểm tên người thực hiện có dạng «người» chứ không kiểm đó có đúng là người thật hay không. Một tác tử tự động có quyền chạy lệnh vẫn có thể hoàn tác dưới danh nghĩa người.
  Căn cứ: Công cụ này chỉ chạy bằng dòng lệnh trên máy cục bộ của người vận hành, mọi lần hoàn tác đều để lại dấu vết kiểm tra, và nếu làm sai vẫn xem lại được, nên ghi rõ giới hạn là đủ.
  file: `agent/scripts/enrich-revert.ts`
  severity: low
  Đề xuất: known-limits

- **Ca AC-9 phụ thuộc dữ liệu thật trên DB local, trái quy ước test DB kín (BEGIN…ROLLBACK, không phụ thuộc trạng thái DB) của helpers/db.ts**
  Người dùng thấy gì: Một phép kiểm tra phụ thuộc vào dữ liệu thật trên máy, nên trên máy mới dựng hoặc sau khi dọn dữ liệu bộ kiểm tra có thể báo đỏ dù chức năng không hỏng. Người dùng cuối không bị ảnh hưởng.
  Căn cứ: Chỉ ảnh hưởng độ ổn định của bộ kiểm tra nội bộ, không làm sai hay mất dữ liệu của người dùng, và hợp đồng chủ động yêu cầu đo trên dữ liệu thật.
  file: `agent/tests/context-resolver.test.ts`
  severity: low
  Đề xuất: known-limits

- **reconcile_stale_offers chuyển thẻ chờ sang Y nhưng không dựng lại evidence: thẻ hiện lựa chọn đã bị xoá, người chọn một bên mà máy áp bên kia**
  Người dùng thấy gì: Trong một tình huống hiếm khi tin được sửa và nạp lại, thẻ chờ duyệt có thể còn hiện lựa chọn cũ. Người duyệt chọn một giá trị nhưng hệ thống có thể áp giá trị còn lại mà không báo lỗi.
  Căn cứ: Hệ thống có thể ghi sai loại bất động sản trái ý người duyệt mà không báo, nhưng chỉ xảy ra ở tổ hợp hiếm và tự đúng lại ở lượt xử lý sau, nên đáng xử lý trong một đợt riêng.
  file: `db/migrations/039_enrichment_proposals_retain.sql`
  severity: medium
  Đề xuất: new-contract

- **Helper test lặng lẽ bỏ migration 036/039 nếu không tìm thấy tệp**
  Người dùng thấy gì: Nếu tệp cập nhật dữ liệu bị đổi tên, bộ kiểm tra có thể lặng lẽ bỏ qua nó và báo xanh giả. Người dùng cuối không thấy ảnh hưởng trực tiếp.
  Căn cứ: Chỉ làm bộ kiểm tra nội bộ kém tin cậy trong tình huống đổi tên tệp, không gây mất hay sai dữ liệu, và dễ bổ sung sau.
  file: `agent/tests/helpers/db.ts`
  severity: low
  Đề xuất: known-limits

- **Hình dạng 4 (âm tính một mình, đối chứng không cùng đường): ca xanh 'AC-7 sau hoàn tác' không thể đỏ vì resolveContext thật không bao giờ ra land**
  Người dùng thấy gì: Một phép kiểm tra chưa chứng minh được việc giá trị đã hoàn tác sẽ không quay lại, vì nó vẫn xanh dù lớp chặn bị bỏ đi. Chưa có bằng chứng hành vi thực tế sai.
  Căn cứ: Hành vi thực tế vẫn đúng và bằng chứng đo trên tin thật vẫn có; chỉ là bộ kiểm tra bắt lỗi yếu hơn mong muốn, bổ sung sau không tốn kém.
  file: `agent/tests/enrich-revert.test.ts`
  severity: high
  Đề xuất: known-limits

- **Hình dạng 5 (tuyên quét lớp nhưng ma trận thiếu ô): AC-3 COLLIDE bỏ trạng thái 'reverted' và ô hoà giữa hai trạng thái đã quyết**
  Người dùng thấy gì: Bộ kiểm tra chưa thử trường hợp một quyết định hoàn tác gặp lại một đề xuất đang chờ khi nạp lại dữ liệu. Nếu có lỗi ở đó thì chưa ai biết.
  Căn cứ: Chưa có bằng chứng lỗi thật, chỉ là chỗ chưa được kiểm; bổ sung ca kiểm tra sau rất rẻ và không có dữ liệu nào bị mất trong lúc chờ.
  file: `pipeline/scripts/write-offers.test.mjs`
  severity: high
  Đề xuất: known-limits

- **Hình dạng 5/3 (điểm-case không tách được quan hệ): 'AC-2 post tách' không phân biệt luật 'nhiều post chung nhất' với 'offer_id nhỏ nhất'**
  Người dùng thấy gì: Bộ kiểm tra chưa phân biệt được việc chọn tin kế theo số bài chung hay chỉ theo mã nhỏ nhất. Nếu chọn sai, đề xuất đã duyệt có thể chuyển nhầm sang tin khác.
  Căn cứ: Chưa có bằng chứng chọn sai thật, tình huống tách bài sang nhiều tin hiếm, và bổ sung ca kiểm tra sau không tốn kém.
  file: `pipeline/scripts/write-offers.test.mjs`
  severity: high
  Đề xuất: known-limits

- **Hình dạng 2 (fixture viết tay đúng khuôn bên đọc): row() dựng tay thay cho hàng offer thật của transform**
  Người dùng thấy gì: Bộ kiểm tra dùng dữ liệu mẫu đơn giản hơn dữ liệu thật nên có thể bỏ sót lỗi chỉ xuất hiện với dữ liệu đầy đủ, ví dụ việc giữ số phòng ngủ đã bổ sung.
  Căn cứ: Là khoảng hở của bộ kiểm tra chứ chưa phải lỗi đã thấy; lỗi từng gặp đã được sửa, và mở rộng dữ liệu mẫu sau không đắt.
  file: `pipeline/scripts/write-offers.test.mjs`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 1 (đo văn bản mã thay vì hành vi): 'AC-5 transform không DELETE toàn nguồn' grep nguồn transform**
  Người dùng thấy gì: Phép kiểm tra rằng bước nạp không xoá toàn bộ dữ liệu một nguồn chỉ đọc chữ trong mã nên có thể bỏ sót cách viết khác. Chưa có dấu hiệu dữ liệu nào bị xoá nhầm.
  Căn cứ: Hợp đồng chỉ yêu cầu quét mã như vậy, hậu quả chỉ xảy ra nếu ai đó sau này viết lại lệnh xoá theo kiểu lạ, và còn có lớp chặn ở tầng dữ liệu.
  file: `pipeline/scripts/write-offers.test.mjs`
  severity: low
  Đề xuất: known-limits

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).
