# PL6 · Sổ từ vựng một nguồn — thiết kế (26/10)

Hàng PL6 `so-tu-vung-mot-nguon` của `docs/plan/lo-trinh.json`, làn A lát dọc OCP1 (mốc L1 «Nền + đo»). Cổng Đáng:
giám sát đợt `dot0-cam-mau` (P2-56) theo Mạnh 26/10 «Hỏi-1..7: theo khuyến nghị». Hạng T3 (chạm `db/migrations/**`).

Căn cứ: review phân loại §0.2 T2 + §3.2 (`docs/architecture/classification-enrich-review.md`), ADR-0013 §8–§10,
`docs/architecture/reso-khung-phan-loai.md` §6–§8, FRAMING §3.4, lỗi L07/L08 của review, chồng chéo X2 của
`lat-ocp1-huong-tiep-can-2610.md` (nguồn danh sách trường duy nhất là `pipeline/mappings.yaml`).

## 1. Vấn đề, đo 26/10

Từ vựng dữ liệu đang được viết tay ở nhiều chỗ, và các bản không khớp nhau:

| Trục | Định nghĩa đang có | Lệch |
|---|---|---|
| `property_type` | CHECK 025 · `mappings.yaml` · `dq-enum-vocab.mjs` · `ops-labels.ts` · prompt `enrich-text.ts:22` · `route.ts:25` · `transform-chotot.mjs:47` · `context-resolver.ts` | `route.ts` thiếu `unknown`; `properties.property_type` không có CHECK |
| `kind` | CHECK 025 · `mappings.yaml` · `dq-enum-vocab` · `ops-labels` · prompt bench | prompt `bench-gate.mjs` thừa `other` |
| `confidence` | CHECK 025 · `mappings.yaml` · `dq-enum-vocab` · `ops-labels` · `deal-card.tsx` | nhãn thứ hai ở `deal-card` |
| `price_tier` | CHECK 025 · `mappings.yaml` · `dq-enum-vocab` · `ops-labels` | — |
| tên trường enrich | CHECK 033 · `route.ts` (hai bản) · `review-card.tsx` · `write-offers.mjs` | `ENRICH_COLS` thiếu `bedrooms` (cố ý, là danh sách cột ghi) |
| `listing_intent`, `offer_status`, bậc dữ liệu | **không có ở đâu** | lát OCP1 cần (review §0.2 E bước 2) |

- Bốn CHECK của 025 vẫn `NOT VALID`. DB local có 18.859 tin rao và **0 dòng lệch**, nên VALIDATE được ngay.
- Không module nào chia sẻ mã với module khác. app chỉ có alias `@/*`, agent import tương đối, `data-api` có `rootDir: src`.
  Vì vậy mỗi module cần bản hằng của riêng nó.
- Chưa có bộ đọc YAML thật: `check-s08-inventory.mjs` dò bằng regex, mà `mappings.yaml` có chuỗi gập `>`.

## 2. Hướng chọn

**Sổ** = khối `enums:` của `pipeline/mappings.yaml`, mở rộng theo khuôn RESO `Lookup` (ADR-0013 §8):

```yaml
enums:
  property_type:
    term_vi: Loại hình                 # thuật ngữ CONTEXT.md
    dd_field: PropertySubType          # field RESO mà lookup này phục vụ (DD 2.1)
    columns: [sale_offers.property_type, properties.property_type]   # cột bị ràng bằng CHECK
    nullable: true
    values:
      - { code: apartment, label_vi: Căn hộ,   dd_lookup: Condominium }
      - { code: room,      label_vi: Phòng,    local: true, rationale: "...", checked_on: "2026-10-22" }
      - { code: unknown,   label_vi: Chưa rõ,  local: true, rationale: "«chưa biết» — không gửi ra API", checked_on: "..." }
```

Mỗi giá trị có `code` (chữ thường snake_case, hoặc mã bậc như `P1`, `B3`), `label_vi`, và một trong hai:
`dd_lookup` (StandardLookupValue gần nhất), hoặc `local: true` kèm `rationale` + `checked_on`. Đây là điều kiện 1 và 5
của ADR-0011 Qđ 3.

**Bộ sinh** `pipeline/vocab.mjs`, phần thuần đặt ở `pipeline/lib/vocab-core.mjs`. Đọc sổ bằng gói `yaml` (thêm
`devDependencies` của pipeline), kiểm khuôn, rồi ghi các tệp có đầu dòng
`// MÁY SINH từ pipeline/mappings.yaml — sửa sổ rồi chạy node pipeline/vocab.mjs --write`:

| Tệp sinh | Người đọc | Nội dung |
|---|---|---|
| `pipeline/lib/vocab.generated.mjs` | pipeline, `scripts/` | `VOCAB` (code theo trục), hằng từng code, `CANONICAL_FIELDS` |
| `agent/src/vocab.generated.ts` | agent (prompt, route enrich) | như trên + kiểu union, chuỗi prompt `a\|b\|c` |
| `app/src/lib/vocab.generated.ts` | app | `VOCAB` + `LABELS_VI` (nhãn từng giá trị) |
| `CONTEXT.md`, khối giữa `<!-- VOCAB:BEGIN -->` và `<!-- VOCAB:END -->` | người, agent | mỗi trục: thuật ngữ · code · RESO · nhãn từng giá trị |

