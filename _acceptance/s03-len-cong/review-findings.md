# Review findings: s03-len-cong (round 1)

## Trong hợp đồng

- **Thị trường chỉ có tin cấp thị trường hiện «Đang thu thập» dù có tin hợp lệ** — `app/src/lib/offers-public.ts:152` — severity: high — AC: AC-8 — source: bugs
  Diff đổi getOfferWards từ `(a.id = $2 OR a.parent_id = $2)` sang `a.parent_id = $2 AND a.region_type = 'submarket'`, nên tin mang mã thị trường không còn được đếm. Nhưng app/src/components/listing/offers-region.tsx:34 vẫn dùng `wards.length === 0` để kết luận thị trường chưa có tin. Nó trả Empty và bỏ qua `rows`, `total` mà getPublicOffers đã trả. Hệ quả: tin S03 cấp thị trường qua VISIBLE nhưng không hiện trên trang tin rao của thị trường không có phường. DB local có 32/34 thị trường không có phường, chỉ vn-hanoi và vn-hcmc có. Sổ nháp có một đơn vị khai vn-tinh-hung-yen, nên trường hợp này có thể xảy ra ngay khi áp sổ. Theo logic, Hà Nội và TP.HCM cũng dính khi một `kind` chỉ có tin cấp thị trường. Không có lỗi hay log nào, trang chỉ nói sai là đang thu thập. Phép đo E11 đếm theo VISIBLE vẫn tính các tin này là đã lên cổng, nên số đo cao hơn số người dùng thấy. Test AC-8 chỉ gọi getPublicOffers và getOfferWards trên thị trường có phường, các ca E9 chỉ dùng thị trường rỗng, nên không bắt được. Cách sửa: quyết định nhánh rỗng theo số tin của thị trường chưa lọc, không theo danh sách phường, và thêm ca thị trường không phường có tin cấp thị trường.

- **Phép đo sai nặng báo «đạt» và thoát 0 khi không chấm được tin nào** — `pipeline/scripts/do-s03-len-cong.mjs` — severity: low — AC: AC-9 — source: bugs
  Trong doLenCong, biểu thức `cham && sai / cham > DICH_SAI_NANG ? ', vượt đích, chỉ cảnh báo' : ', đạt'` cho ra «đạt» khi cham = 0, và hàm không ném lỗi. Điều này xảy ra khi `mau` rỗng hoặc mọi nhãn đều có `khong_cham`. Khi đó dòng in là «sai nặng: 0/0 (không có mẫu); đích 10%, đạt» và lệnh thoát 0. E11 lại yêu cầu lỗi đo phải thoát khác 0 và ghim «SL1-AC-9», và AC-9 yêu cầu đo trên mẫu 30 tin. Cách sửa: ném lỗi SL1-AC-9 khi cham = 0, và cân nhắc đặt sàn cho số tin chấm được, vì hiện không có sàn nào.

- **Hình dạng 4 (âm tính một mình): băm market_metrics, area_breakdowns «không đổi» không thể đỏ** — `pipeline/scripts/s03-len-cong.itest.mjs:179` — severity: high — AC: AC-2 — source: measurement
  Dòng 179-180 assert co.mm.h == nen.mm.h và co.ab.h == nen.ab.h sau khi chèn tin S03 cấp thị trường. pipeline/sql/300_metrics.sql và 400_breakdowns.sql chỉ đọc listings/nights, không dòng nào nhắc sale_offers, nên chèn vào sale_offer_records không thể đổi hai băm này với bất kỳ bản mã nào. Không có đối chứng dương: ca đỏ ở dòng 185-189 chỉ đột biến 500 và chỉ kiểm market_asset_stats. Hai bảng này cũng không có assert n > 0 (chỉ co.phuong.n có), nên hai bảng rỗng cho md5('') bằng nhau vẫn xanh. Vế «rollup giống hệt» của AC-2/E2 do đó không phân biệt được đúng và sai.

- **Hình dạng 4 (âm tính một mình): thước cấp thị trường = 0 và bait_gap_pct trống đúng hiển nhiên với 2 tin mồi** — `pipeline/scripts/s03-len-cong.itest.mjs:219` — severity: high — AC: AC-3 — source: measurement
  Dòng 219 assert v_ruler_p2_area có 0 dòng cấp thị trường, dòng 222 assert bait_gap_pct null. Định nghĩa view (db/migrations/044_nap_lai_khong_xoa.sql:87-102) đi qua properties/property_offers và có HAVING count(*) >= 5, còn ca chỉ mồi 2 tin thị trường (dòng 200) và các tin này không vào property_candidates. Với 2 tin, view không thể sinh dòng cấp thị trường, nên thước không bao giờ đỏ dù thiếu lọc. bait_gap_pct chỉ được gán khi JOIN r.area_id = o.area_id (refresh-bait-gap.mjs), nên cũng null một cách hiển nhiên. Không có đối chứng dương: không ca nào cho thấy tin cấp phường có gap khác null, và không có bản đột biến. E3 chỉ ghim ca đỏ cho 610 («chua-ro»). Riêng vế cặp ứng viên có đối chứng dương (dòng 227).

