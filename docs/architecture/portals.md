# Chuẩn hoá Cổng thông tin (Portal Standard) — One Invest

> Tài liệu chuẩn hoá: phân vai các cổng giao diện, quy định đặt tên route và
> thuật ngữ. Mọi trang/màn hình mới PHẢI khai báo portal của nó theo tài liệu này.
> Ngày chuẩn hoá: 2026-10-17. Quy trình: Framing → Phân tích → Đánh giá → Hoàn thiện.

---

## 1. FRAMING — Đặt khung vấn đề

**Câu hỏi gốc**: One Invest cần bao nhiêu cổng giao diện, cho ai, với ranh giới nào?

**Hiện trạng (khảo sát route thật 2026-10-17)**:

| Route | Nội dung | Khán giả thực tế |
|---|---|---|
| `/` | Trang link farm (trộn VN + legacy Bangkok + internal) | không rõ ràng |
| `/vn` | Xếp hạng thị trường VN (AirDNA crosswalk) | nhà đầu tư |
| `/vn/hanoi` | Market Insight Hà Nội | nhà đầu tư |
| `/th/bangkok/map` | Market Finder (choropleth) | nhà đầu tư (legacy) |
| `/[country]/[market]/[submarket]` | Insight cấp phường | nhà đầu tư |
| `/listing/[id]` | Chi tiết listing | nhà đầu tư |
| `/saved`, `/login` | Đăng nhập, thị trường đã lưu | nhà đầu tư |
| `/design` | ReUI Gallery | **nội bộ/dev** — đang nằm chung không gian công khai |

**Vấn đề**: mọi bề mặt UI đang sống trong MỘT không gian URL phẳng, trộn lẫn
3 loại khán giả có job hoàn toàn khác nhau:

1. **Người dùng cuối** (nhà đầu tư) — cần *đọc và quyết định*: tìm thị trường,
   xem insight, so sánh yield. Chỉ cần read-only, công khai, đẹp, dễ hiểu.
2. **Đội vận hành dữ liệu** (chính là ta, hiện 1-2 người; sau này + Agent Swarm) —
   cần *giữ dữ liệu chảy*: theo dõi collector, pipeline, chất lượng dữ liệu,
   agent chạy đúng không. Cần auth, mật độ thông tin cao, không cần "đẹp" theo
   chuẩn marketing.
3. **Máy/agent** (tương lai) — cần API/contract, không phải UI.

Khi G4 (Zalo thật) và Agent Swarm (ADR-0006) hoạt động, nếu UI vận hành (trạng
thái collector, hoạt động agent, chi phí token) nằm chung không gian người dùng
cuối → rò rỉ thông tin nội bộ, điều hướng rối, và ngôn ngữ thiết kế bị kéo lẫn.

**Nguyên tắc khung**: tách cổng theo **khán giả × job × mức nhạy cảm dữ liệu**,
không tách theo tính năng. Một tính năng (ví dụ "số listing") xuất hiện ở mọi
cổng nhưng mỗi cổng trình bày đúng job của khán giả đó.

---

## 2. PHÂN TÍCH — Gom bề mặt theo khán giả

### Nhóm A — Người dùng cuối (đọc, quyết định)

| Bề mặt | Hiện có | Trạng thái |
|---|---|---|
| Market **Finder** (khám phá: list + map xếp hạng) | `/vn`, `/th/bangkok/map` | ✅ đã có |
| Market **Insight** (chiều sâu 1 thị trường) | `/vn/hanoi`, submarket | ✅ đã có |
| Listing detail (drill-down) | `/listing/[id]` | ✅ G0-d |
| **Yield** (so sánh STR vs giá bán) | mock G1 | 🔨 đang xây |
| Saved markets + Auth | `/saved`, `/login` | ✅ đã có |

Đặc điểm: công khai, read-only, SEO được, ngôn ngữ thiết kế ReUI "insight"
(chart + KPI card).

### Nhóm B — Vận hành dữ liệu (giữ dữ liệu chảy)

