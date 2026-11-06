# Review findings: chon-model-theo-o (round 1)

## Trong hợp đồng

- **Hình dạng 3 (assert giá trị có mặt thay cho QUAN HỆ): kiemTomTat lấy dung_gop có sẵn trong tệp, không tính lại dung/mau_so; mau_so ghim cứng 23*16**
  AC: AC-10
  file: `agent/tests/doc-gop-s03.test.ts:266`
  severity: medium
  detail: E10 hứa một quan hệ: «mau_so = 23 × số ô giao model (368 với bảng mặc định), dung_gop = dung / mau_so ≥ 0.92». kiemTomTat không kiểm quan hệ đó. Dòng 268 đọc `const d = t.dung_gop` rồi so ngưỡng 0.90 và 0.92 trên chính trường đã ghi trong cham-test.json, không đối chiếu với `t.dung / t.mau_so`. Dòng 266 `assert.equal(t.mau_so, 23 * 16)` ghim cứng số 16 thay vì `t.so_the × số ô giao` lấy từ keHoach(napCauHinh()). Hệ quả: một tóm tắt mang dung=300, mau_so=368, dung_gop=0.95 vẫn qua cả hai ngưỡng, dù 300/368 chỉ là 81,5%. Ở ca chiều đỏ (dòng ~279), đột biến chỉ đổi riêng dung_gop, chưa có ca nào làm dung và dung_gop lệch nhau. Tệp `_acceptance/chon-model-theo-o/evidence/cham-test.json` là bằng chứng sửa được bằng tay, nên thước cần tự tính lại tỉ lệ từ dung và mau_so. Hiện tệp thật vẫn khớp (343/368 = 0.93207), nhưng phép đo không bảo đảm điều đó.
  source: measurement

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **`--thu` bỏ qua bước kiểm khoá Gateway nhưng lượt vẫn gọi model thật**
  Người dùng thấy gì: Chạy thử bằng chế độ thử mà thiếu khoá có thể vẫn gọi model thật, tốn tiền hoặc để lại dòng lỗi trong sổ lời gọi.
  Căn cứ: Chỉ người vận hành chạy tay mới gặp, hậu quả nhẹ và có trần tiền của lượt chặn, tự gỡ được bằng cách chạy lại có khoá.
  file: `agent/scripts/doc-gop-s03.ts`
  severity: medium
  Đề xuất: known-limits

- **Nhóm model không được giao `listing_intent` vẫn ghi `silver_labels` với listing_intent='unknown', json_ok=true; màn gắn nhãn đọc dòng mới nhất bất kể model**
  Người dùng thấy gì: Khi bảng chọn dùng từ hai model, màn gắn nhãn có thể hiện «không rõ» thay cho ý định đăng tin mà model đã đọc đúng.
  Căn cứ: Chỉ xảy ra khi đổi sang nhiều model, số đọc đúng vẫn nằm trong dữ liệu nên không mất gì, và sửa sau không đắt.
  file: `agent/src/enrich/doc-gop-s03/chay.ts`
  severity: medium
  Đề xuất: known-limits

- **Chép cứng enum listing_intent/kind thay vì dùng vocab.generated (RESO-first, mappings.yaml)**
  Người dùng thấy gì: Nếu sau này thêm loại tin mới vào từ điển chung, bộ đọc gộp sẽ lặng lẽ coi loại đó là không rõ.
  Căn cứ: Chưa gây hại hôm nay vì danh sách chưa đổi, và nhắc lại được khi từ điển đổi.
  file: `agent/src/enrich/doc-gop-s03/chay.ts`
  severity: low
  Đề xuất: known-limits

- **Bảng chọn không chặn hai khoá model trùng một mã Gateway, làm sai `o_duoc_giao` và gộp sai nguồn**
  Người dùng thấy gì: Nếu ai đó khai hai tên model trỏ cùng một mã, lượt đọc tốn tiền gọi hai lần mà kết quả bị ghi đè hoặc bỏ mất một phần.
  Căn cứ: Cần cấu hình sai có chủ ý mới gặp, thiệt hại chỉ là vài lời gọi thừa và thấy ngay khi chạy thử.
  file: `agent/src/enrich/doc-gop-s03/cau-hinh.ts`
  severity: low
  Đề xuất: known-limits

- **--thu bỏ kiểm AI_GATEWAY_API_KEY nhưng vẫn gọi Gateway thật và vẫn ghi ai_calls**
  Người dùng thấy gì: Chế độ thử không thật sự «thử khô»: vẫn có thể gọi model thật và ghi sổ lời gọi, kể cả khi thiếu khoá.
  Căn cứ: Ảnh hưởng nhỏ, chỉ người chạy tay gặp, tiền bị chặn bởi trần của lượt.
  file: `agent/scripts/doc-gop-s03.ts`
  severity: medium
  Đề xuất: known-limits

