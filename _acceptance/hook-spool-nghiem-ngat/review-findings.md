# Review findings: hook-spool-nghiem-ngat (round 1)

Phạm vi đọc: `git diff origin/main...HEAD -- collector/` (handler.js +38/−17, hook-spool.test.ts +105) tại 1b3b28f.
Mọi phép thử chạy trên BẢN CHÉP handler trong thư mục tạm, HOME giả, collector/Kev giả trên 127.0.0.1 cổng ngẫu nhiên;
không chạm `~/.openclaw`, :9210, :8009, gateway hay launchctl, không chạy lệnh openclaw nào.

## Trong hợp đồng

(không có finding nào map được vào AC — E1–E11 đều đạt; xem evidence-report.md)

Đã soát và KHÔNG thấy lỗi ở các đường sau:
- Đường mất tin: không có đường mới. Tin chỉ rời spool khi collector trả 2xx (`rm`) hoặc 400/413/422 (`rename` sang
  rejected/); hết trần thì `break` TRƯỚC khi gửi tệp kế, không có tệp nào bị gửi dở rồi xoá.
- Đường gửi hai lần: không có đường mới. Tệp bị giữ vì 401/403/404 được gửi lại mỗi lượt, nhưng collector trả 401/404
  trước khi ingest (`server.ts:151`, `:329`) nên không có bản ghi trùng; trùng do timeout-sau-khi-đã-nhận là đường cũ
  của ZC6, collector tự dedup theo sourceId.
- Khoá sai: một lượt gọi collector cho mọi tệp tới trần 50 (phép thử: 60 tệp, 401 → 51 yêu cầu trong 68 ms, đúng một
  dòng `spool-held 401`, 61 tệp còn nguyên) — đúng mục Out of scope của hợp đồng.
- API gửi tin Zalo: handler chỉ có hai lệnh `fetch` — `${KEV}/v1/systemone` và `${API}/agent-report`; L1 grep 0 dòng khớp.

## Ngoài hợp đồng

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa.

- **408/429 không ghi dòng `spool-held`, trái chú thích của chính hàm xả**
  Người dùng thấy gì: Khi collector quá tải và trả 408 hoặc 429, log hook chỉ có các dòng `spool +1`, không dòng nào nêu mã lỗi, nên người trực Ops không biết vì sao tin đứng trong hàng đợi; tin không mất và tự xả khi collector lành.
  Căn cứ: Chú thích handler.js:78–79 nói «mọi 4xx khác (kể cả 408/429) là TẠM THỜI — giữ lại spool, log 'spool-held <status>'», nhưng điều kiện dòng 111 loại 408/429 nên chúng rơi xuống nhánh dừng-xả dòng 123–125 (`break`, không log); phép thử: 3 tệp spool, collector trả 408 rồi 429 → 0 dòng `spool-held`, log không chứa mã 408/429, lượt dừng ở tệp đầu. AC-5 chỉ đòi tin ở lại và xả được nên hợp đồng vẫn đạt; hành vi dừng ở 429 là hợp lý, sai là chú thích và thiếu dấu vết.
  file: `collector/openclaw/handler.js`
  severity: low
  Đề xuất: known-limits

- **Biến `ONEINVEST_HOOK_DRAIN_BUDGET_MS` đặt rỗng, 0 hoặc âm làm spool không bao giờ được xả**
  Người dùng thấy gì: Nếu ai đó đặt biến này rỗng hoặc bằng 0 trong môi trường gateway, mọi tin đã vào hàng đợi nằm im mãi dù collector lành (tin mới vẫn đi thẳng); đặt bằng chữ thì trần biến mất và lượt hook quay lại kéo dài như trước vòng này.
  Căn cứ: Dòng 86 `Number(process.env.ONEINVEST_HOOK_DRAIN_BUDGET_MS ?? 10_000)` không kiểm giá trị: `""`/`"0"`/`"-1"` cho trần ≤ 0 nên điều kiện dòng 99 `break` ngay tệp đầu, `"abc"` cho NaN nên phép so sánh luôn sai; phép thử 3 lượt collector lành: rỗng/0/−1 → còn 3/3 tệp, `abc` → xả hết nhưng không trần. Biến hiện không được đặt ở đâu ngoài test và harness nên xác suất thấp.
  file: `collector/openclaw/handler.js`
  severity: low
  Đề xuất: known-limits
