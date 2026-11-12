#!/usr/bin/env node
/**
 * sao-luu-ngoai-may.mjs — sao lưu máy thu ra một kho restic mã hoá trên máy (đích B2), thử khôi phục, cảnh báo quá hạn.
 * Hồ sơ `_acceptance/sao-luu-ma-hoa-b2/`, thiết kế `docs/superpowers/specs/2026-11-11-sao-luu-ma-hoa-b2-design.md`.
 *
 *   node scripts/lib/sao-luu-ngoai-may.mjs chay        lượt hằng ngày: dump DB → restic backup → forget 7/4/6 → trạng thái
 *   node scripts/lib/sao-luu-ngoai-may.mjs kiem        hằng tuần: restic check + khôi phục mẫu ≥50 tệp + bản dump, so sha256
 *   node scripts/lib/sao-luu-ngoai-may.mjs kiem-db     hằng tháng: khôi phục bản dump vào DB thử, so so-dong.tsv
 *   node scripts/lib/sao-luu-ngoai-may.mjs khoi-tao    lần đầu: sinh mật khẩu kho vào Keychain + restic init
 *   node scripts/lib/sao-luu-ngoai-may.mjs soat-khoa [đường…]   tìm giá trị khoá/mật khẩu trong tệp — chỉ in đường
 *   node scripts/lib/sao-luu-ngoai-may.mjs trang-thai  in dòng trạng thái (cùng dòng check-freshness in)
 *   node scripts/lib/sao-luu-ngoai-may.mjs --ranh-gioi --base <ref> [--thu-ten-nguon]   quét ranh giới hàng (E11)
 *
 * Mã thoát: 0 ok · 1 lỗi bước · 2 gọi sai · 3 thiếu tệp xác nhận «đã cất bản khoá» · 4 tệp cấu hình sai (vắng, trong kho,
 * quyền khác 600, thiếu RESTIC_REPOSITORY) · 5 không chạy được restic · 6 Keychain không có mục mật khẩu kho.
 *
 * Bí mật: khoá B2 ở tệp cấu hình ngoài kho (quyền 600), nạp vào MÔI TRƯỜNG của restic, không qua đối số; mật khẩu kho ở
 * Keychain, restic tự đọc qua --password-command. Không giá trị nào được in, ghi log hay ghi vào tệp trạng thái.
 * Biến SAO_LUU_* đổi mọi đường và lệnh ngoài để test chạy trọn trên thư mục tạm (không B2, không Keychain thật).
 */
import { spawnSync } from "node:child_process";
import { createHash, randomBytes } from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const GOC_KHO = path.resolve(HERE, "..", "..");

export const SAO_LUU_SLO_GIO = 36;
export const GIU = ["--keep-daily", "7", "--keep-weekly", "4", "--keep-monthly", "6"];
/** Loại khỏi bản sao lưu — CHỈ áp dưới collector/state/ (phiên, khoá, QR, hồ sơ trình duyệt của tài khoản thu). */
export const LUAT_LOAI_TRU_STATE = /(session|cookie|profile|qr|token|auth|credential|\.key$|\.pem$)/i;
/** Loại ở mọi nguồn: lớp dựng lại được. */
export const LOAI_TRU_TOAN_CAY = ["node_modules", "dist", ".cache"];
const BIEN_CAU_HINH = ["RESTIC_REPOSITORY", "B2_ACCOUNT_ID", "B2_ACCOUNT_KEY"];
const BIEN_KHOA = ["B2_ACCOUNT_ID", "B2_ACCOUNT_KEY"];

// ---------- cấu hình ----------

export function docCauHinh({ env = process.env, home = os.homedir(), goc = GOC_KHO } = {}) {
  const thuMuc = env.SAO_LUU_THU_MUC || path.join(home, ".oneinvest", "sao-luu");
  return {
    goc,
    tepCauHinh: env.SAO_LUU_CAU_HINH || path.join(home, ".oneinvest", "b2.env"),
    thuMuc,
    tepXacNhan: path.join(thuMuc, "da-cat-khoa"),
    tepTrangThai: path.join(thuMuc, "trang-thai.json"),
    keychainMuc: env.SAO_LUU_KEYCHAIN_MUC || "onehub-restic",
    security: env.SAO_LUU_SECURITY || "security",
    khoAnh: env.SAO_LUU_KHO_ANH || null,
    gocNguon: env.SAO_LUU_GOC_NGUON || goc,
    lenhDump: env.SAO_LUU_LENH_DUMP || `bash ${q(path.join(goc, "scripts", "db-sao-luu.sh"))}`,
    dumpChinh: env.SAO_LUU_DUMP_CHINH || "oneinvest.dump",
    restic: env.SAO_LUU_RESTIC || "restic",
    container: env.DB_CONTAINER || "one-invest-db",
    thuMucLog: env.SAO_LUU_LOG || path.join(home, "Library", "Logs", "onehub"),
  };
}

