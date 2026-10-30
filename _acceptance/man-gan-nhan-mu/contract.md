---
schema_version: 1
feature: Người gắn nhãn mở màn gắn nhãn trên /ops, gắn trường lõi cho tin của lát mà không thấy giá trị máy đoán, và 20% tin được gắn trùng để đo đồng thuận
slug: man-gan-nhan-mu
owner: phanlemanh@gmail.com
risk_tier: T3
surfaces: [ui, api, cli]
status: implemented
design_doc: docs/superpowers/specs/2026-10-30-man-gan-nhan-mu-design.md
approved_by: Mạnh
approved_at: 2026-10-30
---

# Acceptance Contract: man-gan-nhan-mu

## Context

Hàng PL7 (mã C1.3, phần màn gắn nhãn mù và lưu nhãn) của đợt phan-loai-2310. Cổng Đáng `build`: Mạnh 30/10 «Làm theo
khuyến nghị» — ngưỡng đồng thuận ≥ 0,9 trên phần gắn trùng, hạn 2 tuần sau gộp, nhãn chỉ ở máy thu
(`opportunity.md`). Lộ trình ghi hạng T2; máy suy T3 vì vòng chạm migration mới, `ops-access.ts` và
`app/src/app/api/v1/ops/**`. Số migration 054 do liên làn cấp (sổ SO-MIGRATION, 30/10), tệp `db/migrations/054_labels.sql`.

## Criteria

- AC-1: Given DB thử tạo từ `oneinvest`, When áp migration 054 hai lần, Then có bảng `eval_label_items`, bảng
  `eval_labels` và view `eval_label_agreement` với các cột của design doc; lần áp thứ hai không lỗi, không đổi số dòng.
  - Khoá duy nhất chặn: hai dòng `eval_label_items` cùng `(lat, text_hash)`; hai dòng `eval_labels` cùng
    `(item_id, labeler_id, field)`; `split` ngoài `dev`/`test`.
  - Hai bảng không có trong danh sách bảng của `pipeline/sync-cloud.mjs` và không xuất hiện trong `pipeline/push-ops-facts.mjs`.
- AC-2: Given `stg_zalo_posts` có tin của nhóm khớp lát, tin nhóm khác, post thử (L19) và tin trùng nội dung, When chạy
  `node pipeline/label-sample.mjs --lat ocp1 --n <n> --seed <s>`, Then `eval_label_items` có đúng `<n>` dòng.
  - Mọi dòng là tin S03 của nhóm khớp mẫu lát; không dòng nào là post thử (cùng bộ lọc với transform); không hai dòng
    cùng nội dung.
  - Số dòng `double_label` = làm tròn 20% của `<n>`; `split` chia đôi (lệch tối đa 1).
  - Chạy lại cùng tham số: 0 dòng thêm, 0 dòng đổi; `--thu` không ghi dòng nào.
  - Lát có ít hơn `<n>` nội dung khác nhau: lấy hết, in số thiếu, thoát 0.
- AC-3 (cross-layer): Given người dùng vai ops đã đăng nhập ở máy thu và lát đã lấy mẫu, When mở `/ops/labels`, điền
  trường lõi và bấm «Lưu và sang tin kế», Then `eval_labels` có đủ 9 dòng của tin đó mang `labeler_id` của người này,
  và trang hiện tin kế.
  - Chín trường: `listing_intent`, `kind`, `property_type`, `project`, `building`, `price_min_vnd`, `price_max_vnd`,
    `area_m2`, `bedrooms`.
  - Lựa chọn của ba trường đầu đúng bằng các giá trị của trục cùng tên trong sổ từ vựng (PL6).
  - Ô chọn «Tin không nêu» ghi `not_stated = true`, `value` rỗng.
