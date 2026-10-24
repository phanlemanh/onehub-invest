---
schema_version: 1
feature: Người vận hành đọc /ops/collections và /ops/quality chỉ thấy mã S0x kèm vai trò, không tên nguồn thật — kể cả nhãn job đẩy từ máy thu
slug: ops-nhan-ma-nguon
owner: phanlemanh@gmail.com
risk_tier: T3      # pipeline/push-ops-facts.mjs (t3_paths)
surfaces: [ui, pipeline, docs]
status: draft
design_doc: docs/superpowers/specs/2026-10-24-ops-nhan-ma-nguon-design.md
---

# Acceptance Contract: ops-nhan-ma-nguon

## Context

Tên nguồn thật là tầng A: ngoài `/ops/sources`, Ops chỉ hiện mã `S0x` kèm vai trò. Hôm nay `/ops/collections` và
`/ops/quality` còn tên thật trong 9 tệp component (tiêu đề cột, cảnh báo, ô KPI, chú thích), nhãn và id job viết cứng tên
thật ở `pipeline/push-ops-facts.mjs` (lên cloud) lẫn `readSchedulerStatus` (local), và «dòng log cuối» của job lên cloud
nguyên văn. Việc này đưa mọi nhãn nguồn qua một hàm `sourceLabel` (vai trò đọc từ `source_registry` ở local, từ
`facts.sourceRuns` ở cloud), che tên thật trong dòng log, và dựng ba thước: chữ đã render, quét tĩnh chữ hiển thị, payload
facts bắt được từ bước thật. Phải xong trước NT2.

Căn cứ: docs/plan/lo-trinh.json ON7 (`bat_khi`, `ghi_chu`); AGENTS.md luật 6 (tên nguồn thật tầng A — «ngoài `/ops/sources`
chỉ mã `S0x` kèm vai trò», Mạnh 24/10 Câu 2); CONTEXT.md «Tầng B»; .claude/rules/pii-spl.md (không hardcode literal
nguồn); docs/adr/0014-ops-cloud-doc-so-tong-hop.md (chuỗi AU13 → ON7 → NT2 → ON22).

## Criteria

- AC-1: Given `CollectionsView` dựng bằng `renderToStaticMarkup` với dữ liệu mẫu bật mọi nhánh cảnh báo (kênh S03 đứt,
  heartbeat trễ > 20′, im 24h, lệch allowlist, nhóm im > 72h, đủ 6 job, rotation có market) và vai trò lấy từ
  `source_registry` local, When quét chữ và giá trị thuộc tính `title`/`aria-label`/`href`/`alt` của HTML, Then không có
  tên nguồn thật nào, HTML có «S03 · Cộng đồng» và «S02 · Hiệu chuẩn», cảnh báo kênh đứt có liên kết tới `/ops/sources`
  và không có lệnh đăng nhập kênh nào, mỗi `href="#…"` có đúng một phần tử mang `id` đó trong cùng HTML; lượt dựng thứ
  hai với mọi thứ lành (trạng thái rỗng) cũng 0 tên thật.
- AC-2: Given trang `/ops/quality` thật dựng trên DB local, và trang `/ops/collections` thật dựng ở chế độ cloud (lược đồ
  không có `source_registry`) với facts là đúng payload mà `push-ops-facts` thật vừa đẩy ở AC-4, When quét HTML như AC-1,
  Then 0 tên nguồn thật, `/ops/quality` có «S02 · Hiệu chuẩn», `/ops/collections` cloud có «S03 · Cộng đồng».
- AC-3: Given bộ quét tĩnh chữ hiển thị (JSX text, giá trị thuộc tính JSX, giá trị thuộc tính đối tượng tên
  `label/title/description/detail/header/footnote/placeholder`) trên `app/src/components/ops/**` trừ `sources/`,
  `app/src/app/ops/quality/**`, `app/src/app/ops/collections/**`, When chạy `check-portal-compliance`, Then 0 chỗ trúng;
  cùng bộ quét chạy trên bản các tệp ấy ở cây gốc 460e61a bắt ĐÚNG ma trận chỗ trúng viết trước
  (`scripts/fixtures/ops-tier-a-matrix.json`: mã · tệp · dòng của mọi chỗ chữ hiển thị, không chỗ định danh nào); trên
  `components/ops/sources/` thấy ≥ 1 chỗ (đối chứng dương); bản sao chèn tên thật vào tiêu đề, vào một template literal
  render qua `{…}`, hay vào khoá đối tượng ngoài danh sách thì bị bắt — báo bằng mã `S0x` + tệp:dòng, không in tên.
- AC-4: Given `push-ops-facts.mjs` THẬT chạy với `INGEST_URL` trỏ máy chủ thu tạm, `HOME` và `ONEINVEST_ROOT` là cây tạm
  có log job chứa tên nguồn thật ở dòng cuối, `DATABASE_URL` là DB local (chỉ đọc), When máy chủ thu nhận payload, Then
  `jobs` đủ 6 job, MỌI giá trị chuỗi của payload không có tên nguồn thật — trừ đúng hai đường miễn có tên
  (`zaloGroups[].name` tầng C, `zaloAccounts[]` của NT2) —, `id` job không mang tên thật, và dòng log cuối chứa tên thật
  ở cây tạm hiện ra với mã `S0x` thay chỗ tên; bản sao `push-ops-facts` thêm một giá trị mang tên thật ngoài `jobs` thì
  phép đo bắt và nêu đường JSON của giá trị đó.
