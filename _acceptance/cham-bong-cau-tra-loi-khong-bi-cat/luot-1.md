# Thấy gì ở lượt thử thật 1 của NB1 (22/11)

Lượt `cb-2026-11-22T052458782Z`, chế độ thử, 30 thẻ, Haiku 5.5 (đi Anthropic thẳng) + DeepSeek V4.1 Flash (Gateway), main
`b28bdbd3d`, 05:24:57Z → 05:28:14Z. Thư mục lượt trên máy thu: `state/cham-bong-bo-sung-tin/cb-2026-11-22T052458782Z/` (ngoài
git, giữ nguyên làm bằng chứng). Probe E11: ĐỎ `thẻ đủ hai kết quả 28/30`; DB máy thu trước = sau.

## Lời gọi và tiền

| Model | Lời gọi | Lỗi | Token vào / ra | USD |
|---|---:|---:|---:|---:|
| Haiku 5.5 | 30 | 2 | 28.423 / 12.125 | 0,0089 |
| DeepSeek V4.1 Flash | 30 | 1 | 21.357 / 13.240 | 0,0223 |

Ba lỗi đều `json-hong` với đúng 1.000 token ra (trần `MAX_TOKEN_RA`): câu trả lời bị cắt.

## Chẩn đoán độ dài câu trả lời (60 lời gọi, 0 lời gọi mới)

| Số ô hỏi | Lời gọi | Trung vị token ra | Lớn nhất |
|---:|---:|---:|---:|
| 1 | 18 | 160 | 378 |
| 2 | 32 | 294 | 1.000 (bị cắt) |
| 3 | 8 | 932 | 1.000 (bị cắt) |
| 4 | 2 | 980 | 980 |

Tương quan token ra với số ô 0,74, với độ dài JSON trả về 0,79, với token vào 0,05. Token ra gấp 4–5 lần (độ dài JSON / 3,2).

## Kết cục trên 60 đề xuất

| Ô | Nguồn | Khớp | Bỏ trống | Lệch hai lần | Đồng thuận bác | Chưa đủ |
|---|---|---:|---:|---:|---:|---:|
| Số WC | E2 | 23 | 5 | 0 | 0 | 2 |
| Phòng ngủ | E2 | 5 | 0 | 0 | 3 | 1 |
| Toà | E2 | 4 | 5 | 1 | 0 | 0 |
| Đường | E2 | 1 | 0 | 0 | 0 | 1 |
| Loại hình | E1 | 0 | 2 | 0 | 0 | 1 |
| Loại hình | E2 | 0 | 5 | 0 | 0 | 1 |

Ca biên theo ô: số WC 5 · phòng ngủ 3 · toà 6 · đường 0 · loại hình 7.

## Phát hiện chính: loại hình 0/8 khớp

Trên 7 đề xuất loại hình có đủ hai lần đọc: Haiku trả rỗng cả 7 (`khong-suy-ra` — lời nhắc đòi «chữ bài nói thẳng»); DeepSeek
trả `apartment` cả 7, trích «1N1WC_37.2 m²», «CĂN 2PN2WC», «căn: S103 Phòng ngủ: 2…», «2pn Ori S603», «Loại căn: 2N2VS» — tức suy
loại hình từ số phòng ngủ hay chữ «căn», không phải chữ bài nói thẳng. Hai đề xuất E1 (luật) là `house` trên thẻ mà DeepSeek đọc
`apartment`. Kết cục: 7 «bỏ trống», 1 chưa đủ. Lời nhắc loại hình không phân xử được ở dạng hiện tại — để hàng riêng sau lượt 2.

## Lệch trên thẻ (6) và ô đã có (16)

- 6 đề xuất mang cờ lệch trên thẻ, đều ở ô loại hình: thẻ có cả đề xuất E1 `house` và E2 `apartment` cho cùng ô.
- 16 đề xuất rơi vào ô tin đã có giá trị quan sát: phòng ngủ 9 (khớp 5, đồng thuận bác 3, chưa đủ 1), toà 7 (khớp 4, bỏ trống 2,
  lệch hai lần 1). Ba ca «đồng thuận bác» ở phòng ngủ đều trên ô đã có giá trị quan sát — đáng soi ở NB5.
