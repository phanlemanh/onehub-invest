# Review findings: do-san-sl1-kdm (round 1)

## Trong hợp đồng

- **Ca KDM-PX1 mới sẽ đỏ ở job CI «scripts» (DB trống không có khu vực cha 'vn-hcmc', vi phạm FK) mà không được khai trong scripts/ci-bo-qua.json**
  file: `scripts/kiem-tin-rao-gan-khu-vuc.test.mjs:101`
  severity: high
  AC: AC-5
  source: conventions
  detail: Job `scripts` trong .github/workflows/ci-test.yml chạy `node --test scripts/*.test.mjs` trên mọi PR, với DB dựng trống từ db/migrations (scripts/ci-db-init.mjs). Ca KDM-PX1 chèn `INSERT INTO areas (... parent_id ...) VALUES ($1, 'vn-hcmc', 'submarket', ...)`, nhưng `areas.parent_id` có ràng buộc `REFERENCES areas(id)` (001_init.sql:8) và không có migration hay scripts/ci/*.sql nào chèn dòng `vn-hcmc` (đã grep `INSERT INTO areas`: không có kết quả). Vì vậy trên CI câu INSERT đầu tiên sẽ vi phạm FK, ca sẽ ném lỗi và job scripts đỏ. Cách repo đang làm với ca cần dữ liệu thật là khai vào `scripts/ci-bo-qua.json` (KDM-AC-3 đã nằm trong đó), hoặc để fixture tự đủ (chèn một market cha trong cùng giao dịch). Diff không làm cả hai cách. Đây chính là lớp lỗi «hồi quy scripts đỏ cho mọi hàng» mà hồ sơ do-san-sl1-kdm đang muốn gỡ.
  rationale: AC-5 đòi bộ scripts/*.test.mjs xanh; ca mới đỏ trên DB CI trống làm AC này thất bại.

- **Probe AC-4 chỉ so với BEGIN đầu tiên và ROLLBACK cuối cùng của cả tệp, nên không bắt được câu ghi nằm giữa hai giao dịch hay ghi gián tiếp**
  file: `_acceptance/do-san-sl1-kdm/probes/khong-db-chung.sh:17`
  severity: low
  AC: AC-4
  source: conventions
  detail: awk lấy `b` là dòng BEGIN đầu tiên và `r` là dòng ROLLBACK cuối cùng của tệp, rồi coi mọi câu ghi trong khoảng [b, r] là «nằm trong giao dịch». Một câu ghi đặt sau ROLLBACK của giao dịch thứ nhất và trước BEGIN của giao dịch thứ hai vẫn qua. Ghi gián tiếp qua hàm (baTransform, napPhatBieu) cũng không được quét. Chiều đỏ tự kiểm chỉ chèn câu ghi ở dòng 1, nên không phủ các trường hợp này. Lời hứa ở evals E4 («mỗi câu ghi nằm giữa một BEGIN và ROLLBACK đứng trước/sau nó») vì thế mạnh hơn điều probe thực sự đo. Hai tệp hiện tại vẫn xanh đúng, nên mức thấp.
  rationale: AC-4 đòi phép quét đỏ với câu ghi ngoài giao dịch; probe để lọt câu ghi giữa hai giao dịch.

- **Ca KDM-PX1 mới sẽ đỏ trên job CI `scripts`: chèn khu vực có parent_id 'vn-hcmc', nhưng DB CI dựng từ migration không có hàng này (vướng FK)**
  file: `scripts/kiem-tin-rao-gan-khu-vuc.test.mjs:101`
  severity: high
  AC: AC-5
  source: bugs
  detail: Ca test KDM-PX1 chạy `INSERT INTO areas (id, parent_id, ...) VALUES ($1, 'vn-hcmc', 'submarket', ...)`. Ràng buộc `areas.parent_id text REFERENCES areas(id)` (001_init.sql:8) vẫn còn: không migration nào bỏ FK này. Job `scripts` của .github/workflows/ci-test.yml dựng DB trống bằng `node scripts/ci-db-init.mjs`, chỉ áp scripts/ci/area_sources.sql và các migration. Không migration hay tệp bootstrap nào chèn hàng vào `areas` (grep `INSERT INTO areas` trong db/migrations/ và scripts/ci/ không ra kết quả), nên trên CI không có hàng 'vn-hcmc'. DB CI đã áp 084, nên `coDanhBa` trả true và `assert.ok(coMa)` qua; ngay sau đó INSERT đầu tiên lỗi vi phạm FK và ca đỏ. Ca này không có trong scripts/ci-bo-qua.json (chỉ có «KDM-AC-3 ba chiều trên cùng DB»), nên `node --test scripts/*.test.mjs` trên CI sẽ đỏ. Tức là bản sửa nhằm gỡ đỏ oan cho eval hồi quy scripts lại tự thêm một ca đỏ mới ở CI. Cách sửa: tự chèn một market mồi trong cùng giao dịch làm parent, hoặc khai ca vào ci-bo-qua.json kèm lý do.
  rationale: Cùng lỗi với mục đầu: bộ scripts đỏ trên CI làm AC-5 thất bại.

- **Hình dạng 3 (đo «chuỗi có mặt» thay cho QUAN HỆ): probe AC-4 chỉ tìm chữ ROLLBACK ở bất kỳ đâu phía sau, không kiểm câu ghi có nằm trong một cặp BEGIN…ROLLBACK**
  file: `_acceptance/do-san-sl1-kdm/probes/khong-db-chung.sh:18`
  severity: high
  AC: AC-4
  source: measurement
  detail: AC-4 hứa một quan hệ: mỗi câu ghi nằm sau một `BEGIN` và trước `ROLLBACK` của cùng kết nối. Awk ở dòng 17–18 lại lấy `b` = dòng BEGIN ĐẦU TIÊN và `r` = dòng CUỐI CÙNG có chữ «ROLLBACK». Dòng đó có thể là chú thích, tên test hay thông điệp assert, vì bộ lọc chú thích ở dòng 23 chỉ áp cho dòng ghi. Dòng 24 chỉ xét `b < i && r > i`. Trong test.mjs, chữ ROLLBACK cuối cùng nằm ở thông điệp assert dòng 129 («còn khu vực mồi sau ROLLBACK»), sau lệnh ROLLBACK thật ở dòng 126. Trong .mjs, nó nằm ở chuỗi mẫu dòng 222, sau ROLLBACK thật ở dòng 216. Em đã kiểm trên bản sao trong scratchpad: chèn `await c.query(`INSERT INTO areas …`)` ngay sau dòng 126 của test.mjs và `await c.query(`DELETE FROM areas`)` ngay sau dòng 216 của .mjs. Cả hai câu ghi đều chạy sau khi đã ROLLBACK, tức ghi thẳng vào DB dùng chung, mà probe vẫn in «mọi câu ghi nằm giữa BEGIN và ROLLBACK» và «xanh», thoát 0. Vậy probe đang đo việc chữ ROLLBACK có mặt ở đâu đó phía sau, chứ không đo câu ghi có nằm trong giao dịch hay không. Câu ghi đặt giữa hai giao dịch (sau một COMMIT/ROLLBACK, trước BEGIN kế tiếp) cũng lọt.
  rationale: Đã chứng minh câu ghi sau ROLLBACK vẫn qua probe, trái trực tiếp với AC-4.

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **Test KDM-PX1 ghi vào DB theo DATABASE_URL mà không chặn host khác localhost như thước**
  Người dùng thấy gì: Nếu ai đó chạy kiểm thử khi đang trỏ vào hệ thống thật, phép thử có thể mở giao dịch tạm trên đó. Dữ liệu thật không bị đổi vì mọi thứ được hoàn lại, nhưng vẫn là rủi ro không đáng có.
  Căn cứ: Hậu quả nhẹ vì mọi thay đổi được hoàn lại và chỉ xảy ra khi cấu hình môi trường sai; sửa sau rẻ và không mất dữ liệu.
  file: `scripts/kiem-tin-rao-gan-khu-vuc.test.mjs`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 5 (tuyên quét LỚP nhưng chiều đỏ chỉ có một điểm): tự kiểm đỏ của probe AC-4 chỉ thử câu ghi ở dòng 2, trước mọi BEGIN**
  Người dùng thấy gì: Phép tự kiểm của công cụ canh việc ghi nhầm vào dữ liệu dùng chung chỉ thử một kiểu vi phạm, nên có thể bỏ sót các kiểu khác. Người dùng cuối không thấy ảnh hưởng.
  Căn cứ: Chỉ làm yếu một lớp kiểm tra nội bộ, không động đến dữ liệu hay người dùng; bổ sung ca thử sau rất rẻ.
  file: `_acceptance/do-san-sl1-kdm/probes/khong-db-chung.sh`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 5 (khai trục ma trận nhưng chỉ đo một điểm): trục «DB chưa áp 084» gán cho AC-1 nhưng không có eval nào chạy nhánh coMa=false**
  Người dùng thấy gì: Trường hợp cơ sở dữ liệu chưa cập nhật bản mới chưa có phép thử riêng, nên nếu sai thì chưa ai biết. Chỉ gặp ở máy chưa cập nhật.
  Căn cứ: Ít xảy ra vì mọi máy đang dùng đã cập nhật; không mất dữ liệu, và thêm phép thử sau không tốn nhiều.
  file: `scripts/kiem-tin-rao-gan-khu-vuc.test.mjs`
  severity: medium
  Đề xuất: known-limits

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).
