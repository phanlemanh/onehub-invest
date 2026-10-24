---
schema_version: 1
feature: Ô KPI ba trang Ops trên cloud đọc số máy local đẩy lên kèm mốc đo giờ VN; không có số thì «—» và «Chỉ đo ở máy local» một lần; số cũ quá 45′ thì báo, không badge xanh
slug: o-kpi-chi-do-local
owner: phanlemanh@gmail.com
risk_tier: T2
surfaces: [ui, docs]
status: signed-off
design_doc: docs/superpowers/specs/2026-10-24-o-kpi-chi-do-local-design.md
approved_by: Mạnh
approved_at: 2026-10-24
---

# Acceptance Contract: o-kpi-chi-do-local

## Context

Trên cloud, `/ops`, `/ops/collections`, `/ops/review` không có bảng tầng A nên vẽ «Quá hạn 0» xanh, «Bản ghi 24h 0» khi dữ
liệu vẫn chảy, và lặp chữ «chỉ đo ở local» (OPS-4, OPS-5, OPS-20, YC6, QD2a — gốc G2). Từ ON22 máy local đã đẩy năm khối số
có mốc đo và có hàm đọc `readOpsFacts()`. Vòng này cho ô KPI ba trang đọc khối số ấy, hiện mốc đo giờ VN, nói rõ khi không
có số hay số đã cũ. Thứ tự (giám sát duyệt P2-31): bản bấm được và code sau khi ON8 `gio-ops-gio-vn` merge.

Căn cứ: docs/plan/lo-trinh.json ON3 (`bat_khi`, `ghi_chu`); docs/adr/0014-ops-cloud-doc-so-tong-hop.md (bảng «Trang nào
đọc gì», «Ngưỡng trễ»); ON22 `ops-facts-so-tong-hop` (khối số, `readOpsFacts`).

## Criteria

- AC-1: Given lược đồ như cloud (không `source_registry`, không `review_queue`) và không có dòng `ops_heartbeat`, When dựng
  `/ops`, `/ops/collections`, `/ops/review`, Then mỗi trang có đúng một chỗ chữ chỉ-local — đếm mọi biến thể «chỉ đo/chỉ có
  ở (máy) local», hoa thường như nhau, kể cả stats của PageHeader và chân ô — ghim nguyên văn: `/ops` và `/ops/collections`
  «Chỉ đo ở máy local», `/ops/review` «Hàng chờ duyệt chỉ có ở máy local»; không ô KPI nào hiện số 0 hay badge `success`, ô
  không có số hiện «—».
- AC-2: Given bản tin do `push-ops-facts` THẬT dựng (qua handler ingest thật) còn tươi, When dựng `/ops`, Then bốn ô KPI
  hiện đúng số tính từ khối `freshness` (Đạt SLO x/y bằng `summarizeFreshness` trên hàng của khối, Quá hạn, Chưa có
  snapshot, Snapshot mới nhất) và dòng «Số đo lúc HH:MM (giờ VN) từ máy local» với HH:MM là `measured_at` của khối theo giờ VN.
- AC-3: Given cùng bản tin, When dựng `/ops/collections`, Then ô «Bản ghi 24h» bằng tổng khối `records24h`, ô «Sức khoẻ
  nguồn» bằng x/y của khối `freshness`, có dòng mốc đo, và ô Lockdown hiện theo Hỏi-1 (máy khuyên: «—» kèm badge
  `warning-light` «Chưa kiểm được trên cloud», không xanh, không dải «Hỏng» giả) tới khi ON23 đọc khối `lockdown`.
- AC-4: Given bản tin do `push-ops-facts` THẬT dựng, đẩy qua handler ingest thật với mốc đã lùi 46′, When dựng `/ops` và `/ops/collections`, Then mỗi trang có đúng một Alert cảnh báo
  «Máy local không đẩy số từ HH:MM (giờ VN)», số vẫn hiện nhưng mờ, 0 badge `success`; Alert «Máy thu có thể offline» 30′
  cũ không còn.
- AC-5: Given `review_queue` local có thẻ `pending` và thẻ đã quyết thuộc ≥ 2 loại, bản tin do `push-ops-facts` THẬT dựng
  qua handler ingest thật, When dựng `/ops/review` ở chế độ cloud, Then «N thẻ đang chờ» với N bằng phép đếm SQL thẻ
  `pending` của bảng local và từng loại bằng phép đếm theo `item_type`, cạnh đúng một chỗ chữ chỉ-local; không có số thì «—».
- AC-6: Given bản tin do `push-ops-facts` THẬT dựng trên lược đồ hỏng có chủ ý (khối `freshness`, `records24h` hay
  `reviewQueue` ra lỗi ở bên ghi — không viết tay khối lỗi), When dựng trang đọc khối
  đó, Then ô tương ứng hiện «—» kèm «Chưa có số», không 0, không badge xanh.
- AC-7: Given DB local đủ bảng (`source_registry`, `review_queue` có mặt), When dựng ba trang, Then trang đo trực tiếp như
  trước — không dòng mốc đo, không Alert số cũ, không đọc `ops_heartbeat`.
- AC-8 (judgment): Given bảng trạng thái của đặc tả UX và chữ ba trang ở ba trạng thái, When đối chiếu với ADR-0014 §Ngưỡng
  trễ và `bat_khi` ON3, Then chữ đúng: «Số đo lúc …», «Máy local không đẩy số từ …», «Chỉ đo ở máy local» một lần; không
  chữ trấn an khi không đo được.
