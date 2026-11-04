# Review findings: gan-nhan-theo-nhom-s03 (round 2)

## Trong hợp đồng

- **Hình dạng 4 (âm-tính-một-mình): chuỗi đánh dấu silver_labels nằm ở cột quote mà không đường đọc nào chạm tới, không có đối chứng dương**
  AC: AC-5
  file: `_acceptance/gan-nhan-theo-nhom-s03/probes/mu.mjs:80`
  severity: medium
  source: measurement
  detail: Vòng 2 thêm `AI-TRICH-DAU` vào MAY (dòng 36) và ghi nó vào cột `quote` của silver_labels (dòng 80). `doiChieu` chỉ `SELECT listing_intent, kind FROM silver_labels`; grep `quote` trong labels-luot-hai.ts, labels-queries.ts, components/ops/labels và route nhãn không có kết quả. Không assert dương nào cho thấy `AI-TRICH-DAU` từng xuất hiện ở kênh nào, nên assert 'chua luu khong co gia tri may' (dòng 89) và 'nguoi B 0 chuoi' (dòng 114) gần như không thể đỏ vì chuỗi này. Giá trị silver thật của fixture là `inquiry` và `rent_lt`: dòng 105 cho thấy chúng ra cột AI thành «Yêu cầu», «Cho thuê», nhưng cả hai dạng thô lẫn dạng hiển thị đều không có trong MAY. Một đường lượt một đọc đúng hai cột này rồi trả qua prop tên khác `aiDoc` (ví dụ `goiY: 'rent_lt'`) vẫn xanh ở phép quét động. E7 hứa giá trị máy dùng chuỗi đánh dấu riêng, nhưng với silver_labels chuỗi đó không đại diện cho giá trị đang được đọc. Với bảng này chỉ còn phép quét tĩnh tên bảng trên hai tệp.
  rationale: AC-5 hứa HTML, RSC và API không chứa giá trị máy ở silver_labels, mà phép đo cho silver_labels không có đối chứng dương nên không chứng minh được lời hứa đó.

- **Hình dạng 4 (âm-tính-một-mình): phản hồi API của người thứ hai chỉ quét phủ định, không kiểm status hay nội dung dương**
  AC: AC-5
  file: `app/tests/labels-nhom.test.tsx:453`
  severity: medium
  source: measurement
  detail: labels-nhom.test.tsx dòng 453-454: `cuaB = await (await goi(b.cookie)).text()` rồi chỉ assert `!cuaB.includes('LYDO-A-CHU') && !...includes('lydo-a-dau')`. Không kiểm status 200 và không kiểm có dữ liệu của B. Route trả 403, 500 hoặc thân rỗng thì ca 'người hai không thấy nhãn người trước' vẫn xanh. mu.mjs lặp lại đúng hình dạng này. Dòng 118-119: `apiB2` lấy `.text()` không kiểm status; đối chứng dương `mB2.html.includes('toamaydoan')` chỉ thuộc kênh HTML, không thuộc API. Dòng 57 và 113-114: `getNhan` không trả status, còn dương tính chỉ là `mB.html.includes('CHUGOC-GCN')`, nên `apiB` lỗi vẫn được tính là '0 chuoi tren API'.
  rationale: AC-5 hứa người thứ hai của bài gắn trùng không thấy nhãn, lý do hay ghi chú của người trước, nhưng ca đo vẫn xanh khi API trả lỗi hoặc rỗng.

- **Hình dạng 4 (âm-tính-một-mình): kênh «RSC» trong phép mù không có assert dương nào**
  AC: AC-5
  file: `_acceptance/gan-nhan-theo-nhom-s03/probes/mu.mjs:89`
  severity: medium
  source: measurement
  detail: `rsc` do `cay(el)` tạo (dòng 52) và chỉ được dùng trong phép phủ định `khongCo(...)` ở dòng 89, 114, 119, 123. Mọi đối chứng dương đều nhắm kênh khác: `m0.html` và `api0` có CHUGOC-GCN (dòng 88), `m1.html` có giá trị máy (dòng 105-108), `mB.html`, `mB2.html`, `mV.html`. Không có assert kiểu `m0.rsc.includes('CHUGOC-GCN')` hay `m1.rsc.includes('9876000000')`. Vì vậy nếu `cay` trả chuỗi không mang prop (ví dụ `LabelsContent` đổi cách bọc phần tử, hoặc replacer lọc mất nhánh dữ liệu), 'chua luu khong co gia tri may' và 'viewer 0 chuoi tren HTML RSC' vẫn in ok cho phần RSC. Lời hứa AC-5 về «dữ liệu RSC» phụ thuộc hoàn toàn vào kênh này. Comment đầu tệp nói bản chạy thật do E8 chấm, nhưng các bước E8 chỉ chụp màn hình, không quét payload.
  rationale: AC-5 nêu rõ dữ liệu RSC không chứa giá trị máy, mà kênh RSC trong phép đo không có assert dương nào để chứng minh phép quét thấy được dữ liệu.

