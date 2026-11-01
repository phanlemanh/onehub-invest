## Trong hợp đồng

- **066 đổi hành vi cả với tin không chung bài đăng khi có tin nghỉ, trái AC-3 và trái lời «chỉ mở rộng tập căn»**
  AC: AC-3
  file: `db/migrations/066_can_theo_tin.sql:116`
  severity: medium
  source: conventions
  detail: So thân hàm 063 với 066: ngoài việc mở rộng tập căn, 066 còn đổi nguồn đọc từ view sống `sale_offers` (`retired_at IS NULL`) sang `sale_offer_records`, ở cascade áp (dòng 116) và ở cả ba NOT EXISTS của hoàn tác (dòng 185, 191, 197). Đổi này không phụ thuộc có tin chung hay không, nên có hai chỗ khác 063 với tin riêng. (a) Áp đề xuất của tin C đã nghỉ, không chung bài: 063 không cascade vì join view ra rỗng; 066 điền ô trống của căn PC. (b) Hoàn tác đề xuất của C khi căn PC có tin D đã nghỉ, không chung bài, mang cùng giá trị: 063 gỡ ô; 066 giữ. AC-3 hứa «mọi căn và cột của C bằng đúng kết quả của bản 063», còn tiêu đề mục 2 và 3 ghi «nguyên thân 063, chỉ mở rộng tập căn». CT-AC-3 (`pipeline/scripts/can-theo-tin.itest.mjs`, hàm `luotRieng`) chỉ dựng một tin C sống, không có tin nghỉ, nên không bắt được. AC-1/AC-2 chỉ duyệt tin nghỉ cho tin chung bài đăng, và quyết định d-…-8 chỉ nêu «tin chung đã nghỉ». DB oneinvest hiện có 0 tin nghỉ gắn căn và 0 đề xuất queued trên tin nghỉ, nên lỗi đang ẩn, không có dữ liệu sai hôm nay. Hướng xử lý: giới hạn đọc tin nghỉ ở tập tin chung chủ thể, hoặc người ký chấp nhận và sửa AC-3 cùng chú thích, kèm thêm ô tin nghỉ không chung bài vào CT-AC-3.

- **066 đổi kết quả của tin KHÔNG chung bài đăng khi có tin đã nghỉ, trái AC-3; CT-AC-3 không phủ ca này**
  AC: AC-3
  file: `db/migrations/066_can_theo_tin.sql:116`
  severity: medium
  source: bugs
  detail: AC-3 đòi tin không chung bài đăng cho kết quả căn đúng bằng bản 063. Bản 063 đọc view `sale_offers` (retired_at IS NULL). Bản 066 đọc `sale_offer_records` ở cả nhánh áp (dòng 116) lẫn nhánh hoàn tác (dòng 185, 191, 197), và thay đổi này không giới hạn ở tin chung bài. Đã chạy so sánh 063/066 trong BEGIN…ROLLBACK trên DB thử oneinvest_p2_ct. K1: tin C riêng đã nghỉ, áp đề xuất bedrooms=3: 063 cho căn {bedrooms null, 0 dòng log}, 066 cho {bedrooms 3, 1 dòng log}. K2: tin C sống và tin X đã nghỉ mang 3 cùng căn, không chung bài, áp rồi hoàn tác đề xuất của C: 063 cho căn NULL, 066 giữ 3. CT-AC-3 (`luotRieng`, pipeline/scripts/can-theo-tin.itest.mjs:235) chỉ dựng một tin sống trên một căn nên không thấy lệch, ma trận trục C của hợp đồng cũng không có ô tin nghỉ. Cần chọn một trong hai: (a) chỉ dùng bản ghi tin đã nghỉ cho tin chung chủ thể, còn tin không chung bài giữ đúng 063; (b) sửa AC-3 thành ngoại lệ có chủ đích cho tin nghỉ, người duyệt ở cổng, và thêm ô K1/K2 vào itest.

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **Gate 1 đã đóng dấu trong khi thẻ còn cờ đỏ «CHƯA vào được Cổng Phạm vi: chưa tra tri thức»; sổ vẫn thiếu dòng tra**
  Người dùng thấy gì: Hồ sơ đã qua cổng đầu mà bước tra tri thức chưa được ghi lại, nên người ký không thấy bằng chứng đã tra. Người dùng cuối không bị ảnh hưởng.
  Căn cứ: Chỉ là thiếu dấu vết thủ tục, không làm sai dữ liệu hay tính năng, và có thể bổ sung ghi chú bất cứ lúc nào.
  file: `_acceptance/can-theo-tin-khi-phan-xu-lai/card.html`
  severity: medium
  Đề xuất: known-limits

