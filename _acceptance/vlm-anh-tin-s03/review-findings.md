# Review findings: vlm-anh-tin-s03 (round 1)

## Trong hợp đồng

- **Biểu thức loại hình không bao giờ khớp «đất» và «N phòng ngủ» vì \b chỉ hiểu ký tự ASCII**
  AC: AC-1
  file: pipeline/lib/vlm-anh.mjs:21
  severity: low
  source: bugs
  detail: Trong JS, \b chỉ coi [A-Za-z0-9_] là ký tự từ, kể cả khi có cờ u. `\bđất\b` cần ký tự từ ngay trước «đ», còn `phòng\s*ngủ\b` cần ký tự từ ngay sau «ủ», nên hai nhánh này gần như chết. Đã chạy thử: LOAI_HINH.test cho «bán đất», «đất nền», «bán lô đất 100m2», «2 phòng ngủ», «3 phòng ngủ rộng» đều false, trong khi «2pn» true. Bài nói rõ loại hình vẫn bị gắn thieu_loai_hinh, trái AC-1 (đúng lý do thiếu). Bài đủ dữ kiện có thể vào tập đọc và tốn lượt gọi, còn số lapDung bị tính trên lý do sai. Đo chỉ đọc trên DB local: 5/1.538 bài thieu_loai_hinh có «N phòng ngủ», 2 trong đó vào tập đọc chỉ vì lý do này; «đất» hiện là 0 bài trong tập (41 dòng trong toàn stg). Tác động hiện nhỏ nhưng lỗi chắc chắn. Comment ghi đã đo bằng đúng biểu thức này, và không test nào phủ hai nhánh. Sửa bằng ranh giới Unicode, ví dụ (?<![\p{L}\p{N}])đất(?![\p{L}\p{N}]).

- **Hình dạng 3 (assert chuỗi có mặt, lời hứa là quan hệ): «--model qwen trỏ MTPLX giả chạy được» chỉ khớp chuỗi in ra**
  AC: AC-3
  file: agent/tests/vlm-anh-s03-db.itest.ts:347
  severity: medium
  source: measurement
  detail: E6 hứa quan hệ: CLI Qwen gọi đúng MTPLX giả. Ca Qwen (dòng 345-347) chỉ assert `qwen.ma === 0` và `/đã xử 1 bài/`. Hoàn toàn không xét `yeuCau`, và dòng 350 xoá mảng này ngay sau đó. Nhánh DeepSeek ngay dưới có `yeuCau.length >= 1` (dòng 355), nhánh Qwen thì không. Hai assert này vẫn xanh khi mọi lời gọi hỏng: `hoiAnh` nuốt lỗi thành `error_kind` (vlm-anh-s03.ts:162-164), `chayLo` vẫn đẩy dòng vào `kq.dong`, và `chayLenh` in «đã xử 1 bài» rồi trả 0 (vlm-anh-run.ts:131-133). Nếu Qwen bỏ qua MTPLX_URL hoặc gọi cổng chết, ca vẫn đỏ không nổi. Ảnh đã đọc tốt (`daDoc`) cũng cho 0 yêu cầu mà vẫn xanh. Chưa đo số yêu cầu tới máy giả, cũng chưa đo `error_kind` rỗng.

- **Hình dạng 3 (assert sự có mặt, lời hứa là quan hệ): VLM-AC-1 «đúng ảnh» chỉ đếm số ảnh và nguồn, không đối chiếu sha với bài**
  AC: AC-1
  file: pipeline/tests/vlm-anh.test.mjs:73
  severity: medium
  source: measurement
  detail: AC-1 và E1 hứa mỗi bài mang đúng danh sách ảnh, tức quan hệ bài ↔ tệp. Dòng 73-74 chỉ assert `b.anh.length === 1` và `b.anh[0].nguon`. `dungMaTran` (dòng 48-64) còn không trả entry đã ghi nên test không có sha kỳ vọng để so. Lỗi tráo ảnh giữa hai bài `rieng`, ví dụ thieu-gia nhận ảnh của thieu-loai-hinh, hoặc ghép nhầm ảnh sang bài khác cùng loại nguồn, vẫn xanh.

