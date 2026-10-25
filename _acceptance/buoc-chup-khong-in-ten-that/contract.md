---
schema_version: 1
feature: "Bước chụp trang của kho gặp lỗi ở bất kỳ bước nào cũng không in hay đặt tên nguồn thật ra ngoài tiến trình, và không ghi ảnh khi chưa che xong tầng A"
slug: buoc-chup-khong-in-ten-that
owner: phanlemanh@gmail.com
risk_tier: T2
surfaces: [script]
status: implemented
veto_state: mo
veto_opened_at: 2026-10-25T01:47:00Z
design_doc: docs/superpowers/specs/2026-10-25-buoc-chup-khong-in-ten-that-design.md
approved_by:
approved_at:
---

# Acceptance Contract: buoc-chup-khong-in-ten-that

## Context

`scripts/ui-capture-login.mjs` (bước chụp `capture.ui` của kho) nhúng danh sách tên nguồn thật vào argv của
`playwright-cli eval`; lệnh ấy lỗi thì Node in nguyên argv — kèm tên thật — ra stderr, và đầu ra bước chụp hay được dán vào
bằng chứng của kho công khai (luật 6, ADR-0007). Vòng này giữ tên thật trong tiến trình Node, bọc mọi lệnh con bằng lời
lỗi chung đã xoá tên, và dọn tệp tạm ở mọi đường thoát. Cổng Đáng `build`: giám sát đợt `dot0-cam-mau` (P4-22) theo lựa
chọn «Ngoài-9: mở hợp đồng mới» của Mạnh ở Cổng Bằng chứng `hieu-chuan-mot-bo-so` 25/10.

Source input: `_acceptance/buoc-chup-khong-in-ten-that/opportunity.md`.

## Criteria

- AC-1: Given danh sách tên tầng A khác rỗng, When bước chụp chạy một URL `/ops/**`, Then không đối số nào của mọi lệnh
  `playwright-cli` nó gọi chứa một tên trong danh sách.
- AC-2: Given trang còn hiện một tên tầng A trong chữ hoặc trong một thuộc tính (ngoài `<script>`/`<style>`), When bước che
  chạy xong, Then bước chụp thoát mã 5, lời chỉ nêu số tên còn lộ, và không lệnh chụp ảnh nào được gọi.
- AC-3: Given một tên chỉ nằm trong phần tử `[data-tier-a]` (trong chữ và trong thuộc tính `title` của nó), When bước che
  chạy, Then phần tử ấy được che, bước chụp không báo lộ và ảnh được ghi.
- AC-4: Given một lệnh con của bước chụp lỗi (mở trang, nạp phiên, eval che, eval đọc chữ, đo bề rộng, chụp), When lỗi xảy
  ra, Then bước chụp thoát mã 7 với lời «bước chụp lỗi ở «<bước>»», không ảnh, và toàn bộ stdout + stderr không chứa tên
  tầng A, mật khẩu hay giá trị cookie phiên nào — kể cả khi stderr của lệnh con lặp lại tên. Kết quả eval đọc chữ không đọc
  được (thiếu khối kết quả, không parse được) cũng là lỗi bước «eval đọc chữ» → mã 7, không bao giờ là «không lộ».
- AC-5: Given bước chụp kết thúc ở bất kỳ đường nào (thành công, lộ tầng A, lệnh con lỗi, nguồn danh sách tên lỗi), When
  tiến trình trả mã, Then không còn tệp tạm nào chứa danh sách tên hay phiên đăng nhập.
- AC-6: Given trình duyệt thật (playwright-cli) và một trang `/ops/x` có tên giả (có dấu, hoa-thường lẫn, có nháy) trong
  chữ, trong thuộc tính, hoặc chỉ trong `[data-tier-a]`, When gọi bước chụp với nguồn tên tiêm qua tham số (không biến môi
  trường nào đổi nguồn tên), Then tên trong chữ/thuộc tính → mã 5 không ảnh; chỉ trong `[data-tier-a]` → mã 0 có ảnh.
- AC-7: Given các ca UC-AC-9/UC-AC-10 của ON10 (đăng nhập, phiên hỏng, chế độ, dòng bề rộng), When chạy lại, Then vẫn xanh.

## Coverage

Bỏ quét morphological-scan — xem dòng `descope` «bỏ coverage-scan» trong `decisions.jsonl`. Trục liệt tay:

- Trục A — chỗ tên có thể lọt: argv lệnh con · stdout/stderr khi lỗi · tệp tạm · chữ/thuộc tính trang → AC-1, AC-4, AC-5, AC-2
- Trục B — bước lỗi: mở · nạp phiên · eval che · eval đọc chữ · đo bề rộng · chụp · nguồn danh sách tên → AC-4, AC-5
- Trục C — trạng thái trang: lộ trong chữ · lộ trong thuộc tính · chỉ trong `[data-tier-a]` · không tên → AC-2, AC-3, AC-6
- Trục D — hồi quy ON10 → AC-7
- Later: kiểm ảnh đã ghi ra tệp; giới hạn origin của đăng nhập.
- Never: gửi danh sách tên vào trang hay qua argv; biến môi trường đổi nguồn danh sách tên.

## Out of scope

- Kiểm tệp ảnh đã được ghi (Ngoài-11, Ngoài-14 của ON10).
- Chặn đăng nhập tới origin ngoài máy (Ngoài-12 của ON10).
- Sửa `scripts/ui-standards/mask-tier-a.js` (dùng chung với phép đo B1/B3).

## Notes
