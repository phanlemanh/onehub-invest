---
schema_version: 1
feature: Thẻ duyệt Người cho ca nhiều–nhiều trên /ops/review — SĐT nhiều người gửi, người gửi nhiều SĐT thành thẻ; người duyệt chọn gộp hay giữ tách, quyết định áp qua luật xác định ở bước dựng danh bạ, có vết và đảo được
slug: the-duyet-nguoi-nhieu-nhieu
owner: phanlemanh@gmail.com
risk_tier: T2
surfaces: [ui, cli]
status: draft
approved_by:
approved_at:
design_doc: docs/superpowers/specs/2026-11-01-the-duyet-nguoi-nhieu-nhieu-design.md
---

# Acceptance Contract: the-duyet-nguoi-nhieu-nhieu

## Context

Hàng HD17 (dãy U2), sinh từ Hỏi-1 ở Cổng Phạm vi HD13 `nguoi-noi-theo-sdt`: Mạnh tách thẻ duyệt Người thành hàng riêng.
Cổng Đáng: build (Mạnh «Duyệt hết», 01/11). HD13 gộp cặp một–một và chỉ đếm ca nhiều–nhiều (khoảng 9 SĐT dùng chung,
5 người nhiều số, đo 31/10). Hạng T2: route decide (`app/src/app/api/v1/ops/review/**`) và `db/migrations/` không đổi —
quyết định áp ở bước dựng danh bạ; nếu Hỏi-3 chọn loại thẻ mới (migration) thì hạng nâng T3.

## Criteria

- AC-1: Given tin sống S03/S05 có nhóm liên thông tài khoản ↔ SĐT không một–một (≥ 2 tài khoản hoặc ≥ 2 SĐT), When dựng danh bạ, Then mỗi nhóm có đúng một thẻ chờ `review_queue` loại `data_quality` mã `nguoi:<S0x>:<băm thành viên>`; nhóm một–một, tin nghỉ và tin S06 không sinh thẻ.
- AC-2: Given lượt dựng vừa sinh thẻ, When dựng lượt hai không đổi dữ liệu, Then 0 thẻ mới; nhóm đã có thẻ ở bất kỳ trạng thái nào (chờ, đã gộp, giữ tách, hoãn) không sinh thẻ thứ hai.
- AC-3: Given nhóm có thẻ chờ, When một tài khoản hay SĐT mới nối vào nhóm, Then lượt dựng sinh đúng một thẻ chờ cho nhóm mới và đóng thẻ chờ cũ ở `deferred` với ghi chú trỏ mã thẻ mới (người làm `dung-nguoi`); thẻ đã quyết của nhóm cũ giữ nguyên; không dòng nào bị xoá.
- AC-4: Given thẻ vừa sinh, When đọc `evidence`, Then có mã nguồn `S0x`, mỗi tài khoản (ID, tên, số tin sống), mỗi SĐT E.164 (số tin sống) và tối đa 5 tin mẫu (mã tin, giá, diện tích, ngày); không chứa tên nguồn thật (`source_registry.real_name`) hay khoá tầng A nào.
- AC-5: Given thẻ `approved`, When dựng danh bạ lượt kế, Then mọi Người của nhóm về một người cuối là người tài khoản có `party_key` nhỏ nhất; mỗi lần gộp đúng một sự kiện `gop` lý do `the-duyet:<id> <S0x>`; vai của nhóm về người đích; lượt sau đó ghi 0 gộp; việc áp xảy ra cả khi công tắc gộp tự động tắt.
- AC-6: Given thẻ `rejected` hay `deferred`, When dựng danh bạ, Then không Người nào của nhóm bị gộp theo thẻ, và không thẻ trùng nào được sinh.
- AC-7: Given một Người đã gộp theo thẻ, When tách bằng `dung-nguoi.mjs --tach <party_key> --ly-do «…»`, Then người ấy về `split`, có sự kiện `tach`, vai sống trả về như trước lần gộp, và lượt dựng sau không gộp lại dù thẻ vẫn `approved`.
- AC-8: Given thẻ chờ loại `data_quality` mã `nguoi:` trên `/ops/review` với vai ops, When người duyệt ghi lý do và bấm «Gộp thành một Người», «Giữ tách» hay «Hoãn», Then thẻ hiện tiêu đề «Gộp Người?», bảng tài khoản và SĐT, tin mẫu, ba nút tắt khi lý do trống; route decide nhận đúng `approved` / `rejected` / `deferred`; thẻ đã quyết hiện nhãn «Đã gộp» / «Giữ tách» / «Hoãn» kèm lý do.
- AC-9: Given thẻ `approved` đã áp, When chạy thước nạp lại của HD13 (`pipeline/scripts/nap-lai-nguoi.mjs`) và bộ test HD13, Then người cuối mang ≥ 2 SĐT chỉ hợp lệ khi chuỗi gộp có sự kiện `the-duyet:` (người mang ≥ 2 SĐT không có sự kiện ấy làm thước đỏ); không lần gộp nào nối hai nguồn; `pipeline/scripts/danh-ba-nguoi.test.mjs` và `danh-ba-nguoi.itest.mjs` xanh và không đổi so với merge-base.
- AC-10: Given DB thử chép từ DB máy thu, When dựng danh bạ hai lượt trong giao dịch ROLLBACK, Then số thẻ chờ sau lượt một bằng số nhóm nhiều–nhiều đếm độc lập theo nguồn (in hai số), lượt hai 0 thẻ mới.

## Coverage

Quét tay theo bốn trục.

| Trục | Giá trị | AC |
|---|---|---|
| Hình nhóm | 1 SĐT nhiều tài khoản · 1 tài khoản nhiều SĐT · nhóm lẫn cả hai · một–một (không thẻ) | AC-1 |
| Vòng đời thẻ | sinh · lặp lại · nhóm đổi · chờ / đã gộp / giữ tách / hoãn | AC-1, AC-2, AC-3, AC-6 |
| Hệ quả quyết định | gộp · không gộp · tách lại | AC-5, AC-6, AC-7 |
| Nơi đọc | evidence thẻ · màn duyệt · thước HD13 · DB thật | AC-4, AC-8, AC-9, AC-10 |

## Đường đo

| Ngưỡng (opportunity.md) | Đo bằng |
|---|---|
| Mọi ca nhiều–nhiều có đúng một thẻ | AC-1, AC-10 (DB máy thu, ROLLBACK) |
| Gộp thì hai Người về một, tách thì giữ nguyên | AC-5, AC-6 |
| Tách lại một lần gộp không mất dữ liệu | AC-7 |

## Notes

- `review_queue` chỉ ở local (bảng tầng A của `pipeline/sync-cloud.mjs`); thẻ duyệt trên máy thu.

## Out of scope

- Gộp một phần nhóm (chọn từng cặp tài khoản–SĐT).
- Ca khác nguồn (S06 chưa có SĐT — HD12).
- Thẻ Người trên cloud.
- Gợi ý của model cho thẻ (`ai_suggestion` rỗng).
