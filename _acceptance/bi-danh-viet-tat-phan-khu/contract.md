---
schema_version: 1
feature: Bốn tên viết tắt phân khu (ori, rb, bs, gh) vào danh bạ qua thẻ luật có băm, đảo được, để GT5 đọc phân khu từ danh bạ
slug: bi-danh-viet-tat-phan-khu
owner: phanlemanh@gmail.com
risk_tier: T2
surfaces: [cli]
status: implemented
veto_state: mo
veto_opened_at: 2026-11-20T01:36:02Z
approved_by:
approved_at:
design_doc: docs/superpowers/specs/2026-11-20-bi-danh-viet-tat-phan-khu-design.md
---

# Acceptance Contract: bi-danh-viet-tat-phan-khu

## Context

Tin S03 ở Grand Park gọi phân khu bằng tên tắt mà danh bạ chưa có, nên bộ đọc phân khu của GT5 bỏ sót 864 tin. Hàng này đưa
bốn tên tắt vào `asset_nodes.aliases` của nút phân khu qua một thẻ luật có băm, áp theo băm, đảo được, không migration, và khai
giao diện đọc cho GT5. Căn cứ: GT5 Hỏi-1 (`_acceptance/khoa-gom-hai-tang/decisions.jsonl` `d-20261119T152224Z-6`, Mạnh duyệt
20/11). Áp lên DB máy thu sau DA46, theo chữ ký Cổng Bằng chứng kèm băm thẻ.

## Criteria

- AC-1: Given bảng bốn tên tắt và cây danh bạ, When dựng thẻ, Then mỗi tên tắt gán đúng một nút `subzone` chưa nghỉ, con trực tiếp của dự án khai trong bảng, có tên đã gập bỏ «the» bằng tên đích; hai ứng viên cùng tên thì lấy nút không do luật S16 đúc; nút nghỉ không bao giờ là đích; không có nút, hoặc vẫn còn hơn một ứng viên, thì tên tắt vào «không gán» kèm lý do.
- AC-2: Given cây danh bạ, When dựng thẻ hai lần, Then thẻ liệt từng tên tắt với id, tên nút, dự án và số tin S03 chứa token, liệt ca không gán kèm lý do, in cùng một băm cả hai lần và không ghi gì vào DB.
- AC-3: Given thẻ và băm, When áp, Then băm lệch thì không ghi gì; băm đúng thì tên tắt nối vào cuối `aliases` của nút đích, bí danh cũ giữ nguyên thứ tự, id nút giữ nguyên, `meta.bi_danh_viet_tat` ghi mã luật và đúng các tên chính lượt thêm, ghi đúng một dòng `project_link_rules`; tên đã có sẵn trên nút không ghi lại và không vào danh sách thêm; áp lần hai không đổi gì.
- AC-4: Given một lượt bí danh đã áp, When đảo theo mã luật, Then `aliases` và `meta` của mọi nút về đúng như trước áp và dòng luật ghi người, giờ đảo; đảo một mã luật không phải lượt bí danh thì từ chối và không ghi gì.
- AC-5: Given cặp nút trùng DA46 (nút mới do luật S16 đúc, nút giữ lại), When áp bí danh trước rồi nối DA46, nối DA46 trước rồi áp bí danh, và đảo DA46 sau khi áp bí danh, Then nút giữ lại mang đúng tên tắt ở cả ba thứ tự, nút nghỉ không mang tên tắt, và đảo bí danh không gỡ bí danh DA46 dồn về.
- AC-6: Given đã áp, When bên đọc dựng từ điển phân khu qua `docTenPhanKhu` và khớp chữ theo luật GT5, Then chữ có tên tắt trong dự án của nút đích ra đúng phân khu, và ra cùng khoá với tên đầy đủ (kể cả «rb» và «rainbow» khi còn hai nút 48, 389 cùng tên); cùng tên tắt ở tin dự án khác, hay dính chữ số («bs1»), không ra phân khu; nút nghỉ mang tên tắt không vào từ điển.
- AC-7: Given đã áp, When lượt dựng đêm của danh bạ (dựng phân khu S16 và danh bạ vật thể) chạy lại hai lần, Then tên tắt vẫn nằm trên nút đích và số nút không đổi; bộ soát S16 của đường cloud trên `asset_nodes` vẫn sạch.
- AC-8: Given một lượt bí danh đã áp, When chạy lệnh kiểm sau, Then lệnh thoát 0 khi mọi tên của lượt nằm trên nút chưa nghỉ; thoát 1 và nêu id nút khi thiếu một tên hoặc nút đích đã nghỉ.
- AC-9: Given bản chép DB máy thu, When chạy trọn chuỗi thẻ, áp, đo, kiểm, đảo, Then thẻ gán ori→44, rb→48, bs→387, gh→43 và 0 tên không gán; lệnh đo in số tin S03 đọc được phân khu qua danh bạ trước và sau áp tăng ít nhất 800, mỗi tên tắt có ít nhất ori 333 · rb 108 · bs 282 · gh 190 tin chỉ đọc được phân khu nhờ nó, 0 tin mất phân khu cũ (chạy thử 20/11: 966 → 1.830, sau DA46 919 → 1.786; từng tên 416 · 135 · 352 · 238); đảo về đúng dấu vân tay `aliases` và `meta` trước áp.

