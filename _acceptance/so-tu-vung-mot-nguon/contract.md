---
schema_version: 1
feature: "Một sổ từ vựng sinh bảng ref_*, hằng TS/JS, enum prompt và nhãn tiếng Việt; lint đỏ khi có enum viết tay ngoài sổ"
slug: so-tu-vung-mot-nguon
owner: phanlemanh@gmail.com
risk_tier: T3
surfaces: [cli, config, docs]
status: draft
design_doc: docs/superpowers/specs/2026-10-26-so-tu-vung-mot-nguon-design.md
approved_by:
approved_at:
---

# Acceptance Contract: so-tu-vung-mot-nguon

## Context

Từ vựng dữ liệu (loại tin, loại hình, độ tin trích xuất, bậc giá, tên trường enrich) đang viết tay ở hơn 12 chỗ và lệch
nhau (L07/L08). Ba trục lát OCP1 cần — ý định tin, trạng thái chào, bậc dữ liệu — chưa có ở đâu. Vòng này biến khối
`enums:` của `pipeline/mappings.yaml` thành sổ duy nhất theo khuôn RESO Lookup. Bộ sinh ra hằng cho pipeline/agent/app,
khối thuật ngữ của `CONTEXT.md` và bảng tra `ref_*` trong DB. Lint đỏ khi có enum viết tay ngoài sổ. Bốn CHECK của
migration 025 được VALIDATE. Nền cho PL14/PL15 và cho FIELD_TARGET G3 khoá tên trường theo cùng một sổ (X2).
Cổng Đáng `build`: giám sát đợt `dot0-cam-mau` (P2-56) theo Mạnh 26/10 «Hỏi-1..7: theo khuyến nghị».

Source input: `_acceptance/so-tu-vung-mot-nguon/opportunity.md` (hàng PL6 của `docs/plan/lo-trinh.json`).

## Criteria

- AC-1: Given khối `enums:` của `pipeline/mappings.yaml`, When bộ đọc sổ nạp nó, Then nhận đủ 9 trục.
  - Các trục: `kind`, `property_type`, `confidence`, `price_tier`, `enrich_field`, `listing_intent`, `offer_status`,
    `data_level`, `capability_level`.
  - Mỗi giá trị có `code` + `label_vi` + (`dd_lookup` hoặc `local: true` kèm `rationale` và `checked_on`).
  - Mỗi trục có `term_vi`, `dd_field` và `columns`.
  - Các giá trị đúng như bảng §3 của design doc.
  - Nhãn: năm trục cũ giữ đúng nhãn của `ops-labels.ts` (enrich_field theo `review-card.tsx`); `data_level` và
    `capability_level` nguyên văn tên bậc FRAMING §3.4; `listing_intent` và `offer_status` theo Hỏi-1 (mục «Hỏi ở Cổng
    Phạm vi» dưới).
  - Với sổ sai khuôn, bộ đọc thoát 1 và nêu trục + code. Sáu ca sai khuôn: thiếu `label_vi`, code trùng trong một trục,
    code sai khuôn chữ, `local` thiếu `rationale`, giá trị vừa `dd_lookup` vừa `local`, cột trong `columns` khai ở hai trục.
- AC-2: Given sổ hợp lệ, When chạy `node pipeline/vocab.mjs --write` hai lần liên tiếp, Then cả bốn đích bằng nhau từng
  byte giữa hai lần.
  - Bốn đích: `pipeline/lib/vocab.generated.mjs`, `agent/src/vocab.generated.ts`, `app/src/lib/vocab.generated.ts`, khối
    `VOCAB:BEGIN…END` của `CONTEXT.md`.
  - Mỗi tệp mang dòng đầu «MÁY SINH từ pipeline/mappings.yaml».
  - Nạp lại tệp sinh ra đúng sổ: cùng trục, cùng code theo thứ tự, cùng nhãn.
  - `CONTEXT.md` ngoài hai mốc không đổi byte nào.
