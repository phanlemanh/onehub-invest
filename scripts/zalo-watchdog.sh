#!/bin/bash
# zalo-watchdog.sh — Lớp 4+5 của Phương án B lockdown Zalo (5 lớp).
#
# Bài học sự cố 2026-10-20: agent LLM bị kích từ kênh xã hội và cố REPLY.
# Bài học 2026-10-21: bindings=[] KHÔNG đủ — channel auto-reply kích agent
# trên MỌI tin khi requireMention=false (127 turns/ngày). Watchdog giám sát
# CẢ HÀNH VI RUNTIME, không chỉ config:
#   L2: openclaw.json bindings = [] (rỗng tuyệt đối)
#   L3: channels.zalo (bot OA) phải vắng mặt
#   L3b: mọi nhóm zalouser phải requireMention=true
#   L4a: "drop no mention" tăng bất thường trong gateway.log (spam/lỗ gate)
#   L4b: log runtime KHÔNG được có agent-turn mới (auto-reply/agent-turn-timing)
#   L1: hook oneinvest-zalo-pipe không chứa API gửi tin
#   L5b: Postgres :5433 phải nghe (DB chết 22/10 không ai biết 7 tiếng)
# Khi vi phạm → kill OpenClaw + bootout launchd (chống respawn) + alert.
# Fail closed: config đúng nhưng hành vi sai vẫn bị bắt bởi L4b.
set -uo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
CFG="$HOME/.openclaw/openclaw.json"
HANDLER="$ROOT/collector/openclaw/handler.js"
ALERT_LOG="$ROOT/pipeline/logs/zalo-watchdog-alerts.log"
MARKER="$ROOT/pipeline/logs/zalo-watchdog-turn-marker"
OC_LOG_GLOB="/tmp/openclaw/openclaw-$(date +%Y-%m-%d).log"
mkdir -p "$ROOT/pipeline/logs"

alert() {
  local reason="$1"
  echo "$(date -Iseconds) KILL: $reason" >> "$ALERT_LOG"
  # S4 lượt 3 (3): bộ canh ghi sự kiện 'bo-canh' vào tệp sự kiện chung của bộ
  # tra — thư mục đọc THEO ENV GATEWAY (một nguồn, kể cả khi plist watchdog
  # không khai riêng) qua lib/bo-canh-su-kien.sh.
  . "$ROOT/scripts/lib/bo-canh-su-kien.sh"
  ghi_bo_canh "$(doc_s03_lookup_dir)" 
  # tắt hẳn service để launchd không hồi sinh
  launchctl bootout "gui/$(id -u)/ai.openclaw.gateway" 2>/dev/null || true
  pkill -9 -f openclaw 2>/dev/null || true
  osascript -e "display notification \"OpenClaw ĐÃ TẮT: $reason\" with title \"Zalo Watchdog\"" 2>/dev/null || true
  exit 1
}

# OpenClaw không chạy → không có gì để giám sát (bình thường khi user tắt tay)
pgrep -f openclaw >/dev/null || exit 0

# L2 — bindings phải rỗng
N_BIND=$(python3 -c "import json; print(len(json.load(open('$CFG')).get('bindings', [])))" 2>/dev/null || echo "err")
[ "$N_BIND" = "err" ] && alert "không đọc được openclaw.json (config hỏng?)"
[ "$N_BIND" != "0" ] && alert "bindings có $N_BIND entry (phải rỗng — L2 bị drill)"

# L3 — kênh bot phải vắng + L3b mọi nhóm requireMention=true
MSG=$(python3 - "$CFG" << 'EOF' 2>&1
import json, sys
d = json.load(open(sys.argv[1]))
if "zalo" in d.get("channels", {}):
    print("L3: channels.zalo (bot) vẫn bật"); sys.exit(1)
zs = d.get("channels", {}).get("zalouser", {})
for scope in [zs.get("groups")] + [a.get("groups") for a in (zs.get("accounts") or {}).values()]:
    for g, cfg in (scope or {}).items():
        # Bài học 22/10 tối: hai lỗ trước (nhóm requireMention=false có key
        # enabled; nhóm false thiếu key enabled) đều lọt. Giờ yêu cầu
        # requireMention=true TƯỜNG MINH cho mọi nhóm chưa tắt — không tin
        # default runtime của phiên bản (fail closed), nhóm thiếu key = lỗi.
        if cfg.get("enabled", True) is not False and cfg.get("requireMention") is not True:
            print(f"L3b: {g} requireMention phải true"); sys.exit(1)
EOF
) && CONFIG_OK=1 || CONFIG_OK=0
[ "$CONFIG_OK" = "0" ] && alert "$MSG (config bị drill)"

