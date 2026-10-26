# UI7 · auth-hop-chuan — thiết kế

Hàng UI7 (phủ GD8) của lộ trình giao diện 23/10. Hạng T3 (chạm `app/src/app/(auth)/**`).

## Căn cứ đã khai

- Câu giao UI7 (`docs/plan/lo-trinh.json`): «không còn chuyển động bị cấm, gradient tự chọn hay chữ kích thước tuỳ ý,
  và lỗi nhóm (auth) hiện error.tsx». Ô Cổng Đáng `_acceptance/auth-hop-chuan/opportunity.md` (build, Mạnh 23/10).
- `AGENTS.md` khối «ReUI design rules»: motion chỉ hover/reveal, ≤ 1 entrance; màu qua token; không resize FrameTitle;
  mỗi vùng có lỗi tại chỗ + Thử lại.
- Block `@reui/auth-5` gốc tự mang `gradient-wave.tsx` (4 mảng màu trôi `infinite`, rgba tự chọn) và chữ gradient cam–hồng–tím;
  `@reui/auth-4` gốc đổi cỡ `FrameTitle` (`text-2xl sm:text-[1.75rem]`). Luật kho thắng block.

## Phương án

- Gỡ `components/auth/gradient-wave.tsx`; trang đăng ký giữ nền `bg-background` + lớp noise sẵn có của `(auth)/layout.tsx`
  (Hỏi-1: thay mảng màu bằng gì là gu nhìn — máy khuyên nền trơn như trang đăng nhập).
- Tiêu đề đăng ký: `text-4xl sm:text-5xl font-semibold tracking-tight`, một màu; bỏ `leading-[1.02]`, `tracking-[-0.02em]`,
  `lg:text-[56px]`, bỏ chữ «số liệu» tô gradient (chữ giữ nguyên).
- `FrameTitle` ở hai form bỏ lớp đổi cỡ (về cỡ mặc định của Frame).
- Thêm `app/(auth)/error.tsx` — `PageError` (Alert destructive + Thử lại) căn giữa trong layout toàn màn hình, không vỏ cổng.
- Không đổi: server action `login`/`register`, `safeNext`, `AuthError`, liên kết chéo giữ `next`, chữ hero, dải số đếm thật.

Đã loại: giữ gradient nhưng tĩnh (vẫn là màu tự chọn, trái câu giao) · thêm framer/motion (trái luật motion).

<!-- <<<UX-SPEC-TEMPLATE -->
## Đặc tả UX

### 1. Luồng

- Suôn sẻ: Invest/Ops → `/login` (hoặc `/register`) → điền email + mật khẩu → server action → chuyển tới `next` (điểm ra: trang đích).
- Biên: đã đăng nhập mà mở `/login` → chuyển thẳng tới `next`; `?mode=register` → `/register`.
- Lỗi & quay lại: sai mật khẩu / email trùng → `?error=` → Alert trong form, điền lại; lỗi dựng trang → `error.tsx` + Thử lại.

### 2. Kiểm kê màn

| Màn | MỘT việc của màn | Vào từ / ra tới |
|---|---|---|
| Đăng nhập | Vào tài khoản | nút Đăng nhập / `next` |
| Đăng ký | Tạo tài khoản miễn phí | liên kết «Tạo tài khoản» / `next` |
| Lỗi nhóm (auth) | Báo lỗi + thử lại | lỗi dựng trang / tải lại |

### 3. Bảng trạng thái

<!-- <<<UX-STATE-TABLE -->
| Trạng thái | Màn | Hiển thị gì | Người làm gì tiếp |
|---|---|---|---|
| ST-dang-nhap-mac-dinh | Đăng nhập | form email + mật khẩu, nền noise | điền, gửi |
| ST-dang-nhap-loi | Đăng nhập | Alert lỗi từ `?error=` trên form | điền lại |
| ST-dang-ky-mac-dinh | Đăng ký | hero một màu + form, nền noise (không mảng màu trôi) | điền, gửi |
| ST-auth-loi-dung | Lỗi nhóm (auth) | Alert «Không tải được dữ liệu» + Thử lại, căn giữa | thử lại |
<!-- UX-STATE-TABLE>>> -->

### 4. Hành vi

- Không chuyển động nền; chỉ hover `transition-colors` sẵn có của liên kết/nút.
- 390 px: hero xếp trên form, không cuộn ngang.

### 5. Xuất xứ component

| Component | Nấc | Vì sao (1 dòng) |
|---|---|---|
| `@reui/auth-4`, `@reui/auth-5` (đã chuyển thể) | mở rộng | bỏ phần trái luật kho, giữ bố cục |
| `PageError` (`states/page-error.tsx`) | dùng | lỗi chuẩn + Thử lại của kho |

### 6. Khuôn IA đã chọn + căn cứ

Khuôn IA: một-cột-cuộn
Căn cứ: hai trang auth giữ bố cục block đã duyệt (routes.md «Auth card»); vòng này chỉ dọn luật, không đổi IA.
<!-- UX-SPEC-TEMPLATE>>> -->
