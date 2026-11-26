# Review findings: data-api-dong-khi-thieu-khoa (round 3)

## Trong hợp đồng

(không có finding nào map được vào AC)

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **Bộ bọc console cài SAU khi nạp app nên logger() của hono không đi qua `gom`, trái với chú thích; phép kiểm kênh «console.log» tự thoả bằng console.log của chính test**
  Người dùng thấy gì: Phép kiểm «khoá không bị in ra log» chưa phủ dòng log tự động của máy chủ, nên nếu sau này dòng đó lộ khoá thì bài kiểm vẫn báo xanh. Hiện dòng này chỉ in phương thức, đường dẫn và mã trạng thái.
  Căn cứ: Dòng log đó hiện chỉ in thông tin không nhạy cảm nên người dùng chưa bị lộ gì; lỗ hổng chỉ là bài kiểm chưa soi hết, ghi lại làm hạn chế đã biết là đủ.
  file: `data-api/test/auth-dong.test.ts`
  severity: medium
  Đề xuất: known-limits

- **Bộ gom console của AC-6 biến mọi đối số không phải chuỗi thành JSON.stringify: Error, Map, Set thành "{}", nên khoá lộ qua console.error(err) không bị bắt**
  Người dùng thấy gì: Nếu sau này có người ghi lỗi theo kiểu in nguyên đối tượng lỗi chứa khoá, bài kiểm hiện tại có thể không phát hiện. Với mã hiện tại, khoá không bị in ra.
  Căn cứ: Rủi ro chỉ xuất hiện khi mã log đổi trong tương lai, không ảnh hưởng người dùng hôm nay, và bài kiểm có thể được củng cố ở lượt sau với chi phí thấp.
  file: `data-api/test/auth-dong.test.ts`
  severity: medium
  Đề xuất: known-limits

- **stdout/stderr của tiến trình con được chốt lúc có sự kiện 'exit', trước khi luồng stdio đóng, nên phần ghi sau cùng có thể không vào bộ gom**
  Người dùng thấy gì: Bài kiểm có thể bỏ sót vài dòng cuối mà máy chủ in ra lúc tắt, nên một lần lộ khoá ở đúng chỗ đó sẽ không bị bắt. Chưa có dấu hiệu máy chủ làm vậy.
  Căn cứ: Khả năng xảy ra thấp và không làm mất hay lộ dữ liệu của người dùng; chỉ làm bài kiểm kém chặt, nên ghi nhận chứ không cần chặn việc giao.
  file: `data-api/test/auth-dong.test.ts`
  severity: low
  Đề xuất: known-limits

- **Hình dạng 4 (âm tính một mình): kênh stdout của tiến trình con không có đối chứng dương, phép «đã gom kênh stdout» đúng ngay cả khi ống stdout chết**
  Người dùng thấy gì: Bài kiểm «khoá không lộ ra màn hình của máy chủ» có thể xanh dù thực tế không thu được chữ nào từ màn hình đó. Hành vi thật của máy chủ không bị ảnh hưởng.
  Căn cứ: Không ảnh hưởng người dùng cuối và không làm lộ dữ liệu; chỉ làm giảm độ tin cậy của một phép kiểm, sửa được sau với chi phí nhỏ.
  file: `data-api/test/auth-dong.test.ts`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 4 (âm tính một mình): ca gửi khoá đúng tới máy chủ thật chỉ loại trừ 401/503, không ghim mã mong đợi**
  Người dùng thấy gì: Bài kiểm gửi khoá đúng tới máy chủ thật chỉ xác nhận là không bị từ chối vì thiếu khoá, chưa xác nhận lời gọi trả kết quả bình thường. Các ca khác đã kiểm trường hợp thành công.
  Căn cứ: Trường hợp khoá đúng nhận kết quả bình thường đã được kiểm ở chỗ khác, nên người dùng không có rủi ro mới; chỉ là phép kiểm bổ sung hơi lỏng.
  file: `data-api/test/auth-dong.test.ts`
  severity: low
  Đề xuất: known-limits