/** Trích dẫn kiểu shell một đối số (dùng cho --password-command và lệnh dump). */
function q(s) {
  return `'${String(s).replace(/'/g, `'\\''`)}'`;
}

export function docBienCauHinh(tep) {
  const out = {};
  for (const dong of fs.readFileSync(tep, "utf8").split(/\r?\n/)) {
    const m = dong.match(/^\s*(?:export\s+)?([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
    if (!m || !BIEN_CAU_HINH.includes(m[1])) continue;
    out[m[1]] = m[2].replace(/^(['"])(.*)\1$/, "$2");
  }
  return out;
}

/** Đường tuyệt đối thật (đi lên tới tổ tiên có thật). */
function thatDuong(p) {
  let a = path.resolve(p);
  let rest = "";
  while (!fs.existsSync(a)) {
    rest = path.join(path.basename(a), rest);
    a = path.dirname(a);
  }
  return path.join(fs.realpathSync(a), rest);
}

/** Đường nằm trong cây kho này (worktree) hay checkout chính? */
export function trongKho(p, goc = GOC_KHO) {
  const a = thatDuong(p);
  const goi = (args) => spawnSync("git", ["-C", goc, ...args], { encoding: "utf8" });
  const cac = [];
  const top = goi(["rev-parse", "--show-toplevel"]);
  if (top.status === 0) cac.push(thatDuong(top.stdout.trim()));
  const common = goi(["rev-parse", "--path-format=absolute", "--git-common-dir"]);
  if (common.status === 0) cac.push(path.dirname(thatDuong(common.stdout.trim())));
  if (cac.length === 0) cac.push(thatDuong(goc));
  return cac.some((g) => a === g || a.startsWith(g + path.sep));
}

/** Kiểm trước, theo đúng thứ tự; không lời gọi restic nào trước bước xác nhận và bước cấu hình. */
export function kiemTruoc(cfg, { lenh = "chay" } = {}) {
  if (!fs.existsSync(cfg.tepXacNhan)) {
    return { ma: 3, lyDo: `chưa có tệp xác nhận «đã cất bản khoá» (${cfg.tepXacNhan}) — Mạnh tự tạo tệp này sau khi đã cất bản sao mật khẩu kho; chưa gửi gì` };
  }
  if (!fs.existsSync(cfg.tepCauHinh)) return { ma: 4, lyDo: `không có tệp cấu hình ${cfg.tepCauHinh}` };
  if (trongKho(cfg.tepCauHinh, cfg.goc)) return { ma: 4, lyDo: "tệp cấu hình B2 phải nằm ngoài kho git" };
  const mode = fs.statSync(cfg.tepCauHinh).mode & 0o777;
  if (mode !== 0o600) return { ma: 4, lyDo: `tệp cấu hình B2 phải có quyền 600 (đang ${mode.toString(8)})` };
  if (!docBienCauHinh(cfg.tepCauHinh).RESTIC_REPOSITORY) return { ma: 4, lyDo: "tệp cấu hình thiếu RESTIC_REPOSITORY" };
  if (lenh !== "khoi-tao" && !coMucKeychain(cfg)) {
    return { ma: 6, lyDo: `Keychain không có mục «${cfg.keychainMuc}» — chạy khoi-tao trước` };
  }
  const v = spawnSync(cfg.restic, ["version"], { encoding: "utf8" });
  if (v.error || v.status !== 0) return { ma: 5, lyDo: `không chạy được restic (${cfg.restic})` };
  return { ma: 0, lyDo: "" };
}

function coMucKeychain(cfg) {
  const r = spawnSync(cfg.security, ["find-generic-password", "-s", cfg.keychainMuc], { encoding: "utf8" });
  return !r.error && r.status === 0;
}

export function moiTruongRestic(cfg) {
  const env = { ...process.env, ...docBienCauHinh(cfg.tepCauHinh) };
  for (const k of ["RESTIC_PASSWORD", "RESTIC_PASSWORD_FILE", "RESTIC_PASSWORD_COMMAND"]) delete env[k];
  const args = ["--password-command", `${q(cfg.security)} find-generic-password -s ${q(cfg.keychainMuc)} -w`];
  return { env, args };
}

function restic(cfg, args, opts = {}) {
  const { env, args: pw } = moiTruongRestic(cfg);
  const r = spawnSync(cfg.restic, [...pw, ...args], {
    env, encoding: "utf8", maxBuffer: 1 << 30, stdio: ["ignore", "pipe", "pipe"], ...opts,
  });
  return { status: r.error ? 127 : r.status, stdout: r.stdout || "", stderr: r.stderr || "" };
}

// ---------- trạng thái ----------

function docJson(tep) {
  try { return JSON.parse(fs.readFileSync(tep, "utf8")); } catch { return null; }
}

export function ghiTrangThai(cfg, obj) {
  fs.mkdirSync(path.dirname(cfg.tepTrangThai), { recursive: true });
  const tam = `${cfg.tepTrangThai}.${process.pid}.tmp`;
  fs.writeFileSync(tam, JSON.stringify(obj, null, 2) + "\n", { mode: 0o600 });
  fs.renameSync(tam, cfg.tepTrangThai);
}

/** Một dòng «Sao lưu ngoài máy» cho check-freshness: tệp trạng thái + tệp xác nhận → trạng thái, có xấu không. */
export function docTrangThaiSaoLuu({ tepTrangThai, tepXacNhan, now = new Date() } = {}) {
  if (!tepTrangThai || !tepXacNhan) ({ tepTrangThai, tepXacNhan } = docCauHinh());
  if (!fs.existsSync(tepTrangThai)) {
    if (!fs.existsSync(tepXacNhan)) {
      return { trangThai: "chua-bat", tuoiGio: null, xau: false, dong: "Sao lưu ngoài máy: chưa bật (chưa có tệp xác nhận đã cất bản khoá)" };
    }
    return { trangThai: "chua-co-luot", tuoiGio: null, xau: true, dong: "Sao lưu ngoài máy: đã bật mà chưa có lượt sao lưu nào" };
  }
  const tt = docJson(tepTrangThai);
  if (!tt || typeof tt !== "object") {
    return { trangThai: "loi", tuoiGio: null, xau: true, dong: "Sao lưu ngoài máy: tệp trạng thái hỏng, không đọc được" };
  }
  const ok = tt.lan_ok_cuoi ? new Date(tt.lan_ok_cuoi) : null;
  const tuoi = ok && !Number.isNaN(ok.getTime()) ? Math.max(0, (now.getTime() - ok.getTime()) / 3.6e6) : null;
  const tuoiChu = tuoi === null ? "chưa có lượt thành công" : `bản tốt cuối cách ${tuoi.toFixed(1)} giờ`;
  if (tt.ket_qua === "loi") {
    return { trangThai: "loi", tuoiGio: tuoi, xau: true, dong: `Sao lưu ngoài máy: lượt cuối lỗi ở bước ${tt.buoc_loi ?? "?"} — ${tuoiChu}` };
  }
  if (tuoi === null || tuoi > SAO_LUU_SLO_GIO) {
    return { trangThai: "qua-han", tuoiGio: tuoi, xau: true, dong: `Sao lưu ngoài máy: quá hạn ${SAO_LUU_SLO_GIO} giờ — ${tuoiChu}` };
  }
  return { trangThai: "ok", tuoiGio: tuoi, xau: false, dong: `Sao lưu ngoài máy: ok — ${tuoiChu}` };
}

// ---------- nguồn, loại trừ ----------

export function nguonSaoLuu(cfg) {
  const duong = [path.join(cfg.gocNguon, "collector", "snapshots"), path.join(cfg.gocNguon, "collector", "state")]
    .filter((p) => fs.existsSync(p));
  const coAnh = cfg.khoAnh && fs.existsSync(cfg.khoAnh);
  if (coAnh) duong.push(path.resolve(cfg.khoAnh));
  return { duong, khoAnh: coAnh ? "co" : "chua_co" };
}

function* duyet(goc) {
  for (const e of fs.readdirSync(goc, { withFileTypes: true })) {
    const p = path.join(goc, e.name);
    yield { p, e };
    if (e.isDirectory() && !e.isSymbolicLink()) yield* duyet(p);
  }
}

/** Mẫu loại trừ cho restic: đường tuyệt đối của mục khớp luật dưới collector/state, cộng LOAI_TRU_TOAN_CAY. */
export function mauLoaiTru(cfg, { _dotBien = null } = {}) {
  const goc = [path.join(cfg.gocNguon, "collector", "state")];
  if (_dotBien === "ap-toan-cay") goc.push(path.join(cfg.gocNguon, "collector", "snapshots"));
  const mau = [];
  for (const g of goc) {
    if (!fs.existsSync(g)) continue;
    for (const { p, e } of duyet(g)) {
      if (LUAT_LOAI_TRU_STATE.test(e.name)) mau.push(p.replace(/([*?[\]\\])/g, "\\$1"));
    }
  }
  return [...mau, ...LOAI_TRU_TOAN_CAY];
}

function sha256Tep(p) {
  return createHash("sha256").update(fs.readFileSync(p)).digest("hex");
}

function bamThuMuc(g) {
  const out = {};
  for (const { p, e } of duyet(g)) if (e.isFile()) out[path.relative(g, p)] = sha256Tep(p);
  return out;
}

// ---------- chay ----------

/** restic hiểu --time theo giờ máy, nên định dạng theo giờ địa phương (không UTC). */
function dinhGioRestic(d) {
  const h = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${h(d.getMonth() + 1)}-${h(d.getDate())} ${h(d.getHours())}:${h(d.getMinutes())}:${h(d.getSeconds())}`;
}

