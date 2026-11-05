## Trong hợp đồng

- **bangTruongHop vẫn đếm dòng trung_voi, nên bảng trường hợp lệch tiến độ và không bao giờ đủ**
  file: `app/src/lib/labels-luot-hai.ts:143` — severity: medium — AC: AC-8 — source: conventions
  Quyết định Hỏi-1 và AC-8 yêu cầu dòng có `trung_voi` không hiện và không tính tiến độ. `tinKe`, `nhomCuaLat`, `tienDo` đều đã thêm `(i.ghep->>'trung_voi') IS NULL`. CTE `i` của `bangTruongHop` thì không lọc: `SELECT item_id, stratum, ref_id FROM eval_label_items WHERE lat = $1 AND stratum IS NOT NULL`. `bang-truong-hop.tsx` hiện `daGan/tong` theo từng nhóm, nên `tong` thừa 11 dòng trên toàn lát. Dòng trùng không bao giờ vào hàng gắn, nên nhóm có dòng trùng gắn hết vẫn hiện thiếu, ví dụ 28/30, trong khi `chon-nhom` cùng màn báo đủ. Đầu dò `nap.mjs` chỉ đối chứng `trung_voi` qua `tienDo`, không phủ hàm này. Hướng xử lý: thêm cùng điều kiện lọc vào CTE `i`.

- **bangTruongHop vẫn tính dòng trung_voi, nhóm không bao giờ đủ «Đã gắn»**
  file: `app/src/lib/labels-luot-hai.ts:143` — severity: medium — AC: AC-8 — source: bugs
  AC-8 yêu cầu dòng có trung_voi không tính tiến độ. tinKe, nhomCuaLat, tienDo đã lọc `(i.ghep->>'trung_voi') IS NULL`, nhưng CTE `i` của bangTruongHop vẫn là `SELECT item_id, stratum, ref_id FROM eval_label_items WHERE lat = $1 AND stratum IS NOT NULL`. Dòng trùng không vào hàng gắn nên không bao giờ có nhãn, mà vẫn nằm trong `tong`. BangTruongHop (bang-truong-hop.tsx) hiện `daGan/tong`, nên nhóm có dòng trùng dừng ở dạng 29/30 dù đã gắn hết. Hai số tiến độ trên cùng màn lệch nhau. Theo số đo trong design doc, lát s03-theo-nhom có 11 dòng thừa thuộc 8 đơn vị. nap.mjs (E10) chỉ kiểm tienDo và tinKe nên không bắt được. Bằng chứng ui-check E5 (E5-het-nhom.png) thấy đúng lỗi này: header 7/7, bảng «Nhóm thử ghép 7/8».

- **Hình dạng 3 (assert giá trị trong khi lời hứa là quan hệ): ca «cụm lệch» không hề lệch, nên «lớn nhất trên cụm» không được đo**
  file: `pipeline/scripts/label-ghep.test.mjs:21` — severity: high — AC: AC-1 — source: measurement
  AC-1 và E1 hứa quan hệ: so_chu_gan là số lớn nhất trên cụm, kèm «ca cụm lệch số tin chữ gần». Fixture có T2=1000, A3=1001, A4=1040, T3=1100. Comment ghi T3 chỉ nằm trong cửa sổ của A4, nhưng A3 cách T3 99 giây, dưới 120, nên soChuGan(A3)=2 và soChuGan(A4)=2 (đã chạy thử). Hai bài ảnh bằng nhau, nên các dòng 38 và 43 chỉ ghim literal so_chu_gan: 2 và không phân biệt được Math.max với một bài bất kỳ. Đột biến trên bản sao ở scratchpad: đổi `Math.max(...ds.map(chuGan))` thành `chuGan(ds[0])`, mọi ca GHEP-AC-1 về ghép vẫn xanh; chỉ ca quét mã đỏ, do đường dẫn của bản sao, không liên quan đột biến. Cần fixture có bài ảnh N=1 và bài ảnh N=2 trong cùng cụm.

