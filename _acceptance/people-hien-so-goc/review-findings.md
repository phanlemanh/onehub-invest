# Review findings: people-hien-so-goc (round 2)

## Trong hợp đồng

- **Hình dạng 5 (tuyên quét LỚP, thiếu ma trận): bộ quét số mù dạng thứ sáu, dạng +84 có dấu tách và dạng URL-encode**
  file: `_acceptance/people-hien-so-goc/probes/html-vai.mjs:20`
  severity: medium
  AC: AC-3
  source: measurement
  detail: Regex DANG (html-vai.mjs:20), chép y hệt ở QUET_SO (danh-ba-nguoi-tren-ops.test.tsx:520, danh-ba-nguoi-deals-lien-he.test.tsx:18), được dùng để kết luận viewer 0 số ở mọi dạng. Tôi chạy regex này: `(+84) 912-345-678`, `+84 912 345 678`, `84 912 345 678`, `%2B84912345678`, `+8491234…` đều ra 0 khớp. `(+84) 912-345-678` chính là dạng 6 mà probe gửi vào `?q=` (dòng 97-99). Vì vậy dòng `viewer · tìm dạng 6 · html 0 · rsc 0` không chứng minh trang không chép lại số. tuKiem() (dòng 54) chỉ tự kiểm lyDoChuaVe, không có ma trận dương của demSdt theo từng dạng. Contract AC-10 nói «số ở bất kỳ chỗ nào khác vẫn tính» nhưng các dạng trên không được tính. E3 (AC-3) dựa hoàn toàn vào bộ quét này, trong khi AC-3 đang đứng thay sd3/E7 và sdt-luu-goc/E8 có phép quét chặt hơn: mọi chuỗi 3+ chữ số của số gốc, kèm đối chứng đỏ cắt 8 ký tự. Chuỗi cắt `+8491234…` giờ lọt qua QUET_SO.
  rationale: AC-3 nêu rõ các dạng +84, 84, 0 và tách nhóm không được xuất hiện cho vai Người xem, mà bộ quét dùng làm bằng chứng không bắt được các dạng tách nhóm có khoảng trắng.

- **Hình dạng 5 (tuyên quét LỚP, thiếu ma trận): lọc trường theo vai của dealTheoVai có 8 trường, ca AC-6 không đo 3 trường**
  file: `app/tests/danh-ba-nguoi-deals-lien-he.test.tsx:96`
  severity: medium
  AC: AC-6
  source: measurement
  detail: Đầu tệp nói vai Người xem «không nhận trường liên hệ nào, cả trong cây phần tử», nhưng assert viewer (dòng 94-96) chỉ dò số, TEN, NHOM, `tel:`, BAI. dealTheoVai xoá sellerName, sellerPhone, groupName, brokerNAds, brokerMedianGap (liên hệ) và mediaPath, mediaUrl, postText (nội dung). Không assert nào nhìn brokerNAds hay brokerMedianGap, dù fixture đặt 3 và 10: bỏ hai khoá này khỏi nhánh lienHe thì `"brokerNAds":3` nằm trong cây của viewer mà ca vẫn xanh. DEAL.mediaUrl = null (dòng 45) nên nhánh ảnh CDN không được đo: bỏ `mediaUrl: null` khỏi nhánh noiDung thì không ca nào đỏ. Ở dữ liệu thật có url, vai ops sẽ thấy `<img>` vì thẻ vẽ theo `showContact && (d.mediaPath || d.mediaUrl)`. Vậy «ops 0 <img>» của AC-6 chỉ đã đo nhánh mediaPath. Thiếu ma trận vai × trường viết trước.
  rationale: AC-6 đòi vai Người xem không có trường liên hệ nào và vai Vận hành không có ảnh, nhưng ca đo bỏ sót một số trường và nhánh ảnh CDN.

- **Hình dạng 3 (assert chuỗi có mặt trong khi lời hứa là QUAN HỆ): SHS-AC-2 không buộc «Đã nghỉ» và liên kết gọi vào đúng dòng số**
  file: `app/tests/danh-ba-nguoi-tren-ops.test.tsx:634`
  severity: medium
  AC: AC-2
  source: measurement
  detail: AC-2 hứa «dòng đã nghỉ kèm Đã nghỉ». Assert chỉ đếm `html.split("Đã nghỉ").length - 1 === 1` trên cả trang của người có một số sống (…661) và một số nghỉ (…662). Đảo cờ thành `retired: a.retired_at == null` thì vẫn đúng một nhãn, nhưng nhãn nằm ở số đang dùng, và ca vẫn xanh. DBN-AC-4 (dòng 257) cũng chỉ đếm nên không bắt được. Tương tự, các dòng 632-633 kiểm `html.includes("0966 666 661")` và `html.includes("tel:+84966666661")` độc lập trên toàn trang, không gắn số hiện với href cùng dòng. Trong khi đó AC-1 đã bóc từng hàng bằng hangCua/oDau.
  rationale: AC-2 hứa dòng đã nghỉ kèm nhãn «Đã nghỉ» và liên kết gọi theo từng dòng, nhưng ca đo chỉ đếm chuỗi trên cả trang.

