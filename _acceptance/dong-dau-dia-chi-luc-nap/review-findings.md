# Review findings: dong-dau-dia-chi-luc-nap (round 1)

## Trong hợp đồng

- **Dòng DV6 bị rút không bao giờ được trả lại khi thẻ thôi ghi dự án (bác, sửa sang 2–3 dự án, ô dự án bị lọc), nên tin rơi khỏi mot_du_an mà không ai biết**
  AC: AC-8
  file: `pipeline/transform-zalo.mjs:1046`
  severity: high
  source: bugs
  detail: Ở lượt nạp thẻ ghi dự án lên bài p, transform rút dòng DV6 (`du-an-nhom-mot-du-an`, `du-an-ten-bai`) trên p với lý do `thay-bang-the-nhom`. Dòng DV6 gần như chỉ đọc từ sổ nhóm, không phụ thuộc thẻ. Ở các lượt sau, `rutTheCu` (pipeline/lib/dia-chi-the-nhom.mjs:203-219) rút dòng dự án của thẻ trên p khi gặp một trong các ca: thẻ chuyển sang `bac` (route card-decide, app/src/lib/the-dia-chi-nhom.ts, cho bác cả thẻ đang `da_duyet`); thẻ được sửa sang 2–3 dự án hay xoá ô dự án khiến `duAn` thành null; nút dự án bị `docTheDaDuyet` lọc (đếm vào `oBo.duAn`). Không có bước nào ghi lại dòng DV6 đã rút; chỉ `lui.sql` làm việc đó. Hệ quả: `offer_project` của tin không còn dòng nào, tin rơi từ `mot_du_an` sang không có dự án. Đây là đúng điều AC-8 cấm, và trái câu của thiết kế §2.2 «bài của tin ấy giữ nguyên dòng DV6 cũ … tin ở lại đúng trạng thái trước hàng này», câu ấy chỉ đúng ở lượt đầu. Thước E10 (`khong-tut`) chỉ so lượt nền với một lượt K1 nhận thẻ nên không bắt được ca bác hay sửa. Lượt nạp không in hay cảnh báo gì, ngoài con số `rut_ban` trong log.

- **Hình dạng 4 (khẳng định âm một mình, không có đối chứng dương): mốc «trước» của E13/E10 lấy SAU lượt nạp bằng mã mới, nên chiều đỏ đã khai không thể đỏ**
  AC: AC-11
  file: `pipeline/scripts/dong-dau-dia-chi-that.mjs:100`
  severity: high
  source: measurement
  detail: chay() chạy `nen = await napIm(c)` (runTransformZalo của mã đang kiểm) rồi mới `truoc = await chup(c)` (dòng 100-101); sau đó áp kịch bản K1 và nạp lại. Thước phu-kind trả `mat === 0` (dòng 184), thước khong-tut trả `roi.length === 0` (dòng 169); cả hai so hai lượt chạy CÙNG một mã. Chiều đỏ của E13 trong evals.yaml («tắt nhánh boi-canh-nhom trong bản sao thì lệnh thoát 1 và gọi đúng số tin rỗng sinh ra») không thể xảy ra: bản đột biến chạy ở cả lượt nền lẫn lượt sau, nên tin mất kind đã nằm sẵn trong `truoc` và `mat` vẫn bằng 0. Tương tự, AC-8 hứa so với «tập tin đang mot_du_an TRƯỚC khi đóng dấu», nhưng lượt nền đã đóng dấu theo các thẻ đã duyệt thật trên máy thu (6 thẻ lúc 14:39Z theo chú thích trong test), nên mọi bài rơi khỏi mot_du_an do những thẻ ấy bị hút vào mốc và không ai thấy. Hai khẳng định «0 mất / 0 rơi» không có ca dương nào chứng minh thước bắt được lỗi do chính mã gây ra.

