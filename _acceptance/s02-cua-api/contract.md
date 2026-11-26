---
schema_version: 1
feature: "S02 — bộ thu đi cửa API như các nguồn khác: đọc phiên từ kho localStorage của profile trên đĩa, tra đổi token bằng đúng hai lời ứng dụng gửi, KHÔNG mở trình duyệt khi thu; bị chặn thì dừng cả lượt; lệnh login mở đúng profile cho Mạnh tự đăng nhập"
slug: s02-cua-api
owner: phanlemanh@gmail.com
risk_tier: T2
surfaces: [cli]
status: implemented
veto_state: mo
veto_opened_at: 2026-11-26T15:10:00Z
approved_by:
approved_at:
design_doc: _acceptance/s02-cua-api/design.md
---

# Acceptance Contract: s02-cua-api

## Context

Thu S02 hỏng từ 29/10: lúc 401 mỗi đêm, rồi từ 24/11 mỗi đêm dừng ở «appToken ĐÃ HẾT HẠN» (lượt 19:05 ngày 26/11 vẫn
thất bại như vậy). Nguyên nhân đo ngày 24–26/11: token 15 phút chỉ được cấp lại khi trình duyệt nạp được ứng dụng,
mà route dữ liệu của ứng dụng trả trang thử thách cho trình duyệt tự động. Cách sửa trước đó (nạp bộ khung ứng dụng
trong trình duyệt không cửa sổ) bị cổng Claude xét là đi vòng trang thử thách.

Hàng này đổi sang cách các nguồn khác vẫn làm: bộ thu **không mở trình duyệt**. Nó đọc bản ghi phiên `auth` thẳng từ
kho localStorage (LevelDB) của profile trên đĩa, rồi tra đổi refresh token lấy appToken bằng đúng hai lời ứng dụng
vẫn gửi (`/v1/fetch_id_token` rồi `/v1/fetch_app_token`). Không chạm trang thử thách, không đổi cờ trình duyệt, không
giả dấu vân tay. Bị chặn (403/429/trang thử thách) → dừng cả lượt, không lách. Lệnh `login` mở Chrome thường với đúng
profile để Mạnh tự đăng nhập khi hết phiên. Người dùng: lượt thu hằng đêm của nguồn S02.

Source input: lời Mạnh trong phiên ZCode S02: «Các rào là của claude đặt ra, tôi chỉ đặt ra mục tiêu» (25/11) → «Sử dụng REA để phân tích đi như các nguồn khác được không?» → «Đồng ý nhanh mới và thử trước báo với claude code việc thử nghiệm này» (26/11) → «Đồng ý» với chuỗi hồ sơ T2 → PR → gộp qua cổng Claude → build lại collector (26/11 22:37)

## Criteria

