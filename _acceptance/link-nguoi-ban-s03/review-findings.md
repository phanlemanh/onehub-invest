# Review findings: link-nguoi-ban-s03 (round 5)

## Trong hợp đồng

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **Không job đêm nào nạp snapshot s03-ho-so; và cơ chế 'không đánh dấu đã nạp' khi thiếu 080 dựa vào {S01}_snapshots, không phải dấu trạng thái thật của job**
  Người dùng thấy gì: Kết quả tra hồ sơ người bán được lưu ra đĩa nhưng không có việc chạy đêm nào đưa vào danh bạ, nên link hồ sơ chưa hiện cho ai. Nếu sau này nối vào mà không cẩn thận, kết quả có thể bị bỏ qua vĩnh viễn.
  Căn cứ: Tính năng chưa mang lại link nào cho người dùng cho tới khi nối xong, nhưng dữ liệu vẫn còn trên đĩa và nối sau không mất gì, sửa là một việc riêng gọn.
  file: `scripts/{S03}-import-daily.sh`
  severity: high
  Đề xuất: new-contract

- **Bảng, view và cột mới đặt tên tiếng Việt, trái quy ước «tên bảng/cột, API: tiếng Anh»**
  Người dùng thấy gì: Một số tên bảng và cột nội bộ dùng tiếng Việt thay vì tiếng Anh. Người dùng cuối không thấy gì, chỉ lệch quy ước đặt tên của đội.
  Căn cứ: Không ảnh hưởng người dùng hay dữ liệu, còn đổi tên sau khi migration đã commit thì tốn kém hơn nhiều so với lợi ích.
  file: `db/migrations/080_ho_so_s03.sql`
  severity: medium
  Đề xuất: wont-fix

- **Biên nhận lô hồ sơ chỉ kiểm lay_luc bằng Date.parse, nhận cả chuỗi không phải ISO trái với hợp đồng**
  Người dùng thấy gì: Nếu bộ tra gửi thời điểm sai khuôn, cả lô kết quả có thể không nạp được vào danh bạ. Bộ tra của ta luôn gửi đúng khuôn nên khó xảy ra.
  Căn cứ: Chỉ xảy ra khi chính bộ tra gửi sai, hậu quả là một lô không nạp được chứ không lộ hay mất dữ liệu gốc, và có thể sửa bằng vá nhỏ sau.
  file: `collector/src/api/server.ts`
  severity: medium
  Đề xuất: known-limits

- **Kênh tin {S03} ghi schemaVersion 6 dù nhánh này không có field albumMeta mà v6 khai**
  Người dùng thấy gì: Trong một thời gian, dữ liệu tin nhóm khai là có thêm thông tin album trong khi thực tế chưa có. Người dùng không thấy gì, chỉ người đọc dữ liệu thô về sau có thể hiểu nhầm.
  Căn cứ: Tự hết khi nhánh album được gộp, không mất dữ liệu và không ảnh hưởng ai ngoài người đọc kỹ thuật.
  file: `collector/src/core/storage.ts`
  severity: medium
  Đề xuất: known-limits

- **Đường KILL của watchdog {S03} chạy thêm bước đọc env gateway và ghi tệp sự kiện TRƯỚC launchctl bootout và pkill**
  Người dùng thấy gì: Khi hệ thống phải tắt khẩn kênh {S03}, có một bước ghi tệp phụ chạy trước. Nếu bước này treo thì việc tắt có thể chậm lại.
  Căn cứ: Hiếm khi treo và chỉ làm chậm chứ không làm hỏng việc tắt, nhưng đây là lớp an toàn {S03} nên nên sửa sớm khi có dịp.
  file: `scripts/{S03}-watchdog.sh`
  severity: low
  Đề xuất: known-limits

