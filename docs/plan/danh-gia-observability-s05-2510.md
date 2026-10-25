# Đánh giá đề xuất observability thu thập + S05 (25/10/2026)

- **Đề xuất được đánh giá**: «Quyết định observability + S05 — 25/10/2026», do ZCode soạn (kênh điều phối riêng, lời giao gốc
  `zcode-2510-5`). Mạnh đã ký bằng lời: «đồng ý với khuyến nghị».
- **Người đánh giá**: phiên Claude mở mới (fresh context), làn Claude.
- **Phạm vi**: đối chiếu số baseline §2, rà các quyết định §1, chốt phân công §3, lập checklist S05-B ngày 7/11, và
  danh sách vòng GIAO.
- **Không đổi quyết định đã ký.** Chỗ nào nghi hiểu sai thì đưa thành câu hỏi ở §8.
- Tài liệu công khai nên chỉ dùng mã nguồn `S0x`. Định danh bảng/cột trong code (vd `stg_zalo_posts`, `airdna_listings`)
  giữ nguyên vì đã có trong code.

## 0. Kết luận một đoạn

ZCode hiểu đúng ý Mạnh ở (a), (b) và S05. Riêng (c) còn mơ hồ ai duyệt «lần 2» (Hỏi-3).

Số ruler khớp tuyệt đối. Số yield khớp thứ tự, nhưng chưa tái lập được đúng từng điểm phần trăm.

Phễu S05 và quỹ đạo coverage thì **lệch đủ để đổi lập luận, nhưng không đổi lựa chọn**:
- 60% «rơi do parser» thật ra chủ yếu là tin trùng bị gộp. Phần parser bỏ sót chỉ khoảng 8%.
- «20 deals» là 20 tin có độ lệch giá. Số tin đang thật sự hiện trên «Căn giá tốt» là **7**, và cả 7 đều từ S05.
- Coverage 3 tuần chỉ đạt được khi đường S01 chạy đêm (Z2c) đã triển khai. Nhịp hiện nay chỉ khoảng 38 PDP/ngày.

Phương án B vẫn là lựa chọn đúng, và nay còn có lý do mạnh hơn: tắt S05 thì «Căn giá tốt» về 0.

Về phân công §3:
- **Đổi** chỗ đặt script scorecard: cắt đôi đúng ranh giới DATA-CONTRACT + `stg_*`.
- **Không tạo bảng mới**: ghi vào `dq_check_results` có sẵn (migration 012).
- **Không cần migration ở vòng 1.**

## 1. Đối chiếu số baseline §2 (DB local :5433, truy vấn chỉ đọc, 25/10)

