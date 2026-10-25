## Trong hợp đồng

- **Phép đo «bề rộng trang» luôn ra sw = khung trên /ops nên tiêu chí 390 «không cuộn ngang» của E10 không kiểm được gì**
  AC: AC-10
  file: `scripts/ui-capture-login.mjs:107`
  severity: medium
  source: conventions
  detail: Lượt này thêm phép đo `document.documentElement.scrollWidth` (ui-capture-login.mjs:107). evals.yaml:80 lấy luôn dòng 'bề rộng: khung 390, trang <sw>' với sw ≤ 390 làm bằng chứng rằng ở 390 trang không cuộn ngang. Tuy vậy, khung Ops không cuộn ở cấp document. Gốc của OpsShell là `SidebarProvider className="... h-svh min-h-0 overflow-hidden"` (app/src/components/shell/ops-shell/ops-shell.tsx:122). Thân trang là `<div className="@container flex min-h-0 flex-1 flex-col overflow-y-auto ...">` (ops-shell.tsx:104). Theo CSS, `overflow-y-auto` làm `overflow-x` của div này đổi từ visible sang auto. Vì vậy khi nội dung trang /ops/quality tràn ngang, phần tràn cuộn bên trong div thân trang và bị gốc overflow-hidden cắt. Kết quả là documentElement.scrollWidth luôn bằng innerWidth với mọi trang /ops. Nếu bố cục 390 có lỗi tràn ngang thật, dòng 'trang 390' vẫn in ra và E10 vẫn qua. Ảnh `screenshot --full-page` cũng không thấy phần bị cắt, nên ba ảnh E10-*.png không thay được phép đo này. Mặt khác, chú thích 'bảng cuộn trong khung của nó không tính' muốn tách tràn của data-grid khỏi tràn cấp trang, nhưng document.scrollWidth không tách được hai loại này trong khung shell. Hướng đúng: đo scrollWidth so với clientWidth của chính vùng cuộn thân trang, tức là phần tử cuộn của OpsShell, không đo document. Sau đó sửa câu expected ở evals.yaml:80 cho khớp. Test UC-AC-9 chỉ giả lập {w:390, sw:390}, nên test không bắt được lỗi này.
  rationale: AC-10 đòi ảnh chụp ở 390 «không cuộn ngang» bằng bước chụp của kho; nếu phép đo bề rộng luôn đậu trên /ops thì điều kiện này không được chứng minh, và nó không nằm trong Out of scope.

- **Phép đo «bề rộng trang» luôn bằng bề rộng khung trên /ops nên E10 «390 không cuộn ngang» đậu dù trang có tràn**
  AC: AC-10
  file: `scripts/ui-capture-login.mjs:107`
  severity: high
  source: bugs
  detail: Dòng 107 đo `document.documentElement.scrollWidth`. Trên /ops, OpsShell (app/src/components/shell/ops-shell/ops-shell.tsx:122) bọc gốc bằng `h-svh overflow-hidden`. Thân trang nằm trong `<div className="@container ... overflow-y-auto">` (dòng 104). Theo CSS, khi overflow-y là auto thì overflow-x đang `visible` sẽ được tính thành `auto`. Vì vậy nội dung tràn ngang bị cắt ở gốc hoặc cuộn bên trong div thân trang, và không bao giờ làm documentElement.scrollWidth lớn hơn innerWidth. Kết quả là dòng `bề rộng: khung 390, trang 390` in ra trong mọi trường hợp, kể cả khi vùng Hiệu chuẩn tràn ngang ở 390px. Thế mà evals.yaml (E10 expected) dùng đúng điều kiện `sw ≤ 390` làm bằng chứng «trang không cuộn ngang», nên tiêu chí này là kiểm suông và có thể cho kết quả đậu sai. Test UC-AC-9 chỉ kiểm chuỗi do fake trả về (`{w:390, sw:390}`), nên không phát hiện được. Cách sửa: đo scrollWidth so với clientWidth của vùng cuộn thân trang (phần tử overflow-y-auto trong SidebarInset), hoặc đo phần tử con rộng nhất của main, chứ không đo documentElement.
  rationale: Cùng gốc với finding đầu: tiêu chí «không cuộn ngang» ở sáng 390 của AC-10 có thể đậu sai vì phép đo không bao giờ thấy phần tràn.

