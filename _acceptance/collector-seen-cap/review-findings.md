# Review findings: collector-seen-cap (round 2)

Vòng 2 chấm cây `13becc4`, gồm ZCode `7b5ccfb` (đã rebase lên main) và `origin/main` mới nhất. Diff ZCode của vòng này chỉ chạm `collector/src/api/server.ts` và `collector/src/test/agent-seen-cap.test.ts`.

## Trong hợp đồng

(không có finding nào map được vào AC — 7/7 eval đạt. Hai lỗi vòng 1 trả lại, nay là AC-6 và AC-7, đều đã sửa: chạy bản vòng 1 `1670ed4` thì đỏ, bản vòng này thì xanh.)

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa. Ba mục gắn nhãn `(r1)` mang sang từ vòng 1 và đã có quyết định nên giữ nguyên, không tính lại. Chỉ mục cuối là phát hiện mới của vòng 2.

- **Tệp khử trùng do bản collector cũ để lại có id trùng nên một số tin sẽ bị nhận lại sau khi triển khai** (r1 · đã quyết: Mạnh trả lại sửa, nay là AC-6, đã sửa ở 7b5ccfb)
  Người dùng thấy gì: Sau khi collector bản mới chạy, một số tin Facebook/Zalo gửi lại (FB chạy 4 giờ một lần với cửa sổ 12 giờ) được nhận thêm lần nữa và lặp vào snapshot mới.
  Căn cứ: Tệp state thật hiện có 5000 phần tử nhưng chỉ 4991 id khác nhau (đo chỉ đọc); bản mới nạp nguyên không bỏ trùng nên các id đó lệch giữa hai cấu trúc và mất khử trùng, rồi tự lặp lại; sửa chỉ một chỗ (bỏ trùng khi nạp) trước khi triển khai ZC4.
  file: `collector/src/api/server.ts`
  severity: medium
  Đề xuất: new-contract

- **Gửi lên một thân rỗng (null) giờ nhận lỗi máy chủ thay vì lỗi dữ liệu, làm hook gửi lại mãi** (r1 · đã quyết: Mạnh trả lại sửa, nay là AC-7, đã sửa ở 7b5ccfb)
  Người dùng thấy gì: Nếu một bên gửi thân null, collector trả lỗi máy chủ; hook Zalo coi đó là lỗi tạm và giữ tin để gửi lại mãi thay vì loại.
  Căn cứ: Đây là hồi quy do chính đoạn kiểm trần lô của vòng này (đọc số tin trước khi kiểm thân có phải đối tượng không); bên gửi thật chưa từng gửi null, sửa một dòng.
  file: `collector/src/api/server.ts`
  severity: low
  Đề xuất: new-contract

- **Tin còn trong bộ đệm có thể mất khỏi bộ nhớ khử trùng khi một lượt flush chậm mà hơn 5000 tin đổ vào cùng lúc** (r1 · đề xuất ghi Known limits, mã không đổi ở vòng 2)
  Người dùng thấy gì: Cùng một tin có thể xuất hiện hai lần trong một hoặc hai snapshot liền nhau.
  Căn cứ: Chỉ xảy ra khi hơn 5000 tin chưa ghi dồn trong một lượt tải ảnh; lưu lượng hiện tại thấp hơn nhiều; ghi lại là đủ.
  file: `collector/src/api/server.ts`
  severity: low
  Đề xuất: known-limits

- **Sau một thời gian dài collector không ghi được snapshot, lượt ghi thành công đầu tiên có thể làm collector đứng hình nhiều giây**
  Người dùng thấy gì: Khi đĩa đầy hay thư mục snapshot không ghi được trong lúc tin vẫn đổ vào, tới lúc ghi được trở lại thì collector không trả lời ai trong một khoảng: khoảng 1 giây nếu đã dồn 50 nghìn tin, khoảng 16 giây nếu dồn 200 nghìn tin. Trong lúc đó bên gửi chờ hoặc hết giờ rồi gửi lại. Không mất tin, và collector tự chạy lại bình thường sau đó.
  Căn cứ: Chỉ gặp sau một sự cố ghi kéo dài cộng lưu lượng lớn hơn hiện tại hàng trăm lần (hiện mỗi ngày vài trăm tin), và không mất dữ liệu; nhưng đây đúng là kiểu đứng hình mà hợp đồng này sinh ra để chữa, và sửa thì rẻ, nên ghi lại để người chọn.
  file: `collector/src/api/server.ts`
  severity: low
  Đề xuất: known-limits

### Chi tiết kỹ thuật cho mục mới (người chấm đo, chỉ dùng thư mục tạm)

