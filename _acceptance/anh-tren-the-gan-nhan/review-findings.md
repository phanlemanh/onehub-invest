# Review findings: anh-tren-the-gan-nhan

Round 1, cây đã kiểm: db5b675a0c517be2a11a5f91040fa6ce050bf03f.

## Trong hợp đồng

- **Ảnh lỗi trước khi hydrate thì kẹt ở ô tải vĩnh viễn, không hiện «Ảnh không tải được» và Thử lại**
  file: `app/src/components/ops/labels/anh-bai.tsx:55` · severity: medium · source: bugs · AC: AC-5
  Thẻ `<img>` nằm trong HTML SSR của /ops/labels, và mỗi lần sang bài là tải lại toàn trang (`diTrang` = `window.location.assign`). React không phát lại `error` đã xảy ra trước hydrate: nhánh hydrate của completeWork chỉ gọi `prepareToHydrateHostInstance` và gắn listener, không đánh dấu update để gán lại `src`. Comment trong `next/dist/client/image-component.js:145-148` ghi đúng lỗi này: «If the image has an error before react hydrates, then the error is lost». Effect của OAnh chỉ xử lý ca thành công: `if (anhRef.current?.complete && anhRef.current.naturalWidth > 0) setTrangThai("co")`. Ảnh đã hỏng trước hydrate có `complete=true, naturalWidth=0` nên không chuyển sang "loi": Skeleton nằm mãi, không có Thử lại, lỗi bị nuốt im lặng. Bấm ô chỉ mở hộp xem với ảnh vỡ. Ca này chạm đúng nhóm hỏng mà AC-5 yêu cầu: design ghi 36/367 bài URL gốc trả 400, tức route trả lỗi nhanh, trong khi trang phải chờ JS tải và hydrate. Test E5 dùng `createRoot` và tự bắn sự kiện sau khi mount nên không phủ đường này. Cách sửa: khi `complete` đúng thì `naturalWidth > 0 ? "co" : "loi"`. Nguyên nhân kết luận từ đọc mã React 19.3 và next/image; lần chạy E10 trên trình duyệt thật cho thấy đúng triệu chứng này.

- **Đầu dò E7 nuốt lỗi truy vấn source_registry, phép quét tên nguồn vẫn xanh với tập tên miền thiếu**
  file: `_acceptance/anh-tren-the-gan-nhan/probes/kin.mjs:16` · severity: low · source: bugs · AC: AC-7
  Truy vấn `source_registry` có `.catch(() => ({ rows: [{ s: "" }] }))`. Khi truy vấn lỗi (đổi cột, sai quyền), mọi tên miền lấy từ `real_name`, `source_ids` bị bỏ mà không báo gì. Chốt `mien.size > 0` vẫn qua nhờ tập lấy từ bảng `media`, nên 'ok dong them khong co ten mien nguon' và 'ok ho so khong co ten mien nguon' xanh trên tập đã thiếu. Trong khi đó evals.yaml E7 yêu cầu tập lấy từ cả media lẫn source_registry. Hôm nay truy vấn chạy được (đã thử chỉ đọc), nên chưa có lỗi đang xảy ra; đây là fallback ẩn của một cổng kiểm tầng A. Cách sửa: bỏ `.catch` để phép đo đỏ khi không đọc được, và thêm chốt riêng rằng phần từ registry khác rỗng.

- **Hình dạng 4: âm tính với đối chứng lỏng — phép quét tên miền của E7 không bắt được URL có tên miền con, và `||` trong đối chứng che đúng lỗ này**
  file: `_acceptance/anh-tren-the-gan-nhan/probes/kin.mjs:25` · severity: high · source: measurement · AC: AC-7
  Dòng 25 dựng regex `(?<![a-z0-9.-])<miền>(?![a-z0-9-])`. Lookbehind loại ký tự `.` nên miền đứng sau tên miền con không khớp. Chạy thử với miền `foo.com`: `https://cdn.foo.com/x`, `www.foo.com`, `abc.foo.com/x` đều false; chỉ `https://foo.com/x` và `foo.com/x` là true. Dòng 19 lại rút tập miền từ `media_url` về hai nhãn cuối (chỉ thêm ba nhãn khi nhãn áp chót dài ≤ 3 ký tự), nên chính host có tên miền con trong bảng `media` có thể lọt qua. Các phép `quet(them) === 0` (dòng 26) và `quet(chuHoSo) === 0` (dòng 32) vì thế xanh dù dòng thêm có URL nguồn đúng dạng đó. Đối chứng dòng 36 là `quet("dong co abc." + m + "/x") >= 1 || quet(`dong co ${m}/x`) === 1`: vế đầu luôn bằng 0, vế sau gánh hết, nên đối chứng xanh mà không chứng minh được dạng có tên miền con bị bắt.

