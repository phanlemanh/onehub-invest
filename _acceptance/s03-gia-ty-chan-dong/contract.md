---
schema_version: 1
feature: Giá tỷ chẵn viết bằng đồng («3.000.000.000 đ») không bị bước gạt SĐT của transform S03 nuốt mất
slug: s03-gia-ty-chan-dong
owner: phanlemanh@gmail.com
risk_tier: T2      # máy suy: pipeline/transform-zalo.mjs — không khớp t3_paths
surfaces: [cli]
status: signed-off
veto_state: mo
veto_opened_at: 2026-10-30T02:52:00Z
approved_by:
approved_at:
design_doc: docs/superpowers/specs/2026-10-30-s03-gia-ty-chan-dong-design.md
---

# Acceptance Contract: s03-gia-ty-chan-dong

## Context

Bước gạt SĐT `gatSo` của `pipeline/transform-zalo.mjs` (N1) coi đuôi «000.000.000» của số tiền là một SĐT, nên tin ghi
giá tròn tỷ bằng chữ số đồng ra giá null. Nguồn: Ngoài-8 vòng 3 của `_acceptance/s03-cam-mau-so-lieu`, Mạnh chọn «mở
hợp đồng mới» (30/10). Đo 30/10 trên bài thật: 150 bài có giá đồng, 0 bài đang bị lỗi này.

## Acceptance criteria

- AC-1: Given ma trận viết trước gồm giá tỷ chẵn viết bằng đồng («Bán nhà giá 3.000.000.000 đ, 50m2», «Bán
  15.000.000.000», «Bán căn 2.000.000.000đ», «Bán căn giá 10.000.000.000 VNĐ», «Bán đất 1.000.000.000») và các dạng đã
  đọc đúng («Bán căn 4.200.000.000», «Bán căn 1.500.000.000 VNĐ», «Giá thuê: 7.000.000»), When `parsePost` đọc, Then mỗi
  dòng ra đúng số đồng của đáp án.
- AC-2: Given ma trận viết trước gồm SĐT liền, chấm, cách đứng sau dấu chấm hay phẩy câu và trước «T.Lan» («Cho thuê 2PN
  9tr, liên hệ.0901234567 T.Lan», «…liên hệ.0901.234.567 T.Lan», «…liên hệ.0901 234 567 T.Lan», «…LH,0901234567 T.Lan»),
  SĐT nối SĐT («…LH 0901234567,0912345678 T.Lan», «…LH 0901234567.0912 345 678 T.Lan») và SĐT sau «m2,» («Cho thuê 50m2,0901234567
  T.Lan 9tr»), When `parsePost` đọc, Then giá là 9 triệu (mọi SĐT vẫn bị gạt khỏi bước đọc số).
- AC-3: Given năm dòng giá tỷ chẵn của AC-1 và bảy dòng của AC-2, When `extractPhones` đọc chữ gốc, Then năm dòng giá tỷ chẵn
  ra mảng rỗng, dòng SĐT nối SĐT ra cả hai số, các dòng AC-2 còn lại ra `["0901234567"]` — danh sách SĐT không đổi so với
  trước sửa.
- AC-4: Given giá đồng mới đọc được ở tin phi lý («Bán biệt thự 150.000.000.000», «Cho thuê nhà 1.000.000.000/tháng»),
  When qua chốt khoảng giá `lyDoGiaPhiLy`, Then ra `ban-tren-100-ty` và `thue-tu-1-ty`.
- AC-5: Given cây sau sửa, When chạy bộ test pipeline và phép đo N1 trên bản chép dữ liệu thật (DB thử), Then tất cả
  xanh, bảy thước của N1 vẫn ĐẠT. (cross-layer)
- AC-6: Given toàn bộ bài S03 thật (chỉ đọc), When so đầu ra `parsePost` của bản nền ghim `ecaf5ff0` với bản cây, Then số
  bài đổi danh sách SĐT là 0 và mọi bài đổi giá đều mang dạng giá tỷ chẵn viết bằng đồng (ngoài dạng ấy: 0). (cross-layer)

## Coverage

- Trục A — dạng giá đồng: tỷ chẵn có/không «đ», «VNĐ» | đã đọc đúng trước đây (không lùi) [thước CE: bảng trong design
  doc; AC-1]
- Trục B — SĐT trước số đọc: liền | chấm | cách | sau dấu chấm câu | sau dấu phẩy câu | nối SĐT bằng phẩy/chấm | sau «m2,» [AC-2, AC-3]
- Trục C — đường sau đọc: chốt khoảng giá [AC-4] · dữ liệu thật không lùi [AC-5, AC-6]

## Out of scope

- Hai lỗi giá đã ghi Known limits ở N1 («7.000.000/mỗi tháng» mất giá; tin có cả tổng giá lẫn đơn giá bằng đồng mất tổng
  giá) — khác gốc.
- Đổi cách làm luật giá (bỏ vá regex), nạp lại S03 thật (bước triển khai sau gộp).
- Giá nhóm nghìn bằng dấu cách («3 000 000 000 đ») — ngưỡng của ô cơ hội áp cho dạng nhóm bằng dấu chấm.

## Đường đo

- «Không còn dòng giá tỷ chẵn ra null» ← ma trận AC-1 (ca thử thuần); «không lùi trên dữ liệu thật» ← AC-5 (phép đo N1
  trên DB thử). Dữ liệu thật hôm nay có 0 bài thuộc dạng lỗi, nên không có thước «trước → sau» trên bài thật.

## Notes

- Known limits — chọn ở Cổng Bằng chứng 2026-10-30:
  - Ngoài-1: Thẻ Cổng Phạm vi và sổ quyết định còn câu «không có thước trước → sau trên bài thật», trong khi AC-6 chính là thước đó.
  - Ngoài-2: Phép so trên bài thật của AC-6 chỉ so giá và SĐT, không so diện tích, số phòng ngủ hay các trường khác cũng đọc từ chữ đã gạt.
  - Ngoài-4: Phép so AC-6 vẫn in ĐẠT khi DB rỗng hoặc trỏ nhầm; người đọc phải tự xem số bài đã so.
  - Ngoài-5: Nhãn «giá tỷ chẵn» của phép so AC-6 hẹp hơn điều bước gạt SĐT thực sự giữ lại, nên có thể báo trượt giả.
  - Ngoài-6: Nhãn «giá tỷ chẵn» của AC-6 chỉ kiểm bài có chứa một số tỷ chẵn, chưa chứng giá đổi chính vì số ấy.
  - Ngoài-7: AC-6 hứa so đầu ra đọc tin nhưng chỉ so giá, đơn giá và SĐT.
