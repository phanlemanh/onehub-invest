---
schema_version: 1
feature: Leak gate của sync cloud đỏ khi role anon còn SELECT được bất kỳ bảng hay view nào
slug: leak-gate-kiem-anon
owner: phanlemanh@gmail.com
risk_tier: T3      # pipeline/sync-cloud.mjs — dữ liệu rời máy (t3_paths)
surfaces: [pipeline, docs]
status: signed-off
design_doc: docs/superpowers/specs/2026-10-23-leak-gate-kiem-anon-design.md
approved_by: Mạnh
approved_at: 2026-10-23
---

# Acceptance Contract: leak-gate-kiem-anon

## Context

Hàng AU1 của lộ trình, đợt 0 «Cầm máu». Audit 23/10 P12: trên Supabase prod RLS tắt 37/37 bảng, role anon SELECT
được 37/37 bảng và 4 view — ai cầm anon key (khoá công khai) đọc được `sessions`, `users`, `sale_offers` qua
PostgREST. Migration 037 khoá lỗ; Mạnh áp lên prod theo runbook. Việc này thêm vào sync cloud
(`pipeline/sync-cloud.mjs`) một phép kiểm quyền anon/authenticated trên schema `public`, chạy TRƯỚC khi gửi và
SAU nhát tráo, để mọi lần quyền đọc công khai bị mở lại thì lượt sync kế dừng và báo đỏ. Ngưỡng sống từ ô cơ
hội: «Cấp lại quyền SELECT cho anon trên một bảng: lượt sync kế dừng và báo đỏ».

Source input: hàng AU1 `docs/plan/lo-trinh.json` + `_acceptance/leak-gate-kiem-anon/opportunity.md` (Mạnh gõ
«build», 23/10) + audit §6 dòng 0.2.

## Criteria

- AC-1: Given một cloud mô phỏng đã áp 037 (anon và authenticated không còn quyền trên `public`) và ba quan hệ
  PostGIS `spatial_ref_sys`, `geometry_columns`, `geography_columns` vẫn cho anon SELECT như cloud thật, When chạy
  một lượt sync, Then lượt thành công và gate không báo vi phạm nào.
- AC-2: Given cloud mô phỏng như AC-1, dữ liệu local đã khác cloud (md5 ít nhất một bảng sync khác — tiền điều kiện
  được kiểm), rồi `GRANT SELECT ON users TO anon`, When lượt sync kế chạy, Then lượt dừng ở pha `gate` với thông
  điệp chứa `(trước khi gửi)` và `anon đọc được public.users`, TRƯỚC khi nạp staging: md5 từng bảng sync trên cloud
  bằng trước lượt và staging của lượt có 0 dòng. Đối chứng đỏ: chạy cùng ô bằng bản sao `sync-cloud.mjs` bỏ chỗ kiểm
  trước khi gửi → ô phải FAIL ở vế md5.
- AC-3: Given cloud mô phỏng như AC-1, When từng loại quan hệ sau được cấp SELECT cho anon rồi chạy một lượt sync
  — view `v_ruler_p2_area`, một materialized view, một bảng phân vùng — Then mỗi lượt dừng ở pha `gate` với thông
  điệp gọi đúng tên quan hệ đó.
- AC-4: Given cloud mô phỏng như AC-1, When quyền đọc được mở bằng từng đường sau rồi chạy một lượt sync — cấp
  thẳng cho `authenticated`, cấp cho `PUBLIC`, cấp SELECT một cột, cấp qua một role mà anon là thành viên — Then mỗi
  lượt dừng ở pha `gate` với thông điệp gọi đúng role (`authenticated đọc được` cho ô authenticated, không chứa
  `anon đọc được`), đúng tên quan hệ, đúng đường cấp và một lệnh gỡ (`gỡ: REVOKE …`) nhắm đúng đường đó.
- AC-5: Given cloud mô phỏng có một bảng thường tên `spatial_ref_sys_copy` cấp SELECT cho anon, When chạy một lượt
  sync, Then lượt dừng ở pha `gate` gọi tên bảng đó — chỉ ba quan hệ PostGIS là thành viên extension `postgis` được
  chừa.
- AC-6: Given cloud mô phỏng không có role `anon`, When chạy một lượt sync, Then lượt dừng ở pha `gate` với thông
  điệp `cloud không có role anon` (không cho qua khi không kiểm được).
- AC-7: Given cloud mô phỏng như AC-1, When quyền SELECT cho anon trên một bảng sync được cấp GIỮA lượt (sau phép
  kiểm trước khi gửi, lúc tráo), Then lượt dừng ở pha `gate` với thông điệp chứa `(sau tráo)` và gọi tên bảng đó;
  cùng lượt không có hook cấp quyền thì xanh.
- AC-8: Given mỗi ô đỏ của AC-2 đến AC-5, When áp đúng lệnh gỡ mà thông điệp của ô đó in ra, Then lượt kế của ô đó
  thành công — số ô gỡ xanh bằng số ô đỏ.
- AC-9: Given cloud mô phỏng nay mặc định đã áp 037, When chạy lại các ca cũ của sync nguyên tử (`stage`, `atomic`,
  `fail`, `fidelity`, `keep`, `pii`, `overlap`, `allow`) và test đơn vị của pipeline, Then tất cả vẫn xanh.
- AC-10: Given `docs/ops/supabase-lock-anon-rls.md` sau vòng, When Mạnh đọc mục «Leak gate kiểm anon», Then thấy:
  thứ tự triển khai (áp 037 lên prod, chạy `--kiem-anon` trên prod và thấy sạch, rồi mới merge; ngược lại mọi lượt
  sync dừng đỏ), cách đọc dòng `SYNC FAIL [gate] …` (role, quan hệ, đường cấp, lệnh gỡ), cách gỡ đúng (chạy lệnh gỡ
  in trong thông điệp, không tắt gate), và vì sao ba quan hệ PostGIS được chừa. Không câu nào bảo agent tự sửa quyền
  trên prod. (judgment)
