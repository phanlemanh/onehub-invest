# Hình tại điểm quyết định — s03-nhan-loai-tin-rong

| Điểm | Đếm | Hình |
|---|---|---|
| Thứ tự quyết loại tin khi chữ bài không có «bán/cho thuê» (dòng sổ -3) | cần hình: 4 bước nối tiếp, 5 nhánh ra | `luong-suy-loai` |
| Hỏi-1 nguồn suy loại lưu ở đâu (dòng sổ -5) | dưới ngưỡng: 1 nhánh rẽ hai lối | — |
| Hỏi-2 đo nhãn trước hay sau khi giao (dòng sổ -6) | dưới ngưỡng: 1 nhánh rẽ hai lối | — |

## Đề bài `luong-suy-loai`

- Loại hình: flowchart dọc, một cột chính.
- Nút: «Bài S03» → «parsePost có chữ bán/cho thuê?» (có → «giữ loại · nguồn chu-bai») → «Yêu cầu? (khách tìm/xem/cần, cần mua/thuê)» (có → «không thành tin rao, giữ ở stg · yeu-cau») → «Có giá và dấu hiệu BĐS?» (không → «bỏ · bo») → «Tín hiệu bán? (tỷ, thu về, cắt lỗ, hạ giá, chuyển nhượng, BTP)» (có → «Bán · tin-hieu-chu») → «Giá triệu dưới 1 tỷ / «tháng» / pass?» (có → «Thuê · don-vi-gia») → «Mục đích nhóm (tên, rồi tỉ lệ ≥20 bài ≥85%)» → bán / thuê («boi-canh-nhom») / cả hai («bỏ»).
- Nhãn bằng chữ tiếng Việt như trên; mã nguồn in nhỏ dưới mỗi kết cục.
- AC liên quan: AC-1..AC-6.
