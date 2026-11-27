---
schema_version: 1
feature: "S02 — trang kế của map_listings gửi offset trong thân lời gọi, đường dẫn không đổi; danh tính bản ghi vẫn giữ tên trang. Sửa lỗi có sẵn: hậu tố @offset trên đường dẫn bị nguồn trả 404 nên mỗi thị trường từ 15000 căn chỉ thu được trang đầu"
slug: s02-map-listings-trang-ke
owner: phanlemanh@gmail.com
risk_tier: T2
surfaces: [cli]
status: implemented
veto_state: mo
veto_opened_at: 2026-11-26T15:50:00Z
approved_by:
approved_at:
design_doc: _acceptance/s02-map-listings-trang-ke/design.md
---

# Acceptance Contract: s02-map-listings-trang-ke

## Context

Lượt chạy thật ngày 26/11/2026 của bộ thu S02 (cách đi cửa API) ở thị trường 47 cho một lời lỗi: `POST
/v1/market/47/map_listings@15000 → HTTP 404`. Đây là lỗi CÓ SẴN trên `main`, không do hàng đó: vòng phân trang của
`map_listings` gọi trang kế bằng đường dẫn `/v1/market/{m}/map_listings@{offset}`; nguồn trả 404 với dạng đó, bộ thu
đếm là một lời lỗi rồi đi tiếp. Hệ quả: mỗi thị trường từ 15000 căn trở lên chỉ thu được trang đầu 15000 căn.

Đo ngày 26/11: cùng lời đó với `offset` nằm trong THÂN (đường dẫn không đổi) → 200, đủ 15000 căn, không trùng căn nào
của trang đầu. Hà Nội có 30 623 căn trong 3 trang (15000 + 15000 + 623); mã cũ chỉ lấy 15000 → thiếu 15 623 căn (51%).

Hàng này sửa đúng một dòng trong `call()`: không gửi hậu tố `@<số>` lên nguồn; `sourceId` và `meta.apiPath` vẫn giữ
tên trang để các trang không trùng danh tính; `payload.url` là đường dẫn thật đã gửi. Tầng transform đã đọc mọi item
`map-listings` theo kind và lấy mã thị trường bằng biểu thức khớp cả hai dạng đường dẫn, ghi upsert theo
`property_id` — phía pipeline không phải đổi.

Hàng này đặt trên đỉnh nhánh bộ thu đi cửa API (`zcode/s02-cua-api`, hồ sơ `s02-cua-api`); mốc so của vùng thay đổi
là đỉnh nhánh đó.

Source input: lượt chạy thật 26/11 18:35–18:39 (lộ lỗi 404) và phép dò 18:40–18:41 (trang hai trả 200, 15000 căn mới);
lời Mạnh «Đồng ý» (26/11 22:37) với chuỗi hồ sơ T2 → PR → gộp qua cổng Claude.

## Criteria

- AC-1 (trang kế gửi `offset` trong thân, không đổi đường dẫn): Given `call("POST", "/v1/market/47/map_listings@15000", { pagination: { page_size: 15000, offset: 15000 } }, …)` với hàm gửi giả, When gọi, Then gửi đúng MỘT lời tới `…/v1/market/47/map_listings` (không hậu tố `@15000`), thân giữ nguyên `pagination.offset = 15000`; bản ghi trả về có `sourceId` và `meta.apiPath` là tên trang `/v1/market/47/map_listings@15000`, và `payload.url` là đường dẫn thật đã gửi. Chiều đỏ: bốn bản đột biến — gửi lại hậu tố `@offset` lên đường dẫn · cắt mất đường dẫn kể cả khi không có hậu tố · `sourceId` ghi đường dẫn gửi thay vì tên trang · `payload.url` ghi tên trang thay vì đường dẫn gửi.
- AC-2 (vế không bắn): Given `call("GET", "/v1/market/47/map_listings", null, …)` — đường dẫn KHÔNG có hậu tố, When gọi, Then gửi đúng đường dẫn đó, không đổi; `sourceId` giữ nguyên tên. Chiều đỏ: bản đột biến «cắt mất đường dẫn kể cả khi không có hậu tố» bị bắt.
- AC-3 (vùng thay đổi, bộ test): Given nhánh này so với đỉnh nhánh thử nghiệm (`zcode/s02-cua-api`), When so danh sách tệp đổi, Then chỉ gồm: tệp bộ thu S02 (xuất `docExpAppToken`), tệp test bộ thu của hàng S02 (`collector/src/test/s02-bo-thu-cua-api.test.ts`), hồ sơ này (và hai tệp sinh LO-TRINH.html, PRODUCT-MAP.md nếu luật kho bắt vẽ lại). `collector/src/cli.ts`, tệp phiên S02, `collector/src/core/**` và `pipeline/**` KHÔNG đổi. Trọn bộ test của collector đạt.

## Coverage

Bỏ coverage-scan — hàng đổi đúng một dòng ở một tệp bộ thu; trục liệt tay:

- Trục đường dẫn logic: có hậu tố `@<số>` · không có hậu tố — AC-1, AC-2
- Trục danh tính bản ghi: `sourceId` · `meta.apiPath` · `payload.url` — AC-1
- Trục số trang: trang đầu · trang giữa đủ 15000 căn · trang cuối thiếu — chỉ có ở chạy thật (18:44–18:47: ba trang, dừng đúng ở trang 623 căn), ghi ở Notes
- Ô bỏ: chạy thật với nguồn sống không xếp thành eval — lưu lượng thật, cần phiên của Mạnh

## Out of scope

- Tầng transform và pipeline (`transform-airdna.mjs`): đã đọc mọi trang, không đổi; số hàng `airdna_listings` của thị trường lớn sẽ tăng khoảng gấp đôi khi hàng này được áp — thuộc làn Claude để biết.
- Đo các thị trường lớn khác (ví dụ 48): chưa đo số trang thật.
- Triển khai sau gộp: build lại `dist` của collector ở checkout chính — làm cùng hồ sơ `s02-cua-api`.
- Hàng này phụ thuộc nhánh thử nghiệm: chỉ gộp sau khi `zcode/s02-cua-api` được gộp.

## Notes

- Lệnh đo nằm ở `_acceptance/s02-map-listings-trang-ke/probes/`; `_acceptance/config.yaml` là tệp bảo vệ, không sửa.
- Phép đo cần `collector/dist` mới: lệnh eval build bằng `npx tsc -p tsconfig.json` trước. Phép đo cùng khuôn với hồ sơ `s02-cua-api` (chép `collector/dist` vào thư mục tạm trong `collector/`, đổi đúng MỘT điểm, chạy đúng tệp test ở bản chép; ca đỏ ở bản đối chứng không được tính là «bắt được»).
- Chạy thật ngày 26/11/2026 18:44–18:47 (từ worktree, thị trường 47, một khu con, không mở trình duyệt): 2 lời cấp token + 17 lời dữ liệu → 18 bản ghi, 0 lỗi; `map_listings` đủ ba trang 15000 + 15000 + 623 = 30 623 căn duy nhất; 0 lần 401, 0 dòng AUTH FAIL, 0 lần bị chặn.
