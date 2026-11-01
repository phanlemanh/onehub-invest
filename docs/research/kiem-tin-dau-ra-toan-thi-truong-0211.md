# Kiểm tin đầu ra toàn thị trường: người bán, xoá trùng, làm giàu, tìm tin

Ngày đo: 02/11/2026, 05:20 giờ VN (DB local :5433, chỉ đọc). Trạng thái: **báo cáo để Mạnh quyết**, chưa dựng gì, chưa thêm
hàng lộ trình. Số S03 chi tiết theo nhóm thuộc phiên `audit-s03`; phần này chỉ dẫn các số ngang nguồn.

## 1. Kết luận

Ba câu hỏi, cả ba đều chưa:

1. **Tin đầu ra đã đủ dữ liệu người bán chưa? Chưa.** Chỉ 3,3% tin có SĐT (1.604/48.560), S06 là 0%. Tên có gần đủ nhưng không
   phải lúc nào cũng là người thật. Loại người bán không có trên tin chuẩn ở nguồn nào. Không người bán nào gộp được qua hai
   nguồn: 0/314 SĐT xuất hiện ở hơn một nguồn. Trên cloud không có cả tên lẫn SĐT.
2. **Pipeline đã xoá trùng, làm giàu, trả về tin tốt hơn chưa? Chưa.** `sale_offers` chỉ là view một-một trên bản ghi gốc, nên
   «tin chuẩn» đến nay **không hơn gì bản ghi gốc**. Xoá trùng giữa các nguồn chưa chạy: 0/42.034 căn có hơn một nguồn. Lớp căn
   kém hơn bản ghi: trung bình có 0,53/3 trường, trong khi bản ghi đủ nhất của cùng cụm có 2,46/7. Tin chuẩn còn mất bớt so với
   thô: tiêu đề, mô tả, dự án, tên đường (thô 96,5%, chuẩn 16–20%). Giá trị thêm có thật hiện chỉ gồm phường, thước giá và
   494 tin có lịch sử đổi giá.
3. **Đủ làm «tìm bất kỳ tin nào» ở cổng Invest chưa? Chưa, kể cả phần «bất kỳ» lẫn phần «tốt hơn».** Công khai hôm nay không có tin
   rao nào (`/api/v1/offers` trả 401 trên prod), chỉ có 838 listing S01. S06 đủ làm **danh mục tin ở 3 vùng** nếu chuyển trường và
   mở chính sách, nhưng chưa có lý do để gọi là tốt hơn nguồn gốc. S03 chưa đủ để hiện: 3,5% tin có phường, mẫu đọc 50 tin có 15
   tin sai giá hoặc diện tích.

**Đề xuất cho 05/11:** bản tìm tin cho đội dùng trước (FRAMING D2), chỉ S06, trong `/ops`. Công khai sau, khi có quyết định về nội
dung và liên hệ (§8). Em không khuyên gắn nhãn «tin chất lượng hơn» vào ngày ra mắt: số đo chưa cho phép.

**Một sai số cần sửa ngay:** ROADMAP §4 ghi mục tiêu S06 «~45.000 **tin bán**» và mốc 31/10 «29.762 tin bán», nhưng hôm nay tin bán S06
chỉ có **19.954**; con số 45.760 là bán + thuê. Mốc 29.762 không thể là tin bán. Nếu chỉ tính tin bán, mục tiêu 45.000 còn xa, và
tổng nguồn đo được ở 3 vùng mới là ≥ 23.205 tin bán (§7).

## 2. Phễu tổng

### 2.1 Theo nguồn

