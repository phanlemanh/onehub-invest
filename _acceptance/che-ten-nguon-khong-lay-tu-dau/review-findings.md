## Trong hợp đồng

- **Quy trình áp xoá tệp tên thật S16 ở bước 2, khiến lệnh kiểm sau ở bước 5 thoát mã 2**
  AC: AC-7
  file: `_acceptance/che-ten-nguon-khong-lay-tu-dau/ap-may-thu/README.md:13`
  severity: medium
  source: conventions
  detail: README dòng 13 yêu cầu «Xoá tệp cục bộ sau khi áp xong» ngay trong bước 2. Bước 5 (dòng 22) lại chạy `discovery/do-ban-chep.mjs` để kiểm cờ true có 0 chỗ trúng nhầm và ca cấy cụm hai từ, tên miền S16 bị bắt. Script này đọc đúng tệp đó và dừng khi thiếu: do-ban-chep.mjs dòng 20 `if (!existsSync(TEP)) { ...; process.exit(2); }`. Làm đúng thứ tự README thì phần kiểm ca cấy sau áp không chạy được, trong khi AC-7 và mục «Ai quyết gì» của AGENTS.md bắt buộc hồ sơ áp có lệnh kiểm sau chạy được. Người áp sẽ phải bỏ qua phép kiểm hoặc xin cấp lại tên thật. Cần chuyển bước xoá tệp xuống sau bước 5 và ghi rõ xoá cả khi phải lùi.

- **Quy trình áp xoá tệp tên thật S16 trước lệnh kiểm sau vốn cần chính tệp đó, nên bước kiểm thoát 2**
  AC: AC-7
  file: `_acceptance/che-ten-nguon-khong-lay-tu-dau/ap-may-thu/README.md:13`
  severity: medium
  source: bugs
  detail: Bước 2 (dòng 13) yêu cầu xoá tệp cục bộ sau khi áp xong. Bước 5 (dòng 22) lại chạy discovery/do-ban-chep.mjs để kiểm cờ true có 0 chỗ trúng nhầm và ca cấy bị bắt. Script này đọc đúng tệp đó (CTEN_TEP, mặc định s16-ten-that.json) và dừng ngay bằng process.exit(2) khi tệp không còn, trước khi đo. Làm đúng thứ tự README thì phần kiểm ca cấy sau áp không chạy được, trong khi AGENTS.md yêu cầu hồ sơ áp phải có đủ lệnh kiểm sau. Cách sửa: chuyển việc xoá tệp xuống sau bước 5, hoặc cho do-ban-chep.mjs đọc dòng S16 từ DB máy thu đã áp.

- **Hình dạng 4 (âm tính một mình) và 3: ca push-ops-facts không đo lời hứa «tên dự án không bị che»**
  AC: AC-4
  file: `pipeline/scripts/source-name-entries.itest.mjs:138`
  severity: high
  source: measurement
  detail: Ca khai cờ chỉ assert `qua.code === 0` và `qua.posts === 1` (dòng 137-138), không đọc payload để thấy «Lumora Park» còn nguyên. Không có cờ thì lõi che dòng này thành «dự án S90 Park quận 9» (đã chạy lõi xác nhận, findSourceNames trên chuỗi đã che ra 0), bộ soát không chặn và vẫn có 1 POST, nên đột biến push-ops-facts bỏ wholeOnly vẫn xanh. Dòng 142 `r.posts === 0 || !/lumora/i.test(vet)` và dòng 146 `cu.posts === 0 || !/Lumora Park/...` đều qua khi script sập trước POST hoặc khi dòng log không vào payload; không ca nào kiểm r.code hay sự có mặt của «S90». E4b hứa rõ «chuỗi chứa tên dự án giả không bị che, chuỗi chứa cụm hai từ bị che thành S90».

