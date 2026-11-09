# One Invest — ROADMAP v4 MASTER (2026-10-22)

> **NGUỒN CHÂN LÝ DUY NHẤT cho mọi phiên AI / người mới.** Thay thế ROADMAP
> v3 (10/18 — lưu ở ROADMAP-v3-archive.md) và mọi lộ trình rời. Đọc file
> này trước khi đề xuất bất kỳ việc gì. Cập nhật file này mỗi khi chốt
> quyết định mới (luật AGENTS.md).

## 0. Cách dùng

- Mọi phiên bắt đầu: đọc §1 nguyên tắc + §3 quyết định đã chốt (KHÔNG hỏi
  lại user những gì đã chốt), rồi **`LO-TRINH.html` / `docs/plan/lo-trinh.json`** để biết việc kế tiếp.
- Làm xong việc: cập nhật §2 as-built; trạng thái việc máy tự suy từ `_acceptance/<slug>/` lên lộ trình.
- Việc mới phải tra §3 xem đã chốt chưa; quyết mới → ghi §3.

**Mỗi loại thông tin một chỗ** (Mạnh chốt 23/10):

| Loại | Ở đâu | Ai cập nhật |
|---|---|---|
| Mục đích, mục tiêu, thước đo | `docs/product/FRAMING.md` | Mạnh duyệt, có nhật ký §9 |
| Hiến pháp, quyết định đã chốt | §1, §3 của tệp này + `docs/adr/` | phiên làm việc, sau khi Mạnh chốt |
| **Việc phát triển sắp làm + mốc** | **`docs/plan/lo-trinh.json`** (trang `LO-TRINH.html`) | thêm bằng cắt lượt (`/acceptance-gate:cat-luot`) từ một bản phạm vi `docs/plan/pham-vi-*.md`; mốc ở khối `moc` |
| Trạng thái từng việc | máy suy từ `_acceptance/<slug>/`, hiện trên `LO-TRINH.html` | không ai ghi tay |
| As-built + chỉ mục | §2, §4 của tệp này — §4 trỏ mã hàng của lộ trình, không chép danh sách việc | phiên làm xong việc |
| Căn cứ (audit, review, nghiên cứu) | `docs/audit/`, `docs/architecture/`, `docs/research/` | đầu vào của cắt lượt, không phải danh sách việc |
| Bối cảnh khi mở vòng một hàng (đọc gì cho hàng nào, quyết định còn chờ chặn hàng nào, việc của người) | `docs/plan/BOI-CANH.md` | phiên cắt lượt; cập nhật khi cắt đợt mới hoặc chốt quyết định |
| Nguồn của bản phạm vi — nghiên cứu, thảo luận, quyết định đã chưng cất (tầng tri thức, kit 2.34.0) | kho RIÊNG TƯ `phanlemanh/onehub-invest-tri-thuc` (`~/dev/onehub-invest-tri-thuc`, khai `tri_thuc` trong `_acceptance/config.yaml`): `raw/` bất biến + `wiki/nen`, `wiki/dot`; khoá `nguon` của bản phạm vi là đường trỏ băm `onehub-invest-tri-thuc:wiki/dot/<đợt>.md#<băm>` | ghi bằng `/tri-thuc:ghi`, kiểm `/tri-thuc:kiem`; tầng A không vào cả kho riêng |
| Giao việc cho ZCode | kênh tin (issue #9) — **mỗi lời giao ghi mã hàng** của lộ trình | điều phối liên làn |

## 1. Nguyên tắc bất biến (hiến pháp)

> Khung mục đích · mục tiêu · thước đo: **`docs/product/FRAMING.md`** (Mạnh duyệt 23/10). Hiến pháp
> dưới đây là luật kỹ thuật phục vụ khung đó; việc mới nói nó phục vụ phía nào, câu hỏi nào, thước đo nào.

1. **Dữ liệu**: KHÔNG scrape AirDNA cho sản phẩm; RESO-first (ADR-0011 —
   tra DD trước khi bịa field); migration-only (AGENTS.md #3); metrics
   precompute server-side.
2. **LLM-off-data-path**: LLM/agent chỉ gate/judge/extract có audit +
   evidence; KHÔNG bao giờ sửa dữ liệu trực tiếp. Regex/structured là
   đường chính.
3. **SPL**: mã nguồn S0x (ADR-0007); tầng A (tên nguồn thật, hồ sơ người dùng app,
   định danh tài khoản thu, phiên/khoá) KHÔNG bao giờ rời máy thu. Người bán, tên nhóm
   thu là tầng C, tên và SĐT người bán lên cloud và cổng Invest; nội dung bài, ảnh tin,
   thẻ duyệt lên cloud cho vai ops (ADR-0007 sửa đổi 23/10, 24/10, 26/10, 02/11).
4. **Observability là điều kiện ra quyết định**: nguồn mới phải hiện trên
   /ops ngay (feed health), hành vi thu phải đo được (CCP/DQO).
5. **An toàn social**: agent LLM không bao giờ gửi tin vào nhóm xã hội
   (lockdown 7 lớp + watchdog runtime guard — 2 sự cố đã xảy ra).
6. **Local-first AI**: Qwen 27B (MTPLX :8000) + Kev-4B gate (81ms) là mặc
   định; cloud (OpenAI Decisions) chỉ cho dữ liệu phi-PII.
   *(23/10: Mạnh nêu cần AI Gateway chọn model theo việc + biết chi phí — đề xuất sửa luật này ở review
   phân loại §0.4 M1, chờ Mạnh chốt.)* **Ngoại lệ có tên (07/11, §3 mục 33):** đọc tin S03 dùng ba model cloud
   qua Vercel AI Gateway (ADR-0007 sửa 06/11), chọn model theo ô bằng bảng `agent/config/doc-gop-s03.json`.
7. **Đơn vị nghĩ là CĂN NHÀ**: "Một Căn Nhà" (entity properties) là đơn vị
   phân tích; nguồn chỉ là evidence.
8. **Đo trước khi build**: không graph/vector/infra mới trước khi số liệu
   chứng minh nhu cầu (bài học Mem0 bỏ graph).

## 2. Kiến trúc AS-BUILT (2026-10-22)

### 2.1 Monorepo onehub-invest (private, ADR-0012)
```
app/        Invest+Ops portal (Next.js; prod Vercel + Supabase)
data-api/   public standalone Hono (subtree → onehub-data-api)
collector/  thu thập (hooks, CCP, source_groups — quản trị /ops/sources)
agent/      onehub-ai-agent (kiến trúc chốt §3.5-3.6)
pipeline/ db/ docs/ tools/sync-public (overlay sanitise)
```
`~/dev/one-invest` = symlink → `~/dev/onehub-invest` (launchd cũ chạy được).
DB local `one-invest-db` (PostGIS :5433 trên colima) tự chạy lại khi Docker/máy khởi động lại:
`restart: unless-stopped` trong `db/docker-compose.yml` (2026-10-23, AU7) — kiểm `bash scripts/check-db-autostart.sh live`.
Public mirrors LIVE: onehub-invest-app + onehub-data-api.

### 2.2 Pipeline dữ liệu 5 tầng
```
thu (S0x, launchd tự động) → raw snapshots (DATA-CONTRACT)
→ stg_* → transform (parser VN + phone + RESO property_type; S03/S05 upsert + đối soát
  offer cũ qua `writeOffers` — đề xuất enrich + thẻ duyệt sống qua nạp lại, 039;
  gạt post thử ở đầu đọc qua `lib/test-posts.mjs` — snapshot giả/agent thử/nhóm TEST, audit
  `transform:reject-test`, PL2)
→ enrichment_proposals (E1/E2 đề xuất → luật xác định / /ops/review;
  E1 trái LLM → thẻ đối chiếu, người chọn; E1 không suy land từ tên nhóm;
  hoàn tác có audit qua `revert_enrichment` (036) + CLI enrich-revert;
  không UPDATE thẳng canonical, không lên cloud)
→ sale_offers (canonical; price_tier P0/P1/P2; CHECK enums VALIDATE ở 043)
→ properties (entity "Một Căn Nhà", Stage A/B) → ruler v_ruler_p2_*
→ sản phẩm: Deals v2 ở /ops/deals (bait_gap; SĐT chỉ admin, local) · G3 calculator (STR tự thu) · /ops panels
```
- Sổ từ vựng một nguồn (PL6, `_acceptance/so-tu-vung-mot-nguon`): khối `enums:` của `pipeline/mappings.yaml` — 9 trục
  (kind, property_type, confidence, price_tier, enrich_field, listing_intent, offer_status, data_level, capability_level)
  theo khuôn RESO Lookup. `node pipeline/vocab.mjs --write` sinh hằng `pipeline/lib/vocab.generated.mjs`,
  `agent/src/vocab.generated.ts`, `app/src/lib/vocab.generated.ts` + khối «Từ vựng dữ liệu» của CONTEXT.md; `--lint` đỏ khi
  có enum viết tay ngoài sổ (8 ngoại lệ có lý do ở `enums_lint_allow`); `--check-db` so `ref_lookup`/`ref_field_lookup`
  (migration 043, chỉ local) và CHECK với sổ; `--check-field-targets` khoá tên trường FIELD_TARGET (G3) theo
  `canonical.fields`.
- Nạp lại không xoá (PL14, `_acceptance/nap-lai-khong-xoa`, migration 044): `sale_offers`/`listings` là VIEW sống
  (`retired_at IS NULL`) trên bảng bản ghi `sale_offer_records`/`listing_records` — chỗ đọc không đổi, chỉ đường ghi biết
  bảng bản ghi. Tin vắng lượt nghỉ (`het_trong_luot`/`doi_khoa`), listing ngoài phường nghỉ (`ngoai_phuong`); không câu
  DELETE/TRUNCATE nào nhắm hai bảng (bộ quét `pipeline/lib/scan-delete.mjs`). `reconcile_stale_offers` bản 044 chuyển đề
  xuất enrich, thẻ `enrich:`/`pair:`, `property_offers`, ứng viên ghép đã quyết sang tin kế (`superseded_by`); 6 khoá ngoại
  tới hai bảng là RESTRICT. Khoá S03/S05 «dính» (`pipeline/lib/offer-key.mjs`): nhóm repost thừa kế `offer_id` của tin
  chung nhiều post nhất, nhóm mới băm `'<S0x>|<post neo>'`; `originating_system_key` (RESO) cho S03/S05/S06 và listing.
- Gộp trùng S03 vừa tay (`_acceptance/s03-gop-trung-dung`, 27/10): khoá gom repost (`repostKey`, transform-zalo bước 4)
  thiếu phường hoặc diện tích thì thêm người đăng (`sender_id` → SĐT → chữ bài chuẩn hoá) — DB local 349 → 586 tin S03,
  nhóm lớn nhất 177 → 115 bài, đối soát không cho nghỉ tin nào. «Luồng 7 ngày qua» đếm «S03 — bài nhận» bằng đúng tập
  `loadStgPosts` + `testMarker`, cột «S03 — tin rao mới». S05 cùng công thức khoá — chưa đổi.
- Vá hẹp bộ đọc tin S03 (`_acceptance/s03-va-doc-tin`, SV1, 02/11): DT có phẩy, PN viết tắt, phường trùng hướng phải gọi đích danh, số
  ngữ cảnh không thành giá, thuê từ 1 tỷ không đơn vị thời gian thành bán, giá che số lưu số sàn (Mạnh duyệt, sai số tới khoảng 5%, PL13 lo cận
  trên), giá không đơn vị có nhãn. Toà, trục đi qua phát biểu `parser`, trục vào khoá gom. Trên nhãn tác tử gắn (không phải nhãn vàng): PN 61→225/241,
  giá 128→208/237. Có hiệu lực ở lượt 00:00 sau khi gộp (Mạnh duyệt): S03 2.772→3.158 tin, nghỉ 130, mọc do bộ đọc 391; đo chỉ đọc khớp lượt thử trên DB thử.
- LLM đọc toàn bộ chữ S03 (LS1 `_acceptance/s03-llm-doc-toan-bo`, 03/11): lệnh `agent/scripts/doc-toan-bo-s03.ts`, lõi `agent/src/enrich/doc-toan-bo.ts`.
  Đọc bài mới nhất của mọi tin S03 có chữ, trọn chữ đã gạt SĐT, email, link, tên cấm; nhãn ở `silver_labels` prompt `dtb-s03-v1`, không gọi lại cùng chữ đã đọc được; nhãn JSON hỏng được đọc lại trong trần tiền của lượt. Tin
  `unknown` chỉ tự điền căn hộ khi câu trích có thật và chứa từ khoá (`agent/src/enrich/luat-trich-dan.ts`), actor `doc-toan-bo:<runId>`; loại khác và E1 trái model lên thẻ.
  Ý định, giá, diện tích chỉ đối chiếu: lên `evidence.doi_chieu` của thẻ `enrich:<offer_id>`, duyệt hay bỏ ghi `ops_audit` `enrich:doi-chieu`, không đổi tin. Cờ: `--tran-usd`
  (mặc định 3), `--tran-the` (500), `--thu` (không ghi), `--dem`, `--mau N` + tệp nhãn, `--nguong-dung` (0,85 trên ≥ 100 ca); lượt thật từ chối khi chưa có mẫu đạt cùng prompt.
  Đường lui: `--dem` in `run_id`, `revert_enrichment` nhận id các đề xuất `applied` của `run_id` đó. **Chưa chạy lượt thật:** chờ Mạnh ký, `pg_dump` trước; số đo chỉ có sau lượt đó.
  Nới luật (`_acceptance/s03-noi-luat-trich-dan`, 04/11): `LUAT_VERSION = trich-v2` nhận thêm dạng số phòng, `studio`, `stu` (mã `trich-dan:so-phong`), loại khi thân bài có từ loại khác; cổng mẫu gắn phiên bản luật và đòi nhánh mới tự đạt. `--xu-lai-trich` dùng lại nhãn đã đọc. Lượt ghi thật chờ chữ ký.
- S03 lên cổng (SL1 `_acceptance/s03-len-cong`, 03/11): tin không nói phường mang khu vực cấp thị trường qua `transform-zalo.mjs`, không ghép căn ở `resolve-properties.mjs` và tính vào đúng thị trường ở 500, 610; migration 069 cho riêng `property_type` nhận giá trị suy khi chỉ có một ứng viên (`tier: inferred`); thẻ tin S03 có nhãn «Chưa xác minh». Sổ nhóm nháp nằm ở `research-local/`, chưa được duyệt và chưa áp.
- VLM đọc ảnh tin S03 (KC3 `_acceptance/vlm-anh-tin-s03`, 02/11): chọn bài mà chữ còn thiếu giá, loại hình hoặc dấu hiệu tin rao, đọc mỗi ảnh khác nhau một lần bằng
  Qwen trên máy (`agent/scripts/vlm-anh-run.ts`, chọn bài và đếm ở `pipeline/vlm-anh-s03.mjs`), ghi đề xuất vào `silver_labels` nguồn ảnh, không ghi canonical và không lên cloud.
  Lô thật 100 bài: tốt 48, rỗng 51, lỗi 1, lấp đúng lý do thiếu 9, chỉ 1 dòng có giá; JSON hỏng 0, `lo-url` 0, ước 2,3 giờ hết tập đọc 2.406 bài (`docs/research/s03-vlm-anh-do.md`).
  Haiku và DeepSeek chỉ chấm phiếu mẫu Mạnh đã xem (`--gold`), chưa chạy thật nên chưa model nào có số độ đúng. Ảnh lộ nguồn gắn nhãn, không chặn.
- Cầm máu số liệu S03 (N1 `_acceptance/s03-cam-mau-so-lieu`, 30/10): `parsePost` đọc số trên chữ đã gạt URL và SĐT (`gatSo`),
  luật giá môi giới («2.650 tỷ» = 2,65 tỷ, «2400 tỷ thu về» = 2,4 tỷ, «2ty450», «5tr5», «7.000.000», «Giá: 4,000» tin bán),
  DT «64m» (15–500, chặn bề ngang); số đếm sau chữ tỷ («8 tỷ 4 tầng») không thành phần lẻ, đơn giá «45.000.000/m2» ra giá/m²; bài thuê từ 1 tỷ / bán trên 100 tỷ không thành tin (`lyDoGiaPhiLy`, đếm theo lý do);
  khoá gom thiếu phường/DT thêm mã toà/căn (`maToaCan`); `seller_name` = tên bài mới nhất; phường theo `market_codes` của
  nhóm, nhóm chưa khai đối chiếu mọi thị trường có phường, tên trùng hai nơi ra null. DB thử: 0 tin thuê ≥ 1 tỷ (từ 41),
  0 bán > 100 tỷ (từ 94), 0 giá từ URL (từ 4), `seller_name` 96,9% (từ 0), 0 tin TP.HCM sai phường (từ 38).
  Bước gạt SĐT bỏ qua đuôi nhóm nghìn của giá đồng: «3.000.000.000» (`_acceptance/s03-gia-ty-chan-dong`) và cả khi sau giá là
  khoảng trắng/xuống dòng + 1–2 chữ số, «3.000.000.000\n50m2» (`_acceptance/s03-gia-ty-sau-khoang-trang`; nhóm cuối «000», thân
  số tiền không dính chữ — SĐT 3-3-3 kèm đuôi vẫn bị gạt); 21.934 bài thật: 0 bài đổi.
  Ảnh của tin chỉ-ảnh S03 (mỗi ảnh một tin, chữ là URL) vào offer của tin chữ GẦN NHẤT cùng người, cùng nhóm, dưới 2 phút
  — ở bước dựng bảng `media` (`transform-media.mjs` + `lib/gop-anh.mjs`), `sale_offers` và bảng nạp không đổi
  (`_acceptance/gop-tin-chi-anh-o-transform`, PL28): DB thử 276 → 422/885 offer có ảnh (31,2% → 47,7%, ngưỡng ≥ 45%).
  Listing Airbnb transform cho nghỉ ngoài phường mang toạ độ của lần thu mới nhất (thiếu → NULL), giữ mốc + lý do nghỉ cũ
  (`_acceptance/airbnb-nghi-khong-hoi-sinh`) — reassign-areas chỉ đánh thức listing nghỉ khi toạ độ HIỆN HÀNH vào phường.
- Phát biểu + phân xử (PL15, `_acceptance/phat-bieu-va-phan-xu`, migration 045): bảng chỉ-thêm `field_assertions`
  (RESO extension `FieldAssertion`, chủ thể = khoá gốc từng post/list_id); hàm `resolve_offer_fields` dựng năm cột
  `property_type`/`bedrooms`/`bathrooms`/`street_raw`/`block_raw` theo ba lớp căn cứ (sự thật › quan sát có trích dẫn ›
  suy luận; thứ tự tạm trong lớp hitl › trường nguồn; parser › E1 › E2 › legacy — Mạnh đồng ý 26/10) kèm
  `field_provenance`; suy luận không vào cột. Hết fill-gap và `ENRICH_COLS`; người (`hitl:`) thắng mọi phương pháp.
  Cổng «chưa cắt chuyển» chặn phân xử tới khi `pipeline/phat-bieu-cat-chuyen.mjs` ghi giá trị có sẵn thành phát biểu
  `legacy` (runtime-map «Phát biểu + phân xử»). Chỉ local.
  Thước `pipeline/scripts/nap-lai-ba-luot.mjs` (ba lượt, ma trận 7×2, đối chứng 039 / không chuyển). sync-cloud chép view
  sống, bảng con chỉ dòng có cha sống; cột mới ở lại máy.
- Danh bạ Người theo nguồn (DB2b, `_acceptance/ho-nguoi-theo-nguon`, migration 055, ADR-0016 §8): bốn bảng chỉ-thêm
  (rào trigger chặn DELETE/TRUNCATE và sửa khoá) `parties` (khoá mờ `pty_<ULID>`, một nguồn mỗi người) · `registry_aliases`
  (tài khoản tại nguồn, SĐT băm, tên) · `registry_events` · `party_roles` (vai `nguoi_dang` trỏ chủ thể `S0x:<khoá nguồn>`,
  kèm lớp căn cứ + phương pháp). `pipeline/lib/danh-ba-nguoi.mjs` dựng từ mọi tin S03/S05/S06 kể cả tin nghỉ: S06 theo
  `seller_ref`, S03/S05 theo người gửi của bài; SĐT luôn là người riêng (Hỏi-4); rút vai chỉ khi có bằng chứng thay. Chạy
  cuối `refresh-bait-gap.mjs` (`buocDem`) trong giao dịch riêng, khoá advisory 55055; tay: `pipeline/dung-nguoi.mjs [--thu]`.
  Thước `pipeline/scripts/nap-lai-nguoi.mjs` (hai lượt, lượt 2 bằng 0, đối chứng bỏ tra bí danh). Chỉ local, không sync cloud.
- Danh bạ vật thể toà · trục · căn cao tầng (DB1, `_acceptance/danh-ba-toa-truc-can`, migration 082, ADR-0016 §2–§4): ba bảng
  chỉ-thêm `buildings` (khoá `bld_<ULID>`, UPI `urn:onehub:upi:1:VN:<VN-HN|VN-SG>:<khoá toà>`, cha vùng là khu hoặc phân khu) ·
  `stacks` (`stk_`) · `units` (`unt_`, SubId `<khoá trục>:<tầng>`); bí danh `ma_nguon` S08 mang phạm vi dự án S08; tên toà và
  cách viết trên tin (tin có khu theo sổ nhóm) là bí danh tên; chủ đầu tư `Building.BuilderName` (fact/hitl, từ điển local
  `state/danh-ba-vat-the/chu-dau-tu.json`) và phường (inferred/`registry_inherit`, chỉ khi nút vùng có đúng một phường) là
  phát biểu. Dựng: `pipeline/danh-ba-vat-the.mjs --db <DB thử>` (từ chối DB `oneinvest`), một giao dịch, tra bí danh trước
  khi đúc; căn chỉ khi có mã căn; toà chỉ thấy trên tin là ứng viên. Đo trên bản chép thật 07/11: Ocean Park 1 18 toà ·
  152 trục · 318 căn (95,8% mã tách được), Grand Park 51 · 259 · 1.417 (99,9%); dựng lại 0 khoá mới. Chỉ local, không sync
  cloud; chưa áp 082 lên máy thu.
- Ngừng rao khi không thấy lại (V6, `_acceptance/tin-ngung-rao-khong-thay-lai`, migration 085, Q4 Mạnh 08/11): tin sống của S03,
  S05, S06 không thấy lại quá N = 21 ngày (`ngung_rao_sau_ngay`) trong khi nguồn vẫn thu thì nhận phát biểu `offer_status =
  withdrawn` lớp suy luận (`inferred`/`e1_rule`, `rule_id khong-thay-lai:<offer_id>`); đo tới mốc thu, không tới giờ chạy —
  S06 từ lần quét cuối (`stg_chotot_ads.captured_at`, vì `last_seen` của S06 là ngày đăng) tới lần quét mới nhất của cùng
  vùng × loại tin, S03 tới bài mới nhất của các nhóm mà tin đã đăng, S05 tới tin mới nhất của nguồn. Thấy lại → rút
  `thay-lai`, về Đang chào, lịch sử ghi «Gỡ tin» rồi «Chào lại». Không xoá, không nghỉ, giữ người bán. 085 thay
  `bang_chung_chao` của 059 để phát biểu luật không bị dội. `pipeline/trang-thai-chao.mjs` chạy luật giữa ghi bằng chứng và
  phân xử, in «ngừng rao S03 · S05 · S06»; chưa áp 085 thì in «chưa áp 085»; `--thu` ROLLBACK. Chưa áp 085 lên máy thu;
  trạng thái chào chưa lên cloud nên Invest chưa ẩn tin ngừng rao (Hỏi-1: hàng riêng đưa `offer_status` vào `CLOUD_ALLOW`).
- SĐT S06 lên tin (`_acceptance/sdt-s06-ghep-tai-khoan`, migration 068): `pipeline/gan-sdt-s06.mjs` gọi cuối `runTransformChotot`, ghi
  `seller_phone` và băm từ `stg_chotot_ads.seller`: tin có số riêng thì lấy số riêng, không có thì lấy số của tài khoản khi tài khoản có đúng
  một số; tin ẩn số không nhận số ghép, số ghép bị rút khi tin chuyển ẩn số hoặc tài khoản có thêm số. Xuất xứ ở `field_provenance.seller_phone`,
  068 giữ khoá này qua phân xử bằng cách vá định nghĩa hàm đang chạy. Chưa áp 068 thì bộ gán bỏ qua và in `CHUA-AP-068`. Tin có số mà mất khoá xuất xứ (hàm phân xử từng bị migration sau ghi đè) được dựng lại bằng cách so với stg, nên tin ẩn số không còn giữ số ghép; không khớp stg thì giữ nguyên và đếm là không rõ gốc (`_acceptance/sdt-s06-khoi-phuc-xuat-xu`). Đo: `node pipeline/gan-sdt-s06.mjs --thu` (ROLLBACK).
- Số ghép S06 và nhãn (`_acceptance/so-ghep-s06-nhan-danh-ba`, migration 070): danh bạ Người và `sellers` chỉ nhận số S06 có dấu `s06-so-tren-tin`. Cột tính
  `seller_phone_inferred` của view `sale_offers` đúng với tin S06 có số mà không mang dấu đó; cột lên cloud (`CLOUD_ALLOW`), `field_provenance` ở lại máy. Hai route
  `/api/v1/listings*` trả `phoneInferred`, `inferred`, thiếu cột hay cột NULL đều coi là chưa xác minh; thẻ tin hiện Badge «Chưa xác minh». Chưa áp 070 thì bộ gán in
  `CHUA-AP-070`, số trực tiếp vẫn ghi, số ghép mới thì không. Năm mốc triển khai ở `docs/ops/cloud-schema-catchup-2026-11-03-so-ghep.sql`: gộp → kéo về → áp cột cloud →
  áp 070 → áp 068; **070 trước 068** để số ghép không lên trang khi chưa có nhãn. Đo trên DB thử: `pipeline/do-so-ghep-s06.mjs`; theo dõi: kiểm `so-chua-xac-minh` ở 450.
- Liên lạc của Người S03 (`_acceptance/enrich-nguoi-s03`, migration 079, ADR-0016 §8 sửa đổi 06/11): bảng chỉ-thêm `party_contacts`
  ghi số mỗi người đăng dùng — số trên tin của chính họ (`so_tren_tin`) hay chỉ trong bài khác như bài trả lời (`so_trong_bai`); số thấy
  ở bài của ≥ 2 người gửi bị loại. `pipeline/lib/lien-lac-nguoi.mjs` dựng sau `dungNguoi` trong `buocDem`; `pipeline/gan-sdt-qua-nguoi.mjs`
  gán số cho tin S03 không số theo luật A (đúng một số trên tin, không có thì đúng một số trong bài), dấu `s03-qua-nguoi-dang` kèm
  `party_key`; gọi cả trong `runTransformZalo` sau `writeOffers` (giữ số đêm trước, không nhấp nháy) và sau bước dựng Người. View 079 mở
  `seller_phone_inferred` cho dấu này, app, API, sync không đổi. Số suy không vào danh bạ, HD13, SD5. Chưa áp 079 thì hai bước in
  `CHUA-AP-079`, không ghi. Đo trên DB thử: `pipeline/do-lien-lac-nguoi.mjs` (06/11: 742 tin, thuê 586, bán 156; `--mau 30` phiếu đọc mù).
- Danh bạ hiện số gốc (SD4, `_acceptance/people-hien-so-goc`, Hỏi-B 30/10, §3 mục 24): ở máy thu, `/ops/people` và trang một người
  hiện số tách nhóm và liên kết `tel:` cho vai Vận hành và `admin`; ô tìm khớp đủ số ở sáu dạng gõ (`chuanHoaSdtTim`); người có số lên
  trước cho hai vai này, vai Người xem giữ thứ tự số tin để thứ tự không lộ ai có số. `/ops/deals`: khối liên hệ hạ từ `isAdmin` xuống
  `xemNoiDungTin`, ảnh và chữ bài giữ `admin` (route `?path=`); `dealTheoVai` lọc trường trước khi vào thẻ, nên vai Người xem không có
  trường liên hệ trong cây phần tử. Bảng danh bạ vẽ đủ hàng máy chủ gửi (trước đó DataGrid dừng ở 10 hàng). Lúc đó số gốc chưa lên cloud; mục 25 của §3 mở sau.
- Căn giá tốt biết căn (CG1, `_acceptance/can-gia-tot-biet-can`, 03/11): `/ops/deals` là bảng có tab và bộ lọc, sheet một căn, trang `/ops/deals/<offerId>`; thay lưới thẻ
  và bản mẫu. `getDeals`, `getDeal` trả căn kèm cờ `mayThu`; `dealHang` tính sẵn tên căn, phần còn thiếu, lý do rời phía máy chủ, giao diện dùng chung `DealBody`. Ảnh, chữ bài
  hạ từ `admin` xuống vai Vận hành (thay lời «ảnh và chữ bài giữ `admin`» của SD4), vẫn chỉ ở máy thu; `dealTheoVai` bỏ trường trước khi vào trang, vai Người xem không nhận
  ảnh, chữ bài, tên, nhóm, số, toà, tầng, số căn, số nhà. Ngưỡng 5, 35, 50 và 45 ngày ở `lib/deals-chi-tiet.ts`, dùng chung cho SQL và chữ trên trang. Không migration, không thu thêm.
- Sửa ba lỗi của Căn giá tốt (`_acceptance/can-gia-tot-sua-ba-loi`, Mạnh ký 04/11): chữ giữ chỗ `unknown` không còn hiện như tên ở `/ops/deals` và ở trang Bán, Cho thuê công khai (`lib/ten-tin.ts`, thẻ hiện «Chưa có tên», `unknown` không tính khi đếm tài khoản nhiều tên); căn đắt hơn thước ghi đúng lý do «Đắt hơn thước phường <số>%, không phải căn giá tốt»; crumb «Căn giá tốt» chỉ mang `?can=` khi căn còn trong kết quả `getDeals()`, nên không quay lại chính trang. Không migration, không đổi bố cục.
- DATA-CONTRACT v1–2: importer nhận cả hai; ảnh Zalo N1 (`meta.mediaFiles`) →
  `stg_zalo_posts.media_files` (migration 035, PII tầng A — chỉ local, test
  `pipeline/sync-pii.test.mjs` gác FILL).
- Khử trùng ảnh (GT1 `khu-trung-anh-tin`, 05/11): `media-rows.mjs` khử theo `sha256` của tệp trong một tin, giữ lần đầu theo `post_ids`, rồi bên đọc mới áp trần 12; ảnh chưa có tệp khử theo URL; S06 không đổi. Màn gắn nhãn cùng luật ở `labels-anh.ts`. Lượt đêm đầu sau gộp xoá khoảng 8.500 dòng trùng.
- Ảnh tin canonical (NH1, migration 053): bảng `media` theo resource Media của RESO DD 2.1, một dòng mỗi ảnh khác nhau của
  một tin (`resource_record_key` = offer_id). `pipeline/transform-media.mjs` dựng lại theo nguồn ngay sau transform
  (`chotot-daily` S06, `zalo-import-daily` S03 S05), từ `stg_zalo_posts.media_files` + `media` và
  `stg_chotot_ads.images`; `/ops/review` và hồ sơ tin `/ops/data-flow` đọc bảng này (tin S06 có ảnh). Chỉ máy thu:
  không vào FILL, leak gate đếm `media` — `_acceptance/media-canonical-reso`.
- Đường của tin S06 (DS1): `docDuong` đọc `payload.street_name` thành phát biểu `street_raw` (`source_field`), bỏ địa danh
  hành chính và chuỗi mã hoá; nguồn bỏ trống thì `retractRule` rút phát biểu. Căn nhận đường ở Stage A của
  `resolve-properties` (`lib/duong-can.mjs`: ô trống, tin thấy gần nhất, ghi `enrichment_log`); `--hoan-tac-duong` trả về
  trống. Đo trên bản chép 03/11: tin 98,0%, căn 98,1%. Dự án của tin và căn ở hàng DS2 —
  `_acceptance/s06-duong-du-an-len-tin`.
- Thẻ duyệt đủ căn cứ (PL3): sheet `/ops/review` hiện bảng so mười trường Tin A/Tin B kèm lớp căn cứ + phương pháp đọc từ
  `sale_offers.field_provenance` (`lib/ops/review-can-cu.ts`), toàn văn đọc lại ở máy thu theo `post_ids` (S03, S05) và
  `stg_chotot_ads.payload.body` (S06) (`lib/ops/review-context.ts`), không độ tự tin/điểm Stage B, suy luận AI tách khỏi
  căn cứ; vai Vận hành nhận ảnh đã tải, URL gốc chỉ quản trị. Quyết định bắt buộc lý do (1–1.000 ký tự) ghi
  `review_queue.decision_note` + `ops_audit.detail.ly_do` cùng transaction; lượt bổ sung tin không gắn
  `ai_suggestion` — `_acceptance/the-duyet-du-can-cu`.
- Nhịp duyệt + chữ khớp quyết định (OD1, 08/11): mỗi lượt `review.decide` ghi `opened_at`, `decided_at`, `seconds` (giây ở
  thẻ, đồng hồ đơn điệu ở trình duyệt gửi `elapsed_ms`), `since_prev_seconds` (giữa hai lượt của cùng người) và `category`
  (hạng mục duyệt, `lib/ops/review-hang-muc.ts`) vào `ops_audit.detail`; Frame «Nhịp duyệt 7 ngày» trên `/ops/review` (trung vị,
  lượt quá 30 phút đếm riêng) là số trước của OD2. Thẻ Người có nhãn «Người», nhãn trạng thái là nhãn đáp án, tiêu đề Ghép căn
  không còn điểm Stage B, cột So so trên số hiện, ảnh hỏng gom một dòng; `?card=<id>` mở thẳng thẻ; Căn giá tốt báo «Đang chờ
  ghép» kèm liên kết (chỉ máy thu) — `_acceptance/ops-duyet-nhip-va-chu`.
- Hộp hạng mục + chế độ duyệt (OD2, 08/11): `/ops/review` có PageHeader ba số (Chờ duyệt · Quá 3 ngày · Đã quyết hôm nay giờ
  VN), hộp hạng mục bên trái danh sách (cột trái `@reui/solution-agents-9`, `?category=`) thay ô lọc theo `item_type`; «Duyệt
  liền» mở chế độ duyệt: cũ nhất trước, quyết xong thẻ kế hiện trong cùng sheet, phím J/K/1–4/R/? (bảng phím
  `@reui/c-dialog-9`), lệnh giữ 5 giây ở trình duyệt có «Hoàn tác» (xả bằng `keepalive` khi rời trang hay gỡ); lý do trống
  thì gửi nhãn đáp án (Q4), «Bỏ» ở Bổ sung tin còn bắt gõ; «Quyết định gần đây» 20 lượt 7 ngày của chính người duyệt. Route
  decide không đổi — `_acceptance/ops-duyet-hop-hang-muc`.
- S08 (danh mục căn, PL10): `stg_s08_inventory` (migration 040) — một dòng = một căn ở một snapshot
  (khoá `source_id` + `snapshot_id`, `state` notSold/sold), chỉ local (test `sync-pii` + leak gate gác);
  ánh xạ RESO ở `mappings.yaml` `sources.S08`. Chờ importer DATA-CONTRACT v4 của ZCode; chưa có transform.
- Cloud sync (15', `pipeline/sync-cloud.mjs`): nguyên tử từ cloud-sync-atomic (23/10) — nạp
  `sync_stage.rows` (migration 038, schema riêng, anon không đọc được) qua Management API rồi MỘT giao
  dịch DELETE+UPSERT+INSERT; không TRUNCATE (giữ `saved_markets`); đọc local `row_to_json` một snapshot
  (ngày/micro-giây/số jsonb nguyên vẹn); chặn tụt 50% (`sellers` được co khi audit
  `bait-gap:sellers-orphan` ≤24h khớp số dòng — PL2); bảng người bán theo `CLOUD_ALLOW`, `seller_ref`
  → `S0x:<số>`, soát tên nguồn trước khi gửi. Thước `pipeline/scripts/check-cloud-sync.mjs <ca>`,
  máy đo prod chỉ đọc `cloud-sync-watch.mjs`; triển khai: `docs/ops/cloud-sync-atomic.md`.
  Tệp chạy `scripts/cloud-sync.sh` thoát ≠ 0 khi `sync-cloud` hay `push-ops-facts` hỏng (dòng `JOB FAIL [cloud-sync]`,
  hai bước vẫn chạy cả hai); `push-ops-facts` theo `DATABASE_URL` — AU13 `cloud-sync-bao-loi-that` (24/10).
- Nhãn nguồn ở Ops (ON7 `ops-nhan-ma-nguon`, 24/10): ngoài `/ops/sources`, chữ hiển thị chỉ «S0x · vai trò»
  (`sourceLabel` trong `app/src/lib/source-labels.ts`, vai trò từ `source_registry` / `facts.sourceRuns`); nhãn, id và
  dòng log cuối của job (local lẫn payload facts) không còn tên thật — bộ che `mask-source-names` đóng chặt khi không đọc
  được tên. Thước: mục 12 `check-portal-compliance` (quét chữ hiển thị + ma trận viết trước) và HTML/payload thật.
- Một bộ soát tầng A cho mọi đường lên cloud (NT2 `soat-tang-a-moi-duong-len-cloud`, 24/10): `pipeline/lib/tier-a-guard.mjs`
  dùng chung cho `sync-cloud` và `push-ops-facts`; bản tin còn tên thật thì không gửi (`FACTS CHẶN [tầng A] <đường> <S0x>`,
  soi khô `--kho`), tên tài khoản thu gửi `null`; leak gate đỏ khi bảng người bán ở cloud có cột ngoài `CLOUD_ALLOW` hoặc
  bảng tầng A có dòng (soi prod `sync-cloud.mjs --kiem-cot`). Vận hành: `docs/ops/runtime-map.md`.
- Chữ về nguồn trên Invest (CN1 `chu-nguon-tren-cong`, 04/11): các trang công khai gọi S01 là «nền tảng thuê ngắn hạn», S02 là «nguồn tham chiếu trả phí»; giá bán, thuê là trung vị giá rao của tin thật. Thước: `scripts/quet-ten-nguon-html.mjs` (HTML thật), `scripts/check-invest-tier-a.mjs` (mã, chạy ở CI).
- Trang tin (`trang-chi-tiet-tin`, 05/11): thẻ tin bán, tin thuê dài hạn mở được `/listing/<offer_id>`; đọc qua `getPublicOffer`, `getOfferComps` dùng chung `VISIBLE`; `noindex`; tin không hiện 404 chung câu. Chưa có ảnh, bản đồ, so giá phường.
- Tin rao trên Invest (TR1 `tin-rao-tren-invest`, 02/11): `sale_offers.seller_name`, `seller_phone`, `stories`,
  `frontage_length` trong `CLOUD_ALLOW`; tên hay số chứa tên nguồn thật về `NULL` ngay trong câu đọc của sync (`maskedSourceExpr`,
  cảnh báo chỉ đếm), bộ soát tầng A vẫn là lưới cuối. Cloud chưa có bốn cột thì sync gửi cột có và cảnh báo; thêm cột bằng
  `docs/ops/cloud-schema-catchup-2026-11-02-tin-rao.sql`. Đọc công khai qua `app/src/lib/offers-public.ts` và hai route
  `/api/v1/listings*` (khoá `publicOffers`, công cụ MCP `oneinvest_get_listings`); tên lên thẻ, số chỉ trả khi bấm «Xem số»;
  S02, S08 không hiển thị. Trang `/vn/<tt>/listings/sale`, `/rent` dùng chung khung thẻ `ListingCardFrame`.
- Số tổng hợp Ops lên cloud (ON22 `ops-facts-so-tong-hop`, 24/10, ADR-0014): `push-ops-facts` đẩy thêm năm khối có
  `measured_at` — độ tươi, job launchd, lockdown từng lớp, bản ghi 24h, số thẻ chờ (`scripts/lib/ops-local.mjs`, khớp hàm
  app bằng phép đo đối chiếu); khối đo không được ghi `error`; cloud đọc qua `readOpsFacts()` (none/fresh/stale, 45′).
- Ô KPI Ops trên cloud (ON3 `o-kpi-chi-do-local`, 24/10): `/ops`, `/ops/collections`, `/ops/review` trên cloud đọc số
  máy local đẩy (`getCloudOpsView`), kèm «Số đo lúc … (GMT+7) từ máy local»; số cũ quá 45′ có Alert vàng và không badge
  xanh; chưa có bản tin thì «—» + một Alert «Chỉ đo ở máy local». Lockdown trên cloud chờ ON23.
- Khoá an toàn trên máy chủ (ON23 `lockdown-cloud-theo-facts`, 25/10): ô và lưới «Khoá an toàn & hạ tầng thu» đọc khối
  `lockdown` máy thu đẩy lên; chưa có số (hay khối lỗi) thì 8/8 lớp «Chỉ kiểm ở máy thu», không lớp nào xanh; Kev gate và
  collector API ở Máy móc lấy trạng thái từ cùng khối nên luôn khớp Khoá an toàn (OPS-3).
- Nhóm S03 trên máy chủ (ON4 `nhom-s03-tren-cloud`, 25/10): bản tin mang khối `s03` (N nhóm bật + số đếm từng nhóm, chỉ tên
  nhóm); bảng nhóm S03 dựng trên máy chủ, cũ thì «Hoạt động» viền xám, chưa có khối thì ở lại Alert gom. «Vào bảng thô» theo
  nhóm nay đúng ở bản tin (trước luôn 0); N đếm theo nhóm hiệu dụng mọi tài khoản (máy thu 7, không còn 4) — OPS-9.
- Độ phủ API trên máy chủ (AU12 `coverage-cloud-got-tang-a`, 25/10): `GET /api/v1/ops/coverage` trên máy chủ đọc khối
  `freshness` máy thu đẩy lên, trả cờ `state` tươi / cũ / không số; không số thì `rows: null` + «Chỉ đo ở máy thu» (trước
  trả `[]` như thể không nguồn nào); phản hồi chỉ trường độ tươi, không tên nguồn thật.
- Chấm bộ đọc theo chữ tin ghép (`eval-classify-theo-chu-ref`, 06/11; không migration): `pipeline/lib/eval-classify.mjs` đọc chữ theo `ghep.chu_ref` (vắng thì `ref_id`); bài ảnh không có tin chữ không vào tập chấm, đếm `khong_chu`; dòng trùng cụm đếm `trung_co_nhan`, mỗi cụm chấm tối đa một lần; `--dry` in hai số này, `dq_check_results` giữ khuôn cũ, `n` chỉ gồm dòng được chấm. Dòng chỉ ảnh mà `ghep` NULL (chưa chạy `label-ghep`) vẫn bị chấm trên URL, xem Known limits của hồ sơ.
- Ghép ảnh trên thẻ gắn nhãn (`ghep-anh-tren-the-gan-nhan`, 05/11; migration 076 đã áp DB máy thu kèm sao lưu, chỉ máy thu): `pipeline/label-ghep.mjs` gọi đúng `ganBaiAnh` (PL28), ghi `eval_label_items.ghep`; `/ops/labels` hiện tin chữ cùng cả cụm ảnh, nhãn «Ghép suy ra · N ảnh», cờ khi có nhiều tin chữ trong 2 phút, trường hợp «Ghép sai»; vẫn gắn mù. Lát `s03-theo-nhom`: 191 dòng có ghép, 144 có nhãn ghép, 11 dòng trùng cụm không vào hàng, 356 thẻ. Đọc tay 30 cụm: 16 đúng, 2 sai rõ, 2 không phán, 10 không tệp. **Trước lần chấm đầu phải sửa `eval-classify`** (còn đọc chữ theo `ref_id`). Phím mũi tên trong hộp xem lớn không có, xem Known limits của hồ sơ.
- Ảnh trên thẻ gắn nhãn (`anh-tren-the-gan-nhan`, 05/11; migration 075 **chưa áp DB thật**, chỉ máy thu, phải áp trước khi gộp): `/ops/labels` hiện ảnh bài trong thẻ, tệp đã lưu trước, không có tệp thì máy chủ lấy hộ qua `/api/zalo-media?nhan=&anh=` nên URL gốc không xuống trình duyệt; chữ hiện bỏ mọi link, chữ lưu và băm chữ không đổi; căn cứ thứ tư «Ảnh». 36/84 bài chỉ có URL đã mất ảnh ở nguồn, giữ trong mẫu với «Ảnh không tải được». Tối đa 3/367 bài mất số điện thoại khỏi thẻ (link S03, danh thiếp JSON): việc riêng.
- Đọc số m² bị sót của S03 (GC1 `doc-so-m2-bi-sot`, 05/11): `parsePost` đọc «Diện tích: 45.7» không đơn vị và số, m2 chữ kiểu Unicode; số đọc được trên chữ gốc không đổi, chỉ khâu diện tích qua NFKC. Đo trên bản sao: 15 tin có thêm số, 0 tin có số bị đổi, 0 nhóm gom đổi. S05 dùng chung bộ đọc, 0 bài đổi. Giá viết chữ kiểu Unicode: hàng `GC1G`.
- Nối dự án S08 của lát vào khu đô thị (DN1 `noi-du-an-s08-khu-do-thi`, 05/11; migration 074 **chưa áp DB thật**): bảng local `s08_project_links`, không sync cloud, ghi bằng `pipeline/noi-du-an-s08.mjs` từ tệp ở máy thu; Ocean Park 1 có 3 dự án, Grand Park 5. Bỏ bí danh `s7`, `s10` trùng mã toà và bí danh sai địa danh, mã vùng OCP1 là Gia Lâm, OCP2, OCP3 cấp tỉnh Hưng Yên. Còn 16 cặp mã vùng chết ở nút khác.
- Gắn nhãn theo nhóm S03 (GC0 `gan-nhan-theo-nhom-s03`, 04/11; migration 072 **chưa áp DB thật**, chỉ máy thu): `/ops/labels` mặc định lát `s03-theo-nhom`, biểu mẫu
  17 trường bản D, mỗi ô một căn cứ, bài dùng ngữ cảnh bắt buộc lý do; lượt hai so với máy đọc rồi ghi trường hợp; bảng trường hợp theo nhóm chỉ có số; `pipeline/label-cases.mjs`
  xuất lý do cho `GCQ1`, không mang người gắn. Lát đời trước giữ biểu mẫu chín trường của PL7. Đọc giá trị máy chỉ ở `app/src/lib/labels-luot-hai.ts`.
- Nhóm S03 đăng ký hai lần là một tầng khi lấy mẫu (`nhom-dang-ky-hai-lan-s03`, 05/11): `pipeline/label-sample.mjs` gộp lúc đọc theo khoá thật, báo «gộp đơn vị trùng»; sổ, bài,
  số trên cổng không đổi.
- Xử gốc nhóm S03 đăng ký hai lần (`nhom-hai-lan-s03-xu-goc`, 05/11): `transform-zalo` gom bài theo khoá thật, một chỗ, đo trên bản sao thật 0 tin rời, 0 tin thêm, 0 tin đổi; lệnh
  `pipeline/don-nhom-hai-lan.mjs` (Hỏi-1 lối A) chuyển dòng phụ sang «Đã gỡ», giữ dòng và mã, hoàn lại được. **Chưa chạy `--ghi` trên DB thật**: ba dòng thừa còn đó, chờ lời Mạnh, sớm nhất 06/11.
- Supabase khoá anon + RLS (migration 037, PR #20, merge ce4ad81): thu quyền anon/authenticated, bật RLS
  (không FORCE) trên bảng public — app/data-api/sync chạy bằng role chủ/BYPASSRLS nên không đổi. **Đã merge,
  CHƯA áp cloud** — Mạnh áp theo `docs/ops/supabase-lock-anon-rls.md`.

- **Đo hằng ngày (DO1, 07/11)**: `pipeline/mau-soat-cuon-chieu.mjs` rút 20 bài S03/ngày vào lát `s03-cuon-chieu`, gọi đọc gộp
  Haiku cho bài thiếu (trần 0,05 USD/ngày) rồi chụp nháp mọi cách đọc vào `eval_label_items.draft` (083); `/ops/labels` lát
  đó điền sẵn nháp. `pipeline/do-hang-ngay.mjs --write` ghi `data_level_unit`/`data_level_change` (083, chỉ máy thu) và bốn
  nhóm số `do1-*` vào `dq_check_results` (lên cloud sẵn) — giữ nháp, bỏ sót, tín hiệu, chuyển bậc, lát thị trường/phường/dự
  án/toà; `pipeline/so-sanh-cach-doc.mjs` so cặp trước/sau. Xem ở `/ops/quality` khối «Đo hằng ngày». Nguyên tắc đo: FRAMING §5.
  Áp 083 lên DB máy thu và thêm hai lệnh vào `scripts/cloud-sync.sh` sau `bac-du-lieu`: giám sát làm sau gộp (Hỏi-3).
- **Đo làm giàu (DO3, 08/11)**: `pipeline/do-lam-giau.mjs --write` (bước `cloud-sync.sh` sau `do-hang-ngay`) đếm theo từng đường
  làm giàu (số qua người đăng, quy ước nhóm; diện tích suy ra, danh mục CĐT hiện «Chưa chạy» tới khi ghi lên tin) số thêm, đổi,
  máy rút, người sửa/rút mỗi ngày (`do3-thay-doi`, ảnh chụp 086 chỉ máy thu) và kiểm ngược bỏ-một-ra mỗi tuần, không gọi model
  (`do3-kiem-nguoc`, tỉ lệ đúng + cận dưới Wilson). Người sửa = nhãn người khác giá trị + phát biểu `hitl` ghi đè khác giá trị
  (`nguoi_sua_de`); hai đường đang chạy đều không có lối người rút (Mạnh chốt 09/11). Xem ở `/ops/quality` khối «Làm giàu». Áp 086
  lên DB máy thu: lời riêng của Mạnh.
- **Thang bậc 08/11 chạy hằng ngày (thang-bac-moi-b0-b5, 09/11)**: 087 viết lại bậc theo FRAMING §3.4 — B0 Có lời khai · B1
  Tin · B2 Định vị · B3 Gắn căn · B4 Làm giàu · B5 Sống. Một tập đơn vị `data_level_units()` cho `610_data_level.sql` và DO1: mọi
  tin S03/S05/S06 chưa gắn căn (kể cả tin trong cụm — gom cụm không cho bậc) + căn danh bạ có tin gắn; hai vị từ chờ bảng nối
  (`offer_located`, `offer_unit_key`, hôm nay false/NULL) là chỗ cắm của GC. Cột `scale` (`thang-2310`/`thang-0811`) trên ảnh
  chụp và bậc từng đơn vị: DO1 ngày đổi thang lập mốc lại (`ly_do: doi-thang`), báo cáo ngày không so hai ngày khác thang,
  `/ops/quality` hiện «Thang bậc 08/11 áp từ <ngày>». Chưa áp 087 thì `bac-du-lieu` và phần chuyển bậc của DO1 bỏ qua có tên
  (`chua-ap-087`). `checkDb` thôi vớ CHECK chéo của `data_level_change`. Áp 087 lên DB máy thu và cloud: lời riêng của Mạnh.

### 2.3 Nguồn (source_registry + /ops/collections feed health)
Đo 26/10 trên máy thu (`source_registry`, `launchctl list`, `airdna_markets`). Trạng thái theo vòng đời năm giá trị
`draft · active · paused · retired · completed` (CHECK từ 047, TV2a); script thu hỏi «có được thu» qua `isRunnable` (TV2b).
Mọi đơn vị thu (nhóm S03/S05, vùng S06, market S02) nằm ở MỘT sổ `collection_units` có mã `S0x-[NVM]ddd`, thị trường,
dự án (048, PL12); tên cũ `source_groups` là view gồm mọi dòng. S03 (bản soi gateway, chỉ đọc) và S02 vào sổ bằng
`node pipeline/sync-don-vi.mjs` chạy tay ở máy thu; khai thị trường, dự án ở khu «Sổ đơn vị thu» trên `/ops/sources`.
Văn xuôi gọi nguồn bằng mã + vai trò,
không thêm tên nguồn thật (ADR-0007 sửa đổi 26/10); nhãn job, tên bảng, tên tệp giữ nguyên như trong kho. Bảng giải mã
ở `/ops/sources` của máy thu.

| Mã · vai trò | Trạng thái (`source_registry`) | Lịch thật | Ghi chú |
|---|---|---|---|
| S01 · Tự thu ngắn hạn | active | thu **tuần**: CN 19:30 (`collector`, có jitter); 20:00 hằng ngày chỉ là **smoke** (1 trang kiểm selector, `smoke`) — không phải discovery | |
| S02 · Hiệu chuẩn | active | 19:05 hằng ngày (`airdna-daily`), xoay vòng **43 market** trong `airdna_markets` (transform tự thêm market mới) — không phải «34 tỉnh» | chỉ `/ops/quality` (luật 5) |
| S03 · Cộng đồng | active | gateway nhận liên tục; nạp 00:00 (`zalo-import`); tín hiệu sống 15′; bộ canh 5′ | media CHỜ tin ảnh (dbg-media) |
| S04 · Địa giới mở | completed | một lần, chạy tay | |
| S05 · Mạng xã hội | paused | job vẫn chạy 00/06/12/18h (`apify-facebook`) — `paused` hôm nay chỉ tắt đo độ tươi, chưa script nào tuân (G1, TV2b) | Mạnh chốt 24/10: nhà cung cấp trả 402 hết credit từ ~21/10, chờ reset 7/11; 118 offers giữ |
| S06 · Rao vặt công khai | active | 05:30 (`chotot`: collect → import → transform → refresh → resolve) | ruler 150 phường; phone reveal chưa làm |
| S07 · Cổng rao | không có dòng | — | chưa có collector; tự build nếu cần |
| S08 · Danh mục dự án | paused | — | chưa có collector, `stg_s08_inventory` 0 dòng; ≤ 1 lần/tuần, chỉ nội bộ (luật 5) |

### 2.4 Chạy đêm (launchd)
Đo `launchctl list` 26/10 — 12 nhãn đang nạp.
- **Theo giờ**: 19:05 S02 (`airdna-daily`) · CN 19:30 S01 tuần (`collector`) · 20:00 smoke S01 (`smoke`) · 00:00 nạp S03
  (`zalo-import`) · 00/06/12/18h S05 (`apify-facebook`) · 05:30 S06 (`chotot`).
- **Theo nhịp**: 15′ cloud-sync + ops-facts (`cloud-sync`) · 15′ tín hiệu sống S03 (`zalo-heartbeat`) · 5′ bộ canh
  (`zalo-watchdog`).
- **Chạy liên tục** (KeepAlive): `kev-gate` :8009 · `collector-api` (đã chạy dưới launchd) · gateway OpenClaw.
- **Không chạy dưới launchd**: backup (V1); `com.oneinvest.kev.plist` có tệp nhưng không nạp (`kev-gate` thay).

### 2.5 Số liệu hôm nay
> ⚠ 23/10: 1.020/1.102 tin S03 trong `sale_offers` sinh từ snapshot giả `zalo-mock` (chỉ 82 tin thật) — số P1,
> sellers, bait gap dưới đây gồm cả tin giả. Xem `docs/architecture/classification-enrich-review.md` §0.3 (L19).
> PL2 (`_acceptance/canonical-khong-tin-gia`): transform gạt post thử, lượt 00:00 đầu sau merge rút tin giả qua
> đối soát + xoá người bán mồ côi; đo bằng `cd pipeline && node scripts/test-data-residue.mjs` (mô phỏng 23/10:
> 1.023 tin giả · 153 bait gap · 988 người bán → 0).
1.195 P1 + 8.647 P2 offers · 8.270 properties (gộp 375 repost) ·
ruler 150/338 phường · 1.043 sellers · 237 candidates P1↔P2 ·
506 listings (493 ảnh, tên host thật) · G3 live 2 thị trường.

### 2.6 Chuẩn UI/UX ReUI (A) — nhánh `feat/ui-standards-reui`
Thiết kế: `docs/superpowers/specs/2026-10-22-ui-ux-standards-design.md`.
- Skill `reui` (`.claude/skills/reui/`, vendor do installer quản lý, khối luật trong AGENTS.md) + MCP `reui`.
- Skill `onehub-ui` (`.claude/skills/onehub-ui/`): route map máy kiểm, danh mục block/component
  (`catalog.md`), màu dữ liệu, chữ VN, vòng làm việc. `app/DESIGN_RULES.md` thu lại thành con trỏ.
- Lint `onehub-ui` (`app/eslint-plugin-onehub-ui`): 10 luật; baseline `app/eslint-suppressions.json`
  = 138 vi phạm / 31 file, chỉ được giảm (B1–B5 dọn dần).
- CI job `ui-lint` (`.github/workflows/ui-lint.yml`) + hook Stop lint file UI vừa đổi.
- Rule `.claude/rules/ui.md` (tự nạp khi chạm `app/src/components|app`); ổ cắm kit
  `_acceptance/config.yaml`: `feature_loop.ui_standards_skill` và `design_pass.ds_skill` = `onehub-ui`.
- **B1 Cổng Ops** (nhánh `claude/ui-clean-b1-ops-c5a53a`): shell riêng `components/shell/ops-shell/`
  (chuyển thể `app-shell-36`, nav nhóm trong `shell/nav.tsx` có `/ops/review`); `/ops` = solution-dev-ops-5,
  `/ops/collections` = solution-dev-ops-6 + lưới job dev-ops-1, `/ops/sources` = solution-ai-ops-2 + lưới
  dev-ops-6, `/ops/quality` giữ `StatTiles`/`InsightGrid`, `/ops/design` thành trang trưng bày. Harness
  kiểm máy `scripts/ui-standards/b1-ops.mjs`; che chữ tầng A khi chụp `scripts/ui-standards/mask-tier-a.js`.

## 3. QUYẾT ĐỊNH ĐÃ CHỐT (không hỏi lại)

1. **kind ↔ RESO**: sale≈Residential*; rent_lt≈ResidentialLease+Monthly;
   STR (rent_st)=local extension. BusinessType(109 ngành nghề) ≠ bán-vs-thuê.
2. **property_type**: apartment|house|land|room(VN ext)|commercial|unknown.
3. **Monorepo**: private + subtree/overlay public (tools/sync-public).
4. **Agent = onehub-ai-agent** (thư mục agent/; 2 vai pipeline+advisor).
5. **KIẾN TRÚC AGENT** — harness "3 tầng + 1 hợp đồng": TS + Vercel AI
   SDK; runtime loop (ReAct + step budget + hooks + trace JSONL); tools
   MCP-first; agents-as-config; KHÔNG LangGraph; kev-serve gọi qua HTTP.
   Hợp đồng: questions[] typed + MCP + audit. → agent-harness-survey.md.
6. **MEMORY AGENT** — Postgres-first 3 lớp: episodic (user_events) →
   semantic bi-temporal (user_profile + source+evidence + consolidation
   đêm Qwen local) → procedural (sau); memory là TOOL của runtime; KHÔNG
   graph/vector trước nhu cầu; PII tầng A + user-owned export.
   → agent-memory-survey.md.
7. **Làm tốt từng nguồn trước**; FB/BDS khả thi nhưng là bài toán chi phí.
8. **Decision models**: Kev-4B gate chính (local); upgrade kev-9b cùng
   repo; Laya loại (OOD); OpenAI Decisions chỉ phi-PII.
9. **Hai agent, hai làn** (22/10): ZCode = thu thập (nguồn → raw → `stg_*`),
   Claude Code = phần còn lại + cổng tích hợp (review, `/verify`, `_acceptance`,
   merge). Ranh giới = DATA-CONTRACT; mỗi bên một worktree, checkout chính giữ
   `main`. Chi tiết: AGENTS.md "Phân làn hai agent" + `collector/AGENTS.md`.
10. **Cổng Ops đóng mặc định** (22/10): vào `/ops/**` khi `users.role` ∈
   {`ops`, `admin`} hoặc email trong `OPS_EMAILS`; đăng nhập thôi không đủ
   (`/register` mở). Cấp quyền data-ops bằng `role = 'ops'`, không cần migration.
11. **Người bán là công khai** (23/10): tên, SĐT, ID tài khoản người bán trên tin
   rao là tầng C (hoạt động bán hàng/môi giới), không phải lộ danh tính. Tầng A còn:
   tên nguồn thật, hồ sơ người dùng app. Sửa đổi ADR-0007 mục 9.
12. **Người chỉ đứng ở cổng, không ở từng lệnh** (23/10): bỏ luật ask rộng `git push *` /
   `vercel *` / `npx vercel *` (giữ ask `supabase db push`, `sync-public`); rào push main chuyển
   sang branch protection GitHub (PR bắt buộc, check `gate` + `ui-lint`, admin không vượt, cấm
   force-push) như crm/kit. Làn merge dùng `gh pr merge`. Hồ sơ `_acceptance/narrow-ask-rules`.
13. **Framing** (23/10, `docs/product/FRAMING.md` §2.0): mạng lưới listing tin cậy, **gom vào** (không
   đăng hộ ra kênh khác), OneHub Invest là nơi hiển thị; căn gốc = số nhà / mã căn. D1 dùng/mua danh mục dự
   án · toà · mã căn · D2 người dùng đầu tiên là chính đội (vừa đầu tư vừa môi giới) · D3 căn hộ trước, môi
   giới giữ mã căn · D4 tin P1 hiện công khai, trao đổi tức thời (độ tươi tính bằng phút) · D5 thuê người gắn
   nhãn/duyệt được, nhưng model phải gánh tối đa.
   **Dữ liệu là nỗ lực liên tục, có cấp bậc**: thang căn B0–B5 (lời khai → đọc được → gắn căn → đã đo → xác
   minh → sống), năng lực phân khúc N0–N4; north star = phân bố căn theo bậc; bậc đích: căn hộ có danh mục B5,
   nhà phố B3, Chợ Tốt B3 (FRAMING §3.4).
14. **Tên nhóm là công khai, tên nguồn vẫn bí mật** (24/10, audit Ops prod OPS-6/OPS-13): tên nhóm cộng đồng
   mà S03 thu là tầng C — hiện trên `/ops/**` ở cloud, đi qua `ops_heartbeat`, làm ngữ cảnh cho agent; tên nguồn
   thật vẫn tầng A, ngoài `/ops/sources` chỉ mã `S0x` + vai trò. Tên tài khoản thu chưa chốt. Sửa đổi ADR-0007.
15. **S08 như nguồn hiệu chuẩn** (24/10): chỉ đọc, ≤ 1 lần/tuần, chỉ nội bộ, không tái xuất lên cổng công khai
   (AGENTS.md cạnh luật 5). **Thay bởi mục 38 (08/11)** cho thông tin dự án: còn giữ ≤ 1 lần/tuần, chỉ đọc, `stg_*` không sync nguyên bảng.
16. **Ops trên cloud đọc số tổng hợp do máy local tính sẵn** (24/10, «Chọn A», ADR-0014): `push-ops-facts.mjs` đẩy
   độ tươi/SLO, job, lockdown, bản ghi 24h, số thẻ chờ (chỉ tổng hợp + mã `S0x`, qua bộ soát tầng A), mỗi khối có mốc
   đo; trang cloud chỉ đọc bảng đó, facts cũ > 45′ báo «máy local không đẩy số». Loại sync bản gọt và tunnel.
17. **Kiến trúc dữ liệu «tin → căn» theo RESO DD 2.1** (23/10, **ADR-0013**): căn = UPI + `Building`, tin = `Property`;
   toà = `BuildingName`, phân khu = `ComplexName`, trục = extension `Stack`; UPI kiểu VN `urn:onehub:upi`; phường/xã →
   `City`; mọi giá trị máy/người ghi `FieldAssertion`; trạng thái chỉ theo bằng chứng. Mọi việc chạm dữ liệu tin/căn
   kiểm 8 câu «Luật cho mọi việc sau» của ADR-0013.
18. **Ops tự vận hành nguồn kiểu SaaS** (25/10, `docs/research/ops-tu-van-hanh-nguon-saas.md`): đội vận hành làm **từ xa trên cổng Ops ở
   cloud** — cloud ghi lệnh có khuôn, máy thu kéo về, kiểm bất biến, áp, tự hoàn tác (**ADR-0015**, 26/10);
   **nội dung bài, ảnh tin rao, thẻ duyệt lên cloud không che** cho vai ops trở lên, **tên nguồn thật chỉ ở máy thu**
   (cloud `S08`, local `S08-<tên>`) — **ADR-0007 sửa đổi 26/10** (luật 6); tám quyết định §4.8 (S03 cần người thứ hai duyệt ·
   QR ở lại máy thu · ảnh thu nhỏ, trần 5 GB · S05 tự paused, admin bật lại · quy định AI chạy model local · mã đơn vị
   `S03-N012` · tên thật trong migration cũ chấp nhận như lịch sử). Đợt lộ trình `tu-van-hanh-2510`.
19. **Lát dọc Ocean Park 1** (26/10, Mạnh duyệt gói lát OCP1 «Hỏi-1..7: theo khuyến nghị», `classification-enrich-review.md`
   §7.0): Q2/Q3/Q5/Q11 theo §0.2 F (khoá tin gốc + phát biểu `căn`; bảng phát biểu + phân xử; chỉ tự áp ô đã đo; đo trong
   lát dọc) · lát đầu = OCP1 · Q4/Q9 (ngữ cảnh nhóm chỉ suy luận, Q4 sửa bởi mục 30; thẻ duyệt không hiện độ tự tin) · M1 = model local mặc
   định, cloud khi số đo cho thấy local không đủ; M3 hoãn tới PH4 · Mạnh và đội gắn nhãn khi PL7 xong · chạy F6 · L0 theo thứ
   tự ZC6 → ZC4 → hook Kev v3. Kèm: **PL3 gộp vào PL23**; **`pipeline/mappings.yaml` là nguồn danh sách trường duy nhất**;
   C2–C4 cắt cùng lúc, phần UI của PL9 gộp vào C4.

20. **Kho tri thức riêng tư đi kèm** (26/10, Mạnh duyệt «đặt tên là onehub-invest-tri-thuc để phân biệt với các kho khác
   và duyệt theo khuyến nghị»): `phanlemanh/onehub-invest-tri-thuc` chỉ phục vụ onehub-invest; khai `tri_thuc` với
   `cong_khai: true` và `kho` — tài liệu thô và trang tóm đều ở kho riêng, kho công khai chỉ giữ đường trỏ băm. Kho riêng
   vẫn nằm trên GitHub nên tầng A (luật 6) không vào; nguồn ngoài kho công khai được che tên nguồn bằng mã S0x trước khi
   ghi. Gói `tri-thuc` cài scope local (không chạm `.claude/settings.json`). Đủ 10 bản phạm vi đổi `nguon` sang trang đợt.
21. **«Listing» là mọi tin niêm yết, theo RESO** (27/10, Mạnh chốt hướng B — thay bản đầu cùng ngày «listing chỉ là thuê
   ngắn hạn»; `docs/audit/2026-10-27-tu-ngu-tin-listing.md`): listing = resource `Property` (bán · thuê dài hạn · thuê ngắn
   hạn); dịch vụ ở `kind` (`sale` · `rent_lt` · `rent_st`), loại hình ở `property_type`; nhiều listing trỏ về một căn (UPI).
   Tin rao = listing bán + thuê dài hạn; listing thuê ngắn hạn = Airbnb tự thu (lịch đêm, ADR là extension). Trục
   `listing_intent` giữ tên; giá trị `wanted` → `inquiry` «Yêu cầu» (Mạnh 27/10; yêu cầu là bên mua, đối xứng
   với listing bên bán; loại con Yêu cầu mua / Yêu cầu thuê theo `kind`; migration 050). Hai bảng `sale_offers` + `listings`
   gộp về một khái niệm listing (đổi tên bảng, nhãn UI «Listing» đang chỉ Airbnb) ở hàng tái cấu trúc riêng, khi các dãy
   khép. Chữ prompt LLM chỉ đổi khi có bench.
22. **Danh bạ vật thể và người** (27/10, Mạnh duyệt «khung đã sửa ba điểm, theo các mặc định»; **ADR-0016**, sửa ADR-0013
   §1/§3/§9): bốn họ danh bạ — Vùng (`areas`, `asset_nodes` khu đô thị/phân khu; «thị trường» là tên cấp vùng, không phải
   danh bạ) · Vật thể (thửa · toà · trục · căn, mỗi cấp một bảng chung khung khoá mờ/bí danh/gộp-tách/phát biểu) · Người
   (vai trò là quan hệ có phát biểu; vai suy luận chỉ ở `/ops`; không thu chủ sở hữu ngoài tin) · Listing. «Một Căn Nhà» =
   nút vật thể listing gắn vào, ở mức sâu nhất biết được; UPI neo toà hoặc thửa, đúc một lần. Kế thừa hai chiều theo năm
   luật (chỉ trường thuộc vật thể, không đè, không tự nuôi, mâu thuẫn ra thẻ, rút dây chuyền). Nhà phố/đất: một vật thể tạm
   mỗi tin, gộp theo bằng chứng — toạ độ S06 chỉ là tín hiệu phụ. S08: vật thể chỉ-S08 ở local, giá trị chỉ-S08 không lên
   Invest (**thay bởi mục 38**, 08/11: thông tin dự án S08 lên cloud và Invest). Hàng code thay PL11, PL24 và thêm hàng Người — giám sát cắt vào lộ trình.
23. **Quỹ hàng là sản phẩm SaaS riêng** (29/10, Mạnh chốt «Chốt app riêng» và «Chốt, viết ADR»; **ADR-0017**): ứng dụng
   quản lý hàng cho sàn môi giới, phía cung của Platform, **không phải cổng thứ ba** của Invest — `app/` không có route nào
   của nó; kho riêng tư `onehub-quy-hang`, cơ sở dữ liệu riêng. Nguyên tắc SaaS: cơ chế ở kiến trúc, mỗi kết nối là một
   thoả thuận bật/tắt, chỉ mở tới trần của lớp dữ liệu (thông tin chủ nhà không bao giờ rời công ty). Invest → Quỹ hàng là
   thoả thuận đầu tiên, một chiều, Invest đẩy theo mẫu ADR-0014: danh mục căn, số thị trường tổng hợp, tin rao đã khớp căn
   — không S08, không AirDNA, không tên nguồn hay đường dẫn bài gốc; bộ soát chạy ở cửa ra của Invest. Chiều ngược tắt,
   mở bằng thoả thuận và qua cửa kiểm của Invest. Việc ở kho này: một bước đẩy nguồn cấp ở `pipeline/`, làm sau.
24. **SĐT là lõi nhận diện Người, lưu số gốc dạng `+84…`** (30/10, Mạnh chốt Hỏi-A/B của
   `docs/research/audit-bang-nguoi-sdt-3010.md`): danh bạ và tin lưu **số gốc**, mọi chỗ một dạng E.164 `+84xxxxxxxxx`
   (RESO `MemberMobilePhone`: số quốc tế có «+» đứng đầu). Băm chỉ còn là khoá cho cloud, tính từ E.164. Khoá Người vẫn là
   `party_key`, SĐT là bí danh mạnh nhất để tìm và gộp. Số gốc hiện ở máy thu cho **vai Vận hành và `admin`**
   (`/ops/people`, `/ops/deals`); vai Người xem không thấy, không tìm theo SĐT. Đưa số gốc lên cloud là quyết định riêng,
   chưa mở (`PII_EXCLUDE` giữ nguyên). Phần cloud và vai xem đã được mục 25 thay.
25. **Tin rao công khai, người bán lên cloud và cổng Invest** (02/11, Mạnh chốt sau
   `docs/research/kiem-tin-dau-ra-toan-thi-truong-0211.md`): mọi tin rao bất động sản là công khai; tên và SĐT người bán lên cloud và
   cổng Invest vì giúp nhà đầu tư tìm căn. Mọi kênh nguồn phải có người bán và SĐT; kênh nào chưa lấy được thì kiểm lại cách lấy, báo cáo
   và cảnh báo liên tục tới khi xong. Không đổi: tên nguồn thật vẫn tầng A, S02 và S08 không hiển thị (luật 5).
26. **Bán, Cho thuê trên header thay mục Listing** (02/11, Mạnh chốt «Làm theo bản này»): header Thị trường · Bán · Cho thuê · Lợi suất · So sánh; `/vn/<tt>/listings/sale`, `/vn/<tt>/listings/rent`, thuê ngắn hạn `?term=short` bằng ô Dài hạn | Ngắn hạn trên hàng lọc, mặc định dài hạn; `/listings` chuyển 308. Listing vẫn là khái niệm cha trong mã, URL, API (mục 21), API giữ `?kind=`. Điện thoại vẫn thấy Bán, Cho thuê ngoài menu.
27. **Chỉ số tổng hợp công khai của S06/S07 cho xu hướng giá** (03/11, Mạnh chọn «B — hiện có nhãn» ở
   `docs/research/price-trend-backfill-proposal.md` §7): chuỗi giá đã hiệu chỉnh được hiện trên cổng, nhãn «hiệu chỉnh từ
   chỉ số công khai», có dải bất định, không chép nguyên văn, không tên nguồn — **với điều kiện điều khoản sử dụng của nguồn
   không cấm**. Kiểm 03/11 (§7.1 của tài liệu): điều khoản của cả S06 và S07 cấm dùng nội dung cho mục đích thương mại và cấm
   tạo sản phẩm phái sinh khi không có văn bản cho phép → **điều kiện chưa đạt, hiệu lực hiện tại là A**: chỉ số tổng hợp của
   S06/S07 chỉ dùng nội bộ (hiệu chuẩn, kiểm chiều ở `/ops`), cổng chỉ hiện số tự đo. B có hiệu lực khi có văn bản cho phép
   của nguồn hoặc ý kiến pháp lý xác nhận được dùng.
28. **Danh bạ là định danh nhà, môi giới của sàn xác nhận qua Quỹ hàng** (03/11, Mạnh duyệt cả năm câu của
   `docs/superpowers/specs/2026-11-03-danh-ba-xac-nhan-toan-quoc-design.md` §9): mọi căn có một khoá, kể cả căn off-market (suy ra: không có tin công khai còn hiệu lực), cùng ý với
   Housing Dictionary của Beike. Tra căn khi giao dịch và xác nhận nằm ở Quỹ hàng, đội mình đi cùng đường như một công ty;
   trang Ops để kiểm độ phủ và vận hành. Máy thu kéo sự kiện lớp danh mục về, thành phát biểu qua cửa kiểm; Invest không mở
   cửa vào (ADR-0017 §6 sửa). Vật thể ra khỏi máy thu khi có tin hoặc có xác nhận; thứ chỉ từ S08 ở lại, kể cả tên toà
   (ADR-0016 §9 sửa; vế «chỉ từ S08 ở lại» **thay bởi mục 38**, 08/11). Lát đầu Ocean Park 1 và Grand Park cao tầng, mở thêm bằng cấu hình. Không trả theo lượt; hai công ty độc
   lập cùng giá trị thì lên lớp sự thật. Hàng: DB1, DN1–DN4; mục chờ DN5–DN7.
29. **S01 thu theo ID có trong danh sách S02** (03/11, Mạnh chốt «Cho dùng ID S02», sửa luật 5 và ADR-0009): tìm kiếm S01 chạm
    trần 15 trang nên chỉ phủ khoảng 2,3% số căn hoạt động ở 3 thành phố. Mở thẳng trang chi tiết theo ID; số S02 không lên cổng, doanh thu
    S02 chỉ xếp thứ tự. Đo thử 100 căn trước (`claudedp-0311-13`), chạy lớn theo nấc 200 → 500 → 1.000 → 2.000 căn/đêm sau 05/11, đứng trên hàng ZC5.
30. **Gắn tin S03 vào căn làm đầu tiên sau 05/11, diện tích đi theo** (04/11, Mạnh chốt «Gộp, làm đầu tiên»): chuỗi `GC0`, `GCQ1`, `GCQ2`, `GC1`, `DN1`, `DB1`,
    `PL13`, `PL20`, `GC2`, `GC3` (mốc `GCM1`), bắt đầu từ Ocean Park. Đo 04/11: 0/3.708 tin S03 gắn căn; chỉ 45/2.175 tin thiếu m² có trục.
    Diện tích tin ghi thành phát biểu, tin khác nhận dải kèm nhãn «suy ra», không vào `area_m2`, giá/m², thước giá. S08 chỉ đối chiếu nội
    bộ, luật 5 và ADR-0016 §9 không đổi (vế này **thay bởi mục 38**, 08/11: giá trị S08 là thông tin dự án công khai; diện tích suy ra vẫn theo luật «suy ra» ở trên). Ba câu còn mở chốt ở Cổng Phạm vi của `GC3`: `docs/plan/pham-vi-gan-can-s03-0411.md`.
    Mạnh và đội kiểm tay theo từng nhóm trước, thống kê trường hợp rồi mới làm bộ đọc: đo 04/11 chưa có nhãn người nào.
    **Sửa Q4/H5** (Mạnh chốt «Cho ghi suy ra»): mỗi nhóm có quy ước chuẩn hoá; quy ước đã qua người và đạt eval theo nhóm được tự ghi giá trị kèm nhãn
    «suy ra» và căn cứ, chữ bài nói khác thì chữ bài thắng; người duyệt một lần cho mỗi phiên bản. Ngữ cảnh chưa qua eval vẫn không tự quyết. Hàng `GCQ1`, `GCQ2`.
31. **Gom, tách, gộp tin S03** (05/11, Mạnh duyệt «Theo khuyến nghị», `docs/plan/pham-vi-gom-tach-gop-tin-0511.md`): S03 thiếu đơn vị «bài đăng» giữa sự kiện thô và tin.
    Khử trùng ảnh `GT1` làm ngay. Tách bài nhiều căn là hàng có sẵn `PL18`, kéo lên đứng trước `GCQ1`. Lớp bài đăng `GT2`, kiểm định gộp trùng `GT4` đứng sau `GCQ1`.
    Lưu bảng riêng hay tính lại quyết sau khi có câu trả lời của ZCode về mã album và nhóm nhãn đầu tiên. Chưa mở thu Nhật ký của S03, hỏi ZCode trước (mục chờ `GTH1`).
32. **Mô hình dòng chảy dữ liệu làm căn cứ kiến trúc** (07/11, Mạnh «Đồng ý với khuyến nghị khi rà soát tài liệu»,
    `docs/architecture/mo-hinh-pipeline-mot-can-nha.md` bản 4): tám chặng bài → căn; Một Căn Nhà là nút họ Vật thể (thửa · toà ·
    trục · căn), khu đô thị và phân khu là họ Vùng; đo bốn tầng chép vào FRAMING §5. Kèm:
    - Hàng đo thu hẹp DO1–DO3 (#336): mẫu soát cuốn chiếu 20 bài/ngày theo cách «máy nháp, Mạnh feedback» (Mạnh chốt 06/11, thay
      gắn mù cho việc gắn hằng ngày), số có neo chỉ để thấy trôi; không thay GNH2. Chi phí lên bậc ở PL31, độ tươi ở PL22, lý do
      rơi cùng DF3.
    - Cổng tự áp PL21 và bậc B3 đo trên tập test mù đóng băng hay mẫu nháp: **hoãn, quyết lại khi mở PL21**.
    - DB1 lượt đầu dựng khung toà, trục từ S08 + phát biểu toà, trục của bộ đọc luật, không chờ PL13; mã căn từ PL13 bổ sung sau.
    - Kết quả đọc gộp đi một đường: PL30 ghi `silver_labels` → PL18 thành phát biểu → GC2/GC3 đọc phát biểu.
    - Từ vựng: «nhãn bạc» = bảng `silver_labels` (kết quả máy đọc); lớp nhãn của GNH2 gọi «nhãn nháp Opus».
33. **Đọc tin S03 bằng ba model cloud qua Gateway, chọn theo ô** (06–07/11): Mạnh chốt chỉ ba model Haiku, DeepSeek V4.1 Flash,
    GLM-5.3 Flash, gửi nội dung bài nguyên văn (ADR-0007 sửa 06/11), «Chọn AI Gateway của Vercel», «xây dựng tính năng để có thể
    dễ dàng thay đổi các model và hiện tại sử dụng haiku». Thay Hỏi-4 cũ của review phân loại §7.0 (M1 local mặc định, cổng
    Gateway hoãn tới PH4) cho việc đọc tin; ngoại lệ có tên của §1.6. Hàng PL30.
34. **Đọc gộp S03 chạy hằng ngày, trần 20 USD/ngày** (07/11, Mạnh «Đồng ý trần 20 usd/ngày. Còn lại theo khuyến nghị»;
    đóng Hỏi-1 của PL30): chạm trần thì dừng có tên. 08/11 Mạnh «1. Bật toàn bộ bài 2. Nghiệm thu sau»: phạm vi là toàn bộ bài
    S03 mới đã khử trùng theo tin (~9.000 bài, ~15 USD/ngày), không chỉ dự án GCM1; đọc lại kho cũ ước tiền và trình riêng; phiên
    nghiệm thu PL30 làm sau khi DO1 có số đo hằng ngày. Hàng PL34.
37. **Danh bạ phường/xã toàn quốc và 150 dự án S08** (08/11, Mạnh «Đồng ý»): nạp đủ 3.321 xã, phường, đặc khu theo mã của
    Cục Thống kê (dữ liệu công, sinh ở repo onehub-quy-hang), tên xã cũ là bí danh, ranh giới OSM khớp vào mã; mở danh bạ
    toà–trục–căn ra 150 dự án của danh mục S08 (từ 08/11 công khai, mục 38). Hàng PX1, PX2.
35. **Duyệt trên Ops theo hạng mục** (07/11, Mạnh duyệt báo cáo `docs/research/soat-ops-0711.md`, «Đồng ý, tôi đã đăng
    nhập lại Reui pro»):
    - Thẻ Đối chiếu (chỉ ghi nhật ký) rời Hàng duyệt thành lát chấm mẫu ~30 thẻ/tuần, đáp án bốn lựa chọn.
    - Màn gắn nhãn: nháp của máy là lớp riêng ở mọi thẻ; tắt chế độ hai người; đo bằng tỉ lệ giữ/sửa nháp. Không gắn mù
      (Mạnh 06/11; tập test mù hoãn tới PL21 theo mục 32).
    - Hoãn và Không chắc không bắt lý do; đáp án hoặc chip tính là lý do. Hoàn tác 5 giây cho mọi hạng mục, kể cả Ghép căn.
    - Thẻ luật: quyết một lần cho cả loạt thẻ cùng căn cứ luật E1, kèm năm bài mẫu, có nhật ký và đảo được — là sửa luật
      xác định (§1 luật 7), khác duyệt hàng loạt đã loại ở GD10.
    - Hàng tồn Bổ sung tin không trả lại hàng loạt: máy rút thẻ trùng giá trị đang lưu, phần còn lại duyệt tay.
    - Khuôn giao diện lấy từ ReUI (gói Pro), không tự vẽ. Hàng OD1–OD7; OD2–OD5 là nấc 1 của PL23.
36. **S01 dừng sau nấc 1, thử lại theo lịch** (07/11, Mạnh «Dừng S01» rồi «duyệt lịch s01»): lượt 1 thu 40 căn, 12.410 đêm
    nhưng 24/30 căn không giá dù ngày hỏi còn trống (nghi chặn mềm). Nghỉ tới hết 09/11; 10/11 dò 20 căn đối chứng nhịp
    12–20 giây; ≥50% có giá → 50 căn rồi 150 cách ngày; 20–50% → dò lại 13/11; <20% → chỉ thu lịch/đêm. Hàng ZC10.

38. **Thông tin dự án là công khai** (08/11, Mạnh: «Đây là dữ liệu thông tin dự án, dữ liệu công khai của chính phủ và chủ đầu tư
    dự án cho toàn bộ người dân nắm thông tin, nên tôi quyết định cứ bỏ các luật nội bộ, để thuận lợi hơn cho mình trong việc sắp
    xếp và liên kết thông tin»): thông tin dự án (tên, địa chỉ, chủ đầu tư, pháp lý, quy mô, phân khu, toà, trục, căn, bàn giao,
    tiện ích, mặt bằng) từ S07, S08, S09 và nguồn nhà nước lên cloud, Invest và API qua danh bạ. Sửa AGENTS luật 5, ADR-0016 §9,
    `.claude/rules/pii-spl.md`. Giữ: tên nguồn thật tầng A; `stg_*` thô không sync nguyên bảng; S02 theo luật 5; chỉ số giá tổng
    hợp S06/S07 theo mục 27. Giá chủ đầu tư và trạng thái quỹ căn S08 cũng công khai (Mạnh «Có, công khai», 08/11). Rủi ro đã nêu: điều khoản S07 cấm thương mại, S09
    chưa kiểm điều khoản. Code (sync-cloud, DN4) và `CONTEXT.md` đổi theo hàng sau. Căn cứ `docs/research/danh-ba-du-an-0811.md`.

39. **Đối chiếu nhất quán danh bạ dự án** (08/11, Mạnh «Đồng ý với các khuyến nghị», `docs/research/doi-chieu-nhat-quan-0811.md` §5):
    - Hỏi-1: chữ hiển thị «**Dự án**» thay «Khu đô thị» (UI, văn xuôi, tiêu chí, CONTEXT); khu đô thị, đại đô thị là quy mô của dự án.
      **Chỉ đổi nhãn**: mã `project`, `asset_nodes.node_type`, RESO `SubdivisionName`, tên bảng, cột, URL không đổi.
    - Hỏi-2: khác chủ đầu tư hoặc mở bán riêng → dự án con có dự án cha (`parent_id`); cùng chủ đầu tư → phân khu. Ba nút Grand
      Park đổi loại ở hàng DA1, không chặn DB1. ADR-0016 §7 mở kế thừa từ nút vùng (chủ đầu tư, phường).
    - Hỏi-3: căn sơ cấp S08 **chưa** thành tin trong danh sách Bán, thước giá, metrics; giá chủ đầu tư và quỹ căn hiện ở trang dự án,
      danh bạ. Câu «S02, S08 không tính là tin hiển thị được» giữ nguyên.
    - Hỏi-4: gói Invest đẩy sang Quỹ hàng được mang thông tin dự án S08; vẫn không mang tên nguồn, đường dẫn bài gốc (sửa ADR-0017
      khi hàng đẩy mở).
    - Hỏi-5: thứ tự code — mở `buildings.iso_region` toàn quốc (migration mới) trước PX2; sửa mã căn S06 và khoá gộp căn ngay sau
      GCM1; ghi thẳng cột, `mappings.yaml`, sync-cloud gộp vào DA0 và DN4.
    Sửa văn bản (CONTEXT, ADR-0011 Qđ 2, ADR-0013 §2, ADR-0016 §1/§3/§7) theo hàng DA0.
    Cùng ngày Mạnh «phê duyệt cả 4 khuyến nghị câu hỏi» của `danh-ba-du-an-0811.md` §0: thêm Q3 phần còn lại (thu thử S09 đúng Ocean Park 1
    và Grand Park, ≤ 60 lời gọi, rồi mới thu toàn bộ) và Q4 (làm với dữ liệu sẵn có trước: DA1, DS2+, DA2, chưa thu mới). Trần/nhịp
    §8.2 cho S09 toàn bộ và S07 chờ chốt riêng.
    Sau đó Mạnh chốt nguyên tắc: «Phần thu thì tôn trọng giải pháp của ZCode, chỉ hỗ trợ khi ZCode không thể thực hiện hay không hiệu
    quả». Trần, nhịp, đường thu (kể cả cách xử robots.txt của S09) do ZCode đề xuất và chọn; Claude chỉ góp ý và giữ phía sau `stg_*`.
    Kế hoạch: `docs/plan/ke-hoach-danh-ba-du-an-0811.md` §8.
    Nhãn dự án theo vòng đời (Mạnh «Theo khuyến nghị», 08/11): một nhãn «Dự án» không đổi; trạng thái là huy hiệu «Sắp mở bán», «Đang mở
    bán», «Đã bàn giao» từ RESO `DevelopmentStatus` cộng extension `SalesStatus`, `HandoverDate`. URL, tìm kiếm và bộ lọc không đổi theo trạng thái.
    Kế hoạch thi công bản 2 (Mạnh «Theo khuyến nghị», 08/11): (1) cặp nối dự án do máy đề xuất, đội ops duyệt trên thẻ, cặp cùng căn cứ duyệt
    loạt bằng «thẻ luật», Mạnh xem mẫu; (2) mở thu toàn bộ S09 khi S09 phủ ≥ 50% trong 282 dự án S06 và phân giải ≥ 70% mã toà S03 ở hai dự
    án thử; (3) dự án hiện trên Invest khi có ít nhất một nguồn danh mục hoặc đã người duyệt cặp nối, có xã/phường, và có tin đang rao
    hoặc quỹ căn chủ đầu tư. Hàng việc: `docs/plan/ke-hoach-danh-ba-du-an-0811.md` §5 (giám sát đặt mã chính thức).
    Mốc S09 hai thước (Mạnh, 08/11: «Điều quan trọng nhất của tôi là nguồn S03», chọn «cả hai»): nấc 1 thu S09 cho các dự án S03 nói
    tới khi phủ đo trên bài S03 ≥ 50% và phân giải ≥ 70%; nấc 2 thu toàn bộ khi thêm phủ 282 dự án S06 ≥ 50%. Số sơ bộ: thước S03 ≈ 99%,
    thước S06 ≈ 4,6% (S09 là danh mục Hà Nội). Hàng DA10, DAZ2.
    Đường thu toà S09 (Mạnh, 08/11: «Dùng đường API, Trang Chủ đầu tư, Tìm từ Google Search để có thêm nguồn»; «Có ở đây là dùng
    qua API»): đường công khai cộng S08 mới phân giải 51% mã toà S03 (thiếu toà Grand Park, Zurich OP1). Để tăng, dùng cả ba đường:
    đường API mà robots.txt của S09 cấm (chỉ danh sách toà của các dự án S03 nói tới, một lần, không quỹ căn, raw local, ZCode chọn
    trần và nhịp; vòng `claudedp-0811-13`), trang chủ đầu tư, và tìm kiếm web. Quỹ căn S09 qua đường cấm vẫn chưa được duyệt.

40. **Danh bạ dự án thông tin toàn diện** (09/11, Mạnh «Theo khuyến nghị»; bản phạm vi `docs/plan/pham-vi-danh-ba-du-an-toan-dien-0911.md`,
    nghiên cứu ở kho tri thức riêng `wiki/chu-de/danh-ba-du-an.md`): kế hoạch 08/11 phủ định danh và gắn tin; phần thông tin của chính dự án
    (bảy nhóm: danh tính, vị trí, phân loại và quy mô, pháp lý, tiến độ, sản phẩm sơ cấp và giá, mô tả và media) làm theo hàng mới.
    - Q1: chỗ ghi thuộc tính dự án và phân khu (resource `Subdivision`, `Complex`) tách khỏi DA11 thành **DA15**, không chờ thu S07.
    - Q2: người được tạo nút dự án, toà từ bằng chứng tin (**DA18**); toà ứng viên chưa cấp UPI tới khi người duyệt.
    - Q3: quỹ căn chủ đầu tư S08 thành **tin sơ cấp** (**DA17**, extension `MarketTier`), giữ mục 39 Hỏi-3: không vào danh sách Bán,
      thước giá, metrics.
    - Q4: khảo sát nguồn nhà nước (**DAZ4**) mở ngay, gồm mã định danh nhà ở và công trình theo NĐ 357/2025 (hiệu lực 01/3/2026). Mã nhà
      nước là bí danh, không thay UPI; toà ghi ở RESO `BuildingId`.
    - Q5: **độ đủ hồ sơ** (**DA20**) là thước «toàn diện», cạnh DA14. Mốc M2: ≥ 80% dự án S08 và 100% dự án S03 nói tới đủ năm nhóm đầu.
    - Q6: toà cho hay cấm thuê ngắn hạn (RESO `ShortTermRentalAllowedYN`) vào mục chờ DA28.
    Kiểm RESO DD 2.1 (09/11): thêm field chuẩn bị sót (`BuildingId`, `ShortTermRentalAllowedYN`, `LeaseRestrictionsYN`,
    `CertificateOfOccupancyYN`, `ParcelNumber`, `Zoning`, `CommonInterest`, `AssociationName`…); bỏ extension `BalconyDirection` (dùng
    `direction_faces` của GN1) và `BuildingFootprintArea` (dùng `FoundationArea`); không điền `SourceSystemName`, `OriginatingSystemName`
    (là tên nguồn thật, tầng A). Hàng mới: DV1, DA15–DA20; mục chờ DA21–DA28; sửa lời DA3, DA4, DA8, PX2, DA10, DA11, DN4, DA13.
    Ba câu của phiên Định vị S03 (Mạnh xác nhận «Đúng», 09/11):
    - Q7: tin nhóm một dự án chỉ nhận dự án «suy ra» và tính B2 khi quy ước nhóm đạt ≥ 95% trên mẫu GC0 của nhóm (hàng GCQ2).
    - Q8: người bán lặp lại (≥ 3 tin đã biết dự án, ≥ 80% một dự án) cho phát biểu dự án `inferred`, chỉ cho tin không có tín hiệu
      khác; đo kiểm bỏ-một mỗi ngày, tụt dưới ngưỡng thì tắt. Chưa có hàng; phiên Định vị S03 đề xuất DV2.
    - Q9: phường kế thừa từ dự án tính là phường thật, mang nhãn «suy ra từ dự án»; DA9 gộp trước hoặc cùng DF7 (DF7 đứng trên DA9).

## 4. LỘ TRÌNH THỐNG NHẤT

> Từ 23/10 việc sắp làm và mốc nằm ở `docs/plan/lo-trinh.json` (đợt `phan-loai-2310` PL1–PL31, `cam-mau-2310`
> AU1–AU12; lượt cắt chung 23/10 thêm `giao-dien-2310` UI1–UI17, `nen-tang-2310` NT1–NT7, `zcode-2310` ZC1–ZC5,
> `san-pham-sau-2310` chờ điều kiện SH1–SH14; bối cảnh `docs/plan/BOI-CANH.md`). Các bảng track dưới đây là chỉ mục
> lịch sử; đồng bộ với lộ trình ở hàng AU8.

### Mục tiêu dữ liệu ra mắt 05/11 (Mạnh chốt 31/10, mức «thách thức»)

> **LS1 (03/11):** lệnh đọc toàn bộ S03 đã viết, chưa chạy thật; mẫu 383 bài và lượt chính chờ chữ ký hồ sơ `s03-llm-doc-toan-bo`.
>
> **SL1 (03/11):** mã, migration 069 và nhãn đã ký hồ sơ `s03-len-cong`; số đo trên DB thử: 962 tin lên cổng, sai nặng 2/30 (nhãn do tác tử gắn). Trên cloud chưa đạt tới khi Mạnh duyệt sổ nhóm và giám sát xếp lượt áp 069, sổ, nạp lại.

> **Sửa 02/11 (Mạnh chốt):** mốc S06 29.762 không phải tin bán; đo ngày 02/11: bán 20.873, thuê 27.626. S06 báo tách bán, thuê;
> đích là độ phủ so với tổng nguồn báo, con số 45.000 chỉ để tham khảo. Chất lượng chỉ đo, không chặn. Tám chỉ số, kế hoạch ba
> ngày và thứ tự cắt: `docs/plan/ra-mat-0511-so-luong-chat-luong.md`.

ZCode khảo sát và đề xuất (vòng claudedp-3110-11); số là tin bán đang sống ở canonical, đo từ DB local mỗi ngày.
Theo dõi: giám sát đợt báo một dòng mỗi ngày (hiện tại so với mục tiêu); việc thu đi qua các vòng claudedp-3110-5/6/7/10.

| Kênh | Mốc 31/10 | Mục tiêu 05/11 | Điều kiện |
|---|---|---|---|
| S06 | 29.762 tin bán · 2 vùng · ~2.200 mới/ngày | ~45.000 tin bán · 5 vùng · 2 lượt/ngày | bộ thu vùng mới (tham số vùng đúng, T2); sửa deadlock resolve trước khi lên 2 lượt |
| S03 | 1.153 tin · ~130 mới/ngày · 28 nhóm | 2.500 tin · 200 mới/ngày | thêm nhóm; chỉ đọc, an toàn Zalo |
| S01 | 611 căn · thu tuần một lần | 1.000 căn · 15 mới/ngày | chạy hằng ngày; rủi ro chống bot |
| S08 | 148 dự án / 19.669 căn | 200 dự án / 30.000 căn | ≤1 lượt/tuần; thông tin dự án lên Invest/API qua danh bạ từ 08/11 (mục 38) |
| S05 | 28 tin, paused | không tính | không nạp credit |
| S02 | — | không tính | chỉ hiệu chuẩn |

### Track 1 — AGENT (onehub-ai-agent) — chốt, sẵn sàng thực hiện
| # | Việc | Trạng thái |
|---|---|---|
| A1 | runtime/ loop TS (AI SDK) + trace JSONL | ✅ 1fd762e |
| A2 | judge-entity eval 3 cặp (prefetch, không tool) — cần hand-label | 🔶 5440759 |
| A3 | MCP server tools (gom C3-wrap + data-api) | ⬜ |
| A4 | extract-text fallback (coverage 44-65% → tăng) | ⬜ |
| A5 | evals suite agents (pattern kev 620 mẫu) | ⬜ |
| A6 | advisor + compaction (chỉ khi agent dài xuất hiện) | ⬜ hoãn có chủ đích |
| M1 | migration user_events + user_profile + seed (saved/G3) | ✅ 8422289 |
| M2 | memory tool + wire app events (view_market + dau_tu_input) | ✅ 8422289 |
| M3 | consolidation đêm (Qwen local, source+evidence) | ⬜ |
| M4 | form hồ sơ + export JSON (consent, user-owned) | ⬜ |
| M5 | pgvector — chỉ khi đo thấy cần | ⬜ kháng cự |
| HITL | /ops/review Review Queue (12 entity_match seeded) | ✅ c6eea64 |
| M-3 | enrich qua đề xuất: `enrichment_proposals` (033) + luật xác định + thẻ `agent_output` /ops/review; E1 trái LLM → thẻ đối chiếu chọn một bên | ✅ PR #14 (`_acceptance/enrich-qua-de-xuat/`) |
| M-3b | hậu kỳ enrich: đề xuất sống qua nạp lại (039 + `writeOffers`, khoá ngoại RESTRICT) · hoàn tác có audit (036 + `enrich-revert`) · E1 không suy land từ tên nhóm | 🔶 chờ Cổng Bằng chứng (`_acceptance/enrich-hau-ky/`); sau merge: áp 036 → 039 lên DB local TRƯỚC lượt nạp đêm kế, rồi hoàn tác 639/644 (Hỏi-2) |
| R-PL | Review kiến trúc phân loại + enrich (`docs/architecture/classification-enrich-review.md`, khung `docs/product/FRAMING.md`): sổ 20 lỗi (L01–L20), kiến trúc đích, việc theo làn; khung RESO ở ADR-0013 | 🔶 FRAMING đã duyệt; chờ Mạnh quyết Q2–Q12 (Q1 Kev thành nhãn đã chốt) |

### Track 2 — "Một Căn Nhà" hoàn thiện
| # | Việc | Trạng thái |
|---|---|---|
| G-1 | property_type + DQ + asset_nodes R1 | ✅ 3313a9c |
| G-2 | properties + ruler dedup + candidates | ✅ 50005b7 |
| G-2.5 | pHash ảnh — khi ảnh P1 nhiều hơn | ⬜ |
| PL6 | Sổ từ vựng một nguồn (mappings.yaml → hằng + CONTEXT.md + `ref_*`; lint enum viết tay; VALIDATE CHECK 025) — `_acceptance/so-tu-vung-mot-nguon` | ✅ PR #120 (migration 043 đã áp local; Supabase đã áp 26/10 — `docs/ops/cloud-schema-catchup-2026-10-26-043.sql`) |
| PL14 | Nạp lại không xoá: bảng bản ghi + view sống (lối A, 044), khoá dính S03/S05, tin/listing nghỉ (`retired_at`) thay DELETE, 6 khoá ngoại RESTRICT, đối soát chuyển quyết định sang tin kế — `_acceptance/nap-lai-khong-xoa` | 🔶 vòng S4; sau merge: áp 044 lên DB local NGAY (launchd chạy code main); cloud không đổi lược đồ (`docs/ops/cloud-schema-catchup-2026-10-26.md`) |
| PL15 | Bảng phát biểu chỉ-thêm + bộ phân xử ba lớp dựng năm cột phân loại kèm nguồn gốc, chạy lại ra y nguyên (045) — `_acceptance/phat-bieu-va-phan-xu` | 🔶 vòng S4; sau merge: áp 045 + `phat-bieu-cat-chuyen.mjs` trên DB local TRƯỚC lượt nạp đêm kế; cloud không đổi lược đồ |
| DB2b | Danh bạ Người theo nguồn (ADR-0016 §8, 055): bốn bảng chỉ-thêm `parties` · `registry_aliases` · `registry_events` · `party_roles`; mỗi tài khoản/SĐT tại một nguồn là một người (khoá `pty_<ULID>`), vai «Người đăng» trỏ từ tin (`S0x:<khoá nguồn>`); bộ dựng chạy cuối bước bait gap trong giao dịch riêng; chỉ local — `_acceptance/ho-nguoi-theo-nguon` | 🔶 vòng S3; sau merge: áp 055 lên DB local (trước đó job đêm in «bỏ qua»); KHÔNG áp Supabase, không sync cloud |
| NH1 | Ảnh tin canonical theo RESO Media (bảng `media`, 053) cho S03/S05/S06; `/ops/review` + hồ sơ tin đọc bảng này — `_acceptance/media-canonical-reso` | 🔶 vòng S4; sau merge: `pg_dump` → áp 053 lên DB local → chạy `transform-media.mjs` một lần → xoá DB thử `oneinvest_p2_media`; không áp Supabase |
| DS1 | Đường của tin S06 đi tới tin và căn, không migration — `_acceptance/s06-duong-du-an-len-tin` | 🔶 vòng S4; sau merge: job đêm tự chạy, lượt đầu đo 74 phút trên bản chép, đồng bộ cloud đầu chở khoảng 39.000 tin đổi đường; sau job đêm chạy `node pipeline/scripts/do-duong-s06.mjs --chi-doc` |
| PL3 | Thẻ duyệt đủ căn cứ: mọi trường kèm căn cứ, toàn văn, ảnh cho vai Vận hành, không độ tự tin/gợi ý mặc định, lý do bắt buộc ghi audit cùng transaction — `_acceptance/the-duyet-du-can-cu` (T3) | 🔶 vòng S4; không migration; sau merge: khởi động lại app ở máy thu để đồng hồ nghiệm thu 7 ngày bắt đầu |
| KC3 | VLM đọc ảnh tin S03 ghi nhãn bạc nguồn ảnh — `_acceptance/vlm-anh-tin-s03` | 🔶 đã ký Cổng Bằng chứng 02/11; chờ chấm phiếu ba model ở Cổng Giá trị; việc riêng: `--gold` thiếu giá trị rơi sang chạy lô phải sửa trước lần chấm phiếu thật |
| SDT-S06 | SĐT người bán S06 lên tin, ghép theo tài khoản có đúng một số, xuất xứ tách được — `_acceptance/sdt-s06-ghep-tai-khoan` (T3, 068) | 🔶 Mạnh ký 03/11, chờ gộp; chưa áp 068, chưa ghi thật. **Chưa áp 068 tới khi xong việc riêng Ngoài-1, 4**: lượt S06 ghi thật đưa số S06 kể cả số ghép vào danh bạ, `sellers` và băm lên cloud ngay trong job (`dungNguoi` đọc cả S06), trái mô tả OOS-2. Mở hợp đồng riêng thêm Ngoài-5 (mất xuất xứ khi hàm bị ghi đè), Ngoài-6 (harness s06-vung-moi). Thứ tự Mạnh duyệt 02/11: importer v5 vào main → gộp → `pg_dump` → áp 068 → lượt S06 kế ghi thật. Chưa làm: số gốc và xuất xứ lên cloud, hiển thị và nhãn «chưa xác minh» (Hỏi-3: PR #274 chỉ hiện số ghép khi có nhãn), `dung-nguoi` |
| SDT-S06-KP | Khôi phục xuất xứ SĐT S06 sau khi hàm phân xử bị ghi đè; tin ẩn số không còn giữ số ghép; nhật ký thêm số khôi phục và không rõ gốc — `_acceptance/sdt-s06-khoi-phuc-xuat-xu` (T2, không migration) | 🔶 chờ Mạnh ký Cổng Bằng chứng |
| SO-GHEP-S06 | Danh bạ chỉ nhận số S06 có dấu trực tiếp, số còn lại mang nhãn «Chưa xác minh» tới cloud và thẻ tin — `_acceptance/so-ghep-s06-nhan-danh-ba` (T3, 070; Ngoài-1, Ngoài-4 của SDT-S06) | 🔶 đang làm, chưa ký; chưa áp 070, 068, chưa áp cột cloud. Thứ tự năm mốc: gộp → kéo về → áp cột cloud → áp 070 → áp 068 |
| ENRICH-NGUOI-S03 | Tin S03 không số lấy số qua người đăng: sổ liên lạc `party_contacts`, luật chọn số, nhãn «Chưa xác minh» — `_acceptance/enrich-nguoi-s03` (T3, 079) | 🔶 Mạnh ký Cổng Bằng chứng 06/11 (PR #329), chờ gộp. Chờ sau gộp: áp 079 trên máy thu + một lượt gán (lời riêng của Mạnh, `pg_dump` trước, sau khi đọc mù 30 Người đạt ngưỡng); liên lạc `chat_profile` theo `sender_id` giao làn ZCode qua liên lạc (rào an toàn kênh chat, lời Mạnh trước khi gọi thật) |
| SD4 | Danh bạ người hiện số gốc cho vai Vận hành: thấy, gọi, tìm theo SĐT, người có số lên trước; `/ops/deals` hạ cổng liên hệ; vai Người xem không nhận số — `_acceptance/people-hien-so-goc` | 🔶 Mạnh ký Cổng Bằng chứng 02/11, chờ gộp; số gốc không lên cloud; việc riêng Mạnh chọn mở: đổi cách chụp ảnh bằng chứng để không có số thật ngay từ đầu; tên người đăng và tên nhóm trên `/ops/deals` qua bộ che tên nguồn |
| CG1 | Căn giá tốt biết căn: bảng, sheet, trang một căn trên dữ liệu thật; ảnh, chữ bài cho vai Vận hành ở máy thu — `_acceptance/can-gia-tot-biet-can` | ✅ Mạnh ký 03/11, chờ gộp; căn chỉ còn link ảnh gốc đã hết hạn hiện «Ảnh hỏng», E10 đếm riêng; AC-9 đưa ra hạn chế đã biết (bảng ở 390 px còn thanh cuộn ngang bên trong); ba lỗi người vận hành thấy chờ hợp đồng mới |
| CG1-SUA | Sửa ba lỗi của CG1 (tên `unknown`, lý do căn đắt hơn thước, crumb) và lọc `unknown` ở trang tin công khai — `_acceptance/can-gia-tot-sua-ba-loi` | ✅ Mạnh ký 04/11, đã gộp (#303); Ngoài-9 đổi sang Known limits, không mở việc mới |
| CN1 | Chữ hiện trên các trang công khai Invest không mang tên S01, S02, nói đúng giá rao là tin thật — `_acceptance/chu-nguon-tren-cong` | 🔶 vòng S4; nút mở trang gốc `/listing/[id]` giữ link trên miền S01 (Mạnh chốt 04/11) |
| DB1 | Danh bạ toà · trục · căn cao tầng Ocean Park 1 và Grand Park từ S08 + bí danh tên toà trên tin; UPI neo toà; chủ đầu tư, phường là phát biểu cấp toà; ba dòng `asset_nodes building` là phân khu, ở lại họ Vùng — `_acceptance/danh-ba-toa-truc-can` (T3, 082) | 🔶 vòng S4; Mạnh duyệt Cổng Phạm vi và kế hoạch 07/11; sau gộp: áp 082 lên máy thu + chạy bộ dựng là lời riêng của Mạnh (`pg_dump` trước); Grand Park chưa có phường cấp toà (cần toạ độ toà, hàng riêng) |
| V6 | Tin ngừng rao khi không thấy lại quá 21 ngày (nguồn vẫn thu), thấy lại thì về đang rao; không xoá, giữ người bán — `_acceptance/tin-ngung-rao-khong-thay-lai` (T3, 085) | 🔶 Mạnh duyệt Cổng Phạm vi và kế hoạch 09/11, đang làm; sau gộp: đo `node pipeline/trang-thai-chao.mjs --thu` trên bản chép, rồi áp 085 lên máy thu là lời riêng của Mạnh (`pg_dump` trước); Invest ẩn tin ngừng rao là hàng riêng (`offer_status` lên cloud) |
| G-3 | Kev-V media gate + VLM collage + LLM judge (≡ A2) | ⬜ |
| R2-R4 | asset_nodes mở rộng (subzone/building; geo-polygon; dedup căn) | ⬜ |

### Track 3 — Nguồn thu
| # | Việc | Trạng thái |
|---|---|---|
| N1 | media Zalo: đọc dbg-media khi tin ảnh về → map → bỏ debug | ⏳ chờ dữ liệu |
| N2 | FB: Apify Starter (chốt 22/10) chưa có hiệu lực — vẫn 402 hết credit; S05 TẠM DỪNG từ 24/10 tới khi credit reset 7/11 (bật lại: `status=active` khi lượt thu chạy được) | ⏸ |
| N3 | AirDNA rotation (passive) | 🔄 sống |
| N4 | S06 phone reveal per-ad (cap 50/ngày, top-deals) | ⬜ |

### Track 4 — Sản phẩm
| # | Việc | Trạng thái |
|---|---|---|
| P-A | Deals v2 + G3 + ảnh/tên listing + ops panels | ✅ |
| P-A2 | Vá cổng: /deals → /ops/deals (SPL tầng A), gỡ AirDNA khỏi /dau-tu (luật 5) — chờ quyết gộp /dau-tu vào /yield | 🔄 nhánh fix/portal-deals-airdna |
| P-B | G4 khai thác sau mua (comps giá đêm — data sẵn) | ⬜ |
| P-A3 | Gỡ ảnh/chữ AirDNA khỏi /listing/[id] (luật 5) — chỉ ảnh tự thu, căn chưa thu PDP không ảnh | 🔄 nhánh fix/listing-airdna-photos |
| P-C | Advisor chat trên app (dựa A6+M4) | ⬜ xa |
| TR1 | Tin rao trên Invest: người bán lên cloud, API tin rao công khai, trang Bán và Cho thuê — `_acceptance/tin-rao-tren-invest` | 🔨 chờ Cổng Bằng chứng; sau ký: Mạnh bật tường lửa, gộp, chạy catch-up, sync |

### Track 5 — Vận hành
| # | Việc | Trạng thái |
|---|---|---|
| V1 | Backup tuần mã hoá (cần BACKUP_DIR+BACKUP_PASS từ user) | ⏳ nợ cũ nhất |
| V2 | sync-public sau mỗi milestone | 🔄 thủ công |
| V3 | Soak đêm tự động; soi /ops mỗi sáng | 🔄 |
| V4 | Siết quyền: cổng Ops đóng mặc định (role `ops`/`admin` hoặc `OPS_EMAILS`); `/api/zalo-media` chỉ ảnh trong `~/.openclaw/media` + `/tmp/openclaw` (realpath, không khớp tiền tố) — `_acceptance/ops-access-hardening` | ✅ Cổng 2 ký 23/10 — PR #5 (xếp chồng trên #3). Trước deploy: kiểm Vercel prod — user không phải admin cần `role='ops'` hoặc `OPS_EMAILS` |
| V5 | Tài khoản ops thử chỉ ở DB local (`scripts/dev-ops-account.mjs`) — máy tự đăng nhập dev để chụp/ui-check `/ops/**` | ✅ 2026-10-22 |
| V6 | Giảm hỏi quyền ngoài cổng: bỏ luật ask rộng, rào push main = branch protection GitHub (ngang crm/kit) — `_acceptance/narrow-ask-rules` | ✅ Cổng 2 ký 23/10 — PR #23; branch protection main bật 23/10 |
| V7 | Cloud sync nguyên tử — prod không còn cửa sổ trống, không xoá `saved_markets`, ngày đúng — `_acceptance/cloud-sync-atomic` | 🔄 PR #24 — Cổng 2 ký 23/10; migration 038 ĐÃ áp cloud 23/10; chờ merge |
| V9 | Tạm đóng `/api/v1/deals` — chỉ bearer `OPS_API_TOKEN` hoặc phiên ops; người gọi khác nhận 401 trước khi truy vấn. Lý do: audit 23/10 P7 (29/30 căn giá tốt trả công khai là tin mock S03), Q3 «đóng ngay, yêu cầu token ops». Mở lại khi PL2 đã rút tin mock khỏi canonical — quyết riêng, hàng riêng — `_acceptance/deals-api-tam-dong` | ✅ Cổng 2 ký 23/10 — PR #33; prod đo 23/10: khách 401, token ops 200 (`do-prod.md`). Project Vercel cũ `app` (`app-lilac-one-49.vercel.app`, bản 22/10) Mạnh đã xoá 24/10 — audit Q2 đóng (404 `DEPLOYMENT_NOT_FOUND`) |
| V10 | DB local tự khởi động lại sau khi Docker/máy khởi động lại — `restart: unless-stopped` trong `db/docker-compose.yml`, thước `scripts/check-db-autostart.sh` (AU7, audit L7) — `_acceptance/db-tu-khoi-dong` | 🔄 đợt 0 «Cầm máu»; xem `docs/ops/runtime-map.md` mục DB local tự khởi động |
| V12 | Sổ bề mặt API — mọi route khai ở `app/src/lib/api-surface.ts`, CI đỏ khi lệch; đóng `/api/v1/offers` (chế độ `ops` như căn giá tốt), beacon khách 204, `/api/zalo-media` chặn ảnh QR đăng nhập Zalo — `_acceptance/so-be-mat-api` | 🔄 NT4, đợt 0 |
| V8 | Khoá anon + bật RLS trên Supabase (037) — đóng lỗ PostgREST đọc được `users`/`sessions`/`sale_offers` bằng anon key — `_acceptance/supabase-lock-anon-rls` | ✅ merge PR #20 (ce4ad81); ⏳ CHƯA áp cloud — Mạnh áp theo `docs/ops/supabase-lock-anon-rls.md` |
| V13 | Luật tự vận hành từ xa: ADR-0015 đường lệnh kéo một chiều cloud → máy thu + ADR-0007 sửa đổi 26/10 (bài, ảnh, thẻ duyệt lên cloud cho vai ops; tầng A còn bốn thứ) + thuật ngữ Đơn vị thu, Lệnh, Quy định ngữ cảnh, Mục tiêu phủ — TV0 `_acceptance/adr-duong-lenh-keo` (T1) | ✅ Mạnh duyệt ADR 26/10; chờ gộp PR — cửa của TV1–TV14 |
| V14 | Tầng tri thức (kit 2.34.0): kho riêng `onehub-invest-tri-thuc` (12 raw, 2 trang nền, 10 trang đợt), `nguon` của 10 bản phạm vi là đường trỏ băm, 7 tệp kit `[only-if-declared: tri_thuc]` đã chép — `_acceptance/kho-tri-thuc-invest` (T2) | 🔄 chờ Cổng 2 |
| V15 | Vòng đời nguồn: `source_registry` + `source_groups` năm trạng thái có CHECK (paused bắt buộc lý do), `enabled` thành bản soi do trigger giữ khớp; `isRunnable` + CLI `pipeline/lib/vong-doi.mjs` cho TV2b — migration 047, TV2a `_acceptance/vong-doi-nguon` (T3) | 🔄 Cổng 2 Mạnh ký 26/10 — PR #129; 047 áp DB local SAU gộp |
| V16 | Sổ đơn vị thu: `source_groups` đổi tên `collection_units` (view tương thích gồm mọi dòng), mã đơn vị không cấp lại, thị trường + dự án nhóm chuyên (khu đô thị) kiểm bằng trigger; `pipeline/sync-don-vi.mjs` đưa S03 (chỉ đọc cấu hình gateway, nhóm biến mất → tạm dừng giữ mã) và S02 vào sổ; khu «Sổ đơn vị thu» + action `set-meta` (admin, audit cùng giao dịch) — migration 048, PL12 `_acceptance/so-nhom-mot-noi` (T3) | 🔄 Cổng 2 Mạnh ký 26/10 — PR #139; 048 áp DB local SAU gộp, rồi chạy `sync-don-vi` |
| V17 | Công tắc nhóm thu theo ma trận 5 × 2 của TV2a: không hồi sinh nhóm đã gỡ/đã xong qua tắt rồi bật (409 có chữ), tắt nhóm nháp/tạm dừng không đổi — `_acceptance/cong-tac-khong-ha-nhom-go` (T3) | 🔄 S4 chấm |
| V18 | Ca thử công tắc nhóm thu đối chứng với route trước sửa đã ghim (fixture), không đọc `origin/main` lúc chạy — vẫn xanh sau khi #142 gộp — `_acceptance/cong-tac-test-ghim-ban-cu` (T2) | 🔄 S4 chấm |
| V19 | Một bảng quyền bốn vai (viewer < ops < admin < owner) ở `app/src/lib/ops-access.ts` cho 11 route `/api/v1/ops/**`; route quản trị nhóm thu và Zalo chỉ admin, bearer chung chỉ đọc và nạp số; mỗi thao tác ghi đúng một dòng `ops_audit` mang `user:<id>`, cùng transaction; `users.role` CHECK (049, prod chờ Mạnh áp) — `_acceptance/quyen-bon-vai-mot-cho` (T3, TV1) | 🔄 S4 chấm |
| V20 | Vai viewer vào Ops nhưng không nhận nội dung tin: `xemNoiDungTin` (ops trở lên) ở `app/src/lib/ops-access.ts`; `/ops/review` cho viewer chỉ số thẻ chờ theo loại (không truy vấn cột nội dung), `/ops/data-flow` xoá bài gốc + tên nhóm trước khi gửi xuống trình duyệt; bảng kiểm kê 22 trang/route Ops; tài khoản thử `--vai viewer` — `_acceptance/viewer-khong-thay-the-duyet` (T3, Ngoài-9 của TV1). Định danh tài khoản thu ở `/ops/collections` để hàng riêng (P1-40): chưa cấp vai viewer cho người thật | 🔄 S4 chấm |
| V21 | Định danh tài khoản thu theo vai: `xemDinhDanhThu` (ops trở lên) ở `app/src/lib/ops-access.ts` + `cheDinhDanhThu` (giữ số dòng, mã về null) — `GET /api/v1/ops/collections` (thân ở `lib/collections-api.ts`) và trang `/ops/collections` che mã tài khoản, hồ sơ, mã nhóm, tài khoản giữ nhóm với Người xem và bearer chung, cả máy thu lẫn cloud; bản tin `push-ops-facts` gửi `soNhomBat` thay mã nhóm, `factsChan` chặn mã nhóm — `_acceptance/dinh-danh-tai-khoan-thu-theo-vai` (T3, Hỏi-1 của V20) | 🔄 S4 chấm |
| V22 | Cầm máu số liệu S03: transform-zalo đọc số không lẫn URL/SĐT, luật giá VN, DT «Nm», chặn giá phi lý, khoá gom có mã toà/căn, `seller_name`, phường theo thị trường của nhóm — `_acceptance/s03-cam-mau-so-lieu` (T2, N1) | 🔄 S4 chấm |
| V23 | Bộ `npm test` của app, pipeline, agent tự chạy trên DB của riêng lượt: `db/db-thu.sh oneinvest_suite_<bộ> --chay` chép từ bản mẫu `oneinvest_suite_mau` (dấu lược đồ + 24 giờ, có VACUUM ANALYZE), xoá khi lệnh dừng; thiếu container thì dừng, đĩa VM dưới 10 GB thì dừng; executor `sellers_chip` cùng đường. 86 executor đơn tệp còn lại vẫn vào DB chung (24 mở giao dịch trên bảng thật), đọc `probes/dem-deadlock.mjs` sau ba ngày — `_acceptance/test-suite-db-thu` | 🔄 05/11 |
| V11 | Leak gate kiểm anon: sync cloud dừng đỏ khi anon/authenticated SELECT được quan hệ nào trong `public` (chừa 3 quan hệ PostGIS), kèm lệnh gỡ; `--kiem-anon` soi prod chỉ đọc (AU1, audit P12) — `_acceptance/leak-gate-kiem-anon` | 🔄 đợt 0; merge SAU khi Mạnh áp 037 và `--kiem-anon` trên prod sạch |

### Track 6 — Chuẩn UI/UX ReUI
| # | Việc | Trạng thái |
|---|---|---|
| A | Chuẩn: skill reui + onehub-ui, lint 10 luật + baseline, CI ui-lint, hook Stop, ổ cắm kit | ✅ (chờ Mạnh ký) |
| B1 | Cổng Ops (`/ops/**`): shell riêng `app-shell-36` + block Solutions (dev-ops-5/-6/-1, ai-ops-2; agents-5 cho `/ops/review`), primitive, AlertDialog, sonner, PageHeader + Frame — nhánh `claude/ui-clean-b1-ops-c5a53a`, hồ sơ `_acceptance/ui-clean-b1-ops/` (T2, Cổng Phạm vi + Cổng Bằng chứng đã ký 2026-10-23, S4 PASS 16/16 sau 3 lượt). Baseline 138 → 85 (sau B3). `/ops/review` (Task 12, agents-5 theo hướng (a)) TÁCH sang vòng sau — chờ backend ảnh tin vào main | 🔨 PR mở |
| B3 | Biểu đồ: bảng màu chung, gom code trùng, tách file > 200 dòng | ⏳ |
| BĐ | Bản đồ đích cổng Invest: block đích cho mọi route Invest (cột "Block đích" ở `onehub-ui/routes.md`, test chặn dòng thiếu), shell giữ `app-shell-30`, `/dau-tu` gộp vào `/yield`, slug đích tiếng Anh (cột "Slug đích"), bản đồ nguồn `mapcn`, bước tra Mobbin trong `loop.md` — `_acceptance/invest-target-map` | ✅ Mạnh chọn 23/10 (theo khuyến nghị) — chờ ký PR |
| I1 | Finder `/[country]`: `solution-analytics-1` + `@mapcn/choropleth`, PageHeader, trạng thái "đang thu thập" | ⏳ |
| I2 | Insight thị trường + phường: khung `solution-analytics-8`, giữ chart-6/chart-13/InsightGrid, bản đồ `@mapcn/map`, neo mục lục tiếng Anh | ⏳ |
| I3 | Listing: `/listing/[id]` `product-detail-5` (ảnh tự thu) · `/listings` product-grid-2 + `filters` + `@mapcn/store-locator` | ✅ `/listing/[id]`: hồ sơ `listing-detail-product-detail-5` (UI5) — đầu trang gallery ảnh tự thu (khung 3:2, ảnh dọc hiện trọn; một hàng ảnh nhỏ 1:1 trượt ngang; ảnh chết rời gallery) + hộp Đặc điểm, lịch form-5 hết nút tay/cỡ chữ 9px (baseline −3), KPI và Listing tương tự tải trong Suspense + lỗi tại vùng + Empty; quy định khung ảnh chung ghi ở `onehub-ui/catalog.md` «Ảnh (khung)» (Mạnh 25/10). `/listings`: hồ sơ `listings-filters-store-locator` (UI6) — một cây lọc cho thanh chip `@reui/filters` (màn rộng) và ngăn `filter-sidebar-5` (màn hẹp; điều kiện ngăn không chỉnh được giữ nguyên + báo), bốn trường Phường · Loại phòng · Phòng ngủ · Giá/đêm (Hỏi-5); bản đồ `@mapcn/map` theo khuôn store-locator (cụm + nhãn giá, popup «Xem listing», lọc lưới theo khung chỉ khi người dùng di chuyển); thẻ có ảnh tự thu 3:2; vùng Suspense + lỗi tại chỗ; registry `@mapcn` khai trong `components.json` |
| I4 | Lợi suất: `/yield` form-11 + `data-grid-advanced-7` (chi phí + dòng tiền vốn vay), `/dau-tu` → chuyển hướng `/yield` | 🟡 hồ sơ `yield-dong-tien-von-vay` (UI3) — mục «Dòng tiền vốn vay» `#financing` (chuyển thể chỉ đọc ở `yield/financing/`, mô hình trả góp đều `lib/financing.ts`), nhóm Vốn vay `eq`/`rate`/`term` trên form-11, `/<country>/<market>/dau-tu` → 301 `/yield?area=<market>#financing`, `/yield` suy thị trường từ mã phường; gỡ bộ mô phỏng cũ, baseline −16 |
| I5 | So sánh + Đã lưu: giữ comparison-1 / wishlist-2, thêm PageHeader + trạng thái; `/so-sanh` → `/compare` (301) | ⏳ |
| I6 | Trang chủ / Phương pháp (`faq-3`, `/phuong-phap` → `/methodology` 301) / Auth (giữ auth-4/5) | 🟡 trang chủ + Phương pháp: hồ sơ `trang-chu-methodology` (UI2) — `/methodology` faq-3 mở sẵn, nền hero/thẻ thị trường không màu cứng, `(marketing)/error.tsx` + `global-error.tsx`, baseline −18; auth giữ nguyên |
| B5 | Ops còn lại (`/ops/deals`) + gỡ baseline (phải rỗng) | ⏳ |

Cắt lại 23/10: B2 (khung & KPI) và B4 (trạng thái) không còn là đợt riêng — phần Invest của chúng đi
vào đợt nhóm trang I1–I6, mỗi đợt làm trọn khung + KPI + biểu đồ (bảng màu B3) + trạng thái; phần Ops
nằm ở B1/B5.

Phát hiện khi chụp bản đồ đích (chưa kiểm nguyên nhân, việc dữ liệu — chưa mở phiên): bản đồ Hà Nội ở Finder
và Insight mở ra cả nước vì ranh giới "phường" của `vn-hanoi` trải khắp VN (vùng tô gần Cần Thơ; bảng xếp hạng
có "Tỉnh Phú Thọ", "Tỉnh Hưng Yên"). Nghi gán khu vực/ranh giới ở pipeline (`reassign-areas.mjs`); mapcn không sửa được.

**Tích hợp nhánh fix/portal-deals-airdna sau A** (nhánh dời `(app)/deals/page.tsx` → `ops/deals/page.tsx`, sửa `dau-tu/page.tsx`, `investment-simulator.tsx`):
1. Rebase lên `main` đã có A.
2. `.claude/skills/onehub-ui/routes.md`: dòng `/deals` thành `/ops/deals` (file `ops/deals/page.tsx`, operational, Table-backed management, Frame); nếu không `routes-map.test.mjs` đỏ.
3. `app/eslint-suppressions.json`: đổi khoá `src/app/(app)/deals/page.tsx` thành `src/app/ops/deals/page.tsx`, giữ nguyên số đếm (hoặc `npx eslint . --prune-suppressions`), rồi kiểm bằng `node eslint-plugin-onehub-ui/check-baseline-growth.mjs <suppressions-của-main> eslint-suppressions.json`.
4. `cd app && npm run lint && npm run test:lint-rules` xanh.

**Thứ tự khuyến nghị tiếp**: A2 (judge 12 cặp qua /ops/review) → A4 (extract-text) → A3 (MCP) → M3 (consolidation).

## 5. Chỉ mục quyết định

ADR: 0001 stack · 0002 insight-core · 0003 collector · 0004 đa nguồn ·
0005 AirDNA hiệu chuẩn · 0006→0007 SPL+SOC · 0008 scope VN · 0009
boundaries · 0010 bán dài hạn · 0011 RESO-first · 0012 onehub-ai-agent ·
0013 tin → căn RESO · 0014 Ops cloud đọc số tổng hợp · 0015 đường lệnh kéo một chiều ·
0016 danh bạ vật thể và người · 0017 Quỹ hàng SaaS riêng, kết nối một chiều có thoả thuận.
Research nền: investment-pipeline-4-stages (north star) ·
unified-property-pipeline · decision-models-landscape ·
agent-harness-survey · agent-memory-survey · reso-standards.
