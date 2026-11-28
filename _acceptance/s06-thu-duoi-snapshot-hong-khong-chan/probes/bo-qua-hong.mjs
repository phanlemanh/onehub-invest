#!/usr/bin/env node
// bo-qua-hong.mjs — E1–E5, E7 của s06-thu-duoi-snapshot-hong-khong-chan (ZC26).
//
// Chạy wrapper THẬT scripts/thu-duoi-s06.sh với bộ nạp THẬT pipeline/import-chotot.mjs trên DB của riêng lượt (khuôn
// chon-nap.mjs của ZC18). Chỉ thay bộ thu (stub, 0 lời gọi nguồn) và pgrep (không thấy lượt quét đủ). Snapshot lành dựng
// từ snapshot THẬT của phép đo 24 giờ (writer thật); bản hỏng là bản thật bị làm hỏng theo đúng một lớp mỗi ca.
//
// Mỗi ca (một lớp hỏng): vùng hanoi có bản LÀNH cũ hơn chưa nạp + bản HỎNG mới hơn.
//   vòng 1: nạp đúng bản lành (không còn bị chặn) · thoát 1 · một dòng log gọi tên bản hỏng · bản hỏng có trong tệp đánh
//           dấu · thư mục bản hỏng y nguyên từng byte (không xoá, không sửa)
//   vòng 2: 0 lần nạp bản hỏng · không lặp dòng log · thoát 0
// Ca nạp lỗi tạm (bộ nạp thật bị thay bằng stub thoát 1): bản lành KHÔNG bị đánh dấu, vòng sau thử lại.
// Ca tệp đánh dấu hỏng: wrapper không nổ, vẫn chọn đúng.
// Đột biến (tự kiểm của thước): bản chép wrapper bỏ bước kiểm → ca checksum phải đỏ «CHAN HANG DOI».
//
// Dùng: bash db/db-thu.sh oneinvest_suite_zc26 --chay-trong node <tệp này>
// Đường phép đo: $S06_DUOI_DO (mặc định worktree ZT). Không ghi gì ngoài thư mục tạm và DB của lượt.
import { spawnSync } from "node:child_process";
import { cpSync, existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, symlinkSync, writeFileSync, chmodSync, statSync } from "node:fs";
import { createHash } from "node:crypto";
import { tmpdir, homedir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const URL_DB = process.env.DATABASE_URL ?? "";
const tenDb = URL_DB.split("/").pop()?.split("?")[0] ?? "";
if (!/^oneinvest_suite_/.test(tenDb)) { console.log(`tu choi DB: «${tenDb || "(trống)"}» không mang tên oneinvest_suite_*`); process.exit(2); }
const DO = process.env.S06_DUOI_DO ?? join(homedir(), "dev/onehub-wt/zt-thu-duoi-s06-do/state/phep-do-s06-24h");
const KHO = join(DO, "snapshots/hcmc");
let tatCa;
try {
  tatCa = readdirSync(KHO).filter((n) => n.startsWith("hcmc__chotot-ads__")).sort()
    .filter((n) => JSON.parse(readFileSync(join(KHO, n, "manifest.json"), "utf8")).counts?.items > 0);
} catch { console.log(`KHONG CO PHEP DO: ${KHO}`); process.exit(2); }
const LOP = ["thieu-manifest", "manifest-hong", "source-khac", "schema-la", "finishedAt-hong", "checksum-sai", "thieu-tep-items"];
if (tatCa.length < 2 * LOP.length + 7) { console.log(`KHONG CO PHEP DO: cần ≥ ${2 * LOP.length + 7} snapshot có tin`); process.exit(2); }
console.log(`fixture tu writer that: ${tatCa.length} snapshot hcmc của phép đo 24 giờ (bộ thu đuôi ghi)`);

const pg = (await import(join(ROOT, "pipeline/node_modules/pg/lib/index.js"))).default;
const db = new pg.Client({ connectionString: URL_DB });
await db.connect();
const q = (sql, v) => db.query(sql, v);

// --- gốc tạm: wrapper của cây (hoặc bản đột biến), pipeline/ symlink từng mục trừ bộ thu (stub) và có thể bộ nạp ---
function dungGoc({ wrapper, napGia = false } = {}) {
  const T = mkdtempSync(join(tmpdir(), "zc26-bo-qua-"));
  mkdirSync(join(T, "home")); mkdirSync(join(T, "scripts")); mkdirSync(join(T, "pipeline"));
  writeFileSync(join(T, "scripts/thu-duoi-s06.sh"), wrapper ?? readFileSync(join(ROOT, "scripts/thu-duoi-s06.sh"), "utf8"));
  for (const m of readdirSync(join(ROOT, "pipeline"))) {
    if (m === "collect-s06-duoi.mjs" || (napGia && m === "import-chotot.mjs")) continue;
    symlinkSync(join(ROOT, "pipeline", m), join(T, "pipeline", m));
  }
  writeFileSync(join(T, "pipeline/collect-s06-duoi.mjs"), "process.exit(0);\n");
  if (napGia) writeFileSync(join(T, "pipeline/import-chotot.mjs"), 'console.error("nap gia: loi tam thoi"); process.exit(1);\n');
  const SHIM = join(T, "shim"); mkdirSync(SHIM);
  writeFileSync(join(SHIM, "pgrep"), "#!/bin/sh\nexit 1\n"); chmodSync(join(SHIM, "pgrep"), 0o755);
  return { T, GOC: join(T, "state/thu-duoi-s06"), SHIM };
}
function vong(g, nhan) {
  const env = { PATH: `${g.SHIM}:${dirname(process.execPath)}:/usr/bin:/bin`, HOME: join(g.T, "home"), DATABASE_URL: URL_DB,
    THU_DUOI_S06_GOC: g.GOC, THU_DUOI_S06_VUNG: "hanoi" };
  const r = spawnSync("bash", [join(g.T, "scripts/thu-duoi-s06.sh")], { encoding: "utf8", env });
  const out = (r.stdout ?? "") + (r.stderr ?? "");
  const nap = [...out.matchAll(/nạp snapshot đuôi (\S+)/g)].map((m) => m[1].split("/").pop());
  return { rc: r.status, nap, out };
}
const moQuyen = (p) => { for (const n of readdirSync(p, { withFileTypes: true })) { const c = join(p, n.name);
  if (n.isDirectory()) { chmodSync(c, 0o755); moQuyen(c); } else chmodSync(c, 0o644); } };
// chép một snapshot thật sang vùng hanoi, đổi tên + snapshotId + city (tệp items giữ nguyên → sha256 vẫn khớp)
function datHanoi(g, id) {
  const moi = id.replace(/^hcmc__/, "hanoi__");
  const d = join(g.GOC, "snapshots/hanoi", moi);
  mkdirSync(dirname(d), { recursive: true }); cpSync(join(KHO, id), d, { recursive: true }); chmodSync(d, 0o755); moQuyen(d);
  const tm = join(d, "manifest.json");
  writeFileSync(tm, JSON.stringify({ ...JSON.parse(readFileSync(tm, "utf8")), snapshotId: moi, city: "hanoi" }));
  return { moi, d };
}
function lamHong(d, lop) {
  const tm = join(d, "manifest.json"); const m = JSON.parse(readFileSync(tm, "utf8"));
  const items = readdirSync(d).find((f) => f.startsWith("items-"));
  if (lop === "thieu-manifest") rmSync(tm);
  else if (lop === "manifest-hong") writeFileSync(tm, "{hong");
  else if (lop === "source-khac") writeFileSync(tm, JSON.stringify({ ...m, source: "s02-khac" }));
  else if (lop === "schema-la") writeFileSync(tm, JSON.stringify({ ...m, schemaVersion: 999 }));
  else if (lop === "finishedAt-hong") writeFileSync(tm, JSON.stringify({ ...m, finishedAt: null }));
  else if (lop === "checksum-sai") writeFileSync(join(d, items), "hong");
  else if (lop === "thieu-tep-items") rmSync(join(d, items));
}
// dấu vân tay thư mục: danh sách tệp + sha256 từng tệp (bất biến raw)
const vanTay = (d) => existsSync(d) ? readdirSync(d).sort().map((f) => `${f}:${createHash("sha256").update(readFileSync(join(d, f))).digest("hex")}`).join("|") : "(MAT)";
const docDau = (g) => { try { return JSON.parse(readFileSync(join(g.GOC, "bo-qua-hong.json"), "utf8")); } catch { return null; } };

await q("UPDATE source_registry SET status='active' WHERE code='S06'");
await q("DELETE FROM source_groups WHERE source_code='S06'");
await q("INSERT INTO source_groups (source_code, group_key, name, status) VALUES ('S06','hanoi','hanoi','active')");

let soDo = 0, probeHong = null;
const ok = (dk, dong, dongDo) => { if (dk) console.log(dong); else { console.log(dongDo); soDo++; } };
const goc = [];
try {
  let k = 0;
  for (const lop of LOP) {
    const g = dungGoc(); goc.push(g.T);
    const lanh = datHanoi(g, tatCa[k++]), hong = datHanoi(g, tatCa[k++]); // tên hỏng mới hơn tên lành
    lamHong(hong.d, lop);
    const truoc = vanTay(hong.d);
    const v1 = vong(g, `${lop}-1`);
    const dongLog = v1.out.split("\n").filter((l) => l.includes("bỏ qua snapshot hỏng"));
    const khuon = new RegExp(`bỏ qua snapshot hỏng ${hong.moi}: .+ — không xoá, không sửa$`);
    ok(v1.nap.length === 1 && v1.nap[0] === lanh.moi, `${lop}: vong 1 nap ban lanh cu hon`,
      `CHAN HANG DOI ${lop}: vòng 1 nạp ${v1.nap.join(", ") || "0"} (mong ${lanh.moi})`);
    ok(v1.rc === 1, `${lop}: vong 1 thoat 1 (lan dau phat hien)`, `MA THOAT SAI ${lop}: vòng 1 thoát ${v1.rc}`);
    if (dongLog.length === 0) ok(false, "", `IM LANG ${lop}: 0 dòng log nêu ${hong.moi}`);
    else ok(dongLog.length === 1 && khuon.test(dongLog[0]), `${lop}: mot dong log goi ten ban hong — ${dongLog[0].replace(/^\S+ /, "")}`,
      `LOG SAI KHUON ${lop}: ${dongLog.length} dòng — ${JSON.stringify(dongLog)}`);
    const dau = docDau(g), muc = dau?.[hong.moi];
    const lucDung = typeof muc?.luc === "string" && /Z$/.test(muc.luc) && !Number.isNaN(Date.parse(muc.luc));
    if (!muc) ok(false, "", `KHONG DANH DAU ${lop}: ${JSON.stringify(dau)}`);
    else ok(typeof muc.lyDo === "string" && muc.lyDo.trim() !== "" && lucDung,
      `${lop}: ban hong co trong tep danh dau (lyDo «${muc.lyDo}» · luc ${muc.luc})`, `LUC KHONG UTC ${lop}: ${JSON.stringify(muc)}`);
    if (dau) ok(Object.keys(dau).every((id) => id.startsWith("hanoi__")), `${lop}: khoa danh dau la ten thu muc co tien to vung`,
      `KHOA KHONG VUNG ${lop}: ${Object.keys(dau).join(", ")}`);
    ok(vanTay(hong.d) === truoc, `${lop}: ban hong y nguyen (khong xoa, khong sua)`, `SUA RAW ${lop}: thư mục bản hỏng đổi`);
    const v2 = vong(g, `${lop}-2`);
    const lap = v2.out.split("\n").filter((l) => l.includes("bỏ qua snapshot hỏng")).length;
    ok(v2.rc === 0 && v2.nap.length === 0 && lap === 0, `${lop}: vong 2 khong chon lai, khong lap log, thoat 0`,
      `CHON LAI ${lop}: vòng 2 thoát ${v2.rc} · nạp ${v2.nap.join(", ") || "0"} · ${lap} dòng log lặp`);
  }

  // --- vùng toàn bản hỏng (không còn bản lành): 0 lời gọi bộ nạp, mỗi bản một dòng log, thoát 1; vòng 2 im, thoát 0 ---
  {
    const g = dungGoc(); goc.push(g.T);
    const h1 = datHanoi(g, tatCa[k++]), h2 = datHanoi(g, tatCa[k++]);
    lamHong(h1.d, "checksum-sai"); lamHong(h2.d, "thieu-manifest");
    const v1 = vong(g, "toan-hong-1");
    const logs = v1.out.split("\n").filter((l) => l.includes("bỏ qua snapshot hỏng"));
    const goiRong = /❌ nạp/.test(v1.out); // bộ nạp bị gọi (đối số rỗng hay chữ cờ) thì in dòng ❌ nạp …
    ok(v1.nap.length === 0 && !goiRong && v1.rc === 1 && logs.length === 2,
      "vung toan hong: 0 lan nap · 2 dong log · thoat 1", `GOI NAP RONG: thoát ${v1.rc} · nạp ${v1.nap.join(", ") || "0"} · ${logs.length} dòng log`);
    const v2 = vong(g, "toan-hong-2");
    ok(v2.rc === 0 && v2.nap.length === 0 && !/bỏ qua snapshot hỏng/.test(v2.out), "vung toan hong: vong 2 im lang · thoat 0",
      `CHON LAI toan-hong: vòng 2 thoát ${v2.rc} · nạp ${v2.nap.join(", ") || "0"}`);
  }

  // --- nạp lỗi tạm: bản LÀNH mà bộ nạp thoát 1 → KHÔNG đánh dấu, vòng sau thử lại (giữ AC-6 của ZC18) ---
  {
    const g = dungGoc({ napGia: true }); goc.push(g.T);
    const lanh = datHanoi(g, tatCa[k++]);
    const v1 = vong(g, "tam-1"), v2 = vong(g, "tam-2");
    const dau = docDau(g);
    ok(v1.rc === 1 && v2.rc === 1 && v1.nap[0] === lanh.moi && v2.nap[0] === lanh.moi && !(dau && dau[lanh.moi]),
      "nap loi tam: khong danh dau · vong sau thu lai", `DANH DAU NHAM: vòng 1 ${v1.rc}/${v1.nap} · vòng 2 ${v2.rc}/${v2.nap} · dấu ${JSON.stringify(dau)}`);
  }

  // --- tệp đánh dấu hỏng: wrapper không nổ, vẫn bỏ qua bản hỏng và nạp bản lành ---
  {
    const g = dungGoc(); goc.push(g.T);
    const lanh = datHanoi(g, tatCa[k++]), hong = datHanoi(g, tatCa[k++]);
    lamHong(hong.d, "checksum-sai");
    mkdirSync(g.GOC, { recursive: true }); writeFileSync(join(g.GOC, "bo-qua-hong.json"), "{hong");
    const v1 = vong(g, "dau-hong");
    ok(v1.nap.length === 1 && v1.nap[0] === lanh.moi && docDau(g)?.[hong.moi], "tep danh dau hong: khong no · van chon dung",
      `DAU HONG LAM NO: thoát ${v1.rc} · nạp ${v1.nap.join(", ") || "0"}`);
  }

  // --- đột biến: wrapper bỏ bước kiểm (bản chép trong thư mục tạm, mã thật không đụng) → ca checksum phải đỏ ---
  {
    const goc_ = readFileSync(join(ROOT, "scripts/thu-duoi-s06.sh"), "utf8");
    const MOC = "/* ZC26-KIEM */";
    if (!goc_.includes(MOC)) { console.log("DOT BIEN KHONG TIM THAY CHO PHA (chưa có mốc ZC26-KIEM trong wrapper)"); soDo++; }
    else {
      const pha = goc_.replace(MOC, "/* ZC26-KIEM */ hongVi = () => null;");
      const g = dungGoc({ wrapper: pha }); goc.push(g.T);
      const lanh = datHanoi(g, tatCa[k++]), hong = datHanoi(g, tatCa[k++]);
      lamHong(hong.d, "checksum-sai");
      const v1 = vong(g, "dot-bien");
      ok(!(v1.nap.length === 1 && v1.nap[0] === lanh.moi), "dot bien bo kiem: bi bat (ban lanh bi chan)",
        `DOT BIEN SONG: wrapper bỏ kiểm vẫn nạp ${lanh.moi}`);
    }
  }
} catch (e) {
  probeHong = e?.stack ?? String(e);
} finally {
  await db.end();
  for (const t of goc) rmSync(t, { recursive: true, force: true });
}
if (probeHong) { console.log(`PROBE HONG: ${probeHong}`); process.exit(2); }
console.log(soDo === 0 ? "BO-QUA-HONG OK" : `BO-QUA-HONG DO (${soDo} ca)`);
process.exit(soDo === 0 ? 0 : 1);
