---
schema_version: 1
feature: Mỗi dự án của năm nguồn danh mục (S07, S08, S09, S10, S16) thành một bản ghi chuẩn theo khuôn chung; bộ khớp chạy bóng xếp từng bản ghi vào một ngả căn cứ; ngả rõ (điểm gần + trùng tên, cùng xã + trùng tên, trùng tên đúng một nút cùng tỉnh) của S07, S16 nối vào nút danh bạ có sẵn qua thẻ luật có băm, đảo được; S09 chỉ đọc đường nối của DA42; ô «Mã nguồn chưa nối» trên Ops đếm đủ các nguồn
slug: bang-noi-ma-du-an
owner: phanlemanh@gmail.com
risk_tier: T3      # hàng khai T3: ghi dữ liệu nối trên DB máy thu
surfaces: [cli, ui]
status: implemented
approved_by: Mạnh
approved_at: 2026-11-28
design_doc: docs/superpowers/specs/2026-11-25-bang-noi-ma-du-an-design.md
---

# Acceptance Contract: bang-noi-ma-du-an

## Context

Hàng DA3 (T3), đứng trên DA2, DA30, DA32 (đã ký). GS phán 25/11 cắt lại hàng: DA3 là bước 1 cấp dự án của lớp hợp nhất nguồn
danh bạ (Mạnh 19/11 «duyệt theo loại căn cứ»). Bản nháp 13/11 bỏ. Thẻ từng cặp tách thành DA60, gộp bảng nối thành DA61, đúc nút
liên nguồn thành DA62.

**Phạm vi đổi 27/11** (sổ d-20261127T213940Z-36, GS phán khung cắt). Hợp đồng Mạnh duyệt 25/11 dựng trên danh bạ 344 nút, không
nút nào có điểm. Tối 27/11 DA42 và DA55 đã áp lên DB máy thu:

- danh bạ nay 660 nút dự án: S08 đúc 146 nút ứng viên có điểm, DA42 đúc 170 nút ứng viên S09;
- DA42 nối 172 dự án S09 vào `project_links` (thẻ luật S09 khoan tới DA66);
- DA55 áp luật 5, nối 177 mã S08.

Vì vậy S09 rút khỏi đường ghi của DA3, chỉ còn đọc để hiện; K2 nay bắn. Mọi số dưới đây là số đo lại 27/11 21:34Z, chỉ đọc trên DB
máy thu: bộ đo đóng băng `probes/s1/do.mjs` và thẻ chỉ đọc của mã DA3. Chi tiết ở `evidence/bang-phu-s1.md` §8.

Trước DA3, ô «Mã nguồn chưa nối» trên main ghi 370: S06 8, S08 18, S09 344. Ô chỉ đếm S06, S08, S09. S09 còn ghi 344 dù DA42 đã
nối 172. S07, S10, S16 không có trong ô.

## Acceptance Criteria

- **AC-1** Given bản chép DB máy thu, When chạy bộ chuyển của năm nguồn, Then:
  - Mỗi bản ghi ra đủ các trường của khuôn chung (thiết kế §3.1); trường nguồn không có thì là null.
  - Số bản ghi và số có tỉnh, xã, điểm của từng nguồn bằng phép đếm SQL độc lập trên cùng bản chép. Số đếm 25/11, đo lại 27/11
    không đổi: S07 6.074, S08 185, S09 344, S10 119, S16 20.
  - S10 có tỉnh null kèm lý do `khong-vi-tri`.
  - Tên tỉnh cũ trong địa chỉ đổi ra mã tỉnh cũ qua bảng 63 tỉnh trước sáp nhập, rồi ra tỉnh mới qua `area_aliases`
    (`old_province_code` → `province_code`). Bỏ các dòng alias của mã ấy ở DB thử thì tỉnh ra null, không ra tỉnh khác.
  - Ma trận rỗng giả viết trước gồm 10 ô (Hỏi-2 cũ, Mạnh duyệt 25/11).
    - 6 ô về null: "", «Đang cập nhật», «--», «-», «0», «N/A».
    - 4 ô giữ nguyên làm đối chứng dương: «Khác», «Liên hệ», «Vinhomes», «0 m2».
    - Trên dữ liệu 25/11, quy ước này đổi 0 bản ghi.
