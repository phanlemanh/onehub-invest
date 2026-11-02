---
schema_version: 1
feature: Người vận hành mở danh bạ người trên Ops ở máy thu, thấy số gốc của từng người, gọi được bằng một chạm và tìm được người theo SĐT; vai Người xem không thấy số
slug: people-hien-so-goc
owner: phanlemanh@gmail.com
risk_tier: T2
surfaces: [ui]
status: signed-off
approved_by: Mạnh
approved_at: 2026-11-02
design_doc: docs/superpowers/specs/2026-11-02-people-hien-so-goc-design.md
---

# Acceptance Contract: people-hien-so-goc

## Context

Hỏi-B (Mạnh chốt 30/10, `docs/research/audit-bang-nguoi-sdt-3010.md` dòng 291; `docs/ROADMAP.md` §3 mục 24): số gốc mở cho vai Vận hành và `admin` ở máy thu, `/ops/deals` hạ cổng theo, vai Người xem không thấy và không tìm theo SĐT. SD3 Hỏi-2 đã ghim «che ở mọi vai cho tới khi hàng này mở số», nên hàng này thay hai eval đo việc che: `sdt-luu-goc-e164/E8` và `sd3-lam-chat-do-danh-ba/E7`, đo lại ở AC-3.

## Criteria

- AC-1: Given lược đồ tạm có người mang bí danh `sdt` số bịa và người không có số, When vai Vận hành hay `admin` mở `/ops/people` qua page thật, Then hàng của người có số hiện dạng `0912 345 678` với liên kết `tel:+84912345678` ở cột đầu «Người», không hàng nào hiện «SĐT (đã che)», người không có số không có liên kết gọi, và bảng vẽ đủ mọi hàng máy chủ gửi cho trang đó, không dừng ở 10. (cross-layer)
- AC-2: Given người có bí danh `sdt` còn dùng và một bí danh `sdt` đã nghỉ, When vai Vận hành hay `admin` mở trang một người, Then cả hai dòng hiện số tách nhóm và liên kết gọi, dòng đã nghỉ kèm «Đã nghỉ»; giá trị lệch khuôn E.164 vẫn hiện chữ nhưng không thành liên kết. (cross-layer)
- AC-3: Given cùng lược đồ, When vai Người xem mở danh sách và trang một người qua page thật, Then HTML và cây phần tử đưa tới client không chứa số ở dạng `+84…`, `84…`, `0…` hay tách nhóm, trong khi vẫn thấy mã người, nguồn, số tin; khách và `user` không thấy trang. Cùng bộ quét trên vai Vận hành phải bắt được số. (cross-layer)
- AC-4: Given người có số `+84912345678`, When vai Vận hành hay `admin` gõ `0912345678`, `+84912345678`, `84912345678`, `0912 345 678`, `0912.345.678` hay `(+84) 912-345-678`, Then danh sách ra đúng người đó và hàng hiện đúng số vừa gõ, kể cả khi người có hai số sống. Số hợp lệ không ai có ra trạng thái trống; chuỗi dở `0912` tìm như chữ thường; người chỉ có số đã nghỉ và người đã gộp không khớp; tìm theo tên và tài khoản giữ nguyên. (cross-layer)
- AC-5: Given số có người giữ, When vai Người xem mở `/ops/people?q=<số đó>` ở cả sáu dạng của AC-4, Then tập người, tổng và ba số đầu trang bằng đúng trang không có `q`, có dòng báo chỉ vai Vận hành tìm được, trang không có ô tìm và không phản chiếu số vừa gõ. (cross-layer)
- AC-6: Given tin có tên, SĐT, ảnh và chữ bài, When mở `/ops/deals` qua page thật, Then vai Vận hành thấy tên, nhóm và nút gọi nhưng không ảnh và chữ bài; `admin` thấy đủ như cũ; vai Người xem không có trường liên hệ nào trong HTML và cây phần tử; bản cloud không có liên hệ và chú thích nói chỉ có ở máy thu. (cross-layer)
- AC-7: Given DB máy thu thật, When đối chiếu chỉ đọc qua loader, Then mọi người đang hoạt động có bí danh `sdt` (số đếm bằng SQL lúc chạy, hôm nay 314) hiện số với hai vai xem được và tìm theo chính số đó ra đúng người; vai Người xem nhận 0 số; không ghi dòng nào. (cross-layer)
- AC-8: Given mã sau khi sửa, When quét, Then `deals.ts` và `ops/deals/page.tsx` không còn gọi SĐT là tầng A, `NHAN_CHE_SDT` không còn trong `app/src`, dòng «Bí danh» của `CONTEXT.md` nói đúng quyền mới, và `sdt-luu-goc-e164/E8` cùng `sd3-lam-chat-do-danh-ba/E7` khai `superseded_by` trỏ AC-3. Các bộ test `danh_ba_ops`, `deals_phi_ly`, `sellers_chip` vẫn xanh.
- AC-9: Given bản đang chạy với phiên vai Vận hành, When xem ba màn (danh bạ khi tìm theo số, một người, Căn giá tốt) ở sáng, tối và 390px, Then số đọc được, liên kết số đầu tiên nằm trong khung nhìn khi chưa cuộn và bấm được, trang không cuộn ngang, và ba màn qua cổng thiết kế của kho.
- AC-10: Given máy thu đang chạy, When đăng nhập thật bằng tài khoản thử ba vai và tải HTML cùng dữ liệu RSC của mọi trang `/ops/people`, `/ops/people/<khoá>`, `/ops/deals`, kèm `?q=` đủ sáu dạng số của AC-4, Then vai Người xem có 0 chuỗi khớp SĐT, không tính đúng chuỗi người đó tự gõ mà Next chép lại ngay sau `?q=` trong dữ liệu trang (số ở bất kỳ chỗ nào khác vẫn tính), vai Vận hành và `admin` có ít nhất một trên cả ba trang, và trang `/ops/deals` có ít nhất một tin mang số. (cross-layer)
- AC-11: Given lược đồ tạm có người có số ít tin và người không số nhiều tin, When vai Vận hành hay `admin` mở `/ops/people` không tìm, Then người có số đứng trước, trong mỗi nhóm vẫn nhiều tin trước, và dòng mô tả bảng nói đúng thứ tự này; vai Người xem giữ thứ tự chỉ theo số tin và dòng mô tả cũ, nên thứ tự không lộ ai có số. Theo Hỏi-3. (cross-layer)

