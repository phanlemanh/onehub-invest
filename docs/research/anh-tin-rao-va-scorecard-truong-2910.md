# Ảnh tin rao và scorecard trường dữ liệu theo nguồn (29/10/2026)

- **Câu hỏi của Mạnh**: không thấy ảnh tin rao của S03 (cộng đồng) và S06 (rao vặt công khai). Anh muốn kiểm lại
  scorecard các trường thu được, rồi có đề xuất hoàn chỉnh để thu thập ở mọi nguồn tốt hơn.
- **Cách đo**: DB local :5433, truy vấn chỉ đọc, đo ngày 29/10. Truy vấn và kết quả thô để ở
  `research-local/anh-tin-rao-scorecard-2910/` (gitignored). Cửa sổ 30 ngày gần như trùng toàn bộ dữ liệu, vì S03 thật
  chạy từ 19/10 và S06 từ 21/10.
- Tài liệu này chỉ dùng mã nguồn `S0x`, không có tên hay tên miền thật (ADR-0007). Tên bảng và cột giữ nguyên theo code.

## 0. Kết luận

Ảnh **có thu được** ở cả hai nguồn: 52% bài S03 có ảnh, 99,9% tin S06 có ảnh. Ảnh rơi ở các bậc sau:

| Nguồn | Bậc rơi | Làn | Mức độ |
|---|---|---|---|
| S03 | **Tải ảnh** (collector): từ ~05:00Z 27/10, khoảng 1/3 số ảnh tải lỗi http-500 | ZCode | Mất vĩnh viễn khi URL gốc hết hạn |
| S03 | **Transform**: tin chỉ-ảnh không được gộp vào tin chữ, nên chỉ 31% offer có ảnh | Claude (PL28) | Nặng nhất cho người duyệt |
| S06 | **Transform + app**: ảnh dừng ở `stg_chotot_ads`; `/ops` chỉ đọc ảnh từ bảng post của S03 | Claude | 0% offer S06 hiện ảnh, kể cả ở máy thu |
| Cả hai | **Cloud**: chưa có đường ảnh lên cloud (hàng TV9 chưa mở) | Claude (TV9) | 0 ảnh trên `/ops` cloud, đúng như thiết kế hiện tại |

Scorecard thu thập (`pipeline/dq-scorecard.mjs`, các dòng `scorecard:*`) **chưa tồn tại**: hàng C2 chưa mở hồ sơ, và
`dq_check_results` chưa có dòng `scorecard:*` nào. Bảy `check_name` đã thiết kế không có chỉ số nào cho ảnh hay cho độ
phủ từng trường ở bậc offer. Khung FIELD_TARGET (G3, làn ZCode) có nhắc «media yield», nhưng chưa có tệp.

## 1. Phễu ảnh theo bậc

### S03 (cộng đồng)

| Bậc | Số đo |
|---|---|
| Raw → `stg_zalo_posts` (nguồn thật, 7 ngày) | 21.630 bài; 11.204 bài có `media` (51,8%); 7.225 bài là **tin chỉ-ảnh**, chữ chỉ là URL ảnh (33,5%) |
| Tải về (`media_files`, DATA-CONTRACT v2) | Có từ 26/10. Bắt đầu từ 27/10, mọi bài có ảnh đều có entry. **Tỉ lệ entry lỗi theo ngày: 0,1% (26/10), 34,3% (27/10), 33,3% (28/10), 27,8% (29/10)** |
| Lỗi theo họ host CDN | Họ ảnh có chú thích: 8/2.338 lỗi. Hai họ chứa ảnh của tin chỉ-ảnh: **1.314/1.971 (67%) và 539/781 (69%)**. Gần như toàn bộ là `http-500` (1.852 entry) |
| File trên đĩa | Mẫu 200 entry không lỗi: có đủ 200 file trong `collector/snapshots/` |
| `stg` → `sale_offers` | 415 offer đang sống. **121 offer (29%) có ít nhất một post có ảnh**, 86 offer có file local. Tính trên 7 ngày: 30,7% |
| Vì sao thấp | Thường thì ảnh đi thành tin riêng, tách khỏi tin chữ của cùng người đăng. Transform chỉ dựng offer từ tin chữ. Trong 294 offer không có ảnh, ghép tin chỉ-ảnh cùng nhóm, cùng người gửi được: **72 offer** nếu chỉ nhìn tin chữ liền trước trong 2 phút; **106 offer** nếu nhìn cả hai phía trong 2 phút; 112 offer nếu nhìn cả hai phía trong 10 phút. Như vậy ảnh thường tới **trước** chữ (gửi album rồi mới gửi chú thích) |
| Hiện ở `/ops` (máy thu) | `/ops/review` và `/ops/data-flow` dựng ảnh bằng `buildOfferImages` (`app/src/lib/ops/review-media.ts`), chỉ cho admin. Có ảnh nếu offer có post mang ảnh |
| Lên cloud | **0**. `stg_zalo_posts` không nằm trong danh sách sync; trên cloud loader trả `{}` |

