# Review findings: gan-nhan-theo-nhom-s03 (round 4)

## Trong hợp đồng

Không có.

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **Mã enum mới lưu trong DB vẫn là tiếng Việt: migration 073 chỉ đổi một trong ba enum**
  Người dùng thấy gì: Người gắn nhãn không thấy khác biệt nào: màn hình và dữ liệu vẫn đúng. Chỉ là một số mã lưu trong cơ sở dữ liệu còn bằng tiếng Việt, lệch quy ước đặt tên của dự án.
  Căn cứ: Không ảnh hưởng người dùng và chưa có nhãn thật nào lưu theo mã này; đổi sau khi có nhãn thật sẽ tốn thêm một bước chuyển dữ liệu nên ghi lại để quyết sớm.
  file: `db/migrations/073_labels_nhom_sua.sql`
  severity: medium
  Đề xuất: known-limits

- **`reason` và `note` không có trần độ dài, lệch khuôn 1.000 ký tự của route duyệt; `request_id` cũng không có trần**
  Người dùng thấy gì: Nếu ai đó dán một đoạn chữ cực dài vào ô Lý do hay Ghi chú, hệ thống có thể báo lỗi chung thay vì nhắc gọn gàng; người gắn nhãn chỉ gặp khi cố tình dán rất nhiều chữ.
  Căn cứ: Người dùng bình thường không chạm tới, không mất hay lộ dữ liệu, và gặp lỗi thì rút ngắn chữ rồi lưu lại được.
  file: `app/src/lib/labels-luot-hai.ts`
  severity: medium
  Đề xuất: known-limits

- **`docMa` nhận `1e30`, `0x10` làm mã tin, trong khi `?xem=` cùng màn dùng khuôn chặt**
  Người dùng thấy gì: Nếu tự gõ một mã tin kỳ lạ vào địa chỉ trang xem máy đọc, người dùng có thể nhận lỗi chung thay vì thông báo mã tin không hợp lệ.
  Căn cứ: Chỉ xảy ra khi tự sửa địa chỉ bằng tay, không làm mất hay ghi sai dữ liệu, và quay lại màn gắn nhãn là dùng tiếp được.
  file: `app/src/app/api/v1/ops/labels/[itemId]/review/route.ts`
  severity: low
  Đề xuất: known-limits

- **`chuanHoaLuot` ném TypeError khi `value` không phải chuỗi: POST /labels trả 500 thay vì 400 theo trường**
  Người dùng thấy gì: Chỉ chương trình tự dựng yêu cầu sai khuôn mới gặp lỗi chung thay vì thông báo đúng ô; người gắn nhãn dùng biểu mẫu trên màn hình không bao giờ gặp.
  Căn cứ: Lỗi xảy ra trước khi ghi nên không có dữ liệu sai nào được lưu, và người dùng biểu mẫu thật không chạm tới.
  file: `app/src/lib/labels-normalize.ts`
  severity: low
  Đề xuất: known-limits

- **CONTEXT.md chưa khớp nhãn mới: «Gắn nhãn» còn nói chín trường, «Trục» lệch «Trục căn», nhiều nhãn chưa có thuật ngữ**
  Người dùng thấy gì: Tài liệu từ vựng chung còn mô tả màn gắn nhãn là chín trường trong khi màn nay có mười bảy, và vài nhãn mới chưa có mục giải thích. Người dùng màn hình không thấy gì sai.
  Căn cứ: Chỉ làm người đọc tài liệu hiểu lệch, không ảnh hưởng thao tác hay dữ liệu, và sửa chữ trong tài liệu rất rẻ lúc nào cũng làm được.
  file: `CONTEXT.md`
  severity: low
  Đề xuất: known-limits

- **Kiểm «Chữ bài» nhận phần thập phân hai chữ số của giá làm diện tích, trục: khai sai căn cứ mà không báo lỗi**
  Người dùng thấy gì: Khi bài ghi giá như «4,35 tỷ», người gắn nhãn có thể khai diện tích hay trục là 35 với căn cứ «Chữ bài» mà hệ thống không chặn, nên một nhãn có căn cứ sai có thể được lưu.
  Căn cứ: Cần người gắn nhãn khai nhầm đúng như vậy, nhưng nhãn đã lưu không sửa được nên số sai nằm lại trong bộ đo; mức nhẹ vì hiếm và còn đường đối chiếu ở lượt hai.
  file: `app/src/lib/labels-normalize.ts`
  severity: low
  Đề xuất: known-limits

