---
schema_version: 1
feature: DA4 — từ vựng và mappings theo mục 39 — «Dự án» thay «Khu đô thị», dự án cha, kế thừa từ nút vùng, thuật ngữ mới, bẫy tên RESO, ba dòng mappings.yaml
slug: tu-vung-du-an-muc-39
owner: phanlemanh@gmail.com
risk_tier: T2
surfaces: [docs, pipeline]
status: signed-off
veto_state: mo
veto_opened_at: 2026-11-11T20:05:00Z
design_doc: docs/superpowers/specs/2026-11-11-tu-vung-du-an-muc-39-design.md
---

# Acceptance Contract: tu-vung-du-an-muc-39

## Context

ROADMAP §3 mục 39 (Mạnh 08/11) đổi nhãn «Khu đô thị» thành «Dự án», mở dự án con có cha và kế thừa từ nút vùng; mục 38 bỏ
luật «chỉ nội bộ» cho thông tin dự án; mục 40 (09/11) thêm bẫy tên RESO và thuật ngữ mới. CONTEXT.md, ADR-0011/0013/0016 và
`pipeline/mappings.yaml` còn viết theo khung cũ (`docs/research/doi-chieu-nhat-quan-0811.md` §4 C7). Hàng DA4 sửa văn bản và
ba dòng mappings; không đổi mã, bảng, cột, URL.

## Criteria

- AC-1: Given CONTEXT.md, When đọc họ Địa lý, Then có thuật ngữ **Dự án** (`Code: project` · `RESO: SubdivisionName`) nói khu
  đô thị, đại đô thị là quy mô và dự án con có dự án cha (`parent_id`) khi «khác chủ đầu tư» hoặc «mở bán riêng» (đủ cả hai
  điều kiện chữ); không còn thuật ngữ
  **Khu đô thị**; **Phân khu** nói cùng chủ đầu tư và `_Avoid_` của nó không còn «dự án con»; `_Avoid_` của **Dự án** không chứa
  «dự án». Bản đột biến giữ khối **Khu đô thị** cũ thì ca đỏ ghim «TV39-AC-1».
- AC-2: Given CONTEXT.md, When đọc sáu thuật ngữ **Danh mục dự án**, **Mức gắn**, **Trạng thái dự án**, **Mã định danh nhà
  nước**, **Tin sơ cấp**, **Độ đủ hồ sơ**, Then mỗi khối có dòng `- Code:` mang `RESO:` và dòng `_Avoid_:`; **Trạng thái dự án**
  nêu đủ ba huy hiệu «Sắp mở bán», «Đang mở bán», «Đã bàn giao» cùng `DevelopmentStatus`, `SalesStatus`, `HandoverDate`; **Mức
  gắn** nêu đủ sáu mức căn · trục · toà · phân khu · dự án · xã/phường; **Tin sơ cấp** nêu `MarketTier` và không vào danh sách
  Bán, thước giá, metrics; **Mã định danh nhà nước** nêu `BuildingId`, `ma_nha_nuoc`, `ParcelNumber`. Thiếu một khối hay một
  mục của ma trận thì ca đỏ gọi tên thuật ngữ và mục thiếu.
- AC-3: Given CONTEXT.md, When đọc khối **Bẫy tên RESO**, Then có đúng bốn bẫy: `Duplex` của PropertySubType là nhà hai hộ còn
  căn duplex là giá trị local của `UnitTypeType`; `YearBuilt` là năm được phép đưa vào sử dụng; `NewConstructionYN` khác sơ
  cấp/thứ cấp; `PropertySubType` và `PropertySubtype` khác chữ hoa. Bỏ một bẫy thì ca đỏ gọi tên field.
- AC-4: Given ADR-0011, ADR-0013, ADR-0016, When đọc Quyết định 2 của 0011, §2 của 0013, §1, §3, §7 của 0016, Then mỗi mục mang
  dấu «Sửa đổi 2026-11-11 (ROADMAP §3 mục 39)»; bảng danh pháp của 0011 và 0013 ghi nhãn «Dự án» cho `project`/`SubdivisionName`;
  0016 §3 nói dự án con trỏ `parent_id`; 0016 §7 nói kế thừa từ nút vùng (chủ đầu tư, phường) với bằng chứng id nút + id phát
  biểu gốc. Bỏ dấu ở một mục thì ca đỏ gọi tên ADR và mục.
- AC-5: Given `pipeline/mappings.yaml`, When đọc bằng bộ đọc yaml của pipeline, Then `canonical.fields.property_type.dd` =
  `PropertySubType`; `canonical.fields.block_raw.dd` = `BuildingName` và chữ của nó không có `asset_nodes` hay `ComplexName`;
  `sources.S08.fields.project_name` có `SubdivisionName`, không có `ComplexName`; `sources.S08.fields.project_id` không còn «chỉ
  local»; `sources.S08.label` và `policy` không còn «chỉ nội bộ», `policy` nói thông tin dự án công khai, tên nguồn thật tầng A
  và `stg_s08_inventory` không sync nguyên bảng; quét mọi chuỗi lá của tệp: không lá nào chứa `node_type=building`, và
  `ComplexName` chỉ còn ở lá `sources.S08.fields.subdivision_name` (phân khu, ADR-0013 §2). Đột biến từng ô (đưa giá trị cũ về,
  hay chèn một lá nối toà mới) thì ca đỏ gọi tên ô hoặc đường dẫn lá.