- **Hình dạng 5 (tuyên ma trận, chỉ có điểm-case): offers-public, collections-queries, quet-ten-nguon-html thiếu ô và không chạy chỗ đọc thật**
  AC: AC-4
  file: `pipeline/scripts/source-name-entries.itest.mjs:160`
  severity: high
  source: measurement
  detail: E4c hứa ma trận mỗi chỗ đọc ba ca kèm «Đối chứng mỗi chỗ: match_whole=false», còn AC-4 của contract đòi «mỗi chỗ trong sáu có một ca hành vi riêng (offers-public: giá trị người bán mang tên miền giả về NULL)». Ca dòng 160-169 gộp ba chỗ đọc thành 5 assert trên hàm nạp + lõi: không import offers-public, collections-queries hay quet-ten-nguon-html; không có ca NULL của offers-public; nhánh pipeline cho quet thiếu ô cụm hai từ; cả ca không có datCo(false) nên `findSourceNames(DU_AN).length === 0` là âm tính không đối chứng. Riêng quet trộn seeds với entries của hàm nạp (scripts/quet-ten-nguon-html.mjs, docDb), đoạn trộn này không được đo.

- **Hình dạng 5 (tuyên ma trận, không có ca): E4a hứa guardValues trên tải giả nhưng lệnh của nó không chạy ca nào như vậy**
  AC: AC-4
  file: `_acceptance/che-ten-nguon-khong-lay-tu-dau/evals.yaml:30`
  severity: high
  source: measurement
  detail: E4a hứa «guardValues trên tải giả với entries từ hàm nạp»: tên dự án 0 chỗ trúng khi khai cờ, ≥ 1 khi không khai; cụm hai từ hay tên miền ≥ 1 ở cả hai. Lệnh probes/soat.sh chỉ chạy pipeline/scripts/soat-tang-a.test.mjs, và tệp này không có S90 hay Lumora; guardValues chỉ xuất hiện ở ca NT2-AC-6 dòng 38, lọc `cases.filter((c) => !c.names)` nên loại đúng các ca mang cờ. Lời gọi guardValues duy nhất trong itest là `guardValues(["x"], [])`. Kết quả xanh của E4a không phủ vế này.

- **Hình dạng 5 (tuyên ba ca đóng chặt, chạy thiếu): dong-chat.sh gọi ca pii, còn hai hành vi E4d hứa nằm ở ca allow**
  AC: AC-4
  file: `_acceptance/che-ten-nguon-khong-lay-tu-dau/probes/dong-chat.sh:4`
  severity: high
  source: measurement
  detail: E4d hứa sync-cloud «source_registry rỗng → dừng pha scan, 0 dòng staging; cấy định danh nguồn vào sale_offers, properties, sellers → dừng trước khi nạp». Probe chạy `node scripts/check-cloud-sync.mjs pii`, nhưng casePii (check-cloud-sync.mjs dòng 799-857) chỉ kiểm cột bị loại khỏi payload. Hai khẳng định «ĐỎ-ĐÚNG fail-closed» và «ĐỎ-ĐÚNG ten-nguon» nằm trong caseAllow (dòng 1121-1200, fail-closed ở dòng 1174-1178). Vì vậy đường đóng chặt của sync-cloud trên hàm nạp mới không được E4d chạy.

- **Hình dạng 4 (âm tính một mình): E6 ghi dong_cloud = 0 mà không có đối chứng dương, ca tên miền có thể qua rỗng**
  AC: AC-6
  file: `_acceptance/che-ten-nguon-khong-lay-tu-dau/discovery/do-ban-chep.mjs:74`
  severity: high
  source: measurement
  detail: Dòng 73 đòi `dung.out.dong_cloud === 0`, nhưng đối chứng cờ false ở dòng 74 chỉ kiểm nut_du_an và bi_danh, không kiểm `sai.out.dong_cloud`, dù E6 nêu mốc ≈ 1.320 + 3.355 dòng areas. Vòng đếm bảng cloud hỏng và luôn ra 0 thì vẫn ĐẠT. Dòng 74 cũng chỉ đòi `bi_danh >= 100000` trong khi thông điệp và eval nói mốc 114.760. Dòng 62 bỏ các bảng airdna_ dù eval nói «các bảng FILL». Dòng 77 dùng `.filter(...).every(...)` nên ra true khi tệp không có định danh chứa dấu chấm. Ca cấy ở dòng 76-77 chỉ gọi scanSourceNames trên chuỗi, không cấy dòng vào bảng thử như AC-6 ghi.

