# C2 — Agent Ingest Bridge: Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Agent (OpenClaw) báo tin Zalo qua `POST /agent-report` → raw snapshot theo DATA-CONTRACT → transform → `sale_offers`, kèm benchmark extraction regex-vs-LLM trên mock có ground truth và API `/api/v1/ops/extraction-quality`.

**Architecture:** Collector API là HTTP server riêng trong `collector/` (node:http, port 9210, ADR-0006) ghi raw snapshot qua `SnapshotWriter` sẵn có — KHÔNG đụng DB (ADR-0006 sửa đổi: agent-report qua raw zone). Parser regex sống ở pipeline (refactor export); bench ở pipeline chạy trên snapshot zalo-mock mới có ground truth, ghi `dq_check_results`. App chỉ expose kết quả qua API v1.

**Tech Stack:** TypeScript + node:test + node:http (collector), mjs (pipeline), PostgreSQL, Next.js route.

**Spec:** `docs/adr/0007-collector-operating-principles.md` (SPL/CCP/DCA/DQO), `docs/adr/0006-agent-swarm-architecture.md` (sửa đổi: raw trước staging), `collector/docs/DATA-CONTRACT.md`.

## Global Constraints

- Source id mới: **`zalo-agent`** (không phải `zalo-groups` — collector thật C3). Mã SPL S03, thêm vào `source_registry.source_ids`.
- Agent-report **KHÔNG ghi DB trực tiếp** — chỉ ghi raw snapshot + manifest (sha256). DB chỉ đổi qua migration; import qua pipeline có sẵn.
- API key per-agent: env `AGENT_API_KEYS` (comma-sep), so sánh constant-time; thiếu → 401 JSON.
- Tên nguồn thật không xuất hiện ở serving/API — chỉ mã S03 + nhãn "Cộng đồng".
- Ollama chưa cài trên máy — chân LLM của bench là **tùy chọn** (`OLLAMA_URL` unset → skip, không fail).
- UI tiếng Việt; psql luôn `docker exec -e PGPASSWORD=oneinvest one-invest-db psql -h localhost -U oneinvest -d oneinvest`.

## Review Focus

1. Agent gửi tin trùng (retry mạng) → dedup theo sourceId, không sinh offer/không đếm kép → T3 test post 2 lần cùng payload.
2. `AGENT_API_KEYS` unset → server **từ chối mọi request** (fail closed), không phải chấp hết → T3 test.
3. Payload extracted của agent là dữ liệu ngoài (thiên hạ gửi gì cũng được) → KHÔNG tin cho canonical; chỉ lưu nguyên vận trong payload để bench đối chiếu → T3 ghi payload nguyên + T5 canonical chỉ từ regex parse.
4. Server crash giữa buffer và flush → mất tối đa cửa sổ buffer (chấp nhận, ghi rõ), KHÔNG ghi snapshot rỗng/error gây nhiễu SLO → T3 flush chỉ khi có item.
5. Bench chạy khi snapshot mock cũ (không meta.gt) → skip item đó, không tính vào mẫu số → T5.

---

### Task 1: zalo-mock ground truth trong meta.gt

**Files:**
- Modify: `collector/src/collectors/zalo-mock.ts` (mkPost nhận gt; repost copy gt; vòng "broken" ghi đè gt field tương ứng thành null)

**Interfaces:**
- Produces: RawItem `meta.gt = { kind: "sale"|"rent_lt", priceVnd: number|null, pricePerm2Vnd: number|null, areaM2: number|null, bedrooms: number|null, phuong: string|null }` — mọi item snapshot zalo-mock mới.

- [ ] **B1:** Sửa zalo-mock: `salePost`/`rentLtPost` trả `{text, gt}`; mkPost đặt `meta: { city, mock: true, gt }`. Vòng broken: khi regex xoá giá → `gt.priceVnd = null; gt.pricePerm2Vnd = null`; xoá diện tích → `gt.areaM2 = null`.
- [ ] **B2:** Chạy `CONDUCT_WINDOW=off npm run collect -- collect --city hanoi --source zalo-mock`; gunzip items mới, verify bằng node one-liner: mọi item có `meta.gt`; tỷ lệ gt.priceVnd!=null ≈ 75%*… (giá trị thật in ra); gt.phuong luôn khớp tên phường có trong text.
- [ ] **B3:** `npm test` collector vẫn 6/6. Commit: `feat(zalo-mock): ground truth trong meta.gt cho benchmark extraction`.