- **Hình dạng 4 (assertion âm tính đứng một mình, không có đối chứng dương): ở E10, phép đo 'sw ≤ 390' luôn đạt trên /ops vì khung shell không bao giờ làm trang tràn ngang**
  AC: AC-10
  file: `_acceptance/hieu-chuan-mot-bo-so/evals.yaml:81`
  severity: high
  source: measurement
  detail: Expected mới của E10 lấy phép đo 'không cuộn ngang' từ dòng 'bề rộng: khung 390, trang <sw>', và đòi sw ≤ 390. sw lấy từ document.documentElement.scrollWidth (scripts/ui-capture-login.mjs:107). Trên /ops, gốc shell là `h-svh min-h-0 overflow-hidden` (app/src/components/shell/ops-shell/ops-shell.tsx:122). Thân trang là `overflow-y-auto` (dòng 104); theo CSS, overflow-y khác visible thì overflow-x cũng thành auto. Vậy mọi nội dung tràn ngang bị giữ trong hộp cuộn của thân trang hoặc bị cắt ở gốc, nên documentElement.scrollWidth luôn bằng innerWidth, dù bố cục có tràn hay không. Phép kiểm vì thế không thể ra FAIL. Không có đối chứng dương nào cho thấy đầu dò này từng báo sw > w trên shell này, ví dụ chèn một khối rộng 2000px rồi chụp. Đúng lỗi mà round 2 bắt được (thẻ và bảng Độ phủ cuộn ngang ở 390, cột S02/Tỉ lệ bị cắt) cũng sẽ đi qua đầu dò mới mà không bị phát hiện. Chính bước 2 của E10 cũng ghi 'vùng thân trang cuộn trong shell'.
  rationale: Eval E10 là bằng chứng của AC-10 cho điều kiện «không cuộn ngang» ở 390; điều kiện sw ≤ 390 luôn đúng nên AC-10 không được kiểm thật.

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **Không đo được bề rộng thì bỏ qua lặng lẽ, không báo lỗi**
  Người dùng thấy gì: Khi công cụ chụp trang không đo được bề rộng, nó vẫn chụp và báo thành công mà không nói gì, nên người xem có thể tưởng trang đã được kiểm bề rộng trong khi thật ra chưa.
  Căn cứ: Hậu quả nhẹ vì chỉ ảnh hưởng người vận hành khi nghiệm thu, không mất hay lộ dữ liệu, chạy lại là thấy, và việc bổ sung cảnh báo có thể làm sau với chi phí thấp.
  file: `scripts/ui-capture-login.mjs`
  severity: low
  Đề xuất: known-limits

- **Hình dạng 3 (assert 'chuỗi có mặt' trong khi lời hứa là quan hệ giữa các giá trị): test bề rộng dùng fixture w = sw nên không bắt được việc tráo khung/trang**
  Người dùng thấy gì: Nếu sau này dòng bề rộng bị in nhầm chỗ khung và trang, bài test hiện tại vẫn báo xanh, nên người vận hành có thể đọc ngược hai con số trong báo cáo chụp trang.
  Căn cứ: Hậu quả nhẹ và chỉ xảy ra khi có người sửa công cụ chụp sau này, không ảnh hưởng dữ liệu hay người dùng cuối, và thêm một ca thử khác nhau là việc rẻ để làm sau.
  file: `scripts/ui-capture-login.test.mjs`
  severity: medium
  Đề xuất: known-limits

- **Tên nguồn thật (tầng A) bị in ra stderr khi lệnh eval che tầng A lỗi (r1 · tệp đã đổi)**
  Người dùng thấy gì: Nếu bước che tên nguồn thật gặp lỗi lúc chụp trang, thông báo lỗi có thể in ra chính danh sách tên thật. Người vận hành dán kết quả đó vào hồ sơ nghiệm thu trong kho công khai sẽ vô tình để lộ tên nguồn.
  Căn cứ: Hậu quả nặng vì là dữ liệu tầng A có thể ra kho công khai, nhưng chỉ xảy ra khi bước chụp gặp lỗi; sửa sau rẻ và nên làm trong một việc riêng về an toàn bước chụp.
  file: `scripts/ui-capture-login.mjs`
  severity: medium
  Đề xuất: new-contract

- **getAirdnaComparison đếm lại listing của toàn bảng cho mỗi thị trường (r1)**
  Người dùng thấy gì: Trang Chất lượng có thể tải chậm hơn cần thiết vì cùng một phép đếm listing bị lặp lại cho từng thị trường. Số hiển thị vẫn đúng.
  Căn cứ: Chỉ làm chậm trang vận hành nội bộ, không sai số liệu, người dùng tải lại là xong; chưa có số đo chậm thật nên ghi nhận và chờ.
  file: `app/src/lib/queries.ts`
  severity: low
  Đề xuất: known-limits

- **capture.ui bỏ mất bước kiểm tệp ảnh đã được ghi (r1 · tệp đã đổi)**
  Người dùng thấy gì: Hiếm khi bước chụp có thể báo thành công và in đường dẫn ảnh dù ảnh không hề được tạo. Người nghiệm thu sẽ nhận bằng chứng rỗng mà không có cảnh báo.
  Căn cứ: Nhẹ vì người ký mở hồ sơ sẽ thấy ngay thiếu ảnh và chạy lại được, không mất hay lộ dữ liệu; sửa sau rẻ.
  file: `scripts/ui-capture-login.mjs`
  severity: low
  Đề xuất: known-limits

- **Mật khẩu tài khoản ops thử gửi tới bất kỳ origin nào có đường /ops (r1 · tệp đã đổi)**
  Người dùng thấy gì: Nếu ai chụp nhầm một địa chỉ thật (bản chạy chính thức hay bản xem trước) có trang /ops, mật khẩu của tài khoản thử trên máy sẽ bị gửi ra ngoài máy.
  Căn cứ: Tài khoản này chỉ tồn tại trên DB máy local và khó dùng được ở nơi khác nên rủi ro thấp; chỉ xảy ra khi gõ nhầm địa chỉ, và đổi mật khẩu thử là khắc phục được.
  file: `scripts/ui-capture-login.mjs`
  severity: low
  Đề xuất: known-limits

