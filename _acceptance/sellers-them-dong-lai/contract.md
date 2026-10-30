---
schema_version: 1
feature: Bước tổng hợp người bán thêm dòng cho mọi SĐT mới trên tin, không chỉ cập nhật và xoá dòng đã có
slug: sellers-them-dong-lai
owner: phanlemanh@gmail.com
risk_tier: T2
surfaces: [pipeline]
status: signed-off
veto_state: mo
veto_opened_at: 2026-10-30T18:01:20Z
approved_by:
approved_at:
design_doc: docs/superpowers/specs/2026-10-31-sellers-them-dong-lai-design.md
---

# Acceptance Contract: sellers-them-dong-lai

## Context

Hàng SD1 của lộ trình, Hỏi-C bước 1 của audit bảng Người theo trục SĐT (`docs/research/audit-bang-nguoi-sdt-3010.md`
§0 N3), Mạnh duyệt 30/10; Cổng Đáng build ở `opportunity.md`. Từ `907f4bd4` (21/10) `refresh-bait-gap.mjs` chỉ cập nhật
và xoá dòng `sellers`, không thêm: bảng đứng ở 19 dòng trong khi `sale_offers` có 208 SĐT khác nhau (31/10). Chip môi giới
ở `/ops/deals` thiếu trên phần lớn tin có SĐT; phép đối chiếu AC-8 của DB2b chỉ nhìn 19 dòng.

## Criteria

- AC-1 (cross-layer): Given lát giao dịch có ba SĐT trên tin — `A` đã có dòng `sellers`, `B` một tin chưa có dòng, `C` hai tin hai nguồn chưa có dòng — When chạy bước bait gap, Then `sellers` có đúng một dòng cho mỗi SĐT trên tin, và dòng của `B`, `C` mang `n_ads`, `sources`, `first_seen`, `last_seen`, `flags` tính từ tin của chính SĐT đó.
- AC-2: Given lát của AC-1 đã chạy một lượt, When chạy lượt hai, Then không thêm, không xoá dòng nào và mọi cột tổng hợp bằng lượt một (`n_ads` không cộng dồn).
- AC-3: Given dòng `sellers` của `A` đã có tên và tin của `A`, `B` mang tên người bán, When chạy bước bait gap, Then `A` giữ tên cũ, `B` nhận tên từ tin.
- AC-4: Given người bán không còn tin nào và người bán còn tin, When chạy bước bait gap, Then dòng mồ côi bị xoá kèm một dòng audit `bait-gap:sellers-orphan`, dòng còn tin được giữ — như trước vòng.
- AC-5: Given dữ liệu thật trên DB máy thu, When chạy bước bait gap trong giao dịch ROLLBACK hai lượt, Then sau lượt một số dòng `sellers` bằng số SĐT khác nhau trên `sale_offers`, và lượt hai không đổi số dòng.
- AC-6 (cross-layer): Given dữ liệu thật trên DB máy thu sau bước bait gap trong ROLLBACK, When chạy câu đọc Căn giá tốt của app (`dealsSql`), Then mọi dòng có SĐT người bán có số tin của người bán (`broker_n_ads` khác rỗng).
- AC-7: Given một tin mang SĐT chưa có người sống trong danh bạ và chưa có dòng `sellers`, When đối chiếu `sellersThieuNguoi`, Then cặp «SĐT:nguồn» của tin đó có trong kết quả; phép đối chiếu đọc tập (SĐT, nguồn) của `sale_offers`, không đọc `sellers`.
- AC-8 (cross-layer): Given lát của AC-1 sau bước bait gap, When đọc bảng `sellers` bằng câu đọc local của `sync-cloud.mjs` (`selectList` + `localReadSql`), Then payload có đúng một dòng cho mỗi SĐT trên tin và không dòng nào mang cột `name`.

## Coverage

Quét tay ba trục (dòng sổ «bỏ coverage-scan»), mỗi ô một AC:

| Trục | Giá trị | AC |
|---|---|---|
| Trạng thái SĐT trước bước | đã có dòng · chưa có dòng một tin · chưa có dòng nhiều tin nhiều nguồn · dòng mồ côi | AC-1, AC-4 |
| Lượt chạy | lượt đầu · lượt lặp · dữ liệu thật | AC-1, AC-2, AC-5 |
| Bên đọc | cột tổng hợp · tên · chip Căn giá tốt · đối chiếu danh bạ · đồng bộ cloud | AC-1, AC-3, AC-6, AC-7, AC-8 |

## Đường đo

| Ngưỡng (opportunity.md) | Đo bằng |
|---|---|
| Số dòng `sellers` bằng số SĐT khác nhau trên `sale_offers` | AC-5 trên DB máy thu (hiệu tập hai chiều rỗng), AC-1 trên lát |
| Chạy lại lần hai không đổi số dòng | AC-2, AC-5 |
| Test đỏ khi bỏ lệnh thêm dòng | chiều đỏ của AC-1 (bản đột biến bỏ lệnh thêm dòng) |
| Chip môi giới có ở mọi tin có SĐT | AC-6 (số tin người bán có mặt; luật hiện chip >1 tin không đổi) |

## Out of scope

- `sellers` thành view trên danh bạ, khoá SĐT `+84…` — Hỏi-C bước 2, hàng SD3 `sdt-luu-goc-e164`.
- Đo trục SĐT hằng đêm trên `/ops/quality` — hàng `do-danh-ba-sdt`.
- Đổi luật hiện chip môi giới (người bán chỉ một tin vẫn không có chip).
- Đổi cột lên cloud của `sellers` — `sync-cloud.mjs` giữ nguyên (`name` ở lại máy); AC-8 chỉ đo payload phía máy, không gọi cloud.

## Notes

- Known limits — chọn ở Cổng Bằng chứng 2026-10-31:
  - Ngoài-1: Lượt test bị ngắt giữa chừng có thể để lại một tệp mã tạm trong thư mục pipeline/, người làm phải tự xoá trước khi commit.
  - Ngoài-2: Phép đối chiếu danh bạ xét mọi nguồn trên tin, nên tin của nguồn ngoài S03/S05/S06, tin thiếu khoá hay SĐT có khoảng trắng sẽ bị báo thiếu người mãi.
