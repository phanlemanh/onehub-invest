---
schema_version: 1
slug: phuong-so
feature: Thẻ duyệt ghép căn và luật chấm đọc trọn các cách ghi phường số — «Phường 01», «P12», slug phuong-12 cùng là «Phường 12», còn «Xã 12» hay «12» trần thì không
owner: phanlemanh@gmail.com
stage: decided
decision: build
decided_by: giám sát theo Mạnh chọn «mở hợp đồng mới» ở Cổng Bằng chứng khoa-phuong-chung-phuong-so 30/10
decided_at: 2026-10-30T16:13:32Z
prototype:
  base_commit: 4704315b
  disposition: archive
---

## Vấn đề & ai gặp

Ở Cổng Bằng chứng `khoa-phuong-chung-phuong-so` ngày 30/10, Mạnh chọn cho mục ngoài hợp đồng «bỏ hẳn nhánh khoá-chỉ-số
làm Khớp rộng hơn «P.12» = «Phường 12»»: «mở hợp đồng mới — gom với «Phường 01», «P12», slug phuong-12 thành một hàng
«phường số»» (sổ `_acceptance/khoa-phuong-chung-phuong-so/decisions.jsonl`). Giám sát thêm hàng này vào dãy P3
(yêu cầu P3-124, trả lời 16:13:32Z).

Sau vòng trước, khoá phường chỉ còn số («12») nên:
- «Phường 01» với «Phường 1» vẫn Lệch (khoá «01» ≠ «1»);
- «P12» (không chấm) và slug `phuong-12` không bỏ được tiền tố nên Lệch với «Phường 12»;
- «Xã 12», «Thị trấn 12» và «12» trần lại Khớp với «Phường 12» vì cùng khoá «12».

Người gặp: người vận hành duyệt ghép căn ở `/ops/review`, và luật chấm ghép căn của agent. DB local 30/10: 0 trong
28 646 tin bán ghi phường có chữ số (dữ liệu Hà Nội) — việc này phòng trước cho nguồn có phường số.

## Giả định chốt sinh tử

| # | Giả định | Nếu sai thì | Phép thử rẻ nhất | Trạng thái |
|---|---|---|---|---|
| 1 | Nhận dạng phường số không đổi ô chữ nào của ma trận cũ | Thẻ và luật đổi nhãn tên phường chữ | Ma trận cũ chạy lại nguyên | Chưa thử |
| 2 | Cấp hành chính (phường · xã · thị trấn · không ghi) phân biệt được hai phường số | «Xã 12» ghép với «Phường 12» | Ma trận cặp khác cấp | Chưa thử |

## Ngưỡng chết / ngưỡng UAT

Không đo được: việc nội bộ của luồng duyệt, chưa có dữ liệu phường số ở local. Thước là phép đo máy.

## Kết quả prototype

Không dựng prototype — đổi hàm khoá phường ở hai bản và đo bằng test.

## Nguồn ngoài & phạm vi kế thừa

| Món vật liệu | Nguồn (đường dẫn/tên gói) | Phân loại | Kế thừa? | Người ký |
|---|---|---|---|---|
| Khoá tên phường `khoaPhuong` | `app/src/lib/ops/review-can-cu.ts` (trong kho) | logic | có | — |

## Cổng 0

- **decision = build** Căn cứ: lời Mạnh ở Cổng Bằng chứng `khoa-phuong-chung-phuong-so` 30/10 (trích ở trên).
- **disposition = archive** Căn cứ: không có prototype.
- **Ngưỡng UAT chốt cùng lúc ký:** không đo được (việc nội bộ của luồng duyệt).

## Thước đo thành công → ứng viên criterion

- Thẻ duyệt hiện «Khớp» cho «Phường 01»/«Phường 1», «P12»/«Phường 12», `phuong-12`/«Phường 12».
- «Xã 12», «Thị trấn 12», «12» trần hiện «Lệch» với «Phường 12».
- Luật chấm kết luận «cùng / khác phường» trùng nhãn thẻ ở mọi ô.