- AC-5: Given `readSchedulerStatus` nhánh local (không `VERCEL`) đọc cây log tạm có tên thật ở dòng cuối, When gọi hàm,
  Then nhãn, id và `lastLine` của mọi job không có tên nguồn thật, và `lastLine` mang mã `S0x` ở chỗ tên; khi DB không
  tới được (không đọc được danh sách tên) thì `lastLine` là `null`, không phải dòng thô.
- AC-6: Given `getSourceRoles` ở ba môi trường — (a) DB có `source_registry`, (b) lược đồ không có `source_registry` nhưng
  facts có `sourceRuns`, (c) không có cả hai, When dựng nhãn `sourceLabel("S02", roles)`, Then (a) và (b) ra
  «S02 · Hiệu chuẩn», (c) ra «S02» và không ném lỗi.
- AC-7: Given bảng ca dùng chung (tên đủ, khác hoa thường, bỏ dấu, viết liền không khoảng trắng, tên ba ký tự đứng giữa một
  từ khác, chuỗi không có tên), When chạy bộ che bản pipeline và bản app trên cùng bảng, Then hai bản cho đúng kết quả viết
  trước của từng ca (tên ba ký tự giữa từ KHÔNG bị thay) và giống hệt nhau; danh sách tên rỗng thì cả hai trả `null`
  (đóng chặt, không trả lại chuỗi gốc).
- AC-8: Given `CONTEXT.md` và `app/src/lib/source-labels.ts` sau vòng, When đọc, Then có thuật ngữ «Nhãn nguồn» đủ nhãn ·
  code · slug · định nghĩa · _Avoid_, định nghĩa khớp đúng khuôn `sourceLabel` («S0x · vai trò», vắng vai trò thì mã
  trần) và nói tên thật chỉ ở `/ops/sources`. (judgment)

## Coverage

Quét hình thái (preset test-matrix) ở S1 — trục và thước CE:

- Trục bề mặt: collections (AC-1) · quality (AC-2) · component ops khác (AC-3) · payload facts (AC-4) · readSchedulerStatus
  local (AC-5). [thước CE: `bat_khi` của hàng ON7 + quét tên S1 (24 tệp có chỗ trúng, 9 tệp chữ hiển thị)]
- Trục loại chữ: chữ tĩnh (AC-1, AC-2, AC-3) · nhãn/id job (AC-4, AC-5) · dữ liệu chạy — dòng log (AC-4, AC-5, AC-7).
  [thước CE: phân loại chỗ trúng S1 string/jsx/ident]
- Trục nhánh hiển thị: lành/rỗng · cảnh báo · đứt kênh (AC-1); nhánh không render được → quét tĩnh (AC-3).
- Trục môi trường: local · cloud không `source_registry` · không nguồn vai trò (AC-6). [thước CE: sự cố prod 24/10,
  `app/tests/ops-cloud-khong-bang-nap.test.tsx`]
- Chân ngành: [NGÀNH: GDPR Art. 4(5) pseudonymisation] (thay định danh bằng mã, khoá ánh xạ giữ riêng — `source_registry`
  local) · [NGÀNH: ISO/IEC 20889 de-identification] (che trên mọi đường ra, cả dữ liệu chạy).

## Đường đo

- Ngưỡng «Quét tĩnh `app/src/components/ops/**` (trừ `sources/`), `app/src/app/ops/quality` và payload facts: 0 tên nguồn
  thật» ← `node scripts/check-portal-compliance.mjs` (AC-3, quét tĩnh) + `cd pipeline && npm test` (AC-4, payload bắt từ
  bước thật). PROXY: «quét tĩnh» đo CHỮ HIỂN THỊ (JSX text, thuộc tính, khoá hiển thị), không đo định danh trong mã
  (sổ d-…-12); độ phủ của khuôn chứng bằng ma trận viết trước trên cây gốc. «payload facts» miễn đúng hai đường có tên
  (tên nhóm S03 tầng C; tài khoản thu → NT2). Danh sách tên rút từ migration đã commit — tên thêm vào `source_registry`
  mà không qua migration thì thước không thấy (khai ở Notes).
- Ngưỡng «nhãn dạng «S02 · hiệu chuẩn»» ← `cd app && npm test` (AC-1, AC-2: HTML render có nhãn; AC-6 vai trò).

## Out of scope

- `/ops/sources` — nơi duy nhất được hiện tên thật, giữ nguyên.
- `/ops/deals` — ngoài ngưỡng của hàng; đã có mục 5 của `check-portal-compliance`.
- Đổi tên định danh trong mã (biến, kiểu, tệp, bảng SQL, đường log) — không hiện cho người vận hành.
- Khoá JSON của payload facts (`zaloGroups`, `zaloFlow`, `zaloAccounts`) — theo Hỏi-1.
- Tên tài khoản thu (`zaloAccounts[].name`) và mọi đường lên cloud khác — NT2.
- Tên nhóm S03 — tầng C từ 24/10 (sửa đổi ADR-0007), không che.

## Notes

- `pipeline/push-ops-facts.mjs` (t3_paths) chung với NT2, ON22, ON2, ON4, ON5 — chạy liền nhau, không song song.
- Thước đọc tên từ `db/migrations/` (câu `INSERT INTO source_registry`); bộ che lúc chạy đọc `source_registry` local.