### Task 2: transform-zalo export parsePost (refactor, không đổi hành vi)

**Files:**
- Modify: `pipeline/transform-zalo.mjs` (`export function parsePost`, `export function matchPhuong`; guard `if (import.meta.url === pathToFileURL(process.argv[1]).href) main()`)

**Interfaces:**
- Produces: `parsePost(text: string): ParsedPost` với `ParsedPost = { kind, priceVnd, pricePerm2Vnd, areaM2, bedrooms, phuong?, _phuongCandidates }`; `matchPhuong(text, phuongSlugs: [slug, name][])`.

- [ ] **B1:** Capture baseline: chạy `node pipeline/transform-zalo.mjs` trước refactor, ghi lại dòng `parse: N high, M medium, K fail — coverage X%`.
- [ ] **B2:** Refactor export + guard main. Chạy lại: output coverage **giống hệt** baseline (so từng số). Đây là test hồi quy của task.
- [ ] **B3:** Commit: `refactor(transform-zalo): export parsePost/matchPhuong cho bench dùng chung`.

### Task 3: Collector API — POST /agent-report (TDD)

**Files:**
- Create: `collector/src/api/server.ts` (export `createAgentServer(opts)` trả `http.Server`; logic listen ở `src/api/main.ts`)
- Create: `collector/src/test/api.test.ts`
- Modify: `collector/package.json` (script `"api": "node dist/api/main.js"`)