| Nguồn | Thô | Bản ghi `sale_offer_records` | `sale_offers` chưa rút | Thấy trong đợt thu từ 31/10 | Căn `properties` | Hiện được công khai hôm nay |
|---|---|---|---|---|---|---|
| S06 bán | 20.392 tin | 19.954 | 19.954 | 15.108 | ┐ 42.034 (chỉ từ S06) | 0 |
| S06 thuê dài hạn | 28.863 tin | 25.806 | 25.806 | 16.723 | ┘ | 0 |
| S03 | 52.543 bài (26.421 nội dung khác nhau) | 3.083 (19.807 bài) | 2.772 (bán 854, thuê 1.918) | 910 thấy trong 48 giờ | 0 | 0 |
| S05 (paused) | không đo lại | 56 | 28 | 0, lần cuối 21/10 | 0 | 0 |
| **Tin rao cộng** | | **48.899** | **48.560** | | **42.034** | **0** |
| S01 thuê ngắn hạn | 1.081 | `listing_records` 838 | 838 (Hà Nội 445, TP.HCM 393) | | không ghép, theo FRAMING §8 | 838 |
| S02 | 30.922 + 79.209 | | | | | không tính, chỉ hiệu chuẩn |
| S08 | 39.888 dòng | | | | | không tính, chỉ nội bộ |

### 2.2 Rơi ở đâu, vì sao

- **S06 thô → bản ghi: rơi 3.495 tin (7,1%)**, gần như toàn bộ vì thiếu diện tích; 6 tin thiếu giá. Chúng là tin thật, chỉ không vào được
  thước. Tính năng tìm «bất kỳ tin nào» sẽ không thấy chúng. Theo vùng: Hà Nội 2.324, Đà Nẵng 1.089, TP.HCM 82.
- **S06 bản ghi → căn: rơi 11 tin** (không có toạ độ). 45.749 tin tạo 42.034 căn; 38.892 căn chỉ có một tin.
- **S03 bài → bản ghi: còn 37,7% bài.** Không phải bài nào cũng là tin rao; tách lý do rơi là phần của `audit-s03`. 19.592 bài sống gom thành 2.772 tin (7,1 bài mỗi tin).
- **Rút bản ghi:** 297 do đổi khoá (S03 269, S05 28), 42 do hết trong lượt (S03). S06 **chưa từng rút tin nào**.
- **Bậc dữ liệu (chụp 01/11):** căn B2 36.503, B0 5.531; tin lẻ B0 2.798, B1 13; **0 đơn vị từ B3 trở lên**. Thang FRAMING §3.4 lấy B3
  làm mức thấp nhất có số đo.

### 2.3 «Sống» đang có nghĩa gì

Hiện có ba cột trông như nhau mà nghĩa khác nhau:

| Thứ | Nghĩa thật | Đo |
|---|---|---|
| `offer_status = active` | S06 ghi mọi tin là active, không có bằng chứng ngừng | 45.760/45.760 |
| `last_seen` (S06) | **Là giờ đăng hoặc đẩy tin (`list_time`), không phải giờ máy thấy tin**: 45.760/45.760 bằng `list_time`, 0 bằng giờ thu (bước transform S06) | 6.557 trong 48 giờ. Đây là con số 6.559 đo 02/11, và **nó đếm tin đăng mới, không đếm tin còn sống** |
| `captured_at` ở bảng thô S06 | Lần thu gần nhất còn thấy tin | 35.442 tin thô trong 48 giờ; 31.831 tin đã thành bản ghi (bán 15.108, thuê 16.723) |

Vậy 6.559 đánh giá thấp, còn 45.760 đánh giá cao. Số gần nhất với «đang sống» là **31.831 (69,6%)**, và vẫn là chặn dưới vì mỗi lượt
thường chỉ đọc 1.250 tin mỗi luồng:

- **Hà Nội** (lượt sâu 31/10 gần hết nguồn): 88,8% tin bán còn thấy, 11,2% (425 tin) không còn thấy. Đây là ước lượng tỉ lệ tin đã rời
  nguồn tốt nhất hiện có, sau khoảng 4 tuần tích luỹ.
- **TP.HCM:** 67% tin bán còn thấy, chủ yếu do lượt thu chưa chạm đáy nguồn, không thể suy ra tin đã chết.
- **Đà Nẵng:** mới thu từ 31/10, nên 100% là không có nghĩa gì.

Đề xuất định nghĩa: **«thấy lần cuối» = giờ thu**, tin bán hiện khi thấy trong N ngày, và `offer_status` chỉ đổi theo bằng chứng (ADR-0013 §7).
Mức N cần đo theo vòng quét đủ sâu; chưa đo được với TP.HCM.