- AC-11: Given đường chạy thật của tiến trình sync (`runMain`, cái `main()` gọi) trỏ vào cloud mô phỏng, When anon
  đọc được `users`, Then tiến trình in một dòng khớp `SYNC FAIL [gate] … anon đọc được public.users` và trả mã thoát 1;
  cloud sạch thì in `leak gate PASS` và mã 0. Và chế độ chỉ đọc `--kiem-anon` trên cùng cloud: chỉ gửi câu `SELECT`,
  in từng vi phạm và trả mã 1 khi có, mã 0 khi sạch.

## Coverage

Quét bằng `morphological-scan` (preset risk-premortem + test-matrix). Chân ngành: [NGÀNH: Supabase docs «Securing
your data / Row Level Security» — role `anon` và `authenticated` của PostgREST; PostgreSQL docs `has_table_privilege`,
`has_any_column_privilege` tính PUBLIC và role thành viên]. Chân sản phẩm: [SUY-TỪ-REPO:
docs/audit/2026-10-23-hien-trang-va-lo-trinh.md] P12 + [SUY-TỪ-REPO: docs/ops/supabase-lock-anon-rls.md] Known limits.

- Trục loại quan hệ trong `public`: bảng (AC-2) · view (AC-3) · materialized view (AC-3) · bảng phân vùng (AC-3) ·
  bảng ngoại (Later — cloud không dùng FDW). [thước CE: `relkind` của pg_class]
- Trục đường mở quyền: GRANT cho anon (AC-2) · cho authenticated (AC-4) · cho PUBLIC (AC-4) · cấp cột (AC-4) · qua
  role thành viên (AC-4) · default privileges cấp cho bảng mới (= GRANT lúc tạo, phủ bởi AC-2) · tắt RLS mà không
  cấp quyền (Never — không có quyền thì không đọc được). [thước CE: hàm `has_*_privilege`]
- Trục thời điểm: trước khi gửi (AC-2) · giữa lượt (AC-7) · sau khi gỡ (AC-8).
- Trục ngoại lệ: ba quan hệ PostGIS thành viên extension (AC-1) · bảng trùng-gần tên không thuộc extension (AC-5) ·
  thiếu role anon (AC-6).
- Cross-cutting: không phá các ca sync cũ (AC-9); người vận hành đọc được đỏ và gỡ đúng (AC-10).

## Đường đo

- Ngưỡng «Cấp lại quyền SELECT cho anon trên một bảng: lượt sync kế dừng và báo đỏ» ←
  `cd pipeline && node scripts/check-cloud-sync.mjs anon` (AC-2, AC-11; đối chứng AC-1, AC-8). Đây là PROXY: cloud
  mô phỏng (Postgres + PostGIS, role anon/authenticated tự dựng, 037 áp), không phải Supabase prod.
- «Xanh khi sạch» trên prod thật ← `node pipeline/sync-cloud.mjs --kiem-anon` (AC-11, chỉ đọc) do Mạnh chạy sau khi
  áp 037; kết quả là điều kiện merge (Notes). Trước đó «danh sách chừa đủ cho prod» chưa được đo.

## Out of scope

- Quyền EXECUTE trên hàm (`/rpc`) và schema ngoài `public` (`graphql_public`, `storage`, `auth`) — câu giao chỉ nói
  bảng và view; hàm đã đo ở `check-supabase-lock.sh`.
- Đo trực tiếp trên Supabase prod trong vòng — đường đo prod chỉ đọc là `check-supabase-lock.sh cloud`, cần khoá
  của Mạnh.
- Tự áp 037, tự REVOKE trên prod khi gate đỏ — gate chỉ dừng và nói; sửa quyền prod là việc của Mạnh.
- Đẩy cảnh báo `SYNC FAIL` lên watchdog hay `/ops` (AU3).

## Notes

- KHÔNG xin merge trước khi Mạnh áp 037 lên Supabase prod (BOI-CANH §5 dòng 1, luật đợt): gate merge khi anon còn
  đọc 37/37 bảng thì mọi lượt sync dừng đỏ.
- Điều kiện merge thứ hai (Mạnh duyệt Hỏi-1 theo khuyến nghị ở Cổng Phạm vi 23/10): `--kiem-anon` chạy trên prod
  đã áp 037 trả mã 0; mã thoát và dòng in dán vào PR trước khi merge.
- Known limits — chọn ở Cổng Bằng chứng 2026-10-23:
  - Ngoài-1: Khi khoá công khai chỉ là thành viên gián tiếp của một role có quyền, lệnh gỡ in ra không có tác dụng và dòng đỏ lặp lại; sổ vận hành chưa chỉ cách tra chuỗi role.
  - Ngoài-2: Cùng ca role lồng nhau: sổ vận hành hứa «xanh hoặc đỏ với đường kế tiếp» nhưng ca này đỏ lại đúng dòng cũ.
  - Ngoài-3: Mỗi dòng đỏ chỉ nêu một đường cấp; quyền mở qua nhiều đường phải gỡ vài lượt.
  - Ngoài-4: Lệnh gỡ chỉ nhắm một đường cấp mỗi role và quan hệ; nhiều đường hoặc chuỗi role lồng nhau thì một lần gỡ không đủ.
  - Ngoài-5: Phép thử chưa có ô chứng rằng ba quan hệ PostGIS chỉ được chừa khi thật sự thuộc extension postgis (mới thử trục tên).
