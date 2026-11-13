---
schema_version: 1
feature: DA9 — tin gắn dự án nằm trọn một xã nhận phường suy ra từ dự án (phát biểu area_id kế thừa + bộ phân xử đưa vào cột khi tin chỉ tới tỉnh hay trống), không đè phường đã có
slug: phuong-tu-du-an
owner: phanlemanh@gmail.com
risk_tier: T3
surfaces: [db, pipeline]
status: implemented
approved_by: Mạnh
approved_at: 2026-11-13
design_doc: docs/superpowers/specs/2026-11-13-phuong-tu-du-an-design.md
---

# Acceptance Contract: phuong-tu-du-an

## Context

Tin S03 hầu hết chỉ tới tỉnh (đo 13/11: 5.714 tỉnh, 245 trống, 57 có phường trên tin sống). Nhóm S03 lập theo dự án, và DV6 ghi
dự án lên bài; 14 nút dự án nằm trọn một phường. Hàng này ghi phát biểu phường kế thừa và mở bộ phân xử cho `area_id` (migration
099) để phường ấy vào cột khi tin chưa có phường. T3 vì chạm `db/migrations/**`.

## Criteria

- AC-1: Given DB thử dựng từ chuỗi migration của nhánh (gồm 099), nút dự án D1 có `area_ids` = [một phường W1], D2 = [hai phường],
  D3 = [một mã tỉnh], bài có phát biểu `project_node_id` sống trỏ D1, D2, D3, When chạy bộ ghi với `--ghi`, Then bài của D1 có đúng
  một phát biểu `area_id` = W1, `inferred` · `registry_inherit`, luật `phuong-tu-du-an`, evidence mang `project_node_id`; bài của D2,
  D3 không có dòng nào.
- AC-2: Given bài có hai phát biểu `project_node_id` sống trỏ hai dự án khác nhau, When chạy `--ghi`, Then bài không có phát biểu
  kế thừa và bảng đếm có `du_an_mau_thuan` = số bài ấy.
- AC-3: Given tin có cột `area_id` là một phường W2 khác W1 và bài có phát biểu kế thừa W1, When chạy `resolve_offer_fields` (trực
  tiếp và qua bước S03 của `transform-zalo`), Then cột vẫn là W2; với tin cột tỉnh hay trống và có đúng một phường kế thừa, Then
  cột = W1 và `field_provenance->'area_id'` mang `registry_inherit`, `inferred`, `nguon` = `du-an`; tin có hai phường kế thừa khác
  nhau giữ giá trị trước.
- AC-4: Given tin đã nhận W1 (cột mang nhãn `nguon = du-an` và giá trị gốc), When gỡ phát biểu dự án (rút `project_node_id`)
  hay đổi `area_ids` của nút sang W3, rồi chạy lại `--ghi` và `resolve_offer_fields` (KHÔNG chạy lại transform), Then phát biểu
  kế thừa cũ bị rút có lý do `xet-lai-du-an`; tin gỡ dự án có cột về đúng giá trị gốc và không còn khoá `area_id` trong
  `field_provenance`; tin đổi nút có cột = W3; chạy thêm lần nữa → 0 chèn, 0 rút.
- AC-5: Given tin đã nhận W1 và tin T2 mà `reassign-areas` đặt NULL vì khu lạc, When chạy chuỗi thật bước S03 của
  `transform-zalo` → phân xử → `reassign-areas` → phân xử, Then tin W1 vẫn W1 và T2 giữ đúng giá trị `reassign-areas` đặt nếu không
  có phường kế thừa.
- AC-6: Given DB thử có đủ tin nhiều dạng, phát biểu kế thừa sinh bằng chính bộ ghi (`--ghi`), When đếm độc lập bằng SQL của test trước và sau `--ghi` + phân xử, Then số tin có phường
  sau = trước + số tin cột tỉnh/trống có đúng một phường kế thừa; số tin vốn có phường bị đổi = 0.
- AC-7: Given DB đã có 099, When áp 099 lần hai, Then không lỗi và thân hàm `resolve_offer_fields` không đổi; mọi ca của bộ
  phân xử trước 099 (045, 061, 068) vẫn xanh không sửa ca.
- AC-8: Given lệnh không cờ, When chạy, Then chỉ đếm, số dòng `field_assertions` và cột tin không đổi; thiếu 096/099 → thoát 2 gọi
  tên điều thiếu; `--ghi` lỗi giữa chừng không để lại dòng nào.
- AC-9: Given cây làm việc, When chạy `cd pipeline && npm test` và `node --test --test-concurrency=1 pipeline/scripts/danh-ba-vat-the.itest.mjs`,
  Then thoát 0.

## Coverage

Trục: số phường của nút (một phường · nhiều · chỉ tỉnh · trống) × dự án trên bài (một · hai khác nhau · không) × cột hiện tại của
tin (phường · tỉnh · trống) × thời gian (lượt đầu · gỡ dự án · nút đổi phường · S03 chạy lại · chạy lại không đổi) — AC-1…AC-6;
luật cũ của bộ phân xử — AC-7; chế độ chạy — AC-8.
Ô loại có lý do: nguồn khác S03 (S06 — Out of scope); bài không có dự án (không ứng viên, phủ ở đối chứng của AC-1).

## Đường đo

- «0 tin đang có phường bị đổi» ← AC-3, AC-6 trên DB thử; trên DB máy thu: chế độ đếm chạy ngay trước lời ghi thật, ghi
  `_acceptance/phuong-tu-du-an/do-may-thu.md` (T0, K dự kiến, số tin có phường nguồn bị đổi); số ấy khác 0 thì không xin ghi thật.
- «số tin S03 có phường trước và sau khớp đếm độc lập» ← AC-6.
- «gỡ liên kết dự án thì phát biểu kế thừa bị rút» ← AC-4.

## Out of scope

- Ghi thật lên máy thu, áp 099 lên máy thu hay cloud — lời riêng của Mạnh sau gộp.
- Sửa thước DF7 và giao diện nhãn «suy ra từ dự án» (DF7 đọc `field_provenance`).
- Nút nhiều phường (Phú Mỹ Hưng) và 5 nút chỉ tới tỉnh.
- Bộ ghi dự án trên tin (DV6, GCQ2, DV2, DV3).
