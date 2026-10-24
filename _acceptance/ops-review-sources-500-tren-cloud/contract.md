---
schema_version: 1
feature: /ops/review và /ops/sources trên cloud không còn 500 khi thiếu bảng tầng A — nói rõ chỉ có ở máy local
slug: ops-review-sources-500-tren-cloud
owner: phanlemanh@gmail.com
risk_tier: T2      # hai trang Ops + component nội dung + lib/ops-queries + test; không đụng t3_paths
surfaces: [ui]
status: verified
veto_state: mo
veto_opened_at: 2026-10-24T01:48:00Z
approved_by:
approved_at:
---

# Acceptance Contract: ops-review-sources-500-tren-cloud

## Context

Audit prod 24/10 (giám sát đợt `dot0-cam-mau`, hàng phát sinh dãy P3): `/ops/review` và `/ops/sources` trả 500 trên Vercel —
`relation "review_queue" does not exist` (OPS-1) và `relation "source_registry" does not exist` (OPS-2), 42P01. Hai bảng là
tầng A, chỉ có ở máy local (leak gate). PR #51 đã vá `/ops` và `/ops/collections` bằng `freshnessLocalOnly()` +
`LocalOnlyAlert`; vòng này áp đúng khuôn đó cho hai trang còn lại.

Source input: lời giao của giám sát (cross-session 24/10) + báo cáo audit `audit-ops-prod-2410/BAO-CAO.md` mục OPS-1, OPS-2 —
«sửa đúng khuôn PR #51, local giữ nguyên, test trên schema thiếu bảng, đo prod sau deploy; KHÔNG đổi nhãn/tên nguồn hay tên nhóm».

## Criteria

- AC-1: Given lược đồ tạm trong DB local VẮNG HẲN `review_queue` (như cloud), When render trọn nội dung `/ops/review` sau bước kiểm quyền (`ReviewContent`) với người dùng admin, Then không ném lỗi và trang có đúng một thông báo có tên «Hàng chờ duyệt chỉ có ở máy local»; chiều đỏ: bỏ chốt `localOnlyTable("review_queue")` → ca đỏ mã 42P01.
- AC-2: Given lược đồ VẮNG HẲN `source_registry`, When render trọn nội dung `/ops/sources` sau bước kiểm admin (`SourcesContent`), Then không ném lỗi, đúng một thông báo «Nguồn dữ liệu chỉ quản trị ở máy local», không hiện số mã nguồn hay bảng giải mã; chiều đỏ: bỏ chốt → ca đỏ mã 42P01.
- AC-3: Given lược đồ CÓ `review_queue` và `source_registry` (bảng rỗng), When render hai nội dung trên, Then không hiện thông báo nào, hàng chờ hiện «Queue trống» và trang nguồn hiện «0 mã nguồn» — đường local giữ nguyên; và toàn bộ test app/scripts sẵn có vẫn xanh.

## Coverage

Bỏ quét hình thái — sự cố hai trang × bảng vắng/có, xem dòng `bỏ coverage-scan` trong sổ. Ma trận: {`/ops/review`, `/ops/sources`}
× {bảng vắng (AC-1, AC-2), bảng có rỗng (AC-3)}.

## Out of scope

- Mọi lỗi khác của báo cáo audit (OPS-3 trở đi: lockdown, nhãn, tên nguồn/nhóm…) — đang cắt thành lộ trình riêng.
- Ẩn mục Hàng chờ duyệt / Nguồn dữ liệu khỏi thanh bên ở bản cloud.

## Notes

- Đo prod sau deploy (ego lite còn phiên ops, chỉ đọc) — làm sau khi gộp, kết quả báo giám sát; không phải eval máy.
