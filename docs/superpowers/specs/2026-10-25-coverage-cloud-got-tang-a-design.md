# `/api/v1/ops/coverage` trên máy chủ đọc khối độ tươi (AU12 · `coverage-cloud-got-tang-a`) — design

Hàng AU12 của `docs/plan/lo-trinh.json` (dãy P2, sau ON4; hạng T3). Ngưỡng (`bat_khi`): «Gọi bằng token ops: 200, không
trường nào chứa tên nguồn thật». Ghi chú hàng: ADR-0014 loại phương án sync bản registry gọt (B) — route đọc khối độ tươi
của ON22; slug giữ tên cũ; số cũ quá 45′ trả cờ cũ; thiếu số trả cờ «chỉ đo ở máy thu». Từ vựng theo `CONTEXT.md`: máy
thu / máy chủ.

## Hiện trạng

- Route `app/src/app/api/v1/ops/coverage/route.ts` gọi `getCoverageOverview()`. Audit P2 (ô cơ hội) thấy 500 vì route
  truy vấn `source_registry` trên máy chủ; từ khi `getCoverageOverview` dừng sớm qua `freshnessLocalOnly()` (sự cố prod
  24/10), route trả `200 { rows: [] }`. Máy đọc (audit-all, smoke) thấy 200 và một danh sách rỗng — không phân biệt được
  «không có nguồn nào» với «máy chủ không đo được».
- Trang `/ops` trên máy chủ đã đọc khối `freshness` qua `getCloudOpsView().coverage` (ON3) — cùng phép chuyển
  `toCoverageRows` với máy thu. Route API là bề mặt máy duy nhất còn đi đường cũ.

## Cách làm

1. **Máy chủ** (`freshnessLocalOnly()` đúng): route đọc `readOpsFacts()` và trả
   `{ generatedAt, source: "facts", state, measuredAt, rows, note? }`:
   - khối `freshness` có số → `rows = toCoverageRows(block.rows)` (cùng phép chuyển của `/ops`), `state` = trạng thái
     CỦA KHỐI (`fresh` ≤ 45′, `stale` > 45′ — `FACTS_STALE_MS` của ON22), `measuredAt` = `measured_at` của khối;
   - không bản tin, khối vắng, khối lỗi hay sai khuôn → `state: "none"`, `rows: null` (Hỏi-2, máy khuyên null),
     `measuredAt: null`, `note: "Chỉ đo ở máy thu"` — không bao giờ một danh sách rỗng như thể đã đo; sai khuôn không
     được thành 500;
   - khối tươi mà `rows` rỗng thật → `state: "fresh"`, `rows: []` (số đã đo).
   - Chế độ máy chủ / máy thu suy từ lược đồ như trên prod (`freshnessLocalOnly()`), phép đo không giả lập nó.
2. **Máy thu**: như hôm nay đo trực tiếp, thêm `source: "local"`, `state: "live"`, `measuredAt = generatedAt` — không đọc
   `ops_heartbeat`.
3. **Không tên nguồn thật**: route chỉ trả trường của `CoverageRow` (mã S0x, thành phố, mốc, giờ, SLO, trạng thái) và
   các cờ trên — không chép nguyên khối hay bản tin. Phép đo quét MỌI giá trị chuỗi của phản hồi bằng danh sách tên thật
   của `source_registry` local (bộ dò của NT2).
4. Auth giữ nguyên: session ops hoặc `Bearer OPS_API_TOKEN`; thiếu → 401.
5. `app/src/lib/api-surface.ts` ghi chú route; `docs/ops/runtime-map.md` một dòng.

## Không làm

- Sync bản gọt của `source_registry` lên máy chủ — ADR-0014 phương án B đã loại.
- Đổi trang `/ops` hay `/ops/quality` (đã đọc khối từ ON3) — chỉ route API.
- Thêm khối mới cho bản tin — khối `freshness` của ON22 đã đủ.
