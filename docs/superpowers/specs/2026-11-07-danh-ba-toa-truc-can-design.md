# DB1 — Danh bạ toà · trục · căn cao tầng (Ocean Park 1, Grand Park)

Ngày: 2026-11-07 · Hồ sơ: `_acceptance/danh-ba-toa-truc-can/` · Hạng: T3 · Hàng lộ trình: DB1 · Migration: 082 (đã giữ)

Căn cứ: ô cơ hội đã ký Cổng Đáng (Mạnh 07/11 «Build theo đề xuất») · ADR-0016 §2–§6, §9–§11 · ADR-0013 · ADR-0011
(RESO-first) · spec `docs/superpowers/specs/2026-11-03-danh-ba-xac-nhan-toan-quoc-design.md` §5 ·
`docs/architecture/classification-enrich-review.md` F2 · tài liệu mô hình pipeline (Mạnh duyệt 07/11, Q4: lượt đầu
dựng khung từ S08 + phát biểu toà, trục của bộ đọc luật, không chờ PL13).

## 1. Việc này làm gì

Dựng **danh bạ vật thể** cấp toà · trục · căn cho chung cư cao tầng của hai khu đô thị Ocean Park 1 và Grand Park:

- khoá mờ đúc một lần (`bld_` · `stk_` · `unt_` + ULID), không suy từ nội dung;
- UPI neo toà `urn:onehub:upi:1:VN:<tỉnh>:<khoá toà>` (`VN-HN`, `VN-SG`), SubId căn `<khoá trục>:<tầng>`;
- hạt giống chính là danh mục S08 đã nối khu (DN1, `s08_project_links`); phát biểu toà trên tin bổ sung bí danh;
- chủ đầu tư là phát biểu cấp toà (`Building.BuilderName`), không phải cột viết tay;
- dựng lại bao nhiêu lần cũng ra cùng khoá; ô khung chưa có bằng chứng không đúc căn.

Danh bạ này là **chỗ để gắn** cho PL20 (gắn tin), rồi GC2/GC3 (diện tích suy ra). Vòng này không gắn tin nào.

## 2. Hiện trạng đo (DB máy thu, chỉ đọc, 07/11)

| Thứ | Số |
|---|---|
| `asset_nodes` | 20 khu đô thị (`project`), 3 dòng `building` — cả ba là **phân khu** (`dd_field = ComplexName`, cha là Grand Park) |
| S08 cao tầng đã nối khu | Ocean Park 1: 3 dự án, 332 mã căn khác nhau · Grand Park: 3 dự án, 1.418 mã căn · mỗi dự án 2 lần chụp |
| Khuôn mã căn S08 | ít nhất 5 dạng khác nhau giữa dự án (`<toà>-<tầng>-<trục>`, `<toà>.<tầng>.<trục>`, `<toà><tầng>.<trục>`, dính liền…) |
| Phát biểu bộ đọc luật trên tin | toà (`block_raw`) S03 22.383 · S06 546; mã căn (`unit_number`) S03 5.851 · S06 12.322 |
| Khung chung | `registry_aliases`, `registry_events` có từ 055 (DB2b); CHECK `object_key` đã nhận `bld|stk|unt`; `kind` chỉ có `tai_khoan_nguon · sdt_bam · ten` |
| `field_assertions` | `resource_name` CHECK chỉ `Property`; `subject_key` CHECK `^[A-Z][A-Z0-9]{1,5}:.+$` (khoá tin) |
| Đường tin S03 → khu đô thị | **không có** đường xác định: `collection_units.project_node_ids` chưa gán khu cho nhóm S03 nào (chỉ hai đơn vị S02) |

## 3. Quét không gian (morphological scan, preset entity-feature)

