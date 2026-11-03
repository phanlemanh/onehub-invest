---
schema_version: 1
feature: Số ghép S06 không vào danh bạ Người và hiện trên Invest kèm nhãn chưa xác minh — điều kiện trước khi áp 068, migration 070
slug: so-ghep-s06-nhan-danh-ba
owner: phanlemanh@gmail.com
risk_tier: T3      # máy suy: db/migrations/ (070) — khớp t3_paths
surfaces: [api, cli, ui]
status: approved
approved_by: Mạnh
approved_at: 2026-11-03
design_doc: docs/superpowers/specs/2026-11-03-so-ghep-s06-nhan-danh-ba-design.md
---

# Acceptance Contract: so-ghep-s06-nhan-danh-ba

## Context

Mạnh chọn «mở hợp đồng mới» cho Ngoài-1, Ngoài-4 của `sdt-s06-ghep-tai-khoan` ngày 03/11: số S06 kể cả số ghép vào danh bạ, `sellers` ngay lượt ghi thật, trái mô tả đã ký, và rút số ghép không rút bí danh.
PR #274 vào main sau đó đưa `seller_phone` lên cloud và Invest, nên số ghép sẽ hiện không nhãn, trái Hỏi-3 Mạnh duyệt 02/11. Đo chỉ đọc 03/11: 590 số khác nhau trong stg, cả 590 đều có tin trực tiếp trong canonical; S06 có 0 bí danh `sdt`.

Source input: Cổng Bằng chứng `sdt-s06-ghep-tai-khoan` 03/11, tin giám sát đợt 03/11, `docs/plan/ra-mat-0511-so-luong-chat-luong.md` mục 5.

## Acceptance criteria

- AC-1: Given ma trận viết trước (nguồn S06, S03, S05 × số trực tiếp, số ghép, số không có dấu xuất xứ, không số), When `dungNguoi` chạy, Then với S06 chỉ tin mang dấu `s06-so-tren-tin` sinh bí danh `sdt` và người theo SĐT; tin ghép và tin mất dấu không sinh; mọi ô S03, S05 cho kết quả giống hệt bản trước vòng này; vai mọi tin S06 vẫn về người theo tài khoản. (cross-layer) (Hỏi-2)
- AC-2: Given tin đang giữ số ghép, When tin chuyển sang ẩn số, hoặc tài khoản có thêm số thứ hai trên một tin trực tiếp, rồi `ganSdtS06` và `dungNguoi` chạy, Then tập cặp bí danh và người không mất cặp nào; ca ẩn số không đổi tập; ca số thứ hai chỉ thêm đúng cặp của số trực tiếp mới; chạy lại lần hai không đổi. (cross-layer)
- AC-3: Given một số có tin trực tiếp và tin ghép, một số chỉ còn trên tin ghép, When đọc `sellers` và `sellersThieuNguoi`, Then số đầu có một dòng với `n_ads` tính cả tin ghép; số sau không có dòng và không bị báo thiếu; số trực tiếp thiếu bí danh vẫn bị báo (đối chứng dương). (cross-layer)
- AC-4: Given migration 070 áp hai lần trên lược đồ riêng, When đọc `sale_offers`, Then cột cuối `seller_phone_inferred` là true với tin S06 có số mà không mang dấu `s06-so-tren-tin` (ghép, mất dấu), false với S06 trực tiếp, S06 không số và mọi tin nguồn khác; giá trị mọi cột cũ của view giữ nguyên; `sale_offer_records` không đổi lược đồ, không đổi dòng; sau `resolve_offer_fields` cột vẫn đúng. (cross-layer) (Hỏi-5)
- AC-5: Given `runTransformChotot`, When view chưa có cột nhãn, kể cả khi bị một migration sau ghi đè, Then lượt không ghi số ghép mới, số trực tiếp vẫn ghi, in một dòng chứa `CHUA-AP-070`, không ném lỗi; When có cột, Then ghi đủ như AC-2 của hồ sơ trước. (cross-layer)
- AC-6: Given số ghép trong view và lược đồ tạm đứng vai cloud, When chạy sync thật rồi đọc `sale_offers` phía cloud, Then `seller_phone_inferred` tới nơi đúng giá trị true, `field_provenance` không tới và `piiColumnLeaks` vẫn chặn khi cố thêm; cloud thiếu cột thì sync chạy tiếp và cảnh báo lệch schema; tệp `docs/ops/cloud-schema-catchup-*-so-ghep.sql`: khối ĐO TRƯỚC gọi tên cột thiếu, khối ÁP chỉ có `ADD COLUMN IF NOT EXISTS`, chạy hai lần không lỗi, đầu tệp ghi đúng năm mốc của thiết kế. (cross-layer)
- AC-7: Given người gọi không đăng nhập, When gọi `GET /api/v1/listings` và `/api/v1/listings/<id>/contact`, Then `phoneInferred` và `inferred` đúng theo cột; có số mà cột NULL, hoặc cloud chưa có cột, thì trả true và không lỗi; khoá cũ giữ nguyên; bốn ca 404 vẫn cùng thân; danh sách không chứa SĐT; `check-api-surface` xanh. (cross-layer) (Hỏi-5)
- AC-8: Given thẻ tin rao ở trang Bán và Cho thuê, When xem và bấm liên hệ, Then năm trạng thái trong bảng Đặc tả UX hiện đúng: số ghép có Badge `warning-light` cỡ mặc định chữ «Chưa xác minh» trước, sau khi bấm và lúc lỗi; số trực tiếp và «Chưa có số» không có Badge; 320 px không tràn. (cross-layer) (Hỏi-3, Hỏi-4)
- AC-9: Given bản sao DB máy thu từ `db/db-thu.sh`, When chạy lệnh đo, Then tự áp 068, 070, chạy `ganSdtS06` và `dungNguoi` rồi in số trước và sau: bí danh `sdt` S06 mới lớn hơn 0 và không vượt số số trực tiếp; người mới; người không có tin; dòng `sellers`; tin có nhãn riêng bán và thuê, tổng lớn hơn 0 và bằng số tin không mang dấu trực tiếp; số tin ghép mà `rutDinhDanh` trả số khác null bằng 0, trong khi cùng phép đếm bỏ nhánh sửa lớn hơn 0; DB `oneinvest` không đổi; đầu ra không chứa SĐT; bất biến sai thì thoát 1. (cross-layer)
- AC-10 (judgment): Given các tài liệu, When đọc sau vòng này, Then `CONTEXT.md` có thuật ngữ nhãn; `pipeline/mappings.yaml` khai `seller_phone_inferred` theo ADR-0011 và sửa ghi chú `seller_phone`; thiết kế `sdt-s06-ghep-tai-khoan` có dòng đính chính mục hạ nguồn và OOS-2; ROADMAP nêu thứ tự 070 trước 068 và phần cloud.

