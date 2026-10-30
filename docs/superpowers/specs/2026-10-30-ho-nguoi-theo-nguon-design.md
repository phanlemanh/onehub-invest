# Họ Người theo từng nguồn (DB2b) — design

Ngày: 2026-10-30 · Hàng lộ trình: DB2b `ho-nguoi-theo-nguon` (T3, đợt `danh-ba-2910`) · Căn cứ: ADR-0016 §3, §8, §9, §10
(Đợt 2b), §11 · Cổng Đáng: build (Mạnh, «Xếp theo bốn làn», 30/10).

## 1. Vấn đề

Bảng `sellers` (migration 022) là cụm người bán theo SĐT băm, gộp liên nguồn, một vai, không bí danh, và chỉ có
19 dòng. Không có chỗ nào nói «tin này do người nào đăng». ADR-0016 §8 đặt: người là một danh bạ có khoá bền, bí danh tại
từng nguồn, và vai «người đăng» là **quan hệ có phát biểu**, không phải cột.

Số đo DB local (chỉ đọc, 30/10, `sale_offer_records`):

| Nguồn | Tin | Định danh người đăng có ở đâu | Đo |
|---|---|---|---|
| S06 | 27.733 | `seller_ref` dạng `ct:<số>` (trường có cấu trúc của nguồn) | 27.733/27.733 khớp `^ct:[0-9]+$`; 9.411 tài khoản khác nhau trên tin sống; 0 SĐT |
| S03 | 1.191 (885 sống) | `stg_zalo_posts.sender_id` của từng bài trong `post_ids`; SĐT băm đọc từ chữ | 858/885 tin sống có bài mang `sender_id`; 2 tin mang hai người gửi; 21 tin chỉ có SĐT; 6 tin không có cả hai |
| S05 | 56 (28 sống) | `sender_id` (kênh `apify-facebook` trong `stg_zalo_posts`); SĐT băm | 20/28 tin sống có `sender_id`; 8 tin chỉ có SĐT |
| Airbnb | listing thuê ngắn hạn | không có cột người đăng ở `stg_abnb_listings` / `listing_records` | 0 — ngoài phạm vi |

`seller_ref` của S03 và S05 là **một hằng cho mọi tin** (1 giá trị khác nhau mỗi nguồn) — không định danh được người,
không dùng.

## 2. Thiết kế

### 2.1 Khung chung (ADR-0016 §3) — dựng ở hàng này (theo khuyến nghị Hỏi-1)

Migration `db/migrations/055_danh_ba_nguoi.sql` (số đã cấp 30/10) tạo bốn bảng:

- `parties` — `party_key text PK` dạng `pty_<ULID 26 ký tự Crockford>` (CHECK regex), `status` ∈ `registry_status`
  (`active` · `merged` · `split` · `retired`), `merged_into` (bắt buộc khi `merged`, cấm khi khác), `source` mã S0x
  (CHECK `^S0[1-9]$`) — người theo **từng** nguồn, `created_at`. Không cột thuộc tính (tên, SĐT): thuộc tính là bí danh.
  Không DELETE, không TRUNCATE (trigger, như PL14).
- `registry_aliases` — bí danh dùng chung cho mọi danh bạ (DB1 dùng lại cho toà/trục/căn): `object_key` (tiền tố
  `pty_|prc_|bld_|stk_|unt_`), `kind` ∈ `alias_kind` (`tai_khoan_nguon` · `sdt_bam` · `ten`), `value`, `source` S0x,
  `first_seen`, `retired_at`. Chỉ mục duy nhất sống trên `(source, kind, value)` cho hai loại định danh
  (`tai_khoan_nguon`, `sdt_bam`): một định danh thuộc đúng một người — đây là cái chặn «nạp lại nhân người». `ten` không
  duy nhất (nhiều người trùng tên); duy nhất theo `(object_key, kind, value)`.
- `registry_events` — sự kiện gộp · tách · nghỉ (`registry_event_kind`: `gop` · `tach` · `nghi`), khuôn
  `HistoryTransactional` (`object_key`, `kind`, `related_keys text[]`, `reason`, `changed_by`, `at`). Hàng này chỉ dựng
  bảng + ràng buộc, chưa ghi sự kiện nào (không gộp người).
