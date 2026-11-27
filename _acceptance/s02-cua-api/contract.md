---
schema_version: 1
feature: "S02 lấy token đi cửa API: đọc phiên từ profile riêng của bộ thu trên đĩa, đổi token bằng hai lời xác thực của ứng dụng, KHÔNG mở trình duyệt khi thu; bị chặn thì dừng cả lượt; lệnh login mở đúng profile cho Mạnh tự đăng nhập (ZC22)"
slug: s02-cua-api
owner: phanlemanh@gmail.com
risk_tier: T3
surfaces: [cli]
status: implemented
approved_by: Mạnh
approved_at: 2026-11-27
design_doc: _acceptance/s02-cua-api/design.md
---

# Acceptance Contract: s02-cua-api

## Context

Hàng ZC22 (dãy ZT), GS giao 27/11. Thu S02 hỏng từ 29/10: lúc 401, rồi từ 24/11 mỗi đêm dừng ở «appToken ĐÃ HẾT HẠN»
(lượt 19:05 ngày 26/11 vẫn vậy). Nguyên nhân ZCode đo 24–26/11: token 15 phút chỉ được cấp lại khi trình duyệt nạp được
ứng dụng, mà route dữ liệu trả trang thử thách cho trình duyệt tự động. Mạnh: «Tiến hành S02 như mọi người» (phán «ngoài
cổng» cũ đã rút 27/11, CHUNG.md điểm 9).

Nguồn mã: `origin/zcode/s02-cua-api` @2f0748d06 (ZCode viết, LL soát cổng + soat-m5: pipeline, agent, data-api, scripts xanh,
app chỉ QV-AC-5; 90/90 test S02 trên máy thu), gộp nguyên vào nhánh hồ sơ — 17 tệp khớp byte với sha zcode. Cách làm: bộ
thu không mở trình duyệt; đọc bản ghi phiên `auth` từ kho localStorage (LevelDB) của profile bộ thu trên đĩa; đổi refresh
token lấy appToken bằng đúng hai lời ứng dụng gửi (`/v1/fetch_id_token` rồi `/v1/fetch_app_token`, header content-type +
Bearer); giá trị phiên chỉ ở bộ nhớ tiến trình; 429, thử thách, 403, lỗi kèm HTML → dừng cả lượt, không lách. Lệnh `login`
mở Chrome thường với đúng profile để Mạnh tự đăng nhập. Hồ sơ tự dựng của nhánh zcode (hợp đồng, evals, sổ, ba phép đo) là
đầu vào tham khảo; hợp đồng và evals này do ZT viết theo kit, giữ ba phép đo của ZCode và thêm `probes/khong-lo-phien.sh`.

Người dùng: lượt thu S02 hằng đêm (19:05) — dữ liệu S02 chỉ để hiệu chuẩn (luật 5); Mạnh khi phải đăng nhập lại.

## Acceptance Criteria

- AC-1: Given hai tệp bộ thu S02 — tệp xuất `docExpAppToken` và tệp xuất `docPhienTuProfile`, When soi tĩnh, Then không tệp nào
  nhập `playwright-core`, không `launchPersistentContext`, không `chromium.`; một tệp cấy dòng nhập `playwright-core` thì phép
  soi đỏ.
- AC-2: Given kho localStorage dựng bằng số trong thư mục tạm, When gọi `docPhienTuProfile(thư_mục, khoá)`, Then (a) bản ghi trong
  tệp log đọc được, kể cả bản ghi cắt mảnh FIRST/MIDDLE/LAST qua ranh giới khối 32 KB; (b) bản ghi trong bảng — khoá nén tiền
  tố, khối dữ liệu lẫn khối chỉ mục nén snappy — đọc được; (c) nhiều phiên bản → bản có số thứ tự lớn nhất thắng, bất kể tệp;
  (d) bản mới nhất là bản xoá → `null`; không có kho, không có bản ghi, giá trị không phải JSON → `null`; (e) giá trị Latin-1 lẫn
  UTF-16LE giải đúng; (f) tệp hỏng → ném lỗi nói tên tệp, không lặng lẽ dùng bản cũ; (g) đuôi tệp nhật ký ghi dở (bản ghi cuối
  hứa dài hơn phần còn trong tệp, như khi Chrome đang mở profile) → bỏ đuôi, đọc bản nguyên vẹn trước nó, không ném. Năm bản đột biến (chọn bản cũ nhất · bỏ
  giải nén tiền tố · bỏ giải nén snappy · bỏ giữ mảnh FIRST · bản xoá coi là còn) mỗi bản làm đỏ ít nhất một ca.
