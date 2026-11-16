---
schema_version: 1
feature: Bật máy tự xếp mục ngoài hợp đồng loại «giới hạn đã biết» ở Cổng Bằng chứng (feature_loop.ngoai_n_tu_dinh_tuyen)
slug: ngoai-n-tu-dinh-tuyen-bat
owner: phanlemanh@gmail.com
risk_tier: T2
surfaces: [cli]
status: verified
design_doc: docs/superpowers/specs/2026-11-15-ngoai-n-tu-dinh-tuyen-bat-design.md
approved_by: Mạnh
approved_at: 2026-11-15
---

# Acceptance Contract: ngoai-n-tu-dinh-tuyen-bat

## Context

Mạnh duyệt 15/11 («Theo khuyến nghị», điểm D; lời đi qua phiên giám sát, chưa có trong tệp nào của kho): ở Cổng Bằng
chứng, mục ngoài hợp đồng loại «ghi giới hạn đã biết» thì máy tự xếp; Mạnh chỉ quyết mục đòi hợp đồng mới hoặc đổi phạm
vi. Bộ ghi của kit xếp HAI loại mà chính máy đề xuất: `known-limits` (máy ghi «ghi Known limits») và `wont-fix` (máy ghi
«chấp nhận, không sửa») — cả hai đều ship, không sửa gì. Hồ sơ này hỏi lại Mạnh ở Cổng Phạm vi cho cả hai loại (Hỏi-1). Kit 2.37.0 có sẵn bộ ghi `dinh-tuyen-may.cjs`, tắt mặc
định, bật bằng khoá kho `feature_loop.ngoai_n_tu_dinh_tuyen: true`. Hồ sơ chỉ thêm khoá đó, cùng một executor cho bộ đo của
hồ sơ, vào `_acceptance/config.yaml`.

**Điểm xong.** Trên chín hồ sơ đã ký gần nhất (mốc `d2b4beaf`), số mục Mạnh phải gõ ở Cổng Bằng chứng của hồ sơ T2 giảm
từ 38 xuống 10 (máy xếp 28: 23 ghi Known limits, 5 chấp nhận không sửa; 10 mục còn lại đều là mục máy đề xuất mở hợp đồng
mới); hồ sơ T3 không đổi (17/17 vẫn về Mạnh). Hồ sơ T2 xanh-sạch kế tiếp mà mọi mục ngoài hợp đồng đều là
`known-limits`/`wont-fix` sẽ đi làn V — Mạnh gõ 0 mục ở Cổng Bằng chứng.

**Giá, nêu ở Cổng Phạm vi.** Trong 28 mục máy xếp trên mẫu, có 1 mục Mạnh từng chọn khác thật: `nap-s09` Ngoài-1 (máy đề
xuất ghi Known limits, Mạnh mở hợp đồng mới) — 3,6 %, dưới ngưỡng xem lại 10 % của kit. Bật khoá thì mục loại này không
còn hỏi. Hồ sơ mà mọi mục đều được máy xếp sẽ đi làn V: không mời ký Cổng 2, và PR được gộp theo cửa sổ gộp của giám sát
— Mạnh có thể KHÔNG nhìn thấy mục ấy trước khi gộp. Dòng sổ máy giữ lệnh đảo (khoá `dao`); đảo sau khi gộp nghĩa là mở
việc mới cho mục ấy. Ba mục khác chỉ đổi qua lại «ghi Known limits» ↔ «chấp nhận, không sửa» — cả hai đều ship không sửa.

## Criteria

- AC-1: Given `_acceptance/config.yaml` của PR, When đọc khoá `feature_loop.ngoai_n_tu_dinh_tuyen` bằng
  `resolveConfigKey` của `lib/evidence-core.cjs` trong kho, Then ra `true`.
- AC-2: Given bốn tệp kit chép trong kho (`lib/out-of-contract.cjs`, `lib/evidence-core.cjs`,
  `scripts/khong-can-nguoi.mjs`, `scripts/pre-merge-check.sh`), When so băm với bản acceptance-gate đang cài, Then bản
  đang cài đúng là 2.37.0 (khác thì bộ đo báo «sai bản kit» và dừng) và khớp cả bốn tệp — kho không cần bản chép hay
  bước CI nào thêm.
