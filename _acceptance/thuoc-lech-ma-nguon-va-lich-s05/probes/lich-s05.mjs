#!/usr/bin/env node
// thuoc-lech-ma-nguon-va-lich-s05 AC-3 — thay khoa-nap-s05-paused/E11 và khoa-nap-s05-paused/E12. Giữ mọi kiểm của probe cũ
// (`_acceptance/khoa-nap-s05-paused/probes/lich-s05.mjs`), riêng cửa sổ mặc định đo bằng QUAN HỆ: bằng hằng
// S05_NEWER_THAN_MAC_DINH của bộ thu và hằng ấy ≥ 4 ngày (phủ khoảng Sáu → Ba). Chỉ đọc tệp + gọi hàm thuần; không gọi Apify,
// không mở DB, không launchctl.
//   node <tệp>              — đo trên cây
//   node <tệp> --tu-kiem    — hai đột biến (hằng 3 ngày · bộ dựng trả cứng 3 ngày) phải FAIL đúng kiểm; «4 days», «96 hours» qua
import { spawnSync } from "node:child_process";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const PLIST = join(ROOT, "pipeline/cron/com.oneinvest.apify-facebook.plist");
const BIEN = ["S05_RESULTS_LIMIT", "S05_NEWER_THAN"];
const KIEM_BANG = "cửa sổ mặc định bằng S05_NEWER_THAN_MAC_DINH";
const KIEM_DU = "S05_NEWER_THAN_MAC_DINH ≥ 4 ngày";

/** Số ngày của chuỗi kiểu Apify «N days|hours|weeks»; không đọc được → NaN. */
export function soNgay(s) {
  const m = /^\s*(\d+(?:\.\d+)?)\s*(day|hour|week)s?\s*$/i.exec(String(s ?? ""));
  if (!m) return NaN;
  const n = Number(m[1]);
  return m[2].toLowerCase() === "hour" ? n / 24 : m[2].toLowerCase() === "week" ? n * 7 : n;
}

/** Hai kiểm quan hệ của cửa sổ mặc định; trả danh sách {ok, ten, chi}. */
export function kiemCuaSo(macDinh, buildRunInput) {
  const x = chayKhongEnv(buildRunInput);
  return [
    { ok: x.onlyPostsNewerThan === macDinh, ten: KIEM_BANG, chi: `được '${x.onlyPostsNewerThan}', hằng '${macDinh}'` },
    { ok: soNgay(macDinh) >= 4, ten: KIEM_DU, chi: `hằng '${macDinh}' = ${soNgay(macDinh)} ngày` },
  ];
}

function chayVoiEnv(buildRunInput, e) {
  const keep = Object.fromEntries(BIEN.map((k) => [k, process.env[k]]));
  for (const [k, v] of Object.entries(e)) { if (v === undefined) delete process.env[k]; else process.env[k] = v; }
  try { return buildRunInput(["https://acc.invalid/g1", "https://acc.invalid/g2"]); }
  finally { for (const k of BIEN) { if (keep[k] === undefined) delete process.env[k]; else process.env[k] = keep[k]; } }
}
const chayKhongEnv = (b) => chayVoiEnv(b, { S05_RESULTS_LIMIT: undefined, S05_NEWER_THAN: undefined });

