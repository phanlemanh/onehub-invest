# Thiết kế: lát nhãn khai danh sách ô cần gắn

Hồ sơ: `_acceptance/lat-khai-o-can-gan/`. Hàng phụ của đợt, phục vụ PL20 (gắn tin S03 vào toà).

## 1. Vấn đề

Lát `hai-khu-ghep-b` của PL20 chỉ cần hai ô: Toà và Phân khu. Màn `/ops/labels` hiện đòi đủ 24 ô mỗi bài, kèm căn cứ từng ô. Đề bài ước
khoảng 3 phút một bài, tức khoảng 16 giờ 30 phút cho 330 bài của Mạnh.

## 2. Hướng chọn

Một bảng hằng trong `labels-normalize.ts` khai «lát → ô cần gắn». Lát không khai giữ nguyên hành vi.

| Chỗ | Việc |
|---|---|
| `labels-normalize.ts` | Bảng `O_THEO_LAT`, hằng `BASIS_KHONG_DOI` và nhãn riêng của ô theo lát |
| `label-form-nhom.tsx`, `nhom-row.tsx` | Lát có khai: chỉ hiện các ô đó, không có căn cứ, không có ô Lý do, đếm trên số ô của lát |
| `labels-queries.ts` `ghiNhan` | Lát có khai: giữ đúng các ô của lát, thiếu ô thì 400, đặt `basis = null`. Lát không khai mà gửi `BASIS_KHONG_DOI` thì 400 |
| `labels-content.tsx`, `labels-view.tsx` | Lát có khai: không mở lượt hai, bộ chọn nhóm ghi tên trung tính, bảng đồng thuận chỉ hai ô |

**Vì sao cần hằng `BASIS_KHONG_DOI`.** Route gọi bộ kiểm `chuanHoaLuot(values, { text, reason })`, không truyền tên lát, nên bộ kiểm không biết lát
nào đang ghi. Muốn bộ kiểm tự đọc luật theo lát thì phải sửa `app/src/app/api/v1/ops/labels/route.ts`, tệp thuộc nhóm T3. Đề bài yêu cầu tránh nếu được.
Vì thế biểu mẫu gửi một hằng có tên riêng, không trùng căn cứ thật nào. `ghiNhan` là chỗ biết tên lát: chỉ lát có khai mới được dùng hằng này, và hằng
không bao giờ xuống DB.

**Phương án đã loại.** Thêm cột DB khai ô theo lát: cần migration mà chỉ có một lát dùng. Sửa route: hàng thành T3, thêm Cổng 1.5 cho một dòng mã.

## 3. Số đo

| Mốc | Một bài | 330 bài |
|---|---|---|
| Hiện nay (đề bài ước) | khoảng 3 phút | khoảng 16 giờ 30 phút |
| Mục tiêu đề xuất, chưa đo | từ 45 giây trở xuống | khoảng 4 giờ 8 phút |

<!-- <<<UX-SPEC-TEMPLATE -->
## Đặc tả UX

### 1. Luồng

- Suôn sẻ: mở `/ops/labels?lat=hai-khu-ghep-b` → đọc bài → điền Toà, Phân khu hoặc cụm, hay chọn «Không suy ra được» → Lưu → sang bài kế (điểm ra: hết bài của nhóm).
- Biên: bài chỉ có một ô, bài không có ô nào; hết bài; bài vừa có người gắn.
- Lỗi & quay lại: để trống một ô → báo ngay dưới ô, giữ chữ đã gõ; mất kết nối → nút «Thử lại» giữ nguyên bài.

### 2. Kiểm kê màn

| Màn | MỘT việc của màn | Vào từ / ra tới |
|---|---|---|
| Gắn nhãn, lát rút gọn | Ghi toà và phân khu của một bài | Đường dẫn của lát / bài kế |

### 3. Bảng trạng thái

<!-- <<<UX-STATE-TABLE -->
| Trạng thái | Màn | Hiển thị gì | Người làm gì tiếp |
|---|---|---|---|
| ST-labels-rutgon-trong | Gắn nhãn | Hai ô trống, đếm 0/2 | Điền hoặc chọn «Không suy ra được» |
| ST-labels-rutgon-loi-o | Gắn nhãn | Lỗi ngay dưới ô còn trống | Điền ô đó |
| ST-labels-rutgon-dang-luu | Gắn nhãn | Nút «Đang lưu…» | Chờ |
| ST-labels-rutgon-mat-mang | Gắn nhãn | Cảnh báo kèm «Thử lại» | Thử lại |
| ST-labels-rutgon-het | Gắn nhãn | «Đã gắn hết nhóm này» | Chọn phần khác |
<!-- UX-STATE-TABLE>>> -->

### 4. Hành vi

- Enter không tự lưu, như biểu mẫu hiện nay.
- Khổ hẹp: bài ở trên, hai ô ở dưới, nút Lưu dính ở chân.

### 5. Xuất xứ component

| Component | Nấc (dùng / ghép / mở rộng / tạo) | Vì sao (1 dòng) |
|---|---|---|
| `LabelFormNhom`, `NhomRow` | mở rộng | Biểu mẫu đang có, thêm danh sách ô theo lát |
| `ChonNhom`, `AgreementTable` | dùng | Đang có trên màn |

### 6. Khuôn IA đã chọn + căn cứ

Khuôn IA: danh-sách-chi-tiết (master-detail)
Căn cứ: giữ nguyên khuôn của màn Gắn nhãn, chỉ bớt ô.

### 7. Thẻ việc

| Trường | Giá trị |
|---|---|
| Ai dùng | Người gắn nhãn |
| Việc chính | Ghi toà và phân khu của từng bài |
| Tần suất | mỗi ngày |
| Số bản ghi | hàng trăm trở lên |
| Thiết bị | máy tính |
<!-- UX-SPEC-TEMPLATE>>> -->
