#!/usr/bin/env node
// Soát hồ sơ áp HT26 chạy được NGUYÊN VĂN (AC-7, vòng 2 — GS 26/11). Chạy từ gốc worktree của nhánh. Mã 0 xanh · 1 đỏ · 3 thước không
// phân biệt. Ba điều:
//   1. README có đủ năm mục: lệnh áp, số chạy khô, sao lưu trước, cách lùi, lệnh kiểm sau;
//   2. mọi dòng `cd <thư mục> && node <tệp>` trong khối bash: tệp tồn tại trên nhánh; khối chạy TRƯỚC khi gộp (mục 1–3, trừ khối có nhãn
//      «Sau gộp») mà đứng ở checkout chính thì tệp phải đã có trên origin/main — chính lỗi vòng 1 (sao-luu.mjs chỉ có trên nhánh);
//   3. FILL của nhánh = FILL của origin/main (lệnh sao lưu trước gộp nạp FILL của nhánh, phải phủ đúng các bảng main đang tráo).
// Rồi đột biến: README đặt lại lệnh sao lưu vòng 1 (cd checkout chính, trước gộp) và FILL lệch một bảng — cả hai phải đỏ.
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { homedir } from "node:os";
import path from "node:path";

const ROOT = process.cwd();
const HO_SO = "_acceptance/sync-cloud-che-ten-nguon-moi-cot/ap-may-thu";
const git = (...a) => execFileSync("git", a, { cwd: ROOT, encoding: "utf8" });
const MAIN_ROOT = git("worktree", "list", "--porcelain").match(/^worktree (.*)$/m)[1];
const coTren = (ref, rel) => {
  try {
    execFileSync("git", ["cat-file", "-e", `${ref}:${rel}`], { cwd: ROOT, stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
};
const MUC = ["## 1. Lệnh áp", "## 2. Số chạy khô", "## 3. Sao lưu trước", "## 4. Cách lùi", "## 5. Lệnh kiểm sau"];

/** Lệnh `cd D && node X` của README, kèm mục và nhãn khối gần nhất. */
export function lenhNode(readme) {
  const out = [];
  let muc = 0;
  let nhan = "";
  let trongKhoi = false;
  for (const l of readme.split("\n")) {
    const m = l.match(/^## (\d)\./);
    if (m) (muc = Number(m[1])), (nhan = "");
    const b = l.match(/^\*\*(Trước gộp|Sau gộp)\*\*/);
    if (b) nhan = b[1];
    if (/^```/.test(l)) {
      trongKhoi = !trongKhoi;
      continue;
    }
    if (!trongKhoi) continue;
    const c = l.match(/^cd (\S+) && node (\S+)/);
    if (c) out.push({ muc, nhan, cd: c[1], tep: c[2] });
  }
  return out;
}

const moRong = (p) => p.replace(/^~(?=\/|$)/, homedir());

/** Phán; trả lý do đỏ. `fillNhanh`, `fillMain`: mảng tên bảng. */
export function phanXet(readme, { fillNhanh, fillMain, root = ROOT, mainRoot = MAIN_ROOT, coTrenNhanh, coTrenMain }) {
  const ly = [];
  for (const h of MUC) if (!readme.includes(h)) ly.push(`README thiếu mục «${h.slice(3)}»`);
  const lenh = lenhNode(readme);
  if (!lenh.some((x) => x.muc === 3 && x.nhan === "Trước gộp")) ly.push("mục 3 không có lệnh sao lưu «Trước gộp»");
  for (const x of lenh) {
    const d = path.resolve(moRong(x.cd));
    const tuyet = path.resolve(d, x.tep);
    const goc = tuyet.startsWith(root + path.sep) ? root : tuyet.startsWith(mainRoot + path.sep) ? mainRoot : null;
    if (!goc) {
      ly.push(`mục ${x.muc}: ${x.tep} nằm ngoài kho`);
      continue;
    }
    const rel = path.relative(goc, tuyet);
    if (!coTrenNhanh(rel)) ly.push(`mục ${x.muc}: ${rel} không có trên nhánh`);
    const truocGop = x.muc <= 3 && x.nhan !== "Sau gộp";
    if (truocGop && goc === mainRoot && !coTrenMain(rel)) ly.push(`mục ${x.muc}: lệnh trước gộp đứng ở checkout chính mà ${rel} chưa có trên origin/main`);
  }
  if (JSON.stringify(fillNhanh) !== JSON.stringify(fillMain)) ly.push(`FILL của nhánh khác origin/main: ${fillNhanh.length} và ${fillMain.length} bảng`);
  return ly;
}

const docFill = (text) => [...text.match(/export const FILL = \[([\s\S]*?)\];/)[1].matchAll(/"([a-z0-9_]+)"/g)].map((m) => m[1]);

const isMain = process.argv[1] && path.resolve(process.argv[1]) === path.resolve(ROOT, HO_SO, "kiem-ho-so.mjs");
if (isMain) {
  const readme = readFileSync(path.join(ROOT, HO_SO, "README.md"), "utf8");
  const vao = {
    fillNhanh: docFill(readFileSync(path.join(ROOT, "pipeline/sync-cloud.mjs"), "utf8")),
    fillMain: docFill(git("show", "origin/main:pipeline/sync-cloud.mjs")),
    coTrenNhanh: (rel) => coTren("HEAD", rel),
    coTrenMain: (rel) => coTren("origin/main", rel),
  };
  const ly = phanXet(readme, vao);
  const lenh = lenhNode(readme);
  for (const x of lenh) console.log(`  mục ${x.muc}${x.nhan ? ` · ${x.nhan}` : ""}: cd ${x.cd} && node ${x.tep}`);
  console.log(`  FILL nhánh ${vao.fillNhanh.length} bảng · origin/main ${vao.fillMain.length} bảng`);
  for (const l of ly) console.log(`ĐỎ: ${l}`);
  // Đột biến: lệnh sao lưu vòng 1 (đứng ở checkout chính, trước gộp) và FILL lệch.
  const vong1 = readme.replace(/cd ~\/dev\/onehub-invest\/\.claude\/worktrees\/sync-cloud-che-ten\/pipeline && node \.\.\/_acceptance/, "cd ~/dev/onehub-invest/pipeline && node ../_acceptance");
  const khongDo = [];
  if (vong1 === readme || !phanXet(vong1, vao).some((l) => /chưa có trên origin\/main/.test(l))) khongDo.push("lệnh sao lưu vòng 1");
  if (!phanXet(readme, { ...vao, fillNhanh: vao.fillNhanh.slice(1) }).some((l) => /FILL/.test(l))) khongDo.push("FILL lệch");
  if (!phanXet(readme.replace("## 4. Cách lùi", "## 4. Lùi"), vao).some((l) => /thiếu mục/.test(l))) khongDo.push("thiếu mục cách lùi");
  if (ly.length) {
    console.log(`kiem-ho-so: ĐỎ — ${ly.length} chỗ hồ sơ áp không chạy được nguyên văn`);
    process.exitCode = 1;
  } else if (khongDo.length) {
    console.log(`kiem-ho-so: THƯỚC KHÔNG PHÂN BIỆT — ${khongDo.join("; ")}`);
    process.exitCode = 3;
  } else {
    console.log(`kiem-ho-so: XANH — ${lenh.length} lệnh chạy được theo đúng chỗ đứng; 3 đột biến đều đỏ`);
  }
}
