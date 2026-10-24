# Bản phạm vi — cổng Ops nói thật trên cloud (24/10)

> Nguồn 1: audit cổng Ops trên prod 24/10 (chỉ đọc, phiên ops của Mạnh, deployment có PR #51, code đối chiếu
> `main` @9dd984d) — 20 lỗi `OPS-1`…`OPS-20`, giữ nguyên mã của báo cáo. Báo cáo gốc và ảnh chỉ nằm ở máy local
> của Mạnh (ảnh trang Thu thập có tên nhóm), không commit; mỗi dòng dưới đây đã chép đủ chỗ trong code để mở vòng.
> Nguồn gọi bằng mã: S01 cho thuê ngắn hạn tự thu · S02 hiệu chuẩn · S03 nhóm nội bộ · S05 nhóm mạng xã hội ·
> S06 rao vặt công khai · S08 danh mục dự án.
>
> Nhóm gốc của audit (một hàng gom lỗi chung một gốc, mỗi hàng một kết quả):
> G1 trang đọc bảng/tệp/cổng chỉ có ở local mà không có nhánh cloud (OPS-1, 2, 3, 5, 9; một phần 4, 8) ·
> G2 «không đo được» vẽ thành xanh/đỏ/0 (OPS-3, 4, 5, 10) · G3 mốc giờ UTC cắt chuỗi (OPS-7, chia ngày ở OPS-8) ·
> G4 định nghĩa truy vấn sai/không xác định (OPS-8, 10, 11, 12) · G5 luật SPL / luật 5 (OPS-6, 13, 14) ·
> G6 khung UI, nhãn, mobile (OPS-15…20).
>
> Nguồn 2: sổ ý chờ của đợt `dot0-cam-mau` (mốc khép) — chỉ các mục chưa có mã trong lộ trình và chưa merge
> (đối chiếu `git log origin/main` và `_acceptance/` ngày 24/10), mã `YC*`. Đã bỏ: AU13 cloud-sync (đã cắt),
> `freshness-do-gio-thu-that-s03` (PR #41 đã merge), các mục kiểm vận hành sau merge và lỗi kit (không phải việc
> phát triển của kho).
>
> Nguồn 3: quyết định của Mạnh 24/10 — Câu 1 «tên nhóm (S03) là tầng C» kèm việc mới về tiêu đề chuẩn hoá và mô tả
> nhóm (`QD1*`); Câu 2 «giữ luật tên nguồn thật là tầng A» — chính là cách sửa của `OPS-13`, không thêm mã.
>
> Nguồn 4: quyết định của Mạnh 24/10, nguyên văn «Chọn A» (`QD2*`, ADR-0014): dashboard Ops trên prod không có số vì
> dữ liệu để tính chỉ ở local → máy local tính sẵn số tổng hợp rồi đẩy lên cloud, trang Ops trên cloud chỉ đọc bảng số
> đó. Đã loại B (sync bản gọt của bảng — chỉ chữa registry) và C (tunnel tới local). Đây là gốc chung của G1/G2:
> các hàng trang ON2, ON3, ON4, ON5 và AU12 đứng trên hàng nền mới ON22.
>
> `OPS-1`, `OPS-2` đang sửa nóng trong đợt `dot0-cam-mau` (hàng phát sinh `ops-review-sources-500-tren-cloud`) —
> không cắt lại; ghi ở mục chờ điều kiện để răng phủ.