- AC-3: Given sáu hồ sơ T2 đã ký ở mốc `d2b4beaf` đưa về trạng thái trước Cổng 2 (`status: verified`, bỏ chữ ký, bỏ dòng
  sổ gate2), When chạy `dinh-tuyen-may.cjs --write` với config của PR, Then máy xếp đúng 4/7 · 1/1 · 7/9 · 3/3 · 11/12 ·
  2/6 mục (tap-nhan-ghep-tin-hai-khu · sua-xa-bo-nut-ung-vien · s06-tran-trang · nap-s09 · toa-s09-hai-khu-vao-danh-ba ·
  stg-du-an-s08), tổng 28/38 (23 «ghi Known limits», 5 «chấp nhận, không sửa»); 10 mục còn về Mạnh và cả 10 là mục máy
  đề xuất `new-contract` (đọc bằng `lib/out-of-contract.cjs` của kho); mỗi dòng máy mang `may: dinh-tuyen-ngoai-n`, không
  có `decided_by`, có `tieu_de` và lệnh đảo `/acceptance-gate:signoff <slug> Ngoài-<n>: mở hợp đồng mới; Ký` (dòng đầu
  của nap-s09 đúng nguyên văn `/acceptance-gate:signoff nap-s09 Ngoài-1: mở hợp đồng mới; Ký`).
- AC-4: Given ba hồ sơ T3 cùng mốc, cùng cách dựng, When chạy bộ ghi, Then in «không định tuyến: hạng T3» và sổ quyết
  định không đổi một byte.
- AC-5: Given 28 dòng máy của AC-3, When so với dòng người thật của chính mục ấy trên main, Then 24 khớp, 3 chỉ đổi qua
  lại «ghi Known limits» ↔ «chấp nhận, không sửa», 1 đảo thật (`nap-s09` Ngoài-1).
- AC-6: Given chín hồ sơ sau khi máy xếp, When chạy `scripts/khong-can-nguoi.mjs --check` của kho, Then đúng hai hồ sơ
  đủ xanh-sạch: `nap-s09`, `sua-xa-bo-nut-ung-vien`.
- AC-7: Given cùng chín hồ sơ, config bỏ khoá (đối chứng), When chạy bộ ghi, Then cả chín in «tắt», không dòng máy nào.
- AC-8: Given đỉnh PR, When chạy `node scripts/product-map.mjs --root . --check` và lưới trước-merge
  `bash scripts/pre-merge-check.sh . --base origin/main`, Then bản đồ khớp và lưới không có VIOLATION nào mang tên hồ sơ
  khác ngoài hai dòng chờ của chính hồ sơ này.

## Coverage

Quét theo bảng trục của thiết kế kit (§8), thu về phần kho chạm:
- Trục A · khoá kho: vắng (AC-7) · true (AC-1, AC-3). Giá trị sai: bộ ghi của kit tự thoát 2 — không phải việc của kho.
- Trục B · điều kiện hồ sơ: T2 đủ (AC-3) · T3 (AC-4). UNCERTAIN/bypass/triage_failed: mẫu chín hồ sơ không có ca nào
  [CE chưa kiểm chứng trên dữ liệu kho — kit đã có ca riêng].
- Trục C · đề xuất của mục: known-limits/wont-fix được xếp, new-contract còn về người (AC-3: 11 mục còn lại).
- Trục D · sổ cho mục: chưa có dòng (AC-3); so với dòng người (AC-5).
- Mặt đọc: lưới trước-merge và làn V (AC-2, AC-6, AC-8).

## Out of scope

- Sửa kit hay bản chép kit trong kho (cấm từ kho này; lỗi kit gửi cho kit).
- Định tuyến hồ sơ T3 hay hồ sơ có UNCERTAIN — bộ ghi của kit không cho.
- Chạy lại bộ ghi lên hồ sơ đã ký: bộ ghi chỉ nhận hồ sơ đang `verified`. Ở mốc `d2b4beaf` không có hồ sơ T2 nào đang
  `verified` chờ ký; hồ sơ T2 đang `verified` trên nhánh khác lúc gộp (vd `s08-nap-sua` đã ký nên không tính) sẽ được máy
  xếp khi vòng của nó chạy lại bước verified trên config mới.
- Lệnh đảo không cần ký (ngưỡng mở ở thiết kế kit §5).

## Notes

