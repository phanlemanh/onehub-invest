---
schema_version: 1
feature: Đọc gộp S03 và nháp nhãn PL35 có thêm đường gọi Haiku thẳng API Anthropic song song Vercel AI Gateway (thứ tự và tự lùi bằng bảng chọn), ghi rõ lỗi nhà cung cấp và dừng sớm khi hết tiền
slug: goi-thang-anthropic
owner: phanlemanh@gmail.com
risk_tier: T2
surfaces: [cli]
status: approved
design_doc: docs/superpowers/specs/2026-11-15-goi-thang-anthropic-design.md
approved_by: Mạnh
approved_at: 2026-11-15
---

# Acceptance Contract: goi-thang-anthropic

## Context

Lời Mạnh 15/11, gửi qua phiên giám sát:
- «Hiện nay tôi đang có 200 usd api credit từ claude platform. Tôi muốn dùng nó thay cho Vercel Gate Way».
- Đính chính ngay sau đó: «Đúng hơn là tận dụng chứ không thay thế vercel AI gateway».

Từ 19:14Z 12/11, ví trả trước của Vercel AI Gateway rỗng. Gateway trả HTTP 402 `insufficient_funds`; SDK gói lỗi này thành
`GatewayInternalServerError`. Vì thế bước đọc gộp S03 hằng đêm hỏng 100% suốt ba đêm, còn sổ `ai_calls` chỉ ghi tên lớp lỗi nên trông
như máy chủ hỏng.

Hồ sơ này GIỮ NGUYÊN đường Gateway: không gỡ, không đổi hành vi. Nó làm bốn việc:
- **Thêm đường gọi thẳng.** Haiku có thêm đường gọi thẳng API Anthropic để tận dụng credit. Hai đường song song, thứ tự thử khai bằng
  `agent/config/doc-gop-s03.json`; mặc định Anthropic trước, Gateway sau.
- **Tự lùi.** Khoá `tu_lui` quyết việc này: đường đang dùng gặp lớp hết tiền / khoá sai, hoặc thiếu khoá, thì lùi sang đường kế trong
  cùng trần ngày 20 USD và ghi dòng `chuyen-duong`; tắt thì dừng và báo. Cách chọn ở Hỏi-2.
- **Ghi đường gọi vào `ai_calls`.** Cột `ai_calls.model` mang tiền tố đường; cột `loi` ghi mã HTTP và kiểu lỗi của nhà cung cấp.
- **Dừng sớm.** Đường cuối cùng gặp lớp hết tiền thì dừng cả lượt.

GLM và DeepSeek chỉ đi Gateway. Danh sách model vẫn đóng ở ba mã đã duyệt (AGENTS.md luật 6).

**Điểm xong — số trên màn, đo sau gộp, không chấm ở S4.**

Ba việc phải xong trước:
1. PR gộp vào main.
2. `npm ci` trong `agent/` của checkout chính. Kiểm bằng
   `(cd agent && node -e "require.resolve('@anthropic-ai/sdk')")`: thoát 0 là có gói. Thiếu gói thì bước đêm chết ngay lúc nạp mô-đun.
3. Mạnh thêm `ANTHROPIC_API_KEY` vào `.env` của máy thu.

Chạy bù khi xa 00:00 giờ VN, xong trước 16:30Z.

Đo `--thu` ngay trước khi chạy và ghi lại số nền. Số đo 06:2xZ ngày 15/11 là: 11/11 8 · 12/11 1.594 · 13/11 179 · 14/11 734, tổng 2.515,
ước 2,73 USD.

```bash
for d in 2026-11-11 2026-11-12 2026-11-13 2026-11-14; do (cd agent && node --env-file=../.env --import tsx scripts/doc-gop-s03.ts hang-ngay --ngay $d --thu | head -1); done
for d in 2026-11-11 2026-11-12 2026-11-13 2026-11-14; do (cd agent && node --env-file=../.env --import tsx scripts/doc-gop-s03.ts hang-ngay --ngay $d --tran-ngay-usd 20); done
```

Lặp lệnh thứ hai cho tới khi `can goi` của các ngày không giảm nữa. Đếm phần dư theo lớp lỗi:

