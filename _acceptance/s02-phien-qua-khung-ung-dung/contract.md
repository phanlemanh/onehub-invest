---
schema_version: 1
feature: "S02 — bộ thu chờ ứng dụng web tự cấp lại phiên (nạp bộ khung ứng dụng qua đường dẫn không bị thử thách), làm mới token trước khi gọi, lỗi xác thực dừng cả lượt; lệnh login mở đúng profile cho Mạnh tự đăng nhập"
slug: s02-phien-qua-khung-ung-dung
owner: phanlemanh@gmail.com
risk_tier: T2
surfaces: [cli]
status: implemented
veto_state: mo
veto_opened_at: 2026-11-25T02:50:00Z
approved_by:
approved_at:
design_doc: _acceptance/s02-phien-qua-khung-ung-dung/design.md
---

# Acceptance Contract: s02-phien-qua-khung-ung-dung

## Context

Thu S02 hỏng 23 đêm liền (29/10 → 20/11, 401) rồi mỗi đêm dừng ở token hết hạn (21 → 24/11); dữ liệu S02 mới nhất là
đêm 28/10. Nguyên nhân đo lại ngày 25/11: bộ thu mở đúng route dữ liệu của nguồn, route đó trả về trang thử thách cho
trình duyệt có kết nối gỡ lỗi, ứng dụng không tải nên token 15 phút không được cấp lại. Hàng này sửa bộ thu để lượt
19:05 mỗi đêm lấy lại được token mà không đổi trình duyệt, không giải trang thử thách, không tự gọi API xác thực; và
đưa ra lệnh để Mạnh tự đăng nhập vào đúng profile khi phiên hết. Người dùng: lượt thu hằng đêm của nguồn S02.

Source input: lời Mạnh trong phiên ZCode S02 ngày 25/11 («Mục tiêu là thu ổn định») + sự cố thu S02 24/11 (vòng claudedp-2411-7) + lời giao claudedp-2511-50 (25/11 19:25: đi cửa chính, không bung cửa sổ, không lẫn với trình duyệt của Mạnh, không tự gộp)

## Criteria