### S06 (rao vặt công khai)

| Bậc | Số đo |
|---|---|
| Raw → `stg_chotot_ads` | 27.358 tin; 27.326 tin có mảng ảnh (99,9%), trung bình 6,5 ảnh/tin. Lưu ở `images` → `{images:[…], thumbnails:[…]}` (dạng object, không phải mảng) |
| `stg` → `sale_offers` | 25.560 offer. **`sale_offers` không có cột ảnh**, và `transform-chotot.mjs` không chuyển ảnh đi đâu cả. Offer nối được về stg 100% (`originating_system_key = list_id`) |
| Hiện ở `/ops` (máy thu) | **0**. Loader chỉ join `stg_zalo_posts` qua `post_ids`, mà `post_ids` của offer S06 luôn rỗng. Nhánh dự phòng `evidence.image_url` chỉ có ở thẻ mẫu |
| Lên cloud | **0**. Lưu ý: URL ảnh S06 chứa tên miền nguồn, tức tầng A. Không được đẩy URL lên cloud; chỉ đi được bằng ảnh thu nhỏ trong bucket riêng tư, đúng như sửa đổi ADR-0007 ngày 26/10 |

### `properties` (Một Căn Nhà)

23.872 căn, `photos` có ảnh ở **0%** vì `resolve-properties.mjs` không chép ảnh. Offer S03 được gắn vào căn: **0**
(`property_offers` chỉ có offer S06). Việc này không chặn `/ops` hôm nay, nhưng TV10 «hồ sơ tin» sẽ cần.

## 2. Scorecard trường theo nguồn

Ô «—» nghĩa là bậc đó không có cột tương ứng.

### Bậc thu (`stg_*`)

| Trường | S06, 7 ngày (24.181) | S06, 30 ngày (27.358) | S03, 7 ngày (21.630 bài) |
|---|---|---|---|
| Giá | 100 | 100 | — (bóc ở transform) |
| Diện tích | 93,1 | 93,4 | — |
| Phường | 100 | 100 | — |
| Toạ độ | 100 | 100 | — (nguồn không có) |
| Ảnh | 99,9 | 99,9 | 51,8 có ảnh, 33,5 là tin chỉ-ảnh |
| Mô tả (≥ 30 ký tự) | 100 | 100 | ≈ 100 |
| Người bán / người đăng | 100 | 100 | 100 (tên + id) |
| Phòng ngủ | 72,9 | 71,9 | — |

### Bậc offer (`sale_offers`, tin còn sống, theo `last_seen`)

