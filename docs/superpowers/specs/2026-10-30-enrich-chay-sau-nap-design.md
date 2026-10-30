# enrich-chay-sau-nap — Enrich chạy theo lịch sau lượt nạp S03/S05

Căn cứ: `docs/research/enrich-ngung-2610.md` (PR #196) · `_acceptance/enrich-chay-sau-nap/opportunity.md` (Cổng Đáng:
build, Mạnh 30/10) · TD9 trong `docs/plan/pham-vi-nen-tang-2310.md` · luật LLM-off-data-path (AGENTS.md luật 7).

## Vấn đề

`agent/scripts/enrich-run.ts` là CLI chạy tay, và chưa có job nào gọi nó. Cả lượt nằm trong MỘT giao dịch: BEGIN, rồi
lần lượt từng tin: gọi LLM (~10 giây mỗi tin), ghi đề xuất, áp luật, tạo thẻ; COMMIT ở cuối. Với 50 tin, giao dịch
mở nhiều phút. Trong lúc đó, các dòng `review_queue`, `enrichment_proposals` và `sale_offer_records` mà lượt đã chạm
đều bị giữ khoá: người bấm duyệt thẻ, hay transform kế tiếp, phải chờ. Một lỗi ở tin thứ 49 làm mất công cả 48 tin
trước. Dòng tổng kết đếm theo kết quả định tuyến (`summarizeRun(routed)`), không theo số dòng thật sự ghi được: đề xuất
trùng (`ON CONFLICT DO NOTHING`) vẫn được đếm. Lỗi LLM thì chỉ in một dòng `✗ LLM` rồi trôi đi.

## Thiết kế

### 1. Một tin, một giao dịch ngắn (`agent/src/enrich/run.ts`)

Vòng lặp mỗi tin tách thành hai pha:

1. **Ngoài giao dịch:** dựng bối cảnh (E1 resolve) và gọi LLM. Pha này chỉ đọc. `heldFields` vẫn đọc trước khi
   định tuyến.
2. **Trong giao dịch của tin:** ghi đề xuất → `apply_enrichment` → `syncReview`. Pha này được bọc bằng
   `opts.giaoDich(fn)`.

`giaoDich` là hàm tiêm vào. CLI dùng `BEGIN … COMMIT`, và `ROLLBACK` khi lỗi. Test chạy trong `withTx` (đã có BEGIN
ngoài cùng) thì truyền bản `SAVEPOINT … RELEASE`. Lý do: BEGIN lồng trên `pg` chỉ là cảnh báo, và COMMIT đầu tiên sẽ
đóng luôn giao dịch của test, nên test sẽ ghi thật vào :5433. Vắng `giaoDich` thì `runEnrich` dùng bản SAVEPOINT,
nên mọi test cũ chạy y như trước mà không phải sửa ca.

Tin ghi lỗi: giao dịch của tin đó lui lại, tin được ghi vào danh sách `loiGhi` (mã tin + tên lớp lỗi), và lượt chạy
tiếp tin sau. Các tin trước đã commit thì giữ nguyên.

`heldFields` đọc ngoài giao dịch. Nếu giữa lúc đọc và lúc ghi có lượt khác chen vào, unique index `(offer_id, field,
value_key, source)` vẫn chặn đề xuất trùng. Lượt sau sẽ thấy xung đột và giữ field lại; không bước ghi nào dựa vào
`held` để áp thẳng một giá trị.

### 2. Đếm lỗi LLM

`LlmFn` trả thêm `loi?: string` (tên lớp lỗi) khi lời gọi ném lỗi. `runEnrich` đếm ba số:
- `llmGoi`: số lời gọi.
- `llmLoi`: số lời gọi ném lỗi (hết thời gian chờ, 500, không nối được).
- `llmKhongDoc`: số câu trả lời không parse được (`result: null` mà không có `loi`).

**LLM hỏng = lỗi + không đọc được.** Model nạp nhầm, hay trả về rác, thì cũng hỏng như khi chết hẳn (gap-probe P0).
Ngưỡng làm job đỏ là câu hỏi cho người, ghi thành **Hỏi-1** ở Cổng Phạm vi. Bản nháp dưới đây theo khuyến nghị.

### 3. Dòng tổng kết đếm đúng