- **Hình dạng 3 (assert sự có mặt, lời hứa là quan hệ): «phân tầng đều ba nhóm» chỉ kiểm đủ tên ba tầng**
  AC: AC-8
  file: pipeline/tests/vlm-anh.test.mjs:172
  severity: medium
  source: measurement
  detail: AC-8 hứa `--rut-mau` phân tầng ĐỀU ba nhóm, tầng cạn thì tầng khác bù (vlm-anh.mjs:178), tức quan hệ giữa số hàng các tầng. Cả dòng 172 và itest dòng 562 chỉ so `[...new Set(a.map(h => h.tang))].sort()` với ba tên tầng. Không chỗ nào đếm số hàng mỗi tầng. Bộ rút lệch 5+1+1 thay cho 1+3+3 (n=7 trên `tapPhieu`) vẫn xanh. Ca n=13 (dòng 168) chỉ kiểm không lặp sha.

- **Hình dạng 3 (quan hệ chỉ đo ở ca suy biến): «cột quote là quote các ảnh nối lại» chỉ đo trên bài một ảnh**
  AC: AC-4
  file: agent/tests/vlm-anh-s03-db.itest.ts:153
  severity: low
  source: measurement
  detail: AC-4 hứa cột `quote` là quote các ảnh nối lại. Assert duy nhất là `p.anh[0].quote === d.quote` trên bài một ảnh, nơi phép nối trùng với phần tử đầu. Các ca nhiều ảnh (`t_vlm10_trai`, `t_vlm10_mot`, `t_vlm10_loi`) không kiểm `quote`, và test `gopNhan` ở vlm-anh-s03.test.ts:187-198 chỉ đọc `.probabilities`. Đổi vlm-anh-s03.ts:198 thành `quotes[0]`, làm mất quote các ảnh sau, vẫn xanh.

- **Hình dạng 4 (âm tính một mình): ca «9 ảnh trả rỗng không được đạt» không thể đỏ vì n < 30 đã chặn sẵn**
  AC: AC-7
  file: agent/tests/vlm-anh-s03-db.itest.ts:449
  severity: medium
  source: measurement
  detail: E7 yêu cầu ca 9 ảnh không giá hoặc không thể hiện loại hình mà model trả rỗng thì không được đạt. Dòng 446 và 449 chỉ là `assert.notEqual(ketLuan, "dat")`. Với 9 ảnh, mẫu mọi thước tối đa là 9, nên `ketLuanThuoc` luôn ra `chua-du-mau` (vlm-anh-s03.ts:310) và `ketLuan` không thể là `dat`. Lỗi mà ca này canh là tính rỗng thành đúng và đưa vào mẫu số, khi đó n=9, dung=9, vẫn `chua-du-mau`, assert vẫn xanh. Vế giá còn có `gia.n === 0` (dòng 447), vế loại hình (dòng 448-449) không có `loaiHinh.n === 0` và không ghim giá trị kết luận. Không có đối chứng dương, nên ca này chỉ đo hằng MAU_TOI_THIEU.

- **Hình dạng 4 (âm tính một mình): quét «không có mã gọi model» không có đối chứng dương và bỏ sót import động**
  AC: AC-8
  file: pipeline/tests/vlm-anh.test.mjs:263
  severity: low
  source: measurement
  detail: Dòng 263-269 và itest dòng 607-610 chỉ assert hai regex KHÔNG khớp nội dung tệp. Không có mẫu nào chứng minh regex khớp được mã vi phạm, cũng không kiểm nội dung đọc được khác rỗng. Regex chỉ bắt dạng `from "ai"`, nên `await import("ai")`, `import "ai"` và `require("ai")` đều lọt, trong khi chính lát cắt này dùng import động ở vlm-anh-run.ts:44. Ca chiều đỏ của AC-3 (vlm-anh-s03.test.ts:120-123) có đối chứng, ca này thiếu.

- **Hình dạng 4 (âm tính một mình): «phiếu có dự đoán» ở test pipeline chỉ cấm một tên khoá không chỗ nào dùng**
  AC: AC-8
  file: pipeline/tests/vlm-anh.test.mjs:175
  severity: low
  source: measurement
  detail: `!JSON.stringify(h).includes("du_doan")` chỉ cấm chuỗi `du_doan`, tên không xuất hiện ở bên ghi nhãn nào; khoá dự đoán thật là `price_vnd`, `property_type`. Một `rutMau` đính kèm `price_vnd` vẫn xanh ở ca này. Không có đối chứng dương và không so tập khoá của hàng với danh sách cho phép. Itest dòng 567 rộng hơn nhưng vẫn là danh sách cấm ba tên.

