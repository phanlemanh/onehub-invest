---
schema_version: 1
feature: Người duyệt thấy đủ các ảnh khác nhau của một tin, không bị ảnh đăng lại lấp hết trần 12 ảnh; màn gắn nhãn dùng cùng luật
slug: khu-trung-anh-tin
owner: phanlemanh@gmail.com
risk_tier: T2      # pipeline/media-rows.mjs, transform-media.mjs, app/src/lib — không khớp t3_paths; không migration
surfaces: [cli]
status: approved
approved_by: Mạnh
approved_at: 2026-11-05
design_doc: docs/superpowers/specs/2026-11-05-khu-trung-anh-tin-design.md
---

# Acceptance Contract: khu-trung-anh-tin

## Context

Đo 05/11: 12.942 dòng ảnh có tệp của S03 chỉ có 4.450 ảnh khác nội dung; 262 tin vượt 12 dòng nhưng chỉ 38 tin thật sự vượt 12 ảnh khác nhau.

Lượt đêm đầu sau gộp xoá khoảng 8.500 dòng trùng khỏi bảng `media` và đổi thứ tự các dòng đứng sau chúng. Bảng chỉ ở máy thu, không lên cloud; snapshot và bảng nạp không đổi. Muốn lùi thì hoàn PR rồi chạy lại `transform-media`: dòng có lại, dấu thời gian cũ của chúng thì không.

Người gắn nhãn chưa thấy khác trong vòng này: màn đó đọc từng bài, hôm nay 0/28.220 bài có ảnh trùng trong bài. Lợi ích tới khi `feat/ghep-anh-tren-the-gan-nhan` gộp và dùng khoá này.

## Acceptance criteria

- AC-1: Given ma trận entry có tệp cùng `sha256`, khác URL và tên tệp (trong một bài, giữa hai bài, băm viết hoa), When dựng dòng ảnh của tin, Then mỗi băm một dòng, giữ lần đầu theo thứ tự bài, `media_order` liền nhau, `media_key` của dòng giữ lại không đổi so với trước.
- AC-2: Given entry có tệp mà băm thiếu hay sai khuôn, entry tải lỗi, ảnh chỉ có URL, và URL của một tệp đã bị khử xuất hiện lại ở cột `media`, When dựng dòng, Then entry thiếu băm khử theo đường tệp như cũ, ảnh chỉ có URL khử theo URL như cũ, URL của tệp đã khử không quay lại; hàm không đọc đĩa, không gọi mạng.
- AC-3 (cross-layer): Given tin S03 trên DB thử có bài chỉ-ảnh gán vào, ảnh trùng băm và ảnh khác băm với ảnh của bài chữ, When chạy `transform-media S03`, Then ảnh trùng không thêm dòng, ảnh khác nối sau mọi ảnh của bài chữ. Thước `do-gop-anh` của PL28 đổi để tính bài chỉ-ảnh trùng băm là đã gộp, và vẫn báo lệch khi bài có một băm chưa vào tin.
- AC-4 (cross-layer): Given tin S06 có ảnh, When chạy transform-media, Then dòng S06 giống hệt trước từng cột; trên DB máy thu, dòng do cây dựng cho S06 trùng khớp bảng hiện tại ở các tin có ở cả hai phía.
- AC-5 (cross-layer): Given dữ liệu thật của DB máy thu, When đo chỉ đọc trên các tin có ở cả bảng `media` và bản dựng từ cây, xét các băm còn trong bảng nạp của tin đó, Then mỗi tin S03, S05 còn đủ mọi băm trong tập trước, 0 tin còn hai dòng cùng băm, ảnh chỉ có URL không đổi; in mẫu số, số ảnh khác nội dung mỗi tin trước và sau, cả trong trần 12, và riêng các tin vượt 12 ảnh khác nhau (đo 05/11: 38 tin).
- AC-6 (cross-layer): Given bảng `media` trên DB thử còn dòng trùng cũ ở đầu, giữa và cuối tin, When chạy transform-media hai lượt, Then lượt đầu xoá đúng dòng trùng; dòng còn lại giữ `media_key`, `media_order` liền nhau; dòng dời chỗ có dấu thời gian mới, dòng không dời giữ dấu cũ; lượt hai thêm 0, đổi 0, xoá 0.
- AC-7 (cross-layer): Given tin có 20 entry ảnh mà 13 băm khác nhau, ghi qua transform-media vào DB thử, When `/ops/review`, `/ops/data-flow`, `/ops/deals` nạp ảnh, Then mỗi nơi nhận đúng 12 ảnh khác nội dung theo thứ tự `media_order`. Thước đã ký `buildOfferImages` đổi theo cùng luật và cho cùng kết quả trên ma trận tương đương.
- AC-8: Given bài có hai tệp cùng băm và tệp thiếu băm, When dựng thẻ gắn nhãn và gọi `?nhan=&anh=` theo từng thứ tự, Then danh sách khử theo cùng luật, mỗi số `anh` trả đúng tệp của vị trí đó, thứ tự ngoài khoảng trả 404; dữ liệu thẻ gửi xuống trình duyệt không mang băm.
- AC-9: Given cùng dữ liệu đầu vào, When dựng dòng nhiều lần, kể cả trên dữ liệu thật, Then danh sách dòng và thứ tự giống hệt từng cột; bản giữ lại luôn là lần đầu theo `post_ids`, dù tệp, URL hay băm sắp theo thứ tự khác.

## Coverage

- Trục trạng thái ảnh (có tệp và băm, có tệp thiếu băm, băm sai khuôn, tải lỗi, chỉ có URL): AC-1, AC-2. Thước: `media_files` thật, 28.220 entry có tệp đều có băm.
- Trục vị trí trùng (trong bài, giữa các bài của tin, bài chỉ-ảnh gán vào, giữa hai tin): AC-1, AC-3; giữa hai tin giữ nguyên, ca âm ở AC-1.
- Trục nguồn (S03, S05, S06): AC-4, AC-5. S05 có 0 tệp nên hôm nay chỉ chạy nhánh URL.
- Trục bên đọc (`/ops/review`, `/ops/data-flow`, `/ops/deals`, thẻ gắn nhãn): AC-7, AC-8.
- Lớp vòng đời dữ liệu (lượt đầu xoá, dòng dời chỗ, chạy lại không đổi): AC-6. Lớp tất định: AC-9.
- `[NGÀNH: SHA-256 exact dedupe, khác băm cảm nhận pHash]` khử đúng từng byte, nên ảnh nén lại vẫn là hai ảnh: OOS-1.

## Out of scope

- OOS-1: Ảnh gần giống (nén lại, cắt, đổi cỡ): cần băm cảm nhận và phép đo riêng.
- OOS-2: Khử giữa hai tin khác nhau; gộp tin là việc của tầng khác.
- OOS-3: Tải thêm ảnh để biết băm của ảnh chỉ có URL.
- OOS-4: Đổi trần 12 ảnh, đổi giao diện hiện ảnh.
- OOS-5: `danhSachAnhCum` ở nhánh `feat/ghep-anh-tren-the-gan-nhan` chưa gộp: nhánh đó đổi khoá khi gộp, giám sát chuyển lời.
- OOS-6: Chạy lên DB thật trong vòng này; lượt đêm sau gộp tự áp.

## Notes
