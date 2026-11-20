---
schema_version: 1
feature: Sổ nguồn khai được từng dòng «khớp nguyên cụm» — bộ che và bộ soát tên nguồn không còn coi từ đầu (thương hiệu dự án, từ chung) là tên nguồn cho dòng đã khai, dòng S16 trả về tên hai từ + tên miền mà /ops/registry và sync-cloud không che nhầm, còn mọi dòng khác (kể cả S05) che y như hôm nay
slug: che-ten-nguon-khong-lay-tu-dau
owner: phanlemanh@gmail.com
risk_tier: T3      # nới bộ soát tầng A; chạm db/migrations và pipeline/sync-cloud.mjs (t3_paths)
surfaces: [cli, data, ui]
status: signed-off
design_doc: _acceptance/che-ten-nguon-khong-lay-tu-dau/design.md
approved_by: Mạnh
approved_at: 2026-11-19
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
  không dấu, hoa, và các từ nối bằng dấu cách kép, xuống dòng, dấu nối, gạch dưới, dấu chấm hay dấu `/`, gồm cả dạng nằm trong
  đường dẫn URL) và tên miền bị thay bằng mã — ở bộ che của hai bản lõi, bộ soát của sync-cloud và bước che phía SQL
  (`maskedSourceExpr`); với cờ vắng hay false (đối chứng): thương hiệu bị che như hôm nay; mọi ca cũ
  (gồm «từ đầu của tên nhiều từ» của S05) không đổi một ký tự.
- **AC-3** Given DB thử, When gọi hàm nạp chung (bản pipeline và bản app) ở ba trạng thái — đã áp 112 với một dòng giả
  `match_whole` = true · chưa áp 112 (thiếu cột) · không có bảng `source_registry`, Then lần lượt: mọi token (tên thật và từng
  định danh) mang đúng cờ của dòng; mọi cờ false và không lỗi (che thừa); danh sách rỗng (bộ che trả null, bộ soát dừng như hôm nay).
- **AC-4** Given sáu chỗ đọc chuyển qua hàm nạp (sync-cloud — cả bộ soát lẫn bước che phía SQL, push-ops-facts, do-hang-ngay,
  offers-public, collections-queries, quet-ten-nguon-html; ops-local nhận danh sách tên từ push-ops-facts), When soát mã và chạy bộ soát của sync-cloud và push-ops-facts trên tải giả, Then không chỗ
  nào trong sáu còn tự đọc `real_name`/`source_ids` để dựng danh sách che; tải chứa tên dự án mang thương hiệu giả đi qua khi
  dòng giả khai `match_whole`, bị chặn khi không khai; tải chứa cụm hai từ hay tên miền giả bị chặn ở cả hai — mỗi chỗ trong
  sáu có một ca hành vi riêng (offers-public: giá trị người bán mang tên miền giả về NULL); và với sổ rỗng hay hàm nạp ném lỗi,
  ba đường rời máy (sync-cloud, push-ops-facts, do-hang-ngay) dừng với mã khác 0 thay vì đẩy.
- **AC-5** Given bản chép DB máy thu đã áp 112, When đếm lại log job, Then 60 dòng log mà chỉ biến thể từ đầu của định danh S05
  che được vẫn bị che (S05 không khai `match_whole`).
- **AC-6** Given bản chép DB máy thu đã áp 112 và dòng S16 trả về tên hai từ + tên miền với `match_whole` = true, When đếm lại
  bảng phủ ca, Then nút dự án, bí danh và dòng bảng đi cloud bị coi là tên S16 đều về 0 (từ 8 / 114.760 / ≈ 1.320 / 3.355);
  cấy cụm hai từ có dấu cách và tên miền S16 vào một bảng thử thì bộ soát của sync-cloud bắt được (≥ 1); DB máy thu không đổi.
- **AC-7** Given thư mục `ap-may-thu/`, Then có năm thứ: lệnh áp (112 rồi trả dòng S16 — giá trị lấy từ tệp cục bộ GS cấp,
  không chép vào hồ sơ), số chạy thử trên bản chép, sao lưu `source_registry` trước, tệp lùi (khôi phục dòng S16 TỪ bản sao
  lưu, không viết cứng giá trị, rồi bỏ cột), lệnh kiểm sau (/ops/registry đúng tên dự án, lượt cloud-sync kế qua leak gate, ca cấy bị bắt); tệp lùi chạy
  thật trên DB thử: cột mất, áp lại 112 được.