- **Hình dạng 1 (không đo đầu ra): `--dem` và `--gold` hứa «in» các số nhưng test đo struct, gần như không đọc đầu ra của inDem và inCham**
  AC: AC-8
  file: agent/tests/vlm-anh-s03-db.itest.ts:595
  severity: medium
  source: measurement
  detail: AC-8 hứa `--dem` IN tập đọc theo lý do, bốn nhóm, lấp đúng, nhóm dùng từ 10 bài, tập ảnh đổi, ảnh theo loại, lộ nguồn. AC-7 hứa `--gold` in số ảnh không giá mà đọc ra giá, ô trống, không thuộc bài, tách riêng/ghép. Các assert số đều nằm trên object `demNhan`/`chamPhieu`. Với đầu ra `--dem`, chỉ có `/tập đọc [1-9]/` (dòng 595) và phép âm tính ở dòng 543. Với `inCham`, chỉ có `KẾT LUẬN` và dòng `giá: 3/3` (dòng 483-484). Bỏ khoá `anhLoNguon`, `lapDung` khỏi inDem (vlm-anh-s03.mjs:28-31), hoặc bỏ dòng ô trống khỏi inCham (vlm-anh-run.ts:90), mọi ca vẫn xanh, dù báo cáo AC-9 lấy số từ chính đầu ra này.

- **Hình dạng 5 (quét lớp chỉ có điểm-case): bảng đếm demNhan có các khoá phục vụ AC-9 mà không test nào assert**
  AC: AC-9
  file: pipeline/tests/vlm-anh.test.mjs:196
  severity: medium
  source: measurement
  detail: AC-9 yêu cầu báo số `lo-url`, số dòng có giá và có từng trường thêm, thời gian thật. E11 và báo cáo lấy các số đó từ `demNhan`. Grep cả ba tệp test cho thấy `loUrl`, `coTruong`, `xungDot`, `soAnhGoi`, `tongMs` có 0 assert. Các test đếm (dòng 196-233, itest dòng 499-546) chỉ chọn một số khoá, không có ma trận viết trước liệt kê mọi khoá đầu ra với số assert bằng số phần tử. Hỏng `coTruong` hoặc `loUrl` (vlm-anh.mjs:267, 270) vẫn xanh, trong khi đây là số trực tiếp đi vào báo cáo.

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **Cờ CLI thiếu kiểm: `--gold` không có giá trị thì rơi sang chạy lô cloud và ghi DB; `--since` sai bị bỏ qua, không thoát mã 2**
  Người dùng thấy gì: Nếu gõ thiếu đường dẫn phiếu mẫu khi chấm bằng model cloud, lệnh không báo lỗi mà chạy luôn lô thật. Ảnh chưa ai xem có thể bị gửi ra ngoài máy và nhãn bị ghi vào DB.
  Căn cứ: Ảnh có thể rời máy ngoài ý muốn nhưng chỉ khi gõ lệnh sai, người chạy khó nhận ra ngay, và chỗ sửa nhỏ nên nên làm thành một việc riêng thay vì bỏ qua.
  file: `agent/scripts/vlm-anh-run.ts`
  severity: medium
  Đề xuất: new-contract

- **Phiếu `--gold` không được kiểm: đáp án sai dạng bị loại khỏi mẫu mà không báo, có thể làm sai kết luận «đạt» của ngưỡng 90%**
  Người dùng thấy gì: Nếu người điền phiếu gõ giá sai dạng (ví dụ chữ «1,5 tỷ»), ảnh đó lặng lẽ bị bỏ khỏi mẫu chấm. Kết luận «đạt» có thể dựa trên mẫu nhỏ hơn người chạy tưởng.
  Căn cứ: Chỉ xảy ra khi phiếu điền sai dạng, người ký cổng vẫn thấy số ảnh trong bảng và điền lại được; hậu quả là kết luận lệch chứ không mất dữ liệu.
  file: `agent/src/agents/vlm-anh-s03.ts`
  severity: medium
  Đề xuất: known-limits

