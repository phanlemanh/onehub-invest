---
schema_version: 1
feature: Người vận hành đọc mọi mốc giờ trên cổng Ops theo giờ Việt Nam có ghi múi, ngày gom theo giờ Việt Nam, và nguồn quá hạn hiện đúng mức trễ thay vì tuổi bằng SLO
slug: gio-ops-gio-vn
owner: phanlemanh@gmail.com
risk_tier: T3      # lộ trình T2; chạm pipeline/push-ops-facts.mjs (t3_paths) theo Hỏi-2 lối khuyến nghị
surfaces: [ui, cli]
status: implemented
approved_by: Mạnh
approved_at: 2026-10-24
design_doc: docs/superpowers/specs/2026-10-24-gio-ops-gio-vn-design.md
lo_trinh_ma: ON8
---

# Acceptance Contract: gio-ops-gio-vn

## Context

Hàng ON8 (OPS-7, YC4). Cổng Ops cắt chuỗi ISO UTC để hiện giờ (lệch 7 tiếng, không ghi múi), gom «ngày» theo UTC, và
`fmtAge` làm tròn xuống nên nguồn trễ 8,4 ngày với SLO 8 ngày hiện «8 ngày / SLO 8 ngày». Mọi mốc dùng trong tiêu chí
là cố định; «giờ VN» = `Asia/Ho_Chi_Minh` (GMT+7, không giờ mùa hè). Danh sách 11 chỗ hiện mốc trên cổng Ops viết trước
ở design doc §1. Hỏi-1…Hỏi-3 ở sổ quyết định; tiêu chí dưới viết theo lối khuyến nghị.

## Criteria

