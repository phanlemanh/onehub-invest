# S02: ứng dụng tự cấp lại phiên, bộ thu chờ token còn hạn — thiết kế

## Bối cảnh và nguyên nhân (số đo ngày 25/11)

Bộ thu S02 lấy token bằng cách mở profile đã đăng nhập, nạp trang của nguồn rồi đọc token 15 phút trong `localStorage`.
Từ 24/11 lượt nào cũng dừng ở token hết hạn. Đo lại trên đúng profile của lượt 19:05:

| Thí nghiệm | Kết quả |
|---|---|
| Mở route dữ liệu `/data/vn` bằng đúng cấu hình lượt đêm | tài liệu chính trả 403 kèm `cf-mitigated: challenge`, ô «Verify you are human», `navigator.webdriver` đúng |
| Cũng vậy nhưng bỏ cờ `--enable-automation` | y hệt — Chrome 158 bật `navigator.webdriver` khi có kết nối gỡ lỗi |
| Mở `/favicon.ico` hay `/robots.txt` (không phải tệp tĩnh có thật) | nguồn trả bộ khung SPA (404) mà không qua thử thách; ứng dụng khởi động đủ để tự gọi `fetch_id_token` rồi `fetch_app_token` và ghi token mới vào `localStorage.auth` |
| Gọi thẳng điểm OAuth `/oauth2/token` bằng refresh token của profile | không có phản hồi đọc được — ứng dụng không đi đường ấy, mà qua backend của nguồn |
| Token sau khi ứng dụng tự cấp | `appToken` và id token cùng lúc cấp, cùng hạn 15 phút; refresh token **không** đổi (so mã băm trước và sau) |

Nghĩa là chỉ có một chỗ gãy: ứng dụng không tải được trên route dữ liệu. Mọi thứ phía sau (API, transform) vẫn chạy.

## Cách làm

- **Bộ thu chỉ ĐỌC token.** Nạp bộ khung ứng dụng qua các đường dẫn ứng viên (`/favicon.ico`, `/robots.txt`, rồi mới tới
  route dữ liệu), rồi chờ tới khi token trong `localStorage` còn hạn quá lề 30 giây mới đọc. Trước đây chờ cứng 6 giây
  nên khi ứng dụng chậm là đọc trúng token cũ. Bộ thu không tự gọi API xác thực, không đọc refresh token.
- **Một cửa sổ cho cả lượt.** Trước đây mỗi lần cần token là mở lại trình duyệt. Giữ một cửa sổ; giữa hai lần lấy
  token trang đỗ ở `about:blank` để ứng dụng không chạy nền.
- **Làm mới trước khi gọi.** Token còn dưới lề thì làm mới trước lời gửi, sau khi đã qua giới hạn tốc độ — không đợi
  401 (một lời rơi vào 401 là một tín hiệu thừa gửi lên nguồn).
- **Lỗi xác thực dừng cả lượt** bằng lớp riêng `LoiXacThuc`. Ở cây cũ, lỗi ném từ bước làm mới bị `call()` nuốt thành
  từng lời gọi lỗi: với ba đường dẫn ứng viên, mỗi lời gọi sẽ nạp lại ứng dụng ba lần, lượt kéo dài hàng giờ. Đây chính
  là mục «Ngoài-3» của hồ sơ `s02-luot-loi-sach-va-kiem-han-token`.
- **Chẩn đoán đúng nguyên nhân** từ những gì chính ứng dụng làm khi bộ thu chờ: bị từ chối (401/403) → phiên đã hết;
  ứng dụng chạy mà không có token → nói vậy; không thấy lời gọi nào → ứng dụng không khởi động. Đã chạy rồi mà
  không có token thì không thử đường dẫn khác.
- **Lệnh `login`**: mở Chrome **thường** (không qua Playwright, không cờ tự động hoá) với đúng profile của bộ thu;
  Mạnh tự đăng nhập rồi đóng cửa sổ. `AIRDNA_PROFILE_DIR` để đổi chỗ profile (chạy từ worktree, hoặc gom profile về
  một gốc ngoài kho theo ROADMAP mục 60).

