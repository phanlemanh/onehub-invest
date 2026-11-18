# Đề xuất vận hành ổn định hệ thu dữ liệu — sau sự cố S03 đứt 34 giờ (14/11)

> Trạng thái: **ĐỀ XUẤT, chờ Mạnh duyệt.** Chưa sửa runtime nào: không đổi cấu hình gateway, không khởi động lại
> gateway, không đổi plist, DB local chỉ đọc. Mọi thay đổi runtime là một hàng việc riêng ở §5, cần lời của Mạnh.
> Tài liệu chỉ dùng mã nguồn `S0x`; không chứa tên tài khoản thu, mã nhóm, phiên hay khoá. Log gateway và hook chỉ
> được tóm tắt (giờ, loại sự kiện, số đếm) — không chép dòng log thô.
>
> Giờ trong tài liệu: Z (UTC); giờ máy thu (+07) ghi trong ngoặc khi cần.

## 0. Tóm tắt một đoạn

Kênh S03 ngừng thu từ 13/11 00:54Z (07:54 +07) tới 14/11 11:00Z (18:00 +07): **34 giờ, 0 bài**. Máy đã *phát hiện*
đúng lúc — tín hiệu sống ghi DOWN từ 01:09Z, bộ canh L6 ghi cảnh báo lúc 01:00Z và 01:26Z — nhưng **không lớp nào
đẩy tin tới người**: cảnh báo chỉ nằm trong tệp log và một banner macOS hiện một lần trên máy thu. Trang Ops trên
cloud (nơi Mạnh xem từ xa) hiện «Chưa có tín hiệu sống» thay vì «Đứt», và `check-freshness` dùng SLO 72 giờ cho
S03 nên 34 giờ vẫn «tươi». Gốc kỹ thuật: kết nối nghe tin của S03 bị máy chủ đóng (mã đóng 1000), bộ tự khởi động
lại của kênh hẹn lịch nhưng **không bao giờ chạy** (lần thứ ba trong 19 ngày), rồi phiên đăng nhập mất hiệu lực nên
phải quét QR lại. Đề xuất chia ba lớp: **phòng** (tự phục hồi khi bộ hẹn treo, giảm số lần phiên rơi), **phát hiện**
(một bộ đẩy cảnh báo tới Mạnh ngoài nhóm chat, có «dead-man» từ cloud, sửa trang Ops cloud, tách «nhịp sống» khỏi
SLO độ tươi, dọn báo động giả kinh niên), **phục hồi** (runbook một trang ở §6).

## 1. Dòng thời gian sự cố (đo trên log máy thu, 14/11)

| Giờ (Z) | Sự kiện | Nguồn đo |
|---|---|---|
| 12/11 23:07 | Tín hiệu sống chuyển «up» (đợt khoẻ trước đó) | log hook, dòng heartbeat |
| 13/11 00:54 | Kênh S03: kết nối nghe tin lỗi, đóng với mã **1000** → kênh thoát → bộ tự khởi động lại hẹn lần thử | log gateway (3 sự kiện cùng phút) |
| 13/11 00:55 | Bài S03 cuối vào `stg_zalo_posts` | DB local |
| 13/11 01:00 | L6(b): «hẹn khởi động lại nhưng ≥2′ không có dòng khởi động provider» → ghi `zalo-watchdog-alerts.log` + banner macOS | alerts log |
| 13/11 01:09 | Heartbeat ghi DOWN — giữ DOWN ở **mọi** nhịp 15′ tới 14/11 10:58 | log hook |
| 13/11 01:26 | L6(a): «không bản thu S03 mới ≥30′ ban ngày» → alerts log + banner | alerts log |
| 13/11 15:00 | Ra khỏi khung 07–22h +07: L6(a) tự xoá cờ (thiết kế: đêm không xét) | `scripts/lib/s03-song.sh` |
| 14/11 00:00 | L6(a) báo lại (snapshot cũ 83 117 giây) — vẫn chỉ vào log + banner | alerts log |
| 13/11–14/11 | `push-ops-facts` đẩy lên cloud mỗi 15′ với «uptime 0%» — cloud nhận số nhưng không hiện, không báo | `cloud-sync.log` |
| 14/11 10:55 | `check-freshness` báo S01/S10/S11, **không** báo S03 | chạy tay |
| 14/11 ~11:00 | Mạnh quét QR ở `/ops/sources`; gateway khởi động provider lúc 11:00, bài S03 đầu tiên vào hook 11:05 | log gateway, log hook |

