## Trong hợp đồng

- **Hình dạng 3 (assert giá trị trong khi lời hứa là quan hệ): thứ tự ảnh «theo thời gian» của cụm không phép đo nào phân biệt được**
  file: `pipeline/scripts/label-ghep.test.mjs:39`
  severity: medium
  AC: AC-3
  source: measurement
  detail: Lời hứa là một quan hệ giữa các `posted_at`: AC-3 ghi «đủ đường ảnh theo thứ tự», nap.mjs:236 ghi «đúng thứ tự thời gian của cụm», tên ca labels-ghep.test.ts:82 ghi «cum theo thoi gian». Các phép đo chỉ so mảng literal trên fixture có thứ tự chèn, thứ tự post_id và thứ tự thời gian trùng nhau: `anh_refs: ["A3","A4"]` (label-ghep.test.mjs:39), `[U("a1"), U("a2")]` (labels-ghep.test.ts:44), `[U("a1"),U("a2"),U("a3")]` với giây 5, 6, 7 (nap.mjs:91, 242). Ca labels-ghep.test.ts:82-85 tự xếp sẵn đầu vào và `danhSachAnhCum` không sắp xếp, nên ca này không đo thời gian. Đã chạy đột biến trên bản chép ở scratchpad, gồm 13 ca hàm thuần của label-ghep.test.mjs, trừ bốn ca GHEP-AC-2 và ca quét chữ: bỏ hẳn `.sort(...)` trong `cuaCum` của ghep-mau.mjs thì 13/13 xanh; sắp theo post_id thay vì thời gian cũng 13/13 xanh. Chưa chạy đột biến ở E3 và nap.mjs. Theo code, fixture của chúng cũng có id và thời gian cùng chiều, nên suy ra vẫn xanh; `loadStgPosts` lại `ORDER BY post_id`. Ở dữ liệu thật post_id không chắc theo thời gian, nên lỗi này ra ảnh sai thứ tự trên thẻ. Thiếu một cụm có post_id ngược chiều thời gian. Seed có l0..l20 nhưng E5 chỉ ghi số «Ảnh n/N», không ghi tấm nào.

- **Hình dạng 5 (tuyên quét lớp nhưng chỉ có điểm-case): ca «khong co ma bai» lặp sáu dòng ma trận nhưng regex chỉ biết mã của dòng đầu**
  file: `app/tests/labels-ghep.test.ts:88`
  severity: low
  AC: AC-3
  source: measurement
  detail: Ca GHEP-AC-3 ở dòng 87-91 lặp cả `MA_TRAN` và E3 hứa «bản ghi có URL gốc hay mã bài thì phép quét đỏ». Nhưng `coMa = /T1|A1|A2|example\.test|https?:/` chỉ gồm mã của cụm thứ nhất. Năm dòng còn lại có mã T2, A3, T4, A4, A5, T5, A6. Đã chạy regex: `{"ref":"T2"}`, `A3`, `A4`, `T4`, `A5`, `T5`, `A6` đều không bị bắt, chỉ `T1` bị bắt. Vì vậy phần âm tính chỉ phân biệt được ở dòng đầu; rò mã bài chỉ xảy ra ở nhánh khác, như ca không tin chữ (A4, A6), vẫn xanh. Đối chứng ở dòng 90 dùng `doc("1")`, đúng cụm duy nhất regex biết, nên không lộ phần thiếu. Mức thấp vì E4 ở nap.mjs:231 có quét `ghep-nap-` tổng quát trên sáu tầng, nhưng E4 cần DB; `ghep_thuan` của E3 không có phần đó.

