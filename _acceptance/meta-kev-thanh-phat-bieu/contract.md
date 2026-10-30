---
schema_version: 1
feature: Điểm Kev typed (ý định tin, bán/thuê) có cột ở bảng nạp và thành phát biểu theo bài cho mọi tin S03, không loại tin nào theo Kev
slug: meta-kev-thanh-phat-bieu
owner: phanlemanh@gmail.com
risk_tier: T3      # máy suy: db/migrations/ (057) — khớp t3_paths
surfaces: [cli]
status: approved
approved_by: Mạnh
approved_at: 2026-10-30
design_doc: docs/superpowers/specs/2026-10-30-meta-kev-thanh-phat-bieu-design.md
---

# Acceptance Contract: meta-kev-thanh-phat-bieu

## Context

Hàng PL5, phần (2) của cách chia giám sát duyệt 30/10 (P1-65): ZCode làm phần (1) (hook hỏi Kev hai câu typed, `meta.kev`
v5, importer chở vào cột `kev_*`); vòng này làm cột, sổ từ vựng, transform ghi phát biểu và phép đo. Ngoài AC-9 (cần dữ
liệu thật của phần 1), mọi tiêu chí đo trên dữ liệu mẫu và DB thử.

## Acceptance criteria

- AC-1: Given migration 057, When áp hai lần lên DB thử, Then `stg_zalo_posts` có bảy cột cho phép trống `kev_p real`,
  `kev_intent text`, `kev_intent_p real`, `kev_kind text`, `kev_kind_p real`, `kev_model text`, `kev_at timestamptz` (CHECK
  `kev_intent` ∈ offer · inquiry · not_listing, `kev_kind` ∈ sale · rent); CHECK của `field_assertions` nhận trường
  `listing_intent` và `kind` và phương pháp `kev`; hàm canh nhận `kev` + `inferred`, từ chối `kev` + `observed` và `kev` +
  `fact`; lần áp thứ hai không lỗi.
- AC-2: Given sổ `pipeline/mappings.yaml` sau sửa (trục mới `assertion_field`, `assertion_method` thêm `kev`), When chạy
  `vocab.mjs --check`, `--lint` và `--check-db` trên DB thử đã áp 057, Then cả ba xanh; hằng sinh ra có `kev`,
  `listing_intent`, `kind` đúng chỗ.
- AC-3: Given ma trận viết trước các dòng cột Kev (tin rao bán, Yêu cầu thuê `rent`, không phải tin, chỉ có ý định, chỉ có
  `kev_p` kiểu v3, gate down mọi điểm null, giá trị ngoài bộ), When hàm thuần đổi thành phát biểu, Then mỗi dòng ra đúng
  danh sách phát biểu viết trước (trường, giá trị — `rent` thành `rent_lt` —, lớp `inferred`, phương pháp `kev`, bằng chứng
  mang xác suất của lớp và `kev_p`) hoặc rỗng ở dòng v3, gate down và ngoài bộ.
- AC-4: Given giao dịch ROLLBACK trên DB thử có bốn bài S03 tổng hợp (tin rao bán, «khách tìm thuê 2pn…» chấm Yêu cầu thuê,
  không phải tin, bài gate down), When chạy transform-zalo hai lần, Then ba bài có điểm mỗi bài đúng một phát biểu
  `listing_intent` sống mang đúng mã Kev (bài Yêu cầu có phát biểu dù không thành offer), hai bài có `kev_kind` mỗi bài
  đúng một phát biểu `kind` sống (`sale`, `rent_lt`), bài gate down không có; lượt hai không thêm và không rút dòng sống
  nào. (cross-layer)
- AC-5: Given cùng giao dịch, When chạy transform-zalo với cột Kev điền và với cột Kev xoá trắng, Then tập (offer_id,
  post_ids, kind, price_vnd) và năm cột canonical của offer S03 bằng nhau — không tin nào bị loại hay đổi theo Kev.
  (cross-layer)
- AC-6: Given DB thử chưa áp 057 (không có cột Kev), When chạy transform-zalo, Then luồng offer chạy hết như trước, không
  ghi phát biểu Kev nào và in đúng một dòng «chưa áp 057». (cross-layer)
- AC-7: Given bản chép dữ liệu thật (DB thử, ROLLBACK) với phân phối tổng hợp điền cho mọi bài S03, When đo transform-zalo
  có và không có Kev, Then in giây hai lượt, số phát biểu thêm, cỡ thêm của bảy cột (byte/bài) và offer giống hệt;
  `field_assertions` không nằm trong danh sách bảng sync cloud. (cross-layer)
- AC-8: Given cây sau sửa, When chạy bộ test pipeline và ca DB của phát biểu (045) trên DB thử, Then tất cả xanh.
- AC-9: Given ngày v5 gần nhất trên máy thu (ngày có bài mang `kev_intent`, sau phần 1, chỉ đọc), When chạy thước dữ liệu
  thật, Then mọi bài có `kev_at` của ngày ấy có `kev_intent` (bài gate down in riêng); số offer khi có Kev bằng khi xoá
  trắng cột Kev (trong ROLLBACK); mọi bài «khách tìm…/cần mua/cần thuê» có phát biểu `listing_intent` (không bị bỏ); tỉ lệ
  ra `inquiry`, số bài stg S03 và số offer của ngày ấy cạnh trung vị 7 ngày trước được in (Hỏi-1). (cross-layer)

## Coverage

- Trục A — lược đồ: cột bảng nạp | CHECK trường/phương pháp | cặp lớp ↔ phương pháp | áp lại [AC-1] · sổ từ vựng [AC-2]
- Trục B — đổi phân phối thành phát biểu: tin rao | Yêu cầu | không phải tin | hoà | vắng | null | hỏng [AC-3]
- Trục C — đường ghi: mọi bài có điểm, kể cả không thành offer | chạy lại [AC-4] · không loại tin [AC-5, AC-9] · DB chưa
  áp 057 [AC-6] · dung lượng/thời gian KV3 [AC-7] · không lùi [AC-8] · dữ liệu thật [AC-9]
- Bỏ quét hình thái: dòng sổ `descope` «bỏ coverage-scan».

## Out of scope

- Hook, OpenClaw, importer, DATA-CONTRACT v5 (làn ZCode — phần 1 của cách chia).
- Đặt ngưỡng hay lọc tin theo Kev (PL21); huấn luyện lại Kev (PH3); bảng lưu Yêu cầu và ghép với listing (luật 11).
- Đưa `listing_intent`/`kind` của Kev vào cột canonical hay bộ phân xử.
- Áp migration 057 lên DB máy thu và cloud (bước triển khai sau gộp, giám sát giao).

## Đường đo

- «Mọi tin stg có cột kev_*» ← AC-1 (cột) + AC-9 (ngày v5: bài gate đã trả lời đều có ý định). Ô cơ hội viết «một ngày v3»
  lúc DATA-CONTRACT mới v3; ý định và bán/thuê chỉ có từ v5 nên đo trên ngày v5.
- «Số tin rao không giảm so với khi chưa có Kev» ← AC-5 (DB thử) + AC-9 (thật): đây là bất biến của transform (luồng offer
  không đọc cột Kev). Rớt bài ở hook hay importer v5 là nghiệm thu của phần (1); AC-9 chỉ IN số bài và số offer của ngày v5
  cạnh trung vị 7 ngày trước để người thấy.
- «Bài khách tìm… ra Yêu cầu, không bị bỏ» ← AC-4 (mẫu) + AC-9 (thật, theo Hỏi-1). KV3 (dung lượng, thời gian) ← AC-7.

## Notes