Gateway (`ai.openclaw.gateway`) **không khởi động lại** trong suốt sự cố: launchd ghi `runs = 1`, tiến trình chạy từ
10/11 02:10Z (lần khởi động lại để gỡ sự cố 09/11). Lockdown vẫn nguyên: `bindings` rỗng, không kênh bot, tin riêng
tắt (`dmPolicy = disabled` ở tài khoản), mọi nhóm `requireMention` khác `false`, `pluginHooks.messageReceived` bật.

## 2. Vì sao phiên rơi

### 2.1 Điều đo được

- **Kết nối nghe tin S03 bị đóng 10 lần từ 26/10** (log gateway bắt đầu có sự kiện này từ 26/10). 8/10 lần có mã
  đóng 1000 (đóng «bình thường» do phía máy chủ khởi xướng, không phải đứt mạng).
- **7/10 lần rơi vào 07–11h +07** (07h: 1, 09h: 3, 10h: 1, 11h: 2; còn lại 16h, 19h, 20h).
- **Bộ tự khởi động lại treo 3/10 lần**: 07/11 (23 phút mới khởi động lại), 09/11 (~24 giờ, gỡ bằng khởi động lại
  gateway 10/11), 13/11 (34 giờ, gỡ bằng quét QR). 7 lần còn lại provider khởi động lại trong cùng phút.
- Lần 13/11 khác lần 09/11 ở chỗ **phiên mất hiệu lực**: lệnh liệt kê nhóm chỉ-đọc báo «Đăng nhập thất bại» — khởi
  động lại gateway một mình sẽ không đủ, phải quét QR.
- Lệnh `openclaw status` / `channels status` vẫn in «linked» khi tệp phiên còn trên đĩa dù phiên đã chết → L6(c)
  (tìm chữ «not linked») **mù** với kiểu hỏng này. Đo: L6(c) không bắn lần nào trong 34 giờ.

### 2.2 Giả thuyết (chưa chứng minh — cần Mạnh xác nhận)

| Giả thuyết | Ủng hộ | Chống | Cách kiểm |
|---|---|---|---|
| **H1. Tài khoản thu bị đăng nhập ở chỗ khác** (trình duyệt / app máy tính / thiết bị mới) làm máy chủ đẩy phiên cũ ra | mã 1000 phía máy chủ; 7/10 lần rơi buổi sáng giờ làm việc; lần 13/11 phiên mất hẳn | không có dấu trong log nói lý do | Mạnh nhớ lại sáng 13/11 ~07:54 +07 có mở tài khoản thu ở thiết bị/trình duyệt nào; từ nay ghi giờ mỗi lần mở |
| H2. Phiên hết hạn định kỳ phía máy chủ | lần 13/11 phiên mất hẳn | khoảng cách giữa các lần không đều (1–7 ngày); 9/10 lần trước tự hồi không cần QR | đếm thời gian sống của phiên sau QR 14/11 |
| H3. Máy chủ chặn/khoá mềm tài khoản do hành vi | — | không có dấu khoá; QR lại được ngay | theo dõi nếu lặp với nhịp tăng |
| H4. Gateway khởi động lại làm rơi phiên | — | gateway không khởi động lại trong sự cố (`runs = 1`) | loại |

Kết luận làm việc: nguyên nhân **trực tiếp** gây 34 giờ là *bộ tự khởi động lại treo + phiên mất hiệu lực + không ai
được báo*. Nguyên nhân phiên rơi nhiều khả năng là H1; dù đúng hay sai, hệ phải chịu được việc phiên rơi vài ngày một
lần mà không mất quá 1 giờ dữ liệu.

## 3. Chuỗi phát hiện hiện tại — từng mắt xích và chỗ gãy