| Mục | Số của đề xuất | Số đo lại | Kết luận |
|---|---|---|---|
| Ruler theo phường (`v_ruler_p2_area`, N≥5) | HN 64/171 = 37% · HCMC 95/167 = 57% · gộp 159/338 = 47% | 64/171 = 37,4% · 95/167 = 56,9% · 159/338 = 47,0% | **Khớp** |
| Ruler, nhìn theo tin | — | Tin S06 bán có phường: 96% (HN) và 100% (HCMC) nằm ở phường có ruler. Tin P1 bán có phường: S05 44/53 = 83%, S03 2/4 | **Bổ sung** — phường thiếu ruler phần lớn là phường ít giao dịch (xem Hỏi-1) |
| Yield S06 (12 trường trên `sale_offers`) | 71% | 71,2% | **Khớp** |
| Yield S05 | 48% | 42,7% nếu `property_type='unknown'` tính là trống · 50,7% nếu tính là có | **Lệch định nghĩa** — yaml phải chốt «có giá trị thật» |
| Yield S03 | 34% (diện tích 42%, URL 0%) | 30,3% / 38,7% (cùng cách tính trên) · diện tích 42% khớp | **Lệch định nghĩa**. «URL 0%» đúng nhưng cột `listing_url` rỗng ở **mọi** nguồn (kể cả S06) — đây là lỗ ở transform, không phải S03 gầy |
| Chỗ thiếu thật ở P1 | — | S03 có phường 2–3%, có quận 0%, có loại 0%. S05 có phường 61%, có quận 0% | **Bổ sung** — chỗ hụt lớn nhất là bóc vị trí ở transform (làn Claude), không phải thu |
| Yield S01 | 95% (7 trường / 508 listing) | 8 trường cơ bản ≈ 98%, `bathrooms`/`property_type`/`minimum_nights` = 0% | **Khớp gần** — yaml phải ghi rõ 7 trường nào |
| Yield S08 | 79% (23/29) | không kiểm (đo trên snapshot, không có ở DB) | — |
| Phễu S05: posts | 296 | 296, **toàn bộ thu trong một ngày 21/10** (6 snapshot, 5 nhóm), 166 nội dung khác nhau | **Khớp số, lệch nghĩa** |
| Phễu S05: offer P1 | 118 («−60% do parser») | 118. Có 214/296 post đã gộp vào 118 offer (tin đăng lại). 82 post không thành offer: 45 nội dung khác nhau, chỉ 23 post có cả giá lẫn SĐT | **Lệch** — phần parser bỏ sót ≤ 23/296 ≈ 8% |
| Phễu S05: phường có ruler | 61 («−48% ngoài ruler») | 61, nhưng gồm 26 tin thuê (thước chỉ cho tin bán). Tin bán: 92 → 53 có phường → 44 ở phường có ruler | **Lệch** — tách bán/thuê, chỗ rơi là bóc phường (39% offer không có phường) |
| Phễu S05: deals | 20 | 20 offer có `bait_gap_pct`, trong đó 7 âm (đắt hơn thước). **Đang hiện trên «Căn giá tốt»** (≥5%, ≤50%, 45 ngày): **7, cả 7 là S05**; S03 = 0 | **Lệch** — «20 deals/tháng» là ngoại suy từ một ngày thu; 7 tin này rời cửa sổ 45 ngày khoảng 5/12 |
| Coverage S02 (3 thị trường) | 508/36.274 = 1,4% | Mẫu số khớp (listing_count 2026-09: 13.052 · 15.066 · 8.156). Nhưng chỉ **270** listing tự thu khớp được với S02 (0,74%), và S01 có **0** listing ở Đà Nẵng. Kiểm `truthful-coverage` sẵn có ghi HN 2,05% · HCMC 1,58% · ĐN 0%, mẫu số khác (HCMC 15.228, ĐN 10.636) | **Lệch định nghĩa** — đã có hai định nghĩa song song (chính là lỗi OPS-11 mà ON10/NT7 đang sửa) |
| Quỹ đạo 30% sau ~3 tuần | +510 PDP hữu ích/đêm ở cap 600 | 7 ngày qua: 269 PDP nạp (≈ 38/ngày), `listings` mới nhất 23/10 | **Có điều kiện** — chỉ đúng sau khi Z2c (S01 chạy đêm, sau ZC5) triển khai; theo nhịp hiện nay cần nhiều tháng |

Cách đo lại: các truy vấn `SELECT` chạy trong phiên `default_transaction_read_only = on`. Không ghi gì vào DB.

## 2. Rà §1 — ZCode có hiểu đúng «đồng ý với khuyến nghị» không

| Mục | Hiểu đúng? | Ghi chú của phiên đánh giá |
|---|---|---|
| (a) Scorecard 6 chỉ số, 1 dòng/nguồn/ngày, cảnh báo tắt được | **Đúng** | Bốn trong sáu chỉ số đã có một phần ở kho: ① `scripts/lib/freshness.mjs` (AU4); ② `listing-volume` trong `450_dq_checks.sql` (chỉ S01); ⑤ các kiểm của 450; ⑥ coverage = `dq-truthful-coverage.mjs`, ruler = `v_ruler_p2_area`. Theo luật 11 (đo trước khi build) và nếp «một định nghĩa», scorecard **gọi lại** các thứ này, không viết công thức thứ hai. Khối freshness trong 450 còn đo theo `zalo-mock` cho S03 (định nghĩa cũ) — gỡ khi scorecard vào. |
| (b) Ruler ≥ 50% phường/market, coverage S01 ≥ 30% universe S02 (tối thiểu); 70%/60% là vạch tham chiếu | **Đúng** về con số và vai trò | Hai chỗ cần chốt định nghĩa trước khi gắn đèn: ruler đếm theo phường không trọng số (Hỏi-1), và tử số/mẫu số coverage (Hỏi-2). Coverage là số suy từ S02 nên **chỉ hiện ở `/ops/quality`** (luật 5, ON6). |
| (c) Khung FIELD_TARGET CEILING / TARGET / ACTUAL + media yield riêng; yaml chi tiết duyệt lần 2 | **Đúng khung**, **mơ hồ người duyệt lần 2** | §1 nói «duyệt LẦN 2», §3 nói «Claude duyệt lần 2». TARGET và trọng số là quyết định «đủ cho ai» (phần chỉ Mạnh định nghĩa được, theo chính diagram A1) → Hỏi-3. Yaml cũng phải chốt «có giá trị thật» (`unknown` = trống) vì số §2 đổi 8 điểm theo cách tính. |
| (S05) Chọn B: thu miễn phí ~2 lượt/tuần, 2 nhóm giữ, đo 1 tháng rồi quyết lại A hay C; bắt đầu 7/11 | **Đúng** về lựa chọn | Lập luận cần sửa (xem §1), nhưng lựa chọn không đổi. Còn ba điểm: (1) thước đo cho lần quyết lại (Hỏi-4); (2) tên nhóm ghi «Bình Thạch» là gõ nhầm, đúng là nhóm nhà đất Bình Thạnh (HCMC), cùng với nhóm chung cư Hà Nội; hôm nay **cả hai đang tắt** trong `source_groups`, chỉ một nhóm khác đang bật; (3) lỗi trả về từ dịch vụ thu là «not-enough-usage-to-run-paid-actor», nên chi phí mỗi lượt phải đo ở lượt đầu và đặt trần số tin. Số «2 lượt/tuần vừa credit miễn phí» là giả định. |

