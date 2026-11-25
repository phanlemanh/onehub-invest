#!/usr/bin/env node
// day-ban-chep-kiem-m5.mjs — cài, thu hồi và kiểm đường đẩy bản chép trên MÁY PHÁT TRIỂN THẬT qua cầu (HT25, ADR-0019,
// docs/ops/hai-may.md). Chạy trên máy thu. Ngoài CI (cần cầu Thunderbolt và cấu hình riêng máy).
//
//   node scripts/day-ban-chep-kiem-m5.mjs cai        tạo khoá đẩy (nếu chưa có), chép bước nhận sang máy kia, thêm MỘT dòng
//                                                    `restrict,command="…/nhan-ban-chep.sh" <khoá đẩy>` vào authorized_keys (sao lưu trước)
//   node scripts/day-ban-chep-kiem-m5.mjs go         gỡ đúng dòng của khoá đẩy (sao lưu trước); bước nhận + cấu hình vai để lại
//   node scripts/day-ban-chep-kiem-m5.mjs khoa       E3: khoá đẩy chỉ chạy được bước nhận (shell, lệnh khác, scp, sftp, -L, ký tự lạ bị từ chối)
//   node scripts/day-ban-chep-kiem-m5.mjs mot-chieu  E4: máy thu không có khoá nào sinh trên máy kia; lệnh đẩy chỉ gọi ssh tới máy kia
//   node scripts/day-ban-chep-kiem-m5.mjs lich       E8: không plist/cron nào cho đẩy/nhận trên hai máy, kho không có plist cho chúng
//   node scripts/day-ban-chep-kiem-m5.mjs that       E10: lượt đẩy thật + số dòng, Invest, data-api trên máy kia (CHỈ trong lượt chấm)
//   node scripts/day-ban-chep-kiem-m5.mjs tai-lieu   E11: tài liệu hai máy đủ, kho không chứa giá trị riêng máy
//
// Hai khoá, hai việc: KHOA_DUNG (khoá dựng máy, toàn quyền) chỉ dùng cho cai/go và đọc trạng thái để kiểm; KHOA_DAY (khoá đẩy) là khoá
// duy nhất lệnh đẩy dùng. Giá trị riêng máy (địa chỉ cầu, người dùng, đường khoá, tên máy) đọc từ ~/.config/onehub/hai-may.env —
// không in đường khoá riêng, không in nội dung khoá riêng. Mã thoát: 0 đạt · 1 không đạt · 2 cấu hình/đối số sai · 3 cầu không thông.
import { spawn, spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync, chmodSync, realpathSync } from "node:fs";
import net from "node:net";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { docCauHinh, loiCauHinhDay, kiemCau, lenhSsh, NHA, NHAN_SH } from "./day-ban-chep.mjs";

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
export const DUOI_NHAN = ".local/share/onehub/nhan-ban-chep.sh"; // dưới thư mục nhà của máy kia
export const GHI_CHU_KHOA = "onehub-day-ban-chep";
const TEN_LENH = /day-ban-chep|nhan-ban-chep/;

// ───────── lõi thuần ─────────

/** Phần base64 của một khoá công khai (trường sau loại khoá). */
export function blobKhoa(dong) {
  const m = /(?:^|\s)(ssh-(?:ed25519|rsa|dss)|ecdsa-sha2-\S+|sk-\S+)\s+([A-Za-z0-9+/=]+)/.exec(String(dong));
  return m ? m[2] : null;
}

/** Dòng authorized_keys cho khoá đẩy. */
export const dongKhoaDay = (duongNhan, pub) => `restrict,command="${duongNhan}" ${pub.trim().split(/\s+/).slice(0, 2).join(" ")} ${GHI_CHU_KHOA}`;

/** Lỗi của một dòng authorized_keys khoá đẩy: phải có restrict và command= trỏ bước nhận, không mở lại quyền nào. */
export function kiemDongKhoa(dong) {
  const loi = [];
  const tuyChon = String(dong).split(/\s+(?=ssh-|ecdsa-|sk-)/)[0];
  if (!/(^|,)restrict(,|\s|$)/.test(tuyChon)) loi.push("dòng khoá đẩy thiếu «restrict» (không chặn shell tương tác, chuyển cổng, agent, X11, pty)");
  if (!/(^|,)command="[^"]*\/nhan-ban-chep\.sh"/.test(tuyChon)) loi.push("dòng khoá đẩy thiếu command= trỏ nhan-ban-chep.sh");
  for (const mo of ["pty", "port-forwarding", "agent-forwarding", "X11-forwarding", "user-rc", "permitopen", "permitlisten"]) {
    if (new RegExp(`(^|,)${mo}`).test(tuyChon)) loi.push(`dòng khoá đẩy mở lại «${mo}»`);
  }
  return loi;
}

/** Dòng nào của một danh sách (launchctl, crontab, nội dung plist) nhắc tới lệnh đẩy/nhận. */
export const dongNhacLenh = (txt) => String(txt).split("\n").filter((l) => TEN_LENH.test(l));

