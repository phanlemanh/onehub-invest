# pipeline/ — Transform & Metrics

## What This Does
Reads raw snapshots from `../collector/snapshots/` → validates → transforms → writes to PostgreSQL.

## Key Scripts

| Script | Purpose |
|--------|---------|
| import-airbnb.mjs | Import snapshots (verify sha256, write staging tables) |
| transform-airbnb.mjs | Staging → canonical (listings, nights); area = phường chứa tọa độ; ngoài mọi phường → nghỉ `ngoai_phuong` mang toạ độ lần thu mới (reassign không đánh thức bằng toạ độ cũ) |
| transform-zalo.mjs | Zalo posts → sale_offers, rent_lt_offers (gạt post thử qua lib/test-posts.mjs); số đọc trên chữ đã gạt URL/SĐT (đuôi nhóm nghìn của giá đồng không bị gạt, kể cả khi sau là khoảng trắng + 1–2 chữ số), luật giá VN, chặn giá phi lý, phường theo thị trường nhóm (N1); bài không ghi «bán/cho thuê» được suy loại (RM1: Yêu cầu → cửa vào → đơn vị giá → tín hiệu bán → mục đích nhóm, `suyLoai`), log đếm theo nguồn; SV1: DT có phẩy, PN viết tắt, phường trùng hướng phải gọi đích danh, số ngữ cảnh không thành giá, thuê từ 1 tỷ không đơn vị thời gian thành bán (`chinhLoaiThueTy`), giá che số lưu số sàn, giá không đơn vị sau công tắc `giaKhongDonVi` mặc định bật, toà và trục qua phát biểu `parser` (`docToaTruc`, `phatBieuToaTruc`), trục vào khoá gom `repostKey` |
| transform-media.mjs | Bảng `media` (RESO Media, NH1) cho tin sống S03/S05/S06; S03 nối thêm ảnh của tin chỉ-ảnh vào offer của tin chữ gần nhất cùng người, dưới 2 phút (PL28, `lib/gop-anh.mjs`) |
| gan-sdt-s06.mjs | SĐT S06 từ `stg_chotot_ads.seller` lên `sale_offer_records`, ghép theo tài khoản có đúng một số, tin ẩn số không nhận số ghép, xuất xứ ở `field_provenance.seller_phone` (068 giữ qua phân xử); tin có số mà mất khoá xuất xứ được dựng lại bằng cách so với stg, không khớp thì giữ nguyên và đếm `khong_ro`; gọi cuối `transform-chotot`; chưa áp 068 thì in `CHUA-AP-068`, không ghi; view chưa có cột nhãn (070) thì in `CHUA-AP-070`, số trực tiếp vẫn ghi, số ghép mới thì không; `--thu` đo trong ROLLBACK, không in số |
| do-so-ghep-s06.mjs | Đo trên DB thử (`db/db-thu.sh oneinvest_sg`): áp 068, 070, gán số, dựng danh bạ, in số trước và sau cho bí danh, người, `sellers`, tin có nhãn; COMMIT trên DB thử; DB không phải `oneinvest_*` thì thoát 2, bất biến sai thì thoát 1; không in số |
| thu-so-s06.mjs | Làn ZCode: thu SĐT người bán S06 qua Chrome CDP, mỗi tài khoản một lần, tin ẩn số không gọi; miền nguồn chỉ từ env `S06_WEB_BASE`; `--minutes 0` đo số việc rồi thoát, không mở trình duyệt; bản v5 ghi ở `state/seller-v5/`, nạp cuối lượt theo đường chỉ-người-bán của `import-chotot` |
| bu-seller-v5.mjs | Làn ZCode: đối chiếu state với stg, bù số còn thiếu bằng một bản v5; không gọi nguồn; chạy từ worktree giữ `state/thu-so-s06/` |
| refresh-bait-gap.mjs | Bait gap P1 + đếm người bán (`sellers` là VIEW từ 060, không ghi); `buocDem` chạy phần bait gap trong MỘT giao dịch mở bằng khoá chung `KHOA_BAIT_GAP` (`hashtext('refresh-bait-gap')`; `savepoint: true` chỉ lấy khoá) — ba job gọi bước này xếp hàng, đụng khoá hay chết giữa chừng thì lùi trọn, người đọc không thấy P1 rỗng giữa lượt (bait-gap-mot-giao-dich; thước `scripts/refresh-bait-gap-khoa.itest.mjs` dưới `db/db-thu.sh --chay`, `scripts/refresh-bait-gap-goi.test.mjs`); rồi dựng danh bạ Người trong giao dịch riêng cũng lấy khoá ấy; sau sổ liên lạc số, `ghiLienLacHoSo` (`lib/lien-lac-ho-so.mjs`) ghi liên lạc hồ sơ chat từ `stg_s03_ho_so` (080; chưa áp thì in `CHUA-AP-080`, không ghi) |
| lap-yeu-cau-ho-so.mjs | link-nguoi-ban-s03 (AC-8): lập tệp yêu cầu `{mas, doi_chung}` cho bộ tra hồ sơ người bán S03 — 20 mã có từ 3 tin, không số ở tin hay Người, chưa tra trong 30 ngày (cả snapshot hồ sơ chưa nạp) + 2 mã đối chứng gửi tin trong 24 giờ; không `--out` thì chỉ đếm; chỉ đọc DB, không in mã; tệp ngoài `~/.openclaw` và `snapshots/` |
| scripts/test-data-residue.mjs | Đếm tin sinh từ post thử còn sót; `--simulate` chạy thử dọn rồi ROLLBACK. Câu đếm SQL độc lập (`TEST_POST_SQL_T`) viết bốn dấu bằng SQL, vế nội dung lấy `noiDungSql` của `lib/test-posts.mjs` (GN5); `scripts/dau-bai-thu-sql.test.mjs` giữ nó, `S03_POSTS_SQL`, bản app và `IS_TEST` của 600 khớp `testMarker` từng dòng |
| transform-hcmc-simple.mjs | HCMC-specific (market-first, then phường assign) |
| transform-airdna.mjs | AirDNA XHR → airdna_markets, metrics, scores |
| vocab.mjs | Sổ từ vựng một nguồn (PL6): `--write` sinh hằng từ `mappings.yaml` `enums:` · `--check` · `--lint` (enum viết tay) · `--check-db` (ref_* + CHECK) · `--check-field-targets` |
| reassign-areas.mjs | Upsert phường OSM (areas + polygon), point-in-polygon mọi listing VN, listing ngoài mọi phường NGHỈ (`ngoai_phuong`, không xoá), xoá area không phải phường OSM — trừ xã danh bạ mang `admin_code` (PX1, 084), kể cả khi lạc |
| nap-dvhc.mjs | PX1: nạp danh bạ 3.321 xã, phường, đặc khu của Cục Thống kê (`pipeline/data/dvhc`, băm ở `NGUON.json`; lệch → thoát 2) vào `areas` dưới 34 thị trường: khớp tên CÓ dấu, ưu tiên phường OSM, gắn `admin_code` mà giữ id/tên/ranh giới; xã thiếu chèn `meta.source='dvhc'`, `geom` rỗng; 10.033 xã cũ vào `area_aliases` (441 tách → «cần chọn xã»); chạy lại `doi=0`; `--thu` ROLLBACK; cần 084; xong chạy reassign-areas rồi 300 + 400 |
| scripts/nap-dvhc-do.mjs | Thước PX1 AC-9 trên DB thử: tin có xã trước (area_id đang lưu) / sau (nạp + gán lại bằng hàm của transform) theo tỉnh, đối chứng code, đổi xã ngoài `doi-xa-khai-truoc.json` thì đỏ; `--doi-chung-hong`; ROLLBACK |
| scripts/nap-lai-ba-luot.mjs | Thước PL14: ba lượt nạp S03→S05→S06→airbnb trong giao dịch ROLLBACK, ma trận quyết định/liên kết 7×2; `--doi-chung=039\|khong-chuyen` |
| phat-bieu-cat-chuyen.mjs | PL15 bước chuyển: giá trị có sẵn của năm cột → phát biểu `legacy`, mở cổng phân xử; `--thu` ROLLBACK |
| scripts/dung-lai-canonical.mjs | Thước PL15: xoá năm cột rồi dựng lại trong giao dịch ROLLBACK (0 ô lệch); `--nguon-goc`; `--doi-chung=…` |
| scripts/phat-bieu-chay-that.mjs | PL15: ba transform + phân xử trên dữ liệu thật, đo giây, ROLLBACK (`--thu`) |
| resolve-properties.mjs | Bước cuối chotot-daily. Stage A gom cụm S06 (ô lưới × loại × DT × giá) thành `properties` + `property_offers`, gỡ SĐT khỏi ô đường, điền đường căn trống. Stage B ĐÓNG BĂNG (V7, `_acceptance/dong-bang-stage-b-resolve`, Q1 08/11 — gắn căn = nhận diện duy nhất): không dựng, không xoá cặp `property_candidates` (giữ làm lịch sử), in một dòng «Stage B: đóng băng (V7)»; thay thế là danh bạ vật thể (DB1) + gắn căn GC0–GC3. Thước: `tests/resolve-properties-dong-bang.itest.mjs` (DB của riêng lượt), `tests/resolve-properties-deadlock.itest.mjs` |
| trang-thai-chao.mjs | PL19: bộ ghi bằng chứng + phân xử trạng thái chào mọi tin (059 `ghi_bang_chung_chao`, `resolve_offer_status`), in đếm năm trạng thái — bước cloud-sync ngay trước `bac-du-lieu`; khoá 56056. V6 (085): giữa hai bước chạy luật ngừng rao `ghi_khong_thay_lai` (không thấy lại quá 21 ngày khi nguồn/nhóm vẫn thu → `withdrawn` suy luận; thấy lại → rút `thay-lai`), in thêm dòng «ngừng rao S03 · S05 · S06»; DB chưa áp 085 thì in «chưa áp 085», không lỗi; `--thu` ROLLBACK. Thước: `scripts/trang-thai-chao-ngung-rao.itest.mjs` |
| scripts/trang-thai-roundtrip.mjs | Thước PL19 (AC-8): trang-thai-chao hai lần trên DB thử, đếm độc lập, chiều đỏ DB không tới được |
| dung-nguoi.mjs | DB2b: dựng danh bạ Người + vai người đăng một lượt (chạy đêm đi qua `buocDem` của refresh-bait-gap); `--thu` ROLLBACK. HD13: người theo SĐT gộp vào người theo tài khoản cùng nguồn khi nối một–một (merged + merged_into + sự kiện `gop`); `--tach <party_key> --ly-do «…»` tách lại (split + sự kiện `tach`, không gộp lại tự động). Bước gộp chỉ ghi khi công tắc `ops_audit` `danh-ba:gop-sdt` mới nhất có `detail.bat = true` — mặc định TẮT (in «công tắc gộp tắt (chờ N)»); `--cong-tac-gop bat\|tat --ly-do «…»` ghi một dòng công tắc, không dựng |
| danh-ba-vat-the.mjs | DB1/DB1b: dựng danh bạ vật thể toà · trục · căn cao tầng từ danh mục S08 đã nối khu + bí danh tên toà trên tin (`--khu <slug,…>`, mặc định Ocean Park 1 + Grand Park; `--tu-dien <tệp>` chủ đầu tư). Đích: DB thử `oneinvest_<việc>` trên máy này ghi không cờ; DB khác trên máy này (gồm máy thu `oneinvest`) chỉ với `--db-that`, lần dựng đầu (chưa có toà) còn đòi `--sao-luu <tệp pg_dump không rỗng>`; máy chủ ngoài máy này luôn bị chặn, kể cả có cờ (đọc máy chủ từ `connectionParameters` của pg, tính cả `?host=`, `PGHOST`). Slug khu sai → thoát 2 gọi tên, không ghi; khu có nút mà 0 dòng danh mục → `khu_khong_s08` + cảnh báo. Chạy đêm: `buocVatTheDem` gọi từ `refresh-bait-gap` sau danh bạ Người, giao dịch riêng, chỉ giữ tươi khu đã có toà, không dựng lần đầu, không ghi chủ đầu tư; chưa áp 082 / chưa dựng lần đầu thì in một dòng «bỏ qua». Ở bản này ba bảng vật thể chưa đồng bộ lên cloud — phạm vi của vòng, không phải luật. DV1: `--sua-xa [--tep <tệp>] [--thu]` ghi mã xã hiện hành cho mọi nút dự án từ `pipeline/data/xa-nut-du-an.json` (xã cũ + nguồn có tên → `area_aliases` PX1, tra theo mã; tệp phải khớp một-một với nút dự án, một mục lỗi thì thoát 2 không ghi), rút phường kế thừa của toà không còn đúng (`sua-xa-nut`); cùng rào đích; không chạy đêm. Thước: `scripts/danh-ba-vat-the-xa.itest.mjs`, `scripts/danh-ba-vat-the-xa-that.itest.mjs` (dưới `db/db-thu.sh --chay`). DA1 (088): mã tỉnh ISO của toà suy từ `area_ids` của khu (thị trường → `admin_code` → bảng `iso_regions` 34 dòng), không đọc `meta.city`; khu không tỉnh/hai tỉnh thoát 2; DB chưa áp 088 thì chỉ dựng lại khu đã có toà theo `meta.city` và in «chưa áp 088 — ISO theo meta.city»; chủ đầu tư ghi `source_field` kèm tên tệp + băm. Thước: `scripts/danh-ba-vat-the-iso.itest.mjs` |
| scripts/nap-lai-nguoi.mjs | Thước DB2b: hai lượt transform + bước đêm trong giao dịch ROLLBACK, lượt 2 bằng 0, đối chứng bỏ tra bí danh; `--doi-chung-hong`. HD13: gộp lượt 1 = N1 chưa gộp, N1 sau = 0, kiểm đích gộp, không người hai SĐT, đối chứng luật lỏng + gộp sai. Lượt 0 công tắc tắt (gộp 0, gop_cho = N1), bật trong giao dịch rồi mới lượt 1; đối chứng bước đêm ép gộp ở lượt 0 |
| scripts/do-va-doc-tin.mjs | Thước SV1 (AC-9): bộ đọc trên tập nhãn audit ghim sha256 và toàn bộ bài S03 thật, chỉ đọc; so bản nền ghim; đỏ khi vượt trần nghỉ, mọc, S05 đổi; `--loi` in lỗi phần để chỉnh, chỉ dùng ở máy này |
| label-sample.mjs | PL7: chọn tin vào `eval_label_items` cho người gắn nhãn mù (`--lat ocp1` lọc tên nhóm; `--lat s03-loai-tin` phân tầng ba phần bằng nhau theo `tangLoai` — chữ bài · mới nhận · vẫn bỏ); `--thu` không ghi; khử trùng theo `khoaTrung` (`lib/eval-labels.mjs`: tin của pipeline `o:<offer_id>` trước, chữ đã gạt URL `c:` sau), gạt sự kiện JSON ở cột chữ (`bo_su_kien`), in `bo_vi_trung` |
| label-ghep.mjs | Cột `eval_label_items.ghep` của một lát: cụm ảnh (PL28, `lib/ghep-mau.mjs`) rồi dấu trùng theo `khoaTrung` (`trung_voi` + `khu_trung` tin/chữ; thẻ giữ: nhiều nhãn nhất → được dấu ẩn tay trỏ tới → item_id nhỏ nhất); dòng `an_tay` không bao giờ bị gỡ; lát đã có ghép mà không `--lam-lai` thì giữ cụm cũ, chỉ thêm dấu trùng; đích không phải DB thử phải `--db-that` |
| label-mau.mjs | PL8: tập tin mẫu lát OCP1 có đáp án biết sẵn (`--lat ocp1 --n 200 --seed s [--out f.jsonl]`); hàm thuần `lib/tap-mau.mjs` + khuôn `lib/khuon-mau-ocp1.mjs`, không DB, không đường tới canonical/stg |
| do-danh-ba-sdt.mjs | SD5: năm kiểm trục SĐT của danh bạ Người (audit 30/10 N1–N5) theo nguồn S03/S05, `--write` ghi `dq_check_results` một dòng mỗi kiểm mỗi ngày; bước cuối `scripts/cloud-sync.sh` |
| do-the-duyet.mjs | HD11: bốn kiểm độ đủ dữ liệu thẻ ghép căn chờ duyệt (rời kho, ảnh theo vai, độ đầy 10 trường + người đăng theo nguồn), `--write` ghi `dq_check_results` một dòng mỗi kiểm mỗi ngày; bước cuối `scripts/cloud-sync.sh` |
| mau-soat-cuon-chieu.mjs | DO1: rút 20 bài S03 nhận trong một ngày VN vào lát `s03-cuon-chieu` (gạt bài thử, khử trùng, gồm bài không thành tin, hạt giống `cc-<ngày>`), gọi đọc gộp một lần cho bài thiếu trong trần ngày (`--tran-usd`, mặc định 0,05), chụp nháp mọi cách đọc vào `eval_label_items.draft` (083); ngày đã có thẻ thì không rút, không gọi; `--thu` không ghi |
| do-hang-ngay.mjs | DO1: bậc từng đơn vị (`data_level_unit`, tập `data_level_units()` của 087 — cùng 610) → dòng chuyển bậc (`data_level_change`, một dòng mỗi đơn vị mỗi ngày, lý do mảng, đổi khoá tách riêng; lần đầu lập mốc; đơn vị còn thang cũ → lập mốc lại `doi-thang`, dòng DO1 mang `thang`; ngày lập mốc giữ suốt cả ngày qua mọi lượt — nhận theo dấu đã ghi, bảng rỗng, thang cũ, rồi ngày áp thang (ngày VN của lượt DO1 đầu tiên mang thang mới, không theo ngày UTC của ảnh chụp) — và ngày ấy không có dòng chuyển (`HOI1`); `--sua-ngay-doi-thang [--write]` sửa ngày đổi thang đã qua: in ngày + số dòng, ghi lại dấu (giờ ghi trong ngày áp, kèm `don_vi`, nên lượt DO1 kế không xoá), xoá dòng chuyển của đúng ngày áp (`HOI2`), từ chối (thoát 2) khi đã có dấu ở ngày khác) + bốn nhóm số `do1-*` vào `dq_check_results` (giữ nháp, bỏ sót, tín hiệu, chuyển bậc; lát thị trường/phường/dự án/toà); detail qua `chanLo`; `--write` khoá 56083; chưa áp 087 thì phần chuyển bậc in skip `chua-ap-087` |
| do-lam-giau.mjs | DO3: theo từng đường làm giàu (sổ `DUONG` ở `lib/do-lam-giau.mjs`: số qua người đăng, quy ước nhóm; diện tích suy ra, danh mục CĐT chưa chạy) so giá trị sống với ảnh chụp `enrichment_value_state` → dòng đổi `enrichment_value_change` (một dòng mỗi chủ thể mỗi ngày VN; thêm/đổi/máy rút; trên đường sổ khai có lối người rút, `hitl-thay`/`hoan-tac:*` không vào máy rút — hôm nay không đường nào có; lần đầu lập mốc) + `do3-thay-doi` (người sửa = nhãn ngày khác giá trị + phát biểu `hitl` ghi đè trong ngày, phần đè ở `nguoi_sua_de`; tự soát `song-lech`/`lat-lech`, lát của DO1) và `do3-kiem-nguoc` mỗi tuần ISO (bỏ-một-ra, Wilson) vào `dq_check_results`; detail qua `chanLo`; `--write` khoá 56086; chưa áp 086 thì in `CHUA-AP-086`, thoát 0; không gọi model |
| so-sanh-cach-doc.mjs | DO1 AC-10: so cách đọc mới với cũ trên cùng thẻ mẫu soát 4 tuần (`--cu --moi --tuan --tran-usd 0.30 --write`), ghi `do1-so-sanh` |
| eval-classify.mjs | PL9: độ đúng từng ô (cách đọc × trường × phân khúc) theo cận dưới Wilson so ngưỡng F3 (`npm run eval:classify -- --lat ocp1 [--split dev] [--dry]` → `dq_check_results`, `--tap-mau <tệp.jsonl>` chỉ in); lõi `lib/eval-classify.mjs`, cách đọc `parser` |
| scripts/do-duong-s06.mjs | Thước DS1 (AC-7): transform S06 + resolve thật trên DB thử, đếm đường ở tin và căn, sáu trường khác, tên nguồn, cặp cùng tên ra Lệch, rồi chạy hoàn tác; `--chi-doc` chỉ đếm, dùng được trên DB máy thu |
| scripts/do-sdt-trong-duong.mjs | Thước sdt-trong-ten-duong (AC-4): `--chay` chạy transform S06 + resolve thật trên DB thử (gần 2 giờ) rồi ghi băm mã; không cờ thì đọc bản chép đó, đếm đường mang dãy số ở tin, căn, nhật ký căn, tin nguồn sạch lệch chữ; chỉ in số đếm; `--chi-doc` dùng được trên DB máy thu |
| finalize-hanoi.sh | Full pipeline: import → reassign-areas → transform → 300/400/410 |

