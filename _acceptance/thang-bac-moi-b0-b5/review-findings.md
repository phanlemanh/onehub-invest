# Review findings: thang-bac-moi-b0-b5 (round 3)

## Trong hợp đồng

(không có)

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **Detail mới 'chua-ap-087' của kiểm data-level:distribution không có nhãn tiếng Việt trong dq-labels.ts**
  Người dùng thấy gì: Khi máy thu chưa áp thay đổi cấu trúc dữ liệu, trang chất lượng của Ops hiện một mã thô thay vì câu tiếng Việt cho một dòng kiểm. Chỉ khó đọc, không sai số liệu.
  Căn cứ: Chỉ là chữ hiển thị khó đọc trên trang nội bộ, không mất hay sai dữ liệu, và tự hết khi Mạnh áp thay đổi lên máy thu.
  file: `pipeline/bac-du-lieu.mjs`
  severity: medium
  Đề xuất: known-limits

- **087 tự nhận là «chỗ cắm duy nhất» cho bảng nối danh bạ, nhưng 600_data_flow.sql và data-flow-queries.ts vẫn giữ vị từ riêng**
  Người dùng thấy gì: Khi sau này gắn tin vào căn thật, nếu chỉ sửa theo lời ghi chú thì số bậc ở vài trang có thể lệch nhau. Hiện chưa gây sai số vì số gắn căn đang bằng 0.
  Căn cứ: Hợp đồng đã chủ động để việc này cho hàng sau, hiện chưa ảnh hưởng người dùng, và sửa chú thích sau này rẻ.
  file: `db/migrations/087_thang_bac_moi.sql`
  severity: low
  Đề xuất: known-limits

- **NS2 «Tin S03 đã gắn căn» vẫn đếm cụm property_offers, trái với từ vựng thang 08/11**
  Người dùng thấy gì: Báo cáo ngày ghi «tin đã gắn căn» cho một con số thật ra là số tin nằm trong cụm, nên mâu thuẫn với dòng gắn căn bằng 0 ngay cạnh.
  Căn cứ: Chỉ làm báo cáo nội bộ gây hiểu lầm về tên chỉ số, không mất dữ liệu, và có thể đổi tên ở lượt sau.
  file: `scripts/bao-cao-ngay.mjs`
  severity: low
  Đề xuất: known-limits

- **Dấu «doi-thang» của DO1 chỉ tồn tại tới lượt cloud-sync kế tiếp (15 phút); ngày đổi thang vẫn có dòng chuyển bậc**
  Người dùng thấy gì: Sau khoảng 15 phút kể từ ngày đổi thang, trang chất lượng có thể mất câu giải thích đây là lần hạ bậc một lần và hiện một phần bảng chuyển bậc của ngày đó, dễ bị đọc nhầm là tụt bậc.
  Căn cứ: Gây hiểu nhầm số liệu trên trang Ops vào đúng ngày đổi thang nhưng không mất dữ liệu gốc, và chỉ ảnh hưởng một ngày.
  file: `pipeline/do-hang-ngay.mjs`
  severity: medium
  Đề xuất: new-contract

- **Thước TB-AC-11 sẽ đỏ vĩnh viễn ngay khi máy thu áp 087**
  Người dùng thấy gì: Sau khi Mạnh áp thay đổi lên máy thu, một bài kiểm tự động sẽ luôn báo đỏ dù sản phẩm không lỗi, làm nhiễu cổng kiểm.
  Căn cứ: Không ảnh hưởng người dùng cuối, chỉ gây báo đỏ giả cho người phát triển, và sửa bài kiểm sau khi áp thì rẻ.
  file: `app/tests/thang-bac-db.itest.tsx`
  severity: low
  Đề xuất: known-limits

- **Hình dạng 2 (fixture viết tay đúng khuôn bên đọc): TB-AC-6 đưa dòng ảnh chụp viết tay có khoá `scale` thẳng vào oBacGiam/demNs1, không đi qua đường ghi 610 → bên đọc gom()**
  Người dùng thấy gì: Bài kiểm của báo cáo ngày có thể vẫn xanh dù đường đọc thật bỏ sót việc nhận ra đổi thang, nên một lỗi sau này có thể lọt.
  Căn cứ: Rủi ro nằm ở khả năng bắt lỗi tương lai chứ chưa có lỗi thật, người dùng không thấy gì hôm nay.
  file: `scripts/bao-cao-ngay.test.mjs`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 4 (assert âm tính một mình): ca «087 nguyên» của TB-AC-4 chỉ khẳng định không có dòng B2 trở lên, không có đối chứng dương trong cùng giao dịch**
  Người dùng thấy gì: Một bài kiểm có thể báo xanh dù không đếm được gì cả, nên không phân biệt được «không có tin gắn căn» với «đếm hỏng».
  Căn cứ: Chỉ làm bài kiểm yếu đi, không ảnh hưởng dữ liệu hay người dùng, và bổ sung đối chứng sau là việc nhỏ.
  file: `pipeline/scripts/thang-bac.itest.mjs`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 4 (assert âm tính một mình): TB-AC-11 kiểm «chuyenBac không có thang» và «không có data-do1-thang» trên kết quả có thể là null**
  Người dùng thấy gì: Bài kiểm trường hợp chưa áp thay đổi có thể xanh một cách vô nghĩa khi không có dữ liệu để đọc.
  Căn cứ: Không có lỗi thấy được với người dùng, chỉ là bằng chứng kiểm yếu.
  file: `app/tests/thang-bac-db.itest.tsx`
  severity: low
  Đề xuất: known-limits

- **Hình dạng 2 (bản sao viết tay thay cho đường thật): chiều đỏ của TB-AC-8 (E8b) là câu SQL viết tay không rút từ recordsSql, còn chiều đỏ của E8 đột biến đầu vào ngay trong test**
  Người dùng thấy gì: Chiều kiểm «thử làm sai xem có bị bắt không» không đi qua đường truy vấn thật, nên nếu sau này quay lại tính tin trong cụm là B2 thì bài kiểm có thể không báo.
  Căn cứ: Chỉ là rủi ro hồi quy trong tương lai, hiện sản phẩm đúng và người dùng không bị ảnh hưởng.
  file: `app/tests/thang-bac-db.itest.tsx`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 1 (đo chỉ dẫn thay vì đầu ra): ca «TB-AC-8 chữ nguồn» grep mã nguồn record-sheet.tsx, records-filter.tsx, data-flow-queries.ts thay vì quét chữ trên DOM**
  Người dùng thấy gì: Việc kiểm câu chữ cũ đã biến mất chỉ đọc mã nguồn chứ không đọc màn hình thật, nên chữ cũ ghép từ nhiều mảnh có thể lọt.
  Căn cứ: Khả năng lọt rất thấp, chỉ là câu chữ trên trang nội bộ và dễ sửa khi gặp.
  file: `app/tests/thang-bac.test.tsx`
  severity: low
  Đề xuất: known-limits

- **Hình dạng 4 (âm tính, không ghim thông điệp): chiều đỏ của TB-AC-4 chỉ kiểm `notDeepEqual` với bảng xanh**
  Người dùng thấy gì: Chiều kiểm «tin trong cụm không được đếm» chỉ đòi kết quả khác đi ở đâu đó, nên có thể xanh vì lý do khác.
  Căn cứ: Chỉ làm bài kiểm kém chặt, không ảnh hưởng người dùng, và siết lại sau là việc nhỏ.
  file: `pipeline/scripts/thang-bac.itest.mjs`
  severity: low
  Đề xuất: known-limits

## Chưa adversarial-verify (refuter chết)

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).

