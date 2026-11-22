# NB1 Chấm bóng «Bổ sung tin» — Kế hoạch thi công

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans (native, tuần tự trong phiên — mọi task cùng ghi
> một tệp test nên không task nào `independent`). Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Mỗi thẻ «Bổ sung tin» chờ còn đề xuất có hai lần đọc mù độc lập (hai model đã duyệt) trên bài gốc, kết cục từng đề xuất do
luật xác định tính, ca biên được đánh dấu, kết quả ở tệp JSONL máy thu — không ghi tin, đề xuất, thẻ.

**Architecture:** Mô-đun mới `agent/src/enrich/cham-bong/` tách năm phần: cấu hình, lời nhắc + lần đọc, luật kết cục, đọc DB +
bộ chạy (khoá băm, trần, sổ gọi), báo cáo + kê 232 thẻ. CLI `agent/scripts/cham-bong-bo-sung-tin.ts`. Đường gọi model dùng lại
`doc-gop-s03` (cờ gửi, đường anthropic/gateway, `phanLoaiLoi`), nhưng lời nhắc riêng năm ô và không gửi ảnh.

**Tech Stack:** TypeScript strict, `ai` 7 + `@anthropic-ai/sdk`, `pg`, `node:test` + `tsx`, DB thử `db/db-thu.sh oneinvest_suite_agent`.

**Spec:** `docs/superpowers/specs/2026-11-21-cham-bong-bo-sung-tin-design.md` · hợp đồng `_acceptance/cham-bong-bo-sung-tin/contract.md`
(AC-1..AC-10, đã duyệt 21/11) · evals `_acceptance/cham-bong-bo-sung-tin/evals.yaml` (E1–E11).

## Global Constraints

- Model: chỉ hai mã trong `MODEL_DUYET` — `anthropic/claude-haiku-5.5` và `deepseek/deepseek-v4.1-flash-1017` (Hỏi-1). Kiểm lúc nạp
  cấu hình; mã khác → ném lỗi trước lời gọi đầu.
- Cờ gửi gateway lấy từ `tuyChonGui()` của `doc-gop-s03/cau-hinh.ts` (không giữ dữ liệu, không huấn luyện, DeepSeek chỉ Baseten).
- Trần mặc định `3` USD mỗi lượt (Hỏi-2); kiểm TRƯỚC mỗi lời gọi, ước lời gọi kế bằng chi phí trung bình đã thấy (lời gọi đầu: ước
  từ số ký tự lời nhắc / 3 token và `max_tokens` ra).
- Kết quả: `state/cham-bong-bo-sung-tin/<run_id>/ket-qua.jsonl`, `so-goi.jsonl` (chế độ thử), `tong-ket.json`; khoá dùng lại ở
  `state/cham-bong-bo-sung-tin/kho.jsonl` (Hỏi-3). Không migration, không bảng mới.
- DB máy thu chỉ đọc: mọi đọc trong `BEGIN READ ONLY`, `statement_timeout 60s`. Chế độ áp chỉ ghi `ai_calls`.
- `viec = 'cham-bong-bo-sung-tin'`; `ai_calls.model = modelSo(gateway, duong)`; `trace = 'cham-bong:<run_id>'`.
- Phiên bản lời nhắc `cb-v1`. Thứ tự ô ưu tiên: `bathrooms, bedrooms, block_raw, street_raw, property_type`.
- Từ vựng loại hình: `PROPERTY_TYPE` của `agent/src/vocab.generated.ts` trừ `unknown`.
- Không gọi model thật trong test; lượt thử 30 thẻ (E11) chỉ ở S4.

## Review Focus

1. Bài có nhiều `post_ids` (bài sửa, đăng lại) → lấy bản `captured_at` mới nhất, như `agent/src/enrich/run.ts` — test ở Task 4.
2. Model trả JSON bọc markdown, thiếu khoá, hay khoá thừa ngoài năm ô → ô thiếu là rỗng `khong-suy-ra`, JSON hỏng là lời gọi lỗi
   (`json-hong`, không sinh kết cục) — test ở Task 2.
3. Đề xuất `value` có khoảng trắng/hoa thường khác giá trị đọc («Căn hộ » vs «căn hộ», «02» vs «2») → so bằng `khoaGiaTri` bản sao
   đúng `assertion_value_key` — test ở Task 3, kèm ca đối chiếu với hàm SQL thật trên DB thử ở Task 4.
