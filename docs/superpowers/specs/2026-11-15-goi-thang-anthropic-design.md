# Gọi thẳng Anthropic cho Haiku (goi-thang-anthropic) — thiết kế

Ngày 15/11/2026 · T2 · giao bởi phiên giám sát đợt dot0-cam-mau theo lời Mạnh 15/11: «Hiện nay tôi đang có 200 usd api credit từ
claude platform. Tôi muốn dùng nó thay cho Vercel Gate Way».

## Vấn đề

Ví trả trước của Vercel AI Gateway cạn từ 19:14Z 12/11. Gateway trả HTTP 402 `insufficient_funds`, còn SDK của Gateway gói lỗi đó thành
`GatewayInternalServerError` (statusCode 402 vẫn còn trên lỗi, kiểu `insufficient_funds` thì mất). Hậu quả:
- Bước đọc gộp S03 hằng đêm (`pipeline/doc-gop-hang-ngay.sh` → `doc-gop-s03 hang-ngay`) hỏng 100% suốt ba đêm.
- Cột `ai_calls.loi` chỉ ghi tên lớp `GatewayInternalServerError`, nên trông như lỗi máy chủ chứ không như hết tiền.
- Mỗi đêm lượt chạy vẫn bắn hết vài nghìn lời gọi hỏng.

Ngày 15/11 lúc 06:2xZ, đếm bằng `hang-ngay --thu` (chỉ đọc) ra số bài còn chờ đọc:

| Ngày bài | Bài cần gọi | Ước USD |
|---|---|---|
| 11/11 | 8 | 0,0088 |
| 12/11 | 1.594 | 1,7405 |
| 13/11 | 179 | 0,1888 |
| 14/11 | 734 | 0,7905 |
| **Cộng** | **2.515** | **2,73** |

## Hướng

1. **Đường gọi là một trường của bảng chọn.** Trong `agent/config/doc-gop-s03.json`, mỗi model có thêm `duong: "anthropic" | "gateway"`
   (vắng thì là `gateway`). Haiku đặt `duong: "anthropic"`; GLM và DeepSeek vẫn đi Gateway. Đổi đường lần sau chỉ cần sửa tệp này, đúng
   tinh thần PL30.
2. **Mã model giữ nguyên làm danh tính.** Dòng nhãn bạc vẫn ghi `gateway:anthropic/claude-haiku-5.5`, `ai_calls.model` cũng vậy. Ba bên
   đọc phía sau dùng chuỗi này làm khoá và nhờ thế không đổi gì:
   - bộ dò «đã đọc» của `hang-ngay` và `chay`;
   - khoá cách đọc của `mau-soat-cuon-chieu`, cùng nháp PL35;
   - phép nối giá `ai_model_prices` của thẻ Ops `/ops/ai-calls`.

   Đường gọi thật ghi vào `silver_labels.probabilities.duong`.
3. **Danh sách đóng đổi tên cho đúng nghĩa.** `GATEWAY_DUYET` đổi thành `MODEL_DUYET`: vẫn ba mã đã duyệt ở AGENTS.md luật 6. Thêm bảng
   `DUONG_ANTHROPIC`, ánh xạ mã model sang mã gọi thẳng; hiện chỉ có `anthropic/claude-haiku-5.5` → `claude-haiku-5-5`. Bảng chọn đặt
   `duong: "anthropic"` cho model không có trong bảng ánh xạ thì bị từ chối, lệnh thoát 2 trước lời gọi đầu.
4. **Gói gọi.** Dùng SDK chính chủ `@anthropic-ai/sdk`, ghim bản 1.3.0 (phát hành 23/10, đã quá hai tuần). Theo skill claude-api: SDK
   chính chủ là mặc định cho TypeScript, không dùng shim. Bản pipeline (`label-nhap-ghep.mjs`) mượn SDK từ `agent/node_modules` bằng
   `createRequire`, theo cùng lối «mượn `pg` từ `app/`» của `scripts/`, nên không thêm phụ thuộc vào pipeline.
5. **Khoá.** Mỗi lời gọi đọc `ANTHROPIC_API_KEY` từ môi trường và truyền tường minh vào client. Không để SDK tự rơi về hồ sơ
   `ant auth login` trên đĩa. Agent không cầm khoá, không đọc `.env`; Mạnh tự thêm dòng khoá vào `.env` của máy thu, còn lệnh nạp tệp đó
   bằng `--env-file` như nay. Khi kế hoạch gọi cần một khoá vắng mặt, lệnh **thoát 5** với một dòng `THIEU KHOA <TÊN BIẾN>`, chưa nối DB
   và chưa gọi model nào. Mã 5 dùng chung cho mọi khoá, kể cả `AI_GATEWAY_API_KEY`; trước đây thiếu khoá thoát 2, cùng mã với đầu vào sai.
