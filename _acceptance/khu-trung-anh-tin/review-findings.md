# Review findings: khu-trung-anh-tin (round 1)

## Trong hợp đồng

- **noiSau để URL của tệp đã khử quay lại thành dòng mới qua bài chỉ-ảnh, trái AC-2, và thước E6 không bắt được**
  file: `pipeline/transform-media.mjs:89`
  severity: medium
  AC: AC-3
  source: conventions
  detail: noiSau chỉ dựng tập URL từ các dòng còn lại của `cua`. Trước thay đổi này, tệp trùng vẫn có dòng nên URL của nó nằm trong tập. Nay tệp bị khử băm không còn dòng, URL của nó chỉ nằm trong seenUrl cục bộ của mediaRowsFromPosts và không truyền sang noiSau. Đã chạy lại phần lọc URL của noiSau với bài chữ có hai tệp a và b cùng băm, và bài chỉ-ảnh có cột media chứa URL của b: `cua` chỉ giữ a, còn dòng chỉ-URL của b vẫn lọt qua. Như vậy một ảnh trùng nội dung được thêm lại thành dòng lấy hộ, trái câu «URL của tệp đã khử không quay lại» của AC-2 trên đúng đường PL28 mà AC-3 mô tả. Ca AC-2 chỉ thử trong một lần gọi mediaRowsFromPosts nên không phủ đường này. do-khu-trung-anh.mjs:65 chỉ đếm URL mong đợi bị thiếu, không đếm URL thừa, nên phép đo «URL lệch 0» cũng không phát hiện.
  rationale: Ảnh trùng băm từ bài chỉ-ảnh vẫn thêm dòng, trái AC-3 «ảnh trùng không thêm dòng» (và câu URL không quay lại của AC-2).

- **buildOfferImages lệch luật với bên ghi khi cùng tệp lần sau mới có băm**
  file: `app/src/lib/ops/review-media.ts:97`
  severity: low
  AC: AC-7
  source: conventions
  detail: Tài liệu đầu tệp và AC-7 quy định buildOfferImages là thước theo đúng luật của bên ghi, nhưng hai bên xử lý khác nhau ở thứ tự bước. buildOfferImages luôn gọi `daCoSha.add(sha)`, kể cả khi push bị bỏ vì src đã có. mediaRowsFromPosts và danhSachAnh thì bỏ qua entry trùng tệp trước khi ghi nhận băm. Với chuỗi [a không băm, a băm X, b băm X], bên ghi và danhSachAnh giữ a và b, còn buildOfferImages chỉ trả a. Ma trận MA_TRAN ở app/tests/khu-trung-anh.test.tsx không có dòng này, dù ma trận AC-2 của bên ghi có ca «cùng tệp, lần sau mới có băm». Mức thấp vì theo số đo trong contract, 28.220 entry có tệp thật đều có băm.
  rationale: AC-7 đòi buildOfferImages cho cùng kết quả với luật mới trên ma trận tương đương; ca này cho kết quả khác.

- **Hình dạng 1 — đo chỉ dẫn thay vì đầu ra: «dữ liệu thẻ không mang băm» chỉ grep mã nguồn**
  file: `app/tests/khu-trung-anh.test.tsx:99`
  severity: medium
  AC: AC-8
  source: measurement
  detail: AC-8 và E9 hứa «dữ liệu thẻ không có khoá sha256 hay giá trị băm». Dòng 99-103 chỉ đọc văn bản labels-queries.ts và labels-luot-hai.ts: assert.match một mẫu `anh: nguon.map(...)` và assert.doesNotMatch(/sha256/). Không ca nào chạy bộ dựng thẻ rồi xem kết quả, dù tinKe nhận `q` tiêm được (labels-queries.ts:40). Mã nguồn thêm `...nguon[i]` hay `nguon` vào object trả về sẽ lộ băm xuống trình duyệt mà vẫn không có chữ sha256 và vẫn giữ dòng `anh:`, nên thước xanh. Cần soi JSON đầu ra của thẻ, tìm cả khoá lẫn giá trị băm.
  rationale: AC-8 đòi dữ liệu thẻ không mang băm; thước chỉ grep mã nên không chứng minh được.