## 3. Dữ liệu người bán trên tin đầu ra

### 3.1 Tỉ lệ theo nguồn (`sale_offers` chưa rút)

| Nguồn | Tin | Tên | SĐT | ID tài khoản | Loại chủ/môi giới trên tin chuẩn | Người khác nhau |
|---|---|---|---|---|---|---|
| S06 bán | 19.954 | 100%* | **0%** | 100% | **0%** (thô có, xem dưới) | 6.760 tài khoản |
| S06 thuê | 25.806 | 100%* | **0%** | 100% | **0%** | 8.888 tài khoản |
| S03 bán | 854 | 97,3% | 72,2% | 100%, nhưng **là một hằng** | 0% | 141 SĐT |
| S03 thuê | 1.918 | 99,5% | 50,0% | 100%, nhưng **là một hằng** | 0% | 203 SĐT |
| S05 | 28 | 73,9–100% | 100% | hằng | 0% | 21 SĐT |

\* 2.876 tin S06 có tên kiểu «Người bán quận …», «Cộng Đồng …», gần như cùng một tài khoản.

Những điều bảng không tự nói:

- **Một tài khoản S06 đứng tên 2.872 tin (6,3%) dưới 72 tên khác nhau** (`S06:…143821`, nguồn báo 9.019 tin đang đăng). Tên trên tin của
  tài khoản này không chỉ một người, và mô tả có SĐT đã che. Bản chất của tài khoản này chưa đo được; cần xem trước khi hiện công khai «người đăng». Tổng cộng 233 tài khoản ≥ 20 tin giữ 20,7% tin S06.
- **S06 không có SĐT ở dữ liệu thu về**, không phải do pipeline làm rơi: payload không có khoá SĐT, chỉ có cờ `phone_hidden` (7.607 tin); 58 mô tả còn SĐT rõ.
- **Loại người bán có ở thô S06 nhưng không lên tin chuẩn:** cờ tin công ty/môi giới bật ở 81,8% tin, 18,2% còn lại không có cờ, chưa
  kiểm chứng nghĩa của cờ. S03, S05 không có trường này. `CONTEXT.md` ghi rõ «không tự suy vai».
- **`seller_ref` S03 trên DB còn là hằng.** PR #265 đã gộp sáng nay nhưng chưa có lượt nạp lại; số ở đây là trước lượt đó. Danh bạ thì đã
  đúng theo người gửi: 2.809 tin S03 về 487 người.

### 3.2 Có đi tới tầng chuẩn không

| Tầng | Tên | SĐT | ID | Ghi chú |
|---|---|---|---|---|
| Bản ghi / `sale_offers` local | có | S03, S05 | có | |
| Danh bạ `parties`, `registry_aliases` local | có | 314 SĐT | S06 14.545 tài khoản | 15.355 người (S06 14.545, S03 775, S05 35), mỗi người một nguồn; chỉ thấy ở `/ops/people` trên máy thu |
| View `sellers` | có | hash | | **310 người, chỉ người có SĐT**, nên toàn bộ người bán S06 không có mặt |
| `properties` | 8.270 đợt cũ | hash 0 | | Căn tạo sau 27/10 không có tên, giá, phòng |
| **Cloud** `sale_offers` | **không** | **không, chỉ hash** | có, dạng `S0x:<số>` | `PII_EXCLUDE` trong `sync-cloud.mjs` để lại tên và SĐT dù tầng C; chú thích ghi rõ «mở chúng là quyết định sản phẩm riêng» |

### 3.3 Gộp người qua nguồn

**Chưa có.** 314 SĐT nằm ở đúng một nguồn; `sellers` có `multi_channel = false` với cả 310 người. Đây không chỉ là thiếu khâu: S06 không có
SĐT nên khoá gộp `seller_phone_hash` không chạm được 94% tin. Hàng DB2b còn ghi rõ «Không gộp người liên nguồn (Đợt 3)». Gộp theo tên không
an toàn vì tên trùng và tên chung như trên.

## 4. Xoá trùng

### 4.1 Đang làm tới đâu

