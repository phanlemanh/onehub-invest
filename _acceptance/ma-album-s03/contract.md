---
schema_version: 1
feature: Bài ảnh S03 giữ được mã album từ lúc tin về tới bảng stg, để biết ảnh nào thuộc cùng một bài và đo được ảnh rơi
slug: ma-album-s03
owner: phanlemanh@gmail.com
risk_tier: T3
surfaces: [api, cli, config]
status: draft
approved_by:
approved_at:
---

# Acceptance Contract: ma-album-s03

## Context

Một album trên kênh S03 về thành nhiều tin rời, mỗi tin một ảnh. Monitor bỏ `content.params` và `msgType` trước hook, nên bảng stg S03 không biết ảnh nào cùng một bài và không đo được ảnh rơi. Mạnh chốt 05/11: S03 đủ đường ống là mấu chốt; đồng ý đường T3, migration 077 cùng hồ sơ, chưa cho lấy tin cũ.

Đường đi: extension kênh S03 → một mục `media` chỉ chứa `albumMeta` → internal hook → handler → API collector (`RawItem.meta.albumMeta`) → bộ nạp → cột `album_meta` → đo ảnh rơi. Handler là internal hook, nên đi qua `toInternalMessageReceivedContext`. Đã chạy hàm này trên runtime đang chạy: `providerUpdate` và trường lạ rơi, mục `media` được chép nguyên. Đường `providerUpdate` trong `zcode-0511-24` chỉ đúng với plugin hook, không tới handler. Mục `media` không có `mediaPath`, `mediaUrl` nên handler hiện tại đã lọc bỏ, không tính thành ảnh. Làn ZCode giữ extension, handler, API, bộ nạp; làn Claude giữ migration 077 và phần đo.

Gateway từng gây 2 sự cố gửi tin vào nhóm và 1 lần thu rỗng không ai biết. Hồ sơ này chỉ chứng minh bản sửa trên nhánh và bước diễn tập. Việc khởi động lại gateway thật là một lời giao riêng sau khi gộp.

Số đo 05/11 thay cho ghi chép cũ `runtime-map`: tin tới theo kết nối dài, không theo nhịp 10 phút (3 ngày qua 99% bài có `captured_at - posted_at` dưới 60 giây, 0 bài từ 11 phút trở lên; 8.000 dòng `post 202` gần nhất cách nhau tối đa 451 giây). Khung 2–4 giờ có 0,007 bài/giây, nhưng bài tới theo cụm: 90 giây tính từ một bài có trung bình 3,42 bài, tối đa 13. Nên đứt 30–90 giây có thể mất trọn một album, không phải «tối đa 1 tin». Log có 2 lần listener đóng mã 3003 (26/10, 27/10), cả hai tự khởi động lại sau khoảng 6 giây.

Source input: `zcode-0511-22`, `zcode-0511-24`, `claudedp-0511-12`, `claudedp-0511-13`; lời Mạnh «Theo khuyến nghị» qua giám sát 05/11.

## Criteria

