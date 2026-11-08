#!/usr/bin/env bash
# install-cron-chi AC-3 — mật khẩu sao lưu vào Keychain, không vào plist, không vào đối số lệnh.
# HOME giả + launchctl/security giả đứng đầu PATH: không đụng LaunchAgents hay Keychain thật.
set -euo pipefail
ROOT="${1:?thiếu gốc kho}"
T="$(mktemp -d)"; trap 'rm -rf "$T"' EXIT
mkdir -p "$T/bin" "$T/home"
cat > "$T/bin/launchctl" <<SH
#!/bin/bash
echo "\$@" >> "$T/launchctl.log"
SH
cat > "$T/bin/security" <<SH
#!/bin/bash
echo "\$@" >> "$T/security.args"
cat > "$T/security.stdin"
SH
chmod +x "$T/bin/launchctl" "$T/bin/security"
CANARY="canary-$$-matkhau"
HOME="$T/home" PATH="$T/bin:$PATH" BACKUP_PASS="$CANARY" BACKUP_DIR="/Volumes/gia/onehub-backup" \
  bash "$ROOT/scripts/install-cron.sh" --chi backup > "$T/out.txt" 2>&1
loi=0
kiem() { if eval "$2"; then echo "đạt: $1"; else echo "HỎNG: $1"; loi=1; fi; }
P="$T/home/Library/LaunchAgents/com.oneinvest.backup.plist"
kiem "plist backup được cài" "[ -f '$P' ]"
kiem "security add-generic-password gọi đúng dịch vụ oneinvest-backup" "grep -q -- 'add-generic-password .*-s oneinvest-backup' '$T/security.args'"
kiem "mật khẩu đi qua stdin của security" "[ \"\$(cat '$T/security.stdin')\" = '$CANARY' ]"
kiem "mật khẩu KHÔNG nằm trong đối số security" "! grep -q '$CANARY' '$T/security.args'"
kiem "mật khẩu KHÔNG nằm trong plist" "! grep -q '$CANARY' '$P'"
kiem "mật khẩu KHÔNG in ra output script" "! grep -q '$CANARY' '$T/out.txt'"
kiem "mật khẩu KHÔNG vào lời gọi launchctl" "! grep -q '$CANARY' '$T/launchctl.log'"
kiem "BACKUP_DIR vào plist backup" "/usr/libexec/PlistBuddy -c 'Print :EnvironmentVariables:BACKUP_DIR' '$P' | grep -qx '/Volumes/gia/onehub-backup'"
kiem "không plist collector/smoke" "[ ! -e '$T/home/Library/LaunchAgents/com.oneinvest.collector.plist' ] && [ ! -e '$T/home/Library/LaunchAgents/com.oneinvest.smoke.plist' ]"
[ $loi -eq 0 ] && echo "KEYCHAIN OK" || { echo "KEYCHAIN HỎNG"; exit 1; }
