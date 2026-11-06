# Review findings: noi-du-an-s08-khu-do-thi (round 2)

## Trong hợp đồng

Không có finding nào trong hợp đồng ở round này.

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **Câu đối chiếu tập dự án ở E4 mất chiều «có trong S08 mà thiếu trong bảng nối», do thứ tự EXCEPT và UNION ALL**
  Người dùng thấy gì: Một câu kiểm trong bộ đo có thể bỏ sót trường hợp dự án S08 thiếu dòng trong bảng nối, nhưng một câu kiểm khác trong cùng bộ đo vẫn báo đỏ nên kết quả cuối không bị xanh nhầm.
  Căn cứ: Không ảnh hưởng người dùng cổng và không làm mất dữ liệu; lỗi bị một phép kiểm khác che lại nên chỉ cần ghi nhận, sửa sau rẻ.
  file: `_acceptance/noi-du-an-s08-khu-do-thi/probes/nap.mjs`
  severity: low
  Đề xuất: known-limits

- **Hàm kiểm nhận tín hiệu chỉ khớp mã dự án, rộng hơn AC-9 («khớp tên hoặc phân khu»)**
  Người dùng thấy gì: Phép kiểm chấp nhận cả trường hợp tín hiệu chỉ khớp mã dự án, rộng hơn lời hứa là khớp tên hoặc phân khu. Với bảng nối hiện tại chưa có dòng nào bị ảnh hưởng.
  Căn cứ: Hôm nay không có dòng nào lọt, chỉ có thể gây nối nhầm khi thêm lát mới, mà bảng nối do người duyệt và đã có chỗ đo khác; ghi lại để lát sau xử lý.
  file: `pipeline/noi-du-an-s08.mjs`
  severity: low
  Đề xuất: known-limits

- **Câu SQL 'lech' chỉ đo một chiều: dự án có trong stg mà thiếu ở bảng nối không bị đếm**
  Người dùng thấy gì: Một câu kiểm dự án thiếu dòng chỉ đo được một chiều, nhưng phép kiểm tổng số dòng đi kèm vẫn bắt được trường hợp đó nên không làm lọt lỗi.
  Căn cứ: Người dùng không thấy gì khác đi và không mất dữ liệu; lỗi bị che bởi phép kiểm khác, sửa sau rẻ.
  file: `_acceptance/noi-du-an-s08-khu-do-thi/probes/nap.mjs`
  severity: low
  Đề xuất: known-limits

- **Hình 3 (có mặt thay vì quan hệ): không phép đo nào giữ quan hệ tín hiệu khớp tên dự án của AC-9**
  Người dùng thấy gì: Bộ kiểm chưa có ca nào buộc tín hiệu của mỗi dòng phải khớp tên dự án của chính nó, nên nếu ai làm hỏng riêng điều kiện đó thì kiểm tự động vẫn xanh.
  Căn cứ: Bảng nối hiện tại đã duyệt và đúng, nên người dùng không gặp sai lệch ngay; rủi ro chỉ là nối nhầm khu không bị bắt khi sửa mã về sau, và thêm ca kiểm sau này rẻ.
  file: `pipeline/noi-du-an-s08.test.mjs`
  severity: high
  Đề xuất: known-limits

- **Hình 5 (tuyên quét lớp, chỉ có điểm-case): ma trận lỗi một ca cho mỗi mã, bỏ sót hai nhánh phía `loai`**
  Người dùng thấy gì: Hai kiểu sai ở danh sách dự án bị loại (vừa nối vừa loại, mã dự án lạ) chưa có ca kiểm riêng, nên nếu mã xử lý hai kiểu này bị xoá thì kiểm tự động vẫn xanh.
  Căn cứ: Chỉ ảnh hưởng người vận hành khi sửa tệp bảng nối sai theo hai kiểu hiếm này, lệnh nối không ghi dữ liệu thật ngoài ý muốn; thêm ca kiểm sau rẻ.
  file: `pipeline/noi-du-an-s08.test.mjs`
  severity: medium
  Đề xuất: known-limits

- **Hình 5 (tuyên quét lớp, chỉ có điểm-case): quét mã số tuyên «mọi khuôn (JSON, bảng, CSV)» nhưng bảng và CSV thật lọt**
  Người dùng thấy gì: Phép quét tìm mã dự án S08 lộ ra ngoài không bắt được khi mã nằm trong bảng có dòng tiêu đề hoặc tệp CSV, dù chú thích nói là bắt mọi khuôn.
  Căn cứ: Hiện không có dấu hiệu mã nào đã lọt ra kho công khai, nhưng nếu lọt thì khó gỡ vì kho đã công khai; nên ghi rõ giới hạn này và mở rộng phép quét ở lượt sau.
  file: `_acceptance/noi-du-an-s08-khu-do-thi/probes/kin.mjs`
  severity: medium
  Đề xuất: known-limits

