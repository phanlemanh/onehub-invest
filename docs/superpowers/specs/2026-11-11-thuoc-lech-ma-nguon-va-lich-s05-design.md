# Sửa hai thước lệch trên main: mã nguồn hai chữ số và lịch S05

Hàng `thuoc-lech-ma-nguon-va-lich-s05`, dãy P2, do giám sát đợt mở ngày 11/11. Hai thước của kho đỏ trên main mà
vật không hỏng. Lượt ghim lại bốn hồ sơ sau au3 (`repin-20261111T081549Z-64647`, main 2d1a97fc) đỏ ở ba eval của
hồ sơ `khoa-nap-s05-paused`:

| Thước | Đỏ | Vì sao |
|---|---|---|
| `scripts/bao-cao-ngay.test.mjs:166` (E9, suite `scripts/*.test.mjs`) | «độ tươi chỉ mang mã S0x» | Bộ đăng ký nguồn nay có S10, S11 (nguồn `draft`, #416). `freshnessBad` = `S01/…`, `S10/…`, `S11/…` — vẫn chỉ mang mã, không mang tên nguồn thật. Regex `^S0\d\/` của test chỉ nhận một chữ số. |
| `_acceptance/khoa-nap-s05-paused/probes/lich-s05.mjs` (E11, E12) | «mặc định không env: trần 100, cửa sổ '5 days'» | Probe ghim cửa sổ mặc định bằng chuỗi `^4 day`. Hồ sơ `s05-khoa-nap` (Mạnh ký 02/11, AC-1 «cả hai là `5 days`», commit 87a3c1d5) đã đổi mặc định sang 5 ngày. |

Ca KDM-AC-3 (`scripts/kiem-tin-rao-gan-khu-vuc.test.mjs`) cũng đỏ trong cùng suite nhưng thuộc hàng
`do-san-sl1-kdm` của P3 — ngoài phạm vi.

## Thiết kế

1. **Báo cáo ngày nhận mọi mã nguồn `S` + hai chữ số.** Ca DB của `bao-cao-ngay.test.mjs` kiểm `freshnessBad` qua
   một hàm thuần `chiMaNguon(dong)` đặt ngay trong tệp test: mỗi phần tử phải khớp `^S\d{2}\/`. Thông điệp đổi thành
   «độ tươi chỉ mang mã nguồn Sxx». Cùng tệp thêm một ca không cần DB, hai chiều trên cùng danh sách mẫu: `S01/…`,
   `S10/…`, `S11/…` qua; phần tử mang tên nguồn thật giả lập (`chotot/…`), chữ thường (`s10/…`) hay một chữ số (`S1/…`)
   thì hàm trả lỗi gọi tên phần tử. Ý của ca giữ nguyên: báo cáo ngày không in tên nguồn thật (luật 6, tầng A).
2. **Mã báo cáo không giả định S0x.** Đã soát: `scripts/bao-cao-ngay.mjs`, `scripts/lib/bao-cao-ngay.mjs`,
   `scripts/lib/freshness.mjs` không có regex `S0\d` / `S0[0-9]` / `S0[1-9]`; chúng chỉ gọi mã cụ thể (`'S03'`,
   `'S06'`). Probe `ma-bao-cao.mjs` của hồ sơ ghim điều đó bằng ma trận năm hình thái viết trước — regex
   `S0\d`/`S0[0-9]`/`S0[1-9]`, `startsWith("S0")`, nối `"S0" +`, regex `^S\d$`, cắt `.slice(0, 3)` — có hình thái nào thì đỏ
   gọi tên hình thái + tệp + dòng; tự kiểm chèn từng hình thái vào bản chép và phải bắt đủ năm.
3. **Thước lịch S05 đo quan hệ, không đo chuỗi.** Probe mới `probes/lich-s05.mjs` của hồ sơ này giữ mọi kiểm của probe
   cũ (plist hợp lệ; Thứ Ba + Thứ Sáu 06:00; không mốc hằng ngày; plist trần 100; plist cửa sổ ≥ 4 ngày; trần rác/âm →
   100; trần hợp lệ giữ; mỗi nhóm một địa chỉ; không còn «12 hours»), và thay kiểm «mặc định `^4 day`» bằng hai kiểm quan
   hệ: cửa sổ mặc định khi không có biến môi trường bằng hằng `S05_NEWER_THAN_MAC_DINH` của bộ thu, và hằng ấy ≥ 4 ngày
   (phủ khoảng Sáu → Ba). Đổi mặc định sau này mà vẫn ≥ 4 ngày thì thước không đỏ oan; hạ dưới 4 ngày thì đỏ.
   Quy đổi «N days», «N hours», «N weeks» ra ngày. `--tu-kiem` chạy hai đột biến tách nhau (hằng giả «3 days» → FAIL kiểm
   «≥ 4 ngày»; bộ dựng trả cứng «3 days» với hằng thật → FAIL kiểm «bằng hằng») và hai đối chứng dương «4 days», «96 hours».
4. **Thay E11, E12 của hồ sơ đã ký bằng con trỏ có chứng, không sửa lén.** Theo nếp «eval thay bởi hồ sơ» của kit
   (tiền lệ `do-khu-vuc-tu-dung-moi` thay E8 của `tin-rao-gan-khu-vuc-dung`): `_acceptance/khoa-nap-s05-paused/evals.yaml`
   ô E11 và E12 thêm `status: not-run` + `superseded_by: thuoc-lech-ma-nguon-va-lich-s05#AC-3`; E13 và các ô khác không
   đổi; probe cũ không đổi. Probe `thay-e11-e12.mjs` đọc tệp bằng `lib/eval-yaml.cjs` và kiểm đúng điều đó, chiều đỏ trên
   bản chép chuỗi (bỏ `superseded_by`, đổi slug, bỏ `status`, thêm `status` vào E13).
   Probe còn gọi bộ chứng con trỏ của kit (`chungThayBoi`, `lib/evidence-core.cjs` của acceptance-gate) trên cây: trước
   chữ ký của hồ sơ này nó phải trả `ho-so-thay-chua-ky` — nghĩa là các điều kiện đứng trước (con trỏ đúng khuôn, hồ sơ
   thay có mặt, thẻ hai đầu `khoa-nap-s05-paused/E11`, `khoa-nap-s05-paused/E12` trong hợp đồng, AC-3 có) đã qua; sau chữ
   ký trả `ok`. Giới hạn: trước chữ ký, lưới trước-gộp coi E11, E12 là xung đột — gộp PR sau chữ ký thì không vướng.

Không sửa code sản phẩm. Không đụng DB.

## Kiểm kê giả định S0x ngoài phạm vi (báo giám sát, không sửa ở hàng này)

| Chỗ | Giả định | Hệ quả khi có dữ liệu S10, S11 |
|---|---|---|
| `app/src/lib/dq-labels.ts:114-117` | `S0\d` khi dịch nhãn thực thể chất lượng | Nhãn Ops cho thực thể `S10/…` rơi về chữ thô |
| `app/src/lib/ops/people.ts:23` | `MA_NGUON = /^S0[1-9]$/` | Người từ nguồn S10+ không nhận mã |
| `pipeline/sync-cloud.mjs:162` | `SELLER_REF_RE = "^S0[1-9]:[0-9]+$"` | Mã người bán của nguồn S10+ không lên cloud |
| `db/migrations/053, 055, 065, 048` | CHECK `^S0[0-9]$`, `^S0[1-9]$` | Ghi media, danh bạ, nhãn bạc, sổ nhóm của S10+ bị từ chối |
| `pipeline/lib/vocab-core.mjs:537` | khoá cấp nguồn `^S0\d$` | Từ vựng theo nguồn S10+ báo lỗi khuôn |
| Nhiều test app/pipeline | regex `S0\d` | đỏ oan khi dữ liệu S10+ xuất hiện |

S10, S11 hôm nay là nguồn `draft` chưa thu, nên chưa chỗ nào ở trên gãy trên dữ liệu thật. Khi S10+ bắt đầu thu là việc
riêng (cần migration mới — T3).

## Phép đo

- `node --test scripts/bao-cao-ngay.test.mjs` — ca thuần hai chiều (AC-1) + ca DB máy thu (AC-2).
- `node _acceptance/thuoc-lech-ma-nguon-va-lich-s05/probes/ma-bao-cao.mjs [--tu-kiem]` (AC-5).
- `node _acceptance/thuoc-lech-ma-nguon-va-lich-s05/probes/lich-s05.mjs [--tu-kiem]` (AC-3).
- `node _acceptance/thuoc-lech-ma-nguon-va-lich-s05/probes/thay-e11-e12.mjs` (AC-4).
