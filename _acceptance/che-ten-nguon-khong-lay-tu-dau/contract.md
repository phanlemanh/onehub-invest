---
schema_version: 1
feature: Sổ nguồn khai được từng dòng «khớp nguyên cụm» — bộ che và bộ soát tên nguồn không còn coi từ đầu (thương hiệu dự án, từ chung) là tên nguồn cho dòng đã khai, dòng S16 trả về tên hai từ + tên miền mà /ops/registry và sync-cloud không che nhầm, còn mọi dòng khác (kể cả S05) che y như hôm nay
slug: che-ten-nguon-khong-lay-tu-dau
owner: phanlemanh@gmail.com
risk_tier: T3      # nới bộ soát tầng A; chạm db/migrations và pipeline/sync-cloud.mjs (t3_paths)
surfaces: [cli, data, ui]
status: draft
design_doc: _acceptance/che-ten-nguon-khong-lay-tu-dau/design.md
approved_by:
approved_at:
---

# Acceptance Contract: che-ten-nguon-khong-lay-tu-dau

## Context

Biến thể «từ đầu» của lõi che/soát tên nguồn coi thương hiệu chủ đầu tư và một từ chung là tên nguồn S16 (8 nút dự án, 114.760
bí danh, ≈ 1.320 dòng bảng đi cloud, 3.355 dòng `areas` — đo trên DB máy thu, `discovery/bang-phu-ca.md`). GS chữa tạm bằng
dữ liệu nên cụm hai từ và tên miền S16 hiện không được che/soát. GS chốt lối B (U1-1811-1): cột cờ `match_whole` theo dòng,
migration 112, mặc định = hành vi hôm nay, một hàm nạp dùng chung. Đây là đổi bộ soát tầng A (ADR-0007) — hạng T3. Fixture
dùng tên giả cùng hình dạng; không tên nguồn thật nào trong hồ sơ.

## Acceptance Criteria

- **AC-1** Given DB thử đã áp tới 111, When áp `db/migrations/112_*.sql` hai lần, Then lần hai không lỗi, lược đồ không đổi;
  `source_registry.match_whole` là boolean NOT NULL DEFAULT false, mọi dòng có sẵn mang false; `pipeline/sync-cloud.mjs`
  vẫn không đưa `source_registry` lên cloud.
- **AC-2** Given bảng ca dùng chung của hai bản lõi cộng các ca mới với nguồn giả (tên hai từ, từ đầu trùng thương hiệu của
  tên dự án giả; tên miền có nhãn đầu là từ chung), When chạy cả bản pipeline lẫn bản app, Then hai bản ra cùng kết quả mọi ca;
  với `wholeOnly` = true: tên dự án giả mang thương hiệu giữ nguyên, câu chứa đúng từ chung giữ nguyên, cụm hai từ (có dấu,
  không dấu, hoa) và tên miền bị thay bằng mã; với cờ vắng hay false (đối chứng): thương hiệu bị che như hôm nay; mọi ca cũ
  (gồm «từ đầu của tên nhiều từ» của S05) không đổi một ký tự.
- **AC-3** Given DB thử, When gọi hàm nạp chung (bản pipeline và bản app) ở ba trạng thái — đã áp 112 với một dòng giả
  `match_whole` = true · chưa áp 112 (thiếu cột) · không có bảng `source_registry`, Then lần lượt: mọi token (tên thật và từng
  định danh) mang đúng cờ của dòng; mọi cờ false và không lỗi (che thừa); danh sách rỗng (bộ che trả null, bộ soát dừng như hôm nay).
- **AC-4** Given bảy chỗ đọc chuyển qua hàm nạp (sync-cloud, push-ops-facts, do-hang-ngay, offers-public, collections-queries,
  ops-local, quet-ten-nguon-html), When soát mã và chạy bộ soát của sync-cloud và push-ops-facts trên tải giả, Then không chỗ
  nào trong bảy còn tự đọc `real_name`/`source_ids` để dựng danh sách che; tải chứa tên dự án mang thương hiệu giả đi qua khi
  dòng giả khai `match_whole`, bị chặn khi không khai; tải chứa cụm hai từ hay tên miền giả bị chặn ở cả hai — mỗi chỗ trong
  bảy có một ca hành vi riêng (offers-public: giá trị người bán mang tên miền giả về NULL); và với sổ rỗng hay hàm nạp ném lỗi,
  ba đường rời máy (sync-cloud, push-ops-facts, do-hang-ngay) dừng với mã khác 0 thay vì đẩy.
- **AC-5** Given bản chép DB máy thu đã áp 112, When đếm lại log job, Then 60 dòng log mà chỉ biến thể từ đầu của định danh S05
  che được vẫn bị che (S05 không khai `match_whole`).
- **AC-6** Given bản chép DB máy thu đã áp 112 và dòng S16 trả về tên hai từ + tên miền với `match_whole` = true, When đếm lại
  bảng phủ ca, Then nút dự án, bí danh và dòng bảng đi cloud bị coi là tên S16 đều về 0 (từ 8 / 114.760 / ≈ 1.320 / 3.355);
  cấy cụm hai từ có dấu cách và tên miền S16 vào một bảng thử thì bộ soát của sync-cloud bắt được (≥ 1); DB máy thu không đổi.