| Trường (%) | S03, 7 ngày (391) | S03, 30 ngày (415) | S06, 7 ngày (14.481) | S06, 30 ngày (25.460) |
|---|---|---|---|---|
| Giá | 98,0 | 97,3 | 100 | 100 |
| Diện tích | **44,2** | 46,5 | 100 | 100 |
| Khu vực con (`area_id` cấp submarket) | **1,0** | 1,2 | 100 | 100 |
| Toạ độ | — | — | — (chỉ có ở stg và `properties.geo` 100%) | — |
| Ảnh (hiện được ở `/ops` máy thu) | 30,7 | 29,2 | **0** | **0** |
| Mô tả | — (post gốc có 100%) | — | — (stg có 100%) | — |
| Tên người bán | **0** (stg có 100%) | 0 | 100 | 100 |
| SĐT (hash) | 74,7 | 74,5 | **0** (API danh sách không trả SĐT) | 0 |
| Phòng ngủ | 52,9 | 50,6 | 73,6 | 74,2 |
| Loại BĐS | 100 | 100 | 100 | 100 |

S05 đang tạm dừng (28 offer cũ). S08 cũng đang tạm dừng.

### S01 (`listings`, 611 tin)

Giá 95,4 · toạ độ 100 · khu vực con 100 · ảnh 97,5 · phòng ngủ 100 · review 94,9. Chỉ **20,1% tin được nhìn lại
trong 7 ngày** (theo `last_seen`), 100% trong 30 ngày. Nhịp làm mới chậm, khớp với nhận xét «~38 PDP/ngày» ở đánh giá
observability 25/10.

S02 chỉ dùng để hiệu chuẩn (luật 5), nên không chấm độ phủ trường.

### Đọc scorecard

- **S06 thu gần đủ ở bậc thu.** Chỗ hở nằm ở đoạn sau: ảnh, toạ độ và mô tả không lên offer, và không có SĐT.
- **S03 hở ở bậc bóc**: diện tích 44%, phường 1%, phòng ngủ 53%. Phần này đã có hàng PH2/PL17. Riêng ảnh hở ở
  cả bậc tải lẫn bậc gộp. Tên người đăng có sẵn ở stg nhưng transform không ghi vào `seller_name`, dù tên người bán
  đã là tầng C từ 23/10.
- **Yield tin của S03 rất thấp**: 21.630 bài trong 7 ngày cho ra 391 offer còn sống, khoảng 1,8%. Con số này gộp cả
  tin trùng lẫn tin không phải rao. Scorecard cần tách hai phần đó ra (§3).

## 3. Scorecard đang thiếu chỉ số gì

So với thiết kế C2 (`docs/plan/danh-gia-observability-s05-2510.md` §3 với 7 `check_name`, và lộ trình hàng
C2/C3):

1. **Chưa có gì chạy.** `pipeline/dq-scorecard.mjs` chưa có, `dq_check_results` không có dòng `scorecard:*`. Hiện chỉ
   có `truthful-coverage`, `listing-volume` (chỉ S01), `extraction-quality` (mẫu, lần cuối 19/10) và freshness.
2. **Không chỉ số nào đo ảnh.** Đề nghị thêm `scorecard:media-yield` cho từng nguồn, mỗi dòng một bậc:
   *thu* (% tin có URL ảnh) → *tải* (% entry tải được; chỉ S03 vì S06 không tải) → *gắn offer* (% offer có ≥ 1 ảnh)
   → *hiện ở máy thu* → *lên cloud* (sau TV9).
3. **Không chỉ số nào đo độ phủ từng trường ở bậc offer.** Đề nghị thêm `scorecard:field-yield` với
   `entity = S0x/<cột>` cho giá, diện tích, khu vực con, toạ độ, ảnh, mô tả, người bán, SĐT, phòng ngủ, tính trên cửa
   sổ 7 và 30 ngày. Số ACTUAL tính bằng SQL ngay được, không cần chờ G3. Khi tệp FIELD_TARGET (G3) về thì thêm
   CEILING/TARGET để có đèn.
4. **Yield tin S03 chưa tách**: bài → bài có nội dung khác nhau → offer → offer có phường. Nên ghi chung vào
   `scorecard:capture-yield`.
5. **Tỉ lệ tải ảnh lỗi** nên có cảnh báo, ví dụ khi > 5% trong 24 giờ. Nếu đã có, lỗi ngày 27/10 lộ ra ngay trong đêm.

