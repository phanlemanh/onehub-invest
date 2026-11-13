---
schema_version: 1
feature: Mẫu bài căn hộ S03 của Ocean Park 1 và Grand Park chọn phân tầng theo khu và mức gắn, có nháp nhãn toà, trục, căn do tác tử điền kèm câu trích, nạp vào eval_label_items chờ người duyệt trên /ops/labels, và đóng băng được thành tập test có băm cho PL20
slug: tap-nhan-ghep-tin-hai-khu
owner: phanlemanh@gmail.com
risk_tier: T2
surfaces: [cli, data, ui]
status: draft
design_doc: docs/superpowers/specs/2026-11-13-tap-nhan-ghep-tin-hai-khu-design.md
---

# Acceptance Contract: tap-nhan-ghep-tin-hai-khu

## Context

PL20 chưa có tập test nhãn người ở mức toà, trục nên không đo được cận dưới Wilson nhóm A (0,95). Số đo S1 của PL20
(12/11): OP1 6.301 bài căn hộ (toà 2.415, trục 166, căn 0), GP 4.683 (toà 506, trục 1, căn 0). Mạnh chốt 06/11 trợ lý điền
nháp, Mạnh duyệt; Cổng Đáng «build» 13/11. Hàng đứng sau DA31; chạy thật sau khi DA31 gộp.

## Criteria

- AC-1: Given DB thử có bài căn hộ S03 của hai khu (fixture viết trước, có bài trùng chữ và bài sự kiện), When chạy
  chọn mẫu lát `hai-khu-ghep` hai lần cùng seed, Then hai lần ra cùng tập `ref_id` (băm danh sách bằng nhau) và lần hai
  thêm 0 dòng; seed khác ra tập khác; mỗi nhóm bài trùng chữ chỉ có một đại diện.
- AC-2: Given fixture có năm tầng khu × mức gắn với số bài viết trước (một tầng đủ, một tầng thiếu dưới 75), When chọn mẫu,
  Then mỗi tầng chọn đúng `min(75, số bài khác nhau)` (một assert mỗi tầng), `stratum` ghi đúng tầng, và báo cáo in
  «thiếu N» cùng cận dưới Wilson tối đa cho tầng thiếu.
- AC-3: Given bảng mẫu tên nhóm hai khu và fixture có nhóm OP1, nhóm GP, nhóm khớp cả hai mẫu, nhóm không khớp mẫu nào,
  When chọn mẫu, Then bài chỉ vào lát khi nhóm khớp đúng một khu, khu ghi theo nhóm (một assert mỗi loại nhóm).
- AC-4: Given bộ phân tầng mức gắn và ma trận viết trước (tên toà khớp danh bạ, mã trục khớp, tên toà không có trong danh
  bạ, không nêu toà, tên toà mơ hồ hai toà), When phân tầng, Then ra `toa`/`truc`/`khong` đúng từng ô; bộ phân tầng chỉ đọc
  chữ bài và bảng `buildings`, `stacks`; chọn mẫu trên DB thử đã thu quyền đọc `field_assertions` vẫn chạy xong và cấy phát
  biểu PL20 vào DB thử không đổi băm tập và `stratum`.
- AC-5 (cross-layer): Given các bài đã chọn và tác tử giả trả nhãn kèm câu trích, When chạy nháp, Then `eval_label_items.draft`
  của từng bài có ô `building`, `stack`, `unit_number` kèm `can_cu`; câu trích không có trong chữ bài thì ô đó trống;
  `nhapTuDraft` của app đọc nháp ra đúng các ô (round-trip qua mã thật của màn); trên `/ops/labels` lát `hai-khu-ghep`,
  ba ô Vị trí hiện giá trị điền sẵn, sửa một ô rồi Lưu thì `eval_labels` có đúng ba trường của người gắn.
- AC-6: Given bài đã có nhãn người trong `eval_labels`, When chạy nháp lại, Then `draft` của bài đó không đổi, lệnh ghi 0
  dòng vào `eval_labels`, và bài chưa có nhãn người vẫn được nháp (đối chứng dương cùng fixture).
