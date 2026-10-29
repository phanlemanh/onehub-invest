# dung-m2-song-song — dựng sẵn nguyên liệu M2 của design-floor (chưa bật)

Hàng P3 của đợt dieu-phoi-dot0-cam-mau, ý định `y-dinh-design-floor.md` mục 3 (Mạnh «Áp như đề xuất» 29/10, kế
hoạch MBP ở phanlemanh/acceptance-gate-kit#308). Kho đang thí điểm design-floor ở bậc M1; M2 chỉ bật sau 10 vòng
DO1 ở M1, bằng một hàng T1 riêng. Hàng này dựng sẵn ba thứ M2 cần để hàng T1 kia chỉ còn khai ba khoá.

## Kết quả

1. `scripts/design-floor/gen-tokens.mjs`: `app/src/app/globals.css` → `design/tokens.json` (DTCG).
2. `scripts/design-floor/gen-registry.mjs`: `components/ui` + `components/reui` + `.claude/skills/onehub-ui/catalog.md`
   → `design/component-registry.json` dạng `{version, components[]}`.
3. Skill `onehub-ui` buộc hồ sơ chạm giao diện viết `_acceptance/<slug>/reuse-plan.md` ở S1, theo khuôn của
   `ui reuse-plan check`.
4. Test ở `scripts/design-floor/*.test.mjs`; hai tệp sinh ra đọc được bằng `ui reuse-plan check` của bản gói
   `design-floor/dist/ui.mjs` (acceptance-gate 2.35.0).

Không khai `design_floor.*` vào `_acceptance/config.yaml`: khai là bậc lên M2 và `sinh_lai` chạy cuối S3 cả ở M1, làm
lẫn số 10 vòng DO1. Config chỉ thêm hai khoá executors để eval của hồ sơ trỏ được (giám sát duyệt P3-97).

## Bên đọc là kit — khuôn suy từ mã vendored

Đọc ở `design-floor/vendor/design-os/src` của acceptance-gate 2.35.0:

- `reuse-plan check` luôn nhận `--file <registry> --tokens <tokens> --json`, không tự dò (`HOP-DONG-NHAP.md` §4).
  `design/patterns/*.md` đọc theo cwd. Thoát 0 sạch, 2 có finding, 3 thiếu tệp, 4 sai cú pháp.
- Registry: `loadRegistry` chỉ đòi gốc đúng hai khoá `version` (chuỗi) + `components` (mảng); không kiểm từng bản ghi
  (mẫu tên `Nhóm/Tên` chỉ áp khi ghi bằng `ui registry register`). Bộ kiểm cần `name` là chuỗi; `category` khớp
  `/page|template|pattern|layout|screen/i` thì bản ghi là template (bậc 2 và dòng `Pattern:`); `variants` dùng ở bậc 4.
  Ghi thêm khoá ngoài danh sách cho phép (name, category, markup, tokensUsed, variants, states, description, status,
  scope, deprecated, figmaNode) là sai khuôn, nên registry chỉ dùng các khoá ấy.
- Token: `parseTokenFile` coi MỌI khoá gốc là một nhóm — không được có khoá gốc kiểu `$schema`. Lá phải có `$type`
  thuộc danh sách (color, dimension, fontFamily, …) và `$value`; nhóm lồng được làm phẳng nối bằng `-`. Bậc 6 tra
  `<nhóm>.<tên>` đúng hai đoạn. Chế độ tối theo quy ước `$extensions["mode.dark"] = { "$value": … }`.

## Lệnh một — tokens

130 khai báo của `globals.css`: 41 ở `:root`, 40 ở `.dark`, 49 ở `@theme inline` (40 cầu nối `--color-X: var(--X)` +
9 khai báo riêng). Không khai báo nào bị bỏ lặng:

| Khai báo | Thành |
|---|---|
| `:root --X` | lá `color.X` (`$type: color`), `$value` = giá trị sáng nguyên văn |
| `:root --radius` | lá `radius.base` (`$type: dimension`) |
| `.dark --X` | `$extensions["mode.dark"].$value` của lá đã có; biến chỉ có ở `.dark` → lỗi |
| `@theme --color-X: var(--X)` | cầu nối Tailwind: kiểm `--X` là token màu đã có; không ghi lá trùng |
| `@theme --radius-<n>` | lá `radius.<n>` (`dimension`) |
| `@theme --font-<n>` | lá `font.<n>` (`fontFamily`) |
| `@theme` khai báo khác | lỗi «chưa biết xếp» — thêm luật trước khi sinh |

- Giá trị giữ nguyên chuỗi: `oklch(…)`, `var(--color-red-800)`, `calc(var(--radius) * 0.6)`. Riêng giá trị trọn vẹn là
  `var(--Y)` mà `--Y` là token của chính tệp (hay cầu nối tới token) thì viết alias DTCG `{nhóm.tên}` (vd
  `radius.lg = {radius.base}`).
- Tên giữ phẳng như tên biến CSS (`color.chart-1`, `color.sidebar-primary-foreground`): JSON không cho một khoá vừa là lá
  vừa là nhóm (`card` cạnh `card-foreground`), nên lồng nhóm không phải lối sống.
- Thứ tự khoá theo thứ tự khai báo trong CSS; `JSON.stringify(…, null, 2)` + xuống dòng — sinh hai lần giống từng byte.
- Lỗi: thiếu khối `:root`/`.dark`/`@theme inline`, biến tối mồ côi, cầu nối trỏ token không có, khai báo `@theme` lạ →
  thoát 1, nêu tên biến, không ghi tệp.

## Lệnh hai — registry

| Nguồn | Tên | category | variants |
|---|---|---|---|
| `components/ui/<x>.tsx` | `ui/<x>` | `shadcn` | từ `cva(…variants…)` |
| `components/ui/svgs/<x>.tsx` | `ui/svgs/<x>` | `logo` | — |
| `components/reui/<x>.tsx` hoặc thư mục `reui/<x>/` | `reui/<x>` | `reui` | hợp các `cva` trong tệp/thư mục |
| catalog: ô đầu bảng block, mã `` `@reui/<b>` ``/`` `@mapcn/<b>` `` | nguyên văn `@reui/<b>` | `template` (kể cả ví dụ `c-*`) | — |
| catalog: bảng «Custom Components», ô đầu | tên định danh, tách theo ` / ` (`PageHeader`, `StatTiles`, `charts/*`) | `app` | — |

- Tên lấy đúng cách catalog và mã gọi chúng (`ui/switch`, `ui/empty`, `` `@reui/hero-8` ``), không đổi sang mẫu `Nhóm/Tên`:
  kit trả lời ở #308 «tên có số không phải đổi», và bộ kiểm chỉ đòi `name` là chuỗi.
- Thang dùng lại của kho «ReUI block → shadcn/ui → custom (LAST RESORT)» (`app/CLAUDE.md`) ánh lên thang 7 bậc của kit.
  Template (bậc 2, dòng `Pattern:`) là block mà trang được dựng từ đó — `routes.md` định nghĩa cột Block đích đúng như
  vậy và liệt cả block section (`hero-8`, `chart-6`) lẫn ví dụ `c-*` (`c-command-5`, `c-empty-11`). Component `ui/`,
  `reui/` và component của app = bậc 3; tự viết = bậc 7 `ds-new:`. Archetype của `routes.md` (Dashboard grid…) không vào
  registry ở vòng này.
- Cầu nối `@theme --color-X` không thành lá: Design OS đặt tên biến CSS từ đường token (`color.background` →
  `--color-background`), nên cầu nối chính là tên CSS của lá `color.X`; alias `color.color-X` sẽ ứng với biến
  `--color-color-X` không có.
- Block trong catalog mà tên trùng một component đã cài (`@reui/frame`, `@reui/filters`, `@reui/number-field`,
  `@mapcn/map`) không thành bản ghi thứ hai — bản ghi `reui/…`/`ui/…` đại diện.
- `description` = ô File của catalog (chỗ bản chuyển thể nằm), để người viết kế hoạch tìm ra tệp. `markup: ""`,
  `tokensUsed: []` (kit nhận). `version: "0.1.0"`. Sắp theo tên (so chuỗi thô, không theo locale); trùng tên giữ bản
  đầu.
- `variants` dạng `trục=giá trị` đúng như prop JSX (`variant=destructive`, `size=sm`). Bậc 4 viết
  `ui/button (variant=destructive)`.
- Lỗi: thiếu `catalog.md` hay thư mục `ui`/`reui`, catalog đọc ra 0 block hay 0 component app → thoát 1, không ghi tệp.

## Cả hai lệnh

`node scripts/design-floor/gen-<x>.mjs [--root <gốc>] [--check]`. Mặc định ghi tệp và in một dòng đếm. `--check` sinh
trong bộ nhớ, so từng byte với tệp đã commit: lệch hay vắng → thoát 1 nêu tệp và lệnh sinh lại. Hàng T1 bật M2 khai
`design_floor.sinh_lai` bằng hai lệnh ở chế độ ghi.

## Skill onehub-ui

- `SKILL.md`: mục mới «Kế hoạch dùng lại (`reuse-plan.md`)» — hồ sơ chạm giao diện PHẢI viết
  `_acceptance/<slug>/reuse-plan.md` ở S1, trước khi chọn block; khuôn `## Screen: <tên>` + `Pattern:` + bảng
  `| Slot | Rung | Use | Reason |`; bảng ánh thang kho → bậc kit; ví dụ mẫu đặt giữa hai marker; lệnh kiểm tay
  (`reuse-plan check` với `--file design/component-registry.json --tokens design/tokens.json`).
- `loop.md` bước 1–2: viết `reuse-plan.md` cùng kế hoạch 7 dòng; bậc 7 thì thêm dòng catalog khi xong.
- Ở M1, khối S1 của kit in «kế hoạch dùng lại: chưa khai nguồn — không kiểm»; kế hoạch vẫn phải có để 10 vòng M1
  quen khuôn, và hàng bật M2 không phải đổi skill.

## Đo

Test chạy bằng `node --test scripts/design-floor/*.test.mjs` (`executors.test.design_floor_gen`), không cần DB. Đường
tới `ui.mjs`: `DESIGN_FLOOR_UI` hoặc `~/.claude/plugins/cache/acceptance-gate-kit/acceptance-gate/2.35.0/design-floor/dist/ui.mjs`
(bản ý định nêu tên); vắng thì test đỏ, nêu đường đã tìm. Mỗi phép đo có cặp xanh/đỏ trên cùng vật: bản thật → xanh;
bản chép bị phá → đỏ với thông điệp ghim.

## Đặc tả UX

Bỏ — hàng không chạm giao diện (không tệp nào dưới `app/src`), xem dòng sổ descope.
