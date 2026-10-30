---
schema_version: 1
slug: khoa-phuong-chung-phuong-so
feature: Thẻ duyệt ghép căn và luật chấm cùng coi «P.12» là «Phường 12», nên cùng một phường số ghi khác kiểu không còn bị báo lệch
owner: phanlemanh@gmail.com
stage: decided
decision: build
decided_by: giám sát theo Mạnh duyệt Cổng Phạm vi judge-giu-quyet-dinh-nguoi 30/10
decided_at: 2026-10-30T15:00:18Z
prototype:
  base_commit: 3ad9d838
  disposition: archive
---

## Vấn đề & ai gặp

Khi duyệt Cổng Phạm vi của `judge-giu-quyet-dinh-nguoi` ngày 30/10, Mạnh trả lời Hỏi-1 bằng câu «Hỏi-1 cùng khoá; mở
hàng riêng dạy khoá phường chung coi «P.12» = «Phường 12» cho cả thẻ lẫn luật» (sổ
`_acceptance/judge-giu-quyet-dinh-nguoi/decisions.jsonl`, dòng `d-20261030T145946Z-9`). Giám sát thêm hàng này vào
dãy P3 (nhật ký đợt 15:00:17Z).

Hiện nay thẻ duyệt ghép căn (`app/src/lib/ops/review-can-cu.ts`) và luật chấm (`agent/src/agents/judge-entity.ts`)
dùng chung một luật: tên phường chỉ còn số sau khi bỏ tiền tố thì so nguyên chuỗi gốc. Vì thế «Phường 12» với «P.12»
hiện «Lệch» trên thẻ, và luật kết luận «khác phường» rồi trả `no`.

Người gặp: người vận hành duyệt ghép căn ở `/ops/review`. Thực địa DB local 30/10: 0 trong 28 646 tin bán ghi phường có
chữ số, vì dữ liệu hiện là Hà Nội. Việc này là phòng trước cho nguồn có phường số (TP.HCM).

## Giả định chốt sinh tử

| # | Giả định | Nếu sai thì | Phép thử rẻ nhất | Trạng thái |
|---|---|---|---|---|
| 1 | Bỏ luật «khoá chỉ số» không làm hai phường số khác nhau thành Khớp | Thẻ và luật báo cùng phường sai | Ma trận cặp tên phường số chạy qua cả hai bản | Chưa thử |
| 2 | «Phường 12» của hai quận khác nhau thành Khớp không phải lỗi mới | Luật ghép nhầm căn hai quận | Hai chuỗi giống hệt đã Khớp từ trước vòng | Đã biết |

## Ngưỡng chết / ngưỡng UAT

Không đo được: việc nội bộ của luồng duyệt, chưa có dữ liệu phường số ở local. Thước là phép đo máy.

## Kết quả prototype

Không dựng prototype — đổi một dòng luật ở hai bản và đo bằng test.

## Nguồn ngoài & phạm vi kế thừa

| Món vật liệu | Nguồn (đường dẫn/tên gói) | Phân loại | Kế thừa? | Người ký |
|---|---|---|---|---|
| Khoá tên phường `khoaPhuong` | `app/src/lib/ops/review-can-cu.ts` (trong kho) | logic | có | — |

## Cổng 0

- **decision = build** Căn cứ: lời duyệt của Mạnh ở Cổng Phạm vi `judge-giu-quyet-dinh-nguoi` 30/10 (trích ở trên).
- **disposition = archive** Căn cứ: không có prototype.
- **Ngưỡng UAT chốt cùng lúc ký:** không đo được (việc nội bộ của luồng duyệt).

## Thước đo thành công → ứng viên criterion

- Thẻ duyệt hiện «Khớp» cho «Phường 12» với «P.12»; hai số khác nhau vẫn «Lệch».
- Luật chấm kết luận «cùng phường» đúng ở mọi ô mà thẻ hiện «Khớp».