## Coverage

- Trục A — Vai phiên: khách | user | viewer | ops | admin [thước CE: `BAC_VAI` của `app/src/lib/ops-access.ts`, ma trận DBN-AC-6] → AC-1, AC-3, AC-5, AC-6, AC-10.
- Trục B — Bề mặt: danh sách | một người | tìm | Căn giá tốt | dữ liệu đưa xuống trình duyệt [thước CE: ghi chú hàng SD4 trong `docs/plan/lo-trinh.json`] → AC-1, AC-2, AC-3, AC-4, AC-6, AC-10.
- Trục C — Dạng số gõ: `0…` | `+84…` | `84…` | có dấu tách | số dở | số không ai có [thước CE: audit dòng 267, khuôn đo trên DB 314/314] → AC-4, AC-5.
- Trục D — Nơi chạy: máy thu | cloud [thước CE: `localOnlyTable("parties")`, `dealsSql({cloud})`] → AC-6, AC-7. Cloud của `/ops/people` không đổi, ca sẵn có của `danh_ba_ops` giữ.
- Chân ngành: `[NGÀNH: ITU E.164]`, `[NGÀNH: RFC 3966]`, `[NGÀNH: RESO MemberMobilePhone]` → AC-1, AC-2.

## Đường đo

- 314/314 người hiện số và tìm ra đúng người: đếm SQL + loader thật trên DB máy thu, chỉ đọc · AC-7 bảo đảm.
- Vai `ops` thấy liên hệ trên `/ops/deals`: page thật · AC-6; bản chạy thật · AC-10.
- HTML và JSON của vai `viewer` không chứa SĐT: page thật · AC-3, AC-6; đăng nhập thật · AC-10.
- Tìm một SĐT ra đúng người: ma trận · AC-4; dữ liệu thật · AC-7.

## Out of scope

- Nhãn «cùng SĐT với người…» trên trang một người (audit dòng 267, N1): không có trong câu giao, hôm nay 0 ca vì mỗi số đúng một người.
- Ảnh và chữ bài trên `/ops/deals` cho vai Vận hành (bản nháp theo Hỏi-1): câu giao chỉ hạ cổng liên hệ, route ảnh `?path=` giữ `admin`.
- Tìm theo một phần số (bản nháp theo Hỏi-2), và nhật ký ai đã xem số.
- Đưa số gốc lên cloud hay lên Invest qua hàng này.
- Thẻ duyệt `/ops/review` và các bề mặt khác có hiện người đăng: ngưỡng của hàng này chỉ tính ba bề mặt trong câu giao và ghi chú hàng (danh bạ, một người, `/ops/deals`); vai Người xem ở thẻ duyệt đã có hồ sơ `viewer-khong-thay-the-duyet` canh.

## Notes

- Con trỏ `superseded_by` chỉ hợp lệ khi hồ sơ này có chữ ký người, nên Cổng Bằng chứng không đi đường máy-thông.
- Known limits — chọn ở Cổng Bằng chứng 2026-11-02:
  - Ngoài-2: Eval đo chữ và ô thay bởi chưa khai đủ tệp nên bằng chứng có thể không bị đánh dấu cũ khi các tệp đó đổi sau này, và kỳ vọng của nó cùng AC-8 vẫn ghi hai ô trong khi thực tế đã thay ba ô.
  - Ngoài-5: Hai tài liệu nội bộ (`.claude/skills/onehub-ui/routes.md`, `scripts/check-portal-compliance.mjs`) vẫn gọi SĐT người bán hoặc Căn giá tốt là tầng A, trái quy định mới.
  - Ngoài-7: Cơ sở dữ liệu máy thu lệch cấu trúc thì Căn giá tốt vẫn hiện thẻ nhưng mất hết liên hệ, không báo lỗi và không ghi log.
  - Ngoài-8: Bằng chứng trên bản chạy thật chỉ kiểm một số trang mẫu của danh bạ, không duyệt hết mọi trang và mọi người.
  - S4 vòng 1: Test áp migration lên lược đồ thật của DB máy thu có thể đụng khoá với job thật; lần 02/11 lúc 07:19:26 UTC job `resolve-properties` mất một câu lệnh, chưa xác định đúng tệp gây ra, giám sát giữ việc riêng.
