---
schema_version: 1
feature: "Người vận hành mở «Hiệu chuẩn» trên /ops/quality thấy mỗi thị trường một bộ số nhất quán giữa các bảng, định nghĩa «tự thu» ghi rõ ở từng bảng, mẫu mỏng có cờ, và thị trường chưa có số gộp thành một dòng; bước chụp trang của kho chụp được /ops đã đăng nhập"
slug: hieu-chuan-mot-bo-so
owner: phanlemanh@gmail.com
risk_tier: T2
surfaces: [ui, script]
status: signed-off
design_doc: docs/superpowers/specs/2026-10-25-hieu-chuan-mot-bo-so-design.md
approved_by: Mạnh
approved_at: 2026-10-25
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
  ba chỗ ra cùng một số (số listing tự thu đang theo dõi trong cả cây khu vực — định nghĩa chốt ở Cổng Phạm vi, câu hỏi «một định nghĩa tự thu»).
- AC-3: Given mỗi bảng của vùng Hiệu chuẩn, When người vận hành đọc bảng, Then bảng có một dòng mô tả nói «tự thu» ở bảng
  ấy nghĩa là gì.
- AC-4: Given khu vực mà số listing đứng sau ADR/công suất tự thu của thẻ (cỡ mẫu metrics) dưới 5, When thẻ hiệu chuẩn vẽ,
  Then thẻ mang nhãn «mẫu mỏng» cạnh số ấy; cỡ mẫu từ 5 trở lên không mang nhãn (ngưỡng và cơ sở chốt ở Cổng Phạm vi, câu hỏi «ngưỡng mẫu mỏng»).
- AC-5: Given thị trường mà mọi số (cả hai phía và điểm S02) đều trống, When trang vẽ vùng Hiệu chuẩn, Then không có
  thẻ nào cho thị trường ấy; chúng gộp thành đúng một dòng «Chưa có số: …» liệt tên; thị trường có ít nhất một số vẫn có thẻ.
- AC-6: Given vùng Hiệu chuẩn đã chia, When đầu trang ghi số thị trường hiệu chuẩn, Then số ấy bằng số thẻ được vẽ (chỉ thị
  trường có số).
- AC-7: Given dữ liệu thật trên DB local, When chạy phép đo chỉ đọc, Then với mọi khu vực «listing tự thu» bằng nhau ở ba
  nguồn, chạy chọn market đại diện hai lần ra cùng kết quả, số thị trường hiệu chuẩn bằng số thị trường có số, và danh sách
  mẫu mỏng được in ra.
- AC-8: Given người đọc từ điển sản phẩm, When tra «Listing tự thu», «Mẫu mỏng» và «Thị trường hiệu chuẩn», Then
  `CONTEXT.md` có mục cho cả ba (nhãn · code · định nghĩa · tránh dùng), khớp chữ trên trang đã chốt ở Cổng Phạm vi (câu hỏi «bộ chữ nhãn»). (judgment)
- AC-9: Given app dev đang chạy và DB local có tài khoản ops thử, When bước chụp trang của kho (`capture.ui`) chụp một URL
  `/ops/**`, Then nó tự đăng nhập bằng tài khoản thử rồi chụp đúng trang đích (không phải trang đăng nhập); mật khẩu và cookie
  phiên không ra stdout/stderr, tệp phiên quyền 600 và bị xoá khi xong; đăng nhập hỏng thì thoát mã khác 0 kèm lời rõ và
  không ghi ảnh; chữ tầng A được che trước khi chụp, còn lộ thì không ghi ảnh; URL ngoài `/ops` chụp như cũ, không đăng nhập.
- AC-10: Given app dev đang chạy, When chụp vùng «Hiệu chuẩn» của `/ops/quality` bằng bước chụp ấy ở sáng 1440, tối 1440 và
  sáng 390, Then mỗi ảnh là trang đã đăng nhập, thấy câu định nghĩa «Listing tự thu», dòng «Chưa có số: …» khi có thị
  trường trống, nhãn «mẫu mỏng» khi có thẻ mẫu mỏng, đầu trang «n thị trường hiệu chuẩn», không chữ đè và không cuộn ngang.

## Coverage

Bỏ quét morphological-scan — xem dòng `descope` «bỏ coverage-scan» trong `decisions.jsonl`. Trục liệt tay:

