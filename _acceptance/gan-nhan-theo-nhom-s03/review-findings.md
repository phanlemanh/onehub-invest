# Review findings: gan-nhan-theo-nhom-s03 (round 3)

Review incomplete (finder chết): không có.

## Trong hợp đồng

- **Hình dạng 3 — assert có mặt trong khi lời hứa là quan hệ: «số bảng trường hợp không đổi» chỉ kiểm dòng nhóm tồn tại**
  file: `app/tests/labels-nhom.test.tsx:907`
  severity: high
  source: measurement
  AC: AC-14
  detail: AC-14 và E22 hứa Thử lại không làm tăng số trên bảng trường hợp, tức một quan hệ trước và sau. Dòng 907-908 chỉ có `const bang = ...find(U-A); assert.ok(bang)`: không lấy số trước khi Thử lại, không so giá trị nào. Fixture cũng không thể đo lời hứa này. Màn gửi chỉ `note` (dòng 898), `case_kind` là null, còn `bangTruongHop` chỉ đếm `c.case_kind IS NOT NULL` (labels-luot-hai.ts). Ghi trùng hai dòng thì bảng vẫn không đổi. Muốn đo được, ca phải chọn loại trường hợp rồi so `theoLoai` trước và sau.

- **Hình dạng 2 — fixture viết tay: «đổi nội dung ra dòng mới» dùng request_id tự đặt, không lấy từ màn sinh khoá**
  file: `app/tests/labels-nhom.test.tsx:914`
  severity: high
  source: measurement
  AC: AC-14
  detail: E22 hứa «đổi nội dung ra dòng mới» xanh trên màn thật trong jsdom và route thật; AC-14 cũng hứa điều này. Bên sinh khoá là `doi()`/`setKhoa(moiKhoa())` trong luot-hai.tsx. Dòng 914-915 lại gọi thẳng route với `request_id: "k2"` viết tay và không gõ đổi nội dung trên màn. Phần màn của ca (dòng 897-905) chỉ đi một đường: gõ, Ghi, Thử lại. Nếu bỏ `setKhoa(moiKhoa())` khỏi `doi`, người dùng đổi nội dung sẽ bị ON CONFLICT DO NOTHING nuốt mất dòng mà vẫn nhận thành công, trong khi ca này vẫn xanh.

- **Hình dạng 2 — fixture viết tay: câu trả lời thẻ nhóm chỉ đo bằng thân gửi tay, không có phép đo nào đi từ ô chọn trên màn**
  file: `app/tests/labels-nhom.test.tsx:459`
  severity: medium
  source: measurement
  AC: AC-6
  detail: Ca «tra loi the» (dòng 459), ca bí danh (dòng 448) và round-trip.mjs đều gửi `group_card_verdict` viết tay vào route. Giá trị thật do hằng `THE_OPTIONS` viết riêng trong luot-hai.tsx phát ra, tách khỏi `GROUP_CARD_VERDICTS` mà route đọc. Không test nào đụng `th-the` hoặc `th-kind`: các ca jsdom chỉ gõ `th-note` (dòng 800, 815, 898). Các bước E8 cũng chỉ chụp ảnh, không gửi câu trả lời thẻ. Đổi `correct` thành `dung` trong `THE_OPTIONS` thì mọi phép đo vẫn xanh, còn người dùng nhận 400.

- **Hình dạng 2 — fixture viết tay: giá trị biểu mẫu 17 trường bị thay bằng DU trước khi tới route**
  file: `app/tests/labels-nhom.test.tsx:756`
  severity: medium
  source: measurement
  AC: AC-3
  detail: Ca jsdom duy nhất render `LabelFormNhom` đè thân gửi bằng `values: DU` (dòng 756, comment dòng 752 thừa nhận không đo khâu điền). Mọi ca route và round-trip.mjs cũng dùng `DU` viết tay theo đúng khuôn `chuanHoaLuot` đọc. Vì vậy đoạn `luu()` dựng `values` (bỏ basis khi noBasis, gắn unit cho giá, not_stated) không được phép đo tự động nào đưa vào route. Chuỗi E18 ghi «không chèn tay» nhưng bắt đầu từ route, không từ biểu mẫu. Đường này chỉ còn được đi qua ở ui-check E4, E8.