```sql
SELECT split_part(loi, ':', 1) lop, count(*) FROM ai_calls WHERE viec = 'doc-gop-s03' AND trace LIKE 'pl34-2026-11-15-%' AND NOT ok GROUP BY 1;
```

Kỳ vọng:
- `can goi` của từng ngày giảm từ số nền về phần dư, phần dư chỉ gồm JSON hỏng và lỗi 4xx của bài lẻ.
- Không có dòng `het-tien` hay `khoa`.
- Chi ≈ 2,7 USD, dưới trần 20 USD/ngày.
- U1 chạy được Hỏi-2 PL35: `label-nhap-ghep` ghi nháp lên lát `hai-khu-ghep`, số lời gọi lớn hơn 0, `het_tien` không bật.

Có dòng `het-tien` hay `khoa`, hoặc số chi lệch xa số ước: dừng và báo, không tự sửa cho khớp.

## Criteria

- AC-1: Given `agent/config/doc-gop-s03.json` của PR, When nạp bằng `napCauHinh` và `keHoach`, Then:
  - nhóm Haiku mang `duong: ["anthropic", "gateway"]` (mã gọi thẳng `claude-haiku-5-5`), kế hoạch `tuLui = true`;
  - nhóm GLM, DeepSeek (nếu có ô) mang `duong: ["gateway"]`;
  - đường lặp, đường rỗng, hay `tu_lui` không phải true/false bị từ chối;
  - `MODEL_DUYET` vẫn đúng ba mã cũ;
  - bảng chọn đặt `duong: "anthropic"` cho GLM hay DeepSeek, hoặc `duong` lạ, bị `kiemCauHinh` từ chối kèm thông điệp gọi tên model;
  - bản chép của pipeline (`label-nhap-ghep.mjs`) khớp agent cả danh sách lẫn bảng đường.
- AC-2: Given bảng chọn Haiku đi đường anthropic và một máy chủ Anthropic giả (`ANTHROPIC_BASE_URL`), When đọc gộp một bài có chữ và hai
  ảnh, Then:
  - đúng một `POST /v1/messages`, model `claude-haiku-5-5`, `max_tokens` 8000;
  - header `Authorization: Bearer <ANTHROPIC_API_KEY lúc gọi>`;
  - thân lời gọi KHÔNG có `temperature` và KHÔNG có `thinking`;
  - `system` là hướng dẫn đọc gộp;
  - nội dung người dùng theo đúng thứ tự: chữ, «Ảnh 1:», ảnh base64, «Ảnh 2:», ảnh base64;
  - không có lời gọi nào tới Gateway.

  Cùng lượt đó, với bảng chọn giao một ô cho GLM, lời gọi GLM vẫn đi Gateway kèm cờ không giữ dữ liệu.
- AC-3: Given lời gọi thẳng của AC-2 trả JSON đủ 17 ô và usage (5.000 vào, 900 ra), When ghi nhãn, Then:
  - dòng `silver_labels` mang `model = 'gateway:anthropic/claude-haiku-5.5'` như trước, `probabilities.duong = 'anthropic'`;
  - `cost_usd = (5000×0,10 + 900×0,50)/1e6 = 0,00095`;
  - dòng `ai_calls` mang tiền tố đường `model = 'anthropic:claude-haiku-5-5'` (lời gọi qua Gateway vẫn ghi `gateway:anthropic/claude-haiku-5.5`), `ok = true`;
  - chạy lại thì bài không bị gọi lại.
- AC-4: Given một model không còn đường nào có khoá (bảng tự lùi: vắng khoá của mọi đường của nó; bảng không tự lùi: vắng khoá của
  đường đầu), When chạy `doc-gop-s03 hang-ngay` (không `--thu`), `chay` hoặc `cham`, Then:
  - lệnh thoát 5 trước khi nối DB và trước lời gọi đầu;
  - stderr có từng dòng `THIEU KHOA <biến>` cho mọi khoá còn vắng.

  Với bảng tự lùi của kho, chỉ có `AI_GATEWAY_API_KEY` là đủ: lệnh không thoát 5. Với đường anthropic, client không rơi về hồ sơ `ant auth login` trên đĩa:
  khoá truyền tường minh.
