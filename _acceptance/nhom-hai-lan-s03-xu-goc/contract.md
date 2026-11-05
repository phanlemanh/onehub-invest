---
schema_version: 1
feature: Xử gốc nhóm S03 đăng ký hai lần — dọn sổ theo lời Mạnh, transform so khoá đã chuẩn hoá, vá hai lỗ phép đo của hồ sơ trước
slug: nhom-hai-lan-s03-xu-goc
owner: phanlemanh@gmail.com
risk_tier: T2
surfaces: [cli]
status: approved
approved_by: Mạnh
approved_at: 2026-11-05
design_doc: docs/superpowers/specs/2026-11-05-nhom-hai-lan-s03-xu-goc-design.md
---

# Acceptance Contract: nhom-hai-lan-s03-xu-goc

## Context

Ba nhóm S03 có hai dòng trong `collection_units` (S03-N004/N022, S03-N005/N018, S03-N010/N024). PR #315 chỉ gộp ở bước lấy mẫu; sổ, bài và transform còn nguyên. Bước transform so khoá nguyên văn nên 91 bài cũ của ba nhóm bị tính thành nhóm riêng. Đo 05/11 trên bản sao thật bằng bản dựng thử: 2 nhóm đổi loại hình suy theo nhóm, 74 bài đổi giá trị suy, nhưng 0 tin rời cổng, 0 tin thêm, 0 tin đổi loại hình hay khu vực, 1.382 tin hiện cả trước và sau. Phần transform là đổi đường dữ liệu lên cổng (Hỏi-2): không đổi số hôm nay, chặn lệch về sau.

Source input: Out of scope và Notes của `_acceptance/nhom-dang-ky-hai-lan-s03/contract.md`, Hình dạng 4 và 5 của `review-findings.md` hồ sơ đó, số đo trong design doc.

## Criteria

- AC-1: Given giao dịch lùi trên DB thử có một nhóm mà bài ở hai dạng khoá, mỗi dạng riêng lẻ chưa đủ ngưỡng nhóm, When chạy `runTransformZalo`, Then bài cả hai dạng cùng nhận mục đích và loại hình tính trên hợp hai dạng; cùng fixture, `khoaNhom` nguyên văn cho kết quả tách đôi như bản cũ. `tangLoai` cho cùng kết quả.
- AC-2: Given sổ có dòng khoá trần và dòng có tiền tố, When transform đọc thị trường khai, Then bài ở dạng có tiền tố nhận thị trường của dòng khoá trần, dòng khoá trần thắng khi hai dòng khác thị trường, nhóm chỉ có dòng có tiền tố khai thị trường vẫn nhận thị trường đó; `docThiTruongNhom` vẫn trả được theo khoá nguyên văn của cả hai dòng.
- AC-3: Given bài và sổ mang `conv:x`, `a:b:group:x`, `k:group:` và bài không có khoá, When chạy transform, Then các khoá này không gộp với `x`, bài không có khoá không vào nhóm nào, kết quả y hệt so nguyên văn; hàm gộp quá tay trên cùng fixture làm phép đo đỏ với thông điệp ghim.
- AC-4: Given bản sao thật trên DB thử, When chạy phép đo cổng trong giao dịch lùi với khoá nguyên văn rồi lệnh thật không truyền tham số, Then lệnh in tổng tin, tin hiện, bán, thuê, tin rời, tin thêm, tin đổi của cả hai lượt; số bài đổi khoá bằng số bài có tiền tố đếm độc lập bằng SQL và khác 0, mỗi bài trỏ về đúng một khoá trần; 0 tin rời cổng, 0 tin thêm, mọi tin đổi thuộc nhóm có cặp trong sổ. Bài mồi mang dạng tiền tố đọc từ dòng thật của sổ làm số đổi khác 0, chứng tỏ thước không mù và lệnh thật mặc định chuẩn hoá. Bộ so viết trước có hai ca đỏ ghim riêng: tin rời cổng, tin đổi ngoài nhóm có cặp. Điều kiện hiện đọc từ mã cổng.
- AC-5: Given sổ có cặp trùng, When chạy `don-nhom-hai-lan` không có `--ghi`, Then in đúng các mã đại diện và mã phụ, băm toàn bộ `collection_units` và `ops_audit` không đổi, stdout không chứa khoá nhóm, tên nhóm hay tên kênh. When có `--ghi`, Then đúng các dòng phụ sang trạng thái đích theo lối Mạnh chọn, kể cả dòng phụ đang `paused`, `reason` nêu mã đại diện, kèm một dòng `ops_audit` mỗi dòng mang trạng thái cũ, trong cùng giao dịch; đọc lại đúng dòng giữ là dòng khoá trần; chạy lần hai 0 thay đổi; hoàn lại theo `ops_audit` trả đúng băm sổ, không tính `updated_at`.
- AC-6: Given cặp không có dòng khoá trần, hai dòng lệch thẻ, thị trường hoặc dự án, hay dòng đại diện đã `retired`, `completed`, When chạy `--ghi`, Then cặp đó không đổi và stdout nêu mã cùng lý do; các cặp còn lại vẫn được dọn. Lỗi tiêm ở dòng nhật ký thứ hai thì không dòng nào đổi, và phép đo xác nhận lỗi đã thật sự nổ.
- AC-7: Given bản sao thật, dòng hiệu lực là dòng có trạng thái ngoài `retired`, `completed`, When dọn sổ trong giao dịch lùi, Then trước dọn đếm được đúng số cặp nhóm hai dòng hiệu lực (đối chứng), sau dọn mỗi nhóm thật còn đúng một dòng hiệu lực, là dòng khoá trần; số tin của AC-4 không đổi; `dongBoS03` với danh sách rỗng hạ dòng đang `active` nhưng không chạm dòng đã dọn (đối chứng: dòng `active` đổi sang `paused`); `label-sample` vẫn một tầng cho mỗi nhóm; băm lát `s03-theo-nhom` trong `eval_label_items`, gồm cột `stratum`, không đổi sau cả dọn sổ lẫn transform (đối chứng: đổi một `stratum` trong giao dịch thì băm đỏ).
- AC-8: Given bản đột biến khoá nguyên văn của `label-sample` trên bản sao thật, When chạy `that-chi-doc`, Then vế không vượt hạn mức đỏ với `loi vuot han muc` vì tổng chọn của cả nhóm thật vượt `can` của đại diện; bản thật xanh trên cùng dữ liệu.
- AC-9: Given kho hiện tại và commit gộp PR #315, When `that-chi-doc` quét khoá, Then danh sách tệp lấy từ `git diff`, không có danh sách viết tay, gồm `_acceptance/config.yaml`, `LO-TRINH.html`, `PRODUCT-MAP.md` mà bản cũ bỏ sót; danh sách rỗng thì đỏ; kho git tạm có commit chứa khoá mồi thì bộ quét theo diff đỏ.
- AC-10: Given mọi khoá S03 đọc từ sổ DB thử lúc chạy, ở dạng nguyên văn và dạng đã bỏ tiền tố, When quét các tệp nhánh này đổi so với nhánh chính cùng stdout, stderr của các lệnh mới, Then số khớp bằng 0 và lệnh chỉ in số lượng, gồm số lệnh và số byte đã bắt, đều khác 0; tệp chưa commit cũng được quét; khoá lấy từ cả hai DB thử mà các lệnh dùng; token kênh và tên đơn vị đọc từ sổ được quét trong đầu ra và trong tệp vòng này thêm mới; mồi trong tệp tạm và trong đầu ra làm phép quét đỏ.

