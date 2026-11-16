# Hình tại điểm quyết định — thu-danh-muc-s07 (Cổng Phạm vi)

| Điểm | Đếm | Hình |
|---|---|---|
| Dòng chảy nạp raw S07 → ba bảng stg, kèm các điểm lọc (dòng sổ 2, 3, 9, 10 và Hỏi-1) | 4 bước nối tiếp, 3 nhánh theo loại item, 4 điểm lọc | cần hình: `dong-chay-nap.html` |
| Hỏi-1: item thiếu cờ đăng nhập thì nạp hay bỏ | dưới ngưỡng khi đứng riêng: 2 nhánh, 0 bước — vẽ chung vào hình trên | — |
| Tên cột theo RESO (dòng sổ 5) | dưới ngưỡng: 0 bước, 0 nhánh | — |
| Không nối lịch đêm, không áp DB máy thu (dòng sổ 8) | dưới ngưỡng: 1 bước, 0 nhánh | — |

## Đề bài hình `dong-chay-nap`

- Loại: sơ đồ luồng dữ liệu từ trái sang phải (data flow), một hình.
- Nút, theo thứ tự:
  1. «Raw snapshot S07 (bất biến, ở máy thu)» với ba loại item: «trang danh sách», «trang dự án», «sitemap».
  2. «Kiểm snapshot»: khuôn tên · nguồn S07 · phiên bản 1–9 · sha256. Nhánh hỏng: «từ chối, không ghi».
  3. «Lọc item»: cờ đăng nhập `true` → «bỏ, có đếm»; trang danh sách/trang dự án THIẾU cờ → nhãn «Hỏi-1: bỏ (khuyên) hay nhận?»; sitemap thiếu cờ → nhận.
  4. «Bỏ tên miền nguồn»: link trang → tương đối · link ảnh → `s07://…` · chữ → «S07». Nhánh còn sót: «dừng, không ghi gì của snapshot».
  5. Ba bảng đích: `stg_s07_project_card` (10 thẻ chính mỗi trang; khối «nổi bật» không vào) · `stg_s07_project` · `stg_s07_sitemap_url` — ghi chú chung: khoá `(snapshot_id, pj_id)`, nạp lại ghi 0 dòng.
  6. Nút mờ bên phải, ngoài phạm vi vòng: «Bước đọc stg (DA7, DA3, DA11): chọn bản mới nhất, nối danh bạ, cha–con».
- Nhãn phụ dưới hình: «DB chưa áp 093 → in CHUA-AP-093, thoát 0, không đánh dấu». «stg chỉ ở máy thu, không lên cloud».
- AC liên quan: AC-2..AC-8.
- Chữ trong hình bằng tiếng Việt; chỉ dùng mã S07, không tên nguồn, không tên miền.
