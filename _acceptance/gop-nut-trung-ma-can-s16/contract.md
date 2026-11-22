---
schema_version: 1
feature: Gộp nút phân khu do luật S16 đúc vào nút sẵn có bằng bằng chứng mã căn S16, qua thẻ nối có băm của DA46, đảo được
slug: gop-nut-trung-ma-can-s16
owner: phanlemanh@gmail.com
risk_tier: T2
surfaces: [cli]
status: machine-cleared
approved_by: Mạnh
approved_at: 2026-11-21
design_doc: docs/superpowers/specs/2026-11-21-gop-nut-trung-ma-can-s16-design.md
---

# Acceptance Contract: gop-nut-trung-ma-can-s16

## Context

Danh bạ có hai nút cho The Rainbow ở Grand Park: nút gốc 48 và nút 389 do luật S16 đúc. DA46 không nối cặp này vì thiếu bằng chứng toà
S09, dù cả 16 mã căn của khu S16 «Rainbow» mang tiền tố toà của The Rainbow và 8 mã trùng hẳn. Hàng này thêm bằng chứng mã căn S16
vào bước chọn cặp nối và dùng lại máy nối, đảo, kiểm đã ký của DA46. Căn cứ: đề xuất P2 ngày 21/11, GS cắt hàng DA53.

## Criteria

- AC-1: Given cây danh bạ và mã căn S16, When dựng thẻ nối, Then nút do luật S16 đúc còn sống được xét bằng chứng S09 trước, theo đúng luật DA46; S09 đã chỉ ra nút giữ thì mã căn không đổi được kết quả. Không qua được thì xét mã căn:
  - một mã «mang tiền tố» một toà khi mã bắt đầu bằng tên toà và ngay sau là dấu chấm, hoặc tên toà có dấu chấm và ngay sau là chữ số (toà «S1» không nhận mã «S10.01»);
  - nối khi mọi mã căn khu của nó mang tiền tố một toà thuộc khu của đúng một nút phân khu cùng dự án, không do luật đúc, chưa nghỉ, và có ít nhất 3 mã trùng hẳn;
  - mọi mã mang tiền tố của đúng một ứng viên mà dưới 3 mã trùng, hoặc mọi mã khớp từ hai ứng viên trở lên (kể cả cha và con), thì vào «cần người chọn», không nối;
  - còn lại không nối, kèm lý do.
- AC-2: Given cây danh bạ, When dựng thẻ nối hai lần, Then thẻ in mỗi cặp kèm loại căn cứ (S09 hay mã căn) và số mã trùng / mang tiền tố / tổng, liệt ca «cần người chọn» và ca không nối kèm lý do. Thẻ không in mã khu, toà, căn thô, in cùng một băm cả hai lần và không ghi gì vào DB.
- AC-3: Given thẻ và băm, When nối, Then:
  - băm lệch thì không ghi gì;
  - băm đúng thì nút luật mang nghỉ, cha thành nút giữ lại, khoá khu chuyển sang nút giữ, bí danh nối vào cuối nút giữ (giữ thứ tự cũ), id nút giữ không đổi, ghi đúng một dòng `project_link_rules`;
  - ca «cần người chọn» không bị nối; nối lần hai không đổi gì.
- AC-4: Given một lượt nối có cặp mã căn đã áp, When đảo theo mã lượt, Then `aliases`, `meta`, `parent_id` của mọi nút về đúng như trước áp và dòng luật ghi người, giờ đảo. Đảo không gỡ bí danh của lượt khác trên nút giữ (tên tắt DA51) và không đụng lượt nối DA46.
- AC-5: Given đã áp lượt nối mới, When chạy `--kiem-noi` của lượt mới, của lượt DA46 và `--kiem` của lượt bí danh DA51, Then cả ba thoát 0; sau khi đảo lượt mới, hai lệnh của DA46 và DA51 vẫn thoát 0.
- AC-6: Given đã nối, When bên đọc trên main đọc danh bạ, Then:
  - `docTenPhanKhu` không còn nút đã nghỉ, tên của nó chỉ ra nút giữ;
  - `v_toa_nut_vung` đưa toà của khu đã chuyển về nút giữ;
  - số phân khu chưa nghỉ bớt đúng số cặp đã nối.
- AC-7: Given đã nối, When lượt dựng đêm của danh bạ (dựng phân khu S16 và danh bạ vật thể) chạy lại hai lần, Then không đúc lại nút cho khu đã chuyển, số nút không đổi, toà vẫn ở nút giữ; bộ soát S16 của đường cloud trên `asset_nodes` vẫn sạch.
- AC-8: Given bản chép DB máy thu, When chạy trọn chuỗi thẻ, nối, kiểm, đo, đảo, Then:
  - thẻ nối 389 → 48 bằng mã căn (16 mang tiền tố, 8 trùng), 398 → 42 ở «cần người chọn», 396 không nối, 0 cặp mã căn khác;
  - sau nối, toà của 48 lên 18 và của 389 về 0, phân khu chưa nghỉ ở Grand Park 13 → 12;
  - bộ gắn toà PL20 ở sha e27d1e690 (đo trước và sau trên cùng sha) gắn thêm ít nhất 80 tin và ô «chữ và model khác nút» giảm ít nhất 80, xung đột tăng không quá 5 (chạy thử 21/11: 3.962 → 4.063, 116 → 13, 21 → 23);
  - đảo về đúng dấu vân tay `aliases`, `meta`, `parent_id` trước nối.

