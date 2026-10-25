---
schema_version: 1
feature: Tick bật nhóm trên /ops/sources luôn ghi requireMention true, và bộ ghi cấu hình OpenClaw từ chối mọi bản cấu hình phạm bất biến bộ canh trước khi ghi
slug: nhom-moi-requiremention
owner: phanlemanh@gmail.com
risk_tier: T3      # an toàn Zalo (luật 8): ghi ~/.openclaw/openclaw.json, gateway nạp nóng < 1 giây
surfaces: [api]
status: draft
approved_by:
approved_at:
---

# Acceptance Contract: nhom-moi-requiremention

## Context

`setZaloGroupEnabled` (`app/src/lib/zalo-admin.ts`) dựng nhóm CHƯA có trong cấu hình bằng
`{ enabled, requireMention: false }`. Tick bật một nhóm mới trên `/ops/sources` vì thế ghi `requireMention:false` vào
`~/.openclaw/openclaw.json`; gateway nạp nóng cấu hình trong chưa tới 1 giây, còn bộ canh L3b
(`scripts/zalo-watchdog.sh`) chỉ bắt sau tối đa 5 phút rồi KILL gateway — khoảng hở đó đủ cho agent turn. Khớp chuỗi
sự cố 22/10 (`docs/ops/runtime-map.md` mục «Fix ĐÃ LÀM», ý 3: ba nhóm mới `requireMention=false` → agent turn 17:59 →
KILL L3b 20:44–20:59). Lý do cũ của `false` («monitor: nhận cả tin không nhắc bot») đã hết: từ bản port pluginHooks
22/10, hook nhận tin SAU admission, TRƯỚC mention gate.

Việc: (1) nhóm do UI thêm hay bật lại luôn `requireMention: true`, ở mọi bố cục tài khoản; (2) bộ ghi cấu hình chạy
một hàm kiểm thuần — cùng bất biến L2/L3/L3b của bộ canh, thêm `groupPolicy` — TRƯỚC khi ghi; vi phạm thì không ghi,
trả lỗi; (3) test đơn vị.

Mọi phép đo chạy trên cấu hình chép trong thư mục tạm (`HOME`/`PATH` giả, openclaw giả ghi argv vào nhật ký giả) —
không bao giờ đọc/ghi `~/.openclaw`, không chạy `openclaw` thật, không gọi route ghi trên dev server, không restart
gateway (`.claude/rules/zalo-safety.md`).

Source input: prompt — phiên audit «Ops tự vận hành nguồn kiểu SaaS» (25/10), phát hiện §1.

## Criteria