# L1 — handler phải read-only (không API gửi tin)
if grep -qiE "send-?message|sendMessage|reply\(" "$HANDLER" 2>/dev/null; then
  alert "handler oneinvest-zalo-pipe chứa API gửi tin (L1 bị drill)"
fi

# L4b — RUNTIME GUARD: agent-turn mới trong log = hành vi nguy hiểm bất kể
# config nói gì. Marker ghi số dòng đã quét; chỉ quét phần mới. Quét CẢ
# gateway.log canonical (~/Library/Logs/openclaw — runtime-map) lẫn log /tmp
# theo ngày; gateway.log chứa lịch sử sự cố cũ nên marker lần đầu khởi tạo
# bằng số dòng HIỆN TẠI (không alert giả trên quá khứ).
# In phần mới của $1 ra stdout; cập nhật marker $2. Log bị truncate/rotate
# (cur < last) → reset marker, không quét lại phần cũ.
scan_new_lines() {
  # $3 = 'history' (log lịch sử dài ngày như gateway.log — KHÔNG bao giờ quét
  # quá khứ) hoặc 'daily' (log /tmp theo ngày — file mới quét từ dòng 1)
  local f="$1" mk="$2" mode="${3:-daily}" prev curInode curLines prevPath rest prevInode prevLines
  [ -f "$f" ] || return 0
  curInode=$(stat -f '%i' "$f" 2>/dev/null || echo 0)
  curLines=$(wc -l < "$f" | tr -d ' ')
  prev=$(cat "$mk" 2>/dev/null || echo "")
  if [ -z "$prev" ]; then
    # khởi tạo (lần đầu với gateway.log chứa lịch sử cũ) — không quét quá khứ
    echo "$f:$curInode:$curLines" > "$mk"
    return 0
  fi
  prevPath=${prev%%:*}
  rest=${prev#*:}
  prevInode=${rest%%:*}
  prevLines=${rest#*:}
  # Marker hỏng trường số dòng (vd 'abc') → ((prevLines + 1)) chết dưới
  # set -u, hàm không in gì (kể cả turn của file MỚI) và không ghi lại marker
  # → L4b mù tới khi file cũ biến mất. Coi như FILE MỚI: quét từ dòng 1 +
  # WARN alert-log để thấy (mở lại 2310-7).
  if ! [[ "$prevInode" =~ ^[0-9]+$ && "$prevLines" =~ ^[0-9]+$ ]]; then
    # Log LỊCH SỬ (gateway.log chứa turn của sự cố cũ đã xử lý): quét từ
    # dòng 1 sẽ gặp agent-turn 20/10 → alert → KILL gateway vì QUÁ KHỨ
    # (claudedp-2310-7 mở lại lần 2). Marker hỏng → khởi tạo lại ở dòng
    # HIỆN TẠI như nhánh marker rỗng, chỉ WARN — không quét quá khứ.
    # Log THEO NGÀY (file mới mỗi ngày, không có quá khứ): quét từ dòng 1.
    if [ "$mode" = "history" ]; then
      echo "$(date -Iseconds) WARN: marker L4b (history) hỏng '${prev:0:120}' — khởi tạo lại ở dòng $curLines, không quét quá khứ" >> "$ALERT_LOG"
    else
      echo "$(date -Iseconds) WARN: marker L4b hỏng '${prev:0:120}' — quét từ dòng 1" >> "$ALERT_LOG"
      tail -n +1 "$f"
    fi
    echo "$f:$curInode:$curLines" > "$mk"
    return 0
  fi
  # Marker ghi DANH TÍNH file 'đường_dẫn:inode:số_dòng': đếm dòng không phân
  # biệt được ngày mới DÀI HƠN ngày cũ (cur > last quét từ last+1 → sót dòng
  # đầu, claudedp-2310-5 mở lại). Khác path/inode = file mới (log xoay ngày);
  # cùng file mà ít dòng hơn = truncate — cả hai quét TOÀN BỘ từ dòng 1.
  #
  # CHẾ ĐỘ HISTORY (2410-15, gateway.log chứa turn của sự cố cũ): MỌI nhánh
  # 'quét lại' đều nguy hiểm KILL-nhầm vì quá khứ — đổi file (kể cả marker
  # số dòng lớn hơn thật), truncate, marker định dạng số cũ: KHÔNG quét gì,
  # khởi tạo lại marker ở dòng HIỆN TẠI + WARN, giống nhánh marker hỏng.
  # Chỉ nhánh 'cùng file + nhiều dòng hơn' (append — đường phổ thường) quét
  # phần mới. Cửa sổ bỏ sót khi log xoay thật: những dòng đầu file MỚI ghi
  # TRƯỚC lượt quét đầu tiên sau xoay (≤ một chu kỳ watchdog 5′) không được
  # quét — đánh đổi có ý thức để không tự tắt gateway vì lịch sử.
  if [ "$mode" = "history" ]; then
    if [ "$prevPath" != "$f" ] || [ "$prevInode" != "$curInode" ] || [ "$curLines" -lt "$prevLines" ]; then
      echo "$(date -Iseconds) WARN: L4b (history) '${1##*/}' đổi file/truncate/xoay — khởi tạo lại ở dòng $curLines, không quét quá khứ (cửa sổ bỏ sót ≤1 chu kỳ 5′)" >> "$ALERT_LOG"
      echo "$f:$curInode:$curLines" > "$mk"
      return 0
    fi
    if [ "$curLines" -gt "$prevLines" ]; then
      tail -n +"$((prevLines + 1))" "$f"
    fi
    echo "$f:$curInode:$curLines" > "$mk"
    return 0
  fi
  if [ "$prevPath" != "$f" ] || [ "$prevInode" != "$curInode" ]; then
    # ĐỔI FILE: đuôi file CŨ viết SAU lượt quét cuối ngày (~23:55–00:00) chưa
    # ai quét — quét NỐT từ prevLines+1 TRƯỚC khi đổi sang file mới
    # (claudedp-2310-7). File cũ bị xoá/tmp dọn thì bỏ qua im lặng; inode khác
    # (path bị tái sử dụng) cũng bỏ — không quét nhầm file lạ.
    if [ -n "$prevPath" ] && [ -f "$prevPath" ]; then
      oldInode=$(stat -f '%i' "$prevPath" 2>/dev/null || echo x)
      if [ "$oldInode" = "$prevInode" ]; then
        tail -n +"$((prevLines + 1))" "$prevPath" 2>/dev/null
      fi
    fi
    tail -n +1 "$f"
  elif [ "$curLines" -lt "$prevLines" ]; then
    tail -n +1 "$f"
  elif [ "$curLines" -gt "$prevLines" ]; then
    tail -n +"$((prevLines + 1))" "$f"
  fi
  echo "$f:$curInode:$curLines" > "$mk"
}

DROP_WARN_N=20 # "drop no mention" mới ≥ ngưỡng này trong 1 cửa sổ 5′ = bất thường
GW_LOG="$HOME/Library/Logs/openclaw/gateway.log"
GW_NEW=$(scan_new_lines "$GW_LOG" "$ROOT/pipeline/logs/zalo-watchdog-gw-marker" history)
if [ -n "$GW_NEW" ]; then
  # L4b trên gateway.log
  # AC-11 (0511-16 mở lại lần 2): ống nối echo|grep -q dưới pipefail trả không-khớp
  # với khối lớn (>bộ đệm pipe, tái hiện 400 KB trên bash 3.2) — dùng here-string
  if grep -q "auto-reply/agent-turn-timing" <<< "$GW_NEW"; then
    alert "agent-turn MỚI trong gateway.log (auto-reply chạy dù config an toàn) — hành vi sự cố 2026-10-20"
  fi
  # L4a — mention-gate drop là hành vi ĐÚNG, nhưng bùng nổ đếm = bất thường
  # (spam vào nhóm, hoặc gate vô tình nhầm trên nhóm chat thật)
  DROP_N=$(echo "$GW_NEW" | grep -c "drop no mention" || true)
  if [ "${DROP_N:-0}" -ge "$DROP_WARN_N" ]; then
    echo "$(date -Iseconds) WARN: 'drop no mention' +$DROP_N trong 5′ (ngưỡng $DROP_WARN_N) — spam hay gate nhầm nhóm?" >> "$ALERT_LOG"
    osascript -e "display notification \"drop no mention +$DROP_N/5′ — kiểm tra nhóm Zalo\" with title \"Zalo Watchdog L4a\"" 2>/dev/null || true
  fi
fi
# L4b trên log /tmp theo ngày (nơi launchd ghi)
if [ -f "$OC_LOG_GLOB" ]; then
  TMP_NEW=$(scan_new_lines "$OC_LOG_GLOB" "$MARKER")
  if [ -n "$TMP_NEW" ] && grep -q "auto-reply/agent-turn-timing" <<< "$TMP_NEW"; then
    alert "agent-turn MỚI từ kênh xã hội (auto-reply chạy dù config an toàn) — hành vi sự cố 2026-10-20"
  fi
fi

# L4d — AGENT TURN THEO DB (0511-16): lượt agent với tổng dưới 10 giây và
# không giai đoạn nào từ 5 giây KHÔNG in dòng timing (totalWarnMs 1e4 /
# stageWarnMs 5e3) nên L4b bỏ sót — bộ canh đã từng chỉ bắt được 30/10 vì
# lượt đó kịp in timing. Đếm bảng transcript_events trong MỌI
# ~/.openclaw/agents/*/agent/openclaw-agent.sqlite (glob — không liệt kê
# cứng agent). Chỉ SELECT COUNT(*)/MAX(created_at) qua sqlite3 CHỈ-ĐỌC
# thích ứng: mode=ro khi kho đang mở WAL (có -wal), immutable=1 khi kho đóng
# sạch không tệp phụ (đọc mode=ro lúc đó lỗi rc 14 — tái hiện + gặp thật
# 06/11) — KHÔNG đụng cột nội dung (event_json, event_zstd,
# navigation_json), không in nội dung phiên.
#   baseline: lần chạy đầu của L4d (cờ .first-done chưa có) chỉ ghi mốc cho
#   kho CHƯA có mốc; kho đã có mốc (lần đầu bị ngắt giữa vòng) được so như
#   thường — lượt mới giữa chừng không bị nuốt vào mốc. Lượt LỊCH SỬ (30/10
#   đã xử lý) không kill.
#   Từ lượt thứ hai: DB MỚI xuất hiện có count>0 là KILL ngay (DB đó sinh ra
#   vì chính lượt đầu của agent — 0511-16 mở lại), chỉ DB mới rỗng 0|0 mới
#   baseline; count TĂNG hoặc max TĂNG so marker → KILL. count GIẢM mà max
#   không tăng → WARN + cập nhật marker (dòng bị chuyển sang archives —
#   kho có session_transcript_archives/cold_archives), không kill.
#   marker cố ý KHÔNG tự tiến sau khi KILL: bật lại gateway là lượt kế kill
#   tiếp cho tới khi người đọc xử marker — luật 8 cần người đọc trước khi
#   bật lại (0511-16 mở lại; runbook của liên làn).
#   DB không đọc được sau 3 lần thử (mỗi lần timeout 5s, cách 2s — một lần
#   busy/migration thoáng qua KHÔNG tắt gateway) / thiếu bảng / cột đổi tên
#   / đầu ra lệch khuôn ^count|max$ → alert ĐỎ fail-closed, KHÔNG im lặng
#   coi là 0. MỐC HỎNG (rỗng/sai khuôn) cũng ĐỎ, giữ nguyên tệp mốc; mốc
#   ghi nguyên tử (tệp tạm + mv). Giữ L4b dò chuỗi timing song song: hai nguồn độc lập —
#   session bị xoá khỏi DB vẫn còn dấu trong log gateway, và ngược lại lượt
#   ngắn chỉ thấy ở DB.
L4D_AGENTS_DIR="$HOME/.openclaw/agents"
L4D_MARK_DIR="$ROOT/pipeline/logs/zalo-watchdog-agentdb.d"
L4D_FIRST="$L4D_MARK_DIR/.first-done"
mkdir -p "$L4D_MARK_DIR"
# Đọc DB thích ứng (0511-16 mở lại lần 2 điểm 1 — AC-5): kho ĐANG MỞ (có
# -wal của WAL, hoặc -journal của rollback) đọc mode=ro — được phép sinh -shm
# và tôn trọng khóa (.timeout); kho ĐÓNG SẠCH (SQLite xoá hết tệp phụ khi
# kết nối cuối đóng — mode=ro lúc đó lỗi rc 14 «unable to open database
# file», tái hiện + gặp thật 06/11 02:03 khi làm 0511-17) đọc immutable=1 —
# không sinh tệp, đọc snapshot; immutable chỉ dùng khi KHÔNG có tệp phụ vì
# đọc kho đang giữa giao dịch rollback qua immutable có thể ra số chưa nhất
# quán.
l4d_read_db() { # $1=DB → in "count|max_created_at"; hỏng/khóa/trái khuôn → exit≠0
  local db="$1" out i mode
  if [ -e "$db-wal" ] || [ -e "$db-journal" ]; then mode="mode=ro"; else mode="immutable=1"; fi
  for i in 1 2 3; do
    out=$(sqlite3 -cmd '.timeout 5000' "file:$db?$mode" \
      "SELECT COUNT(*) || '|' || COALESCE(MAX(created_at), 0) FROM transcript_events;" 2>/dev/null)
    if [ -n "$out" ] && [[ "$out" =~ ^[0-9]+\|[0-9]+$ ]]; then
      printf '%s\n' "$out"
      return 0
    fi
    sleep 2
  done
  return 1
}
l4d_cnt() { echo "${1%%|*}"; }
l4d_max() { echo "${1##*|}"; }
# Ghi mốc NGUYÊN TỬ (AC-6): tệp tạm trong cùng dir rồi mv — không bao giờ để
# mốc rỗng/nửa vời giữa chừng.
l4d_ghi_moc() { # $1=marker $2=value
  printf '%s\n' "$2" > "$1.tmp.$$" && mv -f "$1.tmp.$$" "$1"
}
for L4D_DB in "$L4D_AGENTS_DIR"/*/agent/openclaw-agent.sqlite; do
  [ -e "$L4D_DB" ] || continue # chưa có agent nào — bình thường
  L4D_NOW=$(l4d_read_db "$L4D_DB") \
    || alert "L4d: không đọc được $L4D_DB sau 3 lần thử (DB hỏng/bị khóa kéo dài/thiếu bảng transcript_events/cột đổi tên) — fail-closed, không coi là 0"
  L4D_AG=$(basename "$(dirname "$(dirname "$L4D_DB")")")
  L4D_MK="$L4D_MARK_DIR/$L4D_AG"
  # MỐC HỎNG (AC-6): tệp mốc tồn tại mà rỗng/sai khuôn số|số → ĐỎ, nêu mốc
  # hỏng, GIỮ NGUYÊN tệp (người sửa gõ sai không được nuốt lượt).
  if [ -f "$L4D_MK" ]; then
    L4D_PREV=$(head -c 200 "$L4D_MK" 2>/dev/null || echo "")
    if [ -z "$L4D_PREV" ] || ! [[ "$L4D_PREV" =~ ^[0-9]+\|[0-9]+$ ]]; then
      alert "L4d: mốc hỏng của agent '$L4D_AG' (nội dung '${L4D_PREV:0:40}') — giữ nguyên tệp mốc, xử tay rồi mới chạy tiếp"
    fi
  else
    L4D_PREV=""
  fi
  if [ -z "$L4D_PREV" ] && [ ! -e "$L4D_FIRST" ]; then
    # lần chạy ĐẦU của L4d VÀ kho CHƯA có mốc → baseline (lịch sử không kill).
    # Kho ĐÃ có mốc (lần đầu bị ngắt giữa vòng) rơi xuống nhánh so-sánh như
    # thường — lượt mới giữa chừng không bị tính vào mốc (0511-16 mở lại lần 2
    # điểm 2 — AC-2).
    l4d_ghi_moc "$L4D_MK" "$L4D_NOW"
  elif [ -z "$L4D_PREV" ] && [ "$(l4d_cnt "$L4D_NOW")" = "0" ]; then
    # DB mới xuất hiện nhưng chưa có event nào — baseline 0|0, không kill
    l4d_ghi_moc "$L4D_MK" "$L4D_NOW"
  elif [ -z "$L4D_PREV" ]; then
    # DB mới xuất hiện ĐÃ CÓ events từ lượt sau trở đi — chính là lượt chạy
    # của agent đó (0511-16 mở lại điểm 3): KILL, KHÔNG baseline
    alert "L4d: agent '$L4D_AG' mới có transcript_events ($L4D_NOW) — lượt agent chạy dù config an toàn, hành vi sự cố 2026-10-20 — SAU KHI ĐIỀU TRA: xử marker $L4D_MK rồi mới bật lại (marker cố ý không tự tiến)"
  elif [ "$(l4d_cnt "$L4D_NOW")" -gt "$(l4d_cnt "$L4D_PREV")" ] || [ "$(l4d_max "$L4D_NOW")" -gt "$(l4d_max "$L4D_PREV")" ]; then
    alert "L4d: agent '$L4D_AG' có transcript_events MỚI ($L4D_PREV → $L4D_NOW) — lượt agent chạy dù config an toàn, hành vi sự cố 2026-10-20 — SAU KHI ĐIỀU TRA: xử marker $L4D_MK rồi mới bật lại (marker cố ý không tự tiến)"
  elif [ "$L4D_NOW" != "$L4D_PREV" ]; then
    # count GIẢM mà max không tăng: dòng bị chuyển sang archives — WARN, ghi
    # lại marker, KHÔNG kill (0511-16 mở lại điểm 1)
    echo "$(date -Iseconds) WARN: L4d agent '$L4D_AG' count giảm $L4D_PREV → $L4D_NOW (dòng chuyển sang archives?) — cập nhật marker, không kill" >> "$ALERT_LOG"
    l4d_ghi_moc "$L4D_MK" "$L4D_NOW"
  fi
done
# cờ lần-đầu đặt SAU vòng quét: lượt đầu không DB nào cũng coi đã baseline
[ -e "$L4D_FIRST" ] || touch "$L4D_FIRST"
# marker còn mà DB mất (agent bị xoá?) — WARN để truy vết, không kill
for L4D_MK in "$L4D_MARK_DIR"/*; do
  [ -f "$L4D_MK" ] || continue
  L4D_AG=$(basename "$L4D_MK")
  [ -e "$L4D_AGENTS_DIR/$L4D_AG/agent/openclaw-agent.sqlite" ] \
    || echo "$(date -Iseconds) WARN: L4d marker '$L4D_AG' còn nhưng DB biến mất — agent bị xoá?" >> "$ALERT_LOG"
done


# L4c — COLLECTION STARVED (bài học 22/10: "an toàn 0-turn" có thể là 0 TIN
# vì mention-gate giết thu — watchdog phải phân biệt). 24h không snapshot
# zalo-agent MỚI = cảnh báo.
LAST_SNAP=$(find "$ROOT"/collector/snapshots -name "*__zalo-agent__*" -type f -name "manifest.json" -newer /dev/null 2>/dev/null | xargs stat -f "%m %N" 2>/dev/null | sort -rn | head -1 | cut -d' ' -f2)
if [ -n "$LAST_SNAP" ]; then
  LAST_M=$(stat -f %m "$(dirname "$LAST_SNAP")")
  AGE_H=$(( ( $(date +%s) - LAST_M ) / 3600 ))
  [ "$AGE_H" -ge 24 ] && echo "$(date -Iseconds) WARN: zalo-agent snapshot cũ ${AGE_H}h — collection starved?" >> "$ALERT_LOG"
fi

# L6 — KIỂM SỐNG S03 (claudedp-1011-5, LT0): sự cố 09/11 provider chết 23
# giờ mà mọi lớp an toàn trên vẫn «ok» — chúng kiểm an toàn, không kiểm
# sống. 3 kiểm sống (30′ không snapshot ban ngày 7–22h · auto-restart hẹn
# mà 2′ không có starting provider · status not linked) cảnh báo KHÔNG kill,
# mỗi sự cố báo 1 lần rồi tự xoá khi hồi. Xem scripts/lib/s03-song.sh.
SONG_STATE="$ROOT/pipeline/logs/zalo-watchdog-song-state"
. "$ROOT/scripts/lib/s03-song.sh"
SONG_MTIME=$(find "$ROOT"/collector/snapshots -type d -name '*__zalo-agent__*' -exec stat -f '%m' {} + 2>/dev/null | sort -rn | head -1 | tr -d ' ')
if [ -n "${SONG_MTIME:-}" ]; then
  song_a_snapshot "$(date +%s)" "$(TZ=Asia/Ho_Chi_Minh date +%H)" "$SONG_MTIME" "$SONG_STATE" "$ALERT_LOG"
fi
song_b_restart "$GW_LOG" "$(date +%s)" "$SONG_STATE" "$ALERT_LOG"
song_c_notlinked "$("$HOME/.openclaw/bin/openclaw" status 2>/dev/null || true)" "$SONG_STATE" "$ALERT_LOG"
# L1b — port pluginHooks.messageReceived tiền-cổng còn nguyên (thay hot-patch
# __pregate 22/10 tối; plugin update có thể ghi đè). Marker là tên property
# sống sót qua minify, không phải tên hàm (hàm bị đổi tên khi bundle).
OCZ_MON=$(ls ~/.openclaw/extensions/zalouser/dist/.setup/monitor-*.mjs 2>/dev/null | head -1)
[ -n "$OCZ_MON" ] || alert "không thấy dist/.setup/monitor-*.mjs của zalouser (cài đặt extension hỏng?)"
grep -q "pluginHooks" "$OCZ_MON" 2>/dev/null \
  || alert "port pluginHooks zalouser BIẾN MẤT (plugin update ghi đè?) — tin thường sẽ không chảy tới hook khi requireMention=true"
grep -q "SuppressMessageReceivedHooks" "$OCZ_MON" 2>/dev/null \
  || alert "cờ chặn phát đôi SuppressMessageReceivedHooks BIẾN MẤT trong monitor zalouser — tin qua gate sẽ bị phát hook 2 lần"

# L5 — ghi nhịp kiểm tra (im lặng = mọi lớp còn nguyên)
# Kev gate :8009 chết = mất dữ liệu im lặng (đã xảy ra 2026-10-21) → cảnh
# báo (KHÔNG kill OpenClaw — handler giờ fail-open, thu vẫn chạy).
KEV_OK=$(curl -s -o /dev/null -w "%{http_code}" --max-time 3 http://127.0.0.1:8009/v1/models 2>/dev/null)
KEV_NOTE="kev:ok"
[ "$KEV_OK" = "200" ] || {
  KEV_NOTE="kev:DOWN($(date +%H:%M))"
  echo "$(date -Iseconds) WARN: Kev gate :8009 không đáp ứng (HTTP $KEV_OK) — handler đang fail-open" >> "$ALERT_LOG"
  osascript -e "display notification \"Kev gate :8009 DOWN — tin Zalo chưa phân loại vẫn được thu\" with title \"Zalo Watchdog\"" 2>/dev/null || true
}

# L5b — Postgres :5433 phải nghe (bài học 22/10: container DB chết 22:49,
# restart policy=no, không lớp giám sát nào thấy trong 7 tiếng — zalo-import
# 00:00 fail + chotot nạp fail, không một cảnh báo). Chỉ mở/kết nối TCP rồi
# đóng: đủ biết Postgres còn nghe, không cần client thật.
DB_NOTE="db:ok"
if ! (exec 3<>/dev/tcp/127.0.0.1/5433) 2>/dev/null; then
  DB_NOTE="db:DOWN($(date +%H:%M))"
  echo "$(date -Iseconds) WARN: Postgres :5433 KHÔNG NGHE — nạp/transform đêm sẽ fail (container chết? sự cố 22/10 lặp)" >> "$ALERT_LOG"
  osascript -e "display notification \"Postgres :5433 DOWN — nạp dữ liệu đêm sẽ fail\" with title \"Zalo Watchdog L5b\"" 2>/dev/null || true
else
  exec 3>&- 3<&- 2>/dev/null || true
fi
echo "$(date -Iseconds) ok — bindings=0, mention-all, no bot, handler read-only, 0 turn mới, $KEV_NOTE, $DB_NOTE" \
  >> "$ROOT/pipeline/logs/zalo-watchdog.log"
tail -500 "$ROOT/pipeline/logs/zalo-watchdog.log" > "$ROOT/pipeline/logs/zalo-watchdog.log.tmp" \
  && mv "$ROOT/pipeline/logs/zalo-watchdog.log.tmp" "$ROOT/pipeline/logs/zalo-watchdog.log"

# VHZ2 (P1, claudedp-1411-33) — TỰ KHỞI ĐỘNG LẠI GATEWAY MỘT LẦN khi CẢ BA
# điều kiện cùng lượt (bối cảnh: bộ tự khởi động lại kênh treo 3/10 lần —
# 09/11 treo ~24h, 13/11 treo 34h):
#   (a) L6(b) đỏ kéo dài ≥10′ (state dòng b-moc=<mốc attempt> do s03-song ghi);
#   (b) MỌI lớp lockdown cùng lượt «ok» — tới được đây nghĩa là L2/L3/L3b/L1/
#       L4b/L4d đã chạy hết mà không alert (alert exit 1 ngay khi vi phạm);
#   (c) L4d không thấy lượt agent dở (như (b)).
# Trần 1 lần/6 giờ — quá trần chỉ cảnh báo. Ghi sổ + alerts log để D1 đẩy.
# Sau kickstart: heartbeat reason=session (phiên chết) → KHÔNG thử lại,
# cảnh báo «cần QR» một lần mỗi sự cố; KHÔNG BAO GIỜ tự QR.
# Kickstart qua env ZALO_WATCHDOG_KICKSTART (test thay stub); công tắc tắt:
# env ZALO_WATCHDOG_P1_TAT=1 hoặc tệp pipeline/logs/zalo-watchdog-p1-tat.
P1_TAT_TEP="$ROOT/pipeline/logs/zalo-watchdog-p1-tat"
P1_STATE="$ROOT/pipeline/logs/zalo-watchdog-p1-state"
P1_SO="$ROOT/pipeline/logs/zalo-watchdog-p1.log"
if [ "${ZALO_WATCHDOG_P1_TAT:-0}" != "1" ] && [ ! -f "$P1_TAT_TEP" ]; then
  NOW_P1=$(date +%s)
  # heartbeat up (state heartbeat biến mất) → sự cố phiên kết thúc: gỡ cờ không-thử-lại
  HB_STATE="${ZALO_HEARTBEAT_STATE:-$HOME/.openclaw/logs/.zalo-heartbeat-down}"
  if [ ! -f "$HB_STATE" ] && grep -q '^session=1' "$P1_STATE" 2>/dev/null; then
    grep -vx 'session=1' "$P1_STATE" > "${P1_STATE}.tmp" 2>/dev/null && mv "${P1_STATE}.tmp" "$P1_STATE" || rm -f "${P1_STATE}.tmp"
  fi
  B_MOC=$(grep -oE '^b-moc=[0-9]+' "$SONG_STATE" 2>/dev/null | cut -d= -f2 | tail -1)
  A_OK=0
  [ -n "$B_MOC" ] && [ $(( NOW_P1 - B_MOC )) -ge 600 ] && A_OK=1
  # (b)+(c): tới được đây = mọi lớp lockdown và L4d đã chạy không alert (alert exit 1)
  if [ "$A_OK" = "1" ]; then
    if grep -q '^session=1' "$P1_STATE" 2>/dev/null; then
      if song_chua_bao p1-qr "$SONG_STATE"; then
        song_canh_bao p1-qr "kickstart xong nhưng heartbeat vẫn reason=session — phiên chết, CẦN QUÉT QR tay tại /ops/sources (VHZ2 không tự QR)" "$SONG_STATE" "$ALERT_LOG"
      fi
    else
      DU_TRAN=0
      LAN_P1=$(grep -oE '^lan=[0-9]+' "$P1_STATE" 2>/dev/null | cut -d= -f2 | tail -1)
      [ -n "$LAN_P1" ] && [ $(( NOW_P1 - LAN_P1 )) -lt 21600 ] && DU_TRAN=1
      if [ "$DU_TRAN" = "1" ]; then
        echo "$(date -Iseconds) WARN VHZ2: đủ điều kiện kickstart nhưng quá trần 1 lần/6 giờ — chỉ cảnh báo, không kick" >> "$ALERT_LOG"
      else
        echo "lan=$NOW_P1" >> "$P1_STATE"
        echo "$(date -Iseconds) VHZ2: kickstart gateway — L6(b) đỏ $(( NOW_P1 - B_MOC ))s (≥10′), lockdown ok, L4d sạch" >> "$ALERT_LOG"
        echo "$(date -Iseconds) VHZ2 kickstart — lý do: L6(b) đỏ $(( NOW_P1 - B_MOC ))s; heartbeat reason=$(grep -oE '^reason=[a-z]+' "$HB_STATE" 2>/dev/null | cut -d= -f2 | tail -1 || echo na)" >> "$P1_SO"
        # heartbeat vẫn reason=session sau khi kick → đánh dấu không thử lại (lượt sau cảnh báo cần QR)
        if grep -q '^reason=session' "$HB_STATE" 2>/dev/null; then
          echo "session=1" >> "$P1_STATE"
        fi
        KICK_CMD="${ZALO_WATCHDOG_KICKSTART:-launchctl kickstart -k gui/$(id -u)/ai.openclaw.gateway}"
        bash -c "$KICK_CMD" >/dev/null 2>&1 || true
      fi
    fi
  fi
fi