| Việc | Hiện trạng | Bằng chứng |
|---|---|---|
| Cùng id gốc trong một nguồn | Có, chắc | Khoá `S0x\|id gốc` |
| Đăng lại trong S03 | Có, gom theo nội dung | 7,1 bài mỗi tin; chất lượng thuộc `audit-s03` |
| Cùng căn trong S06 | **Có, thô** | Khoá = ô ~55 m + bán/thuê + loại + DT làm tròn + giá làm tròn **đến 1 triệu**; 3.142 căn có ≥ 2 tin |
| Giữa các nguồn | **Không gộp** | 0 căn có 2 nguồn. `property_offers` chỉ có S06. Bước ghép S03↔S06 chỉ sinh **12 cặp ứng viên**, vì nó đòi cùng phường mà chỉ 52 tin đủ điều kiện |
| Xác minh cặp ghép | Chưa có | 12 ứng viên trên: 10 chờ LLM, 2 chờ duyệt; 0/42.034 căn đã xác minh |

Ba lỗi cấu tạo của khoá căn:

- **Toạ độ S06 không tới mức căn:** 49.244 tin chỉ có 8.207 điểm khác nhau; một điểm gánh tới 433 tin. Cùng toạ độ thường là cùng toà,
  cùng dự án hoặc cùng đoạn đường.
- **Giá đổi là ra căn mới.** 845 liên kết (808 tin) còn trỏ căn cũ sau khi giá đổi, vì `property_offers` không rút. Một căn bị tách theo giá.
- **`resolve-properties` chỉ cộng dồn, không làm giàu:** không ghi giá, phòng, đường, ảnh, người bán. 33.764 căn (80,3%) không có giá.

### 4.2 Kiểm tay

Em tự đọc chữ bài, **không so ảnh**, nên «không đủ căn cứ» bao gồm nhiều cặp mà ảnh có thể phân định. Mẫu ngẫu nhiên, hạt cố định. Khoảng là
Wilson 95%.

| Câu hỏi | Mẫu | Rõ đúng | Rõ sai | Không đủ căn cứ |
|---|---|---|---|---|
| Cụm đã gộp, **khác** người đăng: có cùng căn không? | 30 cụm trong 2.434 | 12 (40%; 25–58%) | 6 (20%; 10–37%) | 12 |
| Cụm đã gộp, **cùng** người đăng: có cùng căn không? | 20 cụm trong 644 | 13 (65%; 43–82%) | 4 (20%; 8–42%) | 3 |

Cụm rõ đúng gần hết là nhà phố, có đường và ngang × dài. Cụm chung cư chủ yếu rơi vào «không đủ căn cứ»: cùng dự án, cùng DT, cùng giá nhưng
không có mã căn. Sai điển hình: tin liệt kê nhiều căn bị coi như một căn, phòng trọ cùng khu, căn cùng toà khác tầng.

| Trùng còn sót, chưa gộp | Mẫu | Rõ trùng | Rõ + nghi trùng |
|---|---|---|---|
| Tin bán S06 | 70 | 5 (7,1%; 3–16%) | 16 (22,9%; 15–34%) |
| Tin thuê S06 | 30 | 0 | 5 (16,7%; 7–34%) |
| Tin bán S03 có cùng tin ở S06 | 50 | 1 (2%; 0,4–10,5%) | 4 (8%; 3–19%) |

Đây là **chặn dưới**: bộ lọc ứng viên chỉ xét DT ±5%, giá ±10%, ≤ 300 m hoặc cùng dự án. Khoá hiện tại bỏ sót ngay các tin lệch vài triệu.
Bài đăng giống hệt chữ cũng chưa gộp: 461 nhóm, 1.248 tin, thừa 787 tin. Con số 2–8% của S03↔S06 **không nên hiểu là hai nguồn ít chồng
nhau**: chữ bài S03 hay ghi mã căn, S06 rất ít khi có, nên nhiều cặp không phân định được bằng chữ. Tỉ lệ chồng lấn thật giữa các nguồn: **chưa đo được.**

## 5. Làm giàu và hợp nhất

