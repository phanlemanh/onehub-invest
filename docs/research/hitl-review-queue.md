# Đề xuất: HITL Review Queue — /ops/review

Ngày: 2026-10-22 · Trạng thái: **ĐỀ XUẤT chờ duyệt**
Phát hiện từ: user nhận xét "thiếu giai đoạn HITL nơi con người phán quyết"
(xuất phát từ A2 judge-entity cần hand-label 12 cặp).

## 1. VẤN ĐỀ

Hệ thống tạo ra các **phán quyết cần con người xác nhận** nhưng chưa có
nơi thống nhất để làm việc đó:

| Loại phán quyết | Hiện tại treo ở đâu | Số lượng |
|---|---|---|
| "Cùng một căn nhà?" (P1↔P2) | `property_candidates` needs_llm | 12 |
| "Cùng một căn nhà?" (chờ tín hiệu thêm) | `property_candidates` pending | 9 |
| AI judge output (tương lai G-3) | chưa có chỗ | — |
| Nguồn bật/tắt Facebook (chi phí) | không có chỗ review giá trị vs chi phí | — |
| Agent đề xuất (tương lai advisor) | chưa có | — |

Trước đây ADR-0007 (DCA) đã hình dung `/ops/console` là "bề mặt NGƯỜI
của hành động máy" nhưng chưa xây. Đề xuất này hiện thực đúng ý đó,
tập trung vào **review queue** (phán quyết) thay vì trigger (vận hành).

## 2. NGUYÊN TẮC THIẾT KẾ

1. **Generic queue** — một cấu trúc duy nhất cho MỌI loại phán quyết,
   không xây riêng cho từng loại (entity, source, agent output).
2. **AI đề xuất → người quyết** — AI/Stage B tạo candidate + đề xuất;
   người thấy bằng chứng + phán quyết cuối. (LLM-off-data-path mạnh hơn:
   người là "judge tối cao", AI chỉ prep.)
3. **Audit mọi quyết định** — ai quyết, khi nào, thấy gì, quyết gì.
4. **Batch-friendly** — 12 cặp xem trong 5 phút, không phải từng cái
   mở trang riêng.

## 3. KIẾN TRÚC

### 3.1 Bảng `review_queue` (thay thế/done hơn property_candidates)

```sql
CREATE TABLE review_queue (
  id            bigserial PRIMARY KEY,
  item_type     text NOT NULL,        -- 'entity_match' | 'source_decision' | 'agent_output'
  item_id       text NOT NULL,        -- link tới item cụ thể (vd: "pair:offer_a|offer_b")
  title         text NOT NULL,        -- tóm tắt 1 dòng (vd: "Cùng căn? Bình Thạnh 52↔53m²")
  evidence      jsonb NOT NULL,       -- dữ liệu hiển thị (2 tin side-by-side, chart, v.v.)
  ai_suggestion text,                 -- đề xuất từ AI/Stage B (vd: "yes conf 0.92")
  ai_reasoning  text,                 -- lý do AI đưa ra
  status        text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'approved', 'rejected', 'deferred')),
  decided_by    text,                 -- user id khi có quyết định
  decided_at    timestamptz,
  decision_note text,                 -- ghi chú người review
  created_at    timestamptz NOT NULL DEFAULT now()
);
```

### 3.2 Trang `/ops/review` — hàng đợi review

