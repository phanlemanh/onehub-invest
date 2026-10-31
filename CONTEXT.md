# CONTEXT — ngôn ngữ chuẩn onehub-invest

> Bộ từ vựng chung cho UI, code, tài liệu và tiêu chí nghiệm thu. Mạnh duyệt 2026-10-23
> (bảng chốt: `_acceptance/glossary-context/bang-chot.html`). Bối cảnh sản phẩm:
> `docs/product/CONTEXT-PRODUCT.md`. Luật đặt tên: `AGENTS.md` › Quy ước.

Cách đọc — mỗi khối một thuật ngữ:

- Dòng in đậm là **nhãn tiếng Việt chuẩn** — chữ dùng trên UI, trong văn xuôi và trong tiêu chí
  `_acceptance/*/contract.md`. Tên code/API/route đặt trong `backtick` (máy đọc bỏ qua code span).
- `Code` là tên tiếng Anh trong code; `RESO` là field/resource Data Dictionary tương ứng — bản tra chuẩn **DD 2.1**
  (ADR-0011, ADR-0013, `pipeline/mappings.yaml`).
- `Slug URL` là đoạn URL tiếng Anh của trang. Test `app/eslint-plugin-onehub-ui/tests/route-slugs.test.mjs`
  đòi mọi đoạn tĩnh của route nằm trong các dòng này. Tên riêng địa lý (`hanoi`, `vn-hanoi-tay-ho`) và mã quốc gia (`vn`) là slug động — không cần tiếng Anh.
- `Neo URL` (đoạn `#…`) và `Tham số URL` (`?…=`) cũng tiếng Anh; tham số camelCase theo tên code.
- `Slug cũ` là route tiếng Việt còn chạy — đổi sang slug đích trong đợt dọn của nhóm trang, kèm
  redirect vĩnh viễn trong `app/next.config.ts`.
- `_Avoid_` liệt tên lệch đã loại. Kit nghiệm thu đọc dòng này: lint W6 cảnh báo khi tiêu chí của
  hợp đồng dùng tên bị loại. Thêm thuật ngữ mới: thêm khối ở đây cùng commit với nhãn/route mới.

_Allow_: phạm vi dự án, entry dự án, thông tin đăng nhập, thông tin đăng ký, điện nước, nước ngoài, thành phố trực thuộc trung ương, thành phố thuộc tỉnh, rao vặt công khai, danh mục dự án

## Địa lý

**Quốc gia**: Cấp gốc của cây khu vực (`areas.region_type = country`). Phạm vi sản phẩm hiện chỉ có Việt Nam (ADR-0008).
- Code: `country` · RESO: Country (ISO 3166-1)
- Slug URL: `vn`
_Avoid_: nước

**Thị trường**: Một tỉnh/thành phố trực thuộc trung ương — cấp `areas.region_type = market` (34 đơn vị sau sáp nhập 2025). Là đơn vị Finder xếp hạng và trang Insight trình bày.
- Code: `market` · RESO: StateOrProvince (ISO 3166-2:VN)
_Avoid_: tỉnh thành, thành phố, city, province

**Phường**: Đơn vị hành chính cấp xã (phường, xã, đặc khu) — cấp `areas.region_type = submarket`, con trực tiếp của thị trường. Trang hiện tên riêng ("Xã Bát Tràng"), nhãn chung ghi "Phường".
- Code: `submarket` · RESO: City (địa chỉ VN từ 07/2025 chỉ còn phường/xã + tỉnh — ADR-0013 §4)
- Ghi chú: Cấp huyện đã bỏ từ 07/2025: "quận" chỉ còn trong dữ liệu thô (`district_raw`).
_Avoid_: quận, quận/huyện, huyện, ward, tiểu thị trường

**Khu vực**: Một nút bất kỳ của cây địa lý (`areas`, khoá `area_id`, vd. `vn-hanoi-tay-ho`): quốc gia, thị trường hoặc phường. Dùng khi câu nói về mọi cấp (So sánh, Đã lưu).
- Code: `area` · RESO: Country / StateOrProvince / City tuỳ cấp
- Tham số URL: `area` · `areas`
- Ghi chú: Tham số URL `area` luôn là mã khu vực địa lý — diện tích căn dùng `livingArea`.
_Avoid_: địa bàn, region

**Khu đô thị**: Đại đô thị một chủ đầu tư phát triển (Ocean Park, Ecopark) — `asset_nodes.node_type = project`. Trục song song với khu vực, không thay phường (ADR-0011 Qđ 2).
- Code: `project` · RESO: SubdivisionName
_Avoid_: dự án, đại đô thị

**Phân khu**: Một phần/phase trong khu đô thị (Sapphire, The Rainbow) — `node_type = subzone`. Tên phân khu trùng giữa các khu đô thị nên chỉ resolve qua matcher 2 tầng.
- Code: `subzone` · RESO: Building.ComplexName / ComplexId (DD 2.1 — ADR-0013 §2)
_Avoid_: dự án con, phase

**Tòa nhà**: Một công trình — tòa chung cư (S1.03, BE02), nhà phố, nhà trọ; cấp `building` của danh bạ vật thể (ADR-0016; hiện 3 tòa còn ở `asset_nodes.node_type = building`, chuyển sang bảng tòa ở hàng code). Mã tòa thô trong tin nằm ở `block_raw`. Nhà phố nguyên căn gắn ở mức tòa.
- Code: `building` · RESO: resource Building (BuildingName, BuildingKey, BuilderName) (ADR-0013 §2, ADR-0016 §2)
_Avoid_: block, chung cư

**Trục căn**: Các căn cùng toà, cùng vị trí trên mặt bằng, khác tầng (cùng diện tích, số phòng). Môi giới thường lộ toà + trục mà che tầng («LD2xx11»), nên tin nhiều khi chỉ gắn được tới trục.
- Code: `stack` · RESO: không có — extension `Stack` (ADR-0013 §9)
_Avoid_: line căn, dòng căn

**Thửa**: Một mảnh đất — cấp `parcel` của danh bạ vật thể; tin đất gắn ở thửa. Chưa nối thửa với tòa nhà phố khi chưa có số nhà, số thửa (ADR-0016 §2).
- Code: `parcel` · RESO: ParcelNumber; resource local `Parcel` (ADR-0016 §11)
_Avoid_: lô, mảnh, plot

**Căn**: Phần con bán hoặc thuê được trong một tòa (căn hộ, shophouse chân đế) — cấp `unit` của danh bạ vật thể, con của trục khi biết trục. Khác «Căn nhà»: căn nhà là đơn vị phân tích, có thể là căn, tòa hay thửa.
- Code: `unit` · RESO: UniversalPropertySubId + UnitNumber; resource local `Unit` (ADR-0016 §2, §11)
_Avoid_: unit (trong chữ UI), căn hộ (khi nói chung mọi loại)

## Tài sản & tin

**Danh bạ**: Bảng định danh bền của một loại thực thể của mình — vật thể (thửa, tòa, trục, căn) hoặc người: khoá mờ cấp một lần, bí danh, vòng đời gộp · tách · nghỉ; mọi thuộc tính đi qua phát biểu (ADR-0016 §3). Khác «danh mục»: danh mục là danh sách căn lấy từ một nguồn (S08), là bằng chứng để dựng danh bạ.
- Code: `registry` · RESO: không có (khung theo HistoryTransactional)
_Avoid_: master data, MDM

**Danh bạ người**: Phần người của danh bạ — mỗi người một khoá mờ `pty_…` cấp một lần, thuộc đúng một nguồn (chưa nối xuyên nguồn); định danh tại nguồn là bí danh, quan hệ với tin là vai trò (ADR-0016 §8). Chỉ ở DB local.
- Code: `party` · RESO: resource Member (khung), khoá local
- Slug URL: `people`
- Ghi chú: trang `/ops/people` «Danh bạ người» (máy thu) liệt người theo nguồn, số tin, bí danh; nhãn «Có thể là môi giới» là suy luận chỉ hiển thị (từ 5 tin còn sống).
_Avoid_: hồ sơ người bán