### 5.1 Tin chuẩn so với bản ghi gốc

Trên 3.142 cụm có ≥ 2 tin, so cùng mẫu:

| Mức | Số trường có trên 7 (phòng ngủ, WC, số nhà thật, mã căn thật, mặt tiền, số tầng, đường) |
|---|---|
| Một bản ghi trung bình | 2,12 |
| **Bản ghi đủ nhất của cụm** | **2,46** |
| Nếu hợp nhất đúng | 2,53 (chỉ 6,7% cụm có lợi hơn bản ghi tốt nhất) |
| Căn `properties` hôm nay (chỉ có 3 trong số này) | 0,53/3 |

- **Tin chuẩn không hơn bản ghi gốc:** nó chính là bản ghi gốc. Không có cột nào được bù từ tin khác, căn khác hay dự án.
- **Căn còn kém hơn bản ghi.** `photos` 0%, WC 0%, `n_sources` luôn 1, `project_node` 0%.
- **Hợp nhất trong một nguồn không đem lại nhiều**, vì các tin S06 cùng khuôn nên cùng thiếu. Lợi ích sẽ đến từ nguồn khác loại (chữ bài
  S03 hay có mã căn, toà; S06 có ảnh, cấu trúc) hoặc từ danh mục (S08, nội bộ). Cả hai đều chưa nối.
- **`silver_labels`: 0 dòng, `eval_labels`: 0 dòng trên DB này.** Phát biểu có nguồn gốc đã có, nhưng 99,96% là chép từ nguồn, dữ liệu cũ hoặc
  parser: 309.054 `source_field`, 50.278 `legacy`, 16.204 `parser`; chỉ 141 `e2_llm`, 10 `e1_rule`. 151 đề xuất enrich đã áp, 199 còn xếp hàng.

### 5.2 Thô S06 có, tin chuẩn đang bỏ

| Trường | Thô | Tin chuẩn | Cloud |
|---|---|---|---|
| Tiêu đề, mô tả | 100% | **không có cột** | không |
| Tên đường | 96,5% | bán 19,8%, thuê 16,5% (36.655 tin mất) | có phần đã có |
| Tên dự án | 16,4% | không có cột (`asset_nodes` 23 dòng) | không |
| Pháp lý · nội thất · hướng | 45,2% · 49,3% · 15,2% | không có cột | không |
| Ảnh | 99,9%, trung bình 6,3 | bảng `media`: 45.714 tin | không (URL mang tên miền nguồn) |
| Giờ đăng gốc · giá gốc | 76,7% · 18,6% tin giá khác giá gốc | không dùng | không |
| Số tin đang đăng, số tin đã bán của người đăng | 100%, 44% | không | không |
| Toạ độ, số nhà, mã căn | | có | **không**: log sync báo ở lại máy |

### 5.3 Giá trị thêm có thật

- **Phường đã chuẩn hoá:** S06 Hà Nội, TP.HCM có `area_id` đủ (độ đúng của phép gán không đo ở đây). Đà Nẵng 0/6.281, chưa có phường.
- **Thước giá** phường × loại, lên công khai dưới dạng số tổng hợp.
- **Lịch sử giá** (`history_transactional`): 494 tin S06 có đổi giá, mới từ 30/10. Thô có sẵn giá gốc ở 18,6% tin, chưa dùng.
- **Đo đồng nhất:** mọi nguồn cùng khoá, cùng từ vựng, cùng SPL.

Bốn thứ này là chất liệu thật để «tốt hơn nguồn», nhưng chưa thành tin chất lượng hơn.

## 6. Cổng Invest hôm nay

- **Người dùng thấy gì:** Finder, Insight, Lợi suất, So sánh theo thị trường và phường; `/vn/[market]/listings` và `/listing/[id]` **chỉ** hiện listing
  S01 (tối đa 300 listing mỗi thị trường). Số từ tin rao chỉ đi lên qua chỉ số tổng hợp (`/api/v1/asset-stats`).
