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

## REUI BLOCKS — Danh sách available

### Charts (52 blocks) — DÙNG THAY VÌ custom Recharts

| Nhu cầu | Block | Install |
|---------|-------|---------|
| Timeseries (revenue, ADR, occupancy) | chart-area-* | `@reui/chart-area-interactive` |
| Bar chart (ADR by size, room type) | chart-bar-* | `@reui/chart-bar-multiple` |
| Line chart (multi-metric trends) | chart-line-* | `@reui/chart-line-multiple` |
| Pie/donut (revenue distribution) | chart-pie-* | `@reui/chart-pie-donut-text` |
| Sparkline (inline KPI) | sparkline-* | `@reui/chart-sparkline-area` |
| Radial (gauge, score) | radial-* | `@reui/chart-radial-shape` |
| Sankey (data flow) | sankey-* | `@reui/chart-sankey` |
| Composed (bar + line combo) | composed-* | `@reui/chart-composed-*` |

### Dashboard & Stats (25 blocks) — DÙNG THAY VÌ custom KPI cards

| Nhu cầu | Block | Install |
|---------|-------|---------|
| 4-column KPI strip | card-stats-01 | `@reui/card-stats-01` |
| Single metric + trend | card-metric-01 | `@reui/card-metric-01` |
| Sidebar dashboard layout | sidebar-07 | `@reui/sidebar-07` |
| Navbar/header | navbar-* | `@reui/navbar-01` |
| Settings page | settings-01 | `@reui/settings-01` |
| Kanban board | kanban-01 | `@reui/kanban-01` |

### Data Tables (Grid) — DÙNG THAY VÌ custom tables

| Nhu cầu | Block | Install |
|---------|-------|---------|
| Sortable/filterable table | data-grid-filter | `@reui/data-grid-filter` |
| Editable table | data-grid-edit | `@reui/data-grid-edit` |
| Virtualized (large data) | data-grid-virtual | `@reui/data-grid-virtualized` |
| Column grouping | data-grid-group | `@reui/data-grid-grouping` |

### Auth (Login/Signup)

| Nhu cầu | Block | Install |
|---------|-------|---------|
| Login page | auth-login-01 | `@reui/auth-login-01` |
| Signup page | auth-signup-01 | `@reui/auth-signup-01` |
| Forgot password | auth-forgot-01 | `@reui/auth-forgot-01` |

### AI & Agents

| Nhu cầu | Block | Install |
|---------|-------|---------|
| AI chat interface | ai-chat-01 | `@reui/ai-chat-01` |
| Agent activity feed | agent-activity-01 | `@reui/agent-activity-01` |

### Cards (43 blocks) — General purpose

| Nhu cầu | Sử dụng |
|---------|----------|
| Metric card | @reui/card-* series |
| Comparison card | @reui/card-metric-* series |
| List card | @reui/card-list-* series |
| Timeline | @reui/timeline-* series |

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

## COMPONENT INVENTORY — Đã cài + tự tạo

### ReUI Blocks (installed)
| Block | File | Used in | Note |
|-------|------|---------|------|
| _(chưa cài — chạy setup trước)_ | | | |

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
| AirdnaCompare | components/airdna-compare.tsx | Domain-specific (đối chiếu 2 nguồn) |

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
npx shadcn@latest add @reui/chart-area-interactive
npx shadcn@latest add @reui/card-stats-01
npx shadcn@latest add @reui/data-grid-filter
npx shadcn@latest add button card dialog
```

## VERIFY sau khi install

```bash
# 1. Build không lỗi
npm run build

# 2. Import hoạt động
# Trong component/page: import { ChartAreaInteractive } from "@/components/reui/chart-area-interactive"

# 3. Update DESIGN_RULES.md inventory (thêm block mới vào bảng)
```
