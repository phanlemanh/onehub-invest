## Trong hợp đồng

- **Probe ranh giới AC-9 hẹp hơn phạm vi hợp đồng: bỏ sót scripts/cloud-sync.sh và nhiều script thu, nạp**
  file: `_acceptance/sdt-s06-khoi-phuc-xuat-xu/probes/ranh-gioi.sh:10`
  severity: low
  AC: AC-9
  source: conventions
  detail: AC-9 cam kết không đổi «tệp đẩy cloud» và «script thu, nạp». Regex của probe chỉ bắt db/migrations/, pipeline/sync-cloud, pipeline/push-ops-facts, app/, data-api/, collector/, pipeline/collect-, pipeline/import-. Vì vậy nó không bắt: scripts/cloud-sync.sh (config.yaml liệt kê trong t3_paths, nhóm dữ liệu rời máy), pipeline/thu-so-s06.mjs, pipeline/bu-seller-v5.mjs, pipeline/apify-*, pipeline/fetch-data.sh, pipeline/import.sh (mẫu 'pipeline/import-' không khớp), scripts/*-daily.sh. PR sửa các tệp đó vẫn in «ranh-gioi: xanh», nên E9 có thể chứng sai AC-9. Diff hiện tại không chạm các tệp này (đã đối chiếu git diff --stat), nên đây là lỗ của phép kiểm, chưa phải vi phạm. Đề xuất: thêm các mẫu này vào regex, hoặc thu hẹp câu chữ AC-9 cho khớp regex.

- **Ca KP-AC-8 ghi đè số đếm bằng hằng, không dựng dòng in từ kết quả bộ gán như E8a mô tả**
  file: `pipeline/scripts/gan-sdt-s06.test.mjs:1066`
  severity: low
  AC: AC-8
  source: conventions
  detail: E8a ghi «dòng do dongGan dựng từ kết quả bộ gán thật», nhưng test gọi dongGan({ ...r.sdt, khoi_phuc: 1, khong_ro: 1 }). Hai giá trị được đo bị thay bằng hằng ngay trước assert /khoi_phuc=1 khong_ro=1/, nên assert này chỉ đo định dạng của dongGan, không đo đường từ bộ gán tới dòng in mà gap-probe P1 yêu cầu sửa. Mức thấp vì hai assert ngay trước đó đã kiểm r.sdt.khoi_phuc và r.sdt.khong_ro bằng 1, nên giá trị sai vẫn bị bắt. Đề xuất: dùng dongGan(r.sdt) để test khớp đúng lời khai của eval. Số dòng là ước lượng (phần thêm cuối tệp); tìm chuỗi `dongGan({ ...r.sdt, khoi_phuc: 1, khong_ro: 1 })`.

- **KP-AC-5 không bao giờ chạy SQL thật trên tin khoá lạ có số thuộc tài khoản, nên ca xanh không đo điều kiện không-có-khoá**
  file: `pipeline/scripts/gan-sdt-s06.test.mjs:932`
  severity: medium
  AC: AC-5
  source: bugs
  detail: Trong ca xanh, tin 90 khoá lạ mang soLa, không nằm trong cac_so của tài khoản M, kể cả sau khi thêm số thứ hai ở dòng 949. Vì vậy CASE rơi về ELSE 'khong_ro' dù có hay không có điều kiện `NOT r.field_provenance ? 'seller_phone'`. Chỉ ca đỏ (dòng 955) mới gán soLa vào stg 93, và ca đó chỉ chạy SQL đã đột biến. Không ca nào chạy SQL_GAN thật trên fixture này. Lời hứa của AC-5 (khoá có sẵn không bị suy lại) vì thế không có đo hành vi; thứ duy nhất chặn hồi quy là `assert.ok(SQL_GAN.includes(tu))` trong dotBien, tức ghim chuỗi, viết lại SQL và cập nhật chuỗi là qua. Nhánh còn lại, khoá lạ có số bằng số riêng (dòng 42 của gan-sdt-s06.mjs), không có ca nào; ma trận 88 ô cũ và ma trận K cũng không có tin khoá lạ. Header evals.yaml nói ca đỏ chạy «trên cùng fixture», nhưng ca này đổi stg trước khi đo. Cách sửa: trong ca xanh, thêm bước cho số trên tin khoá lạ trùng số tài khoản và trùng số riêng, rồi chạy SQL_GAN thật và assert số, khoá không đổi.

- **E8b khai DB local chưa có tin mang số, nhưng lượt đo thực tế thấy hơn 24 nghìn tin có số**
  file: `_acceptance/sdt-s06-khoi-phuc-xuat-xu/evals.yaml:75`
  severity: medium
  AC: AC-8
  source: bugs
  detail: Expected của E8b viết «DB local chưa có tin mang số» nên chỉ đo sự có mặt của hai số đếm. AC-8 và Context của contract.md cũng dựa trên «DB local có 0 tin S06 mang số». Chạy `node pipeline/gan-sdt-s06.mjs --thu` hôm nay (ROLLBACK, md5_khop=true) in ban truoc=12587, thue truoc=11436, tức 24023 tin đang mang số, cùng khoi_phuc=0, khong_ro=0, doi=7209. Hai hệ quả: (1) số 0 của lệnh này giờ là kết quả đo thật trên dữ liệu thật, nhưng hồ sơ vẫn gọi nó là không đo giá trị, nên người đọc bằng chứng hiểu sai; (2) lý do của Hỏi-2 trong contract («lúc rẻ nhất vì chưa tin nào có số») không còn đúng, trong khi Mạnh chọn «để sau» với giá nêu trên thẻ là «làm sau đắt hơn vì đã có dữ liệu phải chuyển». G3 («hôm nay không có tin nào») cũng cần đo lại. Cần sửa câu trong evals, contract và thẻ, rồi trình lại Hỏi-2 với số mới. Giá trị khong_ro=0 hiện tại là tín hiệu tốt và nên ghi thành bằng chứng.

- **Probe ranh giới báo xanh khi chạm script thu và đường đẩy cloud mà AC-9 cấm**
  file: `_acceptance/sdt-s06-khoi-phuc-xuat-xu/probes/ranh-gioi.sh:10`
  severity: low
  AC: AC-9
  source: bugs
  detail: AC-9 yêu cầu «không tệp đẩy cloud, không script thu, nạp đổi». Regex chỉ khớp pipeline/sync-cloud, push-ops-facts, collect-, import-, nên bỏ sót các tệp thuộc làn thu trong pipeline/ như thu-so-s06.mjs, bu-seller-v5.mjs, apify-*, fetch-data.sh, airdna-rotate.mjs, và scripts/cloud-sync.sh. Đã chạy thử: `RANH_GIOI_THEM="pipeline/thu-so-s06.mjs scripts/cloud-sync.sh" bash .../ranh-gioi.sh` vẫn in «ranh-gioi: xanh» và thoát 0. Diff hiện tại không chạm các tệp này nên chưa có vi phạm thật; lỗi nằm ở chỗ E9 xanh không chứng được đủ AC-9. Cần thêm các mẫu đó vào regex.

- **Hình dạng 4 (âm tính một mình, không đối chứng dương): ca KP-AC-5 không bắt được chính lỗi AC-5 hứa chặn**
  file: `pipeline/scripts/gan-sdt-s06.test.mjs:955`
  severity: high
  AC: AC-5
  source: measurement
  detail: Ca đỏ ở dòng 955-963 đổi fixture: UPDATE stg tin 93 sang soLa, để số của tin khoá lạ trùng số tài khoản. Fixture này chỉ chạy với SQL đã đột biến, không có nhánh SQL thật đối chứng. Ca xanh (fixtureKhoaLa, dòng 921 trở đi) có số của tin 90 không nằm trong stg, nên nhánh `= ANY (t.cac_so)` không bao giờ đúng với nó. Kết quả là không ca xanh nào đo tổ hợp «khoá lạ + số trùng tài khoản», trái với câu «khoá có sẵn không bị suy lại» và với header tệp «mỗi phép đo có chiều đỏ trên cùng fixture». Đã chạy đột biến trên bản chép: thêm vào SQL_GAN nhánh `WHEN r.field_provenance ? 'seller_phone' AND r.seller_phone = ANY (t.cac_so) THEN 'ghep'`. Kết quả pass 49, fail 0: ca xanh vẫn xanh, ca đỏ cũng xanh vì dotBien vẫn khớp chuỗi và tin khoá lạ vẫn bị rút. E5 trong evals.yaml (dòng 37) vì thế xanh dù đúng lỗi này tồn tại.

- **Hình dạng 3 (assert chuỗi có mặt trong khi lời hứa là quan hệ): KP-AC-8 không phân biệt được khoi_phuc với khong_ro**
  file: `pipeline/scripts/gan-sdt-s06.test.mjs:1053`
  severity: medium
  AC: AC-8
  source: measurement
  detail: Lời hứa của AC-8 là mỗi nhãn in đúng số đếm của nó. Fixture cho cả hai số đếm bằng 1, và các assert chỉ kiểm chuỗi: `/khôi phục 1\b/`, `/không rõ gốc 1\b/`, `/khoi_phuc=1 khong_ro=1/`. Dòng 1052 còn ghi đè bằng literal `dongGan({ ...r.sdt, khoi_phuc: 1, khong_ro: 1 })`, nên dòng được kiểm không thật sự lấy hai số đếm từ kết quả bộ gán như E8a mô tả (evals.yaml dòng 61), dù dòng 1048-1049 đã assert hai số này bằng 1. Đã chạy đột biến: đảo hai số đếm ở cả dongGan (`khoi_phuc=${g.khong_ro} khong_ro=${g.khoi_phuc}`) và dòng log của transform-chotot.mjs. Kết quả pass 49, fail 0. Cần hai giá trị khác nhau trên fixture và bỏ phần ghi đè literal thì phép đo mới có tác dụng. E8b đã tự khai chỉ đo sự có mặt, nên không bù được.

- **Hình dạng 5 (tuyên quét lớp nhưng chỉ có điểm-case): ranh-gioi.sh liệt kê thiếu lớp «script thu, nạp, đẩy cloud»**
  file: `_acceptance/sdt-s06-khoi-phuc-xuat-xu/probes/ranh-gioi.sh:10`
  severity: medium
  AC: AC-9
  source: measurement
  detail: AC-9 hứa theo lớp: «không tệp đẩy cloud, không script thu, nạp đổi». Regex dòng 10 chỉ có các tiền tố pipeline/sync-cloud, pipeline/push-ops-facts, pipeline/collect-, pipeline/import-, không có ma trận viết trước cho toàn bộ phần tử của lớp. Bảng phân làn trong AGENTS.md còn liệt kê `apify-*`, `airdna-rotate.mjs`, `fetch-data.sh`, `import.sh`, `scripts/*-daily.sh`, và scripts/cloud-sync.sh là job đẩy cloud. Đã chạy: RANH_GIOI_THEM="pipeline/import.sh pipeline/fetch-data.sh pipeline/apify-facebook-collector.mjs pipeline/airdna-rotate.mjs scripts/chotot-daily.sh scripts/cloud-sync.sh" vẫn in «ranh-gioi: xanh», exit 0. Diff hiện tại không chạm các tệp này; lỗi nằm ở chỗ phép đo không đủ phủ lớp nó tuyên.

- **Hình dạng 4 (âm tính một mình): chiều đỏ của E9 chỉ nằm trong chữ expected, lệnh của eval không chạy nó**
  file: `_acceptance/sdt-s06-khoi-phuc-xuat-xu/evals.yaml:77`
  severity: medium
  AC: AC-9
  source: measurement
  detail: E9 ghi «Chiều đỏ cùng lệnh: RANH_GIOI_THEM=db/migrations/071_x.sql thoát 1, in RANH-GIOI», nhưng cmd trỏ tới config:executors.script.kp_ranh_gioi, tức đúng `bash .../ranh-gioi.sh` không kèm biến nào (_acceptance/config.yaml dòng 206). Bằng chứng tự động vì vậy chỉ có chiều «không chạm gì, exit 0»; thông điệp RANH-GIOI không được ghim ở đâu. Nhánh RANH_GIOI_BOT cho phần «test cũ chỉ được thêm» (ranh-gioi.sh dòng 4 và 15) không xuất hiện trong bất kỳ eval nào. Nếu regex hoặc phép tính `bot` hỏng theo hướng không bao giờ khớp, E9 vẫn xanh.

- **Hình dạng 4 (âm tính một mình): ca đỏ KP-AC-3 thêm dòng stg nhưng không chạy SQL thật trên fixture đó**
  file: `pipeline/scripts/gan-sdt-s06.test.mjs:792`
  severity: low
  AC: AC-3
  source: measurement
  detail: Ca đỏ thêm stg 90 cùng số (dòng 796) rồi chỉ chạy SQL đổi min thành max. Ca xanh KP-AC-3 dùng chuoiCoSo, trong đó tài khoản K chỉ có một dòng mang số (tin 80), nên min và max cho cùng tu_tin: ca xanh không phân biệt được hai công thức. Trên fixture có dòng 90 cũng không có assert nào rằng SQL thật cho ra bản gốc, nên sự lệch không được quy hẳn về đột biến. Mức thấp vì lỗi thực tế vẫn bị bắt ở chỗ khác: đột biến ghi tu_tin = max làm đỏ GS-RF và ca đỏ TU-TIN-LECH của GS-AC-2. Khoảng hở nằm ở chính ca KP-AC-3 mà E3 dẫn làm bằng chứng.

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

(không có mục nào)

⚠ Cụm ngoài vùng phủ: 2/10 lỗi rơi vào file không bộ đo nào phủ (_acceptance/sdt-s06-khoi-phuc-xuat-xu/evals.yaml) — dừng và quyết: mở rộng hợp đồng hay rút phạm vi.
