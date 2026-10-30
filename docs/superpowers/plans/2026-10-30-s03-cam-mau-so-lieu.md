# N1 s03-cam-mau-so-lieu — kế hoạch thi công

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:executing-plans (Native — tuần tự trong phiên). Bước dùng `- [ ]`.

**Goal:** Transform S03 đọc số đúng (không URL/SĐT, luật giá VN, DT «Nm»), chặn giá phi lý, gom theo mã toà/căn, ghi
`seller_name` và phường theo thị trường của nhóm.

**Architecture:** Mọi luật trích ở `pipeline/transform-zalo.mjs` (một nguồn cho transform và bench C2). Phường theo thị
trường cần một hàm đọc thị trường có phường ở `pipeline/lib/osm.mjs` và cột `conversation_id` ở bộ nạp
`pipeline/lib/test-posts.mjs`. Đo bằng ca thuần, ca DB và một script đo trên DB thử.

**Tech Stack:** Node ESM, `node:test`, `pg`, Postgres :5433 (DB thử `oneinvest_p1_n1`).

**Spec:** `docs/superpowers/specs/2026-10-30-s03-cam-mau-so-lieu-design.md` · hợp đồng `_acceptance/s03-cam-mau-so-lieu/contract.md`.

## Global Constraints

- Không migration; không ghi `oneinvest` — ca DB và phép đo chỉ chạy trên DB thử trong BEGIN…ROLLBACK.
- `offer_id` vẫn theo post (khoá dính PL14); năm cột phân loại chỉ qua phát biểu (PL15) — không UPDATE thẳng.
- Không đổi `kind` của bài (ý định là việc PL5). Hỏi-2 = (a): bài phi lý không thành offer.
- Chuỗi trong ma trận lấy từ bài thật, cắt đoạn, không SĐT thật (kho công khai): SĐT trong ca thử dùng dãy giả `0901234567`.
- Mỗi phép đo mới có cặp đỏ trên bản sao đột biến (thư mục tạm cạnh `pipeline/`, xoá sau) với thông điệp ghim mã ca.

## Review Focus

- Giá «1.5 tỷ», «1,5 tỷ» (một chữ số lẻ) vẫn ra 1,5 tỷ — luật nhóm-nghìn chỉ áp khi đúng ba chữ số sau dấu. (Task 1, dòng ma trận)
- «Giá: 4,000» trên tin THUÊ không được thành 4 tỷ rồi bị chốt khoảng loại — luật «Giá: N,NNN» chỉ áp khi đọc ra < 100 (triệu → tỷ) và tin bán; tin thuê giữ null. (Task 1)
- Bài có «64m2» và «ngang 5m»: lấy 64 từ m2, không đụng luật «Nm». (Task 1)
- Mã «T4» (mốc nhận nhà) và mã nằm trong URL không vào khoá gom. (Task 3)
- Nhóm khai nhiều thị trường (`{vn-hanoi, vn-hcmc}`): đối chiếu cả hai, tên trùng ra null. (Task 4)

---

### Task 1: Đọc số — gạt URL/SĐT, luật giá VN, DT «Nm»  ·  phục vụ E1–E4, E10  ·  independent: false

**Files:** Modify `pipeline/transform-zalo.mjs` (`parseVnNumber`, `parsePost`); Modify `pipeline/parse.test.mjs:49-52`;
Create `pipeline/scripts/cam-mau-s03.test.mjs`.

**Interfaces — Produces:**
- `gatSo(text: string): string` — thay mọi URL (`https?://\S+`, `www\.\S+`) và mọi SĐT khớp regex của `extractPhones` bằng một dấu cách.
- `parsePost(text)` giữ khuôn trả về; giá/DT/PN đọc trên `gatSo(text)`, `phones` đọc trên `text`.

