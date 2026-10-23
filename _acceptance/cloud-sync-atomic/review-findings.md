# Review findings: cloud-sync-atomic (round 1)

## Trong hợp đồng

- **Bộ soát tên nguồn bỏ qua token ngắn hơn 4 ký tự, nên tên thật của S04 không bao giờ được soát; danh sách token rỗng thì guard vẫn cho qua**
  AC: AC-11
  file: `pipeline/sync-cloud.mjs:421`
  severity: medium
  source: conventions
  detail: Danh sách token dùng để soát tầng A trước khi gửi được lấy bằng `SELECT DISTINCT x FROM (real_name ∪ unnest(source_ids)) s WHERE length(x) >= 4`. Đo trên DB local :5433: dòng S04 trong source_registry có length(real_name)=3, nên tên nguồn thật của S04 bị lọc khỏi danh sách và không ô nào của sale_offers/sellers/properties được soát theo tên đó. Contract AC-11 và chú thích đầu file hứa «giá trị nào chứa tên nguồn thật thì lượt dừng», luật .claude/rules/pii-spl.md cũng coi tên nguồn lẫn trong giá trị là tầng A, nên lời hứa này không đúng với một nguồn. Ca đỏ `allow` trong check-cloud-sync.mjs chỉ cấy `source_ids[1]` của dòng đầu (dài ≥ 9), vì vậy không lộ ra lỗ này. Thêm một điểm: nếu source_registry rỗng hoặc đọc ra 0 token (`tokens = []`) thì `scanSourceNames` luôn trả null và lượt vẫn gửi bình thường, tức guard ở ranh giới dữ liệu rời máy đang mở khi lỗi (fail-open) thay vì dừng. Hướng sửa: token ngắn thì so khớp có ranh giới từ chứ không bỏ đi, và ném PhaseError khi danh sách token rỗng.

- **Một mẻ nạp staging lỗi thì cleanup chạy trong khi các worker khác của pool vẫn tiếp tục nạp, nên staging của lượt hỏng không được dọn**
  AC: AC-2
  file: `pipeline/sync-cloud.mjs:486`
  severity: medium
  source: bugs
  detail: `pool()` dùng Promise.all. Khi một job reject, Promise.all reject ngay nhưng các worker còn lại vẫn ở trong `while (i < items.length)` và tiếp tục lấy job mới. Đã mô phỏng: 12 job, 3 worker, job #2 ném lỗi; lúc reject mới xong 2 job, sau đó 9 job còn lại vẫn chạy hết. Vì vậy `await cleanup()` ở dòng 488 chạy giữa chừng, và các mẻ INSERT sau đó vẫn ghi vào sync_stage.rows của run_id hỏng. Khi chạy thật, main() đặt exitCode=1 nhưng tiến trình không thoát cho tới khi các worker tải nốt mọi mẻ còn lại lên cloud. Số dòng này chỉ được dọn khi một lượt sau thấy chúng quá 2 giờ. Điều này trái AC-2(a) ('tự xoá staging theo run_id của mình trước khi thoát'). Kiểm tra (a) trong check-cloud-sync.mjs (`stagingCount(C,'failstage') === 0` đọc ngay sau khi runSync reject) vì thế phụ thuộc thời điểm chạy, không chứng minh được gì. Cách sửa: thêm cờ hủy trong pool (worker ngừng lấy job khi đã có lỗi), và chờ mọi worker xong (Promise.allSettled) rồi mới cleanup. (Khớp với kết quả đo E2 ca (a): còn 13 dòng staging sau khi gãy.)

- **Hình dạng 5 (tuyên quét lớp nhưng chỉ có một điểm): ca «DB không có anon/authenticated» của E6 thực ra vẫn có hai role**
  AC: AC-6
  file: `pipeline/scripts/check-cloud-sync.mjs:181`
  severity: high
  source: measurement
  detail: caseStage gọi buildCloudSim("stage") trước (dòng 148), hàm này chạy CREATE ROLE anon/authenticated ở dòng 92. Role của PostgreSQL là đối tượng cấp cluster, không thuộc riêng một DB, và không chỗ nào DROP ROLE. Vì vậy makeDb("stage_bare") ở dòng 181 nằm trong cùng container one-invest-db mà anon/authenticated đã có sẵn. Trong 038, khối DO `IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = r)` luôn rẽ nhánh «có role», nên nhánh «không role» không bao giờ chạy. Dù vậy dòng 185 vẫn in PASS «migration 038 lần i exit 0 (DB không có anon/authenticated)». Hai phần tử AC-6 tuyên (có role / không role) thực chất chỉ có một điểm được đo. Thêm nữa, không có bước kiểm tiền điều kiện kiểu `SELECT count(*) FROM pg_roles WHERE rolname IN ('anon','authenticated') = 0`, nên thông điệp PASS nói sai về fixture.