- AC-4 (cross-layer): Given một tin của lát mà máy đã đọc ra giá trị (dòng `sale_offers`, phát biểu, đề xuất enrich mang
  chuỗi dấu riêng), When tin đó hiện trên `/ops/labels`, Then HTML trang và phản hồi của route nhãn không chứa chuỗi dấu
  nào trong số ấy.
  - Mã nguồn màn, truy vấn và route nhãn không nhắc tới bảng hay cột giá trị máy: `sale_offers`, `sale_offer_records`,
    `field_assertions`, `enrichment_proposals`, `meta`.
- AC-5: Given lát có tin đơn và tin gắn trùng, When hai người gắn lần lượt, Then mỗi người không bao giờ nhận lại tin
  mình đã gắn.
  - Tin đơn đã có một người gắn thì không đưa cho ai nữa.
  - Tin gắn trùng được đưa cho đúng hai người khác nhau, rồi thôi.
  - Tin trùng đã có một người được ưu tiên trước tin mới.
  - Ghi tin đơn đã có người khác gắn, hoặc tin trùng đã đủ hai người → 409, không ghi dòng nào.
  - Hai người ghi cùng lúc (hai giao dịch song song) vào cùng một tin đơn, hoặc vào tin trùng còn một chỗ: đúng một
    lượt thành công, lượt kia 409; số người gắn của tin không vượt số cho phép.
- AC-6: Given ma trận cặp viết trước (khớp, lệch, cùng «tin không nêu», một bên «tin không nêu», số bằng nhau viết khác
  nhau, tin trùng mới một người), When đọc `eval_label_agreement`, Then mỗi trường đúng số cặp đủ, số khớp và tỉ lệ khớp.
  - Trường chưa có cặp đủ → tỉ lệ rỗng (không phải 0).
  - `node pipeline/label-agreement.mjs --lat ocp1` in đúng các số ấy kèm dòng `thap_nhat` và `phut_cong` từng người
    (cộng khoảng giữa hai lượt lưu liên tiếp, bỏ khoảng nghỉ trên 10 phút).
  - Khứ hồi qua route ghi thật: «4,35 tỷ» với «4350 triệu», «LD2» với « ld2 », chữ dựng sẵn với chữ tổ hợp (NFC/NFD)
    → view báo khớp.
  - `/ops/labels` hiện cùng số; trường dưới 0,9 mang Badge cảnh báo.
- AC-7: Given gửi lượt ghi sai, When gọi route ghi nhãn, Then 400 nêu trường sai và không ghi dòng nào.
  - Bảy ca sai: thiếu trường; giá trị ngoài sổ từ vựng; giá thấp nhất lớn hơn giá cao nhất; số âm; diện tích bằng 0;
    phòng ngủ không nguyên; tin không thuộc lát.
  - Vai viewer → 403; bearer chung → 401/403; cả hai không ghi gì.
  - Trên màn: lỗi hiện dưới đúng ô, chữ đã gõ còn nguyên.
- AC-8: Given bảng mẫu rỗng, đang tải, lỗi truy vấn, người này đã gắn hết, vai viewer, hoặc chạy trên cloud (`VERCEL=1`),
  When mở trang, Then lần lượt thấy các trạng thái sau, không trang trắng.
  - Trạng thái trống có lệnh lấy mẫu; Skeleton; Alert có «Thử lại»; «Đã gắn hết» kèm bảng đồng thuận.
  - Vai viewer: số và bảng đồng thuận, không biểu mẫu.
  - Cloud: «Chỉ ở máy thu», không truy vấn bảng nhãn.
- AC-9: Given kho, When chạy test slug và soát menu, Then đủ các mục sau.
  - `CONTEXT.md` có thuật ngữ «Gắn nhãn» (`Slug URL: labels`) và «Nhãn đánh giá»; test route-slugs xanh.
  - Menu Ops nhóm «Xử lý» có mục trỏ `/ops/labels`.
  - `routes.md` và `portals.md` có dòng của trang.
  - `QUYEN_OPS` có `label.write` (vai ops, không bearer).
