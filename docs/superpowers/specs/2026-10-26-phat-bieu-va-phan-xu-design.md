# PL15 · Bảng phát biểu append-only và bộ phân xử ba lớp — thiết kế

Ngày 2026-10-26 · Hồ sơ `_acceptance/phat-bieu-va-phan-xu/` · Hạng T3 · Dãy P2 (làn A của lát OCP1: PL6 → PL14 → PL15).
Căn cứ: RV-§0.2 D-1 (ba lớp), RV-§3.1–§3.4 (năm nguyên lý, thứ bậc tạm, sơ đồ phát biểu), RV-L02, RV-L12;
ADR-0013 §6 (`FieldAssertion` dáng `HistoryTransactional`); `reso-khung-phan-loai.md` §6; FR-§3.4. Cổng Đáng `build`:
giám sát đợt `dot0-cam-mau` (P2-64) theo Mạnh 26/10 «Hỏi-1..7: theo khuyến nghị».

## 1. Bài toán

Năm cột phân loại của tin (`property_type`, `bedrooms`, `bathrooms`, `street_raw`, `block_raw` — trục `enrich_field` của
sổ từ vựng) hôm nay do nhiều tầng ghi thẳng: transform ghi lúc nạp, `apply_enrichment` ghi «fill-gap» (ô trống mới
được ghi, ai ghi trước thắng — L12), lượt enrich cũ trước 22/10 ghi thẳng không để lại đề xuất. Nên:

- không ô nào trả lời được «ai nói, dựa vào đâu»;
- thứ tự chạy quyết định giá trị, không phải căn cứ (L02, L12);
- `write-offers.mjs` phải «đóng băng» cột enrich (`ENRICH_COLS`) để lượt nạp không đè — và vì thế parser sửa được
  cũng không cập nhật được tin cũ.

Số đo DB local 26/10 (18.769 bản ghi tin): S06 có 18.472 ô loại hình (từ category), 13.739 phòng ngủ, **8.219 đường,
4.712 WC, 547 toà** — ba cột sau không có đường ghi nào trong mã hiện tại (lượt enrich ghi thẳng cũ để lại;
`enrichment_proposals` đang 0 dòng). S03: 144 phòng ngủ (parser), loại hình 269/269 `unknown`. S05: 10 phòng ngủ, 1 WC,
1 toà, 1 loại hình; **9 ô loại hình NULL** (trái quy tắc «không NULL vì chưa chạy»).

## 2. Kết quả của vòng

1. Bảng `field_assertions` (resource local `FieldAssertion`), chỉ thêm: mỗi dòng là một phát biểu «chủ thể · trường ·
   giá trị · lớp căn cứ · phương pháp@phiên bản · bằng chứng · lúc quan sát · ai». Rút một phát biểu = đặt
   `retracted_at` + lý do; không sửa, không xoá.
2. Bộ phân xử — một hàm SQL thuần, xác định — đọc phát biểu sống của mọi chủ thể của một tin, dựng năm cột và ghi
   `field_provenance` (nguồn gốc từng ô). Xoá năm cột rồi dựng lại ra trùng từng ô.
3. Mọi đường ghi năm cột đi qua phát biểu + phân xử: transform S03/S05/S06, `apply_enrichment`, `revert_enrichment`.
   Gỡ `ENRICH_COLS`.
4. Giá trị có sẵn không có phát biểu đỡ được ghi thành phát biểu «cũ» (Hỏi-2) để cột không đổi lúc chuyển.

## 3. Lựa chọn

### 3.1 Chủ thể và khoá

Chủ thể = khoá gốc nguồn `<S0x>:<id gốc>` (RV-§3.4): post `S03:<post_id>`, `S05:<post_id>`, tin `S06:<list_id>`. Tin
P1 gộp nhiều post nhận **hợp** phát biểu của mọi post trong `post_ids`. Phát biểu của đề xuất enrich và của người treo
vào post neo (`originating_system_key`, khoá dính PL14) — đổi giá, gộp lại repost không đổi chủ.

### 3.2 Ba lớp và thứ tự tạm trong lớp (Hỏi-1)

