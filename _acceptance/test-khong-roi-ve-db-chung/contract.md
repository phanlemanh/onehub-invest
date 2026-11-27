---
schema_version: 1
feature: Test tự dựng bảng rồi ghi không rơi về DB chung — rào hai tệp, CI vẫn chạy
slug: test-khong-roi-ve-db-chung
owner: phanlemanh@gmail.com
risk_tier: T2      # tệp test + lib chốt chặn + lệnh chấm trong config — không chạm t3_paths
surfaces: [cli]
status: implemented
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

- **AC-1** Given chạy trần một trong hai tệp trong phạm vi trên máy không phải runner CI, When `DATABASE_URL` trỏ DB tên
  `oneinvest` (mọi cách viết) hoặc vắng, Then tiến trình thoát lỗi với lời từ chối của rào trước mọi kết nối, và không ca
  nào chạy.
- **AC-2** Given `CI=true`, When `DATABASE_URL` ghi tường minh tên `oneinvest`, Then rào vẫn từ chối như AC-1.
- **AC-3** Given runner CI (`CI=true`), When `DATABASE_URL` vắng, Then hai tệp dùng DB dịch vụ của `ci-test.yml`; When URL
  tên khác `oneinvest` (vd `oneinvest_ci_scripts_<pid>`), Then nhận — các ca VẪN CHẠY, không bỏ qua.
- **AC-4** Given bản chép bỏ rào của từng tệp, When chạy trần như AC-1, Then lời từ chối biến mất và tệp đi tới chỗ thử nối
  DB. Đây là chứng rào là thứ chặn, không phải một nguyên nhân khác.
- **AC-5** Given DB của riêng lượt (`db/db-thu.sh … --chay`), When chạy hai tệp, Then mọi ca xanh như trước (trừ GT-AC-1 đỏ
  sẵn trên main).
- **AC-6** Given `pipeline/import-s09-danh-ba.test.mjs`, When so với `origin/zcode/zk-s09-test-chong-db-chung` @3cb318df3,
  Then chỉ khác đúng bốn dòng lớp gọi (thêm import `urlCiChoPhep`, chú thích HT35, dòng gọi rào mới; bỏ dòng gọi rào cũ), và commit mang bản vá trên nhánh có cùng tác giả và tiêu đề với 3cb318df3.
- **AC-7** Given bốn lệnh chấm đang chạy `check-freshness.test` trần (`executors.test.scripts`, `check_freshness`,
  `sl_freshness`, `s08l_do`), When đọc `_acceptance/config.yaml` và chạy chúng, Then cả bốn chạy qua `db/db-thu.sh … --chay` và vẫn xanh trên DB của riêng lượt.
- **AC-8** Given hồ sơ, When đọc `bang-phu.md`, Then có đủ 66 tệp rơi về DB chung, mỗi tệp một ô: trong phạm vi · ngoài phạm
  vi kèm vì sao · để lại cho HT36. Thiết kế ghi đề xuất A–B cho HT36.

## Coverage

Trục: tệp (2 trong phạm vi) × URL (vắng · tên `oneinvest` bốn cách viết · suite · `ci_scripts`) × môi trường (ngoài CI · CI=true)
× rào (có · bỏ). AC-1 phủ ô ngoài CI × {vắng, oneinvest}. AC-2 phủ CI × oneinvest. AC-3 phủ CI × {vắng (hàm rào + runner GitHub), tên khác oneinvest (chạy thật, 0 bỏ qua)}. AC-4 phủ
rào bỏ. AC-5 phủ suite × có rào. Ô ngoài CI × `ci_scripts` thì từ chối (RV-1). Ô CI × vắng trên một máy có DB chung là giới hạn
đã biết (Notes).

## Out of scope

- 52 tệp có ghi chưa rào và 12 tệp ngoài phạm vi khác (bảng phủ) — HT36.
- Đổi `ci-test.yml` (phương án A) — HT36 (GS bỏ A cho hàng này).
- `pipeline/sync-pii.test.mjs`, `scripts/bao-cao-ngay.test.mjs` — ngoài phạm vi, vì chỉ đọc (soi tay: một SELECT; giao dịch
  read-only).
- Dọn 24 bản thu test trên máy thu — bước 0b của lượt áp DA42, có lời Mạnh riêng.

## Notes

- Giới hạn đã biết: ai tự đặt `CI=true` trên máy mà không đặt URL thì rào nhường và test chạy trên `localhost:5433/oneinvest`.
  Đây cùng luật HT23. Runner CI thật không có DB chung.
