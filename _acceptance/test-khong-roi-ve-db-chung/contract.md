---
schema_version: 1
feature: Test tự dựng bảng rồi ghi không rơi về DB chung — rào hai tệp, thiếu URL thì bỏ qua có lời
slug: test-khong-roi-ve-db-chung
owner: phanlemanh@gmail.com
risk_tier: T2      # tệp test + lib chốt chặn + lệnh chấm trong config — không chạm t3_paths
surfaces: [cli]
status: verified
veto_state: mo
veto_opened_at: 2026-11-27T01:01:24Z
design_doc: docs/superpowers/specs/2026-11-27-test-khong-roi-ve-db-chung-design.md
---

# Acceptance Contract: test-khong-roi-ve-db-chung

## Context

Ngày 21/11, một lượt chạy trần `pipeline/import-s09-danh-ba.test.mjs` đã ghi 24 bản thu test và 40 dòng vào DB máy thu. GS
giao HT35 (27/11) và phán tách: hàng này chỉ rào hai tệp thuộc lớp «tự dựng bảng thật rồi ghi», gồm bản zk @3cb318df3 và
`scripts/check-freshness.test.mjs`. Phần còn lại (52 tệp có ghi chưa rào, phương án CI) để cho HT36. Hàng nền, miễn số trên màn.

## Criteria

Hành vi chung (GS chốt cuối 27/11, theo quy ước sẵn của kho — `chotDbThu` khiThieu «bo-qua»): URL tên DB thử → chạy; thiếu
`DATABASE_URL` → bỏ qua cả tệp có lời; URL tên khác → thoát 2 có lời từ chối. Cả ba ca đều trước mọi kết nối. Dòng chọn DB
của tệp test là hạ tầng test (làn Claude): P1 đặt cùng rào vào cả hai tệp, không đụng logic nạp hay ca nghiệp vụ của zk.

- **AC-1** Given chạy trần một tệp trong phạm vi, When `DATABASE_URL` trỏ DB tên `oneinvest` (mọi cách viết), kể cả khi
  `CI=true`, Then tiến trình thoát lỗi với lời từ chối trước mọi kết nối.
- **AC-2** Given chạy trần một tệp trong phạm vi, When `DATABASE_URL` vắng, Then tệp bỏ qua có lời («bỏ qua — thiếu
  DATABASE_URL»), thoát 0, không thử nối, không tạo bảng.
- **AC-3** Given danh sách cho phép của `chotDbThu`, When tên DB là `oneinvest_suite_*` hoặc `oneinvest_ci_scripts_<số>`
  (DB trống mà bước scripts của `suite-neu-doi` tự dựng rồi xoá), Then nhận; tên gần giống (`oneinvest_ci_scripts_x`,
  `oneinvest_ci_scripts_`, …) và `oneinvest` thì từ chối.
- **AC-4** Given bản chép bỏ rào của từng tệp, When chạy với URL DB chung ở cổng chết, Then lời từ chối biến mất và tệp đi tới
  chỗ thử nối DB. Đây là chứng rào là thứ chặn.
- **AC-5** Given DB của riêng lượt (`db/db-thu.sh … --chay`), When chạy các tệp trong phạm vi, Then mọi ca chạy và xanh, với 0
  ca bỏ qua (trừ GT-AC-1 đỏ sẵn trên main).
- **AC-6** Given `pipeline/import-s09-danh-ba.test.mjs` (tệp của làn zk), When so với gốc của hàng `1a2cb6a43`, Then chỉ khác
  ở vùng chọn DB (import `chotDbThu`, dòng rào, chú thích) — không dòng nào của logic nạp hay ca nghiệp vụ đổi.
- **AC-7** Given bốn lệnh chấm đang chạy `check-freshness.test` trần (`executors.test.scripts`, `check_freshness`,
  `sl_freshness`, `s08l_do`), When đọc và chạy chúng, Then cả bốn chạy qua `db/db-thu.sh … --chay` và vẫn xanh. Không bọc thì
  sau HT35 chúng xanh rỗng, vì tệp bỏ qua khi thiếu URL.