Bằng chứng mới làm B càng hợp lý: S05 đang là nguồn **duy nhất** có tin trên «Căn giá tốt». Phương án C sẽ làm trang về 0. Nhóm
Bình Thạnh cho 19/20 offer có độ lệch giá; nhóm chung cư Hà Nội cho 1 (ruler HN mỏng hơn). Vì vậy giữ hai nhóm này là đúng.

## 3. Chốt phân công §3

| Việc (§3 bản nháp) | Kết luận | Lý do |
|---|---|---|
| Script scorecard đêm (ZCode viết toàn bộ) | **ĐỔI — cắt đôi** | Theo luật làn, ZCode chỉ ghi `stg_*`/`airbnb_snapshots` ở DB local, mà DQ thuộc làn Claude. Phần đọc **đĩa + con trỏ state** là hiểu biết của làn thu → ZCode viết probe chỉ đọc, xuất JSON. Phần tính 6 chỉ số và ghi DQ → Claude. Ranh giới trùng đúng chỗ «đĩa > state > stg». |
| Ai treo launchd | **ZCode, theo lời GIAO triển khai** | `pipeline/cron/*.plist` và `scripts/install-*` thuộc làn ZCode. Claude merge script trước, ZCode thêm plist + bootstrap theo checklist. |
| FIELD_TARGET yaml (ZCode soạn, Claude duyệt) | **ĐỒNG Ý, kèm chỗ sống + chia quyền** | Sống cạnh DATA-CONTRACT vì nó là phần nối dài của hợp đồng: «nguồn nên giao những trường nào». ZCode soạn CEILING + đường dẫn JSON raw. Claude kiểm cột canonical, tên RESO (ADR-0011) và định nghĩa «có giá trị». TARGET + trọng số: xem Hỏi-3. |
| `yield()` tại transform + bảng DQ hằng đêm (Claude) | **ĐỔI cách làm, giữ làn Claude** | Không cài `yield()` vào bốn tệp `transform-*` (đường nóng, bốn chỗ sửa). Yield đo **sau** transform bằng SQL trên `sale_offers` / `listings`, trong script scorecard. Không tạo bảng mới: dùng `dq_check_results` (đã sync lên cloud qua FILL, `/ops/quality` đã đọc theo ON9). |
| UI `/ops/collections` + `/ops/quality` (Claude) | **ĐỒNG Ý** | `/ops/collections`: một dòng/nguồn, chỉ số ①–⑤ + đèn ruler, **không số nào suy từ S02** (luật 5, ON6). `/ops/quality`: coverage so 30/60, ruler so 50/70, yield từng trường. React chỉ đọc dòng đã tính sẵn (luật 10). |
| S05 resume 7/11 (ZCode, GIAO triển khai riêng) | **ĐỒNG Ý, thêm hai việc làn Claude và một việc của Mạnh** | Claude: SLO S05 trong `freshness.mjs` đang là 12 giờ, với 2 lượt/tuần thì đỏ vĩnh viễn → đổi trước 7/11; `source_registry` S05 `paused → active`. Mạnh: chọn nhóm trên `/ops/sources` (quyền admin). Chi tiết ở §5. |