| Lớp (`evidence_tier`) | Phương pháp (`method`) | Thứ tự tạm trong lớp |
|---|---|---|
| `fact` — sự thật | `hitl` (người quyết, actor `hitl:`) · `source_field` (trường có cấu trúc của nguồn: S06 category, rooms) | hitl 0 · source_field 1 |
| `observed` — quan sát có trích dẫn | `parser` · `e1_rule` · `e2_llm` · `legacy` (giá trị có trước 045) | parser 2 · e1_rule 3 · e2_llm 4 · legacy 9 |
| `inferred` — suy luận | (để trống ở vòng này: PL18 hạ E1 ngữ cảnh nhóm / E2 không trích dẫn xuống đây) | — |

Luật phân xử cho một ô (tin × trường):

1. Không phát biểu sống nào → mặc định: `property_type = 'unknown'`, bốn cột kia NULL; không mục provenance.
2. Lớp cao nhất có phát biểu trong {fact, observed} thắng. Lớp `inferred` **không bao giờ** vào cột (Hỏi-3 lát OCP1:
   «ngữ cảnh nhóm chỉ là suy luận, không tự quyết») — chỉ có thì ô về mặc định, provenance ghi `goi_y`.
3. Trong lớp thắng: một giá trị → nhận. Nhiều giá trị → xếp (thứ tự tạm của phương pháp, số chủ thể ủng hộ giảm dần,
   `value_key` tăng dần), ghi `conflict: true`. Không sinh thẻ duyệt (thẻ v2 là PL23).
4. Lớp thấp hơn có giá trị khác giá trị thắng → `lower_disagree: true`.
5. Thứ tự tạm chỉ đứng tới khi ô được đo (RV-§0.2 D-1: «trong lớp, thứ tự do T6 quyết»). Cổng «chỉ tự áp ô đã đo» là
   PL21; vòng này giữ hành vi áp hiện nay và ghi `measured: false` vào provenance để PL21 có chỗ gác.

Hệ quả nên biết: «fill-gap» hết. E1 mới trái một giá trị `legacy` thì E1 thắng (cùng lớp, thứ tự tạm cao hơn) và ô
mang `conflict: true`; người (`hitl`) thắng mọi phương pháp, kể cả category S06.

### 3.3 Giá trị có sẵn (Hỏi-2, khó đảo)

Khoảng 13,9 nghìn ô hôm nay không có phát biểu nào đỡ (đường/WC/toà S06, phần enrich cũ, có thể gồm ~34 giá trị
LLM ghi thẳng ngày 22/10 — `enrich-qua-de-xuat` d-8). Hai lối:

- **(a) khuyến nghị** — ghi mỗi ô thành phát biểu `legacy` lớp `observed`, thứ tự thấp nhất trong lớp. Cột y nguyên lúc
  chuyển; provenance gọi đúng tên «giá trị có trước 045, không căn cứ». PL16 (đề xuất cũ), PL17 (Chợ Tốt duy trì
  đường/WC/tầng) thay dần bằng phát biểu đúng — phát biểu đúng thắng `legacy` không cần ai rút.
- **(b)** — ghi chúng ở lớp `inferred`: cột về trống, giá trị chỉ còn trong bảng phát biểu. Đúng chữ BOI-CANH §4
  («gỡ giá trị không có phát biểu đỡ»), nhưng trang tin và căn mất ~8,2 nghìn tên đường, ~4,7 nghìn số WC ngay khi
  lượt sync kế chạy.

**Mạnh chọn (a)** (P2-66, 26/10): giữ legacy, chạy cắt chuyển trên DB local sau merge.

Cắt chuyển chạy bằng lệnh riêng `pipeline/phat-bieu-cat-chuyen.mjs` (không nằm trong migration): chụp mốc từng ô
(offer_id, trường, giá trị), ghi phát biểu `legacy` cho ô chưa có đỡ, dựng lại, so từng ô với mốc, ghi `ops_audit`
(`phat-bieu:cat-chuyen`) kèm bảng đếm trước/sau. `--thu` chạy trong giao dịch rồi ROLLBACK. Sai khác duy nhất được
khai trước: 9 ô loại hình S05 NULL → `unknown`.

**Cổng «chưa cắt chuyển»** (gap-probe P0): `resolve_offer_fields` từ chối với thông điệp ghim «phân xử: chưa cắt
chuyển» khi `ops_audit` chưa có dòng `phat-bieu:cat-chuyen`. Mọi đường gọi nó (transform, `apply_enrichment`,
`revert_enrichment`) vì thế báo lỗi thay vì đặt ô không có đỡ về trống. Hệ quả:

