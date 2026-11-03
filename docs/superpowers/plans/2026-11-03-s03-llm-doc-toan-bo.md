# LLM đọc toàn bộ chữ S03 — kế hoạch thi công

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:executing-plans. Bước dùng `- [ ]`. Vòng T3: chỉ vào S3 sau khi Mạnh duyệt Gate 1.5.

**Goal:** Lệnh `doc-toan-bo-s03` đọc mọi tin S03 có chữ bằng Haiku, tự điền «căn hộ» theo luật trích dẫn, đưa bất đồng lên một thẻ `/ops/review`, không bao giờ ghi giá, diện tích.

**Architecture:** Hai pha tách bạch. Pha đọc: mỗi bài mới nhất của tin một lời gọi, kết quả vào `silver_labels`, có trần tiền, dừng được giữa chừng. Pha quyết: không tốn tiền, đọc nhãn đã có, chạy luật thuần cho từng tin, ghi đề xuất và thẻ trong giao dịch của tin. Chạy lại chỉ đọc phần chưa đọc và chỉ quyết tin chưa có dấu xử.

**Tech Stack:** TypeScript strict, `ai` SDK qua Vercel AI Gateway, `pg`, `node --test` với tsx, Next.js và ReUI cho khối trong thẻ.

**Spec:** `docs/superpowers/specs/2026-11-02-s03-llm-doc-toan-bo-design.md`. Hợp đồng: `_acceptance/s03-llm-doc-toan-bo/contract.md`.

## Global Constraints

- `PROMPT_VERSION = "dtb-s03-v1"`, `VIEC = "doc-toan-bo-s03"`, model `TEN_MODEL.haiku`, không có cờ đổi model.
- Mặc định: `--tran-usd 3`, `--tran-the 500`, `--nguong-dung 0.85`, tối thiểu 100 ca máy áp. Cờ đỏ chi phí khi quá 5 USD/ngày.
- Ngưỡng lệch: giá quá 10%, diện tích quá 3%; đúng bằng ngưỡng thì không lên thẻ.
- Có chữ: `length(text) > 20` trên chữ gốc. Tin sống: `retired_at IS NULL`, `source = 'S03'`.
- Không câu `UPDATE sale_offers` hay ghi cột giá, diện tích nào; không migration; mọi áp qua `apply_enrichment` với actor `doc-toan-bo:<runId>`.
- Tầng A không rời máy: `group_name` không vào thân yêu cầu; tên nguồn thật đọc từ `source_registry` lúc chạy, không viết vào mã hay test (kho công khai).
- Không gọi API trả phí trong S3, S4: mọi test dùng model giả hoặc `hoi` tiêm vào.

## Review Focus

1. Thẻ đã được duyệt rồi chạy lại lệnh: không được mọc lại thẻ. Dấu `doc-toan-bo:da-xu` theo (tin, băm chữ, prompt) chặn. Ca ở Task 4.
2. `enrich-run` đêm dựng lại evidence của thẻ: `doi_chieu` phải còn nguyên. Ca ở Task 4.
3. Thẻ chỉ có đối chiếu, không đề xuất nào: hôm nay hiện «Thẻ thiếu dữ liệu đề xuất» và mất nút. Phải có nút, không báo lỗi. Ca ở Task 6.
4. Model trả giá dạng chuỗi («2,62 tỷ»), số 0, hay bộ đọc không có giá: không so, không thẻ. Ca ở Task 3.
5. Chữ bài dạng NFD hoặc nhiều khoảng trắng, model trả câu trích NFC: vẫn là trích dẫn có thật. So sau khi chuẩn hoá NFC và gộp khoảng trắng hai phía. Ca ở Task 1.

---

### Task 1: Bảng luật trích dẫn

`independent: false` · phục vụ E3, E4 · verify: `cd agent && node --import tsx --test tests/doc-toan-bo.test.ts`

**Files:** Create `agent/src/enrich/luat-trich-dan.ts`; Create `agent/tests/doc-toan-bo.test.ts`.

