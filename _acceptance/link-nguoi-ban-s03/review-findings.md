## Trong hợp đồng

- **Sự kiện 'bo-canh' của watchdog bị bỏ qua khi gateway khởi động lại sau hơn 30 phút, nên điểm dừng an toàn listener-dong-sau-goi không bật**
  file: `_acceptance/link-nguoi-ban-s03/extension.patch:385`
  severity: medium
  AC: AC-2
  source: bugs
  detail: mocGiu chỉ giữ những mốc lời gọi có `bayGio - t <= 30′`, tính theo thời điểm tick hiện tại chứ không theo thời điểm xảy ra sự kiện. Sự kiện 'bo-canh' chỉ được ghi (scripts/lib/bo-canh-su-kien.sh, gọi từ alert() của {S03}-watchdog.sh) ngay trước khi watchdog bootout launchd và pkill -9 openclaw. Bộ tra chạy trong gateway nên chết theo, và chỉ đọc được sự kiện khi có người khởi động lại gateway, thường sau hơn 30 phút. Đến lúc đó lời gọi đã rơi khỏi mocGiu, nên `cham` là false. Sự kiện cũ hơn 31 phút bị dọn, và nhánh thiếu api cũng dùng mốc moc60s trong vòng 30 phút nên chỉ ra khong-co-phien hoặc không làm gì. Kết quả là tệp chặn `listener-dong-sau-goi` và dòng `dung-goi-Manh`, vốn là điểm dừng mà runbook bắt «chỉ Mạnh quyết gọi lại», không bao giờ xuất hiện cho đúng trường hợp watchdog cảnh báo. Bộ tra sẽ gọi tiếp ở khung giờ kế. Cửa sổ 30 phút nên so giữa sự kiện và lời gọi (s.atMs - m), không nên lọc mốc lời gọi theo now.

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **Cổng /s03-ho-so nhận lay_luc không phải ISO, một dòng như vậy chặn nạp snapshot đó vĩnh viễn**
  Người dùng thấy gì: Nếu bộ tra gửi sai định dạng giờ, cả lô hồ sơ đó không nạp được và các dòng đúng trong lô cũng mất theo. Chỉ xảy ra khi phía gửi có lỗi.
  Căn cứ: Hiếm gặp vì chỉ bộ tra của mình gửi lên, nhưng khi xảy ra thì cả lô kẹt không tự gỡ được; sửa rẻ nên nên ghi lại để làm sau.
  file: `collector/src/api/server.ts`
  severity: medium
  Đề xuất: known-limits

- **Kênh tin S03 ghi schemaVersion 6 dù nhánh này chưa có albumMeta mà hợp đồng v6 khai**
  Người dùng thấy gì: Số phiên bản dữ liệu tin S03 có thể báo có trường album trong khi thực tế chưa có, làm người đọc sau này hiểu nhầm hình dạng dữ liệu cũ.
  Căn cứ: Không mất dữ liệu và không ảnh hưởng người dùng cuối; chỉ gây nhầm khi tra cứu về sau, và hết nhầm khi nhánh album được gộp.
  file: `collector/src/core/storage.ts`
  severity: low
  Đề xuất: known-limits

- **import-{S01} chép lại hằng của 080, chú thích nói ngược code, dò 080 lỏng hơn daCo080**
  Người dùng thấy gì: Chú thích trong mã mô tả sai hành vi và có hai cách dò khác nhau xem bảng mới đã áp chưa. Người dùng không thấy ảnh hưởng.
  Căn cứ: Chỉ là lộn xộn nội bộ, kết quả vẫn an toàn và không mất dữ liệu; dọn lúc nào cũng được.
  file: `pipeline/import-{S01}.mjs`
  severity: low
  Đề xuất: wont-fix

- **Chưa có job nào nạp snapshot s03-ho-so, nên bước đêm ghiLienLacHoSo luôn đọc bảng rỗng**
  Người dùng thấy gì: Hồ sơ người bán tra về sẽ không bao giờ vào danh bạ vì chưa có lịch tự nạp, nên link hồ sơ chat không xuất hiện dù bộ tra chạy tốt.
  Căn cứ: Tính năng chạy không báo lỗi nhưng không ra kết quả; dữ liệu không mất và nạp lại được, nhưng cần một việc nối lịch riêng.
  file: `pipeline/import-{S01}.mjs`
  severity: medium
  Đề xuất: new-contract