## 4. Chỗ sống các thành phần

| Thành phần | Đường dẫn | Làn | Ghi chú |
|---|---|---|---|
| Probe đĩa + state | `pipeline/collect-probe.mjs` | ZCode | Chỉ đọc. Không kết nối DB. JSON ra stdout, mỗi `(mã S0x, city)` một mục: số snapshot + số item 7 ngày, trung vị 7 ngày, mốc snapshot cuối, con trỏ state, danh sách snapshot trên đĩa mới hơn con trỏ. Dùng chung regex mốc thời gian với importer (AU3). Hiểu quy ước snapshot nguyên tử (2510-8). |
| Script scorecard | `pipeline/dq-scorecard.mjs` | Claude | Gọi probe. Đọc `stg_*` + canonical. Dùng lại `scripts/lib/freshness.mjs` (①) và kết quả `truthful-coverage` (⑥). Ghi `dq_check_results`. Chạy lại cùng ngày không nhân dòng (bài học NT7). Nguồn `paused` / `completed` → `skip`. Cảnh báo tắt bằng danh sách hằng **có ngày hết hạn** ở đầu tệp (cùng nếp với `SLO_HOURS`). |
| FIELD_TARGET | `collector/docs/field-targets.yaml` | ZCode soạn · Claude kiểm · Mạnh duyệt TARGET (Hỏi-3) | Mỗi nguồn × trường: `canonical` (cột), `raw_path`, `ceiling`, `target`, `weight`. Media yield là khối riêng. |
| launchd | `pipeline/cron/com.oneinvest.dq-scorecard.plist` + `scripts/install-dq-scorecard.sh` | ZCode | 06:30 hằng ngày (sau chuỗi 05:30). Bootstrap theo GIAO triển khai. |
| Bảng DQ / yield | `dq_check_results` (migration 012, có sẵn) | Claude | `check_name`: `scorecard:freshness`, `scorecard:volume`, `scorecard:load-gap`, `scorecard:capture-yield`, `scorecard:record-dq`, `scorecard:fit-ruler`, `scorecard:fit-coverage`. `entity`: `S03`, `S03/hanoi`, `S03/area_m2`, `vn-hanoi`. `detail` chỉ mang mã `S0x` (bảng này lên cloud). |
| Trang | `/ops/collections` (1 dòng/nguồn), `/ops/quality` (đủ theo use-case, yield từng trường) | Claude | `/ops/quality` dùng chung `queries.ts` + `quality-tables.tsx` với ON9/ON10/ON12/ON13 → chạy sau, không song song. |
| Ngưỡng 50/70 và 30/60 | hằng trong `pipeline/dq-scorecard.mjs` | Claude | Đổi số = một commit, không cần migration. |

**Số migration**: vòng 1 **không cần migration**. Số cao nhất trên origin/main và mọi nhánh local + origin là `040`.
Sổ SO-MIGRATION (phiên liên làn xác nhận 25/10): `041` giữ chỗ có điều kiện cho ZC7 (tín hiệu lần thu), `042` giữ chỗ có
điều kiện cho catalog S08 → stg. Số trống kế tiếp là `043`, chưa giữ cho ai. Việc này không giữ số. Nếu đo xong một tháng
mà cần bảng riêng (vd yield theo trường quá nhiều dòng cho `dq_check_results`), xin số ở SO-MIGRATION lúc đó; sổ cấp theo
thứ tự.

## 5. Checklist S05-B (bắt đầu 7/11)

**Chuẩn bị, xong trước 6/11**

| # | Ai | Việc | Kiểm |
|---|---|---|---|
| P1 | ZCode | `claudedp-2510-4` (bỏ qua khi `paused` + giữ mã thoát bước thu) đã merge | Log thu S05 sau merge: có dòng «paused → bỏ qua», không còn dòng lỗi credit, launchd exit 0 |
| P2 | ZCode | `zcode/s05-b-lich`: plist 2 lượt/tuần (đề xuất thứ Ba + thứ Sáu 06:00) + trần số tin mỗi nhóm mỗi lượt, đủ ~9 lượt/tháng trong credit miễn phí | `plutil -lint`; PR qua làn merge |
| P3 | Claude | `SLO_HOURS.S05` 12 → 96 giờ (+ test parity AU6) | `node --test scripts/*.test.mjs` xanh |
| P4 | Mạnh | Xác nhận ngày reset credit của dịch vụ thu S05 (7/11 là giả định) | Một dòng trả lời |