- AC-3: Given `doiToken(refresh_token, cửa)` với fetch giả và bộ đếm `take()`, When gọi, Then gửi đúng hai lời theo thứ tự:
  `POST …/v1/fetch_id_token` thân `{refresh_token, client_id}` không Bearer, rồi `POST …/v1/fetch_app_token` thân `{}` mang
  `Authorization: Bearer <id_token>`; mỗi lần gửi (kể cả thử lại) đúng một `take()`; mỗi lời mang `AbortSignal`; trả `{appToken,
  refreshToken}`. Lời đầu 401/403 JSON, hoặc 200 thiếu `id_token` → `LoiXacThuc`, không gửi lời hai. 429, đầu `cf-mitigated:
  challenge` (kể cả thân không phải HTML), lỗi kèm trang HTML → `LoiBiChan`, không thử lại, không gửi thêm. Lỗi mạng hoặc 5xx
  dưới ba lần → thử lại rồi xong; lỗi mạng hết ba lần → lỗi thường, đúng ba lời. Refresh rỗng → `LoiXacThuc`, không gọi mạng.
  Nguồn trả refresh mới → `refreshToken` trả về là refresh mới. Sáu bản đột biến (429 không bị chặn · thử thách không bị chặn ·
  401/403 không thành lỗi xác thực · thiếu id_token vẫn gửi lời hai · refresh rỗng vẫn gọi mạng · bỏ thời gian chờ) đều bị bắt.
- AC-4: Given trình lấy token với bước đọc giả và bước đổi giả, When (a) bước đọc trả `null` · (b) bản ghi thiếu refresh token ·
  (c) bước đổi ném `LoiXacThuc` · (d) token vừa đổi đã hết hạn · (e) bước đọc ném lỗi (kho hỏng), Then ném `LoiXacThuc` sau đúng
  MỘT dòng `AUTH FAIL [S02]`; ở (a), (b) không gọi bước đổi; ở (a) thông điệp chỉ lệnh đăng nhập. When (f) bước đổi ném
  `LoiBiChan` → đúng MỘT dòng `BỊ CHẶN [S02]`, không AUTH FAIL. When (g) bước đổi ném lỗi mạng → ném lại lỗi đó, không AUTH FAIL.
  Phiên trên đĩa đọc MỘT lần cho cả lượt; token còn hạn thì dùng lại; nguồn xoay refresh → lần đổi kế dùng refresh mới. Bốn bản
  đột biến (bỏ AUTH FAIL khi bị từ chối · bị chặn lại in AUTH FAIL · thiếu refresh vẫn đổi · không cập nhật refresh khi xoay)
  đều bị bắt.
- AC-5: Given `call()` với token còn 5 giây và bước làm mới cho token còn 10 phút, When gọi, Then làm mới đúng MỘT lần trước lời
  gửi và lời gửi mang token mới; token còn 10 phút → làm mới 0 lần. 401 một lần và làm mới cho token khác → gửi lại, thành công.
  401 sau làm mới mà token không đổi → không gửi lại, ném `LoiXacThuc` sau đúng một dòng AUTH FAIL. Bước làm mới ném
  `LoiXacThuc` → ném lại, 0 lời gửi. HTTP 500 → `null`, đếm đúng một lời lỗi, không dừng lượt. Ba bản đột biến (gửi lại dù token
  không đổi · bỏ làm mới trước khi gửi · bỏ AUTH FAIL sau 401) đều bị bắt.
- AC-6: Given `call()` với fetch giả trả 403 JSON, 429, hoặc 403 HTML kèm `cf-mitigated: challenge`, When gọi, Then ném
  `LoiBiChan` sau đúng MỘT dòng `BỊ CHẶN [S02]` (mã trạng thái, phương thức, đường dẫn), không tăng đếm lỗi, không gửi thêm, không
  làm mới, không AUTH FAIL. Bước làm mới — trước lời gửi hoặc sau 401 — ném lỗi thường → ném lại, không nuốt thành một lời lỗi lẻ.
  Hai bản đột biến (bị chặn vẫn đi tiếp · nuốt lỗi bước làm mới) đều bị bắt.
- AC-7: Given thông điệp `LoiXacThuc` khi lời đầu trả 401, Then không chứa refresh token — chỉ tên bước và mã trạng thái. Given
  `collector/src/collectors/*.ts`, When đếm tệp chứa literal `AUTH FAIL [S02]`, Then đúng MỘT tệp — tệp xuất `docExpAppToken` —
  chứa cả `` AUTH FAIL [S02] ${new Date().toISOString()} `` lẫn «401 sau refresh token» (thước độ tươi đang đọc); tệp cấy literal
  đó thì phép đếm đỏ.