- **Spool không chia lô: quá 1000 dòng thì collector trả 413 mãi, spool kẹt vĩnh viễn; lỗi 401 vì thiếu khoá cũng rơi vào spool mà không có log**
  Người dùng thấy gì: Nếu bộ tra gửi lỗi âm thầm vài ngày, kết quả tra tồn lại ngày càng nhiều rồi kẹt hẳn, không ai biết.
  Căn cứ: Dữ liệu không mất nhưng kẹt không tín hiệu; chỉ xảy ra sau nhiều ngày lỗi và sửa không đắt, nên đáng mở việc riêng.
  file: `_acceptance/link-nguoi-ban-s03/extension.patch`
  severity: medium
  Đề xuất: new-contract

- **Một dòng spool dở (ghi nối bị cắt) làm phatLaiSpool ném lỗi ở mọi tick, bộ tra tê liệt**
  Người dùng thấy gì: Nếu máy bị tắt đột ngột đúng lúc ghi, bộ tra có thể ngừng làm việc và không gửi nổi kết quả cũ. Gỡ được bằng cách xoá dòng hỏng.
  Căn cứ: Cần trùng hợp bị tắt ngang đúng lúc ghi; không mất dữ liệu đã thu và người vận hành tự gỡ được, nên chấp nhận và ghi lại.
  file: `_acceptance/link-nguoi-ban-s03/extension.patch`
  severity: medium
  Đề xuất: known-limits

- **Lượt thử chỉ tra 18 mã người bán nhưng vẫn đóng tệp yêu cầu 20 mã, 2 mã cuối bị bỏ mà không báo**
  Người dùng thấy gì: Lượt thử thật ra chỉ tra 18 người thay vì 20, hai người cuối bị bỏ qua mà không báo. Họ sẽ được chọn lại ở lượt sau.
  Căn cứ: Hậu quả nhẹ vì chỉ thiếu hai người trong lượt thử và chọn lại được sau; chỉ cần ghi rõ con số thực tế.
  file: `_acceptance/link-nguoi-ban-s03/extension.patch`
  severity: medium
  Đề xuất: known-limits

- **coBangHoSo nuốt lỗi dò bảng thành false, trái với chính ghi chú «không được nuốt, ném để dừng lượt»**
  Người dùng thấy gì: Nếu việc kiểm tra bảng gặp lỗi lạ, hồ sơ có thể bị bỏ qua với thông báo sai lý do, và có lịch nạp sau đó sẽ không nạp lại.
  Căn cứ: Chỉ xảy ra khi cơ sở dữ liệu trục trặc, dữ liệu gốc vẫn còn và nạp tay lại được; hậu quả nhẹ.
  file: `pipeline/import-{S01}.mjs`
  severity: low
  Đề xuất: known-limits

- **Hình dạng 1 (đo chỉ dẫn thay vì đầu ra): ca [E9] «lệnh đo trước–sau» chỉ kiểm có tệp tên truoc-sau, không chạy lệnh**
  Người dùng thấy gì: Bài kiểm tra có thể báo đạt dù lệnh đo trước-sau chưa từng chạy thật, nên có thể tin nhầm là đã kiểm.
  Căn cứ: Không ảnh hưởng người dùng, chỉ làm bằng chứng yếu; lệnh sẽ được chạy thật lúc triển khai.
  file: `scripts/link-nguoi-ban-s03/tich-hop/bo-tra.tich-hop.test.mjs`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 6 (đo máy của tác giả): ca [E9] phán lùi đọc gateway.log thật trong HOME của máy chạy**
  Người dùng thấy gì: Bài kiểm này chỉ chạy đúng trên máy của người làm, trên máy khác sẽ đỏ hoặc cho kết quả tuỳ ngày.
  Căn cứ: Không ảnh hưởng người dùng cuối; chỉ gây nhiễu khi chấm trên máy khác, sửa khi cần.
  file: `scripts/link-nguoi-ban-s03/tich-hop/bo-tra.tich-hop.test.mjs`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 5 (tuyên cả lớp, chỉ quét một phần): [E4] «lời gọi API mới của diff extension» chỉ đếm AST trên monitor.ts và seller-lookup.ts**
  Người dùng thấy gì: Bài kiểm chỉ rà hai trong bốn tệp nên một lời gọi kênh ngoài dự kiến ở tệp còn lại có thể lọt qua.
  Căn cứ: Rủi ro chỉ xảy ra nếu có lời gọi lạ thật; hiện chưa thấy, rà thêm tệp là việc rẻ.
  file: `scripts/link-nguoi-ban-s03/tich-hop/bo-tra.tich-hop.test.mjs`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 5 (tuyên cả lớp, chỉ có ca điểm): E5 hứa canary vắng ở 5 nơi cùng spool, DATA-CONTRACT và hai thứ tự gộp; lệnh E5 chỉ chạy test collector đo snapshot**
  Người dùng thấy gì: Bài kiểm chỉ chứng minh dữ liệu cá nhân không lọt vào một nơi trong năm nơi đã hứa, nên bốn nơi còn lại chưa được kiểm.
  Căn cứ: Chưa có dấu hiệu dữ liệu lộ thật; là khoảng trống bằng chứng, bổ sung bài kiểm được sau.
  file: `scripts/link-nguoi-ban-s03/api.mjs`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 3 (assert có mặt hay cận dưới thay cho quan hệ): schemaVersion hồ sơ assert `>= 7`, kênh tin so với chính hằng mà bộ ghi dùng**
  Người dùng thấy gì: Bài kiểm sẽ vẫn xanh nếu số phiên bản dữ liệu hồ sơ bị đổi sang số khác 7.
  Căn cứ: Không ảnh hưởng người dùng; số phiên bản hiện đúng, chỉ là rào chắn lỏng.
  file: `collector/src/test/ho-so-api.test.ts`
  severity: low
  Đề xuất: wont-fix

