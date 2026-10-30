## Ngữ cảnh

- Sản phẩm: onehub-invest, phép đo hằng ngày độ đủ dữ liệu của thẻ ghép căn chờ duyệt (HD11) — chân sản phẩm: audit hàng
  duyệt [SUY-TỪ-REPO: docs/research/audit-hang-duyet-3010.md] §0, §2.3, §3.1, §5.1; luật vai ảnh
  [SUY-TỪ-REPO: app/src/lib/ops/review-media.ts] · chân ngành: kiểm chất lượng dữ liệu một dòng mỗi kiểm × đối tượng
  [NGÀNH: DQO — pipeline/sql/450_dq_checks.sql, ADR-0007].
- Preset: test-matrix.

## Trục

- Trục A — kiểm: rời kho | ảnh vai ops | ảnh vai admin | độ đầy 11 trường [thước CE: audit §5.1 + câu giao]
- Trục B — trạng thái thẻ: chờ | đã quyết | loại khác (agent_output) [thước CE: bật khi «thẻ không còn chờ không đếm»]
- Trục C — bên × nguồn: A/B × S03/S05/S06 [thước CE: audit §1]
- Trục D — đường ra: bảng in | --write | chạy lại trong ngày | cloud-sync | /ops/quality

## Core (≤20%)

1. Thẻ đã quyết không được đếm (AC-1, AC-2).
2. Ảnh tách đúng luật vai (AC-1).
3. Chạy lại trong ngày không nhân dòng (AC-3).
4. Dòng kiểm diễn giải được, không đỏ ON12 (AC-5).

## Later

- Ngưỡng cho độ đầy khi có vài tuần số; người đăng trên bảng so (H14).

## Never

- So số cứng 30/10 — hàng duyệt đã đổi hoàn toàn (12 thẻ cũ đã quyết).
