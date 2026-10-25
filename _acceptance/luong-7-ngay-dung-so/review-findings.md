# Review findings: luong-7-ngay-dung-so (round 1)

## Trong hợp đồng

(không có finding nào map được vào AC)

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **Tên khối, hàm và type tiếng Việt (`luong7`, `Luong7Day`) trong code/API, trái luật đặt tên đã chốt**
  Người dùng thấy gì: Người dùng không thấy gì khác: bảng Luồng 7 ngày hiển thị đúng. Chỉ là tên nội bộ của số liệu đẩy lên máy chủ đang viết tiếng Việt, về sau muốn đổi tên sẽ phải giữ song song tên cũ.
  Căn cứ: Không ảnh hưởng người dùng cuối và không mất dữ liệu; sửa ngay bây giờ rẻ, sửa sau khi dữ liệu đã lưu thì đắt hơn nhưng vẫn làm được.
  file: `app/src/lib/ops-facts.ts`
  severity: medium
  Đề xuất: known-limits

- **Phần tử của `luong7.days` không được kiểm khuôn: một phần tử null làm sập /ops/collections thay vì hiện «—»**
  Người dùng thấy gì: Nếu máy thu đẩy lên một bản tin có ngày bị hỏng khuôn, cả trang Thu thập trên máy chủ báo lỗi thay vì chỉ hiện «—» ở bảng Luồng 7 ngày. Trường hợp này chỉ xảy ra khi bên đẩy tin viết sai.
  Căn cứ: Hiếm gặp vì bản tin do chính máy thu của ta dựng; hậu quả là trang lỗi tạm, người vận hành tải lại hoặc đẩy lại bản tin là hết, không mất dữ liệu.
  file: `app/src/lib/ops-cloud.ts`
  severity: low
  Đề xuất: known-limits

- **`batApp` bỏ qua `env` khi có BASE_URL nên smoke ON5 chạy sai chế độ mà không báo**
  Người dùng thấy gì: Người dùng cuối không bị ảnh hưởng. Người chạy bài kiểm tra trình duyệt mà tự đặt địa chỉ app sẽ nhận kết quả đỏ với lý do khó hiểu.
  Căn cứ: Chỉ làm khó người chạy kiểm thử trong một cấu hình hiếm, kết quả là đỏ chứ không xanh giả nên không che lỗi thật; sửa rẻ và có thể làm sau.
  file: `scripts/lib/ops-app.mjs`
  severity: low
  Đề xuất: known-limits

- **Chú thích ở nhánh cloud của trang Thu thập còn ghi «luồng 7 ngày không dựng trên cloud»**
  Người dùng thấy gì: Người dùng không thấy khác biệt. Chỉ có một dòng ghi chú trong mã còn nói sai về việc bảng luồng 7 ngày có dựng trên máy chủ hay không, dễ làm người sửa sau hiểu nhầm.
  Căn cứ: Không có hậu quả nào với người dùng và không mất dữ liệu; sửa chỉ là đổi một dòng chữ, làm lúc nào cũng được.
  file: `app/src/app/ops/collections/page.tsx`
  severity: low
  Đề xuất: known-limits

- **batApp bỏ qua tham số env (VERCEL=1, DATABASE_URL lược đồ tạm) khi BASE_URL được đặt — smoke ON5 chạy nhầm app không ở chế độ máy chủ**
  Người dùng thấy gì: Người dùng cuối không bị ảnh hưởng. Người chạy bài kiểm tra trình duyệt với địa chỉ app tự đặt sẽ thấy lỗi gây hiểu nhầm thay vì lời giải thích rõ ràng.
  Căn cứ: Chỉ ảnh hưởng người chạy kiểm thử ở cấu hình hiếm, kết quả đỏ chứ không xanh giả nên không che lỗi thật; tự gỡ được bằng cách không đặt địa chỉ app.
  file: `scripts/lib/ops-app.mjs`
  severity: low
  Đề xuất: known-limits

- **Hình dạng 2 (fixture viết tay đúng khuôn bên đọc): khối lỗi luong7 ở ON5-AC-6 tự viết, không lấy từ bên ghi**
  Người dùng thấy gì: Người dùng không thấy gì sai hiện nay. Nếu sau này bên đẩy tin đổi cách báo lỗi đo, bài kiểm tra vẫn xanh và có thể để lọt việc ô hiện «—» bị hỏng.
  Căn cứ: Rủi ro chỉ xuất hiện khi có thay đổi sau này và bị bắt ở các đường kiểm khác phần nào; không ảnh hưởng người dùng hôm nay, bổ sung bài kiểm tra sau cũng rẻ.
  file: `app/tests/luong-7-ngay-dung-so.test.tsx`
  severity: low
  Đề xuất: known-limits

- **Hình dạng 4 (assertion âm tính một mình): «khối khác vẫn đi» chỉ kiểm reviewQueue không có error**
  Người dùng thấy gì: Người dùng không thấy gì sai hiện nay. Nếu một khối số liệu khác trong bản tin bị hỏng cùng lúc với phép đo luồng 7 ngày, bài kiểm tra có thể không phát hiện.
  Căn cứ: Không có hậu quả trực tiếp với người dùng hôm nay và không mất dữ liệu; chỉ là lưới an toàn kiểm thử mỏng, thêm sau rẻ.
  file: `app/tests/luong-7-ngay-dung-so.test.tsx`
  severity: low
  Đề xuất: known-limits

- **Hình dạng 2 (dựng tay khuôn bên đọc thay vì đi qua page.tsx): bộ dựng trangMayChu chép lại nhánh cloud của trang**
  Người dùng thấy gì: Người dùng không thấy gì sai hiện nay. Nếu trang Thu thập trên máy chủ bị nối dây thiếu, các bài kiểm tra đơn vị vẫn xanh và chỉ bài kiểm tra trình duyệt thật mới bắt được.
  Căn cứ: Đã có bài kiểm tra trình duyệt thật chạy trang thật làm lưới bảo vệ cuối; hậu quả nếu lọt là trang hiển thị sai, người dùng tải lại không hết nhưng sửa nhanh.
  file: `app/tests/luong-7-ngay-dung-so.test.tsx`
  severity: low
  Đề xuất: known-limits

⚠ Cụm ngoài vùng phủ: 2/8 lỗi rơi vào file không bộ đo nào phủ (app/src/lib/ops-facts.ts, app/src/app/ops/collections/page.tsx) — dừng và quyết: mở rộng hợp đồng hay rút phạm vi.

