---
schema_version: 1
feature: Quỹ căn và căn cao tầng S09 vào stg không mang tầng A, quỹ căn có giá hiện trên Danh bạ Ops
slug: nap-s09-quy-can-va-can-cao-tang
owner: phanlemanh@gmail.com
risk_tier: T3
surfaces: [cli, ui]
status: draft
approved_by:
approved_at:
design_doc: docs/superpowers/specs/2026-11-25-nap-s09-quy-can-va-can-cao-tang-design.md
---

# Acceptance Contract: nap-s09-quy-can-va-can-cao-tang

## Context

DA56 nạp hai kind mới của nguồn S09 (DATA-CONTRACT v16): quỹ căn (`quy-can`, giá chủ đầu tư và trạng thái, công khai theo ROADMAP §3
mục 38) và căn cao tầng theo tầng (`can-cao-tang`, gói 2). Bản thu đã về thư mục chờ: quỹ căn đủ 40 dự án, 1.294 căn; căn cao tầng hai
bản 99.107 và 108.538 căn. Raw quỹ căn mang URL ảnh trên tên miền CDN của nguồn và toạ độ từng căn — tầng A, không được vào stg.

GS phán 25/11: hàng này giữ toàn bộ lớp stg của hai kind và đưa quỹ căn có giá lên `/ops/registry`; DA43 giữ phần căn vào danh bạ và
đọc stg của hàng này. Xếp chồng nhánh DA42 (cần 115 và nối dự án S09). Migration số 130 (GS giữ số).

## Criteria

### AC-1 — Hai kind v16 nạp vào stg không nhân dòng
Given DB của riêng lượt áp đủ migration và fixture sinh từ khuôn bản thu v16 (đã thay tên, thay URL và toạ độ bằng giá trị giả lập), có
trang quỹ căn rỗng, tầng rỗng, item lỗi, item thiếu `sourceId`, một tệp sai băm,
When nạp fixture hai lần qua bộ nạp S09,
Then lần một ghi đúng số dòng hợp lệ của từng kind, lần hai ghi 0 dòng; item hỏng bị bỏ và đếm theo lý do; tệp sai băm làm lượt dừng
trước khi ghi dòng nào.

### AC-2 — Stg không mang URL ảnh hay toạ độ
Given bảng kiểm kê viết trước liệt kê MỌI khoá lá của một căn quỹ căn và của một item căn cao tầng trong bản thu thật, mỗi khoá một
kết luận giữ hay bỏ (bỏ: `galleries`; `geolocation` theo Hỏi-2), và fixture mà mọi căn có hai khoá đó,
When nạp,
Then 0 dòng stg còn khoá bị bỏ ở bất kỳ căn nào; mỗi khoá giữ bằng nguyên văn fixture, số assert bằng số khoá của bảng; bộ nạp in số căn
đã bỏ trường. Đột biến bỏ bước lọc thì ca đỏ nêu «galleries».

### AC-3 — Quỹ căn chọn bản thu đủ, hợp căn theo id
Given ma trận viết trước, mỗi ô một assert trên view quỹ căn: bản hỏng trước bản đủ · bản hỏng SAU bản đủ · một căn có ở hai trang ·
dự án thiếu một trang (Σ id < `tongNguon`) · dự án chỉ có bản hỏng · hai bản đủ khác giá,
When đọc `v_s09_db_quy_can` và `v_s09_db_quy_can_doi_soat`,
Then mỗi dự án lấy đúng bản đủ mới nhất; căn hai trang đếm một lần; dự án thiếu trang hay chỉ có bản hỏng ra 0 căn và hiện ở view đối soát
với `du = false`; hai bản đủ thì giá của bản mới hơn.

### AC-4 — Căn cao tầng đọc từ bản tầng tốt mới nhất
Given ma trận viết trước, mỗi ô một assert trên `v_s09_db_can_cao_tang`: tốt rồi lỗi · lỗi rồi tốt · tốt rồi rỗng · `code` khác `name` ·
một tầng ở hai bản thu,
When đọc view,
Then bản lỗi và bản rỗng không đè bản tốt; tầng ở hai bản lấy bản tốt mới nhất, căn không đếm trùng; view trả cả `code` lẫn `name`
nguyên văn, kèm uuid và tên nguyên văn của dự án, toà, tầng.

### AC-5 — Số trong stg khớp manifest bản thu thật
Given DB thử chép DB máy thu, áp 115, 125, 130, nạp gói 1 và dựng danh bạ như lượt thật của DA42, rồi nạp mọi bản thu v16 hợp lệ có
trong thư mục chờ lúc chấm (kiểm băm trước),
When chạy bộ đếm độc lập đọc thẳng snapshot,
Then theo từng bản thu và từng kind: số item, dự án, trang hay tầng, căn trong stg bằng bộ đếm và bằng `manifest.counts`; view quỹ căn ra
1.294 căn ở 40 dự án, 1.268 căn có giá; view đối soát của bản hỏng `…T024022939` có 0 dòng `du` rỗng và số dòng `du = false` bằng số
dự án của bộ đếm; 40 dự án quỹ căn chia 24 nối nút · 6 còn thẻ · 10 không có trong danh mục gói 1; số dòng stg hai kind có payload chứa
`http` hay tên miền thật của nguồn (đọc từ sổ nguồn local) bằng 0; lệch một ô thì thoát 1 nêu ô. Chỉ in số.

