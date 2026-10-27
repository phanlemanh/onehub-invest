# Review findings — phat-bieu-va-phan-xu (round 3)

## Trong hợp đồng

Không có finding mới ở round này.

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

Không có mục mới ở round này (các mục mang từ round trước do máy tự chèn, không in lại).

- **revert_enrichment không hoàn tác được đề xuất đã áp trước 045 sau khi cắt chuyển (bị bỏ qua lặng lẽ với lý do 'no-assertion') (r1)**
  Người dùng thấy gì: Những giá trị tự động điền trước đợt chuyển đổi này sẽ không hoàn tác được bằng công cụ hoàn tác; ô vẫn giữ giá trị sai và công cụ chỉ lặng lẽ bỏ qua.
  Căn cứ: Chỉ ảnh hưởng một số giá trị cũ đã điền trước ngày chuyển, không làm mất dữ liệu, và việc xử lý đề xuất cũ đã được hợp đồng giao cho vòng sau.
  file: `db/migrations/045_phat_bieu_va_phan_xu.sql`
  severity: medium
  Đề xuất: known-limits

- **transform-chotot không bọc giao dịch: tin S06 mới được commit với property_type/bedrooms NULL tới cuối lượt, lượt hỏng giữa chừng thì chúng ở lại NULL (r1)**
  Người dùng thấy gì: Nếu một lượt nạp tin từ nguồn S06 hỏng giữa chừng, các tin mới có thể nằm lại với loại hình và số phòng ngủ trống cho tới lượt chạy thành công kế tiếp.
  Căn cứ: Chỉ xảy ra khi lượt nạp hỏng giữa chừng, và chỉ cần chạy lại lượt kế tiếp là các ô được điền đầy, không mất dữ liệu.
  file: `pipeline/transform-chotot.mjs`
  severity: low
  Đề xuất: known-limits

- **Executor đo PL15 trong config không chốt DATABASE_URL vào DB thử, mặc định chạy trên DB dùng chung 'oneinvest', trái luật đo 27/10 (r1)**
  Người dùng thấy gì: Nếu chạy phép đo từ một máy hoặc phiên khác chưa cấu hình đúng, việc nạp thay đổi cấu trúc có thể khoá cơ sở dữ liệu dùng chung một lúc.
  Căn cứ: Chỉ xảy ra khi chạy sai môi trường, khoá chỉ kéo dài trong lúc đo và tự hết, không làm mất dữ liệu; hiện đã có rào ở máy này.
  file: `_acceptance/config.yaml`
  severity: low
  Đề xuất: known-limits

- **revert_enrichment cannot undo proposals applied before 045 and skips them silently ('no-assertion'); the CLI still exits 0 (r1)**
  Người dùng thấy gì: Công cụ hoàn tác báo đã xử lý nhưng thực tế bỏ qua mọi đề xuất áp trước đợt chuyển đổi, người vận hành không thấy lỗi nên dễ tưởng đã hoàn tác xong.
  Căn cứ: Giá trị cũ vẫn còn nguyên và có thể xử lý sau khi vòng kế tiếp đưa đề xuất cũ vào hệ thống mới; chỉ nguy cơ là người vận hành hiểu nhầm kết quả.
  file: `db/migrations/045_phat_bieu_va_phan_xu.sql`
  severity: high
  Đề xuất: known-limits

- **enrich-revert --dry predicts outcomes that no longer match revert_enrichment 045 (r1)**
  Người dùng thấy gì: Bản xem trước của công cụ hoàn tác có thể báo kết quả khác với lần chạy thật, nên người vận hành quyết định dựa trên thông tin chưa chính xác.
  Căn cứ: Chỉ là bản xem trước, không ghi gì vào dữ liệu và lần chạy thật vẫn đúng; sửa sau rẻ.
  file: `agent/scripts/enrich-revert.ts`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 4 (âm tính đứng một mình): E1 kiểm 'số dòng không giảm, không trùng' trên DB tạm chỉ có lược đồ, nên phép kiểm luôn đúng (r1)**
  Người dùng thấy gì: Phép kiểm chạy lại an toàn của bản nâng cấp cấu trúc không thể phát hiện việc mất hoặc nhân đôi dữ liệu thật, vì nó chạy trên bản sao không có dữ liệu.
  Căn cứ: Bản nâng cấp đã được xác nhận không ghi dòng nào vào bảng tin và đo thử trên bản sao thật, nên rủi ro thực tế thấp; thêm đối chứng sau cũng rẻ.
  file: `db/check-idempotent-tam.sh`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 4 (âm tính đứng một mình): cat-chuyen --thu chấp nhận 'lượt hai — legacy mới: 0' mà không buộc lượt một phải có m > 0 (r1)**
  Người dùng thấy gì: Lệnh thử chuyển đổi có thể báo đạt dù thực ra không xử lý ô nào nếu truy vấn chọn ô bị hỏng, tạo cảm giác yên tâm giả.
  Căn cứ: Chỉ xảy ra khi truy vấn hỏng hoặc DB rỗng, là lệnh chạy thử có hoàn tác nên không làm mất dữ liệu; các phép đo khác vẫn bắt được.
  file: `pipeline/phat-bieu-cat-chuyen.mjs`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 2 (fixture viết tay đúng khuôn bên đọc): phát biểu legacy trong test được dựng tay đúng khoá evidence.offer_id mà 045 đọc, không đi qua catChuyen (r1)**
  Người dùng thấy gì: Nếu cách ghi dấu vết phát biểu cũ đổi dạng, các test liên quan vẫn xanh nên có thể không phát hiện ra hỏng hóc.
  Căn cứ: Chỉ làm giảm độ nhạy của test, không ảnh hưởng dữ liệu người dùng; các phép dựng lại trên dữ liệu thật vẫn đo được và bổ sung test sau rẻ.
  file: `pipeline/scripts/phat-bieu-db.itest.mjs`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 5 (tuyên quét cả lớp nhưng phạm vi hẹp hơn lời khai): bộ quét ghi thẳng bỏ cả thư mục tests/ và fixtures/, không chỉ *.test.* (r1)**
  Người dùng thấy gì: Bộ quét chặn ghi thẳng năm cột bỏ sót mã dựng dữ liệu thử nằm trong thư mục test, nên một đường ghi thẳng ở đó sẽ không bị báo.
  Căn cứ: Chỉ là mã dùng cho test chứ không chạy trên dữ liệu thật, nên không ảnh hưởng người dùng; mở rộng phạm vi quét sau rẻ.
  file: `pipeline/lib/scan-canonical-write.mjs`
  severity: low
  Đề xuất: known-limits

## Chưa adversarial-verify (refuter chết)

Không có.

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).