- **Hình dạng 4 (âm tính một mình): vế «0912 không ra người có số» không thể đỏ, vì 0912 không là chuỗi con của số nào trong fixture**
  file: `app/tests/danh-ba-nguoi-tren-ops.test.tsx:684`
  severity: medium
  AC: AC-4
  source: measurement
  detail: Ca `["0912", [SHS.CHU], ""]` được khai là đo «số dở: như chữ, không ra người có số» (E4). Bí danh lưu dạng E.164 `+84912345678`, không chứa chuỗi con `0912`; các số khác trong fixture cũng không chứa. Thêm kind `sdt` vào nhánh strpos của LOC (đột biến cho phép dò một phần số, đúng thứ cần chặn) thì `0912` vẫn chỉ ra SHS.CHU và ca vẫn xanh. Vế dương (khớp tên chứa 0912) có tác dụng, vế âm thì không có đối chứng đỏ. Phép đo có tác dụng phải dùng chuỗi dở là chuỗi con thật của E.164, ví dụ `91234`, hoặc thêm bản đột biến.
  rationale: AC-4 đòi chuỗi dở «0912» tìm như chữ thường, không ra người có số; ca đo vế này không thể phát hiện lỗi.

- **Hình dạng 4 (âm tính một mình): «người không số không có tel:» đạt rỗng khi không tìm thấy hàng**
  file: `app/tests/danh-ba-nguoi-tren-ops.test.tsx:608`
  severity: low
  AC: AC-1
  source: measurement
  detail: `assert.ok(!hangCua(html, SHS.KS).includes("tel:"))`, trong khi hangCua trả `?? ""` khi không có hàng khớp khoá. Nếu hàng SHS.KS biến mất khỏi bảng, chuỗi rỗng làm assert đạt. Trong SHS-AC-1 không có assert nào rằng hàng KS tồn tại, và cũng không có chiều đỏ cho vế này (hai chiều đỏ trong ca đo số hàng và che số).
  rationale: AC-1 đòi người không có số không có liên kết gọi, nhưng ca đo vẫn đạt khi hàng người đó không tồn tại.

- **Hình dạng 3 (assert sự có mặt/số đếm trong khi lời hứa là QUAN HỆ): SHS-DC đếm hàng có giá trị truthy thay vì so người với số của họ**
  file: `app/tests/danh-ba-nguoi-doi-chieu.test.tsx:128`
  severity: low
  AC: AC-7
  source: measurement
  detail: `if (r.sdtKind === "sdt" && hangNguoi(r, [], true).sdt) hienXem++` rồi `assert.equal(hienXem, n)` chỉ so số đếm và tính truthy. Trên đường danh sách, hàng hiện nhãn che hay số của người khác vẫn được tính. Không có so sánh tập partyKey hay giá trị hiện với `so` lấy từ SQL. Quan hệ người↔số chỉ được đo ở kiemTim, tức đường tìm, là nhánh chọn số riêng (`ds.find(... a.value === sdt)`), khác nhánh `dau(ds, sdt)` của danh sách không tìm.
  rationale: AC-7 đòi mọi người có bí danh sdt hiện số và tìm ra đúng người, nhưng ca đối chiếu chỉ đếm hàng có giá trị mà không so người với số.

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **Ảnh bằng chứng E10 chứa SĐT, tên người và tên nhóm thật, nằm ở đường dẫn sẽ được commit lên repo public**
  Người dùng thấy gì: Ảnh chụp màn hình dùng làm bằng chứng đang chứa số điện thoại và tên thật của người bán. Nếu lỡ đưa lên kho công khai thì số của họ lộ ra ngoài và không gỡ lại được.
  Căn cứ: Hậu quả nặng và không đảo ngược nếu lọt lên kho công khai, nhưng hiện chưa lộ và chỉ cần thay ảnh hoặc không đưa vào commit, nên đáng có một việc riêng để chặn.
  file: `_acceptance/people-hien-so-goc/evidence/E10-step2.png`
  severity: high
  Đề xuất: new-contract

- **Eval E8 đo cả portal-deals-airdna/E5 và khối 4 của lệnh kiểm cổng, nhưng paths và expected không khai**
  Người dùng thấy gì: Một bằng chứng kiểm tra có thể không bị đánh dấu là cũ khi tệp liên quan thay đổi sau này. Người dùng không thấy ảnh hưởng trực tiếp trên màn hình.
  Căn cứ: Chỉ là sổ sách của bộ nghiệm thu, không ảnh hưởng dữ liệu hay người dùng, và có thể ghi lại rồi sửa ở lần chạm kế tiếp.
  file: `_acceptance/people-hien-so-goc/evals.yaml`
  severity: medium
  Đề xuất: known-limits

