---
schema_version: 1
feature: Transform S03 và S05 ghi seller_ref theo người gửi bài, không còn một giá trị hằng cho mọi tin của nhóm
slug: seller-ref-theo-nguoi-gui
owner: phanlemanh@gmail.com
risk_tier: T2
surfaces: [cli]
status: approved
veto_state: mo
veto_opened_at: 2026-11-01T08:55:00Z
approved_by:
approved_at:
design_doc: docs/superpowers/specs/2026-11-01-seller-ref-theo-nguoi-gui-design.md
---

# Acceptance Contract: seller-ref-theo-nguoi-gui

## Context

Audit hàng duyệt 30/10 (H15, `docs/research/audit-hang-duyet-3010.md` §3b): `seller_ref` của S03 và S05 là mã agent
thu (`author_hash`) — một giá trị cho cả nguồn — nên thẻ duyệt không phân biệt người đăng. Danh tính thật là
`sender_id` của bài. Hàng HD4 của lộ trình.

Vùng: `pipeline/transform-zalo.mjs`, `pipeline/transform-fb.mjs`, test và thước mới dưới `pipeline/scripts/`.

## Criteria

- AC-1: Given một tin S03 mà mọi bài cùng một người gửi, When transform chọn `seller_ref`, Then `seller_ref` là
  `sender_id` của người đó (đã trim), không phải `author_hash`; đối chứng: bản chép trả `author_hash` thì đỏ với thông
  điệp ghim «SELLER_REF CON LA HANG».
- AC-2: Given một tin có bài của nhiều người gửi, đưa vào theo thứ tự bất kỳ, When chọn `seller_ref`, Then nó là người
  gửi của bài neo — `posted_at` sớm nhất, hoà thì `post_id` nhỏ nhất; đối chứng: bản chép lấy bài đầu mảng thì đỏ với
  thông điệp ghim «SELLER_REF KHONG THEO NEO».
- AC-3: Given bài neo không có người gửi (null, rỗng, chỉ khoảng trắng), When chọn `seller_ref`, Then lấy bài kế theo
  thứ tự neo có người gửi; tin không bài nào có người gửi thì `seller_ref` NULL; đối chứng: bản chép rơi về
  `author_hash` thì đỏ với thông điệp ghim «SELLER_REF ROI VE HANG».
- AC-4: Given DB thử có bài S03 và S05 của hai người gửi và một bài không người gửi, When chạy `runTransformZalo` rồi
  `runTransformFb` trong BEGIN…ROLLBACK, Then `sale_offers.seller_ref` của từng tin khớp người gửi mong đợi ở cả hai
  nguồn; đối chứng: transform của commit nền `ed0ff2cd` cho mọi tin cùng một giá trị, đỏ với thông điệp ghim
  «TRANSFORM NEN VAN HANG».
- AC-5: Given `seller_ref` mới của S03 (chuỗi số) và của S05 (đuôi không phải số), When đi qua biểu thức che mà
  `selectList('sale_offers', …)` của `pipeline/sync-cloud.mjs` sinh (tệp ấy không sửa), Then S03 thành `S03:<cùng số>` khớp `SELLER_REF_RE`, S05 đuôi
  không số thành NULL — không giá trị thô nào lọt qua leak gate.
- AC-6: Given một tin S03 hay S05, When danh bạ Người rút định danh (`rutDinhDanh`) với `seller_ref` cũ (hằng) và mới
  (người gửi), Then hai kết quả bằng hệt — danh bạ đọc người gửi theo `post_ids`, không theo `seller_ref`.
- AC-7: Given bản chép dữ liệu thật trên DB thử, giữ nguyên các tin S03/S05 đang mang `seller_ref` hằng (không xoá
  trước), When thước chạy transform của cây cho S03 và S05 trong BEGIN…ROLLBACK, Then không tin sống nào của hai nguồn
  còn giữ giá trị hằng cũ, và mỗi nguồn: số `seller_ref` khác nhau bằng số người gửi khác nhau của bài neo (±1%), mỗi
  `seller_ref` khác NULL là người gửi của bài neo có người gửi của chính tin ấy, và không `seller_ref` nào gánh quá 5%
  số tin của nguồn trừ khi đúng người ấy là người gửi bài neo của chừng ấy tin; đối chứng: transform của commit nền
  `ed0ff2cd` trên cùng dữ liệu trượt thước.
- AC-8: Given cùng bản chép dữ liệu thật, When so tin do transform của cây và của commit nền `ed0ff2cd` sinh, Then số tin
  bằng nhau và ngoài `seller_ref` (cùng các cột mốc giờ ghi khai trong thước) không cột nào của `sale_offers` — đọc từ
  `information_schema`, không danh sách viết tay — khác ở tin S03/S05; đối chứng: tin bị đổi một cột ngoài nhóm giá,
  diện tích, SĐT thì thước gọi tên cột ấy.

## Coverage

Trục (quét hình thái, preset test-matrix — xem dòng descope trong sổ):
- Người gửi của tin: một người · nhiều người · bài neo thiếu người gửi · không bài nào có → AC-1, AC-2, AC-3.
- Nguồn: S03 (`transform-zalo`) · S05 (`transform-fb`) → AC-4, AC-7.
- Dạng người gửi: toàn số · đuôi không số → AC-5.
- Bên đọc cột: danh bạ Người · sync-cloud/leak gate · app/agent/data-api (không đọc — sổ) → AC-6, AC-5.
- Mức đo: hàm thuần · DB thử dữ liệu dựng · DB thử bản chép dữ liệu thật → AC-1..3/6, AC-4/5, AC-7/8.
- Chiều đối chứng: trả hằng · bỏ neo · rơi về hằng · transform nền · đổi cột khác → AC-1, AC-2, AC-3, AC-4/7, AC-8.

## Out of scope

- OOS-1: Đổi cách che `seller_ref` trên cloud (`sync-cloud.mjs`) cho `sender_id` S05 đuôi không phải số — chạm T3,
  ngoài vùng hàng; hôm nay các tin ấy lên cloud với `seller_ref` NULL.
- OOS-2: `seller_ref` của S06 (`ct:<số>`) — đã là tài khoản người đăng.
- OOS-3: Nạp lại máy thu thật — lượt đêm kế ghi đè `seller_ref` qua upsert của `writeOffers`.
- OOS-4: Đổi khoá gom repost hay `offer_id` — hàng chỉ đổi cột `seller_ref`.
- OOS-5: Buộc `seller_phone` và `seller_ref` về cùng một người gửi ở tin nhiều người gửi — SĐT giữ luật «nhiều bài
  nhất» (hồ sơ boc-sdt-du-va-chon-ro), mã người gửi theo bài neo; hai cột có thể thuộc hai người.
- OOS-6: Màn hay truy vấn sản phẩm đọc `seller_ref` («tin cùng người đăng») — hôm nay không bên nào trong app, agent,
  data-api đọc cột này; hàng làm đúng cột canonical.
