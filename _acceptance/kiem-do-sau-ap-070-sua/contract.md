---
schema_version: 1
feature: Kiểm danh bạ không đỏ giả với số ghép S06, và test nạp lại migration cũ chạy được sau khi áp 070
slug: kiem-do-sau-ap-070-sua
owner: phanlemanh@gmail.com
risk_tier: T2      # máy suy: pipeline/ và test, không khớp t3_paths
surfaces: [cli]
status: signed-off
veto_state: mo
veto_opened_at: 2026-11-03T07:45:00Z
design_doc: docs/superpowers/specs/2026-11-03-kiem-do-sau-ap-070-sua-design.md
---

# Acceptance Contract: kiem-do-sau-ap-070-sua

## Context

Mạnh chọn «mở hợp đồng mới» cho Ngoài-13 và Ngoài-14 của `so-ghep-s06-nhan-danh-ba` ngày 03/11. Giám sát chốt hàng này xong rồi mới gộp #294 và áp 070.
Đo trên hai bản chép DB ngày 03/11: 070 làm hỏng đúng năm bộ; các bộ đỏ khác đỏ y như trước khi áp (bảng ở design doc).

Source input: `_acceptance/so-ghep-s06-nhan-danh-ba/review-findings.md` (Ngoài-13, Ngoài-14), tin giám sát đợt 03/11.

## Acceptance criteria

- AC-1: Given ma trận viết trước năm loại tin (S06 trực tiếp, S06 ghép, S06 mất dấu, S06 trực tiếp kèm ghép, S03) nhân có hay chưa có bí danh, dấu S06 sinh từ bộ gán thật, When chạy `docDuLieu` → `tinhSo` → `veDong`, Then dòng `danh-ba-sdt:n3` của mỗi ô đúng bảng viết trước: `fail` chỉ ở ba ô số trực tiếp hoặc S03 chưa có bí danh, `pass` ở bảy ô còn lại, số hai loại tin đếm một lần. Trên cùng ô, câu đếm cũ đỏ giả ở ô ghép chưa bí danh, và câu thiếu vế bí danh đỏ giả ở ô ghép đã có bí danh.
- AC-2: Given các ô chưa bí danh của AC-1, When dựng danh bạ bằng `dungNguoi`, Then `n3` là `pass` và đếm một lần; thêm một số mới chưa có bí danh thì `n3` là `fail`, dựng lại thì `pass`. `SQL_N3` và `sellersThieu` dùng chung hằng `TIN_VAO_DANH_BA`.
- AC-3: Given view đã mang cột của 070 và mỗi tệp 044, 045, 059, 061, When gọi `sqlNapLai`, Then văn bản trả về không còn câu `CAU_VIEW_SONG` và phần còn lại giữ nguyên; given view chưa mang cột, Then trả về đúng từng byte. Chạy thẳng câu đó trên view đã mang cột báo «cannot drop columns from view»; đi qua `sqlNapLai` thì không lỗi và view vẫn còn `seller_phone_inferred`.
- AC-4: Given bản chép `oneinvest` đã áp 070 rồi 068, When chạy `dac-trung-s06.itest`, `dac-trung-s06-vocab-db`, `do-dac-trung-s06`, `nap-lai-db.itest`, `phat-bieu-db.itest`, Then không bộ nào có lỗi «cannot drop columns from view», không ca đỏ nào ngoài tập đỏ đã đo trước khi áp (ND-AC-1, PD-AC-8, DT-AC-8 `CLOUD_ALLOW`, DT-AC-7 lượt gốc) và mỗi ca đỏ mang đúng lý do đã đo, số ca xanh không dưới mức đo trước khi áp, không ca nào bị bỏ qua. Trên cùng bản chép, `MIG_061` nạp thẳng trong giao dịch ROLLBACK báo lỗi view, qua `napDacTrung` thì không; bản `174c302a` của `nap-lai-db.itest`, `phat-bieu-db.itest` trên cùng bản chép báo lỗi view (đối chứng).
- AC-5: Given phép đo của AC-4 chạy xong, When đọc `oneinvest`, Then `sale_offers` có cùng tập cột như trước khi đo; `git diff` so `174c302a` không đổi tệp nào trong `db/migrations/` có từ trước.

## Coverage