- **Hình dạng 4 — âm tính một mình: đầu vào «Bán căn» không thể làm chuKhongLink lộ băm**
  file: `app/tests/khu-trung-anh.test.tsx:98`
  severity: medium
  AC: AC-8
  source: measurement
  detail: Dòng 98 assert.doesNotMatch(JSON.stringify(chuKhongLink("Bán căn", anh)), /a{64}/). Chữ không có link nên hàm trả nguyên {chu: goc, soLinkKhac: 0} (labels-anh.ts, nhánh `if (!co)`), và tham số anh không thể đi vào đầu ra. Assert này xanh với mọi cài đặt. «Đối chứng» ở dòng 97 chỉ chứng minh danhSachAnh có sha256, không chứng minh kênh chuKhongLink có thể đỏ. Không có ca dương nào cho thấy thước bắt được băm trong đầu ra.
  rationale: Ca âm không thể đỏ nên không chứng minh vế «không mang băm» của AC-8.

- **Hình dạng 4 — âm tính một mình: ca đỏ KTA-AC-6 không chạy thước AC-6, chỉ notEqual trên hàm thuần**
  file: `pipeline/scripts/khu-trung-anh.itest.mjs:160`
  severity: medium
  AC: AC-6
  source: measurement
  detail: E7 hứa «ca đỏ trên bản sao khoá dòng theo băm thay vì tệp báo đổi khoá». Ca ở dòng 157-161 chỉ gọi dot.mediaRowsFromPosts rồi assert.notEqual với một mediaKey tính tại chỗ. Nó không đưa bản đột biến qua runTransformMedia, không gọi assert thật ở dòng 147 và không ghim thông điệp «KTA-AC-6 đổi khoá». Thông điệp ở dòng 160 là của chính assert notEqual. Vì thế ca này chỉ chứng minh đột biến có đổi giá trị, không chứng minh thước AC-6 đỏ. Các ca đỏ AC-3, AC-4 trong cùng tệp có đi qua thước thật bằng assert.throws hoặc assert.rejects kèm regex.
  rationale: Ca đỏ không đi qua thước thật của AC-6 nên AC-6 chưa được chứng minh bắt được lỗi.

- **Hình dạng 5 — tuyên ma trận nhưng chỉ có một điểm-case: KTA-AC-6 đầu, giữa, cuối nằm chung một fixture**
  file: `pipeline/scripts/khu-trung-anh.itest.mjs:131`
  severity: medium
  AC: AC-6
  source: measurement
  detail: E7 ghi «ma trận dòng trùng ở đầu, giữa, cuối tin, có dòng khác băm đứng sau». Test chỉ có một fixture a,a2,b,b2,c,c2 và không có bảng ma trận. Comment dòng 131 nói có «d đứng sau mọi dòng trùng ở tin thứ hai», nhưng không có ảnh d cũng không có tin thứ hai. Khi ba vị trí nằm chung một tin, a2 ở đầu làm mọi dòng sau đều dời, nên các ca trùng chỉ ở giữa hay chỉ ở cuối không được đo riêng. Ví dụ trùng chỉ ở cuối thì mọi dòng còn lại phải giữ dấu 2000. Assert dấu thời gian ở dòng 149-151 chỉ phủ đúng một tổ hợp.
  rationale: AC-6 đòi dòng trùng ở đầu, giữa và cuối tin; fixture gộp chung nên từng vị trí chưa được đo riêng.

