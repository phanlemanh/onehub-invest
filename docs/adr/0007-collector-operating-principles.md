# ADR-0007: Nền tảng vận hành collector — SPL · CCP · DCA · DQO · DR

Ngày: 2026-10-18 · Trạng thái: accepted · Kèm theo: ROADMAP v3 (C1–C4),
portals.md (clearance law), ADR-0006 (sửa đổi agent-report qua raw zone)

## Bối cảnh

Ba định hướng từ user (2026-10-18), sau khi rà tầm nhìn Collector (ADR-0003/4/5/6,
DATA-CONTRACT, ROADMAP v2):

1. **Mã hoá danh tính nguồn** — tên nguồn thật không ra ngoài hệ; mã quy ước
   được bảo vệ như lớp chắn bí mật.
2. **Collector hành vi gần người nhất** — giả thuyết nền: platform (website,
   group, Zalo) không thích trợ lý AI; mục tiêu là vận hành ít thay đổi, bền.
3. **Mỗi giai đoạn phục vụ 2 lớp người dùng** — người (GUI) và máy (API/MCP)
   — để vận hành ra quyết định liên tục.

Review theo best practices ngành (data engineering, SRE, privacy, API design)
→ chuẩn hoá tên gọi + bổ sung 2 lớp ngành bắt buộc mà tầm nhìn còn thiếu:
Data Quality/Observability và Backup/Recovery.

## Quyết định — 5 workstream xuyên suốt C1–C4

### 1. SPL — Source Pseudonymization Layer

Pseudonymization (GDPR Art. 4(5); ngành alternative-data: "Vendor A/B").
Ba tầng danh tính, mỗi tầng cho một đối tượng:

| Tầng | Giá trị | Ai thấy | Nơi sống |
|---|---|---|---|
| **A — Sự thật** | `airbnb-self`, `airdna`, `zalo`… | không ai ngoài máy local + role admin ở `/ops/sources` | raw zone, Postgres local, bảng `source_registry` |
| **B — Mã ổn định** | `S01`, `S02`… | máy (API/MCP), nội bộ serving | cột `source` mọi bảng serving, API response |
| **C — Nhãn ngữ nghĩa** | "Tự thu" / "Hiệu chuẩn" / "Cộng đồng" / "Địa giới mở" | người dùng GUI | i18n dict (vi/en), UI — không thấy tên thương hiệu |

Quy ước:
- **Mã gắn nguồn thực, ổn định vĩnh viễn** (lineage máy đọc được khi đổi vendor).
  **Nhãn gắn vai trò** — đổi vendor cùng vai trò → người dùng không thấy gì đổi
  (khớp "vai trò trôi" ADR-0005). Đổi nhãn công khai phải qua mini-ADR.
- `source_registry` (mapping A↔B + metadata vòng đời) **không commit, không
  sync cloud, không rời máy local**. Nguồn chết → mã `retired` vĩnh viễn,
  không tái sử dụng (trường `status`, `since`, `retired_at`).
- **Leak Gate trong CI**: job grep tên-thật trên mọi artifact rời máy (bundle
  Vercel, schema Supabase, API response snapshot, log) — fail CI nếu thấy.
- Tầng cloud-sync đổi tên bảng vendor sang trung tính (`airdna_*` →
  `ref_calib_*`…); cột `source` ở đó chỉ chứa mã B.
- `/ops/sources` là bảng giải mã duy nhất, gated `role=admin` (portals.md).
- Bảo mật qua che giấu ≠ access control: SPL chống lộ *tình cờ* (log, dump,
  screenshot, bundle), không chống kẻ đã có quyền admin.

### 2. CCP — Collection Conduct Policy

Politeness policy + low-signature OPSEC. Nguyên tắc nền: platform phát hiện
**chữ ký hành vi** (nhịp metronome, volume vượt người, identity rotation),
không phát hiện "AI". Mục tiêu: hành vi quan sát được không khác một người
dùng chấp nhận được.

1. **Cadence người**: jitter 2–15s giữa thao tác; trần volume/ngày; cửa sổ giờ
   hoạt động 19–23h; cron có randomized delay trong cửa sổ (systemd
   `RandomizedDelaySec` tương đương).
2. **Incremental trước tiên**: lịch 60 đêm gần fetch 2×/tuần, toàn bộ 1×/tháng
   — giảm khối lượng gốc thay vì che khối lượng.
3. **Một identity một nguồn**: persistent profile (đã có), không xoay, không
   đa tab song song.
4. **Chỉ đọc là mặc định**: agent Zalo event-driven đọc tin mới; tính năng
   "agent hỏi lại môi giới" để mức TẮT mặc định.
