---
schema_version: 1
feature: Người duyệt mở thẻ ghép căn và thấy bảng so đọc giá trị sống của hai tin, ô thiếu một bên hiện «Thiếu» chứ không tính là «Lệch»
slug: the-so-doc-gia-tri-song
owner: phanlemanh@gmail.com
risk_tier: T2
surfaces: [ui]
status: signed-off
veto_state: mo
veto_opened_at: 2026-10-30T22:45:24Z
approved_by:
approved_at:
design_doc: docs/superpowers/specs/2026-10-31-the-so-doc-gia-tri-song-design.md
---

# Acceptance Contract: the-so-doc-gia-tri-song

## Context

Hàng HD6 (đợt 2 hàng duyệt), audit `docs/research/audit-hang-duyet-3010.md` H9, H10 và phần hiển thị của H1; Cổng Đáng ở
`opportunity.md`. Bảng so của thẻ ghép căn đọc `evidence` chụp lúc sinh thẻ, nên không thấy tin đã bóc lại hay đã rời kho;
«Chưa rõ» (`unknown`) so với một loại hình thật ra «Lệch», nghiêng người duyệt về «Khác căn».

## Criteria

- AC-1 (cross-layer): Given lược đồ tạm có Tin A và Tin B trong `sale_offers` với cả mười trường khác giá trị trong `evidence` của thẻ, When trang nạp ngữ cảnh (`loadReviewContext`) và dựng thẻ ghép căn, Then mười ô của mỗi bên hiện giá trị đọc từ `sale_offers` làm giá trị chính, và nhãn So của từng hàng tính từ giá trị sống (cặp sống khớp mà evidence lệch ra «Khớp», cặp sống lệch mà evidence khớp ra «Lệch»).
- AC-2: Given một ô có giá trị sống khác giá trị trong `evidence` và một ô giống, When dựng thẻ, Then ô khác hiện thêm dòng «Lúc chấm: <giá trị trong evidence>» trong chính ô đó, ô giống không có dòng đó; tin không đổi gì từ lúc chấm (số đọc từ pg dạng chuỗi, evidence dạng số) thì không ô nào có dòng «Lúc chấm».
- AC-3: Given ma trận loại hình viết trước — Chưa rõ ↔ Nhà riêng, Chưa rõ ↔ Chưa rõ, trống ↔ Nhà riêng, Nhà riêng ↔ Nhà riêng, Nhà riêng ↔ Căn hộ — When so hai bên, Then ba ô đầu ra «Thiếu», ô thứ tư «Khớp», ô cuối «Lệch»; ô Chưa rõ vẫn hiện chữ «Chưa rõ».
- AC-4 (cross-layer): Given thẻ chờ có Tin A không còn trong `sale_offers` (Tin B sống) và ô lý do đã có chữ, When dựng thẻ từ ngữ cảnh nạp thật, Then thẻ hiện Alert «Tin A không còn trong kho» và ba nút «Cùng căn», «Khác căn», «Không chắc» đều bị khoá; Tin B rời kho thì Alert ghi «Tin B không còn trong kho»; cả hai rời kho thì Alert có đúng hai dòng ấy.
- AC-5: Given thẻ có cả hai tin còn trong kho, hoặc thẻ dựng không có ngữ cảnh, When dựng thẻ, Then không có Alert rời kho và nút quyết bật theo ô lý do như trước vòng; thẻ không ngữ cảnh đọc `evidence`.
- AC-6: Given dữ liệu thật trên DB máy thu, When nạp ngữ cảnh mọi thẻ ghép căn và dựng thẻ, Then tập thẻ hiện Alert bên A bằng đúng tập thẻ có Tin A không còn trong `sale_offers` tính độc lập bằng SQL (hôm nay 12 thẻ 22/10, đều đã quyết), và không thẻ nào có cả hai tin sống hiện Alert.
- AC-8 (cross-layer): Given thẻ ĐÃ QUYẾT có Tin A không còn trong `sale_offers`, When dựng thẻ từ ngữ cảnh nạp thật, Then thẻ hiện cùng Alert «Tin A không còn trong kho» và khu trạng thái đã quyết như trước vòng (không nút quyết).
- AC-7: Given hai tệp giao diện của vòng (`review-card.tsx`, `review-compare.tsx`), When chạy design gate của kho, Then không vi phạm nào.

## Coverage

Quét tay ba trục (dòng sổ «bỏ coverage-scan»), mỗi ô một AC:

| Trục | Giá trị | AC |
|---|---|---|
| Nguồn giá trị của ô | sống từ kho · lúc chấm (evidence) · không ngữ cảnh | AC-1, AC-2, AC-5 |
| Nhãn So khi thiếu | Chưa rõ · trống · có giá trị cả hai | AC-3 |
| Tin còn trong kho | hai bên sống · Tin A rời · Tin B rời · cả hai rời · dữ liệu thật | AC-4, AC-5, AC-6 |
| Trạng thái thẻ | chờ quyết · đã quyết | AC-4, AC-8 |
| Giao diện | thành phần và chữ theo luật ReUI của kho | AC-7 |

## Đường đo

| Ngưỡng (opportunity.md) | Đo bằng |
|---|---|
| 12 thẻ cũ hiện Alert ở bên A | AC-6 trên DB máy thu (tập Alert = tập Tin A rời kho, hôm nay 12), AC-8 trên lát thẻ đã quyết |
| Loại hình «Chưa rõ ↔ Nhà riêng» ra Thiếu | AC-3 |

## Out of scope

- Đóng thẻ có tin rời kho bằng luật tất định — hàng P3 `the-ghep-can-tin-roi-kho` (judge-run); route decide không đổi.
- Hàng «Người đăng» trên bảng so — HD7 `the-duyet-hien-nguoi-dang`.
- Sau khi duyệt, sheet tự sang thẻ kế — HD8 `the-duyet-tu-sang-the-ke`.
- Thẻ bổ sung tin (`agent_output`), nhánh viewer và cloud của `/ops/review`.

## Notes

- Known limits — chọn ở Cổng Bằng chứng 2026-10-31:
  - Ngoài-1: Dữ liệu «lúc chấm» trong test dựng tay, không lấy từ nơi sinh thẻ thật — nơi sinh thẻ đổi cách ghi thì test vẫn xanh.
  - Ngoài-2: Test chỉ kiểm ô có chứa giá trị đúng, nên ô dính thêm chữ thừa vẫn qua.
  - Ngoài-3: Với thẻ đã quyết, test chỉ kiểm ba nút quyết đã biến mất, chưa kiểm khu trạng thái đã quyết còn hiện.
