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
  for (const ma of [3, 4, 5]) {
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
  const v6 = vong(6);
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