- AC-9: Given lint UI của kho, When `npm run lint` + `npm run test:lint-rules`, Then sạch — không màu thô, không chữ dưới
  `text-xs`, không tự vẽ khung (luật onehub-ui).
- AC-10: Given dev server chạy với lược đồ như cloud ở ba trạng thái (không có / tươi / cũ 46′), When mở ba trang, Then mỗi
  dòng `ST-…` của bảng trạng thái có ít nhất một khung mang đúng tên ấy, khung tối và khung 390px ghi rõ trang và trạng thái,
  và cả ba trang không có thanh cuộn ngang ở 390px.

## Coverage

Bỏ quét hình thái: phạm vi đã chốt ở ADR-0014 (bảng trang → nguồn số, ba mức trễ) và `bat_khi` ON3 — dòng `descope` «bỏ
coverage-scan» trong sổ. Trục:

- Trục trang: `/ops` (AC-2, AC-4) · `/ops/collections` (AC-3, AC-4) · `/ops/review` (AC-5) — đủ ba trang của `cau_giao`.
- Trục trạng thái số: không có (AC-1) · tươi (AC-2, AC-3, AC-5) · cũ > 45′ (AC-4) · khối lỗi (AC-6) [thước CE: ADR-0014
  §Ngưỡng trễ, ba mức + khối lỗi của ON22].
- Trục môi trường: cloud (AC-1…AC-6) · local (AC-7).
- Trục lớp: HTML render (AC-1…AC-7) · ảnh chụp sáng/tối/hẹp (AC-10) · chữ (AC-8) · lint (AC-9).

## Đường đo

- Ngưỡng «Không facts: 0 ô KPI xanh hay số 0, chữ chỉ-local một lần mỗi trang» ← AC-1.
- Ngưỡng «facts tươi: ô hiện đúng số của khối và mốc đo giờ VN» ← AC-2, AC-3.
- Ngưỡng «facts cũ 46′: Alert, 0 badge xanh» ← AC-4.
- Ngưỡng «/ops/review cloud: N thẻ đang chờ bằng số đếm ở local» ← AC-5.

## Out of scope

- Lưới và ô Lockdown đọc khối `lockdown` — ON23.
- Lưới job, luồng 7 ngày, nhóm S03 trên cloud — ON4/ON5.
- `/api/v1/ops/coverage` — AU12; bộ định dạng giờ VN — ON8.
- `/ops/quality`, `/ops/deals`, `/ops/sources` — không đổi.

## Notes

- Chung `components/ops/collections/collections-tiles.tsx` với ON7, `overview-tiles.tsx` với UI11 — không song song.
- Phụ thuộc ON8 (giờ VN, `lib/freshness.ts`): S1-D và S3 sau khi ON8 merge (P2-31).
- Nhãn sau khi gộp main có ON12 (2026-10-25, giám sát quyết — sửa tích hợp, không đổi hành vi): chữ trong các AC đọc theo
  `CONTEXT.md` — «máy local» là «máy thu», «cloud» là «máy chủ», «Lockdown» là «Khoá an toàn», «Hàng chờ duyệt chỉ có ở
  máy local» là «Hàng duyệt chỉ có ở máy thu»; «kiểm cloud-sync» là «kiểm tác vụ đồng bộ». Test và tiêu chí ghim chữ mới.
- Known limits — chọn ở Cổng Bằng chứng 2026-10-25:
  - Ngoài-5: Phép đo «không chữ trạng thái giả» trên trang Thu thập ở cloud chưa có ca đối chứng có chữ giả thật.
  - Ngoài-6: Mục ghi về hàm đọc bảng thô vắng thành rỗng — hàm này đã gỡ ở lượt 3, giữ dòng để vết.
  - Ngoài-7: Bản dựng thử «như cloud» giữ tên bảng hiệu chuẩn cũ và để mọi bảng rỗng, nên ảnh bằng chứng có thể khác trang cloud thật ở vài bảng.
  - Ngoài-9: Phép đo «không câu trấn an trên số cũ» chưa có ca fixture sinh ra câu ấy.
  - Ngoài-10: Tên ca kiểm trong hồ sơ tiêu chí lệch tên ca chạy thật ở vài chỗ.
  - Ngoài-12: Phép đo «trang ở máy local không đọc bản tin» chưa chứng minh bộ bắt truy vấn bắt được truy vấn ấy.
  - Ngoài-13: Bản tin sai khuôn từ máy local có thể làm sập trang tổng quan Ops trên cloud thay vì hiện «—».
  - Ngoài-14: Một khối số đã cũ nằm trong bản tin còn mới vẫn hiện như số tươi.
  - Ngoài-15: Khi số theo nguồn không đọc được, ô Bản ghi 24h có thể kèm chú thích «chưa có bản ghi» mâu thuẫn với số.
  - Ngoài-17: Tổng Bản ghi 24h có thể đếm hai lần bản ghi của luồng Zalo.
  - Ngoài-18: Phép đo «hai trang cùng một con số x/y» mới thử trên dữ liệu rỗng.
  - Ngoài-19: Mục ghi về test lắp props tay — test đã dựng trang thật ở lượt 2–3, giữ dòng để vết.
  - Ngoài-20: Tên ca kiểm trong hồ sơ tiêu chí lệch tên ca chạy thật ở vài chỗ (ghi từ lượt 1).
