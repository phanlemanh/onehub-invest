---
schema_version: 1
feature: Đồng bộ cloud nguyên tử — prod không trống/thiếu dữ liệu giữa các lượt sync; chốt luật sale_offers lên cloud
slug: cloud-sync-atomic
owner: phanlemanh@gmail.com
risk_tier: T3      # pipeline/sync-cloud.mjs (dữ liệu rời máy, PII tầng A)
surfaces: [pipeline, config, docs]
status: draft
design_doc: docs/superpowers/specs/2026-10-23-cloud-sync-atomic-design.md
approved_by:
approved_at:
---

# Acceptance Contract: cloud-sync-atomic

## Context

`pipeline/sync-cloud.mjs` (launchd 15') TRUNCATE 21 bảng cloud rồi nạp lại qua PostgREST: prod
đọc thấy rỗng/thiếu ~7' mỗi chu kỳ (đo 08:30/08:37 ngày 23/10), lượt gãy để cloud trống tới lượt
lành; TRUNCATE CASCADE `areas` xoá luôn `saved_markets` của người dùng; mọi cột `date` lên cloud
lùi một ngày (node-pg đọc theo giờ máy +07). Thay bằng: nạp vào bảng tạm jsonb ở schema riêng
`sync_stage` (không phơi PostgREST, không cấp anon) qua Management API, rồi tráo bằng MỘT giao dịch
DELETE + INSERT (đọc đồng thời thấy cũ tới COMMIT, rồi thấy trọn mới). Thiết kế + phương án đã
loại: design doc ở frontmatter.

Source input: lời giao của phiên điều phối làn merge (`local_23b003f1…`), phát hiện từ phiên
vercel-prod-setup.

## Criteria

- AC-1: Given DB mô phỏng cloud mang dữ liệu một lượt trước KHÁC lượt mới ở mọi bảng sync (số dòng lệch), When chạy một lượt sync có móc thử giữ giao dịch tráo mở ≥2s giữa DELETE và INSERT, trong lúc một luồng đọc đếm lặp (≤100ms/lần, mỗi lần một snapshot) mọi bảng sync và `v_ruler_p2`/`v_ruler_p2_area`, Then ≥5 lần đọc rơi vào lúc giao dịch tráo đang mở và TẤT CẢ thấy trạng thái cũ; không lần đọc nào thấy 0 ở bảng vốn có dữ liệu; không lần nào lẫn (bảng cũ cạnh bảng mới); chiều đỏ cùng fixture: (i) bộ nạp TRUNCATE-rồi-nạp kiểu cũ và (ii) chính SQL tráo nhưng gửi từng câu tự COMMIT cùng móc thử — luồng đọc bắt được 0 hoặc lẫn.
- AC-2: Given DB mô phỏng cloud có dữ liệu lượt trước, When lượt sync gãy (a) giữa lúc nạp staging (lỗi bắt được), (b) bên trong giao dịch tráo (bảng đích có cột NOT NULL không mặc định mà local không gửi), (c) vì cloud chưa có `sync_stage`, hoặc (d) bị kill -9 giữa pha nạp, Then md5 mọi bảng sync không đổi; (a)(b)(c) thoát ≠ 0 kèm thông điệp nêu pha gãy; (a)(b) tự xoá staging theo `run_id` của mình trước khi thoát; (c) không câu DDL nào được gửi; (d) staging bỏ dở bị lượt kế dọn khi `staged_at` quá 2 giờ (lùi giờ trên chính dòng writer thật ghi), còn staging dưới 2 giờ của một lượt khác không bị đụng.
- AC-3: Given một lượt sync lành, When so cloud mô phỏng với local, Then mỗi bảng FILL (tên cloud qua RENAME) cùng số dòng và cùng md5 trên các cột được gửi (theo AC-11); mọi cột `date` khớp đúng ngày local; và khi cloud lệch schema — (i) thiếu một cột local có: lượt vẫn lành, in WARN «lệch schema» nêu tên cột; (ii) có thêm cột generated hoặc cột có mặc định mà local không có: lượt vẫn lành, cột ấy giữ giá trị của cloud.
- AC-4: Given cloud mô phỏng có `saved_markets` trỏ các `areas.id`, When chạy sync, Then dòng trỏ area còn ở local còn nguyên và tổng số dòng `saved_markets` không đổi khi local không bớt area; bảng ngoài FILL không bị TRUNCATE/DELETE trực tiếp; khi một bảng FILL ở local tụt dưới 50% số dòng đang có trên cloud (vd local đang dựng lại `areas`), lượt dừng trước tráo, thoát ≠ 0, md5 mọi bảng cloud và `saved_markets` không đổi; area biến mất thật khỏi local thì xử lý theo đáp án Hỏi-3.
- AC-5: Given sync chạy, When bắt payload `sync_stage.rows` giữa lượt và đọc mã nguồn, Then không payload nào mang `sale_offers.seller_phone`, `sale_offers.seller_name`, `sellers.name`, `properties.seller_name`; FILL vẫn không có bảng tầng A (`stg_*`, `source_registry`, `airbnb_snapshots`, `enrichment_proposals`, `review_queue`); leak gate sau tráo còn đủ các vế cũ; chiều đỏ: bản sao sync-cloud bỏ một cột khỏi danh sách loại thì thước bắt được.
- AC-6: Given migration `db/migrations/NNN_sync_stage.sql`, When áp hai lần vào DB mô phỏng cloud có role `anon`/`authenticated` và default ACL cấp toàn quyền cho hai role đó (theo số đo cloud 23/10), và vào DB không có hai role, Then mọi lần exit 0; `anon`/`authenticated` không USAGE schema `sync_stage`, không SELECT `sync_stage.rows`; catalog ngoài schema `sync_stage` (bảng, schema, ACL) giống hệt trước khi áp; chiều đỏ: bản migration bỏ các câu REVOKE thì `anon` SELECT được `sync_stage.rows`.
- AC-7: Given hai lượt sync chạy chồng nhau trên DB mô phỏng, When cả hai xong, Then không lần đọc nào thấy 0, cloud cuối cùng khớp local như AC-3, không lượt nào để lại staging, và lượt đọc local SỚM hơn không bao giờ ghi đè lượt đọc muộn hơn (lượt cũ bị từ chối ở pha tráo, thông điệp nêu lý do).
- AC-8: Given module `pipeline/`, When chạy `npm test` và `scripts/sync-pii-mutation.mjs`, Then xanh như trước (test FILL/PII tĩnh vẫn đọc được `FILL`, `PII_EXCLUDE`); import `sync-cloud.mjs` không gọi mạng.
- AC-9: Given luật được chốt ở Cổng Phạm vi (Hỏi-1), When đọc `AGENTS.md` luật 6, `.claude/rules/pii-spl.md`, ADR-0007 và chú thích đầu `sync-cloud.mjs`, Then bốn chỗ nói CÙNG một luật về `sale_offers` trên cloud và khớp hành vi của code (cột nào được gửi, cột nào băm). (judgment)
- AC-10: Given hướng dẫn `docs/ops/cloud-sync-atomic.md`, When Mạnh đọc, Then biết vì sao, thứ tự bắt buộc (Mạnh áp migration `sync_stage` lên cloud TRƯỚC khi merge; code mới gặp cloud chưa có `sync_stage` thì dừng mà không đụng dữ liệu), lệnh áp + lệnh kiểm, cách chạy lượt thử có đo bằng `cloud-sync-watch` (gồm `saved_markets` không đổi) và cách lùi về bản cũ; không bước nào giao agent tự đổi schema production. (judgment)
- AC-11: Given `sale_offers`, `sellers`, `properties` (bảng mang dữ liệu người bán), When sync dựng cột gửi lên, Then chỉ cột nằm trong danh sách CHO PHÉP tường minh được gửi (cột local mới mặc định KHÔNG lên, in WARN «cột chưa duyệt»); `sale_offers.seller_ref` lên cloud dạng băm sha256 hex 32 ký tự như `seller_phone_hash`; leak gate trên cloud thất bại khi có `seller_ref` không khớp `^[0-9a-f]{32}$`; danh sách cho phép không giao với danh sách loại; chiều đỏ: thêm một cột giả vào bảng local thì cột đó không có trong payload, và một `seller_ref` thô trên cloud làm gate đỏ.

## Coverage

Preset risk-premortem + test-matrix. Chân sản phẩm: [SUY-TỪ-REPO: pipeline/sync-cloud.mjs] ·
[SUY-TỪ-REPO: docs/ops/cloud-schema-catchup-2026-10-22.md] · đo catalog cloud chỉ đọc 23/10.
Chân ngành: [NGÀNH: PostgreSQL docs — TRUNCATE «not MVCC-safe», MVCC read committed] (căn cứ loại
lối TRUNCATE-trong-giao-dịch).

- Trục A — lúc prod đọc: trước lượt | trong lúc nạp staging | trong giao dịch tráo | sau COMMIT
  [thước CE: vòng đời lượt trong design doc] → AC-1 (luồng đọc lặp phủ cả bốn), AC-7.
- Trục B — kết cục lượt: lành (AC-3) | gãy lúc nạp staging (AC-2a) | gãy trong tráo (AC-2b) |
  chồng lượt (AC-7) | máy chết bỏ dở staging (AC-2 vế dọn) | cloud chưa có `sync_stage` (AC-10, thứ
  tự triển khai) [thước CE: các sự cố đã xảy ra 22–23/10 + launchd không chạy chồng một job].
- Trục C — lớp dữ liệu: bảng thay-trọn (AC-3) | bảng giữ-chỗ + bảng ngoài FILL tham chiếu (AC-4) |
  view phụ thuộc (AC-1 đếm view) | cột tầng A (AC-5) | cột cho phép + băm `seller_ref` (AC-11) |
  cột `date` (AC-3) | lệch schema cloud (AC-3 ii, AC-2 c) | schema tạm + quyền (AC-6) | local đang dựng dở (AC-4 chặn tụt)
  [thước CE: FK + pg_default_acl đo trên cloud].
- Trục D — luật/tài liệu: luật sale_offers (AC-9) | hướng dẫn vận hành (AC-10) | hồi quy (AC-8).
- Later: bỏ qua bảng không đổi (dấu vân tay) — chưa cần khi một lượt vừa trong 15'.
- Never: đổi tên bảng để tráo — view/FK bám OID bảng cũ (design doc).
- [GIẢ ĐỊNH] Management API chạy cả chuỗi `BEGIN…COMMIT` nhiều câu trong một kết nối như một
  simple-query (chưa đo trên cloud thật — lượt thử AC-10 sẽ lộ ra; DB mô phỏng dùng cùng cách gửi
  một chuỗi nhiều câu).
- [GIẢ ĐỊNH] Giao dịch tráo (~274k dòng) xong trong giới hạn thời gian của Management API (đo mô
  phỏng: vài giây; chưa đo cloud).

## Đường đo

Không có `opportunity.md` (vòng không đi từ Cổng Đáng) — xem dòng `bỏ đường-đo` trong sổ.

## Out of scope

- KHÔNG đưa `source_registry` lên cloud và không sửa `/api/v1/ops/coverage` — ADR-0007 cấm registry rời máy (cột `real_name`, `source_ids` tầng A); coverage còn đọc `airbnb_snapshots` raw. Coverage cloud = việc riêng (aggregate theo mã S0x).
- KHÔNG sửa RLS/quyền `anon` trên bảng `public` cloud (rủi ro bảo mật đã báo phiên điều phối — việc riêng).
- KHÔNG tự áp DDL nào lên Supabase production (luật 2): migration `sync_stage` do Mạnh áp; agent chỉ chạy lượt sync (ghi dữ liệu như launchd vẫn làm) khi có lời Mạnh.
- KHÔNG đổi `push-ops-facts.mjs`, `scripts/cloud-sync.sh`, plist launchd.
- KHÔNG thêm bước bỏ qua bảng không đổi (Later).

## Notes

- Nếu Hỏi-1 chọn (b) (ngừng đẩy sale_offers) hoặc Hỏi-2 chọn «để việc riêng»: AC-3, AC-5, AC-11, E3, E5, E11 sửa theo đáp án rồi duyệt lại Cổng Phạm vi.
- Hai điều kiện cứng của nhánh (a) do phiên điều phối làn merge đặt (23/10): danh sách cột CHO PHÉP; băm `seller_ref` + gate soi cột này → AC-11. Cột `listing_url`, `photos` hiện rỗng ở local và được cho phép như hiện trạng; khi có dữ liệu chúng có thể mang tên miền nguồn (tầng A) — xem lại khi nguồn bắt đầu điền.
- Đọc local trong MỘT giao dịch REPEATABLE READ READ ONLY để mọi bảng cùng một snapshot (pipeline có thể đang DELETE+INSERT bảng metrics lúc sync đọc).

- Câu hỏi cho người ở Cổng Phạm vi: Hỏi-1 (luật sale_offers), Hỏi-2 (sửa lệch ngày trong vòng này), Hỏi-3 (area biến mất khỏi local thì xoá `saved_markets` theo FK hay giữ) — chi tiết ở design doc và sổ quyết định. Số migration `NNN` chờ sổ chung cấp.
- Đường nền: một dòng đỏ ngoài vòng — `executors.design.ui_check` trỏ `acceptance-gate/2.32.0/scripts/design-scan.js` không còn trong cache (máy đang có 2.33.1); vòng này không chạm UI nên không dùng executor đó.
