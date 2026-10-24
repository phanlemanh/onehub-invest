# Review findings: o-kpi-chi-do-local (round 2)

## Trong hợp đồng

- **Bảng thô vắng trên cloud bị đọc thành rỗng nên RotationPanel hiện câu trấn an «mọi thị trường đều tươi» khi không đo được**
  AC: AC-8
  file: `app/src/lib/collections-queries.ts:337`
  severity: medium
  source: conventions
  detail: Trên cloud ở trạng thái none (ops_heartbeat không có bản tin), getLocalFacts() trả null. Khi đó readRotationPreview rơi xuống queryRawTable(airdna_markets). Trên cloud bảng này vắng (sync-cloud đổi tên airdna_* thành ref_calib_*), nên lỗi 42P01 bị nuốt thành { rows: [] }. Hệ quả là total=0, next=[] và pipe-panels.tsx:89 vẽ «Không còn market nào cần thu — mọi thị trường đều tươi trong 24h.», kèm mô tả «0 market · con trỏ 0 · chưa chạy đêm nào». Đây đúng loại câu trấn an khi không đo được mà ON3 cấm (design §4, bat_khi «0 … số 0 trên ba trang», gốc G2). Trước r1 trang báo lỗi, giờ nó báo «ổn» sai. Luồng 7 ngày cũng vậy: getFlowDays dựng 7 ngày toàn 0 cho airdna_*/airbnb_snapshots trên cloud ở mọi trạng thái, vì facts chỉ phủ zalo. Design có hoãn phần luồng/nhóm S03 sang ON4/ON5, nhưng việc nuốt lỗi thành số 0/câu «tươi» là do chính commit này thêm vào. Nên trả về «không đo được» (null) để panel hiện «—»/Chưa có số, thay vì rows rỗng.

- **«Cần chú ý» trên cloud vẫn tính lớp lockdown từ máy đang chạy trang, nên báo «Hỏng» trong khi lưới và ô Lockdown ghi «Chưa kiểm được»**
  AC: AC-3
  file: `app/src/components/ops/collections/collections-view.tsx:56`
  severity: high
  source: bugs
  detail: Vòng r1 chỉ ép `ok: null` cho LockdownGrid (dòng 93). Hàm `issuesOf` ở dòng 56 vẫn nhận `lockdown.layers` thô do `getLockdownStatus()` đo trên chính máy chạy trang (ops-queries.ts:222-231). Trên Vercel không có `pipeline/logs/zalo-watchdog.log`, `pgrep openclaw` không thấy gì, còn 127.0.0.1:8009 và :9210 không trả lời. Vì vậy L4 «Watchdog 5′ đang canh», «OpenClaw chạy», «Kev gate :8009», «Collector :9210» đều ra `ok === false`, và attention-list.tsx:48 đẩy ra bốn mục `destructive-light` «Hỏng». Ngay bên dưới, LockdownGrid lại ghi «Chưa kiểm được», ô Lockdown ghi «Chưa kiểm được trên cloud». Báo động giả này hiện ở cả ba trạng thái none/fresh/stale trên cloud. Bản proto (VERCEL=1 trên máy Mac) không lộ ra lỗi này vì các probe localhost ở đó vẫn sống. Cách sửa: đưa đúng mảng layers đã ép null (và agentTurnsToday = null) vào issuesOf khi `cloud` có giá trị.

- **Trạng thái stale trên /ops/collections vẫn có badge xanh «Kênh kết nối» và «Hoạt động» từ bản tin cũ; test không phát hiện vì fixture không có log Zalo**
  AC: AC-4
  file: `app/src/components/ops/collections/collections-view.tsx:95`
  severity: medium
  source: bugs
  detail: Đặc tả ST-collections-stale và contract yêu cầu «0 badge xanh» khi số đã cũ. Vòng r1 đã làm mờ màu ở JobsGrid, FeedsGrid và SegmentBar, nhưng ZaloPipePanel (pipe-panels.tsx:18: `zalo.connected ? <Badge variant="success-light">Kênh kết nối</Badge>`) và ZaloGroupsTable (collections-tables.tsx:97: `hours <= 24` → `success-light` «Hoạt động») vẫn không nhận cờ stale. Trên cloud thật, khi máy thu ngừng đẩy hơn 45′ mà bản tin cuối có `health.connected = true` và nhóm có tin trong 24h, hai badge xanh vẫn hiện. Test ON3-AC-4 (`successBadges(col) === 0`) vẫn xanh chỉ vì capture-ops-facts.mjs chạy push-ops-facts với HOME tạm, không có `.openclaw/logs/oneinvest-zalo-pipe.log`, nên `connected = null` và `zaloGroups = []`. Phép đo vì thế không bao giờ chạm tới hai nhánh này.

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **queryRawTable bọc cả listings và sale_offers (bảng canonical có trên cloud), nuốt 42P01 trái với chính docstring**
  Người dùng thấy gì: Nếu hai bảng tin rao chính bị mất trên cloud, trang sẽ im lặng hiện số 0 thay vì báo lỗi. Hiện chúng vẫn có mặt nên người dùng chưa gặp.
  Căn cứ: Chỉ xảy ra khi hạ tầng cloud đã hỏng nặng, hậu quả nhẹ và hiếm, ghi lại là đủ.
  file: `app/src/lib/collections-queries.ts`
  severity: low
  Đề xuất: known-limits

