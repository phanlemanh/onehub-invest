# PL20 — Rà soát độ phủ gắn toà (18/11/2026)

Đo chỉ đọc trên DB máy thu. Mẫu số: 6.389 tin căn hộ S03 (bán 2.368, thuê 4.021). Mức «vùng» gồm phân khu và cụm.

## Thác gắn, từ chắc tới kém chắc

| Bậc | Nguồn | Thêm | Luỹ kế | Tỉ lệ | Tin bán luỹ kế |
|---|---|---:|---:|---:|---:|
| A | Ô tên toà khớp đúng danh bạ | 2.868 | 2.868 | 44,9% | 51,9% |
| B | Ô tên toà sau chuẩn hoá cách viết | 83 | 2.951 | 46,2% | 53,4% |
| C | Toà: luật đọc chữ và model cùng kết quả | 35 | 2.986 | 46,7% | 53,8% |
| F | Vùng: luật đọc chữ và model cùng kết quả | 158 | 3.144 | 49,2% | 55,2% |
| D | Toà: chỉ model đọc ra, có câu trích trong bài | 47 | 3.191 | 49,9% | 56,0% |
| G | Vùng: chỉ model đọc ra, có câu trích trong bài | 126 | 3.317 | 51,9% | 57,1% |
| E | Toà: chỉ luật đọc chữ, model chưa xác nhận | 239 | 3.556 | 55,7% | 61,2% |
| H | Vùng: chỉ luật đọc chữ, model chưa xác nhận | 297 | 3.853 | 60,3% | 64,4% |

Bậc A đến G (51,9%) có 2.473 tin tới toà (38,7%) và 844 tin tới vùng (13,2%).

## Độ tin của từng nguồn (đối chiếu chéo, chưa phải nhãn người)

| Phép đối chiếu | Đồng ý | Tỉ lệ |
|---|---:|---:|
| Model đọc toà so với ô tên toà | 887/934 | 95,0% |
| Model đọc vùng so với ô tên toà | 108/112 | 96,4% |
| Luật đọc chữ so với ô tên toà | 2.127/2.154 | 98,7% |
| Luật và model, trên tin không có ô tên toà, mức toà | 35/42 | 83,3% |
| Luật và model, trên tin không có ô tên toà, mức vùng | 158/173 | 91,3% |

Con số 98,7% bị thổi phồng vì ô tên toà cũng do bộ đọc rút từ chính chữ bài. Hai dòng cuối sát thực tế hơn: ở nhóm tin khó, hai bên chỉ đồng ý
83–91%, nên bậc E và H chưa đủ tin để gắn khi chỉ có một bên.

## Đòn bẩy đã đo và loại

- **Nhóm chuyên một toà**: nhóm thuần nhất chỉ có 20% tin cùng một vùng, không suy được toà từ nhóm.
- **Tin đăng lại của cùng người bán**: các cặp đã gắn chỉ cùng toà 77,5%, dưới ngưỡng.
- **Bài khác của cùng tin, mã căn**: không thêm tin nào ngoài ô tên toà.

## Phần còn lại sau bậc H (2.536 tin)

| Lý do | Số tin |
|---|---:|
| Bài không nêu toà, phân khu nào | 1.721 |
| Bài nêu nhiều toà | 256 |
| Tên toà ngoài danh bạ (H1–H3, M1–M3, C1Z1, G1–G3, A1–A3…) | 251 |
| Chưa có dự án | 132 |
| Dự án chưa có toà trong danh bạ | 54 |
| Các lý do khác | 122 |

Trần thực tế từ chữ bài khoảng 70%: 1.907 tin (29,8%) không có thông tin toà hoặc không có dự án.

## Hai khoảng trống của phép đo

- Model mới đọc 41,8% số tin; 2.014 tin chưa có bản đọc (191 ở bậc E, 246 ở bậc H, 1.577 trong phần còn lại).
- Tập test PL35 có 158 mục ô tên toà nhưng chỉ 1 mục vùng theo ô tên toà, 17 mục toà và 8 mục vùng từ chữ bài, nên chưa chấm được các nguồn mới.