```
gateway S03 ──► heartbeat 15′ (collector/scripts/zalo-heartbeat.sh) ──► dòng DOWN trong log hook
           └──► watchdog 5′ (scripts/zalo-watchdog.sh, L6 qua scripts/lib/s03-song.sh) ──► alerts log + banner macOS
log hook ──► readZaloHealth (app/src/lib/collections-queries.ts) ──► /ops/collections MÁY THU: «Kênh S03 đứt»
         └──► push-ops-facts (15′) ──► ops_heartbeat cloud ──► /ops/collections CLOUD: «Chưa có tín hiệu sống»
stg_zalo_posts ──► scripts/lib/freshness.mjs (SLO S03 = 72 giờ) ──► check-freshness (chạy tay) + khối freshness cloud
```

| Mắt xích | Làm đúng | Gãy |
|---|---|---|
| Heartbeat | Ghi DOWN đúng từ 01:09Z | Chỉ ghi log. Không phân biệt «kênh dừng» với «phiên mất hiệu lực» |
| Watchdog L6 | (a), (b) bắn đúng giờ | Đầu ra duy nhất là tệp log + banner macOS một lần — launchd chạy nền, Mạnh không ngồi máy thu thì không thấy. (c) mù vì CLI in «linked». Không nhắc lại, không leo thang |
| Ops máy thu | Attention list hiện «Kênh S03 đứt» | Chỉ thấy khi mở trang ở máy thu |
| Ops cloud | Facts có `health` (uptime 0%) | Nhánh cloud của `collections-content.tsx` dùng `CLOUD_EMPTY.zaloHealth = { connected: null, … }` → hiện «Chưa có tín hiệu sống», không bao giờ «Đứt»; attention list cloud không có mục S03 |
| check-freshness | Đo đúng giờ thu thật (AU4) | SLO S03 = 72 giờ (độ tươi dữ liệu, ADR-0007) — đúng cho câu hỏi «dữ liệu có cũ không» nhưng **không phải** phép kiểm sống cho một kênh chảy liên tục. Và không job nào chạy nó theo lịch |
| Người | — | **Không có kênh đẩy nào tới Mạnh.** Toàn kho không có bộ gửi email/tin/issue cho cảnh báo vận hành |

### 3.1 Báo động giả kinh niên làm mờ tín hiệu thật (đo 14/11)

| Job | Mã thoát gần nhất | Vì sao | Hệ quả |
|---|---|---|---|
| `cloud-sync` | 1, **38 lượt liền** (~9,5 giờ) | bước `mau-soat-cuon-chieu` gọi `doc-gop-s03` lỗi | job «đỏ» thường trực — đỏ thật không ai phân biệt |
| `zalo-import` | 1 | bước `doc-gop-hang-ngay` lỗi (cổng model trả lỗi máy chủ) | như trên |
| job thu hằng ngày S02 | 1 | **401 sau làm mới token** từ 13/11 12:05Z, 32 lần — xác thực S02 hết hạn | SLO S02 35 ngày nên im lặng tới tháng 12 |
| job đêm S06 | — (đang chạy) | lượt trước: `resolve-properties` **deadlock** (khoá chéo với job khác) | lượt đêm hỏng một bước, không ai báo |
| job thu S05 | 1 | nguồn tạm dừng + khoá state bận >5′ | ồn, không phải lỗi thật |
| S10, S11 | — | đang `active` trong `source_registry` nhưng chưa có bộ nạp → «chưa có dữ liệu» ở mọi lần đo | dòng đỏ thường trực |
| S01 | — | 535 giờ, quá SLO 192 giờ (đã biết — S01 chờ chạy theo danh sách S02 sau 05/11) | dòng đỏ thường trực |

Bài học: một kênh đẩy mà gửi mọi thứ trên đây sẽ bị tắt tiếng trong một tuần. Bộ đẩy (§5 D1) phải có **danh sách điều
kiện có tên, mỗi điều kiện một ngưỡng, khử trùng và tự đóng** — và các mục trên phải được dọn hoặc hạ thành WARN.

## 4. Gateway: vòng đời, giữ phiên, lockdown, rủi ro khi đăng nhập lại

