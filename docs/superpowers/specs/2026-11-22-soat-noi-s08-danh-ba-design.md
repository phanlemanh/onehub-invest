# DA55 soat-noi-s08-danh-ba — nối dự án S08 vào danh bạ qua thẻ luật theo nguồn

Ngày 22/11/2026, dãy P2, T2. Gốc: Mạnh giao ở phiên LL 22/11 («S08, S09, S10, S16 đang thu được rất ít… Điều tra lại và lập kế hoạch
để thu toàn bộ»); kế hoạch LL bước A3: S08 nạp đều nhưng danh bạ mới nối 8 dự án.

## 1. Vì sao 177/185 dự án S08 chưa nối

Bảng nối S08 hiện nay (`s08_project_links`, DN1) đến từ **một tệp tay** chỉ phủ hai khu Ocean Park 1 và Grand Park
(`pipeline/noi-du-an-s08.mjs`). Mã ngoài tệp mặc định «ngoai-lat». S08 **chưa có thẻ luật nào**, kể cả đã duyệt lẫn chờ duyệt
(`project_link_rules` chỉ có bốn luật: S06, S16 ×2, S03). Nên nghẽn không nằm ở chỗ chờ Mạnh duyệt thẻ, mà ở chỗ chưa có
luật nối và chưa có nút: 157/185 dự án không khớp tên với nút dự án nào trong 344 nút hiện có.

## 2. Bảng phủ ca (đếm trên DB máy thu 22/11, chỉ đọc)

Lệnh: `node _acceptance/soat-noi-s08-danh-ba/probes/bang-phu.mjs`. Tập: mọi dự án của `stg_s08_project`, bản danh mục mới nhất
(185; đúng tập mà màn `/ops/registry` đếm). Tỉnh của dự án = thị trường có đa giác phủ điểm bản đồ S08 (`point_lng`,
`point_lat`); tỉnh của nút = thị trường của xã đầu trong `area_ids` (nút không có xã = «chưa biết tỉnh», như nút ứng viên S09 của DA42).

Lượt đếm đầu (khớp tên thô, chưa bỏ dấu thấp tầng, thương mại) cho: đã nối 8 · trùng tên một nút 6 · gần giống 9 · không khớp
157 · không tỉnh 4 · dự án con 1 · chờ thẻ luật chưa duyệt 0 · mã tỉnh cũ (DA54) 0. Soi 15 ca khớp tên: 7 ca chạm nút ở tỉnh
khác («central park», «riverside», «Ocean Park 3» chạm cả OP1). Sau luật §3 (cùng tỉnh, bỏ «_TT», « TT», «TMDV »), **số chốt** là:

| Ngả | Dự án | Căn S08 | Ai đọc đầu ra phía sau |
|---|---|---|---|
| Giữ tay (DN1, `s08_project_links`) | 8 | 1.842 | `danh-ba-vat-the.mjs`, `s16-dung.mjs`, màn `/ops/registry` |
| Nối nút có sẵn — căn cứ «tên chuẩn trùng, cùng tỉnh» (thẻ luật) | 9 | 2.263 | màn `/ops/registry` (đã nối, nguồn của nút) |
| Thẻ từng cặp — gần giống, nhiều ứng viên, hay trùng tên nút chưa biết tỉnh | 0 | 0 | thẻ luật (mục «Cần người chọn») |
| Đúc nút ứng viên — không khớp nút nào (158 nút; 5 nhóm gom từ hai dự án) | 163 | 17.932 | màn `/ops/registry` (đã nối vào nút ứng viên) |
| Từ chối «khong-tinh» (thiếu điểm, hay điểm ngoài mọi thị trường) | 4 | 1.096 | màn `/ops/registry` (chưa nối, lý do) |
| Từ chối «du-an-con» (hậu tố khu, Q-A 17/11) | 1 | 251 | màn `/ops/registry` (chưa nối, lý do) |
| Chờ thẻ luật chưa ai duyệt | 0 | 0 | — |
| Thiếu ISO, mã tỉnh cũ (DA54) | 0 | 0 | S08 lấy tỉnh từ điểm bản đồ |

Chiều phụ: 23 dự án có 0 căn trong quỹ căn (vẫn là dự án công bố, vẫn đúc); 106 cao tầng, 79 thấp tầng.

Chồng với S09 (DA42, đo 22/11 trên `v_s09_du_an_moi`, 344 dự án): 6 dự án S08 không khớp nút nào trùng tên chuẩn với một dự án
S09 (3 ở Hà Nội), 1 gần giống. DA42 chưa áp nên hôm nay chưa có nút ứng viên S09 nào.

## 3. Luật (thuần, `pipeline/lib/noi-du-an-s08-lop.mjs`)

