---
schema_version: 1
feature: dựng sẵn nguyên liệu M2 của design-floor (chưa bật) — lệnh sinh tokens DTCG + danh mục thành phần, skill onehub-ui buộc reuse-plan.md ở S1
slug: dung-m2-song-song
owner: phanlemanh@gmail.com
risk_tier: T2
surfaces: [cli]
status: implemented
veto_state: mo
veto_opened_at: 2026-10-29T04:12:04Z
approved_by:
approved_at:
design_doc: docs/superpowers/specs/2026-10-29-dung-m2-song-song-design.md
---

# Acceptance Contract: dung-m2-song-song

## Context

Căn cứ: hàng `dung-m2-song-song` (P3) của đợt dieu-phoi-dot0-cam-mau, ý định `y-dinh-design-floor.md` mục 3 (Mạnh «Áp như
đề xuất» 29/10; trả lời của kit ở phanlemanh/acceptance-gate-kit#308: tên có số không phải đổi, `markup: ""` được, oklch
nhận nguyên, nhóm lồng nối bằng `-`). Giám sát duyệt hàng (P3-96) và hai dòng executors trong `_acceptance/config.yaml`
(P3-97). Kho ở bậc M1; M2 bật bằng một hàng T1 riêng sau 10 vòng DO1.

## Criteria

- AC-1: Given `app/src/app/globals.css` trên main (41 khai báo `:root`, 40 `.dark`, 49 `@theme inline`), When chạy
  `node scripts/design-floor/gen-tokens.mjs --root .`, Then `design/tokens.json` là DTCG: mỗi biến `:root` một lá
  (`color.<tên>` `$type: color`, `--radius` → `radius.base` `$type: dimension`), mỗi biến `.dark` nằm ở
  `$extensions["mode.dark"].$value` của đúng lá đó, chín khai báo riêng của `@theme` thành `radius.<n>`/`font.<n>`, 40 cầu
  nối `--color-X: var(--X)` không thành lá trùng; giá trị `oklch(…)`/`var(--…)`/`calc(…)` giữ nguyên văn; đếm khớp
  41 + 40 + 9 + 40 = 130, không khai báo nào bị bỏ lặng; không có khoá gốc nào ngoài nhóm token.
- AC-2: Given cùng nguồn, When đọc `design/tokens.json`, Then giá trị trọn vẹn `var(--Y)` với `--Y` là token của tệp (hay cầu
  nối tới token) được viết alias `{nhóm.tên}` (`radius.lg` = `{radius.base}`), còn `var(--color-red-800)`/`var(--font-geist-sans)`
  giữ chuỗi; tên phẳng như biến CSS nên `color.chart-1`, `color.sidebar-primary-foreground`, `radius.base` tra được bằng
  `<nhóm>.<tên>` hai đoạn.
- AC-3: Given bản chép `globals.css` bị phá, When chạy lệnh tokens, Then thoát 1, không ghi tệp, thông điệp ghim từng ca:
  biến chỉ có ở `.dark` («--x chỉ có ở .dark»), cầu nối trỏ token không có («cầu nối --color-x trỏ --x không có»), khai báo
  `@theme` lạ («chưa biết xếp --x»), thiếu khối («thiếu khối :root»).
- AC-4: Given `app/src/components/ui` và `app/src/components/reui`, When chạy `node scripts/design-floor/gen-registry.mjs --root .`,
  Then `design/component-registry.json` có gốc đúng `{version, components}`; mỗi tệp `ui/<x>.tsx` một bản ghi `ui/<x>`
  (`shadcn`), mỗi tệp `ui/svgs/<x>.tsx` một bản ghi `ui/svgs/<x>` (`logo`), mỗi tệp hay thư mục con của `reui/` một bản ghi
  `reui/<x>` (`reui`); mỗi bản ghi có `name`, `category`, `markup: ""`, `tokensUsed: []` và chỉ khoá thuộc khuôn kit;
  `variants` là các cặp `trục=giá trị` của mọi `cva(… variants …)` trong tệp/thư mục (`ui/button` có `variant=destructive`,
  `size=sm`; tệp không có cva thì không có khoá `variants`).
- AC-5: Given `.claude/skills/onehub-ui/catalog.md`, When sinh registry, Then mỗi mã `` `@reui/<b>` ``/`` `@mapcn/<b>` `` ở ô đầu
  các bảng block (đếm trước: 36 dòng ở «ReUI Blocks», 10 ở «Cổng Ops»; 12 dòng «Custom Components» cho 15 tên) thành đúng một bản ghi tên nguyên văn (`category: template`,
  kể cả ví dụ `c-*`; `description` = đúng ô File của dòng),
  trừ mã trùng một component đã cài (`@reui/frame`, `@reui/filters`, `@reui/number-field`, `@mapcn/map` không thành bản ghi
  thứ hai); ô đầu bảng «Custom Components» tách theo ` / ` thành bản ghi `category: app`; tên không trùng nhau, sắp tăng
  dần theo so chuỗi thô.