- **Snapshot s03-ho-so không có đường nạp tự động: stg_s03_ho_so không bao giờ có dữ liệu, cơ chế «không đánh dấu đã nạp» cũng vô hiệu**
  Người dùng thấy gì: Kết quả tra hồ sơ người bán dừng ở đĩa, không vào danh bạ, nên người bán không để lại số chưa có link hồ sơ. Nối sai về sau còn có thể làm kết quả bị bỏ sót mà không báo.
  Căn cứ: Dữ liệu không mất nên nối lại sau vẫn được, nhưng tính năng chưa có tác dụng cho đến khi làm việc nối này.
  file: `scripts/{S03}-import-daily.sh`
  severity: medium
  Đề xuất: new-contract

- **coBangHoSo nuốt lỗi dò bảng thành false, trái với chú thích «không được nuốt — ném để dừng lượt»**
  Người dùng thấy gì: Nếu việc kiểm bảng gặp lỗi tạm, hệ thống báo nhầm là chưa áp migration và bỏ qua hồ sơ lượt đó mà không báo lỗi. Link hồ sơ có thể thiếu mà không ai biết.
  Căn cứ: Cần lỗi hiếm xảy ra đúng lúc nạp, và snapshot gốc vẫn còn nên có thể nạp lại tay sau khi phát hiện.
  file: `pipeline/import-{S01}.mjs`
  severity: medium
  Đề xuất: known-limits

- **Lượt thử: lap-yeu-cau chọn 20 mã người bán nhưng bộ tra chỉ gọi 18, 2 mã cuối bị bỏ mà không báo**
  Người dùng thấy gì: Lượt thử chỉ tra 18 trong 20 người bán được chọn mà không báo hai người còn lại bị bỏ. Số đếm báo cáo cho Mạnh sẽ thấp hơn kỳ vọng.
  Căn cứ: Chỉ là lệch số trong lượt thử nhỏ, không gây hại, hai mã sót sẽ được chọn lại ở lần sau.
  file: `pipeline/lib/chon-ma-ho-so.mjs`
  severity: medium
  Đề xuất: known-limits

- **Bộ tra ghi tệp chặn khong-co-phien vĩnh viễn mỗi khi listener hở một nhịp, kể cả ngoài khung giờ và khi không có yêu cầu**
  Người dùng thấy gì: Một lần kênh chập chờn ban ngày có thể khoá bộ tra cho tới khi người xoá tay, nên lượt tra đêm bị chặn câm. Không gây nguy hiểm vì chỉ là không tra.
  Căn cứ: Thiên về an toàn (chặn chứ không gọi), người dùng không mất dữ liệu, chỉ cần xoá tệp chặn rồi chạy lại.
  file: `_acceptance/link-nguoi-ban-s03/extension.patch`
  severity: low
  Đề xuất: known-limits

- **Gửi collector và phát lại spool nuốt mọi lỗi không log; thiếu S03_COLLECTOR_KEY làm kết quả kẹt spool mãi, còn mã bị coi là đã tra**
  Người dùng thấy gì: Nếu cấu hình khoá sai, kết quả tra nằm im trong hàng chờ và không có cảnh báo, các người bán đó cũng không được tra lại. Link hồ sơ sẽ không xuất hiện mà không rõ lý do.
  Căn cứ: Dữ liệu không mất và gỡ được bằng sửa cấu hình rồi phát lại, nhưng lỗi im lặng khiến khó phát hiện.
  file: `_acceptance/link-nguoi-ban-s03/extension.patch`
  severity: low
  Đề xuất: known-limits

- **phai-lui-ho-so: nhánh dự phòng +07:00 không bao giờ chạy (regex luôn khớp dấu '-' của ngày)**
  Người dùng thấy gì: Công cụ phán có nên lùi bản cài hay không có thể lệch 7 giờ nếu chạy trên máy không đặt giờ Việt Nam. Trên máy của Mạnh thì đúng.
  Căn cứ: Chỉ ảnh hưởng công cụ kiểm trên máy khác múi giờ, không đụng người dùng hay dữ liệu thật.
  file: `collector/openclaw/tests/link-nguoi-ban/phai-lui-ho-so.mjs`
  severity: low
  Đề xuất: known-limits

