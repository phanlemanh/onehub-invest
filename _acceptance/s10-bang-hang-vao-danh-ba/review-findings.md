## Trong hợp đồng

- **Đếm «trùng» S10 bị đếm hai lần khi nạp lại snapshot hoặc khi stock_id lặp nằm ở hai lô 500 khác nhau, nên dòng đối soát không khép**
  AC: AC-2
  file: `pipeline/import-airbnb.mjs:152`
  severity: medium
  source: conventions
  detail: s10TrungLan được cộng ở hai chỗ chồng nhau. (1) Vòng chính đếm stock_id lặp trong cùng item qua demTrongItem, cộng n-1 cho mỗi khoá. (2) napS10 đếm, theo từng lô, những dòng đã có sẵn trong stg_s10_stock (dangCo: SELECT ... WHERE snapshot_id=$1 AND stock_id = ANY). Hai trường hợp bị đếm đôi: (a) item có hơn 500 dòng và bản lặp nằm ở lô sau: lô trước đã ghi bản đầu, nên dangCo đếm thêm lần nữa một dòng mà demTrongItem đã tính. (b) Nạp lại cùng snapshot (airbnb_snapshots dùng ON CONFLICT DO UPDATE nên chuyện này có xảy ra): dangCo tính mọi dòng, kể cả bản lặp, rồi demTrongItem cộng thêm n-1. Hậu quả: phương trình đối soát in ra «bóc = stg + trùng + lệch khuôn + ...» bị dư đúng số dòng lặp trong item, trái với mục tiêu «tự khép» của 1211-27/1211-32. Itest S10-AC-2 chỉ đo trùng chéo 177↔178 trong một lượt nạp đầu, nên không bắt được hai ca này.
  rationale: AC-2 đòi tổng số dòng bóc bằng số ghi cộng số trùng; đếm đôi làm đẳng thức này sai khi có stock_id lặp trong cùng một item.

- **Bộ đếm «trùng» của S10 đếm đôi nên đẳng thức đối soát không khép**
  AC: AC-2
  file: `pipeline/import-airbnb.mjs:168`
  severity: low
  source: bugs
  detail: Dòng trùng được cộng vào s10TrungLan ở hai chỗ độc lập. (a) Dòng 353-355 cộng n-1 cho mỗi stock_id lặp trong cùng một item. (b) napS10 (dòng 165-168) chạy SELECT trước mỗi lô 500 dòng rồi cộng MỌI dòng của lô có stock_id đã nằm trong DB. Hai chỗ chồng lên nhau trong các trường hợp sau. (1) Hai dòng cùng stock_id trong một item nhưng rơi vào hai lô khác nhau (cách nhau quá 500 dòng): lô 2 thấy dòng lô 1 vừa chèn nên cộng thêm 1, cộng với n-1 ở (a) thành 2 cho một dòng bỏ. (2) stock_id đã có từ item 177 và lặp lại trong item 178: (b) cộng cả n lần xuất hiện, (a) cộng thêm n-1. (3) Nạp lại cùng snapshot: (b) đã cộng toàn bộ dòng, (a) vẫn cộng phần lặp trong item. Hệ quả: dòng «S10 đối soát: bóc X → stg + trùng bỏ + …» in tổng lớn hơn số dòng bóc, nên bước so «đẳng thức tự khép» báo sai. Sửa bằng cách chỉ đếm ở một chỗ, ví dụ trùng = số dòng đưa vào INSERT trừ rowCount của mỗi lô.
  rationale: Cùng lỗi đếm đôi với mục trên; làm sai điều kiện «tổng bóc = số ghi + số trùng» của AC-2.

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **DATA-CONTRACT ghi v10 «bên import chưa nhận» nhưng cả hai importer giờ nhận schemaVersion 10**
  Người dùng thấy gì: Tài liệu hợp đồng dữ liệu có hai dòng nói trái nhau về việc phiên bản 10 đã được nhận hay chưa. Dữ liệu không bị sai, chỉ người đọc tài liệu có thể bối rối.
  Căn cứ: Chỉ là chữ trong tài liệu, không làm mất hay sai dữ liệu nào và sửa lại rất rẻ ở lượt cập nhật tài liệu sau.
  file: `collector/docs/DATA-CONTRACT.md`
  severity: low
  Đề xuất: known-limits

- **View s10_quy_can_du_an không nhận ra bảng hàng rỗng ở snapshot mới nhất, sản phẩm đã rút vẫn hiện con_trong_bang = true**
  Người dùng thấy gì: Khi chủ đầu tư gỡ hết bảng hàng của một dự án, quỹ căn cũ vẫn hiện như còn bán. Hiện chưa có người dùng nào đọc view này vì chưa lên cổng.
  Căn cứ: Ca hiếm, dữ liệu chỉ dùng nội bộ chưa lên cổng, và sửa được ở vòng sau trước khi có bên đọc thật.
  file: `db/migrations/089_s10_bang_hang.sql`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 2 — fixture viết tay đúng khuôn bên đọc: hai test stg_s10_project tự dựng bảng «mô phỏng 089» thay vì áp chính tệp 089**
  Người dùng thấy gì: Hai bài kiểm tra phụ chạy trên bảng tự dựng chứ không phải bảng thật, nên chúng có thể báo xanh dù bảng thật khác. Người dùng không thấy ảnh hưởng trực tiếp.
  Căn cứ: Chỉ làm giảm độ tin cậy của bài kiểm tra phụ, không làm sai dữ liệu; các bài kiểm tra chính đã áp bảng thật.
  file: `pipeline/tests/s10-project-nap.itest.mjs`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 2 — manifest snapshot viết tay đúng khuôn readSnapshot thay vì rút từ SnapshotWriter**
  Người dùng thấy gì: Bài kiểm tra dùng tệp thu giả tự viết, nên nếu bên thu đổi khuôn tệp thì bài kiểm tra vẫn xanh. Không ảnh hưởng dữ liệu hiện tại.
  Căn cứ: Rủi ro chỉ hiện khi bên thu đổi khuôn và việc đó có kiểm riêng; sửa rẻ nhưng không cấp bách.
  file: `pipeline/scripts/s10-bang-hang.test.mjs`
  severity: low
  Đề xuất: known-limits

- **Hình dạng 4 — S10-10 khẳng định «v9 được nạp» chỉ bằng exit 0 và một doesNotMatch, không có đối chứng dương rằng dòng đã vào**
  Người dùng thấy gì: Một bài kiểm tra có thể báo xanh dù dữ liệu phiên bản 9 thực ra chưa được nạp. Người dùng không bị ảnh hưởng trực tiếp.
  Căn cứ: Chỉ làm bài kiểm tra lỏng hơn mong muốn, không làm mất hay sai dữ liệu, và có thể siết lại bất kỳ lúc nào.
  file: `pipeline/scripts/s10-bang-hang.test.mjs`
  severity: low
  Đề xuất: known-limits

## Chưa adversarial-verify (refuter chết)

⚠ Cụm ngoài vùng phủ: 4/7 lỗi rơi vào file không bộ đo nào phủ (collector/docs/DATA-CONTRACT.md, pipeline/tests/s10-project-nap.itest.mjs, pipeline/scripts/s10-bang-hang.test.mjs) — dừng và quyết: mở rộng hợp đồng hay rút phạm vi.
