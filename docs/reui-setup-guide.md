# ReUI.io Setup Guide for One Invest

Ngày: 2026-10-18 · Pro plan $250/năm

## ReUI là gì

Commercial **Shadcn registry** — 654+ Pro blocks (charts, dashboards, data grids,
auth, AI chat) install qua `npx shadcn@latest add @reui/<name>`. Code được copy
trực tiếp vào project (không phải npm dependency) → AI coding agent đọc được
và customize được.

## Tech Stack Compatibility

| ReUI yêu cầu | One Invest hiện tại | Cần nâng cấp? |
|---|---|---|
| React 19 | React 19 (Next.js 16) | ✅ Đã có |
| Tailwind CSS v4 | Tailwind CSS v4 | ✅ Đã có |
| shadcn/ui | Chưa có | ⚠️ Cần init |
| Base UI hoặc Radix UI | Chưa có | ⚠️ Cài kèm shadcn |

## Setup Steps

### Bước 1: Init shadcn/ui trong app/

```bash
cd ~/dev/one-invest/app
npx shadcn@latest init
# Chọn: Default style, Neutral color, CSS variables = yes
# ⚠️ SAU ĐÓ SỬA "style" thành "base-nova" (Bước 2)
```

### Bước 2: Thêm ReUI registry với Pro key

> **QUAN TRỌNG**: `"style"` phải là **`base-nova`** (biến thể Base UI của ReUI).
> Nếu dùng `"new-york"`/`"default"` → primitives thành Radix → block ReUI báo
> lỗi TS `Property 'render' does not exist`. ReUI ship 2 biến thể cho mọi item,
> chọn qua `{style}` trong URL. Project này chuẩn = Base UI.

```bash
# Tạo .env.local (nếu chưa có) hoặc append
echo "REUI_LICENSE_KEY=YOUR_KEY_HERE" >> .env.local

# Sửa components.json
cat > components.json << 'EOF'
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "base-nova",
  "rsc": true,
  "tsx": true,
  "tailwind": {
    "config": "",
    "css": "src/app/globals.css",
    "baseColor": "neutral",
    "cssVariables": true
  },
  "aliases": {
    "components": "@/components",
    "utils": "@/lib/utils",
    "ui": "@/components/ui",
    "lib": "@/lib",
    "hooks": "@/hooks"
  },
  "registries": {
    "@reui": {
      "url": "https://reui.io/r/{style}/{name}.json",
      "headers": {
        "Authorization": "Bearer ${REUI_LICENSE_KEY}"
      }
    }
  }
}
EOF
```

### Bước 3: Install blocks cho One Invest Dashboard (tên ĐÃ XÁC MINH 2026-10)

```bash
# TÌM BLOCK (2004 items, có paging):
npx shadcn@latest search @reui                  # 100 item đầu
npx shadcn@latest search @reui --offset 200     # trang 3...

# Quy ước tên: c-<component>-N (pattern demo), <category>-N (trang hoàn chỉnh)

# Charts (timeseries)
npx shadcn@latest add @reui/c-chart-16   # Area + glowing dots — revenue/ADR timeseries
npx shadcn@latest add @reui/c-chart-2    # Multi-dataset bar — ADR by size/room type
npx shadcn@latest add @reui/c-chart-19   # Donut center total — revenue split

# Stats / KPI cards
npx shadcn@latest add @reui/c-card-15    # Stat card + trend + overflow menu

# Data tables
npx shadcn@latest add @reui/c-data-grid-11   # Sortable columns
npx shadcn@latest add @reui/c-data-grid-34   # Server-side pagination+search+filter

# Layout
npx shadcn@latest add @reui/app-shell-1  # Dashboard sidebar shell

# Auth
npx shadcn@latest add @reui/auth-1  # Login page
```

Sau install: demo pattern nằm ở `src/components/examples/`, engine tái sử dụng
ở `src/components/reui/` (import trực tiếp), primitives Base UI ở `src/components/ui/`.

## Mapping: One Invest UI → ReUI Blocks

| One Invest hiện tại | ReUI block thay thế | Lợi ích |
|---|---|---|
| KpiStrip (4 cards) | @reui/c-card-15 ×4 | Trend indicators, overflow menu |
| MetricChart (Recharts) | @reui/c-chart-16 | Tooltip, gradient, dots |
| BenchmarkBar (chips) | @reui/c-card-15 | Progress, delta % |
| TopSubmarkets (table) | @reui/c-data-grid-11 | Sort, filter, pagination |
| TopListings (table) | @reui/c-data-grid-11 | Same |
| MiniMap (MapLibre) | Keep MapLibre (reui không có map) | — |
| YieldCard (table) | @reui/c-data-grid-8 (expandable) | Inline details |
| AuthBar + login | @reui/auth-1 | Polished, accessible |

## CLAUDE.md Section cho AI Agents

Thêm vào `app/CLAUDE.md`:

```markdown
## ReUI Design System (Pro $250/yr)

### Registry
- Namespace: `@reui`
- Install: `npx shadcn@latest add @reui/<block-name>`
- License key: `REUI_LICENSE_KEY` in `.env.local` (never commit)

### Available Blocks (installed in this project)
| Block | Location | Used for |
|-------|----------|----------|
| @reui/chart-area-interactive | components/reui/chart-area-interactive.tsx | Revenue/ADR timeseries |
| @reui/chart-bar-multiple | components/reui/chart-bar-multiple.tsx | ADR by size |
| @reui/card-stats-01 | components/reui/card-stats-01.tsx | KPI strip |
| @reui/data-grid-filter | components/reui/data-grid-filter.tsx | Top Submarkets |

### Design Tokens (Tailwind v4 CSS variables)
- Semantic colors: --destructive, --info, --success, --warning, --invert
- Chart colors: --chart-1 through --chart-5
- Font: Geist Sans/Mono (from next/font)

### Patterns
- Charts use Recharts (same as current) but with ReUI wrappers
- All blocks are client components ("use client")
- Import from `@/components/reui/<name>`
- Customize by modifying the installed code (it's yours after install)

### Don't
- Don't re-install blocks that are already in components/reui/
- Don't commit .env.local (contains REUI_LICENSE_KEY)
- Don't import reui components in server components (they need "use client")
```

## Vì sao ReUI tốt cho AI Coding Agents

1. **Code inline** — components install vào project, AI đọc và modify trực tiếp
2. **Consistent patterns** — cùng Tailwind v4 + React 19 + shadcn conventions
3. **654 blocks** — AI chọn đúng block cho đúng use case (lookup table)
4. **CLAUDE.md guides** — AI biết block nào có sẵn, import từ đâu
5. **shadcn CLI** — AI chạy lệnh install mới khi cần thêm block

## Kiến trúc đề xuất

```
app/
├── src/
│   ├── components/
│   │   ├── ui/           # Base shadcn components (button, card, etc.)
│   │   ├── reui/         # ReUI installed blocks (chart-area, data-grid, etc.)
│   │   ├── dashboard/    # One Invest custom (area-page, kpi-strip, etc.)
│   │   └── maps/         # MapLibre components (mini-map, finder-map)
│   ├── lib/
│   │   ├── queries.ts    # DB queries (unchanged)
│   │   ├── format.ts     # Currency/number formatting (unchanged)
│   │   ├── auth.ts       # Auth (unchanged)
│   │   └── utils.ts      # shadcn cn() utility
│   └── app/              # Next.js routes (unchanged)
├── components.json       # shadcn + reui registry config
└── .env.local            # REUI_LICENSE_KEY (gitignored)
```
