# DA4 tu-vung-du-an-muc-39 — Từ vựng và mappings theo mục 39

Hàng DA4 của lộ trình (đợt `danh-ba-du-an-0811`, gộp DA0a văn bản + DA0b `mappings.yaml` của
`docs/plan/ke-hoach-danh-ba-du-an-0811.md`). Căn cứ: ROADMAP §3 mục 39 (Hỏi-1, Hỏi-2, nhãn theo vòng đời),
mục 38 (thông tin dự án công khai), mục 40 (bẫy tên RESO, thuật ngữ mới), `docs/research/doi-chieu-nhat-quan-0811.md`
§4 C7 và §5.

## Mục tiêu

Một người đọc CONTEXT.md, ba ADR (0011, 0013, 0016) và `pipeline/mappings.yaml` thấy cùng một từ vựng cho dự án:

- nhãn hiển thị «Dự án» thay «Khu đô thị»; khu đô thị, đại đô thị chỉ còn là **quy mô** của dự án. Chỉ đổi chữ:
  mã `project`, `asset_nodes.node_type`, RESO `SubdivisionName`, tên bảng, cột, URL không đổi;
- dự án con có dự án cha (`parent_id`) khi khác chủ đầu tư hoặc mở bán riêng; cùng chủ đầu tư là phân khu;
- kế thừa mở từ nút vùng xuống (chủ đầu tư, phường), bằng chứng là id nút + id phát biểu gốc (ADR-0016 §7);
- thuật ngữ mới: «Mức gắn», «Danh mục dự án», «Trạng thái dự án» (ba huy hiệu), «Tin sơ cấp», «Độ đủ hồ sơ»,
  «Mã định danh nhà nước»; một khối «Bẫy tên RESO» bốn dòng;
- `mappings.yaml`: `property_type` khai `PropertySubType` (`kind` mới là `PropertyType`), `block_raw` khai
  `BuildingName`, S08 `project_name` khai `SubdivisionName`; bỏ nhãn «chỉ nội bộ» của S08 theo mục 38.

## Thiết kế

### CONTEXT.md (họ Địa lý)

- Thuật ngữ **Dự án** thay khối **Khu đô thị**: định nghĩa, `Code: project · RESO: SubdivisionName`, ghi chú quy mô
  (khu đô thị, đại đô thị), dự án con có cha. `_Avoid_: đại đô thị` (bỏ «dự án» khỏi danh sách tránh).
- **Phân khu**: cùng chủ đầu tư; khác chủ đầu tư hoặc mở bán riêng là dự án con. Bỏ «dự án con» khỏi `_Avoid_`.
- **Danh mục dự án**, **Mức gắn**, **Trạng thái dự án** (Sắp mở bán · Đang mở bán · Đã bàn giao, RESO
  `DevelopmentStatus` + extension `SalesStatus`, `HandoverDate`), **Mã định danh nhà nước** (`BuildingId` cho toà,
  bí danh `ma_nha_nuoc` cho căn, `ParcelNumber` cho thửa).
- Họ Tài sản & tin: **Tin sơ cấp** (extension `MarketTier`; không vào danh sách Bán, thước giá, metrics — mục 39
  Hỏi-3), **Độ đủ hồ sơ** (bảy nhóm thông tin, mức M0–M5 của DA20).
- Khối **Bẫy tên RESO** (cuối họ Tài sản & tin): Duplex, YearBuilt, NewConstructionYN, PropertySubType/PropertySubtype.
- Các dòng còn nói «khu đô thị» như thực thể (ghi chú `asset_nodes`, lát đo hằng ngày, thẻ nhóm) đổi sang «dự án».

**Không** thêm «khu đô thị» vào `_Avoid_` ở vòng này: ca ON12 của app (`ops-nhan-theo-context.test.tsx`) quét chữ
hiển thị trên Ops theo `_Avoid_`, mà Ops còn ghi «Khu đô thị» ở `so-don-vi.tsx`, `so-don-vi-dialog.tsx`,
`do-hang-ngay.tsx` — ngoài vùng hàng này. Đổi chữ UI là hàng riêng; hàng ấy thêm `_Avoid_` cùng lúc.

### ADR (sửa tại chỗ, đánh dấu «Sửa đổi 2026-11-11 (ROADMAP §3 mục 39)»)

- ADR-0011 Quyết định 2: hàng bảng «Dự án» → nhãn «Dự án» (code `project`, `SubdivisionName`); câu cây phẳng thêm
  ngoại lệ dự án cha.
- ADR-0013 §2: hàng «Dự án» → nhãn «Dự án»; phân khu vẫn `ComplexName`.
- ADR-0016 §1 (bảng họ Vùng: dự án · phân khu), §3 (dự án con trỏ `parent_id`, ba nút Grand Park đổi loại ở DA1),
  §7 (kế thừa từ nút vùng: chủ đầu tư, phường; bằng chứng id nút + id phát biểu gốc).

### mappings.yaml

- `canonical.fields.property_type.dd: PropertySubType`, ghi chú nói `kind` mang `PropertyType`.
- `canonical.fields.block_raw.dd: BuildingName`, rationale bỏ «asset_nodes node_type=building (≈ComplexName)».
- `sources.S08.label` bỏ «chỉ nội bộ»; `policy` theo mục 38 (thông tin dự án công khai, tên nguồn tầng A,
  `stg_s08_inventory` không sync nguyên bảng); `project_name: → SubdivisionName (nút dự án)`;
  `project_id` bỏ «chỉ local» và «khu đô thị».
- Không đổi khối `enums:` ⇒ `node pipeline/vocab.mjs --write` không đổi tệp sinh nào.

### Phép đo

Một tệp test thuần `pipeline/scripts/tu-vung-du-an.test.mjs` (không DB), mã ca `TV39-AC-n`, đọc CONTEXT.md, ba ADR,
`mappings.yaml` (qua `readMappings`/yaml của pipeline) và chạy `vocab.mjs --check` / `--write` trên bản chép. Mỗi
ca có đối chứng đỏ trên bản đột biến trong bộ nhớ, thông điệp ghim. Chạy trong `cd pipeline && npm test`.

## Ngoài phạm vi

- Đổi chữ «Khu đô thị» trên UI Ops (ba tệp trên) và thêm `_Avoid_: khu đô thị` — hàng riêng.
- `construction_area`, `apartment_type_name` của S08 lệch §9.3 F (`BuildingFootprintArea`, `UnitTypeType`) — hàng DA16.
- Sửa ba nút Grand Park (DA1), bảng nối dự án (DA3), code đọc `parent_id` — hàng của chúng.
- FRAMING, ROADMAP văn xuôi ngoài CONTEXT/ADR.

## Đặc tả UX

Bỏ — hàng không chạm giao diện (sổ `descope`).
