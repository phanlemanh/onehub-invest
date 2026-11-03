# Review findings: s06-duong-du-an-len-tin (round 1)

## Trong hợp đồng

- **Kiểm tên nguồn chỉ xét lần xuất hiện đầu tiên trong chuỗi, có thể bỏ sót**
  AC: AC-7
  file: `pipeline/scripts/do-duong-s06.mjs:108`
  severity: low
  source: bugs
  detail: Vòng kiểm dùng `t.indexOf(s)` một lần rồi kiểm biên từ tại đúng vị trí đó. Nếu lần đầu tên nằm trong một từ dài hơn và lần sau đứng riêng, ví dụ `xabc abc`, biên từ của lần đầu sai nên giá trị không bị tính. Đây là cổng SPL «0 giá trị chứa tên nguồn» của AC-7, nên lỗi theo hướng im lặng cho qua. Khả năng gặp trên dữ liệu thật thấp, nhưng lỗi logic là chắc chắn. Sửa: lặp qua mọi lần xuất hiện hoặc dùng regex có biên `\p{L}\p{N}`.
  rationale: Đây chính là cổng AC-7 «0 giá trị đường chứa tên nguồn thật»; lỗi logic làm cổng cho qua nhầm.

- **Hình dạng 2 — Fixture VIẾT TAY đúng khuôn bên đọc: dòng legacy không rút từ bên ghi thật dù E3 tuyên «rút từ bên ghi thật»**
  AC: AC-3
  file: `pipeline/scripts/s06-duong.itest.mjs:95`
  severity: high
  source: measurement
  detail: E3 trong evals.yaml ghi «fixture legacy rút từ bên ghi thật phat-bieu-cat-chuyen». Hàm `legacy()` (dòng 95-100) lại là INSERT tự viết vào field_assertions. Không có đoạn nào gọi `catChuyen` (hàm này có export) hay chạy câu SQL của bên ghi. Mối nối duy nhất với bên ghi là dòng 110: `khuon.includes("'observed', 'legacy', '045', 'offer:' || o_.offer_id")`, tức grep một đoạn mã nguồn, không phải round-trip. Fixture đã khác bên ghi ở các điểm sau: observed_at = now() so với least(last_seen, clock_timestamp()) ở phat-bieu-cat-chuyen.mjs:99; subject_key cố định `S06:<id>` so với source || ':' || coalesce(originating_system_key, post_ids[1]); và cột street_raw của tin còn NULL lúc chèn, trong khi bên ghi chỉ sinh legacy từ ô đã có giá trị (dòng 92). Bên ghi đổi phần ngoài đoạn grep thì AC-3 và AC-4 vẫn xanh trên khuôn cũ. Dòng kiểm khuôn chỉ nằm trong ca AC-3, còn AC-4 (dòng 146) và ca đỏ AC-3 (dòng 130, cố ý ghi tier 'fact') dùng lại cùng hàm tay.
  rationale: AC-3 dựng ba tin có sẵn legacy; fixture tay lệch bên ghi thật nên AC-3 và AC-4 có thể xanh sai.

- **Hình dạng 4 — Assertion âm-tính-một-mình: chiều đỏ --gai-cap-lech chỉ cộng bộ đếm, không có đối chứng dương cho phép kiểm «0 cặp cùng tên ra Lệch»**
  AC: AC-7
  file: `pipeline/scripts/do-duong-s06.mjs:130`
  severity: high
  source: measurement
  detail: Dòng 130: `if (co("--gai-cap-lech")) { nLech++; nOan++; }`. Cờ này không đưa cặp nào qua truy vấn nhóm (dòng 120), `soDuong` hay `chuan`, nên chỉ chứng minh được `if (nOan) vipham.push` ở dòng 132 chạy. E7 và chú thích dòng 6 lại mô tả là «gài một cặp». Kết quả đo «0 cặp» vẫn là âm tính không đối chứng: `chuan` không được export và không có test nào gọi nó; không có assert nLech > 0 hay ca nào chứng minh `chuan("Đường X") === chuan("X")`. Nếu truy vấn nhóm rỗng, hoặc `chuan` hỏng khiến hai chuỗi không bao giờ bằng nhau, nOan vẫn bằng 0 và chiều đỏ vẫn đạt. Cờ --gai-ten-nguon cạnh đó làm đúng: nó đẩy giá trị vào `giaTri` và đi qua vòng so khớp thật (dòng 103).
  rationale: AC-7 đòi 0 cặp ra Lệch mà hai chuỗi bằng nhau sau chuẩn hoá; phép đo không có đối chứng dương nên không chứng minh được AC.

- **Hình dạng 4 — Assertion âm-tính-một-mình: phần tử «không nhận từ tin đã rời kho» không có đối chứng dương cho tiền đề**
  AC: AC-5
  file: `pipeline/scripts/s06-duong.itest.mjs:221`
  severity: medium
  source: measurement
  detail: Dòng 221 chỉ assert `canCua(9900007051).street === null`, dòng 243 chỉ assert `dienDuongCan === 0`. Không chỗ nào assert tiền đề khiến phép đo có ý nghĩa: tin 9900007052 cùng căn với 9900007051 (cả hai dựa vào giá `GIA.roi` ở dòng 187) và bản ghi của tin 52 có street_raw = «Đường Tin Rời Kho» trước khi nghỉ. Nếu hai tin tách cụm, hoặc tin 52 không mang đường, cả hai assert vẫn xanh dù ô căn chưa từng có nguồn rời kho để nhận. Ca đỏ của AC-5 (dòng 235) chỉ đột biến nhánh «đè ô có sẵn», không đột biến nhánh lọc tin rời kho (`JOIN sale_offers` ở duong-can.mjs:13), nên phần tử này không có chiều đỏ chứng minh.
  rationale: AC-5 nêu rõ ca «căn có tin đã rời kho mang đường → không nhận»; assert hiện không chứng minh tiền đề và không có chiều đỏ.

