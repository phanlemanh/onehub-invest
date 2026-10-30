## Screen: Sheet ghép căn
Pattern: @reui/solution-agents-5

| Slot | Rung | Use | Reason |
|---|---|---|---|
| khung sheet (đầu, thân cuộn, chân ghim) | 2 | @reui/solution-agents-5 | UI1 đã chuyển thể thành review-detail-sheet.tsx |
| bảng so từng trường | 3 | ui/table | — |
| nhãn So (Khớp / Lệch / Thiếu) | 4 | reui/badge (variant=success-light) | Lệch = warning-light, Thiếu = outline |
| dòng căn cứ dưới giá trị | 6 | color.muted-foreground | chữ text-xs trên ô bảng có sẵn |
| dải ảnh Tin A / Tin B | 2 | @reui/c-attachment-3 | ReviewPhotos có sẵn (UI1) |
| câu ảnh chỉ có ở nguồn | 3 | ui/empty | trạng thái trống của ô ảnh |
| khối toàn văn | 5 | ui/item + ui/separator | tiêu đề tin + dòng meta nhóm + đoạn văn |
| suy luận của AI | 3 | reui/alert | variant=info, nhãn «không phải căn cứ» |
| ô lý do | 5 | ui/field + ui/textarea | nhãn, mô tả đếm ký tự, gợi ý khi trống |
| nút quyết định | 4 | ui/button (variant=destructive) | ba nút có sẵn của UI1, chỉ thêm disabled khi trống lý do |
| điểm Stage B | 1 | skip | bỏ — số không phải căn cứ (RV-L04, Q9) |

## Screen: Sheet bổ sung tin
Pattern: @reui/solution-agents-5

| Slot | Rung | Use | Reason |
|---|---|---|---|
| khung sheet | 2 | @reui/solution-agents-5 | dùng chung với sheet ghép căn |
| trường đề xuất không xung đột | 3 | ui/item | thêm dòng phương pháp + căn cứ vào ItemDescription |
| trường xung đột hai bên | 5 | ui/item + ui/toggle-group | khối ConflictField có sẵn |
| nhãn phương pháp | 4 | reui/badge (variant=info-light) | Luật E1 = info-light, LLM E2 = primary-light (như UI1) |
| dải ảnh tin | 2 | @reui/c-attachment-3 | ReviewPhotos có sẵn |
| khối toàn văn | 5 | ui/item + ui/separator | cùng thành phần với sheet ghép căn |
| ô lý do | 5 | ui/field + ui/textarea | cùng thành phần với sheet ghép căn |
| nút quyết định | 4 | ui/button (variant=outline) | ba nút có sẵn |