Các lệnh của bộ sinh:

| Lệnh | Việc |
|---|---|
| `--write` | ghi các tệp sinh |
| `--check` | so tệp sinh với sổ; lệch thì thoát 1 và nêu tên tệp |
| `--lint` | tìm enum viết tay ngoài sổ |
| `--check-db` | so DB với sổ |
| `--check-field-targets [tệp]` | khoá tên trường của FIELD_TARGET (G3) |
| `--emit-seed` | in SQL nạp `ref_*`, dùng khi viết migration |

**Lint** (`--lint`, cũng chạy trong `pipeline` `npm test`):
- Quét `pipeline/`, `agent/src/`, `app/src/`, `data-api/src/`, `scripts/`.
- Chỉ quét `.mjs .js .ts .tsx .sql`.
- Bỏ qua:
  - tệp sinh, `node_modules`, test và fixture;
  - `db/migrations/` (lịch sử bất biến; DB được kiểm bằng `--check-db`);
  - `collector/` (làn ZCode; chỉ in số đếm, không đỏ);
  - tệp chép từ kit (`scripts/pre-merge-check.sh`, `scripts/product-map.mjs`, `scripts/check-lo-trinh.sh`; cấm sửa tay).
- Một **chỗ viết tay** là một nhóm chuỗi literal trong cùng một cặp ngoặc `[] {} ()`, hoặc cùng một dòng ở cấp ngoài cùng
  (union TS), hoặc một chuỗi nối `a|b`, chứa từ **hai code khác nhau trở lên của cùng một trục**.
- Danh sách `IN (...)` / `CHECK` của SQL cũng tính.
- Khoá object chỉ tính khi object là map nhãn, tức mọi giá trị là chuỗi literal. Trục `enrich_field` không tính khoá, vì
  tên trường cũng là tên cột: `{bedrooms: 2, bathrooms: 1}` không phải danh sách.
- Tên cột trần trong câu SQL không đặt trong nháy không tính.
- So một giá trị lẻ (`kind === 'sale'`) không tính.
- Mỗi lần đỏ in `đường:dòng · trục · các code`.
- Ngoại lệ có chủ ý (lọc tập con có nghĩa nghiệp vụ, như `confidence IN ('high','medium')`) khai ở `enums_lint_allow:` trong
  chính `mappings.yaml`, gồm đường + trục + lý do. Mục thiếu lý do, hoặc không còn khớp chỗ nào, cũng đỏ.
- Tập ngoại lệ được ghim trước trong hợp đồng (AC-5); test so tập.

**Bảng tra trong DB**: migration mới, số 043 theo đề xuất cấp lại của liên làn (sổ SO-MIGRATION liên làn đã chốt).
- `ref_lookup(lookup_name, lookup_value, standard_lookup_value, label_vi, is_local, sort_order)`, khoá
  `(lookup_name, lookup_value)` — khuôn RESO Lookup.
- `ref_field_lookup(table_name, column_name, lookup_name)` — khuôn RelatedLookup, nói cột nào dùng lookup nào.
- Nạp bằng đúng SQL của `--emit-seed` lúc viết migration.
- `ALTER TABLE … VALIDATE CONSTRAINT` bốn CHECK của 025.
- `properties_property_type_chk` mới (`NOT VALID` rồi `VALIDATE`), nếu Hỏi-2 trả «có».
- Idempotent: `IF NOT EXISTS`, `ON CONFLICT DO UPDATE`, khối `DO` kiểm `pg_constraint`.
- Giá trị mới về sau phải đi qua một migration mới. `--check-db` đỏ khi DB chưa theo kịp sổ:
  - dò `ref_lookup` và `pg_get_constraintdef` của mọi cột khai trong `columns`;
  - đỏ khi thiếu giá trị, thừa giá trị hoặc thiếu CHECK;
  - thông điệp nêu trục + giá trị + «cần migration mới».

**Khoá tên trường cho G3 (X2)** (`--check-field-targets`):
- Mỗi `canonical:` trong `collector/docs/field-targets.yaml` phải là khoá của `canonical.fields` trong `mappings.yaml`.
- Tệp chưa có thì thoát 0 kèm dòng «chưa có tệp».
- Khuôn đọc: khoá cấp một là mã nguồn `S0x`, dưới đó `fields:` là danh sách mục có `canonical`. Tệp có mặt mà khác khuôn
  này, hoặc đọc ra 0 mục `canonical`, thì thoát 1 «không nhận khuôn». Như vậy không xanh giả.
- Khuôn này gửi ZCode qua liên làn sau Cổng Phạm vi. Khi tệp thật có rồi, bộ kiểm chạy trên tệp thật.
- Lệnh chỉ đọc tệp của làn ZCode, không sửa `collector/`.
- Nguồn nào cần bảng canonical khác (S01 `listings`) thì phải khai bảng đó vào `mappings.yaml` trước. Đó đúng là ý X2:
  một danh sách trường duy nhất.

