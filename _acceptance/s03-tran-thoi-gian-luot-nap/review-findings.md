# Review findings: s03-tran-thoi-gian-luot-nap (round 3)

## Trong hợp đồng

(không có)

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **do-luot-dem.sh vẫn tính dòng «TIMEOUT: lượt vượt trần» của lượt bị trần tổng cắt ở pha nạp cho lượt 00:00 CŨ, nên lượt cũ báo nhầm «ĐẠT (cắt trần)»**
  Người dùng thấy gì: Sau một lượt đêm bị cắt giữa lúc đang nạp, phép kiểm buổi sáng có thể báo lượt cũ là đạt trong khi lượt vừa bị cắt không được đo. Người vận hành có thể tin nhầm là mọi thứ ổn.
  Căn cứ: Chỉ ảnh hưởng tới phép kiểm sau khi áp, không làm mất hay sai dữ liệu, và người kiểm có thể đọc thẳng nhật ký để đối chiếu nên hậu quả nhẹ.
  file: `_acceptance/s03-tran-thoi-gian-luot-nap/ap-may-thu/do-luot-dem.sh`
  severity: medium
  Đề xuất: known-limits

- **do-luot-dem.sh bỏ qua lượt 00:00 thoát sớm (FAILED=1/exit 3), chấm nhầm sang lượt cũ và để cờ TẮT dính sang lượt sau**
  Người dùng thấy gì: Khi lượt nửa đêm dừng sớm vì dữ liệu chưa sẵn sàng hoặc lỗi, phép kiểm buổi sáng có thể lấy số của đêm trước hoặc báo đỏ giả cho lượt sau. Người vận hành có thể bị đánh lạc hướng khi đọc kết quả.
  Căn cứ: Đây là sai lệch của công cụ đo, không đụng tới dữ liệu và chỉ gây nhầm lẫn tạm thời, kiểm lại bằng cách đọc nhật ký là được; sửa sau cũng không đắt.
  file: `_acceptance/s03-tran-thoi-gian-luot-nap/ap-may-thu/do-luot-dem.sh`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 4: ca (d) chỉ có assertion âm tính, không có đối chứng dương**
  Người dùng thấy gì: Một ca kiểm tự động có thể vẫn báo xanh dù lượt nạp dừng sớm hơn dự kiến, nên lỗi cũ có thể lọt qua mà không ai biết. Người dùng cuối không thấy ảnh hưởng trực tiếp.
  Căn cứ: Chỉ làm yếu một lớp kiểm tự động, không làm mất hay sai dữ liệu của người dùng, và có thể bổ sung chặt hơn bất cứ lúc nào.
  file: `scripts/zalo-import-tran-zcode.test.mjs`
  severity: medium
  Đề xuất: known-limits

- **Chữ ký chủ khoá `ps -o lstart=` đổi theo locale và TZ, có thể gỡ nhầm khoá của lượt đang chạy thật (r2 · tệp đã đổi)**
  Người dùng thấy gì: Nếu lượt nạp chạy tay hoặc từ công cụ khác có múi giờ hay ngôn ngữ khác lượt 00:00 đang chạy, nó có thể coi lượt đang chạy là đã chết và chạy chồng lên, nạp trùng dữ liệu Zalo.
  Căn cứ: Chỉ xảy ra khi chạy tay trong lúc lượt đêm đang chạy, hiếm; hậu quả là nạp chồng chứ không mất dữ liệu, và lượt sau tự bắt kịp, nên có thể ghi nhận rồi sửa sau.
  file: `scripts/zalo-import-daily.sh`
  severity: medium
  Đề xuất: known-limits

