# Review findings: o-kpi-chi-do-local (round 1)

## Trong hợp đồng

- **Ngưỡng «máy thu offline» 30′ cũ vẫn chạy trong AttentionList trên cloud, lệch hằng số duy nhất 45′ của ADR-0014**
  file: `app/src/components/ops/collections/collections-view.tsx:56`
  severity: medium
  source: conventions
  AC: AC-4
  detail: Vòng này bỏ Alert 30′ trong CollectionsView và thay bằng FactsStaleAlert theo FACTS_STALE_MS (45′). ADR-0014 §Ngưỡng trễ và lib/ops-facts.ts ghi rõ ngưỡng này là «hằng số một chỗ», và AC-4 hứa «bỏ cảnh báo 30 phút cũ». Nhưng CollectionsView vẫn tính factsAgeMin từ factsPushedAt rồi truyền vào issuesOf (dòng 54–56). Ở attention-list.tsx:52, issuesOf còn giữ luật `factsAgeMin > 30` và đẩy mục «Máy thu có thể offline / Trễ» (warning-light). Trên cloud điều này gây hai lỗi. (1) Từ phút 31 đến 45: dòng mốc đo báo số tươi, badge xanh vẫn hiện, nhưng danh sách «Cần chú ý» lại báo máy thu offline, hai tín hiệu mâu thuẫn nhau. (2) Quá 45′: cùng một tín hiệu hiện hai lần, với hai câu và hai ngưỡng khác nhau. Ngưỡng thứ hai vẫn sống song song với hằng số mà ADR quy định là duy nhất. Cách sửa: khi có `cloud` thì không truyền factsAgeMin, để FactsStaleAlert là tín hiệu duy nhất; nếu vẫn cần mục trong danh sách thì mục đó phải dựa trên cloud.state và FACTS_STALE_MS.

- **Cloud /ops/collections vẫn hiện mục «Máy thu có thể offline» theo ngưỡng 30′ cũ, song song với Alert 45′ mới; test che lỗi bằng factsPushedAt: null**
  file: `app/src/components/ops/collections/collections-view.tsx:56`
  severity: medium
  source: bugs
  AC: AC-4
  detail: Diff bỏ Alert 30′ và ẩn stat «Máy thu X′ trước» trên cloud (`!cloud && factsAgeMin...`). Nhưng `factsAgeMin` vẫn được truyền vào `issuesOf(...)`. Trên Vercel, `getFactsPushedAt()` (collections-queries, VERCEL=1) trả `payload.pushedAt` thật, nên khi bản tin cũ hơn 30′ thì attention-list.tsx:52 vẫn đẩy mục «Máy thu có thể offline». Hệ quả: (a) từ phút 31 đến 45 trang báo offline trong khi FactsStaleAlert/FACTS_STALE_MS (theo ghi chú là «hằng DUY NHẤT») còn coi bản tin là tươi; (b) quá 46′ trang có cả Alert mới lẫn chữ «Máy thu có thể offline». Trang thật vi phạm AC-4 («Alert Máy thu có thể offline 30′ cũ không còn»). Test ON3-AC-4 không bắt được vì `renderCollections` truyền cứng `factsPushedAt: null` (tests/o-kpi-chi-do-local.test.tsx:90), khác với page.tsx thật. Cách sửa: trên cloud truyền `factsAgeMin: null` (hoặc dùng FACTS_STALE_MS) vào issuesOf, và cho test đi qua page thật hoặc truyền pushedAt thật.

- **Hình dạng 4 (âm tính đứng một mình, không thể đỏ): AC-4 «không còn Alert 30′ cũ» kiểm trên props có factsPushedAt: null viết tay**
  file: `app/tests/o-kpi-chi-do-local.test.tsx:225`
  severity: medium
  source: measurement
  AC: AC-4
  detail: `assert.ok(!h.includes("Máy thu có thể offline"))` chạy trên HTML của renderCollections(). Nhưng renderCollections (dòng 90) truyền cứng `factsPushedAt: null`, nên `factsAgeMin` luôn null. Alert 30′ cũ chỉ hiện khi `factsAgeMin > 30`, tức là với fixture này nó không bao giờ hiện, kể cả khi trả mã về bản cũ. Trang thật (app/src/app/ops/collections/page.tsx:36,53) lấy factsPushedAt từ getFactsPushedAt(). Assert này không có đối chứng dương, chẳng hạn một ca cho factsPushedAt cũ hơn 30′ rồi thấy alert không hiện, nên không bao giờ đỏ được.

