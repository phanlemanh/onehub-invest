# Review findings: do-hieu-qua-hang-ngay (round 1)

Review incomplete: không (mọi finder đều chạy xong).

## Trong hợp đồng

- **chanLo so chuỗi phân biệt hoa thường, còn detail mang chữ đã hạ thường (chuanChu) nên không theo cách gập của leak gate sync**
  file: `pipeline/lib/do-hang-ngay.mjs:378` · severity: medium · source: conventions · AC: AC-9
  detail: Chỉ có `chanLo` chặn tầng A trong `dq_check_results.detail`. Leak gate của `sync-cloud.mjs` không quét bảng này, chỉ đếm dòng ở source_registry, stg_*, media… Hàm dùng `JSON.stringify(detail).includes(chuoi)` với `chuoi` = `source_registry.real_name` lấy nguyên văn. Trong khi đó các khoá lát `theo-chu-bai:<project>` đi qua `chuanChu` (NFC + toLowerCase), vì vậy tên nguồn viết hoa như trong registry sẽ không bắt được bản đã hạ thường trong detail. Đường che đã có của repo (`maskedSourceExpr`/`foldSql` + `nameVariants` trong sync-cloud.mjs) gập hoa thường và dấu trước khi so. chanLo không theo pattern đó, nên với chuỗi đã chuẩn hoá thì cổng AC-9 yếu hơn so với lời khai.

- **Lát Toà, Dự án của mẫu soát và tín hiệu không bao giờ có số; khối trống không có trạng thái trống**
  file: `app/src/components/ops/quality/do-hang-ngay.tsx:107` · severity: medium · source: conventions · AC: AC-7
  detail: Pipeline chỉ phân rã `latThe` theo thi_truong/phuong/du_an_theo_chu và `latSl` theo thi_truong/phuong (do-hang-ngay.mjs:116, 189). AC-7 lại yêu cầu mỗi nhóm số có đủ chiều thị trường/phường/dự án/toà. Phía UI, `CHIEU.toa` = {giu:'toa', tin:'toa'} và `CHIEU.du_an.tin` = 'du_an' trỏ tới các khoá không tồn tại. Tab Toà chỉ còn bảng chuyển bậc. Khi chuyển bậc đang ở lần lập mốc (skip), Frame hiện trống hoàn toàn, không có Empty state. Như vậy vi phạm luật ReUI 5 (mọi vùng dữ liệu cần trạng thái trống kèm hành động) và AC-7/AC-8.

- **Lát Toà/Dự án của dòng chuyển bậc không bao giờ ra ô «chua-co-danh-ba»: KHOA_LAT_DON_VI chạy trên dòng data_level_change, mà bảng này không có cột core**
  file: `pipeline/do-hang-ngay.mjs:153` · severity: medium · source: bugs · AC: AC-7
  detail: `lat` của do1-chuyen-bac được tính bằng `phanRa(ngayRows, KHOA_LAT_DON_VI[c])`, trong đó `ngayRows` lấy từ `SELECT * FROM data_level_change`. Bảng data_level_change (083) không có cột `core`, nên `chuaGan(u, "toa")` luôn đọc `u.core?.toa_chu === undefined` và trả `khong-tin-hieu`. Thêm vào đó, donViHienTai đặt cứng `building_key: null`. Hệ quả: chiều `toa` dồn mọi đơn vị vào «Không nêu chỗ», kể cả khi tin có `block_raw` (core.toa_chu = true được tính trong SQL rồi bỏ phí). Chiều `du_an` cũng không bao giờ ra `chua-co-danh-ba`. Cách tách hai ô chưa gắn mà AC-7 và contract yêu cầu không có trong số thật. Test AC-7 (do-hang-ngay.test.mjs:192) dùng hàm khoá tự viết thay cho KHOA_LAT_DON_VI và áp lên fixture có `r.toa.chu`, nên không bắt được lỗi này. Cách sửa: áp khoá lên `chuyen`/`nay` (có core), hoặc lưu toa_chu vào data_level_change.

