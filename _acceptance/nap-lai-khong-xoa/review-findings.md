## Trong hợp đồng

- **Lượt 1 «đổi giá» của thước nap-lai-ba-luot không đổi giá; điều kiện dương chỉ kiểm text đã đổi nên vẫn qua**
  file: `pipeline/scripts/nap-lai-ba-luot.mjs:82`
  severity: medium
  AC: AC-7
  source: bugs
  detail: doiPost(client, "gia") bắt số đứng trước «tỷ» bằng regex, nhưng sau đó gọi r.text.replace(m[1], ...). Lệnh replace này thay chỗ xuất hiện ĐẦU TIÊN của chuỗi m[1] trong toàn bộ bài, không phải đúng chỗ regex vừa bắt. Khi giá là số ngắn (vd «2 tỷ»), chữ số bị thay thường nằm ở diện tích hay SĐT phía trước. Tôi đã chạy lại logic này trên DB local, dùng đúng truy vấn và thứ tự của doiPost. Post đầu tiên mà thước chọn (000df2a6…) có m[1]='2'; giá parse vẫn 2000000000 → 2000000000, còn diện tích đổi từ 34 thành null. Trên 1214 post S03 có số đứng trước «tỷ», có 325 post mà giá parse không đổi. Hệ quả: lượt 1 in ra «giá post …» nhưng thực chất làm đổi diện tích, nên biến giá không bao giờ được đo. Điều kiện dương mới thêm ở vòng này (daDoi, cùng câu trong evals E7 «mỗi lượt đổi được đúng biến của nó») chỉ kiểm doiPost trả về post_id khác null, tức là text có đổi. Nó không so parsePost(trước).priceVnd với parsePost(sau).priceVnd. Vì vậy bảo đảm này thực tế không có hiệu lực mà vẫn báo đạt. Cách sửa: thay đúng chỗ khớp (dùng m.index, hoặc replace có callback trên đúng regex), và cho điều kiện dương so giá trị parse trước/sau của đúng biến cần đổi, ở cả lượt «gia» lẫn lượt «phong».
  rationale: AC-7 đòi mỗi lượt đổi đúng một biến (giá một tin); lượt 1 thực chất đổi diện tích nên biến giá không được đo.

- **Hình 1 (đo thứ khác thay cho đầu ra): ca 'NL-AC-4 S06' đo dòng do chính migration 044 backfill, không chạy transform-chotot**
  file: `pipeline/scripts/nap-lai-db.itest.mjs:395`
  severity: medium
  AC: AC-4
  source: measurement
  detail: Ca này chỉ chạy `await c.query(MIG)` rồi đếm `lech` (offer_id <> băm 'S06|'||originating_system_key) trên sale_offer_records. Nó không gọi runTransformChotot lần nào. Trong khi đó 044 dòng 50-53 tự ghi `originating_system_key = c.list_id` với ĐÚNG điều kiện `o.offer_id = 'offer_' || substr(encode(digest('S06|' || c.list_id …)))`. Nên trên DB chưa áp 044, `lech = 0` chỉ là mệnh đề WHERE của backfill viết ngược lại, tức là đo vòng tròn. Đầu ra của transform-chotot (dòng 77-94: osk = String(ad.list_id), mintOfferId) chưa được đo. E4 cũng không đưa pipeline/transform-chotot.mjs vào `paths`. Thêm nữa, lời hứa «mọi tin S06 có originating_system_key = list_id» chỉ được so với stg_chotot_ads qua đúng một dòng mẫu (`mau … LIMIT 1`).
  rationale: AC-4 đòi originating_system_key được điền cho mọi tin S06; ca đo chỉ kiểm dòng do backfill của 044 điền, chưa đo đầu ra của transform S06.

- **Hình 4 (âm tính một mình): thước ba lượt in «mất 0» cho nights/listing_stats mà không kiểm lượt 3 có thật sự cho listing nghỉ**
  file: `pipeline/scripts/nap-lai-ba-luot.mjs:151`
  severity: low
  AC: AC-7
  source: measurement
  detail: Điều kiện dương của lượt 2 và lượt 3 chỉ là `daDoi(await doiPost(...))` / `daDoi(await doiListing(client))`, tức là chỉ kiểm câu UPDATE đầu vào đã chạy. Không có assert nào cho thấy lượt đó tạo ra hiệu ứng cần đo. Với lượt 3, `r.airbnb_nghi` (ab.dropped.length) chỉ được in ra, không bị chặn ≥ 1, và không ai kiểm id trả về từ doiListing có nằm trong ab.dropped hay đã có retired_reason 'ngoai_phuong'. Riêng lượt 1 có kiểm tin khoá cũ nghỉ 'doi_khoa'. Vì thế khi bản thật báo trước = sau ở hàng nights/listing_stats, đó có thể là một lượt không đo gì: không có listing nào nghỉ thì hai hàng này không đổi. Đối chứng 039/khong-chuyen chỉ cần «thấy mất» ở BẤT KỲ hàng nào (`ok &&= d.mat.length > 0`), nên có thể đạt nhờ các hàng S03 mà không chứng minh thước phân biệt được ở hai hàng listing. Điều này ngược với lời ghi «không bao giờ 'mất 0' trên lượt không đo» trong E7.
  rationale: AC-7 đòi lượt 3 đưa một listing ra ngoài phường và hai đối chứng báo mất nêu tên hàng; thước không chứng minh lượt 3 có listing nghỉ nên «mất 0» ở nights/listing_stats có thể là đo rỗng.

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **410_listing_stats TRUNCATE rồi dựng lại qua view sống: listing_stats của listing đã nghỉ bị xoá mỗi đêm, trái AC-6 (r1)**
  Người dùng thấy gì: Thống kê theo listing của căn đã nghỉ vì ra ngoài phường sẽ bị xoá sau mỗi lượt chạy đêm, dù lịch đêm của căn vẫn còn. Khi căn quay lại phường thì thống kê được dựng lại từ lịch đêm.
  Căn cứ: Thống kê này là số dẫn xuất, dựng lại được từ lịch đêm còn nguyên, nên không mất dữ liệu gốc và không ảnh hưởng người dùng cuối; sửa riêng sau không đắt.
  file: `pipeline/sql/410_listing_stats.sql`
  severity: medium
  Đề xuất: known-limits

