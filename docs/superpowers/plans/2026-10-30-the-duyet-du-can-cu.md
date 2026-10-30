# the-duyet-du-can-cu (PL3) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Sheet chi tiết /ops/review hiện mọi trường kèm căn cứ, ảnh tin, toàn văn tin, không độ tự tin; mọi quyết định kèm lý do ghi audit cùng transaction.

**Architecture:** Hai lib thuần/đọc mới (`lib/ops/review-can-cu.ts` nhãn căn cứ + bảng so; `lib/ops/review-context.ts` toàn văn + `field_provenance` một truy vấn) đổ vào `ReviewCard`. Route decide nhận `reason`, ghi `decision_note` + `ops_audit.detail.ly_do` trong transaction có sẵn của TV1. Agent bổ sung tin ghi `ai_suggestion` NULL. Phần giao diện đã dựng ở design-pass (chưa commit) — kế hoạch này thêm phép đo, route, agent và chốt lại.

**Tech Stack:** Next.js 16 + React 19, ReUI/shadcn base-nova, `node --test` + tsx + jsdom, PostgreSQL :5433 (lược đồ tạm `schemaUrl` như `app/tests/viewer-the-duyet.test.tsx`).

**Spec:** `docs/superpowers/specs/2026-10-30-the-duyet-du-can-cu-design.md` · hợp đồng `_acceptance/the-duyet-du-can-cu/contract.md` · evals `_acceptance/the-duyet-du-can-cu/evals.yaml`

## Global Constraints

- Không migration (cột `decision_note` có từ 029); không ghi dữ liệu hàng loạt; DB :5433 chỉ lược đồ tạm `td_<pid>` hoặc ROLLBACK ngắn (giám sát U1-73), probe trên dữ liệu thật chỉ SELECT.
- Không chạm `pipeline/transform-zalo.mjs` (làn P1), `collector/**`, `db/migrations/**`, `components/ui|reui|blocks|examples/**`.
- Nhãn theo CONTEXT.md: «Lý do», «Chưa ghi căn cứ», «Chưa ghi căn cứ — đọc từ tin», «Không có toàn văn ở máy thu», «Suy luận của AI — không phải căn cứ», «Khớp» / «Lệch» / «Thiếu»; nhãn lớp/phương pháp đọc từ `LABELS_VI` của `vocab.generated.ts`.
- Lý do: cắt khoảng trắng hai đầu, 1…1.000 ký tự (`LY_DO_TOI_DA = 1000`); thiếu/trắng/quá dài → 400, không đổi gì.
- Ảnh: vai `xemNoiDungTin` nhận ảnh `origin: "local"`; URL gốc chỉ `isAdmin`; `/api/zalo-media` chế độ snapshot mở cho `xemNoiDungTin`, chế độ `?path=` giữ admin.
- Mỗi phép đo mới có cặp hai chiều trên cùng fixture, chiều đỏ là bản chép tạm `app/tests/.td-cu-*` đổi đúng một chỗ, thông điệp ghim đúng như `expected` của evals.
- ReUI: không set h/px/rounded/shadow lên component cài sẵn; `cd app && npm run lint` sạch, baseline suppressions không tăng.

## Review Focus

1. Lý do toàn ký tự trắng Unicode (`" 　"`) hay xuống dòng — người duyệt kỳ vọng bị coi là trống: route và `lyDoHopLe` cắt bằng `trim()` (JS trim gỡ cả NBSP, U+3000); thêm vào ma trận TD-AC-7.
2. Bấm quyết hai lần / thẻ đã quyết ở tab khác — kỳ vọng 409 và lý do vừa gõ không mất: route kiểm `status` trước khi đọc lý do vẫn trả 409; TD-AC-8 thêm ca 409 không ghi `decision_note`.
3. Tin của thẻ không còn trong `sale_offers` (đã nghỉ, bị thay) — kỳ vọng sheet vẫn mở, căn cứ «chưa ghi», toàn văn «Không có…»: TD-AC-2 DB thêm ca offer_id vắng.
4. `field_provenance` hỏng (giá trị ngoài sổ, kiểu sai) — kỳ vọng ô căn cứ «chưa ghi», không ném: TD-AC-2 thêm ca jsonb hỏng cho `docCanCu`.
5. Toàn văn rất dài (> 10.000 ký tự) — kỳ vọng hiện trọn, sheet cuộn, trang không cuộn ngang: TD-AC-3 thêm ca 12.000 ký tự, so độ dài.