**Bí danh**: Một định danh của thực thể danh bạ tại một nguồn — tài khoản tại nguồn, SĐT số gốc hay tên hiển thị. Bí danh tài khoản và SĐT thuộc đúng một người sống của nguồn ấy; SĐT luôn là người riêng, không gắn vào người tài khoản (DB2b, Hỏi-4). Từ SD3 SĐT lưu số gốc dạng `+84…` (bí danh `sdt`); bí danh «SĐT băm» đời trước nghỉ, trên `/ops/people` số gốc hiện nhãn che «SĐT (đã che)» ở mọi vai.
- Code: `registry_alias` · RESO: không có
_Avoid_: alias (trên UI)

**Căn nhà**: "Một Căn Nhà" — đơn vị phân tích của nền tảng: nút vật thể trong danh bạ mà listing gắn vào — căn (căn hộ, phòng), tòa (nhà phố nguyên căn) hay thửa (đất); nhiều listing từ nhiều nguồn gộp về một căn nhà, nguồn chỉ là bằng chứng (ROADMAP §1.7, ADR-0016). Bảng `properties` hiện là cụm tin S06, chuyển dần thành view trên danh bạ.
- Code: `property` · RESO: định danh UPI (`UniversalPropertyId` + `UniversalPropertySubId`) + resource Building — **không phải** resource Property, vốn là một tin (ADR-0013 §1)
- Ghi chú: `asset_nodes` là cây khu đô thị/phân khu, không phải căn nhà — vì thế "asset" bị loại.
_Avoid_: tài sản, bất động sản, BĐS, asset