## 4. Đề xuất hoàn chỉnh

Thứ tự theo tác động lên câu hỏi «thấy ảnh tin rao», sau đó tới độ đủ của thu thập.

| # | Việc | Làn | Hàng | Điều kiện xong | Trạng thái |
|---|---|---|---|---|---|
| A1 | Sửa bước tải ảnh S03 (http-500 ở hai họ host của tin chỉ-ảnh, từ 27/10), có thử lại hoặc backfill khi URL còn hạn | ZCode | mới, giao qua liên làn | Một ngày chạy thật, tỉ lệ entry lỗi < 5% | **Đã gửi liên làn 29/10** |
| A2 | Gộp tin chỉ-ảnh vào tin chữ, **nhìn cả hai phía** trong 2 phút, cùng nhóm, cùng người gửi | Claude | **PL28**: sửa câu giao («liền trước» → «hai phía») và điều kiện bật | Trên mẫu 7 ngày, offer S03 có ảnh từ 31% lên ≥ 50%; raw không đổi | Chờ Mạnh duyệt sửa câu giao; vướng `dung_tren` PL17 (Hỏi-2) |
| A3 | Hiện ảnh S06 ở `/ops/review` và `/ops/data-flow` ở máy thu: loader đọc `stg_chotot_ads.images` qua `originating_system_key`, chỉ admin, giữ trần 12 ảnh | Claude | **mới, T2** (`anh-s06-tren-ops-local`) | Offer S06 có ảnh trong stg thì thẻ hiện ≥ 1 ảnh; vai ops không phải admin và cloud thì `{}` | Đề xuất |
| A4 | Transform S03 ghi `seller_name` từ `sender_name` (tầng C). Lên cloud vẫn bị `PII_EXCLUDE` chặn, không đổi | Claude | **mới, T1/T2** (`ten-nguoi-ban-s03`) | `seller_name` S03 ≥ 95% | Đề xuất |
| A5 | TV9 phủ cả **S06**: ảnh thu nhỏ lấy từ URL S06 (tải ở máy thu) chứ không đẩy URL lên; ghi rõ TV9 phụ thuộc A1 cho S03 | Claude | **TV9**: sửa ghi chú | Như TV9, cộng thêm: offer S06 trên cloud có ảnh thu nhỏ | Đề xuất |
| A6 | Scorecard thêm `media-yield` và `field-yield` (§3), không chờ G3 cho phần ACTUAL | Claude | **C2**: thêm vào tiêu chí (đã 12/12, xem Hỏi-3) | Mỗi nguồn active có dòng media-yield theo bậc và field-yield theo cột, cửa sổ 7/30 | Đề xuất |
| A7 | `resolve-properties` chép ảnh vào `properties.photos` và gắn offer S03 vào căn | Claude | gộp vào TV10 hoặc hàng resolve sau | Không gấp | Ghi nhận |

Không làm: mở `listing_url`, `photos` hay URL ảnh lên cloud (tầng A, leak gate không nới tay). Không đổi
DATA-CONTRACT: hợp đồng v2 đã có `mediaFiles`, và S06 đã giao đủ ảnh trong payload.

## 5. Câu hỏi cho Mạnh

- **Hỏi-1**: Duyệt bảng đề xuất §4 (A2–A6) theo khuyến nghị? Nếu duyệt, tôi cắt hàng vào lộ trình và mở vòng cho
  A3 trước (T2, chỉ app, không migration), rồi tới A4 và A2.
- **Hỏi-2**: PL28 đang `dung_tren` PL17 (parser ghi phát biểu). Gộp ảnh không cần phát biểu parser. Bỏ phụ thuộc này
  để PL28 chạy ngay được không? Khuyến nghị: bỏ.
- **Hỏi-3**: C2 đã đủ 12 tiêu chí. Khuyến nghị: tách `media-yield` + `field-yield` thành một hàng riêng (C2b, dựa
  trên C2), không nhồi thêm vào C2.
