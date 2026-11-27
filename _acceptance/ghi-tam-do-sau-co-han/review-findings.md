## Trong hợp đồng

- **xuLaiTrich vẫn ghi tạm loại hình vào trường có lô quá hạn đo bù chưa rút (thiếu truongQuaHan như bản sửa AC-6)**
  AC: AC-6
  file: `agent/src/enrich/doc-toan-bo.ts:440`
  severity: medium
  source: conventions
  detail: Commit ebce9a5bb sửa AC-6 cho chayLuot: ngoài ghi_tam_o.dung, chayLuot còn cộng các trường của truongQuaHan(c) vào oDung, để lô dang-ghi quá hạn mà chưa ai rút (lượt đêm chưa chạy, chưa gõ --het-han, hoặc lệnh rút bị từ chối vì bẫy 066) vẫn dừng tự ghi. runEnrich cũng làm như vậy khi loiXetHan. Hàm xuLaiTrich cùng tệp thì chỉ kiểm `(await oDangDung(c)).has("property_type")` rồi đi tiếp: chuyển đề xuất skipped thành corroborated, gọi ganLo (mở lô mới `<runId>:property_type` với hạn mới 14 ngày) và apply_enrichment. Vậy là còn một đường ghi tạm vào property_type trong khi trường này đang có lô quá hạn chưa rút, trái đúng bất biến mà AC-6 vừa vá. Nên dùng chung một hàm «trường đang dừng» gồm cả oDangDung lẫn truongQuaHan cho cả ba chỗ gọi.
  rationale: AC-6 đòi lô quá hạn chưa rút thì lượt làm giàu kế không ghi thêm giá trị nào của trường đó; đường xử lại trích dẫn vẫn ghi thêm.

- **xuLaiTrich vẫn ghi tạm property_type khi có lô quá hạn đo bù chưa rút (thiếu truongQuaHan)**
  AC: AC-6
  file: `agent/src/enrich/doc-toan-bo.ts:443`
  severity: medium
  source: bugs
  detail: Commit ebce9a5bb sửa AC-6 cho chayLuot: oDung = oDangDung(c) rồi thêm truongQuaHan(c), để lô dang-ghi đã quá hạn mà chưa ai rút (lượt đêm chưa chạy, chưa gõ --het-han) vẫn chặn trường. Đường xử lại trích dẫn xuLaiTrich (cùng tệp, cũng thuộc lượt đọc toàn bộ) chỉ kiểm `(await oDangDung(c)).has("property_type")`, không gọi truongQuaHan. Nên khi lô loại hình đã quá hạn mà ô chưa được đặt dung=true, `--xu-lai-trich` vẫn đổi đề xuất sang corroborated, ganLo mở lô mới `<runId>:property_type` và gọi apply_enrichment. Kết quả là thêm giá trị ghi tạm vào đúng trường mà AC-6 bắt phải dừng, và hỏng bất biến commit này vừa sửa. Test E6 AC-6 ở agent/tests/ghi-tam.test.ts:234 chỉ phủ chayLuot, không phủ xuLaiTrich. Cách sửa: dùng cùng tập oDung với chayLuot (oDangDung cộng truongQuaHan) trước khi ghi.
  rationale: Cùng lỗi với mục trên: trường có lô quá hạn chưa rút vẫn nhận thêm giá trị ghi tạm qua đường xử lại trích dẫn, trái AC-6.

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **rut_lo_ghi_tam không tự kiểm actor; lô không còn đề xuất applied thì actor nào cũng rút lô và dừng ô được**
  Người dùng thấy gì: Một lời gọi trực tiếp vào cơ sở dữ liệu, bỏ qua lệnh rút chính thức, có thể rút một lô đã rỗng và làm dừng việc tự ghi của một trường mà không cần là người được phép.
  Căn cứ: Chỉ xảy ra khi có người truy cập thẳng vào dữ liệu, không làm mất dữ liệu nào, và người có quyền mở lại ô được; sửa sau rẻ.
  file: `db/migrations/129_ghi_tam_lo.sql`
  severity: low
  Đề xuất: known-limits

