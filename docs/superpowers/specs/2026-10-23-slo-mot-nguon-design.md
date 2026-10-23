# Một số SLO cho hai trang Ops (AU6 · `slo-mot-nguon`) — thiết kế

Hàng AU6 (`docs/plan/lo-trinh.json`, đợt `cam-mau-2310`, T2, dựng trên AU4). Câu giao: «Người vận hành thấy cùng một số
SLO trên /ops và /ops/collections». Gốc: audit 23/10 L14 — hai trang mâu thuẫn (4/14 đạt vs 5/6 nguồn).

## 1. Vì sao hai trang lệch (đọc mã 23/10, sau khi AU4 vào `main`)

| | `/ops` (Tổng quan) | `/ops/collections` (Thu thập) |
|---|---|---|
| Hàm | `getCoverageOverview` (`app/src/lib/ops-queries.ts`) | `getSourceFeedHealth` (cùng tệp) |
| Đơn vị đếm | ô nguồn × thành phố | nguồn |
| Bảng SLO | `SLO_DAYS` S01 8 · S02 35 · S03 3 · S04 90 ngày (không có S05/S06) | hằng cục bộ S01 36 · S02 36 · S03 2 · S05 12 · S06 36 giờ |
| Giờ đo | `max(airbnb_snapshots.collected_at)` theo `source, city` — S03/S05 chung một nguồn thu nên không tách được | `max(collected_at)` theo nguồn thu đã ghép tay (`SNAP_OF`) |
| Nguồn chưa có dữ liệu | «Chưa có» | «Ổn» (vì `freshnessHrs` null không bị coi là trễ) |

AU4 đã chốt định nghĩa duy nhất ở `scripts/lib/freshness.mjs` (bảng nạp thật từng mã, giờ thu, tách S03/S05 theo
`agent_id`, SLO theo giờ S01 192 · S02 840 · S03 72 · S05 12 · S06 36, S04 không đo) và tự ghi «về sau `/ops` (AU6)
dùng chung một con số». Hai trang chưa dùng nó.

## 2. Thiết kế

1. **Một định nghĩa trong app**: `app/src/lib/freshness.ts` — bản TypeScript thuần (không import lúc chạy) của
   `scripts/lib/freshness.mjs`: `SLO_HOURS`, `TIME_SOURCE`, `PROBES`, `readFreshness(client)`. Thêm:
   - `summarizeFreshness(rows)` → `{ ok, total, byCode }`: một nguồn **đạt** khi mọi thành phố có dữ liệu của nó tươi;
     nguồn quá hạn ở ít nhất một thành phố, hay chưa có dữ liệu, là không đạt; `total` = nguồn active có SLO (S04 xong
     rồi không đếm) — theo khuyến nghị Hỏi-1.
   - `fmtAge(hours)`: dưới 48 giờ «N giờ», từ 48 giờ «N ngày» — một bộ định dạng cho cả hai trang.
2. **Giữ hai bản khớp nhau bằng phép đo**, không bằng import chéo: test so từng hằng, từng câu SQL và đầu ra của hai
   `readFreshness` trên cùng một client giả; bản sao TS bị đổi một SLO → ca đỏ gọi tên mã.
3. **`/ops`**: `getCoverageOverview()` = hàng của `readFreshness(pool)` (thêm `ageHours`, `sloHours`; giữ `ageDays` =
   floor(ageHours/24), `sloDays` = sloHours/24 cho máy đọc cũ của `/api/v1/ops/coverage`). Ô «Đạt SLO» và đầu trang in
   `x/y nguồn đạt SLO` từ `summarizeFreshness`; lưới vẫn từng ô nguồn × thành phố, cột tuổi/SLO qua `fmtAge`.
4. **`/ops/collections`**: `getSourceFeedHealth()` lấy `freshnessHrs`/`sloHours` từ cùng hàng (tuổi lớn nhất trong
   các thành phố của nguồn) và thêm trạng thái độ tươi; `feedState` có thêm «Chưa có dữ liệu» (không còn «Ổn» khi
   không có dữ liệu). Ô «Sức khoẻ nguồn» in cùng `x/y nguồn đạt SLO`. `page.tsx` chỉ tải dữ liệu rồi truyền vào `CollectionsView` (phần hiển thị tách ra `components/ops/collections/collections-view.tsx`) để phép đo render trọn trang. Mã active chưa khai SLO: «Chưa khai SLO», không tính vào `y`, không có hàng ở lưới `/ops`. `lastRunAt`/`items24h` (lần chạy gần nhất, bản
   ghi 24 giờ) giữ nguyên nghĩa — đó là hoạt động thu, không phải độ tươi.
5. Ô tóm tắt hai trang mang `data-slo-summary="x/y"` để phép đo đọc HTML thật thay vì so chữ.

**Hỏi-1** (chỉ Mạnh quyết — nghĩa của con số người vận hành thấy): (A, khuyên) cả hai trang đếm **theo nguồn** — `x/y
nguồn đạt SLO`, nguồn đạt khi mọi thành phố của nó đạt; lưới `/ops` vẫn chi tiết từng thành phố. (B) cả hai đếm **theo ô
nguồn × thành phố** — `/ops/collections` phải thêm chiều thành phố vào lưới nguồn; số lớn hơn (như 14) và khác cách
trang Thu thập đang kể chuyện theo nguồn.

## 3. Phép đo

- `scripts/freshness-parity.test.mjs` (Node 24 nạp tệp TS thuần trực tiếp): hằng + SQL + đầu ra trên client giả theo
  ma trận 5 mã × {tươi, quá hạn, chưa có} + mã active không SLO; chiều đỏ: bản sao TS đổi SLO S03.
- `app/tests/slo-mot-nguon.test.tsx`: lược đồ tạm trong DB local (`LIKE public.x INCLUDING ALL`, `search_path` qua
  `DATABASE_URL`) — gọi `getCoverageOverview`, `getSourceFeedHealth` thật, so với `readFreshness` của
  `scripts/lib/freshness.mjs` trên cùng lược đồ; render ô hai trang + trang `/ops`, đọc `data-slo-summary`; ma trận
  tóm tắt viết trước; chiều đỏ: một thành phố của S01 quá hạn → cả hai ô cùng giảm 1; bản nạp lại (captured_at mới,
  collected_at cũ) vẫn quá hạn.
- Route `/api/v1/ops/coverage` gọi thẳng handler với bearer token thử.

6. **Cloud giữ nguyên**: trên cloud bảng thô có mặt mà 0 dòng (leak gate) — `source_registry` rỗng nên hai hàm ra mảng rỗng, tóm tắt `0/0` «Chưa có nguồn nào», y như trước vòng (AC-9). Số độ tươi thật cho cloud là việc riêng.

## 4. Ngoài phạm vi

Ops Portal trên cloud (Vercel): `source_registry`/`stg_*`/`airbnb_snapshots` không lên cloud (`pipeline/sync-cloud.mjs`)
nên hai hàm này trên cloud là việc riêng · đổi số SLO (AU4 đã chốt) · fact `sourceRuns` do `push-ops-facts.mjs` đẩy mà app
chưa đọc.

## Đặc tả UX

Không đổi cấu trúc trang, chỉ số và chữ trong các ô có sẵn — bỏ (sổ: «bỏ đặc-tả-UX»).