- **Cổng chặn rò (chanLo) không khớp được chữ bài có xuống dòng hay dấu nháy vì so trên chuỗi JSON đã escape**
  file: `pipeline/lib/do-hang-ngay.mjs:378` · severity: low · source: bugs · AC: AC-9
  detail: `chanLo` gọi `JSON.stringify(detail).includes(chuoi)`. Chuỗi cấm «CHU BAI» là 40 ký tự đầu của bài (chuoiCam). Bài Zalo rất hay xuống dòng trong 40 ký tự đầu, mà JSON.stringify đổi `\n`, `"` thành chuỗi escape, nên `includes` không bao giờ khớp với chuỗi thô. Cùng lỗi với sender_name/quote có dấu nháy. Cổng AC-9 vì vậy báo qua lặng lẽ đúng ở loại nội dung nó cần chặn. Cách sửa: so trên chuỗi cấm đã escape (`JSON.stringify(chuoi).slice(1, -1)`) hoặc duyệt từng giá trị chuỗi của detail.

- **Hình dạng 2 (fixture viết tay, không qua bộ ghi): AC-7 «hai ô chưa gắn» đo trên hàm khoá viết lại trong test, không phải KHOA_LAT_DON_VI của bộ ghi**
  file: `pipeline/scripts/do-hang-ngay.test.mjs:190` · severity: high · source: measurement · AC: AC-7
  detail: Test tự định nghĩa KHOA_LAT (dòng 190-194), trong đó phuong: (r) => r.ward ?? { chua: r.toa?.chu ? "chua-co-danh-ba" : "khong-tin-hieu" }, rồi assert lat.phuong.o["chua-co-danh-ba"] === 2 (dòng 211) và GOP HAI O CHUA GAN trên các hàng donViLat() cũng viết tay. Bộ ghi thật pipeline/do-hang-ngay.mjs:58-63 export KHOA_LAT_DON_VI với phuong: (u) => u.ward_id ?? { chua: "khong-tin-hieu" }, tức lát phường của bộ ghi KHÔNG BAO GIỜ sinh 'chua-co-danh-ba'. Test không import KHOA_LAT_DON_VI. Vì thế lời hứa của evals E7/E8 (lát Phường/xã có hai ô 'Không nêu chỗ' và 'Chưa có trong danh bạ') xanh trên logic của chính test, trong khi đầu ra thật lệch. Đoạn đi qua bộ ghi trong test DB (dòng 628-633) chỉ kiểm tổng các ô = tong và sự có mặt của khoá, không kiểm có ô chưa gắn nào. Evals E7 còn ghi rõ «không trên fixture dựng tay».

- **Hình dạng 4 (khẳng định âm một mình): quét sáu chuỗi cấm ở AC-9 không có đối chứng dương, chuỗi SĐT không thể khớp**
  file: `pipeline/scripts/do-hang-ngay.test.mjs:637` · severity: high · source: measurement · AC: AC-9
  detail: Dòng 637 chỉ có assert.ok(!json.includes(x)) với x thuộc ["CHU_BAI_X","TRICH_Y","NGUOI_Z","0900000001","LABELER_W","TEN_THAT_V"]. (a) Dòng 593 ghi seller_phone = '+84900000001'. '0900000001' không phải chuỗi con của '+84900000001', nên dù detail có lộ SĐT dạng E.164 thì phép quét vẫn xanh. (b) CHU_BAI_X, NGUOI_Z, SĐT chỉ gắn vào bài do1p10, nhưng test không assert do1p10 nằm trong 20 thẻ rút (kq.the), nên ba chuỗi này có thể không bao giờ chạm tới bộ ghi. (c) TEN_THAT_V gắn với mã S09, không dữ liệu nào trỏ tới mã đó. Hai chiều đỏ (dòng 639-640) đi qua dotBien bên trong doHangNgay và bắt bằng chanLo, nên không chứng minh phép quét của test này bắt được rò rỉ. Không có ca dương cài một chuỗi vào detail rồi thấy phép quét đỏ.

