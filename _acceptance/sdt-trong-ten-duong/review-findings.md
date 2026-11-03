## Trong hợp đồng

- **goSdtKhoiCan không gỡ số đã nằm trong mục enrichment_log cũ, và ca test bỏ qua đúng tình huống này**
  AC: AC-3
  file: `pipeline/lib/duong-can.mjs:13`
  severity: medium
  source: conventions
  detail: goSdtKhoiCan chỉ đặt `street = NULL` và nối thêm mục `go-sdt-duong`. Nó không đụng mục cũ `{src:'resolve-properties', field:'street', value:<số>}` do dienDuongCan của DS1 ghi.

  Ô căn nào được DS1 điền số trước bản vá thì sau bản vá vẫn còn số trong `enrichment_log`. Cột này nằm trong CLOUD_ALLOW.properties (pipeline/sync-cloud.mjs:107), nên số vẫn lên cloud. Điều đó trái luật 6 của AGENTS.md (số chỉ trả khi bấm «Xem số»), trái AC-3 («toàn bộ nhật ký của các ô không chứa dãy số») và trái chính lý do ở comment của hàm.

  Tình huống này xảy ra được: DS1 chưa vào origin/main và dòng sổ d-20261103T043544Z-12 ghi PR #291 gộp trước PR này. Nếu job đêm chạy giữa hai lần gộp, dienDuongCan bản DS1 (chưa lọc số) sẽ ghi log mang số vào ô trống từ các tin nguồn có số. Bản chép đo 03/11 có 0 mục như vậy, nên E5 hiện không bắt được. Sau khi gộp cũng không có bước nào dọn.

  Itest không phủ nhánh này: dung3 (pipeline/scripts/sdt-trong-duong.itest.mjs:209) và dung5 tạo ô mang số bằng `UPDATE properties SET street` viết tay, không có mục log mang giá trị. Trong khi đó AC-3 ghi «ô căn và nhật ký sinh bằng resolve-properties thật». Ô có số vì vậy không bao giờ có log mang số, và `logCoSo` xanh một cách rỗng ở nhánh này.

  Hướng xử lý gợi ý: che giá trị trong mục `street` cũ của các ô bị gỡ, hoặc chốt thứ tự gộp cùng phép đếm log trên DB máy thu ngay trước khi gộp. Đồng thời thêm hàng test có log sinh bằng dienDuongCan bản không lọc.
  rationale: AC-3 đòi toàn bộ nhật ký của ô không chứa dãy số; mục log cũ mang số còn lại làm AC-3 thất bại.

- **Hình dạng 3 — Assert chuỗi có mặt thay cho quan hệ: «không keep thì xoá rồi chèn»**
  AC: AC-5
  file: `pipeline/scripts/sdt-trong-duong.itest.mjs:310`
  severity: medium
  source: measurement
  detail: `xoaChen.includes("DELETE FROM public.") && xoaChen.includes('"sale_offers"')` kiểm hai chuỗi con độc lập, trong khi lời hứa ở thông điệp («không keep thì xoá rồi chèn») và E6 («có DELETE khi không keep») là quan hệ: có DELETE trên đúng sale_offers, đứng trước INSERT. `"sale_offers"` luôn có mặt nhờ câu INSERT, còn `DELETE FROM public.` thoả được bằng DELETE của properties. Nếu bản sai bỏ DELETE của sale_offers mà giữ của properties, assert vẫn xanh và cloud giữ hàng cũ. Biến thể keep cũng phát `DELETE FROM public."t" d WHERE NOT EXISTS` (sync-cloud.mjs dòng 373), nên assert không phân biệt hai nhánh bằng chuỗi DELETE. Cần ghim `DELETE FROM public."sale_offers";` và vị trí của nó trước INSERT tương ứng.
  rationale: AC-5 đòi câu tráo ghi đè hai cột trên lô đồng bộ; assert lỏng không chứng minh được điều đó.

- **Hình dạng 4 — Âm tính một mình: «ô căn sạch đổi hoặc mất = 0» không có ca đỏ, không có mẫu số tối thiểu**
  AC: AC-4
  file: `pipeline/scripts/do-sdt-trong-duong.mjs:102`
  severity: medium
  source: measurement
  detail: `canDoi` chỉ được kiểm bằng `if (canDoi) vipham.push(...)` ở dòng 104. Ma trận chiều đỏ ở chungDo (dòng 123-124) chỉ có `--gai-sdt` và `--gai-mat-duong`, không ca nào ghim thông điệp «ô căn đường sạch đổi hoặc mất». Khác với tin nguồn (`mau < MAU_SO_TOI_THIEU`), phép này không có sàn cho số ô sạch, nên 0 trên 0 vẫn đạt. Khi phép so ở dòng 102 sai, thước vẫn in 0 và thoát 0. Điều này trái dòng đầu evals.yaml «Mỗi phép đo có ca đỏ, ghim thông điệp» và E5 cũng không liệt kê chiều đỏ cho dòng này.
  rationale: AC-4 nêu rõ 0 ô căn đường sạch bị đổi hoặc mất; phép đo này không có ca đỏ nên có thể đạt rỗng.