- **Hình dạng 1 (đo mã nguồn thay vì đầu ra): chiều đỏ --do của E7 chỉ chạy regex trên chuỗi vừa thay, không chạy trên fixture**
  AC: AC-5
  file: `_acceptance/gan-nhan-theo-nhom-s03/probes/mu.mjs:19`
  severity: medium
  source: measurement
  detail: Dòng 19-24: `goc.replace(..., 'JOIN sale_offers s ...')` rồi `quet(dot)`, với `quet` là regex tên bảng ở dòng 15-17. Nhánh này thoát trước khi nối DB. Bản sao tinKe không được nạp hay chạy, và phép quét HTML, RSC, API không được chạy trên nó. Việc `quet` khớp từ `sale_offers` vừa chèn là tất yếu, nên chiều đỏ không thể chứng minh phép đo bắt được rò rỉ. E7 ghi 'Chiều đỏ cùng fixture: bản sao tinKe thêm JOIN sale_offers thì thoát 1', trong khi thực tế không dùng fixture. Vòng 1 đã có finding cùng hình dạng cho migration.mjs (sửa bằng cách nạp module bản sao), còn mu.mjs vẫn giữ cách cũ. Phép dương ở dòng 128 cũng chỉ grep chữ trực tiếp của hai tệp `TEP_LUOT_MOT`, không đi theo import.
  rationale: Chiều đỏ của phép mù là bằng chứng rằng phép đo AC-5 bắt được rò rỉ, nhưng hiện chỉ khớp regex chứ không chạy trên fixture nên không chứng minh được.

- **Hình dạng 1 (đo mã nguồn thay vì đầu ra): trạng thái «lỗi» của vùng dữ liệu được chấm bằng cách grep chữ trong tệp nguồn**
  AC: AC-10
  file: `app/tests/labels-nhom.test.tsx:574`
  severity: medium
  source: measurement
  detail: Dòng 574-576: `assert.match(readFileSync('src/components/states/region-error.tsx'), /Thử lại/)` và `assert.match(readFileSync('src/app/ops/labels/page.tsx'), /<RegionError what="tin để gắn nhãn">/)`, rồi `da.add('lỗi')`. E14 hứa 'render trạng thái ... lỗi ... đúng câu', và AC-10 có Given 'DB lỗi' với Then 'lỗi có «Thử lại»'. Không có ca nào cho `LabelsContent` ném lỗi truy vấn rồi quan sát đầu ra. Chữ `Thử lại` có thể nằm trong comment hay nhánh không render, và `RegionError` có thể không bắt được lỗi từ con, thì phép đo vẫn xanh. Hai ca render `LoiTruongHop` và `LuuLoiAlert` (dòng 570-573) không thuộc đường lỗi của vùng dữ liệu này.
  rationale: AC-10 có Given DB lỗi, Then lỗi có «Thử lại», mà ca đo chỉ grep chữ trong tệp nguồn thay vì dựng lỗi và quan sát đầu ra.

- **Hình dạng 1 (đo hàm phụ thay vì đầu ra): «tin vừa có người gắn» chỉ so chuỗi do cauTinKe ghép, không chạm biểu mẫu**
  AC: AC-10
  file: `app/tests/labels-nhom.test.tsx:586`
  severity: medium
  source: measurement
  detail: Dòng 584-586 chỉ kiểm `guiNhan` trả `da-co-nguoi` và `cauTinKe(kq.error)` bằng câu mong đợi. Sau đó `da.add('tin vừa có người gắn')` đánh dấu đã phủ trạng thái trong bảng E14. Câu chỉ tới người dùng qua nhánh `toast.info(cauTinKe(kq.error)); window.location.assign(hrefTinKe)` trong label-form-nhom.tsx. Grep các tệp test cho thấy `LabelFormNhom` không được gọi trực tiếp, và `hrefTinKe` của biểu mẫu không có assert nào; các bước UI của E4, E8 cũng không có kịch bản này. Xoá toast hoặc xoá lệnh chuyển trang thì ca vẫn xanh, trong khi AC-10 hứa 'tin vừa có người gắn chuyển tin kế'. Phần «chuyển tin kế» hiện chỉ là hậu tố chuỗi trong hàm phụ, không phải hành vi được quan sát.
  rationale: AC-10 hứa tin vừa có người gắn chuyển tin kế, nhưng ca đo chỉ so chuỗi hàm phụ ghép, không quan sát hành vi của biểu mẫu.