- AC-6: Given bản chép kho bị phá, When chạy lệnh registry, Then thoát 1, không ghi tệp, thông điệp ghim: thiếu `catalog.md`
  («không đọc được catalog»), catalog không còn bảng block («catalog ra 0 block»), không còn bảng Custom Components
  («catalog ra 0 component app»), thiếu thư mục `reui` («thiếu thư mục app/src/components/reui»).
- AC-7: Given hai tệp sinh từ main, When chạy `ui reuse-plan check <plan> --file design/component-registry.json --tokens
  design/tokens.json --json` của bản gói `design-floor/dist/ui.mjs` (acceptance-gate 2.35.0) trên một kế hoạch dùng đủ bảy
  bậc (bậc 2 `@reui/hero-8`, bậc 3 `ui/button` và `StatTiles`, bậc 4 `ui/button (variant=destructive)`, bậc 5
  `reui/frame + ui/empty`, bậc 6 `color.chart-1, radius.base`, bậc 7 `ds-new:` có lý do, bậc 1 có lý do), Then thoát 0,
  0 finding; cùng kế hoạch đổi một ô thành tên bịa / biến thể không có / token không có / template là component → thoát 2
  với đúng mã `UNKNOWN_COMPONENT` / `BAD_VARIANT_VALUE` / `UNRESOLVED_TOKEN` / `RUNG2_NOT_TEMPLATE`.
- AC-8: Given hai tệp đã commit, When chạy hai lệnh với `--check`, Then thoát 0 khi tệp khớp nguồn; trên bản chép kho sửa
  một giá trị trong `globals.css` (hay xoá một tệp `ui/*.tsx`) → thoát 1 nêu tệp lệch và lệnh sinh lại; xoá tệp sinh → thoát
  1 «chưa có»; chạy chế độ ghi hai lần → hai tệp giống từng byte.
- AC-9: Given skill `onehub-ui`, When người làm UI đọc `SKILL.md` và `loop.md`, Then thấy luật: hồ sơ chạm giao diện PHẢI viết
  `_acceptance/<slug>/reuse-plan.md` ở S1 trước khi chọn block, khuôn `## Screen:` + `Pattern:` + bảng
  `| Slot | Rung | Use | Reason |`, bảng ánh thang kho «ReUI block → shadcn → tự viết» lên bảy bậc, cách đặt tên theo
  registry, lệnh kiểm tay; ví dụ mẫu giữa hai marker `<!-- REUSE-PLAN-MAU -->` qua `reuse-plan check` trên tệp sinh thật
  với 0 finding. (judgment cho lời luật; script cho ví dụ)
- AC-10: Given nhánh, When đọc `_acceptance/config.yaml` và chạy `design-floor-bac.mjs --root .` của kit 2.35.0, Then config
  không có khoá `design_floor` ở bất kỳ cấp nào, dòng bậc vẫn «bậc M1», và diff của `config.yaml` so với merge-base chỉ thêm
  đúng hai dòng `design_floor_gen`, `design_floor_fresh`.

## Coverage

- Bỏ coverage-scan (dòng sổ descope) — spec ngoài đã chốt phạm vi (ý định mục 3). Trục tự kê: nguồn token ×
  ba khối CSS (AC-1/2/3), nguồn registry × ba thư mục + hai loại bảng catalog (AC-4/5/6), bên đọc kit × bảy bậc (AC-7),
  độ tươi (AC-8), luật skill (AC-9), không bật M2 (AC-10).

## Đường đo

- Hồ sơ không có `opportunity.md` (hàng của đợt, không qua Cổng Đáng) — không có ngưỡng để đo.

## Out of scope

- Khai `design_floor.tokens`, `design_floor.registry`, `design_floor.sinh_lai` — hàng T1 riêng sau 10 vòng DO1 ở M1.
- `tokensUsed` thật và `markup` thật cho từng thành phần — kit nhận rỗng; điền là việc sau khi M2 chạy có số.
- Đổi tên thành phần sang mẫu `Nhóm/Tên` của Design OS — kit trả lời không phải đổi.
- Tệp `design/patterns/*.md` — template lấy từ bản ghi `category: template` của registry.
- Wire test vào CI (`ci-test.yml`) — tệp ngoài vùng hàng.

## Notes

- Ranh giới: `design/**`, `scripts/design-floor/**`, `.claude/skills/onehub-ui/**`; ngoài vùng chỉ hai dòng config đã duyệt
  (P3-97) và tài liệu quy trình (`docs/superpowers/`).
