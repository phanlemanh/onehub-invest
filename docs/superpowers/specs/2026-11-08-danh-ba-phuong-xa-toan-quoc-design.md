# PX1 — Danh bạ phường/xã toàn quốc (danh-ba-phuong-xa-toan-quoc)

Ngày: 2026-11-08 · Hạng T3 · Hàng PX1 của `docs/plan/lo-trinh.json` · Cổng Đáng: Mạnh «build» 08/11 (ngưỡng theo đề xuất)
Căn cứ: ROADMAP §3 mục 37; ô cơ hội `_acceptance/danh-ba-phuong-xa-toan-quoc/opportunity.md`.

## 1. Vấn đề

`areas` có 34 thị trường cấp tỉnh nhưng chỉ 511 khu vực con, tất cả ở 4 thành phố (500 phường OSM, 11 khu `airbnb-discovery`).
30 tỉnh không có xã nào, nên tin ở đó chỉ gắn được tỉnh, và các thước theo phường (phường × loại, Căn giá tốt, TV11)
trống ở đó. Danh bạ chính thức của Cục Thống kê (QĐ 19/2025, đọc ngày 06/11/2026) đã được dựng sẵn ở kho riêng
`onehub-quy-hang`: 3.321 xã, phường, đặc khu với mã 5 số; 10.033 xã cũ trỏ sang xã mới; 63 tỉnh cũ trỏ sang 34 tỉnh mới.

Số nền đo ngày 08/11 trên DB máy thu (chỉ đọc):

| Tỉnh | Tin | Có xã | % |
|---|---|---|---|
| vn-hcmc | 59.829 | 56.633 | 94,7 |
| vn-hanoi | 10.221 | 8.847 | 86,6 |
| vn-da-nang | 8.246 | 8.246 | 100 |
| vn-hung-yen | 46 | 0 | 0 |
| (không tỉnh) | 233 | 0 | 0 |

S06 hiện chỉ thu 3 thành phố (`stg_chotot_ads` có vn-hcmc, vn-hanoi, vn-da-nang). Lợi ích đo được ngay trên dữ liệu hiện
có nhỏ; lợi ích chính là nền cho mọi lần thu ở tỉnh khác, nên ngưỡng an toàn quan trọng nhất là «không tỉnh nào giảm».

Khớp thử (08/11) 511 khu vực con hiện có với danh bạ theo tên trong tỉnh: Hải Phòng 114/114, Đà Nẵng 93/94 (thiếu Hoàng
Sa), TP.HCM 167/168 (thiếu Hưng Long), Hà Nội 126/126 (+4 khu `airbnb-discovery` tên cũ: Bắc Từ Liêm, Hàng Trống, Ngọc
Lâm, Xuân La). Mười một khu `airbnb-discovery` ở Hà Nội không có tin hay listing nào trỏ vào: 7 khu tên quận cũ
(«Quận Thanh Xuân», «Quận Hai Bà Trưng», «Quận Hoàn Kiếm», «Quận Cầu Giấy», «Quận Hoàng Mai», «Quận Đống Đa», «Quận Tây
Hồ») và 4 khu tên phường cũ (Bắc Từ Liêm, Hàng Trống, Ngọc Lâm, Xuân La). Bỏ tiền tố «Quận» thì 7 khu tên quận trùng tên
phường mới (Thanh Xuân, Hoàn Kiếm…) — nên bộ khớp KHÔNG bỏ tiền tố cấp huyện. Hai phường OSM mang hậu tố mã bưu chính («Cẩm Giàng (03626)», «Thạnh An (73308)») vì trùng chữ không dấu
với một xã khác cùng tỉnh — khớp phải so tên CÓ DẤU.

## 2. Thiết kế

### 2.1 Dữ liệu chép vào kho

`pipeline/data/dvhc/` giữ DỮ LIỆU, không chép code:

- `xa.json` (3.321), `xa-cu.json` (10.033), `tinh-cu.json` (63) — chép nguyên byte từ
  `onehub-quy-hang/packages/core/src/address/du-lieu/`.
