# Review findings: ghep-anh-tren-the-gan-nhan (round 6)

## Trong hợp đồng

- **Hình dạng 4 (assertion không có đối chứng dương): phép so chữ của nhánh ghep null luôn xanh**
  AC: AC-3
  file: `app/tests/labels-ghep.test.ts:84`
  severity: medium
  source: measurement
  detail: Dòng 84 so `chuKhongLink("Bán căn", danhSachAnhCum([r]))` với `chuKhongLink("Bán căn", khongGhep)`. Chuỗi vào không có link, nên `chuKhongLink` (app/src/lib/labels-anh.ts) đi nhánh `if (!co) return { chu: goc, soLinkKhac: 0 }` và không dùng danh sách ảnh. Hai vế vì thế luôn là `{chu: "Bán căn", soLinkKhac: 0}`, danh sách ảnh sai đến đâu assert cũng không đỏ. Đối chứng ở dòng 86 chỉ áp cho danh sách ảnh, không áp cho chữ, trong khi E3 hứa «danh sách ảnh và chữ bằng hàm không ghép từng trường». Ca này cũng không gọi `docThe` với g null, là nhánh thật mà `tinKe` và `doiChieu` đi qua. Các phép đo khác của hồ sơ không bù được nhánh bỏ link: dòng T5 trong MA_TRAN không có link; hai bài so với mốc ở E4, E7 (`t4`, `t6` trong probes/nap.mjs dòng 95, 97) cũng không có link. Đối chứng dòng 200 của nap.mjs chỉ buộc có chữ và có ảnh. Nếu `docThe` truyền sai danh sách ảnh cho `chuKhongLink` ở bài `ghep` null, `soLinkKhac` và chữ sẽ lệch khỏi bản trước mà các phép đo này vẫn xanh.
  rationale: AC-3 đòi 'ghep NULL thì giống hệt bản trước', mà phép so chữ trong test này luôn xanh nên không chứng minh được điều đó cho phần chữ.

- **Hình dạng 5 (lớp chỉ đo bằng điểm-case): AC-8 đo ba trong bốn chỗ lọc trung_voi, bỏ sót nhomCuaLat**
  AC: AC-8
  file: `_acceptance/ghep-anh-tren-the-gan-nhan/probes/nap.mjs:20`
  severity: medium
  source: measurement
  detail: AC-8 hứa cho cả lớp: dòng có `trung_voi` không hiện và không tính tiến độ. Vòng này thêm cùng một điều kiện `(ghep->>'trung_voi') IS NULL` vào bốn chỗ đọc: `tinKe`, `nhomCuaLat`, `tienDo` (app/src/lib/labels-queries.ts) và `bangTruongHop` (app/src/lib/labels-luot-hai.ts). E10 không có ma trận liệt kê các chỗ đọc này, chỉ có điểm-case cho ba chỗ: dòng 305 đo `tinKe`, dòng 292 và 308 đo `tienDo`, dòng 295 đo `bangTruongHop`. nap.mjs không import `nhomCuaLat` (dòng 20). `LabelsContent` có gọi nó ở dòng 206, nhưng kết quả chỉ được quét mồi, mã bài, link và chữ seed, không xét số đếm của nhóm. Trong app/tests/labels-nhom.test.tsx, `nhomCuaLat` chỉ chạy trên dữ liệu không có `trung_voi`; từ `ghep` ở đó chỉ là `ghep: null` trong props và tên tệp migration. Observed của E5 cũng chỉ ghi «Đã gắn hết nhóm này», câu này do `tin` null quyết định (labels-view.tsx dòng 180), không đọc `tong` hay `conChoToi`. Bỏ điều kiện lọc ở `nhomCuaLat` thì dòng trùng vẫn tính vào `tong` và `conChoToi` của nhóm, mà labels-content.tsx dòng 21 dùng `conChoToi` để chọn nhóm mặc định, nhưng không phép máy nào đỏ.
  rationale: AC-8 hứa dòng trùng cụm không hiện và không tính tiến độ khi gắn hết một nhóm; chỗ đếm của nhóm không có phép đo nào nên AC chưa được chứng minh đủ.

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **eval-classify vẫn chấm máy trên chữ của ref_id, trong khi nhãn vàng nay gắn theo chữ tin ghép**
  Người dùng thấy gì: Khi chấm độ đúng của máy đọc tin, với các bài chỉ có ảnh máy sẽ bị chấm trên đường dẫn ảnh thay vì chữ của tin ghép, nên điểm hiện ra thấp hơn thực tế mà không có cảnh báo.
  Căn cứ: Chưa có nhãn nào được gắn nên chưa có số sai nào được ghi, và điểm chấm chạy lại được sau khi sửa, nhưng nếu không quyết trước lần chấm đầu thì con số đầu tiên người ký nhìn thấy sẽ sai.
  file: `pipeline/lib/eval-classify.mjs`
  severity: high
  Đề xuất: new-contract

