# Review findings: ghep-tin-vao-truc-can (round 1)

## Trong hợp đồng

- **Hình dạng 4 (assertion âm tính một mình): ca cau-rut-thay-boi-luot-chua-dong-ghep-can không bao giờ đỏ**
  file: `pipeline/tests/ghep-tin-truc-can-ghi.itest.mjs:89`
  severity: high
  AC: AC-6
  source: measurement
  detail: Ca này đọc `value` của một dòng ghep-can-truc đang sống, rồi gọi writeAssertions({replaceOwn:true}) với ĐÚNG giá trị đó (cùng subject_key, field, method e1_rule). SQL_RUT_THAY chỉ rút dòng có `fa.value_key <> ALL (k.vks)`. Giá trị trùng nên dòng ghep-can không bao giờ bị rút, dù có hay không có vế `NOT LIKE 'ghep-can-%'`. Vì thế `assert.equal(n, 0)` luôn xanh. Thiếu đối chứng dương: không có ca nào ghi một giá trị KHÁC rồi cho thấy dòng không có rule ghep-can thì bị rút còn dòng ghep-can được chừa. Chú thích của ca ghi «ghi floor_raw», nhưng mã lại ghi universal_property_sub_id. Hệ quả: đột biến bo-chua-ghep-can của probes/chay-lai.sh (E6) không làm ca này đỏ. Lời hứa E6 «lượt nạp thật trên bản chép: 0 dòng thay-boi-luot» cũng không được đo bằng một lượt nạp.
  Căn cứ phạm vi: AC-6 đòi câu rút thay-boi-luot không rút dòng ghep-can và có chiều đỏ đo được; ca này luôn xanh nên AC-6 không được chứng minh.

- **Hình dạng 4 (không ghim thông điệp): dot_bien coi là đỏ khi grep thấy TÊN ca, mà tên ca vẫn in ra khi ca xanh**
  file: `_acceptance/ghep-tin-vao-truc-can/probes/_chung.sh:29`
  severity: high
  AC: AC-6
  source: measurement
  detail: `grep -q -- "$ca" "$LOG"` chỉ kiểm chuỗi có mặt trong log. Ở probes/chay-lai.sh (`cau-rut-thay-boi-luot-chua-dong-ghep-can`), probes/cuoi-luot-nap.sh (`loi-khi-ghi-in-mot-canh-bao-va-khong-nem`) và probes/migration.sh (`tu-choi-sai-khuon`), chuỗi được ghim là TÊN test. Reporter của node --test (Node 24) in tên mọi ca, cả ca qua. Vậy chỉ cần MỘT ca bất kỳ đỏ (exit khác 0) là điều kiện «đúng ca đỏ» đã thoả, dù ca được nêu tên vẫn xanh. Đây không phải ghim vào thông điệp thất bại. Các probe ham-gan và offer-unit ghim `ô «…»` hoặc chuỗi chỉ có trong thông điệp assert, nên không mắc lỗi này.
  Căn cứ phạm vi: các chiều đỏ của AC-6, AC-8, AC-4 đều dựa vào bộ đo này nên đột biến có thể không bị bắt đúng ca; AC-6 là chiều đỏ đầu tiên bị ảnh hưởng.

- **Hình dạng 4 (âm tính một mình): ca đầu–cuối dau-cuoi-luat-that-va-view-khop chỉ assert danh sách lệch rỗng**
  file: `pipeline/tests/ghep-tin-truc-can-131.itest.mjs:142`
  severity: high
  AC: AC-5
  source: measurement
  detail: Hai assert `lech` = [] và `hai` = [] đều âm tính. Ca không kiểm `r.chen > 0`, không kiểm có dòng offer_unit nào ở mức truc hoặc can. before() của tệp này không rút các dòng ghep-can có sẵn, nên ghiGan có thể chèn 0 dòng và hai truy vấn rỗng một cách hiển nhiên. Lời hứa E5 là «ba bài rút từ bản chép (cùng trục; trục + tầng; hai trục) rồi đọc offer_unit, mức và stack_key đúng từng tin», tức một quan hệ trên từng tin cụ thể, nhưng không có assert theo tin. Chiều đỏ E5 «cấy hai căn vào một tin thì lệnh báo đúng offer_id» cũng không có: offer-unit.sh chỉ có đột biến hai-truc-khong-xung-dot.
  Căn cứ phạm vi: AC-5 đòi ô đầu-cuối ba bài đúng mức và stack_key theo từng tin; ca chỉ kiểm danh sách lệch rỗng nên có thể xanh khi không ghi gì.