- **go_khoa_cu gỡ ngay khoá vừa tạo nhưng chưa ghi PID, hai lượt nạp chạy chồng nhau (r2 · tệp đã đổi)**
  Người dùng thấy gì: Hai lượt nạp bắt đầu gần như cùng lúc có thể cùng chạy chồng nhau, làm nạp trùng dữ liệu Zalo.
  Căn cứ: Khe thời gian chỉ vài phần nghìn giây nên rất hiếm gặp, hậu quả là nạp chồng không mất dữ liệu và lượt sau bắt kịp được, nhưng sửa không đắt.
  file: `scripts/zalo-import-daily.sh`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 4 (assertion âm tính đứng một mình): ca (d) «hết hồ sơ không báo 124 giả» không có đối chứng dương rằng lượt đã đi tới vòng hồ sơ (r2 · tệp đã đổi)**
  Người dùng thấy gì: Bộ kiểm có một ca có thể xanh dù lượt nạp chết sớm, nên có thể bỏ lọt lỗi trần báo cắt nhầm khi hồ sơ đã nạp hết.
  Căn cứ: Chỉ làm bộ kiểm yếu đi chứ không ảnh hưởng người dùng trực tiếp; thêm một điều kiện đối chứng là việc rẻ, làm sau được.
  file: `scripts/zalo-import-tran-zcode.test.mjs`
  severity: medium
  Đề xuất: known-limits

- **Khoá mang PID tái dùng không bao giờ được gỡ, job nạp kẹt vô hạn (r1 · tệp đã đổi)**
  Người dùng thấy gì: Sau khi máy khởi động lại, một khoá cũ có thể bị nhận nhầm là đang chạy và các lượt nạp tin Zalo sẽ bỏ qua âm thầm cho tới khi có người gỡ khoá.
  Căn cứ: Hiếm gặp, không mất dữ liệu, người vận hành gỡ khoá bằng tay được ngay, nhưng việc nạp tin bị đứng mà không có báo lỗi.
  file: `scripts/zalo-import-daily.sh`
  severity: high
  Đề xuất: known-limits

- **Trần tổng của lượt nhanh ngắn hơn trần nạp, tồn đọng trên 20 phút không tiến được (r1 · tệp đã đổi)**
  Người dùng thấy gì: Khi có tồn đọng lớn sau một đợt đứt thu, các lượt nạp nhanh ban ngày cứ nạp lại cùng đoạn đầu và không bao giờ tiến tới bước xử lý; chỉ lượt nửa đêm mới gỡ được tồn đọng.
  Căn cứ: Không mất dữ liệu và tự hết sau lượt 00:00, nhưng tin mới chậm lên màn cả ngày khi có tồn đọng; sửa là việc riêng nhỏ.
  file: `scripts/zalo-import-daily.sh`
  severity: high
  Đề xuất: new-contract

- **Dưới launchd đồng hồ tự chết vì TERM cả nhóm, không còn SIGKILL sau ân hạn (r1 · tệp đã đổi)**
  Người dùng thấy gì: Nếu một bước nạp bị treo và không chịu dừng khi bị yêu cầu, lượt sẽ kết thúc nhưng bước treo vẫn sống và có thể chạy chồng lên lượt sau.
  Căn cứ: Chỉ xảy ra khi bước con phớt lờ tín hiệu dừng, không làm sai dữ liệu đã nạp, và có thể dọn bằng tay; nhưng khó phát hiện nên đáng một việc riêng.
  file: `scripts/zalo-import-daily.sh`
  severity: high
  Đề xuất: new-contract

- **Lệnh kiểm sau áp tìm dấu DO_KILL đã không còn trong script (r1)**
  Người dùng thấy gì: Bước kiểm tiến trình đồng hồ sót trong hướng dẫn áp lên máy thu có thể báo lệch giả hoặc không thấy đồng hồ sót thật, làm người áp bối rối.
  Căn cứ: Chỉ là bước kiểm phụ trong tài liệu, không ảnh hưởng dữ liệu, sửa một dòng hướng dẫn là xong.
  file: `_acceptance/s03-tran-thoi-gian-luot-nap/ap-may-thu/README.md`
  severity: medium
  Đề xuất: known-limits

- **do-luot-dem.sh chấm nhầm lượt trước khi lượt đêm nay dừng sớm (r1 · tệp đã đổi)**
  Người dùng thấy gì: Công cụ đo thời lượng lượt đêm có thể báo ĐẠT bằng số của đêm trước khi lượt đêm nay dừng sớm vì lỗi.
  Căn cứ: Chỉ làm số đo sau áp lạc quan trong ca hiếm, người đọc log vẫn thấy lỗi thật, không mất dữ liệu.
  file: `_acceptance/s03-tran-thoi-gian-luot-nap/ap-may-thu/do-luot-dem.sh`
  severity: medium
  Đề xuất: known-limits

