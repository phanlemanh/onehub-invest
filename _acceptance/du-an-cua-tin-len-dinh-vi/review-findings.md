# Review findings: du-an-cua-tin-len-dinh-vi (round 2)

## Trong hợp đồng

- **Bằng chứng E8 cũ so với code và eval hiện tại: ảnh cho thấy tiêu đề cột bị cắt, đè lên cột khác mà hồ sơ vẫn ghi PASS**
  file: `_acceptance/du-an-cua-tin-len-dinh-vi/evidence/E8-step1.png`
  severity: medium
  AC: AC-8
  source: conventions
  detail: E8-step1.png chụp bảng «Chất lượng từng chặng» lúc cột còn rộng 110 px. Tiêu đề «Định vị (cấp dự án)» bị cắt và đè lên tiêu đề «Gắn căn». Bản thân evidence-report.md dòng 113 cũng ghi «bị cắt chữ trên màn hình», vậy mà dòng 27 vẫn chấm E8 PASS. Sau ảnh này có hai commit: e3b42c85 nới cột lên 170 trong quality-grid.tsx, và c8f3eaa6 sửa bước E8 trong evals.yaml, đòi tiêu đề «đọc trọn trên ảnh, không bị cắt hay đè lên cột Gắn căn». E8 chưa được chạy lại sau hai commit đó. Như vậy bằng chứng đang nộp không thoả bước kiểm của chính eval và không phản ánh code trên HEAD. Theo luật cổng nghiệm thu, evidence phải khớp contract/evals trước khi đưa người ký. Cần chạy lại E8 (ảnh step1–3 và run_id mới) rồi cập nhật evidence-report.md và card.
  rationale: AC-8 đòi tiêu đề cột Định vị đọc được chữ «cấp dự án» trên màn; bằng chứng đang nộp cho thấy tiêu đề bị cắt và đè, chưa chứng được AC-8.

- **Hình dạng 5: tuyên quét cả lớp nhưng chỉ phủ một phần (AC-4 bỏ sót toàn bộ tin S06 của fixture AC-3)**
  file: `pipeline/tests/offer-project.itest.mjs:216`
  severity: medium
  AC: AC-4
  source: measurement
  detail: evals.yaml E4 ghi lời hứa cho cả lớp: «offer_located(id) deepEqual (status = 'mot_du_an') với mọi tin của fixture AC-2, AC-3 và một tin không dòng», kèm «với mọi tin fixture, B2 theo data_level_units deepEqual (offer_located AND đủ lõi)». Ca DV7-AC-4 lại chỉ dựng `maTran()` (11 ô AC-2, toàn tin S03/S05 đi nhánh `theo_bai`) cộng thêm hai tin S03 (`thieu`, `khongDuAn`): `const ids = [...o.map((x) => x[1]), thieu, khongDuAn]`. Không có tin S06 nào (nhánh `theo_ma`/s06_offer_project, evidence 'ma_nguon', nút con, toà, bí danh đã thôi) chạy qua hai vòng `for (const id of ids)` so offer_located và B2 với view. Nhánh mã nguồn của offer_located/data_level_units vì vậy không được đo, dù lời hứa nói là đã quét mọi tin AC-3. Cũng không có ma trận viết trước gộp AC-2 với AC-3 và assert số phần tử.
  rationale: AC-4 đòi so offer_located và data_level_units trên cùng fixture (gồm tin S06 của AC-3), nhưng ca kiểm chỉ chạy tin S03/S05.

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **offer_project dừng ở nút project đầu tiên nên dự án con (project có parent_id là project) bị coi là dự án gốc riêng**
  Người dùng thấy gì: Nếu sau này danh bạ có dự án con nằm dưới dự án cha, một tin nhắc cả hai có thể bị xếp là «xung đột» và không được định vị, hoặc bị gắn vào dự án con thay vì dự án gốc.
  Căn cứ: Hôm nay chưa có dự án con nào trong dữ liệu nên chưa ai bị ảnh hưởng, và khi có thì sửa là một lần sửa nhỏ, không mất dữ liệu.
  file: `db/migrations/105_offer_project.sql`
  severity: low
  Đề xuất: known-limits

- **Hình dạng 2: fixture offer_project viết tay theo đúng khuôn bên đọc, không rút từ view 105**
  Người dùng thấy gì: Nếu sau này cấu trúc nguồn định vị đổi, một số test màn dòng chảy vẫn xanh dù màn thật có thể hiện sai.
  Căn cứ: Không ảnh hưởng người dùng hiện tại, chỉ làm lưới an toàn khi sửa về sau lỏng hơn, và đã có bước kiểm trên DB thật bù lại.
  file: `app/tests/ops-dong-chay-fixture.ts`
  severity: low
  Đề xuất: known-limits

## Chưa adversarial-verify (refuter chết)

⚠ Cụm ngoài vùng phủ: 2/4 lỗi rơi vào file không bộ đo nào phủ (_acceptance/du-an-cua-tin-len-dinh-vi/evidence/E8-step1.png, app/tests/ops-dong-chay-fixture.ts) — dừng và quyết: mở rộng hợp đồng hay rút phạm vi.