**Chuyển các chỗ viết tay sang hằng sinh**:
- pipeline: `dq-enum-vocab.mjs`, `transform-chotot.mjs`, prompt của `scripts/bench-*.mjs`.
- agent: `enrich/route.ts` (`PROPERTY_TYPES`, `EnrichField`, `ENRICH_FIELDS`), prompt `agents/enrich-text.ts`,
  `context-resolver.ts`.
- app: `lib/ops-labels.ts`. Bốn map nhãn đọc `LABELS_VI`, nhãn **giữ đúng byte** hiện có.
- Hành vi giữ nguyên:
  - route enrich vẫn bỏ đề xuất `unknown` (lọc ra từ hằng sinh);
  - chuỗi prompt enrich-text bằng byte chuỗi cũ.
- Còn lại vào danh sách ngoại lệ có lý do:
  - `review-card.tsx`: UI1 đang sửa, PL23 dựng lại;
  - các bộ lọc tập con trong SQL;
  - `compare-types.ts` `"high"|"low"`: trục khác trùng chữ.
  - `scripts/bench-gate.mjs`, `bench-extraction.mjs`: prompt bench đóng băng để so số đo cũ; `bench-gate` còn lớp
    `other` của Kev.

## 3. Các trục của sổ

| Trục | Giá trị | RESO | Cột bị ràng |
|---|---|---|---|
| `kind` | sale · rent_lt | PropertyType (Residential / ResidentialLease) | `sale_offers.kind` |
| `property_type` | apartment · house · land · room · commercial · unknown | PropertySubType / PropertyType (reso-khung §7) | `sale_offers.property_type`, `properties.property_type` |
| `confidence` | high · medium · low | local (reso-khung §4: thay dần bằng `*Source`) | `sale_offers.confidence` |
| `price_tier` | P0 · P1 · P2 | local | `sale_offers.price_tier` |
| `enrich_field` | property_type · bedrooms · bathrooms · street_raw · block_raw | tên field canonical | `enrichment_proposals.field` |
| `listing_intent` | offer · wanted · not_listing · unknown | extension `ListingIntent` (ADR-0013 §9) | — (cột ở PL5) |
| `offer_status` | active · active_under_contract · closed · withdrawn · unknown | StandardStatus (reso-khung §6) | — (cột ở PL19) |
| `data_level` | B0 … B5 | extension `DataLevel` (FRAMING §3.4) | — (PL16) |
| `capability_level` | N0 … N4 | extension `CapabilityLevel` (FRAMING §3.4) | — (PL16) |

- Nhãn của bậc lấy nguyên văn tên bậc ở FRAMING §3.4 (Mạnh duyệt 23/10).
- Nhãn mới của `listing_intent` và `offer_status` là nháp theo khuyến nghị, chờ Mạnh ở Cổng Phạm vi (Hỏi-1).
- Trục chưa có cột thì chỉ có lookup, chưa có CHECK. CHECK đi cùng migration của cột (điều kiện 3–4, 6 của ADR-0011
  hoàn tất ở hàng tạo cột).

## 4. Không làm, và vì sao

- `PriceBasis` để PL13. Tài liệu ghi «thu về · NET · gồm phí» nhưng chưa phân biệt «thu về» với «NET»; đoán sai thì
  CHECK và nhãn phải sửa lại. PL13 có 155 tin thật để đo.
- Không thêm cột mới vào bảng tin.
- Không đẩy migration lên Supabase (bước của Mạnh).
- Không đưa `ref_*` vào `sync-cloud.mjs` (đường T3 riêng; app đọc nhãn từ tệp sinh, không từ DB).
- Không sửa các ô `dd: null` theo ADR-0013 §10 (việc riêng).
- Không sửa `collector/`, `review-card.tsx`, `deal-card.tsx` (nhánh nhãn if-chain), `mcp-tools.json`.

## 5. ADR-0013 — 8 câu

1. **Lớp**: lookup không gắn lớp. Cột ràng thuộc tin (`sale_offers`) và căn (`properties.property_type`).
2. **DD 2.1**: mỗi giá trị khai `dd_lookup` hoặc `local` + `checked_on`.
3. **Khoá**: không đụng.
4. **Ai ghi**: không câu `UPDATE` cột chuẩn nào. Migration chỉ thêm ràng buộc và bảng tra.
5. **Nguồn gốc**: không đổi.
6. **Thời gian**: chỉ khai lookup `offer_status`, chưa có cột.
7. **Nâng bậc**: điều kiện của B1 «đọc theo từ vựng chung» (T2). Mọi bộ đọc sau (PL13, PL15) dùng chung một sổ, nên khi từ
   vựng đổi thì B1 tụt có chỗ đo.
8. **SPL**: sổ không chứa tên nguồn thật. `source` vẫn lấy từ `source_registry.code` (giữ `values_from`).
