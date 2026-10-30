# enrich-chay-sau-nap Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:executing-plans (feature-loop T2, thực thi tuần tự trong
> vòng chính — chỉ một task độc lập nên không fan-out). Steps dùng checkbox (`- [ ]`).

**Goal:** Enrich chạy mỗi đêm cuối `zalo-import-daily.sh`, mỗi tin một giao dịch ngắn, đếm lỗi LLM, tổng kết đếm đúng,
không bốc lại tin đã thử.

**Architecture:** `runEnrich` tách mỗi tin thành pha đọc (E1 + LLM, ngoài giao dịch) và pha ghi bọc trong
`opts.giaoDich`; bộ đếm cộng từ `RETURNING`/kết quả `apply_enrichment`. Luật mã thoát + dòng tổng kết nằm ở một môđun
thuần (`tong-ket.ts`) để test đơn vị gọi được mà không chạy CLI. CLI `enrich-run.ts` cấp `giaoDich` BEGIN/COMMIT. Job
thêm một bước `job_run` sau khi nhả khoá nạp.

**Tech Stack:** TypeScript (node --test + tsx), pg, bash (`scripts/lib/job-step.sh`).

**Spec:** `docs/superpowers/specs/2026-10-30-enrich-chay-sau-nap-design.md` · hợp đồng
`_acceptance/enrich-chay-sau-nap/contract.md` (approved, Mạnh 30/10) · `evals.yaml` E1–E13.

## Global Constraints

- LLM-off-data-path: `run.ts` không có câu `UPDATE sale_offers|properties` (enrich-guard).
- Hỏi-1 (Mạnh duyệt): hỏng = `llmLoi + llmKhongDoc`; `llmGoi ≥ 1` và `2*hong >= llmGoi` → 3; có `loiGhi` → 2 (thắng 3);
  hỏng > 0 mà dưới nửa → 0 kèm dòng `⚠ LLM hỏng m/n`; lỗi ngoài vòng tin → 1.
- Hỏi-2: giữ `apply_enrichment` cho direct/corroborated; `LIMIT` mặc định 50.
- Hỏi-3: cửa sổ không bốc lại `CUA_SO_THU_NGAY = 30`.
- Dòng tổng kết chứa nguyên văn `LLM hỏng m/n (lỗi a · không đọc được b)`.
- Dấu đã thử: `ops_audit (actor 'enrich-run:<runId>', action 'enrich:thu', detail {offer_id, run_id})`, trong giao
  dịch của tin; không ghi khi lời gọi LLM ném lỗi.
- Không chạy enrich lên `oneinvest` :5433; phép đo đầu-cuối chỉ trên `oneinvest_u2_enrich` (từ chối tên `oneinvest`).
- Bước job nằm sau dòng «Từ đây trở xuống là làn Claude»; phần nạp không đổi byte nào.

## Review Focus

1. Lời gọi LLM ném lỗi ở một tin mà E1 tin đó vẫn có → E1 vẫn ghi, tin KHÔNG có `enrich:thu` (Task 2, ca EC-AC-9-don).
2. Tin không cần LLM (E1 đủ) → `llmGoi` không tăng, vẫn có `enrich:thu`, mã 0 (hàng «0/0» của ma trận, Task 2).
3. Lượt chạy lại đúng tin đã xong → `deXuatMoi 0`, `daAp 0`, không thẻ mới, không dòng bảng mới (EC-AC-4, Task 2).
4. `--offers` với id không tồn tại → 0 tin, mã 0, không lỗi (Task 3, ca trong itest «offers rỗng»).
5. Job: bước enrich gặp `agent/` vắng (cd hỏng) → `JOB FAIL … enrich-run mã 1`, không treo (Task 5 — ma trận AC-7 dùng
   mã giả; ca cd hỏng là hệ quả `job_run`, ghi nhận, không thêm ca).

---

### Task 1: Môđun tổng kết + giao dịch mỗi tin trong `runEnrich`

**independent: false** · phục vụ E2, E3, E5, E7 · verify: `cd agent && npx tsc --noEmit -p . 2>&1 | grep -v 'runtime/(loop|models)' ; npm test`

**Files:**
- Create: `agent/src/enrich/tong-ket.ts`
- Modify: `agent/src/enrich/run.ts` (types `LlmFn`, `RunEnrichOpts`; `selectOffers`; vòng `for` của `runEnrich`)

