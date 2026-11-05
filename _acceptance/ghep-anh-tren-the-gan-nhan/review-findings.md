## Trong hợp đồng

- **Hình dạng 4 (âm tính một mình, không đối chứng dương): 'ok lat moi co ghep' luôn xanh vì so 0 === 0**
  AC: AC-2
  file: `_acceptance/ghep-anh-tren-the-gan-nhan/probes/nap.mjs:149`
  severity: high
  source: measurement
  detail: AC-2 và E2 hứa lát mới có `ghep`. Dòng 148-149 chỉ assert `kqMoi.them === 3 && moiLat.n === 3 && (ghepLat thu).co_ghep === moiLat.g`, không có `moiLat.g > 0`. Đã tính ngoài DB bằng `chonMau` và `ghepChoMau` thật trên đúng 12 bài của fixture, `testMarker` không gạt bài nào. Seed 'ghep-nap-moi', n=3 chọn đúng ghep-nap-t4, t3, t6, là ba bài có `ghep` null của nhóm: t3 không có ảnh nào gán về vì a4 gần t2 hơn, t4 không ảnh, t6 có chữ và ảnh riêng. Băm chọn mẫu chỉ phụ thuộc seed và chữ bài nên kết quả không đổi giữa các lần chạy. Do đó `co_ghep = 0` và `moiLat.g = 0`, phép so là 0 === 0. Xoá `await ghepLat(client, { lat })` trong `layMau` (pipeline/label-sample.mjs) thì ca này suy ra vẫn xanh; chưa chạy đột biến trên DB. Nhánh `layMauTheoNhom`, đường thật của lát s03-theo-nhom, cũng thêm dòng gọi này nhưng probe không gọi `layMau` với `theoNhom`. Vì vậy cả hai điểm nối sampler với lệnh ghép chưa có phép đo phân biệt được, dù nhãn eval ghi 'ok lat moi co ghep'.

- **Hình dạng 2 (fixture và bên đọc viết tay, không đi qua reader thật): E3 đo chữ và ảnh trên `theCua`, bản chép đường đọc nằm trong test**
  AC: AC-3
  file: `app/tests/labels-ghep.test.ts:39`
  severity: medium
  source: measurement
  detail: E3 hứa 'chữ đúng tuyệt đối, đường ảnh đúng thứ tự' và khai `paths` có app/src/lib/labels-queries.ts, nhưng test không import labels-queries, labels-cum hay `tinKe`. Dòng 39-44 tự dựng lại đường đọc, comment ghi 'theo đúng cách đường đọc ghép'. Ảnh là `chiUrl(r.toLowerCase())` viết tay từ tên bài, chữ tự chọn theo `chu_ref`. Hàm này còn khác mã thật: với `chu_ref` null nó gán `goc = ""`, còn `tinKe` đưa `r.text` (URL ảnh) qua `chuKhongLink`. Nên cột chữ "" của 'khong tin chu' và 'thieu nguoi gui' (dòng 49, 52) là hiển nhiên đúng, không đo việc bỏ link. Ca 'du lieu xuong trinh duyet' (dòng 90) cũng quét một object tự ghép từ `ghepHien` và `duongAnh`, không phải dữ liệu thẻ thật. Đổi `tinKe` về đọc `r.text` thì mọi ca GHEP-AC-3 vẫn xanh. Phần còn phân biệt được là matrix `tinKe` thật ở E4 (nap.mjs dòng 223), cần DB; lệnh `ghep_thuan` của E3 không chạy nó.