- AC-8: `requestsPerSecond` của bộ thu S02 ≤ 0,2 (≥ 5 giây giữa hai lời, chưa kể jitter); bản đột biến 0,3 bị bắt. Given một lượt
  `collect()` trên profile tạm và fetch giả, When đếm, Then số `rateLimit.take()` bằng đúng số lời gửi (hai lời cấp token và mọi
  lời dữ liệu, kể cả lời lỗi); bản đột biến «`call()` gửi không qua `take()`» bị bắt.
- AC-9: Given CLI `login --source <bộ thu S02>` với Chrome giả và profile thư mục tạm, Then thoát 0, in hướng dẫn có «profile bộ
  thu», không in Usage, không rơi sang nhánh thu. Chrome không mở được → stderr có lý do, thoát 1. Nguồn không có `login` → Usage,
  thoát 1. `S02_PROFILE_DIR`, `S02_CHROME_BIN` thắng mặc định; tham số mở Chrome thường trỏ đúng profile, không cờ tự động hoá. Hai
  bản đột biến CLI (nguồn không có login vẫn chạy · lỗi mở Chrome vẫn thoát 0) đều bị bắt.
- AC-10: Given nhánh so với `origin/main`, When so tệp đổi, Then chỉ gồm hai tệp bộ thu S02, `collector/src/cli.ts`,
  `collector/src/test/s02-*.test.ts`, `collector/CLAUDE.md`, `collector/AGENTS.md`, hồ sơ này và hai tệp bản đồ sinh;
  `collector/src/core/**` không đổi. Trọn bộ test collector đạt; `list-sources` build xong và có bộ thu S02.
- AC-11: Given mô-đun phiên (xuất `docPhienTuProfile`) và tệp bộ thu (xuất `docExpAppToken`), When soát tĩnh, Then mô-đun phiên
  không in, không ghi tệp, không ghi log; không dòng log hay thông điệp lỗi nào của hai tệp nội suy một biến mang token, refresh,
  phiên hay Bearer. Ba bản cấy (mô-đun phiên in giá trị · bộ thu ghi refresh vào log · thông điệp lỗi mang appToken) đều làm đỏ.
- AC-12: Given ba tệp `collector/src/test/s02-*.test.ts`, When soát tĩnh, Then không tệp nào gọi lượt thu (`.collect(`), dùng
  đường profile mặc định của mô-đun (`PROFILE_DIR`), hay gọi CLI vào nguồn S02 mà không đặt `S02_PROFILE_DIR` — bộ test không
  chạm profile thật khi chạy trên máy thu. Ba bản cấy (test gọi lượt thu · CLI S02 thiếu `S02_PROFILE_DIR` · đọc profile mặc định)
  đều làm đỏ.
- AC-13: Given một lượt `collect()` hai thị trường trên profile tạm dựng bằng số và fetch giả, When lời dữ liệu đầu tiên trả 429,
  403 HTML kèm `cf-mitigated: challenge`, hoặc 403 JSON, Then `collect()` ném `LoiBiChan`, không còn lời fetch nào sau lời bị chặn,
  thị trường thứ hai không được gọi, đúng một dòng `BỊ CHẶN [S02]` — và vì bộ lập lịch (`collector/src/core/scheduler.ts`, không
  đổi) ghi `FAILED` rồi ném lại, lượt thoát khác 0. Vế không bắn: HTTP 500 ở lời đầu là lời lỗi lẻ, lượt đi tiếp tới thị trường
  thứ hai. Bản đột biến «`call()` nuốt `LoiBiChan`» bị bắt.

## Out of scope

- Chạy bộ thu với phiên thật, đọc profile thật — ngoài phạm vi vòng code, vì là giới hạn phía Claude (Notes); bằng chứng chạy
  thật là ba lượt ZCode ghi ngày 26/11 và lượt 19:05 sau triển khai.
- Build `collector/dist` ở checkout chính và lượt 19:05 chạy mã mới — ngoài phạm vi, vì là bước triển khai sau gộp: GIAO cho
  ZCode qua LL; ZT không build hay chạy trên checkout chính.
- Trang kế của `map_listings` (hậu tố `@offset` bị nguồn trả 404) — ngoài phạm vi, vì là hàng ZC23
  `s02-map-listings-trang-ke`, chồng trên nhánh này và gộp SAU.
- Tên tệp mô-đun và dòng tên miền mang tên nguồn thật — ngoài phạm vi, vì cùng họ tệp sẵn có trên main; gom vào việc dọn tên
  nguồn (mục ghi cho Cổng ở Notes).
