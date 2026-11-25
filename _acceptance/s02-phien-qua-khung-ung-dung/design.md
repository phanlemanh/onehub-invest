# S02: ứng dụng tự cấp lại phiên, bộ thu chờ token còn hạn — thiết kế

## Bối cảnh và nguyên nhân (số đo ngày 25/11)

Bộ thu S02 lấy token bằng cách mở profile đã đăng nhập, nạp trang của nguồn rồi đọc token 15 phút trong `localStorage`.
Từ 24/11 lượt nào cũng dừng ở token hết hạn. Đo lại trên đúng profile của lượt 19:05:

| Thí nghiệm | Kết quả |
|---|---|
| Mở route dữ liệu `/data/vn` bằng đúng cấu hình lượt đêm | tài liệu chính trả 403 kèm `cf-mitigated: challenge`, ô «Verify you are human», `navigator.webdriver` đúng |
| Cũng vậy nhưng bỏ cờ `--enable-automation` | y hệt — Chrome 158 bật `navigator.webdriver` khi có kết nối gỡ lỗi |
| Mở `/favicon.ico` hay `/robots.txt` (không phải tệp tĩnh có thật) | nguồn trả bộ khung SPA (404) mà không qua thử thách; ứng dụng khởi động đủ để tự gọi `fetch_id_token` rồi `fetch_app_token` và ghi token mới vào `localStorage.auth` |
| Mở `/robots.txt` bằng Chrome KHÔNG CỬA SỔ, cùng profile (20:15) | không có trang thử thách, dù trình duyệt tự báo `webdriver` đúng và user-agent ghi «Headless»; ứng dụng tự cấp token mới sau 6,7 giây |
| Gọi thẳng điểm OAuth `/oauth2/token` bằng refresh token của profile | không có phản hồi đọc được — ứng dụng không đi đường ấy, mà qua backend của nguồn |
| Token sau khi ứng dụng tự cấp | `appToken` và id token cùng lúc cấp, cùng hạn 15 phút; refresh token **không** đổi (so mã băm trước và sau) |

Nghĩa là chỉ có một chỗ gãy: ứng dụng không tải được trên route dữ liệu. Mọi thứ phía sau (API, transform) vẫn chạy.

## Cách làm

- **Bộ thu chỉ ĐỌC token.** Nạp bộ khung ứng dụng qua các đường dẫn ứng viên (`/favicon.ico`, `/robots.txt`, rồi mới tới
  route dữ liệu), rồi chờ tới khi token trong `localStorage` còn hạn quá lề 30 giây mới đọc. Trước đây chờ cứng 6 giây
  nên khi ứng dụng chậm là đọc trúng token cũ. Bộ thu không tự gọi API xác thực, không đọc refresh token.
- **Thử đường kế tới đâu thì dừng.** Chỉ đi tiếp sang đường dẫn kế khi khung ứng dụng không nạp được ở đường dẫn
  ấy (trang thử thách, lỗi đi tới). Khung đã nạp mà không có token — profile chưa đăng nhập, hoặc phiên đã hết mà
  ứng dụng không cấp lại — thì đường khác cũng vậy: dừng ngay, không nạp thêm (đo 25/11: profile trống dừng sau
  65 giây và không đụng route dữ liệu).
- **Chẩn đoán nói đúng việc phải làm.** Bị từ chối (401/403) → đăng nhập lại. Khung nạp được mà không có token →
  đăng nhập lại. Không nạp được khung ở đường nào → nguồn chặn hoặc lỗi mạng; phiên đã lâu thì vẫn đăng nhập lại.
  Token còn hạn mà bị máy chủ từ chối, nạp lại không có token khác → dừng cả lượt, lặp lại thì đăng nhập lại.
- **Không cửa sổ, không lẫn với trình duyệt của Mạnh.** Trình duyệt của bộ thu mở ở chế độ không cửa sổ (`headless`), trên
  profile riêng của bộ thu — không bung cửa sổ lên màn hình, không đụng tab hay phiên Mạnh đang dùng (lời giao
  claudedp-2511-50). Một tiến trình cho cả lượt, dùng tab sẵn có; trước đây mỗi lần cần token là mở lại trình duyệt.
  giữa hai lần lấy token trang đỗ ở `about:blank` để ứng dụng không chạy nền. Lỗi không mở được profile — thường vì
  còn cửa sổ của lệnh `login` — đi ra dưới dạng `AUTH FAIL [S02]` kèm việc phải làm, không phải lỗi Playwright thô.
- **Làm mới trước khi gọi.** Token còn dưới lề thì làm mới trước lời gửi, sau khi đã qua giới hạn tốc độ — không đợi
  401 (một lời rơi vào 401 là một tín hiệu thừa gửi lên nguồn).