/** Khoá công khai của máy kia có mặt trong authorized_keys máy này không (so phần base64). */
export function khoaNguoc(authorizedMayNay, pubMayKia) {
  const co = new Set(String(authorizedMayNay).split("\n").map(blobKhoa).filter(Boolean));
  return String(pubMayKia).split("\n").map(blobKhoa).filter((b) => b && co.has(b));
}

// ───────── tiến trình ─────────

function cauHinh({ canDung = true } = {}) {
  const { cfg, loi } = docCauHinh();
  if (loi) return { loi };
  const l = loiCauHinhDay(cfg);
  if (l) return { loi: l };
  if (cfg.VAI !== "may-thu") return { loi: "chỉ chạy trên máy thu (VAI=may-thu)" };
  if (canDung && (!cfg.KHOA_DUNG || !existsSync(cfg.KHOA_DUNG))) return { loi: "cấu hình riêng máy thiếu KHOA_DUNG (khoá dựng máy) hay tệp không có" };
  return { cfg };
}

const SSH_CHUNG = ["-F", "/dev/null", "-o", "IdentitiesOnly=yes", "-o", "IdentityAgent=none", "-o", "BatchMode=yes", "-o", "ConnectTimeout=10"];
/** Lệnh qua KHOÁ DỰNG MÁY (cai/go/đọc để kiểm) — không bao giờ dùng cho lượt đẩy. */
function quaKhoaDung(cfg, lenh, { input } = {}) {
  // Shell đăng nhập của máy kia là zsh (glob không khớp thì lỗi): chạy mọi lệnh dưới /bin/bash.
  const r = spawnSync("ssh", [...SSH_CHUNG, "-i", cfg.KHOA_DUNG, "-o", `BindAddress=${cfg.CAU_MAY_NAY}`, "-T", `${cfg.M5_NGUOI_DUNG}@${cfg.M5_DIA_CHI}`, `/bin/bash -c ${sh1(lenh)}`],
    { input: input ?? "", encoding: "utf8", timeout: 60000 });
  return { ma: r.status ?? 255, out: r.stdout ?? "", err: r.stderr ?? "" };
}
/** Lệnh qua KHOÁ ĐẨY, đúng đối số ssh của lệnh đẩy (lenhSsh) — `lenhCon` null = xin shell (không gửi lệnh). */
function quaKhoaDay(cfg, lenhCon, { input = "" } = {}) {
  const [cmd, args] = lenhSsh(cfg, lenhCon ?? "");
  const a = lenhCon == null ? args.slice(0, -1) : args;
  const r = spawnSync(cmd, a, { input, encoding: "utf8", timeout: 60000 });
  return { ma: r.status ?? 255, out: r.stdout ?? "", err: r.stderr ?? "" };
}

const sh1 = (s) => `'${String(s).replace(/'/g, "'\\''")}'`;
function docPub(cfg) { return readFileSync(`${cfg.KHOA_DAY}.pub`, "utf8").trim(); }

// ───────── cai / go ─────────

