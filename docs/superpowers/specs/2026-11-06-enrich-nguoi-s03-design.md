# Enrich danh bạ Người S03: số liên lạc theo tài khoản, tin không số lấy số qua người đăng — thiết kế

Hồ sơ `_acceptance/enrich-nguoi-s03` · T3 (migration 079) · Mở từ lời Mạnh 06/11 qua giám sát đợt: hơn một nửa tin S03
cho thuê không có số nên không liên lạc được người bán; đây là luồng Enrich của danh bạ Người, không vá thẳng vào tin.
Căn cứ: ADR-0016 §3, §8, §11; DB2b `2026-10-30-ho-nguoi-theo-nguon-design.md`; HD13 `2026-10-31-nguoi-noi-theo-sdt-design.md`
(công tắc gộp `danh-ba:gop-sdt` đang TẮT, không dòng `ops_audit` nào); SD5; cơ chế số ghép S06
(`2026-11-03-so-ghep-s06-nhan-danh-ba-design.md`, migration 068, 070); trang tri thức «Người và SĐT».

## 1. Số đo (DB local, chỉ đọc, 06/11)

| Đo | Số |
|---|---|
| Tin S03 sống | 4.359 |
| Không `seller_phone` | 1.806 (41,4%) — thuê 1.337/2.700 (49,5%), bán 469/1.659 (28,3%) |
| …có người gửi (`seller_ref` = `sender_id`) | 1.800, thuộc 315 người; cả 1.800 đều có Người theo tài khoản |
| Bậc 1 — người gửi có tin S03 khác có số | 925 tin; người có đúng một số trên tin 859; số ấy một–một (không người gửi nào khác dùng) 657 tin / 71 người |
| Bậc 2 — số trong bất kỳ bài nào của người gửi (`extractPhones`) | 1.038 tin; bỏ số xuất hiện ở người gửi khác còn 826; người đúng một số riêng 660 tin / 93 người; người có bài ngắn ≤ 40 ký tự mang số 73 tin |
| Bậc 1 so bậc 2 | 70 người khớp số, 3 người lệch |
| Phân bố số riêng mỗi người không số | 0 số: 212 · 1 số: 93 · 2 số: 9 · 6 số: 1 |

Ba luật chọn đo trên cùng dữ liệu (tin không số được gán):

| Luật | Tin | Thuê | Bán | Người |
|---|---|---|---|---|
| **A (khuyên)** ưu tiên số riêng duy nhất trên tin của chính người đó; không có số trên tin thì số riêng duy nhất trong bài | **742** (662 từ tin, 80 từ bài) | 586 | 156 | 94 |
| B chọn số riêng xuất hiện ở nhiều bài nhất, hoà thì không | 824 | 641 | 183 | 102 |
| C như A, thêm số chung (≥ 2 người gửi) khi người chỉ có đúng một số | 935 (193 từ số chung) | 702 | 233 | 119 |

Số giám sát đo lúc 07:30 (bậc 2: 1.356 tin) dùng bộ dò chuỗi dạng SĐT rộng; số trên dùng `extractPhones` của transform, cùng
hàm sinh số trên tin. Phần còn lại (~1.060 tin) cần bí danh `chat_profile` (link hồ sơ) của làn ZCode.

## 2. Mô hình: liên lạc của Người là phát biểu, không phải bí danh định danh

Bí danh `sdt` (055, 060) là **khoá định danh**: duy nhất mỗi nguồn, hai người mang cùng số nghĩa là một người (HD13 gộp).
Số liên lạc khác nghĩa: một số sàn dùng chung liên lạc được nhiều người mà không làm họ thành một người, và một người có
thể có hai số. Trang tri thức «Người và SĐT»: khoá Người là khoá mờ «vì số có thể dùng chung và đổi chủ»; RESO đặt số làm
thuộc tính `MemberMobilePhone`/`OtherPhones`. ADR-0016 §3: mọi thuộc tính là phát biểu, không viết tay.

Vì vậy thêm **bảng `party_contacts`** (migration 079) theo khuôn `party_roles` (055): chỉ thêm, rút có lý do.