- [ ] Viết `CM-AC-1…4` trong `cam-mau-s03.test.mjs`: mỗi AC một mảng `[chữ, đáp án]` viết trước, một vòng `assert.equal` mỗi dòng
  với thông điệp `CM-AC-n «<chữ>»`; số dòng: AC-1 ≥ 4 (URL mang «6tY» cạnh «Giá thuê: 7.000.000» → 7e6; URL mang «/2650/» cạnh
  «Giá 3 tỷ» → 3e9; SĐT «0901.234.567» cạnh «65m2» → DT 65, phones `["0901234567"]`; URL mang «12PN» → bedrooms theo chữ ngoài URL),
  AC-2 12 dòng (theo hợp đồng: «2.650 tỷ»=2.65e9, «6,950 tỷ»=6.95e9, «3,349 tỷ»=3.349e9, «2400 tỷ thu về»=2.4e9,
  «1950 Tỷ thu về»=1.95e9, «2ty450»=2.45e9, «1ty650»=1.65e9, «3ty2»=3.2e9, «2 tỷ 450»=2.45e9, «2.9 tỷ»=2.9e9, «2,93 tỷ»=2.93e9,
  «3 tỷ»=3e9), AC-3 9 dòng («5tr5»=5.5e6, «8tr5»=8.5e6, «4tr8»=4.8e6, «8,5tr/tháng»=8.5e6, «12 triệu/th»=12e6,
  «45.5tr/m²»→pricePerm2 45.5e6, «Bán căn 2PN Giá: 4,000 (thu về)»=4e9, «Giá thuê: 7.000.000»=7e6, «Giá 7.500.000/tháng»=7.5e6),
  AC-4 5 + 4 + 3 dòng (diện tích «64m»,«43.2m»,«DT:43.2m»,«65m2»,«DT 70m²»; null «mặt tiền 5m»,«ngang 4m»,«hẻm 3m»,«đường 12m»;
  biên «15m»=15, «14m»,«501m» null). Thêm các dòng Review Focus («1.5 tỷ», «1,5 tỷ», «Cho thuê Giá: 4,000» → null, «64m2 ngang 5m» → 64).
- [ ] Ca đỏ mỗi AC: hàm `banSaoDotBien(thay: [string, string][])` chép `transform-zalo.mjs` sang `pipeline/.cm-mut-<pid>-<n>.mjs`,
  thay chuỗi, `import()` rồi xoá; assert dòng ghim ra SAI. Đột biến: AC-1 bỏ lời gọi `gatSo`; AC-2 trả `parseVnNumber` cũ;
  AC-3 bỏ luật «tr chen phần lẻ»; AC-4 bỏ danh sách chặn bề ngang.
- [ ] Chạy `cd pipeline && node --test scripts/cam-mau-s03.test.mjs` → đỏ (chưa có luật).
- [ ] Viết luật trong `parsePost` theo bảng §2, §3 của spec; khoảng «Nm» 15–500, cửa sổ chặn 12 ký tự trước.
- [ ] Sửa ca `parse.test.mjs` «2.900 tỷ» → 2.9e9 (tên ca nói đổi nghĩa có chủ ý, trỏ hồ sơ).
- [ ] `cd pipeline && npm test` xanh; commit `feat(pipeline): S03 đọc số không lẫn URL/SĐT, luật giá VN, DT «Nm» (N1)`.

### Task 2: Chốt khoảng giá  ·  phục vụ E5, E5b  ·  independent: false

**Files:** Modify `pipeline/transform-zalo.mjs`; Test `cam-mau-s03.test.mjs`.

**Interfaces — Produces:** `lyDoGiaPhiLy(pr: {kind, priceVnd}): "thue-tu-1-ty"|"ban-tren-100-ty"|null`;
`runTransformZalo` trả thêm `loaiGiaPhiLy: {"thue-tu-1-ty": number, "ban-tren-100-ty": number}` và in một dòng log.

- [ ] `CM-AC-5`: bảng bốn biên (rent_lt 999e6 → null; rent_lt 1e9 → thue-tu-1-ty; sale 100e9 → null; sale 100.001e9 → ban-tren-100-ty)
  + ca đỏ đột biến `>=` → `>`.
- [ ] Áp ở bước 2+3 của `runTransformZalo`: bài có lý do không vào `parsed`, cộng đếm.
- [ ] Test xanh; commit.

### Task 3: Khoá gom có mã toà/căn  ·  phục vụ E6  ·  independent: false

**Files:** Modify `pipeline/transform-zalo.mjs` (`repostKey`); Test `cam-mau-s03.test.mjs`; giữ xanh `scripts/gop-trung-s03.test.mjs`.

**Interfaces — Produces:** `maToaCan(text: string): string[]` (đọc trên `gatSo(text)`, regex spec §5, bỏ `/^T\d{1,2}$/`, sắp xếp, không trùng).
`repostKey(pr, post)` thiếu phường hoặc DT → `${noiDung}|${ma.join(",") || "?"}|${nguoi}`; đủ → `noiDung` như cũ.