async function cai(cfg) {
  if (!existsSync(cfg.KHOA_DAY)) {
    const r = spawnSync("ssh-keygen", ["-q", "-t", "ed25519", "-N", "", "-C", GHI_CHU_KHOA, "-f", cfg.KHOA_DAY], { encoding: "utf8" });
    if (r.status !== 0) { console.error("cai: ssh-keygen lỗi"); return 1; }
    console.log("cai: đã tạo khoá đẩy (ed25519, không passphrase)");
  } else console.log("cai: khoá đẩy đã có — dùng lại");
  chmodSync(cfg.KHOA_DAY, 0o600);
  const pub = docPub(cfg);
  const blob = blobKhoa(pub);
  const fp = spawnSync("ssh-keygen", ["-lf", `${cfg.KHOA_DAY}.pub`], { encoding: "utf8" }).stdout.trim().split(/\s+/)[1];

  const nha = quaKhoaDung(cfg, 'printf "%s" "$HOME"');
  if (nha.ma !== 0 || !nha.out.startsWith("/")) { console.error(`cai: không vào được máy kia bằng khoá dựng máy (mã ${nha.ma})`); return nha.ma === 255 ? 3 : 1; }
  const duongNhan = `${nha.out}/${DUOI_NHAN}`;

  // 1. Bước nhận: ghi tạm rồi đổi tên, so sha256 hai đầu.
  const noiDung = readFileSync(NHAN_SH);
  const chep = quaKhoaDung(cfg, `set -e; mkdir -p "$HOME/.local/share/onehub"; f="$HOME/${DUOI_NHAN}"; cat > "$f.tam"; chmod 755 "$f.tam"; mv -f "$f.tam" "$f"; shasum -a 256 "$f" | cut -d' ' -f1`, { input: noiDung });
  const shaGoc = spawnSync("shasum", ["-a", "256", NHAN_SH], { encoding: "utf8" }).stdout.split(" ")[0];
  if (chep.ma !== 0 || chep.out.trim() !== shaGoc) { console.error("cai: chép bước nhận lỗi hay sha256 lệch"); return 1; }
  console.log(`cai: bước nhận ở ~/${DUOI_NHAN} trên máy kia (sha256 ${shaGoc.slice(0, 12)}… khớp)`);

  // 2. Vai máy của máy kia (bước nhận đọc để biết không phải máy thu).
  const vai = quaKhoaDung(cfg, `set -e; d="$HOME/.config/onehub"; f="$d/hai-may.env"; mkdir -p "$d"; if [ -f "$f" ]; then sed -n 's/^VAI=//p' "$f" | tail -1; else printf '%s\\n' '# Cấu hình riêng máy (HT25). KHÔNG vào kho.' 'VAI=may-phat-trien' > "$f"; chmod 600 "$f"; echo moi:may-phat-trien; fi`);
  if (vai.ma !== 0) { console.error("cai: không đọc/ghi được ~/.config/onehub/hai-may.env máy kia"); return 1; }
  const v = vai.out.trim().replace(/^moi:/, "");
  if (v !== "may-phat-trien") { console.error(`cai: máy kia mang vai «${v || "trống"}» — không cài (bước nhận chỉ chạy trên máy phát triển)`); return 1; }
  console.log(`cai: vai máy kia = may-phat-trien${vai.out.startsWith("moi:") ? " (vừa ghi ~/.config/onehub/hai-may.env)" : " (có sẵn)"}`);

  // 3. authorized_keys: sao lưu, thêm đúng một dòng (dòng có sẵn y hệt thì không đổi; có khoá ấy mà dòng khác thì dừng).
  const dong = dongKhoaDay(duongNhan, pub);
  if (kiemDongKhoa(dong).length) { console.error("cai: dòng dựng ra sai khuôn"); return 1; }
  const ak = quaKhoaDung(cfg, `set -e; f="$HOME/.ssh/authorized_keys"; IFS= read -r dong; n=$(grep -c -F ${sh1(blob)} "$f" || true);
    if [ "$n" = "0" ]; then bk="$f.bak-bcm-$(date +%Y%m%dT%H%M%S)"; cp -p "$f" "$bk"; [ -z "$(tail -c1 "$f")" ] || echo >> "$f"; printf '%s\\n' "$dong" >> "$f"; echo "them $bk";
    elif grep -qxF "$dong" "$f"; then echo "co-san"; else echo "khac"; fi; wc -l < "$f"`, { input: `${dong}\n` });
  const [kq, soDong] = ak.out.trim().split("\n");
  if (ak.ma !== 0 || !kq) { console.error("cai: sửa authorized_keys máy kia lỗi"); return 1; }
  if (kq === "khac") { console.error("cai: authorized_keys máy kia đã có khoá đẩy với dòng khác — chạy `go` rồi `cai` lại"); return 1; }
  console.log(kq === "co-san" ? "cai: dòng khoá đẩy đã có sẵn đúng khuôn — không đổi" : `cai: đã thêm một dòng restrict,command= cho khoá đẩy (${fp}); sao lưu ${kq.split(" ")[1].replace(nha.out, "~")}; tệp còn ${soDong.trim()} dòng`);

  // 4. Thử ngay: khoá đẩy hỏi trạng thái.
  const tt = quaKhoaDay(cfg, "trang-thai");
  console.log(`cai: khoá đẩy gọi trang-thai → mã ${tt.ma}`);
  for (const l of (tt.out + tt.err).trim().split("\n")) console.log(`  ${l}`);
  return tt.ma === 0 ? 0 : 1;
}

function go(cfg) {
  if (!existsSync(`${cfg.KHOA_DAY}.pub`)) { console.error("go: không có khoá công khai của khoá đẩy để biết dòng nào cần gỡ"); return 1; }
  const blob = blobKhoa(docPub(cfg));
  const r = quaKhoaDung(cfg, `set -e; f="$HOME/.ssh/authorized_keys"; n=$(grep -c -F ${sh1(blob)} "$f" || true);
    if [ "$n" = "0" ]; then echo "khong-co"; wc -l < "$f"; exit 0; fi
    bk="$f.bak-bcm-go-$(date +%Y%m%dT%H%M%S)"; cp -p "$f" "$bk"; grep -v -F ${sh1(blob)} "$f" > "$f.tam" || true; chmod 600 "$f.tam"; mv -f "$f.tam" "$f";
    echo "go $n $bk"; wc -l < "$f"`);
  if (r.ma !== 0) { console.error(`go: sửa authorized_keys máy kia lỗi (mã ${r.ma})`); return 1; }
  const [kq, soDong] = r.out.trim().split("\n");
  if (kq === "khong-co") { console.log(`go: authorized_keys máy kia không có dòng khoá đẩy — không đổi (${soDong.trim()} dòng)`); return 0; }
  const [, n, bk] = kq.split(" ");
  console.log(`go: đã gỡ ${n} dòng khoá đẩy; sao lưu ${bk.replace(/^\/Users\/[^/]+/, "~")}; tệp còn ${soDong.trim()} dòng`);
  const tt = quaKhoaDay(cfg, "trang-thai");
  console.log(`go: khoá đẩy gọi trang-thai sau khi gỡ → mã ${tt.ma} (${tt.ma === 255 ? "bị từ chối xác thực — đã thu hồi" : "CÒN VÀO ĐƯỢC"})`);
  return tt.ma === 255 ? 0 : 1;
}

