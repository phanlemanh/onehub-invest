---
schema_version: 1
feature: Tin căn hộ S03 của Ocean Park 1 và Grand Park đã gắn toà được gắn tiếp vào trục hoặc căn của Danh bạ từ mã căn trong bài, tầng suy từ mã căn ghi thành phát biểu riêng, người đọc lấy mức sâu nhất của tin từ view offer_unit
slug: ghep-tin-vao-truc-can
owner: phanlemanh@gmail.com
risk_tier: T3
surfaces: [cli, data]
status: implemented
approved_by: Mạnh
approved_at: 2026-11-24
design_doc: docs/superpowers/specs/2026-11-24-ghep-tin-vao-truc-can-design.md
---

# Acceptance Contract: ghep-tin-vao-truc-can

## Context

Hàng PL36, nhịp trục và căn sau PL20 (mỏ neo mo-neo-1411, QĐ6). Cổng Đáng: lời Mạnh 14/11, GS phán BUILD 24/11 (P4-219).
Hôm nay 0 tin S03 gắn trục hay căn; 2.830 tin hai khu ở mức toà. Hạng T3 vì có migration 131. Mọi số đo: design doc §1–2,
đếm chỉ đọc trên DB máy thu ngày 24/11 sau khi áp 117.

## Acceptance Criteria

- **AC-1** (đọc mã căn) Given ma trận viết trước: mã dạng trục · mã dạng tầng + căn · tiền tố là toà khác cùng dự án · không
  có tiền tố toà · đuôi lạ · hai mã khác nhau trong một bài · bài rao nhiều căn, When chạy hàm gắn trên bài đã có toà, Then
  ra trục · tầng và căn · không gắn `toa-lech` · không gắn `ma-khong-toa` · không gắn `ma-la` · không gắn `ma-nhieu` · không
  gắn `bai-nhieu-can`, một assert mỗi ô, mã rút từ bài thật. Chiều đỏ: bản đột biến bỏ phép so tiền tố toà thì ô `toa-lech`
  đỏ, thông điệp ghim mã căn.
- **AC-2** (trục trong danh bạ) Given toà đã gắn và số căn của mã, When tra trục, Then số căn khớp đúng một trục đang hoạt
  động của chính toà đó (kể cả viết có hay không số 0 đầu) ra trục ấy; số căn không có trục ra `truc-ngoai-danh-ba` và tin
  giữ mức toà; trục cùng số của toà khác không bao giờ được chọn. Chiều đỏ: bản đột biến tra trục trên mọi toà thì ca trục
  toà khác đỏ, thông điệp ghim hai khoá toà.
- **AC-3** (căn và tầng) Given ma trận: mã trục + tầng chữ bài · mã tầng + căn · căn không có ở (trục, tầng) · tầng chữ bài
  lệch tầng từ mã · chỉ có tầng từ mã · tầng `09` của mã với «9» của chữ bài · toà có tầng đặt tên khác số (12A) · mã khớp
  đúng một bí danh mã căn S16/S08 · bí danh trỏ hai căn, When chạy hàm gắn, Then ra căn · căn · trục `can-ngoai-danh-ba` ·
  trục `tang-lech` · căn kèm một phát biểu `floor_raw` rule `ghep-can-tang-tu-ma` có nguồn là mã căn · căn (không ra
  `tang-lech`) · căn đúng tầng danh bạ hoặc giữ trục, không bao giờ căn sai tầng · căn ấy · giữ trục `bi-danh-mo-ho`; tầng
  ghi dạng chuẩn không số 0 đầu; phát biểu `floor_raw` của bộ đọc chữ không bị rút hay đè. Mã rút từ bài thật. Chiều đỏ: bản
  đột biến lấy tầng từ mã khi tầng chữ bài lệch thì ca `tang-lech` đỏ.