- **Sau 401 không gửi lại token vừa bị từ chối.** Token ấy thường còn hạn theo `exp` nên ứng dụng không cấp cái
  mới: bộ thu chờ một token KHÁC; làm mới mà vẫn là token cũ thì đi thẳng tới dừng. Sau 401 chỉ nạp lại một đường
  dẫn — đã có token là ứng dụng nạp được rồi.
- **Lỗi xác thực dừng cả lượt** bằng lớp riêng `LoiXacThuc`, và **mọi** lỗi từ bước nạp (kể lỗi thường, kể giá trị
  `appToken` không phải chuỗi) đều đổi thành lỗi dừng cả lượt, in đúng một dòng `AUTH FAIL [S02]`. Ở cây cũ, lỗi ném
  từ bước làm mới bị `call()` nuốt thành từng lời gọi lỗi: với ba đường dẫn ứng viên, mỗi lời gọi sẽ nạp lại ứng
  dụng ba lần, lượt kéo dài hàng giờ. Đây chính là mục «Ngoài-3» của hồ sơ `s02-luot-loi-sach-va-kiem-han-token`.
- **Tách khỏi trình duyệt để đo được.** Phép xếp đường (`thuDuongUngVien`) và trình lấy token (`phienTu`) nhận một
  hàm nạp làm tham số — không biết gì về Playwright; `moPhien` chỉ mở Chrome và cung cấp hàm nạp ấy.
- **Lệnh `login` dừng đúng chỗ.** Mở Chrome **thường** (không qua Playwright, không cờ tự động hoá) với đúng profile
  của bộ thu; Mạnh tự đăng nhập rồi đóng cửa sổ. Mỗi lệnh của CLI một nhánh đóng: `login` xong thì dừng, không rơi
  sang nhánh thu; không gọi `process.exit()` ngay sau khi in chữ (stdout là đường ống thì chữ chưa kịp ra).
  `AIRDNA_PROFILE_DIR` đổi chỗ profile (chạy từ worktree, hoặc gom profile về một gốc ngoài kho theo ROADMAP
  mục 60); `AIRDNA_CHROME_BIN` đổi tệp chạy Chrome (đo được, và không lệch khi đổi trình duyệt).

## Bảng phủ ca (số trong ô đếm từ các lần chạy thật ngày 25/11; ô ghi «phép đo» chỉ có trong eval)

| Chiều | Giá trị | Số lần đo | Kết cục | Ai đọc đầu ra này phía sau |
|---|---|---|---|---|
| Trạng thái token lúc đọc | còn hạn hơn lề | 5 | dùng ngay, ứng dụng không gọi xác thực | `call()` → API của nguồn |
| | hết hạn | 3 | ứng dụng cấp lại trong 2–6 giây, bộ thu đọc token mới | như trên |
| | còn dưới lề (giữa lượt) | 2 | làm mới trước lời gửi, nhận token mới «còn 15 phút» | như trên |
| | rác, rỗng, không phải chuỗi | 0 (chỉ phép đo) | không dùng | — |
| Lý do làm mới | sắp hết hạn | 2 (giữa lượt, trước và sau vòng sửa) | nạp lại bộ khung ứng dụng | — |
| | vừa bị 401 | 0 (chỉ phép đo) | chờ token KHÁC; không có thì dừng, không gửi lại | — |
| Ứng dụng khi nạp | route dữ liệu hoặc tệp tĩnh có thật | 5 | trang thử thách, khung không nạp | — |
| | bộ khung qua đường dẫn không phải tệp tĩnh | 10 | khung nạp, ứng dụng cấp token | — |
| | profile chưa từng đăng nhập | 3 | khung nạp, không có token; dừng sau một đường dẫn | người vận hành đọc dòng `AUTH FAIL [S02]` |
| Thử đường kế | khung nạp mà không có token → dừng ngay | 1 (mã sau vòng sửa) | một đường dẫn | — |
| | thử đủ ba rồi dừng | 2 (mã trước vòng sửa, profile trống) · 0 (phép đo) | ba đường dẫn, rồi dừng | — |
| Kết cục lời gọi API | có dữ liệu | 54 (9 + 18 + 9 + 18) | ghi snapshot | transform S02 đọc snapshot |
| | 401 một lần rồi thành công · 401 hai lần · 401 mà token không đổi · lỗi máy chủ | 0 (chỉ phép đo) | gửi lại bằng token mới / dừng / dừng / đếm một lời lỗi | — |
| Lệnh của người | `login` đúng nguồn · không mở được Chrome | 0 (chỉ phép đo, qua CLI thật với Chrome giả) | thoát 0 kèm hướng dẫn / thoát 1 kèm lý do | Mạnh |
| Người đọc phía sau | script đêm S02 | — | `collect` thoát khác 0 thì `set -e` dừng trước transform; chọn bản thu theo tên, bỏ thư mục chấm | `scripts/*-daily.sh` |
| | bộ đo độ tươi | — | đọc giờ thu trong DB, không đọc log | `scripts/lib/freshness.mjs` |
| | dòng `AUTH FAIL [S02]` | — | chưa có bộ đọc (ngoài phạm vi) | — |

