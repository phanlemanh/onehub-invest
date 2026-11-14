# Review findings: bang-hang-gia-m2 (round 1)

## Trong hợp đồng

- **Hình dạng 4 (chỉ có vế âm, không có đối chứng dương): ca «bảng chưa có hoặc rỗng» của AC-6/AC-7 dùng .every() trên mảng mà fixture luôn để rỗng**
  file: `app/tests/hang-gia-doc.test.tsx:142`
  severity: high
  source: measurement
  AC: AC-6
  detail: Ba assert `ds.rows.every((r) => r.rank == null)` (dòng 142), `j.data.every((r) => r.rank === undefined)` (dòng 201) và `r.body.data.every((x) => x.rank === undefined)` (dòng 223) muốn chứng minh rằng khi DB 'khong'/'rong' thì đường đọc rơi về thước CG8. Fixture `fixtureDoc` (hang-gia-fixture.mjs) không ghi `bait_gap_pct`, mà nhánh CG8 của dealsSql lại đòi `o.bait_gap_pct IS NOT NULL`. Fixture cũng chỉ có 2 tin S06, nên `v_ruler_p2` (cần n≥5 tin P2) không có nhóm nào, và nhánh CG8 của data-api cũng ra rỗng. Vì vậy cả ba mảng đều rỗng và `[].every(...)` luôn true. Sửa hỏng hẳn nhánh rơi về thì test vẫn xanh. Không có assert nào kiểm `length > 0` hay kiểm rằng thước CG8 thật sự trả về một tin P1. Tương tự, `mot.deal === null` cho tin S06 là vế âm đứng một mình: không có cặp «tin P1 doc-a1-0 vẫn mở được ở thước CG8».

- **Hình dạng 4 (chỉ có vế âm): phép lọc area và min_discount của /v1/deals được kiểm bằng .every() mà không kiểm mảng có phần tử**
  file: `app/tests/hang-gia-doc.test.tsx:192`
  severity: high
  source: measurement
  AC: AC-7
  detail: Dòng 192 `...body.data.map((r) => r.offerId).every((id) => id.startsWith("doc-a2"))` và dòng 195 `body.data.every((r) => r.discountPct >= 15)` đều xanh khi API trả `data: []`. Phép lọc area hay min_discount mà bỏ sót toàn bộ dòng thì vẫn qua, dù evals E7 hứa «area, market, limit, min_discount lọc đúng trên fixture». Thiếu đối chứng dương, chẳng hạn khẳng định tập trả về bằng đúng tập tin doc-a2 có nhãn đọc từ bảng, hoặc ít nhất một phần tử có discountPct ≥ 15.

- **Hình dạng 5 (tuyên bố phủ cả lớp nhưng ma trận thiếu phần tử): AC-6 hứa «không tin > 50% hay quá 45 ngày» mà fixture không có tin nào như vậy**
  file: `app/tests/hang-gia-doc.test.tsx:77`
  severity: medium
  source: measurement
  AC: AC-6
  detail: Evals E6 ghi dealsSql trả «không tin > 50% hay quá 45 ngày». Ở dòng 76, tập kỳ vọng `ky` được lọc bằng `<= 50`, nhưng trong fixtureDoc mức dưới trung vị cao nhất là doc-a1-0 với 30/51 ≈ 41,2%. Mọi tin có last_seen trong khoảng một ngày (`Date.now() - 86_400_000 + n*1000`). Như vậy hai ô loại trừ (trên trần 50%, quá hạn 45 ngày) không có phần tử nào trong ma trận. Bỏ điều kiện `<= ${NGUONG_LOAI_PCT}` hay `interval '45 days'` khỏi dealsSql thì phép so deepEqual ở dòng 77 vẫn xanh.

- **Hình dạng 4 (điều kiện âm không có đối chứng, đúng bằng 0 theo cấu trúc): so_khac_loai của AC-9 không thể khác 0**
  file: `pipeline/scripts/hang-gia-do.mjs:52`
  severity: high
  source: measurement
  AC: AC-9
  detail: CTE `thanh_vien` đã JOIN với điều kiện `h.property_type = k.property_type AND (k.thuoc = 'gia-thang-pn' OR h.kind = k.kind)`. Vì thế `count(*) FILTER (WHERE loai_tv IS DISTINCT FROM property_type OR (thuoc = 'gia-m2' AND kind_tv IS DISTINCT FROM kind))` luôn bằng 0. Chính chú thích dòng 5 cũng ghi «0 theo cấu trúc khoá». E9 lại xếp `so_khac_loai=0` vào điều kiện đạt, như thể bảng hạng không trộn loại hình hay bán/thuê. Phép đếm không đọc khoá nhóm thật của 420 nên không phát hiện được 420 gộp sai loại. `--doi-chung-hong` chỉ chứng minh `lech` đỏ, không có đối chứng nào cho so_khac_loai. Thêm vào đó, `hop_le` lấy tập tin được chấm từ chính `offer_price_rank.ly_do` (bảng đang kiểm), nên tin bị 420 loại nhầm sẽ không làm `lech` đỏ.

