# Giờ Việt Nam trên cổng Ops (ON8 · `gio-ops-gio-vn`) — thiết kế

Hàng ON8 (`docs/plan/lo-trinh.json`, đợt `ops-noi-that-2410`, nhóm `ops-gio`). Câu giao: «Người vận hành đọc mọi mốc giờ
trên cổng Ops theo giờ Việt Nam có ghi múi, ngày gom theo giờ Việt Nam, và nguồn quá hạn hiện đúng mức trễ thay vì tuổi
bằng SLO». Gốc: OPS-7 (cắt chuỗi ISO UTC bằng `slice(0,16)`, lệch 7 tiếng; `getFlowDays` chia ngày UTC) và YC4 (AU6
Ngoài-3: `fmtAge` làm tròn xuống nên «8 ngày / SLO 8 ngày»). Hạng: T2 theo lộ trình; thành T3 nếu Hỏi-2 chọn sửa luôn
số đẩy lên cloud (`pipeline/push-ops-facts.mjs` thuộc `t3_paths`) — bản nháp theo khuyến nghị nên khai T3.

## 1. Hiện trạng (đọc mã 24/10, main dbd3d52)

DB local chạy múi `Etc/UTC`; cột thời gian là `timestamptz` (`listings.last_seen`, `source_registry.since/retired_at`
là `date`). Cloud (Vercel) cũng chạy UTC.

| Chỗ | Hiện tại | Người vận hành thấy |
|---|---|---|
| Mốc giờ trong bảng: `dq-checks-table` (`checked_at`), `jobs-grid` (`lastLogAt`), `feeds-grid` (`lastRunAt`), `pipe-panels` (vòng xoay `updatedAt`) | `iso.slice(0,16).replace("T"," ")` | giờ UTC không ghi múi — lịch 19:05 hiện 12:13 |
| `pipe-panels` sự kiện cuối cổng Kev (`funnel.lastEventAt`), `lockdown-grid` watchdog chạy cuối (`lastWatchdogAt`) | in nguyên chuỗi ISO | chuỗi máy, UTC |
| Mốc ngày: `objectives-grid`, `overview-tiles` (`lastSnapshotAt`), `quality-tables` (`capturedAt` ×2), `/ops/deals` (`firstSeen`) | `iso.slice(0,10)` | ngày UTC — mốc 00:00–07:00 giờ VN lùi một ngày |
| Luồng 7 ngày (`getFlowDays`) | SQL `col::date` (UTC) + khoá ngày JS `toISOString().slice(0,10)` + mốc `since` = bây giờ − 6×24h | tin 23:30 giờ VN… đúng ngày; tin 00:30 giờ VN rơi vào hôm trước; ngày cũ nhất thiếu nửa |
| Funnel cổng Kev «hôm nay» (`readGateFunnel`) | `todayKey` UTC | 0h–7h giờ VN đếm vào hôm qua |
| Số đẩy lên cloud (`push-ops-facts.mjs`: `zaloFlow`, funnel `today`) | `::date` UTC, `todayKey` UTC | cột Zalo trên cloud lệch ngày với các cột khác |
| Tuổi nguồn so SLO (`fmtAge` ở `objectives-grid`, `feeds-grid`, `overview-tiles`) | làm tròn xuống | 8,4 ngày / SLO 8 ngày hiện «8 ngày / 8 ngày» |
| Nhãn `sync-activity` | «(giờ máy)» | không nói rõ múi |

## 2. Thiết kế

1. **Một bộ định dạng chung** trong `app/src/lib/format.ts` (`VN_TZ = "Asia/Ho_Chi_Minh"`, `Intl.DateTimeFormat` có
   `timeZone` tường minh — không phụ thuộc múi máy chủ hay trình duyệt):
   - `fmtVnDateTime(v)` → `YYYY-MM-DD HH:MM (GMT+7)` (theo Hỏi-1, khuyến nghị giữ thứ tự ngày ISO đang dùng);
   - `fmtVnDate(v)` → `YYYY-MM-DD` theo ngày VN (mốc chỉ có ngày);
   - `vnDayKey(t)` → khoá ngày VN `YYYY-MM-DD`; `vnDayStart(key)` → thời điểm 00:00 giờ VN của ngày đó;
   - nhận `string | Date | number | null`; chuỗi kiểu Postgres `2026-10-23 12:13:45+00` và `date -Iseconds`
     (`…+07:00`) đọc được; chuỗi KHÔNG ghi múi hay không đọc được → «—» (không đoán theo múi máy).
