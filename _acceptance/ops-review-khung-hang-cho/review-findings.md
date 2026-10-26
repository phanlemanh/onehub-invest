# Review findings — ops-review-khung-hang-cho (round 2)

## Trong hợp đồng

- **Q9 vẫn lộ: giá trị độ tự tin tới trình duyệt qua fields[].basis («tự tin 82%»); stripEvidenceConfidence chỉ gọt khoá**
  AC: AC-6
  file: `app/src/lib/ops/review-queue.ts:37`
  severity: high
  source: bugs
  detail: Bản sửa S4-r1 cho rằng gọt khoá `confidence` khỏi từng phần tử evidence.fields là đủ để số không tới client. Nhưng basisOf() trong agent/src/enrich/run.ts (dòng 110-114) ghi chính giá trị đó vào chuỗi `basis` của mọi trường e2_llm, dạng `LLM <model> · tự tin <N>% · trace …`, và syncReview chép chuỗi này vào evidence.fields[].basis. stripEvidenceConfidence không đụng tới `basis`, còn review-card.tsx dòng 227 hiện nguyên văn `{o.basis}` trong sheet. Vì vậy thẻ thật vẫn hiện «tự tin 82%» trên màn hình, đúng bằng ai_confidence = max(fields[].confidence). Fixture của chính repo chứng minh điều này: agent/tests/fixtures/e1-conflict-card.json có basis 'LLM qwen27b · tự tin 82% · trace …' đi kèm confidence 0.82, và ca RQ-AC-3 (review-queue.test.tsx:245-247) còn bắt basis đó phải hiện nguyên văn. Các phép kiểm xanh giả vì ba lý do. Thứ nhất, RQ-AC-6 chỉ quét đệ quy tên khoá khớp /confidence/i, không quét giá trị. Thứ hai, regex trong smoke chỉ tìm khoá dạng "confidence":. Thứ ba, kiểm chữ hiển thị ở cả test jsdom (withoutQuotes) lẫn smoke (chuNgoaiTrich) đều gỡ mọi [data-review-quote] trước khi so khớp chữ số kèm dấu phần trăm và chuỗi 'tự tin', mà basis lại nằm đúng trong phần tử đó. Thẻ thử của smoke đặt basis: null nên cũng không bắt được. Hệ quả: AC-6 / Q9 («không đưa số tới trình duyệt») vẫn hỏng với mọi thẻ Bổ sung tin có trường do LLM đề xuất, trong khi hồ sơ evidence ghi là đạt.

- **Hình dạng 3: lời hứa nói về GIÁ TRỊ độ tự tin nhưng phép đo chỉ dò TÊN KHOÁ /confidence/, nên kênh basis «tự tin 82%» lọt qua**
  AC: AC-6
  file: `app/tests/review-queue.test.tsx:338`
  severity: medium
  source: measurement
  detail: Comment dòng 330-331 nói «GIÁ TRỊ độ tự tin không có ở đâu trong dữ liệu client». Assert dòng 341 có message «giá trị độ tự tin không được tới trình duyệt (Q9)». Nhưng `confidenceKeys` chỉ gom các khoá có tên khớp /confidence/i. Chính fixture CONFLICT.evidence dùng trong vòng lặp (agent/tests/fixtures/e1-conflict-card.json) có `fields[].basis = "LLM qwen27b · tự tin 82% · trace …"`. Đây là cùng con số 0.82 do `basisOf()` ở agent/src/enrich/run.ts:112 ghi vào. `stripEvidenceConfidence` chỉ xoá khoá `confidence` và giữ nguyên `basis`, vậy mà assert vẫn xanh trong khi giá trị vẫn tới client: nằm trong props RSC, và hiện ra trên màn qua `<ItemDescription data-review-quote>{o.basis}</ItemDescription>` ở review-card.tsx:227. Phép quét DOM thì gỡ hết [data-review-quote] trước khi so. Spec dòng 27 hứa «không đưa số tới trình duyệt». Smoke cũng mắc cùng lỗi: regex `/\\?"(?:ai_)?confidence\\?"\s*:/` ở scripts/smoke-review-queue.mjs:218 chỉ khớp tên khoá. Phép đo đúng với lời hứa phải tìm GIÁ TRỊ: ai_confidence hoặc fields[].confidence đổi ra dạng N% hay 0.NN không được xuất hiện ở bất kỳ đâu trong out hay html. Còn chuyện căn cứ nguyên văn có được miễn khỏi Q9 hay không thì để triage quyết.

