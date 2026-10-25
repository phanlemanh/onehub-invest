# AU9 — Ranh giới khu vực đúng (Hà Nội chỉ gồm phường/xã của Hà Nội)

Hàng lộ trình AU9 (`docs/plan/lo-trinh.json`, hạng T3, nhóm du-lieu-that). Câu giao: «Khu vực Hà Nội chỉ gồm
phường/xã của Hà Nội và Đà Nẵng có phường riêng; metrics tính lại theo ranh giới đúng». Ngưỡng sống của hàng:
«ST_Extent của vn-hanoi nằm trong Hà Nội; 0 khu vực tên «Tỉnh…» dưới vn-hanoi». Cổng Đáng: giám sát trả `build`
(P3-76, 25/10), kèm lưu ý tách phần Đà Nẵng ra thành câu hỏi (C8 `phuong-da-nang` đang chờ).

## 1. Thăm dò (DB local, 25/10)

- `areas` có 160 khu vực `meta.source = osm-phuong` dưới `vn-hanoi`, trong đó **34 là cấp tỉnh** (25 «Tỉnh …»,
  9 «Thành phố …», gồm cả chính «Thành phố Hà Nội» thành con của chính nó). Tâm của 33 khu vực nằm ngoài polygon
  `vn-hanoi`. ST_Extent các con của `vn-hanoi` = BOX(102.14 7.69, 114.86 23.39) — cả nước; polygon `vn-hanoi` chỉ
  BOX(105.29 20.56, 106.02 21.39). `vn-hcmc` sạch (167 phường, extent trong TP).
- Gốc: `stg_osm_boundaries` có một snapshot ranh giới cấp tỉnh (`admin_level = 4`, 34 dòng) mang tiền tố
  `hanoi__`. `reassign-areas.mjs › upsertPhuong` lấy MỌI dòng `snapshot_id LIKE 'hanoi__%'` làm phường, không lọc
  cấp hành chính, không kiểm vị trí → upsert 34 tỉnh thành «phường» Hà Nội. Phường thật sau sáp nhập 2025 là
  `admin_level = 6` (126 dòng Hà Nội, 167 dòng TP.HCM).
- Hậu quả: 19 listing bị gán vào khu vực tỉnh (15 Hưng Yên, 2 Phú Thọ, 1 Ninh Bình, 1 Vĩnh Long) — bước PIP xếp
  theo diện tích nhỏ nhất nên điểm ngoài Hà Nội rơi vào «phường» cấp tỉnh thay vì bị bỏ theo luật 3 của script;
  2 tin bán khớp chữ «thanh-pho-ha-noi»; 36 dòng `market_metrics` + 21 dòng `area_breakdowns` cho khu vực tỉnh.
  Bản đồ Finder Hà Nội (`getFinderAreas({ marketId })`, dựng bounds từ mọi con có metrics) vì thế phủ cả nước.
- Transform tin bán (S03 `transform-zalo.mjs`, S01 `transform-chotot.mjs`) khớp chữ với tên/slug mọi con của
  `vn-hanoi` → tên tỉnh trong bài («Hưng Yên», «Thành phố Hà Nội») cũng thành «phường».
- 11 khu vực `airbnb-discovery` («Quận Tây Hồ»…) dưới `vn-hanoi` còn bị tham chiếu (9 tin bán, 22 dòng
  `market_asset_stats`) — đã có từ trước, nằm trong polygon Hà Nội; không thuộc ngưỡng của hàng.
- `sync-cloud.mjs` phản chiếu `areas` (FILL: upsert + xoá dòng không còn ở local) → sửa local thì lần đồng bộ kế
  đưa ranh giới đúng lên cloud.

## 2. Thiết kế

1. **Lọc cấp phường** trong `upsertPhuong`: chỉ nhận dòng `payload.tags.admin_level = '6'`; dòng khác cấp đếm và
   in một dòng (không upsert). Lý do: tiền tố snapshot là nhãn của bên thu, không đủ tin; cấp hành chính là dữ
   liệu OSM.
2. **Chốt vị trí**: polygon phường mà `ST_PointOnSurface` nằm ngoài polygon market (dung sai 0.01°) → bỏ, in tên.
   Market chưa có polygon → không áp chốt, in một dòng cảnh báo.
3. **Dọn khu vực sai đã có** (bước mới, trong cùng transaction, TRƯỚC bước PIP): con `osm-phuong` của market đang
   chạy mà `osm_id` không thuộc tập phường vừa nhận → «khu vực lạc». PIP chỉ xét phường hợp lệ (loại khu vực lạc),
   nên listing của khu vực lạc được gán lại vào phường chứa tọa độ, hoặc bị bỏ khỏi canonical theo luật 3 hiện có
   (staging giữ nguyên). Tin bán trỏ khu vực lạc → `area_id = NULL`. Xoá `market_metrics`/`area_breakdowns` của
   chúng, rồi xoá khu vực. Khu vực lạc còn `saved_markets` trỏ vào thì theo Hỏi-3 (khuyến nghị: giữ, in id).
   Chốt an toàn: tập phường hợp lệ của một market rỗng hoặc dưới một nửa số con `osm-phuong` hiện có → dừng, không
   xoá gì (snapshot hỏng không được xoá trọn thành phố).
