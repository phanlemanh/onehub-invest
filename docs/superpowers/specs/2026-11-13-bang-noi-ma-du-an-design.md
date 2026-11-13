# DA3 — Bảng nối mã dự án (bang-noi-ma-du-an) — thiết kế

Hàng DA3 của `docs/plan/lo-trinh.json` (T3, đứng trên DA2 và DA30, cả hai đã gộp). Ô cơ hội đã ký:
`_acceptance/bang-noi-ma-du-an/opportunity.md` (Mạnh 09/11 «Theo khuyến nghị»). Căn cứ thiết kế:
`docs/architecture/mo-hinh-danh-ba-du-an.md` §1.1, §1.2, §6; ROADMAP §3 mục 35, 40, 44, 45;
`docs/plan/ke-hoach-danh-ba-du-an-0811.md`.

## 1. Đang có gì (đo chỉ đọc trên DB máy thu, 13/11)

- `stg_s08_project`: 177 dự án, một snapshot (07/11), 174 có điểm. Không có mã số DN, tỉnh hay xã dạng mã.
- `s08_project_links` (074): 150 dòng — 8 `noi` (3 vào Ocean Park 1, 5 vào Grand Park), 142 `chua_noi`
  (141 lý do `ngoai-lat`). **27 dự án S08 của snapshot 07/11 chưa có dòng nối.**
- Danh bạ: 20 nút `project` (đều có `area_ids`, có nút chỉ ở cấp tỉnh như `vn-hanoi`), 3 nút `building` (thực là
  phân khu), 69 toà ở `buildings`. Nút **không có toạ độ**; `meta` chỉ có `legal_note`, `city`.
- `registry_aliases` (055 → 060 → 082): `object_key` chỉ nhận `pty|prc|bld|stk|unt_<ULID>`, `source` chỉ `S01–S09`,
  `kind` thiếu `ma_nha_nuoc`. Rào chỉ-thêm (`danh_ba_chi_them`): không xoá, chỉ đặt `retired_at` một lần.
- `stg_s07_*` có bảng (093) nhưng **0 dòng**; S10, S11 chưa có bảng `stg_*` (089, 090 chưa có tệp).
- Phủ vùng và K3 trên dữ liệu thật (đo 13/11): 172/174 điểm S08 nằm trong một xã đã nạp (`areas` cấp submarket);
  cùng xã + tên trùng chỉ ra 3 cặp, 2 cặp đã `noi` (Grand Park, Ocean Park 1) → **1 đề xuất K3 mới** (The Global City).
  Thẻ luật không dựng được từ dữ liệu thật hôm nay; màn thẻ luật đo bằng đề xuất mẫu.
- Đường duyệt có sẵn: `/ops/review` (`ReviewCard`, hộp hạng mục, `HangGuiProvider` hoàn tác 5 giây,
  route `…/review/[id]/decide` ghi `ops_audit`). `review_queue` là bảng chỉ ở máy thu (`TIER_A_TABLES` của
  `pipeline/sync-cloud.mjs`), nên thẻ nối dự án sống ở Ops của máy thu như mọi thẻ duyệt hiện nay.
- `pipeline/noi-du-an-s08.mjs` không đề xuất gì: nó kiểm một tệp nối do người viết rồi ghi `s08_project_links`.

## 2. Chọn hướng

**Một bảng nối chung `project_links` + view `s08_project_links` giữ nguyên hình cũ** (mục 44, §6). View trả
mọi dòng nguồn S08 với cột cũ (`project_id, asset_node_id, status, ly_do, updated_at`); dòng `tu_choi` hiện là
`chua_noi` kèm lý do «từ chối: …». Ghi qua view (bộ ghi cũ `noi-du-an-s08.mjs` và năm itest của hồ sơ danh bạ
vật thể còn `INSERT/DELETE` vào tên cũ) đi qua trigger `INSTEAD OF` xuống bảng mới — không sửa nơi đọc cũ nào.
«View trả đúng 8 dòng» của `bat_khi` đọc là 8 dòng `status = 'noi'`; tổng số dòng giữ 150 như bảng cũ.

Bảng `project_links`: `source` (S01–S15), `source_project_id`, `source_parent_id`, `level` (`du_an|phan_khu|lo_toa`),
`asset_node_id` (dự án hoặc phân khu), `building_id` (khi nối cấp lô/toà), `status` (`de_xuat|noi|chua_noi|tu_choi`),
`can_cu` (K1–K5 hay `tay`), `ly_do`, `rule_id` (thẻ luật đã duyệt cặp này), `decided_by`, `decided_at`.
Khoá `(source, source_project_id)`. CHECK theo trạng thái như 074 (`noi` phải có nút hoặc toà).