**Interfaces — Produces:**
```ts
export type KetTrich = { ok: true; ma: string } | { ok: false; lyDo: "khong-co-trich" | "trich-gia" | "khong-tu-khoa" | "tu-khoa-loai-khac" | "ngu-canh-loai-tru" };
export function chuanHoaSoTrich(s: string): string;              // NFC, gộp khoảng trắng, chữ thường
export function trichCoThat(quote: string | null, chu: string): boolean;
export function kiemTrichLoai(value: string, quote: string | null, chu: string): KetTrich;
```

- [ ] Viết ca đỏ: ma trận bảng ghi trước: «bán căn hộ 2PN» ok mã `trich-dan:can-ho`; «chung cư Times City» ok; trích không có trong chữ `trich-gia`; «2PN 14tr» `khong-tu-khoa`; «bán nhà phố» với value `apartment` `tu-khoa-loai-khac`; «gần chung cư X», «cạnh căn hộ Y», «cần mua căn hộ», «bán căn hộ và nhà phố» đều `ngu-canh-loai-tru`; chữ NFD với trích NFC vẫn ok. Mỗi ca bẫy có đối chứng dương cùng tin.
- [ ] Chạy, thấy đỏ vì chưa có mô-đun.
- [ ] Viết bảng từ khoá theo mã `property_type` của `vocab.generated.ts`; chỉ `apartment` có quyền ra `ok`, các loại khác dùng để nhận «tu-khoa-loai-khac» và «nhiều loại».
- [ ] Chạy, xanh. Commit `feat(agent): bảng luật trích dẫn loại hình`.

### Task 2: Gạt chữ, hỏi model, đọc trả lời

`independent: false` · phục vụ E2 · verify như Task 1.

**Files:** Create `agent/src/enrich/doc-toan-bo.ts`; Modify `agent/src/agents/nhan-bac-s03.ts` (`chayLo`); Test `agent/tests/doc-toan-bo.test.ts`.

**Interfaces — Consumes:** `stripPII`, `chiPhi`, `chayLo`, `TEN_MODEL`, `GIA` từ `nhan-bac-s03.ts`; `recordCallDb`, `soToken`, `tenLop`.

**Produces:**
```ts
export const PROMPT_VERSION = "dtb-s03-v1"; export const VIEC = "doc-toan-bo-s03";
export function gatChu(text: string, cam: string[]): string;     // stripPII + mọi URL + từng tên trong `cam`, không phân biệt hoa thường
export type DocThem = { property_type: string | null; quote_loai: string | null; price_vnd: number | null; quote_gia: string | null;
  area_m2: number | null; quote_dt: string | null; bedrooms: number | null; bathrooms: number | null; street: string | null; block: string | null };
export function docTraLoi(raw: string, chuDaGat: string): Omit<Nhan, "model" | "error_kind" | "latency_ms" | "cost_usd"> & { probabilities: DocThem | null };
export function hoiDoc(chuDaGat: string, o?: { languageModel?: LanguageModel; recordCall?: RecordCall; trace?: string | null }): Promise<Nhan>;
export function uocChiPhiDoc(chuDaGat: string): number;
```
`chayLo` thêm hai tuỳ chọn không đổi hành vi cũ: `promptVersion?: string` (vắng thì `PROMPT_VERSION` cũ), `uoc?: (text: string) => number`.

- [ ] Ca đỏ `LS1-AC-2`: bài 1.500 ký tự có SĐT, email, `https://…`, tên nhóm giả, tên miền giả trong `cam`; model giả ghi lại prompt; chữ đến model dài hơn 500, không chứa từng chuỗi lộ (thông điệp ghim chuỗi), đối chứng dương: phần chữ thường còn nguyên.
- [ ] Ca đỏ `docTraLoi`: JSON hỏng thì `json_ok:false`; `price_vnd` dạng chuỗi hoặc ≤ 0 thành null; ý định lạ thành `unknown`; `quote_ok` so trên chữ đã gạt qua `trichCoThat`.
- [ ] Ca hồi quy `chayLo`: vắng tuỳ chọn vẫn ghi `nb-s03-v2`.
- [ ] Viết mã. `maxOutputTokens: 600`, `temperature: 0`. Prompt hỏi đủ ý định, bán/thuê, loại hình, giá VND, diện tích, PN, WC, đường, toà, mỗi thứ có câu trích nguyên văn (Hỏi-4).
- [ ] Chạy `ls1_thuan` và `tests/nhan-bac-s03.test.ts`, xanh. Commit `feat(agent): lõi đọc chữ S03 cho lệnh đọc toàn bộ`.

