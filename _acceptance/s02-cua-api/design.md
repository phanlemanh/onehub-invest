# s02-cua-api — thiết kế

## Bối cảnh và nguyên nhân (số đo ngày 24–26/11)

- Lượt 19:05 của S02 thất bại mỗi đêm từ 29/10. Từ 24/11: `AUTH FAIL [S02]` rồi `FAILED: appToken ĐÃ HẾT HẠN`.
  Lượt 19:05 ngày 26/11 (mã cũ) vẫn y như vậy.
- Nguyên nhân: mã cũ mở profile bằng trình duyệt tự động, nạp đúng route dữ liệu, chờ 6 giây rồi đọc
  `localStorage.auth.appToken`. Route dữ liệu trả trang thử thách cho trình duyệt có kết nối gỡ lỗi nên ứng dụng
  không tải, token (hạn 15 phút) không được cấp lại.
- Phép phân tích tĩnh gói JS của ứng dụng (REA, 26/11) cho thấy ứng dụng tự cấp phiên bằng hai lời:
  `POST /v1/fetch_id_token` thân `{refresh_token, client_id}` → `{id_token}`; rồi `POST /v1/fetch_app_token` với
  `Authorization: Bearer <id_token>` → `{token}`. Thân lời hai thường rỗng (không giả danh tài khoản khác).
- Phép thử tối thiểu 26/11 17:57: gọi đúng hai lời đó từ Node bằng phiên đọc trên đĩa → 200, 200, rồi một lời dữ
  liệu 200. Không chạm trang thử thách.

## Cách làm

1. **Không mở trình duyệt khi thu.** Phần lấy token tách sang một mô-đun riêng; bộ thu không còn nhập
   `playwright-core`. Trình duyệt chỉ còn ở lệnh `login`: Chrome THƯỜNG, đúng profile của bộ thu, Mạnh tự đăng nhập.
2. **Đọc phiên trên đĩa theo đúng định dạng.** Chrome giữ localStorage trong LevelDB tại
   `<profile>/Default/Local Storage/leveldb/`. Mô-đun đọc:
   - tệp log (`.log`): bản ghi 7 byte đầu + thân, chia khối 32 KB, bản ghi dài bị cắt đoạn FIRST/MIDDLE/LAST; thân là
     một WriteBatch với khoá đầy đủ;
   - bảng (`.ldb`): chân trang → khối chỉ mục → khối dữ liệu; khoá bị nén tiền tố; khối có thể nén snappy (bộ giải
     nén viết trong mô-đun, định dạng gốc snappy);
   - mọi phiên bản mang số thứ tự ghi; bản có số lớn nhất thắng, bất kể tệp. Tệp hỏng → ném lỗi nói tên tệp.
3. **Tra đổi token** bằng đúng hai lời của ứng dụng; mỗi lần gửi một `rateLimit.take()`, mỗi lời chờ tối đa 15 giây;
   lỗi mạng/5xx thử lại tối đa ba lần; 4xx không thử lại.
4. **Phân loại phản hồi** thành một hàm thuần: bị chặn (429, `cf-mitigated: challenge`, lỗi kèm HTML) · ok · lỗi xác
   thực (401/403 JSON) · tạm thời (5xx) · lỗi khác. Dấu hiệu thử thách xét trước mã trạng thái.
5. **Trình lấy token**: đọc đĩa một lần cho cả lượt; token còn hạn thì dùng lại; sắp hết hạn (dưới 30 giây) hoặc vừa
   bị 401 thì tra đổi mới; refresh token đổi khi nguồn xoay phiên.
6. **Dòng chuẩn cho người vận hành**: `AUTH FAIL [S02] <mốc>` CHỈ khi lỗi phiên; `BỊ CHẶN [S02] <mốc> …` khi nguồn
   chặn (dừng cả lượt, không lách); lỗi mạng là `FAILED:` thường. Ca kiểm tĩnh có sẵn ghim literal AUTH FAIL ở đúng một
   tệp bộ thu — mô-đun mới không chứa literal đó.
7. **`call()`**: bị chặn → dừng cả lượt; lỗi từ bước làm mới (trước lời gửi và sau 401) luôn dừng cả lượt; lỗi thường
   (500, mạng) vẫn chỉ là một lời lỗi lẻ.
8. **CLI**: lệnh `login`, mỗi lệnh một nhánh đóng; hợp đồng `Collector` (`core/types.ts`) không đổi — CLI kiểm có
   hàm `login` rồi mới gọi.
9. **Nhịp** 0,2 lời/giây (5 giây giữa hai lời, chưa kể jitter 2–15 giây của scheduler).

## Bảng phủ ca (ô ghi «phép đo» chỉ có trong eval; số chạy thật ngày 26/11)

