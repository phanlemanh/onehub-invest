# vong-doi-nguon — thiết kế (TV2a)

Căn cứ: hàng TV2a của `docs/plan/lo-trinh.json`; `docs/research/ops-tu-van-hanh-nguon-saas.md` §2.4 G1, §3.2, §3.4;
ADR-0015 (đường lệnh kéo một chiều, #124). Hồ sơ: `_acceptance/vong-doi-nguon/`.

## Vấn đề

`source_registry.status` là chữ tự do, không CHECK. Hôm nay có `active`, `paused` và `completed`. `paused` chỉ tắt
phép đo độ tươi; không script thu nào tuân (G1). Sổ nhóm `source_groups` (S05, S06) chỉ có cờ `enabled`: không lý
do, không điều kiện bật lại, không phân biệt «chưa bật» với «đã gỡ». Các hàng sau đều cần một luật trạng thái để tuân:
TV2b (script thu gọi `isRunnable`), PL12 (sổ đơn vị thu), TV4 (lệnh `source.pause`/`source.resume`).

## Mục tiêu

1. Hai bảng có cùng vòng đời năm trạng thái `draft · active · paused · retired · completed`, kiểm bằng CHECK.
2. `paused` bắt buộc có `reason`. `resume_when` (điều kiện bật lại, chữ tự do — vd «credit reset 7/11») là tuỳ chọn.
3. Một hàm thuần `isRunnable(source, unit?)` trả quyết định chạy, kèm lý do, cho mọi tổ hợp trạng thái. Một CLI bọc
   hàm đó để script bash dùng được (TV2b).
4. Không làm gãy bên đọc hay bên ghi nào đang có: các script thu của làn ZCode vẫn đọc `source_groups.enabled`;
   `check-freshness` và `freshness.ts` vẫn lọc `status = 'active'`; trang `/ops/sources` vẫn đọc `enabled`; nhánh và
   test còn ghi thẳng `enabled` vẫn chạy. DB local dùng chung cho mọi worktree và job đêm, nên migration phải tương thích
   ngược ngay khi áp.

## Dữ liệu — migration `047_vong_doi_nguon.sql` (số do phiên liên làn cấp 26/10, sổ SO-MIGRATION)

Chỉ có ở DB local. `source_registry` và `source_groups` là tầng A, không sync cloud (ADR-0007, luật 6). Supabase không
có hai bảng này, nên mỗi khối của migration tự bỏ qua khi `to_regclass(...) IS NULL`. Chạy trên cloud thì thoát 0,
không tạo gì. Chạy lại lần hai thì không lỗi, không đổi dữ liệu.

**`source_registry`**
- Thêm `reason text`, `resume_when text`.
- Backfill: dòng `paused` thiếu `reason` thì lấy `reason` từ `note`; `note` trống thì ghi chuỗi cố định
  `'trước TV2a: chưa ghi lý do'`. Migration không ghi tên nguồn nào.
- Mặc định `status` giữ `'active'` như hôm nay (tương thích ngược: dòng chèn không nêu trạng thái vẫn chạy như trước).
  Đổi mặc định sang `draft` đi cùng luồng thêm nguồn qua lệnh (TV4/TV13c).
- CHECK có tên: `source_registry_status_chk` (năm giá trị) và `source_registry_paused_reason_chk`
  (`status <> 'paused' OR length(btrim(coalesce(reason,''))) > 0`).

**`source_groups`**
- Thêm `status text NOT NULL` (không mặc định — trigger điền), `reason text`, `resume_when text`, cùng hai CHECK cùng
  khuôn (`source_groups_status_chk`, `source_groups_paused_reason_chk`).
- Backfill từ `enabled`: `true` → `active`; `false` → `paused`, `reason = 'trước TV2a: tắt bằng công tắc enabled'`.
  Đo 26/10 trên DB local: 4/4 nhóm đang `enabled = true`, nên nhánh `false` hôm nay không gặp dòng thật nào.
- Migration **không đổi trạng thái của nguồn nào** (Hỏi-3): S05 và S08 đang `paused` thì vẫn `paused`, lý do lấy từ
  `note`. Đổi một nguồn sang `draft` hay `retired` là quyết định dữ liệu, làm bằng một lệnh UPDATE có lý do sau gộp.
- **`status` là nguồn sự thật; `enabled` là bản soi giữ cho bên đọc và bên ghi cũ.** Trigger `BEFORE INSERT OR UPDATE`
  `source_groups_dong_bo_enabled` giữ hai cột khớp:
  - INSERT không nêu `status` → `status` suy từ `enabled` (`true` → `active`, `false` → `paused` kèm lý do cố định
    `'tắt qua cột enabled (đường ghi cũ)'`). INSERT có `status` → `enabled := (status = 'active')`.
  - UPDATE đổi `status` → `enabled := (status = 'active')`. Đổi cả hai mà lệch nhau → `status` thắng.
  - UPDATE chỉ đổi `enabled` — luật theo trạng thái cũ (ma trận đủ 5 × 2, AC-10):

    | trạng thái cũ | `enabled := true` | `enabled := false` |
    |---|---|---|
    | `active` | không đổi | `paused` + lý do «tắt qua cột enabled (đường ghi cũ)» |
    | `paused` | `active`, xoá `reason`, `resume_when` | không đổi |
    | `draft` | `active` (bật lần đầu) | không đổi (vẫn `draft`) |
    | `retired` | **từ chối** — lỗi `source_groups: không bật được đơn vị retired qua cột enabled` | không đổi |
    | `completed` | **từ chối** — lỗi `… completed …` | không đổi |

    Đường cũ không được bật lại một đơn vị đã gỡ: cùng luật với route (409 khi bật nhóm `retired`).
  - CHECK `source_groups_enabled_khop_chk` (`enabled = (status = 'active')`) chốt sau trigger: không đường nào để hai cột lệch.
- Vì sao không đổi `enabled` thành cột sinh: DB local dùng chung, và cột sinh từ chối mọi lệnh ghi `enabled`. Ngay khi
  áp, ca test `che-do-thu` của mọi worktree khác (đang chèn thẳng `enabled`) và route cũ của mọi nhánh chưa gộp sẽ lỗi.
  Trigger thì trả cùng một nguồn sự thật mà không có cửa sổ gãy. Mọi câu đọc `WHERE … AND enabled` của
  `apify-facebook-collector.mjs` và `collect-chotot.mjs` (làn ZCode) chạy y như cũ, không sửa tệp nào của làn đó.

RESO: không có field. Đây là cấu hình vận hành, không phải dữ liệu tin hay căn, nên không vào `pipeline/mappings.yaml`.

## Luật chạy — `pipeline/lib/vong-doi.mjs`

```
TRANG_THAI = ['draft', 'active', 'paused', 'retired', 'completed']
isRunnable(source, unit?) → { run: boolean, ly_do: string }
```

- `source` là `{ code, status }` hoặc `null`; `unit` là `{ status }` hoặc vắng (nguồn không có đơn vị trong sổ — S01,
  S02, S03 hôm nay).
- `run = true` khi và chỉ khi `source.status = 'active'` và (`unit` vắng hoặc `unit.status = 'active'`).
- Mọi ô khác trả `run = false`, kèm một `ly_do` máy đọc được:
  `nguon-khong-co` · `nguon-<trạng thái>` · `don-vi-khong-co` (hỏi một đơn vị không có trong sổ — `unit = null`) ·
  `don-vi-<trạng thái>` · `trang-thai-la:nguon` · `trang-thai-la:don-vi`. Ô chạy được trả `ly_do = 'chay'`.
  Nguồn chặn trước đơn vị: nguồn `paused` và đơn vị `retired` cho ra `nguon-paused`.
- Trạng thái lạ (ngoài năm giá trị, `null`, chữ hoa) thì chặn (fail-closed). CHECK đã chặn ở DB; hàm vẫn chặn, phòng
  khi đọc từ chỗ khác.
- `completed` không chạy. Chạy lại nguồn một lần (S04) là việc `job.rerun` của TV7, không phải `isRunnable`.
- `docTrangThai(client, code, unitKey?)` đọc hai bảng bằng mã (không bằng tên) rồi gọi `isRunnable`.
- CLI: `node pipeline/lib/vong-doi.mjs <mã> [--unit <group_key>]` in đúng một dòng JSON `{code, run, ly_do}` (không in
  `group_key` hay `reason`, vì có thể mang tầng A). Mã thoát: 0 = chạy, 3 = không chạy, 2 = lỗi (DB, đối số). Script
  bash phân biệt được «không được chạy» với «không đọc được trạng thái».

## Đường ghi hôm nay — route `POST /api/v1/ops/source-groups`

- `toggle` `{enabled: true}`: `status = 'active'`, xoá `reason` và `resume_when`. Không bật được dòng `retired` (409).
- `toggle` `{enabled: false}`: `status = 'paused'`, `reason` lấy từ thân yêu cầu (`reason`), vắng thì dùng
  `'tắt bằng công tắc /ops/sources'` (Hỏi-1); `resume_when` lấy từ thân nếu có.
- `add`: chèn `status = 'active'`, giữ hành vi hôm nay (nhóm thêm vào là thu ngay). Nháp và người duyệt nhóm mới là việc
  của TV13c.
- `ops_audit.detail` của `toggle` thêm `from` và `to` (trạng thái trước và sau).
- Route ghi khác (`delete`, `set-mode`) giữ nguyên. Route này sẽ bị lệnh `unit.*` thay ở TV5.

## Không gian đã quét (morphological-scan, preset test-matrix)

- Chân sản phẩm: `[SUY-TỪ-REPO: docs/research/ops-tu-van-hanh-nguon-saas.md §3.4]`, `[SUY-TỪ-REPO:
  db/migrations/024_source_groups.sql]`.
- Chân ngành: vòng đời kết nối của công cụ ELT. Connection có trạng thái `active · inactive · deprecated`
  `[NGÀNH: Airbyte connection status]`; connector có cờ `paused` `[NGÀNH: Fivetran]`. Năm trạng thái ở đây là tập
  cha: tách «chưa bật lần nào» (`draft`) và «xong việc một lần» (`completed`) khỏi «ngừng hẳn» (`retired`).
- Trục A — trạng thái nguồn: 5 trạng thái + lạ + không có dòng = 7. Thước CE: CHECK năm giá trị cộng hai ca biên.
- Trục B — trạng thái đơn vị: vắng + 5 trạng thái + lạ = 7. Thước CE: như trục A.
- Trục C — đường ghi: migration backfill · route `toggle` · route `add` · SQL trực tiếp (người hay script). Thước CE:
  `git grep` mọi chỗ ghi `source_groups`/`source_registry` trên main e70e148.
- Trục D — bên đọc: `isRunnable`/CLI · script thu đọc `enabled` · freshness đọc `status = 'active'` · trang đọc
  `enabled`. Thước CE: `git grep` mọi chỗ đọc.
- Lớp cắt ngang: môi trường (local có bảng · cloud không có bảng) · chạy lại (idempotent) · **không chạm `public`
  trước gộp**: tệp 047 không có tiền tố `public.` và không tự đặt `search_path`; mọi ca chạy trên lược đồ tạm và chụp
  `public` trước/sau (cột hai bảng, `pg_proc`, `pg_trigger`, `pg_constraint`, số dòng `ops_audit`).
- Core: ma trận A × B đủ 49 ô (AC-4); A × C qua CHECK (AC-1, AC-2); C backfill (AC-3); C route (AC-6); D không gãy
  (AC-7); cắt ngang (AC-8).
- Later: nhãn «Nháp» cho `draft` trên `/ops/sources` (chưa nguồn nào ở `draft`; giao diện đi cùng PL12/ON20); CHECK
  `retired` phải có `retired_at`; bản TS của `isRunnable` cho app (TV4 cần thì chép, kèm test đồng bộ như freshness).
- Never: `isRunnable` đọc `openclaw.json` cho S03 — đơn vị S03 vào sổ ở PL12; đọc tệp gateway ở đây là thêm một đường
  chạm luật 8 mà không có lý do.

## Đặc tả UX

Không chạm giao diện: trang `/ops/sources` không đổi chữ, không đổi khuôn. Dòng bỏ ở sổ quyết định.