**Interfaces — Produces:**
- `tong-ket.ts`:
  - `export type DemLuot = { tin: number; deXuatMoi: number; daAp: number; choDuyet: number; the: number; llmGoi: number; llmLoi: number; llmKhongDoc: number; loiGhi: { offer_id: string; loi: string }[] }`
  - `export function demRong(): DemLuot`
  - `export function maThoat(d: DemLuot): 0 | 2 | 3`
  - `export function dongTongKet(d: DemLuot): string[]` — dòng 1 `tin: n | đề xuất mới: x | đã áp: y | chờ duyệt: z | thẻ đang chờ: t`; dòng 2 `LLM hỏng m/n (lỗi a · không đọc được b)`; thêm `⚠ LLM hỏng m/n` khi 0 < hỏng < nửa; thêm `✗ ghi lỗi k tin: <id>(<loi>), …` khi có `loiGhi`.
- `run.ts`:
  - `LlmFn` trả thêm `loi?: string`.
  - `export type GiaoDich = <T>(fn: () => Promise<T>) => Promise<T>`; `RunEnrichOpts.giaoDich?: GiaoDich`.
  - `export function giaoDichSavepoint(c: pg.Client): GiaoDich` — `SAVEPOINT enrich_tin` / `RELEASE` / lỗi:
    `ROLLBACK TO SAVEPOINT enrich_tin; RELEASE` rồi ném lại. Mặc định khi vắng `giaoDich`.
  - `export const CUA_SO_THU_NGAY = 30`.
  - `runEnrich` trả `{ routed, summary, reviewIds, dem: DemLuot }`.
- Luồng mỗi tin: resolve → (cần LLM) `llmGoi++`, gọi, `loi` → `llmLoi++`, `result null` không `loi` → `llmKhongDoc++`
  → `heldFields` → `routeFields` → `try { await giaoDich(ghi) } catch (e) { dem.loiGhi.push({offer_id, loi: e.code ?? e.name}) }`.
  `ghi` = INSERT (đếm `RETURNING`; `choDuyet` khi route review và status queued) → `apply_enrichment` (cộng kết quả vào
  `daAp`) → `syncReview` → INSERT `enrich:thu` khi không `loi`. `the` = số thẻ khác nhau trong `reviewIds` lúc kết.
  Bộ đếm của tin chỉ cộng vào `dem` SAU khi `giaoDich` trả về (tin lui lại thì không cộng).
- `selectOffers` nhánh backlog thêm điều kiện cho phần không-hoãn:
  `NOT EXISTS (SELECT 1 FROM ops_audit a WHERE a.action = 'enrich:thu' AND a.detail->>'offer_id' = o.offer_id AND a.at > now() - make_interval(days => $2))`.
  Tin hoãn (`loose`) vẫn vào bất kể dấu; `--offers` không xét dấu.

- [ ] Step 1: viết `tong-ket.ts` + sửa `run.ts` như trên.
- [ ] Step 2: `cd agent && npm test` — bộ cũ xanh không sửa ca (E7).
- [ ] Step 3: commit `feat(agent): enrich mỗi tin một giao dịch, đếm thật, dấu đã thử`.

### Task 2: Test đơn vị `enrich-giao-dich.test.ts`

**independent: false** (cần Task 1) · phục vụ E2, E3, E5 · verify: `cd agent && node --import tsx --test tests/enrich-giao-dich.test.ts`

**Files:** Create `agent/tests/enrich-giao-dich.test.ts` (khuôn `offerWithPost` của `enrich-db.test.ts`; chạy trong `withTx`).

**Interfaces — Consumes:** `runEnrich`, `giaoDichSavepoint`, `maThoat`, `dongTongKet`, `DemLuot` từ Task 1.

Công cụ test:
- `clientHong(c, offerId, k)` — Proxy của `pg.Client` mà `query` ném `Object.assign(new Error('boom'), {code:'XX000'})` ở
  câu ghi (`INSERT|UPDATE|SELECT apply_enrichment`) thứ k kể từ lúc tin `offerId` bắt đầu ghi (nhận biết qua tham số
  `$2 = offerId` của INSERT đề xuất đầu tiên).
- `giaoDichDem` — bọc `giaoDichSavepoint`, đếm độ sâu; stub LLM ghi `doSau` lúc được gọi.

Ca:
- `EC-AC-2 cô lập lỗi ghi`: ba tin cần LLM, tin hai hỏng ở câu ghi thứ 2 → tin hai: 0 đề xuất / 0 thẻ pending /
  0 `field_assertions` mang run_id / 0 `enrich:thu`; tin một, ba đủ; `dem.loiGhi` = `[{offer_id: tin2, …}]`;
  `maThoat(dem) === 2`; độ sâu lúc LLM gọi luôn 0.
  Chiều đỏ: bản sao `run.ts` (tạm trong `os.tmpdir`, import động) thay `await giaoDich(ghi)` bằng `await ghi()` →
  ca phải ném với thông điệp chứa `tin hỏng để lại đề xuất`.