- AC-1 (lượt thu KHÔNG mở trình duyệt): Given hai tệp bộ thu S02 — tệp xuất `docExpAppToken` và tệp xuất `docPhienTuProfile`, When soi tĩnh, Then không tệp nào nhập `playwright-core`, không `launchPersistentContext`, không `chromium.`. Chiều đỏ: một tệp cấy chứa dòng nhập `playwright-core` thì phép soi phải đỏ.
- AC-2 (đọc đúng bản ghi phiên MỚI NHẤT của profile): Given kho localStorage dựng bằng số trong thư mục tạm, When gọi `docPhienTuProfile(thư_mục, khoá)`, Then: (a) bản ghi trong tệp log đọc được, kể cả bản ghi bị cắt đoạn FIRST/MIDDLE/LAST qua ranh giới khối 32 KB; (b) bản ghi trong bảng — khoá bị nén tiền tố, khối dữ liệu lẫn khối chỉ mục nén snappy — đọc được; (c) nhiều phiên bản → bản có số thứ tự LỚN nhất thắng, bất kể nằm tệp nào; bản cũ hơn tràn sang khối sau không làm mất bản mới; (d) bản mới nhất là bản XOÁ → `null`; không có thư mục kho, không có bản ghi, giá trị không phải JSON → `null`; (e) giá trị mã hoá Latin-1 lẫn UTF-16LE đều giải đúng; (f) một tệp hỏng → ném lỗi nói TÊN tệp, không lặng lẽ dùng bản cũ. Chiều đỏ: năm bản đột biến — chọn bản cũ nhất · bỏ giải nén tiền tố · bỏ giải nén khối snappy · bỏ giữ đoạn FIRST · bản xoá coi là còn — mỗi bản làm đỏ ít nhất một ca.
- AC-3 (tra đổi token bằng đúng hai lời): Given `doiToken(refresh_token, cửa)` với fetch giả và bộ đếm `take()`, When gọi, Then gửi đúng hai lời theo thứ tự: `POST <cửa xác thực>/v1/fetch_id_token` thân `{refresh_token, client_id}`, không mang Bearer; rồi `POST <cửa xác thực>/v1/fetch_app_token` thân `{}`, mang `Authorization: Bearer <id_token>`; mỗi lần gửi (kể cả thử lại) đúng một `take()`; mỗi lời mang `AbortSignal`; trả `{appToken, refreshToken}`. Given phản hồi của lời đầu là 401 hoặc 403 (JSON) → `LoiXacThuc`, KHÔNG gửi lời hai. 200 nhưng thiếu `id_token` → `LoiXacThuc`, KHÔNG gửi lời hai. Given 429, đầu `cf-mitigated: challenge` (kể cả khi thân không phải HTML), hoặc lỗi kèm trang HTML → `LoiBiChan`, không thử lại, không gửi gì thêm. Given lỗi mạng hoặc 5xx dưới ba lần → thử lại rồi thành công; lỗi mạng hết ba lần → lỗi THƯỜNG, đúng ba lời. Given refresh token rỗng → `LoiXacThuc`, không gọi mạng. Given nguồn trả refresh token mới → `refreshToken` trả về là refresh mới. Chiều đỏ: sáu bản đột biến — 429 không coi là bị chặn · thử thách không coi là bị chặn · 401/403 không thành lỗi xác thực · thiếu id_token vẫn gửi lời hai · refresh rỗng vẫn gọi mạng · bỏ thời gian chờ.
- AC-4 (mọi lối ra không có token dùng được đều dừng cả lượt): Given trình lấy token với bước đọc giả và bước tra đổi giả, When (a) bước đọc trả `null` · (b) bản ghi thiếu refresh token · (c) tra đổi ném `LoiXacThuc` · (d) token vừa tra đổi đã hết hạn · (e) bước đọc ném lỗi (kho hỏng), Then ném `LoiXacThuc` sau đúng MỘT dòng `AUTH FAIL [S02]`; ở (a), (b) không gọi tra đổi; ở (e) thông điệp giữ chi tiết gốc; ở (a) thông điệp chỉ lệnh đăng nhập. When (f) tra đổi ném `LoiBiChan` → in đúng MỘT dòng `BỊ CHẶN [S02]`, KHÔNG in AUTH FAIL, ném `LoiBiChan`. When (g) tra đổi ném lỗi thường (mạng) → ném lại lỗi đó, KHÔNG in AUTH FAIL. Phiên trên đĩa đọc MỘT lần cho cả lượt; token còn hạn thì dùng lại, không tra đổi thừa. When nguồn trả refresh token mới (xoay phiên), Then refresh token dùng cho lần tra đổi kế là refresh mới. Chiều đỏ: bốn bản đột biến — bỏ dòng AUTH FAIL khi tra đổi bị từ chối · bị chặn lại in AUTH FAIL · thiếu refresh token vẫn tra đổi · không cập nhật refresh token khi nguồn xoay phiên.
- AC-5 (`call()` làm mới đúng lúc, dừng đúng chỗ): Given `call()` với token còn 5 giây và bước làm mới đổi sang token còn 10 phút, When gọi, Then làm mới đúng MỘT lần trước lời gửi và lời gửi mang token mới — vế không bắn: token còn 10 phút thì bước làm mới chạy 0 lần. Given 401 một lần và làm mới cho token khác → gửi lại bằng token mới, thành công. 401 mà token không đổi → KHÔNG gửi lại, ném `LoiXacThuc` sau đúng một dòng `AUTH FAIL [S02]`. Bước làm mới ném `LoiXacThuc` → ném lại, 0 lời gửi, không tính là lời lỗi. HTTP 500 → trả `null`, đếm đúng một lời lỗi, không dừng lượt. Chiều đỏ: ba bản đột biến — gửi lại dù token không đổi · bỏ làm mới trước khi gửi · bỏ dòng AUTH FAIL sau 401.
- AC-6 (bị chặn ở API dữ liệu dừng cả lượt; không nuốt lỗi bước làm mới): Given `call()` với fetch giả trả 403 (JSON), 429, hoặc 403 HTML kèm `cf-mitigated: challenge`, When gọi, Then ném `LoiBiChan` sau đúng MỘT dòng `BỊ CHẶN [S02]` (mang mã trạng thái, phương thức, đường dẫn), không tăng bộ đếm lời lỗi, không gửi gì thêm, không gọi làm mới, không in AUTH FAIL. Given bước làm mới — trước lời gửi, hoặc sau một 401 — ném lỗi thường, Then ném lại lỗi đó, không nuốt thành một lời lỗi lẻ, không in AUTH FAIL. Chiều đỏ: hai bản đột biến — bị chặn vẫn đi tiếp · nuốt lỗi bước làm mới.
- AC-7 (log và thông điệp không mang giá trị phiên; dòng chuẩn ở đúng một tệp): Given thông điệp của `LoiXacThuc` khi lời đầu trả 401, Then không chứa refresh token — chỉ tên bước và mã trạng thái. Given `collector/src/collectors/*.ts`, When đếm tệp chứa literal `AUTH FAIL [S02]`, Then đúng MỘT tệp — tệp bộ thu xuất `docExpAppToken` — và tệp đó chứa cả literal `` AUTH FAIL [S02] ${new Date().toISOString()} `` lẫn chuỗi «401 sau refresh token». Chiều đỏ: một tệp cấy chứa literal đó → phép đếm phải đỏ.
- AC-8 (nhịp): `requestsPerSecond` của bộ thu S02 tối đa 0,2 (≥ 5 giây giữa hai lời, chưa kể jitter của scheduler). Chiều đỏ: bản đột biến 0,3 bị bắt.
- AC-9 (lệnh `login`): Given CLI `login --source <bộ thu S02>` với Chrome giả và profile thư mục tạm, Then thoát 0, in hướng dẫn có chữ «profile bộ thu», không in Usage, không rơi sang nhánh thu. Chrome không mở được → stderr có lý do, thoát 1, không in Usage. Nguồn không có `login` → in Usage, thoát 1. `AIRDNA_PROFILE_DIR` và `AIRDNA_CHROME_BIN` thắng giá trị mặc định; tham số mở Chrome thường trỏ đúng profile, không cờ tự động hoá. Chiều đỏ: hai bản đột biến của CLI — nguồn không có lệnh login vẫn chạy · lỗi mở Chrome vẫn thoát 0.
- AC-10 (vùng thay đổi, bộ test, lệnh CLI): Given nhánh này so với `origin/main`, When so danh sách tệp đổi, Then chỉ gồm: hai tệp bộ thu S02, `collector/src/cli.ts`, các tệp `collector/src/test/s02-*.test.ts`, `collector/CLAUDE.md`, `collector/AGENTS.md`, hồ sơ này (và hai tệp sinh LO-TRINH.html, PRODUCT-MAP.md nếu luật kho bắt vẽ lại); `collector/src/core/**` KHÔNG đổi. Trọn bộ test của collector đạt. Lệnh `list-sources` build xong và in danh sách bộ thu, trong đó có bộ thu S02.