- **Hình dạng 5 (tuyên quét lớp nhưng chỉ có điểm-case): 'khong co luat thu hai' để lọt các dạng cửa sổ thời gian tự nhiên trong TypeScript**
  AC: AC-1
  file: `pipeline/scripts/label-ghep.test.mjs:114`
  severity: medium
  source: measurement
  detail: AC-1 và mục Never của hợp đồng hứa app không có cửa sổ thời gian riêng, tức một lớp mở. Phép quét chỉ là regex `LUAT` và `LUAT_CUM`; năm mẫu đối chứng ở dòng 130-136 đều được viết đúng các dạng regex bắt, nên không lộ phần thiếu. Đã chạy chính hai regex này: `Math.abs(a.postedAt - b.postedAt) < 120_000`, `Math.abs(ta - tb) < 120000`, `< 2 * 60 * 1000`, `new Date(p.posted_at).getTime() - t < 120_000` và SQL `WHERE a < p.posted_at` đều không bị bắt, cả ở `LUAT_CUM` của đường đọc cụm. Lý do: `\\b120\\b` không khớp mili-giây hay `120_000`, còn `posted_at\\s*[<>-]` chỉ khớp khi toán tử đứng ngay sau tên cột viết snake_case. Một luật ghép thứ hai viết bằng JS theo mili-giây trên `postedAt` vẫn cho 'ok khong co luat thu hai'. Thiếu ma trận dạng viết trước gồm đơn vị mili-giây, biểu thức `2 * 60` và so sánh đảo vế.

- **Hình dạng 4 (âm tính thiếu đối chứng dương): phép đếm mồi qua HTTP của E8 không có mồi ở a2, a3, còn a1 trùng giá trị với tin chữ**
  AC: AC-6
  file: `_acceptance/ghep-anh-tren-the-gan-nhan/probes/seed.mjs:89`
  severity: low
  source: measurement
  detail: AC-6 hứa 'mồi giá trị máy ở mọi bài của cụm và ở tin chữ', tải thẻ 'qua HTTP thật'. Cụm đầu của seed gồm t1, a1, a2, a3, nhưng dòng 88-91 chỉ chèn offer và assertion theo t1, và `silver_labels` cho t1, a1 với cùng giá trị ('inquiry', 'rent_lt'). a2, a3 không có mồi nào, a1 không có mồi riêng để phân biệt với t1. Kết quả E8 'mọi số đếm giá trị mồi = 0' vì thế không nói gì về rò rỉ từ a2, a3 trên phản hồi HTTP. Mồi riêng từng bài (`moi_ai_a1..a3`, TOAMAYANH) chỉ có trong nap.mjs (E7), đo bằng `tinKe` và render `LabelsContent` trong tiến trình, không qua HTTP. Vì hai đường dùng chung `tinKe`, phần hở chỉ còn ở tầng HTTP, nên mức thấp.

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **eval-classify vẫn chấm trên chữ của ref_id, lệch với chữ tin ghép mà người gắn đã đọc**
  Người dùng thấy gì: Khi chấm độ chính xác của máy đọc, các bài chỉ có ảnh bị chấm trên đường dẫn ảnh thay vì chữ của tin đã ghép, nên điểm có thể thấp giả mà không có cảnh báo. Hiện chưa ra số sai vì chưa có nhãn nào được lưu cho các lát này.
  Căn cứ: Chưa có số sai nào ra ngoài vì chưa có nhãn, nhưng lần chấm đầu sẽ cho điểm lệch mà không ai biết, nên cần một việc riêng trước lần chấm đầu.
  file: `pipeline/lib/eval-classify.mjs`
  severity: high
  Đề xuất: new-contract

- **Cột và khoá JSON mới đặt tiếng Việt, trái quy ước tên bảng/cột tiếng Anh**
  Người dùng thấy gì: Người dùng không thấy gì khác đi; chỉ là tên cột và khoá dữ liệu nội bộ viết bằng tiếng Việt, trái quy ước của dự án. Đổi tên về sau sẽ tốn thêm một đợt chuyển dữ liệu.
  Căn cứ: Không ảnh hưởng người dùng hay làm mất dữ liệu, chỉ là nợ quy ước; đổi tên sớm trước khi áp lên DB thật thì rẻ hơn, nhưng không chặn việc ra mắt.
  file: `db/migrations/076_labels_ghep.sql`
  severity: medium
  Đề xuất: known-limits

- **label-sample bỏ kết quả ghepLat: dòng lấy thêm giữ ghep NULL, thiếu cột 076 cũng báo thành công**
  Người dùng thấy gì: Khi lấy thêm bài vào một lát đã có, các bài ảnh mới không được ghép: chúng hiện như ảnh lẻ không chữ, và một tin có thể bị gắn nhãn hai lần. Nếu thiếu cột dữ liệu, lệnh vẫn báo xong mà không cảnh báo.
  Căn cứ: Chỉ xảy ra khi lấy thêm vào lát đã có, người vận hành thấy và chạy lại lệnh ghép được, nhưng nhãn gắn trùng sẽ làm sai số liệu nên đáng xử lý trong một việc riêng.
  file: `pipeline/label-sample.mjs`
  severity: medium
  Đề xuất: new-contract

