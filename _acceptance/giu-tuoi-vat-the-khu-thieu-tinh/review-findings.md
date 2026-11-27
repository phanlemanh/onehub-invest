# Review findings: giu-tuoi-vat-the-khu-thieu-tinh (round 1)

## Trong hợp đồng

Không có finding nào map được vào AC.

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **E4 expected mô tả sai cơ chế đối chứng so với doi-chung.sh**
  Người dùng thấy gì: Người ký đọc phần mô tả có thể hiểu sai cách so sánh với bản cũ (tưởng bản đang chấm bị tráo mã tạm), dù thực tế phép so sánh chạy ở bản sao riêng và không đụng bản đang chấm.
  Căn cứ: Chỉ làm người ký hiểu sai cách đo chứ không ảnh hưởng người dùng cuối, không mất hay lộ dữ liệu, và sửa lại câu chữ sau này rất rẻ.
  file: `_acceptance/giu-tuoi-vat-the-khu-thieu-tinh/evals.yaml`
  severity: low
  Đề xuất: known-limits

- **Hình dạng 5: tuyên quét lớp nhưng chỉ có điểm-case. Hàng «đích nối S09 khu/S16» của trục khu không có ca nào**
  Người dùng thấy gì: Lượt giữ tươi đêm có thể vẫn đúng, nhưng chưa có phép thử riêng nào chứng minh khu nối với dự án S09/S16 mà thiếu tỉnh vẫn bị chặn như cũ. Nếu ai đó vô tình bỏ nhánh này, bộ kiểm tra vẫn báo xanh.
  Căn cứ: Rủi ro chỉ xảy ra khi có người sửa nhầm sau này, không ảnh hưởng ngay hôm nay; hậu quả là một khu thiếu tỉnh lọt qua và dữ liệu vật thể gắn sai vùng, tìm lại và sửa được; thêm ca thử sau rẻ.
  file: `_acceptance/giu-tuoi-vat-the-khu-thieu-tinh/contract.md`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 3: kiểm «chuỗi có mặt» trên toàn bộ đầu ra, trong khi lời hứa AC-4 là quan hệ «AC-1 và AC-3 đỏ VÌ khong-co-tinh»**
  Người dùng thấy gì: Phép so sánh với bản cũ có thể báo bản cũ lỗi đúng sự cố trong khi thực ra chúng lỗi vì lý do khác. Lần đo này vẫn đúng, nhưng lần chạy sau có thể cho kết quả đẹp mà không đáng tin.
  Căn cứ: Lần đo thật đã xác nhận đúng sự cố nên không có hậu quả với người dùng bây giờ; rủi ro chỉ là một phép thử đối chứng sau này kém tin cậy, không mất dữ liệu và siết lại sau rẻ.
  file: `_acceptance/giu-tuoi-vat-the-khu-thieu-tinh/doi-chung.sh`
  severity: medium
  Đề xuất: known-limits

⚠ Cụm ngoài vùng phủ: 3/3 lỗi rơi vào file không bộ đo nào phủ (_acceptance/giu-tuoi-vat-the-khu-thieu-tinh/evals.yaml, _acceptance/giu-tuoi-vat-the-khu-thieu-tinh/contract.md, _acceptance/giu-tuoi-vat-the-khu-thieu-tinh/doi-chung.sh) — dừng và quyết: mở rộng hợp đồng hay rút phạm vi.
