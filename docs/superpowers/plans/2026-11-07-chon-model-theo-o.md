# PL30 chon-model-theo-o — Kế hoạch thi công

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Bộ đọc gộp tin S03 (chữ + mọi ảnh tệp + thẻ nhóm) ra 17 ô, model của từng ô chọn trong một tệp bảng; mặc định
Haiku 5.5, ô WC người duyệt; ghi `silver_labels` + `ai_calls`; lệnh chấm trên vàng.

**Architecture:** Mô-đun thuần `agent/src/enrich/doc-gop-s03/` (bảng chọn, prompt, đọc thẻ, gọi + gộp, chấm) và một lệnh
`agent/scripts/doc-gop-s03.ts` (`chay`, `cham`). Prompt `dg3-s03-v3` chép nguyên từ script đo. Model gọi qua một hàm tạo
model đưa vào được, để test thay bằng Gateway giả (`MockLanguageModelV4`).

**Tech Stack:** TypeScript strict, AI SDK 7 (`createGateway`, `generateText`), `pg`, `node --test` + `tsx`.

**Spec:** `docs/superpowers/specs/2026-11-07-chon-model-theo-o-design.md` · hợp đồng
`_acceptance/chon-model-theo-o/contract.md` (approved 07/11) · `evals.yaml`.

## Global Constraints

- Ba mã Gateway duy nhất: `anthropic/claude-haiku-5.5`, `zai/glm-5.3-flash`, `deepseek/deepseek-v4.1-flash-1017`.
- Mọi lời gọi: `providerOptions.gateway = { zeroDataRetention: true, disallowPromptTraining: true }`; DeepSeek thêm `only: ["baseten"]`. Đặt trong mã theo mã Gateway, bảng không tắt được.
- `PROMPT_VERSION = "dg3-s03-v3"`; `PROMPT_SHA` = sha256 hex đầy đủ của `HUONG_DAN`.
- Gửi model: chữ bài nguyên văn (đã bỏ link như màn gắn nhãn), ảnh tệp snapshot, tên nhóm, thẻ nhóm. Không gửi `sender_*`, `agent_id`, nhãn vàng, `source_registry`, đường tệp.
- Luật 7: chỉ ghi `silver_labels` và `ai_calls`. Lệnh `cham` không ghi DB.
- Lệnh `chay` chỉ nhận tập theo `--lat` (+ `--split`) hoặc `--post`; không có đường chạy toàn S03 (Hỏi-1).
- Tiền: ước trước; trước mỗi lời gọi, đã chi + ước bài kế > trần thì dừng.
- Hỏi-3: thêm `agent/config/doc-gop-s03.json` vào `risk_tiers.t1_skip_globs` của `_acceptance/config.yaml`.

## Review Focus

1. Bảng chọn giao một ô cho model không khai → phải dừng trước lời gọi đầu (AC-3), không rơi về mặc định.
2. Bài không chữ và không ảnh → không gọi model (0 USD), dòng nhãn không sinh; lệnh in số bài bỏ.
3. Model trả JSON thiếu vài ô hoặc ô không phải object → `json_ok=false`, không ném; ô thiếu là null.
4. Hai model cho cùng bài mà một model lỗi → ô của model lỗi null, ô của model kia vẫn có; dòng nhãn model lỗi không ghi.
5. Ảnh tệp lớn hơn 5 MB hoặc sai định dạng → bỏ ảnh, đếm vào `anh_thieu`, không gửi.

Test cho từng dòng nằm ở Task 2 (1, 3, 4, 5) và Task 3 (2).

---

### Task 1: Bảng chọn model và kế hoạch gọi

`independent: false` · phục vụ E1 (phần T1), E2, E3

**Files:**
- Create: `agent/config/doc-gop-s03.json`, `agent/src/enrich/doc-gop-s03/cau-hinh.ts`, `agent/src/enrich/doc-gop-s03/o.ts`
- Modify: `_acceptance/config.yaml` (`risk_tiers.t1_skip_globs`)
- Test: `agent/tests/doc-gop-s03.test.ts`

