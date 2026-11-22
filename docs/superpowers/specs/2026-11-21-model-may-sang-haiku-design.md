# MH1 model-may-sang-haiku — design

Ngày 2026-11-21 · dãy P3 · hạng T2 · căn cứ: Mạnh chốt 21/11 khoảng 06:29Z (phiên MT, GS chép lại khi giao hàng): «Dùng toàn bộ
sang cloud model haiku 5.5, không mang sang». MTPLX và Kev không sang máy thu mới; cửa sổ chuyển dự kiến tối 24/11.

## Kết quả

Không còn đường chạy nào của làn Claude cần MTPLX :8000. Mọi agent làn Claude từng gọi Qwen 27B local nay gọi Haiku 5.5 qua
Vercel AI Gateway, chọn model bằng một tệp cấu hình, có trần tiền mỗi lượt, có cờ Gateway không giữ dữ liệu, không huấn luyện.

Đây là hàng nền: không ô nào trên màn phải đổi. Điều kiện «số trên màn đổi» được miễn; thay bằng «không lời gọi nào tới :8000 khi
chạy đủ bộ lệnh» (AC-1).

## Bảng phủ ca (đếm trên main 3c529c0b4 và DB máy thu, 21/11)

| Chỗ gọi | Chạy khi nào (đo) | Dữ liệu rời máy | Ai đọc đầu ra phía sau | Đổi gì |
|---|---|---|---|---|
| `agent/src/agents/enrich-text.ts` (`model: "qwen27b"`) qua `agent/scripts/enrich-run.ts` | Bước `enrich-run` của lượt 00:00 `zalo-import-daily.sh`, `LIMIT` 50; `ai_calls` 30 ngày: 1.249 lời gọi, trung bình 67 mỗi ngày (cao nhất 150), vào trung bình 509 token (p90 594), ra p50 969 (p90 2.687, Qwen có suy nghĩ) | Chữ bài S03 tối đa 500 ký tự; khối «bối cảnh» suy từ tên nhóm: tên dự án, dự án ứng viên, khu vực, loại hình, mã toà | `enrichment_proposals` (đề xuất) → `apply_enrichment` khi có căn cứ độc lập, còn lại `/ops/review` | model theo cấu hình (Haiku), cờ Gateway, trần tiền |
| `agent/src/agents/judge-entity.ts` (`model: "qwen27b"`) qua `agent/scripts/judge-run.ts` | Chạy tay, không có lịch; 30 ngày: 0 lời gọi; đang chờ 558 cặp `needs_llm` + 63 thẻ `entity_match` chờ | Hai tin: giá, diện tích, giá/m², phường, loại hình, mã nguồn S0x, chữ bài S03 tối đa 200 ký tự, tiêu đề S06 tối đa 200 ký tự; kết luận và lý do của luật | `review_queue.evidence.cham` (lời giải thích); kết luận do luật `apNguong`, model chỉ viết lời giải thích | như trên |
| `agent/src/agents/nhan-bac-s03.ts` (backend `qwen` → `qwen27b-khong-nghi`) qua `agent/scripts/nhan-bac-run.ts --model` | Chạy tay; lần cuối 01/11 | Không đổi (đường Haiku đã có từ hồ sơ nhan-bac-model-lon-s03) | `silver_labels` | gỡ backend `qwen` |
| `agent/src/agents/vlm-anh-s03.ts` (backend `qwen`) qua `agent/scripts/vlm-anh-run.ts --model` | Chạy tay; lần cuối 02/11 | Không đổi (đường Haiku đã có từ hồ sơ vlm-anh-tin-s03) | `silver_labels` nguồn ảnh | gỡ backend `qwen` |
| `pipeline/lib/vlm-anh.mjs:292–297` `kiemLoThat` | Kiểm lô thật VLM | Không gọi model | người chạy lô | đòi «≥ 1 dòng tốt của một model được duyệt» thay «≥ 1 dòng Qwen tốt» |
| `agent/src/runtime/models.ts` (`qwen27b`, `qwen27b-khong-nghi`, `MTPLX_URL`), `agent/src/runtime/loop.ts` (`qwenParams`) | Thư viện | — | mọi agent qua `runAgent` | gỡ hai tên Qwen và `MTPLX_URL`; `qwenParams` → `modelParams` |
| `agent/scripts/smoke.ts` (`npm run smoke`, lệnh trong AGENTS.md) | Chạy tay | Một câu cố định «giờ là mấy giờ», không dữ liệu kho | người chạy | sang Haiku |
| `scripts/zalo-import-daily.sh` (bước `enrich-run`, lượt 00:00) | Hằng ngày 00:00 | Qua enrich-text | — | không đổi mã; không có bước nào kiểm sức khoẻ :8000 (soát 21/11); AC-10 chạy đường ghi `enrich-run` → `enrichment_proposals` → `apply_enrichment` với đầu ra dạng Haiku |
| `scripts/bao-cao-ngay.mjs:180` (lọc `mtplx:%` khi đếm model thiếu giá) | Báo cáo ngày | Không gọi model | báo cáo | **giữ**: cửa sổ 7 ngày còn dòng `ai_calls` cũ của MTPLX; bỏ lọc thì ô C4 báo nhầm trong 7 ngày |