- **AC-2** Given ma trận ca viết trước, When hàm xếp ngả quyết một bản ghi, Then mỗi ô ra đúng một kết cục viết trước.
  - Các ô: đã nối, tên rỗng giả, không tỉnh, K1, K2 (điểm ≤ 300 m và tên trùng, như thiết kế §3.2 và mã; Hỏi-1), K3, T, hai nút,
    khác tỉnh, nút ứng viên nguồn khác (Hỏi-2), còn lại.
  - Tên trùng nhưng điểm cách hơn 300 m thì không ra K2.
  - Kết cục có dạng `giu`, `noi:K2`, `noi:K3`, `chua_noi:nhieu-nut`, `chua_noi:khong-khop`, …
  - Nút khác tỉnh không bao giờ là ứng viên. Hai nút không bao giờ ra nối. Điểm gần mà tên khác không bao giờ ra nối.
  - Chiều đỏ: bản bỏ điều kiện cùng tỉnh thì ca khác tỉnh đỏ.
- **AC-3** Given DB, When dựng thẻ của một nguồn hai lần, Then:
  - Thẻ có tổng theo ngả và danh sách bản ghi mà bóng ra nút khác nối có sẵn.
  - Mẫu tách theo căn cứ × hạng và nguồn đúc của nút đích (xác minh · ứng viên S06 · ứng viên S08 · …), tối đa 20 mẫu mỗi ô, kèm
    số đếm của từng ô (Hỏi-2).
  - Thẻ không in mã dự án nguồn. Hai lần cùng một băm, và không ghi gì vào DB.
  - Băm đổi khi kết cục, nút đích hay căn cứ của một bản ghi đổi.
- **AC-4** Given thẻ và băm của S07 hoặc S16, When áp, Then:
  - Băm lệch thì không ghi gì.
  - Băm đúng thì, trong một giao dịch:
    - ghi một dòng `project_link_rules` cho mỗi loại căn cứ có nối (`<nguồn>-K2`, `<nguồn>-K3`, `<nguồn>-T`), một dòng cho nối có
      sẵn (`<nguồn>-noi-san`) và một dòng cho trạng thái chưa nối (`<nguồn>-trang-thai`);
    - ghi mỗi bản ghi một dòng `project_links` mang `rule_id` của lượt (`noi` kèm căn cứ, hoặc `chua_noi` kèm lý do);
    - ghi mỗi dòng nối một bí danh `node:<id>` kind `ma_nguon`, giá trị `du_an/<mã>`.
  - Dòng `asset_nodes` (kể cả hạng `catalog_tier` của nút ứng viên), `s08_project_links`, `s10_project_links`, mọi dòng
    `project_links` nguồn S08, S09 và bí danh có sẵn không đổi một byte.
  - Áp lần hai không đổi gì.
- **AC-5** Given một lượt đã áp, When đảo theo mã luật, Then:
  - Bí danh của luật nghỉ (`retired_at`, không xoá dòng). Dòng về `chua_noi` lý do `dao-luat`. Dòng luật ghi người và giờ đảo.
  - Đảo lần hai báo «đã đảo», không ghi. Dòng của luật khác cùng nguồn không đổi.
  - Đảo đủ mọi luật của một nguồn là cách lùi trọn: nguồn ấy không còn dòng `noi` nào, mọi bí danh của lượt có `retired_at`, số dòng
    các bảng không giảm (không xoá dòng nào), băm có sắp xếp của bí danh còn hiệu lực bằng trước áp.
- **AC-6** Given dự án đã nối từ trước (S16 chép cứng 5; S08 bảng tay và thẻ DA55; S09 đường nối của DA42), When chạy bộ khớp,
  Then:
  - Nối có sẵn của S16 luôn thắng: dòng ghi `noi` căn cứ `S16-noi-san`.
  - Bóng ra nút khác thì ghi vào danh sách «khác nối sẵn» trên thẻ, không ghi đè.
  - Gọi lệnh áp cho S08 thì bị từ chối kèm lời «S08 do thẻ luật DA55 nối», không ghi.
  - Gọi lệnh áp cho S09 thì bị từ chối kèm lời «S09 do DA42 nối», không ghi.
  - Thẻ S08 chạy bóng đối chiếu: liệt 6 ca khác do quy ước dự án con có cha (ROADMAP §3 mục 39).