- AC-5: Given lỗi thật do SDK dựng từ máy chủ giả, When phân lớp, Then `ai_calls.loi` (≤ 80 ký tự, không chứa message hay responseBody)
  ra đúng chuỗi cho từng ca:

  | Ca | `ai_calls.loi` |
  |---|---|
  | Anthropic 401 | `khoa:401:authentication_error:AuthenticationError` |
  | Anthropic 402 | `het-tien:402:billing_error:` + tên lớp |
  | Anthropic 400 «credit balance is too low» | `het-tien:400:credit_balance:BadRequestError` |
  | Anthropic 400 khác | `khac:400:invalid_request_error:BadRequestError` |
  | Anthropic 429 | `han-muc:429:rate_limit_error:RateLimitError` |
  | Anthropic 529 | `may-chu:529:overloaded_error:` + tên lớp |
  | timeout | `het-gio:-:-:` + tên lớp |
  | Gateway 402 `insufficient_funds` | `het-tien:402:insufficient_funds:GatewayInternalServerError` |
  | Gateway 500 | `may-chu:500:` + kiểu + tên lớp |

  JSON hỏng vẫn ghi `json-hong`.
- AC-6: Given lượt `hang-ngay` (và `chay`) có ba bài và lời gọi đầu gặp lớp `het-tien` (đường anthropic 402, hoặc Gateway 402), When chạy,
  Then:
  - đúng 1 lời gọi rồi dừng, 1 dòng `ai_calls`, 0 nhãn ghi;
  - lệnh thoát 4, stderr có `JOB FAIL [doc-gop-s03] het-tien: <đường> 402 <kiểu>`.

  Lớp `khoa` (401) cũng dừng sau lời gọi đầu, thoát 1, stderr có `JOB FAIL [doc-gop-s03] khoa`.

  Lớp `han-muc` (429) KHÔNG dừng lượt: 3 lời `hoiGop`, tức 9 yêu cầu HTTP (SDK tự thử lại 2 lần), lượt chạy hết.

  Khi dừng sớm, tóm tắt `pl34` vẫn được in và mang `dung` cùng `con_lai`. Lệnh `cham` cũng dừng ở lớp dừng.

  Các ca trên dùng bảng một đường. Với bảng tự lùi hai đường (Anthropic rồi Gateway):
  - Anthropic 402 ở bài đầu: một dòng stderr `JOB WARN [doc-gop-s03] chuyen-duong: anthropic/claude-haiku-5.5 anthropic -> gateway
    (het-tien:402:billing_error…)`. Bài đó và hai bài còn lại đọc qua Gateway: 3 nhãn, nhãn mang `probabilities.duong = 'gateway'`. Sổ
    `ai_calls` có 1 dòng `anthropic:…` và 3 dòng `gateway:…`. Mã 0, tóm tắt có `chuyen_duong`.
  - Vắng `ANTHROPIC_API_KEY`: lùi ngay từ đầu, dòng `chuyen-duong … (thieu-khoa ANTHROPIC_API_KEY)`, 0 yêu cầu tới Anthropic.
  - Cả hai đường cạn tiền: một lời mỗi đường rồi dừng, mã 4, `JOB FAIL [doc-gop-s03] het-tien: gateway 402 …`.
- AC-7: Given bước đêm và bước cloud-sync, When con `doc-gop-s03` thoát 4, Then:
  - `pipeline/doc-gop-hang-ngay.sh` bỏ bước hôm kia (đúng 1 lần gọi `hang-ngay`) và thoát 4. Thoát 5 (thiếu khoá) cũng bỏ bước hôm kia
    và thoát 5;
  - `pipeline/mau-soat-cuon-chieu.mjs` (qua `goiDocGopThat`) dừng, in `JOB FAIL [cloud-sync] bước mau-soat-cuon-chieu het-tien` và thoát 4.

  Khi con thoát 3 (chạm trần), hai bước giữ hành vi cũ.