## Bảng phủ ca (số trong ô đếm từ các lần chạy thật ngày 25/11)

| Chiều | Giá trị | Số lần đo | Kết cục | Ai đọc đầu ra này phía sau |
|---|---|---|---|---|
| Trạng thái token lúc đọc | còn hạn hơn lề | 4 | dùng ngay, ứng dụng không gọi xác thực | `call()` → API của nguồn |
| | hết hạn | 2 | ứng dụng cấp lại trong 2–6 giây, bộ thu đọc token mới | như trên |
| | còn dưới lề (giữa lượt) | 1 | làm mới trước lời gửi, nhận token mới «còn 15 phút» | như trên |
| | rác hoặc rỗng | 0 (chỉ ma trận) | không dùng | — |
| Lý do làm mới | sắp hết hạn | 1 (giữa lượt) | nạp lại bộ khung ứng dụng | — |
| | vừa bị 401 | 0 (chỉ phép đo) | ép làm mới rồi thử lại một lần | — |
| Ứng dụng khi nạp | route dữ liệu | 2 | trang thử thách, không có token | — |
| | bộ khung qua đường dẫn không phải tệp tĩnh | 6 | chạy, cấp token | — |
| | profile chưa từng đăng nhập | 2 | không khởi động, lượt dừng ngay | người vận hành đọc dòng `AUTH FAIL [S02]` |
| Kết cục lời gọi API | có dữ liệu | 27 (9 + 18) | ghi snapshot | transform S02 đọc snapshot |
| | 401 hai lần · lỗi máy chủ · bước làm mới ném lỗi | 0 lần thật (chỉ phép đo) | dừng cả lượt / đếm một lời lỗi | — |
| Người đọc phía sau | script đêm S02 | — | `collect` thoát khác 0 thì `set -e` dừng trước transform; chọn bản thu theo tên, bỏ thư mục chấm | `scripts/*-daily.sh` |
| | bộ đo độ tươi | — | đọc giờ thu trong DB, không đọc log | `scripts/lib/freshness.mjs` |
| | dòng `AUTH FAIL [S02]` | — | chưa có bộ đọc (ngoài phạm vi) | — |

## Đo

Không có giao diện nào. Bốn phép đo ở `_acceptance/s02-phien-qua-khung-ung-dung/probes/`, mỗi phép chạy trên bản
thật (phải đạt hết) rồi trên bản đột biến (phải đỏ đúng ô):

| Phép đo | Đo gì | Bản đột biến |
|---|---|---|
| `han-va-lam-moi.mjs` | ma trận hàm thuần: lề token, giữ token, thử đường kế, chẩn đoán, thứ tự ứng viên, tham số đăng nhập, chỗ profile | 6 |
| `loi-xac-thuc.mjs` | hành vi `call()` với hàm gửi giả: làm mới hỏng, 401 hai lần, lỗi thường, làm mới trước khi gửi | 2 |
| `noi-day.sh` | đo tĩnh thân hàm nạp: mọi lối ra có token đi qua kiểm lề, không chờ cứng, `page.goto` đúng chỗ | 4 |
| `vung.sh` | tệp đổi chỉ nằm trong vùng của hàng | 1 (cấy tệp) |

Bộ test collector (`config:executors.test.collector`) và lệnh CLI (`config:executors.script.cli`) chạy đủ.

## Giới hạn đã thấy

- Hành vi thật với trình duyệt và phiên (ba tình huống ở Notes của hợp đồng) không xếp thành eval: cần phiên của
  Mạnh và mỗi lần chạy là lưu lượng thật. Trong eval, phần trình duyệt chỉ đo được tĩnh (`noi-day.sh`); các hàm
  quyết định đo được bằng hành vi.
- Cách này dựa vào trang web của nguồn: nguồn siết luật thử thách cho cả đường dẫn tĩnh thì gãy lại. Khi đó lượt
  dừng sạch với chẩn đoán «KHÔNG khởi động», không gọi gì vô ích.
- Hạn của phiên đăng nhập chưa đo được (tháng 10 dùng mỗi đêm được 9 đêm rồi chết). Hết thì Mạnh chạy lệnh `login`.
