# DESIGN RULES — Bắt buộc cho mọi AI Coding Agent

> **NGUYÊN TẮC VÀNG**: ReUI block tồn tại? → DÙNG NÓ. Không tồn tại? → shadcn/ui
> base. Cả hai không có? → THEN tạo mới (theo ReUI patterns).

## Quy trình chọn component (THEO THỨ TỰ, KHÔNG BỎ BƯỚC)

```
┌─────────────────────────────────────────────┐
│  Cần UI element mới                         │
└─────────────────┬───────────────────────────┘
                  ▼
┌─────────────────────────────────────────────┐
│  B1: ReUI block có sẵn không?              │
│  → Check danh sách blocks bên dưới          │
│  → Check https://reui.io/blocks             │
│                                              │
│  CÓ → npx shadcn@latest add @reui/<name>   │
│       → Customize props/colors/data         │
│       → DONE ✅                             │
└─────────────────┬───────────────────────────┘
                  │ KHÔNG
                  ▼
┌─────────────────────────────────────────────┐
│  B2: shadcn/ui base component?             │
│  → button, card, dialog, dropdown, etc.    │
│  → npx shadcn@latest add <name>            │
│                                              │
│  CÓ → Install + compose                    │
│       → DONE ✅                             │
└─────────────────┬───────────────────────────┘
                  │ KHÔNG
                  ▼
┌─────────────────────────────────────────────┐
│  B3: Tạo mới (LAST RESORT)                 │
│  → Follow ReUI patterns (see below)         │
│  → Add to this inventory                   │
│  → Note WHY no ReUI block was suitable     │
└─────────────────────────────────────────────┘
```

## REUI BLOCKS — Danh sách available (2004 items, tên ĐÃ XÁC MINH 2026-10)

> **QUAN TRỌNG — CÁCH TÌM BLOCK ĐÚNG:**
> ```bash
> # Liệt kê 100 item đầu (có paging)
> npx shadcn@latest search @reui
> npx shadcn@latest search @reui --offset 100   # trang 2, 3...
>
> # Lọc theo nhu cầu (grep từ khóa)
> npx shadcn@latest search @reui --offset 200 | grep -E "c-chart|c-data-grid"
> ```
> **Quy ước tên**: `c-<component>-N` = demo 1 pattern (charts, cards, grids...),
> `<category>-N` = trang hoàn chỉnh (app-shell, auth, blog...), tên trần = UI primitive.

### Charts (`c-chart-1` → `c-chart-25`, 25 blocks) — DÙNG THAY VÌ custom Recharts

| Nhu cầu | Block | Mô tả |
|---------|-------|-------|
| Timeseries area (revenue, ADR, occupancy) | `@reui/c-chart-16` | Area chart with glowing dot markers |
| Timeseries + forecast | `@reui/c-chart-17` | Forecast line with stripe pattern zone |
| Gradient area | `@reui/c-chart-13` | Gradient area with stripe overlay |
| Stacked area | `@reui/c-chart-14` | Stacked area, dashed strokes |
| Bar (ADR by size, room type) | `@reui/c-chart-2` | Multi-dataset bar chart |
| Bar gradient | `@reui/c-chart-7` | Gradient bar chart |
| Donut (revenue split) | `@reui/c-chart-19` | Donut chart with center total |
| Donut + stats | `@reui/c-chart-20` | Donut with center stats |
| Pie | `@reui/c-chart-21` | Pie with stripe patterns |
| Radar | `@reui/c-chart-23` | Radar with gradient fill |
| Radial gauge (Market Score) | `@reui/c-chart-25` | Lighthouse radial with labels |

### Stats & Cards (`c-card-*`) — DÙNG THAY VÌ custom KPI cards

| Nhu cầu | Block | Mô tả |
|---------|-------|-------|
| KPI card + trend + menu | `@reui/c-card-15` | Stat card with trend and overflow menu |
| Expandable usage card | `@reui/c-card-13` | Expandable billing usage card |
| Status summary | `@reui/c-card-14` | Deployment status summary card |
| Card + actions | `@reui/c-card-16` | Card with header badge and actions |

### Data Grids (`c-data-grid-1` → `c-data-grid-34`, 34 blocks) — DÙNG THAY VÌ custom tables