- AC-10: Given nhánh so với merge-base, When liệt kê tệp đổi, Then mọi tệp nằm trong danh sách dưới; không chạm làn
  ZCode (`collector/`, `pipeline/import-*`, `pipeline/collect-*`, cron).
  - Migration: `db/migrations/054_labels.sql`.
  - Pipeline: `pipeline/label-sample.mjs`, `pipeline/label-agreement.mjs`, `pipeline/lib/eval-labels.mjs` (+ test).
  - App: `app/src/app/ops/labels/`, `app/src/components/ops/labels/`, `app/src/app/api/v1/ops/labels/`,
    `app/src/lib/` (truy vấn nhãn, `ops-access.ts`), `app/src/components/shell/nav.tsx`, `app/tests/labels*.test.tsx`.
  - Tài liệu và hồ sơ: `CONTEXT.md`, `.claude/skills/onehub-ui/routes.md`, `docs/architecture/portals.md`,
    `_acceptance/config.yaml`, hồ sơ này, design doc.
  - Tệp máy sinh: `PRODUCT-MAP.md`, `LO-TRINH.html`.

## Coverage

- Trục (từ câu giao + F5 + §3.5, quét hình thái entity-feature trong `coverage-scan.md`): **lưu** (AC-1) · **chọn tin
  của lát** (AC-2) · **gắn** (AC-3) · **mù** (AC-4) · **gắn trùng 20%** (AC-2 tỉ lệ, AC-5 phân tin) · **đo đồng thuận**
  (AC-6) · **chặn ghi sai/quyền** (AC-7) · **trạng thái trang** (AC-8) · **đường tới trang + từ vựng** (AC-9) ·
  **phạm vi/làn + tầng A không rời máy** (AC-10, AC-1).

## Đường đo

- Ngưỡng ở `opportunity.md`: đồng thuận ≥ 0,9 trên phần gắn trùng; gắn hết lát trong khoảng 6 giờ công; hạn 2 tuần.
  Ô cơ hội ghi lát «khoảng 200 tin và 100 cặp»; vòng này chỉ có 200 tin S03 (40 tin gắn trùng → 40 cặp đồng thuận),
  không có 100 cặp ghép căn G3 — Hỏi-6 xin Mạnh xác nhận cắt và co ngưỡng giờ công về khoảng 4 giờ cho 200 tin.
  - Đồng thuận: số từ `node pipeline/label-agreement.mjs --lat ocp1` (dòng từng trường và `thap_nhat`). AC bảo đảm:
    AC-6 (số đúng), AC-5 (cặp đủ hai người khác nhau), AC-2 (đúng 20%).
  - Giờ công: `labeled_at` của `eval_labels` theo người gắn — lệnh in thêm tổng phút giữa lượt lưu liên tiếp (khoảng
    nghỉ > 10 phút không tính). AC bảo đảm: AC-3 (mỗi lượt lưu ghi `labeled_at`), AC-6 (lệnh).

## Out of scope

- Tin S05/S06 của G1 (100 + 100 tin) và cặp ghép căn G3 (150 cặp) — vòng sau trên cùng bảng.
- `eval:classify`, cận dưới Wilson, `dq_check_results` (PL9); tập nhãn mẫu sinh từ khuôn (PL8).
- Gắn từ xa qua cloud: nhãn sẽ đi ngược chiều kéo một chiều (ADR-0015) — hàng riêng nếu cần.
- Sửa hay xoá nhãn đã lưu; vai «người gắn nhãn» riêng; trường `price_basis` (PL13), tầng, mã căn, trục căn.
- Văn bản hướng dẫn gắn nhãn (tài liệu vận hành của người gắn).

## Notes

- Câu chờ Mạnh ở Cổng Phạm vi: Hỏi-1 (cách đo đồng thuận), Hỏi-2 (ai được gắn), Hỏi-3 (chín trường lõi), Hỏi-4 (bỏ
  design-pass), Hỏi-5 (định nghĩa lát), Hỏi-6 (cắt cặp G3, co ngưỡng giờ công) — sổ
  quyết định, dòng dạng câu hỏi.
