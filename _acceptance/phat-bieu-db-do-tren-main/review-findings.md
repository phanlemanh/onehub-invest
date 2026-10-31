## Trong hợp đồng

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **Chú thích đầu dc-tu-don.ts vẫn ghi «chỉ hai lược đồ pid chết» dù ma trận đã nâng lên sáu tiền tố**
  Người dùng thấy gì: Người dùng không thấy gì: chỉ là một dòng ghi chú trong công cụ kiểm của đội, nói sai số lược đồ so với thực tế.
  Căn cứ: Không ảnh hưởng người dùng hay dữ liệu, chỉ gây hiểu nhầm nhẹ cho người đọc mã, sửa sau rất rẻ nhưng không cần mở việc riêng.
  file: `app/scripts/dc-tu-don.ts`
  severity: low
  Đề xuất: wont-fix

- **Chiều đỏ của E7 chỉ kiểm còn khác 0, trong khi evals yêu cầu 'còn 6 lược đồ pid chết'**
  Người dùng thấy gì: Công cụ kiểm có thể báo xanh nhầm trong trường hợp bước dọn bị bỏ nhưng vẫn xoá được một phần; người dùng cuối không bị ảnh hưởng.
  Căn cứ: Chỉ làm bài kiểm nội bộ kém nhạy ở một tình huống hiếm, không mất dữ liệu, sửa sau rẻ.
  file: `app/scripts/dc-tu-don.ts`
  severity: low
  Đề xuất: known-limits

- **dc-tu-don treo vĩnh viễn thay vì báo lệch khi tiến trình test đã thoát trước lúc gắn listener 'exit'**
  Người dùng thấy gì: Khi bài kiểm dọn lược đồ gặp sự cố sớm, công cụ kiểm có thể treo thay vì báo đỏ và để lại dữ liệu tạm trên máy phát triển; người dùng cuối không bị ảnh hưởng.
  Căn cứ: Chỉ xảy ra khi chạy kiểm nội bộ trong tình huống lỗi, người vận hành thấy treo và tự dừng được, dữ liệu tạm dọn tay được.
  file: `app/scripts/dc-tu-don.ts`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 5 — tuyên ma trận sáu tiền tố × hai tín hiệu nhưng nửa «ngắt» chỉ đo thật được ô dc_local**
  Người dùng thấy gì: Phép kiểm khi bài test bị ngắt giữa chừng mới chứng minh được việc dọn một trong sáu loại lược đồ tạm; năm loại còn lại chưa được kiểm thật. Người dùng cuối không bị ảnh hưởng, chỉ có thể sót dữ liệu tạm trên máy phát triển.
  Căn cứ: Hậu quả chỉ là có thể sót lược đồ tạm ở môi trường thử, không chạm dữ liệu thật và dọn lại được ở lần chạy sau.
  file: `app/scripts/dc-tu-don.ts`
  severity: medium
  Đề xuất: known-limits

- **idem_063 không xoá DB thử sau khi chạy, lệch mẫu idem_059 (r1)**
  Người dùng thấy gì: Sau mỗi lần chạy phép đo, một bản chép dữ liệu thử nằm lại trên máy dùng chung cho tới lượt dựng lại. Người dùng cuối không bị ảnh hưởng, chỉ tốn chỗ trên máy vận hành.
  Căn cứ: Hậu quả nhẹ, chỉ tốn dung lượng máy nội bộ, tự mất ở lần dựng lại sau và người vận hành xoá tay được.
  file: `_acceptance/config.yaml`
  severity: low
  Đề xuất: known-limits

- **Executor E6 không khớp evals: lược đồ thử gieo vô điều kiện, ngoài giao dịch, và không assert phép đối chứng (r1)**
  Người dùng thấy gì: Phép đo ghi lại một lược đồ thử ở lại DB thử và để người đọc tự nhìn số đối chứng. Không ảnh hưởng dữ liệu hay màn hình của người dùng.
  Căn cứ: Chỉ lệch giữa mô tả và cách chạy của phép đo nội bộ, không mất dữ liệu, sửa lại câu chữ hoặc thêm so sánh sau này vẫn rẻ.
  file: `_acceptance/config.yaml`
  severity: low
  Đề xuất: known-limits

- **HAM_063 cắt theo indexOf mà không chặn trường hợp mất dấu mục (r1)**
  Người dùng thấy gì: Nếu sau này ai đổi chữ đánh dấu trong tệp sửa dữ liệu, bộ test có thể chạy nhầm phần sửa dữ liệu mà không báo lỗi. Hiện chưa xảy ra và chỉ ảnh hưởng môi trường thử.
  Căn cứ: Chỉ nổ khi có người sửa tệp trong tương lai và chỉ chạm môi trường thử, không đụng dữ liệu thật.
  file: `pipeline/lib/nap-045.mjs`
  severity: low
  Đề xuất: known-limits

- **063 phân xử lại tin chung post nhưng không cascade sang căn (properties) của các tin đó (r1)**
  Người dùng thấy gì: Khi hai tin chung một bài đăng, số phòng ngủ, phòng tắm hay tên đường của tin thứ hai được sửa nhưng căn nhà gắn với tin đó có thể vẫn giữ số cũ, và không có dấu vết ghi lại. Người xem căn đó có thể thấy thông tin lệch so với tin rao.
  Căn cứ: Dữ liệu căn có thể lệch âm thầm và không có nhật ký, nhưng chỉ ở các tin chung bài đăng và sửa được bằng một đợt riêng sau này.
  file: `db/migrations/063_phat_bieu_theo_bai_dang.sql`
  severity: medium
  Đề xuất: new-contract

- **Bộ xử lý SIGTERM/SIGINT đua với before() đang chạy: lược đồ tạo sau lúc xoá vẫn nằm lại, lỗi bị nuốt (r1)**
  Người dùng thấy gì: Hiếm khi, nếu test bị ngắt đúng lúc đang dựng, một lược đồ tạm có thể sót lại trên DB dùng chung cho tới lần test sau mới dọn. Người dùng cuối không thấy gì.
  Căn cứ: Rất hiếm, chỉ để sót đồ tạm trên máy nội bộ và lần chạy sau tự dọn, không mất hay lộ dữ liệu.
  file: `app/tests/dong-chay-cloud.test.tsx`
  severity: low
  Đề xuất: known-limits

- **Hình dạng 4 (âm-tính-một-mình, không ghim đối chứng): E6 chỉ in tiền đề và đối chứng PD-AC-1 ra màn hình, kết quả không phụ thuộc vào chúng (r1)**
  Người dùng thấy gì: Phép đo có thể báo đạt mà không chứng minh được rằng cách kiểm cũ sẽ đỏ trên dữ liệu này. Người dùng cuối không bị ảnh hưởng, chỉ giảm độ tin của bằng chứng nghiệm thu.
  Căn cứ: Không ảnh hưởng người dùng hay dữ liệu, chỉ làm bằng chứng yếu hơn, bổ sung phép so sánh sau này rẻ.
  file: `_acceptance/config.yaml`
  severity: medium
  Đề xuất: known-limits

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).
