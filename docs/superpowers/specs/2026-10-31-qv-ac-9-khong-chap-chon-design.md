# qv-ac-9-khong-chap-chon — bộ kiểm sổ bề mặt API không đỏ vì tệp đột biến tạm của test khác

## Vấn đề

Ca `QV-AC-9` (`app/tests/quyen-bon-vai.test.tsx`) chạy `node scripts/check-api-surface.mjs mutation`. Lệnh đọc cả
cây `app/src` bằng `walk()`: `readdirSync` lấy tên, rồi `statSync` và `readFileSync` từng tệp. `npm test` của app chạy
tám tệp test song song (`--test-concurrency=8`); nhiều test đột biến (ON3, ON4, ON22, ON23, NT2, DC, SC, AU12) chép một
tệp thật thành bản sao ẩn `.xxx-mut-<pid>-<n>-<tên>.tsx` cạnh tệp gốc rồi xoá nó sau vài trăm mili giây. Nếu bản sao bị
xoá giữa `readdirSync` và `statSync`/`readFileSync`, lệnh ném `ENOENT`, thoát khác 0, và `QV-AC-9` đỏ. Hôm 31/10 CI app
đỏ như vậy ba lần (#235, #243, #245) trên các thay đổi không liên quan.

Hai bộ quét khác đã gặp đúng lỗi này và bỏ qua tệp ẩn: `app/tests/ops-nhan/visible-strings.ts` và ca `TCM-AC-2` của
`app/tests/trang-chu-methodology.test.tsx` (sổ `audit-all-doc-log-o-checkout`, dòng S4-r1 số 15).

## Cách sửa

Trong `scripts/check-api-surface.mjs`:

1. `walk()` bỏ qua **tệp** có tên bắt đầu bằng dấu chấm. Bản đột biến tạm của test luôn là tệp ẩn. Thư mục ẩn vẫn
   được duyệt, để không thu hẹp phạm vi kiểm.
2. `walk()` và `loadFiles()` chịu `ENOENT` khi một mục biến mất giữa lúc đọc tên và lúc stat/đọc: bỏ mục đó và đi tiếp.
   Mọi lỗi khác (`EACCES`, `EISDIR`…) vẫn ném như cũ.
3. `loadFiles(base = root, io = fs)` nhận thêm gốc và bộ hàm đọc (mặc định là gốc kho và `node:fs`). Test dùng chúng
   để dựng ca tệp biến mất một cách tất định. Ba nơi gọi hiện có (`check-portal-compliance.mjs`, chế độ `static` và
   `mutation`) không đổi.

Phép kiểm sổ (`checkApiSurface`) và bảng đột biến M1–M20 giữ nguyên, nên không có kiểm nào bị nới. Một `route.ts` thật
không bao giờ là tệp ẩn, nên bỏ qua tệp ẩn không làm lọt route nào. Một module ẩn được import qua `./.x` thì không còn
nằm trong bao đóng import; việc này ghi vào giới hạn đã biết (Next/TS trong kho không có tệp ẩn nào là mã thật).

## Test

Tệp mới `app/tests/api-surface-tep-an.test.tsx`. Mọi cây thử nằm trong thư mục tạm dưới `os.tmpdir()`; test không
ghi tệp nào vào `app/src` thật.

- **Tệp ẩn bị bỏ (TA-AC-1):** cây tạm có `lib/that.ts`, `lib/.x-mut-1-that.tsx`, `api/v1/a/route.ts`. `loadFiles`
  trả đúng hai tệp không ẩn.
- **Mục biến mất ở cả ba cửa sổ (TA-AC-2):** bộ hàm `io` bọc `node:fs` và tiêm ba ca: (a) `readdirSync` báo thêm tệp
  ma `ma.tsx` và thư mục ma `ma-dir` không có trên đĩa (biến mất trước `statSync`); (b) `statSync` báo một tệp thường
  nhưng `readFileSync` ném `ENOENT` (biến mất sau stat, trước khi đọc); (c) `statSync` báo một thư mục nhưng
  `readdirSync` ném `ENOENT` (biến mất sau stat, trước khi liệt kê). Cả ba: `loadFiles` không ném, kết quả không có
  mục ma. Ca lỗi khác: `statSync` ném `EACCES` thì `loadFiles` ném lỗi có `code: EACCES`.
- **Chiều đỏ tất định:** mỗi nhánh có một bản đột biến riêng, sinh từ bản hiện tại bằng thay chuỗi và ghi vào thư mục
  tạm cùng bản chép `check-deals-api.mjs` (import tương đối vẫn đúng); thay chuỗi không áp được thì ca đỏ: bỏ nhánh tệp ẩn → TA-AC-1 đỏ; bỏ chịu ENOENT ở stat / ở đọc tệp / ở liệt kê thư mục → đúng ca
  (a)/(b)/(c) đỏ với thông điệp riêng.
- **Chạy thật dưới tải sinh-xoá (TA-AC-3):** chép `scripts/check-api-surface.mjs`, `scripts/check-deals-api.mjs` và
  `app/src` vào thư mục tạm. Một tiến trình con liên tục tạo rồi xoá `.qv-mut-*.tsx` trong `app/src/lib` của BẢN CHÉP,
  và đếm số tệp đã sinh-xoá. Bản mới chạy `static` và `mutation` mỗi chế độ 5 lượt: cả 10 lượt thoát 0. Đối chứng âm là
  bản đột biến bỏ cả hai nhánh (hành vi của bản cũ), sinh từ bản hiện tại chứ không đọc git: chạy `static` tới lượt
  ENOENT đầu tiên, trần 60 lượt hoặc 90 giây; không gặp ENOENT trong trần thì ca đỏ. Đối chứng dương: tiến trình con
  phải báo đã sinh-xoá ít nhất 1000 tệp trong cửa sổ đo. Trước và sau ca, `app/src` thật có 0 tệp `.qv-mut-*`.

## Giới hạn đã biết

- Một module ẩn được import qua `./.x` sẽ rơi khỏi bao đóng import của bộ kiểm. Trong kho hiện không có tệp mã ẩn nào;
  bản đột biến tạm của test là trường hợp duy nhất có tệp ẩn trong `app/src`.