- **Vòng đời**: launchd `ai.openclaw.gateway`, KeepAlive. Chết tiến trình → launchd dựng lại; nhưng *kênh trong
  tiến trình* chết thì launchd không biết (tiến trình vẫn sống). Đây là lỗ của cả 09/11 lẫn 13/11.
- **Bộ tự khởi động lại kênh** (trong mã kênh S03 của gateway, bản vá ở `~/dev/openclaw` nhánh `fix/zalouser-plugin-hooks`):
  hẹn lần thử bằng bộ hẹn giờ; 3/10 lần bộ hẹn không chạy. Chưa có bản vá gốc.
- **Giữ phiên**: phiên QR lưu trong thư mục gateway (tầng A, không rời máy). Không có cơ chế làm mới phiên chủ động;
  khi máy chủ huỷ phiên chỉ có QR lại.
- **Lockdown hiện tại** (đọc chỉ-đọc 14/11): `bindings` = 0; không kênh bot; tài khoản thu `dmPolicy = disabled`; 4
  nhóm ở cấp kênh + 26 nhóm ở cấp tài khoản, không nhóm nào `requireMention = false`; `pluginHooks.messageReceived =
  true`; watchdog L1–L4d, L5, L5b, L6 chạy mỗi 5′.
- **Rủi ro khi đăng nhập lại bằng QR**: (1) QR lại không đổi cấu hình, lockdown giữ nguyên — đã kiểm 14/11; (2) nếu
  phiên cũ còn sống ở chỗ khác (H1) thì hai phiên đá nhau — QR lại xong mà vài phút sau rơi tiếp là dấu H1; (3) khởi
  động lại gateway (khác QR) có thể chạy «khôi phục lượt agent bị gián đoạn» — sự cố 22/10 cho thấy cơ chế này tồn tại;
  L4d tắt gateway nếu có lượt mới, nhưng tắt **sau** (≤5′). Vì vậy mọi tự khởi động lại gateway (P1) phải kèm điều kiện
  «không có lượt agent dở» và giới hạn tần suất.

## 5. Hàng việc đề xuất

Cột «Quyết»: **M** = cần lời Mạnh (runtime, tiền, dữ liệu thật, tài khoản); **—** = trong quyền giám sát tự xếp.
Làn theo AGENTS.md: `collector/openclaw`, `collector/scripts`, `scripts/zalo-*.sh`, plist, bước thu/nạp của `*-daily.sh`
là **ZCode**; transform trở đi, `app/`, `scripts/` còn lại (gồm `check-freshness`, `lib/freshness.mjs`), `docs/` là
**Claude**. Việc làn ZCode giao qua phiên điều phối liên làn.

### Ưu tiên cao nhất (làm trước)

