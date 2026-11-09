---
schema_version: 1
slug: tu-vung-du-an-muc-39
feature: Từ vựng và mappings theo mục 39: «Dự án», phân khu, mức gắn và ba huy hiệu trạng thái có trong CONTEXT; ADR-0011, 0013, 0016 nói dự án cha và kế thừa từ nút vùng; mappings.yaml khai property_type → PropertySubType, block_raw → BuildingName, S08 project_name → SubdivisionName; CONTEXT có thêm «Tin sơ cấp», «Độ đủ hồ sơ», «Mã định danh nhà nước»
owner: phanlemanh@gmail.com
stage: decided              # discovery | decided | archived
decision: build         # build | iterate | park | kill — người ký Cổng 0 điền
decided_by: Mạnh chốt gói danh bạ dự án toàn diện 09/11 «Theo khuyến nghị» (Q1–Q9) và bảo «Gửi cho Giám Sát mở phiên thực hiện»; giám sát đợt dot0-cam-mau ghi ô
decided_at: 2026-11-09T15:25:52Z     # ISO UTC
prototype:
  base_commit:     # điểm cắt nhánh proto khỏi nhánh chính — guard diffBase khi keep
  disposition:     # keep | archive
---

## Vấn đề & ai gặp

Mục 39 Hỏi-1, Hỏi-2 và bản đối chiếu 08/11: mappings.yaml khai DD hai cách cho property_type, gán toà và dự án S08 sai field.

Hàng DA4 trong `docs/plan/lo-trinh.json` (PR #388, bản phạm vi `docs/plan/pham-vi-danh-ba-du-an-toan-dien-0911.md`). mappings.yaml không thuộc t1_skip_globs nên hạng T2. Tránh lúc GCQ2, GC2, GC3 đang sửa mappings.yaml. Kế hoạch: DA0a + DA0b. Sửa 09/11 (mục 40): ghi bẫy tên RESO vào CONTEXT — PropertySubType Duplex là nhà hai hộ (căn duplex là giá trị local của UnitTypeType), YearBuilt là năm được phép đưa vào sử dụng, NewConstructionYN khác sơ cấp/thứ cấp, PropertySubType và PropertySubtype khác chữ hoa.

## Ngưỡng chết / ngưỡng UAT

- Câu hỏi phép đo trả lời: [đề xuất] Bộ sinh vocab chạy lại chỉ đổi đúng các dòng đã khai; test route-slugs và test pipeline xanh; «Khu đô thị» chỉ còn ở nghĩa quy mô; mappings.yaml không còn dòng nối toà với asset_nodes node_type=building hay S08 project_name với ComplexName?
- Kết quả nào là SỐNG: [đề xuất] Bộ sinh vocab chạy lại chỉ đổi đúng các dòng đã khai; test route-slugs và test pipeline xanh; «Khu đô thị» chỉ còn ở nghĩa quy mô; mappings.yaml không còn dòng nối toà với asset_nodes node_type=building hay S08 project_name với ComplexName
- Kết quả nào là CHẾT: [đề xuất] không đạt điều kiện bật khi hết timebox
- Timebox: một vòng