- **AC-8** Given hồ sơ, When đọc `bang-phu.md`, Then có đủ 66 tệp rơi về DB chung, mỗi tệp một ô: trong phạm vi · ngoài phạm
  vi kèm vì sao · để lại cho HT36. Thiết kế ghi đề xuất A–B cho HT36.

## Coverage

Trục: tệp (2 trong phạm vi) × URL (vắng · tên `oneinvest` bốn cách viết · suite · `ci_scripts`) × môi trường (ngoài CI ·
`CI=true`) × rào (có · bỏ). AC-1 phủ {oneinvest} × {ngoài CI, CI}. AC-2 phủ vắng. AC-3 phủ ma trận tên. AC-4 phủ rào bỏ. AC-5
phủ suite × có rào. AC-6 giữ tệp S09 chỉ đổi vùng chọn DB.

## Out of scope

- 52 tệp có ghi chưa rào và 12 tệp ngoài phạm vi khác (bảng phủ) — HT36.
- Đổi `ci-test.yml` (phương án A) — HT36 (GS bỏ A cho hàng này).
- `pipeline/sync-pii.test.mjs`, `scripts/bao-cao-ngay.test.mjs` — ngoài phạm vi, vì chỉ đọc (soi tay: một SELECT; giao dịch
  read-only).
- Dọn 24 bản thu test trên máy thu — bước 0b của lượt áp DA42, có lời Mạnh riêng.

## Notes

- AC-8, finding S4 vòng 2 (GS phán (b) 27/11, giữ chữ AC-8 và kiem-ht35.mjs): bảng phủ ghi 66 tệp nhưng luật quét chỉ bắt chuỗi
  literal và chỉ xét lần xuất hiện đầu mỗi tệp. Đếm chỉ đọc 27/11 trên HEAD: 4 tệp rơi về DB chung qua HẰNG hay HÀM không có trong
  bảng — `scripts/dev-ops-account.test.mjs`, `scripts/dev-register-check.test.mjs` (`DEFAULT_DATABASE_URL`), `scripts/job-exit.test.mjs`
  (`LOCAL_URL`), `app/tests/ops-nhan-ma-nguon-cloud.test.tsx` (`localDbUrl()`); 1 tệp nhiều lần xuất hiện khác nhau
  (`scripts/db-thu.test.mjs`, chuỗi mẫu trong ca, đã ngoài phạm vi). Mở rộng ở HT36: giải hằng (export/const/hàm có giá trị
  …/oneinvest), quét mọi lần xuất hiện, bảng phủ đếm lại; bốn tệp trên vào danh sách HT36.
- NK-AC-1: baseline red, sửa ở HT38. Hai ca NK-AC-1 của `scripts/so-nguon-kho.test.mjs` so cột tầng A (real_name, source_ids) của S09, S17 với bảng cứng; trên mọi bản chép DB thật (kể cả máy thu) chúng đỏ vì ZK đã điền tên thật — không phải mã HT35. E7d đạt khi tập ca đỏ ở HEAD bằng tập ca đỏ ở cây gốc cùng máy (GS phán 27/11 sau S4 vòng 1).
- Thật thà: sau HT35, ca nạp S09 và ca của `check-freshness.test` KHÔNG còn chạy trên CI GitHub. Trước đây chúng chạy nhờ rơi
  về DB dịch vụ; nay CI không đặt `DATABASE_URL` nên cả tệp bỏ qua có lời. Chúng chỉ còn chạy ở lượt chấm qua `db-thu` và ở
  bước scripts của `suite-neu-doi`. HT36 quyết phương án CI (đề xuất A: CI đặt `DATABASE_URL` tên `oneinvest_suite_ci`).
