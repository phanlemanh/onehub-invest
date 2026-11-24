## Trong hợp đồng

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **Đầu migration 117 ghi cách lùi trái ngược với lui-117.sql và hồ sơ áp: bảo áp lại khối 2, 3 của 113, mà làm vậy sẽ lỗi**
  Người dùng thấy gì: Dòng hướng dẫn lùi ở đầu migration nói sai so với hồ sơ áp. Người vận hành làm theo dòng đó khi cần lùi sẽ gặp lỗi giữa chừng trên DB máy thu, còn đường lùi đúng nằm ở hồ sơ áp.
  Căn cứ: Chỉ là chỉ dẫn sai trong chú thích, không mất hay lộ dữ liệu, và hồ sơ áp đã ghi đúng nên ghi lại thành giới hạn đã biết là đủ.
  file: `db/migrations/117_ghep_toa_tren_tin.sql`
  severity: low
  Đề xuất: known-limits

- **Header migration 117 ghi cách lùi «áp lại khối 2 và 3 của 113», làm theo thì lỗi**
  Người dùng thấy gì: Chú thích đầu migration chỉ cách lùi sai, ai làm theo sẽ bị DB từ chối ở giữa lúc lùi. Cách lùi đúng đã có ở hồ sơ áp.
  Căn cứ: Hậu quả nhẹ vì lỗi hiện ra ngay và không làm hỏng dữ liệu, người vận hành có thể dừng và dùng hồ sơ áp, nên chỉ cần ghi vết.
  file: `db/migrations/117_ghep_toa_tren_tin.sql`
  severity: low
  Đề xuất: known-limits

- **lat-nhan --rut vòng 2: phép kiểm cây bẩn dùng đường dẫn tương đối theo thư mục đang đứng, chạy từ gốc kho thì kiểm nhầm thư mục**
  Người dùng thấy gì: Nếu chạy lệnh rút mẫu từ sai thư mục, hệ thống có thể không phát hiện mã chưa commit, và tệp mẫu ghi nhận sai là sinh từ mã đã commit. Chạy đúng theo gói lệnh thì không gặp.
  Căn cứ: Chỉ xảy ra khi người chạy đứng sai chỗ, tài liệu chạy đã chỉ đúng và lát mẫu có thể rút lại, nên hậu quả nhẹ.
  file: `pipeline/scripts/ghep-tin-danh-muc-lat-nhan.mjs`
  severity: low
  Đề xuất: known-limits

- **Hình dạng 3 (chỉ so số lượng trong khi lời hứa là quan hệ giữa hai tập): do-phu.mjs đối chiếu phép đếm độc lập bằng hiệu hai cỡ tập**
  Người dùng thấy gì: Phép đối chiếu độ phủ chỉ so tổng số tin gắn được, nên hai cách đếm gắn các tin khác nhau mà tổng bằng nhau vẫn qua. Con số độ phủ trên màn vẫn đúng về tổng.
  Căn cứ: Lệch tập mà đúng tổng là hiếm, không làm mất dữ liệu, và phép chấm chất lượng riêng vẫn kiểm từng bài.
  file: `_acceptance/ghep-tin-vao-danh-muc/probes/do-phu.mjs`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 2 (không đi vòng ghi rồi đọc): chiều đỏ «đổi một nút thì đỏ vì băm» của E9 chỉ đo phía ghi**
  Người dùng thấy gì: Chưa có phép thử nào chứng minh lệnh chấm thật sự báo đỏ khi ai đó sửa tay tệp mẫu đã đóng băng. Nếu phần kiểm đó bị bỏ, các phép đo vẫn xanh.
  Căn cứ: Chỉ làm yếu một lớp bảo vệ chống sửa mẫu, không gây hại trực tiếp cho người dùng, và thêm ca thử sau cũng rẻ.
  file: `pipeline/scripts/ghep-tin-danh-muc-lat-nhan.test.mjs`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 2/5 (bảng ô viết tay, phần đối chiếu dữ liệu thật thiếu ô): E1/E3 tuyên bố mỗi ô rút từ dữ liệu thật**
  Người dùng thấy gì: Một vài loại ca trong bảng thử chưa được chứng minh là có thật trên dữ liệu máy thu. Việc gắn tin vẫn chạy đúng các ca đã thử.
  Căn cứ: Chỉ là độ phủ bằng chứng chưa trọn, không ảnh hưởng dữ liệu hay người dùng, và bổ sung sau không tốn nhiều.
  file: `pipeline/tests/ghep-tin-danh-muc-doc.itest.mjs`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 4 (chiều đỏ thoát 1 vô điều kiện, thông điệp không ghim đúng bài vừa cấy): khong-pha --cay-bai-thu**
  Người dùng thấy gì: Phép thử cấy bài thử luôn báo đỏ dù có thấy đúng bài vừa cấy hay không. Nó chưa chứng minh được là phát hiện đúng bài đó.
  Căn cứ: Chỉ làm yếu một phép thử âm tính, không ảnh hưởng dữ liệu thật, và đường nạp vẫn được kiểm bằng phép đo khác.
  file: `_acceptance/ghep-tin-vao-danh-muc/probes/khong-pha.mjs`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 4 (kiểm âm tính không có đối chứng dương): «cấy dòng của rule_id khác thì tử số không đổi» trong do-phu.mjs**
  Người dùng thấy gì: Phép thử cấy luật lạ chưa có ca đối chứng cho thấy luật hợp lệ cùng chỗ cấy thì làm số tăng. Số độ phủ hiển thị vẫn tính đúng các luật của hàng.
  Căn cứ: Rủi ro thấp vì đột biến ở lớp thử khác đã đóng vai đối chứng, không ảnh hưởng người dùng.
  file: `_acceptance/ghep-tin-vao-danh-muc/probes/do-phu.mjs`
  severity: low
  Đề xuất: known-limits

- **Hình dạng 6 (đo trạng thái riêng của máy tác giả thay vì cây đang kiểm): cham-tap-test.sh gắn n1 vào một DB đặt tên cứng**
  Người dùng thấy gì: Phép chấm nhóm n1 phụ thuộc một bản chép DB chỉ có trên máy tác giả, nên ở máy khác hoặc sau khi dọn thì không tái lập được. Kết quả đã chấm vẫn giữ.
  Căn cứ: Không mất dữ liệu và hợp đồng đã ghi rõ lý do dùng bản chép này, chỉ khó chạy lại trên máy khác.
  file: `_acceptance/ghep-tin-vao-danh-muc/probes/cham-tap-test.sh`
  severity: low
  Đề xuất: known-limits

## Chưa adversarial-verify (refuter chết)

⚠ Cụm ngoài vùng phủ: 5/9 lỗi rơi vào file không bộ đo nào phủ (_acceptance/ghep-tin-vao-danh-muc/probes/do-phu.mjs, pipeline/tests/ghep-tin-danh-muc-doc.itest.mjs, _acceptance/ghep-tin-vao-danh-muc/probes/khong-pha.mjs, _acceptance/ghep-tin-vao-danh-muc/probes/cham-tap-test.sh) — dừng và quyết: mở rộng hợp đồng hay rút phạm vi.
