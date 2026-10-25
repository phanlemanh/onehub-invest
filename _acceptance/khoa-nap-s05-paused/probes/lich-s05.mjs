#!/usr/bin/env node
// G1 (2510-14): lịch S05 2 lượt/tuần + cửa sổ bài phủ khoảng cách lượt + trần NaN-safe. Chỉ đọc tệp + gọi hàm thuần;
// không gọi Apify, không mở DB, không launchctl.
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
let fail = 0; const check = (ok, m) => { console.log(`${ok ? "ok  " : "FAIL"} ${m}`); if (!ok) fail++; };
const PLIST = join(ROOT, "pipeline/cron/com.oneinvest.apify-facebook.plist");
const lint = spawnSync("plutil", ["-lint", PLIST], { encoding: "utf8" });
check(lint.status === 0, `plist hợp lệ (plutil -lint: ${lint.stdout.trim()})`);
const j = JSON.parse(spawnSync("plutil", ["-convert", "json", "-o", "-", PLIST], { encoding: "utf8" }).stdout);
const cal = j.StartCalendarInterval ?? [];
const lich = cal.map((c) => `${c.Weekday}@${c.Hour}:${String(c.Minute).padStart(2, "0")}`).sort().join(",");
check(lich === "2@6:00,5@6:00", `lịch đúng Thứ Ba + Thứ Sáu 06:00 (được ${lich})`);
check(cal.every((c) => c.Weekday !== undefined), "should-NOT-fire: không còn mục lịch hằng ngày (mọi mục có Weekday)");
const env = j.EnvironmentVariables ?? {};
check(env.S05_RESULTS_LIMIT === "100", `plist khai S05_RESULTS_LIMIT=100 (được ${env.S05_RESULTS_LIMIT})`);
const days = Number(String(env.S05_NEWER_THAN ?? "").match(/^(\d+)\s*day/)?.[1] ?? 0);
// khoảng cách lượt dài nhất của Ba(2)/Sáu(5): Sáu → Ba = 4 ngày
check(days >= 4, `cửa sổ bài plist ≥ 4 ngày, phủ khoảng Sáu→Ba (được '${env.S05_NEWER_THAN}')`);
const mod = await import(pathToFileURL(join(ROOT, "pipeline/apify-facebook-collector.mjs")).href);
const run = (e) => { const keep = { ...process.env }; Object.assign(process.env, e); for (const k of Object.keys(e)) if (e[k] === undefined) delete process.env[k]; try { return mod.buildRunInput(["https://acc.invalid/g1", "https://acc.invalid/g2"]); } finally { for (const k of ["S05_RESULTS_LIMIT", "S05_NEWER_THAN"]) { if (keep[k] === undefined) delete process.env[k]; else process.env[k] = keep[k]; } } };
let x = run({ S05_RESULTS_LIMIT: undefined, S05_NEWER_THAN: undefined });
check(x.resultsLimit === 100 && /^4 day/.test(x.onlyPostsNewerThan), `mặc định không env: trần 100, cửa sổ '${x.onlyPostsNewerThan}'`);
check(x.onlyPostsNewerThan !== "12 hours", "should-NOT-fire: không còn cửa sổ 12 giờ của lịch cũ");
x = run({ S05_RESULTS_LIMIT: "rác", S05_NEWER_THAN: "7 days" });
check(x.resultsLimit === 100 && x.onlyPostsNewerThan === "7 days", `env rác cho trần → 100 (được ${x.resultsLimit}); cửa sổ đọc env (${x.onlyPostsNewerThan})`);
x = run({ S05_RESULTS_LIMIT: "-5" });
check(x.resultsLimit === 100, `trần âm → 100 (được ${x.resultsLimit})`);
x = run({ S05_RESULTS_LIMIT: "60" });
check(x.resultsLimit === 60 && x.startUrls.length === 2, "trần hợp lệ được giữ; mỗi nhóm một startUrl");
if (fail) { console.log(`LICH-S05 FAIL (${fail} mục)`); process.exit(1); }
console.log("LICH-S05 PASS");
