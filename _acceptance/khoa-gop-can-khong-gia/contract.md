---
schema_version: 1
feature: Mỗi tin thuộc nhiều nhất một căn, và đổi giá một tin không sinh căn mới
slug: khoa-gop-can-khong-gia
owner: phanlemanh@gmail.com
risk_tier: T3
surfaces: [cli]
status: approved
approved_by: Mạnh
approved_at: 2026-11-13
design_doc: docs/superpowers/specs/2026-11-12-khoa-gop-can-khong-gia-design.md
---

# Acceptance Contract: khoa-gop-can-khong-gia

## Context

DA6 (T3, Cổng Đáng: Mạnh «Làm cả ba» 12/11): khoá Stage A của `pipeline/resolve-properties.mjs` chứa giá, nên tin đổi giá sinh căn
mới và gắn thêm link — trái ADR-0013 câu 3. Số tin gắn hơn một căn đang tăng mỗi lượt resolve: 247 (27/10) → 1.853 (lộ trình,
kiểm kê 11/11) → 2.682 (DB máy thu, đo 12/11). Hàng dọn link thừa bằng migration 098
(giữ căn tạo sớm nhất, nhật ký khôi phục được, UNIQUE trên `offer_id`) và sửa resolver: tin đã gắn giữ căn của nó, cụm chỉ
sinh căn mới khi có tin chưa gắn; khoá cụm giữ nguyên (bỏ giá sẽ gộp nhầm 26.793 căn — đo 12/11).
Thiết kế: `docs/superpowers/specs/2026-11-12-khoa-gop-can-khong-gia-design.md`.

## Criteria

### AC-1 — 098 dọn link thừa, giữ căn tạo sớm nhất, không mất căn
Given DB của riêng lượt chép dữ liệu máy thu, đếm trước bằng câu độc lập: D tin gắn hơn một căn, L link sẽ gỡ, N căn,
When áp `db/migrations/098_khoa_gop_can.sql`,
Then 0 tin gắn hơn một căn; mỗi tin còn đúng link tới căn `created_at` sớm nhất (hoà thì `id` nhỏ) trong các căn nó gắn trước đó;
nhật ký `property_offer_unlinks` có đúng L dòng, mỗi dòng bằng trọn dòng link bị gỡ; số căn vẫn là N và `stable_key` mọi căn
không đổi; D > 0 (dữ liệu thật có lỗi để dọn).

### AC-2 — 098 chạy lại an toàn, ràng buộc chặn link thứ hai
Given AC-1 đã áp,
When áp 098 lần hai, rồi chèn một link thứ hai cho một tin đã có căn,
Then lần hai không lỗi, số dòng `property_offers`, nhật ký và lược đồ không đổi; câu chèn bị từ chối mã 23505 trên ràng buộc
`property_offers_offer_id_key`.

### AC-3 — Khôi phục được từ nhật ký
Given ảnh chụp tập link trước khi áp 098 và nhật ký sau khi áp,
When trong một giao dịch bỏ ràng buộc UNIQUE rồi chèn lại mọi dòng nhật ký,
Then tập `(property_id, offer_id, score, signals, linked_at)` bằng đúng ảnh chụp trước dọn; giao dịch được hoàn lại.

### AC-4 — Chạy resolver hai lần liền không sinh gì thêm
Given DB đã áp 098,
When chạy `chayResolve` hai lần liền,
Then lượt hai tạo 0 căn mới và 0 link mới; sau cả hai lượt 0 tin gắn hơn một căn.

### AC-5 — Đổi giá một tin không sinh căn mới
Given DB đã áp 098 và resolver đã chạy, một tin S06 đã gắn căn,
When đổi giá tin ấy sang bậc làm tròn khác (×1,3) rồi chạy `chayResolve`,
Then 0 căn mới; tin vẫn đúng một link, tới đúng căn cũ.

### AC-6 — Căn có sẵn giữ stable_key
Given DB đã áp 098,
When chạy `chayResolve`,
Then mọi căn có từ trước giữ nguyên `stable_key`; mọi căn `stage-ab` (cũ và mới) mang `stable_key` sáu đoạn như khoá cụm.

### AC-7 — Tin chưa gắn vẫn vào căn đúng khoá, tin đã gắn không đi theo cụm mới
Given dòng mồi tổng hợp dựng bằng chính resolver: một căn có sẵn với tin A; một tin mới B cùng ô, loại, diện tích, bậc giá với A;
tin A đổi diện tích sang bậc làm tròn khác; một tin mới C không khớp căn nào,
When chạy `chayResolve`,
Then B gắn đúng căn có sẵn; A vẫn đúng một link tới căn cũ; C sinh đúng một căn mới; không căn nào sinh cho riêng A.

