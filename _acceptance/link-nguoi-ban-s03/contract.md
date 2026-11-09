---
schema_version: 1
feature: Người bán S03 không để lại số vẫn có link hồ sơ công khai, lấy theo mã tài khoản qua phiên kênh đang nối, chỉ đọc, có trần và tự dừng khi kênh phản ứng
slug: link-nguoi-ban-s03
owner: phanlemanh@gmail.com
risk_tier: T3
surfaces: [cli, config, api]
status: implemented
approved_by: Mạnh
approved_at: 2026-11-06
---

# Acceptance Contract: link-nguoi-ban-s03

## Context

Đo 06/11: 700/1.205 người bán S03 không để lại SĐT. Danh bạ Người S03 đã nhận diện người bán theo mã tài khoản (bí danh `tai_khoan_nguon`, 605 Người trên DB local), và `enrich-nguoi-s03` (migration 079, chưa gộp) chừa sẵn liên lạc loại `chat_profile` («Hồ sơ chat») trong `party_contacts`, chưa có bộ ghi.

ZCode đọc mã (`claudedp-0611-1`, XONG 06/11 08:22, chưa gọi kênh): thư viện kênh có `getUserInfo(uid)` trả `username`, từ đó dựng được link hồ sơ công khai; nhận mảng mã, một lời gọi nhiều hồ sơ. Phản biện 06/11 đọc thư viện: lời gọi đi đường hồ sơ bạn bè `getprofiles` kèm thông số danh bạ, tự thêm hậu tố `_0` vào mã, trả hai nhóm hồ sơ đổi và không đổi (nhóm không đổi không có `username`), hồ sơ có cả SĐT, tên, ảnh, ngày sinh; không có hết giờ riêng. Mã extension đang chạy chưa gọi đường này lần nào; trên đường tin chỉ có `getGroupInfo`. Nên đây là lời gọi mới, chưa có tiền lệ trên phiên thật.

Hàm bọc API của extension (`withS03Api` trong tài liệu này) không chỉ dùng phiên có sẵn: khi bộ nhớ đệm trống nó tự tạo client và đăng nhập lại bằng cookie đã lưu, và mỗi lần bộ nghe tin đóng thì bộ nhớ đệm bị xoá. Mã 3003 là mã đóng kết nối của bộ nghe tin, không phải lỗi của lời gọi.

Mạnh chọn 06/11, nguyên văn: «Qua gateway, gộp album». Nghĩa: không đăng nhập phiên thứ hai; lời gọi chạy trong phiên gateway đang nối; cài cùng lần khởi động lại của `ma-album-s03`, sau bản vá bộ canh `bo-canh-dem-luot-agent`. Ba lần thử đăng nhập API sáng 06/11 theo lệnh riêng của Mạnh đều dừng ở lỗi khởi tạo, nên không phải bằng chứng là đăng nhập thứ hai an toàn.

Source input: `claudedp-0611-1`, `claudedp-0611-4`; lời Mạnh qua giám sát 06/11; `gap-probe.md`.

## Criteria

