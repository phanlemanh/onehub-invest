# Review findings: o-kpi-chi-do-local (vòng 3)

## Trong hợp đồng

Không có finding nào nằm trong hợp đồng ở vòng này.

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **Lưới job trên cloud đọc khoá `jobs` kiểu cũ của payload, không đọc khối `blocks.jobs` của ADR-0014 như comment và quyết định d-17 nói**
  Người dùng thấy gì: Trên trang Thu thập của bản cloud, lưới máy móc (launchd) có thể vẫn hiện «Hoạt động» xanh dù lần đo job gần nhất bị lỗi hoặc đã cũ. Trong vài giây sau bản tin đầu tiên hoặc khi truy vấn lỗi, lưới còn có thể hiện job «Hỏng» giả.
  Căn cứ: Chỉ làm người xem tin nhầm trạng thái job trong chốc lát, không mất dữ liệu, tải lại là thấy lại; và phần này vốn thuộc việc ON4/ON5 nên sửa chung ở đó rẻ hơn.
  file: `app/src/app/ops/collections/page.tsx`
  severity: medium
  Đề xuất: new-contract

- **Commit `docs(acceptance)` có kèm thay đổi code ở app/src/lib/collections-queries.ts**
  Người dùng thấy gì: Lịch sử commit ghi nhầm loại: một thay đổi hành vi của trang nằm trong commit ghi là tài liệu. Người dùng cuối không thấy gì khác; chỉ người đọc lịch sử hoặc hoàn tác theo commit dễ nhầm.
  Căn cứ: Không ảnh hưởng người dùng và không mất dữ liệu; viết lại lịch sử đã đẩy tốn hơn nhiều so với lợi ích.
  file: `app/src/lib/collections-queries.ts`
  severity: low
  Đề xuất: wont-fix

- **Ô «Cổng S03 hôm nay» trên cloud coi số phễu là đã đo theo trạng thái bản tin, nhưng số lại lấy từ một đường đọc khác có catch nuốt lỗi và rơi về số 0**
  Người dùng thấy gì: Trên bản cloud, ô «Cổng S03 hôm nay» đôi khi có thể hiện «0/0 · 0 tin bị cổng chặn» như một số đo thật trong khi thực ra chưa đo được. Người xem có thể tưởng cổng không có hoạt động nào.
  Căn cứ: Số sai chỉ xuất hiện ở một ô phụ, trong một số tình huống ngắn và tải lại thường hết; không mất dữ liệu, nhưng nên sửa trong việc làm phần S03 trên cloud (ON4/ON5).
  file: `app/src/components/ops/collections/collections-view.tsx`
  severity: medium
  Đề xuất: new-contract

- **Lưới job trên cloud đọc mảng `jobs` cũ ở cấp ngoài bản tin chứ không đọc khối `blocks.jobs`, nên lỗi đo của khối job bị bỏ qua**
  Người dùng thấy gì: Khi máy thu không đo được trạng thái job, lưới «Máy móc (launchd)» trên bản cloud vẫn hiện đủ job như bình thường, không báo lỗi đo. Đôi lúc lưới còn hiện job «Không phản hồi» không do máy thu nào đo.
  Căn cứ: Chỉ gây hiểu nhầm trạng thái ở một lưới phụ, không mất dữ liệu và tải lại thường hết; sửa gọn hơn khi làm cùng việc ON4/ON5.
  file: `app/src/app/ops/collections/page.tsx`
  severity: low
  Đề xuất: new-contract

- **Hình dạng 4 (assert âm tính đứng một mình): regex «không trạng thái giả» không có chiều đỏ nào chạy qua**
  Người dùng thấy gì: Bài test kiểm «không có chữ trạng thái giả» chưa được thử với trường hợp có chữ giả thật, nên về sau nếu chữ nguồn đổi thì test có thể vẫn xanh mà không bắt được lỗi. Người dùng hiện tại không bị ảnh hưởng.
  Căn cứ: Không ảnh hưởng người dùng lúc này, chỉ làm giảm độ tin cậy của rào kiểm về sau; thêm ca đối chứng sau này rẻ và không gấp.
  file: `app/tests/o-kpi-chi-do-local.test.tsx`
  severity: low
  Đề xuất: known-limits

- **queryRawTable bọc cả listings và sale_offers (bảng canonical có trên cloud), nuốt 42P01 trái với chính docstring (r2 · tệp đã đổi)**
  Người dùng thấy gì: Nếu hai bảng tin rao chính bị mất trên cloud, trang sẽ im lặng hiện số 0 thay vì báo lỗi. Hiện chúng vẫn có mặt nên người dùng chưa gặp.
  Căn cứ: Chỉ xảy ra khi hạ tầng cloud đã hỏng nặng, hậu quả nhẹ và hiếm, ghi lại là đủ.
  file: `app/src/lib/collections-queries.ts`
  severity: low
  Đề xuất: known-limits