- **Tỉ lệ «Listing» của thẻ hiệu chuẩn chia số của cả khu vực cho số S02 của một market đại diện, nên lệch với bảng Độ phủ (r1)**
  Người dùng thấy gì: Với khu vực có nhiều thị trường S02 như Cần Thơ, tỉ lệ listing trên thẻ hiệu chuẩn có thể bị thổi lên và hiện cờ lệch lớn sai, trong khi bảng Độ phủ cho tỉ lệ khác cho cùng khu vực.
  Căn cứ: Gây hiểu nhầm về độ phủ ở các khu vực gộp nhiều thị trường và làm hai bảng mâu thuẫn nhau, nhưng chỉ ở màn vận hành nội bộ và số gốc vẫn đúng; nên xử lý trong một việc riêng cùng quyết định cách tính tỉ lệ.
  file: `app/src/lib/queries.ts`
  severity: medium
  Đề xuất: new-contract

- **Bước chụp không còn kiểm tệp ảnh đã được ghi: trả 0 và in đường dẫn dù không có ảnh (r1 · tệp đã đổi)**
  Người dùng thấy gì: Bước chụp có thể báo xong và in đường dẫn dù ảnh không có thật, khiến hồ sơ nghiệm thu thiếu ảnh mà không ai được báo.
  Căn cứ: Nhẹ vì lỗi lộ ra ngay khi mở hồ sơ và chụp lại được, không mất hay lộ dữ liệu; sửa sau rẻ.
  file: `scripts/ui-capture-login.mjs`
  severity: medium
  Đề xuất: known-limits

- **Phép đo E7 «tự thu bằng nhau ở ba nguồn» luôn đúng vì cả ba hàm cùng đọc một helper (r1)**
  Người dùng thấy gì: Dòng báo «tự thu bằng nhau ở ba nguồn» luôn xanh nên không phát hiện được nếu cách đếm listing tự thu bị sai ở các khu vực nhiều tầng. Người đọc có thể tin hơn mức bằng chứng cho phép.
  Căn cứ: Không làm sai số hiển thị cho người dùng, chỉ làm bằng chứng kiểm yếu hơn vẻ ngoài; ghi nhận để người ký biết, bổ sung phép đo độc lập khi có dịp.
  file: `scripts/hieu-chuan-do.mjs`
  severity: low
  Đề xuất: known-limits

- **Hình dạng 3 (assert chuỗi có mặt thay cho quan hệ): HC-AC-6 quét mã nguồn page.tsx thay vì so số đầu trang với số thẻ đã vẽ (r1)**
  Người dùng thấy gì: Bài kiểm tự động cho việc «số thị trường ở đầu trang bằng số thẻ vẽ» chỉ đọc mã nguồn, nên nếu sau này sửa trang làm hai con số lệch nhau thì bài kiểm vẫn có thể xanh.
  Căn cứ: Hiện trang vẫn đúng, rủi ro chỉ là bắt chậm một lỗi tương lai ở màn vận hành nội bộ; người vận hành thấy lệch là báo được, sửa sau rẻ.
  file: `app/tests/hieu-chuan.test.tsx`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 2 (fixture viết tay đúng khuôn bên đọc): chiều đỏ của UC-AC-9 bị runner giả quyết định sẵn, không chạy bản cũ của ui-capture.sh (r1 · tệp đã đổi)**
  Người dùng thấy gì: Bài kiểm «bản cũ không đăng nhập thì bị đưa về trang đăng nhập» dùng bản giả tự trả kết quả định sẵn, nên chưa đo hành vi thật của bản cũ. Ảnh chụp thật mới là bằng chứng đăng nhập thành công.
  Căn cứ: Không ảnh hưởng người dùng cuối, chỉ làm bằng chứng tự động yếu hơn; ảnh chụp thật bù lại phần chính nên chấp nhận và ghi vết.
  file: `scripts/ui-capture-login.test.mjs`
  severity: medium
  Đề xuất: known-limits

- **Hình dạng 4 (assertion âm tính một mình): đối chứng định nghĩa cũ ở HC-AC-2 chỉ assert notEqual 7, không ghim giá trị cũ (r1)**
  Người dùng thấy gì: Bài kiểm đối chiếu «cách đếm cũ ra số khác» có thể xanh ngay cả khi truy vấn cũ trả rỗng, nên chứng minh yếu hơn mong muốn. Số mà người vận hành thấy trên trang không bị ảnh hưởng.
  Căn cứ: Chỉ là phép đối chiếu minh hoạ cho định nghĩa đã bỏ, không tác động đến số hay trang người dùng; chi phí siết lại vượt xa lợi ích nên ghi vết, không mở việc.
  file: `app/tests/hieu-chuan.test.tsx`
  severity: low
  Đề xuất: wont-fix

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).
