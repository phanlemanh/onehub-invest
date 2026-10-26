---
schema_version: 1
slug: tin-rao-gan-khu-vuc-dung
feature: Tin rao bán và bước gán theo toạ độ chỉ gán vào phường hợp lệ — không vào khu vực lạc hay khu vực không phải phường OSM
owner: phanlemanh@gmail.com
stage: decided
decision: build
decided_by: giám sát theo Mạnh ký AU9 Ngoài-1 26/10
decided_at: 2026-10-26T09:00:10Z
prototype:
  base_commit: 3ce47baa
  disposition: archive
---

## Vấn đề & ai gặp

Hàng phát sinh từ Ngoài-1 của AU9 (`_acceptance/ranh-gioi-khu-vuc-dung/review-findings.md`, Mạnh chọn «mở hợp đồng mới»
khi ký 26/10). AU9 đưa điều kiện phường hợp lệ dùng chung `phuongHopLe()` (`pipeline/lib/osm.mjs`) vào bước gán khu vực
của reassign-areas và transform-airbnb; lượt theo lịch đánh dấu khu vực lạc bằng `meta.lac` thay vì xoá. Bốn bước gán
khác chưa dùng điều kiện đó:

- `transform-zalo.mjs` (S03), `transform-fb.mjs` (S05), `transform-chotot.mjs` (S06) nạp mọi `submarket` dưới
  `vn-hanoi`/`vn-hcmc` để khớp tên phường trong chữ tin rao — gồm cả khu vực lạc và khu vực không phải phường OSM;
- `transform-hcmc-simple.mjs` gán listing theo toạ độ vào mọi con có polygon của `vn-hcmc`.

Người gặp: nhà đầu tư đọc số liệu tin bán theo phường trên Invest Portal (số liệu phường sai chỗ), người vận hành ở
`/ops/quality`. Thực địa DB local 26/10 sau lượt dọn AU9: 0 khu vực lạc; 9 tin S05 gắn vào bốn khu vực «Quận …» nguồn
`airbnb-discovery` (không phải phường OSM). Lượt theo lịch kế tiếp mà ranh giới đổi sẽ sinh khu vực lạc mới, và các
bước trên sẽ lại gán tin rao vào đó.

## Giả định chốt sinh tử

| # | Giả định | Nếu sai thì | Phép thử rẻ nhất | Trạng thái |
|---|---|---|---|---|
| 1 | Bỏ khu vực không hợp lệ khỏi danh sách khớp không làm tụt số tin có phường ngoài đúng các tin đang gắn sai | Số tin bán có phường giảm thật, số liệu phường mất mẫu | Chạy bốn bước trong một transaction trên DB local, so số tin có phường trước/sau | Chưa thử |
| 2 | Khớp chữ với danh sách phường hợp lệ vẫn tìm được phường cho tin đang gắn «Quận …» cũ khi tin ghi tên phường | 9 tin S05 mất nhãn phường | Cùng phép đo trên | Chưa thử |

## Ngưỡng chết / ngưỡng UAT

Không đo được — việc nội bộ của đường dữ liệu, không có người dùng cuối trực tiếp thao tác; thước là phép đo máy trên DB
local trong transaction (contract §Đường đo).

## Kết quả prototype

Không dựng prototype — sửa đường dữ liệu, đo bằng phép đo máy.

## Nguồn ngoài & phạm vi kế thừa

| Món vật liệu | Nguồn (đường dẫn/tên gói) | Phân loại | Kế thừa? | Người ký |
|---|---|---|---|---|
| Điều kiện phường hợp lệ `phuongHopLe()` | `pipeline/lib/osm.mjs` (AU9, trong kho) | triết-lý/logic | có | — |

## Cổng 0

- **decision = build** Căn cứ: Mạnh ký AU9 26/10 với «Ngoài-1: mở hợp đồng mới»; giám sát trả lời yêu cầu P3-91.
- **disposition = archive** Căn cứ: không có prototype.
- **Ngưỡng UAT chốt cùng lúc ký:** không đo được (việc nội bộ đường dữ liệu).

## Thước đo thành công → ứng viên criterion

- 0 tin bán và 0 listing được gán vào khu vực lạc hay khu vực không phải phường OSM sau lượt nạp.
- Số tin có phường không tụt ngoài đúng các tin đang gắn sai trước lượt.

## Out of scope từ khám phá

- Gỡ nhãn phường của tin S06 đã gắn khu vực không hợp lệ từ trước — `transform-chotot` giữ `area_id` cũ khi lượt mới
  không khớp (COALESCE); hiện 0 tin như vậy, và lượt dọn có cờ của AU9 đặt NULL tin trỏ khu vực lạc.
- Xoá 11 khu vực `airbnb-discovery` cũ — AU9 đã để ngoài phạm vi vì còn bị tham chiếu.
