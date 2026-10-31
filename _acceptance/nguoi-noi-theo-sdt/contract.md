---
schema_version: 1
feature: Danh bạ Người gộp người theo SĐT vào người theo tài khoản cùng nguồn khi nối một–một, mỗi lần gộp có vết và tách lại được
slug: nguoi-noi-theo-sdt
owner: phanlemanh@gmail.com
risk_tier: T2
surfaces: [cli]
status: approved
approved_by: Mạnh
approved_at: 2026-10-31
design_doc: docs/superpowers/specs/2026-10-31-nguoi-noi-theo-sdt-design.md
---

# Acceptance Contract: nguoi-noi-theo-sdt

## Context

Danh bạ Người (DB2b, 055) tách người theo SĐT khỏi người theo tài khoản; 0 người mang cả hai, trong khi đa số SĐT S03/S05
nối một–một với đúng một người gửi (đo 31/10: S03 170/187, S05 13/14). Mạnh chốt SĐT là khoá chính để nối Người (audit hàng
duyệt 30/10 §7). Hàng HD13, phần cùng nguồn; khác nguồn chờ HD12.

Source input: `opportunity.md` · vùng: `pipeline/lib/danh-ba-nguoi.mjs`, `pipeline/dung-nguoi.mjs`,
`pipeline/scripts/danh-ba-nguoi*.test.mjs`, `pipeline/scripts/nap-lai-nguoi.mjs`.

## Criteria

- AC-1: Given tin S03/S05 sống có SĐT và người gửi, When chọn gộp, Then người theo SĐT p gộp vào người theo tài khoản a
  cùng nguồn đúng khi p có một người gửi a trên mọi tin sống và a có một SĐT p; không gộp khi p có ≥ 2 người gửi, khi a có
  ≥ 2 SĐT, khi tin mang cặp đã nghỉ, khi tài khoản và SĐT khác nguồn, khi tin là S06, khi người theo SĐT đang `merged` hay
  `split`.
- AC-2: Given SĐT p đã gộp vào người a, When dựng danh bạ, Then tin chỉ có SĐT p (không người gửi) nhận vai người đăng trên
  người a (phương pháp parser, lớp observed), không trên người theo SĐT; tin có tài khoản giữ vai như trước.
- AC-3: Given DB thử có cặp một–một, When dựng danh bạ một lượt, Then người theo SĐT có `status = merged`, `merged_into` = người
  tài khoản; đúng một dòng `registry_events` loại `gop` cho mỗi lần gộp (related_keys = {người tài khoản}, lý do và người làm
  khác rỗng); bí danh của người bị gộp còn nguyên; vai parser của người bị gộp rút với lý do `gop-nguoi` và có vai cùng tin
  trên người tài khoản.
- AC-4: Given lượt một vừa gộp, When dựng danh bạ lượt hai không đổi dữ liệu, Then lượt hai ghi 0 gộp, 0 sự kiện, 0 người,
  0 bí danh, 0 vai mới, 0 vai rút.
- AC-5: Given SĐT dùng chung bởi hai người gửi và một người gửi dùng hai SĐT, When dựng danh bạ, Then không người nào trong
  các ca đó bị gộp, và bộ dựng trả về và in số SĐT nhiều người gửi và người gửi nhiều SĐT theo nguồn.
- AC-6: Given một lần gộp, When tách bằng `dung-nguoi.mjs --tach <party_key> --ly-do «…»`, Then người bị gộp về `status = split`,
  `merged_into` rỗng, có một dòng `registry_events` loại `tach`; vai sống sau tách bằng vai sống trước lần gộp (theo tin,
  người, phương pháp); không dòng nào của bốn bảng bị xoá; lượt dựng sau không gộp lại người ấy.
- AC-7: Given lượt dựng xong trên dữ liệu bất kỳ, When gom mỗi người về người cuối của chuỗi `merged_into`, Then không người
  cuối nào mang hai SĐT khác nhau, và không lần gộp nào nối hai người khác nguồn.
- AC-8: Given DB thử chép từ DB máy thu (055 + 060 nạp trong giao dịch), When chạy thước nạp lại hai lượt trong một giao dịch
  ROLLBACK, Then lượt một gộp đúng bằng số cặp một–một chưa gộp đếm độc lập trước lượt (kiểm N1 của `do-danh-ba-sdt`, tệp
  không đổi trong vòng, nhận cặp đã gộp qua `parties.status = merged`), N1 sau lượt bằng 0, mỗi lần gộp trỏ đúng người tài
  khoản của người gửi mà thước tự rút, lượt hai gộp 0, AC-7 đúng; đối chứng luật bỏ vế «người gửi có một SĐT» làm thước đỏ.
- AC-9: Given lệnh tách, When party_key không có, người không ở `merged`, hay thiếu `--ly-do`, Then lệnh thoát khác 0 với lời
  nói rõ lý do và không ghi dòng nào (thiếu `--ly-do` thì thoát 2 trước khi mở kết nối DB).
- AC-10: Given mã nguồn sau vòng, When đọc tĩnh, Then mọi câu SQL của bộ dựng và của `dung-nguoi.mjs` không đọc bảng tầng A, và chỉ ghi `parties`
  bằng UPDATE trạng thái/merged_into, `registry_events` bằng INSERT.

## Coverage

Trục (quét hình thái, preset test-matrix):
- Dáng cặp: một–một · SĐT nhiều người gửi · người gửi nhiều SĐT · tin chỉ SĐT · tin nghỉ · khác nguồn · S06 → AC-1, AC-2, AC-5.
- Trạng thái người theo SĐT: active · merged · split → AC-1, AC-4, AC-6.
- Thao tác: gộp · lượt hai · tách · tách sai → AC-3, AC-4, AC-6, AC-9.
- Mức dựng: hàm thuần · DB thử viết tay · dữ liệu thật chép máy thu · đọc tĩnh → AC-1/2, AC-3..6/9, AC-8, AC-10.
- Bất biến: không người hai SĐT · không gộp khác nguồn · không xoá dòng → AC-7, AC-6.

## Out of scope

- OOS-1: Gộp khác nguồn (cần SĐT S06 của HD12).
- OOS-2: Thẻ duyệt `/ops/review` cho ca nhiều–nhiều — chỉ đếm và in ở hàng này (cần app).
- OOS-3: Bộ đọc theo `merged_into` ở `/ops/people`, judge (`agent/`) và kiểm N2 của `do-danh-ba-sdt`.
- OOS-4: Tự tách khi cặp đã gộp thôi một–một ở lượt sau.
- OOS-5: Áp 055/060 lên DB máy thu và chạy gộp trên dữ liệu thật ngoài giao dịch ROLLBACK (bước triển khai riêng, Mạnh duyệt).

## Đường đo

Ngưỡng ở `opportunity.md`: SỐNG = «Dựng lại danh bạ trong giao dịch ROLLBACK: mọi cặp tài khoản cùng SĐT về một Người; lượt
hai gộp 0; không Người nào gộp hai SĐT khác nhau mà không có bí danh nối; tách lại một lần gộp không mất dữ liệu».
- «mọi cặp … về một Người» (theo luật một–một, sổ quyết định) — AC-8 trên dữ liệu thật, AC-3 trên DB thử.
- «lượt hai gộp 0» — AC-4, AC-8.
- «không Người nào gộp hai SĐT khác nhau» — AC-7, AC-8 (đối chứng đỏ).
- «tách lại không mất dữ liệu» — AC-6, AC-9.
