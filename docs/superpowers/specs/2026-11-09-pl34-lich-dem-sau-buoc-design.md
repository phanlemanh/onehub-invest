# PL34 lịch đêm — job Zalo sáu bước (phần làn Claude)

Hồ sơ: `_acceptance/pl34-lich-dem-sau-buoc/` · hàng `pl34-lich-dem-sau-buoc` của đợt dot0-cam-mau (giám sát giao 09/11).

## Bối cảnh

PL34 (`doc-gop-hang-ngay`, PR #371) dựng lệnh đọc gộp S03 hằng ngày và để việc gắn vào lịch đêm cho làn ZCode
(`doc-gop-hang-ngay#d-20261107T231918Z-9`). ZCode (vòng claudedp-0911-7, nhánh `zcode/pl34-lich-dem` ＠3b7bc85c) thêm một
dòng vào `scripts/zalo-import-daily.sh`, ngay sau dòng nhả khoá nạp và trước `enrich-run`:

```bash
job_run zalo-import-daily doc-gop-hang-ngay bash "$ROOT/pipeline/doc-gop-hang-ngay.sh"
```

Dòng ấy là làn ZCode; hàng này không sửa nó. Kho có bảy tệp test nhắc `zalo-import-daily` (năm ở `scripts/`, hai ở
`pipeline/scripts/`); trên nhánh, `node --test scripts/*.test.mjs` đỏ thêm 11 ca ở bốn tệp, ba tệp còn lại vẫn xanh:

| Tệp | Ca đỏ | Vì sao |
|---|---|---|
| `scripts/zalo-import-job.test.mjs` | ZJ-AC-1, ZJ-AC-2, NH-AC-10 | cây giả không có `pipeline/doc-gop-hang-ngay.sh` → bash thoát 127 → `JOB FAIL`; dãy bước ghim năm |
| `scripts/enrich-buoc-job.test.mjs` | EC-AC-6 (2 ca), EC-AC-7, EC-AC-8 | như trên |
| `scripts/nap-ts-order.test.mjs` | ba ca `zalo-import-daily.sh` | như trên |
| `scripts/zalo-import-job-lan.test.mjs` | ZL-AC-2 | chạy lại `zalo-import-job.test.mjs` trên nhánh ZCode giả |

Tiêu chí đã ký `enrich-chay-sau-nap#AC-6` (Mạnh 30/10) ghim đúng năm bước: «import-airbnb · transform-zalo ·
transform-media · refresh-bait-gap · enrich-run». Hàng này thay lời ấy bằng AC-1 (sáu bước), như `enrich-chay-sau-nap`
đã thay lời «bốn bước» của `media-canonical-reso#AC-10`.

## Thiết kế

1. **Tệp giả một dòng cho bước mới trong cây test.** Mỗi cây tạm của bốn tệp test có thêm
   `pipeline/doc-gop-hang-ngay.sh` nội dung `exec node "$(dirname "$0")/doc-gop-hang-ngay.mjs"`. `node` giả đầu `PATH` lấy
   nhãn từ tên tệp `.mjs` đầu tiên, nên bước mang nhãn `doc-gop-hang-ngay`, được ghi vào `CALLS`, ghi trạng thái khoá nạp
   (EC-AC-8) và nhận `FAIL_STEPS` như mọi bước khác — không thêm cơ chế giả thứ hai.
   - Không chép bản thật: `pipeline/doc-gop-hang-ngay.sh` tự gọi `node -e` hai lần để tính ngày VN rồi gọi `doc-gop-s03.ts`
     hai lần; chép vào cây giả thì dãy bước lẫn bốn lời gọi không thuộc tệp bọc, và phép đo đo tệp con chứ không đo tệp
     bọc.
   - Tệp giả che được việc tệp thật vắng mặt hay chạy sai ngữ cảnh, nên AC-3 kiểm riêng: tệp thật có trong kho, đường trong
     dòng `job_run` trỏ đúng nó, và một ca chạy chính tệp thật trong cây job (`node -e` chạy node thật, lời gọi
     `doc-gop-s03.ts` qua node giả ghi argv + cwd, giờ cố định) — hai lời gọi trong `agent/`, ngày hôm qua và hôm kia giờ VN.
2. **Dãy bước kỳ vọng thành sáu** trong `zalo-import-job.test.mjs` và `enrich-buoc-job.test.mjs`: `doc-gop-hang-ngay` đứng
   giữa `refresh-bait-gap` và `enrich-run`. Chú thích đầu tệp ghi lời «năm bước» của `enrich-chay-sau-nap#AC-6` thay bởi
   `pl34-lich-dem-sau-buoc#AC-1`.
3. **Ca mới cho bước mới** (cùng khuôn ZJ-AC-2/EC-AC-7): bước `doc-gop-hang-ngay` hỏng mã n → đúng một dòng
   `JOB FAIL [zalo-import-daily] bước doc-gop-hang-ngay mã n`, `enrich-run` vẫn chạy; chạy khi khoá nạp đã nhả.
4. **Lưới trước-gộp sạch trên nhánh.** Đo 09/11 trên nhánh ZCode: vi phạm duy nhất là «PR đổi tệp ngoài T1 mà không kèm
   hồ sơ» (`scripts/zalo-import-daily.sh`); không hồ sơ đã ký nào hoá cũ. Hồ sơ này gỡ vi phạm ấy; nếu tới lúc chấm có hồ sơ
   đã ký hoá cũ thì ghim lại nó trong cùng PR.

## Bảng thay lời tiêu chí

| Tiêu chí cũ | Lời cũ | Thay bởi |
|---|---|---|
| enrich-chay-sau-nap/AC-6 | dãy bước năm bước, enrich-run cuối | pl34-lich-dem-sau-buoc#AC-1 (sáu bước, `doc-gop-hang-ngay` trước `enrich-run`) |

Eval E8, E11 của `enrich-chay-sau-nap` vẫn chạy (lệnh của chúng thoát 0 sau khi sửa test), nên không khai `status:
not-run`/`superseded_by` — luật «eval thay bởi» dành cho eval mất vật đo.

## Ngoài phạm vi

- Dòng `job_run` trong `scripts/zalo-import-daily.sh` và lịch launchd: làn ZCode.
- Bằng chứng đêm đầu (dòng `{"pl34": …}` usd ≤ 20 trong `pipeline/logs/zalo-import.log`): đo sau khi gộp và chạy đêm thật.
- `scripts/apify-facebook-daily.sh` không đổi.