- AC-7: Given module nháp, When quét tĩnh và chạy trên DB thử đã thu quyền đọc `field_assertions`, Then không tham chiếu
  `field_assertions`, `UniversalPropertyId`, `UniversalPropertySubId` hay mã PL20, và lệnh vẫn chạy xong; đối chứng: bản
  đột biến đọc `field_assertions` thì quét đỏ nêu tên tệp và DB trả lỗi quyền.
- AC-8: Given lát có bài đã duyệt (nhãn ghi qua hàm lưu thật của màn `ghiNhan`, có bài hai người gắn khớp và bài hai người
  gắn lệch), When đóng băng hai lần trên cùng dữ liệu, Then hai tệp có cùng băm sha256 in trong tệp; đổi một nhãn người thì
  băm đổi; mỗi `ref_id` đúng một dòng, bài hai người gắn lệch bị loại và đếm riêng; tệp chỉ có `ref_id`, `stratum`, nhãn ba
  trường — không chữ bài, câu trích, người gắn.
- AC-9 (cross-layer): Given DB thử chép từ DB máy thu có toà S09 của hai khu (DA31 đã gộp; chưa có thì thoát 2 «chưa
  DA31»), When chạy chọn mẫu và phân tầng (không gọi model), Then in bảng nhóm → khu kèm số bài và mọi nhóm khớp bảng kỳ
  vọng viết trước (nhóm lạ hay thiếu thì đỏ), in số bài có và chọn mỗi tầng, cả năm tầng đủ 75 (tầng nào dưới 75 thì thoát
  1 nêu tầng), tổng trong 300–450, và 0 dòng `eval_labels` đổi so với trước lượt.
- AC-10: Given diff của hàng so với main, When quét, Then không tệp nào dưới `db/migrations/`, `pipeline/sync-cloud.mjs`
  và `app/` không đổi, và không dòng thêm nào chứa tên nguồn thật (danh sách tên đọc được không rỗng).

## Coverage

- Trục tầng: khu (OP1, GP) × mức gắn (toà, trục, không) — năm tầng có, căn và trục GP gộp có tên (AC-2, AC-4). Thước: ma
  trận viết trước, một assert mỗi tầng.
- Trục khu của nhóm: khớp một khu · khớp hai khu · không khớp (AC-3).
- Trục tất định: cùng seed · seed khác · chạy lại · trùng chữ (AC-1).
- Trục nháp: có căn cứ · căn cứ không có trong bài · không suy được · round-trip qua hàm và màn thật (AC-5).
- Trục nhãn người: đã có nhãn · chưa có (AC-6).
- Trục độc lập với PL20: quét tĩnh · thu quyền DB · đột biến (AC-4, AC-7).
- Trục đóng băng: cùng dữ liệu · đổi một nhãn · hai người khớp · hai người lệch · nội dung tệp (AC-8).
- Trục dữ liệu thật: bản chép DB máy thu sau DA31, bảng nhóm → khu, năm tầng đủ cỡ (AC-9).
- Trục ranh giới: không migration, không sync, không app, không tên nguồn (AC-10).

## Đường đo

- «Chọn mẫu chạy lại ra cùng tập»: AC-1.
- «Mỗi tầng đủ cỡ cho cận dưới Wilson ở ngưỡng nhóm A»: AC-2 (cỡ, báo thiếu), AC-9 (số thật sau DA31).
- «Nháp không ghi đè nhãn người»: AC-6.
- «Tập đóng băng có băm, đổi một dòng thì băm đổi»: AC-8.
- «Tác tử điền nháp không đọc kết quả của bộ gắn PL20»: AC-7 (và AC-4 cho bộ phân tầng).

## Out of scope

- Người duyệt nháp trên `/ops/labels` (việc vận hành, ra khỏi kho); PL20 đo trên phần đã duyệt.
- Gắn mù không có nháp (Q3, hoãn tới PL21).
- Đổi màn `/ops/labels` (hiện câu trích cạnh ô) — màn đã đọc `draft`.
- Mức căn và trục Grand Park đủ cỡ Wilson — chờ danh bạ và đọc tầng (DA31, GC).
- Gắn dự án cho nhóm S03 trong sổ nhóm (DV6).

## Notes

- Lượt nạp thật vào DB máy thu (gọi model) chạy sau gộp — xem Hỏi-2 trong sổ.