- **db-nap (E6) không kiểm vế «snapshot hồ sơ không bị đánh dấu đã nạp» dù chú thích khai có**
  Người dùng thấy gì: Bài kiểm chưa chứng minh được rằng hồ sơ chưa nạp không bị đánh dấu nhầm là đã nạp. Nếu có lỗi này, một số hồ sơ có thể bị bỏ sót mà không ai biết.
  Căn cứ: Chỉ là chỗ kiểm còn hở chứ chưa thấy lỗi thật, bổ sung kiểm sau không tốn nhiều.
  file: `scripts/link-nguoi-ban-s03/db-nap.mjs`
  severity: low
  Đề xuất: known-limits

- **Hình dạng 1 (đo chỉ dẫn thay vì đầu ra): E9 chỉ kiểm có tệp tên truoc-sau, không chạy lệnh đo**
  Người dùng thấy gì: Bài kiểm chỉ xác nhận có tệp đo trước-sau mà chưa chạy thử, nên khi khởi động lại gateway thật có thể phát hiện lệnh đo không hoạt động đúng. Người dùng cuối không bị ảnh hưởng.
  Căn cứ: Lệnh đo chỉ dùng lúc triển khai, sai thì thấy ngay và chạy lại được, không mất dữ liệu.
  file: `scripts/link-nguoi-ban-s03/tich-hop/bo-tra.tich-hop.test.mjs`
  severity: high
  Đề xuất: known-limits

- **Hình dạng 3 (assert chuỗi có mặt trong khi lời hứa là quan hệ): E6 «snapshot hồ sơ không bị đánh dấu» không được đo**
  Người dùng thấy gì: Chưa có bài kiểm xác nhận hồ sơ chưa nạp vẫn được nạp lại sau khi áp migration. Nếu sai, hồ sơ có thể bị bỏ sót.
  Căn cứ: Chưa thấy lỗi thật, chỉ thiếu bằng chứng; bổ sung sau rẻ và dữ liệu không mất.
  file: `scripts/link-nguoi-ban-s03/db-nap.mjs`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 5 (tuyên quét lớp nhưng chỉ phủ một phần): E4 «diff extension chỉ thêm getUserInfo» chỉ quét 2/4 tệp mã của .patch**
  Người dùng thấy gì: Bài kiểm chưa quét hết mã thêm vào, nên một lời gọi kênh không mong muốn thêm sau này có thể lọt. Hiện chưa thấy có lời gọi nào như vậy.
  Căn cứ: Rủi ro nằm ở tương lai và liên quan an toàn kênh, nhưng mở rộng phạm vi quét là sửa rẻ.
  file: `scripts/link-nguoi-ban-s03/tich-hop/bo-tra.tich-hop.test.mjs`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 6 (đường dẫn trỏ ra máy tác giả): E9 phán lùi đọc ~/Library/Logs/openclaw/gateway.log thật**
  Người dùng thấy gì: Bài kiểm này đỏ hoặc xanh tuỳ log trên máy chạy, nên trên máy khác có thể báo sai. Không ảnh hưởng người dùng cuối.
  Căn cứ: Chỉ làm kết quả kiểm thiếu ổn định trên máy khác, không đụng dữ liệu hay tính năng.
  file: `scripts/link-nguoi-ban-s03/tich-hop/bo-tra.tich-hop.test.mjs`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 6 (đo bản dựng hay checkout của tác giả thay vì cây đang kiểm): db-nap dùng collector/dist, E4-phu dùng cây ~/dev/openclaw**
  Người dùng thấy gì: Một số bài kiểm có thể đo bản dựng cũ trên máy thay vì mã mới nhất, nên kết quả xanh chưa chắc phản ánh đúng. Người dùng cuối không thấy.
  Căn cứ: Chỉ làm độ tin cậy của bài kiểm giảm, không gây hại trực tiếp, sửa bằng dựng lại trước khi kiểm.
  file: `scripts/link-nguoi-ban-s03/db-nap.mjs`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 5 (tuyên phủ nhiều vị trí nhưng chỉ đo một): lệnh chấm E5 chỉ kiểm canary trong items snapshot**
  Người dùng thấy gì: Bài kiểm chỉ xác nhận dữ liệu cá nhân thừa không lọt vào snapshot mà chưa kiểm hàng chờ, tệp chặn và log. Nếu lọt ở đó thì thông tin riêng tư có thể nằm trên đĩa máy thu.
  Căn cứ: Chưa thấy rò rỉ thật, dữ liệu chỉ ở máy thu, bổ sung kiểm các chỗ còn lại là việc vừa phải.
  file: `scripts/link-nguoi-ban-s03/api.mjs`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 3 (assert giá trị có mặt trong khi lời hứa là quan hệ): schemaVersion hồ sơ chỉ kiểm >= 7, kênh tin so với chính hằng mà writer dùng**
  Người dùng thấy gì: Bài kiểm số phiên bản dữ liệu hơi lỏng nên có thể không bắt được lệch thứ tự phiên về sau. Hiện chưa có lỗi thật.
  Căn cứ: Chỉ là kiểm chưa chặt, không ảnh hưởng người dùng, sửa rẻ khi có dịp.
  file: `collector/src/test/ho-so-api.test.ts`
  severity: low
  Đề xuất: known-limits