- **Hình dạng 5 — E8 tuyên ma trận và ca đỏ nhưng lệnh của nó chỉ chạy một ca**
  file: `_acceptance/khu-trung-anh-tin/evals.yaml:67`
  severity: medium
  AC: AC-7
  source: measurement
  detail: E8 có cmd kta_app_db, tức chỉ chạy tests/khu-trung-anh.itest.tsx với đúng một ca 20 entry, 13 băm. Phần expected còn đòi «ma trận NH-AC-3 cộng ca trùng băm xanh» và «ca đỏ: bản sao buildOfferImages». Hai thứ này nằm ở tests/khu-trung-anh.test.tsx (dòng 111-123), không có trong lệnh hay `paths` của E8. Ma trận NH-AC-3 thật ở app/tests/media-canonical.test.tsx:116 không thuộc lệnh KTA nào. MA_TRAN mới chỉ có 3 dòng tự viết. Comment config.yaml:155 ghi kta_app phủ «E8, E9», trái với cmd của E8. Bằng chứng ghi cho E8 vì thế không chứa phần ma trận và ca đỏ mà nó tuyên.
  rationale: AC-7 đòi thước buildOfferImages cho cùng kết quả trên ma trận tương đương; lệnh E8 không chạy ma trận đó.

- **Hình dạng 3 — lời hứa là quan hệ «cùng luật với bên ghi» nhưng danhSachAnh chỉ so với chuỗi viết tay**
  file: `app/tests/khu-trung-anh.test.tsx:68`
  severity: medium
  AC: AC-8
  source: measurement
  detail: AC-8 và tên ca «danhSachAnh khử cùng luật với bên ghi» là quan hệ giữa danhSachAnh và mediaRowsFromPosts. kiemAc8 chỉ deepEqual với danh sách literal trong AC8 (dòng 55-61) và không gọi bên ghi, dù tệp đã import mediaRowsFromPosts. Phần so hai bên duy nhất là shaTep (dòng 73-77). Hai hàm còn khác nhau ở chỗ test không chạm: danhSachAnh không kiểm MEDIA_FILE và SNAPSHOT_ID như localFile, và dùng urlHopLe thay vì httpUrl chuẩn hoá. Cần so hai bên trên cùng ma trận.
  rationale: AC-8 đòi danh sách khử theo cùng luật với bên ghi; test không so hai bên trên cùng ma trận.

- **Hình dạng 3 — KTA-AC-4 lấy đáp án từ chính hàm được đo, không phải quan hệ «giống hệt trước»**
  file: `pipeline/scripts/khu-trung-anh.itest.mjs:120`
  severity: low
  AC: AC-4
  source: measurement
  detail: AC-4 hứa dòng S06 «giống hệt trước từng cột». Dòng 120 tính `mong` bằng mediaRowsFromAd của cây, cũng là hàm transform-media gọi để ghi. Đổi ngay trong mediaRowsFromAd thì hai vế đổi cùng nhau và test vẫn xanh. Đột biến ở dòng 125 chỉ sửa chỗ gọi trong transform-media, trong khi E5 ghi là «bản sao mediaRowsFromAd». Tên ca nói «kể cả bỏ URL trùng» nhưng không có assert số dòng hay literal nào cho [x, y]. Phần so với bảng thật ở do-khu-trung-anh (E6) chỉ che được vế dữ liệu máy thu.
  rationale: AC-4 đòi dòng S06 giống hệt trước; đáp án lấy từ chính hàm được đo nên không chứng minh quan hệ đó.

- **Hình dạng 4 — âm tính một mình: ca «cùng băm ở hai tin» chỉ notEqual trên md5 có chứa offerId**
  file: `pipeline/scripts/khu-trung-anh.test.mjs:62`
  severity: low
  AC: AC-1
  source: measurement
  detail: E1 tính ca này là một dòng ma trận «vẫn là hai dòng của hai tin». Dòng 62 chỉ assert.notEqual media_key của o1 và o2. mediaKey băm `offerId|local` nên hai khoá khác nhau theo cách dựng khi mỗi bên có dòng. Ca không assert số dòng hay tệp giữ lại, không có thông điệp ghim, không có đối chứng dương hay ca đỏ. Hai lần gọi độc lập cũng không đi qua đường nhiều tin của transform.
  rationale: Ca âm giữa hai bài/tin thuộc ma trận AC-1 nhưng assert quá yếu để chứng minh.

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **kta_db và kta_app_db cùng dựng lại một DB thử mà không dùng --neu-chua-co**
  Người dùng thấy gì: Khi hai bài kiểm chạy cùng lúc, một bài có thể xoá DB thử của bài kia và báo đỏ giả. Người dùng thật không bị ảnh hưởng.
  Căn cứ: Chỉ làm kết quả kiểm chập chờn cho đội, không mất dữ liệu; chạy lại là qua, sửa sau rẻ.
  file: `_acceptance/config.yaml`
  severity: medium
  Đề xuất: known-limits

