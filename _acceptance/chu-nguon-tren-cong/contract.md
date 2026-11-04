---
schema_version: 1
feature: Chữ hiện trên các trang công khai của cổng Invest không mang tên nguồn thật S01, S02, nói đúng giá rao là tin thật, và giải thích nhãn Chưa xác minh tại chỗ
slug: chu-nguon-tren-cong
owner: phanlemanh@gmail.com
risk_tier: T2
surfaces: [ui]
status: draft
approved_by:
veto_state: mo
veto_opened_at: 2026-11-04T03:00:00Z
design_doc: docs/superpowers/specs/2026-11-04-chu-nguon-tren-cong-design.md
---

# Acceptance Contract: chu-nguon-tren-cong

## Context

Cổng Invest ra mắt 05/11. Giám sát đo production sáng 04/11, thấy tên S01, S02 trong chữ hiện của năm trang, trái luật 6 của AGENTS.md. Trang Phương pháp, `/` và
`/vn/[market]` còn ghi giá bán, thuê là tin rao giả lập, trong khi `market_asset_stats` tính từ tin thật. Nhãn «Chưa xác minh» chưa có lời giải thích nào cho
người xem. Việc này chỉ đổi chữ hiện trên `app/`, không đổi dữ liệu, không đổi route. Số đo ở design doc.

**Mười hai trang**: `/`, `/vn`, `/vn/hanoi`, `/vn/hanoi/map`, `/vn/hanoi/listings/sale`, `/vn/hanoi/listings/rent`, `/vn/hanoi/listings/rent?term=short`, `/listing/<một listing thật>`, `/yield?area=vn-hanoi`, `/compare?areas=vn-hanoi,vn-hcmc`, `/register`, `/methodology`. Năm trang đầu của lời giao, bốn trang giám sát thêm 04/11, `/listing/[id]` theo quyết định của Mạnh.

## Criteria

- AC-1: Given bảng «Ma trận AC-1» và máy chủ giả, When chạy `quetHtml` và lệnh `scripts/quet-ten-nguon-html.mjs`, Then từng hàng ra đúng hai cột; trang sạch thoát 0; tên ở một trang thoát 1, in tên trang và mã, không in tên thật; mã khác 200, trang không có `<h1>`, kiểu khác HTML, không tới được đều thoát 2, không tính là sạch.
- AC-2: Given bản chạy từ cây này với DB máy thu, When chạy lệnh quét trên mười hai trang, Then 0 tên của mọi mã trong sổ, ở chữ hiện và toàn HTML, trừ hai ngoại lệ đếm riêng: tiêu đề listing ở ô thuê ngắn hạn và trang listing, đường link trang gốc trên trang listing. Đối chứng đỏ: cùng lệnh trên bản `main` trước sửa thoát 1, số ghi ở evidence. (cross-layer)
- AC-3: Given mã nguồn cây này, When chạy `scripts/check-invest-tier-a.mjs` đi theo import của các trang và layout, Then 0 chỗ trúng và thước đi tới chân trang, hero, định nghĩa Phương pháp, Insight, thân trang tin, form Lợi suất, So sánh, form đăng ký, đầu trang listing; chiều đỏ trên fixture: chữ JSX, khoá object, biến chuỗi, `aria-label` mang tên thì đỏ đúng tệp, dòng, mã; comment, định danh, SQL, tệp trang không import thì không đỏ.
- AC-4: Given sáu tệp chữ về giá (`(marketing)/page.tsx`, `methodology-definitions.tsx`, `insight-tables.tsx`, `(app)/yield/page.tsx`, `yield-form.tsx`, `comparison.tsx`), When đọc, Then không còn «giả lập», «dữ liệu mô phỏng»; đều có «giá rao», «chưa phải giá giao dịch»; số mô hình giữ nhãn: bảng Lợi suất, đầu trang `/yield`, ô Yield ròng dài hạn, nhóm Lợi suất của So sánh; ô `gia-rao` của Phương pháp là chữ thuần, không nhãn mô phỏng; `SupplyPoint` không còn `snapshotId`. Và When lệnh quét đọc HTML thật, Then chữ hiện không có câu sai trên mười hai trang; `/methodology` có hai nhãn nguồn và «chưa phải giá giao dịch»; `/vn/hanoi`, `/yield` có «chưa phải giá giao dịch», «MÔ PHỎNG»; chân trang còn OpenStreetMap. Chiều đỏ: câu sai, thiếu chữ, vượt trần tiêu đề đều thoát 1.
- AC-5: Given bảng «Ma trận AC-5» dựng trên `OfferCard` thật trong jsdom, When bấm từng nút ⓘ, Then số nút và chữ mở ra đúng bảng, chữ giải thích không có trước khi bấm. Chiều đỏ: bản sao bỏ nút ở thẻ thì ca nêu `tin-nhom` và không nêu hàng khác.
- AC-6: Given bản chạy, When mở `/vn/hanoi/listings/sale`, `/vn/hanoi`, `/methodology` ở sáng, tối, khổ 375, Then cả hai nút ⓘ (tin, số) mở được bằng bấm và bàn phím, chữ đọc được, không tràn ngang lúc popover mở; chân dung bằng ảnh. (judgment)
- AC-7: Given cây này, When chạy thước cổng tĩnh và đọc mã các trang, Then không route mới, sổ bề mặt khớp; tệp nào trong tập import của các trang cũng không gọi hàm hay bảng số S02, chiều đỏ trên fixture gọi tên tệp.