- **Hình dạng 5 (tuyên quét cả lớp nhưng chỉ có vài ca): E2 tuyên ma trận sáu ô trạng thái thẻ nhưng lệnh của nó không chạy ma trận nào**
  AC: AC-2
  file: `_acceptance/dong-dau-dia-chi-luc-nap/evals.yaml:36`
  severity: high
  source: measurement
  detail: E2 dùng `cmd: config:executors.test.tg2_pipeline`, tức chạy dong-dau-dia-chi.test.mjs và transform-zalo-loai-tin.test.mjs. Không tệp nào trong hai tệp đó có ma trận sáu ô (nhap sống · da_duyet nhận · da_duyet sửa · bac · nhap nghỉ · không thẻ). Ma trận duy nhất nằm ở pipeline/tests/dia-chi-the-nhom.itest.mjs:49-61, tệp này thuộc tg2_itest. Ngay trong đó cũng chỉ chèn 5 thẻ, thiếu ô «nhóm không có thẻ». Không có assert nào nói số ô bằng 6. Ca chỉ kiểm khoá Map của bộ đọc `docTheDaDuyet`, không kiểm «sinh phát biểu / 0 dòng» như AC-2 hứa. Chiều đỏ «đổi ô bac thành da_duyet, thông điệp ghim tên ô» cũng không có ca nào.

- **Hình dạng 5: E4 tuyên chạy transform thật trên ma trận chín ô AC-3 nhưng chỉ cấy 5 ô**
  AC: AC-3
  file: `pipeline/tests/dong-dau-dia-chi.itest.mjs:90`
  severity: medium
  source: measurement
  detail: Mảng `ds` của ca E4 (dòng 90-95) chỉ có im×mot, khac×mot, im×hai, khac×hai, im×khong. Thiếu cung×mot, cung×hai, cung×khong và khac×khong. Trong đó khac×khong là ô then chốt của AC-3: chữ bài nêu dự án trong nhóm KHÔNG có thẻ phải ra 0 dòng. E4 hứa «chạy transform thật trên ma trận AC-3 … khớp từng ô với kết quả hàm thuần của E3». Ma trận chín ô chỉ đầy đủ ở tầng hàm thuần (dong-dau-dia-chi.test.mjs). Tầng chéo lớp có 5/9 ô và không có assert số ô.

- **Hình dạng 5: E9/AC-7 tuyên ba ca lược đồ ở mức lượt nạp nhưng lượt nạp chỉ được thử với ca «không bảng»**
  AC: AC-7
  file: `pipeline/tests/dong-dau-dia-chi.itest.mjs:248`
  severity: medium
  source: measurement
  detail: E9 hứa: ở hai ca «không có group_address_cards» và «có bảng mà thiếu cột retired_at», transform bỏ bước đóng dấu, in đúng một dòng, thoát 0 và các bước khác không đổi. Ca chạy runTransformZalo duy nhất (dòng 248-266) chỉ `DROP TABLE group_address_cards` (dòng 257). Ca «thiếu retired_at» chỉ được thử ở mức boolean của `coBangThe` (dia-chi-the-nhom.itest.mjs:39-47). Không ca nào chạy lượt nạp trên lược đồ ấy để đếm dòng cảnh báo và so năm số của lượt.

- **Hình dạng 1 (đo chỉ dẫn thay vì đầu ra): E5 hứa lớp, phương pháp, rule_id, method_version trên field_assertions nhưng lệnh của E5 không đọc các cột đó từ DB**
  AC: AC-4
  file: `pipeline/tests/dong-dau-dia-chi.itest.mjs:80`
  severity: medium
  source: measurement
  detail: E5 dùng tg2_itest. Trong itest, hàm `dongSong` chỉ SELECT `field, value, evidence` (dòng 80-82), và ca E5 (dòng 117-131) chỉ kiểm tên trường và khoá căn cứ. Các assert evidence_tier='inferred', method='e1_rule', method_version='dong-dau-dia-chi@1' chỉ có trong dong-dau-dia-chi.test.mjs, và chạy trên mảng dòng mà hàm thuần trao cho writeAssertions (chỉ dẫn gửi bộ ghi), không chạy trên dòng đã ghi vào DB. Tệp đó cũng không nằm trong lệnh của E5. Nếu bộ ghi đổi hay bỏ các cột này, E5 vẫn xanh.