## Coverage

- Quét: `coverage-scan.md`. Trục dạng khoá (AC-1, AC-2, AC-3) · chỗ đọc khoá trong transform (AC-1, AC-2) · trạng thái dòng phụ (AC-5, AC-6, AC-7) · dữ liệu fixture hay bản sao thật (AC-1 đến AC-3 và AC-5, AC-6 trên fixture; AC-4, AC-7, AC-8 trên bản sao).
- `[NGÀNH: MDM survivorship, DAMA-DMBOK]`: giữ bản ghi trùng ở trạng thái hết hiệu lực là đề xuất, Mạnh chọn ở Hỏi-1.
- Áp mọi ô: không lộ khoá (AC-5, AC-10), không đổi dữ liệu thật trong vòng này.

## Out of scope

- Không chạy `--ghi` trên DB thật trước khi qua mốc 05/11 và có lời Mạnh về lối dọn. Lúc gộp mã: theo Hỏi-3; có đổi transform hay không: theo Hỏi-2.
- Không đổi mẫu lát `s03-theo-nhom`, không đụng `app/src/components/ops/labels/**`: lát đang chờ Mạnh gắn, phiên khác đang sửa màn đó.
- Không sửa `conversation_id` trong bảng bài S03: lượt nạp lại từ raw snapshot đảo ngược.
- Không đổi `gop-anh`, `do-cam-mau-s03`, `sync-don-vi.mjs`, `khai-so-nhom.mjs`, đường thu, hook.
- Không thêm migration, không thêm ràng buộc chặn khoá trùng.
- Không đổi `/ops/sources`: dòng đã dọn hiện theo nhãn trạng thái có sẵn.
- Không xử 94 bài bị bỏ vì không có khoá.

## Notes

- Bước sau gộp, không thuộc phép đo của vòng: Hỏi-1 chỉ chọn lối, chưa cho phép chạy. Sớm nhất ngày 06/11, sau khi Mạnh nói rõ cho chạy, chạy `node pipeline/don-nhom-hai-lan.mjs --ghi` một lần trên DB local máy thu, rồi báo số đơn vị từng trạng thái. Sổ là tầng A, không lên cloud nên không có bước trên cloud. Nếu chọn lối B, xuất ba dòng ra `research-local/` trước khi xoá.
- `sync-don-vi` có thể đã đổi dòng phụ sang `paused` trước ngày chạy: lệnh dọn xử cả ca đó (AC-5).
- Chạy thử trên DB thử `oneinvest_nhl_xu`; riêng E8, E9 chạy đầu dò của hồ sơ trước trên DB thử `oneinvest_gcn_nhan` của nó, E10 lấy khoá từ cả hai. S4 chạy dưới khoá s4 của dãy U1 mượn, tránh chấm từ 13:50 tới khi job 14:00 xong.
- Lát `s03-theo-nhom` đo 05/11: 367 bài, 25 tầng, 0 dòng ở mã phụ, 65 dòng ở ba mã đại diện. Dọn sổ theo lối nào cũng không đổi `stratum`.
- Mã và tệp kho không ghi tên kênh và không ghi khoá nhóm thật. Kho công khai.