6. **Tham số lời gọi thẳng.** `max_tokens` giữ 8000, timeout 240 giây, `maxRetries: 2` (SDK tự thử lại 429, 5xx và lỗi kết nối).
   **Không** gửi `temperature`: Haiku 5.5 trả 400 với giá trị lấy mẫu khác mặc định. Đây là một chỗ KHÁC đường Gateway, vốn gửi
   `temperature: 0`. Nhãn hai đường phân biệt được qua `probabilities.duong`. Không gửi `thinking`, để giữ mặc định của Haiku 5.5 (suy
   nghĩ thích ứng, nỗ lực `medium`) như khi đi Gateway không kèm tuỳ chọn suy nghĩ. Ảnh gửi dạng `image` base64, chữ gửi dạng `text`, giữ
   đúng thứ tự của `tinNhan()`.
7. **Giá.** Haiku 5.5 trên API Anthropic: 0,10 USD vào / 0,50 USD ra mỗi triệu token khi prompt tới 100K token, 0,50 / 2,50 USD khi vượt.
   Nguồn: skill `claude-api`, bảng «Current Models (cached: 2026-11-03)». Bảng chọn đang ghi đúng `gia_vao 0.1 · gia_ra 0.5`. Lời gọi thẳng
   không có `providerMetadata.gateway.cost`, nên `cost_usd` tính bằng token nhân giá bảng. Trần ngày `DOC_GOP_TRAN_NGAY_USD` cộng
   `cost_usd` như cũ. Thẻ bài lớn nhất (chữ cộng tối đa ảnh của `TRAN_ANH`) vẫn dưới 100K token, nên mức giá thứ hai ngoài phạm vi.
8. **Phân lớp lỗi** (`agent/src/runtime/loi-nha-cung-cap.ts`, dùng chung cho hai đường):
   - `het-tien`: HTTP 402, hoặc kiểu lỗi `billing_error` / `insufficient_funds`. Với lỗi Gateway, kiểu gốc được đọc lại từ
     `cause.responseBody`.
     Ca API Anthropic báo hết credit bằng 400 `invalid_request_error` kèm câu «credit balance is too low» cũng vào lớp này, kiểu ghi
     `credit_balance`. Câu chỉ dùng để so mẫu, không chép vào sổ. Đây là phát hiện P0 của gap-probe.
   - `khoa`: 401 / 403.
   - `han-muc`: 429.
   - `may-chu`: 5xx, kể cả 529.
   - `het-gio`: lỗi thời gian hoặc hủy.
   - `mang`: lỗi kết nối.
   - `khac`: còn lại.

   `ai_calls.loi` có dạng `<lớp>:<http|->:<kiểu|->:<tên lớp>`, cắt ở 80 ký tự theo ràng buộc CHECK của migration 052. Chỉ chép mã và kiểu;
   không chép message hay responseBody.
9. **Dừng sớm.**
   - Lớp `het-tien`: lượt `chay` / `hang-ngay` dừng ngay sau lời gọi hỏng đầu tiên, in ra stderr
     `JOB FAIL [doc-gop-s03] het-tien: <đường> <http> <kiểu>` rồi **thoát 4**.
   - Lớp `khoa`: dừng sớm như trên, in `JOB FAIL [doc-gop-s03] khoa: …`, thoát 1 (khoá sai thì mọi lời gọi đều hỏng).
   - Hai lệnh đi theo:
     - `pipeline/doc-gop-hang-ngay.sh`: bước hôm qua thoát 4 thì bỏ bước hôm kia.
     - `pipeline/mau-soat-cuon-chieu.mjs`: con `doc-gop-s03 chay` thoát 4 thì in
       `JOB FAIL [cloud-sync] bước mau-soat-cuon-chieu het-tien` và thoát 4, không làm tiếp.
   - `label-nhap-ghep.mjs` (nháp PL35) dừng lát ngay ở lời gọi hết tiền đầu tiên, báo `het_tien: true`.

10. **Tư thế dữ liệu (gap-probe P1).** Đường Gateway gửi cờ `zeroDataRetention: true, disallowPromptTraining: true`. Đường thẳng không có
    cờ theo lời gọi tương đương, nên dữ liệu lưu theo chính sách mặc định của API Anthropic cho tổ chức của Mạnh, trừ khi tổ chức đã có
    thoả thuận ZDR. Chữ bài, ảnh, tên nhóm vẫn được gửi nguyên văn như AGENTS.md luật 6 cho phép với Haiku. Đây là câu chỉ Mạnh quyết
    (Hỏi-1 trong sổ), trình ở Cổng Phạm vi.

## Bảng phủ ca