- AC-3: Given cây sau vòng, When chạy `node pipeline/vocab.mjs --check`, Then thoát 0.
  - Trên bản sao: sửa tay một byte ở từng tệp sinh, hoặc thêm một giá trị vào sổ mà chưa `--write`. Cả hai ca thoát 1
    và nêu tên tệp lệch.
- AC-4: Given một cây giả có sáu dạng viết tay, When chạy lint, Then đỏ ở từng dạng, mỗi dòng đỏ có `đường:dòng · trục · code`.
  - Sáu dạng: mảng, `Set`, khoá object nhãn, union TS, `IN (...)` SQL, chuỗi prompt `a|b`. Mỗi dạng chứa ≥2 code của một
    trục, ở một tệp được quét.
  - Cùng tệp, sửa mỗi chỗ còn một code lẻ: xanh.
  - Bản sao của chỗ viết tay đặt trong vùng không quét (tệp sinh, `db/migrations/`, `collector/`, tệp test): xanh.
  - Mục ngoại lệ thiếu `reason`, hoặc không còn khớp chỗ nào: đỏ, nêu mục.
  - Chữ trùng mà không phải danh sách của trục không đỏ: object có khoá `bedrooms`/`bathrooms` giá trị số, một mã `P1`
    đứng lẻ, tên cột trong câu SQL không đặt trong nháy. Tệp chép từ kit (`scripts/pre-merge-check.sh`,
    `scripts/product-map.mjs`, `scripts/check-lo-trinh.sh`) nằm ngoài vùng quét.
- AC-5: Given cây thật sau vòng, When chạy `node pipeline/vocab.mjs --lint`, Then thoát 0, 0 chỗ đỏ ngoài `enums_lint_allow`.
  - Mỗi chỗ của bảng kiểm kê (design doc §1, ma trận ở §2 «Chuyển các chỗ viết tay») có đúng một trong hai kết cục:
    - **đọc hằng sinh**: `pipeline/dq-enum-vocab.mjs`, `pipeline/transform-chotot.mjs`, `agent/src/enrich/route.ts`
      (`PROPERTY_TYPES`, `EnrichField`, `ENRICH_FIELDS`), `agent/src/agents/enrich-text.ts` (prompt),
      `agent/src/agents/context-resolver.ts`, `app/src/lib/ops-labels.ts` (bốn map nhãn);
    - **ngoại lệ có tên**, đúng tập này và không mục nào khác: `app/src/components/ops/review-card.tsx` (UI1/PL23),
      `pipeline/scripts/bench-gate.mjs` và `pipeline/scripts/bench-extraction.mjs` (prompt bench đóng băng để so số đo
      cũ), các bộ lọc tập con `confidence IN ('high','medium')` ở `pipeline/sql/500_asset_stats.sql`,
      `pipeline/resolve-properties.mjs`, `agent/src/enrich/run.ts`, bộ lọc `property_type IN ('apartment','house')` ở
      `pipeline/resolve-properties.mjs`, `app/src/components/compare/compare-types.ts` (trục khác trùng chữ).
  - Hành vi giữ nguyên khi chuyển sang hằng: route enrich vẫn KHÔNG nhận đề xuất `unknown` (coi là ô trống, như
    `route.ts` trước vòng); chuỗi prompt enrich-text bằng đúng byte chuỗi cũ.
- AC-6: Given bản nhãn của `ops-labels.ts` trước vòng (ghim trong test), When app đọc nhãn sinh từ sổ, Then 4 map
  (`propertyTypeLabel`, `offerKindLabel`, `confidenceLabel`, `priceTierLabel`) trả đúng byte nhãn cũ cho mọi code cũ.
  - Các suite `pipeline`, `agent`, `app`, `app_ui`, `ui_lint_rules` vẫn xanh.