- **Hình dạng 5 — tuyên quét lớp nhưng không có ma trận viết trước: «chín loại» của E9 lặp theo CASE_KINDS nhập từ chính code đang kiểm**
  Người dùng thấy gì: Nếu sau này ai bỏ bớt một loại trường hợp khỏi danh sách chọn, bài kiểm tự động vẫn báo xanh nên có thể không ai hay biết.
  Căn cứ: Màn hình hiện tại đang đúng chín loại; rủi ro chỉ nằm ở lần sửa tương lai, và bổ sung kiểm tra là việc rẻ, làm lúc nào cũng được.
  file: `app/tests/labels-nhom.test.tsx`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 5 — tuyên ổn định thứ tự cho cả lớp nhưng chỉ có điểm-case: hai trong bốn danh sách của label-cases chỉ có một phần tử**
  Người dùng thấy gì: Danh sách trường hợp xuất ra có thể đổi thứ tự giữa hai lần chạy mà bài kiểm tự động không phát hiện, làm người viết quy ước thấy bản xuất lúc thế này lúc thế khác.
  Căn cứ: Chưa thấy lệch thật, chỉ là kiểm chưa đủ chặt; nếu xảy ra thì chạy lại xuất ra là xong, không mất dữ liệu.
  file: `pipeline/lib/label-cases.test.mjs`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 4 — âm tính một mình: «dong thuan cu khong doi» so bằng nhau mà không có đối chứng dương trên chín trường cũ**
  Người dùng thấy gì: Nếu chín trường nhãn cũ biến mất khỏi bảng đồng thuận, phép kiểm vẫn có thể báo là không đổi nên lỗi có thể không bị bắt.
  Căn cứ: Chỉ là rủi ro bỏ sót trong phép kiểm, không phải lỗi đang xảy ra với người dùng, và có thể gia cố sau mà không đụng tới dữ liệu.
  file: `_acceptance/gan-nhan-theo-nhom-s03/probes/do-cu.mjs`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 5 — ma trận viết trước không toàn phần: TRANG_THAI 7 phần tử trong khi AC-10 hứa đủ bảng 14 trạng thái, ST-labels-loading không được đo**
  Người dùng thấy gì: Màn khung chờ khi trang đang tải chưa được kiểm tự động, nên nếu bố cục khung chờ lệch so với màn thật thì sẽ không ai bị cảnh báo.
  Căn cứ: Khung chờ chỉ hiện thoáng qua rồi biến mất, người dùng tự khỏi bằng tải lại, và chưa thấy lỗi thật.
  file: `app/tests/labels-nhom.test.tsx`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 5 — tuyên quét lớp nhưng danh sách điểm: E16 khai labels/** mà gcn_gate chỉ chạy 10 tệp, bỏ ba tệp vòng này sửa**
  Người dùng thấy gì: Ba phần giao diện mới sửa không được máy kiểm lỗi thiết kế tự động, nên một lỗi trình bày ở đó có thể lọt qua mà không báo.
  Căn cứ: Là khoảng trống của công cụ kiểm, không phải lỗi đang hiện trước người dùng; bổ sung danh sách tệp là việc nhỏ làm sau.
  file: `_acceptance/config.yaml`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 3 — assert chuỗi có mặt thay vì đúng số: lệnh in «số nhóm thiếu» của AC-2 không được đo, «bỏ vì trùng» chỉ khớp một chữ số bất kỳ**
  Người dùng thấy gì: Lệnh lấy mẫu có thể in sai số bài bỏ vì trùng hoặc số nhóm thiếu mà phép kiểm vẫn báo đạt, làm người vận hành hiểu sai số bài thực sự lấy được.
  Căn cứ: Chỉ ảnh hưởng dòng báo tóm tắt, không đổi dữ liệu mẫu đã lấy, và người vận hành đối chiếu lại được bằng số đếm.
  file: `_acceptance/gan-nhan-theo-nhom-s03/probes/mau.mjs`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 3 — assert chuỗi có mặt trong khi lời hứa là quan hệ nhãn với ô: nhãn trường kiểm trên toàn HTML**
  Người dùng thấy gì: Nếu hai nhãn ô bị đổi chỗ cho nhau, phép kiểm tự động vẫn xanh và người gắn nhãn có thể điền nhầm ô.
  Căn cứ: Màn hiện đúng và đã có ảnh chụp kiểm bằng mắt; chỉ là nguy cơ ở lần sửa sau và người gắn thấy ngay nhãn lệch.
  file: `app/tests/labels-nhom.test.tsx`
  severity: low
  Đề xuất: known-limits

- **Hình dạng 2 — fixture viết tay đúng khuôn bên đọc: trạng thái nhóm hết và chờ người hai dùng prop tự dựng, không đi từ nhomCuaLat qua LabelsContent**
  Người dùng thấy gì: Câu báo số bài chờ người thứ hai khi đã gắn hết nhóm chưa được thử từ đầu đến cuối, nên một chỗ nối sai có thể làm câu này không hiện mà không ai biết.
  Căn cứ: Câu báo chỉ là thông tin phụ, không làm mất dữ liệu hay chặn người gắn, và các phần riêng lẻ đã được thử.
  file: `app/tests/labels-nhom.test.tsx`
  severity: low
  Đề xuất: known-limits

- **Hình dạng 5 — ma trận tự đánh dấu: phần tử «tin vừa có người gắn» được tick không qua assert**
  Người dùng thấy gì: Không có hậu quả trực tiếp cho người dùng: trạng thái tin vừa có người gắn vẫn được kiểm thật ở một ca khác.
  Căn cứ: Hiện không có lỗi nào lọt, chỉ là bảng độ phủ trông đầy hơn thực tế một chút.
  file: `app/tests/labels-nhom.test.tsx`
  severity: low
  Đề xuất: known-limits

- **Hình dạng 4 — âm tính một mình: phép quét tĩnh «tep luot mot khong doc bang may» không có chiều đỏ của chính nó**
  Người dùng thấy gì: Phép kiểm chặn việc màn lượt một đọc giá trị máy chưa từng được thử với một ca vi phạm cố ý, nên có thể không bắt được nếu có ai vô tình nối thêm đường đọc.
  Căn cứ: Vẫn còn phép kiểm đầu ra bắt được giá trị máy lộ ra, nên rủi ro lọt thấp.
  file: `_acceptance/gan-nhan-theo-nhom-s03/probes/mu.mjs`
  severity: low
  Đề xuất: known-limits

- **Hình dạng 4 — đối chứng dương chỉ có trên tên ca: «đối chứng ops cũng thấy cùng số» không có assert nào**
  Người dùng thấy gì: Chưa có phép kiểm nào xác nhận vai ops thấy cùng số liệu bảng trường hợp với vai khác, dù hiện tại số vẫn đúng.
  Căn cứ: Không có lỗi thật nào được chỉ ra và chỉ là khoảng trống trong kiểm tra, không ảnh hưởng dữ liệu.
  file: `app/tests/labels-nhom.test.tsx`
  severity: low
  Đề xuất: known-limits

- **Hình dạng 3 — dòng bằng chứng có mặt vô điều kiện: «ok truong moi 8» là kiem(loi, true, ...)**
  Người dùng thấy gì: Một dòng báo «đạt» trong biên bản kiểm không tự đo gì, nhưng việc tám trường mới được nhận vẫn được kiểm thật ở bước khác nên không ảnh hưởng người dùng.
  Căn cứ: Không phải lỗ hổng phủ kiểm, sửa chỉ làm biên bản gọn hơn nên chấp nhận và ghi vết là đủ.
  file: `_acceptance/gan-nhan-theo-nhom-s03/probes/migration.mjs`
  severity: low
  Đề xuất: wont-fix

- **Hình dạng 5 — tuyên quét lớp chữ hiển thị nhưng danh sách đóng bỏ nguồn nhãn mới: labels-normalize.ts và labels-luot-hai.ts không được quét**
  Người dùng thấy gì: Một từ bị cấm hoặc chữ tiếng Anh lẫn vào nhãn ô hay câu báo lỗi lượt hai có thể không bị máy quét chữ phát hiện, nên người gắn nhãn có thể thấy chữ sai chuẩn.
  Căn cứ: Chỉ là chữ hiển thị lệch chuẩn nếu có xảy ra, không mất dữ liệu, và sửa chữ hay thêm tệp vào danh sách quét là việc rẻ.
  file: `app/tests/ops-nhan/visible-strings.ts`
  severity: low
  Đề xuất: known-limits

- **Chú thích gcn_gate chép nhầm mã hồ sơ man-gan-nhan-mu E11 (r3)**
  Người dùng thấy gì: Một dòng chú thích trong cấu hình nghiệm thu ghi nhầm tên hồ sơ, có thể làm người tra cứu đi nhầm hướng. Người dùng cuối không thấy gì.
  Căn cứ: Hậu quả gần bằng không, chỉ là chữ chú thích; không đáng mở việc riêng.
  file: `_acceptance/config.yaml`
  severity: low
  Đề xuất: wont-fix

- **Mẫu theo nhóm tách một nhóm S03 thật thành hai tầng vì so khớp group_key nguyên văn (r3)**
  Người dùng thấy gì: Ba nhóm S03 thật bị đăng ký hai lần trong sổ nguồn, nên khi lấy mẫu mỗi nhóm đó bị tính thành hai nhóm: số bài vượt hạn mức, tiến độ và bảng trường hợp bị chia đôi mà không có cảnh báo.
  Căn cứ: Làm lệch số liệu và hạn mức của một số nhóm thật, người gắn nhãn khó tự phát hiện, nhưng chưa mất dữ liệu và sửa được trước khi gắn nhãn thật quy mô lớn.
  file: `pipeline/label-sample.mjs`
  severity: medium
  Đề xuất: new-contract

- **Ô Nhiều căn để trống báo chọn «Không suy ra được», nhưng hàng này không có ô đó (r3)**
  Người dùng thấy gì: Khi để trống ô Nhiều căn rồi bấm Lưu, máy bảo chọn «Không suy ra được» nhưng ô đó không có và máy cũng không nhận. Người gắn nhãn bị chỉ sai hướng một lúc rồi tự chọn Không hoặc Có.
  Căn cứ: Chỉ gây bối rối nhẹ, không mất dữ liệu, người dùng tự sửa ngay bằng cách chọn Không hoặc Có.
  file: `app/src/lib/labels-normalize.ts`
  severity: low
  Đề xuất: known-limits

⚠ Cụm ngoài vùng phủ: 3/19 lỗi rơi vào file không bộ đo nào phủ (pipeline/lib/label-cases.test.mjs, _acceptance/config.yaml, app/tests/ops-nhan/visible-strings.ts) — dừng và quyết: mở rộng hợp đồng hay rút phạm vi.
