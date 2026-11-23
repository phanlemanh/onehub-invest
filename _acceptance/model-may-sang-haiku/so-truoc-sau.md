# Số đo trước/sau — MH1 model-may-sang-haiku (AC-8)

Lượt đo: 2026-11-22T02:10:13.911Z · model anthropic/claude-haiku-5.5 · DB máy thu chỉ đọc · trần 1 USD. Máy sinh bằng
`node _acceptance/model-may-sang-haiku/probes/do-truoc-sau.mjs --chay --tran-usd 1`; eval E8 tính lại từ so-truoc-sau.json.

| Số đo | Giá trị | Ngưỡng |
|---|---|---|
| cỡ mẫu enrich | 100 | 100 |
| cỡ mẫu judge | 30 | 30 |
| JSON đọc được (enrich) | 96 % | ≥ 95 % |
| lời giải thích hợp lệ (judge) | 100 % | ≥ 95 % |
| kết luận luật đổi | 0 | 0 |
| tiền đã chi | 0.049427 USD | ≤ 1 USD |
| yêu cầu tới cổng MTPLX | 0 | 0 |

Độ trùng với đề xuất Qwen đã lưu, theo trường — số báo, không phải ngưỡng (Qwen không phải đáp án đúng):

| Trường | Tin Qwen có đề xuất | Trùng | Tỉ lệ trùng | Tin Haiku điền |
|---|---|---|---|---|
| loại hình | 74 | 65 | 87.8 % | 96 |
| phòng ngủ | 2 | 2 | 100 % | 88 |
| phòng tắm | 29 | 22 | 75.9 % | 23 |
| đường | 4 | 2 | 50 % | 3 |
| dự án | 0 | 0 | không có đề xuất Qwen để so | 67 |
| toà | 33 | 21 | 63.6 % | 73 |

