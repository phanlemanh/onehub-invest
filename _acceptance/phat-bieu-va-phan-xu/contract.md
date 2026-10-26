---
schema_version: 1
feature: "Bảng phát biểu append-only và bộ phân xử ba lớp dựng cột canonical kèm provenance, chạy lại ra y nguyên"
slug: phat-bieu-va-phan-xu
owner: phanlemanh@gmail.com
risk_tier: T3
surfaces: [cli, config, docs]
status: draft
design_doc: docs/superpowers/specs/2026-10-26-phat-bieu-va-phan-xu-design.md
approved_by:
approved_at:
---

# Acceptance Contract: phat-bieu-va-phan-xu

## Context

Năm cột phân loại của tin — `property_type`, `bedrooms`, `bathrooms`, `street_raw`, `block_raw` — hôm nay do nhiều tầng
ghi thẳng, ai ghi trước thắng (RV-L12), không ô nào trả lời được «ai nói, dựa vào đâu» (RV-L02). Vòng này làm ba việc:
- thêm bảng phát biểu chỉ-thêm;
- thêm một bộ phân xử ba lớp dựng năm cột kèm nguồn gốc từng ô;
- chuyển mọi đường ghi năm cột sang «ghi phát biểu rồi phân xử».

Xoá năm cột rồi dựng lại phải ra trùng từng ô.

