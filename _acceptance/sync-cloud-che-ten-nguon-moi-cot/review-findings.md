# Phát hiện S4 vòng 1 (đã xác nhận)

## t1 · medium · trong HĐ AC-7
**Hồ sơ áp: lệnh sao lưu phải chạy TRƯỚC khi gộp từ checkout chính, nhưng tệp chỉ có trên nhánh**

`_acceptance/sync-cloud-che-ten-nguon-moi-cot/ap-may-thu/sao-luu.mjs:5`

Bước 1 mục 1 của README yêu cầu chạy mục 3 (sao lưu trước) TRƯỚC khi gộp. Lệnh ở mục 3 là `cd ~/dev/onehub-invest/pipeline && node ../_acceptance/sync-cloud-che-ten-nguon-moi-cot/ap-may-thu/sao-luu.mjs`, và chú thích dòng 5 của sao-luu.mjs cũng ghi «từ checkout chính». Nhưng checkout chính đứng ở main, mà trên main chưa có thư mục `_acceptance/sync-cloud-che-ten-nguon-moi-cot/` (đã kiểm: `ls` báo No such file). Vì vậy theo đúng hồ sơ thì lệnh sẽ hỏng ngay. Luật cổng Bằng chứng đòi đủ năm mục, trong đó có «sao lưu trước», nên mục này đang hở. Người áp sẽ phải tự chạy tệp từ worktree, tức là đi chệch hồ sơ đã ký. Khi chạy từ worktree, nhật ký mặc định vẫn trỏ checkout chính nên đúng, nhưng lệnh nạp `../../../pipeline/sync-cloud.mjs` lại lấy mã của nhánh, không phải mã main. README cần ghi đường chạy thật (từ worktree, hoặc lấy tệp ra từ nhánh).

## t2 · low · ngoài HĐ → known-limits
**sao-luu.mjs: choRanh ném TypeError khi nhật ký không có dòng «sync bắt đầu», và chờ mãi khi lượt cuối chết giữa chừng**

`_acceptance/sync-cloud-che-ten-nguon-moi-cot/ap-may-thu/sao-luu.mjs:17`

Nếu cloud-sync.log vừa xoay vòng hoặc không còn dòng `sync bắt đầu`, thì `iBd = -1` và `dong[iBd]` là undefined, nên `.split` ném TypeError trước lời gọi đầu. Ngược lại, nếu lượt cuối chết mà không in `sync xong` hay `SYNC FAIL` (bị kill, máy tắt), vòng lặp chờ 30 s mãi mãi vì không có trần. Bước sao lưu trước khi áp cần một lối dừng rõ ràng (báo lỗi có tên) cho cả hai ca này.

## t3 · high · trong HĐ AC-5
**Hình dạng 3 — E5 hứa QUAN HỆ giữa các giá trị nhưng lệnh chấm chỉ kiểm một số bằng 0**

`_acceptance/sync-cloud-che-ten-nguon-moi-cot/evals.yaml:30`

E5 hứa bốn quan hệ: (a) số ô che theo bảng.cột = số máy thu của do-ten-nguon-cloud.mjs --chi-may-thu, (b) pha đọc+che+soát ≤ 1,5 lần mã cũ ở merge-base và phần thêm ≤ 2 phút, (c) mọi biến đường cloud trỏ cổng chết và lsof không có socket tới Supabase, (d) chiều đỏ: bỏ --kho thì fail kết nối. Nhưng cmd `scc_kho` trong _acceptance/config.yaml:398 chỉ là `nice -n 10 node pipeline/sync-cloud.mjs --kho`. runKho (pipeline/sync-cloud.mjs:1067-1091) chỉ trả 0 khi `thoTong === 0`; dòng «kho bộ chặn: 0» là chuỗi in cứng chứ không phải số đo. Lệnh không chạy do-ten-nguon-cloud, không so hai bộ đếm, không chạy mã cũ, không so thời gian, không đặt env cổng chết, không gọi lsof. Các quan hệ này chỉ được đối chiếu bằng tay trong ap-may-thu/chay-kho.md. Exit 0 của lệnh chấm vẫn ra khi số che lệch với --chi-may-thu hoặc khi thời gian vượt trần.

## t4 · medium · trong HĐ AC-9
**Hình dạng 4 — SCC-9 markets: đối chứng dương đổi `name`, không phải chiều đỏ eval hứa (che làm rỗng cả ô meta)**

`pipeline/sync-cloud-che.test.mjs:378`

E9 ghi rõ chiều đỏ là «bản che làm rỗng cả ô meta (thay vì đổi khoá) thì ca markets đỏ nêu trường lệch». Ca chính chỉ kiểm `lech(truoc, sau) === null` (dòng 376), tức một khẳng định âm «không lệch». Đối chứng dương ở dòng 378-380 lại sửa `areas.name`, nên chỉ chứng minh phép so `lech` thấy được một trường mà route chắc chắn trả về. Nó không chứng minh route markets nhạy với `areas.meta`. Route `/:id` (data-api/src/routes/markets.ts:51-80) có SELECT a.meta nhưng không trả meta; chỉ submarkets đọc `sm.meta->>'market_score'`. Không có đột biến «làm rỗng meta» nào, nên «cùng JSON trước/sau che» không phân biệt được trường hợp che đúng với trường hợp route không hề đọc phần bị che.

## t6 · medium · trong HĐ AC-6
**Hình dạng 2 — cloud giả của do-ten-nguon-cloud.test trả dòng viết tay đúng khuôn bên đọc, câu SQL gửi cloud chưa từng chạy trên Postgres**

`scripts/do-ten-nguon-cloud.test.mjs:27`

`cloudGia().exec` không chạy câu SQL. Nó nhận diện câu bằng chuỗi con ('information_schema.columns', 'indisprimary', `FROM public."BANG"`) rồi trả mảng `{t, c, u}` viết tay, đúng tên bí danh mà doCloud đọc. Nó phân trang bằng regex `> \('([^']*)'\)` khớp với khuôn đang có của cauTrang. Vì vậy câu catalog `ANY(${arr})`, câu khoá chính dùng pg_index, câu trang so bộ khoá và LIMIT không câu nào được thực thi trên Postgres thật hay trên DB của lượt. Kết quả `{cloud, thoCloud}` của SCC-6 (dòng 65-70) đúng theo định nghĩa của fixture. Câu SQL hỏng cú pháp, hoặc kiểu trả của Management API khác (text[] hay jsonb ra dạng chuỗi), vẫn cho ca xanh. Lần đầu các câu này chạy thật là ở E7, sau khi áp.
