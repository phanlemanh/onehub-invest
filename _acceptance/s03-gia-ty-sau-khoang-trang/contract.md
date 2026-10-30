---
schema_version: 1
feature: Giá tỷ viết bằng đồng mà ngay sau là khoảng trắng/xuống dòng rồi số 1–2 chữ số («3.000.000.000\n50m2») không bị bước gạt SĐT của transform S03 nuốt mất
slug: s03-gia-ty-sau-khoang-trang
owner: phanlemanh@gmail.com
risk_tier: T2      # máy suy: pipeline/transform-zalo.mjs — không khớp t3_paths
surfaces: [cli]
status: implemented
veto_state: mo
veto_opened_at: 2026-10-30T04:03:33Z
approved_by:
approved_at:
design_doc: docs/superpowers/specs/2026-10-30-s03-gia-ty-sau-khoang-trang-design.md
---

# Acceptance Contract: s03-gia-ty-sau-khoang-trang

## Context

Bước gạt SĐT `gatSo` của `pipeline/transform-zalo.mjs` (sau `s03-gia-ty-chan-dong`) bỏ qua đuôi nhóm nghìn của số tiền,
nhưng khi ngay sau giá là một ký tự cách rồi số 1–2 chữ số, regex SĐT kéo khớp sang số đó và cả cụm bị gạt: tin mất
giá và mất luôn số đứng sau. Nguồn: Ngoài-3 của `_acceptance/s03-gia-ty-chan-dong`, Mạnh chọn «mở hợp đồng mới» (30/10).
Đo 30/10 trên bài thật: 0 bài đang dính.

## Acceptance criteria

- AC-1: Given ma trận viết trước gồm giá viết bằng đồng có khoảng trắng/xuống dòng + 1–2 chữ số ngay sau («Bán nhà
  3.000.000.000\n50m2», «Bán 2.000.000.000 2PN», «Bán căn 1.050.000.000\n60m2», «Bán nhà 3.000.000.000 50m2», «Bán căn
  15.000.000.000\n5 tầng») và các dạng đã đọc đúng («Bán căn 3.000.000.000 đ, 50m2», «Bán căn 4.200.000.000»,
  «Giá thuê: 7.000.000»), When `parsePost` đọc, Then mỗi dòng ra đúng số đồng của đáp án, và ở các dòng có diện tích hay
  số phòng ngủ đứng sau giá thì trường ấy ra đúng (50, 2, 60, 50).
- AC-2: Given ma trận viết trước gồm bảy dòng SĐT của `s03-gia-ty-chan-dong` AC-2 (SĐT sau dấu chấm/phẩy câu, SĐT nối SĐT,
  SĐT sau «m2,») và ba dòng SĐT đứng ngay sau «chữ số + dấu chấm» có đuôi khoảng trắng + chữ số («Cho thuê 50m2.0912.345.678 9
  T.Lan 9tr», «Cho thuê 9tr 50m2.098.765.000 1 T.Lan», «Cho thuê 9tr LH 2.098.765.432 1 T.Lan»), When `parsePost` đọc, Then giá là 9 triệu (mọi SĐT vẫn bị gạt khỏi bước
  đọc số).
- AC-3: Given năm dòng giá của AC-1 và mười dòng SĐT của AC-2, When `extractPhones` của bản cây và của bản nền ghim
  `ec899d03` cùng đọc chữ gốc, Then mỗi dòng ra cùng một mảng SĐT — danh sách SĐT không đổi so với trước sửa.
- AC-4: Given giá đồng mới đọc được ở tin phi lý («Bán biệt thự 150.000.000.000 2PN», «Cho thuê nhà 1.000.000.000 1 tháng»),
  When qua chốt khoảng giá `lyDoGiaPhiLy`, Then ra `ban-tren-100-ty` và `thue-tu-1-ty`.
- AC-5: Given cây sau sửa, When chạy bộ test pipeline và phép đo N1 trên bản chép dữ liệu thật (DB thử), Then tất cả
  xanh (kể cả ma trận `s03-gia-ty-chan-dong`), bảy thước của N1 vẫn ĐẠT. (cross-layer)
- AC-6: Given toàn bộ bài S03 thật (chỉ đọc), When so TOÀN BỘ đầu ra `parsePost` của bản nền ghim `ec899d03` với bản cây,
  Then đã so ít nhất một bài, số bài đổi danh sách SĐT là 0, và mọi bài đổi đầu ra đều chứa dạng «số tiền nhóm nghìn +
  ký tự cách + 1–2 chữ số» với giá mới bằng đúng giá trị số tiền ấy (ngoài quan hệ ấy: 0). (cross-layer)

## Coverage

- Trục A — dạng giá: nhóm nghìn + (khoảng trắng | xuống dòng) + 1–2 chữ số | đã đọc đúng trước đây (không lùi) [bảng
  trong design doc; AC-1]
- Trục B — SĐT trước số đọc: dạng vòng trước (sau dấu câu, nối SĐT, sau «m2,») | sau «chữ số + dấu chấm» có đuôi khoảng
  trắng + chữ số: nhóm 4-3-3 | 3-3-3 nhóm cuối «000» dính chữ | 3-3-3 nhóm cuối khác «000» [AC-2, AC-3]
- Trục C — đường sau đọc: chốt khoảng giá [AC-4] · dữ liệu thật không lùi [AC-5, AC-6]
- Bỏ quét hình thái: xem dòng sổ `descope` «bỏ coverage-scan».

## Out of scope

- `extractPhones` nhận nhầm «050.000.000\n60» (trong «1.050.000.000\n60m2») thành một SĐT 11 số — lỗi có sẵn của danh sách
  SĐT người bán, cùng gốc regex nhưng sửa là đổi danh sách SĐT; để việc riêng.
- Gạch hay dấu chấm làm ký tự cách đuôi («Bán căn 3.000.000.000-3.500.000.000» — khớp SĐT «000.000.000-3»;
  «1.000.000.000.2PN») — ô cơ hội chỉ đặt ngưỡng cho khoảng trắng/xuống dòng; giữ nguyên như trước vòng.
- Giá nhóm nghìn bằng dấu phẩy hay dấu cách («3,000,000,000», «3 000 000 000 đ») — luật giá đồng, không phải bước gạt SĐT.
- Hai lỗi giá N1 đã ghi Known limits («/mỗi tháng»; tổng giá + đơn giá bằng đồng); đổi cách làm luật giá; nạp lại S03
  thật (bước triển khai sau gộp).
- SĐT viết 3-3-3 có nhóm cuối «000» kèm khoảng trắng + 1–2 chữ số, đứng ngay sau một số đứng riêng và dấu chấm («… 2.098.765.000
  1») — không phân biệt được với số tiền bằng chữ; hẹp hơn dạng SĐT 3-3-3 đứng sau «chữ số + dấu chấm» mà khuôn
  `s03-gia-ty-chan-dong` đã ký vẫn giữ lại.

## Đường đo

- «Không còn dòng thuộc dạng này ra null» ← ma trận AC-1 (ca thử thuần); «SĐT thật vẫn bị gạt» ← AC-2, AC-3; «không lùi
  trên dữ liệu thật» ← AC-5 (phép đo N1 trên DB thử) và AC-6 (so toàn bộ đầu ra trên bài thật). Dữ liệu thật hôm nay có
  0 bài thuộc dạng lỗi, nên thước «trước → sau» trên bài thật chỉ chứng không lùi.

## Notes