Đường × model × cách hỏng → hành vi + dòng `ai_calls`. Ô «—» là tổ hợp không tồn tại: bảng chọn từ chối, lệnh thoát 2.

| Đường | Model | Cách hỏng | Hành vi | `ai_calls` |
|---|---|---|---|---|
| anthropic | Haiku | thiếu `ANTHROPIC_API_KEY` | thoát 5, `THIEU KHOA ANTHROPIC_API_KEY`, 0 lời gọi, 0 nối DB | không dòng nào |
| anthropic | Haiku | 401 | dừng sớm, thoát 1, `JOB FAIL … khoa` | 1 dòng `khoa:401:authentication_error:AuthenticationError` |
| anthropic | Haiku | 402 hết tiền | dừng sớm, thoát 4, `JOB FAIL … het-tien` | 1 dòng `het-tien:402:billing_error:…` |
| anthropic | Haiku | 429 | SDK thử lại 2 lần; vẫn hỏng thì bỏ bài (đêm sau gọi lại), lượt chạy tiếp | `han-muc:429:rate_limit_error:RateLimitError` |
| anthropic | Haiku | 5xx / 529 | như 429 | `may-chu:529:overloaded_error:…` |
| anthropic | Haiku | JSON hỏng | ghi nhãn `json_ok=false` như nay | `json-hong` |
| anthropic | Haiku | timeout | bỏ bài, lượt chạy tiếp | `het-gio:-:-:APIConnectionTimeoutError` |
| gateway | Haiku · GLM · DeepSeek | thiếu `AI_GATEWAY_API_KEY` | thoát 5, `THIEU KHOA AI_GATEWAY_API_KEY` | không dòng nào |
| gateway | Haiku · GLM · DeepSeek | 402 `insufficient_funds` | dừng sớm, thoát 4, `JOB FAIL … het-tien` | `het-tien:402:insufficient_funds:GatewayInternalServerError` |
| gateway | Haiku · GLM · DeepSeek | 401, 429, 5xx, JSON hỏng, timeout | cùng lớp và cùng hành vi như đường anthropic | cùng khuôn |
| anthropic | GLM · DeepSeek | — | bảng chọn từ chối: «không có đường anthropic», thoát 2 | — |

**Người đọc phía sau.**
- `silver_labels.cost_usd`: tính bằng token × giá bảng (0,10 / 0,50). Trần ngày PL34 đọc `cost_usd`, không đổi.
- `silver_labels.model`: không đổi. Bộ dò «đã đọc», khoá cách đọc của mau-soat và nháp PL35 không đổi.
- `ai_calls.model`: không đổi, nên phép nối giá của thẻ Ops vẫn ra số.
- `ai_calls.loi`: khuôn mới, ≤ 80 ký tự. Thẻ Ops hiện chỉ đếm `ok`, không đọc `loi`.
- Dòng `JOB FAIL … het-tien`: là cái móc cho cảnh báo sau này bám vào. Không bộ cảnh báo nào bám nó trong lát này.

## Ngoài phạm vi (vì sao)

- Ba chỗ khác còn gọi Haiku qua Gateway: `agent/src/agents/nhan-bac-s03.ts` (qua `runtime/models.ts`), `agent/src/agents/vlm-anh-s03.ts`
  và `agent/scripts/doc-gop-3-model-s03.ts`. Đó là công cụ đo và chạy tay, không nằm trên đường găng (bước đêm và PL35). Mỗi chỗ có
  khuôn gọi riêng (`experimental_evaluate`, so ba model), nên chuyển sang thì thành một hàng riêng.
- Sửa `scripts/cloud-sync.sh`: thuộc `t3_paths`. Dừng sớm của bước mau-soat nằm ở chính `mau-soat-cuon-chieu.mjs` (mã thoát 4 cùng dòng
  `JOB FAIL`), nên `cloud-sync.sh` không phải đổi.
- Bộ cảnh báo bám dòng `het-tien` (issue riêng tư, dead-man): đã nằm trong việc «vận hành ổn định», không thuộc lát này.

## Điểm xong (số trên màn)

Sau khi gộp vào main, `npm ci` trong `agent/` của checkout chính, và Mạnh đã đặt khoá:

```bash
for d in 2026-11-11 2026-11-12 2026-11-13 2026-11-14; do (cd agent && node --env-file=../.env --import tsx scripts/doc-gop-s03.ts hang-ngay --ngay $d --tran-ngay-usd 20); done
```

Kỳ vọng:
- `can_goi` của từng ngày đo lại bằng `hang-ngay --thu` giảm từ 8 / 1.594 / 179 / 734 (tổng 2.515) về 0, chỉ còn lại số bài JSON hỏng.
- Tổng chi ≈ 2,7 USD, dưới trần 20 USD/ngày.
- Nháp PL35 (Hỏi-2 của U1) chạy được.
