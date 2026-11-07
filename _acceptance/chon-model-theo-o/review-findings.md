## Trong hợp đồng

(không có)

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **Hai sửa của vòng S4-r2 (đếm lời gọi hỏng và thoát 1; đòi khoá khi có --thu) chưa có test giữ**
  Người dùng thấy gì: Hai chỗ báo lỗi của lệnh đọc tin đã được sửa nhưng chưa có kiểm tra tự động giữ lại. Nếu sau này ai đó lỡ làm lùi, sẽ không có gì báo đỏ.
  Căn cứ: Hành vi hiện đúng và không ảnh hưởng dữ liệu hay người dùng cuối; thiếu kiểm tra chỉ là rủi ro lùi về sau, thêm sau rẻ.
  file: `agent/scripts/doc-gop-s03.ts`
  severity: low
  Đề xuất: known-limits

- **Lệnh chay có --thu vẫn ghi ai_calls, khác doc-toan-bo mà chú thích mới nói là làm giống**
  Người dùng thấy gì: Khi chạy thử, lệnh đọc tin vẫn ghi vào sổ chi phí gọi model, trong khi chú thích nói là làm giống lệnh kia (không ghi). Chỉ gây lệch cách hiểu, không làm sai dữ liệu nhãn.
  Căn cứ: Hậu quả nhẹ: sổ chi phí đủ hơn chứ không mất dữ liệu, chỉ cần ghi rõ đây là khác biệt có chủ ý; người dùng không bị ảnh hưởng.
  file: `agent/src/enrich/doc-gop-s03/chay.ts`
  severity: low
  Đề xuất: known-limits

- **Lệnh chay thoát 0 khi mọi lời gọi trả JSON hỏng: bản sửa t6 chỉ đếm lỗi gọi, không đếm json-hong**
  Người dùng thấy gì: Nếu model mới trả toàn kết quả hỏng khuôn, lượt đọc tin vẫn báo thành công dù tốn tiền và không có nhãn dùng được. Người vận hành phải đọc dòng log mới biết.
  Căn cứ: Không mất dữ liệu, các bài hỏng được đọc lại ở lượt sau và tiền tiêu bị chặn bởi trần; nhưng lượt hỏng có thể bị bỏ sót nếu chỉ nhìn kết quả thành công, sửa sau nhỏ.
  file: `agent/scripts/doc-gop-s03.ts`
  severity: low
  Đề xuất: known-limits

- **`--thu` bỏ qua bước kiểm khoá Gateway nhưng lượt vẫn gọi model thật (r1 · tệp đã đổi)**
  Người dùng thấy gì: Chạy thử bằng chế độ thử mà thiếu khoá có thể vẫn gọi model thật, tốn tiền hoặc để lại dòng lỗi trong sổ lời gọi.
  Căn cứ: Chỉ người vận hành chạy tay mới gặp, hậu quả nhẹ và có trần tiền của lượt chặn, tự gỡ được bằng cách chạy lại có khoá.
  file: `agent/scripts/doc-gop-s03.ts`
  severity: medium
  Đề xuất: known-limits

- **Nhóm model không được giao `listing_intent` vẫn ghi `silver_labels` với listing_intent='unknown', json_ok=true; màn gắn nhãn đọc dòng mới nhất bất kể model (r1 · tệp đã đổi)**
  Người dùng thấy gì: Khi bảng chọn dùng từ hai model, màn gắn nhãn có thể hiện «không rõ» thay cho ý định đăng tin mà model đã đọc đúng.
  Căn cứ: Chỉ xảy ra khi đổi sang nhiều model, số đọc đúng vẫn nằm trong dữ liệu nên không mất gì, và sửa sau không đắt.
  file: `agent/src/enrich/doc-gop-s03/chay.ts`
  severity: medium
  Đề xuất: known-limits

- **Chép cứng enum listing_intent/kind thay vì dùng vocab.generated (RESO-first, mappings.yaml) (r1 · tệp đã đổi)**
  Người dùng thấy gì: Nếu sau này thêm loại tin mới vào từ điển chung, bộ đọc gộp sẽ lặng lẽ coi loại đó là không rõ.
  Căn cứ: Chưa gây hại hôm nay vì danh sách chưa đổi, và nhắc lại được khi từ điển đổi.
  file: `agent/src/enrich/doc-gop-s03/chay.ts`
  severity: low
  Đề xuất: known-limits

- **Bảng chọn không chặn hai khoá model trùng một mã Gateway, làm sai `o_duoc_giao` và gộp sai nguồn (r1 · tệp đã đổi)**
  Người dùng thấy gì: Nếu ai đó khai hai tên model trỏ cùng một mã, lượt đọc tốn tiền gọi hai lần mà kết quả bị ghi đè hoặc bỏ mất một phần.
  Căn cứ: Cần cấu hình sai có chủ ý mới gặp, thiệt hại chỉ là vài lời gọi thừa và thấy ngay khi chạy thử.
  file: `agent/src/enrich/doc-gop-s03/cau-hinh.ts`
  severity: low
  Đề xuất: known-limits

- **--thu bỏ kiểm AI_GATEWAY_API_KEY nhưng vẫn gọi Gateway thật và vẫn ghi ai_calls (r1 · tệp đã đổi)**
  Người dùng thấy gì: Chế độ thử không thật sự «thử khô»: vẫn có thể gọi model thật và ghi sổ lời gọi, kể cả khi thiếu khoá.
  Căn cứ: Ảnh hưởng nhỏ, chỉ người chạy tay gặp, tiền bị chặn bởi trần của lượt.
  file: `agent/scripts/doc-gop-s03.ts`
  severity: medium
  Đề xuất: known-limits

