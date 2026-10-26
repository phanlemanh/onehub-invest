# Review findings: ops-review-khung-hang-cho (round 1)

## Trong hợp đồng

- **Q9/AC-6: độ tự tin vẫn tới trình duyệt qua evidence.fields[].confidence của thẻ agent_output**
  AC: AC-6
  file: `app/src/components/ops/review-content.tsx:105`
  severity: medium
  source: conventions
  detail: toReviewItem bỏ khoá ai_confidence, nhưng evidence truyền xuống client chỉ được gọt ảnh (stripEvidenceImages) và vẫn giữ nguyên mảng fields. Mỗi phần tử trong mảng này mang `confidence` (agent/src/enrich/run.ts dòng 169-176 ghi vào), và review_queue.ai_confidence chính là Math.max của các số đó (run.ts dòng 179-182). Như vậy giá trị ai_confidence vẫn nằm trong RSC payload của mọi thẻ Bổ sung tin. Điều này trái với AC-6 («giá trị `ai_confidence` không có trong dữ liệu gửi xuống trình duyệt»), với spec ("không chỉ ẩn chữ mà không đưa số tới trình duyệt") và với comment ở app/src/lib/ops/review-queue.ts («số không tới được trình duyệt»). Type EnrichField (review-card.tsx:65) vẫn khai `confidence`. Smoke (scripts/smoke-review-queue.mjs:189) chỉ dò chuỗi khoá `ai_confidence` trong HTML nên không bắt được khoá `confidence`. Unit test RQ-AC-6 chỉ kiểm Object.keys của ReviewItem, còn fixture lại cố ý để `confidence: 0.85` trong evidence.fields. Cách sửa: khi map server-side, gọt `confidence` khỏi evidence.fields (ví dụ thêm vào bước strip), rồi cho smoke và test dò cả khoá này.

- **Q9/AC-6: giá trị ai_confidence vẫn tới trình duyệt qua evidence.fields[].confidence của thẻ agent_output**
  AC: AC-6
  file: `app/src/components/ops/review-content.tsx:109`
  severity: medium
  source: bugs
  detail: loadReviewQueue chỉ bỏ cột ai_confidence. Phần evidence vẫn được gửi nguyên vẹn xuống client: toReviewItem(r, stripEvidenceImages(r.evidence)), mà stripEvidenceImages chỉ xoá offer_a/offer_b.image_url. Với thẻ agent_output, agent/src/enrich/run.ts:168-182 ghi evidence.fields[] = {proposal_id, field, value, confidence, ...} và đặt review_queue.ai_confidence = Math.max(...fields.confidence). Như vậy chính giá trị ai_confidence, cùng độ tự tin của từng trường, nằm trong prop `items` của <ReviewQueue> (client component) và được serialize vào payload RSC. Điều này trái AC-6 của contract («giá trị `ai_confidence` không có trong dữ liệu gửi xuống trình duyệt») và trái lời khẳng định ở app/src/lib/ops/review-queue.ts:5-6 («số không tới được trình duyệt»). Không phép kiểm nào bắt được: smoke scripts/smoke-review-queue.mjs:189 chỉ dò chuỗi khoá "ai_confidence" trong HTML/RSC (khoá ở đây là "confidence"), còn test RQ-AC-6 chỉ kiểm textContent và Object.keys của ReviewItem, không kiểm nội dung evidence. Hướng sửa: gọt `confidence` khỏi evidence.fields[] ở server (trong stripEvidenceImages hoặc toReviewItem), đồng thời bỏ trường `confidence` khỏi type EnrichField ở review-card.tsx:65, và cho smoke dò cả `"confidence"`.

- **Hình dạng 3 (assert chuỗi có mặt/vắng mặt trong khi lời hứa là quan hệ giá trị): E9/RQ-AC-6 chỉ kiểm vắng TÊN KHOÁ ai_confidence, còn GIÁ TRỊ ai_confidence vẫn tới trình duyệt qua evidence.fields[].confidence**
  AC: AC-6
  file: `scripts/smoke-review-queue.mjs:189`
  severity: high
  source: measurement
  detail: AC-6 hứa «giá trị `ai_confidence` không có trong dữ liệu gửi xuống trình duyệt». Smoke dòng 189 chỉ kiểm `!html.includes("ai_confidence")` (tên khoá), và ca RQ-AC-6 (app/tests/review-queue.test.tsx:327-329) chỉ so `Object.keys(toReviewItem(...))` ở cấp đỉnh. Nhưng bên ghi agent/src/enrich/run.ts:178-181 đặt `ai_confidence = Math.max(...evidence.fields.map(f => f.confidence))`, tức giá trị ai_confidence chính là một `confidence` nằm trong `evidence.fields`; toReviewItem (app/src/lib/ops/review-queue.ts:34-45) truyền `evidence` nguyên vẹn (stripEvidenceImages chỉ gọt ảnh), và fixture ENRICH của test (dòng 134-135, confidence 0.85) đi thẳng xuống client. Cả hai phép đo đều xanh trong khi số 0.85 = ai_confidence có trong payload RSC. Quan hệ cần đo là «giá trị ai_confidence của dòng DB không xuất hiện ở bất kỳ đâu trong dữ liệu client». Kiểm sự vắng mặt của một chuỗi tên khoá không đo được quan hệ đó.

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **Nhãn UI mới chưa có thuật ngữ trong CONTEXT.md**
  Người dùng thấy gì: Các nhãn mới trên trang Hàng duyệt như «Ghép căn», «Bổ sung tin», «Loại thẻ» chưa được ghi vào bảng từ vựng chung, nên sau này người khác có thể gọi cùng một khái niệm bằng chữ khác nhau.
  Căn cứ: Chỉ là thiếu tài liệu từ vựng, người dùng không thấy lỗi nào trên màn hình và việc bổ sung sau rất rẻ, không mất dữ liệu.
  file: `app/src/lib/ops/review-queue.ts`
  severity: low
  Đề xuất: known-limits

- **Hình dạng 3 (assert chuỗi có mặt trong khi lời hứa là quan hệ giữa các giá trị): RQ-AC-3 chỉ kiểm nhãn tĩnh, còn fixture Tin A/Tin B có giá trị y hệt nhau**
  Người dùng thấy gì: Bài kiểm tự động cho khung chi tiết thẻ ghép căn chưa phân biệt được tin A với tin B, nên nếu sau này hai tin bị hiện lẫn bên nhau thì không có gì báo động.
  Căn cứ: Màn hình hiện tại chưa thấy sai, đây chỉ là lưới an toàn còn mỏng; người dùng không bị mất dữ liệu và bổ sung bài kiểm sau khá rẻ.
  file: `app/tests/review-queue.test.tsx`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 6 (đo bản đang chạy trên cổng chung thay vì cây đang kiểm): smoke đo BASE_URL mặc định ui1.localhost:3460 mà không xác minh server đó phục vụ worktree đang kiểm**
  Người dùng thấy gì: Phép kiểm trình duyệt có thể đang đo nhầm bản của một nhánh khác chạy cùng cổng, nên kết quả xanh chưa chắc nói đúng về trang Hàng duyệt đang nghiệm thu.
  Căn cứ: Rủi ro chỉ xảy ra khi có hai nhánh cùng chạy trên một cổng, người duyệt nhìn lại được bằng cách chạy lại đúng nhánh; không ảnh hưởng dữ liệu hay người dùng cuối.
  file: `_acceptance/config.yaml`
  severity: medium
  Đề xuất: known-limits

## Chưa adversarial-verify (refuter chết)

Không có.

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).