**Interfaces — Produces:**
- `o.ts`: `FIELDS` (17 ô, thứ tự của script đo), `type Field`.
- `cau-hinh.ts`:
  - `GATEWAY_DUYET: readonly string[]` (ba mã).
  - `type CauHinh = { phien_ban: 1; mac_dinh: string; model: Record<string, { gateway: string; gia_vao: number; gia_ra: number }>; o: Partial<Record<Field, string>> }`.
  - `napCauHinh(duong?: string): { cauHinh: CauHinh; sha: string }` — mặc định đọc `agent/config/doc-gop-s03.json`; `sha` = sha256 hex của byte tệp; sai thì ném `Error` có tên chỗ sai.
  - `kiemCauHinh(x: unknown): CauHinh`.
  - `keHoach(c: CauHinh): { nhom: { khoa: string; gateway: string; gia: { vao: number; ra: number }; o: Field[] }[]; nguoi: Field[] }` — một nhóm mỗi khoá model có ô, thứ tự nhóm theo khoá.
  - `tuyChonGui(gateway: string): { gateway: { zeroDataRetention: true; disallowPromptTraining: true; only?: string[] } }`.

- [ ] **Step 1: Test `DGS-AC-2`** — `napCauHinh()` trên tệp thật: `keHoach` ra đúng một nhóm `gateway === "anthropic/claude-haiku-5.5"` với 16 ô, `nguoi` deepEqual `["bathrooms"]`. Chiều đỏ: bảng thiếu `o.bathrooms` → test phụ khẳng định `nguoi` rỗng và thông điệp `WC PHAI LA NGUOI DUYET` (assert ở ca kiểm tệp thật).
- [ ] **Step 2: Test `DGS-AC-3`** — ma trận viết trước 6 bảng sai, mỗi bảng `assert.throws(() => kiemCauHinh(x), /<tên chỗ sai>/)`:
  - `o.tang_hamm` → `/tang_hamm/`
  - `o.price_min_vnd: "qwen"` → `/qwen/`
  - model thiếu `gateway` → `/gateway/`
  - thiếu `gia_ra` → `/gia_ra/`
  - gateway `openai/gpt-6` → `/openai\/gpt-6/`
  - `o.kind: "ai-do"` → `/ai-do/`

  Một bảng đúng không ném.
- [ ] **Step 3: Test `DGS-AC-1-T1`** — đọc `_acceptance/config.yaml`, rút các dòng `- "…"` dưới `t1_skip_globs`. Khớp glob bằng `path.matchesGlob` của Node: `agent/config/doc-gop-s03.json` khớp ít nhất một mẫu; `agent/src/enrich/doc-gop-s03/doc.ts` không khớp mẫu nào. Thông điệp đỏ `BANG CHON CAN HO SO`.
- [ ] **Step 4: Chạy** `cd agent && node --import tsx --test tests/doc-gop-s03.test.ts` → FAIL (chưa có mô-đun).
- [ ] **Step 5: Viết** `o.ts`, `cau-hinh.ts`, tệp JSON (mac_dinh `haiku`, ba model, `o: { bathrooms: "nguoi" }`); thêm `"agent/config/doc-gop-s03.json"` vào `t1_skip_globs` kèm chú thích «PL30 Hỏi-3: đổi model là PR nhỏ».
- [ ] **Step 6: Chạy lại** → PASS; phá thử (bỏ dòng glob, bỏ `o.bathrooms`) → đúng thông điệp ghim, rồi hoàn lại.
- [ ] **Step 7: Commit** `feat(agent): bảng chọn model đọc gộp S03 (PL30)`.

### Task 2: Prompt, đọc thẻ, gọi và gộp

`independent: false` · phục vụ E1, E4 (phần cờ gửi), E6

**Files:**
- Create: `agent/src/enrich/doc-gop-s03/prompt.ts`, `the.ts`, `doc.ts`
- Test: `agent/tests/doc-gop-s03.test.ts` (thêm ca)

