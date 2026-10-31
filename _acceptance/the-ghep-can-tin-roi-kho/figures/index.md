# Hình tại điểm quyết định — the-ghep-can-tin-roi-kho

| Điểm | Đếm | Hình |
|---|---|---|
| Luồng một cặp trong judge-run (người quyết · rời kho · trả lại · chấm) | 4 nhánh rẽ | `luong-cap.html` |
| Hỏi-1 đổi ngưỡng lượt đêm → lượt judge-run | 2 nhánh, dưới ngưỡng vẽ (một câu hỏi) | — |
| Cặp lẫn → ngoài phạm vi (OOS-7) | 1 nhánh | — |

## Đề bài `luong-cap`

- Loại hình: flowchart, một cặp đi qua `chamMotLuot`.
- Nút: «cặp có thẻ người đã quyết?» → có: bỏ qua · không: «cả hai tin còn trong sale_offers?» → không: «rút thẻ chờ → deferred, machine:judge-run, ghi ops_audit rut-roi-kho» · có: «có thẻ máy đã rút?» → có: «trả lại pending, ghi ops_audit tra-lai-tin-ve-kho» → «chấm như cũ» · không: «chấm như cũ».
- Nhãn bằng chữ tiếng Việt; AC liên quan: AC-4 (bỏ qua), AC-1/AC-2 (rút), AC-11 (trả lại), AC-3 (chấm).