- **Hình dạng 4 (âm tính một mình, không đối chứng dương): «ok cum lech co co» đúng theo cấu trúc, không thể đỏ**
  file: `_acceptance/ghep-anh-tren-the-gan-nhan/probes/that.mjs:47` — severity: high — AC: AC-9 — source: measurement
  `lech` lọc dòng đại diện có so_chu_gan < 2 mà có dòng y cùng chu_ref với so_chu_gan > 1, rồi assert lech.length === 0. Mọi dòng cùng chu_ref nhận so_chu_gan từ cùng `cuaCum(chuId)` trong ghep-mau.mjs, nên cùng cụm luôn cùng số và `lech` luôn rỗng trên mọi dữ liệu. Phép đo không gọi soChuGan cho từng bài trong anh_refs để so với cờ, và không có đối chứng. Lời hứa của AC-9 («mọi cụm có tin chữ gần từ 2 đều có cờ trên đơn vị đại diện») và mục P1 trong gap-probe.md («fixed ... E11 ok cum lech co co») vì thế không được đo trên dữ liệu thật. Dòng «the co co N» chỉ in ra, không assert. Cộng với finding về fixture cụm lệch, không phép đo tự động nào trong diff bắt được việc bỏ Math.max.

- **Hình dạng 3 (assert giá trị trong khi lời hứa là quan hệ): AI đọc «theo tin chữ ghép» dùng cùng một mồi ở mọi bài**
  file: `_acceptance/ghep-anh-tren-the-gan-nhan/probes/nap.mjs:193` — severity: high — AC: AC-6 — source: measurement
  AC-6 và E7 hứa AI đọc lấy theo tin chữ ghép, tức quan hệ với refMay = g.chu_ref. Dòng 142 chèn silver_labels kind='rent_lt' cho cả t1, a1, a2, a3, rồi dòng 193 assert d.aiDoc?.kind === 'rent_lt' trên dòng a1. Nếu truy vấn silver_labels trong doiChieu quay về đọc b.ref_id (a1) thì vẫn nhận 'rent_lt' và phép đo vẫn xanh. Đối chứng với mốc ở dòng 196 chỉ kiểm dMoc.boDoc === null, không kiểm aiDoc. Chỉ boDoc phân biệt được nguồn, vì sale_offer_records chỉ gắn với t1. Muốn phân biệt, bài ảnh và tin chữ phải mang giá trị khác nhau. seed.mjs cho E8 cũng cùng mồi 'rent_lt' ở t1 và a1.

- **Hình dạng 5 (tuyên quét lớp nhưng chỉ phủ một phần): «không có luật thứ hai» bỏ sót các file app đọc cụm và không bắt hằng 120 ở app**
  file: `pipeline/scripts/label-ghep.test.mjs:92` — severity: high — AC: AC-1 — source: measurement
  E1 tuyên «label-ghep.mjs và app/src không có hằng 120 của luật ghép, đối chứng chèn hằng thì phép quét đỏ»; contract ghi «Never: luật ghép thứ hai ở app». Dòng 92 chỉ quét components/ops/labels, labels-anh.ts và labels-cum.ts. Nó bỏ labels-queries.ts, labels-luot-hai.ts và ops/zalo-media.ts, đều là file vòng này sửa, trong đó hai file đầu chứa SQL trên stg_zalo_posts. Regex CUA_APP ở dòng 86 không có 120 hay `interval`, nên `const CUA = 120` hoặc `interval '120 seconds'` trong file app đều lọt. CUA_MAU có \b120\b nhưng chỉ áp cho hai file pipeline. Đối chứng ở các dòng 88-89 chỉ assert regex khớp chuỗi literal, không phải chèn hằng vào file được quét rồi thấy phép quét đỏ.

- **Hình dạng 5 (tuyên ma trận nhưng chỉ có điểm-case): «ma trận sáu loại bài» của AC-3 thiếu loại và chỉ hai loại đi qua tinKe thật**
  file: `app/tests/labels-ghep.test.ts:37` — severity: medium — AC: AC-3 — source: measurement
  E3 tuyên «ma trận sáu loại bài: chữ, đường ảnh đúng thứ tự, cờ ghép, số tin chữ gần». Ma trận ở các dòng 37-43 cộng ca null ở dòng 51 không có loại «thiếu người gửi», dù contract liệt kê nó trong sáu loại; chỗ đó bị «dòng trùng cụm» chiếm, mà dòng trùng không phải một loại bài. Mỗi ca chỉ assert refsCuaDong và ghepHien, không assert chữ hay đường ảnh, và không có phép kiểm số phần tử bằng số assert như MA_TRAN bên pipeline. E3 còn hứa `ghep` null «bằng hàm không ghép từng trường», nhưng dòng 51-56 chỉ kiểm refsCuaDong. Bên E4, nap.mjs dòng 161-168 chỉ assert nội dung thẻ tinKe cho a1 và t4; dòng nhiều tin chữ, không tin chữ, có chữ có cụm có seed nhưng vòng tinKe ở dòng 218-223 chỉ thu itemId. Trong khi đó AC-3 ghi «Given sáu loại bài ..., When tải thẻ».

