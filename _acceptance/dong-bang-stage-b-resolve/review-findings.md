## Trong hợp đồng

- **judge-run-dong-bang.test.ts gọi `git show origin/main:` trong khi job agent của CI checkout nông, nên test đỏ ngay trên PR**
  file: `agent/tests/judge-run-dong-bang.test.ts:76`
  severity: high
  AC: AC-9
  source: conventions
  detail: Job `agent` ở `.github/workflows/ci-test.yml` dùng `actions/checkout@v7` không có `fetch-depth: 0` (các job app, pipeline, scripts có). Với checkout nông, ref `origin/main` không tồn tại nên `execFileSync("git", ["show", "origin/main:agent/scripts/judge-run.ts"])` ném lỗi, ca DBS-AC-2 đỏ trong `npm test` của agent (glob `tests/*.test.ts`, ca không có trong `scripts/ci-bo-qua.json`). Kho đã có hai cách tránh: chép bản cũ thành fixture như `judge-luat.test.ts` (`tests/fixtures/judge-entity-pl25-1.ts.txt`), hoặc ghim SHA và `t.skip` khi lịch sử không có như `judge-entity-khong-dau.test.ts:243`.

- **Chiều đỏ của các test mới so với `origin/main` sẽ tự đỏ sau khi gộp, làm CI của main và mọi PR sau đó đỏ**
  file: `app/tests/review-dong-bang.test.tsx:35`
  severity: high
  AC: AC-9
  source: conventions
  detail: `cauNhanhChinh` đọc SQL bằng `git show origin/main:<tệp>` rồi khẳng định cứng bản ấy chưa đóng băng (`assert.equal(cu.cho, 4)` ở DBS-AC-4, `assert.throws(() => kiem(cu))` ở DBS-AC-3 và DBS-AC-5). Sau khi gộp, `origin/main` có câu mới nên các khẳng định hỏng. Lỗi tương tự ở `agent/tests/judge-run-dong-bang.test.ts:79`, `pipeline/tests/resolve-properties-dong-bang.itest.mjs:22/720`, `scripts/ops-local-dong-bang.test.mjs:1025-1032` (regex rút câu theo hình dạng mã cũ không còn khớp). Kho có cách làm bền: ghim SHA gốc như `GOC_NHANH` ở `tin-rao-doi-chieu.test.tsx`, `GOC` ở `boc-sdt.test.mjs`, `ED0` ở `seller-ref.itest.mjs`. Nên ghim 773a0040 hoặc dùng fixture.