- **Hình dạng 3 (gần nhất) — Lời hứa là quan hệ «lượt hai không đổi tin / offers_changed 0» nhưng chỉ đo một cột street_raw**
  AC: AC-4
  file: `pipeline/scripts/s06-duong.itest.mjs:151`
  severity: low
  source: measurement
  detail: E4 ghi «lượt hai inserted 0, retracted 0, offers_changed 0» và AC-4 hứa «không đổi tin». `anh()` (dòng 149) phủ được inserted và retracted qua id + retracted_at. Riêng `dongCot` (dòng 151-155) chỉ so street_raw của hai tin. offers_changed không được assert: nó chỉ xuất hiện trong console.log của transform (transform-chotot.mjs), log này bị `lapLai` tắt (dòng 65), và `runTransformChotot` không trả số đó (transform-chotot.mjs:135). Con số E4 khai vì vậy không có phép đo nào đỡ, và các cột phân xử khác (property_type, bedrooms, bathrooms, block_raw) không được so trước/sau. Lỗi này không khớp gọn một hình dạng; hình dạng 3 là gần nhất, triage có thể xếp lại.
  rationale: AC-4 hứa «lượt hai không thêm phát biểu và không đổi tin», mà phép đo chỉ phủ một cột của tin.

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **do-duong-s06 không có DB mặc định, nên lệnh đo sau gộp như đã ghi không trỏ tới DB máy thu**
  Người dùng thấy gì: Khi chạy tay lệnh đo sau job đêm đầu tiên mà quên chỉ DB, lệnh có thể nối nhầm DB hoặc báo lỗi kết nối, nên người vận hành chưa có số đo.
  Căn cứ: Chỉ làm hỏng bước đo thủ công, không mất hay làm sai dữ liệu, và chạy lại với đúng DB là có số.
  file: `pipeline/scripts/do-duong-s06.mjs`
  severity: medium
  Đề xuất: known-limits

- **Mục enrichment_log mới dùng khoá thời gian `at`, lệch khoá `t` của các bộ ghi hiện hành**
  Người dùng thấy gì: Nhật ký làm giàu của căn sẽ ghi thời gian dưới hai tên khác nhau, nên công cụ đọc nhật ký sau này phải xử cả hai dạng.
  Căn cứ: Hiện chưa có nơi nào đọc khoá này nên người dùng chưa thấy lỗi, nhưng sửa càng muộn càng khó vì nhật ký chỉ thêm, không sửa lại.
  file: `pipeline/lib/duong-can.mjs`
  severity: low
  Đề xuất: known-limits

- **Ca đỏ DT-AC-4 của HD5 gãy vì đoạn mã nó neo vào đã bị DS1 viết lại**
  Người dùng thấy gì: Bộ kiểm của tính năng đặc trưng nhà S06 sẽ báo đỏ dù tính năng vẫn chạy đúng, nên che mất lỗi thật nếu có.
  Căn cứ: Không ảnh hưởng dữ liệu người dùng, nhưng làm hỏng cổng kiểm của một tính năng khác, nên cần việc riêng để dọn.
  file: `pipeline/scripts/dac-trung-s06.itest.mjs`
  severity: medium
  Đề xuất: new-contract

- **Thước DT-AC-8 của HD5 vẫn đòi street_raw của S06 không đổi, mâu thuẫn trực tiếp với DS1**
  Người dùng thấy gì: Thước đo của tính năng đặc trưng nhà S06 sẽ báo lệch hàng loạt chỉ vì đường nay được điền, nên báo động giả cho tính năng đó.
  Căn cứ: Không mất hay sai dữ liệu, chỉ gây báo đỏ giả ở cổng kiểm của tính năng khác, sửa riêng sau cũng không đắt.
  file: `pipeline/scripts/do-dac-trung-s06.mjs`
  severity: medium
  Đề xuất: new-contract

- **Cờ --nguong-duong thiếu giá trị hoặc giá trị không phải số làm tắt ngầm hai ngưỡng 90%**
  Người dùng thấy gì: Nếu gõ sai hoặc thiếu giá trị ngưỡng khi chạy tay, phép đo bỏ qua ngưỡng 90% mà vẫn báo đạt.
  Căn cứ: Chỉ xảy ra khi người vận hành gõ sai cờ chạy tay, không đụng dữ liệu, và chạy lại là có kết quả đúng.
  file: `pipeline/scripts/do-duong-s06.mjs`
  severity: low
  Đề xuất: known-limits

- **Số phát biểu retractRule rút bị bỏ, dòng log «rút N» báo thiếu**
  Người dùng thấy gì: Nhật ký job đêm có thể báo ít hơn số tin thật sự mất đường, nên người vận hành khó thấy một đợt mất hàng loạt.
  Căn cứ: Dữ liệu vẫn đúng, chỉ thiếu thông tin trong nhật ký, và vẫn có số phân xử để lần ra.
  file: `pipeline/transform-chotot.mjs`
  severity: low
  Đề xuất: known-limits

## Chưa adversarial-verify (refuter chết)

⚠ Cụm ngoài vùng phủ: 2/11 lỗi rơi vào file không bộ đo nào phủ (pipeline/scripts/dac-trung-s06.itest.mjs, pipeline/scripts/do-dac-trung-s06.mjs) — dừng và quyết: mở rộng hợp đồng hay rút phạm vi.
