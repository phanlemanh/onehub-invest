# Phát hiện S4 vòng 2 (đã xác nhận, đều ngoài hợp đồng)

## t1 · medium · ngoài HĐ → known-limits
**E11 (eval mới vòng này) khai `paths` thiếu nguồn FILL mà nó soát: carry-forward có thể mang màu cũ sang**

`_acceptance/sync-cloud-che-ten-nguon-moi-cot/evals.yaml:66`

E11 xanh hay đỏ một phần là do so FILL của nhánh với origin/main. `kiem-ho-so.mjs` đọc FILL từ `pipeline/sync-cloud.mjs` (`docFill(readFileSync(... 'pipeline/sync-cloud.mjs'))`). Thế nhưng `paths` của E11 chỉ có 5 tệp dưới `ap-may-thu/`, không có `pipeline/sync-cloud.mjs`. Kit (carry-plan.mjs dòng 11, 268-270) dùng chính `paths` để quyết có mang sang lượt trước hay không: 'Mang sang khi ĐỦ: paths không chạm diff-fix'. Như vậy, nếu một vòng sau đổi FILL (hoặc gộp main có FILL khác), E11 vẫn bị mang sang với màu xanh cũ mà không chạy lại. Đó đúng là kiểu lỗi vòng 1 mà E11 sinh ra để bắt (t1: lệnh sao lưu phải phủ đúng bảng main đang tráo). Lỗi cùng dạng ở E9: lời expected đổi vòng này thêm ca (c), là ca soát `data-api/src/routes/**` qua `MA_MARKETS`, đọc `routes/markets.ts`. Test còn chạy `app/src/lib/queries.ts` và import `cheDuLieu`, `syncOnce` từ `pipeline/sync-cloud.mjs`. Nhưng `paths` của E9 vẫn chỉ có `[pipeline/lib/che-ten-nguon-gia-tri.mjs, pipeline/sync-cloud-che.test.mjs]`. Cách sửa: thêm `pipeline/sync-cloud.mjs` vào paths của E11, và thêm `pipeline/sync-cloud.mjs`, `data-api/src/routes/**`, `app/src/lib/queries.ts` vào paths của E9.

_Lời thường:_ Ở vòng nghiệm thu sau, một phép kiểm có thể được giữ kết quả xanh cũ dù danh sách bảng cần sao lưu đã đổi. Người dùng cuối không thấy gì; chỉ làm bằng chứng nghiệm thu kém tin cậy hơn.

_Căn cứ:_ Chỉ ảnh hưởng độ chắc của bằng chứng nghiệm thu, không làm mất hay lộ dữ liệu của người dùng, và sửa sau rẻ.

## t2 · low · ngoài HĐ → known-limits
**kiem-ho-so.mjs không chạy từ gốc kho thì im lặng thoát 0 (xanh giả)**

`_acceptance/sync-cloud-che-ten-nguon-moi-cot/ap-may-thu/kiem-ho-so.mjs:95`

Điều kiện `isMain` so `process.argv[1]` với `path.resolve(ROOT, HO_SO, 'kiem-ho-so.mjs')`, trong đó `ROOT = process.cwd()`. Gọi từ thư mục khác gốc kho, ví dụ `cd pipeline && node ../_acceptance/.../kiem-ho-so.mjs`, thì `isMain` là false: không soát gì, không in gì, mã thoát 0. Lệnh này là thước của eval E11, mã 0 nghĩa là xanh, nên mọi lối gọi lệch chỗ đứng đều thành PASS giả. Executor `scc_ap` hiện chạy từ gốc kho nên chưa sai trong thực tế. Nhưng các thước khác của hồ sơ (ví dụ `kiem-kho.mjs`) đều thoát 2 có lý do khi không chạy được. Nên đổi thành thoát khác 0 khi cwd không phải gốc kho, hoặc suy ROOT từ `import.meta.url`.

_Lời thường:_ Nếu ai đó chạy phép kiểm hồ sơ từ sai thư mục, nó báo đạt mà thật ra chưa kiểm gì. Việc chạy thật hiện vẫn đúng chỗ nên chưa gây hại.

_Căn cứ:_ Chỉ là bẫy cho người chạy tay, không đụng dữ liệu người dùng, chạy lại đúng chỗ là xong.

## t3 · low · ngoài HĐ → known-limits
**Chiều đỏ «cấy ô bẩn» của E5 chỉ kiểm mã thoát khác 0, không kiểm bộ chặn (scan) là cái bắt**

`pipeline/lib/sync-cloud-kho-xet.mjs:96`