---

### Task 1: Căn cứ và bảng so trên thẻ (UI, không DB)

**Files:**
- Đã có (design-pass): `app/src/lib/ops/review-can-cu.ts`, `app/src/components/ops/review/review-compare.tsx`, `review-full-text.tsx`, `review-reason.tsx`, sửa `app/src/components/ops/review-card.tsx`, `review-photos.tsx`, `review-detail-sheet.tsx`, `review-queue.tsx`, `app/src/lib/ops/review-queue.ts`
- Create: `app/tests/the-duyet-du-can-cu.test.tsx` (phần jsdom, khuôn jsdom + `render` của `app/tests/review-card.test.tsx`)
- Modify: `app/tests/review-card.test.tsx` (AC-9/AC-11 cũ: body nay mang `reason`; «Điểm B» không còn)

**Interfaces:**
- Produces: `docCanCu(provenance: unknown): CanCuTin` · `nhanCanCu(c?: CanCu): string` · `soGiaTri(a, b): So` · `soTruongGhepCan(a: BenGhepCan, b: BenGhepCan, canCuA?: CanCuTin, canCuB?: CanCuTin): HangSo[]` (10 hàng, `truc: boolean`) · `lyDoHopLe(v: string): string | null` · `ReviewCard({ item, media?, context?: ReviewContext, children? })` · body POST decide `{ status, reason, choices? }`.
- Phục vụ: E1, E2 (phần thuần), E6, E7 · independent: false

- [ ] **Step 1: Viết test** `TD-AC-1` (fixture bổ sung tin 3 trường: xung đột có basis, không xung đột basis «LLM m · tự tin 92% · trace t» qua `toReviewItem`, không basis → mỗi trường đúng một `[data-review-field]`, có `[data-review-can-cu]`, hàng không basis = «Chưa ghi căn cứ», không '92'/'tự tin'); `TD-AC-2` (ma trận viết trước 10 trường × {khớp, lệch, thiếu một bên} = 30 assert trên `soTruongGhepCan`; ma trận 3 × 6 `VOCAB.evidence_tier × VOCAB.assertion_method` = 18 assert trên `nhanCanCu` chứa nhãn `LABELS_VI`, legacy → «Giá trị có trước — chưa có căn cứ»; `docCanCu` với jsonb hỏng → `{}`; 10 hàng `[data-review-compare]`, giá/diện tích/giá/m²/phường/tầng có «Chưa ghi căn cứ — đọc từ tin» ở ô Trường); `TD-AC-5` (stage_b_score 0.873, ai_confidence 0.91, confidence 0.92 → HTML không 'Điểm B', 'tự tin', '0.873', '87', '0.91', '91', '0.92', '92'); `TD-AC-6 UI` (ghép căn ai_suggestion yes/no/unsure/null và bổ sung tin 'apply'/null → outerHTML `[data-review-actions]` giống hệt từng nhóm; `[data-review-ai]` sau `[data-review-compare-table]`; không 'nên áp').
- [ ] **Step 2: Chiều đỏ** bằng bản chép `tests/.td-cu-*` theo đúng bốn thông điệp ghim của E1, E2, E6, E7 (bỏ ô căn cứ trường bathrooms; null = null là khớp; còn badge Điểm B; variant nút theo ai_suggestion / tô Áp theo 'apply').
- [ ] **Step 3: Chạy** `cd app && node --import tsx --test --test-name-pattern "TD-AC-(1|2|5|6) " tests/the-duyet-du-can-cu.test.tsx` → PASS; chiều đỏ ra đúng thông điệp.
- [ ] **Step 4: Sửa** `tests/review-card.test.tsx`: các ca bấm quyết gõ lý do trước (`fill` textarea `[data-review-reason]`), body mong đợi thêm `reason`; ca «Áp dụng bật ngay» đổi thành «bật sau khi có lý do». Chạy `cd app && npm test` → PASS.
- [ ] **Step 5: Commit** `feat(ops/review): căn cứ từng trường, bảng so ghép căn, toàn văn, ô lý do (PL3)`.

