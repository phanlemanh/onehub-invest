# Review findings: au3-nap-bao-loi (round 2)

## Trong hợp đồng

(không có finding nào map được vào AC — 11/11 eval đạt; R1 của vòng 1 đã sửa)

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa.

- **Snapshot đang tải ảnh dở bị coi là đã nạp nên cả mẻ tin mất khỏi kho mà không ai biết**
  Người dùng thấy gì: Một mẻ khoảng 50 tin Zalo không bao giờ vào kho dữ liệu; job đêm vẫn báo xanh và lượt sau không nạp lại. Collector đang chạy (bản 21/10) chưa tải ảnh nên hôm nay hiếm gặp; khi ZC4 chạy bản collector mới (có tải ảnh), một snapshot có thể nằm dở tới vài phút đúng lúc job nạp quét qua.
  Căn cứ: Mất dữ liệu thật, im lặng, không tự hồi phục, và sẽ thành thường xuyên ngay khi triển khai ZC4; phải sửa trước khi chạy collector bản mới.
  file: `pipeline/import-airbnb.mjs`
  severity: high
  Đề xuất: new-contract

- **Khoá nạp bị kẹt sau khi máy tắt đột ngột làm cả hai job nạp đỏ mãi**
  Người dùng thấy gì: Sau một lần mất điện hay tiến trình bị giết cứng, không còn tin mới nào vào kho cho tới khi có người gỡ khoá bằng tay; job đỏ nên Ops thấy được.
  Căn cứ: Không mất dữ liệu (snapshot còn trên đĩa, gỡ khoá là nạp tiếp) nhưng ống đứng tới khi có người can thiệp; nên thêm nhận diện khoá cũ trong một việc riêng.
  file: `scripts/apify-facebook-daily.sh`
  severity: medium
  Đề xuất: new-contract

- **Job nạp Zalo hằng đêm báo xanh dù bước chuyển tin thành offer bị lỗi**
  Người dùng thấy gì: Nếu bước chuyển tin Zalo sang offer hỏng, job đêm vẫn báo xanh nên Ops không biết offer mới đã ngừng cập nhật.
  Căn cứ: Che lỗi thật của một bước dữ liệu, đúng loại sự cố AU3 muốn bỏ, nhưng là phần bước transform (làn Claude) chưa bọc job_run; sửa bằng việc riêng làn Claude.
  file: `scripts/zalo-import-daily.sh`
  severity: medium
  Đề xuất: new-contract

- **Job nạp Facebook để lại tệp tạm rỗng sau mỗi lượt**
  Người dùng thấy gì: Không thấy gì; thư mục tạm của máy có thêm vài tệp rỗng mỗi ngày.
  Căn cứ: Không ảnh hưởng dữ liệu hay người dùng, dọn sau rẻ.
  file: `scripts/apify-facebook-daily.sh`
  severity: low
  Đề xuất: known-limits

- **Snapshot tới muộn mang mốc cũ hơn mốc đã nạp bị bỏ qua vĩnh viễn**
  Người dùng thấy gì: Chỉ khi collector cũ và mới cùng ghi trong giai đoạn chuyển, một vài snapshot có thể không vào kho.
  Căn cứ: Hôm nay mọi snapshot Zalo đều cùng khuôn nên chưa xảy ra; giai đoạn chuyển ngắn và sẽ có người canh lúc triển khai ZC4.
  file: `scripts/zalo-import-daily.sh`
  severity: low
  Đề xuất: known-limits

- **Job Chợ Tốt có thể chọn nhầm thư mục rác làm snapshot mới nhất**
  Người dùng thấy gì: Nếu ai đó để một thư mục thử trong kho snapshot Chợ Tốt, job có thể nạp nó thay cho bản mới nhất thật.
  Căn cứ: Chỉ xảy ra khi có thư mục rác do người tạo, và importer Chợ Tốt đã lọc nguồn theo manifest; ghi lại là đủ, gom vào việc sửa sau.
  file: `scripts/chotot-daily.sh`
  severity: low
  Đề xuất: known-limits