- **ops-cloud-proto chưa dựng đúng lược đồ như cloud: giữ tên airdna_* (cloud là ref_calib_*) và chép mọi bảng public dưới dạng rỗng (r2)**
  Người dùng thấy gì: Ảnh chụp thử dùng làm bằng chứng có thể không giống hệt trang trên cloud thật ở vài bảng, nên một số lỗi chỉ lộ ra khi lên cloud.
  Căn cứ: Không ảnh hưởng người dùng trực tiếp, chỉ làm bằng chứng kém sát thực tế, sửa sau không tốn kém.
  file: `scripts/ops-cloud-proto.mjs`
  severity: low
  Đề xuất: known-limits

- **queryRawTable coi bảng vắng trên cloud là «không có dòng», nên số chưa đo hiện thành 0 đo thật ở Luồng 7 ngày và Rotation (r2 · tệp đã đổi)**
  Người dùng thấy gì: Bảng luồng 7 ngày trên cloud hiện toàn số 0 cho các nguồn Airbnb và AirDNA, dễ làm người xem tưởng nguồn không chạy dù thực tế chưa đo được.
  Căn cứ: Gây hiểu nhầm nhưng chỉ ở bảng phụ, không mất dữ liệu, và đã có việc riêng dự kiến cho phần luồng trên cloud.
  file: `app/src/lib/collections-queries.ts`
  severity: medium
  Đề xuất: new-contract

- **Hình dạng 4 (âm tính một mình, nhánh fixture không chạm tới): AC-4 «không câu trấn an trên số cũ» là doesNotMatch trên câu mà fixture không bao giờ sinh ra (r2 · tệp đã đổi)**
  Người dùng thấy gì: Bài kiểm tra tự động có thể báo xanh dù câu trấn an trên số cũ có quay lại, nên lỗi sau này khó bị bắt sớm.
  Căn cứ: Không ảnh hưởng người dùng hiện tại, chỉ giảm độ chắc của kiểm tra về sau, bổ sung sau rẻ.
  file: `app/tests/o-kpi-chi-do-local.test.tsx`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 5 (ma trận khai trong eval lệch với các ca có thật): evals.yaml nêu tên ca không tồn tại và nêu sai số ca (r2)**
  Người dùng thấy gì: Danh sách bài kiểm tra ghi trong hồ sơ nghiệm thu không khớp tên với bài chạy thật, người duyệt khó đối chiếu.
  Căn cứ: Không đụng tới người dùng cuối, chỉ gây phiền cho người duyệt, sửa chữ rất rẻ.
  file: `_acceptance/o-kpi-chi-do-local/evals.yaml`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 4 (đối chứng đỏ không dùng cùng phép đo với ca xanh): chiều đỏ AC-1 đo trên cả trang trong khi ca xanh nay chỉ đo vùng ô KPI (r2 · tệp đã đổi)**
  Người dùng thấy gì: Bài kiểm tra đối chứng có thể xanh dễ hơn cần thiết, nên khả năng bắt lỗi của nó kém hơn vẻ ngoài.
  Căn cứ: Người dùng không thấy gì, rủi ro rất nhỏ, chi phí sửa không đáng so với lợi ích.
  file: `app/tests/o-kpi-chi-do-local.test.tsx`
  severity: low
  Đề xuất: wont-fix

- **Hình dạng 4 (âm tính một mình, không đối chứng dương): AC-7 «không truy vấn ops_heartbeat» dựa vào spy chưa từng được chứng minh là bắt được truy vấn ấy (r2 · tệp đã đổi)**
  Người dùng thấy gì: Bài kiểm tra có thể không phát hiện nếu trang chạy local lại đọc nhầm bản tin đẩy lên, nên lỗi này nếu xảy ra sẽ khó bị bắt.
  Căn cứ: Chưa có lỗi thật, chỉ thiếu lưới an toàn; người dùng không bị ảnh hưởng và thêm đối chứng sau không tốn kém.
  file: `app/tests/o-kpi-chi-do-local.test.tsx`
  severity: low
  Đề xuất: known-limits

- **getCloudOpsView ép kiểu jsonb từ ops_heartbeat mà không kiểm từng phần tử (thiếu validation ở ranh giới hệ thống) (r1)**
  Người dùng thấy gì: Nếu bản tin từ máy local có một dòng sai khuôn, cả trang tổng quan Ops trên cloud có thể sập thay vì hiện «—» ở chỗ đó.
  Căn cứ: Bản tin chỉ do máy của chính ta và người có quyền Ops đẩy lên nên hiếm khi sai khuôn, và chỉ cần đẩy lại bản tin đúng là trang chạy lại, không mất dữ liệu.
  file: `app/src/lib/ops-cloud.ts`
  severity: medium
  Đề xuất: known-limits

