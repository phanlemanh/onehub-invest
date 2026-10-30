# Bản phạm vi — Đọc tin và ảnh S03/S06 (30/10)

> Nguồn: `docs/research/s03-boc-tach-cau-truc-3010.md` §9 (bản cắt cuối, kèm §9.4 sau PR #186) và
> `docs/research/anh-tin-rao-va-scorecard-truong-2910.md` §4. Chưng cất ở trang tri thức `chu-de/doc-tin-va-anh-s03.md`.
> Mạnh duyệt §8.6 («Đồng ý») và gật §9 («Gật, cắt lượt») ngày 30/10.
> Nguồn gọi bằng mã: S03 nhóm chat cộng đồng · S06 rao vặt công khai · S08 danh mục dự án.
>
> Bản này chỉ chứa mã của **hàng mới** và **mục chờ mới** của đợt. Lượt cắt còn đổi các hàng đã có ở đợt khác. Các thay
> đổi đó không thành mã ở đây, vì răng phủ chỉ đếm hàng cùng đợt; mỗi hàng vẫn giữ `phu` cũ:
> - mục chờ **NH1** (`nen-tang-2310`) thành hàng `media-canonical-reso`, gánh cả A3 (ảnh S06 trên `/ops`);
> - sửa câu giao **PL5** (Kev 3 lớp), **PL13** (trường thuê, lát gồm Grand Park), **PL18** (bộ đọc ra mảng căn, có
>   trích dẫn), **PL28** (gộp ảnh hai phía, bỏ đứng trên PL17);
> - sửa ghi chú **PL30** (ứng viên model) và **TV9** (đứng trên NH1);
> - sửa câu giao mục chờ **DB1** (dọn bí danh trùng mã toà, chủ đầu tư ở cấp toà).
>
> Việc của người, ra khỏi kho (liệt ở mô tả PR):
> - đội gắn nhãn trên màn PL7;
> - nạp S08 vào máy thu (`claudedp-2910-12`, điều kiện mở DB1);
> - kiểm điều khoản gói GLM trước khi đưa vào PL30.

<!-- <<<PHAM-VI-MA -->
```
dot: doc-tin-anh-3010
dang: chuoi
nguon: onehub-invest-tri-thuc:wiki/chu-de/doc-tin-va-anh-s03.md#f8309103b3e889771b9b3a5606cd98bfe0fc13b7

- `N1` — cầm máu số liệu S03 ở transform: số không lẫn URL/SĐT, chuẩn hoá giá của môi giới, DT «m», gom repost theo mã toà/căn, seller_name từ sender_name, phường theo thị trường của nhóm
- `C2b` — scorecard đêm thêm media-yield theo bậc và field-yield theo tầng đọc cho từng nguồn S0x
- `ZC9` — collector S03 tải ảnh tin chỉ-ảnh không còn lỗi hàng loạt, tải bù khi URL còn hạn (làn ZCode)
- `PL10b` — collector thu danh mục toà · trục · mã căn Grand Park vào raw (làn ZCode)
- `DBG` — danh bạ toà · trục Grand Park dựng từ danh mục PL10b và phát biểu toà/mã căn, cùng khung DB1
- `AP1` — căn nhà có ảnh đại diện lấy từ media canonical của các tin gắn vào nó
```
<!-- PHAM-VI-MA>>> -->