| Mã | Mục tiêu | Tệp / khu vực | Làn | Rủi ro | Cách đo | Quyết |
|---|---|---|---|---|---|---|
| **D1** | **Bộ đẩy cảnh báo tới Mạnh** ngoài nhóm chat: một script đọc các điều kiện có tên (S03 DOWN > 30′ ban ngày / > 60′ đêm; L6 a/b/d; L5b DB; Kev; job FAIL *mới* sau khi đã dọn §3.1; xác thực nguồn hỏng; facts không đẩy > 45′), khử trùng theo điều kiện, nhắc lại mỗi 6 giờ, tự đóng khi hồi. Kênh khuyến nghị: **issue trong kho riêng tư** (GitHub đã là kênh chính, Mạnh nhận đẩy qua app GitHub; không thêm dịch vụ, không tốn tiền). Nội dung chỉ mã `S0x`, giờ, điều kiện — qua `tier-a-guard` như `push-ops-facts` | script mới `scripts/canh-bao-day.mjs` + bảng điều kiện; gọi từ plist riêng 5′ (plist là bước triển khai, Mạnh duyệt) | Claude (script) · ZCode (nối L6 vào bộ đẩy) | lộ tầng A lên GitHub → bắt buộc qua bộ soát; ồn → khử trùng + danh sách điều kiện đóng | tái hiện sự cố 13/11 trên bản chép (khuôn harness `canh-bao-s03-ngung-thu`): issue mở ≤ 35′ sau lúc rơi, đúng 1 issue, tự đóng khi hồi; đếm cảnh báo/tuần ≤ 5 khi khoẻ | **M**: chọn kênh |
| **D2** | **Dead-man từ cloud**: máy thu tắt, mất mạng hay launchd chết thì D1 cũng chết. Một job lịch ngoài máy (GitHub Actions `schedule` 30′) đọc mốc facts + `health` qua API ops bằng token chỉ-đọc → mở issue khi facts cũ > 60′ hoặc S03 `connected = false` > 60′ | `.github/workflows/dead-man.yml` (mới), một route ops chỉ-đọc trả mốc + trạng thái (có thể dùng `/api/v1/ops/coverage` sẵn có + thêm `health`) | Claude | token trong secret của kho công khai → scope chỉ-đọc, chỉ số tổng hợp; lịch GitHub có thể trễ 5–15′ | tắt thử `cloud-sync` trên bản preview/fixture: issue mở trong ≤ 90′; không issue khi khoẻ 7 ngày | **M**: cấp token |
| **P1** | **Tự phục hồi khi bộ hẹn khởi động lại treo**: L6(b) đỏ ≥ 10′ *và* mọi lớp lockdown cùng lượt «ok» *và* L4d không thấy lượt dở → khởi động lại gateway một lần (`launchctl kickstart -k`), tối đa 1 lần / 6 giờ, ghi sổ + đẩy qua D1. Không bao giờ tự quét QR, không đổi cấu hình | `scripts/zalo-watchdog.sh`, `scripts/lib/s03-song.sh`, harness `scripts/canh-bao-s03-ngung-thu/acceptance.mjs` | ZCode | khôi phục lượt agent khi khởi động lại (§4) → điều kiện L4d + giới hạn tần suất; vòng khởi động lại vô hạn → trần 1/6h rồi chỉ báo | harness: kiểu 09/11 → đúng 1 lần khởi động lại, kiểu 13/11 (phiên chết) → khởi động lại 1 lần rồi chuyển D1 «cần QR»; đo thật: thời gian đứt trung vị khi bộ hẹn treo từ 24 giờ xuống ≤ 15′ | **M**: runtime |
| **D3** | **L6(d) «DOWN kéo dài» thay chỗ mù của (c)**: heartbeat DOWN ≥ 2 nhịp liền (≥ 30′) → cảnh báo, không cần CLI in «not linked». Và khi DOWN, gọi lệnh liệt kê nhóm **chỉ-đọc** tối đa 1 lần/giờ để phân biệt «kênh dừng» (P1 xử được) với «phiên mất hiệu lực» (cần QR) — ghi vào dòng heartbeat (`DOWN reason=session` / `reason=stopped`) | `collector/scripts/zalo-heartbeat.sh`, `scripts/lib/s03-song.sh` | ZCode | lệnh liệt kê nhóm gọi máy chủ → chỉ khi DOWN, trần 1/giờ; không phát gì ra nhóm | fixture: DOWN 2 nhịp → 1 cảnh báo; hai lý do phân biệt đúng trên log thật 13/11 (đã có «Đăng nhập thất bại») | — |
| **D4** | **Ops cloud hiện đúng S03**: nhánh cloud dùng `health` trong facts (đã đẩy sẵn) thay `CLOUD_EMPTY.zaloHealth`; attention list cloud có mục «Kênh S03 đứt» + «đứt từ <giờ>» | `app/src/components/ops/collections/collections-content.tsx`, `attention-list.tsx`, `pipe-panels.tsx`, bộ đọc facts cloud | Claude | facts cũ hiện như mới → kèm mốc facts, mờ khi > 45′ (khuôn `FactsStaleAlert`) | test: facts `connected=false` → trang cloud hiện «Đứt»; facts cũ → không badge xanh | — |

### Ưu tiên kế