- **chayLuot nuốt lỗi gọi: không đếm, không báo, lệnh thoát 0 kể cả khi mọi lời gọi đều hỏng (r1 · tệp đã đổi)**
  Người dùng thấy gì: Một lượt đọc hỏng toàn bộ vẫn báo như thành công, nên người vận hành khó nhận ra ngay.
  Căn cứ: Không mất dữ liệu vì lỗi vẫn nằm trong sổ lời gọi và chạy lại được, nhưng chưa có lịch chạy tự động nên chưa ai bị lừa.
  file: `agent/src/enrich/doc-gop-s03/chay.ts`
  severity: medium
  Đề xuất: known-limits

- **docO nhận mọi object lệch khuôn thành ô hợp lệ v=null, json_ok=true, nhãn sai bị khoá vĩnh viễn (r1)**
  Người dùng thấy gì: Khi model trả một ô sai khuôn, hệ thống coi như «không suy ra» và không đọc lại, nên ô đó có thể bị bỏ trống và điểm đo cao hơn thực tế.
  Căn cứ: Nhãn bạc chỉ để tham khảo và chưa tự áp vào dữ liệu, nhưng có thể làm số đo đẹp giả; sửa không đắt.
  file: `agent/src/enrich/doc-gop-s03/doc.ts`
  severity: medium
  Đề xuất: known-limits

- **Lệnh chấm lấy nhãn vàng tuỳ tiện khi một ô có nhiều người gắn (r1)**
  Người dùng thấy gì: Khi một thẻ có hai người gắn nhãn, điểm đúng của model có thể đổi giữa các lần chấm mà không báo.
  Căn cứ: Hiện chỉ một người gắn nên chưa xảy ra; chỉ cần xử lý trước khi có người gắn thứ hai.
  file: `agent/src/enrich/doc-gop-s03/cham-lenh.ts`
  severity: low
  Đề xuất: known-limits

- **Hình dạng 1 (đo chỉ dẫn thay vì đầu ra): DGS-AC-1-T1 tự đọc YAML và khớp glob bằng node:path.matchesGlob, không chạy match_globs của lưới trước-merge (r1 · tệp đã đổi)**
  Người dùng thấy gì: Phép kiểm «đổi bảng chọn không cần hồ sơ» dùng cách khớp riêng, nên có thể xanh trong khi cổng thật xử khác.
  Căn cứ: Hiện tệp vẫn khớp nên chưa sai, và nếu lệch thì cổng thật chặn ngay khi gộp, không để lọt.
  file: `agent/tests/doc-gop-s03.test.ts`
  severity: low
  Đề xuất: known-limits

- **Hình dạng 1 (đo lời tự báo của mã thay vì đầu ra quan sát được): DGS-AC-8 (b) đếm lời gọi bằng kq.goi, bỏ mảng ghi của Gateway giả (r1 · tệp đã đổi)**
  Người dùng thấy gì: Phép kiểm trần tiền đếm lời gọi bằng số tự báo của chương trình chứ không đếm lời gọi thật tới model giả.
  Căn cứ: Điểm yếu nhỏ của bài kiểm, ca bên cạnh đã đếm thật, không ảnh hưởng người dùng.
  file: `agent/tests/doc-gop-s03.test.ts`
  severity: low
  Đề xuất: known-limits

- **Hình dạng 5 (tuyên quét LỚP nhưng chỉ có điểm-case): bảng cờ «chỉ nhận 7 cờ, thoát 2» chỉ kiểm 2 cờ bị từ chối và 3 cờ được nhận (r1 · tệp đã đổi)**
  Người dùng thấy gì: Bài kiểm các cờ dòng lệnh chưa phủ hết bảy cờ nên một cờ bị đổi nhầm có thể không bị phát hiện.
  Căn cứ: Hai cờ nguy hiểm nhất đã được kiểm là bị từ chối, phần còn lại chỉ gây phiền nhẹ khi chạy tay.
  file: `agent/tests/doc-gop-s03.test.ts`
  severity: low
  Đề xuất: known-limits

- **Hình dạng 5 (ma trận không viết trước): «probabilities.o có đủ 17 khoá» so với FIELDS nhập từ chính mã đang kiểm (r1)**
  Người dùng thấy gì: Bài kiểm «đủ 17 ô» lấy danh sách từ chính mã đang kiểm, nên nếu mã mất một ô thì bài kiểm vẫn xanh.
  Căn cứ: Hiện đủ 17 ô thật và việc mất ô sẽ lộ ở các ca khác; sửa bằng một dòng danh sách viết sẵn khi tiện.
  file: `agent/tests/doc-gop-s03-db.itest.ts`
  severity: low
  Đề xuất: known-limits

- **Bảng giá model (ai_model_prices) chưa có giá của ba model qua Gateway — chi phí đọc gộp không lên được trang chi phí chung**
  Người dùng thấy gì: Trang theo dõi chi phí AI của Ops không tính được tiền của lượt đọc gộp, vì bảng giá chỉ có model cũ, đơn vị VND; tiền thật của lượt vẫn nằm trong nhãn (cost_usd) và sổ chi phí của lượt.
  Căn cứ: Cần migration mới cho cột USD hoặc tỉ giá cùng ba dòng giá, chạm schema nên không vá trong vòng này; giám sát đã nhận cắt thành hàng nhỏ gắn với PL31 (chi phí lên bậc) sau khi Cổng Bằng chứng PL30 được ký.
  file: `agent/config/doc-gop-s03.json`
  severity: low
  Đề xuất: new-contract

## Chưa adversarial-verify (refuter chết)

(không có)

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).
