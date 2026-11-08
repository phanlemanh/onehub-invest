# Hình tại điểm quyết định — ops-duyet-hop-hang-muc (Cổng Phạm vi)

| Điểm | Đếm | Hình |
|---|---|---|
| Hỏi-1 thứ tự thẻ (cũ nhất trước / mới nhất trước) | dưới ngưỡng: một lựa chọn sắp xếp, không nhánh | — |
| Hỏi-2 một phím hay hai phím | cần hình: hai nhánh rẽ, mỗi nhánh từ ba bước nối tiếp | `hoi-2-mot-hay-hai-phim.html` + `.png` |
| Hỏi-3 quyết định gần đây của ai | dưới ngưỡng: một bộ lọc, không nhánh | — |

## Đề bài hình `hoi-2-mot-hay-hai-phim`

- Loại hình: hai làn song song (swimlane) cùng một trục bước, so hai cách quyết một thẻ ở chế độ duyệt.
- Làn A «Một phím (máy khuyên)»: «Đọc thẻ» → «Bấm 2» → «Lệnh vào hàng chờ 5 giây · thẻ kế hiện ngay» → (nhánh) «Hoàn tác trong
  5 giây → về thẻ cũ» / «Hết 5 giây → ghi».
- Làn B «Chọn rồi ⌘↵»: «Đọc thẻ» → «Bấm 2 (chọn, nút sáng lên)» → «Bấm ⌘↵» → «Lệnh vào hàng chờ 5 giây · thẻ kế hiện ngay» →
  cùng hai nhánh.
- Chú thích dưới hình: A ít hơn một phím mỗi thẻ; bấm nhầm ở A thì sửa bằng Hoàn tác. Nguồn: báo cáo soát Ops §e9 (B) và §f1 Q7,
  Gói G (A).
- AC liên quan: AC-4, AC-5.