- **Hình dạng 4 (âm-tính-một-mình): ca 'bo qua' đo một POST mà nút Bỏ qua không gửi, và 'sang tin kế' không phụ thuộc hành động bỏ qua**
  AC: AC-6
  file: `app/tests/labels-nhom.test.tsx:387`
  severity: medium
  source: measurement
  detail: Dòng 387-390: `POST {}` trả 400, đếm `eval_label_cases` bằng 0, rồi `tinKe(...) === 2`. Trong luot-hai.tsx, nút «Bỏ qua» gọi `sangTinKe()` tức `window.location.assign(hrefTinKe)` và không gọi route; comment của `ghiTruongHop` cũng ghi 'Bỏ qua là không gọi hàm này'. Số 0 dòng vì vậy chỉ chứng minh route từ chối thân rỗng, không liên quan đến đường bỏ qua. `tinKe` trả 2 chỉ vì bài 1 đã có nhãn từ `nguoiDaLuu(1)`, nên kết quả đó đúng dù có bỏ qua hay không. E9 hứa 'bo qua không thêm dòng, sang tin kế' nhưng không có đối chứng dương nào trên hành vi thật: `hrefTinKe` của lượt hai và thao tác nút không được kiểm. Nút Bỏ qua gửi POST hay không chuyển trang thì ca vẫn xanh.
  rationale: AC-6 nêu cả hành động bỏ qua; ca đo gọi một POST mà nút Bỏ qua không gửi nên không chứng minh được hành vi bỏ qua thật.

- **Hình dạng 1 (đo mã nguồn thay vì đầu ra): nhánh push-ops-facts của 'khong tren duong day' vẫn là grep chữ một tệp, không có chiều đỏ**
  AC: AC-1
  file: `_acceptance/gan-nhan-theo-nhom-s03/probes/migration.mjs:71`
  severity: low
  source: measurement
  detail: Vòng 2 đã chuyển sync-cloud sang đọc giá trị FILL và CLOUD_ALLOW, nhưng dòng 71 vẫn là `!/eval_label/.test(readFileSync('pipeline/push-ops-facts.mjs'))`. Tệp này nạp dữ liệu từ các module có SQL riêng, ví dụ `readReviewQueue`, `readRecords24h` ở scripts/lib/ops-local.mjs, `readAiCalls` ở pipeline/lib/ai-calls.mjs, nên một câu đọc bảng nhãn thêm vào module được import sẽ không bị phép grep bắt. Tên bảng ghép động cũng lọt. Đối chứng ở dòng 79-92 chỉ đột biến sync-cloud; dòng 71 luôn đọc tệp thật ở ROOT, nên nhánh push-ops-facts chưa từng được chứng minh có thể đỏ. AC-1 hứa về đường đẩy lên cloud, nhưng ở nhánh này phép đo chỉ nhìn chữ của một tệp.
  rationale: AC-1 hứa không bảng nhãn nào nằm trong đường đẩy lên cloud, mà nhánh push-ops-facts chỉ grep chữ một tệp và chưa từng được chứng minh có thể đỏ.

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **Ảnh chứng mới để lộ tên miền thật của S03 và SĐT người bán chưa che, sắp lên kho công khai**
  Người dùng thấy gì: Ảnh chụp màn hình dùng làm bằng chứng đang hiện tên miền thật của nguồn S03 và số điện thoại người bán. Nếu đẩy nhánh lên kho công khai, tên nguồn thật sẽ lộ ra ngoài.
  Căn cứ: Tên nguồn thật là thông tin không được rời máy, và kho đã công khai nên đã đẩy lên là khó rút lại; hiện nhánh chưa đẩy nên chụp lại bằng bài mồi trước khi đẩy là rẻ và dứt điểm.
  file: `_acceptance/gan-nhan-theo-nhom-s03/evidence/E4-step1.png`
  severity: high
  Đề xuất: new-contract