| Mã | Mục tiêu | Tệp / khu vực | Làn | Rủi ro | Cách đo | Quyết |
|---|---|---|---|---|---|---|
| D5 | **Tách «nhịp sống» khỏi SLO độ tươi**: giữ SLO 72 giờ của S03 (ADR-0007, Mạnh chốt AU4) cho câu hỏi dữ liệu cũ; thêm khối `liveness` cho mã chảy liên tục (S03: tuổi bản thu mới nhất, ngưỡng 30′ ban ngày / 3 giờ đêm) đi cùng khối `freshness` trong facts, `check-freshness` in thêm một dòng | `scripts/lib/freshness.mjs`, `scripts/check-freshness.mjs`, `pipeline/push-ops-facts.mjs` | Claude | trùng nghĩa với L6(a) → một định nghĩa, watchdog và Ops đọc chung | ma trận biên 1799/1800 giây ban ngày; parity với L6(a) trên cùng fixture | — |
| D6 | **Dọn báo động giả kinh niên** (§3.1): bước đo/đọc model (`mau-soat-cuon-chieu`, `doc-gop-hang-ngay`) lỗi → WARN có đếm, không làm job thoát 1; S10/S11 chưa có bộ nạp → hiện «chưa thu» thay «quá hạn»; S01 dừng có chủ ý → nhãn «tạm dừng» | `scripts/cloud-sync.sh`, `scripts/zalo-import-daily.sh` (bước transform trở đi), `scripts/lib/freshness.mjs` | Claude | giấu lỗi thật → WARN vẫn vào D1 nếu lặp ≥ N lượt | 7 ngày khoẻ: mọi job launchd thoát 0 trừ khi có lỗi thật | — |
| D7 | **Xác thực nguồn hỏng là điều kiện D1**: 401/«đăng nhập thất bại» ở S02, S03, S16… → cảnh báo ngay, không chờ SLO. S02 hiện đang 401 từ 13/11 | log job thu S02, bộ thu từng nguồn (dòng chuẩn `AUTH FAIL [S0x]`) | ZCode (dòng chuẩn) · Claude (điều kiện D1) | — | fixture 401 → 1 cảnh báo; S02 hiện tại được báo ngay khi D1 bật | **M**: đăng nhập lại S02 (tài khoản) |
| P2 | **Giảm số lần phiên S03 rơi**: nếu H1 đúng — tài khoản thu chỉ đăng nhập ở gateway, không mở ở trình duyệt / máy tính / thiết bị khác; Mạnh ghi giờ khi buộc phải mở | quy ước vận hành, `docs/ops/runtime-map.md` | Mạnh · Claude (ghi tài liệu) | — | số lần đóng kết nối/tuần: nền 10 lần/19 ngày (~3,7/tuần) → mục tiêu ≤ 1/tuần sau 2 tuần | **M** |
| P3 | **Vá gốc bộ hẹn khởi động lại** trong mã kênh S03 của gateway (hẹn bằng bộ hẹn giờ không chạy) — bản vá trong `~/dev/openclaw`, cài theo đúng quy trình build + `openclaw.plugin.json` của runtime-map | `~/dev/openclaw/extensions/zalouser/src/monitor.ts` (nhánh vá hiện có) | ZCode | build/cài sai → gateway crash-loop (đã trả giá 22/10) → quy trình runtime-map + watchdog L1b | tái hiện treo bằng test đơn vị; sau cài 14 ngày: 0 lần L6(b) | **M**: runtime |
| D8 | **Deadlock S06 `resolve-properties`**: khoá tư vấn chung cho các bước ghi `properties` (lượt đêm S06, lượt nạp nhanh S03, S4 song song) — đụng khoá thì chờ có hạn hoặc bỏ lượt như `--luot-nhanh` | `pipeline/resolve-properties*`, script hằng ngày của S06 trong `scripts/` (bước resolve) | Claude | chờ lâu kéo dài lượt đêm → timeout + bỏ lượt có ghi | 14 đêm: 0 deadlock trong log job đêm S06 | — |
| R1 | **Kiểm sau đăng nhập trên `/ops/sources`**: sau QR, trang hiện «bài mới đầu tiên lúc …» (dòng hook sau mốc QR), không chỉ `connected: true`; nếu 10′ không có bài → nhắc kiểm nhóm/hook | `app/src/app/ops/sources/**`, route login | Claude | — | e2e trên dev: QR giả → trạng thái chuyển «đã nhận bài» khi có dòng hook mới | — |
| O1 | **Tài nguyên máy**: swap 6,8/8 GB đang dùng (14/11), RAM trống 67% — chưa phải nút thắt nhưng là dấu áp lực khi S4 song song. Thêm RAM/swap vào facts, ngưỡng D1 khi swap > 90% kéo dài | `pipeline/push-ops-facts.mjs` | Claude | — | số hiện trên `/ops` | — |