- **Tìm kiếm:** ⌘K chỉ tìm tỉnh và phường (`search-command.tsx`). Không tìm được tin, dự án, đường.
- **Tin rao bị chặn có chủ đích:** `api-surface.ts` khai `public` «KHÔNG được đọc `sale_offers`», có test. `/api/v1/offers`, `/api/v1/deals` đo trên prod: 401.
  Lý do đóng ghi trong code («lẫn tin mock S03», 23/10) đã hết hiệu lực từ PL2, nhưng mở lại là quyết định riêng. `/ops/deals` cần đăng nhập.
- **Cloud (theo log sync 01/11 22:12Z, leak gate PASS):** `sale_offers` 48.560 · `properties` 42.034 · `property_offers` 46.594 · `sellers` 310 · `listings` 838.
  Em **không đọc trực tiếp cloud được**: truy vấn chỉ đọc qua token quản trị bị chế độ quyền chặn, nên không vòng qua. Danh sách cột lấy từ `sync-cloud.mjs` và
  cảnh báo trong log.

### Trường nào đủ tốt để hiện công khai (chỉ S06)

| Trường | Đủ? | Điều kiện |
|---|---|---|
| Giá, diện tích, loại, bán/thuê | **Đủ** | 100%. Cờ cho ca phi lý: 114 tin bán < 500 triệu, 35 tin thuê ≥ 500 triệu, 527 tin < 15 m² |
| Phường | **Đủ ở Hà Nội, TP.HCM** | Đà Nẵng chưa |
| Phòng ngủ, WC | Được, thiếu thì ẩn | PN 65–82%, WC 49–59% |
| Mặt tiền, số tầng | Được với nhà phố | Bán 49%, 39% |
| Tiêu đề, đường, dự án, ảnh | **Có ở thô, chưa lên** | Đường, dự án: chuyển trường. Mô tả và ảnh: cần quyết về quyền nội dung và che tên miền |
| **Số nhà** | **Không** | Trông như 52%, nhưng 12.409 là `0`, 992 là `1`; thật sự có số: 17,9% tin bán. Ghi `0` mà gắn lớp `fact` là lỗi. FRAMING §3.3: không hiện số nhà người đăng giấu |
| **Mã căn** | **Không** | Thật sự có: 2,6% tin bán; 5.781 là `0`. Trường lõi của D3 nhưng gần như chưa có |
| Trạng thái chào | **Không** | Luôn active, không có căn cứ. Dùng «thấy lần cuối» |
| Người đăng | Một phần | Tên được theo tầng C, trừ tài khoản gom; xem §3.1 |
| Liên hệ | **Không có** | SĐT 0%, `listing_url` 0%. Dẫn về nguồn lại lộ tên nguồn, tầng A |
| S03 | **Không** | Phường 1–10%, loại 0–12%, DT 21–62%; mẫu 15/50 sai giá hoặc DT (19–44%), đối chiếu `audit-s03` |

## 7. «Toàn thị trường» so với thực tế

Mẫu số duy nhất có căn cứ là tổng tin **của chính S06** (hỏi API công khai 02/11, tối đa 10.000 mỗi truy vấn; `research-local/`):

| Tin bán S06 | Nguồn báo | Máy thấy từ 31/10 | Phủ |
|---|---|---|---|
| Hà Nội | 3.453 | 3.675 | ~100% |
| Đà Nẵng | 2.671 | 2.785 | ~100% |
| TP.HCM căn hộ | 3.776 | 3.993 | ~100% |
| TP.HCM nhà | ≥ 10.000 (chạm trần) | 4.251 | **≤ 43%** |
| TP.HCM đất | 3.043 | 731 | **24%** |
| TP.HCM thương mại | 262 | 49 | 19% |
| **Cộng 3 vùng** | **≥ 23.205** | **15.484** | **≤ 67%** |

Tin thuê TP.HCM còn thấp hơn: 10.108 trên ≥ 35.574 (≤ 28%). Tin thấy nhiều hơn số nguồn báo là do thời điểm đo khác nhau và có tin đã rời nguồn.

