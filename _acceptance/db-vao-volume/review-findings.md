# Review findings: db-vao-volume (round 1)

## Trong hợp đồng

(không có finding nào map được vào AC)

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **Runbook bỏ sót job launchd tự chạy compose cũ từ checkout chính, và sai về chuyện bản lùi chỉ bị trùng cổng**
  Người dùng thấy gì: Sổ tay vận hành chưa nói rõ rằng công việc tuần chủ nhật 19:30 tự chạy bằng cấu hình cũ nếu bản sửa chưa vào nhánh chính trước 01/11. Nếu quên hạn đó, công việc này có thể làm bản lùi của cơ sở dữ liệu biến mất đúng lúc ta cần nó.
  Căn cứ: Rủi ro chỉ xảy ra trong một khoảng ngắn và dữ liệu thật vẫn nằm an toàn trong kho lưu trữ mới cùng bản sao lưu lạnh; sửa tài liệu rất rẻ nên ghi nhận như hạn chế đã biết kèm hạn 01/11 là đủ.
  file: `docs/ops/db-volume.md`
  severity: medium
  Đề xuất: known-limits

- **db-sao-luu.sh chỉ chặn thư mục trong worktree hiện tại và checkout chính, không chặn worktree khác của cùng kho**
  Người dùng thấy gì: Lệnh sao lưu vẫn cho ghi bản sao lưu vào thư mục của một bản làm việc khác của kho, ví dụ bản của ZCode. Bản sao lưu chứa dữ liệu hồ sơ người dùng nhạy cảm, nên nếu ai đó lỡ commit thư mục này thì dữ liệu có thể bị đẩy ra ngoài.
  Căn cứ: Chỉ xảy ra khi người chạy chủ động chọn đúng thư mục sai, và hậu quả nặng chỉ khi họ còn commit nó; thủ tục vận hành đã dặn để bản sao lưu trên đĩa máy này nên ghi nhận hạn chế là hợp lý.
  file: `scripts/db-sao-luu.sh`
  severity: low
  Đề xuất: known-limits

- **Runbook liệt kê thiếu tiền điều kiện «không phiên DB đang chạy / nối DB phụ»**
  Người dùng thấy gì: Sổ tay không nhắc rằng lệnh chuyển sẽ từ chối khi còn người hoặc công việc đang dùng cơ sở dữ liệu. Người vận hành có thể bị từ chối mà không hiểu lý do ngay.
  Căn cứ: Lệnh tự in lý do từ chối và không làm gì hỏng, nên người dùng tự gỡ được bằng cách đọc thông báo; chỉ là thiếu sót tài liệu nhẹ.
  file: `docs/ops/db-volume.md`
  severity: low
  Đề xuất: known-limits

- **Chế độ live đòi bản lùi tồn tại mãi, nên sẽ đỏ giả sau khi xoá bản lùi theo kế hoạch hoặc sau khi chạy --lui**
  Người dùng thấy gì: Sau khi dọn bản lùi theo kế hoạch (sau 05/11), phép kiểm tình trạng sẽ báo đỏ dù dữ liệu vẫn nằm đúng chỗ. Người trực có thể hoảng vì báo động giả hoặc quen bỏ qua màu đỏ.
  Căn cứ: Không mất dữ liệu và chỉ là báo động giả sau một mốc đã biết trước; nên sửa cùng lúc với việc xoá bản lùi, là một việc riêng.
  file: `scripts/db-volume-check.sh`
  severity: medium
  Đề xuất: new-contract

- **Lưới chặn «không loại bảng canonical» bỏ sót public.listing_records, còn hai mục sale_offers/listings thì không bao giờ khớp**
  Người dùng thấy gì: Lưới bảo vệ chưa canh bảng tin rao nền, nên sau này nếu ai đó vô tình loại bảng này khỏi phép so số dòng lúc chuyển thì sẽ không bị chặn. Lượt chuyển thật đã xong, nên hiện chưa gây mất dữ liệu.
  Căn cứ: Lượt chuyển đã chạy xong với số dòng khớp, nên rủi ro chỉ còn với lần chuyển trong tương lai và có thể thêm lại dễ dàng khi có lượt chuyển mới.
  file: `scripts/db-volume-check.sh`
  severity: medium
  Đề xuất: known-limits

- **check_loai_tru có thể xanh suông khi không trích được danh sách loại trừ**
  Người dùng thấy gì: Phép kiểm có thể báo xanh dù thực ra không đọc được danh sách bảng bị loại. Nếu định dạng tệp đổi trong tương lai, lưới bảo vệ lặng lẽ mất tác dụng.
  Căn cứ: Chỉ phát sinh sau khi có người đổi cấu trúc tệp, không ảnh hưởng dữ liệu hiện tại và dễ phát hiện khi đọc lại bằng chứng.
  file: `scripts/db-volume-check.sh`
  severity: low
  Đề xuất: known-limits

- **db-sao-luu bỏ qua im lặng việc dump các DB khác khi truy vấn liệt kê DB lỗi**
  Người dùng thấy gì: Nếu bước liệt kê các cơ sở dữ liệu bị lỗi, bản sao lưu vẫn báo thành công nhưng thiếu các cơ sở dữ liệu phụ như của ZCode. Người dùng chỉ biết thiếu khi cần khôi phục.
  Căn cứ: Cơ sở dữ liệu chính vẫn được sao lưu và khôi phục kiểm chứng, lỗi liệt kê hiếm gặp; nhưng nó hỏng theo hướng im lặng nên nên được ghi lại.
  file: `scripts/db-sao-luu.sh`
  severity: low
  Đề xuất: known-limits

