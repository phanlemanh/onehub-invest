# Bối cảnh sản phẩm — onehub-invest (One Invest)

> Một trang cho agent và người mới: sản phẩm là gì, cho ai, đang ở đâu. Chỉ tóm tắt và trỏ nguồn —
> chi tiết, số liệu và quyết định nằm ở tài liệu được trỏ. Từ vựng: `CONTEXT.md` ở gốc repo.
> Trạng thái và quyết định đã chốt: `docs/ROADMAP.md` (§1 hiến pháp, §3 quyết định).
> **Mục đích, mục tiêu, thước đo: `docs/product/FRAMING.md`** (Mạnh duyệt 23/10) — đọc trước trang này.

## 1. Người dùng

- **Nhà đầu tư bất động sản Việt Nam** — người chọn nơi mua để cho thuê ngắn hạn, cho thuê dài
  hạn hoặc chờ tăng giá. Họ đọc số và quyết định; sản phẩm công khai, chỉ đọc.
- **Đội vận hành dữ liệu** — 1–2 người cùng hai agent (ZCode thu thập, Claude Code phần còn lại)
  giữ dữ liệu chảy và duyệt đề xuất của máy.
- **Máy/agent** — đọc qua API (`data-api/`, `/api/v1/*`), không qua UI.

Nguồn: `docs/architecture/portals.md` §1–2 · `AGENTS.md` "Phân làn hai agent".

## 2. Pipeline đầu tư 4 giai đoạn (north star)

1. **Chọn thị trường** — thị trường/phường nào hợp chiến lược (dòng tiền ngắn hạn, dài hạn,
   tăng giá, lai): Finder, Insight.
2. **Chọn căn** — tin rao nào rẻ hơn thước giá cùng phường: Căn giá tốt (hiện chỉ ở Ops; FRAMING D4: tin P1
   hiện công khai).
3. **Chi phí, vốn, dòng tiền** — mua + nội thất + vay → dòng tiền, lợi suất: Ước tính lợi suất,
   Mô phỏng đầu tư.
4. **Quản lý danh mục** — lợi nhuận dòng tiền, tăng giá; định giá lại định kỳ từ căn so sánh: chưa có
   (FRAMING §2.2 thay cho «khai thác sau mua»).

Mỗi tính năng mới phải nói nó phục vụ giai đoạn nào. Đơn vị phân tích là **căn nhà** ("Một Căn
Nhà"); nguồn chỉ là bằng chứng.

Nguồn: `docs/research/investment-pipeline-4-stages.md` · `docs/ROADMAP.md` §1.7.

## 3. Thị trường đang phủ

- Phạm vi: **chỉ Việt Nam** (Bangkok đã xoá — ADR-0008). Cây khu vực: quốc gia → thị trường
  (tỉnh/thành) → phường; cấp huyện không còn từ 07/2025.
- Listing cho thuê ngắn hạn tự thu: Hà Nội và TP.HCM. Tin rao bán/thuê và thước giá: tập trung Hà
  Nội. Thị trường khác hiện trạng thái "đang thu thập", không mượn số AirDNA.
- Số liệu hiện tại (số tin, số căn, độ phủ thước giá) luôn đọc ở `docs/ROADMAP.md` §2.5 — trang
  này không chép số.

Nguồn: `docs/adr/0008-remove-thailand-scope.md` · `docs/research/multi-market-data-plan.md` · `docs/ROADMAP.md` §2.5.

## 4. Hai cổng

| Cổng | Cho ai | URL | Luật |
|---|---|---|---|
| Invest | nhà đầu tư, công khai, chỉ đọc | `/`, `/[country]/…`, `/listing/…`, `/yield`, … | không số AirDNA, không tầng A |
| Ops | đội vận hành, bắt buộc đăng nhập (role ops/admin hoặc `OPS_EMAILS`) | `/ops/**` | mỗi trang trả lời một câu hỏi; quản trị chỉ admin |

Không route nội bộ nào nằm ngoài `/ops`. Bản đồ route → trang: `.claude/skills/onehub-ui/routes.md`.

Nguồn: `docs/architecture/portals.md` · `docs/architecture/invest-portal-ia.md`.

## 5. Nguồn dữ liệu và SPL

- Bảy nguồn gọi bằng mã **S01–S07** (cho thuê ngắn hạn, hiệu chuẩn, nhóm nội bộ, bản đồ, nhóm
  mạng xã hội, rao vặt công khai, sàn BĐS). Bảng mã ↔ trạng thái: `docs/ROADMAP.md` §2.3.
- Dòng chảy một chiều: nguồn → snapshot thô (bất biến) → `stg_*` → canonical (`sale_offers`,
  `listings`) → căn nhà → chỉ số tính sẵn → app/data-api chỉ đọc.
- **Bậc giá**: P1 giá nội bộ (nhóm khép, kèm SĐT) là tín hiệu; P2 giá công khai là thước đo.
- **SPL** (ADR-0007): tầng A (tên nguồn thật, SĐT, hồ sơ cá nhân) không rời máy local; tầng B
  (mã S0x) cho API và Ops; tầng C (nhãn "Tự thu", "Hiệu chuẩn") là thứ duy nhất lên cổng Invest.
- **AirDNA chỉ để hiệu chuẩn** (ToS): số của nó chỉ ở `/ops/quality`.

Nguồn: `docs/adr/0007-collector-operating-principles.md` · `docs/adr/0011-reso-first-data-law.md` ·
`collector/docs/DATA-CONTRACT.md` · `docs/research/data-sources.md` · `AGENTS.md` "Luật bất biến".