- **Hình dạng 4 (vế âm không có đối chứng dương trong lệnh nghiệm thu): E8 kết luận «0 dòng chứa tên nguồn» mà không chạy --doi-chung**
  file: `_acceptance/config.yaml:313`
  severity: medium
  source: measurement
  AC: AC-8
  detail: `cg9_sync` chỉ chạy `node scripts/hang-gia-ranh-gioi.mjs --base origin/main`, tức chỉ có vế âm `ten_nguon=0`, `bait_gap_doi=0`. Script có sẵn chế độ `--doi-chung` (cây tạm thêm một dòng mang tên nguồn, phải ra ten_nguon=1) nhưng lệnh của eval không gọi. Vì vậy bằng chứng của E8 không cho thấy bộ dò thật sự bắt được tên nguồn, ví dụ khi biểu thức chính quy đứng riêng với lookbehind `(?<![a-z0-9_./-])` lọc quá tay. Ngoài ra, «ca CG8 (refresh-bait-gap) không đổi» chỉ được đo bằng việc tên tệp `pipeline/refresh-bait-gap.mjs` không có trong diff, không đo đầu ra bait_gap_pct.

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **Bảng mới offer_price_rank đặt tên cột và giá trị enum bằng tiếng Việt, trái quy ước đặt tên đã chốt**
  Người dùng thấy gì: Tên các trường trong bảng hạng giá đang viết bằng tiếng Việt, trái quy ước chung của dự án. Người dùng cuối không thấy gì, nhưng đổi tên sau khi đã áp lên máy thật và cloud sẽ tốn công hơn.
  Căn cứ: Không ảnh hưởng người dùng cuối và không mất dữ liệu, nhưng càng để lâu sau khi áp lên cloud thì đổi tên càng đắt.
  file: `db/migrations/104_offer_price_rank.sql`
  severity: medium
  Đề xuất: new-contract

- **launch.json dùng chung bị định dạng lại toàn tệp và thêm cấu hình trỏ vào DB thử riêng của nhánh**
  Người dùng thấy gì: Tệp cấu hình chạy thử dùng chung bị định dạng lại toàn bộ, có thể gây xung đột với các nhánh khác khi gộp. Người dùng sản phẩm không bị ảnh hưởng.
  Căn cứ: Chỉ là chuyện bất tiện cho người làm, người dùng không thấy, và gặp xung đột thì gỡ được ngay lúc gộp.
  file: `.claude/launch.json`
  severity: low
  Đề xuất: known-limits

- **kind=rent_lt silently returns sale deals when offer_price_rank is missing or empty (app route)**
  Người dùng thấy gì: Khi bảng hạng giá chưa có, yêu cầu xem tin thuê lại nhận về danh sách tin bán mà không có dấu hiệu nào báo sai. Người xem có thể tưởng đó là tin thuê.
  Căn cứ: Chỉ xảy ra trong giai đoạn bảng chưa được áp lên cloud và hết hẳn khi bảng có dữ liệu; người dùng thử lại sau là hết.
  file: `app/src/app/api/v1/deals/route.ts`
  severity: medium
  Đề xuất: known-limits

- **data-api /v1/deals has the same silent fallback: kind=rent_lt returns sale offers when the rank table is missing**
  Người dùng thấy gì: API công khai khi chưa có bảng hạng giá sẽ trả danh sách tin bán dù khách hỏi tin thuê. Khách gọi API có thể nhận dữ liệu sai loại mà không biết.
  Căn cứ: Sai loại tin nhưng chỉ trong khoảng trước khi áp bảng lên cloud; không mất hay lộ dữ liệu và tự hết khi bảng có đủ.
  file: `data-api/src/routes/deals.ts`
  severity: medium
  Đề xuất: known-limits

- **Single-offer page: an offer not yet in offer_price_rank shows a wrong reason (CG8 'not enough listings to build a ruler')**
  Người dùng thấy gì: Tin mới đăng chưa kịp chấm hạng sẽ hiện lý do sai là phường chưa đủ tin để dựng thước, thay vì báo chưa chấm được. Người xem hiểu nhầm nguyên nhân.
  Căn cứ: Chỉ là chữ giải thích sai trong khoảng ngắn đến lần chấm đêm kế tiếp, không ảnh hưởng số liệu và tự hết.
  file: `app/src/lib/deals.ts`
  severity: low
  Đề xuất: known-limits

⚠ Cụm ngoài vùng phủ: 2/10 lỗi rơi vào file không bộ đo nào phủ (.claude/launch.json, _acceptance/config.yaml) — dừng và quyết: mở rộng hợp đồng hay rút phạm vi.
