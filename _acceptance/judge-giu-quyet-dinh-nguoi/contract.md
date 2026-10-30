---
schema_version: 1
feature: Chấm lại ghép căn không đổi thẻ người vừa quyết, và so phường theo cùng khoá với thẻ duyệt
slug: judge-giu-quyet-dinh-nguoi
owner: phanlemanh@gmail.com
risk_tier: T2
surfaces: [cli]
status: implemented
approved_by: Mạnh
approved_at: 2026-10-30
design_doc: docs/superpowers/specs/2026-10-30-judge-giu-quyet-dinh-nguoi-design.md
---

# Acceptance Contract: judge-giu-quyet-dinh-nguoi

## Context

Hai mục ngoài hợp đồng của PL25 mà Mạnh chọn «mở hợp đồng mới» và gom thành một hàng sửa (ký 30/10).
- Ngoài-6: judge-run ghi đè thẻ người vừa quyết trong lúc chấm.
- Ngoài-8: `chuanHoaPhuong` cắt nhầm «Phương …» và bỏ sót tiền tố «Xã», «Thị trấn», «P.» dính liền, nên cùng một phường
  bị luật kết luận cứng «no».

Source input: `opportunity.md` (build, giám sát theo lời ký Mạnh) · `_acceptance/judge-nguong-la-code/review-findings.md`
(Ngoài-6, Ngoài-8) · vùng: `agent/scripts/judge-run.ts`, `agent/src/agents/judge-entity.ts`, `agent/tests/judge-*`.

## Criteria

- AC-1: Given một thẻ ghép căn đang chờ, When người duyệt quyết thẻ (duyệt, bác hay hoãn) sau khi judge-run đã đọc thẻ và
  trước khi ghi kết quả chấm, Then thẻ giữ nguyên mọi cột như lúc người vừa quyết, và lượt chạy đếm cặp ấy là «bỏ qua»
  chứ không phải «cập nhật».
- AC-2: Given một cặp có hai thẻ đang chờ ghi hai chiều, When người quyết một thẻ giữa lúc chấm, Then cả hai thẻ giữ
  nguyên (thẻ đã quyết như lúc người quyết, thẻ còn chờ như trước lượt chấm) và lượt chạy đếm cặp ấy là «bỏ qua» — cùng
  luật «người đã quyết cặp này thì không sửa» của judge-run.
- AC-3: Given thẻ đang chờ không ai đụng trong lúc chấm, When judge-run chạy, Then thẻ vẫn được cập nhật tại chỗ với kết
  luận luật và phần chấm như trước.
- AC-4: Given hai tên phường bất kỳ trong ma trận tên viết trước, When luật ghép căn so phường, Then kết luận «cùng /
  khác / thiếu phường» của luật trùng nhãn Khớp / Lệch / Thiếu của hàng Phường trên thẻ duyệt
  (`app/src/lib/ops/review-can-cu.ts`, đọc từ tệp thật).
- AC-5: Given hai tin số đo khớp, cùng loại, ghi cùng một phường theo hai kiểu khác nhau («Phương Liệt» với «Phường Phương
  Liệt», «Xã Kim Chung» với «kim-chung», «P.Bến Nghé» với «Phường Bến Nghé», «Thị trấn Đông Anh» với «Đông Anh»), When máy
  chấm, Then kết luận là `yes`; hai phường khác nhau thật («Phương Liệt» với «Phương Mai») vẫn ra `no`.

## Coverage

Trục quét (morphological-scan, preset entity-feature): **trạng thái thẻ lúc ghi** {chờ suốt · bị quyết giữa chừng ×
(duyệt · bác · hoãn) · hai chiều, một bị quyết} × **dạng tên phường** {tiền tố Phường · Xã · Thị trấn · «P.» có cách ·
«P.» dính liền · tên mở bằng Phương/Phượng · slug · chỉ số · chỉ tiền tố · thiếu một bên}.

- Trạng thái thẻ → AC-1 (bị quyết giữa chừng, ba trạng thái), AC-2 (hai chiều), AC-3 (chờ suốt).
- Dạng tên phường → AC-4 (ma trận đối chiếu với thẻ duyệt), AC-5 (đầu-cuối qua luật).
- Thước CE: số assert ma trận = số ô viết trước; mỗi phép đo có đối chứng đỏ cùng fixture, thông điệp ghim.

## Đường đo

- «Thẻ người đã quyết không bị máy đổi»: test AC-1/AC-2 đổi trạng thái thẻ giữa lúc đọc và lúc ghi trên DB thử; AC-1,
  AC-2 bảo đảm.
- «Luật và thẻ nói cùng một điều về phường»: test AC-4 chạy cùng ma trận qua hàm rút từ tệp app; AC-4 bảo đảm.

## Out of scope

- Bộ đếm «thẻ mới» khi `ON CONFLICT DO NOTHING` không chèn (Ngoài-7 PL25: chấp nhận, không sửa).
- Thẻ cũ mất tin gốc khỏi `sale_offers` (Ngoài-1 PL25: Known limits).
- Sửa `khoaPhuong` / `soPhuong` của app, kể cả luật khoá phường chỉ có số («Phường 12» với «P.12» vẫn là Lệch).
- Chạy judge-run thật trên DB `oneinvest` (việc vận hành sau gộp).

## Notes
