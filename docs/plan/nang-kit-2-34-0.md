# Nâng Acceptance Gate Kit lên 2.34.0 — kế hoạch chuyển bản (25/10/2026)

Kit phát hành 2.34.0 ngày 25/10 (thẻ `v2.34.0` = `0e095648`). Tài liệu này ghi ba việc: kho đã nhận gì, lỗi kit nào
đã sửa hay chưa, và từng phiên chuyển sang bản mới lúc nào. Nguồn: mục `## 2.34.0` và `## 2.33.1` của `CHANGELOG.md`
trong kit, `docs/handoff/2026-10-25-nhan-2-34-0-tu-2-9-0.md` của kit, cùng phép so mã giữa ba thẻ `v2.32.0`,
`v2.33.1` và `v2.34.0`.

## 1. Kho đang ở đâu, nhận gì

**Lớp chép CI đã ở 2.33.1, không phải 2.32.0 hay 2.9.0.** Tài liệu bàn giao của kit viết «invest đang ở 2.9.0», nhưng
số đó đã cũ. So từng byte: 21 tệp chép đều trùng thẻ `v2.33.1` (commit `4f18e5ef` đã chép lại). Riêng dòng chú thích
của workflow vẫn ghi 2.32.0. Đường bộ đệm plugin trong `_acceptance/config.yaml` trỏ vào thư mục `2.32.0`.

**PR này đổi:**

| Tệp | Đổi |
|---|---|
| `scripts/lo-trinh.mjs` | chép lại từ 2.34.0: dòng «Nguồn:» khi mở ô (TT3). Chỉ chạy khi kho khai `tri_thuc`; kho này không khai nên đầu ra như cũ |
| `skills/acceptance/references/opportunity-template.md` | chép lại từ 2.34.0: thêm khối `OPP-NGUON-PREFIX` |
| `scripts/check-lo-trinh.sh` | `KIT_VER` 2.33.1 → 2.34.0. Bước 6 so bốn bản chép lộ trình với bản cài, nên khi bản chép lên 2.34.0 thì số này phải lên theo |
| `.github/workflows/acceptance-gate.yml` | sửa chú thích số bản kit |

Mười chín tệp chép còn lại đã trùng byte với 2.34.0. Kho không khai `tin_hieu` và `tri_thuc`, nên không chép các tệp
có nhãn `[only-if-declared: …]` của hai khối ấy.

**`_acceptance/config.yaml`: không đổi.** Bản 2.34.0 không đòi khoá mới nào. Khối `tri_thuc` là tuỳ chọn, kho chưa
dùng. Khoá `gop_khong_chay_lai_ci` nằm trong cấu hình đợt, không nằm ở đây. Đã ghi nhận: `executors.script` có khoá
`sync_pii_mutation` khai hai lần (dòng 117 và 124), cùng một giá trị nên vô hại. PR này không nhân thêm và không xoá;
bản sửa nên đi kèm PR kế chạm config.

**Plugin trên máy (đã làm 25/10, Mạnh duyệt):**