- **Tiền điều kiện «không phiên nào đang chạy» báo PASS khi chính truy vấn pg_stat_activity lỗi**
  Người dùng thấy gì: Khi lệnh chuyển không kiểm tra được ai đang dùng cơ sở dữ liệu, nó vẫn coi như không có ai. Nếu có người dùng, lúc dừng cụm có thể cắt ngang công việc của họ.
  Căn cứ: Lượt chuyển thật đã hoàn tất và không lặp lại thường xuyên; việc cắt ngang phiên chỉ gây gián đoạn chứ không làm mất dữ liệu đã lưu.
  file: `scripts/db-chuyen-volume.sh`
  severity: low
  Đề xuất: known-limits

- **Hình dạng 4 (assertion âm tính một mình): đối chứng «container kiểu cũ tạo lại thì mất dữ liệu» có thể xanh mà không đo gì**
  Người dùng thấy gì: Phép thử chứng minh cách cũ gây mất dữ liệu có thể báo đạt mà thực chất chưa đo gì. Do đó bằng chứng này yếu hơn vẻ ngoài của nó.
  Căn cứ: Không ảnh hưởng đến dữ liệu thật hay vận hành, chỉ làm một bằng chứng đối chứng kém tin cậy; việc chuyển đã được chứng bằng các phép đo khác.
  file: `scripts/db-volume-check.sh`
  severity: high
  Đề xuất: known-limits

- **Hình dạng 4 (assertion âm tính một mình): ca don-khi-loi xanh cả khi lượt con chưa từng dựng cụm**
  Người dùng thấy gì: Phép thử dọn dẹp khi bị ngắt giữa chừng có thể báo đạt dù chưa hề ngắt đúng lúc có tài nguyên. Ta chưa chắc cơ chế dọn thật sự được thử.
  Căn cứ: Lỗi nằm ở độ tin cậy của bằng chứng, không làm mất dữ liệu; cơ sở dữ liệu thật không bị chạm trong tập dượt nên hậu quả nhẹ.
  file: `scripts/db-volume-check.sh`
  severity: high
  Đề xuất: known-limits

- **Hình dạng 4 (assertion âm tính một mình): «compose từ đường khác không tạo lại container» xanh cả khi up -d lỗi**
  Người dùng thấy gì: Phép thử chạy cấu hình từ thư mục khác có thể báo đạt dù lệnh đã thất bại. Chiều ổn định của cấu hình do đó được chứng yếu hơn.
  Căn cứ: Chỉ làm bằng chứng phụ kém chặt, không ảnh hưởng dữ liệu; chi phí sửa nhỏ nhưng lợi ích thấp.
  file: `scripts/db-volume-check.sh`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 5 (tuyên quét lớp nhưng chỉ có điểm-case): «mỗi DB không template» kiểm bằng danh sách gõ tay, kèm PASS in vô điều kiện**
  Người dùng thấy gì: Phép thử sao lưu chỉ kiểm vài cơ sở dữ liệu theo danh sách gõ tay và dòng đạt luôn được in. Một cơ sở dữ liệu phụ khác bị thiếu sẽ không bị phát hiện.
  Căn cứ: Hiện chỉ có vài cơ sở dữ liệu đã biết nên rủi ro thấp; sửa là việc cải thiện bằng chứng, không cứu được dữ liệu nào.
  file: `scripts/db-volume-check.sh`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 3 (assert vắng chuỗi trong khi lời hứa là quan hệ): E15 «còn ≥1 bảng được so» không được đo**
  Người dùng thấy gì: Phép kiểm chưa bảo đảm rằng sau khi loại bảng vẫn còn ít nhất một bảng để so số dòng. Về lý thuyết ai đó có thể loại hết mà vẫn thấy xanh.
  Căn cứ: Cần một thay đổi cố ý mới có thể xảy ra và các bảng canonical đã được chặn nên khả năng thực tế rất thấp.
  file: `scripts/db-volume-check.sh`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 5 (lớp 4 bảng canonical, chỉ 1 điểm-case đột biến)**
  Người dùng thấy gì: Phép thử đột biến chỉ thử loại một trong bốn bảng quan trọng, ba bảng còn lại không có ca thử riêng. Nếu lưới bảo vệ hỏng riêng cho bảng đó thì ta không biết.
  Căn cứ: Cùng một cơ chế kiểm cho cả bốn bảng nên rủi ro hỏng riêng lẻ thấp, và thêm ca thử tốn công hơn nhiều so với lợi ích.
  file: `scripts/db-volume-check.sh`
  severity: low
  Đề xuất: wont-fix

- **Hình dạng 2 (fixture viết tay đúng khuôn bên đọc): ca «tiến trình job đang chạy» thay mẫu nhận diện của script bằng mẫu của chính phép thử**
  Người dùng thấy gì: Phép thử chưa kiểm bộ nhận diện công việc đang chạy thật của lệnh chuyển, chỉ kiểm một bộ nhận diện do chính phép thử đặt. Nếu bộ thật nhận sai thì lệnh có thể không dừng khi một công việc đang ghi dữ liệu.
  Căn cứ: Lượt chuyển thật đã xong và còn kiểm cửa sổ giờ của các công việc nên rủi ro chồng chéo thấp; sửa là tăng độ tin cậy của bằng chứng.
  file: `scripts/db-volume-check.sh`
  severity: medium
  Đề xuất: known-limits

## Chưa adversarial-verify (refuter chết)

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).