- AC-1 (lề token — vừa đọc xong còn kịp gọi API): Given năm token gọi `duDungKhong(token, now)` với `now` cố định — còn 31 giây · còn 29 giây · hết hạn 1 giây · chuỗi rác · rỗng, When hàm chạy, Then chỉ token còn 31 giây trả đúng; bốn ô kia trả sai. Chiều đỏ: bản đột biến bỏ lề (so hạn còn lại với 0) bị bắt ở ô «còn 29 giây».
- AC-2 (dùng lại token đang giữ): Given token đang giữ còn hạn 10 phút, When hỏi `dungLaiToken(token, ép)`, Then trả đúng khi không ép và trả sai khi ép làm mới; token rỗng hoặc đã hết hạn trả sai ở cả hai. Chiều đỏ: bản đột biến bỏ vế «ép» bị bắt ở ô «còn hạn, ép làm mới».
- AC-3 (mọi token ra khỏi hàm nạp đều qua kiểm lề; không chờ cứng; không mở chỗ khác; không bung cửa sổ): Given thân hàm nạp một đường dẫn của bộ thu S02 (tệp duy nhất trong `collector/src/collectors/` xuất `docExpAppToken`), When soi tĩnh từng câu `return token;`, các lời chờ, các lời `page.goto(` và tuỳ chọn mở trình duyệt, Then mỗi câu `return token;` nằm trên dòng có điều kiện `duDungKhong(`; tệp không còn `waitForTimeout(`; mọi lời `page.goto(` trỏ về `APP_ORIGIN + duong` (duong đi từ danh sách ứng viên) hoặc `about:blank`; trình duyệt mở ở chế độ không cửa sổ (`headless: true`, không còn `headless: false`); trong danh sách ứng viên route dữ liệu `/data/vn` đứng cuối, không lặp, đều là đường dẫn tương đối. Chiều đỏ trên năm bản chép — đổi điều kiện thành `if (token)` · cấy một câu `return token;` trước khi kiểm · cấy lại lời chờ cứng · cấy một lời `page.goto` trỏ chỗ khác · mở có cửa sổ — mỗi bản đỏ với đúng thông điệp ghim.
- AC-4 (thử đường kế tới đâu thì dừng): Given kết quả quan sát của một đường dẫn — (a) khung không nạp được, không thấy lời gọi xác thực · (b) khung nạp được, chưa thấy lời gọi xác thực · (c)–(f) thấy mã 200 · 401 · 403 · 500, When hỏi `thuDuongKe`, Then chỉ (a) trả đúng (thử đường kế). Given phép xếp đường `thuDuongUngVien` với bước nạp giả, When bước nạp chạy theo bốn kịch bản — đường đầu có token · đường đầu bị thử thách rồi đường hai có token · khung nạp được mà không có token · mọi đường bị thử thách, Then số đường đã nạp lần lượt là 1 · 2 · 1 (không đụng route dữ liệu) · 3; bước nạp trả lại đúng token bị từ chối thì coi như không có. Chiều đỏ: ba bản đột biến — bỏ vế khung · trả đúng luôn · không dừng khi khung đã nạp — mỗi bản bị bắt ở ô được ghim.
- AC-5 (chẩn đoán đúng nguyên nhân): Given năm tình huống — (a) lời gọi xác thực trả 401 (hoặc 403) · (b) trả 200 nhưng không có token · (c) hai đường dẫn không nạp được khung · (d) khung nạp được mà không có token · (e) token còn hạn bị máy chủ từ chối, nạp lại không có token khác, When gọi `chanDoanKhongCoToken`, Then lần lượt: (a) nói «BỊ TỪ CHỐI»; (b) nói «ứng dụng chạy nhưng không cấp» và không nói bị từ chối; (c) nói «KHÔNG nạp được khung» và liệt kê cả hai đường dẫn; (d) nói «nạp được khung nhưng không có token»; (e) nói «từ chối token còn hạn»; (a), (c), (d), (e) đều chỉ lệnh `login --source`; danh sách rỗng cũng cho «KHÔNG nạp được khung» mà không ném. Chiều đỏ: hai bản đột biến — bỏ nhận 401/403 · đổ «khung nạp được» cho «không nạp được» — mỗi bản bị bắt ở ô được ghim.
- AC-6 (lỗi xác thực dừng cả lượt; không gửi lại token bị từ chối): Given `call()` và trình lấy token `phienTu` với hàm gửi giả và bước nạp giả, When (a) bước làm mới ném `LoiXacThuc` · (b) hàm gửi trả 401, làm mới cho token khác, vẫn 401 · (c) hàm gửi trả 401 mà làm mới không đổi token · (d) bước nạp ném lỗi thường (không phải `LoiXacThuc`) · (e) sau 401 bước nạp cứ trả lại đúng token bị từ chối · (f) `appToken` trong kho không phải chuỗi, Then (a) `call` ném lại `LoiXacThuc`, hàm gửi nhận 0 lời, bộ đếm lời gọi lỗi không tăng; (b) ném `LoiXacThuc` sau đúng một dòng `AUTH FAIL [S02]`, hai lời gửi mang hai token khác nhau; (c) không gửi lại, ném `LoiXacThuc` sau đúng một dòng `AUTH FAIL [S02]`; (d) vẫn dừng cả lượt bằng `LoiXacThuc`, đúng một dòng `AUTH FAIL [S02]`, giữ nguyên văn thông điệp gốc; (e) không trả lại token ấy: ném `LoiXacThuc` sau đúng một dòng `AUTH FAIL [S02]`, và sau 401 chỉ nạp lại một đường dẫn; (f) đọc được rỗng, không ném. Chiều đỏ: bốn bản đột biến — bỏ vế `err instanceof LoiXacThuc` ở khối bắt lỗi của `call` · gửi lại dù token không đổi · quên đổi lỗi thường thành lỗi dừng cả lượt · trả lại token bị từ chối — mỗi bản bị bắt ở ô được ghim.
- AC-7 (lỗi thường không dừng cả lượt — vế không-bắn của AC-6): Given `call()` với token còn hạn và hàm gửi trả mã 500, When gọi, Then trả `null` và bộ đếm lời gọi lỗi tăng đúng 1, không ném.
- AC-8 (làm mới token trước khi gọi): Given `call()` với token còn 5 giây và bước làm mới đổi sang token còn 10 phút, When gọi, Then bước làm mới chạy đúng một lần trước lời gửi và lời gửi mang token MỚI; với token còn 10 phút thì bước làm mới chạy 0 lần. Chiều đỏ: bản đột biến bỏ bước làm mới trước khi gửi bị bắt ở ô «còn 5 giây».
- AC-9 (đăng nhập vào đúng profile; lệnh `login` dừng đúng chỗ): Given `argsMoChromeDangNhap(thư_mục)`, When đọc tham số, Then có đúng một tham số `--user-data-dir=<thư_mục>`; tham số cuối là URL https kết thúc bằng `/data/vn`; không tham số nào mang cờ tự động hoá (`--enable-automation`, `remote-debugging`, `headless`, `AutomationControlled`); bộ thu S02 khai hàm `login`; `AIRDNA_CHROME_BIN` đổi được tệp chạy Chrome. Given CLI đã build với Chrome giả (`/usr/bin/true`) và profile là thư mục tạm, When chạy `login` đúng nguồn, Then thoát 0, in hướng dẫn có chữ «profile bộ thu», không in Usage, không chạy bộ thu; When tệp chạy Chrome không tồn tại, Then thoát 1 kèm lý do, không in Usage; và lệnh `collect -- list-sources` vẫn chạy sau khi build. Chiều đỏ: bản chép của CLI với lệnh `login` rơi sang nhánh lệnh kế (lỗi P0 của lần review độc lập 25/11) phải đỏ với thông điệp ghim; bản đột biến profile sai chỗ · bỏ biến môi trường Chrome bị bắt ở ô được ghim.
- AC-10 (đổi chỗ profile, không phá vùng, bộ test xanh; không mở được profile): Given `thuMucProfile(env, mặc_định)`, When biến `AIRDNA_PROFILE_DIR` có giá trị · thiếu · rỗng, Then lần lượt dùng giá trị đó · mặc định · mặc định. Given nhánh này so với `origin/main`, When so danh sách tệp đổi, Then chỉ gồm: tệp bộ thu S02, `collector/src/core/types.ts`, `collector/src/cli.ts`, tệp test của hàng này, `collector/CLAUDE.md`, `collector/AGENTS.md`, hồ sơ này và hai tệp sinh `LO-TRINH.html`, `PRODUCT-MAP.md`; `npm test` của collector xanh. Given lỗi không mở được profile, When dựng chẩn đoán `chanDoanKhongMoDuocProfile`, Then nói tên profile, hỏi còn cửa sổ Chrome nào mở trên profile ấy không, chỉ lệnh `login`, và giữ nguyên văn chi tiết gốc. Chiều đỏ: danh sách tệp có cấy một tệp ngoài vùng thì phép đo in «ĐỎ: tệp ngoài vùng».

