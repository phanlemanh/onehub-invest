---
schema_version: 1
feature: Thước «không tin nào mất hay đổi phường» của phép đo tin rao nối tin S03/S05 qua bài đăng, đo được cả khi mã tin đổi
slug: tin-rao-doi-phuong-noi-post-ids
owner: phanlemanh@gmail.com
risk_tier: T2
surfaces: [script]
status: signed-off
veto_state: mo
veto_opened_at: 2026-10-26T10:30:00Z
design_doc: docs/superpowers/specs/2026-10-26-tin-rao-doi-phuong-noi-post-ids-design.md
---

# Acceptance Contract: tin-rao-doi-phuong-noi-post-ids

## Context

Ngoài-4/6 của `tin-rao-gan-khu-vuc-dung` (Mạnh ký 26/10, «mở hợp đồng mới»). «Thước lệch» = phần của
`scripts/kiem-tin-rao-gan-khu-vuc.mjs` đo «0 tin có phường hợp lệ trước lượt bị gỡ hay đổi khu vực». «Nối theo bài» =
ghép tin trước/sau lượt khi mã tin không còn, qua `post_ids` chung. Thiết kế ở design doc §2.

## Criteria

- AC-1: Given ma trận viết trước mười ca của `lechTheoBai` — (a) cùng mã cùng phường; (b) cùng mã, phường thành NULL;
  (c) cùng mã, đổi sang phường khác; (d) mã đổi, bài sang tin mới cùng phường; (e) mã đổi, bài sang tin mới phường NULL;
  (f) mã đổi, bài sang tin mới phường khác; (g) bài không còn ở tin nào sau lượt; (h) tin hai bài, mã cũ còn giữ một
  bài, bài kia sang tin mới phường NULL; (i) tin hai bài sang hai tin sau, một giữ phường một đổi phường; (j) tin S06
  không bài, cùng mã, phường thành NULL — When gọi hàm, Then mỗi ca ra đúng kết quả viết trước: (a)(d) không lệch;
  (b)(e)(j) `mat-phuong`; (c)(f) `doi-phuong`; (g) vào `khongCon` gọi bài; (h) đúng một `mat-phuong` gọi bài sang tin
  mới; (i) đúng một `doi-phuong` gọi bài đổi; số ca đã kiểm = 10.
- AC-2: Given DB local trong một transaction có một bài S03 mồi và một bài S05 mồi nhắc tên một phường hợp lệ mồi, When
  chạy transform tương ứng (`runTransformZalo`, `runTransformFb`), chụp, đánh dấu `lac` phường mồi, chạy lại, chụp, Then
  `lechTheoBai(chụp 1, chụp 2)` trả đúng hai lệch loại `mat-phuong` gọi hai `post_id` mồi; chiều đỏ: thước cũ `lech`
  (nối theo `offer_id`) trên cùng hai lần chụp trả rỗng.
- AC-3: Given DB local, When `node scripts/kiem-tin-rao-gan-khu-vuc.mjs --thu` chạy chụp 0 → hai bài mồi → lượt A →
  chụp 1 → đánh dấu `lac` phường mồi → lượt B → chụp 2 trong MỘT transaction rồi ROLLBACK, Then: `lechTheoBai(chụp 0,
  chụp 1)` có 0 lệch và in «0 tin có phường hợp lệ trước lượt bị gỡ hay đổi khu vực (nối theo bài cho S03/S05, theo
  offer_id cho S06)»; `lechTheoBai(chụp 1, chụp 2)` bằng đúng hai bài mồi và 0 tin thật (dòng «đối chứng qua cùng hàm:
  2 bài mồi mất phường, 0 tin thật»); mọi bài trong `khongCon` của hai lần so không còn trong `stg_zalo_posts` (bài còn
  trong stg → FAIL «nối hỏng» gọi bài); mỗi nguồn in số bài/tin không còn sau lượt; ROLLBACK giữ số dòng `sale_offers`.

## Coverage

Trục: {nối: cùng mã, bài sang tin mới, bài không còn, tin nhiều bài tách} × {kết cục: giữ phường, mất phường, đổi
phường} × {nguồn: có bài (S03/S05), không bài (S06)} — mười ô viết trước ở AC-1; {đo: hàm thuần (AC-1), mồi S03 + S05
qua transform thật (AC-2), phép đo trên dữ liệu thật có đối chứng qua cùng hàm và chặn «nối hỏng» (AC-3)}.

## Out of scope

- Khoá tin bền của PL14 (chưa có) — đổi thước sang khoá đó ở việc riêng khi PL14 xong.
- Đối chứng dương «trạng thái trước có tin trỏ khu vực không hợp lệ» của phép đo (Ngoài-5 hàng trước, Known limits).
- Sửa transform hay cách băm `offer_id`.

## Notes

- Bài không còn ở tin nào sau lượt: trong transaction chỉ chạy transform thì stg không đổi, nên bài ấy phải đã rời stg;
  còn trong stg là nối hỏng và thước đỏ (AC-3).
- Known limits — chọn ở Cổng Bằng chứng 2026-10-26:
  - Ngoài-1: test của thước (`scripts/lib/doi-phuong.test.mjs`) chỉ chạy khi nghiệm thu, CI không tự chạy nên thước hỏng về sau không bị chặn trước khi vào bản chính.
  - Ngoài-2: sửa các bước xử lý tin rao (transform S03/S05) sau này không tự làm bằng chứng của hồ sơ này hoá cũ.
  - Ngoài-4: phép đo có thể báo đỏ nhầm «nối hỏng» khi bài mới nạp vào stg mà chưa qua lượt xử lý; chạy lại sau lượt xử lý là hết.