- **chayLuot nuốt lỗi gọi: không đếm, không báo, lệnh thoát 0 kể cả khi mọi lời gọi đều hỏng**
  Người dùng thấy gì: Một lượt đọc hỏng toàn bộ vẫn báo như thành công, nên người vận hành khó nhận ra ngay.
  Căn cứ: Không mất dữ liệu vì lỗi vẫn nằm trong sổ lời gọi và chạy lại được, nhưng chưa có lịch chạy tự động nên chưa ai bị lừa.
  file: `agent/src/enrich/doc-gop-s03/chay.ts`
  severity: medium
  Đề xuất: known-limits

- **docO nhận mọi object lệch khuôn thành ô hợp lệ v=null, json_ok=true, nhãn sai bị khoá vĩnh viễn**
  Người dùng thấy gì: Khi model trả một ô sai khuôn, hệ thống coi như «không suy ra» và không đọc lại, nên ô đó có thể bị bỏ trống và điểm đo cao hơn thực tế.
  Căn cứ: Nhãn bạc chỉ để tham khảo và chưa tự áp vào dữ liệu, nhưng có thể làm số đo đẹp giả; sửa không đắt.
  file: `agent/src/enrich/doc-gop-s03/doc.ts`
  severity: medium
  Đề xuất: known-limits

- **Lệnh chấm lấy nhãn vàng tuỳ tiện khi một ô có nhiều người gắn**
  Người dùng thấy gì: Khi một thẻ có hai người gắn nhãn, điểm đúng của model có thể đổi giữa các lần chấm mà không báo.
  Căn cứ: Hiện chỉ một người gắn nên chưa xảy ra; chỉ cần xử lý trước khi có người gắn thứ hai.
  file: `agent/src/enrich/doc-gop-s03/cham-lenh.ts`
  severity: low
  Đề xuất: known-limits

- **Hình dạng 1 (đo chỉ dẫn thay vì đầu ra): DGS-AC-1-T1 tự đọc YAML và khớp glob bằng node:path.matchesGlob, không chạy match_globs của lưới trước-merge**
  Người dùng thấy gì: Phép kiểm «đổi bảng chọn không cần hồ sơ» dùng cách khớp riêng, nên có thể xanh trong khi cổng thật xử khác.
  Căn cứ: Hiện tệp vẫn khớp nên chưa sai, và nếu lệch thì cổng thật chặn ngay khi gộp, không để lọt.
  file: `agent/tests/doc-gop-s03.test.ts`
  severity: low
  Đề xuất: known-limits

- **Hình dạng 1 (đo lời tự báo của mã thay vì đầu ra quan sát được): DGS-AC-8 (b) đếm lời gọi bằng kq.goi, bỏ mảng ghi của Gateway giả**
  Người dùng thấy gì: Phép kiểm trần tiền đếm lời gọi bằng số tự báo của chương trình chứ không đếm lời gọi thật tới model giả.
  Căn cứ: Điểm yếu nhỏ của bài kiểm, ca bên cạnh đã đếm thật, không ảnh hưởng người dùng.
  file: `agent/tests/doc-gop-s03.test.ts`
  severity: low
  Đề xuất: known-limits

- **Hình dạng 5 (tuyên quét LỚP nhưng chỉ có điểm-case): bảng cờ «chỉ nhận 7 cờ, thoát 2» chỉ kiểm 2 cờ bị từ chối và 3 cờ được nhận**
  Người dùng thấy gì: Bài kiểm các cờ dòng lệnh chưa phủ hết bảy cờ nên một cờ bị đổi nhầm có thể không bị phát hiện.
  Căn cứ: Hai cờ nguy hiểm nhất đã được kiểm là bị từ chối, phần còn lại chỉ gây phiền nhẹ khi chạy tay.
  file: `agent/tests/doc-gop-s03.test.ts`
  severity: low
  Đề xuất: known-limits

- **Hình dạng 5 (ma trận không viết trước): «probabilities.o có đủ 17 khoá» so với FIELDS nhập từ chính mã đang kiểm**
  Người dùng thấy gì: Bài kiểm «đủ 17 ô» lấy danh sách từ chính mã đang kiểm, nên nếu mã mất một ô thì bài kiểm vẫn xanh.
  Căn cứ: Hiện đủ 17 ô thật và việc mất ô sẽ lộ ở các ca khác; sửa bằng một dòng danh sách viết sẵn khi tiện.
  file: `agent/tests/doc-gop-s03-db.itest.ts`
  severity: low
  Đề xuất: known-limits

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).