- AC-6: Given cây làm việc, When chạy `node pipeline/vocab.mjs --check` và `--write` trên bản chép cây, Then `--check` thoát 0 và
  `--write` không đổi byte nào của các tệp sinh trên bản chép (đối chứng dương: bản chép có thêm một giá trị enum thì `--write`
  đổi ít nhất một tệp sinh của bản chép và không đổi tệp nào của cây thật); trong CONTEXT.md, ba ADR và `mappings.yaml` mọi dòng còn chữ «khu đô thị»
  (không phân biệt hoa thường, sau chuẩn hoá NFC) đều chứa «quy mô»; suite `cd pipeline && npm test`, `cd app && npm test` (gồm ON12) và
  `cd app && npm run test:lint-rules` (gồm route-slugs) xanh. Bản chép thêm một dòng «khu đô thị» không kèm «quy mô» thì ca đỏ
  gọi tên tệp và số dòng.

## Coverage

Bỏ quét không gian AC — xem dòng sổ `descope` «bỏ coverage-scan» (bản thay `supersedes`): phạm vi là danh sách đã khai sẵn ở
ba nguồn, mỗi mục một AC; đổi lại không có bằng chứng độ phủ ngoài ma trận dưới.

| Mục | Nguồn chốt | AC |
|---|---|---|
| «Dự án» thay «Khu đô thị», quy mô, dự án con có cha, phân khu cùng chủ đầu tư | ROADMAP mục 39 Hỏi-1, Hỏi-2 | AC-1 |
| «Danh mục dự án», «Mức gắn», ba huy hiệu | `ke-hoach-danh-ba-du-an-0811.md` hàng DA0a; ROADMAP mục 39 (nhãn theo vòng đời) | AC-2 |
| «Tin sơ cấp», «Độ đủ hồ sơ», «Mã định danh nhà nước» | câu giao DA4 (`lo-trinh.json`); mục 40 Q3; DA20, DA24 | AC-2 |
| Bốn bẫy tên RESO | ghi chú DA4 (`lo-trinh.json`, sửa 09/11 mục 40) | AC-3 |
| ADR-0011 Qđ 2, ADR-0013 §2, ADR-0016 §1/§3/§7 | ROADMAP mục 39 «Sửa văn bản…»; hàng DA0a | AC-4 |
| `property_type`, `block_raw`, S08 `project_name`, nhãn «chỉ nội bộ» | hàng DA0b; mục 38; bản đối chiếu §4 C7 | AC-5 |
| Bộ sinh vocab không đổi, «Khu đô thị» chỉ ở nghĩa quy mô, test xanh | điều kiện bật DA4 (`bat_khi`) | AC-6 |

## Out of scope

- Đổi chữ «Khu đô thị» trên UI Ops (`so-don-vi.tsx`, `so-don-vi-dialog.tsx`, `do-hang-ngay.tsx`, `lam-giau-bang.tsx`) và thêm
  `_Avoid_: khu đô thị` vào CONTEXT — hàng riêng (ca ON12 sẽ đỏ nếu thêm `_Avoid_` trước khi đổi UI).
- `construction_area`, `apartment_type_name` của S08 lệch §9.3 F (`BuildingFootprintArea`, `UnitTypeType`) — hàng DA16.
- Đổi loại ba nút Grand Park (DA1), bảng nối dự án (DA3), code đọc `parent_id` hay kế thừa từ nút vùng — hàng của chúng.
- FRAMING.md, ROADMAP văn xuôi, tài liệu nghiên cứu.

## Notes
- Known limits — chọn ở Cổng Bằng chứng 2026-11-12:
  - Ngoài-1: Chú thích cạnh trường loại hình trong mappings.yaml còn tả theo cách gọi cũ dù trường đã khai PropertySubType.
  - Ngoài-3: CONTEXT ghi trước tên các trường mở rộng (MarketTier, SalesStatus, HandoverDate, ma_nha_nuoc, project_node_id, subzone_node_id) chưa khai chính thức; các hàng sau khai.
  - Ngoài-4: Bảng lưu vết của ADR-0011 còn xếp «Dự án con» vào phân khu, cạnh khối sửa đổi nói ngược lại.
  - Ngoài-7: Test chỉ kiểm chữ có mặt trong khối Tin sơ cấp, không kiểm câu phủ định «không vào danh sách Bán, thước giá, metrics».
  - Ngoài-8: Test kiểm sáu mức gắn bằng chữ rời trong cả khối, không ràng vào cùng dòng thang.