## Coverage

Bỏ coverage-scan — hàng sửa lỗi ở một tệp bộ thu, trục liệt tay từ các lần chạy thật ngày 25/11 (entry d-20261125T025000Z-3)

- Trục trạng thái token lúc đọc: còn hơn lề · còn dưới lề · hết hạn · rác — AC-1, AC-3
- Trục cửa sổ của trình duyệt bộ thu: mở có cửa sổ (cũ) · không cửa sổ — AC-3
- Trục lý do làm mới: sắp hết hạn · vừa bị 401 (ép) — AC-2, AC-6, AC-8
- Trục ứng dụng khi nạp: không nạp được khung · nạp được khung, chưa có phản hồi · nạp được, bị từ chối · nạp được, không có token · nạp được và cấp token — AC-4, AC-5
- Trục thử đường kế: dừng ngay · thử đường hai · thử đủ ba — AC-4
- Trục kết cục lời gọi API: có dữ liệu · 401 một lần rồi thành công · 401 hai lần · 401 mà token không đổi · lỗi máy chủ · bước làm mới ném lỗi xác thực · bước nạp ném lỗi thường — AC-6, AC-7, AC-8
- Trục lệnh của người: `login` đúng nguồn · không mở được Chrome · `list-sources` — AC-9
- Trục phiên của người: phiên sống với token hết hạn · profile chưa từng đăng nhập — hai ô chạy thật ngày 25/11, ghi ở Notes
- Ô bỏ: chạy thật với nguồn sống không xếp thành eval — cần phiên của Mạnh và mỗi lần chạy là lưu lượng thật

## Out of scope

