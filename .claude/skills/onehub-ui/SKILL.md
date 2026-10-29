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
| mục «Kế hoạch dùng lại» dưới đây | `reuse-plan.md` bắt buộc ở S1: khuôn, thang 7 bậc, tên theo registry | mọi hồ sơ chạm giao diện, ở S1 |

## Kế hoạch dùng lại (`reuse-plan.md`) — bắt buộc ở S1

Hồ sơ nào chạm giao diện (`_acceptance/<slug>/` có tệp dưới `app/src/app/**` hay `app/src/components/**` trong vùng)
PHẢI viết `_acceptance/<slug>/reuse-plan.md` ở S1, cùng lúc với kế hoạch 7 dòng (`loop.md` bước 1), TRƯỚC khi chọn
block hay viết mã. Không phải gợi ý: thiếu tệp là S1 chưa xong. Kế hoạch ghi, cho từng ô của từng màn, bậc dùng lại
đầu tiên đứng được — đọc thang dưới từ trên xuống, dừng ở bậc đầu tiên đúng.

Khuôn (bên đọc là `ui reuse-plan check` của acceptance-gate):

- mỗi màn một mục `## Screen: <tên>`;
- một dòng `Pattern: <template>`, hoặc `Pattern: none — <lý do thật>`;
- một bảng bốn cột `| Slot | Rung | Use | Reason |`, mỗi ô một dòng.

| Bậc | Hỏi | Ở kho này ghi gì ở `Use` |
|---|---|---|
| 1 | Ô này có cần không? | `skip`, lý do thật ở `Reason` |
| 2 | Có block đã chuyển thể phủ trọn ô (hay cả màn)? | block của `catalog.md`, tên nguyên văn: `@reui/hero-8`, `@mapcn/store-locator`, kể cả ví dụ `@reui/c-empty-11` |
| 3 | Có thành phần đã cài, đúng tên? | `ui/<x>` (shadcn), `reui/<x>`, `ui/svgs/<x>` (logo), hay component của app trong bảng Custom Components (`StatTiles`, `PageHeader`) |
| 4 | Là một biến thể của thành phần bậc 3? | `ui/button (variant=destructive)` — trục và giá trị đúng như prop JSX |
| 5 | Ghép được từ các thành phần đã có? | `reui/frame + ui/empty` |
| 6 | Chỉ cần token trên một khối có sẵn? | `color.chart-1, radius.base` — đường `<nhóm>.<tên>` của `design/tokens.json` |
| 7 | Không bậc nào trên đứng được | `ds-new: <Tên>` + lý do; làm xong thì thêm dòng vào `catalog.md` (Custom Components) và chạy lại lệnh sinh registry |

Đây là thang «ReUI block → shadcn/ui → tự viết (cuối cùng)» của kho viết thành bảy bậc: block ReUI/mapcn ở bậc 2, mọi
thành phần đã cài ở bậc 3–5, tự viết ở bậc 7. Code gần đó trong app không phải căn cứ — chỉ thứ có tên trong
registry mới đứng được ở bậc 2–5.

Tên phải khớp nguyên văn một bản ghi của `design/component-registry.json` (sinh từ `components/ui`, `components/reui`
và `catalog.md` bằng `node scripts/design-floor/gen-registry.mjs`); token phải có trong `design/tokens.json` (sinh từ
`globals.css` bằng `node scripts/design-floor/gen-tokens.mjs`). Tệp sinh cũ hơn nguồn thì chạy lại lệnh sinh trước.

Mẫu (cũng là ca test của `scripts/design-floor/reuse-plan.test.mjs` — sửa mẫu thì test phải còn xanh):

<!-- REUSE-PLAN-MAU -->
```markdown
## Screen: Đã lưu
Pattern: @reui/wishlist-2

| Slot | Rung | Use | Reason |
|---|---|---|---|
| đầu trang | 3 | PageHeader | — |
| lưới khu vực | 2 | @reui/wishlist-2 | — |
| trống | 2 | @reui/c-empty-11 | — |
| nút bỏ lưu | 4 | ui/button (variant=ghost) | — |
| ô số RevPAR | 5 | reui/frame + StatTiles | — |
| dải bậc màu | 6 | color.chart-1, color.muted-foreground | — |
| nút chia sẻ | 7 | ds-new: Share sheet | registry chưa có hộp chia sẻ |
| quảng cáo | 1 | skip | sản phẩm không chạy quảng cáo |
```
<!-- /REUSE-PLAN-MAU -->

Kiểm tay (bản gói của acceptance-gate đang cài; thoát 0 sạch · 2 có lỗi · 3 thiếu tệp · 4 sai cú pháp):

```bash
node <acceptance-gate>/design-floor/dist/ui.mjs reuse-plan check _acceptance/<slug>/reuse-plan.md --file design/component-registry.json --tokens design/tokens.json
```

Hôm nay kho ở bậc M1 của design-floor: khối S1 của kit in «kế hoạch dùng lại: chưa khai nguồn — không kiểm», tức máy
chưa chấm tệp này. Kế hoạch vẫn bắt buộc — người duyệt đọc nó ở Cổng Phạm vi, và khi kho bật M2 (khai
`design_floor.tokens`/`registry` sau 10 vòng thí điểm M1) S1 sẽ chạy đúng lệnh trên mà skill không phải đổi.

## Hex chỉ được dùng trong file bản đồ (danh sách đóng)

MapLibre không đọc được biến CSS hay oklch, nên chỉ 5 file sau được dùng hex. `eslint.config.mjs`
chỉ tắt `onehub-ui/no-hardcoded-color` cho đúng 5 file này, mọi luật khác vẫn chạy:

- `src/lib/map-style.ts`
- `src/components/finder/bins.ts`
- `src/components/finder/choropleth-map.tsx`
- `src/components/mini-map.tsx`
- `src/components/listing/listings-map.tsx`

Bản đồ mới dựng bằng `@mapcn/map` (`components/ui/map.tsx`), nền đi qua `lib/map-style.ts` (prop `styles`),
popup là `MapPopup` của mapcn (nội dung React, tự thoát chuỗi); bản đồ MapLibre tay cũ thì popup `setDOMContent` +
`textContent` (`catalog.md` § Bản đồ nền). Muốn thêm file vào danh sách thì phải sửa cả `eslint.config.mjs`
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