Ngữ cảnh: chân sản phẩm đào từ repo (ADR-0016 `[SUY-TỪ-REPO: docs/adr/0016-danh-ba-vat-the-va-nguoi.md]`, spec 03/11)
· chân ngành: RESO Data Dictionary 2.1 resource `Building` + UPI `[NGÀNH: RESO DD 2.1]`; Housing Dictionary của Beike
(định danh căn bền kể cả khi không có tin) `[NGÀNH: Beike Housing Dictionary — qua trang tri thức danh-ba-nha]`.

**Trục**

- A · Cấp vật thể: toà | trục | căn  `[thước CE: ADR-0016 §2 — thửa ngoài lát vì chung cư không cần thửa]`
- B · Nguồn bằng chứng: mã căn S08 | phát biểu toà/mã căn trên tin | từ điển chủ đầu tư do người duyệt | `asset_nodes`
  cũ  `[thước CE: ADR-0016 §6, §3; câu giao DB1]`
- C · Sự kiện vòng đời khi dựng: đúc lần đầu | dựng lại không đổi | mã mới ở lần chụp sau | mã biến mất ở lần chụp sau
  | mã không tách được | gộp · tách · nghỉ  `[thước CE: ADR-0016 §3; spec §4.2 off-market; bat_khi DB1]`
- D · Ranh giới dữ liệu: DB máy thu | đồng bộ cloud | kho công khai (mã, fixture, tài liệu)
  `[thước CE: AGENTS luật 5, 6; ADR-0016 §9]`

**Core** (ô có nghĩa ≈ 50, Core 11 → thành 11 tiêu chí)

1. A×B: toà, trục, căn × S08 × đúc lần đầu — hạt giống chính.
2. Bộ tách mã S08 theo khuôn có tên; mã không khớp khuôn → sổ lý do.
3. A×C: dựng lại không đổi số, không đổi khoá (bat_khi).
4. căn × «ô khung chưa có bằng chứng» → không đúc (bat_khi).
5. căn × mã biến mất ở lần chụp sau → giữ khoá (off-market là suy ra, không xoá, không nghỉ).
6. Tỉ lệ mã tách được trên dữ liệu thật — ngưỡng SỐNG ≥ 90 %, CHẾT < 70 %.
7. toà × phát biểu tin → bí danh khi khớp đúng một toà trong khu; toà chỉ có từ tin là ứng viên (Hỏi-4).
8. toà × từ điển chủ đầu tư → phát biểu `builder_name`.
9. toà × `asset_nodes` cũ → ba phân khu (Hỏi-1).
10. Lược đồ 082: bảng + mở khung chung + mở `field_assertions` không làm vỡ danh bạ Người và phát biểu tin.
11. D: vật thể chỉ S08 ở lại máy; kho công khai không chứa mã S08 thật.
12. toà × vùng → phường suy ra khi khu/phân khu có đúng một phường (Hỏi-5; thêm theo lời giám sát 07/11).

**Later**

- gộp · tách · nghỉ toà/căn (sự kiện `registry_events`) — chưa có ca thật; khung đã có.
- bộ phân xử cột chuẩn cho vật thể — chưa có trường nào hai nguồn cùng nói.
- khung toà đầy đủ (số tầng, tầng bỏ, danh sách trục từ một sàn — spec §5 bước 2) — chưa có nguồn khai số tầng.
- trang `/ops` xem danh bạ vật thể — DN3/DN4.
- mã căn từ PL13 — Q4 07/11.

**Never** (lượt này)

- thửa — chung cư không cần (ADR-0016 §2, luật 11).
- kéo `asset_nodes` xuống trục, căn — ADR-0016 §10 cấm.
- đúc căn cho mọi ô trục × tầng — sinh căn rác (spec §5).
- thấp tầng, nhà phố, đất — ADR-0016 Đợt 2.

**Cross-cutting áp mọi ô Core**: chỉ thêm, không DELETE · nguồn chỉ là mã S0x · chạy trên DB thử, không chạm DB chung.

## 4. Thiết kế

### 4.1 Lược đồ — migration `082_danh_ba_vat_the.sql`

Ba bảng theo khuôn `parties` (055):