**Ngày 7/11**

| # | Ai | Việc |
|---|---|---|
| 1 | Mạnh | Mở bảng điều khiển của dịch vụ thu: credit đã reset |
| 2 | Mạnh | `/ops/sources`: bật nhóm nhà đất Bình Thạnh (HCMC) và nhóm chung cư Hà Nội, tắt nhóm còn lại (Hỏi-5) |
| 3 | Claude (liên lần) | Đọc lại DB chỉ đọc: `source_groups` S05 có đúng 2 nhóm `enabled`. `source_registry` S05 `paused → active` |
| 4 | ZCode | Kiểm collector :9210 sống — S05 đổ tin qua đây, chung đường với S03 |
| 5 | ZCode | Từ checkout chính (ngoại lệ triển khai): bootout plist cũ, cài plist mới (P2), chạy một lượt tay |

**Kiểm hai phía (ZCode gửi `tin XONG` kèm bằng chứng)**

- *Phía thu*:
  - lượt chạy của dịch vụ thu thành công, ghi chi phí USD của lượt;
  - có snapshot `…__zalo-agent__<mốc 7/11>` mới, manifest ok, chứa bài S05;
  - exit 0, log không có lỗi credit.
- *Phía S03 (cùng :9210)*:
  - watchdog S03 ok, 0 agent turn;
  - tin S03 vẫn chảy (snapshot hook S03 mới trong 1 giờ).
- *Phía pipeline* (Claude kiểm chỉ đọc, sau lượt nạp):
  - `stg_zalo_posts` có bài S05 mốc 7/11;
  - `check-freshness` S05 xanh;
  - `sale_offers` S05 tăng;
  - đếm tin S05 mới trên «Căn giá tốt».
- Phiên liên làn ghi số trước/sau vào sổ vòng mở.

**Đo một tháng (7/11 → 7/12), mỗi lượt, tách theo nhóm** (theo Hỏi-4)

1. Tin mới hiện trên «Căn giá tốt» (P1 bán, phường có ruler, lệch 5–50%).
2. Chi phí USD của lượt → USD/tin hiện.
3. Post khác nội dung → offer → offer có phường.

Ngày 7/12, Mạnh quyết A / B / C dựa trên ba số này.

**Hoàn tác**: `source_registry` S05 → `paused` (collector tự bỏ qua nhờ P1) + bootout plist.

## 6. Danh sách vòng GIAO cho ZCode (gửi qua phiên liên làn sau khi Mạnh trả lời §8)

Mỗi vòng một nhánh cắt từ `origin/main`. Thứ tự hiện có giữ nguyên: 2410-23 → cài hook ZC6 → ZC4; ZC7 (2410-18), 2510-8/9, S08.
Các vòng dưới đây xếp song song, theo ràng buộc riêng:

| Thứ tự | Vòng | Nhánh | Đứng sau | Đầu ra |
|---|---|---|---|---|
| G1 | S05 lịch 2 lượt/tuần + trần số tin | `zcode/s05-b-lich` | 2510-4 merge | plist + tham số trần. Phải merge trước 6/11 |
| G2 | Triển khai S05-B (không nhánh) | — | G1 merge, P3 merge, 7/11 | Checklist §5, `tin XONG` kèm bằng chứng hai phía |
| G3 | Nháp FIELD_TARGET | `zcode/field-targets` | Mạnh trả lời Hỏi-3 | `collector/docs/field-targets.yaml` (S01, S03, S05, S06, S08 + media). Gửi `BÁO` trước khi mở PR để Claude kiểm, rồi Mạnh duyệt TARGET |
| G4 | Probe đĩa + state | `zcode/collect-probe` | 2510-8 (snapshot nguyên tử) merge | `pipeline/collect-probe.mjs`, test trên thư mục snapshot giả, chạy trên bản chép (luật kiểm 24/10) |
| G5 | Treo launchd scorecard | `zcode/dq-scorecard-launchd` | hàng C2 (Claude) merge | plist + `install-dq-scorecard.sh`, rồi lời GIAO triển khai: bootstrap, lượt đầu có dòng `scorecard:*` trong `dq_check_results` |

## 7. Hàng làn Claude đề xuất thêm vào lộ trình (phiên giám sát đợt quyết dãy và thứ tự)

