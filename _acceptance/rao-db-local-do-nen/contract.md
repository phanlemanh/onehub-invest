---
schema_version: 1
feature: script đo nền hiệu năng chỉ chạy trên DB local — rào assertLocalDatabaseUrl trước mọi lệnh ghi DB
slug: rao-db-local-do-nen
owner: phanlemanh@gmail.com
risk_tier: T2
surfaces: [cli]
status: verified
approved_by:
veto_state: mo
veto_opened_at: 2026-10-29T09:22:00Z
design_doc: docs/superpowers/specs/2026-10-29-rao-db-local-do-nen-design.md
---

# Acceptance Contract: rao-db-local-do-nen

## Context

Ngoài-2 của `do-nen-hieu-nang`: Mạnh chọn «mở hợp đồng mới» ở Cổng Bằng chứng ngày 29/10. Khi `DATABASE_URL` trỏ ra ngoài
máy, `scripts/do-nen-hieu-nang/do.mjs` hiện vẫn tạo tài khoản admin đo, cài extension và reset bộ đếm pg_stat_statements trên
DB đó. Hàng này thêm rào chỉ-DB-local (dùng lại `assertLocalDatabaseUrl` của `scripts/dev-ops-account.mjs`).

## Criteria

- AC-1: Given `DATABASE_URL` trỏ ra ngoài máy theo ba hình dạng (tên miền `db.example.invalid`, IP `203.0.113.1`, URL local
  mang `?host=db.example.invalid`), When chạy `node scripts/do-nen-hieu-nang/do.mjs`, Then mỗi ca thoát ≠ 0 trong dưới 5 giây,
  và stderr mang đúng thông điệp của rào («chỉ chạy trên Postgres local» cho hai ca đầu, «ghi đè host» cho ca thứ ba).
- AC-2: Given `DATABASE_URL` local ở một cổng không có DB, theo ba dạng (`postgres://localhost:1`, `postgres://127.0.0.1:1`,
  `postgresql://localhost:1`), When chạy `do.mjs`, Then rào cho qua cả ba: lỗi là ECONNREFUSED và stderr không có thông
  điệp của rào.
- AC-3: Given mã `do.mjs` đã bỏ comment, When soát thứ tự, Then lời gọi `assertLocalDatabaseUrl(DB_URL)` đứng trước mọi chỗ
  mở kết nối (`new pg.Client`, `new pg.Pool`, `new Client`, `new Pool`, `.connect(`) và mọi lệnh ghi (`ensureAccount(`,
  `pg_stat_statements_reset`, `CREATE EXTENSION`). Hai bản chép đột biến cùng thư mục: (a) bỏ dòng rào, chạy với tên miền
  ngoài → stderr có ENOTFOUND/getaddrinfo và không có thông điệp rào, đầu dò in «RAO VANG»; (b) chèn `new pg.Pool(` phía
  trên dòng rào → đầu dò soát thứ tự ra «THU TU SAI».
- AC-4: Given app đã `next build` và DB local :5433, When chạy phép đo 5 trang của hồ sơ `do-nen-hieu-nang`, Then vẫn 5/5
  trang 20/20 lượt đúng trang và mật khẩu ops-test không đổi (rào không chặn DB local).
- AC-5: Given nhánh so với merge-base của origin/main, When liệt kê tệp đổi, Then chỉ có `scripts/do-nen-hieu-nang/do.mjs`,
  hồ sơ này, `_acceptance/config.yaml`, design/plan của hàng và tệp máy sinh (`PRODUCT-MAP.md`, `LO-TRINH.html`);
  `scripts/dev-ops-account.mjs` và mọi tệp của hồ sơ đã ký `do-nen-hieu-nang` không đổi.

## Coverage

- Bỏ coverage-scan (dòng sổ descope): câu giao nêu đích danh một rào và một ca đỏ. Trục: chặn ngoài máy theo ba hình dạng
  (AC-1), cho qua local theo ba dạng (AC-2), rào đứng trước mọi kết nối và lệnh ghi (AC-3), đo trên local không đổi (AC-4), phạm vi (AC-5).

## Out of scope

- Các Known limits khác của do-nen-hieu-nang (CREATE EXTENSION ngoài migration, nuốt lỗi next start, cột byte UTF-16).
- Sửa `scripts/dev-ops-account.mjs` hay mở rộng rào cho script khác.
- Đổi số nền đã ghi trong `docs/research/do-nen-hieu-nang-2610.*`.

## Notes

- Không có câu hỏi chờ người ở bước thiết kế; mọi lựa chọn có căn cứ trong sổ quyết định.
- Known limits — thu phạm vi AC-5 sau S4 round 1 (giám sát duyệt lối 1 của P4-71, 29/10; làn V, Mạnh giữ quyền veto):
  - Bằng chứng do-nen-hieu-nang đo trên do.mjs trước rào: hồ sơ đã ký ấy không ghim lại được trên nhánh này vì eval phạm vi
    (E6) của nó đo diff nhánh; lưới trước-gộp chạy không `--base` sẽ báo nó hoá cũ, CI chạy có `--base` nên không chặn.
    Rào không đổi phép đo trên DB local — E4 của hồ sơ này chạy lại phép đo 5 trang.
