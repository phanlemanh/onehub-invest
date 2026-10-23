---
schema_version: 1
feature: Người vận hành thấy cùng một số SLO trên /ops và /ops/collections
slug: slo-mot-nguon
owner: phanlemanh@gmail.com
risk_tier: T2
surfaces: [ui, api, docs]
status: signed-off
design_doc: docs/superpowers/specs/2026-10-23-slo-mot-nguon-design.md
lo_trinh_ma: AU6
approved_by: Mạnh
approved_at: 2026-10-24
---

# Acceptance Contract: slo-mot-nguon

## Context

Hàng AU6 (đợt `cam-mau-2310`, dựng trên AU4). Audit 23/10 L14: `/ops` báo 4/14 ô đạt, `/ops/collections` báo 5/6 nguồn
— hai bảng SLO, hai cách đo, hai đơn vị đếm (design doc §1). AU4 đã chốt một định nghĩa ở `scripts/lib/freshness.mjs`;
vòng này đưa cả hai trang (và `/api/v1/ops/coverage`) về định nghĩa đó và một con số tóm tắt.

Source input: hàng AU6 `docs/plan/lo-trinh.json` + ô cơ hội `_acceptance/slo-mot-nguon/opportunity.md` (Mạnh «build duyệt»
23/10) + LUAT đợt `dot0-cam-mau` + hồ sơ AU4 `freshness-theo-nguon-that`.

## Criteria

- AC-1: Given `app/src/lib/freshness.ts` và `scripts/lib/freshness.mjs`, When so `SLO_HOURS`, `TIME_SOURCE`, SQL của `PROBES` và chạy `readFreshness` của cả hai trên cùng một client giả theo ma trận viết trước (5 mã có SLO × {tươi, quá hạn, chưa có dữ liệu} + một mã active không khai SLO), Then mọi hằng, mọi câu SQL và mọi hàng đầu ra bằng nhau từng phần tử; chiều đỏ: bản sao TS đổi SLO S03 từ 72 thành 2 → ca đỏ nêu «S03».
- AC-2: Given lược đồ tạm trong DB local dựng bằng `LIKE public.<bảng> INCLUDING ALL` (S01 hai thành phố — một tươi, một quá hạn · S03 và S05 chung một snapshot, tách theo `agent_id` · S06 có tin · S02 `vn` · S04 `completed`), When gọi `getCoverageOverview()`, Then mỗi hàng khớp `readFreshness` của `scripts/lib/freshness.mjs` trên cùng lược đồ (mã · thành phố · `ageHours` · `sloHours` · trạng thái), có hàng S05 với SLO 12 giờ, không có hàng S04 và không có hàng cho mã active chưa khai SLO, và thấy thành phố canh chỉ có trong lược đồ tạm (đối chứng dương: phép đo đọc đúng lược đồ); chiều đỏ: snapshot cũ được nạp lại (`captured_at` mới, `collected_at` cũ) vẫn ra quá hạn.
- AC-3: Given cùng lược đồ, When gọi `getSourceFeedHealth()`, Then mỗi nguồn có SLO mang `freshnessHrs` = tuổi lớn nhất trong các thành phố của nó và `sloHours` = `SLO_HOURS` của mã; nguồn có thành phố quá hạn ra «Trễ SLO»; nguồn mà `readFreshness` báo chưa có dữ liệu ra «Chưa có dữ liệu» (không còn «Ổn»); mã active chưa khai SLO ra «Chưa khai SLO» và không tính vào `y`; S04 ra «Ngừng»; `lastRunAt`/`items24h` giữ nghĩa lần chạy.
- AC-4: Given ma trận hàng độ tươi viết trước (mọi nguồn tươi · S01 quá hạn ở một trong hai thành phố · S06 chưa có dữ liệu · mã active không SLO · S04 completed), When `summarizeFreshness` và hai bộ chuyển của `/ops` và `/ops/collections` chạy trên cùng hàng, Then `x` = số nguồn có SLO mà mọi thành phố đạt, `y` = số nguồn active có SLO, và hai trang ra cùng `{x, y}` ở mọi ca (theo Hỏi-1).
- AC-5: Given hàng thật từ AC-2/AC-3, When render TRỌN trang `/ops` (`OpsOverviewPage`) và TRỌN phần hiển thị của `/ops/collections` (`CollectionsView` — `page.tsx` chỉ tải dữ liệu rồi truyền vào view), Then ô «Đạt SLO», ô «Sức khoẻ nguồn» và đầu hai trang mang cùng `data-slo-summary="x/y"`, bằng AC-4, chữ «x/y nguồn đạt SLO»; chiều đỏ: một thành phố của S01 chuyển quá hạn → cả hai ô cùng giảm 1.
- AC-6: Given hàng có tuổi/SLO 12 giờ (S05), 72 giờ (S03) và 840 giờ (S02), When render lưới `/ops`, lưới nguồn và mục «Cần chú ý» của `/ops/collections`, Then cả hai trang hiện tuổi và SLO bằng cùng bộ định dạng — dưới 48 giờ «N giờ», từ 48 giờ «N ngày» («12 giờ», «3 ngày», «35 ngày») — không còn cột «(ngày)» với SLO lẻ.
- AC-7: Given bearer `OPS_API_TOKEN` thử và lược đồ AC-2, When gọi `GET /api/v1/ops/coverage`, Then `rows` bằng hàng `/ops` dùng, mỗi hàng có `ageHours`, `sloHours`, và giữ `ageDays` = floor(`ageHours`/24), `sloDays` = `sloHours`/24 cho máy đọc cũ.
- AC-8: Given `.claude/skills/ops-check/SKILL.md`, When người vận hành đọc, Then biết hai trang Ops và `check-freshness.mjs` dùng cùng định nghĩa từng hàng nguồn × thành phố (`app/src/lib/freshness.ts`, giữ khớp `scripts/lib/freshness.mjs` bằng test), con số «x/y nguồn đạt SLO» chỉ có trên hai trang, và nguồn đạt nghĩa là mọi thành phố của nó đạt. (judgment)
- AC-9: Given lược đồ tạm như cloud — bảng thô có mặt nhưng 0 dòng (leak gate `pipeline/sync-cloud.mjs`), When gọi `getCoverageOverview()`, `getSourceFeedHealth()`, route coverage và render hai trang, Then không ném lỗi, hai hàm ra mảng rỗng, tóm tắt `0/0` với chữ «Chưa có nguồn nào» — y như hành vi trước vòng; chiều đỏ: `source_registry` có một mã active mà bảng nạp rỗng → mã đó «Chưa có dữ liệu», không phải lỗi.

