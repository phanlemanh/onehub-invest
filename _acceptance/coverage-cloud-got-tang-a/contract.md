---
schema_version: 1
feature: /api/v1/ops/coverage trên máy chủ trả độ tươi từng nguồn S0x từ khối độ tươi máy thu đẩy lên (ADR-0014), có cờ tươi / cũ / chỉ đo ở máy thu, không trường nào chứa tên nguồn thật
slug: coverage-cloud-got-tang-a
owner: phanlemanh@gmail.com
risk_tier: T3      # lộ trình ghi hạng T3
surfaces: [api]
status: draft
design_doc: docs/superpowers/specs/2026-10-25-coverage-cloud-got-tang-a-design.md
lo_trinh_ma: AU12
---

# Acceptance Contract: coverage-cloud-got-tang-a

## Context

Trên máy chủ `/api/v1/ops/coverage` trả `200 { rows: [] }` vì `source_registry` (tầng A) vắng — máy đọc thấy «không
nguồn nào» thay vì «máy chủ không đo được». ADR-0014 chốt: máy chủ đọc khối số máy thu đẩy lên, không sync bản gọt của
registry. Trang `/ops` đã đọc khối `freshness` từ ON3; vòng này đưa route API về cùng nguồn số.

Căn cứ: docs/plan/lo-trinh.json AU12 (`cau_giao`, `bat_khi`, `ghi_chu`); docs/adr/0014-ops-cloud-doc-so-tong-hop.md (bảng
«Ngưỡng trễ», «Phương án đã loại» B); ON22 `ops-facts-so-tong-hop` (khối `freshness`, `FACTS_STALE_MS`); ON3 (`toCoverageRows`
dùng chung); AGENTS.md luật 6 (tên nguồn thật tầng A).

## Criteria

- AC-1 (cross-layer): Given lược đồ như máy chủ (không `source_registry`) và bản tin do `push-ops-facts` THẬT dựng đi qua
  handler ingest thật, When gọi route `GET /api/v1/ops/coverage` THẬT với `Authorization: Bearer <OPS_API_TOKEN>`, Then
  200, `source: "facts"`, `state: "fresh"`, `measuredAt` = `measured_at` của khối `freshness`, và `rows` bằng đúng
  `toCoverageRows(khối.rows)` — cùng tập (mã, thành phố) và cùng trạng thái từng hàng như bên ghi đo (không rỗng).
- AC-2: Given phản hồi của AC-1, AC-3 và AC-4, When quét MỌI khoá và giá trị chuỗi của JSON bằng danh sách tên nguồn thật
  = `real_name` của `source_registry` local cộng `real_name` của registry mà bên ghi đã đọc khi dựng bản tin (bộ dò tầng A
  của NT2; số tên quét ≥ 1, in ra), Then 0 chỗ trúng; đối chứng dương: cấy LẦN LƯỢT từng tên vào bản sao phản hồi thì bộ dò
  trúng đúng chỗ ấy mỗi lần.
- AC-3: Given cùng bản tin với `measured_at` của khối `freshness` lùi 46′, When gọi route, Then 200, `state: "stale"`,
  `measuredAt` là mốc cũ, `rows` vẫn mang số của khối (không bị xoá).
- AC-4: Given lược đồ như máy chủ ở bốn ca — không có bản tin · khối `freshness` lỗi ở bên ghi THẬT · bản tin thật gỡ khối
  `freshness` (khối vắng) · bản tin thật với `rows` của khối không phải mảng hay có hàng thiếu `code` (sai khuôn) — When gọi
  route, Then cả bốn ca 200 (không 500), `state: "none"`, `rows` theo Hỏi-2 (máy khuyên `null`, không `[]`),
  `measuredAt: null`, `note: "Chỉ đo ở máy thu"`. Khối tươi mà `rows` rỗng thật (máy thu đo được, không nguồn nào có SLO)
  → `state: "fresh"`, `rows: []` — đó là số đã đo.
- AC-5: Given lược đồ như máy chủ, When gọi route không token và không phiên, hay với token sai, Then 401 và thân không
  mang hàng độ tươi nào; với token đúng thì 200 (đối chứng dương).
- AC-6: Given DB máy thu đủ bảng, When gọi route, Then `source: "local"`, `state: "live"`, `rows` bằng
  `getCoverageOverview()` đo trực tiếp, và 0 truy vấn `ops_heartbeat`.
- AC-7 (judgment): Given thiết kế, route và các cờ phản hồi, When đối chiếu với ADR-0014 (Ngưỡng trễ, Phương án B đã loại)
  và luật 6, Then không đường nào trả danh sách rỗng hay số như thể đã đo khi máy chủ không có số, cờ cũ theo mốc của
  chính khối, và route không đọc bảng tầng A hay tệp cục bộ trên máy chủ.
- AC-8: Given kho, When `npx tsc --noEmit` + `npm run lint`, Then sạch.

## Coverage

Quét không gian tiêu chí ngay trong thiết kế theo các trục (dòng `approach` trong sổ):

- Trục trạng thái số trên máy chủ: tươi (AC-1) · tươi mà rỗng thật (AC-4) · cũ > 45′ (AC-3) · không bản tin · khối lỗi ·
  khối vắng · sai khuôn (AC-4) [thước CE: ADR-0014 §Ngưỡng trễ].
- Trục tầng dữ liệu: mọi khoá và giá trị chuỗi của phản hồi ở ba trạng thái (AC-2) [thước CE: AGENTS.md luật 6].
- Trục truy cập: không token · token sai · token đúng (AC-5).
- Trục môi trường: máy chủ (AC-1…AC-5) · máy thu (AC-6).
- Trục lớp đo: route thật (AC-1…AC-6) · chữ (AC-7) · tsc/lint (AC-8).

## Đường đo

- Ngưỡng «Gọi bằng token ops: 200» ← AC-1, AC-3, AC-4, AC-5.
- Ngưỡng «không trường nào chứa tên nguồn thật» ← AC-2.

## Out of scope

- Sync bản gọt của `source_registry` lên máy chủ — ADR-0014 phương án B đã loại.
- Trang `/ops`, `/ops/quality` (đã đọc khối từ ON3) — chỉ route API.
- Khối mới cho bản tin.

## Notes

- Chạy sau ON4 trên nhánh cắt từ main e6d5d02 (đã có #100). Không chạm `pipeline/push-ops-facts.mjs`.