- **Hình dạng 4 (âm tính không đối chứng dương): mồi riêng của từng bài ảnh nằm ở cột `silver_labels.model` mà không đường đọc nào lấy, nên số đếm bằng 0 là hiển nhiên**
  file: `_acceptance/ghep-anh-tren-the-gan-nhan/probes/seed.mjs:91`
  severity: low
  AC: AC-6
  source: measurement
  detail: seed.mjs:90-91 và nap.mjs:163 đặt `moiseeda1..a3`, `moi_ai_a1..a3` vào cột `model`. Comment của seed ghi «phép đếm qua HTTP mới phân biệt được rò từ bài nào»; E8 yêu cầu đếm «gồm mồi riêng của ba bài ảnh». Đã grep: trong app/src chỗ duy nhất đọc `silver_labels` là labels-luot-hai.ts:60, `SELECT listing_intent, kind`; các tệp labels-queries, labels-luot-hai, labels-cum và components/ops/labels không nhắc `model`. Nên nếu đường đọc tra AI đọc nhầm sang bài ảnh, thứ rò ra là `not_listing`/`sale`, không phải mồi trong `model`, và số đếm mồi vẫn 0. Đối chứng ở nap.mjs:173-174 đọc thẳng `model` từ DB rồi cho qua `coMoi`, tức chỉ chứng minh hàm quét thấy chuỗi, không chứng minh mồi tới được phản hồi. Ba bài ảnh còn có cùng giá trị `not_listing`/`sale` ở hai cột được đọc, nên không phân biệt được rò từ bài nào. Giá trị thật `not_listing` chỉ được quét ở dữ liệu thẻ (nap.mjs:204), bị loại khỏi phép quét trang (nap.mjs:207) và không có trong phép đếm HTTP của E8. Mồi `TOAMAYANH*` ở `block_raw` vẫn có giá trị vì `sale_offers` được đọc, nên phần hở chỉ còn ở đường AI đọc qua trang và HTTP; vì vậy mức thấp.

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **eval-classify vẫn chấm máy đọc trên chữ của ref_id, trong khi nhãn vàng nay gắn theo chữ tin ghép**
  Người dùng thấy gì: Khi bắt đầu chấm điểm máy phân loại bằng nhãn người đã gắn, các bài chỉ có ảnh sẽ bị chấm trên đường dẫn ảnh thay vì chữ của tin, nên điểm máy hiện ở trang chất lượng của Ops sẽ thấp giả mà không có cảnh báo.
  Căn cứ: Hiện chưa có nhãn nào nên chưa có số sai nào hiện ra, và lỗi chỉ nằm ở trang chất lượng nội bộ, không đến người dùng cổng Invest; sửa sau vẫn rẻ nếu làm trước lần chấm điểm đầu tiên.
  file: `pipeline/lib/eval-classify.mjs`
  severity: high
  Đề xuất: new-contract

- **label-sample bỏ kết quả ghepLat: thiếu cột 076 vẫn báo thành công, lấy thêm vào lát đã ghép thì dòng mới giữ ghep NULL**
  Người dùng thấy gì: Nếu lấy thêm mẫu vào một lát đã ghép, hoặc lấy mẫu khi chưa áp migration, lệnh vẫn báo xong nhưng các dòng mới hiện như thẻ một ảnh không chữ. Người gắn có thể gắn cùng một tin hai lần.
  Căn cứ: Chỉ xảy ra với người vận hành khi lấy thêm vào lát cũ hoặc quên áp migration, không mất dữ liệu và chạy lại lệnh ghép với cờ làm lại là sửa được.
  file: `pipeline/label-sample.mjs`
  severity: medium
  Đề xuất: known-limits

- **label-ghep ghi từng dòng ngoài giao dịch: lỗi giữa chừng để lại lát dở, lần chạy sau báo «giữ nguyên» và exit 0**
  Người dùng thấy gì: Nếu lệnh ghép bị đứt giữa chừng khi chạy trên dữ liệu thật, một phần lát đã có ghép còn phần kia thì chưa, và lần chạy lại báo giữ nguyên như thể đã xong. Người gắn sẽ thấy thẻ ghép lẫn thẻ không ghép.
  Căn cứ: Chỉ xảy ra khi lệnh bị ngắt giữa chừng, người vận hành sửa được bằng cách chạy lại với cờ làm lại và dữ liệu gốc không bị hỏng; kế hoạch triển khai đã có sao lưu và đường lùi.
  file: `pipeline/label-ghep.mjs`
  severity: medium
  Đề xuất: known-limits

