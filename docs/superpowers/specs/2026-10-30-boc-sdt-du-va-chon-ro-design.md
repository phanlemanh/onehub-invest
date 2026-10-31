# Bộ bóc SĐT đủ và tin chọn số rõ (SD2) — thiết kế

Hàng SD2 của lộ trình (đợt `nguoi-sdt-3010`, dãy P1). Căn cứ đo: `docs/research/audit-bang-nguoi-sdt-3010.md` §2 (N4, N5,
N6). Đo lại 30/10 trên DB máy thu :5433 ở chế độ chỉ đọc. S03 có 34.351 bài, 13.325 bài có số; bộ dò rộng thấy 46 bài sót,
19 văn bản khác nhau, đúng bốn dạng (`ddd dd•dd ddd` 32 bài · `(+dd) dddd ddddd` 7 · `ddd. dd.ddddd` 4 · `(ddd) dddd ddd` 3);
thêm 29 bài sót vì trần 3 số mỗi bài. 27 bài nhận số 11 chữ số. Mức tin S03 có 11 tin nhiều số, 3 tin rỗng SĐT dù bài có
số, 1 tin mang số 11 chữ số. S05 không sót bài nào, có 1 tin nhiều số.

## 1. Phạm vi

- **Làm**: bộ bóc `extractPhones` (S03, S05 dùng chung) nhận thêm bốn dạng viết tách lạ và không nhận số 11 chữ số. Tin
  chọn `seller_phone` bằng một luật trên **mọi** bài của tin, không lấy số đầu của bài đầu. Log transform đếm tin nhiều SĐT.
  Hàm chuẩn hoá E.164 dùng chung để SD3 viết khi nối (viết sẵn mà chưa nối thì SD3 phải sửa lại khi đổi chữ ký).
- **Không làm**: đổi dạng số ra. SD2 vẫn trả `0xxxxxxxxx`, nên `seller_phone_hash`, bí danh `sdt_bam`, `sellers.phone_hash`,
  `properties.seller_phone_hash` và bản cloud giữ nguyên. Đổi sang `+84…` cùng mọi hệ quả về băm, bí danh và cloud là của
  SD3 `sdt-luu-goc-e164` (migration 060), để khoá SĐT chỉ đổi một lần. Đây là trang tri thức «Người và SĐT», quyết định
  30/10, và lời giám sát 30/10. Câu giao hàng SD2 trên lộ trình còn ghi «trả số dạng +84…»; thẻ Cổng Phạm vi nói rõ chỗ
  tách này.
- Không đọc SĐT ở S06 (N11), không đọc số trong ảnh, không gộp người (SD hàng khác).

## 2. Bộ bóc

- Hai biểu thức. `PHONE_RE` cũ **giữ nguyên** và chỉ `gatSo` dùng, để chữ dùng đọc giá và diện tích không đổi một byte.
  Bộ bóc dùng biểu thức mới `SDT_RE`:
  - tiền tố `0`, `+84`, `84`, `(+84)`, `(84)`, hoặc đầu số trong ngoặc `(0dd)`;
  - giữa hai chữ số có tối đa **hai** ký tự tách trong tập `.` `-` dấu cách tab `•` `·`. Xuống dòng **không** là ký tự
    tách, nên hai số trên hai dòng không bao giờ nối nhau;
  - sau tiền tố lấy **đúng 9** chữ số (số đủ 10 chữ số), chặn hai đầu không dính chữ số (guard `(?<!\d)…(?!\d)`);
  - đuôi: sau 10 chữ số, nếu còn ký tự tách rồi chữ số thì chỉ chấp nhận khi phần tiếp theo tự là một SĐT hợp lệ (hai số
    kề nhau, «0912 345 678 0987 654 321» ra hai số). Phần tiếp theo không thành SĐT (một hay hai chữ số lẻ) thì cả khớp là số
    11+ chữ số và bị bỏ.
- Chuẩn hoá: bỏ mọi ký tự không phải số, `84…` thành `0…`. Chỉ nhận đúng **10** chữ số với đầu số di động `0[35789]`. Khớp
  ra 11 chữ số thì bỏ cả khớp, không cắt bớt để «cứu» số.