- AC-1: Given tin ảnh có `content.params` chứa khoá album, When monitor của bản build mới xử lý, Then `canonical.media` có đúng một mục chỉ chứa `albumMeta` đủ `group_layout_id`, `id_in_group`, `is_group_layout`, `total_item_in_group`, `child_number`, `msg_type`; Given tin chữ hoặc ảnh đơn không khoá, Then canonical giống hệt bản trước vá; Given `params` hỏng, Then tin vẫn đi tiếp và không có `albumMeta`; Given album không mention trong nhóm `requireMention=true`, Then hook chạy đúng 1 lần, agent dispatch 0 lần.
- AC-2: Given runtime phát hành đang chạy, When đưa canonical của AC-1 qua đúng `toInternalMessageReceivedContext`, Then `media[].albumMeta` tới nguyên vẹn, mẫu không khoá đủ trường cũ, và kết quả in phiên bản runtime; Given bộ chiếu giả làm rơi mục đó, Then phép thử thoát khác 0.
- AC-3: Given đầu ra thật của phép thử AC-2, When đưa vào `handler.js` thật với API giả, Then body gửi đi có `albumMeta` và mục đó không tính thành ảnh; Given sự kiện không có, Then body giống hệt bản trước vá; Given `albumMeta` sai kiểu, Then tin vẫn được gửi hoặc vào spool, không mất.
- AC-4: Given payload có `albumMeta` hợp lệ, When API collector nhận, Then `RawItem.meta.albumMeta` giữ nguyên; manifest của riêng kênh S03 ghi `schemaVersion` số kế tiếp, `DATA-CONTRACT` khai trường mới và kênh khác giữ số cũ; Given `albumMeta` sai dạng, Then bài vẫn được nhận và trường bị bỏ; Given không có, Then item như trước.
- AC-5: Given migration 077 trên DB thử, When chạy hai lần, Then bảng stg S03 có cột `album_meta jsonb` cho phép rỗng và lần hai không lỗi; When nạp snapshot sinh bằng `SnapshotWriter` thật có `meta.albumMeta`, Then cột đúng giá trị; When nạp snapshot cũ, Then `album_meta IS NULL` và số bài không đổi; When bộ nạp mới chạy trên DB chưa có 077, Then vẫn nạp được, bỏ trường và in cảnh báo; When hai bộ nạp đọc số `schemaVersion` mới, Then đều nhận; When chạy transform S03, Then số dòng và giá trị canonical không đổi.
- AC-6: Given snapshot đã nạp, When chạy phép đo ảnh rơi trên cửa sổ 24 giờ theo `manifest.finishedAt`, Then báo số nhóm, nhóm từ 2 bài, nhóm thiếu so với `total_item_in_group`, nhóm có tổng không thống nhất, số `post 202` so với số item snapshot; tỉ lệ = nhóm thiếu / nhóm đủ điều kiện tính; thiếu 2,0% không cảnh báo, trên 2% cảnh báo, trên 5% báo dừng mở rộng; nhóm mới dưới 10 phút và album vắt qua ranh cửa sổ không tính thiếu; phép đo không ghi dữ liệu.
- AC-7: Given bản build mới đã cài vào chỗ thử, When chạy tiền kiểm, Then `openclaw config validate` đạt trên bản chép cấu hình thật, marker bộ canh (`pluginHooks`, `SuppressMessageReceivedHooks`) có trong monitor, băm tệp cấu hình OpenClaw không đổi, mã mới không có `requestOldMessages`, `old_messages` hay đường gửi tin mới, không có phiên agent dở và không có dòng lượt agent trong 60 phút; Given thiếu một trong các điều đó, Then tiền kiểm thoát khác 0 và in rõ không được khởi động lại.
- AC-8: Given đúng hai tệp log thật (log gateway theo +07:00, log hook theo UTC), When chạy lệnh phán lùi, Then trả `dung-goi-Manh`, không bật lại, khi agent có lượt mới; trả `lui-bat-lai` khi tiến trình không lên hoặc thoát lại trong 2 phút, bộ canh đỏ, listener đóng trong 15 phút đầu, listener đóng mà sau 2 phút chưa có `starting ... provider`, hết lượt auto-restart, hoặc 30 phút không có `post 202`; Then KHÔNG lùi với dạng log 26/10, 27/10 (đóng 3003 ngoài 15 phút đầu, tự nối lại sau khoảng 6 giây) và với 29 phút không có `post 202`; mẫu log trong kho không chứa tên hay ID tài khoản thu.
- AC-9: Given gateway thử tách biệt, không dùng phiên tài khoản thu và không nối kênh S03, When cài bản mới, khởi động, khôi phục sao lưu rồi khởi động lại, Then cả hai lần qua hết startup phases, `openclaw config validate` đạt, monitor mới import động được từ chỗ cài thử, `diff -r` với sao lưu (dist, handler, `openclaw.plugin.json`) rỗng sau khôi phục, thời gian lùi được ghi; PID gateway thật không đổi, log gateway thật không có dòng listener đóng mới trong lúc diễn tập, và thư mục thử không có khoá phiên.
- AC-10: Given bản sửa xong, When đọc tài liệu, Then `runtime-map` và `runbook-openclaw-hook` không còn ghi poll 10 phút chưa đo, có số đo ở Context, có chuỗi tin mới, thứ tự triển khai, phạm vi lùi và ai canh, đủ để người khác làm theo, và có dòng nhắc chạy lại phép thử AC-2 mỗi lần nâng runtime; bản vá extension có trong kho dạng `.patch`, áp lên `568ed825b` ra đúng mã đã build. (judgment)

## Coverage