- **Hình dạng 2 (fixture viết tay đúng khuôn bên đọc): AC-4 bỏ sót dựng thẻ tay, trong khi evals hứa «thẻ rút bằng hàm ghi của mau-soat-cuon-chieu»**
  file: `pipeline/scripts/do-hang-ngay.test.mjs:113` · severity: high · source: measurement · AC: AC-4
  detail: theBoSot() (dòng 113-125) tự viết {ngay, nhan, draft:{hien, cach_doc:{...:{trang_thai}}}, hienTai} đúng khuôn mà boSot() đọc, rồi gọi thẳng boSot. Ý «sửa sale_offers sau lúc rút thì do1-bo-sot không đổi» chỉ được đo bằng trường hienTai viết tay và cờ dotBien 'doc-lai-sale-offers' (dòng 141), không có lần sửa sale_offers thật trên DB. Phần đi qua bộ ghi (dòng 624) chỉ có assert.equal(dq["do1-bo-sot"].status, "pass"). Nếu rutMau ghi trang_thai hoặc khoá cách đọc khác khuôn mà boSot chờ, test không bắt được. Ngoài ra dòng 138 chỉ kiểm "co_y_nghia" in r[0] && "chenh" in r[0] (khoá có mặt), không kiểm giá trị so với tuần trước như E4 hứa.

- **Hình dạng 2 (không round-trip): DO1-RT bỏ qua bước lưu và bước đọc thật, tự chép logic gửi của biểu mẫu**
  file: `app/tests/do-hang-ngay-labels.test.tsx:130` · severity: high · source: measurement · AC: AC-2
  detail: Ca 'DO1-RT' tự xưng «rút → điền sẵn → lưu không sửa → giữ nháp 100%», và E2 hứa «lưu không sửa ô nào qua route thật rồi chạy hàm tính của do-hang-ngay». Thực tế tyLe() (dòng 130-141) lấy chuanHoaLuot(giaTriGui(...)) rồi gọi giuO(r.field, goc, { value: r.value, not_stated: r.not_stated }) ngay trong bộ nhớ: không gọi ghiNhan, không đọc lại eval_labels, không chạy doHangNgay/giuNhap. Đối số bên đọc { value, not_stated } được dựng tay theo khuôn mà giuO chờ. giaTriGui (dòng 67-79) cũng là bản chép tay «như hàm luu của LabelFormNhom», không phải đường gửi thật. Lệch giữa cách ghiNhan lưu (kiểu chữ, not_stated) và cách pipeline đọc nhan sẽ không lộ ra.

- **Hình dạng 4 (thiếu đối chứng, ghép thông điệp sai): dấu «có ý nghĩa» chỉ có chiều đỏ trên fixture chồng khoảng, không có chiều xanh**
  file: `app/tests/do-hang-ngay-quality.test.tsx:97` · severity: high · source: measurement · AC: AC-8
  detail: kiemYNghia (dòng 97) kiểm ve(d).includes("data-co-y-nghia") cho toàn trang. Ca 19/20 so 5/20 kiểm có dấu (dòng 98). Fixture chồng khoảng 16/20 so 14/20 chỉ chạy với dotBien 'y-nghia-bo-chong' và được chờ là ném lỗi (dòng 99-103). Không có lần render bản lành của fixture chồng khoảng để thấy dấu vắng mặt. Vì vậy một renderer luôn in data-co-y-nghia, bất kể co_y_nghia, vẫn qua cả hai assert. Đây đúng chỗ cần bắt đỏ 'Y NGHIA SAI TREN MAN' của E8, và trái với luật «cặp hai chiều trên cùng fixture» ghi ở đầu evals.yaml.

