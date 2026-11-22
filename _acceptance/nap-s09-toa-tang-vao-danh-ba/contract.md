---
schema_version: 1
feature: Dự án, toà và tầng S09 vào danh bạ, toà trùng S16, S08 thành bí danh, không sinh trùng
slug: nap-s09-toa-tang-vao-danh-ba
owner: phanlemanh@gmail.com
risk_tier: T3
surfaces: [cli, ui]
status: approved
approved_by: Mạnh
approved_at: 2026-11-18
design_doc: docs/superpowers/specs/2026-11-18-nap-s09-toa-tang-vao-danh-ba-design.md
---

# Acceptance Contract: nap-s09-toa-tang-vao-danh-ba

## Context

DA42 đưa gói 1 của S09 vào danh bạ. Danh bạ hôm nay có 344 dự án, 307 toà, 111.668 căn. Gói 1 về máy thu 19/11: danh mục 221 dự án, trong đó
198 dự án có toà; 928 toà; 23.708 tầng. Mạnh chốt 19/11 lượt này chỉ làm cao tầng, vì bản thu mới có 32.602/72.374 căn thấp tầng.

Thi công chỉ bắt đầu sau khi DA37 vào `main` và gói 1 về. Migration số 115 đã giữ.

## Criteria

### AC-1 — Gói 1 nạp vào stg không nhân dòng
Given DB của riêng lượt đã áp đủ migration và fixture rút từ phản hồi mẫu thật của làn thu, có item thiếu mã, một tệp sai băm,
When nạp fixture hai lần qua hàm dùng chung,
Then lần một ghi đúng số dòng hợp lệ, lần hai ghi 0 dòng; item hỏng đếm theo lý do; tệp sai băm làm lượt nạp dừng trước khi ghi; áp
migration lần hai không lỗi.

### AC-2 — Số trong stg khớp manifest bản thu thật
Given DB thử chép từ DB máy thu và snapshot gói 1 thật,
When nạp rồi chạy một bộ đếm độc lập đọc thẳng snapshot,
Then số dự án, toà, tầng trong stg bằng số bộ đếm và số manifest; lệch một ô thì thoát 1.

### AC-3 — Dự án S09 đi đúng một trong bốn đường
Given ma trận viết trước: dự án đã nối · trùng tên đúng một dự án · tên gần giống · không khớp,
When chạy bước dự án S09,
Then lần lượt: giữ nối · ra thẻ luật theo nguồn, chưa nối khi chưa duyệt · ra thẻ từng cặp, chưa nối · tạo đúng một nút ứng viên bậc
`mot_loi_khai`. Nút ứng viên không nối tin và không đủ điều kiện lên Invest. Dự án chờ thẻ có 0 toà mới; duyệt nối rồi dựng lại thì toà vào đúng dự án
và không sinh trùng; từ chối thì vẫn không nối. Đường nút ứng viên theo lời Hỏi-2.

### AC-4 — Toà không sinh trùng
Given dự án có toà S16, toà S08, toà đã có bí danh S09 theo mã cũ, và dòng gói 1 gồm toà khớp một, khớp hai, không khớp, hai toà trùng tên,
When chạy bước toà S09,
Then khớp một thành bí danh, số toà không đổi; toà đã có bí danh mã cũ nhận thêm bí danh mã mới trên đúng toà đó; khớp hai và trùng tên ra
thẻ, 0 toà mới; không khớp tạo đúng một toà bậc `mot_loi_khai`; 0 toà hai UPI; 0 mã S09 trỏ hai toà.

