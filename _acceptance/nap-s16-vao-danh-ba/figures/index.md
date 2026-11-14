# Hình tại điểm quyết định — nap-s16-vao-danh-ba

| Điểm | Đếm | Hình |
|---|---|---|
| Hỏi-1 — bảng nối năm dự án S16 với nút có sẵn | dưới ngưỡng: một bước, một nhánh (có trong bảng / không) | — |
| Hỏi-2 — toà S16 đúc hay khớp, bậc gì | cần hình: bốn nhánh (khớp một · không khớp có căn · không khớp 0 căn · khớp hai) nối tiếp luật căn | cay-toa-can-s16 |
| descope «bỏ đặc-tả-UX» | dưới ngưỡng: không nhánh | — |
| descope «không đưa tin rao S16» | dưới ngưỡng: không nhánh | — |
| gap-probe — 0 mục human-gate1 | — | — |

## Đề bài hình `cay-toa-can-s16`
- Loại: flowchart (cây quyết định), trái → phải.
- Nút: «Toà S16 (theo toa_id)» → «đã có bí danh S16?» → có: dùng toà · chưa: «so tên với toà có sẵn của khu» → ba nhánh: «khớp một → thêm bí danh» · «khớp hai → thẻ, không ghi» · «không khớp» → «có ≥1 căn theo luật tiền tố?» → có: «đúc toà mới, bậc xac_minh (Hỏi-2)» · không: «nhãn gom, không đúc, chỉ đếm».
- Nhánh căn bên dưới: «Căn S16 (dự án, mã)» → «căn S08 cùng mã?» → cùng toà: «S08 thành bí danh» · khác toà: «thẻ nêu hai toà» · không có: «đúc căn (có trục nếu tách được, không thì căn không trục)».
- AC liên quan: AC-5, AC-6, AC-7.