- **Hình dạng 1 (đo chỉ dẫn thay vì đầu ra): hứa «truy vấn ném lỗi → Alert + Thử lại» nhưng chỉ grep mã nguồn page.tsx**
  file: `app/tests/do-hang-ngay-quality.test.tsx:106` · severity: medium · source: measurement · AC: AC-8
  detail: Dòng 106-107 đọc chữ của app/src/app/ops/quality/page.tsx rồi assert.match với regex /<RegionError what="số đo hằng ngày">\s*<Suspense fallback={<DoHangNgaySkeleton \/>}>/. Đây là đo cấu trúc mã nguồn, không render trạng thái lỗi để thấy Alert và nút 'Thử lại' trong đầu ra như E8 hứa. Một RegionError không bắt được lỗi async, hoặc không in nút 'Thử lại', vẫn qua. Ngược lại, chỉ cần đổi định dạng JSX (xuống dòng, thêm prop) là test đỏ dù hành vi không đổi.

- **Hình dạng 5 (tuyên cả lớp nhưng chỉ có vài điểm): E8 hứa năm bảng, test chỉ kiểm hai**
  file: `app/tests/do-hang-ngay-quality.test.tsx:57` · severity: medium · source: measurement · AC: AC-8
  detail: E8 hứa «khối 'Đo hằng ngày' có năm bảng (giữ nháp, bỏ sót, tín hiệu, chuyển bậc, so cặp)». Dòng 57 chỉ lặp trên ["giu-nhap", "bo-sot"], trong khi renderer có thêm data-bang="tin-hieu", "chuyen-bac", "so-cap" (do-hang-ngay-bang.tsx:94/124/144). Danh sách không được viết trước đủ năm phần tử, nên số assert (2) khác số phần tử lời hứa (5). Tương tự, dòng 62 kiemLat chỉ kiểm 'Không nêu chỗ' cho lát phường, không kiểm 'Chưa có trong danh bạ'. Bản đột biến ở dòng 65 gỡ cả hai ô cùng lúc, nên một màn thiếu riêng ô 'Chưa có trong danh bạ' vẫn qua.

- **Hình dạng 3 (kiểm chuỗi có mặt thay cho quan hệ): dòng 'Đổi khoá' của bảng chuyển bậc chỉ được kiểm bằng phép OR mà trạng thái lập mốc đã thoả**
  file: `app/tests/do-hang-ngay-quality.test.tsx:71` · severity: medium · source: measurement · AC: AC-8
  detail: Chú thích ghi «bảng theo nguồn có cột Đổi khoá», nhưng assert là h2.includes('data-bang="chuyen-bac"') || h2.includes("data-do1-lap-moc"). Vế thứ hai là trạng thái đã được assert có mặt ở dòng 58, nên phép OR có thể xanh mà bảng chuyển bậc không hề xuất hiện. Chữ 'Đổi khoá', tức lời hứa của E8 rằng chuyển bậc có dòng 'Đổi khoá' tách riêng, không được kiểm ở đâu.

- **Hình dạng 4 (khẳng định có điều kiện, không có đối chứng nhánh): «bài không có đọc gộp thì hien = bo-doc-luat» không bao giờ được thực thi**
  file: `pipeline/scripts/do-hang-ngay.test.mjs:417` · severity: medium · source: measurement · AC: AC-1
  detail: Dòng 417-418 viết: const khongGop = kq.the.find(t => t.draft.cach_doc[KHOA_GOP].trang_thai !== "co"); if (khongGop) assert.equal(khongGop.draft.hien, "bo-doc-luat"). Trong ca này goiGia(c) mặc định 0,001 USD mỗi lời, trần 0,05, nên rutMau gọi đọc gộp cho mọi bài thiếu (mau-soat-cuon-chieu.mjs:133-139) và mọi thẻ đều 'co'. Nhánh if không bao giờ chạy, assert không bao giờ được đánh giá, và không có assert nào ghim rằng khongGop tồn tại. Lời hứa của E1 về draft.hien của bài không có đọc gộp vì thế chưa được đo.

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **--ngay của do-hang-ngay không kiểm khuôn; chạy bù ngày cũ ghi dòng mang checked_at hôm nay, đè số hiện hành**
  Người dùng thấy gì: Nếu ai đó chạy bù số cho ngày đã qua, số của ngày cũ có thể hiện trên màn chất lượng như số hôm nay và đè số thật.
  Căn cứ: Chỉ xảy ra khi người vận hành cố ý chạy bù; số hiện hành chạy lại là phục hồi được, nên ghi giới hạn là đủ.
  file: `pipeline/do-hang-ngay.mjs`
  severity: medium
  Đề xuất: known-limits

