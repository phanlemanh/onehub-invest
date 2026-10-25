---
schema_version: 1
feature: ZC1 nối tiếp — cứng hoá ingest của collector API (media rác không làm hỏng lô, id tin chữ giữ nguyên, payload nguyên vẹn)
slug: kev-nhan-cung-hoa
owner: phanlemanh@gmail.com
risk_tier: T2
surfaces: [cli]
status: implemented
approved_by:
approved_at:
gate1_skipped: true
---

# Acceptance Contract: kev-nhan-cung-hoa

## Context

Collector API (`collector/src/api/server.ts`) nhận tin Zalo/FB từ hook và agent. Trước ZC1 nối tiếp, một tin có `media` không phải mảng hoặc mảng chứa `null` làm hỏng cả lô (500). Thứ tự hay khoảng trắng của URL ảnh cũng làm một tin chỉ ảnh gửi lại ra `sourceId` mới, nên bị nhân đôi. ZCode lọc media rác CHỈ khi băm, chuẩn hoá và sắp URL trước khi băm, và dùng `trim` CHỈ để quyết định tin nào là tin chỉ ảnh. Tin chữ vẫn băm bằng text nguyên bản theo công thức cũ. Payload lưu đúng như nhận (DATA-CONTRACT: mọi chuẩn hoá nằm ở pipeline).

Source input: lời giao `claudedp-2310-6` và lời MỞ LẠI cùng mã (24/10/2026) trên kênh coord. Nhánh `zcode/kev-nhan-cung-hoa` @ 8043a63, gộp vào nhánh nghiệm thu cùng `origin/main` @ 91ac403.

## Criteria

- AC-1: Given một lô có tin mang `media` là chuỗi, `null` hoặc object (không phải mảng), When collector ingest, Then lô trả 202 và mọi tin trong lô (kể cả tin lành) được nhận và có trong snapshot sau flush, không ném lỗi.
- AC-2: Given một tin có mảng `media` chứa `null`, số, chuỗi hoặc phần tử thiếu `url`/`path`, When collector ingest, Then tin được nhận (202), không ném lỗi.
- AC-3: Given tin có text có khoảng trắng hai đầu, text toàn khoảng trắng, hoặc media rác, When collector flush, Then `payload.text` và `payload.media` trong snapshot giống hệt giá trị đã nhận.
- AC-4: Given một tin chỉ có ảnh đã nhận, When cùng tin được gửi lại với URL đảo thứ tự, URL có khoảng trắng hai đầu, URL có `?`/`#` thừa ở cuối, hoặc kèm thêm phần tử rác, Then lần gửi lại bị khử trùng (`duplicates: 1`).
- AC-5: Given một tin chỉ có ảnh đã nhận, When một tin cùng nhóm, cùng ts, cùng sender nhưng khác ảnh thật (khác một URL, thiếu một ảnh, query thật khác) tới, Then tin đó được nhận riêng (`accepted: 1`) — chuẩn hoá không gộp nhầm.
- AC-6: Given một tin có chữ (kể cả có khoảng trắng hay xuống dòng ở hai đầu, kèm hoặc không kèm ảnh), When tính `sourceId`, Then id bằng `sha256(group|ts|text nguyên bản)` cắt 32 ký tự; `' abc '` và `'abc'` ra hai id khác nhau.
- AC-7: Given tin có text toàn khoảng trắng kèm ảnh, When ingest, Then tin được xử như tin chỉ ảnh: id theo sender + URL (không theo công thức tin chữ), hai sender khác nhau ra hai id, và gửi lại với khoảng trắng khác thì bị khử trùng.
- AC-8: Given một lô có tin mang `text` không phải chuỗi (`null`, số, object, thiếu), When ingest, Then trả 400 kèm thông điệp, không ném lỗi, và lô hợp lệ kế tiếp vẫn được nhận.
- AC-10: Given tin chỉ ảnh có phần tử media mang `url` không phải chuỗi (số, object, null) hoặc `url` rỗng nhưng `path` là chuỗi, When ingest, Then tin được nhận (202), không ném lỗi, id băm theo `path`; hai tin cùng nhóm, ts, sender chỉ khác `path` ra hai tin riêng, và gửi lại y hệt thì bị khử trùng. (thêm ở vòng 2 — lỗi ngoài hợp đồng vòng 1: `{url: 5, path}` làm ingest ném, HTTP trả 500 cả lô)
- AC-9: Given nhánh đã gộp `origin/main`, When chạy toàn bộ test của collector, Then tất cả xanh.