- `EC-AC-3 ma trận LLM × ghi`: mảng viết trước 6 hàng `{ten, llm: ('ok'|'loi'|'rac')[] | null, hong, goi}`:
  `0/0` (E1 đủ, không gọi) · `0/3` · `1/3` (một `loi`) · `2/3` (một `loi`, một `rac`) · `loi 3/3` · `rac 3/3`; mã kỳ
  vọng ghi lành `[0,0,0,3,3,3]`, tin hai ghi hỏng `[2,2,2,2,2,2]`. Đếm số assert mã = 12. Dòng tổng kết chứa
  `LLM hỏng ${hong}/${goi} (lỗi a · không đọc được b)`; hàng `1/3` có dòng `⚠ LLM hỏng 1/3`; hàng thoát 3 vẫn có đề xuất
  `e1_rule` của run_id. Chiều đỏ: hai bản sao `maThoat` (xét LLM trước loiGhi → `chết LLM che lỗi ghi`; bỏ
  `llmKhongDoc` → `không đọc được hết mà thoát 0`), mỗi bản phải làm ma trận đỏ với đúng thông điệp.
- `EC-AC-4 đếm đúng`: lượt một → `deXuatMoi/daAp/choDuyet` = `count(*)` theo run_id tổng / `status='applied'` /
  `status='queued' AND route='review'`; lượt hai cùng tin, run_id khác → `deXuatMoi 0`, `count(*)` bảng không tăng.
  Chiều đỏ: đếm theo `summarizeRun(routed)` cho lượt hai → khác 0, thông điệp `lượt hai đếm đề xuất trùng`.
- `EC-AC-9-don`: tin LLM `loi` có E1 → đề xuất e1 có, `enrich:thu` không; tin LLM ok → có đúng một `enrich:thu`.

- [ ] Step 1: viết test; Step 2: chạy — xanh; Step 3: commit `test(agent): ma trận giao dịch mỗi tin`.

### Task 3: CLI `enrich-run.ts`

**independent: false** (cần Task 1) · phục vụ E1, E4, E6, E12, E13 · verify: `cd agent && npx tsx scripts/enrich-run.ts --dry` với `LIMIT=2` chỉ trên DB thử (không gọi lên :5433 ở ngả ghi)

**Files:** Modify `agent/scripts/enrich-run.ts`.

- Client `new pg.Client({ connectionString: DB_URL, application_name: "enrich-run" })`.
- `--offers id1,id2` → `offerIds`.
- `llm` catch trả `{ result: null, model, tracePath: null, loi: e?.name ?? "Error" }`.
- `giaoDich` = BEGIN → fn → COMMIT; lỗi → ROLLBACK, ném lại. Không còn BEGIN bao cả lượt.
- In bảng định tuyến như cũ; ngả `--dry` in `summarizeRun` như cũ; ngả ghi in `dongTongKet(dem)`.
- `process.exitCode = DRY ? 0 : maThoat(dem)`; lỗi ngoài vòng → 1 như cũ.
- Đầu tệp: sửa chú thích «Chạy» thêm `--offers` và mã thoát.

- [ ] Step 1: sửa; Step 2: `npx tsc --noEmit` (bỏ hai lỗi tồn đọng loop/models); Step 3: commit `feat(agent): enrich-run giao dịch mỗi tin, --offers, mã thoát`.

### Task 4: Test đầu-cuối `enrich-cli.itest.ts` trên DB thử

**independent: false** (cần Task 3) · phục vụ E1, E4, E6, E12, E13 · verify: `config:executors.script.enrich_cli_thu`

**Files:** Create `agent/tests/enrich-cli.itest.ts` (đuôi `.itest.ts` nên `npm test` không quét).

- Đọc `ENRICH_DB_THU`; tên DB (đoạn sau `/` cuối) phải khớp `^oneinvest_[a-z0-9_]+$` — khác (gồm `oneinvest`) → ném
  `từ chối: DB thử phải khác oneinvest`.
- Máy chủ LLM giả `http.createServer` cổng 0, `POST /v1/chat/completions` trả JSON chat completion với `content` =
  `FIXTURES[0].output` (fixtures/llm-outputs.json); chế độ `500` trả 500; tuỳ `loiCho` = tập offer_id (nhận qua chuỗi
  tin trong prompt) để trả 500 riêng tin đó. Mỗi lời gọi: phiên khác đọc `SELECT xact_start FROM pg_stat_activity WHERE
  application_name='enrich-run' AND datname=current_database()` và `count(*) FROM enrichment_proposals WHERE run_id LIKE 'enrich-%'` → ghi lại.
- Chạy CLI bằng `spawnSync(process.execPath, ['--import','tsx','scripts/enrich-run.ts', ...])`, cwd `agent/`, env
  `DATABASE_URL`, `MTPLX_URL`, `LIMIT`.
