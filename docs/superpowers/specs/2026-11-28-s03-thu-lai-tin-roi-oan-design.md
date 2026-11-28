# PL43 — S03 thu lại tin rơi oan (`s03-thu-lai-tin-roi-oan`)

## Vấn đề

Mạnh nêu 28/11: tin S03 vào kho thấp. Audit chỉ đọc 28/11 (`research-local/audit-s03-vao-kho-2811/BAO-CAO.md`, mục 3, 4, 6) kết
luận phần lớn bài rơi đúng (ảnh, Yêu cầu, đăng lại), phần rơi oan là bài có chữ mà luật regex của `suyLoai` bỏ sót. Audit ước
+500–800 tin. Hàng này thu lại phần oan, không đụng phần rơi đúng.

Soi 13 bài mẫu oan của audit qua bộ đọc hiện tại (`parsePost` + `suyLoai`), 12 bài rơi vì ba gốc:

1. **`\b` ASCII trong `DAU_HIEU_BDS`.** `\b` của JS chỉ hiểu chữ ASCII: «2PN2w», «2pn2wc» (sau «pn» là chữ số), «2 phòng ngủ +»
   («ủ» không phải chữ ASCII) đều trượt. «Stu», «2 NGỦ», «1 ngủ» không có trong luật.
2. **Giá từ 1 tỷ mà không có tín hiệu bán.** «Giá: 3.7 (thu nét về)», «Giá: 1.650 net» đã đọc đúng 3,7 tỷ và 1,65 tỷ, nhưng bài
   không có chữ «bán», «tỷ» hay tín hiệu bán; nhóm đăng cả bán lẫn thuê nên `suyLoai` bỏ. Giá từ 1 tỷ không bao giờ là thuê (AC-2
   của s03-nhan-loai-tin-rong, đã có trong `suyLoai`).
3. **«1t920»** — dạng giá «<tỷ>t<phần lẻ>» chưa có luật đọc.

Bài thứ 13 («chốt giảm thêm 2.6 tỷ btp») rơi vì «giảm» đứng trước giá làm bộ chặn số ngữ cảnh coi là khoản giảm — ngoài phạm vi.

Không có ngưỡng «chữ ngắn dưới 40 ký tự» trong mã: audit gom bài ngắn thành một nhóm để đếm, còn bài ngắn rơi vì ba gốc trên
(«s6 2pn2wc … 2.6 tỷ btp», «BE5 Stu … 2.1 tỷ btp»). Sửa ba gốc là sửa luôn nhóm ấy.

## Bảng phủ ca (DB máy thu 28/11, chỉ đọc; 162.979 bài có chữ; số bài và số khoá gom tin mới)

Thước mô phỏng chạy chính `parsePost`, `mucDichNhom`, `suyLoai`, `chinh/lyDoGiaPhiLy`, `repostKey` của transform trên phiên chỉ đọc,
từng phần bật riêng; «khoá mới» là khoá gom tin chưa có ở lượt gốc (xấp xỉ số tin; thiếu bước gán phường nên lệch vài phần trăm).
Nhãn là nhãn model đọc gộp hợp lệ mới nhất (`silver_labels` S03).

| Chiều | Giá trị | Bài mới nhận | Khoá mới | Nhãn offer · inquiry · chưa nhãn | Giữ? | Ai đọc đầu ra này phía sau |
|---|---|---:|---:|---|---|---|
| A. Dấu hiệu BĐS | «N pn/wc/vs/phòng ngủ» kết bằng lookahead chữ có dấu (không `\b`) · «N ngủ» · «stu/studio» đứng riêng | 2.731 | 150 | 957 · 13 · 1.761 | giữ | xếp hạng giá tốt (420), định vị dự án, ghép toà, cổng Invest listings/rent·sale |
| B. Dấu hiệu BĐS | diện tích đã đọc («55m», «43m» — `dienTichMetTran`, 15–500 m², không sau chữ bề ngang) đi cùng giá | 84 | 18 | 21 · 1 · 62 | giữ | như A |
| C. Loại tin | giá đã đọc từ 1 tỷ, không phải giá/m² → bán (nhóm cả hai) | 779 | 57 | 142 · 1 · 636 | giữ | xếp hạng giá tốt bên bán, cổng Invest listings/sale |
| D. Giá | «1t920», «2t45» → 1,92 tỷ, 2,45 tỷ | 129 | 11 | 18 · 0 · 111 | giữ | như C |
| E. Giá | «4.350 chốt» (số nhóm nghìn trước «chốt») | 0 | 0 | — | **bỏ** — mẫu duy nhất là «chốt giảm», không tách được khỏi khoản giảm |
| F. Yêu cầu đi cặp | mẫu Yêu cầu PL42 nhận đúng các dạng A thêm: «tìm/kiếm 1 ngủ», «cần stu», «ai/ac có stu», «kiếm» như «tìm» | −18 khoá (bài tìm không thành tin) | | | giữ — rào tin rò | thước PL42, `/ops/data-flow` nhánh Yêu cầu |
| G. Yêu cầu hẹp | khẩu hiệu môi giới «Tìm nhà không khó – có em lo», «Tìm căn khó có em lo» không tính là câu tìm | 98 | 5 | 20 · 0 · 78 | giữ | như A |
| G'. Yêu cầu hẹp | bài khai căn theo khuôn («Loại căn:», «Diện tích:», «Giá:») có giá | — | — | 22 · 2 · 81 | **bỏ** — 2/24 bài có nhãn là câu tìm («KHÁCH TÌM 10 CĂN 2PN… Loại căn: 2PN») | |
| G''. Yêu cầu hẹp | bài có «độc quyền/chuyển nhượng/sẵn sổ» có giá | — | — | 17 · 17 · 93 | **bỏ** — người mua cũng viết «sẵn sổ» | |