- **CLI label-ghep ghi ngoài giao dịch; lỗi giữa chừng để lại lát dở mà lần chạy sau báo «giữ nguyên»**
  Người dùng thấy gì: Nếu lệnh ghép bị ngắt giữa chừng, một phần bài đã ghép còn phần kia thì không, và lần chạy lại báo là đã xong dù còn thiếu. Người vận hành phải biết chạy lại với tuỳ chọn làm lại.
  Căn cứ: Hiếm gặp, không mất dữ liệu và gỡ được bằng chạy lại có tuỳ chọn làm lại; chỉ cần ghi rõ trong hướng dẫn vận hành.
  file: `pipeline/label-ghep.mjs`
  severity: medium
  Đề xuất: known-limits

- **label-ghep nhận --lat không tồn tại mà vẫn thoát 0, thiếu kiểm đầu vào như lệnh cùng họ**
  Người dùng thấy gì: Gõ sai tên lát thì lệnh ghép báo 0 dòng và coi như thành công, nên người chạy tay có thể tưởng đã ghép xong.
  Căn cứ: Nhẹ và dễ nhận ra vì kết quả in 0 dòng; không mất dữ liệu, người chạy gõ lại là được.
  file: `pipeline/label-ghep.mjs`
  severity: low
  Đề xuất: known-limits

- **eval-classify vẫn chấm theo chữ của ref_id: dòng bài ảnh bị chấm trên URL ảnh, trong khi nhãn người gắn theo chữ tin ghép**
  Người dùng thấy gì: Với các bài chỉ có ảnh, máy đọc bị chấm trên đường dẫn ảnh thay vì chữ của tin ghép, làm điểm thấp giả và được ghi vào kết quả kiểm chất lượng mà không có cảnh báo. Hiện chưa lộ số sai vì chưa có nhãn.
  Căn cứ: Số sai sẽ ghi vào kết quả kiểm chất lượng từ lần chấm đầu và dễ gây hiểu nhầm, nhưng chưa có nhãn nên chưa gây hại; sửa trước lần chấm đầu thì rẻ.
  file: `pipeline/lib/eval-classify.mjs`
  severity: high
  Đề xuất: new-contract

- **label-sample bỏ qua kết quả ghepLat: dòng lấy thêm giữ ghep NULL, thiếu cột 076 vẫn báo thành công**
  Người dùng thấy gì: Bài ảnh được lấy thêm vào lát đã có sẽ không được ghép, hiện thành thẻ chỉ một ảnh không chữ, và cùng một tin có thể bị người gắn nhãn hai lần; lệnh vẫn báo thành công.
  Căn cứ: Gây nhãn trùng và thẻ thiếu chữ nhưng chỉ trong lần lấy thêm, người vận hành chạy lại lệnh ghép được; nên gom vào một việc riêng.
  file: `pipeline/label-sample.mjs`
  severity: medium
  Đề xuất: new-contract

- **CLI label-ghep ghi từng dòng ngoài giao dịch: lỗi giữa chừng để lại lát dở, chạy lại báo «giữ nguyên» và exit 0**
  Người dùng thấy gì: Nếu lệnh ghép bị ngắt giữa chừng, các bài còn lại vẫn hiện không chữ, và lần chạy lại báo «giữ nguyên» như thể đã xong. Phải chạy lại với tuỳ chọn làm lại.
  Căn cứ: Hiếm, không mất dữ liệu và có đường gỡ rõ ràng; ghi vào hướng dẫn vận hành là đủ trước khi chạy trên dữ liệu thật.
  file: `pipeline/label-ghep.mjs`
  severity: medium
  Đề xuất: known-limits

⚠ Cụm ngoài vùng phủ: 2/12 lỗi rơi vào file không bộ đo nào phủ (pipeline/lib/eval-classify.mjs) — dừng và quyết: mở rộng hợp đồng hay rút phạm vi.