### Bảng phủ ca sau khi bỏ cửa sổ (đêm 25/11, mã cuối cùng, không cửa sổ)

| Chiều | Giá trị | Số lần đo | Kết cục |
|---|---|---|---|
| Trang thử thách với trình duyệt không cửa sổ | đường dẫn không phải tệp tĩnh | 0 lần | khung nạp được; không cần đổi cờ nào để qua chặn |
| Trạng thái token lúc đọc | hết hạn | 1 (20:15) | ứng dụng cấp lại sau 6,7 giây |
| | còn hạn hơn lề | 1 (20:19) | dùng ngay (20:19); lượt 1 thị trường: 9 lời gọi, 9 bản ghi, 0 lỗi, 0 chặn |
| | còn dưới lề (giữa lượt) | 1 (20:30) | làm mới trước lời gửi, nhận token mới «còn 15 phút»; lượt 2 thị trường: 18 lời gọi, 18 bản ghi, 0 lỗi, 0 chặn |
| Ứng dụng khi nạp | profile chưa từng đăng nhập | 1 (20:20) | dừng sau một đường dẫn (67 giây), đúng một dòng `AUTH FAIL [S02]` |
| Cửa sổ bật lên màn hình | mọi lượt trên | 0 | — |

## Đo

Không có giao diện nào. Năm phép đo ở `_acceptance/s02-phien-qua-khung-ung-dung/probes/`, mỗi phép chạy trên bản
thật (phải đạt hết) rồi trên bản đột biến (phải đỏ đúng ô):

| Phép đo | Đo gì | Bản thật | Bản đột biến |
|---|---|---|---|
| `han-va-lam-moi.mjs` | ma trận hàm thuần: lề token, giữ token, thử đường kế, chẩn đoán, thứ tự ứng viên, tham số đăng nhập, chỗ profile; hành vi của phép xếp đường và trình lấy token với bước nạp giả | 38 ô | 14 |
| `loi-xac-thuc.mjs` | hành vi `call()` với hàm gửi giả: làm mới trước khi gửi, 401 với token khác / token không đổi / hai lần, làm mới hỏng, lỗi thường | 7 ca | 3 |
| `noi-day.sh` | đo tĩnh thân hàm nạp: mọi lối ra có token đi qua kiểm lề, không chờ cứng, `page.goto` đúng chỗ, trình duyệt mở không cửa sổ | 4 phép | 5 |
| `lenh-login.sh` | lệnh `login` đen-trắng qua chính CLI đã build (Chrome giả): dừng đúng chỗ, báo lỗi mở Chrome | 2 phép | 1 |
| `vung.sh` | tệp đổi chỉ nằm trong vùng của hàng | 6 tệp | 1 (cấy tệp) |

Bộ test collector (`config:executors.test.collector`, gồm 40 ca của tệp test của hàng này) và lệnh CLI
(`config:executors.script.cli`) chạy đủ.

## Giới hạn đã thấy

- Hành vi thật với trình duyệt và phiên (các ô có số lần ở bảng phủ ca) không xếp thành eval: cần phiên của Mạnh và
  mỗi lần chạy là lưu lượng thật. Trong eval, phần trình duyệt chỉ đo được tĩnh (`noi-day.sh`) và qua hàm nạp giả;
  các hàm quyết định đo được bằng hành vi.
- Cách này dựa vào trang web của nguồn: nguồn siết luật thử thách cho cả đường dẫn tĩnh thì gãy lại. Khi đó lượt
  dừng sạch với chẩn đoán «KHÔNG nạp được khung», không gọi gì vô ích.
- Cửa sổ của lệnh `login` phải đóng trước lượt 19:05; còn mở thì bộ thu không mở được profile và dừng với dòng
  `AUTH FAIL [S02]` nói rõ việc đóng cửa sổ.
- Chế độ không cửa sổ đứng được vì nguồn không thử thách các đường dẫn `/favicon.ico`, `/robots.txt` kể cả với trình
  duyệt không cửa sổ (đo 20:15). Nguồn siết thì lượt dừng với chẩn đoán «KHÔNG nạp được khung»; bộ thu không tự quay
  lại mở có cửa sổ — khi đó cần Mạnh quyết.
- Hạn của phiên đăng nhập chưa đo được (tháng 10 dùng mỗi đêm được 9 đêm rồi chết). Hết thì Mạnh chạy lệnh `login`.
