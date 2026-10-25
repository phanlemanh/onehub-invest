# Ops tự vận hành nguồn — tư duy SaaS trên cổng Ops

> Phiên thảo luận với Mạnh, 25/10/2026. Bốn bước: Framing → Phân tích → Hoàn thiện → Đề xuất.
> Trạng thái: §1 Framing chốt ý định (Mạnh: «đúng ý định, scope chưa rõ») · §2 Phân tích (audit chỉ đọc, đo trên
> `main` 9146509–33adaa4) · §3 Hoàn thiện (Mạnh chốt: làm từ xa qua cloud; nội dung/ảnh/thẻ duyệt lên cloud, tên
> nguồn thật chỉ local) · §4 Đề xuất — Mạnh chốt §4.8 (25/10). Bước kế: đưa hàng TV vào lộ trình bằng `/acceptance-gate:cat-luot`.
> Kho công khai: văn xuôi chỉ dùng mã S0x, không tên nguồn thật, không ID nhóm hay ID tài khoản thu. Đường dẫn tệp
> và tên định danh trong mã giữ nguyên như trong kho; Zalo/OpenClaw là tên hạ tầng của luật 8, đã có trong AGENTS.md.

## 1. Framing

### 1.1 Ý định (lời Mạnh)

Đội vận hành dữ liệu tự làm mọi thao tác trên cổng Ops, theo tư duy và kiến trúc của một SaaS, để vận hành nguồn
mà không cần đến Mạnh. Ví dụ Mạnh nêu: CRUD cho đội vận hành — thêm một nhóm S03, thêm một nhóm S05, sửa
tiêu đề nhóm, bổ sung mô tả, viết quy định ngữ cảnh cho AI agent đọc để hiệu quả hơn; bổ sung độ phủ cho từng thị
trường; xem bằng mắt từng tin hay bất động sản thu được, đã làm sạch, hoàn chỉnh (các tin mới nhất), không chỉ nhìn
số liệu; có khả năng kiểm duyệt.

### 1.2 Bốn khối và một nền

| Khối | Câu hỏi khối trả lời | Thao tác điển hình |
|---|---|---|
| **A. Danh mục thu** | Thu từ đâu, cấu hình ra sao? | thêm nhóm S03/S05, vùng S06; sửa tiêu đề, mô tả; bật, tạm dừng, gỡ; tài khoản thu |
| **B. Độ phủ thị trường** | Thị trường X đã đủ nguồn chưa, thiếu gì? | gắn nhóm/vùng vào thị trường (34 tỉnh), đặt mức phủ mục tiêu, thấy chỗ hở |
| **C. Xem tin bằng mắt** | Tin thu về trông thế nào, làm sạch ra sao? | tin mới nhất; một tin xuyên tầng: thô → `stg_*` → `sale_offers` → căn |
| **D. Kiểm duyệt** | Đúng không, giữ hay loại? | duyệt, sửa, loại tin; duyệt đề xuất AI; duyệt nhóm mới trước khi thu |
| **Nền SaaS** | Ai làm gì, lúc nào, đảo được không? | vòng đời, quyền theo vai, nhật ký, chạy thử, hoàn tác |

**Quy định ngữ cảnh cho AI**: đoạn chữ người viết gắn với nhóm hoặc nguồn, Kev và agent tách trường đọc. Đây là
cấu hình đổi kết quả lọc — cần phiên bản, chạy thử trên tin gần đây trước khi bật, và vẫn theo luật 7 (AI chỉ
lọc/tách/đề xuất, không tự ghi). Lộ trình đã có một phần: ON19–ON21 (tiêu đề + mô tả nhóm làm ngữ cảnh H5).

### 1.3 Đội vận hành (mặc định, chờ Mạnh chỉnh)

Người không lập trình. Hai vai, khớp luật clearance (`docs/architecture/portals.md`):
- **ops** — khối C, D; xem B; tạm dừng/chạy lại khi có sự cố.
- **admin** — thêm khối A (nhóm, tài khoản thu, khoá), quy định cho AI, mục tiêu phủ.

**Còn của Mạnh**: chi tiền (credit), ToS và nguồn hoàn toàn mới (cần viết collector — làn ZCode), đổi luật bất biến.

### 1.4 Không làm (anti-goal)

- UI không nới được lớp lockdown Zalo nào; thêm nhóm chỉ là thêm nhóm *để đọc*.
- Tầng A không lên cloud (luật 6).
- Không «xanh giả»: khối không đo được thì nói không đo được (ADR-0014).

### 1.5 Câu bài toán

> Đội vận hành không lập trình tự quản trọn vòng đời của nhóm thu, độ phủ thị trường, tin thu được và kiểm duyệt
> trên cổng Ops — mọi thao tác ghi có kiểm trước, nhật ký, hoàn tác — mà không thao tác nào mở được đường gửi Zalo
> hay đưa tầng A rời máy thu.

### 1.6 Tiêu chí thành công

1. Danh mục thao tác vận hành (§2.2): 100% làm được trên `/ops`, không terminal.
2. 30 ngày liền Mạnh không chạm terminal cho việc vận hành nguồn (trừ sự cố hạ tầng máy).
3. 100% thao tác ghi có dòng nhật ký (ai — người thật, gì, trước/sau) và đường hoàn tác.
4. Thêm một nhóm mới → thấy tin đầu tiên của nhóm đó bằng mắt: < 24 giờ, không cần Mạnh.
5. Mỗi thị trường đang phục vụ có một số độ phủ so được với mức mục tiêu.
6. Sau mọi thao tác trên nhóm Zalo: watchdog xanh, agent 0 turn, và **không có cửa sổ nào** cấu hình vi phạm bất
   biến được nạp vào gateway.

## 2. Phân tích (audit chỉ đọc làn ZCode và phần quản trị hiện có)

Ba lượt audit song song, chỉ đọc: (a) từng nguồn S01–S08 và job launchd; (b) chuỗi S03 — OpenClaw, watchdog,
Kev, collector API, `/ops/sources`; (c) độ phủ, xem tin, kiểm duyệt, quyền, nhật ký. DB local đọc bằng SELECT.

### 2.1 Kiểm kê nguồn và dịch vụ

