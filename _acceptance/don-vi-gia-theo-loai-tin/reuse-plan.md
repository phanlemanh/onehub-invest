## Screen: Biểu mẫu theo nhóm — đơn vị giá và hỏi lại giá lạ
Pattern: none — thêm hành vi vào biểu mẫu có sẵn, không màn mới

| Slot | Rung | Use | Reason |
|---|---|---|---|
| nút đơn vị giá | 4 | ui/toggle-group (variant=outline) | — |
| hộp hỏi lại giá | 3 | ui/alert-dialog | — |
| nút Sửa lại | 4 | ui/alert-dialog (AlertDialogCancel variant=ghost) | — |
| nút Vẫn lưu | 3 | ui/alert-dialog | — |

## Screen: Dòng mô tả đầu thẻ — mã thẻ
Pattern: @reui/solution-dev-ops-6

| Slot | Rung | Use | Reason |
|---|---|---|---|
| mã thẻ bấm để chép | 4 | ui/button (variant=link) | chip mã của @reui/solution-dev-ops-6 rút gọn: chính mã là nút, cỡ xs trong dòng mô tả |
| báo không chép được | 3 | ui/sonner | — |