- **AC-9** Given tệp cục bộ GS cấp (tên thật + định danh S16), When dò mọi biến thể còn bí mật (tên đủ, viết liền, mỗi định danh đủ và
  viết liền, dạng chữa tạm — KHÔNG dò từ đầu đứng riêng vì Mạnh đã cho rời máy và nó có sẵn trong tên dự án công khai) trên mọi tệp của hồ sơ (`_acceptance/che-ten-nguon-khong-lay-tu-dau/**`, gồm đầu ra các phép kiểm và báo cáo
  bằng chứng), các tệp test và bảng ca, Then số chỗ trúng là 0; đối chứng: chèn tạm một biến thể vào bản sao một tệp thì ra ≥ 1.
  Mọi lệnh đo trên bản chép chỉ in mã và số.
- **AC-8** (judgment) Given thẻ và hồ sơ, Then người duyệt đọc được bằng chữ thường đây là nới bộ soát tầng A, nới ở đâu, chỗ đọc
  nào chưa mang cờ (chặn thừa, không rò), và chuỗi nào trước bị chặn nay đi lên cloud — không cần mở mã.
- **AC-10** Given `pipeline/push-ops-facts.mjs` và một máy chủ thu giả đếm mọi lời gọi, When một tiến trình chỉ `import` tệp này (có token và `INGEST_URL` trỏ máy chủ giả), Then 0 lời gọi tới máy chủ giả, tiến trình thoát 0; When chạy tệp như lệnh chính, Then đúng 1 lời gọi (đối chứng), `--kho` thì 0 lời gọi; lệnh chạy qua symlink `~/dev/one-invest` của launchd vẫn được nhận là lệnh chính.

## Out of scope

- Chuyển bốn thước còn lại sang hàm nạp: `scripts/do-nen-hieu-nang/do.mjs`, `scripts/link-nguoi-ban-s03/ten-nguon.mjs`,
  `pipeline/scripts/check-s08-inventory.mjs`, `scripts/lib/tier-a-source-names.mjs` — chưa mang cờ thì chặn thừa, không rò.
- Đổi luật biên từ hay ngưỡng 4 ký tự của lõi; khai `match_whole` cho dòng nào khác S16.
- Những chỗ tên đủ S01–S04 đã trúng trong bảng đi cloud trên dữ liệu hiện tại (bảng phủ ca, số là cận trên) — hàng riêng nếu
  GS thấy cần.

## Coverage

- Trục loại biến thể: đủ · viết liền · từ đầu [thước CE: lõi `nameVariants`] — AC-2, AC-6.
- Trục dấu phân tách của cụm hai từ: một dấu cách · hai dấu cách · xuống dòng · dấu nối · gạch dưới · dấu chấm · dấu `/` [thước CE: bộ tách từ `/[\s.\-_/]+/` của lõi] — AC-2.
- Trục cách nạp tệp đẩy cloud: import · lệnh chính · chạy khô · qua symlink launchd [thước CE: sự cố 19/11 và `scripts/cloud-sync.sh`] — AC-10.
- Trục cờ dòng: khai · không khai · thiếu cột (chưa áp 112) · không có bảng [thước CE: ràng buộc (a) của GS] — AC-2, AC-3.
- Trục chỗ đọc: rời máy (sync-cloud soát + che SQL, push-ops-facts, do-hang-ngay) · hiển thị Ops (offers-public, collections-queries) · thước
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
  áp, xoá ngay sau bước kiểm sau (bước kiểm sau cần tệp này).

- Mở lại Cổng Phạm vi ngày 19/11 vì S4 vòng 1 lộ hai việc. (1) Dòng khai `match_whole` để lọt cụm hai từ viết bằng dấu nối, gạch
  dưới, dấu chấm hay dấu cách kép: thêm vào AC-2. (2) Sự cố 00:26:54Z ngày 19/11: tác tử chấm import `push-ops-facts.mjs`, tệp tự
  chạy và đẩy một bản tin thật lên cloud, không có lời của Mạnh. Bản dựng lại không có tên nguồn thật; bản tin nằm trên cloud khoảng
  15 phút rồi bị lượt định kỳ ghi đè: thêm AC-10 để import không còn gửi.

- Known limits — chọn ở Cổng Bằng chứng 2026-11-19:
  - Ngoài-1: phép kiểm «bộ soát mới không lỏng hơn bản trên main» dùng lại chính lõi mới, nên một lần siết hẹp bộ soát sau này có thể lọt mà phép so không báo.
  - Ngoài-2: test của bước đo hằng ngày dùng sổ nguồn dựng tay thay vì bảng thật, nên lệch cách đọc sổ nguồn có thể không làm test này đỏ.
  - Ngoài-3: ca «hàm nạp làm rơi định danh» không đột biến hàm nạp thật, nên một hàm nạp rơi định danh có thể không làm ca này đỏ.