- Đổi những gì bộ thu GỌI (cây API, số lời gọi mỗi thị trường, mỗi quận): phía ta chỉ đọc 5 số mỗi thị trường trong khi bộ thu gọi thêm 8 lời gọi mỗi quận cho bảng không ai đọc — việc riêng.
- Bộ đọc dòng `AUTH FAIL [S02]` để báo người khi lượt đêm thất bại (hiện chưa có bộ đọc nào).
- Triển khai sau gộp: build lại `dist` của collector ở checkout chính — Mạnh giao riêng.
- Dữ liệu S02 lên cloud và route công khai trả số S02 — làn Claude đang làm (hàng HT23).
- Đăng nhập hộ Mạnh: lệnh `login` chỉ mở cửa sổ Chrome thường với đúng profile; Mạnh tự đăng nhập.
- Gỡ lõi「token hết hạn giữa lượt bị nuốt」ở các bộ thu khác — mỗi bộ thu một hồ sơ.
- Tự đóng cửa sổ đăng nhập hay tự chạy lượt khi cửa sổ còn mở: bộ thu chỉ báo rõ; đóng cửa sổ là việc của người.
- Sửa bẫy kỹ thuật số 2 của `AGENTS.md` gốc («chỉ headful Chrome») cho đúng với S02: tài liệu gốc thuộc làn Claude — báo ở XONG.
- Chạy bước lấy token trong trình duyệt của Mạnh (ego lite): lời giao cấm đụng tab hay phiên Mạnh đang dùng.

## Notes

- Lệnh đo nằm ở `_acceptance/s02-phien-qua-khung-ung-dung/probes/`; `_acceptance/config.yaml` là tệp bảo vệ, không sửa.
- Phép đo cần `collector/dist` mới: lệnh eval build bằng `npx tsc -p tsconfig.json` trước.
- Hạng T2 theo đường dẫn (không tệp nào trong `t3_paths`). Việc không khó-đảo: revert một commit đưa bộ thu về cây cũ.
- Vòng sửa sau review độc lập 25/11 (một agent khác đọc mã, không phải người viết): lệnh `login` rơi sang nhánh lệnh kế (P0); bước ép làm mới sau 401 trả lại đúng token vừa bị từ chối (P1); lỗi thường từ bước nạp lọt qua lớp dừng cả lượt; `newPage()` mở tab thứ hai; tín hiệu «ứng dụng không khởi động» đồng nhất với «chưa thấy lời gọi xác thực»; hai tài liệu nói quá hoặc lỗi thời. Tất cả đã sửa trong phạm vi mười tiêu chí trên.
- Bằng chứng chạy thật ngày 25/11 (do người viết chạy, cần phiên của Mạnh và nguồn sống — không phải eval; sổ chạy gốc ở `research-local/`, không commit):
  - Dựng lại lỗi với cấu hình lượt đêm: route dữ liệu trả 403 kèm `cf-mitigated: challenge`, `navigator.webdriver` đúng; bỏ `--enable-automation` vẫn vậy (2 lần).
  - Lúc 09:01 và 10:48 (trước và sau vòng sửa), token cũ vừa hết hạn: lượt thu một thị trường thu 9 mục, 0 lỗi, có snapshot mới.
  - Lúc 09:31 (mã trước vòng sửa) và 11:01 (mã cuối), token hết hạn GIỮA lượt: hai dòng `token OK` («còn 2 phút» lúc đầu, «còn 15 phút» giữa lượt), 18 mục, 0 lỗi, không lời gọi lỗi.
  - Profile trống chưa từng đăng nhập: lượt dừng ngay, đúng một dòng `AUTH FAIL [S02]`, chỉ để lại thư mục tạm ẩn. Mã trước vòng sửa chẩn đoán «KHÔNG khởi động» sau ~95 giây; mã sau vòng sửa chẩn đoán «nạp được khung nhưng không có token» sau 65 giây và không nạp thêm đường dẫn nào.
  - Refresh token không đổi sau lần ứng dụng tự cấp lại (so mã băm trước và sau).
- Bằng chứng chạy thật KHÔNG CỬA SỬ (25/11, sau lời giao claudedp-2511-50; cùng cách đo như trên):
  - 20:15, mở `/robots.txt` bằng Chrome không cửa sổ với profile của bộ thu: tài liệu 404 là bộ khung ứng dụng, không có trang thử thách (trình duyệt tự báo `webdriver` đúng, user-agent ghi «Headless»); ứng dụng tự cấp token mới sau 6,7 giây.
  - 20:19, lượt thu một thị trường: 9 lời gọi, 9 bản ghi, 0 lỗi, 0 chặn, có snapshot mới; không cửa sổ nào bật lên.
  - 20:20, profile trống: dừng sau một đường dẫn (67 giây), đúng một dòng `AUTH FAIL [S02]`, chẩn đoán «nạp được khung nhưng không có token».