- **E5 expected trong evals.yaml vẫn đòi oneinvest = 0 và ghi sai cách dựng DB, lệch răng thật**
  Người dùng thấy gì: Mô tả bài kiểm trong hồ sơ nói khác với cách đo thật, có thể làm người đọc hiểu nhầm sau khi migration được áp lên máy thu. Người dùng cuối không thấy gì.
  Căn cứ: Chỉ sai lời mô tả, không đổi kết quả kiểm, và Mạnh đã chốt giữ nguyên vòng này.
  file: `_acceptance/can-theo-tin-khi-phan-xu-lai/evals.yaml`
  severity: low
  Đề xuất: known-limits

- **Răng E5 làm mất kết quả đỏ của vế (1) khi vế (2) không dựng được bản chép**
  Người dùng thấy gì: Nếu bài kiểm gặp sự cố hạ tầng đúng lúc có lỗi thật, lỗi thật có thể bị báo thành sự cố máy và phải chạy lại mới thấy. Người dùng cuối không bị ảnh hưởng.
  Căn cứ: Chỉ che tạm kết quả đỏ trong công cụ kiểm nội bộ; chạy lại là thấy, và sửa sau rẻ.
  file: `_acceptance/can-theo-tin-khi-phan-xu-lai/rang/ap-hai-lan.mjs`
  severity: medium
  Đề xuất: known-limits

- **Migration lỗi thật trong chuỗi dựng bị răng E5 xếp thành lỗi hạ tầng (exit 2)**
  Người dùng thấy gì: Nếu migration hỏng khi dựng từ đầu, bài kiểm sẽ báo là sự cố máy thay vì lỗi thật, dễ làm người đọc bỏ qua. Người dùng cuối không thấy.
  Căn cứ: Lỗi vẫn được in trong log nên không mất thông tin, chỉ nhãn sai; sửa sau rẻ.
  file: `_acceptance/can-theo-tin-khi-phan-xu-lai/rang/ap-hai-lan.mjs`
  severity: low
  Đề xuất: known-limits

- **Hình dạng 5 (tuyên quét lớp nhưng chỉ có điểm-case): ma trận áp/hoàn tác chỉ đo trường bedrooms, trong khi 066 có ba nhánh cột**
  Người dùng thấy gì: Số phòng tắm và tên đường được cập nhật theo tin chung bài đăng nhưng chưa có bài kiểm riêng, nên nếu sai thì chưa ai biết trước. Hiện chưa thấy dữ liệu sai.
  Căn cứ: Chưa có bằng chứng sai, chỉ thiếu lưới an toàn; bổ sung bài kiểm về sau không làm mất dữ liệu.
  file: `pipeline/scripts/can-theo-tin.itest.mjs`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 4 (assertion âm-tính-một-mình): «DB oneinvest không bị chạm» chỉ so số dòng audit, không có đối chứng dương**
  Người dùng thấy gì: Bài kiểm chứng minh DB dùng chung không bị đổi còn yếu, nên nếu lỡ bị đổi thì có thể không báo. Chưa có dấu hiệu bị đổi.
  Căn cứ: Rủi ro chỉ là bỏ sót trong một tình huống hiếm, dữ liệu hiện tại không sai và việc áp lên máy thật còn qua duyệt riêng.
  file: `_acceptance/can-theo-tin-khi-phan-xu-lai/rang/ap-hai-lan.mjs`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 3 (assert chuỗi có mặt trong khi lời hứa là quan hệ): «là bản 066» được đo bằng /066/ khớp chú thích trong thân hàm**
  Người dùng thấy gì: Bài kiểm xác nhận đúng phiên bản chức năng bằng một dấu hiệu lỏng, nên bản sai nhưng còn giữ dấu hiệu vẫn qua. Người dùng cuối chưa gặp ảnh hưởng.
  Căn cứ: Chỉ làm bài kiểm kém chặt, không gây sai dữ liệu, và sửa sau rẻ.
  file: `_acceptance/can-theo-tin-khi-phan-xu-lai/rang/ap-hai-lan.mjs`
  severity: low
  Đề xuất: known-limits

- **Hình dạng 2 (fixture viết tay đúng khuôn bên đọc): GIEO dựng căn lệch bằng INSERT trực tiếp, không đi qua bộ ghi**
  Người dùng thấy gì: Dữ liệu thử được dựng tay nên chưa chứng minh trọn đường từ lúc ghi tin đến lúc sửa căn, nhưng đường này đã có bài kiểm khác phủ. Người dùng cuối không bị ảnh hưởng.
  Căn cứ: Đã có bài kiểm khác đi đúng đường thật, nên phần thiếu chỉ là lớp bảo đảm thêm; sửa sau không mất gì.
  file: `_acceptance/can-theo-tin-khi-phan-xu-lai/rang/ap-hai-lan.mjs`
  severity: low
  Đề xuất: known-limits

⚠ Cụm ngoài vùng phủ: 2/10 lỗi rơi vào file không bộ đo nào phủ (_acceptance/can-theo-tin-khi-phan-xu-lai/card.html, _acceptance/can-theo-tin-khi-phan-xu-lai/evals.yaml) — dừng và quyết: mở rộng hợp đồng hay rút phạm vi.