- AC-1: Given cấu hình giả có nhóm `group:moi` CHƯA có ở đâu, ở bốn bố cục — `default` có `accounts.default` kèm `groups` riêng; `default` có `accounts.default` KHÔNG có `groups` riêng (đang kế thừa `groups` cấp channel); `default` layout cũ (`groups` cấp channel, không `accounts`); `acc2` có `groups` riêng —, When gọi `setZaloGroupEnabled(<tài khoản>, "group:moi", true)`, Then tệp cấu hình giả có `group:moi` = đúng `{ enabled: true, requireMention: true }` ở đúng chỗ của bố cục đó, VÀ tập `enabledGroups` hiệu dụng (`listZaloAccounts()`) của MỌI tài khoản trước và sau chỉ khác đúng ở `group:moi` của tài khoản được thao tác — KHÔNG tài khoản nào mất nhóm kế thừa, KHÔNG tài khoản khác nhận `group:moi`; chiều đỏ: bản sao `zalo-admin.ts` dựng nhóm mới với `requireMention: false` và gỡ bước kiểm → tệp nhận `requireMention:false`, ca đỏ nêu «nhóm mới requireMention false».
- AC-2: Given nhóm có sẵn `{ enabled: false, requireMention: false }`, nhóm có sẵn `{ enabled: false }` (thiếu khoá `requireMention`) và nhóm có sẵn mang thêm khoá khác, ở cả `default` lẫn `acc2`, When bật lại từng nhóm, Then mỗi nhóm có `enabled: true` VÀ `requireMention: true`, mọi khoá khác giữ nguyên giá trị; chiều đỏ: bản sao chỉ đặt `enabled` khi bật lại (và gỡ bước kiểm) → nhóm giữ `requireMention:false`, ca đỏ nêu «bật lại giữ false».
- AC-3: Given cấu hình sạch có nhóm `{ enabled: true, requireMention: true }`, và cấu hình đang phạm ĐÚNG MỘT chỗ là nhóm `X` `{ enabled: true, requireMention: false }`, When tắt nhóm có sẵn, tắt một nhóm chưa có, và tắt `X`, Then cả ba lần ghi thành công: nhóm có sẵn thành `enabled: false`, `requireMention` giữ `true`; nhóm chưa có được thêm `{ enabled: false, requireMention: true }`; cấu hình sau khi tắt `X` sạch — tắt đúng nhóm đang phạm là đường thoát của người vận hành; mỗi lần ghi để lại đúng một tệp `.bak-<ms>` mới.
- AC-4: Given hàm kiểm thuần xuất từ `zalo-admin.ts` và ma trận cấu hình viết trước, When gọi hàm trên từng cấu hình, Then cấu hình sạch trả danh sách rỗng; mỗi ca vi phạm trả ít nhất một vi phạm mang đúng nhãn lớp — `L2` (`bindings` có 1 entry; `bindings` là `{}`, `""`, `null`) · `L3` (`channels.zalo` có mặt) · `L3b` (mọi ca kèm `requireMention` sai: `requireMention` `false` với `enabled` `true`, vắng, `null`, `0`, `"false"`; `{ allow: false, requireMention: false }`; thiếu khoá `requireMention`; chuỗi `"true"`; ở `groups` cấp channel khi không có `accounts`, ở `groups` cấp channel khi MỌI tài khoản có `groups` riêng, và ở `accounts.<id>.groups`) · `groupPolicy` (khác `"allowlist"` ở cấp channel; ở một tài khoản) · `hỏng` (`channels` là mảng, `zalouser` là chuỗi, `accounts.<id>` là `null`, `groups` là mảng, mục nhóm là chuỗi) — vi phạm L3b nêu id nhóm, hàm không bao giờ ném; không vi phạm (should-NOT-fire): nhóm `enabled: false` có `requireMention: false`, `bindings` vắng, `bindings: []`, `groupPolicy` vắng ở cả channel lẫn tài khoản.
- AC-5: Given MỌI cấu hình của ma trận AC-4 (cả ca sạch, sát ranh, hỏng) ghi ra tệp trong thư mục tạm, When chạy hàm kiểm và đoạn kiểm của bộ canh — biểu thức đếm `bindings` của L2 và khối python L3/L3b, trích lúc chạy từ `scripts/zalo-watchdog.sh` (khối giữa `<< 'EOF'` và `EOF`), không bao giờ chạy cả script — trên cùng tệp, Then mọi tệp bộ canh phán vi phạm (kể cả python thoát khác 0 hay có traceback) thì hàm kiểm cũng phán vi phạm (hàm kiểm được chặt hơn, không được lỏng hơn), và trên bốn ca sát ranh của AC-4 cả hai KHÔNG phán vi phạm; băm đoạn trích bằng băm ghim trong test — bộ canh đổi thì thước đỏ, buộc soát lại hàm kiểm.
- AC-6: Given cấu hình giả đang phạm ở chỗ KHÁC nhóm đang thao tác — lần lượt: một nhóm khác `requireMention:false`; `bindings` có 1 entry; `channels.zalo` có mặt; `groupPolicy: "open"` —, When bật một nhóm, và tắt một nhóm khác nhóm phạm (gọi `setZaloGroupEnabled` và gọi handler `POST` thật của `/api/v1/ops/zalo/groups` với bearer ops), Then hàm ném lỗi nêu lớp vi phạm, route trả 400 với `error` nêu lớp vi phạm, tệp cấu hình giữ nguyên từng byte và không có tệp `.bak-<ms>` mới; chiều đỏ: (a) bản sao gỡ lời gọi bước kiểm → tệp bị ghi, ca đỏ nêu «ghi khi cấu hình phạm»; (b) bản sao GIỮ bước kiểm nhưng dựng nhóm mới và bật lại với `requireMention: false` → ở cả bốn bố cục của AC-1, hàm ném L3b nêu `group:moi`, tệp nguyên byte, không `.bak` mới (bước kiểm tự chặn được đầu ra sai của chính thao tác).
- AC-7: Given `app/src/lib/zalo-admin.ts`, When quét tĩnh mọi lời gọi ghi tệp (`writeFile`, `copyFile`, `rename`, `appendFile`, bản `Sync`) và gọi `createZaloAccount` / `deleteZaloAccount` thật trên cấu hình giả đang phạm, Then thước tĩnh thấy đúng một hàm ghi cấu hình (`writeCfg`), nó nhận đúng một tham số và câu lệnh đầu tiên của thân là lời gọi bước kiểm (không nhánh hay tham số nào bỏ được kiểm), mọi lời gọi ghi tệp khác nằm trong nó; hai hàm còn lại từ chối, tệp giữ nguyên byte; chiều đỏ: (a) bản sao đưa lời gọi kiểm xuống sau `writeFile`, (b) bản sao thêm một `writeFile(CONFIG, …)` ngoài `writeCfg`, (c) bản sao thêm tham số bỏ kiểm vào `writeCfg` — thước nêu tệp và lớp.
- AC-8: Given tệp test đặt `HOME`/`PATH` giả và `DATABASE_URL` trỏ cổng đóng rồi mới import động `zalo-admin` và route (không import tĩnh), When rào an toàn chạy trong `before()`, trên `zaloAdminPaths()` của mỗi bản sao đột biến trước khi gọi nó, và trên mỗi lượt chạy đoạn trích bộ canh của AC-5, Then `os.homedir()`, realpath của `openclaw`, `config` và tệp đưa cho python nằm dưới thư mục tạm, env của tiến trình python có `HOME` giả, đoạn trích không chứa `alert`, `pkill`, `launchctl`, `osascript` hay `$HOME` — sai thì không ca nào chạy; sau mọi ca bật/tắt nhóm, nhật ký openclaw giả rỗng (bật/tắt nhóm không gọi CLI); chiều đỏ: rào với `HOME` thật, và đoạn trích có `pkill`, trả vi phạm nêu đường lạc.
- AC-9: Given thay đổi này, When chạy `app/tests/go-tai-khoan-kiem-id.test.tsx`, `app/tests/login-kiem-id.test.tsx` và `cd app && npx tsc --noEmit && npm run lint`, Then đủ ca `GT-AC-*` và `LK-AC-*` vẫn xanh, typecheck và lint 0 lỗi.

