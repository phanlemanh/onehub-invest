---
schema_version: 1
feature: Nối dự án S08 vào danh bạ qua một thẻ luật theo nguồn (nối nút có sẵn, đúc nút ứng viên, từ chối có lý do), đảo được, màn Ops đếm được
slug: soat-noi-s08-danh-ba
owner: phanlemanh@gmail.com
risk_tier: T2
surfaces: [cli, ui]
status: approved
veto_state: mo
veto_opened_at: 2026-11-22T04:10:00Z
approved_by:
approved_at:
design_doc: docs/superpowers/specs/2026-11-22-soat-noi-s08-danh-ba-design.md
---

# Acceptance Contract: soat-noi-s08-danh-ba

## Context

Màn `/ops/registry` báo S08 mới nối 8/185 dự án. Bảng phủ ca đếm trên DB máy thu 22/11 (design doc §2) cho thấy nghẽn không ở
thẻ chờ duyệt: S08 chưa có thẻ luật nào, bảng nối hiện có là một tệp tay phủ hai khu, và 157/185 dự án không khớp nút nào. Hàng
này dựng thẻ luật S08 theo khuôn DA32 của S06: nối vào nút có sẵn khi khớp tên đúng một nút cùng tỉnh, đúc nút ứng viên cho dự án
không khớp, từ chối có lý do; áp theo băm, đảo được. Căn cứ: GS giao DA55 ngày 22/11, kế hoạch LL bước A3, mô hình danh bạ
11/11 (Hỏi-1, Hỏi-2), quyết định 17/11 (Q-A) và 19/11 (duyệt theo loại căn cứ).

## Criteria

- AC-1: Given một dự án S08 (tên, tỉnh từ điểm bản đồ, trạng thái nối tay) và các nút dự án, When xếp ngả, Then dự án vào đúng một
  ngả theo thứ tự §3 của design doc:
  - đã nối tay → giữ tay; đã có nút do luật S08 đúc → giữ nút ấy;
  - tên rỗng giả → từ chối `khong-ten`; tên mang hậu tố khu → `du-an-con`; không tỉnh → `khong-tinh`;
  - tên gốc (bỏ «_TT», « TT» cuối, «TMDV » đầu) trùng hẳn tên/bí danh của đúng một nút cùng tỉnh, không nút chưa biết tỉnh nào trùng
    → nối, căn cứ `S08-ten-chuan-cung-tinh`; nút ứng viên của nguồn khác (S06, S09) là ứng viên, nút do luật S08 đúc thì không;
  - trùng hẳn từ hai nút → thẻ từng cặp `nhieu-ung-vien`; trùng hẳn một nút chưa biết tỉnh → `nut-khong-tinh`; chỉ chứa/nằm trong
    tên ≥ 8 ký tự của một nút → `gan-giong`; ca thẻ từng cặp không nối, không đúc; nút khác tỉnh không bao giờ là ứng viên;
  - còn lại → đúc, các dự án cùng tên gốc và cùng tỉnh chung một nút.
- AC-2: Given DB, When dựng thẻ hai lần, Then thẻ ghi loại căn cứ của từng ngả, in đủ mọi dòng nối nút có sẵn, thẻ từng cặp và từ
  chối, không in mã dự án S08, in cùng một băm cả hai lần và không ghi gì vào DB; băm đổi khi kết cục, nút đích hay nhóm đúc của một dự
  án đổi.
- AC-3: Given thẻ và băm, When áp, Then:
  - băm lệch thì không ghi gì;
  - băm đúng thì ghi đúng một dòng `project_link_rules` nguồn S08, mỗi dự án của thẻ một dòng `project_links` nguồn S08 mang
    `rule_id`, bí danh `ma_nguon` nguồn S08 ở `registry_aliases` cho dự án nối, nút đúc mang `mot_loi_khai`, khu và điểm bản đồ, meta
    không mang mã dự án S08;
  - dòng `asset_nodes` của mọi nút có sẵn không đổi một byte, `s08_project_links` không đổi, bí danh có sẵn không đổi; áp lần hai
    không đổi gì.
- AC-4: Given một lượt đã áp, When đảo theo mã lượt, Then bí danh của lượt nghỉ, dòng `noi` về `chua_noi` «dao-luat», nút ứng viên
  còn nguyên, dòng luật ghi người và giờ đảo; đảo lần hai báo «da-dao», không ghi.
- AC-5: Given đã áp, When chạy lệnh kiểm của lượt, Then thoát 0 khi không mã nào trỏ hai nút, không cặp mã–nút lệch tỉnh và mọi dự án
  của tập có dòng trạng thái; cấy lệch tỉnh hay thiếu dòng trạng thái thì thoát 1 nêu loại lỗi và số đếm, không in mã; một mã trỏ
  hai nút bị chỉ mục duy nhất `registry_aliases_ma_nguon_uq` của DB từ chối ngay lúc ghi.
- AC-6: Given dự án S08 nối ở bảng tay hay ở bảng luật, vào nút có sẵn hay nút ứng viên, When màn `/ops/registry` đọc danh bạ, Then
  chân ô «Mã nguồn chưa nối» hiện cho S08 hai số tách nhau — chưa nối / đã nạp, và số đã nối vào nút ứng viên; dự án nối ở hai bảng
  đếm một lần; danh sách chưa nối không chứa dự án đã nối ở bảng nào và mang lý do của bảng luật.
