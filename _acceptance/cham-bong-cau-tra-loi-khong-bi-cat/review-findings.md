## Trong hợp đồng

Không có finding nào.

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **Probe E7 (tran-30.mjs) chép lại công thức ước chi thay vì gọi uocDau của bộ chạy**
  Người dùng thấy gì: Phép đo mức chi cao nhất của 30 thẻ dùng một bản công thức chép riêng. Nếu sau này công thức thật đổi mà bản chép không đổi theo, con số báo vẫn xanh nhưng có thể không còn đúng với số tiền lượt chạy thật tính.
  Căn cứ: Hiện hai công thức đang khớp nên chưa ai thấy số sai, và chỉ lệch khi có người sửa công thức sau này; sửa rẻ nhưng không gấp.
  file: `_acceptance/cham-bong-cau-tra-loi-khong-bi-cat/probes/tran-30.mjs`
  severity: medium
  Đề xuất: known-limits

- **khoa-trung.mjs không kiểm model của lượt cũ có còn trong cấu hình, nên ném TypeError thay vì báo ĐỎ rõ ràng**
  Người dùng thấy gì: Nếu lượt thử trước dùng một model nay đã bị gỡ khỏi cấu hình, phép kiểm dùng lại kết quả sẽ báo lỗi khó đọc thay vì nói rõ thẻ nào thiếu. Kết quả vẫn là đỏ, chỉ thiếu lời giải thích.
  Căn cứ: Hậu quả nhẹ vì phép kiểm vẫn báo đỏ, người chạy chỉ mất thêm chút công đoán nguyên nhân và có thể chạy lại ngay.
  file: `_acceptance/cham-bong-cau-tra-loi-khong-bi-cat/probes/khoa-trung.mjs`
  severity: low
  Đề xuất: wont-fix

- **Dòng DỪNG VÌ TRẦN khẳng định thẻ thiếu là do trần, kể cả khi lượt có lời gọi lỗi**
  Người dùng thấy gì: Khi một lượt vừa có lời gọi lỗi vừa dừng vì chạm trần tiền, báo cáo vẫn nói thẻ thiếu hoàn toàn là do trần, không phải lỗi đọc. Người đọc có thể hiểu sai nguyên nhân một phần thẻ thiếu, dù dòng đếm lỗi ngay bên dưới cho thấy số lỗi thật.
  Căn cứ: Chỉ làm người đọc báo cáo hiểu sai nguyên nhân trong ca hiếm có cả lỗi lẫn dừng vì trần, không mất dữ liệu hay tiền, và số lỗi vẫn hiện ngay dưới.
  file: `agent/src/enrich/cham-bong/bao-cao.ts`
  severity: low
  Đề xuất: known-limits

- **Probe khoa-trung xếp thẻ đổi chữ vào «THIẾU» (đỏ), không in riêng như evals E8 ghi**
  Người dùng thấy gì: Nếu dữ liệu thẻ đổi giữa lượt thử đầu và lúc kiểm, phép kiểm dùng lại kết quả có thể báo đỏ giả dù cách tính khoá vẫn đúng. Người chạy phải tự phân biệt đỏ thật với đỏ do dữ liệu đổi.
  Căn cứ: Chỉ gây đỏ giả khi dữ liệu thẻ thật sự đổi, người chạy tự nhận ra và chạy lại được, không ảnh hưởng dữ liệu hay tiền.
  file: `_acceptance/cham-bong-cau-tra-loi-khong-bi-cat/probes/khoa-trung.mjs`
  severity: low
  Đề xuất: known-limits

- **Hình dạng 2 (fixture viết tay đúng khuôn bên đọc): lớp gọi giả bỏ qua LOP_THAT, bộ nối SDK thật nên trần truyền vào SDK không được đo**
  Người dùng thấy gì: Các bài kiểm tự động chưa kiểm đoạn cuối nơi mức giới hạn câu trả lời được trao cho nhà cung cấp model. Nếu đoạn đó bị lỗi, bài kiểm vẫn xanh và câu trả lời vẫn có thể bị cắt như lượt thử trước.
  Căn cứ: Lỗi nếu có sẽ lộ ngay ở lượt thử thật kế tiếp qua số lời gọi bị cắt, nên hậu quả nhẹ và tự thấy được, nhưng mất một lượt tốn tiền.
  file: `agent/tests/cham-bong-cau-tra-loi-khong-bi-cat.test.ts`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 3 (assert «chuỗi có mặt» khi lời hứa là quan hệ giữa các giá trị): dòng DỪNG VÌ TRẦN chỉ ghim số thẻ, chưa ghim trần và tiền đã chi**
  Người dùng thấy gì: Bài kiểm dòng báo cáo dừng vì trần chưa chắc rằng số trần và số tiền đã chi in ra đúng giá trị. Nếu báo cáo in nhầm số, người đọc có thể thấy con số tiền sai mà bài kiểm vẫn xanh.
  Căn cứ: Chỉ ảnh hưởng độ tin của một dòng báo cáo nội bộ, không mất dữ liệu, và số tiền thật vẫn có ở tệp tổng kết để đối chiếu.
  file: `agent/tests/cham-bong-cau-tra-loi-khong-bi-cat.test.ts`
  severity: low
  Đề xuất: known-limits

## Chưa adversarial-verify (refuter chết)

⚠ Cụm ngoài vùng phủ: 3/6 lỗi rơi vào file không bộ đo nào phủ (_acceptance/cham-bong-cau-tra-loi-khong-bi-cat/probes/tran-30.mjs, _acceptance/cham-bong-cau-tra-loi-khong-bi-cat/probes/khoa-trung.mjs) — dừng và quyết: mở rộng hợp đồng hay rút phạm vi.