| Mã · vai trò | Đường thu | Cấu hình nằm ở | Thêm/sửa/dừng hôm nay | Trên `/ops` | Rủi ro khi giao người vận hành | Còn phụ thuộc Mạnh |
|---|---|---|---|---|---|---|
| S01 · tự thu ngắn hạn | collector `airbnb-*` ← `weekly-collect.sh` ← plist `collector` (CN 19:30) + `smoke` 20:00 | thành phố: tham số plist + `collector/src/config/cities.ts`; batch/trang/cửa sổ giờ: env; SLO: code | sửa plist/env/code | chỉ đọc (độ tươi) | anti-bot: headful Chrome hệ thống | cài plist; máy mở phiên desktop |
| S02 · hiệu chuẩn | collector `airdna-research` ← `airdna-rotate.mjs` ← plist 19:05 | market: bảng `airdna_markets` (43, transform tự thêm); con trỏ: tệp `collector/state/airdna-rotation.json`; N/ngày: env; profile đăng nhập: thư mục | sửa env/code | số chỉ ở `/ops/quality` (luật 5) | ToS (chỉ hiệu chuẩn); tài khoản trả phí | đăng nhập lại profile |
| S03 · nhóm chat cộng đồng | gateway OpenClaw → hook → Kev :8009 → collector API :9210 → snapshot → `zalo-import-daily.sh` 00:00 → `transform-zalo` | nhóm, tài khoản, mention gate: `~/.openclaw/openclaw.json`; prompt Kev: cứng trong `collector/openclaw/handler.js`; con trỏ nạp: tệp state dùng chung S05 | UI `/ops/sources` (local): tạo/gỡ tài khoản, QR, bật/tắt nhóm | đọc + ghi (local) | **an toàn gửi tin (luật 8)** — xem §2.4 G6 | sửa tay `openclaw.json`, restart, cài hook |
| S04 · địa giới mở | `osm-boundaries`, chạy tay | code | không cần (`completed`) | không | thấp | chỉ khi tái phân cấp |
| S05 · mạng xã hội | `apify-facebook-collector.mjs` ← plist 00/06/12/18h | nhóm: `source_groups` (5, 1 bật) + 4 URL fallback cứng; actor/limit: code; token: tệp ngoài kho | UI thêm/bật/tắt/xoá nhóm (+ purge `stg`) ; tạm dừng nguồn: UPDATE tay | ghi nhóm (local) | chi phí credit; purge xoá cứng | credit (402 từ ~21/10) |
| S06 · rao vặt công khai | `collect-chotot.mjs` ← `chotot-daily.sh` ← plist 05:30 | vùng: `source_groups` (2, `params.region_v2`) + fallback cứng; feed: code; vòng nạp: `for CITY in hanoi hcmc` cứng | UI bật/tắt; thêm vùng: UI không nhập được `region_v2` | ghi một phần | thấp | không |
| S07 · cổng rao | không có | — | — | — | — | quyết có làm |
| S08 · danh mục dự án | chưa có collector; `stg_s08_inventory` 0 dòng | registry `paused`, chưa SLO | — | không | ToS: ≤1 lần/tuần, nội bộ, local — **chưa có rào máy ép** | đã duyệt chính sách 24/10 |

| Dịch vụ phụ trợ | Ở đâu | Tình trạng |
|---|---|---|
| Gateway OpenClaw | launchd `ai.openclaw.gateway`, cấu hình `~/.openclaw/openclaw.json` | sống; **nạp nóng cấu hình < 1 giây** |
| Watchdog | `scripts/zalo-watchdog.sh`, 5′ | 9 phép kiểm (L1–L5b), KILL khi vi phạm; kiểm *sau* khi ghi |
| Kev :8009 | ngoài kho; plist `kev-gate` | sống; chỉ gắn nhãn `is_bds`, fail-open; điểm `p` không ai đọc |
| Collector API :9210 | `collector/src/api/server.ts` | **tiến trình chạy tay từ 21/10**, launchd «service not found» (ZC4 chờ) |
| Importer/transform | `pipeline/import-*`, `transform-*` | chạy theo plist; hai job chung một tệp con trỏ |
| `source_registry` | DB local (7 dòng; `status` active/paused/completed, không CHECK) | **chỉ `check-freshness` đọc `status`**; không script thu nào tuân |
| `source_groups` | DB local (S05 5, S06 2, S03 0) | không lên cloud |
| Job launchd | 13 nhãn `com.oneinvest.*` | `collector-api`, `kev`, `backup` không chạy dưới launchd; sửa lịch = sửa plist + bootout/bootstrap |

### 2.2 Danh mục thao tác vận hành (thước đo của tiêu chí 1)

| # | Thao tác | Hôm nay làm bằng | Trên `/ops`? | Ai làm được |
|---|---|---|---|---|
| 1 | Thêm nhóm S03 | UI local → ghi thẳng `openclaw.json` | có, **không an toàn** (G6) | ops (API) / admin (trang) |
| 2 | Bật/tắt nhóm S03 | UI local | có | như trên |
| 3 | Thêm/gỡ tài khoản thu S03, đăng nhập QR | UI local + `openclaw` CLI | có | như trên |
| 4 | Thêm/bật/tắt/xoá nhóm S05 | UI local, `source_groups` | có; tắt hết → fallback cứng vẫn thu | ops |
| 5 | Thêm vùng S06 | INSERT tay (UI thiếu `region_v2`); vòng nạp cứng 2 thành phố | không đủ | Mạnh |
| 6 | Sửa tiêu đề, mô tả nhóm | — | chưa (ON19/ON20) | — |
| 7 | Viết quy định ngữ cảnh AI theo nhóm | — (prompt Kev cứng) | chưa (ON21 phần đọc) | dev |
| 8 | Gắn nhóm ↔ thị trường, đặt mục tiêu phủ | — | chưa | — |
| 9 | Tạm dừng / bật lại một nguồn | UPDATE tay `status` — job vẫn chạy | chưa | Mạnh |
| 10 | Đổi lịch chạy | sửa plist + `launchctl` | chưa | Mạnh |
| 11 | Đổi phạm vi S01 (thành phố) / S02 (số market/ngày) | plist/env/code | chưa | Mạnh/dev |
| 12 | Đổi ngưỡng SLO | code `freshness.mjs` + `.ts` | chưa | dev |
| 13 | Thay khoá API, nạp credit | tệp ngoài kho; trang nhà cung cấp | chưa | Mạnh |
| 14 | Đăng nhập lại phiên S02 | tay | chưa | Mạnh |
| 15 | Chạy lại một job hỏng | `launchctl kickstart` | chưa | Mạnh |
| 16 | Xem tin mới nhất / một tin xuyên tầng | — (`/ops/deals`, `/ops/review` một phần) | chưa | — |
| 17 | Duyệt thẻ | `/ops/review` local: duyệt/từ chối/để sau | có, thiếu lý do, sửa, hàng loạt | ops |
| 18 | Hoàn tác một quyết định / một giá trị enrich | CLI `enrich-revert.ts`; hàm SQL không route | chưa | dev |
| 19 | Xem nhật ký thao tác | `GET /api/v1/ops/audit` | chưa có trang (UI13) | admin |

