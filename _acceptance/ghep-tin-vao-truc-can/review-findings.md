## Trong hợp đồng

- **offer_unit tra căn bằng stack_key + floor thô, lệch với luật JS khi căn chỉ tìm được qua bí danh mã căn hoặc floor có số 0 đầu**
  file: `db/migrations/131_ghep_truc_can_tren_tin.sql:167`
  severity: medium
  AC: AC-5
  source: conventions
  detail: Ở `xetBai` (pipeline/lib/ghep-tin-truc-can.mjs), tập căn gồm hai phần: các căn của `d.can.get(stack).get(tang)` và các căn lấy từ `d.biDanh` qua khoaBiDanh. Phần bí danh không kiểm căn đó có thuộc `stack` hay không. Bên ghi chỉ lưu giá trị `stk_…:tầng` (subId), không lưu unit_key. Còn view offer_unit tìm lại căn bằng `units u WHERE u.stack_key = g.truc[1] AND u.floor = g.tang[1] … HAVING count(*) = 1`. Trên DB máy thu có 28.261 căn active mà stack_key và floor đều NULL, tất cả đều có bí danh ma_nguon. Vì vậy khi trục và tầng không có căn nào trong danh bạ nhưng bí danh trỏ đúng một căn (căn không có trục), JS ra muc='can' (đếm vào dem.can, chấm và chạy khô báo «căn»), còn view trả muc='truc' với unit_key NULL. Hai đầu đo cùng một luật mà cho số khác nhau, trái với nguyên tắc «mọi phép đo nói về đúng một luật» của ghep-tin-truc-can-doc.mjs. Ngoài ra, CHECK của 082 cho phép floor có số 0 đầu (`^[0-9]+[A-Z]?$`). JS chuẩn hoá bằng chuanTang, còn view so chuỗi thô, nên nếu sau này có floor «09» thì view lại lệch thêm (hiện chưa có dòng nào như vậy). Cách sửa: hoặc ghi unit_key vào giá trị hay evidence và để view đọc từ đó, hoặc bỏ đường bí danh khi căn bí danh không nằm trên `stack`. Ca itest 131 hiện chưa phủ đường bí danh.
  rationale: AC-5 đòi mọi dòng ghep-can-* sống hiện ở đúng một dòng offer_unit mức sâu trên bản chép DB máy thu; căn qua bí danh bị view hạ về mức trục nên lệch.

- **Căn khớp qua bí danh mã căn bị mất khi ghi: offer_unit tra lại theo stack+floor nên ra mức trục**
  file: `pipeline/lib/ghep-tin-truc-can.mjs:107`
  severity: high
  AC: AC-5
  source: bugs
  detail: Trong xetBai, nếu tin có tầng từ mã căn thì tập căn được hợp thêm các căn khớp bí danh: `for (const u of d.biDanh.get(khoaBiDanh(...))) units.add(u)`. Khi tập chỉ còn một căn, hàm trả `muc:'can', unit:<căn bí danh>`. Ca test `bi-danh-khop-mot-can` (unt_s105_1710_s16) và evals.yaml dòng 35 («mã khớp một bí danh S16/S08 ra căn ấy») đều đòi đúng kết quả này. Nhưng dongPhatBieu (ghep-tin-truc-can-ghi.mjs) chỉ ghi `subId(x)` = `stack:tang`. unit_key không được lưu ở đâu, cả trong evidence cũng không. View offer_unit (131_ghep_truc_can_tren_tin.sql dòng 166-167) tính lại căn bằng `units u WHERE u.stack_key = g.truc[1] AND u.floor = g.tang[1]`. Trên DB máy thu, 28261 trong số 111671 căn đang hoạt động có bí danh ma_nguon mà stack_key và floor đều NULL (căn S16/S08 chỉ biết qua bí danh). Với các căn này view không tìm ra dòng nào, nên tin hiện `muc='truc'`, `unit_key` NULL, dù luật và lượt chạy khô đã báo «căn». Hệ quả: (1) đường bí danh không bao giờ hạ tin xuống mức căn trên dữ liệu thật, và không có cảnh báo nào; (2) số `dem.can` trong log `ghep-can:` của buocGhepCan, cùng bảng «căn» của ghep-tin-truc-can-kho.mjs (tự nhận «cùng luật với view offer_unit»), đếm cao hơn số trên view. Cần chọn một trong hai cách: lưu unit_key, chẳng hạn trong evidence hoặc một trường riêng, rồi cho view đọc nó; hoặc bỏ nhánh bí danh khỏi mức `can` của luật.
  rationale: Cùng gốc với lỗi trên: AC-5 (mọi dòng ghep-can-* hiện ở mức sâu) và AC-3 (mã khớp một bí danh ra căn) không giữ được qua bước ghi và view trên dữ liệu thật.