- **ops-cloud-proto chưa dựng đúng lược đồ như cloud: giữ tên airdna_* (cloud là ref_calib_*) và chép mọi bảng public dưới dạng rỗng**
  Người dùng thấy gì: Ảnh chụp thử dùng làm bằng chứng có thể không giống hệt trang trên cloud thật ở vài bảng, nên một số lỗi chỉ lộ ra khi lên cloud.
  Căn cứ: Không ảnh hưởng người dùng trực tiếp, chỉ làm bằng chứng kém sát thực tế, sửa sau không tốn kém.
  file: `scripts/ops-cloud-proto.mjs`
  severity: low
  Đề xuất: known-limits

- **queryRawTable coi bảng vắng trên cloud là «không có dòng», nên số chưa đo hiện thành 0 đo thật ở Luồng 7 ngày và Rotation**
  Người dùng thấy gì: Bảng luồng 7 ngày trên cloud hiện toàn số 0 cho các nguồn Airbnb và AirDNA, dễ làm người xem tưởng nguồn không chạy dù thực tế chưa đo được.
  Căn cứ: Gây hiểu nhầm nhưng chỉ ở bảng phụ, không mất dữ liệu, và đã có việc riêng dự kiến cho phần luồng trên cloud.
  file: `app/src/lib/collections-queries.ts`
  severity: medium
  Đề xuất: new-contract

- **Hình dạng 4 (âm tính một mình, nhánh fixture không chạm tới): AC-4 «không câu trấn an trên số cũ» là doesNotMatch trên câu mà fixture không bao giờ sinh ra**
  Người dùng thấy gì: Bài kiểm tra tự động có thể báo xanh dù câu trấn an trên số cũ có quay lại, nên lỗi sau này khó bị bắt sớm.
  Căn cứ: Không ảnh hưởng người dùng hiện tại, chỉ giảm độ chắc của kiểm tra về sau, bổ sung sau rẻ.
  file: `app/tests/o-kpi-chi-do-local.test.tsx`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 5 (ma trận khai trong eval lệch với các ca có thật): evals.yaml nêu tên ca không tồn tại và nêu sai số ca**
  Người dùng thấy gì: Danh sách bài kiểm tra ghi trong hồ sơ nghiệm thu không khớp tên với bài chạy thật, người duyệt khó đối chiếu.
  Căn cứ: Không đụng tới người dùng cuối, chỉ gây phiền cho người duyệt, sửa chữ rất rẻ.
  file: `_acceptance/o-kpi-chi-do-local/evals.yaml`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 4 (đối chứng đỏ không dùng cùng phép đo với ca xanh): chiều đỏ AC-1 đo trên cả trang trong khi ca xanh nay chỉ đo vùng ô KPI**
  Người dùng thấy gì: Bài kiểm tra đối chứng có thể xanh dễ hơn cần thiết, nên khả năng bắt lỗi của nó kém hơn vẻ ngoài.
  Căn cứ: Người dùng không thấy gì, rủi ro rất nhỏ, chi phí sửa không đáng so với lợi ích.
  file: `app/tests/o-kpi-chi-do-local.test.tsx`
  severity: low
  Đề xuất: wont-fix

- **Hình dạng 4 (âm tính một mình, không đối chứng dương): AC-7 «không truy vấn ops_heartbeat» dựa vào spy chưa từng được chứng minh là bắt được truy vấn ấy**
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

- **Hình dạng 5 (eval tuyên ca không tồn tại): E5 nêu ca «ON3-AC-5 không số → «—»», E1 nêu hai ca đỏ riêng, trong khi test không có hoặc gộp (r1 · tệp đã đổi)**
  Người dùng thấy gì: Danh sách ca kiểm ghi trong hồ sơ nghiệm thu không khớp từng tên với các ca kiểm thật, nên người đối chiếu khó thấy ca nào đã chạy.
  Căn cứ: Chỉ là sai lệch ghi chép, không ảnh hưởng người dùng, sửa lại tên là xong.
  file: `_acceptance/o-kpi-chi-do-local/evals.yaml`
  severity: low
  Đề xuất: known-limits

⚠ Cụm ngoài vùng phủ: 5/10 lỗi rơi vào file không bộ đo nào phủ (app/src/lib/collections-queries.ts, scripts/ops-cloud-proto.mjs, _acceptance/o-kpi-chi-do-local/evals.yaml) — dừng và quyết: mở rộng hợp đồng hay rút phạm vi.