5. **Fail = lùi + báo**: exponential backoff with full jitter (AWS) — base
   30s × 2^n, trần 24h, reset khi thành công. Circuit breaker 3 trạng thái
   (Nygard): ≥3 block/24h → open; 1 probe sau 24h → half-open. Cảnh báo qua
   webhook (DCA), không tự xoay identity.
6. **Cấm mặc định**: anti-detect browser, fingerprint spoofing, xoay đa
   account — **loại khỏi hướng research** (đã sửa agent-swarm-vision.md).
   Một account thật, đọc chậm, không bao giờ đăng.
7. **Smoke test hằng ngày**: discovery 1 trang verify selector + số link —
   phát hiện markup đổi trong 24h.
8. **Credential registry**: chủ sở hữu, đường khởi phục, hạn subscription,
   lịch người-login-thật định kỳ. **Source risk register**: mỗi nguồn 1 dòng
   (điều khoản ToS đã biết, giới hạn tự đặt, tín hiệu cảnh báo, tần suất duyệt).
9. **PII**: số ĐT môi giới là personal data — tầng serving chỉ lưu **hash**
   cho dedup, không plaintext; raw giữ 24 tháng (data minimization ADR-0003).
10. **SLO vận hành**: collector chạy 4 tuần không đụng tay; đếm block/tháng
    làm chỉ số sức khoẻ (`/ops`).

### 3. DCA — Dual-Consumer Architecture

API-first + MCP. Quy tắc: **tính năng nào ra đời phải có cả GUI lẫn API/MCP
trong cùng phase** — không "API để sau".

- **OpenAPI 3 spec contract-first** ngày đầu; versioning `/api/v1/…`; MCP tool
  namespaced `oneinvest_*`; breaking change qua ADR.
- **RBAC role × scope**: `read:public` / `read:ops` / `ops:write` / `admin`;
  machine token tách riêng người dùng; bảng phân quyền ghi trong spec.
- **Audit log bắt buộc** mọi `ops:write`: token nào, lệnh gì, khi nào, kết quả
  (xem `/ops/audit`).
- **Idempotency-Key** (Stripe/IETF) cho mọi trigger collect/transform.
- **Health chuẩn SRE**: `/api/health` (liveness) + `/api/ops/metrics`;
  webhook payload versioned + retry + dead-letter.
- **Phạm vi: internal-first** (user + agent + teammate). Public read API =
  quyết định ADR riêng, không mặc định.

### 4. DQO — Data Quality & Observability

4 trụ (dbt tests / Great Expectations / Monte Carlo): **freshness, volume,
schema, distribution**.

- Test sau mỗi transform (`pipeline/sql/450_dq_checks.sql`): miền giá trị
  (occupancy 0–100%), volume bất thường (listings giảm >20% so snapshot
  trước), phân phối lệch (median ADR đổi >30%), khóa not-null.
- **Freshness SLO per nguồn**: discovery ≤8 ngày · listings ≤7 · offers ≤3 ·
  tham chiếu ≤35. Hiển thị cả GUI (footer trang Insight) lẫn API; vi phạm →
  webhook.
- Gốc: incident "ADR pha loãng bởi đêm thiếu giá" (4f3a65e) lẽ ra bị test
  phân phối bắt ngay — quy tắc: mỗi incident dữ liệu sinh ra đúng 1 test.

### 5. DR — Backup & Recovery

- `pg_dump` hằng tuần + rsync mã hoá raw zone sang đĩa ngoài.
- `source_registry` mapping + credentials vào macOS Keychain.
- **RPO 7 ngày / RTO 1 ngày** (quy mô cá nhân, chấp nhận bởi user).
- Drill khôi phục 1 lần ở C4 (kiểm chứng, không giấy tờ).
- `migrate-export.sh` là đóng gói chuyển máy, KHÔNG phải lịch backup.

## Threat model SPL (tóm tắt 1 trang)

- **Tài sản**: `source_registry` mapping, raw zone, credentials, audit log.
- **Đường lộ**: cloud DB sync (Supabase), bundle Vercel, API response, log,
  screenshot do người chia sẻ.
- **Actor**: người dùng công khai (chỉ thấy tầng C), teammate read-only
  (tầng C + mã B), bên thứ ba nếu cloud bị lộ (chỉ mã B + bảng trung tính).
- **Không bảo vệ**: thứ actor không với tới (raw local, mapping local) —
  ngoài backup và phân quyền file hệ thông thường.

## Lệch chuẩn có chủ đích