### Task 2: Toàn văn và căn cứ từ DB máy thu

**Files:**
- Đã có: `app/src/lib/ops/review-context.ts` (`loadReviewContext`, `CONTEXT_SQL`), sửa `app/src/components/ops/review-content.tsx`
- Test: `app/tests/the-duyet-du-can-cu.test.tsx` (phần DB: lược đồ tạm `td_<pid>` có `sale_offers` (bảng gốc `sale_offer_records` LIKE + view như 045), `stg_zalo_posts`, `stg_chotot_ads`, `field_assertions`)

**Interfaces:**
- Consumes: `docCanCu` (Task 1).
- Produces: `loadReviewContext(items: ReviewContextItem[], query?: ContextQuery): Promise<Record<number, ReviewContext>>` · `ReviewContext = { offer_a?, offer_b?, offer?: OfferContext }` · `OfferContext = { toanVan: string | null; nhom: string | null; canCu: CanCuTin }`.
- Phục vụ: E3, E4 · independent: false

- [ ] **Step 1: Test `TD-AC-2 DB`**: dựng phát biểu trong lược đồ tạm rồi gọi `resolve_offer_fields` thật của 045 để ghi `field_provenance` (không viết tay jsonb) → căn cứ loader khớp từng ô; offer không có provenance → mọi trường trục «Chưa ghi căn cứ — đọc từ tin»; offer_id vắng khỏi `sale_offers` → không ném.
- [ ] **Step 2: Test `TD-AC-3`**: S03 hai bản bài (1.200 ký tự, xuống dòng; bản mới nhất khác bản cũ) → đúng bản mới nhất từng ký tự; S06 `payload.body` 800 ký tự theo `list_id = originating_system_key`; S05 → «Không có toàn văn ở máy thu» + đoạn đầu evidence; ca 12.000 ký tự; không `line-clamp`; tên nhóm ở `[data-review-group]`. Chiều đỏ: bản chép loader `left(text, 300)` → 'TD-AC-3: toàn văn S03 dài 300, kỳ vọng 1200'.
- [ ] **Step 3: Probe chỉ đọc trên DB local thật** (`describe` riêng, `DATABASE_URL` gốc, chỉ SELECT): thẻ chờ có tin S03/S06 có bài ở stg → loader trả toàn văn 100%, ghim 'TD-AC-3 probe: thẻ #<id> có bài gốc ở stg mà loader trả null'; `SELECT DISTINCT evidence_tier, method` → mọi cặp có nhãn.
- [ ] **Step 4: Chạy** `cd app && node --import tsx --test --test-name-pattern "TD-AC-(2 DB|3)" tests/the-duyet-du-can-cu.test.tsx` → PASS.
- [ ] **Step 5: Commit** `feat(ops/review): toàn văn + căn cứ đọc ở máy thu (PL3)`.

### Task 3: Ảnh tin theo vai

**Files:**
- Đã có: `app/src/lib/ops/review-media.ts` (`MediaSide`, `chiGoc`), `app/src/lib/ops/zalo-media.ts`, `app/src/components/ops/review-photos.tsx` (prop `chiGoc`)
- Test: `app/tests/the-duyet-du-can-cu.test.tsx` (TD-AC-4); Modify khi đỏ theo thiết kế: `app/tests/review-media.test.tsx`, `app/tests/viewer-the-duyet.test.tsx` (ca giả định «ảnh chỉ admin» đổi thành «URL gốc chỉ admin», giữ chiều đỏ)