- **coTrongChu từ chối giá trị có thật trong chữ bài khi số đứng sau dấu chấm hoặc phẩy, làm sai căn cứ của nhãn**
  Người dùng thấy gì: Khi bài ghi trục hoặc diện tích dạng «12,15» hay «59,64,70m2», hệ thống báo chữ bài không có giá trị đó dù có. Người gắn phải đổi sang căn cứ khác và viết lý do, nên căn cứ ghi vào nhãn bị sai.
  Căn cứ: Hậu quả là nhãn bị ghi căn cứ lệch ở một số bài có số dạng này, nhưng người gắn vẫn lưu được và không mất dữ liệu; chưa đo được tần suất nên ghi giới hạn đã biết rồi sửa sau khi có số.
  file: `app/src/lib/labels-normalize.ts`
  severity: medium
  Đề xuất: known-limits

- **Lệnh lấy mẫu theo nhóm im lặng bỏ qua tham số mới trên lát đã có dòng, vẫn in số của mẫu không được ghi**
  Người dùng thấy gì: Nếu chạy lại lệnh lấy mẫu với cỡ mẫu khác trên lát đã có bài, lệnh vẫn in là đã chọn đủ số mới trong khi dữ liệu không đổi. Người chạy có thể tưởng mẫu đã được mở rộng.
  Căn cứ: Dữ liệu không bị hỏng hay thêm bậy, chỉ lời báo dễ gây hiểu nhầm cho người chạy lệnh nội bộ, và dấu hiệu «thêm 0» vẫn cho biết sự thật.
  file: `pipeline/label-sample.mjs`
  severity: low
  Đề xuất: known-limits

- **«Thử lại» và khoảng hở sau khi ghi thành công có thể thêm dòng trường hợp trùng, thổi số trên bảng và bản xuất**
  Người dùng thấy gì: Khi mạng chập chờn rồi bấm «Thử lại», hoặc bấm hai lần lúc trang đang chuyển, một trường hợp có thể bị ghi hai lần. Số trường hợp trên bảng và bản xuất sẽ cao hơn thực tế một chút.
  Căn cứ: Chỉ xảy ra khi mạng lỗi hoặc bấm đúp, chỉ làm số đếm trường hợp lệch nhẹ và không động tới nhãn đã lưu; ít người dùng nội bộ gặp.
  file: `app/src/components/ops/labels/luot-hai.tsx`
  severity: low
  Đề xuất: known-limits

- **Thông báo «Tin này vừa có người gắn» gần như không kịp hiện vì trang tải lại ngay sau toast**
  Người dùng thấy gì: Khi bài vừa có người khác gắn, màn tự nhảy sang bài kế và câu giải thích gần như biến mất ngay. Người đang điền biểu mẫu thấy bài đổi mà không hiểu vì sao.
  Căn cứ: Người gắn chỉ bối rối trong giây lát, bài kế vẫn mở đúng và không mất nhãn đã lưu; là vấn đề trải nghiệm có thể cải thiện sau.
  file: `app/src/components/ops/labels/label-form-nhom.tsx`
  severity: low
  Đề xuất: known-limits

- **Route mới /api/v1/ops/labels/[itemId]/review chưa khai trong sổ bề mặt API, làm đỏ cổng portal_static (r1)**
  Người dùng thấy gì: Chức năng xem lượt hai chạy bình thường với người gắn nhãn, nhưng bộ kiểm tự động của cổng sẽ báo đỏ nên bản này chưa thể gộp vào nhánh chính cho tới khi khai bổ sung.
  Căn cứ: Không mất dữ liệu và người dùng không gặp lỗi khi dùng, chỉ chặn việc gộp bản; sửa là thêm một dòng khai báo, rẻ và an toàn ở bất kỳ lúc nào.
  file: `app/src/app/api/v1/ops/labels/[itemId]/review/route.ts`
  severity: high
  Đề xuất: new-contract

