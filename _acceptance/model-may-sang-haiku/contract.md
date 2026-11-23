---
schema_version: 1
feature: Chuyển mọi agent làn Claude từ Qwen trên MTPLX sang Haiku 5.5 cloud (Anthropic thẳng, lùi sang Gateway), đổi model bằng cấu hình
slug: model-may-sang-haiku
owner: phanlemanh@gmail.com
risk_tier: T2
surfaces: [cli, db]
status: verified
design_doc: docs/superpowers/specs/2026-11-21-model-may-sang-haiku-design.md
veto_state:
veto_opened_at:
approved_by: Mạnh
approved_at: 2026-11-22
---

# Acceptance Contract: model-may-sang-haiku

## Context

Mạnh chốt 21/11 khoảng 06:29Z: «Dùng toàn bộ sang cloud model haiku 5.5, không mang sang». MTPLX (Qwen 27B local, cổng :8000) và Kev
không sang máy thu mới, cửa sổ chuyển dự kiến tối 24/11. Hàng này gỡ mọi đường làn Claude cần MTPLX. Đây là hàng nền: không ô nào
trên màn phải đổi; miễn điều kiện «số trên màn đổi», thay bằng AC-1 «không lời gọi nào tới :8000 khi chạy đủ bộ lệnh».

Ước chi đo trên DB máy thu 21/11 (giá Haiku trong `agent/config/doc-gop-s03.json`: 0,1 USD vào, 0,5 USD ra mỗi triệu token):

- `enrich-run`, lượt 00:00, `LIMIT` 50: `ai_calls` 30 ngày cho 67 lời gọi mỗi ngày, vào trung bình 509 token. Với ra 300 token
  (JSON không suy nghĩ) là khoảng 0,014 USD mỗi lượt; với trần ra của Qwen (p90 2.687) là khoảng 0,09 USD mỗi lượt.
- `judge-run`, chạy tay: 621 cặp đang chờ (558 `needs_llm` + 63 thẻ chờ), ước 450 token vào, 200 ra, khoảng 0,09 USD cho một lượt hết hàng.
- Bộ đếm token của Haiku khác Qwen; số trên là ước, số thật đo ở AC-8.

Đường gọi (Mạnh chọn 22/11 «(b) Anthropic thẳng», sau khi ví trả trước Gateway cạn 21/11 07:18Z, 130/130 lời gọi của lượt đo AC-8 bị từ chối,
không tốn tiền): model của agent có trường `duong` (một đường hay danh sách theo thứ tự thử: `anthropic`, `gateway`) và cờ `tu_lui`, cùng khuôn
và cùng ý nghĩa với `agent/config/doc-gop-s03.json` (bộ đọc gộp gọi thẳng Anthropic từ 15/11, 22.300 lời gọi tới 20/11). Bảng của kho: Haiku
`duong: ["anthropic", "gateway"]`, `tu_lui: true`. Mã model (trường `gateway`) là danh tính của đầu ra, không đổi theo đường; `ai_calls.model`
mang tiền tố đường (`anthropic:claude-haiku-5-5` / `gateway:anthropic/claude-haiku-5.5`). Giá khai một mức cho cả hai đường.

## Criteria

### AC-1 — Không lời gọi nào tới :8000
Given máy chủ giả ở cổng của `MTPLX_URL` đếm mọi yêu cầu và Gateway giả trả lời hợp lệ,
When chạy `enrich-run --offers` trên hai tin, `judge-run` trên một cặp, `nhan-bac-run --model haiku --thu`, `vlm-anh-run --model haiku --thu`, `npm run smoke`,
Then máy giả cổng MTPLX nhận 0 yêu cầu, máy giả của đường được chọn (Anthropic giả cho `enrich-run`, `judge-run`, smoke theo bảng của kho; Gateway giả cho nhãn bạc, đọc ảnh) nhận ít nhất một yêu cầu của mỗi lệnh; và mã sản xuất ở `agent/src`, `agent/scripts`, `pipeline/lib`, `scripts` không còn `MTPLX_URL`, `qwen27b`, `127.0.0.1:8000`, trừ danh sách loại trừ đóng: tệp test (`*.test.*`, `*.itest.*`) và `scripts/smoke-review-queue.mjs` (chữ trong dữ liệu giả của thẻ); probe in số tệp bị loại.