- **Cột và khoá JSON mới đặt tiếng Việt, trái quy ước tên cột tiếng Anh**
  Người dùng thấy gì: Tên dữ liệu mới của tính năng ghép ảnh đặt bằng tiếng Việt, khác quy ước tên tiếng Anh của dự án. Người dùng cuối không thấy gì, nhưng về sau đổi tên sẽ tốn thêm một lần chuyển dữ liệu.
  Căn cứ: Không ảnh hưởng người dùng hay mất dữ liệu, nhưng sửa càng muộn càng đắt vì sau khi ghi 191 dòng thật thì đổi tên phải chạy thêm một đợt chuyển đổi, nên cần quyết trước khi áp lên dữ liệu thật.
  file: `db/migrations/076_labels_ghep.sql`
  severity: medium
  Đề xuất: known-limits

- **label-sample bỏ kết quả ghepLat: thiếu cột vẫn báo thành công, lấy thêm thì dòng mới không có ghép hoặc dòng đã gắn bị ghi ghép**
  Người dùng thấy gì: Khi lấy thêm mẫu vào một lát đã có, bài ảnh mới có thể hiện như thẻ một ảnh không chữ, cùng một cụm có thể bị gắn hai lần, và có trường hợp dòng đã gắn nhãn bị đổi chữ hiển thị.
  Căn cứ: Chỉ xảy ra khi lấy thêm vào lát đang dùng và lát hiện tại chưa có nhãn nên chưa có dữ liệu bị lệch, nhưng một khi người gắn đã làm việc thì lỗi này làm lệch nhãn khó gỡ.
  file: `pipeline/label-sample.mjs`
  severity: medium
  Đề xuất: new-contract

- **CLI label-ghep không kiểm đầu vào như label-sample: cờ gõ sai bị bỏ qua và có thể ghi thật**
  Người dùng thấy gì: Người vận hành gõ nhầm cờ chạy thử có thể vô tình ghi thật vào dữ liệu, và gõ sai tên lát vẫn báo xong với 0 dòng.
  Căn cứ: Chỉ người vận hành có quyền chạy lệnh này gặp, lệnh có thể hoàn tác bằng lệnh lùi đã ghi trong hồ sơ, nhưng nếu ghi nhầm lên lát đã gắn nhãn thì hai người gắn có thể thấy cụm khác nhau.
  file: `pipeline/label-ghep.mjs`
  severity: medium
  Đề xuất: known-limits

- **label-ghep ghi từng dòng ngoài giao dịch; đứt giữa chừng thì lần sau báo giữ nguyên và exit 0**
  Người dùng thấy gì: Nếu lệnh ghép bị đứt giữa chừng khi chạy trên dữ liệu thật, lần chạy lại báo là đã xong dù phần còn lại chưa ghép, và người gắn sẽ thấy lẫn thẻ có ghép với thẻ không ghép.
  Căn cứ: Chỉ xảy ra khi lệnh bị đứt, lệnh lùi trong hồ sơ xoá sạch rồi chạy lại được, nên không mất dữ liệu gốc, nhưng sẽ khó nhận ra nếu không ai đối chiếu số dòng.
  file: `pipeline/label-ghep.mjs`
  severity: medium
  Đề xuất: known-limits

- **Route ghi nhãn không chặn dòng trung_voi: POST item_id của dòng trùng cụm vẫn được ghi**
  Người dùng thấy gì: Một tab gắn nhãn mở từ trước vẫn có thể lưu nhãn vào dòng đã bị ẩn vì trùng cụm, khiến một tin có hai bộ nhãn mà tiến độ không đếm bộ thứ hai.
  Căn cứ: Chỉ xảy ra khi tab cũ còn mở sau khi chạy lại lệnh ghép, nhưng nhãn thừa đi vào bộ chấm điểm mà tiến độ không thấy, nên khó phát hiện sau này.
  file: `app/src/lib/labels-queries.ts`
  severity: medium
  Đề xuất: new-contract

- **Hộp xem ảnh lớn không có Skeleton và lỗi kèm Thử lại, trái luật ReUI 5**
  Người dùng thấy gì: Khi người gắn mở xem lớn một ảnh hỏng, họ chỉ thấy biểu tượng ảnh vỡ, không có câu báo lỗi hay nút thử lại, dù dải ảnh bên ngoài có báo.
  Căn cứ: Không chặn việc gắn nhãn vì dải ảnh phía sau vẫn báo lỗi và đóng hộp là xem lại được, mất dữ liệu không có, nhưng người gắn có thể bối rối với một ảnh hỏng.
  file: `app/src/components/ops/labels/anh-bai.tsx`
  severity: low
  Đề xuất: known-limits

- **eval-classify chấm máy trên chữ của ref_id, trong khi nhãn người nay gắn theo chữ tin ghép**
  Người dùng thấy gì: Điểm đánh giá máy đọc tin sẽ thấp giả với khoảng 133 bài chỉ có ảnh, vì máy bị chấm trên đường dẫn ảnh thay cho chữ của tin ghép.
  Căn cứ: Chưa có nhãn nên chưa có số sai được ghi và chạy chấm lại được, nhưng nếu để nguyên thì con số đo chất lượng máy đầu tiên sẽ sai mà không ai được cảnh báo.
  file: `pipeline/lib/eval-classify.mjs`
  severity: high
  Đề xuất: new-contract