- **Hình dạng 4: âm tính không đối chứng — hai ca chặn đường dẫn nhắm vào tệp không tồn tại, nên bỏ lớp chặn vẫn xanh**
  file: `app/tests/labels-anh.test.ts:160` · severity: high · source: measurement · AC: AC-3
  Ca `file co ..` dùng `media/../../../ngoai/bi-mat.jpg`. `path.join` với snapshot `hanoi/<SNAP>` cho ra `<tmp>/snapshots/ngoai/bi-mat.jpg`, trong khi mồi nằm ở `<tmp>/ngoai/bi-mat.jpg` (dòng 106), tức thiếu một cấp `..`. Ca `ngoai thu muc media` dùng `other/a.jpg`, mà `before` không hề tạo thư mục `other`. Assert dòng 167-168 chấp nhận `403 || 404` và chỉ kiểm thân không chứa BI_MAT. Nếu bỏ regex `MEDIA_FILE` cùng `inMediaDir`, hai ca này vẫn nhận 404 do `realpath` không thấy tệp, và BI_MAT không thể xuất hiện vì mồi không ở đích. Ca `/etc/passwd` cũng không dùng mồi BI_MAT. Chỉ ca symlink thật sự có mồi ở đích. E3 hứa «mỗi ca chặn một dòng», nhưng các ca này không đỏ khi dòng chặn tương ứng hỏng, cũng không ghim mã lỗi của lớp chặn.

- **Hình dạng 5: tuyên quét lớp nhưng chỉ có điểm-case — test «cay khong doi qua moi ca» chỉ chạy 3 ca và chỉ băm ngay trước 3 ca đó**
  file: `app/tests/labels-anh.test.ts:185` · severity: medium · source: measurement · AC: AC-3
  Tên test là «qua moi ca», E3 hứa «Băm cây thư mục tệp giả trước, sau toàn bộ ca khớp». Thực tế `truoc = bamCay(goc)` được tính ngay trong test này (dòng 187), sau khi mọi ca ANH-AC-3 phía trên đã chạy xong (node:test chạy tuần tự). Giữa hai lần băm chỉ có 3 lời gọi tự viết: tệp hợp lệ, URL với layAnh giả, và `media/../x.jpg`. Một lần ghi đĩa trong các ca symlink, ngoài khoảng, sai vai... không bị phát hiện vì đã nằm sẵn trong `truoc`. Nhánh lấy hộ cũng dùng layAnh giả, nên `layAnhGoc` thật không nằm trong phép băm. Không có ma trận liệt kê trước để số ca khớp số phần tử.

- **Hình dạng 3: assert có mặt trong khi lời hứa là quan hệ — «doiChieu giu nguyen tru anh» không so với gì**
  file: `_acceptance/anh-tren-the-gan-nhan/probes/nap.mjs:117` · severity: high · source: measurement · AC: AC-6
  AC-6 và E6 hứa «đối chiếu lượt hai giữ nguyên trừ trường ảnh», tức một quan hệ giữa kết quả và mốc trước khi thay đổi. Dòng 117 chỉ kiểm `d.boDoc !== null && d.soTin === 1 && d.cuaToi.length > 0`. Không có mốc so sánh, không so giá trị của `boDoc`, và không đụng `aiDoc`, `the`, `truongHop`, `lyDo`, `groupName`, `postedAt`. Mất hay đổi giá trị các trường đó thì dòng `ok` vẫn in. Phép liền trước (dòng 116, «doiChieu khong co http») cũng chỉ quét `{t: d.text, a: d.anh}`, không quét cả `d` như dòng 75-77 làm với tinKe.

