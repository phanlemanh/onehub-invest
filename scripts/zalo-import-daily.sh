#!/bin/bash
# zalo-import-daily.sh — nạp snapshot zalo-agent mới (Zalo + FB nếu bật)
# vào stg + refresh bait-gap. Tách khỏi apify-facebook-daily.sh 2026-10-21
# (user pause Facebook — nhưng Zalo pipe vẫn cần nạp hằng đêm 00:00).
#
# Bài học 22/10 (DB chết 22:49, nạp 00:00 fail): `|| true` + state vẫn nhảy
# qua snapshot fail → snapshot đó KHÔNG BAO GIỜ được nạp lại. Giờ: mỗi
# snapshot fail sau khi retry được giữ nguyên con trỏ state, chuỗi DỪNG tại
# đó (các snapshot sau chờ lần chạy kế tiếp khi DB đã lên), và script thoát
# ≠0 để log/monitor thấy nạp đêm có lỗi — transform không chạy trên dữ liệu
# thiếu.
set -uo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
export PATH="$HOME/.local/node-v24.21.0/bin:$PATH"
export DATABASE_URL="${DATABASE_URL:-postgres://oneinvest:oneinvest@localhost:5433/oneinvest}"

STATE="$ROOT/pipeline/logs/apify-daily.state"  # dùng chung state — không nạp lại

# 1011-3 nấc 1 «S03 lên nhanh» (Mạnh chốt 10/11, giám sát cho bật 10/11 sau N1 đo
# transform+media+refresh ≈ 76s/lượt): lượt nhanh 15′ ban ngày 7–22h gọi với
# --luot-nhanh. Cờ CHỈ đổi hai chỗ: (1) lấy khoá — bận thì BỎ LƯỢT, thoát 0, không
# xếp hàng chờ như lượt 00:00; (2) export S03_LUOT_NHANH=1 để phần làn Claude biết
# đây là lượt nhanh. Chuỗi vẫn chạy tiếp nạp → transform → media → refresh để tin
# S03 lên sale_offers trong ngày; đọc gộp và enrich (bước LLM dài) giữ ở lượt 00:00.
LUOT_NHANH=0
case "${1:-}" in
  "") ;;
  --luot-nhanh) LUOT_NHANH=1 ;;
  *) echo "❌ cờ không biết '${1}' — chỉ nhận --luot-nhanh (không cờ = lượt 00:00 đầy đủ)" >&2; exit 2 ;;
esac
export S03_LUOT_NHANH="$LUOT_NHANH"

# Nạp 1 snapshot; ECONNREFUSED (DB container đang lên lại) thì retry
# tối đa 5 lần cách 20s. Trả 0 khi đã vào stg.
import_one() {
  local snap="$1" log try
  log=$(mktemp)
  for try in 1 2 3 4 5; do
    if node "$ROOT/pipeline/import-airbnb.mjs" "$snap" >"$log" 2>&1; then
      cat "$log"; rm -f "$log"; return 0
    fi
    if ! grep -q "ECONNREFUSED" "$log"; then
      cat "$log"; rm -f "$log"; return 1 # lỗi khác DB — retry vô ích
    fi
    echo "ECONNREFUSED (lần $try/5) — DB chưa lên? chờ 20s rồi nạp lại $snap"
    sleep 20
  done
  cat "$log"; rm -f "$log"; return 1
}

