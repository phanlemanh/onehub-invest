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

Source input: lời Mạnh trong phiên ZCode S02 ngày 25/11 («Mục tiêu là thu ổn định») + sự cố thu S02 24/11 (vòng claudedp-2411-7)

## Criteria

- AC-1 (lề token — vừa đọc xong còn kịp gọi API): Given năm token gọi `duDungKhong(token, now)` với `now` cố định — còn 31 giây · còn 29 giây · hết hạn 1 giây · chuỗi rác · rỗng, When hàm chạy, Then chỉ token còn 31 giây trả đúng; bốn ô kia trả sai. Chiều đỏ: bản đột biến bỏ lề (so hạn còn lại với 0) bị bắt ở ô «còn 29 giây».
- AC-2 (dùng lại token đang giữ): Given token đang giữ còn hạn 10 phút, When hỏi `dungLaiToken(token, ép)`, Then trả đúng khi không ép và trả sai khi ép làm mới; token rỗng hoặc đã hết hạn trả sai ở cả hai. Chiều đỏ: bản đột biến bỏ vế «ép» bị bắt ở ô «còn hạn, ép làm mới».
- AC-3 (mọi token ra khỏi hàm nạp đều qua kiểm lề; không chờ cứng; không mở route dữ liệu trực tiếp): Given thân hàm nạp một đường dẫn của bộ thu S02 (tệp duy nhất trong `collector/src/collectors/` xuất `docExpAppToken`), When soi tĩnh từng câu `return token;`, các lời chờ và các lời `page.goto(`, Then mỗi câu `return token;` nằm trên dòng có điều kiện `duDungKhong(`; tệp không còn `waitForTimeout(`; mọi lời `page.goto(` trỏ về `APP_ORIGIN + duong` (duong đi từ danh sách ứng viên) hoặc `about:blank`; trong danh sách ứng viên route dữ liệu `/data/vn` đứng cuối, không lặp, đều là đường dẫn tương đối. Chiều đỏ trên bốn bản chép — đổi điều kiện thành `if (token)` · cấy một câu `return token;` trước khi kiểm · cấy lại lời chờ cứng · cấy một lời `page.goto` trỏ chỗ khác — mỗi bản đỏ với đúng thông điệp ghim.
- AC-4 (hết sức thì dừng đúng chỗ): Given kết quả quan sát của một đường dẫn — không thấy lời gọi xác thực nào · thấy mã 200 · thấy 401 · thấy 403 · thấy 500, When hỏi `thuDuongKe(kết_quả)`, Then chỉ ô «không thấy lời gọi nào» trả đúng (thử đường kế); bốn ô đã thấy ứng dụng chạy trả sai (dừng, không nạp lại). Chiều đỏ: bản đột biến trả đúng luôn bị bắt ở ô «thấy mã 200».
- AC-5 (chẩn đoán đúng nguyên nhân): Given ba tình huống — (a) một đường dẫn có lời gọi xác thực trả 401 · (b) lời gọi trả 200 nhưng không có token · (c) hai đường dẫn không thấy lời gọi nào, When gọi `chanDoanKhongCoToken`, Then (a) nói «phiên đăng nhập ĐÃ HẾT»; (b) nói «ứng dụng chạy nhưng không cấp» và không nói «ĐÃ HẾT»; (c) nói «KHÔNG khởi động» và liệt kê cả hai đường dẫn đã thử; (a) và (c) đều chỉ đúng lệnh `login --source`; danh sách rỗng cũng cho «KHÔNG khởi động» mà không ném. Chiều đỏ: bản đột biến bỏ nhận 401/403 bị bắt ở ô (a).
- AC-6 (lỗi xác thực dừng cả lượt): Given `call()` của bộ thu và một hàm gửi giả ghi lại mọi lời gửi, When (a) bước làm mới token ném `LoiXacThuc` · (b) hàm gửi trả 401 cả hai lần sau khi làm mới, Then (a) `call` ném lại lỗi kiểu `LoiXacThuc`, hàm gửi nhận 0 lời, bộ đếm lời gọi lỗi không tăng; (b) `call` ném `LoiXacThuc` sau đúng một dòng `AUTH FAIL [S02]` và đúng một lần làm mới. Chiều đỏ: bản đột biến bỏ vế `err instanceof LoiXacThuc` ở khối bắt lỗi bị bắt ở (a).
- AC-7 (lỗi thường không dừng cả lượt — vế không-bắn của AC-6): Given `call()` với token còn hạn và hàm gửi trả mã 500, When gọi, Then trả `null` và bộ đếm lời gọi lỗi tăng đúng 1, không ném.
- AC-8 (làm mới token trước khi gọi): Given `call()` với token còn 5 giây và bước làm mới đổi sang token còn 10 phút, When gọi, Then bước làm mới chạy đúng một lần trước lời gửi và lời gửi mang token MỚI; với token còn 10 phút thì bước làm mới chạy 0 lần. Chiều đỏ: bản đột biến bỏ bước làm mới trước khi gửi bị bắt ở ô «còn 5 giây».
- AC-9 (đăng nhập vào đúng profile): Given `argsMoChromeDangNhap(thư_mục)`, When đọc tham số, Then có đúng một tham số `--user-data-dir=<thư_mục>`; tham số cuối là URL https kết thúc bằng `/data/vn`; không tham số nào mang cờ tự động hoá (`--enable-automation`, `remote-debugging`, `headless`, `AutomationControlled`); bộ thu S02 khai hàm `login` để CLI điều hướng được; và lệnh `collect -- list-sources` của CLI vẫn chạy sau khi build.
- AC-10 (đổi chỗ profile, không phá vùng, bộ test xanh): Given `thuMucProfile(env, mặc_định)`, When `env.AIRDNA_PROFILE_DIR` có giá trị · thiếu · rỗng, Then lần lượt dùng giá trị đó · mặc định · mặc định. Given nhánh này so với `origin/main`, When so danh sách tệp đổi, Then chỉ gồm: tệp bộ thu S02, `collector/src/core/types.ts`, `collector/src/cli.ts`, tệp test của hàng này, `collector/CLAUDE.md`, hồ sơ này và hai tệp sinh `LO-TRINH.html`, `PRODUCT-MAP.md`; `npm test` của collector xanh. Chiều đỏ: danh sách có cấy một tệp ngoài vùng thì phép đo in «ĐỎ: tệp ngoài vùng».

