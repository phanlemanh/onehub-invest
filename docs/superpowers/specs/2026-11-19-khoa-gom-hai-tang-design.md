# GT5 `khoa-gom-hai-tang` — Gom bài S03 thành tin theo hai tầng

Hàng GT5 của lộ trình, mốc MS4 «Một căn là một dòng». Cổng Đáng: Mạnh «Làm cả năm» (18/11 23:13Z). Hạng T3: thành phần tin và
`offer_id` đổi. Quyết định nền: ROADMAP §3 mục 41 (Q1 hai môi giới cùng căn là hai tin; Q2 đổi giá là GT6; Q3 rổ, quảng cáo là GT8;
Q4 model không vào khoá gom). Bảng phủ ca: `_acceptance/khoa-gom-hai-tang/discovery/bang-phu-ca.md`.

## 1. Vấn đề

Bộ đọc S03 gom bài thành tin bằng một khoá phẳng (`repostKey`, `pipeline/transform-zalo.mjs`): loại, phường, giá, diện tích, số phòng;
thiếu phường hoặc diện tích thì thêm mã toà, căn và người đăng. Audit 09–10/11 đo trong tin có nhiều bản chữ: gộp nhầm khác căn 25%
[17–35%]. Nguyên nhân chính: khoá không có phân khu, bộ tìm mã chỉ nhận chữ hoa và 1–2 chữ số (bỏ «s1006», «S203»).

Đo 19/11 trên 7.307 tin S03 đang sống: 1.393 tin có từ hai bản chữ; 234 tin có dấu hiệu khác căn (79 khác mã chỉ bộ tìm mới thấy,
160 khác phân khu viết tắt, 12 khác phân khu theo tên danh bạ); 2.590 tin đi nhánh đủ phường và diện tích, nhánh này không có người
đăng trong khoá, trái Q1.

## 2. Thiết kế

**Công tắc, mặc định tắt.** Một dòng `ops_audit` action `gom-tin:hai-tang`, dòng mới nhất có `detail.bat = true` thì dùng khoá mới, như
công tắc `danh-ba:gop-sdt` có sẵn. Tắt: khoá cũ, thành phần tin không đổi. Không thêm bảng.

**Tầng một — bản chữ.** Bài cùng người đăng và cùng chữ chuẩn hoá (`normText` sau khi gạt SĐT, URL) là một bản chữ. Người đăng là
`sender_id`, không có thì SĐT trong bài. Bài không có cả hai đứng riêng thành một bản chữ, không gộp với bài của người khác.

**Tầng hai — bản chữ thành tin.** Hai bản chữ chung tin khi khớp **người · loại · giá · số phòng · diện tích · tập phân khu · tập mã**.
Giá giữ trong khoá tới GT6. Người luôn có trong khoá ở mọi nhánh (sửa nhánh đủ phường và diện tích, theo Q1).

- **Bản chữ thiếu trường** (số phòng, diện tích, phân khu hay mã) chỉ nhập vào một tin khi trong cửa sổ 7 ngày có **đúng một** tin ứng
  viên cùng người khớp mọi trường bản chữ đó có, và chữ giống từ 0,9. Không có hay có nhiều ứng viên thì bản chữ thành tin riêng.
- **Không bắc cầu:** bản chữ thiếu trường chỉ nhập vào tin đầy đủ, không làm hai tin đầy đủ chung một tin.
- **Tập phân khu** đọc từ chữ bài: tên, bí danh của nút con dự án trong danh bạ (`asset_nodes`) và bảng viết tắt khai ở Cổng Phạm vi.
  Hai tập khác nhau, cả hai không rỗng, thì không bao giờ chung tin.
- **Bộ tìm mã mới** nhận chữ thường, mã toà 1–3 chữ cái và 1–4 chữ số (kèm đuôi căn `.03`, `-1203`, `xx13`), và mã tin của môi giới 2–4
  chữ cái và 4–6 chữ số. Loại nhiễu theo danh sách khai: `t<số>` (mốc tháng), đơn vị (`m2`, `pn`, `wc`), `coc`, `ocp`, `gd`, `x<số>`.

