# Hình tại điểm quyết định — hieu-chuan-mot-bo-so (Cổng Phạm vi)

| Điểm | Đếm | Hình |
|---|---|---|
| Hỏi-1 ảnh chụp trang (d-…-4) | 2 nhánh rẽ (bỏ frame + việc phụ · dựng chụp có phiên trong vòng) | `hoi1-anh-chup.html` |
| Hỏi-2 ngưỡng mẫu mỏng (d-…-9) | 3 nhánh rẽ (dưới 5 cỡ mẫu metrics · dưới 10 · dưới 5 trên cây) | `hoi2-mau-mong.html` |
| Hỏi-3 định nghĩa tự thu (d-…-8) | 2 nhánh rẽ (một số chung · ba số ba nhãn) | `hoi3-tu-thu.html` |
| Hỏi-4 bộ chữ nhãn (d-…-10) | dưới ngưỡng: 1 lối + sửa chữ khi duyệt | — |
| Market đại diện (d-…-2) | dưới ngưỡng: 1 lối có căn cứ | — |

## Đề bài `hoi1-anh-chup`
- Loại hình: hai cột so nhánh (A máy khuyên · B).
- A: vòng ON10 đo bằng vẽ trong jsdom, không ảnh trang thật → việc phụ «chụp /ops có phiên ops» (tài khoản thử local) phục vụ các hàng Ops sau. Giá: lần thứ ba trong mốc ký không ảnh; lưới trước-merge đã cảnh báo ngưỡng siết.
- B: ON10 thêm bước đăng nhập tài khoản thử rồi chụp vùng Hiệu chuẩn (+1 tiêu chí, +1 eval ảnh). Giá: vòng dài hơn, dựng hạ tầng chụp trong một hàng sửa số.
- AC liên quan: AC-4, AC-5, AC-6 (phần nhìn).

## Đề bài `hoi2-mau-mong`
- Loại hình: bảng, hàng = ca mẫu, cột = ba nhánh, ô = có cờ «mẫu mỏng» hay không.
- Hàng: (a) Đồng Nai — cây ≥ 5 listing, metrics 1 listing, công suất 96,7% · (b) khu vực metrics 7 listing · (c) khu vực metrics 3 listing, cây 3.
- Nhánh A (máy khuyên) dưới 5 trên cỡ mẫu metrics: (a) cờ · (b) không · (c) cờ.
- Nhánh B dưới 10 trên metrics: (a) cờ · (b) cờ · (c) cờ.
- Nhánh C dưới 5 trên số listing trong cây: (a) KHÔNG cờ (sót) · (b) theo cây · (c) cờ.
- AC liên quan: AC-4.

## Đề bài `hoi3-tu-thu`
- Loại hình: hai cột so nhánh, mỗi cột vẽ ba ô bảng (Thẻ hiệu chuẩn · Độ phủ · Toàn quốc) với số Hà Nội.
- Hiện tại (đầu hình, xám): 257 · 267 · 39, cùng nhãn «tự thu».
- A (máy khuyên) một số chung: 267 · 267 · 267, nhãn «Listing tự thu», một câu định nghĩa. Giá: mất số tháng cuối (39) của bảng toàn quốc.
- B ba số ba nhãn: 257 «listing trong cửa sổ metrics» · 267 «listing đang theo dõi» · 39 «listing tháng cuối». Giá: ba số cho cùng khu vực trên một trang.
- AC liên quan: AC-2, AC-3.