- **Hình dạng 5 (tuyên quét lớp, chỉ có điểm-case): ma trận «có và không có 067» không được chạy** — `pipeline/scripts/s03-len-cong.itest.mjs:122` — severity: high — AC: AC-5 — source: measurement
  Contract AC-5 hứa 069 áp được khi có và khi chưa có 067, 068; evals.yaml dòng 49 ghi «069 áp trên hàm bản 061 và bản có 067». Test chỉ chạy HAM_061 + [068, 069, 069] và HAM_061 + [069, 068, 068] (dòng 122-125). Không có biến thể 067: db/migrations không có tệp 067, không có fixture 067, itest không nhắc tới 067. withTx luôn qua napPhatBieu, tức nạp lại hàm 061 rồi 069. E6 vẫn liệt kê trục 067 nhưng số ca chạy không khớp số phần tử đã tuyên bố.

- **Hình dạng 5 (tuyên quét lớp, chỉ có điểm-case): «không đổi ô nào» chỉ băm 4 cột** — `pipeline/scripts/s03-len-cong.itest.mjs:107` — severity: medium — AC: AC-5 — source: measurement
  Tên ca «áp 069 không đổi ô nào» và AC-5 «phân xử lại mọi tin hiện có không đổi ô nào», nhưng md5 ở dòng 107-108 chỉ gồm offer_id, property_type, bedrooms, block_raw, street_raw. Thiếu bathrooms, một trong năm cột phân xử theo pipeline/CLAUDE.md mục 7. Cũng thiếu field_provenance và các cột đặc trưng của 061. Thay đổi ở các ô đó không làm ca này đỏ. Khác với AC-2, nơi hàm bam băm toàn dòng (t.*)::text.

- **Hình dạng 4 (âm tính một mình): kiểm stdout tìm chữ «group_key», không tìm giá trị khoá nhóm** — `pipeline/scripts/s03-len-cong.itest.mjs:275` — severity: high — AC: AC-6 — source: measurement
  Dòng 275 kiểm từng dòng ra không khớp /Nhóm SL1|group_key|Thẻ thử/. «group_key» là tên cột, không phải giá trị khoá. Nếu khaiSoNhom in giá trị thật (conversation_id) đứng riêng thì regex không bắt, trong khi AC-6/E7 hứa «stdout không chứa khoá». Không có đối chứng dương: không assert ra.length > 0, không có bản đột biến in khoá, nên ra rỗng cũng xanh. Giá trị khoá có sẵn trong DB (dòng 289 có đọc group_key) nhưng không được đưa vào phép so.

- **Hình dạng 4 (âm tính một mình): CLI «thoát khác 0» không ghim thông điệp, không có đối chứng dương** — `pipeline/scripts/s03-len-cong.itest.mjs:300` — severity: medium — AC: AC-6 — source: measurement
  Dòng 299-301 chỉ assert r.status != 0 và stdout rỗng cho lệnh thật với đơn vị lạ. Không ghim stderr, nên lỗi nối DB, lỗi import hay tham số sai cũng xanh. Không có lượt CLI thành công làm đối chứng, nên đường chạy thật chưa từng được chứng minh hoạt động và stdout của nhánh thành công không được đo. Vế «DB không đổi» của E7 cũng không được kiểm cho lệnh thật, chỉ có ở các ca gọi hàm trong giao dịch.

- **Hình dạng 5 (số assert = số phần tử giả): dòng «phường thị trường khác» trùng đầu vào dòng 1, E1 không đo confidence** — `pipeline/scripts/s03-len-cong.test.mjs:18` — severity: medium — AC: AC-1 — source: measurement
  MA_TRAN_KV dòng 18 có vào { khai: ["hanoi"], ph: null }, giống hệt dòng 15, nên ma trận thuần «năm dòng, số assert bằng số dòng» chỉ có bốn đầu vào phân biệt. Trục phường nơi khác không được đo ở lệnh của E1. evals.yaml dòng 11 còn hứa E1 đúng «khu vực, phuong_raw, confidence», trong khi ganKhuVuc chỉ trả { areaId, phuong } và tệp này không assert confidence. Ca DB có đo dòng c và confidence (itest dòng 383-400) nhưng thuộc executor s03_len_cong_db, không thuộc cmd của E1 (config:executors.test.s03_len_cong).

- **Hình dạng 2 (fixture viết tay đúng khuôn bên đọc): thẻ cấp thị trường được truyền sẵn wardHref={null}** — `app/tests/s03-len-cong.test.tsx:131` — severity: low — AC: AC-8 — source: measurement
  Dòng 131-134 render OfferCard với wardHref={null} viết tay rồi assert không có «&lt;a href». offer-card.tsx dòng 46 chỉ dựng Link khi wardHref khác null, nên assert đúng hiển nhiên, không phụ thuộc tin có phải cấp thị trường hay không. Giá trị thật đến từ wardHrefs[offer.ward.id] trong offers-explorer.tsx:278 và offers-region.tsx:50, không đi qua ca này. Cũng không có đối chứng dương render với wardHref chuỗi để chứng minh chuỗi tìm «&lt;a href» khớp được Link thật. Lưu ý: dòng 99 có kiểm getOfferWards không trả mã thị trường, nhưng chuỗi từ đó tới thẻ không được nối.