**Đếm**: 6/19 có trên `/ops` ở mức nào đó (1, 2, 3, 4, 17, một phần 16); **0/19** đạt đủ chuẩn SaaS (kiểm trước +
nhật ký người thật + hoàn tác). 8/19 hôm nay chỉ Mạnh làm được.

### 2.3 Đối chiếu với SaaS chuẩn

| Năng lực SaaS | Hiện có | Khoảng trống |
|---|---|---|
| Catalog nguồn | `source_registry` (mã, nhãn, status, note, `real_name` tầng A) | không có loại nguồn, khuôn cấu hình, chủ sở hữu, chi phí; tên thật nằm trong migration công khai |
| Đơn vị thu (nhóm/vùng/market) | `source_groups` (S05, S06); S03 ở `openclaw.json`; S02 ở `airdna_markets` + tệp state | **ba sổ, ba khuôn**; PL12 đã đề xuất gộp |
| Vòng đời | `status` tự do, không CHECK; `paused` chỉ tắt đo độ tươi | không máy trạng thái; không ai tuân trạng thái |
| Cấu hình theo khuôn + kiểm | `params jsonb` không schema | không kiểm trước khi ghi; UI không biết trường nào bắt buộc |
| Quyền theo vai | `users.role` user/ops/admin (không CHECK, 0 người `ops`); `canAccessOps`, `isAdmin` | **API quản trị chỉ cần ops hoặc một bearer chung** — trái portals.md; không scope `ops:write`, không token máy theo tên |
| Nhật ký | `ops_audit` (local, 24 dòng) | actor là hằng (`ops-user`, `api:zalo-admin`); ghi ngoài transaction; không trước/sau; không lên cloud; không trang |
| Chạy thử | `--kho`, `--dry` ở vài script | không có trên route ghi nào |
| Hoàn tác | tệp `.bak-<ms>` (21, không xoay); `revert_enrichment` SQL | không nút hoàn tác; purge `stg` không đảo được |
| Idempotency | hứa ở ADR-0007, portals | không có trong code |
| Điều khiển từ xa | không | cloud → local không có đường; ADR-0014 loại tunnel |
| Xem bản ghi | `/ops/deals`, `/ops/review` | không xem xuyên tầng; S06 không lưu khoá nối ngược |
| Độ phủ | độ tươi nguồn × thành phố; độ phủ trung thực S01 theo S02 | không trục thị trường; không mục tiêu; tin S03 228/232 thiếu `area_id` bị đếm hụt im lặng |
| Hàng duyệt | `review_queue` 4 loại (2 dùng) | thẻ entity_match không còn sinh từ migration 029; không duyệt nhóm hay tin |

### 2.4 Sáu nguyên nhân gốc

- **G1 — Công tắc không phải công tắc.** Ý định ghi trên UI không có quyền với runtime: `status=paused` không job nào
  tuân (S05 vẫn bắn 4 lần/ngày khi hết credit); tắt hết nhóm S05/S06 thì script rơi về danh sách cứng; thêm vùng S06
  thu được mà không nạp. Người vận hành bấm xong không biết hệ có làm theo không.
- **G2 — Cấu hình rải sáu chỗ.** Code, plist, env, tệp state, `openclaw.json`, DB. Mỗi chỗ một cách sửa, nên chỉ
  người biết cả sáu (Mạnh) vận hành được.
- **G3 — Ghi thẳng, không kiểm, không người, không đảo.** Route ghi ghi ngay, actor là hằng, quyền lệch (ops làm việc
  của admin), purge xoá cứng `stg_*` (làn ZCode) từ app.
- **G4 — Không có đường cloud → máy thu.** Mọi thao tác ghi chỉ chạy ở máy thu; cloud chỉ đọc số 15′/lần
  (ADR-0014). «Mọi thao tác trên cổng Ops» hôm nay nghĩa là ngồi ở máy thu.
- **G5 — Thấy số, không thấy tin.** Không trang xem một tin xuyên tầng; độ phủ không có trục thị trường; hàng duyệt
  không được nuôi.
- **G6 — An toàn Zalo dựa vào bắt-sau-khi-xảy-ra.**
  - Tick bật một nhóm **chưa có** trong cấu hình ghi `requireMention: false` (`app/src/lib/zalo-admin.ts:236`, còn
    trên `main` 33adaa4). Gateway nạp nóng < 1 giây; watchdog bắt sau ≤ 5′ rồi KILL gateway (`pkill -9 -f openclaw`,
    giết cả tiến trình đăng nhập QR). Khớp chuỗi sự cố 22/10 (ba tệp `.bak` 17:56 → agent turn 17:59). Chưa hàng lộ
    trình nào theo dõi — đã đề xuất phiên sửa riêng.
  - Watchdog không kiểm: `groupPolicy`, `groupAllowFrom`, `requireMention` cấp tài khoản, `plugins.entries.zalo`
    (đang bật), `commands.ownerAllowFrom` (đang có một định danh), `agents`/`talk`, `hooks.internal`.
  - «Bảy lớp» không có định nghĩa chuẩn: watchdog tự gọi «5 lớp», UI vẽ 8 dòng (L1–L3 chỉ chép «watchdog còn tươi»).

### 2.5 Việc chỉ Mạnh làm được hôm nay