| Mã nháp | Slug đề xuất | Câu giao | Hạng | Đứng trên |
|---|---|---|---|---|
| C1 | `s05-slo-theo-lich` | check-freshness đo S05 theo nhịp 2 lượt/tuần (SLO 96 giờ), giữ parity với `/ops` | T2 | — (cần trước 7/11) |
| C2 | `scorecard-thu-thap` | Mỗi đêm `pipeline/dq-scorecard.mjs` ghi 6 chỉ số cho mỗi nguồn `S0x` vào `dq_check_results`. Chạy lại cùng ngày không nhân dòng. Nguồn paused thì skip. Cảnh báo tắt được, có ngày hết hạn. Gỡ khối freshness cũ của 450 | T2 | G4 (chỉ số ③), G3 (chỉ số ④), NT7 (coverage mức listing) |
| C3 | `collections-scorecard-nguon` | `/ops/collections` hiện một dòng/nguồn từ dòng `scorecard:*` mới nhất, không số suy từ S02 | T2 | C2, ON6, ON5 |
| C4 | `quality-du-theo-use-case` | `/ops/quality` hiện ruler so 50/70, coverage so 30/60 từng thị trường, yield từng trường so TARGET | T2 | C2, ON9, ON10, ON12 (chung tệp) |

Không thêm hàng coverage riêng: định nghĩa coverage mức listing (matched/universe) đã là NT7. Chỉ ghi C2 đứng trên NT7.

Một quan sát cho người xếp hàng: S03 có phường ở 2–3% offer, nên hiện cho 0 tin trên «Căn giá tốt». Đây là việc sửa parser
S03 đang nằm ở chân trời (PH2, chờ tập nhãn). Số yield của scorecard có thể là căn cứ mở lại PH2 sớm hơn — để phiên giám sát cân nhắc.

## 8. Câu hỏi cho Mạnh (chỉ điểm còn ngỏ)

| # | Câu hỏi | Khuyến nghị | Trả lời gõ sẵn |
|---|---|---|---|
| Hỏi-1 | Ruler «≥50% phường» đã ký đếm mọi phường như nhau. Nhưng 96–100% tin bán đã nằm ở phường có ruler, còn chỗ rơi thật của P1 là **tin không bóc được phường** (S03 97%, S05 39%). Có thêm một số chẩn đoán «% tin P1 có phường» (không ngưỡng) cạnh đèn ruler không? | Có. Giữ nguyên ngưỡng 50% đã ký làm đèn, số mới chỉ để chỉ đường sửa parser | `Hỏi-1: đồng ý thêm số chẩn đoán, giữ ngưỡng 50%` |
| Hỏi-2 | Coverage ≥30% tính thế nào: tử số là listing tự thu **khớp được** với S02 (hôm nay 270, không phải 508); mẫu số là listing_count tháng gần nhất; **đo từng thị trường**, không gộp 3. Đà Nẵng ghi «chưa thu» tới khi S01 chạy ở đó. Mốc «~3 tuần» chỉ tính từ khi Z2c chạy | Đồng ý — trùng định nghĩa NT7, khỏi thêm định nghĩa thứ ba | `Hỏi-2: đồng ý định nghĩa coverage theo NT7, từng thị trường` |
| Hỏi-3 | Yaml FIELD_TARGET «duyệt lần 2» là ai: Claude kiểm kỹ thuật (cột, tên RESO, «có giá trị thật») còn **Mạnh duyệt TARGET + trọng số**, hay Claude duyệt hết? | Chia đôi: Claude kiểm kỹ thuật, Mạnh duyệt TARGET + trọng số (đó là «đủ cho ai») | `Hỏi-3: chia đôi — tôi duyệt TARGET + trọng số` |
| Hỏi-4 | Ngày 7/12 quyết A/B/C dựa trên: tin mới hiện trên «Căn giá tốt» mỗi tuần, USD/tin hiện, tách theo nhóm. Không đặt ngưỡng trước, quyết khi có số | Đồng ý ba số, không đặt ngưỡng trước | `Hỏi-4: đồng ý ba số, quyết khi có số` |
| Hỏi-5 | Ngày 7/11 ai bật 2 nhóm S05: Mạnh tự tick trên `/ops/sources` (2 click, quyền admin), hay cho phiên liên làn đổi `source_groups.enabled` ở DB local? | Mạnh tick — thao tác cấu hình có quyền admin, để lại audit | `Hỏi-5: tôi tự tick ngày 7/11` |

Mạnh có thể trả lời gọn: `Hỏi-1..5: theo khuyến nghị`.