| Cột | Nghĩa |
|---|---|
| `id` bigserial | |
| `party_key` | Người theo tài khoản (FK `parties`) |
| `kind` | `sdt` · `chat_profile` (CHECK) — `chat_profile` để chỗ cho link hồ sơ theo `sender_id` do làn ZCode lấy; vòng này không ghi |
| `value` | `sdt`: E.164 `^\+84[35789][0-9]{8}$` (CHECK); `chat_profile`: khác rỗng |
| `evidence_tier`, `method` | trục 045: vòng này luôn `observed` + `parser` (số đọc từ chữ bài của chính người gửi) |
| `rule_id` | `so_tren_tin` (số là `seller_phone` của một tin của chính người đó) · `so_trong_bai` (chỉ có trong bài khác: trả lời, bình luận, bài không thành tin) |
| `evidence` jsonb | `{post_ids: ≤ 5 bài sớm nhất, n_bai, n_bai_ngan, offer_ids?: ≤ 5}` — không chép chữ bài |
| `observed_at`, `run_id`, `created_at`, `retracted_at`, `retract_reason` | như `party_roles` |

Chỉ mục duy nhất sống `(party_key, kind, value, rule_id)`. Trigger chỉ-thêm như `party_roles`. Không lên cloud (giống bốn
bảng 055). Lối khác (bí danh + bật công tắc gộp HD13) ở Hỏi-1.

**RESO-first (ADR-0011)**: tra DD 2.1 — số liên lạc là field của resource người (`Contacts.MobilePhone`/`OtherPhone`,
`Member.MemberMobilePhone`), link mạng xã hội là resource `SocialMedia` (`SocialMediaType`, `SocialMediaUrlOrId`). Không
resource nào giữ «nhiều số kèm lớp bằng chứng», nên `party_contacts` là extension local; `contact_kind` (`sdt` ↔
`MobilePhone`, `chat_profile` ↔ `SocialMediaUrlOrId`) và `contact_rule` khai ở `pipeline/mappings.yaml` đủ sáu điều kiện.
**SPL (luật 6)**: số, mã tài khoản người đăng là tầng C (ADR-0007 sửa đổi 23/10, 02/11); bảng chỉ mang mã `S03` qua
Người, không tên nguồn thật, không đọc bảng tầng A; chỉ ở máy local, số chỉ rời máy qua `sale_offers.seller_phone` như
hôm nay.

## 3. Bộ dựng liên lạc — `pipeline/lib/lien-lac-nguoi.mjs`

`dungLienLac(c, { runId })`, trong giao dịch của người gọi, sau `dungNguoi` (cùng khoá 55055):

1. Đọc bài `stg_zalo_posts` kênh `openclaw-hook` có `sender_id` (bản mới nhất mỗi `post_id`), `extractPhones` từng bài —
   cùng hàm transform dùng, nên số liên lạc và số trên tin cùng một bộ đọc.
2. Đọc tin S03 có `seller_phone` **trực tiếp** (dấu xuất xứ khác `s03-qua-nguoi-dang`): số của tin thuộc người gửi
   `seller_ref`.
3. **Luật loại trừ (X1, số của người khác)**: số xuất hiện ở bài hoặc tin của ≥ 2 người gửi khác nhau trong S03 là **số
   chung** — không sinh liên lạc cho ai, đếm `so_chung`. Số đã suy (`s03-qua-nguoi-dang`) không bao giờ là bằng chứng (AC-6).
4. Người gửi → Người qua bí danh `tai_khoan_nguon` (S03); không có Người (người chỉ trả lời, chưa có tin) → bỏ, đếm.
5. Mỗi (Người, số riêng): phát biểu `so_tren_tin` khi số là số trên tin của chính người ấy, ngược lại
   `so_trong_bai`. Hai rule có thể cùng sống cho một số (đổi rule khi số mới lên tin không rút cái cũ).
6. **Rút**: liên lạc sống mà số nay là số chung → rút `so-chung` (bằng chứng thay). Bài bằng chứng vắng khỏi stg → giữ
   (stg nạp lại có thể thiếu bài — cùng luật `giuVaiBaiMat` của DB2b). Chạy lại trên cùng dữ liệu: 0 mới, 0 rút.

Trả `{lien_lac_moi, lien_lac_rut, so_chung, khong_nguoi, theo_rule}`; in một dòng không mang số (chặn `inKhongSo`).

