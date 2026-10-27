---
schema_version: 1
feature: thước baseline UI của ui-standards-reui theo kịp các đợt dọn — tệp mẫu suy từ suppressions, tài liệu baseline so lần đo mới nhất
slug: ui-standards-reui-thuoc-loi-thoi
owner: phanlemanh@gmail.com
risk_tier: T2
surfaces: [cli]
status: implemented
veto_state: mo
veto_opened_at: 2026-10-27T05:58:12Z
approved_by:
approved_at:
design_doc: docs/superpowers/specs/2026-10-27-ui-standards-reui-thuoc-loi-thoi-design.md
---

# Acceptance Contract: ui-standards-reui-thuoc-loi-thoi

## Context

Căn cứ: hàng `ui-standards-reui-thuoc-loi-thoi` của đợt dieu-phoi-dot0-cam-mau (P4, giám sát thêm 27/10 ~01:10Z theo P4-57). E7
`ui_baseline_guard` và E12 `ui_baseline_doc` của hồ sơ đã ký `ui-standards-reui` đỏ sẵn trên main: E7 viết cứng tệp mẫu đã hết mục
suppress; E12 đòi ba con số bằng 138 trong khi nay 16/12 và tài liệu là nhật ký 138 → 131 → 85. Việc: khai superseded_by và cập nhật
thước + tài liệu; không nới luật ReUI.

## Criteria

- AC-1: Given `eslint-suppressions.json` hiện tại, When chạy `node eslint-plugin-onehub-ui/selftest.mjs baseline-guard`, Then tệp mẫu
  là tệp `.tsx` đầu tiên có mục suppress của một luật có mẫu vi phạm, thêm một vi phạm CÙNG luật làm eslint đỏ nêu luật đó, và
  selftest PASS; trên bản sao app tạm: suppressions không còn tệp `.tsx` → đỏ «còn tệp .tsx có mục suppress»; count của (tệp mẫu,
  luật) tăng 1 → đỏ «vượt số đếm suppress».
- AC-2: Given tài liệu `docs/research/ui-baseline-2026-10.md`, When chạy `node scripts/ui-standards/acceptance.mjs baseline-doc`,
  Then lần đo mới nhất (cặp hàng Tổng cuối) bằng hàng Tổng của `lint:ui-report`, cột Baseline = tổng `eslint-suppressions.json`,
  cột Mới = 0, tổng và baseline qua các lần đo không tăng, hai bảng mỗi lần đo khớp — PASS; trên bản chép tài liệu: bỏ mục đo mới
  nhất → đỏ «mục đo mới nhất … lệch báo cáo sống»; baseline một lần đo cũ tăng → đỏ «số baseline tăng»; tổng một lần đo tăng → đỏ
  «tổng vi phạm tăng»; hai bảng lệch → đỏ «hai bảng lệch nhau». Khác lời hứa cũ của E12 (tổng = suppressions): ngoại lệ có lý do
  (`eslint-disable` kèm lý do, luật require-disable-reason) được phép tồn tại ngoài sổ suppress — hiện 4.
- AC-3: Given `_acceptance/ui-standards-reui/evals.yaml`, When đọc bằng `lib/eval-yaml.cjs`, Then E12 có `status: not-run`,
  `superseded_by: ui-standards-reui-thuoc-loi-thoi#AC-2`, cmd giữ nguyên; E7 giữ nguyên (câu hứa đã ký của nó không nêu tên tệp, vẫn
  đúng với thước đã sửa); diff so với origin/main chỉ thêm đúng hai dòng ấy; bộ chứng thay-bởi của kit (`notRunConflicts`) trên bản
  giả lập có hồ sơ này `signed-off` nhận E12 là thay-bởi hợp lệ; bỏ thẻ bắt tay → lý do `thay-khong-nhan`.
- AC-4: Given nhánh so với merge-base của origin/main, When liệt kê tệp đổi, Then không đổi `app/eslint-suppressions.json`,
  `app/eslint.config.mjs`, quy tắc của plugin; chỉ có hai thước, tài liệu baseline, evals.yaml (+ ghim lại) của ui-standards-reui,
  hồ sơ này, cấu hình, tệp máy sinh, design/plan.

## Coverage

- Bỏ coverage-scan (dòng sổ descope) — câu giao nêu đích danh hai eval; trục: E7 (AC-1), E12 (AC-2), chuyển lời hứa có chữ ký
  (AC-3), không nới luật (AC-4).

## Thay thế

| Ô eval của hồ sơ đã ký | Thay bởi |
|---|---|
| ui-standards-reui/E12 | ui-standards-reui-thuoc-loi-thoi#AC-2 |

## Out of scope

- Đổi luật lint hay số đếm trong `eslint-suppressions.json` — không nới luật ReUI.
- Sửa câu `expected` của E7/E12 trong hồ sơ đã ký — E12 chuyển bằng superseded_by, E7 giữ sống.
- Tự động thêm mục đo vào tài liệu mỗi lần dọn UI — mỗi đợt dọn tự thêm mục như mục 27/10.

## Notes