- **Phép đối chứng đỏ so với `origin/main` tự so với chính nó sau khi gộp, làm đỏ CI của app**
  file: `app/tests/review-dong-bang.test.tsx:35`
  severity: high
  AC: AC-9
  source: bugs
  detail: `cauNhanhChinh` rút `REVIEW_QUEUE_SQL` và `DAU_TRANG_SQL` từ `git show origin/main:` rồi chạy thẳng trên DB. Sau khi gộp, bản trên origin/main có `${KHONG_DONG_BANG_SQL}` nằm nguyên văn trong template literal nên Postgres báo lỗi cú pháp ở `$`; kể cả chạy được thì `assert.throws(kiem(cu))` và `assert.equal(cu.cho, 4)` cũng đỏ. Tệp khớp glob `tests/*.test.tsx`, job `app` của CI (fetch-depth 0) chạy nó. Cùng lỗi ở `pipeline/tests/resolve-properties-dong-bang.itest.mjs:22` và `scripts/ops-local-dong-bang.test.mjs:109` (regex `readReviewQueue\(client\) \{ ... client.query(\s*`` không còn khớp vì main gọi `client.query(REVIEW_QUEUE_COUNT_SQL)`). Cách sửa: fixture chép từ bản cũ hoặc neo sha cố định 773a0040, như `agent/tests/judge-luat.test.ts`.

- **DBS-AC-2 gọi `git show origin/main` trong job agent của CI, mà job này checkout nông nên không có origin/main**
  file: `agent/tests/judge-run-dong-bang.test.ts:34`
  severity: high
  AC: AC-9
  source: bugs
  detail: Job `agent` không khai `fetch-depth: 0`, chỉ fetch ref của PR nên không có `refs/remotes/origin/main`; `execFileSync("git", ["show", "origin/main:agent/scripts/judge-run.ts"])` ném `fatal: invalid object name` và DBS-AC-2 đỏ ngay trên PR này (glob `tests/*.test.ts`). Sau khi gộp, bản judge-run.ts trên origin/main đã đóng băng và thoát 0 nên `assert.throws(() => kiem(r))` cũng đỏ. Cách sửa: tệp fixture chép từ 773a0040 thay cho git show origin/main.

- **Hình dạng 6 (mốc đo hardcode): mọi «chiều đỏ» rút bản cũ bằng `git show origin/main:` thay vì sha gốc của vòng**
  file: `app/tests/review-dong-bang.test.tsx:35`
  severity: high
  AC: AC-9
  source: measurement
  detail: Bản «trước vòng» lấy từ ref động origin/main tại app/tests/review-dong-bang.test.tsx:35 (dùng ở dòng 92/115/130), agent/tests/judge-run-dong-bang.test.ts:34, pipeline/tests/resolve-properties-dong-bang.itest.mjs:22, scripts/ops-local-dong-bang.test.mjs:109. Khi vòng đã gộp, origin/main là bản mới và các đối chứng hỏng: (a) review-dong-bang rút được `REVIEW_QUEUE_SQL` còn nguyên `${KHONG_DONG_BANG_SQL}` dạng chữ, SQL lỗi cú pháp; (b) judge-run-dong-bang chạy bản đã đóng băng nên `assert.throws(() => kiem(r), /DBS-AC-2 judge-run còn mở DB/)` đỏ; (c) resolve-properties-dong-bang không còn câu chạm property_candidates nên assert.throws ở dòng 777 đỏ; (d) ops-local E4b không rút được `readReviewQueue(client) { … client.query(\`` nên assert.ok đỏ. Hai tệp app và agent nằm trong npm test của module, CI chạy trên mọi PR và mọi lần push lên main. Thứ bị đo là trạng thái fetch của clone, không phải chênh lệch base→HEAD của vòng.

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **dong-bang-khong-ghi.test.mjs là rào của riêng nhánh nhưng nằm trong glob CI `scripts/*.test.mjs`, nên đỏ vĩnh viễn sau khi gộp và chặn GC0–GC3**
  Người dùng thấy gì: Sau khi gộp, kiểm tra tự động của kho sẽ báo đỏ cho mọi thay đổi về sau dù không ai làm sai. Việc này làm chậm các thay đổi kế tiếp, kể cả việc gắn căn.
  Căn cứ: Không mất dữ liệu nhưng làm đỏ kiểm tra chung của kho cho mọi người; sửa trước khi gộp thì rẻ, sửa sau thì chặn các việc khác.
  file: `scripts/dong-bang-khong-ghi.test.mjs`
  severity: high
  Đề xuất: new-contract

- **Chèn hằng STAGE_B_DONG_BANG vào giữa chú thích của KHONG_CAP_THI_TRUONG, nên chú thích nằm sai chỗ**
  Người dùng thấy gì: Một dòng ghi chú trong mã nằm sai chỗ, người dùng không thấy gì khác biệt.
  Căn cứ: Không ảnh hưởng người dùng hay dữ liệu, chỉ gây hơi khó đọc cho người sửa mã sau.
  file: `pipeline/resolve-properties.mjs`
  severity: low
  Đề xuất: wont-fix

- **DBS-AC-7 đỏ vĩnh viễn trên main và trên mọi PR sau khi gộp**
  Người dùng thấy gì: Sau khi gộp, kiểm tra tự động của kho sẽ báo đỏ cho mọi thay đổi về sau dù không ai làm sai.
  Căn cứ: Không mất dữ liệu nhưng làm đỏ kiểm tra chung cho mọi người; sửa trước khi gộp thì rẻ.
  file: `scripts/dong-bang-khong-ghi.test.mjs`
  severity: high
  Đề xuất: new-contract

- **Hình dạng 6 (mốc đo hardcode, không phải cây đang kiểm): DBS-AC-7 lấy merge-base với origin/main, sẽ đỏ sau khi gộp và ở mọi PR sau**
  Người dùng thấy gì: Sau khi gộp, kiểm tra tự động của kho sẽ báo đỏ cho mọi thay đổi về sau dù không ai làm sai.
  Căn cứ: Không mất dữ liệu nhưng làm đỏ kiểm tra chung cho mọi người; sửa trước khi gộp thì rẻ.
  file: `scripts/dong-bang-khong-ghi.test.mjs`
  severity: high
  Đề xuất: new-contract

- **Hình dạng 5 (tuyên quét lớp nhưng chỉ có điểm-case): «mọi tệp .mjs chép vị từ» thực tế là map viết tay 3 tệp**
  Người dùng thấy gì: Nếu sau này có thêm bản chép bộ lọc thẻ ở tệp khác với nội dung lệch, kiểm tra tự động có thể không phát hiện, và thẻ Ghép căn cũ có thể hiện lại ở một chỗ.
  Căn cứ: Hậu quả nhẹ, chỉ xảy ra khi có người thêm mã mới, và người dùng tự thấy và báo được.
  file: `scripts/ops-local-dong-bang.test.mjs`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 5 (thiếu ma trận toàn phần viết trước): DBS-AC-6 miễn tự động bằng heuristic, chỉ chốt `ma.length >= 10`**
  Người dùng thấy gì: Một truy vấn đếm thẻ mới viết sai có thể lọt qua kiểm tra và làm thẻ Ghép căn cũ lại được tính vào số chờ.
  Căn cứ: Chỉ xảy ra khi có mã mới, hậu quả là số đếm lệch nhẹ, không mất dữ liệu và sửa lại dễ.
  file: `scripts/ops-local-dong-bang.test.mjs`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 4 (assertion âm tính một mình) và hình dạng 2 (đối chứng viết tay): RK-AC-8 «không gieo thẻ» cũng xanh trên bản cũ**
  Người dùng thấy gì: Một phép kiểm cũ về việc không tạo thẻ mới có thể xanh cả khi lỗi còn, nên khó phát hiện nếu thẻ bị tạo lại.
  Căn cứ: Đã có phép kiểm khác của vòng này bao phần chính, nên rủi ro thấp.
  file: `agent/tests/judge-run.test.ts`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 4 (assertion âm tính một mình): DBS-AC-3 «thẻ đã quyết mở được» chỉ kiểm không có chữ lỗi**
  Người dùng thấy gì: Nếu thẻ Ghép căn đã quyết không mở được nội dung, kiểm tra tự động có thể không báo.
  Căn cứ: Rủi ro thấp, chỉ ảnh hưởng xem lại thẻ cũ, người dùng tải lại hoặc báo được.
  file: `app/tests/review-dong-bang.test.tsx`
  severity: low
  Đề xuất: known-limits

- **Hình dạng 4 (assertion âm tính một mình): DBS-AC-4 render vai viewer chỉ kiểm vắng badge entity_match**
  Người dùng thấy gì: Số thẻ chờ theo loại cho người xem có thể hiển thị thiếu mà kiểm tra tự động không phát hiện.
  Căn cứ: Hậu quả nhẹ, chỉ là hiển thị số, không mất dữ liệu.
  file: `app/tests/review-dong-bang.test.tsx`
  severity: low
  Đề xuất: known-limits

- **Hình dạng 4 (assertion âm tính một mình): DBS-AC-5 đếm 0 câu review_queue qua spy, không có đối chứng dương cho spy**
  Người dùng thấy gì: Nếu Căn giá tốt lại báo đang chờ ghép, kiểm tra tự động có thể không bắt được.
  Căn cứ: Rủi ro thấp và dễ nhận ra khi xem trang, sửa sau không đắt.
  file: `app/tests/review-dong-bang.test.tsx`
  severity: low
  Đề xuất: known-limits

- **Hình dạng 4 (assertion âm tính một mình): SL1-AC-3 bỏ đối chứng dương, «tin cấp thị trường không thành cặp» thành đúng theo cấu tạo**
  Người dùng thấy gì: Luật loại tin cấp thị trường khỏi việc ghép cặp không còn được kiểm riêng, vì việc ghép cặp đã dừng.
  Căn cứ: Đã được chấp nhận trong hợp đồng; không ảnh hưởng người dùng khi việc ghép cặp đang đóng băng.
  file: `pipeline/scripts/s03-len-cong.itest.mjs`
  severity: low
  Đề xuất: known-limits

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).

