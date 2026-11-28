# Review findings: data-api-probe-ban-cu-moc-co-dinh (round 1)

## Trong hợp đồng

(không có)

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **Hồ sơ PB11 không gắn với việc nào trong docs/plan/lo-trinh.json; LO-TRINH.html sinh ra tự báo thêm một «chỗ cần sửa»**
  Người dùng thấy gì: Trang lộ trình báo thêm một chỗ cần sửa vì việc này chưa có hàng trong kế hoạch. Chỉ ảnh hưởng bảng theo dõi, không ảnh hưởng người dùng cuối.
  Căn cứ: Nhẹ: chỉ là sổ sách theo dõi, không mất dữ liệu, bổ sung hàng vào kế hoạch sau là xong và rẻ.
  file: `LO-TRINH.html`
  severity: low
  Đề xuất: known-limits

- **Chú thích đầu probe và chú thích executor vẫn nói «merge-base» sau khi đã đổi sang mốc cố định**
  Người dùng thấy gì: Vài dòng ghi chú trong bộ kiểm còn mô tả cách cũ nên có thể làm người đọc hiểu nhầm. Kết quả kiểm không bị ảnh hưởng.
  Căn cứ: Rất nhẹ: chỉ gây hiểu nhầm khi đọc, không đổi kết quả kiểm, sửa lúc nào cũng được.
  file: `_acceptance/config.yaml`
  severity: low
  Đề xuất: wont-fix

- **Chốt «mốc so hỏng» nuốt mọi lỗi git, không chỉ ca «không phải tổ tiên»**
  Người dùng thấy gì: Nếu mốc ghim bị gõ sai hoặc kho chưa tải đủ, bộ kiểm có thể không báo rõ mà hỏng ở bước sau. Chỉ gặp ở máy kiểm, không chạm người dùng.
  Căn cứ: Nhẹ: chỉ ảnh hưởng người chạy kiểm, lỗi vẫn lộ ra ở bước sau và tự thử lại được; sửa sau rẻ.
  file: `_acceptance/data-api-dong-khi-thieu-khoa/probes/pha.mjs`
  severity: low
  Đề xuất: known-limits

- **Hình dạng 6 (đo cây cố định thay vì cây đang kiểm): probe HT19 dựng toàn bộ data-api từ commit b013b4428, không đọc cây hiện tại**
  Người dùng thấy gì: Phép đo của một hồ sơ cũ chạy trên bản đóng băng nên không bắt được lỗi mới trong code hiện tại. Đã chủ ý, các bộ kiểm khác lo phần này.
  Căn cứ: Nhẹ: là lựa chọn có chủ ý của hợp đồng, người dùng không mất gì, đổi thiết kế sẽ tốn công hơn lợi ích.
  file: `_acceptance/data-api-dong-ba-route-lo/probes/pha.mjs`
  severity: medium
  Đề xuất: wont-fix

- **Hình dạng 3 (assert chỉ đo một nửa quan hệ đã hứa): AC-1 hứa MOC là cha của lần gộp, nhưng không chỗ nào kiểm quan hệ đó**
  Người dùng thấy gì: Không có bước nào tự xác nhận mốc ghim đúng là bản ngay trước lần gộp. Nếu ghim nhầm sang bản cũ hơn, bộ kiểm vẫn có thể xanh.
  Căn cứ: Nhẹ: các mốc đã được đo tay xanh đúng lúc ký, chỉ rủi ro nếu ai đó sửa mốc sau này; không ảnh hưởng người dùng.
  file: `_acceptance/data-api-probe-ban-cu-moc-co-dinh/probes/dot-bien.mjs`
  severity: low
  Đề xuất: known-limits

- **Hình dạng 4 (assert âm tính đứng một mình): phép quét «không còn merge-base» trong pham-vi.mjs không có ô cấy đỏ**
  Người dùng thấy gì: Bộ kiểm quét chữ để chắc không còn dùng cách cũ, nhưng chưa được thử xem có bắt được trường hợp sai thật không. Có thể bỏ sót vài cách viết khác.
  Căn cứ: Nhẹ: chỉ làm bộ kiểm yếu hơn mức mong muốn, không ảnh hưởng người dùng, bổ sung ô đối chứng sau là rẻ.
  file: `_acceptance/data-api-probe-ban-cu-moc-co-dinh/probes/pham-vi.mjs`
  severity: low
  Đề xuất: known-limits

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).