**Interfaces:**
- Produces: `ReviewMedia = Partial<Record<MediaSide, ReviewImage[]>> & { chiGoc?: Partial<Record<MediaSide, number>> }`; `serveZaloMedia(req, user)` snapshot → `xemNoiDungTin`, path → `isAdmin`.
- Phục vụ: E5, E12 · independent: false

- [ ] **Step 1: Test `TD-AC-4`**: ma trận viết trước 5 vai × {ảnh đã tải, chỉ URL gốc} = 10 ca trên `loadReviewMedia` (bảng `media` lược đồ tạm); `serveZaloMedia` snapshot trên tệp thật trong `mkdtemp` (`SNAPSHOTS_DIR` tạm): ops/admin/owner 200, user/viewer 404; `?path=` với vai ops → 404; sheet vai ops, tin chỉ URL gốc → không `<img>` có `src` ngoài `/api/zalo-media`, có `[data-review-photos-chi-goc]`. Probe chỉ đọc: ảnh `local_file` thật của tin trên thẻ chờ = số ảnh vai ops nhận. Chiều đỏ: bản chép trả URL gốc cho ops → 'TD-AC-4: vai ops nhận URL gốc'.
- [ ] **Step 2: Chạy** test mới + `cd app && node --import tsx --test tests/review-media.test.tsx tests/viewer-the-duyet.test.tsx` → sửa ca cũ đỏ theo thiết kế, ghi dòng sổ `fix` cho mỗi ca đổi; PASS.
- [ ] **Step 3: Commit** `feat(ops/review): ảnh đã tải cho vai Vận hành, URL gốc chỉ quản trị (PL3)`.

### Task 4: Route decide nhận lý do

**Files:**
- Modify: `app/src/app/api/v1/ops/review/[id]/decide/route.ts`
- Test: `app/tests/the-duyet-du-can-cu.test.tsx` (TD-AC-7, TD-AC-8; khuôn gọi route thật của `app/tests/quyen-bon-vai.test.tsx`)

**Interfaces:**
- Consumes: `LY_DO_TOI_DA` (export từ `review-reason.tsx` chuyển sang `lib/ops/review-can-cu.ts` để route server import được — `review-reason.tsx` re-export).
- Produces: body `{ status, reason, choices? }`; 400 `{ error: "lý do bắt buộc, 1–1.000 ký tự" }` TRƯỚC `BEGIN`; trong transaction `UPDATE review_queue SET … decision_note = $reason`; `ghiAuditTrong(..., "review.decide", { …, ly_do: reason })`.
- Phục vụ: E9, E10 · independent: false

- [ ] **Step 1: Test `TD-AC-7`**: jsdom ô trống / '   ' / ' 　' → mọi nút disabled + 'Ghi lý do trước khi quyết'; gõ chữ → bật. Route: thiếu reason, '   ', 1.001 ký tự × 2 loại thẻ = 6 ca → 400 và băm bốn bảng trước = sau. Chiều đỏ: bỏ kiểm reason → 'TD-AC-7: thiếu lý do mà route vẫn ghi'.
- [ ] **Step 2: Test `TD-AC-8`**: 2 loại × 3 trạng thái = 6 ca, reason '  Giá lệch 2 tỷ  ' → `decision_note` = 'Giá lệch 2 tỷ', đúng 1 dòng `ops_audit` mới `detail.ly_do` khớp; thẻ đã quyết → 409, `decision_note` không đổi; trigger tạm ném ở INSERT `ops_audit` → 500, `pending`, NULL, 0 dòng. Quét tĩnh `git ls-files app agent pipeline scripts` (trừ tests) có 'review.decide' kèm ghi audit → đúng một tệp (route); bản sao tạm thêm tệp → 'TD-AC-8: 2 chỗ ghi review.decide'. Chiều đỏ: ghi `decision_note` sau COMMIT → 'TD-AC-8: audit hỏng mà decision_note đã ghi'.
- [ ] **Step 3: Implement** kiểm lý do và hai chỗ ghi trong route; chạy `--test-name-pattern "TD-AC-(7|8)"` → PASS.
- [ ] **Step 4: Commit** `feat(api/ops/review): quyết định bắt buộc lý do, ghi decision_note + audit cùng transaction (PL3)`.