- **Hình dạng 3 — lời hứa quan hệ không được dựng: ca AC-12 «không suy ra được mà máy có giá trị» dùng nhãn có giá trị**
  file: `app/tests/labels-nhom.test.tsx:860`
  severity: medium
  source: measurement
  AC: AC-12
  detail: Tên ca, comment dòng 860 và E20 đều nói người gắn chọn Không suy ra được còn máy có giá trị thì tô. Nhưng nhãn đến từ `nguoiDaLuu(1)`, tức `DU` có `building: chu("S5.03")`, nên `toi` là `s5.03` chứ không phải not_stated. `toaTo: true` (dòng 873) chỉ đo hai giá trị khác nhau. Nhánh `toi = null` không được dựng trong ca này. Nó chỉ được bắt gián tiếp qua số `3 trường khác máy` ở ca AC-5 (dòng 740), và ca đó không assert Badge trên ô building.

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **Chữ tự do và request_id từ client không có trần độ dài, request_id quá dài làm route trả 500 thay vì 400**
  Người dùng thấy gì: Nếu ai đó dán một đoạn chữ rất dài vào ô ghi chú hoặc gửi mã yêu cầu quá dài, máy báo lỗi chung chung thay vì báo gọn là nhập sai. Người gắn nhãn thông thường không gặp tình huống này.
  Căn cứ: Chỉ xảy ra khi nhập chữ quá dài bất thường, không mất nhãn đã lưu, người dùng gỡ được bằng cách rút ngắn chữ và gửi lại.
  file: `app/src/lib/labels-luot-hai.ts`
  severity: medium
  Đề xuất: known-limits

- **Mã enum mới lưu trong DB vẫn là tiếng Việt, migration 073 chỉ sửa một trong ba enum**
  Người dùng thấy gì: Một số mã lưu trong cơ sở dữ liệu cho loại trường hợp và căn cứ vẫn viết bằng tiếng Việt, không thống nhất với quy ước đặt tên. Người gắn nhãn không thấy khác biệt gì trên màn hình.
  Căn cứ: Không ảnh hưởng người dùng; chỉ gây lộn xộn khi đọc dữ liệu, nhưng càng để lâu sau khi có nhãn thật thì sửa càng tốn.
  file: `db/migrations/073_labels_nhom_sua.sql`
  severity: medium
  Đề xuất: known-limits

- **CONTEXT.md chưa có thuật ngữ cho các nhãn UI mới, định nghĩa «Gắn nhãn» còn nói chín trường, «Trục» lệch nhãn chuẩn**
  Người dùng thấy gì: Một vài nhãn trên màn gắn nhãn chưa có trong bảng thuật ngữ chung, và định nghĩa «Gắn nhãn» vẫn nói chín trường trong khi nay là mười bảy. Người gắn nhãn vẫn dùng được màn bình thường, chỉ tài liệu lệch.
  Căn cứ: Chỉ là tài liệu, không làm sai dữ liệu hay màn hình, và sửa chữ trong tệp rất rẻ bất cứ lúc nào.
  file: `CONTEXT.md`
  severity: low
  Đề xuất: known-limits

- **Chú thích gcn_gate chép nhầm mã hồ sơ man-gan-nhan-mu E11**
  Người dùng thấy gì: Một dòng chú thích trong cấu hình nghiệm thu ghi nhầm tên hồ sơ, có thể làm người tra cứu đi nhầm hướng. Người dùng cuối không thấy gì.
  Căn cứ: Hậu quả gần bằng không, chỉ là chữ chú thích; không đáng mở việc riêng.
  file: `_acceptance/config.yaml`
  severity: low
  Đề xuất: wont-fix

- **Mẫu theo nhóm tách một nhóm Zalo thật thành hai tầng vì so khớp group_key nguyên văn**
  Người dùng thấy gì: Ba nhóm Zalo thật bị đăng ký hai lần trong sổ nguồn, nên khi lấy mẫu mỗi nhóm đó bị tính thành hai nhóm: số bài vượt hạn mức, tiến độ và bảng trường hợp bị chia đôi mà không có cảnh báo.
  Căn cứ: Làm lệch số liệu và hạn mức của một số nhóm thật, người gắn nhãn khó tự phát hiện, nhưng chưa mất dữ liệu và sửa được trước khi gắn nhãn thật quy mô lớn.
  file: `pipeline/label-sample.mjs`
  severity: medium
  Đề xuất: new-contract