### AC-2 — Model của agent chọn bằng tệp cấu hình
Given `agent/config/model-agent.json` gán `enrich-text` và `judge-entity` cho một khoá model,
When đổi khoá ấy sang một model khác trong danh sách duyệt rồi chạy agent,
Then lời gọi mang mã của model mới mà mã agent không đổi; tệp thiếu, hỏng, mã model ngoài danh sách duyệt, `duong` sai hay agent không có khoá thì lệnh dừng trước lời gọi đầu, mã thoát 2, không ghi dòng nào.
Và với model `duong: ["anthropic", "gateway"]`: đường đầu trả lớp dừng (hết tiền, khoá sai) thì lời gọi ấy và các lời kế đi đường sau trong cùng trần, in đúng một dòng `chuyen-duong`; thiếu `ANTHROPIC_API_KEY` khi `tu_lui` tắt, hay thiếu khoá của mọi đường, thì dừng trước lời gọi đầu, mã thoát 5, 0 lời gọi; `ai_calls.model` mang tiền tố đường (`anthropic:` / `gateway:`).

### AC-3 — Cờ không giữ dữ liệu trên Gateway, đường thẳng không mang trường lạ
Given Gateway giả và Anthropic giả ghi thân yêu cầu,
When `enrich-text` và `judge-entity` gọi model qua từng đường,
Then mọi yêu cầu qua Gateway mang tuỳ chọn `zeroDataRetention: true` và `disallowPromptTraining: true`, đúng như hàm `tuyChonGui` của PL30; yêu cầu qua đường Anthropic thẳng chỉ có các khoá `model`, `system`, `messages`, `max_tokens`, `temperature` (API Anthropic không có cờ theo lời gọi tương đương — cùng chế độ bộ đọc gộp đang dùng, Mạnh chấp nhận cho hai agent này 22/11).

### AC-4 — Chỉ gửi đúng các trường đã kê
Given DB thử có hai tin S03 mang tên người bán, SĐT người bán và tên nhóm cấy vào các cột ngoài chữ bài, và một cặp ghép căn của chúng,
When `enrich-run --offers` và `judge-run` đọc dữ liệu thật qua truy vấn của chính chúng (`OFFER_SELECT`, `queryPair`) rồi gọi máy giả của đường theo bảng của kho,
Then thân yêu cầu của enrich chỉ chứa chữ bài (tối đa 500 ký tự) và khối bối cảnh suy từ tên nhóm; thân yêu cầu của judge chỉ chứa các trường kê ở design doc (giá, diện tích, giá/m², phường, loại hình, mã nguồn, chữ bài hay tiêu đề tối đa 200 ký tự, kết luận và lý do của luật); tên và SĐT người bán không xuất hiện ngoài chữ bài; đối chứng: chính chữ bài cấy xuất hiện nguyên văn.

### AC-5 — Trần tiền mỗi lượt
Given `enrich-run` hoặc `judge-run` chạy với `--tran-usd` nhỏ hơn chi phí của tập,
When lời gọi kế có thể đẩy tổng chi vượt trần,
Then lệnh dừng trước lời gọi ấy, thoát mã 4, dòng tổng kết nêu đã chi và trần; trần cộng chi phí của mọi đường; mỗi lời gọi đã chạy có một dòng `ai_calls` mang `<đường>:<mã gọi>` và số token vào, ra.

### AC-6 — Nhãn bạc và đọc ảnh không còn backend Qwen
Given `nhan-bac-run` và `vlm-anh-run`,
When gọi với `--model qwen`,
Then lệnh thoát mã 2 với lời «model không được duyệt», 0 lời gọi model, 0 dòng ghi; `--model haiku` vẫn chạy như trước.