- **Hình dạng 1 (đo thuộc tính đánh dấu thay vì đầu ra): AC-2 «ô Đạt SLO» và AC-3 «Sức khoẻ nguồn = x/y» chỉ grep data-slo-summary**
  file: `app/tests/o-kpi-chi-do-local.test.tsx:169`
  severity: medium
  source: measurement
  AC: AC-2
  detail: Dòng 169 (`h.includes(\`data-slo-summary="${sloSummaryKey(...)}"\`)`) và dòng 196 tìm thuộc tính này ở bất kỳ đâu trong trang. Thuộc tính lại được gắn ở div gốc của trang, tính độc lập với ô: app/src/app/ops/page.tsx:30 và collections-view.tsx:61. Ở collections-tiles.tsx:58, `sloSummary={sloSummaryKey(slo)}` còn được gắn vô điều kiện, kể cả khi ô hiện «—». Hai assert không đọc số hiện trong ô (KpiValue `fmtInt(summary.ok)` / unit, hay StatCard value/total), nên nếu ô Đạt SLO hoặc Sức khoẻ nguồn hiện sai số thì vẫn xanh. Lời hứa là ô hiện x/y bằng khối freshness, còn phép đo chỉ thấy dấu đánh dấu ở gốc trang.

- **Hình dạng 5 (tuyên bốn ô, chỉ kiểm vài điểm): AC-2 bỏ sót ô «Snapshot mới nhất»**
  file: `app/tests/o-kpi-chi-do-local.test.tsx:168`
  severity: medium
  source: measurement
  AC: AC-2
  detail: Tên ca và contract AC-2 đều nói «bốn ô KPI hiện đúng số tính từ khối freshness (Đạt SLO, Quá hạn, Chưa có snapshot, Snapshot mới nhất)». Test chỉ có `tileValue(h, "Quá hạn")`, `tileValue(h, "Chưa có snapshot")` và thuộc tính data-slo-summary (đã nêu ở trên là đo dấu đánh dấu). Không có assert nào cho «Snapshot mới nhất» (`fmtVnDate(newest.lastSnapshotAt)`). Không có ma trận bốn phần tử viết trước, nên số assert khác số ô được tuyên.

- **Hình dạng 5 và 1: AC-1 «ô không số là «—»» chỉ kiểm một ô mỗi trang, còn /ops kiểm thuộc tính khung**
  file: `app/tests/o-kpi-chi-do-local.test.tsx:141`
  severity: medium
  source: measurement
  AC: AC-1
  detail: Contract AC-1 hứa «ô không có số hiện «—»» trên các trang. Ở /ops, test chỉ có `ops.includes("data-kpi-unmeasured")`. Đây là thuộc tính của div lưới (overview-tiles.tsx:141), không phải bốn giá trị «—», dù message assert ghi «bốn ô «—»». Ở /ops/collections chỉ kiểm `tileValue(..., "Bản ghi 24h") === "—"`. Ô «Sức khoẻ nguồn» và «Cổng S03 hôm nay» (vừa đổi sang «—» trong commit 1317e9d, collections-tiles.tsx:55,82) và ô Lockdown không có assert nào. Không có ma trận ô × trang viết trước.

