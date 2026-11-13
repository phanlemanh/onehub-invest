#!/usr/bin/env node
// itest-nap-lai-migration-cu-sau-095 AC-8 (tĩnh): ca TDT-AC-4 của DA2 áp 096 qua pg.Client (không docker exec) và
// scripts/ci-bo-qua.json không còn mục bỏ qua nó. Tự kiểm: bản chép danh sách có mục ấy → kiểm FAIL gọi tên mục.
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const TEP = "pipeline/scripts/truong-du-an-tren-tin.test.mjs";
const CA = "TDT-AC-4";

export function kiemBoQua(dsBoQua) {
  return Object.values(dsBoQua).flat().filter((m) => m.tep === TEP && m.ca.startsWith(CA)).map((m) => `${m.tep} · ${m.ca}`);
}

const loi = [];
const src = readFileSync(path.join(ROOT, TEP), "utf8");
const than = src.slice(src.indexOf(`test("${CA}`), src.indexOf("\n});", src.indexOf(`test("${CA}`)));
if (!than.includes("readFileSync(MIG")) loi.push(`${CA} không đọc tệp 096 để query`);
if (/\bapTep\b|docker/.test(src.replace(/\/\/.*$/gm, ""))) loi.push(`${TEP} còn gọi apTep/docker ngoài chú thích`);
const ds = JSON.parse(readFileSync(path.join(ROOT, "scripts/ci-bo-qua.json"), "utf8"));
for (const m of kiemBoQua(ds)) loi.push(`ci-bo-qua còn mục ${m}`);
// tự kiểm hai chiều
const tuKiem = kiemBoQua({ app: [], pipeline: [{ tep: TEP, ca: `${CA} áp 096 lần hai`, ly_do: "x" }] });
if (tuKiem.length !== 1) loi.push("tự kiểm: bản chép có mục TDT-AC-4 mà kiểm không bắt");
for (const l of loi) console.log(`FAIL ${l}`);
console.log(loi.length ? "ITNL-TDT FAIL" : "ITNL-TDT PASS");
process.exit(loi.length ? 1 : 0);