- **Hình dạng 1 (đo chỉ dẫn thay vì đầu ra): thứ tự bước và try riêng của AC-8 được kiểm bằng grep mã nguồn transform-zalo.mjs**
  file: `pipeline/tests/ghep-tin-truc-can-ghi.itest.mjs:119`
  severity: medium
  AC: AC-8
  source: measurement
  detail: Ca transform-zalo-goi-buoc-gan-can-sau-buoc-gan-toa-trong-try đọc text của transform-zalo.mjs, so `indexOf("buocGhepToa(client)")` với `indexOf("buocGhepCan(client)")` và match regex `try { const { buocGhepCan }… catch`. E8 hứa «Lượt nạp trên DB thử chạy bước gắn trục, căn sau bước gắn toà… Cấy lỗi vào bước gắn: lượt nạp vẫn thoát 0». Nhưng không ca nào chạy lượt nạp. Các ca cấy lỗi gọi thẳng buocGhepCan, còn thứ tự thì chỉ đo trên văn bản mã, không đo trên đầu ra hay hành vi của transform.
  Căn cứ phạm vi: AC-8 đòi bước gắn chạy sau bước gắn toà và lỗi cấy vào không làm hỏng lượt nạp; thứ tự chỉ được đo trên văn bản mã, không trên lượt nạp.

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **Gắn mức căn qua bí danh ở JS không khớp luật của view offer_unit: căn ghi vào phát biểu không dựng lại được**
  Người dùng thấy gì: Một số tin gắn được căn nhờ mã căn của dự án nhưng khi người đọc mở lại chỉ thấy tin ở mức trục. Số tin mức căn trong báo cáo chạy khô có thể cao hơn số thật hiện ra.
  Căn cứ: Chỉ làm một số tin hiện nông hơn dự kiến, không mất hay sai dữ liệu, và chưa hiện trên cổng người dùng nên chấp nhận ghi lại rồi sửa sau.
  file: `pipeline/lib/ghep-tin-truc-can.mjs`
  severity: medium
  Đề xuất: known-limits

- **offer_unit drops units matched by alias: the JS rule and the dry run say «căn», the view says «trục»**
  Người dùng thấy gì: Các căn chỉ tìm được qua mã căn của danh bạ mà thiếu thông tin trục sẽ hiện ở mức trục chứ không phải mức căn. Báo cáo chạy khô đếm chúng là mức căn nên con số có thể lệch.
  Căn cứ: Hậu quả là hiện nông hơn và số báo cáo lệch, không sai chỗ gắn; việc này chưa lên cổng người dùng nên chưa gây hại ngay.
  file: `db/migrations/131_ghep_truc_can_tren_tin.sql`
  severity: medium
  Đề xuất: known-limits

- **Label check takes max(value) instead of the latest label**
  Người dùng thấy gì: Khi một nhãn đã được sửa nhiều lần, lệnh soát có thể báo lệch sai so với nhãn mới nhất. Người soát có thể mất công xem lại những nhãn đã ổn.
  Căn cứ: Chỉ làm người soát nhãn mất thêm công, không ảnh hưởng dữ liệu hay số chấm cuối, và nhãn có thể xem lại thủ công.
  file: `pipeline/scripts/ghep-tin-truc-can-soat-nhan.mjs`
  severity: low
  Đề xuất: known-limits

- **Hình dạng 2 (fixture viết tay đúng khuôn bên đọc): danh bạ OP1, GP dựng tay theo cấu trúc Map nội bộ mà docDanhBa sinh ra**
  Người dùng thấy gì: Phép thử của luật gắn dùng danh bạ dựng tay nên có thể không bắt được lỗi khi đọc danh bạ thật. Lỗi như vậy chỉ lộ khi chạy trên dữ liệu thật.
  Căn cứ: Chạy khô trên dữ liệu thật vẫn thấy lệch trước khi áp, nên rủi ro thấp và người soát ở cổng bằng chứng bắt được.
  file: `pipeline/scripts/ghep-tin-truc-can.test.mjs`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 6 (đường dẫn hardcode ROOT): tệp thẻ cài lỗi trỏ vào checkout chính của tác giả, thiếu thì lặng lẽ bỏ**
  Người dùng thấy gì: Trên máy khác, lệnh chấm có thể lặng lẽ chấm một tập nhãn khác mà vẫn báo đạt hay không đạt. Người ký có thể đọc con số không đúng tập đã định.
  Căn cứ: Chỉ xảy ra khi chạy ngoài máy tác giả, không mất dữ liệu, và có thể chạy lại đúng máy để kiểm; sửa rẻ nhưng chưa ảnh hưởng người dùng.
  file: `_acceptance/ghep-tin-vao-truc-can/probes/cham-truc.sh`
  severity: medium
  Đề xuất: known-limits

⚠ Cụm ngoài vùng phủ: 2/9 lỗi rơi vào file không bộ đo nào phủ (_acceptance/ghep-tin-vao-truc-can/probes/_chung.sh, _acceptance/ghep-tin-vao-truc-can/probes/cham-truc.sh) — dừng và quyết: mở rộng hợp đồng hay rút phạm vi.