- Áp 045 thật ở lượt chấm (`check-idempotent.sh`, lời giám sát) an toàn: tới khi cắt chuyển, lượt enrich tay và nút duyệt
  thẻ enrich trên DB local báo lỗi; job đêm chạy mã `main` không gọi phân xử nên không đổi.
- Sau merge, thứ tự triển khai: pull → `node pipeline/phat-bieu-cat-chuyen.mjs` (thật) → lượt transform đêm. Quên bước giữa
  thì job đêm đỏ có tên, không mất ô.
- Các thước đo cắt chuyển trong chính giao dịch của chúng nên cổng mở trong giao dịch đó rồi đóng lại khi ROLLBACK.

### 3.4 Đường ghi

- `pipeline/lib/assert.mjs` — hàm JS dùng chung ghi lô phát biểu (`unnest`), có cờ «thay của chính phương pháp»: một
  lượt parser hay source_field ra giá trị khác cho cùng chủ thể × trường thì rút phát biểu cũ cùng phương pháp
  (`retract_reason = 'thay-boi-luot'`) trước khi ghi mới. E1/E2/hitl không dùng cờ này.
- `write-offers.mjs` (S03, S05): bỏ năm cột khỏi câu upsert, gỡ `ENRICH_COLS`; nhận phát biểu parser theo từng post
  (phòng ngủ) rồi gọi `resolve_offer_fields(<offer của lượt>)` sau đối soát.
- `transform-chotot.mjs` (S06): loại hình (`rule_id 'category:<n>'`) và phòng ngủ (`rule_id 'rooms'`) thành phát biểu
  `fact`/`source_field`, `observed_at = list_time`; bỏ `property_type` khỏi upsert; phân xử cả nguồn một lần cuối lượt.
- `apply_enrichment` (CREATE OR REPLACE, giữ chữ ký): mỗi đề xuất → một phát biểu trên post neo — actor `hitl:%` →
  `fact`/`hitl` (rút hitl cũ khác giá trị cùng ô); còn lại theo `source` (`e1_rule`, `e2_llm`) lớp `observed`. Rồi
  phân xử; đề xuất `applied` khi cột nhận đúng giá trị đó, `skipped` khi không. Cascade sang `properties` giữ như 033.
- `revert_enrichment` (giữ chữ ký, giữ luật «chỉ người, có lý do»): rút phát biểu của đề xuất (`retract_reason =
  'hoan-tac:<lý do>'`) rồi phân xử — ô về giá trị kế tiếp có căn cứ, không còn «về trống».
- App, data-api, agent không đổi mã gọi: route decide vẫn gọi `apply_enrichment(..., 'hitl:<id>')`. Ma trận chỗ gọi
  (`pipeline/lib/enrich-call-sites.mjs`) khai ba chỗ hôm nay — route decide (người), `agent/src/enrich/run.ts` (máy,
  `enrich-run:`), `agent/scripts/enrich-revert.ts` (người) — và test đọc tiền tố actor ngay ở tệp gọi.
- Bộ quét ghi năm cột (`pipeline/lib/scan-canonical-write.mjs`) quét `.mjs/.ts/.sql/.sh` và cả hàm sống trong DB
  (`pg_proc`): ngoài `resolve_offer_fields` không hàm nào ghi năm cột.

### 3.5 Bảo vệ «chỉ thêm»

Trigger `BEFORE UPDATE OR DELETE` và `BEFORE TRUNCATE` trên `field_assertions`: DELETE/TRUNCATE luôn lỗi; UPDATE chỉ
được đặt `retracted_at` + `retract_reason` một lần trên dòng còn sống. Không dùng REVOKE: DB local chạy bằng một vai
chủ bảng nên quyền không chặn được ai (lối một).

### 3.6 Không lên cloud

`field_provenance` không có trong `CLOUD_ALLOW.sale_offers` (`sync-cloud.mjs`: «cột local mới mặc định KHÔNG lên
cloud»); `field_assertions` không nằm trong tập chép. Cột năm trường lên cloud như hôm nay (giá trị dựng lại trùng).
Không đổi lược đồ cloud ở vòng này; mở provenance lên Invest là việc của C3.5.

### 3.7 Từ vựng

