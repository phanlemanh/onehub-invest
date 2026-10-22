# Khảo sát bộ nhớ agent cá nhân 10/2026 → đề xuất onehub-ai-agent memory

Ngày: 2026-10-22 · Trạng thái: ĐỀ XUẤT chờ duyệt (kèm harness survey)
Nguồn: codepointer.dev (so sánh kiến trúc 4 hệ Mem0/Letta/Graphiti/Cognee),
arXiv 2605.17625 (Dual-Process Episodic-Semantic), qordinate.ai (Enterprise
vs Personal memory), OpenAI Community (portable user-owned memory), Vellum
9/2026, mem0 library 9/2026.

## 1. BỨC TRANH LỚN — 4 triết lý kiến trúc bộ nhớ

| Hệ | Kiến trúc | Ghi | Đọc | Khi nào đúng |
|---|---|---|---|---|
| **Letta** (MemGPT) | Text blocks tự sửa (agent tự edit memory qua tool) + archival vector | LLM tự viết — string swap, không lịch sử | core luôn in-context; archival agent tự search (LOCOMO 74%) | agent gián file-search; không cần fact-history |
| **Mem0** | Vector store + entity hints (bỏ graph ở OSS v3 — benchmark cho thấy không đáng giá) | spaCy extract entities, fusion semantic+BM25+entity | additive fusion, trả text thô | rẻ, co-retrieval theo entity |
| **Graphiti/Zep** | Bi-temporal knowledge graph — fact mâu thuẫn bị invalidate (invalid_at) KHÔNG xoá | LLM extract từng episode + entity resolution — ĐẮT (nhiều call/episode) | cosine+BM25+BFS, sub-second | cần "đúng BÂY GIỜ vs khi đó" + traversal |
| **Cognee** | ECL pipeline (Extract→Cognify→Load) + ontology | build tường minh, đắt như graph | nhiều SearchType | modeling nặng, rebuild có kiểm soát |

**Bài học đắt giá của ngành** (đáng ghi nhất): Mem0 đã BỎ graph layer sau
benchmark thật (graph thắng temporal nhưng thua single/multi-hop, chậm 3x,
tốn 2x token) — và benchmark vendor không so được với nhau (đổi judge
model lệch ~10 điểm). → **Đừng build graph trước khi có nhu cầu traversal
thật.**

## 2. XU HƯỚNG RIÊNG CHO AGENT CÁ NHÂN (personal assistant)

1. **Dual-process** (arXiv 5/2026): tách *episodic* (cửa sổ gần — user làm
   gì hôm qua) khỏi *semantic* (fact bền — hồ sơ dài hạn) — consolidation
   nền diễn ra giữa các lượt.
2. **Episodic là trái tim của personal** (qordinate 5/2026): doanh nghiệp
   cần semantic; trợ lý cá nhân cần episodic để cuộc trò chuyện CẢM THẤY
   liên tục ("tuần trước anh hỏi Tây Hồ").
3. **User-owned portable memory** (OpenAI Community 5/2026): hồ sơ cá nhân
   do user sở hữu, consent-explicit, export được — xu hướng pháp lý/niềm tin.
4. **Procedural memory** (thói quen/routine đã học) là lớp consolidation
   riêng — agent nhớ CÁCH user muốn làm việc, không chỉ fact.
5. **Ghi nhớ có chủ đích**: ghi khi user sửa agent (feedback), khai báo
   trực tiếp (form "sở thích"), hoặc suy ra từ hành vi (view/save/so-sánh) —
   mỗi nguồn explicit-consent rõ ràng.

## 3. ĐỐI CHIẾU onehub — tín hiệu sẵn có cho memory

| Loại | onehub hiện có | Chất memory tiềm năng |
|---|---|---|
| Sở thích thị trường | `saved_markets` (bookmark) + pattern view thị trường | episodic → semantic ("quan tâm Hà Nội") |
| Sở thích căn | saved listings + `/so-sanh` compare sets + click deals | episodic ("so sánh 2PN Tây Hồ 3 lần") |
| Tài chính | G3 calculator inputs (diện tích, vốn tự có %, lãi suất mỗi lần mô phỏng) | semantic bền (budget, appetite vay) |
| Mục tiêu | pipeline 4 giai đoạn (STR/LTR/tăng giá) — chọn ở đâu? | semantic (goal profile) |
| Phản hồi | chưa có (like/dislike đề xuất) | gap — cần khi advisor sống |
| Portefolio | chưa có (căn đang sở hữu) | gap — bảng properties mở đường |
| PII/an toàn | SPL tier A + PII local-only đã là luật | memory cá nhân = tầng A TỰ NHIÊN |

