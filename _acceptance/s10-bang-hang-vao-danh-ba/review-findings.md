# Review findings: s10-bang-hang-vao-danh-ba (round 2)

## Trong hợp đồng

- **Đếm trùng của dòng đối soát S10 bỏ sót stock_id lặp trong cùng một lô INSERT**
  AC: AC-2
  file: `pipeline/import-airbnb.mjs:338`
  severity: low
  source: bugs
  detail: `s10TrungLan` chỉ đếm stock_id đã có trong DB trước câu INSERT (SELECT ... WHERE snapshot_id = $1 AND stock_id = ANY). Nếu một item có hai tr.p_row cùng stock_id nằm trong cùng lô 500, `ON CONFLICT (snapshot_id, stock_id) DO NOTHING` âm thầm bỏ dòng thứ hai. Dòng này không vào `ghi` mà cũng không vào `s10TrungLan`. Khi đó đẳng thức in ra (bóc = stg + trùng + lệch khuôn + không stock_id + không project_id + thiếu bộ lọc) lệch đúng số dòng đó, mà không có cảnh báo hay assert nào. Cách sửa: đếm trùng bằng (số dòng của lô − rowCount) thay cho truy vấn dò trước.

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **Kiểm fail-closed project_id trong bocS10 bỏ lọt null hoặc chuỗi rỗng: dòng được ghi với project_id 0**
  Người dùng thấy gì: Nếu nguồn trả một dòng hàng thiếu mã dự án, dòng đó có thể bị ghi nhầm vào một dự án giả mang mã 0 mà số đối soát vẫn báo khớp. Chưa thấy ca này trong dữ liệu thật.
  Căn cứ: Chỉ xảy ra khi nguồn gửi dữ liệu lỗi, dữ liệu này chưa lên cổng nào và nạp lại được, nên ghi hạn chế là đủ.
  file: `pipeline/lib/s10-bang-hang.mjs`
  severity: medium
  Đề xuất: known-limits

- **DATA-CONTRACT v11 ghi v9/v10 «chưa gộp», nhưng main đã có**
  Người dùng thấy gì: Một câu trong tài liệu hợp đồng dữ liệu nói sai về việc các phiên bản trước đã gộp hay chưa. Chỉ có thể làm người đọc hiểu nhầm, không ảnh hưởng dữ liệu.
  Căn cứ: Chỉ là chữ trong tài liệu, không mất hay lộ dữ liệu, sửa lúc nào cũng rẻ.
  file: `collector/docs/DATA-CONTRACT.md`
  severity: low
  Đề xuất: known-limits

- **bocS10 chỉ chặn NaN: project_id null hoặc rỗng thành 0 và vẫn được nạp với project_id "0"**
  Người dùng thấy gì: Một dòng hàng thiếu mã dự án có thể bị gán vào dự án giả mã 0 và nằm lẫn trong quỹ căn mà không có cảnh báo. Chưa thấy ca này trong dữ liệu thật.
  Căn cứ: Hiếm gặp, dữ liệu chưa lên cổng và nạp lại được, nên ghi hạn chế và xử lý khi làn thu sửa bộ nạp.
  file: `pipeline/lib/s10-bang-hang.mjs`
  severity: medium
  Đề xuất: known-limits

- **View s10_quy_can_du_an vẫn coi căn của lần chụp cũ là còn trong bảng khi lần chụp mới nhất có bảng rỗng**
  Người dùng thấy gì: Nếu chủ đầu tư gỡ hết căn khỏi bảng hàng, quỹ căn vẫn có thể hiển thị các căn cũ là còn trong bảng. Hiện chưa có trang nào đọc số này.
  Căn cứ: Số liệu chưa lên cổng nào, ca bán hết sạch hiếm, và sửa được trước khi có bên đọc quỹ căn.
  file: `db/migrations/089_s10_bang_hang.sql`
  severity: low
  Đề xuất: known-limits

- **Hình dạng 2 (fixture viết tay đúng khuôn bên đọc): S10-9 không áp tệp 089 thật mà luôn rơi về DDL chép tay vì readFileSync chưa được import**
  Người dùng thấy gì: Một bài kiểm tự động báo xanh trên bảng chép tay chứ không phải bảng thật, nên nếu bảng thật lệch khỏi bộ nạp thì bài kiểm này không phát hiện. Dữ liệu thật không bị ảnh hưởng trực tiếp.
  Căn cứ: Không làm mất hay lộ dữ liệu người dùng, lệch lược đồ nếu có vẫn lộ ra khi chạy thật, và sửa bài kiểm rẻ.
  file: `pipeline/scripts/s10-bang-hang.test.mjs`
  severity: high
  Đề xuất: known-limits

- **Hình dạng 2 (fixture viết tay đúng khuôn bên đọc): hai bài kiểm napS10Project dựng tay bảng «mô phỏng 089» lệch migration thật**
  Người dùng thấy gì: Hai bài kiểm nạp tên dự án chạy trên bảng tự dựng, nên chưa chứng minh được bộ nạp khớp với bảng thật. Người dùng cuối không thấy ảnh hưởng.
  Căn cứ: Chỉ làm giảm độ chắc của bài kiểm, không mất dữ liệu, lệch lược đồ sẽ lộ khi chạy trên dữ liệu thật.
  file: `pipeline/tests/s10-project-nap.itest.mjs`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 5 (tuyên quét lớp nhưng chỉ có điểm-case): probe chặn tuyên bố cả bốn tên S10 nhưng chiều đỏ chỉ thử một tên**
  Người dùng thấy gì: Phép kiểm chắn số S10 khỏi cổng chỉ thử gây lỗi bằng một trong bốn tên, nên nếu ba tên còn lại bị gõ sai trong luật quét thì chưa chắc phát hiện. Hiện không có số S10 nào lên cổng.
  Căn cứ: Rủi ro nhẹ, chưa có dữ liệu S10 nào lên cổng và bổ sung ca thử sau rất rẻ.
  file: `_acceptance/s10-bang-hang-vao-danh-ba/probes/chan.sh`
  severity: medium
  Đề xuất: known-limits

⚠ Cụm ngoài vùng phủ: 3/8 lỗi rơi vào file không bộ đo nào phủ (collector/docs/DATA-CONTRACT.md, pipeline/scripts/s10-bang-hang.test.mjs, pipeline/tests/s10-project-nap.itest.mjs) — dừng và quyết: mở rộng hợp đồng hay rút phạm vi.
