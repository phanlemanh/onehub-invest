## Trong hợp đồng

- **Bất biến bộ che tầng A: hàm thoát ký tự regex của cumTach hỏng ở cả hai bản lõi**
  file: `pipeline/lib/mask-source-names.mjs:32`
  severity: medium
  AC: AC-2
  source: invariants
  detail: Chuỗi thay thế lẽ ra là "\\$&" nhưng trong tệp lại là "\\const isWordChar = (c)" (dấu $& bị bung thành đoạn mã lúc chèn). Bản app `app/src/lib/mask-source-names.ts:33` hỏng tương tự. Từ nào của token wholeOnly có ký tự đặc biệt của regex (+ ( ) * ? $ ^ | [ ] { } \) sẽ sinh regex sai, không ném lỗi mà khớp 0 chỗ, nên hỏng theo hướng mở. Tái hiện: tên «alpha+ beta» trên «alpha+-beta» ra 0 chỗ trúng, bản thoát đúng ra 1; «alpha (beta)» cũng vậy. Cụm hai từ nối bằng dấu nối, gạch dưới, dấu chấm hay dấu / lọt bộ che và bộ soát của dòng khai match_whole, trái AC-2. Ba token S16 hiện tại không có ký tự này (0/3) nên chưa rò trên dữ liệu hôm nay, nhưng lỗi im lặng với dòng khai cờ sau này. Bảng ca không có ca chứa + hay ( nên test không bắt được.

- **AC-9 (không lộ tên thật trên kho công khai): phép dò bỏ sót tệp test của hàng**
  file: `_acceptance/che-ten-nguon-khong-lay-tu-dau/probes/khong-ten-that.mjs:26`
  severity: medium
  AC: AC-9
  source: invariants
  detail: AC-9 hứa dò trên các tệp test và bảng ca, nhưng danh sách VUNG không có ba tệp test mà hàng này thêm hoặc sửa: `app/tests/che-ten-cho-doc-app.test.tsx`, `app/tests/danh-ba-nguoi-tren-ops.test.tsx`, `pipeline/scripts/push-ops-facts-import.test.mjs`. Kết quả ĐẠT của E9 vì thế không phủ các tệp này. Hiện chưa có rò: lượt quét riêng trên toàn bộ tệp trong diff và thông điệp commit ra 0 chỗ trúng. Lỗ chỉ để lọt nếu về sau có người đưa tên thật vào các tệp đó.

- **cumTach thoát ký tự regex sai: tên match_whole có ký tự đặc biệt không bị che khi nối bằng dấu phân tách**
  file: `pipeline/lib/mask-source-names.mjs:32`
  severity: medium
  AC: AC-2
  source: bugs
  detail: Chuỗi thay thế trong `w.replace(/[.*+?^${}()|[\]\\]/g, "\\const isWordChar = (c)")` là văn bản rác, đúng ra phải là `"\\$&"` (commit bbfdf07e6). Bản chép `app/src/lib/mask-source-names.ts:33` mắc cùng lỗi. Regex vẫn biên dịch nên không ném lỗi nhưng không bao giờ khớp: hỏng im lặng. Tái hiện với tên giả {realName:'Foo+ Bar', wholeOnly:true}: 'foo+ bar' thành S99 (nhờ biến thể tên đủ), còn 'foo+-bar', 'foo+_bar', 'foo+  bar', 'foo+/bar' giữ nguyên. Đối chứng 'Alpha Beta' che đúng. Vì findSourceNames là lõi chung, cả bộ che lẫn bộ soát guardValues (leak gate sync-cloud, factsChan, trungCam) đều bỏ lọt tên thật tầng A ở các dạng này. Kích hoạt: dòng match_whole=true có token nhiều từ chứa một trong các ký tự * + ? ^ $ { } ( ) | [ ] \. Chưa đo giá trị S16 sẽ áp vì nằm trong tệp tên thật cục bộ. Cách sửa: đổi chuỗi thành `"\\$&"` ở cả hai bản và thêm ca vào bảng.

- **Hình dạng 4 (âm tính một mình): E6 đếm 0 qua bộ lọc sơ bộ không nhìn thấy nhánh cụm tách dấu, đối chứng dương không phủ nhánh này**
  file: `_acceptance/che-ten-nguon-khong-lay-tu-dau/discovery/do-ban-chep.mjs:54`
  severity: high
  AC: AC-6
  source: measurement
  detail: Dòng 54 dựng `loc` chỉ từ nameVariants (tên đủ và viết liền), rồi các câu SQL `~* loc` lọc trước khi gọi findSourceNames. Nhánh cumTach của lõi bắt thêm «ten-hai», «ten_hai», «ten.hai», «ten/hai», «ten  hai», nhưng các dòng đó không qua bộ lọc nên không bao giờ được đếm. Chạy lại đúng logic với tên giả: `lumora-thinh`, `LUMORA_THINH`, `lumora.thinh`, `lumora/thinh`, `Lumora  Thịnh` đều cho lọc sơ bộ = false trong khi lõi bắt = true. Assert `dung.out.* === 0` ở dòng 73 vẫn xanh khi bảng FILL có dòng mang cụm tách dấu, đúng loại dòng làm scanSourceNames dừng sync-cloud sau khi áp. Đối chứng cờ false (dòng 74) chỉ chứng minh nhánh từ đầu. Số 0 trong chay-thu.md không phủ nhánh được thêm ở vòng này.

- **Hình dạng 4 (âm tính một mình): ca push-ops-facts cho qua khi posts = 0 vì bất kỳ lý do gì và không ghim kết quả che thành S90**
  file: `pipeline/scripts/source-name-entries.itest.mjs:154`
  severity: high
  AC: AC-4
  source: measurement
  detail: Assert `r.posts === 0 || !/lumora.?thinh|lumorathinh/i.test(...)` xanh khi tiến trình chết vì lỗi bất kỳ, vì không kiểm r.code hay thông điệp chặn. Khi có gửi, nó chỉ dò vắng cụm liền: E4c hứa bản tin không mang chuỗi «lumora», nên phần dư như «lumora S90» vẫn lọt. E4b hứa «chuỗi chứa cụm hai từ bị che thành S90» nhưng không có assert dương nào tìm S90 cho ba dòng này. Đối chứng cờ false ở dòng 159-162 có nhánh `else assert.notEqual(cu.code, 0)`, nhận mọi mã thoát khác 0 mà không ghim lý do chặn.

- **Hình dạng 4 (âm tính một mình): ca AC-10 `--kho` chỉ assert 0 lời gọi, tiến trình chết vẫn xanh**
  file: `pipeline/scripts/push-ops-facts-import.test.mjs:41`
  severity: medium
  AC: AC-10
  source: measurement
  detail: Ca «AC-10 chạy khô --kho → 0 lời gọi» chỉ có `assert.equal(r.posts, 0)`. Không kiểm r.code, không ghim dòng ra `ops-facts khô: N chỗ chặn`. Nếu nhánh --kho ném lỗi ngay khi khởi động hoặc không nối được DB thì posts vẫn bằng 0 và ca vẫn đạt. Probe khong-gui-khi-import.sh chỉ chạy tệp này nên E10 không có đối chứng dương cho chế độ khô.

- **Hình dạng 4 (âm tính một mình): soát mã AC-4 chỉ có đối chứng đỏ cho một dạng câu SQL, các dạng đọc sổ khác lọt**
  file: `pipeline/scripts/soat-tang-a.test.mjs:214`
  severity: medium
  AC: AC-4
  source: measurement
  detail: `tuDocSo` chỉ khớp `(real_name|source_ids)...FROM\s+source_registry`. Chạy thử cho false với `SELECT real_name FROM public.source_registry`, `SELECT * FROM source_registry` và `SELECT real_name FROM "source_registry"`; dạng `public.source_registry` đang dùng trong kho (`pipeline/scripts/so-nhom.itest.mjs:578`). Đối chứng đỏ chỉ chèn đúng `SELECT code, real_name FROM source_registry`, nên không chứng minh lời hứa «không chỗ nào trong sáu còn tự đọc». Assert đi kèm `assert.match(src, /docSourceNameEntries/)` chỉ đo chuỗi có mặt: một dòng import hay chú thích là đủ.

- **Hình dạng 5 (tuyên quét lớp, chỉ có điểm-case): AC-9 hứa quét các tệp test nhưng danh sách cố định bỏ sót test mới của chính nhánh**
  file: `_acceptance/che-ten-nguon-khong-lay-tu-dau/probes/khong-ten-that.mjs:26`
  severity: medium
  AC: AC-9
  source: measurement
  detail: VUNG là danh sách tay. Hai tệp test mới trong diff không có trong danh sách: `app/tests/che-ten-cho-doc-app.test.tsx` và `pipeline/scripts/push-ops-facts-import.test.mjs`. Tệp `app/tests/danh-ba-nguoi-tren-ops.test.tsx` được sửa trong diff cũng không được quét. Tên thật lọt vào các tệp này vẫn cho «0 chỗ trúng — ĐẠT». Phạm vi nên suy từ diff hoặc ma trận đầy đủ, kèm assert số tệp đã quét.

- **Hình dạng 5 (tuyên quét lớp, chỉ có điểm-case): ma trận dấu phân tách chỉ thử một tên chữ thường, tên có ký tự đặc biệt lọt ở cả hai bản lõi**
  file: `pipeline/scripts/mask-source-names.cases.json:1`
  severity: medium
  AC: AC-2
  source: measurement
  detail: Mọi ca wholeOnly chỉ dùng một tên «Lumora Thịnh», nên chuỗi escape trong cumTach chưa từng được chạy. Chuỗi thay thế ở `pipeline/lib/mask-source-names.mjs:32` và `app/src/lib/mask-source-names.ts:33` là `"\\const isWordChar = (c)..."` thay vì `"\\$&"`. Chạy thật với wholeOnly=true: tên `Lumora+ Thịnh` với đầu vào `tin lumora+-thinh` và `tin lumora+_thinh`, tên `Lumora (VN) Thịnh` với `tin lumora-(vn)-thinh`, cả hai bản đều trả nguyên chuỗi, không che. Bảng ca cần thêm trục tên có ký tự đặc biệt của regex.

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **Quy tắc áp máy thu (AGENTS.md «Ai quyết gì»): số chạy thử không đo trên mã sẽ áp**
  Người dùng thấy gì: Số đo thử trước khi áp lên máy thu được lấy ở bản mã cũ hơn bản sẽ áp. Khi áp thật, số so sánh có thể không còn khớp nên người áp có thể dừng nhầm hoặc tin nhầm.
  Căn cứ: Đo lại rẻ, không mất dữ liệu và làm được ngay trước lúc áp, nên chỉ cần ghi nhận và đo lại lúc áp.
  file: `_acceptance/che-ten-nguon-khong-lay-tu-dau/ap-may-thu/chay-thu.md`
  severity: medium
  Đề xuất: known-limits

- **Bất biến hai lớp che đồng nhất (AC-2): che phía SQL không xử lý NBSP như bộ soát JS**
  Người dùng thấy gì: Nếu một dòng dữ liệu có cụm tên nối bằng khoảng trắng đặc biệt, lượt đẩy dữ liệu lên cloud sẽ dừng cả lượt thay vì chỉ bỏ dòng đó. Không lộ tên nguồn, nhưng dữ liệu cloud có thể chậm cập nhật.
  Căn cứ: Hệ thống chặn đúng hướng nên không lộ gì, hiếm gặp, và người vận hành thấy lượt đẩy dừng rồi xử lý được.
  file: `pipeline/sync-cloud.mjs`
  severity: low
  Đề xuất: known-limits

- **Lượt khớp cụm chạy theo thứ tự sổ, không ưu tiên dài hơn: cụm ngắn chiếm chỗ làm lộ phần đuôi của tên dài**
  Người dùng thấy gì: Khi sổ nguồn có hai tên mà tên ngắn là phần đầu của tên dài, chữ đã che có thể còn sót phần đuôi của tên dài và đi tiếp lên bản tin vận hành.
  Căn cứ: Là rò một phần tên nguồn tầng A theo cấu hình sổ, nhưng chỉ xảy ra khi sổ có hai tên chồng nhau, nên cần việc riêng có ca đo thay vì vá lẻ ở đây.
  file: `pipeline/lib/mask-source-names.mjs`
  severity: medium
  Đề xuất: new-contract

- **Hình dạng 2 (fixture viết tay): E4a hứa entries từ hàm nạp nhưng guardValues nhận mảng viết tay đúng khuôn bên đọc**
  Người dùng thấy gì: Một ca kiểm tra bộ soát dùng danh sách tên viết tay, nên nếu hàm nạp đổi tên trường thì ca này vẫn xanh. Lỗi như vậy chỉ lộ ở bước kiểm khác.
  Căn cứ: Hàm nạp đã có ca kiểm riêng nên rủi ro thấp, không mất hay lộ dữ liệu, và sửa sau rẻ.
  file: `pipeline/scripts/soat-tang-a.test.mjs`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 5 (tuyên quét lớp, chỉ có điểm-case): dạng viết liền không được thử ở scanSourceNames và maskedSourceExpr**
  Người dùng thấy gì: Ở bước che phía cơ sở dữ liệu và bộ soát đẩy cloud, chưa có ca thử riêng cho tên viết liền. Hiện chưa thấy rò, chỉ là chưa có bằng chứng thử trực tiếp.
  Căn cứ: Lõi đã được thử đủ dạng và chưa thấy rò thật, nên mức nặng thấp, bổ sung ca sau rẻ.
  file: `pipeline/scripts/source-name-entries.itest.mjs`
  severity: low
  Đề xuất: known-limits

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).
