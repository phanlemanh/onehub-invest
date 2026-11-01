# Review findings: the-duyet-nguoi-nhieu-nhieu (round 2)

## Trong hợp đồng

(không có)

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **E9-step3.png trùng từng byte với E9-step2.png nhưng báo cáo coi là hai ảnh riêng**
  Người dùng thấy gì: Báo cáo nghiệm thu nói có hai ảnh màn hình khổ điện thoại nhưng thực ra chỉ có một. Màn duyệt Người vẫn hoạt động, chỉ phần chứng minh cho khổ hẹp mỏng hơn báo cáo tả.
  Căn cứ: Không ảnh hưởng người dùng cuối hay dữ liệu, chỉ làm hồ sơ nghiệm thu nói quá; chụp lại sau rất rẻ.
  file: `_acceptance/the-duyet-nguoi-nhieu-nhieu/evidence/E9-step3.png`
  severity: medium
  Đề xuất: known-limits

- **Dòng đầu E9-network.txt ghi sai nội dung tệp**
  Người dùng thấy gì: Một tệp ghi chú trong hồ sơ nghiệm thu ghi nhãn sai nội dung, dễ làm người đọc hiểu nhầm. Người dùng ở màn duyệt không bị ảnh hưởng.
  Căn cứ: Chỉ gây hiểu nhầm khi đọc hồ sơ, không mất dữ liệu và sửa nhãn rất rẻ.
  file: `_acceptance/the-duyet-nguoi-nhieu-nhieu/evidence/E9-network.txt`
  severity: low
  Đề xuất: known-limits

- **E9-step3.png là bản sao byte-y-hệt của E9-step2.png, không phải một bước riêng**
  Người dùng thấy gì: Ảnh bước ba chỉ là bản chép của bước hai, nên phần dưới của thẻ ở khổ điện thoại chưa được chụp thực sự. Người duyệt vẫn dùng được màn này bình thường.
  Căn cứ: Chỉ thiếu một ảnh minh chứng, không gây hại cho người dùng; chụp bù sau nhanh và rẻ.
  file: `_acceptance/the-duyet-nguoi-nhieu-nhieu/evidence/E9-step3.png`
  severity: low
  Đề xuất: known-limits

- **E9-network.txt ghi sai nhãn và không chứng minh được điều nó được dùng để chứng minh**
  Người dùng thấy gì: Hồ sơ nghiệm thu khẳng định màn duyệt không tràn ngang ở khổ điện thoại và không gọi mạng thừa, nhưng tệp dẫn chứng không chứng minh được hai điều đó. Có thể màn hình vẫn đúng, chỉ là chưa được kiểm thật.
  Căn cứ: Không làm mất dữ liệu hay hỏng chức năng, chỉ khiến lời khẳng định chưa có căn cứ; đo lại ở khổ 375 là việc nhỏ.
  file: `_acceptance/the-duyet-nguoi-nhieu-nhieu/evidence/E9-network.txt`
  severity: low
  Đề xuất: known-limits

- **Tin mẫu sắp «mới nhất trước» bằng String(Date): thứ tự thực ra theo tên thứ trong tuần (r1)**
  Người dùng thấy gì: Năm tin mẫu hiện trên thẻ duyệt có thể không phải năm tin mới nhất. Người duyệt vẫn thấy đủ thông tin để quyết định, chỉ là mẫu không đúng như mô tả.
  Căn cứ: Hậu quả nhẹ: không mất hay lộ dữ liệu, thẻ vẫn đủ bằng chứng để duyệt, và sửa sau vẫn rẻ.
  file: `pipeline/lib/the-duyet-nguoi.mjs`
  severity: medium
  Đề xuất: known-limits

- **Tiền tố lý do 'the-duyet:' viết cứng trong thước nap-lai-nguoi thay vì dùng hằng LY_DO_THE (r1)**
  Người dùng thấy gì: Hiện người dùng không thấy gì sai. Nếu sau này ai đó đổi tiền tố lý do, kiểm tra một-SĐT có thể lặng lẽ sai.
  Căn cứ: Không có hậu quả nào hôm nay với người dùng, và rủi ro chỉ xuất hiện khi có người đổi tiền tố, nên chi phí sửa lớn hơn hậu quả.
  file: `pipeline/scripts/nap-lai-nguoi.mjs`
  severity: low
  Đề xuất: wont-fix

- **Tin mẫu sắp «mới nhất trước» theo chuỗi Date (thứ trong tuần), không theo thời gian (r1)**
  Người dùng thấy gì: Năm tin mẫu trên thẻ có thể không phải năm tin mới nhất. Việc quyết định gộp hay tách vẫn làm được bình thường.
  Căn cứ: Chỉ lệch việc chọn mẫu minh hoạ, không mất hay lộ dữ liệu, người duyệt vẫn quyết định đúng nhờ các bảng tài khoản và SĐT.
  file: `pipeline/lib/the-duyet-nguoi.mjs`
  severity: medium
  Đề xuất: known-limits

- **Đối chứng --the-duyet có thể ép gộp một người vào chính nó, hoặc sập khi có ít hơn 2 dòng (r1)**
  Người dùng thấy gì: Phép tự thử của công cụ kiểm có thể báo sai trên một số dữ liệu, hoặc dừng với lỗi khó hiểu. Dữ liệu thật không bị đổi vì thao tác được hoàn tác.
  Căn cứ: Chỉ ảnh hưởng người vận hành khi chạy công cụ kiểm, dữ liệu không bị hỏng vì có hoàn tác, chạy lại được.
  file: `pipeline/scripts/nap-lai-nguoi.mjs`
  severity: low
  Đề xuất: known-limits

- **Hình 4 — đối chứng của thước chỉ đếm > 0, không ghim thông điệp 'hai SĐT' + party_key như E10 hứa (r1)**
  Người dùng thấy gì: Phép tự thử của công cụ kiểm chỉ chứng minh có người hai SĐT đâu đó, không chỉ đúng cặp vừa thử. Người dùng cuối không bị ảnh hưởng.
  Căn cứ: Chỉ làm bằng chứng kiểm hơi lỏng, không ảnh hưởng dữ liệu hay người dùng, nâng độ chặt sau cũng rẻ.
  file: `pipeline/scripts/nap-lai-nguoi.mjs`
  severity: low
  Đề xuất: known-limits

- **Hình 2 — fixture evidence của thẻ viết tay theo khuôn bên đọc, không lấy từ writer evidenceThe (r1)**
  Người dùng thấy gì: Nếu sau này phía tạo thẻ đổi tên trường, màn duyệt có thể hiện trống mà test không báo. Hiện hai phía đang khớp.
  Căn cứ: Hiện chưa gây lỗi, kiểm tra trên dữ liệu thật vẫn bắt được, và nếu có lỗi chỉ là hiển thị, sửa lại dễ.
  file: `app/tests/review-nguoi.test.tsx`
  severity: low
  Đề xuất: known-limits

⚠ Cụm ngoài vùng phủ: 4/4 lỗi rơi vào file không bộ đo nào phủ (_acceptance/the-duyet-nguoi-nhieu-nhieu/evidence/E9-step3.png, _acceptance/the-duyet-nguoi-nhieu-nhieu/evidence/E9-network.txt) — dừng và quyết: mở rộng hợp đồng hay rút phạm vi.