## Coverage

Bỏ coverage-scan — hàng sửa ở hai tệp bộ thu, trục liệt tay từ các lần chạy thật ngày 26/11 và từ phép đo đột biến:

- Trục vị trí bản ghi phiên: tệp log (khoá đầy đủ, bản ghi cắt đoạn) · bảng (khoá nén tiền tố, khối nén snappy, khối chỉ mục nén) — AC-2
- Trục số phiên bản: một · nhiều trong một khối · bản cũ tràn sang khối sau · mới nhất là xoá — AC-2
- Trục mã hoá giá trị: Latin-1 · UTF-16LE — AC-2
- Trục kết cục kho: không có thư mục · không có bản ghi · bản mới nhất bị xoá · tệp hỏng — AC-2, AC-4
- Trục phản hồi của cửa xác thực: 200 đủ · 200 thiếu id_token · 401 · 403 JSON · 429 · thử thách · lỗi kèm HTML · 5xx rồi 200 · lỗi mạng rồi 200 · lỗi mạng hết ba lần — AC-3, AC-4
- Trục lý do làm mới: sắp hết hạn · vừa bị 401 — AC-5
- Trục kết cục lời dữ liệu: 200 · 401 một lần · 401 mà token không đổi · 403 · 429 · thử thách · 500 — AC-5, AC-6
- Trục lỗi bước làm mới: lỗi xác thực · bị chặn · lỗi thường (trước lời gửi và sau 401) — AC-4, AC-6
- Trục lệnh của người: `login` đúng nguồn · Chrome không mở được · nguồn không có `login` · `list-sources` — AC-9, AC-10
- Ô bỏ: chạy thật với nguồn sống không xếp thành eval — cần phiên của Mạnh và mỗi lần chạy là lưu lượng thật; ba lần chạy thật ngày 26/11 ghi ở Notes

