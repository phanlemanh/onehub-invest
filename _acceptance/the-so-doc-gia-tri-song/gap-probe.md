---
slug: the-so-doc-gia-tri-song
at: 2026-10-31T03:00:00Z
verdict: findings
p0: 1
p1: 3
p2: 1
---

## Findings

| Sev | Artifact | Thiếu gì | Kịch bản fail | Thước đo | Xử lý |
|---|---|---|---|---|---|
| P0 | design | Câu «Thẻ này không quyết được…», cách hiện hai bên cùng rời kho và Alert trên thẻ đã quyết là chữ và hành vi máy tự chọn, sổ không ghi | Mạnh ký tưởng chữ từ audit; 12 thẻ đã quyết hiện Alert mà chưa ai duyệt | Dòng sổ Hỏi hoặc trích; ghim chữ ở AC-4 | fixed: bỏ câu máy tự đặt, chỉ dùng chữ audit, mỗi bên một dòng (AC-4/E4 ghim hai dòng); Alert trên thẻ đã quyết trích câu «Bật khi» của audit (12 thẻ cũ đều đã quyết) — dòng sổ mới, thêm AC-8 |
| P1 | evals | E1 assert ô không chứa giá trị evidence, mâu thuẫn dòng Lúc chấm của AC-2 | E1 đỏ dù code đúng, hoặc dòng phụ bị đẩy ra ngoài ô | So chữ ô sau khi bỏ nút Lúc chấm, quan hệ từng ô | fixed: E1 so chữ ô trừ [data-review-luc-cham], và dòng Lúc chấm trong chính ô bằng giá trị evidence |
| P1 | contract | Không AC đo nhãn So tính từ giá trị sống | Ô hiện số sống mà badge vẫn theo evidence (H10) | Ma trận sống khớp/evidence lệch và ngược lại | fixed: AC-1/E1 thêm ma trận hai hàng + chiều đỏ tính So từ evidence |
| P1 | contract | Thiếu trục trạng thái thẻ; E6 không đếm đủ 12, ngưỡng opportunity trống | Thẻ đã quyết không báo rời kho mà E6 vẫn xanh | AC thẻ đã quyết; E6 tập bằng nhau | fixed: AC-8/E8 thẻ đã quyết; E6 deepEqual tập Alert với tập rời kho tính bằng SQL; ghi ngưỡng vào opportunity.md |
| P2 | evals | Fixture evidence viết tay, không ca cùng giá trị khác dạng | numeric pg dạng chuỗi làm mọi ô giá hiện Lúc chấm giả | Tin không đổi thì 0 dòng Lúc chấm | fixed: bộ nạp đổi numeric về số; E2 thêm lát «tin không đổi» (evidence dựng từ chính dòng sale_offers) đếm 0; rejected phần rút từ native.ts: bộ gieo nằm ở gói agent, app không import được |
