---
schema_version: 1
feature: Lượt áp thẻ luật S08 sau không đúc nút thứ hai cho một nhóm đã đúc — dự án mới cùng khoá nhóm nối nút cũ, nhóm đã có hai nút đi thẻ từng cặp
slug: noi-s08-ap-lai-theo-khoa-nhom
owner: phanlemanh@gmail.com
risk_tier: T2
surfaces: [cli]
status: approved
veto_state: mo
veto_opened_at: 2026-11-28T11:00:36Z
approved_by:
approved_at:
design_doc: docs/superpowers/specs/2026-11-22-soat-noi-s08-danh-ba-design.md
---

# Acceptance Contract: noi-s08-ap-lai-theo-khoa-nhom

## Context

DA55 (`soat-noi-s08-danh-ba`) đúc nút ứng viên cho dự án S08 không khớp nút nào, các dự án cùng tên gốc cùng tỉnh chung một nút —
nhưng chỉ trong MỘT lượt áp: bảng nhóm của `apTheLuat` sống trong lượt đó. Lượt áp sau, một dự án S08 mới về cùng khoá nhóm với
nhóm đã đúc thì luật xếp ngả không thấy nút cũ (nút do luật S08 đúc không là ứng viên nối) và đúc nút thứ hai. Số đo DA55 vòng 2
(`_acceptance/soat-noi-s08-danh-ba/nut-trung-khoa-nhom.md`, GS 26/11): hôm đó 0 nút trùng, lỗi nổ khi S08 thu thêm dự án vào nhóm đã
đúc — S08 đang thu toàn bộ (lời 22/11). GS cấp mã DA65 ngày 27/11, xếp trước lượt nạp S08 kế. Đo chỉ đọc DB máy thu 28/11: 185 dự
án, 146 nhóm có nút S08, mỗi nhóm đúng một nút, thẻ mã gốc và mã mới cho cùng kết cục ở cả 185 dự án (lỗi đang tiềm ẩn).

## Criteria

- AC-1: Given một dự án S08 không khớp nút có sẵn nào và bảng «nhóm đã đúc» (khoá nhóm → nút S08 đúc ở lượt trước), When xếp ngả,
  Then:
  - khoá nhóm có đúng một nút S08 → ngả đúc trỏ nút ấy (kết cục chuẩn `duc:#<id>`, căn cứ `S08-nut-ung-vien`), không hứa nút mới;
  - khoá nhóm có từ hai nút S08 → thẻ từng cặp `nhieu-ung-vien` nêu đủ các nút, không nối, không đúc;
  - khoá nhóm chưa có nút (kể cả cùng tên khác tỉnh) → đúc nhóm mới như DA55; mười lăm ca DA55 giữ nguyên.
- AC-2: Given DB đã áp một lượt S08 (nhóm «X» đã có nút), When nạp thêm dự án «TMDV X» cùng tỉnh rồi dựng thẻ và áp, Then thẻ xếp
  nó vào nút cũ và hứa 0 nút mới; áp đúc 0 nút, ghi dòng nối `noi` và bí danh `ma_nguon` trỏ nút cũ; áp lần hai không đổi gì; cấy
  thêm một nút S08 thứ hai cùng khoá thì dự án mới kế của nhóm ra thẻ từng cặp nêu cả hai nút.
- AC-3: Given DB máy thu (chỉ đọc), When dựng thẻ, Then không dự án ngả đúc nào đúc lại nhóm đã có nút, dự án của nhóm một nút trỏ
  nút ấy, số nút mới thẻ hứa bằng số khoá nhóm chưa có nút; dự án giả cùng khoá với một dự án đã đúc (không ghi DB) về nút cũ, còn
  luật bỏ bảng nhóm đã đúc thì đúc nhóm mới.

## Coverage

- Bảng nhóm đã đúc: không có, một nút, hai nút, khác tỉnh → AC-1
- Đường gom nhóm: dự án đang trỏ nút S08, chính nút S08 theo tên gốc + tỉnh → AC-2 (cấy nút thứ hai không có dự án nào trỏ)
- Áp: lượt sau cùng nhóm, bí danh, áp lần hai → AC-2
- Dữ liệu thật: ba bất biến + đối chứng hai chiều trên DB máy thu → AC-3

## Đường đo

Hàng nền: số trên màn không đổi hôm nay — đo chỉ đọc DB máy thu 28/11 cho kết cục mã gốc và mã mới trùng ở 185/185 dự án, 146/146
nhóm một nút. Ô sẽ giữ đúng khi lượt nạp S08 kế về: chân ô «Mã nguồn chưa nối» S08 ở `/ops/registry` và số nút
`meta.nguon = 'S08'` không tăng theo dự án mới cùng nhóm. Lệnh đo: E3 (`probes/bat-bien-that.mjs`).

## Out of scope

- Gộp hai nút S08 đã trùng (nếu có): ngoài phạm vi, vì DB máy thu hôm nay 0 nhóm hai nút; ca này ra thẻ từng cặp chờ người.
- Áp lại thẻ S08 lên DB máy thu: ngoài phạm vi của mã; hôm nay thẻ không đổi gì, lượt áp kế đi theo lượt nạp S08 và lời riêng của Mạnh kèm băm (design doc §7).
- Khoá nhóm theo bí danh, theo điểm bản đồ: ngoài phạm vi, vì khoá DA55 (tên gốc + tỉnh) giữ nguyên.

## Notes

- Hồ sơ máy-đi-trước (làn V): T2, xanh-sạch thì máy thông, cửa veto mở.
- `pipeline/noi-du-an-s08-luat.mjs` khai thêm vào vùng hàng (ô ghi `pipeline/noi-du-an-s08.mjs`, tệp thật của lệnh luật là `-luat`).
