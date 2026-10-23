---
name: onehub-ui
description: "Chuẩn UI riêng của onehub-invest, là lớp mỏng nằm trên skill ReUI chính chủ. Dùng cho MỌI việc UI trong app/ (Invest Portal /vn/**, Ops Portal /ops/**, trang chủ, đăng nhập): thêm hoặc sửa trang, vùng, bảng, ô KPI, biểu đồ, form, trạng thái tải/trống/lỗi, màu, chữ tiếng Việt, dọn chỗ tự vẽ tay, design pass. Nạp SAU skill `reui`. Skill này giữ những gì ReUI không biết về app: bản đồ route → bề mặt → archetype, danh mục block đã chuyển thể, màu dữ liệu, chữ tiếng Việt, vòng làm việc và bước nhìn."
---

# onehub-ui

Lớp mỏng của repo, đặt trên ReUI. Ở đây chỉ có những gì ReUI không biết về app này. Luật bố
cục, màu, motion, spacing và chữ chung đều nằm trong skill `reui`; file này trỏ về đó, không chép lại.

## Thứ tự thẩm quyền

1. **Luật bất biến của `AGENTS.md`**: cổng Invest/Ops (`docs/architecture/portals.md`), SPL
   (UI chỉ ghi mã `S0x`), số AirDNA chỉ ở `/ops/quality`, metrics tính sẵn phía server.
2. **Skill `reui`** (`.claude/skills/reui/SKILL.md`), gồm style đã cài: `components.json`
   giữ `"style": "base-nova"`, `--primary` neutral. Không đổi style hay theme.
3. **`onehub-ui`** (skill này): chỉ bổ sung cho ReUI, không ghi đè.
4. **`acceptance-gate:ux-ui-craft`**: chỉ còn vai sàn a11y. Chỗ nào vênh với ReUI thì ReUI thắng.

Khi hai tầng mâu thuẫn, tầng trên thắng. Ghi chỗ lệch ở dòng 5 của hand-back.

## Đọc theo thứ tự

1. `reui` trước: `SKILL.md`, rồi `rules/compose.md` trước khi dựng màn hình. Tới bước Check thì
   đọc `rules/quality.md` và `rules/anti-patterns.md`.
2. Sau đó mới tới các file của skill này, theo bảng dưới. Chỉ đọc file mà việc đang làm cần đến.

## Mục lục file tham chiếu

| File | Nội dung | Đọc khi |
|---|---|---|
| `routes.md` | mỗi `page.tsx` một dòng: route → bề mặt → archetype → họ khung, cộng ghi chú PageHeader | trước khi viết kế hoạch 7 dòng cho một trang; khi thêm, xoá hay dời route (máy kiểm, xem dưới) |
| `catalog.md` | block gốc → file đang dùng → chỗ đã đổi; bảng "Một loại UI, một cách làm"; component tự viết; bản đồ nền MapLibre | trước khi gọi MCP `search`/`compose_page`; trước khi tạo component mới |
| `data-color.md` | bậc p30/p60/p90 (`finder/bins.ts`, `page/tiers.ts`), màu biểu đồ | khi tô màu theo số liệu: bản đồ, chú giải, thanh, badge bậc, chuỗi biểu đồ |
| `copy-vi.md` | `lib/format.ts`, đơn vị, ngân sách chữ, giọng trạng thái trống/lỗi, "đang thu thập", bẫy `"use client"` | khi hiện số, viết nhãn/nút/tiêu đề, viết trạng thái trống/lỗi; khi trang server import từ file client |
| `loop.md` | vòng 8 bước, từ kế hoạch tới bước nhìn, kết bằng 5 dòng hand-back | mỗi lần bắt đầu một việc UI |

## Hex chỉ được dùng trong file bản đồ (danh sách đóng)

MapLibre không đọc được biến CSS hay oklch, nên chỉ 5 file sau được dùng hex. `eslint.config.mjs`
chỉ tắt `onehub-ui/no-hardcoded-color` cho đúng 5 file này, mọi luật khác vẫn chạy:

- `src/lib/map-style.ts`
- `src/components/finder/bins.ts`
- `src/components/finder/choropleth-map.tsx`
- `src/components/mini-map.tsx`
- `src/components/listing/listings-map.tsx`

Bản đồ mới thì nền đi qua `lib/map-style.ts`, popup dùng `setDOMContent` + `textContent`
(`catalog.md` § Bản đồ nền). Muốn thêm file vào danh sách thì phải sửa cả `eslint.config.mjs`
lẫn đoạn này trong cùng PR, kèm lý do.

## Không đụng vendor

- `src/components/ui/**`, `src/components/reui/**`, `src/components/blocks/**` và
  `src/components/examples/**` là code vendor: không sửa tay, luật onehub-ui không quét (luật lint của Next vẫn áp dụng cho `ui/` và `examples/`). Muốn đổi thì
  chép sang thư mục feature rồi chuyển thể ở đó (lint áp dụng cho bản chép).
- Trước khi tạo hay đổi một route, kiểm nhánh chưa merge có đang dời/sửa trang đó không
  (`git for-each-ref refs/heads` + `git diff --name-only main...<nhánh>`); có thì hỏi phiên điều phối.
- Component tự tạo > 200 dòng thì tách nhỏ. File lớn có sẵn do đợt dọn B3 xử lý (ROADMAP §4 Track 6), không ép số lên file cũ.
- Block ReUI cần `"use client"`: không import thẳng vào server component. Ghép ở client component rồi truyền dữ liệu qua props (bẫy hằng số/hàm ở `copy-vi.md`).

## Máy chặn

- `cd app && npm run lint` (ESLint + `check-bare-disables`) chạy ở CI `ui-lint`; hook Stop lint các file UI vừa đổi.
- Baseline `app/eslint-suppressions.json` chỉ được giảm: sửa xong vi phạm cũ thì `npx eslint . --prune-suppressions`.
- Không dùng `eslint --suppress-all` / `--suppress-rule` để làm xanh lint: CI chặn khi baseline tăng (`check-baseline-growth`); sửa vi phạm hoặc dùng ngoại lệ có lý do.
- Ngoại lệ phải viết đúng dạng `// eslint-disable-next-line onehub-ui/<luật> -- <lý do>`. Thiếu lý do thì lint đỏ.
- Palette có chủ đích thì để cặp sáng/tối trong CÙNG một chuỗi class (`"text-violet-600 dark:text-violet-400"`), vì luật xét từng chuỗi riêng.
- Route chưa có dòng trong `routes.md` thì `npm run test:lint-rules` đỏ (`tests/routes-map.test.mjs`).