- Ngoài-1 (máy định tuyến 2026-11-16, đề xuất S4 known-limits): Phép đo so sánh máy với lựa chọn của người có thể đổi kết quả sau này nếu sổ của các hồ sơ cũ có thêm dòng mới. Người dùng cuối không thấy gì; chỉ làm số kiểm kém ổn định khi chạy lại. — `_acceptance/ngoai-n-tu-dinh-tuyen-bat/do-mo-phong.mjs`
- Ngoài-2 (máy định tuyến 2026-11-16, đề xuất S4 known-limits): Bản đồ lộ trình hiện một mục đỏ báo hồ sơ này chưa thuộc việc nào. Không ảnh hưởng hành vi hệ thống, chỉ làm bản đồ kém gọn. — `LO-TRINH.html`
- Ngoài-3 (máy định tuyến 2026-11-16, đề xuất S4 known-limits): Phép kiểm lưới trước khi gộp có thể báo đạt dù lưới không chạy được. Người dùng không thấy ngay, nhưng một lỗi có thể lọt qua bước kiểm này. — `_acceptance/config.yaml`
- Ngoài-5 (máy định tuyến 2026-11-16, đề xuất S4 known-limits): Phép kiểm lưới trước khi gộp có thể xanh giả khi lưới không chạy. Người dùng cuối không bị ảnh hưởng trực tiếp. — `_acceptance/config.yaml`
- Ngoài-6 (máy định tuyến 2026-11-16, đề xuất S4 known-limits): Khi thiếu dòng của người, phép đo có thể coi là máy đảo lựa chọn của người và làm tỉ lệ rủi ro nhìn cao hơn thật. Hiện dữ liệu chưa gặp ca này. — `_acceptance/ngoai-n-tu-dinh-tuyen-bat/do-mo-phong.mjs`
- Ngoài-8 (máy định tuyến 2026-11-16, đề xuất S4 known-limits): Con số tổng 38 mục trong bằng chứng là lời khai chứ không phải số đo lại. Người dùng không thấy khác biệt. — `_acceptance/ngoai-n-tu-dinh-tuyen-bat/do-mo-phong.mjs`
- Ngoài-10 (máy định tuyến 2026-11-16, đề xuất S4 known-limits): Phép kiểm lưới có thể báo đạt khi lưới gãy hoặc đổi cách in. Người dùng cuối không thấy ngay. — `_acceptance/config.yaml`
- Ngoài-13 (máy định tuyến 2026-11-16, đề xuất S4 known-limits): Công cụ kiểm số mục máy xếp so với lựa chọn của người có thể cho kết quả lệch nếu sau này có ai sửa sổ quyết định của sáu hồ sơ cũ. Hiện chưa lệch. — `_acceptance/ngoai-n-tu-dinh-tuyen-bat/do-mo-phong.mjs`
- Ngoài-14 (máy định tuyến 2026-11-16, đề xuất S4 known-limits): Nếu ai đó cố tình chỉ công cụ kiểm sang một bản kit khác, bằng chứng vẫn báo đạt dù không đo trên đúng bản 2.37.0. — `_acceptance/ngoai-n-tu-dinh-tuyen-bat/do-mo-phong.mjs`
- Ngoài-16 (máy định tuyến 2026-11-16, đề xuất S4 known-limits): Bước kiểm trước khi gộp có thể báo đạt dù công cụ kiểm của cổng không chạy được, và che luôn vi phạm thật của chính hồ sơ này. — `_acceptance/config.yaml`
- Ngoài-17 (máy định tuyến 2026-11-16, đề xuất S4 known-limits): Công cụ so lựa chọn của máy với lựa chọn của người đọc một vế từ bản hiện tại thay vì bản đã ghim, nên có thể lệch nếu sổ cũ bị sửa. — `_acceptance/ngoai-n-tu-dinh-tuyen-bat/do-mo-phong.mjs`
- Ngoài-19 (máy định tuyến 2026-11-16, đề xuất S4 known-limits): Công cụ kiểm bản kit có thể báo khớp nếu một tệp cần so vắng ở cả hai phía, dù chẳng so được gì. — `_acceptance/ngoai-n-tu-dinh-tuyen-bat/do-mo-phong.mjs`
- Ngoài-21 (máy định tuyến 2026-11-16, đề xuất S4 known-limits): Bước kiểm trước khi gộp có thể báo đạt khi lưới kiểm của cổng sập, và không giới hạn hai dòng chờ đúng như hợp đồng hứa. — `_acceptance/config.yaml`
- Ngoài-22 (máy định tuyến 2026-11-16, đề xuất S4 known-limits): Tổng 38 mục trong báo cáo được khai sẵn trong công cụ chứ không đếm lại từ hồ sơ, nên một sai lệch nhỏ giữa các hồ sơ có thể không bị phát hiện. — `_acceptance/ngoai-n-tu-dinh-tuyen-bat/do-mo-phong.mjs`
- Ngoài-23 (máy định tuyến 2026-11-16, đề xuất S4 known-limits): Công cụ kiểm bản kit có thể báo khớp một cách rỗng nếu tên tệp gõ sai hoặc tệp đổi tên. — `_acceptance/ngoai-n-tu-dinh-tuyen-bat/do-mo-phong.mjs`
