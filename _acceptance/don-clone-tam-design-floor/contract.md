---
schema_version: 1
feature: Bộ test design-floor dọn mọi thư mục tạm nó tạo (clone sau-gộp, bản chép, cap-config, reuse-plan) khi tiến trình thoát, để mỗi lượt chạy không bỏ lại rác trong TMPDIR
slug: don-clone-tam-design-floor
owner: phanlemanh@gmail.com
risk_tier: T2
surfaces: [script]
status: draft
approved_by:
approved_at:
design_doc: docs/superpowers/specs/2026-10-29-don-clone-tam-design-floor-design.md
---

# Acceptance Contract: don-clone-tam-design-floor

## Context

Ngoài-1 của `m2-ac10-so-cap-co-dinh`: ca clone sau-gộp không dọn bản clone (~118MB mỗi trạng thái, ~350MB mỗi lượt). Đo
trên máy 29/10: còn 18 `sau-gop-*`, 687 `design-floor-*`, 298 `cap-config-*`, 18 `reuse-plan-*` — cả bốn chỗ tạo thư
mục tạm của `scripts/design-floor/` đều không dọn. Hàng do Mạnh duyệt («Duyệt cả 8», 29/10).

## Acceptance criteria

- AC-1: Given `TMPDIR` trỏ một thư mục rỗng mới và nhật ký `tempDir` bật (biến môi trường trỏ một tệp ngoài `TMPDIR`),
  When chạy `node --test` TẤT CẢ tệp `scripts/design-floor/*.test.mjs` kể cả `tmp-sach.test.mjs` (lượt lồng chỉ bỏ đúng
  ca của tiêu chí này để không đệ quy), Then lệnh thoát 0; đầu ra có dòng `ok` không mang `# SKIP`/`# TODO` của ca diff M2-AC-10, ca
  sau-gộp (a) và ca AC-2 của tệp đo; nhật ký có đủ bốn tiền tố `sau-gop`, `design-floor`, `cap-config`, `reuse-plan` (thư
  mục đã thật sự được tạo); và sau khi lệnh thoát thư mục `TMPDIR` rỗng.
- AC-2: Given bản clone của kho với các tệp test ở `89730e6b` (main trước hàng) và `TMPDIR` rỗng mới, When chạy cùng lệnh,
  Then `TMPDIR` còn thư mục, và thước của AC-1 gọi tên đủ bốn tiền tố `sau-gop`, `design-floor`, `cap-config`,
  `reuse-plan` (chiều đỏ của cùng thước).
- AC-3: Given một tiến trình test tạo thư mục bằng `tempDir` rồi ném lỗi, When tiến trình thoát (mã khác 0), Then thư mục
  đó đã bị xoá; cùng tiến trình mà tạo bằng `mkdtempSync` trần thì thư mục còn.
- AC-4: Given các tệp `scripts/design-floor/*.mjs`, When quét nguồn, Then không có lời gọi `mkdtempSync(` nào ngoài danh
  sách miễn ĐÓNG viết trước: thân `tempDir` trong `test-helpers.mjs` và đúng một vùng đối chứng của AC-3 trong
  `tmp-sach.test.mjs`, mỗi chỗ khoanh bằng cặp dấu mốc; bản sao có chèn một lời gọi ngoài hai vùng (kể cả trong
  `tmp-sach.test.mjs`) thì thước gọi đúng `<tệp>:<dòng>`.
- AC-5: Given HEAD của nhánh, When chạy `node --test scripts/design-floor/*.test.mjs`, Then thoát 0; mọi tên ca của các
  tệp test tại `89730e6b` vẫn còn.

## Coverage

Bỏ quét không gian tiêu chí — xem dòng sổ `descope` «bỏ coverage-scan». Trục tự kê: năm nguồn thư mục tạm — bốn nguồn
cũ và chính tệp đo (AC-1 chạy cả `tmp-sach`, đối chứng AC-2) × cách tiến trình kết thúc (xanh AC-1, ném lỗi AC-3) × đường
mới tạo thư mục trần (AC-4) × không hạ thước (AC-5). Phạm vi bốn nguồn hay chỉ bản clone: Hỏi-1 ở Cổng Phạm vi.

## Out of scope

- OOS-1: Không xoá các thư mục rác đang có trên máy từ những lượt trước — xoá dữ liệu trên máy người dùng; lệnh dọn tay
  nêu trong mô tả PR.
- OOS-2: Không dọn khi tiến trình bị SIGKILL (`process.on('exit')` không chạy) — giới hạn đã biết.
- OOS-3: Không đổi bộ test ngoài `scripts/design-floor/`, không nối CI.

## Notes

- Ranh giới hàng: `scripts/design-floor/**`.