- AC-7: Given DB local, When áp migration `043_ref_vocabulary.sql` trong một giao dịch rồi ROLLBACK, Then kết quả như sau.
  - `ref_lookup` và `ref_field_lookup` có đúng nội dung `--emit-seed` của sổ.
  - Bốn CHECK của 025 có `convalidated = true`; `properties_property_type_chk` có mặt và `convalidated = true` (nếu
    Hỏi-2 trả «có»; trả «không» thì ràng buộc này vắng và `properties.property_type` không khai trong `columns`).
  - Tiền đề của lần áp thứ nhất được dựng lại trong giao dịch trước khi áp: không có `ref_*`, không có
    `properties_property_type_chk`, bốn CHECK của 025 ở trạng thái `NOT VALID`.
  - Chạy migration lần hai trong cùng giao dịch không lỗi.
  - Đối chứng: chèn trước một dòng `sale_offers.property_type` ngoài sổ (bỏ qua CHECK qua `NOT VALID`), thì migration
    lỗi và nêu tên `sale_offers_property_type_chk`.
- AC-8: Given DB local đã áp 043, When chạy `--check-db`, Then thoát 0.
  - Đỏ, nêu trục + giá trị + «cần migration mới», ở ba ca:
    - sổ (bản sao) thêm một giá trị cho trục có `columns`;
    - `ref_lookup` thiếu một dòng (trong giao dịch, ROLLBACK);
    - một cột khai trong `columns` không có CHECK.
- AC-9: Given một tệp FIELD_TARGET (khuôn `collector/docs/field-targets.yaml`: nguồn × trường có `canonical`), When chạy
  `--check-field-targets <tệp>`, Then kết quả như sau.
  - Mọi `canonical` là khoá của `canonical.fields` trong `mappings.yaml`: thoát 0.
  - Có tên ngoài sổ: thoát 1, nêu nguồn + tên.
  - Tệp vắng: thoát 0, in «chưa có tệp».
  - Tệp có mặt mà đọc ra 0 mục `canonical`, hoặc gặp khoá cấp nguồn lạ: thoát 1, in «không nhận khuôn» — không xanh giả
    khi ZCode viết khuôn khác.
  - Lệnh không ghi tệp nào trong `collector/`.

## Hỏi ở Cổng Phạm vi

(Hai câu riêng của PL6 — khác «Hỏi-1..7» của gói lát OCP1 đã duyệt 26/10.)

- **Hỏi-1 · nhãn tiếng Việt cho hai trục mới** — khuyến nghị:
  - `listing_intent`: offer «Tin rao» · wanted «Tin tìm mua, tìm thuê» · not_listing «Không phải tin rao» · unknown «Chưa rõ».
  - `offer_status`: active «Đang chào» · active_under_contract «Đã cọc» · closed «Đã bán» · withdrawn «Đã gỡ» · unknown «Chưa rõ».
  - Lối khác: để trống nhãn tới PL5/PL19 — bộ đọc phải nhận ngoại lệ khuôn.
- **Hỏi-2 · thêm CHECK cho `properties.property_type` ở vòng này?** — khuyến nghị: có. Cột này do `resolve-properties.mjs`
  (chạy đêm) chép từ `sale_offers.property_type`, vốn đã bị CHECK cùng sổ, nên giá trị ngoài sổ chỉ đến từ lỗi. DB local
  17.423 căn dùng 5/6 giá trị của sổ (không có `unknown`).
  - Lối khác: không ràng, chỉ để `--check-db` và DQ báo — giá: giá trị lạ vào bảng căn mà lượt đêm không báo lỗi.

## Coverage

- Trục đầu ra của sổ: hằng pipeline | hằng agent + chuỗi prompt | hằng + nhãn app | khối CONTEXT.md | bảng `ref_*` + CHECK
  trong DB | khoá tên trường G3.
  - Thước CE: review §3.2 kê đúng năm đích (bảng tra `ref_*`, hằng TS/JS, enum prompt, nhãn UI, thuật ngữ CONTEXT.md)
    [SUY-TỪ-REPO: docs/architecture/classification-enrich-review.md]. Đích thứ sáu (G3) lấy từ X2 của gói lát OCP1
    (Mạnh duyệt 26/10) và hàng G3 [SUY-TỪ-REPO: docs/plan/danh-gia-observability-s05-2510.md].
  - AC-2, AC-7, AC-9.
