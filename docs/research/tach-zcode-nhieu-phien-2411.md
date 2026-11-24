# Tách làn thu ZCode thành ba phiên + đề xuất thu gần thời gian thực (24/11)

Trạng thái: **ba phiên đã chạy từ 24/11** (Mạnh chốt «Mở luôn cả 3»). **Thước đích** «đăng → hiện trên Invest» ở mục 5 đã
được Mạnh chốt «Theo đề xuất» (24/11). Cách làm ở mục 5 vẫn là đề xuất; GS cắt hàng. Nguồn gọi bằng mã S0x; không có tầng A.

## 1. Kết luận

1. Làn thu có ba phiên ZCode, chia theo nhóm việc. Mỗi phiên có một tên nhận riêng trên **cùng một kênh** tin:
   - `zcode`: ZV vận hành;
   - `zt`: ZT tin rao;
   - `zk`: ZK nguồn kho.

   LL vẫn là đầu mối duy nhất với cả ba phiên.
2. Kênh không cần mỗi phiên một issue: lệnh `tin` của kit đã gửi được cho nhiều tên. Mỗi thư mục trạng thái giữ một tên
   (`tin vai --may`), và `doc` chỉ đưa tin có đích đúng tên đó. Đã thử trên issue thử (24/11): mỗi tên nhận riêng, đúng một
   lần; `NHẬN` về đúng sổ.
3. Tách phiên giúp ba mảng phát triển song song. Muốn tin đến người dùng tức thời thì phải đổi cách thu và xử lý (mục 5),
   không phải thêm phiên.

## 2. Ba phiên

| Phiên | Tên nhận | Project ZCode | Phạm vi | Tệp được sửa | Chạm runtime |
|---|---|---|---|---|---|
| **ZV** vận hành | `zcode` | `~/dev/onehub-invest-zcode` | gateway + hook S03, watchdog, heartbeat, chuỗi nạp đêm, plist, collector API, lõi lịch thu | `collector/src/core/`, `collector/openclaw/`, `collector/src/api/`, `scripts/zalo-*.sh`, `scripts/*-daily.sh`, `pipeline/cron/` | **duy nhất**, theo lời GIAO triển khai |
| **ZT** tin rao | `zt` | `~/dev/onehub-zt` | S01, S02, S05, S06; trình duyệt chuyên dụng của bộ thu | `pipeline/collect-*`, `pipeline/import-*` và `collector/src/collectors/` của các nguồn trên, cùng test | không |
| **ZK** nguồn kho | `zk` | `~/dev/onehub-zk` | S07, S08, S09, S10, S16, S17 (S11 khi mở lại) | `pipeline/import-s07*`, `import-s08*`, `import-s09*`, `import-s1*`, bộ thu của các nguồn trên, cùng test | không |

Tài nguyên dùng chung:

- **DB :5433**: chỉ ghi `stg_*`; tự kiểm trên bản chép.
- **Trình duyệt bộ thu**: chỉ ZT dùng.
- **Lượt đẩy git**: mỗi lúc một lượt (hook git-secrets ~6′); LL xếp.
- **Hạn mức GLM**: một túi chung, tính credit theo cửa sổ 5 giờ và theo tuần.

## 3. Luật kênh, đẩy, tải

- **Kênh**: `~/dev/onehub-coord/bin/tin <zcode|zt|zk> …` trên issue riêng tư `onehub-coord#1`. Mỗi bên có thư mục trạng thái
  `~/dev/onehub-coord/<bên>`. Hook `zcode-hook` chọn bên theo thư mục của phiên. Phiên ở thư mục khác không đụng kênh, vì `doc`
  đánh dấu tin là đã đọc.
- **Đánh thức**: mỗi phiên có một lịch đọc kênh riêng (công cụ `CronCreate` của ZCode, gắn vào chính task): ZV và ZT mỗi 20′,
  ZK mỗi 30′. Lịch chỉ chạy khi app mở và máy thức, nên cần thêm vào checklist khởi động máy.
- **Cấm** (ZT, ZK):
  - không chạm gateway, `~/.openclaw`, launchd, collector API, `scripts/zalo-*.sh`;
  - không đẩy nhánh khi `pgrep -f 'git-secrets|git push'` chưa rỗng;
  - không chạy bộ nặng khi tải 1 phút ≥ 12, hoặc trong khung 05:30–06:30 và 14:00–14:45 VN.
- **Nhận diện**: nhánh `zcode/zv-…`, `zcode/zt-…`, `zcode/zk-…`. Mã vòng do kit cấp theo bên gửi; sổ của LL đọc theo tên nhận.
  Bộ chặn tên nguồn (`tin-soat`) soát mọi bên như cũ.

## 4. Số đo khi tách (máy thu, sáng 24/11 VN)

