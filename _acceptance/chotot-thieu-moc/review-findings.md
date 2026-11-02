# Review findings: chotot-thieu-moc (round 2)

Phạm vi soát: `git diff origin/main...HEAD` trên importer S06, test mới của hồ sơ, cùng test không lùi có sẵn mà E3 dùng, trên HEAD `3839846d`. Phiên chấm không sửa mã hay test; đột biến chỉ làm trong bản chép ở scratchpad.

## Soát lại finding vòng 1

| Finding | Trạng thái trên HEAD | Cách xác nhận |
|---|---|---|
| F1 | còn | đột biến `OR TRUE` trong bản chép, chạy E3 và importer |
| F2 | còn | đọc test + lượt chạy cả tệp trên baseline |

## Trong hợp đồng

- **F1 (trung bình, không chặn, còn) — E3 không có răng với đúng rủi ro AC-3 nêu.** AC-3 hỏi «thêm `OR` có làm hỏng luật không lùi không», mà test của E3 chỉ tìm chuỗi `WHERE EXCLUDED.captured_at >= ...` trong SQL. Đột biến đổi `OR <bảng>.captured_at IS NULL` thành `OR TRUE` trong bản chép: E3 vẫn pass 3, fail 0, trong khi nạp thật một snapshot cũ làm nội dung lùi về bản cũ. Không chặn vì cây thật đúng: nạp snapshot cũ qua importer thật trên lược đồ tạm và dòng giữ nguyên ở cả bốn trường. Eval đạt `expected` của nó. Rủi ro nằm ở tương lai: chưa có test nào trong kho giữ ngữ nghĩa này. Gợi ý cho bên làm: thêm ca nạp cũ sau mới vào test của hồ sơ, hoặc trỏ E3 vào lệnh có ngữ nghĩa thật.
- **F2 (thấp, không chặn, còn) — hai ca của `ctm_unit` phụ thuộc thứ tự.** Cả hai dùng chung lược đồ và khoá tin `1`. Nếu ca từ chối hỏng, nó để lại dòng và ca sau đỏ với lỗi trùng khoá thay vì lỗi đóng băng. Lượt chạy cả tệp trên baseline vòng này cho đúng hiện tượng đó. Trên HEAD không ảnh hưởng kết quả.

## Ngoài hợp đồng

không có

## Đã soát, không phải finding

- **Điều kiện `OR` đứng cuối mệnh đề WHERE của `ON CONFLICT`,** không có AND nào đi kèm nên không cần ngoặc.
- **Chốt chặn đặt trong `readSnapshot`, trước mọi lệnh ghi,** nên từ chối thì không có dòng ở bảng snapshot. Khuôn kiểm đòi chuỗi có dạng ngày giờ, nên vắng, rỗng và rác đều bị từ chối; đã đo cả ba.
- **Chốt chặn không làm kẹt chuỗi hằng ngày với dữ liệu hiện có:** 37/37 manifest S06 trong checkout chính có mốc hợp lệ.
- **Dòng NULL di sản:** DB local hiện có 0 dòng, nên nhánh `OR` chưa có dữ liệu để tác động ở local. Hợp đồng đã khai không sửa tay.