Bộ đếm lấy từ những gì THẬT được ghi:
- `deXuatMoi`: số dòng `RETURNING id` của INSERT.
- `daAp`: kết quả `apply_enrichment` (số đề xuất thật sự áp; ô đã có giá trị thì bị bỏ).
- `choDuyet`: số đề xuất `review` mới.
- `the`: số thẻ đang chờ.
- `loiGhi`, `llmLoi/llmGoi`.

`summarizeRun(routed)` vẫn giữ cho ngả `--dry` (không ghi gì nên chỉ đếm được định tuyến). Ngả ghi in bộ đếm thật.

Mã thoát của CLI (nháp theo khuyến nghị Hỏi-1):

| Mã | Khi |
|---|---|
| 2 | Có tin ghi lỗi. Luôn thắng mã 3: lỗi ghi không bị LLM che |
| 3 | LLM hỏng từ một nửa số lời gọi trở lên (số gọi ≥ 1). Phần E1 đã ghi xong trước khi thoát |
| 0 | Còn lại. Hỏng dưới một nửa thì kèm một dòng `⚠ LLM hỏng m/n` |
| 1 | Hỏng ngoài vòng tin (không nối được DB, nạp tòa nhà lỗi): như cũ |

Số gọi = 0 (mọi tin đã đủ E1, không cần LLM) thì không tính là hỏng. Dòng tổng kết in
`LLM hỏng m/n (lỗi a · không đọc được b)`.

### 3b. Áp giá trị: luật xác định, như thiết kế M-3 đã ký (Hỏi-2)

Lượt không chỉ ghi đề xuất. Đề xuất `direct` (E1) và `corroborated` (LLM khớp một căn cứ độc lập) được áp lên tin
thật qua `apply_enrichment`. Đây là đường đã ký ở `enrich-qua-de-xuat` (ROADMAP M-3) và hoàn tác được bằng
`enrich-revert` (`ops_audit enrich:revert`). Giá trị LLM không có căn cứ lên thẻ cho người duyệt.

Lên lịch thì việc áp này xảy ra mỗi đêm, không còn người bấm chạy, trên dữ liệu thật rồi đi lên cloud. Vì vậy đây là
việc khó đảo, ghi thành **Hỏi-2**. Khuyến nghị: giữ áp luật xác định, mỗi lượt tối đa 50 tin. Lối khác: thêm cờ
`--khong-ap` cho job, mọi đề xuất vào hàng chờ duyệt — giá là 394 tin đều phải người bấm, và Enrich lại đứng ở hàng
duyệt.

### 3c. Không bốc lại tin đã thử (gap-probe P1)

`selectOffers` bốc `random()` trong các tin S03/S05 còn thiếu trường. Tin đã thử mà LLM vẫn không tìm ra trường thì
sẽ thiếu mãi, và bị bốc lại mỗi đêm. Hệ quả: tốn lời gọi LLM, đề xuất mới về 0, backlog không bao giờ hết.

Sửa như sau:
- Mỗi tin thử xong ghi một dòng `ops_audit` (`actor = enrich-run:<run_id>`, `action = enrich:thu`,
  `detail = {offer_id, run_id}`), trong CÙNG giao dịch của tin. Tin hỏng thì không có dấu thử, nên lượt sau thử lại.
- Tin mà lời gọi LLM ném lỗi thì không ghi dấu, để đêm sau LLM sống lại sẽ thử tiếp.
- Nhánh backlog của `selectOffers` bỏ qua tin có `enrich:thu` trong cửa sổ **Hỏi-3** (nháp: 30 ngày).
- Tin «hoãn» (đề xuất chờ mà thẻ không còn pending) vẫn đi trước, bất kể dấu đã thử.
- `--offers` không xét dấu.

Không cần migration: `ops_audit` đã có, và dòng chỉ mang mã tin cùng `run_id`.

Ước lượng: backlog 394 tin, mỗi tin thử một lần, 50 tin một đêm, nên khoảng 8 đêm. Tin mới mỗi đêm cộng thêm vào.

### 4. Bước job (`scripts/zalo-import-daily.sh`, phần làn Claude)

Sau `refresh-bait-gap` thêm:

```bash
# Enrich (enrich-chay-sau-nap): bước dài (LLM ~10″/tin) không đụng state nạp — nhả khoá nạp trước để job nạp khác
# (apify-facebook-daily, chờ khoá tối đa 5′) không hỏng vì đợi; gỡ trap để lúc thoát không xoá khoá của job khác.
trap - EXIT; rm -rf "$LOCK_DIR"
enrich_run() { (cd "$ROOT/agent" && LIMIT="${ENRICH_LIMIT:-50}" node --import tsx scripts/enrich-run.ts); }
job_run zalo-import-daily enrich-run enrich_run
```