phanXet chỉ đỏ khi cayDo.exit === 0 (thông điệp «bộ chặn không bắt»). Nhưng runKho trả 1 theo hai đường: bộ chặn ném lỗi (KHO FAIL [scan]), hoặc bộ chặn để lọt rồi phép đếm thô ra khác 0 (return thoTong === 0 ? 0 : 1). Lỗi ở pha khác (read, gate-pre) cũng ra 1. Vậy nếu bộ chặn mọi bảng hỏng, để lọt ô bẩn của areas/area_sources, lượt cayDo vẫn thoát 1 nhờ phép đếm thô, và thước vẫn coi chiều đỏ «bộ chặn bắt» là đạt. Test KX dùng chữ KHO FAIL [scan] trong bản dựng, nhưng phanXet không đọc cayDo.text. Nên thêm điều kiện cayDo.text khớp KHO FAIL [scan].

_Lời thường:_ Phép thử cố ý cấy tên nguồn có thể báo đạt dù bộ chặn không phải thứ chặn lại, mà do một lý do khác làm lượt dừng. Bản thân việc che tên nguồn không bị ảnh hưởng.

_Căn cứ:_ Chỉ làm bằng chứng thử nghiệm yếu đi một chút, không làm lộ dữ liệu, sửa sau không tốn kém.

## t4 · low · ngoài HĐ → known-limits
**kiem-ho-so.mjs so FILL với origin/main mà không fetch: ref cũ thì soát FILL xanh giả**

`_acceptance/sync-cloud-che-ten-nguon-moi-cot/ap-may-thu/kiem-ho-so.mjs:88`

Điều 3 (FILL của nhánh = FILL của origin/main) dùng để bảo đảm lệnh sao lưu chạy từ nhánh trước khi gộp phủ đúng các bảng main sắp tráo. Lệnh đọc git show origin/main:pipeline/sync-cloud.mjs từ ref cục bộ và không chạy git fetch. Nếu sau lần fetch cuối main đã thêm bảng vào FILL, phép so vẫn bằng nhau và ra XANH. Khi ấy bản sao lưu trước gộp thiếu bảng đó mà không có dấu hiệu nào. Ở điều 2, coTren('origin/main', ...) cũng đọc ref cũ như vậy.

_Lời thường:_ Nếu bản main cục bộ đã cũ, phép kiểm có thể báo danh sách bảng sao lưu là đủ trong khi main đã thêm bảng mới, khiến bản sao lưu trước khi áp thiếu bảng đó.

_Căn cứ:_ Rủi ro chỉ xảy ra khi quên cập nhật main trước khi áp và người ký áp có thể tự kiểm lại, nên chấp nhận và ghi rõ.

## t5 · low · ngoài HĐ → wont-fix
**kiem-ho-so.mjs chỉ xanh khi chạy đúng từ worktree sync-cloud-che-ten: chạy lại ở chỗ khác thì đỏ giả**

`_acceptance/sync-cloud-che-ten-nguon-moi-cot/ap-may-thu/kiem-ho-so.mjs:64`

Hai lệnh «Trước gộp» trong README ghi cứng ~/dev/onehub-invest/.claude/worktrees/sync-cloud-che-ten/... Chạy E11 từ checkout chính (ROOT = MAIN_ROOT, vd. soát lại sau gộp) thì đường dẫn rơi vào root, rel thành .claude/worktrees/sync-cloud-che-ten/_acceptance/..., coTrenNhanh(rel) ra false và lượt đỏ. Chạy từ worktree hay máy khác (M5) thì đường dẫn nằm ngoài kho, cũng đỏ. Phép đột biến vong1 cũng khớp chuỗi đường dẫn ghi cứng này. Thước E11 vì thế không tái lập được ngoài đúng một chỗ đứng.

_Lời thường:_ Phép kiểm hồ sơ chỉ chạy đạt ở đúng một thư mục; chạy ở máy hay thư mục khác sẽ báo đỏ dù hồ sơ không sai. Người dùng không bị ảnh hưởng.

_Căn cứ:_ Chỉ gây báo đỏ giả, không mất hay lộ dữ liệu, và công cụ này dùng một lần cho đợt áp này nên sửa không đáng.

## t6 · low · ngoài HĐ → known-limits
**cho-ranh: nhật ký cho thấy lượt cuối đã kết thúc thì coi là rảnh, kể cả khi vẫn có tiến trình sync-cloud đang sống**

`_acceptance/sync-cloud-che-ten-nguon-moi-cot/ap-may-thu/cho-ranh.mjs:15`

