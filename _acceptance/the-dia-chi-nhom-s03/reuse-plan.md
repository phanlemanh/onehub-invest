# Kế hoạch dùng lại — the-dia-chi-nhom-s03 (TG1)

Trang `/ops/group-cards` (dời từ lưới Nhóm S03 của `/ops/sources`, xem sổ quyết định: `/ops/sources` chỉ admin).
Khuôn theo `/ops/people`: PageHeader → Frame + data-grid → Dialog.

## Screen: Thẻ địa chỉ nhóm
Pattern: none — trang quản lý dạng bảng của Ops, ghép từ thành phần đã cài như /ops/people

| Slot | Rung | Use | Reason |
|---|---|---|---|
| đầu trang | 3 | PageHeader | — |
| khung bảng | 5 | reui/frame + reui/data-grid | khuôn bảng của /ops/people |
| badge trạng thái thẻ | 4 | reui/badge (variant=warning-light) | Nháp; Đã duyệt success-light, Bác destructive-light |
| nút Duyệt thẻ | 4 | ui/button (variant=outline) | thẻ nháp dùng variant mặc định |
| trống | 5 | ui/empty + ui/button | lệnh dựng nháp chép được |
| đang tải | 3 | ui/skeleton | — |
| lỗi | 3 | RegionError | Alert + Thử lại có sẵn |
| bản cloud | 3 | LocalOnlyAlert | — |

## Screen: Hộp duyệt thẻ
Pattern: none — mở rộng hộp «Khai thị trường, dự án» của sổ đơn vị

| Slot | Rung | Use | Reason |
|---|---|---|---|
| hộp | 3 | ui/dialog | — |
| ô dự án (nhiều) | 5 | ui/combobox + ui/field | dùng lại ChonNhieu của so-don-vi-dialog |
| ô phường, phân khu, bán/thuê (một) | 5 | ui/combobox + ui/button + ui/field | khuôn chọn một có tìm của block form-5 |
| ghi chú, lý do bác | 3 | ui/textarea | — |
| lỗi lưu, 409 | 4 | reui/alert (variant=destructive) | kèm nút Tải lại thẻ |
| hỏi bỏ thay đổi | 4 | reui/alert (variant=warning) | — |
| nút Nhận, Lưu sửa, Bác | 3 | ui/button | — |