- Vòng cắt mới `while (seenOrder.length > SEEN_CAP) seen.delete(seenOrder.shift())` (dòng 304–306) gọi `Array.prototype.shift` từng phần tử. Mỗi lần `shift` dời toàn mảng, nên tổng chi phí tăng theo bình phương số id phải cắt. Đo riêng phép cắt trên Node của máy này: 6000 id cắt về 5000 mất khoảng 1 ms, 50.000 id mất khoảng 790 ms, 200.000 id mất khoảng 16.300 ms. Toàn bộ thời gian đó chặn event loop.
- `seenOrder` chỉ phình quá 5000 khi nhiều lượt flush liên tiếp không ghi được. Vòng 1 đã ghi điều này ở Known limits («seenOrder tăng không giới hạn cho tới lượt flush thành công kế tiếp»). Mục mới là hệ quả của giới hạn ấy: lượt cắt đầu tiên sau sự cố trả giá theo bình phương.
- Phép lọc bộ đệm `buffer.filter((i) => !ids.includes(i.sourceId))` (dòng 296) cũng tăng theo bình phương (50.000 tin khoảng 1,3 giây), nhưng có sẵn từ `origin/main`, không thuộc diff ZCode.
- Cách sửa gợi ý (một dòng): cắt một lần bằng `const bo = seenOrder.splice(0, seenOrder.length - SEEN_CAP); for (const id of bo) seen.delete(id);`. Không cần đổi hợp đồng.

### Soát diff vòng 2 — những điểm KHÔNG thành finding

- Bỏ trùng lúc nạp giữ lần CUỐI (dòng 111–117) là đúng cho thứ tự cắt: bản sao cuối là lần ingest gần nhất, nên id xếp theo lần thấy gần nhất và bị cắt muộn nhất có thể. Sau khi nạp, `seen` và `seenOrder` luôn cùng phần tử: `ingest` chỉ thêm id khi `seen` chưa có, còn vòng cắt xoá cùng lúc ở hai nơi. Vì vậy bất biến «không trùng» được giữ suốt vòng đời tiến trình. Thăm dò ngoài eval xác nhận điều này: state `[X, 4998 id giả, X]`, thêm 2 tin rồi flush, gửi lại X. Bản `1670ed4` nhận lại X, còn bản vòng 2 khử trùng X. Ca đơn vị mới của ZCode trong E5 kiểm đúng cơ chế này.
- Thân yêu cầu dạng chuỗi, số, null, `false` hay `0` bị chặn 400 ở `handle` (dòng 363–365). Thân là mảng (`[]`, `[{…}]`) lọt qua phép kiểm này vì `typeof [] === "object"`. Tuy vậy mảng không có `.messages` nên `msgCount` bằng 0, rồi `ingest` trả 400 vì thiếu `agent_id`. Thân `{"messages":"x"}` hay `{"messages":{"length":99999}}` không phải mảng, nên `msgCount` bằng 0 và cũng ra 400. Thăm dò cho thấy không ca nào ra 500.
- Kích thước state: tệp ghi thẳng `seenOrder` sau khi cắt, tối đa 5000 id không trùng, cỡ 175 KB. State hỏng hay không phải mảng vẫn rơi vào `catch` như bản cũ (coi như lần đầu chạy).
- Thứ tự kiểm khoá: thân `null` gửi KHÔNG kèm khoá nay nhận 400. Trên `origin/main` ca này nhận 401, trên `1670ed4` nhận 500. Đây cùng loại với giới hạn vòng 1 «413 chạy trước kiểm khoá», nên gộp vào Known limits, không tách thành mục riêng.

## Known limits

- Các giới hạn vòng 1 vẫn đúng, mã vòng 2 không đổi chúng (số dòng theo `server.ts` hiện tại):
  - Bộ nhớ khử trùng và bộ đệm không có trần tổng giữa hai lượt flush. Việc cắt chỉ chạy sau lượt flush GHI THÀNH CÔNG (dòng 304–306), và comment dòng 199–202 nói quá.
  - Trần 413 đếm tin, không đếm byte (dòng 356–375).
  - Lỗi ghi tệp state sau khi snapshot đã finalize thì bộ nhớ và đĩa lệch nhau (dòng 288–308).
  - Facebook bỏ cả xô khi gặp 413 (Out of scope).
- Mở rộng giới hạn «kiểm trần chạy trước kiểm khoá»: phép kiểm thân phải là object (dòng 363) cũng chạy trước kiểm khoá. Thân `null` không kèm khoá nhận 400 thay vì 401. Tác động thấp vì API chỉ nghe ở 127.0.0.1.
- Harness E6 dựng 10 id trùng ở CUỐI state, còn 3 lượt cắt chỉ đẩy ra 60 id ở ĐẦU. Vì vậy vế should-NOT-fire «10 id từng trùng vẫn bị khử trùng» xanh cả trên bản vòng 1, và E6 chỉ phân biệt nhờ vế «state không còn id trùng». Cơ chế mất khử trùng thật (bản sao cũ bị cắt trong khi bản sao mới còn trong hàng) được ca đơn vị của ZCode trong E5 kiểm, cộng thăm dò của người chấm. Harness không kiểm cơ chế này.