- AC-1: Given bộ nghe tin giả đang nối và một tệp yêu cầu, When bộ tra chạy, Then chỉ lấy API của bộ nghe tin đang nối, không đi qua đường tự tạo client hay đăng nhập lại, không ghi tệp phiên; mỗi lời gọi tối đa 20 mã, cách lời trước ít nhất 60 giây tính cả qua lần khởi động lại bộ nghe tin (mốc lưu ra đĩa), tối đa 30 lời mỗi ngày, chỉ trong 01:00–05:00 giờ VN, một vòng hẹn giờ duy nhất dù bộ nghe tin khởi động lại; kết quả ghép theo `userId` của hồ sơ trả về (nhận cả khoá có `_0`), mỗi mã đúng một loại `co-username`, `khong-username`, `khong-ro` (nhóm không đổi), `khong-tim-thay`; Given không có bộ nghe tin đang nối, bộ nhớ đệm API trống, không có tệp yêu cầu, tệp rỗng hoặc sai khuôn, Then 0 lời gọi, 0 lần đăng nhập, băm tệp phiên không đổi, và không có phiên thì ghi tệp chặn `khong-co-phien`.
- AC-2: Given lời gọi ném lỗi máy chủ hoặc HTTP (401, 429, giới hạn tần suất, lỗi lạ) hoặc không trả trong 15 giây, When bộ tra nhận, Then dừng cả lượt, không thử lại, ghi tệp chặn chỉ chứa mã lý do liệt kê kèm mã số (không chép thông điệp thô), kết quả về muộn bị bỏ; Given bộ nghe tin đóng, lỗi hoặc bộ canh báo trong 30 phút sau một lời gọi, Then ghi tệp chặn `listener-dong-sau-goi` và in `dung-goi-Manh`; Given tệp chặn còn đó, Then 0 lời gọi tới khi người xoá; Given bộ tra dừng vì lỗi, Then bộ tra không đóng hay khởi động lại bộ nghe tin và handler vẫn nhận tin.
- AC-3: Given chế độ mặc định là thử, When chạy, Then đúng một lời gọi với tối đa 20 mã cộng 2 mã đối chứng là người đã gửi tin trong 24 giờ qua, ghi dấu đã thử, không chạy lần hai khi dấu còn; đầu ra chỉ có số đếm theo bốn loại và kết quả đối chứng; Given mã đối chứng ra `khong-tim-thay` hoặc `userId` trả về khác mã gửi đi, Then ghi tệp chặn `khac-khong-gian-ma`; Given chế độ lượt lớn, Then chỉ bật bằng giá trị người đặt trong tệp điều khiển riêng, không có mặc định, mỗi tệp yêu cầu chỉ xử một lần (đổi tên đã xử), vẫn giữ trần của AC-1.
- AC-4: Given diff extension và handler, When kiểm tĩnh và chạy với API giả có bẫy đếm lời gọi, Then lời gọi API mới duy nhất là `getUserInfo`; bộ tra không gọi hàm bọc tự đăng nhập, không gọi `login`, `loginQR`, không tạo client; không gửi tin, thả cảm xúc, gõ phím, đã xem, kết bạn, đọc danh bạ, `requestOldMessages`; không mở cổng mạng hay route HTTP; không đổi tệp cấu hình OpenClaw; marker bộ canh còn nguyên; bộ tra chỉ giữ `userId`, `username` của mỗi hồ sơ và bỏ mọi trường khác ngay khi nhận.
- AC-5: Given kết quả của một lượt, When bộ tra gửi tới API collector, Then thành một snapshot S03 riêng loại hồ sơ, ghi mới không sửa bản cũ, mỗi dòng có mã tài khoản, `username` hoặc rỗng, loại kết quả, thời điểm lấy; chuỗi đánh dấu mà API giả nhét vào tên, SĐT, ảnh, ngày sinh, thông điệp lỗi và giá trị dạng cookie xuất hiện 0 lần trong snapshot, spool, tệp chặn, log gateway thử và evidence; `DATA-CONTRACT` khai loại item mới, `schemaVersion` của S03 là số kế tiếp sau `ma-album-s03`, bộ nạp nhận mọi số từ bản của `ma-album-s03` trở lên với cả hai thứ tự gộp; Given collector không nhận, Then kết quả vào spool, không mất.
- AC-6: Given migration 080 trên DB thử, When chạy hai lần, Then có bảng stg hồ sơ S03 và `party_contacts` nhận thêm `rule_id` `s03_ho_so_theo_tai_khoan` cho liên lạc `chat_profile`, `rule_id` lạ vẫn bị từ chối, lần hai không lỗi; When bộ nạp chạy trên snapshot hồ sơ, Then mỗi mã giữ dòng mới nhất, chạy lại thêm 0 dòng; When bộ nạp chạy trên DB chưa có 080, Then in `CHUA-AP-080`, thoát 0, snapshot hồ sơ không bị đánh dấu đã nạp, các loại khác nạp như cũ; When áp 080 rồi nạp lại, Then đủ dòng. (cross-layer)
- AC-7: Given stg có kết quả, When bước ghi liên lạc chạy, Then mỗi mã `co-username` có `userId` trả về bằng đúng mã bí danh `tai_khoan_nguon` S03 của một Người nhận một liên lạc `chat_profile` với giá trị là `username` trần (không phải link), `rule_id` `s03_ho_so_theo_tai_khoan`, lớp `fact`, phương pháp `source_field`, bằng chứng gồm mã và thời điểm; Người đã gộp thì ghi vào Người đích theo `merged_into` một bước; chạy lại 0 mới; `username` đổi thì rút liên lạc cũ cùng `rule_id` lý do `doi-username` rồi thêm mới; lần tra mới ra `khong-username` hoặc `khong-tim-thay` thì rút lý do `bo-username`; liên lạc khác `rule_id` không bị đụng; Given mã không khớp Người, `khong-ro`, hoặc DB thiếu 079, 080 (in `CHUA-AP-079`, `CHUA-AP-080`, thoát 0), Then không ghi và được đếm; bước này không thêm bí danh, không gộp Người, không đổi liên lạc `sdt`, không đổi `sale_offers`. (cross-layer)
- AC-8: Given danh bạ Người S03, When lập tệp yêu cầu, Then chỉ chọn mã tài khoản dạng toàn chữ số của người đã đăng tin bán hoặc thuê mà mọi tin của tài khoản đó không có `seller_phone`, Người không có liên lạc `sdt` kể cả qua Người theo SĐT đã nối, và chưa tra trong 30 ngày tính cả snapshot hồ sơ chưa nạp; lượt thử chọn 20 mã có từ 3 tin; không lấy mã từ danh sách thành viên nhóm hay người chỉ bình luận; tệp yêu cầu nằm ngoài thư mục cấu hình OpenClaw và ngoài `snapshots/`.
- AC-9: Given tiền kiểm khởi động lại của `ma-album-s03`, When thêm bản này, Then tiền kiểm còn đòi không có tệp yêu cầu, không có tệp điều khiển lượt lớn, lời gọi mới duy nhất là `getUserInfo`; Given lượt thử sau khởi động lại, Then có số đo trước và sau (dòng đóng bộ nghe tin, PID gateway, số `post 202` trong 30 phút) và lệnh phán lùi có luật riêng: bộ nghe tin đóng trong 30 phút sau lời gọi thì trả `dung-goi-Manh`, không xếp vào dạng 26/10; Given đặt tệp chặn hoặc xoá tệp yêu cầu giữa lượt, Then các lời còn lại bằng 0 vì bộ tra kiểm hai tệp ngay trước mỗi lời, không cần khởi động lại gateway.
- AC-10: Given cây sau thay đổi, When quét mọi tệp đổi cộng 079, 080, `.patch` và `_acceptance/link-nguoi-ban-s03/**` theo danh sách tên thật và tên miền đọc từ `source_registry` local (không in danh sách), Then 0 lần xuất hiện mới; link được dựng lúc hiển thị từ mẫu nằm ở `source_registry` local, không có mẫu link trong kho.
- AC-11: Given bản sửa xong, When đọc `runtime-map`, `runbook-openclaw-hook`, `pipeline/mappings.yaml` và `CONTEXT.md`, Then có: bộ tra chỉ dùng bộ nghe tin đang nối và cấm đăng nhập thứ hai; con số trần; cách chạy lượt thử, đọc số đếm và đối chứng, xử từng loại tệp chặn; chỉ Mạnh bật lượt lớn; tắt không cần khởi động lại; `rule_id` mới khai đủ sáu điều kiện ADR-0011; thuật ngữ cho username người bán; các điều chưa đo. (judgment)