- `party_roles` — vai là phát biểu, chỉ thêm: `party_key`, `role` ∈ `party_role` (`nguoi_dang`), `subject_key` = khoá
  listing `<S0x>:<OriginatingSystemKey>` (ADR-0016 §5 — không khoá ngoại tới bảng tin), `evidence_tier` + `method` dùng
  lại trục của 045 (cặp lớp/phương pháp như `field_assertions`), `evidence jsonb`, `observed_at`, `run_id`,
  `retracted_at` + `retract_reason`. Chỉ mục duy nhất sống `(subject_key, role, party_key)`. Trigger chỉ-thêm như
  `field_assertions`: UPDATE chỉ để rút (có lý do), không DELETE/TRUNCATE.

Enum mới khai ở `pipeline/mappings.yaml` `enums:` đủ sáu điều kiện ADR-0011 Qđ 3 (`dd_field: null` + rationale + ngày
tra DD 2.1): `registry_status` (extension `ObjectStatus`), `alias_kind`, `registry_event_kind`, `party_role` (extension
«người đăng» — DD chỉ có `ListAgentKey`/`CoListAgentKey`/`ListOfficeKey`). Hằng sinh bằng `node vocab.mjs --write`;
`ref_lookup` + `ref_field_lookup` gieo trong migration (`--emit-seed`). Điều kiện 6: `dq-enum-vocab.mjs` thêm kiểm
enum trên ba bảng mới, nhãn diễn giải ở `app/src/lib/dq-labels.ts` (phép đo ON12-AC-5 đòi mọi dòng kiểm có nhãn).

### 2.2 Bộ dựng (`pipeline/lib/danh-ba-nguoi.mjs`)

`dungNguoi(client, { runId })` — chạy trong giao dịch của người gọi, xác định:

1. **Rút định danh người đăng của từng tin** (mọi `sale_offer_records`, kể cả tin đã nghỉ — người đăng của tin không đổi
   khi tin nghỉ):
   - S06: tài khoản = phần số của `seller_ref` `ct:<số>` → `(S06, tai_khoan_nguon, <số>)`, phương pháp `source_field`,
     lớp `fact`; tên hiển thị `seller_name` → bí danh `ten`.
   - S03/S05: mỗi `post_id` trong `post_ids` nối `stg_zalo_posts` (kênh theo nguồn: `openclaw-hook` → S03,
     `apify-facebook` → S05) → `sender_id` khác rỗng → `(S0x, tai_khoan_nguon, sender_id)`, `source_field`/`fact`;
     `sender_name` → bí danh `ten`. `seller_phone_hash` của tin → `(S0x, sdt_bam, h)`.
2. **Giải người** theo thứ tự tất định (`first_seen`, `offer_id`) — luật nối SĐT theo khuyến nghị Hỏi-4:
   - có tài khoản → người của bí danh tài khoản; chưa có thì tạo người mới + bí danh;
   - SĐT băm → luôn là bí danh của **người theo SĐT** riêng của nguồn ấy (chưa có thì tạo); KHÔNG gắn vào người tài
     khoản, kể cả khi tin có đúng một người gửi — nối SĐT với tài khoản là một lần gộp (`registry_events`), việc của
     Đợt 3. Lối khác (gắn SĐT chưa ai giữ vào người tài khoản duy nhất của tin) nhận ít người hơn nhưng một SĐT môi giới
     dùng chung sẽ quy mọi tin chỉ-SĐT về tài khoản đăng trước;
   - tin có tài khoản → vai tới người tài khoản (`source_field`/`fact`); tin không tài khoản mà có SĐT → vai tới người
     theo SĐT, phương pháp `parser`, lớp `observed` (SĐT đọc từ chữ);
   - tin không có cả hai → không vai; đếm vào `khong_dinh_danh`.
3. **Vai** `nguoi_dang`: mỗi (tin, người) một phát biểu sống; bằng chứng `{offer_id, post_ids?, field}`. Vai chỉ rút
   (lý do `thay-boi-luot`) khi lượt này có **bằng chứng thay**: cùng bài nối được mà người gửi khác, `seller_ref` S06
   đổi, hay tin chỉ-SĐT nay có tài khoản. Bài trong `post_ids` không còn nối được ở `stg_zalo_posts` (bảng làn ZCode, có
   thể nạp lại thiếu) → giữ vai, không rút, không ghi vai `parser` thay — để `party_roles` chỉ-thêm không phình mỗi đêm.
   Lượt chạy lại trên cùng dữ liệu: 0 người mới, 0 bí danh mới, 0 vai mới, 0 rút.
4. Trả `{nguoi_moi, bi_danh_moi, vai_moi, vai_rut, khong_dinh_danh, theo_nguon}` và in một dòng.

ULID sinh trong Node (`crypto.randomBytes` + thời gian, mã Crockford) — khoá mờ, không suy từ nội dung; bền nhờ tra bí
danh, không nhờ tái sinh khoá.

