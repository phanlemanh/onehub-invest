# Review findings: probe-danh-ba-dem-theo-luat-nghi (round 2)

## Trong hợp đồng

Không có finding nào map vào AC.

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **Log ca xanh và ca phá ghi vào /tmp với tên cố định, bị bỏ lại khi script đỏ**
  Người dùng thấy gì: Khi bước kiểm đỏ giữa chừng, vài tệp log tạm bị bỏ lại trong thư mục tạm của máy. Không ảnh hưởng kết quả kiểm hay dữ liệu thật.
  Căn cứ: Hậu quả rất nhẹ, chỉ rác tạm trên máy dev và hệ điều hành tự dọn, nên sửa không đáng công.
  file: `_acceptance/probe-danh-ba-dem-theo-luat-nghi/probes/doi-chieu.sh`
  severity: low
  Đề xuất: wont-fix

- **Kiểm «ca phá đỏ ở dải số» luôn qua: grep trúng tên test chứ không trúng thông điệp assert**
  Người dùng thấy gì: Bước kiểm chứng ca phá đỏ đúng chỗ có thể báo qua dù ca đỏ vì lý do khác, nên thông báo lỗi có thể nêu sai nguyên nhân. Kết quả đỏ hay xanh cuối cùng vẫn đúng.
  Căn cứ: Chỉ làm sai lời giải thích khi probe đỏ chứ không làm lọt lỗi, và người chạy tự đọc log để thấy nguyên nhân thật.
  file: `_acceptance/probe-danh-ba-dem-theo-luat-nghi/probes/doi-chieu.sh`
  severity: low
  Đề xuất: known-limits

- **Hình dạng 4 (assertion âm tính đứng một mình, không ghim thông điệp): grep «TDB-DC dải số» trong ca phá khớp với tên test nên lần nào cũng qua**
  Người dùng thấy gì: Một phép kiểm trong bước thử ca phá luôn qua nên không có tác dụng riêng. Các bước sau vẫn bắt được lỗi, người dùng không thấy khác biệt.
  Căn cứ: Đã có bước khác chặn đúng lúc và vòng trước đã chấp nhận ghi vết, nên sửa không đem thêm bảo vệ đáng kể.
  file: `_acceptance/probe-danh-ba-dem-theo-luat-nghi/probes/doi-chieu.sh`
  severity: low
  Đề xuất: wont-fix

⚠ Cụm ngoài vùng phủ: 3/3 lỗi rơi vào file không bộ đo nào phủ (_acceptance/probe-danh-ba-dem-theo-luat-nghi/probes/doi-chieu.sh) — dừng và quyết: mở rộng hợp đồng hay rút phạm vi.