## SQL Files (execute in order)

| File | Purpose |
|------|---------|
| 300_metrics.sql | Build market_metrics from nights + listings |
| 400_breakdowns.sql | Precompute ADR by size, room type, top listings |
| 410_listing_stats.sql | Rebuild listing_stats (nights/booked/revenue/occupancy + nights90/booked90 per listing) — app không gộp nights runtime |
| 500_asset_stats.sql | Compute median prices + yield per phường |

## Database Schema (key tables)

```
areas (id, parent_id, region_type, name, geom)
listing_records (id, area_id, …, retired_at, retired_reason, originating_system_key) — bảng bản ghi (044)
listings = VIEW sống của listing_records (retired_at IS NULL) — mọi chỗ ĐỌC dùng view
nights (listing_id, night, available, price)
market_metrics (area_id, month, listing_count, revenue, adr, occupancy, revpar)
sale_offer_records (offer_id, …, retired_at, retired_reason, superseded_by, originating_system_key) — bảng bản ghi (044)
sale_offers = VIEW sống của sale_offer_records (offer_id, area_id, kind, price_vnd, area_m2, confidence, …)
history_transactional (resource_record_key = offer_id, field_name ListPrice|StandardStatus, change_type, …) — lịch sử giá/trạng thái (059, trigger trên sale_offer_records, chỉ local); property_price_history = VIEW gom theo căn
market_asset_stats (area_id, kind, median_perm2, median_rent)
parties / registry_aliases / registry_events / party_roles — danh bạ Người (055, chỉ-thêm, chỉ local; khoá `pty_<ULID>`)
sellers = VIEW (060, SD3) — một dòng mỗi SĐT trên tin sống (`seller_phone` E.164 `+84…`, `seller_phone_hash` = 32 ký tự đầu sha256 của số E.164); tên lấy từ tin, ngày từ mọi bản ghi tin; bí danh danh bạ `sdt` (số gốc), `sdt_bam` nghỉ
airdna_markets / airdna_scores / airdna_market_metrics
```