### Task 3: Quyết định thuần cho một tin

`independent: false` · phục vụ E3, E4, E5, E6 · verify như Task 1.

**Files:** Modify `agent/src/enrich/doc-toan-bo.ts`; Test `agent/tests/doc-toan-bo.test.ts`.

**Interfaces — Consumes:** `routeFields` (`route.ts`), `kiemTrichLoai`.

**Produces:**
```ts
export type DoiChieu = { loai: "y_dinh" | "gia" | "dien_tich"; trich: string; ai: string | number; bo_doc: string | number };
export type QuyetTin = { de_xuat: (Routed & { lyDo?: string; status: "queued" | "skipped" })[]; doi_chieu: DoiChieu[] };
export function quyetTin(i: {
  hienTai: { property_type: string | null; price_vnd: number | null; area_m2: number | null };
  e1Loai: string | null; intent: string; quoteOk: boolean | null; quoteYDinh: string | null;
  them: DocThem | null; chuDaGat: string; chungBai: boolean; held: ReadonlySet<EnrichField>;
}): QuyetTin;
```
Thứ tự luật, theo hình đã duyệt:

1. Tin có loại hình rồi: không đề xuất.
2. E1 có giá trị: giao `routeFields`, gồm cả E1 trái AI lên thẻ dù trích dẫn không đạt, E1 trùng AI `corroborated_by='e1'`.
3. AI một mình: ý định khác `offer` thì `skipped` lý do `y-dinh-khac` (AC-5: không cột nào của tin đổi). `apartment` qua `kiemTrichLoai` thì `corroborated`, `corroboratedBy = trich-dan:<mã>`. Loại khác, trích dẫn có thật: `review` không tự điền. Trích giả hoặc không có: `skipped` kèm lý do.
4. Đối chiếu ý định: `inquiry`, `not_listing` với `quoteOk === true`.
5. Đối chiếu giá, diện tích: chỉ khi `chungBai === false`, hai giá trị đều dương, trích dẫn có thật, lệch quá ngưỡng.

- [ ] Ca đỏ theo bảng: mỗi nhánh trên, biên đúng 10% và 3% hai phía, «2,62 tỷ» không so, bộ đọc null không so, `chungBai` không so giá nhưng vẫn so ý định, ý định `inquiry` kèm `apartment` đạt luật vẫn không áp.
- [ ] Viết `quyetTin`; gọi `routeFields` chỉ với `property_type` rồi đổi nhánh `review` không xung đột theo luật 3.
- [ ] Xanh. Commit `feat(agent): luật quyết một tin của lệnh đọc toàn bộ`.

### Task 4: Một lượt trên DB

`independent: false` · phục vụ E1, E3, E4, E5, E6, E7, E11 · verify: `ls1_db`, rồi `cd pipeline && node --test scripts/phat-bieu.test.mjs`.

**Files:** Modify `agent/src/enrich/doc-toan-bo.ts`, `agent/src/enrich/run.ts` (`syncReview`), `pipeline/lib/enrich-call-sites.mjs`; Create `agent/tests/doc-toan-bo-db.itest.ts`.

**Interfaces — Consumes:** `chayLo`, `SQL_GHI`, `thamSoGhi`, `quyetTin`, `apply_enrichment`.