```
buildings (building_key bld_<ULID> PK, status, merged_into, region_node_id → asset_nodes (khu hoặc phân khu),
           upi text UNIQUE, iso_region text CHECK IN ('VN-HN','VN-SG'), catalog_tier, created_at)
stacks    (stack_key stk_<ULID> PK, status, merged_into, building_key → buildings, catalog_tier, created_at)
units     (unit_key unt_<ULID> PK, status, merged_into, building_key → buildings, stack_key → stacks NULL,
           floor text NULL, sub_id text, catalog_tier, created_at)
```

- `catalog_tier` (bậc dòng danh mục, F2): `xac_minh` · `suy_ra_manh` · `mot_loi_khai`. Dòng S08 → `xac_minh` theo
  khuyến nghị Hỏi-4 (nhãn kho: «quỹ căn chủ đầu tư»). Lượt này không đúc toà chỉ từ tin (Hỏi-4).
- `upi` đúc một lần lúc INSERT, không cột nào tính lại; `sub_id` = `<stack_key>:<floor>` hoặc `<unit_key>` khi không
  biết trục.
- Trigger chỉ-thêm như 055: không DELETE/TRUNCATE; khoá, `upi`, `sub_id`, `created_at` không đổi; chỉ `status`,
  `merged_into` đổi.
- Không tên, không thuộc tính trong ba bảng — tên toà là bí danh `ten`, mọi thuộc tính là phát biểu.

Mở khung chung:

- `registry_aliases.kind` thêm `ma_nguon` (mã toà/căn tại nguồn — S08 hay mã trên tin). Phạm vi nằm **trong giá trị**,
  không thêm cột: bí danh S08 là `<dự án S08>/<mã toà>`, `<dự án S08>/<mã toà>/<trục>`, `<dự án S08>/<mã căn>`. Index
  duy nhất riêng `(source, kind, value) WHERE retired_at IS NULL AND kind = 'ma_nguon'` — không cột NULL nên không mở
  đường chèn trùng; index của bí danh Người (055) giữ nguyên. Cùng một toà ở hai dự án S08 thành hai khoá, liệt vào
  ứng viên gộp (phạm vi khu gộp nhầm toà cùng mã của hai phân khu — không gỡ lặng được trong bảng chỉ thêm).
  Tên toà (`ten`) không duy nhất toàn cục.
- `registry_events` không đổi.

Mở `field_assertions` (bảng chỉ thêm của 045):

- `resource_name` CHECK thêm `Building`, `Stack`, `Unit`;
- `subject_key` CHECK thêm nhánh `^(bld|stk|unt)_[0-9A-HJKMNP-TV-Z]{26}$`; trigger ghép đôi resource ↔ tiền tố khoá;
- `field` CHECK thêm `builder_name` (RESO `Building.BuilderName`) và `area_id` (phường của toà — local);
- `method` CHECK thêm `registry_inherit` (sổ extension ADR-0016 §11), cặp lớp `inferred`.
- Hàm phân xử tin (`offer_subject_keys`…) chỉ đọc khoá `S0x:` nên không thấy phát biểu vật thể — có ca kiểm.

Sổ từ vựng: `pipeline/mappings.yaml` thêm `catalog_tier`, `alias_kind = ma_nguon`, resource `Unit`/`Stack` theo sổ
extension ADR-0016 §11 (đủ sáu điều kiện ADR-0011); `node pipeline/vocab.mjs --write` sinh seed `ref_lookup` vào 082.

### 4.2 Bộ tách mã S08 — `pipeline/lib/ma-can-s08.mjs`

- Mỗi khuôn một luật có tên (`khuon_id`), khớp toàn chuỗi, trả `{ toa, tang, truc, khuon_id }` hoặc
  `{ khong_tach: lý do }`. Không luật «gần đúng», không đoán.
- Khuôn khai trong mã theo **dạng** (phân cách, độ dài số tầng, vị trí trục); dự án nào dùng khuôn nào là dữ liệu
  local (theo `project_id` S08, tệp gitignored), không nằm trong kho.
