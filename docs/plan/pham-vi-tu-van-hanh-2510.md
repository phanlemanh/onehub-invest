# Bản phạm vi — Ops tự vận hành nguồn, tư duy SaaS (25/10)

> Nguồn: tài liệu `docs/research/ops-tu-van-hanh-nguon-saas.md` (thảo luận với Mạnh 25/10, PR #79) — §2 audit chỉ
> đọc (19 thao tác vận hành, nguyên nhân gốc G1–G6), §3 kiến trúc đích (Mạnh chốt: đội làm từ xa qua cloud; nội
> dung/ảnh/thẻ duyệt lên cloud, tên nguồn thật chỉ ở máy thu), §4 đề xuất + tám quyết định §4.8, §5 đối chiếu với
> lộ trình (chồng lấn X1–X17, mốc TVM1–TVM3). Mã giữ nguyên mã đề xuất của tài liệu (`TV*`, `TVN*` cho hàng nhỏ).
> Nguồn gọi bằng mã: S01 tự thu ngắn hạn · S02 hiệu chuẩn · S03 nhóm chat cộng đồng · S05 nhóm mạng xã hội ·
> S06 rao vặt công khai · S08 danh mục dự án.
>
> Việc của người (bucket ảnh, token máy, tài khoản vai thật, chỉ định trưởng vận hành, khởi
> động lại app Ops sau #77, quét QR khi mất phiên) KHÔNG nằm ở đây — liệt «Ra khỏi kho» ở mô tả PR (luật 17/10).
> Chồng lấn với hàng có sẵn (PL12, ON19–ON21, UH7, UI13, PL3, OH1, NT2/AU1, ZC3/ON2, AU3, ZC7, ZC4, ZC8, ON4, AU12,
> NT4): xử lý theo §5.1 của tài liệu, do phiên Điều phối quyết trước khi cắt.

<!-- <<<PHAM-VI-MA -->
```
dot: tu-van-hanh-2510
dang: chuoi
nguon: docs/research/ops-tu-van-hanh-nguon-saas.md (thảo luận Mạnh 25/10, PR #79) §2–§5; quyết định Mạnh 25/10 «làm từ xa qua cloud», «nội dung/ảnh/thẻ duyệt lên cloud, tên nguồn thật chỉ local», tám quyết định §4.8

- `TV0` — ADR-0015 đường lệnh kéo một chiều cloud → máy thu (bổ sung ADR-0014); sửa đổi ADR-0007/luật 6 (nội dung bài, ảnh tin, thẻ duyệt lên cloud cho vai ops; tên nguồn thật chỉ ở máy thu: cloud `S08`, local `S08-<tên>`); thuật ngữ mới trong CONTEXT.md (Đơn vị thu, Lệnh, Quy định ngữ cảnh, Mục tiêu phủ)
- `TV1` — một luật quyền bốn vai viewer/ops/admin/owner ở một chỗ (`app/src/lib/ops-access.ts`); mọi route ghi `api/v1/ops/**` (zalo, source-groups, review) kiểm theo bảng — hôm nay API quản trị chỉ cần ops hoặc bearer chung; `ops_audit.actor` là id người thật, ghi trong cùng transaction; `users.role` có CHECK
- `TV2a` — vòng đời có CHECK trên `source_registry` và đơn vị thu (draft/active/paused/retired/completed, `reason`, `resume_when`) và hàm `isRunnable()` dùng chung
- `TV2b` — công tắc thật: mọi script thu gọi `isRunnable()` trước khi thu; bỏ danh sách fallback cứng S05 (`apify-facebook-collector.mjs`) và S06 (`collect-chotot.mjs`); `chotot-daily.sh` lấy vùng từ DB thay vì `for CITY in hanoi hcmc`; S05 `paused` không gọi nhà cung cấp (làn ZCode)
- `TV3a` — `checkZaloInvariants(cfg)` thuần phủ đủ khoá cấm (bindings, channels.zalo, plugins.entries.zalo, agents, talk, commands, hooks.internal, pluginHooks, groupPolicy, groupAllowFrom, requireMention mọi cấp); bộ ghi cấu hình gọi nó trước khi ghi, ghi nguyên tử, giữ bản trước có số (gateway nạp nóng < 1 giây)
- `TV3b` — watchdog gọi cùng `checkZaloInvariants`; một danh sách lớp lockdown chuẩn dùng chung cho watchdog, UI và facts (hôm nay watchdog «5 lớp», UI 8 dòng, tài liệu «7») (làn ZCode)
- `TV4` — sổ lệnh `change_requests` có khuôn + máy trạng thái (draft→submitted→approved→queued→applying→applied/rejected/failed→reverted) + bộ áp `ops-apply` ở máy thu (launchd 60″, token máy `ops:pull`, kết quả qua push-ops-facts); hai lệnh đầu `source.pause`, `source.resume`; máy thu tắt thì lệnh nằm chờ và cloud báo rõ
- `TV5` — lệnh `unit.create/enable/disable/update_meta/retire` cho đơn vị thu S05, S06 thay route ghi thẳng `source-groups`; bỏ purge xoá cứng `stg_zalo_posts`
- `TV6` — lệnh `unit.enable/disable` cho nhóm S03 qua bộ áp: kiểm trước (TV3a), ghi nguyên tử, kiểm sau hai phía 10′ (agent 0 turn và tin vẫn chảy), tự hoàn tác; người thứ hai duyệt (quyết định §4.8 #1)
- `TV7` — lệnh `source.set_schedule` theo preset của loại nguồn và `job.rerun`; bộ áp sinh plist từ khuôn `pipeline/cron/` và nạp lại (bộ chuyển plist làn ZCode)
- `TV8` — `slo_hours` đọc từ catalog ở cả `scripts/lib/freshness.mjs` và `app/src/lib/freshness.ts` (giữ test parity) + lệnh `source.set_slo`
- `TV9` — nội dung bài gốc + ảnh thu nhỏ lên cloud cho vai ops: bảng chiếu bài đã thay tên nguồn bằng mã qua `tier-a-guard`, ảnh webp ~800px vào bucket riêng tư URL ký, giữ tin còn sống + 90 ngày, trần 5 GB cảnh báo 80%; đổi luật leak gate tương ứng (`CLOUD_ALLOW`); anon đọc 0 dòng
- `TV10` — hồ sơ tin `/ops/offers/[id]` (tin chuẩn → bài gốc → snapshot → căn) + «Tin mới nhất» lọc nguồn/đơn vị/thị trường; S06 lưu khoá nối ngược (hôm nay `post_ids` rỗng)
- `TV11` — `market_coverage` tính sẵn ở pipeline (thị trường × nguồn: đơn vị đang thu, tin 7 ngày, % tin gắn được phường, căn) + trang độ phủ 34 thị trường; tin không gắn được thị trường thành dòng riêng (hôm nay 228/232 tin S03 thiếu `area_id`, đếm hụt im lặng)
- `TV12` — `coverage_targets` + lệnh `coverage_target.set`; trang độ phủ so số với mục tiêu và cảnh báo thị trường dưới mục tiêu
- `TV13` — thẻ duyệt `review_queue` lên cloud, quyết định đi xuống máy thu bằng lệnh `review.decide`; job định kỳ sinh lại thẻ `entity_match` (hôm nay 37 cặp `needs_llm` không có thẻ); loại thẻ `unit_proposal` (ops đề xuất nhóm → admin duyệt → `unit.create`); đổi luật leak gate «review_queue trên cloud phải rỗng»
- `TV14` — quy định ngữ cảnh cho AI có phiên bản (`context_rules`: draft→testing→active→retired); chạy thử một bản trên N tin gần đây báo số nhãn/đề xuất đổi, không áp dữ liệu; publish qua lệnh; agent (ON21) và hook/Kev (làn ZCode) đọc bản active; model local (quyết định §4.8 #6)
- `TV15` — trần chi phí S05: chạm trần ngày hoặc nhà cung cấp báo hết credit → nguồn tự `paused` có lý do, bật lại do admin bấm (quyết định §4.8 #4)
- `TV16` — S08 tối đa một lần mỗi tuần ép ở bộ áp và lịch (luật 5): lịch dày hơn bị từ chối
- `TV17` — sổ tay đội vận hành + checklist 19 thao tác §2.2 làm thước tiêu chí «100% thao tác trên /ops»
- `TVN1` — `readZaloAllowlist` (`app/src/lib/collections-queries.ts`) đọc khoá nhóm cấp tài khoản thay vì khoá cũ cấp kênh — /ops/collections đang hiện allowlist sai
- `TVN2` — tách tệp con trỏ nạp S03/S05 (cùng ghi một tệp, cùng 00:00); nạp S05 không nuốt mã thoát (làn ZCode, nối P3-1)
- `TVN3` — `source-groups` GET kiểm bearer trên request thật (hôm nay `new Request("http://x")` rỗng)
- `TVN4` — route Zalo trên cloud trả lỗi rõ thay vì «thành công» cho toggle không xảy ra và vẫn ghi audit
- `TVN5` — `ops_heartbeat` có migration (bảng chỉ cloud, lệch luật 2)
- `TVN6` — `push-ops-facts` đếm cả job `chotot`, `apify-facebook`, `zalo-import`
- `TVN7` — ROADMAP §2.3–2.4 khớp thực tế (S01 chạy tuần, 20:00 là smoke; 43 market S02)
```
<!-- PHAM-VI-MA>>> -->
