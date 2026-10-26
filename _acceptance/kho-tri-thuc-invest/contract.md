---
schema_version: 1
feature: kho tri thức riêng tư đi kèm — nguồn của mọi bản phạm vi đang dùng là trang tri thức ghim băm
slug: kho-tri-thuc-invest
owner: phanlemanh@gmail.com
risk_tier: T2
surfaces: [cli]
status: implemented
approved_by: Mạnh
approved_at: 2026-10-26
---

# Acceptance Contract: kho-tri-thuc-invest

## Context

Kit 2.34.0 có tầng tri thức theo LLM Wiki (TT1–TT5). Trước vòng này, khoá `nguon` của 10 bản phạm vi trong
`docs/plan/` là chữ tự do, trỏ lẫn tệp trong kho, phiên chat, tệp chỉ có ở một máy và issue — ô mở việc không mang
nguồn, phiên mở vòng đọc hay không là tuỳ. Kho công khai từ 23/10, nên tài liệu thô không được nằm trong kho.

Mạnh duyệt 26/10 (thẻ bước 1 của phiên dựng kho, nguyên văn «đặt tên là onehub-invest-tri-thuc để phân biệt với các kho
khác và duyệt theo khuyến nghị»): kho riêng tư `phanlemanh/onehub-invest-tri-thuc` chỉ cho onehub-invest, clone ở
`~/dev/onehub-invest-tri-thuc`; khai `tri_thuc` với `cong_khai: true` và `kho`; đủ 10 bản phạm vi; gói `tri-thuc` cài
scope local; hồ sơ T2.

Căn cứ: kit `docs/findings/2026-10-24-tang-tri-thuc-llm-wiki.md` §3.1, §3.5; `skills/acceptance/references/tri-thuc-template.md`;
CHANGELOG 2.34.0 TT1–TT3 (giới hạn «răng phủ không có đường đọc-cũ»); AGENTS.md luật 6 (sửa đổi ADR-0007 26/10).

## Criteria

- AC-1: Given `_acceptance/config.yaml`, When bộ đọc `tri-thuc-khoa.cjs` của kit đọc khối `tri_thuc`, Then `cong_khai`
  là true, `kho` = `onehub-invest-tri-thuc` / `../onehub-invest-tri-thuc` / remote GitHub, không khai `noi`, 0 lỗi; gốc giải
  về cạnh checkout chính (không theo worktree); kho trên GitHub là PRIVATE.
- AC-2: Given danh sách chép `INIT-CI-COPY-LIST` của kit 2.34.0, When lọc các tệp mang nhãn `[only-if-declared: tri_thuc]`,
  Then đủ 7 tệp có trong kho và trùng byte bản cài.
- AC-3: Given kho riêng ở máy này, When chạy `/tri-thuc:kiem`, Then xanh «12 trang, 12 raw, 0 lỗi»; kho riêng không có
  thay đổi chưa commit hay commit chưa đẩy.
- AC-4: Given 10 bản phạm vi `docs/plan/pham-vi-*.md`, When chạy răng phủ `cat-luot.mjs --pham-vi … --lo-trinh`, Then mỗi
  bản có `nguon` là đúng một đường trỏ băm `onehub-invest-tri-thuc:wiki/dot/<đợt>.md#<băm>`, 0 lỗi `[nguon-*]`; 9 bản 0 lỗi;
  `pham-vi-ops-noi-that-2410` còn đúng 3 lỗi có từ trước trên main (mốc OM1, OM2, mã YC9c).
- AC-5: Given bản chép tạm của kho tiêu thụ và kho riêng đặt cạnh nhau, When áp từng đột biến (băm lệch · nguồn chữ tự do ·
  trỏ raw thay trang · sửa một byte raw · trang đợt bỏ một mã), Then mỗi đột biến đỏ đúng mã lỗi; và khi máy không có kho
  riêng (như CI) răng phủ KHÔNG đỏ — cảnh báo «không đọc được ở đây», lint thoát 3.
- AC-6: Given kho công khai và kho riêng, When soát, Then kho công khai không có tệp tri thức nào; mọi raw loại `phien`,
  `issue`, `tep-may`, mọi trang wiki và `TRI-THUC.md` có 0 tên nguồn thật (bộ quét lấy tên từ migrations + `source_registry`
  local); mọi raw loại `tep-kho` trùng byte một bản đã có trên `origin/main` của kho công khai.
- AC-7: Given checkout chính, When soát cài gói, Then `tri-thuc@acceptance-gate-kit` có bản ghi scope local cho
  `~/dev/onehub-invest`, bật trong `.claude/settings.local.json` (gitignored); `.claude/settings.json` không đổi so với nền.
- AC-8: Given nhánh so với main, When liệt kê tệp đổi, Then chỉ có config, 7 tệp kit, dòng `nguon` của 10 bản phạm vi,
  BOI-CANH, ROADMAP, hồ sơ này và tệp máy sinh; `product-map --check` khớp; `check-lo-trinh.sh static` không có FAIL mới
  so với nền.

## Coverage

- Bỏ coverage-scan — vòng dựng hạ tầng tài liệu; trục: khai (AC-1, AC-2), đúng (AC-3, AC-4), có răng (AC-5),
  riêng tư (AC-6), không chạm T3 (AC-7), phạm vi (AC-8).

## Out of scope

- Dọn mốc OM1/OM2 và mã YC9c của `pham-vi-ops-noi-that-2410` (đỏ có từ trước) — việc cắt lại lộ trình.
- Sửa `check-lo-trinh.sh static` bước 5 (đã FAIL trên main vì cảnh báo `moc-ngoai-da-bo` của OM1/OM2).
- Ghi `research-local/` và các tài liệu nghiên cứu khác chưa là nguồn của bản phạm vi — ghi dần bằng `/tri-thuc:ghi`.
- Bật gói `tri-thuc` ở cấp kho (`.claude/settings.json`, T3) — hồ sơ riêng nếu cần.
- Lint nghĩa (trái nhau, cũ) và tra theo nghĩa — kit để chờ điều kiện.

## Notes

- Hình dạng: khi khai `kho`, kit coi kho riêng là gốc tri thức — cả raw lẫn trang ở đó; kho công khai chỉ giữ khối khai
  và đường trỏ băm. Không có thư mục tri thức trong kho nên không thêm gì vào `t1_skip_globs`.
- Nguồn ngoài kho công khai (ghi chú phiên, BOARD liên làn, issue #9, tệp quyết định) che tên nguồn bằng mã S0x trước khi
  ghi (bộ che `pipeline/lib/mask-source-names.mjs` + `source_registry` local). Raw `tep-kho` chép nguyên vì đã công khai.
- Báo cáo audit Ops prod 24/10 (có tên nguồn thật) KHÔNG ghi; trang đợt ops-noi-that ghim bản phạm vi đã chép đủ `OPS-n`.
- Kho riêng mang một dòng `secrets.allowed` cho chuỗi DB local dev — chép đúng dòng kho công khai đã cho phép.
- Giới hạn đã biết: «trang tóm đã làm sạch» là lời (kit §5); bộ quét chỉ biết tên nguồn có trong registry, không bắt
  được định danh tài khoản thu hay tên viết khác.
