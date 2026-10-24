## Trong hợp đồng

- **Nhãn dự phòng «Giá trị khác» xoá mất giá trị thô ở 4 chỗ hiện, trái với hợp đồng của ops-labels**
  file: `app/src/components/ops/sources/registry-table.tsx:40`
  severity: low
  AC: AC-7
  source: bugs
  detail: Theo header của `app/src/lib/ops-labels.ts`, giá trị chưa có nhãn trả về «Giá trị khác» kèm `known: false`, «để nơi hiện in mã trong `<code>`». Thế nhưng các chỗ hiện mới chỉ in `.label` và bỏ mã gốc: `registry-table.tsx` (`sourceStatusLabel(row.original.status).label`), `collections/feeds-grid.tsx:47` (badge trạng thái nguồn không phải active), `review-card.tsx:119` (OfferCard `propertyTypeLabel(offer.property_type).label`) và `review-card.tsx:333` (EntityMatchCard `aiSuggestionLabel(item.ai_suggestion).label`). Trước diff, các ô này hiện thẳng giá trị thô (vd. `retired`/`deprecated`, `villa`, `no`/`maybe`). Sau diff, mọi giá trị ngoài bảng (không có CHECK của DB nào chặn: `sale_offers.property_type` chỉ có kiểm DQ enum-vocab sau khi đã ghi) đều gộp chung thành một chữ «Giá trị khác». Người duyệt trên /ops/review không còn thấy loại hình thật hay đề xuất thật của AI để phán quyết. Trong khi đó `dq-checks-table.tsx` và `review-card.tsx` (FIELD_LABEL → `Trường khác <code>{field}</code>`) có in mã kèm theo, nên bốn chỗ trên là sót. Dữ liệu local hiện chưa chạm nhánh này; smoke AC-8 chỉ bắt được khi trang có đúng giá trị lạ lúc chạy.
  lý do vào hợp đồng: AC-7 đòi mã lạ ra nhãn chung kèm mã trong `<code>` khi render danh mục nguồn và thẻ duyệt; các chỗ hiện chỉ in nhãn chung và bỏ mã thì làm AC-7 thất bại.

- **Hình dạng 5 (tuyên quét LỚP nhưng chỉ đo điểm): AC-5 đếm ≥2 loại kiểm trên DB nhưng chỉ soi 10 dòng của trang 1, hôm nay cả 10 đều là truthful-coverage**
  file: `app/tests/ops-nhan-theo-context.test.tsx:388`
  severity: high
  AC: AC-5
  source: measurement
  detail: Ca 'ON12-AC-5 bảng kiểm chất lượng trên DB local diễn giải đủ' lấy điều kiện tiên quyết bằng truy vấn riêng: `SELECT count(DISTINCT check_name) FROM dq_check_results WHERE checked_at > now() - interval '7 days'` (dòng 391-395), rồi assert `k >= 2` và in «N dòng, K loại kiểm». Phần thật sự được soi lại là `render(await QualityPage())` + `soiHtml(html)` (dòng 400-404). QualityPage chỉ nạp `ORDER BY checked_at DESC LIMIT 20` (app/src/app/ops/quality/page.tsx:28), còn DqChecksTable dùng InsightGrid với `pageSize = 10` mặc định, nên HTML SSR chỉ có 10 dòng đầu. Đã kiểm trên DB local :5433: 7 ngày qua có 13 loại kiểm (occupancy-domain, not-null, freshness, adr-drift, extraction-quality, enum-vocab:*…), nhưng 10 dòng mới nhất đều là `truthful-coverage`. Vậy con số «≥ 2 loại» mà eval E5 đòi in ra được đo trên một tập khác với tập được assert «0 (chưa diễn giải), 0 khuôn \w+=, 0 tên kiểm thô». Lời hứa cho cả lớp (mọi loại kiểm trên DB được diễn giải) trên thực tế chỉ được đo trên một loại.
  lý do vào hợp đồng: AC-5 đòi nạp mọi dòng 7 ngày qua và mọi tên kiểm, đối tượng, chi tiết đều được diễn giải; ca kiểm chỉ soi 10 dòng đầu nên không chứng minh được AC-5.