## Coverage

- Bỏ coverage-scan: phạm vi là đúng bốn ý của lời giao (media rác không 500, sắp URL trước khi băm, chuẩn hoá url/path, xử text toàn khoảng trắng) cộng ba điểm của lời MỞ LẠI (id tin chữ giữ nguyên, payload nguyên vẹn, text không phải chuỗi). Các trục:
  - hình dạng `media`: không phải mảng / mảng có rác / mảng lành;
  - hình dạng `text`: có chữ / có khoảng trắng hai đầu / toàn khoảng trắng / không phải chuỗi;
  - biến thể URL: thứ tự / khoảng trắng / dấu thừa cuối / khác thật (should-NOT-fire);
  - tầng: phản hồi ingest / `sourceId` / payload trong snapshot.

## Out of scope

- Tầng pipeline (`import-airbnb.mjs` nạp `payload.media` rác vào `stg_zalo_posts.media`): vòng này không đo; nếu cần thì là việc riêng, chạy trên bản chép DB.
- Một tin xấu trong lô nhiều tin vẫn làm CẢ LÔ bị từ chối 400 (luật kiểm cũ, có từ trước ZC1). Không đổi sang lọc từng tin ở vòng này.
- Tính lại `sourceId` cho tin đã có trong raw cũ — không backfill.
- Ảnh cùng nội dung nhưng URL ký khác (token khác) vẫn ra hai id.

## Notes

- Hợp đồng dựng SAU khi ZCode code xong (cùng cách với `sourceid-tin-anh`), nên `gate1_skipped: true`. Phiên điều phối liên làn dựng hồ sơ, không viết code sản phẩm.
- Harness `scripts/kev-nhan-cung-hoa/acceptance.mjs` gọi thẳng `createAgentServer()` của bản build: không mở cổng, không chạm :9210, không ghi DB. URL ảnh giả dùng host `.invalid` và `flush({ skipMedia: true })`, nên không có lượt GET nào ra mạng.
- Kiểm harness biết đỏ (trước verify): trên `origin/main` đỏ ở media-junk, payload-intact, dedup-norm, legacy-id; trên bản vòng 1 bị trả lại (b0ca837) đỏ ở payload-intact và legacy-id — đúng các lỗi lời MỞ LẠI đã nêu.
- Text toàn khoảng trắng KHÔNG kèm ảnh: id đổi so với công thức cũ (băm như tin chỉ ảnh với sender). Ca này hiếm; ghi vào Known limits khi verify.
- Vòng 1 (c4ad48a, kiểm trên 664d587): PASS 9/9, nhưng người chấm tìm ra lỗi ngoài hợp đồng — `{url: 5, path: "/a.jpg"}` làm `ingest()` ném (`s.trim is not a function`), HTTP trả 500 cả lô; và `url: ""` làm `path` bị bỏ khi băm nên hai ảnh khác bị gộp. Điều phối liên làn tái hiện được và MỞ LẠI `claudedp-2310-6`. Thêm AC-10 + E10; harness `url-path` đỏ 3 mục trên 8043a63.
- Vòng 2 (25/10): ZCode sửa ở 62eaf38 (`mediaRefOf` chọn chuỗi đầu tiên: url chuỗi không rỗng, rồi path chuỗi), đã rebase nên nhánh nghiệm thu dựng lại thành `claude/acceptance-kev-nhan-cung-hoa-r2` từ `origin/main` + merge 62eaf38, mang hồ sơ và harness sang. E9 đổi sang `executors.script.collector_test_clean` (xoá dist cũ trước khi build).
