---
schema_version: 1
feature: Phần cloud của 060 không làm gãy sync — cloud giữ sellers là bảng, sync dừng có tên khi bảng đích là view, tệp catch-up cloud 060 không DDL
slug: sellers-view-len-cloud
owner: phanlemanh@gmail.com
risk_tier: T3
surfaces: [cli]
status: approved
approved_by: Mạnh
approved_at: 2026-10-31
design_doc: docs/superpowers/specs/2026-10-31-sellers-view-len-cloud-design.md
---

# Acceptance Contract: sellers-view-len-cloud

## Context

Hàng P4 (giám sát giao 31/10) từ Ngoài-2 Mạnh chọn «mở hợp đồng mới» ở Cổng Bằng chứng SD3: trên Supabase `sellers` là
đích ghi của `sync-cloud.mjs`, 060 đổi `sellers` máy thu thành view. 060 đã áp máy thu 31/10; chưa áp gì lên cloud. Lệ kho:
phần cloud của migration nằm ở `docs/ops/cloud-schema-catchup-*.sql`, Mạnh duyệt rồi mới chạy.

## Criteria

- AC-1: Given bảng đích cloud của FILL, When pha catalog của sync đọc kiểu bảng (`relkind`), Then chỉ bảng thường (`r`) và
  bảng phân vùng (`p`) qua; mọi kiểu khác (view `v`, materialized view `m`, bảng ngoại `f`) làm cả lượt sync dừng ở pha
  catalog, trước khi gửi staging, với thông điệp gọi tên bảng và trỏ tệp catch-up 060; bảng FILL vắng trên cloud giữ đúng
  lỗi «cloud thiếu bảng» có sẵn — trên ma trận viết trước mỗi kiểu một ô.
- AC-2 (cross-layer): Given DB thử đứng vai cloud, When chạy câu kiểm kiểu bảng thật của sync, Then `sellers` là view (sau
  060) → dừng có tên; dựng `sellers` bằng DDL thật của `022_chotot_source.sql` trong giao dịch → qua; và lượt chèn kiểu tráo
  bảng vào view thì lỗi (đối chứng: chốt chặn trước một lỗi có thật).
- AC-3 (cross-layer): Given DB thử sau 060 (máy thu, `sellers` là view), When sync đọc `sellers` bằng câu đọc thật, Then ra
  đúng các cột của danh sách cho phép, không cột `name`, số dòng bằng số dòng view.
- AC-4: Given tệp `docs/ops/cloud-schema-catchup-2026-10-31-060.sql`, When đọc và chạy khối ĐO TRƯỚC trên DB thử đứng vai
  cloud, Then khối ĐO TRƯỚC trả `sellers` là bảng, đủ cột cho phép, không có `registry_aliases`; dựng `sellers` là view hoặc
  thêm `registry_aliases` thì đầu ra khác và gọi tên chỗ lệch; khối ÁP không có câu nào tạo view, xoá bảng hay chép 060.
- AC-5: Given các test sync-cloud có sẵn, When chạy, Then xanh (đồng bộ không đổi hành vi ngoài chốt mới).
- AC-6: Given nhánh so merge-base, When liệt kê tệp đổi, Then chỉ trong vùng của hàng; không lệnh nào chạy trên Supabase.
- AC-7 (cross-layer): Given DB thử đứng vai cloud có `sellers` dựng bằng DDL thật của 022 và `sync_stage` của 038, When
  đọc dòng từ view máy thu bằng câu đọc thật rồi chạy câu tráo bảng thật (`buildSwapSql`) cho `sellers` trong giao dịch,
  Then lượt tráo thành công, số dòng bằng view, khoá `phone_hash` không trùng; một dòng trùng khoá trong staging → lượt
  tráo lỗi.
- AC-8: Given danh sách cột cho phép lên cloud, When liệt kê mọi cột mang khoá người bán (`*phone_hash`), Then mọi bảng chứa
  chúng đều trong FILL — đổi khoá đi trọn trong một lượt tráo, không bảng cloud nào giữ khoá cũ mồ côi.

## Coverage

- Trục **kiểu bảng đích cloud** (bảng · bảng phân vùng · view · materialized view · bảng ngoại · thiếu bảng) — AC-1, AC-2.
- Trục **phía** (đọc máy thu từ view · ghi cloud vào bảng · tài liệu áp cloud) — AC-2, AC-3, AC-7, AC-4.
- Trục **khoá người bán trên cloud** (bảng FILL mang khoá · bảng ngoài FILL) — AC-8.
- Thước CE: Ngoài-2 của `_acceptance/sdt-luu-goc-e164/review-findings.md`; câu tráo bảng thật `buildSwapSql`. Bản quét:
  `coverage-scan.md`.

## Out of scope

- Áp bất cứ gì lên Supabase (Mạnh duyệt riêng sau gộp); sửa header của 060 đã commit.
- Đổi tên bảng cloud, thêm bảng cloud mới, đưa số gốc lên cloud.

## Notes

- Lượt sync đầu sau khi áp 060 lên máy thu tráo trọn sellers, sale_offers, properties trên cloud sang khoá SĐT mới trong một giao dịch (Hỏi-1 SD3: đổi một lần) — không cần DDL cloud; việc ghi đè này là câu hỏi cho người ở Cổng 1 (d-20261031T150425Z-6).
