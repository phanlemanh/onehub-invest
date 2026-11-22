# Thiết kế: trần thời gian lượt nạp S03 (s03-tran-thoi-gian-luot-nap)

Ngày 17/11/2026 · dãy U1 · hạng T2 · nguồn mã: nhánh ZCode `zcode/s03-tran-zalo-import` @99b2778e9 (gộp vào
`feat/s03-tran-thoi-gian-luot-nap` ở 4d9267d1a).

## Vì sao

Lượt nạp S03 lúc 00:00 hôm 17/11 chạy ≈ 5 giờ 38 phút (00:00 → 05:38, thoát 1 vì bước đọc gộp hỏng giữa chừng) mà không
có trần nào. Trong lúc đó job cloud-sync nhịp 15′ đụng lượt đang chạy. GS duyệt Cổng Đáng (U1-133): miễn con số trên màn,
thay bằng phép đo thời lượng lượt 00:00 đọc từ log.

## Mã ZCode đã viết (phía trên mốc làn, `scripts/zalo-import-daily.sh`)

1. Khoá có PID còn sống không bị gỡ ở MỌI lượt (trước chỉ lượt nhanh). Lượt 00:00 chờ tối đa `ZALO_IMPORT_CHO_KHOA`
   × 5 giây (mặc định 60 lần = 5′) rồi thoát 1.
2. Đồng hồ trần tổng: một tiến trình node chạy nền, ở nửa trần in WARN một lần, ở trần in TIMEOUT rồi gửi SIGTERM tới cả
   nhóm tiến trình của lượt (`-PGID`). Trần `ZALO_IMPORT_TRAN_TONG` mặc định 14400 giây (lượt 00:00), 1200 giây (lượt
   nhanh); ngưỡng WARN `ZALO_IMPORT_CANH_BAO` mặc định nửa trần. Node thật lấy ở `ZALO_IMPORT_NODE_BIN` hoặc
   `$HOME/.local/node-v24.21.0/bin/node`; thiếu thì trần tắt và in một dòng cảnh báo.
3. Trần phần nạp `ZALO_IMPORT_TRAN_NAP` (mặc định 1800 giây, đo bằng `$SECONDS` từ đầu lượt) ở cả vòng nạp tin lẫn vòng
   nạp hồ sơ: vượt thì dừng vòng, giữ con trỏ state, thoát 124 (khác 1 = lỗi nạp thường).
4. Không đổi plist.

## Ba lỗ đo được trên bản sao (17/11, U1)

- **Lỗ A — đồng hồ mồ côi.** Dòng `trap - EXIT; rm -rf "$LOCK_DIR"` (phía dưới mốc, có từ trước) gỡ luôn trap giết
  đồng hồ. Lượt 00:00 chạy hết chuỗi rồi thoát, node đồng hồ còn sống (ppid 1) tới mốc 4 giờ rồi gửi TERM tới nhóm. Dưới
  launchd nhóm của job bị dọn khi job thoát nên có lẽ vô hại; chạy tay, chạy bù, hay chạy trong test thì 4 giờ sau nhóm
  của người gọi nhận TERM.
- **Lỗ B — TERM trúng người gọi.** Script không phải trưởng nhóm (gọi qua `bash -c`, qua script khác, trong shell không
  bật job control) thì `-PGID` là nhóm của người gọi. Đo: người gọi chết SIGTERM, dòng in sau lệnh không ra.
- **Lỗ C — test (2) phụ thuộc máy.** CI không có `~/.local/node-v24.21.0`, đồng hồ tắt, ca test (2) treo tới chốt 90 giây
  rồi đỏ.

Lỗ A và B nằm ở logic đồng hồ (phía trên mốc làn). Sửa lỗ A ở dòng `trap - EXIT` (phía dưới mốc) làm nhánh sửa cả hai
phía mốc, đúng điều lưới JST-AC-8 hai phía cấm (U1-1711-5). Nên cả hai trả ZCode qua GS/LL (U1-1711-6, U1-1711-7):
đồng hồ tự thoát khi tiến trình script chết; chỉ TERM nhóm khi script là trưởng nhóm, không thì TERM script và con cháu.
Lỗ C nằm ở tệp test trong vùng của hàng: U1 sửa (truyền `ZALO_IMPORT_NODE_BIN` = node đang chạy test).

## Cách nghiệm thu

- Mọi ca chạy BẢN SAO script trong thư mục tạm, bước pipeline là fixture, DB trỏ cổng đóng — không chạy job thật, không
  đụng DB máy thu.
- Mọi lượt chạy thử khởi bằng tiến trình detached có nhóm riêng; sau ca, test dọn đúng nhóm ấy. Một tiến trình canh do
  test tạo NGOÀI nhóm phải còn sống sau ca trần bắn.
- Bắt kịp: hai snapshot, cắt ở giữa (trần nạp và trần tổng), lượt sau với trần mặc định nạp nốt, state tới snapshot cuối.
- Hồ sơ áp máy thu: gộp là có hiệu lực ở lượt 00:00 kế (launchd chạy script từ checkout chính), lùi = `git revert`, lệnh
  kiểm sau đọc thời lượng lượt 00:00 từ dòng JOB STEP trong `pipeline/logs/zalo-import.log`.

## Ngoài phạm vi

- Điểm dừng an toàn của bước đọc gộp khi bị cắt giữa chừng (hàng PL34 sở hữu; hàng này không đo lại).
- Trần riêng từng bước (`ZALO_IMPORT_TRAN_BUOC` test (2) truyền vào không có tác dụng — script không đọc biến này).
- Báo trần bắn ra kênh cảnh báo; đổi plist; bộ zc3 `import-daily` đỏ sẵn 13 mục trên main 120099fc5.