## Out of scope

- Triển khai sau gộp: build lại `dist` của collector ở checkout chính — Mạnh giao riêng, làm sau khi PR được gộp.
- Trang kế của `map_listings` (hậu tố `@offset` trên đường dẫn bị nguồn trả 404 — lỗi có sẵn): sửa ở nhánh riêng `zcode/s02-map-listings-trang-ke`, hồ sơ riêng.
- Hạn của refresh token: chưa biết (cùng một giá trị từ 24/11 tới 26/11); hết thì Mạnh đăng nhập lại bằng lệnh `login`.
- Đổi những gì bộ thu GỌI ở hàng này (cây API, số lời mỗi thị trường): không đổi.
- Dữ liệu S02 lên cloud và route công khai trả số S02: làn Claude.
- Sửa bẫy kỹ thuật số 2 của `AGENTS.md` gốc («chỉ headful Chrome») cho đúng S02: tài liệu gốc thuộc làn Claude — báo khi bàn giao.
- Bộ đọc dòng `AUTH FAIL [S02]` / `BỊ CHẶN [S02]` để báo người khi lượt đêm thất bại.
- Đăng nhập hộ Mạnh: lệnh `login` chỉ mở cửa sổ; Mạnh tự đăng nhập.

## Notes

- Lệnh đo nằm ở `_acceptance/s02-cua-api/probes/`; `_acceptance/config.yaml` là tệp bảo vệ, không sửa.
- Phép đo cần `collector/dist` mới: lệnh eval build bằng `npx tsc -p tsconfig.json` trước. Phép đo đột biến chép `collector/dist` sang thư mục tạm trong `collector/` (để resolve được `node_modules`), đổi đúng MỘT điểm, chạy đúng tệp test của hàng ở bản chép; ca đỏ ở bản đối chứng (chép, không đổi) không được tính là «bắt được».
- Chạy thật ngày 26/11/2026 (từ worktree, profile của checkout chính, không mở trình duyệt, log không lộ giá trị phiên):
  - 18:33–18:35, thị trường 95545: 2 lời cấp token + 9 lời dữ liệu → 9 bản ghi, 0 lỗi.
  - 18:35–18:39, thị trường 47 (một khu con): 2 + 18 lời → 17 bản ghi, 1 lời lỗi (404 trang kế `map_listings` — ngoài hợp đồng, xem Out of scope).
  - Cả hai lượt: 0 lần 401, 0 dòng AUTH FAIL, 0 lần bị chặn, thoát mã 0.
- Bộ đọc phiên đối chiếu với một bộ dò độc lập trên 403 mục của kho thật: lệch 0; bốn lỗi cố ý cấy vào đều bị bắt.
- Lượt 19:05 ngày 26/11 ở checkout chính vẫn chạy mã cũ và thất bại: `AUTH FAIL [S02] 2026-11-26T12:05:13Z` → `FAILED: appToken ĐÃ HẾT HẠN`.
