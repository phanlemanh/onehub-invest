# Review findings: cloud-sync-atomic (round 2)

## Trong hợp đồng

(không có finding nào map được vào AC)

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **Khoá YAML trùng: executors.script.sync_pii_mutation khai hai lần**
  Người dùng thấy gì: Tệp cấu hình nghiệm thu có một dòng khai trùng. Người dùng không thấy tác động nào, chỉ là bộ đọc chặt hơn sau này có thể báo lỗi.
  Căn cứ: Hai dòng giống hệt nhau nên không có hậu quả gì với người dùng hay dữ liệu, và nếu có vấp thì chỉ là báo lỗi cấu hình dễ thấy, dễ xoá.
  file: `_acceptance/config.yaml`
  severity: low
  Đề xuất: known-limits

- **Chú thích executor ghi sai: thước không chạy trên DB :5433**
  Người dùng thấy gì: Một dòng ghi chú trong cấu hình nghiệm thu mô tả sai nơi chạy thử. Người dùng cuối không bị ảnh hưởng, chỉ người đọc cấu hình có thể hiểu nhầm.
  Căn cứ: Chỉ là chú thích sai chữ, không làm mất hay lộ dữ liệu của ai, và không gây ra hành vi sai khi chạy.
  file: `_acceptance/config.yaml`
  severity: low
  Đề xuất: known-limits

- **Hình luồng sync đặt «Chặn tụt» SAU «Nạp staging», ngược với code**
  Người dùng thấy gì: Sơ đồ dùng để người ký duyệt vẽ bước chặn khi dữ liệu local tụt sai thứ tự so với thực tế. Thực tế an toàn hơn sơ đồ: lượt bị chặn không gửi dòng nào lên cloud.
  Căn cứ: Sai ở tài liệu chứ không ở hành vi, và hành vi thật còn tốt hơn hình vẽ, nên không gây mất dữ liệu; người ký chỉ có thể hiểu hơi lệch.
  file: `_acceptance/cloud-sync-atomic/figures/luong-sync.html`
  severity: low
  Đề xuất: known-limits

- **Pha tráo lỗi phía client thì cleanup() xoá staging ngay, trong khi giao dịch tráo có thể vẫn chạy trên server, nên prod có thể COMMIT bảng rỗng và areas/saved_markets bị xoá sạch**
  Người dùng thấy gì: Nếu đường truyền tới cloud đứt hoặc quá giờ đúng lúc đang thay dữ liệu, cloud có thể vẫn hoàn tất lượt thay với dữ liệu rỗng. Khi đó các khu vực và thị trường người dùng đã lưu có thể bị xoá sạch.
  Căn cứ: Hậu quả nặng (mất dữ liệu người dùng đã lưu, người dùng không tự khôi phục được) nhưng chỉ xảy ra khi lỗi mạng trúng khoảnh khắc hẹp, nên đáng mở việc riêng để sửa.
  file: `pipeline/sync-cloud.mjs`
  severity: medium
  Đề xuất: new-contract

- **Xoá dòng giữ-chỗ chạy theo insertOrder (cha trước con), và planTables không lo trường hợp bảng giữ-chỗ có cha là bảng thay-trọn: thêm một bảng giữ-chỗ thứ hai là mọi lượt tráo gãy**
  Người dùng thấy gì: Hiện chưa có ảnh hưởng nào với người dùng. Về sau, nếu cloud thêm một số bảng liên kết mới, việc đồng bộ có thể liên tục thất bại và dữ liệu cloud đứng yên ở bản cũ.
  Căn cứ: Chưa xảy ra ở schema hiện tại, và khi xảy ra thì lượt đồng bộ dừng an toàn nên dữ liệu không bị mất, chỉ bị cũ; ghi lại để lần thêm bảng sau cẩn thận.
  file: `pipeline/sync-cloud.mjs`
  severity: low
  Đề xuất: known-limits

- **Hình dạng 4 (assertion âm-tính-một-mình): E2(c) «không câu DDL nào được gửi» dựa vào một bộ dò chưa từng được chứng minh là bắt được DDL**
  Người dùng thấy gì: Phép kiểm xác nhận hệ thống không tự sửa cấu trúc cloud có thể bỏ sót một số kiểu câu lệnh. Hiện hệ thống vẫn làm đúng, chỉ là lưới an toàn chưa chặt.
  Căn cứ: Không có hại nào cho người dùng ở hiện trạng vì hành vi thật đã đúng và còn được các vế kiểm khác che; chỉ là phép kiểm có thể lỏng đi về sau, siết lại sau cũng không đắt.
  file: `pipeline/scripts/check-cloud-sync.mjs`
  severity: low
  Đề xuất: known-limits

⚠ Cụm ngoài vùng phủ: 3/6 lỗi rơi vào file không bộ đo nào phủ (_acceptance/config.yaml, _acceptance/cloud-sync-atomic/figures/luong-sync.html) — dừng và quyết: mở rộng hợp đồng hay rút phạm vi.
