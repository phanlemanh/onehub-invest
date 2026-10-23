# Khoá Data API Supabase (migration 037) — runbook áp, kiểm, hoàn tác

Project `one-invest` (ref `smqpqiigzulwpmrsrhci`). Hồ sơ nghiệm thu T3:
`_acceptance/supabase-lock-anon-rls/`. **Agent không tự áp lên prod** — Mạnh ký hồ sơ rồi tự chạy.

## Vì sao

Đo 2026-10-23 (chỉ đọc, bảng đầy đủ ở `_acceptance/supabase-lock-anon-rls/do-truoc-cloud.md`):

- RLS tắt trên cả 36 bảng của postgres trong `public`; anon và authenticated có
  SELECT/INSERT/UPDATE/DELETE/TRUNCATE trên 38 bảng + view, USAGE trên 4 sequence.
- Default privileges của postgres trong `public` cấp lại đủ quyền đó cho mọi bảng,
  sequence và hàm tạo sau.
- Thăm PostgREST bằng anon key (HEAD, chỉ đếm): `sessions` 17 dòng, `users` 1,
  `sale_offers` 9.845, `sellers` 1.043, `properties` 8.270 đều trả 200/206.
  `sessions.token` lưu thô (`app/src/lib/auth.ts`), nên ai đọc được bảng này là
  chiếm được phiên `/ops`.
- Advisor security (chạy `get_advisors` loại security cùng ngày, không nằm trong tệp đo):
  `rls_disabled_in_public` ×37 (36 bảng của postgres + `spatial_ref_sys`), `security_definer_view` ×2
  (`v_ruler_p2`, `v_ruler_p2_area`), `extension_in_public` (postgis),
  `*_security_definer_function_executable` ×3 (`st_estimatedextent`, của PostGIS).

## 037 làm gì, ai bị ảnh hưởng

Chỉ chạm đối tượng do postgres làm chủ trong `public`: thu mọi quyền của anon và authenticated
trên bảng, view, sequence và hàm; bật RLS (không policy, không FORCE); đặt view sang
`security_invoker`; thu default privileges để bảng, sequence và hàm mới không cấp lại. Riêng
quyền EXECUTE của PUBLIC trên hàm chỉ thu được ở mức toàn cục, nên áp cho hàm postgres tạo ở
**mọi** schema, không chỉ `public`. postgres vẫn chạy hàm của mình; role khác muốn gọi hàm mới
thì cần GRANT riêng. DB không có role `anon` (local) thì bỏ qua.

| Đường | Kết nối bằng | Sau 037 |
|---|---|---|
| App Vercel `onehub-invest` (và project cũ `app`) | `DATABASE_URL` = pooler, user `postgres.<ref>` → role postgres | không đổi: chủ bảng + BYPASSRLS |
| data-api (Vercel `onehub-data-api`) | `DATABASE_URL` (pooler; DB không có role đăng nhập tự tạo nào khác postgres) | không đổi |
| `pipeline/sync-cloud.mjs`: INSERT | PostgREST + `SUPABASE_SERVICE_KEY` → service_role | không đổi: giữ grant, BYPASSRLS |
| `sync-cloud.mjs`: TRUNCATE, leak gate | Management API → postgres | không đổi |
| `pipeline/push-ops-facts.mjs` | HTTPS tới `/api/v1/ops/ingest` của app → postgres | không đổi |
| `pipeline/drill-restore.mjs` | PostgREST + service key | không đổi |
| `scripts/audit-all.sh` | Management API | không đổi |
| Ai cầm anon key | PostgREST → anon | **401 trên mọi bảng/view của postgres** |

Đã thử trên Supabase giả lập (cùng image `supabase/postgres` 17.6, role và default privileges
giống cloud, có PostgREST thật): `bash scripts/check-supabase-lock.sh sim`.

## Áp (Mạnh chạy, sau khi ký hồ sơ)