**Interfaces:**
- Consumes: `SnapshotWriter(rootDir, city, "zalo-agent")`, `RawItem`.
- Produces: `createAgentServer({ snapshotRoot, stateDir, keys: string[], city: string, flushIntervalMs?: number, flushAfterItems?: number }): { server, ingest(body: unknown, auth: string | null): { status: number; body: object }, flush(): Promise<{ snapshotId: string } | null> }` — ingest là hàm thuần xử lý 1 request (server chỉ bọc http). Buffer in-memory; flush ghi snapshot + manifest khi đủ `flushAfterItems`(50) hoặc `flush()` gọi tay. sourceId = sha256(`${group}|${ts}|${text}`).slice(0,32); trùng sourceId trong buffer HOẶC trong checkpoint `agentSeenIds` (mảng, cap 5000) → bỏ qua, đếm `duplicates`.
- Request shape nhận: `{ agent_id, group, messages: [{ id?, text, ts, extracted? }] }`; item nào thiếu text/ts → reject cả request 400; `extracted` lưu nguyên vận vào payload (Review Focus #3).

- [ ] **B1:** Viết test trước (`node:test`): ① key đúng + 2 messages (1 mới + 1 trùng text/ts) → 202 `{accepted:1, duplicates:1}`; ② sai key → 401; ③ keys=[] → mọi request 401 (fail closed); ④ thiếu text → 400; ⑤ flush() → snapshot dir có items-0001.json.gz + manifest.json, sha256 khớp, coverage `{methods:{agentReport:n}}`; ⑥ flush() khi buffer rỗng → null, không tạo thư mục.
- [ ] **B2:** `npm test` → fail (module chưa có).
- [ ] **B3:** Implement server.ts + main.ts (main: đọc env `AGENT_API_KEYS`, `AGENT_PORT=9210`, `SNAPSHOT_ROOT`, `CITY=hanoi`; chu kỳ flush setInterval 60s).
- [ ] **B4:** `npm test` pass toàn bộ (conduct 6 + api 6+).
- [ ] **B5:** Smoke thật: `AGENT_API_KEYS=k1 npm run api &` → curl 401 (không key), curl 202 (key k1) → kill; kiểm tra snapshot xuất hiện. Commit: `feat(c2): Collector API POST /agent-report — raw snapshot theo DATA-CONTRACT, dedup, fail-closed auth`.

### Task 4: Luồng zalo-agent vào pipeline (registry + import + finalize)

**Files:**
- Create: `db/migrations/014_zalo_agent_source.sql` (`UPDATE source_registry SET source_ids = array_append(source_ids, 'zalo-agent') WHERE code='S03' AND NOT ('zalo-agent' = ANY(source_ids));`)
- Modify: `pipeline/import-airbnb.mjs` (điều kiện zalo thêm `|| it.source === "zalo-agent"`)
- Modify: `pipeline/finalize-hanoi.sh` (loop thêm `hanoi__zalo-agent__*` import; sau transform-airbnb chạy `node transform-zalo.mjs`)

**Interfaces:**
- Consumes: snapshot `zalo-agent` do T3 tạo (payload.text/group/author → cột stg như zalo-mock: author = agent_id).

- [ ] **B1 (RED):** Post 1 tin qua ingest T3 (fixture text có giá+diện tích+phường "Tây Hồ", ví dụ "Bán CHCC 2PN 65m² Tây Hồ, 45tr/m², 2.93tỷ. LH 0901234567") → flush → chạy import + transform-zalo → `SELECT * FROM sale_offers WHERE phuong_raw='tay-ho' AND price_perm2=45000000` — kỳ vọng có dòng nhưng trước B2 sẽ **không có** (chưa import zalo-agent). Ghi nhận RED.
- [ ] **B2:** Apply 014 + sửa import + finalize. Chạy lại chuỗi RED → GREEN (offer xuất hiện, source='S03').
- [ ] **B3:** Verify transform-zalo chạy trong finalize không phá số mock hiện có (`offers ghi` ≥ số cũ). Commit: `feat(c2): zalo-agent qua import+finalize vào sale_offers (migration 014)`.

### Task 5: Bench extraction regex-vs-gt (+LLM tùy chọn) → dq_check_results

**Files:**
- Create: `pipeline/scripts/bench-extraction.mjs`

**Interfaces:**
- Consumes: `parsePost` (T2), snapshot zalo-mock mới nhất có meta.gt (T1), env `OLLAMA_URL` (tùy chọn, OpenAI-compatible `/v1/chat/completions`, model `OLLAMA_MODEL` default `qwen2.5:27b`).
- Produces: stdout bảng F1 per field (kind/priceVnd/areaM2/bedrooms/phuong) cho `regex` và `llm` (nếu có); ghi `dq_check_results` 1 dòng/extractor (`check_name='extraction-quality'`, `entity='regex'|'llm'`, status pass nếu field-avg F1 ≥ 0.8 — llm chỉ informational `pass/skip`); prompt LLM yêu cầu JSON đúng schema gt.

- [ ] **B1:** Chạy bench regex trên snapshot mock mới: kỳ vọng coverage field giá ≈ tỷ lệ gt (in ra); F1 kind/phường cao. Nếu F1 < 0.8 ở field nào → phân tích (đây là phát hiện thật về parser, không phải lỗi bench — ghi nhận kết quả thực).
- [ ] **B2:** OLLAMA_URL không đặt → dòng llm `skip` + exit 0 (Review Focus #5 cho item không gt: loại khỏi mẫu số, in count).
- [ ] **B3:** Verify dq_check_results có 2 dòng mới. Commit: `feat(dqo): bench-extraction — regex vs ground truth (+LLM tùy chọn) ghi dq_check_results`.

### Task 6: DCA — GET /api/v1/ops/extraction-quality + OpenAPI

**Files:**
- Create: `app/src/app/api/v1/ops/extraction-quality/route.ts`
- Modify: `docs/api/openapi.yaml` (thêm path)

**Interfaces:**
- Produces: response `{ generatedAt, results: [{ extractor: "regex"|"llm", f1ByField: Record<string, number>, f1Avg: number, samples: number, checkedAt }] }` — đọc 2 dòng `dq_check_results` mới nhất per entity; auth giống coverage route (bearer OPS_API_TOKEN hoặc session ops; thiếu → 401).

- [ ] **B1:** Route + query (DISTINCT ON entity ORDER BY checked_at DESC).
- [ ] **B2:** Verify: curl 401 không auth; với token (server start có OPS_API_TOKEN) → JSON có extractor regex với f1Avg đúng số bench T5. Cập nhật openapi.yaml path.
- [ ] **B3:** Commit: `feat(dca): /api/v1/ops/extraction-quality + OpenAPI`.

### Task 7: Verify toàn cục + review + merge

- [ ] **B1:** `collector: npm test` (12+ test) + `app: npm run build` sạch + start prod: `/vn`, `/yield`, `/ops` 200; 2 API ops 401/200 đúng.
- [ ] **B2:** End-to-end lần cuối từ đầu: curl agent-report → flush → finalize → sale_offers có offer mới → `/api/v1/ops/coverage` không bị S03 làm hỏng (fresh vì snapshot mới).
- [ ] **B3:** Review toàn branch (subagent reviewer) → fix pass Critical/Important → merge `--no-ff` về main + push + dọn workspace.