## Quyết định chờ Mạnh

- **Hỏi-1. Nhãn trên Invest làm ở vòng này?** Máy khuyên: làm ở đây, cùng một đích là áp được 068, kịp mục 5 của kế hoạch ra mắt. Việc này đưa số ra người dùng thật. Lối khác A: vòng riêng; 068 chờ thêm một cổng. Lối khác B: che số ghép trên cloud tới khi có nhãn; rẻ hơn, nhưng khoảng 11.762 tin hiện «Chưa có số» lúc ra mắt.
- **Hỏi-2. Số ghép có vào danh bạ không?** Máy khuyên: không, bí danh S06 chỉ sinh từ số trực tiếp. Cả 590 số đang có tin trực tiếp nên danh bạ không thiếu số nào, và không phải dựng cơ chế rút. Việc này chạm ra ngoài: bí danh quyết số nào hiện ở `sellers`, và luật 055 chỉ thêm nên bí danh đã sinh không rút được. Lối khác: cho số ghép vào và làm cơ chế rút; thêm mã, sửa luật 055, không thêm số nào.
- **Hỏi-3. Nhãn hiện lúc nào?** Máy khuyên: hiện cả trước khi bấm, để người xem biết trước khi lấy số. Việc này hiện trên trang công khai. Lối khác: chỉ hiện sau khi bấm; thẻ gọn hơn, nhưng danh sách trông như số chắc chắn.
- **Hỏi-4. Chữ nhãn là gì?** Máy khuyên: «Chưa xác minh», đúng chữ Mạnh dùng khi duyệt ngày 02/11. Lối khác: chữ khác như «Số suy từ tài khoản»; rõ cách có số hơn nhưng dài và lộ cách làm.
- **Hỏi-5. Thiếu bằng chứng thì sao?** Máy khuyên: mọi số S06 không mang dấu trực tiếp đều coi là chưa xác minh, kể cả khi mất dấu xuất xứ; cột tính trong view, không ghi lại bảng; cloud chưa có cột thì mọi số hiện kèm nhãn và trang không lỗi. Việc này quyết cách trang công khai hỏng lúc ra mắt. Giá: trong lúc cột chưa về, cả số chắc chắn cũng mang nhãn. Lối khác A: chỉ gắn nhãn khi có dấu ghép; số không kèm nhãn khi mất dấu. Lối khác B: đọc thẳng cột, cloud thiếu cột thì trang Bán báo lỗi vùng vài phút như lần `tin-rao-tren-invest`. Lối khác C: cột thật trong bảng; phải ghi lại 48.499 dòng và giữ đồng bộ ở mọi nơi ghi xuất xứ.
- **Hỏi-6. Bỏ bản mẫu thiết kế?** Máy khuyên: bỏ, vì chỉ thêm một Badge vào ô liên hệ đã ký; Mạnh duyệt giao diện bằng chữ ở cổng này và xem ảnh thật ở Cổng Bằng chứng. Lối khác: dựng bản mẫu trước, thêm một phiên, khó kịp sáng 04/11.
- **Hỏi-7. Chấp nhận người SĐT S06 chưa nối?** Máy khuyên: chấp nhận ở vòng này; khoảng 590 người theo SĐT không có tin sẽ hiện ở `/ops/people` tới khi có vòng nối, AC-9 báo số thật. Lối khác: nối ngay; đổi công tắc gộp đang tắt và phải đo lại toàn danh bạ, không kịp mốc.