### AC-7 — Kiểm lô thật đọc ảnh thôi đòi Qwen
Given `kiemLoThat` của `pipeline/lib/vlm-anh.mjs`,
When tập đọc có ít nhất một dòng tốt của Haiku và không có dòng Qwen nào,
Then không có lý do chưa đạt nào về model; tập không có dòng tốt nào của bất kỳ model nào thì có lý do «chưa có dòng model tốt».

### AC-8 — Đầu ra trước và sau trên mẫu cố định
Given mẫu viết trước `mau-enrich.json` (100 tin có đề xuất `e2_llm` cũ của Qwen) và `mau-judge.json` (30 cặp ghép căn đang chờ), chọn theo băm `offer_id`,
When chạy Haiku theo bảng của kho (đường thẳng trước) trên mẫu ở chế độ chỉ đọc (không ghi đề xuất, không ghi thẻ), trần 1 USD, sau khi Cổng Phạm vi đã duyệt,
Then `so-truoc-sau.md` có: cỡ mẫu, tỉ lệ JSON đọc được, tỉ lệ trùng giá trị với Qwen theo từng trường (loại hình, phòng ngủ, phòng tắm, đường, dự án, toà), tỉ lệ cặp có lời giải thích hợp lệ, số cặp kết luận luật đổi, số tiền đã chi; đạt khi JSON đọc được ≥ 95 %, lời giải thích hợp lệ ≥ 95 %, kết luận luật đổi 0, chi ≤ 1 USD và máy giả cổng MTPLX nhận 0 yêu cầu. Tỉ lệ trùng từng trường với Qwen là số báo cho người đọc, không phải ngưỡng: Qwen không phải đáp án đúng.

### AC-10 — Đường ghi đề xuất chạy với đầu ra dạng Haiku
Given DB thử có 5 tin S03 thiếu trường và máy giả của đường trả đúng các đầu ra thô dạng Haiku viết trước (có cả JSON bọc trong khối mã),
When chạy `enrich-run --offers` trên 5 tin,
Then số dòng `enrichment_proposals` nguồn `e2_llm` ghi ra và số đề xuất được `apply_enrichment` áp bằng đúng số kỳ vọng viết trước; cột `model` của đề xuất mang mã model (`anthropic/claude-haiku-5.5`, không đổi theo đường); đầu ra không đọc được ghi đúng lỗi như trước, không ghi đề xuất.

### AC-9 — Hồi quy
Given cây sau khi sửa,
When chạy `feature_loop.suite_keys`,
Then tất cả thoát 0.

## Coverage

Bảng phủ ca ở design doc (mục «Bảng phủ ca»), đếm trên main 3c529c0b4 và DB máy thu: chỗ gọi (enrich-text · judge-entity · nhãn bạc · đọc
ảnh · kiểm lô ảnh · router model · smoke · báo cáo ngày) × chiều (model chọn · đường gọi · dữ liệu gửi · cờ Gateway · tiền · lỗi cấu hình · người
đọc đầu ra). Core → AC-1…AC-8, AC-10 (AC-10 phủ trục «người đọc đầu ra» của enrich). Later: dòng giá Haiku trong `ai_model_prices`. Never: Kev
và hook S03 (làn thu). Quét hình thái bỏ: xem dòng sổ `descope` «bỏ coverage-scan».

## Out of scope

- Kev trong hook S03 `collector/openclaw/handler.js`, bộ canh, `docs/ops/runtime-map.md`, dò `kev` ở `pipeline/push-ops-facts.mjs`, plist `kev-gate`: làn thu, đi cùng việc gỡ Kev.
- `pipeline/scripts/bench-extraction.mjs` (Ollama, không phải MTPLX) và chữ «qwen27b» trong dữ liệu giả của `scripts/smoke-review-queue.mjs`.
- Bộ lọc `mtplx:%` ở `scripts/bao-cao-ngay.mjs` giữ nguyên (cửa sổ 7 ngày còn dòng cũ).
- Thêm dòng giá Haiku vào `ai_model_prices`.

## Notes