## Coverage

Bỏ quét hình thái — sổ `decisions.jsonl` dòng `bỏ coverage-scan`. Ma trận viết trước: bố cục tài khoản {default có
`accounts.default`, default layout cũ, tài khoản có `groups` riêng, tài khoản kế thừa} × thao tác {thêm bật, bật lại,
tắt có sẵn, thêm tắt} (AC-1, AC-2, AC-3) · trạng thái `enabled`/`allow` của nhóm {true, vắng, null, 0, chuỗi, allow false} (AC-4) · trạng thái cấu hình trước khi ghi {sạch, phạm ở nhóm đang thao tác, phạm ở
chỗ khác} (AC-3, AC-6) · lớp bất biến {L2, L3, L3b, groupPolicy, cấu hình hỏng} × {phạm, sát ranh không phạm} (AC-4) · nguồn sự thật
của bất biến {hàm kiểm, bộ canh} — quan hệ bao hàm trên toàn ma trận (AC-5) · đường ghi cấu hình {toggle, tạo tài khoản, gỡ tài khoản, ghi mới thêm vào
sau} (AC-6, AC-7) · an toàn phép đo {module gốc, bản sao đột biến} (AC-8) · hồi quy (AC-9).

## Out of scope

- Khoá mà bộ canh không kiểm (phát hiện §2 của audit): `groupAllowFrom`, `requireMention` cấp tài khoản,
  `plugins.entries.zalo`, `commands.ownerAllowFrom`, `agents`/`talk`, `hooks.internal`. Hàm kiểm chỉ giữ bốn lớp đã
  nêu; mở rộng là hàng riêng.
- Sửa bộ canh `scripts/zalo-watchdog.sh` — không đổi một dòng; AC-5 chỉ đọc nó.
- Lệch quyền/audit của route `api/v1/ops/zalo/**` (role ops vs admin; actor `api:zalo-admin` cố định; cloud trả thành
  công mà vẫn ghi audit) và `readZaloAllowlist` đọc `channels.zalouser.groups` cũ (phát hiện §3).
- Giao diện `/ops/sources`: không đổi; lỗi 400 hiện qua thông báo lỗi có sẵn.
- Sửa tay cấu hình thật đang chạy hay kiểm gateway thật — không phép đo nào chạm `~/.openclaw`.
- Tài khoản không phải `default` đang KẾ THỪA `groups` cấp channel (không `groups` riêng): bố cục này đã phá bất biến 1 nhóm – 1 tài khoản, `createZaloAccount` không bao giờ tạo nó; hồ sơ không đo nó.
- Đưa `app/src/lib/zalo-admin.ts` vào `risk_tiers.t3_paths` — hạng T3 của hồ sơ này khai tay; đổi cấu hình kit là
  việc riêng.

## Notes

- `groupPolicy` vắng được chấp: OpenClaw v2026.10.5 mặc định `"allowlist"` (`extensions/zalouser/src/config-schema.ts`
  `GroupPolicySchema.optional().default("allowlist")`, `accounts.ts` `accountConfig.groupPolicy ?? "allowlist"`). Khai
  thì phải đúng `"allowlist"`. Khác với `requireMention`, nơi bộ canh đòi `true` tường minh vì mặc định runtime từng
  gây sự cố.
- Bộ kiểm đặt trong `writeCfg` — mọi đường ghi cấu hình của module đi qua nó.
- Commit/PR không ghi ID nhóm thật, ID tài khoản thu hay tên nguồn thật (kho công khai); fixture dùng id giả.