// ───────── khoa (E3) ─────────

const congTrong = () => new Promise((resolve, reject) => {
  const s = net.createServer();
  s.on("error", reject);
  s.listen(0, "127.0.0.1", () => { const { port } = s.address(); s.close(() => resolve(port)); });
});
/** Đọc tối đa `ms` từ một cổng local; trả chuỗi đọc được. */
const docCong = (port, ms) => new Promise((resolve) => {
  let buf = "";
  const c = net.connect(port, "127.0.0.1");
  c.on("data", (b) => { buf += b.toString("latin1"); });
  c.on("error", () => resolve(buf));
  c.on("close", () => resolve(buf));
  setTimeout(() => { c.destroy(); resolve(buf); }, ms);
});

async function khoa(cfg) {
  const ket = [];
  const dat = (ten, ok, chi = "") => { ket.push(ok); console.log(`${ok ? "ĐẠT" : "KHÔNG ĐẠT"} ${ten}${chi ? ` — ${chi}` : ""}`); };
  const X = "/tmp/x";
  const truoc = quaKhoaDung(cfg, `test -e ${X} && echo co || echo khong`);
  if (truoc.ma !== 0) { console.error("khoa: khoá dựng máy không vào được máy kia"); return truoc.ma === 255 ? 3 : 1; }
  if (truoc.out.trim() !== "khong") { console.error(`khoa: ${X} đã có trên máy kia từ trước — không phân biệt được, dừng`); return 1; }

  // Dòng authorized_keys của khoá đẩy.
  const blob = blobKhoa(docPub(cfg));
  const ak = quaKhoaDung(cfg, `grep -F ${sh1(blob)} "$HOME/.ssh/authorized_keys" || true`);
  const dongs = ak.out.trim().split("\n").filter(Boolean);
  dat("authorized_keys có đúng một dòng cho khoá đẩy", dongs.length === 1, `${dongs.length} dòng`);
  const loiDong = dongs.length ? kiemDongKhoa(dongs[0]) : ["không có dòng"];
  dat("dòng khoá đẩy có restrict và command= trỏ nhan-ban-chep.sh", loiDong.length === 0, loiDong.join("; "));
  // Chiều đỏ: bản sao tạm của dòng, bỏ restrict → phép kiểm phải nêu «restrict».
  const saoThieu = (dongs[0] ?? "").replace(/(^|,)restrict(?=,|\s)/, "$1").replace(/^,/, "");
  const loiDo = kiemDongKhoa(saoThieu);
  dat("chiều đỏ: bản sao dòng thiếu restrict → phép kiểm nêu «restrict»", loiDo.some((l) => l.includes("«restrict»")), loiDo[0] ?? "không nêu gì");

  // Lệnh ssh của lệnh đẩy không bao giờ mang khoá dựng máy.
  const [, a] = lenhSsh(cfg, "trang-thai");
  dat("lệnh đẩy chỉ nạp khoá đẩy (IdentitiesOnly, IdentityAgent=none, -F /dev/null, không khoá dựng máy)",
    a.includes(cfg.KHOA_DAY) && !a.includes(cfg.KHOA_DUNG) && a.includes("IdentitiesOnly=yes") && a.includes("IdentityAgent=none") && a.includes("/dev/null"));

  const tuChoi = (ten, r) => {
    const tron = r.out + r.err;
    dat(ten, r.ma !== 0 && !/uid=/.test(tron), `mã ${r.ma}${/uid=/.test(tron) ? ", ĐẦU RA CÓ uid=" : ""}; ${tron.trim().split("\n").pop()?.slice(0, 140) ?? ""}`);
  };
  tuChoi("xin shell tương tác (không lệnh) bị từ chối", quaKhoaDay(cfg, null, { input: "id\n" }));
  tuChoi("`ssh … sh` bị từ chối", quaKhoaDay(cfg, "sh", { input: "id\n" }));
  tuChoi("`ssh … ls /` bị từ chối", quaKhoaDay(cfg, "ls /"));
  tuChoi("`ssh … 'trang-thai; id'` bị từ chối", quaKhoaDay(cfg, "trang-thai; id"));
  tuChoi("`ssh … 'nhan $(id)'` bị từ chối", quaKhoaDay(cfg, "nhan $(id)"));

  // scp (giao thức sftp mặc định và scp cũ -O) và sftp: tạo /tmp/x.
  const tam = mkdtempSync(path.join(os.tmpdir(), "bcm-khoa-"));
  const tep = path.join(tam, "x");
  writeFileSync(tep, "bcm\n");
  const goc = ["-F", "/dev/null", "-i", cfg.KHOA_DAY, "-o", "IdentitiesOnly=yes", "-o", "IdentityAgent=none", "-o", "BatchMode=yes",
    "-o", "ConnectTimeout=10", "-o", `BindAddress=${cfg.CAU_MAY_NAY}`];
  const dich = `${cfg.M5_NGUOI_DUNG}@${cfg.M5_DIA_CHI}`;
  const chay = (cmd, args, input = "") => { const r = spawnSync(cmd, args, { input, encoding: "utf8", timeout: 60000 }); return { ma: r.status ?? 255, out: r.stdout ?? "", err: r.stderr ?? "" }; };
  tuChoi("scp (sftp) tới /tmp/x bị từ chối", chay("scp", [...goc, tep, `${dich}:${X}`]));
  tuChoi("scp -O (giao thức cũ) tới /tmp/x bị từ chối", chay("scp", ["-O", ...goc, tep, `${dich}:${X}`]));
  const lo = path.join(tam, "lo");
  writeFileSync(lo, `put ${tep} ${X}\n`);
  tuChoi("sftp put /tmp/x bị từ chối", chay("sftp", [...goc, "-b", lo, dich]));

  // Chuyển cổng: -L tới cổng ssh của chính máy kia; đi qua được thì đọc thấy lời chào «SSH-».
  const port = await congTrong();
  const fw = spawn("ssh", [...goc, "-N", "-o", "ExitOnForwardFailure=yes", "-L", `127.0.0.1:${port}:127.0.0.1:22`, dich], { stdio: ["ignore", "ignore", "pipe"] });
  let fwErr = "";
  fw.stderr.on("data", (b) => { fwErr += b; });
  await new Promise((r) => setTimeout(r, 2500));
  const chao = await docCong(port, 3000);
  fw.kill();
  dat("ssh -L chuyển cổng bị chặn (không đọc được lời chào SSH qua đường hầm)", !chao.startsWith("SSH-"), chao ? `đọc được ${chao.length} byte` : `${fwErr.trim().split("\n").pop() ?? "không có dữ liệu"}`);
  rmSync(tam, { recursive: true, force: true });

  const sau = quaKhoaDung(cfg, `test -e ${X} && echo co || echo khong`);
  dat(`${X} không được tạo trên máy kia`, sau.out.trim() === "khong");

  const tt = quaKhoaDay(cfg, "trang-thai");
  dat("`ssh … trang-thai` qua khoá đẩy trả trạng thái", tt.ma === 0 && /: /.test(tt.out), `mã ${tt.ma}`);
  for (const l of tt.out.trim().split("\n")) console.log(`  ${l}`);
  const ok = ket.every(Boolean);
  console.log(ok ? `khoa: ĐẠT ${ket.length}/${ket.length}` : `khoa: KHÔNG ĐẠT ${ket.filter((x) => !x).length}/${ket.length}`);
  return ok ? 0 : 1;
}

