# Review findings: tran-tong-luot-dem-va-tran-doc-gop (round 1)

## Trong hợp đồng

(không có finding nào map được vào AC)

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **ZALO_IMPORT_TRAN_DOC_GOP từ môi trường (plist) không được kiểm là số nguyên trước khi so sánh và tính toán: giá trị sai làm hỏng trọn lượt 00:00**
  Người dùng thấy gì: Nếu người vận hành gõ nhầm giá trị trần đọc gộp (ví dụ thêm chữ 'm' hay 's'), lượt nạp đêm 00:00 chết ngay mà không có dòng báo lỗi rõ ràng, nên đêm đó không có dữ liệu mới.
  Căn cứ: Chỉ xảy ra khi người vận hành tự đặt sai giá trị; sửa lại cấu hình và chạy lại là khắc phục được, không mất dữ liệu.
  file: `scripts/zalo-import-daily.sh`
  severity: medium
  Đề xuất: known-limits

- **Biến DOC_GOP_TRAN_GIAY chưa có ai đọc trên main, nên README áp hứa lượt 00:00 dừng sạch và chạy tới enrich mà không nêu điều kiện tiên quyết**
  Người dùng thấy gì: Nếu chỉ áp bản này mà chưa có phần song song hoá bước đọc gộp, hai đêm đo vẫn có thể đỏ và bước làm giàu dữ liệu vẫn không chạy. Người đọc hồ sơ dễ tưởng lưới chia trần đã có tác dụng.
  Căn cứ: Chỉ gây nhầm lẫn khi đọc kết quả đo, không làm mất dữ liệu, và bổ sung một dòng ghi chú vào hồ sơ là đủ.
  file: `_acceptance/tran-tong-luot-dem-va-tran-doc-gop/ap-may-thu/README.md`
  severity: medium
  Đề xuất: known-limits

- **Quét lớp nhưng chỉ có điểm-case (hình dạng 5) và nhánh âm tính không có ca đỏ (hình dạng 4): kiem-sau.sh khai năm điều kiện, kiem.sh chỉ có ca đỏ cho ba**
  Người dùng thấy gì: Bộ kiểm sau khi áp có hai điều kiện chưa được thử bằng ca báo đỏ. Nếu có ai làm hỏng hai điều kiện đó thì bộ kiểm vẫn có thể báo đạt.
  Căn cứ: Chỉ làm bộ kiểm yếu hơn đôi chút ở hai nhánh hiếm, không ảnh hưởng dữ liệu người dùng, và thêm ca thử sau này khá rẻ.
  file: `_acceptance/tran-tong-luot-dem-va-tran-doc-gop/ap-may-thu/kiem.sh`
  severity: medium
  Đề xuất: known-limits

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).