**Listing**: Một tin niêm yết lấy từ nguồn — chào bán, cho thuê dài hạn hay cho thuê ngắn hạn; là bên bán, đối xứng với **Yêu cầu** (bên mua). Là lớp giữa của kiến trúc «listing → căn» (ADR-0013 §1): nhiều listing từ nhiều nguồn, có thể trùng, cùng trỏ về một căn nhà. Dịch vụ (bán · thuê dài hạn · thuê ngắn hạn) ở cột `kind` («Loại tin»), loại hình ở `property_type`. Trường thuộc listing (giá, dịch vụ, người đăng, trạng thái chào) gắn với listing; trường thuộc căn gắn với căn.
- Code: `listing` · RESO: resource Property — mỗi bản ghi là một lần niêm yết, khoá `ListingKey`; bán/thuê qua PropertyType, tần suất thuê qua LeaseAmountFrequency
- Slug URL: `listings` · `listing`
- Tiếng Việt: «tin» là cách gọi thường của listing; trên UI «Tin» là nhãn ngắn khi chỗ đó chỉ có một loại listing (cột bảng tin, thẻ duyệt «Tin A» / «Tin B»).
- Ghi chú: Chốt 27/10 (ROADMAP §3 #21, hướng B — theo RESO): «listing» là khái niệm cha của mọi tin. Hiện trạng còn lệch, đổi ở hàng tái cấu trúc riêng: dữ liệu nằm ở hai bảng — `sale_offers` (tin rao: bán + thuê dài hạn) và `listings` (listing thuê ngắn hạn); bảng `listings` mang tên cha mà chỉ chứa thuê ngắn hạn, và nhãn UI «Listing» trên Insight, Finder, So sánh, Lợi suất, `/ops/quality`, `/ops/collections` hiện chỉ nói loại thuê ngắn hạn.
_Avoid_: tin đăng, offer, sale offer, rao vặt

**Tin rao**: Listing bán hoặc cho thuê dài hạn (`kind` ∈ `sale`, `rent_lt`) đã chuẩn hoá, hiện ở bảng `sale_offers`. Khoá theo ADR-0013: id gốc tại nguồn (`OriginatingSystemKey`); tin nhóm (P1, S03/S05) từ PL14 mang khoá dính theo post (`pipeline/lib/offer-key.mjs`), còn nội dung chỉ để **gộp trùng**.
- Code: `sale_offer` (bảng `sale_offers`; cột `offer_id`, `offer_status`; API `/api/v1/offers`) — tên theo bảng hiện tại, đổi ở hàng tái cấu trúc listing · RESO: resource Property + ListPrice; bán/thuê qua PropertyType
- Nhãn ngắn: «Tin» — chỉ khi chỗ đó chỉ có tin rao.
_Avoid_: tin đăng, offer, rao vặt, sale offer

**Listing thuê ngắn hạn**: Listing cho thuê theo đêm tự thu (bảng `listings`, id `abnb_…`): nguyên căn hoặc phòng riêng, có lịch đêm và giá niêm yết. Mọi chỉ số ADR, công suất, «Listing hoạt động», «Listing so sánh», «Listing tự thu» đều nói về loại này.
- Code: `listing` (bảng `listings`; `kind = rent_st` khi gộp bảng) · RESO: thuê theo ngày (PropertyType = ResidentialLease + LeaseAmountFrequency = Daily); lịch đêm, công suất, ADR là local extension (reso-standards.md)
- Ghi chú: Trang chỉ có loại này được ghi trơn «Listing»; trang có cả tin rao thì viết đủ «listing thuê ngắn hạn».
_Avoid_: chỗ ở, phòng cho thuê, homestay

**Yêu cầu**: Một nhu cầu cần mua hoặc cần thuê — bên mua, đối xứng với **listing** bên bán (Mạnh chốt 27/10). Dịch vụ ở `kind` cùng bộ mã với listing (`sale` = mua · `rent_lt` = thuê dài hạn · `rent_st` = thuê ngắn hạn, nhãn theo phía), loại hình ở `property_type` (cùng sổ), giá là khoảng ngân sách. Không gắn một căn mà gắn tiêu chí (khu vực, loại hình, số PN, ngân sách), khớp được với nhiều listing. Hiện mới là một giá trị của «Ý định tin»: bài cần mua, cần thuê giữ ở raw + stg làm tín hiệu cầu (review phân loại Q8); bảng lưu yêu cầu và ghép với listing là tính năng sau, cần số đo trước (luật 11).
- Code: `listing_intent = inquiry` · RESO: không có bản ghi ngang hàng `Property` — gần nhất SavedSearch (tiêu chí người mua); local extension dùng lại trường RESO phía bán
_Avoid_: tin tìm mua, wanted

**Yêu cầu mua**: Yêu cầu có `kind = sale`.
- Code: `kind = sale` (phía yêu cầu) · RESO: tiêu chí SavedSearch với PropertyType ∈ Residential, Land

**Yêu cầu thuê**: Yêu cầu có `kind` ∈ `rent_lt`, `rent_st`.
- Code: `kind = rent_lt | rent_st` (phía yêu cầu) · RESO: tiêu chí SavedSearch với PropertyType = ResidentialLease

**Tin bán**: Tin rao có `kind = sale`.
- Code: `kind = sale` · RESO: PropertyType ∈ Residential, Land, ResidentialIncome

**Tin cho thuê**: Tin rao cho thuê dài hạn, giá theo tháng (`kind = rent_lt`).
- Code: `kind = rent_lt` · RESO: PropertyType = ResidentialLease + LeaseAmountFrequency = Monthly

**Căn giá tốt**: Tin rao giá nội bộ (P1) có giá/m² thấp hơn thước giá cùng phường và loại hình. Hiện chỉ ở cổng Ops (PR #3); từ 23/10 liên hệ người bán là tầng C nên có thể đưa lại lên cổng công khai.
- Code: `deal` · RESO: không có — chỉ số nội bộ
- Slug URL: `deals`
_Avoid_: deal tốt, kèo

**Kiểm chất lượng**: Một phép kiểm dữ liệu chạy định kỳ ở pipeline (độ tươi, từ vựng enum, số tham chiếu…), ghi kết quả theo từng đối tượng (bảng, nguồn, thị trường). Bảng «Kiểm chất lượng» trên `/ops/quality` hiện bản mới nhất của mỗi kiểm cho từng đối tượng trong 7 ngày; đầu trang đếm «n kiểm» (loại kiểm) và «m đối tượng» (dòng).
- Code: `dq_check_results` · `check_name` · `entity` · RESO: không có — chỉ số nội bộ
- Nhãn kết quả: «Đạt» · «Cảnh báo» · «Không đạt» · «Bỏ qua»
_Avoid_: DQ check, test dữ liệu

**Có số tham chiếu**: Nhãn kết quả của kiểm độ phủ tham chiếu (`truthful-coverage`) khi thị trường có số tham chiếu tươi để đối chiếu. KHÔNG có nghĩa là độ phủ đạt — độ phủ thật đọc ở cột «Chi tiết». Khi thiếu số tham chiếu (hoặc số cũ) nhãn là «Thiếu số tham chiếu». Kiểm này không bao giờ mang «Đạt» xanh lá.
- Code: `dqResult("truthful-coverage", "pass")` (`app/src/lib/dq-checks.ts`) · RESO: không có — chỉ số nội bộ
_Avoid_: «Đạt» (cho kiểm này), độ phủ đạt

**Tin cần xác minh**: Căn giá tốt rẻ hơn thước giá quá 35% — vẫn hiện trên danh sách nhưng đứng sau mọi căn giảm đến 35%, thẻ mang nhãn «cần xác minh». Giảm sâu như vậy thường là so lệch loại hình (thước còn theo phường) hơn là căn rẻ thật; người vận hành gọi xác minh trước khi tin số. Tin rao có diện tích hay số phòng phi lý không phải tin cần xác minh: chúng bị loại khỏi danh sách, có dòng audit lý do.
- Code: `suspect` · `NGHI_NGO_PCT = 35` (`app/src/lib/deals.ts`) · RESO: không có — chỉ số nội bộ
- Nhãn số lần đăng trên thẻ: «đăng 1 lần», «đăng n lần» (`repostLabel`)
_Avoid_: tin nghi ngờ, tin ảo, «mới» (để chỉ tin chưa đăng lại)

**Phát biểu**: Một lời khai về một trường của một tin: giá trị + lớp căn cứ + phương pháp + bằng chứng + ai/khi nào. Chỉ thêm, không sửa, không xoá; rút một phát biểu là đặt lúc rút + lý do (PL15, review phân loại §3.4).
- Code: `field_assertions` · RESO: extension `FieldAssertion` (khuôn HistoryTransactional, ADR-0013 §6)
_Avoid_: assertion, claim

**Lớp căn cứ**: Thang ba lớp của phát biểu: sự thật (người quyết, trường có cấu trúc của nguồn) › quan sát có trích dẫn (bộ đọc tin, luật, LLM có trích) › suy luận (ngữ cảnh, không trích). Suy luận không bao giờ tự vào cột.
- Code: `evidence_tier` · RESO: không có — extension local
_Avoid_: confidence, bậc H0–H5

**Phân xử**: Hàm xác định gom các phát biểu còn hiệu lực của mọi bài trong một tin thành giá trị năm cột loại hình, phòng ngủ, WC, đường, toà. Lớp cao nhất thắng; trong lớp theo thứ tự tạm của phương pháp; bất đồng thì gắn cờ. Xoá cột rồi phân xử lại ra y nguyên.
- Code: `resolve_offer_fields` · RESO: không có — bộ phân xử local
_Avoid_: fill-gap, ghi đè

**Nguồn gốc**: Ô nào của tin lấy từ phát biểu nào: lớp, phương pháp, id phát biểu, cờ bất đồng, «chưa đo». Chỉ ở máy local (chưa lên cloud).
- Code: `field_provenance` · RESO: `*Source` khi field có (năm trường này không có)
_Avoid_: provenance (trên UI)

**Trạng thái chào**: Tin còn đang chào hay không — Đang chào · Đã cọc · Đã bán · Đã gỡ · Chưa rõ. Chỉ đổi theo bằng chứng, quá cửa sổ không đổi: tin lâu không thấy lại vẫn giữ trạng thái, chỉ căn tụt bậc B5 về B4 (khung RESO §6). Bằng chứng là phát biểu trường `offer_status` (tin S06 còn trên sàn, bài nhóm S03/S05 được đọc, tin S06 vắng khỏi lượt nạp); phát biểu mới nhất thắng, cùng lúc mới xét phương pháp (PL19).
- Code: `sale_offer_records.offer_status`, `ghi_bang_chung_chao`, `resolve_offer_status`, `pipeline/trang-thai-chao.mjs` · RESO: StandardStatus
_Avoid_: tin hết hạn, expired, tình trạng tin

**Phân bố bậc**: Số đơn vị ở mỗi bậc dữ liệu B0–B5 (FRAMING §3.4) theo thị trường × loại hình, chụp mỗi ngày ở máy thu. Đơn vị là mỗi căn cộng mỗi tin rao chưa gắn căn; đơn vị không có phường đếm ở thị trường «chưa rõ». Kiểm «Đề xuất có phát biểu» giữ bất biến mọi đề xuất enrich đã áp có phát biểu tương ứng.
- Code: `data_level_snapshot`, `offer_data_level`, `property_data_level`, `pipeline/bac-du-lieu.mjs`, kiểm `data-level:distribution` và `enrich:proposal-assertion` · RESO: không có — extension `DataLevel`
- Slug URL: —
_Avoid_: điểm tin cậy, confidence, độ chắc (dùng cho nhãn hiển thị ba mức, không phải thang sáu bậc)

**Danh bạ SĐT**: Năm kiểm đo trục số điện thoại của danh bạ Người theo nguồn, mỗi ngày một dòng: cặp một–một (một SĐT, một người gửi) mà người theo SĐT chưa gộp; người theo SĐT không có tin; bảng người bán so với số SĐT trên tin; tin nhiều số và tin trống số dù bài có số; số bộ bóc bỏ sót so với bộ dò rộng. Chỉ số đếm — không SĐT, không khoá băm.
- Code: `pipeline/do-danh-ba-sdt.mjs`, kiểm `danh-ba-sdt:n1`…`n5` ở `dq_check_results` · RESO: không có
- Slug URL: —
_Avoid_: sổ điện thoại

**Độ đúng cách đọc**: Tỉ lệ tin mà một cách đọc (bộ đọc theo luật, sau này luật E1, AI) đọc đúng một trường so với nhãn người, tính trên tập chấm của một lát cho từng phân khúc (thị trường × loại hình), so với ngưỡng tự áp F3 bằng cận dưới Wilson 95% chứ không bằng tỉ lệ thô (nhóm A 0,95 · nhóm B 0,90). Ô chưa có nhãn người hay chưa có cách đọc là «bỏ qua» có lý do.
- Code: `pipeline/eval-classify.mjs` (`npm run eval:classify`), `pipeline/lib/eval-classify.mjs`, kiểm `eval-classify` ở `dq_check_results` · RESO: không có
- Slug URL: —
_Avoid_: accuracy, độ chính xác

**Người bán**: Người đăng tin rao — chủ hoặc môi giới, không tự suy vai. Định danh xuyên nguồn bằng hash SĐT. Tên, SĐT, ID tài khoản người bán là tầng C — công khai, vì đăng rao là hoạt động bán hàng/môi giới (Mạnh chốt 23/10).
- Code: `seller` · RESO: resource Member; `seller_phone_hash` ≈ ULI
- Ghi chú: thuộc danh bạ người (ADR-0016 §8); «chủ» chỉ là «tự nhận chính chủ» lấy từ tin — không thu chủ sở hữu ngoài tin.
_Avoid_: chủ nhà, broker

**Vai trò**: Quan hệ của một người với listing (người đăng, môi giới đại diện, sàn) hay với vật thể (chủ đầu tư), ghi bằng phát biểu. Vai suy luận (vd đăng nhiều căn → môi giới) không vào cột, chỉ hiện ở `/ops` (ADR-0016 §8).
- Code: `party_role` · RESO: ListAgentKey · CoListAgentKey · ListOfficeKey; chủ đầu tư → Building.BuilderName
- Ghi chú: vai đang ghi là «Người đăng» (`nguoi_dang`, DB2b) — từ trường tài khoản của nguồn hoặc từ SĐT trong tin.
_Avoid_: loại người bán

**Diện tích**: Diện tích sử dụng của căn, m² (`numeric`, ADR-0011 Qđ 4).
- Code: `area_m2` · RESO: LivingArea (LivingAreaUnits = sqm)
- Tham số URL: `livingArea`
- Ghi chú: Tham số URL của /yield đang là `m2` → đổi `livingArea` khi dọn nhóm trang.

**Phòng ngủ**: Số phòng ngủ của căn hoặc listing; UI viết tắt "PN" ("2 PN").
- Code: `bedrooms` · RESO: BedroomsTotal
- Tham số URL: `bedrooms`
- Ghi chú: Tham số URL của /yield đang là `pn` → đổi `bedrooms` khi dọn nhóm trang.

## Giá

**Giá rao**: Giá ghi trong tin rao, VND (bigint).
- Code: `price_vnd` · RESO: ListPrice (thuê: LeaseAmount)

**Lịch sử giá**: Các mốc giá và trạng thái của tin theo thời gian — tin mới, đổi giá (giá cũ → giá mới), gỡ tin, chào lại — gom theo căn qua mọi tin gắn căn. Ghi lại cùng giá không sinh mốc. Căn có ít nhất hai mốc giá là một điều kiện của bậc B5 (PL19 Hỏi-3).
- Code: bảng `history_transactional` (trigger trên `sale_offer_records`, chỉ local), view gom theo căn `property_price_history` · RESO: HistoryTransactional (ChangeType)
_Avoid_: nhật ký giá, biến động giá

**Bậc giá**: Độ gần giá giao dịch của một tin rao: P0 giá giao dịch, P1 giá nội bộ, P2 giá công khai.
- Code: `price_tier` · RESO: không có — đặc trưng VN (mappings.yaml)
_Avoid_: tier giá

**Giá giao dịch**: Giá đã chốt thật (P0) — hiếm, trễ; dự phòng.
- Code: `price_tier = P0` · RESO: ClosePrice (ngữ nghĩa)

**Giá nội bộ**: Giá rao trong nhóm khép (P1, S03 và S05) — sát giao dịch, kèm SĐT.
- Code: `price_tier = P1` · RESO: không có
_Avoid_: giá thật

**Giá công khai**: Giá rao trên kênh công khai (P2, S06) — độ phủ rộng nhưng có giá câu và tin treo.
- Code: `price_tier = P2` · RESO: không có
_Avoid_: giá vải

**Giá/m²**: Giá rao ÷ diện tích (`price_vnd / area_m2`).
- Code: `price_perm2` · RESO: SalePricePerArea / LeasePricePerArea + PricePerAreaUnit (DD 2.1) — vẫn tự tính
_Avoid_: đơn giá

**Thước giá**: Trung vị giá/m² giá công khai (P2) cùng phường × loại hình, cần n ≥ 5 (view `v_ruler_p2_*`). Thước để đo căn giá tốt.
- Code: `ruler` · RESO: không có — chỉ số nội bộ
_Avoid_: ruler

**Chênh giá câu**: Chênh giữa giá công khai và giá nội bộ của cùng người bán, tính bằng %.
- Code: `bait_gap_pct` · RESO: không có — chỉ số P4
_Avoid_: bait gap

**Giá niêm yết**: Giá một đêm listing đang để trên kênh — không phải ADR (ADR chỉ tính trên đêm đã đặt).
- Code: `price_listed` · RESO: không có mô hình STR

## Chỉ số

**Đêm đã đặt**: Số đêm trong kỳ lịch listing bị chặn (`nights.available = false`) — gồm cả đêm chủ tự chặn, vì lịch công khai không tách hai loại.
- Code: `booked_nights` · RESO: không có

**Đêm khả dụng**: Đêm đã đặt + đêm trống (`available_nights`) trong kỳ — mẫu số của công suất và RevPAR.
- Code: `booked_nights + available_nights` · RESO: không có

**Doanh thu**: Tổng giá các đêm đã đặt trong kỳ (`market_metrics.revenue`); đêm thiếu giá lấy giá niêm yết của listing, listing không có giá niêm yết bị loại khỏi mẫu (300_metrics.sql). "Doanh thu năm" ở Lợi suất = giá niêm yết × công suất 90 đêm × 365, lấy p25/trung vị/p75 trên listing so sánh.
- Code: `revenue` · RESO: không có
- Ghi chú: UI ghi "Doanh thu ước tính" khi số dựng từ lịch tương lai (giá niêm yết × đêm đã chặn) — vẫn là thuật ngữ này.
_Avoid_: doanh số, doanh thu brutto

**ADR**: Giá trung bình một đêm đã đặt: doanh thu ÷ đêm đã đặt.
- Code: `adr` · RESO: không có
- Ghi chú: Biến `adr` trong `lib/yield.ts` (Lợi suất) là trung vị giá niêm yết của listing so sánh, KHÔNG phải ADR — đổi tên khi dọn nhóm trang. UI đang có 4 nhãn cho hai khái niệm: "Giá phòng (ADR)", "Giá đêm (ADR)" (= ADR) và "Giá niêm yết", "Giá/đêm" (= giá niêm yết một listing) — tách khi dọn nhóm trang.
_Avoid_: giá phòng, giá đêm, giá/đêm

**Công suất**: Đêm đã đặt ÷ đêm khả dụng (`market_metrics.occupancy`).
- Code: `occupancy` · RESO: không có
_Avoid_: tỷ lệ lấp đầy, lấp đầy, occupancy

**Công suất 90 đêm**: Công suất trên 90 đêm đầu của lịch tương lai (`listing_stats`, 410) — đầu vào doanh thu năm ở Lợi suất và Mô phỏng đầu tư.
- Code: `booked90 / nights90` · RESO: không có

**RevPAR**: Doanh thu ÷ đêm khả dụng = ADR × công suất.
- Code: `revpar` · RESO: không có

**Listing hoạt động**: Số listing có ≥ 1 đêm đã đặt trong tháng.
- Code: `listing_count` · RESO: không có

**Listing so sánh**: Tập listing cùng phường + số phòng ngủ (≥ 5, không đủ thì lùi ra thị trường) dùng để ước tính một căn.
- Code: `comps` · RESO: không có
_Avoid_: comps, listing tương tự

**Lợi suất**: Thu nhập năm của một căn ÷ giá mua; luôn ghi rõ gộp hay ròng và ngắn hạn hay dài hạn.
- Code: `yield` · RESO: không có
- Slug URL: `yield`
- Ghi chú: `/compare` ghi "Lợi suất ngắn hạn"/"Lợi suất dài hạn" kèm chú thích gộp (đổi từ "Yield …" khi dọn nhóm trang, hồ sơ `compare-saved-trang-thai`).
_Avoid_: tỷ suất lợi nhuận, ROI, cap rate

**Lợi suất gộp**: Doanh thu năm ÷ giá mua (trước chi phí).
- Code: `grossYield` · RESO: không có
_Avoid_: gross yield, brutto, tổng lợi suất

**Lợi suất ròng**: Thu nhập ròng ÷ giá mua.
- Code: `netYield` · RESO: không có
_Avoid_: net yield, yield ròng

**Lợi suất vốn tự có**: (Thu nhập ròng tháng − trả nợ vay tháng) × 12 ÷ vốn tự có bỏ ra — chỉ có nghĩa khi có vay.
- Code: `cashOnCash` · RESO: không có
_Avoid_: cash-on-cash

**Thu nhập ròng**: Cho thuê ngắn hạn: doanh thu năm trừ phí quản lý, phí nền tảng, thuế và chi phí cố định. Cho thuê dài hạn: tiền thuê năm × (1 − thuế 10%). Cả hai chưa trừ trả nợ vay.
- Code: `noi` · RESO: không có
_Avoid_: lợi nhuận, NOI

**Độ tin cậy**: Mức chắc của một ước tính, theo cỡ mẫu, phạm vi lùi và độ phân tán giá — luôn hiện cạnh số ước tính.
- Code: `confidence (ước tính)` · RESO: không có

**Độ tin trích xuất**: Độ chắc của parser khi đọc một tin rao (high | medium | low) — chỉ dùng ở Ops, khác độ tin cậy của ước tính.
- Code: `sale_offers.confidence` · RESO: không có

**Mô phỏng**: Số dựng từ mô hình chứ không quan sát trực tiếp; mọi số như vậy mang badge MÔ PHỎNG.
- Code: `badge warning-light "MÔ PHỎNG"` · RESO: —

**Điểm One Invest**: Điểm xếp hạng khu vực của riêng nền tảng, một thang cố định, kèm điểm thành phần (chưa ship).
- Code: `score` · RESO: không có
- Ghi chú: Market Score là của AirDNA (S02) — không lên cổng Invest (luật 5).
_Avoid_: Market Score, điểm thị trường

## Chiến lược đầu tư

**Cho thuê ngắn hạn**: Chiến lược cho thuê theo đêm qua listing thuê ngắn hạn; dòng tiền đo bằng ADR × công suất.
- Code: `str (kind rent_st khi gộp bảng listing)` · RESO: LeaseAmountFrequency = Daily; lịch đêm, công suất không có mô hình — local extension
_Avoid_: homestay

**Cho thuê dài hạn**: Chiến lược cho thuê theo tháng; dòng tiền đo bằng giá thuê tin cho thuê.
- Code: `ltr / kind rent_lt` · RESO: PropertyType = ResidentialLease

**Pipeline đầu tư**: North star sản phẩm, 4 giai đoạn: chọn thị trường → chọn căn → chi phí, vốn, dòng tiền → khai thác sau mua (`docs/research/investment-pipeline-4-stages.md`).
- Code: `investment pipeline (4 stages)` · RESO: —
_Avoid_: phễu đầu tư

## Từ vựng dữ liệu (máy sinh)

Mọi enum dữ liệu (loại tin, loại hình, trạng thái chào…) khai ở một chỗ duy nhất: khối `enums:` của
`pipeline/mappings.yaml` (PL6, khuôn RESO Lookup — ADR-0013 §8). Bảng dưới sinh từ sổ; sửa sổ rồi chạy
`node pipeline/vocab.mjs --write`. Nhãn UI của các giá trị lấy từ cột cuối.

<!-- VOCAB:BEGIN -->
<!-- MÁY SINH từ pipeline/mappings.yaml — sửa sổ rồi chạy node pipeline/vocab.mjs --write -->

| Thuật ngữ | Code | RESO | Cột bị ràng | Giá trị (code «nhãn») |
|---|---|---|---|---|
| Loại tin | `kind` | PropertyType | `sale_offers.kind` | `sale` «Bán» · `rent_lt` «Cho thuê» |
| Loại hình | `property_type` | PropertySubType | `sale_offers.property_type`, `properties.property_type` | `apartment` «Căn hộ» · `house` «Nhà riêng» · `land` «Đất» · `room` «Phòng» · `commercial` «Mặt bằng» · `unknown` «Chưa rõ» |
| Độ tin trích xuất | `confidence` | local | `sale_offers.confidence` | `high` «cao» · `medium` «trung bình» · `low` «thấp» |
| Bậc giá | `price_tier` | local | `sale_offers.price_tier` | `P0` «giá giao dịch (P0)» · `P1` «giá nội bộ (P1)» · `P2` «giá công khai (P2)» |
| Trường làm giàu | `enrich_field` | local | `enrichment_proposals.field` | `property_type` «Loại hình» · `bedrooms` «Phòng ngủ» · `bathrooms` «WC» · `street_raw` «Đường» · `block_raw` «Toà» |
| Trường phát biểu | `assertion_field` | local | `field_assertions.field` | `property_type` «Loại hình» · `bedrooms` «Phòng ngủ» · `bathrooms` «WC» · `street_raw` «Đường» · `block_raw` «Toà» · `offer_status` «Trạng thái chào» |
| Lớp căn cứ | `evidence_tier` | local | `field_assertions.evidence_tier`, `party_roles.evidence_tier` | `fact` «Sự thật» · `observed` «Quan sát có trích dẫn» · `inferred` «Suy luận» |
| Phương pháp phát biểu | `assertion_method` | local | `field_assertions.method`, `party_roles.method` | `hitl` «Người quyết» · `source_field` «Trường có cấu trúc của nguồn» · `parser` «Bộ đọc tin» · `e1_rule` «Luật E1» · `e2_llm` «LLM E2» · `legacy` «Giá trị có trước» |
| Trạng thái danh bạ | `registry_status` | local | `parties.status` | `active` «Đang dùng» · `merged` «Đã gộp» · `split` «Đã tách» · `retired` «Đã nghỉ» |
| Loại bí danh | `alias_kind` | local | `registry_aliases.kind` | `tai_khoan_nguon` «Tài khoản tại nguồn» · `sdt_bam` «SĐT băm» · `ten` «Tên hiển thị» · `sdt` «SĐT số gốc» |
| Sự kiện danh bạ | `registry_event_kind` | local | `registry_events.kind` | `gop` «Gộp» · `tach` «Tách» · `nghi` «Nghỉ» |
| Vai của người | `party_role` | local | `party_roles.role` | `nguoi_dang` «Người đăng» |
| Ý định tin | `listing_intent` | local | — | `offer` «Tin rao» · `inquiry` «Yêu cầu» · `not_listing` «Không phải tin rao» · `unknown` «Chưa rõ» |
| Trạng thái chào | `offer_status` | StandardStatus | `sale_offer_records.offer_status` | `active` «Đang chào» · `active_under_contract` «Đã cọc» · `closed` «Đã bán» · `withdrawn` «Đã gỡ» · `unknown` «Chưa rõ» |
| Loại thay đổi | `change_type` | ChangeType | `history_transactional.change_type` | `new_listing` «Tin mới» · `price_change` «Đổi giá» · `withdrawn` «Gỡ tin» · `back_on_market` «Chào lại» · `active_under_contract` «Đã cọc» · `closed` «Đã bán» |
| Bậc dữ liệu | `data_level` | local | `data_level_snapshot.data_level` | `B0` «Có lời khai» · `B1` «Đọc được» · `B2` «Gắn căn» · `B3` «Đã đo» · `B4` «Xác minh» · `B5` «Sống» |
| Bậc năng lực | `capability_level` | local | — | `N0` «Thu được» · `N1` «Đọc được» · `N2` «Đo được» · `N3` «Tự động ở ngưỡng» · `N4` «Tự duy trì» |

<!-- VOCAB:END -->

## Dữ liệu & nguồn

**Nguồn**: Nơi dữ liệu đến, luôn gọi bằng mã S01–S08 (SPL, ADR-0007). Tên thật là tầng A.
- Code: `source (source_registry.code)` · RESO: OriginatingSystemName
_Avoid_: kênh dữ liệu

**Snapshot**: Bản ghi thô collector thu được — bất biến, chỉ ghi mới (luật 1). Mọi diễn giải nằm ở pipeline.
- Code: `snapshot (raw)` · RESO: —
_Avoid_: bản chụp, dump

**Staging**: Bảng nạp từ snapshot (`stg_*`) — ranh giới làn ZCode (thu) ↔ Claude (phần còn lại), định nghĩa trong DATA-CONTRACT.
- Code: `stg_*` · RESO: —

**Hợp đồng dữ liệu**: `collector/docs/DATA-CONTRACT.md` — giao diện collector ↔ pipeline; thêm field phải tăng `schemaVersion`.
- Code: `DATA-CONTRACT (schemaVersion)` · RESO: —

**Canonical**: Lớp dữ liệu đã chuẩn hoá đa nguồn theo RESO-first, đầu vào của căn nhà và chỉ số.
- Code: `sale_offers, listings` · RESO: Data Dictionary là lớp canonical

**Thu thập**: Việc collector lấy dữ liệu từ nguồn về snapshot (launchd, theo lịch).
- Code: `collect / collection` · RESO: —
- Slug URL: `collections`
_Avoid_: cào, crawl

**Dòng chảy dữ liệu**: Đường đi của bài từ lúc nạp tới căn — Bài nhận → Đọc được → Tin rao mới → Gắn căn — kèm nhánh rơi
(«Không đọc được», «Chưa gắn căn») và nhánh «Gộp vào tin đã có» (gộp trùng, không phải mất) của mỗi chặng; trang
`/ops/data-flow` (proto 26/10) đo số và nút thắt từng chặng theo nguồn, nhóm thu.
- Code: `data flow (getDataFlow, StageCounts: received · readable · offers · linked)` · RESO: —
- Slug URL: `data-flow`
_Avoid_: pipeline (trùng «Pipeline đầu tư»), funnel, phễu Kev

**Cuộc gọi AI**: Một lượt agent runtime gọi model AI (judge, enrich…) — sổ ghi việc, model, token vào/ra, độ trễ, thành
công hay lỗi; chi phí = token × đơn giá của model (model chạy local giá 0, model chưa có giá thì «chưa có giá»). Trang
`/ops/ai-calls` (PL29) tổng hợp theo ngày × việc × model, 30 ngày.
- Code: `ai_calls`, `ai_model_prices`, `AiCallGroup` (getAiCalls, readAiCalls) · RESO: —
- Slug URL: `ai-calls`
_Avoid_: log AI, LLM usage, chi phí model (chưa nói đơn vị)

**Gắn nhãn**: Việc người đọc chữ gốc của một tin rao trong một lát và ghi giá trị đúng cho chín trường lõi (ý định tin,
loại tin, loại hình, dự án, toà, giá thấp nhất, giá cao nhất, diện tích, phòng ngủ), KHÔNG thấy giá trị máy đã đọc ra
(gắn mù, tránh neo). 20% tin của lát do hai người gắn để đo đồng thuận; đồng thuận một trường dưới 0,9 thì sửa hướng dẫn
gắn nhãn trước khi tin số đo. Trang `/ops/labels` (PL7), chỉ ở máy thu.
- Code: `eval_label_items`, `label.write`, `label-sample.mjs` · RESO: —
- Slug URL: `labels`
_Avoid_: annotate, label UI, gán nhãn

**Nhãn đánh giá**: Giá trị một người gắn cho một trường của một tin khi gắn nhãn — sự thật tham chiếu để chấm độ đúng
của máy (PL9), không phải giá trị hiển thị; «tin không nêu» là một nhãn hợp lệ. Gắn với người gắn nên là tầng A, chỉ ở
máy thu.
- Code: `eval_labels`, `eval_label_agreement` · RESO: —
_Avoid_: nhãn tiếng Việt (`label_vi` — chữ hiển thị của sổ từ vựng, khái niệm khác), ground truth

**Độ tươi**: Thời gian từ lần thu gần nhất của một nguồn; vượt SLO thì `check-freshness.mjs` exit 1.
- Code: `freshness (SLO)` · RESO: ≈ ModificationTimestamp
_Avoid_: freshness

**Tầng A**: Bốn thứ không rời máy thu (luật 6, ADR-0007 sửa đổi 26/10): tên nguồn thật (kể cả tên miền và giá trị mang nó), hồ sơ người dùng app, định danh tài khoản thu, phiên/khoá/QR/profile trình duyệt. Định danh người bán trên tin rao và tên nhóm thu là tầng C; nội dung bài, ảnh tin và thẻ duyệt lên máy chủ cho vai ops trở lên, đã thay tên nguồn bằng mã.
- Code: `SPL tier A` · RESO: —

**Tầng B**: Mã nguồn S0x — dùng ở API và mọi trang Ops.
- Code: `SPL tier B` · RESO: —

**Tầng C**: Nhãn công khai ("Tự thu", "Hiệu chuẩn") — thứ duy nhất về nguồn hiện trên cổng Invest.
- Code: `SPL tier C` · RESO: —

**Nhãn nguồn**: Cách Ops gọi một nguồn ngoài `/ops/sources` — mã `S0x` kèm vai trò, dạng «S02 · Hiệu chuẩn»; vắng vai trò thì mã trần «S02». Vai trò là `label_vi` đọc từ `source_registry` ở local, từ `facts.sourceRuns` ở cloud. Tên nguồn thật chỉ hiện ở `/ops/sources`.
- Code: `sourceLabel(code, roles)` (`app/src/lib/source-labels.ts`) · RESO: — · Slug URL: —
_Avoid_: tên nguồn thật ở mọi trang Ops ngoài `/ops/sources`, kể cả nhãn job và dòng log cuối

**Tự thu**: Số tính từ dữ liệu nền tảng tự thu (không phải AirDNA) — nhãn tầng C trên cổng Invest.
- Code: `self-collected` · RESO: —

**Hiệu chuẩn**: Số AirDNA dùng để đối chiếu số tự thu — chỉ ở `/ops/quality`, không bao giờ lên cổng Invest (ToS, luật 5).
- Code: `calibration (S02)` · RESO: —
_Avoid_: calibration

**Hàng duyệt**: Hàng chờ người phán quyết đề xuất của máy/agent (entity_match, source_decision, agent_output) — LLM không ghi dữ liệu trực tiếp (luật 7).
- Code: `review_queue` · RESO: —
- Slug URL: `review`
- Ghi chú: Tiêu đề trang `/ops/review` là «Hàng duyệt» từ ON12 (24/10).
_Avoid_: Review Queue, hàng chờ

**Lý do quyết định**: Câu người duyệt ghi khi quyết một thẻ ở Hàng duyệt — bắt buộc, tối đa 1.000 ký tự; ghi vào thẻ và nhật ký Ops trong cùng một giao dịch với quyết định (PL3). Nhãn ô: «Lý do».
- Code: `review_queue.decision_note` · `ops_audit.detail.ly_do` · RESO: không có — extension local
_Avoid_: ghi chú, comment, note

**Suy luận của AI** (trên thẻ ghép căn): Gợi ý cùng căn/khác căn và lời giải thích của bộ chấm LLM. Hiện tách khỏi căn cứ, không đổi thứ tự hay kiểu nút; không kèm điểm hay độ tự tin (Q9).
- Code: `review_queue.ai_suggestion`, `ai_reasoning` · RESO: —
_Avoid_: AI tự tin, điểm B, gợi ý mặc định

## Vận hành (cổng Ops)

Nhãn cổng Ops cho máy móc thu thập và an toàn kênh — thêm ở ON12 `ops-nhan-theo-context` (24/10). Chữ tiếng Anh cũ trên
cổng Ops nằm ở dòng `_Avoid_` để thước chữ hiển thị giữ nó không quay lại.

**Máy thu**: Máy local chạy collector, pipeline và DB local — nơi duy nhất giữ dữ liệu tầng A.
- Code: `local` · RESO: —

**Máy chủ**: Bản cổng chạy trên cloud (Vercel + Supabase) — nhận số tổng hợp và dữ liệu đã lọc tầng A, ghi lệnh cho máy thu kéo về; không bao giờ gọi vào máy thu (ADR-0015).
- Code: `cloud` · RESO: —
_Avoid_: bản cloud, lên cloud

**Tác vụ**: Một việc launchd chạy theo lịch hoặc chạy liên tục trên máy thu (thu S02 hằng ngày, thu S01 hằng tuần, cổng nhận tin…).
- Code: `job (JobStatus)` · RESO: —
_Avoid_: Job

**Khoá an toàn**: Bảy lớp chặn agent gửi tin nhắn vào nhóm Zalo (luật 8) cộng hạ tầng thu; mỗi lớp «Ổn», «Hỏng» hoặc «Chưa kiểm được».
- Code: `lockdown (LockdownLayer)` · RESO: —
_Avoid_: Lockdown

**Bộ canh**: Tác vụ kiểm khoá an toàn mỗi 5 phút và ghi `ok` khi không thấy sự cố (`zalo-watchdog.sh`).
- Code: `watchdog` · RESO: —
_Avoid_: Watchdog

**Lượt máy tự trả lời**: Số lượt agent tự trả lời trong kênh trong ngày — khoá an toàn đòi bằng 0.
- Code: `agentTurnsToday` · RESO: —
_Avoid_: Agent-turn, agent turn

**Tín hiệu sống**: Nhịp kênh S03 tự báo còn kết nối (mỗi 15 phút); quá hạn thì kênh coi như đứt.
- Code: `heartbeat (heartbeatAgeMin)` · RESO: —
_Avoid_: Heartbeat

**Danh sách cho phép**: Các nhóm S03 được phép thu; lệch với nhóm tài khoản đang tham gia thì báo «lệch».
- Code: `allowlist` · RESO: —
_Avoid_: Allowlist, membership

**Chế độ thu**: Nhịp thu của một điểm thu (một dòng nhóm thu trên `/ops/sources`): «Chờ» (chưa thu sâu), «Bùng» (dồn tải có hạn để lấp kho) hoặc «Duy trì» (giữ tươi); dòng chưa có chế độ hiện «Chưa đặt». Chỉ quản trị viên đổi; bật Bùng phải có hạn bùng; máy tự hạ Bùng về Duy trì kèm `ops_audit` (hồ sơ `che-do-thu-tren-ops`).
- Code: `mode (source_groups.params.mode: cho | bung | duy_tri)` · RESO: —
_Avoid_: mode, burst, chế độ cào

**Hạn bùng**: Ngày cuối (giờ Việt Nam) của một đợt Bùng, tối đa 14 đêm kể từ hôm bật; qua ngày này máy hạ điểm về Duy trì.
- Code: `burst_until` · RESO: —
_Avoid_: deadline, hạn burst

**Bài**: Một bài đăng thô trong nhóm cộng đồng trước khi đọc thành tin rao; «bài thử» là bài từ nhóm thử.
- Code: `post (stg_zalo_posts)` · RESO: —
- Nhãn đếm: «bài nhận» = bài thật transform đọc (`loadStgPosts` + `testMarker`, không bài S05, không bài thử) theo ngày
  đăng — cột «S03 — bài nhận» của «Luồng 7 ngày qua», chặng «Bài nhận» của Dòng chảy. Cột «S03 — tin rao mới» cạnh nó
  đếm tin theo ngày `first_seen`, có sau lượt đọc đêm (~00:00 giờ VN) nên ngày hôm nay chưa đủ (đổi nhãn 27/10, trước là
  «bài thô» / «tin rao (đã đọc)»).
_Avoid_: post raw, post mock, bài post, bài thô (làm nhãn cột đếm)

**Gộp trùng**: Bước gom các bài đăng lại cùng một tin thành một tin rao (transform S03/S05 bước 4, `repostKey`). Nội dung
đủ phường và diện tích thì gộp theo nội dung (kind · phường · giá · diện tích · PN), kể cả bài của người khác; thiếu một
trong hai thì thêm người đăng (`sender_id`, rồi SĐT, rồi chữ bài đã chuẩn hoá) — khoá thiếu trường mà không phân biệt
người thì gộp nhầm nhiều tin (26/10: 95 bài «cho thuê 12 triệu» thành một tin; sửa 27/10 ở S03). Gộp trùng không đổi
`offer_id` (khoá dính PL14); trên Dòng chảy là nhánh «Gộp vào tin đã có».
- Code: `repostKey` (`pipeline/transform-zalo.mjs`), `n_reposts` · RESO: — (local extension)
_Avoid_: dedup (trên UI), lọc trùng, khử trùng

**Listing tự thu**: Số listing đang theo dõi trong cả khu vực (gồm phường con) — một định nghĩa dùng chung cho thẻ hiệu chuẩn, bảng Độ phủ trung thực và bảng thị trường S02 toàn quốc trên `/ops/quality` (ON10, Mạnh chốt 25/10).
- Code: `ourListings (loadOurListings)` · RESO: —
_Avoid_: tự thu (trơn, không nói đếm gì), listing tháng cuối, max listing_count

**Mẫu mỏng**: Thẻ hiệu chuẩn có ADR/công suất tự thu tính từ dưới 5 listing (cỡ mẫu của market_metrics) — số vẫn hiện, kèm nhãn «mẫu mỏng».
- Code: `isThin (sampleListings, MAU_MONG_DUOI)` · RESO: —
_Avoid_: ít dữ liệu, thin sample

**Thị trường hiệu chuẩn**: Thị trường có ít nhất một số để đối chiếu với S02 (điểm S02, ADR, công suất hoặc listing) — mỗi thị trường một thẻ; thị trường không có số nào gộp vào một dòng «Chưa có số: …». Khu vực gộp nhiều market S02 dùng market đại diện (nhiều listing nhất), thẻ ghi «đại diện cho k thị trường S02»; riêng dòng Listing cộng listing S02 của cả k thị trường, cùng mẫu số với bảng Độ phủ trung thực (Mạnh duyệt 25/10).
- Code: `splitCalibrated (calibrated, empty)` · RESO: —
_Avoid_: khu vực hiệu chuẩn, market hiệu chuẩn

Nhãn tự vận hành từ xa — thêm ở TV0 `adr-duong-lenh-keo` (26/10, ADR-0015). Code là tên bảng đích của đợt
`tu-van-hanh-2510`; bảng sinh ở hàng của nó (PL12, TV4, TV12, TV14).

**Đơn vị thu**: Một thứ mà một nguồn thu theo nó và người vận hành bật/tắt được: nhóm S03 hay S05, vùng S06, market S02. Mỗi đơn vị có một mã ngắn do máy sinh, ổn định, không tái dùng, dạng `S03-N012` (N nhóm · V vùng · M market), hiện ở cả máy chủ lẫn máy thu. Tiêu đề sửa được, mã thì không. Sổ đơn vị thu là một bảng chung cho mọi nguồn (PL12).
- Code: `collection_unit (collection_units: unit_code, unit_type nhom|vung|market, group_key = khoá theo nguồn, market_codes, project_node_ids)` · RESO: —
- Slug URL: `units`
- Ghi chú: «Nhóm thu» vẫn là nhãn của một đơn vị loại nhóm (S03, S05) trên `/ops/sources`; «Đơn vị thu» là nhãn chung khi câu nói về mọi loại. Khu «Sổ đơn vị thu» trên `/ops/sources` hiện mọi đơn vị; «Khai thị trường, khu đô thị» gắn thị trường và khu đô thị nhóm chuyên về (PL12).
_Avoid_: collection unit, source group

**Lệnh**: Một ý muốn ghi có khuôn mà người vận hành gửi trên máy chủ (tạm dừng nguồn, bật một đơn vị thu, đổi lịch…). Máy thu kéo lệnh đã duyệt về, kiểm bất biến, áp, rồi báo kết quả. Lệnh đi theo vòng nháp → đã gửi → đã duyệt → chờ áp → đang áp → đã áp; nhánh phụ là bị từ chối, hoặc lỗi rồi tự hoàn tác. Hoàn tác là một lệnh đảo mới. Không có lệnh tự do (ADR-0015).
- Code: `change_request (change_requests)` · RESO: —
- Slug URL: `change-requests`
_Avoid_: change request, yêu cầu thay đổi

**Quy định ngữ cảnh**: Đoạn chữ người vận hành viết, gắn với một nguồn, một đơn vị thu hay một thị trường, để agent và bộ lọc đọc khi tách bài thành tin rao. Có phiên bản theo vòng nháp → chạy thử → đang dùng → đã gỡ. Bản mới chạy thử trên các bài gần đây và báo số thay đổi trước khi bật; bật bằng lệnh. AI vẫn chỉ lọc, tách, đề xuất (luật 7).
- Code: `context_rule (context_rules)` · RESO: —
- Slug URL: `context-rules`
- Ghi chú: Khác mô tả nhóm (ON19): mô tả là dữ kiện về nhóm; quy định là cách đọc tin của nhóm.
_Avoid_: quy tắc AI, context rule

**Mục tiêu phủ**: Mức phủ mà đội vận hành đặt cho một thị trường theo một chỉ số độ phủ (đơn vị đang thu, tin 7 ngày, % tin gắn được phường, căn). Trang độ phủ thị trường so số đo với mục tiêu và cảnh báo thị trường dưới mục tiêu. Đặt bằng lệnh.
- Code: `coverage_target (coverage_targets)` · RESO: —
- Slug URL: `market-coverage`
- Ghi chú: Số đo tính sẵn ở pipeline (`market_coverage`, luật 10). Khác «Độ tươi»: độ tươi đo thời gian từ lần thu cuối, độ phủ đo thị trường có đủ tin.
_Avoid_: coverage target, mục tiêu độ phủ, chỉ tiêu phủ

## Cổng & tính năng

**Cổng Invest**: Cổng công khai, chỉ đọc, cho nhà đầu tư (`docs/architecture/portals.md`).
- Code: `invest portal` · RESO: —
_Avoid_: Invest Portal, cổng nhà đầu tư

**Cổng Ops**: Cổng vận hành dữ liệu, bắt buộc đăng nhập, từ vai người xem trở lên; mọi route nội bộ nằm dưới `/ops` (luật 9).
- Code: `ops portal` · RESO: —
- Slug URL: `ops`
_Avoid_: Ops Portal, trang admin

**Vai Ops**: Bậc quyền của người dùng ở Cổng Ops, xếp người xem < vận hành < quản trị < chủ sở hữu; quyền từng hành động nằm ở một bảng trong `app/src/lib/ops-access.ts` (TV1). `Người dùng` (`user`) không vào Ops.
- Code: `role` (`viewer` · `ops` · `admin` · `owner`) · RESO: —
- Nhãn UI: `viewer` «Người xem» · `ops` «Vận hành» · `admin` «Quản trị» · `owner` «Chủ sở hữu»
_Avoid_: quyền ops (khi ý là một vai cụ thể), superuser

**Finder**: Tên tính năng (code, docs) của màn xếp hạng khu vực + bản đồ; UI ghi "Thị trường {quốc gia}", không in chữ Finder.
- Code: `finder` · RESO: —
_Avoid_: Market Finder

**Insight**: Tên tính năng (code, docs) của trang chiều sâu một thị trường hoặc phường; UI ghi tên khu vực, không in chữ Insight.
- Code: `insight` · RESO: —
- Neo URL: `#overview` · `#performance` · `#mix` · `#submarkets` · `#listings` · `#supply` · `#yield`
- Ghi chú: Neo mục lục đang tiếng Việt (#tong-quan, #hieu-suat, #co-cau, #phuong, #listing, #nguon-cung, #loi-suat — insight-page.tsx) → đổi sang neo tiếng Anh khi dọn nhóm trang.
_Avoid_: Market Insight

**Bản đồ**: Chế độ bản đồ của Finder (`?view=map`); route cũ chỉ còn redirect.
- Code: `map` · RESO: —
- Slug URL: `map`

**Ước tính lợi suất**: Tính năng nhập phường, số PN, diện tích, giá mua → báo cáo lợi suất kèm độ tin cậy (badge MÔ PHỎNG). Nav ghi "Lợi suất".
- Code: `yield estimator` · RESO: —
- Slug URL: `yield`
_Avoid_: Rentalizer

**Mô phỏng đầu tư**: Máy tính dòng tiền cho thuê ngắn hạn × dài hạn kèm vay, mặc định từ số tự thu (giai đoạn 3). Đã gộp vào Ước tính lợi suất thành mục «Dòng tiền vốn vay» (`#financing`).
- Code: `financing` (`lib/financing.ts`, `FinancingGrid`; trước là `investment simulator`) · RESO: —
- Slug cũ: `dau-tu` → `yield` (gộp vào /yield — redirect /yield?area=<market>#financing)
- Ghi chú: Mạnh đã chốt gộp vào /yield (phiên invest-target-map, PR #6) — không còn là câu hỏi.

**So sánh**: Đặt 2–4 khu vực cạnh nhau theo nhóm Hiệu suất / Nguồn cung / Lợi suất (`?areas=a,b`).
- Code: `compare` · RESO: —
- Slug URL: `compare`
- Slug cũ: `so-sanh` → `compare`

**Ảnh đại diện**: Ảnh hiện thay mặt một khu vực trên So sánh và Đã lưu — là ảnh chính của MỘT listing tự thu trong khu vực (listing đặt nhiều đêm nhất 90 ngày tới), không phải ảnh chụp khu vực; chữ thay thế ghi «Ảnh một listing ở …». Ảnh hỏng thì đổi ảnh khác, hết ảnh thì hiện ô số RevPAR.
- Code: `area thumbnail` (`getAreaThumbnails`, `AreaThumbnail`) · RESO: —
- Slug URL: —
_Avoid_: ảnh khu vực (gây hiểu là ảnh chụp phường/thành phố), ảnh AirDNA

**Ảnh tin**: Ảnh của một tin rao, lưu một dòng mỗi ảnh ở bảng `media` của máy thu (NH1, migration 053): ảnh đã tải vào kho thô, hoặc chỉ còn đường dẫn gốc. Hàng duyệt và hồ sơ tin đọc ảnh tin từ bảng này; chỉ admin thấy, không lên máy chủ. Kiểm chất lượng «Ảnh tin đã tải» đếm mỗi nguồn bao nhiêu ảnh, bao nhiêu đã tải, bao nhiêu tin có ảnh.
- Code: `media` (`transform-media.mjs`, `loadOfferMedia`), kiểm `media:local-file` · RESO: `Media` (DD 2.1)
- Slug URL: —
_Avoid_: media canonical (tên kỹ thuật, không dùng trên UI), ảnh khu vực

**Đã lưu**: Khu vực (sau này listing, báo cáo) người dùng đã lưu — cần đăng nhập.
- Code: `saved` · RESO: —
- Slug URL: `saved`

**Phương pháp**: Trang công khai giải nghĩa chỉ số, công thức và nhãn nguồn tầng C; là đích của các ⓘ trên ô KPI.
- Code: `methodology` · RESO: —
- Slug URL: `methodology`
- Slug cũ: `phuong-phap` → `methodology`

**Đăng nhập**: Trang đăng nhập (`/login?next=`).
- Code: `login` · RESO: —
- Slug URL: `login`

**Đăng ký**: Trang tạo tài khoản (`/register`).
- Code: `register` · RESO: —
- Slug URL: `register`

**Tổng quan vận hành**: Trang gốc Ops: hệ thống có khoẻ không (độ tươi từng nguồn, lần chạy gần nhất). Nav ghi "Tổng quan".
- Code: `ops overview` · RESO: —

**Nguồn dữ liệu**: Registry nguồn + quản trị tài khoản thu; trang duy nhất giải mã tầng A (chỉ admin).
- Code: `sources` · RESO: —
- Slug URL: `sources`

**Chất lượng dữ liệu**: Số tin được không: 4 trụ DQ (độ tươi, khối lượng, schema, phân bố) + đối chiếu hiệu chuẩn.
- Code: `quality` · RESO: —
- Slug URL: `quality`

**Thư viện thiết kế**: Trang trưng bày component ReUI đã cài.
- Code: `design` · RESO: —
- Slug URL: `design`
_Avoid_: ReUI Gallery