Soát luật 6 cho từng chỗ: không chỗ nào gửi hồ sơ user app, định danh tài khoản thu, phiên/khoá/QR hay bảng giải mã nguồn. Mọi
trường rời máy là «chữ bài, ảnh, tên nhóm» hoặc dữ liệu tin đã chuẩn hoá. **Trường ngoài «chữ bài, ảnh, tên nhóm»:** của
`judge-entity` là giá, diện tích, giá/m², phường, loại hình, mã nguồn S0x (không phải tên thật), tiêu đề tin S06, kết luận và lý do
của luật. Của `enrich-text` là khối bối cảnh suy từ tên nhóm. `queryPair` có đọc `seller_name` nhưng `buildJudgeInput` không đưa
vào lời gọi; lý do luật chỉ gửi chữ `cau` (vd «giá/m² sát nhau», «khác phường»), không gửi số đo kèm theo. Model đích là Haiku 5.5, một trong ba model luật 6 cho gửi nguyên văn.

## Cách làm

1. **Cấu hình model của agent**: tệp mới `agent/config/model-agent.json`, cùng khuôn với bảng của PL30 (`agent/config/doc-gop-s03.json`):
   `phien_ban`, `mac_dinh`, bảng `model` (mã Gateway, giá vào, giá ra theo USD mỗi triệu token), bảng `agent` (tên agent → khoá model).
   Mã model phải thuộc danh sách đóng `MODEL_DUYET` của `agent/src/enrich/doc-gop-s03/cau-hinh.ts`; sai thì dừng trước lời gọi đầu.
   `runAgent` lấy model của agent từ tệp này. Mặc định Haiku.
2. **Đường gọi** (sửa 22/11, Mạnh chọn «(b) Anthropic thẳng» sau khi ví trả trước Gateway cạn 21/11): model có `duong` và `tu_lui`
   cùng khuôn `agent/config/doc-gop-s03.json`; bảng của kho cho Haiku `duong: ["anthropic", "gateway"]`, `tu_lui: true`. Đường
   `anthropic` gọi Messages API qua `@anthropic-ai/sdk` (`enrich-text`, `judge-entity` không công cụ; `smoke-echo` có tool `get_time`
   nên đường thẳng có vòng tool tự viết: `stop_reason: tool_use` → chạy tool → `tool_result`, tối đa `budget` lời); gặp lớp dừng
   (`laLopDung` của `runtime/loi-nha-cung-cap.ts`: hết tiền, khoá sai) thì lời ấy và các lời kế đi Gateway, in một dòng `chuyen-duong`.
   Gateway gửi kèm `providerOptions` của `tuyChonGui` (không giữ dữ liệu, không huấn luyện); đường thẳng không có cờ theo lời gọi tương
   đương — cùng chế độ bộ đọc gộp, Mạnh chấp nhận cho hai agent này. Thiếu khoá làm không còn đường nào → mã 5 trước lời gọi đầu.
   `ai_calls.model` = `<đường>:<mã gọi>` (`modelSo` của PL30); cột `model` của đề xuất giữ mã model `anthropic/claude-haiku-5.5`.
