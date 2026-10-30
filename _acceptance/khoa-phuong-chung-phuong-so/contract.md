---
schema_version: 1
feature: Thẻ duyệt ghép căn và luật chấm cùng coi «P.12» là «Phường 12»
slug: khoa-phuong-chung-phuong-so
owner: phanlemanh@gmail.com
risk_tier: T2
surfaces: [cli]
status: implemented
approved_by: Mạnh
approved_at: 2026-10-30
design_doc: docs/superpowers/specs/2026-10-30-khoa-phuong-chung-phuong-so-design.md
---

# Acceptance Contract: khoa-phuong-chung-phuong-so

## Context

Mạnh mở hàng này khi duyệt Cổng Phạm vi `judge-giu-quyet-dinh-nguoi` (30/10): «mở hàng riêng dạy khoá phường chung coi
«P.12» = «Phường 12» cho cả thẻ lẫn luật». Hiện thẻ duyệt và luật chấm cùng so nguyên chuỗi gốc khi tên phường chỉ còn
số, nên «Phường 12» với «P.12» hiện Lệch và luật kết luận «khác phường».

Source input: `opportunity.md` · `_acceptance/judge-giu-quyet-dinh-nguoi/decisions.jsonl` dòng `d-20261030T145946Z-9` ·
vùng: `app/src/lib/ops/review-can-cu.ts`, `agent/src/agents/judge-entity.ts`,
`app/tests/the-duyet-phuong-lech-gia.test.tsx`, `agent/tests/judge-nguong.test.ts`.

## Criteria

- AC-1: Given hai tin ghi cùng một phường số theo hai kiểu («Phường 12» với «P.12», «P. 12» hay « phường 12 »), When
  dựng bảng so của thẻ ghép căn, Then hàng Phường «Khớp»; hai phường số khác nhau («Phường 12» với «Phường 21»,
  «Phường 1» với «Phường 12») vẫn «Lệch», và slug `phuong-12` với «Phường 12» vẫn «Lệch» như trước vòng.
- AC-2: Given hai tên phường bất kỳ trong ma trận viết trước (17 ô chữ và ô thiếu của hồ sơ `judge-giu-quyet-dinh-nguoi`
  cùng các cặp phường số của AC-1), When luật ghép căn so phường, Then kết luận «cùng / khác / thiếu phường» của luật
  trùng nhãn Khớp / Lệch / Thiếu của thẻ duyệt (`app/src/lib/ops/review-can-cu.ts`, đọc từ tệp thật).
- AC-3: Given hai tin số đo khớp, cùng loại, ghi «Phường 12» với «P.12», When máy chấm, Then kết luận là `yes` với lý do
  «cùng phường»; «Phường 12» với «Phường 21» vẫn ra `no` với lý do «khác phường».
- AC-4: Given các ca đã ký khác của thẻ duyệt phường (khác phường theo chữ, trống hay chỉ tiền tố → Thiếu, chín hàng
  còn lại so như cũ) và ma trận luật của `judge-nguong-la-code`, When chạy lại, Then kết quả như trước vòng.

## Coverage

Trục quét (preset entity-feature, làm tay vì chỉ có hai trục nhỏ): **dạng tên phường số** {«Phường N» · «P.N» · «P. N»
· hoa thường và khoảng trắng · slug `phuong-N` · số khác · số này là đầu số kia} × **bề mặt** {thẻ duyệt · luật chấm}.

- Dạng tên × thẻ duyệt → AC-1 (sáu cặp viết trước, hai chiều).
- Dạng tên × luật chấm → AC-2 (trùng nhãn thẻ trên cùng ma trận), AC-3 (đầu-cuối ra `yes`/`no`).
- Phần không đổi → AC-4 (các ca đã ký khác vẫn xanh).
- Thước CE: số assert = số ô viết trước × 2 chiều; mỗi phép đo có đối chứng đỏ cùng fixture, thông điệp ghim.

## Out of scope

- Số 0 đầu («Phường 01» với «Phường 1») — vẫn Lệch.
- «P12» không dấu chấm; slug `phuong-12` coi là «Phường 12».
- Phân biệt phường cùng số ở hai quận (thẻ không có hàng Quận).
- Chấm lại thẻ cũ trên DB `oneinvest` (việc vận hành sau gộp).

## Notes

- Hai eval đã ký bị thay khi hồ sơ này được ký: `the-duyet-phuong-lech-gia/E3` → AC-1,
  `judge-giu-quyet-dinh-nguoi/E4` → AC-2 (bảng ở design doc §4).
