# Review findings: nap-lai-khong-xoa (round 1)

## Trong hợp đồng

- **Bộ thước cloud-sync (check-cloud-sync.mjs) gãy sau khi áp 044: pg_dump -t sale_offers/listings giờ chỉ dump VIEW**
  file: `pipeline/sync-cloud.mjs:51`
  severity: medium
  AC: AC-9
  source: bugs
  detail: buildLocalSim và buildCloudSim ở pipeline/scripts/check-cloud-sync.mjs dựng DB mô phỏng bằng `pg_dump -t public.<t>` cho mọi bảng trong sync.FILL (gồm `sale_offers`, `listings`, `nights`, `listing_stats`) từ one-invest-db, rồi nạp lại bằng psql `-v ON_ERROR_STOP=1`. Sau 044, `sale_offers`/`listings` là VIEW trên `sale_offer_records`/`listing_records`, mà hai bảng này không nằm trong danh sách -t. Bản dump vì thế có `CREATE VIEW ... FROM public.sale_offer_records` và khoá ngoại `nights ... REFERENCES public.listing_records(id)`, đều trỏ tới quan hệ không tồn tại, nên psql dừng với lỗi. Ngoài ra các câu `... WHERE ctid = (SELECT ctid FROM sale_offers ...)` cũng không chạy được trên view. Hệ quả: mọi lệnh cloud_sync_* trong _acceptance/config.yaml (atomic, fail, fidelity, keep, pii, allow, anon, pii-cot…) đỏ hoặc gãy ngay khi DB local áp 044 theo bước 2 của runbook. Đúng lúc PR này cũng sửa sync-cloud.mjs, nên lượt kiểm sync cần chạy lại mà không chạy được.

- **Hình dạng 2 (fixture viết tay đúng khuôn bên đọc): ma trận NL-AC-4 'đổi giá/DT/PN/parser' không bao giờ đổi giá, diện tích hay số phòng**
  file: `pipeline/scripts/nap-lai.test.mjs:21`
  severity: high
  AC: AC-4
  source: measurement
  detail: MA_TRAN (dòng 21-28) là các mảng `{ posts: [P(post_id, posted_at)] }` viết tay theo đúng khuôn `groups` mà `assignOfferIds` đọc. Hàng 'đổi giá' và hàng 'đổi rule_id parser' giống hệt nhau từng byte và giống luot1. Hàng 'đổi số phòng' chỉ đảo thứ tự post. Không có giá, diện tích, số phòng hay rule_id nào trong fixture, và transform-zalo/transform-fb (bước dựng nhóm theo khoá nội dung) không được gọi. Vòng `for (const src of ["S03","S05"])` chạy cùng một hàm thuần, chỉ khác chuỗi nguồn. Vì vậy lời hứa E4 «đổi giá/DT/PN/parser thì offer_id giữ nguyên» qua transform thật chưa được đo. Phép đo chỉ chứng minh hàm gán khoá trả cùng id cho cùng tập post mà tác giả tự dựng. Bản thân evals.yaml (dòng 3) cam kết «Fixture tin dựng bằng chính transform thật (parsePost / writeOffers) … không viết tay khuôn», trong khi paths của E4 lại khai transform-zalo.mjs và transform-fb.mjs.

- **Hình dạng 4 (assertion âm tính một mình): ND-AC-5 có thể qua rỗng, không có đối chứng dương rằng có tin khoá cũ hay quyết định đã được gieo**
  file: `pipeline/scripts/nap-lai-db.itest.mjs:215`
  severity: high
  AC: AC-5
  source: measurement
  detail: Dòng 204 bỏ qua giá trị trả về của `gieoQuyetDinh(c, s)` (hàm trả 0 khi nguồn có dưới 2 tin, xem nap-lai-matrix.mjs). Dòng 215 `if (cu[s].length === 0) continue;` bỏ qua toàn bộ kiểm 'doi_khoa'/'superseded_by'. Các assert còn lại đều là tập rỗng: `deepEqual(sai…, [])`, `deepEqual(treo…, [])`, `deepEqual(soMaTran(truoc, sau), [])`. Khi DB local đã chạy transform khoá mới, hoặc S03/S05 có ít tin, cả ca vẫn xanh mà không đo gì. Không có assert nào ghim `cu.S03.length + cu.S05.length > 0` hay số quyết định đã gieo > 0, và trong tệp này cũng không có đối chứng cho thấy ma trận phát hiện được mất.

