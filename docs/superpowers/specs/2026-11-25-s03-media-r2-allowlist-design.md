# ZC15 · s03-media-r2-allowlist — thiết kế

Hàng ZC15 (dãy ZT), phần host của hàng lộ trình ZC9. Nhánh làn thu `zcode/s03-media-r2-allowlist` @573820d37 đã gộp vào
nhánh hồ sơ; vòng này thêm phần LL giao 24/11 và hồ sơ áp.

## Bài toán, đo 25/11 trên DB máy thu

Bài S03 có ảnh, mỗi bài lấy bản snapshot mới nhất, theo ngày đăng VN: tỉ lệ bài mất hết ảnh 22/11 33,7% · 23/11 28,2% ·
24/11 27,5%. Lỗi của các bài mất hết ảnh trong 8 ngày (9.377 bài):

| Họ host | Lỗi | Bài | Vòng này |
|---|---|---|---|
| zdn.vn | http-400 | 6.602 | ngoài phạm vi (việc riêng, đã báo GS) |
| r2.dev | host-not-allowed | 2.624 | sửa (ZCode, AC-1/2) |
| zdn.vn → họ `99ee4ac919` | redirect-host | 61 | sửa (cấu hình local, AC-3/4) |
| zdn.vn | http-404, 202, timeout | 89 | ngoài phạm vi |

Ước sau áp (bỏ bài chỉ hỏng vì hai lỗi sửa được): 24/11 27,5% → 20,9%; 23/11 28,2% → 22,3%.

## Thay đổi

1. **r2.dev mặc định** (ZCode, 7aef35391 + 573820d37): `DEFAULTS.allowedHostSuffixes = ["zdn.vn", "r2.dev"]`; `hostAllowed`
   giữ ranh giới dấu chấm (`evilr2.dev` bị chặn).
2. **Hậu tố thêm từ máy** (mới): `createAgentServer` đọc `<stateDir>/media-host-suffixes.txt` (mỗi dòng một hậu tố, `#` là
   chú thích) và biến `ONEINVEST_MEDIA_HOST_SUFFIXES` (phẩy). Hàm thuần `parseHostSuffixes()` trong `media-fetch.ts` lọc: chữ
   thường, chỉ `[a-z0-9.-]`, ít nhất hai nhãn, không đầu/cuối bằng dấu chấm; dòng hỏng bị bỏ. Danh sách dùng =
   `(opts.media.allowedHostSuffixes ?? DEFAULTS) ∪ thêm` — người gọi không truyền tệp hay biến thì y như cũ. Log khởi động
   chỉ in SỐ hậu tố thêm, không in tên. `collector/state/` đã gitignore → tên thật của host đích (tầng A) chỉ nằm trên
   máy thu; hồ sơ, test, commit gọi nó bằng băm md5 `99ee4ac919`.
3. **Accept** (mới): `downloadOne` gửi `accept: image/jpeg,image/png,image/webp,image/gif` — không xin JPEG XL. Đo 25/11:
   6 URL mẫu × 3 kiểu Accept × 2 lần, cả 36 lượt ra JPEG.
4. **JPEG XL** (mới): byte trả về mở đầu bằng mã JPEG XL (`FF 0A` hoặc hộp `JXL `) → lưu nguyên byte với đuôi `.jxl` (tên
   vẫn theo băm URL), sha256 là của byte gốc. Không đổi định dạng ở bộ thu (luật 1: snapshot bất biến, diễn giải ở
   pipeline). Bên đọc hôm nay: `pipeline/lib/vlm-anh.mjs` đoán kiểu theo byte và bỏ ảnh lạ; `app/src/lib/ops/zalo-media.ts`
   phục vụ theo đuôi (`.jxl` không có trong bảng → không phục vụ); doc-gop đọc `mime` từ bảng media. Ảnh JPEG XL vì vậy
   được giữ mà không lên đường đọc — ghi Known limits, việc chuyển định dạng (nếu đo thấy cần) là hàng pipeline riêng.

## Không làm

http-400 zdn.vn · tải bù bài cũ · đổi khuôn `meta.mediaFiles` (DATA-CONTRACT) · sửa bên đọc ngoài `collector/src`.

## Áp lên máy thu

`collector/dist` build lại từ `main`; ZV ghi `collector/state/media-host-suffixes.txt` từ tệp nghiên cứu local của LL
(mode 600); khởi động lại `com.oneinvest.collector-api` — **lời riêng của Mạnh**. Chi tiết, sao lưu, lùi, kiểm sau:
`_acceptance/s03-media-r2-allowlist/ap-may-thu/README.md`.