- AC-8: Given nháp nhãn PL35 (`label-nhap-ghep.mjs`) theo bảng chọn của kho và máy chủ Anthropic giả, When nháp một lát, Then:
  - với bảng tự lùi: Anthropic hết tiền thì in dòng `JOB WARN [label-nhap-ghep] chuyen-duong: … anthropic -> gateway (het-tien)`, bài đó
    và các bài sau đi Gateway, không đếm lỗi; vắng `ANTHROPIC_API_KEY` thì lùi từ đầu;
  - với tác tử một đường anthropic:
  - lời gọi đi `POST /v1/messages`, model `claude-haiku-5-5`, khoá lấy từ `ANTHROPIC_API_KEY`;
  - thiếu khoá thì ném lỗi gọi tên `ANTHROPIC_API_KEY`;
  - thân lời gọi không có `temperature`, không có `thinking`, `max_tokens` 600, có `system` nháp ba ô;
  - máy chủ trả 402, hoặc 400 «credit balance is too low», ở bài đầu thì lát dừng ngay: 1 lời gọi, kết quả mang `het_tien: true`, không
    ghi nháp, lệnh thoát 4 kèm `JOB FAIL [label-nhap-ghep] het-tien`;
  - Gateway 402 `insufficient_funds` cũng là hết tiền.
- AC-9: Given đỉnh PR, When chạy bộ test agent và hai nửa bộ test pipeline, `node scripts/product-map.mjs --root . --check` và lưới
  trước-merge, Then cả bốn xanh. Lưới trước-merge không có VIOLATION nào ngoài các dòng chờ ký của chính hồ sơ này.

## Coverage

Quét theo bảng phủ ca của thiết kế (đường × model × cách hỏng):

- **Đường × model.**
  - anthropic × Haiku: AC-2, AC-3.
  - gateway × GLM: AC-2.
  - anthropic × GLM/DeepSeek: AC-1 (bảng chọn từ chối).
  - gateway × Haiku vẫn khai được: AC-1.
  - Haiku hai đường, tự lùi khi hết tiền / thiếu khoá, cả hai cạn: AC-6, AC-8.
- **Cách hỏng.**
  - Thiếu khoá: AC-4, AC-8.
  - 401, 402, 429, 5xx, timeout: AC-5, AC-6.
  - JSON hỏng: AC-5, giữ bằng ca cũ của PL30.
  - 402 qua Gateway: AC-5, AC-6.
- **Người đọc phía sau.**
  - `cost_usd` và trần ngày: AC-3 (bộ đọc trần không đổi).
  - `silver_labels.model`, dò đã đọc, khoá mau-soat: AC-3.
  - Thẻ Ops nối giá theo `ai_calls.model`: AC-3.
  - Bước đêm, cloud-sync: AC-7.
  - Nháp PL35: AC-8.
- **Đường thật.** Điểm xong ở Context, đo sau gộp. [CE chưa kiểm chứng trước gộp: máy thu chưa có khoá]

## Out of scope

- Chuyển `agent/src/agents/nhan-bac-s03.ts` / `runtime/models.ts`, `agent/src/agents/vlm-anh-s03.ts` và
  `agent/scripts/doc-gop-3-model-s03.ts` sang đường thẳng. Đó là công cụ đo và chạy tay, không nằm trên đường găng; nếu cần thì mở hàng
  riêng.
- Sửa `scripts/cloud-sync.sh` (t3_paths). Dừng sớm của bước mau-soat nằm ở `mau-soat-cuon-chieu.mjs`.
- Bộ cảnh báo bám dòng `JOB FAIL … het-tien`, thuộc việc vận hành ổn định.
- Bậc giá Haiku vượt 100K token prompt: thẻ lớn nhất vẫn dưới ngưỡng.
- Đặt khoá vào `.env` máy thu: việc của Mạnh. Chạy bù thật: sau gộp, theo lệnh ở Context.
- Ghi `ai_calls` cho nháp PL35: hiện trạng không ghi, không đổi.
- Tách bộ đo DO1 theo đường gọi: nhãn đã mang `probabilities.duong`, đủ để tách sau.

## Notes