Mỗi dự án S08 (tập của §2) vào đúng một ngả, theo thứ tự:

1. Đã có dòng `noi` trong `s08_project_links` (tệp tay DN1) → **giữ tay**: thẻ không ghi gì cho dự án này.
2. Đã có nút ứng viên do chính luật S08 đúc (lần áp trước, kể cả đã đảo) → giữ nút ấy (như DA32 F1).
3. Tên rỗng giả (mục 45) → từ chối «khong-ten».
4. Tên mang hậu tố khu (OCP1, OCP2, OP1, GP…) → từ chối «du-an-con».
5. Không có tỉnh → từ chối «khong-tinh» (mô hình §1.2: bản ghi chưa có tỉnh thì không đề xuất).
6. Tên gốc = tên bỏ «_TT» / « TT» ở cuối và «TMDV » ở đầu; so bằng `chuanKhop` (giữ dấu, như DA32 và DA42). Ứng viên = nút
   `project` cùng tỉnh hoặc chưa biết tỉnh, trừ nút do luật S08 đúc (nút ứng viên của nguồn khác — S06, S09 — LÀ ứng viên):
   - trùng hẳn tên gốc với tên hay bí danh của đúng một nút cùng tỉnh, và không nút chưa biết tỉnh nào trùng → **nối** (căn cứ
     `S08-ten-chuan-cung-tinh`, đi thẻ luật);
   - trùng hẳn từ hai nút → thẻ từng cặp «nhieu-ung-vien»; trùng hẳn đúng một nút chưa biết tỉnh → thẻ từng cặp «nut-khong-tinh»;
   - không trùng hẳn mà tên/bí danh ≥ 8 ký tự của một nút ứng viên nằm trong tên gốc, hay ngược lại → thẻ từng cặp «gan-giong»
     (mô hình §1.2 K4: tên trùng một phần đi thẻ từng cặp, không đi thẻ luật);
   - ca thẻ từng cặp không nối, không đúc: dòng `chua_noi` mang lý do và danh sách ứng viên.
7. Còn lại → **đúc**: một nút ứng viên cho mỗi cặp (tên gốc chuẩn bỏ dấu, tỉnh); các dự án S08 cùng cặp nối cùng nút.

Thứ tự nguồn với DA42 (S09): DA42 áp trước → nút ứng viên S09 chưa có tỉnh, S08 trùng tên thì ra thẻ từng cặp, không đúc nút thứ
hai. DA55 áp trước → nút ứng viên S08 mang tỉnh, luật DA42 (`phanLopDuAn`: trùng tên đúng một nút → thẻ luật S09) nối S09 vào nút
S08, không đúc nút thứ hai. Hai thứ tự đều cho một nút cho một dự án thật; ca test hai thứ tự ở E1 (phần S08) và E7.

Nút đúc: `catalog_tier = 'mot_loi_khai'`, tên = tên gốc như S08 viết, `area_ids` = xã có đa giác phủ điểm, không có thì thị trường,
`meta = {nguon: 'S08', rule_id, diem: {lng, lat}}` (mô hình 11/11 Hỏi-2: điểm dự án lấy từ bản đồ nhúng của nguồn danh mục). Meta
không mang mã dự án S08.

## 4. Thẻ, áp, đảo, kiểm (`pipeline/noi-du-an-s08-luat.mjs`)

Theo đúng khuôn DA32 (`noi-du-an-s06.mjs`), đổi nguồn:

- `--the <tệp>`: dựng thẻ chỉ đọc. Thẻ ghi rõ **loại căn cứ** của từng ngả (quyết định 19/11, Mạnh duyệt theo loại căn cứ): tổng theo
  ngả; «nối nút có sẵn — tên chuẩn trùng, cùng tỉnh»: mọi dòng; «cần người chọn — thẻ từng cặp»: mọi dòng kèm tên ứng viên; «từ
  chối»: mọi dòng kèm lý do và đường đi riêng (không tỉnh → chờ nguồn bổ sung điểm; dự án con → Q-A, hàng sau); «đúc nút ứng
  viên»: 10 nhiều căn nhất, 10 giữa, 5 ít căn nhất, mọi nhóm gom từ hai dự án. Thẻ in tên dự án, tỉnh, số căn, không in mã dự án
  S08. Dòng cuối «băm: <hex>» = sha256 của danh sách [mã, kết cục chuẩn]; kết cục chuẩn mang id nút đích (`noi:<id>`), khoá nhóm
  đúc (`duc:<tên chuẩn>|<tỉnh>`), lý do và id ứng viên (`the-cap:<lý do>:<id,…>`), hay lý do từ chối (`chua_noi:<lý do>`).