Chuẩn crawler truyền thống yêu cầu tự xưng danh (User-Agent, robots.txt).
CCP chủ động không theo. Lý do: bối trang cá nhân phi thương mại, platform
chặn bot "lịch sự" nhanh hơn chặn người dùng nặng; ranh giới tự đặt là
volume + chỉ-đọc thay vì tự xưng danh. Ghi nhận như lệch chuẩn được chấp
nhận — không khuyến khích nhân bản sang bối cảnh khác.

## Sửa đổi ADR-0006 (agent-report qua raw zone)

Diagram cũ của ADR-0006 vẽ `POST /agent-report → stg_zalo_posts` trực tiếp.
Sửa theo bất biến ADR-0003: agent-report **ghi raw snapshot theo
DATA-CONTRACT** (`source='zalo-agent'`, manifest + sha256) rồi mới transform
vào staging. Mất thêm 1 tầng ghi file; đổi lại re-parse được khi logic
extract đổi + audit được nguồn. ADR-0006 → accepted kèm sửa đổi này.

## Các quyết định chốt kèm (user, 2026-10-18)

1. Nhãn tầng C: "Tự thu / Hiệu chuẩn / Cộng đồng / Địa giới mở";
   `/phuong-phap` không nêu tên thương hiệu.
2. Anti-detect (Dolphin/Multilogin/fingerprint): LOẠI khỏi research.
3. API/MCP C4: internal-first; public read = ADR riêng.
4. PII số ĐT: hash cho dedup, không plaintext ở serving.
5. RPO 7 ngày / RTO 1 ngày.

## Hệ quả

- Mọi phase C1–C4 trong ROADMAP v3 có 5 cột workstream.
- `users` thêm cột `role` (`user`|`admin`) ở C1 — clearance law portals.md.
- Bảng `airdna_*` giữ nguyên ở local; đổi tên trung tính bắt đầu từ tầng
  cloud-sync (C4) kèm Leak Gate.

## Sửa đổi 2026-10-23 — định danh người bán là công khai

Mạnh chốt: người đăng tin rao bán đang làm hoạt động bán hàng/môi giới, nên **tên, SĐT, ID tài
khoản của người bán trên tin rao không tính là lộ danh tính** — chuyển từ tầng A sang **tầng C
(công khai)**. Thay mục 9 ở trên và câu «PII số ĐT: hash cho dedup, không plaintext ở serving».
Hash SĐT vẫn dùng làm khoá dedup xuyên nguồn.

Không đổi: tên nguồn thật (kể cả khi nằm trong giá trị như `seller_ref`, `listing_url`), hồ sơ
người dùng app, `user_events/user_profile`, `review_queue` vẫn là tầng A.

