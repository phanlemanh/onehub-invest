# Review findings: street-raw-khong-mang-ten-nguon (round 2)

## Trong hợp đồng

(không có)

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **Phát biểu tên nguồn giờ được đọc trước writeAssertions(replaceOwn), nên log «rút K chủ thể» đếm cả phát biểu bị rút bằng lý do khác hoặc chưa hề bị rút**
  Người dùng thấy gì: Dòng báo cáo sau mỗi lượt có thể ghi số ô đã rút nhiều hơn thực tế trong vài trường hợp hiếm. Dữ liệu và kết quả trên cổng vẫn đúng, chỉ con số trong báo cáo vận hành có thể lệch nhẹ.
  Căn cứ: Hậu quả nhẹ, chỉ lệch một con số trong nhật ký, không mất hay lộ dữ liệu, người vận hành tự đối chiếu được và sửa sau cũng rẻ.
  file: `pipeline/transform-chotot.mjs`
  severity: low
  Đề xuất: known-limits

- **AC-3 đo chi phí luật bằng một lượt đếm của chính phép đo, trong khi transform gọi bộ dò hai lần cho mỗi giá trị**
  Người dùng thấy gì: Con số chi phí của luật được báo thấp hơn có thể là chi phí thật, vì luật được gọi hai lần mỗi tin. Với biên độ hiện tại (dưới 1 phần trăm) vẫn còn xa mức giới hạn nên người dùng không bị chậm đáng kể.
  Căn cứ: Dù thấp hơn thực tế khoảng gấp đôi vẫn còn rất xa ngưỡng 5 phần trăm, người dùng không thấy chậm và chỉ ghi chú lại là đủ.
  file: `_acceptance/street-raw-khong-mang-ten-nguon/probes/ban-chep.mjs`
  severity: low
  Đề xuất: known-limits

- **Trần 50 đếm trên toàn bộ stg mỗi lượt nên thành trần cộng dồn: vượt một lần là transform S06 chết mọi đêm**
  Người dùng thấy gì: Nếu theo thời gian tích đủ hơn 50 ô mang tên nguồn trong kho, việc xử lý tin chợ S06 sẽ dừng mọi đêm. Khi đó tin mới không vào hệ thống và số trên cổng đứng yên cho tới khi có người sửa.
  Căn cứ: Hậu quả nặng nhưng chưa xảy ra (hiện chỉ có 1 ô trên 50), không mất dữ liệu và có người canh thấy được lỗi; nên mở việc riêng để sửa trước khi tiến gần ngưỡng.
  file: `pipeline/transform-chotot.mjs`
  severity: medium
  Đề xuất: new-contract

- **Hình dạng 1 (đo vật thay thế, không đo đầu ra): E3/AC-3 bấm giờ phép đếm của chính probe, không bấm giờ luật PL39 trong transform**
  Người dùng thấy gì: Cam kết luật không làm chậm quá 5 phần trăm được kiểm bằng ước lượng gần đúng, chưa phải đo trực tiếp bên trong lượt xử lý. Người dùng không thấy khác biệt, chỉ độ chắc chắn của con số thấp hơn.
  Căn cứ: Chỉ ảnh hưởng độ tin cậy của một con số đo, không ảnh hưởng dữ liệu hay người dùng; các lượt đo cho thấy chi phí dưới 1 phần trăm nên có thể ghi giới hạn và đo lại sau.
  file: `_acceptance/street-raw-khong-mang-ten-nguon/probes/ban-chep.mjs`
  severity: high
  Đề xuất: known-limits

- **Hình dạng 4 (âm tính một mình): «ca tái diễn» cho tin C không có lượt đối chứng không luật**
  Người dùng thấy gì: Bài kiểm chưa chứng minh được rằng nếu bỏ luật thì lỗi cũ sẽ tái diễn, nên độ chắc của bài kiểm này yếu hơn mong muốn. Bản thân luật vẫn chạy đúng trong lần kiểm.
  Căn cứ: Chỉ làm bài kiểm kém sắc hơn, không ảnh hưởng dữ liệu hay người dùng, và bổ sung đối chứng sau cũng rẻ.
  file: `_acceptance/street-raw-khong-mang-ten-nguon/probes/ban-chep.mjs`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 4 (âm tính một mình): «tin mới N về NULL» không có đối chứng dương**
  Người dùng thấy gì: Bài kiểm xanh cho tin mới có thể xanh vì lý do khác chứ không hẳn nhờ luật. Người dùng không bị ảnh hưởng, chỉ độ tin vào bài kiểm này giảm.
  Căn cứ: Hậu quả chỉ nằm ở độ chặt của bài kiểm, không làm mất hay lộ dữ liệu, và có thể bổ sung đối chứng sau với chi phí thấp.
  file: `_acceptance/street-raw-khong-mang-ten-nguon/probes/ban-chep.mjs`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 3 (assert có mặt thay cho quan hệ): «đếm độc lập gồm các ô cấy» chỉ so ngưỡng số đếm**
  Người dùng thấy gì: Bài kiểm có thể bỏ sót trường hợp một ô cấy cụ thể không được đếm mà vẫn báo xanh. Người dùng không thấy ảnh hưởng, chỉ độ chặt của bài kiểm bị giảm.
  Căn cứ: Rủi ro thấp, chỉ làm bài kiểm lỏng hơn, không có dữ liệu bị mất hay lộ và có thể siết lại sau với chi phí nhỏ.
  file: `_acceptance/street-raw-khong-mang-ten-nguon/probes/ban-chep.mjs`
  severity: low
  Đề xuất: known-limits

- **Test mới pipeline/tests/street-raw-ten-nguon.test.mjs không nằm trong npm test, test:a/test:b hay executors của config, nên CI không bao giờ chạy (r1 · tệp đã đổi)**
  Người dùng thấy gì: Luật chặn tên nguồn thật lọt ra cổng công khai chỉ được kiểm khi có người chạy tay. Nếu sau này ai đó sửa nhầm, hệ thống tự động có thể không báo.
  Căn cứ: Hiện luật đang đúng và đã có phép đo tay, nên chưa mất dữ liệu; rủi ro chỉ xuất hiện khi có người sửa sau này và việc đăng ký test sau này rẻ.
  file: `pipeline/tests/street-raw-ten-nguon.test.mjs`
  severity: medium
  Đề xuất: known-limits

- **Phép đo ghi bản đột biến của transform vào thư mục mã nguồn pipeline/, tệp không bị gitignore (r1 · tệp đã đổi)**
  Người dùng thấy gì: Nếu phép đo bị giết giữa chừng, một bản mã đã tắt rào chặn tên nguồn có thể còn sót trong thư mục làm việc và bị commit nhầm.
  Căn cứ: Chỉ xảy ra khi phép đo chết giữa chừng và có người commit rộng tay; hậu quả nhỏ, phát hiện được ở bước xem thay đổi, tự xoá được.
  file: `_acceptance/street-raw-khong-mang-ten-nguon/probes/ban-chep.mjs`
  severity: low
  Đề xuất: wont-fix

⚠ Cụm ngoài vùng phủ: 5/7 lỗi rơi vào file không bộ đo nào phủ (_acceptance/street-raw-khong-mang-ten-nguon/probes/ban-chep.mjs) — dừng và quyết: mở rộng hợp đồng hay rút phạm vi.