### AC-5 — Dự án có S16 giữ cấu trúc của S16
Given dự án có S16 với toà đã xếp vào phân khu, và ba toà S09 cùng tên ở phân khu khác: một toà khớp tầng với S16, một toà lệch tầng (S09 ít hơn
số tầng có căn của S16 quá 2, hoặc S16 có căn ở một tầng mà danh sách tầng S09 không có, không so tầng 1), một toà không có số tầng để so,
When dựng danh bạ,
Then toà khớp thành bí danh, phân khu hiệu lực vẫn theo S16, số lệch cấu trúc đếm theo cặp nguồn và không sinh thẻ từng toà; toà lệch tầng
ra thẻ, 0 bí danh, vì có thể là hai toà thật cùng tên; toà không so được thành bí danh và được đếm riêng.

### AC-6 — Danh sách tầng đủ cho DA43
Given toà có tầng thường, tầng có chữ «12B», tầng trùng tên khác mã,
When nạp gói 1,
Then view tầng trả đúng một dòng mỗi mã tầng, giữ tên nguyên văn, kèm mã toà; DA43 đọc được số tầng phải thu của từng toà.

### AC-8 — Chạy lại và đổi thứ tự nguồn không đổi kết quả
Given cùng một bộ dòng S08, S16, S09,
When dựng trên hai DB theo hai thứ tự rồi dựng thêm hai lần,
Then hai DB có cùng tập toà, bí danh và thẻ trên mọi mã chung; lần dựng lại sinh 0 khoá, 0 bí danh, 0 thẻ mới.

### AC-9 — Mọi thứ rời máy chỉ mang mã S09
Given DB thử có dữ liệu gói 1,
When chạy thử đường đồng bộ lên cloud và soát thẻ, log, tệp hàng này đổi,
Then bảng stg gói 1 và ba bảng vật thể không nằm trong danh sách đẩy; nút ứng viên không lên Invest; thẻ và log không mang tên hay tên miền
thật của nguồn; cấy một tên thật thì bộ soát đỏ và không in giá trị.

### AC-10 — Số thật khớp từng phần và hiện đúng trên trang Danh bạ (cross-layer)
Given DB thử chép DB máy thu, đã có DA37 và toàn bộ gói 1,
When dựng danh bạ rồi mở `/ops/registry`,
Then:
- tổng dự án trong manifest bằng tổng: giữ nối · chờ thẻ luật · chờ thẻ từng cặp · nút ứng viên; dự án có ở bản 13/11 mà gói 1 không có được đếm riêng;
- tổng toà trong manifest bằng tổng các phần, mỗi phần một câu đếm riêng: thành bí danh · tạo mới · chờ thẻ · thuộc dự án chưa nối;
- ngưỡng khai trước khi thấy số: tỉ lệ vào danh bạ = (thành bí danh + tạo mới) / (tổng toà − thuộc dự án chưa nối − chờ thẻ), ít nhất 95%; chờ thẻ
  không quá 10% số toà của dự án đã nối (bản 13/11 có 93 trong 1.665 dòng toà trùng tên, tức 5,6%); mã hỏng không quá 1%; ít nhất 99% trong 110 toà
  đã có bí danh mã cũ và có căn hoặc có S16 nối về đúng toà cũ; 65 toà gom mã cũ không căn, không S16 là một số đếm riêng, chuyển DA50;
- độ đúng của bí danh đo bằng tín hiệu không phải tên: 0 cặp toà thành bí danh mà lệch tầng theo luật AC-5 (S09 ít hơn số tầng có căn S16 quá 2, hoặc S16 có căn ở tầng S09 không kê, không so tầng 1). Vượt một ngưỡng thì lượt đo
  đỏ và dừng để người quyết, không tự nới;
- số dự án, toà trên trang bằng câu đếm trên cùng DB; đích trên dữ liệu thật: 198 dự án có toà, 928 toà, 23.708 tầng; 0 toà hai UPI; bước S09 tạo 0 căn; chạy lại ra cùng số.

