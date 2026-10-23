## Trong hợp đồng

- **Hình dạng 4 (assertion âm tính một mình, không đối chứng được): AC-5(b) so số dòng sale_offers sau ROLLBACK TO SAVEPOINT**
  file: `pipeline/scripts/test-posts.test.mjs:207`
  severity: medium
  AC: AC-5
  source: measurement
  detail: Ca 'AC-5 lượt sạch và lượt toàn thử' (b) làm: đếm `before` → `SAVEPOINT allTest` → UPDATE mọi post zalo thành 'TEST' → `assert.rejects(runTransformZalo(c), /lượt nạp rỗng/)` → `ROLLBACK TO SAVEPOINT allTest` → đếm `after` → `assert.equal(after, before, "AC-5 lượt toàn thử xoá nguồn")`. ROLLBACK TO SAVEPOINT xoá mọi thay đổi sau savepoint, kể cả khi transform đã DELETE hết offer S03, nên `after === before` luôn đúng và assert này không bao giờ đỏ. Thông điệp ghim 'AC-5 lượt toàn thử xoá nguồn' nằm trên một phép đo hằng đúng. Thứ thật sự canh vế «không xoá nguồn» chỉ là regex `/lượt nạp rỗng/` của assert.rejects, mà regex này không chứng được là chưa xoá dòng nào trước khi ném lỗi. Muốn đo vế này thì phải đếm sale_offers S03 ngay sau lúc reject và trước ROLLBACK TO SAVEPOINT, hoặc bỏ savepoint đi.
  rationale: Vế «không offer nào của nguồn bị xoá» của AC-5 chỉ được canh bằng một phép so luôn đúng sau ROLLBACK, nên bằng chứng cho vế đó không đo được gì.

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **Xoá người bán mồ côi không đảo được: không còn đường nào INSERT vào sellers**
  Người dùng thấy gì: Người bán đã bị dọn khỏi danh sách sẽ không tự quay lại, kể cả khi tin của họ xuất hiện lại sau này; tên của họ (chỉ có ở máy local) cũng mất theo.
  Căn cứ: Hợp đồng đã chủ động chọn xoá và đã ghi rõ việc thiếu đường thêm người bán là ngoài phạm vi; hậu quả chỉ là danh sách người bán thưa hơn, không lộ hay hỏng dữ liệu khác, nên ghi lại là đủ.
  file: `pipeline/refresh-bait-gap.mjs`
  severity: medium
  Đề xuất: known-limits

- **refreshBaitGap: DELETE sellers và dòng audit không nằm chung một giao dịch khi chạy từ main**
  Người dùng thấy gì: Nếu lượt dọn người bán lỗi giữa chừng, danh sách người bán có thể đã co mà không có dòng ghi chú giải thích, khiến lượt đồng bộ lên cloud bị chặn cho đến khi người vận hành xử lý tay.
  Căn cứ: Chỉ xảy ra khi lỗi đúng khoảnh khắc hiếm, không làm lộ hay mất dữ liệu người dùng (hệ thống tự chặn đồng bộ), và người vận hành gỡ được bằng một lần can thiệp.
  file: `pipeline/refresh-bait-gap.mjs`
  severity: low
  Đề xuất: known-limits

- **--simulate đo dư lượng trên mọi kênh nhưng chỉ chạy transform S03**
  Người dùng thấy gì: Lệnh kiểm dư lượng dữ liệu thử có thể báo đỏ oan nếu sau này xuất hiện tin thử của kênh Facebook, dù hệ thống thật đã lọc đúng.
  Căn cứ: Hiện chưa có tin thử Facebook nên chưa gây báo sai; nếu xảy ra chỉ là cảnh báo thừa cho người vận hành, không ảnh hưởng dữ liệu người dùng.
  file: `pipeline/scripts/test-data-residue.mjs`
  severity: low
  Đề xuất: known-limits

- **Cửa miễn chặn tụt sellers hết hạn sau 24h và không bao giờ tự mở lại: nếu sync lỡ khung 24h, cả lượt đồng bộ cloud bị chặn vĩnh viễn**
  Người dùng thấy gì: Nếu đồng bộ lên cloud lỗi liên tục hơn một ngày ngay sau lượt dọn người bán, mọi bảng sẽ ngừng cập nhật lên cloud cho tới khi người vận hành can thiệp tay.
  Căn cứ: Dữ liệu không bị mất hay lộ, chỉ đứng yên trên cloud và cần một lần xử lý tay; kịch bản cần sự cố kéo dài trên 24 giờ nên hiếm.
  file: `pipeline/sync-cloud.mjs`
  severity: medium
  Đề xuất: known-limits

- **--simulate chỉ chạy transform S03 nhưng thước đo và kiểm tra tính cả post thử/offer của kênh Facebook (S05)**
  Người dùng thấy gì: Phép đo dư lượng dữ liệu thử có thể cho kết quả sai lệch nếu có tin thử của kênh Facebook, khiến người vận hành thấy báo đỏ hoặc số liệu không đúng.
  Căn cứ: Chưa có tin thử Facebook trong dữ liệu hôm nay nên chưa xảy ra; nếu xảy ra chỉ gây cảnh báo sai cho người vận hành, không ảnh hưởng người dùng cuối.
  file: `pipeline/scripts/test-data-residue.mjs`
  severity: low
  Đề xuất: known-limits

- **Hình dạng 2 (fixture viết tay đúng khuôn bên đọc, không round-trip): ma trận AC-10 không đi qua writer audit và loader của syncOnce**
  Người dùng thấy gì: Chưa có bài kiểm tra chạy trọn đường từ lúc ghi dòng dọn người bán đến lúc đồng bộ cloud, nên nếu hai đầu lệch nhau thì cửa cho phép đồng bộ có thể không bao giờ mở mà bài kiểm tra vẫn xanh.
  Căn cứ: Hiện chưa thấy lệch thật và nếu lệch thì lượt đồng bộ bị chặn an toàn chứ không lộ hay mất dữ liệu; bổ sung bài kiểm tra sau này vẫn rẻ.
  file: `pipeline/sync-cloud.test.mjs`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 3 (đo «chuỗi có mặt» cho một lời hứa quan hệ): quét AC-3 'chỉ loadStgPosts đưa stg vào canonical' bằng đồng xuất hiện chuỗi trong cùng tệp**
  Người dùng thấy gì: Bài kiểm tra chặn đường nạp tin thử chỉ phát hiện được một số kiểu viết code, nên một đường ghi mới viết theo kiểu khác có thể lọt qua mà không bị báo đỏ.
  Căn cứ: Rủi ro chỉ xuất hiện khi có người thêm một đường ghi mới sau này, và dữ liệu thử lọt vào được phát hiện lại bằng phép đo dư lượng hằng đêm.
  file: `pipeline/lib/test-posts.mjs`
  severity: low
  Đề xuất: known-limits

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).