- **README công khai vẫn hướng dẫn tự host bằng Docker và PaaS mà không đặt DATA_API_KEYS, nên làm theo đúng hướng dẫn thì máy chủ không khởi động hoặc trả 503 (r2)**
  Người dùng thấy gì: Người ngoài làm theo hướng dẫn tự cài trong tài liệu công khai sẽ thấy máy chủ không chạy hoặc trả lỗi 503 vì thiếu khoá, dù bảng biến môi trường đã nói đúng.
  Căn cứ: Chỉ làm người tự cài vướng một lần lúc dựng, không mất hay lộ dữ liệu, họ tự khắc phục được khi đọc thông báo lỗi, và sửa tài liệu rất rẻ.
  file: `data-api/README.md`
  severity: medium
  Đề xuất: known-limits

- **pham-vi.mjs không bao giờ nhận ra HT19 đã vào main khi main gộp kiểu squash, nên báo vi phạm AC-8 giả sau khi nhánh đồng bộ main (r2)**
  Người dùng thấy gì: Công cụ kiểm phạm vi có thể báo đỏ nhầm đúng lúc chuẩn bị gộp, làm người duyệt mất thời gian dò lại; sản phẩm đến tay người dùng không bị ảnh hưởng.
  Căn cứ: Hậu quả chỉ là báo động giả cho người duyệt, không đụng đến người dùng cuối hay dữ liệu, và người duyệt tự nhận ra được khi đối chiếu danh sách tệp.
  file: `_acceptance/data-api-dong-khi-thieu-khoa/probes/pham-vi.mjs`
  severity: medium
  Đề xuất: known-limits

- **README vẫn hướng dẫn chạy Docker/Vercel không có DATA_API_KEYS, nay server thoát ngay hoặc trả 503 mọi route (r2)**
  Người dùng thấy gì: Người dựng API theo hướng dẫn Docker hoặc Vercel trong tài liệu sẽ gặp máy chủ thoát ngay hoặc trả 503, vì hướng dẫn chưa nhắc đặt khoá.
  Căn cứ: Gây vướng lúc dựng nhưng không làm lộ hay mất dữ liệu, thông báo lỗi nói rõ thiếu khoá, và sửa tài liệu rất rẻ.
  file: `data-api/README.md`
  severity: low
  Đề xuất: known-limits

- **pha.mjs gọi process.exit(2) trong khối try nên bỏ qua finally, để lại thư mục tạm (r2)**
  Người dùng thấy gì: Khi công cụ kiểm thất bại ở một nhánh lỗi hiếm, nó để lại một thư mục tạm trên máy người chạy kiểm; người dùng sản phẩm không bị ảnh hưởng.
  Căn cứ: Chỉ tốn một ít đĩa tạm trên máy người chấm, hệ điều hành tự dọn được, không ảnh hưởng người dùng hay dữ liệu.
  file: `_acceptance/data-api-dong-khi-thieu-khoa/probes/pha.mjs`
  severity: low
  Đề xuất: wont-fix

- **Hình dạng 4 (không ghim thông điệp): pha.mjs nhận một ca là «bản cũ đỏ» chỉ theo tên ca, không theo thông điệp hỏng (r2)**
  Người dùng thấy gì: Phép kiểm chiều đỏ trên bản cũ có thể coi là đạt dù ca đỏ vì lý do khác; điều này làm bằng chứng yếu đi chứ không làm sản phẩm sai.
  Căn cứ: Chỉ làm bằng chứng nghiệm thu kém chặt, không đụng người dùng hay dữ liệu, và có bản chạy trên cây thật xanh làm đối chứng gián tiếp.
  file: `_acceptance/data-api-dong-khi-thieu-khoa/probes/pha.mjs`
  severity: low
  Đề xuất: known-limits

## Chưa adversarial-verify (refuter chết)

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).