- **CLI label-ghep không kiểm đầu vào như label-sample: cờ gõ sai bị bỏ qua, lát không tồn tại vẫn exit 0**
  Người dùng thấy gì: Gõ sai một cờ hoặc tên lát khi chạy lệnh ghép không bị báo lỗi: lệnh có thể không làm gì mà vẫn báo thành công, hoặc ghi thật khi người chạy tưởng đang chạy thử.
  Căn cứ: Lệnh chỉ do người vận hành chạy trong buổi triển khai có sao lưu, hậu quả là chạy nhầm chứ không phải dữ liệu người dùng bị hỏng, và có thể chạy lại ngay.
  file: `pipeline/label-ghep.mjs`
  severity: medium
  Đề xuất: known-limits

- **Cột và khoá JSON mới đặt tiếng Việt, trái quy ước tên cột tiếng Anh**
  Người dùng thấy gì: Tên cột và khoá dữ liệu mới của tính năng ghép ảnh đặt bằng tiếng Việt, trái quy ước dự án dùng tiếng Anh. Người dùng không thấy gì, chỉ ảnh hưởng người sửa mã sau này.
  Căn cứ: Không ảnh hưởng người dùng và không mất dữ liệu, nhưng đổi tên sẽ đắt hơn sau khi ghi vào 191 dòng thật nên cần Mạnh ghi nhận đây là ngoại lệ hoặc quyết đổi trước khi áp.
  file: `db/migrations/076_labels_ghep.sql`
  severity: medium
  Đề xuất: known-limits

- **eval-classify vẫn chấm máy trên chữ của ref_id, trong khi nhãn người giờ gắn theo chữ tin ghép**
  Người dùng thấy gì: Khi bắt đầu chấm điểm máy phân loại bằng nhãn người đã gắn, các bài chỉ có ảnh sẽ bị chấm trên đường dẫn ảnh thay vì chữ của tin, nên điểm máy ở trang chất lượng của Ops sẽ thấp giả mà không có cảnh báo.
  Căn cứ: Chưa có nhãn nên chưa có số sai nào hiện ra, lỗi chỉ ở trang nội bộ Ops chứ không đến cổng Invest, và sửa trước lần chấm đầu tiên vẫn rẻ.
  file: `pipeline/lib/eval-classify.mjs`
  severity: high
  Đề xuất: new-contract

- **Lấy thêm vào lát đã có ghép: dòng mới giữ ghep NULL, không báo gì**
  Người dùng thấy gì: Khi lấy thêm mẫu vào lát đã ghép, các bài ảnh mới hiện thành thẻ một ảnh không chữ và có thể bị gắn hai lần, trong khi lệnh báo thành công.
  Căn cứ: Chỉ xảy ra khi người vận hành chủ động lấy thêm vào lát cũ, nhãn đã gắn không mất và chạy lại lệnh ghép với cờ làm lại là khắc phục được.
  file: `pipeline/label-sample.mjs`
  severity: medium
  Đề xuất: known-limits

- **label-sample nuốt kết quả thieu_cot của ghepLat: thiếu migration 076 vẫn báo lấy mẫu thành công**
  Người dùng thấy gì: Nếu lấy mẫu khi chưa áp migration, lệnh vẫn báo xong nhưng các thẻ không có ghép ảnh và không có tín hiệu nào báo thiếu.
  Căn cứ: Chỉ xảy ra khi quên áp migration, nhẹ vì không mất dữ liệu và sau khi áp migration chạy lệnh ghép là bù được.
  file: `pipeline/label-sample.mjs`
  severity: medium
  Đề xuất: known-limits

- **CLI label-ghep ghi từng dòng ngoài giao dịch; lỗi giữa chừng để lại lát dở, lần chạy sau báo giữ nguyên và exit 0**
  Người dùng thấy gì: Nếu lệnh ghép đứt giữa chừng trên dữ liệu thật, lát bị ghép dở và lần chạy lại báo giữ nguyên như đã xong. Người gắn thấy thẻ ghép lẫn thẻ không ghép.
  Căn cứ: Chỉ xảy ra khi lệnh bị ngắt, người vận hành sửa được bằng chạy lại với cờ làm lại, có sao lưu và đường lùi trước khi chạy.
  file: `pipeline/label-ghep.mjs`
  severity: medium
  Đề xuất: known-limits

⚠ Cụm ngoài vùng phủ: 2/12 lỗi rơi vào file không bộ đo nào phủ (pipeline/lib/eval-classify.mjs) — dừng và quyết: mở rộng hợp đồng hay rút phạm vi.