## Coverage

Bảng phủ ca đếm trên DB máy thu ở design doc §2. Trục và ca:

- Căn cứ: S09 đạt (giữ luật DA46), mã căn đạt, mã căn dưới ngưỡng trùng (cần người), mã căn một phần (không nối), không ứng viên, ứng viên do luật đúc hay đã nghỉ → AC-1
- Thẻ: loại căn cứ, không lộ mã thô, băm ổn định, chỉ đọc → AC-2
- Nối: băm lệch, băm đúng, ca cần người, nối lần hai → AC-3; đảo, bí danh lượt khác → AC-4; ba lệnh kiểm trước và sau đảo → AC-5
- Bên đọc: GT5 `docTenPhanKhu`, `v_toa_nut_vung`, số phân khu → AC-6; dựng đêm, cloud → AC-7
- Dữ liệu thật: bảng phủ, số trên các bên đọc, PL20, đảo → AC-8

## Đường đo

- Thẻ và bên đọc: `node pipeline/phan-khu-s16.mjs --the-noi <tệp>` và `node _acceptance/gop-nut-trung-ma-can-s16/probes/do-ben-doc.mjs` trên
  bản chép sau áp. Ô đổi: toà 48 17 → 18, 389 1 → 0; phân khu chưa nghỉ Grand Park 13 → 12, toàn danh bạ 75 → 74. AC-6, AC-8 bảo đảm.
- Tin gắn được của bộ gắn PL20: `node _acceptance/gop-nut-trung-ma-can-s16/probes/do-p4.mjs`, bộ đọc PL20 ghim sha e27d1e690 (nhánh
  `feat/ghep-tin-vao-danh-muc`), đo trước và sau trên cùng sha. Ô đổi: tin gắn 3.962 → 4.063, «chữ và model khác nút» 116 → 13. AC-8 bảo đảm.
- Trên cloud: sau lượt đồng bộ đêm đầu tiên kể từ lúc áp, 389 mang nghỉ và có cha là 48 (bước kiểm sau ở design doc §4, chỉ đọc).

## Out of scope

- Nối 398 → 42: thẻ đưa ra cho người chọn; nối thật là việc của hàng sau, có lời người, vì 0 mã trùng hẳn.
- Cặp hai nút cùng do luật đúc (406/411, 409/412, 419/421): ngoài phạm vi, vì bằng chứng mã căn chỉ so với nút sẵn có; cần một bước gộp riêng.
- Bước gom tin lẫn phân khu (P4 ghi ít nhất 25 tin): ngoài phạm vi, vì lỗi ở bước gom bài thành tin, không ở danh bạ.
- Sửa bộ gắn PL20 hay GT5: ngoài phạm vi, vì hàng chỉ sửa danh bạ; hai bộ đọc nhận kết quả qua `asset_nodes`.

## Notes

- Áp lên DB máy thu cần chữ ký Cổng Bằng chứng kèm băm thẻ nối; hồ sơ áp năm thứ ở design doc §4.
- Không áp trước khi PL20 qua Cổng Bằng chứng (GS 21/11): đầu ra đóng băng lát n2 của P4 dựng trên danh bạ hiện tại.
- Nút nghỉ sau gộp giữ khuôn «nghỉ» của DA46, không xoá dòng.
- Cloud: 389 nghỉ và đổi cha lên cloud theo lượt đồng bộ `asset_nodes` đêm kế sau khi áp, như DA46 và DA51; không gọi sync-cloud bằng tay;
  bước đếm trên cloud chỉ đọc, chạy sau lượt đêm. Đảo bằng `--dao-noi` rồi lượt đêm kế đưa cloud về như trước.
- Số P4 báo «khoảng 800 lượt bài nhiều vùng do cặp 48/389» không khớp khi đo lại: số bài nhiều vùng của bộ đọc PL20 không đổi khi gộp (1.409).
- Ngoài-1 (máy định tuyến 2026-11-21, đề xuất S4 known-limits): Nếu mã căn hay tên toà có khoảng trắng thừa hoặc khác chữ hoa thường, hệ thống có thể bỏ sót một cặp phân khu đáng lẽ được gộp, và để nguyên hai nút trùng. — `pipeline/phan-khu-s16.mjs`
- Ngoài-2 (máy định tuyến 2026-11-21, đề xuất S4 known-limits): Khu có mã căn giữ chỗ sẽ không được gộp tự động và chỉ hiện là chưa đủ bằng chứng, mà không nói rõ lý do. — `pipeline/phan-khu-s16.mjs`
- Ngoài-4 (máy định tuyến 2026-11-21, đề xuất S4 known-limits): Phép kiểm tự động chưa chứng minh được rằng nó sẽ báo lỗi nếu ca cần người bị nối nhầm, nên một lỗi như vậy sau này có thể lọt qua. — `pipeline/scripts/phan-khu-s16-ma-can.itest.mjs`
- Ngoài-5 (máy định tuyến 2026-11-21, đề xuất S4 known-limits): Chưa có phép thử riêng cho trường hợp nút phân khu đã nghỉ, nên nếu hệ thống nối nhầm vào nút đã nghỉ thì chưa chắc được phát hiện. — `pipeline/scripts/phan-khu-s16-ma-can.itest.mjs`
