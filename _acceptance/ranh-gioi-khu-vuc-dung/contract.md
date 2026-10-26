---
schema_version: 1
feature: Khu vực Hà Nội chỉ gồm phường/xã của Hà Nội; metrics tính lại theo ranh giới đúng
slug: ranh-gioi-khu-vuc-dung
owner: phanlemanh@gmail.com
risk_tier: T3
surfaces: [pipeline]
status: signed-off
approved_by: Mạnh
approved_at: 2026-10-26
design_doc: docs/superpowers/specs/2026-10-25-ranh-gioi-khu-vuc-dung-design.md
lo_trinh_ma: AU9
---

# Acceptance Contract: ranh-gioi-khu-vuc-dung

## Context

Hàng AU9 (Audit L8, P5). Thăm dò DB local 25/10 (design doc §1): 34 ranh giới cấp tỉnh (`admin_level = 4`) bị
`pipeline/reassign-areas.mjs` nạp làm «phường» dưới `vn-hanoi` vì script lấy mọi dòng snapshot mang tiền tố
`hanoi__`; 19 listing và 2 tin bán bị gán vào đó; bản đồ Hà Nội phủ cả nước. «Phường» = ranh giới OSM
`admin_level = 6`. «Khu vực lạc» = con `osm-phuong` của một market đang chạy mà `osm_id` không thuộc tập phường hợp
lệ của lượt chạy. «Dung sai» = 0.01°. Hai câu Hỏi ở design doc §4.

## Criteria

- AC-1: Given snapshot ranh giới của một thành phố có cả dòng `admin_level = 6` (payload chép từ một dòng thật của
  `stg_osm_boundaries`) và dòng cấp khác, When `runReassign` chạy, Then chỉ dòng cấp 6 thành khu vực con, dòng cấp
  khác không được upsert, và con số «bỏ N dòng khác cấp» in trong log bằng đúng số dòng khác cấp 6 của snapshot;
  chiều đỏ: dòng cấp 4 bao trùm thành phố không xuất hiện trong `areas`.
- AC-2: Given một ranh giới cấp 6 có `ST_PointOnSurface` nằm ngoài polygon market quá dung sai, When `runReassign`
  chạy, Then nó không được upsert và tên của nó được in; market chưa có polygon thì chốt này không áp và in một dòng
  cảnh báo.
- AC-3: Given khu vực lạc có listing, tin bán, `market_metrics`, `area_breakdowns` trỏ vào, When `runReassign` chạy
  với cờ xoá khu vực lạc (AC-10),
  Then listing nằm trong một phường hợp lệ được gán sang phường đó, listing ngoài mọi phường hợp lệ bị bỏ khỏi
  canonical theo Hỏi-2, tin bán trỏ khu vực lạc có `area_id` NULL, dòng metrics/breakdowns của khu vực lạc bị xoá,
  khu vực lạc bị xoá; khu vực lạc còn `saved_markets` hoặc `properties` trỏ vào thì KHÔNG xoá (Hỏi-3), in id kèm số
  dòng.
- AC-4: Given `runReassign` vừa chạy xong, When chạy lại lần hai trên cùng dữ liệu, Then không listing nào đổi khu
  vực, không listing nào bị bỏ, không khu vực nào bị xoá.
- AC-5: Given `pipeline/sql/450_dq_checks.sql`, When chạy trên dữ liệu có một khu vực con nằm ngoài polygon cha
  quá dung sai, Then ghi `dq_check_results` dòng `area_con_ngoai_cha` trạng thái `fail` kèm số khu vực; trên dữ liệu
  sạch thì `pass`.
- AC-6: Given DB local, When `scripts/kiem-ranh-gioi-khu-vuc.mjs --thu` chụp trạng thái trước, áp `runReassign` +
  `300_metrics.sql` + `400_breakdowns.sql` (có cờ xoá khu vực lạc) trong MỘT transaction, chụp trạng thái sau rồi ROLLBACK (theo Hỏi-4),
  Then trạng thái trước đỏ đúng các dòng extent và «Tỉnh…» (đối chứng dương), trạng thái sau có ST_Extent các con
  của `vn-hanoi` nằm trong bbox polygon `vn-hanoi` (dung sai), 0 con tên bắt đầu «Tỉnh» hay «Thành phố», 0 con có
  tâm ngoài polygon cha ở `vn-hanoi` và `vn-hcmc`, số phường `vn-hcmc` trước bằng sau; script in số trước và sau.
- AC-7: Given cùng lượt `--thu` đó, When so trạng thái sau, Then không dòng `listings`, `sale_offers`,
  `market_metrics`, `area_breakdowns`, `market_asset_stats` nào trỏ tới id không có trong `areas` hoặc tới khu vực
  lạc đã gỡ (danh sách khu vực lạc lấy từ trạng thái trước, phải khác rỗng), và ở mỗi tháng dòng `market_metrics`
  cấp market của `vn-hanoi` có `booked_nights` và `revenue` bằng đúng tổng các dòng con hiện có.
- AC-8: Given DB local trong một transaction đã áp như AC-6, When gọi `getFinderAreas({ marketId: "vn-hanoi" }, { db })`
  trên chính transaction đó, Then có ít nhất một khu vực và mọi khu vực trả về có hình nằm trong bbox polygon
  `vn-hanoi` (dung sai); đối chứng: cùng lời gọi trước khi áp trả ít nhất một khu vực vượt bbox.