- **Hình dạng 2: thẻ Bổ sung tin thử của smoke viết tay, để basis: null cho nguồn e2_llm, khác khuôn writer thật nên tránh đúng kênh lộ**
  AC: AC-6
  file: `scripts/smoke-review-queue.mjs:123`
  severity: medium
  source: measurement
  detail: Doc của `taoTheThu()` ghi «evidence cùng dạng agent/src/enrich/run.ts ghi». Nhưng object được viết tay: `{ field: "bedrooms", value: "2", confidence: 0.77, source: "e2_llm", basis: null, ... }`, và thiếu cả group_name, run_id, model, trace_path. Writer thật, tức `syncReview` cùng `basisOf` (run.ts:110-114, 169-176), luôn ghi basis = «LLM <model> · tự tin NN% · trace …» khi source là e2_llm và có confidence. Fixture không rút ra từ writer mà nặn đúng khuôn mà reader (`stripEvidenceConfidence`) gọt được. Vì vậy E9 («thấy 0 khoá») và chiều đỏ của nó chỉ chứng minh việc gọt khoá trên một dạng dữ liệu agent không bao giờ sinh ra, còn trường basis mang số độ tự tin không bao giờ được thử. Fixture ENRICH trong app/tests/review-queue.test.tsx:131-136 cũng viết tay, chỉ có `{proposal_id, field, value, confidence}` và không có basis.

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **Nhãn UI mới chưa có thuật ngữ trong CONTEXT.md (r1 · tệp đã đổi)**
  Người dùng thấy gì: Các nhãn mới trên trang Hàng duyệt như «Ghép căn», «Bổ sung tin», «Loại thẻ» chưa được ghi vào bảng từ vựng chung, nên sau này người khác có thể gọi cùng một khái niệm bằng chữ khác nhau.
  Căn cứ: Chỉ là thiếu tài liệu từ vựng, người dùng không thấy lỗi nào trên màn hình và việc bổ sung sau rất rẻ, không mất dữ liệu.
  file: `app/src/lib/ops/review-queue.ts`
  severity: low
  Đề xuất: known-limits

- **Hình dạng 3 (assert chuỗi có mặt trong khi lời hứa là quan hệ giữa các giá trị): RQ-AC-3 chỉ kiểm nhãn tĩnh, còn fixture Tin A/Tin B có giá trị y hệt nhau (r1 · tệp đã đổi)**
  Người dùng thấy gì: Bài kiểm tự động cho khung chi tiết thẻ ghép căn chưa phân biệt được tin A với tin B, nên nếu sau này hai tin bị hiện lẫn bên nhau thì không có gì báo động.
  Căn cứ: Màn hình hiện tại chưa thấy sai, đây chỉ là lưới an toàn còn mỏng; người dùng không bị mất dữ liệu và bổ sung bài kiểm sau khá rẻ.
  file: `app/tests/review-queue.test.tsx`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 6 (đo bản đang chạy trên cổng chung thay vì cây đang kiểm): smoke đo BASE_URL mặc định ui1.localhost:3460 mà không xác minh server đó phục vụ worktree đang kiểm (r1)**
  Người dùng thấy gì: Phép kiểm trình duyệt có thể đang đo nhầm bản của một nhánh khác chạy cùng cổng, nên kết quả xanh chưa chắc nói đúng về trang Hàng duyệt đang nghiệm thu.
  Căn cứ: Rủi ro chỉ xảy ra khi có hai nhánh cùng chạy trên một cổng, người duyệt nhìn lại được bằng cách chạy lại đúng nhánh; không ảnh hưởng dữ liệu hay người dùng cuối.
  file: `_acceptance/config.yaml`
  severity: medium
  Đề xuất: known-limits

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).
