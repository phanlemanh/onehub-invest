---
schema_version: 1
feature: Lấy mẫu gắn nhãn theo nhóm S03 coi một nhóm thật đăng ký hai lần trong sổ là một tầng, không sửa dữ liệu thật
slug: nhom-dang-ky-hai-lan-s03
owner: phanlemanh@gmail.com
risk_tier: T2
surfaces: [cli]
status: draft
design_doc: docs/superpowers/specs/2026-11-04-nhom-dang-ky-hai-lan-s03-design.md
approved_by:
approved_at:
---

# Acceptance Contract: nhom-dang-ky-hai-lan-s03

## Context

Ngoài-21 của GC0: ba nhóm S03 có hai dòng trong `collection_units` (S03-N004/N022, S03-N005/N018, S03-N010/N024), một dòng khoá
trần, một dòng `<kênh>:group:<khoá>`. `label-sample` so khoá nguyên văn nên mỗi nhóm thành hai tầng; đo 04/11: N004 và N010 mỗi
nhóm 35 bài (hạn mức 30), N005 8 bài (hạn mức 5), tiến độ và bảng trường hợp bị chia đôi, không cảnh báo. Phải xong trước khi
đội gắn nhãn thật. Dòng có tiền tố còn đang được transform dùng cho 91 bài cũ, nên việc này gộp ở bước đọc.

Source input: `_acceptance/gan-nhan-theo-nhom-s03/review-findings.md`, `decisions.jsonl` dòng Ngoài-21, số đo trong design doc.

## Criteria

- AC-1: Given DB thử có nhóm hai dòng trong sổ (khoá trần, `<kênh>:group:<khoá>`) và bài ở cả hai dạng khoá, When chạy `label-sample --theo-nhom`, Then `eval_label_items` có đúng một tầng cho nhóm đó, mang `unit_code` của dòng khoá trần, 0 dòng mang mã dòng phụ, số bài không vượt hạn mức (nhóm lớn 30, nhóm nhỏ 5).
- AC-2: Given bài chỉ nằm ở khoá phụ, nội dung trùng giữa hai dạng khoá, và một nhóm mà mỗi dòng riêng lẻ không đủ vào nhóm lớn, When lấy mẫu, Then bài ở khoá phụ vào mẫu dưới tầng đại diện, số nội dung khác nhau của tầng bằng số của hợp hai dạng, và nhóm đó được xếp theo số gộp.
- AC-3: Given sổ có cặp trùng, When chạy lệnh có hoặc không `--thu`, Then stdout có dòng `gộp đơn vị trùng: <đại diện> ← <phụ> · bài ở khoá phụ <n>`, với n đúng và không chứa khoá nhóm; hai dòng khác thẻ thì có thêm dòng cảnh báo «khác thẻ»; sổ không có cặp thì không có dòng nào như vậy.
- AC-4: Given bảng dạng khoá dưới đây (viết trước khi có mã, A < B < C là `unit_code`), When tính đơn vị cho từng ô, Then mỗi ô cho đúng khoá thật, đại diện và tầng như bảng; và sổ cùng bài toàn khoá trần hoặc khoá lạ thì mẫu y hệt so khớp nguyên văn với cùng seed.
- AC-5: Given lát do bản so khớp nguyên văn ghi ra có dòng ở tầng phụ, When chạy lại lệnh, Then 0 dòng thêm hay đổi, stdout có đúng câu `lát đã có <n> dòng ở tầng phụ <mã> — giữ nguyên, gắn tiếp được; số của nhóm này đang chia hai tầng, muốn một tầng thì lấy mẫu lát tên mới`, không có lời khuyên xoá.
- AC-6: Given DB thử có cặp trùng, When chạy lệnh có ghi, Then băm toàn bộ `collection_units` và `stg_zalo_posts` không đổi, `docThiTruongNhom` vẫn trả thị trường cho cả hai dạng khoá.
- AC-7: Given bản sao dữ liệu thật ở DB thử `oneinvest_gcn_nhan` có các cặp trùng đọc từ sổ, When chạy `--thu` với 30/5, Then không dòng `nhóm <mã phụ>:` nào được in, mỗi đại diện không vượt hạn mức, số dòng gộp bằng số cặp đọc từ sổ, stdout không chứa khoá nhóm thật.
- AC-8: Given mọi khoá S03 đọc từ sổ DB thử lúc chạy, ở dạng nguyên văn và dạng đã bỏ tiền tố, When quét các tệp vòng này đổi (design, hồ sơ, probe, mã) cùng stdout và stderr của bản thật lẫn bản đột biến, Then số khớp bằng 0, kết quả chỉ in số lượng, và một khoá mồi trong tệp tạm làm phép quét đỏ.

