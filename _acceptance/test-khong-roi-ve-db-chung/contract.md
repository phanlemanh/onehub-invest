---
schema_version: 1
feature: Test tự dựng bảng rồi ghi không rơi về DB chung — rào hai tệp, thiếu URL thì bỏ qua có lời
slug: test-khong-roi-ve-db-chung
owner: phanlemanh@gmail.com
risk_tier: T2      # tệp test + lib chốt chặn + lệnh chấm trong config — không chạm t3_paths
surfaces: [cli]
status: approved
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

Hành vi chung (GS chỉnh phán 27/11, theo quy ước sẵn của kho — `chotDbThu` khiThieu «bo-qua»): URL tên DB thử → chạy; thiếu
`DATABASE_URL` → bỏ qua cả tệp có lời; URL tên khác → thoát 2 có lời từ chối. Cả ba ca đều trước mọi kết nối. Tệp S09
(`pipeline/import-s09-danh-ba.test.mjs`) theo bản vá zk sửa lại cùng hành vi; P1 tích hợp khớp byte khi LL chuyển sha (AC-6).

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
- **AC-6** Given `pipeline/import-s09-danh-ba.test.mjs`, When so với sha bản vá mới của zk do LL chuyển, Then khớp từng byte,
  và commit giữ tác giả và tiêu đề của zk.
- **AC-7** Given bốn lệnh chấm đang chạy `check-freshness.test` trần (`executors.test.scripts`, `check_freshness`,
  `sl_freshness`, `s08l_do`), When đọc và chạy chúng, Then cả bốn chạy qua `db/db-thu.sh … --chay` và vẫn xanh. Không bọc thì
  sau HT35 chúng xanh rỗng, vì tệp bỏ qua khi thiếu URL.
- **AC-8** Given hồ sơ, When đọc `bang-phu.md`, Then có đủ 66 tệp rơi về DB chung, mỗi tệp một ô: trong phạm vi · ngoài phạm
  vi kèm vì sao · để lại cho HT36. Thiết kế ghi đề xuất A–B cho HT36.

## Coverage

Trục: tệp (2 trong phạm vi) × URL (vắng · tên `oneinvest` bốn cách viết · suite · `ci_scripts`) × môi trường (ngoài CI ·
`CI=true`) × rào (có · bỏ). AC-1 phủ {oneinvest} × {ngoài CI, CI}. AC-2 phủ vắng. AC-3 phủ ma trận tên. AC-4 phủ rào bỏ. AC-5
phủ suite × có rào. AC-6 giữ tệp S09 đúng bản zk.

## Out of scope

- 52 tệp có ghi chưa rào và 12 tệp ngoài phạm vi khác (bảng phủ) — HT36.
- Đổi `ci-test.yml` (phương án A) — HT36 (GS bỏ A cho hàng này).
- `pipeline/sync-pii.test.mjs`, `scripts/bao-cao-ngay.test.mjs` — ngoài phạm vi, vì chỉ đọc (soi tay: một SELECT; giao dịch
  read-only).
- Dọn 24 bản thu test trên máy thu — bước 0b của lượt áp DA42, có lời Mạnh riêng.

## Notes

- Thật thà: sau HT35, ca nạp S09 và ca của `check-freshness.test` KHÔNG còn chạy trên CI GitHub. Trước đây chúng chạy nhờ rơi
  về DB dịch vụ; nay CI không đặt `DATABASE_URL` nên cả tệp bỏ qua có lời. Chúng chỉ còn chạy ở lượt chấm qua `db-thu` và ở
  bước scripts của `suite-neu-doi`. HT36 quyết phương án CI (đề xuất A: CI đặt `DATABASE_URL` tên `oneinvest_suite_ci`).