- **label-sample bỏ qua kết quả ghepLat: thiếu migration 076 vẫn báo lấy mẫu thành công**
  Người dùng thấy gì: Nếu chưa áp bản cập nhật cấu trúc dữ liệu, lệnh lấy mẫu vẫn báo thành công nhưng các bài ảnh không có thông tin ghép.
  Căn cứ: Chỉ xảy ra khi người vận hành quên áp bản cập nhật, không làm hỏng dữ liệu và chạy lại sau khi áp là đúng, nhưng thông báo thành công gây hiểu lầm.
  file: `pipeline/label-sample.mjs`
  severity: medium
  Đề xuất: known-limits

- **Lấy thêm vào lát cũ: dòng mới không có ghép, hoặc dòng đã có nhãn bị ghi ghép**
  Người dùng thấy gì: Lấy thêm mẫu vào lát đã có có thể làm bài ảnh mới hiện không chữ, hoặc làm đổi chữ hiển thị và ẩn mất dòng đã được gắn nhãn khỏi tiến độ.
  Căn cứ: Lát hiện tại chưa có nhãn nên chưa có dữ liệu lệch, nhưng một khi người gắn đã làm việc thì nhãn cũ có thể bị đặt cạnh chữ khác với chữ lúc họ gắn.
  file: `pipeline/label-sample.mjs`
  severity: medium
  Đề xuất: new-contract

- **label-ghep ghi từng dòng ngoài giao dịch: đứt giữa chừng thì lần sau báo giữ nguyên và exit 0**
  Người dùng thấy gì: Nếu lệnh ghép bị đứt giữa chừng, lần chạy lại báo đã xong dù một phần lát chưa được ghép, nên người gắn thấy lẫn thẻ ghép và không ghép và cụm có thể bị gắn trùng.
  Căn cứ: Chỉ xảy ra khi lệnh bị đứt và có lệnh lùi để làm lại, nhưng số in ra trông như đã đủ nên dễ bỏ sót nếu không đối chiếu.
  file: `pipeline/label-ghep.mjs`
  severity: medium
  Đề xuất: known-limits

- **CLI label-ghep bỏ qua cờ gõ sai: gõ nhầm --thu có thể thành ghi thật, lát không tồn tại vẫn exit 0**
  Người dùng thấy gì: Gõ nhầm cờ chạy thử vẫn có thể ghi thật vào dữ liệu, và gõ sai tên lát vẫn báo xong với 0 dòng như thể đã làm đúng.
  Căn cứ: Chỉ người vận hành gặp và ghi nhầm gỡ được bằng lệnh lùi, nhưng người chạy tưởng đang xem thử nên có thể ghi thật mà không biết.
  file: `pipeline/label-ghep.mjs`
  severity: medium
  Đề xuất: known-limits

- **Route ghi nhãn không chặn dòng trung_voi: tạo được nhãn thừa mà tiến độ và bảng số không đếm**
  Người dùng thấy gì: Có thể lưu được nhãn vào một dòng đã bị ẩn vì trùng cụm, và cột Trường hợp trong bảng số vẫn đếm dòng ẩn trong khi cột Đã gắn thì không, nên hai số không khớp nhau.
  Căn cứ: Chỉ xảy ra khi tab cũ còn mở hoặc gọi tay, nhưng nhãn thừa đi vào chấm điểm mà tiến độ không đếm nên khó phát hiện sau này và làm lệch báo cáo.
  file: `app/src/lib/labels-queries.ts`
  severity: medium
  Đề xuất: new-contract

- **danhSachAnhCum không khử trùng ảnh giữa dạng tệp và dạng URL, trái lời chú thích**
  Người dùng thấy gì: Nếu cùng một ảnh xuất hiện ở hai bài, một bài có tệp và một bài chỉ có đường dẫn, dải ảnh sẽ lặp một tấm và nhãn 'Ghép suy ra' đếm dư một ảnh.
  Căn cứ: Chỉ sai phần hiển thị, người gắn vẫn gắn đúng và không mất dữ liệu, chưa đo tần suất nên chưa đáng sửa.
  file: `app/src/lib/labels-anh.ts`
  severity: low
  Đề xuất: known-limits

- **Hộp xem ảnh lớn không xử lý ảnh lỗi: chuyển tới ảnh hỏng chỉ thấy biểu tượng vỡ**
  Người dùng thấy gì: Bấm qua một ảnh thiếu tệp trong hộp xem lớn chỉ thấy biểu tượng ảnh vỡ, tiêu đề vẫn ghi số ảnh như bình thường, không có câu báo lỗi hay nút thử lại.
  Căn cứ: Dải ảnh bên ngoài vẫn báo lỗi và đóng hộp là xem lại được, không mất dữ liệu, chỉ gây khó hiểu cho người gắn.
  file: `app/src/components/ops/labels/anh-bai.tsx`
  severity: low
  Đề xuất: known-limits

⚠ Cụm ngoài vùng phủ: 2/17 lỗi rơi vào file không bộ đo nào phủ (pipeline/lib/eval-classify.mjs) — dừng và quyết: mở rộng hợp đồng hay rút phạm vi.