**Interfaces — Consumes:** Task 1. **Produces:**
- `prompt.ts`: `PROMPT_VERSION`, `HUONG_DAN` (chép nguyên từ `agent/scripts/doc-gop-3-model-s03.ts`), `PROMPT_SHA`, `tinNhan(t: The): ModelMessage[]`.
- `the.ts`:
  - `type The = { post_id: string; text_hash: string; group_name: string | null; group_note: string | null; text: string; anh: { tep: string; mime: string; sha256: string }[]; anh_thieu: number; item_id?: number; split?: string }`.
  - `docTheTheoLat(c: Q, lat: string, split?: "dev" | "test"): Promise<The[]>` và `docTheTheoPost(c: Q, postIds: string[]): Promise<The[]>`. Chỉ ảnh tệp (dùng `luotTuDong`/`danhSachAnh` của `pipeline/lib/vlm-anh.mjs`, trần 20 ảnh, ≤5 MB); không đọc `sender_*`, `agent_id`.
- `doc.ts`:
  - `type O = { v: string | number | null; cc: string | null; trich: string; trich_ok: boolean | null }`.
  - `type KetQuaGoi = { gateway: string; json: Partial<Record<Field, O>> | null; json_ok: boolean; error_kind: string | null; raw?: string; vao: number | null; ra: number | null; usd: number; usd_gateway: number | null; ms: number }`.
  - `type TaoModel = (gateway: string) => LanguageModel`; mặc định là `createGateway` của AI SDK.
  - `hoiGop(o: { gateway: string; gia: { vao: number; ra: number }; the: The; taoModel?: TaoModel; recordCall?: RecordCall; trace?: string }): Promise<KetQuaGoi>`: không ném; ghi `ai_calls` (`viec: "doc-gop-s03"`); `maxRetries: 0`; `providerOptions: tuyChonGui(gateway)`.
  - `gop(kq: Map<string, KetQuaGoi>, kh: KeHoach, chu: string): Record<Field, O & { gateway: string } | { nguoi: true }>`: ô lấy từ model được giao; `kiemTrich` cho `cc === "chu_bai"` dùng `trichCoThat` của `agent/src/enrich/luat-trich-dan.ts`.

- [ ] **Step 1: Test `DGS-AC-1`** — Gateway giả là `TaoModel` trả `MockLanguageModelV4`, ghi `modelId` và `providerOptions`:
  - GLM trả `price_min_vnd.v = 1111`; Haiku trả `price_min_vnd.v = 3400000000`, `area_m2.v = 62`.
  - Bảng A ({mac_dinh haiku, o.price_min_vnd glm, o.bathrooms nguoi}) → mã ghi được (sắp xếp) deepEqual `["anthropic/claude-haiku-5.5", "zai/glm-5.3-flash"]`, `gop(...).price_min_vnd.v === 1111`, `area_m2.v === 62`.
  - Bảng B → một mã, `price_min_vnd.v === 3400000000`.
  - Đỏ: `O KHONG LAY TU MODEL DUOC GIAO`.
- [ ] **Step 2: Test `DGS-AC-4-CO`** — với từng mã của ma trận ba mã, `providerOptions.gateway.zeroDataRetention === true`, `disallowPromptTraining === true`; deepseek `only` deepEqual `["baseten"]`, hai mã kia `only === undefined`. Đỏ: `DEEPSEEK KHONG QUA BASETEN`, `THIEU ZDR`.
- [ ] **Step 3: Test `DGS-AC-6`** — chữ `"Bán căn 2PN giá 3,4 tỷ"`; ô `price_min_vnd {cc chu_bai, trich "3,4 tỷ"}` → `trich_ok true`; ô `area_m2 {cc chu_bai, trich "62m2"}` → `trich_ok false`, `v` vẫn 62; ô `cc anh` → `trich_ok null`. Đỏ: `TRICH BIA KHONG BI DANH DAU`.
- [ ] **Step 4: Test Review Focus 1, 3, 4, 5**:
  - JSON thiếu ô thì `json_ok false`, ô null.
  - Một model ném `TypeError` thì `error_kind "TypeError"`, ô của nó null, ô model kia giữ.
  - Ảnh > 5 MB thì `anh_thieu` tăng (dùng thư mục tạm).