- **Trạng thái tươi/cũ chỉ xét theo pushedAt của cả bản tin, bỏ qua state từng khối mà ADR-0014 quy định (r1)**
  Người dùng thấy gì: Một khối số đã cũ nhưng nằm trong bản tin còn mới vẫn hiện như số tươi, kể cả badge xanh.
  Căn cứ: Hiện máy local đo mọi khối cùng lúc khi đẩy nên tình huống này chưa xảy ra, và nếu có thì chỉ làm một con số trông tươi hơn thực tế trong thời gian ngắn, tự hết khi đẩy lại.
  file: `app/src/lib/ops-cloud.ts`
  severity: low
  Đề xuất: known-limits

- **Ô «Bản ghi 24h» hiện tổng > 0 nhưng chú thích ghi «Chưa có bản ghi trong 24 giờ» khi khối freshness lỗi (r1 · tệp đã đổi)**
  Người dùng thấy gì: Khi số theo nguồn không đọc được, ô «Bản ghi 24h» có thể ghi một con số lớn kèm dòng chú thích nói chưa có bản ghi nào, tự mâu thuẫn.
  Căn cứ: Chỉ xảy ra khi một khối số hỏng còn khối kia vẫn tốt, con số chính vẫn đúng, chỉ dòng chú thích sai và hết khi số đo lần sau đầy đủ.
  file: `app/src/components/ops/collections/collections-tiles.tsx`
  severity: medium
  Đề xuất: known-limits

- **/ops trên cloud khi chưa đo được: ObjectivesGrid vẫn ghi «0 cặp nguồn × thị trường · 0 quá hạn» (r1)**
  Người dùng thấy gì: Khi cloud chưa có số, trang tổng quan vẫn ghi «0 quá hạn» ở bảng bên dưới, dễ khiến người xem tưởng mọi nguồn đều ổn.
  Căn cứ: Đây đúng loại tín hiệu trấn an giả mà việc này muốn bỏ nhưng nằm ngoài các ô KPI đã ký, nên cần một việc riêng; không mất dữ liệu và sửa không đắt.
  file: `app/src/app/ops/page.tsx`
  severity: low
  Đề xuất: new-contract

- **Tổng «Bản ghi 24h» đếm hai lần snapshot zalo-agent (S03 và S05 cùng luồng) (r1 · tệp đã đổi)**
  Người dùng thấy gì: Tổng «Bản ghi 24h» có thể cao hơn thực tế vì bản ghi của luồng Zalo bị đếm hai lần.
  Căn cứ: Đây là con số phụ để theo dõi dữ liệu có chảy hay không, sai lệch có từ trước ở cả bản local và không làm mất hay lộ dữ liệu.
  file: `app/src/components/ops/collections/collections-view.tsx`
  severity: low
  Đề xuất: known-limits

- **Hình dạng 3 (quan hệ chỉ thử ở điểm suy biến): OP-AC-2 «hai trang cùng một con số x/y» so hai giá trị luôn bằng nhau (r1)**
  Người dùng thấy gì: Phép kiểm rằng hai trang Ops hiện cùng một con số x/y chỉ thử trên dữ liệu rỗng, nên nếu hai trang lệch nhau trên dữ liệu thật thì kiểm tra vẫn xanh.
  Căn cứ: Chỉ làm yếu một phép kiểm của việc khác, không ảnh hưởng người dùng trực tiếp; có thể bổ sung ở vòng của việc đó.
  file: `app/tests/ops-cloud-khong-bang-nap.test.tsx`
  severity: low
  Đề xuất: known-limits

- **Hình dạng 2 (props viết tay đúng khuôn bên đọc): renderCollections tự lắp props CollectionsView thay vì dựng CollectionsPage (r1 · tệp đã đổi)**
  Người dùng thấy gì: Các phép kiểm trang Thu thập dữ liệu tự dựng đầu vào nên nếu phần nối dữ liệu thật của trang sai thì kiểm tra vẫn xanh.
  Căn cứ: Là điểm yếu của phép kiểm, không phải lỗi người dùng thấy; lỗi cụ thể liên quan đã được nêu riêng ở finding khác.
  file: `app/tests/o-kpi-chi-do-local.test.tsx`
  severity: low
  Đề xuất: known-limits

- **Hình dạng 5 (eval tuyên ca không tồn tại): E5 nêu ca «ON3-AC-5 không số → «—»», E1 nêu hai ca đỏ riêng, trong khi test không có hoặc gộp (r1)**
  Người dùng thấy gì: Danh sách ca kiểm ghi trong hồ sơ nghiệm thu không khớp từng tên với các ca kiểm thật, nên người đối chiếu khó thấy ca nào đã chạy.
  Căn cứ: Chỉ là sai lệch ghi chép, không ảnh hưởng người dùng, sửa lại tên là xong.
  file: `_acceptance/o-kpi-chi-do-local/evals.yaml`
  severity: low
  Đề xuất: known-limits

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).