- **so-sanh-cach-doc ghi dòng do1-so-sanh lên dq_check_results mà không qua chanLo**
  Người dùng thấy gì: Dòng so sánh cặp chưa qua cổng chặn rò; hiện chỉ chứa số, nhưng nếu sau này thêm chữ thì không có rào.
  Căn cứ: Hiện chưa lộ gì, rủi ro chỉ xuất hiện khi có thay đổi sau này, nên ghi lại để người sửa sau biết.
  file: `pipeline/so-sanh-cach-doc.mjs`
  severity: low
  Đề xuất: known-limits

- **Nháp máy điền sẵn giá, nhưng khi người đổi Loại tin thì đơn vị tự đổi tỷ↔triệu mà số giữ nguyên: giá bị lệch 1000 lần không có cảnh báo**
  Người dùng thấy gì: Khi người soát đổi Loại tin sau khi nháp đã điền giá, giá có thể bị lưu lệch 1000 lần mà không cảnh báo, làm nhãn vàng sai.
  Căn cứ: Nhãn sai được ghi lặng lẽ và làm lệch số đo về sau, nhưng chỉ ở trường hợp đổi loại tin sau khi điền sẵn, và sửa tương đối rẻ.
  file: `app/src/components/ops/labels/label-form-nhom.tsx`
  severity: medium
  Đề xuất: new-contract

- **--write với --ngay khác hôm nay xoá theo cửa sổ của ngày đó nhưng chèn với checked_at = now(), nên dòng do1-* bị nhân bản và đè lên số hôm nay**
  Người dùng thấy gì: Chạy bù ngày cũ nhiều lần làm dòng số tích dần và số cũ hiện như số hiện hành trên màn chất lượng.
  Căn cứ: Chỉ xảy ra khi cố ý chạy bù, dữ liệu sinh ra là số đo chứ không phải dữ liệu gốc nên dọn được.
  file: `pipeline/do-hang-ngay.mjs`
  severity: low
  Đề xuất: known-limits

- **goiDocGopThat báo đã gọi đủ số bài kể cả khi đọc gộp không gọi lần nào (thoát 3 vì ước vượt trần)**
  Người dùng thấy gì: Dòng log của lượt rút mẫu có thể báo đã gọi đọc gộp dù thực tế không gọi lần nào.
  Căn cứ: Chỉ sai chữ báo trong log, không ảnh hưởng dữ liệu hay tiền chi.
  file: `pipeline/mau-soat-cuon-chieu.mjs`
  severity: low
  Đề xuất: known-limits

- **Hình dạng 4 (không ghim thông điệp): chiều đỏ «tra nháp theo tiền tố» ghim nhầm KHONG DIEN NHAP; thông điệp KHOA CACH DOC LECH KHUON không có bản đột biến nào sinh ra**
  Người dùng thấy gì: Bộ kiểm không phân biệt được hai loại lỗi điền sẵn khác nhau, nên khi đỏ người sửa phải tự tìm nguyên nhân.
  Căn cứ: Không ảnh hưởng người dùng cuối, chỉ làm bộ kiểm kém chỉ rõ nguyên nhân khi đỏ.
  file: `app/tests/do-hang-ngay-labels.test.tsx`
  severity: medium
  Đề xuất: known-limits

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).

