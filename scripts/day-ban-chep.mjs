#!/usr/bin/env node
// day-ban-chep.mjs — đẩy bản chép đã lọc từ máy thu sang máy phát triển qua cầu Thunderbolt (HT25 `day-ban-chep-sang-may-phat-trien`,
// ADR-0019, vận hành: docs/ops/hai-may.md). Chạy trên MÁY THU, chỉ khi người gọi (không plist, không cron — AC-8).
//
//   node scripts/day-ban-chep.mjs                 chép + soát (HT18) → ghim sha256 → gửi qua cầu → bước nhận nạp nguyên tử trên máy kia
//   node scripts/day-ban-chep.mjs --trang-thai    hỏi bước nhận: DB chạy, bản cũ, bản chép đang chạy
//   node scripts/day-ban-chep.mjs --lui           bước nhận đổi bản cũ thành DB chạy (gọi lại là đổi về)
//
// Năm rào (GS 25/11): (1) cổng rời máy ở đây — bộ soát HT18 xanh trên CHÍNH tệp sắp gửi, băm tệp gửi = băm ghi lúc soát; (2) một
// chiều — khoá đẩy chỉ chạy bước nhận (`restrict,command=` trên máy kia), lệnh này chỉ nạp khoá đẩy (IdentitiesOnly, không agent,
// bỏ ~/.ssh/config), tệp đi qua stdin của lệnh con `nhan`; (3) chỉ đúng hai tệp (dump, ke.json) rời máy; (4) bước nhận lùi được;
// (5) chỉ theo lệnh.
// Cấu hình riêng máy (KHÔNG vào kho công khai): ~/.config/onehub/hai-may.env — VAI, CAU_GIAO_DIEN, CAU_MAY_NAY, M5_DIA_CHI,
// M5_NGUOI_DUNG, KHOA_DAY. Địa chỉ đích phải nằm trên giao diện cầu (route get); không thì dừng nêu «cầu Thunderbolt», không thử
// đường khác. Sổ: state/day-ban-chep/so.jsonl (gitignored).
// Mã thoát: 0 xanh · 1 đỏ (không gửi, hoặc bước nhận đỏ — DB chạy bên kia giữ nguyên) · 2 đối số/cấu hình sai · 3 cầu không thông.
import { spawn, execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { appendFileSync, createReadStream, existsSync, lstatSync, mkdirSync, readFileSync, readdirSync, realpathSync, statSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
export const NHAN_SH = path.join(REPO, "scripts", "nhan-ban-chep.sh");
export const RA_GUI = path.join(REPO, "state", "day-ban-chep", "gui");
export const SO = path.join(REPO, "state", "day-ban-chep", "so.jsonl");
// Thư mục nhà theo passwd (không theo $HOME): cấu hình riêng máy không bị đổi bằng biến môi trường.
export const NHA = os.userInfo().homedir;
export const CAU_HINH = path.join(NHA, ".config", "onehub", "hai-may.env");

export const TEP_DUMP_RE = /^oneinvest-m5-[0-9]{8}\.dump$/;
const IPV4_RE = /^(25[0-5]|2[0-4]\d|1?\d?\d)(\.(25[0-5]|2[0-4]\d|1?\d?\d)){3}$/;
const KHOA_CAN = ["CAU_GIAO_DIEN", "CAU_MAY_NAY", "M5_DIA_CHI", "M5_NGUOI_DUNG", "KHOA_DAY"];

/** Đọc hai-may.env (KEY=VALUE, bỏ chú thích, `$HOME`/`~` → thư mục nhà). Không thực thi tệp. Trả { cfg } hoặc { loi }. */
export function docCauHinh(tep = CAU_HINH, { nha = NHA } = {}) {
  if (!existsSync(tep)) return { loi: "thiếu cấu hình riêng máy ~/.config/onehub/hai-may.env" };
  const cfg = {};
  for (const dong of readFileSync(tep, "utf8").split("\n")) {
    const m = /^\s*([A-Z0-9_]+)=(.*)$/.exec(dong);
    if (!m) continue;
    let v = m[2].trim().replace(/^["']|["']$/g, "");
    v = v.replace(/^\$\{?HOME\}?(?=\/|$)/, nha).replace(/^~(?=\/|$)/, nha);
    cfg[m[1]] = v;
  }
  return { cfg };
}

/** Kiểm đủ khoá cho lượt đẩy. null khi đủ, chuỗi lý do khi thiếu/sai khuôn. */
export function loiCauHinhDay(cfg) {
  const thieu = KHOA_CAN.filter((k) => !cfg?.[k]);
  if (thieu.length) return `cấu hình riêng máy thiếu ${thieu.join(", ")}`;
  if (!IPV4_RE.test(cfg.M5_DIA_CHI)) return "M5_DIA_CHI phải là địa chỉ IPv4 cố định của cầu (không tên máy, không DNS)";
  if (!IPV4_RE.test(cfg.CAU_MAY_NAY)) return "CAU_MAY_NAY phải là địa chỉ IPv4 của máy này trên cầu";
  if (!/^[a-z0-9]+$/.test(cfg.CAU_GIAO_DIEN)) return "CAU_GIAO_DIEN lạ";
  if (!/^[a-z_][a-z0-9_-]*$/.test(cfg.M5_NGUOI_DUNG)) return "M5_NGUOI_DUNG lạ";
  if (cfg.KHOA_DUNG && path.resolve(cfg.KHOA_DAY) === path.resolve(cfg.KHOA_DUNG)) return "KHOA_DAY không được là khoá dựng máy";
  return null;
}

/** Giao diện mạng mà máy này dùng để tới địa chỉ (macOS `route -n get`, Linux `ip route get`). null khi không biết. */
export function giaoDienCua(diaChi, { chay = execFileSync } = {}) {
  const thu = [["route", ["-n", "get", diaChi], /interface:\s*(\S+)/], ["ip", ["route", "get", diaChi], /\bdev\s+(\S+)/]];
  for (const [cmd, args, re] of thu) {
    try {
      const m = re.exec(chay(cmd, args, { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"], timeout: 5000 }));
      if (m) return m[1];
    } catch { /* lệnh không có hay địa chỉ không tới được */ }
  }
  return null;
}

/** null khi địa chỉ đích nằm trên giao diện cầu; chuỗi lỗi nêu «cầu Thunderbolt» khi không. Không có đường dự phòng. */
export function kiemCau(cfg, { giaoDien = giaoDienCua } = {}) {
  const gd = giaoDien(cfg.M5_DIA_CHI);
  if (gd === cfg.CAU_GIAO_DIEN) return null;
  return `cầu Thunderbolt không thông: địa chỉ đích không nằm trên giao diện ${cfg.CAU_GIAO_DIEN} (route trả ${gd ?? "không có đường"}) — cắm lại cáp rồi chạy lại; không gửi qua mạng khác`;
}

/** Lời gọi ssh DUY NHẤT của lệnh này: đích là máy phát triển qua địa chỉ cầu, chỉ khoá đẩy. */
export function lenhSsh(cfg, lenhCon) {
  return ["ssh", [
    "-F", "/dev/null", // bỏ ~/.ssh/config (không IdentityFile, ProxyJump, Host… nào khác)
    "-i", cfg.KHOA_DAY,
    "-o", "IdentitiesOnly=yes", "-o", "IdentityAgent=none", "-o", "BatchMode=yes",
    "-o", "PasswordAuthentication=no", "-o", "KbdInteractiveAuthentication=no",
    "-o", "ClearAllForwardings=yes", "-o", "ForwardAgent=no", "-o", "ForwardX11=no",
    "-o", "ConnectTimeout=10", "-o", "ServerAliveInterval=15", "-o", "ServerAliveCountMax=4",
    "-o", `BindAddress=${cfg.CAU_MAY_NAY}`,
    "-T", `${cfg.M5_NGUOI_DUNG}@${cfg.M5_DIA_CHI}`, lenhCon,
  ]];
}

/** Vì sao một tệp không được rời máy (để thông điệp nêu rõ). */
function lyDoCam(rel) {
  if (/(^|\/)\.env/.test(rel)) return ".env";
  if (/(^|\/)snapshots?(\/|$)/.test(rel) || /raw/.test(rel)) return "raw snapshot";
  if (/tu-dien|tu_dien|source.?name|real.?name|giai-ma|ma-nguon/i.test(rel)) return "từ điển nguồn";
  return "ngoài danh sách cho phép";
}

/** Danh sách tệp gửi: ĐÚNG hai tệp thường (dump của ke.json, ke.json) trong thư mục gửi; mục nào khác → từ chối nêu tệp. */
export function danhSachGui(ra, ke) {
  if (!ke || typeof ke.tep !== "string" || !TEP_DUMP_RE.test(ke.tep)) return { loi: "ke.json không nêu tệp dump đúng khuôn" };
  const cho = new Set([ke.tep, "ke.json"]);
  const la = [];
  const duyet = (dir, tien) => {
    for (const d of readdirSync(dir, { withFileTypes: true })) {
      const rel = tien ? `${tien}/${d.name}` : d.name;
      if (d.isDirectory()) {
        const truoc = la.length;
        duyet(path.join(dir, d.name), rel);
        if (la.length === truoc) la.push(`${rel}/`);
      } else if (!(tien === "" && cho.has(d.name))) la.push(rel);
    }
  };
  duyet(ra, "");
  if (la.length) return { loi: `tệp «${la[0]}» (${lyDoCam(la[0])}) nằm ngoài danh sách cho phép (dump, ke.json) — không gửi`, la };
  const tep = [ke.tep, "ke.json"].map((f) => path.join(ra, f));
  for (const f of tep) {
    if (!existsSync(f)) return { loi: `thiếu tệp «${path.basename(f)}»` };
    const st = lstatSync(f);
    if (!st.isFile() || st.isSymbolicLink()) return { loi: `«${path.basename(f)}» không phải tệp thường — không gửi` };
  }
  return { tep };
}

export function sha256Tep(tep) {
  return new Promise((resolve, reject) => {
    const h = createHash("sha256");
    createReadStream(tep).on("data", (b) => h.update(b)).on("error", reject).on("end", () => resolve(h.digest("hex")));
  });
}

/** Chạy một lệnh con của bước nhận; stdin = đầu luồng + ke.json + dump khi có. Trả { ma }. */
function chayGui([cmd, args, env], { keTep, dumpTep, out, err }) {
  return new Promise((resolve) => {
    const p = spawn(cmd, args, { stdio: ["pipe", "pipe", "pipe"], ...(env ? { env } : {}) });
    const tach = (s, f) => { let du = ""; s.on("data", (b) => { const d = (du + b).split("\n"); du = d.pop(); for (const l of d) f(l); }); s.on("end", () => { if (du) f(du); }); };
    tach(p.stdout, (l) => out(`  nhận: ${l}`));
    tach(p.stderr, (l) => err(`  nhận: ${l}`));
    p.stdin.on("error", () => {});
    p.on("error", (e) => { err(`không chạy được ${cmd}: ${e.message}`); resolve({ ma: 127 }); });
    p.on("close", (ma) => resolve({ ma: ma ?? 1 }));
    if (!keTep) { p.stdin.end(); return; }
    const ke = readFileSync(keTep);
    p.stdin.write(`ke ${ke.length}\n`);
    p.stdin.write(ke);
    createReadStream(dumpTep).on("error", () => p.stdin.end()).pipe(p.stdin);
  });
}

/** Gửi qua ssh tới máy phát triển (đường thật). */
export const taoGuiSsh = (cfg) => ({ lenhCon, ...r }) => chayGui(lenhSsh(cfg, lenhCon), r);

/** CHỈ cho test: chạy cùng bước nhận ngay trên máy này, như sshd gọi qua command= (SSH_ORIGINAL_COMMAND). */
export const taoGuiCucBo = (env = {}) => ({ lenhCon, ...r }) =>
  chayGui(["bash", [NHAN_SH], { ...process.env, ...env, SSH_ORIGINAL_COMMAND: lenhCon }], r);

const giay = (t) => Math.round((Date.now() - t) / 100) / 10;

/**
 * Một lượt đẩy. `chep(ra)` dựng dump + ke.json trong `ra` và trả mã (đường thật: chayChep của HT18 — chép + soát trên DB đích).
 * `gui` mặc định taoGuiSsh(cfg). `sauChep(ra)` — móc của test (sửa tệp sau soát, cấy tệp lạ). Trả mã thoát.
 */
export async function dayBanChep({ cfg, ra = RA_GUI, chep, gui, giaoDien = giaoDienCua, sauChep, out = console.log, err = console.error,
  so = SO } = {}) {
  const t0 = Date.now();
  const chang = {};
  const ghiSo = (ma, them = {}) => {
    if (!so) return;
    try { mkdirSync(path.dirname(so), { recursive: true }); appendFileSync(so, `${JSON.stringify({ luc: new Date().toISOString(), ma, chang, ...them })}\n`); } catch { /* sổ là phụ */ }
  };
  const loiCfg = loiCauHinhDay(cfg);
  if (loiCfg) { err(`day-ban-chep: ${loiCfg}`); return 2; }

  let t = Date.now();
  const cau = kiemCau(cfg, { giaoDien });
  if (cau) { err(`ĐỎ ${cau}`); ghiSo(3, { do: "cau" }); return 3; }
  chang.cau = giay(t);

  t = Date.now();
  mkdirSync(ra, { recursive: true });
  const maChep = await chep(ra);
  chang.chep_soat = giay(t);
  if (maChep !== 0) { err(`ĐỎ chặng chép + soát (HT18): mã ${maChep} — không gửi`); ghiSo(1, { do: "chep_soat" }); return 1; }
  out(`chặng chép + soát: ${chang.chep_soat}s`);
  if (sauChep) await sauChep(ra);

  t = Date.now();
  const keTep = path.join(ra, "ke.json");
  if (!existsSync(keTep)) { err("ĐỎ ke.json: bản chép không để lại ke.json — không gửi"); ghiSo(1, { do: "ke" }); return 1; }
  // ke.json phải là của lượt này (bộ soát HT18 chỉ ghi ke.json khi xanh).
  if (statSync(keTep).mtimeMs < t0 - 1000) { err("ĐỎ ke.json: ke.json cũ hơn lượt này — không gửi"); ghiSo(1, { do: "ke" }); return 1; }
  let ke;
  try { ke = JSON.parse(readFileSync(keTep, "utf8")); } catch { err("ĐỎ ke.json: hỏng — không gửi"); ghiSo(1, { do: "ke" }); return 1; }
  const ds = danhSachGui(ra, ke);
  if (ds.loi) { err(`ĐỎ danh sách tệp: ${ds.loi}`); ghiSo(1, { do: "danh_sach" }); return 1; }
  const dumpTep = ds.tep[0];
  const sha = await sha256Tep(dumpTep);
  if (sha !== ke.sha256) {
    err("ĐỎ sha256: băm tệp dump sắp gửi khác băm ghi lúc soát (ke.json) — tệp bị sửa sau soát, không gửi");
    ghiSo(1, { do: "sha256" });
    return 1;
  }
  const coByte = statSync(dumpTep).size;
  chang.sha = giay(t);
  out(`chặng ghim sha256: ${chang.sha}s (sha256 ${sha.slice(0, 12)}…, ${coByte} byte, 2 tệp)`);

  const cau2 = kiemCau(cfg, { giaoDien });
  if (cau2) { err(`ĐỎ ${cau2}`); ghiSo(3, { do: "cau" }); return 3; }

  t = Date.now();
  const g = await (gui ?? taoGuiSsh(cfg))({ lenhCon: `nhan ${sha}`, keTep, dumpTep, out, err });
  chang.gui_nap = giay(t);
  const them = { sha256: sha.slice(0, 12), co_byte: coByte, ten_dich: ke.ten_dich };
  if (g.ma !== 0) {
    err(`ĐỎ chặng gửi/nhận: mã ${g.ma}${g.ma === 255 ? " (ssh không tới được máy phát triển qua cầu Thunderbolt)" : ""} — DB chạy bên nhận giữ nguyên`);
    ghiSo(1, { do: "gui_nap", ma_nhan: g.ma, ...them });
    return 1;
  }
  out(`chặng gửi + nạp: ${chang.gui_nap}s`);
  out(`xanh: đã đẩy ${ke.tep} (${coByte} byte) — tổng ${giay(t0)}s`);
  ghiSo(0, them);
  return 0;
}

export function docDoiSo(argv) {
  const a = { lenh: "day" };
  for (let i = 0; i < argv.length; i++) {
    const x = argv[i];
    if (x === "--trang-thai") a.lenh = "trang-thai";
    else if (x === "--lui") a.lenh = "lui";
    else if (x === "--ra") a.ra = argv[++i];
    else return { loi: `đối số lạ «${String(x).replace(/[^A-Za-z0-9_-]/g, "?")}»` };
  }
  return a;
}

async function main() {
  const a = docDoiSo(process.argv.slice(2));
  if (a.loi) { console.error(`day-ban-chep: ${a.loi}`); return 2; }
  const { cfg, loi } = docCauHinh();
  if (loi) { console.error(`day-ban-chep: ${loi}`); return 2; }
  const loiCfg = loiCauHinhDay(cfg);
  if (loiCfg) { console.error(`day-ban-chep: ${loiCfg}`); return 2; }
  if (cfg.VAI !== "may-thu") { console.error("day-ban-chep: chỉ chạy trên máy thu (VAI=may-thu trong hai-may.env)"); return 2; }
  if (a.lenh !== "day") {
    const cau = kiemCau(cfg);
    if (cau) { console.error(`ĐỎ ${cau}`); return 3; }
    const g = await taoGuiSsh(cfg)({ lenhCon: a.lenh, out: console.log, err: console.error });
    return g.ma;
  }
  const { chayChep, tenDich, xoaDb, NGUON_MAC_DINH } = await import("./ban-chep-da-loc.mjs");
  const nguonUrl = process.env.DATABASE_URL ?? NGUON_MAC_DINH;
  const dich = tenDich();
  // Ngắt giữa bước chép → xoá DB đích như lệnh HT18 tự làm.
  const ngat = async () => { await xoaDb(dich).catch(() => {}); process.exit(130); };
  process.once("SIGINT", ngat);
  process.once("SIGTERM", ngat);
  const ma = await dayBanChep({ cfg, ra: a.ra ? path.resolve(a.ra) : RA_GUI, chep: (ra) => chayChep({ nguonUrl, dich, ra }) });
  process.removeListener("SIGINT", ngat);
  process.removeListener("SIGTERM", ngat);
  return ma;
}

if (process.argv[1] && realpathSync(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().then((m) => { process.exitCode = m; }).catch((e) => {
    console.error(`day-ban-chep: lỗi — ${String(e?.message ?? e).slice(0, 300)}`);
    process.exit(1);
  });
}