| Nhu cầu | Block | Mô tả |
|---------|-------|-------|
| Table phường sortable | `@reui/c-data-grid-11` | Sortable columns |
| Phân trang | `@reui/c-data-grid-1` | Pagination |
| Search + filter | `@reui/c-data-grid-34` | Server-side pagination, sorting, search, filter |
| Row selection | `@reui/c-data-grid-7` | Row selection |
| Expandable rows | `@reui/c-data-grid-8` | Expandable rows |
| Summary footer | `@reui/c-data-grid-25` | Summary stats footer |
| Infinite scroll | `@reui/c-data-grid-27` | Local infinite scroll |
| Virtual hóa (data lớn) | `@reui/c-data-grid-32` | Column virtualization |

### Layout / App Shell (`app-shell-1` → `app-shell-27+`)

| Nhu cầu | Block | Mô tả |
|---------|-------|-------|
| Dashboard + sidebar | `@reui/app-shell-1` | Icon-collapsible sidebar + workspace switcher |
| SOC/analytics console | `@reui/app-shell-26` | Top bar + section pills + Cmd+K |

### Auth (`auth-1` → `auth-20`)

| Nhu cầu | Block |
|---------|-------|
| Login email+password | `@reui/auth-1` |
| Magic link | `@reui/auth-3` |
| Đăng ký | `@reui/auth-5` |

### AI & Agents (Agent Swarm UI tương lai)

| Nhu cầu | Block | Mô tả |
|---------|-------|-------|
| Agent activity feed | `@reui/agent-activity-2` | Narrates an agent run |
| Agent task wrap-up | `@reui/agent-activity-5` | Finished task card |
| AI spend monitor | `@reui/ai-usage-1` | Token usage ruler |

### Cards khác

| Nhu cầu | Sử dụng |
|---------|----------|
| List card | `@reui/c-card-*` series |
| Timeline | `@reui/c-accordion-11` (onboarding steps) |

## REUI PATTERNS — Khi tạo component mới

Nếu BƯỚC B3 (tạo mới), PHẢI follow các patterns sau:

### 1. File structure
```
src/components/custom/
└── <component-name>.tsx
```

### 2. Import pattern
```tsx
"use client";  // Nếu có interactivity
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
```

### 3. Styling pattern (Tailwind utility classes ONLY)
```tsx
// ✅ ĐÚNG — Tailwind utilities
<div className="rounded-lg border border-neutral-200 bg-white p-4">

// ❌ SAI — custom CSS
<div style={{ borderRadius: '8px', border: '1px solid #e5e5e5' }}>
```

### 4. Color tokens (CSS variables, không hardcode)
```tsx
// ✅ ĐÚNG — semantic tokens
<div className="bg-primary text-primary-foreground">

// ❌ SAI — hardcoded hex
<div className="bg-[#2563eb] text-white">
```

### 5. Component size pattern
```tsx
// Prefer composition over monolith
<Card>
  <CardHeader>...</CardHeader>
  <CardContent>...</CardContent>
</Card>

// ❌ Không tạo 1 giant component chứa tất cả
```

## ⚠️ BASE-NOVA — BẪY LỚN NHẤT (đã gặp 2026-10)

ReUI ship **2 biến thể** cho mọi item: **Base UI** và **Radix UI**, chọn qua
`{style}` trong URL registry. Project này dùng **`base-nova`** (Base UI).

- ✅ `components.json` → `"style": "base-nova"` → primitives import từ `@base-ui/react/*`
- ❌ `"style": "new-york"` → Radix → block ReUI báo lỗi TS `Property 'render' does not exist`
  (block dùng prop `render`/`indeterminate`/`alignItemWithTrigger` — chỉ Base UI có)

**Nếu gặp TS errors như trên → kiểm tra `"style"` trong `components.json` trước khi sửa code.**

## CẤU TRÚC SAU INSTALL

```
src/components/
├── examples/          # Block demo (c-chart-16.tsx, c-card-15.tsx...)
│                      # → COPY pattern từ đây vào feature component
├── reui/              # Component tái sử dụng (reui/data-grid/*, reui/badge...)
│                      # → IMPORT TRỰC TIẾP trong app code
└── ui/                # Primitives Base UI (button, card, dropdown-menu...)
                       # → IMPORT TRỰC TIẾP, KHÔNG SỬA
```

