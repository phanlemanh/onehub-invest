# Review findings: so-lenh-sua-sau-tv4 (round 2)

## Trong hợp đồng

(không có finding)

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **--ghi-cloud-env: khi ghi tệp lỗi sau INSERT, token đã có hiệu lực trên DB nhưng mất bản gốc, và tên máy bị chiếm**
  Người dùng thấy gì: Nếu máy chưa có thư mục lưu cấu hình hoặc không ghi được tệp, lệnh cấp token báo lỗi nhưng token đã được tạo mà không ai giữ bản gốc. Lần cấp lại bị từ chối cho đến khi người vận hành tự thu hồi token cũ.
  Căn cứ: Hậu quả nhẹ: không mất hay lộ dữ liệu, chỉ phải thu hồi rồi cấp lại bằng một lệnh, và chỉ xảy ra khi máy thu thiếu thư mục cấu hình lúc cấp token.
  file: `scripts/cap-token-may.mjs`
  severity: low
  Đề xuất: known-limits

- **Hình dạng 4 (phủ định đứng một mình, không ghim thông điệp): đối chứng đỏ của SS-AC-4 chỉ kiểm mã thoát khác 0, không kiểm nguyên nhân**
  Người dùng thấy gì: Một ca kiểm tự chứng minh có thể báo xanh dù nó hỏng vì lý do khác, nên độ tin cậy của phép đối chứng thấp hơn mong muốn. Người dùng cuối không gặp ảnh hưởng nào.
  Căn cứ: Không ảnh hưởng người dùng và không làm mất dữ liệu; chỉ làm một phép đối chứng phụ kém chặt, các ca kiểm chính vẫn bắt được lỗi thật.
  file: `pipeline/scripts/so-lenh.itest.mjs`
  severity: low
  Đề xuất: wont-fix

- **Chốt kiểm 'cloud.env đã có OPS_MACHINE_TOKEN' lỏng hơn cách ops-apply đọc token (r1)**
  Người dùng thấy gì: Nếu tệp cấu hình còn một dòng token cũ đã bị ghi chú, máy có thể cấp token mới nhưng bộ kéo lệnh vẫn đọc token cũ đã thu hồi và bị từ chối.
  Căn cứ: Chỉ xảy ra khi tệp cấu hình có sẵn dòng token cũ bị ghi chú, hiếm gặp, không mất dữ liệu và người vận hành tự dọn dòng cũ là chạy lại được.
  file: `scripts/cap-token-may.mjs`
  severity: low
  Đề xuất: known-limits

- **Token đã ghi lên cloud trước khi ghi tệp; ghi tệp hỏng thì tên bị khoá với một token không ai giữ (r1)**
  Người dùng thấy gì: Nếu ghi token vào tệp trên máy thất bại, cloud vẫn coi tên máy đó có token hợp lệ nhưng không ai giữ token, nên lần cấp lại bị từ chối cho tới khi thu hồi tay.
  Căn cứ: Hậu quả nhẹ: không lộ hay mất dữ liệu, chỉ kẹt việc cấp token và người vận hành tự gỡ bằng lệnh thu hồi rồi cấp lại.
  file: `scripts/cap-token-may.mjs`
  severity: low
  Đề xuất: known-limits

- **Nơi ghi cloud.env không theo OPS_APPLY_CONFIG_DIR mà ops-apply dùng để đọc (r1)**
  Người dùng thấy gì: Máy nào đặt thư mục cấu hình riêng thì token mới được ghi sang tệp khác với tệp bộ kéo lệnh đọc, nên kéo lệnh sẽ không thấy token.
  Căn cứ: Mặc định hoạt động đúng, chỉ ảnh hưởng máy cấu hình tuỳ biến, người vận hành tự chép token sang đúng tệp là xong.
  file: `scripts/cap-token-may.mjs`
  severity: low
  Đề xuất: known-limits

- **Token đã hiệu lực trên cloud nhưng ghi cloud.env thất bại thì mất token, không thu hồi, không báo rõ (r1)**
  Người dùng thấy gì: Khi ghi tệp thất bại, thông báo lỗi không cho biết cloud đã cấp token, nên người chạy không biết phải thu hồi trước khi thử lại.
  Căn cứ: Chỉ là thông báo thiếu rõ trong ca lỗi hiếm, không lộ token và không mất dữ liệu, người dùng thu hồi rồi cấp lại được.
  file: `scripts/cap-token-may.mjs`
  severity: low
  Đề xuất: known-limits

- **Phản hồi Management API không phải mảng bị coi là 0 dòng, báo sai «đang có token còn hiệu lực» (r1)**
  Người dùng thấy gì: Nếu dịch vụ cloud trả về dữ liệu bất thường, công cụ cấp token có thể báo nhầm là đang có token hiệu lực và bỏ token vừa cấp.
  Căn cứ: Chỉ xảy ra khi dịch vụ trả phản hồi lạ, hiếm; hậu quả là báo sai và phải thu hồi tay rồi cấp lại, không lộ hay mất dữ liệu.
  file: `scripts/cap-token-may.mjs`
  severity: low
  Đề xuất: known-limits

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).
