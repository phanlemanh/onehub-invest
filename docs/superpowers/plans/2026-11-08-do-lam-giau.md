# DO3 do-lam-giau — kế hoạch thi công

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Mỗi ngày đếm, theo từng đường làm giàu, số giá trị thêm / đổi / máy rút / người sửa / người rút. Mỗi tuần kiểm ngược bỏ-một-ra kèm cận dưới Wilson. Ghi vào `dq_check_results`, xem ở khối «Làm giàu» trên `/ops/quality`.

**Architecture:**
- Lõi thuần nằm ở `pipeline/lib/do-lam-giau.mjs`: sổ đường, so ảnh chụp, gộp ngày, đếm người, tự soát, kiểm ngược.
- Câu SQL nằm ở `pipeline/lib/do-lam-giau-db.mjs`.
- Lệnh `pipeline/do-lam-giau.mjs --write` dùng lại phân rã lát và chặn rò của DO1, chạy ở `scripts/cloud-sync.sh` sau `do-hang-ngay`.
- App đọc dòng `do3-*` mới nhất qua `app/src/lib/ops/quality-lam-giau.ts`.

**Tech Stack:** Node ESM `.mjs` + `pg` (pipeline), `node:test`, PostgreSQL migration, Next.js 16 + ReUI (app), test jsdom `node --import tsx --test`.

**Spec:**
- `docs/superpowers/specs/2026-11-08-do-lam-giau-design.md`
- `_acceptance/do-lam-giau/contract.md` (Mạnh duyệt 08/11; Hỏi-1, Hỏi-2 theo khuyến nghị)
- `_acceptance/do-lam-giau/evals.yaml` — tên ca và thông điệp đỏ phải khớp nguyên văn tệp này.

## Global Constraints

