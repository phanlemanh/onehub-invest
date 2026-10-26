# auth-error-thu-lai-retry — thiết kế

Hàng phát sinh của dãy U1, đợt `dot0-cam-mau`. Nguồn: mục Ngoài-5 ở Cổng Bằng chứng của `auth-hop-chuan` (Mạnh chọn
«mở hợp đồng mới», 26/10), ghi ở `_acceptance/auth-hop-chuan/contract.md` mục Notes. Hạng T3 (chạm
`app/src/app/(auth)/**`).

## Căn cứ đã khai

- `_acceptance/auth-hop-chuan/contract.md` (Notes): «Thử lại» ở `(auth)/error.tsx` gọi `reset()`; đổi sang `retry()` theo
  mẫu `(marketing)/error.tsx` cần sửa AC-4 và ca AH-AC-4 — việc riêng.
- `app/src/app/(marketing)/error.tsx`: «Thử lại» gọi `retry()` (Next 16: tải lại phần trang từ server), không phải
  `reset()` (chỉ vẽ lại từ client, lỗi dữ liệu sẽ lặp lại). `next/dist/client/components/error-boundary.d.ts` khai `retry`.
- Sổ `trang-chu-methodology` (d-20261024T225346Z-7): nút «Thử lại» của ranh giới lỗi gọi `retry()` của Next 16, không `reset()`.
- Giám sát giao kèm: `_acceptance/config.yaml` thành YAML chuẩn (dòng `methodology_design_gate:"…"` thiếu dấu cách).
  Bộ đọc YAML chuẩn (`yaml`, khoá duy nhất) còn báo thêm một lỗi: khoá `sync_pii_mutation` lặp ở dòng 152 trong cùng
  `executors.script`, cùng giá trị với dòng 145.

## Phương án

- `(auth)/error.tsx` nhận `retry` từ Next và chuyền cho `PageError` qua prop `reset` (như `(marketing)/error.tsx`);
  bố cục, chữ, `PageError` không đổi.
- Ca AH-AC-4 của `auth-hop-chuan` rời `app/tests/auth-hop-chuan.test.tsx`; tiêu chí đo lại nó là AC-1 của hồ sơ này, ca
  `AER-AC-1` trong tệp test riêng. Ô E4 của hồ sơ đã ký khai `status: not-run` kèm `superseded_by`
  (cơ chế 2.24 của kit) — không sửa chữ hợp đồng đã ký.
- Đo AC-1 bằng chính ranh giới lỗi của Next (`ErrorBoundaryHandler` trong `next/dist/client/components/error-boundary`):
  nó truyền `retry`, và `retry()` gọi `router.refresh()` của `AppRouterContext` — tức tải lại phần trang từ server. Ca
  test đếm `router.refresh`, không tự cấp prop `retry` bằng tay. Có đo thêm trên bản chạy không là Hỏi-1.
- `_acceptance/config.yaml`: thêm dấu cách sau `methodology_design_gate:`; bỏ dòng `sync_pii_mutation` thứ hai (dòng 152).
  Giá trị mọi lệnh giữ nguyên — phép đo so bộ đọc của kit với bộ đọc chuẩn trên MỌI khoá `executors.*`.

### Bảng eval cũ → AC mới

| Eval cũ | Tiêu chí mới |
|---|---|
| auth-hop-chuan/E4 | auth-error-thu-lai-retry#AC-1 |

Đã loại: sửa thẳng AC-4 của `auth-hop-chuan` (hồ sơ đã ký — không sửa) · giữ ca AH-AC-4 khẳng định `reset` (đỏ ngay khi
error.tsx đổi) · đổi luôn `(app)/error.tsx`, `ops/error.tsx` (ngoài câu giao — mục việc riêng).

<!-- <<<UX-SPEC-TEMPLATE -->
## Đặc tả UX

### 1. Luồng

- Suôn sẻ: không có — màn này chỉ hiện khi dựng `/login` hay `/register` lỗi.
- Lỗi & quay lại: dựng trang lỗi (thường là DB) → cảnh báo «Không tải được dữ liệu» + «Thử lại» → bấm: Next tải lại phần
  trang từ server; hết lỗi thì về form, còn lỗi thì cảnh báo hiện lại.

### 2. Kiểm kê màn

| Màn | MỘT việc của màn | Vào từ / ra tới |
|---|---|---|
| Lỗi nhóm (auth) | Báo lỗi + thử lại từ server | lỗi dựng trang / trang đăng nhập-đăng ký |

### 3. Bảng trạng thái

<!-- <<<UX-STATE-TABLE -->
| Trạng thái | Màn | Hiển thị gì | Người làm gì tiếp |
|---|---|---|---|
| ST-auth-loi-dung | Lỗi nhóm (auth) | Alert «Không tải được dữ liệu» + mã lỗi (khi có) + «Thử lại», căn giữa | bấm Thử lại (tải lại từ server) |
<!-- UX-STATE-TABLE>>> -->

### 4. Hành vi

- Không đổi giao diện so với UI7: chỉ đổi hàm nút gọi (`retry` thay `reset`).

### 5. Xuất xứ component

| Component | Nấc | Vì sao (1 dòng) |
|---|---|---|
| `PageError` (`states/page-error.tsx`) | dùng | lỗi chuẩn + Thử lại của kho, không đổi |

### 6. Khuôn IA đã chọn + căn cứ

Khuôn IA: một-cột-cuộn
Căn cứ: giữ nguyên layout toàn màn hình của `(auth)` đã duyệt ở UI7; vòng này không đổi IA.
<!-- UX-SPEC-TEMPLATE>>> -->