- **Thứ tự:** enrich đứng sau `transform-zalo`, như ghi ở đầu `enrich-run.ts` («chạy SAU transform-zalo/transform-fb»),
  và đứng cuối cùng để không bước nào phải chờ nó.
- **Bước trước hỏng thì sao:** enrich vẫn chạy (`job_run` luôn chạy tiếp), và job thoát bằng mã của bước hỏng đầu
  tiên — cùng luật AU3. Nạp hỏng thì job đã `exit 1` từ trước, nên enrich không chạy.
- **Mỗi lượt 50 tin** (mặc định sẵn của CLI); `ENRICH_LIMIT` ghi đè được. Job chạy lúc 00:00 mỗi đêm.
- **LLM local:** Qwen 27B qua MTPLX :8000, giữ nguyên. Không thêm model nào.

Chỉ đọc phần bước sau transform. Bước thu/nạp (làn ZCode) không đổi một dòng nào: dòng nhả khoá nằm trong khối làn
Claude, sau dòng chú thích «Từ đây trở xuống là làn Claude».

### 5. Cờ `--offers`

CLI nhận `--offers id1,id2` để chạy đúng các tin chỉ định (`offerIds` của `runEnrich` đã có sẵn). Có hai cách dùng:
phép đo đầu-cuối chọn tin tất định trên DB thử, và người vận hành chạy lại vài tin cụ thể.

## LLM-off-data-path

Giữ nguyên. Lượt ghi ĐỀ XUẤT; áp giá trị chỉ đi qua `apply_enrichment` (luật xác định, E1 hay có căn cứ độc lập);
giá trị LLM không có căn cứ lên thẻ cho người duyệt. `run.ts` không thêm câu UPDATE nào lên `sale_offers` hay
`properties` (test `enrich-guard` giữ điều này).

## Đo

- **Đơn vị** (`agent/tests/enrich-giao-dich.test.ts`, trong `withTx`): ma trận 6 hàng LLM × 2 trạng thái ghi
  (12 ô); bộ đếm so với số dòng thật trong bảng; LLM được gọi khi độ sâu giao dịch bằng 0.
- **Đầu-cuối** (`agent/tests/enrich-cli.itest.ts`):
  - Chạy CLI thật trên DB thử `oneinvest_u2_enrich` (dựng bằng `db/db-thu.sh`), với máy chủ LLM giả kiểu OpenAI.
  - Mỗi lần máy chủ giả nhận lời gọi, nó đọc `pg_stat_activity` của phiên `application_name = 'enrich-run'`: phiên đó
    phải không có giao dịch mở (`xact_start IS NULL`), và đề xuất của tin trước phải đọc được từ phiên khác.
  - Máy chủ giả trả 500 → kiểm mã 3 và dòng tổng kết.
  - Trigger trên DB thử raise theo `offer_id` của tin giữa → CLI thoát 2, tin hai trống, tin một và ba đọc được.
  - Hai lượt không `--offers` liên tiếp: lượt hai không bốc lại tin của lượt một.
- **Job** (`scripts/enrich-buoc-job.test.mjs`, khuôn `zalo-import-job.test.mjs`): dãy bước · mã thoát · khoá đã nhả
  lúc enrich chạy · khoá của job khác còn nguyên sau khi job thoát.

Không lượt đo nào chạy enrich thật lên :5433. Test đơn vị chạy trong `BEGIN … ROLLBACK`, test đầu-cuối chạy trên DB thử.

## Ngoài phạm vi

- Chạy hết backlog trong một lượt; phát biểu bộ đọc mới cho tin S03 mất đề xuất trước 039 (TD8). Cả hai thuộc NT6.
- Khoá chống hai lượt enrich chồng nhau. Unique index cùng giao dịch mỗi tin đã giữ dữ liệu đúng; chồng lượt chỉ tốn
  thêm lời gọi LLM.
- Hiển thị trên `/ops`: `/ops/data-flow` đã đếm đề xuất chờ (`600_data_flow.sql`).
- Lịch riêng (plist launchd mới): làn ZCode. Hàng này chỉ thêm bước vào job đêm sẵn có.
- Bỏ đặc tả UX và design-pass: hàng không chạm giao diện.