### Task 5: Agent bổ sung tin không gắn gợi ý

**Files:**
- Modify: `agent/src/enrich/run.ts:142-143` (`ai_suggestion` → NULL)
- Create: `agent/tests/enrich-goi-y.test.ts` (khuôn DB + model giả của `agent/tests/enrich-db.test.ts`, ROLLBACK ngắn)

**Interfaces:**
- Produces: dòng `review_queue` mới của `syncReview` có `ai_suggestion IS NULL`.
- Phục vụ: E8 · independent: true

- [ ] **Step 1: Test `TD-AC-6 agent`**: `runEnrich` với model giả trả một đề xuất route `review` → `SELECT ai_suggestion FROM review_queue WHERE id = ANY(reviewIds)` toàn NULL; chiều đỏ bản chép còn 'apply' → 'TD-AC-6: thẻ bổ sung tin mới mang gợi ý apply'.
- [ ] **Step 2: Implement**, chạy `cd agent && node --import tsx --test tests/enrich-goi-y.test.ts && npx tsc --noEmit` → PASS.
- [ ] **Step 3: Commit** `fix(agent/enrich): thẻ bổ sung tin không gắn gợi ý apply (PL3)`.

### Task 6: Vai viewer và cloud không đổi

**Files:**
- Test: `app/tests/the-duyet-du-can-cu.test.tsx` (TD-AC-9)

**Interfaces:**
- Consumes: `ReviewContent` (đã gọi `loadReviewContext` sau hai nhánh dừng sớm).
- Phục vụ: E11, E12 · independent: false

- [ ] **Step 1: Test `TD-AC-9`**: `ReviewContent` vai viewer (lược đồ tạm) và nhánh cloud (`review_queue` vắng) với pool bọc đếm truy vấn → 0 truy vấn chạm `stg_zalo_posts`, `stg_chotot_ads`, `field_provenance`, `media`; HTML có 'thẻ đang chờ', 'Hàng duyệt chỉ có ở máy thu', 'Nội dung thẻ chỉ hiện cho vai Vận hành trở lên.'; chiều đỏ gọi loader trước kiểm vai → 'TD-AC-9: vai viewer chạy truy vấn toàn văn'.
- [ ] **Step 2: Chạy** `cd app && node --import tsx --test tests/the-duyet-du-can-cu.test.tsx tests/viewer-the-duyet.test.tsx` → PASS.
- [ ] **Step 3: Commit** `test(ops/review): vai viewer và cloud không đọc toàn văn (PL3)`.

### Task 7: Chốt giao diện và tài liệu

**Files:**
- Đã có: `CONTEXT.md` (Lý do quyết định, Suy luận của AI), `.claude/skills/onehub-ui/routes.md` (dòng `/ops/review`)
- Modify: `docs/ROADMAP.md` §2 as-built + §4 trạng thái (một dòng PL3)

**Interfaces:**
- Phục vụ: E13–E16 · independent: false

- [ ] **Step 1: Chạy** `cd app && npx tsc --noEmit && npm run lint && npm run test:lint-rules`; `config:executors.script.the_duyet_design_gate`; `config:executors.design.floor` → đều exit 0; sửa mọi hit tự kiểm ReUI (quality.md C1–C4, anti-patterns) trên tệp đổi, tối đa hai lượt.
- [ ] **Step 2: Chạy** `cd app && npm test` và `node --test scripts/*.test.mjs` → PASS (sau khi gộp origin/main có #195).
- [ ] **Step 3: Commit** `docs(ops/review): CONTEXT, routes, ROADMAP cho PL3`.
