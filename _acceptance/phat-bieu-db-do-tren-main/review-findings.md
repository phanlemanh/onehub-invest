## Trong hợp đồng

- **Hình dạng 5 (tuyên quét LỚP nhưng chỉ có điểm-case): E7 chỉ gieo 2/6 tiền tố và chỉ thử SIGTERM, không thử SIGINT**
  AC: AC-7
  file: `app/scripts/dc-tu-don.ts:158`
  severity: medium
  source: measurement
  detail: Hỏi-2 đã chốt (decisions.jsonl d-...-10) và AC-7 hứa test tự dọn cả sáu tiền tố dc_(local|cloud|noflow|ta|mut|mig)_<pid chết>, và tự dọn khi bị ngắt bằng «SIGTERM hay SIGINT». Phép đo lại chỉ gieo `dc_cloud_${d}` và `dc_local_${d}` (dòng 158, và 188 ở chiều đỏ). Bốn tiền tố noflow/ta/mut/mig không có ca nào. Phần ngắt chỉ gọi `con.kill("SIGTERM")` (dòng 173), không có ca SIGINT, dù test đăng ký handler cho cả hai tín hiệu trong vòng `for (const [sig, ma] of [["SIGTERM",143],["SIGINT",130]])`. Nếu sửa LUOC_DO_TAM để bỏ một tiền tố như `ta`, hoặc làm hỏng nhánh SIGINT, E7 vẫn xanh. Số assert không bằng số phần tử của lớp đã hứa (6 tiền tố × 2 tín hiệu), và không có ma trận viết trước.
  rationale: AC-7 hứa dọn lược đồ của tiến trình chết theo tiền tố của Hỏi-2 và dọn khi bị ngắt bằng SIGTERM hay SIGINT, mà phép đo chỉ phủ hai tiền tố và một tín hiệu.

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **idem_063 không xoá DB thử sau khi chạy, lệch mẫu idem_059**
  Người dùng thấy gì: Sau mỗi lần chạy phép đo, một bản chép dữ liệu thử nằm lại trên máy dùng chung cho tới lượt dựng lại. Người dùng cuối không bị ảnh hưởng, chỉ tốn chỗ trên máy vận hành.
  Căn cứ: Hậu quả nhẹ, chỉ tốn dung lượng máy nội bộ, tự mất ở lần dựng lại sau và người vận hành xoá tay được.
  file: `_acceptance/config.yaml`
  severity: low
  Đề xuất: known-limits

- **Executor E6 không khớp evals: lược đồ thử gieo vô điều kiện, ngoài giao dịch, và không assert phép đối chứng**
  Người dùng thấy gì: Phép đo ghi lại một lược đồ thử ở lại DB thử và để người đọc tự nhìn số đối chứng. Không ảnh hưởng dữ liệu hay màn hình của người dùng.
  Căn cứ: Chỉ lệch giữa mô tả và cách chạy của phép đo nội bộ, không mất dữ liệu, sửa lại câu chữ hoặc thêm so sánh sau này vẫn rẻ.
  file: `_acceptance/config.yaml`
  severity: low
  Đề xuất: known-limits

- **HAM_063 cắt theo indexOf mà không chặn trường hợp mất dấu mục**
  Người dùng thấy gì: Nếu sau này ai đổi chữ đánh dấu trong tệp sửa dữ liệu, bộ test có thể chạy nhầm phần sửa dữ liệu mà không báo lỗi. Hiện chưa xảy ra và chỉ ảnh hưởng môi trường thử.
  Căn cứ: Chỉ nổ khi có người sửa tệp trong tương lai và chỉ chạm môi trường thử, không đụng dữ liệu thật.
  file: `pipeline/lib/nap-045.mjs`
  severity: low
  Đề xuất: known-limits

- **063 phân xử lại tin chung post nhưng không cascade sang căn (properties) của các tin đó**
  Người dùng thấy gì: Khi hai tin chung một bài đăng, số phòng ngủ, phòng tắm hay tên đường của tin thứ hai được sửa nhưng căn nhà gắn với tin đó có thể vẫn giữ số cũ, và không có dấu vết ghi lại. Người xem căn đó có thể thấy thông tin lệch so với tin rao.
  Căn cứ: Dữ liệu căn có thể lệch âm thầm và không có nhật ký, nhưng chỉ ở các tin chung bài đăng và sửa được bằng một đợt riêng sau này.
  file: `db/migrations/063_phat_bieu_theo_bai_dang.sql`
  severity: medium
  Đề xuất: new-contract

- **Bộ xử lý SIGTERM/SIGINT đua với before() đang chạy: lược đồ tạo sau lúc xoá vẫn nằm lại, lỗi bị nuốt**
  Người dùng thấy gì: Hiếm khi, nếu test bị ngắt đúng lúc đang dựng, một lược đồ tạm có thể sót lại trên DB dùng chung cho tới lần test sau mới dọn. Người dùng cuối không thấy gì.
  Căn cứ: Rất hiếm, chỉ để sót đồ tạm trên máy nội bộ và lần chạy sau tự dọn, không mất hay lộ dữ liệu.
  file: `app/tests/dong-chay-cloud.test.tsx`
  severity: low
  Đề xuất: known-limits

- **Hình dạng 4 (âm-tính-một-mình, không ghim đối chứng): E6 chỉ in tiền đề và đối chứng PD-AC-1 ra màn hình, kết quả không phụ thuộc vào chúng**
  Người dùng thấy gì: Phép đo có thể báo đạt mà không chứng minh được rằng cách kiểm cũ sẽ đỏ trên dữ liệu này. Người dùng cuối không bị ảnh hưởng, chỉ giảm độ tin của bằng chứng nghiệm thu.
  Căn cứ: Không ảnh hưởng người dùng hay dữ liệu, chỉ làm bằng chứng yếu hơn, bổ sung phép so sánh sau này rẻ.
  file: `_acceptance/config.yaml`
  severity: medium
  Đề xuất: known-limits

⚠ Cụm ngoài vùng phủ: 3/7 lỗi rơi vào file không bộ đo nào phủ (_acceptance/config.yaml) — dừng và quyết: mở rộng hợp đồng hay rút phạm vi.
