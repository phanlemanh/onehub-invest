# Review findings: bo-canh-dem-luot-agent (round 2)

## Trong hợp đồng

(không có)

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **E9c so tệp cảnh báo và log thật qua đường ghi cứng, không có biến môi trường để ghi đè, không kiểm đường có tồn tại hay không, nên phép so có thể đúng mà không đo gì**
  Người dùng thấy gì: Phép thử an toàn của bộ canh chỉ có ý nghĩa trên đúng máy của tác giả; chạy ở máy khác nó vẫn báo đạt dù không kiểm được gì. Bộ canh thật vẫn hoạt động bình thường.
  Căn cứ: Chỉ ảnh hưởng độ tin của phép thử ở máy khác, không đổi hành vi bộ canh thật, không mất dữ liệu, và có thể sửa sau với chi phí thấp.
  file: `scripts/watchdog-l4d-agentdb/acceptance.mjs`
  severity: medium
  Đề xuất: known-limits

- **E14/AC-11 nói phủ cả log theo ngày nhưng phép thử chỉ chạm gateway.log**
  Người dùng thấy gì: Đường log theo ngày của bộ canh chưa có ca kiểm riêng, nên nếu nó hỏng với khối log lớn thì phép thử vẫn báo đạt. Đường log chính đã được kiểm.
  Căn cứ: Hở nhẹ trong phạm vi kiểm, đường chính đã có ca thử, người dùng không thấy gì khác và bổ sung ca kiểm sau là rẻ.
  file: `scripts/watchdog-l4d-agentdb/acceptance.mjs`
  severity: medium
  Đề xuất: known-limits

- **E9c so tệp cảnh báo và log thật theo đường cứng của checkout chính, nên phép so trở thành hằng đúng**
  Người dùng thấy gì: Phép kiểm rằng tệp cảnh báo và log thật không bị đụng đến có thể đạt mà không đo gì khi chạy ở máy khác hoặc khi chưa từng có cảnh báo.
  Căn cứ: Không ảnh hưởng người dùng cuối hay dữ liệu, chỉ làm bằng chứng nghiệm thu yếu đi ở môi trường khác, và tự thấy ngay khi chạy trên máy thật.
  file: `scripts/watchdog-l4d-agentdb/acceptance.mjs`
  severity: low
  Đề xuất: known-limits

- **Hình dạng 3: assert «chuỗi có mặt» trong khi lời hứa là quan hệ (các lý do phải phân biệt được)**
  Người dùng thấy gì: Khi bộ canh không đọc được kho phiên, nó đưa ra cùng một câu cảnh báo cho nhiều nguyên nhân khác nhau, nên người trực phải tự dò nguyên nhân. Gateway vẫn được tắt an toàn.
  Căn cứ: Chỉ làm chẩn đoán chậm hơn, hành vi an toàn vẫn đúng, người trực tự tra được, và tách lý do có thể làm ở lần sau.
  file: `scripts/watchdog-l4d-agentdb/acceptance.mjs`
  severity: high
  Đề xuất: known-limits

- **Hình dạng 6: đường dẫn hardcode ROOT của checkout tác giả cho phép so «máy thật không đổi» (E9c)**
  Người dùng thấy gì: Phép thử không chạm máy thật có thể đạt rỗng khi checkout nằm chỗ khác, nên bằng chứng nghiệm thu chỉ đáng tin trên máy của tác giả.
  Căn cứ: Hậu quả nhẹ và chỉ về bằng chứng kiểm, không mất dữ liệu hay đổi hành vi bộ canh, sửa sau không tốn kém.
  file: `scripts/watchdog-l4d-agentdb/acceptance.mjs`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 4/3: E7b kiểm «xử marker» trên tệp cảnh báo cộng dồn, nên alert của lượt E7a đã đủ thoả**
  Người dùng thấy gì: Phép thử có thể báo đạt dù lần chạy lại không ghi thêm cảnh báo về mốc cần xử, nên người trực có thể không biết phải xử mốc nếu hành vi này hỏng.
  Căn cứ: Nguy cơ chỉ xảy ra nếu có hồi quy sau này, bộ canh vẫn tắt gateway nên an toàn, và siết phép kiểm là việc nhỏ.
  file: `scripts/watchdog-l4d-agentdb/acceptance.mjs`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 3: E1a hứa «lý do nêu tên agent» nhưng chỉ assert chuỗi «L4d»**
  Người dùng thấy gì: Phép thử chưa xác nhận cảnh báo có nêu tên agent gây ra lượt mới, nên nếu sau này mất tên đó thì người trực khó biết agent nào chạy.
  Căn cứ: Chỉ làm cảnh báo kém rõ nếu có thay đổi sau này, gateway vẫn bị tắt đúng, không mất dữ liệu và sửa rất rẻ.
  file: `scripts/watchdog-l4d-agentdb/acceptance.mjs`
  severity: low
  Đề xuất: known-limits