- **Hình dạng 4: ca E6 «bài có chữ bài giữ nguyên» qua được khi không có dòng nào**
  AC: AC-5
  file: `pipeline/tests/dong-dau-dia-chi.itest.mjs:148`
  severity: medium
  source: measurement
  detail: `assert.ok(chuSau.every((x) => x.evidence.nguon_o === "chu_bai"))` và `assert.deepEqual(chuSau.map(v), chuTruoc.map(v))` (dòng 148-149) đều đúng khi cả chuTruoc lẫn chuSau là []. Không có assert dương nào nói chuTruoc có đúng một dòng project_node_id mang giá trị f.duAn2 với nguon_o 'chu_bai'. Nếu nhãn chữ bài không được đọc ra, hay bị hoà giải tin bỏ mất khiến bài không có dòng nào, ca vẫn xanh. AC-5 hứa chữ bài thắng và giữ nguyên, nhưng ca này không chứng minh được điều đó.

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **Rút dòng DV6 bằng rule_id viết cứng thay vì dùng hằng RULE của module DV6, và rút chéo luật mà module DV6 khai là chỉ nó được rút**
  Người dùng thấy gì: Hôm nay tin vẫn hiện đúng. Nếu sau này ai đổi tên một luật cũ, việc thay bằng thẻ nhóm có thể lặng lẽ không chạy và một số tin bị báo xung đột dự án.
  Căn cứ: Chưa gây sai gì cho người dùng, chỉ là mối nguy khi sửa về sau; ghi lại rồi sửa lúc đụng tới luật đó thì rẻ.
  file: `pipeline/transform-zalo.mjs`
  severity: low
  Đề xuất: known-limits

- **Khoá `.khoa` của --do-neu-cu bị bỏ lại khi process.exit(2) chạy trong vùng khoá, các lượt đo sau treo vô hạn**
  Người dùng thấy gì: Một lần chạy đo bị ngắt giữa chừng có thể làm các lần đo sau đứng im không báo gì, người chạy phải tự xoá tệp khoá. Dữ liệu tin và người dùng cuối không bị ảnh hưởng.
  Căn cứ: Chỉ làm chậm việc nghiệm thu nội bộ, không mất dữ liệu, và người vận hành tự gỡ được bằng cách xoá tệp khoá.
  file: `pipeline/scripts/dong-dau-dia-chi-that.mjs`
  severity: medium
  Đề xuất: known-limits

- **Bộ quét E8 chỉ xét từng dòng: câu SQL xuống dòng giữa FROM/JOIN và stg_zalo_posts lọt qua**
  Người dùng thấy gì: Rào kiểm tra bài thử có thể báo xanh dù một câu truy vấn viết nhiều dòng đọc thẳng dữ liệu thô. Hiện chưa có bằng chứng bài thử nào bị đóng dấu nhầm.
  Căn cứ: Chỉ làm rào kiểm yếu đi chứ chưa gây sai dữ liệu; mã hiện tại có thể rà tay một lần và sửa bộ quét sau với chi phí thấp.
  file: `pipeline/scripts/quet-doc-stg.mjs`
  severity: low
  Đề xuất: known-limits

- **Hình dạng 2 (fixture viết tay theo đúng khuôn bên đọc): bảng nhãn AC-10 viết tay, không đi một vòng từ bộ sinh inBangTrong**
  Người dùng thấy gì: Nếu khuôn bảng gắn nhãn đổi, công cụ đọc nhãn có thể hỏng mà bài kiểm tra vẫn xanh, làm số đo bài lạc dự án sai đi.
  Căn cứ: Rủi ro nhỏ, chỉ xảy ra khi ai đó đổi khuôn bảng, và lệch sẽ lộ ngay khi chạy mẫu thật; sửa sau rẻ.
  file: `pipeline/scripts/mau-bai-lac-du-an.test.mjs`
  severity: low
  Đề xuất: known-limits

## Chưa adversarial-verify (refuter chết)

⚠ Cụm ngoài vùng phủ: 7/11 lỗi rơi vào file không bộ đo nào phủ (pipeline/scripts/quet-doc-stg.mjs, _acceptance/dong-dau-dia-chi-luc-nap/evals.yaml, pipeline/tests/dong-dau-dia-chi.itest.mjs, pipeline/scripts/mau-bai-lac-du-an.test.mjs) — dừng và quyết: mở rộng hợp đồng hay rút phạm vi.