- [ ] **Step 5: Chạy** → FAIL; **viết** `prompt.ts`, `the.ts`, `doc.ts`; **chạy** → PASS; phá thử từng thông điệp ghim.
- [ ] **Step 6: Commit** `feat(agent): đọc gộp S03 — prompt, đọc thẻ, gọi theo bảng chọn, gộp ô (PL30)`.

### Task 3: Lệnh `chay` — ghi nhãn bạc, trần tiền

`independent: false` · phục vụ E3 (dòng lệnh), E4, E5, E7, E8

**Files:**
- Create: `agent/scripts/doc-gop-s03.ts`, `agent/src/enrich/doc-gop-s03/chay.ts`, `agent/tests/doc-gop-s03-db.itest.ts`
- Modify: `agent/tests/doc-gop-s03.test.ts`

**Interfaces — Produces:**
- `chay.ts`:
  - `type CoChay = { lat?: string; split?: "dev" | "test"; post?: string[]; tranUsd: number; cauHinh?: string; runId?: string; thu?: boolean }`.
  - `docCo(argv: string[]): CoChay` — chỉ nhận `--lat --split --post --tran-usd --cau-hinh --run-id --thu`; cờ khác thì ném `Error` tên cờ.
  - `chayLuot(o: { client: Q; co: CoChay; taoModel?: TaoModel; recordCall?: RecordCall; uocThe?: (t: The, gia: {vao:number; ra:number}) => number; log?: (s: string) => void }): Promise<{ the: number; goi: number; ghi: number; usd: number; conLai: number; dungTran: boolean; bo: number }>`.
- Ghi `silver_labels` theo `SQL_GHI_DOC` của `doc-toan-bo.ts` (cùng luật: JSON hỏng đọc lại, chi phí cộng dồn).
  - `model = "gateway:<mã>"`, `prompt_version = PROMPT_VERSION`.
  - `listing_intent` / `kind` từ ô được giao cho đúng model, không thì `unknown` / null.
  - `probabilities = { nguon: "doc-gop", cau_hinh_sha, prompt_sha, o_duoc_giao, o, so_anh, anh_thieu, token_vao, token_ra }`.
- Bỏ qua bài đã có nhãn `json_ok` cùng (post, text_hash, model, prompt_version).
- Bài không chữ và không ảnh → không gọi, cộng `bo`.

- [ ] **Step 1: Test `DGS-AC-8`** (thuần, `chayLuot` với client giả `query` trả rỗng):
  - (a) 10 thẻ, `uocThe` 0,003, trần 0,01 → `goi 0`, log chứa `uoc vuot tran`.
  - (b) trần 0,05, ước 0,003, Gateway giả cost `"0.02"` → `goi 3`, `conLai 7`, log chứa `con lai 7`.
  - (c) `docCo(["--toan-bo"])` và `docCo(["--all"])` ném.
  - Thêm Review Focus 2.
- [ ] **Step 2: Test `DGS-AC-3` dòng lệnh** — chạy `npx tsx scripts/doc-gop-s03.ts chay --lat x --tran-usd 0 --cau-hinh <tệp tạm sai>` → thoát 2, stderr chứa tên chỗ sai; không cần khoá Gateway (kiểm bảng trước khoá).
- [ ] **Step 3: Test DB `DGS-AC-4`, `DGS-AC-5`, `DGS-AC-7`** trong `BEGIN … ROLLBACK`, chạy trên DB thử của `dgs_db`:
  - Fixture: lát tạm `dgs-thu-<pid>`; `stg_zalo_posts` với `agent_id 'TK_THU_U'`, `sender_name 'NGUOI_DANG_X'`, `sender_id 'SENDER_ID_T'`; `media_files` trỏ hai ảnh PNG trong thư mục snapshot tạm (`SNAPSHOTS_DIR`) và một URL; `eval_labels` giá trị `VANG_Y`; `source_registry` real_name `TEN_THAT_Z`, tên miền `MIEN_THAT_W`, `source_ids ['SID_V']`.
  - Khẳng định theo `expected` của E4, E5, E7 trong `evals.yaml`.