Tạm dừng/bật lại nguồn · đổi lịch · cài/khởi động lại job launchd · thêm vùng S06 · đổi phạm vi S01/S02 · thay khoá,
nạp credit · đăng nhập lại phiên S02 · sửa tay `openclaw.json` · chạy lại job hỏng. Trong đó *chi tiền* và *đăng nhập
tài khoản trả phí* nên vẫn là của Mạnh; phần còn lại là ứng viên giao.

### 2.6 Điều lạ phụ (không chặn thiết kế, cần hàng riêng)

1. `readZaloAllowlist` (`app/src/lib/collections-queries.ts`) đọc khoá nhóm cũ ở cấp kênh thay vì cấp tài khoản —
   `/ops/collections` hiện allowlist sai; `push-ops-facts.mjs` đọc đúng.
2. `apify-facebook-daily.sh` và `zalo-import-daily.sh` cùng ghi một tệp con trỏ, cùng 00:00; bên S05 vẫn
   `import … || true` → snapshot S03 có thể bị bỏ qua vĩnh viễn.
3. `source-groups` GET kiểm bearer trên một `Request` rỗng → nhánh bearer không bao giờ qua.
4. Route Zalo trên cloud trả «thành công» cho toggle không xảy ra và vẫn ghi audit.
5. `ops_heartbeat` không có migration (bảng chỉ cloud) — lệch luật 2.
6. Tên nguồn thật nằm trong migration 012/014/021/022 và vài tài liệu công khai (ROADMAP §2.3, `docs/research/*`).
7. ROADMAP §2.3–2.4 lệch thực tế: «S01 20:00 discovery» (thật ra smoke), «rotation 34 tỉnh» (43 market).
8. `stg_zalo_posts` còn 1.260 dòng `agent_id` null (dữ liệu thử, PL1); `media_files` 0 dòng có giá trị.
9. `backup` không chạy dưới launchd.
10. Danh sách job của `push-ops-facts.mjs` thiếu `chotot`, `apify-facebook`, `zalo-import`.

## 3. Hoàn thiện

**Mạnh chốt (25/10): đội vận hành làm việc từ xa trên cổng Ops ở cloud.** Phần dưới là kiến trúc đích theo lựa chọn
đó. Chỗ ghi *(đề xuất)* là quyết định của người viết, Mạnh có thể đảo.

### 3.1 Nguyên lý: mặt điều khiển ở cloud, mặt thực thi ở máy thu

```
        CLOUD (Vercel + Supabase)                         MÁY THU (local)
 ┌──────────────────────────────────────┐        ┌──────────────────────────────────────────┐
 │ /ops: danh mục · độ phủ · tin · duyệt │        │ bộ áp ops-apply (launchd, 60″)            │
 │                                        │  kéo   │   1 kéo lệnh đã duyệt (HTTPS ra ngoài)    │
 │ change_requests (ý muốn, có khuôn) ───┼───────▶│   2 kiểm khuôn + bất biến (hàm thuần)     │
 │                                        │        │   3 chạy thử → diff                        │
 │ catalog bản điều khiển (mã S0x,       │        │   4 áp nguyên tử vào đích (DB local,       │
 │   đơn vị thu, khuôn, mục tiêu phủ)    │        │     openclaw.json, plist) + bản trước      │
 │                                        │  đẩy   │   5 kiểm sau áp (watchdog chạy ngay)      │
 │ ops_heartbeat · kết quả lệnh ◀────────┼────────│   6 hỏng → tự hoàn tác; báo kết quả        │
 │ nhật ký (bản che tầng A)              │        │ tầng A: tên thật, khoá, phiên, QR, thô     │
 └──────────────────────────────────────┘        └──────────────────────────────────────────┘
```

- Cloud **chỉ ghi ý muốn** vào `change_requests`; không bao giờ gọi vào máy thu (giữ tinh thần ADR-0014: không
  cổng mở vào máy giữ phiên Zalo). Máy thu **kéo** ra ngoài bằng HTTPS, cùng kiểu `push-ops-facts` đang đẩy.
- Máy thu là bên duy nhất ghi vào runtime. Mọi ghi đi qua **một bộ áp** — không còn route app ghi thẳng
  `openclaw.json`, `source_groups` hay plist.
- Đây là khác biệt với phương án C bị loại ở ADR-0014: không tunnel, không cổng vào, máy thu tắt thì lệnh nằm chờ
  và cloud hiện «máy thu chưa nhận từ HH:MM». Cần **ADR-0015** bổ sung 0014 (đường lệnh kéo một chiều).

### 3.2 Mô hình dữ liệu đích

| Bảng | Vai | Ở đâu | Ghi chú |
|---|---|---|---|
| `source_types` | khuôn theo loại nguồn: trường cấu hình, kiểu, giới hạn cứng | cloud + local (seed qua migration) | bảy loại, §3.3 |
| `source_registry` (mở rộng) | catalog nguồn: `code`, `type`, `lifecycle` (CHECK), `slo_hours`, `schedule_preset`, `cost_guard`, `note` | cloud: bản không `real_name`/`source_ids`; local: đủ | `real_name` chỉ ở local (luật 6) |
| `collection_units` | **sổ đơn vị thu một nơi** (PL12): nhóm S03/S05, vùng S06, market S02 — `id` uuid, `source_code`, `unit_key`, `original_name`, `display_title`, `description` (ON19), `market_codes[]`, `project_tags[]`, `params` (kiểm theo khuôn), `lifecycle`, `version` | cloud + local | tên nhóm là tầng C; khoá tài khoản thu là tham chiếu local (`account_ref`) |
| `context_rules` | quy định ngữ cảnh cho AI, có phiên bản: `scope` (nguồn/đơn vị/thị trường), `body`, `version`, `status` draft→testing→active→retired, `trial_result` | cloud + local | agent đọc bản `active` (ON21); luật 7 giữ nguyên |
| `coverage_targets` | mục tiêu phủ theo thị trường × chỉ số | cloud | chỉ số tính sẵn ở pipeline (luật 10) |
| `market_coverage` | số phủ đã tính: thị trường × nguồn — đơn vị đang thu, tin 7 ngày, tỉ lệ tin gắn được phường, căn | tính ở local, đẩy lên | thay «độ tươi nguồn × thành phố» |
| `change_requests` | lệnh có khuôn: `type`, `target`, `payload`, `before`, `status`, `requested_by`, `approved_by`, `idempotency_key`, `result`, `inverse` | cloud (nguồn), local (bản đang áp) | máy trạng thái §3.4 |
| `ops_audit` (mở rộng) | `actor` = id người thật, `action`, `before`/`after`, `change_request_id`, `env` | local đủ; cloud bản che tầng A | thay actor hằng số |
| `job_runs` | mỗi lượt thu: bắt đầu, kết thúc, mã thoát, số bản ghi, kể cả lượt 0 tin (ZC7) | local → facts | nuôi độ tươi đúng và «chạy lại» |