## Coverage

- Trục chặng: bộ tra trong extension (AC-1, AC-2, AC-3) · ranh giới lời gọi và trường giữ lại (AC-4) · collector, hợp đồng dữ liệu (AC-5) · migration, bộ nạp (AC-6) · ghi liên lạc vào Người (AC-7) · chọn mã (AC-8) · triển khai cùng khung mã album (AC-9) · lộ tên nguồn (AC-10) · tài liệu (AC-11).
- Trục kết quả từng mã: có `username` · không có · không đổi · không tìm thấy · không khớp Người · Người đã gộp · `username` đổi · `username` bị gỡ (AC-1, AC-7).
- Trục lỗi kênh: lỗi máy chủ, HTTP 401, 429 · giới hạn tần suất · treo quá 15 giây · lỗi lạ · không có phiên · bộ nghe tin đóng sau lời gọi · khác không gian mã · tệp chặn còn (AC-1, AC-2, AC-3, AC-9).
- Trục an toàn: một phiên, không đăng nhập lại, không ghi tệp phiên (AC-1, AC-4) · trần số (AC-1) · lượt thử chỉ số đếm (AC-3) · không tự bật lượt lớn (AC-3, AC-11) · dữ liệu cá nhân thừa và thông điệp thô không rò (AC-4, AC-5) · tên nguồn không lên kho (AC-10).
- Thước đối chiếu: mã extension và thư viện đang chạy (đọc 06/11); đo 06/11 trên DB local (700/1.205 người bán không SĐT, 605 bí danh `tai_khoan_nguon` S03) [CE chưa kiểm chứng: trần an toàn của kênh không có nguồn ngoài; 60 giây, 30 lời/ngày, khung 01:00–05:00 là trần bảo thủ tự đặt].

## Out of scope