- **AC-7** (cross-layer) Given bản chép DB máy thu, When áp rồi đảo ba nguồn S07, S10, S16, Then đầu ra của các bên đọc bằng nhau
  trước áp, sau áp và sau đảo.
  - Bên đọc bí danh nguồn: bộ dùng S09 (`s09-dung.mjs`), bộ dùng S16 (`napS16TheoKhu`), bản đồ bí danh mà `danh-ba-vat-the.mjs`
    đọc.
  - Năm view: `v_toa_nut_vung`, `offer_building`, `s06_offer_project`, `v_s16_toa`, `v_s09_toa`.
  - Phép so là băm đầu ra có sắp xếp. Chiều đỏ: cấy một bí danh `ma_nguon` S09 dạng toà thì phép so của bộ dùng S09 đỏ.
- **AC-8** (cross-layer) Given dự án S07, S16 nối ở `project_links`, S09 nối bởi DA42 và S10 chưa nối lý do `khong-vi-tri`, When màn
  `/ops/registry` đọc danh bạ (`docDanhBa`) và dựng ô (`registry-view.tsx`), Then:
  - Ô «Mã nguồn chưa nối» đếm thêm S07, S16.
  - S09 lấy tập dự án của DA42 (`v_s09_db_du_an`) và số đã nối từ `project_links` S09, không còn hằng 0.
  - Mã S09 chỉ có ở tập cũ `v_s09_du_an_moi` hiện một dòng riêng, nhãn «chưa có ở danh bạ S09 mới», không cộng vào ô (Hỏi-3).
  - S10 hiện riêng kèm lý do «không có vị trí». Mỗi dự án đếm một lần.
  - Danh sách chưa nối mang lý do của `project_links`. Dự án S08, S06 đếm như trước.
  - Con số ô dựng ra trên màn bằng tổng chưa nối của S06, S07, S08, S09, S16. Ô không cộng dòng S10, cũng không cộng dòng S09
    tập cũ.
- **AC-9** (cross-layer) Given bản chép DB máy thu, When chạy trọn chuỗi thẻ, áp, kiểm, đo, đảo cho S07, S10, S16, Then:
  - Mỗi ngả của thẻ bằng phép đếm của bộ đo S1 đóng băng (`probes/s1/do.mjs`, đếm độc lập với mã của hàng) trên cùng bản chép, in hai
    cột kèm hiệu số. Ngả K4 của bộ đo tính vào «không khớp» của thẻ (K4 ngoài phạm vi). Dòng `giu` của thẻ đối chiếu với ngả bóng
    của chính bản ghi ấy. Số 27/11:
    - S07: K2 11, K3 62, T 274, nhiều nút 1, không tỉnh 7, không khớp 5.719 (bộ đo: 5.717 + K4 2);
    - S16: giữ 5, K2 1, K3 2, T 1, không khớp 11 (bộ đo: K2 1, K3 6, T 2, không khớp 11);
    - S10: không tỉnh 119.
  - Ô tính bằng đúng phép cộng của `registry-view.tsx` trên đầu ra `docDanhBa` của app (không cộng S10, S09 tập cũ), báo hai hiệu
    ứng tách nhau:
    - đổi phạm vi đếm: thêm S07 6.074, S16 20 chưa nối; S09 đọc tập DA42, 344 → 49; ô 370 → 6.169;
    - nối thêm: S07 6.074 → 5.727, S16 20 → 11; ô 6.169 → 5.813.
  - Sau khi đảo đủ mọi luật của S07, S16, ô về cột đổi phạm vi (6.169).

## Coverage

Bảng phủ ca đếm trên DB máy thu nằm ở `evidence/bang-phu-s1.md`; số 27/11 ở §8; trục và cột «ai đọc» ở thiết kế §2.

- Nguồn × trường: S07, S08, S09, S10, S16 × tên, tỉnh, xã, điểm, CĐT, MST, loại hình, mã cha; tỉnh cũ; rỗng giả → AC-1
- Ngả căn cứ: đã nối, tên rỗng, không tỉnh, K1, K2, K3, T, nhiều nút, khác tỉnh, nút ứng viên nguồn khác, không khớp → AC-2
- Hạng nút đích: xác minh, ứng viên S06, ứng viên S08; nút ứng viên S09 (0 bản ghi trúng) → AC-3, AC-9
- Vòng đời: thẻ, áp, áp lần hai, băm lệch, đảo, đảo lần hai, lùi trọn → AC-3, AC-4, AC-5
- Nối có sẵn: chép cứng S16; S08 thuộc DA55; S09 thuộc DA42; lệch dự án con có cha → AC-6
- Bên đọc: bộ dùng S09, S16, dựng vật thể, năm view, màn (đọc và cộng ô) → AC-7, AC-8
- Dữ liệu thật: bảng phủ, ô trên màn tách hai hiệu ứng, đảo → AC-9

