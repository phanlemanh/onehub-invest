#!/usr/bin/env node
// so-cat-chuyen.mjs — HT5 AC-7: `pipeline/phat-bieu-cat-chuyen.mjs --thu` dùng chung napPhatBieu; so đầu ra với napPhatBieu của
// main f962afade và của nhánh, trên bản chép db/db-thu.sh (mỗi lượt một bản chép, giao dịch ROLLBACK).
//   --chay   chạy hai lượt, ghi so-cat-chuyen.md (hai khối đầu ra + bảng «Dòng lệch» với cột lý do để trống cho người viết)
//   --kiem   (eval E7) không chạy DB: đọc so-cat-chuyen.md, tính lại dòng lệch từ hai khối, mọi dòng lệch phải có lý do.
// Phá thử: --kiem --bo-ly-do (xoá lý do dòng lệch đầu trong bản đọc) · --kiem --cay-lech (cấy một dòng lệch không lý do).
import { execFileSync, spawnSync } from "node:child_process";
import { readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const HO_SO = join(dirname(fileURLToPath(import.meta.url)), "..");
const GOC = join(HO_SO, "../..");
const TEP = join(HO_SO, "so-cat-chuyen.md");
const MAIN = "f962afade8ce5122a9f0b5975dba28db7c31eeb1";

function chayMot(tepChay) {
  const r = spawnSync("bash", [join(GOC, "db/db-thu.sh"), "oneinvest_suite_ht5cc", "--chay", process.execPath, tepChay, "--thu"],
    { cwd: GOC, encoding: "utf8", timeout: 3_600_000 });
  return { ma: r.status, out: `${r.stdout}${r.stderr}`.trim() };
}

/** Dòng có chữ số khác nhau giữa hai khối (so theo tập dòng). */
export function dongLech(a, b) {
  const sa = new Set(a.split("\n")), sb = new Set(b.split("\n"));
  return [...new Set([...a.split("\n").filter((d) => !sb.has(d)), ...b.split("\n").filter((d) => !sa.has(d))])]
    .filter((d) => /\d/.test(d)).map((d) => d.trim()).filter(Boolean);
}

function chay() {
  const libMain = join(GOC, "pipeline/lib/.nap-045-main-ht5.mjs");
  const chayMain = join(GOC, "pipeline/.cat-chuyen-main-ht5.mjs");
  writeFileSync(libMain, execFileSync("git", ["-C", GOC, "show", `${MAIN}:pipeline/lib/nap-045.mjs`], { encoding: "utf8" }));
  writeFileSync(chayMain, readFileSync(join(GOC, "pipeline/phat-bieu-cat-chuyen.mjs"), "utf8")
    .replace('from "./lib/nap-045.mjs"', 'from "./lib/.nap-045-main-ht5.mjs"'));
  let m, n;
  try {
    m = chayMot(chayMain);
  } finally {
    rmSync(libMain, { force: true });
    rmSync(chayMain, { force: true });
  }
  n = chayMot(join(GOC, "pipeline/phat-bieu-cat-chuyen.mjs"));
  const lech = dongLech(m.out, n.out);
  const md = [
    "# Soát phat-bieu-cat-chuyen --thu trước/sau HT5 (AC-7)",
    "",
    `Máy sinh bằng \`node _acceptance/kdm-ac-3-luot-nen-dung-ham-phan-xu-hien-hanh/probes/so-cat-chuyen.mjs --chay\` lúc ${new Date().toISOString()}, mỗi lượt một bản chép db-thu, giao dịch ROLLBACK.`,
    "",
    `## Main ${MAIN.slice(0, 9)} (mã thoát ${m.ma})`, "", "```text", m.out, "```", "",
    `## Nhánh HT5 (mã thoát ${n.ma})`, "", "```text", n.out, "```", "",
    "## Dòng lệch", "", "| Dòng | Lý do |", "|---|---|",
    ...lech.map((d) => `| ${d.replace(/\|/g, "/")} |  |`),
    ...(lech.length ? [] : ["| (không có) | hai lượt in cùng bộ dòng số |"]),
    "",
  ].join("\n");
  writeFileSync(TEP, md);
  console.log(`main mã ${m.ma} · nhánh mã ${n.ma} · ${lech.length} dòng lệch → ${TEP}`);
}

function kiem({ boLyDo = false, cayLech = false } = {}) {
  const md = readFileSync(TEP, "utf8");
  const khoi = [...md.matchAll(/```text\n([\s\S]*?)\n```/g)].map((x) => x[1]);
  const loi = [];
  if (khoi.length !== 2) loi.push(`AC-7 cần đủ hai khối đầu ra, có ${khoi.length}`);
  const bang = new Map([...md.matchAll(/^\| (.+?) \| (.*?) \|$/gm)].filter((x) => x[1] !== "Dòng" && !/^-+$/.test(x[1]))
    .map((x) => [x[1], x[2].trim()]));
  let lech = khoi.length === 2 ? dongLech(khoi[0], khoi[1]).map((d) => d.replace(/\|/g, "/")) : [];
  if (cayLech) lech = [...lech, "dòng cấy 123 lệch"];
  if (boLyDo && lech.length) bang.set(lech[0], "");
  for (const d of lech) if (!bang.get(d)) loi.push(`AC-7 dòng lệch thiếu lý do: «${d.slice(0, 80)}»`);
  // Mã thoát của công cụ không phải lời hứa của HT5 (cắt chuyển đã chạy thật; --thu trên dữ liệu hôm nay lệch ở cả main) —
  // lời hứa là bản sửa không đổi đầu ra: hai lượt cùng mã thoát.
  const ma = [...md.matchAll(/^## .*\(mã thoát (\S+)\)$/gm)].map((x) => x[1]);
  if (ma.length !== 2 || ma[0] !== ma[1]) loi.push(`AC-7 mã thoát hai lượt khác nhau: ${ma.join(" / ")}`);
  console.log(`hai khối ${khoi.length} · dòng lệch ${lech.length}`);
  for (const l of loi) console.error(`ĐỎ ${l}`);
  process.exit(loi.length ? 1 : 0);
}

const a = process.argv.slice(2);
if (a.includes("--chay")) chay();
else if (a.includes("--kiem")) kiem({ boLyDo: a.includes("--bo-ly-do"), cayLech: a.includes("--cay-lech") });
else { console.error("dùng: so-cat-chuyen.mjs --chay | --kiem [--bo-ly-do|--cay-lech]"); process.exit(2); }