- **Fixture viết tay đúng khuôn bên đọc (hình 2): hạn đo bù và nấc lấy từ hằng số của mã thật, không phải số viết tay**
  Người dùng thấy gì: Nếu ai đó đổi nhầm hạn đo bù từ 14 ngày sang số khác, bài kiểm tra vẫn báo xanh nên lỗi có thể lọt qua mà không ai biết.
  Căn cứ: Hiện số liệu đang đúng nên người dùng chưa chịu hậu quả; rủi ro chỉ xuất hiện khi có người đổi nhầm sau này và sửa bài kiểm tra rất rẻ.
  file: `agent/tests/ghi-tam.test.ts`
  severity: medium
  Đề xuất: known-limits

- **Fixture viết tay đúng khuôn bên đọc (hình 2): danh sách dấu đáp án lấy từ chính DAU_DAP_AN_LUAT, nên đột biến bỏ một dấu không làm đỏ được ca này**
  Người dùng thấy gì: Nếu ai đó bỏ bớt một dấu nhận biết đáp án của luật khỏi danh sách, một bài kiểm tra sẽ không báo đỏ, nên máy có thể tưởng hai phiếu độc lập trong khi model đã thấy đáp án.
  Căn cứ: Hiện chưa gây sai dữ liệu, chỉ làm lưới an toàn mỏng đi; phần này đã được hợp đồng mới về phép đo độc lập xử lý.
  file: `agent/tests/ghi-tam.test.ts`
  severity: medium
  Đề xuất: known-limits

- **Assertion âm tính một mình (hình 4): đột biến AC-4 tự in thông điệp ghim chứ không so với đầu ra**
  Người dùng thấy gì: Phép thử trên bản chép dữ liệu có thể báo là đỏ đúng chỗ dù lỗi thật là một lỗi khác, nên bằng chứng nghiệm thu kém chắc hơn vẻ ngoài.
  Căn cứ: Không ảnh hưởng dữ liệu hay người dùng, chỉ làm bằng chứng kém tin cậy; sửa sau không tốn nhiều.
  file: `_acceptance/ghi-tam-do-sau-co-han/probes/ban-chep.sh`
  severity: medium
  Đề xuất: known-limits

- **Assertion âm tính một mình (hình 4): ca AC-6 đọc toàn bộ chỉ có ba vế phủ định, `every` trên mảng rỗng xanh suông**
  Người dùng thấy gì: Bài kiểm tra cho trường hợp quá hạn có thể báo xanh dù lượt đọc không tạo ra đề xuất nào, nên không chứng minh được việc dừng ghi là do đúng lý do.
  Căn cứ: Không gây mất hay lộ dữ liệu; chỉ làm bằng chứng yếu và sửa bằng cách thêm một vế kiểm đối chứng rất rẻ.
  file: `agent/tests/ghi-tam.test.ts`
  severity: medium
  Đề xuất: known-limits

- **Đo chỉ dẫn thay vì đầu ra (hình 1): E5 và E6 hứa đầu ra của lệnh rut-lo-ghi-tam.mjs nhưng thước chỉ gọi hàm SQL**
  Người dùng thấy gì: Lệnh rút lô khi chạy thật có thể in số liệu hoặc từ chối khác với lời hứa mà chưa ai kiểm bằng cách chạy chính lệnh đó.
  Căn cứ: Phần lõi rút lô đã được đo ở tầng dữ liệu, nên rủi ro chủ yếu là lời nhắn trên màn lệch; người vận hành thấy ngay khi chạy và sửa không đắt.
  file: `_acceptance/ghi-tam-do-sau-co-han/evals.yaml`
  severity: medium
  Đề xuất: known-limits

- **Đo chỉ dẫn thay vì đầu ra (hình 1): E9 hứa chạy qua bộ chạy đêm, test chỉ gọi hai hàm thuần và chỉ so route**
  Người dùng thấy gì: Cách lượt chạy đêm nối quyết định ô nào được ghi với dữ liệu thật chưa được kiểm trọn vẹn, nên một lỗi nối dây có thể lọt qua bài kiểm tra.
  Căn cứ: Chưa có dấu hiệu sai trên dữ liệu thật và lượt đêm còn có chốt chặn riêng; bổ sung phép đo sau là việc vừa phải.
  file: `agent/tests/ghi-tam.test.ts`
  severity: low
  Đề xuất: known-limits

⚠ Cụm ngoài vùng phủ: 2/9 lỗi rơi vào file không bộ đo nào phủ (_acceptance/ghi-tam-do-sau-co-han/probes/ban-chep.sh, _acceptance/ghi-tam-do-sau-co-han/evals.yaml) — dừng và quyết: mở rộng hợp đồng hay rút phạm vi.