2. **Mọi chỗ hiện mốc trên cổng Ops** gọi bộ định dạng (danh sách 11 chỗ ở §1, viết trước). Mốc kiểu `date` thuần
   (`since`, `retired_at`, `listings.last_seen`) giữ nguyên.
3. **Gom ngày theo giờ VN**: `getFlowDays(n, opts)` dùng `(col AT TIME ZONE 'Asia/Ho_Chi_Minh')::date`, mốc `since` =
   00:00 giờ VN của ngày cũ nhất, khoá ngày bằng `vnDayKey`; `readGateFunnel(opts)` đếm «hôm nay» theo ngày VN. Cả hai nhận
   `opts.now` để phép đo cố định thời điểm.
4. **Số đẩy lên cloud** (theo Hỏi-2, khuyến nghị làm luôn): `pipeline/lib/vn-day.mjs` (`VN_DAY_SQL(col)`, `vnDayKey`) và
   hàm dựng `zaloFlow` + funnel `today` tách khỏi `push-ops-facts.mjs` vào `pipeline/lib/` (tệp đó chạy `main()` khi nạp,
   phép đo không import được), `push-ops-facts.mjs` gọi lại chúng — để cột Zalo trên cloud cùng ngày VN với các cột
   khác. Bản pipeline và bản app đo chung một ma trận (khuôn ON2 `last-log-line`).
5. **Mức trễ** (theo Hỏi-3): `fmtOverdue(ageHours, sloHours)` trong `lib/freshness.ts` trả `null` khi chưa quá hạn,
   ngược lại «trễ N phút / N giờ / N ngày» (dưới 1 giờ → phút, dưới 48 giờ → giờ, còn lại → ngày; làm tròn xuống, tối
   thiểu 1). Chỗ hiện tuổi so SLO thêm mức trễ: «8 ngày · trễ 9 giờ».
6. Nhãn `sync-activity` «(giờ máy)» → «(ngày theo giờ VN)». Không đổi bố cục, component hay màu (chỉ đổi chữ).

## 3. Phép đo

- `app/tests/gio-ops-gio-vn.test.tsx`: ma trận định dạng viết trước, chạy dưới `TZ=UTC` và `TZ=America/New_York`; render
  thật (`renderToStaticMarkup`) từng component trong danh sách 11 chỗ với mốc `2026-10-23T12:13:00Z` → có
  `2026-10-23 19:13 (GMT+7)`, không có `12:13`; mốc ngày `2026-10-23T17:30:00Z` → `2026-10-24`. Thước tĩnh: không còn
  `slice(0, 16)` / `slice(0, 10)` trên mốc thời gian trong `src/components/ops`, `src/app/ops` (danh sách còn lại viết
  trước = rỗng), có chiều đỏ trên bản sao.
- `getFlowDays` trên lược đồ tạm trong DB local (bảng tạo bằng `CREATE TABLE … AS SELECT * FROM public.<bảng> WITH NO
  DATA` — đúng cột thật): tin 2026-10-23T16:30Z (23:30 VN) → ngày 2026-10-23; 17:30Z (00:30 VN) → 2026-10-24.
- `readGateFunnel` với `HOME` giả và tệp log giả, `now` cố định.
- `pipeline/scripts/vn-day.test.mjs`: cùng ma trận khoá ngày cho bản pipeline + SQL trên bảng tạm; thước tĩnh:
  `push-ops-facts.mjs` không còn `::date` thiếu `AT TIME ZONE`, không còn `todayKey` UTC.
- Mức trễ: ma trận `fmtOverdue` + render 3 chỗ với tuổi 8,4 ngày / SLO 8 ngày → «trễ 9 giờ»; tuổi 7 ngày → không «trễ».

## 4. Ngoài phạm vi

- Cổng Invest (`/vn/**`, `/listing/**` …) — hàng này chỉ cổng Ops.
- Ô KPI chỉ-đo-local và dòng «Số đo lúc HH:MM» trên cloud — ON3.
- Đổi múi giờ của DB hay máy chủ.