Không gộp người liên nguồn (Đợt 3): một SĐT xuất hiện ở S03 và S05 sinh hai người, mỗi người một bí danh `sdt_bam` của
nguồn mình. Không vai suy luận (môi giới…): hàng chỉ ghi `nguoi_dang` từ `source_field`/`parser`.

### 2.3 Chạy đêm

`main()` của `refresh-bait-gap.mjs` chạy tự-commit từng câu (không mở giao dịch): bait gap và `sellers` ghi xong trước.
Thêm bước cuối: `dungNguoi` trong **giao dịch riêng** (BEGIN…COMMIT; gọi trong giao dịch của người gọi thì dùng
SAVEPOINT — cờ tường minh, không đoán). Bộ dựng lỗi → giao dịch danh bạ rollback, bait gap và `sellers` của lượt giữ
nguyên, bước thoát khác 0 (job ghi đỏ) — danh bạ hỏng không kéo số trên `/ops` cloud về cũ. Bước này nằm trong cả ba job
đêm (`zalo-import-daily.sh`, `apify-facebook-daily.sh`, `chotot-daily.sh`) nên không chạm tệp làn ZCode; đặt sau
`sellers` vì phép đo AC-8 đối chiếu `sellers` vừa dựng (gọi từ bước transform thì `sellers` còn của lượt trước). Thêm
lệnh chạy riêng `pipeline/dung-nguoi.mjs` (vận hành, `--thu` ROLLBACK).

### 2.4 `sellers` cũ (theo khuyến nghị Hỏi-2)

Giữ nguyên bảng và người đọc nó (bait gap, `sync-cloud`) ở hàng này. Bằng chứng tương ứng: mọi dòng `sellers` có, với
mỗi nguồn trong `sources`, một người sống của nguồn ấy mang bí danh `sdt_bam = phone_hash`. Thay hẳn `sellers` (view
trên `parties`) là hàng sau.

### 2.5 Cloud và SPL (theo khuyến nghị Hỏi-3)

Bốn bảng mới chỉ ở máy local: không thêm vào danh sách bảng của `sync-cloud.mjs`, không migration Supabase. Tên, SĐT băm,
ID tài khoản người đăng là tầng C (ADR-0007 sửa đổi 23/10) — được phép lên, nhưng chưa có người đọc trên cloud. Nguồn chỉ
là mã S0x (CHECK). Người dùng app và tài khoản thu của mình (tầng A) không vào danh bạ: bộ dựng chỉ đọc người gửi bài của
tin rao.

## 3. Phép đo

- Đơn vị (không DB): bộ giải người trên ma trận viết trước — 9 ca định danh × hai lượt.
- DB thử `oneinvest_p3_nguoi` (`db/db-thu.sh`, luật 27/10 không thử migration chưa merge trên `oneinvest`): 055 nạp hai
  lần (idempotent), trigger chỉ-thêm, bộ dựng trên fixture trong giao dịch ROLLBACK.
- `pipeline/scripts/nap-lai-nguoi.mjs` (ngưỡng `bat_khi`): trên DB thử, trong MỘT giao dịch ROLLBACK, chạy hai lượt nạp
  lại mọi nguồn (transform S03 → S05 → S06 → `refreshBaitGap`), so số người, bí danh, vai sống và tổng dòng `party_roles`
  (kể cả đã rút) sau lượt 1 và lượt 2, và đòi kết quả lượt 2 = 0 người/bí danh/vai mới, 0 rút; đối chiếu mọi dòng
  `sellers`. Đối chứng cùng dữ liệu: bộ dựng bỏ tra bí danh → lượt 2 va chỉ mục duy nhất sống của `registry_aliases`
  → lỗi trùng khoá có thông điệp ghim → lệnh đỏ.

## 4. Ngoài phạm vi (Later / Never)

- Gộp người liên nguồn, hồ sơ người đã gộp trên `/ops` (Đợt 3).
- Nối người theo SĐT với người tài khoản cùng nguồn (Hỏi-4 — Đợt 3).
- Vai suy luận (môi giới, sàn), `company_ad` của S06 thành vai — hàng sau, chỉ ở `/ops`.
- Thay `sellers` bằng view, đổi bait gap đọc `parties` (Hỏi-2).
- Đẩy danh bạ Người lên cloud (Hỏi-3).
- Toà · trục · căn, `field_assertions` mở `resource_name` (DB1).
- Người đăng listing thuê ngắn hạn (không có dữ liệu người đăng).
- Trang `/ops` cho danh bạ Người.
