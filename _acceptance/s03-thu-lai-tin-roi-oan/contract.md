---
schema_version: 1
feature: Bài S03 có chữ mà luật regex bỏ sót («2PN2w», «Stu», «2 NGỦ», «55m», «Giá 3.7 thu nét về», «1t920») được nhận thành tin rao; câu tìm viết bằng các dạng ấy vẫn là Yêu cầu, tin rò không tăng quá rào PL42
slug: s03-thu-lai-tin-roi-oan
owner: phanlemanh@gmail.com
risk_tier: T2
surfaces: [data, cli]
status: approved
approved_by: Mạnh
approved_at: 2026-11-28
design_doc: docs/superpowers/specs/2026-11-28-s03-thu-lai-tin-roi-oan-design.md
---

# Acceptance Contract: s03-thu-lai-tin-roi-oan

## Context

PL43, GS giao dãy P3 28/11, trước YC0. Mạnh nêu tin S03 vào kho thấp; audit chỉ đọc 28/11
(`research-local/audit-s03-vao-kho-2811/BAO-CAO.md` mục 3, 4, 6) ước +500–800 tin rơi oan. Đo 28/11 trên DB máy thu, chỉ đọc, bằng
chính hàm của transform: thu lại được **+222 khoá gom tin (+2,3%)**, thấp hơn ước của audit. Bảng phủ ca và số từng phần: design doc.
Tin S03 đang sống 28/11: 9.699. Rào: thước PL42 (`do-yeu-cau-lot-tin.mjs`) đang ở tin rò 78, giá tốt thuê rò 12.

## Criteria

### AC-1 — Dấu hiệu BĐS nhận dạng viết tắt
Given ma trận viết trước, mỗi dạng một câu có giá thuê và một câu có giá bán: «2PN2w», «2pn2wc», «2 phòng ngủ +», «2 NGỦ», «1 ngủ»,
«Stu», «stu», «STUDIO», «BE5 Stu», và câu có giá mà dấu hiệu duy nhất là diện tích trần («S205 · 55m · 9,5tr»),
When `coDauHieuBds` và `suyLoai` đọc (nhóm «ca-hai»),
Then mỗi câu ra đúng loại (thuê cho giá triệu, bán cho giá tỷ); và chiều đỏ ghim trong test: «vay 1 năm 5tr», «tuyển 3 nữ 8tr»,
«KH 1 nữ», «cách 500m giá 5tr», «Stuff 5tr», «sinh viên studious 3tr» KHÔNG có dấu hiệu BĐS.

### AC-2 — Giá viết không đơn vị ở bài bán
Given «Giá 1t920 BTP», «2t45 bao phí», «Giá: 3.7 (thu nét về)», «Giá: 1.650 net» trong nhóm «ca-hai», và đối chứng «1t9 tầng
cao» không giá khác, «Giá 2.5 tỷ/tháng», «bán 250 triệu», «căn 45m giá 7.000.000/m2»,
When `parsePost` rồi `suyLoai` đọc,
Then bốn câu đầu là tin bán với giá 1,92 · 2,45 · 3,7 · 1,65 tỷ; đối chứng giữ nguyên kết quả của hàm cũ (ghim trong test: thuê
từ 1 tỷ không thành thuê, sàn giá bán 300 triệu giữ, giá/m² không thành tổng giá).

### AC-3 — Câu tìm viết bằng dạng mới vẫn là Yêu cầu
Given ma trận câu tìm dùng đúng các dạng AC-1 nhận thêm: «Tìm 1 ngủ toà Be dưới 7 triệu», «Cần Stu LD full đồ 6tr», «Ai có stu
6.5trbp ko ạ», «Em đang đi với khách, kiếm stu full ở liền <7tr», «kiếm 2pn full 10tr», và khẩu hiệu môi giới «HÀNG THUÊ 2PN BE
TRỐNG 9.5TR … Tìm nhà không khó – Có em Như lo!», «Tìm căn khó có em Lo … Studio S1.01 trống 4,5 tr»,
When `suyLoai` đọc,
Then năm câu tìm ra `kind = null` nguồn `yeu-cau`; hai bài khẩu hiệu ra `rent_lt`; và các ma trận của PL42
(`yeu-cau-khong-thanh-tin-thue.test.mjs`) vẫn xanh không sửa kỳ vọng.

### AC-4 — Qua transform thật, ổn định khi chạy lại (cross-layer)
Given DB thử (ROLLBACK) với bài S03 tổng hợp: một bài «BE 2PN2w full 15tr», một bài «Giá: 1.650 net studio 26.6m», một bài «Giá
1t920 BTP 1PN+ 47m2», một câu tìm «Tìm 1 ngủ toà Be dưới 7 triệu», một tin rao thật đã có từ trước,
When chạy transform-zalo hai lần,
Then ba bài oan thành ba tin S03 sống đúng loại và giá; câu tìm không thành tin và rơi vào nhánh `yeu-cau` của `nhanhCuaBai`; tin
có từ trước y nguyên khoá; lần chạy thứ hai không đổi dòng nào; chiều đỏ: chạy với bản sao luật cũ (tiêm qua tham số khai trong
test) thì ba bài oan không thành tin, ca đỏ gọi tên bài.