- Fixture test là **mã tổng hợp** đúng dạng, không chép mã S08 thật (luật 5, ADR-0016 §9).
- Mã nhóm dịch vụ, shophouse chân đế, mã không có tầng → `khong_tach` với lý do có tên, vào sổ lý do.

### 4.3 Bộ dựng — `pipeline/danh-ba-vat-the.mjs` (+ lõi thuần `pipeline/lib/danh-ba-vat-the.mjs`)

Theo khuôn `pipeline/lib/danh-ba-nguoi.mjs`: lõi thuần tính kế hoạch (cần đúc gì, bí danh gì) từ trạng thái hiện có;
phần ghi chạy một giao dịch.

1. Đọc S08 cao tầng của dự án đã nối khu (`s08_project_links.status = 'noi'`, khu thuộc lát `{Ocean Park 1, Grand Park}`),
   mọi lần chụp.
2. Tách mã → (khu, toà, tầng, trục). Khoá tra: bí danh `ma_nguon` S08 `<khu>/<mã toà>`, `<khu>/<mã toà>/<trục>`,
   `<khu>/<mã căn>`. Có → dùng khoá cũ; chưa có → đúc khoá mới + bí danh. Vì vậy chạy lần hai đúc 0 khoá.
3. Căn chỉ đúc khi có mã căn S08 (hoặc, về sau, mã căn trên tin có khu). Ô trục × tầng không có mã → không đúc.
4. Mã có ở lần chụp trước mà không còn ở lần chụp sau → không làm gì: khoá giữ, off-market suy ra lúc đọc.
5. Phát biểu toà trên tin: chỉ dùng khi tin **có khu xác định** (Hỏi-3). Tên chuẩn hoá (hoa, bỏ khoảng, `Pr6` = `PR6`)
   khớp đúng một toà của khu → bí danh `ten` nguồn S0x của tin; khớp 0 hay ≥ 2 → ứng viên trong sổ, kèm số người đăng
   và số nhóm. Toà chỉ có từ tin không đúc ở lượt này (Hỏi-4) — người duyệt hay PL20 mới đúc.
6. Chủ đầu tư: đọc từ điển local (Hỏi-2), mỗi toà ghi một phát biểu `Building / builder_name`, lớp `fact`, phương
   pháp `hitl`, bằng chứng `{tu_dien, ban: <băm tệp>}`; toà không có dòng từ điển → không phát biểu.
6b. Phường của toà (Hỏi-5): nút vùng của toà (phân khu nếu có `area_ids`, không thì khu) có đúng một `area_id` cấp
   `submarket` → một phát biểu `Building / area_id` lớp `inferred`, phương pháp `registry_inherit`, bằng chứng
   `{nut_vung, area_ids}`. Từ hai phường trở lên hay không có phường → không phát biểu, dòng sổ «khu nhiều phường».
   Hôm nay: Ocean Park 1 có một phường (toà nhận phường); Grand Park có hai (toà không nhận, hàng riêng cần toạ độ toà).
   Kế thừa xuống tin, không đè phường đọc từ chữ bài — PL20.
7. In tổng kết: số toà/trục/căn theo khu, số khoá mới, % mã tách được, sổ lý do theo khuôn. Không in mã S08 thật ra
   log CI.

Cờ: `--db <url>` (mặc định từ chối DB chung `oneinvest` — chỉ chạy trên DB thử khi chưa có lời Mạnh), `--khu`.

### 4.4 Ba dòng `asset_nodes building` — Hỏi-1

Ba dòng là **phân khu** (The Beverly, Lumiere Riverside, Lumiere Boulevard; `dd_field = ComplexName`), không phải toà.
Tài liệu mô hình 07/11 §2.1 xếp phân khu vào họ Vùng. `agent/src/enrich/run.ts:126` và `context-resolver.ts` đọc chúng
làm từ điển toà (làn P2), và `asset_nodes` đồng bộ lên cloud.

