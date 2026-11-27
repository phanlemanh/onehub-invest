#!/usr/bin/env node
// chon-nap.mjs — E5 (AC-5) của s06-thu-duoi-lich-va-chon-snapshot (ZC18).
//
// Chạy wrapper THẬT scripts/thu-duoi-s06.sh với bộ nạp THẬT pipeline/import-chotot.mjs trên DB của riêng lượt.
// Chỉ thay hai thứ: bộ thu (collect-s06-duoi.mjs → stub không gọi mạng, snapshot đặt sẵn) và pgrep (không thấy lượt
// quét đủ, để kết quả không phụ thuộc giờ chạy). Snapshot là bản thật của phép đo 24 giờ của làn thu (writer thật).
//
// Kịch bản:
//   vòng 1: hai snapshot S1 < S2 ở hcmc, hanoi chưa có gì → nạp đúng 1 (S2), hanoi 0
//   vòng 2: nạp S1 (tồn đọng thật)
//   đè:     giả lượt quét đủ 05:30 — snapshot_id và captured_at của mọi dòng S1, S2 bị bản ngày mới hơn thay (đúng việc
//           UPSERT của import-chotot làm khi lượt quét đủ thu lại cùng tin)
//   vòng 3, 4: không snapshot mới → phải nạp 0; nội dung stg không lùi
//   đối chứng dương: đặt S3 mới hơn → vòng 5 nạp đúng 1 (S3)
//   E11 (AC-10): không cấu hình → chỉ gọi bộ thu cho hcmc; THU_DUOI_S06_VUNG="hcmc" → hanoi 0 lời gọi + dòng «bỏ vùng»;
//                hai vùng → gọi cả hai
//   E12 (AC-11): bộ thu thoát 3 ở vùng đầu → exit 3, dấu chặn có hạn, vùng sau không gọi; còn hạn → 0 lời gọi; hết hạn → chạy lại
//                chặn lần hai trong 24 giờ → dấu dừng hẳn, 0 lời gọi dù hết nghỉ, người gỡ thì chạy lại; sau 24 giờ hay tắt luật → chỉ nghỉ
//
// Dùng: bash db/db-thu.sh oneinvest_suite_s06tl --chay-trong node <tệp này>
// Đường phép đo: $S06_DUOI_DO (mặc định worktree ZT). Không ghi gì ngoài thư mục tạm và DB của lượt.
import { execFileSync, spawnSync } from "node:child_process";
import { cpSync, existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, symlinkSync, writeFileSync, chmodSync } from "node:fs";
import { tmpdir, homedir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const URL_DB = process.env.DATABASE_URL ?? "";
const tenDb = URL_DB.split("/").pop()?.split("?")[0] ?? "";
if (!/^oneinvest_suite_/.test(tenDb)) {
  console.log(`tu choi DB: «${tenDb || "(trống)"}» không mang tên oneinvest_suite_*`);
  process.exit(2);
}
const DO = process.env.S06_DUOI_DO ?? join(homedir(), "dev/onehub-wt/zt-thu-duoi-s06-do/state/phep-do-s06-24h");
const KHO = join(DO, "snapshots/hcmc");
let tatCa;
try {
  tatCa = readdirSync(KHO).filter((n) => n.startsWith("hcmc__chotot-ads__")).sort()
    .filter((n) => JSON.parse(readFileSync(join(KHO, n, "manifest.json"), "utf8")).counts?.items > 0);
} catch {
  console.log(`KHONG CO PHEP DO: ${KHO}`);
  process.exit(2);
}
if (tatCa.length < 4) { console.log("KHONG CO PHEP DO: cần ≥ 4 snapshot có tin"); process.exit(2); }
const [S1, S2, S3, S4] = [tatCa[0], tatCa[1], tatCa[2], tatCa[3]];
console.log(`fixture tu writer that: ${tatCa.length} snapshot hcmc của phép đo 24 giờ (bộ thu đuôi ghi), dùng ${S1} · ${S2} · ${S3} · ${S4}`);

const pg = (await import(join(ROOT, "pipeline/node_modules/pg/lib/index.js"))).default;
const db = new pg.Client({ connectionString: URL_DB });
await db.connect();
const q = (sql, v) => db.query(sql, v);

// --- dựng gốc tạm: wrapper bản của nhánh, pipeline/ là symlink từng mục trừ bộ thu (stub) ---
const T = mkdtempSync(join(tmpdir(), "zc18-chon-nap-"));
const HOME_TAM = join(T, "home"); mkdirSync(HOME_TAM);
mkdirSync(join(T, "scripts"));
cpSync(join(ROOT, "scripts/thu-duoi-s06.sh"), join(T, "scripts/thu-duoi-s06.sh"));
mkdirSync(join(T, "pipeline"));
for (const m of readdirSync(join(ROOT, "pipeline"))) {
  if (m === "collect-s06-duoi.mjs") continue;
  symlinkSync(join(ROOT, "pipeline", m), join(T, "pipeline", m));
}
// stub bộ thu: ghi đối số vào STUB_LOG, thoát theo STUB_RC — snapshot đặt sẵn, 0 lời gọi nguồn
const STUB_LOG = join(T, "stub.log");
writeFileSync(join(T, "pipeline/collect-s06-duoi.mjs"),
  `import { appendFileSync } from "node:fs";\nappendFileSync(${JSON.stringify(STUB_LOG)}, process.argv.slice(2).join(" ") + "\\n");\nprocess.exit(Number(process.env.STUB_RC ?? 0));\n`);
const goiStub = () => { try { return readFileSync(STUB_LOG, "utf8").split("\n").filter(Boolean); } catch { return []; } };
const SHIM = join(T, "shim"); mkdirSync(SHIM);
writeFileSync(join(SHIM, "pgrep"), "#!/bin/sh\nexit 1\n"); chmodSync(join(SHIM, "pgrep"), 0o755);
const GOC = join(T, "state/thu-duoi-s06");
// Bản chép giữ quyền chỉ-đọc của phép đo; mở quyền ghi cho bản chép (không chạm bản gốc) để ghi và dọn được.
const moQuyen = (p) => { for (const n of readdirSync(p, { withFileTypes: true })) { const c = join(p, n.name);
  if (n.isDirectory()) { chmodSync(c, 0o755); moQuyen(c); } else chmodSync(c, 0o644); } };
const chep = (tu, toi) => { cpSync(tu, toi, { recursive: true }); chmodSync(toi, 0o755); moQuyen(toi); };
const datSnap = (id) => chep(join(KHO, id), join(GOC, "snapshots/hcmc", id));

// --- hạt giống DB: S06 chạy được ở đúng hai vùng hcmc, hanoi ---
await q("UPDATE source_registry SET status='active' WHERE code='S06'");
await q("DELETE FROM source_groups WHERE source_code='S06'");
for (const v of ["hanoi", "hcmc"]) {
  await q("INSERT INTO source_groups (source_code, group_key, name, status) VALUES ('S06',$1,$1,'active')", [v]);
}

let soDo = 0;
let probeHong = null;
const ok = (dk, dong, dongDo) => { if (dk) console.log(dong); else { console.log(dongDo); soDo++; } };
function vong(nhan, them = {}) {
  const env = { PATH: `${SHIM}:${dirname(process.execPath)}:/usr/bin:/bin`, HOME: HOME_TAM, DATABASE_URL: URL_DB, THU_DUOI_S06_GOC: GOC, ...them };
  for (const k of Object.keys(env)) if (env[k] === undefined) delete env[k];
  rmSync(STUB_LOG, { force: true });
  const r = spawnSync("bash", [join(T, "scripts/thu-duoi-s06.sh")], { encoding: "utf8", env });
  const nap = [...(r.stdout ?? "").matchAll(/nạp snapshot đuôi (\S+)/g)].map((m) => m[1].split("/").pop());
  console.log(`vong ${nhan}: exit ${r.status} · nap ${nap.length}${nap.length ? " (" + nap.join(", ") + ")" : ""}`);
  if (r.status !== 0) console.log((r.stdout ?? "") + (r.stderr ?? ""));
  return { rc: r.status, nap, stub: goiStub(), out: (r.stdout ?? "") + (r.stderr ?? "") };
}
const demStg = async (id) => Number((await q("SELECT count(*) FROM stg_chotot_ads WHERE snapshot_id=$1", [id])).rows[0].count);
const soTin = (id) => JSON.parse(readFileSync(join(KHO, id, "manifest.json"), "utf8")).counts.items;

try {
  // --- ca điều khiển (AC-1, AC-3, AC-4, AC-6) — in trước, độc lập với ca chọn-nạp ---
  const vMd = vong("goc-mac-dinh", { THU_DUOI_S06_GOC: undefined });
  const gocDung = vMd.stub.map((l) => /--goc (\S+)/.exec(l)?.[1]);
  ok(vMd.rc === 0 && gocDung.length > 0 && gocDung.every((g) => g === join(T, "state/thu-duoi-s06")),
    "goc mac dinh: moi --goc duoi state/thu-duoi-s06 · 0 duong duoi collector/snapshots", `GHI VAO COLLECTOR hoặc gốc lạ: ${gocDung.join(", ")}`);
  ok(vMd.rc === 0 && vMd.nap.length === 0, "khong snapshot: exit 0 · nap 0", `CHON-NAP DO không snapshot: exit ${vMd.rc} · nap ${vMd.nap.length}`);
  ok(!existsSync(join(T, "state/thu-duoi-s06.lock")), "khoa go sau vong xanh", "KHOA SOT sau vòng xanh");
  const vCol = vong("goc-collector", { THU_DUOI_S06_GOC: join(T, "collector/snapshots") });
  ok(vCol.rc === 1 && !existsSync(join(T, "collector")) && vCol.stub.length === 0,
    "goc trong collector: exit 1 · khong tao thu muc · 0 loi goi bo thu", `GHI VAO COLLECTOR: exit ${vCol.rc} · thư mục ${existsSync(join(T, "collector"))}`);
  const vDb = vong("db-loi", { DATABASE_URL: "postgres://khong:dung@127.0.0.1:1/oneinvest_suite_khong_co" });
  ok(vDb.rc === 1 && vDb.stub.length === 0, "doc vung loi: exit 1 · 0 loi goi bo thu", `CHON-NAP DO DB lỗi: exit ${vDb.rc} · ${vDb.stub.length} lời gọi bộ thu`);
  // --- phạm vi vùng (AC-10): hai vùng hanoi, hcmc chạy được trong DB ---
  const vungGoi = (v) => v.stub.map((l) => /--vung (\S+)/.exec(l)?.[1]).filter(Boolean);
  const gMd = vungGoi(vMd);
  ok(gMd.length > 0 && gMd.every((x) => x === "hcmc"), "vung mac dinh: chi hcmc · loi goi vung khac 0",
    `VUNG MAC DINH CHAY CA: ${gMd.join(", ") || "(không vùng nào)"}`);
  const vMot = vong("vung-mot", { THU_DUOI_S06_VUNG: "hcmc" });
  const gMot = vungGoi(vMot);
  ok(vMot.rc === 0 && !gMot.includes("hanoi") && gMot.includes("hcmc") && /bỏ vùng hanoi/.test(vMot.out),
    "vung ngoai danh sach: 0 loi goi · co dong nhat ky", `VUNG NGOAI DANH SACH BI GOI: gọi ${gMot.join(", ")} · dòng nhật ký ${/bỏ vùng hanoi/.test(vMot.out)}`);
  const vHai = vong("vung-hai", { THU_DUOI_S06_VUNG: "hanoi hcmc" });
  const gHai = vungGoi(vHai);
  ok(vHai.rc === 0 && gHai.includes("hanoi") && gHai.includes("hcmc"), "vung cau hinh hai vung: goi ca hai",
    `CHON-NAP DO hai vùng: gọi ${gHai.join(", ")}`);

  // --- nghỉ sau bị chặn (AC-11): bộ thu thoát 3 ở vùng đầu (hanoi, theo thứ tự source_groups) ---
  const BI_CHAN = join(GOC, "bi-chan.json");
  const vChan = vong("ma-3", { STUB_RC: "3", THU_DUOI_S06_VUNG: "hanoi hcmc" });
  ok(vChan.rc === 3 && vChan.nap.length === 0 && !existsSync(join(T, "state/thu-duoi-s06.lock")),
    "ma 3: exit 3 · nap 0 · khoa go", `CHON-NAP DO mã 3: exit ${vChan.rc} · nap ${vChan.nap.length}`);
  let het = NaN;
  try { het = Date.parse(JSON.parse(readFileSync(BI_CHAN, "utf8")).hetLuc); } catch { /* không có dấu */ }
  ok(vChan.rc === 3 && het > Date.now() && het <= Date.now() + 24 * 3600_000,
    "chan: vong 1 exit 3 · co dau chan co han", `KHONG DAU CHAN: exit ${vChan.rc} · hetLuc ${Number.isNaN(het) ? "(không có)" : new Date(het).toISOString()}`);
  const gChan = vungGoi(vChan);
  ok(gChan.length === 1 && gChan[0] === "hanoi", "chan giua chung: vung sau khong goi", `CHON-NAP DO chặn giữa chừng: gọi ${gChan.join(", ")}`);
  const vCon = vong("con-han", { THU_DUOI_S06_VUNG: "hanoi hcmc" });
  ok(vCon.rc === 0 && vCon.stub.length === 0 && vCon.nap.length === 0, "con han: vong 2 exit 0 · 0 loi goi bo thu · 0 loi nap",
    `GOI NGUON KHI CON HAN: exit ${vCon.rc} · ${vCon.stub.length} lời gọi bộ thu · nap ${vCon.nap.length}`);
  writeFileSync(BI_CHAN, JSON.stringify({ hetLuc: new Date(Date.now() - 60_000).toISOString().replace(/\.\d+Z$/, "Z") }));
  const vHet = vong("het-han", { THU_DUOI_S06_VUNG: "hanoi hcmc" });
  ok(vHet.rc === 0 && vHet.stub.length > 0 && !existsSync(BI_CHAN), "het han: vong 3 goi bo thu",
    `KET HAN: exit ${vHet.rc} · ${vHet.stub.length} lời gọi bộ thu · dấu còn ${existsSync(BI_CHAN)}`);
  rmSync(BI_CHAN, { force: true });

  // --- luật chặn lần hai trong 24 giờ (AC-11, Hỏi-3): dừng hẳn tới khi người gỡ dấu ---
  const LAN_CHAN = join(GOC, "lan-chan.json"), DUNG_HAN = join(GOC, "dung-han.json");
  const iso = (ms) => new Date(ms).toISOString().replace(/\.\d+Z$/, "Z");
  const vHai2 = vong("lan-hai", { STUB_RC: "3", THU_DUOI_S06_VUNG: "hanoi hcmc" }); // lan-chan.json còn từ vòng ma-3
  ok(vHai2.rc === 3 && existsSync(DUNG_HAN), "lan hai trong 24 gio: exit 3 · co dau dung han",
    `KHONG DUNG HAN: exit ${vHai2.rc} · dấu ${existsSync(DUNG_HAN)}`);
  rmSync(BI_CHAN, { force: true }); // hết hạn nghỉ cũng không được chạy lại
  const vDung = vong("dung-han", { THU_DUOI_S06_VUNG: "hanoi hcmc" });
  ok(vDung.rc === 0 && vDung.stub.length === 0 && vDung.out.includes(`rm ${DUNG_HAN}`),
    "dung han: 0 loi goi du het han nghi · co dong go dau", `GOI NGUON KHI DUNG HAN: exit ${vDung.rc} · ${vDung.stub.length} lời gọi bộ thu`);
  rmSync(DUNG_HAN, { force: true });
  const vGo = vong("nguoi-go", { THU_DUOI_S06_VUNG: "hanoi hcmc" });
  ok(vGo.rc === 0 && vGo.stub.length > 0, "nguoi go dau: vong sau goi bo thu", `KET SAU KHI GO: exit ${vGo.rc} · ${vGo.stub.length} lời gọi`);
  writeFileSync(LAN_CHAN, JSON.stringify({ lanCuoi: iso(Date.now() - 25 * 3600_000) }));
  const vXa = vong("lan-hai-sau-24h", { STUB_RC: "3", THU_DUOI_S06_VUNG: "hanoi hcmc" });
  ok(vXa.rc === 3 && !existsSync(DUNG_HAN) && existsSync(BI_CHAN), "lan hai sau 24 gio: chi nghi",
    `DUNG HAN SAU 24 GIO: dấu dừng ${existsSync(DUNG_HAN)} · dấu nghỉ ${existsSync(BI_CHAN)}`);
  rmSync(BI_CHAN, { force: true }); rmSync(DUNG_HAN, { force: true });
  writeFileSync(LAN_CHAN, JSON.stringify({ lanCuoi: iso(Date.now() - 3600_000) }));
  const vTat = vong("tat-lan-hai", { STUB_RC: "3", THU_DUOI_S06_VUNG: "hanoi hcmc", THU_DUOI_S06_DUNG_LAN_HAI: "0" });
  ok(vTat.rc === 3 && !existsSync(DUNG_HAN) && existsSync(BI_CHAN), "tat luat lan hai: chi nghi",
    `DUNG HAN KHI TAT: dấu dừng ${existsSync(DUNG_HAN)} · dấu nghỉ ${existsSync(BI_CHAN)}`);
  for (const f of [BI_CHAN, DUNG_HAN, LAN_CHAN]) rmSync(f, { force: true });

  // --- ba giá trị Mạnh duyệt ở Cổng Phạm vi 27/11 là MẶC ĐỊNH: không đặt biến THU_DUOI_S06_* nào ---
  const vMdChan = vong("mac-dinh-chan-1", { STUB_RC: "3" });
  let hetMd = NaN;
  try { hetMd = Date.parse(JSON.parse(readFileSync(BI_CHAN, "utf8")).hetLuc); } catch { /* không có dấu */ }
  const phutMd = (hetMd - Date.now()) / 60_000;
  ok(vMdChan.rc === 3 && phutMd >= 58 && phutMd <= 62, "mac dinh nghi sau chan: 60 phut",
    `NGHI MAC DINH SAI: exit ${vMdChan.rc} · ${Number.isNaN(phutMd) ? "(không có dấu)" : phutMd.toFixed(1) + " phút"}`);
  const gMdChan = vungGoi(vMdChan);
  ok(gMdChan.length === 1 && gMdChan[0] === "hcmc", "mac dinh khi chan: chi goi hcmc",
    `VUNG MAC DINH SAI: gọi ${gMdChan.join(", ") || "(không vùng nào)"}`);
  rmSync(BI_CHAN, { force: true });
  const vMdHai = vong("mac-dinh-chan-2", { STUB_RC: "3" }); // lan-chan.json còn từ vòng trước, trong 24 giờ
  ok(vMdHai.rc === 3 && existsSync(DUNG_HAN), "mac dinh luat lan hai: bat",
    `LUAT LAN HAI MAC DINH TAT: exit ${vMdHai.rc} · dấu dừng ${existsSync(DUNG_HAN)}`);
  for (const f of [BI_CHAN, DUNG_HAN, LAN_CHAN]) rmSync(f, { force: true });
  const plist = readFileSync(join(ROOT, "pipeline/cron/com.oneinvest.thu-duoi-s06.plist"), "utf8");
  const de = ["EnvironmentVariables", "THU_DUOI_S06_VUNG", "THU_DUOI_S06_NGHI_SAU_CHAN_PHUT", "THU_DUOI_S06_DUNG_LAN_HAI"].filter((k) => plist.includes(k));
  ok(de.length === 0, "khuon plist: khong de ba gia tri", `PLIST DE GIA TRI: ${de.join(", ")}`);

  for (const ma of [4, 5]) {
    const v = vong(`ma-${ma}`, { STUB_RC: String(ma) });
    ok(v.rc === ma && v.nap.length === 0 && !existsSync(join(T, "state/thu-duoi-s06.lock")),
      `ma ${ma}: exit ${ma} · nap 0 · khoa go`, `CHON-NAP DO mã ${ma}: exit ${v.rc} · nap ${v.nap.length}`);
  }

  // --- chọn-nạp (AC-5) ---
  datSnap(S1); datSnap(S2);
  const v1 = vong(1);
  ok(v1.rc === 0 && v1.nap.length === 1 && v1.nap[0] === S2,
    "hai vung: hanoi nap 0 · hcmc nap 1 · moi vung <= 1", `CHON-NAP DO vong 1: mong nap đúng ${S2}`);
  ok(await demStg(S2) === soTin(S2), "stg tang dung so tin cua snapshot moi nhat", `CHON-NAP DO stg ${await demStg(S2)} ≠ ${soTin(S2)}`);
  const v2 = vong(2);
  ok(v2.nap.length === 1 && v2.nap[0] === S1, "ton dong: vong 2 nap S1", `CHON-NAP DO vong 2: mong nap ${S1}`);
  const v2b = vong("2b");
  ok(v2b.nap.length === 0, "da nap con trong stg: nap 0", `NAP LAI: snapshot còn trong stg bị nạp lại (${v2b.nap.join(", ")})`);

  // giả lượt quét đủ: thu lại cùng tin với captured_at mới hơn → snapshot_id bị đè
  const NGAY = "hcmc__chotot-ads__2026-11-26T053000";
  // sổ nạp trước (khoá ngoại stg_chotot_ads_snapshot_id_fkey), rồi mới đè snapshot_id — lỗi thứ tự ở lượt M5 26/11
  await q("INSERT INTO airbnb_snapshots (snapshot_id, city, source, collected_at, manifest) VALUES ($1,'hcmc','chotot-ads',now(),'{}') ON CONFLICT DO NOTHING", [NGAY]);
  await q("UPDATE stg_chotot_ads SET snapshot_id=$1, captured_at = captured_at + interval '1 day' WHERE snapshot_id = ANY($2)", [NGAY, [S1, S2]]);
  const truoc = (await q("SELECT list_id, snapshot_id, captured_at, md5(payload::text) h FROM stg_chotot_ads ORDER BY list_id")).rows;
  const v3 = vong(3), v4 = vong(4);
  ok(v3.nap.length === 0 && v4.nap.length === 0,
    "da nap roi bi luot quet du de: vong sau nap 0 · nhat ky 0 dong nap cho snapshot do",
    `NAP LAI: snapshot đã nạp bị nạp lại sau khi lượt quét đủ đè (vòng 3: ${v3.nap.join(", ") || "0"} · vòng 4: ${v4.nap.join(", ") || "0"})`);
  const sau = (await q("SELECT list_id, snapshot_id, captured_at, md5(payload::text) h FROM stg_chotot_ads ORDER BY list_id")).rows;
  ok(JSON.stringify(truoc) === JSON.stringify(sau), "noi dung stg khong lui", "NOI DUNG LUI: stg đổi sau vòng không có snapshot mới");

  datSnap(S3);
  const v5 = vong(5);
  ok(v5.nap.length === 1 && v5.nap[0] === S3, "snapshot moi sau khi bi de: van nap 1", `DOI CHUNG HONG: vòng 5 mong nạp ${S3}`);

  // --- nạp lỗi ở vùng đầu (hanoi) → vùng sau (hcmc) vẫn thử, thoát 1 (AC-6) ---
  const HN = "hanoi__chotot-ads__2026-11-24T000000";
  chep(join(KHO, S1), join(GOC, "snapshots/hanoi", HN));
  const tepItems = readdirSync(join(GOC, "snapshots/hanoi", HN)).find((f) => f.startsWith("items-"));
  writeFileSync(join(GOC, "snapshots/hanoi", HN, tepItems), "hong");
  datSnap(S4);
  const v6 = vong(6, { THU_DUOI_S06_VUNG: "hanoi hcmc" }); // AC-6 cần hai vùng: mở bằng cấu hình (AC-10)
  ok(v6.rc === 1 && v6.nap.includes(S4), "nap loi vung dau: vung sau van thu · exit 1", `CHON-NAP DO nạp lỗi: exit ${v6.rc} · nap ${v6.nap.join(", ")}`);
} catch (e) {
  // probe tự hỏng (không phải mã bị đo đỏ): in riêng, thoát 2, không đếm thành CHON-NAP DO
  probeHong = e?.message ?? String(e);
} finally {
  await db.end();
  rmSync(T, { recursive: true, force: true });
}
if (probeHong) { console.log(`PROBE HONG: ${probeHong}`); process.exit(2); }
console.log(soDo === 0 ? "CHON-NAP OK" : `CHON-NAP DO (${soDo} ca)`);
process.exit(soDo === 0 ? 0 : 1);