## Câu hỏi cho Mạnh

- **Hỏi-1. Ảnh listing trỏ CDN của S01 có giữ tới sau 05/11 không?** Mọi ảnh listing thuê ngắn hạn tải từ miền CDN của S01; miền đó không chứa tên S01 nhưng người biết sẽ nhận ra. Máy khuyên: giữ, ghi hạn chế đã biết, xử ở việc dọn sau 05/11. Lối khác: chuyển ảnh qua máy chủ mình trước 05/11, giá là một lớp ảnh mới và cước tải, không kịp hạn gộp.
- **Hỏi-2. Tiêu đề listing chủ nhà gõ có tên S01 có giữ tới sau 05/11 không?** Đo 04/11 ở DB máy thu: 1/838 tiêu đề; hiện trên ô thuê ngắn hạn và trang listing đó. Máy khuyên: giữ, đếm riêng ở phép quét, trần 5 tiêu đề mỗi trang, che ở `sync-cloud.mjs` thành việc T3 riêng sau 05/11. Lối khác: che ngay ở `sync-cloud.mjs` trong hôm nay, giá là một hồ sơ T3 chen vào hàng khoá trước 22:00.

## Ma trận AC-1

| # | Chỗ chứa tên S01 | Chữ hiện | Toàn HTML |
|---|---|---|---|
| 1 | chữ trong thân | 1 | 1 |
| 2 | `<title>` | 1 | 1 |
| 3 | meta description | 1 | 1 |
| 4 | thẻ OG | 1 | 1 |
| 5 | `aria-label` | 1 | 1 |
| 6 | `title` | 1 | 1 |
| 7 | `alt` | 1 | 1 |
| 8 | dữ liệu nhúng trong `<script>` | 0 | 1 |
| 9 | `id` phần tử | 0 | 1 |
| 10 | `href` | 0 | 1 |
| 11 | viết hoa | 1 | 1 |

Link trang gốc: trên trang khai, đúng khuôn `https://www.<tên>.com/rooms/<số>` thì đếm riêng, không đỏ. Trang không khai, đường khác trên miền, miền khác mang tên, chữ trên nút, mã khác trong link thì đỏ.

## Ma trận AC-5

| Hàng | Tin | Nút | Chữ mở ra |
|---|---|---|---|
| `tin-da-doi-chieu-so-truc-tiep` | không nhãn | 0 | — |
| `tin-nhom` | `unverified` | 1 | Tin từ nhóm cộng đồng |
| `so-suy` | `phoneInferred` | 1 | Số không lấy trực tiếp từ chính tin này |
| `ca-hai` | cả hai | 2 | hai câu, đúng thứ tự thẻ rồi số |
| `tin-nhom-khong-so` | `unverified`, không số | 1 | Tin từ nhóm cộng đồng |

## Coverage

Quét tay, không dùng khung quét: danh sách trang do lời giao chốt, trục ít (ghi ở sổ dòng descope).

| Trục | Giá trị | AC |
|---|---|---|
| Chỗ trong HTML | chữ · metadata · OG · aria · title · alt · script · id · href | AC-1, AC-2 |
| Trang | mười hai trang | AC-2 |
| Tầng đo | HTML thật · mã nguồn | AC-2, AC-3 |
| Câu về giá | trang chủ · Phương pháp · bảng Lợi suất · `/yield` · So sánh | AC-4 |
| Nghĩa của nhãn | tin · số · cả hai · không có | AC-5 |

## Out of scope

- Đổi tên tệp, định danh, tên bảng, tiền tố `abnb_`, lịch sử git: Mạnh chốt dọn sau 05/11 (`AGENTS.md` luật 6, sổ ROADMAP).
- Trang chỉ có khi đăng nhập hay trang cần phiên (`/saved`, `/login`): `/login` không có `<h1>`, `/saved` đòi phiên, thước tĩnh vẫn đi qua mã dùng chung.
- Mã listing `abnb_…` trên URL và đầu trang `/listing/[id]`: lời giao không đổi route, dọn sau 05/11.
- Ảnh listing trỏ CDN của S01: miền CDN không khớp sổ tên, đổi là đổi dữ liệu hoặc thêm lớp ảnh.
- Tiêu đề listing do chủ nhà gõ có tên S01 (1/838 ở DB máy thu): che là đổi dữ liệu, cần sửa `sync-cloud.mjs` hạng T3.

## Đường đo sau triển khai

Sau khi gộp và lên production, giám sát chạy `node scripts/quet-ten-nguon-html.mjs --base <production>`: thoát 0, ghi số tiêu đề được miễn. Đây là điều kiện đóng việc, không phải điều kiện gộp; DB máy thu không thay được cloud.

## Notes

Known limits:

- Đường link trang gốc trên miền S01 của `/listing/[id]` giữ nguyên, ngoại lệ có tên do Mạnh chốt 04/11. Phép quét đếm riêng đúng khuôn link trên đúng trang đó.
- Tiêu đề listing do chủ nhà gõ có thể mang tên S01 (1/838 ở DB máy thu). Phép quét đếm riêng ở ô thuê ngắn hạn và trang listing, in ở báo cáo, không đỏ; chữ của cổng trên hai trang đó vẫn đỏ nếu có tên.
- Ảnh listing vẫn trỏ CDN của S01; miền CDN không khớp sổ tên nên phép quét không đo.