Khuyến nghị: **không chuyển ba dòng sang bảng toà**; giữ ở `asset_nodes` (họ Vùng), toà con của chúng trong S08 đúc
`bld_` với `region_node_id` trỏ phân khu. Câu giao «3 dòng chuyển sang toà» và ADR-0016 §3 ghi theo hiểu biết cũ —
ghi Known limits và sửa câu ADR ở commit tài liệu riêng. Lối khác: chuyển đúng câu giao — ba «toà» thật ra là phân
khu, tin sẽ gắn sai mức; phải sửa hai tệp `agent/` của làn P2.

### 4.5 SPL và S08

- Ba bảng mới, bí danh `ma_nguon` S08, phát biểu `builder_name` **không** vào `FILL` của `pipeline/sync-cloud.mjs`
  (ADR-0016 §9: vật thể chỉ từ S08 ở lại máy; vòng này chưa có tin nào trỏ vào nên không vật thể nào được lên).
- Từ điển chủ đầu tư và bảng khuôn theo dự án ở tệp gitignored (`research-local/` hoặc `state/`), như bảng nối của DN1.
- Không mã S08 thật, không tên toà chỉ có từ S08 trong mã, test, tài liệu, commit.

### 4.6 Chạy ở đâu

- Mọi phép đo chạy trên DB thử (`db/db-thu.sh`), áp migration 001…082 từ đầu.
- Phép đo trên dữ liệu thật: chép `stg_s08_inventory` của lát và `s08_project_links` **chỉ đọc** từ máy thu sang DB thử,
  dựng hai lần, in số. Không ghi DB máy thu.
- Áp 082 và chạy bộ dựng trên DB máy thu là lời riêng của Mạnh sau Cổng Bằng chứng.

## 5. Câu chỉ người có (lên thẻ Cổng Phạm vi)

- **Hỏi-1** ba dòng `asset_nodes building`: giữ ở họ Vùng là phân khu (khuyến nghị) hay chuyển sang toà theo câu giao.
  Chọn khuyến nghị là sửa vế «3 dòng toà cũ đã sang bảng toà, khoá cũ giữ làm bí danh» của ngưỡng SỐNG đã ký.
- **Hỏi-2** nguồn chủ đầu tư: từ điển local mỗi dự án S08 một giá trị, Mạnh duyệt bảng tại cổng (khuyến nghị) hay suy
  từ tên khu đô thị (lớp suy luận — sai cho toà của chủ đầu tư khác trong cùng khu).
- **Hỏi-4** bậc dòng S08 và toà chỉ từ tin: S08 bậc xác minh, toà chỉ từ tin là ứng viên (khuyến nghị) hay đúc toà tạm
  từ tin theo spec 03/11 §5 (có toà sớm, nhưng toà ma do gõ sai ở lại vĩnh viễn).
- **Hỏi-5** phường cấp toà trong DB1 cho khu một phường (khuyến nghị; Grand Park thành hàng riêng) hay tách cả phần phường.
- **Hỏi-3** khu của tin khi dùng phát biểu toà: chỉ từ sổ nhóm `collection_units.project_node_ids` (khuyến nghị — hôm
  nay chưa nhóm S03 nào có khu, nên phần tin góp 0 cho tới khi sổ nhóm khai khu) hay suy khu từ tên toà duy nhất
  trong danh mục lát (có số ngay, nhưng là suy luận chồng suy luận).

## 6. Rủi ro

- Khuôn mã nhiều hơn dự kiến → % tách dưới 90 %: sổ lý do theo khuôn cho thấy cần thêm khuôn nào; dưới 70 % là ngưỡng
  CHẾT (đổi sang nhập bảng tay).
- Cùng một toà ở hai dự án S08 → hai khoá; E7 in số ứng viên gộp, gộp là sự kiện người duyệt về sau.
- Đổi CHECK `field_assertions` (bảng lớn, 045/059/061 đã đổi nhiều lần) → dấu lược đồ bản mẫu đổi; chạy trên DB thử.