## 4. Luật chọn số cho tin — `chonSoNguoi` (thuần)

Trên liên lạc `sdt` sống của Người cuối chuỗi `merged_into` (Hỏi-3, luật A):

1. đúng một số `so_tren_tin` → số ấy;
2. không số nào `so_tren_tin` và đúng một số `so_trong_bai` → số ấy;
3. còn lại (≥ 2 số trên tin; 0 số trên tin mà ≥ 2 số trong bài; 0 số) → không chọn, đếm `nhieu_so`.

## 5. Gán vào tin — `pipeline/gan-sdt-qua-nguoi.mjs` (dùng lại cơ chế S06)

`ganSdtQuaNguoi(c, { rieng })` cho mọi tin S03 (kể cả nghỉ, như `ganSdtS06`):

- **Rào bảng chưa có**: `dungLienLac` và `ganSdtQuaNguoi` dò `to_regclass('party_contacts')` trước khi đọc (không bắt lỗi —
  lỗi SELECT làm hỏng giao dịch của `buocDem`, cùng nếp `coBangAudit`). Chưa có → in `CHUA-AP-079`, trả số 0, không ném:
  sau khi gộp mà Mạnh chưa áp 079, transform S03 và `dungNguoi` đêm vẫn chạy như hôm nay.
- **Rào thứ tự áp**: hàm phân xử chưa giữ khoá `seller_phone` (068) → không ghi gì, in `CHUA-AP-068`. View `sale_offers`
  chưa nhận luật S03 (079) → không ghi số suy mới, in `CHUA-AP-079` (số sẽ lên Invest không nhãn); tin đang mang số suy
  thì vẫn rút được.
- **Số riêng của tin**: `rieng` (Map `offer_id → số|null`) do transform truyền, vì ngay sau `writeOffers` cột đã bị upsert
  về số riêng; gọi từ chỗ khác thì số riêng = `seller_phone` khi dấu khác `s03-qua-nguoi-dang`.
- Việc mỗi tin: có số riêng → giữ số, bỏ dấu `s03-qua-nguoi-dang` nếu còn · không số riêng mà người đăng chọn được số →
  `seller_phone` = số, `seller_phone_hash` như transform, `field_provenance.seller_phone =
  {tier: inferred, method: e1_rule, rule_id: s03-qua-nguoi-dang, party_key, contact_id, measured: false}` · không chọn được
  mà đang mang số suy → rút về NULL, bỏ dấu. Câu UPDATE chỉ chạm dòng đổi (chạy lại = 0 dòng).
- Trả `{doi, gan, rut, bo_dau, khong_chon, bo_qua}`, không trả số.

**Điểm gọi**: (a) cuối `runTransformZalo`, ngay sau `writeOffers`, cùng giao dịch — tin không bao giờ rơi về «Chưa có số»
giữa hai bước nên lượt đồng bộ cloud 15′ không thấy nhấp nháy; dùng liên lạc của lượt danh bạ trước. (b) `buocDem`
(`refresh-bait-gap.mjs`) sau `dungNguoi` + `dungLienLac` — nhận liên lạc mới ngay lượt đêm, log một dòng số tin gán theo
từng bậc (`so_tren_tin`, `so_trong_bai`). Lời gọi (a) chỉ giữ số của đêm trước; số mới do lời gọi (b). Hai điểm
cùng hàm, chạy lại không đổi gì; AC-4 thử không có khoảng hở bằng client thứ hai đọc sau COMMIT của transform. Giám sát
đồng ý giữ cả hai lời gọi (06/11).

## 6. View và cổng — migration 079

- `party_contacts` (§2) + gieo `ref_lookup` cho `contact_kind`, `contact_rule`.
- `CREATE OR REPLACE VIEW sale_offers` giữ nguyên mọi cột và thứ tự của 070; chỉ đổi biểu thức cột cuối:
  `seller_phone IS NOT NULL AND ((source = 'S06' AND rule IS DISTINCT FROM 's06-so-tren-tin') OR rule = 's03-qua-nguoi-dang')`.
  S06 giữ «hỏng theo hướng đóng»; S03 không dấu vẫn false như hôm nay (số trực tiếp của tin, nhãn cấp tin đã có).