// ───────── mot-chieu (E4) ─────────

function motChieu(cfg) {
  const ket = [];
  const dat = (ten, ok, chi = "") => { ket.push(ok); console.log(`${ok ? "ĐẠT" : "KHÔNG ĐẠT"} ${ten}${chi ? ` — ${chi}` : ""}`); };
  const akMayNay = path.join(NHA, ".ssh", "authorized_keys");
  const ak = existsSync(akMayNay) ? readFileSync(akMayNay, "utf8") : "";
  const pub = quaKhoaDung(cfg, 'for f in "$HOME"/.ssh/*.pub /etc/ssh/ssh_host_*_key.pub; do [ -f "$f" ] && cat "$f"; done; for f in "$HOME"/.ssh/id_*; do case "$f" in *.pub) ;; *) [ -f "$f" ] && ssh-keygen -y -P "" -f "$f" 2>/dev/null;; esac; done; true');
  if (pub.ma !== 0) { console.error("mot-chieu: khoá dựng máy không vào được máy kia"); return pub.ma === 255 ? 3 : 1; }
  const soPub = pub.out.split("\n").map(blobKhoa).filter(Boolean).length;
  const trung = khoaNguoc(ak, pub.out);
  dat("authorized_keys máy thu không chứa khoá công khai nào sinh trên máy kia", trung.length === 0,
    `${ak ? ak.split("\n").filter((l) => blobKhoa(l)).length : 0} khoá trong authorized_keys máy thu (${existsSync(akMayNay) ? "có tệp" : "không có tệp"}), so với ${soPub} khoá của máy kia (~/.ssh/*.pub, khoá máy chủ, khoá riêng không passphrase)`);
  // Chiều đỏ: bản sao tạm của authorized_keys máy thu có thêm một khoá của máy kia → phép so phải bắt.
  const motPub = pub.out.split("\n").find((l) => blobKhoa(l));
  if (motPub) dat("chiều đỏ: cấy một khoá máy kia vào bản sao authorized_keys → phép so bắt được", khoaNguoc(`${ak}\n${motPub}`, pub.out).length === 1);

  const src = readFileSync(path.join(REPO, "scripts", "day-ban-chep.mjs"), "utf8");
  const [cmd, a] = lenhSsh(cfg, "trang-thai");
  dat("lệnh đẩy chỉ có một chỗ gọi ssh, không scp/sftp/rsync", (src.match(/"ssh"/g) ?? []).length === 1 && !/"(scp|sftp|rsync)"/.test(src));
  dat("đích duy nhất của lời gọi ssh là máy phát triển qua địa chỉ cầu", cmd === "ssh" && a.filter((x) => x.includes("@")).length === 1 && a.includes(`${cfg.M5_NGUOI_DUNG}@${cfg.M5_DIA_CHI}`));
  const nhan = readFileSync(NHAN_SH, "utf8").split("\n").filter((l) => !/^\s*#/.test(l));
  const goiRa = nhan.filter((l) => /(^|[\s;|&(])(ssh|scp|sftp|rsync|curl|wget|nc)\s/.test(l));
  dat("bước nhận không mở kết nối nào ra ngoài (không ssh/scp/curl… về máy thu)", goiRa.length === 0, goiRa.join(" | ").slice(0, 200));
  const ok = ket.every(Boolean);
  console.log(ok ? `mot-chieu: ĐẠT ${ket.length}/${ket.length}` : "mot-chieu: KHÔNG ĐẠT");
  return ok ? 0 : 1;
}

// ───────── lich (E8) ─────────

const LENH_LICH = `launchctl list 2>/dev/null; echo "--crontab--"; crontab -l 2>/dev/null; echo "--plist--";
  for f in "$HOME"/Library/LaunchAgents/*.plist /Library/LaunchAgents/*.plist /Library/LaunchDaemons/*.plist; do
    [ -f "$f" ] && grep -l -E 'day-ban-chep|nhan-ban-chep' "$f" 2>/dev/null; done; true`;

function lich(cfg) {
  const ket = [];
  const dat = (ten, ok, chi = "") => { ket.push(ok); console.log(`${ok ? "ĐẠT" : "KHÔNG ĐẠT"} ${ten}${chi ? ` — ${chi}` : ""}`); };
  const may = spawnSync("bash", ["-c", LENH_LICH], { encoding: "utf8" });
  const hitMay = dongNhacLenh(may.stdout);
  dat("máy thu: launchctl, crontab, plist không có mục day-ban-chep/nhan-ban-chep", may.status === 0 && hitMay.length === 0,
    `${may.stdout.split("--crontab--")[0].split("\n").length - 2} mục launchctl soát${hitMay.length ? `; trúng: ${hitMay.join(" | ")}` : ""}`);
  const kia = quaKhoaDung(cfg, LENH_LICH);
  if (kia.ma !== 0) { console.error("lich: khoá dựng máy không vào được máy kia"); return kia.ma === 255 ? 3 : 1; }
  const hitKia = dongNhacLenh(kia.out);
  dat("máy phát triển: launchctl, crontab, plist không có mục day-ban-chep/nhan-ban-chep", hitKia.length === 0,
    `${kia.out.split("--crontab--")[0].split("\n").length - 2} mục launchctl soát${hitKia.length ? `; trúng: ${hitKia.join(" | ")}` : ""}`);
  const plist = spawnSync("git", ["-C", REPO, "ls-files", "*.plist"], { encoding: "utf8" }).stdout.split("\n").filter(Boolean);
  const plistTrung = plist.filter((f) => TEN_LENH.test(f) || TEN_LENH.test(readFileSync(path.join(REPO, f), "utf8")));
  dat("kho không có plist cho day-ban-chep/nhan-ban-chep", plistTrung.length === 0, `${plist.length} plist trong kho${plistTrung.length ? `; trúng: ${plistTrung.join(", ")}` : ""}`);
  // Chiều đỏ: một dòng launchctl giả mang tên lệnh → bộ lọc phải bắt.
  dat("chiều đỏ: dòng launchctl giả «-\\t0\\tcom.onehub.day-ban-chep» → bộ lọc bắt được", dongNhacLenh(`PID\tStatus\tLabel\n-\t0\tcom.onehub.day-ban-chep`).length === 1);
  const ok = ket.every(Boolean);
  console.log(ok ? `lich: ĐẠT ${ket.length}/${ket.length}` : "lich: KHÔNG ĐẠT");
  return ok ? 0 : 1;
}

// ───────── that (E10) — chỉ trong lượt chấm ─────────

async function that(cfg) {
  const t0 = Date.now();
  // 1. Lượt đẩy thật (DB máy thu chỉ đọc qua HT18), cùng lệnh người gọi.
  const day = spawnSync(process.execPath, [path.join(REPO, "scripts", "day-ban-chep.mjs")], { stdio: "inherit", timeout: 3600_000 });
  if (day.status !== 0) { console.error(`that: lượt đẩy không xanh (mã ${day.status})`); return 1; }
  const ke = JSON.parse(readFileSync(path.join(REPO, "state", "day-ban-chep", "gui", "ke.json"), "utf8"));
  const ket = [];
  const dat = (ten, ok, chi = "") => { ket.push(ok); console.log(`${ok ? "ĐẠT" : "KHÔNG ĐẠT"} ${ten}${chi ? ` — ${chi}` : ""}`); };
  // 2. Số dòng DB chạy trên máy kia = ke.json (đọc qua khoá dựng máy, docker exec — cổng 5433 máy kia không ổn định).
  const bang = Object.keys(ke.so_dong);
  const sql = `SELECT x.t || ' ' || (xpath('/row/n/text()', query_to_xml(format('SELECT count(*) AS n FROM public.%I', x.t), false, true, '')))[1]::text FROM unnest(ARRAY[${bang.map((t) => `'${t}'`).join(",")}]) x(t)`;
  const dem = quaKhoaDung(cfg, `PATH=/opt/homebrew/bin:/usr/local/bin:$PATH docker exec -i -e PGPASSWORD=oneinvest -e "PGOPTIONS=-c default_transaction_read_only=on" one-invest-db psql -U oneinvest -h localhost -At -d oneinvest`, { input: `${sql};\n` });
  const thuc = Object.fromEntries(dem.out.trim().split("\n").filter(Boolean).map((l) => { const [t, n] = l.split(" "); return [t, Number(n)]; }));
  const lech = bang.filter((t) => thuc[t] !== ke.so_dong[t]);
  dat("số dòng từng bảng của DB chạy trên máy kia = ke.json", dem.ma === 0 && lech.length === 0, lech.length ? `lệch: ${lech.join(", ")}` : `${bang.length} bảng`);
  // 3. Invest /vn/hanoi và data-api /v1/listings trên máy kia (gọi 127.0.0.1 của máy kia qua khoá dựng máy).
  const congApp = cfg.M5_CONG_APP ?? "3456";
  const congApi = cfg.M5_CONG_API ?? "3001";
  const app = quaKhoaDung(cfg, `curl -s -m 60 http://127.0.0.1:${congApp}/vn/hanoi | grep -o -E '[0-9][0-9.,]* listing' | head -1`);
  const soListing = Number((app.out.match(/[0-9][0-9.,]*/)?.[0] ?? "0").replace(/[.,]/g, ""));
  dat(`Invest /vn/hanoi trên máy kia (cổng ${congApp}, app chạy RENAME_REFCALIB=1) có «<số> listing» > 0`, soListing > 0, app.out.trim() || "không đọc được");
  const api = quaKhoaDung(cfg, `curl -s -m 60 -w '\\n%{http_code}' 'http://127.0.0.1:${congApi}/v1/listings?limit=50'`);
  const dongApi = api.out.trim().split("\n");
  const ma = dongApi.pop();
  let n = 0;
  try { n = JSON.parse(dongApi.join("\n"))?.data?.length ?? 0; } catch { /* không phải JSON */ }
  dat(`data-api /v1/listings trên máy kia (cổng ${congApi}) trả 200 và > 0 dòng`, ma === "200" && n > 0, `HTTP ${ma}, ${n} dòng`);
  console.log(`that: tổng ${Math.round((Date.now() - t0) / 1000)}s (thời gian từng chặng in ở trên và trong state/day-ban-chep/so.jsonl)`);
  const ok = ket.every(Boolean);
  console.log(ok ? `that: ĐẠT ${ket.length}/${ket.length}` : "that: KHÔNG ĐẠT");
  return ok ? 0 : 1;
}

// ───────── tai-lieu (E11) ─────────

/** Giá trị riêng máy cần vắng khỏi kho: tên máy, địa chỉ cầu hai máy, tên tệp khoá dựng máy và khoá đẩy. */
export function giaTriRieng(cfg) {
  return [cfg.M5_TEN_MAY, cfg.M5_DIA_CHI, cfg.CAU_MAY_NAY, cfg.KHOA_DUNG && path.basename(cfg.KHOA_DUNG), cfg.KHOA_DAY && path.basename(cfg.KHOA_DAY)]
    .filter((x) => x && String(x).length >= 4);
}
/** git grep giá trị riêng máy trên toàn kho (tệp theo dõi, đã git add, chưa theo dõi mà không bị .gitignore bỏ). Danh sách loại trừ: RỖNG. Trả [tệp]. */
export function grepRieng(giaTri, { cwd = REPO } = {}) {
  const args = ["-C", cwd, "grep", "--untracked", "-l", "-I", "-w", "-F"];
  for (const v of giaTri) args.push("-e", v);
  const r = spawnSync("git", args, { encoding: "utf8" });
  return r.status === 0 ? r.stdout.split("\n").filter(Boolean) : [];
}

function taiLieu(cfg) {
  const ket = [];
  const dat = (ten, ok, chi = "") => { ket.push(ok); console.log(`${ok ? "ĐẠT" : "KHÔNG ĐẠT"} ${ten}${chi ? ` — ${chi}` : ""}`); };
  const doc = (f) => (existsSync(path.join(REPO, f)) ? readFileSync(path.join(REPO, f), "utf8") : "");
  const adr = readdirSync(path.join(REPO, "docs", "adr")).find((f) => /^0019.*\.md$/.test(f));
  const adrTxt = adr ? doc(`docs/adr/${adr}`) : "";
  const rao = ["cổng rời máy", "một chiều", "từ điển", "lùi", "chỉ theo lệnh"];
  const thieuRao = rao.filter((r) => !adrTxt.toLowerCase().includes(r));
  dat("ADR-0019 có, nêu năm rào và lối đã bỏ", !!adr && thieuRao.length === 0 && /lối đã bỏ/i.test(adrTxt), adr ? (thieuRao.length ? `thiếu: ${thieuRao.join(", ")}` : adr) : "không có tệp");
  const agents = doc("AGENTS.md");
  const muc = /^## Hai máy[\s\S]*?(?=^## |$(?![\s\S]))/m.exec(agents)?.[0] ?? "";
  dat("AGENTS.md có mục «Hai máy» trỏ docs/ops/hai-may.md", muc.includes("docs/ops/hai-may.md"));
  const ops = doc("docs/ops/hai-may.md");
  dat("docs/ops/hai-may.md nêu lệnh đẩy, kiểm sau, lùi, thu hồi khoá, rút cáp", ["day-ban-chep.mjs", "--trang-thai", "--lui", "go", "cáp"].every((k) => ops.includes(k)));
  dat("runtime-map trỏ hai-may.md", doc("docs/ops/runtime-map.md").includes("hai-may.md"));
  const roadmap = doc("docs/ROADMAP.md");
  const m64 = /^\s*64\.\s[\s\S]*?(?=^\s*65\.\s|^## |$(?![\s\S]))/m.exec(roadmap)?.[0] ?? "";
  dat("ROADMAP §3 mục 64 nêu lệnh đẩy", m64.includes("day-ban-chep"), m64 ? "" : "không có mục 64");

  const gt = giaTriRieng(cfg);
  console.log(`soát giá trị riêng máy: ${gt.length} giá trị đọc từ cấu hình riêng máy (không in); danh sách loại trừ: (rỗng)`);
  const trung = grepRieng(gt);
  dat("toàn kho (git grep, tệp theo dõi + đã add) không chứa tên máy, địa chỉ cầu, tên tệp khoá", trung.length === 0, trung.join(", "));
  // Chiều đỏ: cấy tên máy vào một tệp tạm đã git add → phép soát phải nêu đúng tệp; gỡ khỏi chỉ mục và xoá ngay.
  const tepCay = `.bcm-cay-${process.pid}.txt`;
  writeFileSync(path.join(REPO, tepCay), `x ${gt[0]} y\n`);
  let trungCay = [];
  try {
    spawnSync("git", ["-C", REPO, "add", "-f", "--", tepCay]);
    trungCay = grepRieng(gt);
  } finally {
    spawnSync("git", ["-C", REPO, "rm", "-q", "--cached", "-f", "--", tepCay]);
    rmSync(path.join(REPO, tepCay), { force: true });
  }
  dat("chiều đỏ: cấy tên máy vào tệp tạm đã git add → phép soát nêu tệp", trungCay.includes(tepCay), trungCay.join(", "));
  const ok = ket.every(Boolean);
  console.log(ok ? `tai-lieu: ĐẠT ${ket.length}/${ket.length}` : "tai-lieu: KHÔNG ĐẠT");
  return ok ? 0 : 1;
}

// ───────── CLI ─────────

const LENH = { cai, go, khoa, "mot-chieu": motChieu, lich, that, "tai-lieu": taiLieu };

async function main() {
  const lenh = process.argv[2];
  if (!LENH[lenh] || process.argv.length > 3) { console.error(`dùng: day-ban-chep-kiem-m5.mjs <${Object.keys(LENH).join("|")}>`); return 2; }
  const { cfg, loi } = cauHinh({ canDung: lenh !== "tai-lieu" });
  if (loi) { console.error(`day-ban-chep-kiem-m5: ${loi}`); return 2; }
  if (lenh !== "tai-lieu") {
    const cau = kiemCau(cfg);
    if (cau) { console.error(`ĐỎ ${cau}`); return 3; }
  }
  if (["khoa", "go"].includes(lenh) && !existsSync(`${cfg.KHOA_DAY}.pub`)) { console.error(`${lenh}: chưa có khoá đẩy — chạy \`cai\` trước`); return 1; }
  return LENH[lenh](cfg);
}

if (process.argv[1] && realpathSync(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().then((m) => { process.exitCode = m; }).catch((e) => { console.error(`day-ban-chep-kiem-m5: lỗi — ${String(e?.message ?? e).slice(0, 300)}`); process.exit(1); });
}