- **Hình dạng 3: hứa băm trên chữ gốc nhưng không có phép băm nào — `ok ghi nhan bam tren chu goc` và `bam chu khong doi`**
  file: `_acceptance/anh-tren-the-gan-nhan/probes/nap.mjs:87` · severity: medium · source: measurement · AC: AC-1
  AC-1 hứa «băm chữ khi ghi nhãn vẫn tính trên chữ gốc», E6 ghi `ok ghi nhan bam tren chu goc`. Dòng 87 chỉ kiểm `baiDeGhi().text === CHU\nU`, tức chuỗi trả về bằng chuỗi gốc, không tính băm nào. Dòng 88-89 đọc `text_hash` rồi so với `h-nap`, một giá trị seed viết tay ở dòng 60 và không phải băm của CHU; lúc đọc chưa có đường ghi nào chạy, và `grep text_hash app/src` không ra kết quả, nên mã app không đụng cột này. Vì thế `bam chu khong doi` không thể đỏ do thay đổi của vòng này. Quan hệ băm(chữ gốc) = `text_hash` chưa được đo.

- **Hình dạng 4: âm tính không đối chứng — băm `oneinvest khong doi` bỏ qua đúng các bảng mà lượt đo ghi**
  file: `_acceptance/anh-tren-the-gan-nhan/probes/nap.mjs:25` · severity: medium · source: measurement · AC: AC-8
  `bamThat` (dòng 25-29) chỉ băm định nghĩa `eval_labels_basis_check` và bốn cột của `eval_label_items`. Lượt đo ghi vào `eval_labels` (qua route POST), `stg_zalo_posts`, `silver_labels`, `field_assertions`, `enrichment_proposals`, `sale_offer_records`, `collection_units`, `users`. Nếu route ghi nhầm sang `oneinvest` thì dòng mới nằm ở `eval_labels`, hoàn toàn ngoài phép băm, và `ok oneinvest khong doi` (dòng 131, AC-8) vẫn xanh. Phép này cũng không có đối chứng chứng minh băm đổi khi `oneinvest` đổi; `doi chung: tro vao oneinvest bi tu choi` chỉ đo chốt tên DB trong `_db.mjs`.

- **Hình dạng 3: «nhan cu khong doi» đo nhãn viết sau 075, không phải nhãn cũ**
  file: `_acceptance/anh-tren-the-gan-nhan/probes/nap.mjs:119` · severity: medium · source: measurement · AC: AC-8
  AC-8 hứa nhãn cũ không đổi khi áp 075, tức quan hệ giữa dòng trước và sau migration. M075 được áp ở dòng 54-55, còn các dòng được băm do `post(a, ...)` và `post(b, ...)` tạo ở dòng 96 và 109, tức sau 075. Dòng 122-124 chỉ băm quanh lần áp lại nữa, lại lọc theo `item_id` của bài mồi. Các nhãn thật chép sang DB thử bằng `db-thu.sh` không được băm, và với `--neu-chua-co` DB thử giữ lại có thể đã mang 075 từ lượt trước. Comment nói «CHECK mới vẫn nhận căn cứ cũ», nhưng chỉ `chu_bai` được đo (`cu.n`); `ngu_canh_nhom` và `kien_thuc_nghe` không có dòng nào.

- **Hình dạng 4: âm tính không đối chứng — E4 soi «không có giá trị máy đọc» trên bản chạy mà seed không mồi giá trị nào**
  file: `_acceptance/anh-tren-the-gan-nhan/evals.yaml:42` · severity: medium · source: measurement · AC: AC-6
  E4 bước cuối và `expected` (dòng 42-43) yêu cầu HTML và phản hồi trang thật không có giá trị mồi của E6. Bản chạy dùng `probes/seed.mjs`, mà tệp này chỉ ghi `stg_zalo_posts`, `eval_label_items`, `collection_units`, `users`, `sessions`; không ghi `silver_labels`, `field_assertions`, `enrichment_proposals`. Mồi của E6 do `nap.mjs` tạo cho bài `anh-nap-1` ở lát `anh-nap`, và `silver_labels`, `enrichment_proposals` bị `don()` xoá khi xong. Bài của seed vì thế không có giá trị máy đọc nào để lộ, nên phép soi ở đây không thể đỏ dù trang có đọc bảng máy. Trong E6, «RSC» chỉ là `JSON.stringify` cây phần tử, nên AC-6 về «phản hồi của trang» không có phép đo nào chạy trên phản hồi HTTP thật kèm mồi.