- **card-plain.json thiếu AC-10, và xếp AC-5, AC-11 vào wont_do dù là việc sẽ làm (r1)**
  Người dùng thấy gì: Thẻ duyệt đưa cho người ký thiếu một tiêu chí về tài liệu và xếp nhầm hai việc sẽ làm vào mục «sẽ không làm», nên người ký có thể hiểu sai phạm vi.
  Căn cứ: Không ảnh hưởng hành vi bộ canh và không mất dữ liệu; chữ ký đã có, sửa lại thẻ sau rất rẻ.
  file: `_acceptance/bo-canh-dem-luot-agent/card-plain.json`
  severity: medium
  Đề xuất: known-limits

- **Đường tuyệt đối máy riêng /Users/manhphan/... ghi cứng trong script của kho công khai (r1 · tệp đã đổi)**
  Người dùng thấy gì: Bộ phép thử ghi cứng tên người dùng và thư mục máy của Mạnh; chạy trên máy khác thì một phép kiểm báo đạt mà thực ra không đo gì.
  Căn cứ: Không ảnh hưởng người dùng cuối, chỉ lộ đường máy riêng và làm phép thử yếu trên máy khác; sửa sau rẻ.
  file: `scripts/watchdog-l4d-agentdb/acceptance.mjs`
  severity: low
  Đề xuất: known-limits

- **E14 chỉ thử log gateway, không thử log theo ngày dù kỳ vọng ghi «cả log gateway và log theo ngày» (r1 · tệp đã đổi)**
  Người dùng thấy gì: Một nhánh dò log theo ngày của bộ canh đã được sửa nhưng chưa có phép thử riêng; nếu nhánh này hỏng, lượt agent chỉ ghi ở log đó có thể không bị tắt gateway.
  Căn cứ: Nhánh log gateway chính đã được thử và lỗi này chỉ phủ đường phụ; vẫn có lớp đếm trên kho phiên bù, thêm ca thử sau rẻ.
  file: `scripts/watchdog-l4d-agentdb/acceptance.mjs`
  severity: low
  Đề xuất: known-limits

- **Hình dạng 6 (đường dẫn ghi cứng ROOT): E9c đo checkout của tác giả, không đo cây đang kiểm (r1 · tệp đã đổi)**
  Người dùng thấy gì: Phép kiểm tệp cảnh báo thật chỉ có nghĩa trên máy của Mạnh; trên máy khác nó báo đạt mà không đo gì.
  Căn cứ: Người dùng cuối không bị ảnh hưởng, chỉ làm bằng chứng nghiệm thu yếu ngoài máy tác giả; sửa sau rẻ.
  file: `scripts/watchdog-l4d-agentdb/acceptance.mjs`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 3 (chuỗi có mặt thay cho quan hệ): E6 hứa «lý do phân biệt được» nhưng mọi ca chỉ kiểm cùng một chuỗi (r1 · tệp đã đổi)**
  Người dùng thấy gì: Khi bộ canh tắt gateway vì không đọc được kho phiên, thông báo dùng chung một câu cho mọi nguyên nhân nên người vận hành phải tự đoán nguyên nhân cụ thể.
  Căn cứ: Gateway vẫn bị tắt đúng và có nêu lý do chung; chỉ chậm chẩn đoán, không mất dữ liệu, cải thiện thông báo sau rẻ.
  file: `scripts/watchdog-l4d-agentdb/acceptance.mjs`
  severity: high
  Đề xuất: known-limits

- **Hình dạng 5 (tuyên phủ cả lớp nhưng chỉ có một điểm): E14 hứa «cả log gateway và log theo ngày» nhưng chỉ đo gateway.log (r1 · tệp đã đổi)**
  Người dùng thấy gì: Chỗ sửa dò log theo ngày chưa có phép thử riêng, nên chưa chắc nó tắt gateway đúng khi lượt agent chỉ để dấu ở log đó.
  Căn cứ: Đường chính vẫn được thử và còn lớp đếm trên kho phiên bù; thêm ca thử sau rẻ, không mất dữ liệu.
  file: `scripts/watchdog-l4d-agentdb/acceptance.mjs`
  severity: medium
  Đề xuất: known-limits

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).
