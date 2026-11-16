# Review findings: the-dia-chi-nhom-s03 (round 2)

## Trong hợp đồng

Không có finding nào.

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

Không có finding mới ở round này. Các mục mang từ round trước do máy tự chèn.

- **POST /api/v1/ops/group-cards thiếu chặn «chỉ máy thu» (VERCEL=1 → 503) như các route ops-session chỉ ở máy thu khác (r1)**
  Người dùng thấy gì: Nếu ai đó gọi chức năng duyệt thẻ trên bản cloud hoặc trên máy chưa áp bảng mới, họ nhận thông báo lỗi chung chung thay vì lời giải thích rõ «chỉ có ở máy thu». Không ai mất hay sai dữ liệu.
  Căn cứ: Chỉ làm thông báo lỗi kém rõ trên mặt chưa dùng thẻ, không mất dữ liệu, và người dùng chỉ cần chuyển sang máy thu là làm được.
  file: `app/src/app/api/v1/ops/group-cards/route.ts`
  severity: medium
  Đề xuất: known-limits

- **Docstring của quyetThe ghi sai route («Action card-decide của route source-groups») (r1)**
  Người dùng thấy gì: Một dòng chú thích nội bộ nói sai nơi chức năng duyệt thẻ được gọi. Người dùng cuối không thấy gì khác.
  Căn cứ: Không đổi gì với người dùng; chỉ có thể làm người đọc mã sau này hiểu nhầm đôi chút.
  file: `app/src/lib/the-dia-chi-nhom.ts`
  severity: low
  Đề xuất: wont-fix

- **Cờ dirty của hộp duyệt không được xoá sau khi lưu thành công, nên thẻ mở sau hỏi «Bỏ thay đổi chưa lưu?» dù chưa sửa gì (r1 · tệp đã đổi)**
  Người dùng thấy gì: Sau khi lưu một thẻ, mở thẻ kế tiếp rồi đóng mà không sửa gì vẫn hiện hỏi «Bỏ thay đổi chưa lưu?». Người duyệt phải bấm xác nhận thêm một lần.
  Căn cứ: Chỉ gây thêm một lần bấm thừa, không mất hay sai dữ liệu, và sửa sau cũng rẻ.
  file: `app/src/components/ops/group-cards/group-cards-dialog.tsx`
  severity: medium
  Đề xuất: known-limits

- **Sau khi người vận hành sửa ô, dòng căn cứ vẫn ghi là máy điền từ bài đã đọc (r1)**
  Người dùng thấy gì: Khi người duyệt đã đổi dự án hay mục đích của thẻ, dòng căn cứ vẫn nói máy điền từ bao nhiêu bài. Người đọc sau có thể tưởng giá trị đó do máy đề xuất.
  Căn cứ: Căn cứ hiển thị sai gây hiểu nhầm cho người duyệt về sau, nhưng dữ liệu thẻ vẫn đúng và lịch sử vẫn ghi đủ bản trước, bản sau.
  file: `app/src/lib/the-dia-chi-nhom.ts`
  severity: low
  Đề xuất: new-contract

- **Hình dạng 5 — tuyên «mỗi thẻ một dòng lịch sử dung_nhap» cho cả lớp nhưng chỉ đo một điểm (r1)**
  Người dùng thấy gì: Bài kiểm tự động chỉ xác nhận lịch sử dựng nháp cho một trong năm thẻ mẫu, nên một thiếu sót ở thẻ khác có thể lọt qua mà không báo đỏ.
  Căn cứ: Không ảnh hưởng người dùng hiện tại, chỉ làm lưới an toàn của bài kiểm thưa hơn đã hứa.
  file: `pipeline/tests/the-dia-chi-nhom.itest.mjs`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 3 — ca «sửa» chỉ kiểm một ô, không kiểm quan hệ «before/after khác đúng hai ô» (r1)**
  Người dùng thấy gì: Bài kiểm việc sửa thẻ chỉ ghim một ô thay đổi, nên nếu ô khác bị đổi nhầm khi sửa thì bài kiểm không bắt được.
  Căn cứ: Rủi ro nằm ở khả năng bắt lỗi sau này, chưa có lỗi thật nào với người dùng, và bổ sung bài kiểm sau rất rẻ.
  file: `app/tests/the-dia-chi-nhom-app.itest.tsx`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 5 — ma trận AC-2 không khớp phần tử viết trước và chỉ so một phần khoá (r1)**
  Người dùng thấy gì: Bài kiểm các ca dựng nháp so chưa đủ mọi ô của từng ca, nên một ô sai ở ca không được liệt kê sẽ không bị phát hiện.
  Căn cứ: Không có sai sót thật nào được chứng minh; chỉ là lưới kiểm thưa, thêm so sánh sau dễ và rẻ.
  file: `pipeline/tests/the-dia-chi-nhom.test.mjs`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 1 — sao-luu.sh được grep văn bản, không chạy để đo đầu ra (r1)**
  Người dùng thấy gì: Script sao lưu trước khi áp thay đổi chỉ được kiểm bằng cách đọc chữ trong tệp, chưa chạy thử để thấy tệp sao lưu thật sinh ra.
  Căn cứ: Người vận hành sẽ chạy bước sao lưu và nhìn kết quả trong buổi áp, nên lỗi nếu có sẽ lộ ngay trước khi ảnh hưởng dữ liệu.
  file: `pipeline/tests/the-dia-chi-nhom-lui.itest.mjs`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 4 — đo rò khoá nhóm trên nhánh lỗi 409 của route, đối chứng dương chỉ thử bộ đếm (r1)**
  Người dùng thấy gì: Phép kiểm khoá nhóm thật không lộ ra ngoài mới thử trên một loại phản hồi lỗi, nên chưa chắc bao phủ các phản hồi thành công.
  Căn cứ: Chưa có dấu hiệu lộ thật; chỉ là phép đo hẹp, mở rộng sau không ảnh hưởng người dùng.
  file: `app/tests/the-dia-chi-nhom-app.itest.tsx`
  severity: low
  Đề xuất: known-limits

- **Hình dạng 4 — kiểm sync-cloud chỉ có vế âm tính, không phải diff như eval khai (r1)**
  Người dùng thấy gì: Bài kiểm xác nhận thẻ không đi lên cloud chỉ tìm tên bảng trong tệp đồng bộ, nên một đường đưa lên cloud dưới tên khác sẽ không bị bắt.
  Căn cứ: Chưa có đường rò nào được chỉ ra; rủi ro chỉ xuất hiện nếu về sau có người đổi tên, và bổ sung kiểm tra rất rẻ.
  file: `pipeline/tests/the-dia-chi-nhom.itest.mjs`
  severity: low
  Đề xuất: known-limits

## Chưa adversarial-verify (refuter chết)

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).