- Trục A — nguồn số của một khu vực: nhiều market S02 · một market · không market → AC-1, AC-5
- Trục B — định nghĩa «tự thu»: thẻ · Độ phủ · toàn quốc → AC-2, AC-3
- Trục C — độ dày mẫu: < 5 · ≥ 5 → AC-4
- Trục D — đếm và gộp: thị trường có số · không số → AC-5, AC-6
- Trục E — dữ liệu thật + từ điển → AC-7, AC-8
- Trục F — bước chụp: URL /ops · URL ngoài /ops · phiên hỏng · tầng A lộ → AC-9; ảnh vùng ở ba chế độ → AC-10
- Later: đổi vùng thẻ sang một data-grid (OPS-15 «cân nhắc»).
- Never: cộng điểm S02 của nhiều market S02.

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

- Known limits — chọn ở Cổng Bằng chứng 2026-10-25:
  - Ngoài-1: Khi chạy thử kiểm chứng phép đo, dòng kết quả trông giống hệt lần chụp thật và vẫn ghi ảnh ra, nên người chấm dễ nhầm lần thử với lần chụp hợp lệ.
  - Ngoài-2: Bộ kiểm tự động cho phép đo bề rộng trang có thể vẫn báo xanh dù phép đo đo sai, nên việc phát hiện trang bị cuộn ngang phải dựa vào lần chạy thật.
  - Ngoài-3: Thẻ trình người ký hiển thị nhầm tám mục kiểm là chưa đạt trong khi thực tế chỉ còn một vấn đề, nên người ký có thể chọn hướng xử lý sai.
  - Ngoài-4: Phép kiểm tự động chưa chạy thử phép đo trên một trang mô phỏng, nên nếu phép đo hỏng thì bộ kiểm vẫn không báo đỏ.
  - Ngoài-5: Bộ kiểm dùng số liệu viết sẵn nên không bắt được trường hợp công cụ chụp đọc sai kết quả đo; khi đó lúc chạy thật chỉ báo không đo được.
  - Ngoài-6: Bước thử xác nhận phép đo gần như luôn qua, nên nó chưa chứng minh được phép đo bắt được lỗi trang tràn ngang thật nằm sâu trong nội dung.
  - Ngoài-7: Khi công cụ chụp trang không đo được bề rộng, nó vẫn chụp và báo thành công mà không nói gì, nên người xem có thể tưởng trang đã được kiểm bề rộng trong khi thật ra chưa.
  - Ngoài-8: Nếu sau này dòng bề rộng bị in nhầm chỗ khung và trang, bài test hiện tại vẫn báo xanh, nên người vận hành có thể đọc ngược hai con số trong báo cáo chụp trang.
  - Ngoài-10: Trang Chất lượng có thể tải chậm hơn cần thiết vì cùng một phép đếm listing bị lặp lại cho từng thị trường; số hiển thị vẫn đúng.
  - Ngoài-11: Hiếm khi bước chụp có thể báo thành công và in đường dẫn ảnh dù ảnh không hề được tạo, nên người nghiệm thu nhận bằng chứng rỗng mà không có cảnh báo.
  - Ngoài-12: Nếu ai chụp nhầm một địa chỉ thật (bản chạy chính thức hay bản xem trước) có trang /ops, mật khẩu của tài khoản thử trên máy sẽ bị gửi ra ngoài máy.
  - Ngoài-14: Bước chụp có thể báo xong và in đường dẫn dù ảnh không có thật, khiến hồ sơ nghiệm thu thiếu ảnh mà không ai được báo.
  - Ngoài-15: Dòng báo «tự thu bằng nhau ở ba nguồn» luôn xanh nên không phát hiện được nếu cách đếm listing tự thu bị sai ở các khu vực nhiều tầng.
  - Ngoài-16: Bài kiểm «số thị trường ở đầu trang bằng số thẻ vẽ» chỉ đọc mã nguồn, nên nếu sau này sửa trang làm hai con số lệch nhau thì bài kiểm vẫn có thể xanh.
  - Ngoài-17: Bài kiểm «bản cũ không đăng nhập thì bị đưa về trang đăng nhập» dùng bản giả trả kết quả định sẵn, nên chưa đo hành vi thật của bản cũ; ảnh chụp thật là bằng chứng đăng nhập thành công.