- **Hình 4 (âm tính một mình): 'khong dong nao bi loai ma van noi' không có đối chứng dương**
  Người dùng thấy gì: Phép kiểm «không dòng nào vừa bị loại vừa được nối» chưa từng được thử với một dòng sai để chứng minh nó thật sự báo đỏ.
  Căn cứ: Dữ liệu bảng nối hiện tại đúng và không ảnh hưởng người dùng cổng; chỉ làm giảm độ tin của phép kiểm, thêm ca đối chứng sau rẻ.
  file: `_acceptance/noi-du-an-s08-khu-do-thi/probes/nap.mjs`
  severity: low
  Đề xuất: known-limits

- **Hình 3 (có mặt thay vì quan hệ): câu `lech` tuyên so hai chiều tập dự án nhưng chỉ đo một chiều**
  Người dùng thấy gì: Câu so hai tập dự án nói là so hai chiều nhưng thật ra chỉ so một chiều; phép so tổng số dòng đi kèm vẫn bảo đảm kết quả cuối đúng.
  Căn cứ: Không đổi gì cho người dùng và không mất dữ liệu; chỉ là thông báo lỗi nói quá điều nó đo, sửa sau rẻ.
  file: `_acceptance/noi-du-an-s08-khu-do-thi/probes/nap.mjs`
  severity: low
  Đề xuất: known-limits

- **Hình 3 (có mặt thay vì quan hệ): trên DB chỉ đếm `ly_do` khác null, không so lý do với bảng nối**
  Người dùng thấy gì: Sau khi ghi bảng, chưa có phép kiểm nào đọc nội dung lý do loại để chắc rằng từng dự án mang đúng lý do đã duyệt, chỉ kiểm là có lý do.
  Căn cứ: Bảng chỉ để nội bộ trên máy thu và người dùng cổng không thấy; nếu lý do ghi lệch thì chạy lại lệnh nối là sửa được, nên chấp nhận và ghi vết.
  file: `_acceptance/noi-du-an-s08-khu-do-thi/probes/nap.mjs`
  severity: low
  Đề xuất: known-limits

- **Cột `ly_do` và enum `noi`/`chua_noi` trái luật đặt tên tiếng Anh (r1)**
  Người dùng thấy gì: Bảng nối dự án với khu đô thị đặt tên cột và giá trị bằng tiếng Việt, lệch quy ước đặt tên tiếng Anh của kho. Người dùng cuối không thấy gì; chỉ người làm tiếp sẽ thấy tên không đồng bộ.
  Căn cứ: Chỉ là lệch quy ước đặt tên, không làm mất hay sai dữ liệu; đổi tên sau khi bảng đã có dữ liệu thì tốn công hơn, nhưng chưa ảnh hưởng ai.
  file: `db/migrations/074_noi_du_an_s08.sql`
  severity: medium
  Đề xuất: known-limits

- **Probe ghi bảng nối thật vào thư mục không gitignore của kho công khai (r1 · tệp đã đổi)**
  Người dùng thấy gì: Nếu phép đo bị ngắt giữa chừng, một tệp tạm chứa mã dự án thật có thể nằm lại trong thư mục không được git bỏ qua và vô tình bị đưa lên kho công khai.
  Căn cứ: Chỉ xảy ra khi phép đo bị ngắt đúng lúc và người commit không để ý; lộ mã dự án trên kho công khai khó thu hồi, nhưng khả năng thấp và sửa rẻ.
  file: `_acceptance/noi-du-an-s08-khu-do-thi/probes/nap.mjs`
  severity: medium
  Đề xuất: known-limits

- **Test mới nằm ngoài glob của `npm test`, job CI pipeline không chạy nó (r1)**
  Người dùng thấy gì: Bộ test của phần nối dự án không chạy trong kiểm tra tự động khi gộp, nên một thay đổi sau này làm hỏng nó có thể không bị phát hiện ngay.
  Căn cứ: Không ảnh hưởng người dùng hôm nay và test vẫn xanh khi chạy tay; lỗ này có sẵn ở các test khác nên sửa chung một lần sẽ rẻ hơn.
  file: `pipeline/package.json`
  severity: low
  Đề xuất: known-limits

- **Tệp sai hình dạng bị báo nhầm thành lỗi DB thay vì mã lỗi tệp (r1 · tệp đã đổi)**
  Người dùng thấy gì: Khi tệp bảng nối sai cấu trúc, lệnh vẫn dừng an toàn nhưng báo như lỗi cơ sở dữ liệu, khiến người vận hành đi tìm sai chỗ.
  Căn cứ: Không mất hay lộ dữ liệu, bảng không bị đổi; chỉ tốn thời gian chẩn đoán và người vận hành tự sửa được tệp rồi chạy lại.
  file: `pipeline/noi-du-an-s08.mjs`
  severity: low
  Đề xuất: known-limits