## Conventions
- **City-parametric**: most scripts accept city as arg (`node transform-airbnb.mjs hcmc`)
- **Staging → canonical**: raw data goes to stg_* tables first, then transforms to clean tables
- **Point-in-polygon**: area của listing VN = phường OSM chứa tọa độ (ST_Covers). KHÔNG suy area từ title discovery
  (title dùng tên quận cũ / tên tỉnh / tỉnh lân cận → area trùng, ngoài tỉnh — G0-b). Point-in-polygon chỉ dùng phường OSM
  (`phuongHopLe`, `meta.source = 'osm-phuong'`); listing ngoài mọi phường nghỉ `ngoai_phuong` (rời view `listings`, đêm giữ nguyên; staging giữ nguyên).
- **Khớp tên khu vực (PX1)**: tin rao khớp tên trên `khuVucKhopTen` = phường OSM hoặc xã danh bạ (`admin_code`, 084);
  S06 thêm bí danh xã cũ an toàn của `ward_name` (cuối cùng), S03 nhận tên cũ chỉ khi gọi đích danh; nhóm S03 chưa khai
  thị trường vẫn chỉ đối chiếu thị trường có phường OSM. DB chưa áp 084 → mọi bộ đọc chạy như cũ (`coDanhBa`).
- Sau MỌI transform VN (kể cả transform-hcmc-simple): `node reassign-areas.mjs` rồi 300 + 400.
- **Idempotent**: scripts can run multiple times without duplicating data (ON CONFLICT)

