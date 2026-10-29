# Review findings: dinh-danh-tai-khoan-thu-theo-vai (round 2)

## Trong hợp đồng

Không có.

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **Chỗ tiêm cho ca thử là một object toàn cục sửa được, nằm trong code chạy thật**
  Người dùng thấy gì: Không ảnh hưởng gì tới người dùng: Người xem và bearer vẫn nhận bản đã che như đã cam kết. Chỉ là cách viết phần kiểm thử hơi kém gọn.
  Căn cứ: Không có hậu quả nào với người dùng, không mất hay lộ dữ liệu; sửa chỉ để gọn mã nên chi phí không đáng so với lợi ích.
  file: `app/src/lib/collections-api.ts`
  severity: low
  Đề xuất: wont-fix

- **Hình dạng 2 — fixture viết tay theo khuôn bản tin CŨ, không round-trip từ writer push-ops-facts mới: nhánh soNhomBat có sẵn của cheDinhDanhThu không được đo**
  Người dùng thấy gì: Chưa có phép thử nào xác nhận Người xem thấy đúng số nhóm bật khi máy thu gửi bản tin kiểu mới lên cloud. Nếu phần đó sai, Người xem sẽ thấy «0 nhóm bật» mà không cảnh báo nào báo trước.
  Căn cứ: Chưa thấy lỗi thật, chỉ thiếu phép thử bảo vệ; nếu sai thì chỉ hiện sai một con số, không lộ hay mất dữ liệu, người dùng tải lại không sửa được nhưng sửa phía mình rẻ và có thể làm sau.
  file: `app/tests/dinh-danh-thu.test.tsx`
  severity: medium
  Đề xuất: known-limits

- **nguoiPhien nuốt mọi lỗi của getSessionUser để ca thử chạy được, lỗi phiên hay DB thật trên prod bị giấu (r1)**
  Người dùng thấy gì: Nếu cơ sở dữ liệu phiên trục trặc, người vận hành sẽ thấy trang Thu thập ở dạng đã che mã nhóm và tài khoản như thể thiếu quyền, mà không có thông báo lỗi nào. Dữ liệu không bị lộ.
  Căn cứ: Hậu quả nhẹ và an toàn vì lỗi chỉ làm che nhiều hơn chứ không lộ dữ liệu; người dùng tải lại trang khi hệ thống ổn là xem được lại, chỉ khó biết nguyên nhân.
  file: `app/src/components/ops/collections/collections-content.tsx`
  severity: low
  Đề xuất: known-limits

- **Mã nhóm Zalo vẫn lên cloud và tới Người xem/bearer qua zaloGroups[].name (bản tin top-level không lọc, cheDinhDanhThu không che) (r1)**
  Người dùng thấy gì: Khi một nhóm Zalo thiếu tên hiển thị, mã nhóm được dùng thay tên và vẫn có thể lên cloud, rồi hiện cho Người xem hoặc khoá chung trong bảng nhóm. Chỉ xảy ra với nhóm chưa có tên.
  Căn cứ: Chỉ lộ mã nhóm là bí danh cấu hình trong trường hợp hiếm nhóm chưa có tên, không lộ tên nguồn thật hay hồ sơ người dùng; nhưng sửa sau thì không khó nên nên ghi rõ giới hạn để Mạnh quyết có mở vòng riêng không.
  file: `pipeline/push-ops-facts.mjs`
  severity: medium
  Đề xuất: known-limits

- **nguoiPhien nuốt mọi lỗi của getSessionUser, phiên ops/admin bị che định danh mà không báo gì (r1)**
  Người dùng thấy gì: Khi tra phiên gặp sự cố, người vận hành bị coi như thiếu quyền, thấy dòng chú thích mã nhóm chỉ hiện cho vai Vận hành trở lên và không có lời báo lỗi nào.
  Căn cứ: Lỗi hiếm, an toàn về dữ liệu và tự hết khi tải lại trang, chỉ gây khó hiểu nhất thời cho người vận hành.
  file: `app/src/components/ops/collections/collections-content.tsx`
  severity: low
  Đề xuất: known-limits

- **Hình dạng 4 (assertion âm tính đứng một mình): ca bearer kèm cookie ops chỉ assert doesNotMatch, không kiểm status, không có đối chứng dương (r1 · tệp đã đổi)**
  Người dùng thấy gì: Một ca thử phụ (khoá chung đi kèm phiên vận hành) có thể báo xanh dù hệ thống trả lỗi thay vì dữ liệu đã che, nên bảo đảm cho trường hợp này yếu hơn vẻ ngoài.
  Căn cứ: Bảy kiểu người gọi chính vẫn được thử đầy đủ ở chỗ khác, chỉ ca phụ này là lỏng; không ảnh hưởng người dùng thật, sửa sau cũng rẻ.
  file: `app/tests/dinh-danh-thu.test.tsx`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 3 (quan hệ bị thay bằng assert giữa hằng số của test): ON4-AC-2 bỏ phép đo hợp nhóm bật, thay bằng `UNION.length === N` (r1)**
  Người dùng thấy gì: Một phép kiểm số nhóm S03 lên cloud của vòng trước đã yếu đi, nên nếu bản tin đếm sai tổng số nhóm thì test này không bắt được.
  Căn cứ: Là độ chặt của test thuộc tính năng khác, không lộ dữ liệu hay đổi cái người dùng thấy; sửa sau rẻ nhưng nên làm trong vòng của tính năng đó.
  file: `app/tests/nhom-s03-tren-cloud.test.tsx`
  severity: low
  Đề xuất: known-limits

## Chưa adversarial-verify (refuter chết)

Không có.

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).
