---
schema_version: 1
feature: importer S08 nạp snapshot S08 vào stg_s08_inventory, chạy lại không nhân dòng, đổi số an toàn, bỏ snapshot thử
slug: import-s08
owner: phanlemanh@gmail.com
risk_tier: T2
surfaces: [cli]
status: signed-off
veto_state: mo
veto_opened_at: 2026-10-26T13:46:32Z
approved_by:
approved_at:
---

# Acceptance Contract: import-s08

## Context

ZC8 (lộ trình): importer S08 nạp snapshot S08 vào `stg_s08_inventory` (bảng của migration 040, ON18 đã merge). ZCode gộp vào
nhánh S08 v2 (@ 61981ded): nhánh nạp trong `pipeline/import-airbnb.mjs` gọi `s08RowOf` (`pipeline/import-s08-row.mjs`) làm
nguồn dựng dòng duy nhất, đổi chuỗi số rác về NULL, đếm theo dòng thật sự ghi. Cùng nhánh với PL10 (`thu-danh-muc-ocp1`).

Source input: lộ trình ZC8 + lời giao 2610-10 và BÁO 2610-17 (phiên điều phối liên làn, 26/10/2026)

## Criteria

- AC-1: Given snapshot S08 giả hợp lệ (3 căn, 1 detail, 1 trạng thái lạ), When nạp vào DB local, Then đúng 3 dòng; detail và trạng thái lạ bị bỏ; log đếm căn và detail bỏ.
- AC-2: Given trường số là chuỗi, When nạp, Then '100,5' → 100.5 và '2' → 2; 'S', '', '2PN' và giá rác về NULL, không thành số.
- AC-3: Given cùng snapshot, When nạp lần hai, Then số dòng không đổi và log báo 0 căn mới.
- AC-4: Given snapshot thử (tên sai khuôn mốc), When nạp, Then không sinh dòng nào.
- AC-5: Given importer, When đọc nhánh S08, Then dòng chỉ được dựng qua `s08RowOf` (không có bản dựng thứ hai đọc thẳng payload); test hàm đó xanh.
- AC-6: Given lượt kiểm ghi DB local, When kết thúc, Then không còn dòng giả nào.

## Coverage

- Bỏ coverage-scan — một nhánh nạp; trục: số dòng, đổi số, chạy lại, snapshot thử, nguồn dựng dòng, dọn dữ liệu giả.

## Out of scope

- Nạp snapshot S08 thật vào DB oneinvest: việc vận hành sau merge (một lần, chỉ local).
- Biến đổi stg_s08_inventory thành căn/trục: PL11.

## Notes

- Quyết ở Cổng Bằng chứng 2026-10-26 (Mạnh):
  - Ngoài-1: mở hợp đồng mới
  - Ngoài-2: mở hợp đồng mới