### AC-6 — Chạy lại và đổi thứ tự nạp không đổi kết quả
Given cùng bốn bản thu,
When nạp hai lần, và trên DB thử thứ hai nạp theo thứ tự ngược,
Then tập dòng của `v_s09_db_quy_can` và `v_s09_db_can_cao_tang` (băm theo khoá) giống nhau ở cả ba lượt; áp 130 lần hai không lỗi.

### AC-7 — Ô tổng Danh bạ hiện quỹ căn S09 đúng số (cross-layer)
Given DB thử của AC-5 đã dựng DA42,
When mở `/ops/registry`,
Then ô «Quỹ căn S09» hiện số căn, số căn có giá và số dự án bằng SELECT đếm trên view quỹ căn của cùng DB; dòng phụ chia số dự án thành
đã nối nút (`project_links` nguồn S09 trạng thái `noi`, gồm cả nút ứng viên) · còn thẻ · không có trong danh mục, ba số cộng bằng số dự án.

### AC-8 — Trang dự án có bảng quỹ căn đang bán (cross-layer)
Given một nút dự án nối với dự án S09 có quỹ căn, một nút nối mà không có quỹ căn, và DB không trả được truy vấn quỹ căn,
When mở `/ops/registry/[nodeId]`,
Then nút có quỹ căn hiện bảng đúng số dòng của view, mỗi dòng mã căn, loại hình, PN · WC, diện tích, giá bán, đơn giá, trạng thái nguồn;
nút không có hiện trạng thái trống có chữ; DB lỗi hiện lỗi kèm Thử lại; đang tải hiện Skeleton.

### AC-9 — Không gì rời máy hay lên màn mang tầng A
Given chuỗi tên miền giả lập cấy vào URL ảnh và toạ độ giả lập trong fixture,
When chạy bộ nạp, render hai trang của AC-7, AC-8, và đọc danh sách bảng đồng bộ của `pipeline/sync-cloud.mjs`,
Then HTML, log bộ nạp và stg không chứa chuỗi cấy; danh sách đồng bộ không có `stg_s09_danh_ba` hay ba view mới; trang chỉ ghi mã `S09`.
Bỏ bước lọc thì ca đỏ nêu chuỗi cấy.

### AC-10 — Hồ sơ áp và hợp đồng dữ liệu đi cùng (judgment)
Given `_acceptance/nap-s09-quy-can-va-can-cao-tang/ap-may-thu.md` và `collector/docs/DATA-CONTRACT.md` trên nhánh,
When đọc,
Then hồ sơ áp có đủ năm thứ (lệnh áp 130 và lượt nạp bốn bản thu sau khi ZK chép vào `collector/snapshots`, số chạy thử của AC-5, sao lưu
trước, cách lùi, lệnh kiểm sau) và thứ tự sau DA42; DATA-CONTRACT có mục «Mở rộng v16» đúng nhánh làn thu @767c70c13, không sửa chữ
(so bằng `git diff 767c70c13 -- collector/docs/DATA-CONTRACT.md` rỗng).

## Coverage

Trục (quét theo preset test-matrix): kind (quy-can · can-cao-tang) × trạng thái bản thu (đủ · hỏng · rỗng · lỗi · thiếu trang · chồng
bản) × lớp (stg · view · màn · rời máy) × tầng A (URL · toạ độ · tên nguồn). Thước CE: mỗi ô kind × trạng thái có một assert ở AC-3, AC-4;
lớp màn có cặp cross-layer AC-7, AC-8 với SELECT cùng DB; tầng A có ca cấy ở AC-2, AC-9.
- [GIẢ ĐỊNH] `manifest.counts` của bản thu v16 khai số item và căn theo kind — đo ở S3; khác thì AC-5 so với bộ đếm độc lập và ghi lệch.

## Đường đo

| Thước | Số từ đâu | AC bảo đảm |
|---|---|---|
| Quỹ căn S09 trên màn: 0 → 1.294 căn, 1.268 có giá, 40 dự án | ô tổng `/ops/registry`, SELECT `v_s09_db_quy_can` | AC-5, AC-7 |
| Dự án có bảng quỹ căn: 0 → 24 nút (23 ứng viên · 1 xác minh) | trang dự án, SELECT nối `project_links` S09 `noi` | AC-5, AC-8 |

Lệnh đo sau áp: `DATABASE_URL=…/oneinvest node pipeline/scripts/s09-v16-that.mjs --dem` (chỉ đọc).

## Out of scope

- Căn quỹ căn hay căn cao tầng vào bảng `units`, tách mã TÒA.TẦNG.CĂN, bí danh căn S16/S08 — DA43.
- Khu, căn thấp tầng — DA50.
- Đồng bộ quỹ căn lên cloud và cổng Invest — cần lời riêng của Mạnh về ghi cloud.
- Lịch sử giá quỹ căn theo thời gian — chỉ bản mới nhất.

## Notes

- Thư mục chờ có tầng A: chỉ đọc tại máy, mẫu trong hồ sơ và PR phải che; không chép vào `_acceptance`.
