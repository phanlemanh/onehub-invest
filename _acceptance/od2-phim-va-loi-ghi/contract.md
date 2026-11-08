---
schema_version: 1
feature: Chế độ duyệt ở /ops/review báo lỗi ghi sau khi rời Hàng duyệt, giữ phím số chỉ quyết một thẻ, phím duyệt im khi hộp thoại khác đè lên sheet
slug: od2-phim-va-loi-ghi
owner: phanlemanh@gmail.com
risk_tier: T2
surfaces: [ui]
status: approved
design_doc: docs/superpowers/specs/2026-11-08-od2-phim-va-loi-ghi-design.md
approved_by: Mạnh
approved_at: 2026-11-08
---

# Acceptance Contract: od2-phim-va-loi-ghi

## Context

Sinh từ Ngoài-5 của OD2 (`ops-duyet-hop-hang-muc`, PR #376 đã gộp): ở Cổng Bằng chứng 08/11 Mạnh chọn «mở hợp đồng mới»
(`_acceptance/ops-duyet-hop-hang-muc/decisions.jsonl`, dòng `d-20261108T143919Z-26`). Giám sát gom thêm hai lỗi phím mà
lượt chấm 1 của OD2 soát ra: giữ phím số quyết liền nhiều thẻ; phím vẫn chạy khi hộp phóng ảnh đè sheet. Ba lỗi đều ở
`app/src/components/ops/review/hang-gui.tsx`, `use-phim-duyet.ts` và chỗ nối ở `review-queue.tsx`. Thiết kế: `design_doc`.

Source input: Cổng Bằng chứng OD2 (Ngoài-5) + lời giao của giám sát đợt dot0-cam-mau.

## Criteria

- **AC-1** — Given chế độ duyệt có hai lệnh đang chờ 5 giây hoàn tác, When hàng duyệt bị gỡ (chuyển route trong app) và
  route decide trả 409 cho lệnh này, 200 cho lệnh kia, hoặc fetch ném lỗi mạng, Then mỗi lệnh vẫn gửi ngay đúng một lần với
  `keepalive: true`; lệnh lỗi hiện tin lỗi «Không ghi được #<id>: <lỗi>» kèm nút «Mở thẻ», bấm nút → điều hướng tới
  `/ops/review?card=<id>`; lệnh 200 không có tin lỗi; xả lúc `pagehide` cũng báo lỗi theo cùng đường; sau khi xả, 6 giây
  trôi qua không sinh thêm yêu cầu nào (hẹn giờ 5 giây đã huỷ). Trên bản chạy thật, tin lỗi hiện trên trang Ops vừa chuyển
  tới.
- **AC-2** — Given người bấm «Hoàn tác» của tin «Đã ghi #<id>» khi lệnh đó đã rời hàng chờ — vì hết 5 giây khi Hàng duyệt
  còn gắn, hay vì đã xả khi Hàng duyệt bị gỡ — When kết quả đang chờ, đã 200, hay đã lỗi, Then tin trả lời của «Hoàn tác»
  lần lượt là «#<id> đang gửi — không hoàn tác được», «#<id> đã ghi — quá 5 giây, không hoàn tác được», «#<id> chưa ghi
  được — thẻ vẫn chờ duyệt» kèm «Mở thẻ» (đã gỡ thì nút điều hướng tới `/ops/review?card=<id>`); không lần nào gửi thêm
  yêu cầu hay đưa thẻ trở lại hàng duyệt; trong các tin trả lời của «Hoàn tác», chữ «đã ghi» chỉ xuất hiện khi route đã trả
  200.
- **AC-3** — Given sheet chế độ duyệt đang mở ở thẻ đầu của một hạng mục ba thẻ, When người nhấn `1` rồi trình duyệt lặp
  `keydown` `1` (`repeat: true`) nhiều lần, Then đúng một lệnh vào hàng chờ (thẻ đầu), thẻ thứ hai đang hiện không bị quyết,
  sự kiện lặp không bị `preventDefault`; cùng vậy với `2`, `3`, `4`; giữ `J`/`↓` (lặp) vẫn sang thẻ sau, `K`/`↑` vẫn về thẻ
  trước như OD2.
- **AC-4** — Given sheet chế độ duyệt đang mở và một hộp thoại khác (hộp phóng ảnh của thẻ, hay hộp thoại bất kỳ không phải
  sheet duyệt) đang mở đè lên, When người nhấn `1`–`4`, `J`, `K`, `↓`, `↑`, `R` hay `?`, Then không lệnh nào vào hàng chờ,
  thẻ không đổi, bảng phím không mở và sự kiện không bị `preventDefault`; đóng hộp thoại → các phím chạy lại như OD2.
- **AC-5** — Given bộ thử của OD2 (`app/tests/ops-duyet-hop-hang-muc.test.tsx`), When chạy trên mã đã sửa, Then mọi ca
  «OD2-AC-n» vẫn xanh, kể cả các ca đột biến thay chuỗi mã nguồn.

## Coverage

Bỏ quét hình thái bằng dòng sổ descope «bỏ coverage-scan — …»: phạm vi là ba lỗi đã gọi tên (Ngoài-5 của OD2 + hai lỗi phím
lượt chấm 1). Trục tự kê để người soát:

| Trục | Giá trị | AC |
|---|---|---|
| Đường gửi | 5 giây · xả khi gỡ · xả `pagehide` | AC-1 |
| Kết quả route | 200 · 409 · lỗi mạng | AC-1, AC-2 |
| Lúc bấm Hoàn tác | còn chờ (OD2) · đang gửi · đã ghi · lỗi — × hết 5 giây khi còn gắn · đã xả khi gỡ | AC-2 |
| Phím lặp | `1`–`4` lặp · `J`/`K`/`↓`/`↑` lặp | AC-3 |
| Lớp trên sheet | không gì · hộp phóng ảnh · hộp thoại khác · bảng phím (OD2) | AC-4 |
| Hồi quy | ca OD2 | AC-5 |

## Out of scope

- Đổi chữ tin «Đã ghi #<id> · <nhãn>» lúc bấm, trừ khi Hỏi-1 ở Cổng Phạm vi chọn đổi (OD2 AC-5 đã ký chữ này).
- Sửa `review-photos.tsx` hay đóng hộp phóng ảnh bằng phím (ngoài vùng của hàng).
- Sửa bộ thử của OD2 (Ngoài-6..11 của OD2 đã ghi Known limits).
- Báo lỗi cho lệnh xả lúc đóng tab thật (trang đã mất, không còn chỗ hiện tin).

## Notes

- Không route mới, không migration; route decide (`app/src/app/api/v1/ops/review/**`, T3) không đổi.
- Hồ sơ OD2 hoá cũ theo `paths` (E3, E4 phủ `app/src/components/ops/review/**`) — ghim lại bằng làn máy trước PR.
