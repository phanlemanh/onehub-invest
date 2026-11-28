# ZC26 — bản thu đuôi S06 hỏng không chặn hàng đợi nạp (design)

Hồ sơ: `_acceptance/s06-thu-duoi-snapshot-hong-khong-chan/`. Nguồn: mục Ngoài-9 của Cổng Bằng chứng ZC18 (Mạnh 28/11: «mở hợp
đồng mới»; GS cấp mã ZC26, phán U2 viết mã, hàng phòng ngừa, raw không xoá không sửa, một dòng log gọi tên bản bị bỏ qua).

## Vấn đề

`scripts/thu-duoi-s06.sh` bước 7 (chọn-nạp) với mỗi vùng: liệt `snapshots/<vùng>/`, sắp giảm dần, lấy bản ĐẦU TIÊN chưa có
trong `airbnb_snapshots`, gọi `import-chotot.mjs` cho nó. Bản nào `readSnapshot` từ chối trước khi ghi sổ nạp (manifest thiếu
hay hỏng, schema lạ, finishedAt hỏng, checksum sai, thiếu tệp) thì không bao giờ vào sổ → mỗi vòng chọn lại nó, nạp lỗi, thoát
1, và mọi bản cũ hơn cùng vùng không bao giờ tới lượt. Bản khai `source` khác thì `readSnapshot` gọi `process.exit(0)` — vòng
thoát 0 trong im lặng, vẫn chặn.

Đo S1 trên main c644f2a50 bằng probe mới (bản chép snapshot thật, làm hỏng từng lớp): cả bảy lớp đều «CHAN HANG DOI» (vòng 1
nạp bản hỏng thay vì bản lành cũ hơn), «IM LANG» (không dòng log), «CHON LAI» ở vòng 2; ca `source-khac` thoát 0. Hai ca đúng
sẵn trên main (đối chứng): bản lành nạp lỗi tạm không bị đánh dấu; bản hỏng y nguyên từng byte.

## Thiết kế

Trong đoạn `node -e` của bước 7 (giữ nguyên chuỗi `airbnb_snapshots` để shim test của ZC18 còn khớp):

1. Đọc tệp đánh dấu `$GOC/bo-qua-hong.json` (đối tượng `{ <tên thư mục>: { lyDo, luc } }`; tên thư mục theo khuôn
   `<vùng>__chotot-ads__<mốc>` nên mang tiền tố vùng — hai vùng không trùng khoá, và ca thiếu manifest vẫn có khoá). Vắng hay không phải JSON → coi
   như `{}` (AC-7).
2. Duyệt ứng viên mới → cũ, bỏ qua id đã nạp (sổ nạp) và id đã đánh dấu. Với mỗi ứng viên còn lại, gọi hàm kiểm `hongVi(dir)`:
   - đọc `manifest.json`; `source !== "chotot-ads"` → lý do «source khác» (kiểm TRƯỚC, vì `readSnapshot` thoát tiến trình ở nhánh này);
   - gọi `readSnapshot(dir)` của chính `import-chotot.mjs` (cùng luật với bộ nạp: schema, finishedAt, sha256, parse items);
     ném lỗi → lý do = thông điệp lỗi.
   - Đọc được → trả đường dẫn bản ấy (in stdout), dừng.
3. Bản hỏng: thêm khoá vào tệp đánh dấu (ghi tmp + rename), in ra stderr đúng một dòng
   `<giờ> bỏ qua snapshot hỏng <id>: <lý do> — không xoá, không sửa`, đánh cờ «có bản mới bị bỏ qua», rồi xét bản kế.
4. Wrapper: đoạn chọn-nạp vẫn thoát 0 (mã khác 0 của nó đang mang nghĩa «tra sổ lỗi → dừng fail-closed», không dùng lại).
   Có bản mới bị bỏ qua → in thêm dòng cờ `BO-QUA-MOI` trên stdout TRƯỚC dòng đường dẫn; bash tách cờ, đặt `RC=1` (vòng thoát
   1 cuối vòng), vẫn nạp bản lành đã chọn. Vòng kế: bản đã đánh dấu bị lọc ở bước 2 → không dòng log, không cờ.
5. Lỗi nạp của bản ĐỌC ĐƯỢC (DB đứt, stg lỗi) không đi qua bước kiểm → không bao giờ bị đánh dấu → vòng sau thử lại (AC-6,
   giữ ZC18 AC-6).

Mốc `/* ZC26-KIEM */` đứng ngay sau khai báo `hongVi`, để probe đột biến thay hàm bằng `() => null` trên bản chép.

### Vì sao dùng `readSnapshot` thay vì chép luật kiểm

Bộ nạp là bên đọc thật. Chép luật (schema, sha256, finishedAt) sang wrapper là hai bản luật có thể lệch: bộ nạp nâng
`SUPPORTED_SCHEMA_VERSIONS` thì wrapper đánh dấu nhầm bản lành. Gọi đúng hàm của bộ nạp thì «đọc được» của wrapper bằng «đọc
được» của bộ nạp. Giá: kiểm đọc trọn tệp items (vài KB mỗi bản đuôi) — rẻ.

### Vì sao vòng đầu thoát 1

Người vận hành đọc log job theo mã thoát. Thoát 0 thì một bản hỏng có thể bị bỏ qua mà không ai mở log. Probe chọn-nạp của
ZC18 (đã ký) vòng 6 dựng bản hanoi checksum sai và đòi thoát 1 + hcmc vẫn nạp; thiết kế này giữ đúng lời đó.

### Vùng toàn bản hỏng

Không còn bản đọc được → đoạn chọn-nạp in cờ `BO-QUA-MOI` mà không in dòng đường dẫn; bash chỉ gọi bộ nạp khi có dòng
đường dẫn, nên vùng ấy 0 lời gọi nạp, vòng thoát 1. Vòng kế: mọi bản đã đánh dấu → in rỗng, thoát 0.

## Phép đo

- `probes/bo-qua-hong.mjs` (E1–E7): wrapper thật + `import-chotot.mjs` thật trên DB của riêng lượt (`db-thu.sh`), bảy lớp hỏng,
  ca nạp lỗi tạm (bộ nạp thay bằng stub thoát 1), ca tệp đánh dấu hỏng, ca đột biến bỏ kiểm. Snapshot lành từ phép đo 24 giờ
  của làn thu (writer thật), đổi tên sang vùng hanoi.
- `probes/pham-vi.mjs` (E8).
- Ba phép đo của ZC18 chạy lại trên mã mới (E9a–c).

## Không làm

Xem Out of scope của contract. Không chạm `import-chotot.mjs`, không cài lịch, không xoá/dời bản hỏng.

## Bỏ đặc tả UX

Hàng không chạm giao diện (surfaces: cli) — dòng `descope` trong sổ.
