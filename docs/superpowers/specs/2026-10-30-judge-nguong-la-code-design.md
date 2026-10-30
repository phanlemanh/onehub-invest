# judge-nguong-la-code — ngưỡng ghép căn là code, LLM chỉ giải thích (PL25)

Hàng PL25 `docs/plan/lo-trinh.json` · hạng T2 · dãy P3 đợt dot0-cam-mau · Cổng Đáng: build (Mạnh, «Xếp theo bốn
làn», 30/10). Vùng mã đã hẹp: `agent/src/agents/judge-entity.ts`, `agent/scripts/judge-*.ts`, `agent/tests/judge-*`.

## Vấn đề

- **L14 — luật xác định nằm trong prompt.** `judgeEntityAgent.systemPrompt` ghi ba luật số («giá/m² lệch <15%, diện
  tích lệch <10%… >30%») rồi để Qwen 27B tự áp. Cùng một cặp, hai lần chạy có thể ra hai kết luận; không test nào
  khoá được luật; người duyệt không biết kết luận đến từ luật hay từ model.
- **Lần chấm không để lại model + trace trên thẻ.** `judge-run.ts` chỉ ghi `ai_suggestion/ai_reasoning/ai_confidence`.
  Sổ `ai_calls` (PL29) có model + trace của cuộc gọi, nhưng thẻ không trỏ tới cuộc gọi nào.
- **Ứng viên không sinh thẻ.** Thẻ `entity_match` chỉ được seed một lần ở migration 029. `judge-run` chỉ chạy trên thẻ
  đang chờ; cặp `needs_llm` mới của `resolve-properties` không bao giờ thành thẻ. Số hôm nay (DB local 30/10): 7 cặp
  `needs_llm`, 11 thẻ chờ, 1 thẻ đã bác (con số 134 trong `vi_sao` của hàng là số lúc cắt lượt).

## Thiết kế

### 1. Ngưỡng là hằng trong code — `apNguong(pair)` (judge-entity.ts)

```
NGUONG = { giaM2YesMax: 0.15, dienTichYesMax: 0.10, giaM2NoMin: 0.30 }   // giữ nguyên ba số của prompt cũ
lech(x, y) = |x − y| / max(x, y)                                         // cùng công thức lọc Stage B
apNguong(pair) → { same_house: "yes"|"no"|"unsure", ly_do: LyDo[], lech: { gia_m2, dien_tich } }
```

Công thức lệch lấy đúng phép đo của bộ dựng ứng viên (`pipeline/resolve-properties.mjs`: `abs(a-b)/GREATEST(a,b)`),
nên «lệch 15%» trên thẻ và trong bộ lọc Stage B cùng nghĩa; đối xứng A↔B. So ngưỡng chặt (`<`, `>`): lệch đúng bằng
ngưỡng không ra yes, không ra no.

Thứ tự luật (đúng ba câu của prompt cũ, áp tất định):

1. **no** khi một trong ba: giá/m² lệch > `giaM2NoMin`; cả hai có phường và khác phường; cả hai có loại hình (khác
   `unknown`) và khác loại hình.
2. **yes** khi đủ cả bốn: giá/m² lệch < `giaM2YesMax`; diện tích lệch < `dienTichYesMax`; cả hai có phường và cùng
   phường; cả hai có loại hình và cùng loại hình.
3. **unsure** mọi trường hợp còn lại — kể cả thiếu số liệu, hay chỉ một bên có phường/loại hình (thiếu không bao giờ
   thành «khác»).

So phường: chuẩn hoá chữ thường, bỏ dấu, gộp khoảng trắng, bỏ tiền tố «phường/p.». `ly_do` là mã + câu tiếng Việt
mang SỐ ĐO (vd «giá/m² lệch 12%»), không mang số ngưỡng.

### 2. LLM chỉ viết lời giải thích

- `systemPrompt` mới: «máy đã kết luận theo luật; viết 1–3 câu tiếng Việt giải thích cho người duyệt; không được đổi
  kết luận; trả JSON `{"giai_thich": "..."}`». Không con số ngưỡng nào trong prompt.
- `buildJudgeInput(pair, ketLuan)` đưa dữ liệu hai tin + kết luận máy + `ly_do` (đã mang số đo) — không ngưỡng.
- `parseGiaiThich(output)` chỉ rút `giai_thich`. Model trả gì khác (kể cả `same_house` trái kết luận) đều bị bỏ: kết
  luận trên thẻ LUÔN là của `apNguong`.

### 3. Mỗi lần chấm ghi model + trace lên thẻ

`judge-run` gọi `runAgent(..., deps.recordCall = bọc(recordCallDb))`: bản bọc chép bản ghi cuộc gọi (model id thật,
đường trace, ok, lớp lỗi) rồi GỌI TIẾP `recordCallDb` — sổ `ai_calls` vẫn có đúng một dòng mỗi cuộc gọi, và thẻ trỏ
đúng model + trace của dòng ấy. Thẻ nhận:

- `evidence.cham = { phien_ban_nguong, ket_luan, ly_do, lech, model, trace, ok, loi, luc }`.
- `ai_suggestion` = kết luận máy; `ai_reasoning` = «<lời giải thích hoặc lý do luật> · LLM <model> · trace <tệp>»
  (cùng khuôn `basisOf` của enrich, nên `/ops/review` hiện nguyên văn); `ai_confidence` = NULL (Q9 — người duyệt
  không thấy độ tự tin; kết luận luật không có độ tự tin của model).
- LLM lỗi / trả sai khuôn: thẻ vẫn mang kết luận + lý do luật; `cham.model` có, `cham.ok = false`, `cham.loi` = lớp
  lỗi (≤ 80 ký tự, không chép prompt). Cờ `--khong-llm`: không gọi model, `cham.model = null`, `cham.loi =
  "khong-llm"`.

### 4. Ứng viên sinh thẻ ghép căn (judge-run.ts)

Tập chấm = cặp `property_candidates.status = 'needs_llm'` ∪ thẻ `entity_match` đang chờ (giữ hành vi cũ). Mỗi cặp:

| Thẻ hiện có (`item_id = pair:a|b`, xét cả hai chiều) | Việc |
|---|---|
| không có | INSERT thẻ `pending`: title «Cùng căn? <phường> <dt>m² ↔ <dt>m²», evidence `offer_a/offer_b` từ `PairData` (cùng khuôn seed 029) + `cham` |
| đang chờ | UPDATE tại chỗ `ai_*` + `evidence.cham` (giữ `offer_a/offer_b`, `created_at`) |
| đã quyết (approved/rejected/deferred) | bỏ qua — không sinh lại, không sửa |

Bộ khoá `evidence.offer_a/offer_b` lấy đúng tập khoá của `jsonb_build_object` trong seed 029 (bên đọc `/ops/review`
đã đọc khuôn ấy). Không chạm `property_candidates`, `sale_offers` (LLM-off-data-path, luật 7).

Câu đếm đường đo «mọi ứng viên needs_llm có thẻ» (chỉ đọc; chạy trong test AC-6 trên DB thử, và trên DB local sau
gộp như bước vận hành):

```sql
SELECT count(*) FROM property_candidates pc
WHERE pc.status = 'needs_llm'
  AND NOT EXISTS (SELECT 1 FROM review_queue r WHERE r.item_type = 'entity_match'
    AND r.item_id IN ('pair:' || pc.offer_a || '|' || pc.offer_b, 'pair:' || pc.offer_b || '|' || pc.offer_a));
``` Lõi tách thành `chamMotLuot(db, deps)` để
test tiêm `queryPair` + model giả; `main()` chỉ chạy khi gọi trực tiếp.

`judge-eval.ts` đổi sang in kết luận `apNguong` cạnh lời giải thích — không ghi DB.

### Luật kho áp vào

- LLM-off-data-path (AGENTS.md luật 7): kết luận là luật xác định; LLM chỉ chữ; ghi vào hàng duyệt, người quyết.
- ADR-0013 «Luật cho mọi việc sau»: việc không đổi lược đồ tin/căn, không thêm field; chỉ đổi cách đề xuất ghép.
- Không migration: model + trace vào `evidence` jsonb (vùng đã hẹp không có `db/`).

## Bài đo

- Test thuần (`agent/tests/judge-nguong.test.ts`): ma trận nhánh luật, đối xứng A↔B, prompt không chứa ngưỡng.
- Test DB thử (`agent/tests/judge-run.test.ts`): DB riêng `oneinvest_p3_judge_test_<pid>` trên :5433, DDL rút từ
  027/029 thật + `052_ai_calls.sql` thật, `sale_offers` dựng tối thiểu; model giả `MockLanguageModelV4` (bắt nguyên
  văn prompt model nhận để soi ngưỡng); không chạm DB `oneinvest`.
- Chạy bằng executor có sẵn `executors.test.agent` (`cd agent && npm test`).

## Ngoài phạm vi

- Lịch chạy định kỳ judge-run (TV13b `sinh-the-ghep-can`, launchd) — hàng này chỉ làm lệnh sinh thẻ đúng và không nhân đôi.
- Đổi ba số ngưỡng — giữ nguyên số của prompt cũ; chỉnh ngưỡng là việc của tập nhãn (PL8/PL9).
- Sửa `/ops/review` để hiện `evidence.cham` thành khối riêng — lời căn cứ đã mang model + trace.
- Prompt của `enrich-text` (làn U2, `agent/src/enrich/**`).
- Đổi `property_candidates.status` sau khi người quyết thẻ.