- **Hình dạng 3 (assert chuỗi có mặt trên chính fixture viết tay): E2-phu «tự nối lại + handler vẫn nhận tin» là kiểm vô nghĩa**
  Người dùng thấy gì: Một bài kiểm luôn xanh nên chưa chứng minh được kênh tự nối lại và vẫn nhận tin sau khi bộ tra dừng. Chỉ làm giảm độ tin cậy của kiểm tra.
  Căn cứ: Chưa thấy hành vi sai, chỉ thiếu bằng chứng; việc này sẽ được chứng minh thật lúc canh 30 phút sau khởi động lại.
  file: `collector/openclaw/tests/link-nguoi-ban/phai-lui-ho-so.test.mjs`
  severity: low
  Đề xuất: known-limits

- **Hình dạng 3 (assert chuỗi có mặt trong khi lời hứa là quan hệ) và skip được tính là đạt: móc watchdog chỉ grep nguồn**
  Người dùng thấy gì: Bài kiểm có thể báo đạt dù móc watchdog nằm sai chỗ hoặc bị bỏ qua. Người dùng cuối không thấy gì.
  Căn cứ: Chỉ là độ chặt của kiểm tra, sửa rẻ, không ảnh hưởng dữ liệu.
  file: `collector/openclaw/tests/link-nguoi-ban/bo-canh-su-kien.test.mjs`
  severity: low
  Đề xuất: known-limits

- **Hình dạng 5 (thiếu ma trận toàn phần): test tiền kiểm tuyên ba tệp nhưng chỉ assert hai**
  Người dùng thấy gì: Bài kiểm tiền kiểm khởi động lại chưa thử trường hợp còn tệp chặn, nên nếu hỏng, gateway có thể khởi động lại khi không nên. Hiện chưa thấy lỗi.
  Căn cứ: Chỉ thiếu một ca kiểm trong bước chuẩn bị, bổ sung rất rẻ.
  file: `collector/openclaw/tests/link-nguoi-ban/tien-kiem-ho-so.test.mjs`
  severity: low
  Đề xuất: known-limits

- **Hình dạng 2 (fixture viết tay đúng khuôn bên đọc): snapshot hồ sơ chưa nạp ở E8 và bảng 080 ở itest không đi qua bên ghi thật**
  Người dùng thấy gì: Bài kiểm dùng dữ liệu thử dựng tay nên nếu khuôn dữ liệu thật đổi, bài kiểm vẫn xanh trong khi chọn người bán có thể sai. Hiện chưa có lỗi thật.
  Căn cứ: Rủi ro chỉ xuất hiện khi khuôn dữ liệu đổi sau này, không ảnh hưởng người dùng ngay.
  file: `scripts/link-nguoi-ban-s03/chon.mjs`
  severity: low
  Đề xuất: known-limits

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).
