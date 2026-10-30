# Audit bảng Người theo trục SĐT — từ nguồn thu tới `/ops/people` (30/10/2026)

- **Chốt của Mạnh**: số điện thoại là lõi để nhận diện một Người. Bản này đo trọn chuỗi quanh danh bạ Người (DB2b, migration
  055) theo trục SĐT: nguồn thu → `stg_*` → bộ bóc → `sale_offers` → danh bạ (người · bí danh · vai) → enrich →
  `/ops/people`. Chỉ đo và đề xuất, không sửa mã.
- **Cách đo**: DB máy thu :5433, mọi truy vấn chạy với `default_transaction_read_only=on`, đo lúc 16:15–16:45Z 30/10. Đọc mã
  tại `main` `8cb2692e` (sau #211, #212, #214). Không ghi DB, không áp migration. Bộ bóc SĐT được đo bằng **chính hàm**
  `extractPhones` của `pipeline/transform-zalo.mjs`, so với một bộ dò rộng hơn (§6). SQL và script ở §6; bản chạy được để ở
  `research-local/audit-bang-nguoi-sdt-3010/` (gitignored).
- SĐT, tên và ID người bán trên tin rao là tầng C (ADR-0007 sửa đổi 23/10). Dù vậy tài liệu này **không chép số, tên hay ID
  nào**, chỉ ghi số đếm và hình dạng (chữ số thay bằng `d`). Nguồn chỉ gọi bằng mã `S0x`.
- Đọc kèm: `audit-hang-duyet-3010.md` §3b (H14–H17 đã đo người đăng trên thẻ duyệt, `seller_ref` hằng số, không nối liên
  nguồn). Bản này không đo lại các phần đó, chỉ trỏ tới khi cần.

Mức nặng: **Cao** = danh bạ nhận sai Người (tách đôi hoặc gộp nhầm), hoặc mất SĐT mà nguồn có · **Trung** = thiếu căn cứ
hoặc thiếu đường dùng SĐT mà dữ liệu có sẵn · **Thấp** = sót lẻ, không đổi kết luận.

---

## 0. Kết luận một trang

Bộ bóc SĐT từ chữ bài **tốt**: bắt 99,6% số có trong chữ. Lỗ lớn nằm ở **bước từ tin sang Người**. Danh bạ DB2b cố ý tách
SĐT khỏi tài khoản (Hỏi-4, hoãn sang Đợt 3), nên **không người nào mang cả tài khoản lẫn SĐT**. Trong khi đó 129/141 SĐT
của S03 và 13/20 của S05 nối **1–1 tất định** với đúng một người gửi. Hệ quả: SĐT, thứ Mạnh coi là lõi, lại là phần yếu
nhất của danh bạ. Phần lớn người theo SĐT (150/165) không có tin nào, và số người S03 bị đếm lố khoảng 129.

Bên cạnh đó: bảng `sellers` cũ đứng yên ở 19 dòng từ 21/10 (bị bỏ lệnh thêm dòng), S06 không thu SĐT dù 86% tin không bật
cờ giấu, và danh bạ chỉ giữ dạng băm nên `/ops/people` không hiện được số cho người vận hành.

| # | Phát hiện | Số đo | Nặng | Đúng hay lỗi | Làn · dãy |
|---|---|---|---|---|---|
| N1 | Danh bạ tách một người thành hai: người theo tài khoản và người theo SĐT | **0** người mang cả hai loại bí danh. SĐT nối 1–1 tất định với một người gửi: S03 **129/141**, S05 **13/20**. Người S03: 357 trong danh bạ, ước ~228 sau khi gộp các cặp 1–1 | **Cao** | Đúng thiết kế DB2b (Hỏi-4), nhưng trái chốt «SĐT là lõi» | Claude · P3 |
| N2 | Người theo SĐT gần như không có tin | 165 người theo SĐT, chỉ **15** có vai sống (S03 7/145, S05 8/20). 150 người chỉ tồn tại nhờ bí danh, `/ops/people` hiện «0 tin» | **Cao** | Hệ quả của N1 | Claude · P3 |
| N3 | Bảng `sellers` đứng yên từ 21/10 | **19** dòng, so với **161** SĐT khác nhau trên `sale_offers`. `907f4bd4` bỏ `INSERT INTO sellers` ở transform, `refresh-bait-gap` chỉ `UPDATE`/`DELETE`. Chip môi giới `/ops/deals` thiếu 142/161 SĐT; phép đối chiếu AC-8 của DB2b (`sellersThieuNguoi`) chạy trên 19 dòng nên luôn xanh | **Cao** | Lỗi (hồi quy 21/10) | Claude · P3 |
| N4 | Tin chỉ giữ SĐT đầu của bài đầu | 11/885 tin S03 sống có ≥ 2 SĐT qua các bài, chỉ giữ 1; 3 tin `seller_phone` rỗng dù bài khác trong tin có số. 105 bài S03 có ≥ 2 SĐT | Trung | Bộ bóc thiếu luật chọn | Claude · P1 |
| N5 | Số viết tách lạ bị sót | 46 bài trên 12.110 bài có số (**0,38%**; 20 văn bản khác nhau): `ddd dd•dd ddd` 32, `(+dd) dddd ddddd` 7, `ddd. dd.ddddd` 4, `(ddd) dddd ddd` 3. Số viết tách thường («09x.xxx.xxx», «0 9 x x…») bắt đủ; 0 bài viết «o» thay «0» | Thấp | Bộ bóc thiếu dấu tách | Claude · P1 |
| N6 | Nhận số 11 chữ số | Di động VN chỉ còn 10 số từ 2018. 27 bài khớp số 11 chữ số; 1 tin sống mang số đó làm `seller_phone` | Thấp | Lỗi nhỏ | Claude · P1 |
| N7 | Khoá SĐT không chuẩn và «băm» không bảo vệ gì | Dạng lưu `0xxxxxxxxx`, không E.164. Khoá = `sha256(số)` cắt 32 ký tự hex, không muối: vét ~5×10⁸ số di động là ra lại số gốc. Khoá này lên cloud qua `sale_offers.seller_phone_hash`, `sellers.phone_hash`, `properties.seller_phone_hash` | Trung | Đúng luật tầng C, nhưng tên gọi gây hiểu nhầm | **Đã quyết** (Hỏi-A: lưu số gốc, một dạng `+84…`) · P3 |
| N8 | `/ops/people` không hiện, không tìm được SĐT | Chỉ hiện 8 ký tự băm (`people.ts:77`); ô tìm chỉ khớp tên và tài khoản (`people.ts:81–86`). Số gốc có sẵn ở `sale_offer_records.seller_phone` (máy thu). `/ops/deals` **đã** hiện số gốc cho `admin` (`deal-card.tsx:97–103`) | Trung | Thiếu tính năng | Claude · U1 |
| N9 | S06 không thu SĐT | 0/29.604 payload có số. Cờ `phone_hidden = true` chỉ ở **4.096** (13,8%); **25.508** tin không giấu, nhưng API danh sách không trả số. Bản audit trước ghi «nguồn giấu» (H16), cần sửa thành «API danh sách không trả, cần gọi riêng từng tin» | Trung | Đúng hiện trạng (SH3 chờ SH1) | ZCode · liên làn (chờ quyết) |
| N10 | Chú thích «SĐT là tầng A» còn sót | `app/src/lib/deals.ts:10`, `app/src/app/ops/deals/page.tsx:15`, `mappings.yaml` (`seller_phone`: «LOCAL-ONLY (PII)»), comment migration 022. Trái chốt 23/10. `/ops/deals` khoá số cho `admin`, `/ops/people` mở bí danh cho vai Vận hành: hai cổng, hai mức | Thấp | Lỗi chữ + lệch quyền | Claude · U1 |
| N11 | S06 không đọc SĐT trong chữ tin | `transform-chotot.mjs` không gọi bộ bóc. 51 tin có số theo bộ bóc hiện có, 70 theo bộ dò rộng. SĐT S06 (trong chữ) trùng S03: **1** | Thấp | Thiếu, giá trị thấp | Claude · P1 |
| N12 | S05: thiếu người gửi ở stg | `sender_id` có ở 44/100 bài, nên 8/28 tin chỉ còn SĐT để nhận người. Bộ thu S05 ngừng từ 21/10 (TV15) | Thấp | Cần kiểm khi S05 thu lại | ZCode · liên làn |
| N13 | Enrich không chạm Người/SĐT | Enrich chỉ có 5 trường (`property_type`, `bedrooms`, `street_raw`, `bathrooms`, `block_raw`); `enrichment_proposals` = 0 dòng; không bộ nào đề xuất ghép người | — | Đúng luật 7 | — |
| N14 | Không nối người liên nguồn | SĐT chung S03 ∩ S05 = **0** (446 · 33 số trong chữ bài) | — | Đúng (Đợt 3) | — |

Câu hỏi trong lời giao «S03 145 người SĐT băm, `seller_phone` S03 141»: lệch 4 vì danh bạ đọc **mọi** bản ghi
`sale_offer_records`, kể cả tin đã nghỉ (`SQL.tin`, không lọc `retired_at`). 4 SĐT chỉ còn ở tin nghỉ. S05 20 = 20. S06 0 = 0.
Đây là đúng thiết kế, không phải lỗi.

---

## 1. Nguồn thu (S01–S08): ai có SĐT, nằm ở đâu

### 1.1 Phễu theo tầng × nguồn

| Tầng | S03 Cộng đồng | S05 Mạng xã hội | S06 Rao vặt công khai | S01 · S02 · S04 · S08 | Căn cứ |
|---|---|---|---|---|---|
| SĐT nằm ở đâu ở nguồn | Trong chữ bài (người đăng tự ghi); có thể trong ảnh | Trong chữ bài | Hồ sơ người đăng có số, nhưng chỉ lộ qua lệnh gọi riêng từng tin; đôi khi trong chữ tin | Không có SĐT người bán (S01 nền tảng giấu; S02 số liệu thị trường; S04 địa giới; S08 thu **không** `contact_data`, DATA-CONTRACT v4) | DATA-CONTRACT, payload |
| Định danh tài khoản ở stg | `sender_id` 32.998/33.090 bài, 790 giá trị | `sender_id` **44/100** bài, 29 giá trị (N12) | `account_id` 29.604/29.604 | — | `stg_zalo_posts`, `stg_chotot_ads` |
| Cột SĐT có cấu trúc ở stg | Không có | Không có | **Không có**: 0/29.604 (N9) | — | Q1 |
| Bài/tin có SĐT trong chữ | **12.064**/33.090 bài (36%) | 96/100 | 51/29.604 (70 theo bộ dò rộng) | — | `sdt.mjs` |
| Số khác nhau trong chữ | 446 | 33 | 55 | — | `sdt.mjs` |
| Snapshot/stg giữ số gốc | **Đủ**: chữ bài nguyên văn, không che, không cắt | Đủ | Chữ tin nguyên văn; số hồ sơ không thu | — | — |
| Tin sống có `seller_phone` | **615**/885 (69%) | 28/28 | 0/27.733 | — | Q2 |
| SĐT khác nhau trên tin sống | 141 | 20 | 0 | — | Q2 |
| Danh bạ: người theo SĐT | 145 (gồm 4 SĐT chỉ ở tin nghỉ) | 20 | 0 | — | Q3 |
| Danh bạ: người theo SĐT có tin | **7** | 8 | — | — | Q3 (N2) |
| Danh bạ: người mang cả tài khoản + SĐT | **0** | **0** | 0 | — | Q3 (N1) |

### 1.2 Lỗi thu hay lỗi transform

- **S03, S05: không có lỗi thu ở trục SĐT.** Snapshot và `stg_zalo_posts.text` giữ chữ bài nguyên văn. Bộ thu không che,
  không cắt số. Mọi mất mát phía sau là của transform và danh bạ (làn Claude).
- **S06: không thu số** (N9). Không phải lỗi theo DATA-CONTRACT, vì hợp đồng chưa có trường SĐT và việc lộ số từng tin là
  **SH3**, đang chờ SH1 («liên hệ người bán lên cổng», Mạnh chưa quyết vì Nghị định 13/2023). Số đo mới so với bản audit
  trước: chỉ 13,8% tin bật cờ giấu số; 86% còn lại là số **có thể lấy** nếu được phép gọi từng tin. Khi mở SH3 thì đó là
  việc làn ZCode, thêm trường vào DATA-CONTRACT và tăng `schemaVersion`.
- **S05: `sender_id` thiếu ở 56/100 bài** (N12). Có thể do payload Apify không trả tác giả với một số bài. Chỉ đáng kiểm khi
  S05 thu lại (TV15).
- **Ảnh**: 63% bài S03 không có số trong chữ. Trong 270 tin S03 sống không có SĐT, 264 vẫn có người gửi (nhận được người qua
  tài khoản), và 78 có ảnh (cận trên của «SĐT có thể nằm trong ảnh»). Đọc số trong ảnh chưa đáng làm cho bài toán nhận
  người (luật 11).

---

## 2. Trích xuất: bộ đọc SĐT

### 2.1 Bộ đọc hiện có

| Bộ đọc | Nguồn | Hành vi |
|---|---|---|
| `extractPhones` (`pipeline/transform-zalo.mjs:118`) | S03; S05 dùng lại (`transform-fb.mjs`) | Regex `(?<!\d)(?:\+84\|0)(?:[.\-\s]?\d){8,10}(?!\d)`: mỗi chữ số cách nhau **tối đa một** dấu `.`, `-` hoặc khoảng trắng. Chuẩn hoá về `0xxxxxxxxx`; nhận 10 **hoặc 11** số; đầu số di động 3/5/7/8/9; tối đa 3 số mỗi bài |
| `gatSo` (`transform-zalo.mjs:89`) | S03, S05 | Gạt số dạng SĐT khỏi chữ trước khi đọc giá/DT (không ảnh hưởng SĐT) |
| `parsePost` → `out.phone = phones[0]` (`transform-zalo.mjs:189–190`) | S03, S05 | Bài chỉ giữ số **đầu tiên** |
| Gom tin (`transform-zalo.mjs:376–386`) | S03, S05 | Tin lấy `phone` của bài **đầu tiên** trong nhóm, các bài sau không bổ sung |
| `transform-chotot.mjs` | S06 | Không đọc SĐT (N11) |

Không có chuẩn E.164. Không đọc số trong ảnh.

### 2.2 Đo bỏ sót (trên toàn bộ 33.090 bài S03, 100 bài S05)

So `extractPhones` với một bộ dò rộng: chữ số xen tối đa 3 ký tự tách bất kỳ (`.`, `-`, khoảng trắng, `•`, `·`, `*`, `/`,
ngoặc), nhận «o» thay «0», gom về 10 số đầu di động.

| Đo | S03 | S05 |
|---|---|---|
| Bài có SĐT theo bộ đọc hiện có | 12.064 | 96 |
| Bài bộ dò rộng thấy thêm số | 75 | 0 |
| — trong đó do trần 3 số/bài | 29 (một bài danh sách 33 số, lặp 29 lần) | 0 |
| — **thật sự sót** | **46 bài · 20 văn bản** (N5) | 0 |
| Tỷ lệ sót | **0,38%** | 0% |
| Bài viết «o» thay «0» | 0 | 0 |
| Bài khớp số 11 chữ số | 27 (N6) | 0 |
| Bài có ≥ 2 SĐT | 105 (76 bài 2 số; 29 bài 33 số) | 2 |

Số viết tách kiểu «09x.xxx.xxx», «09x xxx xxx», «0 9 x x x…» đều bắt được. Các dạng bị sót: dấu chấm tròn giữa nhóm
(`ddd dd•dd ddd`), mã quốc gia trong ngoặc (`(+84) dddd ddddd`), đầu số trong ngoặc (`(0dd) dddd ddd`), và hai ký tự tách
liền nhau (`ddd. dd.ddddd`).

### 2.3 Mức tin (`sale_offers` sống)

| Đo | S03 (885 tin) | S05 (28) |
|---|---|---|
| Tin có `seller_phone` | 615 | 28 |
| Tin mà các bài mang ≥ 2 SĐT khác nhau (chỉ giữ 1) | **11** | 1 |
| Tin `seller_phone` rỗng dù có bài mang số | **3** | 0 |
| `seller_phone` không có trong bài nào của tin | 0 | 0 |
| `seller_phone_hash` ≠ băm của `seller_phone` | 0 | 0 |
| Tin mang số 11 chữ số | 1 | 0 |

---

## 3. Từ tin tới Người (DB2b, migration 055)

### 3.1 Đường đi hôm nay

1. Transform: `seller_phone = phones[0]` của bài đầu; `seller_phone_hash = sha256(seller_phone)[0:32]`
   (`transform-zalo.mjs:416–424`, `transform-fb.mjs:125–133`).
2. `dungNguoi` (`pipeline/lib/danh-ba-nguoi.mjs`), chạy cuối `refresh-bait-gap` trong ba job đêm, đọc **mọi**
   `sale_offer_records` S03/S05/S06:
   - Tài khoản: S06 lấy phần số của `seller_ref`; S03/S05 lấy `sender_id` của từng bài trong `post_ids` → bí danh
     `tai_khoan_nguon` → người theo tài khoản. Vai `nguoi_dang` lớp `fact` / phương pháp `source_field`.
   - SĐT: `seller_phone_hash` → bí danh `sdt_bam` → **luôn** là một người theo SĐT riêng (Hỏi-4, design §2.2 bước 2), kể cả
     khi tin có đúng một người gửi. Vai chỉ ghi cho người theo SĐT khi tin **không** có tài khoản (`parser`/`observed`).
3. Không ghi sự kiện gộp nào (`registry_events` = 0 dòng).

### 3.2 Vì sao danh bạ chỉ giữ SĐT dạng băm

Không phải do luật hiện hành. Đây là dư âm của thời SĐT còn tầng A:
- Bảng `sellers` (migration 022, 21/10) khoá theo `phone_hash`, chú thích «PII: seller_phone tầng A».
- DB2b (30/10) chép nguyên cách đó: bí danh chỉ có `sdt_bam`, và bằng chứng AC-8 đối chiếu từng dòng `sellers` với một
  người mang `sdt_bam = phone_hash`. Không ai đặt câu hỏi «có nên giữ số gốc không».
- Chốt 23/10 đã đưa SĐT người bán sang tầng C. `sync-cloud.mjs:76–79` vẫn giữ `seller_phone` ở máy, theo hướng «mở là quyết
  định sản phẩm riêng».
- Băm `sha256` không muối của một không gian ~5×10⁸ số thì đảo ngược được, nên dạng băm không thêm lớp bảo vệ nào. Nó chỉ là
  khoá giả danh để nối bảng (N7).

### 3.3 Một SĐT về đúng một Người không?

Đo trên tin sống, nối `seller_phone` với `sender_id` của các bài trong tin (`offer.mjs`):

| Đo | S03 | S05 |
|---|---|---|
| SĐT khác nhau | 141 | 20 |
| SĐT có **đúng một** người gửi, và người gửi đó có đúng một SĐT (nối 1–1 tất định) | **129** | **13** |
| SĐT dùng chung bởi ≥ 2 người gửi | 6 | 1 |
| Người gửi dùng ≥ 2 SĐT | 3 | 0 |
| SĐT không có người gửi nào (tin chỉ-SĐT) | 1 | 6 |
| Người theo tài khoản có ít nhất một tin mang SĐT | 157/204 | 15/15 |
| **Người mang cả tài khoản và SĐT trong danh bạ** | **0** | **0** |

Trên toàn bộ chữ bài S03 (cả bài không thành tin), 397/446 SĐT gắn với đúng một người gửi, 48 SĐT gắn với 2–4 người gửi. Một
người gửi gắn với nhiều số nhất là 33 số (bài danh sách số nói ở §2.2).

**Kết luận**: theo bí danh thì một SĐT thuộc đúng một người (chỉ mục duy nhất `registry_aliases_dinh_danh_uq` giữ điều đó).
Nhưng **người đó gần như luôn là bản sao** của một người theo tài khoản: 129 + 13 cặp nối được bằng luật tất định mà không cần
LLM. Ngược lại, «một Người có nhiều SĐT» thì hôm nay không thể xảy ra trong danh bạ, vì người theo tài khoản không bao giờ
nhận bí danh SĐT. Ngoài đời có 3 người gửi S03 dùng ≥ 2 số. Có 6 SĐT S03 dùng chung (môi giới đăng hộ, hay số hotline dự án),
không được gộp tự động.

### 3.4 Luật gộp đề xuất (xác định, đúng luật 7)

Gộp người theo SĐT vào người theo tài khoản **cùng nguồn** khi và chỉ khi: SĐT có đúng một người gửi trên mọi tin sống, và
người gửi đó có đúng một SĐT. Ghi `registry_events` loại `gop`, đặt `parties.status = merged` + `merged_into`, chuyển vai
`parser` sang người tài khoản. Các ca còn lại (SĐT dùng chung, người nhiều số) thành **thẻ duyệt** ở `/ops/review`, không tự
gộp. Không cần chờ SĐT S06: điều kiện Đợt 3 của ADR-0016 §10 nói về gộp **liên nguồn**; gộp cùng nguồn là việc khác, đã có
đủ dữ liệu.

---

## 4. Enrich và judge quanh Người

- `agent/src/enrich/**` (E1 luật + E2 LLM) chỉ đề xuất 5 trường căn: `property_type`, `bedrooms`, `street_raw`, `bathrooms`,
  `block_raw` (`field_assertions` theo trường). Không trường người bán, không SĐT.
- `enrichment_proposals` = 0 dòng (enrich chưa chạy lượt nào, xem H6 ở bản audit hàng duyệt). `enrich-chay-sau-nap` đã nối
  vào chuỗi đêm (`scripts/zalo-import-daily.sh:113–117`) nhưng không đổi phạm vi trường.
- `judge-run` / `queryPair` (`agent/src/tools/native.ts:45`) chỉ đọc `seller_name`, rồi bỏ ở `evidenceThe` (H14). Không bộ
  nào đề xuất «cùng người».
- **Kết luận**: không có đường LLM nào ghi hay đề xuất ghép Người. Việc gộp ở §3.4 nên giữ nguyên tính chất đó: luật tất
  định ghi thẳng, ca mơ hồ đi qua người. LLM nếu có thì chỉ đọc «tên liên hệ trong chữ» thành đề xuất (H16).

---

## 5. Hiển thị: `/ops/people`

| Điểm | Hiện trạng | Mã |
|---|---|---|
| Giá trị SĐT | 8 ký tự đầu của băm + «…», chỉ vai Vận hành trở lên | `app/src/lib/ops/people.ts:77` |
| Tìm | Chỉ bí danh `ten`, `tai_khoan_nguon`; không tìm theo SĐT | `people.ts:81–86` |
| Thứ tự | `so_tin DESC` → 150 người theo SĐT 0 tin nằm cuối | `people.ts:108–114` |
| Liên kết người ↔ người | Không có. Người tài khoản không thấy SĐT của mình; người SĐT không thấy tài khoản | — |
| Hàng đang làm | U1 `che-tim-bi-danh-viewer`: viewer gõ `?q=` thì bỏ `q` kèm dòng báo (Hỏi-1, khuyến nghị) | `hang-viec.json` |
| Tiền lệ số gốc | `/ops/deals` hiện số gốc dạng `09xx xxx xxx` + `tel:` cho `admin` ở máy thu | `deal-card.tsx:97–103` |

Cần gì để hiện số gốc cho vai Vận hành ở máy thu (không cần migration):
1. Truy vấn của `/ops/people` và `/ops/people/[partyKey]` nối bí danh `sdt_bam` với `sale_offer_records.seller_phone_hash`
   → `seller_phone` (mọi bản ghi, kể cả nghỉ, giống bộ dựng). Hôm nay 165/165 bí danh `sdt_bam` nối được (Q5).
2. Hiện dạng `0xxx xxx xxx` (dùng chung `fmtPhone` của deal card), kèm `tel:`. Vai dưới Vận hành nhận `null` từ máy chủ, như
   `hienBiDanh` đang làm.
3. Ô tìm nhận SĐT: chuẩn hoá chuỗi gõ về `0xxxxxxxxx` (cùng hàm của bộ bóc), băm, so `sdt_bam`. Viewer không được tìm theo SĐT
   (khớp hướng của `che-tim-bi-danh-viewer`).
4. Bảng chỉ ở máy thu (055 không lên cloud, Hỏi-3) nên không chạm `sync-cloud`.
5. **Đã quyết (Hỏi-B, Mạnh 30/10)**: số gốc mở cho **cả vai Vận hành và `admin`**. `/ops/deals` hạ cổng liên hệ từ
   `isAdmin` xuống cùng mức để hai trang thống nhất.

**Đã quyết (Hỏi-A, Mạnh 30/10)**: lưu số gốc, một dạng duy nhất `+84…` (E.164). Vì vậy cách bền là bí danh mới chứa số gốc
(`alias_kind = sdt`, migration mới, T3), không phải nối lúc hiển thị. Cách nối lúc hiển thị ở trên chỉ còn là đường lùi nếu
hàng migration bị chậm.

---

## 5b. So chuẩn RESO DD 2.1

Tra `dd.reso.org/DD2.1` ngày 30/10 (ADR-0011 RESO-first; ADR-0016 §8 đã đặt Người ≈ `Member` / `Office` / `Contacts`).

| Khái niệm onehub | RESO DD 2.1 | Ghi chú |
|---|---|---|
| Khoá Người `party_key` (`pty_<ULID>`) | `Member.MemberKey` (môi giới) · `Contacts.ContactKey` (người liên hệ không phải hội viên) | Khoá mờ của hệ mình, đúng tinh thần `*Key` |
| Tài khoản tại nguồn (`tai_khoan_nguon`) | `OriginatingSystemMemberKey` + `OriginatingSystemName` (S0x) | `SourceSystemMemberKey` khi qua trung gian |
| Người đăng trên tin | `Property.ListAgentKey` (+ `ListAgentMobilePhone`, `ListAgentPreferredPhone`, `ListAgentFullName`) | Vai `nguoi_dang` ≈ `ListAgent`, ADR-0016 §8 |
| SĐT người đăng | `MemberMobilePhone` (VN gần như chỉ di động) · `MemberPreferredPhone` (số chọn hiện) · `MemberOtherPhones` (danh sách, resource `OtherPhone`) | Người nhiều số: một số «ưa dùng», các số khác vào `OtherPhones` |
| Dạng số | String, dài gợi ý 16. DD ghi: số Bắc Mỹ theo `###-###-####`, quy ước khác theo chuẩn địa phương, **số quốc tế có dấu «+» đứng đầu** | Lưu khoá dạng E.164 `+84…` (một dạng duy nhất để nối), hiện theo chuẩn VN `09xx xxx xxx` |
| Sàn / văn phòng | `Office.OfficeKey`, `OfficePhone`, `Property.ListOfficeKey` | Chưa có dữ liệu (S06 `company_ad` là cờ, chưa thành vai) |
| `MemberStateLicense`, `MemberNationalAssociationId`, ULI | Giấy phép hành nghề, mã hội | VN chưa có nguồn; **không dùng SĐT làm ULI**, vì SĐT đổi chủ và dùng chung được |

Khuyến nghị: **khoá Người vẫn là `party_key`**, không phải SĐT. SĐT là bí danh mạnh nhất để **tìm và gộp** người
(`MemberMobilePhone` / `OtherPhones`), nhưng không làm khoá chính, vì 6 SĐT S03 dùng chung và 3 người gửi dùng nhiều số
(§3.3). Dạng chuẩn của bí danh là E.164 (**Mạnh chốt 30/10**, Hỏi-A). Đổi dạng sẽ đổi mọi giá trị băm, nên phải đi qua
nghỉ bí danh cũ, thêm bí danh mới (055 cho phép), không sửa tại chỗ.

---

## 6. Hàng sửa đề xuất

Mọi hàng dưới đây **chưa cắt**. Cắt thật đi qua `/acceptance-gate:cat-luot` sau khi Mạnh duyệt Cổng Đáng. Tầng theo
`_acceptance/config.yaml` (`db/migrations/**`, `pipeline/sync-cloud.mjs` là T3).

### 6.1 Hàng mới

| Slug | Câu giao (nháp) | Ranh giới tệp | Tầng | Dãy | Gánh |
|---|---|---|---|---|---|
| `sdt-luu-goc-e164` | **Theo Hỏi-A.** Mọi chỗ lưu SĐT dùng một dạng `+84xxxxxxxxx`: bộ bóc trả E.164, `sale_offers.seller_phone` ghi E.164, danh bạ có bí danh mới `alias_kind = sdt` giữ số gốc (thêm giá trị vào CHECK + `ref_lookup`, chỉ mục duy nhất định danh mở cho `sdt`). Dữ liệu cũ đi qua nghỉ bí danh `sdt_bam` + thêm bí danh `sdt`, không sửa tại chỗ. Khoá băm, nếu còn cần cho cloud, tính từ E.164. `sellers` thành view trên danh bạ (Hỏi-C bước 2). `seller_phone` vẫn ở lại máy (`PII_EXCLUDE`): đưa số gốc lên cloud là quyết định riêng. **Bật khi**: 0 giá trị SĐT nào trong DB không khớp `^\+84[35789]\d{8}$`; 165/165 người theo SĐT có bí danh `sdt`; nạp lại lượt 2 = 0 bí danh mới; leak gate cloud xanh | migration mới (số do điều phối liên làn cấp), `pipeline/transform-zalo.mjs`, `pipeline/transform-fb.mjs`, `pipeline/lib/danh-ba-nguoi.mjs`, `pipeline/refresh-bait-gap.mjs`, `pipeline/sync-cloud.mjs`, `pipeline/vocab.mjs` (sinh lại từ vựng), test | **T3** | **P3** | N7, N3 (bước 2) |
| `gop-nguoi-sdt-tai-khoan` | Bộ dựng danh bạ gộp người theo SĐT vào người theo tài khoản **cùng nguồn** khi SĐT có đúng một người gửi trên mọi tin sống và người gửi đó có đúng một SĐT. Ghi `registry_events` `gop`, `parties.status = merged`, vai `parser` chuyển sang người tài khoản. Ca nhiều–nhiều sinh thẻ duyệt `entity_match` loại người, không tự gộp. Nạp lại không gộp lại, không nhân sự kiện. **Bật khi**: trên DB 30/10, người mang cả tài khoản + SĐT S03 = 129, S05 = 13; người SĐT không vai S03 từ 138 xuống ≤ 10; nạp lại lượt 2 = 0 sự kiện mới; 6 + 1 SĐT dùng chung thành thẻ | `pipeline/lib/danh-ba-nguoi.mjs`, `pipeline/dung-nguoi.mjs`, `pipeline/scripts/danh-ba-nguoi*.test.mjs`, `pipeline/scripts/nap-lai-nguoi.mjs` | T2 (không migration: 055 đã có `registry_events`, `merged_into`) | **P3** | N1, N2 |
| `sellers-them-dong-lai` | **Hỏi-C bước 1 (đề xuất).** `refresh-bait-gap` thêm dòng `sellers` cho SĐT mới (khôi phục `INSERT … ON CONFLICT` đã mất ở `907f4bd4`, giữ vai «chủ duy nhất» của cột tổng hợp). AC-8 của DB2b đối chiếu trên tập SĐT của `sale_offers`, không trên `sellers`. **Bật khi**: số dòng `sellers` = số SĐT khác nhau trên `sale_offers` (hôm nay 19 so với 161); chip môi giới `/ops/deals` có ở mọi tin có SĐT; test đỏ khi bỏ lệnh thêm dòng | `pipeline/refresh-bait-gap.mjs`, `pipeline/scripts/bait-gap-sellers.test.mjs`, `pipeline/lib/danh-ba-nguoi.mjs` (`sellersThieu`) | T2 | **P3** | N3 |
| `boc-sdt-du-va-chon-ro` | Bộ bóc SĐT nhận thêm dấu tách `•`, `·`, mã `(+84)`, đầu số trong ngoặc và hai ký tự tách liền; bỏ số 11 chữ số; trả dạng `+84…` (Hỏi-A; hàm chuẩn hoá dùng chung cho ô tìm ở `/ops/people`). Tin chọn `seller_phone` bằng luật rõ trên **mọi** bài của tin (số xuất hiện ở nhiều bài nhất; hoà thì bài neo), không lấy số đầu của bài đầu. Đếm tin nhiều SĐT vào log transform. **Bật khi**: trên 33.090 bài S03, bài sót theo bộ dò rộng từ 46 xuống 0; 0 bài nhận số 11 chữ số; 3 tin S03 rỗng SĐT mà bài có số thành có; test cố định 4 dạng ở §2.2 | `pipeline/transform-zalo.mjs`, `pipeline/transform-fb.mjs`, `pipeline/parse.test.mjs` | T2 | **P1** | N4, N5, N6 |
| `people-hien-so-goc` | `/ops/people` và trang một người hiện số gốc (lưu `+84…`, hiện `0xxx xxx xxx`, `tel:`) cho **vai Vận hành và `admin`** ở máy thu (Hỏi-B), đọc bí danh `sdt` (sau `sdt-luu-goc-e164`; trước đó nối `sdt_bam` → `sale_offer_records.seller_phone` phía máy chủ); ô tìm nhận SĐT (chuẩn hoá về `+84…`); vai Người xem không nhận số và không tìm được theo SĐT. Trang một người hiện «cùng SĐT với người …» khi chưa gộp (N1). `/ops/deals` hạ cổng liên hệ từ `isAdmin` xuống vai Vận hành; sửa chú thích «SĐT tầng A» ở `deals.ts`, `ops/deals/page.tsx`. **Bật khi**: 165/165 người theo SĐT hiện số với vai `ops` và `admin`; vai `ops` thấy liên hệ trên `/ops/deals`; HTML/JSON của vai `viewer` không chứa chuỗi SĐT nào; tìm một SĐT (gõ `09…` hay `+84…`) ra đúng người | `app/src/lib/ops/people.ts`, `app/src/components/ops/people/**`, `app/src/app/ops/people/**`, `app/tests/danh-ba-nguoi*`, `app/src/lib/deals.ts`, `app/src/app/ops/deals/page.tsx`, `app/src/components/ops/deal-card.tsx` | T2 | **U1** | N8, N10 |
| `do-danh-ba-sdt` | Mỗi đêm đo trục SĐT của danh bạ: số SĐT nối 1–1 mà chưa gộp; người theo SĐT không vai; dòng `sellers` so với SĐT trên tin; tin nhiều SĐT; bài sót theo bộ dò rộng. Ghi `dq_check_results`, hiện ở `/ops/quality`. **Bật khi**: chạy trên DB 30/10 ra đúng số ở §0 (129 · 13 · 150 · 19/161 · 11 · 46) | `pipeline/` (bộ đo DQ), `pipeline/sql/450_*` | T2 | **P4** | đo N1–N5 |

### 6.2 Sửa câu giao hàng đã có (không cắt trùng)

| Hàng | Sửa | Gánh |
|---|---|---|
| **U1** `che-tim-bi-danh-viewer` (đang làm) | Không đổi phạm vi. Ghi thêm vào hồ sơ: luật «viewer không tìm theo bí danh» áp luôn cho SĐT khi `people-hien-so-goc` mở ô tìm SĐT. Đặt `people-hien-so-goc` **sau** hàng này (chung ranh giới `app/src/lib/ops/people*`) | N8 |
| **DB2b** `ho-nguoi-theo-nguon` (đã giao) — design §4 «Nối người theo SĐT với người tài khoản cùng nguồn (Hỏi-4 — Đợt 3)» | Kéo phần **cùng nguồn** ra khỏi Đợt 3 thành `gop-nguoi-sdt-tai-khoan`. Đợt 3 chỉ còn gộp **liên nguồn**. Ghi vào ADR-0016 §8/§10 khi cắt | N1 |
| **P3** `judge-evidence-du-truong` (đề xuất ở audit hàng duyệt) | Người đăng trên thẻ dùng `party_key` **sau gộp** (`merged_into`), để cùng SĐT trong cùng nguồn hiện «Khớp». Đặt sau `gop-nguoi-sdt-tai-khoan` | N1, H14 |
| **P3** `seller-ref-theo-nguoi-gui` (H15) | Giữ nguyên; độc lập với các hàng ở đây | — |
| **SH3** «S06 lộ SĐT theo từng tin» (chân trời) | Cập nhật lý do: 86% tin S06 không bật cờ giấu số (25.508/29.604), số chỉ không có trong API danh sách. Điều kiện mở vẫn là SH1 | N9 |

### 6.3 Liên làn — ZCode (giao qua phiên điều phối liên làn)

| Việc | Câu giao (nháp) | Tầng | Gánh |
|---|---|---|---|
| `s06-sdt-theo-tin` (= SH3) | **Chỉ mở khi SH1 quyết.** Bộ thu S06 gọi lệnh lộ số cho tin được chọn (trần/ngày như SH3), ghi số vào payload; DATA-CONTRACT thêm trường, tăng `schemaVersion`; bỏ qua tin `phone_hidden = true` | T2 | N9 |
| `s05-sender-id` | Khi S05 thu lại (TV15): kiểm vì sao 56/100 bài không có `sender_id` trong payload; nếu nguồn có tác giả thì bộ thu ghi đủ | T1/T2 | N12 |

### 6.4 Quyết định của Mạnh (30/10)

- **Hỏi-A (N7) — đã chốt**: **lưu số gốc**, mọi chỗ dùng **một dạng `+84…`** (E.164, khớp RESO). Gánh bằng
  `sdt-luu-goc-e164` (P3, T3). Cloud vẫn chỉ nhận khoá: đưa số gốc lên cloud là quyết định riêng, chưa mở.
- **Hỏi-B (N8, N10) — đã chốt**: số gốc mở cho **cả vai Vận hành và `admin`** ở máy thu. `/ops/deals` hạ cổng theo. Gánh
  bằng `people-hien-so-goc` (U1, T2).
- **Hỏi-C (N3) — so sánh, chờ Mạnh duyệt khuyến nghị**:

| | (a) Khôi phục lệnh thêm dòng | (b) `sellers` thành view trên danh bạ |
|---|---|---|
| Sửa gì | ~10 dòng `INSERT … ON CONFLICT` trong `refresh-bait-gap.mjs` | Migration: bỏ bảng, tạo view gom bí danh SĐT theo giá trị qua các nguồn + đếm từ `sale_offers`; `sync-cloud` đọc view |
| Tầng · thời gian | T2, một lượt nhỏ | T3, cần Cổng Đáng + chữ ký |
| Hết lệch 19 ↔ 161 | Ngay lượt đêm kế | Khi hàng T3 gộp |
| Một nguồn chân lý | Không: vẫn hai sổ người theo SĐT (`sellers` gộp liên nguồn, danh bạ theo nguồn) | Có: `sellers` chỉ là cách nhìn của danh bạ |
| Đụng Hỏi-A | Khoá `phone_hash` sẽ phải đổi lần nữa khi chuyển `+84…` | Đổi khoá **một lần**, cùng migration của Hỏi-A |
| Rủi ro | Thấp; giữ nguyên người đọc (`deals.ts`, bait gap, cloud) | Cột tổng hợp (`flags`, `n_ads`, trung vị bait gap) phải tính lại trong view; cloud đổi khoá |

**Khuyến nghị: làm cả hai, theo thứ tự.** Bước 1 là (a) ngay (`sellers-them-dong-lai`, P3, T2): sửa số sai trên
`/ops/deals` hôm nay, chi phí gần như bằng không. Bước 2 là (b), gộp vào `sdt-luu-goc-e164`: migration T3 đó đằng nào cũng
đổi khoá SĐT ở mọi bảng, nên chuyển `sellers` sang view cùng lúc để chỉ đổi khoá một lần và còn một sổ người. Không làm (b)
riêng trước Hỏi-A, vì sẽ đổi khoá hai lần.

### 6.5 Thứ tự chạy gợi ý

1. P3 `sellers-them-dong-lai` (Hỏi-C bước 1): nhỏ, sửa số sai trên `/ops/deals`.
2. P1 `boc-sdt-du-va-chon-ro` song song (ranh giới `pipeline/transform-*` riêng), trả `+84…`.
3. P3 `sdt-luu-goc-e164` (T3) sau bước 2: lưu số gốc, đổi khoá một lần, `sellers` thành view.
4. P3 `gop-nguoi-sdt-tai-khoan` sau bước 3, gộp trên bí danh `sdt`; rồi `judge-evidence-du-truong`.
5. U1 `people-hien-so-goc` sau `che-tim-bi-danh-viewer`; đọc bí danh `sdt` khi bước 3 xong, trước đó dùng đường nối lùi.
6. P4 `do-danh-ba-sdt` bất cứ lúc nào, nên trước bước 4 để có số đối chứng.

---

## 7. Căn cứ đo (tái lập)

Mọi câu chạy với `PGOPTIONS='-c default_transaction_read_only=on'`. Script Node đặt ở
`research-local/audit-bang-nguoi-sdt-3010/` (`sdt.mjs`, `sot.mjs`, `offer.mjs`): mở kết nối với
`options: '-c default_transaction_read_only=on'`, import `extractPhones` từ `pipeline/transform-zalo.mjs`, chỉ in số đếm và
hình dạng (chữ số → `d`).

```sql
-- Q1 S06: SĐT trong payload và cờ giấu số
SELECT count(*) tong, count(*) FILTER (WHERE payload ? 'phone') co_sdt,
       count(*) FILTER (WHERE payload->>'phone_hidden' = 'true') giau
FROM stg_chotot_ads;
SELECT agent_id, count(*), count(sender_id), count(DISTINCT sender_id) FROM stg_zalo_posts GROUP BY 1;

-- Q2 SĐT trên tin theo nguồn (sống / mọi bản ghi)
SELECT source, count(*) FILTER (WHERE retired_at IS NULL) song,
       count(seller_phone) FILTER (WHERE retired_at IS NULL) co_sdt,
       count(DISTINCT seller_phone_hash) FILTER (WHERE retired_at IS NULL) sdt_song,
       count(DISTINCT seller_phone_hash) sdt_moi_ban_ghi
FROM sale_offer_records GROUP BY 1;

-- Q3 danh bạ: loại bí danh mỗi người; người theo SĐT có vai
WITH k AS (SELECT object_key, source, bool_or(kind = 'tai_khoan_nguon') tk, bool_or(kind = 'sdt_bam') sd
           FROM registry_aliases WHERE retired_at IS NULL AND object_key LIKE 'pty%' GROUP BY 1, 2)
SELECT source, count(*) FILTER (WHERE tk AND NOT sd) chi_tk, count(*) FILTER (WHERE sd AND NOT tk) chi_sdt,
       count(*) FILTER (WHERE tk AND sd) ca_hai FROM k GROUP BY 1;
SELECT a.source, count(*) nguoi_sdt,
       count(*) FILTER (WHERE EXISTS (SELECT 1 FROM party_roles r WHERE r.party_key = a.object_key AND r.retracted_at IS NULL)) co_vai
FROM registry_aliases a WHERE a.kind = 'sdt_bam' AND a.retired_at IS NULL GROUP BY 1;
SELECT count(*) FROM registry_events;

-- Q4 sellers so với SĐT trên tin
SELECT (SELECT count(*) FROM sellers) sellers,
       (SELECT count(DISTINCT seller_phone_hash) FROM sale_offers WHERE seller_phone_hash IS NOT NULL) sdt_tren_tin;

-- Q5 bí danh sdt_bam nối được về số gốc (cho people-hien-so-goc)
SELECT count(*), count(*) FILTER (WHERE EXISTS (SELECT 1 FROM sale_offer_records o
                                                WHERE o.seller_phone_hash = a.value AND o.seller_phone IS NOT NULL))
FROM registry_aliases a WHERE a.kind = 'sdt_bam' AND a.retired_at IS NULL;

-- Q6 tin sống không SĐT: có người gửi, có ảnh
SELECT o.source, o.kind, count(*),
  count(*) FILTER (WHERE EXISTS (SELECT 1 FROM stg_zalo_posts p WHERE p.post_id = ANY (o.post_ids) AND p.sender_id IS NOT NULL)),
  count(*) FILTER (WHERE EXISTS (SELECT 1 FROM stg_zalo_posts p WHERE p.post_id = ANY (o.post_ids)
                   AND CASE WHEN jsonb_typeof(p.media) = 'array' THEN jsonb_array_length(p.media) > 0 ELSE false END))
FROM sale_offers o WHERE o.source IN ('S03','S05') AND o.seller_phone IS NULL GROUP BY 1, 2;

-- Q7 enrich: trường được đề xuất, số đề xuất
SELECT field, count(*) FROM field_assertions GROUP BY 1;
SELECT count(*) FROM enrichment_proposals;
```

Phép đo bằng Node (không in số):
- `sdt.mjs`: trên mọi bài S03/S05 và mọi tin S06, đếm bài có số theo `extractPhones` và theo bộ dò rộng
  `(?<!\d)(?:\(?\+?84\)?|0|[oO])(?:[\s.\-_,/()·•*]{0,3}[\doO]){8,10}(?!\d)` (gom về 10 số đầu `0[35789]`); phân bố
  SĐT → số người gửi và người gửi → số SĐT; SĐT chung giữa nguồn.
- `sot.mjs`: phân loại bài bị sót (trần 3 số hay sót thật), in hình dạng quanh chỗ sót.
- `offer.mjs`: trên tin sống, hợp các SĐT qua mọi bài, so với `seller_phone`; kiểm `seller_phone_hash = sha256(seller_phone)[0:32]`;
  đếm cặp SĐT ↔ người gửi nối 1–1.

Mã đọc: `pipeline/transform-zalo.mjs:78–132, 186–190, 376–438` · `pipeline/transform-fb.mjs:100–145` ·
`pipeline/lib/danh-ba-nguoi.mjs` · `pipeline/refresh-bait-gap.mjs:44–85` · `git show 907f4bd4 -- pipeline/transform-zalo.mjs`
(dòng `-INSERT INTO sellers`) · `app/src/lib/ops/people.ts` · `app/src/components/ops/deal-card.tsx:27–30, 97–103` ·
`pipeline/sync-cloud.mjs:76–101` · `docs/superpowers/specs/2026-10-30-ho-nguoi-theo-nguon-design.md` §2.2, §4 ·
`docs/adr/0016-danh-ba-vat-the-va-nguoi.md` §8, §10. RESO: `dd.reso.org/DD2.1/Member/MemberMobilePhone/`,
`…/DD2.1/Member/`, `…/DD2.1/Contacts/`.