- **Nhánh `--gold`, đường cloud duy nhất theo contract, không để lại trace JSONL**
  Người dùng thấy gì: Lượt chấm phiếu bằng model cloud không để lại nhật ký chi tiết từng ảnh đã gửi, chỉ có sổ ghi các lần gọi. Khi cần dò lại lượt chấm sẽ ít dấu vết hơn các lệnh khác.
  Căn cứ: Sổ ghi các lần gọi vẫn còn nên không mất bằng chứng chính; thiếu thêm nhật ký chỉ gây bất tiện khi điều tra, và bổ sung sau không đắt.
  file: `agent/scripts/vlm-anh-run.ts`
  severity: medium
  Đề xuất: known-limits

- **`loai_anh` là enum mới viết tay, không có dấu vết tra RESO `ImageOf` và không khai trong mappings.yaml**
  Người dùng thấy gì: Phân loại ảnh (bảng giá, sơ đồ, ...) dùng bộ tên tự đặt, chưa đối chiếu chuẩn ngành. Khi các bước sau dùng nhãn này có thể phải đổi tên hoặc quy đổi lại.
  Căn cứ: Hiện nhãn chỉ nằm trong bảng đề xuất nội bộ, người dùng cuối không thấy; đổi tên sau có thể làm được trước khi bước sau đọc nó.
  file: `agent/src/agents/vlm-anh-s03.ts`
  severity: medium
  Đề xuất: known-limits

- **Cột `quote` của nhãn ảnh đang chứa tên nguồn thật, trái ghi chú bất biến của bảng trong migration 065**
  Người dùng thấy gì: Chữ chép lại từ ảnh có thể chứa tên nguồn thật và được lưu trong bảng nhãn nội bộ. Hiện chưa lộ ra ngoài vì bảng này không lên cloud và các lệnh chỉ in số.
  Căn cứ: Mạnh đã chủ động hoãn vấn đề lộ nguồn để tìm giải pháp riêng; dữ liệu còn ở máy local nên chưa có người dùng nào bị ảnh hưởng.
  file: `agent/src/agents/vlm-anh-s03.ts`
  severity: low
  Đề xuất: known-limits

- **Test thuần `pipeline/tests/vlm-anh.test.mjs` nằm ngoài glob `npm test`, nên CI và làn ghim lại không chạy**
  Người dùng thấy gì: Một bộ kiểm tự động của phần chọn bài và đếm không chạy trong lượt kiểm chung của CI. Nếu ai làm hỏng phần này, CI chung có thể vẫn xanh.
  Căn cứ: Bộ kiểm vẫn chạy được bằng lệnh riêng nên không mất khả năng kiểm; người dùng không bị ảnh hưởng, sửa lại sau rẻ.
  file: `pipeline/tests/vlm-anh.test.mjs`
  severity: low
  Đề xuất: known-limits

- **Lệnh mẫu `--gold research-local/...` ở đầu tệp không chạy được: agent đọc theo cwd, còn phiếu được ghi theo gốc kho**
  Người dùng thấy gì: Làm đúng theo lệnh mẫu ghi trong tệp thì lệnh chấm phiếu báo lỗi không tìm thấy phiếu, và thông báo lỗi không nói rõ lý do. Người chạy phải tự đoán ra cần đường dẫn đầy đủ.
  Căn cứ: Lỗi hiện ngay trước khi có ảnh nào rời máy và người chạy thử lại được bằng đường dẫn đầy đủ, chỉ tốn thời gian.
  file: `agent/scripts/vlm-anh-run.ts`
  severity: low
  Đề xuất: known-limits

- **Báo cáo đo ghi mọi số đến từ `--dem`, nhưng hai số không tái lập được bằng lệnh đó**
  Người dùng thấy gì: Báo cáo đo nói mọi số đều lấy từ một lệnh đếm, nhưng hai số trong đó phải lấy bằng cách khác. Người đọc muốn tự kiểm lại hai số này sẽ không làm được bằng lệnh đã ghi.
  Căn cứ: Chỉ là chú thích báo cáo chưa chính xác, không ảnh hưởng dữ liệu hay người dùng, sửa bằng một dòng ghi chú.
  file: `docs/research/s03-vlm-anh-do.md`
  severity: low
  Đề xuất: known-limits