- **Enum case_kind của eval_label_cases không có CHECK ở DB (r1)**
  Người dùng thấy gì: Nếu có đường ghi khác ngoài màn gắn nhãn đưa vào loại trường hợp lạ, số đó sẽ không hiện trên bảng trường hợp trên màn dù vẫn có trong bản xuất.
  Căn cứ: Chỉ xảy ra khi ai đó ghi trực tiếp ngoài đường chính, không làm mất dữ liệu và bản xuất vẫn có đủ nên người dùng đối chiếu được.
  file: `db/migrations/072_labels_nhom.sql`
  severity: medium
  Đề xuất: known-limits

- **Cột và tham số API the_nhom_dung đặt tên tiếng Việt; thuật ngữ «Thẻ nhóm» chưa có trong CONTEXT.md (r1)**
  Người dùng thấy gì: Người dùng không thấy khác biệt trên màn; chỉ là tên kỹ thuật không theo quy ước và từ «Thẻ nhóm» chưa có trong sổ từ vựng, gây khó đọc cho người làm sau.
  Căn cứ: Không ảnh hưởng người dùng cuối, nhưng đổi tên rẻ ngay bây giờ và đắt sau khi bản cập nhật cơ sở dữ liệu đã áp vào máy thật.
  file: `db/migrations/072_labels_nhom.sql`
  severity: low
  Đề xuất: new-contract

- **Route lượt hai nhận itemId vượt miền bigint và không phải chữ số thập phân: trả 500 thay vì 400 (r1)**
  Người dùng thấy gì: Gõ tay một mã bài quá lớn hoặc sai khuôn trên địa chỉ sẽ ra lỗi máy chủ chung thay vì thông báo rõ mã sai; màn thường không gửi mã như vậy.
  Căn cứ: Chỉ gặp khi tự gõ địa chỉ bất thường, không mất dữ liệu và tải lại là xong.
  file: `app/src/app/api/v1/ops/labels/[itemId]/review/route.ts`
  severity: low
  Đề xuất: known-limits

- **Route lượt hai chưa khai trong sổ bề mặt API, làm cổng tĩnh portal_static đỏ (r1)**
  Người dùng thấy gì: Chức năng xem lượt hai chạy bình thường với người gắn nhãn, nhưng bộ kiểm tự động của cổng sẽ báo đỏ nên bản này chưa thể gộp cho tới khi khai bổ sung.
  Căn cứ: Không mất dữ liệu và người dùng không gặp lỗi khi dùng, chỉ chặn việc gộp bản; sửa là thêm một dòng khai báo, rẻ.
  file: `app/src/app/api/v1/ops/labels/[itemId]/review/route.ts`
  severity: high
  Đề xuất: new-contract

- **Bảng so báo sai «khác máy» ở Tầng và WC với mọi bài S03 có gắn hai trường này (r1)**
  Người dùng thấy gì: Ở lượt hai, ô Tầng và số WC bị tô cảnh báo «khác máy» dù máy không đọc được gì, nên người gắn thấy số chỗ khác nhiều hơn thực tế.
  Căn cứ: Chỉ làm sai gợi ý hiển thị, không làm sai nhãn đã lưu; người gắn có thể bỏ qua và sửa bảng sau không mất gì.
  file: `app/src/components/ops/labels/bang-so.tsx`
  severity: medium
  Đề xuất: new-contract

- **Máy đọc «unknown» bị tính là khác với «Không suy ra được» và hiện mã thô tiếng Anh (r1)**
  Người dùng thấy gì: Khi người gắn chọn «Không suy ra được» và máy cũng nói chưa rõ, màn vẫn báo khác và hiện chữ tiếng Anh «unknown», gây hiểu lầm nhẹ.
  Căn cứ: Chỉ là sai lệch hiển thị ở lượt hai, không đổi dữ liệu đã lưu và sửa sau không tốn kém.
  file: `app/src/components/ops/labels/bang-so.tsx`
  severity: medium
  Đề xuất: new-contract

- **Hình dạng 5 (tuyên quét lớp, danh sách tay thiếu): cổng thiết kế E16 bỏ sót ba tệp màn có trong diff (r1)**
  Người dùng thấy gì: Ba màn của tính năng không được bộ kiểm giao diện tự động quét, nên lỗi trình bày có thể lọt qua mà không báo đỏ.
  Căn cứ: Chỉ làm yếu lưới kiểm tự động chứ không làm hỏng chức năng hay mất dữ liệu; bổ sung danh sách lúc nào cũng được.
  file: `_acceptance/config.yaml`
  severity: medium
  Đề xuất: new-contract

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).