Căn cứ: RV-§0.2 D-1, RV-§3.1–§3.4, ADR-0013 §6, `reso-khung-phan-loai.md` §6. Cổng Đáng `build`: giám sát đợt
`dot0-cam-mau` (P2-64) theo gói lát OCP1 Mạnh duyệt 26/10. Nền: PL14 (#132, khoá tin bền + view sống).

Source input: `_acceptance/phat-bieu-va-phan-xu/opportunity.md` (hàng PL15 của `docs/plan/lo-trinh.json`).

## Criteria

- AC-1: Given DB local, When `bash db/check-idempotent.sh db/migrations/045_phat_bieu_va_phan_xu.sql field_assertions
  sale_offer_records` chạy, Then hai lần áp đều xanh, lược đồ không đổi ở lần hai, và có đủ các thứ sau.
  - Bảng `field_assertions` với CHECK lấy từ sổ: `field` ∈ trục `enrich_field`, `evidence_tier` ∈ {fact, observed,
    inferred}, `method` ∈ sáu phương pháp, cặp lớp ↔ phương pháp hợp lệ.
  - Chỉ mục duy nhất trên phát biểu sống.
  - Cột `sale_offer_records.field_provenance`; view `sale_offers` có cột đó.
  - `v_ruler_p2`, `v_ruler_p2_area` còn chạy.
  - `node pipeline/vocab.mjs --check-db` xanh.
  - Migration không ghi dòng nào vào bảng tin.
- AC-2: Given `field_assertions` có dòng, When UPDATE giá trị, DELETE hay TRUNCATE, Then câu lệnh lỗi với thông điệp
  ghim «field_assertions: chỉ thêm».
  - Rút (`retracted_at` + `retract_reason`) được đúng một lần.
  - Rút lần hai, hoặc rút không lý do, cũng lỗi.
  - Cặp hai chiều: bản sao bỏ trigger thì ca đỏ.
- AC-3: Given ma trận ca viết trước (≥ 12 ca) chèn phát biểu cho tin mồi trong giao dịch, When `resolve_offer_fields` chạy,
  Then mỗi ô ra đúng giá trị và cờ đã viết trước.
  - Các ca phải có:
    - không phát biểu → `unknown`/NULL;
    - fact trái observed → fact, `lower_disagree`;
    - hitl trái source_field → hitl;
    - cùng lớp đồng thuận;
    - cùng lớp bất đồng → thứ tự tạm và `conflict`;
    - legacy thua parser;
    - chỉ inferred → mặc định kèm `goi_y`;
    - phát biểu đã rút bị bỏ qua;
    - tin gộp hai post lấy hợp;
    - giá trị số ra kiểu số;
    - chủ thể của tin khác không lẫn vào.
  - Đảo thứ tự chèn phát biểu thì kết quả trùng từng ô.
- AC-4: Given DB local, When `node pipeline/scripts/dung-lai-canonical.mjs --nguon-goc` chạy (một giao dịch ROLLBACK: 045 khi
  chưa áp, cắt chuyển, rồi kiểm), Then kết quả như sau.
  - Mọi ô khác mặc định của năm cột có `field_provenance[<trường>]` với `tier`, `method`, `ids`.
  - Mọi id trong `ids` là phát biểu sống thuộc chủ thể của chính tin đó.
  - Đếm mồ côi = 0.
  - Cặp: ghi thẳng một ô bỏ qua bộ phân xử thì kiểm đỏ, nêu `offer_id` + trường.
- AC-5: Given transform S03, S05, S06, When một lượt nạp chạy trong giao dịch, Then năm cột chỉ được ghi qua phát biểu +
  phân xử.
  - S06: loại hình (`rule_id 'category:<n>'`) và phòng ngủ (`rooms`) là `fact`/`source_field`.
  - S03/S05: phòng ngủ là `observed`/`parser`, mỗi post một phát biểu.
  - Lượt sau ra giá trị khác thì phát biểu cũ cùng phương pháp bị rút (`thay-boi-luot`), không thành bất đồng.
  - `ENRICH_COLS` gỡ khỏi `write-offers.mjs`.
  - Bộ quét tĩnh: không còn câu ghi năm cột vào `sale_offer_records`/`sale_offers` ngoài hàm phân xử.
    - Phạm vi quét: `pipeline/` (gồm `.sql`, `.sh`), `agent/`, `app/src`, `scripts/`, migration ≥ 045.
    - Bắt được câu SET nhiều dòng và alias bảng.
    - Ma trận đối chứng viết trước: `.mjs`, `.ts`, `.sql`, `.sh`, SET nhiều dòng, alias. Mỗi phần tử một dòng đỏ, nêu
      tệp:dòng.
  - Quét hàm sống trong DB (`pg_proc`) sau khi áp 045: tập hàm ghi năm cột ngoài `resolve_offer_fields` = rỗng.
    Đối chứng: cấy một hàm plpgsql ghi `bathrooms` trong giao dịch thì đỏ, nêu tên hàm.
- AC-6: Given đường enrich, When `apply_enrichment`, route decide (`hitl:`) và `revert_enrichment` chạy trong giao dịch,
  Then kết quả như sau.
  - E1 thành phát biểu `observed`/`e1_rule`, E2 thành `observed`/`e2_llm`, người thành `fact`/`hitl` kèm `changed_by`.
    Hitl mới rút hitl cũ khác giá trị.
  - Đề xuất `applied` khi cột nhận đúng giá trị đó, `skipped` khi không.
  - Hoàn tác rút phát biểu của đề xuất, ô về giá trị kế tiếp có căn cứ.
  - Áp hai đề xuất theo hai thứ tự ra cùng cột.
  - Bộ test agent (`enrich-db`) cập nhật theo nghĩa mới và xanh.
  - Ma trận chỗ gọi viết trước: mọi chỗ gọi `apply_enrichment`, `revert_enrichment`, `decide_enrichment_review` trong
    `app/src`, `agent/`, `pipeline/`, `scripts/`. Mỗi chỗ có kỳ vọng: người → actor `hitl:`, máy → không `hitl:`.
    - Actor lấy từ chính mã gọi (hằng hoặc hàm dựng actor), không viết tay trong test.
    - Chỗ gọi mới ngoài tập thì đỏ.
    - Đối chứng: chỗ gọi của người mà actor sai tiền tố thì đỏ.
- AC-7: Given DB local, When `node pipeline/scripts/dung-lai-canonical.mjs` chạy (một giao dịch ROLLBACK: 045 khi chưa áp,
  cắt chuyển, rồi đo), Then dựng lại khớp từng ô và lượt dựng thứ hai đổi 0 dòng.
  - Mốc là giá trị từng ô (offer_id, trường, giá trị) chụp TRƯỚC cắt chuyển.
  - Script cắt chuyển, đặt năm cột về mặc định và `field_provenance = '{}'` cho mọi bản ghi tin, rồi dựng lại.
  - So từng ô với mốc: 0 ô lệch, trừ đúng danh sách ô S05 loại hình NULL → `unknown` khai trước. In ma trận nguồn ×
    trường: số ô, số lệch.
  - Hai đối chứng, mỗi cái báo lệch > 0 và nêu `offer_id` + trường:
    - `--doi-chung=ghi-thang`: một ô ghi thẳng không có phát biểu;
    - `--doi-chung=rut`: rút một phát biểu đang thắng.
- AC-8: Given DB local, When `node pipeline/phat-bieu-cat-chuyen.mjs --thu` chạy, Then ghi phát biểu `legacy` cho mọi ô
  khác mặc định chưa có phát biểu đỡ (theo lối Hỏi-2 đã chọn) và dựng lại.
  - Từng ô (offer_id, trường, giá trị) trước = sau, trừ đúng danh sách ô loại hình S05 NULL → `unknown` (9 ô ngày
    26/10). Danh sách này khai trước và in riêng.
  - Đối chứng: tiêm một phát biểu `legacy` mang giá trị khác thì lệnh đỏ, nêu offer_id + trường.
  - Chạy lần hai ghi 0 phát biểu mới.
  - Lượt không `--thu` ghi `ops_audit` `phat-bieu:cat-chuyen` kèm hai bảng đếm.
  - Cổng cắt chuyển: trên DB đã áp 045 mà chưa có dòng `phat-bieu:cat-chuyen` ấy, `resolve_offer_fields`,
    `apply_enrichment`, `revert_enrichment` và transform đều từ chối với thông điệp ghim «phân xử: chưa cắt chuyển».
    Không ô nào đổi. Đối chứng: có dòng thì chạy.
- AC-9: Given DB local, When thước PL14 `node pipeline/scripts/nap-lai-ba-luot.mjs` chạy, Then vẫn 0 quyết định người mất,
  0 liên kết mất.
  - Ca thêm (giao dịch ROLLBACK): một quyết định người trên một trường của tin S03 sống qua ba lượt nạp và vẫn thắng
    khi parser lượt sau ra giá trị khác. Phát biểu `hitl` còn nguyên, cột mang giá trị người.
- AC-10: Given DB local, When chạy thật `node pipeline/scripts/phat-bieu-chay-that.mjs --thu` (ba transform + phân xử, giao
  dịch ROLLBACK), Then kết quả như sau.
  - In giây từng bước, tổng ≤ 300 giây.
  - `CLOUD_ALLOW.sale_offers` không chứa `field_provenance`, và tập bảng sync không chứa `field_assertions`. Đo bằng
    test.
  - Các suite `pipeline`, `agent`, `app`, `app_ui` xanh — app và data-api đọc view không đổi.

## Coverage

- Trục người viết: source_field S06 | parser S03/S05 | e1_rule | e2_llm | hitl | legacy.
  - Thước CE: các đường ghi năm cột hôm nay (`write-offers.mjs`, `transform-chotot.mjs`, migration 033, 036)
    [SUY-TỪ-REPO: pipeline/lib/write-offers.mjs].
  - AC-5, AC-6, AC-8.
- Trục quan hệ trong ô: không phát biểu | một lớp | lớp trên trái lớp dưới | cùng lớp đồng thuận | cùng lớp bất đồng |
  chỉ suy luận | đã rút.
  - Thước CE: luật phân xử [SUY-TỪ-REPO: docs/architecture/classification-enrich-review.md] §3.3 + §0.2 D-1;
    [NGÀNH: Wikidata statement rank + reference].
  - AC-3.
- Trục vòng đời: ghi đầu | nạp lại | rút/hoàn tác | sửa-xoá trái phép | dựng lại từ trống | tin gộp nhiều post | cắt
  chuyển.
  - Thước CE: thước PL14 + `bat_khi` PL15 [SUY-TỪ-REPO: docs/plan/lo-trinh.json]; [NGÀNH: event sourcing].
  - AC-2, AC-6, AC-7, AC-8, AC-9.
- Trục mặt đọc: view `sale_offers` (app, data-api) | provenance | sync-cloud | cascade `properties`.
  - Thước CE: 50 tệp đọc hai bảng (đếm 26/10, PL14) [SUY-TỪ-REPO: _acceptance/nap-lai-khong-xoa/contract.md].
  - AC-1, AC-4, AC-10.
- [GIẢ ĐỊNH] năm trường của trục `enrich_field` không có field `*Source` chuẩn trong RESO DD 2.1 — provenance để local.

## Đường đo

- Thước: «Xoá cột canonical rồi dựng lại: kết quả trùng từng ô».
  - Số từ: ma trận nguồn × trường của `pipeline/scripts/dung-lai-canonical.mjs` trên DB local.
  - Bảo đảm bởi: AC-7.

## Out of scope

- Đề xuất enrich cũ và quyết định người cũ thành phát biểu; bậc B0–B5: PL16.
- `rule_id` + vị trí đoạn khớp cho parser; Chợ Tốt duy trì đường, WC, tầng. `kind`, giá, diện tích, tầng qua phát
  biểu: PL17.
- E1 theo lớp, E2 chạy mù và loại trích dẫn giả (hạ xuống `inferred`): PL18.
- `observed_at` bắt buộc, `offer_status`, lịch sử giá: PL19. Vòng này chỉ có cột, điền khi biết.
- Cổng «chỉ tự áp ô đã đo» theo cận dưới Wilson: PL21. Vòng này ghi `measured: false`.
- Thẻ duyệt cho ô bất đồng, hiện phát biểu theo lớp: PL23.
- Provenance trên Invest Portal / data-api; mọi thay đổi lược đồ cloud.

## Notes

- Cổng Phạm vi, Gate 1.5 và Cổng Bằng chứng do Mạnh ký (T3); giám sát không ký thay.
- Các thước trên DB local tự chứa trong một giao dịch: job đêm vẫn chạy mã của `main` (ghi thẳng năm cột) tới khi vòng
  này merge, nên đo trên trạng thái DB «đang sống» sẽ lệch vì job đêm, không vì vòng. E1 (`check-idempotent.sh`, theo
  lời giám sát) áp 045 thật vào DB local: hàm `apply_enrichment`/`revert_enrichment` bản mới chạy ngay, transform cũ vẫn
  ghi thẳng tới khi merge.
- Migration số 045 theo SO-MIGRATION (`_acceptance/so-tu-vung-mot-nguon/contract.md`); không giả định chạy trước 047/048.