- **Hình dạng 3 (chuỗi có mặt thay cho lời hứa về giá trị): «không có mã nguồn» chỉ soát tên khoá** — `app/tests/s03-len-cong.test.tsx:79` — severity: low — AC: AC-8 — source: measurement
  Dòng 79 và 92 chỉ lọc Object.keys(r) theo /source/i. AC-8 hứa phản hồi không có mã nguồn, nhưng giá trị không được soát (ví dụ /^S0\d$/). Bản o.source AS origin sẽ lộ S03 mà vẫn xanh. Ca đỏ dòng 116 chọn đúng tên source_code nên khớp regex, vì vậy không phát hiện được giới hạn này.

- **Hình dạng 4 (âm tính một mình): E8 «giá, diện tích, kind không đổi» không có đối chứng đỏ** — `pipeline/scripts/do-s03-len-cong.mjs:216` — severity: medium — AC: AC-7 — source: measurement
  Dòng 205 đỏ khi lech.doi > 0, nhưng đối chứng duy nhất (dòng 210-216) đưa khu vực vào khoá gom và chỉ kiểm lb.thieu, lb.them. Nhánh doi của soTin (dòng 129) không có bản đột biến đổi giá, diện tích hay kind để chứng minh thước đỏ. Hàm soTin cũng không được s03-len-cong.test.mjs import. Lỗi so sánh ở nhánh này vẫn in «đổi ... 0» và exit 0.

- **Hình dạng 2 (không round-trip từ bên ghi): E11 chấm sai nặng trên tệp mẫu đóng băng, không đối chiếu với lượt đo** — `pipeline/scripts/do-s03-len-cong.mjs:273` — severity: medium — AC: AC-9 — source: measurement
  doLenCong dòng 268 lấy { so } và bỏ rows của lượt transform hiện tại. Dòng 273-283 chấm saiNang(m, n) trên kind, property_type, price_vnd, area_m2, market đọc từ research-local/s03-len-cong/mau-30.json. Không có so sánh mau với chonMau(rows), không kiểm offer_id còn trong rows, không so giá trị của m với dòng hiện tại. Dòng 285 in hằng SEED, không đọc trường seed của tệp. Sau khi đổi transform, số sai nặng vẫn là của lượt --mau cũ mà vẫn được báo cạnh số lên cổng mới. Hiện tại mau-30.json (05:44) mới hơn commit cuối đổi transform (05:36), nên chưa lệch, nhưng thước không có cơ chế phát hiện lệch.

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **Cờ --neu-chua-co không an toàn khi các lệnh chấm chạy song song**
  Người dùng thấy gì: Khi nhiều lệnh chấm chạy cùng lúc trên máy chưa có DB thử, bằng chứng có thể đỏ giả hoặc đo trên dữ liệu thiếu. Không ảnh hưởng người dùng cuối, chạy lại từng lệnh là qua.
  Căn cứ: Chỉ ảnh hưởng bàn chấm nội bộ, không mất dữ liệu thật, chạy lại tuần tự là hết và sửa không cần cho lần ra mắt này.
  file: `db/db-thu.sh`
  severity: medium
  Đề xuất: known-limits

- **Executor s03_len_cong_ranh dùng DB thử nhưng không tự dựng như các executor cùng họ**
  Người dùng thấy gì: Trên máy chưa có DB thử, một phép kiểm về ranh giới dữ liệu nhạy cảm có thể đỏ vì không nối được chứ không vì vi phạm. Người dùng cuối không thấy gì.
  Căn cứ: Chỉ làm bàn chấm đỏ giả trong một tình huống hẹp, chạy các lệnh kia trước hoặc dựng DB tay là qua, sửa rẻ nhưng không chặn ra mắt.
  file: `_acceptance/config.yaml`
  severity: low
  Đề xuất: known-limits

- **Ma trận bên đọc ghi «Sửa trong hàng này» cho ba tệp không hề đổi**
  Người dùng thấy gì: Hồ sơ cho người ký mô tả sai ba tệp là đã sửa trong hàng này, dù thực tế chúng không đổi. Sản phẩm không bị ảnh hưởng.
  Căn cứ: Chỉ là chú thích sai trong hồ sơ, không đổi hành vi nào của sản phẩm, sửa chữ là xong bất cứ lúc nào.
  file: `_acceptance/s03-len-cong/ben-doc.json`
  severity: low
  Đề xuất: known-limits

⚠ Cụm ngoài vùng phủ: 3/16 lỗi rơi vào file không bộ đo nào phủ (db/db-thu.sh, _acceptance/config.yaml, _acceptance/s03-len-cong/ben-doc.json) — dừng và quyết: mở rộng hợp đồng hay rút phạm vi.