4. Lượt dừng giữa chừng (Ctrl-C, hết tiền 402) → mọi dòng đã có vẫn ghi xuống tệp ngay sau từng lời gọi (append đồng bộ), lần chạy
   lại tiếp đúng chỗ — test «ném ở thẻ thứ 3» ở Task 4.
5. Thẻ có `offer_id` mà tin đã bị gỡ khỏi `sale_offers`, hay bài gốc không còn trong `stg_zalo_posts` → không gọi model, ghi thẻ vào
   `bo_qua` của tổng kết với lý do `khong-tin` / `khong-bai`, báo cáo in số đó — test ở Task 4.

---

### Task 1: Cấu hình và luật kết cục (thuần, không DB, không model)

**Files:**
- Create: `agent/config/cham-bong-bo-sung-tin.json`
- Create: `agent/src/enrich/cham-bong/cau-hinh.ts`
- Create: `agent/src/enrich/cham-bong/ket-cuc.ts`
- Test: `agent/tests/cham-bong-bo-sung-tin.test.ts` (ca `AC-4 …`, `cau-hinh …`)

Phục vụ E4, E8 (phần cấu hình). `independent: false` (cùng tệp test với mọi task).

**Interfaces — Produces:**
- `type OCham = "bathrooms" | "bedrooms" | "block_raw" | "street_raw" | "property_type"`; `THU_TU_O: readonly OCham[]` đúng thứ tự Global.
- `type CauHinhCham = { phien_ban: 1; prompt_version: string; tran_usd: number; model: [ModelCham, ModelCham] }`,
  `type ModelCham = { khoa: string; gateway: string; duong: Duong[]; gia_vao: number; gia_ra: number }`.
- `napCauHinhCham(duong?: string): { cauHinh: CauHinhCham; sha: string }` — ném khi model ngoài `MODEL_DUYET`, hai model trùng
  gateway, giá âm, trần ≤ 0.
- `khoaGiaTri(v: string): string` — bản TS của `assertion_value_key`: `btrim` → toàn chữ số thì bỏ số 0 đầu (giữ «0»), ngược lại `toLowerCase()`.
- `type Doc = { v: string | null; ly_do: null | "khong-suy-ra" | "trich-gia" | "ngoai-tu-vung" | "khong-phai-so" }`.
- `type KetCuc = "khop" | "bo_trong" | "lech_hai_lan" | "bac_dong_thuan"`.
- `ketCuc(deXuat: string, d1: Doc, d2: Doc): KetCuc`; `laCaBien(k: KetCuc, lechTrenThe: boolean): boolean`.

- [ ] **Step 1: Viết test ma trận AC-4 (64 assert) và test cấu hình**

Ma trận viết tay: mỗi lần đọc ∈ {`bang` = giá trị đề xuất «2», `A` = «3», `B` = «4», `rong` = `{v:null, ly_do:"khong-suy-ra"}`}; 16
cặp × `lechTrenThe` {có, không} × `oDaCo` {có, không}; bảng kỳ vọng `{ketCuc, caBien}` viết literal trong test (không tính bằng hàm).
Thêm: `khoaGiaTri("02") === khoaGiaTri("2")`, `khoaGiaTri(" Căn hộ") === khoaGiaTri("căn hộ")`, `khoaGiaTri("0") === "0"`.
Cấu hình: tệp thật nạp được và có đúng hai gateway nói trên; bảng có `zai/x` → lỗi nêu «ngoài ba mã đã duyệt»; hai model trùng → lỗi.
Tên ca bắt đầu `AC-4` / `cau-hinh` để `cham.sh` lọc.

- [ ] **Step 2: Chạy, thấy đỏ** — `cd agent && node --import tsx --test --test-name-pattern='AC-4|cau-hinh' tests/cham-bong-bo-sung-tin.test.ts` → FAIL (module chưa có).

- [ ] **Step 3: Viết `cau-hinh.ts`, `ket-cuc.ts` và tệp cấu hình**