- **Ô Nhiều căn để trống báo chọn «Không suy ra được», nhưng hàng này không có ô đó**
  Người dùng thấy gì: Khi để trống ô Nhiều căn rồi bấm Lưu, máy bảo chọn «Không suy ra được» nhưng ô đó không có và máy cũng không nhận. Người gắn nhãn bị chỉ sai hướng một lúc rồi tự chọn Không hoặc Có.
  Căn cứ: Chỉ gây bối rối nhẹ, không mất dữ liệu, người dùng tự sửa ngay bằng cách chọn Không hoặc Có.
  file: `app/src/lib/labels-normalize.ts`
  severity: low
  Đề xuất: known-limits

- **Hình dạng 5 — tuyên quét lớp nhưng danh sách điểm: E16 khai `labels/**` mà gcn_gate chỉ chạy 10 tệp**
  Người dùng thấy gì: Phép kiểm giao diện chỉ quét mười tệp màn, bỏ sót ba tệp cũng thuộc màn gắn nhãn, nên lỗi trình bày ở ba tệp đó có thể lọt qua không bị báo.
  Căn cứ: Chỉ làm kiểm tra giao diện bớt chặt, không làm sai dữ liệu; lỗi trình bày nếu có người dùng vẫn thấy và báo được.
  file: `_acceptance/config.yaml`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 5 — ma trận tự đánh dấu: phần tử «tin vừa có người gắn» được tick mà không có assert**
  Người dùng thấy gì: Bảng kiểm các trạng thái màn hình đánh dấu sẵn một trạng thái là đã đo dù chính chỗ đó không kiểm gì. Nếu ca đo riêng bị xoá, bảng vẫn báo đủ.
  Căn cứ: Chỉ làm bảng kiểm tự tin hơn thực tế, trạng thái đó hiện vẫn có ca đo riêng; người dùng không bị ảnh hưởng.
  file: `app/tests/labels-nhom.test.tsx`
  severity: low
  Đề xuất: known-limits

- **Hình dạng 4 — âm tính một mình: phép quét tĩnh «tep luot mot khong doc bang may» không có chiều đỏ của chính nó**
  Người dùng thấy gì: Phép kiểm tự động bảo đảm lượt gắn đầu không đọc bảng của máy chưa từng được thử cho ra kết quả đỏ, nên chưa chắc nó bắt được lỗi nếu có người lỡ viết sai.
  Căn cứ: Chỉ giảm độ tin cậy của một lớp kiểm; việc không lộ giá trị máy ở lượt đầu vẫn được đo bằng đường khác.
  file: `_acceptance/gan-nhan-theo-nhom-s03/probes/mu.mjs`
  severity: low
  Đề xuất: known-limits

- **Hình dạng 4 — đối chứng đỏ không đo đúng assert: E22 hứa bỏ ON CONFLICT thì ca đỏ, nhưng đột biến là bỏ khoá và không chạy qua ca**
  Người dùng thấy gì: Thử nghiệm cố ý phá cơ chế chống ghi trùng khi Thử lại chưa đi qua đúng ca kiểm trên màn, nên chưa chứng minh được ca đó thật sự bắt lỗi ghi trùng.
  Căn cứ: Chỉ làm bằng chứng yếu hơn mô tả; cơ chế chống trùng vẫn có assert riêng nên rủi ro cho người dùng thấp.
  file: `app/tests/labels-nhom.test.tsx`
  severity: low
  Đề xuất: known-limits

- **Hình dạng 3 — dòng bằng chứng có mặt vô điều kiện: 'ok truong moi 8' là kiem(loi, true, ...)**
  Người dùng thấy gì: Một dòng xác nhận trong kết quả kiểm tra luôn hiện ra dù không đo gì. Người đọc bằng chứng có thể tưởng nó là một phép đo riêng.
  Căn cứ: Việc tám trường mới được nhận vẫn được kiểm bằng cách khác, nên chỉ là dòng chữ gây hiểu nhầm nhẹ và sửa không mang lại gì cho người dùng.
  file: `_acceptance/gan-nhan-theo-nhom-s03/probes/migration.mjs`
  severity: low
  Đề xuất: wont-fix

⚠ Cụm ngoài vùng phủ: 2/16 lỗi rơi vào file không bộ đo nào phủ (_acceptance/config.yaml) — dừng và quyết: mở rộng hợp đồng hay rút phạm vi.
