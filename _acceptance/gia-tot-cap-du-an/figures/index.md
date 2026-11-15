# Hình tại điểm quyết định — gia-tot-cap-du-an

| Điểm | Đếm | Hình |
|---|---|---|
| Hỏi-1 nhóm dự án 5–9 lùi phường | chuỗi chọn cấp 4 bước nối tiếp, 2 nhánh rẽ → cần hình | chuoi-chon-cap |
| Hỏi-2 tin thuê trên danh sách | 1 nhánh có/không — dưới ngưỡng | — |
| Hỏi-3 tab Cần xác minh toàn tập | 3 lối song song, mỗi lối 1 bước — dưới ngưỡng (bảng số ở design §2.4) | — |
| Hỏi-4 một dòng mỗi căn | 1 nhánh — dưới ngưỡng | — |
| Hỏi-5 hạng cấp dự án lên cloud | 2 bước nối (chấm máy thu → sync đêm → cloud/API) + 2 nhánh → cần hình | duong-len-cloud |

## Đề bài

### chuoi-chon-cap (flowchart)
Nút: «Tin hợp lệ» → «Có một dự án (offer_project mot_du_an)?» — không → «Chuỗi phường CG9 (Rẻ trong phường)».
Có → «Nhóm dự án ≥10 phiếu?» — có → «cap du_an, nhãn Giá tốt khi ≤p20 và ≥5% dưới trung vị».
Không → «Nhóm dự án 5–9?» — không (<5) → «Chuỗi phường CG9». Có → «Nhóm phường ≥10?» — có → «Lùi phường (Hỏi-1 khuyến nghị)»; không → «cap du_an, có số, không nhãn (nhom-5-9)».
AC liên quan: AC-1, AC-2.

### duong-len-cloud (flowchart)
Nút: «xep-hang-gia (máy thu, 420 bản CG10)» → «offer_price_rank (có dòng cap du_an)» → «sync-cloud đêm (không sửa, đã chép bảng từ CG9)» → hai nhánh Hỏi-5: «Đi cùng (khuyến nghị): Ops cloud + /v1/deals thấy Giá tốt» / «Đi sau: sửa sync lọc cap = phuong tới nhịp 3».
Nhánh phụ: «project_area_band (106)» → «chỉ máy thu, không sync (cloud đi sau)».
AC liên quan: AC-8, AC-5.