## Coverage

Quét bằng `morphological-scan`, chân sản phẩm từ `pipeline/lib/danh-ba-nguoi.mjs`, `pipeline/sync-cloud.mjs`, `app/src/lib/offers-public.ts`; chân ngành không áp dụng vì đây là luật nội bộ về số đã thu.

- Trục xuất xứ số: trực tiếp | ghép | mất dấu | không số [thước CE: bốn giá trị của bộ gán, ma trận 88 ô hồ sơ trước]
- Trục nguồn: S06 | S03 | S05 [thước CE: `SQL.tin` đọc đúng ba nguồn]
- Trục lớp: danh bạ | `sellers` | view | sync | cloud | API | giao diện [thước CE: đường dữ liệu trong thiết kế; mỗi lớp một AC]
- Trục thứ tự áp: 070 trước 068 | 068 trước 070 (AC-5) | view bị ghi đè (AC-5) | hàm bị ghi đè làm mất dấu (AC-1, AC-4) | cloud chưa có cột, cột NULL (AC-6, AC-7) [thước CE: năm mốc trong thiết kế; bài học Ngoài-5 của hồ sơ trước]
- Trục trạng thái ô liên hệ: năm dòng ở bảng Đặc tả UX [thước CE: `OfferContact` hiện có bốn nhánh]
- Core: AC-1 đến AC-9. Later: nối người SĐT S06 vào người tài khoản; `n_ads` tách trực tiếp với ghép. Never: suy số từ tên người bán.

## Out of scope

- Áp 068, 070 lên DB máy thu, ghi thật, áp cloud: triển khai riêng, Mạnh chạy, có `pg_dump`.
- Nối người theo SĐT S06 vào người theo tài khoản. AC-9 đo và báo số người không có tin.
- Ngoài-5 của hồ sơ trước: vẫn là việc riêng theo lựa chọn của Mạnh. Vòng này chỉ bảo đảm mất dấu thì nhãn và danh bạ hỏng theo hướng đóng; tin ẩn số giữ số ghép khi hàm bị ghi đè vẫn còn. Ngoài-6: thẻ đề xuất riêng.
- Sửa E9 và AC-9 của `sdt-s06-ghep-tai-khoan`: thuộc PR #283.
- Nhãn cấp tin của hàng `s03-len-cong`; xác minh số bằng cách gọi; gọi nguồn S06, chạy bộ thu.

## Notes

- Dựng trên `claude/sdt-s06-ghep-tai-khoan` + main, nên chỉ gộp được sau PR #283.
- Băm số ghép vẫn lên cloud qua `seller_phone_hash` theo Hỏi-2 đã duyệt của hồ sơ trước; hồ sơ này không đổi.
- Đường nền chưa chạy cho hồ sơ này: rào `chan-s4` nhận phiên theo worktree nên từ chối dù khoá `duong-nen` ghi tên P4; khoá đã nhả. Thẻ có cờ vàng thiếu số liệu nền; chạy lại khi dãy mở được từ worktree này.
- Số migration 070: giám sát đợt xác nhận 03/11, 069 thuộc N1 (dòng sổ cùng ngày); 067 đang để trống.