- `--ap --bam <hex> --nguoi <tên>`: dựng lại thẻ trong giao dịch có khoá bảng; băm lệch → không ghi gì. Đúng → một dòng
  `project_link_rules` (`source 'S08'`, `can_cu 'S08-danh-muc'`), đúc nút cho ngả đúc, mỗi dự án một dòng `project_links`
  (`source 'S08'`, `can_cu` theo ngả) kèm `rule_id`, bí danh `ma_nguon` `du_an/<mã>` nguồn S08 ở `registry_aliases` (bảng chỉ thêm)
  cho dự án nối. **Dòng `asset_nodes` của nút có sẵn không đổi một byte**: bí danh nguồn của dự án nối nằm ở `registry_aliases`,
  không ở cột `aliases` của nút. Hồ sơ áp liệt kê nút có sẵn nào nhận thêm bí danh S08. Áp lần hai không đổi gì.
- `--dao <rule_id> --nguoi <tên>`: bí danh của lượt nghỉ, dòng `noi` về `chua_noi` «dao-luat», giữ nút ứng viên, luật ghi người và giờ đảo.
- `--kiem <rule_id>`: ba bất biến — không mã nào có bí danh sống trỏ hai nút; không cặp mã–nút lệch tỉnh; mọi dự án của tập có dòng
  trạng thái (ở bảng tay hoặc bảng luật). Lệch → thoát 1 nêu loại lỗi và số đếm (không in mã).

Bảng tay `s08_project_links` giữ nguyên. Hai bảng không chồng nhau: thẻ bỏ dự án đã nối tay.

## 5. Bên đọc

- `app/src/lib/ops/registry/doc.ts`: `SQL_DANH_MUC` tính cho S08 đã nối = dự án có `noi` ở bảng tay **hoặc** ở `project_links` nguồn
  S08 (đếm một lần), và thêm số **nối vào nút ứng viên** (nút đích `catalog_tier = 'mot_loi_khai'`) cho mọi nguồn; `SQL_CHUA_NOI` lấy
  lý do của bảng luật trước, bảng tay sau. `SQL_NUT` và `du-an.ts` đã đọc `project_links` mọi nguồn — không đổi.
- `app/src/components/ops/registry/registry-view.tsx`: chân ô «Mã nguồn chưa nối» tách hai số cho từng nguồn — chưa nối / đã nạp,
  và số đã nối vào nút ứng viên (chưa ai xác minh). Chỉ đổi chữ chân ô, không đổi bố cục.
- Gắn tin: view `s06_offer_project` chỉ đọc bí danh nguồn S06, nên nút ứng viên S08 không nhận tin nào; không trang Invest nào liệt
  nút dự án. Đo trên bản chép: nút ứng viên S08 có 0 dòng `offer_project` và 0 dòng `offer_price_rank` cấp dự án.
- `danh-ba-vat-the.mjs`, `s16-dung.mjs` vẫn đọc bảng tay: đúc toà, trục, căn từ dự án S08 mới nối là **hàng sau**.

## 6. Đích và đường đo

Hai ô trên màn `/ops/registry` (chân ô «Mã nguồn chưa nối», phần S08), đọc bằng chính `docDanhBa` của app trên bản chép DB máy thu
(`pipeline/scripts/noi-du-an-s08-that.mjs`):

- S08 nối vào nút đã xác minh: **8 → 14** (8 tay + 6 trong 9 dự án nối theo tên chuẩn cùng tỉnh);
- S08 nối vào nút ứng viên: **0 → 166** (163 dự án vào 158 nút mới đúc, cộng 3 dự án nối vào nút ứng viên do thẻ S06 đúc —
  Capital Square, FourS Tower, Mizuki Park; màn đếm theo hạng nút `mot_loi_khai`, nên mọi nút chưa ai xác minh đứng chung một số);
- S08 chưa nối: **177 → 5**.

Đo trên bản chép 22/11 (E7): đúng ba số trên; băm thẻ nối DA53 `e5c1a467…` không đổi; bộ gắn PL20 4.012 gắn · 21 xung đột · 117
«chữ và model khác nút» trước và sau như nhau; 0 tin gắn, 0 hạng giá trên nút ứng viên S08; nút có sẵn nhận bí danh S08: Capital
Square, FourS Tower, Mizuki Park, The Global City, Vinhomes Ocean Park 1, 2, 3, Vinhomes Smart City.

Số chạy thử có thể nhích theo lượt nạp S08 tuần (CN 06:30); E7 so đúng số đếm lại của bảng phủ trên cùng bản chép, không so số cứng.

## 7. Áp lên DB máy thu