- **Hình dạng 2 (fixture viết tay đúng khuôn bên đọc): thứ tự ảnh của cụm không đi qua đường đọc thật, «theo thứ tự» chỉ đo bằng số lượng**
  file: `app/tests/labels-ghep.test.ts:111` — severity: medium — AC: AC-3 — source: measurement
  Hàm `goi` tiêm `traBai: async () => rows`, với rows là mảng BaiAnhRow chép tay đúng khuôn serveZaloMedia đọc (dòng 116 và 136). Vì vậy traBaiMacDinh, đoạn nối cột `ghep` trong DB qua docBaiCum sang số `anh`, là thay đổi của vòng này nhưng không được chạy: grep `docBaiCum|traBaiMacDinh` trong app/tests, thư mục hồ sơ và pipeline đều rỗng, và không đầu dò nào gọi /api/zalo-media. tinKe có gọi docBaiCum nhưng chỉ trả đường theo chỉ số, nên thứ tự không quan sát được: nap.mjs dòng 162 chỉ kiểm tin.anh.length === 3 trong khi AC-3 hứa «đủ đường ảnh theo thứ tự». Thiếu một phép round-trip: ghepLat ghi, route thật đọc, anh=i trả đúng tệp của bài thứ i. E5 chỉ ghi số «Ảnh n/N» đổi đúng, không đối chiếu ảnh với thứ tự bài.

- **Hình dạng 5 (tuyên lớp nhưng chỉ có điểm-case): lời hứa «đích khác DB thử thì từ chối» chỉ đo đúng một tên DB**
  file: `_acceptance/ghep-anh-tren-the-gan-nhan/probes/nap.mjs:239` — severity: medium — AC: AC-2 — source: measurement
  AC-2 hứa cho cả lớp: «đích khác DB thử khi chưa khai rõ thì từ chối». Phép đo của lệnh ghép ở dòng 239-240 chỉ thử DATABASE_URL trỏ `/oneinvest`. Phép đo ở dòng 237-238 đo chốt GHEP_DB trong chính _db.mjs của đầu dò, không phải mã sản phẩm. Bên được đo, pipeline/label-ghep.mjs dòng 49, chỉ so `pathname === "/oneinvest"`, nên mọi DB khác, kể cả DB cloud, đều được ghi mà không cần --db-that và phép đo vẫn xanh. Không có ca âm với tên DB khác nào để thể hiện lớp đã tuyên.

- **Hình dạng 4 (âm tính một mình): «dong them khong co ten nguon» và «collector hook khong doi» không ghim tập vào khác rỗng**
  file: `_acceptance/ghep-anh-tren-the-gan-nhan/probes/kin.mjs:54` — severity: low — AC: AC-10 — source: measurement
  Dòng 32 (quet(them) === 0) và dòng 54 (doi.length === 0) đều lấy từ `git diff coso HEAD`, với coso là merge-base của HEAD và origin/main. Probe buộc tập tên khác rỗng và có đối chứng cho `quet`, nhưng không assert `them` khác rỗng. Nếu merge-base trùng HEAD, ví dụ chạy lại sau khi gộp, diff rỗng và cả hai dòng xanh mà không đo gì. Dòng 54 cũng không có đối chứng rằng bộ lọc `^collector/|^\.claude/hooks/|^\.claude/settings` bắt được một đường dẫn đã đổi. Trên nhánh hiện tại diff khác rỗng nên kết quả lần này vẫn có nghĩa.

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **Thước eval-classify vẫn đọc chữ theo ref_id, nên chấm bài ghép trên chữ khác với chữ người gắn đã đọc**
  Người dùng thấy gì: Khi bắt đầu chấm độ đúng của bộ đọc trên lát này, các bài ảnh ghép sẽ bị chấm trên chữ khác với chữ người gắn đã đọc, nên điểm độ đúng thấp giả. Hiện lát chưa có nhãn nào nên chưa ra số sai.
  Căn cứ: Chưa gây sai số nào vì lát có 0 nhãn, nhưng nếu không sửa trước khi chấm thì số độ đúng ghi lại sẽ sai mà không báo; sửa nhỏ nhưng phải làm trước lần chấm đầu tiên.
  file: `pipeline/lib/eval-classify.mjs`
  severity: high
  Đề xuất: new-contract