```
┌─────────────────────────────────────────────────────────────┐
│  📋 Review Queue (12 pending)                               │
├─────────────────────────────────────────────────────────────┤
│  ┌─ Cùng căn? Bình Thạnh 52m² ↔ 53m² ─── AI: YES (92%) ─┐ │
│  │                                                        │ │
│  │  TIN A (Zalo)          │  TIN B (Chợ Tốt)            │ │
│  │  7 tỷ · 52m² · 135tr/m²│  7,2 tỷ · 53m² · 136tr/m²  │ │
│  │  2PN · Bình Thạnh     │  2PN · Phường Bình Thạnh    │ │
│  │  "Bán CHCC 2PN..."     │  "Căn hộ 2PN..."            │ │
│  │                                                        │ │
│  │  AI: "Diện tích lệch 1.9%, cùng phường, cùng loại"   │ │
│  │                                                        │ │
│  │  [✅ Cùng căn]  [❌ Khác căn]  [⏸ Không chắc]  [⏭]  │ │
│  └────────────────────────────────────────────────────────┘ │
│  ┌─ Cùng căn? Thông Tây Hội 45m² ↔ 45m² ── AI: UNSURE ──┐ │
│  │  ...                                                   │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                             │
│  [Duyệt tất cả AI=yes]  [Tải CSV]  [Bỏ qua AI=unsure]     │
└─────────────────────────────────────────────────────────────┘
```

### 3.3 Luồng dữ liệu

```
Stage B (deterministic scoring)
  → score ≥0.90: đưa vào review_queue (item_type='entity_match')
  → score <0.90: giữ pending trong property_candidates (chờ tín hiệu thêm)

AI Judge (A2, khi được bật)
  → phán xét mỗi item trong queue
  → cập nhật ai_suggestion + ai_reasoning
  → KHÔNG tự quyết (status vẫn pending)

Người (bạn)
  → /ops/review: xem evidence side-by-side + AI suggestion
  → click [Cùng căn] / [Khác căn] / [Không chắc]
  → quyết định ghi vào review_queue + audit + property_candidates

Agent/pipeline khác (tương lai)
  → agent entities: submit items khi confidence < ngưỡng
  → source lifecycle: "Facebook có đáng $39/tháng?" khi tới hạn quyết
  → advisor: đề xuất cần người confirm trước khi áp dụng
```

## 4. PHẠM VI TRIỂN KHAI

### Bước 1 (làm ngay — 1 buổi)
- Migration: bảng `review_queue`
- `/ops/review` page: hàng đợi + card side-by-side + 3 nút quyết
- API: `POST /api/v1/ops/review/:id/decide` (auth + audit)
- Seed: 12 cặp needs_llm → review_queue (item_type='entity_match')
- Quyết định 'Cùng căn' → cập nhật property_candidates status='merged'
  (agent sau đó merge vật lý vào properties)

### Bước 2 (khi A2 judge hoàn thiện)
- Judge agent chạy qua queue → điền ai_suggestion
- Trang review hiển thị AI suggestion cạnh bằng chứng
- Bulk approve: "duyệt tất cả AI=yes mà conf >0.9"

### Bước 3 (mở rộng, khi cần)
- item_type='source_decision': Facebook $39/tháng (đưa ra khi tới 7/11)
- item_type='agent_output': mọi agent đề xuất cần human confirm
- Slack/notification: "3 items chờ review" mỗi sáng

## 5. QUAN HỆ portals.md / ADR

- **portals.md**: thêm hàng `/ops/review` vào bảng Ops Portal — vai trò
  "Human-in-the-Loop phán quyết" (DCA track, khác /ops/console là trigger).
- **ADR-0007 DCA**: hiện thực "bề mặt NGƯỜI của hành động máy" — đúng
  thiết kế gốc nhưng tập trung review thay vì điều khiển.
- **LLM-off-data-path**: mạnh hoá — AI đề xuất, người quyết, system áp
  dụng; mọi bước có audit.

## 6. Lý do làm NGAY (không để sau)

1. **A2 đang chặn**: 12 cặp needs_llm cần quyết → không có UI thì phải
   hand-label bằng text (kém trải nghiệm, không audit được).
2. **Dữ liệu đang chảy**: mỗi đêm resolve-properties tạo thêm cặp mới —
   queue sẽ đầy nhanh nếu không có nơi xử lý.
3. **User cần ra quyết định về Facebook (~7/11)**: đây chính là
   item_type='source_decision' — cùng 1 UI.
4. **Agent (G-3+) sẽ cần**: mọi agent output confidence thấp → đưa vào
   queue → người review → agent học từ feedback.