- Gieo tin trên DB thử bằng `insertOffer` + `stg_zalo_posts` (commit thật — DB thử là bản bỏ đi), text không cho E1 đủ
  (để cần LLM). Mỗi ca dùng tiền tố id riêng.
- Ca: `EC-AC-1 giao dịch ngắn` (3 lời gọi, mọi `xact_start` null; từ lời gọi 2 đọc thấy đề xuất tin trước) ·
  `EC-AC-3 LLM chết trên CLI` (500 → exit 3, stdout `LLM hỏng 3/3`; đối chứng ok → exit 0, `LLM hỏng 0/3`) ·
  `EC-AC-4 tổng kết CLI khớp DB thử` (số trong stdout = count theo run_id; chạy lại → `đề xuất mới: 0`) ·
  `EC-AC-2 lỗi ghi trên CLI` (trigger BEFORE INSERT trên `enrichment_proposals` raise khi `offer_id = tin2`; exit 2;
  tin 1, 3 đọc được; tin 2: 0 đề xuất / 0 thẻ pending / 0 `enrich:thu`; xoá trigger cuối ca) ·
  `EC-AC-9 không bốc lại` (hai lượt không `--offers`, LIMIT 3: tập tin lượt hai ∩ lượt một = ∅; lượt ba với 500 cho
  một tin → tin đó không `enrich:thu`; đối chứng: tin hoãn gieo sẵn — đề xuất `queued/review` có `review_id` trỏ thẻ
  `dismissed` — vẫn có trong lượt dù đã có `enrich:thu`) · `offers rỗng` (`--offers khong_co` → exit 0, `tin: 0`).
- Chiều đỏ (E1, E12, E13): chép `agent/` (bỏ `node_modules` → symlink) vào thư mục tạm, đột biến một chỗ
  (`run.ts` gọi LLM trong `giaoDich` · `enrich-run.ts` giaoDich không ROLLBACK · `selectOffers` bỏ điều kiện
  `enrich:thu`), chạy cùng ca → phải đỏ với thông điệp ghim `LLM gọi trong giao dịch mở` /
  `tin sau tin hỏng không ghi được` / `lượt hai bốc lại tin đã thử`.

- [ ] Step 1: viết; Step 2: dựng DB thử + chạy executor — xanh; Step 3: commit `test(agent): enrich-run đầu-cuối trên DB thử`.

### Task 5: Bước job + test job

**independent: true** (chỉ chạm script bash và test của nó) · phục vụ E8, E9, E10, E11 · verify:
`node --test scripts/enrich-buoc-job.test.mjs scripts/zalo-import-job.test.mjs`

**Files:**
- Modify: `scripts/zalo-import-daily.sh` (thêm khối §4 của spec trước `exit "$JOB_RC"`)
- Create: `scripts/enrich-buoc-job.test.mjs`
- Modify: `scripts/zalo-import-job.test.mjs` (`NHAN` thêm `enrich-run`; shim nhận `*.ts`; `cay()` tạo `agent/`; chú
  thích dẫn chiếu hồ sơ này thay lời «bốn bước» của media-canonical-reso#AC-10)

`enrich-buoc-job.test.mjs` (khuôn zalo-import-job): shim node ghi `nhãn|$PWD|${LIMIT:-}|lock=<có/không>` (khoá =
`$LOCKP`, đường tuyệt đối); `FAKE_OTHER_LOCK=1` → khi bước enrich-run, shim `mkdir $LOCKP` và ghi `pid` = `424242`.
Ca:
- `EC-AC-6 dãy bước`: lành → nhãn đúng `[import-airbnb, transform-zalo, transform-media, refresh-bait-gap, enrich-run]`;
  cwd enrich = `<cây>/agent`, LIMIT 50; `ENRICH_LIMIT=7` → 7; nạp hỏng → không có enrich-run. Chiều đỏ: bản sao bỏ dòng
  `job_run … enrich-run` → `thiếu bước enrich-run`.
- `EC-AC-7 mã job`: ma trận 4 dòng viết trước (spec E9), đếm 4. Chiều đỏ: bản sao gọi `enrich_run` trần →
  `mã enrich bị nuốt`.
- `EC-AC-8 nhả khoá`: enrich thấy `lock=khong`, transform-zalo thấy `lock=co`; với `FAKE_OTHER_LOCK=1`, sau job khoá còn,
  `pid` = 424242. Chiều đỏ: bỏ `rm -rf "$LOCK_DIR"` → `enrich chạy khi còn giữ khoá nạp`; bỏ `trap - EXIT` →
  `xoá khoá của job khác`.

- [ ] Step 1: sửa script + hai test; Step 2: chạy verify — xanh; Step 3: commit `feat(scripts): zalo-import-daily chạy enrich sau transform`.