1. PR đã merge và checkout chính đã pull: tệp 037 phải có trong `main`.
2. Chọn lúc ngay sau một lượt sync, khi log `pipeline/logs/cloud-sync.log` vừa in
   `leak gate PASS`. 037 tự dừng nếu chờ khoá quá 15 giây (`lock_timeout`). Khi đó
   cả khối huỷ nguyên vẹn, chạy lại là được.
3. Chạy từ checkout chính bằng một trong hai cách:
   - Supabase Dashboard → SQL Editor → dán `db/migrations/037_lock_anon_enable_rls.sql` → Run.
   - Management API (thành công trả `[]`):

```bash
cd ~/dev/onehub-invest && jq -Rs '{query: .}' db/migrations/037_lock_anon_enable_rls.sql | curl -fsS -X POST "https://api.supabase.com/v1/projects/smqpqiigzulwpmrsrhci/database/query" -H "Authorization: Bearer $(sed -n 's/^SUPABASE_MGMT_TOKEN=//p' ~/.oneinvest/cloud.env | tr -d '\"'"'"'')" -H "content-type: application/json" --data-binary @-
```

## Kiểm sau khi áp

1. Đo lại cloud (chỉ đọc) NGAY sau khi áp, trước lượt sync kế tiếp. Lệnh phải kết thúc bằng
   `check-supabase-lock cloud: OK`, anon nhận 401 ở mọi dòng, service_role vẫn nhận 200/206:

```bash
cd ~/dev/onehub-invest && bash scripts/check-supabase-lock.sh cloud > _acceptance/supabase-lock-anon-rls/do-sau-cloud.md; tail -12 _acceptance/supabase-lock-anon-rls/do-sau-cloud.md
```

   Lưu ý giáp ranh sync-cloud: bản sync nạp-rồi-tráo bảng tạo bảng mới mỗi lượt. Bảng mới
   không có quyền anon (nhờ default privileges của 037), nhưng RLS mặc định tắt. Nếu bản tráo
   chưa `ENABLE ROW LEVEL SECURITY` cho bảng mới, `tables_rls_off` sẽ thành > 0 sau lượt sync
   kế tiếp. Đo sau lượt đó mà chỉ `tables_rls_off` đỏ thì vẫn an toàn. Chỉ số quyết định là
   `rel_api_open=0` và anon nhận 401.
2. App prod: `https://onehub-invest.vercel.app/vn/hanoi` trả 200 và có số; đăng nhập
   `/ops`, mở `/ops/deals`.
3. Lượt sync kế tiếp (hoặc `launchctl kickstart gui/$(id -u)/com.oneinvest.cloud-sync`):
   `pipeline/logs/cloud-sync.log` in `leak gate PASS`; push-ops-facts không báo lỗi.
4. Advisor security: `rls_disabled_in_public` chỉ còn `spatial_ref_sys` (của PostGIS) và
   `security_definer_view` hết. Các mục PostGIS còn lại nằm ở Known limits.

## Hoàn tác (chỉ khi 037 làm gãy một đường sống)

Chạy hoàn tác là **mở lại lỗ**. Trước khi chạy, xem `docs/ops/supabase-lock-anon-rls.rollback.sql`.
Tệp này cũng đặt `lock_timeout` 15 giây như 037, nên không xếp hàng chặn app đọc.
Tệp này đưa quyền, RLS và default privileges về đúng trạng thái trước 037 (sim đã kiểm),
rồi cần áp lại 037 sớm nhất có thể:

```bash
cd ~/dev/onehub-invest && jq -Rs '{query: .}' docs/ops/supabase-lock-anon-rls.rollback.sql | curl -fsS -X POST "https://api.supabase.com/v1/projects/smqpqiigzulwpmrsrhci/database/query" -H "Authorization: Bearer $(sed -n 's/^SUPABASE_MGMT_TOKEN=//p' ~/.oneinvest/cloud.env | tr -d '\"'"'"'')" -H "content-type: application/json" --data-binary @-
```

