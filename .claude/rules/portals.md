---
paths:
  - "app/src/app/**"
  - "app/src/components/shell/**"
  - "app/src/proxy.ts"
---

# Cổng giao diện (docs/architecture/portals.md)

- Trang mới phải thuộc đúng một cổng. Không biết thuộc cổng nào → dừng và hỏi user.
  - **Invest Portal**: `/`, `/vn/**`, `/listing/**`, `/yield`, `/so-sanh`, `/saved` — công khai, đọc là chính.
  - **Ops Portal**: `/ops/**` — bắt buộc đăng nhập (`proxy.ts` + `ops/layout.tsx`); trang
    quản trị (giải mã tên nguồn, tài khoản Zalo) gated `role = 'admin'`.
- Không route nội bộ nào nằm ngoài `/ops`. Invest nav không có link Ops (chỉ footer "Nội bộ").
- Thêm trang → thêm mục vào `components/shell/nav.tsx` cùng commit, và cập nhật bảng trong `portals.md`.
- IA Ops: mỗi trang trả lời một câu hỏi. Quan sát (đọc số) ở Thu thập/Chất lượng; quản trị
  (ghi cấu hình) ở Nguồn. Liên kết chéo, không nhân bản component/query.
- Invest Portal không hiển thị số AirDNA và không hiển thị tên nguồn thật — chỉ nhãn tầng C
  (`lib/source-labels.ts`). Ops dùng mã `S0x`.
- URL ASCII kebab-case không dấu; UI tiếng Việt; thuật ngữ sản phẩm giữ nguyên: Finder, Insight,
  Listing, ADR, Occupancy, Yield.
- Mọi trang `export const dynamic = "force-dynamic"`; chọn block ReUI trước (app/DESIGN_RULES.md).