## Coverage

Bảng phủ ca đếm trên DB máy thu ở design doc §2. Trục và ca:

- Chọn đích: một ứng viên, hai ứng viên cùng tên (một do luật S16 đúc), không có nút, nút nghỉ, dự án khác → AC-1
- Thẻ: có gán, không gán, băm ổn định, chỉ đọc → AC-2
- Áp: băm lệch, băm đúng, tên đã có sẵn, áp lần hai → AC-3; đảo, đảo nhầm mã → AC-4
- Với DA46: áp trước, áp sau, đảo DA46 sau → AC-5
- Bên đọc: GT5 khớp chữ, dự án khác, dính chữ số, nút nghỉ → AC-6; dựng đêm, cloud → AC-7; kiểm sau → AC-8
- Dữ liệu thật: bốn đích, số đo, đảo trên bản chép → AC-9

## Đường đo

- Số tin S03 đọc được phân khu qua danh bạ: `node pipeline/scripts/bi-danh-viet-tat-phan-khu.mjs --do --rule <id>` trên DB máy thu
  sau khi áp, báo cạnh số chạy thử của AC-9 (sau DA46: 919 → 1.786), kèm số theo từng tên tắt. AC-9 bảo đảm lệnh đo và số chạy thử.
- Tên tắt trên cloud: sau lượt đồng bộ đêm đầu tiên kể từ lúc áp, đếm `asset_nodes` ở cloud có bốn tên tắt trên đúng bốn nút đích
  (bước kiểm sau trong hồ sơ áp, design doc §4).

## Out of scope

- GT5 bỏ bảng viết tắt trong mã và chuyển sang `docTenPhanKhu`: ngoài phạm vi, vì là việc của hàng GT5 (`feat/khoa-gom-hai-tang`).
- Tên tắt khác chưa có trong bảng của GT5 (ví dụ «be» cho The Beverly): ngoài phạm vi, vì cần đếm và người chọn từng tên.
- Bộ đọc GT5 lọc nút nghỉ trong câu riêng của nó: ngoài phạm vi, vì là mã của GT5 (cùng lớp DA49).
- Trang Danh bạ Ops hiện tên tắt: ngoài phạm vi, vì trang đã đọc `aliases` sẵn và hàng không chạm `app/`.
- Ghi tên tắt vào `registry_aliases`: ngoài phạm vi, vì cột nguồn bắt buộc `S0x` và đảo xong không áp lại được (design doc §3.1).

## Notes

- Áp lên DB máy thu cần chữ ký Cổng Bằng chứng kèm băm thẻ, sau DA46; hồ sơ áp ở design doc §4 đủ năm thứ.