- Hạn của refresh token — ngoài phạm vi, vì chưa đo được (cùng giá trị 24–26/11); hết thì lượt dừng với một dòng AUTH FAIL và
  Mạnh chạy `login`.
- Bộ báo người khi đọc thấy `AUTH FAIL [S02]` / `BỊ CHẶN [S02]` trong log lượt đêm — ngoài phạm vi, vì là việc riêng của thước
  độ tươi; hàng này chỉ giữ khuôn dòng.
- Sửa bẫy kỹ thuật số 2 của `AGENTS.md` gốc («chỉ headful Chrome») — ngoài phạm vi, vì tài liệu gốc sửa ở đợt tài liệu của làn
  Claude sau khi lượt thật xanh.
- Dữ liệu S02 lên cloud hay cổng — ngoài phạm vi, vì luật 5 không đổi.

## Coverage

Bảng phủ ca theo lời giao GS (trạng thái phiên và phản hồi × ba kết cục); số ca đếm từ ba tệp test của nhánh:

| Ca \ kết cục | Dừng lượt | Thử lại | Lời in |
|---|---|---|---|
| Có phiên, token còn hạn | không | không (dùng lại) | — · AC-4, AC-5 |
| Không phiên (kho trống / xoá / thiếu refresh) | có | không | 1 AUTH FAIL, chỉ lệnh login · AC-2, AC-4 |
| Token hết hạn / sắp hết (< 30 s) | chỉ khi đổi xong vẫn hết | làm mới 1 lần | 1 AUTH FAIL khi dừng · AC-4(d), AC-5 |
| Nguồn xoay refresh | không | lần đổi kế dùng refresh mới | — · AC-3, AC-4 |
| 401 sau làm mới (token không đổi) | có | không gửi lại | 1 AUTH FAIL · AC-5 |
| 429 (cửa xác thực hoặc API dữ liệu) | có, cả lượt | không | 1 BỊ CHẶN · AC-3, AC-6, AC-13 |
| Thử thách (`cf-mitigated`) | có | không | 1 BỊ CHẶN · AC-3, AC-6 |
| 403 | có | không | AUTH FAIL ở cửa xác thực · BỊ CHẶN ở API dữ liệu · AC-3, AC-6 |
| Lỗi kèm HTML | có | không | 1 BỊ CHẶN · AC-3, AC-6 |
| Refresh trên đĩa đã bị nguồn xoay ở lượt trước (lượt này không lưu refresh mới xuống đĩa) | có | không | lời đầu 401 → 1 AUTH FAIL, chỉ lệnh login · AC-3, AC-4(c) |
| Đuôi nhật ký ghi dở (Chrome đang mở profile) | không | không | — · AC-2(g) |
| Lỗi mạng / 5xx | hết 3 lần ở cửa xác thực mới dừng; ở API dữ liệu là lỗi lẻ | tối đa 3 lần | FAILED thường, không AUTH FAIL · AC-3, AC-4(g), AC-5 |

- Trục trạng thái phiên × phản hồi của nguồn: mười hai hàng của bảng trên × ba kết cục (dừng lượt · thử lại · lời in) [thước CE:
  lời giao GS 27/11] — AC-2, AC-3, AC-4, AC-5, AC-6, AC-13.
- Trục vị trí bản ghi phiên: log (khoá đầy đủ, cắt mảnh) · bảng (nén tiền tố, snappy, khối chỉ mục nén) · nhiều phiên bản ·
  bản xoá · tệp hỏng [thước CE: định dạng LevelDB của Chrome] — AC-2.
- Trục lối ra giá trị phiên: log lượt · thông điệp lỗi · tệp ghi · stdout [thước CE: mọi lệnh in/ghi trong hai tệp] — AC-7, AC-11.
- Trục nơi phép đo chạy: thư mục tạm · profile thật của máy thu [thước CE: KEV1 24/11, test chạm HOME thật] — AC-12.
- Trục lệnh của người: `login` đúng nguồn · Chrome không mở · nguồn không có `login` · `list-sources` — AC-9, AC-10.
- Trục bề mặt trình duyệt: bộ thu · mô-đun phiên · CLI [thước CE: `git grep playwright-core collector/src`] — AC-1.
- Ô bỏ: chạy thật với nguồn sống — ngoài phạm vi, vì cần phiên của Mạnh và là lưu lượng thật; người đọc đầu ra phía sau là lượt
  19:05 (đo ở Đường đo).

## Đường đo