Cộng A–D + F + G: **9.447 → 9.669 khoá (+222, +2,3%)** trên mô phỏng. Thấp hơn ước +500–800 của audit — audit nhân 0,28 tin mỗi cặp
người gửi + chữ; mô phỏng gom bằng chính `repostKey`, nhiều bài mới nhận gộp vào tin đã có.

**Luật Yêu cầu gốc, không phải PL42, gây phần lớn bài Yêu cầu bị model gọi là tin rao:** 262 bài nhãn offer khớp luật gốc
(«khách … xem/tìm/cần» 214, «tìm mua/thuê/căn/nhà/phòng» 41), chỉ 11 bài khớp tám mẫu PL42. Soi mẫu nhánh «khách … xem»: nhãn
model lẫn lộn — «Khách sale xem liền 2pn Full 12tr» là câu tìm dù nhãn offer. Vì vậy chỉ hẹp ở chỗ đo được sạch (G).

**Rào tin rò (thước PL42):** sau A–D + F + G còn 9 bài nhãn inquiry (trong cửa sổ 12–26/11) lọt thành tin, 8 khoá — câu tìm viết
tự do («Em cần gấp chốt onl 7tr quay xe Stu», «3 tỷ tìm 50-55m wb gấp»). Tin rò hiện 78 → ước ≤ 86, dưới trần 90. Số chính xác đo
trên bản chép ở AC-5.

Ô bỏ (ngoài phạm vi, vì):
- Bài có loại mà giá phi lý (thuê từ 1 tỷ sau bước đổi loại, bán trên 100 tỷ) và bài có dấu hiệu mà thiếu giá (≈ 9,6 nghìn bài):
  phần lớn là bảng quỹ căn, bài mời nhóm, «bán rồi» — mở luật cần đo precision riêng.
- «chốt giảm thêm 2.6 tỷ»: bộ chặn số ngữ cảnh (SV1) đúng ở đa số bài «giảm»; đổi nó là hàng riêng.
- Bài chỉ có ảnh; dựng căn S03; màn Ops (ON25 của U1).

## Thiết kế

1. **`DAU_HIEU_BDS`** (A): thay `\b` sau «pn|phòng ngủ|wc|vs» bằng lookahead chữ có dấu `(?![a-zà-ỹđ])` như nhánh «N n» đã làm
   (s03-cho-vay-khong-phai-bds); thêm «N ngủ» và «stu/studio» đứng riêng (không dính chữ). «1 năm», «3 nữ», «KH 1 nữ» vẫn không
   khớp — ca đỏ ghim trong test.
2. **Diện tích làm dấu hiệu** (B): `suyLoai` nhận bài có giá khi `pr.areaM2 != null` dù chữ không có dấu hiệu nào khác. Diện tích
   trần đã qua bộ lọc 15–500 m² và chữ bề ngang của `dienTichMetTran`.
3. **Giá từ 1 tỷ là bán** (C): trong `suyLoai`, cạnh `coTy || TIN_HIEU_BAN`, thêm «giá đã đọc ≥ 1 tỷ, không phải giá/m²». Thuê
   phi lý từ 1 tỷ vẫn bị chặn bởi bước đổi loại và `lyDoGiaPhiLy` như cũ; sàn giá bán 300 triệu giữ nguyên.
4. **«<tỷ>t<lẻ>»** (D): `parsePost` đọc «1t920», «2t45» khi chưa có giá tỷ nào; không dính chữ cái hay số trước/sau.
5. **Yêu cầu đi cặp** (F): mẫu Yêu cầu PL42 thêm «ngủ» vào dạng số phòng, «stu» vào nhánh «cần», «kiếm» như «tìm», và «ai/ac có
   stu|N pn». Luật bất biến của hàng: dạng chữ nào mới nhận làm dấu hiệu BĐS thì câu tìm viết bằng dạng ấy vẫn là Yêu cầu.
6. **Khẩu hiệu môi giới** (G): gạt «tìm nhà/căn (không) khó» khỏi chữ trước khi xét Yêu cầu.
7. **Đường áp**: như PL42 — lượt transform-zalo kế tiếp sau gộp (15′ hoặc đêm) dựng lại tin; không lượt chạy riêng, không DDL,
   không sửa tay DB. Lùi: revert PR, lượt kế dựng lại như cũ (tin mới nghỉ theo luật nghỉ PL14).

## Ô trên màn đổi và lệnh đo

- Tin S03 đang sống (`sale_offers` source S03): 9.699 (28/11) → +150 trở lên ở lượt đầu chạy mã mới (mô phỏng +222).
- Tin thuê/bán «giá tốt» S03: in trước/sau ở AC-5 (bước 420 xếp lại nhóm; không ngưỡng).
- `/ops/data-flow` S03: «Tin rao mới» tăng; nhánh Yêu cầu đổi theo F và G.
- Lệnh đo: `node pipeline/scripts/do-tin-roi-oan.mjs` (chỉ đọc); bản chép: `--kiem`.