- **Chấm phiếu tính lỗi gọi API thành model đọc sai, kết luận «không đạt» và thoát 0**
  Người dùng thấy gì: Khi dịch vụ model gặp lỗi tạm thời lúc chấm phiếu, các ảnh lỗi bị tính như model đọc sai và có thể ra kết luận «không đạt». Model bị đánh giá thấp oan, nhưng lệnh vẫn báo thành công.
  Căn cứ: Sai lệch theo hướng nghiêm hơn nên không cho model dở lọt qua; người chạy xem dòng báo lỗi cuối bảng và chạy lại được, chỉ tốn thêm lượt gọi.
  file: `agent/src/agents/vlm-anh-s03.ts`
  severity: medium
  Đề xuất: known-limits

- **Lỗi ghi sổ ai_calls bị nuốt hoàn toàn, ảnh có thể đã gửi cloud mà không có sổ**
  Người dùng thấy gì: Nếu cơ sở dữ liệu trục trặc, ảnh vẫn được gửi ra cloud nhưng không có dòng sổ ghi lại và lệnh không báo lỗi. Việc thống kê chi phí và kiểm lại các lần gửi sẽ thiếu.
  Căn cứ: Chỉ xảy ra khi DB lỗi, hiếm và trong giai đoạn chỉ chấm phiếu có người trông; thiếu sổ gây mất dấu vết chi phí chứ không lộ thêm dữ liệu.
  file: `agent/src/agents/vlm-anh-s03.ts`
  severity: medium
  Đề xuất: known-limits

- **Lệnh --gold ghi trong đầu tệp không chạy được, lỗi chỉ in chữ «Error»**
  Người dùng thấy gì: Chạy lệnh chấm phiếu đúng như mẫu thì chỉ nhận về chữ «Error», không biết thiếu tệp hay hỏng phiếu. Lần chạy cloud đầu tiên dễ vấp đúng chỗ này và mất thời gian dò lỗi.
  Căn cứ: Lỗi xảy ra trước khi ảnh nào được gửi đi và thử lại bằng đường dẫn đúng là xong; chỉ gây phiền, không mất dữ liệu.
  file: `agent/scripts/vlm-anh-run.ts`
  severity: medium
  Đề xuất: known-limits

- **--gold thiếu giá trị rơi sang chạy lô, có thể gửi ảnh chưa xem lên cloud**
  Người dùng thấy gì: Gõ lệnh chấm phiếu mà để trống đường dẫn phiếu (ví dụ biến rỗng) thì lệnh chạy luôn lô thật bằng model cloud. Tối đa 100 bài ảnh chưa ai xem có thể bị gửi ra ngoài máy và ghi vào DB.
  Căn cứ: Ảnh đã gửi ra cloud thì không thu hồi được và lỗi gõ lệnh rất dễ gặp, nên nên làm thành một việc sửa riêng, nhỏ và rẻ.
  file: `agent/scripts/vlm-anh-run.ts`
  severity: medium
  Đề xuất: new-contract

- **--since sai định dạng bị bỏ qua âm thầm, lô chạy trên toàn bộ tập**
  Người dùng thấy gì: Gõ sai ngày lọc thì lệnh không báo lỗi mà chạy trên mọi bài, kể cả bài ngoài khoảng muốn đọc. Lô sẽ tốn thêm thời gian và chi phí so với dự định.
  Căn cứ: Lô thật hiện chỉ chạy bằng model local và có trần chi phí, nên hậu quả chỉ là chạy rộng hơn dự định, xoá và chạy lại được.
  file: `agent/scripts/vlm-anh-run.ts`
  severity: low
  Đề xuất: known-limits

- **Hình dạng 4 (âm tính một mình): «bảng đếm có chữ bài» kiểm trên đầu vào vốn không mang chữ bài**
  Người dùng thấy gì: Một ca kiểm nhằm đảm bảo bảng đếm không in chữ của bài đăng thực ra không thể phát hiện lỗi vì dữ liệu đưa vào vốn không có chữ. Nếu sau này bảng đếm lộ chữ bài, ca kiểm này sẽ không báo.
  Căn cứ: Hiện bảng đếm chỉ in số nên chưa có rò rỉ nào; đây là lỗ hổng của lưới an toàn, thêm ca kiểm tốt hơn sau không khó.
  file: `agent/tests/vlm-anh-s03-db.itest.ts`
  severity: low
  Đề xuất: known-limits

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).