- [ ] `CM-AC-6` bảng bốn ô + đột biến bỏ mã khỏi khoá; thêm dòng «T4/2027» và mã trong URL không vào `maToaCan`.
- [ ] Sửa `repostKey`; chỉnh ca cũ `GT-AC-*` nếu chuỗi khoá chờ đợi có thêm `|?` (không đổi ý nghĩa gộp).
- [ ] `npm test` xanh; commit.

### Task 4: `seller_name` + phường theo thị trường của nhóm  ·  phục vụ E5b, E7, E8  ·  independent: false

**Files:** Modify `pipeline/lib/test-posts.mjs` (SELECT thêm `conversation_id`); Modify `pipeline/lib/osm.mjs`
(`docThiTruongCoPhuong(client): Promise<string[]>` — các `parent_id` có phường hợp lệ); Modify `pipeline/transform-zalo.mjs`;
Create `pipeline/scripts/cam-mau-s03.itest.mjs`.

**Interfaces — Produces:**
- `matchPhuongThiTruong(text, entries: {slug, name, market, id}[]): {id, market}|null` — dài nhất thắng; hai thị trường cùng độ dài dài nhất → null.
- `runTransformZalo` đọc `collection_units` S03 (`group_key → market_codes`); nhóm có `market_codes` → entries của các thị trường đó; còn lại → mọi thị trường có phường. Bảng thiếu → mọi thị trường.
- Offer mang `seller_name` = `sender_name.trim()` của bài mới nhất có tên, else null; `area_id` = id phường khớp.

- [ ] `cam-mau-s03.itest.mjs` theo khuôn `gop-trung-s03.itest.mjs` (withTx, khoá 33033, snapshot giả, post mồi `t_cm_<pid>_n`), DB = `DATABASE_URL`;
  nhóm mồi chèn `collection_units (source_code 'S03', group_key, name, market_codes)` qua trigger 048. Ca: `CM-AC-5 DB`, `CM-AC-7`
  (ba bài «A» cũ, « B » mới nhất, tên rỗng mới hơn → 'B'; nhóm không tên → null), `CM-AC-8` năm ô theo evals E8, tên phường lấy từ `areas` lúc chạy
  (một tên chỉ thuộc HCM, một tên chỉ thuộc HN, một tên trùng — chọn bằng truy vấn, không ghi cứng). Ca đỏ: bản sao đột biến (lấy bài sớm nhất; chỉ nạp vn-hanoi).
- [ ] Viết mã; chạy itest trên `oneinvest_p1_n1` (dựng bằng `bash db/db-thu.sh oneinvest_p1_n1`) → xanh; `npm test` xanh; commit.

### Task 5: Phép đo dữ liệu thật  ·  phục vụ E9  ·  independent: false

**Files:** Create `pipeline/scripts/do-cam-mau-s03.mjs`.

**Interfaces — Consumes:** `runTransformZalo`, `gatSo`, `parsePost`, `normText`.

- [ ] Hai lượt, mỗi lượt một client BEGIN…ROLLBACK trên `DATABASE_URL`: lượt cây (import `../transform-zalo.mjs`), lượt đối chứng
  (`git show c333a342:pipeline/transform-zalo.mjs` chép thành `pipeline/.cm-nen-<pid>.mjs`, import, xoá trong `finally`). Sau transform đếm
  bảy thước theo định nghĩa spec §Đo trên `sale_offer_records` nguồn S03 sống + `stg_zalo_posts`; in `<thước>=<số> ĐẠT|TRƯỢT`.
  Lượt cây cần mọi thước ĐẠT; lượt đối chứng cần mỗi thước phụ thuộc transform TRƯỢT đúng mốc gốc của evals E9; `noi_nhom_pct` đối chứng bằng
  phép nối theo `group_name`. Sai một điều → exit 1 kèm tên thước.
- [ ] Chạy trên DB thử; nếu `max_noi_dung_moi_offer` vẫn > 10 → DỪNG, ghi dòng sổ `fix` và hỏi lại cách khoá (dòng sổ khoá gom đã ghi giá này).
- [ ] Commit.

### Task 6: Tài liệu as-built  ·  phục vụ —  ·  independent: false

**Files:** `docs/ROADMAP.md` (§2 as-built, §4), `pipeline/CLAUDE.md` (dòng transform-zalo).

- [ ] Một dòng as-built mỗi tệp; commit `docs: N1 cầm máu số liệu S03`.
