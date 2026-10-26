---
schema_version: 1
feature: Ô E2 đã ký của auth-error-thu-lai-retry được thay bởi một tiêu chí tả đúng ba ca AC-2 hiện có (YAML chuẩn, bộ đọc kit khớp bộ đọc chuẩn, so trước-sau trên cặp commit cố định) — sổ hồ sơ hết lệch với code
slug: auth-error-e2-superseded
owner: phanlemanh@gmail.com
risk_tier: T2
surfaces: [script]
status: implemented
veto_state: mo
veto_opened_at: 2026-10-26T15:12:00Z
approved_by:
approved_at:
---

# Acceptance Contract: auth-error-e2-superseded

## Context

Mục Ngoài-1 ở Cổng Bằng chứng của `aer-ac2-so-cap-co-dinh` (Mạnh chọn «mở hợp đồng mới», 26/10): ô
auth-error-thu-lai-retry/E2 (đã ký) còn tả vế «không lệnh nào đổi nghĩa» là so `config.yaml` ở merge-base(HEAD, origin/main)
với cây đang kiểm, trong khi `scripts/auth-error-thu-lai-retry.test.mjs` nay so cặp blob cố định `5e396cb2^ → 5e396cb2`.
Hồ sơ này là hồ sơ thay theo cơ chế `superseded_by` (kit 2.24): AC-1 tả đúng cả ba ca, ô cũ khai `status: not-run` +
`superseded_by: auth-error-e2-superseded#AC-1`. Không sửa chữ của hồ sơ đã ký nào.

### Bảng eval cũ → AC mới

| Eval cũ | Tiêu chí mới |
|---|---|
| auth-error-thu-lai-retry/E2 | auth-error-e2-superseded#AC-1 |

## Acceptance criteria

- AC-1: Given `_acceptance/config.yaml` và `scripts/auth-error-thu-lai-retry.test.mjs` ở HEAD, When chạy `node --test
  scripts/*.test.mjs`, Then ba ca của AC-2 cũ đều xanh: (a) bộ đọc YAML chuẩn (khoá duy nhất) đọc `config.yaml` không lỗi,
  chiều đỏ gọi đúng `MULTILINE_IMPLICIT_KEY` và `DUPLICATE_KEY`; (b) với mọi khoá `executors.<loại>.<tên>`, bộ đọc của kit ra
  đúng giá trị bộ đọc chuẩn, chiều đỏ gọi đúng khoá lặp khác giá trị; (c) so `config.yaml` ở `5e396cb2^` với ở `5e396cb2`
  trên hợp tập khoá → 0 khoá khác giá trị, chiều đỏ gọi đúng khoá bị đổi giá trị hay bị xoá, và thêm khoá ở cây đang kiểm
  không làm ca này đỏ.
- AC-2: Given `_acceptance/auth-error-thu-lai-retry/evals.yaml`, When đọc bằng bộ đọc của kit, Then ô E2 khai
  `status: not-run` và `superseded_by: auth-error-e2-superseded#AC-1`, `cmd` giữ nguyên.

## Coverage

Bỏ quét không gian tiêu chí — xem dòng sổ `descope` «bỏ coverage-scan».

## Out of scope

- OOS-1: Không đổi `scripts/auth-error-thu-lai-retry.test.mjs` hay `_acceptance/config.yaml`.
- OOS-2: Không sửa chữ hợp đồng, báo cáo hay các ô khác của `auth-error-thu-lai-retry` và `aer-ac2-so-cap-co-dinh`.

## Notes

- Thứ tự trong CÙNG PR: hồ sơ này ký Cổng Bằng chứng (hồ sơ thay phải `signed-off`) → ghim lại `auth-error-thu-lai-retry`
  bằng làn máy → `pre-merge-check` sạch → đẩy. Trước khi ký, lưới trước-merge báo `ho-so-thay-chua-ky` — đúng thiết kế.