Không có người dùng cuối (dữ liệu S02 chỉ hiệu chuẩn). Con số trên máy thu sau triển khai: BA lượt S02 19:05 liên tiếp chạy mã
mới, mỗi lượt thoát 0, 0 dòng `AUTH FAIL [S02]`, 0 dòng `BỊ CHẶN [S02]`, số bản ghi > 0 (trước: mọi lượt từ 24/11 dừng ở
«appToken ĐÃ HẾT HẠN», 0 bản ghi). Ba đêm, không một đêm, vì refresh mới nguồn xoay về chỉ sống trong bộ nhớ của một lượt — nếu
nguồn xoay refresh thì đêm thứ hai mới lộ. ZCode đo trên log lượt và báo qua LL; ZT không đọc log có thể chứa phiên.

## Notes

- Giới hạn phía Claude (ZT): không đọc profile hay phiên thật, không chạy bộ thu với phiên thật — mọi phép chấm chỉ trên fixture
  dựng bằng số; không giá trị phiên hay định danh tài khoản thu nào trong log, fixture, hồ sơ, ảnh chứng; dữ liệu S02 theo luật
  5 (chỉ hiệu chuẩn, không lên cổng).
- Hỏi ở Cổng Phạm vi (gap-probe F3, chỉ Mạnh trả lời): bộ thu đổi token thẳng từ Node bằng phiên đọc trên đĩa, nên không đi qua
  trang thử thách mà nguồn dựng cho trình duyệt tự động — Mạnh có tính đây là cách thu được phép («như mọi người») không? Khuyến
  nghị: có, vì hai lời này là đúng lời ứng dụng gửi với phiên Mạnh tự đăng nhập, nhịp ≤ 0,2 lời/giây, và hễ nguồn trả 429, thử
  thách, 403 thì cả lượt dừng (AC-6, AC-13). Lối khác: dừng S02 khi nguồn bật thử thách, chờ hướng khác.
- Mục ghi cho Cổng: (1) tên tệp mô-đun phiên mang tên nguồn, và mô-đun thêm một dòng tên miền nguồn + mã client công khai của
  ứng dụng (main đã có hai dòng tên miền cùng họ ở tệp bộ thu) — gom vào việc dọn tên nguồn; (2) sau gộp cần GIAO triển khai build
  collector cho ZCode qua LL để lượt 19:05 chạy mã mới — ZT không tự build/chạy trên checkout chính.
- Ba phép đo của ZCode (`chay-test-dot-bien.mjs`, `khong-trinh-duyet.sh`, `vung.sh`) chạy lại trên nhánh hồ sơ 27/11: XANH, 23 bản
  đột biến đều bị bắt, bản đối chứng bo-thu có 1 ca đỏ sẵn do chép (ca đọc tệp nguồn — không tính là bắt được). `khong-lo-phien.sh`
  (ZT): XANH, sáu bản cấy đều bị bắt. `dung-ca-luot.mjs` (ZT, sau gap-probe): XANH, hai bản đột biến đều bị bắt.
- Chạy thật ZCode 26/11 (worktree, không mở trình duyệt): thị trường 95545 — 2 lời cấp token + 9 lời dữ liệu, 9 bản ghi, 0 lỗi;
  thị trường 47 — 2 + 18 lời, 17 bản ghi, 1 lỗi (404 trang kế, hàng ZC23). 0 lần 401, 0 AUTH FAIL, 0 bị chặn.
- Vòng 1 S4 trên M5 (27/11, REJECT E3 E4 E5 E8 E9): bản đối chứng của nhóm bo-thu có 33 ca đạt, 2 ca đỏ sẵn thay vì 34 và 1
  khi các nhóm chạy song song; chạy lại riêng thì 34/1, xanh. E9 mù nên ca đỏ thêm là «lệnh login: nguồn KHÔNG có lệnh login».
  Nguyên nhân CHƯA chứng: nghi phép đo dọn thư mục tạm chéo nhóm; không tái hiện trên Mac mini (ba nhóm song song và so le).
  Đã vá phép đo: chỉ dọn thư mục sót quá 3 giờ, và in tên mọi ca đỏ sẵn. Vòng sau lặp lại thì ghi tên ca và các nhóm đang
  chạy song song lúc đó.
- Triển khai (gộp ≠ đang chạy): build `collector/dist` ở checkout chính là việc GIAO cho ZV sau gộp — `ap-trien-khai/README.md`.
- Hồ sơ tự dựng của nhánh zcode giữ nguyên ở git tại @2f0748d06 (`_acceptance/s02-cua-api/`); `design.md`, `plan.md` giữ làm tài
  liệu thiết kế.