- **Hình dạng 4 (assertion âm tính đứng một mình): sellers.name và properties.seller_name không có đối chứng dương lẫn chiều đỏ**
  AC: AC-5
  file: `pipeline/scripts/check-cloud-sync.mjs:676`
  severity: medium
  source: measurement
  detail: casePii khai forbidden cho ba bảng (dòng 673), nhưng đối chứng dương ở dòng 676 chỉ đòi `so.length` (payload sale_offers) có offer_id. Đột biến chiều đỏ (dòng 691-693) cũng chỉ đụng sale_offers.seller_phone. Vậy câu PASS «không payload nào mang … sellers.name / properties.seller_name» (dòng 678) vẫn xanh khi không bắt được payload nào của sellers/properties: bảng rỗng ở local, hoặc regex captureExec trượt với hai bảng này. Không có assert nào ghim rằng `seen` chứa dòng sellers và properties. caseAllow có cùng hình dạng: `seen.length && !outside.length` (dòng 764) xanh chỉ nhờ dòng sale_offers, và chiều đỏ soát tên nguồn (dòng 784) chỉ cấy vào sale_offers.street_raw, trong khi AC-11 hứa soát payload của cả ba bảng.

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **Khoá `executors.script.sync_pii_mutation` bị khai trùng trong _acceptance/config.yaml**
  Người dùng thấy gì: Cấu hình kiểm tra nghiệm thu có một dòng khai trùng; hiện chưa làm sai kết quả nhưng sau này sửa nhầm một bản có thể khiến bước kiểm chạy bản kia mà không báo.
  Căn cứ: Hiện hai bản giống hệt nhau nên người dùng không gặp lỗi gì, không mất dữ liệu, và dọn lại rất rẻ ở lần sửa cấu hình kế tiếp.
  file: `_acceptance/config.yaml`
  severity: low
  Đề xuất: known-limits

- **Pha tráo lỗi phía client thì cleanup xoá staging trong lúc giao dịch tráo có thể vẫn chạy trên server, nên prod có thể COMMIT bảng rỗng và areas/saved_markets bị xoá**
  Người dùng thấy gì: Nếu đường truyền tới cloud đứt hoặc quá thời gian đúng lúc đang đổi dữ liệu, trang công khai có thể hiện bảng rỗng và các thị trường người dùng đã lưu có thể bị xoá, trong khi lượt đồng bộ chỉ báo lỗi chung chung.
  Căn cứ: Hậu quả nặng vì có thể mất dữ liệu người dùng đã lưu và không tự khôi phục được, dù chỉ xảy ra khi lượt tráo chạy quá giới hạn thời gian mà chưa ai đo trên cloud thật; nên xử lý trước hoặc ngay sau lượt thử đầu tiên trên cloud thật.
  file: `pipeline/sync-cloud.mjs`
  severity: high
  Đề xuất: new-contract

- **Thước đo prod cloud-sync-watch bỏ qua lỗi đọc khi phán, nên báo OK dù đã đọc trượt đúng lúc tráo**
  Người dùng thấy gì: Công cụ đo trên prod có thể báo ổn dù nhiều lần đọc bị lỗi, nên kết luận prod không bao giờ trống có thể lạc quan hơn thực tế.
  Căn cứ: Chỉ làm kết luận của lượt thử kém tin cậy chứ không tác động người dùng cuối; người vận hành có thể đọc thêm số lỗi in ra và đo lại, sửa rẻ.
  file: `pipeline/scripts/cloud-sync-watch.mjs`
  severity: low
  Đề xuất: known-limits

- **mgmtExec tự thử lại các INSERT nạp staging (không lặp được) khi gặp 502/504, nên dễ tạo dòng trùng và lượt gãy ở pha tráo**
  Người dùng thấy gì: Khi đường truyền chập chờn, một lượt đồng bộ có thể thất bại vì nạp trùng dữ liệu và báo lỗi khó hiểu; trang công khai vẫn giữ dữ liệu cũ.
  Căn cứ: Dữ liệu trên prod không bị mất hay hỏng, lượt kế tiếp tự chạy lại sau 15 phút nên người dùng không thấy gì; chỉ tốn công chẩn đoán.
  file: `pipeline/sync-cloud.mjs`
  severity: low
  Đề xuất: known-limits

- **Hình dạng 5 (thiếu ma trận toàn phần viết trước): «21/21 bảng» của E3 lấy danh sách bảng từ chính writer đang được kiểm**
  Người dùng thấy gì: Nếu có một bảng bị đánh rơi khỏi danh sách đồng bộ, bài kiểm vẫn báo đạt, nên trang công khai có thể thiếu dữ liệu của bảng đó mà không ai biết.
  Căn cứ: Rủi ro chỉ xuất hiện khi ai đó sửa danh sách bảng sau này, dữ liệu vẫn còn ở máy local và thêm danh sách đối chiếu rất rẻ khi có dịp.
  file: `pipeline/scripts/check-cloud-sync.mjs`
  severity: low
  Đề xuất: known-limits

- **Hình dạng 4 (assertion âm tính đứng một mình): «catalog ngoài sync_stage trước = sau» không có đối chứng**
  Người dùng thấy gì: Bài kiểm xác nhận việc thêm schema tạm không làm đổi phần còn lại của cơ sở dữ liệu có thể xanh dù thước đo không đủ nhạy để bắt thay đổi.
  Căn cứ: Đây là độ tin cậy của bài kiểm chứ không phải lỗi người dùng thấy; migration chỉ tạo schema riêng nên khả năng đổi phần khác thấp, bổ sung đối chứng sau cũng không đắt.
  file: `pipeline/scripts/check-cloud-sync.mjs`
  severity: low
  Đề xuất: known-limits

- **Hình dạng 3 (chỉ assert «chuỗi có mặt» trong khi lời hứa là quan hệ giữa các giá trị): chốt «staging lệch số dòng thì hủy tráo» chỉ được đo bằng chuỗi**
  Người dùng thấy gì: Cơ chế dừng đồng bộ khi dữ liệu tạm nạp thiếu hoặc thừa dòng mới chỉ được kiểm là có mặt, chưa thử thật bằng một lượt lệch.
  Căn cứ: Nếu cơ chế này hỏng thì lớp bảo vệ khác vẫn giữ dữ liệu cũ, người dùng khó chịu tác động trực tiếp, và thêm ca thử sau là việc nhỏ.
  file: `pipeline/sync-cloud.test.mjs`
  severity: low
  Đề xuất: known-limits

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).
