# Hình tại điểm quyết định — auth-hop-chuan

| Điểm | Đếm | Hình |
|---|---|---|
| Hỏi-1 nền trang đăng ký sau khi gỡ gradient | 2 nhánh | cần hình: `ba-cau-hoi` |
| Hỏi-2 cỡ tiêu đề đăng ký | 2 nhánh | cần hình: `ba-cau-hoi` |
| Hỏi-3 đo luồng đăng ký đầu-cuối | 2 nhánh | cần hình: `ba-cau-hoi` |
| Descope coverage-scan, đường đo | 1 bước | dưới ngưỡng: 1 |

## Đề bài

### ba-cau-hoi
- Loại hình: ba cây quyết định nhỏ đặt cạnh nhau (một hình), mỗi cây gốc + 2 nhánh, nhánh máy khuyên tô điểm nhấn.
- Hỏi-1 «Nền trang đăng ký sau khi gỡ dải màu trôi»: A (khuyên) «Nền trơn + noise sẵn có, tiêu đề một màu — giống trang đăng nhập» · B «Dải màu tĩnh bằng token — thêm một quyết định màu sáng/tối».
- Hỏi-2 «Cỡ tiêu đề đăng ký (bản cũ 56 px)»: A (khuyên) «text-4xl / sm:text-5xl — 48 px màn rộng» · B «thêm lg:text-6xl — 60 px màn rộng».
- Hỏi-3 «Đo form đăng ký đầu-cuối»: A (khuyên) «Smoke đăng ký bằng email dùng một lần, xoá tài khoản sau lượt (DB local)» · B «Chỉ đo bằng giả lập (action + cảnh báo lỗi) — rẻ hơn, không chứng luồng thật».
- AC: AC-1, AC-2, AC-3, AC-5.
