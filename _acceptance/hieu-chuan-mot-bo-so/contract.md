---
schema_version: 1
feature: "Người vận hành mở «Hiệu chuẩn» trên /ops/quality thấy mỗi thị trường một bộ số nhất quán giữa các bảng, định nghĩa «tự thu» ghi rõ ở từng bảng, mẫu mỏng có cờ, và thị trường chưa có số gộp thành một dòng"
slug: hieu-chuan-mot-bo-so
owner: phanlemanh@gmail.com
risk_tier: T2
surfaces: [ui]
status: draft
design_doc: docs/superpowers/specs/2026-10-25-hieu-chuan-mot-bo-so-design.md
approved_by:
approved_at:
---

# Acceptance Contract: hieu-chuan-mot-bo-so

## Context

Vùng «Hiệu chuẩn» của `/ops/quality` chọn ngẫu nhiên một market S02 cho khu vực gộp nhiều market (thẻ Cần Thơ «score 0»
cạnh bảng toàn quốc 97,14), dùng ba định nghĩa «tự thu» cùng nhãn (Hà Nội 257 / 267 / 39), không cờ mẫu mỏng (Đồng Nai
1 listing, công suất 96,7%), và vẽ 10/29 thẻ toàn «—» trong khi đầu trang vẫn đếm 29. Vòng này cho mỗi khu vực một bộ số:
một định nghĩa «tự thu» ghi rõ ở từng bảng, market đại diện chọn theo luật cố định, cờ mẫu mỏng, và gộp thị trường chưa có
số. Cổng Đáng `build`: giám sát đợt `dot0-cam-mau` (P4-17) theo lệnh Mạnh 24/10.

Căn cứ: `docs/plan/lo-trinh.json` ON10 · `docs/plan/pham-vi-ops-noi-that-2410.md` OPS-11, OPS-15.

Source input: `_acceptance/hieu-chuan-mot-bo-so/opportunity.md` · hàng ON10 của lộ trình.

## Criteria

- AC-1: Given một khu vực có từ hai market S02, When trang lấy thẻ hiệu chuẩn hai lần, Then cả hai lần chọn cùng một
  market đại diện — market có nhiều listing S02 nhất, hoà thì mã nhỏ nhất — và thẻ ghi số market S02 mà nó đại diện.
- AC-2: Given một khu vực, When thẻ hiệu chuẩn, bảng Độ phủ và bảng toàn quốc hiện «listing tự thu» của khu vực ấy, Then
  ba chỗ ra cùng một số (số listing tự thu đang theo dõi trong cả cây khu vực).
- AC-3: Given mỗi bảng của vùng Hiệu chuẩn, When người vận hành đọc bảng, Then bảng có một dòng mô tả nói «tự thu» ở bảng
  ấy nghĩa là gì.
- AC-4: Given khu vực có dưới 5 listing tự thu, When thẻ hiệu chuẩn vẽ, Then thẻ mang nhãn «mẫu mỏng» cạnh số tự thu; khu
  vực có từ 5 listing không mang nhãn.
- AC-5: Given thị trường mà mọi số (cả hai phía và điểm thị trường) đều trống, When trang vẽ vùng Hiệu chuẩn, Then không có
  thẻ nào cho thị trường ấy; chúng gộp thành đúng một dòng «Chưa có số: …» liệt tên; thị trường có ít nhất một số vẫn có thẻ.
- AC-6: Given vùng Hiệu chuẩn đã chia, When đầu trang ghi số thị trường hiệu chuẩn, Then số ấy bằng số thẻ được vẽ (chỉ thị
  trường có số).
- AC-7: Given dữ liệu thật trên DB local, When chạy phép đo chỉ đọc, Then với mọi khu vực «listing tự thu» bằng nhau ở ba
  nguồn, chạy chọn market đại diện hai lần ra cùng kết quả, số thị trường hiệu chuẩn bằng số thị trường có số, và danh sách
  mẫu mỏng được in ra.
- AC-8: Given người đọc từ điển sản phẩm, When tra «Listing tự thu» và «Mẫu mỏng», Then `CONTEXT.md` có mục cho cả hai
  (nhãn · code · định nghĩa · tránh dùng), khớp nghĩa trên trang. (judgment)

## Coverage

Bỏ quét morphological-scan — xem dòng `descope` «bỏ coverage-scan» trong `decisions.jsonl`. Trục liệt tay:

- Trục A — nguồn số của một khu vực: nhiều market S02 · một market · không market → AC-1, AC-5
- Trục B — định nghĩa «tự thu»: thẻ · Độ phủ · toàn quốc → AC-2, AC-3
- Trục C — độ dày mẫu: < 5 · ≥ 5 → AC-4
- Trục D — đếm và gộp: thị trường có số · không số → AC-5, AC-6
- Trục E — dữ liệu thật + từ điển → AC-7, AC-8
- Later: đổi vùng thẻ sang một data-grid (OPS-15 «cân nhắc»).
- Never: cộng điểm thị trường của nhiều market S02.

## Đường đo

- Thước: «khu vực gộp nhiều market: chạy hai lần ra cùng số» · số từ: `scripts/hieu-chuan-do.mjs` + test chọn market · bảo
  đảm bởi: AC-1, AC-7
- Thước: «số tự thu của một khu vực giống nhau ở mọi bảng cùng định nghĩa» · số từ: `scripts/hieu-chuan-do.mjs` · bảo đảm
  bởi: AC-2, AC-7
- Thước: «đếm hiệu chuẩn chỉ tính thị trường có số» · số từ: test chia + `scripts/hieu-chuan-do.mjs` · bảo đảm bởi: AC-5,
  AC-6, AC-7

## Out of scope

- Đổi vùng thẻ Hiệu chuẩn sang một data-grid (đợt UI).
- Gộp ADR, công suất, điểm của nhiều market S02 thành một số.
- Số S02 lên cổng Invest (luật 5).
- Bảng «Kiểm chất lượng» (ON9, đã merge) và chữ tên thị trường (ON12, đã merge).

## Notes