| Chiều | Có gì | Phủ ước tính | Căn cứ |
|---|---|---|---|
| Vùng | S06: Hà Nội, TP.HCM, Đà Nẵng; S03: 28 nhóm; S01: Hà Nội, TP.HCM | 3/34 tỉnh, thành | Đếm cấu hình |
| Căn hộ bán S06 toàn quốc | 3 vùng chiếm 5.537/6.977 | **79%** | Tổng nguồn, không chạm trần |
| Tin bán S06 toàn quốc | | **chưa đo được** | Loại nhà chạm trần 10.000 |
| Nguồn S07 cổng rao | Chưa có bộ thu | **chưa đo được** | Không có mẫu số |
| S03 nhóm khép | 28 nhóm | **chưa đo được** | Không biết thị trường có bao nhiêu nhóm |
| **Toàn thị trường** | | **chưa đo được** | Không có mẫu số chung; không đưa ra tỉ lệ nào để tránh đoán |

Ba mã vùng nháp (`binh-duong`, `hai-phong`, `khanh-hoa`) đang trả **0 tin** từ API. Mục tiêu «5 vùng» cần mã khác (ROADMAP đã ghi điều kiện «tham số vùng đúng»).

## 8. Đánh giá tính năng tìm tin

### 8.1 Sẵn sàng tới đâu

| Để tính năng có nghĩa | Hiện trạng | Thiếu |
|---|---|---|
| Có tin để tìm | S06 ~31.800 thấy gần đây, 3 vùng | Phủ TP.HCM, thêm vùng |
| Tìm được | Có lọc theo cột | Không có chữ, đường, dự án trên tin chuẩn và cloud |
| Tin còn hiệu lực | `last_seen` sai nghĩa | Ghi giờ thu |
| Một căn một dòng | Khoá căn đúng rõ 40–65% | Sửa khoá, rút liên kết cũ |
| Liên hệ được | S06 không có | **Quyết định của anh** |
| Được phép hiện | Sổ API cấm | **Quyết định của anh** |
| Tốt hơn nguồn | Chỉ thước giá, phường, ít lịch sử giá | Xem 8.2 |

### 8.2 Cần gì để tin thật sự tốt hơn nguồn gốc

Trong thứ tự có thể đo được: **(1)** đăng nhiều lần chỉ hiện một dòng, kèm số lần đăng và khoảng giá; **(2)** so thước đúng nhóm, nói rõ độ chắc; **(3)** giá cũ
→ giá mới, số ngày trên thị trường từ giờ đăng gốc; **(4)** «thấy lần cuối» trung thực; **(5)** về sau, tin nhóm khép có mã căn ghép với tin có ảnh, toạ độ của S06:
đây là thứ không một nguồn đơn lẻ nào có.

Đề xuất thước để được nói «tốt hơn»: trên mẫu nhãn đóng băng, độ đúng gộp ≥ ngưỡng anh chốt, tỉ lệ trùng còn sót ≤ 5%, và điền trường ≥ bản ghi đủ nhất của cụm.

### 8.3 Xếp hạng việc nên làm

Chi phí là ước lượng của em theo phiên làm, chưa qua Cổng. Mọi việc chạm dữ liệu phải qua 8 câu ADR-0013.