- [ ] **Step 4: Chạy** → FAIL; **viết** `chay.ts` + script (lệnh con `chay`; khoá Gateway chỉ đòi khi thật sự gọi); **chạy** → PASS; phá thử.
- [ ] **Step 5: Commit** `feat(agent): lệnh chay đọc gộp S03 ghi nhãn bạc có trần tiền (PL30)`.

### Task 4: Lệnh `cham` + số thật trên test

`independent: false` · phục vụ E9, E10

**Files:**
- Create: `agent/src/enrich/doc-gop-s03/cham.ts`, `_acceptance/chon-model-theo-o/evidence/cham-test.json`
- Modify: `agent/scripts/doc-gop-s03.ts`, `agent/tests/doc-gop-s03.test.ts`, `agent/tests/doc-gop-s03-db.itest.ts`

**Interfaces — Produces:**
- `cham.ts`:
  - `chuan(f: Field, v: unknown): string | null` (chép từ script đo).
  - `bangCham(the, vang, ketQua): { o: Record<Field, { dung: number; n: number; phu: number; thua: number }>; dung: number; mau_so: number; json_hong: number; usd_the: number; giay_trung_vi: number }` — chỉ tính ô giao model, bỏ ô người.
  - `maSha(): string` — sha256 của nội dung các tệp `agent/src/enrich/doc-gop-s03/*.ts` (sắp tên) + `agent/scripts/doc-gop-s03.ts`.
- Lệnh `cham --split test|dev --tran-usd X [--ra <bảng.md>] [--tom-tat <json>]`: đọc thẻ và vàng (chỉ đọc), gọi model, không ghi DB.
- Tóm tắt JSON: `{ split, so_the, model, prompt_sha, cau_hinh_sha, ma_sha, dung, mau_so, dung_gop, dung_gop_bo_9991, usd_the, anh_thieu: { [item_id]: n }, luc }`. Không chữ bài, không tên.

- [ ] **Step 1: Test `DGS-AC-9`** (DB thử): lát vàng tạm 3 thẻ × 17 ô, Gateway giả trả bảng viết trước. Bảng khớp bảng tính tay: `listing_intent 3/3`, `price_min_vnd 2/3`, `bathrooms` không có trong `o`. Số dòng `silver_labels`, `ai_calls`, `eval_labels` trước = sau; tóm tắt không chứa chữ bài, không tên. Đỏ: `BANG CHAM LECH BANG TINH TAY`.
- [ ] **Step 2: Test `DGS-AC-10`** — đọc `evidence/cham-test.json`:
  - `prompt_sha === PROMPT_SHA`, `cau_hinh_sha === napCauHinh().sha`, `ma_sha === maSha()`, `mau_so === 23*16`;
  - `dung_gop >= 0.92`, `usd_the <= 0.0025`;
  - nhánh `0.90 ≤ x < 0.92` → `VUNG XAM — MANH PHAN`; `< 0.90` → `CHET DUOI 90`;
  - sai sha → `TOM TAT KHONG KHOP PROMPT` / `TOM TAT KHONG KHOP MA`.
- [ ] **Step 3: Viết** `cham.ts` + lệnh; chạy test 1 → PASS.
- [ ] **Step 4: Chạy thật** (sau khi mọi mã khác đã commit, vì `ma_sha`): ước trước, ghi sổ `research-local/do-3-model-s03/chi-phi.jsonl`, rồi
  `npx tsx --env-file=../.env scripts/doc-gop-s03.ts cham --split test --tran-usd 0.2 --tom-tat ../_acceptance/chon-model-theo-o/evidence/cham-test.json --ra <research-local>/bang/pl30-test.md`.
  Chạy test 2 → PASS hoặc nhánh vùng xám ghi trung thực.
- [ ] **Step 5: Commit** `feat(agent): lệnh chấm đọc gộp trên vàng + tóm tắt số thật (PL30)`.