- Trục từ vựng: 5 trục đang có + 4 trục mới (`listing_intent`, `offer_status`, `data_level`, `capability_level`).
  - Thước CE: bảng kiểm kê 26/10 (design doc §1) + sổ extension ADR-0013 §9 + reso-khung §8.
    [NGÀNH: RESO Data Dictionary 2.1 — resource Lookup/Field, StandardStatus]
  - `PriceBasis` → Later. AC-1.
- Trục chế độ lệch: tệp sinh cũ | enum viết tay mới | DB chậm hơn sổ | dữ liệu lệch CHECK | tên trường G3 ngoài sổ |
  ngoại lệ hết hiệu lực.
  - Thước CE: mỗi chế độ là một chỗ sổ tách khỏi vật mà nó sinh hoặc ràng. Cùng khuôn «sổ → bản khai» của
    `scripts/check-mcp-tools.mjs` và `route-slugs.test.mjs`.
    [NGÀNH: Prisma schema → client sinh sẵn + kiểm lệch; khuôn chung của mã sinh từ schema]
  - AC-3, AC-4, AC-7, AC-8, AC-9.
- Cross-cutting: nhãn hiển thị không đổi byte (AC-6); không quét làn ZCode và lịch sử migration bất biến (AC-4).

## Đường đo

- Thước: «Cấy một enum viết tay: lint đỏ» · số từ: mã thoát và dòng đỏ của `node pipeline/vocab.mjs --lint` trên cây cấy
  (ca test) · bảo đảm bởi: AC-4, AC-5.
- Thước: «mọi CHECK của 025 VALIDATE được» · số từ: `pg_constraint.convalidated` của bốn ràng buộc sau khi áp 043 · bảo
  đảm bởi: AC-7.

## Out of scope

- `PriceBasis` (thu về · NET · gồm phí): để PL13 — nghĩa «thu về» và «NET» chưa được tài liệu nào phân biệt.
- Cột mới trên bảng tin: `listing_intent` (PL5), `offer_status` (PL19), bậc dữ liệu (PL16). Sổ chỉ khai lookup; CHECK của
  các trục này đi cùng migration tạo cột.
- Áp migration 043 lên Supabase và đưa `ref_*` vào `sync-cloud.mjs`. Bước đẩy cloud là của Mạnh; app đọc nhãn từ tệp
  sinh, không từ DB.
- Sửa các ô `dd: null` theo ADR-0013 §10 và nâng `meta.dd_version` của khối canonical.
- Sửa `collector/` (làn ZCode) và `review-card.tsx` (UI1 đang sửa; PL23 dựng lại). Cả hai vào ngoại lệ có lý do hoặc
  vùng không quét.
- Đổi chữ hiển thị nào trên cổng: nhãn `deal-card.tsx` (if-chain riêng), thẻ duyệt hiện mã tiếng Anh (L08 — PL23).
- Hai enum nhỏ của `enrichment_proposals` (`source`, `route`) và `rent_st`.

> Out of scope = scope-truth (Gate 1 duyệt mục này). Rationale/trade-off từng mục → 1 entry `descope` trong `decisions.jsonl`.

## Notes

- Migration số 043: sổ SO-MIGRATION của liên làn đã chốt (043 PL6, 044 PL14, 045 PL15, 046 PL5). 041 (ZC7) và 042 (S08)
  chưa merge; lệch thứ tự chấp nhận được vì khác bảng (liên làn xác nhận).
- Bốn CHECK 025 VALIDATE trên DB local (0 dòng lệch, đo 26/10). Trên Supabase, VALIDATE có thể lỗi nếu cloud có dòng
  lệch. Bước đẩy cloud của Mạnh chạy `--check-db` trước.
- Nhãn mới (`listing_intent`, `offer_status`) là nháp, chờ Hỏi-1 ở Cổng Phạm vi. Nhãn bậc lấy nguyên văn FRAMING §3.4.
- Gói `yaml` thêm vào `devDependencies` của pipeline: chỉ bộ sinh và test dùng, runtime đọc tệp sinh.
