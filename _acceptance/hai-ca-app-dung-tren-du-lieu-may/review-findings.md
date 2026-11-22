## Trong hợp đồng

- **Ngưỡng `soOCoSo > 10` không khớp với cách trang 1 thật sự được dựng, nên ca DO3-AC-7 đỏ oan theo dữ liệu**
  file: `app/tests/do-lam-giau.test.tsx:217`
  severity: medium
  AC: AC-1
  source: bugs
  detail: Bảng lát không sắp xếp lại dòng: BangLuoi phân trang thẳng trên `latThayDoi`. Hàm này nối dòng của từng đường (flatMap). Trong mỗi đường, `dongLat` lấy hợp các khoá theo thứ tự xuất hiện đầu tiên giữa các nhóm. `phanRa` đặt ô có số (xếp theo số), rồi `khac`, rồi `khong-tin-hieu` và `chua-co-danh-ba`. Vậy ô chưa gắn của đường ĐẦU TIÊN đứng ngay sau các ô có trong nhóm đầu của đường đó. Ô chỉ có ở nhóm sau, ô của đường khác và dòng `__tong__` đều xếp sau nó. Trong khi đó `soOCoSo` đếm ô có số của MỌI đường và MỌI nhóm. Hai chiều đều sai: (a) Đường 1, nhóm 1 có 5 ô; nhóm khác hoặc đường khác thêm 8 ô. Khi đó soOCoSo = 13 > 10 nhưng `khong-tin-hieu` nằm ở dòng thứ 6 của trang 1, nên assert «DO3-AC-7 hiện trạng đổi» đỏ oan. (b) Đường 1, nhóm 1 có đúng 10 ô. Khi đó soOCoSo = 10 nên rơi vào nhánh else, nhưng ô chưa gắn là dòng thứ 11 (trang 2), nên assert «ô chưa gắn không ở trang 1 dù bảng chưa quá một trang» đỏ oan (lệch một). Kết quả xanh hay đỏ phụ thuộc vào cách dữ liệu máy phân bố giữa các đường và các nhóm, không phụ thuộc vào thứ ca muốn ghim. Cách sửa: tính vị trí thật bằng `dongPhuong.findIndex(r => r.o === 'khong-tin-hieu') < 10` (trang 1 = 10 dòng đầu của mô hình dòng) thay vì đếm tổng ô có số.

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **ht3_pham_vi báo SCOPE OK sai khi `git merge-base` lỗi**
  Người dùng thấy gì: Khi máy chưa có nhánh gốc, bước kiểm phạm vi có thể báo đạt dù nhánh đã sửa tệp ngoài phạm vi, nên người duyệt có thể tưởng nhánh sạch trong khi chưa kiểm được.
  Căn cứ: Chỉ xảy ra trên bản chép nông chưa tải nhánh gốc, không mất hay lộ dữ liệu, và người duyệt vẫn thấy được danh sách tệp đổi khi xem lại nhánh.
  file: `_acceptance/config.yaml`
  severity: low
  Đề xuất: known-limits

- **Hình dạng 3 (quan hệ đo bằng chuỗi/giá trị tự sinh): phép so «số suy = số tin trong danh bạ» lấy đáp án từ đúng phép nối mà dealsSql dùng, nên trên dữ liệu thật không bao giờ đỏ**
  Người dùng thấy gì: Nếu màn Căn giá tốt hiện sai số tin của người bán cho tin có số suy, ca kiểm vẫn có thể báo xanh vì tự đối chiếu với chính cách tính đó.
  Căn cứ: Lỗi nếu có chỉ là con số phụ trên chip người bán, không mất dữ liệu, và người dùng đối chiếu lại được trong danh bạ; sửa đòi dựng lại cách đo nên không gấp.
  file: `app/tests/sellers-chip.test.tsx`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 2 (fixture viết tay đúng khuôn bên đọc): tin số suy cấy tay sau bước đêm, nên chặn «probe không đo được» luôn được chính fixture thoả**
  Người dùng thấy gì: Ca kiểm không chứng minh được hệ thống tự sinh ra tin có số suy rồi hiển thị đúng, vì dòng số suy do ca tự dựng sẵn.
  Căn cứ: Đây là lựa chọn có chủ ý của hợp đồng để ca không phụ thuộc dữ liệu máy; hậu quả chỉ là độ phủ kiểm thấp hơn, người dùng không bị ảnh hưởng và có thể bổ sung ca khứ hồi sau.
  file: `app/tests/sellers-chip.test.tsx`
  severity: medium
  Đề xuất: known-limits

## Chưa adversarial-verify (refuter chết)

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).
