# Lưu số gốc SĐT một dạng +84… và `sellers` thành view trên danh bạ (SD3)

Hồ sơ: `_acceptance/sdt-luu-goc-e164/` · hàng SD3 của `docs/plan/lo-trinh.json` (T3, dãy P4) · Cổng Đáng `build` (Mạnh 30/10,
«Cổng Đáng build 6 hàng audit Người theo thứ tự đề xuất»). Căn cứ: `docs/research/audit-bang-nguoi-sdt-3010.md` §3.2, §5b,
§6.1 dòng `sdt-luu-goc-e164`, §6.4 Hỏi-A và Hỏi-C bước 2. SD1 (`sellers-them-dong-lai`) và SD2 (`boc-sdt-du-va-chon-ro`) đã
gộp; SD2 cố ý giữ dạng `0xxxxxxxxx` và để việc đổi dạng, băm, bí danh, `sellers`, `properties`, cloud cho hàng này.

## Vấn đề

Danh bạ Người chỉ giữ SĐT dạng băm `sdt_bam` = `sha256(0xxxxxxxxx)` cắt 32 ký tự, không muối — đảo ngược được, nên không bảo
vệ gì (N7). Bảng `sellers` là sổ người theo SĐT thứ hai, ghi riêng ở `refresh-bait-gap`, lệch danh bạ (N3). Mạnh chốt: lưu số
gốc, mọi chỗ một dạng E.164 `+84…`; `sellers` thành view trên danh bạ, đổi khoá một lần cùng migration này.

## Thiết kế

### 1. Một dạng `+84…` từ bộ bóc tới bảng

- `extractPhones`/`chonSdtTin` (`pipeline/transform-zalo.mjs`, `transform-fb.mjs` dùng lại) trả `+84[35789]\d{8}`. Luật nhận số
  của SD2 giữ nguyên, chỉ đổi dạng ra.
- `seller_phone` ghi E.164; `seller_phone_hash = sha256(E.164)[0:32]` — khoá băm còn giữ vì cloud chỉ nhận khoá (Hỏi-A:
  «đưa số gốc lên cloud là quyết định riêng, chưa mở»).

### 2. Migration `060_sdt_e164.sql` (số do giám sát cấp)

- Từ vựng: `registry_aliases.kind` thêm `sdt` (CHECK, chỉ mục duy nhất định danh mở cho `sdt`, dòng `ref_lookup`);
  `pipeline/mappings.yaml` thêm giá trị, sinh lại ba tệp `vocab.generated`.
- Dữ liệu tin: `sale_offer_records.seller_phone` đổi `0x…` → `+84x…`, `seller_phone_hash` tính lại từ E.164;
  `properties.seller_phone_hash` tính lại theo cùng luật từ tin của căn. Idempotent: chỉ đụng dòng còn dạng cũ.
- `sellers`: bỏ bảng, tạo `VIEW sellers` giữ nguyên cột (`phone_hash`, `name`, `sources`, `n_ads`, `first_seen`, `last_seen`,
  `flags`). Mỗi dòng là một giá trị bí danh `sdt` còn hiệu lực có tin sống mang số ấy; `flags` tính như `refresh-bait-gap`
  từng tính (`n_sale`, `n_rent`, `median_gap_pct`, `n_good_deals`, `multi_channel`, `sources`).
- Không áp lên DB máy thu :5433 trong vòng này: áp sau khi Mạnh duyệt và gộp, có `pg_dump` trước. Không đẩy Supabase.

### 3. Danh bạ: bí danh `sdt`, nghỉ `sdt_bam`

`dungNguoi` (`pipeline/lib/danh-ba-nguoi.mjs`) đọc `seller_phone` E.164 và ghi bí danh `sdt`. Người đã có `sdt_bam` khớp
`sha256(0x…)` của cùng số được GIỮ `party_key`: thêm bí danh `sdt` cho đúng người ấy rồi nghỉ `sdt_bam` (`retired_at`, đúng
luật chỉ-thêm của 055). Lượt hai thêm 0 bí danh.

### 4. Người đọc

- `refresh-bait-gap.mjs` thôi ghi/xoá `sellers` (view tự đúng); audit `bait-gap:sellers-orphan` và `SHRINK_AUDIT` của sellers
  bỏ theo.
- `sync-cloud.mjs`: `sellers` là view vẫn đẩy được (đọc cột qua `information_schema`, như `sale_offers`); `PII_EXCLUDE` và
  `CLOUD_ALLOW` giữ nguyên — `seller_phone`, `seller_name`, `sellers.name` không lên cloud.
- `deals.ts` nối `sellers.phone_hash` không đổi. `/ops/people`: bí danh `sdt` che như `sdt_bam` cho mọi vai tới khi U1
  `people-hien-so-goc` mở số gốc (Hỏi-2).
- Bộ đo và script đếm còn so dạng `0…` (`do-danh-ba-sdt.mjs`, `scripts/do-boc-sdt.mjs`, `scripts/test-data-residue.mjs`) đổi sang
  E.164; test khoá dạng và test ghi thẳng vào bảng `sellers` sửa theo.

## Ngoài phạm vi

Gộp người SĐT với người tài khoản (`gop-nguoi-sdt-tai-khoan`) · hiện số gốc trên `/ops/people` (U1) · đưa số gốc lên cloud ·
áp 060 lên DB máy thu và Supabase.