3. **Gỡ Qwen**: bỏ `qwen27b`, `qwen27b-khong-nghi`, `MTPLX_URL` khỏi `models.ts`; bỏ backend `qwen` khỏi nhãn bạc và đọc ảnh (CLI
   `--model qwen` trả mã 2 «model không được duyệt»); `smoke.ts` dùng Haiku; `kiemLoThat` thôi đòi dòng Qwen.
4. **Trần tiền**: `enrich-run` và `judge-run` nhận `--tran-usd` (mặc định theo câu Hỏi-1). Chi phí mỗi lời gọi = token vào × giá vào
   + token ra × giá ra, đọc giá từ tệp cấu hình. Lời gọi kế có thể vượt trần (ước theo token vào thật và trần token ra) → dừng trước
   lời gọi, mã thoát 4, dòng tổng kết nêu đã chi và trần.
5. **Số đo trước/sau** (AC-8): mẫu cố định 100 tin có đề xuất `e2_llm` cũ của Qwen (chọn theo băm `offer_id`, danh sách ghi vào
   `_acceptance/model-may-sang-haiku/mau-enrich.json` trước khi chạy) và 30 cặp ghép căn đang chờ (ghi `mau-judge.json`). Chạy Haiku
   trên mẫu, so với đầu ra Qwen đã lưu, không gọi MTPLX. Thước: enrich — tỉ lệ JSON đọc được, và theo từng trường (loại hình, phòng
   ngủ, phòng tắm, đường, dự án, toà) tỉ lệ trùng giá trị với đề xuất Qwen; judge — tỉ lệ có lời giải thích hợp lệ, kết luận luật
   không đổi. Chạy SAU khi Mạnh duyệt Cổng Phạm vi, trần 1 USD.

### Dữ liệu rời máy theo đường thẳng (AC-3, AC-4)

Mỗi lời gọi thẳng API Anthropic chỉ mang năm khoá trong thân (E3 kiểm tập con), cộng `tools` cho `smoke-echo`:

| Khoá | `enrich-text` | `judge-entity` | `smoke-echo` |
|---|---|---|---|
| `model` | `claude-haiku-5-5` | `claude-haiku-5-5` | `claude-haiku-5-5` |
| `system` | lời dặn cố định của agent | lời dặn cố định của agent | lời dặn cố định |
| `messages` | chữ bài ≤ 500 ký tự + khối bối cảnh (nhóm đã giải về khu vực) | các dòng thuộc danh sách nhãn dòng của judge (giá, diện tích, vị trí, căn cứ luật) | câu hỏi giờ + kết quả tool |
| `max_tokens` | 4096 | 4096 | 4096 |
| `tools` | — | — | `get_time` (không tham số) |

Không gửi: tên, SĐT người bán, tên nhóm ở cột ngoài chữ bài (E4 kiểm trên thân yêu cầu thật), hồ sơ user app, định danh tài khoản thu,
phiên/khoá. Đường thẳng **không có cờ không giữ dữ liệu, không huấn luyện theo từng lời gọi** như `providerOptions.gateway` của Gateway;
dữ liệu đi theo thoả thuận tổ chức với Anthropic — cùng chế độ bộ đọc gộp (`goi-thang-anthropic`), Mạnh chấp nhận cho hai agent này
22/11. Lùi về chế độ có cờ bằng cấu hình: đặt `duong: ["gateway"]` cho Haiku trong `agent/config/model-agent.json`, không đổi mã.

## Ngoài phạm vi

Kev trong hook S03 (`collector/openclaw/handler.js`), bộ canh, `docs/ops/runtime-map.md`, dò `kev` ở `pipeline/push-ops-facts.mjs`,
plist `kev-gate` — làn thu, đi cùng việc gỡ Kev. `pipeline/scripts/bench-extraction.mjs` (Ollama :11434, công cụ đo tay, không phải
MTPLX). `scripts/smoke-review-queue.mjs` (chữ «qwen27b» chỉ là dữ liệu giả của thẻ). Thêm dòng giá Haiku vào `ai_model_prices` (ghi DB).
