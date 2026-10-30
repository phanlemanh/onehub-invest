---
schema_version: 1
feature: Bộ bóc SĐT của S03/S05 bắt đủ bốn dạng viết tách lạ, bỏ số 11 chữ số, và tin chọn SĐT theo luật rõ trên mọi bài của tin — dạng số ra giữ nguyên
slug: boc-sdt-du-va-chon-ro
owner: phanlemanh@gmail.com
risk_tier: T2      # máy suy: pipeline/transform-*.mjs, không chạm t3_paths
surfaces: [cli]
status: implemented
approved_by: Mạnh
approved_at: 2026-10-31
design_doc: docs/superpowers/specs/2026-10-30-boc-sdt-du-va-chon-ro-design.md
---

# Acceptance Contract: boc-sdt-du-va-chon-ro

## Context

Hàng SD2 của dãy P1 (đợt `nguoi-sdt-3010`), Cổng Đáng build (Mạnh 30/10). Audit 30/10 (N4–N6): bộ bóc bắt 99,6% số trong
chữ nhưng sót bốn dạng lạ (46 bài S03), nhận số 11 chữ số (27 bài), và tin chỉ giữ số đầu của bài đầu (11 tin nhiều số, 3 tin
rỗng SĐT dù bài có số). Dạng số ra `+84…` tách sang SD3 để khoá SĐT chỉ đổi một lần.

## Acceptance criteria

- AC-1: Given ma trận hình thái viết trước, sinh toàn phần từ ba trục (tiền tố `0` · `+84` · `84` · `(+84)` · `(84)` ·
  `(0dd)`) × (ký tự tách `.` · `-` · khoảng trắng · `•` · `·`) × (một hoặc hai ký tự tách giữa nhóm), cộng dòng riêng cho
  bốn dạng sót của audit và các dạng đã bắt (liền, từng chữ số cách), When `extractPhones` đọc, Then mỗi ô ra đúng mảng số
  `0xxxxxxxxx` viết trước và số assert bằng số ô.
- AC-2: Given câu có số 11 chữ số (liền, có dấu tách, `+84` kèm 10 số), câu có cả số 11 chữ số lẫn một số 10 chữ số, và câu
  có hai SĐT 10 chữ số kề nhau cách bởi mỗi loại ký tự tách hoặc xuống dòng, When `extractPhones` đọc, Then số 11 chữ số
  không có trong kết quả, số 10 chữ số vẫn có, và hai số kề nhau ra đúng hai số theo thứ tự.
- AC-3: Given câu không có SĐT (giá nhóm nghìn, diện tích, ngày, mã căn, số cố định 024, dãy 12 số, số trong URL), mỗi câu
  kèm bản đối chứng cùng câu có thêm một SĐT, When `extractPhones` đọc, Then câu gốc ra rỗng và bản đối chứng ra đúng SĐT ấy;
  `gatSo` của mọi câu trong ma trận AC-1 đến AC-3 ra đúng như bản trước vòng.
- AC-4: Given ma trận viết trước các tin (một bài một số · nhiều bài cùng số · số ở nhiều bài nhất không nằm ở bài đầu · hoà
  hai số · bài neo không có số · không bài nào có số), When `chonSdtTin` chọn, Then mỗi tin ra đúng số viết trước theo luật
  «nhiều bài nhất, hoà thì theo thứ tự neo».
- AC-5: Given transform S03 và S05 chạy trên DB thử, When xong, Then log mỗi nguồn có đúng một dòng `tin nhiều SĐT: <n>`, với
  `n` = số tin sống mà hợp các số trên mọi bài của tin có ≥ 2 số khác nhau (tin hai bài, mỗi bài một số khác nhau, cũng
  tính); thước đếm bằng bộ dò rộng độc lập với bộ bóc và in cạnh số audit 30/10 (S03 11, S05 1). (cross-layer)
- AC-6: Given DB thử sau khi transform mới chạy, When đọc `sale_offers` sống S03/S05, Then mọi `seller_phone` khác rỗng khớp
  `^0[35789]\d{8}$` và `seller_phone_hash` bằng 32 ký tự đầu của `sha256(seller_phone)`. (cross-layer)
- AC-7: Given bản chép dữ liệu thật (DB thử), When transform mới chạy, Then bài S03 sót theo bộ dò rộng (trừ bài chạm trần)
  = 0, bài nhận số 11 chữ số = 0, 3 tin S03 rỗng SĐT mà bài có số thành có, mọi `seller_phone` sống S03/S05 bằng
  `chonSdtTin` trên bài của tin; và cùng thước chạy trên kết quả của bản trước thì đỏ. (cross-layer)
- AC-8: Given cùng DB thử, When transform bản trước (merge-base với `main`) rồi bản mới chạy lần lượt cho S03 và S05, Then
  tập tin sống của mỗi nguồn (nhóm `post_ids`, giá, diện tích, kind) giống hệt nhau. (cross-layer)
- AC-9: Given cây sau sửa, When chạy bộ test pipeline, Then xanh.

## Coverage

- Trục A — dạng chữ: tiền tố × ký tự tách × số ký tự tách (ma trận toàn phần) | bốn dạng sót | 11 chữ số | hai số kề |
  không phải SĐT [AC-1, AC-2, AC-3]
- Trục B — chọn số của tin: một bài | nhiều bài cùng số | nhiều số | hoà | bài neo không số | không số [AC-4]
- Trục C — nguồn: S03 | S05 [AC-5, AC-7, AC-8]
- Trục D — đầu ra: dạng `0x` | băm [AC-6]
- Trục E — không lùi: tập tin, giá, diện tích | chữ đọc giá (`gatSo`) | suite [AC-3, AC-8, AC-9]
- Không chạy skill quét hình thái: không gian chữ của bộ bóc đã thành ma trận toàn phần ở AC-1 (dòng sổ thay
  d-20261030T165614Z-8).

## Out of scope

- Đổi dạng số ra sang `+84…`, đổi khoá băm, bí danh `sdt_bam`, `sellers`, `properties` và cloud (SD3 `sdt-luu-goc-e164`).
- Đọc SĐT ở S06 (N11); đọc số trong ảnh; gộp người theo SĐT (`gop-nguoi-sdt-tai-khoan`).
- Gạt bốn dạng mới khỏi chữ đọc giá (`gatSo` giữ nguyên); đổi khoá gom tin `repostKey`.
- Hàm chuẩn hoá E.164 dùng chung: SD3 viết khi nối vào đường ghi.

## Đường đo

- «Bài sót theo bộ dò rộng từ 46 xuống 0» ← AC-7 (bộ dò rộng của audit §2.2, trừ bài chạm trần theo Hỏi-1) + AC-1.
- «0 bài nhận số 11 chữ số» ← AC-7 + AC-2.
- «Mọi số trả về khớp `^\+84[35789]\d{8}$`» ← tách sang SD3; vòng này đo dạng `^0[35789]\d{8}$` (AC-6), dòng sổ ghi.
- «3 tin S03 rỗng SĐT mà bài có số thành có» ← AC-7 + AC-4.
- «Test cố định bốn dạng sót» ← AC-1.

## Notes
