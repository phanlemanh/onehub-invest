# Review findings: nhom-hai-lan-s03-xu-goc

## Trong hợp đồng

- **E3/AC-3 xanh rỗng: bài không có khoá vẫn gom thành nhóm khoá rỗng và nhận loại tin thật**
  AC: AC-3
  file: `pipeline/scripts/nhom-hai-lan-transform.itest.mjs:135`
  severity: medium
  source: bugs
  detail: AC-3 cam kết «bài không có khoá không vào nhóm nào», nhưng `mucDichNhom` gom mọi bài `conversation_id` null vào khoá "" (`pipeline/transform-zalo.mjs:464`). `runTransformZalo` (dòng 779) và `tangLoai` đọc lại khoá đó bằng `mucDich.get(p.conversation_id ?? "")`. Fixture chỉ có 2 bài null (x-3), dưới ngưỡng `NHOM_TOI_THIEU` 20, nên vế `ok AC-3 khong co khoa khong vao nhom` không thể đỏ; đột biến `GOP_QUA_TAY` cũng không chạm bài null vì `veKhoaNhom` bỏ qua chúng. Đo chỉ đọc trên `oneinvest_nhl_xu`: 91 bài null, `mucDichNhom` trả `mucDich['']='sale'` (62 bán, 10 thuê, đạt 85%). 5 bài null nhận loại qua nguồn `boi-canh-nhom`, và kết quả `kind` khác với khi không có mục đích nhóm. Các bài này đến từ nhiều nhóm khác nhau (3 giá trị group_name). Logic gom có từ trước diff, nhưng hồ sơ này khẳng định điều ngược lại bằng một phép đo không thể đỏ. Sửa: bỏ qua khoá null trong `mucDichNhom` như `loaiHinhNhom` đã làm (`if (!k ...) continue`), và thêm fixture từ 20 bài null trở lên cho vế này. Đổi transform sẽ đổi 5 bài trên, nên cần đo lại AC-4.

- **Hình dạng 4 — Assertion âm tính một mình: 'AC-3 khong co khoa khong vao nhom' không thể đỏ vì fixture chỉ có 1 bài chữ bài ở nhóm không khoá**
  AC: AC-3
  file: `pipeline/scripts/nhom-hai-lan-transform.itest.mjs:135`
  severity: high
  source: measurement
  detail: Dòng 135 chỉ assert `kind(mac, "x-3") === null && loai(mac, "x-3") !== "apartment"`. Fixture (dòng 88-91) cho khoá null đúng 2 bài, trong đó 1 bài có chữ «Bán», dưới ngưỡng NHOM_TOI_THIEU = 20. Vì vậy kind luôn null, dù bài không khoá có vào nhóm hay không. Đối chứng dương `qua` ở dòng 137 chỉ đọc x-0, không có ca đỏ cho x-3. Mã thật lại có gom: `mucDichNhom` dùng `b.conversation_id ?? ""` (transform-zalo.mjs, trong hàm mucDichNhom), và dòng 535, 779 tra `mucDich.get(p.conversation_id ?? "")`, nên mọi bài không khoá chung nhóm "". Đã chạy `tangLoai` thật: thêm 24 bài không khoá có chữ «Bán» thì bài dạng x-3 ra `moi-nhan`; với 1 bài như fixture thì ra `van-bo`. Mệnh đề AC-3 «bài không có khoá không vào nhóm nào» xanh nhờ fixture quá nhỏ trong khi hành vi thật trái lời hứa. Ca x-2 (`k:group:`) cùng lỗi: chỉ 2 bài nên kind luôn null, và bỏ `(?=.)` khỏi khoaNhomThat (khoá thành "") vẫn không làm đỏ dòng 134, 136 hay 137.

