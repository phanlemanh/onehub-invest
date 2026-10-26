---
schema_version: 1
feature: Ca «AER-AC-2 không lệnh nào đổi nghĩa» so cặp commit cố định của vòng sửa config.yaml thay vì merge-base origin/main, để PR khác thêm, sửa hay xoá khoá trong _acceptance/config.yaml không bị CI chặn nhầm
slug: aer-ac2-so-cap-co-dinh
owner: phanlemanh@gmail.com
risk_tier: T2
surfaces: [script]
status: implemented
veto_state: mo
veto_opened_at: 2026-10-26T13:55:00Z
approved_by:
approved_at:
---

# Acceptance Contract: aer-ac2-so-cap-co-dinh

## Context

Mục Ngoài-1/Ngoài-2 ở Cổng Bằng chứng của `auth-error-thu-lai-retry` (Mạnh chọn «mở hợp đồng mới», 26/10): ca «AER-AC-2
không lệnh nào đổi nghĩa» trong `scripts/auth-error-thu-lai-retry.test.mjs` so `config.yaml` của cây đang kiểm với bản ở
merge-base(HEAD, origin/main). Bộ `scripts/*.test.mjs` chạy ở CI mọi PR, nên sau khi PR #137 vào main, PR nào thêm/sửa/xoá
khoá trong `config.yaml` sẽ đỏ dù việc đó hợp lệ. Bất biến «không lệnh nào đổi nghĩa» chỉ thuộc MỘT lần sửa (commit
`5e396cb2` của `auth-error-thu-lai-retry`), nên phép so phải ghim vào cặp blob cố định đó.

## Acceptance criteria

- AC-1: Given một PR khác thêm (hoặc sửa, xoá) một khoá trong `_acceptance/config.yaml`, When chạy `node --test
  scripts/*.test.mjs`, Then ca «AER-AC-2 không lệnh nào đổi nghĩa» không đỏ — nó so `config.yaml` ở `5e396cb2^` với ở
  `5e396cb2` (hai blob git cố định) và không đọc cây đang kiểm hay merge-base.
- AC-2: Given cặp blob `5e396cb2^` → `5e396cb2`, When so bằng bộ đọc của kit trên HỢP tập khoá hai bản, Then 0 khoá khác
  giá trị; và bản «sau» bị đổi giá trị một lệnh hoặc xoá hẳn một khoá thì bộ so gọi đúng khoá đó.

## Coverage

Bỏ quét không gian tiêu chí — xem dòng sổ `descope` «bỏ coverage-scan».

## Out of scope

- OOS-1: Không đổi hai ca còn lại của AC-2 cũ («YAML chuẩn», «bộ đọc kit khớp bộ đọc chuẩn») — chúng đọc HEAD và là bất biến
  hợp lệ của tệp cấu hình.
- OOS-2: Không sửa `_acceptance/config.yaml` hay hồ sơ `auth-error-thu-lai-retry`.

## Notes

- Nhánh cắt từ đỉnh PR #137 (`010864a5`); PR này base main nên gồm cả #137 — giám sát merge #137 và bản sửa liền nhau.