Khoá API, credit, phiên đăng nhập, profile trình duyệt **không có bảng ở cloud**: catalog chỉ biết `secret_ref` và
trạng thái («có khoá · hết hạn · hết credit») do máy thu báo lên.

### 3.3 Khuôn theo loại nguồn

| Loại | Nguồn | Trường người vận hành sửa được | Giới hạn cứng (UI không vượt) |
|---|---|---|---|
| `chat_group` | S03 | bật/tắt nhóm đã có trong tài khoản thu, tiêu đề, mô tả, thị trường, dự án | mention gate, bindings, chính sách nhóm: **không có trường** (§3.6) |
| `social_group` | S05 | URL nhóm, bật/tắt, tiêu đề, mô tả, thị trường, số bài/lượt trong khoảng cho phép | trần chi phí/ngày; hết credit → tự `paused` |
| `classifieds_region` | S06 | vùng (chọn từ danh sách 34 thị trường, máy tự điền mã vùng), bật/tắt, số trang | jitter, rps |
| `str_crawler` | S01 | thành phố, batch, lịch tuần | cửa sổ giờ, trần/ngày, headful |
| `calibration` | S02 | số market/ngày trong khoảng | chỉ hiệu chuẩn (luật 5), trần/ngày |
| `catalog` | S08 | danh sách dự án | **≤ 1 lần/tuần** ép ở bộ áp (luật 5) |
| `one_time` | S04 | — | chạy lại chỉ admin, kèm lý do |

Lịch chọn từ **preset** của loại (vd «hằng ngày 05:30», «6 giờ một lần»), không gõ cron tự do; bộ áp sinh plist
từ khuôn `pipeline/cron/`.

### 3.4 Vòng đời và máy trạng thái

**Nguồn và đơn vị thu**: `draft → active ⇄ paused → retired` (+ `completed` cho one-time). Luật then chốt: **mọi
script thu đọc trạng thái hiệu dụng qua một hàm duy nhất** (`isRunnable(source, unit)`) trước khi thu; bỏ hết danh
sách fallback cứng (G1). `paused` có `reason` + `resume_when` (vd «credit reset 7/11»). `retired` giữ mã, không tái
dùng, dữ liệu cũ giữ nguyên (luật 1).

**Lệnh**:

```
draft → submitted → approved → queued → applying → applied
                 ↘ rejected            ↘ failed → reverted (tự động)
applied → (hoàn tác) → một lệnh mới loại inverse, đi lại đúng vòng trên
```

- Lệnh nào cần người thứ hai duyệt: theo bảng quyền §3.5. Lệnh của admin tự duyệt được nhưng **luôn qua bước xem
  diff**.
- `idempotency_key` mỗi lệnh; bộ áp áp một lệnh tối đa một lần.
- Lệnh chạm S03 áp **từng lệnh một**, không gộp.

**Danh sách loại lệnh có khuôn** *(đề xuất, khởi điểm)*: `unit.create` · `unit.update_meta` · `unit.enable` ·
`unit.disable` · `unit.retire` · `source.pause` · `source.resume` · `source.set_schedule` · `source.set_slo` ·
`context_rule.publish` · `context_rule.retire` · `coverage_target.set` · `job.rerun` · `review.decide`. Không có lệnh tự do, không có
«sửa JSON».

### 3.5 Quyền theo vai

| Vai | Ai | Được |
|---|---|---|
| `viewer` *(đề xuất, mới)* | người đọc | xem mọi trang Ops (mã S0x, số, tin đã che) |
| `ops` | đội vận hành | + gửi lệnh `unit.update_meta`, `source.pause`, `job.rerun`; duyệt thẻ; đề xuất nhóm mới (`unit.create` ở `draft`) |
| `admin` | trưởng vận hành | + duyệt và gửi mọi lệnh có khuôn; `context_rule.publish`; `coverage_target.set` |
| `owner` | Mạnh | + loại nguồn mới, trần chi phí/ToS, thêm loại lệnh, đổi bảng quyền |

- Mỗi route ghi kiểm vai theo bảng này ở **một chỗ** (`app/src/lib/ops-access.ts`); trang và API cùng một luật
  (sửa G3).
- Máy thu kéo bằng **token máy theo tên** (scope `ops:pull`), không dùng `OPS_API_TOKEN` chung.

### 3.6 An toàn Zalo bằng thiết kế (không nới lớp nào)

1. **Khoá cấm**: bộ áp từ chối mọi lệnh có trường nằm trong danh sách: `bindings`, `channels.zalo`,
   `plugins.entries.zalo`, `agents.*`, `talk`, `commands.*`, `hooks.internal.*`, `pluginHooks`, `groupPolicy`,
   `groupAllowFrom`, `requireMention` ở mọi cấp. UI không có ô nào cho các khoá này.
2. **Kiểm trước khi ghi**: một hàm thuần `checkZaloInvariants(cfg)` dùng chung cho bộ áp và watchdog, phủ đủ các
   khoá trên (rộng hơn watchdog hôm nay). Vi phạm → không ghi. Lý do: gateway nạp nóng < 1 giây, kiểm sau 5′ là muộn.
3. **Ghi nguyên tử + bản trước có số**: ghi tệp tạm rồi đổi tên; giữ N bản trước có số phiên bản, gắn
   `change_request_id`.
4. **Kiểm sau áp hai phía** (luật 8): chạy watchdog ngay; trong 10′ phải thấy cả «agent 0 turn» lẫn «tin vẫn chảy»;
   hỏng → tự áp bản trước và báo.
5. **Thêm nhóm S03 nghĩa là cho phép đọc một nhóm tài khoản thu đã ở trong đó.** Vào nhóm là việc người làm trên
   điện thoại; agent không bao giờ vào nhóm.