**Khuôn chung bản ghi nguồn** (§1.1, mục 44 Hỏi-5) là một hàm thuần `pipeline/lib/ban-ghi-nguon.mjs`: mỗi nguồn
một bộ chuyển `stg_<nguồn>` → `{source, source_project_id, source_parent_id, level, ten_thuong_mai, ten_phap_ly,
ten_chuan, dia_chi, tinh, xa, diem, cdt, ma_so_dn, loai_hinh}`. Bộ chuyển có cho **mọi nguồn danh mục đã có bảng
`stg_*`**: S08 (`stg_s08_project`) và S07 (`stg_s07_project`, chạy được khi ZCode nạp — đo bằng fixture rút từ
khuôn hợp đồng dữ liệu v9). Tỉnh và xã của S08 suy từ điểm bằng `areas` (PostGIS) — S08 không công bố mã.
Quy ước giá trị rỗng giả (mục 45): chuỗi sau trim thuộc `{"", "Đang cập nhật", "--", "-", "0", "N/A"}` (so không
dấu, không hoa) về `null`, ở MỘT hàm dùng cho mọi bộ chuyển.

**Bộ đề xuất cặp** `pipeline/de-xuat-noi-du-an.mjs` (luật xác định, không model — luật 7): đọc khuôn chung, so với
nút danh bạ theo §1.2. Chặn cùng tỉnh trước; bản ghi chưa có tỉnh → thẻ từng cặp. Căn cứ:

| Mã | Căn cứ | Thẻ | Trên dữ liệu hôm nay |
|---|---|---|---|
| K1 | Cùng mã số DN + tên trùng | thẻ luật | chờ: S08 không có mã số DN, nút cũng chưa |
| K2 | Điểm ≤300 m + tên trùng | thẻ luật | chờ: nút danh bạ chưa có toạ độ |
| K3 | Cùng xã + tên trùng | thẻ luật | **chạy được trên S08** (xã từ điểm; nút có `area_ids` cấp xã) |
| K4 | Điểm ≤1 km + tên trùng ≥50% từ | từng cặp | chờ như K2 |
| K5 | Quan hệ cha–con của nguồn | thẻ luật quan hệ | chờ: S08 không khai cha; S07/S11 có |

«Không bao giờ»: lệch tỉnh; chỉ theo điểm; tự gộp nút theo tên; nối vào nút chỉ có `area_ids` cấp tỉnh bằng K3.
Mỗi lần chạy ghi `de_xuat` cho cặp mới và `chua_noi` (lý do: `khong-ung-vien`, `nhieu-ung-vien`, `khong-diem`) cho
bản ghi không cặp — nên 27 dự án mới của snapshot 07/11 đều có trạng thái nối. Cặp đã `noi`/`tu_choi` không bị
ghi đè (người thắng máy). Đề xuất đi vào `review_queue` hạng mục mới `project_link`.

**Thẻ từng cặp** trên `/ops/review` (hạng mục «Nối dự án»): hai cột «bản ghi nguồn» và «nút danh bạ», dòng căn cứ
(K-mã + chữ đã khớp), nút Nối / Không phải / Để sau, hoàn tác 5 giây có sẵn. Nối = trong MỘT giao dịch: dòng
`project_links` sang `noi`, đúng MỘT bí danh `registry_aliases(object_key 'node:<id>', kind 'ma_nguon',
value '<source>/<source_project_id>', source)`, một dòng `ops_audit`. Không phải = `tu_choi` + lý do, không bí danh.
Bản ghi cấp lô/toà (mục 45 Q5) dùng cùng thẻ, chọn toà hoặc phân khu có sẵn thay cho dự án; bí danh trỏ
`bld_<ULID>` hoặc `node:<id>` của phân khu.

**Thẻ luật** (mục 35): khi loạt có từ 2 cặp, một thẻ cho cả loạt đề xuất cùng căn cứ (K1, K2, K3, K5) của cùng nguồn, kèm tối đa 5 cặp mẫu và tổng
số. Duyệt = một dòng `project_link_rules` (căn cứ, nguồn, số cặp, người, lúc) + mọi cặp loạt sang `noi` với `rule_id`
+ bí danh từng cặp, một giao dịch. Đảo = dòng nhật ký «đảo», mọi cặp của luật về `de_xuat` và mỗi cặp mở lại một thẻ từng cặp, bí danh của chúng đặt
`retired_at` (rào chỉ-thêm giữ dấu), một giao dịch. Nối lại sau đảo tạo bí danh mới (chỉ mục duy nhất `ma_nguon` đã lọc
`retired_at IS NULL`). Cặp người đã quyết riêng trước đó không bị luật đụng.

