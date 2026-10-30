# Review findings: ho-nguoi-theo-nguon (round 2)

## Trong hợp đồng

Không có finding trong hợp đồng ở round này.

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **Mã enum dữ liệu mới viết bằng tiếng Việt (tai_khoan_nguon, sdt_bam, ten, gop, tach, nghi, nguoi_dang), trái luật đặt tên đã chốt (r1)**
  Người dùng thấy gì: Một số mã nội bộ của danh bạ Người đặt tên tiếng Việt thay vì tiếng Anh như quy ước chung. Người dùng cuối không thấy gì khác, nhưng người làm kỹ thuật về sau sẽ thấy lệch quy ước.
  Căn cứ: Chỉ ảnh hưởng độ nhất quán tên gọi nội bộ, không mất hay sai dữ liệu của người dùng; hợp đồng đã duyệt dùng chính các tên này, và đổi sau khi có dữ liệu thì tốn thêm một đợt đổi lược đồ.
  file: `db/migrations/055_danh_ba_nguoi.sql`
  severity: medium
  Đề xuất: known-limits

- **Itest nạp 055 trong giao dịch nhưng không giữ khoá advisory 33033 như Gotcha 6 và mọi itest nạp migration khác (r1 · tệp đã đổi)**
  Người dùng thấy gì: Khi chạy nhiều bài kiểm tra cùng lúc trên cùng một CSDL thử, bài này có thể chờ nhau và đôi khi treo. Người dùng cuối không bị ảnh hưởng.
  Căn cứ: Chỉ ảnh hưởng người chạy kiểm tra trên máy dev, chạy lại là qua; không chạm dữ liệu thật nên không đáng mở việc riêng.
  file: `pipeline/scripts/danh-ba-nguoi.itest.mjs`
  severity: low
  Đề xuất: wont-fix

- **buocDem: khi lệnh ROLLBACK/ROLLBACK TO SAVEPOINT cũng lỗi, lỗi gốc của bộ dựng bị thay bằng lỗi rollback (r1)**
  Người dùng thấy gì: Nếu bước dựng danh bạ lỗi và việc hoàn tác cũng lỗi, nhật ký đêm chỉ ghi lỗi hoàn tác chứ không ghi nguyên nhân thật, khiến người vận hành khó tìm ra vì sao hỏng.
  Căn cứ: Chỉ xảy ra khi hỏng hai lớp cùng lúc, job vẫn báo đỏ và không mất dữ liệu; hậu quả là chậm tìm nguyên nhân chứ không sai số liệu.
  file: `pipeline/refresh-bait-gap.mjs`
  severity: low
  Đề xuất: known-limits

- **Hình dạng 1 + 3: AC-9 so tập phương pháp ghi với hằng tự khai PHUONG_PHAP_GHI; hằng này không bị ghim và bộ ghi cũng không đọc nó (r1 · tệp đã đổi)**
  Người dùng thấy gì: Bài kiểm tra «chỉ ghi hai loại bằng chứng cho phép» chưa chặt: nếu sau này ai thêm loại bằng chứng suy luận, bài kiểm tra vẫn có thể báo xanh.
  Căn cứ: Hiện dữ liệu ghi ra vẫn đúng quy định nên không ai bị ảnh hưởng ngay; rủi ro nằm ở lần sửa sau, và siết lại bài kiểm tra về sau không tốn kém.
  file: `pipeline/scripts/danh-ba-nguoi.test.mjs`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 5 (tuyên quét lớp nhưng chỉ có điểm-case): AC-9 'không nhắc bảng tầng A' chỉ có một chiều đỏ 'JOIN users' (r1 · tệp đã đổi)**
  Người dùng thấy gì: Bài kiểm tra đảm bảo danh bạ Người không đọc dữ liệu hồ sơ người dùng app còn sơ sài: một cách viết truy vấn có tiền tố schema có thể lọt qua mà không bị bắt.
  Căn cứ: Hiện không có dấu hiệu bộ dựng đọc các bảng đó nên chưa lộ dữ liệu nhạy cảm; vì liên quan dữ liệu riêng tư nên nên ghi lại để siết ở lần chạm sau.
  file: `pipeline/scripts/danh-ba-nguoi.test.mjs`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 2 (fixture viết tay đúng khuôn bên đọc): chi tiết DQ trong dq-nhan-danh-ba.test.tsx chép tay mẫu chữ của kiemEnum (r1)**
  Người dùng thấy gì: Nếu sau này đổi cách ghi câu mô tả kiểm tra chất lượng dữ liệu, trang chất lượng của Ops có thể hiện «chưa diễn giải» mà bài kiểm tra vẫn xanh.
  Căn cứ: Chỉ làm nhãn trên trang Ops kém đẹp, không sai số liệu và người vận hành tự nhận ra ngay; chỉ xảy ra khi có người đổi khuôn chữ.
  file: `app/tests/dq-nhan-danh-ba.test.tsx`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 4 (âm tính một mình, không ghim thông điệp): ca tiến trình AC-10 chỉ assert mã thoát ≠ 0 (r1 · tệp đã đổi)**
  Người dùng thấy gì: Bài kiểm tra việc job đêm báo đỏ khi hỏng chỉ xác nhận «có báo đỏ» chứ không xác nhận báo đỏ đúng vì lý do mong đợi.
  Căn cứ: Job đêm vẫn báo đỏ đúng lúc nên người dùng không mất dữ liệu; bắt thêm lý do chỉ tăng độ chắc chắn của test, chi phí cao hơn lợi ích.
  file: `pipeline/scripts/danh-ba-nguoi.itest.mjs`
  severity: low
  Đề xuất: wont-fix

- **Hình dạng 4 (âm tính không ghim thông điệp): dòng (2)-(8) của ma trận AC-1 chấp nhận mọi lỗi (r1 · tệp đã đổi)**
  Người dùng thấy gì: Bài kiểm tra các dữ liệu sai bị chặn khi nạp danh bạ chỉ xác nhận «bị chặn» chứ chưa chứng minh bị chặn đúng quy tắc dự kiến.
  Căn cứ: Dữ liệu sai vẫn bị chặn nên người dùng không bị ảnh hưởng; rủi ro chỉ là một quy tắc nào đó hỏng mà không ai biết, và bổ sung kiểm tra sau này rẻ.
  file: `pipeline/scripts/danh-ba-nguoi.itest.mjs`
  severity: low
  Đề xuất: known-limits

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).