## 4. ĐỀ XUẤT — "Postgres-first, 3 lớp, graph-khi-cần"

Phản ứng đúng bài học Mem0 (đừng graph sớm) + tài sản onehub (Postgres
một mối, không cần infra mới) + dual-process:

```
agent/src/memory/
├── store.ts        # giao diện 3 lớp — bảng Postgres, KHÔNG vector/graph ban đầu
├── episodic/       # LỚP 1 — events thô có timestamp
│   user_events(user_id, kind, payload jsonb, at)
│   # nguồn: app events (view/save/compare/dau-tu inputs) + hội thoại advisor
│   # CHÍNH là dual-process: cửa sổ gần luôn có "tuần trước anh hỏi gì"
├── semantic/       # LỚP 2 — hồ sơ bền, consolidation nền (giấc ngủ đêm)
│   user_profile(user_id, key, value jsonb, source, valid_from, valid_to)
│   # BI-TEMPORAL nhẹ kiểu Graphiti: giá trị mới → valid_to=now của cũ
│   # (KHÔNG xoá — "trước đây thích HN, từ 11/2026 chuyển HCMC" đo được)
│   # source ∈ {declared|behavior|feedback} — consent tường minh từng fact
│   # consolidation job (đêm): episodic tuần → suy fact (Qwen local,
│   #   LLM-off-data-path: fact gán source='behavior', evidence trỏ events)
└── procedural/     # LỚP 3 — cách-user-muốn (để sau, khi advisor lặp routine)
    user_routines(user_id, pattern jsonb, n_hits)
```

**Đúng chỗ nào của kiến trúc harness (survey trước)**: memory là 1 TOOL
của runtime (`memory.get(user_id, topic)`, `memory.observe(event)`) —
advisor agent config khai báo tool này; context.ts inject hồ sơ semantic
vào system prompt theo budget (đúng chiến thuật context-engineering T2).

**Đọc**: join SQL trực tiếp (không cần semantic-search khi hồ sơ < vài
trăm fact/user — Postgres đủ); LỚP 1 trả "20 events gần nhất + lọc topic".
**Ghi**: app POST event → episodic (đồng bộ, rẻ); semantic chỉ từ job đêm
hoặc khai báo trực tiếp (form hồ sơ trong app: budget, mục tiêu, thành phố).

**Bảo mật**: user_profile = PII tầng A tự nhiên → bảng KHÔNG sync cloud
cùng luật sellers/stg; user-owned export (xuất JSON hồ sơ của mình) đúng
xu hướng #3; mọi fact có source+evidence → giải thích được "sao tôi biết".

**KHI NÀO lên graph/vector**: khi (a) hồ sơ >~500 fact/user làm join chậm,
hoặc (b) xuất hiện nhu cầu traversal thật ("căn này liên quan dự án nào
user từng hỏi") — khi đó pgvector + edges trong CHÍNH Postgres (không dịch
vụ ngoài), đúng quyết định Mem0-rút-lui.

## 5. LỘ TRÌNH (đề xuất — lồng vào A1-A6 của harness)

| Bước | Việc | Ghi chú |
|---|---|---|
| M1 | Migration: user_events + user_profile (bi-temporal) + seed từ saved_markets + G3 inputs lịch sử | nền, không phụ thuộc advisor |
| M2 | memory tool (store.ts) + wire app events (view/save/compare/dau-tu) | episodic sống ngay cả trước advisor |
| M3 | job consolidation đêm (Qwen local, gán source+evidence) | chạy cùng chuỗi 05:30 |
| M4 | form khai báo hồ sơ trong app (declared facts) + export JSON | consent + user-owned |
| M5 | (kháng cự) pgvector chỉ khi M1 điều kiện bộc lộ | đo trước khi làm |

## 6. Nguồn
- codepointer.dev/p/agent-memory-systems-and-knowledge (so sánh 4 hệ)
- arxiv.org/html/2605.17625v1 (Dual-Process Episodic-Semantic)
- qordinate.ai/engineering/ai-memory-dichotomy (enterprise vs personal)
- community.openai.com — Portable Personal AI Identity (5/2026)
- vellum.ai/blog/best-personal-ai-assistants-with-memory (9/2026)
- mem0.ai/library/agent-memory/semantic-memory (9/2026)