## Đường đo

- Ô «Mã nguồn chưa nối» ở `/ops/registry`, đọc bằng `SQL_DANH_MUC` của `app/src/lib/ops/registry/doc.ts`, đo bằng `docDanhBa`
  trên bản chép DB máy thu. Hai hiệu ứng tách nhau, số ở AC-9; AC-8 và AC-9 bảo đảm.
  - Số 27/11 trên DB máy thu, chỉ đọc:
    - main: ô 370.
    - Mã nhánh 6915541e5 trước áp: các dòng `docDanhBa` cộng 6.484, gồm S06 8, S08 18, S07 6.074, S16 20, S09 245 (tập 344 trừ dòng
      nối khớp mã) và S10 119. Bỏ S10 thì ô là 6.365.
    - Theo AC-8 bản 27/11: S09 49, ô 6.169.
- Sau khi áp trên DB máy thu: đếm `project_links` theo nguồn × trạng thái, và đọc lại ô trên màn Ops máy thu.

Ngưỡng SỐNG gốc của `opportunity.md` (09/11, phạm vi cũ), đối chiếu với phạm vi cắt lại ngày 25/11:

| Ngưỡng gốc | Đường đo hôm nay |
|---|---|
| 8 cặp S08 đã nối hiện trong bảng mới, view thay `s08_project_links` trả đúng 8 dòng | DA61 |
| Duyệt một cặp sinh đúng một bí danh `node:<id>`; hoàn tác 5 giây khôi phục | DA60 (thẻ từng cặp) |
| Thẻ luật duyệt loạt có nhật ký và đảo được | AC-4, AC-5 |
| `registry_aliases.kind` nhận thêm `ma_nha_nuoc` | bỏ — nguồn nhà nước chưa có dữ liệu nạp |
| Khuôn chung bản ghi nguồn có bộ chuyển cho mọi nguồn danh mục đã có `stg_*` | AC-1 (S07, S08, S09, S10, S16) |
| `registry_aliases`, `registry_events` nhận nút dự án và nguồn S10–S15 | đã xong ở migration 100, 103 |
| Bản ghi S11 cấp lô của Ocean Park 1 nối được qua thẻ từng cặp | bỏ — S11 chưa có bảng `stg_*`; khi có thì đi DA60 |
| Giá trị rỗng giả về trống theo một quy ước | AC-1 |
| 27 dự án S08 mới có trạng thái nối | DA55 |

## Out of scope

- Ghi S09: ngoài phạm vi, vì DA42 sở hữu đường nối S09 và thẻ luật S09 khoan tới DA66 (GS phán 27/11). DA3 chỉ đọc
  `project_links` S09 để hiện. Mã phần S09 trên nhánh gỡ sau khi Mạnh duyệt phạm vi này.
- Hợp hai tập mã S09 thành một danh mục: ngoài phạm vi, vì việc đó thuộc đường S09 của DA42, DA66. Hai tập là DA42
  `v_s09_db_du_an` 221 dự án và tập cũ `v_s09_du_an_moi` 344 dự án; chung 112 mã, 232 mã chỉ có ở tập cũ, 109 mã chỉ có ở DA42.
  DA3 chỉ quyết cách HIỆN hai tập trên ô (Hỏi-3).
- Đúc nút mới cho bản ghi không khớp (S07 5.719, S08 22, S16 11): ngoài phạm vi, vì DA62 là nơi Mạnh quyết câu «tự nuôi» và
  cỡ nút.
- Nâng hạng nút ứng viên khi có lời khai thứ hai (nối không đổi `catalog_tier`): ngoài phạm vi, vì là DA62.
- Thẻ từng cặp trên `/ops/review` cho ca không rõ (nhiều nút; K4): ngoài phạm vi, vì là DA60 (migration 133). Cỡ của DA60 đo
  bằng số ca DA3 để lại.