Sổ `pipeline/mappings.yaml` thêm hai trục local: `evidence_tier` (sự thật · quan sát có trích dẫn · suy luận) và
`assertion_method` (sáu phương pháp); trục `enrich_field` thêm cột `field_assertions.field`. Migration 045 nạp
`ref_lookup` + CHECK theo `vocab.mjs --emit-seed`; `--check-db` xanh. `CONTEXT.md` thêm thuật ngữ «Phát biểu»,
«Lớp căn cứ», «Phân xử», «Nguồn gốc». RESO: `FieldAssertion` là extension đã khai (reso-khung §8); năm trường này
không có `*Source` chuẩn trong DD — provenance là local.

## 4. Lược đồ (migration 045, số theo SO-MIGRATION)

```
field_assertions
  id bigserial PK · resource_name text 'Property' · subject_key text (^S0\d:.+)
  field text (enrich_field) · value text · value_key text (lower(btrim(value)))
  evidence_tier text (evidence_tier) · method text (assertion_method) · CHECK lớp ↔ phương pháp
  method_version text · rule_id text · evidence jsonb · observed_at timestamptz · changed_by text · run_id text
  created_at timestamptz · retracted_at timestamptz · retract_reason text
  UNIQUE (subject_key, field, value_key, method, coalesce(rule_id,'')) WHERE retracted_at IS NULL
sale_offer_records.field_provenance jsonb NOT NULL DEFAULT '{}'   -- view sale_offers tạo lại (SELECT * chốt cột)
offer_subject_keys(sale_offer_records) → text[]
resolve_offer_fields(text[]) → jsonb {offers, cells_changed}       -- NULL = mọi bản ghi
apply_enrichment / revert_enrichment (thay tại chỗ)
```

Idempotent, không giả định chạy trước 047/048; kiểm bằng `db/check-idempotent.sh`. Migration không ghi dữ liệu tin.

## 5. Không gian AC (quét hình thái, preset entity-feature)

Chân sản phẩm `[SUY-TỪ-REPO: docs/architecture/classification-enrich-review.md]`; chân ngành
`[NGÀNH: RESO HistoryTransactional]` (khuôn bảng), `[NGÀNH: Wikidata statement rank + reference]` (nhiều lời khai một
thuộc tính, xếp hạng, nguồn kèm từng lời khai), `[NGÀNH: event sourcing — dựng lại projection từ log chỉ thêm]`.

- Trục người viết: source_field S06 · parser S03/S05 · e1_rule · e2_llm · hitl · legacy [CE: bảng ghi năm cột 26/10 —
  `write-offers.mjs`, `transform-chotot.mjs`, 033, 036].
- Trục quan hệ trong ô: không phát biểu · một lớp · lớp trên trái lớp dưới · cùng lớp đồng thuận · cùng lớp bất đồng ·
  chỉ suy luận · đã rút [CE: luật phân xử RV-§3.3 + D-1].
- Trục vòng đời: ghi đầu · nạp lại · rút/hoàn tác · sửa-xoá trái phép · dựng lại từ trống · tin gộp nhiều post · cắt
  chuyển [CE: thước PL14 + bat_khi PL15].
- Trục mặt đọc: view `sale_offers` (app, data-api) · provenance · sync-cloud · cascade `properties` [CE: 50 tệp đọc,
  đếm 26/10 ở PL14].

Core → AC-1…AC-10. Later: thẻ bất đồng (PL23), cổng tự áp theo số đo (PL21), đề xuất cũ + bậc B0–B5 (PL16), rule_id
và đoạn khớp của parser + đường/WC/tầng S06 (PL17), E2 mù + trích dẫn có thật (PL18), `observed_at` bắt buộc +
`offer_status` (PL19), phát biểu trường `căn` (PL20), `kind`/giá/diện tích/tầng qua phát biểu (PL17), provenance trên
Invest (C3.5). Never: REVOKE làm rào chỉ-thêm (vai chủ bảng vượt quyền); bộ phân xử bản JS thứ hai (app Vercel không
gọi được, hai định nghĩa lệch).

## 6. Rủi ro

- Thời gian transform S06 tăng (18,5 nghìn tin × 2 phát biểu): ghi lô `unnest`, phân xử set-based một lần cuối lượt;
  AC-10 đo trần.
- Test agent đang ghim «fill-gap → skipped»: những ca ấy đổi nghĩa có chủ đích (AC-6), sửa cùng vòng.
- Hai vòng khác đang mở cũng chạm `write-offers.mjs`/`transform-*`? Kiểm khi gộp main trước S4.