- AC-1: Given ma trận mốc viết trước — `2026-10-23T12:13:00Z`, `2026-10-23T16:59:00Z`, `2026-10-23T17:00:00Z`, `2026-10-23T17:30:00Z`, `2026-10-24T00:30:12+07:00` (khuôn `date -Iseconds` của watchdog), chuỗi Postgres `2026-10-23 12:13:45.123+00`, chuỗi KHÔNG ghi múi `2026-10-24 00:30:12`, đối tượng `Date`, số mili giây, `null`, chuỗi rác —, When gọi `fmtVnDateTime` và `fmtVnDate` dưới hai múi máy `TZ=UTC` và `TZ=America/New_York`, Then ra đúng giá trị viết trước (vd `2026-10-23 19:13 (GMT+7)`, `2026-10-24 00:00 (GMT+7)`, `2026-10-24 00:30 (GMT+7)` cho chuỗi `+07:00`, ngày `2026-10-24` cho 17:30Z; chuỗi không ghi múi, `null`, rác → «—»), giống nhau ở cả hai múi máy.
- AC-2: Given mỗi component trong danh sách 11 chỗ hiện mốc (bảng kiểm tra chất lượng, job, nguồn thu, vòng xoay, sự kiện cuối cổng Kev, watchdog chạy cuối, snapshot cuối ×2, ngày thu ×2, tin rao thấy lần đầu), When render thật với mốc `2026-10-23T12:13:00Z` (mốc giờ) hoặc `2026-10-23T17:30:00Z` (mốc ngày) ở đúng khuôn mà nguồn dữ liệu của chỗ đó trả (ISO `Z` của Node, `::text` của Postgres, `date -Iseconds` của watchdog), Then markup có `2026-10-23 19:13 (GMT+7)` hoặc ngày `2026-10-24` tương ứng, và không có `12:13` hay `2026-10-23T`.
- AC-3: Given cây `src/components/ops`, `src/app/ops`, các tệp `src/lib` mà cổng Ops dùng để dựng mốc (`ops-queries.ts`, `collections-queries.ts`, `freshness.ts`, `deals.ts`) và danh sách miễn viết trước (kèm lý do từng chỗ, vd tên tệp log theo ngày giờ máy của lockdown), When quét tĩnh `.slice(0, 10)`/`.slice(0, 16)` trên mốc, `toISOString().slice`, `toLocaleString`/`toLocaleDateString`/`toLocaleTimeString` không kèm `timeZone`, `.getHours(`/`.getDate(`, và SQL `::date`, `date_trunc(`, `to_char(` thiếu `AT TIME ZONE`, Then mọi chỗ khớp đều nằm trong danh sách miễn; chiều đỏ: ba bản sao — `jobs-grid.tsx` dùng lại `lastLogAt.slice(0, 16)`, một component thêm `toLocaleString("vi-VN")`, `collections-queries.ts` dùng lại `captured_at::date::text` — mỗi bản thước báo đúng tệp.
- AC-4: Given lược đồ tạm trong DB local có đủ bảng nguồn của luồng 7 ngày (tạo bằng `CREATE TABLE … AS SELECT * FROM public.<bảng> WITH NO DATA`, đúng cột và kiểu thật) và `search_path` CHỈ trỏ lược đồ tạm, ma trận viết trước mỗi cột thời gian của luồng có hai bản ghi lúc `2026-10-23T16:30:00Z` (23:30 VN) và `2026-10-23T17:30:00Z` (00:30 VN ngày 24) — riêng `listings.last_seen` (kiểu `date`) có hai ngày `2026-10-23`, `2026-10-24` —, cộng một tin lúc 00:10 giờ VN của ngày cũ nhất, `now` = `2026-10-24T05:00:00Z`, When gọi `getFlowDays(7, { now })`, Then kết quả bằng đúng bản đồ 7 khoá ngày VN viết trước (kết thúc `2026-10-24`) với số đếm từng cột từng ngày, kể cả các ngày bằng 0; chiều đỏ: thiếu một bảng tạm thì ca đỏ nêu tên bảng (không rơi về bảng thật).
- AC-5: Given `HOME` giả với tệp log cổng Kev có hai dòng sinh bằng đúng khuôn của hook (`new Date(t).toISOString()` + nội dung, `collector/openclaw/handler.js`) lúc `2026-10-23T17:30:00Z` (00:30 VN ngày 24) và `2026-10-23T16:30:00Z` (23:30 VN ngày 23), `now` = `2026-10-24T05:00:00Z`, When gọi `readGateFunnel({ now })` dưới `TZ=UTC` và `TZ=America/New_York`, Then «hôm nay» đếm đúng dòng 17:30Z, không đếm dòng 16:30Z, ở cả hai múi máy.
- AC-6: Given hàm dựng số Zalo theo ngày và funnel «hôm nay» của số đẩy lên cloud — tách khỏi `push-ops-facts.mjs` vào `pipeline/lib/` để gọi được mà không chạy `main()` — và lược đồ tạm có cùng hai tin Zalo/tin rao của AC-4, When gọi chúng với `now` = `2026-10-24T05:00:00Z`, Then `zaloFlow` có đúng khoá `2026-10-23` và `2026-10-24` với số đếm viết trước, funnel «hôm nay» đếm theo ngày VN, và `vnDayKey` bản pipeline ra đúng khoá ngày như bản app trên ma trận khoá ngày của AC-1; `push-ops-facts.mjs` gọi các hàm đó và không còn `::date`, `date_trunc(`, `to_char(` thiếu `AT TIME ZONE` hay `toISOString().slice(0, 10)`; chiều đỏ: bản sao dùng lại `captured_at::date::text` → thước báo.
- AC-7: Given ma trận tuổi/SLO viết trước — (8,4 ngày; 8 ngày) → «trễ 9 giờ», (SLO + 30 giây; SLO) → «trễ 1 phút», (SLO + 59 phút) → «trễ 59 phút», (SLO + 60 phút) → «trễ 1 giờ», (SLO + 47 giờ 59 phút) → «trễ 47 giờ», (SLO + 48 giờ) → «trễ 2 ngày», (SLO + 3 ngày 5 giờ) → «trễ 3 ngày», (30 giờ; 24 giờ) → «trễ 6 giờ», (tuổi = SLO) → `null`, (7 ngày; 8 ngày) → `null`, (tuổi `null`) → `null` —, When gọi `fmtOverdue`, Then đúng 11 giá trị viết trước.
- AC-8: Given nguồn trễ 8,4 ngày với SLO 8 ngày, nguồn có tuổi đúng bằng SLO, và nguồn 7 ngày với SLO 8 ngày, When render thật bảng mục tiêu, bảng nguồn thu và ô «Nguồn cũ nhất» của tổng quan, Then nguồn trễ hiện «trễ 9 giờ» cạnh tuổi; nguồn nào mang trạng thái quá hạn (`status: "stale"`) thì có chữ «trễ», nguồn không quá hạn thì không — không còn cặp «8 ngày / 8 ngày» không kèm mức trễ.
- AC-9: Given vùng «Luồng 7 ngày», When render, Then mô tả nói ngày theo giờ VN («ngày theo giờ VN»), không còn «(giờ máy)».
- AC-10: Given tệp log cổng Kev có một dòng mốc hỏng (`2026-10-23T99:99:99.000Z post 202 …`) và một dòng cắt cụt chỉ còn tiền tố ngày (`2026-10-23T`), xen giữa hai dòng hợp lệ của AC-5, When gọi `parseLog` bản pipeline (bên ghi số đẩy lên cloud) và `readGateFunnel` bản app với cùng `now`, Then cả hai không ném lỗi, bỏ qua dòng hỏng và đếm đúng như AC-5 (hôm nay 1, 7 ngày 2); chiều đỏ: bản sao `ops-flow.mjs` bỏ bước chặn mốc không hợp lệ → `parseLog` ném lỗi và ca đỏ nêu «mốc hỏng». (Bổ sung ở Cổng Bằng chứng 24/10 — Ngoài-1, Mạnh chọn nâng phạm vi sửa ngay.)