export function chay(cfg, { luc = null, now = new Date(), _dotBien = null } = {}) {
  const k = kiemTruoc(cfg, { lenh: "chay" });
  if (k.ma) return { ma: k.ma, lyDo: k.lyDo };
  const cu = docJson(cfg.tepTrangThai) || {};
  const tt = {
    lan_chay: now.toISOString(), ket_qua: "loi", buoc_loi: null,
    snapshot_id: cu.snapshot_id ?? null, luc_snapshot: cu.luc_snapshot ?? null,
    so_tep: cu.so_tep ?? null, so_byte: cu.so_byte ?? null, byte_moi: cu.byte_moi ?? null,
    kho_anh: null, dump_duong: cu.dump_duong ?? null, dump_sha256: cu.dump_sha256 ?? null,
    lan_ok_cuoi: cu.lan_ok_cuoi ?? null, kiem_cuoi: cu.kiem_cuoi ?? null,
  };
  const loi = (buoc, lyDo) => {
    tt.buoc_loi = buoc;
    ghiTrangThai(cfg, tt);
    return { ma: 1, lyDo, trangThai: tt };
  };
  // Thư mục dump nằm dưới thư mục sao lưu ở $HOME, KHÔNG ở os.tmpdir(): db-sao-luu.sh ghi dump qua container phụ gắn thư
  // mục đích, mà Colima chỉ gắn $HOME — dưới /var/folders container ghi vào máy ảo và máy này không có bản dump nào.
  fs.mkdirSync(path.join(cfg.thuMuc, "tam"), { recursive: true, mode: 0o700 });
  const tam = fs.mkdtempSync(path.join(cfg.thuMuc, "tam", "sao-luu-"));
  const dumpDir = path.join(tam, "db");
  // DB_CONTAINER của cấu hình đi xuống lệnh dump: db-sao-luu.sh đọc biến này, thiếu nó thì nó dump container mặc định.
  const d = spawnSync("bash", ["-c", `${cfg.lenhDump} "$1"`, "bash", dumpDir],
    { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"], env: { ...process.env, DB_CONTAINER: cfg.container } });
  if (d.error || d.status !== 0) {
    const cuoi = `${d.stdout || ""}${d.stderr || ""}`.trim().split("\n").filter(Boolean).slice(-1)[0] || "";
    return loi("dump", `dump DB lỗi (mã ${d.status}): ${cuoi.slice(0, 200)}; giữ ${tam} để soi`);
  }
  const dumpSha = bamThuMuc(dumpDir);
  const nguon = nguonSaoLuu(cfg);
  tt.kho_anh = nguon.khoAnh;
  const ex = path.join(tam, "loai-tru.txt");
  fs.writeFileSync(ex, mauLoaiTru(cfg, { _dotBien }).join("\n") + "\n");
  const args = ["backup", "--json", "--tag", "onehub-may-thu", "--exclude-file", ex];
  if (luc) args.push("--time", dinhGioRestic(luc));
  const b = restic(cfg, [...args, ...nguon.duong, dumpDir]);
  const sum = b.stdout.split("\n").map((l) => { try { return JSON.parse(l); } catch { return null; } })
    .find((o) => o && o.message_type === "summary");
  if (b.status !== 0 || !sum) return loi("backup", `restic backup lỗi (mã ${b.status}); giữ ${tam} để soi`);
  Object.assign(tt, {
    snapshot_id: sum.snapshot_id, luc_snapshot: (luc ?? now).toISOString(),
    so_tep: sum.total_files_processed, so_byte: sum.total_bytes_processed, byte_moi: sum.data_added,
    dump_duong: dumpDir, dump_sha256: dumpSha,
  });
  // Nhóm theo máy + nhãn, không theo đường: thư mục dump tạm đổi tên mỗi lượt, nhóm theo đường thì chính sách giữ không xoá gì.
  const f = restic(cfg, ["forget", "--prune", "--group-by", "host,tags", "--tag", "onehub-may-thu", ...GIU]);
  if (f.status !== 0) return loi("giu", `restic forget lỗi (mã ${f.status}); bản ${sum.snapshot_id.slice(0, 8)} đã vào kho`);
  tt.ket_qua = "ok";
  tt.lan_ok_cuoi = now.toISOString();
  ghiTrangThai(cfg, tt);
  fs.rmSync(tam, { recursive: true, force: true });
  return { ma: 0, lyDo: "", trangThai: tt };
}

// ---------- khoi-tao ----------

export function khoiTao(cfg) {
  const k = kiemTruoc(cfg, { lenh: "khoi-tao" });
  if (k.ma) return { ma: k.ma, lyDo: k.lyDo };
  if (coMucKeychain(cfg)) return { ma: 1, lyDo: `Keychain đã có mục «${cfg.keychainMuc}» — không tạo lại mật khẩu kho` };
  const mk = randomBytes(32).toString("base64");
  const a = spawnSync(cfg.security, ["add-generic-password", "-s", cfg.keychainMuc, "-a", "onehub", "-w", mk], { encoding: "utf8" });
  if (a.error || a.status !== 0) return { ma: 1, lyDo: "không ghi được mật khẩu kho vào Keychain" };
  const i = restic(cfg, ["init"]);
  if (i.status !== 0) return { ma: 1, lyDo: `restic init lỗi (mã ${i.status})` };
  return {
    ma: 0,
    lyDo: `đã tạo kho và mật khẩu ở Keychain mục «${cfg.keychainMuc}». Chép một bản cất riêng: security find-generic-password -s ${cfg.keychainMuc} -w`,
  };
}

// ---------- kiem ----------

function prng(hat) {
  let s = (Number(hat) >>> 0) || 1;
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 2 ** 32);
}

export function lsMoiNhat(cfg) {
  const r = restic(cfg, ["ls", "--json", "latest"]);
  if (r.status !== 0) return null;
  const dong = r.stdout.split("\n").filter(Boolean).map((l) => JSON.parse(l));
  const snap = dong.find((o) => o.struct_type === "snapshot" || o.message_type === "snapshot");
  const tep = dong.filter((o) => (o.struct_type === "node" || o.message_type === "node") && o.type === "file").map((o) => o.path);
  return { id: snap?.id, tep };
}

export function kiem(cfg, { hatGiong = Date.now(), soTep = 50, tyLeDoc = "5%" } = {}) {
  const k = kiemTruoc(cfg, { lenh: "kiem" });
  if (k.ma) return { ma: k.ma, thongDiep: k.lyDo };
  const tt = docJson(cfg.tepTrangThai) || {};
  const ketThuc = (ma, thongDiep, extra = {}) => {
    if (fs.existsSync(cfg.tepTrangThai)) {
      tt.kiem_cuoi = { luc: new Date().toISOString(), ket_qua: ma === 0 ? "ok" : "loi", so_tep: extra.soTep ?? 0, so_lech: extra.lech?.length ?? 0 };
      ghiTrangThai(cfg, tt);
    }
    return { ma, thongDiep, soTep: 0, khop: 0, lech: [], ...extra };
  };
  const c = restic(cfg, ["check", `--read-data-subset=${tyLeDoc}`]);
  if (c.status !== 0) return ketThuc(1, `restic check lỗi (mã ${c.status}) — kho có khối hỏng hay thiếu`);
  const ls = lsMoiNhat(cfg);
  if (!ls?.id) return ketThuc(1, "không đọc được bản mới nhất của kho");
  if (!tt.dump_sha256 || !tt.dump_duong || tt.snapshot_id !== ls.id) {
    return ketThuc(1, "không có mốc sha256 cho bản dump của bản mới nhất (tệp trạng thái thiếu hay lệch snapshot_id)");
  }
  const gocSnap = path.join(cfg.gocNguon, "collector", "snapshots") + path.sep;
  const snap = ls.tep.filter((p) => p.startsWith(gocSnap));
  const dump = ls.tep.filter((p) => p.startsWith(tt.dump_duong + path.sep));
  const r = prng(hatGiong);
  const chon = [...snap].sort().map((p) => [r(), p]).sort((a, b) => a[0] - b[0]).slice(0, soTep).map((x) => x[1]);
  // AC-5: phải khôi phục đủ soTep tệp raw snapshot — kho thiếu (gốc lệch, snapshots vắng lúc chạy) không được báo ok
  if (chon.length < soTep) return ketThuc(1, `bản mới nhất chỉ có ${chon.length} tệp raw snapshot dưới ${path.relative(cfg.gocNguon, gocSnap) || gocSnap}, cần ít nhất ${soTep}`, { soTep: chon.length });
  const tatCa = [...chon, ...dump];
  const dich = fs.mkdtempSync(path.join(os.tmpdir(), "sao-luu-kiem-"));
  try {
    const inc = tatCa.flatMap((p) => ["--include", p.replace(/([*?[\]\\])/g, "\\$1")]);
    const rs = restic(cfg, ["restore", "latest", "--target", dich, ...inc]);
    if (rs.status !== 0) return ketThuc(1, `restic restore lỗi (mã ${rs.status})`, { soTep: tatCa.length });
    const lech = [];
    for (const p of chon) {
      const lay = path.join(dich, p);
      if (!fs.existsSync(lay) || !fs.existsSync(p) || sha256Tep(lay) !== sha256Tep(p)) lech.push(path.relative(cfg.gocNguon, p));
    }
    for (const p of dump) {
      const ten = path.relative(tt.dump_duong, p);
      const lay = path.join(dich, p);
      if (!fs.existsSync(lay) || tt.dump_sha256[ten] !== sha256Tep(lay)) lech.push(`dump:${ten}`);
    }
    for (const ten of Object.keys(tt.dump_sha256)) {
      if (!dump.includes(path.join(tt.dump_duong, ten))) lech.push(`dump:${ten} (vắng trong kho)`);
    }
    const thongDiep = lech.length
      ? `khôi phục ${tatCa.length} tệp, lệch ${lech.length}: ${lech.slice(0, 5).join(", ")}`
      : `khôi phục ${tatCa.length} tệp, sha256 khớp hết`;
    return ketThuc(lech.length ? 1 : 0, thongDiep, { soTep: tatCa.length, khop: tatCa.length - lech.length, lech });
  } finally {
    fs.rmSync(dich, { recursive: true, force: true });
  }
}

// ---------- kiem-db ----------

/** Câu đếm số dòng rút nguyên văn từ scripts/db-sao-luu.sh — không chép tay. */
export function rutDemSql(goc = GOC_KHO) {
  const s = fs.readFileSync(path.join(goc, "scripts", "db-sao-luu.sh"), "utf8");
  const m = s.match(/^DEM_SQL="([\s\S]*?)"$/m);
  if (!m) throw new Error("không rút được DEM_SQL từ scripts/db-sao-luu.sh");
  return m[1];
}

function psql(cfg, db, input) {
  return spawnSync("docker", ["exec", "-i", "-e", "PGPASSWORD=oneinvest", cfg.container, "psql", "-U", "oneinvest", "-h", "localhost",
    "-At", "-q", "-v", "ON_ERROR_STOP=1", "-d", db], { input, encoding: "utf8", maxBuffer: 1 << 28 });
}

function docSoDong(text) {
  const m = new Map();
  for (const dong of text.split("\n").filter(Boolean)) {
    const [bang, so] = dong.split("\t");
    m.set(bang, so);
  }
  return m;
}

/**
 * Lỗi pg_restore còn lại sau khi bỏ đúng một lớp được chấp nhận: extension pg_cron chỉ tạo được trong DB «oneinvest»
 * (cron.database_name), nên nạp vào DB thử luôn lỗi ở CREATE/COMMENT EXTENSION pg_cron và mọi đối tượng schema cron theo
 * sau (COPY cron.job…, setval cron.*_seq). Bảng schema cron vốn nằm ngoài phép đếm DEM_SQL. Lỗi nào khác → giữ, kiem-db đỏ.
 */
export function loiPgRestoreConLai(stderr) {
  const khoi = String(stderr).split(/^(?=pg_restore: )/m).filter((k) => /^pg_restore: error:/.test(k));
  const lenhCron = (k) => {
    const lenh = (k.match(/^Command was: (.*)$/m) || [])[1] || "";
    return /^(CREATE|COMMENT ON) EXTENSION (IF NOT EXISTS )?pg_cron\b/.test(lenh) || /^(COPY |SELECT pg_catalog\.setval\(')cron\./.test(lenh);
  };
  return khoi.filter((k) => !lenhCron(k)).map((k) => k.trim());
}

export function kiemDb(cfg) {
  const k = kiemTruoc(cfg, { lenh: "kiem-db" });
  if (k.ma) return { ma: k.ma, thongDiep: k.lyDo, bangLech: [] };
  const tt = docJson(cfg.tepTrangThai) || {};
  if (!tt.dump_duong) return { ma: 1, thongDiep: "tệp trạng thái không có đường bản dump", bangLech: [] };
  const dich = fs.mkdtempSync(path.join(os.tmpdir(), "sao-luu-kiem-db-"));
  const ten = `oneinvest_u1_saoluu_${randomBytes(4).toString("hex")}`;
  let taoDb = false;
  try {
    const rs = restic(cfg, ["restore", "latest", "--target", dich, "--include", tt.dump_duong]);
    if (rs.status !== 0) return { ma: 1, thongDiep: `restic restore lỗi (mã ${rs.status})`, bangLech: [] };
    const thu = path.join(dich, tt.dump_duong);
    const dump = path.join(thu, cfg.dumpChinh);
    const tsv = path.join(thu, "so-dong.tsv");
    if (!fs.existsSync(dump) || !fs.existsSync(tsv)) return { ma: 1, thongDiep: `bản khôi phục thiếu ${cfg.dumpChinh} hay so-dong.tsv`, bangLech: [] };
    const tao = psql(cfg, "postgres", `CREATE DATABASE ${ten};`);
    if (tao.status !== 0) return { ma: 1, thongDiep: "không tạo được DB thử", bangLech: [] };
    taoDb = true;
    const fd = fs.openSync(dump, "r");
    const pr = spawnSync("docker", ["exec", "-i", "-e", "PGPASSWORD=oneinvest", cfg.container, "pg_restore", "-U", "oneinvest", "-h", "localhost",
      "--no-owner", "--no-privileges", "-d", ten], { stdio: [fd, "pipe", "pipe"], encoding: "utf8" });
    fs.closeSync(fd);
    if (pr.status !== 0) {
      const loiCon = loiPgRestoreConLai(pr.stderr || "");
      if (pr.error || loiCon.length) return { ma: 1, thongDiep: `pg_restore lỗi: ${(loiCon[0] || pr.stderr || "").split("\n")[0]}`, bangLech: [] };
    }
    const dem = psql(cfg, ten, `${rutDemSql(cfg.goc)} \\gexec\n`);
    if (dem.status !== 0) return { ma: 1, thongDiep: "đếm số dòng trên DB thử lỗi", bangLech: [] };
    const goc = docSoDong(fs.readFileSync(tsv, "utf8"));
    const moi = docSoDong(dem.stdout);
    const bangLech = [...new Set([...goc.keys(), ...moi.keys()])].filter((b) => goc.get(b) !== moi.get(b)).sort();
    return bangLech.length
      ? { ma: 1, thongDiep: `số dòng lệch ở ${bangLech.length} bảng: ${bangLech.slice(0, 5).join(", ")}`, bangLech }
      : { ma: 0, thongDiep: `khôi phục bản dump vào DB thử, ${goc.size} bảng khớp so-dong.tsv`, bangLech };
  } finally {
    if (taoDb) psql(cfg, "postgres", `DROP DATABASE IF EXISTS ${ten} WITH (FORCE);`);
    fs.rmSync(dich, { recursive: true, force: true });
  }
}

// ---------- soat-khoa ----------

function giaTriKhoa(cfg) {
  const out = [];
  if (fs.existsSync(cfg.tepCauHinh)) {
    const b = docBienCauHinh(cfg.tepCauHinh);
    for (const k of BIEN_KHOA) if (b[k]) out.push(b[k]);
  }
  const r = spawnSync(cfg.security, ["find-generic-password", "-s", cfg.keychainMuc, "-w"], { encoding: "utf8" });
  if (!r.error && r.status === 0 && r.stdout.trim()) out.push(r.stdout.trim());
  return out.filter((v) => v.length >= 8);
}

function duongMacDinh(cfg) {
  const ls = (args) => {
    const r = spawnSync("git", ["-C", cfg.goc, "ls-files", "-z", ...args], { encoding: "utf8", maxBuffer: 1 << 28 });
    return r.status === 0 ? r.stdout.split("\0").filter(Boolean).map((p) => path.join(cfg.goc, p)) : [];
  };
  return [...ls([]), ...ls(["-o", "--exclude-standard"]), cfg.thuMuc, cfg.thuMucLog];
}

export function soatKhoa(cfg, { duong = null } = {}) {
  const gt = giaTriKhoa(cfg).map((v) => Buffer.from(v));
  if (gt.length === 0) return { ma: 0, tep: [], soGiaTri: 0 };
  const tep = new Set();
  const xet = (p) => {
    let st;
    try { st = fs.lstatSync(p); } catch { return; }
    if (st.isSymbolicLink()) return;
    if (st.isDirectory()) { for (const e of fs.readdirSync(p)) xet(path.join(p, e)); return; }
    if (!st.isFile() || st.size > 50 * 1024 * 1024 || path.resolve(p) === path.resolve(cfg.tepCauHinh)) return;
    const buf = fs.readFileSync(p);
    if (gt.some((v) => buf.includes(v))) tep.add(p);
  };
  for (const p of duong ?? duongMacDinh(cfg)) xet(p);
  return { ma: tep.size ? 1 : 0, tep: [...tep].sort(), soGiaTri: gt.length };
}

// ---------- ranh giới hàng (E11) ----------

// Chữ ghép từ mảnh để chính tệp này không tự khớp khi quét.
const LENH_TAI = new RegExp(`(^|[\\s;|&(])(${["cu" + "rl", "rcl" + "one", "aw" + "s", "sc" + "p", "rsy" + "nc"].join("|")})\\s`);
const LAUNCH = "launch" + "ctl";
const KHO_XA = new RegExp(`["'\`](${["b" + "2", "s" + "3", "sf" + "tp", "res" + "t", "rcl" + "one"].join("|")}):`);
const TEP_HANG = /^scripts\/(sao-luu-ngoai-may[^/]*|lib\/sao-luu-ngoai-may\.mjs)$/;

/** Đếm trên dòng mã (bỏ dòng comment) của một tệp của hàng: lệnh launchd, lệnh tải lên ngoài restic, kho từ xa trong test. */
export function demTepHang(t, dong) {
  const ma = dong.filter((l) => !/^\s*(#|\/\/|\*|\/\*)/.test(l));
  return {
    nap_lich: ma.filter((l) => l.includes(LAUNCH)).length,
    lenh_tai_khac: ma.filter((l) => LENH_TAI.test(l)).length,
    kho_tu_xa_trong_test: /\.(test|itest)\.mjs$/.test(t) ? ma.filter((l) => KHO_XA.test(l)).length : 0,
  };
}

function git(goc, args) {
  const r = spawnSync("git", ["-C", goc, ...args], { encoding: "utf8", maxBuffer: 1 << 28 });
  if (r.status !== 0) throw new Error(`git ${args[0]} lỗi: ${(r.stderr || "").trim()}`);
  return r.stdout;
}

function tenNguonThat(cfg) {
  const r = psql(cfg, "oneinvest", "select distinct real_name from source_registry where coalesce(real_name,'') <> '';\n");
  if (r.status !== 0) throw new Error("không đọc được source_registry local");
  return r.stdout.split("\n").map((s) => s.trim()).filter((s) => s.length >= 3);
}

/** Dòng thêm của hàng so với base: { tep → [dòng] }, gồm cả tệp chưa theo dõi. */
function dongThem(goc, base) {
  const out = new Map();
  const diff = git(goc, ["diff", "-U0", "--no-color", `${base}...HEAD`]) + git(goc, ["diff", "-U0", "--no-color", "HEAD"]);
  let tep = null;
  for (const dong of diff.split("\n")) {
    if (dong.startsWith("+++ ")) { tep = dong.slice(4).replace(/^b\//, ""); continue; }
    if (tep && dong.startsWith("+") && !dong.startsWith("+++")) {
      if (!out.has(tep)) out.set(tep, []);
      out.get(tep).push(dong.slice(1));
    }
  }
  for (const t of git(goc, ["ls-files", "-o", "--exclude-standard"]).split("\n").filter(Boolean)) {
    try { out.set(t, fs.readFileSync(path.join(goc, t), "utf8").split("\n")); } catch { /* thư mục hay tệp nhị phân */ }
  }
  return out;
}

export function quetRanhGioi(cfg, { base = "origin/main", thuTenNguon = false, tenNguon = null } = {}) {
  const tepDoi = new Set([
    ...git(cfg.goc, ["diff", "--name-only", `${base}...HEAD`]).split("\n"),
    ...git(cfg.goc, ["diff", "--name-only", "HEAD"]).split("\n"),
    ...git(cfg.goc, ["ls-files", "-o", "--exclude-standard"]).split("\n"),
  ].filter(Boolean));
  const them = dongThem(cfg.goc, base);
  const dem = { sync_cloud_doi: 0, collector_doi: 0, plist: 0, nap_lich: 0, kho_tu_xa_trong_test: 0, lenh_tai_khac: 0, ten_nguon: 0 };
  const chiTiet = [];
  for (const t of tepDoi) {
    if (t === "pipeline/sync-cloud.mjs") dem.sync_cloud_doi++;
    if (t.startsWith("collector/")) dem.collector_doi++;
    if (t.endsWith(".plist")) dem.plist++;
  }
  for (const [t, dong] of them) {
    if (!TEP_HANG.test(t)) continue;
    const d = demTepHang(t, dong);
    dem.nap_lich += d.nap_lich;
    dem.lenh_tai_khac += d.lenh_tai_khac;
    dem.kho_tu_xa_trong_test += d.kho_tu_xa_trong_test;
  }
  const ten = tenNguon ?? tenNguonThat(cfg);
  if (thuTenNguon && ten.length) them.set("__thu-ten-nguon__.txt", [`dòng gài: ${ten[0]} đứng riêng`]);
  const boQua = /^(LO-TRINH\.html|PRODUCT-MAP\.md)$/;
  const mau = ten.map((n) => new RegExp(`(?<![\\p{L}\\p{N}_\\-./@])${n.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?![\\p{L}\\p{N}_\\-/@]|\\.[\\p{L}\\p{N}])`, "iu"));
  for (const [t, dong] of them) {
    if (boQua.test(t)) continue;
    const n = dong.filter((l) => mau.some((m) => m.test(l))).length;
    if (n) { dem.ten_nguon += n; chiTiet.push(t); }
  }
  return { dem, chiTiet };
}

// ---------- CLI ----------

function main(argv) {
  const cfg = docCauHinh();
  const [lenh, ...con] = argv;
  const ra = (ma, thongDiep) => {
    if (thongDiep) (ma ? process.stderr : process.stdout).write(`sao-luu-ngoai-may: ${thongDiep}\n`);
    process.exit(ma);
  };
  switch (lenh) {
    case "chay": {
      const i = con.indexOf("--luc");
      const r = chay(cfg, i >= 0 ? { luc: new Date(con[i + 1]) } : {});
      return ra(r.ma, r.ma ? r.lyDo : `xong — bản ${r.trangThai.snapshot_id.slice(0, 8)}, ${r.trangThai.so_tep} tệp, ${r.trangThai.byte_moi} byte mới`);
    }
    case "kiem": {
      const r = kiem(cfg);
      return ra(r.ma, r.thongDiep);
    }
    case "kiem-db": {
      const r = kiemDb(cfg);
      return ra(r.ma, r.thongDiep);
    }
    case "khoi-tao": {
      const r = khoiTao(cfg);
      return ra(r.ma, r.lyDo);
    }
    case "soat-khoa": {
      const r = soatKhoa(cfg, con.length ? { duong: con } : {});
      return ra(r.ma, r.ma ? `giá trị khoá có trong ${r.tep.length} tệp:\n${r.tep.join("\n")}` : `sạch — soát ${r.soGiaTri} giá trị`);
    }
    case "trang-thai": {
      const r = docTrangThaiSaoLuu({ tepTrangThai: cfg.tepTrangThai, tepXacNhan: cfg.tepXacNhan });
      return ra(r.xau ? 1 : 0, r.dong);
    }
    case "--ranh-gioi": {
      const i = con.indexOf("--base");
      try {
        const { dem, chiTiet } = quetRanhGioi(cfg, { base: i >= 0 ? con[i + 1] : "origin/main", thuTenNguon: con.includes("--thu-ten-nguon") });
        process.stdout.write(Object.entries(dem).map(([k, v]) => `${k}=${v}`).join(" ") + "\n");
        if (chiTiet.length) process.stdout.write(`tệp có tên nguồn: ${chiTiet.join(", ")}\n`);
        return process.exit(Object.values(dem).some((v) => v) ? 1 : 0);
      } catch (e) {
        return ra(2, e.message);
      }
    }
    default:
      return ra(2, "lệnh: chay | kiem | kiem-db | khoi-tao | soat-khoa [đường…] | trang-thai | --ranh-gioi --base <ref>");
  }
}

if (process.argv[1] && fs.realpathSync(process.argv[1]) === fileURLToPath(import.meta.url)) main(process.argv.slice(2));
