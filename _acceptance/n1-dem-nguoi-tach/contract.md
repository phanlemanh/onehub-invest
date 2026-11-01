---
schema_version: 1
feature: Kiểm N1 đêm của danh bạ SĐT không đếm người đã tách là «chưa gộp», nên không đỏ vĩnh viễn sau lần tách đầu tiên
slug: n1-dem-nguoi-tach
owner: phanlemanh@gmail.com
risk_tier: T2
surfaces: [cli]
status: signed-off
veto_state: mo
veto_opened_at: 2026-11-01T06:10:00Z
approved_by:
approved_at:
design_doc: docs/superpowers/specs/2026-11-01-n1-dem-nguoi-tach-design.md
---

# Acceptance Contract: n1-dem-nguoi-tach

## Context

Hồ sơ nguoi-noi-theo-sdt (HD13) thêm lệnh tách một lần gộp: người theo SĐT về trạng thái `split` và không bao giờ bị gộp
tự động lại. Kiểm N1 của `pipeline/do-danh-ba-sdt.mjs` đếm cặp (SĐT, người gửi) một–một mà người theo SĐT chưa `merged` —
nên người đã tách bị đếm «chưa gộp» mãi và dòng `danh-ba-sdt:n1` đỏ vĩnh viễn sau lần tách đầu tiên (Ngoài-2 của
nguoi-noi-theo-sdt, Mạnh chọn «mở hợp đồng mới» ở Cổng Bằng chứng 31/10).

Vùng: `pipeline/do-danh-ba-sdt.mjs`, `pipeline/do-danh-ba-sdt.test.mjs`.

## Criteria

- AC-1: Given cặp một–một mà người theo SĐT ở trạng thái `split` (truyền qua tập đã tách), When `tinhSo` đếm, Then cặp đó
  không vào `n1.so` nhưng vẫn vào `n1.tong`; đối chứng: bản chép bỏ vế loại người đã tách thì phép đo đỏ với thông điệp
  ghim «N1 DEM CA NGUOI DA TACH».
- AC-2: Given cặp một–một mà người theo SĐT chưa gộp và chưa tách (active), When `tinhSo` đếm cùng lúc với một cặp đã tách,
  Then cặp active vẫn vào `n1.so`; đối chứng: bản chép loại mọi cặp (vế loại nuốt cả người active) thì đỏ với thông điệp
  ghim «N1 NUOT NGUOI CHUA GOP».
- AC-3: Given tập viết trước sẵn có của do-danh-ba-sdt (S03: pA active, pB merged; S05: pX active) và không người nào
  đã tách, When `tinhSo` đếm, Then mọi số của ma trận cũ giữ nguyên (S03 n1 so=1 tong=2, S05 n1 so=1 tong=1, N2–N6 như
  cũ) và đối chứng cũ «đếm cả cặp đã gộp» vẫn đỏ.
- AC-4: Given lời gọi `tinhSo` không truyền tập đã tách (dạng thước nap-lai-nguoi), When đếm trên tập có một người theo SĐT
  mà bên gọi chưa khai là đã tách, Then kết quả bằng hệt lời gọi truyền tập đã tách rỗng — mặc định không loại ai.
- AC-5: Given DB trả một người `merged` và một người `split`, When `docDuLieu` đọc, Then tập đã gộp chỉ chứa người `merged`
  và tập đã tách chỉ chứa người `split`; câu đọc trạng thái nằm trong cùng giao dịch chỉ đọc (BEGIN READ ONLY … COMMIT).
- AC-6: Given trạng thái DB mà cặp một–một duy nhất của S03 có người theo SĐT đã tách, When chạy đường đêm
  `docDuLieu → tinhSo → veDong`, Then dòng `danh-ba-sdt:n1` của S03 là `pass` với detail `so=0 tong=1`, vẫn đúng 11 dòng,
  và detail N1 khớp đúng mẫu mà `app/src/lib/dq-labels.ts` dùng để đọc nhãn (mẫu rút từ chính tệp ấy); đối chứng: detail
  thêm khoá `tach=` thì không khớp mẫu, đỏ với thông điệp ghim «DETAIL N1 LECH NHAN OPS».