- **Hình dạng 4 (assertion âm tính đứng một mình): AC-6 render bảng S02 chỉ kiểm vắng tên gốc, mà hai trong số đó nằm ở trang 2 nên không bao giờ được render**
  file: `app/tests/ops-nhan-theo-context.test.tsx:441`
  severity: high
  AC: AC-6
  source: measurement
  detail: Dòng 441: `for (const goc of ["Quang Tr", "Binh Thu", "Phan RangaThap Cham", "Hanoi", "Ho Chi Minh City"]) assert.ok(!bang.includes(`>${goc}<`))` chỉ có chiều âm, không có assert dương nào (ví dụ «Quảng Trị», «Phan Rang – Tháp Chàm» có mặt). AirdnaMarketsTable render với `pageSize={25}` và `initialSort score desc` (quality-tables.tsx:257-260). Trên DB local có 43 thị trường: «Phan RangaThap Cham» xếp thứ 35, «Quang Tr» thứ 37 (score null). Hai dòng này không có trong HTML SSR, nên assert âm tương ứng đúng một cách rỗng, không đo gì. Dòng 442 (`doesNotMatch />vn-…</`) và dòng 445 (`doesNotMatch(vong, /#\d+/)`) cũng chỉ âm tính: nếu `rotation.next` rỗng (mọi thị trường đã tươi trong 24h) thì RotationPanel không render badge nào và assert vẫn xanh. Ca không có đối chứng dương để chứng minh tên thị trường được render qua s02MarketName.
  lý do vào hợp đồng: AC-6 đòi mỗi thị trường S02 có tên tiếng Việt có dấu đầy đủ; ca kiểm chỉ khẳng định âm tính trên phần được render nên không đo được các dòng ở trang sau.

- **Hình dạng 3 (assert chuỗi có mặt trong khi lời hứa là QUAN HỆ): cột «Khu vực của ta» không được đo là hiện areas.name của đúng ourAreaId**
  file: `app/tests/ops-nhan-theo-context.test.tsx:443`
  severity: medium
  AC: AC-6
  source: measurement
  detail: Eval E6 hứa «cột khu vực hiện areas.name». Tức là chữ của link phải bằng `areaNames[row.ourAreaId]` và href phải ứng với cùng id đó. Test chỉ assert `match(bang, /href="\/vn\/[a-z0-9-]+"/)` (có ít nhất một href bất kỳ) và `doesNotMatch(bang, />vn-[a-z0-9-]+</)`. Không assert nào ghép chữ của link với tên khu vực tương ứng với href. Nếu cột hiện nhầm tên của khu vực khác, hoặc hiện «(chưa có tên Việt)», ca vẫn xanh: chuỗi «(chưa có tên Việt)» không khớp `>vn-…<`, và soiHtml chỉ bắt dấu dự phòng nếu đúng chuỗi đó nằm trong FALLBACK_MARKS. Quan hệ id → tên không được đo.
  lý do vào hợp đồng: AC-6 đòi cột «Khu vực của ta» hiện tên khu vực thay mã vn-… với link giữ nguyên; ca kiểm không ghép chữ của link với đúng khu vực nên AC-6 chưa được chứng minh.

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây nằm ngoài phạm vi đã duyệt ở Cổng Phạm vi và CHƯA qua bác bỏ đối kháng — người quyết, máy không sửa và không chấm thứ máy không được sửa.

- **Nhãn tác vụ trên cổng Ops ở máy chủ vẫn tiếng Anh: bản sao nhãn trong push-ops-facts.mjs chưa được đổi**
  Người dùng thấy gì: Trên bản chạy thật (cloud), lưới «Máy móc» ở trang Thu thập vẫn hiện vài nhãn tiếng Anh cũ như «rotation 6 market» hay «Kev gate». Bản chạy trên máy thu đã đúng tiếng Việt.
  Căn cứ: Chỉ là chữ hiển thị, không mất hay lộ dữ liệu, người vận hành vẫn hiểu được; hợp đồng đã ghi đây là hạn chế có tên, và sửa sau cũng rẻ.
  file: `pipeline/push-ops-facts.mjs`
  severity: medium
  Đề xuất: known-limits

- **Smoke tạo user admin và phiên trên bất kỳ DB nào mà DATABASE_URL trỏ tới, không chặn khi không phải localhost**
  Người dùng thấy gì: Nếu máy đang trỏ nhầm vào cơ sở dữ liệu thật khi chạy bài kiểm này, nó sẽ tạo tạm một tài khoản quản trị trên hệ thống thật. Tài khoản này được xoá cuối lượt nhưng vẫn là ghi vào dữ liệu thật.
  Căn cứ: Hậu quả có thể nghiêm trọng nếu chạy nhầm môi trường, nhưng chỉ xảy ra khi người chạy đang giữ khoá cloud trong shell; sửa rất rẻ nên nên làm thành việc riêng.
  file: `scripts/smoke-ops-nhan.mjs`
  severity: low
  Đề xuất: new-contract

- **getAreaNames nuốt mọi lỗi truy vấn và trả bảng rỗng, không ghi log**
  Người dùng thấy gì: Khi cơ sở dữ liệu lỗi tạm thời, các trang Ops vẫn mở bình thường nhưng mọi tên thị trường hiện «chưa có tên Việt». Người vận hành không biết đó là lỗi hệ thống.
  Căn cứ: Nhẹ: không mất dữ liệu, tải lại trang là hết khi DB phục hồi, và các truy vấn khác cùng trang vẫn báo lỗi nên sự cố lớn vẫn lộ ra.
  file: `app/src/lib/ops-queries.ts`
  severity: medium
  Đề xuất: known-limits

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).