Ghi chú đo thêm (chưa thành hàng): log `zalo-import` và `cloud-sync` có các đợt `ECONNREFUSED :5433` (27 và 58 lần)
trong khi alerts log chỉ có cảnh báo L5b ngày 26/10 — cần đo giờ các đợt này để biết L5b có bỏ sót không (L5b chạy
5′ một lần, đợt DB khởi động lại ngắn hơn 5′ sẽ lọt). Container DB hiện `restart = unless-stopped`, chạy 7 ngày.

## 6. Runbook một trang — kênh S03 đứt

> Dùng khi nhận cảnh báo «S03 DOWN» (sau D1) hoặc thấy «Kênh S03 đứt» trên `/ops`.

1. **Xem lý do** trên `/ops/collections` (máy thu) hoặc issue cảnh báo: `reason=session` (phiên mất hiệu lực) hay
   `reason=stopped` (kênh dừng). Trước D3: cứ làm bước 2.
2. **Đăng nhập lại bằng QR** ở `/ops/sources` (máy thu) → quét bằng app trên điện thoại của tài khoản thu → chờ trang
   báo đã nối.
3. **Tải lại trang** `/ops/sources`: tài khoản hiện «đã nối». Sau 5–10′ tải lại `/ops/collections`: «Lần cuối có bài»
   phải là vài phút trước. Không có bài sau 15′ (ban ngày) → bước 5.
4. **Không làm**: không sửa `~/.openclaw/openclaw.json`, không đổi `requireMention`, không bật tin riêng, không thêm
   bindings, không gửi gì vào nhóm để «thử» (luật 8). Không mở tài khoản thu ở trình duyệt/máy tính khác (P2).
5. **Vẫn không có bài**: chỉ khi đó mới khởi động lại gateway — `launchctl kickstart -k gui/$(id -u)/ai.openclaw.gateway`
   — rồi chờ 2 lượt watchdog (10′): dòng cuối `pipeline/logs/zalo-watchdog.log` là «ok», `zalo-watchdog-alerts.log`
   không có dòng L4d mới. Có dòng L4d → dừng, làm theo `runbook-openclaw-hook.md` mục «L4d tắt gateway».
6. **Ghi lại** giờ rơi, giờ hồi, có mở tài khoản ở thiết bị khác không (để kiểm H1).

## 7. Việc cần Mạnh quyết

1. **Kênh đẩy cảnh báo (D1)** — khuyến nghị: issue trong kho riêng tư, Mạnh nhận đẩy qua app GitHub (không thêm dịch
   vụ, không tốn tiền). Phương án khác: email, bot chat riêng.
2. **Cho phép watchdog tự khởi động lại gateway (P1)** khi bộ hẹn treo, trần 1 lần/6 giờ, chỉ khi lockdown xanh và
   không có lượt agent dở. Đổi runtime → cần lời riêng.
3. **Cấp token chỉ-đọc cho dead-man (D2)** trong secret của kho.
4. **Quy ước tài khoản thu (P2)** — chỉ gateway dùng; và Mạnh xác nhận sáng 13/11 ~07:54 +07 có mở tài khoản thu ở
   chỗ khác không (kiểm H1).
5. **Đăng nhập lại S02** (401 từ 13/11) — việc tài khoản, ngoài phạm vi sự cố S03 nhưng cùng kiểu «đứt im lặng».
6. **Vá gốc bộ hẹn (P3)** — cài bản vá vào runtime gateway.

Các hàng còn lại (D3–D8, R1, O1) nằm trong quyền giám sát tự xếp lượt.
