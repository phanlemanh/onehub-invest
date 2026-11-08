# Kế hoạch dùng lại — DO1 do-hieu-qua-hang-ngay

Viết bổ sung đầu S3 (sót ở S1, skill `onehub-ui` đòi). Hai màn đều là màn có sẵn; vòng này chỉ thêm ô.

## Screen: Gắn nhãn — lát Mẫu soát cuốn chiếu
Pattern: none — màn danh sách-chi-tiết có sẵn của /ops/labels, giữ nguyên khuôn

| Slot | Rung | Use | Reason |
|---|---|---|---|
| đầu trang | 3 | PageHeader | — |
| biểu mẫu 24 ô | 3 | LabelFormNhom | biểu mẫu nhóm có sẵn, nhận thêm giá trị điền sẵn |
| huy hiệu nháp máy | 4 | reui/badge (variant=info-light) | — |
| trống (chưa rút mẫu) | 5 | ui/empty + reui/frame | khuôn LabelsEmpty có sẵn, đổi chữ và lệnh |
| bộ chọn nhóm | 1 | skip | lát mẫu soát không chia nhóm |

## Screen: Chất lượng dữ liệu — khối Đo hằng ngày
Pattern: none — khối thêm vào trang /ops/quality có sẵn (bảng điều khiển)

| Slot | Rung | Use | Reason |
|---|---|---|---|
| khung khối | 3 | reui/frame | cùng họ khung với các khối khác của trang |
| chọn lát | 3 | ui/tabs | — |
| bảng giữ nháp, bỏ sót, tín hiệu, chuyển bậc, so cặp | 5 | reui/frame + ui/table | bảng số nhỏ, chỉ đọc, không lọc/sắp — trang đã dùng ui/table cho bảng kiểm |
| dấu có ý nghĩa, ít mẫu, skip | 4 | reui/badge (variant=success-light) | — |
| cảnh báo tỉ lệ soát | 4 | reui/alert (variant=warning) | — |
| trống | 5 | ui/empty + reui/frame | — |
| đang tải | 3 | ui/skeleton | — |
| lỗi | 3 | RegionError | khuôn lỗi tại chỗ có nút Thử lại của Ops |