Tệp: `{"phien_ban":1,"prompt_version":"cb-v1","tran_usd":3,"model":[{"khoa":"haiku","gateway":"anthropic/claude-haiku-5.5","duong":["anthropic","gateway"],"gia_vao":0.1,"gia_ra":0.5},{"khoa":"deepseek","gateway":"deepseek/deepseek-v4.1-flash-1017","duong":["gateway"],"gia_vao":0.3,"gia_ra":1.2}]}`
(giá chép `agent/config/doc-gop-s03.json`). `ketCuc`: có `v===null` → `bo_trong`; khoá hai lần khác nhau → `lech_hai_lan`; bằng nhau
và bằng khoá đề xuất → `khop`; còn lại `bac_dong_thuan`. `laCaBien = k !== "khop" || lechTrenThe`. `oDaCo` không vào hai hàm.

- [ ] **Step 4: Chạy lại, thấy xanh** — cùng lệnh → PASS. Rồi `cd agent && npx tsc --noEmit` → 0 lỗi.

- [ ] **Step 5: Commit** — `feat(agent): NB1 cấu hình và luật kết cục chấm bóng`.

### Task 2: Lời nhắc năm ô và một lần đọc

**Files:**
- Create: `agent/src/enrich/cham-bong/prompt.ts`
- Create: `agent/src/enrich/cham-bong/doc.ts`
- Test: `agent/tests/cham-bong-bo-sung-tin.test.ts` (ca `AC-2 …`, `AC-3 …`)

Phục vụ E2, E3. `independent: false`.

**Interfaces — Consumes:** `OCham`, `ModelCham`, `Doc` (Task 1); `tuyChonGui`, `modelSo`, `DUONG_ANTHROPIC` (`doc-gop-s03/cau-hinh.ts`);
`phanLoaiLoi`, `chuoiLoi` (`runtime/loi-nha-cung-cap.ts`); `trichCoThat` (`enrich/luat-trich-dan.ts`); `soToken`, `RecordCall`.
**Produces:**
- `RANH_BAI = { mo: "<<<BAI_GOC", dong: "BAI_GOC>>>" }`; `type DauVao = { text: string; group_name: string | null; o: OCham[] }`.
- `loiNhac(d: DauVao): { system: string; user: string; sha: string }` — `sha` = sha256 của `system + "\n" + user`. User gồm tên nhóm,
  danh sách ô cần đọc, rồi khối bài giữa hai ranh giới. KHÔNG nhận tham số nào chứa đề xuất.
- `type GoiModel = (m: ModelCham, duong: Duong, p: { system: string; user: string }) => Promise<{ text: string; vao: number | null; ra: number | null }>`
  — `goiModelThat` (anthropic SDK / `generateText` + `tuyChonGui`, `temperature` chỉ ở gateway, `max_tokens` 1000, trần 120 s).
- `type LanDoc = { ok: true; o: Record<OCham, Doc & { trich: string; can_cu: string }>; vao; ra; usd; ms; duong } | { ok: false; loi: string; vao; ra; usd; ms; duong }`.
- `docMot(o: { model: ModelCham; dauVao: DauVao; goi: GoiModel; recordCall: RecordCall; trace: string }): Promise<LanDoc>` — đúng một
  dòng `recordCall` mỗi lời gọi (ok hay lỗi); đường đầu trong `model.duong` có khoá môi trường; tự lùi sang đường kế khi lỗi lớp dừng.
- `kiemO(f: OCham, raw: unknown, chu: string): Doc & { trich: string; can_cu: string }`.

- [ ] **Step 1: Viết test AC-2 và AC-3**