### AC-11 — Không sinh nút trùng nơi
Given DB thử chép DB máy thu đã dựng danh bạ với gói 1 S09,
When đọc mọi bản ghi S09 đang xét kèm bằng chứng toà chung với nút đã có, rồi chạy `timNutTrungNoi` của luật khớp trọn dùng chung (`pipeline/lib/khop-tron.mjs`),
Then hàm trả mảng rỗng: không nút S09 mới nào trùng nơi với nút đã có; mọi nút đã có trước lượt vẫn giữ ít nhất số toà như trước. Đối chứng dương: cấy một bản ghi nằm sai nút thì hàm trả đúng một dòng. Bước nối dùng chính luật khớp ấy, không có bộ khớp thứ hai.

## Coverage

Trục quét theo preset entity-feature và risk-premortem cho «gói 1 S09 → danh bạ»:

- Dữ liệu vào: nạp bản thu (AC-1), khớp manifest (AC-2).
- Cấp danh bạ: dự án (AC-3), toà (AC-4), cấu trúc S16 (AC-5), tầng (AC-6).
- Vòng đời: chạy lại, thứ tự nguồn (AC-8).
- Ranh giới: không lộ nguồn, nút ứng viên không lên Invest (AC-9).
- Kết quả thật: các phần cộng đủ, số trên màn (AC-10), không nút trùng nơi (AC-11).

Core: AC-1…AC-6, AC-8…AC-11. Bảng phủ ca đếm từ DB máy thu ở thiết kế §4.

Later: khu và căn thấp tầng (sau bản thu bù) · căn cao tầng (DA43) · nối tin vào nút ứng viên · thuộc tính căn.

Never: bước S09 đổi cột gốc của toà có sẵn, xoá hay gộp toà, căn có sẵn.

## Đường đo

- «Snapshot gói 1 nạp vào stg, số khớp manifest»: AC-2.
- «Số dự án có toà, số toà và số tầng S09 đi từ hiện trạng lên đúng lệnh đếm»: AC-10, đích 198 dự án, 928 toà, 23.708 tầng.
- «0 toà hai UPI»: AC-4, AC-10.
- «0 nút S09 trùng nơi với nút đã có, nút cũ không rỗng đi»: AC-11.
- «Toà trùng thành bí danh, lệch lên thẻ»: AC-4, AC-5.
- «Chạy lại không đổi số»: AC-8, AC-10.
- Lệnh đếm: `node pipeline/scripts/danh-ba-s09-toa-that.mjs --dem`, tạo ở bước thi công, chỉ đọc.

## Out of scope

- Thu gói 1, DATA-CONTRACT và bộ nạp: việc của làn thu.
- Áp migration và dựng trên DB máy thu: theo hồ sơ áp sau khi PR gộp.
- Khu và căn thấp tầng: Mạnh chốt 19/11 «Chỉ làm cao tầng», vì bản thu thiếu 55% căn và 48/91 khu bị cắt; làm ở lượt sau khi có bản thu bù, theo lời Hỏi-1 đã duyệt.
- Căn cao tầng: DA43.
- Nối tin vào nút ứng viên và đưa nút ứng viên lên Invest.
- Thuộc tính căn (diện tích, phòng ngủ, hướng, giá).

## Notes

Xuất xứ bộ nạp: `pipeline/import-s09-danh-ba.mjs` và test của nó là mã làn thu, gộp nguyên nhánh `origin/zcode/nap-s09-danh-ba`
@c6609cc9b vào nhánh DA42 ngày 22/11 (merge 8b8bfa163, không chép tệp, không sửa mã). Người soát: phiên điều phối liên làn (LL),
đạt, test 9/9. Lệnh kiểm: `cd pipeline && bash ../db/db-thu.sh oneinvest_suite_pipeline --chay node --test import-s09-danh-ba.test.mjs`.
Lỗi logic thu phát hiện ở DA42 thì báo giám sát để trả làn thu, không sửa tại chỗ.

