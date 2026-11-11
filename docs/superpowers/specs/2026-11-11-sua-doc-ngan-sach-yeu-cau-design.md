# YC1 — sửa bộ đọc ngân sách của Yêu cầu

Hàng `YC1` của `docs/plan/lo-trinh.json`, bản phạm vi `docs/plan/pham-vi-bang-yeu-cau-1011.md` (Mạnh «Đồng ý theo
khuyến nghị» 10/11). Ô cơ hội: `_acceptance/sua-doc-ngan-sach-yeu-cau/opportunity.md` (build). Gánh sáu lỗi
Ngoài-4/5/7/9/10/11 mà Mạnh xếp «mở hợp đồng mới» ở Cổng Bằng chứng của hồ sơ `bang-yeu-cau` (30/10, dòng sổ
`d-20261030T140345Z-25…32` trên nhánh `feat/bang-yeu-cau`), cộng bốn cách viết của câu giao.

## Bối cảnh

`pipeline/lib/yeu-cau.mjs` (hàm `docNganSach`) nằm ở nhánh `feat/bang-yeu-cau`, chưa lên main vì YC0 chưa nối bảng
`inquiry_records`. Vòng này chép nguyên tệp lên main (commit `6c4ee41d`, không đổi byte nào) rồi chỉ sửa khối ngân sách,
để YC0 gộp nhánh mà không xung đột. Phần DB của tệp (`ghiYeuCau`, `docPhatBieuThang`) chưa ai gọi trên main.

Đo 11/11 bằng bộ đọc gốc trên DB máy thu: 122.228 bài S03 có chữ, 12.736 bài khớp `laYeuCau`, 9.059 bài đọc được ngân
sách (71,1%), 0 bài thuê mang ngân sách từ 100 triệu/tháng trở lên.

Lỗi của bộ đọc gốc, thử trực tiếp:

| Chữ | Dịch vụ | Gốc ra | Đúng là |
|---|---|---|---|
| `2ty6` | mua | trần 2 tỷ | trần 2,6 tỷ |
| `6tr5` | thuê | trần 6 triệu | trần 6,5 triệu |
| `2 tỷ 500`, `2 tỷ rưỡi` | mua | trần 2 tỷ | trần 2,5 tỷ |
| `800 - 1,2 tỷ` | mua | sàn 1,2 tỷ | 800 triệu tới 1,2 tỷ |
| `tối đa 2 tỷ, từ 3 tỷ` | mua | sàn 3 tỷ, trần 2 tỷ | trần 2 tỷ |
| `tc 8` (không đơn vị) | thuê | trống | trần 8 triệu |

`tc 8tr`, `12tr quay đầu`, `2.3 tỷ quay đầu` đã đọc đúng ở bộ gốc; vòng này giữ chúng bằng ca hồi quy.

## Thiết kế

Chỉ sửa khối «Ngân sách» của `pipeline/lib/yeu-cau.mjs` (từ dòng `// ---- Ngân sách` tới trước `// ---- Loại hình`).
Chữ ký `docNganSach(text, kind) → {min, max}` giữ nguyên.

1. **Phần lẻ sau đơn vị.** Sau đơn vị tỷ: 1–2 chữ số liền hoặc cách một khoảng trắng là phần thập phân (`2ty6` → 2,6;
   `2ty65` → 2,65; `2 tỷ 5` → 2,5); đúng 3 chữ số là triệu (`2 tỷ 500` → 2,5 tỷ). Sau đơn vị triệu: 1 chữ số là phần
   mười (`6tr5` → 6,5 triệu); 3 chữ số là nghìn (`6tr500` → 6,5 triệu). `rưỡi` sau đơn vị cộng nửa đơn vị. Số theo sau mà
   dính `pn`, `phòng`, `m2`, `m²`, `tầng`, `căn` thì không phải phần lẻ (`2 tỷ 2pn` → 2 tỷ).
2. **Khoảng đầu dưới thiếu đơn vị.** Đầu dưới lấy đơn vị của đầu trên; nếu với đơn vị tỷ mà đầu dưới lớn hơn đầu trên thì
   đầu dưới là triệu (`800 - 1,2 tỷ` → 800 triệu tới 1,2 tỷ). Với đơn vị triệu mà vẫn ngược thì đầu dưới trống.
3. **Không bao giờ min > max.** Sàn và trần viết rời mà ngược nhau → giữ biểu thức đầu, bỏ vế sau. Kiểm cuối hàm: còn
   min > max thì trả cả hai trống (lưới an toàn, không có ca nào trong ma trận chạm nó).
4. **Số trơn sau «tc», «tài chính», «ngân sách».** Không đơn vị → thuê: triệu; mua: tỷ; dịch vụ trống: không đọc.
5. **«quay đầu».** `X quay đầu` là trần X (đã đúng ở bộ gốc, giữ bằng ca); `a-b quay đầu` giữ khoảng.

Luật giá phi lý `lyDoGiaPhiLy` của transform giữ nguyên làm chốt cuối cho từng đầu.

## Phép đo

- `pipeline/scripts/yeu-cau-ngan-sach.test.mjs` — ma trận ca viết trước, không DB, nằm trong `npm test` của pipeline.
  Mỗi lỗi Ngoài-* và mỗi cách viết có ít nhất hai ca; mỗi ca có cặp đỏ trên bản sao đột biến của `yeu-cau.mjs`
  (chép cạnh tệp thật rồi xoá, như `yeu-cau.test.mjs` của nhánh) với thông điệp ghim.
- `pipeline/scripts/do-ngan-sach-yeu-cau.mjs --goc <sha>` — chỉ đọc DB máy thu (`SET default_transaction_read_only`),
  lấy bài S03 khớp `laYeuCau`, so bộ đọc mới với bộ đọc ở commit `<sha>` (dựng tệp tạm cạnh `yeu-cau.mjs` từ
  `git show`, xoá sau). In: tổng, số có ngân sách cũ/mới, số bài thuê từ 100 triệu/tháng, số bài min > max. Thoát 1 khi
  số có ngân sách giảm, có bài thuê từ 100 triệu/tháng, hay có min > max. Ngoài CI.
- Băm phần ngoài khối ngân sách của `yeu-cau.mjs` khớp băm ghim từ bản nhánh — để YC0 gộp không xung đột.

## Ngoài phạm vi

Bảng `inquiry_records` và migration 058 (YC0) · luật nhận Yêu cầu `laYeuCau` (YC2) · đọc dịch vụ, loại hình, số phòng ·
gom nhu cầu (YC4) · áp gì lên DB máy thu hay cloud.