**Produces:**
```ts
export type TomTat = { tin: number; khongChu: number; daDoc: number; tongUsd: number; dungTran: boolean; deXuat: number; daAp: number; theMoi: number; tinChoThe: number; loiGhi: string[] };
export function chonTin(c: pg.Client): Promise<TinDoc[]>;        // mọi tin S03 sống, bài mới nhất, bỏ bài thử bằng testMarker
export function chayLuot(o: { client: pg.Client; runId: string; tranUsd: number; tranThe: number; thu: boolean; cam: string[];
  hoi?: (text: string) => Promise<Nhan>; resolve: ResolveFn; giaoDich?: GiaoDich }): Promise<TomTat>;
// run.ts: export syncReview, OfferRow; thêm tham số doiChieu?: DoiChieu[]
```
- `syncReview`: đọc `evidence->'doi_chieu'` của thẻ chờ và gộp với `doiChieu` mới (khử trùng theo `loai`); `loose` rỗng, chưa có thẻ, `doiChieu` rỗng mới trả null. Evidence dựng lại luôn giữ `doi_chieu`.
- Dấu đã xử: `ops_audit` action `doc-toan-bo:da-xu`, detail `{offer_id, text_hash, prompt_version}`, nạp một lần thành Set đầu pha quyết. Không xét `enrich:thu`, không ghi `enrich:thu`.
- Trần thẻ: khi thẻ mới chạm `tranThe`, tin cần thẻ mới bị bỏ qua nguyên tin (không đề xuất, không dấu), tin khác đi tiếp; `tinChoThe` đếm phần bị bỏ.
- Ma trận `CALL_SITES` thêm `{ file: "agent/src/enrich/doc-toan-bo.ts", fn: "apply_enrichment", vai: "may" }`.

- [ ] Viết `doc-toan-bo-db.itest.ts` đỏ trước, `withTx` của `helpers/db.ts`, model giả qua `hoi`: `LS1-AC-1` ma trận bảy loại tin; `LS1-AC-3`; `LS1-AC-4` ma trận năm ca và bẫy; `LS1-AC-5` băm dòng tin; `LS1-AC-6` băm `price_vnd`, `area_m2` mọi tin; `LS1-AC-7` fixture E1 trái AI, ý định, giá chạy hai lần, đúng một thẻ, 0 dòng mới, 0 lời gọi mới; ca Focus 1 (duyệt thẻ rồi chạy lại); ca Focus 2 (`runEnrich` trên tin có thẻ giữ `doi_chieu`).
- [ ] Viết `chonTin`, `chayLuot`, sửa `syncReview`, thêm ma trận.
- [ ] Chạy `ls1_db`, `tests/enrich-db.test.ts`, `tests/enrich-goi-y.test.ts`, `phat-bieu.test.mjs`, xanh. Commit `feat(agent): một lượt đọc toàn bộ S03 ghi đề xuất và thẻ`.

### Task 5: Lệnh và ba chế độ

`independent: false` · phục vụ E8, E9, E10, E13 · verify: `ls1_db`, `cd agent && npx tsc --noEmit`.

**Files:** Create `agent/scripts/doc-toan-bo-s03.ts`; Modify `agent/src/enrich/doc-toan-bo.ts`; Test `agent/tests/doc-toan-bo-db.itest.ts`.

**Interfaces — Produces:**
```ts
export function docCo(argv: string[]): Co;                       // ném lỗi với cờ sai
export function demLuot(c: pg.Client): Promise<SoDem>;           // tử, mẫu, thành công, chi theo ngày, số thẻ
export function doMau(o: { client: pg.Client; nhan: NhanMau[]; n: number; nguong: number; hoi; wilson: (d: number, n: number) => number | null; ghiNhan: boolean }): Promise<KetMau>;
export function coMauDat(c: pg.Client, promptVersion: string): Promise<boolean>;
```
- Mã thoát: 0 xong · 1 hỏng ngoài vòng · 2 cờ sai hoặc thiếu khoá · 4 dừng vì trần · 5 mẫu dưới ngưỡng · 6 chưa có mẫu đạt.
- `--thu`: `ghi` null, `recordCall` rỗng, pha quyết chỉ đếm, 0 dòng mọi bảng kể cả `ai_calls`.
- `--mau N --nhan <tệp>`: đọc `[[post_id, {property_type,…}],…]`, ghi `silver_labels` để lượt thật dùng lại, ghi dòng `ops_audit` `doc-toan-bo:mau`, không chạm canonical. `wilsonDuoi` nạp động từ `pipeline/lib/eval-classify.mjs` trong script vì tệp ấy kéo `pg` của pipeline, job CI agent không có.
- Lượt thật gọi `coMauDat` trước lời gọi đầu. Thiếu `AI_GATEWAY_API_KEY` thoát 2 trước lời gọi đầu.
- Hoàn tác: dùng `enrich-revert.ts --ids` có sẵn; `--dem` in lệnh lấy id theo `run_id`.