## Coverage

Bỏ coverage-scan — hàng sửa lỗi ở một tệp bộ thu, trục liệt tay từ bốn lần chạy thật ngày 25/11 (entry d-20261125T025000Z-3)

- Trục trạng thái token lúc đọc: còn hơn lề · còn dưới lề · hết hạn · rác — AC-1, AC-3
- Trục lý do làm mới: sắp hết hạn · vừa bị 401 (ép) — AC-2, AC-8
- Trục ứng dụng khi nạp: không khởi động · chạy nhưng bị từ chối · chạy, không có token · chạy và cấp token — AC-3, AC-4, AC-5
- Trục kết cục lời gọi API: trả dữ liệu · 401 hai lần · lỗi máy chủ · bước làm mới ném lỗi — AC-6, AC-7, AC-8
- Trục phiên của người: phiên sống với token hết hạn · phiên chết · profile chưa từng đăng nhập — AC-5 (hai ô đầu chạy thật ngày 25/11, ghi ở Notes)
- Trục người vận hành: đăng nhập lại vào đúng profile · chạy CLI — AC-9; đổi chỗ profile, giới hạn vùng thay đổi — AC-10
- Ô bỏ: chạy thật với nguồn sống không phải eval — cần phiên của Mạnh và mỗi lần chạy là lưu lượng thật; ba lần chạy thật ghi ở Notes

## Out of scope

- Đổi những gì bộ thu GỌI (cây API, số lời gọi mỗi thị trường, mỗi quận): phía ta chỉ đọc 5 số mỗi thị trường trong khi bộ thu gọi thêm 8 lời gọi mỗi quận cho bảng không ai đọc — việc riêng.
- Bộ đọc dòng `AUTH FAIL [S02]` để báo người khi lượt đêm thất bại (hiện chưa có bộ đọc nào).
- Triển khai sau gộp: build lại `dist` của collector ở checkout chính — Mạnh giao riêng.
- Dữ liệu S02 lên cloud và route công khai trả số S02 — làn Claude đang làm (hàng HT23).
- Đăng nhập hộ Mạnh: lệnh `login` chỉ mở cửa sổ Chrome thường với đúng profile; Mạnh tự đăng nhập.
- Gỡ lõi「token hết hạn giữa lượt bị nuốt」ở các bộ thu khác — mỗi bộ thu một hồ sơ.

## Notes

- Lệnh đo nằm ở `_acceptance/s02-phien-qua-khung-ung-dung/probes/`; `_acceptance/config.yaml` là tệp bảo vệ, không sửa.
- Phép đo cần `collector/dist` mới: lệnh eval build bằng `npx tsc -p tsconfig.json` trước.
- Hạng T2 theo đường dẫn (không tệp nào trong `t3_paths`). Việc không khó-đảo: revert một commit đưa bộ thu về cây cũ.
- Bằng chứng chạy thật ngày 25/11 (do người viết chạy, cần phiên của Mạnh và nguồn sống — không phải eval; sổ chạy gốc ở `research-local/`, không commit):
  - Dựng lại lỗi với cấu hình lượt đêm: route dữ liệu trả 403 kèm `cf-mitigated: challenge`, `navigator.webdriver` đúng; bỏ `--enable-automation` vẫn vậy (2 lần).
  - Lúc 09:01, token cũ vừa hết hạn: lượt thu một thị trường thu 9 mục, 0 lỗi, có snapshot mới.
  - Lúc 09:31, token hết hạn GIỮA lượt: hai dòng `token OK` («còn 2 phút» lúc đầu, «còn 15 phút» giữa lượt), 18 mục, 0 lỗi, không lời gọi lỗi.
  - Profile trống chưa từng đăng nhập (2 lần): lượt dừng ngay, đúng một dòng `AUTH FAIL [S02]`, chẩn đoán «KHÔNG khởi động» kèm lệnh đăng nhập, chỉ để lại thư mục tạm ẩn.
  - Refresh token không đổi sau lần ứng dụng tự cấp lại (so mã băm trước và sau).