AC-3 — 8 ca của E3, mỗi ca một assert trên `kiemO`: trích có thật → giữ; trích vắng trong bài → `trich-gia`; trích khác hoa thường/khoảng
trắng → giữ; `property_type` «apartment» → giữ; «chung_cu» → `ngoai-tu-vung`; `bathrooms` «2» → giữ; «2-3» → `khong-phai-so`; `v:null`
→ `khong-suy-ra`. Thêm: JSON bọc ```` ```json ```` đọc được; JSON hỏng → `docMot` trả `ok:false, loi:"json-hong"` và vẫn ghi một
dòng sổ `ok:false`.
AC-2 — `GoiModel` giả bắt `{system,user}` thật: bài dài 420 ký tự nằm nguyên văn giữa `RANH_BAI`; tên từng ô có trong user; phần ngoài
khối không chứa «DEXUAT_CANH_x» (thẻ canh, đề xuất không có trong bài) và không chứa toàn bộ lời nhắc ở thẻ canh; `sha` khớp tính lại.
Đối chứng dương: thẻ có «2» trong bài vẫn xanh.

- [ ] **Step 2: Chạy, thấy đỏ** — `--test-name-pattern='AC-2|AC-3'` → FAIL.

- [ ] **Step 3: Viết `prompt.ts`, `doc.ts`**

Lời nhắc: vai người gắn nhãn tin BĐS; mỗi ô trả `{"v": giá trị|null, "trich": đoạn nguyên văn của chữ bài, "can_cu": một câu}`; chỉ
điền khi chữ bài nói thẳng (không suy từ kiến thức nghề, không ảnh); loại hình chỉ năm mã `apartment|house|land|room|commercial`;
`bathrooms`, `bedrooms` số nguyên (studio = 0 phòng ngủ); `block_raw` mã toà như bài viết; `street_raw` tên đường/phố như bài viết;
trả MỘT object JSON đủ đúng các ô được hỏi. Kiểm: `trich` không `trichCoThat` → `trich-gia`; số không khớp `^\d+$` → `khong-phai-so`.
Chi phí lời gọi: `(vao*gia_vao + ra*gia_ra)/1e6`.

- [ ] **Step 4: Xanh** — cùng lệnh → PASS; `npx tsc --noEmit` → 0 lỗi.

- [ ] **Step 5: Commit** — `feat(agent): NB1 lời nhắc năm ô và lần đọc mù`.

### Task 3: Đọc DB và bộ chạy (khoá băm, trần, sổ gọi, không ghi tin)

**Files:**
- Create: `agent/src/enrich/cham-bong/doc-db.ts`
- Create: `agent/src/enrich/cham-bong/kho.ts`
- Create: `agent/src/enrich/cham-bong/chay.ts`
- Test: `agent/tests/cham-bong-bo-sung-tin.test.ts` (ca `AC-1`, `AC-5`, `AC-6`, `AC-7`, `AC-8` — dùng `withTx` của `tests/helpers/db.ts`)

Phục vụ E1, E5, E6, E7, E8. `independent: false`.

**Interfaces — Consumes:** Task 1, Task 2; `withTx`, `insertOffer`, `insertProposal` (`tests/helpers/db.ts`).
**Produces:**
- `type Truy = (sql: string, args?: unknown[]) => Promise<{ rows: any[] }>`.
- `moDocChiDoc(url: string): Promise<{ truy: Truy; dong: () => Promise<void> }>` — `BEGIN READ ONLY` + `SET LOCAL statement_timeout='60s'`.
- `type TheCham = { review_id: number; offer_id: string; source: string; text: string; group_name: string | null; de_xuat: { id: number; field: OCham; value: string; source: "e1_rule" | "e2_llm"; o_da_co: boolean }[] }`.
- `docThe(truy: Truy): Promise<{ the: TheCham[]; bo_qua: { review_id: number; ly_do: "khong-tin" | "khong-bai" }[] }>` — thẻ
  `item_type='agent_output' AND status='pending'` có ≥ 1 đề xuất `status='queued'`; bài = `stg_zalo_posts.text` bản `captured_at` mới
  nhất trong `post_ids`; `o_da_co` = `field_provenance #>> '{<field>,tier}' = 'observed'`.
- `xepThe(the: TheCham[]): TheCham[]` — theo chỉ số nhỏ nhất của ô thẻ có trong `THU_TU_O`, rồi `review_id`.
- `khoaDung(t: TheCham, m: ModelCham, promptVersion: string): string` — sha256 của `text`, `group_name`, tập ô (đã xếp), `m.gateway`, `promptVersion`.
- `type Kho = { co(k: string): LanDoc & { ok: true } | undefined; ghi(k: string, d: LanDoc & { ok: true }): void }` — `moKho(duong)`; chỉ lưu lời đọc ok.
- `type CheDo = "thu" | "ap"`.
- `chay(o: { truy: Truy; cauHinh: CauHinhCham; cheDo: CheDo; goi: GoiModel; recordCallDb: RecordCall; thuMuc: string; runId: string; tranUsd?: number; gioiHanThe?: number }):
  Promise<TongKet>` — chế độ `thu` ghi sổ vào `<thuMuc>/<runId>/so-goi.jsonl`, `ap` gọi `recordCallDb`; mỗi đề xuất hai dòng
  `ket-qua.jsonl` `{run_id, review_id, offer_id, proposal_id, field, source, value_de_xuat, model, khoa, lan_doc, sha_loi_nhac, o_da_co}`
  rồi một dòng `{loai:"ket-cuc", proposal_id, ket_cuc, lech_tren_the, ca_bien}` khi đủ hai lần đọc ok; dừng trước lời gọi làm vượt trần.