- AC-9: Given lượt chạy mà tập phường hợp lệ của một market rỗng hoặc nhỏ hơn một nửa số con `osm-phuong` hiện có,
  When `runReassign` chạy, Then nó dừng (rollback, thoát ≠ 0, in tên market và hai con số) và không xoá khu vực,
  listing hay metrics nào; chiều đỏ: snapshot mồi mất tag `admin_level` → dừng.
- AC-10: Given khu vực lạc có listing, tin bán, metrics trỏ vào, When `runReassign` chạy KHÔNG có cờ xoá khu vực lạc
  (mặc định — gồm lượt theo lịch hằng tuần `weekly-collect.sh` → `finalize-hanoi.sh` → `node reassign-areas.mjs
  hanoi`), Then không khu vực lạc nào bị xoá, không dòng `market_metrics`/`area_breakdowns`/`market_asset_stats` nào
  của chúng bị xoá, `sale_offers.area_id` của chúng giữ nguyên; listing vẫn được gán lại theo phường hợp lệ như AC-3;
  log in danh sách khu vực lạc kèm số dòng trỏ vào và câu lệnh dọn có cờ. Bước dọn AC-3 chỉ chạy khi gọi tường minh
  `node reassign-areas.mjs <city> --xoa-khu-vuc-lac` (hàm: `{ xoaKhuVucLac: true }`); `finalize-hanoi.sh` không mang
  cờ đó (kiểm tĩnh). Chiều đỏ: cùng mồi, có cờ → khu vực lạc bị xoá.

## Coverage

Trục: {lớp: nạp ranh giới (AC-1, AC-2), dọn dữ liệu đã sai (AC-3), lặp lại (AC-4), chốt chặn tái phát (AC-5),
chốt an toàn khi snapshot hỏng (AC-9), lượt theo lịch không xoá (AC-10), dữ liệu thật đo trong transaction rồi rollback (AC-6, AC-7), mặt người
dùng (AC-8)} × {đo: test trong transaction có mồi, script chỉ đọc trên
DB local, test app}. Hà Nội là thị trường bị lỗi; TP.HCM là đối chứng không được đổi (AC-6).

## Đường đo

- «Khu vực Hà Nội chỉ gồm phường/xã của Hà Nội» — AC-1, AC-2, AC-6 (ngưỡng hàng: extent + 0 «Tỉnh…»).
- «metrics tính lại theo ranh giới đúng» — AC-3, AC-7.
- «bản đồ Hà Nội phủ cả nước» (vì sao của hàng) — AC-8.

## Out of scope

- Phường Đà Nẵng — theo Hỏi-1 (C8 `phuong-da-nang` đang chờ); AU9 chỉ gỡ khu vực «Thành phố Đà Nẵng» sai chỗ dưới
  Hà Nội.
- 11 khu vực `airbnb-discovery` cũ dưới Hà Nội (nằm trong polygon Hà Nội, còn bị tham chiếu).
- Đổi nhãn snapshot của bên thu ranh giới cấp tỉnh (làn ZCode).
- Áp thật lên DB local trước Cổng Bằng chứng — theo Hỏi-4, áp thật là bước sau chữ ký (S5), vì `sync-cloud`
  15 phút một lần đưa ngay lên cloud.

## Notes

- Theo Hỏi-4: S3/S4 chỉ đo trong transaction rồi ROLLBACK; áp thật (`node reassign-areas.mjs hanoi
  --xoa-khu-vuc-lac` + 300 + 400) sau chữ ký Cổng Bằng chứng, rồi chạy `kiem-ranh-gioi-khu-vuc.mjs` (chế độ chỉ đọc) làm bằng chứng sau áp. Trước khi áp thật,
  đếm (chỉ đọc) `saved_markets` trên cloud trỏ khu vực lạc theo Hỏi-3.
- Bỏ listing khỏi canonical đảo được: staging giữ nguyên, chạy lại transform + reassign là nạp lại.
- Test AU9 cần dữ liệu ranh giới thật (`pipeline/scripts/reassign-areas.test.mjs`, `app/tests/finder-ranh-gioi.test.tsx`)
  tự bỏ qua có lý do khi `CI=true` mà DB không có dữ liệu thật; khi AU11 (`scripts/ci-bo-qua.json`) vào main thì chuyển
  các ca này vào danh sách bỏ qua đó.
- Nâng phạm vi ở Cổng Bằng chứng 26/10 (Ngoài-1/4/5, AC-10): `reassign-areas.mjs` chạy tự động hằng tuần qua
  `pipeline/scripts/weekly-collect.sh` → `finalize-hanoi.sh`; rào `saved_markets` chỉ thấy DB local còn thị trường
  người dùng lưu nằm trên cloud, nên lượt theo lịch không được xoá khu vực — chỉ lượt gọi tay có cờ mới xoá.
- Known limits — chọn ở Cổng Bằng chứng 2026-10-26:
  - Ngoài-2: phép kiểm `area_con_ngoai_cha` và cờ `meta.lac` đặt tên tiếng Việt, lệch cách đặt tên của các phép kiểm và khoá meta khác.
  - Ngoài-3: khu vực lạc được giữ lại ở lượt dọn có cờ (vì còn thị trường người dùng lưu) có thể tạm nhận tin Airbnb tới lượt chạy hằng tuần kế tiếp.
  - Ngoài-4: nếu đổi câu ghi chi tiết của phép kiểm khu vực con, trang Ops có thể hiện «(chưa diễn giải)» mà bộ kiểm không báo đỏ.
  - Ngoài-5: lời hứa «bước gán Airbnb không gán vào khu vực lạc» chỉ được đo bằng đọc mã nguồn, chưa chạy đường gán thật.