- **Hình dạng 4 (assertion âm tính một mình): thước nap-lai-ba-luot báo 'mất 0' kể cả khi không biến nào bị đổi và không quyết định nào được gieo**
  file: `pipeline/scripts/nap-lai-ba-luot.mjs:131`
  severity: high
  AC: AC-7
  source: measurement
  detail: Dòng 131 bỏ qua giá trị trả về của `gieoQuyetDinh` (có thể bằng 0). `doiPost` (dòng 71-92) trả `null` khi không tìm được post hợp, và `doiListing` (dòng 95-104) cũng trả `null` khi không tìm được listing. Các lượt ở dòng 135-137 vẫn chạy và chỉ in nhãn kiểu «giá post null». `process.exitCode = r.mat.length ? 1 : 0` (dòng 169) dựa hoàn toàn vào việc ma trận không giảm. Vì vậy exit 0 cùng dòng «mất 0 quyết định · mất 0 liên kết» không phân biệt được hai trường hợp: 'ba lượt đổi biến mà không mất gì' và 'không đổi biến nào, không gieo gì'. Không có điều kiện dương nào bắt buộc mỗi lượt thực sự đổi một biến, và ma trận trước lượt cũng không bị bắt phải khác rỗng.

- **Hình dạng 4 (assertion âm tính một mình): E7 chỉ chạy nhánh 'mất 0', hai đối chứng --doi-chung không nằm trong lệnh của executor**
  file: `_acceptance/nap-lai-khong-xoa/evals.yaml:40`
  severity: medium
  AC: AC-7
  source: measurement
  detail: E7 khai `cmd: config:executors.script.nap_lai_ba_luot`. Trong _acceptance/config.yaml, lệnh này là `node pipeline/scripts/nap-lai-ba-luot.mjs`, không kèm cờ. Trường expected lại hứa thêm «cờ --doi-chung=039 … và --doi-chung=khong-chuyen … mỗi cờ exit 1 và dòng 'mất' nêu tên ít nhất một hàng». Không executor nào chạy hai cờ đó, và nap-lai.test.mjs/nap-lai-db.itest.mjs cũng không gọi `chayBaLuot(..., { doiChung })`. Như vậy phép đo máy chạy chỉ có kết quả âm tính 'không mất', và chưa có đối chứng dương nào chứng minh thước bắt được mất (CASCADE hoặc không chuyển dòng con).

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **410_listing_stats TRUNCATE rồi dựng lại qua view sống: listing_stats của listing đã nghỉ bị xoá mỗi đêm, trái AC-6**
  Người dùng thấy gì: Thống kê theo listing của căn đã nghỉ vì ra ngoài phường sẽ bị xoá sau mỗi lượt chạy đêm, dù lịch đêm của căn vẫn còn. Khi căn quay lại phường thì thống kê được dựng lại từ lịch đêm.
  Căn cứ: Thống kê này là số dẫn xuất, dựng lại được từ lịch đêm còn nguyên, nên không mất dữ liệu gốc và không ảnh hưởng người dùng cuối; sửa riêng sau không đắt.
  file: `pipeline/sql/410_listing_stats.sql`
  severity: medium
  Đề xuất: known-limits

- **Enum mới retired_reason (và các cột retired_at/superseded_by/originating_system_key) không khai trong sổ mappings.yaml, mã enum tiếng Việt**
  Người dùng thấy gì: Các trạng thái nghỉ mới chưa được ghi vào sổ từ vựng dữ liệu chung, và mã dùng chữ tiếng Việt không đồng bộ với các mã khác. Người dùng không thấy khác biệt, nhưng công cụ kiểm từ vựng sẽ không biết tới trục này.
  Căn cứ: Chỉ là sổ sách và quy ước đặt tên, không làm sai hay mất dữ liệu của người dùng; bổ sung sổ sau khi mã đã chốt vẫn rẻ.
  file: `db/migrations/044_nap_lai_khong_xoa.sql`
  severity: medium
  Đề xuất: known-limits

