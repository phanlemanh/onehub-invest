## Trong hợp đồng

- **Hình dạng 1 (đo chỉ dẫn thay vì đầu ra): route.ts chỉ bị grep mã nguồn, ma trận hành vi chạy trên bản sao xuLyThuThap**
  file: `app/tests/dinh-danh-thu.test.tsx:278`
  severity: medium
  AC: AC-3
  source: measurement
  detail: Eval E3 hứa «gọi GET của route.ts với Request giả … đi qua kiemQuyen thật». Nhưng ma trận DD-AC-3 (doMaTran3) gọi `xuLyThuThap` trong collections-api.ts, đây là bản chép lại ba bước của route.ts. Hàm GET của route.ts không lần nào được gọi. Thứ duy nhất chạm route.ts là ca DD-AC-3b: readFileSync rồi khớp regex `/kiemQuyen\(req, "ops\.read"\)[\s\S]*traThuThap\(req, q\.nguoi\)/` và `/Promise\.all|NextResponse\.json/` trên văn bản nguồn. Phép đo này nhìn chữ trong tệp chứ không nhìn Response mà route trả về. Ví dụ chuỗi khớp nằm trong comment, hoặc route đổi cách xử lý q mà vẫn còn đoạn chữ ấy, thì ca vẫn xanh. Hai đối chứng (boChe, theoActor) cũng chỉ đột biến collections-api.ts, không đụng route.ts.
  rationale: AC-3 đòi gọi GET /api/v1/ops/collections bằng bảy kiểu người gọi, mà phép đo chạy trên bản sao logic chứ không qua route thật nên AC-3 chưa được chứng minh đúng đường.

- **Hình dạng 2 (fixture viết tay đúng khuôn bên đọc): nhánh «cloud» của DD-AC-5 là dữ liệu tiêm tay, không đi qua docTrangThuThap dưới VERCEL=1**
  file: `app/tests/dinh-danh-thu.test.tsx:351`
  severity: medium
  AC: AC-5
  source: measurement
  detail: Eval E5 hứa «chế độ cloud (VERCEL=1, bản tin giả mang 'dd-acc-*', 'dd-prof-*', 'dd-grp-*')». Thực tế doTrang lặp `for (const cloud of [false, true])` nhưng ở cả hai vòng, dữ liệu đều là `DU_LIEU_TRANG(cloud)` = BO_DU_LIEU() viết tay, chỉ thêm khoá `cloud: { state: "fresh" }` rồi tiêm qua `doc`. Ca không đặt VERCEL=1, không ghi ops_heartbeat, không gọi docTrangThuThap. Ở nhánh cloud thật, docTrangThuThap trả CLOUD_EMPTY (zaloGroups: [], zaloAllowlist: []), tức là không bao giờ dựng ra khuôn mà fixture này giả lập. CollectionsContent che theo vai chứ không theo khoá cloud, nên vòng «cloud» chỉ lặp lại y hệt vòng máy thu. Đường bên ghi thật (bản tin → docTrangThuThap → props) của chế độ cloud vì thế không được đo.
  rationale: AC-5 nêu rõ ở chế độ cloud dữ liệu trao client cho viewer không chứa mã tài khoản, hồ sơ hay mã nhóm, nhưng phép đo cloud chỉ lặp lại dữ liệu tiêm tay chứ không đi qua đường đọc cloud thật.