- **Hình dạng 5: tuyên quét lớp «dạng tên miền» nhưng chỉ có điểm-case, phép quét dữ liệu thật còn hẹp hơn mã**
  file: `_acceptance/anh-tren-the-gan-nhan/probes/that.mjs:24` · severity: medium · source: measurement · AC: AC-9
  `LINK` trong `labels-anh.ts` dòng 39 liệt kê 10 đuôi: vn, com, net, org, me, link, ly, io, info, biz. `MIEN` của E9 (that.mjs dòng 24) chỉ quét `vn|com|net|org`, nên `ok 0 bai con ten mien trong chu hien` không thể đỏ với sáu đuôi còn lại trên 367 bài thật. Regex phụ ở labels-anh.test.ts dòng 34 cũng không có các đuôi đó. Về ca đơn vị, labels-anh.test.ts dòng 27-28 chỉ có một ca `www` và một ca tên miền trần `khac.com.vn`. Không có ma trận theo từng đuôi, nên bỏ `me` hay `io` khỏi `LINK` thì cả E1 lẫn E9 vẫn xanh. AC-1 và AC-9 hứa cho cả lớp «dạng tên miền».

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **Ghi chú chế độ của route /api/zalo-media thiếu `?nhan=&anh=`**
  Người dùng thấy gì: Người gắn nhãn không thấy gì khác. Chỉ có phần ghi chú cho người viết mã mô tả chưa đủ chế độ mới, dễ gây hiểu nhầm cho người đọc mã sau này.
  Căn cứ: Không ảnh hưởng người dùng và không mất dữ liệu, sửa lúc nào cũng rẻ nên ghi lại là đủ.
  file: `app/src/app/api/zalo-media/route.ts`
  severity: low
  Đề xuất: known-limits

- **Dòng AnhBai trong catalog thiếu ô previewUrl và không trả lời cột «Why not ReUI?»**
  Người dùng thấy gì: Người dùng không thấy khác biệt. Danh mục thành phần giao diện thiếu một ô và thiếu lý do vì sao tự làm thay vì dùng thành phần có sẵn.
  Căn cứ: Chỉ là tài liệu nội bộ, không mất dữ liệu, bổ sung sau rất rẻ.
  file: `.claude/skills/onehub-ui/catalog.md`
  severity: low
  Đề xuất: known-limits

- **Danh thiếp JSON bị coi là thẻ xem trước link: số điện thoại biến khỏi chữ hiện, người gắn không thấy SĐT**
  Người dùng thấy gì: Với các bài dạng danh thiếp, người gắn nhãn không còn thấy số điện thoại người bán trên thẻ và có thể ghi nhầm là không suy ra được số.
  Căn cứ: Ảnh hưởng chất lượng nhãn ở một nhóm bài nhỏ (khoảng 126 bài trên toàn bảng), không mất dữ liệu gốc nhưng nhãn sai khó nhận ra sau khi đã lưu; nên làm thành việc riêng có ca thử.
  file: `app/src/lib/labels-anh.ts`
  severity: medium
  Đề xuất: new-contract

- **Hình dạng 4: âm tính không đối chứng — «phan hoi khong lo url» chỉ quét header do chính fake dựng, không quét thân**
  Người dùng thấy gì: Phép thử chưa chứng minh được rằng ảnh lấy hộ qua máy chủ không để lộ địa chỉ gốc trong phản hồi; thực tế hiện chưa thấy rò rỉ.
  Căn cứ: Chưa có dấu hiệu lộ thật, người dùng không bị ảnh hưởng ngay; ghi lại để bổ sung phép thử sau.
  file: `app/tests/labels-anh.test.ts`
  severity: low
  Đề xuất: known-limits

⚠ Cụm ngoài vùng phủ: 2/15 lỗi rơi vào file không bộ đo nào phủ (.claude/skills/onehub-ui/catalog.md, _acceptance/anh-tren-the-gan-nhan/evals.yaml) — dừng và quyết: mở rộng hợp đồng hay rút phạm vi.