- AC-7: Given bảng người mà trạng thái do chính câu ghi gộp và câu ghi tách của danh bạ Người (`SQL.gop`, `SQL.tach` của
  `pipeline/lib/danh-ba-nguoi.mjs`) đặt, qua ba lượt đêm — active rồi merged rồi split, When mỗi lượt chạy
  `docDuLieu → tinhSo`, Then `n1.so` của cặp ấy lần lượt là 1, 0, 0 (lượt sau lần tách không quay lại đỏ).
- AC-8: Given một nguồn có k cặp một–một mà người theo SĐT đã tách, When bước đêm chạy (in bảng, có hay không `--write`),
  Then stdout có đúng một dòng `danh-ba-sdt:n1 <nguồn> cap_da_tach=<k>` mỗi nguồn, và dòng ghi `dq_check_results` vẫn
  đúng 11 dòng không mang số này.
- AC-9: Given cặp một–một mà SĐT không có người theo SĐT nào (không bí danh), chạy cùng tập đã tách khác rỗng, When
  `tinhSo` đếm, Then cặp ấy không vào `n1.so`; đối chứng: bản chép bỏ vế «có người theo SĐT» thì đỏ với thông điệp ghim
  «N1 DEM CAP KHONG NGUOI».

## Coverage

Trục (quét hình thái, preset test-matrix):
- Trạng thái người theo SĐT của cặp một–một: active · merged · split · không có bí danh → AC-2, AC-3, AC-1, AC-9;
  retired ngoài phạm vi (OOS-2).
- Bên gọi `tinhSo`: bước đêm qua `docDuLieu` (có tập đã tách) · thước nap-lai-nguoi (không truyền) → AC-5/AC-6, AC-4.
- Mức đo: hàm thuần · đọc DB · đường đêm đầu-cuối · chuỗi nhiều lượt theo câu ghi thật → AC-1/2/3/4/9, AC-5, AC-6, AC-7.
- Người vận hành thấy gì: dòng ghi (nhãn ops) · stdout bước đêm → AC-6, AC-8.
- Chiều đối chứng: bỏ vế loại split · vế loại nuốt active · bỏ vế loại merged (cũ) · bỏ vế có người · detail lệch nhãn →
  AC-1, AC-2, AC-3, AC-9, AC-6.

## Out of scope

- OOS-1: Đưa số cặp đã tách lên dòng ghi hay nhãn ops — đổi khuôn detail phải sửa `app/src/lib/dq-labels.ts`, ngoài vùng
  hàng; hàng này chỉ in số ấy ra stdout của bước đêm (AC-8).
- OOS-2: Trạng thái `retired` của người theo SĐT — chưa đường mã nào đặt trạng thái này.
- OOS-3: Thước nap-lai-nguoi truyền tập đã tách — DB thử của thước chưa có lần tách nào.
- OOS-4: Ghi lại dòng `danh-ba-sdt:n1` đã ghi trên máy thu trước khi đổi — lượt đêm kế ghi đè dòng của ngày ấy.

## Notes

- Known limits — chọn ở Cổng Bằng chứng 2026-11-01:
  - Ngoài-1: Mô tả kỳ vọng của E4 ghi số cặp chưa gộp S03 = 1, trong khi ca test kiểm 2.
  - Ngoài-2: Mô tả kỳ vọng của E9 gọi người đã tách là pS, ca test dùng pZ.
  - Ngoài-3: Trùng Ngoài-1 — mô tả E4 lệch số với ca test.
  - Ngoài-4: Việc bước đêm in dòng số cặp đã tách chỉ được kiểm qua nội dung mã, chưa chạy bước đêm thật.
  - Ngoài-5: Bản lượt 2 của Ngoài-1.
  - Ngoài-6: Bản lượt 2 của Ngoài-2.
  - Ngoài-7: Bản lượt 2 của Ngoài-1.
  - Ngoài-8: Bản lượt 2 của Ngoài-4.