- `tinh.json` — 34 tỉnh (mã, tên, loại) chép từ bảng `tinh` của `danh-muc.ts` thành JSON.
- `NGUON.json` — sha256 của từng tệp trên, commit nguồn của kho quy-hang, văn bản và ngày tham chiếu (lấy từ `nguon` của
  `danh-muc.ts`), sha256 hai tệp gốc của Cục Thống kê.

Bộ nạp băm lại từng tệp lúc chạy; lệch `NGUON.json` → thoát 2, không ghi gì.

### 2.2 Migration 084 (`db/migrations/084_danh_ba_dvhc.sql`)

- `areas.admin_code text` — mã 5 số của xã (cấp xã) hoặc 2 số (cấp tỉnh); index UNIQUE trên `admin_code` khi khác NULL.
- Bảng `area_aliases` — một dòng mỗi xã cũ: `old_code text PK`, `name`, `kind` (Phường/Xã/Thị trấn), `old_district`,
  `old_district_code`, `old_province_code`, `province_code`, `targets text[]` (mã xã mới), `split boolean` (targets > 1),
  `source_sha text`. Không FK tới `areas` (tra theo mã, `areas` đổi id được — migration 064).
- `areas` không phải resource RESO; DD 2.1 không có đơn vị hành chính cấp xã nào để tra (chỉ `PostalCode`,
  `CountyOrParish`, `City` trên tin). Không thêm field tin, không thêm enum: loại đơn vị nằm ở `areas.meta.loai`.
- Idempotent (`IF NOT EXISTS`). Cột mới ở lại máy cho tới khi cloud có cột (sync-cloud gửi cột chung của hai bên).

### 2.3 Bộ nạp `pipeline/nap-dvhc.mjs`

Một giao dịch, khoá advisory riêng:

1. Kiểm băm (2.1).
2. Ánh xạ 34 mã tỉnh → thị trường bằng BẢNG CỐ ĐỊNH trong `lib/dvhc.mjs` (01→vn-hanoi, 79→vn-hcmc, còn lại
   `vn-<slug tên bỏ «Tỉnh/Thành phố»>`), đối chiếu từng dòng với `areas` (market, cùng tên). Thiếu hay lệch tên → thoát 1.
   Ghi `admin_code` 2 số cho 34 thị trường.
3. Mỗi xã: tìm khu vực con của thị trường có tên trùng (NFC, bỏ tiền tố cấp xã «Phường/Xã/Thị trấn/Đặc khu», bỏ hậu tố
   «(…)», CÓ dấu; KHÔNG bỏ «Quận/Huyện/Thị xã»). Ưu tiên: đúng một phường OSM khớp → dòng đó; không có phường OSM khớp mà
   đúng một khu khác khớp → dòng đó; còn lại khớp hai trở lên → thoát 1 (không đoán). Dòng khớp được ghi `admin_code`,
   `meta.loai`; GIỮ `id`, `name`, `geom`, `meta.source`. Không
   khớp → chèn `id = <market>-<slug>`; slug trùng với xã khác cùng tỉnh trong danh bạ → mọi xã chung slug ấy mang hậu tố
   `-<mã>`; id đã có (của một dòng không phải xã này) → hậu tố `-<mã>`. Dòng chèn: `region_type='submarket'`,
   `name` = tên không tiền tố như danh bạ (vd «Diễn Châu», cùng dạng với tên phường OSM đã bỏ tiền tố),
   `meta = {source:'dvhc', loai}`, `geom` NULL.
4. Khu vực con có sẵn mà không khớp xã nào: giữ nguyên, không gắn mã, in tên (Hà Nội: 4 khu `airbnb-discovery`).
5. Bí danh: upsert 10.033 dòng `area_aliases`; `split = targets.length > 1` (441 dòng).
6. In báo cáo: theo tỉnh — xã danh bạ, khớp sẵn, chèn mới, có ranh giới; tổng bí danh, số tách; số dòng đổi lượt này.

Cờ: `--thu` (chạy rồi ROLLBACK, in số). Chạy lại trên dữ liệu đã nạp → 0 dòng đổi (UPDATE chỉ khi giá trị khác).