- **Catch ghi mọi ngoại lệ thành `loi: db ?`, kể cả lỗi hình dạng tệp bảng nối (r1 · tệp đã đổi)**
  Người dùng thấy gì: Tệp bảng nối sai cấu trúc bị báo là lỗi cơ sở dữ liệu, làm người vận hành khó biết lỗi nằm ở tệp của mình.
  Căn cứ: Chỉ gây nhầm lẫn khi chẩn đoán, không mất hay lộ dữ liệu; sửa tệp rồi chạy lại là xong.
  file: `pipeline/noi-du-an-s08.mjs`
  severity: low
  Đề xuất: known-limits

- **Hình 5 (tuyên quét lớp, không ma trận viết trước): miễn trừ tên tính lúc chạy, không khai trước, không ghim số (r1 · tệp đã đổi)**
  Người dùng thấy gì: Phép kiểm không để lộ tên dự án có một số tên được bỏ qua theo quy tắc tự tính, nên danh sách bỏ qua có thể phình ra mà không ai hay.
  Căn cứ: Hôm nay chỉ bỏ qua 7 tên trong 143 và không có rò rỉ nào được tìm thấy; rủi ro là phép kiểm lỏng dần theo thời gian, sửa lúc nào cũng rẻ.
  file: `_acceptance/noi-du-an-s08-khu-do-thi/probes/kin.mjs`
  severity: medium
  Đề xuất: known-limits

- **Hình 5 (điểm-case thay vì lớp): luật quét tên khai bốn quy tắc, đối chứng chỉ phủ casefold (r1 · tệp đã đổi)**
  Người dùng thấy gì: Phép kiểm không để lộ tên dự án chỉ thử lại được cách viết hoa viết thường, chưa thử bỏ dấu hay bỏ hậu tố, nên có thể bỏ lọt một cách viết khác của tên.
  Căn cứ: Hôm nay chưa thấy rò rỉ và đây chỉ là độ chặt của phép kiểm; thêm ca đối chứng sau này rẻ và người dùng không thấy ảnh hưởng.
  file: `_acceptance/noi-du-an-s08-khu-do-thi/probes/kin.mjs`
  severity: low
  Đề xuất: known-limits

- **Hình 4 (âm tính một mình): bí danh đã bỏ và tên nút chỉ kiểm vắng mặt sau 074, không đối chứng có mặt trước 074 (r1 · tệp đã đổi)**
  Người dùng thấy gì: Phép kiểm việc dọn bí danh dự án chỉ thấy bí danh đã biến mất, chưa chứng minh năm bí danh kia từng tồn tại trước khi dọn.
  Căn cứ: Trên dữ liệu hiện tại kết quả đúng, nên không có hại thực; chỉ là phép kiểm có thể xanh nhầm nếu dữ liệu đổi, sửa rẻ.
  file: `_acceptance/noi-du-an-s08-khu-do-thi/probes/nap.mjs`
  severity: low
  Đề xuất: known-limits

- **Hình 6 (đo checkout của tác giả): 'tep bang noi bi git bo qua' đọc .gitignore của checkout chính, không phải cây đang kiểm (r1 · tệp đã đổi)**
  Người dùng thấy gì: Phép kiểm xem tệp bảng nối có được git bỏ qua đang đọc luật của thư mục chính chứ không phải nhánh đang chấm, nên nhánh gỡ luật bỏ qua có thể không bị phát hiện.
  Căn cứ: Chỉ xảy ra khi có ai gỡ luật bỏ qua trong nhánh, hiếm gặp, và các bước kiểm khi gộp sẽ thấy; sửa rẻ.
  file: `_acceptance/noi-du-an-s08-khu-do-thi/probes/kin.mjs`
  severity: low
  Đề xuất: known-limits

- **Hình 1 (đo chỉ dẫn thay vì đầu ra): 'mappings chi local' dò chuỗi trong mô tả tự do mà không code nào đọc (r1 · tệp đã đổi)**
  Người dùng thấy gì: Tệp khai báo nguồn dự án có ghi chú «chỉ local» nhưng phép kiểm chỉ dò chữ, không phải một cấu hình mà hệ thống thực sự đọc; chặn đồng bộ thật nằm ở chỗ khác.
  Căn cứ: Dữ liệu dự án thực tế không bị đưa lên cloud vì đã có phép đo riêng cho việc đó; chỉ là câu chữ khai báo có thể không khớp, sửa lúc nào cũng rẻ.
  file: `_acceptance/noi-du-an-s08-khu-do-thi/probes/nap.mjs`
  severity: low
  Đề xuất: known-limits

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).