- **Số migration:** do giám sát cấp (yêu cầu P2-141). Tệp `db/migrations/<NNN>_lam_giau.sql`. Khoá advisory của lệnh là `56<NNN>`. Không tự lấy số.
- **Lược đồ:** bảng `enrichment_value_state`, `enrichment_value_change` chỉ ở máy thu. Không vào FILL của `pipeline/sync-cloud.mjs`, không DDL cloud.
- **Migration chưa gộp không áp lên DB `oneinvest` :5433** (luật đợt 27/10). Test nạp migration trong giao dịch, trên DB thử của lượt.
- **Suite:** không chạy suite app/pipeline trọn (S4, đường nền) trước khi hàng `test-chiu-db-da-nap-dvhc` của N1 gộp (lời giám sát). Trong lúc làm, chỉ chạy tệp test của mình: `node --test pipeline/scripts/do-lam-giau.test.mjs`, `node --import tsx --test app/tests/do-lam-giau.test.tsx`, `node --test scripts/job-exit.test.mjs`.
- **Bốn khoá đường** nguyên văn: `so-qua-nguoi-dang`, `quy-uoc-nhom`, `dien-tich-suy-ra`, `danh-muc-cdt`.
- **Hai check_name:** `do3-thay-doi` (một dòng mỗi đường mỗi ngày VN) và `do3-kiem-nguoc` (một dòng mỗi đường mỗi tuần ISO VN).
- **Không gọi model** ở mọi đường của DO3.
- **Detail không chứa:** SĐT, băm SĐT, tên/tài khoản người đăng, chữ bài, `labeler_id`, tên nguồn thật. Soát bằng `chanLo` + `chuoiCam` của DO1.
- **Chiều dự án/toà là «định vị»** (thang bậc 08/11), không gọi «gắn căn». Không dùng bậc B0–B5 làm mẫu số.
- **Nhãn dq mới:** nhãn cho `do3-thay-doi`, `do3-kiem-nguoc` thêm ở `app/src/lib/dq-labels.ts` trong cùng PR (luật đợt 30/10).
- **UI:** ReUI rules của `AGENTS.md`. Dùng `Frame`, `data-grid`, `Badge` (reui), `Skeleton`, `Alert`. Không tự đặt chiều cao/bo/đổ bóng, không `transition-all`. Chữ `text-sm`/`text-xs`.
- **Chữ UI mới** («Làm giàu», «Kiểm ngược», «Chưa chạy», «không có đường người rút») phải có trong `CONTEXT.md` (nhãn · code · định nghĩa) cùng commit.
- **Commit** theo Conventional Commits, kết bằng `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.

## Review Focus

1. **Tin nhận số suy rồi bị người rút cùng ngày.** Phải vào `nguoi_rut`, không vào `may_rut`. Hôm nay số qua người đăng không có lối người rút, nên ca này chỉ xảy ra ở `quy-uoc-nhom`. Test ở Task 2 (E2 phát biểu R).
2. **Bài sinh hai tin cùng số.** Giấu tin A mà để tin B cùng bài thì số của A rò về qua B. Test ở Task 3 (N3, `RO TIN CUNG BAI`).
3. **Lượt 15′ chạy qua nửa đêm VN.** Ngày đo phải là `ngayVn(now)`, không theo giờ UTC. Dòng của ngày cũ không bị ghi đè. Test ở Task 2: chạy hai lần với `ngay` khác nhau, dòng ngày trước giữ nguyên.
4. **Nhóm có đúng ngưỡng 20 bài.** Bỏ một ra thì rơi dưới ngưỡng, và phải ra `khong_ra`, không ra `sai`. Test ở Task 3 (G2).
5. **DB máy thu chưa áp migration DO3.** Lệnh in một dòng `CHUA-AP-<NNN>`, không ghi, thoát 0, để bước đêm không đỏ trước khi Mạnh áp. Test ở Task 2: DB thử không nạp migration.

---

### Task 1: Migration hai bảng + bộ nạp trong giao dịch

`independent: false` (mọi task sau dựa vào nó) · phục vụ E1, E2 (nền)

**Files:**
- Create: `db/migrations/<NNN>_lam_giau.sql`
- Create: `pipeline/lib/do-lam-giau-db.mjs` (chỉ phần nạp ở task này)
- Test: `pipeline/scripts/do-lam-giau.test.mjs` (ca `DO3-NAP`)

**Interfaces:**
- Produces: `napLamGiau(client): Promise<void>`. Hàm nạp tệp migration trong giao dịch đang mở khi chưa có bảng, theo khuôn `napPhatBieu`/nạp 083 của DO1 (giữ `pg_advisory_xact_lock(33033)`).
- Produces: `daCoLamGiau(client): Promise<boolean>`.
- Produces bảng `enrichment_value_state`:
  - cột: `duong text NOT NULL CHECK (duong IN (<bốn khoá>))`, `subject_key text NOT NULL`, `value_key text NOT NULL`, `offer_id text`, `seen_on date NOT NULL`;
  - khoá: `PRIMARY KEY (duong, subject_key)`.
- Produces bảng `enrichment_value_change`:
  - cột: `snap_date date NOT NULL`, `duong text NOT NULL`, `subject_key text NOT NULL`, `from_value text`, `to_value text`, `huong text NOT NULL CHECK (huong IN ('them','doi','may_rut'))`, `offer_id text`;
  - khoá: `PRIMARY KEY (snap_date, duong, subject_key)`.

- [ ] **Step 1:** Viết ca `DO3-NAP`: trong `BEGIN`, gọi `napLamGiau` hai lần, kiểm cả hai bảng có mặt và đúng cột. Sau `ROLLBACK`, `daCoLamGiau` = false.
- [ ] **Step 2:** Chạy `node --test --test-name-pattern=DO3-NAP pipeline/scripts/do-lam-giau.test.mjs`. Kỳ vọng: FAIL (chưa có module).
- [ ] **Step 3:** Viết migration. Header theo khuôn 083: nguồn hồ sơ, số do giám sát cấp, «KHÔNG sync cloud», idempotent `IF NOT EXISTS`. Viết `napLamGiau`, `daCoLamGiau`.
- [ ] **Step 4:** Chạy lại lệnh ở Step 2. Kỳ vọng: PASS.
- [ ] **Step 5:** Commit `feat(db): <NNN> bảng ảnh chụp và dòng đổi làm giàu (DO3)`.

### Task 2: Sổ đường, giá trị sống, thay đổi theo ngày, người sửa/rút, tự soát

`independent: false` · phục vụ E1, E2, E3 (+ Review Focus 1, 3, 5)

**Files:**
- Create: `pipeline/lib/do-lam-giau.mjs`
- Modify: `pipeline/lib/do-lam-giau-db.mjs`
- Create: `pipeline/do-lam-giau.mjs`
- Test: `pipeline/scripts/do-lam-giau.test.mjs`
- Modify: `pipeline/CLAUDE.md` (một dòng bảng Key Scripts)

**Interfaces:**
- Consumes: `napLamGiau`, `daCoLamGiau` (Task 1).
- Consumes từ DO1:
  - `KHOA_LAT_DON_VI` (`pipeline/do-hang-ngay.mjs`);
  - `phanRa`, `wilson`, `soTuan`, `tuanIso`, `ngayVn`, `tuanTruoc`, `chanLo`, `gopOCam` (`pipeline/lib/do-hang-ngay.mjs`);
  - `chuoiCam` (`pipeline/do-hang-ngay.mjs`);
  - `chuanHoa(o, v)` (`pipeline/lib/chuan-hoa-nhan.mjs`) cho `seller_phone` và `property_type`.
- Produces (`lib/do-lam-giau.mjs`, thuần):
  - `DUONG: ReadonlyArray<{ duong, rule_ids: string[], o_nhan: string|null, nguoi_rut: boolean, kiem: 'so'|'nhom'|null }>`.
    - `so-qua-nguoi-dang`: `rule_ids ['s03-qua-nguoi-dang']`, `o_nhan 'seller_phone'`, `nguoi_rut false`, `kiem 'so'`.
    - `quy-uoc-nhom`: `['loai-hinh-nhom']`, `'property_type'`, `true`, `'nhom'`.
    - `dien-tich-suy-ra`, `danh-muc-cdt`: `rule_ids []`, `o_nhan null`, `nguoi_rut false`, `kiem null`.
  - `soAnh(truoc: Map<string,{value_key,offer_id}>, nay: Map<…>, nguoiRut: Set<string>) → { subject_key, from_value, to_value, huong, offer_id }[]`. Chủ thể trong `nguoiRut` không sinh `may_rut`.
  - `gopNgay(cu: {from_value,to_value,huong}|undefined, moi: {from_value,to_value}) → {from_value,to_value,huong} | null`. Giữ `from` của `cu`, lấy `to` của `moi`, rồi tính lại `huong`. `from === to` → `null` (xoá dòng).
  - `demThayDoi(dongNgay) → { them, doi, may_rut }`.
  - `nguoiSua(nhan: { value: string|null, not_stated: boolean, gia_tri: string }[], o: string) → { nguoi_sua, nhan_da_so }`. So sau `chuanHoa(o, …)`.
  - `tuSoat({ song_hom_qua: number|null, song, them, may_rut, nguoi_rut, lat: Record<string,{o,tong}> }) → string|null`. Trả tên phép lệch, `'song-lech'` hoặc `'lat-lech:<chiều>'`. `song_hom_qua` null (hôm qua chưa có dòng) thì bỏ phép `song-lech`.
- Produces (`lib/do-lam-giau-db.mjs`):
  - `docGiaTriSong(c, d) → Map<subject_key,{value_key, offer_id}>`.
    - Số qua người đăng: đọc `sale_offer_records` (S03, `retired_at IS NULL`) có `field_provenance->'seller_phone'->>'rule_id'` thuộc `d.rule_ids`, khoá `tin:<offer_id>`, `value_key = seller_phone_hash`.
    - Quy ước nhóm: đọc `field_assertions` sống có `rule_id = ANY(d.rule_ids)` AND `resource_name = 'Property'`, khoá `<subject_key>|<field>`. Tin tìm qua `offer_subject_keys` (045).
    - `rule_ids` rỗng thì trả Map rỗng.
  - `docNguoiRut(c, d, ngay) → Set<subject_key>`: phát biểu của `d.rule_ids` có `retracted_at` trong ngày VN và `retract_reason = 'hitl-thay' OR LIKE 'hoan-tac:%'`.
  - `docNhanNgay(c, d, ngay) → nhan[]`: `eval_labels` gắn trong ngày, `field = d.o_nhan`, item → `ref_id` (post_id) → tin S03 có `post_id = ANY(post_ids)` đang mang giá trị đường, kèm `gia_tri` của đường. Với số: số thật lấy trong bộ nhớ để so, KHÔNG đưa vào detail.
  - `docViTriTin(c, offerIds) → Map<offer_id,{ market_id, ward_id, project_key, building_key: null, core: { toa_chu } }>`: đúng khuôn đơn vị mà `KHOA_LAT_DON_VI` đọc.
- Produces (`pipeline/do-lam-giau.mjs`):
  - `doLamGiau(client, { ngay = ngayVn(Date.now()), write = false, dotBien, kiemNguoc = true }) → Promise<{ dq: {check_name, entity, status, detail}[], chua_ap?: string }>`.
  - CLI: `--write`, `--ngay YYYY-MM-DD`. Giao dịch có `pg_advisory_xact_lock(56<NNN>)`. Chưa áp migration thì in `CHUA-AP-<NNN>` và thoát 0, không ghi.

- [ ] **Step 1: Viết ca `DO3-AC-1`** theo E1. Giá trị ghi bằng bên ghi thật:
  - `ganSdtQuaNguoi` (`pipeline/lib/gan-sdt-qua-nguoi.mjs`) trên `party_contacts` thử, sau `napSdtE164` + nạp 068/079 như ca của enrich-nguoi-s03;
  - `writeAssertions` (`pipeline/lib/assert.mjs`) với `rule_id 'loai-hinh-nhom'`, `method 'e1_rule'`, `method_version LOAI_HINH_VERSION` export từ `transform-zalo.mjs`;
  - 2 phát biểu `Building area_id registry_inherit`.

  Assert:
  - đúng 4 dòng `do3-thay-doi`;
  - `song` 3 và 4, `status 'pass'`;
  - hai đường còn lại `skip`, `ly_do 'chua-chay'`, không có khoá số;
  - chạy lại vẫn 4 dòng.

  Đột biến qua `dotBien`, mỗi cái ra đúng thông điệp ghim:

  | `dotBien` | Thông điệp |
  |---|---|
  | `chua-chay-so-0` | `CHUA CHAY GHI SO 0` |
  | `toa-thanh-tin` | `TOA THANH TIN` |
  | `dong-lap` | `DONG NGAY LAP` |
  | `song-lech` | dòng `fail`, có `soat_lech: 'song-lech'` |
  | `fail-khong-ly-do` | `FAIL KHONG CO LY DO` |

  Thêm ca `DO3-AC-1-THAT`: chỉ đọc DB máy thu qua `DATABASE_URL_MAY_THU`. Bỏ qua kèm lý do khi `CI` hoặc vắng biến. `docGiaTriSong` của hai đường đang chạy phải > 0; in hai số đếm.

  Thêm ca `DO3-CHUA-AP`: DB thử không nạp migration → `chua_ap: '<NNN>'`, 0 dòng dq.
- [ ] **Step 2: Viết ca `DO3-AC-2`** theo E2, bốn lượt cùng ngày. Kỳ vọng như bảng của E2, kể cả phát biểu R rút bằng `apply_enrichment` (045, lý do `hitl-thay`) vào `nguoi_rut = 1`, không vào `may_rut`. Đột biến:

  | `dotBien` | Thông điệp |
  |---|---|
  | `doi-gia` | `DOI GIA` |
  | `hai-dong` | `HAI DONG MOT CHU THE` |
  | `khong-xoa-ve-cu` | `KHONG XOA KHI VE CU` |
  | `lap-moc-co-dong` | `LAP MOC CO DONG` |
  | `nguoi-rut-hai-lan` | `NGUOI RUT DEM HAI LAN` |

  Thêm ca Review Focus 3: lượt ngày D rồi lượt ngày D+1. Dòng `do3-thay-doi` của D giữ nguyên `detail`.
- [ ] **Step 3: Viết ca `DO3-AC-3`** theo E3. Rút sinh bằng `apply_enrichment` (`hitl-thay`) và `revert_enrichment(ids, actor, 'sai-nhom')` (`hoan-tac:sai-nhom`), không UPDATE tay. Nhãn số viết `'0912 345 678'` so với số suy `+84912345678`. Đột biến:

  | `dotBien` | Thông điệp |
  |---|---|
  | `may-rut-thanh-nguoi` | `MAY RUT THANH NGUOI` |
  | `sdt-chua-chuan` | `SDT CHUA CHUAN HOA` |
  | `khong-loi-ghi-0` | `KHONG LOI NGUOI GHI 0` |
  | `nhan-ngoai-ngay` | `NHAN NGOAI NGAY` |
- [ ] **Step 4:** Chạy `node --test --test-name-pattern='DO3-AC-[123]|DO3-CHUA-AP' pipeline/scripts/do-lam-giau.test.mjs`. Kỳ vọng: FAIL.
- [ ] **Step 5:** Viết các hàm ở Interfaces.

  Thứ tự trong `doLamGiau`, cho mỗi đường:
  1. Đọc giá trị sống.
  2. Không có giá trị nào → dòng `skip` `chua-chay`.
  3. Đọc ảnh chụp: chưa có dòng nào của đường → lập mốc, ghi `state`, dòng `skip` `lap-moc`.
  4. Đọc `docNguoiRut`, rồi `soAnh`.
  5. Gộp vào `enrichment_value_change` bằng `gopNgay` (UPSERT, hoặc DELETE khi `null`).
  6. Thay `enrichment_value_state` bằng giá trị sống hiện tại.
  7. Đếm qua `demThayDoi` trên mọi dòng ngày D của đường.
  8. Đếm `nguoi_rut`, `nguoi_sua`. Đường `nguoi_rut: false` thì ghi `duong_nguoi_rut: false` và không có khoá `nguoi_rut`.
  9. Phân rã lát: `phanRa` × `KHOA_LAT_DON_VI` trên tin của giá trị sống.
  10. Tự soát với `song` của dòng hôm qua.

  Sau vòng: `gopOCam` + `chanLo` trên mọi detail, rồi `DELETE` theo `detail->>'ngay'` và `INSERT` (khuôn ghi của DO1).
- [ ] **Step 6:** Chạy lại lệnh ở Step 4. Kỳ vọng: PASS, mọi đột biến đỏ đúng thông điệp.
- [ ] **Step 7:** Thêm dòng `do-lam-giau.mjs` vào bảng Key Scripts của `pipeline/CLAUDE.md`. Commit `feat(pipeline): DO3 thay đổi làm giàu theo ngày — sổ đường, ảnh chụp, người sửa/rút`.

### Task 3: Kiểm ngược bỏ-một-ra theo tuần

`independent: false` (dựa Task 2) · phục vụ E4, E5 (+ Review Focus 2, 4)

**Files:**
- Modify: `pipeline/lib/do-lam-giau.mjs`, `pipeline/lib/do-lam-giau-db.mjs`, `pipeline/do-lam-giau.mjs`
- Test: `pipeline/scripts/do-lam-giau.test.mjs`

**Interfaces:**
- Consumes: `rutLienLac`, `chonSoNguoi` (`pipeline/lib/lien-lac-nguoi.mjs`); `loaiHinhNhom`, `docLoaiHinh` (export của `pipeline/transform-zalo.mjs`); bộ lọc bài thử `pipeline/lib/test-posts.mjs` (cùng bộ transform dùng); `wilson`, `soTuan`, `tuanIso`, `tuanTruoc`.
- Produces (thuần):
  - `kiemNguocSo(bai: {post_id, sender_id, text}[], tins: {offer_id, seller_ref, seller_phone, field_provenance, post_ids: string[]}[], nguoiCuaTaiKhoan: Map) → { tap_do: 'tin-co-so-rieng', n, dung, sai, khong_ra, ket: Map<offer_id,'dung'|'sai'|'khong_ra'> }`.
    - Tập: tin có `seller_phone`, không mang dấu số suy, có Người.
    - Với mỗi tin T: bỏ T, mọi bài trong `T.post_ids`, mọi tin khác chung một bài với T.
    - Gọi `rutLienLac` trên phần còn lại của Người, rồi `chonSoNguoi(lienLac lọc theo party_key)`.
    - Tối ưu được phép: chỉ dựng lại cho Người của T, trên bài và tin của Người ấy.
  - `kiemNguocNhom(bai: {post_id, conversation_id, text}[]) → { tap_do: 'bai-co-chu-loai', n, dung, sai, khong_ra, ket }`.
    - Tập: bài có `docLoaiHinh(text)` khác null, đã gạt bài thử.
    - Với mỗi bài B: tính `loaiHinhNhom` trên các bài cùng `conversation_id` trừ B.
  - `tongKiem(k, truoc|null) → { ty_le_dung, wilson, phu, chenh, co_y_nghia, nguong_phat_hien }`.
    - `ty_le_dung = dung/(dung+sai)`, `phu = (dung+sai)/n`.
    - So tuần trước qua `soTuan({k: dung, n: dung+sai}, …)`.
- Produces (DB): `docBaiNguoi(c)`, `docBaiNhom(c)` đọc `stg_zalo_posts` S03 (`post_id`, `sender_id`, `conversation_id`, `text`) và tin S03. Chỉ dùng trong bộ nhớ.
- Luật nhịp trong `doLamGiau`:
  - Với mỗi đường `kiem != null`: nếu `dq_check_results` CHƯA có dòng `do3-kiem-nguoc` `entity = duong` với `detail->>'tuan' = tuanIso(ngay)`, thì tính và ghi trong CÙNG giao dịch với phần thay đổi.
  - Đường đang chạy có `kiem null` → `skip` «chua-co-kiem-nguoc», một lần mỗi tuần.
  - Có tham số `loiTiem` (chỉ cho test) ném lỗi sau khi tính, trước COMMIT.

- [ ] **Step 1: Viết ca `DO3-AC-4`** theo E4. Ma trận N1–N4, số đặt trong chữ bài; N2 là 3 X + 1 Y; N3 là một bài sinh hai tin. Kiểm:
  - Wilson khớp `wilsonThamChieu` tới 4 chữ số;
  - tuần trước có dòng đặt sẵn;
  - đếm lời gọi model giả = 0.

  Nhịp ba lượt: lượt 1 `loiTiem` → 0 dòng; lượt 2 → 1 dòng; lượt 3 → không thêm. Đột biến:

  | `dotBien` | Thông điệp |
  |---|---|
  | `khong-bo-ra` | `KHONG BO MOT RA` |
  | `giu-bai` | `RO BAI CUA TIN` |
  | `giu-tin-cung-bai` | `RO TIN CUNG BAI` |
  | `khong-ra-mau-so` | `KHONG RA VAO MAU SO` |
  | `lap-tuan` | `KIEM NGUOC LAP TUAN` |
  | `chi-luot-dau` | `MAT TUAN KHI LUOT DAU LOI` |
  | `so-suy-vao-tap` | `SO SUY VAO TAP KIEM` |
- [ ] **Step 2: Viết ca `DO3-AC-5`** theo E5. G1 là 24 căn hộ + 1 nhà phố, G2 đúng 20 căn hộ, 2 bài thử. Kỳ vọng n 45, dung 24, sai 1, khong_ra 20. Thêm đường giả `kiem null` → `skip`. Đột biến:

  | `dotBien` | Thông điệp |
  |---|---|
  | `khong-bo-bai` | `KHONG BO MOT RA` |
  | `giu-bai-thu` | `BAI THU VAO TAP` |
  | `chua-kiem-so-0` | `CHUA KIEM GHI SO 0` |
- [ ] **Step 3:** Chạy `node --test --test-name-pattern='DO3-AC-[45]' pipeline/scripts/do-lam-giau.test.mjs`. Kỳ vọng: FAIL.
- [ ] **Step 4:** Viết `kiemNguocSo`, `kiemNguocNhom`, `tongKiem`, hai bộ đọc, và luật nhịp. Detail `do3-kiem-nguoc`:
  - `{ tuan, tap_do, n, dung, sai, khong_ra, ty_le_dung, wilson, phu, chenh, co_y_nghia, nguong_phat_hien, lat, phien_ban_thuoc }`;
  - `lat` phân rã `dung`/`sai`/`khong_ra` theo tin (đường số) hoặc theo tin của bài (đường nhóm). Bài không thành tin vào `khong-tin-hieu`.
- [ ] **Step 5:** Chạy lại lệnh ở Step 3. Kỳ vọng: PASS.
- [ ] **Step 6:** Commit `feat(pipeline): DO3 kiểm ngược bỏ-một-ra mỗi tuần cho số qua người đăng và loại hình theo nhóm`.

### Task 4: Bất biến lát và chặn rò trên detail thật

`independent: false` (dựa Task 2, 3) · phục vụ E6, E9

**Files:**
- Modify: `pipeline/do-lam-giau.mjs` (chỉ khi ca đỏ)
- Test: `pipeline/scripts/do-lam-giau.test.mjs`

**Interfaces:** Consumes `doLamGiau`, `phanRa`, `chanLo`, `chuoiCam`. Không thêm hàm mới.

- [ ] **Step 1: Viết ca `DO3-AC-6`** theo E6. Ma trận: 2 thị trường, 35 phường (35..1 tin), 3 tin không `area_id`, 2 tin `block_raw 'S8.02'`, 2 dự án.
  - Duyệt mọi nhóm số của detail THẬT (cả hai check_name) và mọi chiều: tổng ô = tổng chung.
  - Kiểm hàm import đúng là `KHOA_LAT_DON_VI` và `phanRa` của DO1: so tham chiếu `===` qua `import` hai đường.
  - Đột biến (`dotBien` truyền xuống `phanRa`): `gop-chua-gan` → `GOP HAI O CHUA GAN`; `bo-khac` → `TONG LAT LECH`; `bo-thi-truong` → `THIEU THI TRUONG`.
- [ ] **Step 2: Viết ca `DO3-AC-8`** theo E9. Fixture: số `+84912345678`, băm `h1`, người đăng «Nguyễn Văn Hiếu», `source_registry` có một tên thật giả, bài chứa tên đó.
  - Mọi detail không chứa các chuỗi ấy, không chứa `labeler_id`.
  - Đọc `pipeline/sync-cloud.mjs` bằng import (danh sách FILL export sẵn; nếu chưa export thì đọc bằng hằng có sẵn, không regex tệp): không có hai bảng mới.
  - Đột biến `lo:<băm>` → dừng, 0 dòng, `LO DO3`. `source_registry` rỗng → dừng, 0 dòng. `fill-anh-chup` → `ANH CHUP LEN CLOUD`.
- [ ] **Step 3:** Chạy `node --test --test-name-pattern='DO3-AC-[68]' pipeline/scripts/do-lam-giau.test.mjs`. Sửa tới khi PASS. Thông điệp rò của DO3 là `LO DO3` (bọc lỗi `LO <nhãn>` của `chanLo`).
- [ ] **Step 4:** Commit `test(pipeline): DO3 bất biến lát và chặn rò trên detail thật`.

### Task 5: Khối «Làm giàu» trên /ops/quality + nhãn dq + dữ liệu thử cho ảnh

`independent: false` (đọc khuôn detail của Task 2, 3) · phục vụ E7, E8

**Files:**
- Create: `app/src/lib/ops/quality-lam-giau.ts`
- Create: `app/src/components/ops/quality/lam-giau.tsx`
- Modify: `app/src/app/ops/quality/page.tsx` (thêm `Suspense` + khối dưới «Đo hằng ngày»)
- Modify: `app/src/lib/dq-checks.ts:21` (bảng chung loại `do3-%` cạnh `do1-%`)
- Modify: `app/src/lib/dq-labels.ts` (nhãn `do3-thay-doi` «Làm giàu: thay đổi theo ngày», `do3-kiem-nguoc` «Làm giàu: kiểm ngược tuần»)
- Modify: `CONTEXT.md` (thuật ngữ «Làm giàu», «Kiểm ngược», «Chưa chạy»)
- Create: `pipeline/scripts/do3-dung-thu.mjs`. Dựng DB thử `oneinvest_p2_do3` bằng `db/db-thu.sh`, nạp migration, ghi dữ liệu bịa bằng hàm ghi thật rồi chạy `doLamGiau --write` hai ngày + một tuần trước. Từ chối DB không phải `oneinvest_p2_*`.
- Test: `app/tests/do-lam-giau.test.tsx`

**Interfaces:**
- Consumes: khuôn detail của `do3-thay-doi`, `do3-kiem-nguoc` (Task 2, 3); `LAT_DO` của `app/src/lib/do-hang-ngay.ts` (dùng chung `?lat-do=`).
- Produces:
  - `lamGiauSql(): string`: dòng `do3-*` trong 14 ngày.
  - `gomLamGiau(rows) → LamGiau | null`.
  - `loadLamGiau(db) → Promise<LamGiau|null>`.
  - Kiểu `LamGiau = { duong: { duong, homNay: DongNgay|null, bayNgay: DongNgay[], kiemNay: DongKiem|null, kiemTruoc: DongKiem|null }[] }`.
  - Component `<LamGiau data lat areaNames />` và `<LamGiauSkeleton />`, khuôn như `do-hang-ngay.tsx`.

- [ ] **Step 1: Viết ca `DO3-AC-7`** theo E7. Lược đồ tạm, dòng `do3-*` ghi bằng `doLamGiau` thật (import từ pipeline như ca DO1-AC-8), đọc bằng `loadLamGiau`, render jsdom. Assert chữ:
  - `Chưa chạy`;
  - `không có đường người rút`;
  - `ít mẫu`;
  - `đã lập mốc`;
  - lệnh `node pipeline/do-lam-giau.mjs --write` ở trạng thái trống;
  - `Thử lại` khi loader ném lỗi, phần khác vẫn render;
  - `?lat-do=phuong` đổi bảng;
  - dấu «chênh có ý nghĩa»;
  - `dq-checks` không trả `do3-*`;
  - `dq-labels` có hai nhãn.

  Đột biến (cờ prop `dotBien` của component, chỉ trong test):

  | `dotBien` | Thông điệp |
  |---|---|
  | `chua-chay-hien-0` | `CHUA CHAY HIEN 0` |
  | `khong-loi-hien-0` | `KHONG LOI HIEN 0` |
  | `lap-dong-do3` | `LAP DONG DO3` |
  | `thieu-nhan` | `THIEU NHAN DQ` |
- [ ] **Step 2:** Chạy `cd app && node --import tsx --test tests/do-lam-giau.test.tsx`. Kỳ vọng: FAIL.
- [ ] **Step 3:** Viết loader và component. Trước khi viết UI, ghi kế hoạch ReUI theo `.agents/skills/reui/SKILL.md` vào tin nhắn. Mỗi đường một hàng trong `data-grid`. Badge `-light` cho trạng thái. `Alert` lỗi + nút `Thử lại`. `Skeleton` lúc tải.
- [ ] **Step 4:** Chạy lại lệnh ở Step 2, rồi `cd app && npx tsc --noEmit && npm run lint`. Kỳ vọng: PASS, lint 0 lỗi.
- [ ] **Step 5:** Chạy self-check ReUI trên các tệp vừa đổi (tối đa 2 vòng), sửa mọi chỗ trúng.
- [ ] **Step 6:** Commit `feat(ops-quality): khối Làm giàu (DO3) — thay đổi theo ngày, kiểm ngược tuần, lát chung`.

### Task 6: Bước đêm trong cloud-sync.sh

`independent: true` (chỉ cần tên lệnh `pipeline/do-lam-giau.mjs`) · phục vụ E10

**Files:**
- Modify: `scripts/cloud-sync.sh` (dòng `job_run cloud-sync do-lam-giau node "$ROOT/pipeline/do-lam-giau.mjs" --write` ngay sau dòng `do-hang-ngay`, kèm comment khuôn các bước trên)
- Modify: `scripts/job-exit.test.mjs` (danh sách bước cloud-sync dòng ~158 thêm `"do-lam-giau"` sau `"do-hang-ngay"`; ca mới `DO3 cloud-sync: do-lam-giau hỏng → ≠0, dòng JOB FAIL [cloud-sync] bước do-lam-giau`)

**Interfaces:** Consumes `job_run` của `scripts/lib/job-step.sh`.

- [ ] **Step 1:** Gộp main vào nhánh nếu main đã đi sau #373 (`mcp__ccd_host__sync_with_base_branch`). Đọc lại đuôi `scripts/cloud-sync.sh`.
- [ ] **Step 2:** Viết ca test mới và sửa danh sách bước. Chạy `node --test scripts/job-exit.test.mjs`. Kỳ vọng: FAIL (bước chưa có).
- [ ] **Step 3:** Thêm dòng `job_run` cùng comment hai dòng (DO3, chỉ ghi DB local, dòng fail không đổi mã thoát).
- [ ] **Step 4:** Chạy lại lệnh ở Step 2. Kỳ vọng: PASS. Thử tay đột biến (đảo thứ tự hai bước, bỏ tên khỏi danh sách) → đỏ, rồi hoàn lại.
- [ ] **Step 5:** Commit `ops(cloud-sync): bước đo DO3 do-lam-giau sau do-hang-ngay`.

### Task 7: Tài liệu as-built

`independent: true` · phục vụ không eval (luật AGENTS «làm xong việc cập nhật ROADMAP»)

**Files:**
- Modify: `docs/ROADMAP.md` §2 as-built (một gạch DO3) và §4 trạng thái
- Modify: `docs/product/FRAMING.md` §5 (dòng «Độ đúng — để thấy trôi» trỏ `do3-thay-doi`, `do3-kiem-nguoc`)

- [ ] **Step 1:** Viết hai chỗ, mỗi chỗ ≤ 3 dòng, nêu tên check và lệnh. Không sửa phần khác.
- [ ] **Step 2:** Commit `docs: DO3 do-lam-giau as-built`.

---

## Bản đồ eval → task

| Eval | AC | Task |
|---|---|---|
| E1 | AC-1 | 2 |
| E2 | AC-2 | 1, 2 |
| E3 | AC-3 | 2 |
| E4 | AC-4 | 3 |
| E5 | AC-5 | 3 |
| E6 | AC-6 | 4 |
| E7 | AC-7 | 5 |
| E8 | AC-7 (ảnh) | 5 (dữ liệu `do3-dung-thu.mjs`; chụp ở S4) |
| E9 | AC-8 | 4 |
| E10 | AC-9 | 6 |