- **Lượt nhanh bị trần tổng 20′ cắt trước trần nạp 30′ nên state không tiến, tồn đọng nạp lại từ đầu mỗi lượt (r1 · tệp đã đổi)**
  Người dùng thấy gì: Khi tồn đọng quá 20 phút, các lượt nhanh ban ngày lặp lại cùng đoạn và không tiến; chỉ lượt nửa đêm rút được tồn đọng.
  Căn cứ: Không mất dữ liệu và tự hết sau lượt 00:00, nhưng tin chậm lên màn khi có tồn đọng; trước nhánh này lượt nhanh không bị kẹt như vậy.
  file: `scripts/zalo-import-daily.sh`
  severity: medium
  Đề xuất: new-contract

- **Vòng hồ sơ báo TIMEOUT 124 giả khi không còn hồ sơ nào chờ nạp (r1 · tệp đã đổi)**
  Người dùng thấy gì: Lượt nạp có thể báo lỗi hết thời gian và ghi lỗi dù không còn hồ sơ nào bị hoãn, gây cảnh báo giả.
  Căn cứ: Ca hiếm (đúng lúc vượt mốc), dữ liệu không mất, lượt sau chạy lại bình thường; chỉ gây nhiễu báo lỗi.
  file: `scripts/zalo-import-daily.sh`
  severity: medium
  Đề xuất: known-limits

- **do-luot-dem.sh kết luận ĐẠT bằng số của lượt cũ khi lượt đêm mới thoát sớm (r1 · tệp đã đổi)**
  Người dùng thấy gì: Công cụ đo có thể báo ĐẠT cho một đêm mà lượt nạp hỏng sớm, vì đang đọc số của lượt cũ.
  Căn cứ: Chỉ làm bước kiểm sau áp lạc quan trong ca hiếm; lỗi thật vẫn hiện trong log, không ảnh hưởng dữ liệu.
  file: `_acceptance/s03-tran-thoi-gian-luot-nap/ap-may-thu/do-luot-dem.sh`
  severity: medium
  Đề xuất: known-limits

- **Lệnh kiểm đồng hồ sót trong README tìm dấu không tồn tại và tự khớp chính nó (r1)**
  Người dùng thấy gì: Bước kiểm đồng hồ sót trong hướng dẫn áp báo sai: có thể báo lệch dù máy sạch, hoặc không thấy đồng hồ sót thật.
  Căn cứ: Chỉ là tài liệu hướng dẫn, không đụng dữ liệu, sửa một dòng là xong.
  file: `_acceptance/s03-tran-thoi-gian-luot-nap/ap-may-thu/README.md`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 2 — Fixture viết tay đúng khuôn bên đọc: log mẫu của do-luot-dem không round-trip từ script thật, che lỗi chấm sai lượt bị cắt ở phần nạp (r1 · tệp đã đổi)**
  Người dùng thấy gì: Công cụ đo thời lượng lượt đêm có thể báo ĐẠT sai đúng ở ca sự cố 5 giờ 38 khi lượt bị cắt ở phần nạp, vì log mẫu không giống log thật.
  Căn cứ: Chỉ làm bước kiểm sau áp kém tin cậy ở một số ca cắt, không mất dữ liệu; người đọc log vẫn thấy dòng cắt.
  file: `_acceptance/s03-tran-thoi-gian-luot-nap/ap-may-thu/do-luot-dem.test.sh`
  severity: high
  Đề xuất: known-limits

- **Hình dạng 4 — Assertion âm tính một mình: lệnh kiểm «còn đồng hồ» trong README tìm một dấu không còn tồn tại, không có đối chứng dương (r1)**
  Người dùng thấy gì: Trên máy thu sau áp, không có cách kiểm đáng tin xem còn đồng hồ mồ côi hay không, vì lệnh kiểm tìm sai dấu.
  Căn cứ: Việc kiểm trên máy thật đã có test phủ trước khi gộp, và đồng hồ sót chỉ là tiến trình phụ, không mất dữ liệu.
  file: `_acceptance/s03-tran-thoi-gian-luot-nap/ap-may-thu/README.md`
  severity: high
  Đề xuất: known-limits

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).
