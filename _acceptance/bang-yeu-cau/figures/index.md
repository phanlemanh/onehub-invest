# Hình tại điểm quyết định — bang-yeu-cau

| Điểm | Đếm | Hình |
|---|---|---|
| Hỏi-1 — số tiền đứng một mình trong bài Yêu cầu | hai nhánh rẽ (trần · một điểm) | cần hình: `hoi-1-ngan-sach` |
| Hỏi-2 — bài đăng lại cùng người cùng chữ | hai nhánh rẽ (gom · mỗi bài một) | cần hình: `hoi-2-dang-lai` |
| Hỏi-3 — đọc loại hình và mua/thuê từ chữ khi bài không có phát biểu | hai nhánh rẽ (bảng ánh xạ · để trống) | cần hình: `hoi-3-loai-hinh` |
| Các lựa chọn máy đã quyết (RESO, bảng bản ghi, lớp cao nhất, luật loại hình, hai dòng không làm) | dưới ngưỡng: mỗi dòng 1 bước | — |

## Đề bài `hoi-1-ngan-sach`

- Loại: hai nhánh từ một tình huống chung.
- Nút chung: bài «Cần mua căn 2PN, tài chính 3 tỷ» → bộ đọc tiêu chí thấy số tiền 3 tỷ, không có «dưới / từ / đến».
- Nhánh trái «trần (khuyến nghị)»: ngân sách thấp nhất trống · cao nhất 3 tỷ → hàng đo cầu xếp vào khoảng «đến 3 tỷ»;
  ghép listing sau: mọi tin rao ≤ 3 tỷ khớp.
- Nhánh phải «một điểm»: thấp nhất 3 tỷ · cao nhất 3 tỷ → xếp vào đúng mức 3 tỷ; ghép listing sau chỉ khớp tin rao giá
  đúng 3 tỷ nếu không thêm dung sai.
- AC liên quan: AC-3.

## Đề bài `hoi-2-dang-lai`

- Loại: hai nhánh từ một tình huống chung.
- Nút chung: cùng một người đăng «Khách tìm thuê 2pn gần trung tâm» ba ngày liền (ba bài, chữ giống nhau).
- Nhánh trái «gom (khuyến nghị)»: một Yêu cầu, ba bài trong danh sách bài, ngày đầu – ngày cuối → hàng đo cầu đếm 1
  nhu cầu.
- Nhánh phải «mỗi bài một»: ba Yêu cầu → hàng đo cầu đếm 3 nhu cầu, phải tự gom hoặc đếm phồng.
- AC liên quan: AC-5, AC-9.

## Đề bài `hoi-3-loai-hinh`

- Loại: hai nhánh từ một tình huống chung.
- Nút chung: bài Yêu cầu «Cần thuê mặt bằng 50m2 gần chợ» — không có phát biểu loại hình (enrich chỉ chạy trên tin rao).
- Nhánh trái «bảng ánh xạ chữ (khuyến nghị)»: chung cư/căn hộ → căn hộ · nhà riêng/nhà phố → nhà riêng · đất → đất ·
  phòng trọ → phòng · văn phòng/mặt bằng/shophouse → thương mại · «nhà» đứng một mình → trống; «cần thuê» → thuê dài hạn →
  bài này: thương mại · thuê dài hạn; hàng đo cầu đếm được theo loại hình.
- Nhánh phải «để trống»: loại hình và mua/thuê trống tới khi có bộ đọc người/E2 → hàng đo cầu thấy gần như toàn bộ «chưa
  rõ».
- AC liên quan: AC-3, AC-9.