### Bảng dạng khoá của AC-4

| Ô | Dòng sổ | Bài | Kết quả |
|---|---|---|---|
| 1 | `x` (A) | `x` | khoá thật `x`, tầng A |
| 2 | `group:x` (A) | `x` | khoá thật `x`, tầng A |
| 3 | `k:group:x` (A) | `x` | khoá thật `x`, tầng A; so nguyên văn thì bài này bị bỏ |
| 4 | `x` (A), `k:group:x` (B) | cả hai dạng | một tầng A, gộp B |
| 5 | `k:group:x` (A), `x` (B) | cả hai dạng | một tầng B: dòng khoá trần thắng dù mã lớn hơn |
| 6 | `x` (A), `group:x` (B), `k:group:x` (C) | cả ba dạng | một tầng A, gộp B, C |
| 7 | `k1:group:x` (A), `k2:group:x` (B) | cả hai dạng | một tầng A, gộp B: sổ S03 một kênh, có dòng báo gộp |
| 8 | `x` (A `paused`), `k:group:x` (B `active`) | cả hai dạng | một tầng A: trạng thái không đổi đại diện |
| 9 | `conv-x` (A) | `conv-x` | giữ nguyên, tầng A |
| 10 | `a:b:group:x` (A), `x` (B) | cả hai dạng | hai tầng A, B: không gộp |
| 11 | `conv:x` (A), `x` (B) | cả hai dạng | hai tầng A, B: không gộp |
| 12 | `k:group:` (A) | `k:group:` | giữ nguyên vì không còn khoá sau tiền tố, tầng A |
| 13 | `x` (A) | không có khoá; khoá không có trong sổ | bài bị bỏ và được đếm |

## Coverage

- Quét: `coverage-scan.md`. Thước CE: 30 dòng sổ và 75.000 bài đo 04/11 `[SUY-TỪ-REPO: pipeline/label-sample.mjs]`, tầng phải rời nhau `[NGÀNH: Cochran, Sampling Techniques]`.
- Trục dạng dòng của nhóm (AC-4) · dạng khoá của bài (AC-1, AC-2, AC-4) · lát và chế độ chạy (AC-1, AC-3, AC-5, AC-6) · dữ liệu fixture hay bản sao thật (AC-1, AC-7).
- Áp mọi ô: không sửa dữ liệu (AC-6), không lộ khoá (AC-3, AC-7, AC-8).

## Out of scope

- Không sửa dữ liệu thật: không xoá, gộp hay đổi trạng thái dòng trong `collection_units`, không đổi `conversation_id` trong `stg_zalo_posts`. Việc đó cần lời Mạnh và thuộc việc riêng sau mốc.
- Không đổi `transform-zalo`, `do-cam-mau-s03`, `mucDichNhom`, `loaiHinhNhom`, `gop-anh`: chúng vẫn so khoá nguyên văn, số tin trên cổng không đổi trong việc này.
- Không đổi đường thu và không đổi hook, `sync-don-vi.mjs`, `khai-so-nhom.mjs`.
- Không đổi `/ops/sources`: khu sổ vẫn hiện đủ 30 đơn vị.
- Không thêm migration, không thêm ràng buộc chặn khoá trùng.
- Không xử 94 bài bị bỏ vì không có khoá, và không lọc đơn vị `retired`, `paused` khỏi mẫu; hai điều này giữ nguyên như GC0.

## Notes

- Chạy thử chỉ trên DB thử `oneinvest_gcn_nhan`. S4 chạy dưới khoá s4.
- Mã và tệp kho không ghi tên kênh và không ghi khoá nhóm thật.
- PR nhắm nhánh GC0 cho tới khi GC0 vào main; không gộp trước GC0.