## Coverage

Bỏ quét hình thái — xem dòng `bỏ coverage-scan` trong sổ. Ma trận:

- Trục A — bề mặt đọc số: `/ops` (AC-2, AC-5, AC-6) | `/ops/collections` (AC-3, AC-5, AC-6) | API máy (AC-7) | CLI
  (AC-1 khớp định nghĩa) | cloud không bảng nạp (AC-9) [thước CE: audit L14 — 4/14 vs 5/6].
- Trục B — trạng thái một nguồn: tươi | quá hạn một thành phố | chưa có dữ liệu | không SLO | completed (AC-2, AC-3, AC-4).
- Trục C — đơn vị: giờ dưới 48 | ngày từ 48 (AC-6).
- Trục D — tài liệu (AC-8).

## Out of scope

- Ops Portal trên cloud (Vercel): bảng thô `source_registry`/`stg_*`/`airbnb_snapshots` không lên cloud nên hai hàm này trên cloud là việc riêng.
- Đổi số SLO (AU4 đã chốt Hỏi-1) và fact `sourceRuns` mà `push-ops-facts.mjs` đẩy lên cloud.

## Notes

- Phép đo AC-2/3/5/7 chỉ ghi vào lược đồ tạm của chính nó trong DB local rồi xoá; không đụng bảng công khai.

- Known limits — chọn ở Cổng Bằng chứng 2026-10-24:
  - Ngoài-1: lưới nguồn trang Thu thập chưa có tab lọc cho «Chưa có dữ liệu» và «Chưa khai SLO» — tìm ở tab «Tất cả».
  - Ngoài-2: bộ kiểm của app nay cần DB local; máy không có DB thấy một ca đỏ, và ca mới ghi cứng địa chỉ DB.
  - Ngoài-4: phép đo cách viết tuổi trên /ops quét cả trang, chưa ghim vào ô của lưới.
  - Ngoài-5: ca tóm tắt x/y tự chép lại bộ chuyển của trang Thu thập thay vì gọi hàm thật.
  - Ngoài-7: thời điểm chạy gần nhất và số tin 24 giờ chỉ được kiểm ở giá trị rỗng.
