## Trong hợp đồng

(không có)

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **README áp coi chữ ký Cổng Bằng chứng là đủ để khởi động lại gateway, trái luật «lời riêng của Mạnh» — ĐÃ SỬA @e3dfba683**
  Người dùng thấy gì: Hướng dẫn áp lên máy thu có thể bị đọc thành chữ ký nghiệm thu là đủ để khởi động lại dịch vụ nhận tin Zalo, trong khi luật yêu cầu Mạnh nói riêng cho bước đó. Người vận hành có thể khởi động lại dịch vụ sớm hơn lúc Mạnh cho phép.
  Căn cứ: Đã sửa @e3dfba683 theo phán GS (luật an toàn không ghi Known limits): hồ sơ áp nay ghi bước 1.3, 1.4 và lần khởi động lại ở mục 4 cần lời riêng của Mạnh ngay lúc làm, ngoài chữ ký, chỉ ZV chạy theo GIAO của LL. Tệp nằm trong paths của E16 nên E16 được ghim lại trong làn trước chữ ký; chạy tay kiem.sh trên bản sửa: AP-MAY-THU PASS.
  file: `_acceptance/go-kev-khoi-hook-s03/ap-may-thu/README.md`
  severity: medium

- **Hình dạng 2 — fixture viết tay không theo khuôn của writer: log mẫu hook ghi «kev=off» trước «account=», đúng khuôn r1 đã bị bác**
  Người dùng thấy gì: Bộ log mẫu dùng để thử công cụ kiểm sau khi áp có thứ tự trường lệch so với log thật. Vì vậy công cụ kiểm có thể không bắt được lỗi nếu khuôn log thật bị đổi sai theo hướng này, dù phần thử bằng log thật vẫn chạy.
  Căn cứ: Chỉ ảnh hưởng độ nhạy của bộ kiểm trên tệp mẫu, không ảnh hưởng tin của người dùng hay dữ liệu; phép thử bằng log thật vẫn là chốt chính, và chỉnh lại mẫu sau này rẻ.
  file: `_acceptance/go-kev-khoi-hook-s03/ap-may-thu/mau/dat/hook.log`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 1 + 4 — ca «khoá-đọc» grep mã nguồn thay vì đo log đầu ra, và chỉ có kiểm âm tính**
  Người dùng thấy gì: Phép thử hiện chỉ xem mã có in khoá ra hay không, chưa kiểm tệp log thật có lộ khoá. Nếu sau này ai đó ghi khoá vào log thì phép thử vẫn báo đạt và khoá có thể lộ trong tệp log trên máy.
  Căn cứ: Hiện chưa có dấu hiệu khoá bị ghi ra, log chỉ nằm trên máy thu và hook không thay đổi ở điểm này; thêm phép kiểm log sau này rẻ nên chấp nhận giới hạn.
  file: `collector/openclaw/handler.test.mjs`
  severity: low
  Đề xuất: known-limits

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).