- **Hình dạng 4 (âm tính không đối chứng dương): ca tắt một nguồn không đòi nguồn ghep-can-ma có dòng trước khi tắt**
  file: `pipeline/tests/ghep-tin-truc-can-ghi.itest.mjs:81`
  severity: medium
  AC: AC-6
  source: measurement
  detail: `tat-mot-nguon-chi-rut-dong-cua-nguon-do` lưu `ma = demRule(RULE.ma)` rồi assert `demRule(RULE.ma) === 0` sau khi tắt nguồn, và `=== ma` sau khi bật lại. Ca không assert `ma > 0`. Nếu bản chép không có dòng ghep-can-ma nào thì cả hai assert đều xanh mà không đo gì (0 → 0 → 0). Vì vậy E6 «tắt một nguồn thì lượt kế rút đúng dòng nguồn đó» có thể qua rỗng. Ca kế bên `tat-het-nguon` có tiền đề `truoc > 0` (dòng 91), ca này thì không.
  rationale: AC-6 đòi «tắt một nguồn thì lượt kế rút đúng dòng của nguồn đó»; ca có thể qua rỗng nên không chứng minh được AC.

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **Hình dạng 4 (qua rỗng): xanh() của probe coi thoát 0 là xanh, kể cả khi mọi ca dữ liệu bị t.skip**
  Người dùng thấy gì: Phép kiểm tự động có thể báo đạt trên một máy không có dữ liệu thật mà thực ra chưa kiểm gì. Người dùng cuối không thấy ảnh hưởng, nhưng người ký nghiệm thu có thể tin nhầm là đã đo.
  Căn cứ: Chỉ làm giảm độ tin của bằng chứng, không làm hỏng dữ liệu hay màn hình; người soát chạy lại trên bản chép có dữ liệu là thấy ngay, sửa sau cũng rẻ.
  file: `_acceptance/ghep-tin-vao-truc-can/probes/_chung.sh`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 6 (đường dẫn hardcode ROOT): tệp thẻ cài lỗi mặc định trỏ vào checkout chính, không vào cây đang kiểm**
  Người dùng thấy gì: Con số độ chính xác gắn trục có thể ra hơi khác nhau tuỳ máy nào đang chạy phép chấm. Người dùng cuối không bị ảnh hưởng trực tiếp.
  Căn cứ: Chỉ lệch khi chấm thử trên máy khác checkout chính, người chấm tự phát hiện được; không mất dữ liệu và sửa sau rất rẻ.
  file: `_acceptance/ghep-tin-vao-truc-can/probes/cham-truc.sh`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 2 (fixture viết tay đúng khuôn bên đọc): ma trận hàm gắn dựng danh bạ bằng tay theo khuôn của docDanhBa**
  Người dùng thấy gì: Nếu cách đọc danh bạ chuẩn hoá số trục hoặc tầng khác đi, bộ kiểm vẫn xanh và tin có thể bị gắn sai trục hay tầng mà không ai biết sớm.
  Căn cứ: Rủi ro thấp vì ca đầu-cuối đã đo quan hệ tổng quát trên dữ liệu thật; lỗi nếu có chỉ làm gắn thiếu hoặc lệch mức, tự soát lại được.
  file: `pipeline/scripts/ghep-tin-truc-can.test.mjs`
  severity: low
  Đề xuất: known-limits

- **Hình dạng 1 (đo văn bản mã thay vì đầu ra): ca kiểm thứ tự và try bằng cách grep nguồn transform-zalo.mjs**
  Người dùng thấy gì: Một ca kiểm chỉ đọc chữ trong mã nên không bắt được lỗi hành vi, nhưng các ca chạy thật bên cạnh đã bắt phần đó. Người dùng không bị ảnh hưởng.
  Căn cứ: Không mất gì vì đã có phép đo hành vi thật che phần này; sửa tốn công mà lợi ích gần như bằng không.
  file: `pipeline/tests/ghep-tin-truc-can-ghi.itest.mjs`
  severity: low
  Đề xuất: wont-fix

⚠ Cụm ngoài vùng phủ: 2/7 lỗi rơi vào file không bộ đo nào phủ (_acceptance/ghep-tin-vao-truc-can/probes/_chung.sh, _acceptance/ghep-tin-vao-truc-can/probes/cham-truc.sh) — dừng và quyết: mở rộng hợp đồng hay rút phạm vi.
