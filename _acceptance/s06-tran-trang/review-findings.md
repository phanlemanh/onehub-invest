## Trong hợp đồng

(không có)

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **Đường dừng 403/429 bỏ qua --dry, vẫn ghi snapshot thật**
  Người dùng thấy gì: Chạy thử ở chế độ không ghi mà gặp lỗi chặn vẫn để lại một bản dữ liệu thu thật. Bản này không xoá được và lượt nạp sau có thể lấy nhầm nó.
  Căn cứ: Chỉ xảy ra khi chạy thử đúng lúc nguồn chặn, hiếm, nhưng bản dữ liệu thu ghi nhầm thì không xoá được; sửa sau vẫn rẻ vì là một điều kiện nhỏ.
  file: `pipeline/collect-chotot.mjs`
  severity: medium
  Đề xuất: known-limits

- **Snapshot dở dang khi bị chặn không ghi lỗi chặn vào manifest, trông như lượt sạch**
  Người dùng thấy gì: Khi bị chặn giữa chừng, bản dữ liệu thu dở dang trông như một lượt thu đầy đủ không lỗi. Các bước kiểm độ tươi và độ phủ có thể tin nhầm rằng vùng đó đã thu đủ.
  Căn cứ: Dữ liệu không mất nhưng số đo phủ có thể sai âm thầm, và việc dừng chỉ lộ qua mã thoát; sửa cần đổi hợp đồng dữ liệu nên nên làm thành việc riêng.
  file: `pipeline/collect-chotot.mjs`
  severity: medium
  Đề xuất: new-contract

- **Giá trị dự phòng khi số trang không hợp lệ vẫn là 25, lệch với mặc định mới 210**
  Người dùng thấy gì: Nếu cấu hình số trang bị đặt rỗng hoặc sai, lượt thu lặng lẽ quay về 25 trang và lại bỏ sót phần lớn tin như trước. Không có cảnh báo nào.
  Căn cứ: Chỉ xảy ra khi ai đó đặt cấu hình sai; không mất dữ liệu, thu lại được, và hiện lịch chạy không đặt biến này.
  file: `pipeline/collect-chotot.mjs`
  severity: low
  Đề xuất: known-limits

- **Snapshot dở dang khi bị 403/429 không ghi gì trong manifest là bị chặn, lại đếm failed thiếu**
  Người dùng thấy gì: Bản dữ liệu thu bị cắt giữa chừng vì bị chặn không mang dấu hiệu nào cho thấy dở dang, nên các bước sau coi như đủ và tươi.
  Căn cứ: Không mất dữ liệu nhưng phần bỏ sót bị che đi, làm số đo phủ sai âm thầm; cần sửa kèm đổi hợp đồng dữ liệu nên đáng làm việc riêng.
  file: `pipeline/collect-chotot.mjs`
  severity: medium
  Đề xuất: new-contract

- **Lúc bị chặn vẫn ghi snapshot dù đang chạy --dry**
  Người dùng thấy gì: Chạy thử không ghi mà gặp lỗi chặn vẫn tạo ra một bản dữ liệu thu thật không xoá được.
  Căn cứ: Hiếm xảy ra, chỉ khi chạy thử đúng lúc bị chặn, nhưng bản ghi nhầm là vĩnh viễn; sửa rẻ nên có thể xử lý cùng việc t1.
  file: `pipeline/collect-chotot.mjs`
  severity: low
  Đề xuất: known-limits

- **Giá trị trần sai vẫn rơi về 25, trái với mặc định mới 210**
  Người dùng thấy gì: Cấu hình số trang đặt sai làm lượt thu lặng lẽ quay về mức cũ 25 trang, bỏ sót nhiều tin mà không báo.
  Căn cứ: Chỉ xảy ra khi cấu hình sai, không mất dữ liệu và thu lại được; lịch chạy hiện tại không đặt biến này.
  file: `pipeline/collect-chotot.mjs`
  severity: low
  Đề xuất: known-limits

- **Hình dạng 5 (mới có ca điểm cho cả một lớp): ngưỡng 1% của AC-5 không được ghim, mọi ngưỡng từ 0,67% tới 33% đều xanh**
  Người dùng thấy gì: Ai đó đổi ngưỡng bỏ tin lạ từ 1% lên mức cao hơn thì phép thử vẫn xanh, nên con số 1% chưa được canh giữ chặt.
  Căn cứ: Hành vi hiện tại đúng, chỉ là rào kiểm chưa chặt; nếu ngưỡng bị đổi nhầm sau này thì chỉ lọt thêm tin lạ, và thêm ca thử gần ngưỡng sau này rất rẻ.
  file: `_acceptance/s06-tran-trang/probes/nap-thieu-region.test.mjs`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 2 (fixture viết tay theo đúng khuôn bên đọc): snapshot S06 của GT-AC-1 được vá tay theo luật mới của bộ nạp**
  Người dùng thấy gì: Dữ liệu mẫu của một bài test được viết tay nên có thể lệch dần so với dữ liệu thật do bộ thu ghi ra, và test không báo khi lệch.
  Căn cứ: Không ảnh hưởng người dùng, chỉ làm bài test kém nhạy; chi phí dựng lại fixture theo bộ ghi thật vượt xa hậu quả.
  file: `scripts/check-freshness.test.mjs`
  severity: low
  Đề xuất: wont-fix

- **Hình dạng 1 (đo mã nguồn thay vì đầu ra): ca «CA-ĐỎ tĩnh» của E2 chỉ grep chuỗi mã, nhưng vẫn được tính là một trong hai ca đạt**
  Người dùng thấy gì: Một ca thử chỉ kiểm có dòng chữ trong mã chứ không kiểm hành vi, nên có thể đỏ khi chỉ đổi cách viết dù chạy vẫn đúng.
  Căn cứ: Hành vi thật đã có ca động đo riêng nên người dùng không bị ảnh hưởng; sửa chỉ làm gọn bằng chứng.
  file: `pipeline/scripts/collect-chotot-chan.test.mjs`
  severity: low
  Đề xuất: wont-fix

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).