- **Hình dạng 5 — Tuyên quét lớp nhưng chỉ có điểm-case: trục dạng khoá × chỗ đọc khoá không có ma trận, thiếu `group:` và thiếu khoá lạ ở sổ**
  AC: AC-3
  file: `pipeline/scripts/nhom-hai-lan-transform.itest.mjs:88`
  severity: medium
  source: measurement
  detail: coverage-scan.md khai trục dạng khoá «của bài và sổ» gồm trần, `group:`, `<kênh>:group:`, khoá lạ, không khoá, nhân với bốn chỗ đọc: mục đích, loại hình, thị trường khai, tầng loại tin. card-plain.json ghi «Đã phủ dạng khoá (AC-1 đến AC-3), mọi chỗ bước đọc tin dùng khoá». Itest không có ma trận viết trước, chỉ có ca lẻ. (a) Không bài và không dòng sổ nào ở dạng `group:<k>` trần tiền tố: TIEN_TO ở dòng 13 chỉ sinh `kx:group:`, và grep `group:` trong tệp chỉ ra dòng 13 và 88. (b) AC-3 ghi «bài và sổ mang `conv:x`, `a:b:group:x`, `k:group:`», nhưng dungFixture dòng 86-91 không gọi `dongSo` cho khoá lạ nào, cũng không có dòng sổ `nhl-x` khai thị trường. Ô khoá lạ × thị trường khai trống: gộp nhầm ở vòng lặp mới của `docThiTruongNhom` sẽ không đỏ, và `anhKhoaLe` (dòng 110) không đọc area_id. Số assert không bằng số phần tử của lớp đã tuyên.

- **Hình dạng 5 — Lớp `retired`, `completed` chỉ có điểm-case: AC-6 và AC-5 không có ca `completed`**
  AC: AC-6
  file: `pipeline/scripts/don-nhom-hai-lan.itest.mjs:111`
  severity: medium
  source: measurement
  detail: AC-6 liệt kê rõ «dòng đại diện đã `retired`, `completed`», và `CUOI = ["retired", "completed"]` trong don-nhom-hai-lan.mjs quyết định `hieuLuc`. Fixture dòng 111 chỉ dựng `nhl-go` với status 'retired', dòng 129 assert một ca. Trong tệp, `completed` chỉ xuất hiện trong SQL đọc ở dòng 79, không có dòng fixture nào mang trạng thái này (migration 047 có cho phép). Rút `completed` khỏi CUOI thì đại diện `completed` bị coi là còn hiệu lực và dòng phụ bị dọn, mà itest vẫn xanh. Hai phần tử của lớp nhưng chỉ một assert.

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **Thêm định danh nguồn thật tầng A vào tệp mới trên kho công khai**
  Người dùng thấy gì: Một số tệp mới trên kho công khai có ghi tên kênh nguồn thật, nên người ngoài có thể đọc được nguồn dữ liệu nào đang được thu. Phép quét rò rỉ hiện tại không bắt được loại tên này.
  Căn cứ: Tên nguồn thật là dữ liệu cần giấu và kho đang công khai, nên một khi đã đẩy lên thì khó rút lại; tuy nhiên tên này đã lộ ở nhiều tệp cũ nên mức tăng rủi ro vừa phải, và sửa lúc này còn rẻ hơn dọn muộn.
  file: `pipeline/scripts/do-nhom-hai-lan.mjs`
  severity: medium
  Đề xuất: new-contract

- **Lệnh ghi sổ không kiểm cờ lạ: gõ sai `--hoan-lai` kèm `--ghi` sẽ chạy chiều dọn**
  Người dùng thấy gì: Nếu người vận hành gõ sai tên cờ hoàn lại khi đang ghi, lệnh sẽ chạy chiều dọn sổ thay vì chiều hoàn lại mà họ định làm.
  Căn cứ: Chỉ xảy ra khi gõ sai và chỉ trên một lệnh chạy tay, một lần; dọn lại không đổi gì nếu đã dọn xong và có thể hoàn lại, nên hậu quả nhẹ và tự sửa được.
  file: `pipeline/don-nhom-hai-lan.mjs`
  severity: low
  Đề xuất: known-limits

- **`pipeline/` nhập mã từ thư mục đầu dò của một hồ sơ nghiệm thu, đảo chiều phụ thuộc đang có**
  Người dùng thấy gì: Công cụ đo của lượt này dựa vào mã nằm trong thư mục của một hồ sơ nghiệm thu khác, nên nếu hồ sơ kia bị đổi tên hay dọn thì công cụ đo sẽ hỏng.
  Căn cứ: Người dùng cuối không thấy gì; chỉ làm công cụ nội bộ dễ gãy khi dọn kho về sau và gãy thì báo lỗi rõ ngay, nên ghi lại rồi sửa khi dọn hồ sơ cũ.
  file: `pipeline/scripts/do-nhom-hai-lan.mjs`
  severity: low
  Đề xuất: known-limits

