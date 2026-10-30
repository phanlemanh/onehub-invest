# Review findings: bang-yeu-cau (round 1)

## Trong hợp đồng

Không có finding nào map được vào AC.

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **docNganSach có thể trả min > max, đụng CHECK budget của 058 và làm rollback cả lượt transform S03 (kể cả offer)**
  Người dùng thấy gì: Chỉ cần một bài rao nhu cầu có hai mức giá ngược chiều (ví dụ «từ 3 tỷ, tối đa 2 tỷ») là cả lượt xử lý dữ liệu Zalo đêm đó bị huỷ, kể cả các tin rao bán vốn không liên quan. Đêm sau gặp lại đúng bài đó thì lại hỏng tiếp cho tới khi bài biến mất.
  Căn cứ: Hậu quả nặng vì mất cả lượt cập nhật và lặp lại mỗi đêm, người dùng không tự gỡ được; nhưng chưa có gì phát hành lên máy thu thật, lỗi chỉ lộ khi gặp bài có hai mức giá ngược chiều, và sửa lúc này rẻ hơn nhiều so với sau khi triển khai.
  file: `pipeline/lib/yeu-cau.mjs`
  severity: high
  Đề xuất: new-contract

- **CHECK property_type của 058 vẫn nhận 'unknown', trái với chú thích cột và sổ mappings.yaml («không ghi unknown»)**
  Người dùng thấy gì: Cơ sở dữ liệu vẫn cho phép ghi loại hình «chưa rõ» dù tài liệu nói để trống. Hiện không có đường ghi nào làm vậy nên người dùng chưa thấy ảnh hưởng.
  Căn cứ: Chỉ lệch giữa tài liệu và ràng buộc, chưa gây sai số liệu nào; nếu sau này có nguồn ghi mới thì mới cần siết, và khi đó sửa vẫn rẻ.
  file: `db/migrations/058_inquiry_records.sql`
  severity: low
  Đề xuất: known-limits

- **A min budget above the max violates CHECK inquiry_records_budget_chk and fails the whole S03 transform**
  Người dùng thấy gì: Một bài rao nhu cầu có mức giá sàn lớn hơn mức trần sẽ làm hỏng cả lượt xử lý dữ liệu Zalo đêm đó, kể cả tin rao bán, và lỗi lặp lại mỗi đêm cho tới khi bài biến mất.
  Căn cứ: Mất cả lượt cập nhật và người dùng không tự gỡ được; bài viết giá ngược chiều là thật nên sớm muộn sẽ gặp, và sửa trước khi triển khai lên máy thu thì rẻ.
  file: `pipeline/lib/yeu-cau.mjs`
  severity: high
  Đề xuất: new-contract

- **Budget parsing drops the decimal part ('2 tỷ 500', '2ty5', '3tr5', '2 tỷ rưỡi') and silently understates the budget**
  Người dùng thấy gì: Ngân sách viết kiểu «2 tỷ 500» hay «3tr5» bị đọc thấp hơn thực tế khoảng 15–25%, nên số cầu và việc so khớp với tin rao sẽ lệch mà không có cảnh báo.
  Căn cứ: Không mất dữ liệu gốc và có thể đọc lại sau khi sửa, nhưng kiểu viết này rất phổ biến nên số liệu nhu cầu sai thường xuyên; chưa có trang nào dùng số này nên chưa gây hại cho khách.
  file: `pipeline/lib/yeu-cau.mjs`
  severity: medium
  Đề xuất: new-contract

- **A range whose low end has no unit ('800-1,2 tỷ') takes the high end's unit and gives a wrong budget**
  Người dùng thấy gì: Khoảng giá viết thiếu đơn vị ở đầu dưới («800-1,2 tỷ») bị đọc sai thành «từ 1,2 tỷ trở lên», đảo ngược ý người tìm. Chỉ ảnh hưởng những bài viết kiểu này.
  Căn cứ: Số bài viết theo cách này ít và kết quả sai chỉ nằm ở một dòng nhu cầu, tái xử lý được sau khi sửa; chưa hiển thị cho ai nên có thể ghi nhận là hạn chế đã biết.
  file: `pipeline/lib/yeu-cau.mjs`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 4 (âm tính một mình): YC-AC-1 «058 không ghi dòng nào» chụp số dòng gốc SAU lần áp thứ nhất**
  Người dùng thấy gì: Phép kiểm «migration không tự ghi dữ liệu» chưa bắt được trường hợp lần áp đầu tiên đã ghi dữ liệu. Người dùng không thấy ảnh hưởng, đây chỉ là độ tin cậy của bài kiểm.
  Căn cứ: Không ảnh hưởng dữ liệu hay người dùng; migration hiện tại đọc qua không ghi dòng nào, và rủi ro chỉ xuất hiện nếu ai đó sửa migration sau này, nên không đáng mở việc riêng.
  file: `pipeline/scripts/yeu-cau.itest.mjs`
  severity: medium
  Đề xuất: wont-fix

- **Hình dạng 5 (tuyên cả lớp, chỉ đo điểm): KP-AC-5 tuyên tập offer S03 không đổi khi xoá trắng Kev, nhưng chỉ xoá trắng 5 bài fixture**
  Người dùng thấy gì: Bài kiểm xác nhận «điểm Kev không làm mất tin rao nào» chỉ thực sự đổi điều kiện ở vài bài thử, nên độ chắc hơi yếu hơn lời hứa. Người dùng không thấy ảnh hưởng.
  Căn cứ: Thuộc tính năng khác đã xong, không gây mất hay sai dữ liệu, chỉ là bài kiểm chưa đủ chặt; sửa không mang lại lợi ích tương xứng ở đợt này.
  file: `pipeline/scripts/kev-phat-bieu.itest.mjs`
  severity: low
  Đề xuất: wont-fix

- **Hình dạng 4 (âm tính một mình): YC-AC-5 hứa «bài không người gửi lẫn SĐT → mỗi bài một Yêu cầu» nhưng fixture DB chỉ có MỘT bài như vậy**
  Người dùng thấy gì: Bài kiểm trên cơ sở dữ liệu chưa thử trường hợp hai bài vô danh cùng nội dung, nên nếu sau này ai đó gộp nhầm các bài vô danh thì bài kiểm này không bắt được. Hiện hành vi đúng.
  Căn cứ: Hành vi hiện tại đúng và đã có bài kiểm ở tầng khác phủ ý này; rủi ro chỉ là bỏ sót khi sửa code sau này, và bổ sung thêm bài thử rất rẻ nếu cần.
  file: `pipeline/scripts/yeu-cau.itest.mjs`
  severity: low
  Đề xuất: known-limits

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).