- **Hình dạng 4 (âm tính một mình): AC-9 kết luận 0 chỗ trúng nhưng đối chứng dương không đi qua đường đọc tệp**
  AC: AC-9
  file: `_acceptance/che-ten-nguon-khong-lay-tu-dau/probes/khong-ten-that.mjs:35`
  severity: medium
  source: measurement
  detail: E9 và AC-9 yêu cầu chép một tệp ra thư mục tạm, chèn biến thể rồi dò ra ≥ 1. Dòng 35 chỉ gọi `demTrung` trên chuỗi trong bộ nhớ với duy nhất `bien[0]`, không qua bước duyệt và đọc tệp, cũng không thử các biến thể còn lại. Dòng 32 `if (!existsSync(p)) return` bỏ qua im lặng gốc quét bị thiếu hoặc gõ sai, gồm `.acceptance-runs/che-ten-nguon-khong-lay-tu-dau`, và không có assert về số tệp tối thiểu theo từng gốc, nên quét thiếu vùng vẫn in ĐẠT.

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **wholeOnly bỏ lọt tên nguồn hai từ viết bằng dấu nối, gạch dưới, dấu chấm hoặc hai dấu cách: bộ che và leak gate đều cho qua**
  Người dùng thấy gì: Với dòng đã khai cờ, tên nguồn hai từ viết dạng đường dẫn có dấu gạch nối hay gạch dưới có thể rời máy lên cloud mà không bị che.
  Căn cứ: Đây là khả năng lộ tên nguồn thật ra ngoài máy, người dùng không tự gỡ lại được sau khi dữ liệu đã lên cloud, nên đáng làm thành việc riêng.
  file: `pipeline/lib/mask-source-names.mjs`
  severity: high
  Đề xuất: new-contract

- **SỰ CỐ DO TÁC TỬ CHẤM GÂY RA (không phải lỗi phép đo): đã vô tình đẩy một bản tin ops-facts thật lên cloud production**
  Người dùng thấy gì: Một bản tin tình trạng vận hành đã bị đẩy lên trang Ops trên cloud ngoài ý muốn lúc soát; nội dung đã qua bộ soát và sẽ bị lượt định kỳ kế tiếp ghi đè.
  Căn cứ: Hậu quả nhẹ vì bản tin qua bộ soát và tự được thay bằng lượt định kỳ, không thể hoàn tác nên chỉ cần ghi vết.
  file: `pipeline/push-ops-facts.mjs`
  severity: high
  Đề xuất: wont-fix

- **Hình dạng 1 (đo chữ trong mã thay vì đầu ra): «mỗi chỗ gọi hàm nạp chung» chỉ là grep tên hàm**
  Người dùng thấy gì: Phép kiểm xem mỗi chỗ có dùng hàm nạp tên nguồn chung hay chưa khá lỏng, có thể cho qua một chỗ đã bị sửa thành danh sách rỗng.
  Căn cứ: Lỗi chỉ lộ khi có người sửa mã sai về sau, đã có ca hành vi riêng bù một phần nên ghi giới hạn là đủ.
  file: `pipeline/scripts/soat-tang-a.test.mjs`
  severity: high
  Đề xuất: known-limits

- **Hình dạng 4 (không ghim thông điệp thật): chiều đỏ AC-1 nhận mọi lỗi SQL**
  Người dùng thấy gì: Phép kiểm đường lỗi khi áp lại bản cập nhật cơ sở dữ liệu có thể xanh vì một lỗi khác, không đúng lỗi cần bắt.
  Căn cứ: Chỉ ảnh hưởng độ tin cậy của phép kiểm, không ảnh hưởng người dùng, chi phí sửa không đáng so với hậu quả.
  file: `pipeline/scripts/source-name-entries.itest.mjs`
  severity: low
  Đề xuất: wont-fix

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).