«Ranh giới khớp vào mã»: ranh giới là `geom` của phường OSM đã có; gắn mã cho dòng OSM là khớp ranh giới vào mã. Xã chưa có
dòng OSM giữ `geom` NULL — thu OSM cấp 6 cho 30 tỉnh là việc làn ZCode (bộ thu `osm-boundaries`), gửi bằng yêu cầu việc phụ.
Khi `reassign-areas` sau này upsert phường OSM trùng id với xã đã chèn, dòng nhận `geom` và giữ `admin_code`.

### 2.4 Bộ tra tên (`pipeline/lib/dvhc.mjs`)

- `chuanTen(s)` — NFC, thường hoá, bỏ tiền tố loại, bỏ hậu tố «(…)».
- `dungBiDanhAnToan(aliases, xaHienHanh)` → `Map<market, Map<tên chuẩn, area_id>>` chỉ gồm bí danh AN TOÀN: xã cũ vào trọn
  một xã mới; tên cũ không trùng tên một xã hiện hành cùng tỉnh; cùng tên cũ trong tỉnh không trỏ hai xã mới khác nhau.
  Bí danh bị loại được đếm theo lý do (`tach`, `trung-ten-hien-hanh`, `nhieu-dich`).
- `traXaCu(tinh, ten)` → `{ xa }` | `{ canChon: [mã…] }` | `null` — tra theo khoá (mã tỉnh mới, tên chuẩn): hợp mọi đích
  của mọi xã cũ mang khoá đó; hợp đúng một mã → `{ xa }`; hơn một mã (vì tách, hoặc vì nhiều xã cũ cùng tên ở các huyện
  cũ khác nhau) → `{ canChon }`; không bao giờ chọn một trong số đó. Báo cáo in số khoá mỗi lớp cạnh con số 441 dòng tách.
- `matchXaCuCoTienTo(text, entries)` — S03 chỉ nhận tên cũ khi bài gọi đích danh «phường/xã/thị trấn/P./X. <tên cũ>».

### 2.5 Ai đọc danh bạ

`lib/osm.mjs`:
- `phuongHopLe()` GIỮ NGUYÊN — điều kiện cho point-in-polygon (chỉ phường OSM có `geom`).
- Thêm `khuVucKhopTen()` = (`phuongHopLe()`) OR (`admin_code IS NOT NULL`) — điều kiện cho khớp tên. `docPhuongHopLe`
  dùng điều kiện này.
- `docThiTruongCoPhuong` GIỮ NGUYÊN (thị trường có phường OSM) — S03 nhóm chưa khai thị trường vẫn chỉ đối chiếu 4 thành
  phố, để tên xã trùng giữa 34 tỉnh không kéo tin Hà Nội sang tỉnh khác (đối chiếu dài nhất trên 34 tỉnh = nhiều tranh,
  tin đang có xã sẽ rơi về null).
- Thêm `docThiTruongCoXa` — thị trường có ít nhất một khu vực khớp tên được.

Transform:
- S06 (`transform-chotot.mjs`): tập thị trường = `docThiTruongCoXa`; `ward_name_v3` khớp tên xã hiện hành; không khớp thì
  `ward_name` khớp tên xã hiện hành rồi bí danh an toàn. Tách phần gán phường thành hàm xuất `ganPhuongS06` để thước đo dùng
  chung.
- S03 (`transform-zalo.mjs`): danh sách tên nạp cho `docThiTruongCoXa`; nhóm khai thị trường đối chiếu xã của thị trường
  đó; nhóm chưa khai đối chiếu `docThiTruongCoPhuong` như cũ. Không khớp tên hiện hành → `matchXaCuCoTienTo` trên bí danh
  an toàn của cùng tập thị trường.
- S05 (`transform-fb.mjs`) không đổi (chỉ HN/HCM).

### 2.5b Tương thích khi code đã gộp mà DB chưa áp 084

launchd chạy code từ checkout `main` trên DB máy thu; gộp PR và áp 084 là hai lời riêng. Mọi chỗ đọc `admin_code`/
`area_aliases` (`lib/osm.mjs`, `lib/dvhc.mjs`, `reassign-areas`, hai transform) kiểm cột/bảng có mặt một lần mỗi lượt
(`information_schema`); vắng → dùng đúng điều kiện cũ (`phuongHopLe`, `docThiTruongCoPhuong`), không bí danh, và in một
dòng «chưa áp 084». Kết quả gán trên DB chưa áp phải bằng hệt code `main` (AC-10).