Cần lời riêng của Mạnh kèm băm thẻ. Thứ tự áp: **PL20 qua Cổng Bằng chứng → DA53 → DA55** là thứ tự an toàn, vì lượt này thêm khoảng 158 nút
`asset_nodes`; E7 22/11 cho thấy băm DA53 và bộ gắn PL20 không đổi, nên GS có thể đổi thứ tự. E7 đo băm thẻ nối DA53 (`dungKeHoachNoi`) trước và sau áp DA55 trên bản chép. Nếu bằng nhau, DA55 không chạm băm
DA53 và thứ tự giữa hai hàng tự do; nếu lệch, giữ thứ tự trên. E7 cũng đo bộ gắn PL20 trước và sau áp: số gắn, xung đột, «chữ và
model khác nút» phải bằng nhau. Hồ sơ áp năm thứ:

1. Lệnh áp: `node pipeline/noi-du-an-s08-luat.mjs --the /tmp/the-s08.md` (so băm với băm Mạnh duyệt) rồi `--ap --bam <băm> --nguoi Mạnh`.
2. Số chạy thử: số ngả và ba ô §6 từ E7 trên bản chép.
3. Sao lưu trước: `pg_dump -Fc` DB máy thu vào `~/onehub-backups/db/truoc-da55-<UTC>.dump`.
4. Cách lùi: `--dao <rule_id> --nguoi Mạnh` (giữ nút ứng viên, gỡ mọi dòng nối); hoặc khôi phục bản sao lưu. Trên cloud: lượt đồng
   bộ đêm kế đưa nút ứng viên lên như mọi nút (mục 38: thông tin dự án công khai); đảo không xoá nút, nên muốn gỡ nút khỏi cloud
   thì khôi phục bản sao lưu rồi để lượt đêm đồng bộ lại.
5. Kiểm sau: `--kiem <rule_id>` thoát 0; ba ô trên màn bằng số chạy thử (lệch → dừng, báo); sáng hôm sau đếm chỉ đọc trên cloud số
   nút `meta.nguon = 'S08'` bằng số nút đã đúc.
   Thêm (GS 26/11, sau S4 vòng 1): đếm nút S08 trùng khoá nhóm phải bằng 0. Nút đúc mang tên gốc của nhóm và tỉnh trong `area_ids`,
   nên hai nút cùng tên, cùng `area_ids` là cùng khoá nhóm:
   `SELECT count(*) - count(DISTINCT (lower(name), area_ids)) AS nut_trung FROM asset_nodes WHERE meta ->> 'nguon' = 'S08'` → 0.

**Rào áp (GS 26/11):** không chạy lại lượt áp sau khi có snapshot S08 mới, cho tới khi hàng sửa «đúc theo khoá nhóm» (mã tạm DA55b,
GS cấp mã thật) gộp. Lý do: luật đúc chỉ gom theo khoá nhóm (tên gốc + tỉnh) trong một lượt; lượt áp sau không tìm nút S08 đã đúc
cùng khoá, nên mỗi dự án mới rơi vào nhóm đã đúc sinh một nút thứ hai (slug `-2`) trong danh bạ. Số đo chỉ đọc DB máy thu 26/11:
thẻ đúc 163 dự án vào 158 nhóm, 5 nhóm nhiều dự án (10 dự án); qua 3 snapshot S08 06→20/11 không nhóm nào có thành viên về ở ngày
thu khác nhau, nên lượt áp đầu sinh 0 nút trùng. Điều kiện phát sinh sắp có thật vì S08 đang được thu toàn bộ (lời 22/11).

Ràng buộc PL20: thẻ chỉ thêm nút mới, dòng nối và bí danh ở `registry_aliases`; không đổi dòng `asset_nodes` nào có sẵn, kể cả ở
Grand Park, Ocean Park. Nút có sẵn nhận bí danh S08 thì liệt kê trong hồ sơ áp.

## 8. Ngoài phạm vi

- Đúc toà, trục, căn từ dự án S08 mới nối (đọc `project_links` S08 ở `danh-ba-vat-the.mjs`): hàng sau.
- Dự án con có hậu tố khu (1 dự án): Q-A 17/11, hàng sau.
- Chuyển 8 dòng tay DN1 sang bảng luật: không cần cho số trên màn; giữ để không đụng lượt dựng vật thể đang chạy.
- Ghép chéo S07, S16 ở cấp dự án: lớp hợp nhất nguồn (19/11) chưa cắt hàng. Với S09 chỉ giữ bất biến «không đúc nút thứ hai» (§3).
- Thẻ `review_queue` cho ca thẻ từng cặp: hôm nay 0 ca; ca nằm ở thẻ luật và dòng `chua_noi` mang ứng viên, thẻ duyệt từng cặp là hàng sau.
- Nối tin vào nút ứng viên, đưa nút ứng viên lên Invest: hàng sau (như DA42).