Hệ quả cần làm (việc riêng, không nằm trong sửa đổi này): nới `PII_EXCLUDE` của
`pipeline/sync-cloud.mjs` cho cột người bán, loại giá trị lộ tên nguồn thật khỏi `seller_ref`, và
quyết định có đưa liên hệ người bán trở lại cổng Invest công khai hay không (PR #3 vừa gỡ ngày 23/10).
Rủi ro đã nêu khi chốt: trong người bán có cả chủ nhà cá nhân; Nghị định 13/2023 coi SĐT cá nhân là
dữ liệu cá nhân.


## Sửa đổi 2026-10-24 — tên nhóm thu là công khai

Mạnh chốt (24/10, khi duyệt audit cổng Ops trên prod, mục OPS-6): **tên nhóm cộng đồng mà nguồn S03 thu (tên nhóm
như người dùng nền tảng thấy) là tầng C**, không phải tầng A. Tên nhóm được hiện trên `/ops/**` ở cloud, được đi qua
`ops_heartbeat` (payload của `pipeline/push-ops-facts.mjs`), và được làm ngữ cảnh cho agent. Dấu `data-tier-a` (che
khi chụp màn hình) bỏ khỏi cột tên nhóm.

Không đổi:
- **Tên nguồn thật vẫn là tầng A** (Mạnh giữ luật, cùng ngày): mọi bề mặt ngoài `/ops/sources` gọi nguồn bằng mã
  `S0x` kèm vai trò; nhãn job, nhãn ô KPI, tiêu đề bảng không mang tên thật. Giá trị nào trong tên hay khoá nhóm
  lộ tên nguồn thật (vd khoá nhóm là URL có tên miền nguồn) vẫn là tầng A.
- **Tên tài khoản thu** (tài khoản dùng để thu ở máy local) chưa chốt — vẫn xử như tầng A cho tới khi Mạnh quyết.
- Hồ sơ người dùng app, `user_events/user_profile`, `review_queue` vẫn là tầng A.

Hệ quả cần làm (việc riêng, ở lộ trình đợt `ops-noi-that-2410`): đặt/sửa tiêu đề chuẩn hoá và mô tả đặc trưng cho
từng nhóm trên `/ops`, agent đọc làm ngữ cảnh bậc H5 (ON19–ON21); bộ soát tầng A của NT2 cho phép tên nhóm.

## Sửa đổi 2026-10-26 — nội dung tin, ảnh và thẻ duyệt lên cloud cho vai ops

Mạnh chốt (25/10, `docs/research/ops-tu-van-hanh-nguon-saas.md` §3.7, PR #79) khi chọn để đội vận hành làm từ xa
trên cổng Ops ở cloud (ADR-0015). **Nội dung bài gốc, ảnh tin rao và thẻ duyệt `review_queue` lên cloud, không che,
cho vai `ops` trở lên.** **Tên nguồn thật vẫn chỉ ở máy thu.** Cloud hiện mã nguồn (vd `S08`, hoặc nhãn nguồn
«S08 · Danh mục dự án»). Máy thu hiện mã kèm tên thật (`S08-<tên thật>`).

**Tầng A, sau sửa đổi này, chỉ còn bốn thứ** (đây là danh sách đầy đủ):
1. tên nguồn thật, gồm `real_name`, `source_ids`, tên miền nguồn, và mọi giá trị mang chúng (khoá nhóm là URL có tên
   miền nguồn, `seller_ref`, `listing_url` chưa che…);
2. hồ sơ người dùng app: `users`/`sessions`, `user_events`, `user_profile`;
3. định danh tài khoản thu (trước đây «chưa chốt, xử như tầng A»; nay chốt là tầng A);
4. phiên đăng nhập, khoá API, ảnh QR, profile trình duyệt.

`review_queue` ra khỏi tầng A. Câu «`review_queue` vẫn là tầng A» trong hai sửa đổi 23/10 và 24/10 ở trên hết hiệu lực.

Ràng buộc đi kèm:
- **Chỉ vai `ops` trở lên đọc.** Anon và người dùng thường đọc 0 dòng (RLS cùng cổng route). Điều kiện trước: migration
  037 đã áp trên Supabase, xác nhận bằng `sync-cloud --kiem-anon` sạch. Thiếu điều kiện này thì không bảng nào của
  sửa đổi này lên cloud.
- **Che tên nguồn trước khi lên.** Nội dung bài đi qua bộ che `maskSourceNames` và bộ soát `pipeline/lib/tier-a-guard.mjs`
  (tên và tên miền nguồn đổi thành mã). Dòng nào soát đỏ thì không gửi.
- **Ảnh**: chỉ ảnh thu nhỏ (cạnh dài khoảng 800px, webp) vào bucket riêng tư, đọc bằng URL ký ngắn hạn. Ảnh gốc ở máy
  thu. Giữ ảnh của tin còn sống cộng 90 ngày. Trần khởi điểm 5 GB, cảnh báo ở 80% (§4.8 #3).
- **Chỉ ở `/ops/**`.** Nội dung bài, ảnh tin và thẻ duyệt không lên cổng Invest hay API công khai. Luật 5 giữ nguyên.
- **Leak gate không nới tay.** Cột hay bảng mới vào `CLOUD_ALLOW` đổi cùng hàng mang nó: TV9 cho bài và ảnh, TV13 cho
  thẻ duyệt. Mỗi lần đổi kèm soát tên nguồn. Tới lúc đó, luật gate hôm nay giữ nguyên: `review_queue` trên cloud phải
  rỗng; loại `listing_url`, `seller_*`, `properties.photos`.
- **Đường lên** chỉ qua `sync-cloud`/`push-ops-facts` có bộ soát (ADR-0014). Không dựng đường mới.
- **Tên nguồn thật đã có trong migration và tài liệu cũ** (012/014/021/022, ROADMAP, `docs/research/*`): chấp nhận như
  lịch sử, không mở hàng dọn (§4.8 #8). **Từ nay migration và tài liệu mới không thêm tên thật.** Seed `real_name`
  bằng script chạy ở máy thu.

Không đổi: ba tầng A/B/C và mã `S0x`; `/ops/sources` ở máy thu vẫn là bảng giải mã duy nhất (role admin); định danh
người bán trên tin rao và tên nhóm thu vẫn là tầng C (sửa đổi 23/10, 24/10). Threat model: đội vận hành (vai `ops`
trở lên) nay thấy cả nội dung tin và thẻ duyệt, ngoài mã B và tầng C; bên thứ ba khi cloud bị lộ cũng thấy chúng,
nhưng không thấy tên nguồn thật.

Hệ quả cần làm (hàng riêng, đợt `tu-van-hanh-2510`): TV9 (bài và ảnh lên cloud), TV10 (hồ sơ tin), TV13 (thẻ duyệt lên
cloud, quyết định đi xuống bằng lệnh `review.decide`).
