# BiggerPockets Markets — kiến trúc & chỉ số (điều tra REA, 2026-10-20)

> Điều tra https://www.biggerpockets.com/markets và trang market detail
> `atlanta-sandy-springs-alpharetta-ga` bằng REA MCP (passive CDP) +
> chrome-devtools-mcp (runtime thô), Chrome headful profile tạm qua VPN.
> Mục đích: học **nguyên lý** cho lớp thị trường cho thuê dài hạn (LTR) +
> mua bán của One-Invest — KHÔNG copy dữ liệu Mỹ.

## Bằng chứng

| Nguồn | Ghi chú |
|---|---|
| REA bundle `research-local/bp-markets-evidence-2026-10-20.json` (6 records) | `ev_9961d386…` block Cloudflare trước VPN · `ev_0ae9a815…` inspect /markets · `ev_2b8414eb…` target list sau VPN · `ev_640acc32…` analyze_web_bundle /markets · `ev_ad88c6df…` inspect trang Atlanta |
| chrome-devtools raw (KHÔNG phải REA Evidence) | a11y snapshot 2 trang; network bodies `/markets.json` (reqid 400), `/markets/counties.json` (reqid 370) |
| Ảnh chụp | `research-local/bp-screenshots/markets-list-fullpage.jpeg`, `atlanta-detail-fullpage.jpg` |

Ghi chú vận hành: IP Việt Nam bị firewall rule chặn thẳng ("Attention
Required!"). Sau khi bật VPN (PureVPN, IP Singapore), challenge hạ xuống
Turnstile "Chờ một chút…" — click synthetic qua CDP không qua, **người dùng
click tay thì qua**. Khác AirDNA (headful tự qua), BP cần thêm VPN + click
người. Cookie `cf_clearance` gắn với TLS fingerprint của Chrome — curl mang
cookie vẫn 403.

## Kiến trúc kỹ thuật

- **Stack**: Rails SSR trên Heroku (headers `via: 2.0 heroku-router`,
  `x-runtime`) + đảo React (Sentry `sentry.javascript.react`) + app bản đồ
  Vue (globals `__VUE_*`); bản đồ **Leaflet + tile OpenStreetMap**; analytics
  Segment/Amplitude/Clarity/GTM/Reddit; CloudflareTurnstile ở trước.
- **Đơn vị thị trường = MSA** (metropolitan statistical area), ~400 markets,
  slug SEO: `/markets/atlanta-sandy-springs-alpharetta-ga`. Trang theo bang:
  `/markets/states/ga`.
- **List page là hybrid**: khung trang SSR; app map client-side tự fetch 2
  JSON cùng origin:
  - `GET /markets.json` → `[{id:"/markets/akron-oh", name, appreciation,
    rtp, affordability, population, unemployment}]` — **5 chỉ số định dạng
    chuỗi %**, cả ~400 market trong 1 file (không phân trang).
  - `GET /markets/counties.json` → `[{fips, county, state, msa}]` — map
    county→MSA để tô **choropleth cấp county**: số của MSA được sơn nguyên
    lên mọi county thuộc MSA (`ev` reqid 370).
- **Detail page không có API riêng**: toàn bộ số liệu render sẵn trong HTML
  SSR (không JSON island, không XHR dữ liệu). Chỉ breadcrumb `ld+json`.
  React chỉ phụ trách nav/tương tác.
- Freshness hiển thị tĩnh: "Updated: June, 2026".

## Mô hình chỉ số (định nghĩa in sẵn trên UI)

List page ghi rõ: *"crucial investor metrics: Appreciation (YoY Home Price
Growth), Rent-to-Price (RTP) Ratio, Affordability (Household Income to
Price), and more"*.

| Chỉ số | Định nghĩa BP | Atlanta | Thang chia màu choropleth (8 mức) |
|---|---|---|---|
| Appreciation | YoY Home Price Growth | 9.70% | <0 · 0–2 · 2–4 · 4–6 · 6–8 · 8–10 · 10–12 · >12% |
| RTP Ratio | Rent-to-Price (rent tháng / giá) | 0.45% | <0.1 · 0.1–0.2 · … · 0.6–0.7 · >0.7% |
| Affordability | Household Income to Price | 21.61% | <10 · 10–15 · 15–20 · 20–25 · 25–30 · 30–35 · 35–40 · >40% |
| Population | Population Growth Rate | 1.29% | <0 · 0–0.5 · 0.5–1 · 1–1.5 · 1.5–2 · 2–2.5 · 2.5–3 · >3% |
| Unemployment | Unemployment Rate | 3.30% | <1 · 1–2 · 2–3 · 3–4 · 4–5 · 5–6 · 6–7 · >7% |