- **AC-4** (khuôn phát biểu, cross-layer) Given migration 131 áp trên bản chép đã có 117, When ghi phát biểu, Then mức trục
  ghi `universal_property_sub_id = <stack_key>:*`, mức căn `<stack_key>:<tầng>`, lớp `inferred`, phương pháp `e1_rule`, đúng
  `rule_id` của nguồn, có căn cứ; phát biểu của 117 vẫn ghi được; đầu tệp 131 có dòng đính chính chú thích «Lùi» của 117.
  Chiều đỏ: trục không hoạt động, giá trị sai khuôn, hoặc trường này trên resource khác `Property` thì DB từ chối, thông điệp
  gọi tên trường.
- **AC-5** (một tin một mức, cross-layer) Given ma trận tin nhiều bài: hai bài cùng trục · trục và căn cùng trục · hai trục
  khác nhau · trục không thuộc toà của tin · tin chỉ biết toà · tin `xung_dot` ở `offer_building`, When đọc `offer_unit`, Then
  ra trục · căn · `xung_dot` giữ mức toà · `xung_dot` giữ mức toà · mức toà · không có dòng; view chỉ đọc dòng của bốn
  `rule_id` `ghep-can-*`. Thêm một ô đầu–cuối: hàm gắn thật chạy trên ba bài rút từ bản chép rồi đọc `offer_unit`, mức và
  `stack_key` đúng theo từng tin. Trên bản chép DB máy thu, lệnh in số tin mỗi mức, số tin gắn hai căn bằng **0**, và mọi dòng
  `ghep-can-*` sống của tin không xung đột đều hiện ở đúng một dòng `offer_unit` mức sâu (lệch thì in `offer_id`).
- **AC-6** (chạy lại, đổi dữ liệu, tắt nguồn) Given đã chạy một lượt, When chạy lại không đổi gì, Then 0 chèn 0 rút; When
  toà của bài bị rút, mã căn đổi, trục ngừng hoạt động, Then dòng cũ bị rút và chỉ chèn dòng mới khi còn gắn được; When tắt
  một nguồn, Then lượt kế rút đúng dòng của nguồn đó. Câu rút «thay bởi lượt» của `assert.mjs` không rút dòng `ghep-can-*`
  (một lượt nạp thật trên bản chép: 0 dòng `ghep-can-*` bị rút với lý do `thay-boi-luot`).
- **AC-7** (`offer_building` nhanh, đầu ra giữ nguyên) Given bản chép DB máy thu trước và sau 131, When đọc
  `offer_building`, Then hai đầu ra bằng nhau từng dòng (so băm có sắp xếp), `SELECT count(*)` sau 131 dưới **10 giây**
  (đo trước: 42–55 giây), và `count(*)` cùng `SELECT * … WHERE muc <> 'toa'` của `offer_unit` đều dưới **15 giây**, in số
  giây. Chiều đỏ: bản đột biến đổi một dòng đầu ra thì phép so đỏ, gọi tên `offer_id`.
- **AC-8** (chạy cuối lượt nạp) Given lượt nạp S03, When bước gắn toà xong, Then bước gắn trục, căn chạy trong giao dịch
  riêng, khoá tư vấn riêng, trần 60 giây; lỗi của nó chỉ là một dòng `JOB WARN [ghep-can]` và lượt nạp vẫn thành công; lượt
  khác đang giữ khoá thì bỏ lượt. Chiều đỏ: cấy lỗi vào bước gắn thì lượt nạp vẫn thoát 0 và log có đúng một dòng cảnh báo.
- **AC-9** (số trên màn, chạy khô) Given bản chép DB máy thu, When chạy khô không ghi, Then lệnh in theo khu số tin mức toà,
  trục, căn, xung đột và số theo từng lý do không gắn; tin mức trục cộng căn ở OP1 **≥ 350** (đo trước: 453 tin có mã dạng
  trục, 442 khớp trục); GP in số, không chấm ngưỡng; in từng tin mức căn kèm mã căn nguyên văn, tầng từ mã, tầng danh bạ
  để người soát ở Cổng Bằng chứng.