- Trục chặng: extension (AC-1) · bộ chiếu internal của lõi (AC-2) · handler thật nhận đầu ra thật (AC-3) · API, hợp đồng dữ liệu (AC-4) · bộ nạp, cột, transform (AC-5) · đo (AC-6). Chặng thật trên gateway chỉ chứng minh được sau khởi động lại [giới hạn, xem Notes].
- Trục loại tin: ảnh trong album · ảnh đơn · chữ · `params` hỏng · trường lạ (AC-1, AC-2, AC-3, AC-4).
- Trục pha vận hành: trước khởi động lại (AC-7) · điều kiện lùi (AC-8) · diễn tập lùi (AC-9) · hướng dẫn và vết bản vá (AC-10) · sau khởi động lại (Notes, ghi ở lời giao triển khai).
- Trục an toàn: gửi tin vào nhóm, cấu hình OpenClaw, lấy tin cũ (AC-7) · phiên thật không bị đụng lúc diễn tập (AC-9).
- Thước đối chiếu: log gateway và DB local 05/11; `docs/ops/runtime-map.md` mục Fix 22/10 [CE chưa kiểm chứng: chưa có quy chuẩn ngoài cho ngưỡng 2%, 5%].

## Out of scope

- Không gọi và không đo `requestOldMessages`, kể cả để thử.
- Không khởi động lại gateway thật và không áp 077 lên DB thật trong lượt chấm: khởi động lại đi bằng một lời giao riêng sau khi gộp; áp cần sao lưu và lời duyệt riêng của Mạnh.
- Không thu lại dữ liệu cũ; bài trước triển khai giữ `album_meta` rỗng.
- Không gom ảnh, tách bài hay đổi canonical theo mã album: quyết sau khi có số đo thật.
- Không sửa lõi gateway, không đổi cấu hình OpenClaw.

> Out of scope = scope-truth (Gate 1 duyệt mục này). Rationale từng mục ở `decisions.jsonl`.

## Notes

- Thứ tự triển khai, sau khi Mạnh ký hai cổng và PR đã gộp: sao lưu DB và áp 077 theo lời duyệt riêng của Mạnh → build và khởi động lại API collector → sao lưu rồi cài handler, extension → tiền kiểm AC-7 → khởi động lại gateway trong khung 2–4 giờ của đêm đã sẵn sàng, không phải đêm 05/11; sau việc ghép ảnh và gắn nhãn. ZCode làm trên nhánh, không merge. Bộ nạp mới chịu được DB chưa có 077 (AC-5), nên gộp không phải chờ 077.
- Sau khởi động lại, ghi vào tin XONG của lời giao triển khai, kiểm cả hai phía: agent 0 lượt mới; tin chảy tới hook (`post 202`); trong 1 giờ có ít nhất 1 item snapshot mang `meta.albumMeta`; dòng `listener connected`; bộ canh ok. Bộ nạp chạy lúc 00:00 nên chưa kiểm được ở stg trong khung đó. Phiên ZCode nhận lời giao canh lệnh phán lùi tới hết 30 phút đầu.
- Phạm vi lùi: chỉ extension và handler. 077, snapshot, `album_meta` đã ghi, bộ nạp, API collector không lùi. Bộ nạp cũ từ chối `schemaVersion` mới, nên revert PR phải kèm cách xử snapshot đã ghi. Agent có lượt mới: dừng, không bật lại, gọi Mạnh, theo runbook.
- Giới hạn đã biết: không có nguồn đối chứng để đo số tin mất trong lúc đứt; chỉ có cận từ số đo Context, tối đa 13 bài trong 90 giây. Phiên thật của tài khoản thu không diễn tập được vì hai kết nối có thể đá nhau (mã 3003, chưa kiểm nguyên nhân). Mục `media` là mượn trường có nghĩa khác, nên mỗi lần nâng runtime phải chạy lại AC-2.
- `group_layout_id` là khoá gom mới là suy diễn: mẫu 05/11 N=9 chưa thấy hai tin chung khoá. AC-6 đo điều này trong 24 giờ đầu; hai ngưỡng 2%, 5% là tạm, chốt lại sau đó. Phép đo chỉ báo, không chặn ghi.
- `schemaVersion`: số kế tiếp lúc gộp; `DATA-CONTRACT` hiện ở 5 nên là 6 nếu không có việc nào gộp trước; không giữ chỗ cho PL5.
- `album_meta` là cột stg, không thêm field canonical, nên chưa cần khai `pipeline/mappings.yaml` (ADR-0011).