## Coverage

Bỏ quét hình thái — xem dòng `bỏ coverage-scan` trong sổ. Trục: {định dạng mốc (AC-1), mọi chỗ hiện mốc (AC-2 + thước
AC-3)} · {gom ngày: luồng 7 ngày local (AC-4), funnel hôm nay (AC-5), số đẩy lên cloud (AC-6)} · {mức trễ: hàm (AC-7),
chỗ hiện (AC-8)} · nhãn múi (AC-9) · dòng log hỏng ở bên ghi và bên đọc funnel (AC-10). Biên giờ: 16:59Z/17:00Z (nửa đêm VN), 00:10 VN ngày cũ nhất, chuỗi có `+07:00`, chuỗi không ghi múi;
biên trễ: 30 giây, 59/60 phút, 47 giờ 59 phút/48 giờ, trên 3 ngày, tuổi bằng SLO, chưa trễ, không có tuổi.

## Đường đo

- «Mốc 2026-10-23T12:13Z hiện «19:13 (GMT+7)» ở mọi bảng Ops» — render thật 11 chỗ trong `app/tests/gio-ops-gio-vn.test.tsx`
  + thước tĩnh · AC-1, AC-2, AC-3.
- «tin lúc 23:30 giờ VN rơi vào đúng ngày VN» — `getFlowDays` trên lược đồ tạm DB local, funnel với log giả, bản pipeline
  · AC-4, AC-5, AC-6.
- «nguồn trễ 8,4 ngày với SLO 8 ngày hiện mức trễ» — ma trận `fmtOverdue` + render 3 chỗ · AC-7, AC-8.

## Out of scope

- Cổng Invest (`/vn/**`, `/listing/**`, …) — hàng này chỉ cổng Ops.
- Ô KPI chỉ-đo-local, dòng «Số đo lúc HH:MM (giờ VN)» và cảnh báo số cũ trên cloud — ON3.
- Đổi múi giờ của DB hay máy chủ; mốc kiểu `date` thuần (`since`, `retired_at`, `listings.last_seen`).
- Đo đầu-cuối «số Zalo đẩy lên → nhánh cloud của `getFlowDays`» trên một DB mô phỏng cloud: AC-6 đo bên ghi thật
  trên lược đồ tạm và AC-4 đo bên đọc local; khớp hai bên dựa trên cùng ma trận khoá ngày (hạn chế có tên).

## Notes

- Phép đo DB chỉ tạo/xoá lược đồ tạm riêng của test; không ghi bảng thật trên DB local dùng chung.
- Phép đo funnel đọc log giả trong `HOME` tạm; không đọc `~/.openclaw` thật.
- Known limits — chọn ở Cổng Bằng chứng 2026-10-24:
  - Ngoài-2: ca mức trễ dùng tuổi và trạng thái nhập tay, chưa đi qua bước tính độ tươi thật; nếu sau này đổi cách làm tròn hay cách xét quá hạn mà nhãn «trễ» sai thì phép đo không báo.