- Trần 3 số mỗi bài: **Hỏi-1** (mục 5). Nháp giữ trần.
- Ma trận hình thái AC-1 sinh toàn phần: 6 tiền tố × 5 ký tự tách × một/hai ký tự tách = 60 ô, mỗi ô một số cố định chép
  tay; cộng dòng bốn dạng sót của audit và các dạng đã bắt.
- Ca không được bắt nhầm (ma trận âm có đối chứng dương cùng câu): giá nhóm nghìn `3.000.000.000`, diện tích `65m2`, ngày
  `30/10/2026`, mã căn `S10.03`, số cố định `024…`, dãy 12 số, số trong URL.

## 3. Tin chọn số

- Hàm thuần `chonSdtTin(bai)` trong `transform-zalo.mjs`; S03 và S05 (`transform-fb.mjs`) cùng gọi. Đầu vào là các bài của
  tin `{post_id, posted_at, phones}`.
- Luật: số nằm trong **nhiều bài nhất**. Hoà thì xét bài theo thứ tự neo (posted_at sớm nhất, hoà thì post_id nhỏ nhất — cùng
  định nghĩa «post neo» ở `lib/offer-key.mjs`): lấy số hoà đầu tiên theo thứ tự trong bài sớm nhất có chứa số hoà. Không bài
  nào có số thì `null`.
- Khoá gom tin (`repostKey`) vẫn dùng số đầu của bài khi bài không có người gửi. Không đổi khoá gom trong vòng này; phép đo
  AC-9 chứng tập tin không đổi.
- Log transform thêm một dòng `tin nhiều SĐT: <n>` cho mỗi nguồn: `n` = số tin mà hợp các số trên mọi bài của tin có ≥ 2
  số khác nhau.

## 4. Đo trên dữ liệu thật

- `pipeline/scripts/do-boc-sdt.mjs` chạy trên DB thử `oneinvest_p1_n1` (chép từ `oneinvest`, xoá sau). Ba bước:
  1. Chạy transform S03 và S05 bằng bản **trước** (chép `transform-zalo.mjs`, `transform-fb.mjs` từ merge-base với `main`
     thành tệp cạnh tệp thật, rồi xoá). Chụp tập tin: nhóm `post_ids`, giá, diện tích, kind.
  2. Chạy bản mới, chụp lại, so: tập tin giống hệt.
  3. Đo: bài sót theo bộ dò rộng (trừ bài chạm trần) = 0; bài nhận số 11 chữ số = 0; 3 tin S03 rỗng SĐT mà bài có số
     thành có; mọi `seller_phone` = `chonSdtTin(bài của tin)`, khớp `^0[35789]\d{8}$`, băm đúng `sha256(số)`; dòng log
     «tin nhiều SĐT» bằng số thước đếm bằng **bộ dò rộng** (độc lập với bộ bóc), in cạnh số audit (S03 11, S05 1).
- Cặp đỏ của thước: chạy bước 3 trên kết quả của bản trước phải đỏ, ghim «sót» và «11 chữ số».

## 5. Hỏi người

- **Hỏi-1 — trần 3 số mỗi bài**. Khuyến nghị **giữ**: 29 bài chạm trần là một bài danh bạ 33 số đăng lặp 29 lần, không
  phải tin của một người bán. Tin chỉ lấy một số nên bỏ trần không đổi `seller_phone` của tin nào hôm nay. Lối khác là bỏ
  trần, đổi lại bài danh bạ đưa 33 số vào chỗ chọn số và vào bí danh danh bạ sau này.

## 6. Ảnh hưởng

- `parse.test.mjs` có ca «SĐT 11 số (đầu số mới)» đang chờ nhận số 11 chữ số. Ca này đổi thành chờ rỗng, đúng câu giao «bỏ
  số 11 chữ số». Tệp không thuộc hồ sơ đã ký nào.
- Khoảng 14 tin (11 + 3) đổi hoặc có thêm `seller_phone`, nên `seller_phone_hash` của chúng đổi. Danh bạ tự nhận bí danh
  mới ở lượt dựng kế. Đó là sửa đúng, không phải đổi khoá.
