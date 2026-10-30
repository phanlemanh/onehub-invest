---
schema_version: 1
feature: Thẻ duyệt ghép căn và luật chấm đọc trọn các cách ghi phường số
slug: phuong-so
owner: phanlemanh@gmail.com
risk_tier: T2
surfaces: [cli]
status: verified
approved_by: Mạnh
approved_at: 2026-10-31
design_doc: docs/superpowers/specs/2026-10-30-phuong-so-design.md
---

# Acceptance Contract: phuong-so

## Context

Mạnh mở hàng này ở Cổng Bằng chứng `khoa-phuong-chung-phuong-so` (30/10): «mở hợp đồng mới — gom với «Phường 01»,
«P12», slug phuong-12 thành một hàng «phường số»». Sau vòng trước, khoá phường chỉ còn số nên «Phường 01», «P12», slug
`phuong-12` Lệch với «Phường 12», còn «Xã 12», «Thị trấn 12», «12» trần lại Khớp.

Source input: `opportunity.md` · `_acceptance/khoa-phuong-chung-phuong-so/decisions.jsonl` (Ngoài-2, Ngoài-3) · vùng:
`app/src/lib/ops/review-can-cu.ts`, `agent/src/agents/judge-entity.ts`, `app/tests/the-duyet-phuong-lech-gia.test.tsx`,
`agent/tests/judge-nguong.test.ts`.

## Criteria

- AC-1: Given hai tin ghi phường số theo hai kiểu, When dựng bảng so của thẻ ghép căn, Then hàng Phường «Khớp» khi cùng
  cấp và cùng số («Phường 01» với «Phường 1», «P12», `phuong-12` hay «P.12» với «Phường 12», «Xã 12» với `xa-12`), và
  «Lệch» khi khác cấp («Xã 12», «Thị trấn 12», «12» trần với «Phường 12») hay khác số («Phường 1» với «Phường 12»).
- AC-2: Given hai tên phường bất kỳ trong ma trận viết trước (mọi ô của hồ sơ `khoa-phuong-chung-phuong-so` cùng các cặp
  của AC-1), When luật ghép căn so phường, Then kết luận «cùng / khác / thiếu phường» của luật trùng nhãn Khớp / Lệch /
  Thiếu của thẻ duyệt (`app/src/lib/ops/review-can-cu.ts`, đọc từ tệp thật).
- AC-3: Given hai tin số đo khớp, cùng loại, When máy chấm, Then «Phường 01» với «Phường 1» ra `yes` với lý do «cùng
  phường»; «Xã 12» với «Phường 12» ra `no` với lý do «khác phường».
- AC-4: Given các ca đã ký khác của thẻ duyệt phường (tên chữ khác cách viết, khác phường, trống hay chỉ tiền tố → Thiếu,
  chín hàng còn lại so như cũ) và ma trận luật của `judge-nguong-la-code`, `judge-giu-quyet-dinh-nguoi`, When chạy lại,
  Then kết quả như trước vòng.

## Coverage

Trục quét (preset entity-feature, làm tay vì chỉ có hai trục nhỏ): **dạng tên phường số** {cấp: phường · xã · thị trấn
· không ghi} × {cách ghi: chữ có dấu · viết tắt «P.»/«P» · slug} × {số: số 0 đầu · số khác · số này là đầu số kia} ×
**bề mặt** {thẻ duyệt · luật chấm}.

- Dạng tên × thẻ duyệt → AC-1 (ma trận viết trước, hai chiều).
- Dạng tên × luật chấm → AC-2 (trùng nhãn thẻ trên cùng ma trận), AC-3 (đầu-cuối ra `yes`/`no`).
- Phần không đổi → AC-4 (các ca đã ký khác vẫn xanh).
- Thước CE: số assert = số ô viết trước × 2 chiều; mỗi phép đo có đối chứng đỏ cùng fixture, thông điệp ghim.

## Out of scope

- Phường có chữ sau số («12A», «12 bis») — vẫn so như tên chữ.
- Phân biệt phường cùng số ở hai quận (thẻ không có hàng Quận).
- «Phương 12» (gõ sai dấu tiền tố) — vẫn Lệch với «Phường 12».
- Viết tắt cấp xã / thị trấn («TT.12», «X.12») — chưa dạy; đi đường so tên chữ như trước vòng.
- Chấm lại thẻ cũ trên DB `oneinvest` (việc vận hành sau gộp).

## Notes

- Ba eval đã ký bị thay khi hồ sơ này được ký: `khoa-phuong-chung-phuong-so/E1` → AC-1, `/E2` → AC-2, `/E3` → AC-3
  (bảng ở design doc §4).