Kiểm chứng sau login Pro (2026-10-20, same session): 4 nút PRO bật được bình
thường (không upsell chặn), legend đổi theo từng chỉ số như bảng trên; trang
detail **không có thêm khối dữ liệu PRO** — nội dung giống khách free, chỉ
thêm module upsell ("Switch plans to unlock Pro Perks", "Analyze deals like
a PRO"). Kết luận: toàn bộ dữ liệu market của BP là 5 chỉ số list + khối SSR
detail; Pro chỉ bán tầng so sánh trên bản đồ.

Detail page (Atlanta) bổ sung:
- **Key Stats** (4 KPI hero): Median Rental Income $1,672 · Median Home
  Price $367,600 · Rent to Price 0.45% · Affordability 21.61%.
- **Growth Stats**: Appreciation 9.70% · YoY Rent Growth 6.97% · Population
  Growth 1.29%.
- **Macro Stats**: Population 6,256,377 · Unemployment 3.30% · Median
  Household Income $89,724.
- **Community Score** — "Demographics scorecard", 11 điểm chữ A–F: Public
  Schools, Cost of Living, Crime & Safety, Diversity, Jobs, Commute,
  Walkability, Public Transit, Weather, Health & Fitness (kiểu nguồn
  Niche/Census — BP không công bố nguồn ở đây).
- **About**: đoạn văn narrative ~6 cứa sinh template từ chính các số trên
  (dân số hạng mấy, giá dưới/trên trung bình quốc gia, ngành chính, số
  Fortune 500, trường đại học → nhu cầu off-campus housing, ghi chú giấy
  phép STR phải renew hằng năm).
- **Location**: Leaflet marker; **Browse by State** + **Browse by Market**
  (~400 link) = link farm SEO.

## Cấu trúc & monetization

- List: search "City or ZIP Code" → choropleth county với **5 nút chuyển
  metric: Appreciation (free) + 4 nút gắn nhãn PRO** (RTP, Affordability,
  Population, Unemployment) → paywall nằm ở **tầng so sánh nhiều market**,
  không nằm ở tầng đọc 1 market.
- **Recommended Markets**: 25 market do đội BP tuyển chọn ("hand selected by
  our experts", chia nhóm cashflow / growth / hybrid) — mỗi card: ảnh, câu
  tagline viết tay, đoạn narrative sinh từ số, 5 KPI (Median Home Value,
  Median Rental Income, YoY Home Value Growth, YoY Rent Growth, RTP), nút
  VIEW MARKET + SHARE.
- **Build Your Team** (xuất hiện 2 lần/trang): lead-gen agent/lender/PM/tax
  pro có tham số `location=Atlanta, GA` + tracking `itm_source=Market_Finder`
  — dữ liệu miễn phí kéo lead dịch vụ, không bán số liệu trực tiếp.

## Nguyên lý chuyển giao cho One-Invest

1. **5 "trục câu hỏi" của nhà đầu tư dài hạn**: giá & tăng trưởng (mua bán),
   dòng tiền thuê (rent + growth), tỉ lệ thuê/giá (RTP/yield thô), sức hút
   thị trường (dân số, việc làm/thu nhập), chi trả (affordability). Đây là
   bộ khung metric tối giản đã được sản phẩm lớn kiểm chứng.
2. **Tách 2 cấp discovery → depth**: list = ít metric (5), sẩn/sắp trên bản
   đồ; detail = đủ metric + narrative + điểm chất lượng sống.
3. **Narrative sinh từ số** (template) — SEO + người mới đọc dễ.
4. **Curated list do người chọn** cạnh data thuần máy → niềm tin + content.
5. **Choropleth theo đơn vị hành chính nhỏ hơn market** (county ← số MSA).
   Với VN: tô màu huyện/phường theo số thị trường/province không có thì tô
   tỉnh.
6. **Freshness hiển thị rõ** ở ngay khối số liệu.
7. **Paywall/monetize ở tầng so sánh**, giữ tầng đọc công khai (SEO).
   One-Invest chưa monetize → ghi nhận như pattern tương lai, không áp ngay.

## Ledger — khoảng trống & bước sau

- ~~PRO-gated map chưa kiểm chứng~~ → ĐÃ kiểm chứng sau login Pro (mục "Mô
  hình chỉ số"): 4 nút PRO mở khóa, trang detail không thêm dữ liệu.
- Chưa lưu full `/markets.json` (400 dòng; transport truncate — schema +
  ~60 dòng đầu đã ghi trong evidence). Nếu cần: mở lại tab đã qua Turnstile,
  fetch trong page context rồi lưu từng chunk.
- Chưa vào trang `/markets/states/ga` (trang theo bang) — ít giá trị vì
  chỉ là link farm sang market.
- Nguồn số liệu bên dưới BP (Zillow? Census? Niche?) **chưa được xác minh** —
  chỉ có label; không copy số, chỉ học cấu trúc nên không chặn.
- Community Score (11 điểm A–F) phụ thuộc nguồn chất lượng sống Mỹ —
  One-Invest **không tái tạo** ở phase đầu (không có dữ liệu VN tương
  đương); thay bằng Data Confidence đã có.