- `type TongKet = { run_id; che_do; so_the; the_du; the_cho; loi_goi; goi_moi; dung_lai; usd; dung_vi_tran: boolean; bo_qua }` ghi `tong-ket.json`.

- [ ] **Step 1: Viết fixture E1 và test AC-1, AC-5..AC-8**

Fixture `gieoE1(c)` (14 thẻ của E1: 10 thẻ chờ phủ năm ô và E1/E2, một thẻ ba ô, một thẻ hai đề xuất loại hình khác giá trị, một thẻ
S05; 1 thẻ «Để sau» (`status='deferred'`); 1 thẻ đề xuất đã áp; 2 thẻ không đề xuất; bài > 300 ký tự). Mỗi assert như `expected` của
E1, E5–E8 (số 20 lời gọi, 26 kết quả, 7/13, …). E5 băm: `SELECT md5(string_agg(t::text, '|' ORDER BY t::text)) FROM <bảng> t` cho mọi
`pg_tables` schemaname `public` trừ `ai_calls`; đối chứng dương UPDATE `sale_offers.bathrooms` và INSERT `field_assertions` làm lệch.
Test truyền `truy` = client của `withTx` (giao dịch thử có ghi), `recordCallDb` ghi vào `ai_calls` qua chính client đó; một ca riêng
mở `moDocChiDoc` trên DB thử và thử `INSERT` → bị từ chối «read-only transaction». Review Focus 1, 3 (so `khoaGiaTri` với
`SELECT assertion_value_key($1)` trên 6 giá trị), 4, 5 có ca riêng.

- [ ] **Step 2: Đỏ** — `cd agent && bash ../db/db-thu.sh oneinvest_suite_agent --chay node --import tsx --test --test-name-pattern='AC-1|AC-5|AC-6|AC-7|AC-8' tests/cham-bong-bo-sung-tin.test.ts` → FAIL.

- [ ] **Step 3: Viết `doc-db.ts`, `kho.ts`, `chay.ts`**

Mỗi thẻ × mỗi model: `khoaDung` có trong kho → dùng lại, không gọi, không ghi sổ; không có → kiểm trần → `docMot` → append ngay
(`appendFileSync`) dòng kết quả và dòng sổ (thử). Lời đọc lỗi không vào kho. Hai đề xuất cùng ô dùng chung `o[field]` của cùng lần đọc.

- [ ] **Step 4: Xanh** — cùng lệnh → PASS; `npx tsc --noEmit` → 0 lỗi.

- [ ] **Step 5: Commit** — `feat(agent): NB1 bộ chạy chấm bóng chỉ đọc, khoá dùng lại, trần chi phí`.

### Task 4: Báo cáo, kê 232 thẻ, CLI

**Files:**
- Create: `agent/src/enrich/cham-bong/bao-cao.ts`
- Create: `agent/src/enrich/cham-bong/ke-the-trong.ts`
- Create: `agent/scripts/cham-bong-bo-sung-tin.ts`
- Test: `agent/tests/cham-bong-bo-sung-tin.test.ts` (ca `AC-9`, `AC-10`)

Phục vụ E9, E10. `independent: false`.

**Interfaces — Consumes:** `TongKet`, dòng `ket-qua.jsonl` (Task 3); `Truy`, `moDocChiDoc`.
**Produces:**
- `baoCao(thuMucLuot: string): BangBaoCao` (chỉ đọc tệp) và `inBaoCao(b: BangBaoCao): string`; `BangBaoCao` có `o[field][ket_cuc][source]`,
  `chua_du` (đề xuất thiếu hai kết quả ok), `o_da_co`, `the_du`, `the_cho`, `goi`, `vao`, `ra`, `usd`; tổng ô + `chua_du` = số đề xuất.
- `CAU_DEM_THE_TRONG: string` (SQL đếm độc lập) và `keTheTrong(truy: Truy): Promise<{ dong: { loai: string; de_xuat_cung_tin: string; luot: string; so: number }[]; tong: number; tong_sql: number }>`.
- CLI: `tsx scripts/cham-bong-bo-sung-tin.ts chay --che-do thu|ap [--gioi-han 30] [--tran 3]` · `bao-cao <run_id>` · `ke-the-trong`.
  `chay --che-do ap` từ chối khi cây git bẩn hoặc nhánh khác `main` (lượt áp từ `main`, mục 50). Thiếu khoá đường → thoát 5 trước lời gọi đầu.

