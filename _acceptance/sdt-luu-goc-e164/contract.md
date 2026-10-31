---
schema_version: 1
feature: Tin và danh bạ Người lưu số gốc SĐT ở một dạng +84…, danh bạ có bí danh số gốc, và bảng người bán thành view trên danh bạ
slug: sdt-luu-goc-e164
owner: phanlemanh@gmail.com
risk_tier: T3
surfaces: [cli]
status: verified
approved_by: Mạnh
approved_at: 2026-10-31
design_doc: docs/superpowers/specs/2026-10-31-sdt-luu-goc-e164-design.md
---

# Acceptance Contract: sdt-luu-goc-e164

## Context

Hàng SD3 của `docs/plan/lo-trinh.json` (T3, dãy P4). Cổng Đáng `build`: Mạnh 30/10 «Cổng Đáng build 6 hàng audit Người
theo thứ tự đề xuất». Căn cứ: `docs/research/audit-bang-nguoi-sdt-3010.md` §3.2, §5b, §6.1, §6.4 (Hỏi-A, Hỏi-C bước 2).
Migration số 060 do giám sát cấp. DB máy thu hôm nay: `seller_phone` dạng `0x…`, 212 bí danh `sdt_bam`, 0 bí danh `sdt`.

## Criteria

- AC-1: Given bài S03/S05 có SĐT ở mọi dạng SD2 nhận, When transform đọc, Then số ra là `+84[35789]\d{8}`;
  `seller_phone` ghi dạng ấy và `seller_phone_hash = sha256(seller_phone)[0:32]`; luật nhận/bỏ số của SD2 không đổi.
- AC-2: Given DB thử chép từ máy thu, When áp `060_sdt_e164.sql` hai lần, Then lần hai không đổi lược đồ hay dòng nào;
  `registry_aliases.kind` nhận `sdt` (CHECK, chỉ mục duy nhất định danh, `ref_lookup`), và `vocab.mjs --check-db` xanh với
  `mappings.yaml` đã thêm `sdt`.
- AC-3: Given DB thử sau 060, When đếm, Then 0 giá trị `seller_phone` không khớp `^\+84[35789]\d{8}$`; mọi
  `seller_phone_hash` (tin) bằng `sha256` của E.164; `properties.seller_phone_hash` đổi theo bảng ánh xạ khoá cũ → khoá E.164
  của cùng số, số dòng khác null trước = sau; số tin có SĐT trước/sau bằng nhau.
- AC-4: Given DB thử sau 060, When `dungNguoi` chạy, Then mỗi người theo SĐT có đúng một bí danh `sdt` còn hiệu lực mang
  E.164; người đã có `sdt_bam` giữ nguyên `party_key`; 0 bí danh `sdt_bam` còn hiệu lực (nghỉ bằng `retired_at`, không
  xoá); lượt hai thêm 0 bí danh và 0 người.
- AC-5: Given DB thử sau 060, When đọc `sellers` (view), Then số dòng = số SĐT khác nhau trên tin sống, và mọi cột
  (`phone_hash`, `name`, `sources`, `n_ads`, `first_seen`, `last_seen`, `flags` gồm `n_sale`, `n_rent`, `median_gap_pct`,
  `n_good_deals`, `multi_channel`, `sources`) trùng câu tính độc lập từ `sale_offers` theo luật cũ của `refresh-bait-gap`;
  truy vấn `/ops/deals` (`deals.ts`) chạy không đổi. So với bảng cũ chụp ngay trước 060 (sau một lượt refresh): 0 dòng bảng cũ
  mất; `first_seen`/`last_seen` lấy từ mọi bản ghi tin kể cả đã nghỉ nên không muộn hơn bảng cũ (Hỏi-4). `name` = `seller_name` khác rỗng mới nhất của tin mang số ấy, và mọi
  `name` khác rỗng của bảng cũ (hôm nay 203/208) còn lại thành bí danh `ten` của người theo số ấy (Hỏi-3).
- AC-6: Given `refresh-bait-gap.mjs`, When chạy trên DB thử, Then không lệnh nào ghi hay xoá `sellers`; bait gap vẫn tính;
  test bait gap và sync-cloud sửa theo view đều xanh.
- AC-7 (cross-layer): Given lượt đọc của `sync-cloud.mjs` trên DB thử, When dựng câu đọc cho `sale_offers`, `sellers`,
  `properties`, Then không cột `seller_phone`, `seller_name`, `sellers.name` nào và không giá trị khớp `\+84\d{9}` nào trong
  dữ liệu sẽ đẩy; các test chặn rò của kho xanh.
- AC-8 (cross-layer): Given bí danh `sdt` trên DB, When loader thật của `/ops/people` (`app/src/lib/ops/people.ts`) dựng dòng,
  Then ở mọi vai giá trị hiện là nhãn che cố định, 0 chữ số của số gốc (Hỏi-2); bộ đo `do-danh-ba-sdt`, `scripts/do-boc-sdt.mjs`, `scripts/test-data-residue.mjs` đọc E.164 và suite
  pipeline/app xanh.
- AC-9: Given nhánh so với merge-base, When liệt kê tệp đổi, Then chỉ trong danh sách tệp của design §1–§4, test liên quan,
  `CONTEXT.md`, `pipeline/CLAUDE.md`, `_acceptance/config.yaml`, hồ sơ này, plan, tệp máy sinh; không lệnh nào áp 060 lên
  DB `oneinvest` :5433 hay Supabase.

## Coverage

- Trục **chỗ lưu SĐT** (bộ bóc · `sale_offer_records` · `properties` · bí danh danh bạ · `sellers` · cloud) — AC-1, AC-3,
  AC-4, AC-5, AC-7.
- Trục **thời điểm** (dữ liệu cũ qua migration · dữ liệu mới qua transform · chạy lại) — AC-2, AC-3, AC-4.
- Trục **người đọc** (bait gap · deals · sync-cloud · /ops/people · bộ đo) — AC-5, AC-6, AC-7, AC-8.
- Thước CE: câu đo độc lập trên bản chép DB máy thu (`db/db-thu.sh`); số «Bật khi» của audit §6.1. Bản quét:
  `coverage-scan.md`.

## Đường đo

- «0 giá trị SĐT nào không khớp `^\+84[35789]\d{8}$`» — AC-3. «Mọi người theo SĐT có bí danh `sdt`» — AC-4.
  «Bí danh `sdt_bam` cũ nghỉ, không sửa tại chỗ; nạp lại lượt hai thêm 0» — AC-4. «`sellers` đọc từ view ra cùng số dòng và
  cột tổng hợp» — AC-5. «Leak gate cloud xanh, `seller_phone` không lên cloud» — AC-7.

## Out of scope

- Gộp người SĐT với người tài khoản (`gop-nguoi-sdt-tai-khoan`); hiện số gốc trên `/ops/people` (U1 `people-hien-so-goc`).
- Đưa số gốc lên cloud; áp 060 lên DB máy thu và Supabase (sau khi gộp, có `pg_dump`, do bước triển khai riêng).

## Notes

- Băm giữ vì cloud chỉ nhận khoá (Hỏi-A); đổi khoá một lần trong vòng này (Hỏi-C bước 2).