- **Hình dạng 2 (fixture viết tay): E8 dựng snapshot hồ sơ chưa nạp bằng tay «đúng khuôn SnapshotWriter»**
  Người dùng thấy gì: Bài kiểm dùng dữ liệu mẫu tự dựng, nên nếu cách ghi dữ liệu thật đổi thì bài kiểm không phát hiện.
  Căn cứ: Không ảnh hưởng người dùng hiện tại; chỉ là rủi ro phát hiện chậm khi khuôn ghi đổi.
  file: `scripts/link-nguoi-ban-s03/chon.mjs`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 2 (fixture viết tay): itest bộ nạp tự CREATE TABLE «mô phỏng 080» thay vì áp migration 080 thật; assert username phụ thuộc chữ số cuối của Date.now()**
  Người dùng thấy gì: Bài kiểm nạp hồ sơ có thể đỏ ngẫu nhiên khoảng 9 lần trong 10 và không dùng bảng thật, nên có thể xanh dù bảng thật khác.
  Căn cứ: Chỉ gây nhiễu và kém tin cậy cho đội làm, không chạm người dùng; sửa rẻ.
  file: `pipeline/tests/ho-so-nap.itest.mjs`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 6 (đo bản dựng trên máy thay vì cây đang kiểm): E6 db-nap dựng snapshot bằng collector/dist (gitignored)**
  Người dùng thấy gì: Phép đo nạp dữ liệu có thể chạy trên bản dựng cũ nên có thể đạt hoặc trượt sai so với mã hiện tại.
  Căn cứ: Không ảnh hưởng người dùng cuối; chỉ làm kết quả kiểm có thể lệch, sửa bằng dựng lại bản.
  file: `scripts/link-nguoi-ban-s03/db-nap.mjs`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 2 (fixture viết tay, assert lên chính fixture): E2-phu dùng log khuôn dấu cách mà chính tệp test nói không phải khuôn thật, rồi assert regex trên chuỗi log nó tự viết**
  Người dùng thấy gì: Một bài kiểm luôn đạt nên không chứng minh được bộ nghe tin vẫn nhận tin sau khi bộ tra dừng.
  Căn cứ: Không ảnh hưởng người dùng; chỉ làm một bằng chứng yếu và các lớp kiểm khác đã phủ phần này.
  file: `collector/openclaw/tests/link-nguoi-ban/phai-lui-ho-so.test.mjs`
  severity: low
  Đề xuất: wont-fix

- **Hình dạng 1 (grep mã nguồn thay vì đo đầu ra), kèm bỏ qua mà vẫn xanh: kiểm watchdog gọi ghi_bo_canh bằng dò chữ**
  Người dùng thấy gì: Bài kiểm chỉ tìm chữ trong tệp canh gác chứ không chạy thử, nên có thể báo đạt dù cảnh báo không ghi sự kiện thật.
  Căn cứ: Không ảnh hưởng người dùng trực tiếp; là khoảng trống bằng chứng, vá được bằng một lần chạy thử.
  file: `collector/openclaw/tests/link-nguoi-ban/bo-canh-su-kien.test.mjs`
  severity: low
  Đề xuất: known-limits

- **Hình dạng 1 và 6: E9-phu gọi tiền kiểm tĩnh nhưng tuyên đo «tái kiểm ngay trước mỗi lời»; E4-phu đọc monitor.ts ở cây làm việc ~/dev/openclaw thay vì nền cộng .patch**
  Người dùng thấy gì: Hai bài kiểm phụ nói đo việc tái kiểm trước mỗi lời gọi và bản mã nền, nhưng thực tế chỉ kiểm tĩnh và đọc thư mục của người làm.
  Căn cứ: Không đổi hành vi với người dùng; chỉ làm bằng chứng yếu, bổ sung khi cần.
  file: `collector/openclaw/tests/link-nguoi-ban/tien-kiem-ho-so.test.mjs`
  severity: low
  Đề xuất: known-limits

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).