- **label-ghep ghi nhiều dòng ngoài giao dịch, lỗi giữa chừng để lại lát dở mà lần chạy lại vẫn giữ nguyên**
  Người dùng thấy gì: Nếu lệnh ghép bị lỗi giữa chừng khi chạy trên dữ liệu thật, lát có thể ở trạng thái ghép dở và lần chạy lại vẫn báo đã có ghép nên không tự lành.
  Căn cứ: Chỉ xảy ra khi lệnh lỗi giữa chừng trong một lần chạy có người theo dõi, và đã có cách lùi bằng một lệnh xoá cột ghép rồi chạy lại nên không mất dữ liệu.
  file: `pipeline/label-ghep.mjs`
  severity: medium
  Đề xuất: known-limits

- **label-sample bỏ qua kết quả ghepLat: lấy mẫu bổ sung để dòng mới không có ghép, thiếu cột cũng không báo**
  Người dùng thấy gì: Khi lấy thêm tin vào một lát đã có, các tin mới có thể hiện một ảnh không có chữ và cùng một tin có thể bị gắn hai lần; lệnh lấy mẫu cũng không báo khi chưa áp cột mới.
  Căn cứ: Chỉ dính khi lấy mẫu bổ sung vào lát cũ, không phải đường dùng chính của lát mới, và người gắn nhãn thấy ngay thẻ thiếu chữ để báo lại.
  file: `pipeline/label-sample.mjs`
  severity: medium
  Đề xuất: known-limits

- **Thêm cột i.ghep làm 5 ca test cũ đỏ, job test app trong CI sẽ đỏ**
  Người dùng thấy gì: Không ảnh hưởng người dùng cuối, nhưng kiểm thử tự động của app sẽ đỏ nên PR này không qua được kiểm tra trước khi gộp.
  Căn cứ: Không làm hỏng dữ liệu hay màn hình nào, chỉ chặn việc gộp mã, và sửa rẻ vì chỉ cần nạp thêm bản cập nhật cột vào hai tệp kiểm thử.
  file: `app/tests/labels.test.tsx`
  severity: high
  Đề xuất: new-contract

- **label-sample bỏ kết quả ghepLat: dòng lấy thêm giữ ghep NULL, thiếu cột 076 cũng im lặng**
  Người dùng thấy gì: Khi lấy thêm tin vào lát đã có hoặc chạy trên DB chưa áp cột mới, tin mới không có chữ ghép và lệnh vẫn báo thành công mà không cảnh báo.
  Căn cứ: Chỉ dính ở đường lấy mẫu bổ sung hoặc chưa áp cột mới, người dùng thấy thẻ thiếu chữ và có thể chạy lại lệnh ghép sau khi áp cột.
  file: `pipeline/label-sample.mjs`
  severity: medium
  Đề xuất: known-limits

- **eval-classify chấm bộ đọc trên URL của bài ảnh, trong khi nhãn nay gắn theo chữ của tin ghép**
  Người dùng thấy gì: Khi chấm độ đúng của bộ đọc, các bài ảnh ghép bị chấm trên đường dẫn ảnh thay vì chữ của tin, làm điểm tụt giả tạo và được ghi lại không cảnh báo.
  Căn cứ: Lát chưa có nhãn nên chưa có số sai, nhưng số sai sẽ được ghi lặng lẽ khi bắt đầu chấm, nên cần sửa trước lần chấm đầu tiên.
  file: `pipeline/lib/eval-classify.mjs`
  severity: medium
  Đề xuất: new-contract

⚠ Cụm ngoài vùng phủ: 3/16 lỗi rơi vào file không bộ đo nào phủ (pipeline/lib/eval-classify.mjs, app/tests/labels.test.tsx) — dừng và quyết: mở rộng hợp đồng hay rút phạm vi.