Hỏng một đường thì thường chỉ cần cấp lại đúng quyền cho đúng role, không phải mở toàn bộ.
Ví dụ sync báo `permission denied` trên một bảng mới: `GRANT ALL ON <bảng> TO service_role`.

## Khuyến nghị: phiên và khoá

Khoá anon từng lộ ở đâu (đo 2026-10-23; chỉ ghi tên biến và nơi xuất hiện, không ghi giá trị):

| Nơi | Kết quả |
|---|---|
| Lịch sử git mọi nhánh của `onehub-invest`, `onehub-data-api` (public), `onehub-invest-app` (public), `one-invest`, `one-invest-collector` | không có giá trị anon key hay service key. Chỉ `one-invest` (private) có ref project trong 4 commit |
| Env Vercel `onehub-invest`, `app`, `onehub-data-api` | chỉ có `DATABASE_URL`, `OPS_API_TOKEN`, `RENAME_REFCALIB`. Không có `NEXT_PUBLIC_*`, `SUPABASE_*` |
| Bundle client prod `onehub-invest.vercel.app` (35 chunk) và `app-lilac-one-49.vercel.app` (36 chunk) | không chứa anon key, không có JWT, không có `supabase.co` |
| Máy local | `SUPABASE_ANON_KEY` trong `~/.oneinvest/cloud.env`. Không code nào đọc biến này |
| Máy local (service key) | `SUPABASE_SERVICE_KEY` trong `~/.oneinvest/cloud.env` (chmod 600). `pipeline/sync-cloud.mjs` và `pipeline/drill-restore.mjs` đọc biến này. Không ở nơi nào khác trong bảng này |

Dấu vết truy cập: edge log 24 giờ qua chỉ có service_role (sync, FPT Telecom VN) và 11 lệnh thăm
anon của chính phiên đo (10 lần HEAD đếm dòng trong `do-truoc-cloud.md` và 1 lần gọi
`rpc/postgis_version`). `pg_stat_statements` từ 2026-10-20 13:25 UTC đến lúc đo không có
câu lệnh nào chạy bằng anon hoặc authenticated. Khoảng trước 20/10 không có log để kiểm.

- **Vô hiệu toàn bộ `sessions` sau khi áp 037: NÊN làm.** Token lưu thô và hạn 30 ngày.
  Log không phủ được khoảng trước 20/10. Bảng chỉ có 17 phiên của 1 người dùng, nên cái giá
  là Mạnh đăng nhập lại. Mạnh tự chạy trên SQL Editor: `DELETE FROM sessions;` (bảng chỉ có
  ở cloud, sync không ghi).
- **Xoay anon key: CHƯA cần.** Sau 037, anon không còn quyền gì nên khoá này hết giá trị.
  Supabase cũng coi anon key là khoá công khai. Khoá chưa thấy lộ ở nơi nào kiểm được. Nếu
  muốn xoay khoá kiểu JWT cũ, phải xoay JWT secret, mà việc đó đổi luôn service key và làm
  gãy sync cho tới khi cập nhật `cloud.env`. Nên để sang việc riêng: chuyển sang khoá
  publishable/secret mới rồi tắt khoá cũ.
- **Service key: không cần xoay.** Không thấy ở repo, env Vercel hay bundle nào.
- **Mật khẩu người dùng duy nhất: tuỳ chọn.** `users.password_hash` là scrypt có salt, đọc
  được nếu ai đó từng có anon key. Chưa thấy dấu vết, nên chỉ đổi khi muốn chắc thêm.

## Leak gate kiểm anon (AU1, `_acceptance/leak-gate-kiem-anon/`)

Từ hồ sơ này, mỗi lượt sync cloud (`pipeline/sync-cloud.mjs`, launchd 15′) tự kiểm quyền đọc công khai: role `anon`
hoặc `authenticated` mà SELECT được bất kỳ bảng, view, materialized view hay bảng phân vùng nào trong `public` thì
lượt dừng và báo đỏ. Kiểm hai chỗ: trước khi đọc local và gửi (không dòng nào lên một cloud đang mở) và trong leak gate
sau tráo (bắt quyền mở giữa lượt).

