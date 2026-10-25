---
schema_version: 1
feature: Trên máy chủ, ô và lưới Khoá an toàn đọc khối lockdown máy thu đẩy lên; không có số thì 8/8 lớp «Chỉ kiểm ở máy thu», không lớp nào xanh; Kev gate và collector API ở Máy móc cùng trạng thái với Khoá an toàn
slug: lockdown-cloud-theo-facts
owner: phanlemanh@gmail.com
risk_tier: T3      # lộ trình ghi T3 (an toàn Zalo); tệp dự kiến không khớp t3_paths — máy suy T2, Hỏi-2
surfaces: [ui]
status: approved
design_doc: docs/superpowers/specs/2026-10-25-lockdown-cloud-theo-facts-design.md
approved_by: Mạnh
approved_at: 2026-10-25
lo_trinh_ma: ON23
---

# Acceptance Contract: lockdown-cloud-theo-facts

## Context

Sau ON3, `/ops/collections` trên máy chủ không dựng lưới «Khoá an toàn & hạ tầng thu» và ô «Khoá an toàn» luôn «—», dù bản
tin máy thu đã mang khối `lockdown` từ ON22. Lưới Máy móc trên máy chủ đọc khoá `jobs` cũ, dò Kev gate và collector API
bằng URL khác với khối `lockdown`, nên hai bảng cùng trang có thể nói hai trạng thái cho cùng một cổng (OPS-3, cao — an
toàn Zalo; gốc G1 + G2). Vòng này cho ô và lưới Khoá an toàn đọc khối `lockdown`, và cho hai hàng Kev gate / collector API
của Máy móc lấy trạng thái từ cùng khối ấy.

Căn cứ: docs/plan/lo-trinh.json ON23 (`cau_giao`, `bat_khi`, `ghi_chu`); docs/adr/0014-ops-cloud-doc-so-tong-hop.md (bảng
«Trang nào đọc gì», «Ngưỡng trễ»); ON22 `ops-facts-so-tong-hop` (khối `lockdown`); ON2 `lockdown-local-noi-that` (lớp không
kiểm được = `null`, không bao giờ «Ổn»); ON3 `o-kpi-chi-do-local` (nhánh máy chủ của trang, Hỏi-1 = A); CONTEXT.md (máy
thu, máy chủ, Khoá an toàn).

## Criteria

- AC-1: Given lược đồ như máy chủ (không `source_registry`) và không có dòng `ops_heartbeat`, When dựng trang
  `/ops/collections` thật ở chế độ máy chủ, Then lưới «Khoá an toàn & hạ tầng thu» có đúng 8 hàng, đúng 8 cặp lớp + mô tả
  của `getLockdownStatus`, mỗi hàng trạng thái «Chỉ kiểm ở máy thu» với màu theo Hỏi-3; 0 badge `success` và 0 tô màu đạt trong lưới và ô
  «Khoá an toàn»; ô «Khoá an toàn» hiện «—» kèm «Chưa kiểm được trên máy chủ».
- AC-2: Given bản tin do `push-ops-facts` THẬT dựng mà khối `lockdown` ra lỗi ở bên ghi (không viết tay khối lỗi), đẩy qua
  handler ingest thật, When dựng trang, Then lưới và ô «Khoá an toàn» theo Hỏi-4 (máy khuyên: như AC-1 — 8/8 «Chỉ kiểm ở máy
  thu», ô «—»), 0 lớp xanh, còn các ô đọc khối khác vẫn hiện số của khối mình.
- AC-3: Given bản tin THẬT còn tươi với khối `lockdown` có đủ ba giá trị lớp (`true`, `false`, `null`) và
  `agentTurnsToday` = 2 (tệp nhật ký tạm có 2 dấu `auto-reply/agent-turn-timing`), When dựng trang, Then lưới có đúng các
  hàng của khối với nhãn «Ổn» / «Hỏng» / «Chưa kiểm được» theo `ok`, mô tả lưới «Bộ canh chạy cuối: …» theo
  `lastWatchdogAt` giờ VN; số trên từng tab của lưới (Hỏng / Chưa kiểm được / Ổn) = số lớp `false` / `null` / `true` của
  khối; ô «Khoá an toàn» = số lớp `true` / 8 kèm badge «2 lượt tự trả lời».
- AC-4: Given cùng bản tin với mốc đo của khối lùi 46′, When dựng trang, Then mọi hàng giữ nhãn của khối nhưng 0 badge
  `success-light` (hàng «Ổn» viền xám), ô «Khoá an toàn» số mờ, thanh phân đoạn không tô màu đạt; hàng `kev` và
  `collector-api` của Máy móc giữ nhãn đọc từ khối nhưng 0 badge `success-light`.