- Đã cập nhật marketplace `acceptance-gate-kit` tới `45e9f2c`, tức thẻ cộng một commit chỉ chạm tài liệu (#412).
- `acceptance-gate` và `feature-loop` 2.33.1 → 2.34.0, scope project `/Users/manhphan/dev/onehub-invest`.
- Cài mới `road-map` và `dieu-phoi` 2.34.0, scope project, cho riêng invest. Bản `dieu-phoi` 2.33.1 ở scope user giữ
  nguyên nên crm không bị động tới. Lệnh cài tự viết lại `.claude/settings.json` của checkout chính: đảo thứ tự khoá
  và thêm `dieu-phoi` vào `enabledPlugins`. Tệp ấy nằm trong `t3_paths` và bị bước 1 của `check-lo-trinh.sh` canh, nên
  đã trả tệp về đúng từng byte cũ. Hệ quả: `dieu-phoi` vẫn được bật qua cài đặt user như trước. Muốn khai nó ở cấp kho
  thì làm một hồ sơ T3 riêng.
- `diagram-design` giữ 2.7.1 (kit không đổi).
- `kiem-ban-cai --may --ref v2.34.0` cho kết quả **ĐỎ 1/65**. Bản ghi đỏ là `acceptance-gate` 2.34.0, và nó lệch thẻ ở ba
  tệp không phải mã (`LO-TRINH.html`, `docs/plans/lo-trinh-kit.json`, `kiem-ban-cai-sau-tag.txt`), vì marketplace kéo
  đỉnh `main` chứ không kéo thẻ. Mã chạy trùng thẻ. `feature-loop`, `dieu-phoi`, `road-map` 2.34.0 đều ĐẠT. Các dòng
  VÀNG là bản ghi theo từng worktree (vẫn 2.33.1) và bản ghi của kho khác.

**Bản ghi theo worktree.** `claude plugin update --scope project` gọi từ một worktree vẫn nâng bản ghi của checkout
chính, không nâng bản ghi riêng của worktree. Chưa rõ phiên mở trong worktree nạp bản ghi nào, nên mỗi phiên dãy phải
tự kiểm sau khi chuyển (mục 3.1, bước kiểm).

## 2. Đổi gì từ 2.32.0 tới 2.34.0 — phần chạm kho này

| Mảng | Thay đổi | Chạm invest |
|---|---|---|
| Lệnh | Gói mới `tri-thuc` (`/tri-thuc:kiem`, `/tri-thuc:ghi`) | Không, vì kho không khai `tri_thuc` |
| Lệnh `dieu-phoi` | `gop <PR> [--slug] [--xet]` gộp dưới khoá merge bằng `--match-head-commit` · `nha <tn> --ma --ha-tang` · `hieu-chuan` · `hang them … --ranh-gioi <glob,…>` · `tin` (hộp tin trong đợt, 2.33.1) · `dem` in `ky_den_gop` | Có, sau khi nâng lõi đợt |
| Lệnh bỏ | Không có lệnh nào bị bỏ hay đổi tên | — |
| Hồ sơ `_acceptance/` | Ảnh chỉ được tính khi tệp có thật dưới `evidence/` của chính hồ sơ (`anh-co-that-trong-ho-so`). Ô cơ hội có thể mang dòng «Nguồn:» (chỉ khi khai `tri_thuc`) | Thẻ Cổng Bằng chứng có thể báo thiếu ảnh ở hồ sơ trỏ ảnh ra ngoài |
| feature-loop | PR chuyển sẵn sàng ngay lúc trình thẻ Cổng Bằng chứng (`pr-san-sang.mjs`). Làn đối chứng chạy được trong worktree cô lập (#401) | Có. `gate` là check bắt buộc của `main`, nên dù PR sẵn sàng trước chữ ký, người vẫn không gộp được trước chữ ký |
| config.yaml | Không có khoá bắt buộc mới | Không đổi |
| CI | Bốn tệp chép đổi, chỉ `lo-trinh.mjs` thuộc diện kho này | Đã chép |
| Cấu hình đợt | `suc_khoe.swap_gb` và `rss_gb` hết tác dụng, chỉ còn `ap_luc_muc`. Khoá mới `gop_khong_chay_lai_ci` (mặc định tắt) | Cấu hình đợt `dot0-cam-mau` còn `swap_gb: 8`, `rss_gb: 32`, nay là khoá chết |
| Lịch đợt | Lịch biết tệp: hàng chưa bắt đầu chỉ được giao khi `ranh_gioi` không trùng PR đang mở hay hàng dở ở dãy khác. Hàng không khai vùng tệp thì phát sự kiện `ranh-gioi-vang`, không chặn | 9/56 hàng của đợt có `ranh_gioi`, 47 hàng còn lại sẽ phát cảnh báo vàng |
| Hook | `hooks.json` của `acceptance-gate` và `dieu-phoi` không đổi giữa 2.33.1 và 2.34.0. Khối `Stop` (`hook-tin`) đã có từ 2.33.1 | Không cần dựng lại hook |
| Kênh liên máy | `tin*.mjs` không đổi từ 2.33.1. Lệnh bọc `~/dev/onehub-coord/bin/tin` lấy bản cache mới nhất, nay là 2.34.0 | Không ảnh hưởng ZCode |

## 3. Lỗi kit giám sát ghi trong đợt — đối chiếu với 2.34.0

| Lỗi | 2.34.0 | Ghi chú / lối tạm |
|---|---|---|
| LO-TRINH.html và PRODUCT-MAP.md xung đột gần như mỗi lần gộp, phải ghim lại | **Chưa sửa** | Kit có hạt giống `docs/plans/2026-10-16-hat-giong-tep-sinh-xung-dot-moi-lan-goi.md`, đang để «chưa làm». Lệnh `gop` mới chỉ bớt việc gộp lại khi tệp không trùng, mà tệp sinh thì luôn trùng. Lối tạm giữ như cũ: sinh lại bằng `node scripts/product-map.mjs --root .` |
| CLI thiếu lệnh bỏ nghỉ một dãy và lệnh đặt `uu_tien` | **Chưa sửa** | `hang` vẫn chỉ có `day-len`, `them`, `nghi`. Lối tạm: sửa tay `hang-viec.json` trong khoá `hang-viec.khoa` (mkdir) |
| `suySlug` cắt slug dài; `hang them <mã>` biến mã thành slug viết thường | **Chưa sửa** | `nguon-hang.mjs` không đổi (sáu từ đầu, viết thường). `themHang` chỉ tra mã trong `hang-viec.json`, không tra lộ trình. Lối tạm: thêm hàng bằng slug đầy đủ |
| `danh-thuc` báo «giám sát không có nhịp sống» dù giám sát đang chạy | **Chưa sửa** | `danh-thuc.mjs` không đổi. Phần đổi của `hook-nhip.mjs` chỉ là phần tin |
| Khoá s4 ghi slug của hàng kế, không phải hàng đang chấm | **Chưa sửa** | `ghiDon` vẫn lấy `slugKeCua`. Lối tạm đã có từ trước: `xin s4 --slug <slug>` |
| Thiếu `design-scan.js` làm chân `cong_cu` đỏ | **Chưa sửa** (nửa kho, nửa kit) | Tệp có trong cache. Chân `cong_cu` của `duong-nen.mjs` (không đổi từ 2.32.0) gọi `command -v` trên từ đầu của `executors.design.ui_check`. Đó là một tệp `.js` không có quyền chạy, nên ra THIẾU (45 dòng đỏ trong các `duong-nen.md`). Kit chỉ bỏ qua từ đầu có cú pháp shell, như khuôn `${CLAUDE_PLUGIN_ROOT}/scripts/design-scan.js`. Lối sửa phía kho: đổi `ui_check` sang khuôn ấy. Việc này chạm hồ sơ UI đã ký nên tách PR riêng |
| `product-map.mjs` của plugin làm CI gate đỏ, phải dùng bản của kho | **Đã sửa** | Từ 2.33.1, khối `MAP-STAGE` chạy bản chép của kho khi có. Bản của plugin 2.34.0 nay cũng trùng byte bản của kho |

Lỗi mới thấy khi nâng (gửi kit cùng đợt):

- Tài liệu bàn giao `2026-10-25-nhan-2-34-0-tu-2-9-0.md` ghi invest đang ở 2.9.0. Thực tế lớp chép ở 2.33.1, đường
  cache trong config ở 2.32.0.
- Kit dặn «cài theo ĐÚNG THẺ», nhưng `claude plugin marketplace update` kéo đỉnh `main`. Khi `main` đã nhích sau thẻ
  (#412, chỉ tài liệu) thì `kiem-ban-cai --may` báo ĐỎ, dù mã trùng thẻ. Ngoài ra lệnh update dựng lại bản clone
  marketplace mà không kéo thẻ, nên `--root <marketplace>` báo «ref không có: v2.34.0». Phải clone riêng để kiểm.
- `kiem-ban-cai` khuyên «cài lại ở: project …» cho bản ghi theo worktree. Nhưng gọi `plugin update --scope project`
  từ worktree chỉ nâng bản ghi của checkout chính.

Không tự sửa kit từ kho này (memory `kit-bugs-hand-to-kit`). Danh sách trên chuyển cho phiên điều phối của kit qua
phiên giám sát.

## 4. Kế hoạch chuyển bản

### 4.1 Luật chung cho mọi dãy

- **Chỉ chuyển ở ranh giới giữa hai hàng**, hoặc giữa S3 và S4 của một hàng khi khoá `s4` chưa cấp cho dãy ấy. Không
  chuyển khi dãy đang giữ khoá `s4`, `ghim-lai` hay `merge`, và không chuyển giữa một vòng S4.
- **Mở phiên mới cho hàng kế**, không `/reload` phiên cũ. Kit dặn «Mở phiên MỚI». `/reload-plugins` vẫn đủ về mặt
  hook, vì hook không đổi giữa 2.33.1 và 2.34.0, nhưng ranh giới hàng vốn đã là chỗ mở chip mới, nên mở mới không tốn
  thêm gì.
- **Bước kiểm sau khi mở:** khi phiên nạp skill `feature-loop`, dòng «Base directory» phải chứa `/2.34.0/`. Nếu vẫn ra
  `/2.33.1/` vì bản ghi theo worktree chưa nâng, phiên báo giám sát. Lối xử: Mạnh nâng ngay trong phiên ấy bằng
  `/plugin`, hoặc giám sát chạy `claude plugin install <gói>@acceptance-gate-kit --scope project` từ worktree đó. Lệnh
  sau ghi `.claude/settings.json` của worktree, nên phải trả tệp về như cũ.
- Hàng đang dở giữ bản cũ tới hết hàng. Hồ sơ không phải chuyển định dạng vì mọi thay đổi đều có đường đọc-cũ.

### 4.2 Từng dãy

| Dãy | Worktree | Hiện trạng (25/10) | Chuyển lúc | Mở lại hay /reload |
|---|---|---|---|---|
| P2 | `bold-bassi-0e7f42` | AU12 (T3) đã ký, chờ ghim lại | Sau khi ghim lại xong và PR AU12 đã giao giám sát. Ghim lại chạy hết trên bản đang có | Mở phiên mới cho hàng kế |
| P3 | `nice-goodall-629173` | AU11 vòng 2 (S4), AU9 đang S3 | Sau khi vòng 2 của AU11 ra phán quyết và khoá `s4` đã nhả, trước khi AU9 `xin s4`. Nếu P3 muốn chấm AU9 liền sau AU11 thì chuyển sau khi PR của AU9 đã giao | Mở phiên mới. Nếu AU9 phải chấm trong phiên cũ thì không chuyển giữa chừng |
| P4 | `brave-northcutt-955c6a` | C7 chờ chấm; lúc 11:18Z giữ khoá `s4` | Sau phán quyết S4 của C7 và khoá đã nhả. Nếu C7 chưa thật sự vào S4 thì chuyển được ngay trước khi `xin s4` | Mở phiên mới |
| U1 | `u1-compare-saved` | UI5 chờ chấm | Như P4: trước `xin s4` nếu chưa vào S4, không thì sau phán quyết | Mở phiên mới |
| N1 | `quirky-archimedes-75aa8c` | Liên làn: snapshot-nguyen-tu, khoa-nap-s05-paused, seen-cap-r2, chotot-khong-lui, watchdog-l4b-history (dãy đang mang cờ `nghi` trong `hang-viec.json`) | Giữa hai mục, khi không mục nào đang S4 hay ghim lại. Kênh ZCode (`bin/tin`) đã tự lấy 2.34.0, `tin*.mjs` không đổi | Mở phiên mới ở mục kế |
| P1, U2 | — | Nghỉ / chưa có worktree | Mở mới thì dùng 2.34.0 luôn | — |

### 4.3 Đợt `dieu-phoi-dot0-cam-mau`: nâng lõi `loi/` 2.32.0 → 2.34.0

**Nâng được giữa đợt.** Kit dựng sẵn đường này. `chay` chép mọi `*.mjs` cùng thư mục `mau/` của gói vào `loi/` rồi
ghi `PHIEN-BAN.json`. Chẩn đoán (`moi-truong.mjs`) cũng nói thẳng: «lõi đợt bản X, gói đang cài bản Y — chạy `chay`
sau khi dừng bộ phát lịch nếu muốn dùng lõi mới». Không cần `ban-giao` hay `tiep-tuc`; hai lệnh ấy dành cho việc đổi
tài khoản và nối lại vai.

**Định dạng thư mục đợt tương thích.** `dot.mjs` (bộ đọc lõi) không đổi. Các phần mới đều tuỳ chọn và có đường
đọc-cũ: `tin.jsonl`, sổ đo lượt (`do-lan`), `ranh_gioi` theo hàng, bản chụp PR trong `trang-thai.json`, khoá
`gop_khong_chay_lai_ci`. Hai khoá `suc_khoe.swap_gb` và `rss_gb` thành khoá chết nhưng không làm hỏng gì. Rút lui
được: bộ đệm 2.32.0 vẫn còn trên đĩa.

**Cách làm** (phiên giám sát, từ checkout chính):

1. Chờ lúc `ls .acceptance-runs/dieu-phoi-dot0-cam-mau/khoa/` rỗng: không khoá `s4`, `ghim-lai`, `merge` nào đang
   cấp, và không dãy nào đang S4.
2. `node ~/.claude/plugins/cache/acceptance-gate-kit/dieu-phoi/2.34.0/scripts/dieu-phoi.mjs dung`
3. `node ~/.claude/plugins/cache/acceptance-gate-kit/dieu-phoi/2.34.0/scripts/dieu-phoi.mjs chay`

   Phải gọi bằng **đường của gói 2.34.0**. Gọi `node <đợt>/loi/dieu-phoi.mjs chay` thì không chép gì, vì `chepLoi` bỏ
   qua khi nguồn chính là `loi/`.
4. Kiểm: `cat .acceptance-runs/dieu-phoi-dot0-cam-mau/loi/PHIEN-BAN.json` phải ra `"phien_ban": "2.34.0"`. Sau đó
   `node …/loi/dieu-phoi.mjs chan-doan` không còn dòng `ban-goi`, và `xem` vẫn ra đủ bảy dãy.
5. Monitor đang canh `phat-lich.log` cứ để chạy, vì tệp log giữ nguyên.
6. Rút lui khi cần: `dung`, rồi gọi `chay` bằng `…/dieu-phoi/2.32.0/scripts/dieu-phoi.mjs`.

Nâng lõi độc lập với việc chuyển từng dãy: lõi chạy bộ phát lịch và CLI, còn phiên thợ chạy hook và skill của gói cài.
Hai bên đọc chung một định dạng đợt.

**Việc kèm theo sau khi nâng** (chỉ giám sát làm; thư mục đợt là của giám sát):

- Gỡ `swap_gb` và `rss_gb` khỏi `suc_khoe` trong `dieu-phoi.config.json`, giữ `ap_luc_muc: 2`.
- Khai `ranh_gioi` cho các hàng chưa bắt đầu, dùng `hang them … --ranh-gioi` hoặc sửa trong khoá. Làm vậy thì lịch mới
  tránh giao hai việc chạm cùng tệp và bớt được sự kiện `ranh-gioi-vang`.
- `gop_khong_chay_lai_ci` **chờ Mạnh quyết**, máy để mặc định tắt. Khi tắt, lệnh `gop` chỉ gộp khi nhánh đã chứa đỉnh
  `main`. crm đã chấp nhận rủi ro ngày 23/10: lỗi lọt qua thì CI trên `main` bắt. Ở invest, `main` có `gate` và
  `ui-lint` là check bắt buộc, `strict: false`.

### 4.4 Phiên giám sát `local_5137d362-e278-49b5-aa3e-8be338759710`

Phiên giám sát đứng ở checkout chính, nơi bản ghi project đã lên 2.34.0.

1. **Ngay khi rảnh** (không giữa một lượt gộp): mở phiên giám sát mới bằng `/dieu-phoi:tiep-tuc`, hoặc `/reload-plugins`
   trong phiên đang chạy. Sau bước này skill `/dieu-phoi:*`, `acceptance-gate` và `feature-loop` của giám sát là
   2.34.0. Skill `/dieu-phoi:tiep-tuc` của gói mới tự chép lõi 2.34.0 nếu lúc ấy bộ phát lịch đã chết, vì nó gọi
   CLI qua `${CLAUDE_PLUGIN_ROOT}`. **Kiểm:** dòng «Base directory» của skill `dieu-phoi` phải chứa `/2.34.0/`.
   `dieu-phoi` vẫn bật qua cài đặt user (bản ghi user 2.33.1, bản ghi project 2.34.0), nên chưa chắc phiên nạp bản
   nào. Nếu ra `/2.33.1/` thì mọi việc ở 4.3 vẫn làm được bằng đường gói 2.34.0 viết thẳng.
2. **Nâng lõi đợt** theo mục 4.3, lúc không có khoá nào cấp. Có thể làm trước hay sau bước 1.
3. **Đường CLI không đổi:** vẫn là `node .acceptance-runs/dieu-phoi-dot0-cam-mau/loi/dieu-phoi.mjs …`. Không lệnh nào
   bị đổi tên.
4. **Lệnh mới dùng được sau khi nâng lõi:** `gop <PR> [--slug <s>] [--xet]` (gộp dưới khoá merge; hiện giám sát vẫn
   gộp bằng `gh pr merge`, có thể chuyển dần). Thêm `dem --json` (đo ký → gộp), `hang them … --ranh-gioi`,
   `nha <tn> --ma <mã> --ha-tang <lý do>`, `hieu-chuan`, và `node …/loi/tin.mjs` (hộp tin trong đợt).
5. **Vẫn chưa có:** lệnh bỏ nghỉ dãy và lệnh đặt `uu_tien`. Tiếp tục sửa tay `hang-viec.json` trong khoá như hiện nay
   (mục 3).
6. **Điều phối chuyển dãy** theo bảng 4.2: báo từng thợ «hết hàng này thì đóng phiên; hàng kế mở chip mới», rồi kiểm
   dòng «Base directory» của họ.

## 5. Việc còn lại sau PR này

- Gửi các lỗi kit ở mục 3 cho phiên điều phối của kit.
- Đổi `executors.design.ui_check` và các lệnh `design_gate` khỏi đường cache `2.32.0`, sang khuôn
  `${CLAUDE_PLUGIN_ROOT}/…` (tài liệu bàn giao của kit §1.2). Chân `cong_cu` sẽ hết đỏ nhờ việc này. Phải tách PR riêng
  có hồ sơ, vì đổi giá trị khoá có thể làm lệch bằng chứng của hồ sơ UI đã ký; trước khi gộp, chạy thử một eval
  `config:` trong làn ghim lại.
- `bash scripts/check-lo-trinh.sh static` đỏ sẵn trên `main`, cả khi dùng kit 2.33.1. Răng phủ đã phát cảnh báo
  `[moc-ngoai-da-bo]` cho mốc OM1, OM2 của `docs/plan/lo-trinh.json`, và thước này tính mọi cảnh báo là đỏ. Đỏ ấy có
  từ trước PR này; dọn khi cắt lại lộ trình. `mutation` vẫn bắt đủ 6/6.
- Khai `dieu-phoi@acceptance-gate-kit` trong `.claude/settings.json` (T3) nếu muốn mọi máy được nhắc cài gói này.
