---
schema_version: 1
slug: toa-s09-hai-khu-vao-danh-ba
feature: Phân khu và toà S09 của Ocean Park 1 và Grand Park vào danh bạ không sinh toà trùng, nên tên toà bài S03 nêu mà danh bạ chỉ có từ S08 khớp được
owner: phanlemanh@gmail.com
stage: discovery              # discovery | decided | archived
decision:         # build | iterate | park | kill — người ký Cổng 0 điền
decided_by: 
decided_at:     # ISO UTC
prototype:
  base_commit:     # điểm cắt nhánh proto khỏi nhánh chính — guard diffBase khi keep
  disposition:     # keep | archive
lo_trinh_ma: DA31
lo_trinh_tep: docs/plan/lo-trinh.json
---

## Vấn đề & ai gặp

Mở từ hàng DA31 của «Lộ trình onehub-invest» (`docs/plan/lo-trinh.json`).
Nguồn: `onehub-invest-tri-thuc:wiki/nen/nen-chung.md#a29a37b46e61d73aa661ebee868f6a753e1d8d52` · `onehub-invest-tri-thuc:wiki/nen/quyet-dinh.md#484c7d45fd05b60e832fdfec32e37e900c5a83b9` · `onehub-invest-tri-thuc:wiki/dot/no-cat-hang-1311.md#8930a18f0d39e9d314ff3b6fc06e2e166a265920` — chưa có trang: mã B12
Mốc: Tin rao mang dự án và gắn được vào danh bạ; trang dự án trên Invest hiện thông tin có nguồn — chưa có ngày.

Phân khu và toà S09 của Ocean Park 1 và Grand Park vào danh bạ không sinh toà trùng, nên tên toà bài S03 nêu mà danh bạ chỉ có từ S08 khớp được

Vì sao: Số đo S1 của PL20 (12/11): hàng nghìn bài căn hộ hai khu nêu toà không có trong danh bạ (danh bạ chỉ từ S08); nút cổ chai là danh bạ, không phải bộ đọc.

### Số đo nền (13/11, chỉ đọc: bản thu S09 `vn__s09-du-an__2026-11-13T120908161` + DB máy thu)

| | Ocean Park 1 | Grand Park |
|---|---|---|
| Toà trong bản thu S09 | 115 bản ghi = 115 toà | 61 bản ghi = 60 toà (OS2 hai bản ghi) |
| Trong đó cao tầng / dãy thấp tầng / khác | 50 / 64 / 1 toà văn phòng | 60 / 0 / 0 |
| Có ngày bàn giao | 91 | 59 |
| Phân khu S09 | 13 (7 cao tầng, 6 thấp tầng) | 7 |
| Toà danh bạ hiện có (từ S08) | 18 tên | 46 tên (51 toà, gồm hai phân khu Lumiere) |
| Trùng S09 → thành bí danh | 12 | 34 |
| Toà mới từ S09 | 103 | 26 |
| Tên S08 không có trong S09 | 6 (S1, S2, SP, U38, U38A, Z34) | 12 (Lumiere: A, B, C, D, D1, D2, E1, E2, TA–TD) |
| Bài S03 căn hộ có tên toà (sổ nhóm một khu) | 9.256 | 8.202 |
| Gắn được toà — trước | 5.663 | 3.772 |
| Gắn được toà — sau khi thêm toà S09 (ước, cùng thước) | 8.295 | 5.689 |
| Bài chỉ nêu cụm («S10», «R1») — cần cấp cụm | 102 | 2.486 |
| Tên toà còn thiếu sau S09 | 39 (H1–H3, M1–M3, C1Z1… — toà dự án khác lẫn nhóm) | 21 (lẻ, ≤ 5 bài mỗi tên) |

- Hai bản thu Mạnh mở tay (114111483, 114545270) chỉ có 1 item mỗi bản — không so được; bản giữ có ghi chú «meta/notes bị
  sửa 12:16Z 13/11, payload không kiểm được» (Mạnh quyết giữ, 13/11).
- Mọi lời gọi tới nguồn S09 đang đóng băng: hàng chỉ đọc bản thu đã có.

## Ngưỡng chết / ngưỡng UAT

- Câu hỏi phép đo trả lời: [đề xuất] đã đạt «Hai khu có đủ toà của snapshot S09 (115 và 61); 0 toà có hai UPI; toà khớp toà S08 thành bí danh, không khớp thì lên thẻ; Grand Park có cấp phân khu để bài ghi phân khu thay toà phân giải được; dựng lại hai lần không đổi khoá; số bài S03 hai khu gắn được toà trước, sau khớp đếm độc lập» chưa?
- Kết quả nào là SỐNG: [đề xuất] Hai khu có đủ toà của snapshot S09 (115 và 61); 0 toà có hai UPI; toà khớp toà S08 thành bí danh, không khớp thì lên thẻ; Grand Park có cấp phân khu để bài ghi phân khu thay toà phân giải được; dựng lại hai lần không đổi khoá; số bài S03 hai khu gắn được toà trước, sau khớp đếm độc lập
- Kết quả nào là CHẾT: [đề xuất] chưa đạt «Hai khu có đủ toà của snapshot S09 (115 và 61); 0 toà có hai UPI; toà khớp toà S08 thành bí danh, không khớp thì lên thẻ; Grand Park có cấp phân khu để bài ghi phân khu thay toà phân giải được; dựng lại hai lần không đổi khoá; số bài S03 hai khu gắn được toà trước, sau khớp đếm độc lập» khi hết timebox
- Timebox: …