- **docThiTruongNhom lấy thị trường từ dòng đã retired, lệnh xoá khai báo sau dọn sổ không có tác dụng và không báo gì**
  Người dùng thấy gì: Sau khi dọn sổ, nếu quản trị viên xoá thị trường đã khai cho một nhóm thì các bài của nhóm vẫn bị gắn vào thị trường cũ mà không có cảnh báo nào.
  Căn cứ: Gây gắn sai thị trường âm thầm cho các bài của nhóm đó, nhưng chỉ khi có người xoá khai báo sau khi đã dọn sổ (chưa chạy trên sổ thật), và sửa được bằng khai lại và chạy lại.
  file: `pipeline/transform-zalo.mjs`
  severity: medium
  Đề xuất: new-contract

- **Bộ quét khoá bỏ qua không báo các tệp có tên không phải ASCII vì git trả đường dẫn đã quote**
  Người dùng thấy gì: Phép quét rò rỉ có thể lặng lẽ bỏ qua tệp có tên tiếng Việt có dấu mà vẫn báo đã quét xong và xanh.
  Căn cứ: Hiện chưa có tệp nào trong dải quét bị ảnh hưởng nên chưa lộ gì; rủi ro chỉ xuất hiện nếu về sau có tệp tên có dấu, và có thể vá khi gặp.
  file: `_acceptance/nhom-dang-ky-hai-lan-s03/probes/_quet.mjs`
  severity: low
  Đề xuất: known-limits

- **Hình dạng 4 — Đối chứng dương giả: 'do: loi ten don vi' mồi bằng token kênh, không phải tên đơn vị, và TEN được phép rỗng**
  Người dùng thấy gì: Phần kiểm tra rằng tên đơn vị không lọt vào đầu ra chưa có bằng chứng nó thật sự bắt được tên, nên có thể báo xanh dù không quét gì.
  Căn cứ: Chỉ làm yếu một lớp kiểm rò rỉ nội bộ chứ không làm lộ dữ liệu, và token kênh vẫn được kiểm có đối chứng nên rủi ro thấp.
  file: `pipeline/scripts/do-nhom-hai-lan.mjs`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 3 — Assert chuỗi có mặt thay vì quan hệ: 'AC-5 in dung ma' không phân biệt mã đại diện với mã phụ**
  Người dùng thấy gì: Khi chạy thử trước khi ghi, bài kiểm chưa chặn được trường hợp in đảo mã giữ và mã phụ, hoặc in mã sang nhầm nhóm.
  Căn cứ: Chỉ ảnh hưởng chữ người xem lúc chạy thử, chưa đổi dữ liệu; lượt ghi thật có các kiểm khác theo sau nên mức hại thấp.
  file: `pipeline/scripts/don-nhom-hai-lan.itest.mjs`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 3 — Assert có mặt thay vì quan hệ: 'AC-8 co ba tep ban cu bo sot' vẫn xanh khi bỏ dải của PR #315**
  Người dùng thấy gì: Phép quét rò rỉ có thể vẫn báo đủ ba tệp ngay cả khi lỡ bỏ phần thay đổi của lượt trước, nên độ phủ của nó chưa được chứng minh chặt.
  Căn cứ: Chỉ làm yếu một phép đo nội bộ; hiện kết quả vẫn đúng trên nhánh này nên chưa có dữ liệu nào lộ hay sai.
  file: `_acceptance/nhom-dang-ky-hai-lan-s03/probes/that-chi-doc.mjs`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 4 — Assertion âm tính một mình: bộ đếm `them` của soCong không có ca đỏ**
  Người dùng thấy gì: Phép đo «không có tin nào bị thêm vào cổng» chưa được thử bằng ca cố ý sai nên chưa chứng minh nó bắt được lỗi này.
  Căn cứ: Chiều tin rời cổng đã có đối chứng và số đo thật cho 0 tin thêm; thiếu đối chứng chỉ làm giảm độ tin cậy chứ không làm sai dữ liệu.
  file: `pipeline/scripts/do-nhom-hai-lan.mjs`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 5 — Lớp «trạng thái cũ» ba trường chỉ phủ hai: `resume_when` không bao giờ khác null trong fixture hoàn lại**
  Người dùng thấy gì: Khi hoàn lại việc dọn sổ, lịch hẹn tiếp tục của một đơn vị đang tạm dừng có thể không được trả về, và bài kiểm hiện chưa bắt được điều này.
  Căn cứ: Rất ít đơn vị tạm dừng có lịch hẹn, hoàn lại là thao tác hiếm, và nếu mất thì đặt lại tay được nên hậu quả nhẹ.
  file: `pipeline/scripts/don-nhom-hai-lan.itest.mjs`
  severity: low
  Đề xuất: known-limits

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).