6. **Đăng nhập QR ở lại máy thu** *(đề xuất)*: ảnh QR là chìa đăng nhập ngắn hạn, hiện trên cloud thì ai có quyền
   Ops cũng chiếm được phiên. Cloud chỉ hiện trạng thái phiên («đang đăng nhập · mất phiên từ HH:MM»).
7. **Phanh tại máy**: một cờ ở máy thu (chỉ người ngồi máy bật) dừng bộ áp; cloud có nút «đóng băng thay đổi» cho
   owner.

### 3.7 Ranh giới tầng A: cái gì ở đâu

| Thứ | Cloud | Máy thu |
|---|---|---|
| Mã S0x, loại, vòng đời, lịch preset, SLO | ✅ | ✅ |
| Tên nguồn thật, `source_ids`, tên miền nguồn | ❌ | ✅ |
| Tên nhóm, tiêu đề, mô tả, thị trường (tầng C) | ✅ | ✅ |
| Định danh tài khoản thu, phiên, QR, khoá, profile | ❌ (chỉ trạng thái) | ✅ |
| Lệnh + kết quả + diff | ✅ bản che tầng A | ✅ đủ |
| Nhật ký | ✅ bản che | ✅ đủ |
| Tin chuẩn `sale_offers`, căn | ✅ (đã sync, CLOUD_ALLOW) | ✅ |
| Nội dung bài gốc + ảnh tin (khối C) | ✅ nguyên văn cho vai `ops` trở lên; tên nguồn thật thay bằng mã | ✅ |
| Thẻ duyệt `review_queue` (khối D) | ✅ như trên | ✅ |

**Mạnh chốt (25/10):** nội dung bài, ảnh tin rao và thẻ duyệt **lên cloud, không che** — người xem là đội vận
hành. Riêng **tên nguồn thật vẫn chỉ ở máy thu**: cloud hiện mã (vd `S08`), máy thu hiện mã kèm tên
(`S08-<tên thật>`). Đây là sửa đổi luật 6 / ADR-0007 (tầng A thu hẹp còn: tên nguồn thật, hồ sơ người dùng app,
định danh tài khoản thu, phiên/khoá). Hệ quả kỹ thuật:

- Bộ che `maskSourceNames` + bộ soát `tier-a-guard` chạy trên nội dung bài trước khi lên (thay tên/tên miền nguồn
  bằng mã); soát đỏ thì không gửi dòng đó.
- **Điều kiện trước**: migration 037 (khoá anon + RLS) đã áp trên Supabase — ROADMAP V8 ghi *chưa áp*. Thiếu nó
  thì nội dung tin đọc được bằng anon key công khai.
- Ảnh cần chỗ lưu riêng tư trên cloud (bucket có khoá, URL ký ngắn hạn) — có chi phí lưu trữ.
- `user_events`/`user_profile` vẫn tầng A, không đổi.

Kết quả đi lên qua `push-ops-facts` và bộ soát tầng A đã có (`pipeline/lib/tier-a-guard.mjs`), không dựng đường
đẩy mới.

### 3.8 Khối C và D trên cloud

- **Hồ sơ tin** `/ops/offers/[id]` *(đề xuất slug)*: tin chuẩn → các bài gốc (`post_ids`) → snapshot (mã, giờ, S0x)
  → căn. Cần lưu khoá nối ngược cho S06 (hôm nay `post_ids` rỗng). Trang «tin mới nhất» lọc theo nguồn, đơn vị,
  thị trường.
- **Hàng duyệt**: thêm loại thẻ `unit_proposal` (nhóm mới chờ duyệt) và `offer_flag` (tin bị gắn cờ); bắt buộc lý
  do; quyết định đi xuống máy thu dưới dạng lệnh `review.decide`. Job định kỳ sinh lại thẻ `entity_match`.
- Cả hai dựa vào quyết định tầng A ở §3.7.

## 4. Đề xuất

Lộ trình theo lát cắt nhỏ. Mỗi lát là một hàng đề xuất cho `docs/plan/lo-trinh.json` (tiền tố mới **TV** — «tự vận
hành»; chưa ghi vào tệp — đưa vào bằng `/acceptance-gate:cat-luot` khi Mạnh chốt). Hàng có sẵn được dùng lại, không
nhân bản. Làn theo AGENTS.md: ZCode giữ `collector/`, `collect-*`/`import-*`/`apify-*`, `*-daily.sh`, plist,
`zalo-*.sh`, DATA-CONTRACT; Claude giữ phần còn lại.

### 4.1 Đợt 0 — nền an toàn và luật (làm trước mọi thứ)

| Mã | Tầng | Làn | Câu giao | Bật khi | Đứng trên |
|---|---|---|---|---|---|
| — | T3 | Claude | (đã có) PR #77 `nhom-moi-requiremention`: nhóm Zalo mới từ UI luôn `requireMention:true` | chờ Mạnh ký Cổng 2 | — |
| TV0 | T1 | Claude | ADR-0015 «đường lệnh kéo một chiều cloud → máy thu» (bổ sung ADR-0014); sửa đổi ADR-0007 (nội dung/ảnh/thẻ duyệt lên cloud, tên nguồn thật chỉ local); thuật ngữ mới trong `CONTEXT.md` (Đơn vị thu, Lệnh, Quy định ngữ cảnh, Mục tiêu phủ) | Mạnh duyệt ADR | — |
| TV1 | T3 | Claude | Một luật quyền: bảng vai `viewer/ops/admin/owner` ở một chỗ; mọi route ghi (`zalo/**`, `source-groups`, `review`) kiểm theo bảng; `ops_audit.actor` = id người thật, ghi trong cùng transaction; `users.role` có CHECK | gọi route quản trị bằng vai `ops`: 403; mỗi thao tác một dòng audit có id người | TV0 |
| TV2a | T2 | Claude | Vòng đời có CHECK trên `source_registry` + `source_groups` (`draft/active/paused/retired/completed`, `reason`, `resume_when`) và hàm `isRunnable()` dùng chung | migration áp local; hàm có test | TV0 |
| TV2b | T3 | ZCode | Công tắc thật: mọi script thu gọi `isRunnable()` trước khi thu; bỏ danh sách fallback cứng S05/S06; `chotot-daily.sh` lấy vùng từ DB; S05 `paused` → job thoát sớm có dòng log | đặt S05 `paused`: 0 lời gọi nhà cung cấp; tắt hết nhóm: 0 lượt thu | TV2a |
| TV3a | T3 | Claude | `checkZaloInvariants(cfg)` thuần, phủ đủ khoá cấm §3.6 (rộng hơn watchdog hôm nay); bộ ghi cấu hình gọi nó trước khi ghi, ghi nguyên tử, giữ bản trước có số | mỗi khoá cấm một ca đỏ; ghi hỏng giữa chừng không để tệp dở | #77 |
| TV3b | T3 | ZCode | Watchdog gọi cùng `checkZaloInvariants`; định nghĩa một danh sách lớp chuẩn (thay «5/7/8 lớp» đang lệch) dùng cho watchdog, UI và facts | watchdog và UI cùng số lớp, cùng tên | TV3a |