- **Hình dạng 4 (âm tính không thể đỏ): AC-6 ca records24h đếm badge trên một chuỗi tự dựng**
  file: `app/tests/o-kpi-chi-do-local.test.tsx:271`
  severity: medium
  source: measurement
  AC: AC-6
  detail: Với records24h, hàm `region` trả `` `text-2xl>${tileValue(h, "Bản ghi 24h")}<` ``. Đây là chuỗi test tự dựng, không phải vùng HTML của ô. Vì vậy `assert.equal(successBadges(region(h)), 0, ...)` ở dòng 281 luôn đúng: chuỗi đó không bao giờ chứa `bg-success/10`. Lời hứa «ô của khối lỗi không badge xanh» với records24h vì thế không được đo, và không có đối chứng dương nào chứng minh hàm cắt vùng bắt được badge.

- **Hình dạng 5 (tuyên ma trận khối lỗi nhưng thiếu cặp): AC-6 không kiểm khối freshness lỗi trên /ops/collections**
  file: `app/tests/o-kpi-chi-do-local.test.tsx:269`
  severity: low
  source: measurement
  AC: AC-6
  detail: Contract AC-6 nói «When dựng trang đọc khối đó». Khối freshness được hai trang đọc: /ops (OverviewTiles) và /ops/collections (ô Sức khoẻ nguồn qua cloud.feeds, collections-tiles.tsx:55-57). Ma trận CASES có ba dòng, mỗi khối một trang, nên thiếu cặp freshness → /ops/collections. Ô Sức khoẻ nguồn ở trạng thái lỗi khối (phải hiện «—» + «Chưa có số», không 0, không badge) không có phép đo nào.

- **Hình dạng 5 (kiểm một điểm cho lời hứa «số mờ»): AC-4 chỉ cần một ô text-2xl mờ**
  file: `app/tests/o-kpi-chi-do-local.test.tsx:224`
  severity: low
  source: measurement
  AC: AC-4
  detail: `assert.ok(/text-2xl[^"]*text-muted-foreground/.test(h))` đúng ngay khi một ô bất kỳ mờ. Contract AC-4 hứa «số vẫn hiện nhưng mờ», tức mọi ô số của bản tin cũ: bốn ô /ops và các ô Sức khoẻ nguồn, Bản ghi 24h, Cổng S03 ở /ops/collections. Nếu một ô quên `muted={stale}` thì test vẫn xanh. Không có ma trận ô viết trước, cũng không có đối chứng trạng thái tươi (số không mờ).

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **getCloudOpsView ép kiểu jsonb từ ops_heartbeat mà không kiểm từng phần tử (thiếu validation ở ranh giới hệ thống)**
  Người dùng thấy gì: Nếu bản tin từ máy local có một dòng sai khuôn, cả trang tổng quan Ops trên cloud có thể sập thay vì hiện «—» ở chỗ đó.
  Căn cứ: Bản tin chỉ do máy của chính ta và người có quyền Ops đẩy lên nên hiếm khi sai khuôn, và chỉ cần đẩy lại bản tin đúng là trang chạy lại, không mất dữ liệu.
  file: `app/src/lib/ops-cloud.ts`
  severity: medium
  Đề xuất: known-limits

- **Trạng thái tươi/cũ chỉ xét theo pushedAt của cả bản tin, bỏ qua state từng khối mà ADR-0014 quy định**
  Người dùng thấy gì: Một khối số đã cũ nhưng nằm trong bản tin còn mới vẫn hiện như số tươi, kể cả badge xanh.
  Căn cứ: Hiện máy local đo mọi khối cùng lúc khi đẩy nên tình huống này chưa xảy ra, và nếu có thì chỉ làm một con số trông tươi hơn thực tế trong thời gian ngắn, tự hết khi đẩy lại.
  file: `app/src/lib/ops-cloud.ts`
  severity: low
  Đề xuất: known-limits

- **Ô «Bản ghi 24h» hiện tổng > 0 nhưng chú thích ghi «Chưa có bản ghi trong 24 giờ» khi khối freshness lỗi**
  Người dùng thấy gì: Khi số theo nguồn không đọc được, ô «Bản ghi 24h» có thể ghi một con số lớn kèm dòng chú thích nói chưa có bản ghi nào, tự mâu thuẫn.
  Căn cứ: Chỉ xảy ra khi một khối số hỏng còn khối kia vẫn tốt, con số chính vẫn đúng, chỉ dòng chú thích sai và hết khi số đo lần sau đầy đủ.
  file: `app/src/components/ops/collections/collections-tiles.tsx`
  severity: medium
  Đề xuất: known-limits