| Chiều \ Giá trị | Kết cục | Đo ở đâu | Ai đọc đầu ra phía sau |
|---|---|---|---|
| Bản ghi phiên \ tệp log, khoá đầy đủ | đọc được | AC-2, E1 | trình lấy token |
| Bản ghi phiên \ tệp log, cắt đoạn 32 KB | ghép đủ | AC-2, E1 (bản đột biến bỏ đoạn FIRST) | trình lấy token |
| Bản ghi phiên \ bảng, nén tiền tố + snappy | đọc được | AC-2, E1 (bản thật: 23/23 khối của kho thật đều nén) | trình lấy token |
| Bản ghi phiên \ nhiều phiên bản, khác tệp | số lớn nhất thắng | AC-2, E1; kho thật: tệp log 3483 > bảng 3440 | trình lấy token |
| Bản ghi phiên \ mới nhất bị xoá | `null` → «chưa đăng nhập» | AC-2, E1 | trình lấy token |
| Bản ghi phiên \ tệp hỏng | ném, nói tên tệp | AC-2, E1 | người vận hành |
| Cửa xác thực \ 200 đủ | hai lời, trả token | AC-3, E2 | `call()` |
| Cửa xác thực \ 401, 403 JSON | `LoiXacThuc`, một dòng AUTH FAIL | AC-3, AC-4 | thước độ tươi |
| Cửa xác thực \ 429, thử thách, HTML lỗi | `LoiBiChan`, một dòng BỊ CHẶN | AC-3, AC-4 | người vận hành |
| Cửa xác thực \ 5xx, lỗi mạng dưới 3 lần | thử lại rồi xong | AC-3, E2 | `call()` |
| Cửa xác thực \ lỗi mạng hết 3 lần | lỗi thường, không AUTH FAIL | AC-3, AC-4 | tệp log lượt |
| Lời dữ liệu \ 200 | một bản ghi | AC-5, E3; chạy thật: 9 và 18 bản ghi | pipeline |
| Lời dữ liệu \ 401 một lần | làm mới, gửi lại | AC-5, E3 | pipeline |
| Lời dữ liệu \ 401 mà token không đổi | dừng, một dòng AUTH FAIL | AC-5, E3 | thước độ tươi |
| Lời dữ liệu \ 403, 429, thử thách | dừng, một dòng BỊ CHẶN | AC-6, E3 | người vận hành |
| Lời dữ liệu \ 500 | một lời lỗi lẻ | AC-5, E3 | pipeline |
| Lệnh \ `login` đúng nguồn | mở đúng profile rồi dừng | AC-9, E3 | Mạnh |
| Lệnh \ `login`, Chrome không mở | thoát 1, có lý do | AC-9, E3 | Mạnh |
| Lệnh \ `login`, nguồn không có | Usage, thoát 1 | AC-9, E3 | Mạnh |

Ô bỏ: chạy thật với nguồn sống không xếp thành eval (lưu lượng thật, cần phiên của Mạnh) — ba lần chạy thật ghi ở
Notes của hợp đồng.

## Đo

- Ba tệp test của hàng: đọc phiên (35 ca) · tra đổi token (18 ca) · bộ thu và lệnh `login` (35 ca). Phiên và kho
  localStorage trong test dựng bằng số, không dùng phiên thật.
- Phép đo `chay-test-dot-bien.mjs`: chạy tệp test trên bản dist thật, rồi trên từng bản đột biến (bản chép của dist,
  đúng một điểm đổi) — mỗi bản phải làm đỏ ít nhất một ca ngoài số ca đỏ sẵn của bản đối chứng. 23 bản đột biến.
- Phép đo tĩnh `khong-trinh-duyet.sh`: không mở trình duyệt; dòng chuẩn ở đúng một tệp — mỗi phép có một tệp cấy
  làm đỏ.
- Phép đo vùng `vung.sh`: nhánh chỉ đổi đúng vùng; hai tệp cấy bị bộ lọc gọi tên.
- Trọn bộ test collector (`config:executors.test.collector`) và lệnh CLI (`config:executors.script.cli`).
- Ngoài eval: bộ đọc phiên đối chiếu với bộ dò độc lập trên 403 mục của kho thật (lệch 0) và bốn lỗi cấy vào bản
  biên dịch (cả bốn bị bắt) — công cụ ở `research-local`, không vào kho.

## Giới hạn đã thấy

- Hạn của refresh token chưa biết. Hết hạn thì lượt dừng với một dòng AUTH FAIL và Mạnh chạy lại lệnh `login`.
- Không kiểm CRC của LevelDB (chỉ kiểm cấu trúc: ranh giới mục, điểm khởi động lại, kích thước). Tệp hỏng nhẹ có thể
  không bị phát hiện; tệp ghi dở thì dừng ở đó như LevelDB.
- Một lời 200 kèm `cf-mitigated: challenge` được coi là bị chặn (dừng lượt). Nguồn chưa từng trả dạng này trong các
  lần đo; chọn hướng an toàn.
- HTTP 403 ở API dữ liệu được coi là bị chặn (dừng cả lượt) theo lời Mạnh «bị 403/429 → dừng, không lách». Nếu nguồn
  dùng 403 cho một endpoint không có trong gói tài khoản thì cả lượt dừng — chưa gặp.
