---
schema_version: 1
feature: "Giá trị wanted → inquiry «Yêu cầu» trong Ý định tin, mô hình Listing (bên bán) ↔ Yêu cầu (bên mua) ở CONTEXT.md, và ba chữ «tin» chỉ bài ở /ops/collections"
slug: wanted-thanh-inquiry
owner: phanlemanh@gmail.com
risk_tier: T3
surfaces: [config, docs, ui]
status: implemented
design_doc: docs/superpowers/specs/2026-10-27-wanted-thanh-inquiry-design.md
approved_by: Mạnh
approved_at: 2026-10-27
---

# Acceptance Contract: wanted-thanh-inquiry

## Context

Hướng B (ROADMAP §3 #21, Mạnh 27/10): listing là mọi tin niêm yết theo RESO. Mạnh chốt thêm hai điều cùng ngày:
- nhu cầu mua nhà gọi là Inquiry, thay cho `wanted`;
- Listing là bên bán, Inquiry là bên mua — một mô hình đối xứng, nhãn chung «Yêu cầu» (Mạnh «Đồng ý»).

Trục «Ý định tin» (`listing_intent`) chưa có cột: PL5 (migration 046) sẽ tạo. Thứ đã ghi xuống chỉ là 1 dòng
`ref_lookup` ở local và cloud. Vòng này đổi giá trị đó trước PL5, và ghi mô hình đối xứng vào `CONTEXT.md`. Kèm Đ5: ba
chữ «tin» ở `/ops/collections` đang chỉ bài thô.

Source input: `docs/audit/2026-10-27-tu-ngu-tin-listing.md` (Đ1, Đ5) và lời Mạnh 27/10 trong phiên.

## Criteria

- AC-1: Given khối `enums:` của `pipeline/mappings.yaml`, When bộ đọc sổ nạp nó, Then trục `listing_intent` có đúng bốn
  code theo thứ tự `offer`, `inquiry`, `not_listing`, `unknown`.
  - Nhãn: «Tin rao» · «Yêu cầu» · «Không phải tin rao» · «Chưa rõ»; `term_vi` «Ý định tin» giữ nguyên.
  - `rationale` nêu mô hình đối xứng (yêu cầu là bên mua, gần nhất `SavedSearch`).
  - Sổ không còn code `wanted` hay nhãn «Tin tìm mua, tìm thuê».
  - Tám trục còn lại không đổi byte nào.
- AC-2: Given sổ đã đổi, When chạy `node pipeline/vocab.mjs --write` rồi `--check`, Then cả bốn đích khớp sổ.
  - Tệp sinh của app mang code `inquiry` và nhãn «Yêu cầu»; tệp của pipeline và agent chỉ mang code `inquiry` (không có
    nhãn).
  - Không đích nào còn code `wanted` hay nhãn «Tin tìm mua, tìm thuê».
- AC-3: Given một DB riêng dựng từ `db/migrations` (không phải DB `oneinvest`; nơi dựng theo Hỏi ở Cổng Phạm vi), When áp
  `050_wanted_thanh_inquiry.sql`
  sau 043, Then `vocab.mjs --check-db` khớp sổ.
  - Trước khi áp 050: `--check-db` đỏ và nêu `inquiry` (đối chứng).
  - Sau khi áp: dòng `(listing_intent, inquiry)` có nhãn «Yêu cầu», `sort_order` 2, `is_local` true. Không còn dòng
    `wanted`. Số dòng của mọi trục không đổi.
  - Áp lần hai: không lỗi, cùng kết quả.
  - DB riêng bị xoá sau lượt chấm, kể cả khi test lỗi giữa chừng (xoá trong `finally`); sau lượt không còn DB nào tên
    `oneinvest_u1_inquiry_%`.
  - Hàm xoá chỉ nhận tên đúng khuôn `oneinvest_u1_inquiry_<số>`; tên khác → từ chối, không xoá gì, thoát khác 0.
  - DB `oneinvest` không bị chạm.
- AC-4: Given cây kho sau vòng, When quét tên cũ, Then chỉ còn ở bảng lịch sử, hoặc trên dòng ghi việc đổi tên.
  - Ma trận dạng tên cũ, viết trước — mỗi dạng một ca cấy, mỗi ca đúng 1 dòng đỏ:

    | Dạng | Ví dụ |
    |---|---|
    | nháy kép | `"wanted"` |
    | nháy đơn | `'wanted'` |
    | backtick | `` `wanted` `` |
    | sau `code:` | `code: wanted` |
    | trong chuỗi liệt kê nối bằng gạch đứng hoặc `/` | `offer\|wanted`, `offer/wanted` |
    | nhãn cũ | «Tin tìm mua, tìm thuê» |

  - Biến `wanted` trong code (`const wanted = …`) không tính.
  - Bảng lịch sử, viết trước và chép nguyên văn vào răng `rang/con-ten-cu.mjs`:

    | Mục | Vì sao giữ |
    |---|---|
    | `db/migrations/043_ref_vocabulary.sql` | migration đã commit, bất biến |
    | `docs/ops/cloud-schema-catchup-2026-10-26-043.sql` | bản đã áp lên cloud, khoá sha256 |
    | `_acceptance/so-tu-vung-mot-nguon/**` | hồ sơ PL6 đã ký |
    | `docs/superpowers/specs/2026-10-26-so-tu-vung-mot-nguon-design.md` | design PL6 |
    | `docs/superpowers/plans/2026-10-26-so-tu-vung-mot-nguon.md` | plan PL6 |
    | `docs/architecture/classification-enrich-review.md` | review 23/10 |
    | `docs/audit/2026-10-27-tu-ngu-tin-listing.md` | bản soát dẫn tới vòng này |
    | `docs/superpowers/specs/2026-10-27-wanted-thanh-inquiry-design.md` | design của vòng này |
    | `docs/superpowers/plans/2026-10-27-wanted-thanh-inquiry.md` | plan của vòng này |
    | `db/migrations/050_wanted_thanh_inquiry.sql` | migration đổi giá trị phải gọi tên cũ |
    | `docs/ops/cloud-schema-catchup-2026-10-27-050.sql` | khối ĐO TRƯỚC + ÁP phải gọi tên cũ |
    | `_acceptance/wanted-thanh-inquiry/**` | hồ sơ của vòng này |

  - Dòng ghi việc đổi tên: dòng có tên cũ cùng «→ `inquiry`» hoặc «→ inquiry» — được ở mọi tệp.
  - Mỗi chỗ còn lại là một dòng đỏ `<đường>:<dòng>`. Răng in số chỗ khớp của từng mục trong bảng, kể cả mục 0 chỗ.
  - Đối chứng: sáu ca cấy của ma trận trên bản sao (ca liệt kê cấy vào bản sao `agent/src/agents/enrich-text.ts`) → mỗi
    ca đúng 1 dòng đỏ nêu đúng đường; cấy biến `const wanted = 1` → 0 dòng đỏ.
- AC-5: Given docs sống, When đọc, Then chúng mang mô hình và tên mới.
  - `CONTEXT.md` có khối **Yêu cầu** (bên mua: dịch vụ ở `kind` cùng bộ mã với listing, loại hình, ngân sách, gắn tiêu chí
    thay vì một căn; RESO gần nhất `SavedSearch`), cùng hai khối **Yêu cầu mua**, **Yêu cầu thuê**.
  - Khối **Listing** nói rõ listing là bên bán, đối xứng với Yêu cầu.
  - Khối tạm **Yêu cầu mua** của PR #151 (ghi «vòng U1 đang làm») không còn.
  - ADR-0013 §9 và reso-khung §8: extension `ListingIntent` (offer · inquiry · not_listing).
  - ROADMAP §3 #21: «`inquiry` «Yêu cầu»».
- AC-6: Given tệp `docs/ops/cloud-schema-catchup-2026-10-27-050.sql`, When chạy
  `node scripts/check-cloud-catchup.mjs wanted-thanh-inquiry`, Then thoát 0.
  - Có khối «ĐO TRƯỚC» chỉ đọc, đếm dòng `ref_lookup` theo `wanted` và `inquiry`.
  - Có khối «ÁP» chứa nguyên văn câu `UPDATE` của migration 050; thiếu câu đó → đỏ.
  - Hồ sơ khai trong `HO_SO` của bộ kiểm.
  - Áp lên cloud KHÔNG thuộc vòng này (Out of scope).
- AC-7: Given trang `/ops/collections`, When render khối Luồng 7 ngày và ô Cổng S03, Then không chữ «Tin» nào chỉ bài
  thô.
  - Nút chế độ thứ hai ghi `sourceLabel("S03", roles)`, ví dụ «S03 · Cộng đồng», không tiền tố «Tin»: Ops gọi nguồn bằng
    mã kèm vai trò (luật 6 AGENTS.md).
  - Thanh của ô Cổng S03 ghi «Bài S03 · Cộng đồng hôm nay».
  - Dòng căn cứ ghi «n bài bị cổng chặn».
  - Nút thứ nhất vẫn là «Listing». Markup hai component chỉ khác bản trước vòng đúng ba cặp thay trên.
  - Bản chụp «trước vòng» ghi sha main nó được chụp (`a4a47d15`) và sha256 nội dung; một bước kiểm trên clone đầy đủ render
    lại component ở sha đó với cùng props và so byte với bản chụp.

## Coverage

Bỏ quét morphological: không gian của vòng là danh sách chỗ mang tên cũ, đã kê bằng git grep (design doc §3), và AC-4
đo lại trên toàn cây. Xem dòng `descope` «bỏ coverage-scan» trong `decisions.jsonl`.

## Đường đo

Bỏ: hồ sơ không có `opportunity.md` (Mạnh giao thẳng trong phiên). Xem dòng `descope` «bỏ đường-đo».

## Out of scope

- Áp catchup lên cloud (Supabase): sau gộp, giám sát đo trước, Mạnh duyệt — cam kết ra ngoài kho.
- Áp migration 050 vào DB local :5433 dùng chung: sau gộp (luật đợt 27/10).
- Bảng lưu yêu cầu, trích ngân sách/tiêu chí, ghép yêu cầu với listing — tính năng mới, cần số đo trước (luật 11).
- Tạo cột `listing_intent` và CHECK (PL5).
- Gộp `sale_offers` + `listings` về một khái niệm listing (Đ2, hàng riêng).
- Sửa hồ sơ PL6 đã ký; câu `expected` của nó còn tên cũ là bản ghi lịch sử.

## Notes

- Số migration 050 do phiên «Điều phối liên làn Claude ↔ ZCode» cấp 27/10 (SO-MIGRATION: 050 = wanted-thanh-inquiry).
  Đo 27/10, chỉ đọc: local và cloud mỗi bên đúng 1 dòng `wanted`.
- PL5 (046, P2) tạo cột `listing_intent` với giá trị `inquiry` (giám sát đã chuyển lời).
- Không đụng `stg_*`, DATA-CONTRACT hay collector.