### 4.2 Đợt 1 — sổ đơn vị thu và đường lệnh

| Mã | Tầng | Làn | Câu giao | Bật khi | Đứng trên |
|---|---|---|---|---|---|
| PL12 | T3 | Claude | (đã có) sổ nhóm một nơi — **mở rộng phạm vi** thành `collection_units` gồm cả vùng S06 và market S02, thêm `market_codes[]` | — | TV2a |
| ON19 / ON20 | T3 / T2 | Claude | (đã có) tiêu đề chuẩn + mô tả nhóm, màn sửa | — | PL12 |
| TV4 | T3 | Claude | `change_requests` + máy trạng thái + bộ áp `ops-apply` ở máy thu (launchd 60″, token máy `ops:pull`), kết quả qua `push-ops-facts`; **hai lệnh đầu**: `source.pause`, `source.resume` | trên cloud bấm tạm dừng S05 → ≤ 5′ sau máy thu áp, cloud hiện «đã áp lúc HH:MM» kèm diff; máy thu tắt: lệnh nằm chờ, cloud báo rõ | TV1, TV2b |
| TV5 | T3 | Claude | Lệnh `unit.create/enable/disable/update_meta/retire` cho S05, S06 (thay route ghi thẳng `source-groups`; bỏ purge xoá cứng) | thêm nhóm S05 từ cloud → lượt thu kế có nhóm đó | TV4, PL12 |
| TV6 | T3 | Claude (ZCode review + triển khai) | Lệnh `unit.enable/disable` cho S03 qua bộ áp: kiểm trước (TV3a), ghi nguyên tử, kiểm sau hai phía 10′, tự hoàn tác | 0 cửa sổ vi phạm bất biến được nạp; hỏng kiểm sau → tự về bản trước | TV4, TV3a, TV3b |
| TV7 | T3 | ZCode + Claude | Lệnh `source.set_schedule` (preset theo loại) và `job.rerun`: bộ áp sinh plist từ khuôn `pipeline/cron/` và nạp lại (ZCode viết bộ chuyển plist; Claude viết lệnh) | đổi preset trên cloud → `launchctl` thấy lịch mới; rerun có dòng `job_runs` | TV4 |
| TV8 | T2 | Claude | `slo_hours` đọc từ catalog (cả `freshness.mjs` và `.ts`, giữ test parity) + lệnh `source.set_slo` | đổi SLO trên cloud → `check-freshness` dùng số mới | TV4 |

### 4.3 Đợt 2 — xem tin bằng mắt và độ phủ thị trường

| Mã | Tầng | Làn | Câu giao | Bật khi | Đứng trên |
|---|---|---|---|---|---|
| TV9 | T3 | Claude (ZCode: ảnh) | Nội dung bài gốc + ảnh lên cloud cho vai `ops`: bảng chiếu bài (đã thay tên nguồn bằng mã, qua `tier-a-guard`), ảnh vào bucket riêng tư URL ký; ZCode bảo đảm `media_files` có dòng thật (ZC4/N1) | anon đọc: 0 dòng; vai `ops` thấy bài + ảnh; soát tên nguồn trên toàn bộ bài: 0 trúng | TV0, **037 đã áp cloud** |
| TV10 | T2 | Claude | Hồ sơ tin `/ops/offers/[id]` (tin chuẩn → bài gốc → snapshot → căn) + «Tin mới nhất» lọc nguồn/đơn vị/thị trường; S06 lưu khoá nối ngược | mở một tin S03, S05, S06: thấy đủ bốn tầng | TV9 |
| TV11 | T2 | Claude | `market_coverage` tính sẵn ở pipeline (thị trường × nguồn: đơn vị đang thu, tin 7 ngày, % gắn được phường, căn) + trang độ phủ thị trường; tin không gắn được thị trường hiện thành một dòng riêng | 34 thị trường đều có dòng (kể cả 0); số khớp SELECT tay | PL12 |
| TV12 | T2 | Claude | `coverage_targets` + lệnh `coverage_target.set`; trang độ phủ so số với mục tiêu | đặt mục tiêu → thị trường dưới mục tiêu hiện cảnh báo | TV11, TV4 |

### 4.4 Đợt 3 — kiểm duyệt và quy định cho AI

| Mã | Tầng | Làn | Câu giao | Bật khi | Đứng trên |
|---|---|---|---|---|---|
| PL3, UI1, UI12, UI13 | — | Claude | (đã có) thẻ đủ căn cứ + lý do; hàng chờ dạng bảng; trả lại hàng loạt; trang `/ops/audit` | — | TV1 |
| TV13 | T3 | Claude | `review_queue` lên cloud; quyết định đi xuống bằng lệnh `review.decide`; job định kỳ sinh thẻ `entity_match`; loại thẻ `unit_proposal` (ops đề xuất nhóm → admin duyệt → `unit.create`) | duyệt trên cloud → áp ở local ≤ 5′; 37 cặp `needs_llm` thành thẻ | TV4, TV9 |
| TV14 | T3 | Claude + ZCode | `context_rules` có phiên bản; «chạy thử» một bản trên N tin gần đây, báo số nhãn/đề xuất thay đổi; `publish` qua lệnh; ON21 đọc bản `active`; ZCode: hook/Kev đọc quy định theo nhóm | bản thử không áp dữ liệu; publish → lượt sau có căn cứ trích quy định | ON21, TV4 |

