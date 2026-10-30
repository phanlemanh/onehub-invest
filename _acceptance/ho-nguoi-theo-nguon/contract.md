---
schema_version: 1
feature: Mỗi tin có người đăng gắn với một người trong danh bạ Người của đúng nguồn ấy qua vai «người đăng» là một phát biểu có bằng chứng, và nạp lại không nhân người
slug: ho-nguoi-theo-nguon
owner: phanlemanh@gmail.com
risk_tier: T3
surfaces: [cli]
status: draft
design_doc: docs/superpowers/specs/2026-10-30-ho-nguoi-theo-nguon-design.md
---

# Acceptance Contract: ho-nguoi-theo-nguon

## Context

ADR-0016 §8, §10 Đợt 2b: vai trò là quan hệ có phát biểu, không phải thuộc tính; bảng `sellers` cũ một vai, không bí
danh, gộp liên nguồn theo SĐT. Hàng DB2b dựng danh bạ Người theo từng nguồn trên khung chung ADR-0016 §3 (khoá mờ, trạng
thái, bí danh, sự kiện) và nối mỗi tin rao với người đăng của nó.

Source input: hàng DB2b `docs/plan/lo-trinh.json` (câu giao + `bat_khi`) · `opportunity.md` (Cổng Đáng: build, Mạnh
30/10 «Xếp theo bốn làn») · ADR-0016 · luật đợt dot0-cam-mau. Hạng T3 (migration bảng mới, dữ liệu người).

## Criteria

- AC-1: Given DB thử có migration 055, When nạp 055 lần hai, Then không lỗi và lược đồ không đổi; bốn bảng `parties`, `registry_aliases`, `registry_events`, `party_roles` tồn tại với khoá người dạng `pty_<ULID>` (CHECK), `status` chỉ nhận `active|merged|split|retired`, `merged_into` bắt buộc đúng khi `merged`, `source` chỉ nhận mã `S0x`; và mọi lệnh DELETE hay TRUNCATE trên `parties`, `party_roles`, `registry_aliases`, `registry_events`, mọi UPDATE `party_roles` không phải rút có lý do, đều bị từ chối có thông điệp.
- AC-2: Given bốn enum mới (`registry_status`, `alias_kind`, `registry_event_kind`, `party_role`) khai ở `pipeline/mappings.yaml` với `dd_field: null`, lý do và ngày tra DD, When chạy `vocab.mjs --check` và `--check-db` trên DB thử, Then cả hai xanh và `ref_lookup` có đủ giá trị; When `dq-enum-vocab.mjs` chạy, Then nó ghi dòng kiểm cho các cột enum của ba bảng mới và mỗi dòng có nhãn diễn giải ở `/ops/quality` (không mã thô).
- AC-3: Given tin S06 có `seller_ref` dạng `ct:<số>`, When bộ dựng chạy, Then tin có đúng một vai `nguoi_dang` sống tới người S06 mang bí danh `tai_khoan_nguon = <số>`, phương pháp `source_field`, lớp `fact`, bằng chứng nêu `offer_id` và trường nguồn; hai tin cùng tài khoản trỏ cùng một người.
- AC-4: Given tin S03/S05 có bài trong `post_ids` mang `sender_id`, When bộ dựng chạy, Then tin có một vai `nguoi_dang` (`source_field`/`fact`) tới người của bí danh `tai_khoan_nguon = sender_id` đúng nguồn; tin có hai người gửi khác nhau có hai vai; tin không `sender_id` mà có SĐT băm có một vai `parser`/`observed` tới người theo SĐT (bí danh `sdt_bam`); tin không có cả hai không có vai và được đếm vào `khong_dinh_danh`; tin đã nghỉ vẫn được giải như tin sống.
- AC-5: Given SĐT băm của một tin, When bộ dựng giải người (theo khuyến nghị Hỏi-4), Then bí danh `sdt_bam` thuộc đúng một người theo SĐT của nguồn ấy và KHÔNG gắn vào người tài khoản nào, kể cả khi tin có đúng một người gửi (nối SĐT với tài khoản là việc gộp của Đợt 3); tin có tài khoản chỉ có vai tới người tài khoản; cùng một SĐT ở S03 và S05 sinh hai người khác nhau (không gộp liên nguồn).
- AC-6: Given bộ dựng đã chạy một lượt, When chạy lại trên cùng dữ liệu, Then 0 người mới, 0 bí danh mới, 0 vai mới, 0 vai rút; Given người gửi của một bài đổi giữa hai lượt, When chạy lại, Then vai cũ bị rút với lý do `thay-boi-luot` và vai mới được ghi, không dòng nào bị xoá; Given một bài trong `post_ids` không còn nối được ở `stg_zalo_posts` (hoặc mọi bài của tin đều mất), When chạy lại, Then vai dựa trên bài ấy được giữ, không rút và không ghi vai `parser` thay — vai chỉ rút khi có bằng chứng thay (cùng bài nối được mà người gửi khác, `seller_ref` S06 đổi, tin chỉ-SĐT nay có tài khoản).
- AC-7: Given DB thử chép từ DB local thật, When `nap-lai-nguoi.mjs` chạy hai lượt nạp lại mọi nguồn (transform S03 → S05 → S06 → `refreshBaitGap`) trong một giao dịch ROLLBACK, Then số người, số bí danh và số vai sống sau lượt hai bằng sau lượt một (và > 0 mỗi nguồn S03, S05, S06), lệnh thoát 0, DB không đổi sau lệnh; Given đối chứng cùng dữ liệu là bộ dựng bỏ tra bí danh, When chạy, Then số người lượt hai lớn hơn lượt một và lệnh thoát 1.
- AC-8: Given bảng `sellers` cũ, When bộ dựng đã chạy, Then với mọi dòng `sellers` và mỗi nguồn trong `sources` của nó, có một người sống của nguồn ấy mang bí danh `sdt_bam = phone_hash`; `nap-lai-nguoi.mjs` báo số dòng `sellers` thiếu người (= 0) và đỏ khi một dòng thiếu.
- AC-9: Given danh bạ Người chỉ dùng nội bộ ở hàng này, When đọc mã, Then `sync-cloud.mjs` không đẩy bảng nào trong bốn bảng mới và leak gate không đổi; bộ dựng chỉ ghi vai `nguoi_dang` với phương pháp `source_field` hoặc `parser` (không vai suy luận); bộ dựng không đọc bảng người dùng app hay tài khoản thu (`users`, `sessions`, `user_events`, `user_profile`, `source_registry`); cột nguồn của mọi dòng mới là mã `S0x`.
- AC-10: Given job đêm gọi `refresh-bait-gap.mjs`, When bước chạy, Then sau khi bait gap và `sellers` đã ghi, danh bạ Người được dựng trong một giao dịch riêng của cùng bước, dòng log in số người mới, vai mới, tin không định danh theo nguồn; Given bộ dựng lỗi, Then giao dịch danh bạ rollback, bait gap và `sellers` đã ghi ở lượt ấy giữ nguyên, và bước thoát khác 0 (job ghi đỏ), không nuốt lỗi.