**Quyền** (T3): `viewer` không thấy nút; `ops` duyệt từng cặp; thẻ luật và đảo luật cần `admin` (một quyết định cho
cả loạt, tương đương sửa luật xác định).

**Migration** `db/migrations/100_*` (số do sổ số cấp 13/11): bảng `project_links`, `project_link_rules`; chép 150 dòng 074 sang
(`source='S08'`, `can_cu='tay'`, giữ trạng thái và lý do); đổi tên bảng cũ thành `s08_project_links_074` rồi tạo view
cùng tên cũ + trigger `INSTEAD OF`; mở `registry_aliases` và `registry_events`: `object_key` thêm `node:[0-9]+`,
`source` thêm `S10–S15`, `kind` thêm `ma_nha_nuoc` (mục 40, để DA24 không cần migration riêng). `review_queue.item_type`
nhận `project_link`. Sổ từ vựng: `alias_kind` thêm `ma_nha_nuoc` trong `pipeline/mappings.yaml` + seed bằng
`vocab.mjs --emit-seed`. Không sync cloud bảng mới (mã nguồn S08 nội bộ nguồn; thông tin dự án công khai đi qua
danh bạ ở hàng sau).

## 3. Làm được khi chỉ có S08 · phải chờ nguồn

- **Làm được ngay:** bảng + view + mở bí danh; bộ chuyển S08; quy ước rỗng giả; K3 trên S08; trạng thái nối cho 27
  dự án mới; thẻ từng cặp, thẻ luật K3, hoàn tác, đảo luật.
- **Có mã, đo bằng fixture, chạy thật khi có dữ liệu:** bộ chuyển S07 (ZCode chưa nạp); K5 và bản ghi cấp lô của
  S11 (bảng S11 chưa có — 4 bản ghi Ocean Park 1 của `bat_khi` đo bằng fixture theo khuôn hợp đồng dữ liệu v8).
- **Không làm trong hàng này:** K1, K2, K4 (cần mã số DN và toạ độ nút — thuộc hàng làm giàu danh bạ).

## 4. Không gian đã quét (morphological-scan, preset test-matrix)

- Trục A — nguồn × cấp bản ghi: S08 dự án · S07 dự án/phân khu (fixture) · S11 lô/toà (fixture). [CE: §1.1 + DATA-CONTRACT v8/v9]
- Trục B — căn cứ × kết cục: K1–K5 × {thẻ luật, từng cặp, chờ} + bốn «không bao giờ». [CE: §1.2]
- Trục C — vòng đời cặp: de_xuat → noi / tu_choi / để sau; noi theo luật → đảo → de_xuat; hoàn tác trong 5 giây.
- Trục D — vai: viewer · ops · admin. [CE: bảng quyền bốn vai]
- Trục E — tầng: migration · hàm thuần · bộ đề xuất trên DB thử · route duyệt · màn.
- Later: K1/K2/K4; nối tin vào nút (DA7/DA18); đưa bảng nối lên cloud. Never: tự gộp nút theo tên.

## 5. Hạng rủi ro, bên đọc view cũ, đường lùi, RESO-first

- **Hạng T3** (hàng khai, chạm `db/migrations` và quyền duyệt): sau Cổng Phạm vi có **Cổng 1.5** duyệt kế hoạch.
- **Bên đọc/ghi `s08_project_links` hôm nay** (đều giữ nguyên nhờ view cùng cột + trigger `INSTEAD OF`):
  `pipeline/danh-ba-vat-the.mjs:91` (đọc dòng `noi`), `pipeline/noi-du-an-s08.mjs:112` (ghi `INSERT … ON CONFLICT`),
  itest `pipeline/scripts/danh-ba-vat-the.itest.mjs`, `danh-ba-vat-the-iso.itest.mjs`, `danh-ba-vat-the-that.itest.mjs`
  (đọc, `INSERT`, `DELETE`), `pipeline/scripts/tu-vung-du-an.test.mjs` (chuỗi mô tả). `INSERT … ON CONFLICT` qua view
  không chạy được với trigger `INSTEAD OF` → `noi-du-an-s08.mjs` đổi sang ghi thẳng `project_links` trong cùng hàng
  (nằm trong vùng hàng).