<!-- <<<PHAM-VI-MA -->
```
dot: ops-noi-that-2410
dang: lan-va
nguon: audit Ops prod 24/10 (OPS-1…OPS-20, máy local của Mạnh); sổ ý chờ dot0-cam-mau mốc khép; quyết định Mạnh 24/10 Câu 1 + Câu 2; quyết định Mạnh 24/10 «Chọn A» (ADR-0014)

- `OPS-1` — /ops/review trên cloud trả 500 (bảng hàng chờ tầng A chỉ có ở local; app/src/app/ops/review/page.tsx:35 query thẳng) — đang sửa ở dot0
- `OPS-2` — /ops/sources trên cloud trả 500 (query source_registry ở app/src/app/ops/sources/page.tsx:37-40 không bọc) — đang sửa ở dot0
- `OPS-3` — Lockdown trên /ops/collections báo sai hai chiều: getLockdownStatus (app/src/lib/ops-queries.ts:148-208) không có nhánh cloud nên hạ tầng «Hỏng» giả, L4b «Ổn» giả khi grep thất bại (turns = 0), mâu thuẫn bảng Máy móc
- `OPS-4` — ô KPI /ops («Quá hạn 0» badge xanh, «Chưa có snapshot 0») và /ops/collections («Sức khoẻ nguồn 0/0») trấn an khi không đo được; overview-tiles.tsx:94 coi danh sách rỗng là không quá hạn
- `OPS-5` — ô «Bản ghi 24h = 0» trên /ops/collections trong khi dữ liệu vẫn chảy; collections-tiles.tsx:33 cộng feeds rỗng trên cloud
- `OPS-6` — tên nhóm S03 hiện trên cloud qua ops_heartbeat (push-ops-facts.mjs đẩy zaloGroups[].name) trong khi code đánh data-tier-a ở collections-tables.tsx:115
- `OPS-7` — mốc giờ Ops là UTC cắt chuỗi không ghi múi (jobs-grid.tsx:37, pipe-panels.tsx:50/63, dq-checks-table.tsx, ISO thô ở cổng gate), getFlowDays chia ngày theo UTC (collections-queries.ts:78-110)
- `OPS-8` — «Luồng 7 ngày qua» mâu thuẫn: cột offer đếm sale_offers mọi nguồn, facts chỉ một ngày, cột bảng rỗng trên cloud luôn 0, ngày gom UTC (collections-queries.ts:78-110)
- `OPS-9` — bảng nhóm S03 trên cloud ghi «allowlist đang bật 0 nhóm» và «Vào raw = 0» mọi nhóm: readZaloAllowlist (collections-queries.ts:326) đọc tệp cấu hình ngay trên Vercel, facts thiếu allowlist, accepted theo nhóm luôn 0
- `OPS-10` — «Kiểm chất lượng» /ops/quality ghi «Đạt» xanh cạnh độ phủ 0% (pass = có số tham chiếu tươi, dq-truthful-coverage.mjs:3) và «20 kiểm» là LIMIT 20 (quality/page.tsx:23)
- `OPS-11` — «Hiệu chuẩn» /ops/quality số mâu thuẫn giữa các bảng: area_sources LIMIT 1 không ORDER BY (queries.ts:1006) bốc market rỗng, ba định nghĩa «tự thu» cùng nhãn, mẫu mỏng không cờ
- `OPS-12` — /ops/deals dồn ở trần −40…−50%, căn diện tích/số phòng phi lý, thẻ thiếu diện tích vẫn có giá/m², nhãn «mới» nghĩa là «chưa đăng lại» (deals.ts:46-66; thước theo loại hình là PL26)
- `OPS-13` — tên nguồn thật hiện ngoài /ops/sources: nhãn cứng ở components/ops/collections/*, /ops/quality, nhãn job ở push-ops-facts.mjs và readSchedulerStatus
- `OPS-14` — số S02 hiện ngoài /ops/quality: tab «Listing» của biểu đồ luồng gộp listing S02, bảng có cột market/listing S02, panel Rotation liệt market S02 kèm ID (sync-activity.tsx, collections-queries.ts:78-110)
- `OPS-15` — 10/29 thẻ «Hiệu chuẩn» toàn «—» không empty-state, header vẫn đếm 29 (quality/page.tsx:35 chỉ lọc data !== null)
- `OPS-16` — /ops/deals thiếu PageHeader, không đếm/lọc/phân trang, cắt 30 tin không báo, text-[10px], câu «thông tin người đăng chỉ ở máy thu» lỗi thời sau chốt 23/10
- `OPS-17` — nhãn lệch CONTEXT.md và tiếng Anh lọt: «Review Queue», «Occupancy», «Offers tầng P1/P2», mã thô DQ (bait_gap, truthful-coverage, our=0 …), «Toggle Sidebar», tên thị trường không dấu hoặc bị cắt
- `OPS-18` — mobile 390px: cột Trạng thái của bảng Lockdown, Sức khoẻ nguồn, nhóm, Máy móc, DQ, Độ phủ nằm ngoài màn hình
- `OPS-19` — «Dòng log cuối» của job sync là dòng cảnh báo rác của Node (scheduler() trong push-ops-facts.mjs lấy dòng cuối không lọc)
- `QD3` — Mạnh 24/10 «Đồng ý theo khuyến nghị»: tách phần sửa lockdown ở máy local (không «Ổn» khi không kiểm, log có nghĩa) ra chạy trước chuỗi facts; phần hiện trên cloud chờ ON22
- `OPS-20` — /ops lặp «Độ tươi chỉ đo ở máy local» ba lần; bảng «Độ tươi theo nguồn» trống không hành động, tab và ô tìm vẫn hiện
- `QD1` — tên nhóm S03 là tầng C (Mạnh 24/10): sửa ADR-0007 (mục sửa đổi), AGENTS.md luật 6, bỏ data-tier-a ở cột tên nhóm
- `QD1a` — người vận hành điều chỉnh tiêu đề của từng nhóm trên /ops
- `QD1b` — giúp tạo tiêu đề chuẩn hoá theo quy ước vận hành
- `QD1c` — mô tả đặc trưng của nhóm, thông tin cung cấp ngữ cảnh quan trọng cho AI Agent
- `QD2` — Ops trên cloud đọc số tổng hợp máy local tính sẵn (Mạnh 24/10 «Chọn A», ADR-0014): push-ops-facts đẩy độ tươi/SLO từng nguồn S0x, job đêm, lockdown/watchdog, bản ghi 24h, số thẻ chờ, mỗi khối có measured_at, qua bộ soát tầng A của NT2; tên nguồn thật không lên, tên nhóm được lên; facts cũ > 45′ là tín hiệu sức khoẻ
- `QD2a` — /ops/review trên cloud chỉ hiện «N thẻ đang chờ» từ số đếm máy local đẩy lên; nội dung thẻ (tầng A) ở local
- `YC1` — DELETE /api/v1/ops/zalo/accounts không kiểm id rỗng nên gọi openclaw logout với tài khoản rỗng (sự cố P1-7 23/10); route phải từ chối id rỗng/không có trong danh sách, test với openclaw giả
- `YC2` — luật thường trực «phép đo không gọi phương thức ghi trên route zalo/openclaw» trong .claude/rules/zalo-safety.md
- `YC3` — app/docs/api/mcp-tools.json khai oneinvest_get_offers công khai («auth: public») trái sổ bề mặt (NT4 Ngoài-6)
- `YC4` — nguồn quá hạn hiện tuổi bằng SLO («8 ngày / SLO 8 ngày») vì fmtAge làm tròn xuống (AU6 Ngoài-3)
- `YC5` — audit-all và /ops/collections suy ROOT từ vị trí script nên chạy từ worktree đọc pipeline/logs rỗng, báo LIMITED/«Hỏng» giả (AU5 Ngoài-1/3)
- `YC6` — ô KPI /ops trên cloud vẫn xanh «không quá hạn»/«mọi nguồn đã có snapshot» dù không đo được (ops-prod-sap-source-registry Ngoài-2)
- `YC7` — /api/v1/ops/coverage trên cloud trả rows rỗng không cờ «chỉ đo ở local» (ops-prod-sap-source-registry Ngoài-3)
- `YC8a` — collector phát tín hiệu lần thu gần nhất của từng nguồn S03/S05 kể cả lần không có bài mới (P3-17, làn ZCode)
- `YC8b` — check-freshness lấy mốc S03/S05 theo tín hiệu lần thu, không báo quá hạn giả khi nguồn chạy mà không có bài mới (P3-17)
- `YC9a` — migration 040 stg_s08_inventory chỉ local (số đã giữ chỗ ở SO-MIGRATION 24/10)
- `YC9b` — luật S08 «chỉ nội bộ, chỉ đọc, một lần mỗi tuần, không tái xuất lên cổng công khai» trong AGENTS.md cạnh luật 5 và .claude/rules/pii-spl.md
- `YC9c` — source_registry ở DB local có dòng S08 (tên miền thật tầng A, không vào code hay commit)
- `YC9d` — importer S08 nạp snapshot vào stg_s08_inventory (làn ZCode, chặn bởi migration 040)
- `YC10` — ROADMAP V9 ghi project Vercel cũ đã xoá 24/10 (commit 572882d còn nằm ngoài main)
```
<!-- PHAM-VI-MA>>> -->