- **Đường ghi listings vẫn đi qua VIEW sống: upsert gặp listing đã nghỉ thì cập nhật hàng ẩn mà không gỡ nghỉ**
  Người dùng thấy gì: Một căn đã nghỉ mà quay lại dữ liệu nguồn (đường nạp HCMC) có thể được cập nhật nhưng vẫn bị ẩn khỏi cổng cho tới bước gán phường kế tiếp. Căn có thể chậm xuất hiện lại một lượt.
  Căn cứ: Chỉ trễ hiển thị tạm thời cho một nhóm căn hẹp, bước chạy sau tự gỡ nghỉ, không mất dữ liệu.
  file: `pipeline/sql/200_transform.sql`
  severity: low
  Đề xuất: known-limits

- **Listing mà transform-airbnb cho nghỉ 'ngoai_phuong' bị reassign-areas cho sống lại bằng toạ độ cũ**
  Người dùng thấy gì: Căn Airbnb đã bị đánh dấu ngoài phường có thể hiện lại trên cổng với toạ độ, giá cũ sau lượt gán phường, như chưa từng nghỉ. Người dùng có thể thấy căn đã lỗi thời hoặc sai vị trí.
  Căn cứ: Không mất dữ liệu nhưng làm số liệu và bản đồ hiển thị căn không còn đúng cho tới khi nguồn cập nhật lại; lỗi lặp lại mỗi đêm và cần xử lý có chủ đích chứ không phải sửa vặt.
  file: `pipeline/transform-airbnb.mjs`
  severity: high
  Đề xuất: new-contract

- **410_listing_stats TRUNCATE rồi dựng lại từ view sống, làm mất listing_stats của listing đã nghỉ (trái AC-6)**
  Người dùng thấy gì: Thống kê theo listing của căn đã nghỉ vì ra ngoài phường bị xoá sau mỗi lượt chạy đêm, dù lịch đêm còn nguyên. Thống kê dựng lại được khi căn quay lại.
  Căn cứ: Là số dẫn xuất dựng lại được từ lịch đêm, không phải quyết định của người; ảnh hưởng người dùng cuối nhỏ.
  file: `pipeline/reassign-areas.mjs`
  severity: medium
  Đề xuất: known-limits

- **reassign-areas bước 4: listing đã nghỉ chặn xoá vĩnh viễn submarket ngoài OSM**
  Người dùng thấy gì: Một số khu vực phụ ngoài bản đồ chuẩn sẽ không bị dọn đi vì còn căn đã nghỉ gắn vào, và hệ thống báo cảnh báo mỗi lượt chạy. Người dùng cuối hầu như không thấy.
  Căn cứ: Chỉ để sót vài khu vực thừa và cảnh báo vận hành, không mất hay sai dữ liệu; dọn tay được.
  file: `pipeline/reassign-areas.mjs`
  severity: low
  Đề xuất: known-limits

- **Hình dạng 4 (assertion âm tính một mình): AC-4 trong test-posts chỉ còn assert trạng thái thẻ 'khác pending'**
  Người dùng thấy gì: Phép kiểm tự động chỉ chắc rằng thẻ duyệt không còn ở trạng thái chờ, chưa chắc nó sang đúng trạng thái hoãn. Nếu sai trạng thái, người duyệt có thể thấy thẻ ở chỗ không mong đợi.
  Căn cứ: Là độ chặt của test; hành vi thật đã được ghim ở test khác, nên rủi ro cho người dùng thấp và siết lại rất rẻ.
  file: `pipeline/scripts/test-posts.test.mjs`
  severity: medium
  Đề xuất: known-limits

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).