- **AC-10** (đúng trục trên tập nhãn người) Given tập nhãn trục OP1 đóng băng có băm (Hỏi-2), When lệnh chấm chạy luật trên
  tập, Then lệnh so băm tập với băm đã ghim, tính cận dưới Wilson (95%) của tỉ lệ gắn trục đúng trong số bài máy gắn và
  thoát 1 khi OP1 **dưới 0,95** (nhóm A); GP chỉ báo số (Hỏi-1). Tệp chấm có bảng từng bài sai (mã căn nguyên văn, toà, trục
  máy gắn, trục nhãn người) và người chấm (judgment) đọc bảng đó: các bài sai có chung một kiểu lỗi luật sửa được không.
  0 bài sai là kết quả hợp lệ: khi đó người chấm ghi không có kiểu lỗi nào.
  Chiều đỏ: đổi một nhãn thì băm lệch, lệnh gọi tên tập.

## Coverage

- Trục **dạng mã**: trục · tầng+căn · khác · không có — AC-1, AC-3, AC-9.
- Trục **tiền tố toà**: khớp toà đã gắn · toà khác · không có — AC-1.
- Trục **danh bạ**: trục khớp một · không khớp · căn có · căn không — AC-2, AC-3.
- Trục **tầng**: chữ bài · từ mã · cả hai khớp · cả hai lệch — AC-3.
- Trục **gộp lên tin**: cùng trục · trục + căn · hai trục · trục ngoài toà · chỉ toà · tin xung đột từ PL20 — AC-5.
- Trục **vòng đời**: chạy lại · toà rút · mã đổi · trục nghỉ · tắt nguồn · lượt nạp khác ghi — AC-6, AC-8.
- Trục **khu**: OP1 (chấm) · GP (báo số) — AC-9, AC-10.
- Trục **người đọc phía sau**: `offer_unit` · `offer_building` giữ nguyên và nhanh — AC-5, AC-7.

## Đường đo

- Ngưỡng «cận dưới Wilson gắn trục đạt nhóm A» ở `opportunity.md` ← AC-10, tập nhãn của Hỏi-2.
- «0 tin gắn hai căn» ← AC-5. «Tin chỉ biết toà giữ mức toà» ← AC-5. «Tầng suy từ mã ghi phát biểu riêng có nguồn» ← AC-3.
  «Chạy lại không đổi» ← AC-6. «Gắn căn chỉ khi đủ toà + tầng + số căn» ← AC-3.
- Số trên màn (0 → khoảng 440 tin mức trục hoặc căn) ← AC-9, lệnh chạy khô.

## Out of scope

- GP gắn trục bằng nguồn ngoài chữ bài (S16 tra theo giá, ảnh mặt bằng) — mục chờ GCH1.
- Hiện trục, căn trên Invest hay Ops; CG11 đổi sang so trong trục.
- Tin S05, S06; dự án ngoài Ocean Park 1 và Grand Park.
- Bản đọc của model làm nguồn mã căn — lát này chỉ dùng mã của bộ đọc chữ.
- Áp 131 lên DB máy thu: làm sau khi gộp, theo hồ sơ áp của hàng (năm phần), có chữ ký ở Cổng Bằng chứng.

## Notes

- AC-10 chỉ đo được sau buổi gắn nhãn người trên `/ops/labels` (Hỏi-2).
- AC-3 ô «floor_raw của bộ đọc chữ không bị rút hay đè»: ô chưa có dữ liệu thật, đo bằng bài cấy. Đo chỉ đọc trên DB máy thu
  27/11 (docDauVao + tinhGan): 41.735 bài có toà, trục 9.530, căn 897, tầng suy từ mã 0; bản chép M5 0/40.205. Ca
  `floor-raw-cua-bo-doc-chu-khong-bi-rut-hay-de` tự cấy một bài trong DB lượt (GS phán 27/11).