Bỏ quét không gian: entry `descope` «bỏ coverage-scan» trong `decisions.jsonl`. Hai lỗi cụ thể đã có số đo; trục nhiều chiều duy nhất là bốn migration × view có hay chưa có cột, liệt đủ ở AC-3.

## Out of scope

- Ba bộ đỏ vì CHECK `field_assertions_field_chk` (`trang-thai-chao.itest`, `bac-du-lieu.itest`, `idem-059`): đỏ sẵn trước 070.
- DT-AC-8 `CLOUD_ALLOW`: thước cũ, `stories`, `frontage_length` đã được mở lên cloud có chủ ý ở `193b8a11`, không phải rò dữ liệu.
- DT-AC-7 lượt gốc: đối chứng cần cột còn rỗng, mà `oneinvest` nay đã đầy cột; đỏ cả trên bản chép chưa áp 070.
- ND-AC-1: thước cũ, chưa biết `sellers` thành view từ 060. PD-AC-8, GT-AC-4, `danh-ba-nguoi.itest` AC-8: đỏ giống nhau trước và sau 070, chưa tra nguyên nhân, cần hàng riêng.
- Sửa `khoaNguon` khi bị khoá DDL chặn: hàng `khoa-nguon-nghi-khi-ddl-sua`.
- Áp 068, 070 lên DB máy thu hay cloud, và gộp #294: giám sát xin Mạnh riêng.

## Notes

- Dựng trên `174c302a` vì cần 070; PR nhắm main sau khi #294 gộp, hoặc giám sát gộp chung một cửa sổ.
- Phép đo AC-4 chỉ chạy trên DB thử (`db/db-thu.sh oneinvest_kd_that`), xoá sau khi đo.
- Known limits — chọn ở Cổng Bằng chứng 2026-11-03:
  - Ngoài-1: Sửa tiếp hai tệp phụ của bộ kiểm sau khi ký thì bằng chứng vẫn được coi là còn mới, dù kết quả đo có thể đã đổi.
  - Ngoài-3: Trang Ops hiện số «SĐT trên tin» có thể nhỏ hơn số thật mà không giải thích.
  - Ngoài-4: Bộ kiểm chưa phát hiện được bảng bị xin khoá giữa chừng trong thân ma trận mười ô; hiện chưa có bảng nào bị sót.
  - Ngoài-5: Lời báo của phép kiểm khoá hứa phủ mọi ca, nhưng có một đường không được phủ.
  - Ngoài-6: Một trong bốn tệp nạp lại cũ mới được so văn bản, chưa nạp thật trên cơ sở dữ liệu.
  - Ngoài-7: Một số ô kiểm dùng bí danh viết tay, nên nếu cách ghi bí danh đổi dạng thì danh bạ có thể đếm sai mà bộ kiểm không báo.
  - Ngoài-8: Phép tự kiểm của thước đo chỉ đếm số lỗi, không đọc lỗi gì.
  - Ngoài-9: Thước kiểm «không đổi tệp thay đổi cơ sở dữ liệu cũ» có thể báo không đổi ngay cả khi lệnh so sánh chạy sai.
  - Ngoài-10: Việc ba bộ kiểm chạy đúng trên bản chép thử mới được kiểm bằng đọc mã nguồn, chưa đo lúc chạy.
  - Ngoài-11: Nếu nhật ký chạy kiểm đổi định dạng, thước có thể coi như không có ca nào bị bỏ qua.
  - Lượt 4: Bằng chứng trên bản chép thật chỉ chứng minh hết lỗi view, chưa chứng minh tổ hợp 070 + 068, vì ba bộ kiểm đè phần 068 của hàm phân xử nên đường ghi số điện thoại không chạy thật.
  - Lượt 3: Hai ca của agent và app từng đỏ khi chạy cả bộ, chưa rõ nguyên nhân, nên có thể đỏ lại khi máy tải nặng.
  - Sau ký, PD-AC-8 tin nghỉ: Ca PD-AC-8 chỉ so tin sống nên không canh độ trễ cột ở tin nghỉ; đo trên bản chép ngày 04/11 có 460 ô lệch, đều ở tin nghỉ.
  - Sau ký, PD-AC-8 đỏ sẵn: Phép đo E4 vẫn chấp nhận PD-AC-8 đỏ nếu chỉ lệch `bedrooms`, `block_raw`, nên lệch thật ở tin sống đúng hai trường này thì E4 vẫn đạt.