- AC-5 (cross-layer): Given bản tin THẬT rút từ `push-ops-facts`, với lớp «Cổng Kev :8009» và «Cổng nhận tin :9210» của
  khối `lockdown` lần lượt mang `ok` ∈ {true, false, null} (ma trận 3 × 2 viết trước, chỉ đổi `ok` của bản tin thật), When
  dựng trang, Then hàng `kev` và `collector-api` của lưới Máy móc mang đúng «Sống» / «Không phản hồi» / «Chưa kiểm được»
  tương ứng — bất kể khoá `jobs` cũ của bản tin nói gì; trong một ca chéo (Kev `true`, collector `false` và ca đảo lại)
  mỗi hàng mang đúng giá trị lớp của cổng mình; không khối `lockdown` → hai hàng «Chưa kiểm được».
- AC-6: Given DB máy thu đủ bảng (`source_registry` có mặt), When dựng `/ops/collections`, Then lưới Khoá an toàn lấy từ
  `getLockdownStatus` như trước — không chữ «Chỉ kiểm ở máy thu», không đọc `ops_heartbeat`.
- AC-7 (judgment): Given bảng trạng thái của đặc tả UX, chữ thật của lưới, ô và Máy móc, When đối chiếu với ADR-0014,
  CONTEXT.md và `bat_khi` ON23, Then chữ đúng nhãn («Chỉ kiểm ở máy thu», «Chưa kiểm được», «Khoá an toàn», máy thu /
  máy chủ) và không lớp nào hiện «Ổn» hay màu xanh khi không kiểm; riêng lưới Khoá an toàn, `bat_khi` ON23 (8/8 hàng ghi «Chỉ
  kiểm ở máy thu») thắng luật «chữ chỉ-local đúng một lần mỗi trang» của ADR-0014 (luật ấy nói về thông báo đầu trang).
- AC-8: Given lint UI của kho, When `npm run lint` + `npm run test:lint-rules`, Then sạch — không màu thô, không chữ dưới
  `text-xs`, Badge từ `@/components/reui/badge`.
- AC-9: Given dev server chạy với lược đồ như máy chủ ở ba trạng thái (không có / tươi / cũ 46′), When mở
  `/ops/collections`, Then mỗi dòng `ST-lockdown-…` của bảng trạng thái có ít nhất một khung mang đúng tên ấy, có khung tối
  và khung 390px ghi rõ trạng thái, và trang không có thanh cuộn ngang ở 390px.

## Coverage

Quét không gian tiêu chí theo trục (bước mặc định CT-S, quét ngay trong thiết kế — dòng `approach` trong sổ):

- Trục trạng thái số: không bản tin (AC-1) · khối lỗi (AC-2) · tươi (AC-3, AC-5) · cũ > 45′ (AC-4) [thước CE: ADR-0014
  §Ngưỡng trễ — ba mức + khối lỗi của ON22].
- Trục giá trị lớp: `true` · `false` · `null` (AC-3, AC-5) [thước CE: ON2 — `null` = không kiểm được, không bao giờ «Ổn»].
- Trục vùng trên trang: lưới Khoá an toàn (AC-1…AC-4) · ô Khoá an toàn (AC-1…AC-4) · Máy móc hai hàng Kev / collector
  (AC-4 cũ, AC-5 tươi và không khối).
- Trục môi trường: máy chủ (AC-1…AC-5, AC-9) · máy thu (AC-6).
- Trục lớp đo: HTML render (AC-1…AC-6) · chữ (AC-7) · lint (AC-8) · ảnh chụp sáng/tối/hẹp (AC-9).

## Đường đo

- Ngưỡng «Máy chủ không có số khoá an toàn: 8/8 lớp «Chỉ kiểm ở máy thu», 0 lớp xanh» ← AC-1, AC-2.
- Ngưỡng «Có số: Khoá an toàn và Máy móc cùng một trạng thái cho Kev gate và collector API» ← AC-5 (cùng AC-3 cho lưới).

## Out of scope

- Lưới Máy móc chuyển hẳn sang khối `jobs` launchd — hợp đồng mới (ON3 Ngoài-1/4), theo Hỏi-1 = A.
- «Cần chú ý», luồng 7 ngày, ống/nhóm S03, xoay vòng trên máy chủ — ON4/ON5.
- Cách máy thu dò cổng trong `push-ops-facts.mjs` (hai URL khác nhau) — việc riêng ở máy thu (t3_paths).
- Cách tính lớp ở máy thu, lọc dòng nhật ký — ON2 đã ký.

## Notes

- Chung `collections-view.tsx`, `collections-tiles.tsx`, `jobs-grid.tsx` với ON3 (đã merge) và ON4/ON5 — không song song.
- Phép đo không gọi lệnh ghi nào trên OpenClaw (`.claude/rules/zalo-safety.md`): bản tin dựng từ thư mục tạm, cổng dò được
  thay bằng giá trị `ok` của bản tin thật.