Sửa tích hợp bộ nạp (22/11, giám sát và LL cùng phán «P1 sửa như lỗi tích hợp»; LL xác nhận ZCode không sửa dở tệp): item thiếu
`kind` hay `sourceId` từng được ghi thành chuỗi rỗng, đụng CHECK của 115 và làm cả lượt ROLLBACK. Nay bỏ item đó, đếm theo lý do
(`phi_object`, `thieu_kind`, `thieu_source_id`), lượt nạp tiếp tục; thông điệp sai băm thêm chữ «sai băm». Không đổi cách đọc bản
thu, khuôn item hay DATA-CONTRACT. Ca test «thiếu-mã» (đỏ khi gỡ lọc) trong `import-s09-danh-ba.test.mjs`, test bộ nạp 10/10. Đo
22/11 bằng hàm đọc của bộ nạp: ba bản thu thật sẽ nạp (19T004959637, 20T015947402, 20T052953464) có **0** item thiếu kind, 0 thiếu
sourceId, 0 phi-object — sửa này là rào cho bản thu sau, không đổi số của lượt áp thật (6.951 dòng).

Ngoài hợp đồng, trỏ hàng DA57 `go-bi-danh-ten-toa-s09-khi-s16-lech-tang` (giám sát cắt 22/11): khi S16 về SAU lượt dựng S09, toà
S09 đúc trước khi biết lệch tầng vẫn giữ bí danh tên (bước S16 phát thẻ, đúc toà riêng, không gỡ tên toà S09) — lượt sau có thể
gắn nhầm theo tên. Kế hoạch thu toàn bộ nguồn kho đưa S16 của khoảng 163 dự án về sau S09, đúng thứ tự này. Chuông báo chỉ đọc tới
khi DA57 gộp: `node pipeline/scripts/danh-ba-s09-chuong-ten-lech.mjs` (thoát 1 khi khác 0), chạy sau mỗi lượt nạp S16 mới. Itest E8
chứng chuông hai chiều (0 khi cùng bộ dòng stg, 1 ở kịch bản S16 về sau). Số chạy thử trên bản chép DB máy thu ghi ở T5 (mong đợi 0
vì S16 đã ở stg lúc S09 dựng); trên DB máy thu hiện tại (chưa áp 115/125) lệnh in 0.

Known limits:
- **Mã tỉnh cũ (`khong_iso`)**: 11 dự án gói 1 mang mã tỉnh cũ 74, 77 (trước sáp nhập), không có trong `iso_regions`, nên 28 toà
  của chúng không đúc được; bước dựng đếm riêng ở `khong_iso`. Đổi mã tỉnh cũ sang mới là một hàng riêng, không làm trong DA42.
  Đo T5 ngày 22/11 trên bản chép: `khong_iso` = 16 toà thuộc dự án ĐÃ NỐI; 12 toà còn lại của 28 thuộc dự án chưa nối nên nằm ở
  phần «thuộc dự án chưa nối» của phép cộng toà. Hàng đổi mã tỉnh là DA54.
  Danh sách (mã dự án nguồn · mã tỉnh · số toà), đo 22/11 trên bản thu 2026-11-19:
  85f78e95-9dc7-d503-de5d-c320c0dfb176 · 74 · 2 — 110b7c52-d42c-8bdf-f3cf-d6dd1d34342f · 74 · 4 —
  be6469a1-e656-12bc-8f92-f9aff6bbeff3 · 74 · 1 — 6763a3be-a57f-6ddb-b668-6d7e6cc1141a · 77 · 3 —
  ec4d0b77-2c91-08fd-989e-5493d6b88542 · 74 · 3 — 1ac2650b-caba-5d43-459c-cd4b80407f3d · 74 · 3 —
  74db731f-ed69-c0f0-85c6-f5668a50e8a3 · 74 · 4 — a98b8230-3aae-44bd-18af-5601cd38b02e · 74 · 2 —
  745d3571-b53c-e0b5-afd0-47173d9e6225 · 74 · 2 — 476a937c-3e24-c330-5f97-a1fa22951b5f · 77 · 2 —
  b4a5a02c-ab42-b573-8d04-4a06b709ef43 · 74 · 2.