## Coverage

- Trục A — Nguồn: S06 (tài khoản có cấu trúc) | S03 (bài Zalo, `sender_id`) | S05 (bài kênh Facebook, `sender_id`) | listing thuê ngắn hạn (không dữ liệu người đăng → ngoài phạm vi) [thước CE: đếm `sale_offer_records` + `stg_zalo_posts` DB local 30/10, design doc §1]
- Trục B — Định danh trên tin: chỉ tài khoản | tài khoản + SĐT | chỉ SĐT | hai người gửi | không gì | bài trong `post_ids` không nối được ở `stg_zalo_posts` [thước CE: S03 858 có sender · 2 hai sender · 21 chỉ SĐT · 6 không gì; S05 20 · 0 · 8 · 0; S06 27.733 chỉ tài khoản]
- Trục C — Lượt: lượt đầu | chạy lại cùng dữ liệu | dữ liệu đổi (người gửi đổi) | bài mất giữa hai lượt | tin đã nghỉ | nạp lại mọi nguồn hai lần trên dữ liệu thật | bộ dựng lỗi giữa bước đêm [thước CE: câu `bat_khi` của DB2b]
- Trục D — Bất biến khung: khoá mờ · trạng thái · chỉ-thêm · enum có ràng buộc · không liên nguồn · chỉ local · không vai suy luận [thước CE: ADR-0016 §3, §8, §9, §11; ADR-0011 Qđ 3]
- Core → AC-1…AC-10: A×B ở AC-3, AC-4, AC-5 (bài không nối được ở AC-6); C ở AC-4 (tin nghỉ), AC-6, AC-7, AC-10 (bộ dựng lỗi); D ở AC-1, AC-2, AC-5, AC-9; `sellers` ở AC-8. Quét hình thái thu gọn làm ngay trong mục này (sổ: dòng thay `bỏ coverage-scan`).
- [GIẢ ĐỊNH] `sender_id` trong `stg_zalo_posts` là định danh tài khoản người gửi tại nguồn, ổn định giữa các lần thu (8 giá trị không phải số — giữ nguyên chuỗi).

## Đường đo

- Ngưỡng «nạp lại mọi nguồn hai lần: số người và số vai không đổi» → `pipeline/scripts/nap-lai-nguoi.mjs` (đếm sau lượt 1 và lượt 2, đối chứng bỏ tra bí danh) · AC-7.
- Ngưỡng «mọi dòng sellers cũ có người tương ứng kèm bí danh nguồn» → cùng lệnh, số `sellers_thieu_nguoi` · AC-8.

## Out of scope

- Gộp người liên nguồn và hồ sơ người đã gộp (ADR-0016 Đợt 3).
- Nối người theo SĐT với người tài khoản cùng nguồn (theo khuyến nghị Hỏi-4 — gộp ở Đợt 3).
- Vai suy luận (môi giới, sàn), biến `company_ad` của S06 thành vai.
- Thay bảng `sellers` bằng view và đổi bait gap đọc danh bạ (theo khuyến nghị Hỏi-2 — hàng sau).
- Đẩy danh bạ Người lên cloud, migration Supabase (theo khuyến nghị Hỏi-3).
- Toà · trục · căn và mở `field_assertions.resource_name` (DB1).
- Người đăng listing thuê ngắn hạn (không có dữ liệu).
- Trang `/ops` xem danh bạ Người.

## Notes

- DB thử `oneinvest_p3_nguoi` dựng bằng `bash db/db-thu.sh oneinvest_p3_nguoi` (luật đợt 27/10: không thử migration chưa merge trên `oneinvest`).
- Migration 055 đã được điều phối liên làn cấp (30/10, sổ SO-MIGRATION); thử trên DB thử, không tự áp lên cloud — áp `ref_lookup` lên Supabase chờ Mạnh duyệt sau gộp.
- Hỏi-4 (luật nối SĐT): nếu Mạnh chọn lối khác — gắn SĐT chưa ai giữ vào người tài khoản duy nhất của tin — AC-5 đổi Then thành: SĐT gắn vào người tài khoản duy nhất của tin khi chưa ai giữ, không đổi chủ khi đã có người giữ, tạo người theo SĐT khi tin không tài khoản hoặc có ≥ 2 người gửi; tin chỉ-SĐT mang vai tới người đã giữ SĐT.