- **Hình dạng 3 (assert «có mặt» trong khi lời hứa là quan hệ): DD-AC-6 chỉ kiểm có một tài khoản soNhomBat === 2**
  file: `pipeline/scripts/soat-tang-a.test.mjs:161`
  severity: low
  AC: AC-6
  source: measurement
  detail: CAU_HINH dựng hai tài khoản: «default» bật 2 nhóm (dd-grp-a, dd-grp-b), «phu» bật 1 nhóm (dd-grp-c). Điều cần đo là quan hệ tài khoản → số nhóm bật của chính nó. Test lại chỉ có `assert.ok(acc.length >= 1)` và `assert.ok(acc.some((a) => a.soNhomBat === 2))`. Có ba trường hợp sai mà test vẫn xanh: bên ghi tráo số giữa hai tài khoản (default 1, phu 2), bên ghi bỏ mất tài khoản «phu», hoặc phu ra soNhomBat sai (0 hay 2). Nên ghim cả bảng, ví dụ deepEqual({default: 2, phu: 1}) và length === 2.
  rationale: AC-6 yêu cầu mỗi tài khoản trong bản tin có soNhomBat bằng đúng số nhóm bật của nó, mà test chỉ ghim một tài khoản nên tráo hoặc thiếu tài khoản vẫn xanh.

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **nguoiPhien nuốt mọi lỗi của getSessionUser để ca thử chạy được, lỗi phiên hay DB thật trên prod bị giấu**
  Người dùng thấy gì: Nếu cơ sở dữ liệu phiên trục trặc, người vận hành sẽ thấy trang Thu thập ở dạng đã che mã nhóm và tài khoản như thể thiếu quyền, mà không có thông báo lỗi nào. Dữ liệu không bị lộ.
  Căn cứ: Hậu quả nhẹ và an toàn vì lỗi chỉ làm che nhiều hơn chứ không lộ dữ liệu; người dùng tải lại trang khi hệ thống ổn là xem được lại, chỉ khó biết nguyên nhân.
  file: `app/src/components/ops/collections/collections-content.tsx`
  severity: low
  Đề xuất: known-limits

- **Mã nhóm Zalo vẫn lên cloud và tới Người xem/bearer qua zaloGroups[].name (bản tin top-level không lọc, cheDinhDanhThu không che)**
  Người dùng thấy gì: Khi một nhóm Zalo thiếu tên hiển thị, mã nhóm được dùng thay tên và vẫn có thể lên cloud, rồi hiện cho Người xem hoặc khoá chung trong bảng nhóm. Chỉ xảy ra với nhóm chưa có tên.
  Căn cứ: Chỉ lộ mã nhóm là bí danh cấu hình trong trường hợp hiếm nhóm chưa có tên, không lộ tên nguồn thật hay hồ sơ người dùng; nhưng sửa sau thì không khó nên nên ghi rõ giới hạn để Mạnh quyết có mở vòng riêng không.
  file: `pipeline/push-ops-facts.mjs`
  severity: medium
  Đề xuất: known-limits

- **nguoiPhien nuốt mọi lỗi của getSessionUser, phiên ops/admin bị che định danh mà không báo gì**
  Người dùng thấy gì: Khi tra phiên gặp sự cố, người vận hành bị coi như thiếu quyền, thấy dòng chú thích mã nhóm chỉ hiện cho vai Vận hành trở lên và không có lời báo lỗi nào.
  Căn cứ: Lỗi hiếm, an toàn về dữ liệu và tự hết khi tải lại trang, chỉ gây khó hiểu nhất thời cho người vận hành.
  file: `app/src/components/ops/collections/collections-content.tsx`
  severity: low
  Đề xuất: known-limits

- **Hình dạng 4 (assertion âm tính đứng một mình): ca bearer kèm cookie ops chỉ assert doesNotMatch, không kiểm status, không có đối chứng dương**
  Người dùng thấy gì: Một ca thử phụ (khoá chung đi kèm phiên vận hành) có thể báo xanh dù hệ thống trả lỗi thay vì dữ liệu đã che, nên bảo đảm cho trường hợp này yếu hơn vẻ ngoài.
  Căn cứ: Bảy kiểu người gọi chính vẫn được thử đầy đủ ở chỗ khác, chỉ ca phụ này là lỏng; không ảnh hưởng người dùng thật, sửa sau cũng rẻ.
  file: `app/tests/dinh-danh-thu.test.tsx`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 3 (quan hệ bị thay bằng assert giữa hằng số của test): ON4-AC-2 bỏ phép đo hợp nhóm bật, thay bằng `UNION.length === N`**
  Người dùng thấy gì: Một phép kiểm số nhóm S03 lên cloud của vòng trước đã yếu đi, nên nếu bản tin đếm sai tổng số nhóm thì test này không bắt được.
  Căn cứ: Là độ chặt của test thuộc tính năng khác, không lộ dữ liệu hay đổi cái người dùng thấy; sửa sau rẻ nhưng nên làm trong vòng của tính năng đó.
  file: `app/tests/nhom-s03-tren-cloud.test.tsx`
  severity: low
  Đề xuất: known-limits

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).