- **/ops trên cloud khi chưa đo được: ObjectivesGrid vẫn ghi «0 cặp nguồn × thị trường · 0 quá hạn»**
  Người dùng thấy gì: Khi cloud chưa có số, trang tổng quan vẫn ghi «0 quá hạn» ở bảng bên dưới, dễ khiến người xem tưởng mọi nguồn đều ổn.
  Căn cứ: Đây đúng loại tín hiệu trấn an giả mà việc này muốn bỏ nhưng nằm ngoài các ô KPI đã ký, nên cần một việc riêng; không mất dữ liệu và sửa không đắt.
  file: `app/src/app/ops/page.tsx`
  severity: low
  Đề xuất: new-contract

- **Tổng «Bản ghi 24h» đếm hai lần snapshot zalo-agent (S03 và S05 cùng luồng)**
  Người dùng thấy gì: Tổng «Bản ghi 24h» có thể cao hơn thực tế vì bản ghi của luồng Zalo bị đếm hai lần.
  Căn cứ: Đây là con số phụ để theo dõi dữ liệu có chảy hay không, sai lệch có từ trước ở cả bản local và không làm mất hay lộ dữ liệu.
  file: `app/src/components/ops/collections/collections-view.tsx`
  severity: low
  Đề xuất: known-limits

- **Hình dạng 3 (quan hệ chỉ thử ở điểm suy biến): OP-AC-2 «hai trang cùng một con số x/y» so hai giá trị luôn bằng nhau**
  Người dùng thấy gì: Phép kiểm rằng hai trang Ops hiện cùng một con số x/y chỉ thử trên dữ liệu rỗng, nên nếu hai trang lệch nhau trên dữ liệu thật thì kiểm tra vẫn xanh.
  Căn cứ: Chỉ làm yếu một phép kiểm của việc khác, không ảnh hưởng người dùng trực tiếp; có thể bổ sung ở vòng của việc đó.
  file: `app/tests/ops-cloud-khong-bang-nap.test.tsx`
  severity: low
  Đề xuất: known-limits

- **Hình dạng 2 (props viết tay đúng khuôn bên đọc): renderCollections tự lắp props CollectionsView thay vì dựng CollectionsPage**
  Người dùng thấy gì: Các phép kiểm trang Thu thập dữ liệu tự dựng đầu vào nên nếu phần nối dữ liệu thật của trang sai thì kiểm tra vẫn xanh.
  Căn cứ: Là điểm yếu của phép kiểm, không phải lỗi người dùng thấy; lỗi cụ thể liên quan đã được nêu riêng ở finding khác.
  file: `app/tests/o-kpi-chi-do-local.test.tsx`
  severity: low
  Đề xuất: known-limits

- **Hình dạng 5 (eval tuyên ca không tồn tại): E5 nêu ca «ON3-AC-5 không số → «—»», E1 nêu hai ca đỏ riêng, trong khi test không có hoặc gộp**
  Người dùng thấy gì: Danh sách ca kiểm ghi trong hồ sơ nghiệm thu không khớp từng tên với các ca kiểm thật, nên người đối chiếu khó thấy ca nào đã chạy.
  Căn cứ: Chỉ là sai lệch ghi chép, không ảnh hưởng người dùng, sửa lại tên là xong.
  file: `_acceptance/o-kpi-chi-do-local/evals.yaml`
  severity: low
  Đề xuất: known-limits

⚠ Cụm ngoài vùng phủ: 2/17 lỗi rơi vào file không bộ đo nào phủ (app/tests/ops-cloud-khong-bang-nap.test.tsx, _acceptance/o-kpi-chi-do-local/evals.yaml) — dừng và quyết: mở rộng hợp đồng hay rút phạm vi.