async function doTrenCay() {
  let fail = 0;
  const check = (ok, m) => { console.log(`${ok ? "ok  " : "FAIL"} ${m}`); if (!ok) fail++; };
  const lint = spawnSync("plutil", ["-lint", PLIST], { encoding: "utf8" });
  check(lint.status === 0, `plist hợp lệ (plutil -lint: ${lint.stdout.trim()})`);
  const j = JSON.parse(spawnSync("plutil", ["-convert", "json", "-o", "-", PLIST], { encoding: "utf8" }).stdout);
  const cal = j.StartCalendarInterval ?? [];
  const lich = cal.map((c) => `${c.Weekday}@${c.Hour}:${String(c.Minute).padStart(2, "0")}`).sort().join(",");
  check(lich === "2@6:00,5@6:00", `lịch đúng Thứ Ba + Thứ Sáu 06:00 (được ${lich})`);
  check(cal.every((c) => c.Weekday !== undefined), "should-NOT-fire: không còn mục lịch hằng ngày (mọi mục có Weekday)");
  const env = j.EnvironmentVariables ?? {};
  check(env.S05_RESULTS_LIMIT === "100", `plist khai S05_RESULTS_LIMIT=100 (được ${env.S05_RESULTS_LIMIT})`);
  check(soNgay(env.S05_NEWER_THAN) >= 4, `cửa sổ bài plist ≥ 4 ngày, phủ khoảng Sáu→Ba (được '${env.S05_NEWER_THAN}')`);
  const mod = await import(pathToFileURL(join(ROOT, "pipeline/apify-facebook-collector.mjs")).href);
  for (const k of kiemCuaSo(mod.S05_NEWER_THAN_MAC_DINH, mod.buildRunInput)) check(k.ok, `${k.ten} (${k.chi})`);
  const x0 = chayKhongEnv(mod.buildRunInput);
  check(x0.resultsLimit === 100, `mặc định không env: trần 100 (được ${x0.resultsLimit})`);
  check(x0.onlyPostsNewerThan !== "12 hours", "should-NOT-fire: không còn cửa sổ 12 giờ của lịch cũ");
  let x = chayVoiEnv(mod.buildRunInput, { S05_RESULTS_LIMIT: "rác", S05_NEWER_THAN: "7 days" });
  check(x.resultsLimit === 100 && x.onlyPostsNewerThan === "7 days", `env rác cho trần → 100 (được ${x.resultsLimit}); cửa sổ đọc env (${x.onlyPostsNewerThan})`);
  x = chayVoiEnv(mod.buildRunInput, { S05_RESULTS_LIMIT: "-5" });
  check(x.resultsLimit === 100, `trần âm → 100 (được ${x.resultsLimit})`);
  x = chayVoiEnv(mod.buildRunInput, { S05_RESULTS_LIMIT: "60" });
  check(x.resultsLimit === 60 && x.startUrls.length === 2, "trần hợp lệ được giữ; mỗi nhóm một startUrl");
  if (fail) { console.log(`TL-LICH-S05 FAIL (${fail} mục)`); return 1; }
  console.log("TL-LICH-S05 PASS");
  return 0;
}

function tuKiem() {
  let sai = 0;
  const mong = (ten, kq, tenFail) => {
    const fails = kq.filter((k) => !k.ok).map((k) => k.ten);
    const dung = tenFail === null ? fails.length === 0 : fails.length === 1 && fails[0] === tenFail;
    for (const k of kq.filter((k) => !k.ok)) console.log(`  ${ten}: FAIL ${k.ten} (${k.chi})`);
    console.log(`${dung ? "ok  " : "SAI "} ${ten}: mong ${tenFail === null ? "không FAIL" : `đúng FAIL ${tenFail}`}`);
    if (!dung) sai++;
  };
  const theoHang = (hang) => () => ({ onlyPostsNewerThan: process.env.S05_NEWER_THAN ?? hang });
  mong("đột biến hằng '3 days'", kiemCuaSo("3 days", theoHang("3 days")), KIEM_DU);
  mong("đột biến bộ dựng trả cứng '3 days'", kiemCuaSo("5 days", () => ({ onlyPostsNewerThan: "3 days" })), KIEM_BANG);
  mong("đối chứng '4 days'", kiemCuaSo("4 days", theoHang("4 days")), null);
  mong("đối chứng '96 hours'", kiemCuaSo("96 hours", theoHang("96 hours")), null);
  console.log(sai ? `TL-LICH-S05 TU-KIEM FAIL (${sai})` : "TL-LICH-S05 TU-KIEM PASS");
  return sai ? 1 : 0;
}

process.exitCode = process.argv.includes("--tu-kiem") ? tuKiem() : await doTrenCay();
