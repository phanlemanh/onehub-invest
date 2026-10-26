---
schema_version: 1
feature: Khi trang đăng nhập hoặc đăng ký lỗi lúc dựng, nút «Thử lại» tải lại phần trang từ server (retry) thay vì chỉ vẽ lại phía client (reset); _acceptance/config.yaml thành YAML chuẩn
slug: auth-error-thu-lai-retry
owner: phanlemanh@gmail.com
risk_tier: T3
surfaces: [ui]
status: signed-off
design_doc: docs/superpowers/specs/2026-10-26-auth-error-thu-lai-retry-design.md
approved_by: Mạnh
approved_at: 2026-10-26
---

# Acceptance Contract: auth-error-thu-lai-retry

## Context

Mục Ngoài-5 ở Cổng Bằng chứng của `auth-hop-chuan` (Mạnh chọn «mở hợp đồng mới», 26/10): `app/(auth)/error.tsx` gọi
`reset()` — chỉ vẽ lại phía client nên lỗi dữ liệu phía server lặp lại và khách phải tự tải lại trang. Mẫu đúng của kho là
`(marketing)/error.tsx` gọi `retry()` của Next 16. Kèm việc giám sát giao: `_acceptance/config.yaml` thành YAML chuẩn để
công cụ ngoài kit (PyYAML, `yaml`) đọc được.

Hồ sơ này thay ô auth-hop-chuan/E4 (ca AH-AC-4 khẳng định `reset`) bằng AC-1 — ô cũ khai `status: not-run` kèm
`superseded_by: auth-error-thu-lai-retry#AC-1`; bảng «eval cũ → AC mới» ở design doc.

## Acceptance criteria

- AC-1: Given một lỗi ném ra khi dựng trang trong nhóm `(auth)` (lỗi có `digest`), bắt bởi ranh giới lỗi THẬT của Next
  (`ErrorBoundaryHandler`) với `app/(auth)/error.tsx` làm màn lỗi, When khách bấm «Thử lại», Then màn hiện đúng một cảnh
  báo «Không tải được dữ liệu» kèm mã lỗi và đúng một nút «Thử lại»; bấm nút làm Next gọi `router.refresh()` (tải lại phần
  trang từ server) đúng một lần; cây không có thanh điều hướng hay cột bên của vỏ cổng.
- AC-2: Given `_acceptance/config.yaml` ở HEAD, When đọc bằng bộ đọc YAML chuẩn (khoá duy nhất), Then không có lỗi nào;
  với MỌI khoá `executors.<loại>.<tên>`, bộ đọc của kit (`resolveConfigKey`) ra đúng giá trị bộ đọc chuẩn; và bộ đọc của
  kit ra CÙNG giá trị cho mọi khoá ở bản trước vòng (`bc6e5120`) và ở HEAD — không lệnh nào đổi nghĩa.
- AC-3: Given app sau thay đổi, When chạy kiểu + lint của app, Then 0 lỗi kiểu, 0 lỗi lint, và
  `app/eslint-suppressions.json` không có khoá nào dưới `src/app/(auth)/`.
- AC-4: Given hồ sơ đã ký `auth-hop-chuan`, When đọc `evals.yaml` của nó bằng bộ đọc của kit, Then ô E4 khai
  `status: not-run` và `superseded_by: auth-error-thu-lai-retry#AC-1`, AC-1 có trong hợp đồng này, và
  `app/tests/auth-hop-chuan.test.tsx` không còn ca «AH-AC-4».

## Coverage

Bỏ quét không gian tiêu chí — xem dòng sổ `descope` «bỏ coverage-scan».

## Out of scope

- OOS-1: `(app)/error.tsx` và `ops/error.tsx` vẫn gọi `reset` — ngoài câu giao (Ngoài-5 chỉ nói `(auth)`), việc riêng.
- OOS-2: Không đổi `PageError` (`components/states/page-error.tsx`) hay giao diện trang lỗi.
- OOS-3: Không đổi giá trị lệnh nào trong `_acceptance/config.yaml` — chỉ sửa cú pháp.

## Notes

- Ô auth-hop-chuan/E4 → auth-error-thu-lai-retry#AC-1 (cơ chế `superseded_by` 2.24). Thứ tự trong CÙNG PR: hồ sơ này
  ký Cổng Bằng chứng → ghim lại `auth-hop-chuan` bằng làn máy (`repin-lane --write`) → `pre-merge-check` sạch cho cả hai
  hồ sơ → đẩy. Trước khi hồ sơ này ký, lưới trước-merge báo `ho-so-thay-chua-ky` cho `auth-hop-chuan` — đúng thiết kế.
- Known limits — chọn ở Cổng Bằng chứng 2026-10-26:
  - Ngoài-3: Khi config.yaml hỏng cú pháp, chưa có phép kiểm thông báo lỗi ghi đúng mã và số dòng.
- Mở hợp đồng mới (Ngoài-1, Ngoài-2): ca «không lệnh nào đổi nghĩa» so config.yaml với merge-base của main nên chặn nhầm CI của
  PR sau có thêm/sửa khoá — việc riêng: về so cặp commit cố định của vòng + hợp tập khoá.