- **AC-7** Given thư mục `ap-may-thu/`, Then có năm thứ: lệnh áp (112 rồi trả dòng S16 — giá trị lấy từ tệp cục bộ GS cấp,
  không chép vào hồ sơ), số chạy thử trên bản chép, sao lưu `source_registry` trước, tệp lùi (khôi phục dòng S16 TỪ bản sao
  lưu, không viết cứng giá trị, rồi bỏ cột), lệnh kiểm sau (/ops/registry đúng tên dự án, một lượt sync-cloud chạy thử qua leak gate, ca cấy bị bắt); tệp lùi chạy
  thật trên DB thử: cột mất, áp lại 112 được.
- **AC-9** Given tệp cục bộ GS cấp (tên thật + định danh S16), When dò mọi biến thể (đủ, viết liền, từ đầu của mỗi token, kể cả
  dạng chữa tạm) trên mọi tệp của hồ sơ (`_acceptance/che-ten-nguon-khong-lay-tu-dau/**`, gồm đầu ra các phép kiểm và báo cáo
  bằng chứng), các tệp test và bảng ca, Then số chỗ trúng là 0; đối chứng: chèn tạm một biến thể vào bản sao một tệp thì ra ≥ 1.
  Mọi lệnh đo trên bản chép chỉ in mã và số.
- **AC-8** (judgment) Given thẻ và hồ sơ, Then người duyệt đọc được bằng chữ thường đây là nới bộ soát tầng A, nới ở đâu, chỗ đọc
  nào chưa mang cờ (chặn thừa, không rò), và chuỗi nào trước bị chặn nay đi lên cloud — không cần mở mã.

## Out of scope

- Chuyển bốn thước còn lại sang hàm nạp: `scripts/do-nen-hieu-nang/do.mjs`, `scripts/link-nguoi-ban-s03/ten-nguon.mjs`,
  `pipeline/scripts/check-s08-inventory.mjs`, `scripts/lib/tier-a-source-names.mjs` — chưa mang cờ thì chặn thừa, không rò.
- Đổi luật biên từ hay ngưỡng 4 ký tự của lõi; khai `match_whole` cho dòng nào khác S16.
- Những chỗ tên đủ S01–S04 đã trúng trong bảng đi cloud trên dữ liệu hiện tại (bảng phủ ca, số là cận trên) — hàng riêng nếu
  GS thấy cần.

## Coverage

- Trục loại biến thể: đủ · viết liền · từ đầu [thước CE: lõi `nameVariants`] — AC-2, AC-6.
- Trục cờ dòng: khai · không khai · thiếu cột (chưa áp 112) · không có bảng [thước CE: ràng buộc (a) của GS] — AC-2, AC-3.
- Trục chỗ đọc: rời máy (sync-cloud, push-ops-facts, do-hang-ngay) · hiển thị Ops (offers-public, collections-queries) · thước
  (ops-local, quet-ten-nguon-html) · chưa chuyển (bốn thước) [thước CE: danh sách kê ở `design.md`] — AC-4, Out of scope.
- Trục nguồn trên DB máy thu: S16 (hại) · S05 (từ đầu là thứ duy nhất che 60 dòng) · còn lại [thước CE: bảng phủ ca] — AC-5, AC-6.
- Trục không lộ: hồ sơ · test · bảng ca · đầu ra lượt chấm [thước CE: ADR-0007 tầng A, kho công khai] — AC-9.
- Trục áp: áp · chạy thử · lùi [thước CE: AGENTS.md «Ai quyết gì»] — AC-1, AC-6, AC-7.

## Đường đo

- Dòng/nút bị coi nhầm là tên S16 (8 nút dự án, 114.760 bí danh, ≈ 1.320 dòng cloud, 3.355 dòng areas → 0) và 60 dòng log S05
  vẫn che — `discovery/phu-ca.mjs` + `discovery/log-tu-dau.mjs` trên bản chép trước gộp và trên DB máy thu sau áp — AC-5, AC-6.

## Notes

- Sau thay đổi, hai thứ trước bị chặn nay rời máy không che (chỉ cho dòng S16 khai `match_whole`): từ đầu của tên S16 khi đứng
  riêng (thương hiệu chủ đầu tư — cũng là chữ đầu của tên dự án, công khai ở danh bạ) và nhãn đầu của tên miền S16 khi đứng
  riêng (một từ chung). Cụm hai từ, bản viết liền và tên miền đủ vẫn bị che/chặn. Nới bộ soát tầng A cần lời Mạnh — Hỏi ở Cổng 1.

- Ra khỏi kho: áp 112 và trả dòng S16 lên DB máy thu đi cùng chữ ký Cổng Bằng chứng; giá trị tên thật GS cấp qua tệp cục bộ lúc
  áp, đọc xong xoá.
