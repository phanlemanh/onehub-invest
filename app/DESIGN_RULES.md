# DESIGN RULES — con trỏ

Nguồn luật UI là hai skill, không phải file này:

- `.claude/skills/reui/` — luật ReUI (vendor, do installer quản lý; không sửa tay).
- `.claude/skills/onehub-ui/` — route map, danh mục block/component, màu dữ liệu, chữ VN,
  vòng làm việc. Danh mục block đã cài + component tự tạo: `onehub-ui/catalog.md`.

Thứ tự thẩm quyền: ReUI > onehub-ui > ux-ui-craft. Trước khi sửa UI nạp `reui` rồi `onehub-ui`.

## BASE-NOVA — bẫy lớn nhất (đã gặp 2026-10)

ReUI ship **2 biến thể** cho mọi item: **Base UI** và **Radix UI**, chọn qua `{style}` trong
URL registry. Project này dùng **`base-nova`** (Base UI).

- ✅ `components.json` → `"style": "base-nova"` → primitives import từ `@base-ui/react/*`
- ❌ `"style": "new-york"` → Radix → block ReUI báo lỗi TS `Property 'render' does not exist`
  (block dùng prop `render`/`indeterminate`/`alignItemWithTrigger` — chỉ Base UI có)

Gặp lỗi TS như trên → kiểm tra `"style"` trong `components.json` trước khi sửa code.

## Lệnh cài

```bash
cd app                                         # luôn chạy từ app/
npx shadcn@latest search @reui                 # tìm block (không có MCP thì dùng lệnh này)
npx shadcn@latest search @reui --offset 100    # trang 2, 3... (mỗi trang 100 item)
npx shadcn@latest add @reui/<name> --yes       # cài block ReUI (cần license trong .env.local)
npx shadcn@latest add <name>                   # cài component shadcn base
```

Cài xong: thêm dòng vào `onehub-ui/catalog.md`, chạy `npm run lint` và `npm run build`.