- **Hai lệnh chấm kta_db và kta_app_db cùng xoá rồi dựng lại một DB thử, chạy song song sẽ đụng nhau**
  Người dùng thấy gì: Hai bài kiểm chạy song song có thể giẫm lên DB thử của nhau và báo đỏ giả. Người dùng không thấy gì.
  Căn cứ: Chỉ gây nhiễu khi kiểm, không mất dữ liệu; chạy lại được và sửa sau rẻ.
  file: `_acceptance/config.yaml`
  severity: medium
  Đề xuất: known-limits

- **Link của ảnh đã khử trùng bị đếm thành «liên kết khác» trên thẻ gắn nhãn**
  Người dùng thấy gì: Trên thẻ gắn nhãn, bài có hai ảnh giống hệt có thể hiện dòng «có 1 liên kết khác» thừa. Hiện chưa bài nào gặp.
  Căn cứ: Chỉ là dòng chữ thừa, không mất dữ liệu, hôm nay chưa có bài nào dính; người gắn nhãn bỏ qua được.
  file: `app/src/lib/labels-anh.ts`
  severity: low
  Đề xuất: known-limits

- **Hình dạng 5 — không ghim số dòng ma trận, số trong eval lệch số trong test, ca đỏ chỉ chứng minh dòng đầu**
  Người dùng thấy gì: Bộ kiểm có thể vẫn xanh dù một số dòng trong ma trận bị xoá hay chưa từng được chứng minh đỏ. Người dùng chưa thấy ảnh hưởng.
  Căn cứ: Chỉ làm bộ kiểm lỏng hơn mong muốn, dữ liệu không mất; bổ sung dòng ma trận sau không đắt.
  file: `_acceptance/khu-trung-anh-tin/evals.yaml`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 3 — «số offer có ảnh không giảm» so với bản nền trước PL28, không so với trước khử trùng**
  Người dùng thấy gì: Phép đo có thể không phát hiện nếu khử trùng làm vài tin mất hết ảnh so với bản đang chạy. Chưa có dấu hiệu xảy ra.
  Căn cứ: Thước AC-5 đã kiểm mỗi tin còn đủ băm nên rủi ro thấp; chỉ là phép đo bổ sung thiếu mốc.
  file: `pipeline/scripts/do-gop-anh.mjs`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 2 — fixture media_files viết tay, không rút từ bên ghi mediaFilesOf**
  Người dùng thấy gì: Các ca thử trên DB dùng dữ liệu ảnh dựng tay thay vì đi từ bên thu về, nên nếu khuôn dữ liệu bên thu đổi, bộ kiểm có thể không nhận ra. Hiện khuôn đang khớp.
  Căn cứ: Khuôn hiện khớp và phép đo trên dữ liệu thật bắt được phần lớn sai lệch; chỉ là lỗ hổng bộ kiểm, sửa sau không gấp.
  file: `pipeline/scripts/khu-trung-anh.itest.mjs`
  severity: low
  Đề xuất: known-limits

⚠ Cụm ngoài vùng phủ: 4/16 lỗi rơi vào file không bộ đo nào phủ (_acceptance/config.yaml, _acceptance/khu-trung-anh-tin/evals.yaml) — dừng và quyết: mở rộng hợp đồng hay rút phạm vi.