- K4 (điểm ≤ 1 km + tên trùng một phần): ngoài phạm vi, vì chưa có mã, chỉ 3 ca (S07 2, S09 1); đi DA60 (Hỏi-1).
- Gộp `s08_project_links`, `s10_project_links` thành view trên `project_links`: ngoài phạm vi, vì đổi lược đồ khó đảo nên đi riêng
  ở DA61.
- kind `ma_nha_nuoc`: ngoài phạm vi, vì nguồn nhà nước chưa có dữ liệu nạp.
- Tìm tỉnh cho S10: ngoài phạm vi, vì nguồn không có địa chỉ, điểm hay tỉnh. Ghi «không tỉnh 119/119, chờ nguồn có vị trí».
- Ghi S08: ngoài phạm vi, vì DA55 sở hữu thẻ luật S08; DA3 chỉ chạy bóng đối chiếu. Bóng S08 K2 150 là nút S08 tự trùng với
  chính nút DA55 vừa đúc, không phải việc của DA3.
- Sửa bộ khớp nhận quy ước dự án con có cha: ngoài phạm vi, vì DA3 không ghi S08 nên 6 ca lệch không ảnh hưởng dữ liệu; thẻ liệt kê
  đủ 6 ca.
- Chuyển S16 khỏi chép cứng sang đường chung (bước 3 bản 19/11), S11 (chưa có bảng `stg_*`), nút «Duyệt cả loạt» trên màn:
  ngoài phạm vi, GS đồng ý 25/11.
- Áp lên DB máy thu: ngoài phạm vi của mã. Chữ ký Cổng Bằng chứng phủ việc áp khi hồ sơ áp đủ năm thứ (thiết kế §4).

## Notes

- Không migration: `project_links`, `project_link_rules`, `registry_aliases` của 100 và 103 đủ cột.
- `app/src/lib/ops/registry/doc.ts` và `app/src/components/ops/registry/registry-view.tsx` từng nằm trong ranh giới DA55. DA55 đã
  gộp main (#558); nhánh DA3 gộp main 27/11 ở 6915541e5.
- Ngưỡng SỐNG của bản cắt 27/11: ô «Mã nguồn chưa nối» báo tách hai hiệu ứng như AC-9, gồm:
  - nối thêm S07 347 (K2 11, K3 62, T 274);
  - nối thêm S16 9 (5 giữ, 4 mới).
  CHẾT khi bộ khớp nối nhầm qua mẫu E10, hoặc khi một bên đọc đổi đầu ra (AC-7).
- Cách lùi trên DB máy thu là đảo đủ mọi luật của nguồn (AC-5); không xoá dòng nào.
- Nguồn đứng: S07, S10 thu lần cuối 11/11; S09 và phần dự án của S16 thu lần cuối 13/11. Số trong thẻ là số của snapshot đang có.
- Ba câu hỏi của bản 27/11 nằm ở sổ: Hỏi-1 (K2), Hỏi-2 (nút ứng viên), Hỏi-3 (hai tập S09). Hợp đồng viết theo lối khuyến nghị.
  Lối khác của từng câu đổi AC như bảng dưới; mọi lối khác đều giữ nguyên số «đổi phạm vi».

  | Câu · lối | AC-2, E2 | AC-3, E3 | AC-9: S07 · S16 · ô sau nối |
  |---|---|---|---|
  | Khuyến nghị (cả ba) | K2 300 m → `noi:K2`; ứng viên nguồn khác → `noi:T` | mẫu theo căn cứ × hạng × nguồn đúc | 5.727 · 11 · 5.813 |
  | Hỏi-1 khác: K2 sang DA60 | ô K2 → `chua_noi:khong-khop` | không có ô K2 | 5.738 · 12 · 5.825 |
  | Hỏi-2 khác: chỉ nút xác minh | ô ứng viên → `chua_noi:ung-vien`; K2 không bắn (mọi K2 vào nút ứng viên) | chỉ ô xác minh | 6.062 · 15 · 6.152 |
  | Hỏi-3 khác A: chỉ tập DA42 | không đổi | không đổi | không đổi; mất dòng S09 tập cũ (232) |
  | Hỏi-3 khác B: hợp hai tập | không đổi | không đổi | S09 chưa nối 281; ô đổi phạm vi 6.401, sau nối 6.045 |