## Gotchas
1. **pg client**: uses `pipeline/node_modules/pg` (not app's), run `npm install` in pipeline/
2. **Docker psql**: `docker compose exec -T -e PGPASSWORD=oneinvest db psql -h localhost -U oneinvest -d oneinvest`
3. **Snapshot paths**: relative `../collector/snapshots/<city>/<snapshot-id>/`
4. **Không xoá tin/listing (PL14, 044)**: tin vắng lượt và listing ngoài phường chỉ NGHỈ (`retired_at`); 6 khoá ngoại tới
   hai bảng bản ghi là RESTRICT. Đường GHI dùng `sale_offer_records`/`listing_records` (upsert gỡ `retired_at`); đường
   ĐỌC dùng view. `pipeline/lib/scan-delete.mjs` (test `nap-lai.test.mjs`) đỏ khi có `DELETE FROM`/`TRUNCATE` nhắm chúng.
5. **Khoá tin S03/S05 «dính»** (`lib/offer-key.mjs`): `offer_id` theo post, không theo nội dung — đổi giá/DT/PN/parser
   không đổi khoá. Đừng quay lại băm nội dung.
6. **Test DB nạp 044 trong giao dịch** khi DB chưa áp, và giữ `pg_advisory_xact_lock(33033)` — thiếu khoá thì deadlock
   với các test nạp migration song song.
7. **Năm cột phân loại chỉ qua phân xử (PL15, 045)**: `property_type`, `bedrooms`, `bathrooms`, `street_raw`, `block_raw`
   do `resolve_offer_fields` dựng từ `field_assertions` — bộ đọc ghi phát biểu (`lib/assert.mjs`), không UPDATE thẳng
   (`lib/scan-canonical-write.mjs` đỏ). Chưa cắt chuyển (`ops_audit phat-bieu:cat-chuyen`) thì phân xử dừng có tên. Test
   và thước trong giao dịch: `napPhatBieu(c)` (`lib/nap-045.mjs`) nạp 045 + mở cổng trong giao dịch.
8. **SĐT lưu số gốc E.164 (SD3, 060)**: bộ bóc trả `+84…`; `sellers` là view — không INSERT/UPDATE/DELETE. Test và
   thước trong giao dịch: `napSdtE164(c)` (`lib/nap-060.mjs`) nạp 060 khi DB chưa áp. Áp 060 lên DB máy thu là bước triển khai
   riêng (Mạnh duyệt, `pg_dump` trước).
9. **Nạp lại migration cũ sau 070**: 044, 045, 059, 061 dựng view `sale_offers` bằng `SELECT *`, còn view sau 070 có thêm cột nhãn nên câu đó báo
   «cannot drop columns from view». Test và thước nạp lại các tệp này qua `sqlNapLai(c, sql)` (`lib/nap-view-song.mjs`); `napDacTrung` đã đi qua nó.