- [ ] Ca đỏ: `LS1-AC-8` trần nhỏ dừng và lượt sau đọc phần còn lại, `--thu` băm 0 dòng trên mọi bảng, cờ mặc định, trần thẻ, thiếu khoá; `LS1-AC-9` `--dem` so với truy vấn độc lập, fixture có `skipped` và `corroborated`, cờ đỏ hai phía 5 USD, `revert_enrichment` thật trả về `unknown`, đỏ khi đếm cả S05; `LS1-AC-10` Wilson so số tính tay, dưới ngưỡng thoát 5 và 0 dòng canonical, chưa có mẫu thoát 6, có dòng đạt thì chạy.
- [ ] Viết mã, xanh. Commit `feat(agent): lệnh doc-toan-bo-s03 với trần, thử, đếm, mẫu`.

### Task 6: Thẻ duyệt

`independent: false` · phục vụ E7, E12 · verify: `cd app && npx tsc --noEmit && npm run lint`, `node --import tsx --test tests/the-duyet-du-can-cu.test.tsx`, `ls1_db`.

**Files:** Create `app/src/lib/ops/doi-chieu.ts`; Modify `app/src/app/api/v1/ops/review/[id]/decide/route.ts`, `app/src/components/ops/review-card.tsx`; Test `app/tests/the-duyet-du-can-cu.test.tsx`, `agent/tests/doc-toan-bo-db.itest.ts`.

**Interfaces — Consumes:** hình `evidence.doi_chieu` là `DoiChieu[]` ở Task 3.

**Produces:**
```ts
// không import alias «@/», để itest của agent gọi được bằng đường tương đối
export function ghiPhanQuyetDoiChieu(c: { query: Function }, o: { reviewId: number; itemId: string; status: "approved" | "rejected"; lyDo: string; actor: string; evidence: unknown }): Promise<number>;
```
Route: đọc thêm `evidence` trong câu `SELECT … FOR UPDATE`; thẻ `enrich:`, trạng thái khác `deferred` thì gọi hàm trên trong cùng giao dịch, action `enrich:doi-chieu`. Không dòng nào đụng cột tin.

Giao diện: trước khi viết mã, chép bản kế hoạch theo `.agents/skills/reui/SKILL.md` vào tin trả lời; sau đó chạy tự kiểm của skill. Khối đối chiếu dùng `Item`, `Badge variant="warning-light"` có sẵn trong thẻ, nhãn «Ý định», «Giá», «Diện tích» thêm vào `CONTEXT.md` nếu chưa có, cùng commit. Sửa điều kiện `fields.length === 0` ở thân thẻ và `actions` thành «không đề xuất và không đối chiếu».

- [ ] Ca đỏ agent `LS1-AC-7 duyệt`: gọi `decide_enrichment_review` rồi `ghiPhanQuyetDoiChieu`, đề xuất đổi đúng, dòng `ops_audit` đọc lại được `doi_chieu`, băm cột tin không đổi.
- [ ] Ca đỏ app: `POST` route thật trên thẻ chỉ có đối chiếu trả 200, đúng một dòng `enrich:doi-chieu`; render `AgentOutputCard` thẻ chỉ có đối chiếu thấy câu trích, loại, hai giá trị, nút «Áp dụng» (Focus 3).
- [ ] Viết mã, tự kiểm ReUI, xanh. Commit `feat(ops): khối đối chiếu trong thẻ bổ sung dữ liệu`.

### Task 7: Tài liệu vòng

`independent: false` · phục vụ không eval nào, chuẩn bị S4 · verify: `git status` sạch.

**Files:** Modify `docs/ROADMAP.md` (§2 as-built, §4 trạng thái); `agent/CLAUDE.md` nếu có mục lệnh.

- [ ] Ghi lệnh, ba cờ, mã thoát, đường lui. Không ghi số thật vì chưa chạy.
- [ ] Đổi contract `status: implemented`, commit `docs: lệnh đọc toàn bộ S03 vào ROADMAP`.
