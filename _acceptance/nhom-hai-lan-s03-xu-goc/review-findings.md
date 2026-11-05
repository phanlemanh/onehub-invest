# Review findings: nhom-hai-lan-s03-xu-goc (round 2)

## Trong hợp đồng

Không có.

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **So với mã ở điểm rẽ chỉ in ra, không có kiem nên lệch vẫn exit 0**
  Người dùng thấy gì: Phép đo so sánh với cách tính cũ chỉ hiện số trên màn hình cho người đọc. Nếu có tin rao nào bị mất khỏi cổng so với trước, phép đo vẫn báo xanh, nên phải có người đọc số mới biết.
  Căn cứ: Hôm nay số đo cho thấy không tin nào đổi nên chưa ai bị ảnh hưởng, và thêm một điều kiện kiểm vào sau này rẻ, không mất dữ liệu.
  file: `pipeline/scripts/do-nhom-hai-lan.mjs`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 3 — Lời hứa là quan hệ mã cũ với mã mới, nhưng phép đo chỉ in chuỗi 'cong lech ma cu', không có kiem**
  Người dùng thấy gì: Lời hứa là không tin nào rời hay thêm vào cổng so với trước, nhưng phép đo chỉ in số ra chứ không tự báo đỏ khi lệch. Một tin rao biến mất khỏi cổng có thể lọt qua mà không ai bị cảnh báo.
  Căn cứ: Hậu quả tiềm ẩn nhẹ vì số đo hiện tại bằng không và người đọc log vẫn thấy được; cho phép đo tự báo đỏ sau này rẻ, không mất dữ liệu.
  file: `pipeline/scripts/do-nhom-hai-lan.mjs`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 4 — Assertion âm tính một mình: các ô `loai: null` và `khuVuc: null` của MA_TRAN không có đối chứng dương theo từng ô**
  Người dùng thấy gì: Một vài ô kiểm cho bài không có khoá chưa từng được thử làm đỏ, nên nếu hỏng đúng chỗ đó thì phép kiểm có thể không báo. Nguy cơ là bài không khoá bị xếp nhầm loại hình mà không ai hay.
  Căn cứ: Các ô quan trọng nhất đã có phép ghim đỏ và chỉ còn vài ô chưa có đối chứng; hậu quả nhẹ, không mất dữ liệu, và bổ sung sau rẻ.
  file: `pipeline/scripts/nhom-hai-lan-transform.itest.mjs`
  severity: low
  Đề xuất: known-limits

- **Thêm định danh nguồn thật tầng A vào tệp mới trên kho công khai (r1 · tệp đã đổi)**
  Người dùng thấy gì: Một số tệp mới trên kho công khai có ghi tên kênh nguồn thật, nên người ngoài có thể đọc được nguồn dữ liệu nào đang được thu. Phép quét rò rỉ hiện tại không bắt được loại tên này.
  Căn cứ: Tên nguồn thật là dữ liệu cần giấu và kho đang công khai, nên một khi đã đẩy lên thì khó rút lại; tuy nhiên tên này đã lộ ở nhiều tệp cũ nên mức tăng rủi ro vừa phải, và sửa lúc này còn rẻ hơn dọn muộn.
  file: `pipeline/scripts/do-nhom-hai-lan.mjs`
  severity: medium
  Đề xuất: new-contract

- **Lệnh ghi sổ không kiểm cờ lạ: gõ sai `--hoan-lai` kèm `--ghi` sẽ chạy chiều dọn (r1)**
  Người dùng thấy gì: Nếu người vận hành gõ sai tên cờ hoàn lại khi đang ghi, lệnh sẽ chạy chiều dọn sổ thay vì chiều hoàn lại mà họ định làm.
  Căn cứ: Chỉ xảy ra khi gõ sai và chỉ trên một lệnh chạy tay, một lần; dọn lại không đổi gì nếu đã dọn xong và có thể hoàn lại, nên hậu quả nhẹ và tự sửa được.
  file: `pipeline/don-nhom-hai-lan.mjs`
  severity: low
  Đề xuất: known-limits

- **`pipeline/` nhập mã từ thư mục đầu dò của một hồ sơ nghiệm thu, đảo chiều phụ thuộc đang có (r1 · tệp đã đổi)**
  Người dùng thấy gì: Công cụ đo của lượt này dựa vào mã nằm trong thư mục của một hồ sơ nghiệm thu khác, nên nếu hồ sơ kia bị đổi tên hay dọn thì công cụ đo sẽ hỏng.
  Căn cứ: Người dùng cuối không thấy gì; chỉ làm công cụ nội bộ dễ gãy khi dọn kho về sau và gãy thì báo lỗi rõ ngay, nên ghi lại rồi sửa khi dọn hồ sơ cũ.
  file: `pipeline/scripts/do-nhom-hai-lan.mjs`
  severity: low
  Đề xuất: known-limits