# Sort theo MỐC THỜI GIAN basename + khoá state chung với apify-facebook-daily
# (mở lại 2310-8 R1/a — hai job cùng 00:00 đụng apify-daily.state)
LOCK_DIR="$STATE.lock"
# 2510-9: khoá nằm trong pipeline/logs sống qua kill -9/mất điện — ghi PID +
# giờ lấy khoá; PID chết hoặc khoá >2h thì gỡ lấy lại, đỡ kẹt tới khi gỡ tay.
# 2510-31(2)(3): luc kiểm số trước khi tính tuổi (hỏng → coi khoá cũ); chỉ
# thành công khi THẬT xoá được — rơi vào trần 60 lượt + sleep thay vì quay bận.
go_khoa_cu() {
  local pid="" luc="" chu=""
  [ -f "$LOCK_DIR/pid" ] && read -r pid < "$LOCK_DIR/pid"
  [ -f "$LOCK_DIR/luc" ] && read -r luc < "$LOCK_DIR/luc"
  # 1911-2: CHỮ KÝ CHỦ KHOÁ = mốc bắt đầu tiến trình (ps lstart) ghi lúc LẤY khoá.
  # Bản 2aad0b08d gỡ MỌI khoá già hơn 2h không xét PID → lượt nhanh gỡ khoá lượt
  # 00:00 THẬT đang chạy (được tới trần tổng 4h, khoá tuổi 3h) → chồng lượt + trap
  # EXIT lượt 00:00 xoá nốt khoá lượt nhanh. Phân biệt hai trường hợp bằng chữ ký:
  # pid sống + CÙNG mốc bắt đầu = chủ thật (giữ suốt trần tổng); pid sống + KHÁC
  # mốc = PID bị tiến trình khác DÙNG LẠI → khoá mồ côi, gỡ được (kể cả khoá trẻ).
  if [ -f "$LOCK_DIR/chu" ]; then read -r chu < "$LOCK_DIR/chu"; chu=$(printf '%s' "$chu" | tr -s ' '); chu=${chu# }; chu=${chu% }; fi
  local goc_do_tuoi=0
  local max_tuoi="${ZALO_IMPORT_TRAN_TONG:-21600}" # trần tổng lượt 00:00 = 6h (2311-5) — khoá cùng lượt sống tới đây
  local tuoi=0
  if [ -n "$luc" ] && [[ "$luc" =~ ^[0-9]+$ ]]; then tuoi=$(( $(date +%s) - luc )); fi
  local chu_song="" pid_song=0
  if [ -n "$pid" ] && kill -0 "$pid" 2>/dev/null; then
    pid_song=1
    chu_song=$(ps -o lstart= -p "$pid" 2>/dev/null | tr -s ' '); chu_song=${chu_song# }; chu_song=${chu_song% }
  fi
  if [ -z "$pid" ]; then
    echo "gỡ khoá không có PID (dở dang?)"; goc_do_tuoi=1
  elif [ "$pid_song" = "0" ]; then
    echo "gỡ khoá cũ của PID $pid (tiến trình đã chết)"; goc_do_tuoi=1
  elif [ -n "$chu" ] && [ -n "$chu_song" ] && [ "$chu_song" != "$chu" ]; then
    echo "gỡ khoá mồ côi — PID $pid bị tiến trình khác DÙNG LẠI (mốc bắt đầu khác chữ ký, tuổi ${tuoi}s)"; goc_do_tuoi=1
  elif [ "$tuoi" -gt "$max_tuoi" ]; then
    if [ -n "$chu" ] && [ "$chu_song" = "$chu" ]; then
      echo "gỡ khoá của lượt chạy thật đã VƯỢT trần tổng ${max_tuoi}s (PID $pid, tuổi ${tuoi}s — đồng hồ trần chết, kiểu đứt 34h)"; goc_do_tuoi=1
    else
      echo "gỡ khoá mồ côi quá trần tổng ${max_tuoi}s (PID ${pid:-?}, tuổi ${tuoi}s, không chữ ký)"; goc_do_tuoi=1
    fi
  elif [ -n "$luc" ] && ! [[ "$luc" =~ ^[0-9]+$ ]]; then
    echo "gỡ khoá cũ — file luc không phải số (PID ${pid:-?}, giá trị lạ)"; goc_do_tuoi=1
  else
    # 1711-4: PID sống (chủ thật có chữ ký, hoặc khoá bản cũ chưa có chữ ký còn
    # trong trần tổng) — KHÔNG gỡ: lượt 00:00 chờ tối đa 5′ rồi thoát 1, lượt
    # nhanh bỏ lượt thoát 0 — không chồng lượt.
    echo "khoá còn sống (PID $pid, lấy lúc ${luc:-?}, tuổi ${tuoi}s) — không gỡ"
    return 1
  fi
  if [ "$goc_do_tuoi" = "1" ]; then
    rm -rf "$LOCK_DIR" 2>/dev/null
    [ ! -e "$LOCK_DIR" ] && return 0
    echo "⚠️ không gỡ được khoá $LOCK_DIR (quyền? NFS?) — giữ chờ" >&2
    return 1
  fi
  return 1
}
if [ "$LUOT_NHANH" = "1" ]; then
  # lượt nhanh: thử lấy khoá 1 lần (dọn được khoá chết thì thử lại lần nữa);
  # vẫn bận = lượt khác đang nạp — bỏ lượt, thoát 0 (không fail, không chờ)
  if ! mkdir "$LOCK_DIR" 2>/dev/null; then
    go_khoa_cu && mkdir "$LOCK_DIR" 2>/dev/null || { echo "⏭ bỏ lượt (khoá $LOCK_DIR bận — lượt khác đang nạp)"; exit 0; }
  fi
else
  i=0; until mkdir "$LOCK_DIR" 2>/dev/null; do
    go_khoa_cu || { i=$((i+1)); [ "$i" -ge "${ZALO_IMPORT_CHO_KHOA:-60}" ] && { echo "❌ khoá $LOCK_DIR bận >5′ — job khác đang nạp?"; exit 1; }; sleep 5; }
  done
fi
echo $$ > "$LOCK_DIR/pid"; date +%s > "$LOCK_DIR/luc"
# 1911-2: chữ ký chủ khoá — mốc bắt đầu tiến trình này (ps lstart); ps hỏng → tệp
# rỗng → go_khoa_cu rơi nhánh không-chữ-ký (vẫn an toàn theo tuổi)
{ ps -o lstart= -p $$ 2>/dev/null | tr -s ' ' > "$LOCK_DIR/chu"; } || true
# 1911-2: trap chỉ xoá khoá CỦA CHÍNH MÌNH — lượt 00:00 bị gỡ khoá (lỗi cũ) rồi
# thoát không được xoá nốt khoá lượt nhanh đã chiếm chỗ
trap '[ -f "$LOCK_DIR/pid" ] && grep -qx "$$" "$LOCK_DIR/pid" 2>/dev/null && rm -rf "$LOCK_DIR" 2>/dev/null || true' EXIT

# 1711-4: TRẦN TỔNG lượt (đồng hồ chết) — lượt 00:00 hôm 17/11 chạy ≈5h38m
# (00:00→05:38 +07, exit 1 vì JOB FAIL doc-gop giữa chừng) mà không có trần
# nào; cloud-sync nhịp 15′ đụng lượt đang chạy, bước mẫu soát lỗi 110 lần.
# Trần bao TOÀN chuỗi (nạp + transform + doc-gop + enrich) — doc-gop có
# checkpoint «đã đọc» nên cắt giữa chừng chỉ hoãn phần còn lại cho lượt sau,
# không mất dữ liệu. Trần qua env (không đổi plist): lượt 00:00 4h, lượt
# nhanh 20′. Ngưỡng WARN = nửa trần, cảnh báo MỘT lần.
# Đồng hồ là MỘT tiến trình node (không subshell+sleep — sleep con thành mồ
# côi giữ pipe stdout mở, caller chờ tệp log không bao giờ đóng).
# 1711-4 lần 4 (a): trần tổng phải LỚN hơn trần phần nạp — lượt nhanh cũ 1200s
# < trần nạp 1800s: đồng hồ tổng TERM cả chuỗi TRƯỚC khi trần nạp kịp dừng sạch
# (mã 124 giữ state), mất dòng ghi state → lượt sau nạp lại cùng đoạn. Lượt
# nhanh = trần nạp + 600s cho transform/doc-gop; lượt 00:00 giữ 4h.
# 2311-5 (claudedp-2311-5, bổ sung 2311-6): LƯỚI CHIA TRẦN. Trần tổng một đồng hồ bọc cả lượt làm bước đọc gộp
# (LLM tuần tự ~7,2s/lời) ăn hết trần rồi TERM cả lượt — enrich đứng sau nó chết theo 3 đêm (21→23/11). Hai việc,
# mỗi việc một phía của mốc ranh giới làn ở dưới tệp (luật U1-1711-5: một nhánh sửa một phía):
#  - phía trên mốc (nhánh này): trần tổng lượt 00:00 4h → 6h (21600s), tuổi khoá theo cùng trần; lượt nhanh không
#    đổi. Xuất DOC_GOP_TRAN_GIAY = trần đọc gộp − 300 cho bước đọc gộp: hợp đồng phía bước (P3/HT6) — tới mốc ấy
#    bước không phát lời model mới, chờ lời đang bay rồi THOÁT 75 = dừng sạch, không mất bài (checkpoint đã-đọc).
#    Trần đọc gộp SUY TỪ TRẦN TỔNG THỰC (BÁO claudedp-2411-11 và -12): biến môi trường ZALO_IMPORT_TRAN_TONG
#    thắng mặc định — đêm 24→25/11 plist đặt 32400 một đêm theo lời Mạnh. Lấy trần đọc gộp = trần tổng − phần các
#    bước TRƯỚC nó (trần nạp + 600s cho transform, cùng số với trần lượt nhanh) − 3000s cho enrich SAU nó (đo 21/11:
#    1.842s, cộng dự phòng). Mốc dừng sạch vì thế luôn chừa đủ chỗ cho enrich với MỌI trần tổng: trần tổng lớn hơn
#    cho đọc gộp chạy lâu hơn để gỡ tồ, trần tổng nhỏ hơn thì đọc gộp tự co. Đặt tường minh
#    ZALO_IMPORT_TRAN_DOC_GOP thì dùng số đó nhưng vẫn kẹp về giới hạn trên, kèm một dòng JOB WARN — đồng hồ tổng
#    không bao giờ cắt cả lượt trước mốc dừng sạch. Khi đọc gộp chạy song song (HT6/P3) hạ qua env đó.
#  - phía dưới mốc (nhánh zcode/s03-nhap-chia-tran-buoc, đứng trên nhánh này): đồng hồ riêng của bước đọc gộp
#    (lưới TERM cuối) và 75 của bước = đi tiếp, không vào JOB_RC.
TRAN_NAP="${ZALO_IMPORT_TRAN_NAP:-1800}"
TRAN_TONG="${ZALO_IMPORT_TRAN_TONG:-$([ "$LUOT_NHANH" = "1" ] && echo $((TRAN_NAP + 600)) || echo 21600)}"
CANH_BAO="${ZALO_IMPORT_CANH_BAO:-$((TRAN_TONG / 2))}"
CHUA_TRUOC=$((TRAN_NAP + 600))   # thời gian các bước trước bước đọc gộp được dùng tối đa
CHUA_ENRICH=3000                  # thời gian dành cho enrich sau bước đọc gộp (đo 21/11: 1.842s + dự phòng)
TRAN_DOC_GOP_MAX=$((TRAN_TONG - CHUA_TRUOC - CHUA_ENRICH)); [ "$TRAN_DOC_GOP_MAX" -lt 60 ] && TRAN_DOC_GOP_MAX=60
if [ -n "${ZALO_IMPORT_TRAN_DOC_GOP:-}" ]; then
  TRAN_DOC_GOP="$ZALO_IMPORT_TRAN_DOC_GOP"
  if [ "$TRAN_DOC_GOP" -gt "$TRAN_DOC_GOP_MAX" ]; then
    echo "JOB WARN [zalo-import-daily] trần đọc gộp ${TRAN_DOC_GOP}s không vừa trần tổng ${TRAN_TONG}s — kẹp về ${TRAN_DOC_GOP_MAX}s (chừa ${CHUA_TRUOC}s cho nạp và transform, ${CHUA_ENRICH}s cho enrich)"
    TRAN_DOC_GOP="$TRAN_DOC_GOP_MAX"
  fi
else
  TRAN_DOC_GOP="$TRAN_DOC_GOP_MAX"
fi
DOC_GOP_TRAN_GIAY=$((TRAN_DOC_GOP - 300)); [ "$DOC_GOP_TRAN_GIAY" -lt 60 ] && DOC_GOP_TRAN_GIAY=60
export DOC_GOP_TRAN_GIAY
# canh_gio <trần-giây> <warn-giây> <nhãn> <đích-kill> — nhãn in kèm dòng ghim;
# đích: pid bước, hoặc -PGID để TERM cả nhóm tiến trình của lượt.
# node dùng ĐƯỜNG TUYỆT ĐỐI (PATH đầu có shim `node` của phép đo job-step —
# gọi qua PATH sẽ vào shim, ghi dày dòng calls làm lệch dãy lời gọi đo được).
# Không tìm thấy node thật → trần thời gian TẮT, log một dòng cảnh báo.
canh_gio() {
  DONG_HO_PID="" # set -u: ca không node thật vẫn có biến để trap/gọi sau đọc
  local node_that="${ZALO_IMPORT_NODE_BIN:-$HOME/.local/node-v24.21.0/bin/node}"
  if [ ! -x "$node_that" ]; then
    echo "⚠️ [zalo-import-daily] không có node thật ($node_that) — TRẦN THỜI GIAN TẮT cho lượt này" >&2
    return 0
  fi
  # 1711-4 MỞ LẠI lần 3: (1) node đồng hồ TỰ THOÁT khi script chết (ppid → 1 —
  # «trap - EXIT» trước đọc gộp gỡ trap giết đồng hồ, đồng hồ cũ sống tới trần rồi
  # TERM cả nhóm người gọi); (2) chỉ TERM CẢ NHÓM khi script là TRƯỞNG nhóm
  # (PGID == PID script — dưới launchd); khi chạy tay/bash -c (PGID của người gọi)
  # thì chỉ TERM con trực tiếp + script — không trúng người gọi.
  TRAN_GIAY="$1" CANH_GIAY="$2" NHAN_CANH="$3" PID_SCRIPT="$$" PGID_SCRIPT="$PGID_LUOT" "$node_that" -e '
    const { execSync } = require("node:child_process");
    const s = (v) => Number(v) * 1000;
    const script = Number(process.env.PID_SCRIPT);
    const truongNhom = String(process.env.PGID_SCRIPT) === String(script);
    const conSong = () => { // con trực tiếp còn sống của script (pgrep -P có cả macOS/linux)
      try { return execSync(`pgrep -P ${script}`, { encoding: "utf8" }).split("\n").map((l) => parseInt(l.trim(), 10)).filter(Number.isFinite); } catch { return []; }
    };
    setTimeout(() => console.error(`⚠️ [zalo-import-daily] WARN: ${process.env.NHAN_CANH} đã chạy ${process.env.CANH_GIAY}s (trần ${process.env.TRAN_GIAY}s) — vẫn chưa xong`), s(process.env.CANH_GIAY));
    let daTran = false; // 1711-4 lần 4 (b): sau khi trần bắn, đồng hồ KHÔNG thoát theo cha — phải sống tới hạn SIGKILL
    setTimeout(() => {
      daTran = true;
      console.error(`❌ [zalo-import-daily] TIMEOUT: ${process.env.NHAN_CANH} vượt trần ${process.env.TRAN_GIAY}s — gửi TERM để dừng sạch`);
      // 1711-4 MỞ LẠI lần 3 lỗ (2): chỉ TERM CẢ NHÓM khi script là TRƯỞNG nhóm
      // (PGID == PID script — dưới launchd); chạy tay/bash -c thì TERM con trực
      // tiếp + script theo VÒNG mỗi giây (bash defer TERM khi đang chờ con —
      // TERM một lần không đủ, script nhảy sang lệnh kế) — không trúng người gọi.
      const giu = setInterval(() => {
        if (truongNhom) { try { process.kill(-script, "SIGTERM"); } catch {} }
        else {
          // p !== process.pid: đồng hồ chính nó cũng là con của script — tự TERM
          // là chết trước khi TERM tới các con khác (treo vĩnh viễn)
          for (const p of conSong()) { if (p === process.pid) continue; try { process.kill(p, "SIGTERM"); } catch {} }
          try { process.kill(script, "SIGTERM"); } catch {}
        }
      }, 1000); // KHÔNG unref — interval TERM phải giữ event loop sống, không thì node thoát ngay sau TIMEOUT và không TERM ai
      setTimeout(() => { // grace 20s rồi KILL cứng script (+ nhóm khi là trưởng nhóm)
        clearInterval(giu);
        // 1711-4 lần 4 (b): KILL phải TỰ LOẠI đồng hồ (p === process.pid) — pgrep -P
        // liệt kê cả đồng hồ, KILL trúng chính mình giữa vòng là mất SIGKILL cho
        // bước phớt TERM còn lại; đồng hồ tự thoát sau cùng.
        if (truongNhom) { try { process.kill(-script, "SIGKILL"); } catch {} }
        else { for (const p of conSong()) { if (p === process.pid) continue; try { process.kill(p, "SIGKILL"); } catch {} } }
        try { process.kill(script, "SIGKILL"); } catch {}
        process.exit(0);
      }, 20000).unref();
    }, s(process.env.TRAN_GIAY));
    setInterval(() => { // (1) script chết → đồng hồ tự thoát, không mồ côi. process.ppid là TĨNH
      // (không đổi khi cha chết) — kiểm sống bằng kill(pid, 0): ESRCH = cha đã chết.
      // 1711-4 lần 4 (b): SAU khi trần đã bắn thì KHÔNG thoát theo cha — script chết
      // vì TERM của trần trong khi bước phớt TERM còn sống; đồng hồ phải ở lại bắn
      // SIGKILL ân hạn 20s, thoát ngay sẽ mất SIGKILL (bước sống mồ côi, khoá nhả sớm).
      let conSong = true;
      try { process.kill(script, 0); } catch { conSong = false; }
      if (!conSong && !daTran) process.exit(0);
    }, 2000).unref();
    // 1711-4 lần 4 (b): đồng hồ BỎ QUA SIGTERM (kể cả TERM cả nhóm của chính nó) —
    // chết vì TERM tự bắn là mất SIGKILL ân hạn. Đồng hồ chỉ thoát qua ba cửa của
    // nó: cha chết TRƯỚC trần, KILL cứng sau trần (SIGKILL không bỏ qua được), hoặc
    // kill đồng hồ của trap EXIT rồi chờ kiểm-cha ≤2s tự thoát.
    process.on("SIGTERM", () => {});
  ' &
  DONG_HO_PID=$!
}
PGID_LUOT="$(ps -o pgid= -p $$ | tr -d ' ')"
if [ "$LUOT_NHANH" = "1" ]; then
  echo "[zalo-import-daily] trần: nạp ≤${TRAN_NAP}s · lượt ≤${TRAN_TONG}s"
else
  echo "[zalo-import-daily] trần: nạp ≤${TRAN_NAP}s · đọc gộp ≤${TRAN_DOC_GOP}s (dừng sạch ở ${DOC_GOP_TRAN_GIAY}s) · lượt ≤${TRAN_TONG}s"
fi
canh_gio "$TRAN_TONG" "$CANH_BAO" "lượt" "-$PGID_LUOT"
DONG_HO_TONG_PID="${DONG_HO_PID:-}" # PID riêng cho trap (khi node thật thiếu thì rỗng)
trap '[ -n "$DONG_HO_TONG_PID" ] && kill "$DONG_HO_TONG_PID" 2>/dev/null; if [ -f "$LOCK_DIR/pid" ] && grep -qx "$$" "$LOCK_DIR/pid" 2>/dev/null; then rm -rf "$LOCK_DIR" 2>/dev/null; fi' EXIT
LAST=$(cat "$STATE" 2>/dev/null || echo "00000000T000000")
MAXTS="$LAST"
FAILED=0
# Chỉ nhận TS đúng dạng mốc thời gian (BÁO 2410-2, mở lại 2310-8 vòng 3):
# thư mục '…__zalo-agent__TEST' cho TS=TEST > mọi mốc 2026… → state nhảy,
# mọi snapshot thật sau đó bị bỏ. Không khớp → bỏ thư mục + log.
# Khuôn: giây (6 số, bản cũ) HOẶC mili-giây (9 số, storage.ts b0898fe trở đi)
# HOẶC kèm hậu tố '-n' khi trùng mili-giây. Sort chuỗi vẫn đúng thứ tự vì
# các khuôn chia sẻ tiền tố tới giây (state 6 số cũ giữ nguyên).
# GIỐNG HỆT apify-facebook-daily.sh — hai bản phải không lệch nhau (BÁO 2510-5).
TS_RE='^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{6}([0-9]{3})?(-[0-9]+)?Z?$'
# 0311-8: ls -1d với glob vượt ARG_MAX (11.082 thư mục ≈ 1MB > 1.048.576) —
# ls thoát 126 'Argument list too long', 2>/dev/null nuốt lỗi → vòng lặp rỗng
# mà job vẫn thoát 0 (S03 ngừng nạp từ 02/11). find tự duyệt, KHÔNG truyền
# đối số qua exec; liệt kê lỗi → thoát khác 0 và KHÔNG ghi state.
DS_DIR=$(find "$ROOT/collector/snapshots" -maxdepth 2 -type d -name '*__zalo-agent__*') || {
  echo "❌ lỗi liệt kê snapshot (find)" >&2; exit 3
}
# 0311-8 MỞ LẠI: find thoát 0 mà danh sách rỗng KHI state đã có mốc thật
# (LAST ≠ 00000000T000000) = mất dấu snapshot — thoát 3, KHÔNG ghi state;
# lần đầu chưa có mốc thì rỗng là bình thường, thoát 0.
if [ -z "$DS_DIR" ] && [ "$LAST" != "00000000T000000" ]; then
  echo "❌ không liệt kê được snapshot nào dù state đã có mốc $LAST — kiểm thư mục snapshot" >&2
  exit 3
fi
for SNAP in $(printf '%s\n' "$DS_DIR" | while read -r d; do
    b=${d##*/}; [ "${b#.}" != "$b" ] && continue # 2510-8: dir '.<id>.partial' đang ghi — bỏ
    ts=$(basename "$d" | sed 's/.*__//')
    if ! echo "$ts" | grep -qE "$TS_RE"; then
      echo "bỏ qua thư mục TS không phải mốc thời gian: $d" >&2; continue
    fi
    echo "$ts $d"
  done | sort | while read -r _ d; do echo "$d"; done); do
  TS=$(basename "$SNAP" | sed 's/.*__//')
  if [[ "$TS" > "$LAST" ]]; then
    # 2510-8: thiếu manifest = snapshot CHƯA xong (bản mới ghi '.partial' rồi
    # rename; bản cũ crash giữa chừng) — KHÔNG được coi là đã nạp.
    if [ ! -f "$SNAP/manifest.json" ]; then
      if [ -n "$(find "$SNAP" -maxdepth 0 -mmin -30 2>/dev/null)" ]; then
        echo "⏸ snapshot chưa xong (thiếu manifest, <30′): $SNAP — giữ state, dừng chuỗi, lượt sau thử lại"
        FAILED=1
        break
      fi
      echo "⚠️ snapshot mồ côi (thiếu manifest, ≥30′) — bỏ qua, đi tiếp: $SNAP"
      [[ "$TS" > "$MAXTS" ]] && MAXTS="$TS" && echo "$MAXTS" > "$STATE"
      continue
    fi
    # 1711-4 lần 4 (d): trần phần nạp xét NGAY TRƯỚC khi nạp thật — sau lọc
    # đã-nạp (TS ≤ LAST) và đã-skip mồ côi: snapshot cũ/chờ-ghi không được tiêu
    # trần báo 124 giả; vượt trần dừng chuỗi giữ state, mã 124 để bộ canh thấy
    # khác với lỗi nạp thường; lượt sau nạp tiếp.
    if [ "$SECONDS" -ge "$TRAN_NAP" ]; then
      echo "❌ [zalo-import-daily] TIMEOUT: phần nạp vượt trần ${TRAN_NAP}s tại snapshot $TS — dừng chuỗi giữ state, lượt sau nạp tiếp"
      FAILED=124
      break
    fi
    if ! import_one "$SNAP"; then
      echo "❌ nạp fail tại $SNAP — giữ state ở $MAXTS, dừng chuỗi (lần chạy sau nạp tiếp)"
      FAILED=1
      break
    fi
    # 1711-4 lần 4 (a): ghi state TĂNG DẦN sau MỖI nạp thành công — đồng hồ trần
    # (hoặc mất điện) cắt giữa chuỗi chỉ mất đúng snapshot đang nạp dở, không
    # bao giờ nạp lại cả chuỗi như bản cũ (state chỉ ghi cuối vòng).
    [[ "$TS" > "$MAXTS" ]] && MAXTS="$TS" && echo "$MAXTS" > "$STATE"
  fi
done
echo "$MAXTS" > "$STATE"

if [ "$FAILED" != "0" ]; then
  # 1711-4: 124 = chạm trần nạp (khác 1 = lỗi nạp thường) — cùng ý: bỏ qua
  # transform/refresh, để nguyên cho lần sau nạp tiếp
  exit "$FAILED" # có lỗi — bỏ qua transform/refresh, để nguyên cho lần sau
fi

# claudedp-1011-12 (link-nguoi-ban-s03 Ngoài-1/5/6, Mạnh ký Cổng 2 10/11): nạp snapshot HỒ SƠ người bán S03
# (nguồn s03-ho-so, collector API /s03-ho-so ghi) vào stg_s03_ho_so — trước đây không tác vụ nào nạp nên bảng luôn
# rỗng và bước ghi link hồ sơ trong refresh-bait-gap không có gì để ghi.
# - Con trỏ RIÊNG (s03-ho-so.state): snapshot hồ sơ sinh theo nhịp bộ tra, không theo nhịp tin; dùng chung con
#   trỏ tin thì một snapshot hồ sơ mốc cũ hơn con trỏ sẽ bị bỏ vĩnh viễn.
# - Ngoài-6: importer gặp DB thiếu 080 in CHUA-AP-080 rồi thoát 0 mà KHÔNG nạp — ở đây coi đó là chưa nạp: GIỮ con
#   trỏ, dừng vòng hồ sơ, báo JOB FAIL; lượt sau (khi đã áp 080) nạp lại đủ. Nạp hỏng cũng giữ con trỏ.
# - Hồ sơ hỏng không chặn chuỗi tin: transform/media/refresh vẫn chạy, mã thoát cuối mang lỗi hồ sơ.
HS_STATE="$ROOT/pipeline/logs/s03-ho-so.state"
HS_LAST=$(cat "$HS_STATE" 2>/dev/null || echo "00000000T000000")
HS_MAX="$HS_LAST"
HS_RC=0
HS_DIRS=$(find "$ROOT/collector/snapshots" -maxdepth 2 -type d -name '*__s03-ho-so__*') || { echo "❌ lỗi liệt kê snapshot hồ sơ (find)" >&2; HS_RC=3; HS_DIRS=""; }
for SNAP in $(printf '%s\n' "$HS_DIRS" | while read -r d; do
    [ -n "$d" ] || continue
    b=${d##*/}; [ "${b#.}" != "$b" ] && continue
    ts=${b##*__}
    echo "$ts" | grep -qE "$TS_RE" || { echo "bỏ qua thư mục hồ sơ TS không phải mốc thời gian: $d" >&2; continue; }
    echo "$ts $d"
  done | sort | while read -r _ d; do echo "$d"; done); do
  TS=${SNAP##*__}
  [[ "$TS" > "$HS_LAST" ]] || continue
  if [ ! -f "$SNAP/manifest.json" ]; then
    # như vòng tin (2510-8): thiếu manifest <30′ = đang ghi → giữ con trỏ, lượt sau thử lại; ≥30′ = mồ côi → bỏ, đi tiếp
    if [ -n "$(find "$SNAP" -maxdepth 0 -mmin -30 2>/dev/null)" ]; then
      echo "⏸ snapshot hồ sơ chưa xong (thiếu manifest, <30′): $SNAP — giữ con trỏ hồ sơ"; break
    fi
    echo "⚠️ snapshot hồ sơ mồ côi (thiếu manifest, ≥30′) — bỏ qua, đi tiếp: $SNAP"
    HS_MAX="$TS"; echo "$HS_MAX" > "$HS_STATE"; continue
  fi
  # 1711-4 lần 4 (d): trần phần nạp xét NGAY TRƯỚC khi nạp thật (sau lọc hồ sơ
  # đã-nạp và đã-skip mồ côi) — không còn hồ sơ chờ nạp thì không được báo 124
  # giả + JOB FAIL nap-ho-so (đo cũ: không hồ sơ vẫn 124). Trần chỉ chặn nạp thật.
  if [ "$SECONDS" -ge "$TRAN_NAP" ]; then
    echo "❌ [zalo-import-daily] TIMEOUT: phần nạp vượt trần ${TRAN_NAP}s tại hồ sơ $TS — dừng vòng hồ sơ giữ con trỏ, lượt sau nạp tiếp"
    HS_RC=124
    break
  fi
  if ! OUT=$(import_one "$SNAP"); then
    printf '%s\n' "$OUT"
    echo "❌ nạp hồ sơ fail tại $SNAP — giữ con trỏ hồ sơ ở $HS_MAX"; HS_RC=1; break
  fi
  printf '%s\n' "$OUT"
  # so khớp trong shell, KHÔNG qua ống: printf | grep -q dưới pipefail có thể dính SIGPIPE (141) khi đầu ra lớn
  # và dòng CHUA nằm đầu → bỏ lọt đúng ca mất dữ liệu Ngoài-6 (review 10/11)
  if [[ "$OUT" == *CHUA-AP-080* ]]; then
    echo "❌ DB chưa áp 080 — snapshot hồ sơ $SNAP CHƯA nạp, giữ con trỏ hồ sơ ở $HS_MAX"; HS_RC=4; break
  fi
  # 1711-4 lần 4 (a): con trỏ hồ sơ ghi tăng dần mỗi nạp thành công — cắt giữa
  # vòng chỉ mất đúng hồ sơ đang nạp dở (khuôn vòng tin)
  HS_MAX="$TS"; echo "$HS_MAX" > "$HS_STATE"
done
echo "$HS_MAX" > "$HS_STATE"
# Từ đây trở xuống là làn Claude (AU3 Ngoài-3): chạy đủ các bước như cũ nhưng thoát bằng mã của bước
# hỏng ĐẦU TIÊN để launchd thấy lỗi.
. "$ROOT/scripts/lib/job-step.sh"
# job-step-ghi-thoi-luong: một bước gộp cho TẤT CẢ phần trên dòng ranh giới làn (lấy khoá + vòng nạp
# tin + vòng nạp hồ sơ). $SECONDS là đồng hồ của shell, đếm từ lúc tệp bọc khởi động — nên đo được
# phần ấy mà không phải chạm một dòng nào phía trên.
job_step_ghi zalo-import-daily truoc-lan-claude "$HS_RC" "$SECONDS"
if [ "$HS_RC" != "0" ]; then
  echo "JOB FAIL [zalo-import-daily] bước nap-ho-so mã $HS_RC" >&2
  JOB_RC=$HS_RC
fi
# s03-len-nhanh-nac-1 (Mạnh duyệt 10/11): lượt nhanh 15′ (S03_LUOT_NHANH=1) cho ba bước transform chờ khoá DB tối đa
# S03_NHANH_LOCK_TIMEOUT (mặc định 10s) qua PGOPTIONS — bước nạp phía trên và lượt 00:00 không nhận. Bước hỏng vì khoá
# (đầu ra có «lock timeout» / 55P03; ba bước đều một giao dịch nên lùi trọn) → dòng «BỎ LƯỢT», không tính vào mã thoát,
# lượt sau làm; bỏ 8 lượt nhanh liền (sổ pipeline/logs/zalo-import-bo-luot.state, ≈2 giờ) → JOB FAIL, thoát 75. Lỗi khác
# vẫn JOB FAIL như job_run. Lượt nhanh không bỏ bước nào, hay lượt 00:00, đặt lại sổ về 0.
NHANH="${S03_LUOT_NHANH:-0}"
SO_BO="$ROOT/pipeline/logs/zalo-import-bo-luot.state"
BO_LUOT=0
[ "$NHANH" = "1" ] && export PGOPTIONS="${PGOPTIONS:+$PGOPTIONS }-c lock_timeout=${S03_NHANH_LOCK_TIMEOUT:-10s}"
buoc_nhanh() {
  local job="$1" nhan="$2" ra rc t0 giay
  shift 2
  ra=$(mktemp)
  t0=$(date +%s)
  "$@" 2>&1 | tee "$ra"
  rc=${PIPESTATUS[0]}
  giay=$(( $(date +%s) - t0 ))
  if [ "$giay" -lt 0 ]; then giay=0; fi
  job_step_ghi "$job" "$nhan" "$rc" "$giay"
  if [ "$rc" -ne 0 ] && grep -qE 'lock timeout|55P03' "$ra"; then
    echo "BỎ LƯỢT [$job] bước $nhan: đụng khoá — lượt sau làm" >&2
    BO_LUOT=1
  elif [ "$rc" -ne 0 ]; then
    echo "JOB FAIL [$job] bước $nhan mã $rc" >&2
    [ "$JOB_RC" -eq 0 ] && JOB_RC=$rc
  fi
  rm -f "$ra"
  return 0
}
buoc() { if [ "$NHANH" = "1" ]; then buoc_nhanh "$@"; else job_run "$@"; fi; }
# DA45 phuong-tu-du-an-chay-that: phường kế thừa từ dự án cho bài S03 (luật DA9). Ba dòng liền nhau, không chen gì giữa: transform-zalo
# (bước ghi dự án lên bài) → phuong-tu-du-an → transform-media (NH-AC-10 chỉ nhận đúng bước này chen giữa); trước xep-hang-gia (bước đọc
# phường). --noi-tiep: chỉ ghi khi lượt đầu đã áp tay theo hồ sơ; chưa áp hay đã lùi thì bỏ qua.
buoc zalo-import-daily transform-zalo node "$ROOT/pipeline/transform-zalo.mjs"
buoc zalo-import-daily phuong-tu-du-an node "$ROOT/pipeline/scripts/phuong-tu-du-an.mjs" --ghi --noi-tiep
buoc zalo-import-daily transform-media node "$ROOT/pipeline/transform-media.mjs" S03 S05
buoc zalo-import-daily refresh-bait-gap node "$ROOT/pipeline/refresh-bait-gap.mjs"
buoc zalo-import-daily xep-hang-gia node "$ROOT/pipeline/xep-hang-gia.mjs"   # CG9: hạng giá sau định vị
mkdir -p "$(dirname "$SO_BO")"
# Lượt nhanh 15′ dừng ở đây: đọc gộp và enrich chỉ chạy ở lượt 00:00 (hàng s03-nap-nhanh). Khoá nạp nhả qua trap EXIT.
if [ "$NHANH" = "1" ]; then
  if [ "$BO_LUOT" = "1" ]; then
    n=$(cat "$SO_BO" 2>/dev/null); [[ "$n" =~ ^[0-9]+$ ]] || n=0
    n=$((n + 1)); echo "$n" > "$SO_BO"
    if [ "$n" -ge 8 ] && [ "$JOB_RC" -eq 0 ]; then
      echo "JOB FAIL [zalo-import-daily] đụng khoá $n lượt liền" >&2
      exit 75
    fi
  else
    echo 0 > "$SO_BO"
  fi
  echo "lượt nhanh: bỏ đọc gộp + enrich (chạy ở lượt 00:00)"
  exit "$JOB_RC"
fi
echo 0 > "$SO_BO"
# 2311-5 (claudedp-2311-5, bổ sung 2311-6) — phía DƯỚI mốc ranh giới làn: ĐỒNG HỒ RIÊNG của bước đọc gộp và
# 75 của bước = đi tiếp. Trần đọc gộp TRAN_DOC_GOP và hợp đồng dừng sạch DOC_GOP_TRAN_GIAY đặt ở phần trần
# (phía trên mốc). Định nghĩa ở đây, trước khi nhả khoá nạp, để dòng gọi ở cuối chuỗi dời đi đâu cũng còn gọi được.
#
# doc_gop_run <lệnh bước đọc gộp…> — bước đọc gộp chạy qua đây thay cho job_run. Giống job_step/job_run của lib ở
# mọi thứ (dòng ghim JOB STEP cùng khuôn, mã hỏng ĐẦU TIÊN vào JOB_RC) khác đúng hai điểm, chỉ cho bước này:
#  (1) chạy dưới đồng hồ riêng canh_gio_buoc và nhận DOC_GOP_TRAN_GIAY (hợp đồng dừng sạch P3/HT6);
#  (2) mã 75 = hết giờ dừng sạch là ĐI TIẾP: không in JOB FAIL, không ghi JOB_RC — lượt 00:00 vẫn thoát 0 và enrich
#      chạy tiếp. Mã 75 của LƯỢT NHANH («đụng khoá 8 lượt liền») là nghĩa khác, vẫn là lỗi, không đi qua đây.
# Bước chạy nền rồi wait để biết pid của nó cho đồng hồ; đầu ra vẫn kế thừa ống của lượt.
doc_gop_run() {
  local buoc_pid="" dong_ho="" rc=0 t0 giay
  t0=$(date +%s)
  DOC_GOP_TRAN_GIAY="$DOC_GOP_TRAN_GIAY" "$@" &
  buoc_pid=$!
  canh_gio_buoc "$TRAN_DOC_GOP" "bước đọc gộp" "$buoc_pid"
  wait "$buoc_pid"
  rc=$?
  # Bước chính đã thoát → báo đồng hồ (SIGUSR1): đồng hồ đã bắn thì KILL ngay con cháu còn phớt TERM rồi thoát;
  # chưa bắn thì thoát luôn. Chờ đồng hồ thoát mới chạy tiếp (không sleep): lưới không để kẻ mồ côi.
  dong_ho="${DONG_HO_BUOC_PID:-}"
  if [ -n "$dong_ho" ]; then
    kill -USR1 "$dong_ho" 2>/dev/null
    wait "$dong_ho" 2>/dev/null
    kill -9 "$dong_ho" 2>/dev/null
  fi
  giay=$(( $(date +%s) - t0 )); [ "$giay" -lt 0 ] && giay=0
  job_step_ghi zalo-import-daily doc-gop-hang-ngay "$rc" "$giay"
  if [ "$rc" -eq 75 ]; then # 75 = hết giờ dừng sạch
    echo "JOB WARN [zalo-import-daily] bước doc-gop-hang-ngay: hết giờ dừng sạch (mã 75) — đi tiếp, không tính lỗi" >&2
    return 0
  fi
  if [ "$rc" -ne 0 ]; then
    echo "JOB FAIL [zalo-import-daily] bước doc-gop-hang-ngay mã $rc" >&2
    [ "$JOB_RC" -eq 0 ] && JOB_RC=$rc
  fi
  return 0
}
# canh_gio_buoc <trần-giây> <nhãn> <pid-bước> — ĐỒNG HỒ RIÊNG của một bước, dùng cho bước đọc gộp.
# canh_gio (phần trần) chỉ biết TERM cả lượt; đồng hồ này chỉ trúng CÂY tiến trình của bước (bước + mọi con cháu).
# Hết trần: in TIMEOUT rồi TERM mỗi giây, KILL sau 20s — chuỗi chạy tiếp. Bình thường nó không cần bắn: bước nhận
# DOC_GOP_TRAN_GIAY nên tự dừng sạch (thoát 75) trước đó; TERM chỉ là lưới cuối cho khi bước treo hay phớt TERM.
# Không để mồ côi (ba lỗ đo được ở ca 5, 6 của scripts/zalo-import-chia-tran-zcode.test.mjs):
# - bash của bước nhận TERM là chết NGAY (không trì hoãn) → node con phớt TERM thành mồ côi. Đồng hồ theo dấu
#   pid con cháu CÒN SỐNG của bước mỗi 2 giây (chết thì bỏ khỏi danh sách) nên vẫn KILL được nó.
# - Đồng hồ BỎ QUA SIGTERM: khi script không phải trưởng nhóm (chạy tay, bash -c) đồng hồ tổng chỉ TERM/KILL con
#   TRỰC TIẾP của script — từ lúc bước chạy nền, node của bước là con cháu, không ai trúng. Lượt đã dừng mà bước
#   hay con cháu của nó còn sống → đồng hồ này tự TERM rồi KILL nốt rồi tự thoát.
# - Nơi gọi sau wait gửi SIGUSR1: đồng hồ đã bắn thì KILL ngay phần còn lại rồi thoát (chuỗi không phải chờ 20s);
#   chưa bắn thì thoát luôn. Bước xong sớm → đồng hồ thoát trong 2s hoặc theo SIGUSR1.
# Cùng binary node với canh_gio (đường tuyệt đối ZALO_IMPORT_NODE_BIN); thiếu node thì đồng hồ TẮT, chỉ còn dừng
# sạch của bước.
canh_gio_buoc() {
  DONG_HO_BUOC_PID="" # set -u: ca không node thật vẫn có biến để nơi gọi đọc
  local node_that="${ZALO_IMPORT_NODE_BIN:-$HOME/.local/node-v24.21.0/bin/node}"
  if [ ! -x "$node_that" ]; then
    echo "⚠️ [zalo-import-daily] không có node thật ($node_that) — đồng hồ riêng của $2 TẮT (chỉ còn dừng sạch của bước)" >&2
    return 0
  fi
  TRAN_GIAY="$1" NHAN_BUOC="$2" PID_BUOC="$3" PID_SCRIPT="$$" "$node_that" -e '
    const { execSync } = require("node:child_process");
    const s = (v) => Number(v) * 1000;
    const buoc = Number(process.env.PID_BUOC), cha = Number(process.env.PID_SCRIPT), nhan = process.env.NHAN_BUOC;
    const song = (pid) => { try { process.kill(pid, 0); return true; } catch { return false; } };
    const conChau = (pid, ra = []) => { // mọi pid dưới pid (đệ quy pgrep -P), trừ chính đồng hồ
      let cs = [];
      try { cs = execSync(`pgrep -P ${pid}`, { encoding: "utf8" }).split("\n").map((l) => parseInt(l.trim(), 10)).filter(Number.isFinite); } catch {}
      for (const c of cs) { if (c !== process.pid) { ra.push(c); conChau(c, ra); } }
      return ra;
    };
    const muc = new Set(); // pid con cháu CÒN SỐNG của bước (chết thì bỏ) — KILL được phần phớt TERM kể cả khi cha nó đã chết
    let daBan = false, giu = null;
    const diet = () => { // KILL cứng phần còn sống rồi thoát
      if (giu) clearInterval(giu);
      for (const p of muc) { try { process.kill(p, "SIGKILL"); } catch {} }
      try { process.kill(buoc, "SIGKILL"); } catch {}
      process.exit(0);
    };
    const termLai = () => { // TERM mỗi giây: tiến trình phớt TERM phải được TERM lại tới khi KILL
      if (song(buoc)) for (const p of conChau(buoc)) muc.add(p);
      for (const p of muc) { if (song(p)) { try { process.kill(p, "SIGTERM"); } catch {} } else { muc.delete(p); } }
      try { process.kill(buoc, "SIGTERM"); } catch {}
    };
    const ban = (thongBao) => {
      if (daBan) return;
      daBan = true;
      console.error(thongBao);
      termLai();
      giu = setInterval(termLai, 1000);
      setTimeout(diet, 20_000).unref(); // ân hạn 20s rồi KILL cứng
    };
    const kiemTra = () => { // mỗi 2 giây
      if (song(buoc)) for (const p of conChau(buoc)) muc.add(p); // theo dấu cây của bước suốt lúc bước sống
      for (const p of muc) if (!song(p)) muc.delete(p);
      if (daBan) return;
      if (song(cha)) { if (!song(buoc)) process.exit(0); return; } // bước xong, lượt còn sống: nơi gọi tiếp tục chuỗi
      if (song(buoc)) ban(`❌ [zalo-import-daily] DỌN: ${nhan} còn chạy sau khi lượt đã dừng — gửi TERM để dừng bước`);
      else if (muc.size > 0) ban(`❌ [zalo-import-daily] DỌN: còn tiến trình của ${nhan} sau khi lượt đã dừng — gửi TERM để dừng`);
      else process.exit(0);
    };
    kiemTra();
    setInterval(kiemTra, 2000);
    setTimeout(() => ban(`❌ [zalo-import-daily] TIMEOUT: ${nhan} vượt trần ${process.env.TRAN_GIAY}s — gửi TERM để dừng bước, chuỗi chạy tiếp tới enrich`), s(process.env.TRAN_GIAY));
    process.on("SIGTERM", () => {}); // đồng hồ bước
    process.on("SIGUSR1", () => { if (!daBan) process.exit(0); diet(); }); // nơi gọi: bước chính đã thoát — KILL ngay phần còn lại
  ' &
  DONG_HO_BUOC_PID=$!
}
# Enrich (enrich-chay-sau-nap): bước dài (LLM ~10″/tin) không đụng state nạp — nhả khoá nạp trước để job nạp khác
# (apify-facebook-daily, chờ khoá tối đa 5′) không hỏng vì đợi; gỡ trap để lúc thoát không xoá khoá của job khác.
trap - EXIT; rm -rf "$LOCK_DIR"
# PL34 (claudedp-0911-7 MỞ LẠI lần 2): đặt SAU nhả khoá nạp — bước LLM dài
# (đọc cả ngày bài) không giữ khoá, apify-facebook-daily không phải chờ.
# Bảo đảm đọc bảng ĐÃ NẠP XONG: import hỏng thì tệp đã exit 1 trước đó
# (không bao giờ tới đây); transform-zalo hỏng không ảnh hưởng stg_zalo_posts
# (job_run không dừng khi bước trước hỏng — chỉ giữ JOB_RC). Vẫn trước
# enrich-run; trước mau-soat là mốc mềm (tự vớt ≤0,05 USD). Trần mặc định 20.
doc_gop_run bash "$ROOT/pipeline/doc-gop-hang-ngay.sh"
# MH1 model-may-sang-haiku: enrich gọi Haiku qua Vercel AI Gateway — cần AI_GATEWAY_API_KEY trong .env của kho, nạp bằng --env-file như
# bước đọc gộp (pipeline/doc-gop-hang-ngay.sh). ${ENRICH_ENV[@]+…}: /bin/bash 3.2 coi mảng rỗng là biến chưa đặt dưới `set -u`.
ENRICH_ENV=()
[ -f "$ROOT/.env" ] && ENRICH_ENV=(--env-file="$ROOT/.env")
enrich_run() { (cd "$ROOT/agent" && LIMIT="${ENRICH_LIMIT:-50}" node ${ENRICH_ENV[@]+"${ENRICH_ENV[@]}"} --import tsx scripts/enrich-run.ts); }
job_run zalo-import-daily enrich-run enrich_run
exit "$JOB_RC"