### Thứ tự triển khai — làm đúng thứ tự này

1. Áp 037 lên prod theo mục «Áp» ở trên, rồi kiểm theo mục «Kiểm sau khi áp».
2. Mạnh chạy lệnh chỉ đọc trên prod (cần `~/.oneinvest/cloud.env`):

   ```bash
   node pipeline/sync-cloud.mjs --kiem-anon
   ```

   Mã 0 và dòng `kiem-anon: sạch — …` là điều kiện merge (Hỏi-1 Mạnh duyệt 23/10). Dán mã thoát và dòng in vào PR.
   Có dòng `kiem-anon: <role> đọc được …` thì chưa merge: gỡ theo mục dưới rồi chạy lại.
3. Merge PR leak gate. Lượt sync kế tiếp tự chạy gate.

Merge khi prod còn mở (chưa áp 037, hoặc `--kiem-anon` còn vi phạm) thì MỌI lượt sync dừng đỏ ở pha `gate` — dữ
liệu cloud đứng yên ở bản cũ cho tới khi gỡ xong.

### Đọc dòng báo đỏ

Log của `scripts/cloud-sync.sh` có dòng dạng:

```
SYNC FAIL [gate] <thời điểm>: LEAK GATE FAIL (trước khi gửi): anon đọc được public.users (bảng, cấp thẳng; gỡ: REVOKE SELECT ON public."users" FROM "anon")
```

- `(trước khi gửi)` — lượt dừng trước khi đọc local; cloud không nhận dòng nào của lượt này.
  `(sau tráo)` — quyền mở GIỮA lượt; dữ liệu lượt này đã lên rồi mới báo.
- Mỗi vi phạm: `<role> đọc được public.<quan hệ> (<loại>, <đường cấp>; gỡ: <lệnh>)`, nối nhau bằng dấu phẩy. Đường
  cấp là một trong: `cấp thẳng`, `qua PUBLIC`, `cấp cột <cột>`, `qua role <role trung gian>`.
- `cloud không có role anon — không kiểm được quyền đọc công khai` — sync đang nói chuyện với một DB không phải
  Supabase (sai `cloud.env`?); gate không cho qua khi không kiểm được.

### Gỡ đúng

Chạy NGUYÊN VĂN lệnh sau `gỡ:` trong SQL Editor của Supabase — nó nhắm đúng đường cấp (vd quyền đến qua `PUBLIC`
thì gỡ `FROM PUBLIC`, gỡ `FROM anon` sẽ không ăn thua). Lượt sync kế tự xanh lại. Không tắt, không nới gate để sync
chạy tiếp — gate đỏ nghĩa là ai cầm anon key (khoá công khai) đang đọc được dữ liệu đó. Sửa quyền trên prod là việc
của Mạnh; agent chỉ đọc log và chỉ ra lệnh, không tự chạy trên prod.

### Ba quan hệ PostGIS được chừa

`spatial_ref_sys`, `geometry_columns`, `geography_columns` (hằng `PUBLIC_READ_ALLOW` trong `pipeline/sync-cloud.mjs`)
vẫn cho anon đọc sau 037: chủ là `supabase_admin`, role `postgres` không thu quyền được (Known limit ở trên), và nội
dung là bảng tham chiếu hệ toạ độ công khai, không có dữ liệu sản phẩm. Gate chỉ chừa chúng khi là thành viên extension
`postgis`; bảng thường trùng tên vẫn bị bắt. Muốn chừa thêm quan hệ nào là quyết định của Mạnh, ghi lý do ở đây.

Thước: `cd pipeline && node scripts/check-cloud-sync.mjs anon` (cloud mô phỏng, không gọi prod).
