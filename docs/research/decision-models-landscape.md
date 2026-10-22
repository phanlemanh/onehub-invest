# Phong cảnh model quyết định (decision models) — Jev, Laya họ hàng + OpenAI Decisions

Ngày: 2026-10-22 · Điều tra: PLAN_Qwen35.md (phân tích first-principles
local 2026-09-20, sâu hơn bài Medium bị paywall) + OpenAI Decisions guide
(chính thức) + kev-family-summary.json.

## 1. Cây phả hệ "họ Jev"

| Model | Kiến trúc | Chất lượng (suite 764 items, càng cao càng tốt) | Điểm mạnh / yếu cho one-invest |
|---|---|---|---|
| **Jev** (tham chiếu) | hosted, qua Vercel AI Gateway | transfer acc **0.857**, Brier 0.211 | tốt nhất; phụ thuộc ngoài, phí gateway |
| **OpenAI Decisions** (gpt-6-luna, beta) | cloud API typed | ~10x nhanh hơn Responses API | $0.10/1M input (chỉ input); predicate/choice/score; **nhận ảnh**; dữ liệu rời máy |
| **Kev-4B** (ta đang chạy :8009) | Qwen3-4B + head train, local | 0.794 acc / Brier 0.316; **trên 620 mẫu BĐS VN: recall 100%, 81ms** | miễn phí, PII an toàn, đa ngôn ngữ sẵn từ base |
| **Kev-9B** (sẵn trong repo) | Qwen3-9B | 0.813 / Brier 0.291 | đường nâng cấp local không cần gì mới |
| **Laya** (convaiinnovations) | ModernBERT-large 395M encoder + [MASK]-scoring; bản mmBERT 322M đa ngôn ngữ | headline 0.766 *in-distribution*; zero-shot OOD **0.362 ≈ ngẫu nhiên (0.318)** | nhẹ nhất; SDK pip **tương thích System One** (agent.predict(state, questions)); yếu OOD — chí mạng với tin Zalo lộn xộn; choice cap 16 opts/192 token; ECE 0.466 shipped (hạ 0.081 nếu nhóm nhiệt độ) |
| **SemIf** (ex OpenJev, 2.3k★) | Qwen3.5-4B **không train** + JSON prompt + letter logits | 0.692 (untrained) vs Kev-4B 0.790 cùng base | xác nhận train-head đáng +10pp; không calibration |

Nguồn: kev-family-summary.json (đo trên suite đóng băng), PLAN_Qwen35.md
§6-7; tracker cộng đồng ~60 artifact (multimodalart/jev-reproductions).

## 2. OpenAI Decisions API — chi tiết chính thức (beta)

- `POST /v1/decisions`, model `gpt-6-luna`: input text **hoặc ảnh**
  (base64/URL) + mảng `questions` độc lập.
- 3 loại câu hỏi — **đúng hình dạng System One/Kev ta đang dùng**:
  - `predicate` → probability (0–1) — chính là `is_bds` của ta
  - `choice` → chọn + probabilities từng option + confidence
  - `score` → điểm theo rubric levels
- Giá: **$0.10/1M input token, chỉ tính input** (không output/cache).
  Với ~300 quyết định/ngày × ~100 token ≈ $0.003/ngày — chi phí không
  phải vấn đề.
- ~10x nhanh hơn Responses API; có refusal answer type.

## 3. Hàm ý cho one-invest

**3.1 Gate chính giữ Kev-4B local.** Lý do không phải chất lượng mà là
**PII tầng A**: tin Zalo chứa SĐT/tên — không được rời máy. Kev-4B đã
chứng minh trên đúng domain (recall 100%, 81ms) và fail-open đã vá.
Nâng cấp khi cần: serve `runs/q35-9b` (0.813) — cùng codebase, đổi 1 flag.

**3.2 Laya — đối thủ đáng test nhưng rủi ro OOD.** SDK tương thích
System One → bolt test vào bench ta chỉ 1 buổi. Nhưng điểm yếu số 1 của
encoder (near-chance ngoài distribution — 0.362 zero-shot) trúng đúng
domain của ta (text Zalo/FB môi giới lộn xộn là OOD theo định nghĩa).
Chỉ đáng dùng nếu fine-tune trên dữ liệu BĐS VN — khi đó so với Kev đã
có sẵn head + validation thì không thấy lợi. Ghi nhận, không ưu tiên.

**3.3 OpenAI Decisions = phương án B cho G-3 vision gate (đề xuất
"Một Căn Nhà").** Gate media-only Zalo cần đọc ảnh → 2 lựa chọn:
- (a) **Qwen3-VL-4B local** — Ảnh Zalo có thể chứa mặt người + SĐT
  (PII tầng A) → **bắt buộc local**, giữ nguyên đề xuất
- (b) **Decisions API** — phù hợp dữ liệu CÔNG KHAI không PII: phân loại
  ảnh Chợ Tốt/Airbnb (public sẵn), choice routing, scoring rubric.
  $0.10/1M input ≈ 0 với volume ta; zero-setup.
→ Kết luận: G-3 giữ Qwen3-VL local cho Zalo; Decisions API là công cụ
  cho các quyết định phi-PII khi cần chất lượng cao + không muốn dựng
  model (ví dụ phân loại property_type từ ảnh cho S06, score chất lượng
  ảnh hero).

**3.4 Kiến trúc hội tụ.** Cả họ (Jev → OpenAI predicate/choice/score →
System One của ta) hội tụ về cùng hình dạng câu hỏi typed. Nghĩa là
interface `questions[]` hiện có của kev-serve là đúng hướng dài hạn —
đổi backend (local Kev ↔ cloud Decisions) không đổi contract.

## 4. Đề xuất hành động

1. KHÔNG thay gate hiện tại (đang chạy, đã validate).
2. Khi làm G-3: Qwen3-VL local cho ảnh Zalo; cân nhắc Decisions API cho
   ảnh public (S06) nếu việc self-host Qwen3-VL quá tải — quyết khi đến.
3. Ghi hệ quả Kiến trúc hội tụ vào unified-property-pipeline.md khi duyệt.