## COMPONENT INVENTORY — Đã cài + tự tạo

### ReUI Blocks (installed 2026-10-17)
| Block | File | Dùng cho | Ghi chú |
|-------|------|----------|---------|
| `@reui/c-chart-16` | examples/c-chart-16.tsx | Timeseries revenue/ADR/occupancy | Area + glowing dots |
| `@reui/c-chart-2` | examples/c-chart-2.tsx | Bar so sánh city/room-type | Multi-dataset |
| `@reui/c-chart-19` | examples/c-chart-19.tsx | Donut phân bổ revenue | Center total |
| `@reui/c-card-15` | examples/c-card-15.tsx | KPI card + trend | Có overflow menu |
| `@reui/c-data-grid-11` | examples/c-data-grid-11.tsx | Bảng phường sortable | + reui/data-grid/* engine |
| `@reui/app-shell-30` | blocks/app-shell-30/ (bản gốc, tham chiếu) → **components/shell/** (bản dùng) | Shell mọi cổng: top bar, nav, ⌘K, account | Cài 2026-10-18 (P0). Nav khai báo ở `shell/nav.tsx` |
| `@reui/c-command-5` | examples/c-command-5.tsx → shell/search-command.tsx | ⌘K tìm tỉnh/phường | cmdk, tìm không dấu qua `keywords` |
| `@reui/c-alert-1` | examples/c-alert-1.tsx → states/page-error.tsx | Trạng thái lỗi + Thử lại | `error.tsx` |
| `@reui/c-empty-3` | examples/c-empty-3.tsx → states/not-found-state.tsx | 404 | `not-found.tsx` |

### shadcn/ui Base (installed)
| Component | File | Note |
|-----------|------|------|
| Card | components/ui/card.tsx | Wrapper cho metrics |
| Button | components/ui/button.tsx | Actions |
| cn() | lib/utils.ts | Tailwind merge utility |

### Custom Components (created — LAST RESORT only)
| Component | File | Why not ReUI? |
|-----------|------|---------------|
| MiniMap | components/mini-map.tsx | ReUI không có MapLibre blocks |
| FinderMap | components/finder-map.tsx | Same — MapLibre choropleth |
| AirdnaCompare | components/airdna-compare.tsx | Domain-specific (đối chiếu 2 nguồn) — sẽ dời sang /ops/quality (IA R1) |
| SiteFooter | components/shell/site-footer.tsx | ReUI không có block footer |
| PageSkeleton | components/states/page-skeleton.tsx | Ghép từ `ui/skeleton` theo bố cục Insight; dùng trong `<Suspense>`, KHÔNG làm `loading.tsx` cấp segment (mất mã 404/307) |

## PROHIBITED (TUYỆT ĐỐI KHÔNG)

1. ❌ Tạo custom chart component khi ReUI chart block có sẵn
2. ❌ Tạo custom table khi @reui/data-grid-* có sẵn
3. ❌ Hardcode màu hex khi Tailwind tokens có sẵn
4. ❌ Viết custom CSS khi Tailwind utilities đủ dùng
5. ❌ Tạo component > 200 dòng (tách nhỏ)
6. ❌ Không import ReUI block trong server component (blocks cần "use client")
7. ❌ Commit .env.local (chứa REUI_LICENSE_KEY)

## INSTALL COMMANDS (copy-paste)

```bash
# Luôn chạy từ app/ directory
cd app

# Install ReUI block (cần license key trong .env.local)
npx shadcn@latest add @reui/<block-name>

# Install shadcn base component
npx shadcn@latest add <component-name>

# Examples:
npx shadcn@latest add @reui/c-chart-16
npx shadcn@latest add @reui/c-card-15
npx shadcn@latest add @reui/c-data-grid-11
npx shadcn@latest add button card dialog
```

## VERIFY sau khi install

```bash
# 1. Build không lỗi
npm run build

# 2. Import hoạt động
# Data grid engine: import { DataGrid } from "@/components/reui/data-grid/data-grid"
# Pattern demo:     xem src/components/examples/c-chart-16.tsx

# 3. Update DESIGN_RULES.md inventory (thêm block mới vào bảng)
```
