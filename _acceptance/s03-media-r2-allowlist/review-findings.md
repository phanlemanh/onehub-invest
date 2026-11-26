# Review findings: s03-media-r2-allowlist (round 1)

## Trong hợp đồng

Không có finding nào map được vào AC.

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **DATA-CONTRACT ghi tên tệp media là sha256 của URL trong payload.media, nhưng code giờ băm URL đã tải và có thể ghi đuôi .jxl**
  Người dùng thấy gì: Văn bản mô tả cách đặt tên tệp ảnh chưa khớp hẳn với cách thu mới ở các bài phải thử lại link ảnh. Công cụ nào tự dựng lại tên tệp theo văn bản cũ sẽ không tìm thấy ảnh ở những bài đó.
  Căn cứ: Ảnh vẫn được lưu và dùng bình thường, chỉ tài liệu mô tả lệch nên nhẹ với người dùng, và sửa tài liệu sau này rẻ.
  file: `collector/src/core/media-fetch.ts`
  severity: medium
  Đề xuất: known-limits

- **Tệp .jxl mới ghi vào media/ bị route /ops zalo-media trả 403**
  Người dùng thấy gì: Ảnh định dạng JPEG XL sẽ không hiện trong màn duyệt của đội vận hành và báo lỗi từ chối truy cập. Dễ bị đọc nhầm là sự cố bảo mật.
  Căn cứ: Chỉ ảnh hiếm định dạng này không hiện, không mất dữ liệu vì tệp gốc vẫn còn, và chỉ ảnh hưởng nội bộ vận hành.
  file: `app/src/lib/ops/zalo-media.ts`
  severity: low
  Đề xuất: known-limits

- **Chỉ số «đích» đếm cả bài hỏng vì lỗi khác: dùng `some` thay cho `every`**
  Người dùng thấy gì: Con số tỉ lệ bài mất hết ảnh sau khi vá có thể hiện thấp hơn thực tế. Người ký có thể tưởng việc vá hiệu quả hơn mức thật.
  Căn cứ: Chỉ là số đo báo cáo, không đổi dữ liệu hay hành vi thu, và có số đo thật từ làn thu để đối chiếu.
  file: `_acceptance/s03-jpg-path-fallback/ap-may-thu/kiem-sau.mjs`
  severity: medium
  Đề xuất: known-limits

- **Lỗi đọc tệp hậu tố host bị nuốt hết, không phân biệt ENOENT**
  Người dùng thấy gì: Nếu tệp danh sách host bị hỏng quyền hay định dạng, hệ thống vẫn chạy lặng lẽ và một số ảnh vẫn lỗi mà không có dấu hiệu nguyên nhân. Người vận hành phải tự mò.
  Căn cứ: Không mất dữ liệu, ảnh lỗi thu lại được sau khi sửa tệp, chỉ khó chẩn đoán.
  file: `collector/src/api/server.ts`
  severity: low
  Đề xuất: known-limits

- **Hình dạng 1 (đo chỉ dẫn/nguồn thay vì đầu ra): ca ZC9 grep chữ trong media-fetch.ts thay vì tải ảnh r2.dev qua server**
  Người dùng thấy gì: Phép thử cho việc nhận ảnh từ host mới chỉ kiểm chữ trong mã, chưa chạy một lượt tải thật. Nếu cấu hình bị nối sai, phép thử vẫn báo xanh.
  Căn cứ: Rủi ro là báo xanh giả, nhưng đã có đột biến bỏ host làm hai ca đỏ và số đo sau áp trên dữ liệu thật bắt được.
  file: `collector/src/test/media-fetch.test.ts`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 3 (assert có mặt hoặc độ dài trong khi lời hứa là quan hệ byte/sha256): ca 2511-3 chỉ so độ dài tệp**
  Người dùng thấy gì: Phép thử ảnh thử lại chỉ kiểm độ dài, nên tệp sai nội dung hay mã kiểm sai vẫn có thể qua. Ảnh hỏng thầm lặng có thể lọt vào kho.
  Căn cứ: Các ca ảnh khác đã kiểm đủ byte và mã băm, nên rủi ro chỉ ở một đường hẹp và vá test sau rẻ.
  file: `collector/src/test/media-fetch.test.ts`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 3: lời hứa «đuôi theo byte, không theo content-type» không được đo**
  Người dùng thấy gì: Chưa có phép thử nào bắt trường hợp hệ thống đặt đuôi tệp theo lời khai của máy chủ ảnh thay vì theo nội dung thật. Ảnh có thể mang đuôi sai.
  Căn cứ: Đuôi sai không làm mất ảnh hay lộ dữ liệu, chỉ ảnh hưởng cách hiển thị và tự sửa được.
  file: `collector/src/test/media-fetch.test.ts`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 4 (thông điệp ghim giả): đột biến thu-moi-loi trong tu-thu.sh grep chuỗi có sẵn trong TÊN ca**
  Người dùng thấy gì: Phép tự kiểm có thể báo đã bắt đúng lỗi khi thật ra chỉ có một ca bất kỳ đỏ. Việc ký nghiệm thu dựa vào đó có thể tin quá mức.
  Căn cứ: Đây là độ tin cậy của công cụ kiểm, không chạm người dùng cuối, và siết lại sau rẻ.
  file: `_acceptance/s03-jpg-path-fallback/probes/tu-thu.sh`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 4 (assert âm tính đứng một mình): kiểm rò tên host trên mẫu canh-gac không có đối chứng dương**
  Người dùng thấy gì: Bước kiểm sau áp xác nhận không lộ tên host có thể báo ổn cả khi công cụ kiểm tự hỏng và in ra rỗng. Người vận hành có thể yên tâm sai.
  Căn cứ: Chỉ làm yếu một lớp kiểm phụ, còn có chốt khác dò tên host, và không tác động dữ liệu.
  file: `_acceptance/s03-jpg-path-fallback/ap-may-thu/kiem.sh`
  severity: medium
  Đề xuất: known-limits

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).