| # | Việc | Làn | Chi phí | Rủi ro | Kịp 05/11? |
|---|---|---|---|---|---|
| 1 | **Chốt nghĩa «sống»:** thêm giờ thấy lần cuối, giữ giờ đăng riêng; sửa mốc «tin bán» ở ROADMAP | Claude | 0,5 ngày | Thấp; mọi nơi lọc theo `last_seen` phải đọc lại | **Kịp** |
| 2 | **Chuyển trường có sẵn từ thô S06 lên tin chuẩn:** tiêu đề, đường, dự án, giờ đăng gốc, cờ công ty; bỏ `0`, `1` ở số nhà và mã căn | Claude | 1 ngày | Thấp; migration, sổ từ vựng, CLOUD_ALLOW | **Kịp** |
| 3 | **Gộp tin đăng lại của cùng người; rút liên kết căn cũ** | Claude | 1 ngày | Vừa; đúng cao nhất, ít đụng chung cư | **Kịp** nếu làm sớm |
| 4 | **Trang tìm tin S06 trong `/ops` cho đội dùng** (D2): lọc phường, loại, giá, DT, đường, dự án | Claude | 1–1,5 ngày, T2 | Thấp; chưa công khai | **Kịp**, sau 1–2 |
| 5 | Lật tìm tin S06 sang Invest công khai | Claude | 1–2 ngày + Cổng | **Cao:** quyền nội dung, SPL, liên hệ | Chỉ kịp nếu anh chốt §8.4 hôm nay; em không khuyên |
| 6 | Tăng phủ S06: đọc sâu theo quận để qua trần 10.000, đúng mã vùng mới | ZCode | 1–2 ngày | Vừa; nhịp thu, chống bot | Một phần |
| 7 | Đường liên hệ S06 | ZCode, Claude | theo §8.4 | Cao | Không |
| 8 | Sửa khoá căn cho nhà phố (đường, ngang × dài, tầng, băng giá) và cho chung cư (dự án, toà, tầng); dùng S08 làm khung nội bộ | Claude | ~1 tuần | Vừa; cần nhãn | Không |
| 9 | S03 đủ để hiện: đọc giá, DT, phường từ dự án | Claude, `audit-s03` | ~1 tuần | Vừa | Không |
| 10 | Ghép chéo nguồn và gộp người | Claude | 2 tuần trở lên, phụ thuộc 7–9 | Cao | Không |
| 11 | Thu S07 | ZCode | Chưa ước lượng, ROADMAP §3 ghi là «bài toán chi phí» | Cao | Không |

### 8.4 Ba quyết định của anh

1. **Có hiện tin S06 công khai không?** Đây là chép dữ liệu một sàn công khai sang sàn khác, kể cả mô tả và ảnh. Điều khoản của S06 chưa ai rà (khác với S02, S08
   đã có luật). Phương án an toàn hơn: chỉ hiện trường sự kiện (giá, DT, phường, đường), không hiện mô tả, ảnh.
2. **Người xem liên hệ thế nào khi S06 không có SĐT?** Thu SĐT từng tin (thêm tải, thêm rủi ro chống bot, làn ZCode) hay dẫn sang tin gốc (lộ tên nguồn, phải sửa ADR-0007) hay
   chấp nhận chưa liên hệ được (làm cổng tra cứu, không phải kênh giao dịch)?
3. **Có đưa tên và SĐT người bán lên cloud không?** Tầng C cho phép, nhưng `sync-cloud.mjs` đang giữ lại chờ quyết định sản phẩm. Thiếu thì `/ops` trên máy chủ cũng không hiện được tên.

S02 và S08 không tham gia hiển thị ở mọi phương án; S08 chỉ làm khung ghép căn nội bộ, đúng luật 5.

## 9. Cách đo, giới hạn

- DB local chỉ đọc (`default_transaction_read_only=on`), không ghi DB, không chạy transform, không mở DB thử. Cột và ví dụ trong báo cáo đã rút gọn; không dùng tên nguồn thật.
- Hỏi API công khai của S06 (`limit=1`) để lấy tổng tin; đó là cách duy nhất có mẫu số. Tổng có trần 10.000.
- Mẫu kiểm tay do một người chấm (Claude), chỉ đọc chữ, không có người thứ hai, không so ảnh. Đủ để định hướng, chưa phải tập nhãn. Bảng chấm: `research-local/kiem-tin-dau-ra/cham-tay.md`.
- **Chưa đo được:** số trên cloud đọc trực tiếp; tỉ lệ phủ toàn thị trường; chồng lấn thật giữa các nguồn; tỉ lệ tin S06 đã bán hay gỡ ở TP.HCM; độ tươi từ lúc đăng tới lúc hiện;
  nghĩa chính xác của cờ công ty; bản chất tài khoản gom; quyền nội dung của S06.
- Số đo là ảnh chụp lúc 05:20, trước lượt nạp lại sau PR #265 (`seller_ref` S03). DB đã đi tiếp: đọc lại sau đó thấy bản ghi S06 46.926, tin đăng trong 48 giờ 7.719, tài khoản S06 14.833. Các tỉ lệ không vì thế mà đổi kết luận.