- [ ] **Step 1: Test AC-9, AC-10** — như `expected` E9 (sau lượt có 2 lời gọi lỗi; `baoCao` với `GoiModel` ném nếu bị gọi) và E10
  (7 thẻ trống, bảng kê viết tay, `tong === tong_sql === 7`, `review_queue` băm trước = sau).
- [ ] **Step 2: Đỏ** — `--test-name-pattern='AC-9|AC-10'` qua `db-thu.sh` → FAIL.
- [ ] **Step 3: Viết ba tệp.**
- [ ] **Step 4: Xanh** — cùng lệnh → PASS; `npx tsc --noEmit` → 0 lỗi.
- [ ] **Step 5: Commit** — `feat(agent): NB1 báo cáo chấm bóng, kê thẻ trống, lệnh chạy`.

### Task 5: Probe của hồ sơ và đột biến

**Files:**
- Create: `_acceptance/cham-bong-bo-sung-tin/probes/cham.sh`
- Create: `_acceptance/cham-bong-bo-sung-tin/probes/dot-bien.sh`
- Create: `_acceptance/cham-bong-bo-sung-tin/probes/thu-30.sh`

Phục vụ E1–E11 (cách chạy), điều khoản đo-mới-phải-đỏ. `independent: false` (đọc mọi task trên).

- [ ] **Step 1: `cham.sh AC-n`** — `cd agent && bash ../db/db-thu.sh oneinvest_suite_agent --chay node --import tsx --test --test-name-pattern="^AC-n( |$)" tests/cham-bong-bo-sung-tin.test.ts`,
  rồi `dot-bien.sh AC-n`; thoát 0 chỉ khi ca xanh VÀ mọi đột biến của AC-n đỏ với thông điệp ghim.
- [ ] **Step 2: `dot-bien.sh AC-n`** — chép `agent/src/enrich/cham-bong/` sang `agent/src/enrich/cham-bong.dot-bien/` (cùng độ sâu, import
  tương đối giữ nguyên; `trap` xoá), áp một `sed` mỗi đột biến theo bảng (AC-1: đọc cả `deferred`, một model hai lần, gọi theo đề xuất;
  AC-2: chèn giá trị đề xuất vào user, dùng `left(text,300)`; AC-3: bỏ `trichCoThat`; AC-4: so chuỗi thô, xếp A/B thành `bac_dong_thuan`,
  bỏ `lechTrenThe` khỏi `laCaBien`; AC-5: gọi `apply_enrichment` ở chế độ áp; AC-6: bỏ ghi sổ khi lỗi; AC-7: bỏ khoá băm, lưu lời lỗi;
  AC-8: kiểm trần sau khi gọi; AC-9: đếm theo thẻ, gộp lỗi vào `bo_trong`; AC-10: lấy cả thẻ có đề xuất), chạy test với
  `CHAM_BONG_SRC=cham-bong.dot-bien` (tệp test import động theo biến này, mặc định `cham-bong`), mong đỏ và grep thông điệp ghim.
- [ ] **Step 3: `thu-30.sh`** — `tsx agent/scripts/cham-bong-bo-sung-tin.ts chay --che-do thu --gioi-han 30`, băm ba bảng tin/đề xuất/thẻ
  và đếm `field_assertions` trước–sau trên DB máy thu (chỉ đọc), in bảng báo cáo; đỏ khi chi phí > 0,1 USD hay băm lệch.
- [ ] **Step 4: Chạy `cham.sh AC-1` … `AC-10`** (giữ khoá đúng luật đợt nếu hook đòi) → mọi lệnh thoát 0.
- [ ] **Step 5: Commit** — `test(acceptance): NB1 probe chấm bóng và đột biến`.

### Task 6: Kiểm module, chuyển `implemented`

- [ ] `/verify` cho `agent/` (`npx tsc --noEmit`, `npm test` trên DB thử của riêng lượt).
- [ ] Sàn thiết kế S3 (khối DESIGN-FLOOR-S3) — vòng không có trang HTML, kỳ vọng không in.
- [ ] Contract `status: implemented`, commit; S4 xin lượt `s4` khi máy rảnh (tải < 4).
