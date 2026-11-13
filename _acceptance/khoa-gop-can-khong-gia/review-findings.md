Review findings: khoa-gop-can-khong-gia, round 1

Review incomplete (finder chết): không có.

## Trong hợp đồng

(không có finding nào map được vào AC)

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **reconcile_stale_offers (044) now silently drops the property link when the successor offer is already linked to another property, and writes nothing to the unlinks journal**
  Người dùng thấy gì: Khi một tin cũ được thay bằng tin mới mà tin mới đã thuộc một căn khác, căn ban đầu có thể mất liên kết với tin mà không báo lỗi và không để lại vết để khôi phục. Nhật ký chạy còn báo như thể liên kết đã được chuyển sang.
  Căn cứ: Mất liên kết âm thầm và không khôi phục được từ nhật ký, nhưng chỉ xảy ra ở đường nạp lại tin cũ, và sửa nó là một việc riêng ngoài phạm vi khoá gộp căn.
  file: `db/migrations/044_nap_lai_khong_xoa.sql`
  severity: medium
  Đề xuất: new-contract

- **Hình dạng 4 (assertion âm tính một mình): chiều xanh của KGC-AC-4 không có đối chứng cùng thao tác, resolver bản gốc cũng qua**
  Người dùng thấy gì: Bài kiểm tra chạy hai lượt liền không chứng minh được rằng sửa lỗi có tác dụng, vì code cũ cũng qua. Người dùng không thấy ảnh hưởng, chỉ là mức đảm bảo của bài kiểm thấp hơn vẻ ngoài.
  Căn cứ: Không ảnh hưởng dữ liệu hay người dùng; các ca đổi giá và DB chưa áp migration vẫn bắt được lỗi, nên ghi lại hạn chế rồi giao hàng.
  file: `pipeline/tests/resolve-properties-khoa-gop.itest.mjs`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 4 (assertion âm tính một mình): SAU_DOAN = 0 và băm stable_key ở KGC-AC-6 không có đối chứng dương trên đường code**
  Người dùng thấy gì: Bài kiểm về mã định danh căn có thể xanh dù không có căn mới nào được tạo để kiểm. Người dùng không thấy ảnh hưởng, chỉ là bài kiểm có thể chưa bắt hết lỗi.
  Căn cứ: Không mất hay lộ dữ liệu; rủi ro chỉ là bỏ sót lỗi về sau, và gia cố bài kiểm có thể làm sau mà không cần chặn lần giao này.
  file: `pipeline/tests/resolve-properties-khoa-gop.itest.mjs`
  severity: low
  Đề xuất: known-limits

## Chưa adversarial-verify (refuter chết)

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).