- **Hình dạng 4 — Ca đỏ --gai-mat-duong không đi qua phép so nên không đối chứng được «tin nguồn sạch lệch chữ»**
  AC: AC-4
  file: `pipeline/scripts/do-sdt-trong-duong.mjs:86`
  severity: medium
  source: measurement
  detail: `let lech = co("--gai-mat-duong") ? 1 : 0` khởi tạo sẵn kết quả, còn chungDo chạy ca đỏ với `--chi-doc` (dòng 126), nên khối `if (!CHI_DOC)` chứa `sauTin.get(id) !== ra` (dòng 96) bị bỏ qua. Ca đỏ chỉ chứng minh `if (lech) push` in đúng chữ. Đột biến phép so thành không bao giờ tăng `lech` thì ca đỏ vẫn xanh. Dòng đầu evals.yaml lại nói «riêng E5 là cờ gài trong thước qua đúng vòng đếm», điều này không đúng với cờ này; `--gai-sdt` thì có qua `dem()`. Vế `lech = 0` trên lượt thật vì thế không có đối chứng dương nào chạm phép so, chỉ có sàn mẫu số.
  rationale: AC-4 đòi mọi tin nguồn sạch mang đúng chữ docDuong; ca đỏ không chạm phép so này.

- **Hình dạng 4 — «Không dòng in nào chứa dãy số» chỉ kiểm ở lượt --chi-doc, không kiểm lượt chạy transform và resolve**
  AC: AC-4
  file: `pipeline/scripts/do-sdt-trong-duong.mjs:127`
  severity: low
  source: measurement
  detail: `!coSo(r.stdout)` chỉ áp lên stdout của tiến trình con `--chi-doc`, lượt không gọi runTransformChotot và chayResolve. Lượt thật (dòng 73-74) in log của hai hàm đó (số phát biểu rút, số ô gỡ, city_code lạ) ra stdout của chính nó, và không có gì bắt lại để kiểm. AC-4 hứa «không dòng in nào chứa dãy số» cho cả lượt đo, nên assert âm tính này chạy trên đường vốn không có nguồn in log pipeline, không có đối chứng ở đường thật. Trên ca đỏ `--gai-sdt`, giá trị gài cũng không bao giờ được in theo cấu trúc code.
  rationale: AC-4 hứa không dòng in nào chứa dãy số trong lượt đo, mà phần in của lượt thật không được kiểm.

- **Hình dạng 1 — Đo chỉ dẫn thay vì đầu ra: kiemJobDem grep văn bản chotot-daily.sh, dòng đã comment vẫn khớp**
  AC: AC-4
  file: `pipeline/scripts/do-sdt-trong-duong.mjs:48`
  severity: low
  source: measurement
  detail: Thước chạy runTransformChotot và chayResolve qua import, còn việc job đêm làm đúng thế chỉ được đối chiếu bằng regex trên chữ của tệp shell. Regex không neo đầu dòng (`/job_run chotot-daily transform-chotot node ...\s*$/m`), nên dòng `# job_run ...` đã comment vẫn cho «đúng». Chú thích và thông báo còn nói «đúng hai bước», trong khi tệp có bốn bước (dòng 67-70, thêm transform-media và refresh-bait-gap) mà kiểm tra chỉ nhìn thứ tự hai dòng. Đây là bằng chứng về chữ chỉ dẫn, không phải về thứ job thật thực thi.
  rationale: AC-4 đòi chotot-daily.sh gọi đúng hai bước không kèm đối số; kiểm tra bằng regex để lọt dòng đã comment.

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **Comment của hai executor mới ghi sai mã eval so với evals.yaml**
  Người dùng thấy gì: Chú thích trong cấu hình chấm ghi lệch mã phép đo, người chấm lại có thể mở nhầm phép đo. Người dùng cuối không bị ảnh hưởng.
  Căn cứ: Nhẹ, không mất hay lộ dữ liệu, chỉ gây nhầm khi tra cứu và sửa sau rất rẻ.
  file: `_acceptance/config.yaml`
  severity: low
  Đề xuất: known-limits

## Chưa adversarial-verify (refuter chết)

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).