| Bề mặt | Hiện có | Trạng thái |
|---|---|---|
| Collection monitor (collector chạy khi nào, bao nhiêu listing, lỗi gì) | CLI/log | ❌ chưa có UI |
| Pipeline health (transform, rollup, point-in-polygon có sạch không) | script | ❌ |
| Data quality (ph cobertura/phường, divergence tự-thu vs AirDNA) | docs audit | ❌ |
| **Agent Swarm monitor** (agent đang làm gì, permission, chi phí token) | ADR-0006 | ❌ G4 |
| Source calibration (AirDNA đối chiếu, license) | G2 | ❌ |
| ReUI Gallery | `/design` | ✅ nhưng sai chỗ (công khai) |

Đặc điểm: bắt buộc auth, mật độ cao kiểu console, ngôn ngữ thiết kế ReUI "SOC"
(`app-shell-26`, `agent-activity-*`, `ai-usage-*` — đã có sẵn trong DESIGN_RULES).

### Nhóm C — Quản trị hệ thống (accounts, keys, billing)

Hiện chỉ có 1-2 người, chưa có nhu cầu thật. **Không dựng trước** — gom tạm vào
Nhóm B với quyền `admin`. Tách sau khi có ≥2 role thật sự khác nhau.

---

## 3. ĐÁNH GIÁ — So sánh phương án

| Tiêu chí | A. Giữ nguyên 1 không gian | B. 2 app tách riêng | **C. 1 app, 2 namespace route** ✅ |
|---|---|---|---|
| Tách khán giả | ❌ trộn lẫn | ✅ | ✅ |
| Ranh giới bảo mật | ❌ `/design` đang lộ | ✅ | ✅ middleware chặn `/ops/**` |
| Chi phí vận hành (1-2 người) | ✅ | ❌ 2 CI, 2 deploy, 2 env | ✅ 1 repo, 1 deploy |
| Tái dùng db/lib/design system | ✅ | ❌ phải extract package | ✅ |
| Mở rộng Agent Swarm UI | ❌ không có nhà cho nó | ✅ | ✅ `/ops/agents` |
| Deploy riêng từng cổng sau này | — | ✅ sẵn | ✅ tách dần được (route group → app riêng) |

**Kết luận**: phương án C — một Next.js app, hai **namespace route cấp 1** với
layout + nav + auth tách biệt. Khi nào Ops Portal phình to (có team ops thật)
mới tách thành app riêng, không mất gì vì URL đã có ranh giới sẵn.

---

## 4. HOÀN THIỆN — Đề xuất cổng chuẩn hoá

### Cổng 1 — INVEST PORTAL (cổng đầu tư)

- **Khán giả**: nhà đầu tư (công khai, read-only).
- **IA chi tiết, shell, block ReUI**: xem `invest-portal-ia.md` (đề xuất 2026-10-18).
- **URL**: giữ nguyên pattern đẹp hiện có — KHÔNG thêm prefix.
- **Cấu trúc**:

| Route | Tên hiển thị (VI) | Chức năng |
|---|---|---|
| `/` | Trang chủ | giới thiệu + vào Finder |
| `/vn` | Thị trường Việt Nam | **Finder** dạng list (xếp hạng theo score) |
| `/vn/[market]/map` | Bản đồ thị trường | **Finder** dạng map (choropleth) |
| `/vn/[market]` | Insight thị trường | KPI + chart + Top phường + so AirDNA |
| `/vn/[market]/[submarket]` | Insight phường/quận | drill-down |
| `/listing/[id]` | Chi tiết listing | calendar + giá |
| `/yield` | So sánh Yield | STR vs giá bán (G1→G4) |
| `/saved` | Đã lưu | auth |
| `/login` | Đăng nhập | auth |

- **Thuật ngữ cố định trong portal** (bắt buộc dùng thống nhất trong UI):
  `Finder` = chế độ khám phá/rồi hẹp; `Insight` = trang chi tiết một khu vực;
  `Listing`; `Market Score`; `ADR`; `Occupancy`; `Yield`.