### 2.6 `reassign-areas.mjs`

- Bước 4 (xoá khu vực con không phải phường OSM): loại dòng có `admin_code` — xã danh bạ chưa có tin không bị xoá.
- Bước 5 (khu vực lạc, khi có `--xoa-khu-vuc-lac`): dòng có `admin_code` không bị xoá; vẫn được đánh `meta.lac` để
  point-in-polygon bỏ qua, và vẫn khớp tên được.
- Upsert phường OSM không đụng `admin_code`.

### 2.7 Đo trước/sau

`pipeline/scripts/nap-dvhc-do.mjs` chạy trên DB thử (`db/db-thu.sh`, bản chép DB máy thu), một giao dịch ROLLBACK:

- **Trước** = `area_id` đang lưu trên `sale_offer_records` của bản chép (kết quả của transform `main` đêm gần nhất), nối với
  tin stg theo khoá: S06 `originating_system_key` = `list_id`, S03 `post_ids` ∋ `post_id`. Tin stg không nối được đếm
  riêng («không nối»), không vào so sánh.
- **Sau** = nạp danh bạ trong giao dịch, rồi gán bằng chính hàm của transform mới (`ganPhuongS06`; S03 `matchPhuongThiTruong`
  + `ganKhuVuc` + bí danh) với danh sách tên đọc bằng `docPhuongHopLe`/`docThiTruongCoXa` thật.
- **Đối chứng code** (chạy trước khi nạp): hàm gán mới trên DB chưa nạp phải cho đúng `area_id` đang lưu ở mọi tin nối
  được — lệch nào cũng in và làm thước đỏ (bắt nhánh dự phòng bị rơi khi tách hàm).
- In bảng tỉnh × (tin nối được, có xã trước, có xã sau, mất xã, đổi xã, gắn mới qua tên hiện hành, gắn mới qua bí danh)
  cho S03 và S06, kèm tối đa 5 tin mẫu mỗi cột gắn mới/đổi; tập kiểm khai trước: 46 tin Hưng Yên, 233 tin không tỉnh,
  tin HN/HCM đang chỉ gắn tỉnh.
- Thoát 1 khi: một tỉnh giảm số tin có xã; có tin mất xã; có tin đổi xã (xã A sang xã B) — trừ tin nằm trong danh sách
  đổi khai trước ở `_acceptance/danh-ba-phuong-xa-toan-quoc/doi-xa-khai-truoc.json` (rỗng lúc khai); đối chứng code lệch.

## 3. Không làm

- Thu OSM cấp 6 cho 30 tỉnh (làn ZCode) — việc phụ.
- Hiện xã, bí danh, «cần chọn xã» trên Ops hay Invest; API tra xã.
- S05, listing Airbnb theo tên; xoá khu `airbnb-discovery`.
- Áp 084 và chạy nạp trên DB máy thu, đẩy cột lên cloud — lời riêng của Mạnh, sao lưu trước.
- Đọc lại kho tin cũ (transform đêm tự chạy lại sau khi nạp).

## 4. Rủi ro

| Rủi ro | Chặn bằng |
|---|---|
| Khớp tên sai làm đổi id khu vực có tin | khớp CÓ dấu, đúng một; không đổi `id` (AC-3) |
| Tên xã trùng giữa tỉnh kéo tin sai tỉnh | nhóm S03 chưa khai giữ tập 4 thành phố (AC-7) |
| Tên cũ trùng tên đường / tên xã hiện hành | bí danh an toàn + S03 phải gọi đích danh (AC-8) |
| reassign xoá xã danh bạ | loại `admin_code` ở bước 4, 5 (AC-6) |
| 3.321 dòng lên Invest khi sync | Hỏi-1 ở Cổng Phạm vi |
| Gộp code trước khi áp 084 làm transform đêm gãy | đọc có điều kiện, AC-10 |
| Tách hàm gán làm rơi nhánh cũ | đối chứng code với area_id đang lưu (AC-9) |

## 5. Đặc tả UX

Bỏ — việc không chạm giao diện (sổ quyết định: «bỏ đặc-tả-UX»).