- Không đăng nhập phiên thứ hai, không tạo client, không đăng nhập lại qua hàm bọc, kể cả để thử.
- Không chạy lượt lớn trong hồ sơ này: lượt lớn cần lời riêng của Mạnh sau khi xem số đếm lượt thử.
- Không hiện link trên Invest, `/ops` hay API công khai, không đưa lên cloud: `party_contacts` chỉ ở máy thu như 079 đã khai; việc hiện là hồ sơ sau.
- Không lưu SĐT, tên hiển thị, ảnh, ngày sinh trong hồ sơ trả về; dùng SĐT đó là quyết định riêng. Không tra theo SĐT (nhánh tra hồ sơ từ SĐT của Mạnh giữ nguyên).
- Không khởi động lại gateway thật và không áp 080 lên DB thật trong lượt chấm: đi cùng lời giao triển khai của `ma-album-s03`, áp cần sao lưu và lời duyệt riêng của Mạnh.

> Out of scope = scope-truth (Gate 1 duyệt mục này). Rationale từng mục ở `decisions.jsonl`.

## Notes

- Phân làn: ZCode giữ bộ tra trong extension, handler, API collector, bộ nạp, `DATA-CONTRACT` (AC-1 đến AC-5, phần nạp của AC-6, phần tiền kiểm và phán lùi của AC-9, `.patch` extension). Làn Claude giữ migration 080, bước ghi liên lạc (AC-7), lập tệp yêu cầu (AC-8), quét tên nguồn (AC-10), tài liệu (AC-11).
- Miễn có tên cho AC-10 (giám sát quyết 07/11): đường thư mục extension trong `extension.patch` thuộc cây upstream OpenClaw, không do kho đặt tên. E10 bỏ qua đúng tiền tố `extensions/<thư mục>/` trên dòng đầu khối diff (`diff --git`, `---`, `+++`) của `.patch`; dòng nội dung của `.patch` và mọi tệp khác vẫn phải sạch.
- Định danh upstream miễn có tên (giám sát quyết 07/11): tên hàm, kiểu, module có sẵn của gói OpenClaw, viết với chỗ thế `{S03}` (E10 thay bằng tên thật đọc từ `source_registry` local lúc quét, kho không giữ tên). Danh sách: `getConnected{S03}Api` · `with{S03}Api` · `create{S03}` · `send{S03}TextMessage` · `{S03}-js` · `monitor{S03}Provider` · `deliver{S03}Reply` · `deliver{S03}userReply` · `monitor{S03}userProvider` · `{S03}userMonitorOptions` · `{S03}userMonitorResult` · `start{S03}Listener` · `Active{S03}Listener` · `{S03}GroupContext` · `{S03} listener closed` (mười mục sau thêm 09/11, căn cứ ở decisions.jsonl; mục cuối là cụm chữ nguyên văn trong thông báo lỗi upstream). Chỉ áp trong `extension.patch` và `collector/openclaw/**`, khớp nguyên từ, chỉ trên dòng mã — chú thích, chuỗi, biến và tên tệp mình đặt vẫn phải dùng mã S0x.
- Phụ thuộc 079: thống nhất với `enrich-nguoi-s03` ngày 06/11: `kind = 'chat_profile'` (nhãn «Hồ sơ chat»), không mang tên nguồn; nguồn nằm ở `rule_id` và `evidence`; 079 đổi trước khi gộp. 080 chỉ thêm `rule_id` và bảng stg bằng tệp mới, không sửa 079. Đối chiếu RESO: resource `SocialMedia` (`SocialMediaUrlOrId`).
- Thứ tự triển khai: sau khi Mạnh ký hai cổng của hồ sơ này, `ma-album-s03` và bản vá bộ canh đang chạy: sao lưu DB, áp 077, 079, 080 theo lời riêng của Mạnh → build API collector → cài handler, extension (một lần cho cả mã album và bộ tra) → tiền kiểm → khởi động lại gateway trong khung 2–4 giờ → 30 phút ổn theo lệnh phán lùi → đặt tệp yêu cầu lượt thử → canh 30 phút → báo số đếm cho Mạnh. Lượt thử không chạy cùng phút khởi động lại, để lỗi kênh không bị gán nhầm.
- Tắt bộ tra: xoá tệp yêu cầu hoặc đặt tệp chặn; không cần khởi động lại. Lùi mã bộ tra đi cùng phạm vi lùi extension của mã album.
- Giá nếu kênh khoá phiên: mất thu S03 tới khi Mạnh quét QR lại; dữ liệu đã thu không mất. Lượt thử một lời ở giờ im giảm xác suất, không đưa về 0.
- Chưa đo: tỉ lệ người bán có `username`; `sender_id` lưu ở stg có cùng không gian mã hàm nhận không (lượt thử đo bằng 2 mã đối chứng); kênh có coi đường hồ sơ bạn bè gọi cho người lạ là bất thường không.