trangThaiLuot trả ranh:true ngay khi sau dòng «sync bắt đầu» cuối có dòng kết thúc, không xét coTienTrinh. Lượt sync chạy mà không ghi vào cloud-sync.log (lượt tay, lượt mới vừa khởi động chưa in dòng bắt đầu) có tiến trình sống nhưng vẫn bị coi là rảnh. Lúc ấy sao-luu.mjs gửi câu đọc ngay giữa lúc bảng đang stage hoặc tráo. Như vậy lời hứa «phán theo cả nhật ký lẫn tiến trình» chỉ đúng khi nhật ký không còn dòng bắt đầu, hoặc khi lượt cuối chưa có dòng kết thúc.

_Lời thường:_ Khi có một lượt đồng bộ chạy tay mà không ghi nhật ký, bước sao lưu có thể bắt đầu đọc giữa lúc bảng đang được thay, nên bản sao lưu có thể không nhất quán.

_Căn cứ:_ Chỉ xảy ra khi có lượt chạy tay chồng lên và người áp có thể kiểm lại, nên ghi thành hạn chế đã biết thay vì mở việc.

## t7 · medium · ngoài HĐ → known-limits
**Hình dạng 2 — fixture VIẾT TAY đúng khuôn bên đọc: KX-1..KX-4 nạp chuỗi KHO/CHI tự gõ vào docKho/docChiMayThu, không round-trip từ runKho**

`pipeline/tests/sync-cloud-kho-xet.test.mjs:6`

Hằng `KHO` (dòng 6-15) và `CHI` (dòng 16) được gõ tay theo đúng regex của docKho (`^ {2}che (\S+): (\d+)$`, `^kho xong: .*?; (.*?); pha đọc\+che\+soát`) và docChiMayThu (`^(\S+) · (\d+) · (\d+)$`). Bên ghi thật là `runKho` ở pipeline/sync-cloud.mjs:1068-1091 (nó còn in thêm các dòng `  thô còn k: n` mà fixture không có) và `tổng · …` ở scripts/do-ten-nguon-cloud.mjs:238. Grep cho thấy không test nào gọi runKho hoặc lệnh `--chi-may-thu` rồi đưa đầu ra qua docKho/docChiMayThu: chỉ có tệp này import hai hàm đọc. Vì vậy KX-2 (xanh), KX-3 (mọi đột biến đỏ) và KX-4 chỉ chứng minh bộ đọc khớp với khuôn tác giả tự viết. Nếu bên ghi đổi định dạng thì CI không phát hiện, lệch chỉ lộ khi chạy probe E5 trên máy thu (ngoài CI).

_Lời thường:_ Nếu sau này định dạng báo cáo của lệnh đo đổi mà bộ đọc không đổi theo, kiểm thử tự động sẽ không phát hiện; chỉ lộ khi chạy đo thật trên máy thu.

_Căn cứ:_ Không làm mất hay lộ dữ liệu, lệch sẽ lộ ngay khi chạy đo thật và sửa sau rẻ.

## t8 · medium · ngoài HĐ → known-limits
**Hình dạng 5 — tuyên quét LỚP nhưng chỉ có điểm-case: ca canh (c) bảo «không route data-api nào đưa meta của dòng areas vào JSON» bằng regex chỉ liệt kê bốn tên biến**

`pipeline/sync-cloud-che.test.mjs:554`

`MAU_ROUTE_META = /\b(?:m|r|row|x)\.meta\b/` chỉ bắt `.meta` khi biến dòng tên đúng là m, r, row hoặc x. Tên test và lời expected của E9 (c) lại tuyên bố cả lớp: «không route data-api nào đọc `.meta` của dòng areas vào đầu ra». Các dạng khác vẫn lọt: `area.meta`, `a.meta` trong JS, `rows[0].meta`, destructuring `{ meta }`, spread `...m`. Chiều đỏ ở dòng 574-580 chỉ cấy đúng một điểm (`meta: m.meta` vào markets.ts), tức là cấy đúng một tên biến nằm sẵn trong danh sách. Không có ma trận viết trước gồm các cách một route có thể trả areas.meta, nên ca xanh không đủ chứng minh điều AC-9 (a) dựa vào: markets không nhạy với areas.meta.

_Lời thường:_ Phép canh chỉ bắt một số cách viết mã; nếu sau này có người viết một đường trả dữ liệu thị trường theo cách khác thì có thể không bị phát hiện. Hiện chưa có đường nào như vậy.

_Căn cứ:_ Rủi ro chỉ có khi mã mới được thêm trong tương lai, hiện không lộ gì và có thể siết test sau.