| Chặng | S03 (nhóm) | S06 (kênh rao) |
|---|---|---|
| Đăng → vào máy | p50 0,5′, p90 0,9′ (68.197 bài trong 7 ngày; nhận theo sự kiện) | p50 **66 giờ**, p90 150 giờ (24.074 tin đăng trong 7 ngày, tính tới lần thu đầu) |
| Cách thu | sự kiện liên tục | quét ~1.900 trang × 2 lượt/ngày, mỗi lượt ~33′ |
| → căn, giá | đọc gộp bằng model ở lượt 00:00, tuần tự 7,2 s/bài, chạm trần 4 giờ → **1–3 ngày**, có bài rơi khỏi cửa sổ | transform sau lượt nạp (40–55′) |
| → cloud | `cloud-sync` chép lại toàn bộ ~1 triệu dòng, nhịp thật **35–40′** | như bên trái |
| → người dùng | chưa có «lưu tìm kiếm» hay thông báo | như bên trái |

Khối lượng:

- S03: ~9.700 bài/ngày, đỉnh ~800 bài/giờ.
- S06: ~3.400 tin mới/ngày, ~760 nghìn bản ghi/tuần.
- Nguồn kho, S01 và S02 không cần tức thời.

ZCode trên máy (bản 4.0.0, model GLM-5.3/5.4 theo gói coding plan):

- có hook kiểu Claude Code, gồm `additionalContext` và chặn Stop;
- có lịch tự chạy, tối đa 20 định nghĩa; lịch cũ chạy 2.108 lượt, lỗi 11%;
- chạy được không giao diện (`zcode -p`);
- thêm được nhà cung cấp model khác.

## 5. Thu gần thời gian thực (thước đích đã chốt 24/11; cách làm là đề xuất)

```
Nguồn ──(1) thu đuôi theo mốc──▶ raw snapshot ──(2) nạp + transform phần mới, lô 2–5′──▶ tin/căn/giá
      ──(3) đẩy cloud tăng dần 1–2′──▶ Invest ──(4) khớp «lưu tìm kiếm» → báo người dùng
```

1. **Thu đuôi** (làn thu, ZT và ZV). Mỗi nguồn tin rao chạy hai chế độ:
   - *đuôi* mỗi 3–5′: lấy trang 1–3 của mỗi vùng × mục, dừng khi gặp mã tin đã có;
   - *quét đủ* 1 lần/ngày, để bắt tin sửa giá hoặc gỡ.

   Với S06, chế độ đuôi gọi ~8 lời/phút, ít hơn lượt quét đủ hiện nay (~57 lời/phút). Lịch chạy bằng tiến trình nền đang có
   cộng một bảng hàng việc trong Postgres; không thêm hạ tầng mới (luật 11).
2. **Nạp + chuẩn hoá lô nhỏ, 24/7** (làn Claude). Đọc gộp S03 chạy liên tục với 2–4 lời song song: đỉnh 800 bài/giờ × 7,2 s
   cần khoảng 2 luồng. Chi phí giữ quanh mức hiện nay, trong trần ngày đã duyệt.
3. **Đẩy cloud tăng dần** theo `updated_at` (làn Claude).
4. **Lưu tìm kiếm + báo tin** trên Invest (làn Claude, **chưa có hàng**, cần Cổng Phạm vi). Không dùng tài khoản thu, không
   gửi vào nhóm xã hội.

**Thước đích** (Mạnh chốt «Theo đề xuất», 24/11), đo từ lúc đăng tới lúc hiện trên Invest, theo ngày:

| Nguồn | p50 | p90 |
|---|---|---|
| S03 | ≤ 15′ | ≤ 60′ |
| S06 | ≤ 30′ | ≤ 2 giờ |

Làm trước, vì đây là chỗ nghẽn thật: tách DB thử khỏi cụm Postgres thật, và chỉnh cấu hình Postgres.

## 6. Thí điểm và ngưỡng

Đo 3 ngày kể từ 25/11:

- số vòng đóng mỗi ngày theo từng bên;
- thời gian chờ review;
- số lần hai phiên sửa cùng một tệp;
- số lần hết hạn mức GLM.

Giữ ba phiên nếu số vòng đóng/ngày của làn thu tăng ≥ 30% so với tuần trước, thời gian chờ review không tăng và không có
xung đột tệp.

## 7. Rủi ro và cách lùi

- **Hạn mức chung**: phiên nhàn đặt lịch thưa hơn; việc nặng dồn ra ngoài 13–17h VN (giờ cao điểm của gói).
- **Xung đột tệp**: theo bảng tệp ở mục 2; LL chặn ở bước soát.
- **An toàn Zalo**: chỉ ZV chạm runtime.
- **Lùi về một phiên**:
  1. tắt lịch của ZT và ZK;
  2. ZT, ZK trả các vòng đang mở bằng `TRẢ … --chuyen claudedp`, LL giao lại cho `zcode`;
  3. giữ thư mục trạng thái để tra lại;
  4. `bin/tin` và `zcode-hook` vẫn nhận `zcode` như cũ.

  Không mất tin, vì tin nằm trên issue.