- **Đường lùi:** migration giữ bảng cũ dưới tên `s08_project_links_074` (không xoá). Lùi = một migration mới: bỏ view +
  trigger, đổi tên bảng cũ về `s08_project_links`, chép dòng `noi`/`chua_noi` mới từ `project_links` về. Bí danh đã tạo
  không xoá được (rào chỉ-thêm) — lùi đặt `retired_at`. CHECK mở rộng của `registry_aliases` là nới, không cần lùi.
  Áp lên DB máy thu sau gộp là lời riêng của Mạnh.
- **RESO-first** (ADR-0011, ADR-0013): `ma_nha_nuoc` vào `alias_kind` theo cùng lý do extension đã ghi ở
  `pipeline/mappings.yaml` (DD 2.1 không có mã định danh dự án/toà của cơ quan nhà nước; ROADMAP mục 40: mã nhà nước
  là bí danh, không thay UPI, toà vẫn ghi ở RESO `BuildingId`) — dòng `rationale` của `alias_kind` thêm câu này và
  `checked_on` đổi ngày; không phải trường RESO mới nên không cần sáu điều kiện. Nguồn S10–S15 chỉ là mã `S1x` trong
  CHECK, không tên thật (SPL, luật 6); tên thật chỉ ở `source_registry` local.

## Đặc tả UX

### 1. Luồng

- Suôn sẻ: `/ops/review` → hộp hạng mục «Nối dự án» → thẻ cặp (nguồn ↔ nút, căn cứ) → Nối → toast có Hoàn tác 5
  giây → thẻ kế (điểm ra: hàng duyệt).
- Thẻ luật: hộp «Nối dự án» → thẻ «Nối 12 cặp S08 cùng xã + tên trùng (K3)» với 5 cặp mẫu → Duyệt cả loạt (admin)
  → nhật ký luật ghi một dòng; nút «Đảo luật» trên dòng nhật ký.
- Biên: không còn đề xuất → trạng thái trống; vai viewer → không nút; vai ops → không nút Duyệt cả loạt.
- Lỗi & quay lại: ghi thất bại → Alert tại thẻ, thẻ giữ nguyên; hoàn tác muộn → thông báo theo `tinHoanTacMuon`.

### 2. Kiểm kê màn

| Màn | MỘT việc của màn | Vào từ / ra tới |
|---|---|---|
| Hàng duyệt, hạng mục Nối dự án | quyết từng cặp nguồn ↔ dự án | hộp hạng mục / thẻ kế |
| Thẻ luật | duyệt hay đảo cả loạt cùng căn cứ | hộp hạng mục / nhật ký luật |

### 3. Bảng trạng thái

<!-- <<<UX-STATE-TABLE -->
| Trạng thái | Màn | Hiển thị gì | Người làm gì tiếp |
|---|---|---|---|
| ST-noi-loading | Hàng duyệt | Skeleton của thẻ có sẵn | chờ |
| ST-noi-empty | Hàng duyệt | «Không còn cặp nào chờ nối» | chạy lại bộ đề xuất (lệnh in sẵn) |
| ST-noi-error | Hàng duyệt | Alert «Không tải được thẻ» + Thử lại | Thử lại |
| ST-noi-sent | Thẻ cặp | toast «Đã nối» + Hoàn tác (5 giây) | Hoàn tác hoặc sang thẻ kế |
| ST-luat-ok | Thẻ luật | dòng nhật ký «Đã nối N cặp theo K3» + Đảo luật | Đảo luật nếu sai |
<!-- UX-STATE-TABLE>>> -->

### 4. Hành vi

- Phím duyệt dùng chung của hàng duyệt (`use-phim-duyet`); lý do bắt buộc khi «Không phải» (luật `batGoLyDo`).

### 5. Xuất xứ component

| Component | Nấc | Vì sao |
|---|---|---|
| `ReviewCard` + `HangGuiProvider` | dùng | thẻ và hoàn tác 5 giây có sẵn |
| `review-compare` | ghép | hai cột nguồn ↔ nút |
| Thẻ luật | mở rộng | thẻ nhóm thêm danh sách 5 mẫu + nút admin |

### 6. Khuôn IA đã chọn + căn cứ

Khuôn IA: danh-sách-chi-tiết (master-detail)
Căn cứ: luồng hiển nhiên — trùng khuôn hàng duyệt `/ops/review` đang dùng (hộp hạng mục → thẻ), không tra thêm.

### 7. Thẻ việc

| Trường | Giá trị |
|---|---|
| Ai dùng | Người vận hành (ops), quản trị (admin) cho thẻ luật |
| Việc chính | quyết cặp mã nguồn ↔ dự án danh bạ có phải một |
| Tần suất | mỗi tuần (theo snapshot nguồn) |
| Số bản ghi | hàng trăm trở lên |
| Thiết bị | máy tính |