**`offer_id`.** Giữ khoá dính PL14 (`assignStickyIds`): tin mới thừa kế `offer_id` của tin cũ có nhiều bài chung nhất. Tin cũ bị tách thì
phần chung nhiều bài nhất giữ id cũ, phần còn lại nhận id mới; tin cũ không còn bài nào thì nghỉ với `superseded_by` trỏ tin nhận
nhiều bài nhất. Mọi `offer_id` cũ vì vậy có đường nối sang tin mới. Lượt bật công tắc xuất bảng đổi theo bài
(`post_id → offer_id cũ → offer_id mới`), dùng để đổi tệp đóng băng và lát nhãn `hai-khu-ghep-b` của PL20.

**Luật 7.** Model không vào khoá. GT4 (Haiku gom mù hằng tuần) là thước bên ngoài, không đọc ở đây.

**Thứ tự với hàng khác.** GT8 gắn nhãn dạng bài trước bước gom; GT5 chỉ gom bài một căn (`dangBai` vắng hay `mot_can`). PL20 chấm xong
và đo AC-8 rồi mới bật công tắc trên máy thu. GT6 đứng trên GT5.

## 3. Đo chất lượng

- **Thước nền:** 120 nhãn audit 09–10/11 (80 tin nhiều bản chữ, 40 cặp nghi tách nhầm), còn đối chiếu được đủ trên máy thu
  (`research-local/s03-gom-tin-audit-20261109/`). Đo trước, sau: gộp nhầm ở tin nhiều bản chữ, tách nhầm, kèm cận Wilson.
- **Mẫu giữ riêng:** danh sách viết tắt và loại nhiễu được chọn sau khi đọc mẫu 80 tin, nên số đo trên mẫu ấy có thể lạc quan. Cần
  một mẫu bản chữ mới (tin nhiều bản chữ từ 12/11) có nhãn, chưa ai dùng để chỉnh luật (Hỏi-2).
- **Ngưỡng của hàng:** gộp nhầm ở tin nhiều bản chữ dưới 5%, tách nhầm không tăng, hai bản chữ khác phân khu không bao giờ chung tin,
  mọi `offer_id` cũ có đường nối.

Đo thử dấu hiệu tách trên 80 tin (chưa phải khoá thật): bắt 15/20 tin khác căn, 0/34 tin cùng căn bị tách nhầm. Năm tin sót: hai tin khác
nội thất hay giá nhỏ, một tin mã nội bộ 5 chữ số, một tin tên toà viết tắt khác nhau, một tin lẫn bài tìm (GT8 lo).

## 4. Câu chỉ người quyết (lên thẻ Cổng Phạm vi)

- **Hỏi-1 — Bảng viết tắt phân khu ở đâu.** Khuyến nghị: thêm bí danh vào danh bạ (dãy danh bạ), GT5 chỉ đọc danh bạ. Lối khác: bảng
  trong mã GT5, nhanh hơn nhưng là bản sự thật thứ hai của danh bạ.
- **Hỏi-2 — Thước giữ riêng.** Khuyến nghị: hai model lớn ngoài đường ống (Opus, Sonnet; Q4 cho phép) gom mù 200 bản chữ mới, lấy chỗ
  đồng thuận làm nhãn, trần khoảng 3 USD. Lối khác: người đọc tay 60 tin, không tốn tiền model nhưng tốn khoảng 3 giờ.
- **Hỏi-3 — Khác nội thất có tách không.** Khuyến nghị: không tách ở GT5, vì nội thất hay được viết lại giữa các lần đăng; ghi giới hạn.
- **Hỏi-4 — Cửa sổ 7 ngày và ngưỡng chữ giống 0,9** cho bản chữ thiếu trường: chốt trên thước nền.

## 5. Ngoài phạm vi

- Tách rổ hàng thành từng căn (PL18) và nhãn dạng bài (GT8).
- Đổi giá cùng căn thành một tin (GT6); hai môi giới cùng căn nối ở bậc Gắn căn (Q1).
- Màn xem tin gồm bài nào (GT7) và thước hằng tuần (GT4).
- Sửa danh bạ: GT5 chỉ đọc.

## 6. Áp lên máy thu

Gộp mã với công tắc tắt không đổi tin nào. Hồ sơ áp có đủ năm thứ: lệnh bật công tắc, số chạy thử trên bản sao (số tin trước và sau,
theo khu, phần chạm PL20), sao lưu `sale_offer_records` trước, cách lùi bằng tắt công tắc, lệnh kiểm sau. Chỉ bật sau khi PL20 chấm và
đo AC-8, sau GT8.