- **Enum mới retired_reason (và các cột retired_at/superseded_by/originating_system_key) không khai trong sổ mappings.yaml, mã enum tiếng Việt (r1)**
  Người dùng thấy gì: Các trạng thái nghỉ mới chưa được ghi vào sổ từ vựng dữ liệu chung, và mã dùng chữ tiếng Việt không đồng bộ với các mã khác. Người dùng không thấy khác biệt, nhưng công cụ kiểm từ vựng sẽ không biết tới trục này.
  Căn cứ: Chỉ là sổ sách và quy ước đặt tên, không làm sai hay mất dữ liệu của người dùng; bổ sung sổ sau khi mã đã chốt vẫn rẻ.
  file: `db/migrations/044_nap_lai_khong_xoa.sql`
  severity: medium
  Đề xuất: known-limits

- **Đường ghi listings vẫn đi qua VIEW sống: upsert gặp listing đã nghỉ thì cập nhật hàng ẩn mà không gỡ nghỉ (r1)**
  Người dùng thấy gì: Một căn đã nghỉ mà quay lại dữ liệu nguồn (đường nạp HCMC) có thể được cập nhật nhưng vẫn bị ẩn khỏi cổng cho tới bước gán phường kế tiếp. Căn có thể chậm xuất hiện lại một lượt.
  Căn cứ: Chỉ trễ hiển thị tạm thời cho một nhóm căn hẹp, bước chạy sau tự gỡ nghỉ, không mất dữ liệu.
  file: `pipeline/sql/200_transform.sql`
  severity: low
  Đề xuất: known-limits

- **Listing mà transform-airbnb cho nghỉ 'ngoai_phuong' bị reassign-areas cho sống lại bằng toạ độ cũ (r1)**
  Người dùng thấy gì: Căn Airbnb đã bị đánh dấu ngoài phường có thể hiện lại trên cổng với toạ độ, giá cũ sau lượt gán phường, như chưa từng nghỉ. Người dùng có thể thấy căn đã lỗi thời hoặc sai vị trí.
  Căn cứ: Không mất dữ liệu nhưng làm số liệu và bản đồ hiển thị căn không còn đúng cho tới khi nguồn cập nhật lại; lỗi lặp lại mỗi đêm và cần xử lý có chủ đích chứ không phải sửa vặt.
  file: `pipeline/transform-airbnb.mjs`
  severity: high
  Đề xuất: new-contract

- **410_listing_stats TRUNCATE rồi dựng lại từ view sống, làm mất listing_stats của listing đã nghỉ (trái AC-6) (r1)**
  Người dùng thấy gì: Thống kê theo listing của căn đã nghỉ vì ra ngoài phường bị xoá sau mỗi lượt chạy đêm, dù lịch đêm còn nguyên. Thống kê dựng lại được khi căn quay lại.
  Căn cứ: Là số dẫn xuất dựng lại được từ lịch đêm, không phải quyết định của người; ảnh hưởng người dùng cuối nhỏ.
  file: `pipeline/reassign-areas.mjs`
  severity: medium
  Đề xuất: known-limits

- **reassign-areas bước 4: listing đã nghỉ chặn xoá vĩnh viễn submarket ngoài OSM (r1)**
  Người dùng thấy gì: Một số khu vực phụ ngoài bản đồ chuẩn sẽ không bị dọn đi vì còn căn đã nghỉ gắn vào, và hệ thống báo cảnh báo mỗi lượt chạy. Người dùng cuối hầu như không thấy.
  Căn cứ: Chỉ để sót vài khu vực thừa và cảnh báo vận hành, không mất hay sai dữ liệu; dọn tay được.
  file: `pipeline/reassign-areas.mjs`
  severity: low
  Đề xuất: known-limits

- **Hình dạng 4 (assertion âm tính một mình): AC-4 trong test-posts chỉ còn assert trạng thái thẻ 'khác pending' (r1 · tệp đã đổi)**
  Người dùng thấy gì: Phép kiểm tự động chỉ chắc rằng thẻ duyệt không còn ở trạng thái chờ, chưa chắc nó sang đúng trạng thái hoãn. Nếu sai trạng thái, người duyệt có thể thấy thẻ ở chỗ không mong đợi.
  Căn cứ: Là độ chặt của test; hành vi thật đã được ghim ở test khác, nên rủi ro cho người dùng thấp và siết lại rất rẻ.
  file: `pipeline/scripts/test-posts.test.mjs`
  severity: medium
  Đề xuất: known-limits

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).