- AC-7: Given bản chép DB máy thu, When chạy trọn chuỗi thẻ, áp, kiểm, đo, đảo, Then:
  - mỗi ngả của thẻ bằng đúng số đếm lại của bảng phủ trên cùng bản chép (22/11: giữ tay 8, nối nút có sẵn 9, thẻ từng cặp 0, đúc 163
    dự án vào 158 nút, khong-tinh 4, du-an-con 1);
  - đọc bằng `docDanhBa` của app: S08 nối vào nút đã xác minh 8 → 14, vào nút ứng viên (mọi nút `mot_loi_khai`, kể cả nút S06 đúc) 0 → 166,
    chưa nối 177 → 5;
  - dòng `asset_nodes` có sẵn và `s08_project_links` không đổi qua áp và đảo; nút ứng viên S08 có 0 tin gắn và 0 hạng giá cấp dự án;
  - băm thẻ nối DA53 và ba số của bộ gắn PL20 (gắn, xung đột, «chữ và model khác nút») bằng nhau trước và sau áp;
  - nút ứng viên S09 cấy cùng tên, chưa biết tỉnh, trước lượt thì dự án đó ra thẻ từng cặp, không đúc; sau đảo ba ô về số trước áp.

## Coverage

Bảng phủ ca đếm trên DB máy thu ở design doc §2. Trục và ca:

- Ngả: giữ tay, giữ nút đúc, tên rỗng, hậu tố khu, không tỉnh, trùng hẳn một nút, gần giống, nhiều nút, nút chưa biết tỉnh, khác tỉnh, nút ứng viên nguồn khác, đúc, gom TT/TMDV → AC-1
- Thẻ: tổng, mẫu, không lộ mã, băm ổn định, chỉ đọc → AC-2
- Áp: băm lệch, băm đúng, nút có sẵn không đổi, bảng tay không đổi, lần hai → AC-3; đảo → AC-4; ba bất biến → AC-5
- Bên đọc: màn Ops đếm hai bảng, tách nút có sẵn với nút ứng viên → AC-6
- Thứ tự nguồn với S09 (DA42), băm DA53, bộ gắn PL20, tin không gắn vào nút ứng viên → AC-7
- Dữ liệu thật: bảng phủ, ô trên màn, vân tay, đảo → AC-7

## Đường đo

- Chân ô «Mã nguồn chưa nối» ở `/ops/registry`, phần S08 (`SQL_DANH_MUC` của `app/src/lib/ops/registry/doc.ts`, `oSo` của
  `registry-view.tsx`): `cd app && node --import tsx ../pipeline/scripts/noi-du-an-s08-that.mjs` trên bản chép DB máy thu, đọc bằng
  `docDanhBa`. Ô đổi: nối nút đã xác minh 8 → 14, nối nút ứng viên 0 → 166, chưa nối 177 → 5. AC-6, AC-7 bảo đảm.
- Sau khi áp trên máy thu: sáng hôm sau đếm chỉ đọc trên cloud số nút `meta.nguon = 'S08'` (design doc §7 bước 5).

## Out of scope

- Đúc toà, trục, căn từ dự án S08 mới nối: ngoài phạm vi, vì `danh-ba-vat-the.mjs` đổi cây toà ở nhiều khu, kể cả hai khu của lát PL20; hàng sau.
- Dự án con có hậu tố khu (1 dự án): ngoài phạm vi, vì Q-A 17/11 cần bước đúc nút con riêng; thẻ ghi «du-an-con».
- Chuyển 8 dòng tay DN1 sang bảng luật: ngoài phạm vi, vì ô trên màn đã đếm hai bảng và lượt dựng vật thể đang đọc bảng tay.
- Ghép chéo dự án S08 với S07, S16: ngoài phạm vi, vì lớp hợp nhất nguồn 19/11 chưa cắt hàng; với S09 chỉ giữ «không đúc nút thứ hai» (AC-1, AC-7).
- Nối tin vào nút ứng viên và đưa nút ứng viên lên Invest: ngoài phạm vi, như DA42; AC-7 đo 0 tin gắn.
- Thẻ `review_queue` cho ca thẻ từng cặp: ngoài phạm vi, hôm nay 0 ca; ca nằm ở thẻ luật và dòng `chua_noi`.
- Áp lên DB máy thu: ngoài phạm vi của mã, cần lời riêng của Mạnh kèm băm (design doc §7).

## Notes

- Áp lên DB máy thu cần lời riêng của Mạnh kèm băm thẻ; hồ sơ áp năm thứ ở design doc §7.
- Thứ tự áp: PL20 qua Cổng Bằng chứng → DA53 → DA55, trừ khi E7 cho thấy băm DA53 và bộ gắn PL20 không đổi (design doc §7).
- Thẻ chỉ thêm nút mới, dòng nối và bí danh ở `registry_aliases`; không đổi dòng `asset_nodes` có sẵn ở Grand Park, Ocean Park (AC-3, AC-7).
- Nút đúc lên cloud theo lượt đồng bộ `asset_nodes` đêm, như nút S06 của DA32; meta chỉ mang nguồn, mã lượt, điểm bản đồ.
