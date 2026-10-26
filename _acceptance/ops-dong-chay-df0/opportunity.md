---
schema_version: 1
slug: ops-dong-chay-df0
feature: Người vận hành mở /ops/data-flow ở máy thu và thấy dòng chảy bài → tin → căn, chất lượng từng chặng và bậc nghiêm của từng tin; cột «bài thô» S03 không lẫn bài S05 và bài thử
owner: phanlemanh@gmail.com
stage: decided
decision: build
decided_by: giám sát theo Mạnh giao trực tiếp 26/10 (phiên local_c87bc280) — «Duyệt cả 5 khuyến nghị ở §5. Commit proto rồi làm DF0»
decided_at: 2026-10-26T10:30:00Z
---

## Vấn đề & ai gặp

Người vận hành không có chỗ nào nhìn được một tin đi từ bài nhận tới căn: mỗi trang Ops thấy một lát (Thu thập đếm
số, Hàng duyệt là thẻ, Căn giá tốt là tín hiệu, Chất lượng là hiệu chuẩn). Hai dòng S03 trên Ops prod («bài thô» và
«tin rao (đã đọc)») gây hiểu nhầm: cột «bài thô» lẫn 100 bài S05 ngày 21/10 và bài nhóm TEST, còn proto gọi mọi tin đã
thành tin rao là B1 dù FRAMING §3.4 đòi đủ năm trường lõi. Người gặp: Mạnh và đội vận hành (FRAMING D2 — người dùng
đầu là đội).

Căn cứ: `docs/superpowers/specs/2026-10-26-ops-dong-chay-du-lieu-ia-design.md` (Mạnh duyệt 5 khuyến nghị §5, 26/10) ·
`docs/product/FRAMING.md` §3.4 · `.acceptance-runs/dieu-phoi-dot0-cam-mau/LUAT.md` mục «Dòng chảy dữ liệu /ops/data-flow».

## Giả định chốt sinh tử

| # | Giả định | Nếu sai thì | Phép thử rẻ nhất | Trạng thái |
|---|---|---|---|---|
| 1 | `sale_offers.post_ids` của S03/S05 nối đúng bài → tin, nên «đọc được» = bài nằm trong post_ids | Chặng đọc được sai, nút thắt «Kẹt · đọc» báo nhầm | Tái dựng phễu bằng parsePost trên DB local, so với số trang | Đã thử 26/10: khớp từng ngày 20–25/10 |
| 2 | Đổi định nghĩa «bài thô» không làm mất bài S03 thật | Cột bài thô trên prod tụt oan | So câu cũ/mới theo ngày trên DB local | Đã thử 26/10: chỉ 21/10 (−100 bài S05) và 20, 22/10 (−1 bài nhóm TEST) đổi |

## Ngưỡng chết / ngưỡng UAT

Không khai — việc quan sát nội bộ của đội vận hành; thước là phép đo máy trên DB local và lượt nhìn trang thật.