4. **Luật DQ mới** `area_con_ngoai_cha` trong `pipeline/sql/450_dq_checks.sql`: đếm khu vực con có
   `ST_PointOnSurface` ngoài polygon cha (dung sai 0.01°) → `fail` khi > 0, `pass` khi 0. Một sự cố — một check
   (quy tắc đầu tệp 450).
5. **Thời điểm áp (Hỏi-4).** `scripts/cloud-sync.sh` đưa `areas` lên cloud 15 phút một lần, nên áp lên DB local là
   ship. Khuyến nghị: S3/S4 chỉ áp thử trong một transaction rồi ROLLBACK (`kiem-ranh-gioi-khu-vuc.mjs --thu`); áp
   thật `reassign-areas.mjs` + `300_metrics.sql` + `400_breakdowns.sql` (bẫy kỹ thuật #5) sau chữ ký Cổng Bằng chứng,
   rồi chạy script ở chế độ chỉ đọc làm bằng chứng sau áp. `reassign-areas.mjs` không có trong lịch chạy đêm (chỉ
   `pipeline/finalize-hanoi.sh` chạy tay).
6. Tách thân script thành hàm xuất `runReassign(client, cities)` (người gọi giữ transaction, cùng nếp
   `runTransformZalo`) để test chạy trong `BEGIN … ROLLBACK`.

## 3. Phép đo

- Test `pipeline/scripts/reassign-areas.test.mjs` trên DB local trong `BEGIN … ROLLBACK`, dữ liệu mồi tự chèn:
  một phường cấp 6 trong Hà Nội, một ranh giới cấp 4 bao Hà Nội, một ranh giới cấp 6 ngoài Hà Nội, listing ở trong
  phường mồi và listing ở ngoài, tin bán và dòng metrics trỏ khu vực lạc. Chạy hai lần → lần hai không đổi gì.
- `scripts/kiem-ranh-gioi-khu-vuc.mjs --thu`: một transaction trên DB local — chụp trước (phải đỏ), áp, chụp sau
  (ngưỡng của hàng, không dòng nào trỏ khu vực lạc, rollup khớp, `vn-hcmc` trước = sau), ROLLBACK.
- Test app: `getFinderAreas({ marketId: "vn-hanoi" }, { db })` trên chính transaction đó — trước áp có khu vực vượt
  bbox (đối chứng), sau áp mọi khu vực trong bbox `vn-hanoi`.

## 4. Câu hỏi cho Cổng Phạm vi

- **Hỏi-1 (Đà Nẵng).** Câu giao có vế «Đà Nẵng có phường riêng», nhưng C8 `phuong-da-nang` đang chờ theo quyết
  định 25/10 (vết dầu loang Hỏi-4). Khuyến nghị: AU9 KHÔNG nạp phường Đà Nẵng; chỉ gỡ khu vực «Thành phố Đà Nẵng»
  sai chỗ dưới Hà Nội (thị trường `vn-thanh-pho-da-nang` cấp tỉnh giữ nguyên); vế Đà Nẵng đi theo C8. ZC5
  (`airbnb-worklist`) ghi «đứng trên AU9: Đà Nẵng phải có phường» → chuyển phụ thuộc đó sang C8.
- **Hỏi-2 (listing ngoài Hà Nội).** 19 listing ở Hưng Yên/Phú Thọ/Ninh Bình/Vĩnh Long: khuyến nghị theo luật 3 sẵn
  có của script — bỏ khỏi canonical (staging giữ, nạp lại được), không lập thị trường mới. Phương án khác: gán vào
  thị trường cấp tỉnh tương ứng (mở rộng phạm vi, cần quyết định sản phẩm).

- **Hỏi-3 (thị trường đã lưu).** Xoá khu vực lạc trên local thì `sync-cloud` xoá trên cloud và FK cascade xoá
  `saved_markets` của người dùng. Khuyến nghị: không xoá khu vực lạc còn `saved_markets` (local), và trước khi áp
  thật đếm chỉ đọc `saved_markets` trên cloud trỏ khu vực lạc — có dòng nào thì dừng, hỏi lại.
- **Hỏi-4 (thời điểm áp).** Như §2.5.

## 5. Ngoài phạm vi

- Phường Đà Nẵng (C8, theo Hỏi-1).
- 11 khu vực `airbnb-discovery` cũ dưới Hà Nội (trong polygon, đang bị tham chiếu).
- Đổi nhãn snapshot của bên thu ranh giới tỉnh (làn ZCode; script đã không còn tin nhãn).
- Áp thật trước Cổng Bằng chứng (Hỏi-4).