- **docThiTruongNhom lấy thị trường từ dòng đã retired, lệnh xoá khai báo sau dọn sổ không có tác dụng và không báo gì (r1 · tệp đã đổi)**
  Người dùng thấy gì: Sau khi dọn sổ, nếu quản trị viên xoá thị trường đã khai cho một nhóm thì các bài của nhóm vẫn bị gắn vào thị trường cũ mà không có cảnh báo nào.
  Căn cứ: Gây gắn sai thị trường âm thầm cho các bài của nhóm đó, nhưng chỉ khi có người xoá khai báo sau khi đã dọn sổ (chưa chạy trên sổ thật), và sửa được bằng khai lại và chạy lại.
  file: `pipeline/transform-zalo.mjs`
  severity: medium
  Đề xuất: new-contract

- **Bộ quét khoá bỏ qua không báo các tệp có tên không phải ASCII vì git trả đường dẫn đã quote (r1)**
  Người dùng thấy gì: Phép quét rò rỉ có thể lặng lẽ bỏ qua tệp có tên tiếng Việt có dấu mà vẫn báo đã quét xong và xanh.
  Căn cứ: Hiện chưa có tệp nào trong dải quét bị ảnh hưởng nên chưa lộ gì; rủi ro chỉ xuất hiện nếu về sau có tệp tên có dấu, và có thể vá khi gặp.
  file: `_acceptance/nhom-dang-ky-hai-lan-s03/probes/_quet.mjs`
  severity: low
  Đề xuất: known-limits

- **Hình dạng 4 — Đối chứng dương giả: 'do: loi ten don vi' mồi bằng token kênh, không phải tên đơn vị, và TEN được phép rỗng (r1 · tệp đã đổi)**
  Người dùng thấy gì: Phần kiểm tra rằng tên đơn vị không lọt vào đầu ra chưa có bằng chứng nó thật sự bắt được tên, nên có thể báo xanh dù không quét gì.
  Căn cứ: Chỉ làm yếu một lớp kiểm rò rỉ nội bộ chứ không làm lộ dữ liệu, và token kênh vẫn được kiểm có đối chứng nên rủi ro thấp.
  file: `pipeline/scripts/do-nhom-hai-lan.mjs`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 3 — Assert chuỗi có mặt thay vì quan hệ: 'AC-5 in dung ma' không phân biệt mã đại diện với mã phụ (r1 · tệp đã đổi)**
  Người dùng thấy gì: Khi chạy thử trước khi ghi, bài kiểm chưa chặn được trường hợp in đảo mã giữ và mã phụ, hoặc in mã sang nhầm nhóm.
  Căn cứ: Chỉ ảnh hưởng chữ người xem lúc chạy thử, chưa đổi dữ liệu; lượt ghi thật có các kiểm khác theo sau nên mức hại thấp.
  file: `pipeline/scripts/don-nhom-hai-lan.itest.mjs`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 3 — Assert có mặt thay vì quan hệ: 'AC-8 co ba tep ban cu bo sot' vẫn xanh khi bỏ dải của PR #315 (r1)**
  Người dùng thấy gì: Phép quét rò rỉ có thể vẫn báo đủ ba tệp ngay cả khi lỡ bỏ phần thay đổi của lượt trước, nên độ phủ của nó chưa được chứng minh chặt.
  Căn cứ: Chỉ làm yếu một phép đo nội bộ; hiện kết quả vẫn đúng trên nhánh này nên chưa có dữ liệu nào lộ hay sai.
  file: `_acceptance/nhom-dang-ky-hai-lan-s03/probes/that-chi-doc.mjs`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 4 — Assertion âm tính một mình: bộ đếm `them` của soCong không có ca đỏ (r1 · tệp đã đổi)**
  Người dùng thấy gì: Phép đo «không có tin nào bị thêm vào cổng» chưa được thử bằng ca cố ý sai nên chưa chứng minh nó bắt được lỗi này.
  Căn cứ: Chiều tin rời cổng đã có đối chứng và số đo thật cho 0 tin thêm; thiếu đối chứng chỉ làm giảm độ tin cậy chứ không làm sai dữ liệu.
  file: `pipeline/scripts/do-nhom-hai-lan.mjs`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 5 — Lớp «trạng thái cũ» ba trường chỉ phủ hai: `resume_when` không bao giờ khác null trong fixture hoàn lại (r1 · tệp đã đổi)**
  Người dùng thấy gì: Khi hoàn lại việc dọn sổ, lịch hẹn tiếp tục của một đơn vị đang tạm dừng có thể không được trả về, và bài kiểm hiện chưa bắt được điều này.
  Căn cứ: Rất ít đơn vị tạm dừng có lịch hẹn, hoàn lại là thao tác hiếm, và nếu mất thì đặt lại tay được nên hậu quả nhẹ.
  file: `pipeline/scripts/don-nhom-hai-lan.itest.mjs`
  severity: low
  Đề xuất: known-limits

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).