- **/ops/deals mở tên người đăng và tên nhóm cho vai Vận hành mà không qua bộ che tên nguồn, khác /ops/people**
  Người dùng thấy gì: Trên trang Căn giá tốt, vai Vận hành có thể thấy tên người đăng hoặc tên nhóm có chứa tên nguồn thật, thứ lẽ ra chỉ hiện dưới dạng mã nguồn. Hôm nay đo trên dữ liệu thật chưa thấy ca nào bị lộ.
  Căn cứ: Chưa có ca lộ thật nhưng dữ liệu nguồn đã có tên khớp, người xem là nội bộ vai Vận hành, và sửa là một việc riêng gọn nên nên mở thành việc có hợp đồng.
  file: `app/src/components/ops/deal-card.tsx`
  severity: low
  Đề xuất: new-contract

- **ORDER BY mới viết cứng 'sdt' thay vì ALIAS_KIND.sdt**
  Người dùng thấy gì: Nếu sau này đổi tên loại bí danh số điện thoại, thứ tự người có số đứng trước có thể lặng lẽ sai. Hiện tại danh bạ vẫn đúng.
  Căn cứ: Không có hậu quả với người dùng hôm nay, chỉ là rủi ro bảo trì xa và sửa lúc nào cũng rẻ.
  file: `app/src/lib/ops/people.ts`
  severity: low
  Đề xuất: wont-fix

- **Còn hai chỗ gọi SĐT hoặc Căn giá tốt là tầng A, trái với điều vòng này sửa**
  Người dùng thấy gì: Hai tài liệu hướng dẫn nội bộ vẫn ghi số điện thoại người bán là bí mật, trái với quy định mới. Người dùng không bị ảnh hưởng nhưng người hoặc công cụ đọc tài liệu có thể làm sai luật.
  Căn cứ: Chỉ là chữ trong tài liệu, không lộ hay mất dữ liệu, sửa nhanh bất kỳ lúc nào.
  file: `.claude/skills/onehub-ui/routes.md`
  severity: low
  Đề xuất: known-limits

- **/ops/deals đưa tên người đăng chưa qua bộ che tên nguồn tới vai Vận hành**
  Người dùng thấy gì: Một tin có tên người đăng trùng với tên nguồn thật có thể làm vai Vận hành thấy tên nguồn thay vì mã nguồn trên trang Căn giá tốt. Hôm nay trong bốn tin đang hiện chưa có tin nào bị.
  Căn cứ: Là bí mật tầng cao nhất nhưng chưa lộ thực tế, mở rộng chỉ sang người nội bộ, và nên sửa thành việc riêng có thử nghiệm.
  file: `app/src/components/ops/deal-card.tsx`
  severity: medium
  Đề xuất: new-contract

- **getDeals vẫn âm thầm rơi về bản cloud trên máy thu khi gặp 42P01/42703, không ghi log**
  Người dùng thấy gì: Nếu cơ sở dữ liệu máy thu bị lệch cấu trúc, trang Căn giá tốt vẫn hiện thẻ nhưng mất hết liên hệ và không báo lỗi. Hôm nay cả bốn tin đều có số.
  Căn cứ: Chỉ xảy ra khi cấu trúc dữ liệu lệch, chưa có ca thật, người dùng thấy trang thiếu số rồi báo được; ghi lại như hạn chế đã biết là đủ.
  file: `app/src/lib/deals.ts`
  severity: low
  Đề xuất: known-limits

- **Hình dạng 5 (tuyên quét LỚP nhưng chỉ có điểm-case): E12 và AC-10 nói «mọi trang» nhưng probe chỉ tải một trang phân trang và một khoá người**
  Người dùng thấy gì: Bằng chứng chỉ kiểm một số trang mẫu của danh bạ chứ không duyệt hết mọi trang và mọi người, nên khả năng một trang ít gặp để lọt số cho vai Người xem chưa được loại trừ hoàn toàn.
  Căn cứ: Mỗi trang dùng chung một đường dựng nên rủi ro thấp, và việc ghi rõ đây là mẫu là đủ cho tới khi có số đo cho thấy cần quét rộng hơn.
  file: `_acceptance/people-hien-so-goc/probes/html-vai.mjs`
  severity: low
  Đề xuất: known-limits

⚠ Cụm ngoài vùng phủ: 3/14 lỗi rơi vào file không bộ đo nào phủ (_acceptance/people-hien-so-goc/evidence/E10-step2.png, _acceptance/people-hien-so-goc/evals.yaml, .claude/skills/onehub-ui/routes.md) — dừng và quyết: mở rộng hợp đồng hay rút phạm vi.
