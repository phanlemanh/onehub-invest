---
schema_version: 1
feature: Thẻ ghép căn do judge-run sinh mang đủ mười trường của bảng so cho cả Tin A và Tin B
slug: judge-evidence-du-truong
owner: phanlemanh@gmail.com
risk_tier: T2
surfaces: [cli]
status: signed-off
veto_state: mo
veto_opened_at: 2026-10-30T23:00:00Z
approved_by:
approved_at:
design_doc: docs/superpowers/specs/2026-10-31-judge-evidence-du-truong-design.md
---

# Acceptance Contract: judge-evidence-du-truong

## Context

Hàng HD1 (đợt `hang-duyet-3010`). Audit hàng duyệt 30/10 (`docs/research/audit-hang-duyet-3010.md` §3.4, H8): thẻ
`entity_match` do `judge-run` (PL25) sinh chỉ ghi 8 khoá mỗi bên, trong khi bảng so của thẻ có mười hàng. Đường, Toà,
Tầng và WC vì thế luôn «Thiếu» ở cả hai bên, kể cả khi tin có giá trị.

Source input: `opportunity.md` · hàng HD1 của `docs/plan/lo-trinh.json` · vùng: `agent/scripts/judge-run.ts`,
`agent/src/tools/native.ts`, `agent/tests/judge-run.test.ts`.

## Criteria

- AC-1: Given cặp `needs_llm` chưa có thẻ, When chạy judge-run, Then mỗi cặp có đúng một thẻ `entity_match` đang chờ
  mang kết luận máy, và `evidence` của Tin A và Tin B mỗi bên có đủ mười khoá của bảng so trên thẻ (đọc từ
  `app/src/lib/ops/review-can-cu.ts`) cùng các khoá thẻ cũ đã có (`offer_id`, `source`, `text` hay `subject`); trường
  tin không có thì khoá vẫn có mặt với giá trị `null`.
- AC-2: Given hai tin trong kho có hoặc không có đường, toà, tầng, số WC, When bộ đánh giá đọc cặp từ kho, Then mỗi bên
  nhận đúng giá trị của chính tin đó (đường, toà, tầng là chữ; số WC là số), và `null` khi tin không có.
- AC-3: Given cặp đã đọc từ kho, When thẻ mới được sinh, Then giá trị bốn trường Đường, Toà, Tầng, WC trên thẻ của mỗi
  bên bằng giá trị bộ đánh giá đọc cho chính bên đó, và bảng so của thẻ dựng từ thẻ ấy hiện đúng giá trị đó ở hàng
  Đường, Toà, Tầng, WC (bên không có giá trị hiện «Thiếu»).
- AC-4: Given thẻ đang chờ được sinh trước vòng (khuôn tám khoá), When chạy lại judge-run, Then dữ liệu hai tin trên
  thẻ không đổi; chỉ phần kết quả chấm được cập nhật như trước vòng.
- AC-5: Given các ca đã ký khác của `judge-nguong-la-code` và `judge-giu-quyet-dinh-nguoi`, When chạy lại, Then kết quả
  như trước vòng (luật chấm không đọc bốn trường mới).
- AC-6: Given một lô cặp `needs_llm` thật chép từ kho local sang DB thử (chỉ đọc kho, kèm các thẻ đang chờ của chúng),
  When chạy judge-run một lượt rồi gieo lại lô (xoá thẻ của lô trên DB thử, chạy lại), Then ở lượt đầu dữ liệu hai tin
  trên mọi thẻ cũ không đổi; ở lượt gieo lại mỗi cặp có đúng một thẻ mới đủ khuôn khoá, và giá trị bốn trường của mỗi
  bên bằng cột của chính tin đó trong kho.

## Coverage

Trục quét (preset entity-feature, làm tay vì chỉ có ba trục nhỏ): **trường** {Đường · Toà · Tầng · WC} × **bên** {Tin A
· Tin B} × **giá trị** {có · null} × **tầng** {đọc từ kho · ghi lên thẻ · thẻ cũ}.

- Trường × bên × giá trị ở tầng đọc → AC-2 (ma trận 16 ô, đo câu SELECT thật trên DB thử).
- Trường × bên × giá trị ở tầng ghi → AC-1 (khuôn khoá) và AC-3 (giá trị).
- Thẻ cũ → AC-4. Phần không đổi → AC-5. Tầng hiện trên bảng so → AC-3 (qua hàm dựng bảng so thật của app).
- Lô thật (ngưỡng `bat_khi` của hàng: «gieo lại một lô thẻ») → AC-6, đo trên bản chép lô thật ở DB thử; không ghi
  vào `oneinvest`.
- Thước CE: số assert = số ô viết trước; mỗi phép đo có đối chứng đỏ cùng fixture, thông điệp ghim.

## Out of scope

- Người đăng mỗi bên (tên, `party_key`, số tin của người đó) — hàng HD13.
- Thẻ đọc giá trị sống từ kho thay vì evidence lúc sinh (H10, đợt 2).
- «Chưa rõ» so ra «Lệch» trên bảng so (H9).
- Luật chấm dùng bốn trường mới để loại trừ — hàng HD2.
- Gieo lại thẻ đang chờ trên chính DB `oneinvest` (việc vận hành sau gộp — ghi dữ liệu thật). Ngưỡng của hàng đo ở
  AC-6 trên bản chép lô thật.

## Đường đo

- Số thẻ mới đủ khuôn khoá trên tổng số thẻ mới của lô gieo lại · từ output E6 (lô `needs_llm` thật chép sang DB thử) ·
  AC-6.
- Số thẻ cũ giữ nguyên dữ liệu hai tin trên tổng số thẻ cũ của lô · từ output E6 · AC-6 (và AC-4 trên fixture).

## Notes

- Known limits — chọn ở Cổng Bằng chứng 2026-10-31:
  - Ngoài-1: sửa phần dùng chung của bộ kiểm (`agent/tests/judge-chung.ts`) không làm bằng chứng E1/E3 bị coi là cũ, vì hai phép đo này chưa khai tệp đó.
  - Ngoài-2: khi lô thật không có thẻ cũ đang chờ, phép đo lô thật báo xanh mà chưa thử việc giữ nguyên thẻ cũ.
- Eval đã ký bị thay khi hồ sơ này được ký: `judge-nguong-la-code/E6` → AC-1 (bảng ở design doc §4).