### Cổng 2 — OPS PORTAL (cổng vận hành dữ liệu)

- **Khán giả**: đội vận hành dữ liệu + vận hành Agent Swarm. **Bắt buộc đăng nhập.**
- **URL prefix**: `/ops/**` — middleware chặn redirect `/login?next=…`.
- **Cấu trúc dự kiến** (xây dần theo G-roadmap, chưa dựng trước):

| Route | Tên hiển thị (VI) | Chức năng | Giai đoạn |
|---|---|---|---|
| `/ops` | Tổng quan vận hành | health tổng + KPI thu thập | G0-e+ |
| `/ops/collections` | Thu thập dữ liệu | lịch chạy collector, kết quả, lỗi | G0-e |
| `/ops/pipeline` | Pipeline | transform/rollup chạy chưa, số liệu | G3+ |
| `/ops/quality` | Chất lượng dữ liệu | coverage phường, divergence vs AirDNA | G2+ |
| `/ops/agents` | Agent Swarm | agent đang làm gì, permission, chi phí | G4 |
| `/ops/sources` | Nguồn dữ liệu | AirDNA license/sync, nguồn mới | G2+ |
| `/ops/design` | Thư viện thiết kế | ReUI Gallery (dời từ `/design`) | ngay |

- **Shell thiết kế**: `@reui/app-shell-26` (SOC console) + `agent-activity-*`,
  `ai-usage-*` cho `/ops/agents`.

### Cổng 3 — ADMIN (dự phòng, CHƯA dựng)

Chỉ tách khi có ≥2 role thật (ví dụ ops người vs sysadmin). Khi đó gom các trang
accounts/keys/billing từ Ops ra `/admin/**`. Ghi nhận ở đây để tránh tranh cãi sau.

---

## 5. QUY ĐỊNH (bắt buộc với mọi AI coding agent & con người)

1. **Mọi trang mới phải khai báo portal.** Không biết thuộc cổng nào → dừng và
   hỏi, đừng tự chen route vào `/`.
2. **URL**: ASCII kebab-case không dấu; giữ pattern `/[country]/[market]/…`
   cho Invest Portal; `/ops/<tính-năng-số-nhiều>` cho Ops. Danh từ số nhiều
   cho collection (`/ops/collections`), số ít cho detail (`/listing/abc`).
3. **Auth**: `/ops/**` = middleware auth + (sau này) role `ops`. Mọi thứ dưới
   `/vn/**`, `/listing/**` mặc định công khai. Không route nội bộ nào được nằm
   ngoài `/ops`.
4. **Nav tách riêng**: Invest Portal không hiển thị link Ops trong nav chính
   (chỉ footer dạng "Nội bộ"). Ops nav không trỏ về trang marketing.
5. **Đặt tên hiển thị**: code/URL tiếng Anh; UI tiếng Việt theo bảng thuật ngữ
   Mục 4 (Finder/Insight giữ nguyên tiếng Anh vì là thuật ngữ sản phẩm).
6. **Chuyển `/design` → `/ops/design`** trong lần refactor kế tiếp (cùng middleware).
7. **Cập nhật tài liệu này** mỗi khi thêm portal/section mới; ADR mới chỉ cần
   khi thay đổi quyết định phân cổng (phương án C), không cần cho từng trang.
8. **Legacy `/th/**`** (Bangkok) thuộc Invest Portal, giữ nguyên không đầu tư
   thêm; quyết định xoá bằng ADR riêng.

---

## 6. BẢNG ÁNH XẠ NHANH (tra khi đặt tên)

| Bạn đang làm gì? | Cổng | Route bắt đầu bằng |
|---|---|---|
| Cho nhà đầu tư xem số liệu | Invest | `/vn/…`, `/listing/…`, `/yield` |
| Theo dõi/điều hành thu thập & agent | Ops | `/ops/…` |
| Xem trước component ReUI | Ops | `/ops/design` |
| Thêm API cho agent/máy | (chưa chuẩn hoá — ADR riêng) | `/api/…` |