- Kiểm DQ `so-chua-xac-minh` (`pipeline/sql/450_dq_checks.sql`) hôm nay đỏ khi tin nguồn khác S06 mang nhãn («view sai»).
  Sửa: nguồn khác có nhãn mà không mang dấu `s03-qua-nguoi-dang` mới là `fail`; chi tiết thêm số tin S03 qua người đăng.
- App, API, `sync-cloud` **không đổi**: `PHONE_INFERRED` đọc cột qua `to_jsonb`, `CLOUD_ALLOW.sale_offers` đã có cột,
  `OfferContact` đã hiện Badge «Chưa xác minh» khi `inferred`. Cloud không cần migration.
- Chữ giải thích nhãn số (`offer-label-help.tsx`, `methodology-definitions.tsx`, `CONTEXT.md`) đổi «suy từ tin khác cùng
  tài khoản» thành «suy từ tin hoặc bài khác của cùng tài khoản» — đúng với số từ bài trả lời.

## 7. Chặn tự nuôi (ADR-0016 §7.3 áp cho Người)

Số suy về tin không quay lại làm bằng chứng: `rutDinhDanh` (danh bạ, HD13 `capMotMot`, thẻ nhiều–nhiều, `sellersThieu`)
coi `seller_phone` S03 mang dấu `s03-qua-nguoi-dang` là không số — như số ghép S06. `dungLienLac` bỏ tin mang dấu ấy.
Phép đo đêm SD5 (`do-danh-ba-sdt.mjs`, N1–N4) đọc thẳng `seller_phone` của tin S03: lọc cùng điều kiện `TIN_VAO_DANH_BA`,
nếu không số suy sẽ thành cặp một–một giả. Bảng Ops (`review-context`, `deals`) hiện số như số ghép S06 hôm nay, không đổi.
Sửa ở `danh-ba-nguoi.mjs` là hai hằng (`coBangChungSdt`, `TIN_VAO_DANH_BA`) — báo giám sát trước S4 vì phiên GC sửa
cùng vùng.

## 8. Đo độ đúng trước khi lên cổng

`pipeline/do-lien-lac-nguoi.mjs` trên DB thử chép máy thu (`db/db-thu.sh`), trong giao dịch ROLLBACK: tự áp 079 (+ 068,
070 nếu thiếu), chạy `dungNguoi`, `dungLienLac`, `ganSdtQuaNguoi`; in số trước/sau theo bán, thuê, theo rule, số chung,
nhiều số; md5 cột SĐT S03 của DB gốc trước = sau; đầu ra không mang số. `--mau 30 --ra <tệp>` ghi phiếu đọc mù 30 Người
ngẫu nhiên có hạt cố định (mỗi Người: số được chọn, ≤ 5 bài của chính người gửi có số ấy, ≤ 3 bài khác của họ) vào
`research-local/` (gitignored — chữ bài, tên, SĐT tầng C không lên kho công khai). Tác tử tươi đọc phiếu, gắn `dung` ·
`sai` · `khong_ro` cho câu «số này là số liên lạc của chính người đăng?»; chỉ số đếm vào bằng chứng.

## 9. Không làm

- Gọi API của kênh chat, lấy link hồ sơ (`chat_profile`): làn ZCode qua phiên liên làn, có rào an toàn kênh chat và lời Mạnh trước khi gọi thật.
- Gộp người (bật công tắc HD13), gộp liên nguồn, liên lạc cho S05/S06.
- Áp 079 lên DB máy thu, chạy gán thật, đẩy lên cloud: lời riêng của Mạnh, có `pg_dump` trước.
- Trang `/ops/people` hiện liên lạc; thẻ duyệt cho người nhiều số; xác minh bằng cách gọi.

## Đặc tả UX

Không màn mới, không trạng thái mới: ô liên hệ dùng nguyên năm trạng thái của `so-ghep-s06-nhan-danh-ba` (ST-lien-he-*).
Tin S03 nhận số qua người đăng đi vào ST-lien-he-ghep / ghep-da-lay / ghep-loi; thẻ S03 vốn có thêm nhãn cấp tin «Chưa
xác minh» (hai nhãn cùng chữ đã có tên riêng và lời giải thích riêng). Thay đổi giao diện duy nhất là một câu trong lời
giải thích «Số chưa xác minh».