### AC-5 — Thước trên bản chép dữ liệu thật (cross-layer)
Given bản chép DB máy thu (db-thu, ROLLBACK),
When `pipeline/scripts/do-tin-roi-oan.mjs --kiem` chạy trên cùng bản chép hai lượt, mỗi lượt transform-zalo rồi xếp hạng giá (420):
lượt «trước» bằng luật cũ tiêm qua tham số khai (như AC-4), lượt «sau» bằng luật mới, và in hai khối,
Then tin S03 sống «sau» − «trước» ≥ 150 (thử +222 khoá); thước PL42 trên lượt «sau»: tin rò ≤ 90 và tin thuê «giá tốt» rò ≤ 17,
và in số tin rò thêm so với lượt «trước»; in số tin bán và tin thuê «giá tốt» S03 hai lượt, số tin bán mới có giá dưới 1 tỷ, và
tin mới theo phần luật (A · B · C · D · G); ghi tệp mẫu `.acceptance-runs/s03-thu-lai-tin-roi-oan/mau-tin-moi.md` (cờ
`--ghi-evidence` chép thêm bản nộp chấm tay vào `_acceptance/s03-thu-lai-tin-roi-oan/evidence/mau-tin-moi.md`), đầu tệp ghi sha
cây và hạt giống; mỗi mục có mã tin, phần luật, loại, giá đã đọc, nhãn Haiku và chữ bài đầy đủ đã che (chuỗi từ 8 chữ số trở lên
thành «#», tên nguồn thành mã); gồm ba phần: 20 tin mới chọn ngẫu nhiên, 10 tin mới của phần C chọn ngẫu nhiên, MỌI tin mới có bài
nhãn `inquiry`, cộng 20 bài còn rơi có dấu hiệu BĐS (để soát dạng chữ chưa có trong bảng phủ ca); hạt giống cố định. Phần ngẫu nhiên
dưới số đã khai thì thoát 1 «mẫu thiếu»; mục thiếu trường thì thoát 1 «mẫu thiếu trường»; vượt ngưỡng nào thì thoát 1 gọi tên
ngưỡng.

### AC-6 (judgment) — Tin mới nhận đúng là tin rao, giá đúng bậc
Given bản nộp chấm tay của tệp mẫu AC-5 (đầu tệp mang sha cây và hạt giống),
When người chấm đọc từng tin,
Then trong 20 tin ngẫu nhiên, ít nhất 18 tin là tin rao bán/cho thuê thật và giá đúng bậc (tỷ cho bán, triệu cho thuê); trong 10
tin phần C, ít nhất 9 tin là tin bán thật với giá đúng; mỗi tin có bài nhãn `inquiry` được ghi «câu tìm lọt» hay «nhãn model sai»;
20 bài còn rơi được ghi dạng chữ nào bị bỏ sót (nếu có).

### AC-7 — Không hồi quy
Given cây sau sửa,
When chạy test luật loại tin hiện có (`transform-zalo-loai-tin*.test.mjs`, `yeu-cau-khong-thanh-tin-thue.test.mjs`) và hai nửa
suite pipeline,
Then xanh, và các tệp test cũ không đổi kỳ vọng nào so với a94013aaf (chỉ được thêm ca).

## Coverage

- Trục A — dạng chữ × loại giá: dấu hiệu BĐS viết tắt và diện tích trần [AC-1] · giá không đơn vị bài bán [AC-2] · câu tìm cùng
  dạng và khẩu hiệu [AC-3]
- Trục B — đường thật: transform, chạy lại, luật cũ đối chứng [AC-4] · dữ liệu thật, rào PL42, giá tốt [AC-5] · mẫu chấm tay
  hai phía [AC-6] · hồi quy [AC-7]
- Bảng phủ ca đếm từ DB máy thu, cột «ai đọc phía sau»: design doc.

## Out of scope

- Bài có loại mà giá phi lý, bài có dấu hiệu mà thiếu giá (≈ 9,6 nghìn bài): bảng quỹ căn, bài mời nhóm — mở luật cần đo precision riêng.
- Hẹp luật Yêu cầu theo khuôn khai căn hay chữ «độc quyền/sẵn sổ»: đo lọt câu tìm của người mua (2/24 và 17/34 bài có nhãn).
- «4.350 chốt», «chốt giảm thêm 2.6 tỷ»: chạm bộ chặn số ngữ cảnh SV1 — hàng riêng.
- Bài chỉ có ảnh; dựng căn S03; màn Ops (ON25 của U1).

## Đường đo

- Ô DB: tin S03 đang sống 9.699 → ≥ +150 ở lượt transform đầu sau gộp ← AC-5. Lệnh: `node pipeline/scripts/do-tin-roi-oan.mjs`.
- Rào: tin rò ≤ 90, tin thuê «giá tốt» rò ≤ 17 ← AC-5. Lệnh: `node pipeline/scripts/do-yeu-cau-lot-tin.mjs`.
- Ô màn: `/ops/data-flow` S03 «Tin rao mới» tăng ← AC-5 (in trước/sau).

## Notes

- Không có lượt áp riêng: lượt `zalo-import-daily.sh` kế tiếp (transform-zalo rồi 420) đưa luật vào hiệu lực sau gộp, như PL42.