### AC-8 — Resolver không gắn link thứ hai khi DB chưa áp 098
Given DB của riêng lượt chưa áp 098 (còn tin gắn hơn một căn từ trước),
When đổi giá một tin đã gắn căn rồi chạy `chayResolve`,
Then số tin gắn hơn một căn không tăng và tin ấy không có link mới.

### AC-9 — Đối soát đêm không làm căn mất link âm thầm
Given DB của riêng lượt đã áp 098 và `db/migrations/101_doi_soat_chuyen_link.sql`, dòng mồi tổng hợp của một nguồn thử: tin cũ X gắn
căn P1 và tin kế Y (cùng bài với X, có trong lượt nạp) gắn căn P2; tin cũ X2 gắn căn P3 và tin kế Y2 chưa gắn căn nào,
When gọi `reconcile_stale_offers` cho lượt nạp chỉ gồm Y, Y2,
Then Y vẫn đúng một link tới P2; link (P1, X) nằm trọn trong `property_offer_unlinks` với lý do nêu tin kế; Y2 có đúng một link tới
P3 (chuyển như trước); X, X2 không còn link nào; tổng kết trả về đếm số link ghi nhật ký. Chiều đỏ: cùng dòng mồi với hàm của 044
(trước 101) thì link (P1, X) biến mất mà nhật ký không có dòng nào.

## Coverage

Trục (preset risk-premortem + entity-feature cho «link tin → căn»):
- Dữ liệu đang hỏng: dọn (AC-1) · chạy lại (AC-2) · đảo được (AC-3).
- Vòng đời tin: tin mới (AC-7) · tin đã gắn chạy lại (AC-4) · tin đổi giá (AC-5) · DB chưa áp migration (AC-8) · tin bị thay
  bằng tin kế ở đối soát đêm (AC-9).
- Định danh căn: stable_key giữ nguyên (AC-1, AC-6) · căn không bị xoá (AC-1) · không gộp căn khác bậc giá (khoá giữ nguyên, AC-7).
- Ràng buộc: UNIQUE chặn link thứ hai (AC-2).

Core → AC-1…AC-9. Later: gộp các căn đã sinh do đổi giá trước đây (cần người phân biệt với căn khác nhau cùng toà); căn rỗng sau dọn (2.542 trên máy thu) hiện ở Ops. Never: xoá căn
(M-1).

## Đường đo

- «0 tin gắn hơn một căn» → AC-1 trên DB của riêng lượt chép máy thu (bằng chứng thay thế); số trên máy thu đo sau khi Mạnh cho áp
  098: `SELECT count(*) FROM (SELECT offer_id FROM property_offers GROUP BY offer_id HAVING count(*) > 1) x` phải bằng 0.
- «chạy resolver hai lần liền, đổi giá một tin thử ra 0 căn mới» → AC-4, AC-5.
- «căn có sẵn giữ stable_key» → AC-6. «có UNIQUE property_offers(offer_id)» → AC-2.
- Cloud, sau lượt áp máy thu và một lượt sync, trước khi thêm UNIQUE ở đó: cùng câu GROUP BY offer_id HAVING count(*) > 1 chạy trên
  cloud phải bằng 0.

## Out of scope

- Hai lượt cần lời riêng của Mạnh, làm sau gộp, đúng thứ tự:
  1. **Áp 098 lên DB máy thu** (gồm bước dọn 2.935 link, sao lưu trước), chạy lượt resolve, đo 0 tin gắn hơn một căn; rồi để
     `sync-cloud` đẩy `properties`, `property_offers` đã dọn lên cloud.
  2. **DDL UNIQUE `property_offers(offer_id)` trên cloud** — chỉ SAU khi cloud đã nhận dữ liệu đã dọn ở bước 1; thêm trước thì DDL
     gãy vì cloud còn link trùng.
- Gộp các căn trùng thành một căn; cách xử lý 2.542 căn rỗng sau dọn ngoài lựa chọn của Hỏi về căn rỗng.
- Ghim lại các hồ sơ đã ký có `paths` chạm `resolve-properties.mjs` sau khi gộp (việc của giám sát đợt).

## Notes
- Mở lại phạm vi 13/11 (Mạnh «Sửa trong DA6»): thêm AC-9 sau khi lượt chấm 1 phát hiện 044 chép link sang tin kế bằng
  `ON CONFLICT DO NOTHING` — có UNIQUE của 098 thì link cũ mất không dấu vết khi tin kế đã có căn. Hôm nay 0 link rơi vào ca này
  (chỉ tin S06 có link, tin S06 chưa từng bị thay); rủi ro thành thật khi tin S03/S05 gắn căn (GC0–GC3).
- Số migration 098, 101 chờ sổ của LL; đổi số thì đổi tên tệp và chữ ở hợp đồng này cùng lượt.