### 4.5 Đợt 4 — tự chủ và đo

| Mã | Tầng | Làn | Câu giao | Bật khi | Đứng trên |
|---|---|---|---|---|---|
| TV15 | T2 | ZCode + Claude | Trần chi phí: nhà cung cấp trả hết credit → nguồn tự `paused` có lý do, cloud báo | giả 402: nguồn `paused` trong 1 lượt | TV2b |
| TV16 | T2 | Claude | S08 ≤ 1 lần/tuần ép ở bộ áp và lịch (luật 5) | đặt lịch dày hơn: lệnh bị từ chối | TV7 |
| TV17 | T1 | Claude | Sổ tay đội vận hành + checklist 19 thao tác §2.2 làm thước tiêu chí 1; mở 30 ngày đo tiêu chí 2 | — | đợt 1–3 |

### 4.6 Hàng nhỏ từ điều lạ §2.6 (độc lập, làm lúc nào cũng được)

| Việc | Tầng | Làn |
|---|---|---|
| `readZaloAllowlist` đọc đúng khoá cấp tài khoản | T2 | Claude |
| Tách tệp con trỏ S03/S05; nạp S05 không nuốt mã thoát | T2 | ZCode (đã một phần trong P3-1) |
| `source-groups` GET kiểm bearer trên request thật | T2 | Claude |
| Route Zalo trên cloud trả lỗi rõ thay vì «thành công» giả | T2 | Claude |
| `ops_heartbeat` có migration | T2 | Claude |
| ROADMAP §2.3–2.4 sửa cho khớp thực tế | T1 | Claude |
| `push-ops-facts` thêm job `chotot`, `apify-facebook`, `zalo-import` | T2 | Claude |

### 4.7 Ra khỏi kho (việc của người, không phải hàng)

Áp migration 037 lên Supabase (điều kiện của TV9) · tạo bucket ảnh riêng tư · cấp token máy `ops:pull` · đưa
collector API vào launchd (triển khai ZC4) · tạo tài khoản vai `ops`/`admin` thật cho đội vận hành.

### 4.8 Quyết định của Mạnh

Mạnh hỏi khuyến nghị rồi **chốt cả tám (25/10)**. Cột «Quyết định» là bản đã chốt.

| # | Câu hỏi | Quyết định | Vì sao |
|---|---|---|---|
| 1 | Admin đầu tiên; S03 cần người thứ hai duyệt? | Mạnh chỉ định một **trưởng vận hành** làm `admin`; Mạnh giữ `owner`. **Mọi lệnh chạm S03 cần người thứ hai duyệt** (admin khác hoặc owner); lệnh S05/S06, tạm dừng, sửa tiêu đề/mô tả thì không | S03 đã có hai sự cố; duyệt thứ hai là một cú bấm trên điện thoại, không phải terminal — vẫn đạt «không cần Mạnh» cho mọi thứ khác |
| 2 | Đăng nhập QR ở lại máy thu? Ai quét? | **Đồng ý ở lại máy thu.** Người quét là chủ tài khoản thu, đứng tại máy thu. Cloud chỉ báo «mất phiên từ HH:MM» và tạo việc cho người đó. **Đo tần suất mất phiên 30 ngày** trước khi dựng gì thêm | Ảnh QR là chìa đăng nhập; đưa qua cloud là mở đường chiếm phiên. Mất phiên hiếm thì không đáng dựng hạ tầng (luật 11) |
| 3 | Ảnh: trần dung lượng; gốc hay thu nhỏ? | **Chỉ ảnh thu nhỏ** lên cloud (cạnh dài ~800px, webp), ảnh gốc ở máy thu. Giữ ảnh của tin còn sống + 90 ngày. Trần khởi điểm **5 GB**, cảnh báo ở 80% | Đủ để nhìn bằng mắt và duyệt; ước thô vài GB/tháng ở lưu lượng hôm nay (≈2.500 bài S03/ngày) — **đo lại** sau 2 tuần chạy; kiểm hạn mức gói Supabase hiện tại trước khi bật |
| 4 | Trần chi phí S05; tự tạm dừng? | Trần = credit gói đã mua chia theo ngày. **Tự `paused`** khi chạm trần hoặc khi nhà cung cấp báo hết credit; **bật lại do admin bấm**, không tự bật | Tự dừng chặn đốt tiền và báo động giả; tự bật lại dễ chạy lại vào lỗi cũ — một cú bấm là rẻ |
| 5 | Kéo đợt 2 lên song song đợt 1? | **Một phần.** TV11 (độ phủ thị trường, chỉ đọc) chạy song song đợt 1 ngay. TV9/TV10 (bài + ảnh lên cloud) bắt đầu **ngay khi 037 đã áp** — áp 037 sớm là việc mở khoá của Mạnh | TV11 không chạm tệp của đợt 1; TV9 bị chặn bởi 037, không bởi đợt 1 |
| 6 | Quy định cho AI: model cloud hay local? | **Local** (đường Kev hiện có) làm mặc định; chỉ cân model cloud khi có số đo chất lượng cho thấy local không đủ | Nội dung bài lên cloud là cho *người* của đội; gửi cho nhà cung cấp model là thêm một bên thứ ba. Luật 7 + 11 |
| 7 | Mã riêng cho đơn vị thu? | **Có**: mã ngắn ổn định `S03-N012` (N nhóm · V vùng · M market), máy sinh, không tái dùng, hiện ở cả cloud lẫn local | Tiêu đề nhóm sẽ sửa được (ON20) nên cần một tên không đổi cho lệnh, nhật ký và kênh với ZCode — không phải dùng ID thật |
| 8 | Tên nguồn thật trong migration công khai? | **Chấp nhận như lịch sử**, không mở hàng dọn: từ nay migration và tài liệu mới không thêm tên thật (seed `real_name` bằng script local) | Tên đã có ở nhiều chỗ công khai (tên tệp, đường dẫn mã, AGENTS.md, CONTEXT.md); dọn văn xuôi không lấy lại được bí mật mà tốn công. Nếu Mạnh thấy vậy thì nên cân lại: tên nguồn thật có còn đáng là tầng A không |
