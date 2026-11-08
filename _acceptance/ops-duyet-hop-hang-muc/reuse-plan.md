## Screen: Hàng duyệt
Pattern: @reui/solution-agents-5

| Slot | Rung | Use | Reason |
|---|---|---|---|
| đầu trang ba số | 3 | PageHeader | bắt buộc theo routes.md; ba số là `stats` |
| hộp hạng mục | 2 | @reui/solution-agents-9 | chỉ lấy cột trái ScopeRail (Mạnh duyệt §f4); đã cài, ghi catalog.md |
| mục hạng mục | 5 | ui/item + reui/badge | mỗi mục: nhãn, số chờ (badge), dòng mô tả cũ nhất · trung vị |
| bảng thẻ | 3 | reui/frame | giữ data-grid và Frame «Danh sách thẻ» hiện có |
| quyết định gần đây | 5 | reui/frame + reui/timeline | chuyển thể recent-decisions của solution-agents-5: Card → Frame theo họ khung trang |
| gần đây trống | 5 | ui/empty + ui/button (variant=outline) | trống có một hành động: Duyệt liền |
| đang tải | 3 | ui/skeleton | đúng bố cục đầu trang + hộp + bảng |

## Screen: Sheet chế độ duyệt
Pattern: @reui/solution-agents-5

| Slot | Rung | Use | Reason |
|---|---|---|---|
| thanh tiến độ k/N | 5 | ui/button (variant=ghost) + ui/kbd | chữ «k/N · hạng mục», nút Trước/Sau mang Kbd K/J |
| gợi ý phím trên nút đáp án | 3 | ui/kbd | mỗi nút một số |
| bảng phím | 2 | @reui/c-dialog-9 | Mạnh duyệt §f4; Dialog nhỏ, không Sheet chồng |
| hết thẻ | 5 | ui/empty + ui/button (variant=outline) | sang hạng mục kế hay đóng |
| toast hoàn tác | 3 | ui/sonner | `action` «Hoàn tác», 5 giây |
| hook phím, hàng chờ gửi | 1 | skip | logic, không phần nhìn — ReUI không có khối phím tắt (§f2 đã tra) |
